// src/components/AssetForm.jsx
import React, { useState } from 'react';
import { createAsset } from '../services/assetService';

const AssetForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'Laptop',
    estado: 'Activo',
    marca: '',
    modelo: '',
    numero_serie: '',
    ubicacion: '',
    responsable: '',
    fecha_adquisicion: '',
    costo: '',
    proveedor: '',
    garantia_hasta: '',
    notas: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createAsset(formData);
      onSuccess();
    } catch (error) {
      alert('Error al guardar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="bg-indigo-600 px-6 py-4 sticky top-0">
          <h3 className="text-xl font-bold text-white">Nuevo Activo Tecnológico</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre / descripción *</label>
              <input name="nombre" required 
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.nombre} onChange={handleChange} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
              <select name="categoria" required 
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.categoria} onChange={handleChange}>
                <option>Laptop</option>
                <option>Desktop / PC</option>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
              <select name="estado" required 
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.estado} onChange={handleChange}>
                <option>Activo</option>
                <option>En reparación</option>
                <option>En resguardo</option>
                <option>Baja</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input name="marca" 
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.marca} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <input name="modelo" 
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.modelo} onChange={handleChange} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de serie *</label>
              <input name="numero_serie" required 
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.numero_serie} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
              <input name="ubicacion" 
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.ubicacion} onChange={handleChange} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsable / asignado a</label>
              <input name="responsable" 
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.responsable} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de adquisición</label>
              <input type="date" name="fecha_adquisicion" 
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.fecha_adquisicion} onChange={handleChange} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo (MXN)</label>
              <input type="number" name="costo" min="0" step="0.01"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.costo} onChange={handleChange} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
              <input name="proveedor" 
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.proveedor} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Garantía hasta</label>
              <input type="date" name="garantia_hasta" 
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.garantia_hasta} onChange={handleChange} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea name="notas" rows="3"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formData.notas} onChange={handleChange}></textarea>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="button" onClick={onCancel} 
              className="flex-1 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium transition-colors disabled:bg-gray-400">
              {loading ? 'Guardando...' : 'Guardar activo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetForm;