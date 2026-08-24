import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDkjx4P9echigFkPwgbrvXMG7uYjFlbCHg",
  authDomain: "tumbuh-sehat.firebaseapp.com",
  projectId: "tumbuh-sehat",
  storageBucket: "tumbuh-sehat.firebasestorage.app",
  messagingSenderId: "79655128399",
  appId: "1:79655128399:web:db04a6f20e6cb9e87b893a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
