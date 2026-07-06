// src/services/assetService.js
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore";
import { db } from "../firebase/config";

const ASSETS_COLLECTION = "activos";

// Crear nuevo activo
export const createAsset = async (assetData) => {
  const docRef = await addDoc(collection(db, ASSETS_COLLECTION), {
    ...assetData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  return { id: docRef.id, ...assetData };
};

// Obtener todos los activos ordenados por fecha
export const getAssets = async () => {
  const q = query(
    collection(db, ASSETS_COLLECTION), 
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  }));
};

// Actualizar activo existente
export const updateAsset = async (id, updatedData) => {
  const assetRef = doc(db, ASSETS_COLLECTION, id);
  await updateDoc(assetRef, { 
    ...updatedData, 
    updatedAt: new Date().toISOString() 
  });
};

// Eliminar activo
export const deleteAsset = async (id) => {
  const assetRef = doc(db, ASSETS_COLLECTION, id);
  await deleteDoc(assetRef);
};