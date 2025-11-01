import { httpsCallable } from "firebase/functions";
import { functions } from "./firebaseClient";

export interface PredictionInput {
  asset: string;
  direction: "up" | "down" | "outperform";
  horizon: "24h" | "7d" | "30d";
  targetLow?: number | null;
  targetHigh?: number | null;
  confidence?: number;
  compareSymbol?: string | null;
}

export interface Prediction {
  id: string;
  userId: string;
  asset: string;
  direction: "up" | "down" | "outperform";
  horizon: "24h" | "7d" | "30d";
  startPrice: number;
  startCmpPrice?: number | null;
  compareSymbol?: string | null;
  createdAt: any;
  expiresAt: any;
  targetLow?: number | null;
  targetHigh?: number | null;
  confidence: number;
  status: "active" | "won" | "lost";
  endPrice?: number;
  resolvedAt?: any;
}

const createPredictionFn = httpsCallable<PredictionInput, Prediction>(functions, "createPrediction");

export async function createPrediction(input: PredictionInput): Promise<Prediction> {
  try {
    const result = await createPredictionFn(input);
    return result.data;
  } catch (error) {
    console.error("Error creating prediction:", error);
    throw error;
  }
}

