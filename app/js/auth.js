/**
 * QINAYA TRACKER - Authentication Module
 * Manejo de login, sesiones y roles
 */

const Auth = {
    currentUser: null,

    /**
     * Inicializar autenticación
     */
    init() {
        this.checkSession();
    },

    /**
     * Verificar sesión guardada
     */
    checkSession() {
        const savedUser = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                return true;
            } catch (e) {
                this.logout();
                return false;
            }
        }
        return false;
    },

    /**
     * Login de usuario
     */
    async login(email, password) {
        try {
            let user = null;

            if (DEMO_MODE) {
                // Buscar en datos demo
                user = DEMO_DATA.users.find(u =>
                    u.email === email && u.password === password
                );
            } else {
                // Llamar a la API real
                const response = await API.post('login', { email, password });
                if (response.success) {
                    user = response.data;
                }
            }

            if (user) {
                this.currentUser = user;
                localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
                return { success: true, user };
            } else {
                return { success: false, error: 'Credenciales incorrectas' };
            }
        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, error: 'Error de conexión' };
        }
    },

    /**
     * Logout
     */
    logout() {
        this.currentUser = null;
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
        window.location.hash = '#login';
    },

    /**
     * Verificar si está autenticado
     */
    isAuthenticated() {
        return this.currentUser !== null;
    },

    /**
     * Verificar si es administrador
     */
    isAdmin() {
        return this.currentUser?.rol === CONFIG.ROLES.ADMIN;
    },

    /**
     * Verificar si es técnico
     */
    isTechnician() {
        return this.currentUser?.rol === CONFIG.ROLES.TECHNICIAN;
    },

    /**
     * Obtener usuario actual
     */
    getUser() {
        return this.currentUser;
    },

    /**
     * Obtener iniciales del nombre
     */
    getInitials() {
        if (!this.currentUser?.nombre) return '??';
        const parts = this.currentUser.nombre.split(' ');
        return parts.map(p => p[0]).slice(0, 2).join('').toUpperCase();
    }
};

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});

window.Auth = Auth;
