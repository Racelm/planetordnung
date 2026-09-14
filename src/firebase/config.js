import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD1zqARVE6BvsdvKY14Sdnrsbl09Pq6gtE",
  authDomain: "planetordnung.firebaseapp.com",
  projectId: "planetordnung",
  storageBucket: "planetordnung.firebasestorage.app",
  messagingSenderId: "26748234621",
  appId: "1:26748234621:web:a65c90b5807f6fa70afa14"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
