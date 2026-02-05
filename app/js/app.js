/**
 * QINAYA TRACKER - Main Application
 */

// Toast notifications
const Toast = {
  container: null,

  init() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  },

  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};

// Router
const Router = {
  routes: {
    '#login': 'renderLogin',
    '#admin': 'renderAdmin',
    '#technician': 'renderTechnician'
  },

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  },

  handleRoute() {
    const hash = window.location.hash || '#login';

    // Verificar autenticación
    if (hash !== '#login' && !Auth.isAuthenticated()) {
      window.location.hash = '#login';
      return;
    }

    // Redirigir según rol
    if (Auth.isAuthenticated() && hash === '#login') {
      window.location.hash = Auth.isAdmin() ? '#admin' : '#technician';
      return;
    }

    // Verificar acceso por rol
    if (hash === '#admin' && !Auth.isAdmin()) {
      window.location.hash = '#technician';
      return;
    }

    if (hash === '#technician' && Auth.isAdmin()) {
      window.location.hash = '#admin';
      return;
    }

    // Renderizar ruta
    const method = this.routes[hash];
    if (method && App[method]) {
      App[method]();
    } else {
      App.renderLogin();
    }
  },

  navigate(hash) {
    window.location.hash = hash;
  }
};

// Main Application
const App = {
  init() {
    Toast.init();
    Auth.init();
    Router.init();
  },

  /**
   * Renderizar login
   */
  renderLogin() {
    document.body.innerHTML = `
      <div class="login-container">
        <div class="card login-card">
          <div class="login-header">
            <div class="login-logo">📊</div>
            <h1 class="login-title">Qinaya Tracker</h1>
            <p class="login-subtitle">Sistema de Gestión de Instalaciones</p>
          </div>
          
          <form class="login-form" id="login-form">
            <div class="form-group">
              <label class="form-label">Correo electrónico</label>
              <input type="email" class="form-input" id="email" 
                     placeholder="tu@email.com" required>
            </div>
            
            <div class="form-group">
              <label class="form-label">Contraseña</label>
              <input type="password" class="form-input" id="password" 
                     placeholder="••••••••" required>
            </div>
            
            <button type="submit" class="btn btn-primary btn-lg" id="login-btn">
              Iniciar Sesión
            </button>
          </form>
          
          <div style="margin-top: var(--spacing-xl); padding-top: var(--spacing-lg); border-top: 1px solid var(--color-border);">
            <p class="text-center text-muted" style="font-size: var(--font-size-sm); margin-bottom: var(--spacing-sm);">
              Credenciales de prueba:
            </p>
            <div style="display: grid; gap: var(--spacing-xs); font-size: var(--font-size-xs); color: var(--color-text-muted);">
              <div><strong>Admin:</strong> hernan@qinaya.com / admin123</div>
              <div><strong>Técnico:</strong> carlos@qinaya.com / tech123</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Eventos
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const btn = document.getElementById('login-btn');

      btn.disabled = true;
      btn.textContent = 'Ingresando...';

      const result = await Auth.login(email, password);

      if (result.success) {
        Toast.show(`¡Bienvenido, ${result.user.nombre}!`, 'success');
        Router.handleRoute();
      } else {
        Toast.show(result.error, 'danger');
        btn.disabled = false;
        btn.textContent = 'Iniciar Sesión';
      }
    });
  },

  /**
   * Renderizar dashboard admin
   */
  renderAdmin() {
    const user = Auth.getUser();

    document.body.innerHTML = `
      <div class="app-container">
        <header class="main-header">
          <div class="header-left">
            <div class="logo">
              <div class="logo-icon">📊</div>
              <span>Qinaya Tracker</span>
            </div>
            
            <nav class="nav-tabs">
              <button class="nav-tab active" data-tab="dashboard">
                <span>📈</span> Dashboard
              </button>
              <button class="nav-tab" data-tab="reports">
                <span>📋</span> Reportes
                <span class="badge badge-success">+3</span>
              </button>
              <button class="nav-tab" data-tab="statistics">
                <span>📊</span> Estadísticas
              </button>
            </nav>
          </div>
          
          <div class="header-right">
            <!-- Notificaciones -->
            <div class="dropdown" id="notifications-dropdown">
              <button class="btn btn-ghost btn-icon" id="notifications-btn" title="Notificaciones">
                🔔
                <span class="notification-badge" id="notification-count"></span>
              </button>
              <div class="dropdown-menu dropdown-right" id="notifications-menu">
                <div class="dropdown-header">
                  <strong>Notificaciones</strong>
                  <button class="btn btn-ghost btn-sm" id="mark-all-read">Marcar leídas</button>
                </div>
                <div class="dropdown-content" id="notifications-list">
                  <!-- Se llena dinámicamente -->
                </div>
                <div class="dropdown-footer">
                  <button class="btn btn-primary btn-sm w-full" id="view-all-alerts">Ver todas las alertas</button>
                </div>
              </div>
            </div>
            
            <!-- Configuración -->
            <div class="dropdown" id="settings-dropdown">
              <button class="btn btn-ghost btn-icon" id="settings-btn" title="Configuración">
                ⚙️
              </button>
              <div class="dropdown-menu dropdown-right" id="settings-menu">
                <div class="dropdown-header">
                  <strong>Configuración</strong>
                </div>
                <div class="dropdown-item" id="setting-project">
                  <span>📋</span> Datos del Proyecto
                </div>
                <div class="dropdown-item" id="setting-users">
                  <span>👥</span> Gestionar Usuarios
                </div>
                <div class="dropdown-item" id="setting-schools">
                  <span>🏫</span> Gestionar Colegios
                </div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item" id="setting-export">
                  <span>📤</span> Exportar Datos
                </div>
                <div class="dropdown-item" id="setting-backup">
                  <span>💾</span> Respaldar BD
                </div>
              </div>
            </div>
            
            <!-- Menú de Usuario -->
            <div class="dropdown" id="user-dropdown">
              <div class="user-menu" id="user-menu">
                <div class="user-info">
                  <div class="user-name">${user?.nombre || 'Usuario'}</div>
                  <div class="user-role">Coordinador</div>
                </div>
                <div class="avatar">${Auth.getInitials()}</div>
              </div>
              <div class="dropdown-menu dropdown-right" id="user-menu-dropdown">
                <div class="dropdown-header" style="text-align: center; padding: var(--spacing-md);">
                  <div class="avatar avatar-lg" style="margin: 0 auto var(--spacing-sm);">${Auth.getInitials()}</div>
                  <strong>${user?.nombre || 'Usuario'}</strong>
                  <div class="text-muted">${user?.email || ''}</div>
                </div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item" id="menu-profile">
                  <span>👤</span> Mi Perfil
                </div>
                <div class="dropdown-item" id="menu-preferences">
                  <span>🎨</span> Preferencias
                </div>
                <div class="dropdown-item" id="menu-help">
                  <span>❓</span> Ayuda
                </div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item text-danger" id="menu-logout">
                  <span>🚪</span> Cerrar Sesión
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main class="main-content" id="main-content">
          <div class="loader-overlay" id="loader">
            <div class="loader"></div>
          </div>
        </main>
        
        <!-- Mobile Nav -->
        <nav class="mobile-nav">
          <div class="mobile-nav-items">
            <button class="mobile-nav-item active" data-tab="dashboard">
              <span>📈</span>
              <span>Dashboard</span>
            </button>
            <button class="mobile-nav-item" data-tab="technicians">
              <span>👥</span>
              <span>Técnicos</span>
            </button>
            <button class="mobile-nav-item" data-tab="alerts">
              <span>🔔</span>
              <span>Alertas</span>
            </button>
            <button class="mobile-nav-item" id="mobile-logout">
              <span>🚪</span>
              <span>Salir</span>
            </button>
          </div>
        </nav>
        
        <!-- Modal Container -->
        <div class="modal-overlay hidden" id="modal-overlay">
          <div class="modal" id="modal">
            <div class="modal-header">
              <h3 id="modal-title">Modal</h3>
              <button class="btn btn-ghost btn-icon" id="modal-close">✕</button>
            </div>
            <div class="modal-content" id="modal-content">
              <!-- Contenido dinámico -->
            </div>
          </div>
        </div>
      </div>
    `;

    // Inicializar dashboard
    AdminDashboard.init();

    // Configurar dropdowns y eventos
    this.setupDropdowns();
    this.setupHeaderEvents();
  },

  /**
   * Configurar dropdowns
   */
  setupDropdowns() {
    // Cerrar dropdowns al hacer clic fuera
    document.addEventListener('click', (e) => {
      document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        if (!menu.parentElement.contains(e.target)) {
          menu.classList.remove('show');
        }
      });
    });

    // Toggle dropdowns
    const toggleDropdown = (btnId, menuId) => {
      document.getElementById(btnId)?.addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = document.getElementById(menuId);
        const isOpen = menu.classList.contains('show');

        // Cerrar otros dropdowns
        document.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));

        if (!isOpen) {
          menu.classList.add('show');
          // Cargar notificaciones si es el menú de notificaciones
          if (menuId === 'notifications-menu') {
            this.loadNotifications();
          }
        }
      });
    };

    toggleDropdown('notifications-btn', 'notifications-menu');
    toggleDropdown('settings-btn', 'settings-menu');
    toggleDropdown('user-menu', 'user-menu-dropdown');
  },

  /**
   * Cargar notificaciones
   */
  loadNotifications() {
    const list = document.getElementById('notifications-list');
    const countBadge = document.getElementById('notification-count');

    if (!AdminDashboard.metrics) return;

    const alerts = AdminDashboard.metrics.alerts || [];

    // Actualizar badge
    if (alerts.length > 0) {
      countBadge.textContent = alerts.length;
      countBadge.style.display = 'flex';
    } else {
      countBadge.style.display = 'none';
    }

    // Renderizar lista
    if (alerts.length === 0) {
      list.innerHTML = `
                <div class="dropdown-empty">
                    <span style="font-size: 32px;">✅</span>
                    <p>No hay notificaciones</p>
                </div>
            `;
    } else {
      list.innerHTML = alerts.slice(0, 5).map(alert => `
                <div class="dropdown-item notification-item" data-tech="${alert.tecnico}">
                    <div class="notification-icon">⚠️</div>
                    <div class="notification-content">
                        <div class="notification-title">${alert.colegio}</div>
                        <div class="notification-meta">${alert.tecnico} • ${alert.issues.join(', ')}</div>
                    </div>
                </div>
            `).join('');

      // Eventos para items de notificación
      list.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
          const techName = item.dataset.tech;
          const tech = AdminDashboard.metrics.byTechnician.find(t => t.nombre === techName);
          if (tech) {
            document.getElementById('notifications-menu').classList.remove('show');
            AdminDashboard.viewTechnician(tech.id);
          }
        });
      });
    }
  },

  /**
   * Configurar eventos del header
   */
  setupHeaderEvents() {
    // Marcar todas como leídas
    document.getElementById('mark-all-read')?.addEventListener('click', () => {
      Toast.show('Notificaciones marcadas como leídas', 'success');
      document.getElementById('notification-count').style.display = 'none';
    });

    // Ver todas las alertas
    document.getElementById('view-all-alerts')?.addEventListener('click', () => {
      document.getElementById('notifications-menu').classList.remove('show');
      AdminDashboard.changeView('dashboard');
      setTimeout(() => {
        document.getElementById('alert-list')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    // Configuración - Datos del proyecto
    document.getElementById('setting-project')?.addEventListener('click', () => {
      document.getElementById('settings-menu').classList.remove('show');
      this.showModal('Datos del Proyecto', `
                <div class="form-group">
                    <label class="form-label">Nombre del Proyecto</label>
                    <input type="text" class="form-input" value="Proyecto Qinaya" disabled>
                </div>
                <div class="form-group">
                    <label class="form-label">Meta de Licencias</label>
                    <input type="number" class="form-input" value="${CONFIG.PROJECT.totalLicenses}" disabled>
                </div>
                <div class="form-group">
                    <label class="form-label">Total de Colegios</label>
                    <input type="number" class="form-input" value="${CONFIG.PROJECT.totalSchools}" disabled>
                </div>
                <div class="form-group">
                    <label class="form-label">Días de Ejecución</label>
                    <input type="number" class="form-input" value="${CONFIG.PROJECT.totalDays}" disabled>
                </div>
                <div class="alert alert-info">
                    ℹ️ Para modificar estos datos, edita el archivo config.js o conecta con Google Sheets.
                </div>
            `);
    });

    // Configuración - Gestionar usuarios
    document.getElementById('setting-users')?.addEventListener('click', () => {
      document.getElementById('settings-menu').classList.remove('show');
      this.showUsersManager();
    });

    // Configuración - Gestionar colegios
    document.getElementById('setting-schools')?.addEventListener('click', () => {
      document.getElementById('settings-menu').classList.remove('show');
      this.showSchoolsManager();
    });

    // Configuración - Exportar
    document.getElementById('setting-export')?.addEventListener('click', () => {
      document.getElementById('settings-menu').classList.remove('show');
      AdminDashboard.exportReport('weekly');
    });

    // Configuración - Backup
    document.getElementById('setting-backup')?.addEventListener('click', () => {
      document.getElementById('settings-menu').classList.remove('show');
      Toast.show('Función disponible al conectar con Google Sheets', 'info');
    });

    // Menú usuario - Perfil
    document.getElementById('menu-profile')?.addEventListener('click', () => {
      document.getElementById('user-menu-dropdown').classList.remove('show');
      const user = Auth.getUser();
      this.showModal('Mi Perfil', `
                <div style="text-align: center; margin-bottom: var(--spacing-lg);">
                    <div class="avatar avatar-lg" style="margin: 0 auto var(--spacing-md); width: 80px; height: 80px; font-size: 32px;">
                        ${Auth.getInitials()}
                    </div>
                    <h3>${user?.nombre}</h3>
                    <p class="text-muted">${user?.rol === 'admin' ? 'Coordinador' : 'Técnico'}</p>
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-input" value="${user?.email}" disabled>
                </div>
                <div class="form-group">
                    <label class="form-label">Zona Asignada</label>
                    <input type="text" class="form-input" value="${user?.zona}" disabled>
                </div>
            `);
    });

    // Menú usuario - Preferencias
    document.getElementById('menu-preferences')?.addEventListener('click', () => {
      document.getElementById('user-menu-dropdown').classList.remove('show');
      this.showModal('Preferencias', `
                <div class="form-group">
                    <label class="form-checkbox">
                        <input type="checkbox" checked>
                        <span>Recibir notificaciones de alertas QA</span>
                    </label>
                </div>
                <div class="form-group">
                    <label class="form-checkbox">
                        <input type="checkbox" checked>
                        <span>Mostrar resumen diario al iniciar</span>
                    </label>
                </div>
                <div class="form-group">
                    <label class="form-checkbox">
                        <input type="checkbox">
                        <span>Modo oscuro (próximamente)</span>
                    </label>
                </div>
                <button class="btn btn-primary w-full" onclick="Toast.show('Preferencias guardadas', 'success'); App.closeModal();">
                    Guardar Preferencias
                </button>
            `);
    });

    // Menú usuario - Ayuda
    document.getElementById('menu-help')?.addEventListener('click', () => {
      document.getElementById('user-menu-dropdown').classList.remove('show');
      this.showModal('Ayuda', `
                <div class="alert alert-info" style="margin-bottom: var(--spacing-md);">
                    <strong>Qinaya Tracker v${CONFIG.VERSION}</strong><br>
                    Sistema de gestión de instalaciones
                </div>
                <h4 style="margin-bottom: var(--spacing-sm);">Contacto de Soporte</h4>
                <p>📧 soporte@qinaya.com</p>
                <p>📞 (+57) 311 207 8846</p>
                <h4 style="margin: var(--spacing-md) 0 var(--spacing-sm);">Documentación</h4>
                <p>Consulta el manual de usuario en el repositorio del proyecto.</p>
            `);
    });

    // Menú usuario - Logout
    document.getElementById('menu-logout')?.addEventListener('click', () => {
      document.getElementById('user-menu-dropdown').classList.remove('show');
      if (confirm('¿Deseas cerrar sesión?')) {
        Auth.logout();
      }
    });

    // Mobile logout
    document.getElementById('mobile-logout')?.addEventListener('click', () => {
      if (confirm('¿Deseas cerrar sesión?')) {
        Auth.logout();
      }
    });

    // Modal close
    document.getElementById('modal-close')?.addEventListener('click', () => this.closeModal());
    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') this.closeModal();
    });

    // Cargar notificaciones iniciales
    setTimeout(() => this.loadNotifications(), 500);
  },

  /**
   * Mostrar modal
   */
  showModal(title, content) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-content').innerHTML = content;
    document.getElementById('modal-overlay').classList.remove('hidden');
  },

  /**
   * Cerrar modal
   */
  closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
  },

  /**
   * Renderizar vista técnico
   */
  renderTechnician() {
    const user = Auth.getUser();

    document.body.innerHTML = `
      <div class="app-container">
        <header class="main-header">
          <div class="header-left">
            <div class="logo">
              <div class="logo-icon">📊</div>
              <span>Qinaya Tracker</span>
            </div>
          </div>
          
          <div class="header-right">
            <div class="user-menu" id="user-menu">
              <div class="user-info">
                <div class="user-name">${user?.nombre || 'Usuario'}</div>
                <div class="user-role">Técnico</div>
              </div>
              <div class="avatar">${Auth.getInitials()}</div>
            </div>
          </div>
        </header>
        
        <main class="main-content" id="main-content">
          <div class="loader-overlay" id="loader">
            <div class="loader"></div>
          </div>
        </main>
        
        <!-- Mobile Nav -->
        <nav class="mobile-nav">
          <div class="mobile-nav-items">
            <button class="mobile-nav-item active" data-tab="install">
              <span>➕</span>
              <span>Registrar</span>
            </button>
            <button class="mobile-nav-item" data-tab="history">
              <span>📋</span>
              <span>Historial</span>
            </button>
            <button class="mobile-nav-item" id="mobile-logout">
              <span>🚪</span>
              <span>Salir</span>
            </button>
          </div>
        </nav>
      </div>
    `;

    // Inicializar vista técnico
    TechnicianView.init();

    // Eventos
    document.getElementById('user-menu')?.addEventListener('click', () => {
      if (confirm('¿Deseas cerrar sesión?')) {
        Auth.logout();
      }
    });

    document.getElementById('mobile-logout')?.addEventListener('click', () => {
      if (confirm('¿Deseas cerrar sesión?')) {
        Auth.logout();
      }
    });
  },

  /**
   * Mostrar gestor de usuarios
   */
  async showUsersManager() {
    this.showModal('Gestionar Usuarios', `
      <div id="u-mgr-body" class="text-center" style="padding: var(--spacing-xl);">
         <div class="loader" style="margin: 0 auto var(--spacing-md);"></div>
         <p class="text-muted">Obteniendo datos desde Google Sheets...</p>
      </div>
    `);

    let users = [];
    let zones = [];

    try {
      // 2. Cargar datos en paralelo
      const [response, schoolsResponse] = await Promise.all([
        API.get('getUsers'),
        API.get('getSchools')
      ]);

      if (response && response.success) users = response.data;

      if (schoolsResponse && schoolsResponse.success) {
        const schoolZones = schoolsResponse.data.map(s => s.upz || s.zona || s.UPZ || s.Zona);
        const userZones = users.map(u => u.zona || u.Zona);
        zones = [...new Set([...schoolZones, ...userZones])].filter(z => z && z !== 'Todas');
      }

      if (zones.length === 0) zones = ['NORTE', 'CENTRO_OCCIDENTE', 'SUR_ORIENTE'];
    } catch (e) {
      console.error(e);
      users = DEMO_DATA.users;
      zones = ['NORTE', 'CENTRO_OCCIDENTE', 'SUR_ORIENTE'];
    }

    const container = document.getElementById('u-mgr-body');
    if (!container) return;

    const modalBody = container.parentElement;
    modalBody.innerHTML = `
      <div style="margin-bottom: var(--spacing-md); display: flex; justify-content: space-between; align-items: center;">
        <button class="btn btn-success" id="btn-open-create">Crear Nuevo Técnico</button>
        <span class="badge badge-primary">${users.length} técnicos en total</span>
      </div>
      <div class="table-container" style="max-height: 350px; overflow-y: auto;">
        <table class="table" id="users-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Zona</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr data-user-id="${u.id}">
                <td><strong>${u.nombre || u.Nombre}</strong></td>
                <td>${u.email || u.Email}</td>
                <td><span class="badge ${(u.rol || u.Rol)?.toLowerCase() === 'admin' ? 'badge-primary' : 'badge-success'}">${u.rol || u.Rol}</span></td>
                <td>${u.zona || u.Zona || 'N/A'}</td>
                <td>
                  <div style="display: flex; gap: var(--spacing-xs);">
                    <button class="btn btn-sm btn-secondary edit-user-btn" data-id="${u.id}" title="Editar">✏️</button>
                    ${(u.rol || u.Rol)?.toLowerCase() !== 'admin' ? `
                      <button class="btn btn-sm btn-danger delete-user-btn" data-id="${u.id}" title="Eliminar">🗑️</button>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="alert alert-success" style="margin-top: var(--spacing-md);">
        ✅ Los cambios se sincronizan directamente con Google Sheets.
      </div>
    `;

    // 4. Vincular eventos al nuevo contenido
    document.getElementById('btn-open-create')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showUserForm(null, zones);
    });

    modalBody.querySelectorAll('.edit-user-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.dataset.id;
        const user = users.find(u => u.id === userId);
        if (user) this.showUserForm(user, zones);
      });
    });

    modalBody.querySelectorAll('.delete-user-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.dataset.id;
        const user = users.find(u => u.id === userId);
        if (user && confirm(`¿Eliminar a ${user.nombre || user.Nombre}?`)) {
          this.deleteUser(userId);
        }
      });
    });
  },

  /**
   * Mostrar formulario de usuario (nuevo o editar)
   */
  showUserForm(user, zones) {
    const isEdit = !!user;
    const title = isEdit ? `Editar: ${user.nombre || user.Nombre}` : 'Nuevo Técnico';

    this.showModal(title, `
      <div id="user-form-container">
        <div class="form-group">
          <label class="form-label">Cédula / ID (Único) *</label>
          <input type="text" class="form-input" id="user-id-custom" 
                 value="${isEdit ? (user.id || '') : ''}" 
                 placeholder="Ej: 1012345678" 
                 ${isEdit ? 'readonly style="background-color: var(--color-background); cursor: not-allowed;"' : 'required'}>
        </div>
        <div class="form-group">
          <label class="form-label">Nombre Completo *</label>
          <input type="text" class="form-input" id="user-nombre" 
                 value="${isEdit ? (user.nombre || user.Nombre || '') : ''}" 
                 placeholder="Ej: Carlos Martínez" required autocomplete="off">
        </div>
        <div class="form-group">
          <label class="form-label">Email *</label>
          <input type="email" class="form-input" id="user-email" 
                 value="${isEdit ? (user.email || user.Email || '') : ''}" 
                 placeholder="Correo del técnico" 
                 readonly onfocus="this.removeAttribute('readonly');" required>
        </div>
        <div class="form-group">
          <label class="form-label">Contraseña ${isEdit ? '(Opcional)' : '*'}</label>
          <input type="password" class="form-input" id="user-password" 
                 placeholder="${isEdit ? '••••••••' : 'Contraseña'}" 
                 readonly onfocus="this.removeAttribute('readonly');" 
                 ${isEdit ? '' : 'required'}>
        </div>
        <div class="form-group">
          <label class="form-label">Rol</label>
          <select class="form-input form-select" id="user-rol">
            <option value="tecnico" ${!isEdit || user.rol === 'tecnico' ? 'selected' : ''}>Técnico</option>
            <option value="admin" ${isEdit && user.rol === 'admin' ? 'selected' : ''}>Administrador</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Zona Asignada *</label>
          <input type="text" class="form-input" id="user-zona" 
                 value="${isEdit ? (user.zona || user.Zona || '') : ''}" 
                 placeholder="Selecciona o escribe una zona" 
                 list="user-zones-list" required>
          <datalist id="user-zones-list">
            <option value="Todas">
            ${zones.map(z => `<option value="${z}">`).join('')}
          </datalist>
        </div>
        <div style="display: flex; gap: var(--spacing-sm); margin-top: var(--spacing-lg);">
          <button type="button" class="btn btn-secondary" id="cancel-user-btn">
            Cancelar
          </button>
          <button type="button" class="btn btn-primary" id="btn-save-user" style="flex: 1;">
            ${isEdit ? '💾 Guardar Cambios' : 'Crear Técnico'}
          </button>
        </div>
      </div>
    `);

    // Eventos del formulario
    document.getElementById('cancel-user-btn')?.addEventListener('click', () => {
      this.showUsersManager();
    });

    document.getElementById('btn-save-user')?.addEventListener('click', () => {
      this.saveUser(isEdit ? user.id : null);
    });
  },

  /**
   * Guardar usuario (nuevo o actualizado)
   */
  async saveUser(userId) {
    const btn = document.getElementById('btn-save-user');
    if (btn) { btn.disabled = true; btn.innerText = 'Guardando...'; }

    try {
      const customId = document.getElementById('user-id-custom').value.trim();
      const nombre = document.getElementById('user-nombre').value.trim();
      const email = document.getElementById('user-email').value.trim();
      const password = document.getElementById('user-password').value;
      const rol = document.getElementById('user-rol').value;
      const zona = document.getElementById('user-zona').value;

      if (!customId || !nombre || !email || !zona) {
        Toast.show('Faltan datos obligatorios', 'warning');
        if (btn) { btn.disabled = false; btn.innerText = userId ? 'Guardar Cambios' : 'Crear Técnico'; }
        return;
      }

      const payload = {
        action: 'addUser',
        id: customId, // Use the custom ID (or existing one if editing, since it's readonly)
        nombre, email, password,
        rol: rol.toLowerCase(),
        zona
      };

      const res = await API.post(payload.action, payload);

      if (res && res.success) {
        Toast.show('Guardado correctamente', 'success');
        this.showUsersManager();
      } else {
        const errorMsg = res?.error || 'Respuesta desconocida del servidor';
        Toast.show(`Error del Backend: ${errorMsg}`, 'danger');
        console.error('Backend Error:', res);
        if (btn) { btn.disabled = false; btn.innerText = 'Reintentar (Ver Consola)'; }
      }
    } catch (e) {
      console.error('Network Error:', e);
      Toast.show(`Fallo de conexión: ${e.message}`, 'danger');
      if (btn) { btn.disabled = false; btn.innerText = 'Reintentar'; }
    }
  },

  /**
   * Eliminar usuario
   */
  deleteUser(userId) {
    const userIndex = DEMO_DATA.users.findIndex(u => u.id === userId);
    if (userIndex >= 0) {
      DEMO_DATA.users.splice(userIndex, 1);
      Toast.show('Usuario eliminado', 'success');
      this.showUsersManager();

      // Notificar al dashboard de los cambios
      if (typeof AdminDashboard !== 'undefined') {
        AdminDashboard.loadMetrics().then(() => {
          AdminDashboard.render();
        });
      }
    }
  },

  /**
   * Mostrar gestor de colegios
   */
  async showSchoolsManager() {
    // 1. Mostrar modal de carga INMEDIATAMENTE
    this.showModal('Gestionar Colegios', `
      <div id="schools-manager-container" class="text-center" style="padding: var(--spacing-xl);">
         <div class="stat-value" style="color: var(--color-primary);">Cargando...</div>
         <p class="text-muted">Obteniendo colegios desde Google Sheets</p>
         <div class="progress-container" style="margin-top: var(--spacing-md); height: 4px;">
            <div class="progress-bar progress-primary" style="width: 50%; animation: pulse 1.5s infinite;"></div>
         </div>
      </div>
    `);

    let schools = [];
    let users = [];

    try {
      // 2. Cargar datos en paralelo (Colegios y Usuarios para mapear nombres)
      const [schoolsRes, usersRes] = await Promise.all([
        API.get('getSchools'),
        API.get('getUsers')
      ]);

      if (schoolsRes && schoolsRes.success) schools = schoolsRes.data;
      if (usersRes && usersRes.success) users = usersRes.data;

    } catch (e) {
      console.error('Error loading schools:', e);
      schools = DEMO_DATA.schools;
      users = DEMO_DATA.users;
    }

    // 3. Renderizar el contenido real
    const container = document.getElementById('schools-manager-container');
    if (!container) return; // Si el usuario cerró el modal rápido

    const modalBody = container.parentElement;
    modalBody.innerHTML = `
      <div style="margin-bottom: var(--spacing-md);">
        <button class="btn btn-success" id="add-school-btn">
          ➕ Agregar Colegio
        </button>
      </div>
      <div class="table-container" style="max-height: 320px; overflow-y: auto;">
        <table class="table" id="schools-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Fase</th>
              <th>Técnico</th>
              <th>Equipos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${schools.map(s => {
      // Encontrar nombre del técnico
      const techId = s.tecnicoid || s.tecnicoId;
      const tech = users.find(u => u.id === techId);
      let techName = '<span class="text-muted" style="font-size:0.8em">Sin asignar</span>';

      if (tech) {
        techName = `<strong>${tech.nombre || tech.Nombre}</strong>`;
      } else if (techId) {
        techName = `<span class="text-muted" style="font-size:0.8em">${techId}</span>`;
      } else {
        // Intentar por zona si no tiene asignación directa
        const zoneTech = users.find(u => (u.zona || '').trim().toLowerCase() === (s.upz || '').trim().toLowerCase() && u.rol === 'tecnico');
        if (zoneTech) {
          techName = `<span class="text-info" style="font-size:0.8em" title="Por Zona">📍 ${zoneTech.nombre}</span>`;
        }
      }

      return `
              <tr data-school-id="${s.id}">
                <td>
                  <strong>${s.nombre || s.Nombre}</strong>
                  <div class="text-muted" style="font-size: var(--font-size-xs);">${s.direccion || s.Direccion || ''}</div>
                </td>
                <td><span class="badge ${(s.fase || s.Fase) === 'NORTE' ? 'badge-primary' : (s.fase || s.Fase) === 'SUR_ORIENTE' ? 'badge-success' : 'badge-warning'}">${s.fase || s.Fase}</span></td>
                <td>${techName}</td>
                 <td>${s.totalequipos || s.totalEquipos || 0}</td>
                <td>
                  <div style="display: flex; gap: var(--spacing-xs);">
                    <button class="btn btn-sm btn-secondary edit-school-btn" data-id="${s.id}" title="Editar">✏️</button>
                    ${(s.rol || '') !== 'admin' ? `
                    <button class="btn btn-sm btn-danger delete-school-btn" data-id="${s.id}" title="Eliminar">🗑️</button>
                    ` : ''}
                  </div>
                </td>
              </tr>
              `;
    }).join('')}
          </tbody>
        </table>
      </div>
      <div class="alert alert-success" style="margin-top: var(--spacing-md);">
        ✅ Los cambios se sincronizan directamente con Google Sheets.
      </div>
    `;

    // 4. Listeners
    document.getElementById('add-school-btn')?.addEventListener('click', () => {
      this.showSchoolForm(null);
    });

    modalBody.querySelectorAll('.edit-school-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const schoolId = btn.dataset.id;
        const school = schools.find(s => s.id === schoolId);
        if (school) this.showSchoolForm(school);
      });
    });

    modalBody.querySelectorAll('.delete-school-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const schoolId = btn.dataset.id;
        const school = schools.find(s => s.id === schoolId);
        if (school && confirm(`¿Eliminar ${school.nombre}?`)) {
          // Call API delete
          this.deleteSchool(school.id);
        }
      });
    });
  },

  /**
   * Mostrar formulario de colegio (nuevo o editar)
   */
  async showSchoolForm(school) {
    const isEdit = !!school;
    const title = isEdit ? `Editar: ${school.nombre || school.Nombre}` : 'Nuevo Colegio';
    const zones = [...new Set(DEMO_DATA.schools.map(s => s.upz))];

    // Obtener técnicos reales
    let technicians = [];
    try {
      const res = await API.get('getUsers');
      if (res && res.success) {
        technicians = res.data.filter(u => (u.rol || u.Rol)?.toLowerCase() === 'tecnico');
      }
    } catch (e) {
      console.error(e);
      technicians = [];
    }

    this.showModal(title, `
      <div id="school-form-container">
        <div class="form-group">
          <label class="form-label">ID / Código DANE (Único) *</label>
          <input type="text" class="form-input" id="school-id-custom" 
                 value="${isEdit ? school.id : ''}" 
                 placeholder="Ej: 111001123456" 
                 ${isEdit ? 'readonly style="background-color: var(--color-background); cursor: not-allowed;"' : 'required'}>
        </div>
        <div class="form-group">
          <label class="form-label">Nombre del Colegio *</label>
          <input type="text" class="form-input" id="school-nombre" 
                 value="${isEdit ? school.nombre : ''}" 
                 placeholder="Ej: Colegio San Francisco" autocomplete="off">
        </div>
        <div class="form-group">
          <label class="form-label">Dirección *</label>
          <input type="text" class="form-input" id="school-direccion" 
                 value="${isEdit ? school.direccion : ''}" 
                 placeholder="Ej: Calle 100 #15-30" autocomplete="off">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
          <div class="form-group">
            <label class="form-label">Fase *</label>
            <select class="form-input form-select" id="school-fase">
              <option value="">Seleccionar...</option>
              <option value="NORTE" ${isEdit && school.fase === 'NORTE' ? 'selected' : ''}>Norte</option>
              <option value="CENTRO_OCCIDENTE" ${isEdit && school.fase === 'CENTRO_OCCIDENTE' ? 'selected' : ''}>Centro/Occidente</option>
              <option value="SUR_ORIENTE" ${isEdit && school.fase === 'SUR_ORIENTE' ? 'selected' : ''}>Sur/Oriente</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">UPZ *</label>
            <input type="text" class="form-input" id="school-upz" 
                   value="${isEdit ? school.upz : ''}" 
                   placeholder="Ej: UPZ Usaquén" 
                   list="upz-list">
            <datalist id="upz-list">
              ${zones.map(z => `<option value="${z}">`).join('')}
            </datalist>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
          <div class="form-group">
            <label class="form-label">Total de Equipos *</label>
            <input type="number" class="form-input" id="school-equipos" 
                   value="${isEdit ? (school.totalequipos || school.totalEquipos) : ''}" 
                   placeholder="Ej: 15" min="1">
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono Contacto</label>
            <input type="tel" class="form-input" id="school-telefono" 
                   value="${isEdit ? school.telefono || '' : ''}" 
                   placeholder="Ej: 3001234567" autocomplete="off">
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
          <div class="form-group">
            <label class="form-label">Nombre del Contacto</label>
            <input type="text" class="form-input" id="school-contacto" 
                   value="${isEdit ? school.contacto || '' : ''}" 
                   placeholder="Ej: Prof. García" autocomplete="off">
          </div>
          <div class="form-group">
            <label class="form-label">Técnico Responsable</label>
            <select class="form-input form-select" id="school-tecnico">
              <option value="">Seleccionar técnico...</option>
              ${technicians.map(u => `
                <option value="${u.id}" ${isEdit && (school.tecnicoId || school.tecnicoid) === u.id ? 'selected' : ''}>${u.nombre || u.Nombre} (${u.zona || u.Zona || 'Sin zona'})</option>
              `).join('')}
            </select>
          </div>
        </div>
        <div style="display: flex; gap: var(--spacing-sm); margin-top: var(--spacing-lg);">
          <button class="btn btn-secondary" id="btn-cancel-school">
            Cancelar
          </button>
          <button class="btn btn-primary" id="btn-save-school" style="flex: 1;">
            ${isEdit ? '💾 Guardar Cambios' : '➕ Agregar Colegio'}
          </button>
        </div>
      </div>
    `);

    // Eventos directos
    document.getElementById('btn-cancel-school')?.addEventListener('click', () => {
      this.showSchoolsManager();
    });

    document.getElementById('btn-save-school')?.addEventListener('click', () => {
      this.saveSchool(isEdit ? school.id : null);
    });

    // Auto-sugestión de técnico por UPZ
    const upzInput = document.getElementById('school-upz');
    const tecnicoSelect = document.getElementById('school-tecnico');

    upzInput?.addEventListener('input', () => {
      const upzValue = upzInput.value.trim().toLowerCase();
      if (upzValue && technicians.length > 0) {
        const suggestedTech = technicians.find(u => (u.zona || '').trim().toLowerCase() === upzValue);
        if (suggestedTech) {
          tecnicoSelect.value = suggestedTech.id;
        }
      }
    });
  },

  /**
   * Guardar colegio (nuevo o actualizado)
   */
  async saveSchool(schoolId) {
    const customId = document.getElementById('school-id-custom').value.trim();
    const nombre = document.getElementById('school-nombre').value.trim();
    const direccion = document.getElementById('school-direccion').value.trim();
    const fase = document.getElementById('school-fase').value;
    const upz = document.getElementById('school-upz').value.trim();
    const totalEquipos = parseInt(document.getElementById('school-equipos').value) || 0;
    const telefono = document.getElementById('school-telefono').value.trim();
    const contacto = document.getElementById('school-contacto').value.trim();
    const tecnicoId = document.getElementById('school-tecnico').value;

    if (!customId || !nombre || !direccion || !fase || !upz) {
      Toast.show('Faltan campos obligatorios (ID, Nombre, Dirección, Fase, UPZ)', 'warning');
      return;
    }

    if (!totalEquipos || totalEquipos <= 0) {
      Toast.show('Ingresa una cantidad válida de equipos', 'warning');
      document.getElementById('school-equipos').focus();
      return;
    }

    const schoolData = {
      id: customId,
      nombre,
      direccion,
      fase,
      upz,
      totalequipos: totalEquipos,
      telefono,
      contacto,
      tecnicoid: tecnicoId
    };

    const btn = document.getElementById('btn-save-school');
    if (btn) { btn.disabled = true; btn.innerText = 'Guardando...'; }

    try {
      const res = await API.post('addSchool', schoolData);
      if (res && res.success) {
        Toast.show(schoolId ? 'Colegio actualizado' : 'Colegio agregado', 'success');
        this.showSchoolsManager();
        if (typeof AdminDashboard !== 'undefined') {
          await AdminDashboard.loadMetrics();
          AdminDashboard.render();
        }
      } else {
        const errorMsg = res?.error || 'Error desconocido';
        Toast.show(`Error: ${errorMsg}`, 'danger');
        if (btn) { btn.disabled = false; btn.innerText = 'Reintentar'; }
      }
    } catch (e) {
      console.error(e);
      Toast.show(`Error de red: ${e.message}`, 'danger');
      if (btn) { btn.disabled = false; btn.innerText = 'Reintentar'; }
    }
  },

  /**
   * Eliminar colegio
   */
  deleteSchool(schoolId) {
    const schoolIndex = DEMO_DATA.schools.findIndex(s => s.id === schoolId);
    if (schoolIndex >= 0) {
      DEMO_DATA.schools.splice(schoolIndex, 1);
      Toast.show('Colegio eliminado', 'success');
      this.showSchoolsManager();

      // Nueva lógica: Refrescar métricas automáticamente
      if (typeof AdminDashboard !== 'undefined') {
        AdminDashboard.loadMetrics().then(() => {
          if (AdminDashboard.currentView === 'statistics' || AdminDashboard.currentView === 'dashboard') {
            AdminDashboard.render();
          }
        });
      }
    }
  }
};

// Iniciar aplicación cuando cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

window.App = App;
window.Toast = Toast;
window.Router = Router;

