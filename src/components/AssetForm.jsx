// src/components/AssetForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import { createAsset, updateAsset } from '../services/assetService';

const AssetForm = ({ initialData = null, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'Desktop / PC',
    estado: 'Activo',
    numero_serie: '',
    ubicacion: '',
    sucursal: '', 
    responsable: '',
    costo: '',
    fecha_compra: '',
    garantia: ''
  });

  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  const isEditing = !!initialData;

  // Precargar datos si estamos editando
  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        categoria: initialData.categoria || 'Desktop / PC',
        estado: initialData.estado || 'Activo',
        numero_serie: initialData.numero_serie || '',
        ubicacion: initialData.ubicacion || '',
        sucursal: initialData.sucursal || '', 
        responsable: initialData.responsable || '',
        costo: initialData.costo || '',
        fecha_compra: initialData.fecha_compra || '',
        garantia: initialData.garantia || ''
      });
    }
  }, [initialData]);

  // Limpiar cámara al cerrar el modal
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const startCamera = async () => {
    setScanning(true);
    setOcrProgress(0);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      alert('No se pudo acceder a la cámara. Verifica permisos.');
      setScanning(false);
    }
  };

  const captureAndReadText = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setOcrProgress(10);
    
    // Capturar frame actual del video
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    setOcrProgress(30);

    try {
      // ✅ CARGA DINÁMICA DESDE CDN (Evita errores de build en Vite/Vercel)
      if (!window.Tesseract) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      // Procesar imagen con Tesseract
      const result = await window.Tesseract.recognize(
        canvas.toDataURL('image/png'),
        'eng', 
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(30 + Math.round(m.progress * 70));
            }
          }
        }
      );

      // Limpiar texto detectado
      const rawText = result.data.text.trim();
      const cleanedText = rawText.replace(/[^a-zA-Z0-9\-_.]/g, '').toUpperCase();
      
      if (cleanedText.length > 0) {
        setFormData(prev => ({ ...prev, numero_serie: cleanedText }));
        alert(`✅ Texto detectado: ${cleanedText}`);
      } else {
        alert('⚠️ No se detectó texto claro. Intenta acercar más la cámara o mejorar la iluminación.');
      }
      
      stopCamera();
    } catch (error) {
      console.error(error);
      alert('Error al procesar la imagen. Intenta de nuevo.');
      setOcrProgress(0);
    }
  };

  const stopCamera = () => {
    setScanning(false);
    setOcrProgress(0);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        await updateAsset(initialData.id, formData);
      } else {
        await createAsset(formData);
      }
      onSuccess();
    } catch (error) {
      alert('Error al guardar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        
        {/* Modal de Cámara y OCR */}
        {scanning && (
          <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center rounded-lg p-4">
            <div className="relative w-full max-w-md border-4 rounded-lg overflow-hidden" style={{ borderColor: 'var(--accent-color)' }}>
              <video ref={videoRef} className="w-full h-64 object-cover bg-gray-900" autoPlay playsInline muted></video>
              <canvas ref={canvasRef} className="hidden"></canvas>
              
              {/* Guía visual centrada */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-12 border-2 rounded opacity-70" style={{ borderColor: 'var(--warning-color)' }}></div>
              </div>
            </div>
            
            <p className="text-white mt-4 font-bold text-lg">Apunta al número de serie</p>
            <p className="text-gray-300 text-sm mb-2 text-center">Asegura buena iluminación y enfoca el texto</p>
            
            {ocrProgress > 0 && (
              <div className="w-full max-w-md bg-gray-700 rounded-full h-2.5 mb-4">
                <div 
                  className="h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${ocrProgress}%`, backgroundColor: 'var(--accent-color)' }}
                ></div>
              </div>
            )}
            
            <div className="flex gap-3 w-full max-w-md">
              <button 
                onClick={captureAndReadText}
                disabled={ocrProgress > 0}
                className="btn-primary flex-1 py-3 font-bold"
              >
                {ocrProgress > 0 ? 'Procesando...' : '📸 Capturar y Leer'}
              </button>
              <button 
                onClick={stopCamera}
                className="btn-danger px-6 py-3 font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Encabezado del Modal */}
        <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {isEditing ? 'Editar Activo' : 'Nuevo Activo'}
          </h2>
          <button 
            onClick={onCancel}
            className="text-2xl font-bold"
            style={{ color: 'var(--text-secondary)' }}
          >
            &times;
          </button>
        </div>

        {/* Formulario Original Conservado Completo */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nombre del equipo *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                placeholder="Ej: Laptop Dell Latitude"
                className="input-field"
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Categoría</label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="input-field"
              >
                <option>Desktop / PC</option>
                <option>Laptop</option>
                <option>Servidor</option>
                <option>Monitor</option>
                <option>Impresora</option>
                <option>Cámara IP</option>
                <option>Switch</option>
                <option>Router / Access Point</option>
                <option>UPS / Regulador</option>
                <option>Otro</option>
              </select>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Estado</label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="input-field"
              >
                <option>Activo</option>
                <option>En reparación</option>
                <option>En resguardo</option>
                <option>Baja</option>
              </select>
            </div>

            {/* ✅ SERIE CON BOTÓN DE ESCANEO OCR INTEGRADO */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Número de serie</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="numero_serie"
                  value={formData.numero_serie}
                  onChange={handleChange}
                  placeholder="Ej: SN-123456789"
                  className="input-field"
                />
                <button 
                  type="button"
                  onClick={startCamera}
                  disabled={scanning}
                  className="btn-secondary min-w-[44px]"
                  title="Escanear texto con cámara"
                >
                  📷
                </button>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Lee texto impreso, etiquetas y códigos</p>
            </div>

            {/* Ubicación */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Ubicación</label>
              <input
                type="text"
                name="ubicacion"
                value={formData.ubicacion}
                onChange={handleChange}
                placeholder="Ej: Oficina 301, Piso 3"
                className="input-field"
              />
            </div>

            {/* Sucursal */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Sucursal</label>
              <input
                type="text"
                name="sucursal"
                value={formData.sucursal}
                onChange={handleChange}
                placeholder="Ej: Sucursal Centro, Planta Norte"
                className="input-field"
              />
            </div>

            {/* Responsable */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Responsable</label>
              <input
                type="text"
                name="responsable"
                value={formData.responsable}
                onChange={handleChange}
                placeholder="Ej: Juan Pérez"
                className="input-field"
              />
            </div>

            {/* Costo */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Costo ($)</label>
              <input
                type="number"
                name="costo"
                value={formData.costo}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="input-field"
              />
            </div>

            {/* Fecha de compra */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Fecha de compra</label>
              <input
                type="date"
                name="fecha_compra"
                value={formData.fecha_compra}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            {/* Garantía */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Garantía (meses)</label>
              <input
                type="number"
                name="garantia"
                value={formData.garantia}
                onChange={handleChange}
                placeholder="12"
                min="0"
                className="input-field"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-6 border-t mt-6" style={{ borderColor: 'var(--border-color)' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 py-3"
            >
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar Activo' : 'Guardar Activo')}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary flex-1 py-3"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetForm;