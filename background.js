// background.js
//
// NOTA: Si modificás este archivo u otro del repo, incrementá "version"
// en manifest.json y creá un GitHub Release. Ver README → "Política de versionado".

// Importar el módulo de actualización
importScripts("updater.js");

// Al instalar la extensión, configuramos una alarma para que se ejecute cada 3 minutos
chrome.runtime.onInstalled.addListener(() => {
    console.log("ITU Keep-Alive instalado. Configurando alarmas...");
    chrome.alarms.create("keepAliveMoodle", { periodInMinutes: 3 });

    // Configurar la alarma de actualizaciones
    setupUpdateAlarm();

    // Chequear actualizaciones inmediatamente al instalar/actualizar
    checkForUpdates();
});

// Crea (o reutiliza) el documento offscreen y envía el mensaje de ping
async function doPing() {
    // Verificar si ya existe un documento offscreen
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ["OFFSCREEN_DOCUMENT"],
        documentUrls: [chrome.runtime.getURL("offscreen.html")]
    });

    if (existingContexts.length === 0) {
        // Crear el documento offscreen si no existe
        await chrome.offscreen.createDocument({
            url: "offscreen.html",
            reasons: ["DOM_SCRAPING"],
            justification: "Se necesita un contexto DOM para enviar fetch con cookies de sesión"
        });
    }

    // Enviar mensaje al offscreen document para que haga el fetch
    const response = await chrome.runtime.sendMessage({ action: "keepAlivePing" });
    if (response?.success) {
        console.log(`Ping exitoso (Status: ${response.status})`);
    } else {
        console.error("Error en el ping:", response?.error);
    }
}

// Escuchamos las alarmas (keep-alive + updater)
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "keepAliveMoodle") {
        console.log("Haciendo ping a Moodle para mantener la sesión viva...");
        doPing();
    }

    // Delegar al updater si es su alarma
    handleUpdateAlarm(alarm);
});

// Listener para clicks en notificaciones (usado por el updater)
chrome.notifications.onClicked.addListener((notificationId) => {
    handleNotificationClick(notificationId);
});
