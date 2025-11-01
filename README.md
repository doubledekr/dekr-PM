# Dekr Firebase Web App

A clean React + TypeScript + Vite project with Firebase integration for the Dekr project manager.

## ✅ Setup Complete

The project has been scaffolded with:
- ✅ Vite + React + TypeScript
- ✅ Firebase SDK (Auth, Firestore, Storage, Functions, Analytics)
- ✅ Firebase client configuration (`src/firebaseClient.ts`)
- ✅ Smoke test app (`src/App.tsx`)

## 🚀 Running the App

```bash
npm run dev
```

Open the URL shown (usually http://localhost:5173) to see the smoke test in action.

## 🔥 Firebase Console Configuration

Before the app can work, configure these in the Firebase Console (project: `dekr-pm`):

### 1. Authentication
- **Sign-in method**: Enable **Anonymous** (and/or Email/Password)
- **Authorized domains**: Add `localhost` and `127.0.0.1`

### 2. Firestore Database
- **Create database** (Production mode) and **Publish rules**

### 3. Storage
- **Enable** Storage and **Publish rules**

## 🧪 Testing

The smoke test app will:
1. Sign in anonymously
2. Create/update a user document in Firestore
3. Display your UID and live data
4. Allow you to "ping" Firestore to see real-time updates

## 🛠️ Optional: Local Development with Emulators

If you want to develop offline without hitting the real Firebase:

### Install Firebase CLI
```bash
npm i -g firebase-tools
firebase login
```

### Initialize Emulators
```bash
firebase init emulators    # choose Auth, Firestore, Storage, Functions, UI
```

### Enable Emulator Mode

Uncomment the emulator connection code at the bottom of `src/firebaseClient.ts`:

```typescript
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
  connectStorageEmulator(storage, "localhost", 9199);
  connectFunctionsEmulator(functions, "localhost", 5001);
}
```

### Run Emulators + Dev Server
In two terminals:
```bash
# Terminal 1
firebase emulators:start

# Terminal 2
npm run dev
```

## 📦 Deployment

When ready to deploy:

```bash
npm run build
firebase init hosting   # pick project dekr-pm, set public dir to dist, SPA rewrite = yes
firebase deploy --only hosting
```

## 🔐 Security Notes

- Currently using inlined Firebase config for simplicity
- For production, consider moving config to environment variables
- Set up proper Firestore/Storage security rules
- Consider enabling App Check for additional security

## 📁 Project Structure

```
dekr-web/
├── src/
│   ├── firebaseClient.ts  # Firebase configuration & exports
│   ├── App.tsx            # Main app component
│   └── ...
├── public/
├── package.json
└── README.md
```

## 🎯 Next Steps

- Add App Check for production security
- Set up Firestore/Storage security rules
- Build out the Dekr UI and features
- Consider setting up Firebase Functions for backend logic
