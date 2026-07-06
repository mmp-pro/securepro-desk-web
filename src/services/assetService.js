// src/services/assetService.js
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc, 
  writeBatch 
} from "firebase/firestore";
import { db } from "../firebase/config";

const ASSETS_COLLECTION = "activos";

// Crear nuevo activo individual
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

// NUEVA: Importación masiva desde Excel usando Batch Writes
export const bulkImportAssets = async (assetsArray) => {
  if (!assetsArray || assetsArray.length === 0) {
    throw new Error('El archivo está vacío o no tiene datos válidos');
  }

  const assetsRef = collection(db, ASSETS_COLLECTION);
  const timestamp = new Date().toISOString();
  
  // Firestore permite máximo 500 operaciones por batch. Usamos 490 por seguridad.
  const MAX_BATCH_SIZE = 490; 
  let importedCount = 0;

  // Procesar en lotes si hay más de 490 registros
  for (let i = 0; i < assetsArray.length; i += MAX_BATCH_SIZE) {
    const chunk = assetsArray.slice(i, i + MAX_BATCH_SIZE);
    const batch = writeBatch(db); // Iniciar nuevo batch para cada lote
    
    chunk.forEach((item) => {
      const docRef = doc(assetsRef); // Genera ID automático
      
      // Mapeo flexible: acepta nombres técnicos y nombres comunes de Excel
      batch.set(docRef, {
      nombre: item.nombre || item['Nombre'] || '',
      categoria: item.categoria || item['Categoría'] || 'Otro',
      estado: item.estado || item['Estado'] || 'Activo',
      numero_serie: item.numero_serie || item['Serie'] || '',
      sucursal: item.sucursal || item['Sucursal'] || '', // ✅ NUEVO
      ubicacion: item.ubicacion || item['Ubicación'] || '',
      responsable: item.responsable || item['Responsable'] || '',
      costo: parseFloat(item.costo || item['Costo']) || 0,
      fecha_compra: item.fecha_compra || item['Fecha Compra'] || '',
      garantia: item.garantia || item['Garantía'] || '',
      createdAt: timestamp,
      updatedAt: timestamp
      });
      });

    // Ejecutar el lote en Firebase
    await batch.commit();
    importedCount += chunk.length;
  }

  return importedCount;
};