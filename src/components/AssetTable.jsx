// src/components/AssetTable.jsx
import React, { useState, useEffect, useRef } from 'react';
import { getAssets, bulkImportAssets } from '../services/assetService';
import * as XLSX from 'xlsx';
import RequireAdmin from './RequireAdmin';

const AssetTable = ({ userRole, onEdit, onDelete }) => {
  // ✅ TODOS LOS HOOKS VAN AL PRINCIPIO
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [filterCategoria, setFilterCategoria] = useState('Todas las categorías');
  const [filterEstado, setFilterEstado] = useState('Todos los estados');
  const [filterUbicacion, setFilterUbicacion] = useState('Todas las ubicaciones');
  const [filterSucursal, setFilterSucursal] = useState('Todas las sucursales');
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadAssets();
  }, []);

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
        alert('️ El archivo Excel está vacío o no tiene formato válido.');
        return;
      }

      const ws = XLSX.utils.json_to_sheet(jsonData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Datos_Importados");
      const fileName = `respaldo_importacion_${new Date().toISOString().split('T')[0]}_${Date.now()}.xlsx`;
      XLSX.writeFile(wb, fileName); 

      const count = await bulkImportAssets(jsonData);
      alert(`✅ Se importaron ${count} activos exitosamente.\nEl archivo de respaldo se descargó automáticamente.`);
      
      await loadAssets();
    } catch (error) {
      console.error(error);
      alert(' Error al importar: ' + error.message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // ✅ LÓGICA DE FILTRADO ACTUALIZADA CON SUCURSAL Y UBICACIÓN
  const filteredAssets = assets.filter(asset => {
    const matchCategoria = filterCategoria === 'Todas las categorías' || asset.categoria === filterCategoria;
    const matchEstado = filterEstado === 'Todos los estados' || asset.estado === filterEstado;
    const matchUbicacion = filterUbicacion === 'Todas las ubicaciones' || asset.ubicacion === filterUbicacion;
    const matchSucursal = filterSucursal === 'Todas las sucursales' || asset.sucursal === filterSucursal;
    
    return matchCategoria && matchEstado && matchUbicacion && matchSucursal;
  });

  // ✅ ESTADÍSTICAS DINÁMICAS BASADAS EN EL FILTRO ACTIVO
  const dynamicStats = {
    label: filterCategoria !== 'Todas las categorías' ? `Total ${filterCategoria}` : 
           filterEstado !== 'Todos los estados' ? `Total ${filterEstado}` :
           filterUbicacion !== 'Todas las ubicaciones' ? `Total en ${filterUbicacion}` :
           filterSucursal !== 'Todas las sucursales' ? `Total ${filterSucursal}` :
           'Total de activos',
    
    total: filteredAssets.length,
    valorTotal: filteredAssets.reduce((sum, a) => sum + (parseFloat(a.costo) || 0), 0),
    operativos: filteredAssets.filter(a => a.estado === 'Activo').length,
    reparacion: filteredAssets.filter(a => a.estado === 'En reparación').length
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredAssets);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Activos");
    XLSX.writeFile(wb, `inventario_activos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--accent-color)' }}></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* ✅ Estadísticas Contextuales y Dinámicas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Tarjeta 1: Total (Título cambia según el filtro) */}
        <div className="card border-l-4 border-l-blue-500">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{dynamicStats.label}</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{dynamicStats.total}</p>
        </div>

        {/* Tarjeta 2: Valor Total (Calculado sobre filtrados) */}
        <div className="card border-l-4 border-l-green-500">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Valor total filtrado</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            ${dynamicStats.valorTotal.toLocaleString('es-MX')}
          </p>
        </div>

        {/* Tarjeta 3: Operativos (Solo de los visibles) */}
        <div className="card border-l-4 border-l-emerald-500">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Operativos (filtrados)</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {dynamicStats.operativos}
          </p>
        </div>

        {/* Tarjeta 4: En Reparación (Solo de los visibles) */}
        <div className="card border-l-4 border-l-orange-500">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>En reparación (filtrados)</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {dynamicStats.reparacion}
          </p>
        </div>
      </div>

      {/* Filtros y acciones */}
      <div className="card flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          <select 
            className="input-field w-auto"
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
            className="input-field w-auto"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
          >
            <option>Todos los estados</option>
            <option>Activo</option>
            <option>En reparación</option>
            <option>En resguardo</option>
            <option>Baja</option>
          </select>

          <select 
            className="input-field w-auto"
            value={filterUbicacion}
            onChange={(e) => setFilterUbicacion(e.target.value)}
          >
            <option>Todas las ubicaciones</option>
            {[...new Set(assets.map(a => a.ubicacion))].filter(Boolean).map((ubicacion) => (
              <option key={ubicacion}>{ubicacion}</option>
            ))}
          </select>

          <select 
            className="input-field w-auto"
            value={filterSucursal}
            onChange={(e) => setFilterSucursal(e.target.value)}
          >
            <option>Todas las sucursales</option>
            {[...new Set(assets.map(a => a.sucursal))].filter(Boolean).map((sucursal) => (
              <option key={sucursal}>{sucursal}</option>
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
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? '⏳ Importando...' : ' Importar Excel'}
            </button>
          </RequireAdmin>

          <RequireAdmin>
            <button 
              onClick={exportToExcel}
              className="btn-primary flex items-center gap-2"
              style={{ backgroundColor: 'var(--success-color)' }}
            >
              📊 Exportar Excel
            </button>
          </RequireAdmin>
        </div>
      </div>

      {/* Tabla Corregida */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-color)]">
            <thead>
              <tr>
                <th className="table-header text-left pl-6">Nombre</th>
                <th className="table-header text-left">Categoría</th>
                <th className="table-header text-left">Estado</th>
                <th className="table-header text-left">Serie</th>
                <th className="table-header text-left">Sucursal</th>
                <th className="table-header text-left">Ubicación</th>
                <th className="table-header text-left">Responsable</th>
                
                <RequireAdmin>
                  <th className="table-header text-left pr-6">Acciones</th>
                </RequireAdmin>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={userRole === 'admin' ? 8 : 7} className="px-6 py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                    No hay activos registrados
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{asset.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-primary)' }}>{asset.categoria}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        asset.estado === 'Activo' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        asset.estado === 'En reparación' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                        asset.estado === 'En resguardo' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {asset.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{asset.numero_serie}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-primary)' }}>{asset.sucursal || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-primary)' }}>{asset.ubicacion}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-primary)' }}>{asset.responsable}</td>
                    
                    <RequireAdmin>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button 
                          onClick={() => onEdit(asset)}
                          className="mr-3 font-medium hover:underline"
                          style={{ color: 'var(--accent-color)' }}
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => onDelete(asset.id)}
                          className="font-medium hover:underline"
                          style={{ color: 'var(--danger-color)' }}
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