/**
 * QINAYA TRACKER - Configuration
 * Configuración global de la aplicación
 */

const CONFIG = {
  // URL del Google Apps Script desplegado
  API_URL: 'https://script.google.com/macros/s/AKfycbwoO985jQNC24Vu38VRKIJlnhCTjh1aJhz4W845-HaXN9o2MEwvYDSA3JWvaVTaK8Ui-A/exec',

  // Versión de la aplicación
  VERSION: '3.8.0',

  // Proyecto info
  PROJECT: {
    name: 'Qinaya Tracker',
    totalLicenses: 1000,
    totalSchools: 70,
    totalDays: 45,
    totalTechnicians: 7,
    dailyGoalSchools: 1.4,
    dailyGoalLicenses: 22.2
  },

  // Fases geográficas
  PHASES: {
    NORTE: { name: 'Fase Norte', color: '#3B82F6' },
    CENTRO_OCCIDENTE: { name: 'Fase Centro/Occidente', color: '#F97316' },
    SUR_ORIENTE: { name: 'Fase Sur/Oriente', color: '#22C55E' }
  },

  // Roles de usuario
  ROLES: {
    ADMIN: 'admin',
    TECHNICIAN: 'tecnico'
  },

  // Local Storage Keys
  STORAGE_KEYS: {
    USER: 'qinaya_user',
    SESSION: 'qinaya_session',
    OFFLINE_QUEUE: 'qinaya_offline_queue'
  },

  // Configuración de geolocalización
  GEO: {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000
  },

  // Días de trabajo de la semana
  WORK_DAYS: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],

  // Meses en español
  MONTHS: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ],

  // Días de la semana cortos
  DAYS_SHORT: ['D', 'L', 'M', 'M', 'J', 'V', 'S']
};

// Modo demo con datos de prueba
const DEMO_MODE = false;

// Datos de demostración
const DEMO_DATA = {
  users: [
    { id: 'admin1', nombre: 'Hernán Rodríguez', email: 'hernan@qinaya.com', password: 'admin123', rol: 'admin', zona: 'Todas' },
    { id: 'tech1', nombre: 'Carlos Martínez', email: 'carlos@qinaya.com', password: 'tech123', rol: 'tecnico', zona: 'UPZ Usaquén' },
    { id: 'tech2', nombre: 'María López', email: 'maria@qinaya.com', password: 'tech123', rol: 'tecnico', zona: 'UPZ Suba' },
    { id: 'tech3', nombre: 'Juan Pérez', email: 'juan@qinaya.com', password: 'tech123', rol: 'tecnico', zona: 'UPZ Chapinero' },
    { id: 'tech4', nombre: 'Ana García', email: 'ana@qinaya.com', password: 'tech123', rol: 'tecnico', zona: 'UPZ Kennedy' },
    { id: 'tech5', nombre: 'Luis Torres', email: 'luis@qinaya.com', password: 'tech123', rol: 'tecnico', zona: 'UPZ Bosa' },
    { id: 'tech6', nombre: 'Sandra Ruiz', email: 'sandra@qinaya.com', password: 'tech123', rol: 'tecnico', zona: 'UPZ Usme' },
    { id: 'tech7', nombre: 'Pedro Díaz', email: 'pedro@qinaya.com', password: 'tech123', rol: 'tecnico', zona: 'UPZ Ciudad Bolívar' },
    { id: 'tech8', nombre: 'jhonatan Diaz', email: 'jhonatan@qinaya.com', password: 'tech123', rol: 'tecnico', zona: 'UPZ Kennedy' }
  ],

  schools: [
    { id: 'col1', nombre: 'Colegio San Francisco', direccion: 'Calle 100 #15-30', fase: 'NORTE', upz: 'UPZ Usaquén', totalEquipos: 15, contacto: 'Prof. García', telefono: '3001234567' },
    { id: 'col8', nombre: 'Colegio Santa Ana (Nuevo)', direccion: 'Calle 127 #45-10', fase: 'NORTE', upz: 'UPZ Usaquén', totalEquipos: 30, tecnicoId: 'tech1', contacto: 'Celia Cruz', telefono: '3009876543' },
    { id: 'col2', nombre: 'IED El Libertador', direccion: 'Av. Suba #120-45', fase: 'NORTE', upz: 'UPZ Suba', totalEquipos: 20, contacto: 'Coord. Méndez', telefono: '3002345678' },
    { id: 'col3', nombre: 'Colegio Simón Bolívar', direccion: 'Cra 7 #45-20', fase: 'CENTRO_OCCIDENTE', upz: 'UPZ Chapinero', totalEquipos: 12, contacto: 'Rector Silva', telefono: '3003456789' },
    { id: 'col4', nombre: 'IED Kennedy Central', direccion: 'Av. Americas #68-50', fase: 'CENTRO_OCCIDENTE', upz: 'UPZ Kennedy', totalEquipos: 25, contacto: 'Prof. Ortiz', telefono: '3004567890' },
    { id: 'col5', nombre: 'Colegio La Victoria', direccion: 'Calle 59 Sur #80-10', fase: 'SUR_ORIENTE', upz: 'UPZ Bosa', totalEquipos: 18, contacto: 'Coord. Vargas', telefono: '3005678901' },
    { id: 'col6', nombre: 'IED Nueva Esperanza', direccion: 'Cra 1 Este #90-15', fase: 'SUR_ORIENTE', upz: 'UPZ Usme', totalEquipos: 14, contacto: 'Prof. Rojas', telefono: '3006789012' },
    { id: 'col7', nombre: 'Colegio Arborizadora', direccion: 'Calle 70 Sur #18-30', fase: 'SUR_ORIENTE', upz: 'UPZ Ciudad Bolívar', totalEquipos: 16, contacto: 'Rector Gómez', telefono: '3007890123' }
  ],

  installations: [
    // Instalaciones de ejemplo para demostración
    { id: 'ins1', fecha: '2026-01-27', tecnicoId: 'tech1', colegioId: 'col1', equipoId: 'PC-001', marcaModelo: 'HP ProDesk 400', versionQinaya: '2.1.0', checkAbre: true, checkInternet: true, checkLicencia: true, lat: 4.7110, lng: -74.0721, notas: 'Instalación exitosa' },
    { id: 'ins2', fecha: '2026-01-27', tecnicoId: 'tech1', colegioId: 'col1', equipoId: 'PC-002', marcaModelo: 'HP ProDesk 400', versionQinaya: '2.1.0', checkAbre: true, checkInternet: true, checkLicencia: true, lat: 4.7110, lng: -74.0721, notas: '' },
    { id: 'ins3', fecha: '2026-01-27', tecnicoId: 'tech2', colegioId: 'col2', equipoId: 'PC-001', marcaModelo: 'Dell OptiPlex 3080', versionQinaya: '2.1.0', checkAbre: true, checkInternet: false, checkLicencia: true, lat: 4.7410, lng: -74.0821, notas: 'Problema de red - reportado' },
    { id: 'ins4', fecha: '2026-01-28', tecnicoId: 'tech3', colegioId: 'col3', equipoId: 'PC-001', marcaModelo: 'Lenovo ThinkCentre', versionQinaya: '2.1.0', checkAbre: true, checkInternet: true, checkLicencia: true, lat: 4.6510, lng: -74.0621, notas: '' },
    { id: 'ins5', fecha: '2026-01-28', tecnicoId: 'tech4', colegioId: 'col4', equipoId: 'PC-001', marcaModelo: 'HP ProBook', versionQinaya: '2.1.0', checkAbre: true, checkInternet: true, checkLicencia: true, lat: 4.6310, lng: -74.1521, notas: '' }
  ]
};

// Exportar para uso global
window.CONFIG = CONFIG;
window.DEMO_MODE = DEMO_MODE;
window.DEMO_DATA = DEMO_DATA;
