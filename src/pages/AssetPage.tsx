import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebaseClient";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import type { Prediction } from "../api";

export default function AssetPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [consensus, setConsensus] = useState<{
    up: number;
    down: number;
    outperform: number;
    avgConfidence: number;
  } | null>(null);
  const [points, setPoints] = useState<number[]>([]);

  useEffect(() => {
    if (!symbol) return;

    // Get all active predictions for this asset
    const q = query(
      collection(db, "predictions"),
      where("asset", "==", symbol.toUpperCase()),
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const preds = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Prediction, "id">),
      }));
      setPredictions(preds);

      // Calculate consensus
      const up = preds.filter((p) => p.direction === "up").length;
      const down = preds.filter((p) => p.direction === "down").length;
      const outperform = preds.filter((p) => p.direction === "outperform").length;
      const avgConfidence =
        preds.length > 0
          ? preds.reduce((sum, p) => sum + (p.confidence || 3), 0) / preds.length
          : 0;

      setConsensus({
        up,
        down,
        outperform,
        avgConfidence: Math.round(avgConfidence * 10) / 10,
      });
    });

    return () => unsubscribe();
  }, [symbol]);

  // Load price snapshots for sparkline
  useEffect(() => {
    if (!symbol) return;

    const snapshotsQuery = query(
      collection(db, "asset_snapshots"),
      where("asset", "==", symbol.toUpperCase()),
      orderBy("ts", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(snapshotsQuery, (snapshot) => {
      const arr = snapshot.docs.map((d) => d.data().price as number).reverse();
      setPoints(arr);
    });

    return () => unsubscribe();
  }, [symbol]);

  if (!symbol) {
    return (
      <main style={{ padding: 24 }}>
        <p>Asset symbol required</p>
      </main>
    );
  }

  const activePredictions = predictions.filter((p) => p.status === "active");
  const resolvedPredictions = predictions.filter((p) => p.status !== "active");

  return (
    <main style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Link to="/" className="btn btn-secondary">← Back to Projects</Link>
      </div>

      <h1>{symbol.toUpperCase()} Predictions</h1>

      {consensus && activePredictions.length > 0 && (
        <div
          style={{
            padding: 20,
            marginBottom: 24,
            backgroundColor: "#1a1a1a",
            borderRadius: 12,
            border: "1px solid #333",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Consensus</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            <div>
              <div style={{ fontSize: "0.9em", color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>Up</div>
              <div style={{ fontSize: "1.5em", fontWeight: "bold", color: "#22c55e" }}>{consensus.up}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.9em", color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>Down</div>
              <div style={{ fontSize: "1.5em", fontWeight: "bold", color: "#ef4444" }}>{consensus.down}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.9em", color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>Outperform</div>
              <div style={{ fontSize: "1.5em", fontWeight: "bold", color: "#6366f1" }}>{consensus.outperform}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.9em", color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>Avg Confidence</div>
              <div style={{ fontSize: "1.5em", fontWeight: "bold" }}>{consensus.avgConfidence}</div>
            </div>
          </div>
        </div>
      )}

      {points.length > 1 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 12 }}>Price History</h3>
          <svg
            width="280"
            height="60"
            style={{
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: 8,
              padding: 8,
            }}
          >
            {(() => {
              const min = Math.min(...points);
              const max = Math.max(...points);
              const norm = (v: number) =>
                max === min ? 30 : 60 - ((v - min) / (max - min)) * 60;
              const step = 280 / (points.length - 1);
              const d = points.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${norm(v)}`).join(" ");
              return (
                <path
                  d={d}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })()}
          </svg>
        </div>
      )}

      {activePredictions.length === 0 && resolvedPredictions.length === 0 ? (
        <div className="empty-state">
          <p>No predictions for {symbol.toUpperCase()} yet.</p>
        </div>
      ) : (
        <div>
          {activePredictions.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h2>Active Predictions ({activePredictions.length})</h2>
              {activePredictions.map((p) => {
                const directionSymbol = p.direction === "up" ? "↑" : p.direction === "down" ? "↓" : "↗";
                return (
                  <div
                    key={p.id}
                    style={{
                      padding: 16,
                      marginBottom: 12,
                      backgroundColor: "#1a1a1a",
                      borderRadius: 8,
                      border: "1px solid #333",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div>
                        <strong>{directionSymbol}</strong> {p.horizon}
                        {p.compareSymbol && <span> vs {p.compareSymbol}</span>}
                      </div>
                      <span style={{ fontSize: "0.9em", color: "rgba(255,255,255,0.7)" }}>
                        Confidence: {p.confidence}/5
                      </span>
                    </div>
                    <div style={{ fontSize: "0.9em", color: "rgba(255,255,255,0.7)", marginTop: 8 }}>
                      Start: ${p.startPrice.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {resolvedPredictions.length > 0 && (
            <div>
              <h2>Resolved Predictions</h2>
              {resolvedPredictions.map((p) => {
                const directionSymbol = p.direction === "up" ? "↑" : p.direction === "down" ? "↓" : "↗";
                const statusSymbol = p.status === "won" ? "✅" : "❌";
                const priceChange = p.endPrice
                  ? ((p.endPrice - p.startPrice) / p.startPrice) * 100
                  : null;

                return (
                  <div
                    key={p.id}
                    style={{
                      padding: 16,
                      marginBottom: 12,
                      backgroundColor: "#1a1a1a",
                      borderRadius: 8,
                      border: "1px solid #333",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div>
                        <strong>{directionSymbol}</strong> {p.horizon} {statusSymbol}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.9em", color: "rgba(255,255,255,0.7)", marginTop: 8 }}>
                      ${p.startPrice.toFixed(2)} → ${p.endPrice?.toFixed(2)}
                      {priceChange && (
                        <span style={{ color: priceChange > 0 ? "#22c55e" : "#ef4444", marginLeft: 8 }}>
                          ({priceChange > 0 ? "+" : ""}{priceChange.toFixed(2)}%)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

