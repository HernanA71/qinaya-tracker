# Qinaya Tracker

Sistema de seguimiento de instalaciones del software educativo Qinaya.

## 🎯 Descripción

Aplicación web para gestionar y monitorear las instalaciones del software Qinaya en instituciones educativas. Permite a los técnicos registrar instalaciones, generar actas de entrega, y a los coordinadores visualizar el progreso en tiempo real.

## ✨ Características

- **Dashboard de Técnicos**: Registro de instalaciones con checklist de verificación
- **Dashboard de Coordinadores**: Vista general del progreso por fase y técnico
- **Actas de Entrega**: Generación automática de actas diarias y de colegio completado
- **Geolocalización**: Registro automático de ubicación GPS
- **Alertas QA**: Notificaciones de problemas en instalaciones

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Google Apps Script
- **Base de Datos**: Google Sheets
- **Hosting**: GitHub Pages (opcional)

## 📁 Estructura

```
├── app/
│   ├── assets/          # Logos e imágenes
│   ├── js/              # Módulos JavaScript
│   └── styles/          # Hojas de estilo CSS
├── backend/
│   └── Code.gs          # Google Apps Script
└── index.html           # Punto de entrada
```

## 🚀 Instalación

1. Clona el repositorio
2. Configura el Google Apps Script en tu Google Sheet
3. Actualiza la URL del API en `app/js/config.js`
4. Despliega en GitHub Pages o servidor local

## 📄 Licencia

MIT License
