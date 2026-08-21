// offscreen.js
// Este script corre en un documento offscreen (contexto DOM),
// por lo que tiene acceso a las cookies del navegador mediante fetch + credentials.

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === "keepAlivePing") {
        fetch("https://aulas.itu.uncu.edu.ar/itu/my/", {
            method: "GET",
            credentials: "include"
        })
            .then(response => {
                console.log(`Ping exitoso (Status: ${response.status})`);
                sendResponse({ success: true, status: response.status });
            })
            .catch(error => {
                console.error("Error al intentar hacer el ping a Moodle:", error);
                sendResponse({ success: false, error: error.message });
            });

        // Retornar true indica que sendResponse se llamará de forma asíncrona
        return true;
    }
});
