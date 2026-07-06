// src/components/AssetTable.jsx
import React, { useState, useEffect } from 'react';
import { getAssets } from '../services/assetService';
import * as XLSX from 'xlsx';

const AssetTable = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategoria, setFilterCategoria] = useState('Todas las categorías');
  const [filterEstado, setFilterEstado] = useState('Todos los estados');

  useEffect(() => {
    loadAssets();
  }, []);

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

  const filteredAssets = assets.filter(asset => {
    const matchCategoria = filterCategoria === 'Todas las categorías' || asset.categoria === filterCategoria;
    const matchEstado = filterEstado === 'Todos los estados' || asset.estado === filterEstado;
    return matchCategoria && matchEstado;
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
        </div>

        <button 
          onClick={exportToExcel}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors flex items-center gap-2"
        >
          <span>📊</span> Exportar Excel
        </button>
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
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