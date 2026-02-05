# ⚠️ ACCIÓN REQUERIDA: ACTUALIZAR BACKEND (GOOGLE APPS SCRIPT)

Para que el nuevo formulario de "Crear Técnico" funcione y el botón no se quede en "Reintentar", **es obligatorio actualizar el código en la nube**.

El archivo `Code.gs` en tu computadora tiene las funciones `addUser`, `addSchool`, etc., pero Google Apps Script (en la nube) **NO las tiene todavía**.

### 📝 Pasos para solucionar el error:

1.  **Copia el código local**:
    *   Abre el archivo `backend/Code.gs` en tu editor.
    *   Selecciona todo el código (`Ctrl + A`) y cópialo (`Ctrl + C`).

2.  **Ve al Editor de Google Apps Script**:
    *   Abre tu navegador y ve a tu proyecto en [script.google.com](https://script.google.com/).
    *   O usa el enlace directo si lo tienes guardado.

3.  **Pega el nuevo código**:
    *   Borra todo el contenido que haya en el archivo `Code.gs` online.
    *   Pega el código que acabas de copiar (`Ctrl + V`).
    *   Guarda los cambios (Icono de disquete o `Ctrl + S`).

4.  **🚀 IMPORTANTE: DESPLEGAR NUEVA VERSIÓN**:
    *   Arriba a la derecha, clic en el botón azul **"Implementar" (Deploy)**.
    *   Selecciona **"Gestionar implementaciones" (Manage deployments)**.
    *   Clic en el icono de lápiz ✏️ o en **"Editar"**.
    *   En "Versión", selecciona **"Nueva versión"**.
    *   Clic en **"Implementar" (Deploy)**.

5.  **Prueba final**:
    *   Vuelve a tu aplicación local.
    *   Refresca la página (`Ctrl + Shift + R`).
    *   Intenta crear un técnico de nuevo. ¡Ahora debería funcionar!
