// set-admin-role.js
const admin = require('firebase-admin');

// Inicializar con tus credenciales de servicio (descárgalas de Firebase Console > Project Settings > Service Accounts)
const serviceAccount = require('./service-account-key.json'); // Debes descargar este JSON

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uid = 'L7CospQ4jrOelhMQVxNCock4p6A2'; // Pega aquí el UID de tu usuario admin@securepro.com

admin.auth().setCustomUserClaims(uid, { role: 'admin' })
  .then(() => {
    console.log('✅ Rol de administrador asignado exitosamente.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error al asignar rol:', error);
    process.exit(1);
  });   