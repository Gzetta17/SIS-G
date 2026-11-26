/**
 * js/jugador-ficha.js — Expediente Individual Rediseñado (Gimnasio + Deportes)
 * - Gimnasio: Cuaderno diario de cargas, última marca visible y tablero de PRs
 * - Deportes: Panel claro de avances (Pilares, Partidos, Tests/Tendencias) + permiso controlado por el profe
 * - 100% compatible con jugador.html, pro-evaluacion.js, portal-permisos.js y Modo Día/Noche
 * G-SIS — Desarrollado por Gonzalo Adanchú
 */

let tabActualFichaJugador = "graficos";
let ejercicioSeleccionadoFicha = "";

// =========================================================================
// 1. ESTILOS LIMPIOS, RESPONSIVE Y MOTOR DE IMPRESIÓN A4
// =========================================================================

function inyectarCSSJugadorFichaPro() {
    if (document.getElementById("cdmCssJugadorFichaPro")) return;
    const st = document.createElement("style");
    st.id = "cdmCssJugadorFichaPro";
    st.textContent = `
        /* Pulso ejecutivo y tablero de avances */
        .jf-pulse-wrap {
            display: flex;
            flex-direction: column;
            gap: 0.9rem;
            margin-bottom: 1rem;
        }
        .jf-grid-3 {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 0.9rem;
            align-items: stretch;
        }
        .jf-grid-2 {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.9rem;
            align-items: start;
        }
        .jf-card {
            background: var(--surface-solid, #ffffff);
            border: 1.5px solid var(--line-strong, #cbd5e1);
            border-radius: 18px;
            padding: 0.95rem 1.05rem;
            display: flex;
            flex-direction: column;
            gap: 0.65rem;
        }
        .jf-card-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.5rem;
            flex-wrap: wrap;
            padding-bottom: 0.48rem;
            border-bottom: 1px solid var(--line, #e2e8f0);
        }
        .jf-card-head h4 {
            margin: 0;
            font-size: 0.9rem;
            font-weight: 800;
            color: var(--ink-900, #0f172a);
            display: flex;
            align-items: center;
            gap: 0.4rem;
        }

        /* Barras de pilares (Deportes) */
        .jf-pillar-row {
            display: flex;
            flex-direction: column;
            gap: 3px;
            font-size: 0.77rem;
        }
        .jf-pillar-top {
            display: flex;
            justify-content: space-between;
            font-weight: 700;
            color: var(--ink-700, #334155);
        }
        .jf-bar-track {
            height: 7px;
            background: var(--surface-subtle, #e2e8f0);
            border-radius: 999px;
            overflow: hidden;
        }
        .jf-bar-fill {
            height: 100%;
            border-radius: 999px;
            background: linear-gradient(90deg, #0284c7, #38bdf8);
            transition: width 0.25s ease;
        }

        /* Estadísticas de partidos */
        .jf-match-stats {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 0.45rem;
        }
        .jf-mstat {
            background: var(--surface-subtle, #f8fafc);
            border: 1px solid var(--line, #e2e8f0);
            border-radius: 12px;
            padding: 0.5rem 0.35rem;
            text-align: center;
        }
        .jf-mstat strong {
            display: block;
            font-size: 1.15rem;
            font-weight: 900;
            color: var(--ink-900, #0f172a);
            line-height: 1.1;
        }
        .jf-mstat small {
            font-size: 0.65rem;
            font-weight: 800;
            text-transform: uppercase;
            color: var(--ink-500, #64748b);
        }

        /* Tablero de marcas / PRs clickeables */
        .jf-pr-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
            gap: 0.65rem;
        }
        .jf-pr-card {
            background: var(--surface-subtle, #f8fafc);
            border: 1.5px solid var(--line, #e2e8f0);
            border-top: 3.5px solid var(--brand-p, #0284c7);
            border-radius: 14px;
            padding: 0.7rem 0.8rem;
            cursor: pointer;
            transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
            display: flex;
            flex-direction: column;
            gap: 0.3rem;
            text-align: left;
        }
        .jf-pr-card:hover {
            transform: translateY(-2px);
            border-color: var(--brand-p, #0284c7);
            box-shadow: 0 8px 18px -10px rgba(2, 132, 199, 0.32);
        }
        .jf-pr-card.is-selected {
            background: var(--cdm-50, #f0f9ff);
            border-color: var(--brand-p, #0284c7);
            box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.18);
        }
        .jf-pr-title {
            font-size: 0.81rem;
            font-weight: 800;
            color: var(--ink-900, #0f172a);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .jf-pr-val {
            font-size: 1.12rem;
            font-weight: 900;
            color: var(--ink-900, #0f172a);
            line-height: 1.15;
        }
        .jf-pr-sub {
            font-size: 0.71rem;
            color: var(--ink-500, #64748b);
        }

        /* Cuaderno rápido de Gimnasio */
        .jf-gym-notebook {
            background: linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(16, 185, 129, 0.06) 100%);
            border: 1.5px solid rgba(2, 132, 199, 0.32);
            border-radius: 18px;
            padding: 0.95rem 1.05rem;
        }
        .jf-gym-quick-form {
            display: grid;
            grid-template-columns: minmax(170px, 1.5fr) 92px 84px minmax(120px, 1fr) auto;
            gap: 0.45rem;
            align-items: end;
            margin-top: 0.55rem;
        }
        .jf-gym-last-hint {
            margin-top: 0.45rem;
            font-size: 0.76rem;
            font-weight: 700;
            color: var(--brand-p-ink, #0369a1);
            display: flex;
            align-items: center;
            gap: 0.4rem;
            flex-wrap: wrap;
        }

        /* Anotación inline dentro de rutinas */
        .jf-rut-ex-box {
            padding: 0.62rem 0.75rem;
            background: var(--surface-subtle, #f8fafc);
            border: 1px solid var(--line, #e2e8f0);
            border-radius: 11px;
            font-size: 0.81rem;
        }
        .jf-rut-inline-form {
            display: flex;
            gap: 0.35rem;
            flex-wrap: wrap;
            margin-top: 0.45rem;
            padding-top: 0.45rem;
            border-top: 1px dashed var(--line-strong, #cbd5e1);
            align-items: center;
        }
        .jf-rut-inline-form input {
            min-height: 30px !important;
            font-size: 0.75rem !important;
            padding: 0.2rem 0.45rem !important;
        }

        /* Modo gráfico ancho completo en Gym */
        .jf-charts-single {
            grid-template-columns: 1fr !important;
        }
        .jf-charts-single .chart-canvas-box {
            min-height: 290px;
        }

        /* Impresión A4 limpia (compartida con pro-evaluacion.js) */
        #cdmPrintZoneJF { display: none; }
        .jf-pdf-sheet {
            background: #ffffff;
            color: #0f172a;
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            padding: 1.35rem;
            font-family: 'Poppins', Arial, sans-serif;
        }
        .jf-pdf-sheet table { width: 100%; border-collapse: collapse; font-size: 0.76rem; }
        .jf-pdf-sheet th, .jf-pdf-sheet td {
            border: 1px solid #cbd5e1;
            padding: 0.42rem 0.5rem;
            text-align: left;
            color: #0f172a;
        }
        .jf-pdf-sheet th { background: #f1f5f9; font-weight: 800; }

        @media print {
            @page { size: A4; margin: 12mm; }
            body.cdm-jf-printing > *:not(#cdmPrintZoneJF) { display: none !important; }
            body.cdm-jf-printing #cdmPrintZoneJF { display: block !important; width: 100% !important; background: #fff !important; }
            body.cdm-jf-printing #cdmPrintZoneJF .jf-pdf-sheet { border: none !important; padding: 0 !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }

        @media (max-width: 1024px) {
            .jf-grid-3 { grid-template-columns: 1fr; }
            .jf-gym-quick-form { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .jf-gym-quick-form .jf-qf-ej { grid-column: 1 / -1; }
            .jf-gym-quick-form .jf-qf-btn { grid-column: 1 / -1; width: 100%; }
        }
        @media (max-width: 720px) {
            .jf-grid-2 { grid-template-columns: 1fr; }
            .jf-match-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
    `;
    document.head.appendChild(st);
}

// =========================================================================
// 2. HELPERS, PERMISOS, ANÁLISIS 360° E IMPRESIÓN A4
// =========================================================================

function escJF(s) {
    return String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function obtenerIdJugadorDesdeURL() {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get("id");
    if (idParam) return Number(idParam);
    try {
        const ses = JSON.parse(localStorage.getItem("cdm_sesion_activa_v1") || "null");
        if (ses?.personaId) return Number(ses.personaId);
    } catch {}
    return null;
}

function obtenerJugadorActualPorURL() {
    const id = obtenerIdJugadorDesdeURL();
    if (!id) return null;
    const p = (basePersonas || []).find(x => Number(x.id) === Number(id)) || null;
    if (p) {
        asegurarPilaresPersona(p);
        if (typeof window.asegurarEstructuraProPersona === "function") {
            window.asegurarEstructuraProPersona(p);
        }
    }
    return p;
}

function esUsuarioFinalEnFicha() {
    try {
        const ses = JSON.parse(localStorage.getItem("cdm_sesion_activa_v1") || "null");
        if (ses?.rol === "usuario") return true;
        if (document.body?.getAttribute("data-rol") === "usuario") return true;
    } catch {}
    return false;
}

function jugadorDeporteTienePermisoProgreso(p) {
    if (!p) return false;
    if (p.deporte === "Gimnasio") return true;
    if (typeof window.obtenerPermisosEfectivosPortal === "function") {
        const perms = window.obtenerPermisosEfectivosPortal(p);
        if (perms && typeof perms.progreso === "boolean") {
            return perms.progreso || Boolean(p.permitirAutoAvance);
        }
    }
    return Boolean(p.permitirAutoAvance);
}

function puedeGestionarProgresoEnFicha(p) {
    if (!p) return false;
    if (!esUsuarioFinalEnFicha()) return true;
    return jugadorDeporteTienePermisoProgreso(p);
}

window.alternarPermisoAvancesDeporteJF = function (idPersona) {
    const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
    if (!p || p.deporte === "Gimnasio") return;

    const actual = jugadorDeporteTienePermisoProgreso(p);
    const nuevo = !actual;
    p.permitirAutoAvance = nuevo;
    if (!p.permisosPortal || typeof p.permisosPortal !== "object") p.permisosPortal = {};
    p.permisosPortal.progreso = nuevo;

    guardarDatosCDM();
    mostrarToast(nuevo
        ? `🔓 ${p.nombre} ahora puede anotar y ver sus avances desde su portal.`
        : `🔒 Auto-registro de avances desactivado para ${p.nombre}.`);
    inicializarPaginaJugadorIndividual();
};

window.registrarEventoScore32 = function (p, scoreAnterior, scoreNuevo, origen = "Evaluación", motivo = "") {
    if (!p || p.deporte === "Gimnasio") return;
    if (!Array.isArray(p.historialScore)) p.historialScore = [];
    const ant = Number(scoreAnterior) || 7;
    const nvo = Number(scoreNuevo) || 7;
    const delta = Math.round((nvo - ant) * 10) / 10;

    p.historialScore.unshift({
        id: Date.now(),
        fecha: obtenerHoyISO(),
        anterior: ant,
        nuevo: nvo,
        delta,
        origen,
        motivo: String(motivo || "").trim()
    });
    if (p.historialScore.length > 40) p.historialScore = p.historialScore.slice(0, 40);
};

window.analizarJugador360Admin32 = function (p) {
    const res = {
        partidosStats: { pj: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, eventosRecientes: [] }
    };
    if (!p || p.deporte === "Gimnasio") return res;

    const partidosDep = (basePartidos || [])
        .filter(m => m && normalizarTextoEjercicioCDM(m.deporte) === normalizarTextoEjercicioCDM(p.deporte))
        .sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")));

    const nomNormA = normalizarTextoEjercicioCDM(`${p.apellido}, ${p.nombre}`);
    const nomNormB = normalizarTextoEjercicioCDM(`${p.nombre} ${p.apellido}`);

    partidosDep.forEach(m => {
        const evs = (m.eventos || []).filter(ev => {
            if (Number(ev.jugadorId) === Number(p.id)) return true;
            const en = normalizarTextoEjercicioCDM(ev.jugadorNombre || "");
            return en && (en === nomNormA || en === nomNormB);
        });

        const enResumen = (m.resumenJugadores || []).some(r => Number(r.id) === Number(p.id));
        if (evs.length > 0 || enResumen) {
            res.partidosStats.pj++;
        }

        evs.forEach(ev => {
            const t = normalizarTextoEjercicioCDM(ev.tipo || "");
            if (t.includes("gol") && !t.includes("contra")) res.partidosStats.goles++;
            else if (t.includes("asistencia") || t.includes("pase gol")) res.partidosStats.asistencias++;
            else if (t.includes("amarilla")) res.partidosStats.amarillas++;
            else if (t.includes("roja") || t.includes("expul")) res.partidosStats.rojas++;

            res.partidosStats.eventosRecientes.push({
                fecha: m.fecha || "-",
                rival: m.rival || "Partido",
                resultado: m.resultado || "",
                minuto: ev.minutoDisplay || (ev.minuto ? `${ev.minuto}'` : ""),
                tipo: ev.tipo || "Acción",
                detalle: ev.detalle || ""
            });
        });
    });

    res.partidosStats.eventosRecientes = res.partidosStats.eventosRecientes.slice(0, 8);
    return res;
};

window.imprimirDocumentoA4Limpio = function (htmlInterno) {
    inyectarCSSJugadorFichaPro();
    let z = document.getElementById("cdmPrintZoneJF");
    if (!z) {
        z = document.createElement("div");
        z.id = "cdmPrintZoneJF";
        document.body.appendChild(z);
    }
    z.innerHTML = `<div class="jf-pdf-sheet">${htmlInterno}</div>`;
    document.body.classList.add("cdm-jf-printing");
    const limpiar = () => {
        document.body.classList.remove("cdm-jf-printing");
        z.innerHTML = "";
        window.removeEventListener("afterprint", limpiar);
    };
    window.addEventListener("afterprint", limpiar);
    setTimeout(() => window.print(), 60);
    setTimeout(limpiar, 2500);
};

function resumirEjerciciosPersona(p) {
    const mapa = new Map();
    const evs = [...(p.evaluaciones || [])].sort(
        (a, b) => new Date(a.fecha || 0) - new Date(b.fecha || 0) || (Number(a.id) - Number(b.id))
    );

    evs.forEach(ev => {
        const nom = String(ev.ejercicio || "").trim();
        if (!nom) return;
        const k = normalizarTextoEjercicioCDM(nom);
        if (!mapa.has(k)) {
            mapa.set(k, { nombre: nom, registros: [] });
        }
        mapa.get(k).registros.push(ev);
    });

    const salida = [];
    mapa.forEach(({ nombre, registros }) => {
        const ult = registros[registros.length - 1];
        const prev = registros.length >= 2 ? registros[registros.length - 2] : null;
        const esMenorMejor = ult.tipo === "tiempo_seg";
        const vals = registros.map(r => Number(r.valor) || 0);
        const mejor = esMenorMejor ? Math.min(...vals) : Math.max(...vals);

        let tendencia = "base"; // 'up' | 'same' | 'down' | 'base'
        let badgeCls = "badge-celeste";
        let deltaTxt = "Base";

        if (prev) {
            const diff = Math.round(((Number(ult.valor) || 0) - (Number(prev.valor) || 0)) * 10) / 10;
            if (Math.abs(diff) < 0.1) {
                tendencia = "same";
                badgeCls = "badge-celeste";
                deltaTxt = "= Igual";
            } else {
                const mejoro = esMenorMejor ? diff < 0 : diff > 0;
                const signo = diff > 0 ? "+" : "";
                tendencia = mejoro ? "up" : "down";
                badgeCls = mejoro ? "badge-ok" : "badge-warn";
                deltaTxt = `${mejoro ? "↑" : "↓"} ${signo}${diff} ${ult.unidad || ""}`.trim();
            }
        }

        salida.push({
            nombre,
            cantidad: registros.length,
            ultimo: ult,
            mejor,
            unidad: ult.unidad || "",
            tendencia,
            badgeCls,
            deltaTxt
        });
    });

    return salida.sort((a, b) => String(b.ultimo.fecha || "").localeCompare(String(a.ultimo.fecha || "")));
}

function obtenerUltimaMarcaPorNombre(p, nombreEj) {
    const k = normalizarTextoEjercicioCDM(nombreEj);
    const hits = (p?.evaluaciones || [])
        .filter(e => normalizarTextoEjercicioCDM(e.ejercicio) === k)
        .sort((a, b) => new Date(a.fecha || 0) - new Date(b.fecha || 0) || (Number(a.id) - Number(b.id)));
    return hits.length ? hits[hits.length - 1] : null;
}

function obtenerRutinasDePersona(p) {
    if (!p) return [];
    return (baseRutinas || []).filter(r =>
        Number(r.personaId) === Number(p.id) ||
        (r.esGrupal && r.deporteDestino === p.deporte && (r.categoriaDestino === p.categoria || r.categoriaDestino === "General"))
    );
}

// =========================================================================
// 3. CABECERA Y NAVEGACIÓN DE PESTAÑAS
// =========================================================================

function cambiarTabFichaJugador(tab, btnEl) {
    tabActualFichaJugador = tab;
    document.querySelectorAll(".jug-seccion").forEach(sec => {
        sec.classList.add("hidden");
        sec.classList.remove("animate-in");
    });

    const target = document.getElementById(`jug-sec-${tab}`);
    if (target) {
        target.classList.remove("hidden");
        target.classList.add("animate-in");
    }

    document.querySelectorAll(".module-tabs .mod-tab").forEach(b => b.classList.remove("active"));
    if (btnEl) {
        btnEl.classList.add("active");
    } else {
        const match = document.querySelector(`.module-tabs .mod-tab[onclick*="'${tab}'"]`);
        if (match) match.classList.add("active");
    }

    const p = obtenerJugadorActualPorURL();
    if (!p) return;

    if (tab === "graficos") {
        renderizarPulsoEjecutivoJugador(p);
        dibujarGraficoEvolucion(p);
        renderizarHistorialEvaluacionesJugador(p);
    } else if (tab === "rutinas") {
        renderizarRutinasJugador(p);
    } else if (tab === "clinica") {
        renderizarClinicoJugador(p);
    }
}

function renderizarCabeceraFichaJugador(p) {
    const cab = document.getElementById("fichaCabeceraJugador");
    if (!cab || !p) return;

    const esGym = p.deporte === "Gimnasio";
    const esAdmin = !esUsuarioFinalEnFicha();
    const edad = calcularEdadExacta(p);
    const sem7 = contarAsistenciasUltimos7Dias(p);
    const pact = p.frecuenciaSemanal || 3;
    const alDia = (p.pagoEstado || "Al Día") === "Al Día";
    const pred = typeof window.calcularPredisposicionJusta === "function"
        ? window.calcularPredisposicionJusta(p, 30)
        : { pct: Math.min(100, Math.round((sem7 / pact) * 100)), etiqueta: "Activa" };

    const lesActivas = (p.lesionesHistorial || []).filter(l => !l.fechaAlta).length;
    const estadoMed = lesActivas > 0 ? `Lesionado (${lesActivas})` : (p.estadoMedico || "Óptimo");
    const badgeMed = estadoMed === "Óptimo" ? "badge-ok" : (estadoMed.startsWith("Lesionado") ? "badge-danger" : "badge-warn");
    const permDep = !esGym && jugadorDeporteTienePermisoProgreso(p);

    const btnVolver = document.getElementById("btnVolverDeporte");
    if (btnVolver) {
        if (esGym) btnVolver.href = "gym.html";
        else if (p.deporte === "Hockey") btnVolver.href = "hockey.html";
        else if (p.deporte === "Futbol") btnVolver.href = "futbol.html";
        else btnVolver.href = `futbol.html?deporte=${encodeURIComponent(p.deporte || "Futbol")}`;
    }

    const tituloSub = document.getElementById("subtituloHeaderJugador");
    if (tituloSub) tituloSub.textContent = `${p.apellido}, ${p.nombre}`;

    // Ajustar etiquetas de pestañas según si es Gym o Deporte
    const tabGraf = document.querySelector(`.module-tabs .mod-tab[onclick*="'graficos'"] span`);
    if (tabGraf) tabGraf.textContent = esGym ? "Mi Cuaderno y Progreso" : "Avances y Evolución 360°";

    cab.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; flex-wrap:wrap;">
            <div style="display:flex; align-items:center; gap:1rem; min-width:0;">
                ${renderAvatarPersonaCDM(p, 68, "1.35rem", true)}
                <div style="min-width:0;">
                    <div style="display:flex; gap:0.35rem; flex-wrap:wrap; margin-bottom:0.3rem;">
                        <span class="badge badge-celeste">${escJF(p.deporte)} • ${esGym ? "Socio Gym" : escJF(p.categoria)}</span>
                        <span class="badge badge-purple">🔑 ${escJF(p.codigoAcceso)}</span>
                        ${!esGym ? `<span class="badge badge-purple">⭐ Score ${p.puntosCategoria}/10</span>` : ""}
                        <span class="badge ${badgeMed}">🩺 ${escJF(estadoMed)}</span>
                        <span class="badge ${alDia ? "badge-ok" : "badge-danger"}">${alDia ? "💳 Al Día" : "⚠️ Cuota Pend."}</span>
                    </div>
                    <h2 style="margin:0; font-size:1.35rem; font-weight:900;">${escJF(p.apellido)}, ${escJF(p.nombre)}</h2>
                    <small style="color:var(--ink-500); font-weight:600;">
                        ${escJF(p.puesto || "General")} • ${edad ? `${edad} años • ` : ""}${p.peso || "-"} kg / ${p.altura || "-"} cm • Asistencia 30d: <b>${pred.pct}%</b> (${sem7}/${pact} sem.)
                    </small>
                </div>
            </div>

            <div class="cab33-actions" style="display:flex; gap:0.4rem; flex-wrap:wrap; align-items:center;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="abrirPanelFotoPerfilCDM(${p.id})"><i class="ri-camera-line"></i> Foto</button>
                ${esAdmin && !esGym ? `
                    <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalScoreFichaRapido(${p.id})"><i class="ri-star-smile-line"></i> Pilares</button>
                    <button type="button" class="btn ${permDep ? "btn-ok" : "btn-ghost"} btn-sm"
                        title="Permitir o bloquear que el deportista anote sus propios avances desde su portal"
                        onclick="alternarPermisoAvancesDeporteJF(${p.id})">
                        ${permDep ? "🔓 Auto-avance: SÍ" : "🔒 Auto-avance: NO"}
                    </button>
                ` : ""}
                ${esAdmin ? `<button type="button" class="btn btn-ghost btn-sm" onclick="abrirInformeIndividualPDF(${p.id})"><i class="ri-file-text-line"></i> Boletín PDF</button>` : ""}
                <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarReciboPagoWhatsApp(${p.id})"><i class="ri-whatsapp-line"></i> WhatsApp</button>
            </div>
        </div>
    `;
}

// =========================================================================
// 4. PULSO EJECUTIVO DIFERENCIADO:
//    A) GIMNASIO -> CUADERNO RÁPIDO DE CARGAS + TABLERO DE PRs
//    B) DEPORTES -> RESUMEN CLARO DE AVANCES (PILARES + PARTIDOS + TESTS)
// =========================================================================

function asegurarContenedorPulsoEjecutivo() {
    const secGraf = document.getElementById("jug-sec-graficos");
    if (!secGraf) return null;
    let box = document.getElementById("jfPulsoEjecutivo");
    if (!box) {
        box = document.createElement("div");
        box.id = "jfPulsoEjecutivo";
        box.className = "jf-pulse-wrap";
        secGraf.prepend(box);
    }
    return box;
}

function renderizarPulsoEjecutivoJugador(p) {
    const box = asegurarContenedorPulsoEjecutivo();
    if (!box || !p) return;

    const esGym = p.deporte === "Gimnasio";
    const resumenEjs = resumirEjerciciosPersona(p);
    const permiteProgreso = puedeGestionarProgresoEnFicha(p);

    if (!ejercicioSeleccionadoFicha && resumenEjs.length) {
        ejercicioSeleccionadoFicha = resumenEjs[0].nombre;
    }

    // -----------------------------------------------------------------
    // A) VISTA GIMNASIO: CUADERNO DE ANOTACIÓN DIARIA + TABLERO DE PRs
    // -----------------------------------------------------------------
    if (esGym) {
        const rutinas = obtenerRutinasDePersona(p);
        const ejsRutina = [];
        rutinas.forEach(r => (r.ejercicios || []).forEach(ex => {
            const n = String(ex.nombre || "").trim();
            if (n && !ejsRutina.some(x => normalizarTextoEjercicioCDM(x) === normalizarTextoEjercicioCDM(n))) {
                ejsRutina.push(n);
            }
        }));

        const ejDefault = ejsRutina[0] || resumenEjs[0]?.nombre || "";
        const ultDef = ejDefault ? obtenerUltimaMarcaPorNombre(p, ejDefault) : null;
        const sem7 = contarAsistenciasUltimos7Dias(p);
        const pact = p.frecuenciaSemanal || 3;
        const imc = (p.peso && p.altura) ? (Number(p.peso) / Math.pow(Number(p.altura) / 100, 2)).toFixed(1) : "-";

        const htmlPrCards = resumenEjs.length === 0
            ? `<div class="empty-box" style="padding:1rem;">Anotá tu primer ejercicio arriba para empezar a ver tus récords y curvas de progreso.</div>`
            : `<div class="jf-pr-grid">${resumenEjs.map(item => `
                <button type="button" class="jf-pr-card ${normalizarTextoEjercicioCDM(ejercicioSeleccionadoFicha) === normalizarTextoEjercicioCDM(item.nombre) ? "is-selected" : ""}"
                    onclick="seleccionarEjercicioCurvaJF('${escJF(item.nombre)}')">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:0.35rem;">
                        <span class="jf-pr-title">${escJF(item.nombre)}</span>
                        <span class="badge ${item.badgeCls}" style="font-size:0.64rem;">${escJF(item.deltaTxt)}</span>
                    </div>
                    <div class="jf-pr-val">${item.ultimo.valor} <small style="font-size:0.72rem; font-weight:700;">${escJF(item.unidad)}</small></div>
                    <div class="jf-pr-sub">Última (${item.ultimo.fecha}): <b>${escJF(item.ultimo.detalle || "-")}</b></div>
                    <div class="jf-pr-sub">🏆 Récord (PR): <b>${item.mejor} ${escJF(item.unidad)}</b> • ${item.cantidad} reg.</div>
                </button>
            `).join("")}</div>`;

        box.innerHTML = `
            <div class="bento-kpis" style="margin-bottom:0;">
                <div class="kpi-card">
                    <div class="kpi-title">Asistencia Semanal</div>
                    <div class="kpi-value">${sem7} / ${pact}</div>
                    <div class="kpi-sub">días en los últimos 7d</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-title">Ejercicios con Progreso</div>
                    <div class="kpi-value">${resumenEjs.length}</div>
                    <div class="kpi-sub">${(p.evaluaciones || []).length} marcas anotadas</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-title">Peso Corporal / IMC</div>
                    <div class="kpi-value">${p.peso || "-"} kg</div>
                    <div class="kpi-sub">Altura ${p.altura || "-"} cm • IMC ${imc}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-title">Rutinas Activas</div>
                    <div class="kpi-value">${rutinas.length}</div>
                    <div class="kpi-sub"><a href="#" onclick="event.preventDefault(); cambiarTabFichaJugador('rutinas')" style="font-weight:800; color:var(--brand-p, #0284c7);">Ir a mis rutinas →</a></div>
                </div>
            </div>

            ${permiteProgreso ? `
                <div class="jf-gym-notebook">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                        <div>
                            <strong style="font-size:0.95rem;">📓 Anotar Entrenamiento de Hoy (Cuaderno Rápido)</strong>
                            <small style="display:block; color:var(--ink-500); font-size:0.75rem;">Elegí el ejercicio de tu rutina o escribí uno, cargá kilos y reps y tu curva se actualiza sola.</small>
                        </div>
                        <span class="badge badge-ok">⚡ 1RM y PR automático</span>
                    </div>

                    <form class="jf-gym-quick-form" onsubmit="registrarCargaRapidaGymFicha(event)">
                        <div class="field jf-qf-ej">
                            <label>Ejercicio *</label>
                            <input type="text" id="jfGymEj" list="listaEjerciciosSugeridos" required
                                value="${escJF(ejDefault)}"
                                placeholder="Ej: Sentadilla, Press Banca..."
                                oninput="actualizarPistaUltimaMarcaGym(this.value)">
                        </div>
                        <div class="field">
                            <label>Peso (kg) *</label>
                            <input type="number" step="0.5" min="0.5" id="jfGymKg" required placeholder="Ej: 60">
                        </div>
                        <div class="field">
                            <label>Reps *</label>
                            <input type="number" min="1" id="jfGymReps" required value="8">
                        </div>
                        <div class="field">
                            <label>Nota (opcional)</label>
                            <input type="text" id="jfGymNota" placeholder="Ej: Salió liviano, subir 2.5kg">
                        </div>
                        <button type="submit" class="btn btn-primary jf-qf-btn" style="min-height:40px;">💾 Anotar</button>
                    </form>

                    ${ejsRutina.length ? `
                        <div style="display:flex; gap:0.32rem; flex-wrap:wrap; margin-top:0.55rem; align-items:center;">
                            <small style="font-size:0.69rem; font-weight:800; color:var(--ink-500);">DE TU RUTINA:</small>
                            ${ejsRutina.slice(0, 8).map(n => `
                                <button type="button" class="btn btn-ghost btn-sm" style="min-height:24px; font-size:0.71rem; padding:0.15rem 0.5rem;"
                                    onclick="elegirEjercicioRapidoGym('${escJF(n)}')">${escJF(n)}</button>
                            `).join("")}
                        </div>
                    ` : ""}

                    <div id="jfGymLastHint" class="jf-gym-last-hint">
                        ${ultDef
                            ? `📌 Última vez (${ultDef.fecha}): <b>${escJF(ultDef.detalle || `${ultDef.valor} ${ultDef.unidad}`)}</b>`
                            : `💡 Sin marca previa para este ejercicio. Anotá hoy tu punto de partida.`}
                    </div>
                </div>
            ` : ""}

            <div class="jf-card">
                <div class="jf-card-head">
                    <h4>🏆 Mis Récords y Evolución por Ejercicio (${resumenEjs.length})</h4>
                    <small style="color:var(--ink-500); font-size:0.74rem;">Tocá cualquier ejercicio para ver su curva abajo</small>
                </div>
                ${htmlPrCards}
            </div>
        `;
        return;
    }

    // -----------------------------------------------------------------
    // B) VISTA DEPORTES: RESUMEN CLARO DE AVANCES EN 3 BLOQUES
    // -----------------------------------------------------------------
    const esAdmin = !esUsuarioFinalEnFicha();
    const an360 = analizarJugador360Admin32(p);
    const stP = an360.partidosStats;
    const pred = typeof window.calcularPredisposicionJusta === "function"
        ? window.calcularPredisposicionJusta(p, 30)
        : { pct: 80, etiqueta: "Buena", cont: { presente: 0, tarde: 0, lesionado: 0, justificado: 0, ausente: 0 } };
    const histScore = Array.isArray(p.historialScore) ? p.historialScore : [];
    const ultCambioScore = histScore[0] || null;
    const lesActivas = (p.lesionesHistorial || []).filter(l => !l.fechaAlta);

    const subiendo = resumenEjs.filter(x => x.tendencia === "up").length;
    const bajando = resumenEjs.filter(x => x.tendencia === "down").length;
    const pulsoTxt = bajando > subiendo ? "A reforzar" : (subiendo > 0 ? "En progreso" : "Estable");
    const pulsoBadge = bajando > subiendo ? "badge-warn" : (subiendo > 0 ? "badge-ok" : "badge-celeste");

    const barraPilar = (lbl, pesoPct, val, col) => `
        <div class="jf-pillar-row">
            <div class="jf-pillar-top">
                <span>${lbl} <small style="opacity:0.65;">(${pesoPct}%)</small></span>
                <b>${Number(val || 7).toFixed(1)} / 10</b>
            </div>
            <div class="jf-bar-track">
                <div class="jf-bar-fill" style="width:${Math.min(100, Math.round((Number(val || 7) / 10) * 100))}%; background:${col};"></div>
            </div>
        </div>
    `;

    box.innerHTML = `
        <div class="jf-grid-3">
            <!-- BLOQUE 1: PILARES Y SCORE -->
            <div class="jf-card">
                <div class="jf-card-head">
                    <h4>⭐ Pilares y Score (${p.puntosCategoria}/10)</h4>
                    ${esAdmin ? `<button type="button" class="btn btn-ghost btn-sm" style="min-height:26px; font-size:0.72rem;" onclick="abrirModalScoreFichaRapido(${p.id})">✏️ Editar</button>` : ""}
                </div>
                ${barraPilar("Físico", 30, p.pilares?.fisico, "#0284c7")}
                ${barraPilar("Gimnasio / Fuerza", 25, p.pilares?.gym, "#6366f1")}
                ${barraPilar("Técnico / Táctico", 25, p.pilares?.tecnico, "#0d9488")}
                ${barraPilar("Actitud / Compromiso", 20, p.pilares?.actitud, "#f59e0b")}
                <div style="margin-top:auto; padding-top:0.45rem; border-top:1px dashed var(--line); font-size:0.73rem; color:var(--ink-500); display:flex; justify-content:space-between; gap:0.4rem; flex-wrap:wrap;">
                    <span>${ultCambioScore
                        ? `Últ. ajuste (${ultCambioScore.fecha}): <b>${ultCambioScore.delta >= 0 ? "+" : ""}${ultCambioScore.delta}</b> (${escJF(ultCambioScore.origen)})`
                        : (p.motivoPuntos ? `Nota: ${escJF(p.motivoPuntos)}` : "Sin ajustes recientes")}</span>
                    ${Number(p.pilares?.bonus || 0) !== 0 ? `<span class="badge badge-purple">Bonus ${p.pilares.bonus > 0 ? "+" : ""}${p.pilares.bonus}</span>` : ""}
                </div>
            </div>

            <!-- BLOQUE 2: APORTE EN CANCHA (PARTIDOS) -->
            <div class="jf-card">
                <div class="jf-card-head">
                    <h4>🏟️ Aporte en Partidos</h4>
                    <span class="badge badge-celeste">${stP.pj} PJ</span>
                </div>
                <div class="jf-match-stats">
                    <div class="jf-mstat"><strong>${stP.pj}</strong><small>Partidos</small></div>
                    <div class="jf-mstat"><strong>${stP.goles}</strong><small>Goles</small></div>
                    <div class="jf-mstat"><strong>${stP.asistencias}</strong><small>Asist.</small></div>
                    <div class="jf-mstat"><strong>${stP.amarillas}/${stP.rojas}</strong><small>Tarj.</small></div>
                </div>
                <div style="display:flex; flex-direction:column; gap:0.32rem; max-height:115px; overflow-y:auto;">
                    ${stP.eventosRecientes.length === 0
                        ? `<small style="color:var(--ink-500); font-size:0.75rem;">Sin incidencias cargadas en partidos oficiales todavía.</small>`
                        : stP.eventosRecientes.slice(0, 4).map(ev => `
                            <div style="font-size:0.74rem; padding:0.32rem 0.5rem; background:var(--surface-subtle); border-radius:8px; display:flex; justify-content:space-between; gap:0.4rem;">
                                <span><b>${escJF(ev.tipo)}</b> • ${escJF(ev.rival)}</span>
                                <small style="color:var(--ink-500); white-space:nowrap;">${ev.fecha}</small>
                            </div>
                        `).join("")}
                </div>
            </div>

            <!-- BLOQUE 3: PULSO FÍSICO, ASISTENCIA Y SALUD -->
            <div class="jf-card">
                <div class="jf-card-head">
                    <h4>🩺 Pulso Físico y Salud</h4>
                    <span class="badge ${pulsoBadge}">${pulsoTxt}</span>
                </div>
                <div style="display:flex; flex-direction:column; gap:0.42rem; font-size:0.78rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span>🔥 Predisposición (30 días)</span>
                        <span class="badge ${pred.pct >= 80 ? "badge-ok" : pred.pct >= 60 ? "badge-warn" : "badge-danger"}">${pred.pct}% (${pred.etiqueta})</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span>📈 Tests en alza / a revisar</span>
                        <b>${subiendo} ↑ / ${bajando} ↓</b>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span>🩹 Lesiones activas</span>
                        <b>${lesActivas.length > 0 ? `🔴 ${lesActivas.map(l => l.zona).join(", ")}` : "🟢 Ninguna"}</b>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span>🔓 Auto-avance del jugador</span>
                        <b>${jugadorDeporteTienePermisoProgreso(p) ? "Habilitado" : "Solo profesor"}</b>
                    </div>
                </div>
                ${esAdmin && typeof window.abrirModalAnatomiaYLesiones === "function" ? `
                    <div style="margin-top:auto; display:flex; gap:0.35rem; flex-wrap:wrap; padding-top:0.4rem; border-top:1px dashed var(--line);">
                        <button type="button" class="btn btn-secondary btn-sm" style="flex:1; min-height:28px; font-size:0.72rem;" onclick="abrirModalAnatomiaYLesiones(${p.id}, 'lesiones')">🩹 Lesiones</button>
                        <button type="button" class="btn btn-ghost btn-sm" style="flex:1; min-height:28px; font-size:0.72rem;" onclick="abrirModalAnatomiaYLesiones(${p.id}, 'predisposicion')">🔥 Rúbrica</button>
                    </div>
                ` : ""}
            </div>
        </div>

        <!-- TABLERO DE PRUEBAS FÍSICAS Y TESTS -->
        ${permiteProgreso || esAdmin ? `
            <div class="jf-card">
                <div class="jf-card-head">
                    <h4>📊 Tablero de Pruebas y Tests Físicos (${resumenEjs.length})</h4>
                    <small style="color:var(--ink-500); font-size:0.74rem;">Tocá cualquier prueba para enfocar su gráfico abajo</small>
                </div>
                ${resumenEjs.length === 0
                    ? `<div class="empty-box" style="padding:0.9rem;">Sin pruebas físicas cargadas todavía. Registrá el primer test abajo.</div>`
                    : `<div class="jf-pr-grid">${resumenEjs.map(item => `
                        <button type="button" class="jf-pr-card ${normalizarTextoEjercicioCDM(ejercicioSeleccionadoFicha) === normalizarTextoEjercicioCDM(item.nombre) ? "is-selected" : ""}"
                            onclick="seleccionarEjercicioCurvaJF('${escJF(item.nombre)}')">
                            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.35rem;">
                                <span class="jf-pr-title">${escJF(item.nombre)}</span>
                                <span class="badge ${item.badgeCls}" style="font-size:0.64rem;">${escJF(item.deltaTxt)}</span>
                            </div>
                            <div class="jf-pr-val">${item.ultimo.valor} <small style="font-size:0.72rem; font-weight:700;">${escJF(item.unidad)}</small></div>
                            <div class="jf-pr-sub">${item.ultimo.fecha} • PR: <b>${item.mejor} ${escJF(item.unidad)}</b></div>
                        </button>
                    `).join("")}</div>`}
            </div>
        ` : `
            <div class="jf-card" style="text-align:center;">
                <div style="font-size:0.84rem; color:var(--ink-600);">🔒 El seguimiento de marcas y auto-registro está administrado exclusivamente por el profesor en esta disciplina.</div>
            </div>
        `}
    `;
}

window.seleccionarEjercicioCurvaJF = function (nombreEj) {
    ejercicioSeleccionadoFicha = nombreEj;
    const p = obtenerJugadorActualPorURL();
    if (!p) return;
    const sel = document.getElementById("selectFiltroEjercicioGrafico");
    if (sel) sel.value = nombreEj;
    renderizarPulsoEjecutivoJugador(p);
    dibujarGraficoEvolucion(p);
    document.getElementById("canvasEvolucionJugador")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
};

window.elegirEjercicioRapidoGym = function (nombreEj) {
    const inp = document.getElementById("jfGymEj");
    if (inp) {
        inp.value = nombreEj;
        actualizarPistaUltimaMarcaGym(nombreEj);
        document.getElementById("jfGymKg")?.focus();
    }
};

window.actualizarPistaUltimaMarcaGym = function (nombreEj) {
    const p = obtenerJugadorActualPorURL();
    const hint = document.getElementById("jfGymLastHint");
    if (!p || !hint) return;
    const ult = nombreEj ? obtenerUltimaMarcaPorNombre(p, nombreEj) : null;
    hint.innerHTML = ult
        ? `📌 Última vez (${ult.fecha}): <b>${escJF(ult.detalle || `${ult.valor} ${ult.unidad}`)}</b>`
        : `💡 Sin marca previa para "${escJF(nombreEj || "...")}". Anotá hoy tu punto de partida.`;
};

window.registrarCargaRapidaGymFicha = function (e) {
    e.preventDefault();
    const p = obtenerJugadorActualPorURL();
    if (!p || !puedeGestionarProgresoEnFicha(p)) return;

    const ejRaw = (document.getElementById("jfGymEj")?.value || "").trim();
    const kg = parseFloat(document.getElementById("jfGymKg")?.value);
    const reps = Math.max(1, parseInt(document.getElementById("jfGymReps")?.value, 10) || 1);
    const nota = (document.getElementById("jfGymNota")?.value || "").trim();

    if (!ejRaw || isNaN(kg) || kg <= 0) {
        alert("⚠️ Ingresá el ejercicio y un peso válido en kg.");
        return;
    }

    const ejercicio = typeof agregarEjercicioInventadoAlCatalogoCDM === "function"
        ? (agregarEjercicioInventadoAlCatalogoCDM(ejRaw, "fuerza_kg", true) || ejRaw)
        : ejRaw;

    const rm = Math.round((reps === 1 ? kg : kg * (1 + reps / 30)) * 10) / 10;
    const detalle = reps > 1 ? `${kg} kg × ${reps} reps (1RM: ${rm} kg)` : `${kg} kg × 1 rep`;

    p.evaluaciones.push({
        id: Date.now(),
        fecha: obtenerHoyISO(),
        ejercicio,
        tipo: "fuerza_kg",
        valor: rm,
        unidad: "kg (1RM)",
        detalle,
        nota: nota || "Cuaderno Gym"
    });
    p.evaluaciones.sort((a, b) => new Date(a.fecha || 0) - new Date(b.fecha || 0) || (Number(a.id) - Number(b.id)));

    ejercicioSeleccionadoFicha = ejercicio;
    if (typeof window.registrarSnapshotPersona === "function") {
        window.registrarSnapshotPersona(p, `Marca ${ejercicio}`);
    }
    guardarDatosCDM();
    mostrarToast(`💪 Anotado: ${ejercicio} (${detalle})`);
    inicializarPaginaJugadorIndividual();
};

// =========================================================================
// 5. EVALUACIÓN DE PILARES (SCORE 360°), FORMULARIO DE TESTS Y GRÁFICOS
// =========================================================================

function abrirModalScoreFichaRapido(idPersona) {
    const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
    if (!p || p.deporte === "Gimnasio") return;
    asegurarPilaresPersona(p);

    const modal = document.getElementById("modalPersona");
    if (!modal) return;

    modal.innerHTML = `
        <div class="modal-window" style="max-width:520px;">
            <div class="modal-top">
                <div>
                    <span class="badge badge-purple">EVALUACIÓN DE PILARES (1–10)</span>
                    <h3 style="margin-top:4px;">${escJF(p.apellido)}, ${escJF(p.nombre)}</h3>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('modalPersona').classList.add('hidden')">✕</button>
            </div>
            <form onsubmit="guardarScoreModalFicha(event, ${p.id})">
                <div class="grid-2" style="margin-bottom:0.65rem;">
                    <div class="field"><label>Físico (30%)</label><input type="number" step="0.1" min="1" max="10" id="scFisico" value="${p.pilares.fisico}" required></div>
                    <div class="field"><label>Gimnasio / Fuerza (25%)</label><input type="number" step="0.1" min="1" max="10" id="scGym" value="${p.pilares.gym}" required></div>
                    <div class="field"><label>Técnico / Táctico (25%)</label><input type="number" step="0.1" min="1" max="10" id="scTecnico" value="${p.pilares.tecnico}" required></div>
                    <div class="field"><label>Actitud / Compromiso (20%)</label><input type="number" step="0.1" min="1" max="10" id="scActitud" value="${p.pilares.actitud}" required></div>
                </div>
                <div class="grid-2" style="margin-bottom:0.85rem;">
                    <div class="field"><label>Bonus / Ajuste (-5 a +5)</label><input type="number" step="0.1" min="-5" max="5" id="scBonus" value="${p.pilares.bonus || 0}"></div>
                    <div class="field"><label>Motivo del Ajuste</label><input type="text" id="scMotivo" value="${escJF(p.motivoPuntos || "")}" placeholder="Ej: Progreso del mes"></div>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;">💾 Guardar Pilares y Score</button>
            </form>
        </div>
    `;
    modal.classList.remove("hidden");
}

function guardarScoreModalFicha(e, idPersona) {
    e.preventDefault();
    const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
    if (!p) return;
    asegurarPilaresPersona(p);

    const anterior = p.puntosCategoria;
    p.pilares.fisico = normalizarNota1a10(document.getElementById("scFisico")?.value, p.pilares.fisico);
    p.pilares.gym = normalizarNota1a10(document.getElementById("scGym")?.value, p.pilares.gym);
    p.pilares.tecnico = normalizarNota1a10(document.getElementById("scTecnico")?.value, p.pilares.tecnico);
    p.pilares.actitud = normalizarNota1a10(document.getElementById("scActitud")?.value, p.pilares.actitud);
    p.pilares.bonus = normalizarBonus1a10(document.getElementById("scBonus")?.value);
    p.motivoPuntos = (document.getElementById("scMotivo")?.value || "").trim();

    recalcularPuntajePonderado(p);
    registrarEventoScore32(p, anterior, p.puntosCategoria, "Evaluación de Pilares", p.motivoPuntos);
    guardarDatosCDM();
    document.getElementById("modalPersona")?.classList.add("hidden");
    mostrarToast(`⭐ Score actualizado: ${p.puntosCategoria}/10`);
    inicializarPaginaJugadorIndividual();
}

function cambiarTipoMedicion() {
    const tipo = document.getElementById("evTipo")?.value || "fuerza_kg";
    const lbl = document.getElementById("lblEvValor");
    const inp = document.getElementById("evValor");
    const blkReps = document.getElementById("bloqueReps");
    const blkSimple = document.getElementById("bloqueValorSimple");
    const blkUni = document.getElementById("bloqueUnilateral");

    if (blkUni) blkUni.classList.toggle("hidden", tipo !== "unilateral");
    if (blkSimple) blkSimple.classList.toggle("hidden", tipo === "unilateral");
    if (blkReps) blkReps.classList.toggle("hidden", tipo !== "fuerza_kg");

    if (!lbl || !inp) return;
    if (tipo === "fuerza_kg") {
        lbl.textContent = "Carga (kg) *";
        inp.placeholder = "80";
    } else if (tipo === "salto_cm") {
        lbl.textContent = "Altura de Salto (cm) *";
        inp.placeholder = "38";
    } else if (tipo === "tiempo_seg") {
        lbl.textContent = "Tiempo (segundos) *";
        inp.placeholder = "3.15";
    } else if (tipo === "reps_puntos") {
        lbl.textContent = "Repeticiones / Puntos *";
        inp.placeholder = "12";
    }
}

function registrarAvanceJugador(e) {
    e.preventDefault();
    const p = obtenerJugadorActualPorURL();
    if (!p) return;

    if (!puedeGestionarProgresoEnFicha(p)) {
        alert("🔒 El registro de avances en Deportes solo está habilitado cuando el profesor lo autoriza.");
        return;
    }

    const fecha = document.getElementById("evFecha")?.value || obtenerHoyISO();
    const ejRaw = (document.getElementById("evEjercicio")?.value || "").trim();
    if (!ejRaw) return;

    const tipo = document.getElementById("evTipo")?.value || "fuerza_kg";
    const ejercicio = typeof agregarEjercicioInventadoAlCatalogoCDM === "function"
        ? (agregarEjercicioInventadoAlCatalogoCDM(ejRaw, tipo, true) || ejRaw)
        : ejRaw;
    const nota = (document.getElementById("evNota")?.value || "").trim();

    let valor = 0, unidad = "", detalle = "";

    if (tipo === "unilateral") {
        const izq = parseFloat(document.getElementById("evIzq")?.value) || 0;
        const der = parseFloat(document.getElementById("evDer")?.value) || 0;
        const prom = Math.round(((izq + der) / 2) * 10) / 10;
        const mayor = Math.max(izq, der);
        const asim = mayor > 0 ? Math.round((Math.abs(izq - der) / mayor) * 100) : 0;
        valor = prom;
        unidad = "prom.";
        detalle = `Izq: ${izq} • Der: ${der} (Asimetría ${asim}%)`;
    } else if (tipo === "fuerza_kg") {
        const kg = parseFloat(document.getElementById("evValor")?.value) || 0;
        const reps = Math.max(1, parseInt(document.getElementById("evReps")?.value, 10) || 1);
        const rm = Math.round((reps === 1 ? kg : kg * (1 + reps / 30)) * 10) / 10;
        valor = rm;
        unidad = "kg (1RM)";
        detalle = reps > 1 ? `${kg} kg × ${reps} reps (1RM: ${rm} kg)` : `${kg} kg × 1 rep`;
    } else if (tipo === "salto_cm") {
        const cm = parseFloat(document.getElementById("evValor")?.value) || 0;
        valor = cm;
        unidad = "cm";
        detalle = `${cm} cm`;
    } else if (tipo === "tiempo_seg") {
        const seg = parseFloat(document.getElementById("evValor")?.value) || 0;
        valor = seg;
        unidad = "seg";
        detalle = `${seg} seg`;
    } else {
        const pts = parseFloat(document.getElementById("evValor")?.value) || 0;
        valor = pts;
        unidad = "pts/reps";
        detalle = `${pts}`;
    }

    p.evaluaciones.push({ id: Date.now(), fecha, ejercicio, tipo, valor, unidad, detalle, nota });
    p.evaluaciones.sort((a, b) => new Date(a.fecha || 0) - new Date(b.fecha || 0) || (Number(a.id) - Number(b.id)));
    ejercicioSeleccionadoFicha = ejercicio;

    guardarDatosCDM();
    if (document.getElementById("evValor")) document.getElementById("evValor").value = "";
    if (document.getElementById("evNota")) document.getElementById("evNota").value = "";
    mostrarToast(`📈 Marca guardada: ${ejercicio} (${detalle})`);
    inicializarPaginaJugadorIndividual();
}

function eliminarEvaluacionJugador(idEval) {
    if (!confirm("🗑️ ¿Eliminar este registro de avance?")) return;
    const p = obtenerJugadorActualPorURL();
    if (!p) return;
    p.evaluaciones = (p.evaluaciones || []).filter(e => Number(e.id) !== Number(idEval));
    guardarDatosCDM();
    mostrarToast("🗑️ Registro eliminado.");
    inicializarPaginaJugadorIndividual();
}

function dibujarGraficoEvolucion(pOpt = null) {
    const p = pOpt || obtenerJugadorActualPorURL();
    if (!p) return;

    const esGym = p.deporte === "Gimnasio";
    const sel = document.getElementById("selectFiltroEjercicioGrafico");
    const kpisDiv = document.getElementById("kpisEvolucionEjercicio");
    const cvLine = document.getElementById("canvasEvolucionJugador");
    const cvRadar = document.getElementById("canvasRadarJugador");
    const splitCharts = cvLine?.closest(".split-equal");

    if (splitCharts) {
        splitCharts.classList.toggle("jf-charts-single", esGym);
    }

    const resumenEjs = resumirEjerciciosPersona(p);
    const ejerciciosUnicos = resumenEjs.map(r => r.nombre);

    if (sel) {
        const candidato = ejercicioSeleccionadoFicha || sel.value;
        sel.innerHTML = ejerciciosUnicos.length
            ? ejerciciosUnicos.map(nom => `<option value="${escJF(nom)}">${escJF(nom)}</option>`).join("")
            : `<option value="">-- Sin marcas cargadas --</option>`;
        if (candidato && ejerciciosUnicos.includes(candidato)) sel.value = candidato;
        ejercicioSeleccionadoFicha = sel.value || ejerciciosUnicos[0] || "";
    }

    const ejActual = sel?.value || ejerciciosUnicos[0] || "";
    const serie = (p.evaluaciones || [])
        .filter(e => e.ejercicio === ejActual)
        .sort((a, b) => new Date(a.fecha || 0) - new Date(b.fecha || 0) || (Number(a.id) - Number(b.id)));

    const itemRes = resumenEjs.find(r => r.nombre === ejActual) || null;

    if (kpisDiv) {
        if (!serie.length) {
            kpisDiv.innerHTML = `
                <div class="kpi-card" style="grid-column:1/-1;">
                    <div class="kpi-title">Sin marcas todavía</div>
                    <div class="kpi-sub">${esGym ? "Anotá un ejercicio en tu cuaderno de arriba para ver la curva." : "Cargá un test o marca a la izquierda para comenzar."}</div>
                </div>
            `;
        } else {
            kpisDiv.innerHTML = `
                <div class="kpi-card">
                    <div class="kpi-title">Último Registro</div>
                    <div class="kpi-value">${itemRes.ultimo.valor} <small style="font-size:0.74rem;">${escJF(itemRes.unidad)}</small></div>
                    <div class="kpi-sub">${itemRes.ultimo.fecha}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-title">Mejor Marca (PR)</div>
                    <div class="kpi-value">${itemRes.mejor} <small style="font-size:0.74rem;">${escJF(itemRes.unidad)}</small></div>
                    <div class="kpi-sub">${itemRes.cantidad} registro(s)</div>
                </div>
                <div class="kpi-card" style="grid-column:span 2;">
                    <div class="kpi-title">Tendencia Reciente</div>
                    <div class="kpi-value"><span class="badge ${itemRes.badgeCls}">${escJF(itemRes.deltaTxt)}</span></div>
                    <div class="kpi-sub">${escJF(itemRes.ultimo.detalle || "")}</div>
                </div>
            `;
        }
    }

    const isDark = document.body?.getAttribute("data-theme") === "dark";
    const gridCol = isDark ? "rgba(148, 163, 184, 0.14)" : "rgba(15, 23, 42, 0.08)";
    const tickCol = isDark ? "#cbd5e1" : "#475569";
    const brandColor = getComputedStyle(document.documentElement).getPropertyValue("--brand-p").trim() || "#0284c7";

    if (typeof Chart !== "undefined" && cvLine) {
        if (chartInstancia) { chartInstancia.destroy(); chartInstancia = null; }
        if (serie.length > 0) {
            chartInstancia = new Chart(cvLine.getContext("2d"), {
                type: "line",
                data: {
                    labels: serie.map(s => s.fecha),
                    datasets: [{
                        label: `${ejActual} (${serie[0].unidad || ""})`,
                        data: serie.map(s => Number(s.valor) || 0),
                        borderColor: brandColor,
                        backgroundColor: "rgba(2, 132, 199, 0.14)",
                        pointBackgroundColor: brandColor,
                        pointRadius: 4.5,
                        borderWidth: 2.8,
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: tickCol } } },
                    scales: {
                        x: { ticks: { color: tickCol }, grid: { color: gridCol } },
                        y: { ticks: { color: tickCol }, grid: { color: gridCol } }
                    }
                }
            });
        }
    }

    if (typeof Chart !== "undefined" && cvRadar) {
        if (chartRadarInstancia) { chartRadarInstancia.destroy(); chartRadarInstancia = null; }
        if (!esGym && p.pilares) {
            cvRadar.parentElement.classList.remove("hidden");
            chartRadarInstancia = new Chart(cvRadar.getContext("2d"), {
                type: "radar",
                data: {
                    labels: ["Físico", "Gimnasio", "Técnico", "Actitud"],
                    datasets: [{
                        label: `${p.nombre} (1-10)`,
                        data: [p.pilares.fisico, p.pilares.gym, p.pilares.tecnico, p.pilares.actitud],
                        borderColor: "#7c3aed",
                        backgroundColor: "rgba(124, 58, 237, 0.2)",
                        borderWidth: 2.2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: tickCol } } },
                    scales: {
                        r: {
                            min: 0,
                            max: 10,
                            ticks: { stepSize: 2, color: tickCol, backdropColor: "transparent" },
                            grid: { color: gridCol },
                            pointLabels: { color: tickCol, font: { weight: "700" } }
                        }
                    }
                }
            });
        } else {
            cvRadar.parentElement.classList.add("hidden");
        }
    }
}

function refrescarGraficosFichaActual() {
    const p = obtenerJugadorActualPorURL();
    if (p && tabActualFichaJugador === "graficos") dibujarGraficoEvolucion(p);
}

function renderizarHistorialEvaluacionesJugador(p) {
    const cont = document.getElementById("contenedorHistorialJugador");
    if (!cont || !p) return;

    const permitirEditar = puedeGestionarProgresoEnFicha(p);
    const items = [...(p.evaluaciones || [])].sort(
        (a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0) || (Number(b.id) - Number(a.id))
    );

    if (!items.length) {
        cont.innerHTML = `<div class="empty-box">Todavía no hay marcas ni tests registrados.</div>`;
        return;
    }

    cont.innerHTML = `
        <div class="table-wrap">
            <table class="app-table" style="font-size:0.8rem;">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Ejercicio / Prueba</th>
                        <th>Marca</th>
                        <th>Nota</th>
                        ${permitirEditar ? "<th></th>" : ""}
                    </tr>
                </thead>
                <tbody>
                    ${items.map(ev => `
                        <tr>
                            <td><b>${escJF(ev.fecha || "-")}</b></td>
                            <td>
                                <button type="button" class="btn btn-ghost btn-sm" style="padding:0 6px; min-height:24px; font-weight:700;"
                                    onclick="seleccionarEjercicioCurvaJF('${escJF(ev.ejercicio)}')">${escJF(ev.ejercicio)}</button>
                            </td>
                            <td><span class="badge badge-celeste">${escJF(ev.detalle || `${ev.valor} ${ev.unidad || ""}`)}</span></td>
                            <td><small>${escJF(ev.nota || "-")}</small></td>
                            ${permitirEditar ? `<td style="text-align:right;"><button type="button" class="btn btn-danger btn-sm" style="min-height:24px; padding:0 6px;" onclick="eliminarEvaluacionJugador(${ev.id})">✕</button></td>` : ""}
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

// =========================================================================
// 6. RUTINAS INDIVIDUALES, WHATSAPP Y ANOTACIÓN INLINE DE CARGAS
// =========================================================================

function agregarFilaEjercicioIndividual(datos = null) {
    const cont = document.getElementById("contenedorFilasRutinaIndividual");
    if (!cont) return;
    const row = document.createElement("div");
    row.className = "ex-builder-row";
    row.style.cssText = "display:grid; grid-template-columns:1.6fr repeat(3, 0.7fr) auto; gap:0.35rem; align-items:center; margin-bottom:0.45rem;";
    row.innerHTML = `
        <input type="text" class="ri-ej" list="listaEjerciciosSugeridos" required placeholder="Ejercicio" value="${escJF(datos?.nombre || "")}">
        <input type="text" class="ri-ser" placeholder="Series" value="${escJF(datos?.series || "3")}">
        <input type="text" class="ri-rep" placeholder="Reps" value="${escJF(datos?.reps || "10")}">
        <input type="text" class="ri-kg" placeholder="Peso/Pausa" value="${escJF(datos?.peso || "Moderado")}">
        <button type="button" class="btn btn-ghost btn-sm" onclick="this.parentElement.remove()">✕</button>
    `;
    cont.appendChild(row);
}

function cargarPlantillaIndividual(tipo) {
    const cont = document.getElementById("contenedorFilasRutinaIndividual");
    if (!cont) return;
    cont.innerHTML = "";
    const presets = {
        superior: [
            { nombre: "Press de Banca Plano", series: "4", reps: "8", peso: "Moderado" },
            { nombre: "Remo Unilateral con Mancuerna", series: "3", reps: "10", peso: "Moderado" },
            { nombre: "Press Militar de Hombros", series: "3", reps: "10", peso: "Moderado" },
            { nombre: "Dominadas / Jalón al Pecho", series: "3", reps: "8-10", peso: "Control" }
        ],
        inferior: [
            { nombre: "Sentadilla Trasera con Barra", series: "4", reps: "8", peso: "Moderado" },
            { nombre: "Peso Muerto Rumano", series: "3", reps: "10", peso: "Moderado" },
            { nombre: "Hip Thrust con Barra", series: "3", reps: "10", peso: "Firme" },
            { nombre: "Sentadilla Búlgara Unilateral", series: "3", reps: "10 c/u", peso: "Control" }
        ],
        rehab: [
            { nombre: "Plancha Abdominal RKC", series: "3", reps: "30s", peso: "Control" },
            { nombre: "Sentadilla Búlgara Unilateral", series: "3", reps: "8 c/u", peso: "Progresivo" },
            { nombre: "Salto al Cajón / CMJ", series: "3", reps: "6", peso: "Sin dolor" }
        ]
    };
    (presets[tipo] || presets.superior).forEach(ex => agregarFilaEjercicioIndividual(ex));
}

function guardarRutinaIndividual(e) {
    e.preventDefault();
    const p = obtenerJugadorActualPorURL();
    if (!p) return;

    const filas = Array.from(document.querySelectorAll("#contenedorFilasRutinaIndividual .ex-builder-row"));
    const ejercicios = filas.map(f => ({
        nombre: (f.querySelector(".ri-ej")?.value || "").trim(),
        series: (f.querySelector(".ri-ser")?.value || "3").trim(),
        reps: (f.querySelector(".ri-rep")?.value || "10").trim(),
        peso: (f.querySelector(".ri-kg")?.value || "Libre").trim(),
        pausa: "60-90s"
    })).filter(x => x.nombre);

    if (!ejercicios.length) {
        alert("⚠️ Agregá al menos un ejercicio a la rutina.");
        return;
    }

    ejercicios.forEach(ex => {
        if (typeof agregarEjercicioInventadoAlCatalogoCDM === "function") {
            agregarEjercicioInventadoAlCatalogoCDM(ex.nombre, "fuerza_kg", true);
        }
    });

    baseRutinas.unshift({
        id: Date.now(),
        personaId: p.id,
        esGrupal: false,
        deporteDestino: p.deporte,
        categoriaDestino: p.categoria,
        nombre: (document.getElementById("rutNombre")?.value || "").trim(),
        objetivo: document.getElementById("rutObjetivo")?.value || "Funcional y Core",
        dias: (document.getElementById("rutDias")?.value || "A definir").trim(),
        notas: (document.getElementById("rutNotas")?.value || "").trim(),
        ejercicios
    });

    guardarDatosCDM();
    document.getElementById("formRutinaIndividual")?.reset();
    document.getElementById("contenedorFilasRutinaIndividual").innerHTML = "";
    agregarFilaEjercicioIndividual();
    mostrarToast("💪 Rutina individual guardada.");
    renderizarRutinasJugador(p);
    if (p.deporte === "Gimnasio") renderizarPulsoEjecutivoJugador(p);
}

window.eliminarRutinaJugadorJF = function (idRutina) {
    if (!confirm("🗑️ ¿Eliminar esta rutina?")) return;
    baseRutinas = (baseRutinas || []).filter(r => Number(r.id) !== Number(idRutina));
    guardarDatosCDM();
    mostrarToast("🗑️ Rutina eliminada.");
    const p = obtenerJugadorActualPorURL();
    if (p) renderizarRutinasJugador(p);
};

window.enviarRutinaWhatsAppJugadorJF = function (idRutina) {
    const p = obtenerJugadorActualPorURL();
    const r = (baseRutinas || []).find(x => Number(x.id) === Number(idRutina));
    if (!p || !r) return;
    const tel = String(p.whatsapp || "").replace(/\D/g, "");
    const club = obtenerLicenciaConfigCDM().nombreEntidad;
    const lista = (r.ejercicios || [])
        .map((ex, i) => `${i + 1}. *${ex.nombre}* — ${ex.series}×${ex.reps} (${ex.peso || "Libre"} | Pausa ${ex.pausa || "60s"})`)
        .join("\n");
    const msg = `💪 *RUTINA ASIGNADA — ${club}*\n👤 ${p.nombre} ${p.apellido}\n📋 *${r.nombre}* (${r.objetivo})\n📅 Días: ${r.dias || "A definir"}\n\n${lista}${r.notas ? `\n\n📝 Nota: ${r.notas}` : ""}`;
    window.open(tel ? `https://wa.me/${tel}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
};

window.registrarMarcaDesdeRutinaFicha = function (e) {
    e.preventDefault();
    const p = obtenerJugadorActualPorURL();
    if (!p || !puedeGestionarProgresoEnFicha(p)) return;

    const form = e.target;
    const ejercicio = (form.dataset.ejercicio || "").trim();
    const kg = parseFloat(form.querySelector(".js-rf-kg")?.value);
    const reps = Math.max(1, parseInt(form.querySelector(".js-rf-reps")?.value, 10) || 1);
    const nota = (form.querySelector(".js-rf-nota")?.value || "").trim();

    if (!ejercicio || isNaN(kg) || kg <= 0) {
        alert("⚠️ Ingresá un peso válido en kg.");
        return;
    }

    const rm = Math.round((reps === 1 ? kg : kg * (1 + reps / 30)) * 10) / 10;
    const detalle = reps > 1 ? `${kg} kg × ${reps} reps (1RM: ${rm} kg)` : `${kg} kg × 1 rep`;

    p.evaluaciones.push({
        id: Date.now(),
        fecha: obtenerHoyISO(),
        ejercicio,
        tipo: "fuerza_kg",
        valor: rm,
        unidad: "kg (1RM)",
        detalle,
        nota: nota || "Anotado en rutina"
    });
    p.evaluaciones.sort((a, b) => new Date(a.fecha || 0) - new Date(b.fecha || 0) || (Number(a.id) - Number(b.id)));
    ejercicioSeleccionadoFicha = ejercicio;

    if (typeof window.registrarSnapshotPersona === "function") {
        window.registrarSnapshotPersona(p, `Marca ${ejercicio}`);
    }
    guardarDatosCDM();
    mostrarToast(`💪 Anotado en rutina: ${ejercicio} (${detalle})`);
    renderizarRutinasJugador(p);
};

function renderizarRutinasJugador(p) {
    const cont = document.getElementById("listaRutinasGuardadasJugador");
    if (!cont || !p) return;

    const esAdmin = !esUsuarioFinalEnFicha();
    const permiteAnotar = puedeGestionarProgresoEnFicha(p);
    const lista = obtenerRutinasDePersona(p);

    if (!lista.length) {
        cont.innerHTML = `<div class="empty-box" style="grid-column:1/-1;">Sin rutinas asignadas todavía.</div>`;
        return;
    }

    cont.innerHTML = lista.map(r => `
        <div class="athlete-card" style="cursor:default;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.4rem;">
                <div>
                    <span class="badge ${r.esGrupal ? "badge-purple" : "badge-celeste"}">${r.esGrupal ? "🏟️ Grupal" : "👤 Personal"}</span>
                    <h4 style="margin-top:4px;">${escJF(r.nombre)}</h4>
                    <small style="color:var(--ink-500);">${escJF(r.objetivo)} • ${escJF(r.dias || "Libre")}</small>
                </div>
                <div style="display:flex; gap:0.25rem; flex-shrink:0;">
                    <button type="button" class="btn btn-whatsapp btn-sm" style="min-height:28px; font-size:0.72rem;" onclick="enviarRutinaWhatsAppJugadorJF(${r.id})" title="Enviar por WhatsApp">📲 WA</button>
                    ${esAdmin && !r.esGrupal ? `<button type="button" class="btn btn-danger btn-sm" style="min-height:28px; padding:0 7px;" onclick="eliminarRutinaJugadorJF(${r.id})" title="Eliminar rutina">🗑️</button>` : ""}
                </div>
            </div>

            ${r.notas ? `<div style="font-size:0.76rem; color:var(--ink-600); background:var(--surface-subtle); padding:0.4rem 0.6rem; border-radius:8px; margin-top:0.35rem;">📝 ${escJF(r.notas)}</div>` : ""}

            <div style="margin-top:0.55rem; display:flex; flex-direction:column; gap:0.45rem;">
                ${(r.ejercicios || []).map((ex, i) => {
                    const vid = (baseVideoteca || []).find(v => normalizarTextoEjercicioCDM(v.nombre).includes(normalizarTextoEjercicioCDM(ex.nombre)));
                    const ult = permiteAnotar ? obtenerUltimaMarcaPorNombre(p, ex.nombre) : null;
                    return `
                        <div class="jf-rut-ex-box">
                            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem; flex-wrap:wrap;">
                                <b>${i + 1}. ${escJF(ex.nombre)}</b>
                                ${vid ? `<button type="button" class="btn btn-primary btn-sm" style="min-height:24px; font-size:0.69rem; padding:0 8px;" onclick="abrirModalReproductorEjercicio(${vid.id})">▶ Video</button>` : ""}
                            </div>
                            <div style="font-size:0.74rem; color:var(--ink-500); margin-top:2px;">
                                📊 ${escJF(ex.series)}×${escJF(ex.reps)} • 🏋️ ${escJF(ex.peso || "Libre")} • ⏱️ ${escJF(ex.pausa || "60s")}
                            </div>
                            ${ult ? `<div style="margin-top:3px; font-size:0.72rem; font-weight:700; color:var(--brand-p-ink, #0369a1);">📌 Última vez (${ult.fecha}): ${escJF(ult.detalle || `${ult.valor} ${ult.unidad}`)}</div>` : ""}
                            ${permiteAnotar ? `
                                <form class="jf-rut-inline-form" data-ejercicio="${escJF(ex.nombre)}" onsubmit="registrarMarcaDesdeRutinaFicha(event)">
                                    <input type="number" step="0.5" min="0.5" class="js-rf-kg" placeholder="Kg" required style="width:68px;">
                                    <input type="number" min="1" class="js-rf-reps" placeholder="Reps" value="8" style="width:60px;">
                                    <input type="text" class="js-rf-nota" placeholder="Nota opc." style="flex:1; min-width:85px;">
                                    <button type="submit" class="btn btn-ok btn-sm" style="min-height:30px; font-size:0.71rem;">+ Anotar</button>
                                </form>
                            ` : ""}
                        </div>
                    `;
                }).join("")}
            </div>
        </div>
    `).join("");
}

// =========================================================================
// 7. ANTROPOMETRÍA, FATIGA Y LESIONES
// =========================================================================

function guardarClinicoJugador(e) {
    e.preventDefault();
    const p = obtenerJugadorActualPorURL();
    if (!p) return;
    if (typeof window.asegurarEstructuraProPersona === "function") window.asegurarEstructuraProPersona(p);

    const fecha = document.getElementById("medFecha")?.value || obtenerHoyISO();
    const peso = parseFloat(document.getElementById("medPeso")?.value) || p.peso;
    const sueno = parseInt(document.getElementById("medSueno")?.value, 10) || 4;
    const rpe = parseInt(document.getElementById("medRPE")?.value, 10) || 6;
    const estado = document.getElementById("medEstadoGeneral")?.value || "Óptimo";
    const dolor = (document.getElementById("medDolor")?.value || "").trim() || estado;

    p.peso = peso;
    p.estadoMedico = estado;
    p.clinico.push({ id: Date.now(), fecha, peso, altura: p.altura, sueno, rpe, dolor });

    if (typeof window.registrarSnapshotPersona === "function") {
        window.registrarSnapshotPersona(p, "Control Clínico");
    }
    guardarDatosCDM();
    mostrarToast("🩺 Control de salud y estado guardados.");
    inicializarPaginaJugadorIndividual();
}

function renderizarClinicoJugador(p) {
    const cont = document.getElementById("contenedorClinicoJugador");
    if (!cont || !p) return;

    const esAdmin = !esUsuarioFinalEnFicha();
    const lista = [...(p.clinico || [])].reverse();
    const lesiones = [...(p.lesionesHistorial || [])].sort((a, b) => String(b.fechaBaja || "").localeCompare(String(a.fechaBaja || "")));
    const imc = (p.peso && p.altura) ? (Number(p.peso) / Math.pow(Number(p.altura) / 100, 2)).toFixed(1) : "-";

    const bloqueLesiones = lesiones.length > 0 ? `
        <div style="margin-bottom:0.85rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                <strong style="font-size:0.83rem;">🩹 Historial de Lesiones (${lesiones.length})</strong>
                ${esAdmin && typeof window.abrirModalAnatomiaYLesiones === "function"
                    ? `<button type="button" class="btn btn-secondary btn-sm" style="min-height:26px; font-size:0.71rem;" onclick="abrirModalAnatomiaYLesiones(${p.id}, 'lesiones')">Gestionar</button>`
                    : ""}
            </div>
            <div style="display:flex; flex-direction:column; gap:0.4rem;">
                ${lesiones.map(l => `
                    <div style="padding:0.55rem 0.75rem; background:var(--surface-subtle); border:1px solid var(--line); border-left:4px solid ${l.fechaAlta ? "#10b981" : "#ef4444"}; border-radius:11px; font-size:0.78rem;">
                        <b>${escJF(l.zona)} (${escJF(l.lado)}) — ${escJF(l.tipo)}</b>
                        <span class="badge ${l.fechaAlta ? "badge-ok" : "badge-danger"}" style="margin-left:5px; font-size:0.65rem;">${l.fechaAlta ? `Alta ${l.fechaAlta}` : "En recuperación"}</span>
                        ${l.nota ? `<div style="color:var(--ink-600); margin-top:2px;">${escJF(l.nota)}</div>` : ""}
                    </div>
                `).join("")}
            </div>
        </div>
    ` : "";

    const resumenActual = `
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.8rem;">
            <span class="badge badge-celeste">⚖️ Peso: ${p.peso || "-"} kg</span>
            <span class="badge badge-celeste">📏 Altura: ${p.altura || "-"} cm</span>
            <span class="badge badge-purple">🧮 IMC: ${imc}</span>
            ${p.grasaPct != null ? `<span class="badge badge-ok">Grasa: ${p.grasaPct}%</span>` : ""}
            ${esAdmin && typeof window.abrirModalAnatomiaYLesiones === "function"
                ? `<button type="button" class="btn btn-ghost btn-sm" style="margin-left:auto; min-height:26px; font-size:0.72rem;" onclick="abrirModalAnatomiaYLesiones(${p.id}, 'anatomia')">🧬 Control Completo</button>`
                : ""}
        </div>
    `;

    const bloqueControles = !lista.length
        ? `<div class="empty-box" style="padding:1rem;">Sin controles de peso o fatiga registrados.</div>`
        : lista.map(c => `
            <div style="padding:0.62rem 0.78rem; background:var(--surface-subtle); border:1px solid var(--line); border-radius:12px; margin-bottom:0.45rem; font-size:0.8rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem; flex-wrap:wrap;">
                    <b>📅 ${escJF(c.fecha)}</b>
                    <span class="badge badge-celeste">${c.peso} kg • RPE ${c.rpe || "-"}${c.cargaUA ? ` (${c.cargaUA} UA)` : ""} • Sueño ${c.sueno || "-"}/5</span>
                </div>
                <div style="color:var(--ink-600); margin-top:3px;">${escJF(c.dolor || "-")}</div>
            </div>
        `).join("");

    cont.innerHTML = resumenActual + bloqueLesiones + bloqueControles;
}

// =========================================================================
// 8. BOLETÍN INDIVIDUAL PDF A4
// =========================================================================

window.abrirInformeIndividualPDF = function (idPersona) {
    const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
    if (!p) return;
    asegurarPilaresPersona(p);
    if (typeof window.asegurarEstructuraProPersona === "function") window.asegurarEstructuraProPersona(p);

    const esGym = p.deporte === "Gimnasio";
    const lic = obtenerLicenciaConfigCDM();
    const resumenEjs = resumirEjerciciosPersona(p);
    const pred = typeof window.calcularPredisposicionJusta === "function" ? window.calcularPredisposicionJusta(p, 30) : { pct: 100, etiqueta: "Activa" };
    const an = analizarJugador360Admin32(p);

    const html = `
        <div style="display:flex; justify-content:space-between; border-bottom:2.5px solid #0284c7; padding-bottom:0.75rem; margin-bottom:1rem;">
            <div>
                <div style="font-size:0.68rem; font-weight:800; color:#0284c7;">INFORME INDIVIDUAL DE EVOLUCIÓN</div>
                <h2 style="margin:2px 0; font-size:1.35rem;">${escJF(p.apellido)}, ${escJF(p.nombre)}</h2>
                <small>${escJF(lic.nombreEntidad)} • ${escJF(p.deporte)} (${esGym ? "Socio Gym" : escJF(p.categoria)}) • ${escJF(p.puesto || "-")}</small>
            </div>
            <div style="text-align:right; font-size:0.78rem;">
                <b>Fecha:</b> ${new Date().toLocaleDateString("es-AR")}<br>
                <b>Edad:</b> ${calcularEdadExacta(p)} años • ${p.peso || "-"} kg / ${p.altura || "-"} cm<br>
                <b>Asistencia 30d:</b> ${pred.pct}% (${pred.etiqueta})
            </div>
        </div>

        ${!esGym ? `
            <h4 style="margin:0 0 6px;">1. Pilares y Rendimiento Deportivo (Score: ${p.puntosCategoria}/10)</h4>
            <table style="margin-bottom:0.9rem;">
                <thead><tr><th>Físico (30%)</th><th>Gimnasio (25%)</th><th>Técnico (25%)</th><th>Actitud (20%)</th><th>Partidos / Goles / Asist.</th></tr></thead>
                <tbody><tr><td>${p.pilares?.fisico ?? "-"}</td><td>${p.pilares?.gym ?? "-"}</td><td>${p.pilares?.tecnico ?? "-"}</td><td>${p.pilares?.actitud ?? "-"}</td><td>${an.partidosStats.pj} PJ • ${an.partidosStats.goles} G • ${an.partidosStats.asistencias} A</td></tr></tbody>
            </table>
        ` : ""}

        <h4 style="margin:0 0 6px;">${esGym ? "1." : "2."} Marcas y Récords Personales (${resumenEjs.length})</h4>
        <table style="margin-bottom:0.9rem;">
            <thead><tr><th>Ejercicio / Prueba</th><th>Última Fecha</th><th>Último Registro</th><th>Mejor Marca (PR)</th><th>Tendencia</th></tr></thead>
            <tbody>
                ${resumenEjs.length === 0 ? `<tr><td colspan="5">Sin marcas registradas.</td></tr>` :
                resumenEjs.map(r => `<tr><td><b>${escJF(r.nombre)}</b></td><td>${r.ultimo.fecha}</td><td>${escJF(r.ultimo.detalle || `${r.ultimo.valor} ${r.unidad}`)}</td><td><b>${r.mejor} ${escJF(r.unidad)}</b></td><td>${escJF(r.deltaTxt)}</td></tr>`).join("")}
            </tbody>
        </table>

        <div style="margin-top:1.8rem; display:flex; justify-content:space-between; font-size:0.76rem; color:#475569;">
            <span>Estado Médico: <b>${escJF(p.estadoMedico || "Óptimo")}</b></span>
            <span style="text-align:right;">______________________________<br>Firma Profesor / Entrenador</span>
        </div>
    `;
    imprimirDocumentoA4Limpio(html);
};

// =========================================================================
// 9. INICIALIZACIÓN CENTRAL DE JUGADOR.HTML
// =========================================================================

function inicializarPaginaJugadorIndividual() {
    if (document.body?.dataset.page !== "perfil-individual") return;
    inyectarCSSJugadorFichaPro();

    const p = obtenerJugadorActualPorURL();
    if (!p) {
        const cab = document.getElementById("fichaCabeceraJugador");
        if (cab) cab.innerHTML = `<div class="empty-box">No se encontró el deportista o socio solicitado.</div>`;
        return;
    }

    const esGym = p.deporte === "Gimnasio";
    const esAdmin = !esUsuarioFinalEnFicha();
    const puedeProgreso = puedeGestionarProgresoEnFicha(p);

    if (document.getElementById("evFecha") && !document.getElementById("evFecha").value) {
        document.getElementById("evFecha").value = obtenerHoyISO();
    }
    if (document.getElementById("medFecha") && !document.getElementById("medFecha").value) {
        document.getElementById("medFecha").value = obtenerHoyISO();
    }

    // Mostrar/ocultar el panel del formulario avanzado según rol y deporte
    const formAvancePanel = document.getElementById("formNuevoAvance")?.closest(".app-panel");
    const splitAvance = formAvancePanel?.parentElement;
    if (formAvancePanel) {
        // En Gym el cuaderno rápido superior ya resuelve el día a día; ocultamos el form técnico al usuario final
        const ocultarFormTecnico = !puedeProgreso || (esGym && !esAdmin);
        formAvancePanel.classList.toggle("hidden", ocultarFormTecnico);
        if (splitAvance && splitAvance.classList.contains("split-view")) {
            splitAvance.style.gridTemplateColumns = ocultarFormTecnico ? "1fr" : "";
        }
    }

    // Ocultar formulario de crear rutina al usuario final
    const formRutPanel = document.getElementById("formRutinaIndividual")?.closest(".app-panel");
    const splitRut = formRutPanel?.parentElement;
    if (formRutPanel) {
        formRutPanel.classList.toggle("hidden", !esAdmin);
        if (splitRut && splitRut.classList.contains("split-view")) {
            splitRut.style.gridTemplateColumns = !esAdmin ? "1fr" : "";
        }
    }

    const contFilas = document.getElementById("contenedorFilasRutinaIndividual");
    if (contFilas && contFilas.children.length === 0) {
        agregarFilaEjercicioIndividual();
    }

    sincronizarDatalistsEjerciciosCDM();
    renderizarCabeceraFichaJugador(p);
    cambiarTabFichaJugador(tabActualFichaJugador || "graficos");
}