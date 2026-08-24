import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyDkjx4P9echigFkPwgbrvXMG7uYjFlbCHg",
  authDomain: "tumbuh-sehat.firebaseapp.com",
  projectId: "tumbuh-sehat",
  storageBucket: "tumbuh-sehat.firebasestorage.app",
  messagingSenderId: "79655128399",
  appId: "1:79655128399:web:db04a6f20e6cb9e87b893a"
};

// Initialize Firebase safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth properly for React Native
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (error) {
    auth = getAuth(app); // fallback if already initialized
  }
}

export { auth };
export const db = getFirestore(app);
