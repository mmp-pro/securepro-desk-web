// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AssetTable from '../components/AssetTable';
import AssetForm from '../components/AssetForm';

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-indigo-600">SecurePro-Desk</h1>
              <p className="text-sm text-gray-600">Inventario de equipos tecnológicos</p>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700 hidden sm:block">{currentUser?.email}</span>
              <button 
                onClick={logout}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Activos Fijos Tecnológicos</h2>
          <button 
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium transition-colors shadow-lg hover:shadow-xl"
          >
            + Nuevo activo
          </button>
        </div>

        <AssetTable />
      </main>

      {/* Modal del formulario */}
      {showForm && (
        <AssetForm 
          onSuccess={() => {
            setShowForm(false);
            window.location.reload(); // Recargar para ver el nuevo activo
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;