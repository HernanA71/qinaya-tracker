/**
 * QINAYA TRACKER - Google Apps Script Backend v3.1
 * 
 * INCLUYE GETTERS FALTANTES PARA COLEGIOS E INSTALACIONES
 */

// ID de tu Google Sheet
const SPREADSHEET_ID = '18WwGdRk-NOpDxqy1XicxqAA2kFm0Q4P1Xs61Pa9ZHEg';

// Nombres de las hojas
const SHEETS = {
  USERS: 'Usuarios',
  SCHOOLS: 'Colegios',
  INSTALLATIONS: 'Instalaciones',
  EVIDENCE: 'Evidencias'
};

/**
 * Endpoint GET - Obtener datos
 */
function doGet(e) {
  const action = e.parameter.action;
  let result;
  
  try {
    switch (action) {
      case 'getUsers':
        result = getUsers();
        break;
      case 'getSchools':
        result = getSchools();
        break;
      case 'getInstallations':
        result = getInstallations();
        break;
      case 'getMetrics':
        result = getMetrics();
        break;
      case 'getTechnicianDetails':
        result = getTechnicianDetails(e.parameter.techId);
        break;
      default:
        result = { success: false, error: 'Acción no válida: ' + action };
    }
  } catch (error) {
    result = { success: false, error: error.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Endpoint POST - Guardar datos
 */
function doPost(e) {
  let result;
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    switch (action) {
      case 'login':
        result = login(data.email, data.password);
        break;
      case 'addInstallation':
        result = addInstallation(data);
        break;
      case 'addSchool':
        result = addSchool(data);
        break;
      case 'addUser':
        result = addUser(data);
        break;
      case 'deleteUser':
        result = deleteUser(data.id);
        break;
      case 'deleteSchool':
        result = deleteSchool(data.id);
        break;
      default:
        result = { success: false, error: 'Acción POST no válida' };
    }
  } catch (error) {
    result = { success: false, error: error.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * --- GETTERS COMPLETOS ---
 */
function getUsers() {
  const sheet = getSheet(SHEETS.USERS);
  return { success: true, data: rowsToObjects(sheet) };
}

function getSchools() {
  const sheet = getSheet(SHEETS.SCHOOLS);
  return { success: true, data: rowsToObjects(sheet) };
}

/**
 * Obtener instalaciones con fecha normalizada
 */
function getInstallations() {
  const sheet = getSheet(SHEETS.INSTALLATIONS);
  const rawData = rowsToObjects(sheet);
  
  // Normalizar fechas para que el frontend no sufra
  const data = rawData.map(item => {
    if (item.fecha instanceof Date) {
      item.fecha = item.fecha.toISOString();
    }
    return item;
  });

  return { success: true, data: data };
}

/**
 * Agregar instalación con ID autoincremental seguro
 */
function addInstallation(data) {
  const lock = LockService.getScriptLock();
  try {
    // Esperar hasta 30 segundos por el bloqueo para evitar colisiones
    lock.waitLock(30000); 
    
    // Si no viene ID, generarlo
    if (!data.id) {
      const sheet = getSheet(SHEETS.INSTALLATIONS);
      const rows = sheet.getDataRange().getValues();
      let maxId = 0;
      
      // Escanear ID actual máximo (columna A, ignorando header)
      for (let i = 1; i < rows.length; i++) {
        const idCell = String(rows[i][0]); // Asumiendo ID 'insX'
        if (idCell.startsWith('ins')) {
          const num = parseInt(idCell.replace('ins', ''), 10);
          if (!isNaN(num) && num > maxId) {
            maxId = num;
          }
        }
      }
      data.id = 'ins' + (maxId + 1);
    }
    
    return saveData(SHEETS.INSTALLATIONS, data);
    
  } catch (e) {
    return { success: false, error: 'Error generando ID: ' + e.toString() };
  } finally {
    lock.releaseLock();
  }
}
/**
 * --- LÓGICA DE NEGOCIO ---
 */

function login(email, password) {
  const users = rowsToObjects(getSheet(SHEETS.USERS));
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    const { password, ...userData } = user;
    return { success: true, data: userData };
  } else {
    return { success: false, error: 'Credenciales inválidas' };
  }
}

function getMetrics() {
  const users = rowsToObjects(getSheet(SHEETS.USERS));
  const schools = rowsToObjects(getSheet(SHEETS.SCHOOLS));
  const installations = rowsToObjects(getSheet(SHEETS.INSTALLATIONS));
  
  const technicians = users.filter(u => String(u.rol).trim().toLowerCase() === 'tecnico');
  
  // Total instalaciones
  const totalInstalled = installations.length;
  
  // Calcular meta total sumando los equipos de todos los colegios registrados
  const totalRequired = schools.reduce((sum, school) => {
    return sum + (Number(school.totalequipos) || Number(school.totalEquipos) || 0);
  }, 0) || 1000; // Valor por defecto 1000 si no hay colegios aún
  
  // Por fase
  const phases = {
    NORTE: { name: 'Fase Norte', installed: 0, total: 0 },
    CENTRO_OCCIDENTE: { name: 'Fase Centro/Occidente', installed: 0, total: 0 },
    SUR_ORIENTE: { name: 'Fase Sur/Oriente', installed: 0, total: 0 }
  };
  
  schools.forEach(school => {
    const phaseKey = (school.fase || '').trim().toUpperCase().replace(/\s/g, '_');
    if (phases[phaseKey]) {
      phases[phaseKey].total += Number(school.totalequipos) || 0;
    }
  });
  
  installations.forEach(inst => {
    const school = schools.find(s => String(s.id).trim() === String(inst.colegioid).trim());
    if (school) {
      const phaseKey = (school.fase || '').trim().toUpperCase().replace(/\s/g, '_');
      if (phases[phaseKey]) {
        phases[phaseKey].installed++;
      }
    }
  });
  
  Object.keys(phases).forEach(key => {
    const p = phases[key];
    p.percentage = p.total > 0 ? Math.round((p.installed / p.total) * 100) : 0;
  });
  
  // Por técnico
  const byTechnician = technicians.map(tech => {
    const tId = String(tech.id).trim();
    const tNombre = String(tech.nombre).trim().toLowerCase();
    
    // Instalaciones del técnico
    const techInstalls = installations.filter(i => {
      const instTechId = String(i.tecnicoid || '').trim();
      return instTechId === tId || instTechId.toLowerCase() === tNombre;
    });
    
    // Colegios asignados
    const assignedSchools = schools.filter(s => {
      const assignedTechId = String(s.tecnicoid || '').trim();
      const techZona = (tech.zona || '').trim().toLowerCase();
      const schoolZona = (s.upz || '').trim().toLowerCase();
      
      if (assignedTechId) return assignedTechId === tId;
      if (schoolZona === techZona && schoolZona !== '') {
        // Verificar si alguien más tiene la asignación explícita
        // Si no, asignamos por zona al primer técnico
        const explicitTech = technicians.find(t => String(t.id).trim() === assignedTechId);
        if (explicitTech) return false;

        const firstTechInZone = technicians.find(t => (t.zona || '').trim().toLowerCase() === schoolZona);
        return firstTechInZone && String(firstTechInZone.id).trim() === tId;
      }
      return false;
    });
    
    const total = assignedSchools.reduce((sum, s) => sum + (Number(s.totalequipos) || 0), 0);
    
    return {
      id: tech.id,
      nombre: tech.nombre,
      zona: tech.zona,
      installed: techInstalls.length,
      total: total,
      percentage: total > 0 ? Math.round((techInstalls.length / total) * 100) : 0,
      hasAlerts: techInstalls.some(i => i.checkabre === 'NO' || i.checkinternet === 'NO' || i.checklicencia === 'NO')
    };
  });
  
  // Alertas QA
  const alerts = installations
    .filter(i => i.checkabre === 'NO' || i.checkinternet === 'NO' || i.checklicencia === 'NO')
    .map(i => {
      const tech = technicians.find(t => String(t.id).trim() === String(i.tecnicoid).trim() || String(t.nombre).trim().toLowerCase() === String(i.tecnicoid || '').trim().toLowerCase());
      const school = schools.find(s => String(s.id).trim() === String(i.colegioid).trim());
      
      const issues = [];
      if (i.checkabre === 'NO') issues.push('Software no abre');
      if (i.checkinternet === 'NO') issues.push('Sin internet');
      if (i.checklicencia === 'NO') issues.push('Licencia no verificada');
      
      return {
        id: i.id,
        tecnico: tech ? tech.nombre : 'Desconocido',
        colegio: school ? school.nombre : 'Desconocido',
        equipo: i.equipoid,
        fecha: i.fecha,
        issues: issues
      };
    });
  
  // Actividad diaria
  const dailyActivity = [];
  const daysShort = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = Utilities.formatDate(date, 'America/Bogota', 'yyyy-MM-dd');
    
    const dayInstalls = installations.filter(inst => {
      if (!inst.fecha) return false;
      let instDateStr = '';
      
      // Normalizar fecha de la instalación
      if (inst.fecha instanceof Date) {
        instDateStr = Utilities.formatDate(inst.fecha, 'America/Bogota', 'yyyy-MM-dd');
      } else {
        // Si es texto, intentar parsearlo o tomarlo directo si ya viene como yyyy-mm-dd
        // Asumimos formato compatible con Date() o formato ISO simple
        try {
          const d = new Date(inst.fecha);
          if (!isNaN(d.getTime())) {
            instDateStr = Utilities.formatDate(d, 'America/Bogota', 'yyyy-MM-dd');
          } else {
            instDateStr = String(inst.fecha).substring(0, 10);
          }
        } catch (e) {
          instDateStr = String(inst.fecha).substring(0, 10);
        }
      }
      return instDateStr === dateStr;
    });
    
    dailyActivity.push({ date: dateStr, day: daysShort[date.getDay()], count: dayInstalls.length });
  }

  // Colegios completados
  const schoolProgress = {};
  installations.forEach(inst => {
    const cid = String(inst.colegioid).trim();
    if (!schoolProgress[cid]) schoolProgress[cid] = 0;
    schoolProgress[cid]++;
  });
  
  const schoolsCompleted = schools.filter(school => {
    const total = Number(school.totalequipos) || 0;
    if (total === 0) return false;
    const installed = schoolProgress[String(school.id).trim()] || 0;
    return installed >= total;
  }).length;

  return {
    success: true,
    data: {
      totalInstalled,
      totalRequired,
      percentage: Math.round((totalInstalled / totalRequired) * 100),
      schoolsCompleted,
      totalSchools: schools.length,
      byPhase: phases,
      byTechnician,
      alerts,
      dailyActivity
    }
  };
}

/**
 * --- PERSISTENCIA ---
 */
function saveData(sheetName, data) {
  const sheet = getSheet(sheetName);
  if (!sheet) return { success: false, error: 'Hoja no encontrada: ' + sheetName };
  
  const rawData = sheet.getDataRange().getValues();
  const headers = rawData[0].map(h => String(h).trim().toLowerCase().replace(/\s/g, ''));
  
  let rowIndex = -1;
  // Buscar por ID si existe
  if (data.id) {
    for (let i = 1; i < rawData.length; i++) {
      if (String(rawData[i][0]) === String(data.id)) {
        rowIndex = i;
        break;
      }
    }
  }

  if (rowIndex >= 0) {
    // Actualizar
    const rowData = rawData[rowIndex];
    headers.forEach((h, i) => {
      // Solo actualizamos si el dato viene en el payload
      // El resto se deja como estaba
      if (data[h] !== undefined) rowData[i] = data[h];
    });
    sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([rowData]);
  } else {
    // Insertar
    const newRow = headers.map(h => data[h] === undefined ? '' : data[h]);
    sheet.appendRow(newRow);
  }
  return { success: true };
}

function addUser(data) { return saveData(SHEETS.USERS, data); }
// function addInstallation replaced by robust version above
function addSchool(data) { return saveData(SHEETS.SCHOOLS, data); }

function deleteUser(id) { return deleteRow(SHEETS.USERS, id); }
function deleteSchool(id) { return deleteRow(SHEETS.SCHOOLS, id); }

function deleteRow(sheetName, id) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: 'ID no encontrado' };
}

/**
 * --- HELPERS ---
 */
function getSheet(name) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
}

function rowsToObjects(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(h => String(h).trim().toLowerCase().replace(/\s/g, ''));
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function getTechnicianDetails(techId) {
  // Misma lógica de detalle...
  // (Simplificado para brevedad, pero necesario si se usa)
  const users = rowsToObjects(getSheet(SHEETS.USERS));
  const schools = rowsToObjects(getSheet(SHEETS.SCHOOLS));
  const installations = rowsToObjects(getSheet(SHEETS.INSTALLATIONS));
  
  // Buscar técnico (nombre o id)
  const tech = users.find(u => String(u.id).trim() === String(techId).trim());
  if (!tech) return { success: false, error: 'Técnico no encontrado' };
  
  const tId = String(tech.id).trim();
  const tName = String(tech.nombre).trim().toLowerCase();

  const techInstalls = installations.filter(i => {
    const instTechId = String(i.tecnicoid || '').trim();
    return instTechId === tId || instTechId.toLowerCase() === tName;
  });
  
  const techSchools = schools.filter(s => {
    const assignedId = String(s.tecnicoid || '').trim();
    if (assignedId) return assignedId === tId;
    // Lógica de zona... 
    return (String(s.upz||'').toLowerCase() === String(tech.zona||'').toLowerCase());
  });
  
  return { success: true, data: { installations: techInstalls, schools: techSchools } };
}
