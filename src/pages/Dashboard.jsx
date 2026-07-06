// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AssetTable from '../components/AssetTable';
import AssetForm from '../components/AssetForm';
import RequireAdmin from '../components/RequireAdmin'; // Importar nuevo componente

const Dashboard = () => {
  const { currentUser, logout, userRole } = useAuth();
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
              <div className="text-right hidden sm:block">
                <span className="block text-sm font-medium text-gray-900">{currentUser?.email}</span>
                <span className="block text-xs text-indigo-600 uppercase font-bold tracking-wider">
                  Rol: {userRole === 'admin' ? 'Administrador' : 'Auditor'}
                </span>
              </div>
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
          
          {/* SOLO ADMIN VE ESTE BOTÓN */}
          <RequireAdmin>
            <button 
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium transition-colors shadow-lg hover:shadow-xl"
            >
              + Nuevo activo
            </button>
          </RequireAdmin>
        </div>

        {/* Pasamos el rol a la tabla para ocultar acciones de edición/borrado si es necesario */}
        <AssetTable userRole={userRole} />
      </main>

      {/* Modal del formulario - Solo accesible si showForm es true (controlado por admin) */}
      {showForm && (
        <AssetForm 
          onSuccess={() => {
            setShowForm(false);
            window.location.reload();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;