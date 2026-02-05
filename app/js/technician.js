/**
 * QINAYA TRACKER - Technician Module
 */

const TechnicianView = {
  currentSchool: null,
  schools: [],
  currentLocation: null,
  installations: [],

  /**
   * Inicializar vista técnico
   */
  async init() {
    await this.loadData();
    this.render();
    this.attachEvents();
    this.requestLocation();
  },

  /**
   * Cargar datos del técnico
   */
  async loadData() {
    let user = Auth.getUser();
    if (!user) return;

    try {
      // 1. Refrescar datos del usuario actual desde el backend
      const usersRes = await API.get('getUsers');
      if (usersRes.success) {
        const freshUser = usersRes.data.find(u => u.email === user.email);
        if (freshUser) {
          user = { ...user, ...freshUser };
          if (user.zona === undefined && user.Zona) user.zona = user.Zona;
          localStorage.setItem('qinaya_user', JSON.stringify(user));
        }
      }

      // 2. Obtener colegios y filtrar
      const schoolsRes = await API.get('getSchools');
      if (schoolsRes.success) {
        this.schools = schoolsRes.data.filter(s => {
          const assignedTechId = String(s.tecnicoid || s.tecnicoId || '').trim();
          const userId = String(user.id || '').trim();
          const userZone = (user.zona || '').trim().toLowerCase();
          const schoolZone = (s.upz || '').trim().toLowerCase();

          // A. Coincidencia exacta de ID (Prioridad Máxima - Case Insensitive)
          if (assignedTechId) {
            return assignedTechId.toLowerCase() === userId.toLowerCase();
          }

          // B. Coincidencia de Zona (Fallback)
          if (userZone && userZone !== 'todas') {
            return schoolZone === userZone;
          }

          return false;
        });

        // Si no hay colegio seleccionado o el que estaba ya no está en la lista asignada
        if (!this.currentSchool || !this.schools.find(s => s.id === this.currentSchool.id)) {
          this.currentSchool = this.schools.length > 0 ? this.schools[0] : null;
        } else {
          // Mantener el seleccionado pero con datos frescos
          this.currentSchool = this.schools.find(s => s.id === this.currentSchool.id);
        }
      }

      // 3. Obtener instalaciones del técnico
      const installsRes = await API.get('getInstallations', { tecnicoId: user.id });
      if (installsRes.success) {
        this.installations = installsRes.data;
      }
    } catch (error) {
      console.error('Error loading technician data:', error);
    }
  },

  /**
   * Solicitar ubicación
   */
  requestLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this.updateLocationDisplay();
        },
        (error) => {
          console.error('Geolocation error:', error);
          Toast.show('No se pudo obtener la ubicación', 'warning');
        },
        CONFIG.GEO
      );
    }
  },

  /**
   * Actualizar display de ubicación con nombre inteligente
   */
  updateLocationDisplay() {
    const geoEl = document.getElementById('geo-coords');
    if (geoEl && this.currentLocation) {
      let locationText = `${this.currentLocation.lat.toFixed(6)}, ${this.currentLocation.lng.toFixed(6)}`;

      // Calcular distancia al colegio actual
      if (this.currentSchool && this.currentSchool.lat && this.currentSchool.lng) {
        const dist = this.getDistance(
          this.currentLocation.lat, this.currentLocation.lng,
          this.currentSchool.lat, this.currentSchool.lng
        );

        // Si está a menos de 500m (0.5km), dice que está en el sitio
        if (dist < 0.5) {
          locationText = `📍 En sitio: ${this.currentSchool.nombre}`;
        } else {
          locationText = `📍 A ${dist.toFixed(2)}km de ${this.currentSchool.nombre}`;
        }
      }

      geoEl.textContent = locationText;
    }
  },

  /**
   * Helper: Distancia Haversine en km
   */
  getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio Tierra km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Renderizar vista
   */
  render() {
    const container = document.getElementById('main-content');
    if (!container) return;

    const user = Auth.getUser();
    const school = this.currentSchool;

    // Filtro robusto de fecha (YYYY-MM-DD)
    const todayVal = new Date().toISOString().split('T')[0];
    const todayInstalls = this.installations.filter(i => {
      // 1. Validar fecha
      if (!i.fecha) return false;
      let iDate = '';
      if (typeof i.fecha === 'string') {
        iDate = i.fecha.substring(0, 10);
      } else {
        // Fallback porsiacaso
        try { iDate = new Date(i.fecha).toISOString().split('T')[0]; } catch (e) { }
      }

      // 2. Validar Colegio (Manejar camelCase y lowercase)
      const iSchoolId = i.colegioId || i.colegioid;

      return iDate === todayVal && String(iSchoolId) === String(school?.id);
    });

    // Calcular total de equipos asignados a todos los colegios del técnico
    const totalAssignedEquipment = this.schools.reduce((acc, s) => {
      return acc + (parseInt(s.totalequipos || s.totalEquipos) || 0);
    }, 0);

    container.innerHTML = `
      <!-- Header del Técnico -->
      <div class="tech-header">
        <div class="tech-greeting">
          <h2>¡Hola, ${user?.nombre?.split(' ')[0]}! 👋</h2>
          <p>Zona asignada: ${user?.zona || 'No asignada'}</p>
        </div>
        
        <div class="today-school">
          <div class="today-school-label">📍 Colegio de Trabajo</div>
          ${this.schools.length > 1 ? `
            <select class="form-select school-selector" id="school-selector" style="margin-top: var(--spacing-xs); background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3);">
              ${this.schools.map(s => `
                <option value="${s.id}" ${s.id === school?.id ? 'selected' : ''}>${s.nombre}</option>
              `).join('')}
            </select>
            <div style="font-size: 0.85em; margin-top: 5px; opacity: 0.9;">
               🏫 ${this.schools.length} Colegios | 💻 ${totalAssignedEquipment} Equipos Totales
            </div>
          ` : school ? `
            <div class="today-school-name">${school.nombre}</div>
          ` : `
            <div class="today-school-name">Sin colegios en la zona</div>
          `}
          
          ${school ? `
            <div style="font-size: var(--font-size-sm); opacity: 0.9; margin-top: var(--spacing-xs);">
              ${school.direccion}
            </div>
          ` : ''}
        </div>
      </div>
      
      <div class="dashboard-grid">
        <!-- Stats del día -->
        <div class="col-4">
          <div class="card">
            <div class="stat-widget">
              <div class="stat-icon success">✅</div>
              <div class="stat-card">
                <div class="stat-value">${todayInstalls.length}</div>
                <div class="stat-label">Instalaciones Hoy</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-4">
          <div class="card">
            <div class="stat-widget">
              <div class="stat-icon primary">💻</div>
              <div class="stat-card">
                <div class="stat-value">${school?.totalequipos || school?.totalEquipos || 0}</div>
                <div class="stat-label">Equipos en Colegio</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-4">
          <div class="card">
            <div class="stat-widget">
              <div class="stat-icon warning">⏳</div>
              <div class="stat-card">
                <div class="stat-value">${(school?.totalequipos || school?.totalEquipos || 0) - todayInstalls.length}</div>
                <div class="stat-label">Pendientes</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Formulario de Instalación -->
        <div class="col-12">
          <form class="install-form" id="install-form">
            <h3 style="margin-bottom: var(--spacing-lg);">📝 Registrar Nueva Instalación</h3>
            
            <!-- Sección: Datos del Equipo -->
            <div class="form-section">
              <h4 class="section-title">💻 Datos del Equipo</h4>
              <div class="dashboard-grid" style="gap: var(--spacing-md);">
                <div class="col-4">
                  <div class="form-group">
                    <label class="form-label">ID del Equipo *</label>
                    <input type="text" class="form-input" id="equipo-id" 
                           placeholder="Ej: PC-001" autocomplete="off" required>
                  </div>
                </div>
                <div class="col-4">
                  <div class="form-group">
                    <label class="form-label">Marca / Modelo</label>
                    <input type="text" class="form-input" id="marca-modelo" 
                           placeholder="Ej: HP ProDesk 400" autocomplete="off">
                  </div>
                </div>
                <div class="col-4">
                  <div class="form-group">
                    <label class="form-label">Versión Qinaya</label>
                    <select class="form-input form-select" id="version-qinaya">
                      <option value="2.1.0">v2.1.0 (Actual)</option>
                      <option value="2.0.5">v2.0.5</option>
                      <option value="2.0.0">v2.0.0</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Sección: Lista de Verificación -->
            <div class="form-section">
              <h4 class="section-title">✅ Lista de Verificación</h4>
              <div class="checklist">
                
                <div class="checklist-row" id="row-abre">
                  <div class="checklist-label">¿El software Qinaya abre sin errores?</div>
                  <div class="checklist-options">
                    <label class="check-option success">
                      <input type="radio" name="check-abre" value="yes"> <span>OK</span>
                    </label>
                    <label class="check-option danger">
                      <input type="radio" name="check-abre" value="no"> <span>Alerta</span>
                    </label>
                  </div>
                </div>

                <div class="checklist-row" id="row-internet">
                  <div class="checklist-label">¿La conexión a internet está activa?</div>
                  <div class="checklist-options">
                    <label class="check-option success">
                      <input type="radio" name="check-internet" value="yes"> <span>OK</span>
                    </label>
                    <label class="check-option danger">
                      <input type="radio" name="check-internet" value="no"> <span>Alerta</span>
                    </label>
                  </div>
                </div>

                <div class="checklist-row" id="row-licencia">
                  <div class="checklist-label">¿La licencia fue verificada correctamente?</div>
                  <div class="checklist-options">
                    <label class="check-option success">
                      <input type="radio" name="check-licencia" value="yes"> <span>OK</span>
                    </label>
                    <label class="check-option danger">
                      <input type="radio" name="check-licencia" value="no"> <span>Alerta</span>
                    </label>
                  </div>
                </div>

              </div>
              
              <!-- Alert si hay problemas -->
              <div class="alert alert-warning hidden" id="qa-warning" style="margin-top: var(--spacing-md);">
                ⚠️ <strong>Atención:</strong> Has marcado algún punto como "No". 
                Se generará una alerta para el coordinador.
              </div>
            </div>
            
            <!-- Sección: Evidencias -->
            <div class="form-section">
              <h4 class="section-title">📸 Evidencias (Links de Google Drive)</h4>
              <div class="form-group">
                <label class="form-label">Link de foto/video del equipo con Qinaya abierto</label>
                <input type="url" class="form-input" id="evidencia-equipo" 
                       placeholder="https://drive.google.com/...">
              </div>
              <div class="form-group">
                <label class="form-label">Link de foto del laboratorio completo (opcional)</label>
                <input type="url" class="form-input" id="evidencia-lab" 
                       placeholder="https://drive.google.com/...">
              </div>
            </div>
            
            <!-- Sección: Geolocalización -->
            <div class="form-section">
              <h4 class="section-title">📍 Ubicación</h4>
              <div class="geo-display">
                <span class="geo-icon">🗺️</span>
                <div>
                  <div style="font-size: var(--font-size-sm); color: var(--color-text-muted);">Coordenadas GPS</div>
                  <div class="geo-coords" id="geo-coords">Obteniendo ubicación...</div>
                </div>
                <button type="button" class="btn btn-secondary btn-sm" id="refresh-location">
                  🔄 Actualizar
                </button>
              </div>
            </div>
            
            <!-- Sección: Notas -->
            <div class="form-section">
              <h4 class="section-title">📝 Notas Adicionales</h4>
              <div class="form-group">
                <textarea class="form-input form-textarea" id="notas" 
                          placeholder="Observaciones, problemas encontrados, etc."></textarea>
              </div>
            </div>
            
            <!-- Botón Submit -->
            <button type="submit" class="btn btn-success btn-lg w-full" id="submit-btn">
              ✅ Registrar Instalación
            </button>
          </form>
        </div>
        
        <!-- Historial del día -->
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h4 class="card-title">📋 Instalaciones de Hoy</h4>
              <span class="badge badge-primary">${todayInstalls.length} registros</span>
            </div>
            ${todayInstalls.length === 0 ? `
              <div class="text-center text-muted" style="padding: var(--spacing-xl);">
                <div style="font-size: 48px; margin-bottom: var(--spacing-md);">📝</div>
                <p>Aún no hay instalaciones registradas hoy</p>
              </div>
            ` : `
              <div class="table-container">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Equipo</th>
                      <th>Marca/Modelo</th>
                      <th>ID Registro</th>
                      <th>Estado</th>
                      <th>Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${todayInstalls.map(inst => {
      // Normalizar llaves para visualización (backend retorna lowercase)
      const eqId = inst.equipoid || inst.equipoId || '-';
      const brand = inst.marcamodelo || inst.marcaModelo || '-';
      const installId = inst.id || '-';

      // Verificar Estado (SI/NO o bool)
      const okAbre = inst.checkabre === 'SI' || inst.checkAbre === true;
      const okNet = inst.checkinternet === 'SI' || inst.checkInternet === true;
      const okLic = inst.checklicencia === 'SI' || inst.checkLicencia === true;

      const isOk = okAbre && okNet && okLic;

      return `
                      <tr>
                        <td><strong>${eqId}</strong></td>
                        <td>${brand}</td>
                        <td class="text-muted" style="font-size: 0.85em;">${installId}</td>
                        <td>
                          ${isOk
          ? '<span class="badge badge-success">✅ OK</span>'
          : '<span class="badge badge-warning">⚠️ Alerta</span>'
        }
                        </td>
                        <td class="text-muted">Hace un momento</td>
                      </tr>
                    `}).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        </div>
        
        <!-- Botón Acta del Día -->
        ${todayInstalls.length > 0 ? `
        <div class="col-12" style="text-align: center; margin-top: var(--spacing-md);">
          <button type="button" class="btn btn-primary" id="btn-acta-diaria" style="padding: 12px 24px;">
            📄 Generar Acta del Día
          </button>
        </div>
        ` : ''}
      </div>
    `;
  },

  /**
   * Adjuntar eventos
   */
  attachEvents() {
    // Form submit
    const form = document.getElementById('install-form');
    form?.addEventListener('submit', (e) => this.handleSubmit(e));

    // Selector de colegio
    document.getElementById('school-selector')?.addEventListener('change', (e) => {
      const schoolId = e.target.value;
      this.currentSchool = this.schools.find(s => s.id === schoolId);
      this.render();
      this.attachEvents();
    });

    // Checklist items (Radios)
    document.querySelectorAll('.checklist-options input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', () => this.updateChecklistUI());
    });

    // Refresh location
    document.getElementById('refresh-location')?.addEventListener('click', () => {
      this.requestLocation();
    });

    // Acta del Día button
    document.getElementById('btn-acta-diaria')?.addEventListener('click', () => {
      this.generateDailyReport();
    });
  },

  /**
   * Actualizar UI del checklist
   */
  updateChecklistUI() {
    const abreVal = document.querySelector('input[name="check-abre"]:checked')?.value;
    const internetVal = document.querySelector('input[name="check-internet"]:checked')?.value;
    const licenciaVal = document.querySelector('input[name="check-licencia"]:checked')?.value;

    const warning = document.getElementById('qa-warning');

    // Mostrar warning si alguno es NO
    if (abreVal === 'no' || internetVal === 'no' || licenciaVal === 'no') {
      warning?.classList.remove('hidden');
    } else {
      warning?.classList.add('hidden');
    }
  },

  /**
   * Manejar envío del formulario
   */
  async handleSubmit(e) {
    e.preventDefault();

    const user = Auth.getUser();
    const submitBtn = document.getElementById('submit-btn');

    if (!user || !this.currentSchool) {
      Toast.show('Error: selecciona un colegio', 'danger');
      return;
    }

    // Obtener valores de los radio buttons
    const abreVal = document.querySelector('input[name="check-abre"]:checked')?.value;
    const internetVal = document.querySelector('input[name="check-internet"]:checked')?.value;
    const licenciaVal = document.querySelector('input[name="check-licencia"]:checked')?.value;

    // Obtener valores mapeados a las cabeceras del Sheet (minúsculas y sin espacios)
    const data = {
      tecnicoid: user.id,
      colegioid: this.currentSchool.id,
      equipoid: document.getElementById('equipo-id').value.trim(),
      marcamodelo: document.getElementById('marca-modelo').value.trim(),
      versionqinaya: document.getElementById('version-qinaya').value,

      // Convertir 'yes'/'no' a 'SI'/'NO' para el backend
      checkabre: abreVal === 'yes' ? 'SI' : 'NO',
      checkinternet: internetVal === 'yes' ? 'SI' : 'NO',
      checklicencia: licenciaVal === 'yes' ? 'SI' : 'NO',

      evidenciaequipo: document.getElementById('evidencia-equipo').value.trim(),
      evidencialab: document.getElementById('evidencia-lab').value.trim(),
      lat: this.currentLocation?.lat || '',
      lng: this.currentLocation?.lng || '',
      notas: document.getElementById('notas').value.trim(),
      fecha: new Date().toISOString() // Importante para filtros por fecha
    };

    // Validación
    if (!data.equipoid) {
      Toast.show('Ingresa el ID del equipo', 'warning');
      return;
    }

    // Deshabilitar botón
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Guardando...';

    try {
      // API call con la acción correcta (addInstallation)
      const response = await API.post('addInstallation', data);

      if (response.success) {
        Toast.show('✅ Instalación registrada correctamente', 'success');

        // Limpiar formulario y radios
        document.getElementById('install-form').reset();
        document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
        this.updateChecklistUI(); // Reset UI

        // Recargar datos y vista
        await this.loadData();
        this.render();
        this.attachEvents();

        // Verificar si el colegio quedó completo
        this.checkSchoolCompletion();
      } else {
        console.error('API Error:', response.error);
        Toast.show('Error al guardar: ' + (response.error || 'Desconocido'), 'danger');
      }
    } catch (error) {
      console.error('Error saving installation:', error);
      Toast.show('Error de conexión', 'danger');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '✅ Registrar Instalación';
    }
  },

  /**
   * Generar Acta del Día (Daily Report)
   */
  generateDailyReport() {
    const user = Auth.getUser();
    const school = this.currentSchool;
    const todayVal = new Date().toISOString().split('T')[0];

    // Filter today's installations for this school
    const todayInstalls = this.installations.filter(i => {
      if (!i.fecha) return false;
      const iDate = typeof i.fecha === 'string' ? i.fecha.substring(0, 10) : '';
      const iSchoolId = i.colegioId || i.colegioid;
      return iDate === todayVal && String(iSchoolId) === String(school?.id);
    });

    if (todayInstalls.length === 0) {
      Toast.show('No hay instalaciones para generar el acta', 'warning');
      return;
    }

    // Count OK vs Alerta
    let okCount = 0;
    let alertCount = 0;
    todayInstalls.forEach(inst => {
      const okAbre = inst.checkabre === 'SI' || inst.checkAbre === true;
      const okNet = inst.checkinternet === 'SI' || inst.checkInternet === true;
      const okLic = inst.checklicencia === 'SI' || inst.checkLicencia === true;
      if (okAbre && okNet && okLic) okCount++;
      else alertCount++;
    });

    const dateFormatted = new Date().toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    // Generate printable HTML
    const actaHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Acta de Entrega Diaria - ${dateFormatted}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
    .header { display: flex; align-items: center; gap: 20px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
    .header img { height: 50px; }
    .header h1 { font-size: 24px; color: #2563eb; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 8px; }
    .meta-item { font-size: 14px; }
    .meta-item strong { color: #1e40af; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 13px; }
    th { background: #2563eb; color: white; }
    tr:nth-child(even) { background: #f8fafc; }
    .badge-ok { background: #22c55e; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; }
    .badge-alert { background: #eab308; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; }
    .summary { display: flex; gap: 40px; margin-bottom: 40px; }
    .summary-item { text-align: center; }
    .summary-item .value { font-size: 32px; font-weight: bold; color: #2563eb; }
    .summary-item .label { font-size: 12px; color: #64748b; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 60px; }
    .signature-box { border-top: 2px solid #333; padding-top: 10px; text-align: center; }
    .signature-box .name { font-weight: bold; margin-bottom: 4px; }
    .signature-box .role { font-size: 12px; color: #64748b; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <img src="assets/logo-qinaya.png" alt="Qinaya Logo">
    <div>
      <h1>ACTA DE ENTREGA DIARIA</h1>
      <p style="color: #64748b; font-size: 14px;">Instalación de Software Educativo Qinaya</p>
    </div>
  </div>

  <div class="meta">
    <div class="meta-item"><strong>Fecha:</strong> ${dateFormatted}</div>
    <div class="meta-item"><strong>Técnico:</strong> ${user?.nombre || 'N/A'} (${user?.id || 'N/A'})</div>
    <div class="meta-item"><strong>Colegio:</strong> ${school?.nombre || 'N/A'}</div>
    <div class="meta-item"><strong>Dirección:</strong> ${school?.direccion || 'N/A'}</div>
  </div>

  <div class="summary">
    <div class="summary-item">
      <div class="value">${todayInstalls.length}</div>
      <div class="label">Instalaciones Hoy</div>
    </div>
    <div class="summary-item">
      <div class="value" style="color: #22c55e;">${okCount}</div>
      <div class="label">Sin Problemas</div>
    </div>
    <div class="summary-item">
      <div class="value" style="color: #eab308;">${alertCount}</div>
      <div class="label">Con Alertas</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>ID Registro</th>
        <th>Equipo</th>
        <th>Marca/Modelo</th>
        <th>Estado</th>
      </tr>
    </thead>
    <tbody>
      ${todayInstalls.map((inst, idx) => {
      const eqId = inst.equipoid || inst.equipoId || '-';
      const brand = inst.marcamodelo || inst.marcaModelo || '-';
      const okAbre = inst.checkabre === 'SI' || inst.checkAbre === true;
      const okNet = inst.checkinternet === 'SI' || inst.checkInternet === true;
      const okLic = inst.checklicencia === 'SI' || inst.checkLicencia === true;
      const isOk = okAbre && okNet && okLic;
      return `
        <tr>
          <td>${idx + 1}</td>
          <td>${inst.id || '-'}</td>
          <td>${eqId}</td>
          <td>${brand}</td>
          <td><span class="${isOk ? 'badge-ok' : 'badge-alert'}">${isOk ? 'OK' : 'ALERTA'}</span></td>
        </tr>`;
    }).join('')}
    </tbody>
  </table>

  <div class="signatures">
    <div class="signature-box">
      <div class="name">${user?.nombre || '________________________'}</div>
      <div class="role">Técnico Instalador</div>
    </div>
    <div class="signature-box">
      <div class="name">________________________</div>
      <div class="role">Coordinador del Colegio</div>
    </div>
  </div>

  <div class="footer">
    Documento generado automáticamente por Qinaya Tracker | ${new Date().toLocaleString('es-CO')}
  </div>
</body>
</html>`;

    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(actaHtml);
    printWindow.document.close();
    printWindow.focus();
    // Auto-print after a short delay
    setTimeout(() => printWindow.print(), 500);
  },

  /**
   * Generar Acta de Colegio Completado
   */
  generateSchoolCompletionReport() {
    const user = Auth.getUser();
    const school = this.currentSchool;

    // Get ALL installations for this school (not just today)
    const schoolInstalls = this.installations.filter(i => {
      const iSchoolId = i.colegioId || i.colegioid;
      return String(iSchoolId) === String(school?.id);
    });

    const totalEquipos = parseInt(school?.totalequipos || school?.totalEquipos) || 0;

    let okCount = 0;
    let alertCount = 0;
    schoolInstalls.forEach(inst => {
      const okAbre = inst.checkabre === 'SI' || inst.checkAbre === true;
      const okNet = inst.checkinternet === 'SI' || inst.checkInternet === true;
      const okLic = inst.checklicencia === 'SI' || inst.checkLicencia === true;
      if (okAbre && okNet && okLic) okCount++;
      else alertCount++;
    });

    const dateFormatted = new Date().toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const actaHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Acta de Entrega - ${school?.nombre || 'Colegio'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
    .header { display: flex; align-items: center; gap: 20px; border-bottom: 3px solid #22c55e; padding-bottom: 20px; margin-bottom: 30px; }
    .header img { height: 50px; }
    .header h1 { font-size: 24px; color: #22c55e; }
    .completion-badge { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 15px 30px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
    .completion-badge h2 { font-size: 20px; margin-bottom: 5px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 30px; background: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #bbf7d0; }
    .meta-item { font-size: 14px; }
    .meta-item strong { color: #166534; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
    th { background: #22c55e; color: white; }
    tr:nth-child(even) { background: #f8fafc; }
    .badge-ok { background: #22c55e; color: white; padding: 3px 6px; border-radius: 4px; font-size: 10px; }
    .badge-alert { background: #eab308; color: white; padding: 3px 6px; border-radius: 4px; font-size: 10px; }
    .summary { display: flex; gap: 40px; margin-bottom: 40px; justify-content: center; }
    .summary-item { text-align: center; background: #f8fafc; padding: 20px 30px; border-radius: 8px; }
    .summary-item .value { font-size: 28px; font-weight: bold; color: #22c55e; }
    .summary-item .label { font-size: 12px; color: #64748b; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 60px; }
    .signature-box { border-top: 2px solid #333; padding-top: 10px; text-align: center; }
    .signature-box .name { font-weight: bold; margin-bottom: 4px; }
    .signature-box .role { font-size: 12px; color: #64748b; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <img src="assets/logo-qinaya.png" alt="Qinaya Logo">
    <div>
      <h1>ACTA DE ENTREGA FINAL</h1>
      <p style="color: #64748b; font-size: 14px;">Colegio Completado al 100%</p>
    </div>
  </div>

  <div class="completion-badge">
    <h2>🎉 ¡COLEGIO COMPLETADO!</h2>
    <p>Todas las instalaciones han sido realizadas exitosamente</p>
  </div>

  <div class="meta">
    <div class="meta-item"><strong>Fecha de Cierre:</strong> ${dateFormatted}</div>
    <div class="meta-item"><strong>Técnico Responsable:</strong> ${user?.nombre || 'N/A'}</div>
    <div class="meta-item"><strong>Colegio:</strong> ${school?.nombre || 'N/A'}</div>
    <div class="meta-item"><strong>Dirección:</strong> ${school?.direccion || 'N/A'}</div>
    <div class="meta-item"><strong>UPZ/Zona:</strong> ${school?.upz || 'N/A'}</div>
    <div class="meta-item"><strong>Total Equipos:</strong> ${totalEquipos}</div>
  </div>

  <div class="summary">
    <div class="summary-item">
      <div class="value">${schoolInstalls.length}</div>
      <div class="label">Total Instalaciones</div>
    </div>
    <div class="summary-item">
      <div class="value" style="color: #22c55e;">${okCount}</div>
      <div class="label">Sin Problemas</div>
    </div>
    <div class="summary-item">
      <div class="value" style="color: #eab308;">${alertCount}</div>
      <div class="label">Con Alertas</div>
    </div>
  </div>

  <h3 style="margin-bottom: 15px; color: #166534;">Detalle de Instalaciones</h3>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>ID</th>
        <th>Equipo</th>
        <th>Marca/Modelo</th>
        <th>Fecha</th>
        <th>Estado</th>
      </tr>
    </thead>
    <tbody>
      ${schoolInstalls.map((inst, idx) => {
      const eqId = inst.equipoid || inst.equipoId || '-';
      const brand = inst.marcamodelo || inst.marcaModelo || '-';
      const fecha = inst.fecha ? (typeof inst.fecha === 'string' ? inst.fecha.substring(0, 10) : '') : '-';
      const okAbre = inst.checkabre === 'SI' || inst.checkAbre === true;
      const okNet = inst.checkinternet === 'SI' || inst.checkInternet === true;
      const okLic = inst.checklicencia === 'SI' || inst.checkLicencia === true;
      const isOk = okAbre && okNet && okLic;
      return `
        <tr>
          <td>${idx + 1}</td>
          <td>${inst.id || '-'}</td>
          <td>${eqId}</td>
          <td>${brand}</td>
          <td>${fecha}</td>
          <td><span class="${isOk ? 'badge-ok' : 'badge-alert'}">${isOk ? 'OK' : 'ALERTA'}</span></td>
        </tr>`;
    }).join('')}
    </tbody>
  </table>

  <div class="signatures">
    <div class="signature-box">
      <div class="name">${user?.nombre || '________________________'}</div>
      <div class="role">Técnico Instalador</div>
    </div>
    <div class="signature-box">
      <div class="name">________________________</div>
      <div class="role">Coordinador del Colegio</div>
    </div>
  </div>

  <div class="footer">
    Documento generado automáticamente por Qinaya Tracker | ${new Date().toLocaleString('es-CO')}
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(actaHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  },

  /**
   * Verificar si el colegio está completo después de guardar
   */
  checkSchoolCompletion() {
    const school = this.currentSchool;
    if (!school) return;

    const totalEquipos = parseInt(school.totalequipos || school.totalEquipos) || 0;
    if (totalEquipos === 0) return;

    // Count installations for this school
    const schoolInstalls = this.installations.filter(i => {
      const iSchoolId = i.colegioId || i.colegioid;
      return String(iSchoolId) === String(school.id);
    });

    if (schoolInstalls.length >= totalEquipos) {
      // School is complete! Show celebration and offer report
      Toast.show('🎉 ¡Colegio completado al 100%!', 'success');

      // Ask if they want to generate the completion report
      setTimeout(() => {
        if (confirm(`¡Felicidades! Has completado todas las instalaciones de ${school.nombre}.\n\n¿Deseas generar el Acta de Entrega Final?`)) {
          this.generateSchoolCompletionReport();
        }
      }, 1000);
    }
  }
};

window.TechnicianView = TechnicianView;
