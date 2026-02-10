import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getStorage, type FirebaseStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
}

let app: FirebaseApp | null = null
let firestore: Firestore | null = null
let storage: FirebaseStorage | null = null

const hasAllConfig = Object.values(firebaseConfig).every(Boolean)

if (hasAllConfig) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig)
    firestore = getFirestore(app)
    storage = getStorage(app)
  } catch (err) {
    if (typeof window !== "undefined") {
      console.warn(
        "[firebase-client] Failed to initialize Firebase, falling back to IndexedDB.",
        err
      )
    }
    app = null
    firestore = null
    storage = null
  }
} else {
  if (typeof window !== "undefined") {
    console.warn(
      "[firebase-client] Firebase config is missing, using local browser storage only."
    )
  }
}

export { app, firestore, storage }
export const USE_FIREBASE = Boolean(firestore && storage)

