// kims.js - Módulo independiente de Kim's Game
let kimsSetsData = [];
let currentKimSet = null;
let missingWords = [];
let timerInterval = null;

async function initKimsModule() {
    if (!accessToken) return;
    const loadingEl = document.getElementById('loading-kims');
    const uiEl = document.getElementById('kims-card-ui');
    
    if (loadingEl) loadingEl.style.display = 'block';
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Kim!A:E`;
    try {
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
        const data = await response.json();
        
        if (loadingEl) loadingEl.style.display = 'none';
        if (uiEl) uiEl.style.display = 'block';
        
        kimsSetsData = [];
        if (data.values && data.values.length > 1) {
            for (let i = 1; i < data.values.length; i++) {
                const r = data.values[i];
                if (r[2]) {
                    kimsSetsData.push({
                        id: r[0],
                        categoria: r[1],
                        elementos: r[2].split(',').map(item => item.trim()),
                        dificultad: parseInt(r[4]) || 1
                    });
                }
            }
        }
        cargarNuevoSetKim();
    } catch (err) {
        console.error("Error cargando Kim's Game:", err);
    }
}

function cargarNuevoSetKim() {
    if (kimsSetsData.length === 0) {
        document.getElementById('kims-cloud-container').innerHTML = "<p>No hay sets de Kim's Game disponibles.</p>";
        return;
    }
    
    // Elegir un set aleatorio
    currentKimSet = kimsSetsData[Math.floor(Math.random() * kimsSetsData.length)];
    document.getElementById('kims-category-title').innerText = currentKimSet.categoria;
    
    // Mostrar fase de memorización
    iniciarFaseMemorizacion();
}

function iniciarFaseMemorizacion() {
    document.getElementById('kims-input-section').style.display = 'none';
    document.getElementById('kims-timer-display').style.display = 'block';
    
    const container = document.getElementById('kims-cloud-container');
    container.innerHTML = '';
    
    // Renderizar nube de palabras completa
    currentKimSet.elementos.forEach(palabra => {
        const span = document.createElement('span');
        span.className = 'kims-word-chip';
        span.innerText = palabra;
        container.appendChild(span);
    });

    let tiempoRestante = 10; // 10 segundos para memorizar
    const timerText = document.getElementById('kims-timer-count');
    timerText.innerText = tiempoRestante;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        tiempoRestante--;
        timerText.innerText = tiempoRestante;
        if (tiempoRestante <= 0) {
            clearInterval(timerInterval);
            iniciarFaseAdivinanza();
        }
    }, 1000);
}

function iniciarFaseAdivinanza() {
    document.getElementById('kims-timer-display').style.display = 'none';
    document.getElementById('kims-input-section').style.display = 'block';
    
    const container = document.getElementById('kims-cloud-container');
    container.innerHTML = '';
    
    // Seleccionar aleatoriamente qué palabras desaparecen según la dificultad
    const numOcultas = currentKimSet.dificultad;
    const copiaElementos = [...currentKimSet.elementos];
    missingWords = [];
    
    for (let i = 0; i < numOcultas; i++) {
        const randomIndex = Math.floor(Math.random() * copiaElementos.length);
        missingWords.push(copiaElementos[randomIndex]);
        copiaElementos.splice(randomIndex, 1, '_____ (¿Cuál falta?)');
    }
    
    // Renderizar la nube con los espacios vacíos
    copiaElementos.forEach(item => {
        const span = document.createElement('span');
        span.className = item.includes('_____') ? 'kims-word-chip missing' : 'kims-word-chip';
        span.innerText = item;
        container.appendChild(span);
    });

    document.getElementById('kims-user-answer').value = '';
    document.getElementById('kims-feedback').innerText = '';
}

function verificarRespuestaKim() {
    const inputVal = document.getElementById('kims-user-answer').value.toLowerCase();
    const feedback = document.getElementById('kims-feedback');
    
    // Verificar si el usuario escribió las palabras faltantes
    let aciertos = 0;
    missingWords.forEach(palabra => {
        if (inputVal.includes(palabra.toLowerCase())) {
            aciertos++;
        }
    });

    if (aciertos === missingWords.length) {
        feedback.style.color = '#137333';
        feedback.innerHTML = `🎉 ¡Correcto! Encontraste las ${aciertos} palabras ocultas: <b>${missingWords.join(', ')}</b>`;
    } else {
        feedback.style.color = '#c5221f';
        feedback.innerHTML = `❌ Casi. Las palabras correctas eran: <b>${missingWords.join(', ')}</b>`;
    }
}
