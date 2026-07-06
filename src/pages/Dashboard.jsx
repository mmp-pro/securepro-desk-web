// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AssetTable from '../components/AssetTable';
import AssetForm from '../components/AssetForm';
import RequireAdmin from '../components/RequireAdmin';
import { deleteAsset } from '../services/assetService'; // Importar función de borrar

const Dashboard = () => {
  const { currentUser, logout, userRole } = useAuth();
  
  // Estados para controlar el formulario (Crear o Editar)
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null); 

  // Función que se ejecuta al dar clic en "Editar" en la tabla
  const handleEdit = (asset) => {
    setEditingAsset(asset); // Guardamos los datos del activo a editar
    setShowForm(true);      // Abrimos el modal
  };

  // Función que se ejecuta al dar clic en "Borrar" en la tabla
  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este activo permanentemente?')) {
      try {
        await deleteAsset(id);
        alert('Activo eliminado correctamente');
        window.location.reload(); // Recargamos para ver los cambios
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
    window.location.reload(); // Recargamos para ver los cambios
  };

  // Función para cancelar
  const handleCancel = () => {
    setShowForm(false);
    setEditingAsset(null);
  };

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
                  ROL: {userRole === 'admin' ? 'ADMINISTRADOR' : 'AUDITOR'}
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
          
          {/* Botón solo visible para Admin */}
          <RequireAdmin>
            <button 
              onClick={() => {
                setEditingAsset(null); // Aseguramos que esté en modo CREAR
                setShowForm(true);
              }}
              className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium transition-colors shadow-lg hover:shadow-xl"
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
          initialData={editingAsset} // Si es null, crea. Si tiene datos, edita.
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default Dashboard;