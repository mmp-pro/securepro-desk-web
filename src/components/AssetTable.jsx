// src/components/AssetTable.jsx
import React, { useState, useEffect, useRef } from 'react';
import { getAssets, bulkImportAssets } from '../services/assetService';
import * as XLSX from 'xlsx';
import RequireAdmin from './RequireAdmin';

const AssetTable = ({ userRole, onEdit, onDelete }) => {
  // ✅ TODOS LOS HOOKS VAN AL PRINCIPIO, ANTES DE CUALQUIER RETURN
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [filterCategoria, setFilterCategoria] = useState('Todas las categorías');
  const [filterEstado, setFilterEstado] = useState('Todos los estados');
  // ✅ NUEVO ESTADO PARA FILTRO DE UBICACIÓN
  const [filterUbicacion, setFilterUbicacion] = useState('Todas las ubicaciones');
  
  const fileInputRef = useRef(null);

  // Hook para cargar datos iniciales
  useEffect(() => {
    loadAssets();
  }, []);

  // Hook de diagnóstico
  useEffect(() => {
    console.log('🔍 AssetTable - Props recibidas:', { 
      userRole, 
      onEdit: typeof onEdit, 
      onDelete: typeof onDelete 
    });
  }, [userRole, onEdit, onDelete]);

  const loadAssets = async () => {
    try {
      const data = await getAssets();
      setAssets(data);
    } catch (error) {
      console.error('Error cargando activos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manejador de importación con descarga automática de respaldo
  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      if (jsonData.length === 0) {
        alert('⚠️ El archivo Excel está vacío o no tiene formato válido.');
        return;
      }

      // ✅ DESCARGA AUTOMÁTICA DEL ARCHIVO PROCESADO EN LA CARPETA DE DESCARGAS
      const ws = XLSX.utils.json_to_sheet(jsonData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Datos_Importados");
      const fileName = `respaldo_importacion_${new Date().toISOString().split('T')[0]}_${Date.now()}.xlsx`;
      XLSX.writeFile(wb, fileName); 

      // Proceder con la carga masiva a Firebase
      const count = await bulkImportAssets(jsonData);
      alert(`✅ Se importaron ${count} activos exitosamente.\nEl archivo de respaldo se descargó automáticamente.`);
      
      // Recargar la tabla para ver los nuevos datos
      await loadAssets();
    } catch (error) {
      console.error(error);
      alert('❌ Error al importar: ' + error.message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // ✅ LÓGICA DE FILTRADO ACTUALIZADA CON UBICACIÓN
  const filteredAssets = assets.filter(asset => {
    const matchCategoria = filterCategoria === 'Todas las categorías' || asset.categoria === filterCategoria;
    const matchEstado = filterEstado === 'Todos los estados' || asset.estado === filterEstado;
    const matchUbicacion = filterUbicacion === 'Todas las ubicaciones' || asset.ubicacion === filterUbicacion;
    
    return matchCategoria && matchEstado && matchUbicacion;
  });

  const stats = {
    total: assets.length,
    valorTotal: assets.reduce((sum, a) => sum + (parseFloat(a.costo) || 0), 0),
    operativos: assets.filter(a => a.estado === 'Activo').length,
    reparacion: assets.filter(a => a.estado === 'En reparación').length
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredAssets);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Activos");
    XLSX.writeFile(wb, `inventario_activos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ✅ EL RETURN CONDICIONAL VA DESPUÉS DE TODOS LOS HOOKS
  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Total de activos</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Valor total</p>
          <p className="text-2xl font-bold text-gray-900">${stats.valorTotal.toLocaleString('es-MX')}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-emerald-500">
          <p className="text-sm text-gray-600">Operativos</p>
          <p className="text-2xl font-bold text-gray-900">{stats.operativos}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <p className="text-sm text-gray-600">En reparación</p>
          <p className="text-2xl font-bold text-gray-900">{stats.reparacion}</p>
        </div>
      </div>

      {/* Filtros y acciones */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-lg shadow">
        <div className="flex gap-3 flex-wrap">
          <select 
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
          >
            <option>Todas las categorías</option>
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

          <select 
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
          >
            <option>Todos los estados</option>
            <option>Activo</option>
            <option>En reparación</option>
            <option>En resguardo</option>
            <option>Baja</option>
          </select>

          {/* ✅ NUEVO SELECTOR DINÁMICO DE UBICACIONES */}
          <select 
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={filterUbicacion}
            onChange={(e) => setFilterUbicacion(e.target.value)}
          >
            <option>Todas las ubicaciones</option>
            {[...new Set(assets.map(a => a.ubicacion))].filter(Boolean).map((ubicacion) => (
              <option key={ubicacion}>{ubicacion}</option>
            ))}
          </select>
        </div>

        {/* Botones de Acción Agrupados */}
        <div className="flex gap-3">
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".xlsx,.xls,.csv" 
            onChange={handleImportExcel} 
            className="hidden" 
          />

          <RequireAdmin>
            <button 
              onClick={triggerFileUpload}
              disabled={importing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{importing ? '' : ''}</span> 
              {importing ? 'Importando...' : 'Importar Excel'}
            </button>
          </RequireAdmin>

          <RequireAdmin>
            <button 
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors flex items-center gap-2"
            >
              <span>📊</span> Exportar Excel
            </button>
          </RequireAdmin>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable</th>
                
                <RequireAdmin>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </RequireAdmin>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={userRole === 'admin' ? 7 : 6} className="px-6 py-8 text-center text-gray-500">
                    No hay activos registrados
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{asset.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{asset.categoria}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        asset.estado === 'Activo' ? 'bg-green-100 text-green-800' :
                        asset.estado === 'En reparación' ? 'bg-orange-100 text-orange-800' :
                        asset.estado === 'En resguardo' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {asset.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{asset.numero_serie}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{asset.ubicacion}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{asset.responsable}</td>
                    
                    <RequireAdmin>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <button 
                          onClick={() => {
                            console.log('✏️ Clic en Editar - Asset:', asset);
                            if (typeof onEdit === 'function') {
                              onEdit(asset);
                            } else {
                              console.error('❌ onEdit NO es una función. Recibido:', onEdit);
                            }
                          }}
                          className="text-indigo-600 hover:text-indigo-900 mr-3 font-medium"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => {
                            console.log('🗑️ Clic en Borrar - ID:', asset.id);
                            if (typeof onDelete === 'function') {
                              onDelete(asset.id);
                            } else {
                              console.error('❌ onDelete NO es una función. Recibido:', onDelete);
                            }
                          }}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Borrar
                        </button>
                      </td>
                    </RequireAdmin>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AssetTable;