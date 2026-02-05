/**
 * QINAYA TRACKER - API Module
 * Comunicación con Google Apps Script
 */

const API = {
    /**
     * Realizar petición GET
     */
    async get(action, params = {}) {
        if (DEMO_MODE) {
            return this.handleDemoRequest('GET', action, params);
        }

        const url = new URL(CONFIG.API_URL);
        url.searchParams.append('action', action);
        Object.keys(params).forEach(key => {
            url.searchParams.append(key, params[key]);
        });

        try {
            console.log(`API GET: ${action}`, url.toString());
            const response = await fetch(url.toString());
            const data = await response.json();
            console.log(`API Response: ${action}`, data);
            return data;
        } catch (error) {
            console.error('API GET Error:', error);
            throw error;
        }
    },

    /**
     * Realizar petición POST
     */
    async post(action, data = {}) {
        if (DEMO_MODE) {
            return this.handleDemoRequest('POST', action, data);
        }

        try {
            console.log(`API POST: ${action}`, data);
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify({ action, ...data })
            });
            const resData = await response.json();
            console.log(`API Response: ${action}`, resData);
            return resData;
        } catch (error) {
            console.error('API POST Error:', error);
            throw error;
        }
    },

    /**
     * Manejar peticiones en modo demo
     */
    handleDemoRequest(method, action, data) {
        return new Promise((resolve) => {
            // Simular delay de red
            setTimeout(() => {
                switch (action) {
                    case 'login':
                        const user = DEMO_DATA.users.find(u =>
                            u.email === data.email && u.password === data.password
                        );
                        resolve(user ? { success: true, data: user } : { success: false });
                        break;

                    case 'getSchools':
                        resolve({ success: true, data: DEMO_DATA.schools });
                        break;

                    case 'getTechnicians':
                        const techs = DEMO_DATA.users.filter(u => u.rol === 'tecnico');
                        resolve({ success: true, data: techs });
                        break;

                    case 'getInstallations':
                        let installs = [...DEMO_DATA.installations];
                        if (data.tecnicoId) {
                            installs = installs.filter(i => i.tecnicoId === data.tecnicoId);
                        }
                        if (data.fecha) {
                            installs = installs.filter(i => i.fecha === data.fecha);
                        }
                        resolve({ success: true, data: installs });
                        break;

                    case 'saveInstallation':
                        const newInstall = {
                            id: 'ins' + Date.now(),
                            ...data,
                            fecha: new Date().toISOString().split('T')[0]
                        };
                        DEMO_DATA.installations.push(newInstall);
                        resolve({ success: true, data: newInstall });
                        break;

                    case 'getMetrics':
                        resolve({ success: true, data: this.calculateDemoMetrics() });
                        break;

                    default:
                        resolve({ success: false, error: 'Action not found' });
                }
            }, 300);
        });
    },

    /**
     * Calcular métricas en modo demo
     */
    calculateDemoMetrics() {
        const installations = DEMO_DATA.installations;
        const schools = DEMO_DATA.schools;
        const technicians = DEMO_DATA.users.filter(u => u.rol.toLowerCase() === 'tecnico');

        // Total instalaciones
        const totalInstalled = installations.length;

        // Por fase
        const byPhase = {};
        Object.keys(CONFIG.PHASES).forEach(phase => {
            const phaseSchools = schools.filter(s => s.fase === phase);
            const phaseIds = phaseSchools.map(s => s.id);
            const phaseInstalls = installations.filter(i => phaseIds.includes(i.colegioId));
            const totalEquipos = phaseSchools.reduce((sum, s) => sum + s.totalEquipos, 0);

            byPhase[phase] = {
                name: CONFIG.PHASES[phase].name,
                installed: phaseInstalls.length,
                total: totalEquipos,
                percentage: totalEquipos > 0 ? Math.round((phaseInstalls.length / totalEquipos) * 100) : 0
            };
        });

        // Por técnico
        const byTechnician = technicians.map(tech => {
            const techInstalls = installations.filter(i => i.tecnicoId === tech.id);
            const assignedSchools = schools.filter(s => {
                // Prioridad 1: Asignación explícita por ID
                if (s.tecnicoId) return s.tecnicoId === tech.id;

                // Prioridad 2: Asignación por Zona (solo si nadie más la tiene tomada)
                // Para evitar duplicidad, si hay varios técnicos en la misma zona, 
                // solo el "principal" (el primero) toma los colegios no asignados.
                if (s.upz === tech.zona) {
                    const firstTechInZone = technicians.find(t => t.zona === s.upz);
                    return firstTechInZone && firstTechInZone.id === tech.id;
                }
                return false;
            });
            const totalEquipos = assignedSchools.reduce((sum, s) => sum + s.totalEquipos, 0);

            return {
                id: tech.id,
                nombre: tech.nombre,
                zona: tech.zona,
                installed: techInstalls.length,
                total: totalEquipos,
                percentage: totalEquipos > 0 ? Math.round((techInstalls.length / totalEquipos) * 100) : 0,
                hasAlerts: techInstalls.some(i => !i.checkAbre || !i.checkInternet || !i.checkLicencia)
            };
        });

        // Alertas QA
        const alerts = installations
            .filter(i => !i.checkAbre || !i.checkInternet || !i.checkLicencia)
            .map(i => {
                const tech = technicians.find(t => t.id === i.tecnicoId);
                const school = schools.find(s => s.id === i.colegioId);
                return {
                    id: i.id,
                    tecnico: tech?.nombre || 'Desconocido',
                    colegio: school?.nombre || 'Desconocido',
                    equipo: i.equipoId,
                    fecha: i.fecha,
                    issues: [
                        !i.checkAbre ? 'Software no abre' : null,
                        !i.checkInternet ? 'Sin internet' : null,
                        !i.checkLicencia ? 'Licencia no verificada' : null
                    ].filter(Boolean)
                };
            });

        // Pendientes por zona
        const pendingByZone = [];
        technicians.forEach(tech => {
            const assignedSchools = schools.filter(s => {
                if (s.tecnicoId) return s.tecnicoId === tech.id;
                if (s.upz === tech.zona) {
                    const firstTechInZone = technicians.find(t => t.zona === s.upz);
                    return firstTechInZone && firstTechInZone.id === tech.id;
                }
                return false;
            });
            const totalEquipos = assignedSchools.reduce((sum, s) => sum + s.totalEquipos, 0);
            const installed = installations.filter(i => i.tecnicoId === tech.id).length;
            const pending = totalEquipos - installed;

            if (pending > 0) {
                pendingByZone.push({
                    zona: tech.zona,
                    pending,
                    total: totalEquipos
                });
            }
        });

        // Colegios completados dinámico
        const schoolProgress = {};
        installations.forEach(inst => {
            if (!schoolProgress[inst.colegioId]) {
                schoolProgress[inst.colegioId] = 0;
            }
            schoolProgress[inst.colegioId]++;
        });

        const schoolsCompleted = schools.filter(school => {
            const installed = schoolProgress[school.id] || 0;
            return installed >= school.totalEquipos;
        }).length;

        // Actividad por día (últimos 7 días)
        const dailyActivity = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayInstalls = installations.filter(inst => inst.fecha === dateStr);

            dailyActivity.push({
                date: dateStr,
                day: CONFIG.DAYS_SHORT[date.getDay()],
                count: dayInstalls.length
            });
        }

        return {
            totalInstalled,
            totalRequired: CONFIG.PROJECT.totalLicenses,
            percentage: Math.round((totalInstalled / CONFIG.PROJECT.totalLicenses) * 100),
            schoolsCompleted: schoolsCompleted,
            totalSchools: schools.length,
            byPhase,
            byTechnician,
            alerts,
            pendingByZone,
            dailyActivity
        };
    }
};

window.API = API;
