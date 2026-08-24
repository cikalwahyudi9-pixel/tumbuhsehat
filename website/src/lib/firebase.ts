import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDkjx4P9echigFkPwgbrvXMG7uYjFlbCHg",
  authDomain: "tumbuh-sehat.firebaseapp.com",
  projectId: "tumbuh-sehat",
  storageBucket: "tumbuh-sehat.firebasestorage.app",
  messagingSenderId: "79655128399",
  appId: "1:79655128399:web:db04a6f20e6cb9e87b893a"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
