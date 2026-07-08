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
  const [scanStatus, setScanStatus] = useState('Iniciando cámara...');
  
  // Estado para controlar qué campo está recibiendo dictado por voz
  const [dictatingField, setDictatingField] = useState(null); 
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const recognitionRef = useRef(null); // Referencia para detener el micrófono al cerrar
  
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

  // Limpiar recursos (cámara y micrófono) al cerrar el modal
  useEffect(() => {
    return () => {
      stopCamera();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- LÓGICA DE ESCANEO AUTOMÁTICO (OCR/BARRAS) ---
  const handleScanSuccess = (text) => {
    setFormData(prev => ({ ...prev, numero_serie: text }));
    stopCamera();
    if (navigator.vibrate) navigator.vibrate(200);
  };

  const startCamera = async () => {
    setScanning(true);
    setScanStatus('Buscando código o texto...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      startAutoDetectionLoop();
    } catch (err) {
      alert('No se pudo acceder a la cámara. Verifica permisos.');
      setScanning(false);
    }
  };

  const startAutoDetectionLoop = () => {
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);

    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || videoRef.current.paused) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 1. Detectar Códigos de Barras / QR
      if (window.BarcodeDetector) {
        try {
          const detector = new window.BarcodeDetector({ formats: ['code_128', 'qr_code', 'ean_13', 'code_39'] });
          const barcodes = await detector.detect(canvas);
          if (barcodes.length > 0) {
            handleScanSuccess(barcodes[0].rawValue.toUpperCase().replace(/[^A-Z0-9\-_.]/g, ''));
            return;
          }
        } catch (e) { /* Ignorar */ }
      }

      // 2. Intentar OCR (Texto impreso)
      if (window.Tesseract) {
        setScanStatus('Analizando texto...');
        try {
          const result = await window.Tesseract.recognize(canvas, 'eng', {
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.'
          });
          
          const lines = result.data.text.split('\n').map(l => l.trim().toUpperCase());
          const validSeries = lines.find(line => 
            line.length > 4 && /^[A-Z0-9\-_.]+$/.test(line) && !line.includes(' ')
          );

          if (validSeries) {
            handleScanSuccess(validSeries);
          } else {
            setScanStatus('Enfoca mejor el texto...');
          }
        } catch (e) { /* Ignorar */ }
      } else {
        setScanStatus('Cargando motor de lectura...');
        if (!window.tesseractLoading) {
          window.tesseractLoading = true;
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
          script.onload = () => { window.tesseractLoading = false; setScanStatus('Buscando texto...'); };
          script.onerror = () => { setScanStatus('Error cargando OCR'); window.tesseractLoading = false; };
          document.head.appendChild(script);
        }
      }
    }, 800); 
  };

  const stopCamera = () => {
    setScanning(false);
    setScanStatus('');
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  // --- NUEVA LÓGICA DE DICTADO POR VOZ ---
  const startVoiceDictation = (fieldName) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome, Edge o Safari.');
      return;
    }

    // Detener cualquier dictado anterior
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-MX'; // Español de México
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    setDictatingField(fieldName);
    setScanStatus(`🎤 Dictando: ${fieldName}... (Di "guardar" para enviar)`);

    recognition.onresult = (event) => {
      let transcript = event.results[0][0].transcript.trim();
      
      // COMANDO DE VOZ INTELIGENTE: Si dice "guardar", ejecutar submit
      if (transcript.toLowerCase() === 'guardar') {
        handleSubmit(new Event('submit')); // Simular click en botón guardar
        setDictatingField(null);
        setScanStatus('✅ Guardando automáticamente...');
        return;
      }

      // Actualizar el campo correspondiente
      setFormData(prev => ({ ...prev, [fieldName]: transcript }));
      setScanStatus(`✅ "${transcript}" capturado`);
      
      // Limpiar estado visual después de 2 segundos
      setTimeout(() => {
        setDictatingField(null);
        setScanStatus('');
      }, 2000);
    };

    recognition.onerror = (event) => {
      console.error('Error de reconocimiento:', event.error);
      setDictatingField(null);
      setScanStatus('️ Error al escuchar. Intenta de nuevo.');
      setTimeout(() => setScanStatus(''), 3000);
    };

    recognition.onend = () => {
      // Si terminó pero no hubo resultado válido, resetear estado
      if (dictatingField === fieldName) {
        setDictatingField(null);
        setScanStatus('');
      }
    };

    recognition.start();
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
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

  // Componente reutilizable para inputs con botón de micrófono
  const VoiceInput = ({ label, name, placeholder, required = false }) => (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <div className="flex gap-2">
        <input 
          type="text" 
          name={name} 
          value={formData[name]} 
          onChange={handleChange} 
          required={required} 
          placeholder={placeholder} 
          className={`input-field flex-1 ${dictatingField === name ? 'ring-2 ring-[var(--accent-color)]' : ''}`} 
        />
        <button 
          type="button"
          onClick={() => startVoiceDictation(name)}
          disabled={!!dictatingField} // Evitar múltiples dictados simultáneos
          className="btn-secondary min-w-[50px] flex items-center justify-center text-xl"
          title={`Dictar ${label} por voz`}
        >
          🎤
        </button>
      </div>
      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
        Toca el micrófono y habla claramente
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        
        {/* Modal de Cámara Automática */}
        {scanning && (
          <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center rounded-lg p-4">
            <div className="relative w-full max-w-md border-4 rounded-lg overflow-hidden shadow-2xl" style={{ borderColor: 'var(--accent-color)' }}>
              <video ref={videoRef} className="w-full h-80 object-cover bg-gray-900" autoPlay playsInline muted></video>
              <canvas ref={canvasRef} className="hidden"></canvas>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-16 border-2 rounded animate-pulse" style={{ borderColor: 'var(--warning-color)', boxShadow: '0 0 15px var(--warning-color)' }}></div>
              </div>
            </div>
            <p className="text-white mt-6 font-bold text-xl">{scanStatus}</p>
            <p className="text-gray-400 text-sm mb-6 text-center max-w-xs">Mantén el dispositivo estable y asegúrate de que haya buena luz</p>
            <button onClick={stopCamera} className="btn-secondary px-8 py-3 font-bold">Cancelar Escaneo</button>
          </div>
        )}

        {/* Encabezado del Modal */}
        <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {isEditing ? 'Editar Activo' : 'Nuevo Activo'}
          </h2>
          <button onClick={onCancel} className="text-2xl font-bold" style={{ color: 'var(--text-secondary)' }}>&times;</button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* ✅ Nombre con Dictado por Voz */}
            <VoiceInput label="Nombre del equipo *" name="nombre" placeholder="Ej: Laptop Dell Latitude" required />

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Categoría</label>
              <select name="categoria" value={formData.categoria} onChange={handleChange} className="input-field">
                <option>Desktop / PC</option><option>Laptop</option><option>Servidor</option><option>Monitor</option><option>Impresora</option><option>Cámara IP</option><option>Switch</option><option>Router / Access Point</option><option>UPS / Regulador</option><option>Otro</option>
              </select>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Estado</label>
              <select name="estado" value={formData.estado} onChange={handleChange} className="input-field">
                <option>Activo</option><option>En reparación</option><option>En resguardo</option><option>Baja</option>
              </select>
            </div>

            {/* Serie con Escaneo Automático */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Número de serie</label>
              <div className="flex gap-2">
                <input type="text" name="numero_serie" value={formData.numero_serie} onChange={handleChange} placeholder="Se llena automáticamente..." className="input-field font-mono tracking-wider" />
                <button type="button" onClick={startCamera} disabled={scanning} className="btn-primary min-w-[50px] flex items-center justify-center text-xl" title="Escaneo automático">📷</button>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Apunta la cámara y espera la detección automática</p>
            </div>

            {/* ✅ Ubicación con Dictado por Voz */}
            <VoiceInput label="Ubicación" name="ubicacion" placeholder="Ej: Oficina 301, Piso 3" />

            {/* ✅ Sucursal con Dictado por Voz */}
            <VoiceInput label="Sucursal" name="sucursal" placeholder="Ej: Sucursal Centro, Planta Norte" />

            {/* ✅ Responsable con Dictado por Voz */}
            <VoiceInput label="Responsable" name="responsable" placeholder="Ej: Juan Pérez" />

            {/* Costo */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Costo ($)</label>
              <input type="number" name="costo" value={formData.costo} onChange={handleChange} placeholder="0.00" min="0" step="0.01" className="input-field" />
            </div>

            {/* Fecha de compra */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Fecha de compra</label>
              <input type="date" name="fecha_compra" value={formData.fecha_compra} onChange={handleChange} className="input-field" />
            </div>

            {/* Garantía */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Garantía (meses)</label>
              <input type="number" name="garantia" value={formData.garantia} onChange={handleChange} placeholder="12" min="0" className="input-field" />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-6 border-t mt-6" style={{ borderColor: 'var(--border-color)' }}>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar Activo' : 'Guardar Activo')}
            </button>
            <button type="button" onClick={onCancel} className="btn-secondary flex-1 py-3">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetForm;