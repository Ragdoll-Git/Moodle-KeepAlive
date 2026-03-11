// background.js

// Al instalar la extensión, configuramos una alarma para que se ejecute cada 3 minutos
chrome.runtime.onInstalled.addListener(() => {
    console.log("ITU Keep-Alive instalado. Configurando alarma...");
    chrome.alarms.create("keepAliveMoodle", { periodInMinutes: 3 });
});

// Escuchamos la alarma
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "keepAliveMoodle") {
        console.log("Haciendo ping a Moodle para mantener la sesión viva...");

        // Hacemos una petición a la página principal del Moodle.
        // Incluir credenciales envía las cookies de sesión del usuario.
        fetch("https://aulas.itu.uncu.edu.ar/itu/my/", {
            method: "GET",
            // Es crucial habilitar las credenciales (cookies) al hacer fetch desde un service worker extension
            credentials: "include"
        })
            .then(response => {
                console.log(`Ping exitoso (Status: ${response.status})`);
                // Si el status es 200, la página cargó (estamos logueados).
                // Si nos hubiera deslogueado y redirigiera al login, el status también suele ser 200 pero la URL final cambia.
                // De todas formas, la simple petición al servidor renueva el contador del timeout.
            })
            .catch(error => {
                console.error("Error al intentar hacer el ping a Moodle:", error);
            });
    }
});
