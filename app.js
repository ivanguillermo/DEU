const CLIENT_ID = '205229444634-rrrplb3vigmcr9gs2elcnc8hbiv8fd14.apps.googleusercontent.com';
const SPREADSHEET_ID = '1ZwTNP9h2WY9d4PgsovO2Vet5ZQyBshk2hpoSrA5CqBQ';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient;
let accessToken = localStorage.getItem('deu_access_token');
let globalVocabData = [];
let filteredVocabData = [];
let currentVocabIndex = 0;
const DUO_ROW_HOY = 5;

function switchTab(tabId, element) {
    document.querySelectorAll('.section-container').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    element.classList.add('active');
}

window.onload = function () {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (resp) => {
            if (resp.error !== undefined) { console.error(resp); return; }
            accessToken = resp.access_token;
            // Guardamos el token en localStorage para que persista y Google no vuelva a pedir autorización
            localStorage.setItem('deu_access_token', accessToken);
            updateAuthUI(true);
            fetchAllSheetsData();
        }
    });

    if (accessToken) {
        updateAuthUI(true);
        fetchAllSheetsData();
    } else {
        // Intento de inicio de sesión automático silencioso si ya dio permisos antes
        // Esto evita que salga el aviso molesto cada vez
    }
    
    renderizarDuolingoDiario(0);
};

function updateAuthUI(isConnected) {
    const btn = document.getElementById('auth-button');
    const status = document.getElementById('user-status');
    if (isConnected) {
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Conectado';
        btn.style.background = '#137333';
        status.innerText = 'Sincronizado con Google';
    } else {
        btn.innerHTML = '<i class="fa-brands fa-google"></i> Conectar Google';
        btn.style.background = 'var(--text-main)';
        status.innerText = 'Desconectado';
    }
}

function handleAuthClick() {
    if (!accessToken) {
        // Usamos 'select_account' solo la primera vez o si cerró sesión explícitamente
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        accessToken = null;
        localStorage.removeItem('deu_access_token');
        updateAuthUI(false);
    }
}

async function fetchAllSheetsData() {
    if (!accessToken) return;

    // Podcast
    loadSheetRange('Podcast!A:D', 'table-podcast', 'loading-podcast', 'table-podcast-container', (row, index) => {
        const isVisto = row[3] === 'Visto';
        const badgeClass = isVisto ? 'yes' : 'no';
        const videoId = extractYouTubeID(row[2]);
        const btnHtml = videoId ? `<button class="table-link" onclick="openPlayerModal('${videoId}', '${encodeURIComponent(row[1] || 'Podcast')} ')">Escuchar</button>` : `<a class="table-link" href="${row[2]}" target="_blank">Enlace</a>`;
        const toggleBtn = `<button class="table-link" style="color:var(--text-main);" onclick="togglePodcastStatus(${index + 2}, '${row[3]}')">Cambiar</button>`;
        return `<td>${row[0] || ''}</td><td>${row[1] || ''}</td><td>${btnHtml}</td><td><span class="badge ${badgeClass}">${row[3] || 'NO'}</span></td><td>${toggleBtn}</td>`;
    });

    // Kinos
    loadSheetRangeCustom('Kinos!A:C', (rows) => {
        document.getElementById('loading-kinos').style.display = 'none';
        document.getElementById('table-kinos-container').style.display = 'table';
        const tbody = document.getElementById('table-kinos');
        const tbodyVistas = document.getElementById('table-kinos-vistas');
        tbody.innerHTML = ''; tbodyVistas.innerHTML = '';
        
        let countVistas = 0;
        if(rows && rows.length > 1) {
            for(let i=1; i<rows.length; i++) {
                const r = rows[i];
                const rowNum = i + 1;
                const estado = r[2] || 'Pendiente';
                if(estado === 'Vista') {
                    countVistas++;
                    tbodyVistas.innerHTML += `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`;
                } else {
                    tbody.innerHTML += `<tr><td>${r[0]}</td><td>${r[1]}</td><td><button class="table-link" onclick="marcarKinoVista(${rowNum})">✔ Vista</button></td></tr>`;
                }
            }
        }
        if(countVistas === 0) tbodyVistas.innerHTML = `<tr><td colspan="2" style="color:var(--text-muted); text-align:center;">Ninguna película vista aún</td></tr>`;
    });

    // Bucher
    loadSheetRangeCustom('Bucher!A:C', (rows) => {
        document.getElementById('loading-bucher').style.display = 'none';
        document.getElementById('table-bucher-container').style.display = 'table';
        const tbody = document.getElementById('table-bucher');
        tbody.innerHTML = '';
        let totalHoy = 0;
        if(rows && rows.length > 1) {
            for(let i=1; i<rows.length; i++) {
                const r = rows[i];
                const hojas = parseInt(r[1]) || 0;
                totalHoy += hojas;
                tbody.innerHTML += `<tr><td>${r[0]}</td><td><b>${hojas} hojas</b></td><td><span class="badge yes">${r[2] || 'Leído'}</span></td></tr>`;
            }
        }
        const porcentaje = Math.min((totalHoy / 5) * 100, 100);
        document.getElementById('bucher-progress-title').innerText = `Progreso acumulado / hoy: ${totalHoy} / 5 hojas`;
        document.getElementById('bucher-bar').style.width = `${porcentaje}%`;
    });

    // Duolingo Totales
    loadSheetRangeCustom('Duolingo!C2:D2', (rows) => {
        if(rows && rows.length > 0) {
            document.getElementById('duo-val-c2').innerText = rows[0][0] || '0';
            document.getElementById('duo-val-d2').innerText = rows[0][1] || '0.0';
            document.getElementById('duo-status-sheet').innerText = 'Sincronizado';
        }
    });

    // Vocabulario
    loadSheetRangeCustom('Vocabulario!A:G', (rows) => {
        document.getElementById('loading-vocab').style.display = 'none';
        document.getElementById('vocab-card-ui').style.display = 'block';
        globalVocabData = [];
        if(rows && rows.length > 1) {
            for(let i=1; i<rows.length; i++) {
                const r = rows[i];
                if(r[2] && r[3]) {
                    globalVocabData.push({
                        nivel: (r[0] || 'A2').trim().toUpperCase(),
                        cat: r[1] || 'General',
                        palabra: r[2],
                        correcta: r[3],
                        opciones: [r[3], r[4], r[5], r[6]].filter(Boolean)
                    });
                }
            }
            cambiarFiltroNivel();
        }
    });
}

async function loadSheetRange(range, tableId, loadingId, containerId, rowParser) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`;
    try {
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
        if(response.status === 401) { handleAuthExpired(); return; }
        const data = await response.json();
        document.getElementById(loadingId).style.display = 'none';
        document.getElementById(containerId).style.display = 'table';
        const tbody = document.getElementById(tableId);
        tbody.innerHTML = '';
        if (data.values && data.values.length > 1) {
            for (let i = 1; i < data.values.length; i++) {
                const tr = document.createElement('tr');
                tr.innerHTML = rowParser(data.values[i], i);
                tbody.appendChild(tr);
            }
        }
    } catch (err) { console.error(err); }
}

async function loadSheetRangeCustom(range, callback) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`;
    try {
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
        if(response.status === 401) { handleAuthExpired(); return; }
        const data = await response.json();
        callback(data.values);
    } catch (err) { console.error(err); }
}

async function appendToSheet(rangeTab, valuesArray, callback) {
    if (!accessToken) { alert("Conéctate a Google primero."); return; }
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${rangeTab}:append?valueInputOption=USER_ENTERED`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ values: [valuesArray] })
        });
        if(response.ok) { if(callback) callback(); fetchAllSheetsData(); }
    } catch (err) { console.error(err); }
}

async function updateCell(rangeCell, newValue) {
    if (!accessToken) return;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${rangeCell}?valueInputOption=USER_ENTERED`;
    try {
        await fetch(url, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ values: [[newValue]] })
        });
        fetchAllSheetsData();
    } catch (err) { console.error(err); }
}

function handleAuthExpired() {
    localStorage.removeItem('deu_access_token');
    accessToken = null;
    updateAuthUI(false);
}

function togglePodcastStatus(rowNumber, currentStatus) {
    updateCell(`Podcast!D${rowNumber}`, currentStatus === 'Visto' ? 'NO' : 'Visto');
}

function marcarKinoVista(rowNumber) {
    updateCell(`Kinos!C${rowNumber}`, 'Vista');
}

function addPodcast() {
    const n = document.getElementById('pod-nivel').value;
    const t = document.getElementById('pod-titulo').value;
    const l = document.getElementById('pod-link').value;
    const e = document.getElementById('pod-estado').value;
    if(!t) return;
    appendToSheet('Podcast!A:D', [n, t, l, e], () => {
        document.getElementById('pod-nivel').value = '';
        document.getElementById('pod-titulo').value = '';
        document.getElementById('pod-link').value = '';
    });
}

function addKino() {
    const t = document.getElementById('kino-titulo').value;
    const d = document.getElementById('kino-donde').value;
    if(!t) return;
    appendToSheet('Kinos!A:C', [t, d, 'Pendiente'], () => {
        document.getElementById('kino-titulo').value = '';
        document.getElementById('kino-donde').value = '';
    });
}

function addBucher() {
    const t = document.getElementById('bucher-titulo').value;
    const h = document.getElementById('bucher-hojas').value || '5';
    if(!t) return;
    appendToSheet('Bucher!A:C', [t, h, new Date().toLocaleDateString()], () => {
        document.getElementById('bucher-titulo').value = '';
    });
}

function renderizarDuolingoDiario(leccionesMarcadas) {
    const container = document.getElementById('duo-daily-checkboxes');
    container.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
        const item = document.createElement('div');
        item.className = 'duo-box-item';
        item.innerHTML = `
            <span style="font-size: 0.75rem; font-weight: bold; color: var(--text-muted); margin-bottom: 4px;">#${i}</span>
            <input type="checkbox" ${i <= leccionesMarcadas ? 'checked' : ''} onchange="actualizarDuolingoHoy(${i}, this.checked)">
        `;
        container.appendChild(item);
    }
}

async function actualizarDuolingoHoy(numeroLeccion, isChecked) {
    const nuevaCantidad = isChecked ? numeroLeccion : numeroLeccion - 1;
    renderizarDuolingoDiario(nuevaCantidad);
    if (accessToken) {
        document.getElementById('duo-status-sheet').innerText = 'Guardando...';
        await updateCell(`Duolingo!B${DUO_ROW_HOY}`, nuevaCantidad);
    }
}

function extractYouTubeID(url) {
    if(!url) return null;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    return (match && match[2].length === 11) ? match[2] : null;
}

function openPlayerModal(videoId, title) {
    document.getElementById('modal-title').innerText = decodeURIComponent(title);
    document.getElementById('youtube-player-slot').innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    document.getElementById('modal-player').style.display = 'flex';
}

function closePlayerModal() {
    document.getElementById('modal-player').style.display = 'none';
    document.getElementById('youtube-player-slot').innerHTML = '';
}

function cambiarFiltroNivel() {
    const nivel = document.getElementById('filtro-nivel').value;
    filteredVocabData = (nivel === 'TODOS') ? [...globalVocabData] : globalVocabData.filter(i => i.nivel === nivel);
    currentVocabIndex = 0;
    loadNextVocab();
}

function loadNextVocab() {
    if(!filteredVocabData.length) {
        document.getElementById('vocab-word').innerText = "Sin palabras";
        document.getElementById('vocab-nivel-cat').innerText = "---";
        document.getElementById('vocab-options-container').innerHTML = '';
        return;
    }
    const item = filteredVocabData[currentVocabIndex];
    document.getElementById('vocab-nivel-cat').innerText = `${item.nivel} • ${item.cat}`;
    document.getElementById('vocab-word').innerText = item.palabra;
    const container = document.getElementById('vocab-options-container');
    container.innerHTML = '';
    
    [...item.opciones].sort(() => Math.random() - 0.5).forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => {
            if(opt === item.correcta) {
                btn.style.background = '#e6f4ea'; btn.style.borderColor = '#137333'; btn.style.color = '#137333';
                setTimeout(loadNextVocab, 700);
            } else {
                btn.style.background = '#fce8e6'; btn.style.borderColor = '#c5221f'; btn.style.color = '#c5221f';
            }
        };
        container.appendChild(btn);
    });
    currentVocabIndex = (currentVocabIndex + 1) % filteredVocabData.length;
}

function leerTexto(texto) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(texto);
        utt.lang = 'de-DE';
        utt.rate = 0.9;
        window.speechSynthesis.speak(utt);
    }
}
