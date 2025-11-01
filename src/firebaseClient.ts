import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDpdSHJywdMYGFewH4jqZ1gSo46MMELMF8",
  authDomain: "dekr-pm.firebaseapp.com",
  projectId: "dekr-pm",
  storageBucket: "dekr-pm.appspot.com", // fixed
  messagingSenderId: "19432013623",
  appId: "1:19432013623:web:eb865c865f998e1f5324b2",
  measurementId: "G-70035EP0D4",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export let analytics: ReturnType<typeof getAnalytics> | undefined;
if (typeof window !== "undefined") {
  isSupported().then((ok) => { if (ok) analytics = getAnalytics(app); });
}

// App Check (only in production and if key is provided)
if (import.meta.env.PROD && import.meta.env.VITE_RECAPTCHA_ENTERPRISE_KEY) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_RECAPTCHA_ENTERPRISE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}

// Uncomment below to use Firebase emulators when running `firebase emulators:start`
// if (import.meta.env.DEV) {
//   connectAuthEmulator(auth, "http://localhost:9099");
//   connectFirestoreEmulator(db, "localhost", 8080);
//   connectStorageEmulator(storage, "localhost", 9199);
//   connectFunctionsEmulator(functions, "localhost", 5001);
// }

