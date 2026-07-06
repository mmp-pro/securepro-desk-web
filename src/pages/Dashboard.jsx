// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme'; // ✅ NUEVO IMPORT
import AssetTable from '../components/AssetTable';
import AssetForm from '../components/AssetForm';
import RequireAdmin from '../components/RequireAdmin';
import { deleteAsset } from '../services/assetService';

const Dashboard = () => {
  const { currentUser, logout, userRole } = useAuth();
  const { theme, toggleTheme } = useTheme(); // ✅ HOOK DE TEMA
  
  // Estados para controlar el formulario (Crear o Editar)
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null); 

  // Función que se ejecuta al dar clic en "Editar" en la tabla
  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setShowForm(true);
  };

  // Función que se ejecuta al dar clic en "Borrar" en la tabla
  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este activo permanentemente?')) {
      try {
        await deleteAsset(id);
        alert('Activo eliminado correctamente');
        window.location.reload();
      } catch (error) {
        console.error(error);
        alert('Error al eliminar el activo');
      }
    }
  };

  // Función cuando se guarda exitosamente (Crear o Editar)
  const handleSuccess = () => {
    setShowForm(false);
    setEditingAsset(null);
    window.location.reload();
  };

  // Función para cancelar
  const handleCancel = () => {
    setShowForm(false);
    setEditingAsset(null);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="card shadow-sm border-b mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--accent-color)' }}>SecurePro-Desk</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Inventario de equipos tecnológicos</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* ✅ BOTÓN TOGGLE DE TEMA */}
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-[var(--bg-tertiary)] transition-colors text-xl"
                title={theme === 'light' ? 'Activar modo oscuro ' : 'Activar modo claro ☀️'}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>

              <div className="text-right hidden sm:block">
                <span className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{currentUser?.email}</span>
                <span className="block text-xs uppercase font-bold tracking-wider" style={{ color: 'var(--accent-color)' }}>
                  ROL: {userRole === 'admin' ? 'ADMINISTRADOR' : 'AUDITOR'}
                </span>
              </div>
              <button 
                onClick={logout}
                className="btn-danger text-sm font-medium"
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
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Activos Fijos Tecnológicos</h2>
          
          {/* Botón solo visible para Admin */}
          <RequireAdmin>
            <button 
              onClick={() => {
                setEditingAsset(null);
                setShowForm(true);
              }}
              className="btn-primary px-6 py-3 shadow-lg hover:shadow-xl"
            >
              + Nuevo activo
            </button>
          </RequireAdmin>
        </div>

        {/* Pasamos las funciones onEdit y onDelete a la tabla */}
        <AssetTable 
          userRole={userRole} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </main>

      {/* Modal del Formulario (Sirve para Crear y Editar) */}
      {showForm && (
        <AssetForm 
          initialData={editingAsset}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default Dashboard;