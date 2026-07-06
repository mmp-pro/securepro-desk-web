// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBHm90-2Reaf63KxNMy8HKJ9qm-L_T3onc",
  authDomain: "pro-desk-web-5114d.firebaseapp.com",
  projectId: "pro-desk-web-5114d",
  storageBucket: "pro-desk-web-5114d.firebasestorage.app",
  messagingSenderId: "55111803088",
  appId: "1:55111803088:web:0195ebeebdc85e97de3ed5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ️ ESTAS DOS LÍNEAS SON OBLIGATORIAS (son las que te faltaban)
export const auth = getAuth(app);
export const db = getFirestore(app);