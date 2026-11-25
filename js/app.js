/**
 * js/app.js — Motor Core Unificado | CDM Pro Suite
 * Desarrollado por Gonzalo Adanchú
 * Responsabilidades:
 *   1. Estado global + Persistencia localStorage + Sync con server.js
 *   2. Guardia de sesión (js/login.js) + Modo Día / Noche
 *   3. Normalización de Personas (Edad exacta, Doble Categoría, Score 1-10)
 *   4. Catálogo Unificado de Ejercicios + Fotos de Perfil + Backup / Demo
 *   5. Portal Ejecutivo Moderno (index.html) + Inicializador modular seguro
 */

// =========================================================================
// 1. ESTADO GLOBAL Y VARIABLES DE SESIÓN
// =========================================================================

let basePersonas = JSON.parse(localStorage.getItem("cdm_personas_v1")) || [];
let baseRutinas = JSON.parse(localStorage.getItem("cdm_rutinas_v1")) || [];
let basePartidos = JSON.parse(localStorage.getItem("cdm_partidos_v1")) || [];
let baseAlineaciones = JSON.parse(localStorage.getItem("cdm_alineaciones_v2")) || {};
let baseMicrociclos = JSON.parse(localStorage.getItem("cdm_microciclos_v1")) || {};
let baseVideoteca = JSON.parse(localStorage.getItem("cdm_videoteca_v1")) || [];

const EJERCICIOS_BASE_CDM = [
    { id: "ej_1", nombre: "Sentadilla Trasera con Barra", grupo: "Tren Inferior", tipo: "fuerza_kg", patron: "squat", video: "" },
    { id: "ej_2", nombre: "Press de Banca Plano", grupo: "Empuje / Torso", tipo: "fuerza_kg", patron: "bench", video: "" },
    { id: "ej_3", nombre: "Peso Muerto Rumano", grupo: "Tren Inferior", tipo: "fuerza_kg", patron: "deadlift", video: "" },
    { id: "ej_4", nombre: "Sentadilla Búlgara Unilateral", grupo: "Tren Inferior", tipo: "unilateral", patron: "lunge", video: "" },
    { id: "ej_5", nombre: "Dominadas / Jalón al Pecho", grupo: "Tracción / Espalda", tipo: "reps_puntos", patron: "pull", video: "" },
    { id: "ej_6", nombre: "Hip Thrust con Barra", grupo: "Tren Inferior", tipo: "fuerza_kg", patron: "thrust", video: "" },
    { id: "ej_7", nombre: "Remo Unilateral con Mancuerna", grupo: "Tracción / Espalda", tipo: "fuerza_kg", patron: "row", video: "" },
    { id: "ej_8", nombre: "Press Militar de Hombros", grupo: "Empuje / Torso", tipo: "fuerza_kg", patron: "ohp", video: "" },
    { id: "ej_9", nombre: "Plancha Abdominal RKC", grupo: "Core y Funcional", tipo: "tiempo_seg", patron: "plank", video: "" },
    { id: "ej_10", nombre: "Salto al Cajón / CMJ", grupo: "Potencia y Pliometría", tipo: "salto_cm", patron: "jump", video: "" },
    { id: "ej_11", nombre: "Sprint 20 Metros", grupo: "Velocidad", tipo: "tiempo_seg", patron: "jump", video: "" }
];

let baseCatalogoEjercicios = JSON.parse(localStorage.getItem("cdm_catalogo_ej_v1")) || [...EJERCICIOS_BASE_CDM];

const paramDeporteURL = new URLSearchParams(window.location.search).get("deporte");
let deportePagina = paramDeporteURL ? paramDeporteURL.trim() : (document.body?.dataset?.deporte || null);
let categoriaActiva = "Sub 13";

// Instancias globales de Chart.js
let chartInstancia = null;
let chartRadarInstancia = null;
let chartAsistenciaInstancia = null;
let chartPagosInstancia = null;

// Estado en vivo de Cancha Partido
let eventosPartidoActual = [];
let minutoPartidoActual = 0;
let periodoPartidoActual = "1T";
let timerIntervaloPartido = null;
let slotCanchaSeleccionadoIndex = null;
let golesLocalActual = 0;
let golesVisitaActual = 0;

if (typeof Chart !== "undefined") {
    Chart.defaults.font.family = "'Poppins', sans-serif";
    Chart.defaults.color = "#64748b";
    Chart.defaults.scale.grid.color = "rgba(0,0,0,0.04)";
    Chart.defaults.plugins.tooltip.backgroundColor = "rgba(5, 19, 33, 0.94)";
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
}

// =========================================================================
// 2. LICENCIA, CLAVE DE COMERCIO, FECHAS Y UTILIDADES GENERALES
// =========================================================================

function obtenerClaveClubActivoCDM() {
    return localStorage.getItem("cdm_club_activo_id_v1") || "cdm_adelia_maria_principal";
}

function obtenerLicenciaConfigCDM() {
    const def = {
        nombreEntidad: "CDM Adelia María",
        siglaCodigo: "CDM",
        modulos: { futbol: true, hockey: true, gym: true, consultorio: false },
        deportesExtra: [],
        profesionesHabilitadas: []
    };
    try {
        const g = JSON.parse(localStorage.getItem("cdm_licencia_config_v1") || "null");
        if (g && typeof g === "object") {
            return { ...def, ...g, modulos: { ...def.modulos, ...(g.modulos || {}) } };
        }
    } catch {}
    return def;
}

function obtenerHoyISO() {
    return new Date().toISOString().split("T")[0];
}

function isoHaceDias(dias) {
    const d = new Date();
    d.setDate(d.getDate() - dias);
    return d.toISOString().split("T")[0];
}

function normalizarTextoEjercicioCDM(txt) {
    return String(txt || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function mostrarToast(mensaje) {
    let cont = document.querySelector(".toast-container");
    if (!cont) {
        cont = document.createElement("div");
        cont.className = "toast-container";
        document.body.appendChild(cont);
    }
    const toast = document.createElement("div");
    toast.className = "cdm-toast";
    toast.innerHTML = mensaje;
    cont.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function irAPaginaIndividual(idPersona) {
    window.location.href = `jugador.html?id=${idPersona}`;
}

function contarAsistenciasUltimos7Dias(persona) {
    if (!Array.isArray(persona?.asistencias)) return 0;
    const hoy = new Date();
    let contador = 0;
    for (let i = 0; i < 7; i++) {
        const d = new Date(hoy);
        d.setDate(hoy.getDate() - i);
        if (persona.asistencias.includes(d.toISOString().split("T")[0])) contador++;
    }
    return contador;
}

// =========================================================================
// 3. MODO DÍA / MODO NOCHE Y GUARDIA DE SESIÓN
// =========================================================================

function obtenerTemaActualCDM() {
    return localStorage.getItem("cdm_theme_mode_v1") || localStorage.getItem("cdm_tema") || "light";
}

function aplicarTemaGuardadoCDM() {
    const esOscuro = obtenerTemaActualCDM() === "dark";
    if (document.body) {
        if (esOscuro) document.body.setAttribute("data-theme", "dark");
        else document.body.removeAttribute("data-theme");
    }
    if (typeof Chart !== "undefined") {
        Chart.defaults.color = esOscuro ? "#94a3b8" : "#64748b";
        Chart.defaults.scale.grid.color = esOscuro ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
    }
    document.querySelectorAll("#btnToggleTemaCDM, .btn-theme-toggle").forEach(btn => {
        btn.innerHTML = esOscuro
            ? `<i class="ri-sun-fill"></i><span>Modo Día</span>`
            : `<i class="ri-moon-clear-fill"></i><span>Modo Noche</span>`;
    });
}

function alternarTemaVisualCDM() {
    const nuevo = document.body.getAttribute("data-theme") === "dark" ? "light" : "dark";
    localStorage.setItem("cdm_theme_mode_v1", nuevo);
    localStorage.setItem("cdm_tema", nuevo);
    aplicarTemaGuardadoCDM();
    mostrarToast(nuevo === "dark" ? "🌙 Modo Noche activado" : "☀️ Modo Día activado");

    if (deportePagina === "Gimnasio" && typeof dibujarGraficosColectivosGym === "function") {
        dibujarGraficosColectivosGym();
    }
    if (document.body.dataset.page === "perfil-individual" && typeof refrescarGraficosFichaActual === "function") {
        refrescarGraficosFichaActual();
    }
}

aplicarTemaGuardadoCDM();

// Guardia inmediato de sesión + carga automática de js/login.js
(function () {
    const esLogin = window.location.pathname.toLowerCase().includes("login.html");
    const sesion = localStorage.getItem("cdm_sesion_activa_v1");
    if (!sesion && !esLogin) {
        window.location.replace("login.html");
        return;
    }
    if (!document.querySelector('script[src*="login.js"]')) {
        const s = document.createElement("script");
        s.src = "js/login.js";
        s.onload = () => {
            if (typeof verificarAccesoYRolEnApp === "function") verificarAccesoYRolEnApp();
        };
        document.head.appendChild(s);
    }
})();

// =========================================================================
// 4. NORMALIZACIÓN DE PERSONAS (EDAD EXACTA, DOBLE CATEGORÍA Y SCORE 1-10)
// =========================================================================

function normalizarNota1a10(valor, defecto = 7.0) {
    let n = parseFloat(valor);
    if (isNaN(n)) return defecto;
    if (n > 10) n = n / 10;
    return Math.min(10, Math.max(1, Math.round(n * 10) / 10));
}

function normalizarBonus1a10(valor) {
    let b = parseFloat(valor);
    if (isNaN(b)) return 0;
    if (Math.abs(b) > 5) b = b / 10;
    return Math.max(-5, Math.min(5, Math.round(b * 10) / 10));
}

function calcularEdadExacta(p) {
    if (!p) return 0;
    if (p.fechaNacimiento && /^\d{4}-\d{2}-\d{2}$/.test(p.fechaNacimiento)) {
        const [y, m, d] = p.fechaNacimiento.split("-").map(Number);
        const hoy = new Date();
        let edad = hoy.getFullYear() - y;
        const mm = hoy.getMonth() + 1;
        if (mm < m || (mm === m && hoy.getDate() < d)) edad--;
        return Math.max(0, edad);
    }
    return parseInt(p.edad, 10) || 0;
}

function obtenerAnioNacimiento(p) {
    if (p?.fechaNacimiento && /^\d{4}/.test(p.fechaNacimiento)) return parseInt(p.fechaNacimiento.slice(0, 4), 10);
    if (p?.anioNacimiento) return parseInt(p.anioNacimiento, 10);
    return new Date().getFullYear() - (parseInt(p?.edad, 10) || 15);
}

function generarCodigoPersonalCDM(lista = basePersonas) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let bloque = "";
    for (let i = 0; i < 4; i++) bloque += chars.charAt(Math.floor(Math.random() * chars.length));
    const sigla = String(obtenerLicenciaConfigCDM().siglaCodigo || "CDM").toUpperCase();
    const cod = `${sigla}-${bloque}`;
    return Array.isArray(lista) && lista.some(x => x && x.codigoAcceso === cod)
        ? generarCodigoPersonalCDM(lista)
        : cod;
}

function verificarVencimientoCuota30DiasCDM(p) {
    if (!p || !p.ultimoPagoFecha || (p.pagoEstado || "Al Día") !== "Al Día") return;
    const pagoMs = new Date(p.ultimoPagoFecha).getTime();
    if (!isNaN(pagoMs) && Math.floor((Date.now() - pagoMs) / 86400000) > 30) {
        p.pagoEstado = "Pendiente";
    }
}

function recalcularPuntajePonderado(p) {
    if (!p || p.deporte === "Gimnasio") {
        if (p) p.puntosCategoria = null;
        return null;
    }
    if (!p.pilares) return 7.0;
    const base =
        (Number(p.pilares.fisico || 7) * 0.30) +
        (Number(p.pilares.gym || 7) * 0.25) +
        (Number(p.pilares.tecnico || 7) * 0.25) +
        (Number(p.pilares.actitud || 7) * 0.20);
    const total = base + Number(p.pilares.bonus || 0);
    p.puntosCategoria = Math.min(10, Math.max(1, Math.round(total * 10) / 10));
    return p.puntosCategoria;
}

function asegurarPilaresPersona(p) {
    if (!p) return;
    if (!p.codigoAcceso) p.codigoAcceso = generarCodigoPersonalCDM(basePersonas);
    if (!Array.isArray(p.asistencias)) p.asistencias = [];
    if (!Array.isArray(p.evaluaciones)) p.evaluaciones = [];
    if (!Array.isArray(p.clinico)) p.clinico = [];
    if (!Array.isArray(p.historialPagos)) p.historialPagos = [];
    if (!Array.isArray(p.categoriasExtra)) p.categoriasExtra = [];
    if (!Array.isArray(p.historialCategorias)) p.historialCategorias = [];
    if (!Array.isArray(p.historialScore)) p.historialScore = [];

    // Sincronizar edad y año de nacimiento (Base General)
    if (!p.anioNacimiento) p.anioNacimiento = obtenerAnioNacimiento(p);
    if (p.fechaNacimiento) p.edad = calcularEdadExacta(p);

    verificarVencimientoCuota30DiasCDM(p);

    if (p.deporte === "Gimnasio") {
        p.puntosCategoria = null;
        return;
    }

    const baseIni = normalizarNota1a10(p.puntosCategoria, 7.0);
    if (!p.pilares) {
        p.pilares = { fisico: baseIni, gym: baseIni, tecnico: baseIni, actitud: baseIni, bonus: 0 };
    } else {
        p.pilares.fisico = normalizarNota1a10(p.pilares.fisico, baseIni);
        p.pilares.gym = normalizarNota1a10(p.pilares.gym, baseIni);
        p.pilares.tecnico = normalizarNota1a10(p.pilares.tecnico, baseIni);
        p.pilares.actitud = normalizarNota1a10(p.pilares.actitud, baseIni);
        p.pilares.bonus = normalizarBonus1a10(p.pilares.bonus);
    }
    recalcularPuntajePonderado(p);
}

// =========================================================================
// 5. CATÁLOGO UNIFICADO DE EJERCICIOS (ÚNICA FUENTE DE VERDAD)
// =========================================================================

function obtenerTodosLosNombresEjerciciosCDM() {
    const mapa = new Map();
    const reg = (nom) => {
        const limpio = String(nom || "").trim();
        const k = normalizarTextoEjercicioCDM(limpio);
        if (k && !mapa.has(k)) mapa.set(k, limpio);
    };
    (baseCatalogoEjercicios || []).forEach(e => reg(e.nombre));
    (baseVideoteca || []).forEach(v => reg(v.nombre));
    (basePersonas || []).forEach(p => (p.evaluaciones || []).forEach(ev => reg(ev.ejercicio)));
    (baseRutinas || []).forEach(r => (r.ejercicios || []).forEach(ex => reg(ex.nombre)));
    return Array.from(mapa.values());
}

function sincronizarDatalistsEjerciciosCDM() {
    const opciones = obtenerTodosLosNombresEjerciciosCDM()
        .map(nom => `<option value="${nom.replace(/"/g, "&quot;")}">`)
        .join("");

    ["listaEjerciciosGymAdmin", "listaEjerciciosSugeridos", "listaSugerenciasGym"].forEach(id => {
        const dl = document.getElementById(id);
        if (dl) dl.innerHTML = opciones;
    });
}

function agregarEjercicioInventadoAlCatalogoCDM(nombreRaw, tipoMedicion = "fuerza_kg", silencioso = false, extra = {}) {
    const limpio = String(nombreRaw || "").replace(/\s+/g, " ").trim();
    if (!limpio) return null;

    const clave = normalizarTextoEjercicioCDM(limpio);
    const ya = (baseCatalogoEjercicios || []).find(e => normalizarTextoEjercicioCDM(e.nombre) === clave);
    if (ya) return ya.nombre;

    baseCatalogoEjercicios.unshift({
        id: "ej_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        nombre: limpio,
        grupo: extra.grupo || "General",
        tipo: tipoMedicion || "fuerza_kg",
        patron: extra.patron || "squat",
        video: extra.video || "",
        personalizado: true
    });
    localStorage.setItem("cdm_catalogo_ej_v1", JSON.stringify(baseCatalogoEjercicios));
    sincronizarDatalistsEjerciciosCDM();
    if (!silencioso) mostrarToast(`✨ Ejercicio "${limpio}" agregado a la Base Maestra.`);
    return limpio;
}

// =========================================================================
// 6. PERSISTENCIA LOCAL, SINCRONIZACIÓN CON SERVER.JS Y BACKUP JSON
// =========================================================================

function guardarDatosCDM(omitirSyncServidor = false) {
    basePersonas.forEach(p => asegurarPilaresPersona(p));
    localStorage.setItem("cdm_personas_v1", JSON.stringify(basePersonas));
    localStorage.setItem("cdm_rutinas_v1", JSON.stringify(baseRutinas));
    localStorage.setItem("cdm_partidos_v1", JSON.stringify(basePartidos));
    localStorage.setItem("cdm_alineaciones_v2", JSON.stringify(baseAlineaciones));
    localStorage.setItem("cdm_microciclos_v1", JSON.stringify(baseMicrociclos));
    localStorage.setItem("cdm_videoteca_v1", JSON.stringify(baseVideoteca));
    localStorage.setItem("cdm_catalogo_ej_v1", JSON.stringify(baseCatalogoEjercicios));

    if (!omitirSyncServidor) sincronizarCambiosHaciaServidorCDM();
}

function sincronizarCambiosHaciaServidorCDM() {
    if (window.location.protocol === "file:") return;
    try {
        const claveClub = obtenerClaveClubActivoCDM();
        if (typeof guardarSnapshotClubActualEnMapaLocal === "function") {
            guardarSnapshotClubActualEnMapaLocal();
        }
        const sesion = JSON.parse(localStorage.getItem("cdm_sesion_activa_v1") || "null");
        if (sesion?.rol === "usuario" && sesion.personaId) {
            const miPersona = basePersonas.find(x => Number(x.id) === Number(sesion.personaId));
            if (miPersona) {
                fetch(`/api/cdm/jugador/${miPersona.id}/sync`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ claveClub, personaActualizada: miPersona, catalogoEjercicios: baseCatalogoEjercicios })
                }).catch(() => {});
            }
            return;
        }

        fetch("/api/cdm/estado", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                claveClub,
                personas: basePersonas,
                rutinas: baseRutinas,
                partidos: basePartidos,
                alineaciones: baseAlineaciones,
                microciclos: baseMicrociclos,
                videoteca: baseVideoteca,
                catalogoEjercicios: baseCatalogoEjercicios,
                licenciaConfig: obtenerLicenciaConfigCDM()
            })
        }).catch(() => {});
    } catch {}
}

async function sincronizarEstadoDesdeServidorCDM() {
    if (window.location.protocol === "file:") return false;
    try {
        const params = new URLSearchParams(window.location.search);
        const clubUrl = params.get("club") || params.get("cliente");
        if (clubUrl) {
            const limpio = clubUrl.trim().toLowerCase().replace(/[^a-z0-9_\-]/g, "_");
            if (limpio) localStorage.setItem("cdm_club_activo_id_v1", limpio);
        }
        const claveClub = obtenerClaveClubActivoCDM();
        const resp = await fetch(`/api/cdm/estado?club=${encodeURIComponent(claveClub)}`, { cache: "no-store" });
        if (!resp.ok) return false;
        const est = (await resp.json())?.estado;
        if (!est) return false;

        if (est.licenciaConfig && Object.keys(est.licenciaConfig).length > 0) {
            localStorage.setItem("cdm_licencia_config_v1", JSON.stringify(est.licenciaConfig));
            if (typeof aplicarLicenciaYModulosCDM === "function") aplicarLicenciaYModulosCDM();
        }

        const esSecundario = claveClub !== "cdm_adelia_maria_principal";
        if ((Array.isArray(est.personas) && est.personas.length > 0) || esSecundario) {
            basePersonas = Array.isArray(est.personas) ? est.personas : [];
            baseRutinas = Array.isArray(est.rutinas) ? est.rutinas : [];
            basePartidos = Array.isArray(est.partidos) ? est.partidos : [];
            baseAlineaciones = est.alineaciones && typeof est.alineaciones === "object" ? est.alineaciones : {};
            baseMicrociclos = est.microciclos && typeof est.microciclos === "object" ? est.microciclos : {};
            if (Array.isArray(est.videoteca) && est.videoteca.length > 0) baseVideoteca = est.videoteca;
            if (Array.isArray(est.catalogoEjercicios) && est.catalogoEjercicios.length > 0) baseCatalogoEjercicios = est.catalogoEjercicios;
            guardarDatosCDM(true);
            return true;
        } else if (basePersonas.length > 0) {
            sincronizarCambiosHaciaServidorCDM();
        }
    } catch {}
    return false;
}

function exportarBackupJSON() {
    const dataObj = {
        fechaExportacion: obtenerHoyISO(),
        personas: basePersonas,
        rutinas: baseRutinas,
        partidos: basePartidos,
        alineaciones: baseAlineaciones,
        microciclos: baseMicrociclos,
        videoteca: baseVideoteca,
        catalogoEjercicios: baseCatalogoEjercicios
    };
    const a = document.createElement("a");
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataObj, null, 2));
    a.download = `cdm_backup_${obtenerHoyISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    mostrarToast("📥 Backup descargado correctamente.");
}

function importarBackupJSON(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!Array.isArray(data.personas)) throw new Error("Archivo JSON inválido.");
            if (!confirm("⚠️ ¿Restaurar esta copia de seguridad? Reemplazará los datos actuales.")) return;
            basePersonas = data.personas || [];
            baseRutinas = data.rutinas || [];
            basePartidos = data.partidos || [];
            baseAlineaciones = data.alineaciones || {};
            baseMicrociclos = data.microciclos || {};
            if (Array.isArray(data.videoteca) && data.videoteca.length) baseVideoteca = data.videoteca;
            if (Array.isArray(data.catalogoEjercicios) && data.catalogoEjercicios.length) baseCatalogoEjercicios = data.catalogoEjercicios;
            guardarDatosCDM();
            mostrarToast("✅ Backup restaurado.");
            setTimeout(() => window.location.reload(), 700);
        } catch (err) {
            alert("No se pudo leer el backup: " + err.message);
        }
    };
    reader.readAsText(file);
}

function limpiarTodoElSistema() {
    if (!confirm("⚠️ ¿Vaciar todos los datos del sistema?")) return;
    basePersonas = [];
    baseRutinas = [];
    basePartidos = [];
    baseAlineaciones = {};
    baseMicrociclos = {};
    guardarDatosCDM();
    mostrarToast("🗑️ Sistema limpio.");
    setTimeout(() => window.location.reload(), 500);
}

// =========================================================================
// 7. MOTOR DE FOTOS DE PERFIL (COMPRESIÓN CUADRADA + MODAL)
// =========================================================================

function obtenerInicialesPersonaCDM(p) {
    return `${(p?.nombre || "A").trim().charAt(0)}${(p?.apellido || "B").trim().charAt(0)}`.toUpperCase();
}

function renderAvatarPersonaCDM(p, size = 54, fontSize = "1.1rem", editable = false) {
    if (!p) return "";
    const clickAttr = editable
        ? `onclick="event.stopPropagation(); abrirPanelFotoPerfilCDM(${p.id})" title="Cambiar o quitar foto"`
        : "";
    const camBadge = editable ? `<span class="avatar-cam-badge"><i class="ri-camera-fill"></i></span>` : "";
    const inner = p.foto
        ? `<img src="${p.foto}" alt="${p.nombre || ""}" class="ath-avatar-img">`
        : `<span>${obtenerInicialesPersonaCDM(p)}</span>`;

    return `<div class="ath-avatar ${p.foto ? "has-photo" : ""} ${editable ? "avatar-editable" : ""}" style="width:${size}px; height:${size}px; font-size:${fontSize};" ${clickAttr}>${inner}${camBadge}</div>`;
}

function comprimirImagenArchivoCDM(file, maxSide = 320, quality = 0.84, callback) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
            const c = document.createElement("canvas");
            c.width = maxSide;
            c.height = maxSide;
            const ctx = c.getContext("2d");
            const min = Math.min(img.width, img.height);
            ctx.fillStyle = "#071526";
            ctx.fillRect(0, 0, maxSide, maxSide);
            ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, maxSide, maxSide);
            callback(c.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => alert("⚠️ No se pudo procesar la imagen seleccionada.");
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
}

let idPersonaFotoActivaCDM = null;

function abrirPanelFotoPerfilCDM(idPersona) {
    const p = basePersonas.find(x => Number(x.id) === Number(idPersona));
    if (!p) return;
    try {
        const ses = JSON.parse(localStorage.getItem("cdm_sesion_activa_v1"));
        if (ses?.rol === "usuario" && Number(ses.personaId) !== Number(p.id)) {
            mostrarToast("🔒 Solo podés modificar tu propia foto.");
            return;
        }
    } catch {}

    idPersonaFotoActivaCDM = p.id;
    let modal = document.getElementById("modalGestorFotoPerfilCDM");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "modalGestorFotoPerfilCDM";
        modal.className = "modal-backdrop";
        document.body.appendChild(modal);
    }

    const preview = p.foto
        ? `<img src="${p.foto}" alt="${p.nombre}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`
        : `<span>${obtenerInicialesPersonaCDM(p)}</span>`;

    modal.innerHTML = `
        <div class="modal-window" style="max-width:430px; text-align:center;">
            <div class="modal-top">
                <div style="text-align:left;">
                    <span class="badge badge-celeste">FOTO DE PERFIL</span>
                    <h3 style="margin-top:4px;">📷 ${p.nombre} ${p.apellido}</h3>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarPanelFotoPerfilCDM()">✕</button>
            </div>
            <div style="display:flex; justify-content:center; margin:0.6rem 0 1.1rem;">
                <div class="ath-avatar has-photo" style="width:112px; height:112px; border-radius:26px; font-size:2rem;">${preview}</div>
            </div>
            <div style="display:flex; flex-direction:column; gap:0.6rem;">
                <label class="btn btn-primary" style="cursor:pointer; width:100%;">
                    <i class="ri-camera-lens-line"></i> ${p.foto ? "Cambiar Foto" : "Subir Foto"}
                    <input type="file" accept="image/*" onchange="subirArchivoFotoPerfilCDM(event)" style="display:none;">
                </label>
                <div style="display:flex; gap:0.45rem;">
                    <input type="url" id="inputUrlFotoPerfilCDM" placeholder="O pegá un link de imagen..." value="${p.foto?.startsWith("http") ? p.foto : ""}" style="flex:1; font-size:0.8rem;">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="aplicarUrlFotoPerfilCDM()">Usar Link</button>
                </div>
                ${p.foto ? `<button type="button" class="btn btn-danger btn-sm" onclick="quitarFotoPerfilActualCDM()"><i class="ri-delete-bin-line"></i> Quitar Foto</button>` : ""}
            </div>
        </div>
    `;
    modal.classList.remove("hidden");
}

function cerrarPanelFotoPerfilCDM() {
    document.getElementById("modalGestorFotoPerfilCDM")?.classList.add("hidden");
}

function refrescarVistasActivasCDM() {
    guardarDatosCDM();
    if (document.querySelector(".sports-showcase-grid")) inicializarIndex();
    if (deportePagina && typeof renderizarPaginaDeporte === "function") renderizarPaginaDeporte();
    if (document.body.dataset.page === "perfil-individual" && typeof inicializarPaginaJugadorIndividual === "function") inicializarPaginaJugadorIndividual();
    if (document.body.dataset.page === "mi-ficha" && typeof inicializarPanelSocio === "function") inicializarPanelSocio();
}

function subirArchivoFotoPerfilCDM(event) {
    const file = event.target.files?.[0];
    const p = basePersonas.find(x => Number(x.id) === Number(idPersonaFotoActivaCDM));
    if (!file || !p) return;
    comprimirImagenArchivoCDM(file, 320, 0.84, (dataUrl) => {
        p.foto = dataUrl;
        refrescarVistasActivasCDM();
        abrirPanelFotoPerfilCDM(p.id);
        mostrarToast(`📸 Foto de ${p.nombre} actualizada.`);
    });
}

function aplicarUrlFotoPerfilCDM() {
    const url = (document.getElementById("inputUrlFotoPerfilCDM")?.value || "").trim();
    const p = basePersonas.find(x => Number(x.id) === Number(idPersonaFotoActivaCDM));
    if (!url || !p) return;
    p.foto = url;
    refrescarVistasActivasCDM();
    abrirPanelFotoPerfilCDM(p.id);
    mostrarToast("📸 Foto actualizada.");
}

function quitarFotoPerfilActualCDM() {
    const p = basePersonas.find(x => Number(x.id) === Number(idPersonaFotoActivaCDM));
    if (!p) return;
    p.foto = null;
    refrescarVistasActivasCDM();
    cerrarPanelFotoPerfilCDM();
    mostrarToast("🗑️ Foto quitada.");
}

// =========================================================================
// 8. PORTAL EJECUTIVO MODERNO (INDEX.HTML):
//    IDENTIDAD DINÁMICA + TARJETAS GRANDES (DEPORTES / CONSULTORIO)
// =========================================================================

function obtenerProfesionesConsultorioIndex(lic) {
    const ICONOS_PROF = {
        "Quiropraxia": "🦴",
        "Kinesiología": "🦿",
        "Psicología": "🧠",
        "Nutrición": "🥗",
        "Traumatología": "🩺",
        "Fonoaudiología": "🗣️",
        "Odontología": "🦷"
    };
    if (typeof obtenerEspecialidadesHabilitadasConsultorioCDM === "function") {
        const res = obtenerEspecialidadesHabilitadasConsultorioCDM();
        if (Array.isArray(res) && res.length) return res;
    }
    if (Array.isArray(lic?.profesionesHabilitadas) && lic.profesionesHabilitadas.length) {
        return lic.profesionesHabilitadas.map(clave => ({ clave, icono: ICONOS_PROF[clave] || "🩺" }));
    }
    return [];
}

function esComercioSoloConsultorio(lic) {
    const mod = lic?.modulos || { futbol: true, hockey: true, gym: true, consultorio: false };
    const tieneDepOGym = (mod.futbol !== false) || (mod.hockey !== false) || (mod.gym !== false) || ((lic?.deportesExtra || []).length > 0);
    const profs = obtenerProfesionesConsultorioIndex(lic);
    return (mod.consultorio !== false) && profs.length > 0 && !tieneDepOGym;
}

function obtenerEncabezadoTarjetasIndex() {
    const grid = document.querySelector(".sports-showcase-grid");
    if (!grid) return null;
    const prev = grid.previousElementSibling;
    if (prev && prev.id !== "indexExecutiveStrip") return prev;
    return document.querySelector(".app-content .section-head");
}

function sincronizarIdentidadComercioUI() {
    const lic = obtenerLicenciaConfigCDM();
    const nombre = (lic.nombreEntidad || "CDM Pro Suite").trim();
    const ciudad = (lic.ciudad || lic.localidad || lic.ubicacion || lic.subtitulo || "").trim();
    const soloCons = esComercioSoloConsultorio(lic);
    if (!document.querySelector(".sports-showcase-grid")) return;

    document.title = `${nombre} — Panel Principal`;

    // 1. Barra superior: Nombre real + Ciudad + Subtítulo acorde
    const topTitle = document.querySelector(".app-topbar .topbar-title");
    if (topTitle) {
        const h2 = topTitle.querySelector("h2");
        if (h2) {
            Array.from(topTitle.children).forEach(ch => {
                if (ch !== h2 && !ch.classList.contains("topbar-subtitle") && ch.tagName !== "P") {
                    ch.style.display = "none";
                }
            });
            h2.innerHTML = `${nombre}${ciudad ? ` <span class="badge badge-celeste" style="font-size:0.72rem; vertical-align:middle; margin-left:6px;">${ciudad}</span>` : ""}`;
        }
        const sub = topTitle.querySelector(".topbar-subtitle, p");
        if (sub) {
            sub.innerText = soloCons
                ? "Panel de consultorio, agenda de turnos, pacientes e historia clínica"
                : "Panel general de planteles, gimnasio, asistencia diaria y cuotas";
        }
    }

    // 2. Encabezado real arriba de las tarjetas (cambia "Disciplinas y Áreas del Club")
    const head = obtenerEncabezadoTarjetasIndex();
    if (head) {
        const tit = head.querySelector("h1, h2, h3, strong");
        const desc = head.querySelector("p, span, small");
        if (soloCons) {
            if (tit) tit.innerText = "Especialidades del Consultorio";
            if (desc) desc.innerText = "Seleccioná una especialidad para abrir su agenda, pacientes, obras sociales e historia clínica";
        } else {
            if (tit) tit.innerText = "Disciplinas y Áreas del Club";
            if (desc) desc.innerText = "Seleccioná un módulo para gestionar planteles, pizarras, rutinas o cuotas";
        }
    }

    // 3. Botón principal de alta en Topbar
    const btnNueva = document.querySelector('.app-topbar button[onclick*="abrirModalPersona"], #btnAltaTopbarCDM');
    if (btnNueva) {
        btnNueva.id = "btnAltaTopbarCDM";
        btnNueva.innerHTML = soloCons
            ? `<i class="ri-user-add-line"></i> + Nuevo Paciente`
            : `<i class="ri-user-add-line"></i> + Nueva Persona`;
    }
}

function inyectarCSSIndexModerno() {
    document.getElementById("cdmCssIndexModerno")?.remove();
    const st = document.createElement("style");
    st.id = "cdmCssIndexModerno";
    st.textContent = `
        body.cdm-modern-index #indexExecutiveStrip { display: none !important; }

        /* GRILLA DE TARJETAS VERTICALES GRANDES */
        body.cdm-modern-index .sports-showcase-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(235px, 1fr));
            gap: 1.25rem;
            margin-bottom: 0;
        }
        .idx-hero-card {
            position: relative;
            height: 410px;
            border-radius: 26px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 1.4rem 1.45rem;
            text-decoration: none;
            color: #ffffff;
            background-color: #0f172a;
            border: 1px solid rgba(255, 255, 255, 0.16);
            box-shadow: 0 18px 38px -14px rgba(15, 23, 42, 0.32);
            transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.28s ease;
            isolation: isolate;
            cursor: pointer;
        }
        .idx-hero-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 24px 44px -14px rgba(2, 132, 199, 0.38);
        }
        .idx-hero-bg {
            position: absolute; inset: 0; background-size: cover; background-position: center;
            z-index: -2; transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .idx-hero-card:hover .idx-hero-bg { transform: scale(1.07); }
        .idx-hero-overlay { position: absolute; inset: 0; z-index: -1; }
        .idx-hero-top { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
        .idx-hero-tag {
            display: inline-flex; align-items: center; gap: 0.38rem;
            padding: 0.3rem 0.72rem; border-radius: 999px;
            background: rgba(15, 23, 42, 0.48); backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            font-size: 0.71rem; font-weight: 800; letter-spacing: 0.04em;
            text-transform: uppercase; color: #f8fafc;
        }
        .idx-hero-badges { display: flex; align-items: center; gap: 0.35rem; }
        .idx-hero-count {
            display: inline-flex; align-items: center; gap: 0.35rem;
            padding: 0.28rem 0.7rem; border-radius: 999px;
            background: rgba(16, 185, 129, 0.26); backdrop-filter: blur(10px);
            border: 1px solid rgba(110, 231, 183, 0.45);
            font-size: 0.72rem; font-weight: 800; color: #ecfdf5;
        }
        .idx-hero-dot { width: 7px; height: 7px; border-radius: 50%; background: #34d399; box-shadow: 0 0 8px #34d399; }
        .idx-hero-alert {
            display: inline-flex; align-items: center; gap: 0.22rem;
            padding: 0.28rem 0.58rem; border-radius: 999px;
            background: rgba(245, 158, 11, 0.32); border: 1px solid rgba(253, 224, 71, 0.5);
            font-size: 0.71rem; font-weight: 800; color: #fef3c7;
        }
        .idx-hero-bottom { display: flex; justify-content: space-between; align-items: flex-end; gap: 0.75rem; }
        .idx-hero-title {
            font-size: 1.75rem; font-weight: 900; letter-spacing: -0.025em;
            line-height: 1.08; margin: 0 0 0.35rem 0; color: #ffffff;
            text-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
        }
        .idx-hero-meta { font-size: 0.78rem; font-weight: 600; color: rgba(241, 245, 249, 0.9); }
        .idx-hero-arrow {
            width: 42px; height: 42px; border-radius: 50%;
            background: rgba(255, 255, 255, 0.18); backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.32); color: #ffffff;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.2rem; flex-shrink: 0; transition: all 0.2s ease;
        }
        .idx-hero-card:hover .idx-hero-arrow { background: #ffffff; color: #0f172a; transform: translateX(3px); }

        /* DIVISOR MODERNO (SOLO EN CLUBES DEPORTIVOS) */
        .idx-section-divider {
            display: flex; align-items: center; gap: 1rem; margin: 2rem 0 1.45rem;
        }
        .idx-section-divider::before, .idx-section-divider::after {
            content: ""; flex: 1; height: 1.5px;
            background: linear-gradient(90deg, transparent, var(--line-strong, #cbd5e1), transparent);
        }
        .idx-section-divider span {
            display: inline-flex; align-items: center; gap: 0.4rem;
            padding: 0.32rem 0.9rem; border-radius: 999px;
            background: var(--surface-solid, #ffffff); border: 1px solid var(--line-strong, #cbd5e1);
            color: var(--ink-500, #64748b); font-size: 0.72rem; font-weight: 800;
            letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap;
        }

        /* WIDGETS INFERIORES DE CLUB (LESIONES + RECORDATORIOS) */
        .idx-bottom-grid {
            display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 1.15rem; align-items: start;
        }
        .idx-widget {
            background: var(--surface-solid, #ffffff);
            border: 1.5px solid var(--line-strong, #cbd5e1);
            border-radius: 22px; padding: 1.05rem 1.2rem;
            box-shadow: 0 6px 20px -10px rgba(15, 23, 42, 0.08);
        }
        .idx-widget-head {
            display: flex; justify-content: space-between; align-items: center;
            gap: 0.5rem; margin-bottom: 0.8rem; padding-bottom: 0.55rem; border-bottom: 1px solid var(--line, #e2e8f0);
        }
        .idx-widget-title { display: flex; align-items: center; gap: 0.5rem; font-size: 0.94rem; font-weight: 800; color: var(--ink-900, #0f172a); margin: 0; }
        .idx-injury-list, .idx-rem-list { display: flex; flex-direction: column; gap: 0.45rem; max-height: 270px; overflow-y: auto; }
        .idx-injury-row {
            display: flex; justify-content: space-between; align-items: center; gap: 0.65rem;
            padding: 0.55rem 0.72rem; background: var(--surface-subtle, #f8fafc);
            border: 1px solid var(--line, #e2e8f0); border-left: 4px solid #ef4444;
            border-radius: 12px; cursor: pointer;
        }
        .idx-injury-row.warn { border-left-color: #f59e0b; }
        .idx-injury-row:hover { border-color: #0284c7; background: var(--cdm-50, #f0f9ff); }
        .idx-injury-left { display: flex; align-items: center; gap: 0.6rem; min-width: 0; }
        .idx-injury-left strong { display: block; font-size: 0.84rem; color: var(--ink-900, #0f172a); }
        .idx-injury-left small { display: block; font-size: 0.72rem; color: var(--ink-500, #64748b); }
        .idx-rem-form { display: flex; gap: 0.4rem; margin-bottom: 0.75rem; }
        .idx-rem-form input { flex: 1; min-height: 38px; border-radius: 11px; font-size: 0.82rem; }
        .idx-rem-form select { width: auto; min-height: 38px; border-radius: 11px; font-size: 0.76rem; font-weight: 700; padding: 0 0.5rem; }
        .idx-rem-item {
            display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
            padding: 0.52rem 0.72rem; background: var(--surface-subtle, #f8fafc);
            border: 1px solid var(--line, #e2e8f0); border-left: 3.5px solid #0284c7;
            border-radius: 11px; font-size: 0.82rem;
        }
        .idx-rem-item.urgente { border-left-color: #ef4444; background: rgba(239, 68, 68, 0.05); }
        .idx-rem-item.hecha { opacity: 0.52; text-decoration: line-through; border-left-color: #10b981; }
        .idx-rem-label { display: flex; align-items: center; gap: 0.55rem; flex: 1; min-width: 0; cursor: pointer; color: var(--ink-800, #1e293b); }
        .idx-rem-label input { width: 17px; height: 17px; min-height: auto !important; accent-color: #0284c7; flex-shrink: 0; }
        .idx-ok-empty {
            display: flex; align-items: center; gap: 0.6rem; padding: 0.85rem 0.95rem;
            background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.28);
            border-radius: 13px; color: #047857; font-size: 0.82rem; font-weight: 700;
        }
        body[data-theme="dark"] .idx-ok-empty { color: #34d399; }

        @media (max-width: 1024px) {
            .idx-hero-card { height: 340px; }
        }
        @media (max-width: 900px) {
            .idx-bottom-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
            body.cdm-modern-index .sports-showcase-grid {
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 0.55rem;
            }
            body.cdm-modern-index .sports-showcase-grid.cols-even-mobile {
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 0.7rem;
            }
            .idx-hero-card { height: 210px; padding: 0.75rem 0.65rem; border-radius: 18px; }
            .idx-hero-tag, .idx-hero-meta, .idx-hero-arrow { display: none; }
            .idx-hero-badges { width: 100%; justify-content: space-between; flex-wrap: wrap; gap: 0.22rem; }
            .idx-hero-count, .idx-hero-alert { font-size: 0.62rem; padding: 0.16rem 0.44rem; gap: 0.22rem; white-space: nowrap; }
            .idx-hero-dot { width: 5px; height: 5px; }
            .idx-hero-title { font-size: clamp(0.88rem, 3.8vw, 1.12rem); line-height: 1.12; margin: 0; }
            .idx-section-divider { margin: 1.25rem 0 1rem; }
            .idx-rem-form { flex-wrap: wrap; }
            .idx-rem-form input { min-width: 100%; }
            .idx-rem-form select { flex: 1; }
        }
    `;
    document.head.appendChild(st);
}

function obtenerRecordatoriosIndexClub() {
    const club = obtenerClaveClubActivoCDM();
    try {
        const mapa = JSON.parse(localStorage.getItem("cdm_notas_rapidas_pro_v23") || "{}");
        return Array.isArray(mapa[club]) ? mapa[club] : [];
    } catch { return []; }
}

function guardarRecordatoriosIndexClub(lista) {
    const club = obtenerClaveClubActivoCDM();
    try {
        const mapa = JSON.parse(localStorage.getItem("cdm_notas_rapidas_pro_v23") || "{}");
        mapa[club] = lista;
        localStorage.setItem("cdm_notas_rapidas_pro_v23", JSON.stringify(mapa));
    } catch {}
    const b = document.getElementById("badgeCantNotasTopbar");
    if (b) b.innerText = lista.filter(n => !n.hecha).length;
}

window.agregarRecordatorioIndex = function (e) {
    e.preventDefault();
    const inp = document.getElementById("inpRecProfeIndex");
    const prio = document.getElementById("selPrioRecIndex")?.value || "normal";
    const txt = (inp?.value || "").trim();
    if (!txt) return;
    const lista = obtenerRecordatoriosIndexClub();
    lista.unshift({ id: Date.now(), texto: txt, prioridad: prio, hecha: false, fecha: obtenerHoyISO() });
    guardarRecordatoriosIndexClub(lista);
    renderizarWidgetsLimpiosIndex(basePersonas.filter(p => p && p.activo));
};

window.toggleRecordatorioIndex = function (id) {
    const lista = obtenerRecordatoriosIndexClub().map(n => Number(n.id) === Number(id) ? { ...n, hecha: !n.hecha } : n);
    guardarRecordatoriosIndexClub(lista);
    renderizarWidgetsLimpiosIndex(basePersonas.filter(p => p && p.activo));
};

window.eliminarRecordatorioIndex = function (id) {
    guardarRecordatoriosIndexClub(obtenerRecordatoriosIndexClub().filter(n => Number(n.id) !== Number(id)));
    renderizarWidgetsLimpiosIndex(basePersonas.filter(p => p && p.activo));
};

function inicializarIndex() {
    const grid = document.querySelector(".sports-showcase-grid");
    if (!grid) return;

    document.body.classList.add("cdm-modern-index");
    inyectarCSSIndexModerno();
    sincronizarIdentidadComercioUI();
    basePersonas.forEach(p => asegurarPilaresPersona(p));

    const activos = basePersonas.filter(p => p && p.activo);
    renderizarTarjetasModernasIndex(activos);
    renderizarWidgetsLimpiosIndex(activos);

    setTimeout(sincronizarIdentidadComercioUI, 350);
}

function puedeEditarFotosPortadaIndexCDM() {
    try {
        const ses = JSON.parse(localStorage.getItem("cdm_sesion_activa_v1") || "null");
        if (!ses) return false;
        return ses.rol === "admin" && ses.nivelAdmin !== "staff";
    } catch {
        return false;
    }
}

function obtenerFotoPersonalizadaAreaCDM(areaKey) {
    const lic = obtenerLicenciaConfigCDM();
    const val = lic?.fotosPortadaAreas?.[areaKey];
    return typeof val === "string" && val.trim() ? val.trim() : "";
}

function escAttrIndexCDM(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function inyectarCSSEditarFotoPortadaIndex() {
    if (document.getElementById("cdmCssEditFotoPortadaIndex")) return;
    const st = document.createElement("style");
    st.id = "cdmCssEditFotoPortadaIndex";
    st.textContent = `
        .idx-hero-top-left {
            display: inline-flex;
            align-items: center;
            gap: 0.42rem;
            min-width: 0;
        }
        .idx-edit-photo-btn {
            background: rgba(15, 23, 42, 0.58);
            backdrop-filter: blur(8px);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.28);
            border-radius: 9px;
            width: 30px;
            height: 30px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 0.86rem;
            flex-shrink: 0;
            transition: background 0.16s ease, transform 0.16s ease;
        }
        .idx-edit-photo-btn:hover {
            background: #0284c7;
            border-color: #38bdf8;
            transform: scale(1.06);
        }
        @media (max-width: 640px) {
            .idx-edit-photo-btn {
                width: 26px;
                height: 26px;
                font-size: 0.76rem;
                border-radius: 8px;
            }
            .idx-hero-top {
                align-items: flex-start;
            }
        }
    `;
    document.head.appendChild(st);
}

function construirTarjetaHeroIndex({ areaKey, href, onclick, idCount, tag, titulo, sub, bgImageCss, defaultPreview, overlay, cantidad, sufijo, lesionados }) {
    const attrNav = onclick
        ? `href="#consultorio" onclick="event.preventDefault(); ${onclick}"`
        : `href="${href}"`;

    const fotoCustom = areaKey ? obtenerFotoPersonalizadaAreaCDM(areaKey) : "";
    const bgFinal = fotoCustom
        ? `url("${fotoCustom.replace(/"/g, '\\"')}"), ${bgImageCss}`
        : bgImageCss;

    const btnEditarFoto = (areaKey && puedeEditarFotosPortadaIndexCDM()) ? `
        <button type="button" class="idx-edit-photo-btn" title="Cambiar foto de portada de ${escAttrIndexCDM(titulo)}"
            onclick="event.preventDefault(); event.stopPropagation(); abrirModalFotoPortadaAreaCDM('${escAttrIndexCDM(areaKey)}', '${escAttrIndexCDM(titulo)}', '${escAttrIndexCDM(defaultPreview || "")}')">
            <i class="ri-pencil-line"></i>
        </button>
    ` : "";

    return `
        <a ${attrNav} class="idx-hero-card">
            <div class="idx-hero-bg" style="background-image:${bgFinal};"></div>
            <div class="idx-hero-overlay" style="background:${overlay};"></div>

            <div class="idx-hero-top">
                <div class="idx-hero-top-left">
                    ${btnEditarFoto}
                    <span class="idx-hero-tag">${tag}</span>
                </div>
                <div class="idx-hero-badges">
                    ${lesionados > 0 ? `<span class="idx-hero-alert" title="En seguimiento">🩹 ${lesionados}</span>` : ""}
                    <span class="idx-hero-count" id="${idCount || ""}"><span class="idx-hero-dot"></span>${cantidad} ${sufijo}</span>
                </div>
            </div>

            <div class="idx-hero-bottom">
                <div>
                    <h3 class="idx-hero-title">${titulo}</h3>
                    <div class="idx-hero-meta">${sub}</div>
                </div>
                <span class="idx-hero-arrow"><i class="ri-arrow-right-line"></i></span>
            </div>
        </a>
    `;
}

function comprimirFotoPortadaIndexCDM(file, cb) {
    const reader = new FileReader();
    reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
            const maxW = 900;
            const scale = Math.min(1, maxW / img.width);
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
            cb(canvas.toDataURL("image/jpeg", 0.80));
        };
        img.onerror = () => alert("⚠️ No se pudo procesar la imagen seleccionada.");
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
}

window.abrirModalFotoPortadaAreaCDM = function (areaKey, tituloArea, defaultPreview = "") {
    if (!areaKey) return;
    let modal = document.getElementById("modalFotoPortadaAreaCDM");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "modalFotoPortadaAreaCDM";
        modal.className = "modal-backdrop hidden";
        modal.onclick = (e) => { if (e.target === modal) cerrarModalFotoPortadaAreaCDM(); };
        document.body.appendChild(modal);
    }

    const fotoActual = obtenerFotoPersonalizadaAreaCDM(areaKey);
    const previewIni = fotoActual || defaultPreview || "https://images.unsplash.com/photo-1517649763962-0c62326601db?auto=format&fit=crop&w=900&q=80";

    modal.innerHTML = `
        <div class="modal-window" style="max-width:520px; text-align:left;">
            <div class="modal-top">
                <div>
                    <span class="badge badge-celeste">🖼️ PORTADA DE DISCIPLINA</span>
                    <h3 style="margin-top:4px; color:var(--ink-900);">Foto de ${escAttrIndexCDM(tituloArea)}</h3>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalFotoPortadaAreaCDM()">✕</button>
            </div>

            <form onsubmit="guardarFotoPortadaAreaCDM(event, '${escAttrIndexCDM(areaKey)}', '${escAttrIndexCDM(tituloArea)}')">
                <div class="field" style="margin-bottom:0.85rem;">
                    <label>Foto de Portada (subí desde PC/Celular o pegá una URL) *</label>
                    <div style="display:flex; gap:0.45rem; align-items:center;">
                        <input type="text" id="idxAreaFotoInput" required style="flex:1;"
                            placeholder="https://... o tocá Subir"
                            value="${escAttrIndexCDM(fotoActual)}"
                            oninput="if(this.value.trim()) document.getElementById('idxAreaFotoPrev').src = this.value.trim();">
                        <label class="btn btn-secondary btn-sm" style="cursor:pointer; margin:0; flex-shrink:0;">
                            📷 Subir
                            <input type="file" accept="image/*" style="display:none;" onchange="subirFotoPortadaAreaIndexCDM(event)">
                        </label>
                    </div>
                    <img id="idxAreaFotoPrev" src="${escAttrIndexCDM(previewIni)}"
                        style="width:100%; height:180px; object-fit:cover; border-radius:14px; margin-top:0.65rem; border:1px solid var(--line-strong); background:#0f172a;"
                        onerror="this.src='https://images.unsplash.com/photo-1517649763962-0c62326601db?auto=format&fit=crop&w=900&q=80'">
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                    ${fotoActual ? `
                        <button type="button" class="btn btn-danger btn-sm" onclick="restaurarFotoPortadaAreaCDM('${escAttrIndexCDM(areaKey)}', '${escAttrIndexCDM(tituloArea)}')">
                            ↺ Restaurar original
                        </button>
                    ` : `<span></span>`}
                    <div style="display:flex; gap:0.45rem;">
                        <button type="button" class="btn btn-ghost" onclick="cerrarModalFotoPortadaAreaCDM()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">💾 Guardar Foto</button>
                    </div>
                </div>
            </form>
        </div>
    `;
    modal.classList.remove("hidden");
};

window.cerrarModalFotoPortadaAreaCDM = function () {
    document.getElementById("modalFotoPortadaAreaCDM")?.classList.add("hidden");
};

window.subirFotoPortadaAreaIndexCDM = function (event) {
    const file = event.target.files?.[0];
    if (!file) return;
    comprimirFotoPortadaIndexCDM(file, (dataUrl) => {
        const inp = document.getElementById("idxAreaFotoInput");
        const prev = document.getElementById("idxAreaFotoPrev");
        if (inp) inp.value = dataUrl;
        if (prev) prev.src = dataUrl;
    });
};

function persistirFotosPortadaEnLicenciaCDM(lic) {
    if (typeof guardarLicenciaConfigCDM === "function") {
        guardarLicenciaConfigCDM(lic);
    } else {
        localStorage.setItem("cdm_licencia_config_v1", JSON.stringify(lic));
        guardarDatosCDM();
    }
}

window.guardarFotoPortadaAreaCDM = function (e, areaKey, tituloArea) {
    e.preventDefault();
    const url = (document.getElementById("idxAreaFotoInput")?.value || "").trim();
    if (!url) return;

    const lic = obtenerLicenciaConfigCDM();
    if (!lic.fotosPortadaAreas || typeof lic.fotosPortadaAreas !== "object") {
        lic.fotosPortadaAreas = {};
    }
    lic.fotosPortadaAreas[areaKey] = url;
    persistirFotosPortadaEnLicenciaCDM(lic);

    cerrarModalFotoPortadaAreaCDM();
    renderizarTarjetasModernasIndex(basePersonas.filter(p => p && p.activo));
    mostrarToast(`🖼️ Foto de "${tituloArea}" guardada.`);
};

window.restaurarFotoPortadaAreaCDM = function (areaKey, tituloArea) {
    const lic = obtenerLicenciaConfigCDM();
    if (lic.fotosPortadaAreas && lic.fotosPortadaAreas[areaKey]) {
        delete lic.fotosPortadaAreas[areaKey];
        persistirFotosPortadaEnLicenciaCDM(lic);
    }
    cerrarModalFotoPortadaAreaCDM();
    renderizarTarjetasModernasIndex(basePersonas.filter(p => p && p.activo));
    mostrarToast(`↺ Foto original de "${tituloArea}" restaurada.`);
};

function renderizarTarjetasModernasIndex(activos) {
    const grid = document.querySelector(".sports-showcase-grid");
    if (!grid) return;

    inyectarCSSEditarFotoPortadaIndex();

    const lic = obtenerLicenciaConfigCDM();
    const mod = lic.modulos || { futbol: true, hockey: true, gym: true, consultorio: false };
    const hoy = obtenerHoyISO();
    const soloCons = esComercioSoloConsultorio(lic);
    const profesiones = obtenerProfesionesConsultorioIndex(lic);

    const statsDe = (dep) => {
        const lista = activos.filter(p => p.deporte === dep);
        const pres = lista.filter(p => (p.asistencias || []).includes(hoy)).length;
        const les = lista.filter(p => (p.estadoMedico && p.estadoMedico !== "Óptimo") || (p.lesionesHistorial || []).some(l => !l.fechaAlta)).length;
        return { cant: lista.length, pres, les };
    };

    const txtPres = (n) => `${n} ${n === 1 ? "presente" : "presentes"} hoy`;
    const cards = [];

    if (mod.futbol !== false) {
        const s = statsDe("Futbol");
        const fbFutbol = "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80";
        cards.push(construirTarjetaHeroIndex({
            areaKey: "futbol",
            href: "futbol.html", idCount: "countFutbol", tag: "⚽ Fútbol", titulo: "Fútbol",
            sub: `${txtPres(s.pres)} • Planteles y Cancha`,
            bgImageCss: `url('img/futbol.jpg'), url('${fbFutbol}')`,
            defaultPreview: fbFutbol,
            overlay: "linear-gradient(160deg, rgba(6, 78, 59, 0.55) 0%, rgba(15, 23, 42, 0.88) 100%)",
            cantidad: s.cant, sufijo: s.cant === 1 ? "activo" : "activos", lesionados: s.les
        }));
    }

    if (mod.hockey !== false) {
        const s = statsDe("Hockey");
        const fbHockey = "https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?auto=format&fit=crop&w=900&q=80";
        cards.push(construirTarjetaHeroIndex({
            areaKey: "hockey",
            href: "hockey.html", idCount: "countHockey", tag: "🏑 Hockey", titulo: "Hockey",
            sub: `${txtPres(s.pres)} • Planteles y Cancha`,
            bgImageCss: `url('img/hockey.jpg'), url('${fbHockey}')`,
            defaultPreview: fbHockey,
            overlay: "linear-gradient(160deg, rgba(3, 105, 161, 0.42) 0%, rgba(12, 25, 44, 0.88) 100%)",
            cantidad: s.cant, sufijo: s.cant === 1 ? "activo" : "activos", lesionados: s.les
        }));
    }

    if (mod.gym !== false) {
        const s = statsDe("Gimnasio");
        const fbGym = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80";
        cards.push(construirTarjetaHeroIndex({
            areaKey: "gimnasio",
            href: "gym.html", idCount: "countGym", tag: "🏋️ Gimnasio", titulo: "Gimnasio",
            sub: `${txtPres(s.pres)} • Rutinas y Videoteca`,
            bgImageCss: `url('img/gym.jpg'), url('${fbGym}')`,
            defaultPreview: fbGym,
            overlay: "linear-gradient(160deg, rgba(49, 46, 129, 0.58) 0%, rgba(15, 23, 42, 0.92) 100%)",
            cantidad: s.cant, sufijo: s.cant === 1 ? "socio" : "socios", lesionados: s.les
        }));
    }

    (lic.deportesExtra || []).forEach(depRaw => {
        const nom = String(depRaw || "").replace(/^[^\w\sÁÉÍÓÚáéíóúÑñ]+\s*/, "").trim() || depRaw;
        const s = statsDe(nom);
        const k = normalizarTextoEjercicioCDM(nom);
        let img = "https://images.unsplash.com/photo-1517649763962-0c62326601db?auto=format&fit=crop&w=900&q=80";
        let overlay = "linear-gradient(160deg, rgba(2, 132, 199, 0.62) 0%, rgba(15, 23, 42, 0.9) 100%)";

        if (k.includes("basquet")) { img = "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=80"; overlay = "linear-gradient(160deg, rgba(194, 65, 12, 0.62) 0%, rgba(15, 23, 42, 0.9) 100%)"; }
        else if (k.includes("voley")) { img = "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=900&q=80"; overlay = "linear-gradient(160deg, rgba(37, 99, 235, 0.62) 0%, rgba(15, 23, 42, 0.9) 100%)"; }
        else if (k.includes("natacion") || k.includes("pileta")) { img = "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=900&q=80"; overlay = "linear-gradient(160deg, rgba(6, 182, 212, 0.6) 0%, rgba(12, 74, 110, 0.9) 100%)"; }
        else if (k.includes("padel") || k.includes("tenis")) { img = "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=80"; overlay = "linear-gradient(160deg, rgba(5, 150, 105, 0.62) 0%, rgba(15, 23, 42, 0.9) 100%)"; }
        else if (k.includes("boxeo")) { img = "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=900&q=80"; overlay = "linear-gradient(160deg, rgba(190, 18, 60, 0.64) 0%, rgba(15, 23, 42, 0.92) 100%)"; }

        cards.push(construirTarjetaHeroIndex({
            areaKey: `dep_${k}`,
            href: `futbol.html?deporte=${encodeURIComponent(nom)}`, tag: depRaw, titulo: nom,
            sub: `${txtPres(s.pres)} • Planteles y Cancha`,
            bgImageCss: `url('${img}')`,
            defaultPreview: img,
            overlay,
            cantidad: s.cant, sufijo: s.cant === 1 ? "activo" : "activos", lesionados: s.les
        }));
    });

    if (mod.consultorio !== false && profesiones.length > 0) {
        const dbCons = typeof obtenerDatosConsultorioCDM === "function" ? obtenerDatosConsultorioCDM() : { pacientes: [], turnos: [] };
        const ESTILOS_PROF = {
            "kinesiologia": { img: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80", ov: "linear-gradient(160deg, rgba(13, 148, 136, 0.62) 0%, rgba(15, 23, 42, 0.92) 100%)" },
            "quiropraxia": { img: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=900&q=80", ov: "linear-gradient(160deg, rgba(2, 132, 199, 0.62) 0%, rgba(15, 23, 42, 0.92) 100%)" },
            "psicologia": { img: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?auto=format&fit=crop&w=900&q=80", ov: "linear-gradient(160deg, rgba(109, 40, 217, 0.62) 0%, rgba(15, 23, 42, 0.92) 100%)" },
            "nutricion": { img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=80", ov: "linear-gradient(160deg, rgba(21, 128, 61, 0.62) 0%, rgba(15, 23, 42, 0.92) 100%)" }
        };

        if (soloCons) {
            profesiones.forEach(pr => {
                const k = normalizarTextoEjercicioCDM(pr.clave);
                const est = ESTILOS_PROF[k] || { img: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=80", ov: "linear-gradient(160deg, rgba(3, 105, 161, 0.62) 0%, rgba(15, 23, 42, 0.92) 100%)" };
                const tHoy = (dbCons.turnos || []).filter(t => t.fecha === hoy && t.estado !== "cancelado" && normalizarTextoEjercicioCDM(t.especialidad) === k).length;
                const cantPac = (dbCons.pacientes || []).filter(p => normalizarTextoEjercicioCDM(p.especialidad) === k).length;
                const claveEsc = pr.clave.replace(/'/g, "\\'");

                cards.push(construirTarjetaHeroIndex({
                    areaKey: `prof_${k}`,
                    onclick: `if(typeof abrirEspecialidadDesdeInicioCDM==='function') abrirEspecialidadDesdeInicioCDM('${claveEsc}');`,
                    tag: `${pr.icono || "🩺"} Especialidad`,
                    titulo: pr.clave,
                    sub: `${cantPac} ${cantPac === 1 ? "paciente" : "pacientes"} • Agenda e Historia Clínica`,
                    bgImageCss: `url('${est.img}')`,
                    defaultPreview: est.img,
                    overlay: est.ov,
                    cantidad: tHoy,
                    sufijo: tHoy === 1 ? "turno hoy" : "turnos hoy",
                    lesionados: 0
                }));
            });
        } else {
            const fbCons = "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80";
            cards.push(construirTarjetaHeroIndex({
                areaKey: "consultorio",
                onclick: `if(typeof abrirEspecialidadDesdeInicioCDM==='function') abrirEspecialidadDesdeInicioCDM('TODAS');`,
                tag: "🩺 Consultorio", titulo: "Consultorio",
                sub: `${profesiones.map(p => p.clave).slice(0, 3).join(" • ")}`,
                bgImageCss: `url('${fbCons}')`,
                defaultPreview: fbCons,
                overlay: "linear-gradient(160deg, rgba(13, 148, 136, 0.62) 0%, rgba(15, 23, 42, 0.92) 100%)",
                cantidad: profesiones.length, sufijo: "áreas", lesionados: 0
            }));
        }
    }

    grid.classList.toggle("cols-even-mobile", cards.length === 2 || cards.length === 4);
    grid.innerHTML = cards.join("");
}


function renderizarWidgetsLimpiosIndex(activos) {
    const grid = document.querySelector(".sports-showcase-grid");
    const mainContent = document.querySelector(".app-content");
    if (!mainContent) return;

    const lic = obtenerLicenciaConfigCDM();
    const soloCons = esComercioSoloConsultorio(lic);

    // EN CONSULTORIO: Inicio limpio solo con las tarjetas grandes (sin calendario repetido abajo)
    if (soloCons) {
        document.getElementById("idxSectionDivider")?.classList.add("hidden");
        document.getElementById("indexExecutiveHub")?.classList.add("hidden");
        return;
    }

    let divider = document.getElementById("idxSectionDivider");
    if (!divider) {
        divider = document.createElement("div");
        divider.id = "idxSectionDivider";
        divider.className = "idx-section-divider";
    }
    divider.classList.remove("hidden");
    divider.innerHTML = `<span><i class="ri-pulse-line"></i> Seguimiento Diario</span>`;

    let hub = document.getElementById("indexExecutiveHub");
    if (!hub) {
        hub = document.createElement("section");
        hub.id = "indexExecutiveHub";
    }
    hub.className = "idx-bottom-grid animate-in";

    if (grid) {
        grid.insertAdjacentElement("afterend", divider);
        divider.insertAdjacentElement("afterend", hub);
    } else {
        mainContent.appendChild(divider);
        mainContent.appendChild(hub);
    }

    const lesionados = activos.filter(p => {
        const lesActivas = Array.isArray(p.lesionesHistorial) && p.lesionesHistorial.some(l => !l.fechaAlta);
        const alertaMed = p.estadoMedico && p.estadoMedico !== "Óptimo";
        return lesActivas || alertaMed;
    }).sort((a, b) => {
        const aGrave = String(a.estadoMedico || "").toLowerCase().includes("lesion") ? 0 : 1;
        const bGrave = String(b.estadoMedico || "").toLowerCase().includes("lesion") ? 0 : 1;
        return aGrave - bGrave || a.apellido.localeCompare(b.apellido);
    });

    const recs = obtenerRecordatoriosIndexClub();
    const pendientes = recs.filter(r => !r.hecha).length;

    hub.innerHTML = `
        <div class="idx-widget">
            <div class="idx-widget-head">
                <h3 class="idx-widget-title">🩹 Lesiones y Precaución</h3>
                <span class="badge ${lesionados.length ? "badge-danger" : "badge-ok"}">${lesionados.length ? `${lesionados.length} en seguimiento` : "Todo óptimo"}</span>
            </div>
            ${lesionados.length === 0 ? `
                <div class="idx-ok-empty"><i class="ri-shield-check-fill" style="font-size:1.25rem;"></i><span>Plantel 100% apto — Sin lesionados ni sobrecargas activas.</span></div>
            ` : `
                <div class="idx-injury-list">
                    ${lesionados.map(p => {
                        const lesAct = (p.lesionesHistorial || []).find(l => !l.fechaAlta);
                        const esGrave = Boolean(lesAct) || String(p.estadoMedico || "").toLowerCase().includes("lesion");
                        const detalle = lesAct ? `${lesAct.zona} (${lesAct.lado}) • ${lesAct.tipo}` : (p.estadoMedico || "Precaución");
                        const area = p.deporte === "Gimnasio" ? "Gimnasio" : `${p.deporte} ${p.categoria}`;
                        return `
                            <div class="idx-injury-row ${esGrave ? "" : "warn"}" onclick="irAPaginaIndividual(${p.id})">
                                <div class="idx-injury-left">
                                    ${renderAvatarPersonaCDM(p, 38, "0.82rem", false)}
                                    <div style="min-width:0;"><strong>${p.apellido}, ${p.nombre} <span style="font-weight:600; color:var(--ink-500); font-size:0.74rem;">• ${area}</span></strong><small>${esGrave ? "🔴" : "🟡"} ${detalle}</small></div>
                                </div>
                                <span class="badge ${esGrave ? "badge-danger" : "badge-warn"}" style="flex-shrink:0;">Ver →</span>
                            </div>
                        `;
                    }).join("")}
                </div>
            `}
        </div>

        <div class="idx-widget">
            <div class="idx-widget-head">
                <h3 class="idx-widget-title">📌 Recordatorios del Profesor</h3>
                <span class="badge badge-celeste">${pendientes} pend.</span>
            </div>
            <form class="idx-rem-form" onsubmit="agregarRecordatorioIndex(event)">
                <input type="text" id="inpRecProfeIndex" required placeholder="Ej: Traer pecheras, revisar rodilla de Mateo, partido 15hs...">
                <select id="selPrioRecIndex" title="Prioridad"><option value="normal">📌 Normal</option><option value="urgente">🔥 Urgente</option></select>
                <button type="submit" class="btn btn-primary btn-sm">+</button>
            </form>
            ${recs.length === 0 ? `<div class="empty-box" style="padding:1rem; font-size:0.8rem;">Sin recordatorios cargados.</div>` : `
                <div class="idx-rem-list">
                    ${recs.map(r => `
                        <div class="idx-rem-item ${r.prioridad === "urgente" && !r.hecha ? "urgente" : ""} ${r.hecha ? "hecha" : ""}">
                            <label class="idx-rem-label"><input type="checkbox" ${r.hecha ? "checked" : ""} onchange="toggleRecordatorioIndex(${r.id})"><span>${r.prioridad === "urgente" && !r.hecha ? "🔥 " : ""}${r.texto}</span></label>
                            <button type="button" class="btn btn-ghost btn-sm" style="min-height:24px; padding:0 6px; color:var(--ink-400);" onclick="eliminarRecordatorioIndex(${r.id})">✕</button>
                        </div>
                    `).join("")}
                </div>
            `}
        </div>
    `;
}

// Helpers compartidos de WhatsApp (usados en Deportes, Gym y Finanzas)
function enviarReciboPagoWhatsApp(idPersona) {
    const p = basePersonas.find(x => Number(x.id) === Number(idPersona));
    if (!p) return;
    const tel = String(p.whatsapp || "").replace(/\D/g, "");
    const monto = Number(p.montoCuota || 25000).toLocaleString("es-AR");
    const club = obtenerLicenciaConfigCDM().nombreEntidad.toUpperCase();
    const alDia = (p.pagoEstado || "Al Día") === "Al Día";
    const msg = alDia
        ? `💙🤍 *COMPROBANTE DE PAGO — ${club}*\n👤 ${p.nombre} ${p.apellido} (DNI ${p.dni})\n💳 Monto: $${monto} • ✅ CUOTA AL DÍA\n📅 ${new Date().toLocaleDateString("es-AR")}`
        : `💙🤍 *AVISO DE CUOTA — ${club}*\nHola *${p.nombre}*, figura pendiente la cuota mensual de *${p.deporte}* ($${monto}). ¡Muchas gracias!`;
    window.open(tel ? `https://wa.me/${tel}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
}

function enviarAlertaAsistenciaWhatsApp(idPersona) {
    const p = basePersonas.find(x => Number(x.id) === Number(idPersona));
    if (!p) return;
    const tel = String(p.whatsapp || "").replace(/\D/g, "");
    const msg = `💙🤍 Hola *${p.nombre}*, esta semana registraste *${contarAsistenciasUltimos7Dias(p)} de ${p.frecuenciaSemanal || 3} días pactados*. ¡Te esperamos en el próximo entrenamiento! 💪`;
    window.open(tel ? `https://wa.me/${tel}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
}

// =========================================================================
// 9. DATOS DEMO LIMPIOS (CON FECHA DE NACIMIENTO PARA BASE GENERAL)
// =========================================================================

function cargarDatosDemoCDM() {
    const d0 = isoHaceDias(0), d1 = isoHaceDias(1), d2 = isoHaceDias(2), d3 = isoHaceDias(3), d4 = isoHaceDias(4), d12 = isoHaceDias(12), d25 = isoHaceDias(25);
    const anio = new Date().getFullYear();

    basePersonas = [
        {
            id: 101, deporte: "Futbol", categoria: "Sub 13", puesto: "Centrodelantero (#9)",
            nombre: "Mateo", apellido: "Gómez", dni: "48111222", whatsapp: "5493584112233",
            edad: 13, fechaNacimiento: `${anio - 13}-04-12`, anioNacimiento: anio - 13,
            sangre: "0+", peso: 54, altura: 162, pierna: "Derecha", brazo: "Derecho",
            activo: true, pilares: { fisico: 8.6, gym: 8.2, tecnico: 9.0, actitud: 9.2, bonus: 0.3 }, motivoPuntos: "Figura vs. San Basilio",
            frecuenciaSemanal: 3, estadoMedico: "Óptimo", pagoEstado: "Al Día", montoCuota: 25000,
            asistencias: [d4, d2, d0],
            clinico: [{ id: 1, fecha: d0, peso: 54, rpe: 6, sueno: 5, dolor: "Sin molestias" }],
            evaluaciones: [
                { id: 11, fecha: d25, ejercicio: "Sentadilla Trasera con Barra", tipo: "fuerza_kg", valor: 65, unidad: "kg (1RM)", detalle: "55 kg × 6 reps (1RM: 65 kg)", nota: "Base" },
                { id: 12, fecha: d12, ejercicio: "Sentadilla Trasera con Barra", tipo: "fuerza_kg", valor: 72, unidad: "kg (1RM)", detalle: "62 kg × 5 reps (1RM: 72 kg)", nota: "Progreso" },
                { id: 13, fecha: d0, ejercicio: "Sentadilla Trasera con Barra", tipo: "fuerza_kg", valor: 80, unidad: "kg (1RM)", detalle: "70 kg × 4 reps (1RM: 80 kg)", nota: "Récord" }
            ]
        },
        {
            id: 102, deporte: "Futbol", categoria: "Sub 13", puesto: "Enganche (#10)",
            nombre: "Bautista", apellido: "Torres", dni: "48222333", whatsapp: "5493584223344",
            edad: 13, fechaNacimiento: `${anio - 13}-08-20`, anioNacimiento: anio - 13,
            sangre: "A+", peso: 51, altura: 159, pierna: "Izquierda", brazo: "Derecho",
            activo: true, pilares: { fisico: 8.0, gym: 7.6, tecnico: 8.8, actitud: 8.5, bonus: 0.1 }, motivoPuntos: "Asistencia de gol",
            frecuenciaSemanal: 3, estadoMedico: "Óptimo", pagoEstado: "Al Día", montoCuota: 25000,
            asistencias: [d4, d2, d0], clinico: [], evaluaciones: []
        },
        {
            id: 103, deporte: "Futbol", categoria: "Sub 15", puesto: "Volante Central (#5)",
            nombre: "Joaquín", apellido: "Ledesma", dni: "47333444", whatsapp: "5493584334455",
            edad: 15, fechaNacimiento: `${anio - 15}-02-10`, anioNacimiento: anio - 15,
            sangre: "0+", peso: 60, altura: 168, pierna: "Derecha", brazo: "Derecho",
            activo: true, pilares: { fisico: 8.4, gym: 8.0, tecnico: 7.8, actitud: 9.0, bonus: 0 }, motivoPuntos: "Gran despliegue",
            frecuenciaSemanal: 3, estadoMedico: "Óptimo", pagoEstado: "Al Día", montoCuota: 25000,
            asistencias: [d3, d0], clinico: [], evaluaciones: []
        },
        {
            id: 201, deporte: "Hockey", categoria: "Sub 13", puesto: "Wing Derecha (#8)",
            nombre: "Valentina", apellido: "Ruiz", dni: "48555666", whatsapp: "5493584556677",
            edad: 13, fechaNacimiento: `${anio - 13}-05-14`, anioNacimiento: anio - 13,
            sangre: "B+", peso: 49, altura: 158, pierna: "Derecha", brazo: "Derecho",
            activo: true, pilares: { fisico: 8.8, gym: 8.0, tecnico: 9.0, actitud: 9.2, bonus: 0.2 }, motivoPuntos: "Gol de córner corto",
            frecuenciaSemanal: 3, estadoMedico: "Óptimo", pagoEstado: "Al Día", montoCuota: 25000,
            asistencias: [d4, d2, d0], clinico: [], evaluaciones: []
        },
        {
            id: 301, deporte: "Gimnasio", categoria: "General", puesto: "Musculación e Hipertrofia",
            nombre: "Lucas", apellido: "Peralta", dni: "39111444", whatsapp: "5493584889900",
            edad: 26, fechaNacimiento: `${anio - 26}-09-03`, anioNacimiento: anio - 26,
            sangre: "0+", peso: 78, altura: 176, pierna: "Derecha", brazo: "Derecho",
            activo: true, pilares: null, puntosCategoria: null, motivoPuntos: "",
            frecuenciaSemanal: 3, estadoMedico: "Óptimo", pagoEstado: "Al Día", montoCuota: 25000,
            asistencias: [d4, d2, d0], clinico: [],
            evaluaciones: [
                { id: 51, fecha: d25, ejercicio: "Press de Banca Plano", tipo: "fuerza_kg", valor: 88, unidad: "kg (1RM)", detalle: "78 kg × 4 reps (1RM: 88 kg)", nota: "" },
                { id: 52, fecha: d0, ejercicio: "Press de Banca Plano", tipo: "fuerza_kg", valor: 102, unidad: "kg (1RM)", detalle: "88 kg × 5 reps (1RM: 102 kg)", nota: "PR en Banca" }
            ]
        },
        {
            id: 302, deporte: "Gimnasio", categoria: "General", puesto: "Funcional, Core y Salud",
            nombre: "Martín", apellido: "Cabrera", dni: "41222555", whatsapp: "5493584990011",
            edad: 23, fechaNacimiento: `${anio - 23}-11-18`, anioNacimiento: anio - 23,
            sangre: "A+", peso: 84, altura: 179, pierna: "Derecha", brazo: "Derecho",
            activo: true, pilares: null, puntosCategoria: null, motivoPuntos: "",
            frecuenciaSemanal: 5, estadoMedico: "Sobrecarga / Precaución", pagoEstado: "Pendiente", montoCuota: 25000,
            asistencias: [d3, d1], clinico: [], evaluaciones: []
        }
    ];

    baseAlineaciones = { "Futbol_Sub 13_4-3-3": { 7: 102, 9: 101 } };
    basePartidos = [{
        id: 601, fecha: d1, deporte: "Futbol", categoria: "Sub 13", rival: "vs. San Basilio", resultado: "2 - 1", formacion: "4-3-3",
        eventos: [{ id: 1, minuto: 24, minutoDisplay: "1T • 24'", jugadorId: 101, jugadorNombre: "Gómez, Mateo", puestoEnCancha: "#9 DC", tipo: "⚽ Gol Convertido", detalle: "Remate cruzado", impactoPuntos: 0.3 }],
        conclusion: "Victoria 2-1 con gran partido de Mateo Gómez.",
        resumenJugadores: [{ id: 101, nombre: "Gómez, Mateo", puesto: "#9 DC", eventos: 1, puntosSugeridos: 0.3 }],
        puntosAplicadosAlRanking: true
    }];

    basePersonas.forEach(p => asegurarPilaresPersona(p));
    guardarDatosCDM();
    mostrarToast("🌟 Demo cargada con éxito.");
    setTimeout(() => window.location.reload(), 500);
}

// =========================================================================
// 10. ARRANQUE CENTRAL MULTIPÁGINA (CONECTA CADA MÓDULO SI ESTÁ CARGADO)
// =========================================================================

document.addEventListener("DOMContentLoaded", () => {
    aplicarTemaGuardadoCDM();
    basePersonas.forEach(p => asegurarPilaresPersona(p));
    sincronizarDatalistsEjerciciosCDM();

    if (typeof construirNavegacionCompleta === "function") construirNavegacionCompleta();
    inicializarIndex();

    if (deportePagina) {
        if (deportePagina === "Hockey") periodoPartidoActual = "1C";
        if (typeof inicializarModuloDeporte === "function") inicializarModuloDeporte();
        if (typeof renderizarPaginaDeporte === "function") renderizarPaginaDeporte();
    }
    if (document.body.dataset.page === "perfil-individual" && typeof inicializarPaginaJugadorIndividual === "function") {
        inicializarPaginaJugadorIndividual();
    }
    if (document.body.dataset.page === "mi-ficha" && typeof inicializarPanelSocio === "function") {
        inicializarPanelSocio();
    }

    sincronizarEstadoDesdeServidorCDM().then((actualizado) => {
        if (!actualizado) return;
        basePersonas.forEach(p => asegurarPilaresPersona(p));
        inicializarIndex();
        if (deportePagina && typeof renderizarPaginaDeporte === "function") renderizarPaginaDeporte();
        if (document.body.dataset.page === "perfil-individual" && typeof inicializarPaginaJugadorIndividual === "function") inicializarPaginaJugadorIndividual();
        if (document.body.dataset.page === "mi-ficha" && typeof inicializarPanelSocio === "function") inicializarPanelSocio();
    });

    if (typeof verificarAccesoYRolEnApp === "function") verificarAccesoYRolEnApp();
});