// Firebase 초기화 파일
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCYOZyLtXGv7jW0N5gnoqUp0BhVIyLheZo",
  authDomain: "once-bc90f.firebaseapp.com",
  projectId: "once-bc90f",
  storageBucket: "once-bc90f.firebasestorage.app",
  messagingSenderId: "848095193010",
  appId: "1:848095193010:web:862304cb5a2dd9962526ab",
  measurementId: "G-EGR4BHXQCN",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
