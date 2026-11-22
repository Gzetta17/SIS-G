/**
 * js/jugador-ficha.js — Expediente Individual Coach-First (jugador.html)
 * Arquitectura plana (sin sub-pestañas anidadas), interruptor de Gimnasio siempre visible,
 * lectura clara en celular/PC e Informe PDF A4 Concreto (Individual y Categoría).
 * CDM Pro Suite — Desarrollado por Gonzalo Adanchú
 */

// =========================================================================
// 1. ESTILOS LIMPIOS, PLANOS Y 100% RESPONSIVE + MOTOR DE IMPRESIÓN A4
// =========================================================================

(function inyectarCSSJugadorFicha() {
    document.getElementById("cdmCssJugadorFichaUnif")?.remove();
    const st = document.createElement("style");
    st.id = "cdmCssJugadorFichaUnif";
    st.textContent = `
        /* Ocultar botones inyectados por fuera y reloj flotante en ficha Admin */
        body.ficha-admin-bento #adminBoxCodigoFicha,
        body.ficha-admin-bento #chipsEjerciciosActivosJugador,
        body.ficha-admin-bento #btnGuardarEjercicioNuevoLista,
        body.ficha-admin-bento #btnProAnaLesionesCab,
        body.ficha-admin-bento #btnConfigPortalPersonaCab,
        body.ficha-admin-bento #cdmFloatingDropletClock { display: none !important; }

        /* Cabecera limpia */
        .jf-head-row { display: flex; justify-content: space-between; align-items: center; gap: 0.85rem; flex-wrap: wrap; }
        .jf-head-id { display: flex; align-items: center; gap: 0.85rem; min-width: 0; }
        .jf-head-name { font-size: 1.28rem; font-weight: 900; margin: 0; line-height: 1.18; }
        .jf-head-sub { font-size: 0.79rem; opacity: 0.9; display: block; margin-top: 2px; }
        .jf-head-chips { display: flex; gap: 0.35rem; flex-wrap: wrap; margin-top: 0.42rem; }
        .jf-head-actions { display: flex; gap: 0.42rem; align-items: center; flex-wrap: nowrap; }

        /* Barra visible de control rápido (Switch Gimnasio + Cambiar Jugador + Portal) */
        .jf-control-strip {
            display: flex; justify-content: space-between; align-items: center; gap: 0.65rem; flex-wrap: wrap;
            background: var(--surface-solid, #ffffff); border: 1.5px solid var(--line-strong, #cbd5e1);
            border-radius: 14px; padding: 0.55rem 0.85rem; margin-bottom: 0.8rem;
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        }
        .jf-switch-pill {
            display: inline-flex; align-items: center; gap: 0.5rem;
            font-size: 0.8rem; font-weight: 800; color: var(--ink-900, #0f172a);
            cursor: pointer; user-select: none;
        }
        .jf-switch-pill input[type="checkbox"] {
            width: 18px; height: 18px; min-height: auto !important;
            accent-color: #0284c7; cursor: pointer;
        }
        .jf-control-right { display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap; }
        .jf-control-right select { width: auto; min-height: 34px; padding: 0.2rem 0.6rem; font-size: 0.78rem; font-weight: 700; }

        /* Barra única de pestañas planas (1 sola fila deslizable en móvil) */
        body.ficha-admin-bento .module-tabs.jf-flat-tabs {
            display: flex !important; gap: 0.4rem !important; overflow-x: auto !important;
            -webkit-overflow-scrolling: touch; padding: 0.4rem !important;
            margin-bottom: 0.9rem !important; scrollbar-width: none;
        }
        body.ficha-admin-bento .module-tabs.jf-flat-tabs::-webkit-scrollbar { display: none; }
        body.ficha-admin-bento .module-tabs.jf-flat-tabs .mod-tab {
            flex: 1 0 auto !important; white-space: nowrap !important;
            padding: 0.58rem 0.85rem !important; font-size: 0.81rem !important;
            justify-content: center !important;
        }

        /* Secciones y Tarjetas limpias */
        .jf-stack { display: flex; flex-direction: column; gap: 0.9rem; }
        .jf-kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.7rem; }
        .jf-kpi-grid.cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .jf-kpi {
            background: var(--surface-solid, #ffffff); border: 1.5px solid var(--line-strong, #cbd5e1);
            border-top: 4px solid #0284c7; border-radius: 15px; padding: 0.78rem 0.9rem;
            display: flex; flex-direction: column; gap: 0.22rem;
        }
        .jf-kpi.c-purple { border-top-color: #6366f1; }
        .jf-kpi.c-green { border-top-color: #10b981; }
        .jf-kpi.c-amber { border-top-color: #f59e0b; }
        .jf-kpi-lbl { font-size: 0.67rem; font-weight: 800; text-transform: uppercase; color: var(--ink-500, #64748b); }
        .jf-kpi-val { font-size: 1.35rem; font-weight: 900; color: var(--ink-900, #0f172a); line-height: 1.15; }
        .jf-kpi-sub { font-size: 0.73rem; color: var(--ink-600, #475569); }

        .jf-grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.9rem; align-items: start; }
        .jf-card {
            background: var(--surface-solid, #ffffff); border: 1.5px solid var(--line-strong, #cbd5e1);
            border-radius: 16px; padding: 1rem 1.1rem; min-width: 0;
        }
        .jf-card-head {
            display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap;
            margin-bottom: 0.8rem; padding-bottom: 0.55rem; border-bottom: 1px solid var(--line, #e2e8f0);
        }
        .jf-card-head h3 { margin: 0; font-size: 0.95rem; font-weight: 800; color: var(--ink-900, #0f172a); }

        /* Barras horizontales claras de los 4 Pilares */
        .jf-pilar-row { margin-bottom: 0.6rem; }
        .jf-pilar-top { display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; margin-bottom: 4px; }
        .jf-bar-bg { height: 9px; background: var(--line, #e2e8f0); border-radius: 99px; overflow: hidden; }
        .jf-bar-fill { height: 100%; border-radius: 99px; transition: width 0.3s ease; }

        .jf-diag-box { display: flex; flex-direction: column; gap: 0.38rem; margin-top: 0.75rem; font-size: 0.8rem; }
        .jf-diag-ok { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 0.48rem 0.7rem; }
        .jf-diag-warn { background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.38); border-radius: 10px; padding: 0.48rem 0.7rem; }

        /* Comparativa mensual simple */
        .jf-mes-bar { display: grid; grid-template-columns: 1fr auto 1fr; gap: 0.45rem; align-items: center; margin-bottom: 0.75rem; }
        .jf-mes-vs { background: #0284c7; color: #fff; font-size: 0.68rem; font-weight: 900; padding: 0.22rem 0.5rem; border-radius: 999px; text-align: center; }
        .jf-mes-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.55rem; }
        .jf-mes-tile { background: var(--surface-subtle, #f8fafc); border: 1px solid var(--line, #e2e8f0); border-radius: 11px; padding: 0.6rem 0.72rem; }
        .jf-mes-tile small { display: block; font-size: 0.65rem; font-weight: 800; color: var(--ink-500, #64748b); text-transform: uppercase; }
        .jf-mes-tile strong { display: block; font-size: 0.88rem; margin: 2px 0; color: var(--ink-900, #0f172a); }

        /* Chips ejercicios + stats */
        .jf-chips-row { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
        .jf-chip-btn {
            border: 1.5px solid var(--line-strong, #cbd5e1); background: var(--surface-subtle, #f8fafc);
            color: var(--ink-800, #1e293b); border-radius: 10px; padding: 0.38rem 0.68rem;
            font-size: 0.75rem; font-weight: 700; cursor: pointer;
        }
        .jf-chip-btn.active { background: #0284c7; border-color: #0284c7; color: #ffffff; }

        .jf-match-card {
            background: var(--surface-subtle, #f8fafc); border: 1px solid var(--line, #e2e8f0);
            border-left: 4px solid #10b981; border-radius: 12px; padding: 0.68rem 0.85rem; font-size: 0.81rem;
        }
        .jf-att-summary { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 0.4rem; margin-bottom: 0.75rem; text-align: center; }
        .jf-att-box { background: var(--surface-subtle, #f8fafc); border: 1px solid var(--line, #e2e8f0); border-radius: 10px; padding: 0.45rem 0.3rem; }
        .jf-att-box strong { display: block; font-size: 1rem; font-weight: 900; }
        .jf-att-box small { font-size: 0.63rem; font-weight: 700; color: var(--ink-500, #64748b); }

        /* Sliders evaluación */
        .eval33-score-hero { display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #0c192c 0%, #0369a1 100%); color: #fff; border-radius: 14px; padding: 0.85rem 1rem; margin-bottom: 0.75rem; }
        .eval33-score-num { font-size: 1.9rem; font-weight: 900; color: #38bdf8; line-height: 1; }
        .eval33-slider-box { background: var(--surface-subtle, #f8fafc); border: 1px solid var(--line-strong, #cbd5e1); border-radius: 11px; padding: 0.5rem 0.75rem; margin-bottom: 0.48rem; }
        .eval33-slider-head { display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 2px; }
        .eval33-range { width: 100%; min-height: 20px !important; accent-color: #0284c7; }

        /* 1RM, H2H y Media */
        .rm-zone-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(125px, 1fr)); gap: 0.55rem; margin-top: 0.75rem; }
        .rm-zone-card { background: var(--cdm-50, #f0f9ff); border: 1px solid var(--line-celeste, #bae6fd); border-radius: 11px; padding: 0.65rem; text-align: center; }
        .rm-zone-card strong { font-size: 1.15rem; font-weight: 900; display: block; margin: 2px 0; }
        .h2h-row { display: grid; grid-template-columns: 1fr 95px 1fr; align-items: center; gap: 0.5rem; padding: 0.48rem 0.65rem; border-bottom: 1px solid var(--line, #e2e8f0); font-size: 0.8rem; }
        .h2h-label { text-align: center; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: var(--ink-500); background: var(--surface-subtle); padding: 0.2rem 0.3rem; border-radius: 7px; }
        .cm36-media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.55rem; }
        .cm36-media-card { background: var(--surface-subtle, #f8fafc); border: 1px solid var(--line-strong, #cbd5e1); border-radius: 11px; overflow: hidden; }
        .cm36-media-card img { width: 100%; height: 96px; object-fit: cover; display: block; cursor: pointer; }

        /* HOJA DE INFORME PDF A4 LIMPIA Y BLINDADA */
        .jf-pdf-sheet {
            background: #ffffff !important; color: #0f172a !important;
            border: 1px solid #cbd5e1; border-radius: 12px; padding: 1.45rem;
            font-family: 'Poppins', Arial, sans-serif; line-height: 1.4;
        }
        .jf-pdf-sheet table { width: 100%; border-collapse: collapse; font-size: 0.77rem; margin-bottom: 0.85rem; }
        .jf-pdf-sheet th, .jf-pdf-sheet td { border: 1px solid #cbd5e1; padding: 0.4rem 0.5rem; text-align: left; color: #0f172a; }
        .jf-pdf-sheet th { background: #f1f5f9; font-weight: 800; }
        .jf-pdf-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.55rem; margin-bottom: 0.9rem; }
        .jf-pdf-kpi { background: #f8fafc; border: 1px solid #cbd5e1; border-top: 3px solid #0284c7; border-radius: 8px; padding: 0.55rem 0.65rem; }
        .jf-pdf-kpi small { display: block; font-size: 0.64rem; font-weight: 800; color: #64748b; text-transform: uppercase; }
        .jf-pdf-kpi strong { display: block; font-size: 1.05rem; font-weight: 900; color: #0f172a; margin-top: 2px; }
        .jf-pdf-bar-wrap { height: 7px; background: #e2e8f0; border-radius: 99px; overflow: hidden; margin-top: 3px; }
        .jf-pdf-bar-fill { height: 100%; background: #0284c7; }

        #cdmPrintZoneA4 { display: none; }
        @media print {
            @page { size: A4; margin: 12mm; }
            body.cdm-printing-a4 { background: #ffffff !important; padding: 0 !important; margin: 0 !important; }
            body.cdm-printing-a4 > *:not(#cdmPrintZoneA4) { display: none !important; }
            body.cdm-printing-a4 #cdmPrintZoneA4 { display: block !important; width: 100% !important; background: #ffffff !important; }
            body.cdm-printing-a4 #cdmPrintZoneA4 .jf-pdf-sheet { border: none !important; padding: 0 !important; border-radius: 0 !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }

        @media (max-width: 960px) {
            .jf-kpi-grid, .jf-kpi-grid.cols-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.55rem; }
            .jf-grid-2 { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
            .jf-head-name { font-size: 1.14rem; }
            .jf-head-actions { width: 100%; }
            .jf-head-actions > button { flex: 1; justify-content: center; padding: 0.45rem 0.35rem !important; font-size: 0.77rem !important; }
            .jf-control-strip { padding: 0.5rem 0.7rem; }
            .jf-control-right { width: 100%; justify-content: space-between; }
            .jf-control-right select { flex: 1; }
            .jf-kpi-val { font-size: 1.18rem; }
            .jf-att-summary { grid-template-columns: repeat(3, 1fr); }
            .jf-pdf-kpis { grid-template-columns: repeat(2, 1fr); }
        }
    `;
    document.head.appendChild(st);
})();

// =========================================================================
// 2. MOTOR UNIVERSAL DE IMPRESIÓN PDF A4 (CERO CORTES, CERO MODO OSCURO)
// =========================================================================

window.imprimirDocumentoA4Limpio = function (htmlInternoSheet) {
    let zone = document.getElementById("cdmPrintZoneA4");
    if (!zone) {
        zone = document.createElement("div");
        zone.id = "cdmPrintZoneA4";
        document.body.appendChild(zone);
    }
    zone.innerHTML = `<div class="jf-pdf-sheet">${htmlInternoSheet}</div>`;
    document.body.classList.add("cdm-printing-a4");

    const limpiar = () => {
        document.body.classList.remove("cdm-printing-a4");
        zone.innerHTML = "";
        window.removeEventListener("afterprint", limpiar);
    };
    window.addEventListener("afterprint", limpiar);
    setTimeout(() => window.print(), 60);
    setTimeout(limpiar, 2500);
};

// =========================================================================
// 3. HELPERS, PREFERENCIA DE GIMNASIO Y MULTIMEDIA
// =========================================================================

function obtenerJugadorActualPorURL() {
    const id = parseInt(new URLSearchParams(window.location.search).get("id"), 10);
    return (basePersonas || []).find(x => Number(x.id) === id) || null;
}

function esAdminEnFichaJugador() {
    if (document.body?.dataset.page !== "perfil-individual") return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get("modo") === "paciente" || params.get("pac")) return false;
    if (document.body.getAttribute("data-rol") === "usuario") return false;
    if (document.body.getAttribute("data-modo-portal") === "paciente") return false;
    return true;
}

function obtenerMediaJugadorFicha(idPersona) {
    try {
        const lista = JSON.parse(localStorage.getItem(`cdm_partido_media_v36_${obtenerClaveClubActivoCDM()}`) || "[]") || [];
        return lista.filter(m => (m.jugadoresIds || []).includes(Number(idPersona)));
    } catch { return []; }
}

async function leerFotoPartidoIDBFicha(key) {
    if (typeof leerFotoIDBPartidoCDM === "function") return leerFotoIDBPartidoCDM(key);
    try {
        if (!window.indexedDB) return null;
        const db = await new Promise((res, rej) => {
            const req = indexedDB.open("cdm_partidos_media_idb_v36", 1);
            req.onupgradeneeded = e => { if (!e.target.result.objectStoreNames.contains("fotos")) e.target.result.createObjectStore("fotos", { keyPath: "key" }); };
            req.onsuccess = e => res(e.target.result);
            req.onerror = e => rej(e.target.error);
        });
        return await new Promise(res => {
            const r = db.transaction("fotos", "readonly").objectStore("fotos").get(key);
            r.onsuccess = () => res(r.result?.dataUrl || null);
            r.onerror = () => res(null);
        });
    } catch { return null; }
}

function claveEjerciciosHabFicha(deporte) {
    return `cdm_hab_ejercicios_v36_${obtenerClaveClubActivoCDM()}_${String(deporte || "Futbol").toLowerCase()}`;
}

function ejerciciosHabilitadosEnFicha(p) {
    if (!p) return false;
    if (p.deporte === "Gimnasio") return true;
    return localStorage.getItem(claveEjerciciosHabFicha(p.deporte)) === "1";
}

window.toggleHabilitarEjerciciosFicha = function (deporte, habilitado) {
    localStorage.setItem(claveEjerciciosHabFicha(deporte), habilitado ? "1" : "0");
    if (!habilitado && window._tabAdminFicha === "gym36") window._tabAdminFicha = "resumen36";
    inicializarPaginaJugadorIndividual();
    mostrarToast(habilitado ? "🏋️ Pestaña y progreso de Gimnasio ACTIVADOS." : "⚽ Gimnasio desactivado (enfocado en Campo, Salud y Partidos).");
};

function asegurarVaultFicha() {
    let v = document.getElementById("cdmFichaNativeVault");
    if (!v) { v = document.createElement("div"); v.id = "cdmFichaNativeVault"; v.style.display = "none"; document.body.appendChild(v); }
    return v;
}

function rescatarNodosNativosFicha() {
    const vault = asegurarVaultFicha();
    ["formNuevoAvance", "contenedorHistorialJugador", "contenedorClinicoJugador"].forEach(id => {
        const el = document.getElementById(id);
        if (el) vault.appendChild(el);
    });
}

function asegurarModalFicha() {
    let m = document.getElementById("modalFichaUnifCDM");
    if (!m) { m = document.createElement("div"); m.id = "modalFichaUnifCDM"; m.className = "modal-backdrop hidden"; document.body.appendChild(m); }
    return m;
}

window.cerrarModalFicha = function () {
    const m = document.getElementById("modalFichaUnifCDM");
    if (!m) return;
    const f1 = m.querySelector("#formNuevoAvance");
    if (f1) asegurarVaultFicha().appendChild(f1);
    m.classList.add("hidden");
};

// =========================================================================
// 4. ANÁLISIS 360° + RADIOGRAFÍA + ENVÍO POR WHATSAPP
// =========================================================================

function analizarJugador360Admin32(p) {
    asegurarPilaresPersona(p);
    if (typeof asegurarEstructuraProPersona === "function") asegurarEstructuraProPersona(p);

    const esGym = p.deporte === "Gimnasio";
    const pares = (basePersonas || []).filter(x => x && x.activo && x.deporte === p.deporte && (esGym || x.categoria === p.categoria));
    pares.forEach(x => asegurarPilaresPersona(x));

    let puestoRanking = null;
    if (!esGym) {
        const idx = [...pares].sort((a, b) => (b.puntosCategoria || 0) - (a.puntosCategoria || 0)).findIndex(x => Number(x.id) === Number(p.id));
        if (idx >= 0) puestoRanking = idx + 1;
    }

    const n = Math.max(1, pares.length);
    const promCat = esGym ? null : {
        fisico: Math.round((pares.reduce((a, x) => a + (x.pilares?.fisico || 7), 0) / n) * 10) / 10,
        gym: Math.round((pares.reduce((a, x) => a + (x.pilares?.gym || 7), 0) / n) * 10) / 10,
        tecnico: Math.round((pares.reduce((a, x) => a + (x.pilares?.tecnico || 7), 0) / n) * 10) / 10,
        actitud: Math.round((pares.reduce((a, x) => a + (x.pilares?.actitud || 7), 0) / n) * 10) / 10,
        score: Math.round((pares.reduce((a, x) => a + (x.puntosCategoria || 7), 0) / n) * 10) / 10
    };

    const partidosStats = { pj: 0, goles: 0, asistencias: 0, quites: 0, errores: 0, tarjetas: 0, detallePartidos: [] };
    (basePartidos || []).forEach(m => {
        const evs = (m.eventos || []).filter(e => Number(e.jugadorId) === Number(p.id));
        const resJ = (m.resumenJugadores || []).find(r => Number(r.id) === Number(p.id));
        if (evs.length || resJ) {
            partidosStats.pj++;
            evs.forEach(ev => {
                const t = String(ev.tipo || "").toLowerCase();
                if (t.includes("gol") || t.includes("try") || t.includes("triple") || t.includes("doble") || t.includes("punto") || t.includes("winner")) partidosStats.goles++;
                else if (t.includes("asistencia") || t.includes("armado")) partidosStats.asistencias++;
                else if (t.includes("quite") || t.includes("barrida") || t.includes("atajada") || t.includes("recuperaci") || t.includes("bloqueo")) partidosStats.quites++;
                else if (t.includes("pérdida") || t.includes("perdida") || t.includes("error")) partidosStats.errores++;
                else if (t.includes("tarjeta") || t.includes("exclusi")) partidosStats.tarjetas++;
            });
            partidosStats.detallePartidos.push({ partido: m, evs, resJ });
        }
    });

    const evals = Array.isArray(p.evaluaciones) ? [...p.evaluaciones] : [];
    const porEj = {};
    evals.forEach(ev => { if (!porEj[ev.ejercicio]) porEj[ev.ejercicio] = []; porEj[ev.ejercicio].push(ev); });
    const progresosGym = [];
    Object.entries(porEj).forEach(([nomEj, lista]) => {
        const ord = [...lista].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        if (ord.length >= 2) {
            const ini = ord[0].valor, fin = ord[ord.length - 1].valor, esT = ord[0].tipo === "tiempo_seg";
            const pct = ini > 0 ? (esT ? ((ini - fin) / ini) * 100 : ((fin - ini) / ini) * 100) : 0;
            progresosGym.push({ ejercicio: nomEj, ini, fin, unidad: ord[ord.length - 1].unidad, pct: Math.round(pct * 10) / 10 });
        }
    });

    const asist7d = contarAsistenciasUltimos7Dias(p), pactado = p.frecuenciaSemanal || 3;
    const pred = typeof calcularPredisposicionJusta === "function"
        ? calcularPredisposicionJusta(p, 30)
        : { pct: Math.min(100, Math.round((asist7d / pactado) * 100)), etiqueta: "Buena", cont: { presente: asist7d, tarde: 0, lesionado: 0, justificado: 0, ausente: 0 } };
    const clinicos = Array.isArray(p.clinico) ? [...p.clinico] : [];
    const ultClin = clinicos.length ? clinicos[clinicos.length - 1] : null;
    const habEj = ejerciciosHabilitadosEnFicha(p);

    const fortalezas = [], mejoras = [];
    if (!esGym && p.pilares) {
        const lp = [
            { nom: "Condición Física", val: p.pilares.fisico, prom: promCat.fisico, tip: "reforzar ritmo y velocidad" },
            { nom: "Fuerza / Potencia", val: p.pilares.gym, prom: promCat.gym, tip: "mejorar estabilidad y fuerza" },
            { nom: "Técnico / Táctico", val: p.pilares.tecnico, prom: promCat.tecnico, tip: "pulir controles y decisiones en juego" },
            { nom: "Actitud y Compromiso", val: p.pilares.actitud, prom: promCat.actitud, tip: "sostener puntualidad e intensidad" }
        ].sort((a, b) => b.val - a.val);
        lp.forEach(pl => { if (pl.val >= 8.0 || pl.val >= pl.prom + 0.5) fortalezas.push(`Destaca en ${pl.nom} (${pl.val}/10 vs prom. ${pl.prom}).`); });
        const deb = lp[lp.length - 1];
        if (deb.val < 8.2 || deb.val < deb.prom) mejoras.push(`Trabajar ${deb.nom} (${deb.val}/10): ${deb.tip}.`);
    }
    if (pred.pct >= 80) fortalezas.push(`Muy buena predisposición en los últimos 30 días (${pred.pct}%).`);
    else mejoras.push(`Subir regularidad en entrenamientos (predisposición actual: ${pred.pct}%).`);

    if (partidosStats.goles > 0 || partidosStats.asistencias > 0 || partidosStats.quites > 0) {
        fortalezas.push(`Aporte en cancha (${partidosStats.pj} PJ): ${partidosStats.goles}G, ${partidosStats.asistencias}A y ${partidosStats.quites} quites.`);
    }
    if (habEj) progresosGym.forEach(pr => {
        if (pr.pct >= 5) fortalezas.push(`Mejora en ${pr.ejercicio}: +${pr.pct}%.`);
        else if (pr.pct < 0) mejoras.push(`Retroceso en ${pr.ejercicio} (${pr.pct}%): revisar técnica y recuperación.`);
    });
    if (p.estadoMedico && p.estadoMedico !== "Óptimo") mejoras.push(`Priorizar recuperación (${p.estadoMedico}) sin sobrecargas.`);
    if (!fortalezas.length) fortalezas.push("Mantiene base estable de trabajo; sostener el ritmo.");
    if (!mejoras.length) mejoras.push("Sostener el nivel actual y buscar superarse partido a partido.");

    const club = obtenerLicenciaConfigCDM().nombreEntidad.toUpperCase();
    let msgWA = `📋 *DEVOLUCIÓN DEL PROFESOR — ${club}*\n👤 *${p.nombre} ${p.apellido}* (${esGym ? "Gimnasio" : `${p.deporte} ${p.categoria}`})\n`;
    if (!esGym) msgWA += `⭐ *Score:* ${p.puntosCategoria}/10${puestoRanking ? ` (#${puestoRanking}° de ${pares.length})` : ""}\n`;
    msgWA += `📅 *Predisposición (30d):* ${pred.pct}% (${pred.etiqueta})\n----------------------------------\n✅ *FORTALEZAS:*\n` + fortalezas.slice(0, 3).map(f => `• ${f}`).join("\n");
    msgWA += `\n\n🎯 *EN QUÉ ENFOCARSE:*\n` + mejoras.slice(0, 3).map(m => `• ${m}`).join("\n") + `\n\n💪 _¡Seguí metiéndole!_`;

    return { esGym, pares, puestoRanking, promCat, partidosStats, evals, progresosGym, asist7d, pactado, pred, ultClin, fortalezas, mejoras, msgWA };
}

window.abrirRadiografiaAdmin32 = function (idPersona) {
    const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
    if (!p) return;
    const an = analizarJugador360Admin32(p);
    const modal = asegurarModalFicha();
    modal.innerHTML = `
        <div class="modal-window" style="max-width:640px;">
            <div class="modal-top">
                <div><span class="badge badge-ok">📲 DEVOLUCIÓN POR WHATSAPP</span><h3 style="margin-top:4px;">Mensaje para ${p.nombre} ${p.apellido}</h3></div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalFicha()">✕</button>
            </div>
            <textarea id="txtResumenMejoraWA32" rows="10" style="width:100%; font-family:inherit; font-size:0.83rem; margin-bottom:0.8rem;">${an.msgWA}</textarea>
            <div style="display:flex; justify-content:space-between; gap:0.5rem; flex-wrap:wrap;">
                <button type="button" class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('txtResumenMejoraWA32').value); mostrarToast('📋 Copiado.');">📋 Copiar</button>
                <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarDevolucionMejoraWA(${p.id})"><i class="ri-whatsapp-line"></i> Enviar por WhatsApp</button>
            </div>
        </div>
    `;
    modal.classList.remove("hidden");
};

window.enviarDevolucionMejoraWA = function (idPersona) {
    const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
    const txt = (document.getElementById("txtResumenMejoraWA32")?.value || "").trim();
    if (!p || !txt) return;
    if (!Array.isArray(p.devolucionesProfe)) p.devolucionesProfe = [];
    p.devolucionesProfe.unshift({ id: Date.now(), fecha: obtenerHoyISO(), scoreMomento: p.puntosCategoria, textoCompleto: txt });
    guardarDatosCDM();
    const tel = String(p.whatsapp || "").replace(/\D/g, "");
    window.open(tel ? `https://wa.me/${tel}?text=${encodeURIComponent(txt)}` : `https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank");
    cerrarModalFicha();
};

function enviarInformeEjecutivoJugadorWhatsApp() {
    const p = obtenerJugadorActualPorURL();
    if (p) abrirRadiografiaAdmin32(p.id);
}

// =========================================================================
// 5. EVALUACIÓN SCORE (1–10) + INFORMES PDF A4 (INDIVIDUAL Y CATEGORÍA)
// =========================================================================

window.sugerirScorePorDatosFicha = function (idPersona) {
    const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
    if (!p || p.deporte === "Gimnasio") return;
    const habEj = ejerciciosHabilitadosEnFicha(p), an = analizarJugador360Admin32(p);
    const clamp = v => Math.max(1, Math.min(10, Math.round(v * 10) / 10));
    const promProg = (habEj && an.progresosGym.length) ? an.progresosGym.reduce((a, x) => a + x.pct, 0) / an.progresosGym.length : 0;
    const ratioPred = an.pred.pct / 100;
    let fis = habEj ? (7.0 + Math.max(-1.5, Math.min(2.2, promProg / 10))) : (6.2 + ratioPred * 2.8);
    if (p.estadoMedico && p.estadoMedico !== "Óptimo") fis -= 1.0;
    fis = clamp(fis);
    const gym = habEj ? clamp(6.8 + Math.min(1.2, (p.evaluaciones?.length || 0) * 0.25)) : (p.pilares?.gym || fis);
    const st = an.partidosStats;
    const tec = clamp(7.4 + Math.max(-1.5, Math.min(2.2, (st.goles * 0.5) + (st.asistencias * 0.35) + (st.quites * 0.2) - (st.errores * 0.25))));
    const act = p.rubricaPredisposicion?.promedio ? clamp(p.rubricaPredisposicion.promedio) : clamp(5.8 + ratioPred * 3.8);
    [["m36Fis", fis], ["m36Gym", gym], ["m36Tec", tec], ["m36Act", act]].forEach(([id, v]) => { const el = document.getElementById(id); if (el) el.value = v; });
    actualizarPreviewScoreModalFicha();
    mostrarToast("🤖 Nota sugerida calculada con datos reales.");
};

window.actualizarPreviewScoreModalFicha = function () {
    const fis = parseFloat(document.getElementById("m36Fis")?.value) || 7;
    const gym = parseFloat(document.getElementById("m36Gym")?.value) || 7;
    const tec = parseFloat(document.getElementById("m36Tec")?.value) || 7;
    const act = parseFloat(document.getElementById("m36Act")?.value) || 7;
    const bon = parseFloat(document.getElementById("m36Bon")?.value) || 0;
    const tot = Math.min(10, Math.max(1, Math.round(((fis * 0.30) + (gym * 0.25) + (tec * 0.25) + (act * 0.20) + bon) * 10) / 10));
    [["m36ValFis", fis.toFixed(1)], ["m36ValGym", gym.toFixed(1)], ["m36ValTec", tec.toFixed(1)], ["m36ValAct", act.toFixed(1)], ["m36ValBon", `${bon >= 0 ? "+" : ""}${bon.toFixed(1)}`], ["m36TotalNum", tot.toFixed(1)]].forEach(([id, t]) => { const el = document.getElementById(id); if (el) el.textContent = t; });
};

window.guardarScoreModalFicha = function (e, idPersona) {
    e.preventDefault();
    const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
    if (!p) return;
    const ant = p.puntosCategoria;
    p.pilares = {
        fisico: normalizarNota1a10(document.getElementById("m36Fis")?.value, 7),
        gym: normalizarNota1a10(document.getElementById("m36Gym")?.value, 7),
        tecnico: normalizarNota1a10(document.getElementById("m36Tec")?.value, 7),
        actitud: normalizarNota1a10(document.getElementById("m36Act")?.value, 7),
        bonus: normalizarBonus1a10(document.getElementById("m36Bon")?.value)
    };
    recalcularPuntajePonderado(p);
    p.motivoPuntos = (document.getElementById("m36Mot")?.value || "").trim() || "Evaluación actualizada";
    if (typeof registrarEventoScore32 === "function") registrarEventoScore32(p, ant, p.puntosCategoria, "Evaluación 360°", p.motivoPuntos);
    if (typeof registrarSnapshotPersona === "function") registrarSnapshotPersona(p, "Evaluación Score");
    guardarDatosCDM();
    cerrarModalFicha();
    mostrarToast(`⭐ Score actualizado: ${p.puntosCategoria}/10`);
    inicializarPaginaJugadorIndividual();
};

window.abrirModalEvaluarScoreFicha = function (idPersona) {
    const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
    if (!p || p.deporte === "Gimnasio") return;
    const pil = p.pilares || { fisico: 7, gym: 7, tecnico: 7, actitud: 7, bonus: 0 };
    const modal = asegurarModalFicha();
    modal.innerHTML = `
        <div class="modal-window" style="max-width:520px;">
            <div class="modal-top"><div><span class="badge badge-purple">⭐ CALIFICACIÓN DEL PROFESOR</span><h3 style="margin-top:4px;">${p.nombre} ${p.apellido}</h3></div><button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalFicha()">✕</button></div>
            <div class="eval33-score-hero">
                <div><span class="badge badge-celeste" style="font-size:0.65rem;">SCORE GENERAL</span><div style="font-size:0.78rem; color:#e0f2fe; margin-top:3px;">${p.deporte} • ${p.categoria}</div></div>
                <div style="text-align:right;"><div id="m36TotalNum" class="eval33-score-num">${Number(p.puntosCategoria || 7).toFixed(1)}</div><small style="color:#94a3b8; font-size:0.68rem;">de 10.0</small></div>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" style="width:100%; margin-bottom:0.7rem;" onclick="sugerirScorePorDatosFicha(${p.id})">🤖 Sugerir nota según datos reales</button>
            <form onsubmit="guardarScoreModalFicha(event, ${p.id})">
                <div class="eval33-slider-box"><div class="eval33-slider-head"><span>🏃 <b>Físico</b> (30%)</span><b id="m36ValFis">${pil.fisico.toFixed(1)}</b></div><input type="range" id="m36Fis" class="eval33-range" min="1" max="10" step="0.1" value="${pil.fisico}" oninput="actualizarPreviewScoreModalFicha()"></div>
                <div class="eval33-slider-box"><div class="eval33-slider-head"><span>🏋️ <b>Fuerza / Gym</b> (25%)</span><b id="m36ValGym">${pil.gym.toFixed(1)}</b></div><input type="range" id="m36Gym" class="eval33-range" min="1" max="10" step="0.1" value="${pil.gym}" oninput="actualizarPreviewScoreModalFicha()"></div>
                <div class="eval33-slider-box"><div class="eval33-slider-head"><span>⚽ <b>Técnico / Táctico</b> (25%)</span><b id="m36ValTec">${pil.tecnico.toFixed(1)}</b></div><input type="range" id="m36Tec" class="eval33-range" min="1" max="10" step="0.1" value="${pil.tecnico}" oninput="actualizarPreviewScoreModalFicha()"></div>
                <div class="eval33-slider-box"><div class="eval33-slider-head"><span>🔥 <b>Actitud / Predisposición</b> (20%)</span><b id="m36ValAct">${pil.actitud.toFixed(1)}</b></div><input type="range" id="m36Act" class="eval33-range" min="1" max="10" step="0.1" value="${pil.actitud}" oninput="actualizarPreviewScoreModalFicha()"></div>
                <div class="eval33-slider-box" style="background:var(--cdm-50);"><div class="eval33-slider-head"><span>⭐ <b>Bonus / Ajuste</b></span><b id="m36ValBon">${pil.bonus >= 0 ? "+" : ""}${Number(pil.bonus || 0).toFixed(1)}</b></div><input type="range" id="m36Bon" class="eval33-range" min="-2" max="2" step="0.1" value="${pil.bonus || 0}" oninput="actualizarPreviewScoreModalFicha()"></div>
                <div class="field" style="margin-bottom:0.75rem;"><label>Motivo / Observación</label><input type="text" id="m36Mot" value="${(p.motivoPuntos || "").replace(/"/g, "&quot;")}" placeholder="Ej: Muy buen mes en entrenamientos"></div>
                <button type="submit" class="btn btn-primary" style="width:100%;">💾 Guardar Calificación</button>
            </form>
        </div>
    `;
    modal.classList.remove("hidden");
};

window.abrirModalCargarMarcaFicha = function (idPersona) {
    const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
    const formMarca = document.getElementById("formNuevoAvance");
    if (!p || !formMarca) return;
    const modal = asegurarModalFicha();
    modal.innerHTML = `<div class="modal-window" style="max-width:520px;"><div class="modal-top"><div><span class="badge badge-celeste">🏋️ CARGAR MARCA / TEST</span><h3 style="margin-top:4px;">${p.nombre} ${p.apellido}</h3></div><button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalFicha()">✕</button></div><div id="slotModalFormMarcaFicha"></div></div>`;
    document.getElementById("slotModalFormMarcaFicha")?.appendChild(formMarca);
    if (!formMarca.dataset.closeHookFicha) { formMarca.dataset.closeHookFicha = "1"; formMarca.addEventListener("submit", () => setTimeout(cerrarModalFicha, 50)); }
    modal.classList.remove("hidden");
};

// INFORME INDIVIDUAL CONCRETO A4 (IMPRIMIBLE / PDF) + ACCESO A INFORME DE CATEGORÍA
window.abrirInformeUnicoFicha = async function (idPersona) {
    const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
    if (!p) return;

    const habEj = ejerciciosHabilitadosEnFicha(p);
    const an = analizarJugador360Admin32(p);
    const lic = obtenerLicenciaConfigCDM();
    const pil = p.pilares || { fisico: 7, gym: 7, tecnico: 7, actitud: 7 };
    const lesiones = Array.isArray(p.lesionesHistorial) ? p.lesionesHistorial : [];
    const lesActivas = lesiones.filter(l => !l.fechaAlta);
    const conclusion = p.conclusionDT36 || `Fortaleza: ${an.fortalezas[0]} Objetivo próximo: ${an.mejoras[0]}`;
    const media = obtenerMediaJugadorFicha(p.id);
    const fotos = [];
    for (const it of media.filter(m => m.tipo === "foto").slice(0, 2)) {
        const s = await leerFotoPartidoIDBFicha(it.idbKey);
        if (s) fotos.push({ titulo: it.titulo, fecha: it.fecha, src: s });
    }

    const htmlHoja = `
        <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:2.5px solid #0284c7; padding-bottom:0.75rem; margin-bottom:0.95rem; gap:0.8rem; flex-wrap:wrap;">
            <div>
                <div style="font-size:0.68rem; font-weight:800; color:#0284c7; text-transform:uppercase; letter-spacing:0.05em;">INFORME INDIVIDUAL DE SEGUIMIENTO DEPORTIVO</div>
                <h2 style="margin:2px 0; font-size:1.38rem; font-weight:900; color:#0f172a;">${p.nombre} ${p.apellido}</h2>
                <div style="font-size:0.78rem; color:#475569; font-weight:600;">
                    ${lic.nombreEntidad} • ${p.deporte} (${p.deporte === "Gimnasio" ? "Socio Gym" : p.categoria}) • ${p.puesto || "-"} • DNI ${p.dni}
                </div>
            </div>
            <div style="text-align:right; font-size:0.77rem; color:#475569;">
                <div><b>Edad:</b> ${calcularEdadExacta(p)} años (Cat. ${obtenerAnioNacimiento(p)})</div>
                <div><b>Antropometría:</b> ${p.peso} kg / ${p.altura} cm${p.grasaPct != null ? ` • ${p.grasaPct}% grasa` : ""}</div>
                <div><b>Fecha:</b> ${new Date().toLocaleDateString("es-AR")}</div>
            </div>
        </div>

        <div class="jf-pdf-kpis">
            <div class="jf-pdf-kpi"><small>${an.esGym ? "Plan Activo" : "Score Oficial"}</small><strong>${an.esGym ? "Gimnasio" : `${p.puntosCategoria} / 10`}</strong></div>
            <div class="jf-pdf-kpi" style="border-top-color:#10b981;"><small>Predisposición 30d</small><strong>${an.pred.pct}% (${an.pred.etiqueta})</strong></div>
            <div class="jf-pdf-kpi" style="border-top-color:#f59e0b;"><small>Estado de Salud</small><strong>${lesActivas.length ? `${lesActivas.length} Lesión Activa` : (p.estadoMedico || "Óptimo")}</strong></div>
            <div class="jf-pdf-kpi" style="border-top-color:#6366f1;"><small>${an.esGym ? "Asistencias" : "Partidos"}</small><strong>${an.esGym ? `${(p.asistencias || []).length} totales` : `${an.partidosStats.pj} PJ (${an.partidosStats.goles}G / ${an.partidosStats.asistencias}A)`}</strong></div>
        </div>

        ${!an.esGym ? `
            <div style="margin-bottom:0.9rem;">
                <strong style="font-size:0.8rem; display:block; margin-bottom:0.4rem; color:#0f172a;">1. EVALUACIÓN POR PILARES (ESCALA 1 A 10)</strong>
                <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:0.55rem;">
                    ${[
                        { n: "Condición Física (30%)", v: pil.fisico, pr: an.promCat?.fisico },
                        { n: "Fuerza / Gimnasio (25%)", v: pil.gym, pr: an.promCat?.gym },
                        { n: "Técnico / Táctico (25%)", v: pil.tecnico, pr: an.promCat?.tecnico },
                        { n: "Actitud y Predisposición (20%)", v: pil.actitud, pr: an.promCat?.actitud }
                    ].map(r => `
                        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:0.45rem 0.6rem; font-size:0.76rem;">
                            <div style="display:flex; justify-content:space-between;"><b>${r.n}</b><b>${r.v} / 10 <span style="color:#64748b; font-weight:500;">(Prom: ${r.pr ?? "-"})</span></b></div>
                            <div class="jf-pdf-bar-wrap"><div class="jf-pdf-bar-fill" style="width:${r.v * 10}%;"></div></div>
                        </div>
                    `).join("")}
                </div>
            </div>
        ` : ""}

        <div style="margin-bottom:0.9rem;">
            <strong style="font-size:0.8rem; display:block; margin-bottom:0.35rem; color:#0f172a;">2. ANATOMÍA, LESIONES Y PREDISPOSICIÓN (ÚLTIMOS 30 DÍAS)</strong>
            <table>
                <thead><tr><th>Presentes</th><th>Tarde</th><th>Lesionado/Kine</th><th>Justificadas</th><th>Sin Aviso</th><th>Historial Lesiones</th></tr></thead>
                <tbody>
                    <tr>
                        <td><b>${an.pred.cont.presente}</b></td>
                        <td>${an.pred.cont.tarde}</td>
                        <td>${an.pred.cont.lesionado}</td>
                        <td>${an.pred.cont.justificado}</td>
                        <td>${an.pred.cont.ausente}</td>
                        <td>${lesiones.length ? lesiones.slice(0, 3).map(l => `${l.zona} (${l.lado}) — ${l.fechaAlta ? "Alta" : "Activa"}`).join("; ") : "Sin lesiones registradas"}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        ${!an.esGym && an.partidosStats.detallePartidos.length ? `
            <div style="margin-bottom:0.9rem;">
                <strong style="font-size:0.8rem; display:block; margin-bottom:0.35rem; color:#0f172a;">3. PARTIDOS RECIENTES</strong>
                <table>
                    <thead><tr><th>Fecha</th><th>Rival</th><th>Resultado</th><th>Acciones Registradas</th></tr></thead>
                    <tbody>
                        ${an.partidosStats.detallePartidos.slice(0, 5).map(dp => `
                            <tr>
                                <td>${dp.partido.fecha}</td>
                                <td><b>${dp.partido.rival}</b></td>
                                <td>${dp.partido.resultado || "-"}</td>
                                <td>${dp.evs.map(e => e.tipo).join(", ") || "Participación"}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        ` : ""}

        ${habEj && an.evals.length ? `
            <div style="margin-bottom:0.9rem;">
                <strong style="font-size:0.8rem; display:block; margin-bottom:0.35rem; color:#0f172a;">4. PROGRESIÓN FÍSICA Y TESTS DE GIMNASIO</strong>
                <table>
                    <thead><tr><th>Ejercicio / Test</th><th>Última Marca</th><th>Fecha</th><th>Nota</th></tr></thead>
                    <tbody>
                        ${[...an.evals].reverse().slice(0, 6).map(ev => `<tr><td><b>${ev.ejercicio}</b></td><td><b>${ev.detalle}</b></td><td>${ev.fecha}</td><td>${ev.nota || "-"}</td></tr>`).join("")}
                    </tbody>
                </table>
            </div>
        ` : ""}

        <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:10px; padding:0.75rem 0.9rem; margin-bottom:0.9rem; font-size:0.8rem;">
            <div><b>✅ Fortalezas:</b> ${an.fortalezas.slice(0, 3).join(" • ")}</div>
            <div style="margin-top:4px;"><b>🎯 Objetivos de Mejora:</b> ${an.mejoras.slice(0, 3).join(" • ")}</div>
            <div style="margin-top:6px; padding-top:6px; border-top:1px dashed #7dd3fc;"><b>✍️ Devolución del Profesor:</b> <span id="pdfConcLiveSpan">${conclusion}</span></div>
        </div>

        ${fotos.length ? `<div style="display:grid; grid-template-columns:repeat(2,1fr); gap:0.5rem; margin-bottom:0.9rem;">${fotos.map(f => `<div style="border:1px solid #cbd5e1; border-radius:8px; overflow:hidden;"><img src="${f.src}" style="width:100%; height:125px; object-fit:cover;"><div style="padding:0.25rem 0.45rem; font-size:0.7rem;"><b>${f.titulo}</b> (${f.fecha})</div></div>`).join("")}</div>` : ""}

        <div style="display:flex; justify-content:space-between; margin-top:1.3rem; padding-top:0.7rem; border-top:1px dashed #cbd5e1; font-size:0.75rem; color:#475569;">
            <span>_____________________________<br>Firma Profesor / Preparador Físico</span>
            <span style="text-align:right;">Documento generado por ${lic.nombreEntidad}<br>Base Oficial de Seguimiento</span>
        </div>
    `;

    const modal = asegurarModalFicha();
    modal.innerHTML = `
        <div class="modal-window" style="max-width:880px;">
            <div class="modal-top">
                <div>
                    <span class="badge badge-celeste">📄 INFORME CONCRETO A4</span>
                    <h3 style="margin-top:4px;">${p.apellido}, ${p.nombre}</h3>
                </div>
                <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                    ${typeof abrirBoletinPlantelPDF === "function" ? `<button type="button" class="btn btn-secondary btn-sm" onclick="cerrarModalFicha(); abrirBoletinPlantelPDF('${p.deporte}', '${p.categoria}');">📊 Informe Toda la Categoría</button>` : ""}
                    <button type="button" class="btn btn-primary btn-sm" onclick="imprimirInformeIndividualActual()">🖨️ Imprimir / Guardar PDF</button>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalFicha()">✕</button>
                </div>
            </div>

            <div style="background:var(--surface-subtle); border:1px solid var(--line-strong); border-radius:11px; padding:0.6rem 0.8rem; margin-bottom:0.8rem;">
                <label style="font-size:0.72rem; font-weight:800; display:block; margin-bottom:3px;">✍️ Editá la devolución antes de imprimir / guardar PDF:</label>
                <textarea rows="2" style="width:100%; font-size:0.82rem;" oninput="document.getElementById('pdfConcLiveSpan').innerText=this.value; const per=(basePersonas||[]).find(x=>x.id===${p.id}); if(per){per.conclusionDT36=this.value; guardarDatosCDM();}">${conclusion}</textarea>
            </div>

            <div id="jfPreviewHojaInd" class="jf-pdf-sheet">${htmlHoja}</div>
        </div>
    `;
    modal.classList.remove("hidden");
};

window.imprimirInformeIndividualActual = function () {
    const hoja = document.getElementById("jfPreviewHojaInd");
    if (hoja) imprimirDocumentoA4Limpio(hoja.innerHTML);
};

// =========================================================================
// 6. COMPARATIVA MENSUAL SIMPLE (ADENTRO DE RESUMEN)
// =========================================================================

const NOMBRES_MESES_FICHA = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
window.__compMesState = { personaId: null, mesA: "", mesB: "" };

function formatearMesCorto(ym) {
    if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return ym || "-";
    const [a, m] = ym.split("-");
    return `${NOMBRES_MESES_FICHA[Math.max(0, Math.min(11, parseInt(m, 10) - 1))]} ${a}`;
}

function restarMesesYM(ymBase, n) {
    const [a, m] = ymBase.split("-").map(Number);
    const d = new Date(a, (m - 1) - n, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function obtenerMesesPersona(p) {
    const conDatos = new Set();
    const add = f => { if (typeof f === "string" && /^\d{4}-\d{2}/.test(f)) conDatos.add(f.slice(0, 7)); };
    (p.asistencias || []).forEach(add); (p.evaluaciones || []).forEach(e => add(e.fecha));
    (p.clinico || []).forEach(c => add(c.fecha)); (p.historialScore || []).forEach(h => add(h.fecha));
    (p.snapshotsMensuales || []).forEach(s => add(s.fecha));
    const hoy = new Date(), actualYM = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
    const todos = new Set(conDatos);
    for (let i = 0; i < 12; i++) todos.add(restarMesesYM(actualYM, i));
    return { listaOrdenada: Array.from(todos).sort().reverse().map(ym => ({ ym, label: formatearMesCorto(ym) })), mesesConDatosDesc: Array.from(conDatos).sort().reverse(), actualYM };
}

function calcularMetricasMes(p, ym) {
    const pref = String(ym || "");
    const asist = (p.asistencias || []).filter(f => String(f || "").startsWith(pref)).length;
    const clin = (p.clinico || []).filter(c => String(c.fecha || "").startsWith(pref));
    const snap = (p.snapshotsMensuales || []).filter(s => String(s.fecha || "").startsWith(pref));
    const peso = snap.length ? snap[snap.length - 1].peso : (clin.length ? clin[clin.length - 1].peso : null);
    let score = snap.length ? snap[snap.length - 1].score : null;
    if (score === null && p.deporte !== "Gimnasio") {
        const h = (p.historialScore || []).filter(x => String(x.fecha || "").startsWith(pref));
        if (h.length) score = h[0].nuevo;
        else if (pref === new Date().toISOString().slice(0, 7)) score = p.puntosCategoria;
    }
    let pj = 0, goles = 0;
    (basePartidos || []).forEach(m => {
        if (!String(m.fecha || "").startsWith(pref)) return;
        const evs = (m.eventos || []).filter(e => Number(e.jugadorId) === Number(p.id));
        if (evs.length || (m.resumenJugadores || []).some(r => Number(r.id) === Number(p.id))) {
            pj++;
            evs.forEach(e => { if (String(e.tipo || "").toLowerCase().includes("gol")) goles++; });
        }
    });
    return { asist, peso, score, pj, goles };
}

window.cambiarMesesComparativa34 = function () {
    window.__compMesState.mesA = document.getElementById("selComp34MesA")?.value || "";
    window.__compMesState.mesB = document.getElementById("selComp34MesB")?.value || "";
    const p = obtenerJugadorActualPorURL();
    if (p) renderizarBloqueMesesResumen(p);
};

function renderizarBloqueMesesResumen(p) {
    const cont = document.getElementById("jfBloqueMesesResumen");
    if (!cont || !p) return;
    const { listaOrdenada, mesesConDatosDesc, actualYM } = obtenerMesesPersona(p);
    if (window.__compMesState.personaId !== p.id || !window.__compMesState.mesA) {
        const defB = mesesConDatosDesc[0] || actualYM;
        window.__compMesState = { personaId: p.id, mesA: mesesConDatosDesc[1] || restarMesesYM(defB, 1), mesB: defB };
    }
    const { mesA, mesB } = window.__compMesState;
    const mA = calcularMetricasMes(p, mesA), mB = calcularMetricasMes(p, mesB);
    const opt = (sel) => listaOrdenada.map(it => `<option value="${it.ym}" ${it.ym === sel ? "selected" : ""}>${it.label}</option>`).join("");

    cont.innerHTML = `
        <div class="jf-mes-bar">
            <select id="selComp34MesA" onchange="cambiarMesesComparativa34()">${opt(mesA)}</select>
            <span class="jf-mes-vs">VS</span>
            <select id="selComp34MesB" onchange="cambiarMesesComparativa34()">${opt(mesB)}</select>
        </div>
        <div class="jf-mes-grid">
            <div class="jf-mes-tile"><small>📅 Asistencias</small><strong>${mA.asist}d ➔ ${mB.asist}d</strong></div>
            ${p.deporte !== "Gimnasio" ? `<div class="jf-mes-tile"><small>⭐ Score</small><strong>${mA.score ?? "-"} ➔ ${mB.score ?? "-"}</strong></div>` : ""}
            <div class="jf-mes-tile"><small>⚖️ Peso</small><strong>${mA.peso ?? "-"} ➔ ${mB.peso ?? "-"} kg</strong></div>
            ${p.deporte !== "Gimnasio" ? `<div class="jf-mes-tile"><small>⚽ Partidos</small><strong>${mA.pj}PJ (${mA.goles}G) ➔ ${mB.pj}PJ (${mB.goles}G)</strong></div>` : ""}
        </div>
    `;
}

// =========================================================================
// 7. RENDERIZADO PLANO DE LAS 5 SOLAPAS ADMIN (SIN SUB-PESTAÑAS)
// =========================================================================

let _chartCurvaGym36 = null;
window._tabAdminFicha = "resumen36";
window._gymEjSel36 = "";

window.activarTabAdminFicha = function (clave) {
    window._tabAdminFicha = clave;
    document.querySelectorAll(".jug-seccion").forEach(s => { s.classList.add("hidden"); s.classList.remove("animate-in"); });
    const sec = document.getElementById(`jug-sec-${clave}`);
    if (sec) { sec.classList.remove("hidden"); sec.classList.add("animate-in"); }
    document.querySelectorAll(".module-tabs .mod-tab").forEach(b => b.classList.toggle("active", b.dataset.tabAdmin === clave));

    if (clave === "gym36") {
        const p = obtenerJugadorActualPorURL();
        if (p && window._gymEjSel36) setTimeout(() => dibujarCurvaGymTab(p, window._gymEjSel36), 30);
    }
};

function dibujarCurvaGymTab(p, nombreEj) {
    const cv = document.getElementById("canvasCurvaGymTab36");
    if (!cv || typeof Chart === "undefined") return;
    if (_chartCurvaGym36) { _chartCurvaGym36.destroy(); _chartCurvaGym36 = null; }
    const lista = (p.evaluaciones || []).filter(e => e.ejercicio === nombreEj).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    if (!lista.length) return;
    _chartCurvaGym36 = new Chart(cv.getContext("2d"), {
        type: "line",
        data: { labels: lista.map(e => e.fecha.slice(5)), datasets: [{ label: nombreEj, data: lista.map(e => Number(e.valor) || 0), borderColor: "#0284c7", backgroundColor: "rgba(2,132,199,0.14)", borderWidth: 2.5, fill: true, tension: 0.3 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

window.seleccionarEjTabGym = function (nom) {
    window._gymEjSel36 = nom;
    const p = obtenerJugadorActualPorURL();
    if (p) renderizarSolapaGimnasio(p);
};

function renderizarCabeceraYBarraControl(p) {
    const cont = document.getElementById("fichaCabeceraJugador");
    if (!cont || !p) return;

    const hoy = obtenerHoyISO(), pres = p.asistencias.includes(hoy);
    const esGym = p.deporte === "Gimnasio", habEj = ejerciciosHabilitadosEnFicha(p);
    const alDia = (p.pagoEstado || "Al Día") === "Al Día";
    const an = analizarJugador360Admin32(p);
    const comp = (basePersonas || []).filter(x => x && x.activo && x.deporte === p.deporte && (esGym || x.categoria === p.categoria));

    cont.innerHTML = `
        <div class="jf-head-row">
            <div class="jf-head-id">
                ${renderAvatarPersonaCDM(p, 54, "1.15rem", true)}
                <div style="min-width:0;">
                    <h2 class="jf-head-name">${p.nombre} ${p.apellido}</h2>
                    <span class="jf-head-sub">${esGym ? "🏋️ Gimnasio" : `${p.deporte} • ${p.categoria}`} • ${p.puesto} • ${calcularEdadExacta(p)} años • ${p.peso} kg / ${p.altura} cm</span>
                    <div class="jf-head-chips">
                        ${!esGym ? `<span class="badge badge-purple">⭐ ${p.puntosCategoria}/10</span>` : ""}
                        <span class="badge ${an.pred.pct >= 75 ? "badge-ok" : "badge-warn"}">📅 Predisp. ${an.pred.pct}%</span>
                        <span class="badge ${p.estadoMedico && p.estadoMedico !== "Óptimo" ? "badge-danger" : "badge-ok"}">${p.estadoMedico && p.estadoMedico !== "Óptimo" ? "🏥 " + p.estadoMedico : "🟢 Apto"}</span>
                    </div>
                </div>
            </div>

            <div class="jf-head-actions">
                <button type="button" class="btn ${pres ? "btn-ok" : "btn-primary"} btn-sm" onclick="toggleAsistenciaEnFicha(${p.id}, '${hoy}')">✓ Presente</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="abrirInformeUnicoFicha(${p.id})">📄 PDF</button>
                <button type="button" class="btn btn-whatsapp btn-sm" onclick="abrirRadiografiaAdmin32(${p.id})"><i class="ri-whatsapp-line"></i> WA</button>
                <div class="menu33-wrap">
                    <button type="button" class="btn btn-secondary btn-sm" style="min-width:36px; font-weight:900;" onclick="alternarMenu33('cab33DropMenu', event)">⋯</button>
                    <div id="cab33DropMenu" class="menu33-dropdown" onclick="event.stopPropagation();">
                        <button type="button" class="menu33-item" onclick="document.getElementById('cab33DropMenu').classList.remove('open'); abrirModalPersona(${p.id});"><span>✏️ Editar Datos Personales</span></button>
                        <button type="button" class="menu33-item" onclick="document.getElementById('cab33DropMenu').classList.remove('open'); abrirPanelFotoPerfilCDM(${p.id});"><span>📷 Cambiar / Quitar Foto</span></button>
                        <button type="button" class="menu33-item" onclick="document.getElementById('cab33DropMenu').classList.remove('open'); if(typeof alternarEstadoPago==='function') alternarEstadoPago(${p.id}); inicializarPaginaJugadorIndividual();"><span>💳 Cuota: ${alDia ? "Al Día" : "Pendiente"}</span></button>
                        <div class="menu33-divider"></div>
                        <button type="button" class="menu33-item" onclick="navigator.clipboard.writeText('${p.codigoAcceso}'); mostrarToast('📋 Código copiado: ${p.codigoAcceso}');"><span>🔑 Código: ${p.codigoAcceso}</span></button>
                        <button type="button" class="menu33-item" onclick="if(typeof enviarCodigoPorWhatsAppCDM==='function') enviarCodigoPorWhatsAppCDM(${p.id});"><span>📲 Enviar Código por WA</span></button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Barra de control SIEMPRE VISIBLE justo debajo de la cabecera
    let strip = document.getElementById("jfControlStripAdmin");
    if (!strip) {
        strip = document.createElement("div");
        strip.id = "jfControlStripAdmin";
        strip.className = "jf-control-strip";
        cont.insertAdjacentElement("afterend", strip);
    }
    strip.innerHTML = `
        ${!esGym ? `
            <label class="jf-switch-pill">
                <input type="checkbox" ${habEj ? "checked" : ""} onchange="toggleHabilitarEjerciciosFicha('${p.deporte.replace(/'/g, "\\'")}', this.checked)">
                <span>🏋️ Incluir Progreso de Gimnasio</span>
            </label>
        ` : `<span style="font-size:0.8rem; font-weight:800; color:var(--cdm-700);">🏋️ Ficha Exclusiva de Gimnasio</span>`}

        <div class="jf-control-right">
            <select onchange="irAPaginaIndividual(this.value)" title="Cambiar rápido de jugador">
                ${comp.map(c => `<option value="${c.id}" ${c.id === p.id ? "selected" : ""}>👤 ${c.apellido}, ${c.nombre}</option>`).join("")}
            </select>
            ${typeof abrirModalConfigurarPortalUsuario === "function" ? `<button type="button" class="btn btn-secondary btn-sm" onclick="abrirModalConfigurarPortalUsuario(${p.id})">👁️ Portal Usuario</button>` : ""}
        </div>
    `;
}

function asegurarContenedorSec(id) {
    const main = document.querySelector(".app-content");
    let sec = document.getElementById(id);
    if (!sec && main) {
        sec = document.createElement("section");
        sec.id = id;
        sec.className = "jug-seccion hidden";
        const ref = document.getElementById("jug-sec-rutinas");
        if (ref) main.insertBefore(sec, ref);
        else main.appendChild(sec);
    }
    return sec;
}

function renderizarSolapaResumen(p) {
    const sec = asegurarContenedorSec("jug-sec-resumen36");
    if (!sec) return;
    const an = analizarJugador360Admin32(p);
    const esGym = an.esGym, habEj = ejerciciosHabilitadosEnFicha(p);
    const pil = p.pilares || { fisico: 7, gym: 7, tecnico: 7, actitud: 7 };
    const lesionesAct = (p.lesionesHistorial || []).filter(l => !l.fechaAlta).length;

    sec.innerHTML = `
        <div class="jf-stack">
            <div class="jf-kpi-grid ${(!esGym && !habEj) ? "cols-3" : ""}">
                <div class="jf-kpi c-purple">
                    <span class="jf-kpi-lbl">${esGym ? "🏋️ Plan" : "⭐ Score Oficial"}</span>
                    <span class="jf-kpi-val">${esGym ? "Socio Gym" : `${p.puntosCategoria} <small style="font-size:0.78rem; color:var(--ink-500);">/10</small>`}</span>
                    <span class="jf-kpi-sub">${esGym ? p.puesto : (an.puestoRanking ? `Puesto #${an.puestoRanking}° de ${an.pares.length}` : p.categoria)}</span>
                </div>
                <div class="jf-kpi c-green">
                    <span class="jf-kpi-lbl">🔥 Predisposición 30d</span>
                    <span class="jf-kpi-val">${an.pred.pct}%</span>
                    <span class="jf-kpi-sub">${an.pred.etiqueta} • ${an.asist7d}/${an.pactado}d sem.</span>
                </div>
                ${!esGym ? `
                    <div class="jf-kpi">
                        <span class="jf-kpi-lbl">⚽ Partidos</span>
                        <span class="jf-kpi-val">${an.partidosStats.pj} PJ</span>
                        <span class="jf-kpi-sub">${an.partidosStats.goles}G • ${an.partidosStats.asistencias}A • ${an.partidosStats.quites}Q</span>
                    </div>
                ` : ""}
                <div class="jf-kpi c-amber">
                    <span class="jf-kpi-lbl">🏥 Salud y Cuerpo</span>
                    <span class="jf-kpi-val" style="font-size:1.05rem;">${lesionesAct ? `🔴 ${lesionesAct} Lesión` : (p.estadoMedico || "🟢 Apto")}</span>
                    <span class="jf-kpi-sub">${p.peso} kg • ${p.altura} cm</span>
                </div>
            </div>

            <div class="jf-grid-2">
                <div class="jf-card">
                    <div class="jf-card-head">
                        <h3>${esGym ? "📊 Diagnóstico General" : "⭐ Rendimiento por Pilares (1 a 10)"}</h3>
                        ${!esGym ? `<button type="button" class="btn btn-primary btn-sm" onclick="abrirModalEvaluarScoreFicha(${p.id})">✏️ Calificar</button>` : ""}
                    </div>
                    ${!esGym ? [
                        { n: "🏃 Físico (30%)", v: pil.fisico, pr: an.promCat?.fisico, c: "#0284c7" },
                        { n: "🏋️ Fuerza / Gym (25%)", v: pil.gym, pr: an.promCat?.gym, c: "#6366f1" },
                        { n: "⚽ Técnico / Táctico (25%)", v: pil.tecnico, pr: an.promCat?.tecnico, c: "#10b981" },
                        { n: "🔥 Actitud (20%)", v: pil.actitud, pr: an.promCat?.actitud, c: "#f59e0b" }
                    ].map(r => `
                        <div class="jf-pilar-row">
                            <div class="jf-pilar-top"><span><b>${r.n}</b></span><span><b>${r.v}/10</b> <small style="color:var(--ink-500);">(Prom: ${r.pr ?? "-"})</small></span></div>
                            <div class="jf-bar-bg"><div class="jf-bar-fill" style="width:${r.v * 10}%; background:${r.c};"></div></div>
                        </div>
                    `).join("") : ""}
                    <div class="jf-diag-box">
                        <div class="jf-diag-ok">✅ <b>Fortaleza:</b> ${an.fortalezas[0]}</div>
                        <div class="jf-diag-warn">🎯 <b>Foco a mejorar:</b> ${an.mejoras[0]}</div>
                    </div>
                </div>

                <div class="jf-card">
                    <div class="jf-card-head">
                        <h3>📅 Evolución Mes a Mes</h3>
                        ${typeof abrirBoletinPlantelPDF === "function" ? `<button type="button" class="btn btn-secondary btn-sm" onclick="abrirBoletinPlantelPDF('${p.deporte}', '${p.categoria}')">📊 PDF Categoría</button>` : ""}
                    </div>
                    <div id="jfBloqueMesesResumen"></div>
                </div>
            </div>
        </div>
    `;
    renderizarBloqueMesesResumen(p);
}

function renderizarSolapaPartidos(p) {
    const sec = asegurarContenedorSec("jug-sec-partidos36");
    if (!sec) return;
    const an = analizarJugador360Admin32(p), stP = an.partidosStats, media = obtenerMediaJugadorFicha(p.id);

    sec.innerHTML = `
        <div class="jf-stack">
            <div class="jf-kpi-grid">
                <div class="jf-kpi"><span class="jf-kpi-lbl">Jugados</span><span class="jf-kpi-val">${stP.pj} PJ</span></div>
                <div class="jf-kpi c-green"><span class="jf-kpi-lbl">Goles</span><span class="jf-kpi-val">${stP.goles}</span></div>
                <div class="jf-kpi c-purple"><span class="jf-kpi-lbl">Asistencias</span><span class="jf-kpi-val">${stP.asistencias}</span></div>
                <div class="jf-kpi c-amber"><span class="jf-kpi-lbl">Quites / Tarj.</span><span class="jf-kpi-val">${stP.quites} / ${stP.tarjetas}</span></div>
            </div>

            <div class="jf-card">
                <div class="jf-card-head"><h3>⚽ Historial de Partidos (${stP.pj})</h3></div>
                <div style="display:flex; flex-direction:column; gap:0.5rem;">
                    ${stP.detallePartidos.length === 0
                        ? `<div class="empty-box" style="padding:1.1rem;">Sin partidos registrados todavía. Todo lo que cierres en <b>Cancha Partido</b> aparece acá automáticamente.</div>`
                        : stP.detallePartidos.map(dp => `
                            <div class="jf-match-card">
                                <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:0.4rem; margin-bottom:4px;">
                                    <strong>📅 ${dp.partido.fecha} vs ${dp.partido.rival} (${dp.partido.resultado || "S/D"})</strong>
                                    ${dp.resJ ? `<span class="badge badge-celeste">${dp.resJ.puntosSugeridos >= 0 ? "+" : ""}${dp.resJ.puntosSugeridos} pts</span>` : ""}
                                </div>
                                <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
                                    ${dp.evs.length ? dp.evs.map(e => `<span class="badge badge-purple" style="font-size:0.7rem;">${e.minutoDisplay || ""} ${e.tipo}</span>`).join("") : `<small>Participación registrada</small>`}
                                </div>
                            </div>
                        `).join("")}
                </div>
            </div>

            ${media.length ? `
                <div class="jf-card">
                    <div class="jf-card-head"><h3>📸 Fotos y Videos Vinculados (${media.length})</h3></div>
                    <div class="cm36-media-grid">
                        ${media.map(it => `<div class="cm36-media-card">${it.tipo === "foto" ? `<img data-jf-idb="${it.idbKey}" src="" onclick="window.open(this.src,'_blank')">` : `<a href="${it.url}" target="_blank" style="height:96px; background:#0f172a; color:#38bdf8; display:flex; align-items:center; justify-content:center; text-decoration:none; font-weight:800;">▶ Ver Video</a>`}<div style="padding:0.32rem 0.45rem; font-size:0.72rem;"><b>${it.titulo}</b><br><small style="color:var(--ink-500);">${it.fecha}</small></div></div>`).join("")}
                    </div>
                </div>
            ` : ""}
        </div>
    `;
    sec.querySelectorAll("img[data-jf-idb]").forEach(async img => { const u = await leerFotoPartidoIDBFicha(img.dataset.jfIdb); if (u) img.src = u; });
}

function renderizarSolapaSaludYActitud(p) {
    const sec = asegurarContenedorSec("jug-sec-salud36");
    if (!sec) return;
    const an = analizarJugador360Admin32(p);
    const lesiones = Array.isArray(p.lesionesHistorial) ? p.lesionesHistorial : [];
    const rub = p.rubricaPredisposicion || null;

    sec.innerHTML = `
        <div class="jf-stack">
            <div class="jf-grid-2">
                <div class="jf-card">
                    <div class="jf-card-head">
                        <h3>🧬 Anatomía y Carga (sRPE)</h3>
                        <button type="button" class="btn btn-primary btn-sm" onclick="if(typeof abrirModalAnatomiaYLesiones==='function') abrirModalAnatomiaYLesiones(${p.id}, 'anatomia');">+ Nuevo Control</button>
                    </div>
                    <div style="display:flex; gap:0.45rem; flex-wrap:wrap; margin-bottom:0.75rem;">
                        <span class="badge badge-celeste">⚖️ ${p.peso} kg</span>
                        <span class="badge badge-celeste">📏 ${p.altura} cm</span>
                        ${p.grasaPct != null ? `<span class="badge badge-purple">Grasa: ${p.grasaPct}%</span>` : ""}
                        ${p.musculoPct != null ? `<span class="badge badge-ok">Músculo: ${p.musculoPct}%</span>` : ""}
                        <span class="badge ${p.estadoMedico && p.estadoMedico !== "Óptimo" ? "badge-danger" : "badge-ok"}">${p.estadoMedico || "Óptimo"}</span>
                    </div>
                    <div id="jfSlotTablaClinica"></div>
                </div>

                <div class="jf-card">
                    <div class="jf-card-head">
                        <h3>🩹 Lesiones (${lesiones.length})</h3>
                        <button type="button" class="btn btn-danger btn-sm" onclick="if(typeof abrirModalAnatomiaYLesiones==='function') abrirModalAnatomiaYLesiones(${p.id}, 'lesiones');">+ Lesión</button>
                    </div>
                    ${lesiones.length === 0 ? `<div class="empty-box" style="padding:1rem;">🟢 Sin lesiones registradas en el expediente.</div>` : `
                        <div style="display:flex; flex-direction:column; gap:0.45rem;">
                            ${lesiones.map(l => `
                                <div class="pe-injury-card ${l.fechaAlta ? "alta" : ""}">
                                    <div>
                                        <strong>${l.zona} (${l.lado}) — ${l.tipo}</strong>
                                        <div style="font-size:0.74rem; color:var(--ink-600);">Baja: ${l.fechaBaja}${l.fechaAlta ? ` • Alta: ${l.fechaAlta}` : " • En recuperación"}</div>
                                    </div>
                                    ${!l.fechaAlta && typeof darAltaLesionPro === "function" ? `<button type="button" class="btn btn-ok btn-sm" onclick="darAltaLesionPro(${p.id}, ${l.id})">✓ Dar Alta</button>` : `<span class="badge badge-ok">Alta</span>`}
                                </div>
                            `).join("")}
                        </div>
                    `}
                </div>
            </div>

            <div class="jf-card">
                <div class="jf-card-head">
                    <h3>🔥 Predisposición y Asistencia Justa (Últimos 30 días — ${an.pred.pct}%)</h3>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="if(typeof abrirModalAnatomiaYLesiones==='function') abrirModalAnatomiaYLesiones(${p.id}, 'predisposicion');">✏️ Evaluar Actitud</button>
                </div>
                <div class="jf-att-summary">
                    <div class="jf-att-box"><strong style="color:#059669;">${an.pred.cont.presente}</strong><small>✓ Presente</small></div>
                    <div class="jf-att-box"><strong style="color:#d97706;">${an.pred.cont.tarde}</strong><small>⏰ Tarde</small></div>
                    <div class="jf-att-box"><strong style="color:#0284c7;">${an.pred.cont.lesionado}</strong><small>🏥 Kine/Les.</small></div>
                    <div class="jf-att-box"><strong style="color:#6366f1;">${an.pred.cont.justificado}</strong><small>📄 Justif.</small></div>
                    <div class="jf-att-box"><strong style="color:#dc2626;">${an.pred.cont.ausente}</strong><small>✕ Sin aviso</small></div>
                </div>
                ${rub ? `<div style="font-size:0.8rem; background:var(--surface-subtle); padding:0.65rem 0.8rem; border-radius:10px;"><b>Rúbrica (${rub.fecha}):</b> Puntualidad <b>${rub.puntualidad}</b> • Intensidad <b>${rub.intensidad}</b> • Respeto <b>${rub.respeto}</b> • Receptividad <b>${rub.receptividad}</b>${rub.nota ? `<br><i>"${rub.nota}"</i>` : ""}</div>`
                    : `<small style="color:var(--ink-500);">Tocá "✏️ Evaluar Actitud" para cargar la rúbrica objetiva de predisposición.</small>`}
            </div>
        </div>
    `;
    const tabClin = document.getElementById("contenedorClinicoJugador");
    if (tabClin) document.getElementById("jfSlotTablaClinica")?.appendChild(tabClin);
}

function renderizarSolapaGimnasio(p) {
    const sec = asegurarContenedorSec("jug-sec-gym36");
    if (!sec) return;

    const porEj = {};
    (p.evaluaciones || []).forEach(ev => { if (!porEj[ev.ejercicio]) porEj[ev.ejercicio] = []; porEj[ev.ejercicio].push(ev); });
    const ejs = Object.entries(porEj).map(([nom, l]) => {
        const ord = [...l].sort((a, b) => new Date(a.fecha) - new Date(b.fecha)), ini = ord[0], fin = ord[ord.length - 1];
        const esT = ini.tipo === "tiempo_seg", pr = esT ? Math.min(...ord.map(x => Number(x.valor) || 0)) : Math.max(...ord.map(x => Number(x.valor) || 0));
        const pct = ini.valor > 0 ? Math.round(((esT ? (ini.valor - fin.valor) : (fin.valor - ini.valor)) / ini.valor) * 1000) / 10 : 0;
        return { nombre: nom, unidad: fin.unidad || "", ini: ini.valor, fin: fin.valor, pr, pct };
    });
    if (ejs.length && (!window._gymEjSel36 || !ejs.some(e => e.nombre === window._gymEjSel36))) window._gymEjSel36 = ejs[0].nombre;
    const act = ejs.find(e => e.nombre === window._gymEjSel36) || null;

    sec.innerHTML = `
        <div class="jf-stack">
            <div class="jf-card">
                <div class="jf-card-head">
                    <h3>🏋️ Progresión de Marcas y Tests Físicos</h3>
                    <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalCargarMarcaFicha(${p.id})">+ Cargar Marca / Test</button>
                </div>
                ${!act ? `<div class="empty-box" style="padding:1.2rem;">Todavía no hay marcas físicas cargadas para ${p.nombre}.</div>` : `
                    <div class="jf-chips-row">
                        ${ejs.map(e => `<button type="button" class="jf-chip-btn ${e.nombre === act.nombre ? "active" : ""}" onclick="seleccionarEjTabGym('${e.nombre.replace(/'/g, "\\'")}')">${e.nombre} (${e.fin} ${e.unidad})</button>`).join("")}
                    </div>
                    <div class="jf-kpi-grid" style="margin-bottom:0.8rem;">
                        <div class="jf-kpi"><span class="jf-kpi-lbl">Inicial</span><span class="jf-kpi-val">${act.ini} <small>${act.unidad}</small></span></div>
                        <div class="jf-kpi c-purple"><span class="jf-kpi-lbl">Actual</span><span class="jf-kpi-val">${act.fin} <small>${act.unidad}</small></span></div>
                        <div class="jf-kpi c-amber"><span class="jf-kpi-lbl">Récord PR</span><span class="jf-kpi-val">🏆 ${act.pr}</span></div>
                        <div class="jf-kpi c-green"><span class="jf-kpi-lbl">Avance</span><span class="jf-kpi-val" style="color:${act.pct >= 0 ? "#059669" : "#dc2626"};">${act.pct > 0 ? "+" : ""}${act.pct}%</span></div>
                    </div>
                    <div class="chart-canvas-box" style="height:210px;"><canvas id="canvasCurvaGymTab36"></canvas></div>
                `}
            </div>

            <div class="jf-card">
                <div class="jf-card-head"><h3>📋 Historial de Marcas</h3></div>
                <div id="jfSlotTablaMarcas"></div>
            </div>

            <div class="jf-grid-2">
                <div class="jf-card"><div class="jf-card-head"><h3>🧮 Tabla % de 1RM</h3></div><div id="jfSlotCalc1RM"></div></div>
                <div class="jf-card"><div class="jf-card-head"><h3>⚔️ Comparador Cara a Cara (H2H)</h3></div><div id="jfSlotCompH2H"></div></div>
            </div>
        </div>
    `;

    const tabM = document.getElementById("contenedorHistorialJugador");
    if (tabM) document.getElementById("jfSlotTablaMarcas")?.appendChild(tabM);
    renderizarCalculadoraEnContenedores(p, "jfSlotCalc1RM", "jfSlotCompH2H");
    if (act) setTimeout(() => dibujarCurvaGymTab(p, act.nombre), 30);
}

// =========================================================================
// 8. FUNCIONES NATIVAS (PORTAL USUARIO, TESTS, RUTINAS, 1RM Y H2H)
// =========================================================================

function cambiarTabFichaJugador(nombreSec, btnEl) {
    document.querySelectorAll(".jug-seccion").forEach(s => { s.classList.add("hidden"); s.classList.remove("animate-in"); });
    const sec = document.getElementById(`jug-sec-${nombreSec}`);
    if (sec) { sec.classList.remove("hidden"); sec.classList.add("animate-in"); }
    document.querySelectorAll(".module-tabs .mod-tab").forEach(b => b.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");
}

function toggleAsistenciaEnFicha(idPersona, fecha) {
    const p = basePersonas.find(x => Number(x.id) === Number(idPersona));
    if (!p) return;
    if (typeof establecerEstadoAsistenciaFecha === "function") {
        const ya = p.asistencias.includes(fecha);
        establecerEstadoAsistenciaFecha(p.id, fecha, ya ? "ausente" : "presente");
        mostrarToast(ya ? `Asistencia quitada: ${p.nombre}` : `✓ Presente: ${p.nombre}`);
    } else {
        if (p.asistencias.includes(fecha)) p.asistencias = p.asistencias.filter(f => f !== fecha);
        else { p.asistencias.push(fecha); p.asistencias.sort(); }
        guardarDatosCDM();
    }
    inicializarPaginaJugadorIndividual();
}

function cambiarTipoMedicion() {
    const tipo = document.getElementById("evTipo")?.value || "fuerza_kg";
    const esUni = tipo === "unilateral";
    document.getElementById("bloqueValorSimple")?.classList.toggle("hidden", esUni);
    document.getElementById("bloqueUnilateral")?.classList.toggle("hidden", !esUni);
    document.getElementById("bloqueReps")?.classList.toggle("hidden", tipo !== "fuerza_kg");
    const lbl = document.getElementById("lblEvValor");
    if (lbl) lbl.innerText = tipo === "fuerza_kg" ? "Peso (kg) *" : tipo === "salto_cm" ? "Salto (cm) *" : tipo === "tiempo_seg" ? "Tiempo (seg) *" : tipo === "distancia_m" ? "Distancia (metros) *" : "Valor *";
}

function registrarAvanceJugador(e) {
    e.preventDefault();
    const p = obtenerJugadorActualPorURL();
    if (!p) return;
    const fecha = document.getElementById("evFecha")?.value || obtenerHoyISO();
    const ejInp = (document.getElementById("evEjercicio")?.value || "").trim();
    if (!ejInp) return;

    const clave = normalizarTextoEjercicioCDM(ejInp);
    const ya = (p.evaluaciones || []).find(ev => normalizarTextoEjercicioCDM(ev.ejercicio) === clave);
    const tipo = document.getElementById("evTipo")?.value || "fuerza_kg";
    const ejercicio = ya ? ya.ejercicio : (agregarEjercicioInventadoAlCatalogoCDM(ejInp, tipo, false) || ejInp);
    const notaRaw = (document.getElementById("evNota")?.value || "").trim();
    const autor = document.body.getAttribute("data-rol") === "usuario" ? "👤 Deportista" : "👨‍🏫 Profe";
    const nota = notaRaw ? `${autor}: ${notaRaw}` : autor;

    let valor = 0, unidad = "", detalle = "", tipoSave = tipo;
    if (tipo === "fuerza_kg") {
        const kg = parseFloat(document.getElementById("evValor")?.value) || 0, reps = parseInt(document.getElementById("evReps")?.value, 10) || 1;
        const rm = Math.round((reps === 1 ? kg : kg * (1 + reps / 30)) * 10) / 10;
        valor = rm; unidad = "kg (1RM)"; detalle = `${kg} kg × ${reps} reps (1RM: ${rm} kg)`;
    } else if (tipo === "unilateral") {
        const izq = parseFloat(document.getElementById("evIzq")?.value) || 0, der = parseFloat(document.getElementById("evDer")?.value) || 0;
        const asim = Math.round((Math.abs(izq - der) / Math.max(izq, der, 1)) * 1000) / 10;
        valor = Math.round(((izq + der) / 2) * 10) / 10; unidad = "prom"; detalle = `Izq: ${izq} | Der: ${der} (Asim: ${asim}%)`;
    } else if (tipo === "salto_cm") {
        const cm = parseFloat(document.getElementById("evValor")?.value) || 0;
        valor = cm; unidad = "cm"; detalle = `${cm} cm (${Math.max(0, Math.round((60.7 * cm) + (45.3 * (p.peso || 70)) - 2055))} W)`;
    } else if (tipo === "distancia_m") {
        valor = parseFloat(document.getElementById("evValor")?.value) || 0; unidad = "m"; detalle = `${valor} metros`;
    } else if (tipo === "agilidad_seg" || tipo === "tiempo_seg") {
        valor = parseFloat(document.getElementById("evValor")?.value) || 0; unidad = "seg"; detalle = `${valor} seg`; tipoSave = "tiempo_seg";
    } else {
        valor = parseFloat(document.getElementById("evValor")?.value) || 0; unidad = "reps"; detalle = `${valor} reps`;
    }

    p.evaluaciones.push({ id: Date.now(), fecha, ejercicio, tipo: tipoSave, valor, unidad, detalle, nota });
    p.evaluaciones.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    if (typeof registrarSnapshotPersona === "function") registrarSnapshotPersona(p, `Marca ${ejercicio}`);
    guardarDatosCDM();
    if (document.getElementById("evValor")) document.getElementById("evValor").value = "";
    if (document.getElementById("evNota")) document.getElementById("evNota").value = "";
    mostrarToast(`📈 Marca registrada: ${ejercicio}`);
    inicializarPaginaJugadorIndividual();
}

function dibujarGraficoEvolucion() {
    const p = obtenerJugadorActualPorURL(), sel = document.getElementById("selectFiltroEjercicioGrafico"), kpis = document.getElementById("kpisEvolucionEjercicio"), cv = document.getElementById("canvasEvolucionJugador");
    if (!p || !sel || !kpis || !cv || typeof Chart === "undefined") return;
    const datos = (p.evaluaciones || []).filter(e => e.ejercicio === sel.value).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    if (chartInstancia) { chartInstancia.destroy(); chartInstancia = null; }
    if (!datos.length) { kpis.innerHTML = `<div class="empty-box" style="grid-column:1/-1;">Sin marcas aún.</div>`; return; }
    const ini = datos[0].valor, act = datos[datos.length - 1].valor, un = datos[datos.length - 1].unidad, esT = datos[0].tipo === "tiempo_seg";
    const pr = esT ? Math.min(...datos.map(d => d.valor)) : Math.max(...datos.map(d => d.valor));
    const pct = ini > 0 ? (esT ? ((ini - act) / ini) * 100 : ((act - ini) / ini) * 100) : 0;
    kpis.innerHTML = `<div class="bento-kpi"><div class="kpi-data"><span>Inicial</span><strong>${ini}</strong></div></div><div class="bento-kpi"><div class="kpi-data"><span>Actual</span><strong>${act}</strong></div></div><div class="bento-kpi"><div class="kpi-data"><span>PR</span><strong>🏆 ${pr}</strong></div></div><div class="bento-kpi"><div class="kpi-data"><span>Avance</span><strong>${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%</strong></div></div>`;
    chartInstancia = new Chart(cv.getContext("2d"), { type: "line", data: { labels: datos.map(d => d.fecha), datasets: [{ label: `${sel.value} (${un})`, data: datos.map(d => d.valor), borderColor: "#0095db", backgroundColor: "rgba(0,149,219,0.16)", borderWidth: 3, fill: true, tension: 0.32 }] }, options: { responsive: true, maintainAspectRatio: false } });
}

function dibujarRadarJugador(p) {
    const cv = document.getElementById("canvasRadarJugador");
    if (!cv || !p || typeof Chart === "undefined") return;
    if (chartRadarInstancia) chartRadarInstancia.destroy();
    const cumpl = Math.min(10, Math.round((contarAsistenciasUltimos7Dias(p) / (p.frecuenciaSemanal || 3)) * 100) / 10);
    const data = p.deporte === "Gimnasio" ? [cumpl, 7, 7, 7, 8] : [p.pilares.fisico, p.pilares.gym, p.pilares.tecnico, p.pilares.actitud, cumpl, p.puntosCategoria];
    const labels = p.deporte === "Gimnasio" ? ["Asist.", "Constancia", "Tests", "Rutinas", "Sueño"] : ["Físico", "Gym", "Técnico", "Actitud", "Asist.", "Score"];
    chartRadarInstancia = new Chart(cv.getContext("2d"), { type: "radar", data: { labels, datasets: [{ label: p.nombre, data, backgroundColor: "rgba(0,149,219,0.25)", borderColor: "#0095db", borderWidth: 2.5 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { r: { min: 0, max: 10, ticks: { stepSize: 2, display: false } } } } });
}

function renderizarHistorialJugador(p) {
    const cont = document.getElementById("contenedorHistorialJugador");
    if (!cont || !p) return;
    if (!p.evaluaciones.length) { cont.innerHTML = `<div class="empty-box" style="padding:0.9rem;">Sin marcas cargadas.</div>`; return; }
    cont.innerHTML = `<div class="table-wrap"><table class="app-table" style="font-size:0.81rem;"><thead><tr><th>Fecha</th><th>Ejercicio</th><th>Resultado</th><th></th></tr></thead><tbody>` +
        [...p.evaluaciones].reverse().map(ev => `<tr><td><b>${ev.fecha.slice(5)}</b></td><td><strong>${ev.ejercicio}</strong></td><td><span class="badge badge-ok">${ev.detalle}</span></td><td style="text-align:right;"><button type="button" class="btn btn-danger btn-sm usr-action-allow" onclick="eliminarEvaluacionJugador(${ev.id})">🗑️</button></td></tr>`).join("") + `</tbody></table></div>`;
}

function eliminarEvaluacionJugador(idEv) {
    const p = obtenerJugadorActualPorURL();
    if (!p || !confirm("🗑️ ¿Quitar esta marca?")) return;
    p.evaluaciones = p.evaluaciones.filter(e => Number(e.id) !== Number(idEv));
    guardarDatosCDM();
    inicializarPaginaJugadorIndividual();
}

function guardarClinicoJugador(e) {
    e.preventDefault();
    const p = obtenerJugadorActualPorURL();
    if (!p) return;
    const peso = parseFloat(document.getElementById("medPeso")?.value);
    if (!isNaN(peso) && peso > 0) p.peso = peso;
    if (document.body.getAttribute("data-rol") !== "usuario") { const est = document.getElementById("medEstadoGeneral")?.value; if (est) p.estadoMedico = est; }
    p.clinico.push({ id: Date.now(), fecha: document.getElementById("medFecha")?.value || obtenerHoyISO(), peso: p.peso, altura: p.altura, rpe: parseInt(document.getElementById("medRPE")?.value, 10) || 5, sueno: document.getElementById("medSueno")?.value || 5, dolor: (document.getElementById("medDolor")?.value || "").trim() || "Sin molestias" });
    guardarDatosCDM();
    e.target.reset();
    mostrarToast("🏥 Control guardado.");
    inicializarPaginaJugadorIndividual();
}

function renderizarClinicoJugador(p) {
    const cont = document.getElementById("contenedorClinicoJugador");
    if (!cont || !p) return;
    if (!p.clinico?.length) { cont.innerHTML = `<div class="empty-box" style="padding:0.9rem;">Sin controles registrados aún.</div>`; return; }
    cont.innerHTML = `<div class="table-wrap"><table class="app-table" style="font-size:0.8rem;"><thead><tr><th>Fecha</th><th>Peso / Alt.</th><th>Carga</th><th>Detalle</th></tr></thead><tbody>` +
        [...p.clinico].reverse().slice(0, 8).map(c => `<tr><td><b>${c.fecha.slice(5)}</b></td><td><b>${c.peso}kg</b> / ${c.altura || p.altura}cm</td><td><span class="badge ${(c.rpe || 5) > 7 ? "badge-danger" : "badge-ok"}">RPE ${c.rpe || 5}${c.cargaUA ? ` (${c.cargaUA} UA)` : ""}</span></td><td><small>${c.dolor || "Óptimo"}</small></td></tr>`).join("") + `</tbody></table></div>`;
}

function agregarFilaEjercicioIndividual(datos = null) {
    const cont = document.getElementById("contenedorFilasRutinaIndividual");
    if (!cont) return;
    const n = cont.querySelectorAll(".ex-builder-row").length + 1;
    const div = document.createElement("div");
    div.className = "ex-builder-row";
    div.innerHTML = `
        <div class="ex-builder-top"><span class="ex-builder-num">#${n}</span><div class="field" style="flex:1;"><input type="text" class="ri-nombre" list="listaEjerciciosSugeridos" required placeholder="Ejercicio" value="${datos?.nombre || ""}"></div><button type="button" class="btn btn-danger btn-sm ex-builder-del" onclick="this.closest('.ex-builder-row').remove()">✕</button></div>
        <div class="ex-builder-metrics-grid"><div class="field"><label>Series</label><input type="number" class="ri-series" required min="1" value="${datos?.series || 4}"></div><div class="field"><label>Reps</label><input type="text" class="ri-reps" required value="${datos?.reps || "8-10"}"></div><div class="field"><label>Carga</label><input type="text" class="ri-peso" value="${datos?.peso || ""}"></div><div class="field"><label>Pausa</label><input type="text" class="ri-pausa" value="${datos?.pausa || "90s"}"></div></div>
        <div class="field" style="margin-top:0.4rem;"><input type="text" class="ri-forma" placeholder="💡 Indicación..." value="${datos?.forma || ""}"></div>
    `;
    cont.appendChild(div);
}

function cargarPlantillaIndividual(tipo) {
    const cont = document.getElementById("contenedorFilasRutinaIndividual");
    if (!cont) return;
    cont.innerHTML = "";
    if (tipo === "superior") { document.getElementById("rutNombre").value = "Fuerza Tren Superior"; agregarFilaEjercicioIndividual({ nombre: "Press de Banca Plano", series: 4, reps: "6-8", peso: "Pesado", pausa: "2m" }); }
    else if (tipo === "rehab") { document.getElementById("rutNombre").value = "Protocolo Rehabilitación"; agregarFilaEjercicioIndividual({ nombre: "Hip Thrust con Barra", series: 3, reps: "12", peso: "Sin dolor", pausa: "60s" }); }
    else { document.getElementById("rutNombre").value = "Fuerza Piernas"; agregarFilaEjercicioIndividual({ nombre: "Sentadilla Trasera con Barra", series: 4, reps: "5", peso: "80% 1RM", pausa: "2m" }); }
}

function guardarRutinaIndividual(e) {
    e.preventDefault();
    const p = obtenerJugadorActualPorURL(), filas = document.querySelectorAll("#contenedorFilasRutinaIndividual .ex-builder-row");
    if (!p || !filas.length) return;
    const ejercicios = Array.from(filas).map(f => { const nom = f.querySelector(".ri-nombre").value.trim(); agregarEjercicioInventadoAlCatalogoCDM(nom, "fuerza_kg", true); return { nombre: nom, series: f.querySelector(".ri-series").value, reps: f.querySelector(".ri-reps").value.trim(), peso: f.querySelector(".ri-peso").value.trim() || "A ajustar", pausa: f.querySelector(".ri-pausa").value.trim(), forma: f.querySelector(".ri-forma").value.trim() }; });
    baseRutinas.unshift({ id: Date.now(), esGrupal: false, deporteDestino: p.deporte, categoriaDestino: p.categoria, personaId: p.id, etiquetaDestino: `👤 ${p.nombre} ${p.apellido}`, fecha: new Date().toLocaleDateString("es-AR"), nombre: document.getElementById("rutNombre").value.trim(), objetivo: document.getElementById("rutObjetivo").value, dias: document.getElementById("rutDias").value.trim() || "Semanal", notas: document.getElementById("rutNotas").value.trim(), ejercicios });
    guardarDatosCDM(); e.target.reset(); document.getElementById("contenedorFilasRutinaIndividual").innerHTML = ""; agregarFilaEjercicioIndividual(); mostrarToast("✓ Rutina guardada."); renderizarRutinasIndividuales(p);
}

function renderizarRutinasIndividuales(p) {
    const cont = document.getElementById("listaRutinasGuardadasJugador");
    if (!cont || !p) return;
    if (typeof window.agregarBotonesVideoEnRutinasJugador === "function") { window.agregarBotonesVideoEnRutinasJugador({ personaId: p.id }); return; }
    const ruts = (baseRutinas || []).filter(r => Number(r.personaId) === Number(p.id) || (r.esGrupal && r.deporteDestino === p.deporte && (r.categoriaDestino === p.categoria || r.categoriaDestino === "General")));
    cont.innerHTML = ruts.length && typeof renderTarjetaRutinaProAdmin === "function" ? ruts.map(r => renderTarjetaRutinaProAdmin(r)).join("") : `<div class="empty-box" style="grid-column:1/-1;">Sin rutinas todavía.</div>`;
}

function renderizarCalculadoraEnContenedores(p, idCalc, idComp) {
    const cC = document.getElementById(idCalc), cH = document.getElementById(idComp);
    if (!cC || !cH) return;
    const evalsF = (p.evaluaciones || []).filter(e => e.tipo === "fuerza_kg"), ultRM = evalsF.length ? evalsF[evalsF.length - 1].valor : 80;
    cC.innerHTML = `<div class="field"><label>1RM Referencia (kg)</label><input type="number" value="${ultRM}" oninput="actualizarZonas1RM(this.value, '${idCalc}_grid')"></div><div id="${idCalc}_grid" class="rm-zone-grid"></div>`;
    actualizarZonas1RM(ultRM, `${idCalc}_grid`);

    const comp = (basePersonas || []).filter(x => x.activo && Number(x.id) !== Number(p.id) && x.deporte === p.deporte);
    if (!comp.length) { cH.innerHTML = `<div class="empty-box" style="padding:0.9rem;">Sin compañeros para comparar.</div>`; return; }
    cH.innerHTML = `<div class="field" style="margin-bottom:0.7rem;"><label>Comparar contra:</label><select onchange="actualizarTablaH2H(this.value, '${idComp}_tbl')">${comp.map(c => `<option value="${c.id}">${c.apellido}, ${c.nombre}</option>`).join("")}</select></div><div id="${idComp}_tbl"></div>`;
    actualizarTablaH2H(comp[0].id, `${idComp}_tbl`);
}

function asegurarSeccionCalculadora() {
    if (document.getElementById("jug-sec-calculadora")) return;
    const main = document.querySelector(".app-content");
    if (!main) return;
    const sec = document.createElement("section");
    sec.id = "jug-sec-calculadora"; sec.className = "jug-seccion hidden";
    sec.innerHTML = `<div class="split-equal"><div class="app-panel"><div class="panel-head"><h3>🧮 Tabla % 1RM</h3></div><div id="contenedorCalculadora1RMJugador"></div></div><div class="app-panel"><div class="panel-head"><h3>⚔️ Comparador H2H</h3></div><div id="contenedorComparadorJugador"></div></div></div>`;
    main.appendChild(sec);
}

function renderizarCalculadoraYComparadorJugador(p) {
    asegurarSeccionCalculadora();
    renderizarCalculadoraEnContenedores(p, "contenedorCalculadora1RMJugador", "contenedorComparadorJugador");
}

function actualizarZonas1RM(rmVal, gridId = "gridZonas1RM") {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    const rm = parseFloat(rmVal) || 0;
    grid.innerHTML = [{ p: 95, r: "1–2 reps" }, { p: 90, r: "3–4 reps" }, { p: 85, r: "5–6 reps" }, { p: 80, r: "6–8 reps" }, { p: 75, r: "8–10 reps" }, { p: 70, r: "10–12 reps" }]
        .map(z => `<div class="rm-zone-card"><span class="badge badge-celeste">${z.p}%</span><strong>${Math.round((rm * z.p) / 10) / 10} kg</strong><small style="display:block; font-weight:700;">${z.r}</small></div>`).join("");
}

function actualizarTablaH2H(idRival, tblId = "tablaResultadosH2H") {
    const cont = document.getElementById(tblId), p1 = obtenerJugadorActualPorURL(), p2 = (basePersonas || []).find(x => Number(x.id) === Number(idRival));
    if (!cont || !p1 || !p2) return;
    const filas = p1.deporte === "Gimnasio"
        ? [{ l: "Asist. 7d", v1: contarAsistenciasUltimos7Dias(p1), v2: contarAsistenciasUltimos7Dias(p2), u: "d" }, { l: "Peso", v1: p1.peso, v2: p2.peso, u: "kg" }]
        : [{ l: "Score", v1: p1.puntosCategoria, v2: p2.puntosCategoria, u: "" }, { l: "Físico", v1: p1.pilares.fisico, v2: p2.pilares.fisico, u: "" }, { l: "Gym", v1: p1.pilares.gym, v2: p2.pilares.gym, u: "" }, { l: "Técnico", v1: p1.pilares.tecnico, v2: p2.pilares.tecnico, u: "" }, { l: "Actitud", v1: p1.pilares.actitud, v2: p2.pilares.actitud, u: "" }];
    cont.innerHTML = `<div style="background:var(--surface-subtle); border:1px solid var(--line); border-radius:12px; overflow:hidden;"><div class="h2h-row" style="background:var(--cdm-900); color:#fff; font-weight:800;"><div>${p1.apellido}</div><div style="text-align:center; color:#38bdf8;">VS</div><div style="text-align:right;">${p2.apellido}</div></div>` +
        filas.map(f => `<div class="h2h-row"><div style="font-weight:${f.v1 >= f.v2 ? "900" : "600"};">${f.v1}${f.u}</div><div class="h2h-label">${f.l}</div><div style="text-align:right; font-weight:${f.v2 >= f.v1 ? "900" : "600"};">${f.v2}${f.u}</div></div>`).join("") + `</div>`;
}

function refrescarGraficosFichaActual() {
    const p = obtenerJugadorActualPorURL();
    if (!p) return;
    if (esAdminEnFichaJugador()) { if (window._tabAdminFicha === "gym36" && window._gymEjSel36) dibujarCurvaGymTab(p, window._gymEjSel36); }
    else { dibujarGraficoEvolucion(); dibujarRadarJugador(p); }
}

// =========================================================================
// 9. INICIALIZADOR PRINCIPAL DE JUGADOR.HTML
// =========================================================================

function inicializarPaginaJugadorIndividual() {
    const p = obtenerJugadorActualPorURL(), contCab = document.getElementById("fichaCabeceraJugador");
    if (!contCab) return;
    if (!p) { contCab.innerHTML = `<div class="empty-box"><h3>Persona no encontrada</h3><a href="index.html" class="btn btn-primary btn-sm">Volver</a></div>`; return; }

    asegurarPilaresPersona(p);
    asegurarSeccionCalculadora();

    const mapaUrl = { Futbol: "futbol.html", Hockey: "hockey.html", Gimnasio: "gym.html" };
    const btnVol = document.getElementById("btnVolverDeporte");
    if (btnVol) btnVol.href = mapaUrl[p.deporte] || `futbol.html?deporte=${encodeURIComponent(p.deporte)}`;
    if (document.getElementById("subtituloHeaderJugador")) document.getElementById("subtituloHeaderJugador").innerText = `${p.nombre} ${p.apellido}`;

    const hoy = obtenerHoyISO();
    if (document.getElementById("evFecha")) document.getElementById("evFecha").value = hoy;
    if (document.getElementById("medFecha")) document.getElementById("medFecha").value = hoy;

    const selEx = document.getElementById("selectFiltroEjercicioGrafico");
    if (selEx) {
        const unicos = [...new Set(p.evaluaciones.map(e => e.ejercicio))];
        selEx.innerHTML = unicos.length ? unicos.map(nom => `<option value="${nom}">${nom}</option>`).join("") : `<option value="">-- Sin marcas --</option>`;
    }

    const contFilas = document.getElementById("contenedorFilasRutinaIndividual");
    if (contFilas && contFilas.children.length === 0) agregarFilaEjercicioIndividual();

    rescatarNodosNativosFicha();
    renderizarHistorialJugador(p);
    renderizarClinicoJugador(p);
    renderizarRutinasIndividuales(p);
    renderizarCalculadoraYComparadorJugador(p);

    if (esAdminEnFichaJugador()) {
        document.body.classList.add("ficha-admin-bento");
        const esGym = p.deporte === "Gimnasio", habEj = ejerciciosHabilitadosEnFicha(p);

        renderizarCabeceraYBarraControl(p);
        renderizarSolapaResumen(p);
        if (!esGym) renderizarSolapaPartidos(p);
        renderizarSolapaSaludYActitud(p);
        if (habEj) renderizarSolapaGimnasio(p);

        // Barra plana única (0 sub-pestañas)
        const tabsBar = document.querySelector(".module-tabs");
        if (tabsBar) {
            tabsBar.className = "module-tabs jf-flat-tabs";
            tabsBar.innerHTML = `
                <button type="button" class="mod-tab" data-tab-admin="resumen36" onclick="activarTabAdminFicha('resumen36')">📊 Resumen</button>
                ${!esGym ? `<button type="button" class="mod-tab" data-tab-admin="partidos36" onclick="activarTabAdminFicha('partidos36')">⚽ Partidos</button>` : ""}
                <button type="button" class="mod-tab" data-tab-admin="salud36" onclick="activarTabAdminFicha('salud36')">🏥 Salud y Actitud</button>
                ${habEj ? `<button type="button" class="mod-tab" data-tab-admin="gym36" onclick="activarTabAdminFicha('gym36')">🏋️ Gimnasio</button>` : ""}
                <button type="button" class="mod-tab" data-tab-admin="rutinas" onclick="activarTabAdminFicha('rutinas')">📋 Rutinas</button>
            `;
        }

        const validas = ["resumen36", !esGym ? "partidos36" : null, "salud36", habEj ? "gym36" : null, "rutinas"].filter(Boolean);
        if (!validas.includes(window._tabAdminFicha)) window._tabAdminFicha = "resumen36";
        activarTabAdminFicha(window._tabAdminFicha);
    } else {
        document.body.classList.remove("ficha-admin-bento");
        document.getElementById("jfControlStripAdmin")?.remove();
        const fueSem = contarAsistenciasUltimos7Dias(p), pact = p.frecuenciaSemanal || 3;
        contCab.innerHTML = `<div style="display:flex; align-items:center; gap:0.9rem;">${renderAvatarPersonaCDM(p, 56, "1.2rem", true)}<div><h2 style="font-size:1.25rem; font-weight:900; margin:0;">${p.nombre} ${p.apellido}</h2><small style="opacity:0.85;">${p.deporte} • ${p.puesto} • ${fueSem}/${pact}d</small></div></div>`;
        dibujarGraficoEvolucion();
        dibujarRadarJugador(p);
    }
}