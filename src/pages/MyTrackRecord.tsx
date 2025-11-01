import { useEffect, useState } from "react";
import { auth, db } from "../firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";
import type { Prediction } from "../api";

export default function MyTrackRecord() {
  const [uid, setUid] = useState<string>();
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? undefined);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, "predictions"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPredictions(
        snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Prediction, "id">),
        }))
      );
    });

    return () => unsubscribe();
  }, [uid]);

  const active = predictions.filter((p) => p.status === "active");
  const won = predictions.filter((p) => p.status === "won");
  const lost = predictions.filter((p) => p.status === "lost");
  const winRate = won.length + lost.length > 0
    ? Math.round((won.length / (won.length + lost.length)) * 100)
    : 0;

  if (!uid) {
    return (
      <main style={{ padding: 24 }}>
        <p>Please sign in...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Link to="/" className="btn btn-secondary">← Back to Projects</Link>
      </div>

      <h1>My Track Record</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <div style={{ padding: 16, backgroundColor: "#1a1a1a", borderRadius: 8, border: "1px solid #333" }}>
          <div style={{ fontSize: "0.9em", color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Total</div>
          <div style={{ fontSize: "2em", fontWeight: "bold" }}>{predictions.length}</div>
        </div>
        <div style={{ padding: 16, backgroundColor: "#1a1a1a", borderRadius: 8, border: "1px solid #333" }}>
          <div style={{ fontSize: "0.9em", color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Active</div>
          <div style={{ fontSize: "2em", fontWeight: "bold" }}>{active.length}</div>
        </div>
        <div style={{ padding: 16, backgroundColor: "#1a1a1a", borderRadius: 8, border: "1px solid #333" }}>
          <div style={{ fontSize: "0.9em", color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Won</div>
          <div style={{ fontSize: "2em", fontWeight: "bold", color: "#22c55e" }}>{won.length}</div>
        </div>
        <div style={{ padding: 16, backgroundColor: "#1a1a1a", borderRadius: 8, border: "1px solid #333" }}>
          <div style={{ fontSize: "0.9em", color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Win Rate</div>
          <div style={{ fontSize: "2em", fontWeight: "bold" }}>{winRate}%</div>
        </div>
      </div>

      {predictions.length === 0 ? (
        <div className="empty-state">
          <p>No predictions yet. <Link to="/predict">Make your first prediction!</Link></p>
        </div>
      ) : (
        <div>
          {predictions.map((p) => {
            const directionSymbol = p.direction === "up" ? "↑" : p.direction === "down" ? "↓" : "↗";
            const statusSymbol = p.status === "won" ? "✅" : p.status === "lost" ? "❌" : "⏳";
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                  <div>
                    <Link to={`/asset/${p.asset}`} style={{ color: "inherit", textDecoration: "none" }}>
                      <strong>{p.asset}</strong>
                    </Link>
                    <span style={{ margin: "0 8px" }}>{directionSymbol}</span>
                    <span style={{ fontSize: "0.9em", color: "rgba(255,255,255,0.7)" }}>
                      {p.horizon}
                    </span>
                    {p.compareSymbol && (
                      <span style={{ fontSize: "0.9em", color: "rgba(255,255,255,0.7)", marginLeft: 8 }}>
                        vs {p.compareSymbol}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "1.2em" }}>{statusSymbol}</span>
                </div>
                <div style={{ fontSize: "0.9em", color: "rgba(255,255,255,0.7)" }}>
                  Start: ${p.startPrice.toFixed(2)}
                  {p.endPrice && (
                    <>
                      {" • "}End: ${p.endPrice.toFixed(2)}
                      {" • "}
                      <span style={{ color: priceChange && priceChange > 0 ? "#22c55e" : "#ef4444" }}>
                        {priceChange && priceChange > 0 ? "+" : ""}{priceChange?.toFixed(2)}%
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

