# Moodle-KeepAlive
Extension de Chrome para que no te salga el cartelito de "Sesion vencida, autenticarse de nuevo" en moodle

Descargar archivos y guardarlos en una carpeta

Activar opciones de desarrollador de Chrome, cargar descomprimida y seleccionar la carpeta donde estan los archivos
Recargar la pagina. Listo

## Actualización automática

La extensión incluye un sistema de auto-actualización que consulta GitHub Releases cada 6 horas.

**¿Cómo funciona?**
1. La extensión compara su versión local (`manifest.json → version`) con el último release de GitHub.
2. Si hay una versión nueva, muestra una **notificación de Chrome** con un link para descargar.
3. Al hacer click en la notificación, se abre la página de releases de GitHub para descargar el `.zip`.

---

## ⚠️ IMPORTANTE — Política de versionado (leer antes de editar)

> **Para cualquier persona o agente de IA que modifique este repositorio:**
>
> Si hacés **cualquier cambio funcional** al código (fix, feature, refactor, etc.),
> **es obligatorio** seguir estos pasos:
>
> 1. **Incrementar la versión** en `manifest.json` → campo `"version"`.
>    - Usar versionado numérico simple: `1.0` → `1.1` → `1.2` → `2.0`, etc.
> 2. **Crear un GitHub Release** con la nueva versión como tag (ej: `v1.1`).
>    - El tag del release **debe coincidir** con la versión del manifest (con o sin prefijo `v`).
>    - El updater compara contra el `tag_name` de la última release.
> 3. Opcionalmente, adjuntar un `.zip` con los archivos de la extensión como asset del release.
>
> **¿Por qué?** Los usuarios tienen la extensión cargada localmente (no desde la Chrome Web Store).
> La única forma en que reciben actualizaciones es mediante el sistema de auto-update que chequea
> GitHub Releases. Si no se bumpa la versión y se crea un release, **los usuarios nunca van a
> recibir la actualización**.

---

## Log de errores

### 2026-08-17 — `TypeError: Failed to fetch` en background.js

**Error:**
```
Error al intentar hacer el ping a Moodle: TypeError: Failed to fetch
    at background.js:28 (anonymous function)
```

**Causa:**
En Manifest V3, el `background.js` corre como **service worker** (contexto aislado). El service worker no tiene acceso al cookie jar del navegador, por lo que `fetch()` con `credentials: "include"` falla — no puede enviar las cookies de sesión de Moodle.

**Solución:**
Se implementó la API `chrome.offscreen` para crear un documento offscreen (contexto DOM) que sí tiene acceso a las cookies del navegador:

- Se creó `offscreen.html` y `offscreen.js` — ejecutan el `fetch` con cookies desde un contexto DOM.
- Se modificó `background.js` — ahora delega el ping al documento offscreen vía `chrome.runtime.sendMessage`.
- Se agregó el permiso `"offscreen"` en `manifest.json`.
