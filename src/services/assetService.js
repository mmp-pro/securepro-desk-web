// src/services/assetService.js
import { collection, addDoc, getDocs, query, orderBy, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const ASSETS_COLLECTION = "activos";

export const createAsset = async (assetData) => {
  const docRef = await addDoc(collection(db, ASSETS_COLLECTION), {
    ...assetData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  return { id: docRef.id, ...assetData };
};

export const getAssets = async () => {
  const q = query(collection(db, ASSETS_COLLECTION), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateAsset = async (id, updatedData) => {
  const assetRef = doc(db, ASSETS_COLLECTION, id);
  await updateDoc(assetRef, { ...updatedData, updatedAt: new Date().toISOString() });
};

export const deleteAsset = async (id) => {
  await deleteDoc(doc(db, ASSETS_COLLECTION, id));
};