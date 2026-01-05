// src/firebase/config.js
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence
} from "firebase/auth";

import { getStorage } from "firebase/storage"; // ← ajouté

/* ============================
   🔹 CONFIG FIREBASE
============================ */
const firebaseConfig = {
  apiKey: "AIzaSyCdjziU9drbeB1KEKeFOXwsv1tiWo2VnKA",
  authDomain: "alkahf-41600.firebaseapp.com",
  projectId: "alkahf-41600",
  storageBucket: "alkahf-41600.appspot.com", // ← corrigé format correct
  messagingSenderId: "826972253416",
  appId: "1:826972253416:web:cee52b5da70a46f7c46d5d"
};

/* ============================
   🔹 INIT
============================ */
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app); // ← export Storage

/* ============================
   🔐 AUTH PERSISTENCE (IMPORTANT)
============================ */
setPersistence(auth, browserSessionPersistence);

/* ============================
   🔹 FIRESTORE
============================ */
export const booksCollection = collection(db, "books");

export async function getAllBooks() {
  const snapshot = await getDocs(booksCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getBooksByCategory(category) {
  const q = query(booksCollection, where("category", "==", category));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function searchBooks(keyword) {
  const snapshot = await getDocs(booksCollection);
  const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return all.filter(b =>
    b.title.toLowerCase().includes(keyword.toLowerCase())
  );
}

export async function getFeaturedBooks() {
  const q = query(booksCollection, where("featured", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
/* ============================
   🔹 AUTH FUNCTIONS
============================ */
export const loginAdmin = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const logoutAdmin = () => signOut(auth);

export const onAuthState = (callback) =>
  onAuthStateChanged(auth, callback);
