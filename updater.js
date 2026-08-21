// updater.js
// Sistema de auto-actualización desde GitHub Releases.
// Compara la versión local (manifest.json) con la última release en GitHub
// y notifica al usuario si hay una versión nueva disponible.
//
// ╔══════════════════════════════════════════════════════════════════════╗
// ║  ATENCIÓN — AGENTES DE IA / CONTRIBUIDORES:                       ║
// ║  Si modificás CUALQUIER archivo de este repositorio, es            ║
// ║  OBLIGATORIO incrementar "version" en manifest.json y luego       ║
// ║  crear un GitHub Release con tag que coincida (ej: v1.2).         ║
// ║  Sin esto, los usuarios NO recibirán la actualización.            ║
// ║  Ver README.md → "Política de versionado" para más detalles.     ║
// ╚══════════════════════════════════════════════════════════════════════╝

const GITHUB_OWNER = "Ragdoll-Git";
const GITHUB_REPO = "Moodle-KeepAlive";
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
const CHECK_INTERVAL_HOURS = 6; // Cada cuántas horas chequear actualizaciones
const ALARM_NAME = "checkForUpdates";
const NOTIFICATION_ID = "moodle-keepalive-update";

/**
 * Compara dos versiones semánticas (e.g. "1.0" vs "1.1").
 * Retorna true si remoteVersion es mayor que localVersion.
 */
function isNewerVersion(localVersion, remoteVersion) {
    const local = localVersion.split(".").map(Number);
    const remote = remoteVersion.split(".").map(Number);
    const maxLength = Math.max(local.length, remote.length);

    for (let i = 0; i < maxLength; i++) {
        const l = local[i] || 0;
        const r = remote[i] || 0;
        if (r > l) return true;
        if (r < l) return false;
    }
    return false;
}

/**
 * Consulta la API de GitHub para obtener la última release.
 * Retorna { version, downloadUrl, releaseUrl, body } o null si falla.
 */
async function fetchLatestRelease() {
    try {
        const response = await fetch(GITHUB_API_URL, {
            headers: { "Accept": "application/vnd.github.v3+json" }
        });

        if (!response.ok) {
            console.warn(`[Updater] GitHub API respondió con status ${response.status}`);
            return null;
        }

        const data = await response.json();

        // El tag_name suele ser "v1.1" o "1.1", normalizamos quitando la "v"
        const version = (data.tag_name || "").replace(/^v/i, "");
        const downloadUrl = data.assets?.[0]?.browser_download_url || data.zipball_url;
        const releaseUrl = data.html_url;
        const body = data.body || "";

        return { version, downloadUrl, releaseUrl, body };
    } catch (error) {
        console.error("[Updater] Error al consultar GitHub:", error);
        return null;
    }
}

/**
 * Chequea si hay una actualización disponible.
 * Si la hay, muestra una notificación al usuario.
 */
async function checkForUpdates() {
    console.log("[Updater] Chequeando actualizaciones...");

    const manifest = chrome.runtime.getManifest();
    const localVersion = manifest.version;

    const release = await fetchLatestRelease();
    if (!release || !release.version) {
        console.log("[Updater] No se pudo obtener info de la última release.");
        return;
    }

    console.log(`[Updater] Versión local: ${localVersion} | Última release: ${release.version}`);

    if (isNewerVersion(localVersion, release.version)) {
        console.log(`[Updater] ¡Nueva versión disponible! ${release.version}`);

        // Guardar la info de la update en storage para poder accederla al clickear la notificación
        await chrome.storage.local.set({
            pendingUpdate: {
                version: release.version,
                downloadUrl: release.downloadUrl,
                releaseUrl: release.releaseUrl,
                body: release.body,
                detectedAt: new Date().toISOString()
            }
        });

        // Mostrar notificación
        chrome.notifications.create(NOTIFICATION_ID, {
            type: "basic",
            iconUrl: chrome.runtime.getURL("icon128.png"),
            title: "🔄 Actualización disponible",
            message: `Moodle Keep-Alive v${release.version} está disponible. Hacé click para descargar.`,
            priority: 2,
            requireInteraction: true
        });
    } else {
        console.log("[Updater] La extensión está actualizada.");
    }
}

/**
 * Configura la alarma periódica para chequear actualizaciones.
 */
function setupUpdateAlarm() {
    chrome.alarms.create(ALARM_NAME, {
        delayInMinutes: 1, // Primer chequeo 1 minuto después de instalar
        periodInMinutes: CHECK_INTERVAL_HOURS * 60
    });
    console.log(`[Updater] Alarma configurada: chequeo cada ${CHECK_INTERVAL_HOURS} horas.`);
}

/**
 * Handler para cuando el usuario clickea la notificación de actualización.
 * Abre la página de releases en GitHub.
 */
async function handleNotificationClick(notificationId) {
    if (notificationId !== NOTIFICATION_ID) return;

    const data = await chrome.storage.local.get("pendingUpdate");
    const url = data.pendingUpdate?.releaseUrl
        || `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

    chrome.tabs.create({ url });
    chrome.notifications.clear(NOTIFICATION_ID);
}

/**
 * Handler para la alarma de actualizaciones.
 */
function handleUpdateAlarm(alarm) {
    if (alarm.name === ALARM_NAME) {
        checkForUpdates();
    }
}

// Exportar funciones para usar desde background.js
// (En service workers de extensiones, se usa importScripts, así que
// las funciones quedan en el scope global)
