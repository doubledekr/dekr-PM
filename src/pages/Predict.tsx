import { useState, useEffect } from "react";
import { auth } from "../firebaseClient";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { createPrediction, type PredictionInput } from "../api";
import { Link } from "react-router-dom";

export default function Predict() {
  const [uid, setUid] = useState<string>();
  const [asset, setAsset] = useState("");
  const [direction, setDirection] = useState<"up" | "down" | "outperform">("up");
  const [horizon, setHorizon] = useState<"24h" | "7d" | "30d">("24h");
  const [targetLow, setTargetLow] = useState<string>("");
  const [targetHigh, setTargetHigh] = useState<string>("");
  const [confidence, setConfidence] = useState(3);
  const [compareSymbol, setCompareSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? undefined);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !asset.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const input: PredictionInput = {
        asset: asset.trim().toUpperCase(),
        direction,
        horizon,
        targetLow: targetLow ? parseFloat(targetLow) : null,
        targetHigh: targetHigh ? parseFloat(targetHigh) : null,
        confidence,
        compareSymbol: direction === "outperform" && compareSymbol ? compareSymbol.trim().toUpperCase() : null,
      };

      const prediction = await createPrediction(input);
      setSuccess(`Prediction created! Start price: $${prediction.startPrice.toFixed(2)}`);
      // Reset form
      setAsset("");
      setTargetLow("");
      setTargetHigh("");
      setCompareSymbol("");
    } catch (err: any) {
      setError(err.message || "Failed to create prediction");
    } finally {
      setLoading(false);
    }
  };

  if (!uid) {
    return (
      <main style={{ padding: 24 }}>
        <p>Signing in...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Link to="/" className="btn btn-secondary">← Back to Projects</Link>
      </div>
      <h1>Make a Prediction</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
        <div className="form-group">
          <label htmlFor="asset">Asset Symbol *</label>
          <input
            id="asset"
            type="text"
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            placeholder="e.g., AAPL, BTC, ETH"
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label htmlFor="direction">Direction *</label>
          <select
            id="direction"
            value={direction}
            onChange={(e) => setDirection(e.target.value as "up" | "down" | "outperform")}
            required
          >
            <option value="up">Up</option>
            <option value="down">Down</option>
            <option value="outperform">Outperform</option>
          </select>
        </div>

        {direction === "outperform" && (
          <div className="form-group">
            <label htmlFor="compareSymbol">Compare Against *</label>
            <input
              id="compareSymbol"
              type="text"
              value={compareSymbol}
              onChange={(e) => setCompareSymbol(e.target.value)}
              placeholder="e.g., SPY, BTC"
              required
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="horizon">Time Horizon *</label>
          <select
            id="horizon"
            value={horizon}
            onChange={(e) => setHorizon(e.target.value as "24h" | "7d" | "30d")}
            required
          >
            <option value="24h">24 Hours</option>
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="form-group">
            <label htmlFor="targetLow">Target Low (optional)</label>
            <input
              id="targetLow"
              type="number"
              step="0.01"
              value={targetLow}
              onChange={(e) => setTargetLow(e.target.value)}
              placeholder="Minimum price"
            />
          </div>
          <div className="form-group">
            <label htmlFor="targetHigh">Target High (optional)</label>
            <input
              id="targetHigh"
              type="number"
              step="0.01"
              value={targetHigh}
              onChange={(e) => setTargetHigh(e.target.value)}
              placeholder="Maximum price"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confidence">Confidence (1-5)</label>
          <input
            id="confidence"
            type="number"
            min="1"
            max="5"
            value={confidence}
            onChange={(e) => setConfidence(parseInt(e.target.value) || 3)}
          />
        </div>

        {error && (
          <div style={{ color: "#ef4444", marginBottom: 16 }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ color: "#22c55e", marginBottom: 16 }}>
            {success}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Prediction"}
        </button>
      </form>
    </main>
  );
}

