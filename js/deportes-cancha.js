/**
 * js/deportes-cancha.js — Planteles, Pizarra Multi-Deporte, Cambios, Multimedia,
 * Informe Partido a Partido (PDF A4 + WA), Tablero Anual de Temporada, Microciclo y Ranking (1 a 10)
 * Aplica automáticamente a Fútbol, Hockey y todos los Deportes Extra.
 * CDM Pro Suite — Desarrollado por Gonzalo Adanchú
 */

// =========================================================================
// 1. ESTILOS DE PIZARRA, TABLERO ANUAL, INFORME A4 Y MULTIMEDIA
// =========================================================================

(function inyectarCSSDeportesCancha() {
    document.getElementById("cdmCssDeportesCancha")?.remove();
    const st = document.createElement("style");
    st.id = "cdmCssDeportesCancha";
    st.textContent = `
        .live-scoreboard {
            background: linear-gradient(135deg, var(--cdm-900, #06283d) 0%, #093552 100%);
            color: #ffffff;
            border-radius: 16px;
            padding: 0.9rem 1.2rem;
            margin-bottom: 0.85rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.9rem;
            flex-wrap: wrap;
            box-shadow: var(--shadow-card);
            border: 1px solid rgba(56, 189, 248, 0.28);
        }
        .score-team-box { display: flex; align-items: center; gap: 0.55rem; }
        .score-number {
            font-size: 1.7rem;
            font-weight: 900;
            background: rgba(255, 255, 255, 0.12);
            padding: 0.16rem 0.75rem;
            border-radius: 12px;
            color: #38bdf8;
            min-width: 48px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .match-meta-strip {
            display: grid;
            grid-template-columns: 165px 155px 1fr;
            gap: 0.65rem;
            background: var(--surface-subtle, #f8fafc);
            border: 1px solid var(--line, #e2e8f0);
            border-radius: 14px;
            padding: 0.7rem 0.85rem;
            margin-bottom: 0.9rem;
        }
        .bench-strip {
            margin-top: 0.95rem;
            background: var(--surface-subtle, #f8fafc);
            border: 1.5px dashed var(--line-celeste, #bae6fd);
            border-radius: 14px;
            padding: 0.85rem 1rem;
        }
        .micro-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(235px, 1fr));
            gap: 0.9rem;
        }
        .micro-day-card {
            background: var(--surface-solid, #ffffff);
            border: 1.5px solid var(--line, #e2e8f0);
            border-top: 4px solid var(--cdm-500, #0284c7);
            border-radius: 14px;
            padding: 0.95rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            box-shadow: var(--shadow-sm);
        }

        /* Layout amplio: Cancha izquierda + Minuto a Minuto ancho derecha */
        #dep-sec-partido .split-view {
            display: grid !important;
            grid-template-columns: minmax(0, 1.12fr) minmax(360px, 1fr) !important;
            gap: 1.1rem !important;
            align-items: start !important;
        }
        #listaEventosPartidoEnVivo {
            max-height: 560px !important;
        }

        /* Modal Cancha: acciones categorizadas y cambio */
        .cancha-quick-actions {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 0.4rem;
            margin-bottom: 0.65rem;
        }
        .cancha-quick-btn {
            border: 1.5px solid var(--line-strong, #cbd5e1);
            background: var(--surface-subtle, #f8fafc);
            color: var(--ink-900, #0f172a);
            border-radius: 10px;
            padding: 0.44rem 0.55rem;
            font-size: 0.74rem;
            font-weight: 700;
            cursor: pointer;
            text-align: left;
            transition: all 0.14s ease;
        }
        .cancha-quick-btn:hover { border-color: #0284c7; background: var(--cdm-50, #f0f9ff); transform: translateY(-1px); }
        .cancha-quick-btn.is-pos { border-left: 3.5px solid #10b981; }
        .cancha-quick-btn.is-neg { border-left: 3.5px solid #ef4444; }
        .cancha-quick-btn.is-neu { border-left: 3.5px solid #0284c7; }

        .cm36-media-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 0.65rem;
        }
        .cm36-media-card {
            background: var(--surface-subtle, #f8fafc);
            border: 1px solid var(--line-strong, #cbd5e1);
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        .cm36-media-card img { width: 100%; height: 110px; object-fit: cover; display: block; cursor: pointer; }

        /* Tablero Anual de Temporada */
        .season-kpi-grid {
            display: grid;
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 0.65rem;
            margin-bottom: 1rem;
        }
        .season-kpi {
            background: var(--surface-subtle, #f8fafc);
            border: 1.5px solid var(--line, #e2e8f0);
            border-top: 4px solid #0284c7;
            border-radius: 14px;
            padding: 0.68rem 0.78rem;
            text-align: center;
        }
        .season-kpi small { display: block; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: var(--ink-500, #64748b); }
        .season-kpi strong { display: block; font-size: 1.25rem; font-weight: 900; color: var(--ink-900, #0f172a); margin-top: 2px; }

        .season-leaders-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 0.7rem;
            margin-bottom: 1rem;
        }
        .season-leader-box {
            background: var(--surface-subtle, #f8fafc);
            border: 1px solid var(--line, #e2e8f0);
            border-radius: 14px;
            padding: 0.75rem 0.85rem;
            font-size: 0.77rem;
        }
        .season-leader-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.28rem 0;
            border-bottom: 1px dashed var(--line, #e2e8f0);
        }
        .season-leader-row:last-child { border-bottom: none; }

        .season-subtabs {
            display: inline-flex;
            gap: 0.3rem;
            background: var(--surface-subtle, #f1f5f9);
            border: 1px solid var(--line, #e2e8f0);
            border-radius: 11px;
            padding: 3px;
            margin-bottom: 0.85rem;
        }
        .season-subtab-btn {
            border: none;
            background: transparent;
            color: var(--ink-600, #475569);
            font-size: 0.77rem;
            font-weight: 800;
            padding: 0.4rem 0.85rem;
            border-radius: 8px;
            cursor: pointer;
        }
        .season-subtab-btn.active {
            background: #0284c7;
            color: #ffffff;
        }

        /* Lista de jugadas y anotaciones del profe en el Historial */
        .match-hist-events {
            display: flex;
            flex-direction: column;
            gap: 0.32rem;
            margin: 0.55rem 0;
            padding: 0.55rem 0.7rem;
            background: var(--surface-solid, #ffffff);
            border: 1px solid var(--line, #e2e8f0);
            border-radius: 11px;
            font-size: 0.77rem;
        }
        .match-hist-ev-row {
            display: flex;
            align-items: baseline;
            gap: 0.45rem;
            flex-wrap: wrap;
            padding: 0.2rem 0;
            border-bottom: 1px dashed var(--line, #e2e8f0);
        }
        .match-hist-ev-row:last-child { border-bottom: none; }
        .match-hist-note {
            color: var(--ink-600, #475569);
            font-style: italic;
        }

        /* Impresión PDF A4 para Informe de Partido / Temporada */
        #cdmPrintZoneMatchA4 { display: none; }
        @media print {
            @page { size: A4; margin: 12mm; }
            body.cdm-match-printing > *:not(#cdmPrintZoneMatchA4) { display: none !important; }
            body.cdm-match-printing #cdmPrintZoneMatchA4 {
                display: block !important; width: 100% !important;
                background: #ffffff !important; color: #0f172a !important;
                font-family: 'Poppins', Arial, sans-serif;
            }
            body.cdm-match-printing #cdmPrintZoneMatchA4 table { width: 100%; border-collapse: collapse; font-size: 0.77rem; }
            body.cdm-match-printing #cdmPrintZoneMatchA4 th,
            body.cdm-match-printing #cdmPrintZoneMatchA4 td { border: 1px solid #cbd5e1; padding: 5px 7px; text-align: left; }
            body.cdm-match-printing #cdmPrintZoneMatchA4 th { background: #f1f5f9; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }

        @media (max-width: 1100px) {
            .season-leaders-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 1024px) {
            #dep-sec-partido .split-view { grid-template-columns: 1fr !important; }
            .season-kpi-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .match-meta-strip { grid-template-columns: 1fr; }
        }
        @media (max-width: 820px) {
            .live-scoreboard { justify-content: center; text-align: center; }
        }
        @media (max-width: 600px) {
            .season-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .season-leaders-grid { grid-template-columns: 1fr; }
        }
    `;
    document.head.appendChild(st);
})();

let _seqEventoPartido = 1;
function nuevoIdEventoEntero() {
    return Date.now() * 100 + ((_seqEventoPartido++) % 99);
}

function escMatchH(s) {
    return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function esEventoDeGolOAnotacion(tipo) {
    return /gol(?!\s+del\s+rival)|try|triple|doble|libre convertido|punto remate|bloqueo punto|saque ace|winner|round ganado|1° puesto|figura perfecta/i.test(String(tipo || ""));
}

function imprimirInformePartidoA4(htmlInterno) {
    let z = document.getElementById("cdmPrintZoneMatchA4");
    if (!z) {
        z = document.createElement("div");
        z.id = "cdmPrintZoneMatchA4";
        document.body.appendChild(z);
    }
    z.innerHTML = `<div style="padding:0.5rem;">${htmlInterno}</div>`;
    document.body.classList.add("cdm-match-printing");
    const fin = () => {
        document.body.classList.remove("cdm-match-printing");
        z.innerHTML = "";
        window.removeEventListener("afterprint", fin);
    };
    window.addEventListener("afterprint", fin);
    setTimeout(() => window.print(), 90);
    setTimeout(fin, 3000);
}

// =========================================================================
// 2. AUDITORÍA DE SCORE + STORAGE MULTIMEDIA POST-PARTIDO (INDEXEDDB)
// =========================================================================

function registrarEventoScoreCDM(p, anterior, nuevo, origen, motivo) {
    if (!p || p.deporte === "Gimnasio") return;
    if (!Array.isArray(p.historialScore)) p.historialScore = [];
    const diff = Math.round((Number(nuevo || 0) - Number(anterior || 0)) * 10) / 10;
    p.historialScore.unshift({
        id: nuevoIdEventoEntero(),
        fecha: obtenerHoyISO(),
        anterior: Number(anterior || 0),
        nuevo: Number(nuevo || 0),
        delta: diff,
        origen: origen || "Evaluación Admin",
        motivo: motivo || p.motivoPuntos || "Ajuste del profesor"
    });
    if (p.historialScore.length > 40) p.historialScore = p.historialScore.slice(0, 40);
}
window.registrarEventoScore32 = registrarEventoScoreCDM;

const IDB_MEDIA_PARTIDOS_NAME = "cdm_partidos_media_idb_v36";
const IDB_MEDIA_PARTIDOS_STORE = "fotos";

function obtenerMediaPartidosCDM() {
    const key = `cdm_partido_media_v36_${obtenerClaveClubActivoCDM()}`;
    try { return JSON.parse(localStorage.getItem(key) || "[]") || []; }
    catch { return []; }
}

function guardarMediaPartidosCDM(lista) {
    localStorage.setItem(`cdm_partido_media_v36_${obtenerClaveClubActivoCDM()}`, JSON.stringify(lista));
}

function abrirIDBMediaPartidos() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) return reject("Sin IndexedDB");
        const req = indexedDB.open(IDB_MEDIA_PARTIDOS_NAME, 1);
        req.onupgradeneeded = e => {
            if (!e.target.result.objectStoreNames.contains(IDB_MEDIA_PARTIDOS_STORE)) {
                e.target.result.createObjectStore(IDB_MEDIA_PARTIDOS_STORE, { keyPath: "key" });
            }
        };
        req.onsuccess = e => resolve(e.target.result);
        req.onerror = e => reject(e.target.error);
    });
}

async function guardarFotoIDBPartidoCDM(key, dataUrl) {
    const db = await abrirIDBMediaPartidos();
    return new Promise((res, rej) => {
        const tx = db.transaction(IDB_MEDIA_PARTIDOS_STORE, "readwrite");
        tx.objectStore(IDB_MEDIA_PARTIDOS_STORE).put({ key, dataUrl });
        tx.oncomplete = () => res(true);
        tx.onerror = e => rej(e.target.error);
    });
}

async function leerFotoIDBPartidoCDM(key) {
    try {
        const db = await abrirIDBMediaPartidos();
        return await new Promise(res => {
            const req = db.transaction(IDB_MEDIA_PARTIDOS_STORE, "readonly").objectStore(IDB_MEDIA_PARTIDOS_STORE).get(key);
            req.onsuccess = () => res(req.result?.dataUrl || null);
            req.onerror = () => res(null);
        });
    } catch { return null; }
}

async function borrarFotoIDBPartidoCDM(key) {
    if (!key) return;
    try {
        const db = await abrirIDBMediaPartidos();
        await new Promise(res => {
            const tx = db.transaction(IDB_MEDIA_PARTIDOS_STORE, "readwrite");
            tx.objectStore(IDB_MEDIA_PARTIDOS_STORE).delete(key);
            tx.oncomplete = () => res(true);
            tx.onerror = () => res(false);
        });
    } catch {}
}

function comprimirFotoPartidoCDM(file, maxW = 960) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = ev => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, maxW / img.width);
                const c = document.createElement("canvas");
                c.width = Math.round(img.width * scale);
                c.height = Math.round(img.height * scale);
                c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
                resolve(c.toDataURL("image/jpeg", 0.78));
            };
            img.onerror = () => resolve(null);
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// =========================================================================
// 3. INICIALIZACIÓN DEL MÓDULO DEPORTE (PLAN SEMANAL + MULTIMEDIA EN VIVO)
// =========================================================================

function inicializarModuloDeporte() {
    if (!deportePagina || deportePagina === "Gimnasio") return;

    const main = document.querySelector(".app-content");
    const tabsBar = document.querySelector(".module-tabs");
    if (!main || !tabsBar) return;

    const selPilar = document.getElementById("selectPilarRanking");
    if (selPilar) {
        const ic = deportePagina === "Hockey" ? "🏑" : "⚽";
        selPilar.innerHTML = `
            <option value="general">👑 Score General Directo (1 a 10)</option>
            <option value="tecnico">${ic} Pilar Técnico / Táctico (25%)</option>
            <option value="fisico">🏃 Pilar Condición Física (30%)</option>
            <option value="gym">🏋️ Pilar Fuerza en Gimnasio (25%)</option>
            <option value="actitud">🔥 Pilar Compromiso y Actitud (20%)</option>
            <option value="bonus">⭐ Bonus / Ajuste (+/-)</option>
        `;
    }
    const selModo = document.getElementById("selectModoRanking");
    if (selModo) {
        selModo.innerHTML = `
            <option value="fijar" selected>📌 Fijar Nota Exacta (1 a 10)</option>
            <option value="sumar">➕/➖ Sumar o Restar (Ej: +0.5)</option>
        `;
    }
    const inpDelta = document.getElementById("inputPuntosDelta");
    if (inpDelta) {
        inpDelta.step = "0.1";
        inpDelta.placeholder = "Ej: 8.5 (Fijar) o 0.5 (Sumar)";
    }

    // Inyectar 5ª pestaña: Plan Semanal y Lista de Buena Fe
    if (!document.getElementById("dep-sec-microciclo")) {
        tabsBar.classList.add("tabs-5");
        const btnMicro = document.createElement("button");
        btnMicro.className = "mod-tab";
        btnMicro.innerHTML = `<i class="ri-calendar-todo-line"></i><span>Plan Semanal</span>`;
        btnMicro.onclick = function () { cambiarSeccionDeporte("microciclo", this); };
        tabsBar.appendChild(btnMicro);

        const secMicro = document.createElement("section");
        secMicro.id = "dep-sec-microciclo";
        secMicro.className = "dep-seccion hidden";
        secMicro.innerHTML = `
            <div class="app-panel">
                <div class="panel-head">
                    <div>
                        <h3><i class="ri-calendar-check-line"></i> Microciclo Semanal — ${deportePagina} <span class="lbl-cat-activa">${categoriaActiva}</span></h3>
                        <small style="color:var(--ink-500)">Planificá los entrenamientos de Lunes a Sábado y compartí el cronograma por WhatsApp.</small>
                    </div>
                    <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="cargarMicrocicloModelo()">⚡ Semana Modelo</button>
                        <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarMicrocicloWhatsApp()"><i class="ri-whatsapp-line"></i> Enviar WA</button>
                    </div>
                </div>
                <div id="contenedorGrillaMicrociclo" class="micro-grid"></div>
            </div>

            <div class="app-panel">
                <div class="panel-head">
                    <div>
                        <h3><i class="ri-file-shield-2-line"></i> Lista de Buena Fe y Habilitación (<span class="lbl-cat-activa">${categoriaActiva}</span>)</h3>
                        <small style="color:var(--ink-500)">Nómina oficial con DNI, edad, apto médico, Score (1–10) y estado de cuota.</small>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="window.print()"><i class="ri-printer-line"></i> Imprimir Lista</button>
                </div>
                <div id="contenedorListaBuenaFeDeporte"></div>
            </div>
        `;
        main.appendChild(secMicro);
    }

    // Botón "📸 Fotos / Videos" en la cabecera de Cancha Partido
    const toolbar = document.querySelector("#dep-sec-partido .match-clock-toolbar");
    if (toolbar && !document.getElementById("btnMediaPartidoCancha")) {
        const bMed = document.createElement("button");
        bMed.type = "button";
        bMed.id = "btnMediaPartidoCancha";
        bMed.className = "btn btn-secondary btn-sm";
        bMed.onclick = () => abrirModalMediaDesdeCancha("EN_VIVO");
        bMed.innerHTML = "📸 Fotos / Videos";
        toolbar.appendChild(bMed);
    }

    if (typeof agregarFilaRutinaAdminGym === "function") {
        const contFilas = document.getElementById("contenedorFilasAdminGym");
        if (contFilas && contFilas.children.length === 0) agregarFilaRutinaAdminGym();
    }
}

// =========================================================================
// 4. NAVEGACIÓN DE CATEGORÍAS Y RENDERIZADO DE PLANTEL
// =========================================================================

function seleccionarCategoriaDeporte(nuevaCat) {
    categoriaActiva = nuevaCat;
    document.querySelectorAll("#barraCategorias .seg-btn").forEach(btn => {
        btn.classList.toggle("active", btn.innerText.trim() === nuevaCat);
    });
    document.querySelectorAll(".lbl-cat-activa").forEach(el => { el.innerText = nuevaCat; });
    eventosPartidoActual = [];
    golesLocalActual = 0;
    golesVisitaActual = 0;
    renderizarPaginaDeporte();
}

function cambiarSeccionDeporte(nombreSec, btnEl) {
    document.querySelectorAll(".dep-seccion").forEach(s => {
        s.classList.add("hidden");
        s.classList.remove("animate-in");
    });
    const sec = document.getElementById(`dep-sec-${nombreSec}`);
    if (sec) {
        sec.classList.remove("hidden");
        sec.classList.add("animate-in");
    }
    document.querySelectorAll(".module-tabs .mod-tab").forEach(b => b.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");
    renderizarPaginaDeporte();
}

function irAArmarRutinaParaPersona(idPersona) {
    const btnTab = Array.from(document.querySelectorAll(".module-tabs .mod-tab")).find(b => b.innerText.toLowerCase().includes("rutina"));
    if (deportePagina === "Gimnasio" && typeof cambiarTabGym === "function" && btnTab) cambiarTabGym("rutinas", btnTab);
    else if (btnTab) cambiarSeccionDeporte("rutinas", btnTab);
    const sel = document.getElementById("adminRutinaPersonaSelect");
    if (sel) sel.value = String(idPersona);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleAsistenciaPersona(id, fecha) {
    const p = basePersonas.find(x => Number(x.id) === Number(id));
    if (!p) return;
    if (!Array.isArray(p.asistencias)) p.asistencias = [];
    if (p.asistencias.includes(fecha)) {
        p.asistencias = p.asistencias.filter(f => f !== fecha);
        mostrarToast(`Asistencia quitada: ${p.nombre}`);
    } else {
        p.asistencias.push(fecha);
        p.asistencias.sort();
        mostrarToast(`✓ Presente registrado: ${p.nombre} ${p.apellido}`);
    }
    guardarDatosCDM();
    renderizarPaginaDeporte();
}

function alternarEstadoPago(id) {
    const p = basePersonas.find(x => Number(x.id) === Number(id));
    if (!p) return;
    if (p.pagoEstado === "Al Día") {
        p.pagoEstado = "Pendiente";
        mostrarToast(`⚠️ Cuota marcada Pendiente: ${p.apellido}`);
    } else {
        const monto = prompt(`Confirmar monto abonado por ${p.nombre} ${p.apellido}:`, p.montoCuota || 25000);
        if (monto === null) return;
        const medio = prompt("Medio de pago (Efectivo / Transferencia / MercadoPago / Tarjeta):", "Transferencia") || "Efectivo";
        p.montoCuota = parseFloat(monto) || 0;
        p.pagoEstado = "Al Día";
        p.ultimoPagoFecha = obtenerHoyISO();
        if (!Array.isArray(p.historialPagos)) p.historialPagos = [];
        p.historialPagos.push({ id: nuevoIdEventoEntero(), fecha: p.ultimoPagoFecha, monto: p.montoCuota, medio: medio.trim() });

        if (typeof registrarAsientoCuotaEnLibroMayor === "function") {
            registrarAsientoCuotaEnLibroMayor(p, p.montoCuota, medio.trim(), p.ultimoPagoFecha);
        }
        mostrarToast(`💳 Pago registrado ($${p.montoCuota.toLocaleString("es-AR")} • ${medio.trim()})`);
    }
    guardarDatosCDM();
    renderizarPaginaDeporte();
}

function renderizarPaginaDeporte() {
    basePersonas.forEach(p => asegurarPilaresPersona(p));
    if (typeof asegurarVideotecaCargada === "function") asegurarVideotecaCargada();

    if (paramDeporteURL && deportePagina) {
        const h2Top = document.querySelector(".topbar-title h2");
        if (h2Top) h2Top.innerHTML = `🏆 ${deportePagina} Oficial <span class="cat-active-pill lbl-cat-activa">${categoriaActiva}</span>`;
        document.title = `${deportePagina} | CDM Pro Suite`;
    }

    const activosCat = obtenerPersonasFiltradasDeporte(true);
    const hoyISO = obtenerHoyISO();
    const presentesHoy = activosCat.filter(p => p.asistencias.includes(hoyISO)).length;
    const promScore = activosCat.length
        ? (activosCat.reduce((acc, p) => acc + (p.puntosCategoria || 7), 0) / activosCat.length).toFixed(1)
        : "0.0";
    const lesionados = activosCat.filter(p => p.estadoMedico && p.estadoMedico !== "Óptimo").length;

    if (document.getElementById("depKpiTotal")) {
        document.getElementById("depKpiTotal").innerText = `${activosCat.length}`;
        document.getElementById("depKpiPresentes").innerText = `${presentesHoy} / ${activosCat.length}`;
        document.getElementById("depKpiScore").innerText = `${promScore} / 10`;
        document.getElementById("depKpiSalud").innerText = `${activosCat.length - lesionados} Apt. / ${lesionados} Les.`;
    }

    const grid = document.getElementById("gridJugadoresDeporte");
    if (grid) {
        const texto = (document.getElementById("inputBuscar")?.value || "").toLowerCase().trim();
        const estado = document.getElementById("filtroEstado")?.value || "activos";
        const tipoGym = document.getElementById("filtroTipoGym")?.value || "todos_gym";
        const fechaActiva = document.getElementById("fechaAsistenciaGym")?.value || hoyISO;

        let lista = obtenerPersonasFiltradasDeporte(false);

        if (deportePagina === "Gimnasio" && tipoGym !== "todos_gym") {
            lista = lista.filter(p => {
                const pu = (p.puesto || "").toLowerCase();
                if (tipoGym === "hipertrofia" || tipoGym === "musculacion") return pu.includes("hipertrofia") || pu.includes("muscul");
                if (tipoGym === "fuerza") return pu.includes("fuerza") || pu.includes("potencia");
                if (tipoGym === "funcional") return pu.includes("funcional") || pu.includes("cardio") || pu.includes("core");
                if (tipoGym === "rehab" || tipoGym === "salud") return pu.includes("rehab") || pu.includes("salud") || (p.estadoMedico && p.estadoMedico !== "Óptimo");
                return true;
            });
        }

        if (estado === "activos") lista = lista.filter(p => p.activo);
        else if (estado === "alerta_frecuencia") lista = lista.filter(p => p.activo && contarAsistenciasUltimos7Dias(p) < (p.frecuenciaSemanal || 3));
        else if (estado === "pagos_pendientes") lista = lista.filter(p => p.activo && p.pagoEstado !== "Al Día");
        else if (estado === "lesionados") lista = lista.filter(p => p.activo && p.estadoMedico && p.estadoMedico !== "Óptimo");

        if (texto) {
            lista = lista.filter(p => `${p.nombre} ${p.apellido} ${p.dni} ${p.puesto} ${obtenerAnioNacimiento(p)}`.toLowerCase().includes(texto));
        }

        if (lista.length === 0) {
            grid.innerHTML = `
                <div class="empty-box" style="grid-column: 1 / -1;">
                    <p style="margin-bottom:0.75rem;">No hay personas cargadas para este filtro.</p>
                    <div style="display:flex; gap:0.45rem; justify-content:center; flex-wrap:wrap;">
                        <button class="btn btn-primary btn-sm" onclick="abrirModalPersona()">+ Alta Nueva</button>
                        ${deportePagina !== "Gimnasio" ? `<button class="btn btn-secondary btn-sm" onclick="abrirModalAbsorberPorEdad(true, 'TODAS', '')">📥 Absorber de Base</button>` : ""}
                    </div>
                </div>
            `;
        } else {
            grid.innerHTML = lista.map(p => {
                const presenteHoy = p.asistencias.includes(fechaActiva);
                const asistSem = contarAsistenciasUltimos7Dias(p);
                const pactado = p.frecuenciaSemanal || 3;
                const faltaFreq = asistSem < pactado;
                const pctBarra = Math.min(100, Math.round((asistSem / pactado) * 100));
                const alDia = (p.pagoEstado || "Al Día") === "Al Día";
                const esDobleCat = deportePagina !== "Gimnasio" && !(p.deporte === deportePagina && p.categoria === categoriaActiva);
                const claseBorde = p.estadoMedico && p.estadoMedico !== "Óptimo" ? "status-danger" : (faltaFreq ? "status-warn" : "");

                const bloqueCentral = deportePagina === "Gimnasio"
                    ? `
                        <div class="pillars-mini-grid gym-3col">
                            <div class="pillar-mini-item"><small>Frecuencia</small><strong>${asistSem}/${pactado} d</strong></div>
                            <div class="pillar-mini-item"><small>Rutinas</small><strong>${baseRutinas.filter(r => Number(r.personaId) === Number(p.id)).length}</strong></div>
                            <div class="pillar-mini-item"><small>Últ. vez</small><strong>${p.asistencias.length ? p.asistencias[p.asistencias.length - 1].slice(5) : "Sin reg."}</strong></div>
                        </div>
                      `
                    : `
                        <div class="pillars-mini-grid">
                            <div class="pillar-mini-item"><small>Físico</small><strong>${p.pilares.fisico}</strong><div class="pillar-micro-bar"><div class="pillar-micro-fill" style="width:${p.pilares.fisico * 10}%"></div></div></div>
                            <div class="pillar-mini-item"><small>Gym</small><strong>${p.pilares.gym}</strong><div class="pillar-micro-bar"><div class="pillar-micro-fill" style="width:${p.pilares.gym * 10}%"></div></div></div>
                            <div class="pillar-mini-item"><small>Técnico</small><strong>${p.pilares.tecnico}</strong><div class="pillar-micro-bar"><div class="pillar-micro-fill" style="width:${p.pilares.tecnico * 10}%"></div></div></div>
                            <div class="pillar-mini-item"><small>Actitud</small><strong>${p.pilares.actitud}</strong><div class="pillar-micro-bar"><div class="pillar-micro-fill" style="width:${p.pilares.actitud * 10}%"></div></div></div>
                        </div>
                      `;

                return `
                    <div class="athlete-card ${claseBorde}" onclick="irAPaginaIndividual(${p.id})">
                        <div class="ath-card-header">
                            <div class="ath-identity-block">
                                ${renderAvatarPersonaCDM(p, 48, "1rem", true)}
                                <div class="ath-title-wrap">
                                    <h4>${escMatchH(p.apellido)}, ${escMatchH(p.nombre)}</h4>
                                    <span class="ath-role-sub">${escMatchH(p.puesto)} • ${calcularEdadExacta(p)} años</span>
                                </div>
                            </div>
                            <div style="display:flex; align-items:center; gap:0.35rem; flex-shrink:0;">
                                ${deportePagina !== "Gimnasio" ? `<div class="ovr-score-badge">⭐ <strong>${p.puntosCategoria}</strong></div>` : ""}
                                <button type="button" class="check-btn ${presenteHoy ? "checked" : ""}" onclick="event.stopPropagation(); toggleAsistenciaPersona(${p.id}, '${fechaActiva}')">✓</button>
                            </div>
                        </div>

                        <div class="ath-meta-pills" onclick="event.stopPropagation();">
                            <span class="badge ${alDia ? "badge-ok" : "badge-danger"}">${alDia ? "💳 Al Día" : "⚠️ Debe Cuota"}</span>
                            <span class="badge ${p.estadoMedico && p.estadoMedico !== "Óptimo" ? "badge-danger" : "badge-ok"}">${p.estadoMedico && p.estadoMedico !== "Óptimo" ? "🏥 " + escMatchH(p.estadoMedico) : "🟢 Apto"}</span>
                            ${esDobleCat ? `<span class="badge badge-celeste" title="Base: ${p.deporte} ${p.categoria}">🔀 Doble Cat.</span>` : ""}
                            <span class="ath-meta-tag">Cat. ${obtenerAnioNacimiento(p)}</span>
                            <span class="ath-meta-tag admin-only-code-chip" style="color:var(--purple-ink); background:var(--purple-bg); cursor:pointer;" onclick="navigator.clipboard.writeText('${p.codigoAcceso}'); mostrarToast('📋 Código copiado: ${p.codigoAcceso}');">🔑 ${p.codigoAcceso}</span>
                        </div>

                        ${bloqueCentral}

                        <div class="ath-freq-bar">
                            <div class="ath-freq-head">
                                <span style="color:${faltaFreq ? "var(--warn-ink)" : "var(--ok-ink)"};">Asistencia 7 días: ${asistSem} de ${pactado}</span>
                                <span style="color:var(--ink-400); font-weight:500;">${p.peso}kg • ${p.altura}cm</span>
                            </div>
                            <div class="ath-freq-track"><div class="ath-freq-fill" style="width:${pctBarra}%; background:${faltaFreq ? "var(--warn)" : "var(--ok)"};"></div></div>
                        </div>

                        <div class="ath-bottom" onclick="event.stopPropagation();">
                            <span style="font-size:0.74rem; font-weight:600; color:var(--cdm-500); cursor:pointer;" onclick="irAPaginaIndividual(${p.id})">Ficha 360° <i class="ri-arrow-right-s-line"></i></span>
                            <div class="ath-actions-group">
                                ${deportePagina === "Gimnasio"
                                    ? `<button class="btn btn-ghost btn-sm" title="Recibo WA" onclick="enviarReciboPagoWhatsApp(${p.id})">🧾</button>`
                                    : `<button class="btn btn-ghost btn-sm" title="Calificar (1-10)" onclick="calificarJugadorRapidoPrompt(${p.id})">⭐</button>`}
                                <button class="btn btn-ghost btn-sm admin-only-code-chip" title="Enviar Código WA" onclick="if(typeof enviarCodigoPorWhatsAppCDM==='function') enviarCodigoPorWhatsAppCDM(${p.id});">🔑</button>
                                <button class="btn btn-ghost btn-sm" title="Asignar Rutina" onclick="irAArmarRutinaParaPersona(${p.id})"><i class="ri-whatsapp-line"></i></button>
                                <button class="btn btn-ghost btn-sm" title="Editar" onclick="abrirModalPersona(${p.id})"><i class="ri-edit-line"></i></button>
                                <button class="btn btn-danger btn-sm" title="Eliminar" onclick="eliminarPersonaDefinitivo(${p.id})"><i class="ri-delete-bin-line"></i></button>
                            </div>
                        </div>
                    </div>
                `;
            }).join("");
        }
    }

    renderizarRankingDeporte();
    if (typeof poblarSelectsAdminRutinasGym === "function") poblarSelectsAdminRutinasGym();
    if (typeof renderizarListaRutinasAdminGym === "function") renderizarListaRutinasAdminGym();
    renderizarCanchaInteractiva();
    renderizarHistorialPartidos();
    renderizarMicrocicloDeporte();

    if (deportePagina === "Gimnasio") {
        if (typeof actualizarDashboardGym === "function") actualizarDashboardGym();
        if (typeof renderizarVideotecaGym === "function") renderizarVideotecaGym();
        if (typeof renderizarMuroRecordsYRetencionGym === "function") renderizarMuroRecordsYRetencionGym();
    }
}

// =========================================================================
// 5. PIZARRA TÁCTICA UNIFICADA MULTI-DEPORTE (MOTIVOS AMPLIADOS + CAMBIOS)
// =========================================================================

const FORMACIONES_FUTBOL = {
    "4-3-3": [
        { num: 1, sigla: "ARQ", nombrePuesto: "Arquero", x: 50, y: 89 },
        { num: 4, sigla: "LD", nombrePuesto: "Lateral Derecho", x: 83, y: 70 },
        { num: 2, sigla: "DFC", nombrePuesto: "Primer Marcador Central", x: 62, y: 73 },
        { num: 6, sigla: "DFC", nombrePuesto: "Segundo Marcador Central", x: 38, y: 73 },
        { num: 3, sigla: "LI", nombrePuesto: "Lateral Izquierdo", x: 17, y: 70 },
        { num: 8, sigla: "MID", nombrePuesto: "Interior Derecho", x: 72, y: 47 },
        { num: 5, sigla: "MCD", nombrePuesto: "Volante Central", x: 50, y: 54 },
        { num: 10, sigla: "MII", nombrePuesto: "Interior Izquierdo / Enganche", x: 28, y: 47 },
        { num: 7, sigla: "ED", nombrePuesto: "Extremo Derecho", x: 80, y: 21 },
        { num: 9, sigla: "DC", nombrePuesto: "Centrodelantero", x: 50, y: 16 },
        { num: 11, sigla: "EI", nombrePuesto: "Extremo Izquierdo", x: 20, y: 21 }
    ],
    "4-4-2": [
        { num: 1, sigla: "ARQ", nombrePuesto: "Arquero", x: 50, y: 89 },
        { num: 4, sigla: "LD", nombrePuesto: "Lateral Derecho", x: 83, y: 70 },
        { num: 2, sigla: "DFC", nombrePuesto: "Central Derecho", x: 62, y: 73 },
        { num: 6, sigla: "DFC", nombrePuesto: "Central Izquierdo", x: 38, y: 73 },
        { num: 3, sigla: "LI", nombrePuesto: "Lateral Izquierdo", x: 17, y: 70 },
        { num: 8, sigla: "MD", nombrePuesto: "Volante Derecho", x: 82, y: 45 },
        { num: 5, sigla: "MCD", nombrePuesto: "Volante Contención", x: 60, y: 49 },
        { num: 10, sigla: "MC", nombrePuesto: "Volante Creativo", x: 40, y: 49 },
        { num: 11, sigla: "MI", nombrePuesto: "Volante Izquierdo", x: 18, y: 45 },
        { num: 7, sigla: "DEL", nombrePuesto: "Segundo Delantero", x: 64, y: 20 },
        { num: 9, sigla: "DC", nombrePuesto: "Centrodelantero", x: 36, y: 20 }
    ],
    "3-5-2": [
        { num: 1, sigla: "ARQ", nombrePuesto: "Arquero", x: 50, y: 89 },
        { num: 4, sigla: "STOP", nombrePuesto: "Stopper Derecho", x: 74, y: 72 },
        { num: 2, sigla: "LIB", nombrePuesto: "Líbero", x: 50, y: 76 },
        { num: 6, sigla: "STOP", nombrePuesto: "Stopper Izquierdo", x: 26, y: 72 },
        { num: 8, sigla: "CAD", nombrePuesto: "Carrilero Derecho", x: 85, y: 46 },
        { num: 5, sigla: "MCD", nombrePuesto: "Volante Central", x: 64, y: 52 },
        { num: 10, sigla: "ENG", nombrePuesto: "Enganche", x: 50, y: 38 },
        { num: 7, sigla: "MC", nombrePuesto: "Volante Mixto", x: 36, y: 52 },
        { num: 3, sigla: "CAI", nombrePuesto: "Carrilero Izquierdo", x: 15, y: 46 },
        { num: 9, sigla: "DC", nombrePuesto: "Delantero Derecho", x: 63, y: 18 },
        { num: 11, sigla: "DC", nombrePuesto: "Delantero Izquierdo", x: 37, y: 18 }
    ],
    "4-2-3-1": [
        { num: 1, sigla: "ARQ", nombrePuesto: "Arquero", x: 50, y: 89 },
        { num: 4, sigla: "LD", nombrePuesto: "Lateral Derecho", x: 83, y: 72 },
        { num: 2, sigla: "DFC", nombrePuesto: "Central Derecho", x: 62, y: 74 },
        { num: 6, sigla: "DFC", nombrePuesto: "Central Izquierdo", x: 38, y: 74 },
        { num: 3, sigla: "LI", nombrePuesto: "Lateral Izquierdo", x: 17, y: 72 },
        { num: 5, sigla: "MCD", nombrePuesto: "Doble Cinco Recuperador", x: 62, y: 54 },
        { num: 8, sigla: "MC", nombrePuesto: "Doble Cinco Salida", x: 38, y: 54 },
        { num: 7, sigla: "ED", nombrePuesto: "Mediapunta Derecho", x: 78, y: 34 },
        { num: 10, sigla: "ENG", nombrePuesto: "Enganche Central", x: 50, y: 34 },
        { num: 11, sigla: "EI", nombrePuesto: "Mediapunta Izquierdo", x: 22, y: 34 },
        { num: 9, sigla: "DC", nombrePuesto: "Único Punta", x: 50, y: 15 }
    ]
};

const FORMACIONES_HOCKEY = {
    "3-4-3": [
        { num: 1, sigla: "ARQ", nombrePuesto: "Arquera/o", x: 50, y: 90 },
        { num: 4, sigla: "STD", nombrePuesto: "Stopper Derecha", x: 74, y: 72 },
        { num: 2, sigla: "LIB", nombrePuesto: "Líbero / Cierre", x: 50, y: 76 },
        { num: 6, sigla: "STI", nombrePuesto: "Stopper Izquierda", x: 26, y: 72 },
        { num: 7, sigla: "HD", nombrePuesto: "Half Derecho", x: 83, y: 47 },
        { num: 5, sigla: "CIN", nombrePuesto: "Cinco (Central)", x: 62, y: 50 },
        { num: 10, sigla: "INT", nombrePuesto: "Interior", x: 38, y: 46 },
        { num: 3, sigla: "HI", nombrePuesto: "Half Izquierdo", x: 17, y: 47 },
        { num: 8, sigla: "WD", nombrePuesto: "Wing Derecho", x: 78, y: 20 },
        { num: 9, sigla: "CF", nombrePuesto: "Centroforward", x: 50, y: 16 },
        { num: 11, sigla: "WI", nombrePuesto: "Wing Izquierdo", x: 22, y: 20 }
    ],
    "4-3-3": [
        { num: 1, sigla: "ARQ", nombrePuesto: "Arquera/o", x: 50, y: 90 },
        { num: 4, sigla: "LD", nombrePuesto: "Defensora Derecha", x: 83, y: 71 },
        { num: 2, sigla: "CD", nombrePuesto: "Central Derecha", x: 62, y: 74 },
        { num: 6, sigla: "CI", nombrePuesto: "Central Izquierda", x: 38, y: 74 },
        { num: 3, sigla: "LI", nombrePuesto: "Defensora Izquierda", x: 17, y: 71 },
        { num: 8, sigla: "ID", nombrePuesto: "Interior Derecha", x: 72, y: 47 },
        { num: 5, sigla: "CIN", nombrePuesto: "Cinco Central", x: 50, y: 53 },
        { num: 10, sigla: "II", nombrePuesto: "Interior Izquierda", x: 28, y: 47 },
        { num: 7, sigla: "WD", nombrePuesto: "Wing Derecha", x: 80, y: 21 },
        { num: 9, sigla: "CF", nombrePuesto: "Centrodelantera", x: 50, y: 16 },
        { num: 11, sigla: "WI", nombrePuesto: "Wing Izquierda", x: 20, y: 21 }
    ],
    "3-3-3-1": [
        { num: 1, sigla: "ARQ", nombrePuesto: "Arquera/o", x: 50, y: 90 },
        { num: 4, sigla: "STD", nombrePuesto: "Stopper Derecha", x: 74, y: 73 },
        { num: 2, sigla: "LIB", nombrePuesto: "Líbero", x: 50, y: 77 },
        { num: 6, sigla: "STI", nombrePuesto: "Stopper Izquierda", x: 26, y: 73 },
        { num: 7, sigla: "HD", nombrePuesto: "Half Derecho", x: 78, y: 53 },
        { num: 5, sigla: "CIN", nombrePuesto: "Cinco", x: 50, y: 56 },
        { num: 3, sigla: "HI", nombrePuesto: "Half Izquierdo", x: 22, y: 53 },
        { num: 8, sigla: "ID", nombrePuesto: "Interior Ofensivo Der.", x: 76, y: 31 },
        { num: 10, sigla: "ENG", nombrePuesto: "Enganche", x: 50, y: 33 },
        { num: 11, sigla: "II", nombrePuesto: "Interior Ofensivo Izq.", x: 24, y: 31 },
        { num: 9, sigla: "CF", nombrePuesto: "Punta de Área", x: 50, y: 15 }
    ]
};

const ESCENARIOS_MULTI_DEPORTE = {
    natacion: {
        titulo: "🏊 Pileta Olímpica — Carriles y Series", clasePitch: "pitch-natacion",
        periodos: [{ val: "Serie 1", txt: "Serie 1 • 50m" }, { val: "Serie 2", txt: "Serie 2 • 100m" }, { val: "Posta", txt: "Posta Relevos" }],
        esquemas: {
            "Pileta 6 Carriles": [1, 2, 3, 4, 5, 6].map((n, i) => ({ num: n, sigla: `C${n}`, nombrePuesto: `Carril ${n}`, x: 11 + i * 15.6, y: [76, 56, 36, 36, 56, 76][i] }))
        },
        acciones: [
            { tipo: "🥇 1° Puesto Serie (Gol)", imp: 0.5, pts: 1 }, { tipo: "🏊 Marca Personal", imp: 0.3 },
            { tipo: "⚡ Salida Explosiva", imp: 0.2 }, { tipo: "🔄 Vuelta Rápida", imp: 0.2 },
            { tipo: "⚠️ Salida Falsa / Descalif.", imp: -0.3 }, { tipo: "🏥 Molestia / Salida Médica", imp: 0 }
        ],
        lineasHTML: `<div class="pool-deck-top"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span></div><div class="pool-flags-top"></div><div class="pool-lane-lines"></div><div class="pool-flags-bottom"></div>`
    },
    basquet: {
        titulo: "🏀 Cancha de Básquet — Quinteto", clasePitch: "pitch-basquet",
        periodos: [{ val: "1C", txt: "1° Cuarto" }, { val: "2C", txt: "2° Cuarto" }, { val: "3C", txt: "3° Cuarto" }, { val: "4C", txt: "4° Cuarto" }, { val: "SUP", txt: "Suplementario" }],
        esquemas: {
            "Quinteto (5-Out)": [
                { num: 4, sigla: "BASE", nombrePuesto: "Base", x: 50, y: 74 }, { num: 7, sigla: "ESC", nombrePuesto: "Escolta", x: 82, y: 58 },
                { num: 10, sigla: "ALE", nombrePuesto: "Alero", x: 18, y: 58 }, { num: 12, sigla: "AP", nombrePuesto: "Ala-Pívot", x: 74, y: 26 },
                { num: 15, sigla: "PIV", nombrePuesto: "Pívot", x: 30, y: 22 }
            ]
        },
        acciones: [
            { tipo: "🏀 Triple (Gol +3)", imp: 0.5, pts: 3 }, { tipo: "🏀 Doble (Gol +2)", imp: 0.3, pts: 2 },
            { tipo: "🎯 Libre Convertido (Gol +1)", imp: 0.2, pts: 1 }, { tipo: "🎯 Asistencia", imp: 0.3 },
            { tipo: "🛡️ Rebote / Robo (Quite)", imp: 0.2 }, { tipo: "🧱 Tapón / Defensa", imp: 0.3 },
            { tipo: "⚠️ Pérdida de Balón", imp: -0.2 }, { tipo: "🟨 Falta Personal / Técnica (Tarjeta)", imp: -0.2 },
            { tipo: "🟥 Expulsión / 5 Faltas (Tarjeta)", imp: -0.5 }, { tipo: "🏥 Lesión / Salida Médica", imp: 0 }
        ],
        lineasHTML: `<div class="pitch-line-half"></div><div class="pitch-circle-center"></div><div class="bball-arc-top"></div><div class="bball-key-top"></div><div class="bball-arc-bottom"></div><div class="bball-key-bottom"></div>`
    },
    voley: {
        titulo: "🏐 Cancha de Vóley — Rotación 6 vs 6", clasePitch: "pitch-voley",
        periodos: [{ val: "Set 1", txt: "1° Set" }, { val: "Set 2", txt: "2° Set" }, { val: "Set 3", txt: "3° Set" }, { val: "Set 4", txt: "4° Set" }, { val: "Set 5", txt: "Tie-Break" }],
        esquemas: {
            "Sistema 5-1": [
                { num: 4, sigla: "P4", nombrePuesto: "Punta (Pos 4)", x: 22, y: 58 }, { num: 3, sigla: "C3", nombrePuesto: "Central (Pos 3)", x: 50, y: 56 },
                { num: 2, sigla: "OP2", nombrePuesto: "Opuesto (Pos 2)", x: 78, y: 58 }, { num: 5, sigla: "Z5", nombrePuesto: "Líbero / Z5", x: 22, y: 82 },
                { num: 6, sigla: "Z6", nombrePuesto: "Zaguero (Pos 6)", x: 50, y: 84 }, { num: 1, sigla: "ARM", nombrePuesto: "Armador (Pos 1)", x: 78, y: 82 }
            ]
        },
        acciones: [
            { tipo: "🏐 Punto Remate (Gol)", imp: 0.5, pts: 1 }, { tipo: "🧱 Bloqueo Punto (Gol)", imp: 0.4, pts: 1 },
            { tipo: "🚀 Saque Ace (Gol)", imp: 0.4, pts: 1 }, { tipo: "🎯 Armado Clave (Asistencia)", imp: 0.2 },
            { tipo: "🛡️ Recepción / Defensa (Quite)", imp: 0.2 }, { tipo: "⚠️ Error Saque / Red", imp: -0.2 },
            { tipo: "🟨 Tarjeta Amarilla", imp: -0.2 }, { tipo: "🏥 Lesión / Salida Médica", imp: 0 }
        ],
        lineasHTML: `<div class="voley-net-line"><span>RED</span></div><div class="voley-3m-top"></div><div class="voley-3m-bottom"></div>`
    },
    padel: {
        titulo: "🎾 Cancha de Pádel / Tenis", clasePitch: "pitch-padel",
        periodos: [{ val: "Set 1", txt: "1° Set" }, { val: "Set 2", txt: "2° Set" }, { val: "Set 3", txt: "3° Set" }],
        esquemas: {
            "Dobles": [
                { num: 1, sigla: "REV", nombrePuesto: "Revés Local", x: 30, y: 74 }, { num: 2, sigla: "DRV", nombrePuesto: "Drive Local", x: 70, y: 74 },
                { num: 3, sigla: "R1", nombrePuesto: "Pareja 2 Revés", x: 30, y: 26 }, { num: 4, sigla: "R2", nombrePuesto: "Pareja 2 Drive", x: 70, y: 26 }
            ]
        },
        acciones: [
            { tipo: "🎾 Winner / Smash (Gol)", imp: 0.5, pts: 1 }, { tipo: "🚀 Saque Ace (Gol)", imp: 0.4, pts: 1 },
            { tipo: "⚡ Bandeja / Víbora", imp: 0.3 }, { tipo: "🛡️ Defensa / Globo (Quite)", imp: 0.2 },
            { tipo: "⚠️ Error No Forzado", imp: -0.2 }, { tipo: "🏥 Molestia / Pausa Médica", imp: 0 }
        ],
        lineasHTML: `<div class="voley-net-line"><span>RED</span></div><div class="padel-service-top"></div><div class="padel-service-bottom"></div><div class="padel-center-service"></div>`
    },
    rugby: {
        titulo: "🏉 Cancha de Rugby", clasePitch: "pitch-rugby",
        periodos: [{ val: "1T", txt: "1° Tiempo" }, { val: "2T", txt: "2° Tiempo" }],
        esquemas: {
            "Seven (7)": [
                { num: 1, sigla: "PIL", nombrePuesto: "Pilar Izq.", x: 25, y: 72 }, { num: 2, sigla: "HK", nombrePuesto: "Hooker", x: 50, y: 76 },
                { num: 3, sigla: "PIL", nombrePuesto: "Pilar Der.", x: 75, y: 72 }, { num: 4, sigla: "MS", nombrePuesto: "Medio Scrum", x: 40, y: 52 },
                { num: 5, sigla: "APE", nombrePuesto: "Apertura", x: 62, y: 44 }, { num: 6, sigla: "CEN", nombrePuesto: "Centro", x: 32, y: 26 },
                { num: 7, sigla: "WNG", nombrePuesto: "Wing", x: 76, y: 22 }
            ]
        },
        acciones: [
            { tipo: "🏉 Try Apoyado (Gol +5)", imp: 0.5, pts: 5 }, { tipo: "🎯 Conversión (Gol +2)", imp: 0.3, pts: 2 },
            { tipo: "🥅 Penal / Drop (Gol +3)", imp: 0.4, pts: 3 }, { tipo: "⚡ Quiebre / Asistencia", imp: 0.3 },
            { tipo: "🛡️ Tackle Clave (Quite)", imp: 0.3 }, { tipo: "⚠️ Penal / Knock-on", imp: -0.2 },
            { tipo: "🟨 Tarjeta Amarilla (Sin Bin)", imp: -0.3 }, { tipo: "🟥 Tarjeta Roja", imp: -0.6 },
            { tipo: "🏥 Lesión / Salida Médica", imp: 0 }
        ],
        lineasHTML: `<div class="pitch-line-half"></div><div class="pitch-line-23m-top"></div><div class="pitch-line-23m-bottom"></div><div class="rugby-try-top"></div><div class="rugby-try-bottom"></div>`
    },
    handball: {
        titulo: "🤾 Cancha de Handball — 7 vs 7", clasePitch: "pitch-handball",
        periodos: [{ val: "1T", txt: "1° Tiempo" }, { val: "2T", txt: "2° Tiempo" }],
        esquemas: {
            "6-0 Clásico": [
                { num: 1, sigla: "ARQ", nombrePuesto: "Arquero", x: 50, y: 89 }, { num: 7, sigla: "EI", nombrePuesto: "Extremo Izq.", x: 16, y: 34 },
                { num: 9, sigla: "LI", nombrePuesto: "Lateral Izq.", x: 26, y: 56 }, { num: 10, sigla: "CEN", nombrePuesto: "Central", x: 50, y: 60 },
                { num: 11, sigla: "LD", nombrePuesto: "Lateral Der.", x: 74, y: 56 }, { num: 8, sigla: "ED", nombrePuesto: "Extremo Der.", x: 84, y: 34 },
                { num: 13, sigla: "PIV", nombrePuesto: "Pívot", x: 50, y: 26 }
            ]
        },
        acciones: [
            { tipo: "🤾 Gol Convertido", imp: 0.5, pts: 1 }, { tipo: "🎯 Gol de 7 Metros (Penal)", imp: 0.4, pts: 1 },
            { tipo: "🎯 Asistencia", imp: 0.3 }, { tipo: "🧤 Atajada / Bloqueo (Quite)", imp: 0.3 },
            { tipo: "⚠️ Pérdida / Pasos", imp: -0.2 }, { tipo: "🟨 Exclusión 2 min (Tarjeta)", imp: -0.3 },
            { tipo: "🟥 Tarjeta Roja", imp: -0.6 }, { tipo: "🏥 Lesión / Salida Médica", imp: 0 }
        ],
        lineasHTML: `<div class="pitch-line-half"></div><div class="pitch-circle-center"></div><div class="handball-6m-top"></div><div class="handball-9m-top"></div><div class="handball-6m-bottom"></div><div class="handball-9m-bottom"></div>`
    },
    boxeo: {
        titulo: "🥊 Ring de Combate", clasePitch: "pitch-boxeo",
        periodos: [{ val: "R1", txt: "Round 1" }, { val: "R2", txt: "Round 2" }, { val: "R3", txt: "Round 3" }],
        esquemas: { "Ring": [{ num: 1, sigla: "AZUL", nombrePuesto: "Rincón Azul", x: 32, y: 68 }, { num: 2, sigla: "ROJO", nombrePuesto: "Rincón Rojo", x: 68, y: 32 }] },
        acciones: [{ tipo: "🏆 Round Ganado (Gol)", imp: 0.5, pts: 1 }, { tipo: "🥊 Golpe Limpio", imp: 0.3 }, { tipo: "🛡️ Esquive (Quite)", imp: 0.2 }, { tipo: "⚠️ Advertencia / Descuento", imp: -0.2 }],
        lineasHTML: `<div class="ring-ropes"></div><div class="ring-center-logo">RING</div>`
    },
    patin: {
        titulo: "🛼 Pista de Patín", clasePitch: "pitch-patin",
        periodos: [{ val: "Pasada 1", txt: "Pasada 1" }, { val: "Pasada 2", txt: "Pasada 2" }],
        esquemas: {
            "Pista (6)": [
                { num: 1, sigla: "T1", nombrePuesto: "Turno 1", x: 25, y: 74 }, { num: 2, sigla: "T2", nombrePuesto: "Turno 2", x: 50, y: 78 },
                { num: 3, sigla: "T3", nombrePuesto: "Turno 3", x: 75, y: 74 }, { num: 4, sigla: "T4", nombrePuesto: "Turno 4", x: 50, y: 50 },
                { num: 5, sigla: "T5", nombrePuesto: "Turno 5", x: 30, y: 26 }, { num: 6, sigla: "T6", nombrePuesto: "Turno 6", x: 70, y: 26 }
            ]
        },
        acciones: [{ tipo: "🌟 Figura Perfecta (Gol)", imp: 0.5, pts: 1 }, { tipo: "⚡ Velocidad", imp: 0.3 }, { tipo: "⚠️ Caída", imp: -0.2 }],
        lineasHTML: `<div class="patin-oval-track"></div>`
    }
};

function detectarEscenarioExtra() {
    if (!deportePagina || ["Futbol", "Hockey", "Gimnasio"].includes(deportePagina)) return null;
    const k = normalizarTextoEjercicioCDM(deportePagina);
    if (k.includes("natacion") || k.includes("pileta")) return ESCENARIOS_MULTI_DEPORTE.natacion;
    if (k.includes("basquet") || k.includes("basket")) return ESCENARIOS_MULTI_DEPORTE.basquet;
    if (k.includes("voley") || k.includes("volley")) return ESCENARIOS_MULTI_DEPORTE.voley;
    if (k.includes("padel") || k.includes("tenis")) return ESCENARIOS_MULTI_DEPORTE.padel;
    if (k.includes("rugby")) return ESCENARIOS_MULTI_DEPORTE.rugby;
    if (k.includes("handball")) return ESCENARIOS_MULTI_DEPORTE.handball;
    if (k.includes("boxeo") || k.includes("mma")) return ESCENARIOS_MULTI_DEPORTE.boxeo;
    if (k.includes("patin")) return ESCENARIOS_MULTI_DEPORTE.patin;
    return null;
}

function obtenerCatalogoFormacionActual() {
    const esc = detectarEscenarioExtra();
    const selForm = document.getElementById("matchFormacion");
    const selPer = document.getElementById("matchPeriodo");

    if (esc) {
        if (selForm && selForm.dataset.escenario !== deportePagina) {
            selForm.dataset.escenario = deportePagina;
            selForm.innerHTML = Object.keys(esc.esquemas).map(n => `<option value="${n}">${n}</option>`).join("");
        }
        if (selPer && selPer.dataset.escenario !== deportePagina) {
            selPer.dataset.escenario = deportePagina;
            selPer.innerHTML = esc.periodos.map(p => `<option value="${p.val}">${p.txt}</option>`).join("");
            periodoPartidoActual = esc.periodos[0].val;
            actualizarTextoCronometro();
        }
        return esc.esquemas[selForm?.value] || Object.values(esc.esquemas)[0];
    }

    const form = selForm?.value || (deportePagina === "Hockey" ? "3-4-3" : "4-3-3");
    if (deportePagina === "Hockey") return FORMACIONES_HOCKEY[form] || FORMACIONES_HOCKEY["3-4-3"];
    return FORMACIONES_FUTBOL[form] || FORMACIONES_FUTBOL["4-3-3"];
}

function obtenerClaveAlineacion() {
    return `${deportePagina}_${categoriaActiva}_${document.getElementById("matchFormacion")?.value || "4-3-3"}`;
}

function obtenerMapaAlineacionActual() {
    const k = obtenerClaveAlineacion();
    if (!baseAlineaciones[k]) baseAlineaciones[k] = {};
    return baseAlineaciones[k];
}

function autoArmarAlineacionCancha() {
    const activos = obtenerPersonasFiltradasDeporte(true);
    if (!activos.length) return alert(`No hay jugadores activos en ${deportePagina} (${categoriaActiva}).`);
    const coords = obtenerCatalogoFormacionActual();
    const mapa = obtenerMapaAlineacionActual();
    const usados = Object.values(mapa).map(Number);
    const disp = activos.filter(p => !usados.includes(Number(p.id)));
    coords.forEach((_, idx) => { if (!mapa[idx] && disp.length) mapa[idx] = disp.shift().id; });
    guardarDatosCDM();
    renderizarCanchaInteractiva();
    mostrarToast("⚡ Alineación completada.");
}

function vaciarAlineacionCancha() {
    baseAlineaciones[obtenerClaveAlineacion()] = {};
    guardarDatosCDM();
    renderizarCanchaInteractiva();
    mostrarToast("🧹 Cancha vacía.");
}

// --- RELOJ DE PARTIDO (REAL 60s / RÁPIDO 3s) ---
let modoVelocidadRelojPartido = localStorage.getItem("cdm_modo_reloj_partido") || "real";

function inyectarBotonVelocidadRelojCancha() {
    const toolbar = document.querySelector(".match-clock-toolbar");
    if (!toolbar || document.getElementById("btnModoVelocidadReloj")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "btnModoVelocidadReloj";
    btn.className = "btn btn-ghost btn-sm";
    btn.onclick = () => {
        modoVelocidadRelojPartido = modoVelocidadRelojPartido === "real" ? "rapido" : "real";
        localStorage.setItem("cdm_modo_reloj_partido", modoVelocidadRelojPartido);
        btn.innerHTML = modoVelocidadRelojPartido === "real" ? "⏱️ Reloj: Real (60s)" : "⚡ Reloj: Rápido (3s)";
        if (timerIntervaloPartido) { toggleCronometroPartido(); toggleCronometroPartido(); }
    };
    btn.innerHTML = modoVelocidadRelojPartido === "real" ? "⏱️ Reloj: Real (60s)" : "⚡ Reloj: Rápido (3s)";
    toolbar.appendChild(btn);
}

function actualizarTextoCronometro() {
    const el = document.getElementById("cronometroMinutoTexto");
    if (el) el.innerText = `${periodoPartidoActual} • ${String(minutoPartidoActual).padStart(2, "0")}'`;
}

function cambiarPeriodoPartido(valor) {
    periodoPartidoActual = valor;
    if (timerIntervaloPartido) {
        clearInterval(timerIntervaloPartido);
        timerIntervaloPartido = null;
        const btn = document.getElementById("btnToggleCronometro");
        if (btn) btn.innerText = "▶ Iniciar";
    }
    if (valor === "2T" && minutoPartidoActual < 45) minutoPartidoActual = 45;
    else if (valor === "2C" && minutoPartidoActual < 15) minutoPartidoActual = 15;
    else if (valor === "3C" && minutoPartidoActual < 30) minutoPartidoActual = 30;
    else if (valor === "4C" && minutoPartidoActual < 45) minutoPartidoActual = 45;
    actualizarTextoCronometro();
}

function toggleCronometroPartido() {
    const btn = document.getElementById("btnToggleCronometro");
    if (!btn) return;
    if (timerIntervaloPartido) {
        clearInterval(timerIntervaloPartido);
        timerIntervaloPartido = null;
        btn.innerText = "▶ Iniciar";
    } else {
        if (minutoPartidoActual === 0 && (periodoPartidoActual === "1T" || periodoPartidoActual === "1C")) minutoPartidoActual = 1;
        actualizarTextoCronometro();
        btn.innerText = "⏸ Pausa";
        timerIntervaloPartido = setInterval(() => {
            minutoPartidoActual++;
            actualizarTextoCronometro();
        }, modoVelocidadRelojPartido === "real" ? 60000 : 3000);
    }
}

function sumarMinutosDesdeSelect(el) {
    const v = parseInt(el.value, 10);
    if (!isNaN(v) && v !== 0) {
        minutoPartidoActual = Math.max(0, minutoPartidoActual + v);
        actualizarTextoCronometro();
        el.value = "";
    }
}

function reiniciarCronometroPartido() {
    if (timerIntervaloPartido) clearInterval(timerIntervaloPartido);
    timerIntervaloPartido = null;
    minutoPartidoActual = 0;
    periodoPartidoActual = deportePagina === "Hockey" ? "1C" : "1T";
    const sel = document.getElementById("matchPeriodo");
    if (sel) sel.value = periodoPartidoActual;
    actualizarTextoCronometro();
    const btn = document.getElementById("btnToggleCronometro");
    if (btn) btn.innerText = "▶ Iniciar";
}

function ajustarMarcadorEnVivo(equipo, delta) {
    if (equipo === "local") golesLocalActual = Math.max(0, golesLocalActual + delta);
    else golesVisitaActual = Math.max(0, golesVisitaActual + delta);
    const inpRes = document.getElementById("matchResultado");
    if (inpRes) inpRes.value = `${golesLocalActual} - ${golesVisitaActual}`;
    renderizarCanchaInteractiva();
}

function registrarEventoRivalEnVivo() {
    const nota = prompt(`🆚 Anotar Gol / Evento del Rival (${periodoPartidoActual} • ${minutoPartidoActual}'):\nDejá el detalle (ej: Gol rival de córner / Contraataque):`, "Gol del rival");
    if (nota === null) return;
    const sumaGol = confirm("¿Sumar +1 al marcador del Rival?");
    if (sumaGol) {
        golesVisitaActual++;
        const inpRes = document.getElementById("matchResultado");
        if (inpRes) inpRes.value = `${golesLocalActual} - ${golesVisitaActual}`;
    }
    eventosPartidoActual.push({
        id: nuevoIdEventoEntero(),
        minuto: minutoPartidoActual,
        minutoDisplay: `${periodoPartidoActual} • ${minutoPartidoActual}'`,
        jugadorId: 0,
        jugadorNombre: "🆚 RIVAL",
        puestoEnCancha: "RIVAL",
        tipo: sumaGol ? "🔴 Gol del Rival" : "🆚 Acción Rival",
        detalle: nota.trim() || "Evento rival",
        impactoPuntos: 0,
        pts: 0
    });
    eventosPartidoActual.sort((a, b) => a.minuto - b.minuto);
    renderizarCanchaInteractiva();
}

function editarNotaEventoEnVivo(idEv) {
    const ev = eventosPartidoActual.find(x => Number(x.id) === Number(idEv));
    if (!ev) return;
    const nueva = prompt(`📝 Editar anotación del profesor (${ev.minutoDisplay} • ${ev.jugadorNombre} — ${ev.tipo}):`, ev.detalle || "");
    if (nueva === null) return;
    ev.detalle = nueva.trim() || "Registrado en cancha";
    renderizarEventosPartidoEnVivo();
    mostrarToast("📝 Anotación actualizada.");
}

function abrirFichaDesdeBancoSeguro(idJug) {
    if (eventosPartidoActual.length > 0 && !confirm("⚠️ Tenés jugadas sin guardar en el partido actual. ¿Salir igual a la ficha del jugador?")) return;
    irAPaginaIndividual(idJug);
}

function renderizarCanchaInteractiva() {
    inyectarBotonVelocidadRelojCancha();
    const pitch = document.getElementById("contenedorCanchaTactica");
    if (!pitch) return;

    const esc = detectarEscenarioExtra();
    const coords = obtenerCatalogoFormacionActual();
    const mapa = obtenerMapaAlineacionActual();
    const activos = obtenerPersonasFiltradasDeporte(true);
    const splitWrap = pitch.closest(".split-view") || pitch.parentNode;

    pitch.className = esc ? `tactical-pitch ${esc.clasePitch}` : (deportePagina === "Hockey" ? "tactical-pitch pitch-hockey" : "tactical-pitch");
    if (esc) {
        const h3 = document.querySelector("#dep-sec-partido .panel-head h3");
        if (h3) h3.innerHTML = `${esc.titulo} <span class="cat-active-pill lbl-cat-activa">${categoriaActiva}</span>`;
    }

    // 1. Marcador arriba de .split-view
    let board = document.getElementById("liveMatchScoreboardBox");
    if (!board) {
        board = document.createElement("div");
        board.id = "liveMatchScoreboardBox";
        board.className = "live-scoreboard";
        splitWrap.parentNode.insertBefore(board, splitWrap);
    }

    // 2. Barra de Fecha, Condición (Local/Visitante) y Nota General del DT arriba de .split-view
    if (!document.getElementById("matchMetaStripBox")) {
        const meta = document.createElement("div");
        meta.id = "matchMetaStripBox";
        meta.className = "match-meta-strip";
        meta.innerHTML = `
            <div class="field"><label>📅 Fecha del Partido</label><input type="date" id="matchFechaManual" value="${obtenerHoyISO()}"></div>
            <div class="field"><label>🏟️ Condición</label>
                <select id="matchCondicion">
                    <option value="Local">🏠 Local</option>
                    <option value="Visitante">🚌 Visitante</option>
                    <option value="Neutral">🏟️ Neutral / Torneo</option>
                </select>
            </div>
            <div class="field"><label>📝 Análisis / Nota General del Profesor (se guarda en el Informe Completo)</label>
                <input type="text" id="matchNotaGeneralDT" placeholder="Ej: Buen primer tiempo presionando alto, mejorar pelotas paradas...">
            </div>
        `;
        board.insertAdjacentElement("afterend", meta);
    }

    const quites = eventosPartidoActual.filter(e => /quite|barrida|atajada|tackle|rebote|bloqueo/i.test(e.tipo)).length;
    const asist = eventosPartidoActual.filter(e => /asistencia|córner|pase|armado/i.test(e.tipo)).length;
    const tarj = eventosPartidoActual.filter(e => /tarjeta|exclusión|expulsión/i.test(e.tipo)).length;
    const cambios = eventosPartidoActual.filter(e => /cambio|sustitución/i.test(e.tipo)).length;
    const mediaEnVivo = obtenerMediaPartidosCDM().filter(it => it.partidoId === "EN_VIVO").length;
    const club = obtenerLicenciaConfigCDM().siglaCodigo || "CDM";

    const btnMed = document.getElementById("btnMediaPartidoCancha");
    if (btnMed) btnMed.innerHTML = mediaEnVivo > 0 ? `📸 Fotos / Videos (${mediaEnVivo})` : "📸 Fotos / Videos";

    board.innerHTML = `
        <div class="score-team-box">
            <strong>💙🤍 ${club} (${categoriaActiva})</strong>
            <button type="button" class="btn btn-ghost btn-sm" style="padding:0.2rem 0.5rem;" onclick="ajustarMarcadorEnVivo('local', -1)">-</button>
            <span class="score-number">${golesLocalActual}</span>
            <button type="button" class="btn btn-primary btn-sm" style="padding:0.2rem 0.5rem;" onclick="ajustarMarcadorEnVivo('local', 1)">+</button>
        </div>
        <div style="text-align:center;">
            <span class="badge badge-celeste" style="margin-bottom:4px;">EN VIVO</span>
            <div style="display:flex; gap:0.55rem; font-size:0.75rem; color:#bae6fd; font-weight:800; flex-wrap:wrap; justify-content:center;">
                <span>🛡️ Quites: ${quites}</span><span>•</span><span>⚡ Asist: ${asist}</span><span>•</span><span>🔄 Cambios: ${cambios}</span><span>•</span><span>🟨 Tarj: ${tarj}</span>
            </div>
        </div>
        <div class="score-team-box">
            <button type="button" class="btn btn-ghost btn-sm" style="padding:0.2rem 0.5rem;" onclick="ajustarMarcadorEnVivo('visita', -1)">-</button>
            <span class="score-number" style="color:#ffffff;">${golesVisitaActual}</span>
            <button type="button" class="btn btn-primary btn-sm" style="padding:0.2rem 0.5rem;" onclick="ajustarMarcadorEnVivo('visita', 1)">+</button>
            <strong>🆚 RIVAL</strong>
        </div>
    `;

    let html = esc ? esc.lineasHTML : `
        <div class="pitch-line-half"></div>
        ${deportePagina === "Hockey" ? '<div class="pitch-line-23m-top"></div><div class="pitch-line-23m-bottom"></div>' : ""}
        <div class="pitch-circle-center"></div>
        <div class="pitch-area-top"></div>
        <div class="pitch-area-bottom"></div>
    `;

    const titularesIds = [];
    coords.forEach((pos, idx) => {
        const j = mapa[idx] ? activos.find(x => Number(x.id) === Number(mapa[idx])) : null;
        if (j) titularesIds.push(Number(j.id));
        const cantEv = j ? eventosPartidoActual.filter(e => Number(e.jugadorId) === Number(j.id)).length : 0;

        html += j ? `
            <div class="pitch-node" style="left:${pos.x}%; top:${pos.y}%;" onclick="abrirModalPuestoCancha(${idx})">
                <div class="pitch-token" style="${j.foto ? `background-image:url('${j.foto}'); background-size:cover; background-position:center;` : ""}">
                    ${j.foto ? `<span style="position:absolute; bottom:-4px; left:-4px; background:#071526; color:#38bdf8; font-size:0.62rem; font-weight:800; padding:1px 5px; border-radius:99px; border:1.5px solid #fff;">#${pos.num}</span>` : pos.num}
                    ${cantEv > 0 ? `<span class="pitch-token-badge">${cantEv}</span>` : ""}
                </div>
                <span class="pitch-label">${escMatchH(j.apellido)}</span>
                <span class="pitch-sub-role">${pos.sigla} • ⭐${j.puntosCategoria}</span>
            </div>
        ` : `
            <div class="pitch-node" style="left:${pos.x}%; top:${pos.y}%;" onclick="abrirModalPuestoCancha(${idx})">
                <div class="pitch-token empty-slot">+${pos.num}</div>
                <span class="pitch-label">+ ${pos.sigla}</span>
                <span class="pitch-sub-role">${pos.nombrePuesto}</span>
            </div>
        `;
    });
    pitch.innerHTML = html;

    // 3. Banco de Relevos abajo de .split-view a ancho completo
    let bench = document.getElementById("liveBenchStripBox");
    if (!bench) {
        bench = document.createElement("div");
        bench.id = "liveBenchStripBox";
        bench.className = "bench-strip";
        splitWrap.insertAdjacentElement("afterend", bench);
    }
    const suplentes = activos.filter(p => !titularesIds.includes(Number(p.id)));
    bench.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.45rem; flex-wrap:wrap;">
            <strong style="font-size:0.78rem;"><i class="ri-user-shared-line"></i> BANCO DE RELEVOS (${suplentes.length})</strong>
            <small style="color:var(--ink-500); font-size:0.72rem;">Tocá un puesto en la cancha para ingresar a un relevo</small>
        </div>
        <div style="display:flex; gap:0.38rem; flex-wrap:wrap;">
            ${suplentes.length ? suplentes.map(s => `<span class="badge badge-celeste" style="cursor:pointer;" onclick="abrirFichaDesdeBancoSeguro(${s.id})">👤 ${escMatchH(s.apellido)}, ${escMatchH(s.nombre)} (⭐${s.puntosCategoria})</span>`).join("") : `<small style="color:var(--ink-500)">Todos en cancha.</small>`}
        </div>
    `;
    renderizarEventosPartidoEnVivo();
}

// --- MODAL DE PUESTO EN CANCHA MEJORADO (CAMBIO OFICIAL + TODOS LOS MOTIVOS) ---
const _borradorSlotCancha = {};

function obtenerBorradorCancha(slotIdx) {
    if (!_borradorSlotCancha[slotIdx]) _borradorSlotCancha[slotIdx] = [];
    return _borradorSlotCancha[slotIdx];
}

function refrescarListaBorradorCancha(slotIdx) {
    const box = document.getElementById("boxPendientesCancha");
    if (!box) return;
    const lista = obtenerBorradorCancha(slotIdx);
    if (!lista.length) {
        box.innerHTML = `<small style="color:var(--ink-500);">Tocá las acciones que quieras acumular. Podés escribir el detalle antes o después de marcar la jugada.</small>`;
        return;
    }
    box.innerHTML = `
        <strong style="font-size:0.76rem; color:var(--cdm-700); display:block; margin-bottom:0.35rem;">📌 Marcadas para guardar (${lista.length}):</strong>
        <div style="display:flex; flex-direction:column; gap:0.28rem;">
            ${lista.map((it, idx) => `
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem; padding:0.32rem 0.55rem; background:var(--surface-solid); border:1px solid var(--line); border-radius:8px; font-size:0.77rem;">
                    <span><b>${idx + 1}.</b> ${escMatchH(it.tipo)} (${it.impacto >= 0 ? "+" : ""}${it.impacto})${it.detalle ? ` — <i>"${escMatchH(it.detalle)}"</i>` : ""}</span>
                    <button type="button" class="btn btn-danger btn-sm" style="min-height:22px; padding:0 6px;" onclick="quitarPendienteCancha(${slotIdx}, ${idx})">✕</button>
                </div>
            `).join("")}
        </div>
    `;
}

function marcarAccionSinCerrarCancha(slotIdx, tipo, impactoDef, ptsMarcador = 0) {
    const minTxt = document.getElementById("evCanchaMinuto")?.value.trim() || `${periodoPartidoActual} • ${minutoPartidoActual}'`;
    const inpDet = document.getElementById("evCanchaDetalle");
    const det = (inpDet?.value || "").trim();
    obtenerBorradorCancha(slotIdx).push({ minutoDisplay: minTxt, tipo, impacto: impactoDef, pts: ptsMarcador || 0, detalle: det });
    if (inpDet) inpDet.value = "";
    refrescarListaBorradorCancha(slotIdx);
}

function quitarPendienteCancha(slotIdx, idx) {
    obtenerBorradorCancha(slotIdx).splice(idx, 1);
    refrescarListaBorradorCancha(slotIdx);
}

function abrirModalPuestoCancha(slotIdx) {
    slotCanchaSeleccionadoIndex = slotIdx;
    const coords = obtenerCatalogoFormacionActual();
    const info = coords[slotIdx];
    const mapa = obtenerMapaAlineacionActual();
    const idAct = mapa[slotIdx] || null;
    const activos = obtenerPersonasFiltradasDeporte(true);
    const jAct = idAct ? activos.find(x => Number(x.id) === Number(idAct)) : null;
    const esc = detectarEscenarioExtra();

    const acciones = esc ? esc.acciones : (deportePagina === "Hockey"
        ? [
            { tipo: "🏑 Gol de Jugada", imp: 0.5, pts: 1 },
            { tipo: "📐 Gol Córner Corto", imp: 0.5, pts: 1 },
            { tipo: "🎯 Gol de Penal", imp: 0.4, pts: 1 },
            { tipo: "🎯 Asistencia de Gol", imp: 0.3 },
            { tipo: "⚡ Provocó Córner Corto", imp: 0.2 },
            { tipo: "🥅 Remate al Arco", imp: 0.2 },
            { tipo: "🛡️ Quite / Barrida", imp: 0.2 },
            { tipo: "🧤 Atajada / Cierre", imp: 0.3 },
            { tipo: "⚠️ Pérdida de Bocha / Falta", imp: -0.2 },
            { tipo: "🟩 Tarjeta Verde (2 min)", imp: -0.2 },
            { tipo: "🟨 Tarjeta Amarilla (5/10 min)", imp: -0.4 },
            { tipo: "🟥 Tarjeta Roja", imp: -0.7 },
            { tipo: "🏥 Lesión / Salida Médica", imp: 0 },
            { tipo: "📝 Nota Táctica", imp: 0 }
        ]
        : [
            { tipo: "⚽ Gol Convertido", imp: 0.5, pts: 1 },
            { tipo: "🎯 Gol de Penal", imp: 0.4, pts: 1 },
            { tipo: "🎯 Asistencia de Gol", imp: 0.3 },
            { tipo: "🥅 Remate al Arco", imp: 0.2 },
            { tipo: "⚡ Pase Filtrado / Desborde", imp: 0.2 },
            { tipo: "🚩 Córner / Pelota Parada", imp: 0.1 },
            { tipo: "🛡️ Quite / Recuperación", imp: 0.2 },
            { tipo: "🧤 Atajada / Penal Atajado", imp: 0.4 },
            { tipo: "⚠️ Pérdida / Error Grave", imp: -0.2 },
            { tipo: "⚠️ Falta Cometida / Recibida", imp: -0.1 },
            { tipo: "🟨 Tarjeta Amarilla", imp: -0.3 },
            { tipo: "🟥 Tarjeta Roja", imp: -0.7 },
            { tipo: "🏥 Lesión / Salida Médica", imp: 0 },
            { tipo: "📝 Nota Táctica", imp: 0 }
        ]);

    const opcJug = `<option value="">-- Dejar puesto libre --</option>` + activos.map(p => {
        const oc = Object.entries(mapa).find(([k, v]) => Number(k) !== slotIdx && Number(v) === Number(p.id));
        return `<option value="${p.id}" ${Number(p.id) === Number(idAct) ? "selected" : ""}>${escMatchH(p.apellido)}, ${escMatchH(p.nombre)} (⭐${p.puntosCategoria}/10)${oc ? ` [En #${coords[oc[0]]?.num}]` : ""}</option>`;
    }).join("");

    const modal = document.getElementById("modalEventoCancha");
    modal.innerHTML = `
        <div class="modal-window" style="max-width:650px;">
            <div class="modal-top">
                <div>
                    <span class="badge badge-celeste">Puesto #${info.num} • ${info.sigla} • ${deportePagina}</span>
                    <h3 style="margin-top:3px;">${info.nombrePuesto}${jAct ? ` — ${escMatchH(jAct.apellido)}, ${escMatchH(jAct.nombre)}` : ""}</h3>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('modalEventoCancha').classList.add('hidden')">✕</button>
            </div>

            <!-- 1. UBICAR JUGADOR O REALIZAR CAMBIO OFICIAL (SALE / ENTRA) -->
            <div style="background:var(--cdm-50); border:1.5px solid var(--line-celeste); padding:0.85rem; border-radius:14px; margin-bottom:0.85rem;">
                <label style="font-size:0.73rem; font-weight:800; display:block; margin-bottom:0.4rem;">
                    👤 1. ${jAct ? `Cambio de Jugador (Sale ${escMatchH(jAct.apellido)}) o Reubicar` : "Ubicar Jugador Titular en este Puesto"}
                </label>
                <div style="display:flex; gap:0.45rem; flex-wrap:wrap; align-items:center;">
                    <select id="selectAsignarJugadorSlot" style="flex:1; min-width:210px;">${opcJug}</select>
                    ${jAct ? `
                        <select id="selectMotivoCambioCancha" style="width:auto; min-width:135px; font-size:0.78rem;">
                            <option value="Cambio Táctico">📋 Táctico</option>
                            <option value="Cansancio / Fatiga">🥵 Cansancio</option>
                            <option value="Lesión / Molestia">🏥 Lesión</option>
                            <option value="Precaución por Tarjeta">🟨 Por Tarjeta</option>
                        </select>
                        <button type="button" class="btn btn-ok btn-sm" onclick="procesarCambioJugadorCancha(true)" title="Reemplaza en cancha y registra el cambio en el acta">🔄 Hacer Cambio</button>
                    ` : ""}
                    <button type="button" class="btn btn-primary btn-sm" onclick="procesarCambioJugadorCancha(false)" title="Ubicar sin anotar cambio en el acta">📍 Ubicar</button>
                </div>
            </div>

            ${jAct ? `
                <form onsubmit="guardarAccionesCanchaModal(event, ${slotIdx})">
                    <div class="grid-2" style="margin-bottom:0.6rem;">
                        <div class="field"><label>Minuto / Período</label><input type="text" id="evCanchaMinuto" value="${periodoPartidoActual} • ${minutoPartidoActual}'"></div>
                        <div class="field"><label>Detalle / Anotación del Profesor</label><input type="text" id="evCanchaDetalle" placeholder="Ej: Remate cruzado al ángulo, buena marca..."></div>
                    </div>

                    <label style="font-size:0.73rem; font-weight:800; display:block; margin-bottom:0.4rem;">⚡ 2. Tocá las jugadas de ${escMatchH(jAct.nombre)} (acumula varias sin cerrar):</label>
                    <div class="cancha-quick-actions">
                        ${acciones.map(a => {
                            const cls = a.imp > 0 ? "is-pos" : a.imp < 0 ? "is-neg" : "is-neu";
                            return `<button type="button" class="cancha-quick-btn ${cls}" onclick="marcarAccionSinCerrarCancha(${slotIdx}, '${a.tipo.replace(/'/g, "\\'")}', ${a.imp}, ${a.pts || 0})">${a.tipo}</button>`;
                        }).join("")}
                    </div>

                    <div id="boxPendientesCancha" style="margin-bottom:0.8rem; padding:0.65rem; background:var(--surface-subtle); border:1.5px solid var(--line-celeste); border-radius:12px;"></div>
                    <button type="submit" class="btn btn-primary" style="width:100%;">💾 Guardar Acciones y Cerrar</button>
                </form>
            ` : `<div class="empty-box" style="padding:1.1rem;">Elegí un jugador arriba y tocá "📍 Ubicar" para anotarle acciones o hacer cambios.</div>`}
        </div>
    `;
    modal.classList.remove("hidden");
    if (jAct) refrescarListaBorradorCancha(slotIdx);
}

function procesarCambioJugadorCancha(registrarEnActa = false) {
    const idVal = document.getElementById("selectAsignarJugadorSlot").value;
    const mapa = obtenerMapaAlineacionActual();
    const idNum = parseInt(idVal, 10);
    const idAnt = mapa[slotCanchaSeleccionadoIndex];

    if (!idVal) {
        delete mapa[slotCanchaSeleccionadoIndex];
        guardarDatosCDM();
        renderizarCanchaInteractiva();
        abrirModalPuestoCancha(slotCanchaSeleccionadoIndex);
        return;
    }

    if (registrarEnActa && idAnt && Number(idAnt) === idNum) {
        mostrarToast("⚠️ Elegí en el selector al jugador que ingresa antes de tocar Hacer Cambio.");
        return;
    }

    if (idAnt && Number(idAnt) !== idNum && (registrarEnActa || minutoPartidoActual > 0)) {
        const jE = basePersonas.find(x => Number(x.id) === idNum);
        const jS = basePersonas.find(x => Number(x.id) === Number(idAnt));
        const info = obtenerCatalogoFormacionActual()[slotCanchaSeleccionadoIndex];
        const mot = document.getElementById("selectMotivoCambioCancha")?.value || "Cambio Táctico";
        const minTxt = document.getElementById("evCanchaMinuto")?.value.trim() || `${periodoPartidoActual} • ${minutoPartidoActual}'`;
        if (jE && jS) {
            eventosPartidoActual.push({
                id: nuevoIdEventoEntero(), minuto: minutoPartidoActual, minutoDisplay: minTxt,
                jugadorId: jE.id, jugadorNombre: `${jE.apellido}, ${jE.nombre}`,
                jugadorSaleId: jS.id, jugadorSaleNombre: `${jS.apellido}, ${jS.nombre}`,
                puestoEnCancha: `#${info.num} ${info.sigla}`,
                tipo: "🔄 Cambio / Sustitución", detalle: `Entra ${jE.apellido} por ${jS.apellido} (${mot})`, impactoPuntos: 0, pts: 0
            });
            eventosPartidoActual.sort((a, b) => a.minuto - b.minuto);
            mostrarToast(`🔄 Cambio registrado: Entra ${jE.apellido} por ${jS.apellido}`);
        }
    }

    Object.keys(mapa).forEach(k => { if (Number(mapa[k]) === idNum) delete mapa[k]; });
    mapa[slotCanchaSeleccionadoIndex] = idNum;
    guardarDatosCDM();
    renderizarCanchaInteractiva();
    abrirModalPuestoCancha(slotCanchaSeleccionadoIndex);
}

function guardarAccionesCanchaModal(e, slotIdx) {
    e.preventDefault();
    const mapa = obtenerMapaAlineacionActual();
    const j = basePersonas.find(x => Number(x.id) === Number(mapa[slotIdx]));
    if (!j) return;

    const lista = obtenerBorradorCancha(slotIdx);
    const detLibre = (document.getElementById("evCanchaDetalle")?.value || "").trim();
    const minTxt = document.getElementById("evCanchaMinuto")?.value.trim() || `${periodoPartidoActual} • ${minutoPartidoActual}'`;

    if (!lista.length && detLibre) {
        lista.push({ minutoDisplay: minTxt, tipo: "📝 Nota Táctica", impacto: 0, pts: 0, detalle: detLibre });
    } else if (lista.length && detLibre) {
        lista.forEach(it => {
            if (!it.detalle) it.detalle = detLibre;
        });
    }
    if (!lista.length) return alert("Tocá al menos una jugada o escribí una observación.");

    const info = obtenerCatalogoFormacionActual()[slotIdx] || { num: slotIdx + 1, sigla: "POS" };
    lista.forEach(it => {
        const sumaPts = it.pts > 0 ? it.pts : (esEventoDeGolOAnotacion(it.tipo) ? 1 : 0);
        if (sumaPts > 0) {
            golesLocalActual += sumaPts;
            const inpRes = document.getElementById("matchResultado");
            if (inpRes) inpRes.value = `${golesLocalActual} - ${golesVisitaActual}`;
        }
        eventosPartidoActual.push({
            id: nuevoIdEventoEntero(),
            minuto: minutoPartidoActual,
            minutoDisplay: it.minutoDisplay,
            jugadorId: j.id,
            jugadorNombre: `${j.apellido}, ${j.nombre}`,
            puestoEnCancha: `#${info.num} ${info.sigla}`,
            tipo: it.tipo,
            detalle: it.detalle || "Registrado en cancha",
            impactoPuntos: it.impacto,
            pts: sumaPts
        });
    });

    eventosPartidoActual.sort((a, b) => a.minuto - b.minuto);
    _borradorSlotCancha[slotIdx] = [];
    document.getElementById("modalEventoCancha")?.classList.add("hidden");
    mostrarToast(`✓ ${lista.length} acción(es) guardadas para ${j.apellido}`);
    renderizarCanchaInteractiva();
}

function armarTextoCitacionPartido() {
    const coords = obtenerCatalogoFormacionActual();
    const mapa = obtenerMapaAlineacionActual();
    const activos = obtenerPersonasFiltradasDeporte(true);
    const rival = document.getElementById("matchRival")?.value.trim() || "Próximo Rival";
    const cond = document.getElementById("matchCondicion")?.value || "Local";
    const fecha = document.getElementById("matchFechaManual")?.value || obtenerHoyISO();
    const club = obtenerLicenciaConfigCDM().nombreEntidad.toUpperCase();

    let msg = `💙🤍 *CITACIÓN Y FORMACIÓN — ${club}*\n🏆 ${deportePagina} (${categoriaActiva}) • 🆚 ${rival} (${cond}) • 📅 ${fecha}\n----------------------------------\n*📋 TITULARES:*\n`;
    const titIds = [];
    coords.forEach((pos, idx) => {
        const j = mapa[idx] ? activos.find(x => Number(x.id) === Number(mapa[idx])) : null;
        if (j) { titIds.push(Number(j.id)); msg += `• #${pos.num} (${pos.sigla}): ${j.apellido}, ${j.nombre}\n`; }
    });
    const supl = activos.filter(p => !titIds.includes(Number(p.id)));
    if (supl.length) msg += `\n*🔄 RELEVOS:*\n` + supl.map(s => `• ${s.apellido}, ${s.nombre}`).join("\n");
    return msg;
}

function enviarFormacionWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(armarTextoCitacionPartido())}`, "_blank");
}

function copiarFormacionPortapapeles() {
    navigator.clipboard.writeText(armarTextoCitacionPartido()).then(() => mostrarToast("📋 Formación copiada."));
}

function renderizarEventosPartidoEnVivo() {
    const cont = document.getElementById("listaEventosPartidoEnVivo");
    const badge = document.getElementById("contadorEventosPartido");
    if (!cont || !badge) return;
    badge.innerText = eventosPartidoActual.length;

    const barra = `
        <div style="display:flex; gap:0.38rem; margin-bottom:0.7rem; flex-wrap:wrap;">
            <button type="button" class="btn btn-whatsapp btn-sm" style="flex:1;" onclick="enviarFormacionWhatsApp()"><i class="ri-whatsapp-line"></i> Citación WA</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="copiarFormacionPortapapeles()">📋 Copiar</button>
            <button type="button" class="btn btn-danger btn-sm" onclick="registrarEventoRivalEnVivo()" title="Anotar gol o evento del rival">+ 🆚 Rival</button>
        </div>
    `;
    if (!eventosPartidoActual.length) {
        cont.innerHTML = barra + `<div class="empty-box">Tocá cualquier círculo de la cancha para ubicar jugadores, hacer cambios y anotar jugadas.</div>`;
        return;
    }
    cont.innerHTML = barra + eventosPartidoActual.map(ev => `
        <div style="background:var(--surface-solid); border:1px solid var(--line); border-left:3.5px solid ${ev.jugadorId === 0 ? "#ef4444" : "#0284c7"}; border-radius:10px; padding:0.55rem 0.75rem; margin-bottom:0.42rem; font-size:0.8rem; display:flex; justify-content:space-between; align-items:center; gap:0.45rem;">
            <div style="min-width:0;">
                <span class="badge badge-celeste">${escMatchH(ev.minutoDisplay)}</span>
                <strong style="margin-left:4px;">${escMatchH(ev.jugadorNombre)}</strong> • <b>${escMatchH(ev.tipo)}</b>
                <br><small style="color:var(--ink-500)">📝 ${escMatchH(ev.detalle)}</small>
            </div>
            <div style="display:flex; gap:0.25rem; flex-shrink:0;">
                <button type="button" class="btn btn-ghost btn-sm" style="min-height:26px; padding:0 6px;" title="Editar anotación" onclick="editarNotaEventoEnVivo(${ev.id})">✏️</button>
                <button type="button" class="btn btn-danger btn-sm" style="min-height:26px; padding:0 7px;" onclick="eventosPartidoActual=eventosPartidoActual.filter(x=>Number(x.id)!==${ev.id}); renderizarCanchaInteractiva();">✕</button>
            </div>
        </div>
    `).join("");
}

function parsearMarcadorPartido(m) {
    if (typeof m.golesLocal === "number" && typeof m.golesVisita === "number") {
        return { gf: m.golesLocal, gc: m.golesVisita };
    }
    const nums = String(m.resultado || "").match(/\d+/g);
    if (nums && nums.length >= 2) return { gf: parseInt(nums[0], 10), gc: parseInt(nums[1], 10) };
    return { gf: 0, gc: 0 };
}

function finalizarYGuardarPartido() {
    if (!eventosPartidoActual.length && golesLocalActual === 0 && golesVisitaActual === 0) {
        return alert("Anotá al menos una jugada, cambio o resultado antes de cerrar el partido.");
    }
    const rival = document.getElementById("matchRival")?.value.trim() || "Partido Oficial";
    const resultado = document.getElementById("matchResultado")?.value.trim() || `${golesLocalActual} - ${golesVisitaActual}`;
    const fechaSel = document.getElementById("matchFechaManual")?.value || obtenerHoyISO();
    const condicion = document.getElementById("matchCondicion")?.value || "Local";
    const notaGeneralDT = (document.getElementById("matchNotaGeneralDT")?.value || "").trim();

    const coords = obtenerCatalogoFormacionActual();
    const mapaAl = obtenerMapaAlineacionActual();
    const activos = obtenerPersonasFiltradasDeporte(true);
    const titulares = [];
    const titIds = new Set();
    coords.forEach((pos, idx) => {
        const j = mapaAl[idx] ? activos.find(x => Number(x.id) === Number(mapaAl[idx])) : null;
        if (j) {
            titIds.add(Number(j.id));
            titulares.push({ id: j.id, num: pos.num, sigla: pos.sigla, nombre: `${j.apellido}, ${j.nombre}` });
        }
    });
    const suplentes = activos
        .filter(p => !titIds.has(Number(p.id)))
        .map(s => ({ id: s.id, nombre: `${s.apellido}, ${s.nombre}` }));

    const mapa = {};
    eventosPartidoActual.forEach(e => {
        if (!e.jugadorId) return; // Ignorar eventos del rival en el resumen de jugadores propios
        if (!mapa[e.jugadorId]) mapa[e.jugadorId] = { id: e.jugadorId, nombre: e.jugadorNombre, puesto: e.puestoEnCancha, eventos: 0, puntosSugeridos: 0 };
        if (!/sustitución|cambio/i.test(e.tipo)) {
            mapa[e.jugadorId].eventos++;
            mapa[e.jugadorId].puntosSugeridos = Math.round((mapa[e.jugadorId].puntosSugeridos + (e.impactoPuntos || 0)) * 10) / 10;
        }
    });
    const resumen = Object.values(mapa);
    const goles = eventosPartidoActual.filter(e => e.jugadorId > 0 && esEventoDeGolOAnotacion(e.tipo)).length;
    const quites = eventosPartidoActual.filter(e => e.jugadorId > 0 && /quite|barrida|atajada|tackle|rebote|bloqueo/i.test(e.tipo)).length;
    const cambios = eventosPartidoActual.filter(e => /cambio|sustitución/i.test(e.tipo)).length;
    const conclusion = `vs ${rival} (${resultado} • ${condicion}): ${eventosPartidoActual.length} registros (${goles} goles/anotaciones, ${quites} defensas, ${cambios} cambios).`;

    const parsed = parsearMarcadorPartido({ resultado });
    const nuevoId = nuevoIdEventoEntero();

    basePartidos.unshift({
        id: nuevoId, fecha: fechaSel, anio: fechaSel.slice(0, 4), condicion,
        deporte: deportePagina, categoria: categoriaActiva,
        rival, resultado, golesLocal: parsed.gf, golesVisita: parsed.gc,
        formacion: document.getElementById("matchFormacion")?.value || "4-3-3",
        titulares, suplentes, notaGeneralDT,
        eventos: [...eventosPartidoActual], conclusion, resumenJugadores: resumen, puntosAplicadosAlRanking: false
    });

    // Vincular automáticamente fotos/videos subidos "EN_VIVO" durante este partido
    const mediaList = obtenerMediaPartidosCDM();
    let mediaVinculada = 0;
    mediaList.forEach(it => {
        if (it.partidoId === "EN_VIVO") {
            it.partidoId = nuevoId;
            it.fecha = fechaSel;
            it.rival = rival;
            mediaVinculada++;
        }
    });
    if (mediaVinculada > 0) guardarMediaPartidosCDM(mediaList);

    guardarDatosCDM();
    eventosPartidoActual = [];
    golesLocalActual = 0;
    golesVisitaActual = 0;
    reiniciarCronometroPartido();
    if (document.getElementById("matchRival")) document.getElementById("matchRival").value = "";
    if (document.getElementById("matchResultado")) document.getElementById("matchResultado").value = "";
    if (document.getElementById("matchNotaGeneralDT")) document.getElementById("matchNotaGeneralDT").value = "";
    if (document.getElementById("matchFechaManual")) document.getElementById("matchFechaManual").value = obtenerHoyISO();

    mostrarToast(`🏁 Partido guardado${mediaVinculada ? ` (+${mediaVinculada} archivos vinculados)` : ""}.`);
    renderizarCanchaInteractiva();
    renderizarHistorialPartidos();
}

// =========================================================================
// 6. TABLERO ANUAL DE TEMPORADA + TABLA ANUAL POR JUGADOR + INFORME PARTIDO A PARTIDO
// =========================================================================

window.__filtroAnioTemporadaCDM = String(new Date().getFullYear());
window.__filtroCatTemporadaCDM = "ACTUAL";
window.__filtroCondTemporadaCDM = "TODAS";
window.__subtabTemporadaCDM = "partidos"; // 'partidos' | 'jugadores'

function calcularEstadisticasTemporada(partidos) {
    let pg = 0, pe = 0, pp = 0, gfTot = 0, gcTot = 0;
    const mapGoles = {}, mapAsist = {}, mapDef = {}, mapTarj = {};
    const statsJug = {};

    const asegJ = (id, nom) => {
        const k = String(id || nom);
        if (!statsJug[k]) statsJug[k] = { id, nombre: nom, partidosSet: new Set(), goles: 0, asist: 0, def: 0, amarillas: 0, rojas: 0, cambios: 0, balance: 0 };
        return statsJug[k];
    };

    partidos.forEach(m => {
        const { gf, gc } = parsearMarcadorPartido(m);
        gfTot += gf; gcTot += gc;
        if (gf > gc) pg++;
        else if (gf === gc) pe++;
        else pp++;

        (m.titulares || []).forEach(t => asegJ(t.id, t.nombre).partidosSet.add(m.id));

        (m.eventos || []).forEach(ev => {
            if (!ev.jugadorId) return;
            const nom = ev.jugadorNombre || "Jugador";
            const sj = asegJ(ev.jugadorId, nom);
            sj.partidosSet.add(m.id);

            if (esEventoDeGolOAnotacion(ev.tipo)) {
                const inc = Number(ev.pts) > 0 ? Number(ev.pts) : 1;
                mapGoles[nom] = (mapGoles[nom] || 0) + inc;
                sj.goles += inc;
            }
            if (/asistencia|pase filtrado|armado/i.test(ev.tipo)) {
                mapAsist[nom] = (mapAsist[nom] || 0) + 1;
                sj.asist++;
            }
            if (/quite|barrida|atajada|tackle|rebote|bloqueo/i.test(ev.tipo)) {
                mapDef[nom] = (mapDef[nom] || 0) + 1;
                sj.def++;
            }
            if (/tarjeta|exclusión|expulsión/i.test(ev.tipo)) {
                mapTarj[nom] = (mapTarj[nom] || 0) + 1;
                if (/roja|expulsión/i.test(ev.tipo)) sj.rojas++;
                else sj.amarillas++;
            }
            if (/cambio|sustitución/i.test(ev.tipo)) sj.cambios++;
            else sj.balance = Math.round((sj.balance + (Number(ev.impactoPuntos) || 0)) * 10) / 10;
        });
    });

    const tablaJugadores = Object.values(statsJug)
        .map(s => ({ ...s, pj: s.partidosSet.size }))
        .sort((a, b) => (b.goles - a.goles) || (b.asist - a.asist) || (b.pj - a.pj));

    const pj = partidos.length;
    const dif = gfTot - gcTot;
    const efec = pj > 0 ? Math.round(((pg * 3 + pe) / (pj * 3)) * 100) : 0;

    return { pj, pg, pe, pp, gfTot, gcTot, dif, efec, mapGoles, mapAsist, mapDef, mapTarj, tablaJugadores };
}

function renderizarHistorialPartidos() {
    const cont = document.getElementById("contenedorHistorialPartidos");
    if (!cont) return;

    const todosDep = basePartidos.filter(m => m.deporte === deportePagina);
    const aniosDisp = [...new Set([String(new Date().getFullYear()), ...todosDep.map(m => String(m.fecha || "").slice(0, 4)).filter(Boolean)])].sort().reverse();
    const anioSel = window.__filtroAnioTemporadaCDM || String(new Date().getFullYear());
    const catModo = window.__filtroCatTemporadaCDM || "ACTUAL";
    const condModo = window.__filtroCondTemporadaCDM || "TODAS";
    const subtab = window.__subtabTemporadaCDM || "partidos";

    const partidos = todosDep.filter(m => {
        if (catModo === "ACTUAL" && m.categoria !== categoriaActiva) return false;
        if (anioSel !== "TODOS" && !String(m.fecha || "").startsWith(anioSel)) return false;
        if (condModo !== "TODAS" && (m.condicion || "Local") !== condModo) return false;
        return true;
    }).sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")));

    const st = calcularEstadisticasTemporada(partidos);
    const topList = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const allMedia = obtenerMediaPartidosCDM();

    window.__ultimoResumenAnualData = { partidos, st, anioSel, catModo, condModo };

    cont.innerHTML = `
        <!-- TABLERO ANUAL DE TEMPORADA -->
        <div style="background:var(--surface-solid); border:1.5px solid var(--line-celeste); border-radius:16px; padding:1rem 1.1rem; margin-bottom:1.1rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.6rem; flex-wrap:wrap; margin-bottom:0.85rem;">
                <div>
                    <strong style="font-size:0.95rem;">📊 Balance Anual de Temporada — ${deportePagina} (${catModo === "ACTUAL" ? categoriaActiva : "Todas las Categorías"})</strong>
                    <small style="display:block; color:var(--ink-500); font-size:0.74rem;">Resultados acumulados, líderes del año e informe anual imprimible</small>
                </div>
                <div style="display:flex; gap:0.4rem; flex-wrap:wrap; align-items:center;">
                    <select style="width:auto; min-height:34px; font-weight:700; font-size:0.77rem;" onchange="window.__filtroAnioTemporadaCDM=this.value; renderizarHistorialPartidos();">
                        <option value="TODOS" ${anioSel === "TODOS" ? "selected" : ""}>📅 Todos los Años</option>
                        ${aniosDisp.map(a => `<option value="${a}" ${anioSel === a ? "selected" : ""}>📅 Año ${a}</option>`).join("")}
                    </select>
                    <select style="width:auto; min-height:34px; font-weight:700; font-size:0.77rem;" onchange="window.__filtroCatTemporadaCDM=this.value; renderizarHistorialPartidos();">
                        <option value="ACTUAL" ${catModo === "ACTUAL" ? "selected" : ""}>Solo ${categoriaActiva}</option>
                        <option value="TODAS" ${catModo === "TODAS" ? "selected" : ""}>Todas las Categorías</option>
                    </select>
                    <select style="width:auto; min-height:34px; font-weight:700; font-size:0.77rem;" onchange="window.__filtroCondTemporadaCDM=this.value; renderizarHistorialPartidos();">
                        <option value="TODAS" ${condModo === "TODAS" ? "selected" : ""}>🏟️ Todas Cond.</option>
                        <option value="Local" ${condModo === "Local" ? "selected" : ""}>🏠 Local</option>
                        <option value="Visitante" ${condModo === "Visitante" ? "selected" : ""}>🚌 Visitante</option>
                        <option value="Neutral" ${condModo === "Neutral" ? "selected" : ""}>🏟️ Neutral</option>
                    </select>
                    ${st.pj > 0 ? `<button type="button" class="btn btn-primary btn-sm" onclick="imprimirInformeAnualTemporadaPDF()">🖨️ PDF Anual A4</button>` : ""}
                </div>
            </div>

            <div class="season-kpi-grid">
                <div class="season-kpi"><small>Partidos (PJ)</small><strong>${st.pj}</strong></div>
                <div class="season-kpi" style="border-top-color:#10b981;"><small>Ganados (PG)</small><strong style="color:#059669;">${st.pg}</strong></div>
                <div class="season-kpi" style="border-top-color:#f59e0b;"><small>Empates (PE)</small><strong style="color:#d97706;">${st.pe}</strong></div>
                <div class="season-kpi" style="border-top-color:#ef4444;"><small>Perdidos (PP)</small><strong style="color:#dc2626;">${st.pp}</strong></div>
                <div class="season-kpi" style="border-top-color:#6366f1;"><small>Tantos (GF / GC)</small><strong>${st.gfTot} / ${st.gcTot} <small style="display:inline; font-size:0.75rem;">(${st.dif >= 0 ? "+" : ""}${st.dif})</small></strong></div>
                <div class="season-kpi" style="border-top-color:#0d9488;"><small>Efectividad</small><strong>${st.efec}%</strong></div>
            </div>

            ${st.pj > 0 ? `
                <div class="season-leaders-grid">
                    <div class="season-leader-box">
                        <strong style="display:block; margin-bottom:0.35rem; color:#0284c7;">⚽ Goleadores / Anotadores</strong>
                        ${topList(st.mapGoles).length ? topList(st.mapGoles).map(([n, c], i) => `<div class="season-leader-row"><span>${i + 1}. ${escMatchH(n)}</span><b>${c}</b></div>`).join("") : `<small style="color:var(--ink-500);">Sin registros</small>`}
                    </div>
                    <div class="season-leader-box">
                        <strong style="display:block; margin-bottom:0.35rem; color:#7c3aed;">🎯 Asistencias / Creación</strong>
                        ${topList(st.mapAsist).length ? topList(st.mapAsist).map(([n, c], i) => `<div class="season-leader-row"><span>${i + 1}. ${escMatchH(n)}</span><b>${c}</b></div>`).join("") : `<small style="color:var(--ink-500);">Sin registros</small>`}
                    </div>
                    <div class="season-leader-box">
                        <strong style="display:block; margin-bottom:0.35rem; color:#059669;">🛡️ Quites / Atajadas</strong>
                        ${topList(st.mapDef).length ? topList(st.mapDef).map(([n, c], i) => `<div class="season-leader-row"><span>${i + 1}. ${escMatchH(n)}</span><b>${c}</b></div>`).join("") : `<small style="color:var(--ink-500);">Sin registros</small>`}
                    </div>
                    <div class="season-leader-box">
                        <strong style="display:block; margin-bottom:0.35rem; color:#dc2626;">🟨 Tarjetas / Disciplina</strong>
                        ${topList(st.mapTarj).length ? topList(st.mapTarj).map(([n, c], i) => `<div class="season-leader-row"><span>${i + 1}. ${escMatchH(n)}</span><b>${c}</b></div>`).join("") : `<small style="color:var(--ink-500);">Sin tarjetas</small>`}
                    </div>
                </div>

                <div class="season-subtabs">
                    <button type="button" class="season-subtab-btn ${subtab === "partidos" ? "active" : ""}" onclick="window.__subtabTemporadaCDM='partidos'; renderizarHistorialPartidos();">📅 Partido a Partido (${st.pj})</button>
                    <button type="button" class="season-subtab-btn ${subtab === "jugadores" ? "active" : ""}" onclick="window.__subtabTemporadaCDM='jugadores'; renderizarHistorialPartidos();">👥 Tabla Anual por Jugador (${st.tablaJugadores.length})</button>
                </div>
            ` : ""}
        </div>

        ${subtab === "jugadores" && st.pj > 0 ? `
            <div class="table-wrap" style="background:var(--surface-solid); border:1px solid var(--line); border-radius:14px; padding:0.75rem;">
                <table class="app-table" style="font-size:0.8rem;">
                    <thead><tr><th>Jugador</th><th>PJ</th><th>⚽ Goles/Pts</th><th>🎯 Asist.</th><th>🛡️ Quites/Ataj.</th><th>🟨 / 🟥</th><th>🔄 Cambios</th><th>Balance</th></tr></thead>
                    <tbody>
                        ${st.tablaJugadores.map(j => `
                            <tr style="cursor:pointer;" onclick="if(${Number(j.id) || 0}) irAPaginaIndividual(${j.id})">
                                <td><strong>${escMatchH(j.nombre)}</strong></td>
                                <td><b>${j.pj}</b></td>
                                <td><span class="badge badge-celeste">${j.goles}</span></td>
                                <td>${j.asist}</td>
                                <td>${j.def}</td>
                                <td>${j.amarillas} / ${j.rojas}</td>
                                <td>${j.cambios}</td>
                                <td><span class="badge ${j.balance >= 0 ? "badge-ok" : "badge-warn"}">${j.balance >= 0 ? "+" : ""}${j.balance} pts</span></td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        ` : (partidos.length === 0 ? `<div class="empty-box">Sin partidos registrados para ${deportePagina} (${anioSel === "TODOS" ? "Todos los años" : anioSel}).</div>` :
        partidos.map(m => {
            const { gf, gc } = parsearMarcadorPartido(m);
            const resBadge = gf > gc ? `<span class="badge badge-ok">🏆 VICTORIA</span>` : gf === gc ? `<span class="badge badge-warn">🤝 EMPATE</span>` : `<span class="badge badge-danger">🔴 DERROTA</span>`;
            const cantMedia = allMedia.filter(it => Number(it.partidoId) === Number(m.id)).length;
            const evs = Array.isArray(m.eventos) ? m.eventos : [];
            return `
                <div style="background:var(--surface-subtle); border:1px solid var(--line); border-left:4px solid ${gf > gc ? "#10b981" : gf === gc ? "#f59e0b" : "#ef4444"}; border-radius:14px; padding:0.95rem 1.05rem; margin-bottom:0.75rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.45rem; margin-bottom:0.45rem;">
                        <div>
                            ${resBadge}
                            <strong style="margin-left:5px;">📅 ${escMatchH(m.fecha)} — ${escMatchH(m.rival)} (${escMatchH(m.resultado)})</strong>
                            <small style="color:var(--ink-500); margin-left:6px;">${escMatchH(m.condicion || "Local")} • ${escMatchH(m.categoria)} • ${escMatchH(m.formacion)}</small>
                        </div>
                        <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
                            <button class="btn btn-primary btn-sm" onclick="abrirInformePartidoCompleto(${m.id})">📋 Informe Completo</button>
                            <button class="btn btn-secondary btn-sm" onclick="abrirModalMediaDesdeCancha(${m.id})">📸 Media (${cantMedia})</button>
                            ${m.puntosAplicadosAlRanking ? `<span class="badge badge-ok">✓ Valorado</span>` : `<button class="btn btn-ok btn-sm" onclick="aplicarPuntosPartidoAlRanking(${m.id})">⚖️ Al Score</button>`}
                            <button class="btn btn-danger btn-sm" onclick="if(confirm('¿Eliminar partido?')){ basePartidos=basePartidos.filter(x=>Number(x.id)!==${m.id}); guardarDatosCDM(); renderizarHistorialPartidos(); }">🗑️</button>
                        </div>
                    </div>
                    <p style="font-size:0.81rem; color:var(--ink-700); margin-bottom:0.35rem;">🧠 ${escMatchH(m.conclusion)}</p>
                    ${m.notaGeneralDT ? `<p style="font-size:0.8rem; color:var(--cdm-700); margin-bottom:0.45rem;"><b>🗣️ Nota del DT:</b> ${escMatchH(m.notaGeneralDT)}</p>` : ""}

                    ${evs.length ? `
                        <div class="match-hist-events">
                            ${evs.map(ev => {
                                const det = ev.detalle && ev.detalle !== "Registrado en cancha" ? ev.detalle : "";
                                return `
                                    <div class="match-hist-ev-row">
                                        <span class="badge badge-celeste" style="font-size:0.68rem;">${escMatchH(ev.minutoDisplay)}</span>
                                        <strong>${escMatchH(ev.jugadorNombre)}</strong>
                                        <span>${escMatchH(ev.tipo)}</span>
                                        ${det ? `<span class="match-hist-note">— 📝 "${escMatchH(det)}"</span>` : ""}
                                    </div>
                                `;
                            }).join("")}
                        </div>
                    ` : ""}

                    <div>${(m.resumenJugadores || []).map(rj => `<span class="badge ${rj.puntosSugeridos >= 0 ? "badge-ok" : "badge-warn"}" style="margin:2px;">${escMatchH(rj.nombre)}: ${rj.puntosSugeridos >= 0 ? "+" : ""}${rj.puntosSugeridos} pts</span>`).join("")}</div>
                </div>
            `;
        }).join(""))}
    `;
}

function imprimirInformeAnualTemporadaPDF() {
    const data = window.__ultimoResumenAnualData;
    if (!data || !data.partidos.length) return alert("Sin partidos para imprimir.");
    const { partidos, st, anioSel, catModo, condModo } = data;
    const club = obtenerLicenciaConfigCDM().nombreEntidad || "Club Deportivo";

    imprimirInformePartidoA4(`
        <div style="border-bottom:2.5px solid #0284c7; padding-bottom:0.75rem; margin-bottom:1rem; display:flex; justify-content:space-between; align-items:flex-end;">
            <div>
                <div style="font-size:0.7rem; font-weight:800; color:#0284c7;">INFORME ANUAL DE TEMPORADA • ${escMatchH(deportePagina.toUpperCase())}</div>
                <h2 style="margin:2px 0; font-size:1.38rem;">${escMatchH(club)} — ${catModo === "ACTUAL" ? escMatchH(categoriaActiva) : "Todas las Categorías"}</h2>
                <small>Año: <b>${anioSel === "TODOS" ? "Todos" : anioSel}</b> • Condición: <b>${condModo}</b> • Emisión: ${new Date().toLocaleDateString("es-AR")}</small>
            </div>
            <div style="text-align:right; font-size:0.82rem;">
                <div><b>Campaña:</b> ${st.pj} PJ (${st.pg}G • ${st.pe}E • ${st.pp}P)</div>
                <div><b>Tantos:</b> ${st.gfTot} a favor / ${st.gcTot} en contra (${st.dif >= 0 ? "+" : ""}${st.dif})</div>
                <div><b>Efectividad:</b> ${st.efec}%</div>
            </div>
        </div>

        <h4 style="margin:0 0 6px;">1. Resultados Partido a Partido (${partidos.length})</h4>
        <table style="margin-bottom:1rem;">
            <thead><tr><th>Fecha</th><th>Cond.</th><th>Rival</th><th>Resultado</th><th>Resumen / Nota DT</th></tr></thead>
            <tbody>
                ${partidos.map(m => `<tr><td>${escMatchH(m.fecha)}</td><td>${escMatchH(m.condicion || "Local")}</td><td><b>${escMatchH(m.rival)}</b></td><td><b>${escMatchH(m.resultado)}</b></td><td>${escMatchH(m.notaGeneralDT || m.conclusion)}</td></tr>`).join("")}
            </tbody>
        </table>

        <h4 style="margin:0 0 6px;">2. Estadísticas Anuales por Jugador (${st.tablaJugadores.length})</h4>
        <table>
            <thead><tr><th>Jugador</th><th>PJ</th><th>Goles/Pts</th><th>Asist.</th><th>Quites/Ataj.</th><th>Amar./Rojas</th><th>Cambios</th><th>Balance</th></tr></thead>
            <tbody>
                ${st.tablaJugadores.map(j => `<tr><td><b>${escMatchH(j.nombre)}</b></td><td>${j.pj}</td><td><b>${j.goles}</b></td><td>${j.asist}</td><td>${j.def}</td><td>${j.amarillas} / ${j.rojas}</td><td>${j.cambios}</td><td>${j.balance >= 0 ? "+" : ""}${j.balance} pts</td></tr>`).join("")}
            </tbody>
        </table>
    `);
}

function guardarNotaGeneralPartidoGuardado(idPartido, valor) {
    const m = basePartidos.find(x => Number(x.id) === Number(idPartido));
    if (!m) return;
    m.notaGeneralDT = String(valor || "").trim();
    guardarDatosCDM();
    renderizarHistorialPartidos();
    mostrarToast("📝 Análisis del partido guardado.");
}

function enviarInformePartidoWhatsApp(idPartido) {
    const m = basePartidos.find(x => Number(x.id) === Number(idPartido));
    if (!m) return;
    const club = obtenerLicenciaConfigCDM().nombreEntidad.toUpperCase();
    let msg = `🏆 *INFORME DE PARTIDO — ${club}*\n`;
    msg += `📅 ${m.fecha} • ${m.deporte} (${m.categoria}) • ${m.condicion || "Local"}\n`;
    msg += `🆚 *vs ${m.rival}* — Marcador Final: *${m.resultado}*\n----------------------------------\n`;
    if (m.notaGeneralDT) msg += `🗣️ *Análisis DT:* ${m.notaGeneralDT}\n\n`;
    const evs = m.eventos || [];
    if (evs.length) {
        msg += `⏱️ *RESUMEN MINUTO A MINUTO:*\n`;
        evs.forEach(e => {
            const det = e.detalle && e.detalle !== "Registrado en cancha" ? ` (${e.detalle})` : "";
            msg += `• ${e.minutoDisplay} — *${e.jugadorNombre}*: ${e.tipo}${det}\n`;
        });
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
}

// --- VISOR DE INFORME PARTIDO A PARTIDO (DATOS + ANOTACIONES + FOTOS + VIDEOS + PDF A4 + WA) ---
async function abrirInformePartidoCompleto(idPartido) {
    const m = basePartidos.find(x => Number(x.id) === Number(idPartido));
    if (!m) return;

    const media = obtenerMediaPartidosCDM().filter(it => Number(it.partidoId) === Number(m.id));
    const fotosResueltas = [];
    for (const it of media) {
        if (it.tipo === "foto" && it.idbKey) {
            const url = await leerFotoIDBPartidoCDM(it.idbKey);
            if (url) fotosResueltas.push({ ...it, dataUrl: url });
        }
    }
    const videos = media.filter(it => it.tipo === "video");
    const club = obtenerLicenciaConfigCDM().nombreEntidad || "Club Deportivo";

    let modal = document.getElementById("modalInformePartidoCDM");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "modalInformePartidoCDM";
        modal.className = "modal-backdrop hidden";
        modal.onclick = (e) => { if (e.target === modal) modal.classList.add("hidden"); };
        document.body.appendChild(modal);
    }

    const construirHTMLInforme = () => `
        <div style="border-bottom:2.5px solid #0284c7; padding-bottom:0.75rem; margin-bottom:0.9rem; display:flex; justify-content:space-between; flex-wrap:wrap; gap:0.6rem;">
            <div>
                <div style="font-size:0.7rem; font-weight:800; color:#0284c7;">INFORME OFICIAL DE PARTIDO • ${escMatchH(m.deporte)} (${escMatchH(m.categoria)})</div>
                <h2 style="margin:2px 0; font-size:1.35rem;">${escMatchH(club)} vs ${escMatchH(m.rival)}</h2>
                <small>📅 Fecha: <b>${escMatchH(m.fecha)}</b> • 🏟️ Condición: <b>${escMatchH(m.condicion || "Local")}</b> • Formación: <b>${escMatchH(m.formacion)}</b></small>
            </div>
            <div style="background:#0c192c; color:#38bdf8; padding:0.55rem 1.1rem; border-radius:14px; text-align:center;">
                <small style="display:block; font-size:0.64rem; color:#bae6fd;">MARCADOR FINAL</small>
                <strong style="font-size:1.55rem; font-weight:900;">${escMatchH(m.resultado)}</strong>
            </div>
        </div>

        <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:10px; padding:0.65rem 0.85rem; font-size:0.83rem; margin-bottom:0.9rem;">
            <div><b>🧠 Resumen Automático:</b> ${escMatchH(m.conclusion)}</div>
            ${m.notaGeneralDT ? `<div style="margin-top:4px;"><b>🗣️ Análisis del Profesor:</b> ${escMatchH(m.notaGeneralDT)}</div>` : ""}
        </div>

        ${Array.isArray(m.titulares) && m.titulares.length ? `
            <h4 style="margin:0 0 6px; font-size:0.88rem;">📋 Formación Titular (${m.titulares.length})</h4>
            <div style="display:flex; flex-wrap:wrap; gap:0.35rem; margin-bottom:0.7rem;">
                ${m.titulares.map(t => `<span class="badge badge-celeste">#${t.num} ${escMatchH(t.sigla)} — ${escMatchH(t.nombre)}</span>`).join("")}
            </div>
        ` : ""}

        ${Array.isArray(m.suplentes) && m.suplentes.length ? `
            <div style="font-size:0.76rem; color:#475569; margin-bottom:0.9rem;">
                <b>🔄 Banco de Suplentes:</b> ${m.suplentes.map(s => escMatchH(s.nombre)).join(" • ")}
            </div>
        ` : ""}

        <h4 style="margin:0 0 6px; font-size:0.88rem;">⏱️ Cronología Minuto a Minuto y Anotaciones del Profesor (${(m.eventos || []).length})</h4>
        <div class="table-wrap" style="margin-bottom:0.95rem;">
            <table class="app-table" style="font-size:0.79rem;">
                <thead><tr><th>Minuto</th><th>Jugador</th><th>Acción / Evento</th><th>Anotación del Profesor</th></tr></thead>
                <tbody>
                    ${(m.eventos || []).length === 0 ? `<tr><td colspan="4">Sin eventos cargados.</td></tr>` :
                    (m.eventos || []).map(ev => `<tr><td><b>${escMatchH(ev.minutoDisplay)}</b></td><td><b>${escMatchH(ev.jugadorNombre)}</b></td><td>${escMatchH(ev.tipo)}</td><td>${escMatchH(ev.detalle || "-")}</td></tr>`).join("")}
                </tbody>
            </table>
        </div>

        ${fotosResueltas.length || videos.length ? `
            <h4 style="margin:0 0 6px; font-size:0.88rem;">📸 Galería Multimedia del Partido (${fotosResueltas.length} foto(s), ${videos.length} video(s))</h4>
            ${fotosResueltas.length ? `
                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(175px, 1fr)); gap:0.6rem; margin-bottom:0.75rem;">
                    ${fotosResueltas.map(f => `
                        <div style="border:1px solid #cbd5e1; border-radius:10px; overflow:hidden; background:#fff;">
                            <img src="${f.dataUrl}" style="width:100%; height:120px; object-fit:cover; display:block; cursor:pointer;" onclick="window.open(this.src,'_blank')">
                            <div style="padding:4px 7px; font-size:0.72rem;"><b>${escMatchH(f.titulo)}</b></div>
                        </div>
                    `).join("")}
                </div>
            ` : ""}
            ${videos.length ? `
                <div style="display:flex; flex-direction:column; gap:0.35rem; margin-bottom:0.75rem;">
                    ${videos.map(v => `<div style="padding:0.45rem 0.7rem; background:#f8fafc; border:1px solid #cbd5e1; border-radius:9px; font-size:0.79rem; display:flex; justify-content:space-between; align-items:center;"><span>🎥 <b>${escMatchH(v.titulo)}</b> ${v.minuto ? `(${escMatchH(v.minuto)})` : ""}</span><a href="${escMatchH(v.url)}" target="_blank" class="btn btn-primary btn-sm" style="min-height:24px; font-size:0.72rem;">Ver Video ↗</a></div>`).join("")}
                </div>
            ` : ""}
        ` : `<div style="font-size:0.78rem; color:var(--ink-500); margin-bottom:0.75rem;">📸 Todavía no adjuntaste fotos o videos a este partido.</div>`}
    `;

    window.__ultimoInformePartidoHTML = construirHTMLInforme();

    modal.innerHTML = `
        <div class="modal-window" style="max-width:880px;">
            <div class="modal-top">
                <h3>📋 Informe Partido a Partido</h3>
                <div style="display:flex; gap:0.38rem; flex-wrap:wrap;">
                    <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarInformePartidoWhatsApp(${m.id})">📲 Enviar WA</button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('modalInformePartidoCDM').classList.add('hidden'); abrirModalMediaDesdeCancha(${m.id});">📸 Fotos/Videos</button>
                    <button type="button" class="btn btn-primary btn-sm" onclick="imprimirInformePartidoA4(window.__ultimoInformePartidoHTML)">🖨️ PDF A4</button>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('modalInformePartidoCDM').classList.add('hidden')">✕</button>
                </div>
            </div>

            <div style="background:var(--surface-subtle); border:1px solid var(--line-strong); border-radius:11px; padding:0.55rem 0.75rem; margin-bottom:0.85rem;">
                <label style="font-size:0.71rem; font-weight:800; display:block; margin-bottom:3px;">🗣️ Análisis / Conclusión General del Profesor (editable):</label>
                <div style="display:flex; gap:0.4rem;">
                    <input type="text" id="inpEditNotaGenMatch" value="${escMatchH(m.notaGeneralDT || "")}" placeholder="Escribí una conclusión táctica o general de este partido..." style="flex:1;">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="guardarNotaGeneralPartidoGuardado(${m.id}, document.getElementById('inpEditNotaGenMatch').value); abrirInformePartidoCompleto(${m.id});">💾 Guardar</button>
                </div>
            </div>

            <div id="contPreviewInformePartido">${window.__ultimoInformePartidoHTML}</div>
        </div>
    `;
    modal.classList.remove("hidden");
}

function aplicarPuntosPartidoAlRanking(idPartido) {
    const m = basePartidos.find(x => Number(x.id) === Number(idPartido));
    if (!m || m.puntosAplicadosAlRanking) return;
    (m.resumenJugadores || []).forEach(rj => {
        const p = basePersonas.find(x => Number(x.id) === Number(rj.id));
        if (p && p.deporte !== "Gimnasio" && rj.puntosSugeridos !== 0) {
            asegurarPilaresPersona(p);
            const ant = p.puntosCategoria;
            const delta = Math.max(-2, Math.min(2, Math.round(Number(rj.puntosSugeridos) * 10) / 10));
            p.pilares.bonus = normalizarBonus1a10((p.pilares.bonus || 0) + delta);
            recalcularPuntajePonderado(p);
            p.motivoPuntos = `Partido ${m.rival} (${delta >= 0 ? "+" : ""}${delta.toFixed(1)})`;
            registrarEventoScoreCDM(p, ant, p.puntosCategoria, `Partido ${m.rival}`, `Resultado ${m.resultado || "S/D"}`);
        }
    });
    m.puntosAplicadosAlRanking = true;
    guardarDatosCDM();
    mostrarToast("🏆 Valoración aplicada al Score.");
    renderizarPaginaDeporte();
}

// =========================================================================
// 7. MODAL DE FOTOS Y VIDEOS POST-PARTIDO Y EN VIVO (SUBIDA MÚLTIPLE)
// =========================================================================

async function abrirModalMediaDesdeCancha(partidoIdOpt = null) {
    const dep = deportePagina || "Futbol";
    const cat = categoriaActiva || "Sub 13";
    const partidos = basePartidos.filter(m => m.deporte === dep && m.categoria === cat).sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")));
    const esEnVivo = partidoIdOpt === "EN_VIVO";
    const partSel = (!esEnVivo && partidoIdOpt) ? partidos.find(m => Number(m.id) === Number(partidoIdOpt)) : (!esEnVivo ? (partidos[0] || null) : null);
    const valorSel = esEnVivo ? "EN_VIVO" : (partSel ? String(partSel.id) : "EN_VIVO");
    const plantel = obtenerPersonasFiltradasDeporte(true);

    const idsPre = new Set();
    if (partSel) {
        (partSel.eventos || []).forEach(e => { if (e.jugadorId) idsPre.add(Number(e.jugadorId)); });
        (partSel.resumenJugadores || []).forEach(r => { if (r.id) idsPre.add(Number(r.id)); });
    } else if (esEnVivo) {
        Object.values(obtenerMapaAlineacionActual()).forEach(id => { if (id) idsPre.add(Number(id)); });
    }
    const preArr = idsPre.size ? Array.from(idsPre) : plantel.map(p => Number(p.id));
    const media = obtenerMediaPartidosCDM().filter(it => String(it.partidoId) === valorSel);

    let modal = document.getElementById("modalMediaPartidoCDM");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "modalMediaPartidoCDM";
        modal.className = "modal-backdrop";
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-window" style="max-width:820px;">
            <div class="modal-top">
                <div>
                    <span class="badge badge-purple">📸 MULTIMEDIA DEL PARTIDO — ${dep} (${cat})</span>
                    <h3 style="margin-top:4px;">Fotos y Videos para el Informe Completo</h3>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('modalMediaPartidoCDM').classList.add('hidden')">✕</button>
            </div>

            <form onsubmit="guardarMediaDesdeCancha(event)" style="background:var(--surface-subtle); border:1.5px solid var(--line-strong); border-radius:14px; padding:0.85rem; margin-bottom:0.95rem;">
                <div class="grid-3" style="margin-bottom:0.6rem;">
                    <div class="field"><label>Destino (Partido)</label>
                        <select id="cmPartido" onchange="abrirModalMediaDesdeCancha(this.value)">
                            <option value="EN_VIVO" ${valorSel === "EN_VIVO" ? "selected" : ""}>🔴 Partido en Vivo (se vincula al cerrar)</option>
                            ${partidos.map(m => `<option value="${m.id}" ${valorSel === String(m.id) ? "selected" : ""}>📅 ${m.fecha} vs ${escMatchH(m.rival)} (${escMatchH(m.resultado)})</option>`).join("")}
                        </select>
                    </div>
                    <div class="field"><label>Título / Jugada *</label><input type="text" id="cmTitulo" required placeholder="Ej: Gol de tiro libre / Festejo"></div>
                    <div class="field"><label>Tipo</label>
                        <select id="cmTipo" onchange="document.getElementById('cmWF').classList.toggle('hidden', this.value!=='foto'); document.getElementById('cmWV').classList.toggle('hidden', this.value==='foto');">
                            <option value="foto">📸 Foto(s) — admite varias</option>
                            <option value="video">🎥 Link Video (YT / Drive / Reels)</option>
                        </select>
                    </div>
                </div>
                <div id="cmWF" class="field" style="margin-bottom:0.6rem;"><label>Seleccionar Foto(s) *</label><input type="file" id="cmArchivo" accept="image/*" multiple></div>
                <div id="cmWV" class="grid-2 hidden" style="margin-bottom:0.6rem;">
                    <div class="field"><label>URL Video *</label><input type="url" id="cmUrl" placeholder="https://youtu.be/... o link de Drive"></div>
                    <div class="field"><label>Minuto (opcional)</label><input type="text" id="cmMin" placeholder="Ej: 1T 25'"></div>
                </div>
                <div class="field" style="margin-bottom:0.7rem;">
                    <label>👥 Jugadores vinculados (se adjunta al Informe del Partido y a sus fichas):</label>
                    <div style="display:flex; gap:0.35rem; flex-wrap:wrap; max-height:90px; overflow-y:auto; padding:0.4rem; background:var(--surface-solid); border:1px solid var(--line); border-radius:10px;">
                        ${plantel.map(p => `<label style="display:inline-flex; align-items:center; gap:0.3rem; font-size:0.75rem; font-weight:700; padding:0.18rem 0.5rem; background:var(--surface-subtle); border-radius:99px; cursor:pointer;"><input type="checkbox" class="cm-tag-jug" value="${p.id}" ${preArr.includes(Number(p.id)) ? "checked" : ""} style="width:14px; height:14px; min-height:auto;"><span>${escMatchH(p.apellido)}</span></label>`).join("")}
                    </div>
                </div>
                <button type="submit" class="btn btn-primary btn-sm" style="width:100%;">💾 Guardar y Adjuntar al Informe</button>
            </form>

            <div class="cm36-media-grid">
                ${media.length === 0 ? `<div class="empty-box" style="grid-column:1/-1; padding:1rem;">Sin archivos cargados aún para este destino.</div>` :
                media.map(it => `
                    <div class="cm36-media-card">
                        ${it.tipo === "foto"
                            ? `<img data-cm-idb="${it.idbKey}" src="" alt="${escMatchH(it.titulo)}" onclick="window.open(this.src,'_blank')">`
                            : `<a href="${escMatchH(it.url)}" target="_blank" style="height:110px; background:#0f172a; color:#38bdf8; display:flex; align-items:center; justify-content:center; text-decoration:none; font-weight:800;">▶ Ver Video</a>`}
                        <div style="padding:0.38rem 0.5rem; font-size:0.72rem;">
                            <strong style="display:block;">${escMatchH(it.titulo)}</strong>
                            <small style="color:var(--ink-500);">${it.fecha} • ${(it.jugadoresIds || []).length} jug.</small>
                            <button type="button" class="btn btn-danger btn-sm" style="width:100%; margin-top:4px; min-height:22px; font-size:0.68rem;" onclick="eliminarMediaPartido(${it.id}, '${valorSel}')">🗑️ Quitar</button>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
    `;
    modal.classList.remove("hidden");
    modal.querySelectorAll("img[data-cm-idb]").forEach(async img => {
        const url = await leerFotoIDBPartidoCDM(img.dataset.cmIdb);
        if (url) img.src = url;
    });
}

async function guardarMediaDesdeCancha(e) {
    e.preventDefault();
    const partVal = document.getElementById("cmPartido")?.value || "EN_VIVO";
    const partidoId = partVal === "EN_VIVO" ? "EN_VIVO" : Number(partVal);
    const titulo = document.getElementById("cmTitulo").value.trim();
    const tipo = document.getElementById("cmTipo").value;
    const minuto = (document.getElementById("cmMin")?.value || "").trim();
    const jugadoresIds = Array.from(document.querySelectorAll(".cm-tag-jug:checked")).map(c => Number(c.value));
    const partObj = partidoId !== "EN_VIVO" ? basePartidos.find(m => Number(m.id) === Number(partidoId)) : null;

    const lista = obtenerMediaPartidosCDM();

    if (tipo === "foto") {
        const files = Array.from(document.getElementById("cmArchivo")?.files || []);
        if (!files.length) return alert("Elegí al menos una foto.");
        let guardadas = 0;
        for (let i = 0; i < files.length; i++) {
            const dataUrl = await comprimirFotoPartidoCDM(files[i]);
            if (!dataUrl) continue;
            const idMed = nuevoIdEventoEntero();
            const idbKey = `cm36_${idMed}`;
            await guardarFotoIDBPartidoCDM(idbKey, dataUrl);
            lista.unshift({
                id: idMed,
                fecha: partObj?.fecha || obtenerHoyISO(),
                partidoId,
                rival: partObj?.rival || "Partido en Vivo",
                titulo: files.length > 1 ? `${titulo} (${i + 1})` : titulo,
                minuto, tipo: "foto", idbKey, jugadoresIds
            });
            guardadas++;
        }
        if (!guardadas) return alert("No se pudo procesar ninguna imagen.");
        guardarMediaPartidosCDM(lista);
        mostrarToast(`📸 ${guardadas} foto(s) guardada(s) y vinculada(s).`);
    } else {
        const url = (document.getElementById("cmUrl")?.value || "").trim();
        if (!url) return alert("Pegá el link del video.");
        lista.unshift({
            id: nuevoIdEventoEntero(),
            fecha: partObj?.fecha || obtenerHoyISO(),
            partidoId,
            rival: partObj?.rival || "Partido en Vivo",
            titulo, minuto, tipo: "video", url, jugadoresIds
        });
        guardarMediaPartidosCDM(lista);
        mostrarToast("🎥 Video vinculado al informe del partido.");
    }

    renderizarCanchaInteractiva();
    renderizarHistorialPartidos();
    abrirModalMediaDesdeCancha(partVal);
}

async function eliminarMediaPartido(idMed, partVal) {
    if (!confirm("🗑️ ¿Quitar este archivo?")) return;
    const lista = obtenerMediaPartidosCDM();
    const target = lista.find(x => Number(x.id) === Number(idMed));
    if (target?.idbKey) await borrarFotoIDBPartidoCDM(target.idbKey);
    guardarMediaPartidosCDM(lista.filter(x => Number(x.id) !== Number(idMed)));
    renderizarCanchaInteractiva();
    renderizarHistorialPartidos();
    abrirModalMediaDesdeCancha(partVal || "EN_VIVO");
}

// =========================================================================
// 8. MICROCICLO SEMANAL Y LISTA DE BUENA FE
// =========================================================================

const DIAS_MICROCICLO = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado (Partido)"];

function obtenerMicrocicloActual() {
    const clave = `${deportePagina}_${categoriaActiva}`;
    if (!baseMicrociclos[clave]) {
        baseMicrociclos[clave] = {
            "Lunes": { foco: "Regenerativo / Movilidad", carga: "Baja (RPE 3-4)", detalle: "Elongación y activación" },
            "Martes": { foco: "Físico + Circuito Técnico", carga: "Alta (RPE 8)", detalle: "Fuerza preventiva + Reducido" },
            "Miércoles": { foco: "Táctico Colectivo", carga: "Media-Alta (RPE 7)", detalle: "Salidas, presión y transiciones" },
            "Jueves": { foco: "Práctica Formal", carga: "Alta (RPE 8)", detalle: "Bloques formales" },
            "Viernes": { foco: "Pelota Parada / Velocidad", carga: "Baja-Media (RPE 5)", detalle: "Reacción y táctica fija" },
            "Sábado (Partido)": { foco: "Competencia Oficial", carga: "Máxima (RPE 9-10)", detalle: "Fecha oficial" }
        };
    }
    return baseMicrociclos[clave];
}

function renderizarMicrocicloDeporte() {
    const cont = document.getElementById("contenedorGrillaMicrociclo");
    if (!cont) return;
    const plan = obtenerMicrocicloActual();

    cont.innerHTML = DIAS_MICROCICLO.map(dia => {
        const d = plan[dia] || { foco: "", carga: "Media-Alta (RPE 7)", detalle: "" };
        return `
            <div class="micro-day-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong>📅 ${dia}</strong>
                    <span class="badge badge-celeste">${d.carga}</span>
                </div>
                <div class="field"><label>Foco</label><input type="text" value="${escMatchH(d.foco)}" onchange="guardarCambioMicrociclo('${dia}', 'foco', this.value)"></div>
                <div class="field"><label>Intensidad</label>
                    <select onchange="guardarCambioMicrociclo('${dia}', 'carga', this.value)">
                        <option value="Baja (RPE 3-4)" ${d.carga.includes("3-4") ? "selected" : ""}>🟢 Baja</option>
                        <option value="Baja-Media (RPE 5)" ${d.carga.includes("5") ? "selected" : ""}>🔵 Baja-Media</option>
                        <option value="Media-Alta (RPE 7)" ${d.carga.includes("7") ? "selected" : ""}>🟡 Media-Alta</option>
                        <option value="Alta (RPE 8)" ${d.carga.includes("8") ? "selected" : ""}>🟠 Alta</option>
                        <option value="Máxima (RPE 9-10)" ${d.carga.includes("9-10") ? "selected" : ""}>🔴 Máxima</option>
                    </select>
                </div>
                <div class="field"><label>Tareas / Horario</label><input type="text" value="${escMatchH(d.detalle)}" onchange="guardarCambioMicrociclo('${dia}', 'detalle', this.value)"></div>
            </div>
        `;
    }).join("");

    const contLista = document.getElementById("contenedorListaBuenaFeDeporte");
    if (!contLista) return;
    const activos = obtenerPersonasFiltradasDeporte(true);
    if (!activos.length) { contLista.innerHTML = `<div class="empty-box">Sin jugadores activos en ${categoriaActiva}.</div>`; return; }

    contLista.innerHTML = `<div class="table-wrap"><table class="app-table"><thead><tr><th>#</th><th>Jugador/a</th><th>DNI</th><th>Edad / Año</th><th>Puesto</th><th>Score</th><th>Salud</th><th class="col-admin-control">Cuota</th><th>Estado</th></tr></thead><tbody>` +
        activos.map((p, i) => {
            const apto = !p.estadoMedico || p.estadoMedico === "Óptimo";
            const alDia = (p.pagoEstado || "Al Día") === "Al Día";
            return `
                <tr style="cursor:pointer;" onclick="irAPaginaIndividual(${p.id})">
                    <td><b>#${i + 1}</b></td>
                    <td><strong>${escMatchH(p.apellido)}, ${escMatchH(p.nombre)}</strong></td>
                    <td>${escMatchH(p.dni)}</td>
                    <td>${calcularEdadExacta(p)} años (${obtenerAnioNacimiento(p)})</td>
                    <td>${escMatchH(p.puesto)}</td>
                    <td><span class="badge badge-purple">⭐ ${p.puntosCategoria}/10</span></td>
                    <td><span class="badge ${apto ? "badge-ok" : "badge-danger"}">${escMatchH(p.estadoMedico || "Óptimo")}</span></td>
                    <td class="col-admin-control"><span class="badge ${alDia ? "badge-ok" : "badge-warn"}">${alDia ? "Al Día" : "Pendiente"}</span></td>
                    <td><span class="badge ${apto && alDia ? "badge-ok" : "badge-danger"}">${apto && alDia ? "✓ HABILITADO" : "⚠️ OBSERVADO"}</span></td>
                </tr>
            `;
        }).join("") + `</tbody></table></div>`;
}

function guardarCambioMicrociclo(dia, campo, valor) {
    const plan = obtenerMicrocicloActual();
    if (!plan[dia]) plan[dia] = { foco: "", carga: "Media-Alta (RPE 7)", detalle: "" };
    plan[dia][campo] = valor;
    guardarDatosCDM();
    renderizarMicrocicloDeporte();
    mostrarToast(`📅 ${dia} guardado.`);
}

function cargarMicrocicloModelo() {
    delete baseMicrociclos[`${deportePagina}_${categoriaActiva}`];
    obtenerMicrocicloActual();
    guardarDatosCDM();
    renderizarMicrocicloDeporte();
}

function enviarMicrocicloWhatsApp() {
    const plan = obtenerMicrocicloActual();
    const club = obtenerLicenciaConfigCDM().nombreEntidad.toUpperCase();
    let msg = `💙🤍 *PLAN SEMANAL — ${club}*\n🏆 ${deportePagina} (${categoriaActiva})\n----------------------------------\n\n`;
    DIAS_MICROCICLO.forEach(dia => {
        const d = plan[dia];
        msg += `*📅 ${dia.toUpperCase()}* [${d.carga}]\n• ${d.foco} — ${d.detalle}\n\n`;
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
}

// =========================================================================
// 9. RANKING OFICIAL (ESCALA 1 A 10 CON AUDITORÍA DE CAMBIOS)
// =========================================================================

function renderizarRankingDeporte() {
    const cont = document.getElementById("contenedorRankingDeporte");
    const sel = document.getElementById("selectJugadorRanking");
    if (!cont || !sel) return;

    const activos = obtenerPersonasFiltradasDeporte(true);
    activos.forEach(p => asegurarPilaresPersona(p));
    activos.sort((a, b) => (b.puntosCategoria || 0) - (a.puntosCategoria || 0));

    sel.innerHTML = activos.length
        ? activos.map(p => `<option value="${p.id}">${escMatchH(p.apellido)}, ${escMatchH(p.nombre)} (Score: ${p.puntosCategoria}/10)</option>`).join("")
        : `<option value="">-- Sin jugadores --</option>`;

    if (!activos.length) { cont.innerHTML = `<div class="empty-box">Sin jugadores activos en ${categoriaActiva}.</div>`; return; }

    cont.innerHTML = `<div class="table-wrap"><table class="app-table"><thead><tr><th>Pos</th><th>Deportista</th><th>Fís</th><th>Gym</th><th>Téc</th><th>Act</th><th>Bon</th><th>Score</th><th>Motivo</th><th class="col-admin-control">Control</th></tr></thead><tbody>` +
        activos.map((p, idx) => `
            <tr style="cursor:pointer;" onclick="irAPaginaIndividual(${p.id})">
                <td><strong>${idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : ""} #${idx + 1}°</strong></td>
                <td><strong>${escMatchH(p.apellido)}, ${escMatchH(p.nombre)}</strong><br><small style="color:var(--ink-500)">${escMatchH(p.puesto)}</small></td>
                <td><b>${p.pilares.fisico}</b></td>
                <td><b>${p.pilares.gym}</b></td>
                <td><b>${p.pilares.tecnico}</b></td>
                <td><b>${p.pilares.actitud}</b></td>
                <td><span class="badge ${p.pilares.bonus >= 0 ? "badge-celeste" : "badge-warn"}">${p.pilares.bonus >= 0 ? "+" : ""}${p.pilares.bonus}</span></td>
                <td><span class="badge badge-ok">⭐ ${p.puntosCategoria}/10</span></td>
                <td><small>${escMatchH(p.motivoPuntos || "-")}</small></td>
                <td class="col-admin-control" onclick="event.stopPropagation();">
                    <div style="display:flex; gap:0.25rem; flex-wrap:wrap; justify-content:flex-end;">
                        <button class="btn btn-secondary btn-sm" onclick="if(typeof abrirRadiografiaAdmin32==='function') abrirRadiografiaAdmin32(${p.id}, 'resumen'); else irAPaginaIndividual(${p.id});">🔍 Evaluar</button>
                        <button class="btn btn-ghost btn-sm" onclick="sumarPuntoRapido(${p.id}, 0.5)">+0.5</button>
                        <button class="btn btn-ghost btn-sm" onclick="sumarPuntoRapido(${p.id}, -0.5)">-0.5</button>
                        <button class="btn btn-ghost btn-sm" onclick="calificarJugadorRapidoPrompt(${p.id})">✏️</button>
                    </div>
                </td>
            </tr>
        `).join("") + `</tbody></table></div>`;
}

function guardarPuntosRankingDeporte(e) {
    e.preventDefault();
    const p = basePersonas.find(x => Number(x.id) === parseInt(document.getElementById("selectJugadorRanking").value, 10));
    if (!p || p.deporte === "Gimnasio") return;

    const pilar = document.getElementById("selectPilarRanking")?.value || "general";
    const modo = document.getElementById("selectModoRanking")?.value || "fijar";
    const valor = parseFloat(document.getElementById("inputPuntosDelta").value);
    const mot = document.getElementById("inputPuntosMotivo").value.trim();
    if (isNaN(valor)) return;

    asegurarPilaresPersona(p);
    const ant = p.puntosCategoria;

    if (pilar === "general") {
        const n = modo === "fijar" ? normalizarNota1a10(valor, ant) : normalizarNota1a10(ant + valor, ant);
        p.pilares = { fisico: n, gym: n, tecnico: n, actitud: n, bonus: 0 };
    } else if (pilar === "bonus") {
        p.pilares.bonus = modo === "fijar" ? normalizarBonus1a10(valor) : normalizarBonus1a10((p.pilares.bonus || 0) + valor);
    } else if (p.pilares[pilar] !== undefined) {
        p.pilares[pilar] = normalizarNota1a10(modo === "fijar" ? valor : p.pilares[pilar] + valor, p.pilares[pilar]);
    }

    recalcularPuntajePonderado(p);
    p.motivoPuntos = `${pilar.toUpperCase()}: ${mot}`;
    registrarEventoScoreCDM(p, ant, p.puntosCategoria, `Pilar ${pilar.toUpperCase()}`, mot);
    guardarDatosCDM();
    e.target.reset();
    mostrarToast(`🏆 Score actualizado: ${p.apellido} (${p.puntosCategoria}/10)`);
    renderizarPaginaDeporte();
}

function sumarPuntoRapido(id, delta) {
    const p = basePersonas.find(x => Number(x.id) === Number(id));
    if (!p || p.deporte === "Gimnasio") return;
    asegurarPilaresPersona(p);
    const ant = p.puntosCategoria;
    const nuevo = normalizarNota1a10(ant + delta, ant);
    p.pilares.bonus = normalizarBonus1a10((p.pilares.bonus || 0) + (nuevo - ant));
    recalcularPuntajePonderado(p);
    p.motivoPuntos = delta > 0 ? `Suba rápida (+${delta})` : `Baja rápida (${delta})`;
    registrarEventoScoreCDM(p, ant, p.puntosCategoria, "Ajuste Rápido", p.motivoPuntos);
    guardarDatosCDM();
    mostrarToast(`⭐ ${p.apellido}: ${p.puntosCategoria}/10`);
    renderizarPaginaDeporte();
}

function calificarJugadorRapidoPrompt(id) {
    const p = basePersonas.find(x => Number(x.id) === Number(id));
    if (!p || p.deporte === "Gimnasio") return;
    asegurarPilaresPersona(p);
    const entrada = prompt(`👑 Score Oficial (1 a 10) para ${p.nombre} ${p.apellido}:`, p.puntosCategoria);
    if (entrada === null) return;
    const nota = parseFloat(entrada.replace(",", "."));
    if (isNaN(nota) || nota < 1 || nota > 10) return alert("Ingresá un valor entre 1.0 y 10.0.");

    const mot = prompt("Motivo (opcional):", "Evaluación directa del Profe") || "Evaluación directa del Profe";
    const ant = p.puntosCategoria;
    const n = Math.round(nota * 10) / 10;
    p.pilares = { fisico: n, gym: n, tecnico: n, actitud: n, bonus: 0 };
    recalcularPuntajePonderado(p);
    p.motivoPuntos = mot;
    registrarEventoScoreCDM(p, ant, p.puntosCategoria, "Nota Directa", mot);
    guardarDatosCDM();
    mostrarToast(`⭐ Score fijado en ${p.puntosCategoria}/10`);
    if (document.body.dataset.page === "perfil-individual" && typeof inicializarPaginaJugadorIndividual === "function") inicializarPaginaJugadorIndividual();
    else renderizarPaginaDeporte();
}