// leitner.js - Módulo independiente del Sistema Leitner
let queueLeitner = [];
let currentLeitnerIndex = 0;
let currentCardData = null;

// Esta función se puede llamar desde tu app.js principal cuando se conecte Google
async function initLeitnerModule() {
    if (!accessToken) return;
    document.getElementById('loading-leitner').style.display = 'block';
    
    // Suponiendo que tu pestaña en Sheets se llama 'Leitner_Flashcards' y va de A a G
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Leitner!A:G`;
    try {
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
        const data = await response.json();
        
        document.getElementById('loading-leitner').style.display = 'none';
        document.getElementById('leitner-card-ui').style.display = 'block';
        
        queueLeitner = [];
        const today = new Date().toISOString().split('T')[0]; // Fecha formato YYYY-MM-DD

        if (data.values && data.values.length > 1) {
            for (let i = 1; i < data.values.length; i++) {
                const r = data.values[i];
                // r[0]=ID, r[1]=Anverso, r[2]=Reverso, r[3]=Nivel_Caja, r[4]=Ultimo_Repaso, r[5]=Proximo_Repaso, r[6]=RowIndex(o historial)
                const proximoRepaso = r[5] || '2026-01-01';
                
                // Filtramos las que les toca repasar hoy o están vencidas
                if (proximoRepaso <= today) {
                    queueLeitner.push({
                        rowIndex: i + 1, // Número de fila real en el Sheet
                        id: r[0],
                        anverso: r[1],
                        reverso: r[2],
                        caja: parseInt(r[3]) || 1,
                        ultimo: r[4]
                    });
                }
            }
        }
        currentLeitnerIndex = 0;
        mostrarFichaLeitnerActual();
    } catch (err) {
        console.error("Error cargando Leitner:", err);
    }
}

function mostrarFichaLeitnerActual() {
    if (queueLeitner.length === 0 || currentLeitnerIndex >= queueLeitner.length) {
        document.getElementById('leitner-question').innerText = "¡Excelente! Has terminado tus repasos de hoy 🎉";
        document.getElementById('leitner-answer-container').style.display = 'none';
        document.getElementById('leitner-actions').style.display = 'none';
        document.getElementById('leitner-box-badge').innerText = 'Completado';
        document.getElementById('leitner-counter').innerText = '';
        return;
    }

    currentCardData = queueLeitner[currentLeitnerIndex];
    document.getElementById('leitner-box-badge').innerText = `Caja ${currentCardData.caja}`;
    document.getElementById('leitner-counter').innerText = `Ficha ${currentLeitnerIndex + 1} de ${queueLeitner.length}`;
    document.getElementById('leitner-question').innerText = currentCardData.anverso;
    
    // Ocultar respuesta y botones de acción hasta que voltee la ficha
    document.getElementById('leitner-answer').innerText = currentCardData.reverso;
    document.getElementById('leitner-answer-container').style.display = 'none';
    document.getElementById('leitner-actions').style.display = 'none';
}

function voltearFichaLeitner() {
    document.getElementById('leitner-answer-container').style.display = 'block';
    document.getElementById('leitner-actions').style.display = 'grid';
}

async function responderLeitner(acierto) {
    if (!currentCardData) return;
    
    let nuevaCaja = currentCardData.caja;
    if (acierto) {
        nuevaCaja = Math.min(nuevaCaja + 1, 5); // Sube de caja, tope 5
    } else {
        nuevaCaja = 1; // Si falla, baja directo a Caja 1
    }

    // Calcular próximo repaso basado en la caja
    // Caja 1: 1 día, Caja 2: 3 días, Caja 3: 7 días, Caja 4: 15 días, Caja 5: 30 días
    const diasIntervalo = [0, 1, 3, 7, 15, 30][nuevaCaja];
    const hoy = new Date();
    const proximaFecha = new Date(hoy.setDate(hoy.getDate() + diasIntervalo)).toISOString().split('T')[0];
    const fechaHoyStr = new Date().toISOString().split('T')[0];

    // Actualizar celdas en Google Sheets (Columna D = Nivel_Caja, E = Ultimo_Repaso, F = Proximo_Repaso)
    const fila = currentCardData.rowIndex;
    await actualizarCeldaSheet(`Leitner_Flashcards!D${fila}`, nuevaCaja);
    await actualizarCeldaSheet(`Leitner_Flashcards!E${fila}`, fechaHoyStr);
    await actualizarCeldaSheet(`Leitner_Flashcards!F${fila}`, proximaFecha);

    // Pasar a la siguiente ficha
    currentLeitnerIndex++;
    mostrarFichaLeitnerActual();
}

// Función auxiliar independiente para actualizar celdas en Sheets
async function actualizarCeldaSheet(rangeCell, valor) {
    if (!accessToken) return;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${rangeCell}?valueInputOption=USER_ENTERED`;
    try {
        await fetch(url, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ values: [[valor]] })
        });
    } catch (err) {
        console.error("Error al actualizar celda:", err);
    }
}
