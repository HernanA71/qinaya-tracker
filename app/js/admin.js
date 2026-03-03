/**
 * QINAYA TRACKER - Admin Dashboard Module
 */

const AdminDashboard = {
  metrics: null,
  selectedTechnician: null,
  currentView: 'dashboard', // dashboard, technician-detail, reports, statistics
  currentMonth: new Date(),

  /**
   * Inicializar dashboard admin
   */
  async init() {
    await this.loadMetrics();
    this.render();
    this.attachEvents();
  },

  /**
   * Cargar métricas
   */
  async loadMetrics() {
    try {
      const response = await API.get('getMetrics');
      if (response && response.success) {
        this.metrics = response.data;
        return true;
      } else {
        console.error('API Error:', response?.error || 'Unknown error');
        Toast.show('Error del servidor: ' + (response?.error || 'No se pudo obtener datos'), 'danger');
        return false;
      }
    } catch (error) {
      console.error('Network Error loading metrics:', error);
      Toast.show('Error de conexión con Google Sheets. Verifica la URL y permisos.', 'danger');
      return false;
    }
  },

  /**
   * Renderizar según vista actual
   */
  render() {
    switch (this.currentView) {
      case 'technician-detail':
        this.renderTechnicianDetail();
        break;
      case 'reports':
        this.renderReports();
        break;
      case 'statistics':
        this.renderStatistics();
        break;
      case 'bitacora':
        this.renderBitacora();
        break;
      default:
        this.renderDashboard();
    }
  },

  /**
   * Renderizar vista de Bitácora del Día
   */
  async renderBitacora() {
    const container = document.getElementById('main-content');
    if (!container) return;

    if (!this.metrics) return;

    container.innerHTML = `
      <div class="loader-overlay"><div class="loader"></div></div>
    `;

    let schools = [];
    try {
      const resp = await API.get('getSchools');
      if (resp && resp.success) schools = resp.data;
    } catch (e) { }

    const todayVal = new Date().toISOString().split('T')[0];

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">📝 Bitácora del Día</h1>
        <p class="page-subtitle">Acta de resumen logístico de instalación en sitio</p>
      </div>
      
      <div class="card" style="max-width: 800px; margin: 0 auto; margin-bottom: 2rem;">
        <form id="bitacora-form">
          <div class="dashboard-grid">
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Fecha *</label>
                <input type="date" class="form-input" id="bit-fecha" value="${todayVal}" required>
              </div>
            </div>
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Colegio *</label>
                <!-- Usamos input text para flexibilidad y datalist para autocompletar -->
                <input list="lista-colegios" class="form-input" id="bit-colegio" placeholder="Escriba o seleccione..." required>
                <datalist id="lista-colegios">
                  ${schools.map(s => `<option value="${s.nombre}">`).join('')}
                </datalist>
              </div>
            </div>
          </div>
          <div class="dashboard-grid mt-3" style="margin-top: 1rem;">
            <div class="col-4">
              <div class="form-group">
                <label class="form-label">Cant. Computadores *</label>
                <input type="number" class="form-input" id="bit-computadores" required>
              </div>
            </div>
            <div class="col-4">
              <div class="form-group">
                <label class="form-label">Hora de llegada *</label>
                <input type="time" class="form-input" id="bit-llegada" required>
              </div>
            </div>
            <div class="col-4">
              <div class="form-group">
                <label class="form-label">Hora de salida</label>
                <input type="time" class="form-input" id="bit-salida">
              </div>
            </div>
          </div>
          
          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label">Eventos relevantes del día y cómo se solucionaron *</label>
            <textarea class="form-input form-textarea" id="bit-eventos" required style="min-height: 100px;"></textarea>
          </div>
          
          <div style="margin-top: 1.5rem; border-top: 1px solid var(--color-border); padding-top: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <h4>Pendientes y Compromisos</h4>
              <button type="button" class="btn btn-sm btn-secondary" id="btn-add-pendiente">+ Añadir Fila</button>
            </div>
            <div class="table-container">
              <table class="table" style="min-width: 100%;">
                <thead>
                  <tr>
                    <th>Descripción de pendiente</th>
                    <th>Responsable</th>
                    <th>Fecha máxima</th>
                    <th style="width: 50px;"></th>
                  </tr>
                </thead>
                <tbody id="pendientes-tbody">
                  <tr class="pendiente-row">
                    <td><input type="text" class="form-input pen-desc" placeholder="Descripción..."></td>
                    <td><input type="text" class="form-input pen-resp" placeholder="Responsable..."></td>
                    <td><input type="date" class="form-input pen-fecha"></td>
                    <td><button type="button" class="btn btn-sm btn-ghost btn-icon" onclick="this.closest('tr').remove()" title="Eliminar fila">🗑️</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <button type="button" class="btn btn-primary w-full hidden" style="margin-top: 1.5rem; padding: 12px 24px;" id="btn-generar-bitacora">
            📄 Generar e Imprimir Acta de Bitácora
          </button>
        </form>
      </div>
    `;

    const form = document.getElementById('bitacora-form');
    const btn = document.getElementById('btn-generar-bitacora');

    form.addEventListener('input', () => {
      if (form.checkValidity()) {
        btn.classList.remove('hidden');
      } else {
        btn.classList.add('hidden');
      }
    });

    document.getElementById('btn-generar-bitacora').addEventListener('click', () => {
      if (form.checkValidity()) {
        this.generateBitacoraReport();
      } else {
        form.reportValidity();
      }
    });

    document.getElementById('btn-add-pendiente').addEventListener('click', () => {
      const tbody = document.getElementById('pendientes-tbody');
      const tr = document.createElement('tr');
      tr.className = 'pendiente-row';
      tr.innerHTML = `
        <td><input type="text" class="form-input pen-desc" placeholder="Descripción..."></td>
        <td><input type="text" class="form-input pen-resp" placeholder="Responsable..."></td>
        <td><input type="date" class="form-input pen-fecha"></td>
        <td><button type="button" class="btn btn-sm btn-ghost btn-icon" onclick="this.closest('tr').remove()" title="Eliminar fila">🗑️</button></td>
      `;
      tbody.appendChild(tr);
    });

    // Adjuntar mismos eventos globales por si acaso
    this.attachEvents();
  },

  generateBitacoraReport() {
    const fecha = document.getElementById('bit-fecha').value;
    const colegio = document.getElementById('bit-colegio').value;
    const computadores = document.getElementById('bit-computadores').value;
    const llegada = document.getElementById('bit-llegada').value;
    const salida = document.getElementById('bit-salida').value;
    const eventos = document.getElementById('bit-eventos').value || 'Ninguno';

    // Obtener los pendientes de la tabla
    const rows = document.querySelectorAll('.pendiente-row');
    const pendientesList = [];
    rows.forEach(row => {
      const desc = row.querySelector('.pen-desc').value.trim();
      const resp = row.querySelector('.pen-resp').value.trim();
      const date = row.querySelector('.pen-fecha').value;
      if (desc || resp || date) {
        pendientesList.push({
          descripcion: desc || 'Sin descripción',
          responsable: resp || 'N/A',
          fechaMax: date ? new Date(new Date(date).getTime() + new Date(date).getTimezoneOffset() * 60000).toLocaleDateString('es-CO') : 'N/A'
        });
      }
    });

    const user = Auth.getUser();

    // Función segura para parsear fecha UTC y no perder un día 
    let dateObj = new Date(fecha);
    let offset = dateObj.getTimezoneOffset() * 60000;
    let localDate = new Date(dateObj.getTime() + offset);
    const dateFormatted = localDate.toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const actaHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Bitácora del Día - ${dateFormatted}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
    .header { display: flex; align-items: center; gap: 20px; border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
    .header img { height: 50px; }
    .header h1 { font-size: 24px; color: #6366f1; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 30px; background: #e0e7ff; padding: 20px; border-radius: 8px; }
    .meta-item { font-size: 14px; }
    .meta-item strong { color: #3730a3; }
    .section { margin-bottom: 25px; }
    .section h3 { font-size: 16px; color: #4338ca; border-bottom: 1px solid #c7d2fe; padding-bottom: 5px; margin-bottom: 10px; }
    .section p { font-size: 13px; line-height: 1.5; white-space: pre-wrap; background: #f8fafc; padding: 10px; border: 1px solid #e2e8f0; border-radius: 4px; min-height: 40px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
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
    <img src="assets/logo-qinaya.png" alt="Qinaya Logo" onerror="this.src='../assets/logo-qinaya.png';">
    <div>
      <h1>BITÁCORA DEL DÍA EN SITIO</h1>
      <p style="color: #64748b; font-size: 14px;">Resumen Diario de Instalación</p>
    </div>
  </div>

  <div class="meta">
    <div class="meta-item"><strong>Fecha:</strong> ${dateFormatted}</div>
    <div class="meta-item"><strong>Colegio:</strong> ${colegio}</div>
    <div class="meta-item"><strong>Creador del Acta:</strong> ${user?.nombre || 'N/A'}</div>
    <div class="meta-item"><strong>Cant. Computadores:</strong> ${computadores} equipos</div>
    <div class="meta-item"><strong>Hora Llegada:</strong> ${llegada}</div>
    <div class="meta-item"><strong>Hora Salida:</strong> ${salida || 'N/A'}</div>
  </div>

  <div class="section">
    <h3>Eventos relevantes del día y cómo se solucionaron</h3>
    <p>${eventos}</p>
  </div>

  <div class="section" style="margin-top: 30px;">
    <h3>Pendientes y Compromisos</h3>
    ${pendientesList.length === 0 ? '<p>No hay pendientes registrados.</p>' : `
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Descripción de pendiente</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Responsable</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Fecha Máx.</th>
          </tr>
        </thead>
        <tbody>
          ${pendientesList.map(p => `
            <tr>
              <td style="padding: 10px; border: 1px solid #cbd5e1;">${p.descripcion}</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1;">${p.responsable}</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1;">${p.fechaMax}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `}
  </div>

  <div class="signatures">
    <div class="signature-box">
      <div class="name">Hernán Rodríguez</div>
      <div class="role">Coordinador Académico</div>
    </div>
    <div class="signature-box">
      <div class="name">Diego Reyes</div>
      <div class="role">Coordinador Técnico</div>
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
   * Renderizar dashboard principal
   */
  renderDashboard() {
    const container = document.getElementById('main-content');
    if (!container) return;

    if (!this.metrics) {
      container.innerHTML = `
      < div class="text-center" style = "padding: 100px 0;" >
          <div style="font-size: 64px; margin-bottom: 20px;">📡</div>
          <h3>Conectando con Google Sheets...</h3>
          <p class="text-muted">Si el problema persiste, verifica que el script esté publicado correctamente (Cualquiera).</p>
          <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 20px;">Reintentar</button>
        </div >
  `;
      return;
    }

    const m = this.metrics;

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Panel de Control</h1>
        <p class="page-subtitle">Seguimiento en tiempo real del despliegue de Qinaya</p>
      </div>

  <div class="dashboard-grid">
    <!-- Hero Card - Progreso Global -->
    <div class="col-4">
      <div class="card hero-card">
        <div class="stat-card">
          <span class="badge">Meta: ${CONFIG.PROJECT.totalLicenses} licencias</span>
          <div class="stat-value">${m.totalInstalled}</div>
          <div class="stat-label">Licencias Instaladas</div>
          <div class="progress-container" style="background: rgba(255,255,255,0.2); margin-top: var(--spacing-md);">
            <div class="progress-bar" style="width: ${m.percentage}%; background: white;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: var(--spacing-xs); font-size: var(--font-size-sm); opacity: 0.8;">
            <span>${m.percentage}% completado</span>
            <span>Faltan ${m.totalRequired - m.totalInstalled}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="col-4">
      <div class="card">
        <div class="stat-widget">
          <div class="stat-icon primary">🏫</div>
          <div class="stat-card">
            <div class="stat-value">${m.schoolsCompleted}/${m.totalSchools}</div>
            <div class="stat-label">Colegios Terminados</div>
          </div>
        </div>
      </div>
    </div>

    <div class="col-4">
      <div class="card" style="cursor: pointer;" id="alerts-card">
        <div class="stat-widget">
          <div class="stat-icon ${m.alerts.length > 0 ? 'danger' : 'success'}">
            ${m.alerts.length > 0 ? '⚠️' : '✅'}
          </div>
          <div class="stat-card">
            <div class="stat-value">${m.alerts.length}</div>
            <div class="stat-label">Alertas de QA Pendientes</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Progreso por Fase -->
    <div class="col-6">
      <div class="card">
        <div class="card-header">
          <h4 class="card-title">Avance por Fase</h4>
        </div>
        <div class="phase-list">
          ${Object.entries(m.byPhase).map(([key, phase]) => `
                <div class="phase-item">
                  <div class="phase-header">
                    <span class="phase-name">${phase.name}</span>
                    <span class="phase-stats">${phase.installed}/${phase.total} (${phase.percentage}%)</span>
                  </div>
                  <div class="progress-container">
                    <div class="progress-bar" style="width: ${phase.percentage}%; background: ${CONFIG.PHASES[key].color};"></div>
                  </div>
                </div>
              `).join('')}
        </div>
      </div>
    </div>

    <!-- Actividad Semanal Chart -->
    <div class="col-6">
      <div class="card">
        <div class="card-header">
          <h4 class="card-title">Actividad Semanal</h4>
        </div>
        <div class="chart-container">
          <canvas id="weeklyChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Equipo Técnico -->
    <div class="col-12">
      <div class="card">
        <div class="card-header">
          <h4 class="card-title">Rendimiento por Técnico</h4>
          <span class="text-muted">Click en un técnico para ver detalle completo</span>
        </div>
        <div class="technician-grid" id="technician-grid">
          ${m.byTechnician.map(tech => `
                <div class="technician-card card" 
                     data-technician-id="${tech.id}"
                     style="cursor: pointer;">
                  <div class="avatar ${tech.hasAlerts ? '' : ''}" style="${tech.hasAlerts ? 'background: var(--gradient-warning);' : ''}">
                    ${tech.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div class="technician-name">${tech.nombre}</div>
                  <div class="technician-zone">${tech.zona}</div>
                  <div class="technician-progress">
                    <div class="progress-container">
                      <div class="progress-bar ${tech.percentage >= 50 ? 'progress-success' : tech.percentage >= 25 ? 'progress-warning' : 'progress-primary'}" 
                           style="width: ${tech.percentage}%;"></div>
                    </div>
                    <div class="technician-stats">
                      <span>${tech.installed} instaladas</span>
                      <span>${tech.percentage}%</span>
                    </div>
                  </div>
                  ${tech.hasAlerts ? '<span class="badge badge-warning" style="margin-top: var(--spacing-sm);">⚠️ Alerta QA</span>' : ''}
                </div>
              `).join('')}
        </div>
      </div>
    </div>

    <!-- Alertas QA -->
    <div class="col-6">
      <div class="card">
        <div class="card-header">
          <h4 class="card-title">🚨 Alertas de Calidad</h4>
          <span class="badge badge-danger">${m.alerts.length} pendientes</span>
        </div>
        <div class="alert-list" id="alert-list">
          ${m.alerts.length === 0 ? `
                <div class="text-center text-muted" style="padding: var(--spacing-xl);">
                  <div style="font-size: 48px; margin-bottom: var(--spacing-md);">✅</div>
                  <p>No hay alertas pendientes</p>
                </div>
              ` : (m.alerts || []).map(alert => `
                <div class="alert-item" data-alert-tech="${alert.tecnico}">
                  <div class="alert-content">
                    <div class="alert-title">${alert.colegio} - ${alert.equipo}</div>
                    <div class="alert-meta">
                      ${alert.tecnico} • ${alert.fecha} • 
                      <strong>${alert.issues.join(', ')}</strong>
                    </div>
                  </div>
                  <button class="btn btn-sm btn-primary view-alert-btn" data-tech-name="${alert.tecnico}">Ver</button>
                </div>
              `).join('')}
        </div>
      </div>
    </div>

    <!-- Pendientes por Zona -->
    <div class="col-6">
      <div class="card">
        <div class="card-header">
          <h4 class="card-title">📋 Pendientes por Zona</h4>
        </div>
        <div class="pending-list">
          ${(m.pendingByZone || []).map(zone => `
                <div class="pending-item" style="cursor: pointer;" data-zone="${zone.zona}">
                  <span class="pending-zone">${zone.zona}</span>
                  <div class="pending-count">
                    <span class="badge badge-warning">${zone.pending} pendientes</span>
                    <span class="text-muted">de ${zone.total}</span>
                  </div>
                </div>
              `).join('')}
        </div>
      </div>
    </div>

    <!-- Calendario -->
    <div class="col-4">
      <div class="card calendar-widget">
        <div class="calendar-header">
          <button class="btn btn-ghost btn-icon btn-sm" id="prev-month">◀</button>
          <span class="calendar-month" id="calendar-month"></span>
          <button class="btn btn-ghost btn-icon btn-sm" id="next-month">▶</button>
        </div>
        <div class="calendar-grid" id="calendar-grid"></div>
      </div>
    </div>

    <!-- Metas Diarias -->
    <div class="col-8">
      <div class="card">
        <div class="card-header">
          <h4 class="card-title">📊 Proyección vs Meta</h4>
        </div>
        <div class="chart-container">
          <canvas id="projectionChart"></canvas>
        </div>
      </div>
    </div>
  </div>
`;

    // Inicializar calendario
    this.renderCalendar(this.currentMonth);

    // Inicializar gráficos
    Charts.renderWeeklyChart('weeklyChart', m.dailyActivity);
    Charts.renderProjectionChart('projectionChart', m);

    // Adjuntar eventos
    this.attachEvents();
  },

  /**
   * Renderizar vista de detalle de técnico
   */
  async renderTechnicianDetail() {
    const container = document.getElementById('main-content');
    if (!container || !this.metrics || !this.selectedTechnician) return;

    const tech = this.metrics.byTechnician.find(t => t.id === this.selectedTechnician);
    if (!tech) {
      this.currentView = 'dashboard';
      this.render();
      return;
    }

    // Obtener instalaciones y colegios reales desde el nuevo endpoint
    let techInstalls = [];
    let techSchools = [];

    try {
      const response = await API.get('getTechnicianDetails', { techId: tech.id });
      if (response && response.success) {
        techInstalls = response.data.installations;
        techSchools = response.data.schools;
      }
    } catch (e) {
      console.error('Error fetching details:', e);
    }

    const techAlerts = (this.metrics.alerts || []).filter(a => a.tecnico === tech.nombre);

    container.innerHTML = `
  < div class="page-header" style = "display: flex; align-items: center; gap: var(--spacing-md);" >
        <button class="btn btn-secondary btn-icon" id="back-btn" title="Volver">
          ← 
        </button>
        <div>
          <h1 class="page-title">${tech.nombre}</h1>
          <p class="page-subtitle">${tech.zona} • Técnico Instalador</p>
        </div>
      </div >

  <div class="dashboard-grid">
    <!-- Perfil del Técnico -->
    <div class="col-4">
      <div class="card" style="text-align: center; padding: var(--spacing-xl);">
        <div class="avatar avatar-lg" style="margin: 0 auto var(--spacing-md); width: 80px; height: 80px; font-size: 32px; ${tech.hasAlerts ? 'background: var(--gradient-warning);' : ''}">
          ${tech.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
        </div>
        <h3 style="margin-bottom: var(--spacing-xs);">${tech.nombre}</h3>
        <p class="text-muted">${tech.zona}</p>

        <div style="margin-top: var(--spacing-lg); padding-top: var(--spacing-lg); border-top: 1px solid var(--color-border);">
          <div class="stat-value" style="color: var(--color-primary);">${tech.percentage}%</div>
          <div class="stat-label">Progreso Total</div>
          <div class="progress-container" style="margin-top: var(--spacing-sm);">
            <div class="progress-bar ${tech.percentage >= 50 ? 'progress-success' : 'progress-primary'}"
              style="width: ${tech.percentage}%;"></div>
          </div>
        </div>

        ${tech.hasAlerts ? `
              <div class="alert alert-warning" style="margin-top: var(--spacing-lg);">
                ⚠️ Tiene ${techAlerts.length} alerta(s) de QA pendiente(s)
              </div>
            ` : `
              <div class="alert alert-success" style="margin-top: var(--spacing-lg);">
                ✅ Sin alertas de calidad
              </div>
            `}
      </div>
    </div>

    <!-- Stats del Técnico -->
    <div class="col-8">
      <div class="dashboard-grid" style="gap: var(--spacing-md);">
        <div class="col-4">
          <div class="card">
            <div class="stat-widget">
              <div class="stat-icon success">✅</div>
              <div class="stat-card">
                <div class="stat-value">${tech.installed}</div>
                <div class="stat-label">Instalaciones Totales</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-4">
          <div class="card">
            <div class="stat-widget">
              <div class="stat-icon warning">⏳</div>
              <div class="stat-card">
                <div class="stat-value">${tech.total - tech.installed}</div>
                <div class="stat-label">Pendientes</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-4">
          <div class="card">
            <div class="stat-widget">
              <div class="stat-icon primary">🏫</div>
              <div class="stat-card">
                <div class="stat-value">${techSchools.length}</div>
                <div class="stat-label">Colegios Asignados</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Gráfico de actividad del técnico -->
      <div class="card" style="margin-top: var(--spacing-md);">
        <div class="card-header">
          <h4 class="card-title">📊 Actividad Reciente</h4>
        </div>
        <div class="chart-container">
          <canvas id="techActivityChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Colegios Asignados -->
    <div class="col-6">
      <div class="card">
        <div class="card-header">
          <h4 class="card-title">🏫 Colegios Asignados</h4>
          <span class="badge badge-primary">${techSchools.length} colegios</span>
        </div>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Colegio</th>
                <th>Equipos</th>
                <th>Contacto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${techSchools.map(school => {
      const sId = String(school.id).trim();
      const schoolInstalls = techInstalls.filter(i => String(i.colegioid || i.colegioId).trim() === sId).length;
      const totalEquipos = Number(school.totalequipos || school.totalEquipos) || 0;
      const isComplete = totalEquipos > 0 && schoolInstalls >= totalEquipos;
      return `
                    <tr>
                      <td>
                        <strong>${school.nombre}</strong>
                        <div class="text-muted" style="font-size: var(--font-size-xs);">${school.direccion}</div>
                      </td>
                      <td>${schoolInstalls}/${totalEquipos}</td>
                      <td>
                        <div>${school.contacto}</div>
                        <div class="text-muted" style="font-size: var(--font-size-xs);">${school.telefono}</div>
                      </td>
                      <td>
                        ${isComplete
          ? '<span class="badge badge-success">✅ Completo</span>'
          : `<span class="badge badge-warning">⏳ ${(totalEquipos - schoolInstalls) > 0 ? (totalEquipos - schoolInstalls) : 0} pendientes</span>`
        }
                      </td>
                    </tr>
                  `}).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Historial de Instalaciones -->
    <div class="col-6">
      <div class="card">
        <div class="card-header">
          <h4 class="card-title">📋 Últimas Instalaciones</h4>
          <span class="badge badge-primary">${techInstalls.length} registros</span>
        </div>
        ${techInstalls.length === 0 ? `
              <div class="text-center text-muted" style="padding: var(--spacing-xl);">
                <div style="font-size: 48px; margin-bottom: var(--spacing-md);">📝</div>
                <p>Sin instalaciones registradas aún</p>
              </div>
            ` : `
              <div class="table-container">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Equipo</th>
                      <th>Colegio</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${techInstalls.slice(-10).reverse().map(inst => {
          const sId = String(inst.colegioid || inst.colegioId).trim();
          const school = techSchools.find(s => String(s.id).trim() === sId);
          const hasIssue = (inst.checkabre || inst.checkAbre) === 'NO' || (inst.checkinternet || inst.checkInternet) === 'NO';
          return `
                      <tr>
                        <td>${inst.fecha}</td>
                        <td><strong>${inst.equipoid || inst.equipoId}</strong></td>
                        <td>${school?.nombre || 'Desconocido'}</td>
                        <td>
                          ${hasIssue
              ? '<span class="badge badge-danger">⚠️ Alerta</span>'
              : '<span class="badge badge-success">✅ OK</span>'
            }
                        </td>
                      </tr>
                    `}).join('')}
                  </tbody>
                </table>
              </div>
            `}
      </div>
    </div>

    <!-- Alertas del Técnico -->
    ${techAlerts.length > 0 ? `
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h4 class="card-title">🚨 Alertas de Calidad</h4>
              <span class="badge badge-danger">${techAlerts.length} pendientes</span>
            </div>
            <div class="alert-list">
              ${techAlerts.map(alert => `
                <div class="alert-item">
                  <div class="alert-content">
                    <div class="alert-title">${alert.colegio} - ${alert.equipo}</div>
                    <div class="alert-meta">
                      ${alert.fecha} • 
                      <strong>${alert.issues.join(', ')}</strong>
                    </div>
                  </div>
                  <button class="btn btn-sm btn-success">Marcar Resuelto</button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        ` : ''}
  </div>
`;

    // Gráfico de actividad del técnico
    const techActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayInstalls = techInstalls.filter(inst => inst.fecha === dateStr);
      techActivity.push({
        date: dateStr,
        day: CONFIG.DAYS_SHORT[date.getDay()],
        count: dayInstalls.length
      });
    }
    Charts.renderWeeklyChart('techActivityChart', techActivity);

    // Eventos
    this.attachDetailEvents();
  },

  /**
   * Renderizar vista de Reportes
   */
  renderReports() {
    const container = document.getElementById('main-content');
    if (!container) return;

    const m = this.metrics;

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">📋 Reportes</h1>
        <p class="page-subtitle">Generación y descarga de reportes del proyecto (v3.7)</p>
      </div>

  <div class="dashboard-grid">
    <!-- Fila 1 -->
    <div class="col-4">
      <div class="card" style="text-align: center; padding: var(--spacing-xl); cursor: pointer;" onclick="AdminDashboard.exportReport('daily')">
        <div style="font-size: 48px; margin-bottom: var(--spacing-md);">📅</div>
        <h4>Reporte Diario</h4>
        <p class="text-muted">Instalaciones del día actual</p>
        <button class="btn btn-primary" style="margin-top: var(--spacing-md);">Generar</button>
      </div>
    </div>

    <div class="col-4">
      <div class="card" style="text-align: center; padding: var(--spacing-xl); cursor: pointer;" onclick="AdminDashboard.exportReport('weekly')">
        <div style="font-size: 48px; margin-bottom: var(--spacing-md);">📊</div>
        <h4>Reporte Semanal</h4>
        <p class="text-muted">Resumen de la última semana</p>
        <button class="btn btn-primary" style="margin-top: var(--spacing-md);">Generar</button>
      </div>
    </div>

    <div class="col-4">
      <div class="card" style="text-align: center; padding: var(--spacing-xl); cursor: pointer;" onclick="AdminDashboard.exportReport('technicians')">
        <div style="font-size: 48px; margin-bottom: var(--spacing-md);">👥</div>
        <h4>Reporte por Técnico</h4>
        <p class="text-muted">Rendimiento individual</p>
        <button class="btn btn-primary" style="margin-top: var(--spacing-md);">Generar</button>
      </div>
    </div>

    <!-- Fila 2 -->
    <div class="col-4">
      <div class="card" style="text-align: center; padding: var(--spacing-xl); cursor: pointer;" onclick="AdminDashboard.exportReport('schools')">
        <div style="font-size: 48px; margin-bottom: var(--spacing-md);">🏫</div>
        <h4>Reporte por Colegio</h4>
        <p class="text-muted">Desglose detallado por institución</p>
        <button class="btn btn-primary" style="margin-top: var(--spacing-md);">Generar</button>
      </div>
    </div>

    <div class="col-4">
      <div class="card" style="text-align: center; padding: var(--spacing-xl); cursor: pointer;" onclick="AdminDashboard.exportReport('qa')">
        <div style="font-size: 48px; margin-bottom: var(--spacing-md);">🚨</div>
        <h4>Reporte de Alertas QA</h4>
        <p class="text-muted">Alertas de calidad pendientes</p>
        <span class="badge badge-danger" style="margin-top: var(--spacing-xs);">${m?.alerts?.length || 0} alertas</span>
        <button class="btn btn-warning" style="margin-top: var(--spacing-md);">Generar</button>
      </div>
    </div>

    <div class="col-4">
      <div class="card" style="text-align: center; padding: var(--spacing-xl); cursor: pointer;" onclick="AdminDashboard.exportReport('validation')">
        <div style="font-size: 48px; margin-bottom: var(--spacing-md);">📞</div>
        <h4>Muestra Validación</h4>
        <p class="text-muted">20% aleatorio para seguimiento</p>
        <button class="btn btn-success" style="margin-top: var(--spacing-md);">Generar Lista</button>
      </div>
    </div>
  </div>
    `;

    this.attachEvents();
  },

  /**
   * Renderizar vista de Estadísticas
   */
  renderStatistics() {
    const container = document.getElementById('main-content');
    if (!container || !this.metrics) return;

    const m = this.metrics;

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">📊 Estadísticas</h1>
        <p class="page-subtitle">Análisis detallado del proyecto</p>
      </div>

  <div class="dashboard-grid">
    <!-- Resumen General -->
    <div class="col-12">
      <div class="card hero-card">
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--spacing-xl); text-align: center;">
          <div>
            <div class="stat-value" style="color: white;">${m.totalInstalled}</div>
            <div class="stat-label" style="color: rgba(255,255,255,0.8);">Instalaciones</div>
          </div>
          <div>
            <div class="stat-value" style="color: white;">${m.schoolsCompleted}</div>
            <div class="stat-label" style="color: rgba(255,255,255,0.8);">Colegios Completos</div>
          </div>
          <div>
            <div class="stat-value" style="color: white;">${m.byTechnician.length}</div>
            <div class="stat-label" style="color: rgba(255,255,255,0.8);">Técnicos Activos</div>
          </div>
          <div>
            <div class="stat-value" style="color: white;">${m.percentage}%</div>
            <div class="stat-label" style="color: rgba(255,255,255,0.8);">Avance Total</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Gráfico por Fase -->
    <div class="col-6">
      <div class="card">
        <div class="card-header">
          <h4 class="card-title">Distribución por Fase</h4>
        </div>
        <div class="chart-container">
          <canvas id="phaseChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Gráfico por Técnico -->
    <div class="col-6">
      <div class="card">
        <div class="card-header">
          <h4 class="card-title">Rendimiento por Técnico</h4>
        </div>
        <div class="chart-container">
          <canvas id="techChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Tabla Comparativa -->
    <div class="col-12">
      <div class="card">
        <div class="card-header">
          <h4 class="card-title">Ranking de Técnicos</h4>
        </div>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Técnico</th>
                <th>Zona</th>
                <th>Instaladas</th>
                <th>Pendientes</th>
                <th>Progreso</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${m.byTechnician
        .sort((a, b) => b.percentage - a.percentage)
        .map((tech, index) => `
                    <tr style="cursor: pointer;" onclick="AdminDashboard.viewTechnician('${tech.id}')">
                      <td><strong>${index + 1}</strong></td>
                      <td>
                        <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                          <div class="avatar avatar-sm">${tech.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
                          ${tech.nombre}
                        </div>
                      </td>
                      <td>${tech.zona}</td>
                      <td><strong>${tech.installed}</strong></td>
                      <td>${tech.total - tech.installed}</td>
                      <td>
                        <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                          <div class="progress-container" style="width: 100px;">
                            <div class="progress-bar ${tech.percentage >= 50 ? 'progress-success' : 'progress-primary'}" 
                                 style="width: ${tech.percentage}%;"></div>
                          </div>
                          <span>${tech.percentage}%</span>
                        </div>
                      </td>
                      <td>
                        ${tech.hasAlerts
            ? '<span class="badge badge-warning">⚠️ Alerta</span>'
            : '<span class="badge badge-success">✅ OK</span>'
          }
                      </td>
                    </tr>
                  `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
    `;

    // Gráficos
    Charts.renderPhaseDonut('phaseChart', m.byPhase);

    // Gráfico de barras por técnico
    const techCanvas = document.getElementById('techChart');
    if (techCanvas) {
      new Chart(techCanvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: m.byTechnician.map(t => t.nombre.split(' ')[0]),
          datasets: [{
            label: 'Instaladas',
            data: m.byTechnician.map(t => t.installed),
            backgroundColor: '#3B82F6'
          }, {
            label: 'Pendientes',
            data: m.byTechnician.map(t => t.total - t.installed),
            backgroundColor: '#F97316'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { stacked: true },
            y: { stacked: true, beginAtZero: true }
          }
        }
      });
    }

    this.attachEvents();
  },

  /**
   * Exportar reporte
   */
  exportReport(type) {
    Toast.show(`Generando reporte ${type}...`, 'info');

    setTimeout(() => {
      let data = '';
      const m = this.metrics;

      switch (type) {
        case 'daily':
          data = `REPORTE DIARIO - ${new Date().toLocaleDateString()} \n\n`;
          data += `Total instalaciones hoy: ${DEMO_DATA.installations.filter(i => i.fecha === new Date().toISOString().split('T')[0]).length} \n`;
          break;
        case 'weekly':
          data = `REPORTE SEMANAL\n\n`;
          data += `Instalaciones totales: ${m.totalInstalled} \n`;
          data += `Progreso: ${m.percentage}%\n`;
          break;
        case 'technicians':
          data = `REPORTE POR TÉCNICO\n\n`;
          m.byTechnician.forEach(t => {
            data += `${t.nombre}: ${t.installed} instaladas(${t.percentage} %) \n`;
          });
          break;
        case 'schools':
          data = `REPORTE POR COLEGIO\n\n`;
          DEMO_DATA.schools.forEach(s => {
            const installs = DEMO_DATA.installations.filter(i => i.colegioId === s.id).length;
            const percentage = Math.round((installs / s.totalEquipos) * 100);
            data += `${s.nombre}: \n`;
            data += `  - Zona / UPZ: ${s.upz} \n`;
            data += `  - Progreso: ${installs}/${s.totalEquipos} (${percentage}%)\n`;
            data += `  - Estado: ${installs >= s.totalEquipos ? 'COMPLETO' : 'EN PROCESO'}\n\n`;
          });
          break;
        case 'qa':
          data = `ALERTAS DE CALIDAD\n\n`;
          m.alerts.forEach(a => {
            data += `${a.colegio} - ${a.equipo}: ${a.issues.join(', ')}\n`;
          });
          break;
        case 'validation':
          data = `MUESTRA PARA VALIDACIÓN (20%)\n\n`;
          const sample = DEMO_DATA.schools.sort(() => 0.5 - Math.random()).slice(0, Math.ceil(DEMO_DATA.schools.length * 0.2));
          sample.forEach(s => {
            data += `${s.nombre} - ${s.contacto}: ${s.telefono}\n`;
          });
          break;
      }

      // Descargar como archivo
      const blob = new Blob([data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${type}_${new Date().toISOString().split('T')[0]}.txt`;
      a.click();

      Toast.show('Reporte descargado', 'success');
    }, 500);
  },

  /**
   * Ver técnico específico
   */
  viewTechnician(techId) {
    this.selectedTechnician = techId;
    this.currentView = 'technician-detail';
    this.render();
    this.updateNavTabs('dashboard');
  },

  /**
   * Cambiar vista
   */
  changeView(view) {
    this.currentView = view;
    this.selectedTechnician = null;
    this.render();
    this.updateNavTabs(view);
  },

  /**
   * Actualizar tabs de navegación
   */
  updateNavTabs(activeTab) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.remove('active');
      if (tab.dataset.tab === activeTab) {
        tab.classList.add('active');
      }
    });
  },

  /**
   * Renderizar calendario
   */
  renderCalendar(date) {
    const grid = document.getElementById('calendar-grid');
    const monthLabel = document.getElementById('calendar-month');
    if (!grid || !monthLabel) return;

    const year = date.getFullYear();
    const month = date.getMonth();

    monthLabel.textContent = `${CONFIG.MONTHS[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    let html = CONFIG.DAYS_SHORT.map(d =>
      `<div class="calendar-day-header">${d}</div>`
    ).join('');

    // Días vacíos antes del primer día
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="calendar-day inactive"></div>';
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = today.getDate() === day &&
        today.getMonth() === month &&
        today.getFullYear() === year;

      // Calcular actividad real
      const dayDate = new Date(year, month, day);
      const dateStr = dayDate.toISOString().split('T')[0];
      const dayInstalls = DEMO_DATA.installations.filter(i => i.fecha === dateStr).length;

      let activityLevel = '';
      if (dayInstalls > 5) activityLevel = 'high';
      else if (dayInstalls > 2) activityLevel = 'medium';
      else if (dayInstalls > 0) activityLevel = 'low';

      html += `
        <div class="calendar-day ${isToday ? 'today' : ''} ${activityLevel ? 'has-activity ' + activityLevel : ''}">
          ${day}
        </div>
      `;
    }

    grid.innerHTML = html;
  },

  /**
   * Adjuntar eventos del dashboard
   */
  attachEvents() {
    // Click en tarjetas de técnicos
    document.querySelectorAll('.technician-card').forEach(card => {
      card.addEventListener('click', () => {
        const techId = card.dataset.technicianId;
        this.viewTechnician(techId);
      });
    });

    // Navegación del calendario
    document.getElementById('prev-month')?.addEventListener('click', () => {
      this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
      this.renderCalendar(this.currentMonth);
    });

    document.getElementById('next-month')?.addEventListener('click', () => {
      this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
      this.renderCalendar(this.currentMonth);
    });

    // Botones de alertas
    document.querySelectorAll('.view-alert-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const techName = btn.dataset.techName;
        const tech = this.metrics.byTechnician.find(t => t.nombre === techName);
        if (tech) {
          this.viewTechnician(tech.id);
        }
      });
    });

    // Click en zonas pendientes
    document.querySelectorAll('.pending-item').forEach(item => {
      item.addEventListener('click', () => {
        const zona = item.dataset.zone;
        const tech = this.metrics.byTechnician.find(t => t.zona === zona);
        if (tech) {
          this.viewTechnician(tech.id);
        }
      });
    });

    // Tabs de navegación
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.dataset.tab;
        this.changeView(view);
      });
    });

    // Mobile nav
    document.querySelectorAll('.mobile-nav-item[data-tab]').forEach(item => {
      item.addEventListener('click', () => {
        const view = item.dataset.tab;
        if (view === 'technicians') {
          // Scroll a la sección de técnicos
          document.getElementById('technician-grid')?.scrollIntoView({ behavior: 'smooth' });
        } else if (view === 'alerts') {
          document.getElementById('alert-list')?.scrollIntoView({ behavior: 'smooth' });
        } else {
          this.changeView(view);
        }
      });
    });
  },

  /**
   * Adjuntar eventos de vista detalle
   */
  attachDetailEvents() {
    document.getElementById('back-btn')?.addEventListener('click', () => {
      this.currentView = 'dashboard';
      this.selectedTechnician = null;
      this.render();
    });
  }
};

window.AdminDashboard = AdminDashboard;
