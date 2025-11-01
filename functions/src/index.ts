import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { fetch } from 'undici';

admin.initializeApp();

const db = admin.firestore();

/** ---- Twelve Data helpers ----
 * Equities: "AAPL"
 * Crypto:   "BTC/USD" (use slash)
 */

function normalizeSymbol(symbol: string): string {
  const s = symbol.toUpperCase().trim();
  // Heuristic: if it looks like a major crypto, map to USD pair
  if (/^(BTC|ETH|SOL|DOGE|ADA|XRP|AVAX|MATIC|LTC|BNB|LINK|DOT)$/.test(s)) {
    return `${s}/USD`;
  }
  return s;
}

async function getTDKey(): Promise<string> {
  // Access secret via environment variable (Firebase Functions v1 style)
  const key = process.env.TWELVEDATA_API_KEY;
  if (!key) throw new Error('Missing TWELVEDATA_API_KEY');
  return key;
}

/** Spot/last price (good for 24h horizon and start price capture) */
export async function tdFetchSpot(symbolRaw: string): Promise<number> {
  const symbol = normalizeSymbol(symbolRaw);
  const key = await getTDKey();
  const url = new URL('https://api.twelvedata.com/price');
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('apikey', key);

  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`TwelveData spot ${symbol} ${r.status}`);
  const j: any = await r.json();
  if (j.status === 'error') throw new Error(`TD error: ${j.message}`);
  const price = Number(j.price);
  if (!Number.isFinite(price)) throw new Error(`No price for ${symbol}`);
  return price;
}

/** Adjusted daily close for a given YYYY-MM-DD (used for 7d/30d grading) */
export async function tdFetchCloseOn(symbolRaw: string, isoDate: string): Promise<number> {
  const symbol = normalizeSymbol(symbolRaw);
  const key = await getTDKey();
  const url = new URL('https://api.twelvedata.com/time_series');
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('interval', '1day');
  url.searchParams.set('start_date', isoDate);
  url.searchParams.set('end_date', isoDate);
  url.searchParams.set('order', 'ASC');
  url.searchParams.set('outputsize', '1');
  url.searchParams.set('apikey', key);

  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`TwelveData close ${symbol} ${isoDate} ${r.status}`);
  const j: any = await r.json();
  if (j.status === 'error') throw new Error(`TD error: ${j.message}`);
  const v = j?.values?.[0]?.close;
  if (v) return Number(v);

  // If market holiday / no bar: fallback to previous calendar day
  const d = new Date(isoDate + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  const prev = d.toISOString().slice(0, 10);
  return tdFetchCloseOn(symbolRaw, prev);
}

/** Horizon helpers */
function horizonToMs(h: string): number {
  return h === '24h' ? 24 * 3600 * 1000 : h === '7d' ? 7 * 24 * 3600 * 1000 : 30 * 24 * 3600 * 1000;
}

function gradeDirection(direction: 'up' | 'down', start: number, end: number): boolean {
  return direction === 'up' ? end > start : end < start;
}

/** Create prediction - record a start price with Twelve Data */
export const createPrediction = functions.region('us-central1').runWith({
  secrets: ['TWELVEDATA_API_KEY'],
}).https.onCall(async (data: any, ctx: functions.https.CallableContext) => {
  if (!ctx.auth?.uid) throw new functions.https.HttpsError('unauthenticated', 'Login required');

  const { asset, direction, horizon, targetLow = null, targetHigh = null, confidence = 3, compareSymbol = null } = data || {};

  if (!asset || !['up', 'down', 'outperform'].includes(direction) || !['24h', '7d', '30d'].includes(horizon)) {
    throw new functions.https.HttpsError('invalid-argument', 'Bad inputs');
  }

  const startPrice = await tdFetchSpot(asset);
  const now = admin.firestore.Timestamp.now();
  const expiresAt = admin.firestore.Timestamp.fromMillis(now.toMillis() + horizonToMs(horizon));

  // If outperform, fetch comparison symbol price
  let startCmpPrice: number | null = null;
  if (direction === 'outperform' && compareSymbol) {
    startCmpPrice = await tdFetchSpot(compareSymbol);
  }

  const doc = {
    userId: ctx.auth.uid,
    asset: asset.toUpperCase(),
    direction,
    compareSymbol: compareSymbol ? String(compareSymbol).toUpperCase() : null,
    horizon,
    startPrice,
    startCmpPrice,
    createdAt: now,
    expiresAt,
    targetLow,
    targetHigh,
    confidence,
    status: 'active' as const,
  };

  const ref = await db.collection('predictions').add(doc);
  return { id: ref.id, ...doc };
});

/** Grade due predictions - use close for 7d/30d; spot for 24h; supports outperform */
export const gradeDue = functions.region('us-central1').runWith({
  secrets: ['TWELVEDATA_API_KEY'],
}).pubsub
  .schedule('every 10 minutes').onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const snap = await db.collection('predictions')
      .where('status', '==', 'active')
      .where('expiresAt', '<=', now)
      .limit(200).get();

    const batch = db.batch();

    for (const doc of snap.docs) {
      const p = doc.data() as any;

      let endPrice: number;
      if (p.horizon === '24h') {
        endPrice = await tdFetchSpot(p.asset);
      } else {
        const ymd = new Date(p.expiresAt.toDate()).toISOString().slice(0, 10);
        endPrice = await tdFetchCloseOn(p.asset, ymd);
      }

      let won = false;
      if (p.direction === 'outperform' && p.compareSymbol) {
        const startCmp = p.startCmpPrice ?? await tdFetchSpot(p.compareSymbol);
        const endCmp = (p.horizon === '24h')
          ? await tdFetchSpot(p.compareSymbol)
          : await tdFetchCloseOn(p.compareSymbol, new Date(p.expiresAt.toDate()).toISOString().slice(0, 10));

        const relStart = p.startPrice / startCmp;
        const relEnd = endPrice / endCmp;
        won = relEnd > relStart;

        if (!p.startCmpPrice) {
          batch.update(doc.ref, { startCmpPrice: startCmp });
        }
      } else {
        won = gradeDirection(p.direction, p.startPrice, endPrice);
      }

      batch.update(doc.ref, { status: won ? 'won' : 'lost', endPrice, resolvedAt: now });

      // (Optional) cache snapshot for charts
      batch.create(db.collection('asset_snapshots').doc(), {
        asset: p.asset,
        price: endPrice,
        ts: now,
      });
    }

    await batch.commit();
  });

