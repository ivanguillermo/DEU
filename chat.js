// chat.js - Módulo de Conversación Inteligente (Bilingüe + Vocabulario)
let chatTemasData = [];
let temaActual = null;
let historialConversacion = [];

async function initChatModule() {
    if (!accessToken) return;
    const loadingEl = document.getElementById('loading-chat');
    const uiEl = document.getElementById('chat-card-ui');
    
    if (loadingEl) loadingEl.style.display = 'block';
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Chat_Temas!A:D`;
    try {
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
        const data = await response.json();
        
        if (loadingEl) loadingEl.style.display = 'none';
        if (uiEl) uiEl.style.display = 'block';
        
        chatTemasData = [];
        const selectEl = document.getElementById('chat-tema-select');
        selectEl.innerHTML = '<option value="">-- Selecciona un tema o escribe uno libre --</option>';
        
        if (data.values && data.values.length > 1) {
            for (let i = 1; i < data.values.length; i++) {
                const r = data.values[i];
                if (r[1]) {
                    const temaObj = {
                        id: r[0],
                        titulo: r[1],
                        palabras: r[2] || '',
                        nivel: r[3] || 'B1'
                    };
                    chatTemasData.push(temaObj);
                    
                    const opt = document.createElement('option');
                    opt.value = i - 1;
                    opt.innerText = `${temaObj.titulo} (${temaObj.nivel})`;
                    selectEl.appendChild(opt);
                }
            }
        }
    } catch (err) {
        console.error("Error cargando temas de chat:", err);
    }
}

function seleccionarTemaChat() {
    const index = document.getElementById('chat-tema-select').value;
    const customInput = document.getElementById('chat-custom-tema').value;
    
    if (index !== "") {
        temaActual = chatTemasData[index];
    } else if (customInput.trim() !== "") {
        temaActual = {
            titulo: customInput,
            palabras: "sprechen, lernen, gut",
            nivel: "B1"
        };
    } else {
        alert("Por favor selecciona un tema o escribe uno.");
        return;
    }
    
    // Mostrar palabras clave obligatorias en pantalla
    document.getElementById('chat-keywords-box').style.display = 'block';
    document.getElementById('chat-keywords-list').innerText = temaActual.palabras;
    
    // Inicializar chat
    historialConversacion = [];
    document.getElementById('chat-messages-container').innerHTML = '';
    
    // Mensaje inicial de la IA
    const saludoInicial = `Hallo! Guten Tag. Empecemos a hablar sobre: "${temaActual.titulo}". Intenta usar estas palabras clave: [${temaActual.palabras}]. ¿Cómo te sientes al respecto? (Escríbeme en mitad alemán, mitad español como prefieras).`;
    agregarMensajeChat('ia', saludoInicial);
    historialConversacion.push({ role: "model", parts: [{ text: saludoInicial }] });
}

async function enviarMensajeChat() {
    const inputEl = document.getElementById('chat-user-input');
    const mensajeTexto = inputEl.value.trim();
    if (!mensajeTexto || !temaActual) return;
    
    agregarMensajeChat('user', mensajeTexto);
    inputEl.value = '';
    
    historialConversacion.push({ role: "user", parts: [{ text: mensajeTexto }] });
    
    // Indicador de escribiendo
    const container = document.getElementById('chat-messages-container');
    const typingId = 'typing-' + Date.now();
    container.innerHTML += `<div id="${typingId}" style="color: var(--text-muted); font-style: italic; margin: 10px 0;">La IA está escribiendo...</div>`;
    container.scrollTop = container.scrollHeight;

    try {
        // Llamada a la API de Gemini (usando el modelo gemini-2.5-flash o similar configurado en tu entorno)
        const systemPrompt = `Eres un compañero bilingüe de práctica de alemán (${temaActual.nivel}). 
        Debes hablar con el usuario mezclando alemán y español de forma natural (aprox 50% y 50%).
        El tema actual es: "${temaActual.titulo}".
        Las palabras clave obligatorias que el usuario debe intentar usar son: [${temaActual.palabras}].
        Si el usuario usa una palabra clave, elógialo sutilmente. Si comete un error gramatical grave en alemán, corrígelo brevemente entre paréntesis de forma amable.
        Mantén la conversación fluida y hazle siempre una pregunta de seguimiento para que continúe practicando.`;

        // Nota: Asegúrate de rutear esto o usar tu pasarela de Apps Script / API Key de forma segura
        const respuestaIA = await simularRespuestaGemini(systemPrompt, historialConversacion);
        
        document.getElementById(typingId).remove();
        agregarMensajeChat('ia', respuestaIA);
        historialConversacion.push({ role: "model", parts: [{ text: respuestaIA }] });
        
    } catch (err) {
        console.error(err);
        document.getElementById(typingId).remove();
        agregarMensajeChat('ia', "Ups, ocurrió un error de conexión con la IA.");
    }
}

function agregarMensajeChat(remitente, texto) {
    const container = document.getElementById('chat-messages-container');
    const div = document.createElement('div');
    div.style.margin = "10px 0";
    div.style.padding = "12px 16px";
    div.style.borderRadius = "12px";
    div.style.maxWidth = "80%";
    div.style.lineHeight = "1.5";
    
    if (remitente === 'user') {
        div.style.background = "#e2e8f0";
        div.style.color = "#1e293b";
        div.style.marginLeft = "auto";
        div.style.textAlign = "right";
    } else {
        div.style.background = "var(--card-bg)";
        div.style.border = "1px solid var(--border)";
        div.style.color = "var(--text-main)";
        div.style.marginRight = "auto";
    }
    div.innerText = texto;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// Función puente simulada / configurable para llamar a Gemini
// Reemplaza la función simularRespuestaGemini en tu chat.js por esta llamada a tu Apps Script:
async function simularRespuestaGemini(systemPrompt, history) {
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzmqiPpTLrvH3_t5IADh7TMI73WzgJH2PQC1mgGTpLs7-TTFBosGIDmc0yVMVoV03qE/exec"; 

    const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        // Nota: no enviamos headers de autorización complejos para evitar problemas de CORS en POST libre,
        // o usamos text/plain si Apps Script lo requiere, pero este formato json funciona perfecto con Web Apps desplegadas.
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
            systemPrompt: systemPrompt,
            history: history
        })
    });

    const data = await response.json();
    
    if (data.success) {
        return data.response;
    } else {
        throw new Error(data.error || "Error en el servidor de Apps Script");
    }
}
