/**
 * QINAYA TRACKER - Charts Module
 * Gráficos con Chart.js
 */

const Charts = {
    instances: {},

    /**
     * Colores del tema
     */
    colors: {
        primary: '#3B82F6',
        success: '#22C55E',
        warning: '#F97316',
        danger: '#EF4444',
        muted: '#94A3B8',
        grid: '#E2E8F0'
    },

    /**
     * Renderizar gráfico de actividad semanal
     */
    renderWeeklyChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Destruir instancia anterior si existe
        if (this.instances[canvasId]) {
            this.instances[canvasId].destroy();
        }

        const ctx = canvas.getContext('2d');

        this.instances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.day),
                datasets: [{
                    label: 'Instalaciones',
                    data: data.map(d => d.count),
                    backgroundColor: data.map((d, i) =>
                        i === data.length - 1 ? this.colors.primary : this.colors.primary + '80'
                    ),
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1E293B',
                        padding: 12,
                        cornerRadius: 8,
                        titleFont: { weight: '600' },
                        callbacks: {
                            title: (items) => {
                                const idx = items[0].dataIndex;
                                return data[idx].date;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: this.colors.muted
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: this.colors.grid
                        },
                        ticks: {
                            color: this.colors.muted,
                            stepSize: 1
                        }
                    }
                }
            }
        });
    },

    /**
     * Renderizar gráfico de proyección
     */
    renderProjectionChart(canvasId, metrics) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        if (this.instances[canvasId]) {
            this.instances[canvasId].destroy();
        }

        const ctx = canvas.getContext('2d');

        // Generar datos de proyección
        const days = [];
        const actual = [];
        const projected = [];
        const goal = [];

        const dailyGoal = CONFIG.PROJECT.totalLicenses / CONFIG.PROJECT.totalDays;

        // Calcular día actual del proyecto (Día 1 a 45)
        const startDate = new Date(CONFIG.PROJECT.startDate || '2026-01-01');
        const today = new Date();
        const diffTime = Math.abs(today - startDate);
        const currentDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const safeCurrentDay = Math.max(1, Math.min(45, currentDay));

        for (let i = 1; i <= CONFIG.PROJECT.totalDays; i++) {
            days.push(`Día ${i}`);
            goal.push(Math.round(dailyGoal * i));

            if (i < safeCurrentDay) {
                // Para días pasados, mostramos una curva lineal hacia el total actual
                // Nota: Idealmente esto vendría por día desde el historial en el API
                actual.push(Math.round((metrics.totalInstalled / safeCurrentDay) * i));
                projected.push(null);
            } else if (i === safeCurrentDay) {
                // Hoy
                actual.push(metrics.totalInstalled);
                projected.push(metrics.totalInstalled);
            } else {
                // Proyección a futuro basada en el ritmo actual
                actual.push(null);
                const currentRate = metrics.totalInstalled / safeCurrentDay;
                projected.push(Math.round(metrics.totalInstalled + (currentRate * (i - safeCurrentDay))));
            }
        }

        this.instances[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: days.slice(0, 15),
                datasets: [
                    {
                        label: 'Meta Ideal',
                        data: goal.slice(0, 15),
                        borderColor: this.colors.muted,
                        borderDash: [5, 5],
                        backgroundColor: 'transparent',
                        tension: 0,
                        pointRadius: 0
                    },
                    {
                        label: 'Progreso Real',
                        data: actual.slice(0, 15),
                        borderColor: this.colors.primary,
                        backgroundColor: this.colors.primary + '20',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: this.colors.primary
                    },
                    {
                        label: 'Proyección',
                        data: projected.slice(0, 15),
                        borderColor: this.colors.success,
                        borderDash: [3, 3],
                        backgroundColor: 'transparent',
                        tension: 0.4,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1E293B',
                        padding: 12,
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: this.colors.muted,
                            maxTicksLimit: 8
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: this.colors.grid
                        },
                        ticks: {
                            color: this.colors.muted
                        }
                    }
                }
            }
        });
    },

    /**
     * Renderizar gráfico de dona (progreso por fase)
     */
    renderPhaseDonut(canvasId, phases) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        if (this.instances[canvasId]) {
            this.instances[canvasId].destroy();
        }

        const ctx = canvas.getContext('2d');
        const phaseData = Object.values(phases);

        this.instances[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: phaseData.map(p => p.name),
                datasets: [{
                    data: phaseData.map(p => p.installed),
                    backgroundColor: [
                        this.colors.primary,
                        this.colors.warning,
                        this.colors.success
                    ],
                    borderWidth: 0,
                    cutout: '70%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 16
                        }
                    }
                }
            }
        });
    }
};

window.Charts = Charts;
