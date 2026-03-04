import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD5BpItUOsW0T-_f-8XP1dxFPnl9Zr0dIc",
  authDomain: "hollywood-dashboard.firebaseapp.com",
  projectId: "hollywood-dashboard",
  storageBucket: "hollywood-dashboard.firebasestorage.app",
  messagingSenderId: "9823521993",
  appId: "1:9823521993:web:05f1894895c4acadf4d118"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
