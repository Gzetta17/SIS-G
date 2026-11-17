/**
 * app.js - Motor Maestro Oficial del Club Deportivo Municipal (CDM Adelia María)
 * Arquitectura Web-App SaaS - Desarrollado por Gonzalo Adanchú
 * VERSIÓN COMPLETA, ROBUSTA Y SINCRONIZADA (ESCALA DE SCORE 1 A 10 MANUAL PARA DEPORTES)
 * - Sistema de Score (1.0 a 10.0) exclusivo para Fútbol y Hockey, 100% controlado por el Admin/Profe
 * - Separación total de Gimnasio (Socios) respecto de Fútbol y Hockey
 * - Videoteca Interactiva de Ejercicios con Reproductor, Biomecánica, Rutinas en 1 clic y WhatsApp
 * - Pizarra Táctica Interactiva por Puesto (Fútbol y Hockey) + Tablero en Vivo + Banco de Suplentes
 * - Microciclo Semanal de Campo + Lista de Buena Fe Oficial
 * - Calculadora Automática de Cargas (% 1RM), Comparador H2H, Informe Ejecutivo 360° y Puente AMS Elite
 */

let basePersonas = JSON.parse(localStorage.getItem("cdm_personas_v1")) || [];
let baseRutinas = JSON.parse(localStorage.getItem("cdm_rutinas_v1")) || [];
let basePartidos = JSON.parse(localStorage.getItem("cdm_partidos_v1")) || [];
let baseAlineaciones = JSON.parse(localStorage.getItem("cdm_alineaciones_v2")) || {};
let baseMicrociclos = JSON.parse(localStorage.getItem("cdm_microciclos_v1")) || {};
let baseVideoteca = JSON.parse(localStorage.getItem("cdm_videoteca_v1")) || [];
let baseCatalogoEjercicios = JSON.parse(localStorage.getItem("cdm_catalogo_ej_v1")) || [
    { id: "ej_1", nombre: "Sentadilla Trasera con Barra", tipo: "fuerza_1rm" },
    { id: "ej_2", nombre: "Press de Banca Plano", tipo: "fuerza_1rm" },
    { id: "ej_3", nombre: "Peso Muerto Rumano", tipo: "fuerza_1rm" },
    { id: "ej_4", nombre: "Sentadilla Búlgara Unilateral", tipo: "unilateral_asimetria" },
    { id: "ej_5", nombre: "Dominadas Lastradas", tipo: "peso_corporal_lastre" },
    { id: "ej_6", nombre: "Salto al Cajón / CMJ", tipo: "salto_watts" },
    { id: "ej_7", nombre: "Sprint 20 Metros", tipo: "tiempo_sprint" },
    { id: "ej_8", nombre: "Yo-Yo Test Intermitente", tipo: "resistencia_yoyo" }
];

const paramDeporteURL = new URLSearchParams(window.location.search).get("deporte");
let deportePagina = paramDeporteURL ? paramDeporteURL.trim() : (document.body.dataset.deporte || null); // 'Futbol' | 'Hockey' | 'Gimnasio' | Deportes Extra
let categoriaActiva = "Sub 13";

let chartInstancia = null;
let chartRadarInstancia = null;
let chartAsistenciaInstancia = null;
let chartPagosInstancia = null;

if (typeof Chart !== "undefined") {
    Chart.defaults.font.family = "'Poppins', sans-serif";
    Chart.defaults.color = "#64748b";
    Chart.defaults.scale.grid.color = "rgba(0,0,0,0.04)";
    Chart.defaults.plugins.tooltip.backgroundColor = "rgba(5, 19, 33, 0.94)";
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
}

// Variables para el Partido en Vivo (Scouting y Marcador)
let eventosPartidoActual = [];
let minutoPartidoActual = 0;
let periodoPartidoActual = "1T";
let timerIntervaloPartido = null;
let slotCanchaSeleccionadoIndex = null;
let golesLocalActual = 0;
let golesVisitaActual = 0;
// =========================================================================
// MOTOR NATIVO DE MODO DÍA / MODO NOCHE (SIEMPRE DISPONIBLE EN TODA LA APP)
// =========================================================================

function obtenerTemaActualCDM() {
    return localStorage.getItem("cdm_theme_mode_v1") || localStorage.getItem("cdm_tema") || "light";
}

function aplicarTemaGuardadoCDM() {
    const tema = obtenerTemaActualCDM();
    const esOscuro = tema === "dark";

    if (document.body) {
        if (esOscuro) {
            document.body.setAttribute("data-theme", "dark");
        } else {
            document.body.removeAttribute("data-theme");
        }
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
    const esOscuro = document.body.getAttribute("data-theme") === "dark";
    const nuevo = esOscuro ? "light" : "dark";
    localStorage.setItem("cdm_theme_mode_v1", nuevo);
    localStorage.setItem("cdm_tema", nuevo);
    aplicarTemaGuardadoCDM();

    if (typeof mostrarToast === "function") {
        mostrarToast(nuevo === "dark" ? "🌙 Modo Noche activado" : "☀️ Modo Día activado");
    }

    // Actualizar gráficos activos para que tomen el contraste del nuevo tema
    if (deportePagina === "Gimnasio" && typeof dibujarGraficosColectivosGym === "function") {
        dibujarGraficosColectivosGym();
    }
    if (document.body.dataset.page === "perfil-individual") {
        const p = typeof obtenerJugadorActualPorURL === "function" ? obtenerJugadorActualPorURL() : null;
        if (p) {
            if (typeof dibujarGraficoEvolucion === "function") dibujarGraficoEvolucion();
            if (typeof dibujarRadarJugador === "function") dibujarRadarJugador(p);
        }
    }
}

function sincronizarSidebarActivoCDM(deporteForzado = null) {
    const sidebar = document.querySelector(".app-sidebar");
    if (!sidebar) return;

    const path = window.location.pathname.toLowerCase();
    let claveActiva = "";
    if (deporteForzado) {
        claveActiva = deporteForzado.toLowerCase() === "gimnasio" ? "gym" : deporteForzado.toLowerCase();
    } else if (deportePagina) {
        claveActiva = deportePagina.toLowerCase() === "gimnasio" ? "gym" : deportePagina.toLowerCase();
    } else if (path.includes("futbol")) {
        claveActiva = "futbol";
    } else if (path.includes("hockey")) {
        claveActiva = "hockey";
    } else if (path.includes("gym")) {
        claveActiva = "gym";
    } else if (path.includes("index") || path.endsWith("/") || document.getElementById("countFutbol")) {
        claveActiva = "index";
    }

    const nav = sidebar.querySelector(".sidebar-nav");
    if (nav) {
        let mod = { futbol: true, hockey: true, gym: true };
        let deportesExtra = [];
        try {
            const lic = JSON.parse(localStorage.getItem("cdm_licencia_config_v1") || "null");
            if (lic && lic.modulos) mod = { ...mod, ...lic.modulos };
            if (lic && Array.isArray(lic.deportesExtra)) deportesExtra = lic.deportesExtra;
        } catch {}

        const items = [
            { clave: "index", href: "index.html", icon: "ri-home-5", texto: "Inicio", visible: true },
            { clave: "futbol", href: "futbol.html", icon: "ri-football", texto: "Fútbol", visible: mod.futbol !== false },
            { clave: "hockey", href: "hockey.html", icon: "ri-award", texto: "Hockey de Piso", visible: mod.hockey !== false },
            { clave: "gym", href: "gym.html", icon: "ri-heart-pulse", texto: "Gimnasio", visible: mod.gym !== false }
        ].filter(it => it.visible);

        deportesExtra.forEach(depRaw => {
            const limpio = String(depRaw || "").replace(/^[^\w\sÁÉÍÓÚáéíóúÑñ]+\s*/, "").trim() || depRaw;
            items.push({
                clave: limpio.toLowerCase(),
                href: `futbol.html?deporte=${encodeURIComponent(limpio)}`,
                icon: "ri-trophy",
                texto: depRaw,
                visible: true
            });
        });
        nav.innerHTML = items.map(it => {
            const act = it.clave === claveActiva;
            return `<a href="${it.href}" class="side-link ${act ? "active" : ""}" data-nav="${it.clave}"><i class="${it.icon}-${act ? "fill" : "line"}"></i><span>${it.texto}</span></a>`;
        }).join("");
    }

    // Garantizar que la caja de Sistema y Backup esté siempre al pie del sidebar en todas las páginas
    if (!sidebar.querySelector(".sidebar-demo-box")) {
        const box = document.createElement("div");
        box.className = "sidebar-demo-box";
        box.innerHTML = `
            <small><i class="ri-database-2-line"></i> Sistema y Backup</small>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.4rem;">
                <button type="button" class="btn btn-primary btn-sm" style="grid-column:1/-1;" onclick="cargarDatosDemoCDM()">
                    <i class="ri-sparkling-fill"></i> Cargar Demo
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="exportarBackupJSON()" title="Descargar copia JSON">
                    <i class="ri-download-2-line"></i> Backup
                </button>
                <label class="btn btn-ghost btn-sm" style="cursor:pointer; color:#e2e8f0; border-color:rgba(255,255,255,0.14); background:rgba(255,255,255,0.06);" title="Restaurar archivo JSON">
                    <i class="ri-upload-2-line"></i> Subir
                    <input type="file" accept=".json" onchange="importarBackupJSON(event)" style="display:none;">
                </label>
                <button type="button" class="btn btn-danger btn-sm" style="grid-column:1/-1; margin-top:2px;" onclick="limpiarTodoElSistema()">
                    <i class="ri-delete-bin-line"></i> Vaciar Datos
                </button>
            </div>
        `;
        sidebar.appendChild(box);
    }

    const lbl = sidebar.querySelector(".sidebar-group-label");
    if (lbl) lbl.innerText = "Menú Principal";
    const subBrand = sidebar.querySelector(".sidebar-brand-text span");
    if (subBrand) subBrand.innerText = "Plataforma Oficial";
}

function asegurarBotonTemaEnTopbarCDM() {
    sincronizarSidebarActivoCDM();
    const topRight = document.querySelector(".topbar-right") || document.querySelector(".topbar-actions");
    if (topRight && !document.getElementById("btnToggleTemaCDM")) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.id = "btnToggleTemaCDM";
        btn.className = "btn btn-ghost btn-sm btn-theme-toggle";
        btn.title = "Cambiar entre Modo Día y Modo Noche";
        btn.onclick = alternarTemaVisualCDM;
        topRight.prepend(btn);
    }
    aplicarTemaGuardadoCDM();
}

// Aplicar el tema de inmediato para evitar parpadeos
aplicarTemaGuardadoCDM();

// --- GUARDIA INMEDIATO DE SESIÓN Y CARGA AUTOMÁTICA DE LOGIN.JS ---
(function () {
    const esLogin = window.location.pathname.toLowerCase().includes("login.html");
    const sesion = localStorage.getItem("cdm_sesion_activa_v1");
    if (!sesion && !esLogin) {
        window.location.replace("login.html");
        return;
    }
    if (!document.querySelector('script[src*="login.js"]')) {
        const s = document.createElement("script");
        s.src = "login.js";
        s.onload = function () {
            if (typeof verificarAccesoYRolEnApp === "function") {
                verificarAccesoYRolEnApp();
            }
        };
        document.head.appendChild(s);
    }
})();
// =========================================================================
// CATÁLOGO INICIAL DE LA VIDEOTECA DE EJERCICIOS DEL GIMNASIO
// =========================================================================

const VIDEOTECA_POR_DEFECTO = [
    {
        id: 9001,
        nombre: "Sentadilla Trasera con Barra",
        grupo: "Tren Inferior",
        grupoSecundario: "Piernas y Glúteos",
        nivel: "Intermedio / Avanzado",
        equipo: "Barra Olímpica y Rack",
        seriesSugeridas: 4,
        repsSugeridas: "6-8",
        pausaSugerida: "2m",
        videoUrl: "https://www.youtube.com/watch?v=ultWZbUMPL8",
        imagenPreview: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=700&q=80",
        clavesTecnicas: "Pies al ancho de hombros, tomar aire profundo (bracing abdominal), descender controlando cadera y rodillas en línea con la punta de los pies, subir empujando el piso con fuerza.",
        erroresComunes: "Evitar que las rodillas colapsen hacia adentro (valgo) o despegar los talones del suelo."
    },
    {
        id: 9002,
        nombre: "Press de Banca Plano",
        grupo: "Empuje / Torso",
        grupoSecundario: "Pecho y Empuje",
        nivel: "Todos los niveles",
        equipo: "Banco Plano y Barra",
        seriesSugeridas: 4,
        repsSugeridas: "8-10",
        pausaSugerida: "90s",
        videoUrl: "https://www.youtube.com/watch?v=rT7DgCr-3pg",
        imagenPreview: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=700&q=80",
        clavesTecnicas: "Retraer escápulas contra el banco, apoyar firme los pies en el piso, bajar la barra de forma controlada hasta la línea media del esternón con codos a 45°.",
        erroresComunes: "No abrir los codos a 90° a la altura del cuello ni rebotar la barra contra el pecho."
    },
    {
        id: 9003,
        nombre: "Peso Muerto Rumano (Isquios y Glúteos)",
        grupo: "Tren Inferior",
        grupoSecundario: "Piernas y Glúteos",
        nivel: "Intermedio",
        equipo: "Barra o Mancuernas",
        seriesSugeridas: 4,
        repsSugeridas: "8-10",
        pausaSugerida: "90s",
        videoUrl: "https://www.youtube.com/watch?v=JCXUYuzwNrM",
        imagenPreview: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=700&q=80",
        clavesTecnicas: "Bisagra de cadera llevando la cola hacia atrás con leve flexión de rodillas. Mantener la barra pegada a los muslos y espalda 100% neutra sintiendo el estiramiento femoral.",
        erroresComunes: "Encorvar la zona lumbar o bajar flexionando demasiado las rodillas como si fuera una sentadilla."
    },
    {
        id: 9004,
        nombre: "Dominadas / Jalón al Pecho en Polea",
        grupo: "Tracción / Espalda",
        grupoSecundario: "Espalda y Tracción",
        nivel: "Todos los niveles",
        equipo: "Barra Fija o Polea Alta",
        seriesSugeridas: 4,
        repsSugeridas: "8-12",
        pausaSugerida: "90s",
        videoUrl: "https://www.youtube.com/watch?v=eGo4IYlbE5g",
        imagenPreview: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=700&q=80",
        clavesTecnicas: "Iniciar el movimiento deprimiendo las escápulas (hombros lejos de las orejas) y traccionar llevando los codos hacia las costillas hasta pasar el mentón o tocar el pecho superior.",
        erroresComunes: "Balancear las piernas o tirar encogiendo los hombros y adelantando el cuello."
    },
    {
        id: 9005,
        nombre: "Sentadilla Búlgara Unilateral",
        grupo: "Tren Inferior",
        grupoSecundario: "Piernas y Glúteos",
        nivel: "Intermedio",
        equipo: "Banco y Mancuernas",
        seriesSugeridas: 3,
        repsSugeridas: "8-10 c/pierna",
        pausaSugerida: "75s",
        videoUrl: "https://www.youtube.com/watch?v=2C-uNgKwPLE",
        imagenPreview: "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=700&q=80",
        clavesTecnicas: "Empezar siempre por la pierna menos hábil. Inclinarse levemente hacia adelante para enfatizar glúteo y cuádriceps, bajando hasta que la rodilla trasera quede cerca del piso.",
        erroresComunes: "Perder la alineación de la rodilla delantera o apoyar demasiado peso en el pie de atrás."
    },
    {
        id: 9006,
        nombre: "Hip Thrust con Barra (Empuje de Cadera)",
        grupo: "Tren Inferior",
        grupoSecundario: "Piernas y Glúteos",
        nivel: "Todos los niveles",
        equipo: "Banco, Almohadilla y Barra",
        seriesSugeridas: 4,
        repsSugeridas: "10-12",
        pausaSugerida: "90s",
        videoUrl: "https://www.youtube.com/watch?v=SEdqd1n0cvg",
        imagenPreview: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=700&q=80",
        clavesTecnicas: "Apoyar el borde inferior de las escápulas en el banco, mirada al frente (mentón pegado), empujar con los talones y sostener 1 segundo de contracción máxima arriba.",
        erroresComunes: "Hiperextender la espalda baja arriba en vez de bloquear con la pelvis."
    },
    {
        id: 9007,
        nombre: "Remo Unilateral con Mancuerna",
        grupo: "Tracción / Espalda",
        grupoSecundario: "Espalda y Tracción",
        nivel: "Todos los niveles",
        equipo: "Banco y Mancuerna",
        seriesSugeridas: 3,
        repsSugeridas: "10-12 c/lado",
        pausaSugerida: "60s",
        videoUrl: "https://www.youtube.com/watch?v=pYcpY20QaE8",
        imagenPreview: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=700&q=80",
        clavesTecnicas: "Tronco firme paralelo al suelo, llevar la mancuerna en trayectoria curva hacia el bolsillo de la cadera sintiendo el dorsal ancho.",
        erroresComunes: "Rotar excesivamente el torso o tirar solo con el bíceps hacia el hombro."
    },
    {
        id: 9008,
        nombre: "Press Militar de Hombros (Overhead Press)",
        grupo: "Empuje / Torso",
        grupoSecundario: "Pecho y Empuje",
        nivel: "Intermedio",
        equipo: "Barra o Mancuernas",
        seriesSugeridas: 4,
        repsSugeridas: "8-10",
        pausaSugerida: "90s",
        videoUrl: "https://www.youtube.com/watch?v=2yjwXTZQDDI",
        imagenPreview: "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?auto=format&fit=crop&w=700&q=80",
        clavesTecnicas: "Contraer glúteos y abdomen para proteger la columna lumbar. Empujar en línea vertical desde la clavícula hasta bloquear arriba de la corona de la cabeza.",
        erroresComunes: "Arquear la cintura hacia atrás para compensar falta de estabilidad en el core."
    },
    {
        id: 9009,
        nombre: "Plancha Abdominal RKC y Core Antirotacional",
        grupo: "Core y Funcional",
        grupoSecundario: "Core y Funcional",
        nivel: "Todos los niveles",
        equipo: "Colchoneta / Peso Corporal",
        seriesSugeridas: 4,
        repsSugeridas: "35s sostén",
        pausaSugerida: "45s",
        videoUrl: "https://www.youtube.com/watch?v=ASdvN_XEl_c",
        imagenPreview: "https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?auto=format&fit=crop&w=700&q=80",
        clavesTecnicas: "Codos debajo de los hombros, traccionar codos hacia las puntas de los pies isométricamente, glúteos y abdomen contraídos al 100%.",
        erroresComunes: "Dejar caer la cadera generando tensión lumbar o contener la respiración."
    },
    {
        id: 9010,
        nombre: "Salto al Cajón Explosivo (Box Jump / Pliometría)",
        grupo: "Potencia y Pliometría",
        grupoSecundario: "Piernas y Glúteos",
        nivel: "Intermedio / Avanzado",
        equipo: "Cajón Pliométrico",
        seriesSugeridas: 4,
        repsSugeridas: "5 saltos",
        pausaSugerida: "90s",
        videoUrl: "https://www.youtube.com/watch?v=52r_Ul5k03g",
        imagenPreview: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=700&q=80",
        clavesTecnicas: "Triple extensión rápida de tobillo, rodilla y cadera. Aterrizar suave en el cajón en posición de media sentadilla amortiguando el impacto.",
        erroresComunes: "Aterrizar con las rodillas rígidas o en valgo, o bajar saltando de espaldas."
    },
    {
        id: 9011,
        nombre: "Protocolo Isométrico y Estabilidad de Rodilla",
        grupo: "Movilidad y Rehab",
        grupoSecundario: "Rehabilitación",
        nivel: "Readaptación / Preventivo",
        equipo: "Banda Elástica / Pared",
        seriesSugeridas: 4,
        repsSugeridas: "30-40s sin dolor",
        pausaSugerida: "60s",
        videoUrl: "https://www.youtube.com/watch?v=y28L1k1vW9s",
        imagenPreview: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=700&q=80",
        clavesTecnicas: "Mantener ángulo controlado libre de dolor articular, activando el vasto interno del cuádriceps y glúteo medio con banda en rodillas.",
        erroresComunes: "Trabajar por encima del umbral de dolor o hacer rebotes bruscos."
    }
];

function normalizarTextoEjercicioCDM(txt) {
    return (txt || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function obtenerTodosLosNombresEjerciciosCDM() {
    const mapa = new Map();
    const registrar = (nom) => {
        const limpio = (nom || "").trim();
        if (!limpio) return;
        const clave = normalizarTextoEjercicioCDM(limpio);
        if (clave && !mapa.has(clave)) mapa.set(clave, limpio);
    };

    (baseCatalogoEjercicios || []).forEach(e => registrar(e.nombre));
    (baseVideoteca || []).forEach(v => registrar(v.nombre));
    (basePersonas || []).forEach(p => {
        (p.evaluaciones || []).forEach(ev => registrar(ev.ejercicio));
    });
    (baseRutinas || []).forEach(r => {
        (r.ejercicios || []).forEach(ex => registrar(ex.nombre));
    });

    return Array.from(mapa.values());
}

function sincronizarDatalistsEjerciciosCDM() {
    const todos = obtenerTodosLosNombresEjerciciosCDM();
    const opcionesHTML = todos.map(nom => `<option value="${nom.replace(/"/g, '&quot;')}">`).join("");

    const dlGym = document.getElementById("listaEjerciciosGymAdmin");
    if (dlGym) dlGym.innerHTML = opcionesHTML;

    const dlJug = document.getElementById("listaEjerciciosSugeridos");
    if (dlJug) dlJug.innerHTML = opcionesHTML;
}

function agregarEjercicioInventadoAlCatalogoCDM(nombreRaw, tipoMedicion = "fuerza_1rm", silencioso = false) {
    const limpio = (nombreRaw || "").replace(/\s+/g, " ").trim();
    if (!limpio) return null;

    const clave = normalizarTextoEjercicioCDM(limpio);
    const yaEnCatalogo = (baseCatalogoEjercicios || []).find(e => normalizarTextoEjercicioCDM(e.nombre) === clave);
    const yaEnVideoteca = (baseVideoteca || []).find(v => normalizarTextoEjercicioCDM(v.nombre) === clave);

    let nombreFinal = yaEnCatalogo ? yaEnCatalogo.nombre : (yaEnVideoteca ? yaEnVideoteca.nombre : limpio);

    if (!yaEnCatalogo) {
        baseCatalogoEjercicios.push({
            id: "ej_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
            nombre: nombreFinal,
            tipo: tipoMedicion || "fuerza_1rm",
            personalizado: true
        });
        localStorage.setItem("cdm_catalogo_ej_v1", JSON.stringify(baseCatalogoEjercicios));
        if (!silencioso && typeof mostrarToast === "function") {
            mostrarToast(`✨ Nuevo ejercicio "${nombreFinal}" agregado a la lista.`);
        }
    }

    sincronizarDatalistsEjerciciosCDM();
    if (typeof inyectarAsistenteEjerciciosEnFormulario === "function") {
        inyectarAsistenteEjerciciosEnFormulario();
    }
    return nombreFinal;
}

function asegurarVideotecaCargada() {
    if (!Array.isArray(baseVideoteca) || baseVideoteca.length === 0) {
        baseVideoteca = [...VIDEOTECA_POR_DEFECTO];
        localStorage.setItem("cdm_videoteca_v1", JSON.stringify(baseVideoteca));
    }
    sincronizarDatalistsEjerciciosCDM();
}

// =========================================================================
// 0. ESTILOS DINÁMICOS PARA VIDEOTECA Y MÓDULOS AVANZADOS
// =========================================================================

function inyectarEstilosAvanzadosCDM() {
    if (document.getElementById("cdm-advanced-styles")) return;
    const style = document.createElement("style");
    style.id = "cdm-advanced-styles";
    style.innerHTML = `
        /* Grilla fluida manejada en styles.css */
        .live-scoreboard {
            background: linear-gradient(135deg, var(--cdm-900) 0%, #093552 100%);
            color: #ffffff;
            border-radius: 16px;
            padding: 0.95rem 1.25rem;
            margin-bottom: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
            box-shadow: var(--shadow-card);
            border: 1px solid rgba(56, 189, 248, 0.28);
        }
        .score-team-box { display: flex; align-items: center; gap: 0.6rem; }
        .score-number {
            font-size: 1.75rem;
            font-weight: 900;
            background: rgba(255, 255, 255, 0.12);
            padding: 0.18rem 0.8rem;
            border-radius: 12px;
            color: #38bdf8;
            min-width: 50px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .bench-strip {
            margin-top: 0.85rem;
            background: var(--surface-subtle);
            border: 1.5px dashed var(--line-celeste);
            border-radius: 14px;
            padding: 0.85rem 1rem;
        }
        .micro-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(235px, 1fr));
            gap: 0.95rem;
        }
        .micro-day-card {
            background: var(--surface);
            border: 1.5px solid var(--line);
            border-top: 4px solid var(--cdm-500);
            border-radius: 14px;
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.55rem;
            box-shadow: var(--shadow-sm);
        }
        .rm-zone-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 0.75rem;
            margin-top: 0.9rem;
        }
        .rm-zone-card {
            background: var(--cdm-50);
            border: 1px solid var(--line-celeste);
            border-radius: 12px;
            padding: 0.85rem;
            text-align: center;
            transition: transform 0.2s ease;
        }
        .rm-zone-card:hover { transform: translateY(-3px); border-color: var(--cdm-500); }
        .rm-zone-card strong { font-size: 1.35rem; font-weight: 900; color: var(--cdm-900); display: block; margin: 3px 0; }
        .h2h-row {
            display: grid;
            grid-template-columns: 1fr 110px 1fr;
            align-items: center;
            gap: 0.6rem;
            padding: 0.55rem 0.75rem;
            border-bottom: 1px solid var(--line);
            font-size: 0.84rem;
        }
        .h2h-label {
            text-align: center;
            font-size: 0.7rem;
            font-weight: 800;
            text-transform: uppercase;
            color: var(--ink-500);
            background: var(--surface-subtle);
            padding: 0.25rem 0.4rem;
            border-radius: 8px;
        }
        .videoteca-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
            gap: 1.2rem;
        }
        .video-exercise-card {
            background: var(--surface);
            border: 1.5px solid var(--line);
            border-radius: 18px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: var(--shadow-card);
            transition: all 0.25s var(--ease);
        }
        .video-exercise-card:hover {
            transform: translateY(-5px);
            border-color: var(--cdm-500);
            box-shadow: var(--shadow-float);
        }
        .video-thumb-box {
            position: relative;
            height: 185px;
            background: var(--cdm-900);
            overflow: hidden;
            cursor: pointer;
        }
        .video-thumb-box img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.45s ease;
            opacity: 0.88;
        }
        .video-exercise-card:hover .video-thumb-box img {
            transform: scale(1.07);
            opacity: 1;
        }
        .video-play-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, rgba(6, 40, 61, 0.88) 0%, rgba(6, 40, 61, 0.2) 60%);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .play-circle-btn {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: rgba(0, 149, 219, 0.94);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            box-shadow: 0 8px 24px rgba(0, 149, 219, 0.5);
            border: 2.5px solid #ffffff;
            transition: transform 0.2s ease;
        }
        .video-thumb-box:hover .play-circle-btn {
            transform: scale(1.12);
            background: var(--cdm-600);
        }
        .video-card-body {
            padding: 1.15rem;
            display: flex;
            flex-direction: column;
            gap: 0.65rem;
            flex: 1;
        }
        .video-cues-box {
            background: var(--cdm-50);
            border-left: 3.5px solid var(--cdm-500);
            padding: 0.55rem 0.7rem;
            border-radius: 8px;
            font-size: 0.77rem;
            color: var(--ink-700);
            line-height: 1.4;
        }
        .video-iframe-container {
            position: relative;
            width: 100%;
            padding-bottom: 56.25%;
            height: 0;
            background: #000;
            border-radius: 14px;
            overflow: hidden;
            margin-bottom: 1rem;
        }
        .video-iframe-container iframe, .video-iframe-container video {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
        }
        @media (max-width: 820px) {
            .module-tabs.tabs-5, .module-tabs.tabs-4 {
                grid-template-columns: repeat(2, 1fr);
            }
            .live-scoreboard { justify-content: center; text-align: center; }
        }
    `;
    document.head.appendChild(style);
}

// =========================================================================
// MOTOR DE SCORE DEL 1 AL 10 (SOLO DEPORTES - 100% CONTROLADO POR EL ADMIN)
// =========================================================================

function normalizarNota1a10(valor, defecto = 7.0) {
    let n = parseFloat(valor);
    if (isNaN(n)) return defecto;
    // Migración automática si quedaron puntajes viejos en escala 0-100
    if (n > 10) n = n / 10;
    return Math.min(10, Math.max(1, Math.round(n * 10) / 10));
}

function normalizarBonus1a10(valor) {
    let b = parseFloat(valor);
    if (isNaN(b)) return 0;
    if (Math.abs(b) > 5) b = b / 10;
    return Math.max(-5, Math.min(5, Math.round(b * 10) / 10));
}

function generarCodigoPersonalCDM(lista = basePersonas) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let bloque = "";
    for (let i = 0; i < 4; i++) {
        bloque += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    let sigla = "CDM";
    try {
        const lic = JSON.parse(localStorage.getItem("cdm_licencia_config_v1") || "null");
        if (lic && lic.siglaCodigo) sigla = String(lic.siglaCodigo).toUpperCase();
    } catch {}
    const cod = `${sigla}-${bloque}`;
    if (Array.isArray(lista) && lista.some(x => x && x.codigoAcceso === cod)) {
        return generarCodigoPersonalCDM(lista);
    }
    return cod;
}

function verificarVencimientoCuota30DiasCDM(p) {
    if (!p || !p.ultimoPagoFecha) return;
    if ((p.pagoEstado || "Al Día") === "Al Día") {
        const hoyMs = new Date().getTime();
        const pagoMs = new Date(p.ultimoPagoFecha).getTime();
        if (!isNaN(pagoMs)) {
            const diasTranscurridos = Math.floor((hoyMs - pagoMs) / (1000 * 60 * 60 * 24));
            if (diasTranscurridos > 30) {
                p.pagoEstado = "Pendiente";
            }
        }
    }
}

function asegurarPilaresPersona(p) {
    if (!p.codigoAcceso) {
        p.codigoAcceso = generarCodigoPersonalCDM(basePersonas);
    }
    if (!Array.isArray(p.asistencias)) p.asistencias = [];
    if (!Array.isArray(p.evaluaciones)) p.evaluaciones = [];
    if (!Array.isArray(p.clinico)) p.clinico = [];
    if (!Array.isArray(p.historialPagos)) p.historialPagos = [];
    verificarVencimientoCuota30DiasCDM(p);

    // El Gimnasio NO lleva sistema de Score ni Pilares deportivos
    if (p.deporte === "Gimnasio") {
        p.puntosCategoria = null;
        return;
    }

    const baseInicial = normalizarNota1a10(p.puntosCategoria, 7.0);
    if (!p.pilares) {
        p.pilares = {
            fisico: baseInicial,
            gym: baseInicial,
            tecnico: baseInicial,
            actitud: baseInicial,
            bonus: 0
        };
    } else {
        p.pilares.fisico = normalizarNota1a10(p.pilares.fisico, baseInicial);
        p.pilares.gym = normalizarNota1a10(p.pilares.gym, baseInicial);
        p.pilares.tecnico = normalizarNota1a10(p.pilares.tecnico, baseInicial);
        p.pilares.actitud = normalizarNota1a10(p.pilares.actitud, baseInicial);
        p.pilares.bonus = normalizarBonus1a10(p.pilares.bonus);
    }

    recalcularPuntajePonderado(p);
}

function recalcularPuntajePonderado(p) {
    if (p.deporte === "Gimnasio") {
        p.puntosCategoria = null;
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

function guardarDatosCDM(omitirSyncServidor = false) {
    basePersonas.forEach(p => asegurarPilaresPersona(p));
    localStorage.setItem("cdm_personas_v1", JSON.stringify(basePersonas));
    localStorage.setItem("cdm_rutinas_v1", JSON.stringify(baseRutinas));
    localStorage.setItem("cdm_partidos_v1", JSON.stringify(basePartidos));
    localStorage.setItem("cdm_alineaciones_v2", JSON.stringify(baseAlineaciones));
    localStorage.setItem("cdm_microciclos_v1", JSON.stringify(baseMicrociclos));
    localStorage.setItem("cdm_videoteca_v1", JSON.stringify(baseVideoteca));
    localStorage.setItem("cdm_catalogo_ej_v1", JSON.stringify(baseCatalogoEjercicios));

    if (!omitirSyncServidor) {
        sincronizarCambiosHaciaServidorCDM();
    }
}

function sincronizarCambiosHaciaServidorCDM() {
    if (window.location.protocol === "file:") return;
    try {
        const claveClub = localStorage.getItem("cdm_club_activo_id_v1") || "cdm_adelia_maria_principal";
        if (typeof guardarSnapshotClubActualEnMapaLocal === "function") {
            guardarSnapshotClubActualEnMapaLocal();
        }
        const sesion = JSON.parse(localStorage.getItem("cdm_sesion_activa_v1") || "null");
        if (sesion && sesion.rol === "usuario" && sesion.personaId) {
            const miPersona = basePersonas.find(x => Number(x.id) === Number(sesion.personaId));
            if (miPersona) {
                fetch(`/api/cdm/jugador/${miPersona.id}/sync`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        claveClub,
                        personaActualizada: miPersona,
                        catalogoEjercicios: baseCatalogoEjercicios
                    })
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
                licenciaConfig: JSON.parse(localStorage.getItem("cdm_licencia_config_v1") || "{}")
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
        const claveClub = localStorage.getItem("cdm_club_activo_id_v1") || "cdm_adelia_maria_principal";
        const resp = await fetch(`/api/cdm/estado?club=${encodeURIComponent(claveClub)}`, { cache: "no-store" });
        if (!resp.ok) return false;
        const data = await resp.json();
        const est = data?.estado;
        if (!est) return false;

        if (est.licenciaConfig && typeof est.licenciaConfig === "object" && Object.keys(est.licenciaConfig).length > 0) {
            localStorage.setItem("cdm_licencia_config_v1", JSON.stringify(est.licenciaConfig));
            if (typeof aplicarLicenciaYModulosCDM === "function") aplicarLicenciaYModulosCDM();
            if (typeof sincronizarSidebarActivoCDM === "function") sincronizarSidebarActivoCDM();
        }

        const esClubSecundario = claveClub !== "cdm_adelia_maria_principal";
        if ((Array.isArray(est.personas) && est.personas.length > 0) || esClubSecundario) {
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
            // Si el club principal recién arranca vacío en el servidor pero esta PC ya tenía datos, los subimos
            sincronizarCambiosHaciaServidorCDM();
        }
    } catch {}
    return false;
}

function obtenerHoyISO() {
    return new Date().toISOString().split("T")[0];
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
    }, 3100);
}

// =========================================================================
// MOTOR DE FOTOS DE PERFIL (SUBIR, COMPRIMIR, EDITAR Y QUITAR FOTO)
// =========================================================================

function obtenerInicialesPersonaCDM(p) {
    const n = (p?.nombre || "A").trim().charAt(0);
    const a = (p?.apellido || "B").trim().charAt(0);
    return `${n}${a}`.toUpperCase();
}

function renderAvatarPersonaCDM(p, size = 54, fontSize = "1.1rem", editable = false) {
    if (!p) return "";
    const iniciales = obtenerInicialesPersonaCDM(p);
    const clickAttr = editable
        ? `onclick="event.stopPropagation(); abrirPanelFotoPerfilCDM(${p.id})" title="Tocá para agregar, cambiar o quitar la foto"`
        : "";
    const camBadge = editable
        ? `<span class="avatar-cam-badge"><i class="ri-camera-fill"></i></span>`
        : "";

    if (p.foto) {
        return `
            <div class="ath-avatar has-photo ${editable ? "avatar-editable" : ""}" style="width:${size}px; height:${size}px; font-size:${fontSize};" ${clickAttr}>
                <img src="${p.foto}" alt="${p.nombre || ""}" class="ath-avatar-img">
                ${camBadge}
            </div>
        `;
    }

    return `
        <div class="ath-avatar ${editable ? "avatar-editable" : ""}" style="width:${size}px; height:${size}px; font-size:${fontSize};" ${clickAttr}>
            <span>${iniciales}</span>
            ${camBadge}
        </div>
    `;
}

function comprimirImagenArchivoCDM(file, maxSide = 320, quality = 0.84, callback) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement("canvas");
            canvas.width = maxSide;
            canvas.height = maxSide;
            const ctx = canvas.getContext("2d");

            // Recorte cuadrado centrado (cover) para que la foto de perfil nunca quede deformada
            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;

            ctx.fillStyle = "#071526";
            ctx.fillRect(0, 0, maxSide, maxSide);
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, maxSide, maxSide);

            const dataUrl = canvas.toDataURL("image/jpeg", quality);
            callback(dataUrl);
        };
        img.onerror = function () {
            alert("⚠️ No se pudo procesar la imagen seleccionada. Probá con otro archivo JPG o PNG.");
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
}

let idPersonaFotoActivaCDM = null;

function abrirPanelFotoPerfilCDM(idPersona) {
    const p = basePersonas.find(x => x.id === Number(idPersona));
    if (!p) return;

    // Si es usuario, verificar que solo edite su propia foto
    try {
        const ses = JSON.parse(localStorage.getItem("cdm_sesion_activa_v1"));
        if (ses && ses.rol === "usuario" && Number(ses.personaId) !== Number(p.id)) {
            mostrarToast("🔒 Solo podés modificar tu propia foto de perfil.");
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

    const iniciales = obtenerInicialesPersonaCDM(p);
    const previewInterior = p.foto
        ? `<img src="${p.foto}" alt="${p.nombre}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`
        : `<span>${iniciales}</span>`;

    modal.innerHTML = `
        <div class="modal-window" style="max-width:440px; text-align:center;">
            <div class="modal-top">
                <div style="text-align:left;">
                    <span class="badge badge-celeste">FOTO DE PERFIL OFICIAL</span>
                    <h3 style="color:var(--ink-900); margin-top:4px;">📷 ${p.nombre} ${p.apellido}</h3>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarPanelFotoPerfilCDM()">✕</button>
            </div>

            <div style="display:flex; flex-direction:column; align-items:center; gap:0.9rem; margin:0.5rem 0 1.25rem;">
                <div id="cajaPreviewFotoGestorCDM" class="ath-avatar has-photo" style="width:118px; height:118px; border-radius:28px; font-size:2.2rem; box-shadow:var(--shadow-float);">
                    ${previewInterior}
                </div>
                <small style="color:var(--ink-500); font-size:0.78rem;">
                    Podés subir una foto desde tu galería o cámara, cambiarla cuando quieras o quitarla.
                </small>
            </div>

            <div style="display:flex; flex-direction:column; gap:0.65rem;">
                <label class="btn btn-primary" style="cursor:pointer; width:100%;">
                    <i class="ri-camera-lens-line"></i> ${p.foto ? "Cambiar Foto (Galería / Cámara)" : "Subir Foto (Galería / Cámara)"}
                    <input type="file" accept="image/*" onchange="subirArchivoFotoPerfilCDM(event)" style="display:none;">
                </label>

                <div style="display:flex; gap:0.45rem; margin-top:0.2rem;">
                    <input type="url" id="inputUrlFotoPerfilCDM" placeholder="O pegá el link (URL) de una foto..." value="${p.foto && p.foto.startsWith('http') ? p.foto : ''}" style="flex:1; font-size:0.8rem;">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="aplicarUrlFotoPerfilCDM()">Usar Link</button>
                </div>

                ${p.foto ? `
                    <button type="button" class="btn btn-danger btn-sm" style="width:100%; margin-top:0.35rem;" onclick="quitarFotoPerfilActualCDM()">
                        <i class="ri-delete-bin-line"></i> Quitar Foto Actual y Usar Iniciales
                    </button>
                ` : ""}
            </div>
        </div>
    `;
    modal.classList.remove("hidden");
}

function cerrarPanelFotoPerfilCDM() {
    document.getElementById("modalGestorFotoPerfilCDM")?.classList.add("hidden");
}

function refrescarVistasTrasCambioFotoCDM() {
    guardarDatosCDM();
    if (document.body.dataset.page === "perfil-individual" && typeof inicializarPaginaJugadorIndividual === "function") {
        inicializarPaginaJugadorIndividual();
    }
    if (deportePagina && typeof renderizarPaginaDeporte === "function") {
        renderizarPaginaDeporte();
    }
    if (document.getElementById("countFutbol") && typeof inicializarIndex === "function") {
        inicializarIndex();
    }
    if (document.body.dataset.page === "mi-ficha" && typeof inicializarPanelSocio === "function") {
        inicializarPanelSocio();
    }
    if (document.getElementById("homeCategoryGrid") && typeof refrescarTodoAMS === "function") {
        refrescarTodoAMS();
    }
}

function subirArchivoFotoPerfilCDM(event) {
    const file = event.target.files?.[0];
    if (!file || !idPersonaFotoActivaCDM) return;
    const p = basePersonas.find(x => x.id === Number(idPersonaFotoActivaCDM));
    if (!p) return;

    comprimirImagenArchivoCDM(file, 320, 0.84, (dataUrl) => {
        p.foto = dataUrl;
        refrescarVistasTrasCambioFotoCDM();
        abrirPanelFotoPerfilCDM(p.id);
        mostrarToast(`📸 Foto de ${p.nombre} actualizada con éxito.`);
    });
}

function aplicarUrlFotoPerfilCDM() {
    const url = (document.getElementById("inputUrlFotoPerfilCDM")?.value || "").trim();
    if (!url || !idPersonaFotoActivaCDM) return;
    const p = basePersonas.find(x => x.id === Number(idPersonaFotoActivaCDM));
    if (!p) return;

    p.foto = url;
    refrescarVistasTrasCambioFotoCDM();
    abrirPanelFotoPerfilCDM(p.id);
    mostrarToast(`📸 Foto actualizada mediante enlace.`);
}

function quitarFotoPerfilActualCDM() {
    if (!idPersonaFotoActivaCDM) return;
    const p = basePersonas.find(x => x.id === Number(idPersonaFotoActivaCDM));
    if (!p) return;

    p.foto = null;
    refrescarVistasTrasCambioFotoCDM();
    cerrarPanelFotoPerfilCDM();
    mostrarToast(`🗑️ Foto quitada. Se restauraron las iniciales de ${p.nombre}.`);
}

function contarAsistenciasUltimos7Dias(persona) {
    if (!Array.isArray(persona.asistencias)) return 0;
    const hoy = new Date();
    let contador = 0;
    for (let i = 0; i < 7; i++) {
        const d = new Date(hoy);
        d.setDate(hoy.getDate() - i);
        const iso = d.toISOString().split("T")[0];
        if (persona.asistencias.includes(iso)) contador++;
    }
    return contador;
}

// =========================================================================
// 1. PORTAL EJECUTIVO (INDEX.HTML) + TERMINAL DE RECEPCIÓN Y ALERTAS
// =========================================================================

function inicializarIndex() {
    basePersonas.forEach(p => asegurarPilaresPersona(p));

    const activos = basePersonas.filter(p => p.activo);
    const fList = activos.filter(p => p.deporte === "Futbol");
    const hList = activos.filter(p => p.deporte === "Hockey");
    const gList = activos.filter(p => p.deporte === "Gimnasio");

    const elF = document.getElementById("countFutbol");
    if (!elF) return;

    elF.innerText = `${fList.length} activos`;
    document.getElementById("countHockey").innerText = `${hList.length} activos`;
    document.getElementById("countGym").innerText = `${gList.length} socios`;

    renderizarTarjetasDeportesExtraIndex(activos);
    renderizarResumenEjecutivoIndex(activos, fList, hList, gList);
    renderizarTerminalRecepcionYAlertasIndex(activos);
}

function renderizarTarjetasDeportesExtraIndex(activos) {
    const grid = document.querySelector(".sports-showcase-grid");
    if (!grid) return;
    grid.querySelectorAll(".extra-sport-card").forEach(el => el.remove());

    let deportesExtra = [];
    try {
        const lic = JSON.parse(localStorage.getItem("cdm_licencia_config_v1") || "null");
        if (lic && Array.isArray(lic.deportesExtra)) deportesExtra = lic.deportesExtra;
    } catch {}

    deportesExtra.forEach(depRaw => {
        const nombreLimpio = String(depRaw || "").replace(/^[^\w\sÁÉÍÓÚáéíóúÑñ]+\s*/, "").trim() || depRaw;
        const cant = activos.filter(p => p.deporte === nombreLimpio || p.deporte === depRaw).length;
        const card = document.createElement("a");
        card.href = `futbol.html?deporte=${encodeURIComponent(nombreLimpio)}`;
        card.className = "sport-showcase-card extra-sport-card";
        card.innerHTML = `
            <div class="sport-card-visual">
                <div class="sport-card-bg" style="background:linear-gradient(135deg, #0f172a 0%, #0284c7 60%, #0369a1 100%);"></div>
                <div class="sport-card-top">
                    <span class="sport-chip-glass">${depRaw.toUpperCase()}</span>
                    <span class="showcase-live-count">${cant} activos</span>
                </div>
                <div class="sport-card-visual-title">
                    <h3>${depRaw}</h3>
                </div>
            </div>
            <div class="sport-card-content">
                <p class="sport-card-desc">Planteles por división, pizarra táctica en vivo, plan semanal, rutinas y ranking del 1 al 10.</p>
                <div class="sport-card-pills">
                    <span class="sport-mini-pill">Sub 13</span>
                    <span class="sport-mini-pill">Sub 15</span>
                    <span class="sport-mini-pill">Sub 17</span>
                    <span class="sport-mini-pill">Reserva</span>
                    <span class="sport-mini-pill">Primera</span>
                </div>
                <div class="sport-card-footer">
                    <span>Abrir panel de ${nombreLimpio}</span>
                    <i class="ri-arrow-right-line"></i>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderizarResumenEjecutivoIndex(activos) {
    const mainContent = document.querySelector(".app-content");
    const gridTarjetas = document.querySelector(".sports-showcase-grid");
    if (!mainContent || !gridTarjetas) return;

    const hoy = obtenerHoyISO();
    const presentesHoy = activos.filter(p => Array.isArray(p.asistencias) && p.asistencias.includes(hoy)).length;
    const recaudacionMes = activos
        .filter(p => (p.pagoEstado || "Al Día") === "Al Día")
        .reduce((acc, p) => acc + Number(p.montoCuota || 25000), 0);

    const alertasFrecuencia = activos.filter(p => contarAsistenciasUltimos7Dias(p) < (p.frecuenciaSemanal || 3)).length;
    const alertasCuota = activos.filter(p => p.pagoEstado === "Pendiente").length;

    let strip = document.getElementById("indexExecutiveStrip");
    if (!strip) {
        strip = document.createElement("section");
        strip.id = "indexExecutiveStrip";
        strip.className = "bento-kpis animate-in";
        mainContent.insertBefore(strip, gridTarjetas);
    }

    strip.innerHTML = `
        <div class="bento-kpi">
            <div class="kpi-icon"><i class="ri-team-fill"></i></div>
            <div class="kpi-data">
                <span>Padrón Activo Total</span>
                <strong>${activos.length} personas</strong>
            </div>
        </div>
        <div class="bento-kpi">
            <div class="kpi-icon ok"><i class="ri-checkbox-circle-fill"></i></div>
            <div class="kpi-data">
                <span>Presentes Hoy (${hoy.slice(5)})</span>
                <strong>${presentesHoy} / ${activos.length}</strong>
            </div>
        </div>
        <div class="bento-kpi">
            <div class="kpi-icon warn"><i class="ri-alarm-warning-fill"></i></div>
            <div class="kpi-data">
                <span>Alertas Frecuencia / Cuota</span>
                <strong>${alertasFrecuencia} asist. • ${alertasCuota} pagos</strong>
            </div>
        </div>
        <div class="bento-kpi">
            <div class="kpi-icon purple"><i class="ri-money-dollar-circle-fill"></i></div>
            <div class="kpi-data">
                <span>Recaudación Activa Mes</span>
                <strong>$${recaudacionMes.toLocaleString("es-AR")}</strong>
            </div>
        </div>
    `;
}

let filtroTipoAlertaIndex = "todas";

function cambiarFiltroAlertaIndex(tipo) {
    filtroTipoAlertaIndex = tipo;
    const activos = basePersonas.filter(p => p.activo);
    renderizarTerminalRecepcionYAlertasIndex(activos);
}

function renderizarTerminalRecepcionYAlertasIndex(activos) {
    const mainContent = document.querySelector(".app-content");
    if (!mainContent) return;

    let hub = document.getElementById("indexExecutiveHub");
    if (!hub) {
        hub = document.createElement("section");
        hub.id = "indexExecutiveHub";
        hub.className = "split-equal animate-in";
        hub.style.marginTop = "0.5rem";
        mainContent.appendChild(hub);
    }

    const listaAlertas = [];
    activos.forEach(p => {
        const fue7d = contarAsistenciasUltimos7Dias(p);
        const pactado = p.frecuenciaSemanal || 3;
        if (p.estadoMedico && p.estadoMedico !== "Óptimo") {
            listaAlertas.push({
                persona: p,
                tipo: "salud",
                id: p.id,
                titulo: `${p.apellido}, ${p.nombre}`,
                sub: `${p.deporte} (${p.deporte === "Gimnasio" ? "Gym" : p.categoria}) • ${p.estadoMedico}`,
                badge: `<span class="badge badge-danger">🏥 Salud</span>`,
                accion: `<button class="btn btn-secondary btn-sm" onclick="irAPaginaIndividual(${p.id})">Ver Ficha</button>`
            });
        }
        if (p.pagoEstado === "Pendiente") {
            listaAlertas.push({
                persona: p,
                tipo: "cuotas",
                id: p.id,
                titulo: `${p.apellido}, ${p.nombre}`,
                sub: `${p.deporte} • Cuota pendiente ($${Number(p.montoCuota || 25000).toLocaleString("es-AR")})`,
                badge: `<span class="badge badge-danger">💳 Cuota</span>`,
                accion: `<button class="btn btn-whatsapp btn-sm" onclick="enviarReciboPagoWhatsApp(${p.id})"><i class="ri-whatsapp-line"></i> Cobrar</button>`
            });
        } else if (fue7d < pactado) {
            listaAlertas.push({
                persona: p,
                tipo: "asistencia",
                id: p.id,
                titulo: `${p.apellido}, ${p.nombre}`,
                sub: `${p.deporte} • Asistió ${fue7d} de ${pactado} días esta semana`,
                badge: `<span class="badge badge-warn">⚠️ Asistencia</span>`,
                accion: `<button class="btn btn-ghost btn-sm" onclick="enviarAlertaAsistenciaWhatsApp(${p.id})"><i class="ri-whatsapp-line"></i> Aviso</button>`
            });
        }
    });

    const alertasFiltradas = filtroTipoAlertaIndex === "todas"
        ? listaAlertas
        : listaAlertas.filter(a => a.tipo === filtroTipoAlertaIndex);

    const valorBuscadorPrevio = document.getElementById("inputBuscadorGlobalIndex")?.value || "";

    hub.innerHTML = `
        <div class="app-panel" style="margin-bottom:0;">
            <div class="panel-head" style="padding-bottom:0.8rem; margin-bottom:0.9rem;">
                <div>
                    <h3><i class="ri-qr-scan-2-line"></i> Recepción y Check-in Rápido</h3>
                    <small style="color:var(--ink-500)">Buscá por DNI o apellido para registrar presente hoy (✓)</small>
                </div>
            </div>
            <div class="search-box" style="margin-bottom:0.85rem;">
                <i class="ri-search-line"></i>
                <input type="text" id="inputBuscadorGlobalIndex" placeholder="Buscar DNI, apellido, nombre o disciplina..." value="${valorBuscadorPrevio.replace(/"/g, '&quot;')}" oninput="filtrarRecepcionGlobalIndex()">
            </div>
            <div id="contenedorResultadosRecepcionIndex" style="max-height:310px; overflow-y:auto; padding-right:2px;"></div>
        </div>

        <div class="app-panel" style="margin-bottom:0;">
            <div class="panel-head" style="padding-bottom:0.8rem; margin-bottom:0.8rem;">
                <div>
                    <h3><i class="ri-notification-badge-line"></i> Alertas Operativas</h3>
                    <small style="color:var(--ink-500)">Cuotas pendientes, baja asistencia semanal y partes médicos</small>
                </div>
                <span class="badge badge-celeste">${listaAlertas.length} activas</span>
            </div>

            <div class="alert-filter-pills">
                <button type="button" class="alert-filter-pill ${filtroTipoAlertaIndex === 'todas' ? 'active' : ''}" onclick="cambiarFiltroAlertaIndex('todas')">Todas (${listaAlertas.length})</button>
                <button type="button" class="alert-filter-pill ${filtroTipoAlertaIndex === 'cuotas' ? 'active' : ''}" onclick="cambiarFiltroAlertaIndex('cuotas')">💳 Cuotas (${listaAlertas.filter(x => x.tipo === 'cuotas').length})</button>
                <button type="button" class="alert-filter-pill ${filtroTipoAlertaIndex === 'asistencia' ? 'active' : ''}" onclick="cambiarFiltroAlertaIndex('asistencia')">📅 Asistencia (${listaAlertas.filter(x => x.tipo === 'asistencia').length})</button>
                <button type="button" class="alert-filter-pill ${filtroTipoAlertaIndex === 'salud' ? 'active' : ''}" onclick="cambiarFiltroAlertaIndex('salud')">🏥 Salud (${listaAlertas.filter(x => x.tipo === 'salud').length})</button>
            </div>

            <div style="display:flex; flex-direction:column; max-height:270px; overflow-y:auto; padding-right:2px;">
                ${alertasFiltradas.length ? alertasFiltradas.slice(0, 12).map(a => `
                    <div class="index-list-row">
                        <div class="index-row-person" onclick="irAPaginaIndividual(${a.id})">
                            ${renderAvatarPersonaCDM(a.persona, 40, "0.85rem", false)}
                            <div style="min-width:0;">
                                <div style="display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap;">
                                    <strong>${a.titulo}</strong> ${a.badge}
                                </div>
                                <small>${a.sub}</small>
                            </div>
                        </div>
                        <div style="flex-shrink:0;">${a.accion}</div>
                    </div>
                `).join("") : `<div class="empty-box" style="padding:1.6rem;"><strong style="color:var(--ok);">✓ Sin alertas en este filtro.</strong></div>`}
            </div>
        </div>
    `;

    filtrarRecepcionGlobalIndex();
}

function filtrarRecepcionGlobalIndex() {
    const cont = document.getElementById("contenedorResultadosRecepcionIndex");
    if (!cont) return;
    const q = (document.getElementById("inputBuscadorGlobalIndex")?.value || "").toLowerCase().trim();
    const hoy = obtenerHoyISO();
    const activos = basePersonas.filter(p => p.activo);

    if (activos.length === 0) {
        cont.innerHTML = `<div class="empty-box" style="padding:1.6rem;">Cargá la Demo en la barra lateral izquierda o ingresá a un área para dar de alta deportistas.</div>`;
        return;
    }

    const lista = q
        ? activos.filter(p =>
            p.nombre.toLowerCase().includes(q) ||
            p.apellido.toLowerCase().includes(q) ||
            p.dni.toLowerCase().includes(q) ||
            p.deporte.toLowerCase().includes(q)
          )
        : activos.slice(0, 5);

    if (lista.length === 0) {
        cont.innerHTML = `<div class="empty-box" style="padding:1.6rem;">No se encontró ninguna persona con "${q}".</div>`;
        return;
    }

    cont.innerHTML = lista.slice(0, 8).map(p => {
        const pres = p.asistencias.includes(hoy);
        const alDia = (p.pagoEstado || "Al Día") === "Al Día";
        const areaTag = p.deporte === "Gimnasio" ? "Gimnasio" : `${p.deporte} ${p.categoria}`;
        return `
            <div class="index-list-row">
                <div class="index-row-person" onclick="irAPaginaIndividual(${p.id})">
                    ${renderAvatarPersonaCDM(p, 40, "0.85rem", false)}
                    <div style="min-width:0;">
                        <div style="display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap;">
                            <strong>${p.apellido}, ${p.nombre}</strong>
                            <span class="badge badge-celeste" style="font-size:0.65rem; padding:0.15rem 0.55rem;">${areaTag}</span>
                        </div>
                        <small>DNI ${p.dni} • ${alDia ? "<span style='color:var(--ok);font-weight:700;'>Cuota al día</span>" : "<span style='color:var(--err);font-weight:700;'>Cuota pendiente</span>"}</small>
                    </div>
                </div>
                <button type="button" class="check-btn ${pres ? "checked" : ""}" onclick="toggleAsistenciaDesdeIndex(${p.id}, '${hoy}')" title="${pres ? 'Presente hoy (Tocá para quitar)' : 'Marcar presente hoy'}">✓</button>
            </div>
        `;
    }).join("");
}

function toggleAsistenciaDesdeIndex(idPersona, fecha) {
    const p = basePersonas.find(x => x.id === idPersona);
    if (!p) return;
    if (p.asistencias.includes(fecha)) {
        p.asistencias = p.asistencias.filter(f => f !== fecha);
        mostrarToast(`Asistencia quitada: ${p.nombre}`);
    } else {
        p.asistencias.push(fecha);
        p.asistencias.sort();
        mostrarToast(`✓ Ingreso registrado: ${p.nombre} ${p.apellido}`);
    }
    guardarDatosCDM();
    inicializarIndex();
}

function exportarBackupJSON() {
    const dataObj = {
        fechaExportacion: obtenerHoyISO(),
        personas: basePersonas,
        rutinas: baseRutinas,
        partidos: basePartidos,
        alineaciones: baseAlineaciones,
        microciclos: baseMicrociclos,
        videoteca: baseVideoteca
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataObj, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `cdm_backup_${obtenerHoyISO()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    mostrarToast("📥 Backup descargado correctamente.");
}

function importarBackupJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const dataObj = JSON.parse(e.target.result);
            if (!dataObj.personas || !Array.isArray(dataObj.personas)) {
                throw new Error("Archivo JSON inválido.");
            }
            if (confirm("⚠️ ¿Restaurar esta copia de seguridad? Reemplazará los datos actuales.")) {
                basePersonas = dataObj.personas || [];
                baseRutinas = dataObj.rutinas || [];
                basePartidos = dataObj.partidos || [];
                baseAlineaciones = dataObj.alineaciones || {};
                baseMicrociclos = dataObj.microciclos || {};
                if (Array.isArray(dataObj.videoteca) && dataObj.videoteca.length) {
                    baseVideoteca = dataObj.videoteca;
                }
                guardarDatosCDM();
                mostrarToast("✅ Copia de seguridad restaurada.");
                setTimeout(() => window.location.reload(), 900);
            }
        } catch (error) {
            alert("No se pudo leer el archivo JSON: " + error.message);
        }
    };
    reader.readAsText(file);
}

// =========================================================================
// 2. INYECCIÓN AUTOMÁTICA DE SECCIONES Y ADAPTACIÓN DEL RANKING (1 A 10)
// =========================================================================

function inyectarNuevasSeccionesDOM() {
    const main = document.querySelector(".app-content");
    const tabsBar = document.querySelector(".module-tabs");
    if (!main || !tabsBar) return;

    // Adaptar controles de Ranking de Deportes a la escala 1 a 10 controlada por el Admin
    const selPilar = document.getElementById("selectPilarRanking");
    if (selPilar) {
        const iconoDep = deportePagina === "Hockey" ? "🏑" : "⚽";
        selPilar.innerHTML = `
            <option value="general">👑 Score General Directo (Fijar o Ajustar 1 a 10)</option>
            <option value="tecnico">${iconoDep} Pilar Técnico / Táctico (1 a 10 — 25%)</option>
            <option value="fisico">🏃 Pilar Condición Física (1 a 10 — 30%)</option>
            <option value="gym">🏋️ Pilar Fuerza en Gimnasio (1 a 10 — 25%)</option>
            <option value="actitud">🔥 Pilar Compromiso y Actitud (1 a 10 — 20%)</option>
            <option value="bonus">⭐ Bonus / Sanción del Profe (+/- sobre el Score)</option>
        `;
    }
    const selModo = document.getElementById("selectModoRanking");
    if (selModo) {
        selModo.innerHTML = `
            <option value="fijar" selected>📌 Fijar Nota Exacta (Escala 1 a 10)</option>
            <option value="sumar">➕/➖ Sumar o Restar Puntos (Ej: +0.5 o -0.5)</option>
        `;
    }
    const inpDelta = document.getElementById("inputPuntosDelta");
    if (inpDelta) {
        inpDelta.step = "0.1";
        inpDelta.placeholder = "Ej: 8.5 (Fijar) o 0.5 (Sumar)";
    }

    // A) 5° PESTAÑA EN FÚTBOL Y HOCKEY: PLAN SEMANAL Y LISTA DE BUENA FE
    if (deportePagina && deportePagina !== "Gimnasio" && !document.getElementById("dep-sec-microciclo")) {
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
                        <h3><i class="ri-calendar-check-line"></i> Microciclo Semanal de Campo — ${deportePagina} <span class="lbl-cat-activa">${categoriaActiva}</span></h3>
                        <small style="color:var(--ink-500)">Planificá los entrenamientos de Lunes a Sábado para la categoría activa y compartí el cronograma por WhatsApp.</small>
                    </div>
                    <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="cargarMicrocicloModelo()">⚡ Restaurar Semana Modelo</button>
                        <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarMicrocicloWhatsApp()"><i class="ri-whatsapp-line"></i> Enviar Cronograma Semanal</button>
                    </div>
                </div>
                <div id="contenedorGrillaMicrociclo" class="micro-grid"></div>
            </div>

            <div class="app-panel">
                <div class="panel-head">
                    <div>
                        <h3><i class="ri-file-shield-2-line"></i> Lista de Buena Fe y Estado de Habilitación (<span class="lbl-cat-activa">${categoriaActiva}</span>)</h3>
                        <small style="color:var(--ink-500)">Nómina oficial con DNI, grupo sanguíneo, disponibilidad médica, Score (1-10) y estado de cuota.</small>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="window.print()"><i class="ri-printer-line"></i> Imprimir Lista Oficial</button>
                </div>
                <div id="contenedorListaBuenaFeDeporte"></div>
            </div>
        `;
        main.appendChild(secMicro);
    }

    // B) AJUSTE EXCLUSIVO PARA GIMNASIO (SEPARADO DE DEPORTES + VIDEOTECA)
    if (deportePagina === "Gimnasio") {
        if (!document.getElementById("modalVideoEjercicio")) {
            const modalVid = document.createElement("div");
            modalVid.id = "modalVideoEjercicio";
            modalVid.className = "modal-backdrop hidden";
            document.body.appendChild(modalVid);
        }
    }

    // C) 4° PESTAÑA EN EXPEDIENTE INDIVIDUAL (JUGADOR.HTML): CALCULADORA % 1RM Y COMPARADOR
    if (document.body.dataset.page === "perfil-individual" && !document.getElementById("jug-sec-calculadora")) {
        tabsBar.classList.remove("tabs-3");
        tabsBar.classList.add("tabs-4");
        const btnCalc = document.createElement("button");
        btnCalc.className = "mod-tab";
        btnCalc.innerHTML = `<i class="ri-calculator-line"></i><span>Tabla % 1RM & Comparador</span>`;
        btnCalc.onclick = function () { cambiarTabFichaJugador("calculadora", this); };
        tabsBar.appendChild(btnCalc);

        const secCalc = document.createElement("section");
        secCalc.id = "jug-sec-calculadora";
        secCalc.className = "jug-seccion hidden";
        secCalc.innerHTML = `
            <div class="split-equal">
                <div class="app-panel">
                    <div class="panel-head">
                        <div>
                            <h3><i class="ri-scales-fill"></i> Calculadora de Cargas de Trabajo (% de 1RM)</h3>
                            <small style="color:var(--ink-500)">Kilos exactos a cargar en la barra según su récord personal (1RM).</small>
                        </div>
                    </div>
                    <div id="contenedorCalculadora1RMJugador"></div>
                </div>

                <div class="app-panel">
                    <div class="panel-head">
                        <div>
                            <h3><i class="ri-sword-line"></i> Comparador Cara a Cara (Head-to-Head)</h3>
                            <small style="color:var(--ink-500)">Compará métricas físicas, pilares (1 a 10) y asistencia contra otro compañero de su misma área.</small>
                        </div>
                    </div>
                    <div id="contenedorComparadorJugador"></div>
                </div>
            </div>
        `;
        main.appendChild(secCalc);
    }
}

// =========================================================================
// 3. NAVEGACIÓN Y RENDERIZADO DE DEPORTES (FÚTBOL, HOCKEY Y GIMNASIO)
// =========================================================================

function seleccionarCategoriaDeporte(nuevaCat) {
    categoriaActiva = nuevaCat;
    document.querySelectorAll("#barraCategorias .seg-btn").forEach(btn => {
        btn.classList.toggle("active", btn.innerText.trim() === nuevaCat);
    });
    document.querySelectorAll(".lbl-cat-activa").forEach(el => {
        el.innerText = nuevaCat;
    });
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
    const seccionActiva = document.getElementById(`dep-sec-${nombreSec}`);
    if (seccionActiva) {
        seccionActiva.classList.remove("hidden");
        seccionActiva.classList.add("animate-in");
    }

    document.querySelectorAll(".module-tabs .mod-tab").forEach(b => b.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");
    renderizarPaginaDeporte();
}

function cambiarTabFichaJugador(nombreSec, btnEl) {
    document.querySelectorAll(".jug-seccion").forEach(s => {
        s.classList.add("hidden");
        s.classList.remove("animate-in");
    });
    const sec = document.getElementById(`jug-sec-${nombreSec}`);
    if (sec) {
        sec.classList.remove("hidden");
        sec.classList.add("animate-in");
    }

    document.querySelectorAll(".module-tabs .mod-tab").forEach(b => b.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");
}

function obtenerPersonasFiltradasDeporte(soloActivos = false) {
    return basePersonas.filter(p => {
        if (p.deporte !== deportePagina) return false;
        if (deportePagina !== "Gimnasio" && p.categoria !== categoriaActiva) return false;
        if (soloActivos && !p.activo) return false;
        return true;
    });
}

function renderizarPaginaDeporte() {
    basePersonas.forEach(p => asegurarPilaresPersona(p));
    asegurarVideotecaCargada();

    if (paramDeporteURL && deportePagina) {
        const h2Top = document.querySelector(".topbar-title h2");
        if (h2Top) {
            h2Top.innerHTML = `🏆 ${deportePagina} Oficial <span class="cat-active-pill lbl-cat-activa">${categoriaActiva}</span>`;
        }
        const h3Pitch = document.querySelector("#dep-sec-partido .panel-head h3");
        if (h3Pitch) {
            h3Pitch.innerHTML = `<i class="ri-trophy-line"></i> Pizarra de Partido en Vivo — ${deportePagina} <span class="lbl-cat-activa">${categoriaActiva}</span>`;
        }
        document.title = `${deportePagina} | Plataforma Oficial`;
    }

    // 1. Actualizar KPIs superiores en vivo de Fútbol y Hockey (Escala 1 a 10)
    const activosCat = obtenerPersonasFiltradasDeporte(true);
    const hoyISO = obtenerHoyISO();
    const presentesCatHoy = activosCat.filter(p => Array.isArray(p.asistencias) && p.asistencias.includes(hoyISO)).length;
    const promScoreCat = activosCat.length
        ? (activosCat.reduce((acc, p) => acc + (p.puntosCategoria || 7), 0) / activosCat.length).toFixed(1)
        : "0.0";
    const lesionadosCat = activosCat.filter(p => p.estadoMedico && p.estadoMedico !== "Óptimo").length;
    const aptosCat = activosCat.length - lesionadosCat;

    if (document.getElementById("depKpiTotal")) {
        document.getElementById("depKpiTotal").innerText = `${activosCat.length}`;
        document.getElementById("depKpiPresentes").innerText = `${presentesCatHoy} / ${activosCat.length}`;
        document.getElementById("depKpiScore").innerText = `${promScoreCat} / 10`;
        document.getElementById("depKpiSalud").innerText = `${aptosCat} Apt. / ${lesionadosCat} Les.`;
    }

    // 2. Renderizar tarjetas del plantel o padrón de socios del gimnasio con diseño Holográfico 2030
    const grid = document.getElementById("gridJugadoresDeporte");
    if (!grid) return;

    const texto = (document.getElementById("inputBuscar")?.value || "").toLowerCase();
    const estado = document.getElementById("filtroEstado")?.value || "activos";
    const tipoGym = document.getElementById("filtroTipoGym")?.value || "todos_gym";
    const fechaActiva = document.getElementById("fechaAsistenciaGym")?.value || hoyISO;

    let lista = obtenerPersonasFiltradasDeporte(false);

    if (deportePagina === "Gimnasio") {
        if (tipoGym === "hipertrofia" || tipoGym === "musculacion") {
            lista = lista.filter(p => (p.puesto || "").toLowerCase().includes("hipertrofia") || (p.puesto || "").toLowerCase().includes("muscul"));
        } else if (tipoGym === "fuerza") {
            lista = lista.filter(p => (p.puesto || "").toLowerCase().includes("fuerza") || (p.puesto || "").toLowerCase().includes("potencia") || (p.puesto || "").toLowerCase().includes("power"));
        } else if (tipoGym === "funcional") {
            lista = lista.filter(p => (p.puesto || "").toLowerCase().includes("funcional") || (p.puesto || "").toLowerCase().includes("cardio") || (p.puesto || "").toLowerCase().includes("core"));
        } else if (tipoGym === "rehab" || tipoGym === "salud") {
            lista = lista.filter(p => (p.puesto || "").toLowerCase().includes("rehab") || (p.puesto || "").toLowerCase().includes("salud") || (p.puesto || "").toLowerCase().includes("readapt") || (p.estadoMedico && p.estadoMedico !== "Óptimo"));
        }
    }

    if (estado === "activos") lista = lista.filter(p => p.activo);
    else if (estado === "alerta_frecuencia") lista = lista.filter(p => p.activo && contarAsistenciasUltimos7Dias(p) < (p.frecuenciaSemanal || 3));
    else if (estado === "pagos_pendientes") lista = lista.filter(p => p.activo && p.pagoEstado !== "Al Día");
    else if (estado === "lesionados") lista = lista.filter(p => p.activo && p.estadoMedico && p.estadoMedico !== "Óptimo");

    if (texto) {
        lista = lista.filter(p =>
            p.nombre.toLowerCase().includes(texto) ||
            p.apellido.toLowerCase().includes(texto) ||
            p.dni.toLowerCase().includes(texto) ||
            p.puesto.toLowerCase().includes(texto)
        );
    }

    if (lista.length === 0) {
        grid.innerHTML = `
            <div class="empty-box" style="grid-column: 1 / -1;">
                <p style="margin-bottom:0.75rem;">No hay personas cargadas para este filtro.</p>
                <button class="btn btn-primary btn-sm" onclick="abrirModalPersona()">+ Dar de Alta ${deportePagina === "Gimnasio" ? "Socio" : "Jugador"}</button>
            </div>
        `;
    } else {
        grid.innerHTML = lista.map(p => {
            const iniciales = `${p.nombre.charAt(0)}${p.apellido.charAt(0)}`.toUpperCase();
            const presenteHoy = p.asistencias.includes(fechaActiva);
            const asistSemana = contarAsistenciasUltimos7Dias(p);
            const pactado = p.frecuenciaSemanal || 3;
            const faltaFrecuencia = asistSemana < pactado;
            const pctBarra = Math.min(100, Math.round((asistSemana / pactado) * 100));

            const badgeMedico = p.estadoMedico && p.estadoMedico !== "Óptimo"
                ? `<span class="badge badge-danger" title="${p.estadoMedico}">🏥 ${p.estadoMedico}</span>`
                : `<span class="badge badge-ok">🟢 Apto</span>`;

            const alDia = (p.pagoEstado || "Al Día") === "Al Día";
            const pagoBadge = alDia
                ? `<span class="badge badge-ok">💳 Al Día</span>`
                : `<span class="badge badge-danger">⚠️ Debe Cuota</span>`;

            const claseBorde = p.estadoMedico && p.estadoMedico !== "Óptimo"
                ? "status-danger"
                : (faltaFrecuencia ? "status-warn" : "");

            let bloqueCentralHTML = "";
            if (deportePagina === "Gimnasio") {
                const cantRutinasSocio = baseRutinas.filter(r => r.personaId === p.id).length;
                const ultimaAsist = p.asistencias.length ? p.asistencias[p.asistencias.length - 1].slice(5) : "Sin reg.";
                bloqueCentralHTML = `
                    <div class="pillars-mini-grid gym-3col">
                        <div class="pillar-mini-item"><small>Frecuencia</small><strong>${asistSemana}/${pactado} d</strong></div>
                        <div class="pillar-mini-item"><small>Rutinas</small><strong>${cantRutinasSocio}</strong></div>
                        <div class="pillar-mini-item"><small>Últ. vez</small><strong>${ultimaAsist}</strong></div>
                    </div>
                `;
            } else {
                bloqueCentralHTML = `
                    <div class="pillars-mini-grid">
                        <div class="pillar-mini-item">
                            <small>Físico</small>
                            <strong>${p.pilares.fisico}</strong>
                            <div class="pillar-micro-bar"><div class="pillar-micro-fill" style="width:${p.pilares.fisico * 10}%"></div></div>
                        </div>
                        <div class="pillar-mini-item">
                            <small>Gym</small>
                            <strong>${p.pilares.gym}</strong>
                            <div class="pillar-micro-bar"><div class="pillar-micro-fill" style="width:${p.pilares.gym * 10}%"></div></div>
                        </div>
                        <div class="pillar-mini-item">
                            <small>Técnico</small>
                            <strong>${p.pilares.tecnico}</strong>
                            <div class="pillar-micro-bar"><div class="pillar-micro-fill" style="width:${p.pilares.tecnico * 10}%"></div></div>
                        </div>
                        <div class="pillar-mini-item">
                            <small>Actitud</small>
                            <strong>${p.pilares.actitud}</strong>
                            <div class="pillar-micro-bar"><div class="pillar-micro-fill" style="width:${p.pilares.actitud * 10}%"></div></div>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="athlete-card ${claseBorde}" onclick="irAPaginaIndividual(${p.id})">
                    <!-- 1. CABECERA LIMPIA: AVATAR + NOMBRE/PUESTO + SCORE/CHECK -->
                    <div class="ath-card-header">
                        <div class="ath-identity-block">
                            ${renderAvatarPersonaCDM(p, 48, "1rem", true)}
                            <div class="ath-title-wrap">
                                <h4>${p.apellido}, ${p.nombre}</h4>
                                <span class="ath-role-sub">${p.puesto}</span>
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:0.35rem; flex-shrink:0;">
                            ${deportePagina !== "Gimnasio" ? `
                                <div class="ovr-score-badge" title="Score Oficial (1 a 10)">
                                    ⭐ <strong>${p.puntosCategoria}</strong>
                                </div>
                            ` : ""}
                            <button type="button"
                                class="check-btn ${presenteHoy ? "checked" : ""}"
                                title="${presenteHoy ? "Presente hoy (Tocá para quitar)" : "Marcar presente hoy"}"
                                onclick="event.stopPropagation(); toggleAsistenciaPersona(${p.id}, '${fechaActiva}')">
                                ✓
                            </button>
                        </div>
                    </div>

                    <!-- 2. PÍLDORAS DE ESTADO E IDENTIDAD -->
                    <div class="ath-meta-pills" onclick="event.stopPropagation();">
                        ${pagoBadge}
                        ${badgeMedico}
                        <span class="ath-meta-tag">DNI ${p.dni}</span>
                        <span class="ath-meta-tag admin-only-code-chip" style="color:var(--purple-ink); background:var(--purple-bg); border-color:rgba(99,102,241,0.22); cursor:pointer;" title="Copiar código personal" onclick="navigator.clipboard.writeText('${p.codigoAcceso}'); mostrarToast('📋 Código copiado: ${p.codigoAcceso}');">🔑 ${p.codigoAcceso}</span>
                    </div>

                    <!-- 3. MÉTRICAS CLAVE -->
                    ${bloqueCentralHTML}

                    <!-- 4. BARRA DE ASISTENCIA SEMANAL -->
                    <div class="ath-freq-bar">
                        <div class="ath-freq-head">
                            <span style="color:${faltaFrecuencia ? "var(--warn-ink)" : "var(--ok-ink)"};">
                                Asistencia 7 días: ${asistSemana} de ${pactado}
                            </span>
                            <span style="color:var(--ink-400); font-weight:500;">${p.peso}kg • ${p.altura}cm</span>
                        </div>
                        <div class="ath-freq-track">
                            <div class="ath-freq-fill" style="width:${pctBarra}%; background:${faltaFrecuencia ? "var(--warn)" : "var(--ok)"};"></div>
                        </div>
                    </div>

                    <!-- 5. PIE DE ACCIONES RÁPIDAS RESPONSIVE -->
                    <div class="ath-bottom" onclick="event.stopPropagation();">
                        <span style="font-size:0.74rem; font-weight:600; color:var(--cdm-500); cursor:pointer;" onclick="irAPaginaIndividual(${p.id})">
                            Ficha 360° <i class="ri-arrow-right-s-line"></i>
                        </span>
                        <div class="ath-actions-group">
                            ${deportePagina === "Gimnasio"
                                ? `<button class="btn btn-ghost btn-sm" title="Recibo o Aviso de Cuota por WhatsApp" onclick="enviarReciboPagoWhatsApp(${p.id})">🧾</button>`
                                : `<button class="btn btn-ghost btn-sm" title="Calificar Score (1 a 10)" onclick="calificarJugadorRapidoPrompt(${p.id})">⭐</button>`}
                            <button class="btn btn-ghost btn-sm admin-only-code-chip" title="Enviar Código (${p.codigoAcceso}) por WhatsApp" onclick="if(typeof enviarCodigoPorWhatsAppCDM==='function'){enviarCodigoPorWhatsAppCDM(${p.id});}">🔑</button>
                            <button class="btn btn-ghost btn-sm" title="Asignar Rutina WhatsApp" onclick="irAArmarRutinaParaPersona(${p.id})"><i class="ri-whatsapp-line"></i></button>
                            <button class="btn btn-ghost btn-sm" title="Editar Ficha" onclick="abrirModalPersona(${p.id})"><i class="ri-edit-line"></i></button>
                            <button class="btn btn-danger btn-sm" title="Eliminar" onclick="eliminarPersonaDefinitivo(${p.id})"><i class="ri-delete-bin-line"></i></button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    }

    renderizarRankingDeporte();
    poblarSelectsAdminRutinasGym();
    renderizarListaRutinasAdminGym();
    renderizarCanchaInteractiva();
    renderizarHistorialPartidos();
    renderizarMicrocicloDeporte();

    if (deportePagina === "Gimnasio") {
        actualizarDashboardGym();
        renderizarVideotecaGym();
        renderizarMuroRecordsYRetencionGym();
    }
}

function irAPaginaIndividual(idPersona) {
    window.location.href = `jugador.html?id=${idPersona}`;
}

// =========================================================================
// 4. VIDEOTECA INTERACTIVA DE EJERCICIOS DEL GIMNASIO (VIDEO + BIOMECÁNICA)
// =========================================================================

function obtenerEmbedUrlVideo(url) {
    if (!url) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}?rel=0`;
    }
    return url;
}

function renderizarVideotecaGym() {
    const cont = document.getElementById("contenedorGridVideotecaGym") || document.getElementById("contenedorTarjetasVideotecaGym");
    if (!cont) return;
    cont.classList.add("videoteca-grid");
    asegurarVideotecaCargada();

    const q = (document.getElementById("inputBuscarVideoteca")?.value || "").toLowerCase().trim();
    const grupo = (document.getElementById("filtroMusculoVideoteca") || document.getElementById("filtroGrupoVideoteca"))?.value || "TODOS";

    let lista = [...baseVideoteca];
    if (grupo !== "TODOS") {
        lista = lista.filter(ex =>
            ex.grupo === grupo ||
            ex.grupoSecundario === grupo ||
            (grupo === "Tren Inferior" && ex.grupo.includes("Piernas")) ||
            (grupo === "Empuje / Torso" && ex.grupo.includes("Pecho")) ||
            (grupo === "Tracción / Espalda" && ex.grupo.includes("Espalda")) ||
            (grupo === "Movilidad y Rehab" && ex.grupo.includes("Rehab"))
        );
    }
    if (q) {
        lista = lista.filter(ex =>
            ex.nombre.toLowerCase().includes(q) ||
            ex.grupo.toLowerCase().includes(q) ||
            (ex.grupoSecundario || "").toLowerCase().includes(q) ||
            ex.equipo.toLowerCase().includes(q) ||
            ex.clavesTecnicas.toLowerCase().includes(q)
        );
    }

    if (lista.length === 0) {
        cont.innerHTML = `<div class="empty-box" style="grid-column:1/-1;">No se encontraron ejercicios con ese filtro. Podés agregar uno nuevo con el botón superior.</div>`;
        return;
    }

    cont.innerHTML = lista.map(ex => `
        <div class="video-exercise-card">
            <div class="video-thumb-box" onclick="abrirModalReproductorEjercicio(${ex.id})">
                <img src="${ex.imagenPreview || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=700&q=80'}" alt="${ex.nombre}">
                <div class="video-play-overlay">
                    <div class="play-circle-btn"><i class="ri-play-fill"></i></div>
                </div>
                <span class="badge badge-celeste" style="position:absolute; top:0.75rem; left:0.75rem; z-index:2;">${ex.grupo}</span>
                <span class="badge badge-ok" style="position:absolute; bottom:0.75rem; right:0.75rem; z-index:2;">${ex.seriesSugeridas} × ${ex.repsSugeridas}</span>
            </div>

            <div class="video-card-body">
                <div>
                    <h4 style="font-size:1.02rem; font-weight:800; color:var(--ink-900);">${ex.nombre}</h4>
                    <small style="color:var(--ink-500); font-weight:700;">🏋️ ${ex.equipo} • ${ex.nivel}</small>
                </div>

                <div class="video-cues-box">
                    <strong>💡 Clave Técnica:</strong> ${ex.clavesTecnicas}
                </div>

                <div style="display:flex; gap:0.35rem; margin-top:auto; padding-top:0.5rem; flex-wrap:wrap;">
                    <button type="button" class="btn btn-primary btn-sm" style="flex:1;" onclick="abrirModalReproductorEjercicio(${ex.id})">
                        ▶ Ver Video
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="insertarEjercicioDeVideotecaEnRutina(${ex.id})" title="Insertar directo en el armador de rutinas">
                        ➕ A Rutina
                    </button>
                    <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarVideoEjercicioPorWhatsApp(${ex.id})" title="Enviar tutorial en video por WhatsApp">
                        <i class="ri-whatsapp-line"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join("");
}

function abrirModalReproductorEjercicio(idEx) {
    const ex = baseVideoteca.find(x => x.id === idEx);
    if (!ex) return;
    const modal = document.getElementById("modalVideoEjercicio");
    if (!modal) return;

    const embedUrl = obtenerEmbedUrlVideo(ex.videoUrl);
    const esMp4 = embedUrl.endsWith(".mp4") || embedUrl.endsWith(".webm");

    const playerHTML = esMp4
        ? `<video src="${embedUrl}" controls autoplay></video>`
        : `<iframe src="${embedUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;

    modal.innerHTML = `
        <div class="modal-window" style="max-width:660px;">
            <div class="modal-top">
                <div>
                    <span class="badge badge-celeste">${ex.grupo} • ${ex.nivel}</span>
                    <h3 style="color:var(--ink-900); margin-top:4px;">🎥 ${ex.nombre}</h3>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalVideoEjercicio()">✕</button>
            </div>

            <div class="video-iframe-container">
                ${playerHTML}
            </div>

            <div class="grid-3" style="margin-bottom:0.85rem; text-align:center;">
                <div style="background:var(--surface-subtle); padding:0.6rem; border-radius:10px; border:1px solid var(--line);">
                    <small style="color:var(--ink-500); font-weight:800; display:block; font-size:0.65rem;">DOSIFICACIÓN SUGERIDA</small>
                    <strong style="color:var(--ink-900);">${ex.seriesSugeridas} series × ${ex.repsSugeridas}</strong>
                </div>
                <div style="background:var(--surface-subtle); padding:0.6rem; border-radius:10px; border:1px solid var(--line);">
                    <small style="color:var(--ink-500); font-weight:800; display:block; font-size:0.65rem;">PAUSA RECOMENDADA</small>
                    <strong style="color:var(--ink-900);">⏱️ ${ex.pausaSugerida}</strong>
                </div>
                <div style="background:var(--surface-subtle); padding:0.6rem; border-radius:10px; border:1px solid var(--line);">
                    <small style="color:var(--ink-500); font-weight:800; display:block; font-size:0.65rem;">EQUIPAMIENTO</small>
                    <strong style="color:var(--ink-900);">${ex.equipo}</strong>
                </div>
            </div>

            <div style="background:var(--cdm-50); border:1px solid var(--line-celeste); padding:0.85rem; border-radius:12px; margin-bottom:0.65rem; font-size:0.83rem;">
                <strong style="color:var(--cdm-900); display:block; margin-bottom:3px;">✅ Biomecánica y Claves de Ejecución:</strong>
                <p style="color:var(--ink-700);">${ex.clavesTecnicas}</p>
            </div>

            <div style="background:var(--err-bg); border:1px solid #fecaca; padding:0.85rem; border-radius:12px; margin-bottom:1.1rem; font-size:0.83rem;">
                <strong style="color:var(--err); display:block; margin-bottom:3px;">⚠️ Errores Comunes a Evitar:</strong>
                <p style="color:#991b1b;">${ex.erroresComunes || "Evitar compensaciones lumbares o pérdida de control excéntrico."}</p>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                <a href="${ex.videoUrl}" target="_blank" class="btn btn-ghost btn-sm"><i class="ri-external-link-line"></i> Abrir Video Original</a>
                <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="insertarEjercicioDeVideotecaEnRutina(${ex.id}); cerrarModalVideoEjercicio();">
                        ➕ Sumar al Constructor de Rutinas
                    </button>
                    <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarVideoEjercicioPorWhatsApp(${ex.id})">
                        <i class="ri-whatsapp-line"></i> Enviar Tutorial por WhatsApp
                    </button>
                </div>
            </div>
        </div>
    `;
    modal.classList.remove("hidden");
}

function cerrarModalVideoEjercicio() {
    const modal = document.getElementById("modalVideoEjercicio");
    if (!modal) return;
    modal.innerHTML = "";
    modal.classList.add("hidden");
}

function insertarEjercicioDeVideotecaEnRutina(idEx) {
    const ex = baseVideoteca.find(x => x.id === idEx);
    if (!ex) return;

    agregarFilaRutinaAdminGym({
        nombre: ex.nombre,
        series: ex.seriesSugeridas || 4,
        reps: ex.repsSugeridas || "8-10",
        peso: ex.equipo,
        pausa: ex.pausaSugerida || "90s",
        forma: `${ex.clavesTecnicas} (Video: ${ex.videoUrl})`
    });

    const btnTabRutinas = Array.from(document.querySelectorAll(".module-tabs .mod-tab")).find(b => b.innerText.toLowerCase().includes("rutina"));
    if (btnTabRutinas) cambiarTabGym("rutinas", btnTabRutinas);
    mostrarToast(`➕ "${ex.nombre}" agregado al constructor de rutinas con su guía técnica.`);
}

function enviarVideoEjercicioPorWhatsApp(idEx) {
    const ex = baseVideoteca.find(x => x.id === idEx);
    if (!ex) return;

    let msg = `💙🤍 *GUÍA TÉCNICA Y VIDEO — GIMNASIO CDM ADELIA MARÍA*\n`;
    msg += `----------------------------------\n`;
    msg += `🏋️ *Ejercicio:* ${ex.nombre.toUpperCase()}\n`;
    msg += `🎯 *Grupo Muscular:* ${ex.grupo} (${ex.equipo})\n`;
    msg += `📊 *Dosificación sugerida:* ${ex.seriesSugeridas} series × ${ex.repsSugeridas} (Pausa: ${ex.pausaSugerida})\n\n`;
    msg += `✅ *Técnica Correcta:*\n${ex.clavesTecnicas}\n\n`;
    msg += `⚠️ *Evitar:*\n${ex.erroresComunes}\n\n`;
    msg += `🎥 *Ver Video Demostrativo:*\n${ex.videoUrl}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
}

function abrirModalNuevoEjercicioVideo() {
    const modal = document.getElementById("modalVideoEjercicio");
    if (!modal) return;

    modal.innerHTML = `
        <div class="modal-window" style="max-width:580px;">
            <div class="modal-top">
                <h3 style="color:var(--ink-900);"><i class="ri-video-add-line"></i> Agregar Ejercicio a la Videoteca del Gym</h3>
                <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalVideoEjercicio()">✕</button>
            </div>
            <form onsubmit="guardarNuevoEjercicioVideoteca(event)">
                <div class="grid-2" style="margin-bottom:0.75rem;">
                    <div class="field">
                        <label>Nombre del Ejercicio *</label>
                        <input type="text" id="vidNombre" required placeholder="Ej: Prensa 45° / Remo en Polea">
                    </div>
                    <div class="field">
                        <label>Grupo Muscular *</label>
                        <select id="vidGrupo" required>
                            <option value="Tren Inferior">🦵 Tren Inferior (Piernas y Glúteos)</option>
                            <option value="Empuje / Torso">💪 Empuje (Pectoral, Hombros y Tríceps)</option>
                            <option value="Tracción / Espalda">🏋️ Tracción (Espalda, Dorsales y Bíceps)</option>
                            <option value="Core y Funcional">🔥 Zona Media (Core y Funcional)</option>
                            <option value="Potencia y Pliometría">⚡ Potencia y Pliometría</option>
                            <option value="Movilidad y Rehab">🏥 Movilidad y Rehabilitación</option>
                        </select>
                    </div>
                </div>

                <div class="grid-3" style="margin-bottom:0.75rem;">
                    <div class="field"><label>Equipamiento *</label><input type="text" id="vidEquipo" required value="Mancuernas / Máquina"></div>
                    <div class="field"><label>Series Sug.</label><input type="number" id="vidSeries" value="4"></div>
                    <div class="field"><label>Reps Sug.</label><input type="text" id="vidReps" value="8-10"></div>
                </div>

                <div class="field" style="margin-bottom:0.75rem;">
                    <label>Link del Video (YouTube, YouTube Shorts o MP4) *</label>
                    <input type="url" id="vidUrl" required placeholder="https://www.youtube.com/watch?v=...">
                </div>

                <div class="field" style="margin-bottom:0.75rem;">
                    <label>Claves de Ejecución Técnica *</label>
                    <input type="text" id="vidClaves" required placeholder="Ej: Mantener espalda apoyada y controlar 3 seg la bajada...">
                </div>

                <div class="field" style="margin-bottom:1rem;">
                    <label>Errores Comunes a Evitar</label>
                    <input type="text" id="vidErrores" placeholder="Ej: Evitar despegar la cadera del asiento...">
                </div>

                <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                    <button type="button" class="btn btn-ghost" onclick="cerrarModalVideoEjercicio()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar en Videoteca</button>
                </div>
            </form>
        </div>
    `;
    modal.classList.remove("hidden");
}
// Alias compatible con gym.html
const abrirModalNuevoVideoEjercicio = abrirModalNuevoEjercicioVideo;

function guardarNuevoEjercicioVideoteca(e) {
    e.preventDefault();
    asegurarVideotecaCargada();

    baseVideoteca.unshift({
        id: Date.now(),
        nombre: document.getElementById("vidNombre").value.trim(),
        grupo: document.getElementById("vidGrupo").value,
        grupoSecundario: document.getElementById("vidGrupo").value,
        nivel: "Todos los niveles",
        equipo: document.getElementById("vidEquipo").value.trim(),
        seriesSugeridas: parseInt(document.getElementById("vidSeries").value) || 4,
        repsSugeridas: document.getElementById("vidReps").value.trim() || "8-10",
        pausaSugerida: "90s",
        videoUrl: document.getElementById("vidUrl").value.trim(),
        imagenPreview: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=700&q=80",
        clavesTecnicas: document.getElementById("vidClaves").value.trim(),
        erroresComunes: document.getElementById("vidErrores").value.trim() || "Cuidar postura y control del peso."
    });

    guardarDatosCDM();
    cerrarModalVideoEjercicio();
    renderizarVideotecaGym();
    mostrarToast("🎥 Nuevo ejercicio con video sumado a la Videoteca.");
}

// =========================================================================
// 5. PIZARRA TÁCTICA EN VIVO + TABLERO ELECTRÓNICO + BANCO DE SUPLENTES
// =========================================================================

const FORMACIONES_FUTBOL = {
    "4-3-3": [
        { num: 1, sigla: "ARQ", nombrePuesto: "Arquero", x: 50, y: 89 },
        { num: 4, sigla: "LD", nombrePuesto: "Lateral Derecho", x: 83, y: 70 },
        { num: 2, sigla: "DFC", nombrePuesto: "Primer Marcador Central", x: 62, y: 73 },
        { num: 6, sigla: "DFC", nombrePuesto: "Segundo Marcador Central", x: 38, y: 73 },
        { num: 3, sigla: "LI", nombrePuesto: "Lateral Izquierdo", x: 17, y: 70 },
        { num: 8, sigla: "MID", nombrePuesto: "Interior Derecho", x: 72, y: 47 },
        { num: 5, sigla: "MCD", nombrePuesto: "Volante Central (Tapón)", x: 50, y: 54 },
        { num: 10, sigla: "MII", nombrePuesto: "Interior Izquierdo / Enganche", x: 28, y: 47 },
        { num: 7, sigla: "ED", nombrePuesto: "Extremo Derecho", x: 80, y: 21 },
        { num: 9, sigla: "DC", nombrePuesto: "Centrodelantero de Área", x: 50, y: 16 },
        { num: 11, sigla: "EI", nombrePuesto: "Extremo Izquierdo", x: 20, y: 21 }
    ],
    "4-4-2": [
        { num: 1, sigla: "ARQ", nombrePuesto: "Arquero", x: 50, y: 89 },
        { num: 4, sigla: "LD", nombrePuesto: "Lateral Derecho", x: 83, y: 70 },
        { num: 2, sigla: "DFC", nombrePuesto: "Marcador Central Der.", x: 62, y: 73 },
        { num: 6, sigla: "DFC", nombrePuesto: "Marcador Central Izq.", x: 38, y: 73 },
        { num: 3, sigla: "LI", nombrePuesto: "Lateral Izquierdo", x: 17, y: 70 },
        { num: 8, sigla: "MD", nombrePuesto: "Volante por Derecha", x: 82, y: 45 },
        { num: 5, sigla: "MCD", nombrePuesto: "Volante Central Contención", x: 60, y: 49 },
        { num: 10, sigla: "MC", nombrePuesto: "Volante Creativo", x: 40, y: 49 },
        { num: 11, sigla: "MI", nombrePuesto: "Volante por Izquierda", x: 18, y: 45 },
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
        { num: 1, sigla: "ARQ", nombrePuesto: "Arquera/o de Hockey", x: 50, y: 90 },
        { num: 4, sigla: "STD", nombrePuesto: "Stopper Derecha/o", x: 74, y: 72 },
        { num: 2, sigla: "LIB", nombrePuesto: "Líbero / Cierre", x: 50, y: 76 },
        { num: 6, sigla: "STI", nombrePuesto: "Stopper Izquierda/o", x: 26, y: 72 },
        { num: 7, sigla: "HD", nombrePuesto: "Half Derecho", x: 83, y: 47 },
        { num: 5, sigla: "CIN", nombrePuesto: "Cinco (Volante Central)", x: 62, y: 50 },
        { num: 10, sigla: "INT", nombrePuesto: "Interior / Distribución", x: 38, y: 46 },
        { num: 3, sigla: "HI", nombrePuesto: "Half Izquierdo", x: 17, y: 47 },
        { num: 8, sigla: "WD", nombrePuesto: "Wing Derecho", x: 78, y: 20 },
        { num: 9, sigla: "CF", nombrePuesto: "Centroforward / Punto Penal", x: 50, y: 16 },
        { num: 11, sigla: "WI", nombrePuesto: "Wing Izquierdo", x: 22, y: 20 }
    ],
    "4-3-3": [
        { num: 1, sigla: "ARQ", nombrePuesto: "Arquera/o de Hockey", x: 50, y: 90 },
        { num: 4, sigla: "LD", nombrePuesto: "Defensora Derecha (Half)", x: 83, y: 71 },
        { num: 2, sigla: "CD", nombrePuesto: "Central Derecha", x: 62, y: 74 },
        { num: 6, sigla: "CI", nombrePuesto: "Central Izquierda", x: 38, y: 74 },
        { num: 3, sigla: "LI", nombrePuesto: "Defensora Izquierda (Half)", x: 17, y: 71 },
        { num: 8, sigla: "ID", nombrePuesto: "Interior Derecha", x: 72, y: 47 },
        { num: 5, sigla: "CIN", nombrePuesto: "Cinco Central", x: 50, y: 53 },
        { num: 10, sigla: "II", nombrePuesto: "Interior Izquierda", x: 28, y: 47 },
        { num: 7, sigla: "WD", nombrePuesto: "Wing Derecha", x: 80, y: 21 },
        { num: 9, sigla: "CF", nombrePuesto: "Centrodelantera", x: 50, y: 16 },
        { num: 11, sigla: "WI", nombrePuesto: "Wing Izquierda", x: 20, y: 21 }
    ],
    "3-3-3-1": [
        { num: 1, sigla: "ARQ", nombrePuesto: "Arquera/o de Hockey", x: 50, y: 90 },
        { num: 4, sigla: "STD", nombrePuesto: "Stopper Derecha", x: 74, y: 73 },
        { num: 2, sigla: "LIB", nombrePuesto: "Líbero / Cierre", x: 50, y: 77 },
        { num: 6, sigla: "STI", nombrePuesto: "Stopper Izquierda", x: 26, y: 73 },
        { num: 7, sigla: "HD", nombrePuesto: "Half Derecho", x: 78, y: 53 },
        { num: 5, sigla: "CIN", nombrePuesto: "Cinco", x: 50, y: 56 },
        { num: 3, sigla: "HI", nombrePuesto: "Half Izquierdo", x: 22, y: 53 },
        { num: 8, sigla: "ID", nombrePuesto: "Interior Ofensivo Der.", x: 76, y: 31 },
        { num: 10, sigla: "ENG", nombrePuesto: "Enganche de Área", x: 50, y: 33 },
        { num: 11, sigla: "II", nombrePuesto: "Interior Ofensivo Izq.", x: 24, y: 31 },
        { num: 9, sigla: "CF", nombrePuesto: "Punta de Área (Desvío)", x: 50, y: 15 }
    ]
};

function obtenerCatalogoFormacionActual() {
    const form = document.getElementById("matchFormacion")?.value || "4-3-3";
    if (deportePagina === "Hockey") {
        return FORMACIONES_HOCKEY[form] || FORMACIONES_HOCKEY["3-4-3"];
    }
    return FORMACIONES_FUTBOL[form] || FORMACIONES_FUTBOL["4-3-3"];
}

function obtenerClaveAlineacion() {
    const form = document.getElementById("matchFormacion")?.value || "4-3-3";
    return `${deportePagina}_${categoriaActiva}_${form}`;
}

function obtenerMapaAlineacionActual() {
    const clave = obtenerClaveAlineacion();
    if (!baseAlineaciones[clave]) baseAlineaciones[clave] = {};
    return baseAlineaciones[clave];
}

function autoArmarAlineacionCancha() {
    const activos = obtenerPersonasFiltradasDeporte(true);
    if (activos.length === 0) {
        alert(`No tenés jugadores dados de alta en ${deportePagina} (${categoriaActiva}).`);
        return;
    }
    const coords = obtenerCatalogoFormacionActual();
    const mapa = obtenerMapaAlineacionActual();
    const yaAsignadosIds = Object.values(mapa).map(Number);
    const disponibles = activos.filter(p => !yaAsignadosIds.includes(p.id));

    coords.forEach((pos, idx) => {
        if (!mapa[idx] && disponibles.length > 0) {
            mapa[idx] = disponibles.shift().id;
        }
    });

    guardarDatosCDM();
    renderizarCanchaInteractiva();
    mostrarToast("⚡ Puestos completados con el plantel activo.");
}

function vaciarAlineacionCancha() {
    baseAlineaciones[obtenerClaveAlineacion()] = {};
    guardarDatosCDM();
    renderizarCanchaInteractiva();
    mostrarToast("🧹 Cancha limpia. Tocá cualquier círculo para ubicar jugador.");
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

let modoVelocidadRelojPartido = localStorage.getItem("cdm_modo_reloj_partido") || "real"; // 'real' (60s) | 'rapido' (3s)

function inyectarBotonVelocidadRelojCancha() {
    const toolbar = document.querySelector(".match-clock-toolbar");
    if (!toolbar || document.getElementById("btnModoVelocidadReloj")) return;

    const btnModo = document.createElement("button");
    btnModo.type = "button";
    btnModo.id = "btnModoVelocidadReloj";
    btnModo.className = "btn btn-ghost btn-sm";
    btnModo.title = "Alternar entre Tiempo Real de cancha (60 seg por minuto) y Modo Prueba Rápida (3 seg por minuto)";
    btnModo.onclick = alternarVelocidadRelojPartido;
    toolbar.appendChild(btnModo);
    actualizarEtiquetaBotonVelocidadReloj();
}

function actualizarEtiquetaBotonVelocidadReloj() {
    const btn = document.getElementById("btnModoVelocidadReloj");
    if (!btn) return;
    btn.innerHTML = modoVelocidadRelojPartido === "real"
        ? `⏱️ Reloj: Real (60s)`
        : `⚡ Reloj: Rápido (3s)`;
}

function alternarVelocidadRelojPartido() {
    modoVelocidadRelojPartido = modoVelocidadRelojPartido === "real" ? "rapido" : "real";
    localStorage.setItem("cdm_modo_reloj_partido", modoVelocidadRelojPartido);
    actualizarEtiquetaBotonVelocidadReloj();
    if (timerIntervaloPartido) {
        toggleCronometroPartido();
        toggleCronometroPartido();
    }
    mostrarToast(modoVelocidadRelojPartido === "real"
        ? "⏱️ Reloj configurado en Tiempo Real (1 minuto = 60 segundos)."
        : "⚡ Reloj configurado en Modo Prueba Rápida (1 minuto = 3 segundos).");
}

function toggleCronometroPartido() {
    const btn = document.getElementById("btnToggleCronometro");
    if (!btn) return;
    if (timerIntervaloPartido) {
        clearInterval(timerIntervaloPartido);
        timerIntervaloPartido = null;
        btn.innerText = "▶ Iniciar";
    } else {
        if (minutoPartidoActual === 0 && (periodoPartidoActual === "1T" || periodoPartidoActual === "1C")) {
            minutoPartidoActual = 1;
        }
        actualizarTextoCronometro();
        btn.innerText = "⏸ Pausa";
        const intervaloMs = modoVelocidadRelojPartido === "real" ? 60000 : 3000;
        timerIntervaloPartido = setInterval(() => {
            minutoPartidoActual++;
            let autoFreno = false;
            if (deportePagina === "Futbol" && periodoPartidoActual === "1T" && minutoPartidoActual >= 45) autoFreno = true;
            if (deportePagina === "Futbol" && periodoPartidoActual === "2T" && minutoPartidoActual >= 90) autoFreno = true;
            if (deportePagina === "Hockey" && periodoPartidoActual === "1C" && minutoPartidoActual >= 15) autoFreno = true;
            if (deportePagina === "Hockey" && periodoPartidoActual === "2C" && minutoPartidoActual >= 30) autoFreno = true;
            if (deportePagina === "Hockey" && periodoPartidoActual === "3C" && minutoPartidoActual >= 45) autoFreno = true;
            if (deportePagina === "Hockey" && periodoPartidoActual === "4C" && minutoPartidoActual >= 60) autoFreno = true;

            actualizarTextoCronometro();
            if (autoFreno) {
                clearInterval(timerIntervaloPartido);
                timerIntervaloPartido = null;
                btn.innerText = "▶ Iniciar";
                mostrarToast("⏱️ Tiempo cumplido. Podés adicionar minutos o cambiar de período.");
            }
        }, intervaloMs);
    }
}

function ajustarMinutoManual(delta) {
    minutoPartidoActual = Math.max(0, minutoPartidoActual + delta);
    actualizarTextoCronometro();
}

function sumarMinutosDesdeSelect(el) {
    const v = parseInt(el.value);
    if (!isNaN(v) && v !== 0) {
        ajustarMinutoManual(v);
        mostrarToast(`⏱️ Reloj ajustado (${v > 0 ? "+" + v : v} min)`);
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
    mostrarToast("↺ Reloj reiniciado a 00'");
}

function actualizarTextoCronometro() {
    const el = document.getElementById("cronometroMinutoTexto");
    if (el) el.innerText = `${periodoPartidoActual} • ${String(minutoPartidoActual).padStart(2, "0")}'`;
}

function ajustarMarcadorEnVivo(equipo, delta) {
    if (equipo === "local") golesLocalActual = Math.max(0, golesLocalActual + delta);
    else golesVisitaActual = Math.max(0, golesVisitaActual + delta);

    const inpRes = document.getElementById("matchResultado");
    if (inpRes) inpRes.value = `${golesLocalActual} - ${golesVisitaActual}`;
    renderizarCanchaInteractiva();
}

function renderizarCanchaInteractiva() {
    inyectarBotonVelocidadRelojCancha();
    const pitch = document.getElementById("contenedorCanchaTactica");
    if (!pitch) return;

    const coords = obtenerCatalogoFormacionActual();
    const mapa = obtenerMapaAlineacionActual();
    const activos = obtenerPersonasFiltradasDeporte(true);

    let board = document.getElementById("liveMatchScoreboardBox");
    if (!board) {
        board = document.createElement("div");
        board.id = "liveMatchScoreboardBox";
        board.className = "live-scoreboard";
        pitch.parentNode.insertBefore(board, pitch);
    }

    const quitesCont = eventosPartidoActual.filter(e => e.tipo.includes("Quite") || e.tipo.includes("Barrida")).length;
    const ataquesCont = eventosPartidoActual.filter(e => e.tipo.includes("Córner") || e.tipo.includes("Pase") || e.tipo.includes("Flick")).length;
    const tarjetasCont = eventosPartidoActual.filter(e => e.tipo.includes("Tarjeta")).length;

    board.innerHTML = `
        <div class="score-team-box">
            <strong>💙🤍 CDM (${categoriaActiva})</strong>
            <button type="button" class="btn btn-ghost btn-sm" style="padding:0.2rem 0.55rem;" onclick="ajustarMarcadorEnVivo('local', -1)">-</button>
            <span class="score-number">${golesLocalActual}</span>
            <button type="button" class="btn btn-primary btn-sm" style="padding:0.2rem 0.55rem;" onclick="ajustarMarcadorEnVivo('local', 1)">+</button>
        </div>
        <div style="text-align:center;">
            <span class="badge badge-celeste" style="margin-bottom:4px;">ESTADÍSTICAS DEL PARTIDO</span>
            <div style="display:flex; gap:0.55rem; font-size:0.75rem; color:#bae6fd; font-weight:800;">
                <span>🛡️ Quites: ${quitesCont}</span>
                <span>•</span>
                <span>⚡ Ataques/Córners: ${ataquesCont}</span>
                <span>•</span>
                <span>🟨 Tarjetas: ${tarjetasCont}</span>
            </div>
        </div>
        <div class="score-team-box">
            <button type="button" class="btn btn-ghost btn-sm" style="padding:0.2rem 0.55rem;" onclick="ajustarMarcadorEnVivo('visita', -1)">-</button>
            <span class="score-number" style="color:#ffffff;">${golesVisitaActual}</span>
            <button type="button" class="btn btn-primary btn-sm" style="padding:0.2rem 0.55rem;" onclick="ajustarMarcadorEnVivo('visita', 1)">+</button>
            <strong>🆚 RIVAL</strong>
        </div>
    `;

    let html = `
        <div class="pitch-line-half"></div>
        ${deportePagina === "Hockey" ? '<div class="pitch-line-23m-top"></div><div class="pitch-line-23m-bottom"></div>' : ""}
        <div class="pitch-circle-center"></div>
        <div class="pitch-area-top"></div>
        <div class="pitch-area-bottom"></div>
    `;

    const titularesIds = [];
    coords.forEach((pos, idx) => {
        const j = mapa[idx] ? activos.find(x => x.id == mapa[idx]) : null;
        if (j) titularesIds.push(j.id);
        const cAno = j ? eventosPartidoActual.filter(e => e.jugadorId === j.id).length : 0;

        if (j) {
            html += `
                <div class="pitch-node" style="left:${pos.x}%; top:${pos.y}%;" onclick="abrirModalPuestoCancha(${idx})">
                    <div class="pitch-token" style="${j.foto ? `background-image:url('${j.foto}'); background-size:cover; background-position:center; text-shadow:0 1px 4px rgba(0,0,0,0.95);` : ""}">
                        ${j.foto ? `<span style="position:absolute; bottom:-4px; left:-4px; background:#071526; color:#38bdf8; font-size:0.62rem; font-weight:800; padding:1px 5px; border-radius:99px; border:1.5px solid #fff;">#${pos.num}</span>` : pos.num}
                        ${cAno > 0 ? `<span class="pitch-token-badge">${cAno}</span>` : ""}
                    </div>
                    <span class="pitch-label">${j.apellido}</span>
                    <span class="pitch-sub-role">${pos.sigla} • ⭐${j.puntosCategoria}</span>
                </div>
            `;
        } else {
            html += `
                <div class="pitch-node" style="left:${pos.x}%; top:${pos.y}%;" onclick="abrirModalPuestoCancha(${idx})">
                    <div class="pitch-token empty-slot">+${pos.num}</div>
                    <span class="pitch-label">+ ${pos.sigla}</span>
                    <span class="pitch-sub-role">${pos.nombrePuesto}</span>
                </div>
            `;
        }
    });

    pitch.innerHTML = html;

    let bench = document.getElementById("liveBenchStripBox");
    if (!bench) {
        bench = document.createElement("div");
        bench.id = "liveBenchStripBox";
        bench.className = "bench-strip";
        pitch.parentNode.appendChild(bench);
    }

    const suplentes = activos.filter(p => !titularesIds.includes(p.id));
    bench.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.45rem; flex-wrap:wrap;">
            <strong style="font-size:0.78rem; color:var(--ink-900);"><i class="ri-user-shared-line"></i> BANCO DE RELEVOS DISPONIBLE (${suplentes.length} en ${categoriaActiva})</strong>
            <small style="color:var(--ink-500); font-size:0.72rem;">Tocá un puesto en la cancha para hacer un cambio en vivo</small>
        </div>
        <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
            ${suplentes.length ? suplentes.map(s => `<span class="badge badge-celeste" style="cursor:pointer;" onclick="irAPaginaIndividual(${s.id})">👤 ${s.apellido}, ${s.nombre} (${s.puesto} • ⭐${s.puntosCategoria})</span>`).join("") : `<small style="color:var(--ink-500)">Todos los jugadores de la categoría están asignados en cancha.</small>`}
        </div>
    `;

    renderizarEventosPartidoEnVivo();
}

function armarTextoCitacionPartido() {
    const coords = obtenerCatalogoFormacionActual();
    const mapa = obtenerMapaAlineacionActual();
    const activos = obtenerPersonasFiltradasDeporte(true);
    const rival = document.getElementById("matchRival")?.value.trim() || "Próximo Rival";
    const esquema = document.getElementById("matchFormacion")?.value || "4-3-3";

    let msg = `💙🤍 *CITACIÓN Y FORMACIÓN OFICIAL — CDM ADELIA MARÍA*\n`;
    msg += `🏆 *Disciplina:* ${deportePagina} (${categoriaActiva})\n`;
    msg += `🆚 *Partido:* ${rival}\n`;
    msg += `📐 *Esquema Táctico:* ${esquema}\n`;
    msg += `----------------------------------\n\n`;
    msg += `*📋 TITULARES EN CANCHA:*\n`;

    const titularesIds = [];
    coords.forEach((pos, idx) => {
        const j = mapa[idx] ? activos.find(x => x.id == mapa[idx]) : null;
        if (j) {
            titularesIds.push(j.id);
            msg += `• *#${pos.num} (${pos.sigla}):* ${j.apellido}, ${j.nombre}\n`;
        } else {
            msg += `• *#${pos.num} (${pos.sigla}):* _Sin asignar_\n`;
        }
    });

    const suplentes = activos.filter(p => !titularesIds.includes(p.id));
    if (suplentes.length > 0) {
        msg += `\n*🔄 RELEVOS / CONVOCADOS:*\n`;
        suplentes.forEach(s => {
            msg += `• ${s.apellido}, ${s.nombre} (${s.puesto})\n`;
        });
    }

    return msg;
}

function enviarFormacionWhatsApp() {
    const msg = armarTextoCitacionPartido();
    const tel = prompt("Ingresá el WhatsApp del Capitán o Encargado (o dejá vacío para elegir contacto en WhatsApp):", "");
    if (tel === null) return;
    const limpio = tel.replace(/\D/g, "");
    const url = limpio
        ? `https://wa.me/${limpio}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
}

function copiarFormacionPortapapeles() {
    const msg = armarTextoCitacionPartido();
    navigator.clipboard.writeText(msg).then(() => {
        mostrarToast("📋 Formación y convocados copiados para pegar en WhatsApp.");
    });
}

function abrirModalPuestoCancha(slotIdx) {
    slotCanchaSeleccionadoIndex = slotIdx;
    const coords = obtenerCatalogoFormacionActual();
    const info = coords[slotIdx];
    const mapa = obtenerMapaAlineacionActual();
    const idAct = mapa[slotIdx] || null;
    const activos = obtenerPersonasFiltradasDeporte(true);
    const jAct = idAct ? activos.find(x => x.id == idAct) : null;

    const opcJug = activos.length
        ? `<option value="">-- Dejar puesto libre --</option>` +
          activos.map(p => {
              const oc = Object.entries(mapa).find(([k, v]) => Number(k) !== slotIdx && Number(v) === p.id);
              return `<option value="${p.id}" ${p.id == idAct ? "selected" : ""}>${p.apellido}, ${p.nombre} (${p.puesto} — ⭐${p.puntosCategoria}/10)${oc ? ` [En #${coords[oc[0]]?.num}]` : ""}</option>`;
          }).join("")
        : `<option value="">-- No hay jugadores en ${categoriaActiva} --</option>`;

    const opcAcc = deportePagina === "Hockey"
        ? `
            <option value="🏑 Gol de Jugada">🏑 Gol de Jugada</option>
            <option value="📐 Gol de Córner Corto">📐 Gol de Córner Corto</option>
            <option value="🎯 Asistencia en Círculo">🎯 Asistencia en Círculo</option>
            <option value="⚡ Provocó Córner Corto">⚡ Provocó Córner Corto</option>
            <option value="🚀 Arrastrada / Flick Peligroso">🚀 Arrastrada / Flick Peligroso</option>
            <option value="🛡️ Quite Clave / Barrida">🛡️ Quite Clave / Barrida</option>
            <option value="⚠️ Pérdida de Bocha Peligrosa">⚠️ Pérdida de Bocha Peligrosa</option>
            <option value="🟩 Tarjeta Verde / Amarilla">🟩 Tarjeta Verde / Amarilla</option>
            <option value="📝 Observación Táctica">📝 Observación Táctica</option>
        `
        : `
            <option value="⚽ Gol Convertido">⚽ Gol Convertido</option>
            <option value="🎯 Asistencia de Gol">🎯 Asistencia de Gol</option>
            <option value="🛡️ Quite Clave / Recuperación">🛡️ Quite Clave / Recuperación</option>
            <option value="⚡ Pase Filtrado / Desborde">⚡ Pase Filtrado / Desborde</option>
            <option value="🧤 Atajada / Cierre Salvado">🧤 Atajada / Cierre Salvado</option>
            <option value="⚠️ Pérdida Peligrosa / Error">⚠️ Pérdida Peligrosa / Error</option>
            <option value="🟨 Tarjeta Amarilla / Roja">🟨 Tarjeta Amarilla / Roja</option>
            <option value="📝 Observación Táctica">📝 Observación Táctica</option>
        `;

    document.getElementById("modalEventoCancha").innerHTML = `
        <div class="modal-window" style="max-width:540px;">
            <div class="modal-top">
                <div>
                    <span class="badge badge-celeste">Puesto #${info.num} • ${info.sigla}</span>
                    <h3 style="color:var(--ink-900); margin-top:3px;">${info.nombrePuesto}</h3>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('modalEventoCancha').classList.add('hidden')">✕</button>
            </div>

            <div style="background:var(--cdm-50); border:1px solid var(--line-celeste); padding:0.9rem; border-radius:12px; margin-bottom:1rem;">
                <div class="field" style="margin-bottom:0.4rem;">
                    <label>👤 1. Asignar Jugador de ${categoriaActiva} o Hacer Cambio</label>
                    <div style="display:flex; gap:0.5rem;">
                        <select id="selectAsignarJugadorSlot" style="flex:1;">${opcJug}</select>
                        <button type="button" class="btn btn-primary btn-sm" onclick="procesarCambioJugadorCancha()">🔄 Ubicar / Cambio</button>
                    </div>
                </div>
            </div>

            ${jAct ? `
                <form onsubmit="guardarEventoCancha(event)">
                    <h4 style="font-size:0.88rem; color:var(--ink-900); margin-bottom:0.65rem;">
                        ⏱️ 2. Registrar Acción para: <span style="color:var(--cdm-600)">${jAct.nombre} ${jAct.apellido}</span>
                    </h4>
                    <div class="grid-2" style="margin-bottom:0.65rem;">
                        <div class="field">
                            <label>Minuto / Período *</label>
                            <input type="text" id="evCanchaMinuto" required value="${periodoPartidoActual} • ${minutoPartidoActual}'">
                        </div>
                        <div class="field">
                            <label>Valoración Sugerida (Escala 1 a 10) *</label>
                            <select id="evCanchaImpacto">
                                <option value="0.5">🌟 Sobresaliente (+0.5 pts)</option>
                                <option value="0.3">🔥 Muy Destacado (+0.3 pts)</option>
                                <option value="0.2" selected>✅ Positivo (+0.2 pts)</option>
                                <option value="0">⚪ Neutro (0 pts)</option>
                                <option value="-0.2">⚠️ Error (-0.2 pts)</option>
                                <option value="-0.5">🟥 Falta grave (-0.5 pts)</option>
                            </select>
                        </div>
                    </div>
                    <div class="field" style="margin-bottom:0.65rem;">
                        <label>Situación *</label>
                        <select id="evCanchaTipo">${opcAcc}</select>
                    </div>
                    <div class="field" style="margin-bottom:0.9rem;">
                        <label>Detalle *</label>
                        <input type="text" id="evCanchaDetalle" required placeholder="Ej: Gran definición cruzada...">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%;">Guardar Acción del Minuto</button>
                </form>
            ` : `<div class="empty-box" style="padding:1.25rem;">Seleccioná un jugador arriba y tocá "🔄 Ubicar / Cambio" para colocarlo en este círculo.</div>`}
        </div>
    `;
    document.getElementById("modalEventoCancha").classList.remove("hidden");
}

function procesarCambioJugadorCancha() {
    const idVal = document.getElementById("selectAsignarJugadorSlot").value;
    const mapa = obtenerMapaAlineacionActual();
    const idNum = parseInt(idVal);
    const idAnt = mapa[slotCanchaSeleccionadoIndex];

    if (!idVal) {
        delete mapa[slotCanchaSeleccionadoIndex];
        guardarDatosCDM();
        renderizarCanchaInteractiva();
        abrirModalPuestoCancha(slotCanchaSeleccionadoIndex);
        return;
    }

    if (idAnt && idAnt !== idNum && minutoPartidoActual > 0) {
        const jE = basePersonas.find(x => x.id === idNum);
        const jS = basePersonas.find(x => x.id === idAnt);
        const info = obtenerCatalogoFormacionActual()[slotCanchaSeleccionadoIndex];
        if (jE && jS) {
            eventosPartidoActual.push({
                id: Date.now(),
                minuto: minutoPartidoActual,
                minutoDisplay: `${periodoPartidoActual} • ${minutoPartidoActual}'`,
                jugadorId: jE.id,
                jugadorNombre: `${jE.apellido}, ${jE.nombre}`,
                puestoEnCancha: `#${info.num} ${info.sigla}`,
                tipo: "🔄 Cambio / Sustitución",
                detalle: `Entra por ${jS.apellido}, ${jS.nombre}`,
                impactoPuntos: 0
            });
            eventosPartidoActual.sort((a, b) => a.minuto - b.minuto);
        }
    }

    Object.keys(mapa).forEach(k => {
        if (Number(mapa[k]) === idNum) delete mapa[k];
    });
    mapa[slotCanchaSeleccionadoIndex] = idNum;
    guardarDatosCDM();
    renderizarCanchaInteractiva();

    const jNuevo = basePersonas.find(x => x.id === idNum);
    if (jNuevo) mostrarToast(`📌 ${jNuevo.apellido} ubicado en cancha.`);
    abrirModalPuestoCancha(slotCanchaSeleccionadoIndex);
}

function guardarEventoCancha(e) {
    e.preventDefault();
    const mapa = obtenerMapaAlineacionActual();
    const j = basePersonas.find(x => x.id == mapa[slotCanchaSeleccionadoIndex]);
    if (!j) return;

    const info = obtenerCatalogoFormacionActual()[slotCanchaSeleccionadoIndex];
    const minDisplay = document.getElementById("evCanchaMinuto").value;
    const impacto = parseFloat(document.getElementById("evCanchaImpacto").value) || 0;
    const tipo = document.getElementById("evCanchaTipo").value;

    if (tipo.includes("Gol")) {
        golesLocalActual++;
        const inpRes = document.getElementById("matchResultado");
        if (inpRes) inpRes.value = `${golesLocalActual} - ${golesVisitaActual}`;
    }

    eventosPartidoActual.push({
        id: Date.now(),
        minuto: minutoPartidoActual,
        minutoDisplay: minDisplay,
        jugadorId: j.id,
        jugadorNombre: `${j.apellido}, ${j.nombre}`,
        puestoEnCancha: `#${info.num} ${info.sigla}`,
        tipo,
        detalle: document.getElementById("evCanchaDetalle").value.trim(),
        impactoPuntos: impacto
    });
    eventosPartidoActual.sort((a, b) => a.minuto - b.minuto);
    document.getElementById("modalEventoCancha").classList.add("hidden");
    mostrarToast(`✓ Anotado: ${j.apellido} (${tipo})`);
    renderizarCanchaInteractiva();
}

function renderizarEventosPartidoEnVivo() {
    const cont = document.getElementById("listaEventosPartidoEnVivo");
    const badge = document.getElementById("contadorEventosPartido");
    if (!cont || !badge) return;
    badge.innerText = eventosPartidoActual.length;

    const barraCitacion = `
        <div style="display:flex; gap:0.45rem; margin-bottom:0.75rem; flex-wrap:wrap;">
            <button type="button" class="btn btn-whatsapp btn-sm" style="flex:1;" onclick="enviarFormacionWhatsApp()">
                <i class="ri-whatsapp-line"></i> Enviar Formación / Citación
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="copiarFormacionPortapapeles()">
                📋 Copiar 11
            </button>
        </div>
    `;

    if (eventosPartidoActual.length === 0) {
        cont.innerHTML = barraCitacion + `<div class="empty-box">Tocá cualquier círculo de la cancha para ubicar un jugador y anotar jugadas minuto a minuto.</div>`;
        return;
    }

    cont.innerHTML = barraCitacion + eventosPartidoActual.map(ev => `
        <div style="background:var(--surface-solid); border:1px solid var(--line); border-radius:10px; padding:0.65rem 0.8rem; margin-bottom:0.45rem; font-size:0.82rem; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <span class="badge badge-celeste" style="font-size:0.7rem;">${ev.minutoDisplay}</span>
                <span class="badge badge-purple">${ev.puestoEnCancha || ""}</span>
                <strong style="margin-left:4px; color:var(--ink-900);">${ev.jugadorNombre}</strong> • <b>${ev.tipo}</b> (${ev.impactoPuntos > 0 ? "+" + ev.impactoPuntos : ev.impactoPuntos} pts)
                <br><small style="color:var(--ink-500)">${ev.detalle}</small>
            </div>
            <button class="btn btn-danger btn-sm" onclick="quitarEventoEnVivo(${ev.id})">✕</button>
        </div>
    `).join("");
}

function quitarEventoEnVivo(idEv) {
    eventosPartidoActual = eventosPartidoActual.filter(e => e.id !== idEv);
    renderizarCanchaInteractiva();
}

function generarConclusionAutomaticaPartido(rival, resultado, eventos) {
    const goles = eventos.filter(e => e.tipo.includes("Gol")).length;
    const quites = eventos.filter(e => e.tipo.includes("Quite") || e.tipo.includes("Barrida")).length;
    const perdidas = eventos.filter(e => e.tipo.includes("Pérdida") || e.tipo.includes("Error")).length;
    const cambios = eventos.filter(e => e.tipo.includes("Cambio") || e.tipo.includes("Sustitución")).length;

    const mapa = {};
    eventos.forEach(e => {
        if (!mapa[e.jugadorId]) {
            mapa[e.jugadorId] = { id: e.jugadorId, nombre: e.jugadorNombre, puesto: e.puestoEnCancha, eventos: 0, puntosSugeridos: 0 };
        }
        if (!e.tipo.includes("Sustitución")) {
            mapa[e.jugadorId].eventos++;
            mapa[e.jugadorId].puntosSugeridos = Math.round((mapa[e.jugadorId].puntosSugeridos + e.impactoPuntos) * 10) / 10;
        }
    });

    const resumen = Object.values(mapa).filter(j => j.eventos > 0 || j.puntosSugeridos !== 0);
    const destacados = resumen.filter(j => j.puntosSugeridos > 0).map(j => `${j.nombre} (${j.puesto}: +${j.puntosSugeridos})`).join(", ") || "Rendimiento colectivo parejo";
    const texto = `Resumen vs ${rival} (${resultado || "S/D"}): Se registraron ${eventos.length} intervenciones con ${cambios} modificaciones tácticas (${goles} goles, ${quites} recuperaciones, ${perdidas} pérdidas). Destacados: ${destacados}.`;
    return { texto, resumenJugadores: resumen };
}

function finalizarYGuardarPartido() {
    if (eventosPartidoActual.length === 0) {
        alert("Anotá al menos un gol, quite o cambio tocando los círculos de la cancha antes de cerrar el partido.");
        return;
    }
    const rival = document.getElementById("matchRival").value.trim() || "Partido Oficial";
    const resultado = document.getElementById("matchResultado").value.trim() || `${golesLocalActual} - ${golesVisitaActual}`;
    const { texto, resumenJugadores } = generarConclusionAutomaticaPartido(rival, resultado, eventosPartidoActual);

    basePartidos.unshift({
        id: Date.now(),
        fecha: obtenerHoyISO(),
        deporte: deportePagina,
        categoria: categoriaActiva,
        rival,
        resultado,
        formacion: document.getElementById("matchFormacion").value,
        eventos: [...eventosPartidoActual],
        conclusion: texto,
        resumenJugadores,
        puntosAplicadosAlRanking: false
    });

    guardarDatosCDM();
    eventosPartidoActual = [];
    golesLocalActual = 0;
    golesVisitaActual = 0;
    reiniciarCronometroPartido();
    document.getElementById("matchRival").value = "";
    document.getElementById("matchResultado").value = "";
    mostrarToast("🏁 Partido guardado (El Score se mantiene bajo control manual del Admin).");
    renderizarCanchaInteractiva();
    renderizarHistorialPartidos();
}

function renderizarHistorialPartidos() {
    const cont = document.getElementById("contenedorHistorialPartidos");
    if (!cont) return;
    const partidosCat = basePartidos.filter(m => m.deporte === deportePagina && m.categoria === categoriaActiva);
    if (partidosCat.length === 0) {
        cont.innerHTML = `<div class="empty-box">Sin partidos registrados en ${categoriaActiva}.</div>`;
        return;
    }

    cont.innerHTML = partidosCat.map(m => `
        <div style="background:var(--surface-subtle); border:1px solid var(--line); border-radius:14px; padding:1.15rem; margin-bottom:0.85rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.6rem;">
                <strong>📅 ${m.fecha} — ${m.rival} (${m.resultado}) • Esquema ${m.formacion}</strong>
                <div style="display:flex; gap:0.4rem; align-items:center;">
                    ${m.puntosAplicadosAlRanking ? `<span class="badge badge-ok">✓ Valoración Aplicada por Admin</span>` : `<button class="btn btn-primary btn-sm" onclick="aplicarPuntosPartidoAlRanking(${m.id})">⚖️ Aplicar Valoración al Score (1-10)</button>`}
                    <button class="btn btn-danger btn-sm" onclick="if(confirm('¿Eliminar partido?')){ basePartidos = basePartidos.filter(x => x.id !== ${m.id}); guardarDatosCDM(); renderizarHistorialPartidos(); }"><i class="ri-delete-bin-line"></i></button>
                </div>
            </div>
            <p style="font-size:0.85rem; color:var(--ink-700); margin-bottom:0.6rem;">🧠 <b>Evaluación:</b> ${m.conclusion}</p>
            <div>${m.resumenJugadores.map(rj => `<span class="badge ${rj.puntosSugeridos >= 0 ? "badge-ok" : "badge-warn"}" style="margin-right:4px;">${rj.nombre}: ${rj.puntosSugeridos >= 0 ? "+" : ""}${rj.puntosSugeridos} pts</span>`).join("")}</div>
        </div>
    `).join("");
}

function aplicarPuntosPartidoAlRanking(idPartido) {
    const m = basePartidos.find(x => x.id === idPartido);
    if (!m || m.puntosAplicadosAlRanking) return;
    m.resumenJugadores.forEach(rj => {
        const p = basePersonas.find(x => x.id === rj.id);
        if (p && p.deporte !== "Gimnasio" && rj.puntosSugeridos !== 0) {
            asegurarPilaresPersona(p);
            const deltaEscala10 = Math.abs(rj.puntosSugeridos) >= 1 ? rj.puntosSugeridos / 10 : rj.puntosSugeridos;
            p.pilares.bonus = normalizarBonus1a10((p.pilares.bonus || 0) + deltaEscala10);
            recalcularPuntajePonderado(p);
            p.motivoPuntos = `Partido ${m.rival} (${deltaEscala10 >= 0 ? "+" : ""}${deltaEscala10.toFixed(1)} pts)`;
        }
    });
    m.puntosAplicadosAlRanking = true;
    guardarDatosCDM();
    mostrarToast("🏆 Valoración aplicada por el Admin al Score (1 a 10).");
    renderizarPaginaDeporte();
}

// =========================================================================
// 6. PLANIFICADOR DE MICROCICLO SEMANAL Y LISTA DE BUENA FE (FÚTBOL Y HOCKEY)
// =========================================================================

const DIAS_MICROCICLO = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado (Partido)"];

function obtenerClaveMicrociclo() {
    return `${deportePagina}_${categoriaActiva}`;
}

function obtenerMicrocicloActual() {
    const clave = obtenerClaveMicrociclo();
    if (!baseMicrociclos[clave]) {
        baseMicrociclos[clave] = {
            "Lunes": { foco: "Descanso / Regenerativo", carga: "Baja (RPE 3-4)", detalle: "Movilidad articular y elongación" },
            "Martes": { foco: "Físico + Circuito Técnico", carga: "Alta (RPE 8)", detalle: "Fuerza preventiva + Espacio reducido" },
            "Miércoles": { foco: "Táctico Colectivo", carga: "Media-Alta (RPE 7)", detalle: "Salidas, presión y transiciones" },
            "Jueves": { foco: "Práctica Formal de Juego", carga: "Alta (RPE 8)", detalle: "Bloques tácticos 11 vs 11" },
            "Viernes": { foco: "Pelota Parada / Córner Corto", carga: "Baja-Media (RPE 5)", detalle: "Velocidad de reacción y táctica fija" },
            "Sábado (Partido)": { foco: "Competencia Oficial", carga: "Máxima (RPE 9-10)", detalle: "Fecha oficial de liga" }
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
                    <strong style="color:var(--ink-900); font-size:0.94rem;">📅 ${dia}</strong>
                    <span class="badge badge-celeste">${d.carga}</span>
                </div>
                <div class="field">
                    <label>Foco del Día</label>
                    <input type="text" value="${d.foco}" onchange="guardarCambioMicrociclo('${dia}', 'foco', this.value)">
                </div>
                <div class="field">
                    <label>Intensidad Esperada</label>
                    <select onchange="guardarCambioMicrociclo('${dia}', 'carga', this.value)">
                        <option value="Baja (RPE 3-4)" ${d.carga.includes("3-4") ? "selected" : ""}>🟢 Baja (RPE 3-4)</option>
                        <option value="Baja-Media (RPE 5)" ${d.carga.includes("5") ? "selected" : ""}>🔵 Baja-Media (RPE 5)</option>
                        <option value="Media-Alta (RPE 7)" ${d.carga.includes("7") ? "selected" : ""}>🟡 Media-Alta (RPE 7)</option>
                        <option value="Alta (RPE 8)" ${d.carga.includes("8") ? "selected" : ""}>🟠 Alta (RPE 8)</option>
                        <option value="Máxima (RPE 9-10)" ${d.carga.includes("9-10") ? "selected" : ""}>🔴 Máxima (RPE 9-10)</option>
                    </select>
                </div>
                <div class="field">
                    <label>Tareas de Campo / Horario</label>
                    <input type="text" value="${d.detalle}" onchange="guardarCambioMicrociclo('${dia}', 'detalle', this.value)">
                </div>
            </div>
        `;
    }).join("");

    const contLista = document.getElementById("contenedorListaBuenaFeDeporte");
    if (!contLista) return;
    const activos = obtenerPersonasFiltradasDeporte(true);

    if (activos.length === 0) {
        contLista.innerHTML = `<div class="empty-box">No hay jugadores activos en ${categoriaActiva}.</div>`;
        return;
    }

    contLista.innerHTML = `<div class="table-wrap"><table class="app-table"><thead><tr><th>#</th><th>Jugador/a</th><th>DNI</th><th>Edad / Sangre</th><th>Puesto</th><th>Score (1-10)</th><th>Estado Médico</th><th class="col-admin-control">Cuota</th><th>Habilitación</th></tr></thead><tbody>` +
        activos.map((p, idx) => {
            const apto = !p.estadoMedico || p.estadoMedico === "Óptimo";
            const alDia = (p.pagoEstado || "Al Día") === "Al Día";
            const habilitado = apto && alDia;
            return `
                <tr style="cursor:pointer;" onclick="irAPaginaIndividual(${p.id})">
                    <td data-label="#"><b>#${idx + 1}</b></td>
                    <td data-label="Jugador/a"><strong>${p.apellido}, ${p.nombre}</strong></td>
                    <td data-label="DNI">${p.dni}</td>
                    <td data-label="Edad / Sangre">${p.edad} años • <b>${p.sangre}</b></td>
                    <td data-label="Puesto">${p.puesto}</td>
                    <td data-label="Score (1-10)"><span class="badge badge-purple">⭐ ${p.puntosCategoria} / 10</span></td>
                    <td data-label="Estado Médico"><span class="badge ${apto ? "badge-ok" : "badge-danger"}">${p.estadoMedico || "Óptimo"}</span></td>
                    <td data-label="Cuota" class="col-admin-control"><span class="badge ${alDia ? "badge-ok" : "badge-warn"}">${alDia ? "Al Día" : "Pendiente"}</span></td>
                    <td data-label="Habilitación"><span class="badge ${habilitado ? "badge-ok" : "badge-danger"}">${habilitado ? "✓ HABILITADO" : "⚠️ OBSERVADO"}</span></td>
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
    mostrarToast(`📅 ${dia} actualizado.`);
}

function cargarMicrocicloModelo() {
    delete baseMicrociclos[obtenerClaveMicrociclo()];
    obtenerMicrocicloActual();
    guardarDatosCDM();
    renderizarMicrocicloDeporte();
    mostrarToast("⚡ Semana modelo restaurada.");
}

function enviarMicrocicloWhatsApp() {
    const plan = obtenerMicrocicloActual();
    let msg = `💙🤍 *PLAN SEMANAL DE ENTRENAMIENTO — CDM ADELIA MARÍA*\n`;
    msg += `🏆 *Plantel:* ${deportePagina} (${categoriaActiva})\n`;
    msg += `----------------------------------\n\n`;
    DIAS_MICROCICLO.forEach(dia => {
        const d = plan[dia];
        msg += `*📅 ${dia.toUpperCase()}* [${d.carga}]\n`;
        msg += `   • *Enfoque:* ${d.foco}\n`;
        msg += `   • *Tareas:* ${d.detalle}\n\n`;
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
}

// =========================================================================
// 7. RANKING DEPORTIVO DEL 1 AL 10 (100% CONTROLADO POR EL ADMIN)
// =========================================================================

function renderizarRankingDeporte() {
    const cont = document.getElementById("contenedorRankingDeporte");
    const sel = document.getElementById("selectJugadorRanking");
    if (!cont || !sel) return;

    const activos = obtenerPersonasFiltradasDeporte(true);
    activos.forEach(p => asegurarPilaresPersona(p));
    activos.sort((a, b) => b.puntosCategoria - a.puntosCategoria);

    sel.innerHTML = activos.length
        ? activos.map(p => `<option value="${p.id}">${p.apellido}, ${p.nombre} (Score actual: ${p.puntosCategoria} / 10)</option>`).join("")
        : `<option value="">-- Sin jugadores --</option>`;

    if (activos.length === 0) {
        cont.innerHTML = `<div class="empty-box">Sin jugadores activos para el ranking en ${categoriaActiva}.</div>`;
        return;
    }

    cont.innerHTML = `<div class="table-wrap"><table class="app-table"><thead><tr><th>Puesto</th><th>Deportista</th><th>Físico (1-10)</th><th>Gym (1-10)</th><th>Técnico (1-10)</th><th>Actitud (1-10)</th><th>Bonus</th><th>Score (1 a 10)</th><th>Último Motivo (Admin)</th><th class="col-admin-control">Control Admin</th></tr></thead><tbody>` +
        activos.map((p, idx) => `
            <tr style="cursor:pointer;" onclick="irAPaginaIndividual(${p.id})">
                <td data-label="Puesto"><strong>${idx === 0 ? "🥇 " : idx === 1 ? "🥈 " : idx === 2 ? "🥉 " : ""}#${idx + 1}°</strong></td>
                <td data-label="Deportista"><div><strong>${p.apellido}, ${p.nombre}</strong><br><small style="color:var(--ink-500)">${p.puesto}</small></div></td>
                <td data-label="Físico (30%)"><b>${p.pilares.fisico}</b></td>
                <td data-label="Gym (25%)"><b>${p.pilares.gym}</b></td>
                <td data-label="Técnico (25%)"><b>${p.pilares.tecnico}</b></td>
                <td data-label="Actitud (20%)"><b>${p.pilares.actitud}</b></td>
                <td data-label="Bonus"><span class="badge ${p.pilares.bonus >= 0 ? "badge-celeste" : "badge-warn"}">${p.pilares.bonus >= 0 ? "+" : ""}${p.pilares.bonus}</span></td>
                <td data-label="Score (1 a 10)"><span class="badge badge-ok" style="font-size:0.9rem;">⭐ ${p.puntosCategoria} / 10</span></td>
                <td data-label="Motivo"><small>${p.motivoPuntos || "Asignado por Admin"}</small></td>
                <td data-label="Control Admin" class="col-admin-control" onclick="event.stopPropagation();">
                    <div style="display:flex; gap:0.25rem; flex-wrap:wrap; justify-content:flex-end;">
                        <button class="btn btn-ghost btn-sm" title="Subir 0.5 pts" onclick="sumarPuntoRapido(${p.id}, 0.5)">+0.5</button>
                        <button class="btn btn-ghost btn-sm" title="Bajar 0.5 pts" onclick="sumarPuntoRapido(${p.id}, -0.5)">-0.5</button>
                        <button class="btn btn-secondary btn-sm" title="Fijar Nota Directa (1 a 10)" onclick="calificarJugadorRapidoPrompt(${p.id})">✏️ Nota</button>
                    </div>
                </td>
            </tr>
        `).join("") + `</tbody></table></div>`;
}

function guardarPuntosRankingDeporte(e) {
    e.preventDefault();
    const p = basePersonas.find(x => x.id === parseInt(document.getElementById("selectJugadorRanking").value));
    if (!p || p.deporte === "Gimnasio") return;

    const pilar = document.getElementById("selectPilarRanking")?.value || "general";
    const modo = document.getElementById("selectModoRanking")?.value || "fijar";
    const valor = parseFloat(document.getElementById("inputPuntosDelta").value);
    if (isNaN(valor)) return;

    asegurarPilaresPersona(p);
    const anterior = p.puntosCategoria;

    if (pilar === "general") {
        // El Admin fija o ajusta directamente el Score General del 1 al 10
        const nuevoScore = modo === "fijar"
            ? normalizarNota1a10(valor, p.puntosCategoria)
            : normalizarNota1a10(p.puntosCategoria + valor, p.puntosCategoria);
        p.pilares.fisico = nuevoScore;
        p.pilares.gym = nuevoScore;
        p.pilares.tecnico = nuevoScore;
        p.pilares.actitud = nuevoScore;
        p.pilares.bonus = 0;
    } else if (pilar === "bonus") {
        p.pilares.bonus = modo === "fijar"
            ? normalizarBonus1a10(valor)
            : normalizarBonus1a10((p.pilares.bonus || 0) + valor);
    } else if (p.pilares[pilar] !== undefined) {
        const nv = modo === "fijar" ? valor : p.pilares[pilar] + valor;
        p.pilares[pilar] = normalizarNota1a10(nv, p.pilares[pilar]);
    }

    recalcularPuntajePonderado(p);
    const diff = Math.round((p.puntosCategoria - anterior) * 10) / 10;
    p.motivoPuntos = `${pilar.toUpperCase()}: ${document.getElementById("inputPuntosMotivo").value.trim()} (${diff >= 0 ? "+" : ""}${diff})`;
    guardarDatosCDM();
    e.target.reset();
    mostrarToast(`🏆 Score actualizado por Admin: ${p.apellido} (⭐ ${p.puntosCategoria} / 10)`);
    renderizarPaginaDeporte();
}

function sumarPuntoRapido(id, delta) {
    const p = basePersonas.find(x => x.id === id);
    if (!p || p.deporte === "Gimnasio") return;
    asegurarPilaresPersona(p);
    const nuevo = normalizarNota1a10(p.puntosCategoria + delta, p.puntosCategoria);
    const diffReal = Math.round((nuevo - p.puntosCategoria) * 10) / 10;
    p.pilares.bonus = normalizarBonus1a10((p.pilares.bonus || 0) + diffReal);
    recalcularPuntajePonderado(p);
    p.motivoPuntos = delta > 0 ? `Ajuste Admin (+${delta})` : `Ajuste Admin (${delta})`;
    guardarDatosCDM();
    mostrarToast(`⭐ ${p.apellido}: ${p.puntosCategoria} / 10`);
    renderizarPaginaDeporte();
}

function calificarJugadorRapidoPrompt(id) {
    const p = basePersonas.find(x => x.id === id);
    if (!p || p.deporte === "Gimnasio") return;
    asegurarPilaresPersona(p);

    const entrada = prompt(`👑 Calificar Score Oficial (del 1 al 10) para ${p.nombre} ${p.apellido}:`, p.puntosCategoria);
    if (entrada === null) return;
    const nota = parseFloat(entrada.replace(",", "."));
    if (isNaN(nota) || nota < 1 || nota > 10) {
        alert("⚠️ Por favor ingresá un puntaje válido entre 1.0 y 10.0.");
        return;
    }

    const motivo = prompt("Motivo de la calificación (opcional):", "Evaluación directa del Profe") || "Evaluación directa del Profe";
    const notaRedondeada = Math.round(nota * 10) / 10;

    p.pilares.fisico = notaRedondeada;
    p.pilares.gym = notaRedondeada;
    p.pilares.tecnico = notaRedondeada;
    p.pilares.actitud = notaRedondeada;
    p.pilares.bonus = 0;
    recalcularPuntajePonderado(p);
    p.motivoPuntos = motivo;

    guardarDatosCDM();
    mostrarToast(`⭐ Score fijado en ${p.puntosCategoria}/10 para ${p.apellido}`);
    if (document.body.dataset.page === "perfil-individual") inicializarPaginaJugadorIndividual();
    else renderizarPaginaDeporte();
}

// =========================================================================
// 8. GIMNASIO: PLANILLA CON BUSCADOR, RECIBOS, RÉCORDS PR Y RUTINAS WHATSAPP
// =========================================================================

function cambiarTabGym(nombreSeccion, btnEl) {
    document.querySelectorAll(".gym-seccion").forEach(s => {
        s.classList.add("hidden");
        s.classList.remove("animate-in");
    });
    const sec = document.getElementById(`gym-sec-${nombreSeccion}`);
    if (sec) {
        sec.classList.remove("hidden");
        sec.classList.add("animate-in");
    }
    document.querySelectorAll(".module-tabs .mod-tab").forEach(b => b.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");
    actualizarDashboardGym();
    renderizarVideotecaGym();
    renderizarMuroRecordsYRetencionGym();
}

function irAArmarRutinaParaPersona(idPersona) {
    const btnTabRutinas = Array.from(document.querySelectorAll(".module-tabs .mod-tab")).find(b => b.innerText.toLowerCase().includes("rutina"));
    if (deportePagina === "Gimnasio" && btnTabRutinas) cambiarTabGym("rutinas", btnTabRutinas);
    else if (btnTabRutinas) cambiarSeccionDeporte("rutinas", btnTabRutinas);
    const sel = document.getElementById("adminRutinaPersonaSelect");
    if (sel) sel.value = String(idPersona);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function actualizarDashboardGym() {
    const inpFecha = document.getElementById("fechaAsistenciaGym");
    if (inpFecha && !inpFecha.value) inpFecha.value = obtenerHoyISO();
    const fechaSel = inpFecha ? inpFecha.value : obtenerHoyISO();

    const actGym = basePersonas.filter(p => p.deporte === "Gimnasio" && p.activo);
    const presHoy = actGym.filter(p => Array.isArray(p.asistencias) && p.asistencias.includes(fechaSel)).length;
    const alDiaList = actGym.filter(p => (p.pagoEstado || "Al Día") === "Al Día");

    let sumaCumpl = 0;
    actGym.forEach(p => {
        sumaCumpl += Math.min(100, Math.round((contarAsistenciasUltimos7Dias(p) / (p.frecuenciaSemanal || 3)) * 100));
    });

    if (document.getElementById("gymKpiActivos")) {
        document.getElementById("gymKpiActivos").innerText = actGym.length;
        document.getElementById("gymKpiPresentesHoy").innerText = `${presHoy} / ${actGym.length}`;
        document.getElementById("gymKpiPromedioSemanal").innerText = `${actGym.length > 0 ? Math.round(sumaCumpl / actGym.length) : 0}%`;
        document.getElementById("gymKpiRecaudacion").innerText = `$${alDiaList.reduce((acc, p) => acc + Number(p.montoCuota || 0), 0).toLocaleString("es-AR")}`;
    }

    renderizarAsistenciasGym();
    poblarSelectsAdminRutinasGym();
    renderizarListaRutinasAdminGym();
}

function renderizarMuroRecordsYRetencionGym() {
    const contCaja = document.getElementById("contenedorResumenCajaGym");
    const contRec = document.getElementById("contenedorMuroRecordsGym");
    const contRet = document.getElementById("contenedorRadarRetencionGym");
    if (!contRec || !contRet) return;

    const activosGym = basePersonas.filter(p => p.deporte === "Gimnasio" && p.activo);
    const cobradoMes = activosGym.filter(p => (p.pagoEstado || "Al Día") === "Al Día").reduce((a, p) => a + Number(p.montoCuota || 25000), 0);
    const porCobrarMes = activosGym.filter(p => p.pagoEstado === "Pendiente").reduce((a, p) => a + Number(p.montoCuota || 25000), 0);

    if (contCaja) {
        contCaja.innerHTML = `
            <div class="bento-kpi"><div class="kpi-icon"><i class="ri-user-heart-fill"></i></div><div class="kpi-data"><span>Socios Exclusivos Gym</span><strong>${activosGym.length} socios</strong></div></div>
            <div class="bento-kpi"><div class="kpi-icon purple"><i class="ri-vidicon-fill"></i></div><div class="kpi-data"><span>Ejercicios en Videoteca</span><strong>${baseVideoteca.length} videos</strong></div></div>
            <div class="bento-kpi"><div class="kpi-icon ok"><i class="ri-cash-line"></i></div><div class="kpi-data"><span>Caja Cobrada (Al Día)</span><strong>$${cobradoMes.toLocaleString("es-AR")}</strong></div></div>
            <div class="bento-kpi"><div class="kpi-icon warn"><i class="ri-error-warning-fill"></i></div><div class="kpi-data"><span>Pendiente por Cobrar</span><strong>$${porCobrarMes.toLocaleString("es-AR")}</strong></div></div>
        `;
    }

    const marcasPR = [];
    activosGym.forEach(p => {
        (p.evaluaciones || []).forEach(ev => {
            if (ev.tipo === "fuerza_kg" || ev.tipo === "salto_cm") {
                const rel = ev.tipo === "fuerza_kg" ? (ev.valor / (p.peso || 70)).toFixed(2) + "x peso" : ev.detalle;
                marcasPR.push({
                    personaId: p.id,
                    nombre: `${p.apellido}, ${p.nombre}`,
                    plan: p.puesto,
                    ejercicio: ev.ejercicio,
                    valor: ev.valor,
                    unidad: ev.unidad,
                    relativo: rel
                });
            }
        });
    });

    marcasPR.sort((a, b) => b.valor - a.valor);

    if (marcasPR.length === 0) {
        contRec.innerHTML = `<div class="empty-box">Cargá evaluaciones de fuerza en la ficha de los socios del gimnasio para ver el Muro de Récords.</div>`;
    } else {
        contRec.innerHTML = `<div class="table-wrap"><table class="app-table"><thead><tr><th>#</th><th>Socio del Gimnasio</th><th>Ejercicio</th><th>Marca PR</th><th>F. Relativa</th></tr></thead><tbody>` +
            marcasPR.slice(0, 10).map((r, i) => `
                <tr style="cursor:pointer;" onclick="irAPaginaIndividual(${r.personaId})">
                    <td data-label="Puesto"><strong>${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "#" + (i + 1)}</strong></td>
                    <td data-label="Socio"><div><strong>${r.nombre}</strong><br><small style="color:var(--ink-500)">${r.plan}</small></div></td>
                    <td data-label="Ejercicio"><b>${r.ejercicio}</b></td>
                    <td data-label="Marca PR"><span class="badge badge-ok">${r.valor} ${r.unidad}</span></td>
                    <td data-label="F. Relativa"><small style="font-weight:800; color:var(--cdm-700);">${r.relativo}</small></td>
                </tr>
            `).join("") + `</tbody></table></div>`;
    }

    const alertasRet = activosGym.filter(p => contarAsistenciasUltimos7Dias(p) < (p.frecuenciaSemanal || 3) || p.pagoEstado === "Pendiente");
    if (alertasRet.length === 0) {
        contRet.innerHTML = `<div class="empty-box"><strong style="color:var(--ok);">✓ Sin alertas de morosidad ni ausentismo.</strong></div>`;
    } else {
        contRet.innerHTML = `<div class="table-wrap"><table class="app-table"><thead><tr><th>Socio</th><th>Semana (7d)</th><th>Cuota</th><th>Contacto Directo</th></tr></thead><tbody>` +
            alertasRet.map(p => {
                const fue = contarAsistenciasUltimos7Dias(p);
                const pac = p.frecuenciaSemanal || 3;
                const alDia = (p.pagoEstado || "Al Día") === "Al Día";
                return `
                    <tr>
                        <td data-label="Socio"><strong style="cursor:pointer; color:var(--cdm-600);" onclick="irAPaginaIndividual(${p.id})">${p.apellido}, ${p.nombre}</strong></td>
                        <td data-label="Semana (7d)"><span class="badge ${fue < pac ? "badge-warn" : "badge-ok"}">${fue}/${pac} días</span></td>
                        <td data-label="Cuota"><span class="badge ${alDia ? "badge-ok" : "badge-danger"}">${alDia ? "Al Día" : "Debe $" + Number(p.montoCuota || 25000).toLocaleString("es-AR")}</span></td>
                        <td data-label="Contacto Directo">
                            <div style="display:flex; gap:0.3rem; flex-wrap:wrap; justify-content:flex-end;">
                                ${!alDia ? `<button class="btn btn-danger btn-sm" onclick="enviarReciboPagoWhatsApp(${p.id})">💳 Cobrar WA</button>` : ""}
                                ${fue < pac ? `<button class="btn btn-warn btn-sm" onclick="enviarAlertaAsistenciaWhatsApp(${p.id})">📲 Motivar WA</button>` : ""}
                            </div>
                        </td>
                    </tr>
                `;
            }).join("") + `</tbody></table></div>`;
    }
}

function renderizarAsistenciasGym() {
    const cont = document.getElementById("contenedorTablaAsistenciasGym");
    if (!cont) return;
    const fecha = document.getElementById("fechaAsistenciaGym")?.value || obtenerHoyISO();
    const activos = basePersonas.filter(p => p.deporte === "Gimnasio" && p.activo);

    if (activos.length === 0) {
        cont.innerHTML = `<div class="empty-box">Sin socios activos en el Gimnasio.</div>`;
        dibujarGraficosColectivosGym();
        return;
    }

    cont.innerHTML = `<div class="table-wrap"><table class="app-table"><thead><tr><th>Check (✓)</th><th>Socio del Gimnasio</th><th>Plan / Enfoque</th><th>Semana (7d)</th><th>Estado Cuota</th><th>Acciones Administrativas</th></tr></thead><tbody>` +
        activos.map(p => {
            const pac = p.frecuenciaSemanal || 3;
            const fueSem = contarAsistenciasUltimos7Dias(p);
            const pres = p.asistencias.includes(fecha);
            const alDia = (p.pagoEstado || "Al Día") === "Al Día";

            return `
                <tr>
                    <td data-label="Check (✓)"><button type="button" class="check-btn ${pres ? "checked" : ""}" onclick="toggleAsistenciaPersona(${p.id}, '${fecha}')">✓</button></td>
                    <td data-label="Socio del Gimnasio">
                        <div>
                            <strong style="cursor:pointer; color:var(--cdm-600);" onclick="irAPaginaIndividual(${p.id})">${p.apellido}, ${p.nombre}</strong>
                            <br><small style="color:var(--ink-500)">DNI ${p.dni} • 🔑 ${p.codigoAcceso} • Total: ${p.asistencias.length} asist.</small>
                        </div>
                    </td>
                    <td data-label="Plan / Enfoque"><span class="badge badge-celeste">${p.puesto}</span></td>
                    <td data-label="Semana (7d)"><span class="badge ${fueSem < pac ? "badge-warn" : "badge-ok"}">${fueSem}/${pac} días</span></td>
                    <td data-label="Estado Cuota"><span class="badge ${alDia ? "badge-ok" : "badge-danger"}">${alDia ? "💳 Al Día" : "⚠️ Debe"} ($${Number(p.montoCuota || 25000).toLocaleString("es-AR")})</span></td>
                    <td data-label="Acciones">
                        <div style="display:flex; gap:0.3rem; flex-wrap:wrap; justify-content:flex-end;">
                            <button class="btn ${alDia ? "btn-ghost" : "btn-ok"} btn-sm" onclick="alternarEstadoPago(${p.id})">${alDia ? "Cambiar Estado" : "✓ Cobrar Cuota"}</button>
                            <button class="btn btn-secondary btn-sm" onclick="enviarReciboPagoWhatsApp(${p.id})" title="Enviar Comprobante o Recordatorio por WhatsApp">🧾 Recibo WA</button>
                            ${fueSem < pac ? `<button class="btn btn-warn btn-sm" onclick="enviarAlertaAsistenciaWhatsApp(${p.id})">📲 Aviso Asist.</button>` : ""}
                        </div>
                    </td>
                </tr>
            `;
        }).join("") + `</tbody></table></div>`;

    filtrarPlanillaAsistenciasEnVivo();
    dibujarGraficosColectivosGym();
}

function filtrarPlanillaAsistenciasEnVivo() {
    const texto = (document.getElementById("inputBuscarPlanillaGym")?.value || "").toLowerCase().trim();
    const estado = document.getElementById("filtroEstadoPlanillaGym")?.value || "todos";
    const filas = document.querySelectorAll("#contenedorTablaAsistenciasGym tbody tr");

    filas.forEach(tr => {
        const contenido = tr.innerText.toLowerCase();
        const btnCheck = tr.querySelector(".check-btn");
        const estaPresente = btnCheck && btnCheck.classList.contains("checked");
        const debeCuota = contenido.includes("debe") || contenido.includes("pendiente");
        const bajaFrecuencia = tr.querySelector(".badge-warn") !== null;

        const cumpleTexto = !texto || contenido.includes(texto);
        let cumpleEstado = true;

        if (estado === "presentes") cumpleEstado = estaPresente;
        else if (estado === "ausentes") cumpleEstado = !estaPresente;
        else if (estado === "al_dia") cumpleEstado = !debeCuota;
        else if (estado === "debe") cumpleEstado = debeCuota;
        else if (estado === "baja_frecuencia") cumpleEstado = bajaFrecuencia;

        tr.style.display = (cumpleTexto && cumpleEstado) ? "" : "none";
    });
}

function enviarReciboPagoWhatsApp(idPersona) {
    const p = basePersonas.find(x => x.id === idPersona);
    if (!p) return;
    const tel = (p.whatsapp || "").replace(/\D/g, "");
    const monto = Number(p.montoCuota || 25000).toLocaleString("es-AR");
    const hoy = new Date().toLocaleDateString("es-AR");

    let msg = "";
    if ((p.pagoEstado || "Al Día") === "Al Día") {
        msg = `💙🤍 *COMPROBANTE OFICIAL DE PAGO — CDM ADELIA MARÍA*\n` +
              `----------------------------------\n` +
              `👤 *Socio/a:* ${p.nombre} ${p.apellido} (DNI ${p.dni})\n` +
              `🏋️ *Plan:* ${p.deporte} (${p.puesto})\n` +
              `💳 *Monto Abonado:* $${monto}\n` +
              `📅 *Fecha:* ${hoy}\n` +
              `✅ *Estado:* CUOTA AL DÍA\n` +
              `----------------------------------\n` +
              `_¡Muchas gracias por entrenar en el Club Deportivo Municipal!_`;
    } else {
        msg = `💙🤍 *AVISO ADMINISTRATIVO — CDM ADELIA MARÍA*\n\n` +
              `Hola *${p.nombre}*, te recordamos que figura pendiente de abono la cuota mensual de *${p.deporte}* ($${monto}). Podés regularizarla en recepción en tu próximo entrenamiento. ¡Muchas gracias!`;
    }
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, "_blank");
}

function enviarAlertaAsistenciaWhatsApp(idPersona) {
    const p = basePersonas.find(x => x.id === idPersona);
    if (p) {
        window.open(`https://wa.me/${(p.whatsapp || "").replace(/\D/g, "")}?text=${encodeURIComponent(`💙🤍 *Hola ${p.nombre}, te escribimos del Club Deportivo Municipal Adelia María.*\nEsta semana registraste *${contarAsistenciasUltimos7Dias(p)} de tus ${p.frecuenciaSemanal || 3} días pactados*. ¡Te esperamos para seguir sumando entrenamientos! 💪`)}`, "_blank");
    }
}

function toggleAsistenciaPersona(id, fecha) {
    const p = basePersonas.find(x => x.id === id);
    if (!p) return;
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
    const p = basePersonas.find(x => x.id === id);
    if (!p) return;
    if (p.pagoEstado === "Al Día") {
        p.pagoEstado = "Pendiente";
        mostrarToast(`⚠️ Cuota marcada Pendiente: ${p.apellido}`);
    } else {
        const monto = prompt(`Confirmar monto abonado por ${p.nombre} ${p.apellido}:`, p.montoCuota || 25000);
        if (monto === null) return;
        const medio = prompt(`Medio de pago (Efectivo / Transferencia):`, "Transferencia") || "Efectivo";
        p.montoCuota = parseFloat(monto) || 0;
        p.pagoEstado = "Al Día";
        p.ultimoPagoFecha = obtenerHoyISO();
        if (!Array.isArray(p.historialPagos)) p.historialPagos = [];
        p.historialPagos.push({
            id: Date.now(),
            fecha: p.ultimoPagoFecha,
            monto: p.montoCuota,
            medio: medio.trim()
        });
        mostrarToast(`💳 Pago registrado ($${p.montoCuota.toLocaleString("es-AR")} • ${medio.trim()}) — Vence en 30 días.`);
    }
    guardarDatosCDM();
    renderizarPaginaDeporte();
}

function marcarTodosPresentesGym() {
    const fecha = document.getElementById("fechaAsistenciaGym")?.value || obtenerHoyISO();
    basePersonas.filter(p => p.deporte === "Gimnasio" && p.activo).forEach(p => {
        if (!p.asistencias.includes(fecha)) p.asistencias.push(fecha);
    });
    guardarDatosCDM();
    mostrarToast("✓ Todos marcados presentes en la fecha.");
    renderizarPaginaDeporte();
}

function dibujarGraficosColectivosGym() {
    const canvasEvol = document.getElementById("canvasAsistenciasGym");
    const canvasPagos = document.getElementById("canvasPagosAsistenciaGym");
    if (!canvasEvol || !canvasPagos || typeof Chart === "undefined") return;
    if (chartAsistenciaInstancia) chartAsistenciaInstancia.destroy();
    if (chartPagosInstancia) chartPagosInstancia.destroy();

    const activos = basePersonas.filter(p => p.deporte === "Gimnasio" && p.activo);
    const labels = [], total = [], alDia = [];
    for (let i = 9; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const iso = d.toISOString().split("T")[0];
        labels.push(iso.slice(5));
        const asistieron = activos.filter(p => p.asistencias.includes(iso));
        total.push(asistieron.length);
        alDia.push(asistieron.filter(p => (p.pagoEstado || "Al Día") === "Al Día").length);
    }

    const ctxEvol = canvasEvol.getContext("2d");
    const gradEvol = ctxEvol.createLinearGradient(0, 0, 0, 260);
    gradEvol.addColorStop(0, "rgba(0, 149, 219, 0.32)");
    gradEvol.addColorStop(1, "rgba(0, 149, 219, 0.0)");

    chartAsistenciaInstancia = new Chart(ctxEvol, {
        type: "line",
        data: {
            labels,
            datasets: [
                { label: "Presentes", data: total, borderColor: "#0095db", backgroundColor: gradEvol, borderWidth: 3, fill: true, tension: 0.35 },
                { label: "Con Cuota al Día", data: alDia, borderColor: "#10b981", borderDash: [5, 5], borderWidth: 2, fill: false, tension: 0.35 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });

    const sAlDia = activos.filter(p => (p.pagoEstado || "Al Día") === "Al Día");
    const sPend = activos.filter(p => p.pagoEstado === "Pendiente");
    chartPagosInstancia = new Chart(canvasPagos.getContext("2d"), {
        type: "bar",
        data: {
            labels: ["Cuota Al Día", "Pago Pendiente"],
            datasets: [
                { label: "Socios", data: [sAlDia.length, sPend.length], backgroundColor: ["#0095db", "#f59e0b"], borderRadius: 8 },
                { label: "Asistencias (✓)", data: [sAlDia.reduce((a, p) => a + p.asistencias.length, 0), sPend.reduce((a, p) => a + p.asistencias.length, 0)], backgroundColor: ["#10b981", "#ef4444"], borderRadius: 8 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
}

function poblarSelectsAdminRutinasGym() {
    const selCrear = document.getElementById("adminRutinaPersonaSelect");
    const selFiltro = document.getElementById("filtroPersonaRutinasAdmin");
    if (!selCrear || !selFiltro) return;
    const prevCrear = selCrear.value;
    const prevFiltro = selFiltro.value;
    const CATS = ["Sub 13", "Sub 15", "Sub 17", "Reserva", "Primera"];
    let htmlOpciones = "";

    if (deportePagina && deportePagina !== "Gimnasio") {
        htmlOpciones += `<optgroup label="👥 Categoría Completa (${deportePagina})">`;
        CATS.forEach(c => htmlOpciones += `<option value="CAT|${deportePagina}|${c}" ${c === categoriaActiva ? "selected" : ""}>🏟️ Todo ${deportePagina} ${c}</option>`);
        htmlOpciones += `</optgroup>`;
        const personasDep = obtenerPersonasFiltradasDeporte(true);
        htmlOpciones += `<optgroup label="👤 Jugador Individual (${categoriaActiva})">`;
        personasDep.forEach(p => htmlOpciones += `<option value="${p.id}">👤 ${p.apellido}, ${p.nombre}${p.estadoMedico !== "Óptimo" ? ` [🏥 ${p.estadoMedico}]` : ""}</option>`);
        htmlOpciones += `</optgroup>`;
        selCrear.innerHTML = htmlOpciones;
        selFiltro.innerHTML = `<option value="TODAS">Ver Todas las Rutinas</option>` + personasDep.map(p => `<option value="${p.id}">👤 ${p.apellido}, ${p.nombre}</option>`).join("");
    } else {
        const sociosGym = basePersonas.filter(p => p.deporte === "Gimnasio" && p.activo);
        htmlOpciones += `<optgroup label="👤 Socios Activos del Gimnasio">`;
        sociosGym.forEach(p => htmlOpciones += `<option value="${p.id}">👤 ${p.apellido}, ${p.nombre} (${p.puesto})${p.estadoMedico !== "Óptimo" ? ` [🏥 ${p.estadoMedico}]` : ""}</option>`);
        htmlOpciones += `</optgroup>`;
        htmlOpciones += `<optgroup label="🏋️ Rutinas Generales del Gimnasio (Grupales)">`;
        htmlOpciones += `<option value="CAT|Gimnasio|General">🏋️ Pizarra General del Gimnasio (Todos los Socios)</option>`;
        htmlOpciones += `</optgroup>`;

        selCrear.innerHTML = htmlOpciones;
        selFiltro.innerHTML = `<option value="TODAS">Ver Todas las Rutinas del Gym</option>` + sociosGym.map(p => `<option value="${p.id}">👤 ${p.apellido}, ${p.nombre}</option>`).join("");
    }

    if (prevCrear) selCrear.value = prevCrear;
    if (prevFiltro) selFiltro.value = prevFiltro;
}

function agregarFilaRutinaAdminGym(datos = null) {
    const cont = document.getElementById("contenedorFilasAdminGym");
    if (!cont) return;
    const numOrden = cont.querySelectorAll(".ex-builder-row").length + 1;
    const div = document.createElement("div");
    div.className = "ex-builder-row";
    div.innerHTML = `
        <div class="ex-builder-top">
            <span class="ex-builder-num">#${numOrden}</span>
            <div class="field" style="flex:1;">
                <input type="text" class="ag-nombre" list="listaEjerciciosGymAdmin" required placeholder="Nombre del ejercicio (Ej: Sentadilla Trasera)" value="${datos?.nombre || ""}">
            </div>
            <button type="button" class="btn btn-danger btn-sm ex-builder-del" onclick="this.closest('.ex-builder-row').remove()" title="Quitar ejercicio">✕</button>
        </div>
        <div class="ex-builder-metrics-grid">
            <div class="field"><label>Series</label><input type="number" class="ag-series" required min="1" max="20" value="${datos?.series || 4}"></div>
            <div class="field"><label>Reps / Tiempo</label><input type="text" class="ag-reps" required placeholder="8-10" value="${datos?.reps || "8-10"}"></div>
            <div class="field"><label>Carga / Peso</label><input type="text" class="ag-peso" placeholder="Ej: 70kg / 80%" value="${datos?.peso || ""}"></div>
            <div class="field"><label>Pausa</label><input type="text" class="ag-pausa" placeholder="90s" value="${datos?.pausa || "90s"}"></div>
        </div>
        <div class="field" style="margin-top:0.45rem;">
            <input type="text" class="ag-forma" placeholder="💡 Indicación técnica opcional (ej: Controlar bajada 3 seg)..." value="${datos?.forma || ""}">
        </div>
    `;
    cont.appendChild(div);
}

function cargarPlantillaAdminGym(tipo) {
    const cont = document.getElementById("contenedorFilasAdminGym");
    if (!cont) return;
    cont.innerHTML = "";
    if (tipo === "hipertrofia") {
        document.getElementById("adminRutinaNombre").value = "Tren Superior - Fuerza e Hipertrofia";
        document.getElementById("adminRutinaObjetivo").value = "Hipertrofia Estructural";
        agregarFilaRutinaAdminGym({ nombre: "Press de Banca Plano", series: 4, reps: "8", peso: "Pesado", pausa: "2m", forma: "Controlar bajada." });
        agregarFilaRutinaAdminGym({ nombre: "Dominadas / Jalón al Pecho en Polea", series: 4, reps: "8-10", peso: "Lastre", pausa: "90s", forma: "Rango completo." });
    } else if (tipo === "piernas") {
        document.getElementById("adminRutinaNombre").value = "Tren Inferior - Fuerza y Potencia";
        document.getElementById("adminRutinaObjetivo").value = "Fuerza Máxima";
        agregarFilaRutinaAdminGym({ nombre: "Sentadilla Trasera con Barra", series: 4, reps: "5", peso: "80% 1RM", pausa: "2m", forma: "Subir explosivo." });
        agregarFilaRutinaAdminGym({ nombre: "Peso Muerto Rumano (Isquios y Glúteos)", series: 4, reps: "8", peso: "Controlado", pausa: "90s", forma: "Cuidar espalda." });
    } else if (tipo === "rehab") {
        document.getElementById("adminRutinaNombre").value = "Readaptación y Prevención";
        document.getElementById("adminRutinaObjetivo").value = "Rehabilitación / Lesión";
        agregarFilaRutinaAdminGym({ nombre: "Protocolo Isométrico y Estabilidad de Rodilla", series: 4, reps: "30s", peso: "Sin dolor", pausa: "60s", forma: "Estabilidad." });
        agregarFilaRutinaAdminGym({ nombre: "Hip Thrust con Barra (Empuje de Cadera)", series: 3, reps: "12", peso: "Moderado", pausa: "60s", forma: "Control pélvico." });
    } else {
        document.getElementById("adminRutinaNombre").value = "Circuito Funcional y Core";
        document.getElementById("adminRutinaObjetivo").value = "Funcional y Core";
        agregarFilaRutinaAdminGym({ nombre: "Plancha Abdominal RKC y Core Antirotacional", series: 4, reps: "35s", peso: "Peso Corp.", pausa: "45s", forma: "Abdomen firme." });
        agregarFilaRutinaAdminGym({ nombre: "Sentadilla Búlgara Unilateral", series: 3, reps: "10 c/pierna", peso: "Mancuerna", pausa: "60s", forma: "Fluido." });
    }
}

function guardarRutinaDesdeAdminGym(e) {
    e.preventDefault();
    const valDestino = document.getElementById("adminRutinaPersonaSelect").value;
    const filas = document.querySelectorAll("#contenedorFilasAdminGym .ex-builder-row");
    if (!valDestino || filas.length === 0) return;
    const ejercicios = [];
    filas.forEach(f => {
        const nomEj = f.querySelector(".ag-nombre").value.trim();
        const nomCanonico = agregarEjercicioInventadoAlCatalogoCDM(nomEj, "fuerza_1rm", true) || nomEj;
        ejercicios.push({
            nombre: nomCanonico,
            series: f.querySelector(".ag-series").value,
            reps: f.querySelector(".ag-reps").value.trim(),
            peso: f.querySelector(".ag-peso").value.trim() || "A ajustar",
            pausa: f.querySelector(".ag-pausa").value.trim(),
            forma: f.querySelector(".ag-forma").value.trim()
        });
    });

    const baseRutina = {
        id: Date.now(),
        fecha: new Date().toLocaleDateString("es-AR"),
        nombre: document.getElementById("adminRutinaNombre").value.trim(),
        objetivo: document.getElementById("adminRutinaObjetivo").value,
        dias: document.getElementById("adminRutinaDias").value.trim() || "Semanal",
        notas: document.getElementById("adminRutinaNotas").value.trim(),
        ejercicios
    };

    if (valDestino.startsWith("CAT|")) {
        const [, depCat, nomCat] = valDestino.split("|");
        baseRutinas.unshift({ ...baseRutina, esGrupal: true, deporteDestino: depCat, categoriaDestino: nomCat, personaId: null, etiquetaDestino: depCat === "Gimnasio" ? `🏋️ Pizarra General Gym` : `🏟️ Plantel ${depCat} ${nomCat}` });
        mostrarToast(`✓ Rutina grupal guardada.`);
    } else {
        const p = basePersonas.find(x => x.id === parseInt(valDestino));
        if (!p) return;
        baseRutinas.unshift({ ...baseRutina, esGrupal: false, deporteDestino: p.deporte, categoriaDestino: p.categoria, personaId: p.id, etiquetaDestino: `👤 ${p.nombre} ${p.apellido}` });
        mostrarToast(`✓ Rutina guardada para ${p.nombre}`);
    }
    guardarDatosCDM();
    e.target.reset();
    document.getElementById("contenedorFilasAdminGym").innerHTML = "";
    agregarFilaRutinaAdminGym();
    renderizarPaginaDeporte();
}

function asegurarModalVideoEnPaginaActualCDM() {
    if (!document.getElementById("modalVideoEjercicio")) {
        const mv = document.createElement("div");
        mv.id = "modalVideoEjercicio";
        mv.className = "modal-backdrop hidden";
        document.body.appendChild(mv);
    }
}

function obtenerClaseGradienteRutinaCDM(objetivo = "") {
    const obj = String(objetivo).toLowerCase();
    if (obj.includes("potencia")) return "routine-theme-potencia";
    if (obj.includes("hipertrofia")) return "routine-theme-hipertrofia";
    if (obj.includes("rehab") || obj.includes("funcional") || obj.includes("movilidad")) return "routine-theme-funcional";
    return "routine-theme-fuerza";
}

function renderTarjetaRutinaProAdmin(r) {
    asegurarVideotecaCargada();
    asegurarModalVideoEnPaginaActualCDM();
    const totalSeries = (r.ejercicios || []).reduce((acc, ex) => acc + (parseInt(ex.series) || 0), 0);
    const claseTema = obtenerClaseGradienteRutinaCDM(r.objetivo);

    const ejerciciosHTML = (r.ejercicios || []).map((ex, i) => {
        const matchVideo = (baseVideoteca || []).find(v =>
            v.nombre.toLowerCase().includes((ex.nombre || "").toLowerCase()) ||
            (ex.nombre || "").toLowerCase().includes(v.nombre.toLowerCase())
        );
        const thumbHTML = matchVideo
            ? `<div class="routine-ex-thumb" onclick="abrirModalReproductorEjercicio(${matchVideo.id})" title="Ver video demostrativo de ${ex.nombre}">
                   <img src="${matchVideo.imagenPreview}" alt="${ex.nombre}">
                   <span class="routine-ex-play"><i class="ri-play-fill"></i></span>
               </div>`
            : `<div class="routine-ex-num">${String(i + 1).padStart(2, "0")}</div>`;

        const formaLimpia = ex.forma ? ex.forma.replace(/\(Video:.*?\)/gi, "").trim() : "";

        return `
            <div class="routine-pro-ex-item">
                ${thumbHTML}
                <div class="routine-pro-ex-body">
                    <div class="routine-pro-ex-title-row">
                        <strong>${i + 1}. ${ex.nombre}</strong>
                        ${matchVideo ? `<button type="button" class="routine-video-mini-btn" onclick="abrirModalReproductorEjercicio(${matchVideo.id})"><i class="ri-play-circle-fill"></i> Video</button>` : ""}
                    </div>
                    <div class="routine-pro-ex-pills">
                        <span class="r-pill r-pill-series"><i class="ri-repeat-line"></i> ${ex.series} series × ${ex.reps}</span>
                        <span class="r-pill r-pill-carga"><i class="ri-scales-3-line"></i> ${ex.peso || "A ajustar"}</span>
                        <span class="r-pill r-pill-pausa"><i class="ri-timer-line"></i> Pausa ${ex.pausa || "90s"}</span>
                    </div>
                    ${formaLimpia ? `<div class="routine-pro-ex-cue">💡 ${formaLimpia}</div>` : ""}
                </div>
            </div>
        `;
    }).join("");

    return `
        <div class="routine-pro-card">
            <div class="routine-pro-header ${claseTema}">
                <div class="routine-pro-header-top">
                    <div style="display:flex; gap:0.4rem; flex-wrap:wrap; align-items:center;">
                        <span class="routine-dest-badge">${r.etiquetaDestino || (r.esGrupal ? "🏟️ Plan Grupal" : "👤 Plan Individual")}</span>
                        <span class="routine-vol-badge">🔥 ${(r.ejercicios || []).length} Ejerc. • ${totalSeries} Series</span>
                    </div>
                    <button type="button" class="routine-del-btn" onclick="borrarRutinaGlobal(${r.id})" title="Eliminar rutina">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
                <h4 class="routine-pro-title">${r.nombre}</h4>
                <div class="routine-pro-meta">
                    <span>🎯 ${r.objetivo}</span>
                    <span>•</span>
                    <span>🗓️ ${r.dias || "Semanal"}</span>
                </div>
            </div>

            <div class="routine-pro-ex-list">
                ${ejerciciosHTML}
            </div>

            ${r.notas ? `<div class="routine-pro-coach-note"><i class="ri-chat-smile-3-line"></i> <div><b>Nota del Profe:</b> ${r.notas}</div></div>` : ""}

            <div class="routine-pro-footer">
                <button type="button" class="btn btn-whatsapp btn-sm" style="flex:1;" onclick="enviarWhatsAppRutinaDirecto(${r.id})">
                    <i class="ri-whatsapp-line"></i> Enviar WhatsApp (Con Videos)
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="copiarRutinaPortapapeles(${r.id})" title="Copiar rutina lista para pegar en WhatsApp">
                    <i class="ri-file-copy-line"></i> Copiar
                </button>
                <button type="button" class="btn btn-ghost btn-sm" onclick="enviarWhatsAppAEncargado(${r.id})" title="Enviar a otro número de teléfono">
                    <i class="ri-share-forward-line"></i> Otro N°
                </button>
            </div>
        </div>
    `;
}

function renderizarListaRutinasAdminGym() {
    const cont = document.getElementById("contenedorTarjetasRutinasAdminGym");
    if (!cont) return;
    cont.className = "routines-pro-grid";
    const fId = document.getElementById("filtroPersonaRutinasAdmin")?.value || "TODAS";
    let lista = [...baseRutinas];

    if (deportePagina && deportePagina !== "Gimnasio") {
        lista = lista.filter(r => r.deporteDestino === deportePagina && r.categoriaDestino === categoriaActiva);
    } else if (deportePagina === "Gimnasio") {
        lista = lista.filter(r => r.deporteDestino === "Gimnasio");
    }

    if (fId !== "TODAS") {
        const per = basePersonas.find(p => String(p.id) === String(fId));
        lista = lista.filter(r => String(r.personaId) === String(fId) || (r.esGrupal && per && r.deporteDestino === per.deporte && r.categoriaDestino === per.categoria));
    }

    if (lista.length === 0) {
        cont.innerHTML = `<div class="empty-box" style="grid-column:1/-1;">No hay rutinas cargadas en esta sección. Usá el panel izquierdo para crear una o cargar una plantilla rápida.</div>`;
        return;
    }

    cont.innerHTML = lista.map(r => renderTarjetaRutinaProAdmin(r)).join("");
}

function armarMensajeWhatsAppRutina(r, dest) {
    asegurarVideotecaCargada();
    let msg = `💙🤍 *CLUB DEPORTIVO MUNICIPAL (CDM)*\n📌 *Para:* ${dest}\n🏋️ *Rutina:* ${r.nombre} (${r.objetivo})\n🗓️ *Días:* ${r.dias}\n----------------------------------\n\n`;
    r.ejercicios.forEach((ex, i) => {
        const matchVideo = baseVideoteca.find(v => v.nombre.toLowerCase().includes(ex.nombre.toLowerCase()) || ex.nombre.toLowerCase().includes(v.nombre.toLowerCase()));
        msg += `*${i + 1}. ${ex.nombre.toUpperCase()}*\n   • ${ex.series} series x ${ex.reps} | Carga: ${ex.peso} | Pausa: ${ex.pausa}\n`;
        if (ex.forma) msg += `   💡 _${ex.forma}_\n`;
        if (matchVideo && (!ex.forma || !ex.forma.includes("http"))) {
            msg += `   🎥 _Video técnica:_ ${matchVideo.videoUrl}\n`;
        }
        msg += `\n`;
    });
    if (r.notas) msg += `📝 *Nota:* ${r.notas}\n`;
    return msg;
}

function copiarRutinaPortapapeles(idRutina) {
    const r = baseRutinas.find(x => x.id === idRutina);
    if (!r) return;
    const msg = armarMensajeWhatsAppRutina(r, r.etiquetaDestino || "Socio CDM");
    navigator.clipboard.writeText(msg).then(() => {
        mostrarToast("📋 Rutina (con links de video) copiada al portapapeles.");
    });
}

function enviarWhatsAppRutinaDirecto(idRutina) {
    const r = baseRutinas.find(x => x.id === idRutina);
    if (!r) return;
    if (!r.esGrupal && r.personaId) {
        const p = basePersonas.find(x => x.id === r.personaId);
        if (p) window.open(`https://wa.me/${(p.whatsapp || "").replace(/\D/g, "")}?text=${encodeURIComponent(armarMensajeWhatsAppRutina(r, `${p.nombre} ${p.apellido}`))}`, "_blank");
    } else {
        enviarWhatsAppAEncargado(idRutina);
    }
}

function enviarWhatsAppAEncargado(idRutina) {
    const r = baseRutinas.find(x => x.id === idRutina);
    if (!r) return;
    const tel = prompt(`WhatsApp del Destinatario (ej: 5493584...):`, "549");
    if (tel) window.open(`https://wa.me/${tel.replace(/\D/g, "")}?text=${encodeURIComponent(armarMensajeWhatsAppRutina(r, r.etiquetaDestino || "Socio CDM"))}`, "_blank");
}

function borrarRutinaGlobal(idRutina) {
    if (confirm("¿Eliminar rutina?")) {
        baseRutinas = baseRutinas.filter(x => x.id !== idRutina);
        guardarDatosCDM();
        if (deportePagina) renderizarPaginaDeporte();
        if (document.body.dataset.page === "perfil-individual") inicializarPaginaJugadorIndividual();
    }
}

// =========================================================================
// 9. MODAL DE ALTA Y EDICIÓN DE PERSONA (CON PILARES 1-10 PARA DEPORTES)
// =========================================================================

function construirHTMLModal() {
    const modal = document.getElementById("modalPersona");
    if (!modal) return;
    modal.innerHTML = `
        <div class="modal-window">
            <div class="modal-top">
                <h3 id="tituloModal" style="color:var(--ink-900);">Ficha de Deportista / Socio</h3>
                <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalPersona()">✕</button>
            </div>
            <form id="formPersonaCDM" onsubmit="guardarPersonaCDM(event)">
                <input type="hidden" id="pId">
                <input type="hidden" id="pFotoData">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap; background:var(--surface-subtle); border:1px solid var(--line-strong); padding:0.75rem 1rem; border-radius:16px; margin-bottom:0.85rem;">
                    <div style="display:flex; align-items:center; gap:0.85rem;">
                        <div id="previewAvatarModalPersona" class="ath-avatar has-photo" style="width:58px; height:58px; border-radius:16px; font-size:1.25rem;">
                            <span>👤</span>
                        </div>
                        <div>
                            <strong style="font-size:0.86rem; color:var(--ink-900); display:block;">📷 Foto de la Persona (Opcional)</strong>
                            <small style="color:var(--ink-500); font-size:0.74rem;">Subí una imagen desde tu dispositivo o cambiala cuando quieras.</small>
                        </div>
                    </div>
                    <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                        <label class="btn btn-secondary btn-sm" style="cursor:pointer;">
                            <i class="ri-upload-2-line"></i> Subir / Cambiar Foto
                            <input type="file" accept="image/*" onchange="cargarFotoEnModalPersonaCDM(event)" style="display:none;">
                        </label>
                        <button type="button" id="btnQuitarFotoModalPersona" class="btn btn-danger btn-sm hidden" onclick="quitarFotoEnModalPersonaCDM()">
                            <i class="ri-delete-bin-line"></i> Quitar
                        </button>
                    </div>
                </div>
                <div class="grid-3" style="margin-bottom:0.75rem;">
                    <div class="field">
                        <label>Área *</label>
                        <select id="pDeporte" required>
                            <option value="Futbol">⚽ Fútbol</option>
                            <option value="Hockey">🏑 Hockey</option>
                            <option value="Gimnasio">🏋️ Gimnasio</option>
                        </select>
                    </div>
                    <div class="field" id="wrapPCategoria">
                        <label>Categoría *</label>
                        <select id="pCategoria">
                            <option value="Sub 13">Sub 13</option>
                            <option value="Sub 15">Sub 15</option>
                            <option value="Sub 17">Sub 17</option>
                            <option value="Reserva">Reserva</option>
                            <option value="Primera">Primera</option>
                        </select>
                    </div>
                    <div class="field">
                        <label>Puesto / Plan de Gym *</label>
                        <input type="text" id="pPuesto" list="listaPuestosSugeridosModal" required placeholder="Elegí o escribí el puesto/plan">
                        <datalist id="listaPuestosSugeridosModal">
                            <option value="Musculación e Hipertrofia">
                            <option value="Fuerza y Potencia">
                            <option value="Funcional, Core y Salud">
                            <option value="Readaptación y Rehabilitación">
                            <option value="Arquero / Arquera">
                            <option value="Marcador Central / Stopper">
                            <option value="Líbero / Cierre">
                            <option value="Lateral / Half Derecho">
                            <option value="Lateral / Half Izquierdo">
                            <option value="Volante Central / Cinco">
                            <option value="Interior / Enganche">
                            <option value="Extremo / Wing Derecho">
                            <option value="Extremo / Wing Izquierdo">
                            <option value="Centrodelantero / Centroforward">
                        </datalist>
                    </div>
                </div>

                <div class="grid-3" style="margin-bottom:0.75rem;">
                    <div class="field"><label>Nombre *</label><input type="text" id="pNombre" required></div>
                    <div class="field"><label>Apellido *</label><input type="text" id="pApellido" required></div>
                    <div class="field"><label>DNI *</label><input type="text" id="pDni" required></div>
                </div>

                <div class="grid-3" style="margin-bottom:0.75rem;">
                    <div class="field"><label>WhatsApp *</label><input type="tel" id="pWhatsapp" required placeholder="5493584..."></div>
                    <div class="field"><label>Edad *</label><input type="number" id="pEdad" required min="5" max="85" value="18"></div>
                    <div class="field">
                        <label>Sangre</label>
                        <select id="pSangre">
                            <option value="0+">0+</option><option value="0-">0-</option>
                            <option value="A+">A+</option><option value="A-">A-</option>
                            <option value="B+">B+</option><option value="B-">B-</option>
                            <option value="AB+">AB+</option><option value="AB-">AB-</option>
                        </select>
                    </div>
                </div>

                <div class="grid-4" style="margin-bottom:0.75rem;">
                    <div class="field"><label>Peso (kg) *</label><input type="number" step="0.1" id="pPeso" required value="70"></div>
                    <div class="field"><label>Altura (cm) *</label><input type="number" id="pAltura" required value="172"></div>
                    <div class="field">
                        <label>Pierna</label>
                        <select id="pPierna"><option value="Derecha">Derecha</option><option value="Izquierda">Izquierda</option><option value="Ambidiestro">Ambidiestro</option></select>
                    </div>
                    <div class="field">
                        <label>Brazo</label>
                        <select id="pBrazo"><option value="Derecho">Derecho</option><option value="Izquierdo">Izquierdo</option><option value="Ambidiestro">Ambidiestro</option></select>
                    </div>
                </div>

                <!-- BLOQUE DE SCORE 1 A 10 EXCLUSIVO PARA DEPORTES (CONTROL DEL ADMIN) -->
                <div id="wrapPScoreDeporte" style="margin-bottom:0.75rem; background:var(--surface-subtle); border:1px solid var(--line-celeste); padding:0.75rem; border-radius:10px;">
                    <small style="display:block; font-weight:800; color:var(--cdm-600); margin-bottom:0.45rem;">⭐ CALIFICACIÓN DEL ADMIN / PROFE (ESCALA 1 A 10 — SOLO DEPORTES)</small>
                    <div class="grid-4">
                        <div class="field"><label>Físico (1-10)</label><input type="number" step="0.1" min="1" max="10" id="pScoreFisico" value="7.0"></div>
                        <div class="field"><label>Gym (1-10)</label><input type="number" step="0.1" min="1" max="10" id="pScoreGym" value="7.0"></div>
                        <div class="field"><label>Técnico (1-10)</label><input type="number" step="0.1" min="1" max="10" id="pScoreTecnico" value="7.0"></div>
                        <div class="field"><label>Actitud (1-10)</label><input type="number" step="0.1" min="1" max="10" id="pScoreActitud" value="7.5"></div>
                    </div>
                </div>

                <div class="grid-4" style="margin-bottom:1.1rem; background:var(--cdm-50); padding:0.75rem; border-radius:10px;">
                    <div class="field">
                        <label>Días x Semana</label>
                        <select id="pFrecuencia">
                            <option value="2">2 días</option>
                            <option value="3" selected>3 días</option>
                            <option value="4">4 días</option>
                            <option value="5">5 días</option>
                        </select>
                    </div>
                    <div class="field">
                        <label>Salud</label>
                        <select id="pEstadoMedico">
                            <option value="Óptimo">🟢 Óptimo</option>
                            <option value="Sobrecarga / Precaución">🟡 Precaución</option>
                            <option value="Lesionado (Rehabilitación)">🔴 Lesionado</option>
                        </select>
                    </div>
                    <div class="field">
                        <label>Cuota</label>
                        <select id="pPagoEstado">
                            <option value="Al Día">💳 Al Día</option>
                            <option value="Pendiente">⚠️ Pendiente</option>
                        </select>
                    </div>
                    <div class="field">
                        <label>Monto ($)</label>
                        <input type="number" id="pMontoCuota" value="25000">
                    </div>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                    <button type="button" class="btn btn-ghost" onclick="cerrarModalPersona()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar</button>
                </div>
            </form>
        </div>
    `;
}

function actualizarVisibilidadCamposDeporteModal() {
    const esGym = document.getElementById("pDeporte")?.value === "Gimnasio";
    document.getElementById("wrapPCategoria")?.classList.toggle("hidden", esGym);
    document.getElementById("wrapPScoreDeporte")?.classList.toggle("hidden", esGym);
}

function abrirModalPersona(idEditar = null) {
    construirHTMLModal();
    const modal = document.getElementById("modalPersona");

    // Inyectar deportes extra configurados en el select #pDeporte
    const selDepGlobal = document.getElementById("pDeporte");
    let modGlobal = { futbol: true, hockey: true, gym: true };
    let deportesExtraGlobal = [];
    try {
        const lic = JSON.parse(localStorage.getItem("cdm_licencia_config_v1") || "null");
        if (lic && lic.modulos) modGlobal = { ...modGlobal, ...lic.modulos };
        if (lic && Array.isArray(lic.deportesExtra)) deportesExtraGlobal = lic.deportesExtra;
    } catch {}
    if (selDepGlobal) {
        deportesExtraGlobal.forEach(depRaw => {
            const limpio = String(depRaw || "").replace(/^[^\w\sÁÉÍÓÚáéíóúÑñ]+\s*/, "").trim() || depRaw;
            if (!Array.from(selDepGlobal.options).some(o => o.value === limpio)) {
                const opt = document.createElement("option");
                opt.value = limpio;
                opt.textContent = depRaw;
                selDepGlobal.appendChild(opt);
            }
        });
        if (deportePagina && !Array.from(selDepGlobal.options).some(o => o.value === deportePagina)) {
            const optActual = document.createElement("option");
            optActual.value = deportePagina;
            optActual.textContent = `🏆 ${deportePagina}`;
            selDepGlobal.appendChild(optActual);
        }
    }

    if (idEditar) {
        const p = basePersonas.find(x => x.id === idEditar);
        if (!p) return;
        asegurarPilaresPersona(p);
        document.getElementById("tituloModal").innerText = `Editar: ${p.nombre} ${p.apellido}`;
        document.getElementById("pId").value = p.id;
        if (selDepGlobal && p.deporte && !Array.from(selDepGlobal.options).some(o => o.value === p.deporte)) {
            const optP = document.createElement("option"); optP.value = p.deporte; optP.textContent = p.deporte; selDepGlobal.appendChild(optP);
        }
        document.getElementById("pDeporte").value = p.deporte;
        document.getElementById("pCategoria").value = p.categoria || "Primera";
        document.getElementById("pPuesto").value = p.puesto;
        document.getElementById("pNombre").value = p.nombre;
        document.getElementById("pApellido").value = p.apellido;
        document.getElementById("pDni").value = p.dni;
        document.getElementById("pWhatsapp").value = p.whatsapp;
        document.getElementById("pEdad").value = p.edad;
        document.getElementById("pSangre").value = p.sangre;
        document.getElementById("pPeso").value = p.peso;
        document.getElementById("pAltura").value = p.altura;
        document.getElementById("pPierna").value = p.pierna;
        document.getElementById("pBrazo").value = p.brazo;
        document.getElementById("pFrecuencia").value = p.frecuenciaSemanal || 3;
        document.getElementById("pEstadoMedico").value = p.estadoMedico || "Óptimo";
        document.getElementById("pPagoEstado").value = p.pagoEstado || "Al Día";
        document.getElementById("pMontoCuota").value = p.montoCuota !== undefined ? p.montoCuota : 25000;
        document.getElementById("pFotoData").value = p.foto || "";
        actualizarPreviewFotoModalPersonaCDM(p.foto || "", obtenerInicialesPersonaCDM(p));

        if (p.deporte !== "Gimnasio" && p.pilares) {
            document.getElementById("pScoreFisico").value = p.pilares.fisico;
            document.getElementById("pScoreGym").value = p.pilares.gym;
            document.getElementById("pScoreTecnico").value = p.pilares.tecnico;
            document.getElementById("pScoreActitud").value = p.pilares.actitud;
        }
    } else {
        document.getElementById("pId").value = "";
        document.getElementById("pFotoData").value = "";
        actualizarPreviewFotoModalPersonaCDM("", "👤");
        let mod = { futbol: true, hockey: true, gym: true };
        try {
            const lic = JSON.parse(localStorage.getItem("cdm_licencia_config_v1") || "null");
            if (lic && lic.modulos) mod = { ...mod, ...lic.modulos };
        } catch {}
        const selDep = document.getElementById("pDeporte");
        if (selDep) {
            Array.from(selDep.options).forEach(opt => {
                if (opt.value === "Futbol") opt.hidden = !mod.futbol;
                if (opt.value === "Hockey") opt.hidden = !mod.hockey;
                if (opt.value === "Gimnasio") opt.hidden = !mod.gym;
            });
        }
        const depDefecto = deportePagina || (mod.futbol ? "Futbol" : (mod.gym ? "Gimnasio" : "Hockey"));
        document.getElementById("pDeporte").value = depDefecto;
        document.getElementById("pCategoria").value = categoriaActiva;
    }

    actualizarVisibilidadCamposDeporteModal();
    document.getElementById("pDeporte").onchange = actualizarVisibilidadCamposDeporteModal;

    modal.classList.remove("hidden");
}

function actualizarPreviewFotoModalPersonaCDM(fotoData, iniciales = "👤") {
    const prev = document.getElementById("previewAvatarModalPersona");
    const btnQuitar = document.getElementById("btnQuitarFotoModalPersona");
    if (prev) {
        prev.innerHTML = fotoData
            ? `<img src="${fotoData}" alt="Preview" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`
            : `<span>${iniciales}</span>`;
    }
    if (btnQuitar) {
        btnQuitar.classList.toggle("hidden", !fotoData);
    }
}

function cargarFotoEnModalPersonaCDM(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    comprimirImagenArchivoCDM(file, 320, 0.84, (dataUrl) => {
        const inp = document.getElementById("pFotoData");
        if (inp) inp.value = dataUrl;
        actualizarPreviewFotoModalPersonaCDM(dataUrl);
        mostrarToast("📷 Foto cargada en el formulario.");
    });
}

function quitarFotoEnModalPersonaCDM() {
    const inp = document.getElementById("pFotoData");
    if (inp) inp.value = "";
    actualizarPreviewFotoModalPersonaCDM("", "👤");
}

function cerrarModalPersona() {
    document.getElementById("modalPersona")?.classList.add("hidden");
}

function guardarPersonaCDM(e) {
    e.preventDefault();
    const idEdit = document.getElementById("pId").value;
    const dep = document.getElementById("pDeporte").value;
    const cat = dep === "Gimnasio" ? "General" : document.getElementById("pCategoria").value;
    const peso = parseFloat(document.getElementById("pPeso").value);
    const hoy = obtenerHoyISO();

    const pilaresAdmin = dep === "Gimnasio" ? null : {
        fisico: normalizarNota1a10(document.getElementById("pScoreFisico")?.value, 7.0),
        gym: normalizarNota1a10(document.getElementById("pScoreGym")?.value, 7.0),
        tecnico: normalizarNota1a10(document.getElementById("pScoreTecnico")?.value, 7.0),
        actitud: normalizarNota1a10(document.getElementById("pScoreActitud")?.value, 7.5),
        bonus: 0
    };

    const datosComunes = {
        deporte: dep,
        categoria: cat,
        puesto: document.getElementById("pPuesto").value.trim(),
        nombre: document.getElementById("pNombre").value.trim(),
        apellido: document.getElementById("pApellido").value.trim(),
        dni: document.getElementById("pDni").value.trim(),
        whatsapp: document.getElementById("pWhatsapp").value.trim(),
        edad: parseInt(document.getElementById("pEdad").value),
        sangre: document.getElementById("pSangre").value,
        peso: peso,
        altura: parseInt(document.getElementById("pAltura").value),
        pierna: document.getElementById("pPierna").value,
        brazo: document.getElementById("pBrazo").value,
        frecuenciaSemanal: parseInt(document.getElementById("pFrecuencia").value) || 3,
        estadoMedico: document.getElementById("pEstadoMedico").value,
        pagoEstado: document.getElementById("pPagoEstado").value,
        montoCuota: parseFloat(document.getElementById("pMontoCuota").value) || 0,
        foto: document.getElementById("pFotoData")?.value || null
    };

    if (idEdit) {
        const p = basePersonas.find(x => x.id == idEdit);
        if (p) {
            Object.assign(p, datosComunes);
            if (dep !== "Gimnasio" && pilaresAdmin) {
                p.pilares = { ...pilaresAdmin, bonus: p.pilares?.bonus || 0 };
                recalcularPuntajePonderado(p);
            } else {
                p.puntosCategoria = null;
            }
        }
        mostrarToast(`✏️ Ficha actualizada`);
    } else {
        const nuevaPersona = {
            id: Date.now(),
            ...datosComunes,
            activo: true,
            pilares: pilaresAdmin,
            puntosCategoria: dep === "Gimnasio" ? null : 7.1,
            motivoPuntos: "Calificación inicial del Admin",
            asistencias: [hoy],
            evaluaciones: [],
            clinico: [{ id: Date.now() + 1, fecha: hoy, peso: peso, rpe: 5, sueno: 5, dolor: "Sin dolor" }]
        };
        asegurarPilaresPersona(nuevaPersona);
        basePersonas.push(nuevaPersona);
        mostrarToast(`✓ Persona registrada en ${dep}`);
    }

    guardarDatosCDM();
    cerrarModalPersona();

    if (document.body.dataset.page === "perfil-individual") {
        inicializarPaginaJugadorIndividual();
    } else {
        if (dep !== "Gimnasio") seleccionarCategoriaDeporte(cat);
        else renderizarPaginaDeporte();
    }
}

function eliminarPersonaDefinitivo(id) {
    const p = basePersonas.find(x => x.id === id);
    if (!p) return;
    if (!confirm(`¿Eliminar a ${p.nombre} ${p.apellido}?`)) return;
    basePersonas = basePersonas.filter(x => x.id !== id);
    guardarDatosCDM();
    renderizarPaginaDeporte();
}

// =========================================================================
// 10. EXPEDIENTE INDIVIDUAL (JUGADOR.HTML) + RADAR 1 A 10 + CALCULADORA 1RM
// =========================================================================

function obtenerJugadorActualPorURL() {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("id"));
    return basePersonas.find(x => x.id === id);
}

function inicializarPaginaJugadorIndividual() {
    const p = obtenerJugadorActualPorURL();
    const contCabecera = document.getElementById("fichaCabeceraJugador");
    if (!contCabecera) return;

    if (!p) {
        contCabecera.innerHTML = `<div class="empty-box"><h3>Persona no encontrada</h3><a href="index.html" class="btn btn-primary btn-sm">Volver</a></div>`;
        return;
    }

    asegurarPilaresPersona(p);

    sincronizarSidebarActivoCDM(p.deporte);
    const mapaUrl = { Futbol: "futbol.html", Hockey: "hockey.html", Gimnasio: "gym.html" };
    document.getElementById("btnVolverDeporte").href = mapaUrl[p.deporte] || (p.deporte ? `futbol.html?deporte=${encodeURIComponent(p.deporte)}` : "index.html");
    document.getElementById("subtituloHeaderJugador").innerText = `${p.nombre} ${p.apellido} • ${p.deporte}`;

    const hoy = obtenerHoyISO();
    document.getElementById("evFecha").value = hoy;
    document.getElementById("medFecha").value = hoy;

    const iniciales = `${p.nombre.charAt(0)}${p.apellido.charAt(0)}`.toUpperCase();
    const presenteHoy = p.asistencias.includes(hoy);
    const fueSem = contarAsistenciasUltimos7Dias(p);
    const pactado = p.frecuenciaSemanal || 3;

    const alturaM = (p.altura || 170) / 100;
    const imc = ((p.peso || 70) / (alturaM * alturaM)).toFixed(1);

    const companeros = basePersonas.filter(x => x.activo && x.deporte === p.deporte && x.categoria === p.categoria);
    const opcionesCompaneros = companeros.map(c => `<option value="${c.id}" ${c.id === p.id ? "selected" : ""}>🔄 Ir a: ${c.apellido}, ${c.nombre}</option>`).join("");

    contCabecera.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
            <div style="display:flex; align-items:center; gap:1rem;">
                ${renderAvatarPersonaCDM(p, 68, "1.35rem", true)}
                <div>
                    <div style="display:flex; gap:0.35rem; flex-wrap:wrap; margin-bottom:0.25rem;">
                        <span class="badge badge-celeste">${p.deporte} • ${p.deporte === "Gimnasio" ? "Socio Gym" : p.categoria}</span>
                        ${p.deporte !== "Gimnasio" ? `<span class="badge badge-purple" style="cursor:pointer;" onclick="calificarJugadorRapidoPrompt(${p.id})" title="Tocá para cambiar el Score (1 a 10)">⭐ Score: ${p.puntosCategoria} / 10</span>` : ""}
                        <span class="badge ${fueSem < pactado ? "badge-warn" : "badge-ok"}">📅 Semana: ${fueSem}/${pactado} días</span>
                        <span class="badge badge-celeste">⚖️ IMC: ${imc}</span>
                        <span class="badge ${p.estadoMedico && p.estadoMedico !== "Óptimo" ? "badge-danger" : "badge-ok"}">🏥 ${p.estadoMedico || "Óptimo"}</span>
                    </div>
                    <h2 style="font-size:1.35rem; font-weight:900;">${p.nombre} ${p.apellido}</h2>
                    <small style="color:var(--ink-500); font-weight:700;">
                        ${p.puesto} • ${p.peso} kg / ${p.altura} cm • Sangre ${p.sangre} • 📱 ${p.whatsapp}
                    </small>
                </div>
            </div>

            <div style="display:flex; gap:0.45rem; align-items:center; flex-wrap:wrap;">
                <select onchange="irAPaginaIndividual(this.value)" style="width:auto; min-height:32px; padding:0.25rem 0.6rem; font-size:0.75rem; font-weight:800;">
                    ${opcionesCompaneros}
                </select>
                <button type="button" class="btn btn-secondary btn-sm btn-foto-perfil-cdm" onclick="abrirPanelFotoPerfilCDM(${p.id})" title="Subir, cambiar o quitar foto de perfil">
                    <i class="ri-camera-lens-line"></i> ${p.foto ? "Cambiar / Quitar Foto" : "Subir Foto"}
                </button>
                ${p.deporte !== "Gimnasio" ? `<button class="btn btn-secondary btn-sm" onclick="calificarJugadorRapidoPrompt(${p.id})">⭐ Calificar (1-10)</button>` : ""}
                <button class="btn ${presenteHoy ? "btn-ok" : "btn-primary"} btn-sm" onclick="toggleAsistenciaEnFicha(${p.id}, '${hoy}')">
                    ${presenteHoy ? "✓ Presente Hoy" : "✓ Marcar Presente"}
                </button>
                <button class="btn btn-whatsapp btn-sm" onclick="enviarInformeEjecutivoJugadorWhatsApp()"><i class="ri-whatsapp-line"></i> Informe WA</button>
                <button class="btn btn-secondary btn-sm" onclick="abrirModalPersona(${p.id})"><i class="ri-edit-line"></i> Editar</button>
            </div>
        </div>
    `;

    const selEx = document.getElementById("selectFiltroEjercicioGrafico");
    const valorPrevio = selEx.value;
    const ejerciciosUnicos = [...new Set(p.evaluaciones.map(e => e.ejercicio))];

    selEx.innerHTML = ejerciciosUnicos.length
        ? ejerciciosUnicos.map(nom => `<option value="${nom}">${nom}</option>`).join("")
        : `<option value="">-- Sin marcas aún --</option>`;

    if (valorPrevio && ejerciciosUnicos.includes(valorPrevio)) selEx.value = valorPrevio;

    dibujarGraficoEvolucion();
    dibujarRadarJugador(p);
    renderizarHistorialJugador(p);
    renderizarRutinasIndividuales(p);
    renderizarClinicoJugador(p);
    renderizarCalculadoraYComparadorJugador(p);
}

function renderizarCalculadoraYComparadorJugador(p) {
    const contCalc = document.getElementById("contenedorCalculadora1RMJugador");
    const contComp = document.getElementById("contenedorComparadorJugador");
    if (!contCalc || !contComp) return;

    const evalsFuerza = (p.evaluaciones || []).filter(e => e.tipo === "fuerza_kg");
    const ultimoRM = evalsFuerza.length ? evalsFuerza[evalsFuerza.length - 1].valor : 80;
    const nombreUltimoEj = evalsFuerza.length ? evalsFuerza[evalsFuerza.length - 1].ejercicio : "Ejercicio Base";

    contCalc.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.8rem; flex-wrap:wrap; background:var(--surface-subtle); padding:0.85rem; border-radius:12px; border:1px solid var(--line);">
            <div class="field" style="flex:1; min-width:180px;">
                <label>1RM de Referencia (kg) — ${nombreUltimoEj}</label>
                <input type="number" id="inputBase1RMCalc" value="${ultimoRM}" oninput="actualizarZonas1RM(this.value)">
            </div>
            <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarInformeEjecutivoJugadorWhatsApp()">
                <i class="ri-whatsapp-line"></i> Enviar Informe 360°
            </button>
        </div>
        <div id="gridZonas1RM" class="rm-zone-grid"></div>
    `;
    actualizarZonas1RM(ultimoRM);

    const companeros = basePersonas.filter(x => x.activo && x.id !== p.id && x.deporte === p.deporte);
    if (companeros.length === 0) {
        contComp.innerHTML = `<div class="empty-box">No hay otros compañeros en ${p.deporte} para comparar.</div>`;
        return;
    }

    contComp.innerHTML = `
        <div class="field" style="margin-bottom:0.85rem;">
            <label>Comparar contra par de ${p.deporte}:</label>
            <select id="selectCompaneroH2H" onchange="actualizarTablaH2H(this.value)">
                ${companeros.map(c => `<option value="${c.id}">${c.apellido}, ${c.nombre} (${c.puesto})</option>`).join("")}
            </select>
        </div>
        <div id="tablaResultadosH2H"></div>
    `;
    actualizarTablaH2H(companeros[0].id);
}

function actualizarZonas1RM(rmValor) {
    const grid = document.getElementById("gridZonas1RM");
    if (!grid) return;
    const rm = parseFloat(rmValor) || 0;
    const zonas = [
        { pct: 95, zona: "Fuerza Máxima", reps: "1 a 2 reps" },
        { pct: 90, zona: "Fuerza Pesada", reps: "3 a 4 reps" },
        { pct: 85, zona: "Fuerza / Hipertrofia", reps: "5 a 6 reps" },
        { pct: 80, zona: "Hipertrofia Óptima", reps: "6 a 8 reps" },
        { pct: 75, zona: "Volumen Estructural", reps: "8 a 10 reps" },
        { pct: 70, zona: "Potencia / Velocidad", reps: "10 a 12 reps" },
        { pct: 60, zona: "Técnica / Activación", reps: "12 a 15 reps" },
        { pct: 55, zona: "Entrada en Calor", reps: "15 reps" }
    ];

    grid.innerHTML = zonas.map(z => `
        <div class="rm-zone-card">
            <span class="badge badge-celeste">${z.pct}% 1RM</span>
            <strong>${Math.round((rm * z.pct) / 100 * 10) / 10} kg</strong>
            <small style="color:var(--ink-700); font-weight:800; display:block;">${z.reps}</small>
            <small style="color:var(--ink-500); font-size:0.68rem;">${z.zona}</small>
        </div>
    `).join("");
}

function actualizarTablaH2H(idRival) {
    const cont = document.getElementById("tablaResultadosH2H");
    const p1 = obtenerJugadorActualPorURL();
    const p2 = basePersonas.find(x => x.id == idRival);
    if (!cont || !p1 || !p2) return;

    asegurarPilaresPersona(p1);
    asegurarPilaresPersona(p2);

    const filas = p1.deporte === "Gimnasio"
        ? [
            { label: "Asist. 7 días", v1: contarAsistenciasUltimos7Dias(p1), v2: contarAsistenciasUltimos7Dias(p2), u: " d" },
            { label: "Asist. Histórica", v1: p1.asistencias.length, v2: p2.asistencias.length, u: "" },
            { label: "Tests Cargados", v1: p1.evaluaciones.length, v2: p2.evaluaciones.length, u: "" },
            { label: "Peso Corporal", v1: p1.peso, v2: p2.peso, u: " kg" },
            { label: "Altura", v1: p1.altura, v2: p2.altura, u: " cm" }
          ]
        : [
            { label: "Score (1-10)", v1: p1.puntosCategoria, v2: p2.puntosCategoria, u: " /10" },
            { label: "Físico (30%)", v1: p1.pilares.fisico, v2: p2.pilares.fisico, u: "" },
            { label: "Gym (25%)", v1: p1.pilares.gym, v2: p2.pilares.gym, u: "" },
            { label: "Técnico (25%)", v1: p1.pilares.tecnico, v2: p2.pilares.tecnico, u: "" },
            { label: "Actitud (20%)", v1: p1.pilares.actitud, v2: p2.pilares.actitud, u: "" },
            { label: "Asist. 7 días", v1: contarAsistenciasUltimos7Dias(p1), v2: contarAsistenciasUltimos7Dias(p2), u: " d" },
            { label: "Peso Corporal", v1: p1.peso, v2: p2.peso, u: " kg" }
          ];

    cont.innerHTML = `
        <div style="background:var(--surface-subtle); border:1px solid var(--line); border-radius:12px; overflow:hidden;">
            <div class="h2h-row" style="background:var(--cdm-900); color:#fff; font-weight:800;">
                <div>${p1.apellido}, ${p1.nombre}</div>
                <div style="text-align:center; color:#38bdf8;">VS</div>
                <div style="text-align:right;">${p2.apellido}, ${p2.nombre}</div>
            </div>
            ${filas.map(f => {
                const g1 = f.v1 >= f.v2;
                const g2 = f.v2 >= f.v1;
                return `
                    <div class="h2h-row">
                        <div style="font-weight:${g1 ? "900" : "600"}; color:${g1 ? "var(--cdm-700)" : "var(--ink-500)"};">${f.v1}${f.u}</div>
                        <div class="h2h-label">${f.label}</div>
                        <div style="text-align:right; font-weight:${g2 ? "900" : "600"}; color:${g2 ? "var(--cdm-700)" : "var(--ink-500)"};">${f.v2}${f.u}</div>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

function enviarInformeEjecutivoJugadorWhatsApp() {
    const p = obtenerJugadorActualPorURL();
    if (!p) return;
    asegurarPilaresPersona(p);
    const fueSem = contarAsistenciasUltimos7Dias(p);
    const pactado = p.frecuenciaSemanal || 3;
    const alturaM = (p.altura || 170) / 100;
    const imc = ((p.peso || 70) / (alturaM * alturaM)).toFixed(1);

    let msg = `💙🤍 *INFORME EJECUTIVO DE RENDIMIENTO 360° — CDM ADELIA MARÍA*\n`;
    msg += `----------------------------------\n`;
    msg += `👤 *Nombre:* ${p.nombre} ${p.apellido}\n`;
    msg += `🏆 *Área:* ${p.deporte} (${p.deporte === "Gimnasio" ? "Socio Gym" : p.categoria}) — ${p.puesto}\n`;
    msg += `⚖️ *Antropometría:* ${p.peso} kg | ${p.altura} cm (IMC: ${imc})\n`;
    msg += `🏥 *Estado Médico:* ${p.estadoMedico || "Óptimo"}\n`;
    msg += `📅 *Asistencia Semanal:* ${fueSem} de ${pactado} días pactados (Total hist: ${p.asistencias.length})\n`;

    if (p.deporte !== "Gimnasio") {
        msg += `\n*⭐ SCORE OFICIAL DEL CLUB: ${p.puntosCategoria} / 10*\n`;
        msg += `   • Físico (30%): ${p.pilares.fisico} / 10\n`;
        msg += `   • Gimnasio (25%): ${p.pilares.gym} / 10\n`;
        msg += `   • Técnico (25%): ${p.pilares.tecnico} / 10\n`;
        msg += `   • Actitud (20%): ${p.pilares.actitud} / 10\n`;
    }

    if (p.evaluaciones && p.evaluaciones.length > 0) {
        msg += `\n*📈 ÚLTIMAS EVALUACIONES REGISTRADAS:*\n`;
        p.evaluaciones.slice(-4).forEach(ev => {
            msg += `   • ${ev.fecha} — *${ev.ejercicio}:* ${ev.detalle}\n`;
        });
    }

    const tel = (p.whatsapp || "").replace(/\D/g, "");
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, "_blank");
}

function toggleAsistenciaEnFicha(idPersona, fecha) {
    toggleAsistenciaPersona(idPersona, fecha);
    inicializarPaginaJugadorIndividual();
}

function cambiarTipoMedicion() {
    const tipo = document.getElementById("evTipo").value;
    const esUni = tipo === "unilateral";

    document.getElementById("bloqueValorSimple").classList.toggle("hidden", esUni);
    document.getElementById("bloqueUnilateral").classList.toggle("hidden", !esUni);
    document.getElementById("bloqueReps").classList.toggle("hidden", tipo !== "fuerza_kg");

    const lbl = document.getElementById("lblEvValor");
    if (lbl) {
        if (tipo === "fuerza_kg") lbl.innerText = "Peso Levantado (kg) *";
        else if (tipo === "salto_cm") lbl.innerText = "Altura Salto (cm) *";
        else if (tipo === "tiempo_seg") lbl.innerText = "Tiempo Sprint (seg) *";
        else lbl.innerText = "Repeticiones / Puntos *";
    }
}

// REGISTRAR TEST FÍSICO: UNIFICA AVANCES DEL ADMIN Y DEL DEPORTISTA EN LA MISMA CURVA
function normalizarClaveEjercicioCDM(txt) {
    return (txt || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function registrarAvanceJugador(e) {
    e.preventDefault();
    const p = obtenerJugadorActualPorURL();
    if (!p) return;

    const fecha = document.getElementById("evFecha").value || obtenerHoyISO();
    let ejercicioInput = document.getElementById("evEjercicio").value.trim();
    if (!ejercicioInput) return;

    // Si el ejercicio ya existe en el historial (cargado por el Admin o el Usuario), usar el nombre exacto; si es inventado nuevo, agregarlo a la lista global
    const claveInput = normalizarClaveEjercicioCDM(ejercicioInput);
    const existente = (p.evaluaciones || []).find(ev => normalizarClaveEjercicioCDM(ev.ejercicio) === claveInput);
    const tipo = document.getElementById("evTipo").value;
    const ejercicio = existente
        ? existente.ejercicio
        : (agregarEjercicioInventadoAlCatalogoCDM(ejercicioInput, tipo === "fuerza_kg" ? "fuerza_1rm" : tipo, false) || ejercicioInput);

    const notaRaw = document.getElementById("evNota").value.trim();
    const esUsuarioActivo = document.body.getAttribute("data-rol") === "usuario";
    const prefijoAutor = esUsuarioActivo ? "👤 Deportista" : "👨‍🏫 Profe/Admin";
    const nota = notaRaw ? `${prefijoAutor}: ${notaRaw}` : prefijoAutor;

    let valorGrafico = 0, unidad = "", detalle = "";

    if (tipo === "fuerza_kg") {
        const kg = parseFloat(document.getElementById("evValor").value) || 0;
        const reps = parseInt(document.getElementById("evReps").value) || 1;
        const rm = Math.round((reps === 1 ? kg : kg * (1 + reps / 30)) * 10) / 10;
        const fRel = (rm / (p.peso || 70)).toFixed(2);
        valorGrafico = rm;
        unidad = "kg (1RM)";
        detalle = `${kg} kg × ${reps} reps (1RM: ${rm} kg • F.Rel: ${fRel}x)`;
    } else if (tipo === "unilateral") {
        const izq = parseFloat(document.getElementById("evIzq").value) || 0;
        const der = parseFloat(document.getElementById("evDer").value) || 0;
        const prom = Math.round(((izq + der) / 2) * 10) / 10;
        const asim = Math.round((Math.abs(izq - der) / Math.max(izq, der, 1)) * 1000) / 10;
        valorGrafico = prom;
        unidad = "prom";
        detalle = `Izq: ${izq} | Der: ${der} (Asimetría: ${asim}% ${asim > 12 ? "⚠️" : "✓"})`;
    } else if (tipo === "salto_cm") {
        const cm = parseFloat(document.getElementById("evValor").value) || 0;
        const watts = Math.round((60.7 * cm) + (45.3 * (p.peso || 70)) - 2055);
        valorGrafico = cm;
        unidad = "cm";
        detalle = `${cm} cm (${watts > 0 ? watts : 0} W)`;
    } else if (tipo === "tiempo_seg") {
        const seg = parseFloat(document.getElementById("evValor").value) || 0;
        valorGrafico = seg;
        unidad = "seg";
        detalle = `${seg} seg`;
    } else {
        const v = parseFloat(document.getElementById("evValor").value) || 0;
        valorGrafico = v;
        unidad = "reps";
        detalle = `${v} reps`;
    }

    p.evaluaciones.push({ id: Date.now(), fecha, ejercicio, tipo, valor: valorGrafico, unidad, detalle, nota });
    p.evaluaciones.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    guardarDatosCDM();

    document.getElementById("evValor").value = "";
    document.getElementById("evNota").value = "";
    mostrarToast(`📈 Marca física registrada en el historial.`);

    inicializarPaginaJugadorIndividual();
    document.getElementById("selectFiltroEjercicioGrafico").value = ejercicio;
    dibujarGraficoEvolucion();
}

function dibujarGraficoEvolucion() {
    const p = obtenerJugadorActualPorURL();
    if (!p) return;

    const nombreEx = document.getElementById("selectFiltroEjercicioGrafico")?.value;
    const kpisCont = document.getElementById("kpisEvolucionEjercicio");
    const canvas = document.getElementById("canvasEvolucionJugador");
    if (!kpisCont || !canvas) return;

    const datosEx = p.evaluaciones.filter(ev => ev.ejercicio === nombreEx).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    if (chartInstancia) {
        chartInstancia.destroy();
        chartInstancia = null;
    }

    if (datosEx.length === 0) {
        kpisCont.innerHTML = `<div class="empty-box" style="grid-column: 1 / -1;">Cargá un ejercicio en el panel izquierdo para graficar su progreso.</div>`;
        return;
    }

    const inicial = datosEx[0].valor;
    const actual = datosEx[datosEx.length - 1].valor;
    const unidad = datosEx[datosEx.length - 1].unidad;
    const esTiempo = datosEx[0].tipo === "tiempo_seg";
    const mejor = esTiempo ? Math.min(...datosEx.map(d => d.valor)) : Math.max(...datosEx.map(d => d.valor));
    const pct = inicial > 0 ? (esTiempo ? ((inicial - actual) / inicial) * 100 : ((actual - inicial) / inicial) * 100) : 0;

    kpisCont.innerHTML = `
        <div class="bento-kpi"><div class="kpi-data"><span>Inicial</span><strong>${inicial} <small>${unidad}</small></strong></div></div>
        <div class="bento-kpi"><div class="kpi-data"><span>Actual</span><strong>${actual} <small>${unidad}</small></strong></div></div>
        <div class="bento-kpi"><div class="kpi-data"><span>Récord (PR)</span><strong>🏆 ${mejor}</strong></div></div>
        <div class="bento-kpi"><div class="kpi-data"><span>Avance</span><strong style="color:${pct >= 0 ? "var(--ok)" : "var(--err)"}">${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%</strong></div></div>
    `;

    chartInstancia = new Chart(canvas.getContext("2d"), {
        type: "line",
        data: {
            labels: datosEx.map(d => d.fecha),
            datasets: [{
                label: `${nombreEx} (${unidad})`,
                data: datosEx.map(d => d.valor),
                borderColor: "#0095db",
                backgroundColor: "rgba(0, 149, 219, 0.16)",
                borderWidth: 3,
                pointRadius: 5,
                fill: true,
                tension: 0.32
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function dibujarRadarJugador(p) {
    const canvas = document.getElementById("canvasRadarJugador");
    if (!canvas || typeof Chart === "undefined") return;
    if (chartRadarInstancia) chartRadarInstancia.destroy();

    asegurarPilaresPersona(p);
    const cumplSem10 = Math.min(10, Math.round((contarAsistenciasUltimos7Dias(p) / (p.frecuenciaSemanal || 3)) * 100) / 10);

    // Si es Socio del Gimnasio, mostramos radar de hábitos de entrenamiento (1 a 10) sin Score competitivo
    if (p.deporte === "Gimnasio") {
        const cantRutinas = Math.min(10, baseRutinas.filter(r => r.personaId === p.id).length * 3.5);
        const cantTests = Math.min(10, (p.evaluaciones?.length || 0) * 2.5);
        const ultSueno = p.clinico?.length ? Number(p.clinico[p.clinico.length - 1].sueno || 4) * 2 : 8;
        const constancia = Math.min(10, (p.asistencias?.length || 1) * 1.5);

        chartRadarInstancia = new Chart(canvas.getContext("2d"), {
            type: "radar",
            data: {
                labels: ["Adherencia 7d", "Constancia", "Tests Registrados", "Rutinas Activas", "Descanso / Wellness"],
                datasets: [{
                    label: `${p.nombre} (Hábitos Gym)`,
                    data: [cumplSem10, constancia, cantTests, cantRutinas, ultSueno],
                    backgroundColor: "rgba(16, 185, 129, 0.24)",
                    borderColor: "#10b981",
                    pointBackgroundColor: "#059669",
                    borderWidth: 2.5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { r: { min: 0, max: 10, ticks: { stepSize: 2, display: false } } }
            }
        });
        return;
    }

    // Para Deportes (Fútbol y Hockey): Radar en Escala 1 a 10
    const datosJugador = [
        p.pilares.fisico,
        p.pilares.gym,
        p.pilares.tecnico,
        p.pilares.actitud,
        cumplSem10,
        p.puntosCategoria
    ];

    const pares = basePersonas.filter(x => x.activo && x.deporte === p.deporte && x.categoria === p.categoria);
    const n = pares.length || 1;
    const promCategoria = [
        Math.round((pares.reduce((a, x) => a + (x.pilares?.fisico || 7), 0) / n) * 10) / 10,
        Math.round((pares.reduce((a, x) => a + (x.pilares?.gym || 7), 0) / n) * 10) / 10,
        Math.round((pares.reduce((a, x) => a + (x.pilares?.tecnico || 7), 0) / n) * 10) / 10,
        Math.round((pares.reduce((a, x) => a + (x.pilares?.actitud || 7), 0) / n) * 10) / 10,
        Math.round((pares.reduce((a, x) => a + Math.min(10, (contarAsistenciasUltimos7Dias(x) / (x.frecuenciaSemanal || 3)) * 10), 0) / n) * 10) / 10,
        Math.round((pares.reduce((a, x) => a + (x.puntosCategoria || 7), 0) / n) * 10) / 10
    ];

    chartRadarInstancia = new Chart(canvas.getContext("2d"), {
        type: "radar",
        data: {
            labels: ["Físico (1-10)", "Gym (1-10)", "Técnico (1-10)", "Actitud (1-10)", "Frecuencia 7d", "Score Global"],
            datasets: [
                {
                    label: `${p.nombre} (${p.puntosCategoria}/10)`,
                    data: datosJugador,
                    backgroundColor: "rgba(0, 149, 219, 0.26)",
                    borderColor: "#0095db",
                    pointBackgroundColor: "#06283d",
                    borderWidth: 2.5
                },
                {
                    label: `Promedio ${p.categoria}`,
                    data: promCategoria,
                    backgroundColor: "rgba(16, 185, 129, 0.08)",
                    borderColor: "#10b981",
                    borderDash: [4, 4],
                    pointRadius: 2,
                    borderWidth: 1.8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { r: { min: 0, max: 10, ticks: { stepSize: 2, display: false } } }
        }
    });
}

function renderizarHistorialJugador(p) {
    const cont = document.getElementById("contenedorHistorialJugador");
    if (!cont) return;
    if (!p.evaluaciones.length) {
        cont.innerHTML = `<div class="empty-box">Sin evaluaciones cargadas.</div>`;
        return;
    }

    let html = `<div class="table-wrap"><table class="app-table"><thead><tr><th>Fecha</th><th>Ejercicio</th><th>Resultado</th><th>Nota</th><th class="col-admin-control"></th></tr></thead><tbody>`;
    [...p.evaluaciones].reverse().forEach(ev => {
        html += `<tr><td data-label="Fecha"><b>${ev.fecha}</b></td><td data-label="Ejercicio"><strong>${ev.ejercicio}</strong></td><td data-label="Resultado">${ev.detalle}</td><td data-label="Nota"><small>${ev.nota || "-"}</small></td><td data-label="Acción" class="col-admin-control"><button class="btn btn-danger btn-sm" onclick="eliminarEvaluacionJugador(${ev.id})"><i class="ri-delete-bin-line"></i></button></td></tr>`;
    });
    cont.innerHTML = html + `</tbody></table></div>`;
}

function eliminarEvaluacionJugador(idEv) {
    const p = obtenerJugadorActualPorURL();
    if (!p) return;
    p.evaluaciones = p.evaluaciones.filter(e => e.id !== idEv);
    guardarDatosCDM();
    inicializarPaginaJugadorIndividual();
}

function agregarFilaEjercicioIndividual(datos = null) {
    const cont = document.getElementById("contenedorFilasRutinaIndividual");
    if (!cont) return;
    const numOrden = cont.querySelectorAll(".ex-builder-row").length + 1;
    const div = document.createElement("div");
    div.className = "ex-builder-row";
    div.innerHTML = `
        <div class="ex-builder-top">
            <span class="ex-builder-num">#${numOrden}</span>
            <div class="field" style="flex:1;">
                <input type="text" class="ri-nombre" list="listaEjerciciosSugeridos" required placeholder="Nombre del ejercicio (Ej: Press de Banca)" value="${datos?.nombre || ""}">
            </div>
            <button type="button" class="btn btn-danger btn-sm ex-builder-del" onclick="this.closest('.ex-builder-row').remove()" title="Quitar ejercicio">✕</button>
        </div>
        <div class="ex-builder-metrics-grid">
            <div class="field"><label>Series</label><input type="number" class="ri-series" required min="1" max="20" value="${datos?.series || 4}"></div>
            <div class="field"><label>Reps / Tiempo</label><input type="text" class="ri-reps" required placeholder="8-10" value="${datos?.reps || "8-10"}"></div>
            <div class="field"><label>Carga / Peso</label><input type="text" class="ri-peso" placeholder="Ej: 70kg / Moderado" value="${datos?.peso || ""}"></div>
            <div class="field"><label>Pausa</label><input type="text" class="ri-pausa" placeholder="90s" value="${datos?.pausa || "90s"}"></div>
        </div>
        <div class="field" style="margin-top:0.45rem;">
            <input type="text" class="ri-forma" placeholder="💡 Indicación técnica opcional..." value="${datos?.forma || ""}">
        </div>
    `;
    cont.appendChild(div);
}

function cargarPlantillaIndividual(tipo) {
    const cont = document.getElementById("contenedorFilasRutinaIndividual");
    if (!cont) return;
    cont.innerHTML = "";
    if (tipo === "superior") {
        document.getElementById("rutNombre").value = "Fuerza Tren Superior";
        agregarFilaEjercicioIndividual({ nombre: "Press de Banca Plano", series: 4, reps: "6-8", peso: "Pesado", pausa: "2m", forma: "Controlar bajada." });
        agregarFilaEjercicioIndividual({ nombre: "Dominadas / Jalón al Pecho en Polea", series: 4, reps: "8", peso: "Lastre", pausa: "90s", forma: "Rango completo." });
    } else if (tipo === "rehab") {
        document.getElementById("rutNombre").value = "Protocolo Rehabilitación";
        document.getElementById("rutObjetivo").value = "Rehabilitación / Lesión";
        agregarFilaEjercicioIndividual({ nombre: "Protocolo Isométrico y Estabilidad de Rodilla", series: 4, reps: "30s", peso: "Sin dolor", pausa: "60s", forma: "Controlado." });
    } else {
        document.getElementById("rutNombre").value = "Fuerza Piernas y Potencia";
        agregarFilaEjercicioIndividual({ nombre: "Sentadilla Trasera con Barra", series: 4, reps: "5", peso: "80% 1RM", pausa: "2m", forma: "Subir explosivo." });
        agregarFilaEjercicioIndividual({ nombre: "Sentadilla Búlgara Unilateral", series: 3, reps: "8 c/pierna", peso: "Mancuernas", pausa: "90s", forma: "Estabilidad." });
    }
}

function guardarRutinaIndividual(e) {
    e.preventDefault();
    const p = obtenerJugadorActualPorURL();
    if (!p) return;
    const filas = document.querySelectorAll("#contenedorFilasRutinaIndividual .ex-builder-row");
    if (!filas.length) return;

    const ejercicios = [];
    filas.forEach(f => {
        const nomEj = f.querySelector(".ri-nombre").value.trim();
        const nomCanonico = agregarEjercicioInventadoAlCatalogoCDM(nomEj, "fuerza_1rm", true) || nomEj;
        ejercicios.push({
            nombre: nomCanonico,
            series: f.querySelector(".ri-series").value,
            reps: f.querySelector(".ri-reps").value.trim(),
            peso: f.querySelector(".ri-peso").value.trim() || "A ajustar",
            pausa: f.querySelector(".ri-pausa").value.trim(),
            forma: f.querySelector(".ri-forma").value.trim()
        });
    });

    baseRutinas.unshift({
        id: Date.now(),
        esGrupal: false,
        deporteDestino: p.deporte,
        categoriaDestino: p.categoria,
        personaId: p.id,
        etiquetaDestino: `👤 ${p.nombre} ${p.apellido}`,
        fecha: new Date().toLocaleDateString("es-AR"),
        nombre: document.getElementById("rutNombre").value.trim(),
        objetivo: document.getElementById("rutObjetivo").value,
        dias: document.getElementById("rutDias").value.trim() || "Semanal",
        notas: document.getElementById("rutNotas").value.trim(),
        ejercicios
    });

    guardarDatosCDM();
    e.target.reset();
    document.getElementById("contenedorFilasRutinaIndividual").innerHTML = "";
    agregarFilaEjercicioIndividual();
    mostrarToast("✓ Rutina individual guardada.");
    renderizarRutinasIndividuales(p);
}

function renderizarRutinasIndividuales(p) {
    const cont = document.getElementById("listaRutinasGuardadasJugador");
    if (!cont) return;
    cont.className = "routines-pro-grid";

    const rutinas = baseRutinas.filter(r =>
        r.personaId === p.id ||
        (r.esGrupal && r.deporteDestino === p.deporte && r.categoriaDestino === p.categoria) ||
        (r.esGrupal && p.deporte === "Gimnasio" && r.deporteDestino === "Gimnasio")
    );

    if (!rutinas.length) {
        cont.innerHTML = `<div class="empty-box" style="grid-column:1/-1;">Sin rutinas asignadas todavía.</div>`;
        return;
    }

    cont.innerHTML = rutinas.map(r => renderTarjetaRutinaProAdmin(r)).join("");
}

function guardarClinicoJugador(e) {
    e.preventDefault();
    const p = obtenerJugadorActualPorURL();
    if (!p) return;
    const nuevoPeso = parseFloat(document.getElementById("medPeso").value);
    if (!isNaN(nuevoPeso) && nuevoPeso > 0) p.peso = nuevoPeso;

    const esUsuario = document.body.getAttribute("data-rol") === "usuario";
    const estadoGral = document.getElementById("medEstadoGeneral")?.value;
    if (!esUsuario && estadoGral) p.estadoMedico = estadoGral;

    p.clinico.push({
        id: Date.now(),
        fecha: document.getElementById("medFecha").value || obtenerHoyISO(),
        peso: p.peso,
        rpe: parseInt(document.getElementById("medRPE")?.value) || 5,
        sueno: document.getElementById("medSueno")?.value || 5,
        dolor: document.getElementById("medDolor")?.value.trim() || "Sin molestias"
    });

    guardarDatosCDM();
    e.target.reset();
    mostrarToast("🩸 Control antropométrico y parte médico guardados.");
    inicializarPaginaJugadorIndividual();
}

function renderizarClinicoJugador(p) {
    const cont = document.getElementById("contenedorClinicoJugador");
    if (!cont) return;
    if (!p.clinico || !p.clinico.length) {
        cont.innerHTML = `<div class="empty-box">Sin controles clínicos registrados.</div>`;
        return;
    }
    const alturaM = (p.altura || 170) / 100;

    let html = `<div class="table-wrap"><table class="app-table"><thead><tr><th>Fecha</th><th>Peso / IMC</th><th>RPE (Esfuerzo)</th><th>Descanso / Parte Médico</th></tr></thead><tbody>`;
    [...p.clinico].reverse().forEach(c => {
        const imcCalc = (c.peso / (alturaM * alturaM)).toFixed(1);
        const alertaRPE = (c.rpe || 5) > 7
            ? `<span class="badge badge-danger">🚨 RPE ${c.rpe}/10</span>`
            : `<span class="badge badge-ok">RPE ${c.rpe || 5}/10</span>`;
        const extraBio = c.hemo
            ? ` • 🩸 Hb: ${c.hemo} g/dL | Ferr: ${c.ferri} ng/mL | CK: ${c.ck} U/L`
            : "";
        html += `<tr><td data-label="Fecha"><b>${c.fecha}</b></td><td data-label="Peso / IMC"><span><b>${c.peso} kg</b> <small style="color:var(--ink-500)">(IMC ${imcCalc})</small></span></td><td data-label="RPE (Esfuerzo)">${alertaRPE}</td><td data-label="Descanso / Parte Médico"><small>💤 Sueño: ${c.sueno || 5}/5 • 🏥 ${c.dolor || "Óptimo"}${extraBio}</small></td></tr>`;
    });
    cont.innerHTML = html + `</tbody></table></div>`;
}

// =========================================================================
// 11. PUENTE INTEGRAL PARA ANALISISJUGADORES.HTML (AMS ELITE PRO - 1 A 10)
// =========================================================================

function inicializarAnalisisJugadoresAMS() {
    if (!document.getElementById("homeCategoryGrid")) return;

    const selCat = document.getElementById("globalCategorySelect");
    if (selCat) selCat.value = categoriaActiva;

    // Adaptar el selector de pilares en analisisjugadores.html a escala 1 a 10
    const selPilarAMS = document.getElementById("selectPilarRanking");
    if (selPilarAMS) {
        selPilarAMS.innerHTML = `
            <option value="general">👑 Score General Directo (Escala 1 a 10)</option>
            <option value="fisico">🏃 Condición Física (1 a 10 — 30%)</option>
            <option value="gym">🏋️ Fuerza en Gimnasio (1 a 10 — 25%)</option>
            <option value="tecnico">⚽ Destreza Técnica/Táctica (1 a 10 — 25%)</option>
            <option value="actitud">🔥 Compromiso y Actitud (1 a 10 — 20%)</option>
            <option value="bonus">⭐ Bonus / Ajuste del Profe (+/-)</option>
        `;
    }
    const inpValAMS = document.getElementById("inputValorRanking");
    if (inpValAMS) {
        inpValAMS.step = "0.1";
        inpValAMS.placeholder = "Ej: 8.5 (Fijar) o 0.5 (Sumar)";
    }

    poblarCatalogoEjerciciosAMS();
    refrescarTodoAMS();
}

function obtenerJugadoresCategoriaAMS(soloActivos = false) {
    return basePersonas.filter(p => {
        if (p.deporte === "Gimnasio") return false;
        if (p.categoria !== categoriaActiva) return false;
        if (soloActivos && !p.activo) return false;
        return true;
    });
}

function irAPagina(pagina) {
    document.querySelectorAll(".page-view").forEach(sec => sec.classList.remove("active"));
    const target = document.getElementById(`page-${pagina}`);
    if (target) target.classList.add("active");

    document.querySelectorAll(".sidebar-menu .menu-item").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.page === pagina);
    });

    const titulos = {
        home: ["Centro de Control Deportivo", "Seleccioná una categoría o módulo de trabajo."],
        plantel: [`Plantel de Jugadores — ${categoriaActiva}`, "Administración de altas, bajas y fichas médicas."],
        ranking: [`Ranking Oficial (Escala 1 a 10) — ${categoriaActiva}`, "Calificación manual exclusiva controlada por el Profesor."],
        gimnasio: [`Evaluación Física y Campo — ${categoriaActiva}`, "Cálculo de 1RM, potencia en Watts y detector de asimetrías."],
        laboratorio: [`Laboratorio y Antropometría — ${categoriaActiva}`, "Control de Hemoglobina, Ferritina, CK y peso corporal."],
        ficha360: [`Ficha Científica 360° — ${categoriaActiva}`, "Inspección integral e historial completo del deportista."]
    };

    if (titulos[pagina]) {
        const tEl = document.getElementById("pageTitle");
        const sEl = document.getElementById("pageSubtitle");
        if (tEl) tEl.innerText = titulos[pagina][0];
        if (sEl) sEl.innerText = titulos[pagina][1];
    }

    refrescarTodoAMS();
}

function cambiarCategoriaGlobal(nuevaCat) {
    categoriaActiva = nuevaCat;
    const badge = document.getElementById("topCatBadge");
    if (badge) badge.innerText = `Categoría: ${nuevaCat}`;
    document.querySelectorAll(".lbl-cat").forEach(el => el.innerText = nuevaCat);
    refrescarTodoAMS();
}

function refrescarTodoAMS() {
    basePersonas.forEach(p => asegurarPilaresPersona(p));
    renderizarHomeAMS();
    renderizarPaginaPlantel();
    renderizarRankingAMS();
    poblarSelectsJugadoresAMS();
    renderizarTablaGymAMS();
    renderizarTablaLaboratorioAMS();
    renderizarPagina360();
}

function renderizarHomeAMS() {
    const grid = document.getElementById("homeCategoryGrid");
    if (!grid) return;
    const cats = ["Sub 13", "Sub 15", "Sub 17", "Reserva", "Primera"];

    grid.innerHTML = cats.map(c => {
        const list = basePersonas.filter(p => p.deporte !== "Gimnasio" && p.categoria === c && p.activo);
        const prom = list.length
            ? (list.reduce((a, x) => a + (x.puntosCategoria || 7), 0) / list.length).toFixed(1)
            : "0.0";
        const activa = c === categoriaActiva;
        return `
            <div class="card" style="cursor:pointer; border:${activa ? "2px solid var(--cdm-500)" : "1px solid var(--line)"}; padding:1.15rem; border-radius:18px;" onclick="document.getElementById('globalCategorySelect').value='${c}'; cambiarCategoriaGlobal('${c}'); irAPagina('plantel');">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                    <span class="badge ${activa ? "badge-ok" : "badge-celeste"}">${c}</span>
                    <strong style="font-size:0.85rem;">⭐ ${prom} / 10</strong>
                </div>
                <h4 style="font-size:1.15rem; margin-bottom:0.2rem;">${list.length} Deportistas</h4>
                <small style="color:var(--ink-500);">Click para gestionar división</small>
            </div>
        `;
    }).join("");
}

function renderizarPaginaPlantel() {
    const cont = document.getElementById("contenedorTablaPlantel");
    if (!cont) return;

    const q = (document.getElementById("buscarJugadorInput")?.value || "").toLowerCase().trim();
    const estado = document.getElementById("filtroEstadoPlantel")?.value || "activos";

    let lista = obtenerJugadoresCategoriaAMS(false);
    if (estado === "activos") lista = lista.filter(p => p.activo);
    else if (estado === "bajas") lista = lista.filter(p => !p.activo);

    if (q) {
        lista = lista.filter(p =>
            p.nombre.toLowerCase().includes(q) ||
            p.apellido.toLowerCase().includes(q) ||
            (p.dni || "").toLowerCase().includes(q)
        );
    }

    const contLbl = document.getElementById("contadorPlantel");
    if (contLbl) contLbl.innerText = `${lista.length} jugador(es)`;

    if (!lista.length) {
        cont.innerHTML = `<div class="empty-box">No hay jugadores registrados en ${categoriaActiva} con este filtro.</div>`;
        return;
    }

    cont.innerHTML = `<div class="table-wrap"><table class="app-table"><thead><tr><th>Jugador</th><th>DNI / Edad</th><th>Puesto</th><th>Peso / Altura</th><th>Sangre</th><th>Score (1-10)</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>` +
        lista.map(p => `
            <tr>
                <td data-label="Jugador"><div><strong>${p.apellido}, ${p.nombre}</strong><br><small style="color:var(--ink-500)">${p.deporte} • 🔑 ${p.codigoAcceso}</small></div></td>
                <td data-label="DNI / Edad"><div>${p.dni}<br><small>${p.edad} años</small></div></td>
                <td data-label="Puesto">${p.puesto}</td>
                <td data-label="Peso / Altura">${p.peso} kg / ${p.altura} cm</td>
                <td data-label="Sangre"><b>${p.sangre}</b></td>
                <td data-label="Score (1-10)"><span class="badge badge-purple">⭐ ${p.puntosCategoria} / 10</span></td>
                <td data-label="Estado"><span class="badge ${p.activo ? "badge-ok" : "badge-danger"}">${p.activo ? "ACTIVO" : "BAJA"}</span></td>
                <td data-label="Acciones">
                    <div style="display:flex; gap:0.3rem; justify-content:flex-end;">
                        <button class="btn btn-secondary btn-sm" onclick="abrirModalJugador(${p.id})">✏️</button>
                        <button class="btn btn-ghost btn-sm" onclick="alternarEstadoActivoAMS(${p.id})">${p.activo ? "Dar Baja" : "Dar Alta"}</button>
                    </div>
                </td>
            </tr>
        `).join("") + `</tbody></table></div>`;
}

function alternarEstadoActivoAMS(id) {
    const p = basePersonas.find(x => x.id === id);
    if (!p) return;
    p.activo = !p.activo;
    guardarDatosCDM();
    refrescarTodoAMS();
}

function abrirModalJugador(idEditar = null) {
    const modal = document.getElementById("modalJugador");
    if (!modal) {
        abrirModalPersona(idEditar);
        return;
    }
    const form = document.getElementById("formModalJugador");
    if (form) form.reset();

    if (idEditar) {
        const p = basePersonas.find(x => x.id === idEditar);
        if (!p) return;
        document.getElementById("modalJugadorTitulo").innerText = `Editar: ${p.nombre} ${p.apellido}`;
        document.getElementById("editJugadorId").value = p.id;
        document.getElementById("jugNombre").value = p.nombre;
        document.getElementById("jugApellido").value = p.apellido;
        document.getElementById("jugDni").value = p.dni;
        document.getElementById("jugCategoria").value = p.categoria;
        document.getElementById("jugPosicion").value = p.puesto;
        document.getElementById("jugEdad").value = p.edad;
        document.getElementById("jugSangre").value = p.sangre;
        document.getElementById("jugContacto").value = p.whatsapp;
        document.getElementById("jugObraSocial").value = p.obraSocial || "";
        document.getElementById("jugPeso").value = p.peso;
        document.getElementById("jugAltura").value = p.altura;
        document.getElementById("jugPierna").value = p.pierna;
        document.getElementById("jugBrazo").value = p.brazo;
    } else {
        document.getElementById("modalJugadorTitulo").innerText = "Dar de Alta Nuevo Jugador";
        document.getElementById("editJugadorId").value = "";
        document.getElementById("jugCategoria").value = categoriaActiva;
    }
    modal.classList.remove("hidden");
}

function cerrarModalJugador() {
    document.getElementById("modalJugador")?.classList.add("hidden");
}

function guardarFichaJugador(e) {
    e.preventDefault();
    const idEdit = document.getElementById("editJugadorId").value;
    const cat = document.getElementById("jugCategoria").value;
    const peso = parseFloat(document.getElementById("jugPeso").value) || 70;
    const hoy = obtenerHoyISO();

    const datos = {
        deporte: "Futbol",
        categoria: cat,
        puesto: document.getElementById("jugPosicion").value.trim(),
        nombre: document.getElementById("jugNombre").value.trim(),
        apellido: document.getElementById("jugApellido").value.trim(),
        dni: document.getElementById("jugDni").value.trim(),
        whatsapp: document.getElementById("jugContacto").value.trim(),
        obraSocial: document.getElementById("jugObraSocial").value.trim(),
        edad: parseInt(document.getElementById("jugEdad").value) || 18,
        sangre: document.getElementById("jugSangre").value,
        peso,
        altura: parseInt(document.getElementById("jugAltura").value) || 172,
        pierna: document.getElementById("jugPierna").value,
        brazo: document.getElementById("jugBrazo").value
    };

    if (idEdit) {
        const p = basePersonas.find(x => x.id == idEdit);
        if (p) Object.assign(p, datos);
        mostrarToast("✏️ Jugador actualizado.");
    } else {
        const nuevo = {
            id: Date.now(),
            ...datos,
            activo: true,
            frecuenciaSemanal: 3,
            estadoMedico: "Óptimo",
            pagoEstado: "Al Día",
            montoCuota: 25000,
            pilares: { fisico: 7.0, gym: 7.0, tecnico: 7.0, actitud: 7.5, bonus: 0 },
            puntosCategoria: 7.1,
            motivoPuntos: "Alta en el plantel",
            asistencias: [hoy],
            evaluaciones: [],
            clinico: [{ id: Date.now() + 1, fecha: hoy, peso, rpe: 5, sueno: 5, dolor: "Sin molestias" }]
        };
        asegurarPilaresPersona(nuevo);
        basePersonas.push(nuevo);
        mostrarToast("✓ Jugador dado de alta.");
    }

    guardarDatosCDM();
    cerrarModalJugador();
    cambiarCategoriaGlobal(cat);
}

function renderizarRankingAMS() {
    const cont = document.getElementById("contenedorTablaRanking");
    if (!cont) return;
    const activos = obtenerJugadoresCategoriaAMS(true);
    activos.sort((a, b) => b.puntosCategoria - a.puntosCategoria);

    if (!activos.length) {
        cont.innerHTML = `<div class="empty-box">No hay jugadores activos en ${categoriaActiva}.</div>`;
        return;
    }

    cont.innerHTML = `<div class="table-wrap"><table class="app-table"><thead><tr><th>Pos</th><th>Jugador</th><th>Físico</th><th>Gym</th><th>Técnico</th><th>Actitud</th><th>Bonus</th><th>Score (1-10)</th><th>Motivo</th></tr></thead><tbody>` +
        activos.map((p, i) => `
            <tr>
                <td data-label="Pos"><strong>#${i + 1}°</strong></td>
                <td data-label="Jugador"><div><strong>${p.apellido}, ${p.nombre}</strong><br><small>${p.puesto}</small></div></td>
                <td data-label="Físico">${p.pilares.fisico}</td>
                <td data-label="Gym">${p.pilares.gym}</td>
                <td data-label="Técnico">${p.pilares.tecnico}</td>
                <td data-label="Actitud">${p.pilares.actitud}</td>
                <td data-label="Bonus">${p.pilares.bonus >= 0 ? "+" : ""}${p.pilares.bonus}</td>
                <td data-label="Score (1-10)"><span class="badge badge-ok">⭐ ${p.puntosCategoria} / 10</span></td>
                <td data-label="Motivo"><small>${p.motivoPuntos || "-"}</small></td>
            </tr>
        `).join("") + `</tbody></table></div>`;
}

function guardarPuntosRanking(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById("selectJugadorRanking")?.value);
    const p = basePersonas.find(x => x.id === id);
    if (!p) return;

    const pilar = document.getElementById("selectPilarRanking").value;
    const modo = document.getElementById("selectModoRanking").value;
    const valor = parseFloat(document.getElementById("inputValorRanking").value);
    const motivo = document.getElementById("inputMotivoRanking").value.trim();
    if (isNaN(valor)) return;

    asegurarPilaresPersona(p);
    if (pilar === "general") {
        const n = modo === "fijar" ? normalizarNota1a10(valor) : normalizarNota1a10(p.puntosCategoria + valor);
        p.pilares.fisico = n;
        p.pilares.gym = n;
        p.pilares.tecnico = n;
        p.pilares.actitud = n;
        p.pilares.bonus = 0;
    } else if (pilar === "bonus") {
        p.pilares.bonus = modo === "fijar" ? normalizarBonus1a10(valor) : normalizarBonus1a10((p.pilares.bonus || 0) + valor);
    } else if (p.pilares[pilar] !== undefined) {
        const nv = modo === "fijar" ? valor : p.pilares[pilar] + valor;
        p.pilares[pilar] = normalizarNota1a10(nv);
    }

    recalcularPuntajePonderado(p);
    p.motivoPuntos = motivo;
    guardarDatosCDM();
    e.target.reset();
    mostrarToast(`🏆 Score actualizado: ${p.apellido} (${p.puntosCategoria}/10)`);
    refrescarTodoAMS();
}

function poblarSelectsJugadoresAMS() {
    const activos = obtenerJugadoresCategoriaAMS(true);
    const html = activos.length
        ? activos.map(p => `<option value="${p.id}">${p.apellido}, ${p.nombre} (${p.puesto})</option>`).join("")
        : `<option value="">-- Sin jugadores activos --</option>`;

    ["selectJugadorRanking", "selectJugadorGym", "selectJugadorLab", "selectJugador360"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    });
}

function poblarCatalogoEjerciciosAMS() {
    const sel = document.getElementById("selectEjercicioGym");
    if (!sel) return;
    sel.innerHTML = baseCatalogoEjercicios.map(e => `<option value="${e.id}" data-tipo="${e.tipo}">${e.nombre}</option>`).join("");
    actualizarCamposEjercicio();
}

function actualizarCamposEjercicio() {
    const sel = document.getElementById("selectEjercicioGym");
    if (!sel || !sel.selectedOptions[0]) return;
    const tipo = sel.selectedOptions[0].dataset.tipo;

    const esUni = tipo === "unilateral_asimetria";
    document.getElementById("bloqueBilateral")?.classList.toggle("hidden", esUni);
    document.getElementById("bloqueUnilateral")?.classList.toggle("hidden", !esUni);
    document.getElementById("grupoRepsGym")?.classList.toggle("hidden", tipo !== "fuerza_1rm" && tipo !== "peso_corporal_lastre");
    document.getElementById("grupoLastreGym")?.classList.toggle("hidden", tipo !== "peso_corporal_lastre");
}

function agregarEjercicioCatalogo(e) {
    e.preventDefault();
    const nombre = document.getElementById("nuevoEjNombre").value.trim();
    const tipo = document.getElementById("nuevoEjTipo").value;
    if (!nombre) return;

    baseCatalogoEjercicios.push({ id: "ej_" + Date.now(), nombre, tipo });
    guardarDatosCDM();
    poblarCatalogoEjerciciosAMS();
    e.target.reset();
    mostrarToast("➕ Ejercicio agregado al catálogo.");
}

// REGISTRAR TEST EN AMS ELITE: NO ALTERA EL SCORE DEL JUGADOR AUTOMÁTICAMENTE
function registrarTestGimnasio(e) {
    e.preventDefault();
    const idJug = parseInt(document.getElementById("selectJugadorGym").value);
    const p = basePersonas.find(x => x.id === idJug);
    const selEj = document.getElementById("selectEjercicioGym");
    if (!p || !selEj || !selEj.selectedOptions[0]) return;

    const nombreEj = selEj.selectedOptions[0].text;
    const tipoEj = selEj.selectedOptions[0].dataset.tipo;
    const hoy = obtenerHoyISO();

    let valor = 0, unidad = "kg", detalle = "", diag = "";

    if (tipoEj === "unilateral_asimetria") {
        const izq = parseFloat(document.getElementById("inputIzqGym").value) || 0;
        const der = parseFloat(document.getElementById("inputDerGym").value) || 0;
        valor = Math.round(((izq + der) / 2) * 10) / 10;
        const asim = Math.round((Math.abs(izq - der) / Math.max(izq, der, 1)) * 1000) / 10;
        unidad = "prom";
        detalle = `Izq: ${izq} | Der: ${der} (Asimetría: ${asim}%)`;
        diag = asim > 12 ? `⚠️ Alerta de asimetría elevada (${asim}%). Reforzar lado débil.` : `✅ Simetría muscular óptima (${asim}%).`;
    } else if (tipoEj === "fuerza_1rm" || tipoEj === "peso_corporal_lastre") {
        const kgBase = parseFloat(document.getElementById("inputValorGym").value) || p.peso || 70;
        const lastre = tipoEj === "peso_corporal_lastre" ? (parseFloat(document.getElementById("inputLastreGym").value) || 0) : 0;
        const kgTotal = kgBase + lastre;
        const reps = parseInt(document.getElementById("inputRepsGym").value) || 1;
        const rm = Math.round((reps === 1 ? kgTotal : kgTotal * (1 + reps / 30)) * 10) / 10;
        const fRel = (rm / (p.peso || 70)).toFixed(2);
        valor = rm;
        unidad = "kg (1RM)";
        detalle = `${kgTotal}kg × ${reps} reps (1RM: ${rm}kg • F.Rel: ${fRel}x)`;
        diag = `💪 1RM Estimado: ${rm} kg (Fuerza relativa: ${fRel}x peso corporal).`;
    } else if (tipoEj === "salto_watts") {
        const cm = parseFloat(document.getElementById("inputValorGym").value) || 0;
        const watts = Math.round((60.7 * cm) + (45.3 * (p.peso || 70)) - 2055);
        valor = cm;
        unidad = "cm";
        detalle = `${cm} cm (${watts > 0 ? watts : 0} W)`;
        diag = `⚡ Potencia mecánica estimada (Sayers): ${watts > 0 ? watts : 0} Watts.`;
    } else {
        valor = parseFloat(document.getElementById("inputValorGym").value) || 0;
        unidad = tipoEj === "tiempo_sprint" ? "seg" : "m";
        detalle = `${valor} ${unidad}`;
        diag = `📊 Marca de campo registrada: ${detalle}.`;
    }

    p.evaluaciones.push({ id: Date.now(), fecha: hoy, ejercicio: nombreEj, tipo: "fuerza_kg", valor, unidad, detalle, nota: diag });
    guardarDatosCDM();

    const box = document.getElementById("diagnosticoGymBox");
    if (box) {
        box.innerHTML = `<strong>${p.apellido}, ${p.nombre} — ${nombreEj}:</strong> ${diag}`;
        box.classList.remove("hidden");
    }
    renderizarTablaGymAMS();
}

function renderizarTablaGymAMS() {
    const cont = document.getElementById("contenedorTablaGym");
    if (!cont) return;
    const activos = obtenerJugadoresCategoriaAMS(true);
    const filas = [];
    activos.forEach(p => {
        (p.evaluaciones || []).forEach(ev => {
            filas.push({ jugador: `${p.apellido}, ${p.nombre}`, fecha: ev.fecha, ejercicio: ev.ejercicio, detalle: ev.detalle });
        });
    });

    if (!filas.length) {
        cont.innerHTML = `<div class="empty-box">Sin evaluaciones físicas registradas en ${categoriaActiva}.</div>`;
        return;
    }

    cont.innerHTML = `<div class="table-wrap"><table class="app-table"><thead><tr><th>Fecha</th><th>Jugador</th><th>Prueba / Ejercicio</th><th>Resultado</th></tr></thead><tbody>` +
        filas.slice(-12).reverse().map(f => `<tr><td data-label="Fecha">${f.fecha}</td><td data-label="Jugador"><strong>${f.jugador}</strong></td><td data-label="Prueba / Ejercicio">${f.ejercicio}</td><td data-label="Resultado">${f.detalle}</td></tr>`).join("") +
        `</tbody></table></div>`;
}

function guardarDatosLaboratorio(e) {
    e.preventDefault();
    const idJug = parseInt(document.getElementById("selectJugadorLab").value);
    const p = basePersonas.find(x => x.id === idJug);
    if (!p) return;

    const peso = parseFloat(document.getElementById("labPeso").value) || p.peso;
    const grasa = parseFloat(document.getElementById("labGrasa").value) || null;
    const hemo = parseFloat(document.getElementById("labHemo").value) || 15;
    const ferri = parseFloat(document.getElementById("labFerri").value) || 50;
    const ck = parseFloat(document.getElementById("labCK").value) || 200;
    const glucosa = parseFloat(document.getElementById("labGlucosa").value) || 88;

    p.peso = peso;
    const alertas = [];
    if (hemo < 13.5) alertas.push("Hemoglobina baja (riesgo de anemia deportiva)");
    if (ferri < 35) alertas.push("Ferritina baja (reservas de hierro disminuidas)");
    if (ck > 350) alertas.push("CK elevada (alta fatiga o daño muscular)");

    const resumenClinico = alertas.length ? `⚠️ ${alertas.join(" • ")}` : "✅ Parámetros bioquímicos óptimos";
    p.clinico.push({
        id: Date.now(),
        fecha: obtenerHoyISO(),
        peso,
        grasa,
        hemo,
        ferri,
        ck,
        glucosa,
        rpe: ck > 350 ? 8 : 5,
        sueno: 4,
        dolor: resumenClinico
    });

    guardarDatosCDM();
    const box = document.getElementById("diagnosticoLabBox");
    if (box) {
        box.innerHTML = `<strong>Diagnóstico (${p.apellido}):</strong> ${resumenClinico}`;
        box.classList.remove("hidden");
    }
    e.target.reset();
    renderizarTablaLaboratorioAMS();
}

function renderizarTablaLaboratorioAMS() {
    const cont = document.getElementById("contenedorTablaLaboratorio");
    if (!cont) return;
    const activos = obtenerJugadoresCategoriaAMS(true);

    if (!activos.length) {
        cont.innerHTML = `<div class="empty-box">Sin jugadores activos en ${categoriaActiva}.</div>`;
        return;
    }

    cont.innerHTML = `<div class="table-wrap"><table class="app-table"><thead><tr><th>Jugador</th><th>Peso Actual</th><th>Hemoglobina</th><th>Ferritina</th><th>CK Muscular</th><th>Estado Bioquímico</th></tr></thead><tbody>` +
        activos.map(p => {
            const ult = (p.clinico || []).slice().reverse().find(c => c.hemo !== undefined) || p.clinico?.[p.clinico.length - 1] || {};
            return `
                <tr>
                    <td data-label="Jugador"><strong>${p.apellido}, ${p.nombre}</strong></td>
                    <td data-label="Peso Actual"><span><b>${p.peso} kg</b> ${ult.grasa ? `<small>(${ult.grasa}% grasa)</small>` : ""}</span></td>
                    <td data-label="Hemoglobina">${ult.hemo ? ult.hemo + " g/dL" : "-"}</td>
                    <td data-label="Ferritina">${ult.ferri ? ult.ferri + " ng/mL" : "-"}</td>
                    <td data-label="CK Muscular">${ult.ck ? ult.ck + " U/L" : "-"}</td>
                    <td data-label="Estado Bioquímico"><small>${ult.dolor || "Óptimo"}</small></td>
                </tr>
            `;
        }).join("") + `</tbody></table></div>`;
}

function renderizarPagina360() {
    const cont = document.getElementById("contenedorFicha360");
    const sel = document.getElementById("selectJugador360");
    if (!cont || !sel) return;

    const p = basePersonas.find(x => x.id === parseInt(sel.value));
    if (!p) {
        cont.innerHTML = `<div class="empty-box">Seleccioná un jugador activo para inspeccionar su Ficha 360°.</div>`;
        return;
    }

    asegurarPilaresPersona(p);
    cont.innerHTML = `
        <div class="card" style="padding:1.35rem; border-radius:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1rem;">
                <div>
                    <span class="badge badge-celeste">${p.deporte} • ${p.categoria}</span>
                    <span class="badge badge-purple">⭐ Score: ${p.puntosCategoria} / 10</span>
                    <h3 style="font-size:1.35rem; margin-top:0.35rem;">${p.nombre} ${p.apellido} (${p.puesto})</h3>
                    <small style="color:var(--ink-500);">DNI ${p.dni} • ${p.edad} años • ${p.peso} kg / ${p.altura} cm • Sangre ${p.sangre}</small>
                </div>
                <button class="btn btn-primary btn-sm" onclick="irAPaginaIndividual(${p.id})">Abrir Expediente Completo 360° →</button>
            </div>
            <div class="pillars-mini-grid">
                <div class="pillar-mini-item"><small>Físico (30%)</small><strong>${p.pilares.fisico} / 10</strong></div>
                <div class="pillar-mini-item"><small>Gimnasio (25%)</small><strong>${p.pilares.gym} / 10</strong></div>
                <div class="pillar-mini-item"><small>Técnico (25%)</small><strong>${p.pilares.tecnico} / 10</strong></div>
                <div class="pillar-mini-item"><small>Actitud (20%)</small><strong>${p.pilares.actitud} / 10</strong></div>
            </div>
        </div>
    `;
}

// =========================================================================
// 12. DEMO COMPLETA CON ESCALA 1 A 10 PARA DEPORTES Y GIMNASIO SEPARADO
// =========================================================================

function isoHaceDias(dias) {
    const d = new Date();
    d.setDate(d.getDate() - dias);
    return d.toISOString().split("T")[0];
}

function cargarDatosDemoCDM() {
    const d0 = isoHaceDias(0), d1 = isoHaceDias(1), d2 = isoHaceDias(2), d3 = isoHaceDias(3), d4 = isoHaceDias(4), d12 = isoHaceDias(12), d25 = isoHaceDias(25);

    basePersonas = [
        // FÚTBOL SUB 13 (Escala 1 a 10 controlada por el Admin)
        {
            id: 101, deporte: "Futbol", categoria: "Sub 13", puesto: "Centrodelantero (#9)",
            nombre: "Mateo", apellido: "Gómez", dni: "48111222", whatsapp: "5493584112233", edad: 13, sangre: "0+", peso: 54, altura: 162, pierna: "Derecha", brazo: "Derecho",
            activo: true, pilares: { fisico: 8.6, gym: 8.2, tecnico: 9.0, actitud: 9.2, bonus: 0.3 }, motivoPuntos: "Figura vs. San Basilio (+0.3 bonus)",
            frecuenciaSemanal: 3, estadoMedico: "Óptimo", pagoEstado: "Al Día", montoCuota: 25000,
            asistencias: [d4, d2, d0],
            clinico: [{ id: 1, fecha: d0, peso: 54, rpe: 6, sueno: 5, dolor: "Sin molestias" }],
            evaluaciones: [
                { id: 11, fecha: d25, ejercicio: "Sentadilla Trasera", tipo: "fuerza_kg", valor: 65, unidad: "kg (1RM)", detalle: "55 kg × 6 reps (1RM: 65 kg • F.Rel: 1.20x)", nota: "Base" },
                { id: 12, fecha: d12, ejercicio: "Sentadilla Trasera", tipo: "fuerza_kg", valor: 72, unidad: "kg (1RM)", detalle: "62 kg × 5 reps (1RM: 72 kg • F.Rel: 1.33x)", nota: "Progreso" },
                { id: 13, fecha: d0, ejercicio: "Sentadilla Trasera", tipo: "fuerza_kg", valor: 80, unidad: "kg (1RM)", detalle: "70 kg × 4 reps (1RM: 80 kg • F.Rel: 1.48x)", nota: "Récord" }
            ]
        },
        {
            id: 102, deporte: "Futbol", categoria: "Sub 13", puesto: "Enganche (#10)",
            nombre: "Bautista", apellido: "Torres", dni: "48222333", whatsapp: "5493584223344", edad: 13, sangre: "A+", peso: 51, altura: 159, pierna: "Izquierda", brazo: "Derecho",
            activo: true, pilares: { fisico: 8.0, gym: 7.6, tecnico: 8.8, actitud: 8.5, bonus: 0.1 }, motivoPuntos: "Asistencia de gol",
            frecuenciaSemanal: 3, estadoMedico: "Óptimo", pagoEstado: "Al Día", montoCuota: 25000,
            asistencias: [d4, d2, d0],
            clinico: [],
            evaluaciones: []
        },
        {
            id: 103, deporte: "Futbol", categoria: "Sub 13", puesto: "Volante Central (#5)",
            nombre: "Joaquín", apellido: "Ledesma", dni: "48333444", whatsapp: "5493584334455", edad: 13, sangre: "0+", peso: 55, altura: 163, pierna: "Derecha", brazo: "Derecho",
            activo: true, pilares: { fisico: 8.4, gym: 8.0, tecnico: 7.8, actitud: 9.0, bonus: 0 }, motivoPuntos: "Gran despliegue físico",
            frecuenciaSemanal: 3, estadoMedico: "Óptimo", pagoEstado: "Al Día", montoCuota: 25000,
            asistencias: [d3, d0],
            clinico: [],
            evaluaciones: []
        },
        {
            id: 104, deporte: "Futbol", categoria: "Sub 13", puesto: "Arquero (#1)",
            nombre: "Santino", apellido: "Ferreira", dni: "48444555", whatsapp: "5493584445566", edad: 13, sangre: "B+", peso: 58, altura: 168, pierna: "Derecha", brazo: "Derecho",
            activo: true, pilares: { fisico: 7.8, gym: 8.0, tecnico: 8.2, actitud: 8.8, bonus: 0 }, motivoPuntos: "Valla firme",
            frecuenciaSemanal: 3, estadoMedico: "Óptimo", pagoEstado: "Al Día", montoCuota: 25000,
            asistencias: [d4, d2, d0],
            clinico: [],
            evaluaciones: []
        },
        {
            id: 105, deporte: "Futbol", categoria: "Sub 13", puesto: "Extremo Derecho (#7)",
            nombre: "Thiago", apellido: "Mansilla", dni: "48999000", whatsapp: "5493584771122", edad: 13, sangre: "0+", peso: 52, altura: 160, pierna: "Derecha", brazo: "Derecho",
            activo: true, pilares: { fisico: 8.3, gym: 7.5, tecnico: 8.4, actitud: 8.6, bonus: 0 }, motivoPuntos: "Relevo desequilibrante",
            frecuenciaSemanal: 3, estadoMedico: "Óptimo", pagoEstado: "Al Día", montoCuota: 25000,
            asistencias: [d4, d2, d0],
            clinico: [],
            evaluaciones: []
        },
        // FÚTBOL PRIMERA (Escala 1 a 10)
        {
            id: 106, deporte: "Futbol", categoria: "Primera", puesto: "Marcador Central (#2)",
            nombre: "Facundo", apellido: "Quiroga", dni: "36999888", whatsapp: "5493584334455", edad: 25, sangre: "0-", peso: 81, altura: 184, pierna: "Derecha", brazo: "Derecho",
            activo: true, pilares: { fisico: 9.1, gym: 9.2, tecnico: 8.5, actitud: 9.5, bonus: 0.3 }, motivoPuntos: "Capitán Primera División",
            frecuenciaSemanal: 4, estadoMedico: "Óptimo", pagoEstado: "Al Día", montoCuota: 25000,
            asistencias: [d4, d3, d1, d0],
            clinico: [],
            evaluaciones: []
        },
        // HOCKEY SUB 13 (Escala 1 a 10)
        {
            id: 201, deporte: "Hockey", categoria: "Sub 13", puesto: "Wing Derecha (#8)",
            nombre: "Valentina", apellido: "Ruiz", dni: "48555666", whatsapp: "5493584556677", edad: 13, sangre: "B+", peso: 49, altura: 158, pierna: "Derecha", brazo: "Derecho",
            activo: true, pilares: { fisico: 8.8, gym: 8.0, tecnico: 9.0, actitud: 9.2, bonus: 0.2 }, motivoPuntos: "Gol de córner corto",
            frecuenciaSemanal: 3, estadoMedico: "Óptimo", pagoEstado: "Al Día", montoCuota: 25000,
            asistencias: [d4, d2, d0],
            clinico: [],
            evaluaciones: []
        },
        {
            id: 202, deporte: "Hockey", categoria: "Sub 13", puesto: "Cinco / Volante Central (#5)",
            nombre: "Martina", apellido: "Sosa", dni: "48666777", whatsapp: "5493584667788", edad: 13, sangre: "0+", peso: 50, altura: 160, pierna: "Derecha", brazo: "Derecho",
            activo: true, pilares: { fisico: 8.5, gym: 7.8, tecnico: 8.4, actitud: 9.0, bonus: 0.1 }, motivoPuntos: "Distribución y quites",
            frecuenciaSemanal: 3, estadoMedico: "Óptimo", pagoEstado: "Al Día", montoCuota: 25000,
            asistencias: [d4, d2, d0],
            clinico: [],
            evaluaciones: []
        },
        {
            id: 203, deporte: "Hockey", categoria: "Sub 13", puesto: "Líbero / Cierre (#2)",
            nombre: "Catalina", apellido: "Moyano", dni: "48777888", whatsapp: "5493584778899", edad: 13, sangre: "A+", peso: 52, altura: 162, pierna: "Derecha", brazo: "Derecho",
            activo: true, pilares: { fisico: 8.2, gym: 8.4, tecnico: 8.6, actitud: 8.8, bonus: 0 }, motivoPuntos: "Arrastrada en córner corto",
            frecuenciaSemanal: 3, estadoMedico: "Óptimo", pagoEstado: "Al Día", montoCuota: 25000,
            asistencias: [d4, d2, d0],
            clinico: [],
            evaluaciones: []
        },
        // SOCIOS EXCLUSIVOS DEL GIMNASIO (Sin Score deportivo)
        {
            id: 301, deporte: "Gimnasio", categoria: "General", puesto: "Musculación e Hipertrofia",
            nombre: "Lucas", apellido: "Peralta", dni: "39111444", whatsapp: "5493584889900", edad: 26, sangre: "0+", peso: 78, altura: 176, pierna: "Derecha", brazo: "Derecho",
            activo: true, pilares: null, puntosCategoria: null, motivoPuntos: "",
            frecuenciaSemanal: 3, estadoMedico: "Óptimo", pagoEstado: "Al Día", montoCuota: 25000,
            asistencias: [d4, d2, d0],
            clinico: [],
            evaluaciones: [
                { id: 51, fecha: d25, ejercicio: "Press de Banca Plano", tipo: "fuerza_kg", valor: 88, unidad: "kg (1RM)", detalle: "78 kg × 4 reps (1RM: 88 kg • F.Rel: 1.13x)", nota: "" },
                { id: 52, fecha: d0, ejercicio: "Press de Banca Plano", tipo: "fuerza_kg", valor: 102, unidad: "kg (1RM)", detalle: "88 kg × 5 reps (1RM: 102 kg • F.Rel: 1.31x)", nota: "PR en Banca" },
                { id: 53, fecha: d0, ejercicio: "Sentadilla Trasera con Barra", tipo: "fuerza_kg", valor: 130, unidad: "kg (1RM)", detalle: "115 kg × 4 reps (1RM: 130 kg • F.Rel: 1.67x)", nota: "Excelente profundidad" }
            ]
        },
        {
            id: 302, deporte: "Gimnasio", categoria: "General", puesto: "Funcional, Core y Salud",
            nombre: "Martín", apellido: "Cabrera", dni: "41222555", whatsapp: "5493584990011", edad: 23, sangre: "A+", peso: 84, altura: 179, pierna: "Derecha", brazo: "Derecho",
            activo: true, pilares: null, puntosCategoria: null, motivoPuntos: "",
            frecuenciaSemanal: 5, estadoMedico: "Sobrecarga / Precaución", pagoEstado: "Pendiente", montoCuota: 25000,
            asistencias: [d3, d1],
            clinico: [],
            evaluaciones: [
                { id: 54, fecha: d0, ejercicio: "Peso Muerto Rumano", tipo: "fuerza_kg", valor: 95, unidad: "kg (1RM)", detalle: "80 kg × 6 reps (1RM: 95 kg • F.Rel: 1.13x)", nota: "" }
            ]
        },
        {
            id: 303, deporte: "Gimnasio", categoria: "General", puesto: "Fuerza y Potencia",
            nombre: "Sofía", apellido: "Navarro", dni: "42888999", whatsapp: "5493584778800", edad: 24, sangre: "0+", peso: 60, altura: 165, pierna: "Derecha", brazo: "Derecho",
            activo: true, pilares: null, puntosCategoria: null, motivoPuntos: "",
            frecuenciaSemanal: 3, estadoMedico: "Óptimo", pagoEstado: "Al Día", montoCuota: 25000,
            asistencias: [d4, d2, d0],
            clinico: [],
            evaluaciones: [
                { id: 55, fecha: d0, ejercicio: "Hip Thrust con Barra", tipo: "fuerza_kg", valor: 125, unidad: "kg (1RM)", detalle: "105 kg × 6 reps (1RM: 125 kg • F.Rel: 2.08x)", nota: "Récord Femenino Gym" }
            ]
        }
    ];

    baseAlineaciones = {
        "Futbol_Sub 13_4-3-3": {
            0: 104, // #1 Arquero -> Santino Ferreira
            6: 103, // #5 Volante Central -> Joaquín Ledesma
            7: 102, // #10 Enganche -> Bautista Torres
            9: 101  // #9 Centrodelantero -> Mateo Gómez
        },
        "Hockey_Sub 13_3-4-3": {
            2: 203, // #2 Líbero/Cierre -> Catalina Moyano
            5: 202, // #5 Cinco -> Martina Sosa
            8: 201  // #8 Wing Derecha -> Valentina Ruiz
        }
    };

    baseRutinas = [
        {
            id: 501, esGrupal: true, deporteDestino: "Futbol", categoriaDestino: "Sub 13", personaId: null,
            etiquetaDestino: "🏟️ Plantel Futbol Sub 13", fecha: new Date().toLocaleDateString("es-AR"),
            nombre: "Potencia Explosiva y Prevención", objetivo: "Potencia y Transferencia", dias: "Martes y Jueves", notas: "Cuidar técnica en caída.",
            ejercicios: [
                { nombre: "Sentadilla Trasera con Barra", series: 4, reps: "6", peso: "Moderado", pausa: "90s", forma: "Subir rápido" },
                { nombre: "Plancha Abdominal RKC y Core Antirotacional", series: 3, reps: "35s", peso: "Peso Corp.", pausa: "45s", forma: "Abdomen firme" }
            ]
        },
        {
            id: 502, esGrupal: false, deporteDestino: "Gimnasio", categoriaDestino: "General", personaId: 301,
            etiquetaDestino: "👤 Lucas Peralta", fecha: new Date().toLocaleDateString("es-AR"),
            nombre: "Día 1 - Hipertrofia Empuje y Tracción", objetivo: "Hipertrofia Estructural", dias: "Lunes, Miércoles y Viernes", notas: "RIR 1-2 en series principales.",
            ejercicios: [
                { nombre: "Press de Banca Plano", series: 4, reps: "8", peso: "85kg", pausa: "2m", forma: "Controlar excéntrica" },
                { nombre: "Dominadas / Jalón al Pecho en Polea", series: 4, reps: "8-10", peso: "Lastre 10kg", pausa: "90s", forma: "Rango completo" },
                { nombre: "Remo Unilateral con Mancuerna", series: 3, reps: "10 c/lado", peso: "32kg", pausa: "75s", forma: "Tracción a la cadera" }
            ]
        },
        {
            id: 503, esGrupal: false, deporteDestino: "Gimnasio", categoriaDestino: "General", personaId: 303,
            etiquetaDestino: "👤 Sofía Navarro", fecha: new Date().toLocaleDateString("es-AR"),
            nombre: "Día 1 - Fuerza Tren Inferior y Glúteos", objetivo: "Fuerza Máxima", dias: "Lunes, Miércoles y Viernes", notas: "Pausa de 1 seg arriba en Hip Thrust.",
            ejercicios: [
                { nombre: "Hip Thrust con Barra (Empuje de Cadera)", series: 4, reps: "8-10", peso: "100kg", pausa: "90s", forma: "Contracción máxima arriba" },
                { nombre: "Sentadilla Búlgara Unilateral", series: 3, reps: "8 c/pierna", peso: "Mancuernas 16kg", pausa: "75s", forma: "Torso levemente inclinado" },
                { nombre: "Peso Muerto Rumano (Isquios y Glúteos)", series: 4, reps: "8", peso: "65kg", pausa: "90s", forma: "Espalda neutra" }
            ]
        }
    ];

    basePartidos = [
        {
            id: 601, fecha: d1, deporte: "Futbol", categoria: "Sub 13", rival: "vs. San Basilio", resultado: "2 - 1", formacion: "4-3-3",
            eventos: [
                { id: 1, minuto: 24, minutoDisplay: "1T • 24'", jugadorId: 101, jugadorNombre: "Gómez, Mateo", puestoEnCancha: "#9 DC", tipo: "⚽ Gol Convertido", detalle: "Remate cruzado", impactoPuntos: 0.3 }
            ],
            conclusion: "Resumen vs San Basilio (2 - 1): Se registraron 1 intervenciones con 0 modificaciones tácticas (1 goles, 0 recuperaciones, 0 pérdidas). Destacados: Gómez, Mateo (#9 DC: +0.3).",
            resumenJugadores: [{ id: 101, nombre: "Gómez, Mateo", puesto: "#9 DC", eventos: 1, puntosSugeridos: 0.3 }],
            puntosAplicadosAlRanking: true
        }
    ];

    baseVideoteca = [...VIDEOTECA_POR_DEFECTO];
    basePersonas.forEach(p => asegurarPilaresPersona(p));
    guardarDatosCDM();
    mostrarToast("🌟 Demo cargada (Score 1 a 10 en Deportes + Gimnasio separado).");
    setTimeout(() => window.location.reload(), 600);
}

function limpiarTodoElSistema() {
    if (!confirm("¿Vaciar todos los datos del sistema?")) return;
    basePersonas = [];
    baseRutinas = [];
    basePartidos = [];
    baseAlineaciones = {};
    baseMicrociclos = {};
    guardarDatosCDM();
    mostrarToast("🗑️ Sistema limpio.");
    setTimeout(() => window.location.reload(), 600);
}

// =========================================================================
// 13. INICIALIZACIÓN AUTOMÁTICA MULTIPÁGINA
// =========================================================================

document.addEventListener("DOMContentLoaded", () => {
    asegurarBotonTemaEnTopbarCDM();
    sincronizarEstadoDesdeServidorCDM().then((huboActualizacionRemota) => {
        if (huboActualizacionRemota) {
            inicializarIndex();
            if (deportePagina) renderizarPaginaDeporte();
            if (document.body.dataset.page === "perfil-individual") inicializarPaginaJugadorIndividual();
            if (document.getElementById("homeCategoryGrid")) inicializarAnalisisJugadoresAMS();
            if (document.body.dataset.page === "mi-ficha") inicializarPanelSocio();
        }
    });
    asegurarVideotecaCargada();
    basePersonas.forEach(p => asegurarPilaresPersona(p));
    inyectarEstilosAvanzadosCDM();
    inyectarNuevasSeccionesDOM();
    inicializarIndex();

    if (deportePagina) {
        if (deportePagina === "Hockey") periodoPartidoActual = "1C";
        agregarFilaRutinaAdminGym();
        renderizarPaginaDeporte();
    }

    if (document.body.dataset.page === "perfil-individual") {
        agregarFilaEjercicioIndividual();
        inicializarPaginaJugadorIndividual();
    }

    if (document.getElementById("homeCategoryGrid")) {
        inicializarAnalisisJugadoresAMS();
    }

    if (document.body.dataset.page === "mi-ficha") {
        inicializarPanelSocio();
    }

    if (typeof verificarAccesoYRolEnApp === "function") {
        verificarAccesoYRolEnApp();
    }
});

// =========================================================================
// 14. MOTOR DEL PORTAL DEL SOCIO / DEPORTISTA POR CÓDIGO O DNI (MI-FICHA.HTML)
// =========================================================================

function autenticarSocioPorDni(e) {
    e.preventDefault();
    const valor = (document.getElementById("inputDniSocioLogin")?.value || "").trim().toUpperCase();
    if (!valor) return;

    basePersonas.forEach(p => asegurarPilaresPersona(p));
    const limpio = valor.replace(/[^A-Z0-9]/g, "");

    const socio = basePersonas.find(p => {
        if (!p.activo) return false;
        const cod = (p.codigoAcceso || "").toUpperCase();
        const codLimpio = cod.replace(/[^A-Z0-9]/g, "");
        return p.dni === valor || cod === valor || codLimpio === limpio || cod.replace("CDM-", "") === valor;
    });

    if (!socio) {
        alert("❌ No se encontró ningún deportista o socio activo con ese Código o DNI. Pedile tu código personal al Profesor.");
        return;
    }

    sessionStorage.setItem("cdm_socio_dni_activo", socio.dni);
    mostrarToast(`👋 ¡Bienvenido/a, ${socio.nombre}!`);
    inicializarPanelSocio();
}

function obtenerSocioLogueadoURLoSession() {
    const dniSesion = sessionStorage.getItem("cdm_socio_dni_activo");
    if (dniSesion) {
        const porDni = basePersonas.find(p => p.dni === dniSesion && p.activo);
        if (porDni) return porDni;
    }
    try {
        const sesionGlobal = JSON.parse(localStorage.getItem("cdm_sesion_activa_v1"));
        if (sesionGlobal && sesionGlobal.personaId) {
            return basePersonas.find(p => p.id === sesionGlobal.personaId && p.activo) || null;
        }
    } catch {
        return null;
    }
    return null;
}

function cerrarSesionSocio() {
    sessionStorage.removeItem("cdm_socio_dni_activo");
    window.location.reload();
}

function cambiarTabSocio(seccion, btnEl) {
    document.querySelectorAll(".socio-seccion").forEach(s => {
        s.classList.add("hidden");
        s.classList.remove("animate-in");
    });
    const sec = document.getElementById(`socio-sec-${seccion}`);
    if (sec) {
        sec.classList.remove("hidden");
        sec.classList.add("animate-in");
    }
    document.querySelectorAll(".module-tabs .mod-tab").forEach(b => b.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");
}

function inicializarPanelSocio() {
    if (document.body.dataset.page !== "mi-ficha") return;

    const socio = obtenerSocioLogueadoURLoSession();
    const panelLogin = document.getElementById("panelLoginSocio");
    const panelDash = document.getElementById("panelDashboardSocio");

    if (!socio) {
        panelLogin?.classList.remove("hidden");
        panelDash?.classList.add("hidden");
        return;
    }

    panelLogin?.classList.add("hidden");
    panelDash?.classList.remove("hidden");
    asegurarPilaresPersona(socio);
    asegurarVideotecaCargada();

    const cabecera = document.getElementById("socioCabeceraInfo");
    if (cabecera) {
        const fueSem = contarAsistenciasUltimos7Dias(socio);
        const pactado = socio.frecuenciaSemanal || 3;
        const alDia = (socio.pagoEstado || "Al Día") === "Al Día";

        cabecera.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                <div style="display:flex; align-items:center; gap:1rem;">
                    ${renderAvatarPersonaCDM(socio, 68, "1.35rem", true)}
                    <div>
                        <div style="display:flex; gap:0.35rem; flex-wrap:wrap; margin-bottom:0.25rem;">
                            <span class="badge badge-celeste">${socio.deporte} • ${socio.deporte === "Gimnasio" ? "Socio Gym" : socio.categoria}</span>
                            <span class="badge badge-purple" style="font-family:var(--font-mono);">🔑 ${socio.codigoAcceso}</span>
                            ${socio.deporte !== "Gimnasio" ? `<span class="badge badge-purple">⭐ Score: ${socio.puntosCategoria} / 10</span>` : ""}
                            <span class="badge ${fueSem < pactado ? "badge-warn" : "badge-ok"}">📅 Semana: ${fueSem}/${pactado} días</span>
                            <span class="badge ${alDia ? "badge-ok" : "badge-danger"}">${alDia ? "💳 Cuota Al Día" : "⚠️ Cuota Pendiente"}</span>
                        </div>
                        <h2 style="font-size:1.35rem; font-weight:900;">${socio.nombre} ${socio.apellido}</h2>
                        <small style="color:var(--ink-500); font-weight:700;">${socio.puesto} • DNI ${socio.dni} • 📱 ${socio.whatsapp}</small>
                    </div>
                </div>
                <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                    <button type="button" class="btn btn-secondary btn-sm btn-foto-perfil-cdm" onclick="abrirPanelFotoPerfilCDM(${socio.id})"><i class="ri-camera-lens-line"></i> Mi Foto</button>
                    <button class="btn btn-whatsapp btn-sm" onclick="enviarMensajeProfeWhatsApp('${socio.nombre}')"><i class="ri-whatsapp-line"></i> Consultar al Profe</button>
                </div>
            </div>
        `;
    }

    renderizarRutinasSocio(socio);

    const selEx = document.getElementById("socioSelectEjercicio");
    const ejerciciosUnicos = [...new Set(socio.evaluaciones.map(e => e.ejercicio))];
    if (selEx) {
        selEx.innerHTML = ejerciciosUnicos.length
            ? ejerciciosUnicos.map(nom => `<option value="${nom}">${nom}</option>`).join("")
            : `<option value="">-- Sin marcas registradas aún --</option>`;
    }
    renderizarGraficoSocio(socio);
    renderizarRankingSocio(socio);
}

function renderizarRutinasSocio(socio) {
    const cont = document.getElementById("socioListaRutinas");
    if (!cont) return;

    const rutinas = baseRutinas.filter(r =>
        r.personaId === socio.id ||
        (r.esGrupal && r.deporteDestino === socio.deporte && r.categoriaDestino === socio.categoria)
    );

    if (!rutinas.length) {
        cont.innerHTML = `<div class="empty-box" style="grid-column:1/-1;">No tenés rutinas asignadas en este momento. Hablá con tu profesor para que te cargue una.</div>`;
        return;
    }

    cont.innerHTML = rutinas.map(r => `
        <div class="athlete-card" style="cursor:default;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <span class="badge ${r.esGrupal ? "badge-purple" : "badge-celeste"}">${r.esGrupal ? "🏟️ Rutina Grupal" : "👤 Rutina Personalizada"}</span>
                    <h4 style="font-size:1.05rem; margin-top:4px;">${r.nombre}</h4>
                    <small style="color:var(--ink-500)">${r.objetivo} • Días: ${r.dias}</small>
                </div>
            </div>
            <div style="margin-top:0.5rem; display:flex; flex-direction:column; gap:0.4rem;">
                ${r.ejercicios.map((ex, i) => {
                    const matchVideo = baseVideoteca.find(v => v.nombre.toLowerCase().includes(ex.nombre.toLowerCase()) || ex.nombre.toLowerCase().includes(v.nombre.toLowerCase()));
                    return `
                        <div style="padding:0.6rem 0.75rem; background:var(--surface-subtle); border:1px solid var(--line); border-radius:10px; font-size:0.83rem;">
                            <strong>${i + 1}. ${ex.nombre}</strong>
                            <div style="display:flex; gap:0.8rem; font-size:0.75rem; color:var(--ink-500); margin-top:2px;">
                                <span>📊 ${ex.series}×${ex.reps}</span><span>🏋️ Carga: ${ex.peso}</span><span>⏱️ ${ex.pausa}</span>
                            </div>
                            ${ex.forma ? `<div style="margin-top:3px; font-size:0.75rem; color:var(--cdm-700);">💡 <i>${ex.forma}</i></div>` : ""}
                            ${matchVideo ? `<button class="btn btn-primary btn-sm" style="margin-top:0.4rem; padding:0.2rem 0.5rem; font-size:0.7rem;" onclick="abrirModalReproductorEjercicio(${matchVideo.id})">▶ Ver Video Técnica</button>` : ""}
                        </div>
                    `;
                }).join("")}
            </div>
            ${r.notas ? `<div style="margin-top:0.5rem; font-size:0.8rem; background:rgba(0,149,219,0.08); padding:0.5rem; border-radius:8px;">📝 <b>Nota del Profe:</b> ${r.notas}</div>` : ""}
        </div>
    `).join("");
}

function renderizarGraficoSocio(socioOpt = null) {
    const socio = socioOpt || obtenerJugadorActualPorURL() || obtenerSocioLogueadoURLoSession();
    const canvas = document.getElementById("canvasSocioProgreso");
    if (!canvas || !socio) return;

    const nombreEx = document.getElementById("socioSelectEjercicio")?.value;
    const datosEx = socio.evaluaciones.filter(ev => ev.ejercicio === nombreEx).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    if (window.chartSocioInstancia) {
        window.chartSocioInstancia.destroy();
        window.chartSocioInstancia = null;
    }

    if (!datosEx.length) return;

    window.chartSocioInstancia = new Chart(canvas.getContext("2d"), {
        type: "line",
        data: {
            labels: datosEx.map(d => d.fecha),
            datasets: [{
                label: `${nombreEx} (${datosEx[0].unidad})`,
                data: datosEx.map(d => d.valor),
                borderColor: "#0095db",
                backgroundColor: "rgba(0, 149, 219, 0.16)",
                borderWidth: 3,
                pointRadius: 5,
                fill: true,
                tension: 0.32
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderizarRankingSocio(socio) {
    const cont = document.getElementById("socioTablaRankingDiv");
    if (!cont) return;

    if (socio.deporte === "Gimnasio") {
        cont.innerHTML = `<div class="empty-box">El sistema de ranking competitivo es exclusivo para planteles de Fútbol y Hockey. ¡Seguimiento personalizado en tu sección de rutinas y 1RM!</div>`;
        return;
    }

    const activos = basePersonas.filter(p => p.deporte === socio.deporte && p.categoria === socio.categoria && p.activo);
    activos.forEach(p => asegurarPilaresPersona(p));
    activos.sort((a, b) => b.puntosCategoria - a.puntosCategoria);

    cont.innerHTML = `<div class="table-wrap"><table class="app-table"><thead><tr><th>Pos</th><th>Deportista</th><th>Puesto</th><th>Score Oficial (1-10)</th></tr></thead><tbody>` +
        activos.map((p, i) => `
            <tr style="${p.id === socio.id ? "background:var(--cdm-50); font-weight:bold;" : ""}">
                <td data-label="Pos"><strong>#${i + 1}°</strong></td>
                <td data-label="Deportista"><span><strong>${p.apellido}, ${p.nombre}</strong> ${p.id === socio.id ? '<span class="badge badge-ok">Vos</span>' : ''}</span></td>
                <td data-label="Puesto">${p.puesto}</td>
                <td data-label="Score Oficial (1-10)"><span class="badge badge-purple">⭐ ${p.puntosCategoria} / 10</span></td>
            </tr>
        `).join("") + `</tbody></table></div>`;
}

function enviarMensajeProfeWhatsApp(nombreSocio) {
    const tel = "5493584000000";
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(`Hola Profe, soy ${nombreSocio}. Le escribo desde el portal del club para consultarle sobre mis entrenamientos.`)}`, "_blank");

}
// =========================================================================
// 15. COMPLEMENTO MULTI-DEPORTE (CANCHAS, PILETA OLÍMPICA Y TARJETAS LIMPIAS)
// Compatible 100% con app.js original sin modificar funciones base
// =========================================================================

const ESCENARIOS_EXTRA_COMPLEMENTO = {
    natacion: {
        titulo: "🏊 Pileta Olímpica — Carriles y Series",
        clasePitch: "pitch-natacion",
        btnAuto: "⚡ Llenar Carriles",
        periodos: [
            { val: "Serie 1", txt: "Serie 1 • 50m Libre" },
            { val: "Serie 2", txt: "Serie 2 • 100m Libre" },
            { val: "Espalda", txt: "Serie • Espalda / Pecho" },
            { val: "Mariposa", txt: "Serie • Mariposa / Combinado" },
            { val: "Posta", txt: "Posta 4×50m Relevos" }
        ],
        esquemas: {
            "Pileta 6 Carriles": [
                { num: 1, sigla: "C1", nombrePuesto: "Carril 1 (Andarivel 1)", x: 11, y: 76 },
                { num: 2, sigla: "C2", nombrePuesto: "Carril 2 (Andarivel 2)", x: 26.5, y: 56 },
                { num: 3, sigla: "C3", nombrePuesto: "Carril 3 (Central Rápido)", x: 42, y: 36 },
                { num: 4, sigla: "C4", nombrePuesto: "Carril 4 (Central Rápido)", x: 58, y: 36 },
                { num: 5, sigla: "C5", nombrePuesto: "Carril 5 (Andarivel 5)", x: 73.5, y: 56 },
                { num: 6, sigla: "C6", nombrePuesto: "Carril 6 (Andarivel 6)", x: 89, y: 76 }
            ],
            "Pileta 8 Carriles": [
                { num: 1, sigla: "C1", nombrePuesto: "Carril 1", x: 8, y: 80 },
                { num: 2, sigla: "C2", nombrePuesto: "Carril 2", x: 20, y: 65 },
                { num: 3, sigla: "C3", nombrePuesto: "Carril 3", x: 32, y: 50 },
                { num: 4, sigla: "C4", nombrePuesto: "Carril 4 (Central)", x: 44, y: 34 },
                { num: 5, sigla: "C5", nombrePuesto: "Carril 5 (Central)", x: 56, y: 34 },
                { num: 6, sigla: "C6", nombrePuesto: "Carril 6", x: 68, y: 50 },
                { num: 7, sigla: "C7", nombrePuesto: "Carril 7", x: 80, y: 65 },
                { num: 8, sigla: "C8", nombrePuesto: "Carril 8", x: 92, y: 80 }
            ]
        },
        acciones: [
            "🏊 Marca Personal / Tiempo Oficial",
            "🥇 1° Puesto en la Serie (Gol/Punto)",
            "⚡ Salida Explosiva del Taco",
            "🔄 Vuelta Americana Rápida",
            "⏱️ Parcial / Split Registrado",
            "⚠️ Toque Irregular / Salida Falsa"
        ],
        lineasHTML: `<div class="pool-deck-top"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span></div><div class="pool-flags-top"></div><div class="pool-lane-lines"></div><div class="pool-flags-bottom"></div>`
    },
    basquet: {
        titulo: "🏀 Cancha de Básquet — Quinteto en Vivo",
        clasePitch: "pitch-basquet",
        btnAuto: "⚡ Auto 5",
        periodos: [
            { val: "1C", txt: "1° Cuarto (0' a 10')" },
            { val: "2C", txt: "2° Cuarto (10' a 20')" },
            { val: "3C", txt: "3° Cuarto (20' a 30')" },
            { val: "4C", txt: "4° Cuarto (30' a 40')" }
        ],
        esquemas: {
            "Quinteto Ofensivo (5-Out)": [
                { num: 4, sigla: "BASE", nombrePuesto: "Base Conductor (#1)", x: 50, y: 74 },
                { num: 7, sigla: "ESC", nombrePuesto: "Escolta Tirador (#2)", x: 82, y: 58 },
                { num: 10, sigla: "ALE", nombrePuesto: "Alero (#3)", x: 18, y: 58 },
                { num: 12, sigla: "AP", nombrePuesto: "Ala-Pívot (#4)", x: 74, y: 26 },
                { num: 15, sigla: "PIV", nombrePuesto: "Pívot Poste Bajo (#5)", x: 30, y: 22 }
            ],
            "Defensa Zona 2-1-2": [
                { num: 4, sigla: "BASE", nombrePuesto: "Base Primera Línea", x: 34, y: 66 },
                { num: 7, sigla: "ESC", nombrePuesto: "Escolta Primera Línea", x: 66, y: 66 },
                { num: 10, sigla: "ALE", nombrePuesto: "Alero Centro Zona", x: 50, y: 45 },
                { num: 12, sigla: "AP", nombrePuesto: "Ala-Pívot Pintura", x: 26, y: 24 },
                { num: 15, sigla: "PIV", nombrePuesto: "Pívot Aro", x: 74, y: 24 }
            ]
        },
        acciones: [
            "🏀 Triple Convertido (Gol)",
            "🏀 Doble Convertido (Gol)",
            "🎯 Tiro Libre Convertido (Gol)",
            "🖐️ Rebote Defensivo / Ofensivo (Quite)",
            "⚡ Asistencia / Robo de Balón (Pase)",
            "🧱 Tapa / Bloqueo (Quite)",
            "⚠️ Pérdida / Falta Personal"
        ],
        lineasHTML: `<div class="pitch-line-half"></div><div class="pitch-circle-center"></div><div class="bball-arc-top"></div><div class="bball-key-top"></div><div class="bball-arc-bottom"></div><div class="bball-key-bottom"></div>`
    },
    voley: {
        titulo: "🏐 Cancha de Vóley — Rotación 6 vs 6",
        clasePitch: "pitch-voley",
        btnAuto: "⚡ Auto 6",
        periodos: [
            { val: "Set 1", txt: "1° Set (25 pts)" },
            { val: "Set 2", txt: "2° Set (25 pts)" },
            { val: "Set 3", txt: "3° Set (25 pts)" },
            { val: "Set 4", txt: "4° Set (25 pts)" },
            { val: "Set 5", txt: "5° Set Tie-Break (15 pts)" }
        ],
        esquemas: {
            "Sistema 5-1 Oficial": [
                { num: 4, sigla: "P4", nombrePuesto: "Punta Receptor (Pos. 4)", x: 22, y: 58 },
                { num: 3, sigla: "C3", nombrePuesto: "Central Bloqueo (Pos. 3)", x: 50, y: 56 },
                { num: 2, sigla: "OP2", nombrePuesto: "Opuesto (Pos. 2)", x: 78, y: 58 },
                { num: 5, sigla: "Z5", nombrePuesto: "Zaguero Izq. / Líbero (Pos. 5)", x: 22, y: 82 },
                { num: 6, sigla: "Z6", nombrePuesto: "Zaguero Centro (Pos. 6)", x: 50, y: 84 },
                { num: 1, sigla: "ARM", nombrePuesto: "Armador / Saque (Pos. 1)", x: 78, y: 82 }
            ]
        },
        acciones: [
            "🏐 Punto de Remate / Ataque (Gol)",
            "🧱 Punto de Bloqueo Directo (Gol)",
            "🚀 Saque Directo Ace (Gol)",
            "🛡️ Defensa / Recepción Positiva (Quite)",
            "🎯 Armado / Habilitación (Pase)",
            "⚠️ Error de Saque / Toque de Red"
        ],
        lineasHTML: `<div class="voley-net-line"><span>RED</span></div><div class="voley-3m-top"></div><div class="voley-3m-bottom"></div>`
    },
    padel: {
        titulo: "🎾 Cancha de Pádel / Tenis — Parejas y Sets",
        clasePitch: "pitch-padel",
        btnAuto: "⚡ Auto Pareja",
        periodos: [
            { val: "Set 1", txt: "1° Set" },
            { val: "Set 2", txt: "2° Set" },
            { val: "Set 3", txt: "3° Set / Super Tie-Break" }
        ],
        esquemas: {
            "Dobles (2 vs 2)": [
                { num: 1, sigla: "REV", nombrePuesto: "Jugador Revés (Local)", x: 30, y: 74 },
                { num: 2, sigla: "DRV", nombrePuesto: "Jugador Drive (Local)", x: 70, y: 74 },
                { num: 3, sigla: "RIV1", nombrePuesto: "Compañero 3 / Rival Revés", x: 30, y: 26 },
                { num: 4, sigla: "RIV2", nombrePuesto: "Compañero 4 / Rival Drive", x: 70, y: 26 }
            ],
            "Singles (1 vs 1)": [
                { num: 1, sigla: "J1", nombrePuesto: "Jugador Base 1", x: 50, y: 76 },
                { num: 2, sigla: "J2", nombrePuesto: "Jugador Base 2", x: 50, y: 24 }
            ]
        },
        acciones: [
            "🎾 Winner / Smash Ganador (Gol)",
            "🚀 Ace de Saque (Gol)",
            "🧱 Bandeja / Víbora Profunda (Pase)",
            "🛡️ Globo / Salida de Pared (Quite)",
            "⚠️ Error No Forzado / Doble Falta"
        ],
        lineasHTML: `<div class="voley-net-line"><span>RED</span></div><div class="padel-service-top"></div><div class="padel-service-bottom"></div><div class="padel-center-service"></div>`
    },
    rugby: {
        titulo: "🏉 Cancha de Rugby — Formación y Tanteador",
        clasePitch: "pitch-rugby",
        btnAuto: "⚡ Auto Equipo",
        periodos: [
            { val: "1T", txt: "1° Tiempo (0' a 40')" },
            { val: "2T", txt: "2° Tiempo (40' a 80')" }
        ],
        esquemas: {
            "Rugby Seven (7 Jugadores)": [
                { num: 1, sigla: "PIL", nombrePuesto: "Pilar Izquierdo (#1)", x: 25, y: 72 },
                { num: 2, sigla: "HK", nombrePuesto: "Hooker (#2)", x: 50, y: 76 },
                { num: 3, sigla: "PIL", nombrePuesto: "Pilar Derecho (#3)", x: 75, y: 72 },
                { num: 4, sigla: "MS", nombrePuesto: "Medio Scrum (#4)", x: 40, y: 52 },
                { num: 5, sigla: "APE", nombrePuesto: "Apertura (#5)", x: 62, y: 44 },
                { num: 6, sigla: "CEN", nombrePuesto: "Centro (#6)", x: 32, y: 26 },
                { num: 7, sigla: "WNG", nombrePuesto: "Wing (#7)", x: 76, y: 22 }
            ]
        },
        acciones: [
            "🏉 Try Apoyado (Gol)",
            "🎯 Conversión / Penal (Gol)",
            "🛡️ Tackle Clave / Pesca (Quite)",
            "⚡ Quiebre de Línea (Pase)",
            "⚠️ Penal / Knock-on"
        ],
        lineasHTML: `<div class="pitch-line-half"></div><div class="pitch-line-23m-top"></div><div class="pitch-line-23m-bottom"></div><div class="rugby-try-top"></div><div class="rugby-try-bottom"></div>`
    },
    handball: {
        titulo: "🤾 Cancha de Handball — 7 vs 7 en Vivo",
        clasePitch: "pitch-handball",
        btnAuto: "⚡ Auto 7",
        periodos: [
            { val: "1T", txt: "1° Tiempo (0' a 30')" },
            { val: "2T", txt: "2° Tiempo (30' a 60')" }
        ],
        esquemas: {
            "Ataque 6-0 Clásico": [
                { num: 1, sigla: "ARQ", nombrePuesto: "Arquero (#1)", x: 50, y: 89 },
                { num: 7, sigla: "EI", nombrePuesto: "Extremo Izquierdo", x: 16, y: 34 },
                { num: 9, sigla: "LI", nombrePuesto: "Lateral Izquierdo", x: 26, y: 56 },
                { num: 10, sigla: "CEN", nombrePuesto: "Central Armador", x: 50, y: 60 },
                { num: 11, sigla: "LD", nombrePuesto: "Lateral Derecho", x: 74, y: 56 },
                { num: 8, sigla: "ED", nombrePuesto: "Extremo Derecho", x: 84, y: 34 },
                { num: 13, sigla: "PIV", nombrePuesto: "Pívot en 6 Metros", x: 50, y: 26 }
            ]
        },
        acciones: [
            "🤾 Gol de Jugada (Gol)",
            "🎯 Gol de 7 Metros (Gol)",
            "🧤 Atajada / Bloqueo (Quite)",
            "⚡ Asistencia de Gol (Pase)",
            "🟨 Exclusión 2 Minutos (Tarjeta)"
        ],
        lineasHTML: `<div class="pitch-line-half"></div><div class="pitch-circle-center"></div><div class="handball-6m-top"></div><div class="handball-9m-top"></div><div class="handball-6m-bottom"></div><div class="handball-9m-bottom"></div>`
    },
    boxeo: {
        titulo: "🥊 Ring de Combate / Sparring — Rounds",
        clasePitch: "pitch-boxeo",
        btnAuto: "⚡ Asignar Rincón",
        periodos: [
            { val: "R1", txt: "Round 1" },
            { val: "R2", txt: "Round 2" },
            { val: "R3", txt: "Round 3" },
            { val: "R4", txt: "Round 4" }
        ],
        esquemas: {
            "Ring Oficial": [
                { num: 1, sigla: "AZUL", nombrePuesto: "Rincón Azul (Atleta 1)", x: 32, y: 68 },
                { num: 2, sigla: "ROJO", nombrePuesto: "Rincón Rojo (Atleta 2)", x: 68, y: 32 }
            ]
        },
        acciones: [
            "🏆 Round Ganado (Gol)",
            "🥊 Combinación / Golpe Limpio (Pase)",
            "🛡️ Esquive y Defensa (Quite)",
            "⚠️ Advertencia / Guardia Baja"
        ],
        lineasHTML: `<div class="ring-ropes"></div><div class="ring-center-logo">RING</div>`
    },
    patin: {
        titulo: "🛼 Pista de Patín — Pasadas y Coreografías",
        clasePitch: "pitch-patin",
        btnAuto: "⚡ Auto Pista",
        periodos: [
            { val: "Pasada 1", txt: "Pasada 1 • Técnica" },
            { val: "Pasada 2", txt: "Pasada 2 • Coreografía" },
            { val: "Final", txt: "Pasada Final" }
        ],
        esquemas: {
            "Pista Oficial (6 Turnos)": [
                { num: 1, sigla: "T1", nombrePuesto: "Turno 1 • Salida", x: 25, y: 74 },
                { num: 2, sigla: "T2", nombrePuesto: "Turno 2 • Recta", x: 50, y: 78 },
                { num: 3, sigla: "T3", nombrePuesto: "Turno 3 • Curva", x: 75, y: 74 },
                { num: 4, sigla: "T4", nombrePuesto: "Turno 4 • Centro", x: 50, y: 50 },
                { num: 5, sigla: "T5", nombrePuesto: "Turno 5 • Salto", x: 30, y: 26 },
                { num: 6, sigla: "T6", nombrePuesto: "Turno 6 • Cierre", x: 70, y: 26 }
            ]
        },
        acciones: [
            "🌟 Pasada Limpia / Figura Perfecta (Gol)",
            "⚡ Vuelta Rápida / Velocidad (Pase)",
            "🛼 Equilibrio y Postura (Quite)",
            "⚠️ Caída / Penalización"
        ],
        lineasHTML: `<div class="patin-oval-track"></div>`
    }
};

function detectarEscenarioExtraActivoCDM() {
    if (!deportePagina || deportePagina === "Futbol" || deportePagina === "Hockey" || deportePagina === "Gimnasio") {
        return null;
    }
    const k = normalizarTextoEjercicioCDM(deportePagina);
    if (k.includes("natacion") || k.includes("pileta") || k.includes("acuatic")) return ESCENARIOS_EXTRA_COMPLEMENTO.natacion;
    if (k.includes("basquet") || k.includes("basket")) return ESCENARIOS_EXTRA_COMPLEMENTO.basquet;
    if (k.includes("voley") || k.includes("volley")) return ESCENARIOS_EXTRA_COMPLEMENTO.voley;
    if (k.includes("padel") || k.includes("tenis")) return ESCENARIOS_EXTRA_COMPLEMENTO.padel;
    if (k.includes("rugby")) return ESCENARIOS_EXTRA_COMPLEMENTO.rugby;
    if (k.includes("handball") || k.includes("balonmano")) return ESCENARIOS_EXTRA_COMPLEMENTO.handball;
    if (k.includes("boxeo") || k.includes("mma") || k.includes("karate") || k.includes("judo")) return ESCENARIOS_EXTRA_COMPLEMENTO.boxeo;
    if (k.includes("patin")) return ESCENARIOS_EXTRA_COMPLEMENTO.patin;
    return null;
}

// 1. Extender obtenerCatalogoFormacionActual sin romper Fútbol ni Hockey
const _origObtenerCatalogoFormacion = obtenerCatalogoFormacionActual;
obtenerCatalogoFormacionActual = function () {
    const esc = detectarEscenarioExtraActivoCDM();
    if (esc) {
        const selForm = document.getElementById("matchFormacion");
        if (selForm && selForm.dataset.escenarioListo !== deportePagina) {
            selForm.dataset.escenarioListo = deportePagina;
            selForm.innerHTML = Object.keys(esc.esquemas).map(n => `<option value="${n}">${n}</option>`).join("");
        }
        const selPer = document.getElementById("matchPeriodo");
        if (selPer && selPer.dataset.escenarioListo !== deportePagina) {
            selPer.dataset.escenarioListo = deportePagina;
            selPer.innerHTML = esc.periodos.map(p => `<option value="${p.val}">${p.txt}</option>`).join("");
            periodoPartidoActual = esc.periodos[0].val;
            actualizarTextoCronometro();
        }
        const f = selForm?.value || Object.keys(esc.esquemas)[0];
        return esc.esquemas[f] || Object.values(esc.esquemas)[0];
    }
    return _origObtenerCatalogoFormacion();
};

// 2. Extender renderizarCanchaInteractiva para pintar la Pileta, Parquet o Cancha del deporte extra
const _origRenderizarCancha = renderizarCanchaInteractiva;
renderizarCanchaInteractiva = function () {
    _origRenderizarCancha();
    const esc = detectarEscenarioExtraActivoCDM();
    const pitch = document.getElementById("contenedorCanchaTactica");
    if (!esc || !pitch) return;

    pitch.className = `tactical-pitch ${esc.clasePitch}`;
    const h3 = document.querySelector("#dep-sec-partido .panel-head h3");
    if (h3) h3.innerHTML = `${esc.titulo} <span class="cat-active-pill lbl-cat-activa">${categoriaActiva}</span>`;

    // Reemplazar las líneas de fútbol por las líneas reales de la Pileta / Básquet / Vóley / Pádel / Ring
    pitch.querySelectorAll(".pitch-line-half, .pitch-circle-center, .pitch-area-top, .pitch-area-bottom").forEach(el => el.remove());
    pitch.insertAdjacentHTML("afterbegin", esc.lineasHTML);
};

// 3. Extender abrirModalPuestoCancha para que muestre las acciones propias del deporte extra
const _origAbrirModalPuesto = abrirModalPuestoCancha;
abrirModalPuestoCancha = function (slotIdx) {
    _origAbrirModalPuesto(slotIdx);
    const esc = detectarEscenarioExtraActivoCDM();
    const selTipo = document.getElementById("evCanchaTipo");
    if (esc && selTipo) {
        selTipo.innerHTML = esc.acciones.map(a => `<option value="${a}">${a}</option>`).join("");
    }
};

// 4. Tarjetas de Deportes Extra en el Index más limpias, visuales y sin tanto texto
renderizarTarjetasDeportesExtraIndex = function (activos) {
    const grid = document.querySelector(".sports-showcase-grid");
    if (!grid) return;
    grid.querySelectorAll(".extra-sport-card").forEach(el => el.remove());

    let deportesExtra = [];
    try {
        const lic = JSON.parse(localStorage.getItem("cdm_licencia_config_v1") || "null");
        if (lic && Array.isArray(lic.deportesExtra)) deportesExtra = lic.deportesExtra;
    } catch {}

    deportesExtra.forEach(depRaw => {
        const nombreLimpio = String(depRaw || "").replace(/^[^\w\sÁÉÍÓÚáéíóúÑñ]+\s*/, "").trim() || depRaw;
        const cant = activos.filter(p => p.deporte === nombreLimpio || p.deporte === depRaw).length;
        const k = normalizarTextoEjercicioCDM(nombreLimpio);

        let bg = "linear-gradient(135deg, #0f172a 0%, #0284c7 60%, #0369a1 100%)";
        let chip = depRaw.toUpperCase();
        if (k.includes("natacion") || k.includes("pileta")) { bg = "linear-gradient(135deg, #06b6d4 0%, #0284c7 55%, #0c4a6e 100%)"; chip = "🏊 PILETA 6 CARRILES"; }
        else if (k.includes("basquet")) { bg = "linear-gradient(135deg, #ea580c 0%, #9a3412 58%, #1e1b4b 100%)"; chip = "🏀 CANCHA PARQUET"; }
        else if (k.includes("voley")) { bg = "linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #d97706 100%)"; chip = "🏐 CANCHA & RED"; }
        else if (k.includes("padel") || k.includes("tenis")) { bg = "linear-gradient(135deg, #0284c7 0%, #0369a1 55%, #065f46 100%)"; chip = "🎾 CANCHA & SETS"; }
        else if (k.includes("rugby")) { bg = "linear-gradient(135deg, #15803d 0%, #14532d 60%, #0f172a 100%)"; chip = "🏉 CANCHA RUGBY"; }
        else if (k.includes("boxeo")) { bg = "linear-gradient(135deg, #be123c 0%, #881337 55%, #0f172a 100%)"; chip = "🥊 RING OFICIAL"; }

        const card = document.createElement("a");
        card.href = `futbol.html?deporte=${encodeURIComponent(nombreLimpio)}`;
        card.className = "sport-showcase-card extra-sport-card";
        card.innerHTML = `
            <div class="sport-card-visual">
                <div class="sport-card-bg" style="background:${bg};"></div>
                <div class="sport-card-top">
                    <span class="sport-chip-glass">${chip}</span>
                    <span class="showcase-live-count">${cant} activos</span>
                </div>
                <div class="sport-card-visual-title">
                    <h3>${depRaw}</h3>
                </div>
            </div>
            <div class="sport-card-content">
                <div class="sport-card-pills">
                    <span class="sport-mini-pill">Sub 13</span>
                    <span class="sport-mini-pill">Sub 15</span>
                    <span class="sport-mini-pill">Sub 17</span>
                    <span class="sport-mini-pill">Primera</span>
                </div>
                <div class="sport-card-footer">
                    <span>Abrir ${nombreLimpio}</span>
                    <i class="ri-arrow-right-line"></i>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
};
// =========================================================================
// 16. SECCIÓN 16 UNIFICADA Y COMPLETA (SIN RECORTES):
//     1) VIDEOS PROPIOS (PC/MÓVIL/LINK), EDICIÓN, BORRADO Y RESTAURACIÓN
//     2) EJEMPLOS BIOMECÁNICOS 60 FPS (MINIATURA + 4 FASES DESPLEGABLES)
//     3) RUTINAS POR SECTOR/DEPORTE -> TIPOS -> RUTINA 1, 2... -> EJERCICIOS + MEMORIA KILOS
//     4) FINANZAS Y CONTABILIDAD ERP (6 PESTAÑAS, 4 CAJAS, LIBRO MAYOR EDITABLE, IA, P&L)
//     5) FLYERS STORY 1080x1920, ACTA TÁCTICA PDF A4 Y MONITOR DE PARTIDOS
// =========================================================================

// =========================================================================
// PARTE 1: BASE DE DATOS INDEXEDDB Y GESTIÓN DE VIDEOS (CARGAR, EDITAR, ELIMINAR)
// =========================================================================

const CDM_IDB_VIDEO_NAME = "cdm_videoteca_archivos_db_v1";
const CDM_IDB_VIDEO_STORE = "videos_locales";
let archivoVideoTemporalModalCDM = null;
let miniaturaVideoTemporalModalCDM = null;

function abrirBaseDatosVideosIDB() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) return reject(new Error("IndexedDB no disponible"));
        const req = indexedDB.open(CDM_IDB_VIDEO_NAME, 1);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(CDM_IDB_VIDEO_STORE)) {
                db.createObjectStore(CDM_IDB_VIDEO_STORE, { keyPath: "id" });
            }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

async function guardarArchivoVideoEnIDB(claveId, blobFile, nombreArchivo = "") {
    const db = await abrirBaseDatosVideosIDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(CDM_IDB_VIDEO_STORE, "readwrite");
        tx.objectStore(CDM_IDB_VIDEO_STORE).put({
            id: claveId,
            blob: blobFile,
            nombreArchivo: nombreArchivo || blobFile.name || "video.mp4",
            tipo: blobFile.type || "video/mp4",
            fecha: new Date().toISOString()
        });
        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => reject(e.target.error);
    });
}

async function obtenerArchivoVideoDesdeIDB(claveId) {
    try {
        const db = await abrirBaseDatosVideosIDB();
        return await new Promise((resolve) => {
            const req = db.transaction(CDM_IDB_VIDEO_STORE, "readonly").objectStore(CDM_IDB_VIDEO_STORE).get(claveId);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    } catch {
        return null;
    }
}

async function eliminarArchivoVideoDesdeIDB(claveId) {
    if (!claveId) return;
    try {
        const db = await abrirBaseDatosVideosIDB();
        db.transaction(CDM_IDB_VIDEO_STORE, "readwrite").objectStore(CDM_IDB_VIDEO_STORE).delete(claveId);
    } catch {}
}

function extraerMiniaturaDeVideoArchivoCDM(file) {
    return new Promise((resolve) => {
        try {
            const url = URL.createObjectURL(file);
            const video = document.createElement("video");
            video.preload = "metadata";
            video.muted = true;
            video.playsInline = true;
            video.src = url;
            const fin = (dataUrl) => {
                setTimeout(() => URL.revokeObjectURL(url), 1500);
                resolve(dataUrl);
            };
            video.onloadeddata = () => {
                video.currentTime = Math.min(1.0, (video.duration || 2) * 0.25);
            };
            video.onseeked = () => {
                try {
                    const c = document.createElement("canvas");
                    c.width = 480;
                    c.height = 270;
                    const ctx = c.getContext("2d");
                    ctx.fillStyle = "#091526";
                    ctx.fillRect(0, 0, c.width, c.height);
                    ctx.drawImage(video, 0, 0, c.width, c.height);
                    fin(c.toDataURL("image/jpeg", 0.8));
                } catch {
                    fin(null);
                }
            };
            video.onerror = () => fin(null);
        } catch {
            resolve(null);
        }
    });
}

asegurarVideotecaCargada = function () {
    const vaciadaManual = localStorage.getItem("cdm_videoteca_vaciada_manual_v1") === "1";
    if (!Array.isArray(baseVideoteca) || (baseVideoteca.length === 0 && !vaciadaManual)) {
        baseVideoteca = [...VIDEOTECA_POR_DEFECTO];
        localStorage.setItem("cdm_videoteca_v1", JSON.stringify(baseVideoteca));
    }
    sincronizarDatalistsEjerciciosCDM();
};

function buscarVideoDeEjercicioPorNombreCDM(nombreEjercicio = "") {
    asegurarVideotecaCargada();
    const nomNorm = normalizarTextoEjercicioCDM(nombreEjercicio);
    if (!nomNorm) return null;
    return (baseVideoteca || []).find(v => {
        const vNorm = normalizarTextoEjercicioCDM(v.nombre);
        return vNorm === nomNorm || vNorm.includes(nomNorm) || nomNorm.includes(vNorm);
    }) || null;
}

function abrirModalEditarVideoDeEjercicioPorNombreCDM(nombreEjercicio = "", grupoSugerido = "Tren Inferior") {
    asegurarVideotecaCargada();
    const existente = buscarVideoDeEjercicioPorNombreCDM(nombreEjercicio);
    if (existente) {
        abrirModalVideotecaProCDM(existente.id);
    } else {
        abrirModalVideotecaProCDM(null, nombreEjercicio, grupoSugerido);
    }
}

function cambiarModoOrigenVideoModalCDM(modo) {
    const esArchivo = modo === "archivo";
    document.getElementById("tabOrigenArchivoCDM")?.classList.toggle("active", esArchivo);
    document.getElementById("tabOrigenLinkCDM")?.classList.toggle("active", !esArchivo);
    document.getElementById("bloqueSubirArchivoVideoCDM")?.classList.toggle("hidden", !esArchivo);
    document.getElementById("bloquePegarLinkVideoCDM")?.classList.toggle("hidden", esArchivo);
}

async function seleccionarArchivoVideoDesdeDispositivoCDM(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    archivoVideoTemporalModalCDM = file;
    const pesoMB = (file.size / (1024 * 1024)).toFixed(1);
    const lblInfo = document.getElementById("infoArchivoVideoCargadoCDM");
    if (lblInfo) lblInfo.innerHTML = `<span class="badge badge-ok">✓ Video listo: ${file.name} (${pesoMB} MB)</span>`;
    const previewVid = document.getElementById("previewPlayerVideoSubidoCDM");
    if (previewVid) {
        previewVid.src = URL.createObjectURL(file);
        previewVid.classList.remove("hidden");
    }
    const thumb = await extraerMiniaturaDeVideoArchivoCDM(file);
    if (thumb) miniaturaVideoTemporalModalCDM = thumb;
    mostrarToast(`📹 Video "${file.name}" cargado desde tu dispositivo.`);
}

async function abrirModalVideotecaProCDM(idEditar = null, nombrePredefinido = "", grupoPredefinido = "Tren Inferior") {
    asegurarVideotecaCargada();
    asegurarModalVideoEnPaginaActualCDM();
    const modal = document.getElementById("modalVideoEjercicio");
    if (!modal) return;

    archivoVideoTemporalModalCDM = null;
    miniaturaVideoTemporalModalCDM = null;

    const exEdit = idEditar ? baseVideoteca.find(x => Number(x.id) === Number(idEditar)) : null;
    const esEdicion = Boolean(exEdit);
    const tieneVideoLocal = Boolean(exEdit && (exEdit.esVideoLocal || String(exEdit.videoUrl || "").startsWith("idb://")));
    const urlExternaActual = (!tieneVideoLocal && exEdit?.videoUrl && exEdit.videoUrl !== "biomech://simulador") ? exEdit.videoUrl : "";
    const nombreInicial = exEdit?.nombre || nombrePredefinido || "";
    const grupoInicial = exEdit?.grupo || grupoPredefinido || "Tren Inferior";

    modal.innerHTML = `
        <div class="modal-window" style="max-width:650px;">
            <div class="modal-top">
                <div>
                    <span class="badge badge-celeste">${esEdicion ? "✏️ EDITAR / MODIFICAR VIDEO" : "📹 CARGAR VIDEO DE EJERCICIO"}</span>
                    <h3 style="color:var(--ink-900); margin-top:4px;">
                        ${esEdicion ? `Modificar Video: ${exEdit.nombre}` : (nombreInicial ? `Cargar Video: ${nombreInicial}` : "Agregar Ejercicio con Video (PC / Celular / Link)")}
                    </h3>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalVideoEjercicio()">✕</button>
            </div>

            <form onsubmit="guardarNuevoEjercicioVideoteca(event, ${esEdicion ? exEdit.id : "null"})">
                <div class="grid-2" style="margin-bottom:0.75rem;">
                    <div class="field">
                        <label>Nombre del Ejercicio *</label>
                        <input type="text" id="vidNombre" required placeholder="Ej: Sentadilla Trasera con Barra" value="${nombreInicial.replace(/"/g, "&quot;")}">
                    </div>
                    <div class="field">
                        <label>Grupo Muscular *</label>
                        <select id="vidGrupo" required>
                            <option value="Tren Inferior" ${grupoInicial.includes("Inferior") ? "selected" : ""}>🦵 Tren Inferior (Piernas y Glúteos)</option>
                            <option value="Empuje / Torso" ${grupoInicial.includes("Empuje") || grupoInicial.includes("Hipertrofia") ? "selected" : ""}>💪 Empuje (Pectoral, Hombros y Tríceps)</option>
                            <option value="Tracción / Espalda" ${grupoInicial.includes("Tracción") || grupoInicial.includes("Espalda") ? "selected" : ""}>🏋️ Tracción (Espalda, Dorsales y Bíceps)</option>
                            <option value="Core y Funcional" ${grupoInicial.includes("Core") || grupoInicial.includes("Funcional") ? "selected" : ""}>🔥 Zona Media (Core y Funcional)</option>
                            <option value="Potencia y Pliometría" ${grupoInicial.includes("Potencia") ? "selected" : ""}>⚡ Potencia y Pliometría</option>
                            <option value="Movilidad y Rehab" ${grupoInicial.includes("Movilidad") || grupoInicial.includes("Rehab") ? "selected" : ""}>🏥 Movilidad y Rehabilitación</option>
                        </select>
                    </div>
                </div>

                <div class="grid-4" style="margin-bottom:0.85rem;">
                    <div class="field"><label>Equipamiento *</label><input type="text" id="vidEquipo" required value="${(exEdit?.equipo || "Barra / Mancuernas").replace(/"/g, "&quot;")}"></div>
                    <div class="field"><label>Series Sug.</label><input type="number" id="vidSeries" value="${exEdit?.seriesSugeridas || 4}"></div>
                    <div class="field"><label>Reps Sug.</label><input type="text" id="vidReps" value="${(exEdit?.repsSugeridas || "8-10").replace(/"/g, "&quot;")}"></div>
                    <div class="field"><label>Pausa Sug.</label><input type="text" id="vidPausa" value="${(exEdit?.pausaSugerida || "90s").replace(/"/g, "&quot;")}"></div>
                </div>

                <label style="font-size:0.68rem; font-weight:700; color:var(--ink-500); text-transform:uppercase; display:block; margin-bottom:0.35rem;">
                    🎥 Elegí cómo cargar o modificar el video:
                </label>
                <div class="video-source-tabs">
                    <button type="button" id="tabOrigenArchivoCDM" class="video-source-tab ${!urlExternaActual ? "active" : ""}" onclick="cambiarModoOrigenVideoModalCDM('archivo')">
                        <i class="ri-upload-cloud-2-fill"></i> Subir de PC / Celular
                    </button>
                    <button type="button" id="tabOrigenLinkCDM" class="video-source-tab ${urlExternaActual ? "active" : ""}" onclick="cambiarModoOrigenVideoModalCDM('link')">
                        <i class="ri-links-line"></i> Usar Link (YouTube / MP4)
                    </button>
                </div>

                <div id="bloqueSubirArchivoVideoCDM" class="video-upload-zone ${urlExternaActual ? "hidden" : ""}">
                    <i class="ri-video-upload-line" style="font-size:1.9rem; color:var(--cdm-500); display:block; margin-bottom:0.25rem;"></i>
                    <strong style="font-size:0.86rem; color:var(--ink-900); display:block; margin-bottom:0.5rem;">
                        Seleccioná un video desde tu PC o Celular (MP4, MOV, WebM)
                    </strong>
                    <div style="display:flex; gap:0.5rem; justify-content:center; flex-wrap:wrap;">
                        <label class="btn btn-primary btn-sm" style="cursor:pointer;">
                            <i class="ri-folder-video-line"></i> Elegir Archivo (PC / Galería)
                            <input type="file" accept="video/*" onchange="seleccionarArchivoVideoDesdeDispositivoCDM(event)" style="display:none;">
                        </label>
                        <label class="btn btn-secondary btn-sm" style="cursor:pointer;">
                            <i class="ri-camera-lens-line"></i> Grabar con Cámara
                            <input type="file" accept="video/*" capture="environment" onchange="seleccionarArchivoVideoDesdeDispositivoCDM(event)" style="display:none;">
                        </label>
                    </div>
                    <div id="infoArchivoVideoCargadoCDM" style="margin-top:0.55rem;">
                        ${tieneVideoLocal ? `<span class="badge badge-ok">📹 Video propio actual: ${exEdit.nombreArchivoLocal || "Guardado"}</span>` : ""}
                    </div>
                    <video id="previewPlayerVideoSubidoCDM" class="hidden" controls playsinline style="width:100%; max-height:180px; border-radius:12px; margin-top:0.55rem; background:#000;"></video>
                </div>

                <div id="bloquePegarLinkVideoCDM" class="field ${!urlExternaActual ? "hidden" : ""}" style="margin-bottom:0.85rem;">
                    <label>Link del Video (YouTube, Shorts o MP4)</label>
                    <input type="url" id="vidUrl" placeholder="https://www.youtube.com/watch?v=..." value="${urlExternaActual.replace(/"/g, "&quot;")}">
                </div>

                <div class="field" style="margin-bottom:0.75rem;">
                    <label>Claves de Ejecución Técnica *</label>
                    <input type="text" id="vidClaves" required value="${(exEdit?.clavesTecnicas || "Controlar la fase excéntrica y cuidar la postura articular.").replace(/"/g, "&quot;")}">
                </div>

                <div class="field" style="margin-bottom:1.1rem;">
                    <label>Errores Comunes a Evitar</label>
                    <input type="text" id="vidErrores" value="${(exEdit?.erroresComunes || "Evitar compensaciones lumbares o rebotes.").replace(/"/g, "&quot;")}">
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                    ${esEdicion ? `
                        <button type="button" class="btn btn-danger btn-sm" onclick="eliminarEjercicioVideotecaCDM(${exEdit.id}); cerrarModalVideoEjercicio();">
                            <i class="ri-delete-bin-line"></i> Eliminar Video
                        </button>
                    ` : `<span></span>`}
                    <div style="display:flex; gap:0.5rem;">
                        <button type="button" class="btn btn-ghost" onclick="cerrarModalVideoEjercicio()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">
                            <i class="ri-save-3-line"></i> ${esEdicion ? "Guardar Cambios" : "Guardar Video"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    `;
    modal.classList.remove("hidden");

    if (tieneVideoLocal && exEdit.videoLocalKey) {
        const reg = await obtenerArchivoVideoDesdeIDB(exEdit.videoLocalKey);
        const prev = document.getElementById("previewPlayerVideoSubidoCDM");
        if (reg && reg.blob && prev) {
            prev.src = URL.createObjectURL(reg.blob);
            prev.classList.remove("hidden");
        }
    }
}

abrirModalNuevoEjercicioVideo = abrirModalVideotecaProCDM;
window.abrirModalNuevoEjercicioVideo = abrirModalVideotecaProCDM;
window.abrirModalEditarEjercicioVideo = abrirModalVideotecaProCDM;

function revincularBotonesAgregarVideoHTML() {
    document.querySelectorAll('[onclick*="abrirModalNuevoVideoEjercicio"], [onclick*="abrirModalNuevoEjercicioVideo"]').forEach(btn => {
        const attr = btn.getAttribute("onclick") || "";
        if (!attr.includes("abrirModalVideotecaProCDM")) {
            const matchNum = attr.match(/\(([^)]*)\)/);
            const arg = matchNum && matchNum[1] ? matchNum[1] : "";
            btn.setAttribute("onclick", `abrirModalVideotecaProCDM(${arg})`);
        }
    });
}

if (!window.__cdmInterceptorBotonVideotecaActivo) {
    window.__cdmInterceptorBotonVideotecaActivo = true;
    document.addEventListener("click", function (e) {
        const btn = e.target.closest('[onclick*="abrirModalNuevoVideoEjercicio"]');
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            abrirModalVideotecaProCDM();
        }
    }, true);
}

guardarNuevoEjercicioVideoteca = async function (e, idEditar = null) {
    e.preventDefault();
    asegurarVideotecaCargada();

    const nombre = document.getElementById("vidNombre").value.trim();
    const grupo = document.getElementById("vidGrupo").value;
    const equipo = document.getElementById("vidEquipo").value.trim();
    const seriesSugeridas = parseInt(document.getElementById("vidSeries").value) || 4;
    const repsSugeridas = document.getElementById("vidReps").value.trim() || "8-10";
    const pausaSugerida = document.getElementById("vidPausa")?.value.trim() || "90s";
    const clavesTecnicas = document.getElementById("vidClaves").value.trim();
    const erroresComunes = document.getElementById("vidErrores").value.trim() || "Cuidar postura.";
    const urlInput = (document.getElementById("vidUrl")?.value || "").trim();

    const idFinal = idEditar ? Number(idEditar) : Date.now();
    const idxExistente = baseVideoteca.findIndex(x => Number(x.id) === idFinal);
    const prevObj = idxExistente >= 0 ? baseVideoteca[idxExistente] : null;

    let videoUrlFinal = prevObj?.videoUrl || "";
    let esVideoLocal = Boolean(prevObj?.esVideoLocal);
    let videoLocalKey = prevObj?.videoLocalKey || null;
    let nombreArchivoLocal = prevObj?.nombreArchivoLocal || "";
    let imagenPreview = prevObj?.imagenPreview || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=700&q=80";

    const usandoPestanaArchivo = !document.getElementById("bloqueSubirArchivoVideoCDM")?.classList.contains("hidden");

    if (archivoVideoTemporalModalCDM) {
        const nuevaClaveIDB = `vid_local_${idFinal}`;
        try {
            await guardarArchivoVideoEnIDB(nuevaClaveIDB, archivoVideoTemporalModalCDM, archivoVideoTemporalModalCDM.name);
            videoLocalKey = nuevaClaveIDB;
            videoUrlFinal = `idb://${nuevaClaveIDB}`;
            esVideoLocal = true;
            nombreArchivoLocal = archivoVideoTemporalModalCDM.name;
            if (miniaturaVideoTemporalModalCDM) imagenPreview = miniaturaVideoTemporalModalCDM;
        } catch (err) {
            alert("⚠️ Error guardando video: " + err.message);
            return;
        }
    } else if (!usandoPestanaArchivo && urlInput) {
        videoUrlFinal = urlInput;
        esVideoLocal = false;
        videoLocalKey = null;
        nombreArchivoLocal = "";
    } else if (!prevObj && urlInput) {
        videoUrlFinal = urlInput;
    }

    if (!videoUrlFinal) videoUrlFinal = "biomech://simulador";

    const nuevoObjeto = {
        id: idFinal,
        nombre,
        grupo,
        grupoSecundario: grupo,
        nivel: prevObj?.nivel || "Todos los niveles",
        equipo,
        seriesSugeridas,
        repsSugeridas,
        pausaSugerida,
        videoUrl: videoUrlFinal,
        esVideoLocal,
        videoLocalKey,
        nombreArchivoLocal,
        imagenPreview,
        clavesTecnicas,
        erroresComunes
    };

    if (idxExistente >= 0) {
        baseVideoteca[idxExistente] = nuevoObjeto;
        mostrarToast(`✏️ Video "${nombre}" actualizado.`);
    } else {
        baseVideoteca.unshift(nuevoObjeto);
        mostrarToast(`📹 Video "${nombre}" guardado.`);
    }

    agregarEjercicioInventadoAlCatalogoCDM(nombre, "fuerza_1rm", true);
    guardarDatosCDM();
    cerrarModalVideoEjercicio();
    renderizarVideotecaGym();
    refrescarVistasRutinasJerarquicasCDM();
    if (typeof renderizarVideotecaModoUsuario === "function") renderizarVideotecaModoUsuario();
};

async function eliminarEjercicioVideotecaCDM(idEx) {
    const ex = baseVideoteca.find(x => Number(x.id) === Number(idEx));
    if (!ex) return;
    if (!confirm(`🗑️ ¿Eliminar el video "${ex.nombre}" de la Videoteca?`)) return;
    if (ex.videoLocalKey) await eliminarArchivoVideoDesdeIDB(ex.videoLocalKey);
    baseVideoteca = baseVideoteca.filter(x => Number(x.id) !== Number(idEx));
    if (baseVideoteca.length === 0) localStorage.setItem("cdm_videoteca_vaciada_manual_v1", "1");
    guardarDatosCDM();
    renderizarVideotecaGym();
    refrescarVistasRutinasJerarquicasCDM();
    if (typeof renderizarVideotecaModoUsuario === "function") renderizarVideotecaModoUsuario();
    mostrarToast(`🗑️ "${ex.nombre}" eliminado.`);
}

function restaurarVideosPorDefectoVideotecaCDM() {
    localStorage.removeItem("cdm_videoteca_vaciada_manual_v1");
    VIDEOTECA_POR_DEFECTO.forEach(def => {
        if (!baseVideoteca.some(x => Number(x.id) === Number(def.id))) {
            baseVideoteca.push({ ...def });
        }
    });
    guardarDatosCDM();
    renderizarVideotecaGym();
    refrescarVistasRutinasJerarquicasCDM();
    mostrarToast("↺ Videos e ilustraciones base restaurados.");
}

async function vaciarVideosEjemploVideotecaCDM() {
    if (!confirm("⚠️ ¿Quitar los videos precargados de ejemplo y dejar solo los tuyos?")) return;
    const idsDefecto = VIDEOTECA_POR_DEFECTO.map(v => Number(v.id));
    baseVideoteca = baseVideoteca.filter(x => !idsDefecto.includes(Number(x.id)) || x.esVideoLocal);
    localStorage.setItem("cdm_videoteca_vaciada_manual_v1", "1");
    guardarDatosCDM();
    renderizarVideotecaGym();
    refrescarVistasRutinasJerarquicasCDM();
    mostrarToast("🧹 Videos de ejemplo quitados.");
}

// =========================================================================
// PARTE 2: MOTOR DE EJEMPLOS BIOMECÁNICOS 60 FPS (MINIATURA + 4 FASES)
// =========================================================================

const INFO_BIOMECANICA_PATRONES_CDM = {
    pull: { titulo: "Tracción Vertical — Dominadas y Jalón", primarios: "Dorsal Ancho (Expansión en V), Redondo Mayor y Bíceps", secundarios: "Romboides, Trapecio Inferior y Core", fases: ["1. Extensión", "2. Escápulas", "3. Al Pecho", "4. Control"] },
    row: { titulo: "Tracción Horizontal — Remo con Mancuerna", primarios: "Dorsal Ancho, Romboides y Deltoides Posterior", secundarios: "Bíceps Braquial y Erectores Espinales", fases: ["1. Extensión", "2. Tracción", "3. A Cadera", "4. Retorno"] },
    bench: { titulo: "Empuje Horizontal — Press de Banca Plano", primarios: "Pectoral Mayor (Haz Esternal) y Tríceps Braquial", secundarios: "Deltoides Anterior y Estabilidad Escapular", fases: ["1. Bloqueo", "2. Bajada", "3. Al Pecho", "4. Empuje"] },
    squat: { titulo: "Dominante de Rodilla — Sentadilla con Barra", primarios: "Cuádriceps (Vasto Lateral/Medial) y Glúteo Mayor", secundarios: "Erectores Espinales, Core e Isquiotibiales", fases: ["1. Posición", "2. Bajada", "3. Paralelo 90°", "4. Subida"] },
    deadlift: { titulo: "Bisagra de Cadera — Peso Muerto Rumano", primarios: "Isquiotibiales (Femorales) y Glúteo Mayor", secundarios: "Erectores Espinales, Dorsal y Trapecio", fases: ["1. Erguido", "2. Bisagra", "3. Tensión", "4. Extensión"] },
    thrust: { titulo: "Extensión Pélvica — Hip Thrust con Barra", primarios: "Glúteo Mayor y Glúteo Medio", secundarios: "Isquiotibiales y Core Antirrotacional", fases: ["1. Inicio", "2. Impulso", "3. Bloqueo 180°", "4. Descenso"] },
    ohp: { titulo: "Empuje Vertical — Press Militar de Hombros", primarios: "Deltoides Anterior/Lateral y Tríceps Braquial", secundarios: "Trapecio Superior y Core Abdominal", fases: ["1. Clavículas", "2. Empuje", "3. Bloqueo", "4. Control"] },
    lunge: { titulo: "Fuerza Unilateral — Sentadilla Búlgara", primarios: "Cuádriceps Delantero y Glúteo Mayor", secundarios: "Glúteo Medio (Estabilizador) e Isquiotibiales", fases: ["1. Split Inicial", "2. Descenso", "3. 90° Rodilla", "4. Subida"] },
    plank: { titulo: "Estabilidad Antirrotacional — Plancha RKC", primarios: "Recto Abdominal, Transverso y Oblicuos", secundarios: "Glúteo Mayor, Serrato Anterior y Deltoides", fases: ["1. Postura", "2. Tracción", "3. Bracing", "4. Sostén"] },
    jump: { titulo: "Potencia Explosiva — Salto al Cajón", primarios: "Cuádriceps, Glúteos y Gemelos", secundarios: "Tendón Rotuliano/Aquiles y Core", fases: ["1. Carga", "2. Despegue", "3. Vuelo", "4. Recepción"] }
};

function detectarPatronMovimientoHombrecitoCDM(nombreEjercicio = "", grupo = "") {
    const nom = normalizarTextoEjercicioCDM(nombreEjercicio);
    const grp = normalizarTextoEjercicioCDM(grupo);
    if (nom.includes("dominada") || nom.includes("jalon") || nom.includes("polea") || nom.includes("pull")) return "pull";
    if (nom.includes("remo") || nom.includes("traccion horizontal")) return "row";
    if (nom.includes("hip thrust") || nom.includes("empuje de cadera") || nom.includes("puente")) return "thrust";
    if (nom.includes("muerto") || nom.includes("rumano") || nom.includes("isquio") || nom.includes("buenos dias")) return "deadlift";
    if (nom.includes("bulgara") || nom.includes("estocada") || nom.includes("zancada") || nom.includes("unilateral")) return "lunge";
    if (nom.includes("militar") || nom.includes("hombro") || nom.includes("overhead") || nom.includes("vuelo")) return "ohp";
    if (nom.includes("banca") || nom.includes("pecho") || nom.includes("flexion") || nom.includes("apertura")) return "bench";
    if (nom.includes("plancha") || nom.includes("abdominal") || nom.includes("core") || nom.includes("rkc")) return "plank";
    if (nom.includes("salto") || nom.includes("cajon") || nom.includes("box") || nom.includes("pliometr") || nom.includes("cmj") || nom.includes("sprint") || nom.includes("velocidad")) return "jump";
    if (nom.includes("sentadilla") || nom.includes("prensa") || nom.includes("rodilla") || nom.includes("cuadriceps")) return "squat";
    if (grp.includes("traccion") || grp.includes("espalda")) return "pull";
    if (grp.includes("empuje") || grp.includes("pecho")) return "bench";
    if (grp.includes("core") || grp.includes("funcional")) return "plank";
    if (grp.includes("potencia") || grp.includes("pliometr")) return "jump";
    return "squat";
}

function interpCDM(a, b, t) {
    return a + (b - a) * t;
}

function resolverArticulacionConGuiaCDM(x1, y1, x2, y2, L1, L2, haciaX, haciaY) {
    let dx = x2 - x1;
    let dy = y2 - y1;
    let d = Math.hypot(dx, dy) || 1;
    const maxReach = (L1 + L2) * 0.992;
    const minReach = Math.abs(L1 - L2) * 1.05;
    if (d > maxReach) { dx = (dx / d) * maxReach; dy = (dy / d) * maxReach; d = maxReach; }
    else if (d < minReach) { d = minReach; }
    const cosAngle = Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)));
    const angleBase = Math.atan2(dy, dx);
    const angleOffset = Math.acos(cosAngle);
    const solA = { x: x1 + Math.cos(angleBase + angleOffset) * L1, y: y1 + Math.sin(angleBase + angleOffset) * L1 };
    const solB = { x: x1 + Math.cos(angleBase - angleOffset) * L1, y: y1 + Math.sin(angleBase - angleOffset) * L1 };
    return Math.hypot(solA.x - haciaX, solA.y - haciaY) <= Math.hypot(solB.x - haciaX, solB.y - haciaY) ? solA : solB;
}

function dibujarSegmentoAnatomicoProCDM(ctx, x1, y1, x2, y2, r1, panzaPos, panzaNeg, r2, activo = false, nivel = 0.8, esFondo = false) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
    const maxBulge = Math.max(r1, r2) + len * 0.16;
    const bPos = Math.min(panzaPos, maxBulge), bNeg = Math.min(panzaNeg, maxBulge);
    const p1x = x1 + dx * 0.38, p1y = y1 + dy * 0.38, p2x = x1 + dx * 0.68, p2y = y1 + dy * 0.68;

    ctx.save();
    if (esFondo) ctx.globalAlpha = 0.48;
    ctx.beginPath();
    ctx.moveTo(x1 + nx * r1, y1 + ny * r1);
    ctx.bezierCurveTo(p1x + nx * bPos, p1y + ny * bPos, p2x + nx * (bPos * 0.85), p2y + ny * (bPos * 0.85), x2 + nx * r2, y2 + ny * r2);
    ctx.arc(x2, y2, r2, Math.atan2(ny, nx), Math.atan2(-ny, -nx), false);
    ctx.bezierCurveTo(p2x - nx * (bNeg * 0.85), p2y - ny * (bNeg * 0.85), p1x - nx * bNeg, p1y - ny * bNeg, x1 - nx * r1, y1 - ny * r1);
    ctx.arc(x1, y1, r1, Math.atan2(-ny, -nx), Math.atan2(ny, nx), false);
    ctx.closePath();

    const grad = ctx.createLinearGradient(p1x + nx * bPos, p1y + ny * bPos, p1x - nx * bNeg, p1y - ny * bNeg);
    if (activo) {
        if (!esFondo) { ctx.shadowColor = `rgba(244, 63, 94, ${0.35 + 0.4 * nivel})`; ctx.shadowBlur = 10 * nivel; }
        grad.addColorStop(0, "#fda4af"); grad.addColorStop(0.4, "#f43f5e"); grad.addColorStop(0.8, "#be123c"); grad.addColorStop(1, "#4c0519");
        ctx.strokeStyle = "#fecdd3";
    } else {
        grad.addColorStop(0, "#94a3b8"); grad.addColorStop(0.45, "#475569"); grad.addColorStop(0.85, "#1e293b"); grad.addColorStop(1, "#0f172a");
        ctx.strokeStyle = "rgba(148, 163, 184, 0.5)";
    }
    ctx.fillStyle = grad; ctx.fill(); ctx.lineWidth = 1.1; ctx.stroke();
    ctx.restore();
}

function dibujarPelvisYShortCDM(ctx, hx, hy, radio = 7.2) {
    ctx.save(); ctx.fillStyle = "#0284c7"; ctx.strokeStyle = "#7dd3fc"; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(hx, hy, radio, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
}

function dibujarArticulacionCapsulaCDM(ctx, x, y, r = 3.3, activa = false) {
    ctx.save(); ctx.fillStyle = activa ? "#fb7185" : "#38bdf8"; ctx.strokeStyle = "#091526"; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
}

function dibujarCuelloYCabezaCDM(ctx, sx, sy, hx, hy, anguloMirada = 0, vistaEspalda = false) {
    dibujarSegmentoAnatomicoProCDM(ctx, sx, sy, hx, hy, 3.6, 3.8, 3.8, 3.2, false, 0.5);
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(anguloMirada);
    const grad = ctx.createRadialGradient(-2, -3, 1, 0, 0, 9);
    grad.addColorStop(0, "#cbd5e1"); grad.addColorStop(0.65, "#475569"); grad.addColorStop(1, "#1e293b");
    ctx.fillStyle = grad; ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(0, 0, 6.8, 8.0, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (!vistaEspalda) { ctx.fillStyle = "#38bdf8"; ctx.beginPath(); ctx.roundRect(2.0, -2.2, 4.8, 2.3, 1); ctx.fill(); }
    ctx.restore();
}

function dibujarCalzadoDeportivoCDM(ctx, ax, ay, largo = 14) {
    ctx.save(); ctx.fillStyle = "#0284c7"; ctx.strokeStyle = "#e0f2fe"; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(ax - 5, ay - 3); ctx.lineTo(ax + largo - 3, ay - 1);
    ctx.quadraticCurveTo(ax + largo + 1, ay + 2, ax + largo - 1, ay + 4.2); ctx.lineTo(ax - 5, ay + 4.2); ctx.closePath();
    ctx.fill(); ctx.stroke(); ctx.fillStyle = "#f8fafc"; ctx.fillRect(ax - 5, ay + 3.0, largo + 4, 1.8); ctx.restore();
}

function dibujarDiscoOlimpicoProCDM(ctx, bx, by, r = 11.5) {
    ctx.save(); ctx.globalAlpha = 0.72;
    const grad = ctx.createRadialGradient(bx - 2, by - 2, 2, bx, by, r);
    grad.addColorStop(0, "#fde047"); grad.addColorStop(0.6, "#eab308"); grad.addColorStop(1, "#713f12");
    ctx.fillStyle = grad; ctx.strokeStyle = "#fef08a"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1; ctx.fillStyle = "#0f172a"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(bx, by, 3.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
}

function dibujarHUDTelemetriaBiomecanicaCDM(ctx, p, textoAngulo) {
    const pct = Math.round(25 + p * 75);
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.82)"; ctx.strokeStyle = "rgba(56, 189, 248, 0.32)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(8, 6, 144, 16, 5); ctx.fill(); ctx.stroke();
    const barW = Math.max(8, Math.round(136 * (0.2 + 0.8 * p)));
    const grad = ctx.createLinearGradient(12, 0, 148, 0);
    grad.addColorStop(0, "#38bdf8"); grad.addColorStop(0.5, "#f59e0b"); grad.addColorStop(1, "#f43f5e");
    ctx.fillStyle = grad; ctx.beginPath(); ctx.roundRect(12, 9.5, barW, 9, 3.5); ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.font = "800 7.2px Poppins, sans-serif";
    ctx.fillText(`${textoAngulo} • EMG ${pct}%`, 16, 16.5);
    ctx.restore();
}

function renderizarFrameAtletaAnatomicoCDM(canvas, patron, p, mostrarTelemetria = true) {
    if (!canvas) return false;
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    if (cw < 24 || ch < 24) return false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
        canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    }
    const ctx = canvas.getContext("2d");
    ctx.save(); ctx.scale(dpr, dpr); ctx.clearRect(0, 0, cw, ch);
    const vw = 160, vh = 142, scale = Math.min(cw / vw, ch / vh);
    ctx.translate((cw - vw * scale) / 2, (ch - vh * scale) / 2); ctx.scale(scale, scale);

    const floorY = 130, intensidad = 0.25 + 0.75 * p;
    ctx.strokeStyle = "rgba(148, 163, 184, 0.5)"; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(10, floorY); ctx.lineTo(150, floorY); ctx.stroke();

    if (patron === "pull") {
        ctx.strokeStyle = "#64748b"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(80, 22); ctx.lineTo(80, 68); ctx.stroke();
        ctx.fillStyle = "#1e293b"; ctx.strokeStyle = "#475569"; ctx.beginPath(); ctx.roundRect(62, 112, 36, 7, 3); ctx.fill(); ctx.stroke();
        const barY = interpCDM(36, 65, p), shoulderY = interpCDM(67, 70, p), hipY = 109;
        const handL = { x: 38, y: barY + 3 }, handR = { x: 122, y: barY + 3 };
        const shoulderL = { x: 63, y: shoulderY }, shoulderR = { x: 97, y: shoulderY };
        const elbowL = resolverArticulacionConGuiaCDM(shoulderL.x, shoulderL.y, handL.x, handL.y, 20, 20, 20, 115);
        const elbowR = resolverArticulacionConGuiaCDM(shoulderR.x, shoulderR.y, handR.x, handR.y, 20, 20, 140, 115);
        ctx.strokeStyle = "#facc15"; ctx.lineWidth = 3.5; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(28, barY + 7); ctx.lineTo(42, barY); ctx.lineTo(118, barY); ctx.lineTo(132, barY + 7); ctx.stroke();
        dibujarSegmentoAnatomicoProCDM(ctx, 70, hipY, 65, floorY - 2, 5.5, 6.5, 5.5, 4.2, false, p);
        dibujarSegmentoAnatomicoProCDM(ctx, 90, hipY, 95, floorY - 2, 5.5, 6.5, 5.5, 4.2, false, p);
        dibujarPelvisYShortCDM(ctx, 80, hipY, 8.5);
        ctx.save();
        const latW = interpCDM(17, 23, p);
        ctx.fillStyle = "#e11d48"; ctx.strokeStyle = "#fecdd3"; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(shoulderL.x, shoulderY - 2); ctx.lineTo(shoulderR.x, shoulderY - 2);
        ctx.quadraticCurveTo(80 + latW, shoulderY + 18, 88, hipY - 2); ctx.lineTo(72, hipY - 2);
        ctx.quadraticCurveTo(80 - latW, shoulderY + 18, shoulderL.x, shoulderY - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
        dibujarSegmentoAnatomicoProCDM(ctx, shoulderL.x, shoulderL.y, elbowL.x, elbowL.y, 4.8, 5.8, 4.8, 3.8, true, intensidad);
        dibujarSegmentoAnatomicoProCDM(ctx, elbowL.x, elbowL.y, handL.x, handL.y, 3.8, 4.4, 3.8, 2.8, true, intensidad);
        dibujarSegmentoAnatomicoProCDM(ctx, shoulderR.x, shoulderR.y, elbowR.x, elbowR.y, 4.8, 5.8, 4.8, 3.8, true, intensidad);
        dibujarSegmentoAnatomicoProCDM(ctx, elbowR.x, elbowR.y, handR.x, handR.y, 3.8, 4.4, 3.8, 2.8, true, intensidad);
        dibujarArticulacionCapsulaCDM(ctx, elbowL.x, elbowL.y, 3.2, true);
        dibujarArticulacionCapsulaCDM(ctx, elbowR.x, elbowR.y, 3.2, true);
        dibujarCuelloYCabezaCDM(ctx, 80, shoulderY - 2, 80, shoulderY - 12, 0, true);
        if (mostrarTelemetria) dibujarHUDTelemetriaBiomecanicaCDM(ctx, p, "Tracción Dorsal");
    } else if (patron === "row") {
        ctx.fillStyle = "#1e293b"; ctx.strokeStyle = "#475569"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(50, 95, 66, 6, 3); ctx.fill(); ctx.stroke();
        const ankle = { x: 34, y: floorY - 4 }, hip = { x: 56, y: 74 }, shoulder = { x: 96, y: 66 };
        const kneeFloor = resolverArticulacionConGuiaCDM(hip.x, hip.y, ankle.x, ankle.y, 29, 28, 80, 100);
        const handPull = { x: interpCDM(94, 66, p), y: interpCDM(110, 80, p) };
        const elbowPull = resolverArticulacionConGuiaCDM(shoulder.x, shoulder.y, handPull.x, handPull.y, 20, 20, 55, 30);
        dibujarSegmentoAnatomicoProCDM(ctx, ankle.x, ankle.y, kneeFloor.x, kneeFloor.y, 3.8, 4.8, 5.2, 4.2, false, p);
        dibujarSegmentoAnatomicoProCDM(ctx, kneeFloor.x, kneeFloor.y, hip.x, hip.y, 4.6, 6.8, 6.2, 6.4, false, p);
        dibujarSegmentoAnatomicoProCDM(ctx, hip.x, hip.y, shoulder.x, shoulder.y, 6.8, 7.6, 8.2, 7.4, true, intensidad);
        dibujarPelvisYShortCDM(ctx, hip.x, hip.y, 7.2);
        dibujarCuelloYCabezaCDM(ctx, shoulder.x, shoulder.y, shoulder.x + 13, shoulder.y - 3, 0.25);
        dibujarSegmentoAnatomicoProCDM(ctx, shoulder.x, shoulder.y, elbowPull.x, elbowPull.y, 4.6, 5.6, 4.8, 3.8, true, intensidad);
        dibujarSegmentoAnatomicoProCDM(ctx, elbowPull.x, elbowPull.y, handPull.x, handPull.y, 3.8, 4.4, 3.8, 2.8, true, intensidad);
        dibujarArticulacionCapsulaCDM(ctx, elbowPull.x, elbowPull.y, 3.3, true);
        dibujarCalzadoDeportivoCDM(ctx, ankle.x, ankle.y, 14);
        ctx.fillStyle = "#facc15"; ctx.beginPath(); ctx.roundRect(handPull.x - 8, handPull.y - 3.5, 16, 7, 2); ctx.fill();
        if (mostrarTelemetria) dibujarHUDTelemetriaBiomecanicaCDM(ctx, p, `Remo Codo ${Math.round(interpCDM(168, 78, p))}°`);
    } else if (patron === "bench") {
        ctx.fillStyle = "#1e293b"; ctx.strokeStyle = "#475569"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(22, 92, 78, 6, 3); ctx.fill(); ctx.stroke();
        const shoulder = { x: 50, y: 84 }, hip = { x: 90, y: 86 }, ankle = { x: 116, y: floorY - 4 };
        const knee = resolverArticulacionConGuiaCDM(hip.x, hip.y, ankle.x, ankle.y, 26, 26, 135, 80);
        const hand = { x: 52, y: interpCDM(42, 73, p) };
        const elbow = resolverArticulacionConGuiaCDM(shoulder.x, shoulder.y, hand.x, hand.y, 22, 22, 72, 115);
        dibujarSegmentoAnatomicoProCDM(ctx, knee.x, knee.y, ankle.x, ankle.y, 4.0, 4.8, 4.4, 3.5, false, p);
        dibujarSegmentoAnatomicoProCDM(ctx, hip.x, hip.y, knee.x, knee.y, 6.0, 7.0, 5.8, 4.5, false, p);
        dibujarSegmentoAnatomicoProCDM(ctx, hip.x, hip.y, shoulder.x, shoulder.y, 6.8, 8.6, 6.8, 7.6, true, intensidad);
        dibujarPelvisYShortCDM(ctx, hip.x, hip.y, 7.0);
        dibujarCuelloYCabezaCDM(ctx, shoulder.x, shoulder.y, 35, 83, -Math.PI / 2);
        dibujarSegmentoAnatomicoProCDM(ctx, shoulder.x, shoulder.y, elbow.x, elbow.y, 4.6, 5.6, 4.8, 3.8, true, intensidad);
        dibujarSegmentoAnatomicoProCDM(ctx, elbow.x, elbow.y, hand.x, hand.y, 3.8, 4.4, 3.8, 2.8, true, intensidad);
        dibujarArticulacionCapsulaCDM(ctx, elbow.x, elbow.y, 3.3, true);
        dibujarCalzadoDeportivoCDM(ctx, ankle.x, ankle.y, 13);
        dibujarDiscoOlimpicoProCDM(ctx, hand.x, hand.y, 11);
        if (mostrarTelemetria) dibujarHUDTelemetriaBiomecanicaCDM(ctx, p, `Press Codo ${Math.round(interpCDM(172, 82, p))}°`);
    } else if (patron === "thrust") {
        ctx.fillStyle = "#1e293b"; ctx.strokeStyle = "#475569"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(16, 86, 28, 44, 4); ctx.fill(); ctx.stroke();
        const shoulder = { x: 42, y: 83 }, ankle = { x: 112, y: floorY - 4 };
        const hip = { x: interpCDM(74, 77, p), y: interpCDM(112, 83, p) };
        const knee = resolverArticulacionConGuiaCDM(hip.x, hip.y, ankle.x, ankle.y, 31, 29, 125, 50);
        dibujarSegmentoAnatomicoProCDM(ctx, knee.x, knee.y, ankle.x, ankle.y, 4.2, 5.2, 4.6, 3.6, false, p);
        dibujarSegmentoAnatomicoProCDM(ctx, hip.x, hip.y, knee.x, knee.y, 7.2, 8.2, 6.8, 4.8, true, intensidad);
        dibujarSegmentoAnatomicoProCDM(ctx, shoulder.x, shoulder.y, hip.x, hip.y, 7.0, 7.6, 7.6, 7.4, true, intensidad);
        dibujarPelvisYShortCDM(ctx, hip.x, hip.y, 7.6);
        dibujarCuelloYCabezaCDM(ctx, shoulder.x, shoulder.y, 30, 74, 0.25);
        dibujarArticulacionCapsulaCDM(ctx, hip.x, hip.y, 3.8, true);
        dibujarCalzadoDeportivoCDM(ctx, ankle.x, ankle.y, 14);
        dibujarDiscoOlimpicoProCDM(ctx, hip.x, hip.y - 6, 11);
        if (mostrarTelemetria) dibujarHUDTelemetriaBiomecanicaCDM(ctx, p, `Pelvis ${Math.round(interpCDM(115, 180, p))}°`);
    } else if (patron === "lunge") {
        ctx.fillStyle = "#1e293b"; ctx.strokeStyle = "#475569"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(14, 98, 22, 32, 4); ctx.fill(); ctx.stroke();
        const frontAnkle = { x: 108, y: floorY - 4 }, backFoot = { x: 32, y: 98 };
        const hip = { x: 74, y: interpCDM(74, 98, p) }, shoulder = { x: 78, y: interpCDM(40, 64, p) };
        const backKnee = resolverArticulacionConGuiaCDM(hip.x, hip.y, backFoot.x, backFoot.y, 28, 27, 55, 138);
        const frontKnee = resolverArticulacionConGuiaCDM(hip.x, hip.y, frontAnkle.x, frontAnkle.y, 29, 28, 145, 90);
        dibujarSegmentoAnatomicoProCDM(ctx, backKnee.x, backKnee.y, backFoot.x, backFoot.y, 3.8, 4.6, 4.2, 3.2, false, p, true);
        dibujarSegmentoAnatomicoProCDM(ctx, hip.x, hip.y, backKnee.x, backKnee.y, 6.0, 6.8, 6.2, 4.2, true, intensidad * 0.6, true);
        dibujarSegmentoAnatomicoProCDM(ctx, frontAnkle.x, frontAnkle.y, frontKnee.x, frontKnee.y, 3.8, 4.6, 5.4, 4.4, false, p);
        dibujarSegmentoAnatomicoProCDM(ctx, frontKnee.x, frontKnee.y, hip.x, hip.y, 4.8, 8.4, 7.0, 7.6, true, intensidad);
        dibujarSegmentoAnatomicoProCDM(ctx, hip.x, hip.y, shoulder.x, shoulder.y, 7.0, 7.8, 7.4, 7.4, true, intensidad * 0.65);
        dibujarPelvisYShortCDM(ctx, hip.x, hip.y, 7.4);
        dibujarCuelloYCabezaCDM(ctx, shoulder.x, shoulder.y, shoulder.x + 4, shoulder.y - 12, 0.08);
        dibujarArticulacionCapsulaCDM(ctx, frontKnee.x, frontKnee.y, 3.5, true);
        dibujarCalzadoDeportivoCDM(ctx, frontAnkle.x, frontAnkle.y, 14);
        if (mostrarTelemetria) dibujarHUDTelemetriaBiomecanicaCDM(ctx, p, `Unilateral ${Math.round(interpCDM(168, 88, p))}°`);
    } else if (patron === "deadlift") {
        const ankle = { x: 78, y: floorY - 4 }, hip = { x: interpCDM(74, 48, p), y: interpCDM(74, 82, p) };
        const knee = resolverArticulacionConGuiaCDM(hip.x, hip.y, ankle.x, ankle.y, 28, 28, 120, 100);
        const angleTorso = interpCDM(-Math.PI / 2 + 0.06, -0.22, p);
        const shoulder = { x: hip.x + Math.cos(angleTorso) * 35, y: hip.y + Math.sin(angleTorso) * 35 };
        const hand = { x: interpCDM(79, 84, p), y: interpCDM(78, 107, p) };
        dibujarSegmentoAnatomicoProCDM(ctx, ankle.x, ankle.y, knee.x, knee.y, 3.8, 4.5, 5.6, 4.4, false, p);
        dibujarSegmentoAnatomicoProCDM(ctx, knee.x, knee.y, hip.x, hip.y, 4.8, 7.6, 8.8, 7.8, true, intensidad);
        dibujarSegmentoAnatomicoProCDM(ctx, hip.x, hip.y, shoulder.x, shoulder.y, 7.2, 8.0, 7.8, 7.6, true, intensidad * 0.85);
        dibujarPelvisYShortCDM(ctx, hip.x, hip.y, 7.4);
        dibujarCuelloYCabezaCDM(ctx, shoulder.x, shoulder.y, shoulder.x + Math.cos(angleTorso) * 12, shoulder.y + Math.sin(angleTorso) * 12, angleTorso + Math.PI / 2);
        dibujarSegmentoAnatomicoProCDM(ctx, shoulder.x, shoulder.y, hand.x, hand.y, 4.0, 4.6, 4.0, 3.0, false, p);
        dibujarArticulacionCapsulaCDM(ctx, hip.x, hip.y, 3.6, true);
        dibujarCalzadoDeportivoCDM(ctx, ankle.x, ankle.y, 15);
        dibujarDiscoOlimpicoProCDM(ctx, hand.x, hand.y, 11.5);
        if (mostrarTelemetria) dibujarHUDTelemetriaBiomecanicaCDM(ctx, p, `Bisagra ${Math.round(interpCDM(176, 92, p))}°`);
    } else if (patron === "ohp") {
        const ankle = { x: 76, y: floorY - 4 }, knee = { x: 78, y: 101 }, hip = { x: 74, y: 74 }, shoulder = { x: 76, y: 44 };
        const hand = { x: 81, y: interpCDM(44, 16, p) };
        const elbow = resolverArticulacionConGuiaCDM(shoulder.x, shoulder.y, hand.x, hand.y, 19, 19, 112, 68);
        dibujarSegmentoAnatomicoProCDM(ctx, ankle.x, ankle.y, knee.x, knee.y, 3.8, 4.6, 5.4, 4.4, false, p);
        dibujarSegmentoAnatomicoProCDM(ctx, knee.x, knee.y, hip.x, hip.y, 4.8, 7.8, 6.8, 7.4, false, p);
        dibujarSegmentoAnatomicoProCDM(ctx, hip.x, hip.y, shoulder.x, shoulder.y, 7.2, 8.0, 7.6, 7.6, true, intensidad * 0.6);
        dibujarPelvisYShortCDM(ctx, hip.x, hip.y, 7.2);
        dibujarCuelloYCabezaCDM(ctx, shoulder.x, shoulder.y, shoulder.x - 2, shoulder.y - 12, 0);
        dibujarSegmentoAnatomicoProCDM(ctx, shoulder.x, shoulder.y, elbow.x, elbow.y, 4.6, 5.6, 4.8, 3.8, true, intensidad);
        dibujarSegmentoAnatomicoProCDM(ctx, elbow.x, elbow.y, hand.x, hand.y, 3.8, 4.4, 3.8, 2.8, true, intensidad);
        dibujarCalzadoDeportivoCDM(ctx, ankle.x, ankle.y, 15);
        dibujarDiscoOlimpicoProCDM(ctx, hand.x, hand.y, 10.5);
        if (mostrarTelemetria) dibujarHUDTelemetriaBiomecanicaCDM(ctx, p, "Press Hombros");
    } else if (patron === "plank") {
        const toe = { x: 28, y: floorY - 4 }, knee = { x: 54, y: 112 }, hip = { x: 80, y: interpCDM(98, 95, p) }, shoulder = { x: 114, y: 88 }, elbow = { x: 114, y: floorY - 4 };
        dibujarSegmentoAnatomicoProCDM(ctx, toe.x, toe.y, knee.x, knee.y, 3.6, 4.8, 4.4, 4.0, false, p);
        dibujarSegmentoAnatomicoProCDM(ctx, knee.x, knee.y, hip.x, hip.y, 4.4, 7.2, 6.4, 6.8, true, 0.8);
        dibujarSegmentoAnatomicoProCDM(ctx, hip.x, hip.y, shoulder.x, shoulder.y, 7.0, 8.4, 7.8, 7.6, true, 0.9 + 0.1 * p);
        dibujarPelvisYShortCDM(ctx, hip.x, hip.y, 6.8);
        dibujarCuelloYCabezaCDM(ctx, shoulder.x, shoulder.y, shoulder.x + 12, shoulder.y - 2, 0.35);
        dibujarSegmentoAnatomicoProCDM(ctx, shoulder.x, shoulder.y, elbow.x, elbow.y, 4.2, 5.0, 4.4, 3.4, true, 0.8);
        if (mostrarTelemetria) dibujarHUDTelemetriaBiomecanicaCDM(ctx, 0.85 + 0.15 * p, "Core RKC 100%");
    } else {
        const ankle = { x: 80, y: floorY - 4 };
        const hip = { x: interpCDM(75, 52, p), y: interpCDM(76, 102, p) };
        const shoulder = { x: interpCDM(78, 74, p), y: interpCDM(42, 68, p) };
        const knee = resolverArticulacionConGuiaCDM(hip.x, hip.y, ankle.x, ankle.y, 29, 28, 130, 95);
        dibujarSegmentoAnatomicoProCDM(ctx, ankle.x, ankle.y, knee.x, knee.y, 3.8, 4.4, 5.6, 4.4, false, p);
        dibujarSegmentoAnatomicoProCDM(ctx, knee.x, knee.y, hip.x, hip.y, 4.8, 8.6, 7.2, 7.6, true, intensidad);
        dibujarSegmentoAnatomicoProCDM(ctx, hip.x, hip.y, shoulder.x, shoulder.y, 7.2, 8.0, 7.6, 7.6, true, intensidad * 0.7);
        dibujarPelvisYShortCDM(ctx, hip.x, hip.y, 7.4);
        dibujarCuelloYCabezaCDM(ctx, shoulder.x, shoulder.y, shoulder.x + 5, shoulder.y - 12, 0.1 * p);
        dibujarArticulacionCapsulaCDM(ctx, knee.x, knee.y, 3.5, true);
        dibujarCalzadoDeportivoCDM(ctx, ankle.x, ankle.y, 15);
        dibujarDiscoOlimpicoProCDM(ctx, shoulder.x - 2, shoulder.y + 1, 11.5);
        if (mostrarTelemetria) dibujarHUDTelemetriaBiomecanicaCDM(ctx, p, `Rodilla ${Math.round(interpCDM(174, 86, p))}°`);
    }

    ctx.restore();
    return true;
}

function iniciarLoopBiomecanico60FPS() {
    if (window.__cdmBiomechLoopActivo) return;
    window.__cdmBiomechLoopActivo = true;
    const tick = (now) => {
        document.querySelectorAll(".stickman-tech-card").forEach(card => {
            if (card.offsetParent === null) return;
            const patron = card.dataset.patron || "squat";
            const duracionMs = card.classList.contains("slow-motion") ? 4400 : 2300;
            const faseFija = card.dataset.lockedPhase;
            const pLive = (faseFija !== undefined && faseFija !== "")
                ? parseFloat(faseFija)
                : (0.5 - 0.5 * Math.cos(((now % duracionMs) / duracionMs) * Math.PI * 2));
            const liveCanvas = card.querySelector(".biomech-live-canvas");
            if (liveCanvas) renderizarFrameAtletaAnatomicoCDM(liveCanvas, patron, pLive, true);
            card.querySelectorAll(".biomech-phase-canvas").forEach(cPhase => {
                const wActual = cPhase.clientWidth;
                if (wActual >= 24 && (cPhase.dataset.renderedW !== String(wActual) || cPhase.dataset.renderedPatron !== patron)) {
                    if (renderizarFrameAtletaAnatomicoCDM(cPhase, patron, parseFloat(cPhase.dataset.phase || "0"), false)) {
                        cPhase.dataset.renderedW = String(wActual);
                        cPhase.dataset.renderedPatron = patron;
                    }
                }
            });
        });
        document.querySelectorAll(".routine-stickman-mini canvas").forEach(miniCanvas => {
            if (miniCanvas.offsetParent === null) return;
            const patron = miniCanvas.dataset.patron || "squat";
            const pMini = 0.5 - 0.5 * Math.cos(((now % 2300) / 2300) * Math.PI * 2);
            renderizarFrameAtletaAnatomicoCDM(miniCanvas, patron, pMini, false);
        });
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

function fijarFaseEnVisorAnatomicoCDM(idCard, valorFase, elBox) {
    const card = document.getElementById(idCard);
    if (!card) return;
    const tag = card.querySelector(".stickman-live-tag");
    if (card.dataset.lockedPhase === String(valorFase)) {
        delete card.dataset.lockedPhase;
        card.querySelectorAll(".stickman-step-box").forEach(b => b.classList.remove("step-active"));
        if (tag) tag.innerText = "● En Movimiento 60 FPS";
    } else {
        card.dataset.lockedPhase = String(valorFase);
        card.querySelectorAll(".stickman-step-box").forEach(b => b.classList.remove("step-active"));
        if (elBox) elBox.classList.add("step-active");
        if (tag) tag.innerText = "⏸ Postura en Inspección (Tocá para reanudar)";
    }
}

function renderMiniHombrecitoSVG(nombreEjercicio = "", grupo = "") {
    const patron = detectarPatronMovimientoHombrecitoCDM(nombreEjercicio, grupo);
    const nomEsc = String(nombreEjercicio || "Ejercicio").replace(/'/g, "\\'");
    iniciarLoopBiomecanico60FPS();
    return `
        <div class="routine-stickman-mini" onclick="event.stopPropagation(); abrirModalAnimacionHombrecitoCDM('${nomEsc}', '${grupo || ""}')" title="Ver ejemplo técnico y video de ${nombreEjercicio}">
            <canvas data-patron="${patron}"></canvas>
        </div>
    `;
}

function generarBloqueAnimacionHombrecitosHTML(nombreEjercicio = "", grupo = "") {
    const patron = detectarPatronMovimientoHombrecitoCDM(nombreEjercicio, grupo);
    const info = INFO_BIOMECANICA_PATRONES_CDM[patron] || INFO_BIOMECANICA_PATRONES_CDM.squat;
    const idCard = "biomech_card_" + Math.random().toString(36).substring(2, 9);
    const fasesValores = [0.05, 0.52, 0.96, 0.35];
    iniciarLoopBiomecanico60FPS();
    return `
        <div id="${idCard}" class="stickman-tech-card" data-patron="${patron}">
            <div class="stickman-tech-header">
                <span class="stickman-tech-title"><i class="ri-body-scan-fill"></i> EJEMPLO DE EJERCICIO — ${info.titulo}</span>
                <button type="button" class="stickman-speed-btn" onclick="event.stopPropagation(); const c=document.getElementById('${idCard}'); delete c.dataset.lockedPhase; c.classList.toggle('slow-motion'); this.classList.toggle('slow-active'); this.innerText=c.classList.contains('slow-motion')?'🐢 Cámara Lenta (0.5x)':'⚡ Velocidad Real (1x)';">
                    ⚡ Velocidad Real (1x)
                </button>
            </div>
            <div class="biomech-muscle-strip">
                <span class="muscle-pill-primary">Músculos Primarios: ${info.primarios}</span>
                <span class="muscle-pill-secondary">Sinergistas: ${info.secundarios}</span>
            </div>
            <div class="stickman-showcase-layout">
                <div class="stickman-live-stage">
                    <canvas class="biomech-live-canvas"></canvas>
                    <span class="stickman-live-tag">● En Movimiento 60 FPS</span>
                </div>
                <div class="stickman-steps-strip">
                    ${fasesValores.map((valP, idx) => `
                        <div class="stickman-step-box" onclick="event.stopPropagation(); fijarFaseEnVisorAnatomicoCDM('${idCard}', ${valP}, this)">
                            <canvas class="biomech-phase-canvas" data-phase="${valP}"></canvas>
                            <span class="stickman-step-num">${idx + 1}</span>
                            <span class="stickman-step-lbl">${info.fases[idx]}</span>
                        </div>
                    `).join("")}
                </div>
            </div>
        </div>
    `;
}

function abrirModalAnimacionHombrecitoCDM(nombreEjercicio, grupo = "") {
    asegurarVideotecaCargada();
    asegurarModalVideoEnPaginaActualCDM();
    const matchVideo = buscarVideoDeEjercicioPorNombreCDM(nombreEjercicio);
    if (matchVideo) {
        abrirModalReproductorEjercicio(matchVideo.id);
        return;
    }
    const modal = document.getElementById("modalVideoEjercicio");
    if (!modal) return;
    const nomEsc = String(nombreEjercicio || "").replace(/'/g, "\\'");
    modal.innerHTML = `
        <div class="modal-window" style="max-width:720px;">
            <div class="modal-top">
                <div>
                    <span class="badge badge-celeste">EJEMPLO DE EJECUCIÓN DEL EJERCICIO</span>
                    <h3 style="color:var(--ink-900); margin-top:4px;">🏋️ ${nombreEjercicio}</h3>
                </div>
                <div style="display:flex; gap:0.4rem;">
                    <button type="button" class="btn btn-primary btn-sm col-admin-control" onclick="abrirModalEditarVideoDeEjercicioPorNombreCDM('${nomEsc}', '${grupo || "Tren Inferior"}')">
                        <i class="ri-video-upload-line"></i> Subir / Editar Video
                    </button>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalVideoEjercicio()">✕</button>
                </div>
            </div>
            ${generarBloqueAnimacionHombrecitosHTML(nombreEjercicio, grupo)}
        </div>
    `;
    modal.classList.remove("hidden");
}

abrirModalReproductorEjercicio = async function (idEx) {
    asegurarVideotecaCargada();
    const ex = (baseVideoteca || []).find(x => Number(x.id) === Number(idEx));
    if (!ex) return;
    asegurarModalVideoEnPaginaActualCDM();
    const modal = document.getElementById("modalVideoEjercicio");
    if (!modal) return;

    const esLocal = Boolean(ex.esVideoLocal || String(ex.videoUrl || "").startsWith("idb://"));
    const sinVideoSubido = ex.videoUrl === "biomech://simulador" || !ex.videoUrl;
    const embedUrl = (!esLocal && !sinVideoSubido) ? obtenerEmbedUrlVideo(ex.videoUrl) : "";
    const esMp4Directo = embedUrl.endsWith(".mp4") || embedUrl.endsWith(".webm") || embedUrl.endsWith(".mov");

    let bloqueReproductorHTML = "";
    if (!sinVideoSubido) {
        if (esLocal || esMp4Directo) {
            bloqueReproductorHTML = `<div class="video-iframe-container"><video id="reproductorVideoLocalModalCDM" src="${esMp4Directo ? embedUrl : ""}" controls autoplay playsinline></video></div>`;
        } else {
            bloqueReproductorHTML = `<div class="video-iframe-container"><iframe src="${embedUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
        }
    }
    const idIlust = "ilust_mod_" + ex.id;

    modal.innerHTML = `
        <div class="modal-window" style="max-width:720px;">
            <div class="modal-top">
                <div>
                    <span class="badge ${esLocal ? "badge-ok" : "badge-celeste"}">${esLocal ? "📹 VIDEO PROPIO" : ex.grupo}</span>
                    <h3 style="color:var(--ink-900); margin-top:4px;">🎥 ${ex.nombre}</h3>
                </div>
                <div style="display:flex; gap:0.35rem; align-items:center; flex-wrap:wrap;">
                    <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('${idIlust}').classList.toggle('hidden')">
                        <i class="ri-body-scan-fill"></i> Ejemplo 1-4
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm col-admin-control" onclick="abrirModalVideotecaProCDM(${ex.id})">
                        <i class="ri-edit-line"></i> Editar Video
                    </button>
                    <button type="button" class="btn btn-danger btn-sm col-admin-control" onclick="cerrarModalVideoEjercicio(); eliminarEjercicioVideotecaCDM(${ex.id});">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalVideoEjercicio()">✕</button>
                </div>
            </div>
            ${bloqueReproductorHTML}
            <div id="${idIlust}" class="${sinVideoSubido ? "" : "hidden"}">
                ${generarBloqueAnimacionHombrecitosHTML(ex.nombre, ex.grupo)}
            </div>
            <div style="background:var(--cdm-50); border:1px solid var(--line-celeste); padding:0.85rem; border-radius:12px; margin:0.75rem 0; font-size:0.83rem;">
                <strong style="color:var(--cdm-900);">✅ Claves Técnicas:</strong> ${ex.clavesTecnicas}
            </div>
            <div style="display:flex; justify-content:space-between; gap:0.5rem; flex-wrap:wrap;">
                <button type="button" class="btn btn-secondary btn-sm col-admin-control" onclick="cerrarModalVideoEjercicio(); insertarEjercicioDeVideotecaEnRutina(${ex.id});">➕ Usar en Rutina</button>
                <button type="button" class="btn btn-whatsapp btn-sm col-admin-control" onclick="enviarVideoEjercicioPorWhatsApp(${ex.id})"><i class="ri-whatsapp-line"></i> Enviar por WA</button>
            </div>
        </div>
    `;
    modal.classList.remove("hidden");

    if (esLocal && ex.videoLocalKey) {
        const reg = await obtenerArchivoVideoDesdeIDB(ex.videoLocalKey);
        const player = document.getElementById("reproductorVideoLocalModalCDM");
        if (reg && reg.blob && player) {
            player.src = URL.createObjectURL(reg.blob);
            player.play().catch(() => {});
        }
    }
};

renderizarVideotecaGym = function () {
    revincularBotonesAgregarVideoHTML();
    const cont = document.getElementById("contenedorGridVideotecaGym") || document.getElementById("contenedorTarjetasVideotecaGym");
    if (!cont) return;
    cont.classList.add("videoteca-grid");
    asegurarVideotecaCargada();

    const panelHead = cont.closest(".app-panel")?.querySelector(".panel-head");
    if (panelHead && !document.getElementById("barraGestionVideotecaPropietarioCDM")) {
        const divTools = document.createElement("div");
        divTools.id = "barraGestionVideotecaPropietarioCDM";
        divTools.className = "col-admin-control";
        divTools.style = "display:flex; gap:0.4rem; flex-wrap:wrap;";
        divTools.innerHTML = `
            <button type="button" class="btn btn-secondary btn-sm" onclick="restaurarVideosPorDefectoVideotecaCDM()"><i class="ri-refresh-line"></i> Restaurar Videos Base</button>
            <button type="button" class="btn btn-ghost btn-sm" onclick="vaciarVideosEjemploVideotecaCDM()"><i class="ri-delete-bin-6-line"></i> Quitar Ejemplos</button>
        `;
        panelHead.appendChild(divTools);
    }

    const q = (document.getElementById("inputBuscarVideoteca")?.value || "").toLowerCase().trim();
    const grupo = (document.getElementById("filtroMusculoVideoteca") || document.getElementById("filtroGrupoVideoteca"))?.value || "TODOS";

    let lista = [...baseVideoteca];
    if (grupo !== "TODOS") {
        lista = lista.filter(ex => ex.grupo === grupo || ex.grupoSecundario === grupo);
    }
    if (q) {
        lista = lista.filter(ex => ex.nombre.toLowerCase().includes(q) || ex.grupo.toLowerCase().includes(q) || ex.equipo.toLowerCase().includes(q));
    }

    if (lista.length === 0) {
        cont.innerHTML = `
            <div class="empty-box" style="grid-column:1/-1;">
                <p style="margin-bottom:0.75rem;">No hay videos en este filtro.</p>
                <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalVideotecaProCDM()">+ Subir Video Propio</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="restaurarVideosPorDefectoVideotecaCDM()">Restaurar Videos Base</button>
            </div>
        `;
        return;
    }

    cont.innerHTML = lista.map(ex => {
        const esLocal = Boolean(ex.esVideoLocal || String(ex.videoUrl || "").startsWith("idb://"));
        return `
        <div class="video-exercise-card">
            <div class="video-thumb-box" onclick="abrirModalReproductorEjercicio(${ex.id})">
                <img src="${ex.imagenPreview || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=700&q=80'}" alt="${ex.nombre}">
                <div class="video-play-overlay"><div class="play-circle-btn"><i class="ri-play-fill"></i></div></div>
                <span class="badge ${esLocal ? "badge-ok" : "badge-celeste"}" style="position:absolute; top:0.75rem; left:0.75rem; z-index:2;">${esLocal ? "📹 Video Propio" : ex.grupo}</span>
                <div class="video-admin-floating-bar col-admin-control" onclick="event.stopPropagation();">
                    <button type="button" class="video-card-icon-btn" onclick="abrirModalVideotecaProCDM(${ex.id})" title="Editar video"><i class="ri-edit-line"></i></button>
                    <button type="button" class="video-card-icon-btn danger" onclick="eliminarEjercicioVideotecaCDM(${ex.id})" title="Eliminar video"><i class="ri-delete-bin-line"></i></button>
                </div>
                <span class="badge badge-ok" style="position:absolute; bottom:0.75rem; right:0.75rem; z-index:2;">${ex.seriesSugeridas} × ${ex.repsSugeridas}</span>
            </div>
            <div class="video-card-body">
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    ${renderMiniHombrecitoSVG(ex.nombre, ex.grupo)}
                    <div style="min-width:0; flex:1;">
                        <h4 style="font-size:1rem; font-weight:800; color:var(--ink-900); margin:0;">${ex.nombre}</h4>
                        <small style="color:var(--ink-500); font-weight:700;">🏋️ ${ex.equipo} • ${ex.grupo}</small>
                    </div>
                </div>
                <div class="video-cues-box"><strong>💡 Clave Técnica:</strong> ${ex.clavesTecnicas}</div>
                <div style="display:flex; gap:0.35rem; margin-top:auto; padding-top:0.5rem; flex-wrap:wrap;">
                    <button type="button" class="btn btn-primary btn-sm" style="flex:1;" onclick="abrirModalReproductorEjercicio(${ex.id})">▶ Ver Video</button>
                    <button type="button" class="btn btn-secondary btn-sm col-admin-control" onclick="abrirModalVideotecaProCDM(${ex.id})">✏️ Editar</button>
                    <button type="button" class="btn btn-danger btn-sm col-admin-control" onclick="eliminarEjercicioVideotecaCDM(${ex.id})">🗑️</button>
                </div>
            </div>
        </div>
    `}).join("");
};

// =========================================================================
// PARTE 3: RUTINAS POR SECTOR / DEPORTE -> TIPOS -> RUTINA 1, 2... -> EJERCICIOS + MEMORIA KILOS
// =========================================================================

const CATALOGO_TIPOS_RUTINA_CDM = [
    { clave: "Hipertrofia", emoji: "💪", titulo: "Hipertrofia", sub: "Aumento de masa muscular, volumen estructural y trabajo por grupos musculares." },
    { clave: "Fuerza", emoji: "🏋️", titulo: "Fuerza", sub: "Fuerza máxima, progresión de cargas pesadas (% 1RM) y levantamientos básicos." },
    { clave: "Movilidad", emoji: "🤸", titulo: "Movilidad", sub: "Movilidad articular, flexibilidad, entrada en calor y liberación miofascial." },
    { clave: "Rehabilitación", emoji: "🏥", titulo: "Rehabilitación", sub: "Readaptación física, protocolos preventivos, isométricos y vuelta al campo." },
    { clave: "Potencia", emoji: "⚡", titulo: "Potencia", sub: "Pliometría, saltos explosivos, velocidad de reacción y transferencia deportiva." },
    { clave: "Funcional y Core", emoji: "🔥", titulo: "Funcional y Core", sub: "Zona media antirrotacional, estabilidad lumbo-pélvica y circuitos metabólicos." }
];

let estadoNavegacionRutinasCDM = { paso: "tipos", tipoActivo: null, rutinaIdActiva: null };
let filtroSectorDeporteRutinasCDM = null;
let filtroCategoriaSectorRutinasCDM = "TODAS";

function normalizarTipoRutinaCanonicoCDM(objetivoRaw = "") {
    const t = normalizarTextoEjercicioCDM(objetivoRaw);
    if (t.includes("hipertrofia") || t.includes("musculacion")) return "Hipertrofia";
    if (t.includes("fuerza")) return "Fuerza";
    if (t.includes("movilidad") || t.includes("flexibilidad")) return "Movilidad";
    if (t.includes("rehab") || t.includes("lesion") || t.includes("readapt")) return "Rehabilitación";
    if (t.includes("potencia") || t.includes("pliometr") || t.includes("velocidad")) return "Potencia";
    if (t.includes("funcional") || t.includes("core") || t.includes("cardio")) return "Funcional y Core";
    return "Hipertrofia";
}

function obtenerSectoresDeportesHabilitadosCDM() {
    let extras = [];
    try {
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        if (Array.isArray(lic.deportesExtra)) extras = lic.deportesExtra;
    } catch {}
    const base = [
        { clave: "Gimnasio", icono: "🏋️", titulo: "Gimnasio" },
        { clave: "Futbol", icono: "⚽", titulo: "Fútbol" },
        { clave: "Hockey", icono: "🏑", titulo: "Hockey" }
    ];
    extras.forEach(d => {
        if (!base.some(b => b.clave.toLowerCase() === d.toLowerCase())) base.push({ clave: d, icono: "🏅", titulo: d });
    });
    return base;
}

function obtenerSectorActivoParaRutinasCDM() {
    if (filtroSectorDeporteRutinasCDM) return filtroSectorDeporteRutinasCDM;
    if (document.body.dataset.page === "perfil-individual") {
        const p = typeof obtenerJugadorActualPorURL === "function" ? obtenerJugadorActualPorURL() : null;
        if (p && p.deporte) return p.deporte;
    }
    return deportePagina || "Gimnasio";
}

function cambiarSectorDeporteEnRutinasCDM(nuevoSector) {
    filtroSectorDeporteRutinasCDM = nuevoSector;
    filtroCategoriaSectorRutinasCDM = "TODAS";
    estadoNavegacionRutinasCDM.paso = "tipos";
    estadoNavegacionRutinasCDM.tipoActivo = null;
    estadoNavegacionRutinasCDM.rutinaIdActiva = null;
    refrescarVistasRutinasJerarquicasCDM();
}

function cambiarCategoriaSectorEnRutinasCDM(nuevaCat) {
    filtroCategoriaSectorRutinasCDM = nuevaCat;
    refrescarVistasRutinasJerarquicasCDM();
}

function irAPaso1TiposDeRutinaCDM() {
    estadoNavegacionRutinasCDM = { paso: "tipos", tipoActivo: null, rutinaIdActiva: null };
    refrescarVistasRutinasJerarquicasCDM();
}
function irAPaso2ListaRutinasDeTipoCDM(claveTipo) {
    estadoNavegacionRutinasCDM = { paso: "rutinas", tipoActivo: claveTipo, rutinaIdActiva: null };
    refrescarVistasRutinasJerarquicasCDM();
}
function irAPaso3EjerciciosDeRutinaCDM(idRutina) {
    const r = baseRutinas.find(x => Number(x.id) === Number(idRutina));
    if (!r) return;
    estadoNavegacionRutinasCDM = { paso: "ejercicios", tipoActivo: normalizarTipoRutinaCanonicoCDM(r.objetivo), rutinaIdActiva: Number(r.id) };
    refrescarVistasRutinasJerarquicasCDM();
}

function obtenerRutinasContextoActualCDM() {
    let lista = [...(baseRutinas || [])];
    if (document.body.dataset.page === "perfil-individual") {
        const p = typeof obtenerJugadorActualPorURL === "function" ? obtenerJugadorActualPorURL() : null;
        if (p) {
            return lista.filter(r =>
                Number(r.personaId) === Number(p.id) ||
                (r.esGrupal && r.deporteDestino === p.deporte && (r.categoriaDestino === p.categoria || r.categoriaDestino === "General"))
            );
        }
    }
    const sectorActivo = obtenerSectorActivoParaRutinasCDM();
    if (sectorActivo !== "TODOS") {
        lista = lista.filter(r => (r.deporteDestino || "Gimnasio").toLowerCase() === sectorActivo.toLowerCase());
    }
    if (sectorActivo !== "Gimnasio" && sectorActivo !== "TODOS" && filtroCategoriaSectorRutinasCDM !== "TODAS") {
        lista = lista.filter(r => r.categoriaDestino === filtroCategoriaSectorRutinasCDM);
    }
    const fId = document.getElementById("filtroPersonaRutinasAdmin")?.value || "TODAS";
    if (fId !== "TODAS") {
        const per = basePersonas.find(p => String(p.id) === String(fId));
        lista = lista.filter(r => String(r.personaId) === String(fId) || (r.esGrupal && per && r.deporteDestino === per.deporte && r.categoriaDestino === per.categoria));
    }
    return lista;
}

// Memoria de Kilos en Vivo (Punto 2)
function obtenerResumenSobrecargaEjercicioCDM(persona, nombreEjercicio, pesoSugeridoTexto = "") {
    const numSugerido = parseFloat(String(pesoSugeridoTexto || "").replace(",", "."));
    if (!persona || !Array.isArray(persona.evaluaciones)) {
        return { tieneHistorial: false, ultimoKg: !isNaN(numSugerido) && numSugerido > 0 ? numSugerido : 60, ultimasReps: 8, mejor1RM: 0, metaTexto: "Anotá tus kilos hoy" };
    }
    const clave = normalizarTextoEjercicioCDM(nombreEjercicio);
    const historial = persona.evaluaciones.filter(ev => {
        const cEv = normalizarTextoEjercicioCDM(ev.ejercicio);
        return cEv === clave || cEv.includes(clave) || clave.includes(cEv);
    });
    if (historial.length === 0) {
        return { tieneHistorial: false, ultimoKg: !isNaN(numSugerido) && numSugerido > 0 ? numSugerido : 60, ultimasReps: 8, mejor1RM: 0, metaTexto: "1° registro de peso" };
    }
    const ultimo = historial[historial.length - 1];
    const mejor1RM = Math.max(...historial.map(h => Number(h.valor) || 0));
    let kgAnt = Number(ultimo.valor) || 60, repsAnt = 8;
    const m = String(ultimo.detalle || "").match(/([\d.]+)\s*kg\s*[×x]\s*(\d+)/i);
    if (m) { kgAnt = parseFloat(m[1]) || kgAnt; repsAnt = parseInt(m[2]) || 8; }
    const metaKg = Math.round((kgAnt + 2.5) * 10) / 10;
    return {
        tieneHistorial: true,
        ultimoKg: kgAnt,
        ultimasReps: repsAnt,
        mejor1RM,
        ultimoDetalle: `${kgAnt}kg × ${repsAnt}`,
        metaTexto: `🎯 Meta hoy: ${metaKg}kg × ${repsAnt}`
    };
}

function construirBarraMemoriaKilosHTML(personaId, idRutina, idxEj, ex) {
    const p = basePersonas.find(x => Number(x.id) === Number(personaId));
    if (!p) return "";
    const info = obtenerResumenSobrecargaEjercicioCDM(p, ex.nombre, ex.peso);
    const inputKgId = `live_kg_${idRutina}_${idxEj}`;
    const inputRepsId = `live_reps_${idRutina}_${idxEj}`;
    const nomEsc = String(ex.nombre || "").replace(/'/g, "\\'");
    return `
        <div class="live-overload-bar" onclick="event.stopPropagation();">
            <div class="live-overload-memory">
                <span class="overload-chip-last">⏮️ Última: <b>${info.tieneHistorial ? info.ultimoDetalle : "Sin marca"}</b></span>
                <span class="overload-chip-target">${info.metaTexto}</span>
                ${info.mejor1RM > 0 ? `<span class="overload-chip-pr" onclick="abrirModalStoryRecordPRCDM(${p.id}, '${nomEsc}', ${info.mejor1RM})">🏆 PR: ${info.mejor1RM}kg 📸</span>` : ""}
            </div>
            <div class="live-overload-inputs">
                <input type="number" step="0.5" id="${inputKgId}" value="${info.ultimoKg}">
                <span style="font-size:0.72rem; font-weight:700;">kg ×</span>
                <input type="number" step="1" id="${inputRepsId}" value="${info.ultimasReps}" style="width:58px !important;">
                <button type="button" class="btn btn-primary btn-sm" style="min-height:31px; padding:0.2rem 0.65rem;" onclick="guardarPesoSerieEnVivoCDM(${p.id}, '${nomEsc}', '${inputKgId}', '${inputRepsId}')">💾 Guardar 1RM</button>
            </div>
        </div>
    `;
}

function guardarPesoSerieEnVivoCDM(personaId, nombreEjercicio, idInputKg, idInputReps) {
    const p = basePersonas.find(x => Number(x.id) === Number(personaId));
    if (!p) return;
    const kg = parseFloat(document.getElementById(idInputKg)?.value);
    const reps = parseInt(document.getElementById(idInputReps)?.value) || 1;
    if (isNaN(kg) || kg <= 0) return alert("⚠️ Ingresá un peso válido.");

    const mejorAnterior = obtenerResumenSobrecargaEjercicioCDM(p, nombreEjercicio, "").mejor1RM || 0;
    const nuevo1RM = Math.round((reps === 1 ? kg : kg * (1 + reps / 30)) * 10) / 10;
    const nomCanon = agregarEjercicioInventadoAlCatalogoCDM(nombreEjercicio, "fuerza_1rm", true) || nombreEjercicio;

    if (!Array.isArray(p.evaluaciones)) p.evaluaciones = [];
    p.evaluaciones.push({
        id: Date.now(),
        fecha: obtenerHoyISO(),
        ejercicio: nomCanon,
        tipo: "fuerza_kg",
        valor: nuevo1RM,
        unidad: "kg (1RM)",
        detalle: `${kg} kg × ${reps} reps (1RM: ${nuevo1RM} kg)`,
        nota: "⚡ Memoria en Vivo desde Rutina"
    });
    guardarDatosCDM();
    refrescarVistasRutinasJerarquicasCDM();

    if (nuevo1RM > mejorAnterior) {
        mostrarToast(`🔥 ¡NUEVO RÉCORD PERSONAL EN ${nomCanon.toUpperCase()}! 1RM: ${nuevo1RM} kg`);
        abrirModalStoryRecordPRCDM(p.id, nomCanon, nuevo1RM, `${kg} kg × ${reps} reps`);
    } else {
        mostrarToast(`✓ Serie registrada (${kg}kg × ${reps} = 1RM ${nuevo1RM}kg).`);
    }
}

function construirExploradorJerarquicoRutinasHTML(listaRutinasContexto, modoVista = "admin") {
    asegurarVideotecaCargada();
    asegurarModalVideoEnPaginaActualCDM();

    const sectorActivo = obtenerSectorActivoParaRutinasCDM();
    const sectoresDisponibles = obtenerSectoresDeportesHabilitadosCDM();
    const esFichaIndividual = document.body.dataset.page === "perfil-individual";

    let barraSelectorSectorHTML = "";
    if (!esFichaIndividual && modoVista === "admin") {
        const botonesSectores = [
            ...sectoresDisponibles.map(s => `<button type="button" class="seg-btn ${sectorActivo === s.clave ? "active" : ""}" onclick="cambiarSectorDeporteEnRutinasCDM('${s.clave}')">${s.icono} ${s.titulo}</button>`),
            `<button type="button" class="seg-btn ${sectorActivo === "TODOS" ? "active" : ""}" onclick="cambiarSectorDeporteEnRutinasCDM('TODOS')">🏢 Todos</button>`
        ].join("");

        const selectorCat = (sectorActivo !== "Gimnasio" && sectorActivo !== "TODOS") ? `
            <select onchange="cambiarCategoriaSectorEnRutinasCDM(this.value)" style="width:auto; min-height:34px; font-weight:700; font-size:0.78rem;">
                <option value="TODAS" ${filtroCategoriaSectorRutinasCDM === "TODAS" ? "selected" : ""}>🏟️ Todas las Categorías (${sectorActivo})</option>
                ${["Sub 13", "Sub 15", "Sub 17", "Reserva", "Primera"].map(c => `<option value="${c}" ${filtroCategoriaSectorRutinasCDM === c ? "selected" : ""}>${c}</option>`).join("")}
            </select>
        ` : "";

        barraSelectorSectorHTML = `
            <div class="category-bar-panel" style="margin-bottom:1rem;">
                <div class="category-bar-label"><i class="ri-apps-2-line"></i><span>Sector / Deporte de las Rutinas:</span></div>
                <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
                    <div class="segmented-bar">${botonesSectores}</div>
                    ${selectorCat}
                </div>
            </div>
        `;
    }

    const mapaPorTipo = {};
    CATALOGO_TIPOS_RUTINA_CDM.forEach(t => { mapaPorTipo[t.clave] = []; });
    (listaRutinasContexto || []).forEach(r => {
        const c = normalizarTipoRutinaCanonicoCDM(r.objetivo);
        if (!mapaPorTipo[c]) mapaPorTipo[c] = [];
        mapaPorTipo[c].push(r);
    });
    Object.keys(mapaPorTipo).forEach(k => mapaPorTipo[k].sort((a, b) => Number(a.id) - Number(b.id)));

    const pasoActual = estadoNavegacionRutinasCDM.paso || "tipos";
    const etiquetaSectorActual = sectorActivo === "TODOS" ? "Todos los Sectores" : sectorActivo;

    if (pasoActual === "tipos" || !estadoNavegacionRutinasCDM.tipoActivo) {
        const tarjetasTiposGrandes = CATALOGO_TIPOS_RUTINA_CDM.map(t => {
            const cant = (mapaPorTipo[t.clave] || []).length;
            return `
                <button type="button" class="routine-type-big-btn animate-in" onclick="irAPaso2ListaRutinasDeTipoCDM('${t.clave}')">
                    <div class="routine-type-big-head">
                        <div class="routine-type-big-icon">${t.emoji}</div>
                        <span class="routine-type-big-count">${cant} ${cant === 1 ? "Rutina" : "Rutinas"}</span>
                    </div>
                    <div class="routine-type-big-body">
                        <h3>${t.titulo}</h3>
                        <p>${t.sub}</p>
                    </div>
                    <div class="routine-type-big-footer">
                        <span>Abrir rutinas de ${t.titulo} (${etiquetaSectorActual})</span>
                        <i class="ri-arrow-right-line"></i>
                    </div>
                </button>
            `;
        }).join("");

        return `
            ${barraSelectorSectorHTML}
            <div class="routine-step-topbar">
                <div class="routine-breadcrumb">
                    <span class="badge badge-celeste">📍 SECTOR: ${etiquetaSectorActual.toUpperCase()}</span>
                    <span>Seleccioná un Tipo de Rutina (${listaRutinasContexto.length} planes en este sector)</span>
                </div>
                ${modoVista === "admin" ? `
                    <button type="button" class="btn btn-primary btn-sm col-admin-control" onclick="abrirModalCrearNuevaRutinaCDM()">
                        <i class="ri-add-circle-line"></i> + Agregar Rutina en ${etiquetaSectorActual}
                    </button>
                ` : ""}
            </div>
            <div class="routine-types-big-grid">${tarjetasTiposGrandes}</div>
        `;
    }

    const infoTipo = CATALOGO_TIPOS_RUTINA_CDM.find(t => t.clave === estadoNavegacionRutinasCDM.tipoActivo) || CATALOGO_TIPOS_RUTINA_CDM[0];
    const rutinasDelTipo = mapaPorTipo[infoTipo.clave] || [];

    if (pasoActual === "rutinas" || !estadoNavegacionRutinasCDM.rutinaIdActiva) {
        const tarjetasRutinas = rutinasDelTipo.map((r, idx) => {
            const numOrden = idx + 1;
            const tituloLimpio = (r.nombre || "").replace(/^Rutina\s*\d+\s*[-—:]?\s*/i, "").trim() || r.nombre;
            const totalSeries = (r.ejercicios || []).reduce((acc, ex) => acc + (parseInt(ex.series) || 0), 0);
            return `
                <div class="routine-folder-step-card animate-in" onclick="irAPaso3EjerciciosDeRutinaCDM(${r.id})">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                            <span class="badge badge-celeste">📋 RUTINA ${numOrden} • ${(r.deporteDestino || "Gimnasio").toUpperCase()}</span>
                            <span class="badge badge-purple">${(r.ejercicios || []).length} Ejercicios • ${totalSeries} Series</span>
                        </div>
                        <h4>Rutina ${numOrden} — ${tituloLimpio}</h4>
                        <small style="color:var(--ink-500); font-weight:600; display:block;">
                            ${r.etiquetaDestino || (r.esGrupal ? `🏟️ ${r.deporteDestino} (${r.categoriaDestino})` : "👤 Plan Individual")} • 🗓️ ${r.dias || "Semanal"}
                        </small>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:0.45rem; padding-top:0.75rem; border-top:1px solid var(--line);" onclick="event.stopPropagation();">
                        <button type="button" class="btn btn-primary btn-sm" style="flex:1;" onclick="irAPaso3EjerciciosDeRutinaCDM(${r.id})">
                            Ver Ejercicios (${(r.ejercicios || []).length}) <i class="ri-arrow-right-line"></i>
                        </button>
                        ${modoVista === "admin" ? `
                            <button type="button" class="btn btn-whatsapp btn-sm col-admin-control" onclick="enviarWhatsAppRutinaDirecto(${r.id})"><i class="ri-whatsapp-line"></i></button>
                            <button type="button" class="btn btn-ghost btn-sm col-admin-control" onclick="renombrarRutinaExistentePromptCDM(${r.id})"><i class="ri-edit-line"></i></button>
                            <button type="button" class="btn btn-danger btn-sm col-admin-control" onclick="borrarRutinaGlobal(${r.id})"><i class="ri-delete-bin-line"></i></button>
                        ` : ""}
                    </div>
                </div>
            `;
        }).join("");

        return `
            ${barraSelectorSectorHTML}
            <div class="routine-step-topbar">
                <div class="routine-breadcrumb">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="irAPaso1TiposDeRutinaCDM()"><i class="ri-arrow-left-line"></i> Volver a Tipos</button>
                    <span class="badge badge-celeste">${infoTipo.emoji} ${infoTipo.titulo.toUpperCase()} (${rutinasDelTipo.length})</span>
                </div>
                ${modoVista === "admin" ? `
                    <button type="button" class="btn btn-primary btn-sm col-admin-control" onclick="abrirModalCrearNuevaRutinaCDM('${infoTipo.clave}')">
                        + Agregar Rutina en ${infoTipo.titulo}
                    </button>
                ` : ""}
            </div>
            ${rutinasDelTipo.length > 0 ? `<div class="routines-list-step-grid">${tarjetasRutinas}</div>` : `
                <div class="empty-box">
                    <p style="margin-bottom:0.75rem;">No hay rutinas de ${infoTipo.titulo} cargadas en ${etiquetaSectorActual}.</p>
                    <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalCrearNuevaRutinaCDM('${infoTipo.clave}')">+ Agregar Rutina 1</button>
                </div>
            `}
        `;
    }

    const rutinaActiva = rutinasDelTipo.find(r => Number(r.id) === Number(estadoNavegacionRutinasCDM.rutinaIdActiva))
                      || baseRutinas.find(r => Number(r.id) === Number(estadoNavegacionRutinasCDM.rutinaIdActiva));
    if (!rutinaActiva) {
        irAPaso2ListaRutinasDeTipoCDM(infoTipo.clave);
        return "";
    }
    const numOrdenRutina = Math.max(1, rutinasDelTipo.findIndex(r => Number(r.id) === Number(rutinaActiva.id)) + 1);

    const detalleHTML = modoVista === "admin"
        ? renderDetalleRutinaJerarquicaAdmin(rutinaActiva, numOrdenRutina, infoTipo)
        : renderDetalleRutinaJerarquicaUsuario(rutinaActiva, numOrdenRutina, infoTipo);

    return `
        ${barraSelectorSectorHTML}
        <div class="routine-step-topbar">
            <div class="routine-breadcrumb">
                <button type="button" class="btn btn-ghost btn-sm" onclick="irAPaso1TiposDeRutinaCDM()">Tipos</button>
                <i class="ri-arrow-right-s-line"></i>
                <button type="button" class="btn btn-secondary btn-sm" onclick="irAPaso2ListaRutinasDeTipoCDM('${infoTipo.clave}')">
                    <i class="ri-arrow-left-line"></i> Volver a Rutinas de ${infoTipo.titulo}
                </button>
            </div>
            ${modoVista === "admin" ? `
                <button type="button" class="btn btn-primary btn-sm col-admin-control" onclick="abrirModalAgregarEjercicioARutinaExistenteCDM(${rutinaActiva.id})">
                    + Agregar Ejercicio a esta Rutina
                </button>
            ` : ""}
        </div>
        <div class="animate-in">${detalleHTML}</div>
    `;
}

function renderDetalleRutinaJerarquicaAdmin(r, numeroOrden, infoTipo) {
    const totalSeries = (r.ejercicios || []).reduce((acc, ex) => acc + (parseInt(ex.series) || 0), 0);
    const claseTema = obtenerClaseGradienteRutinaCDM(r.objetivo);
    const tituloMostrado = /^Rutina\s*\d+/i.test(r.nombre || "") ? r.nombre : `Rutina ${numeroOrden} — ${r.nombre}`;
    const jugFicha = typeof obtenerJugadorActualPorURL === "function" ? obtenerJugadorActualPorURL() : null;
    const idPersonaRutina = r.personaId || (jugFicha ? jugFicha.id : null);

    const ejerciciosHTML = (r.ejercicios || []).map((ex, i) => {
        const matchVideo = buscarVideoDeEjercicioPorNombreCDM(ex.nombre);
        const nomEsc = String(ex.nombre || "").replace(/'/g, "\\'");
        const idDrawer = `anim_drawer_${r.id}_${i}`;
        const formaLimpia = ex.forma ? ex.forma.replace(/\(Video:.*?\)/gi, "").trim() : "";

        const miniaturaVideoHTML = matchVideo ? `
            <div class="routine-ex-thumb" onclick="abrirModalReproductorEjercicio(${matchVideo.id})" title="Ver video de ${ex.nombre}">
                <img src="${matchVideo.imagenPreview || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=700&q=80'}" alt="${ex.nombre}">
                <div class="routine-ex-play"><i class="ri-play-fill"></i></div>
            </div>
        ` : "";

        return `
            <div class="routine-pro-ex-item" style="flex-direction:column; align-items:stretch;">
                <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">
                    ${miniaturaVideoHTML}
                    ${renderMiniHombrecitoSVG(ex.nombre, r.objetivo)}
                    <div class="routine-pro-ex-body">
                        <div class="routine-pro-ex-title-row" style="flex-wrap:wrap;">
                            <strong style="font-size:0.95rem;">${i + 1}. ${ex.nombre}</strong>
                            <div style="display:flex; gap:0.3rem; flex-wrap:wrap;">
                                ${matchVideo ? `<button type="button" class="routine-video-mini-btn" onclick="abrirModalReproductorEjercicio(${matchVideo.id})"><i class="ri-play-circle-fill"></i> Video</button>` : ""}
                                <button type="button" class="routine-video-mini-btn" onclick="document.getElementById('${idDrawer}').classList.toggle('hidden')">
                                    <i class="ri-body-scan-fill"></i> Ejemplo 1-4
                                </button>
                                <button type="button" class="routine-video-mini-btn col-admin-control" onclick="abrirModalEditarVideoDeEjercicioPorNombreCDM('${nomEsc}', '${r.objetivo || "Tren Inferior"}')" title="Subir o editar el video de este ejercicio">
                                    <i class="ri-video-upload-line"></i> ${matchVideo ? "Editar Video" : "+ Video"}
                                </button>
                                <button type="button" class="routine-video-mini-btn col-admin-control" onclick="abrirModalAgregarEjercicioARutinaExistenteCDM(${r.id}, ${i})" title="Editar ejercicio">
                                    <i class="ri-edit-line"></i>
                                </button>
                                <button type="button" class="routine-video-mini-btn col-admin-control" style="color:var(--err-ink);" onclick="eliminarEjercicioDeRutinaExistenteCDM(${r.id}, ${i})">
                                    <i class="ri-delete-bin-line"></i>
                                </button>
                            </div>
                        </div>
                        <div class="routine-pro-ex-pills">
                            <span class="r-pill r-pill-series"><i class="ri-repeat-line"></i> ${ex.series} series × ${ex.reps}</span>
                            <span class="r-pill r-pill-carga"><i class="ri-scales-3-line"></i> ${ex.peso || "A ajustar"}</span>
                            <span class="r-pill r-pill-pausa"><i class="ri-timer-line"></i> Pausa ${ex.pausa || "90s"}</span>
                        </div>
                        ${formaLimpia ? `<div class="routine-pro-ex-cue">💡 ${formaLimpia}</div>` : ""}
                    </div>
                </div>
                ${idPersonaRutina ? construirBarraMemoriaKilosHTML(idPersonaRutina, r.id, i, ex) : ""}
                <div id="${idDrawer}" class="hidden">${generarBloqueAnimacionHombrecitosHTML(ex.nombre, r.objetivo)}</div>
            </div>
        `;
    }).join("");

    return `
        <div class="routine-pro-card">
            <div class="routine-pro-header ${claseTema}">
                <div class="routine-pro-header-top">
                    <div style="display:flex; gap:0.4rem; flex-wrap:wrap; align-items:center;">
                        <span class="routine-dest-badge">📍 ${r.deporteDestino || "Gimnasio"} (${r.categoriaDestino || "General"})</span>
                        <span class="routine-dest-badge">${infoTipo.emoji} ${infoTipo.titulo} • Rutina #${numeroOrden}</span>
                        <span class="routine-vol-badge">🔥 ${(r.ejercicios || []).length} Ejerc. • ${totalSeries} Series</span>
                    </div>
                    <div style="display:flex; gap:0.35rem;">
                        <button type="button" class="routine-del-btn col-admin-control" onclick="renombrarRutinaExistentePromptCDM(${r.id})"><i class="ri-edit-line"></i></button>
                        <button type="button" class="routine-del-btn col-admin-control" onclick="borrarRutinaGlobal(${r.id})"><i class="ri-delete-bin-line"></i></button>
                    </div>
                </div>
                <h4 class="routine-pro-title">${tituloMostrado}</h4>
                <div class="routine-pro-meta">
                    <span>🎯 ${r.etiquetaDestino || "Plan General"}</span> • <span>🗓️ ${r.dias || "Semanal"}</span>
                </div>
            </div>
            <div class="routine-pro-ex-list">${ejerciciosHTML}</div>
            ${r.notas ? `<div class="routine-pro-coach-note"><i class="ri-chat-smile-3-line"></i> <div><b>Nota del Profe:</b> ${r.notas}</div></div>` : ""}
            <div class="routine-pro-footer">
                <button type="button" class="btn btn-whatsapp btn-sm" style="flex:1;" onclick="enviarWhatsAppRutinaDirecto(${r.id})"><i class="ri-whatsapp-line"></i> Enviar por WhatsApp</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="copiarRutinaPortapapeles(${r.id})"><i class="ri-file-copy-line"></i> Copiar</button>
            </div>
        </div>
    `;
}

function renderDetalleRutinaJerarquicaUsuario(r, numeroOrden, infoTipo) {
    const mapaSeries = typeof obtenerMapaSeriesHoyCDM === "function" ? obtenerMapaSeriesHoyCDM() : {};
    let seriesTotalesRutina = 0, seriesHechasRutina = 0;
    const tituloMostrado = /^Rutina\s*\d+/i.test(r.nombre || "") ? r.nombre : `Rutina ${numeroOrden} — ${r.nombre}`;
    const jugActual = (typeof obtenerJugadorActualPorURL === "function" && obtenerJugadorActualPorURL())
                   || (typeof obtenerSocioLogueadoURLoSession === "function" && obtenerSocioLogueadoURLoSession());
    const idPersonaActiva = jugActual ? jugActual.id : r.personaId;

    const items = (r.ejercicios || []).map((ex, i) => {
        const matchVideo = buscarVideoDeEjercicioPorNombreCDM(ex.nombre);
        const nomEsc = (ex.nombre || "").replace(/'/g, "\\'");
        const pausaEsc = (ex.pausa || "90s").replace(/'/g, "\\'");
        const cantSeries = Math.min(8, Math.max(1, parseInt(ex.series) || 4));
        seriesTotalesRutina += cantSeries;

        let botonesSeriesHTML = "", completadasCount = 0;
        for (let s = 1; s <= cantSeries; s++) {
            const claveS = `${r.id}_${i}_S${s}`;
            const ok = Boolean(mapaSeries[claveS]);
            if (ok) { completadasCount++; seriesHechasRutina++; }
            botonesSeriesHTML += `<button type="button" class="serie-check-pill ${ok ? "done" : ""}" onclick="alternarSerieCompletadaCDM('${claveS}', '${pausaEsc}', '${nomEsc}', ${cantSeries}, ${r.id}, ${i})">${ok ? "✓" : ""} S${s}</button>`;
        }
        const idUserDrawer = `user_anim_drawer_${r.id}_${i}`;
        const thumbVideoUserHTML = matchVideo ? `
            <div class="routine-ex-thumb" onclick="abrirModalReproductorEjercicio(${matchVideo.id})">
                <img src="${matchVideo.imagenPreview || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=700&q=80'}" alt="${ex.nombre}">
                <div class="routine-ex-play"><i class="ri-play-fill"></i></div>
            </div>
        ` : "";

        return `
            <div class="user-ex-pro-card ${completadasCount === cantSeries ? "ex-completed" : ""}">
                <div class="user-ex-top-row" style="justify-content:space-between; flex-wrap:wrap;">
                    <div style="display:flex; align-items:center; gap:0.75rem; flex:1;">
                        ${thumbVideoUserHTML}
                        ${renderMiniHombrecitoSVG(ex.nombre, r.objetivo)}
                        <div class="user-ex-title-box">
                            <span class="badge badge-celeste" style="font-size:0.64rem;">${ex.series} × ${ex.reps} • ${ex.peso || "A ajustar"}</span>
                            <h4 style="margin-top:0.2rem;">${i + 1}. ${ex.nombre}</h4>
                        </div>
                    </div>
                    <div style="display:flex; gap:0.35rem;">
                        ${matchVideo ? `<button type="button" class="btn btn-primary btn-sm" onclick="abrirModalReproductorEjercicio(${matchVideo.id})"><i class="ri-play-circle-line"></i> Video</button>` : ""}
                        <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('${idUserDrawer}').classList.toggle('hidden')"><i class="ri-body-scan-fill"></i> Ejemplo 1-4</button>
                    </div>
                </div>
                <div class="user-ex-series-bar">
                    <span class="user-ex-series-lbl">Series hoy:</span>
                    <div class="user-ex-series-pills">${botonesSeriesHTML}</div>
                </div>
                ${idPersonaActiva ? construirBarraMemoriaKilosHTML(idPersonaActiva, r.id, i, ex) : ""}
                <div id="${idUserDrawer}" class="hidden">${generarBloqueAnimacionHombrecitosHTML(ex.nombre, r.objetivo)}</div>
            </div>
        `;
    }).join("");

    const pct = seriesTotalesRutina > 0 ? Math.round((seriesHechasRutina / seriesTotalesRutina) * 100) : 0;
    return `
        <div class="user-workout-pro-card">
            <div class="user-workout-banner">
                <div class="user-workout-banner-left">
                    <span class="user-workout-type-pill">${infoTipo.emoji} ${infoTipo.titulo} • Rutina #${numeroOrden}</span>
                    <h3>${tituloMostrado}</h3>
                </div>
                <div class="user-workout-progress-card">
                    <strong style="color:#34d399; font-size:1.2rem;">${pct}% Completado</strong>
                    <div class="user-workout-progress-track"><div class="user-workout-progress-fill" style="width:${pct}%;"></div></div>
                </div>
            </div>
            <div class="user-workout-exercises-grid">${items}</div>
        </div>
    `;
}

renderizarListaRutinasAdminGym = function () {
    const cont = document.getElementById("contenedorTarjetasRutinasAdminGym");
    if (!cont) return;
    cont.className = "";
    cont.innerHTML = construirExploradorJerarquicoRutinasHTML(obtenerRutinasContextoActualCDM(), "admin");
};

renderizarRutinasIndividuales = function (p) {
    const cont = document.getElementById("listaRutinasGuardadasJugador");
    if (!cont || !p) return;
    cont.className = "";
    const rutinas = baseRutinas.filter(r => Number(r.personaId) === Number(p.id) || (r.esGrupal && r.deporteDestino === p.deporte));
    cont.innerHTML = construirExploradorJerarquicoRutinasHTML(rutinas, document.body.getAttribute("data-rol") === "usuario" ? "usuario" : "admin");
};

renderizarRutinasSocio = function (socio) {
    const cont = document.getElementById("socioListaRutinas");
    if (!cont || !socio) return;
    cont.className = "";
    const rutinas = baseRutinas.filter(r => Number(r.personaId) === Number(socio.id) || (r.esGrupal && r.deporteDestino === socio.deporte));
    cont.innerHTML = construirExploradorJerarquicoRutinasHTML(rutinas, "usuario");
};

function refrescarVistasRutinasJerarquicasCDM() {
    if (document.getElementById("contenedorTarjetasRutinasAdminGym")) renderizarListaRutinasAdminGym();
    if (document.getElementById("listaRutinasGuardadasJugador")) {
        const p = typeof obtenerJugadorActualPorURL === "function" ? obtenerJugadorActualPorURL() : null;
        if (p) renderizarRutinasIndividuales(p);
    }
    if (document.getElementById("socioListaRutinas")) {
        const s = typeof obtenerSocioLogueadoURLoSession === "function" ? obtenerSocioLogueadoURLoSession() : null;
        if (s) renderizarRutinasSocio(s);
    }
}

function asegurarRutinasJerarquicasEjemploCDM() {
    if (!Array.isArray(baseRutinas) || baseRutinas.some(r => r.id === 504)) return;
    baseRutinas.push(
        { id: 504, esGrupal: false, deporteDestino: "Gimnasio", categoriaDestino: "General", personaId: 301, etiquetaDestino: "👤 Lucas Peralta", fecha: new Date().toLocaleDateString("es-AR"), nombre: "Rutina 2 — Hipertrofia Piernas y Hombros", objetivo: "Hipertrofia", dias: "Martes y Jueves", notas: "Controlar bajada.", ejercicios: [{ nombre: "Sentadilla Trasera con Barra", series: 4, reps: "8-10", peso: "100kg", pausa: "2m", forma: "Profundidad 90°" }, { nombre: "Peso Muerto Rumano (Isquios y Glúteos)", series: 4, reps: "10", peso: "85kg", pausa: "90s", forma: "Espalda neutra" }] },
        { id: 505, esGrupal: true, deporteDestino: "Gimnasio", categoriaDestino: "General", personaId: null, etiquetaDestino: "🏋️ Pizarra General Gym", fecha: new Date().toLocaleDateString("es-AR"), nombre: "Rutina 1 — Movilidad Articular y Core", objetivo: "Movilidad", dias: "Lunes a Sábado", notas: "Entrada en calor.", ejercicios: [{ nombre: "Sentadilla Búlgara Unilateral", series: 2, reps: "10 c/pierna", peso: "Peso Corporal", pausa: "45s", forma: "Abrir cadera" }, { nombre: "Plancha Abdominal RKC y Core Antirotacional", series: 3, reps: "30s", peso: "Peso Corporal", pausa: "45s", forma: "Zona media" }] }
    );
    localStorage.setItem("cdm_rutinas_v1", JSON.stringify(baseRutinas));
}

function actualizarDestinatariosEnModalNuevaRutinaPorSector(sectorElegido, personaPreseleccionada = null) {
    const selDest = document.getElementById("mnrDestinoSelect");
    if (!selDest) return;
    let html = "";
    if (sectorElegido === "Gimnasio") {
        html += `<option value="CAT|Gimnasio|General" ${!personaPreseleccionada ? "selected" : ""}>🏋️ Pizarra General del Gimnasio (Todos)</option>`;
        basePersonas.filter(p => p.deporte === "Gimnasio" && p.activo).forEach(p => {
            html += `<option value="${p.id}" ${Number(personaPreseleccionada) === Number(p.id) ? "selected" : ""}>👤 ${p.apellido}, ${p.nombre}</option>`;
        });
    } else {
        ["Sub 13", "Sub 15", "Sub 17", "Reserva", "Primera"].forEach(c => {
            html += `<option value="CAT|${sectorElegido}|${c}">🏟️ Plantel ${sectorElegido} — ${c}</option>`;
        });
        basePersonas.filter(p => p.deporte.toLowerCase() === sectorElegido.toLowerCase() && p.activo).forEach(p => {
            html += `<option value="${p.id}" ${Number(personaPreseleccionada) === Number(p.id) ? "selected" : ""}>👤 ${p.apellido}, ${p.nombre} (${p.categoria})</option>`;
        });
    }
    selDest.innerHTML = html;
}

function agregarFilaEjercicioEnModalNuevaRutinaCDM(datos = null) {
    const cont = document.getElementById("contenedorFilasModalNuevaRutinaCDM");
    if (!cont) return;
    const num = cont.querySelectorAll(".ex-builder-row").length + 1;
    const div = document.createElement("div");
    div.className = "ex-builder-row";
    div.innerHTML = `
        <div class="ex-builder-top">
            <span class="ex-builder-num">#${num}</span>
            <div class="field" style="flex:1;"><input type="text" class="mnr-nombre" list="dlModalNuevaRutinaEjercicios" required placeholder="Nombre del ejercicio" value="${(datos?.nombre || "").replace(/"/g, "&quot;")}"></div>
            <button type="button" class="btn btn-danger btn-sm ex-builder-del" onclick="this.closest('.ex-builder-row').remove()">✕</button>
        </div>
        <div class="ex-builder-metrics-grid">
            <div class="field"><label>Series</label><input type="number" class="mnr-series" required value="${datos?.series || 4}"></div>
            <div class="field"><label>Reps</label><input type="text" class="mnr-reps" required value="${datos?.reps || "8-10"}"></div>
            <div class="field"><label>Carga</label><input type="text" class="mnr-peso" value="${datos?.peso || ""}"></div>
            <div class="field"><label>Pausa</label><input type="text" class="mnr-pausa" value="${datos?.pausa || "90s"}"></div>
        </div>
        <div class="field" style="margin-top:0.4rem;"><input type="text" class="mnr-forma" placeholder="💡 Indicación técnica..." value="${(datos?.forma || "").replace(/"/g, "&quot;")}"></div>
    `;
    cont.appendChild(div);
}

function abrirModalCrearNuevaRutinaCDM(tipoPreseleccionado = null, personaPreseleccionada = null, ejercicioInicial = null) {
    asegurarVideotecaCargada();
    let modal = document.getElementById("modalCrearRutinaCDM");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "modalCrearRutinaCDM";
        modal.className = "modal-backdrop hidden";
        document.body.appendChild(modal);
    }
    const sectores = obtenerSectoresDeportesHabilitadosCDM();
    let sectorIni = obtenerSectorActivoParaRutinasCDM();
    if (sectorIni === "TODOS") sectorIni = deportePagina || "Gimnasio";
    const tipoActivo = tipoPreseleccionado || estadoNavegacionRutinasCDM.tipoActivo || "Hipertrofia";
    const numSug = obtenerRutinasContextoActualCDM().filter(r => normalizarTipoRutinaCanonicoCDM(r.objetivo) === tipoActivo).length + 1;
    const todosNombres = obtenerTodosLosNombresEjerciciosCDM();

    modal.innerHTML = `
        <div class="modal-window" style="max-width:700px;">
            <div class="modal-top">
                <div><span class="badge badge-celeste">CARGAR RUTINA POR SECTOR / DEPORTE</span><h3>➕ Crear Nueva Rutina</h3></div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalCrearNuevaRutinaCDM()">✕</button>
            </div>
            <form onsubmit="guardarNuevaRutinaDesdeModalCDM(event)">
                <datalist id="dlModalNuevaRutinaEjercicios">${todosNombres.map(n => `<option value="${n.replace(/"/g, "&quot;")}">`).join("")}</datalist>
                <div class="grid-3" style="margin-bottom:0.75rem;">
                    <div class="field">
                        <label>1. Sector / Deporte *</label>
                        <select id="mnrSectorDeporteSelect" required onchange="actualizarDestinatariosEnModalNuevaRutinaPorSector(this.value)">
                            ${sectores.map(s => `<option value="${s.clave}" ${s.clave === sectorIni ? "selected" : ""}>${s.icono} ${s.titulo}</option>`).join("")}
                        </select>
                    </div>
                    <div class="field"><label>2. Destinatario *</label><select id="mnrDestinoSelect" required></select></div>
                    <div class="field">
                        <label>3. Tipo de Rutina *</label>
                        <select id="mnrTipoSelect" required>
                            ${CATALOGO_TIPOS_RUTINA_CDM.map(t => `<option value="${t.clave}" ${t.clave === tipoActivo ? "selected" : ""}>${t.emoji} ${t.titulo}</option>`).join("")}
                        </select>
                    </div>
                </div>
                <div class="grid-2" style="margin-bottom:0.85rem;">
                    <div class="field"><label>Nombre de la Rutina *</label><input type="text" id="mnrNombreInput" required value="Rutina ${numSug} — "></div>
                    <div class="field"><label>Días</label><input type="text" id="mnrDiasInput" value="Lunes, Miércoles y Viernes"></div>
                </div>
                <div style="margin-bottom:0.85rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                        <label style="font-size:0.7rem; font-weight:800;">Ejercicios de la Rutina</label>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="agregarFilaEjercicioEnModalNuevaRutinaCDM()">+ Añadir Ejercicio</button>
                    </div>
                    <div id="contenedorFilasModalNuevaRutinaCDM" style="max-height:260px; overflow-y:auto;"></div>
                </div>
                <div class="field" style="margin-bottom:1rem;"><label>Nota del Entrenador</label><input type="text" id="mnrNotasInput"></div>
                <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                    <button type="button" class="btn btn-ghost" onclick="cerrarModalCrearNuevaRutinaCDM()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar Rutina</button>
                </div>
            </form>
        </div>
    `;
    modal.classList.remove("hidden");
    actualizarDestinatariosEnModalNuevaRutinaPorSector(sectorIni, personaPreseleccionada);
    agregarFilaEjercicioEnModalNuevaRutinaCDM(ejercicioInicial);
}

function cerrarModalCrearNuevaRutinaCDM() {
    document.getElementById("modalCrearRutinaCDM")?.classList.add("hidden");
}

function guardarNuevaRutinaDesdeModalCDM(e) {
    e.preventDefault();
    const valDestino = document.getElementById("mnrDestinoSelect").value;
    const tipoSel = document.getElementById("mnrTipoSelect").value;
    const nombreRut = document.getElementById("mnrNombreInput").value.trim();
    const diasRut = document.getElementById("mnrDiasInput").value.trim() || "Semanal";
    const notasRut = document.getElementById("mnrNotasInput").value.trim();
    const filas = document.querySelectorAll("#contenedorFilasModalNuevaRutinaCDM .ex-builder-row");
    if (!valDestino || filas.length === 0) return;

    const ejercicios = [];
    filas.forEach(f => {
        const nomEj = f.querySelector(".mnr-nombre").value.trim();
        if (!nomEj) return;
        ejercicios.push({
            nombre: agregarEjercicioInventadoAlCatalogoCDM(nomEj, "fuerza_1rm", true) || nomEj,
            series: f.querySelector(".mnr-series").value || 4,
            reps: f.querySelector(".mnr-reps").value.trim() || "8-10",
            peso: f.querySelector(".mnr-peso").value.trim() || "A ajustar",
            pausa: f.querySelector(".mnr-pausa").value.trim() || "90s",
            forma: f.querySelector(".mnr-forma").value.trim()
        });
    });

    const baseNueva = { id: Date.now(), fecha: new Date().toLocaleDateString("es-AR"), nombre: nombreRut, objetivo: tipoSel, dias: diasRut, notas: notasRut, ejercicios };
    if (valDestino.startsWith("CAT|")) {
        const [, depCat, nomCat] = valDestino.split("|");
        baseRutinas.unshift({ ...baseNueva, esGrupal: true, deporteDestino: depCat, categoriaDestino: nomCat, personaId: null, etiquetaDestino: depCat === "Gimnasio" ? "🏋️ Pizarra General Gym" : `🏟️ Plantel ${depCat} ${nomCat}` });
    } else {
        const p = basePersonas.find(x => Number(x.id) === Number(valDestino));
        if (!p) return;
        baseRutinas.unshift({ ...baseNueva, esGrupal: false, deporteDestino: p.deporte, categoriaDestino: p.categoria, personaId: p.id, etiquetaDestino: `👤 ${p.nombre} ${p.apellido}` });
    }
    guardarDatosCDM();
    cerrarModalCrearNuevaRutinaCDM();
    estadoNavegacionRutinasCDM = { paso: "rutinas", tipoActivo: tipoSel, rutinaIdActiva: null };
    refrescarVistasRutinasJerarquicasCDM();
    mostrarToast(`✓ "${nombreRut}" guardada.`);
}

irAArmarRutinaParaPersona = function (idPersona) {
    abrirModalCrearNuevaRutinaCDM(null, idPersona, null);
};
insertarEjercicioDeVideotecaEnRutina = function (idEx) {
    const ex = baseVideoteca.find(x => Number(x.id) === Number(idEx));
    if (!ex) return;
    abrirModalCrearNuevaRutinaCDM(null, null, { nombre: ex.nombre, series: ex.seriesSugeridas || 4, reps: ex.repsSugeridas || "8-10", peso: ex.equipo, pausa: ex.pausaSugerida || "90s", forma: ex.clavesTecnicas });
};

function abrirModalAgregarEjercicioARutinaExistenteCDM(idRutina, idxEditar = null) {
    const r = baseRutinas.find(x => Number(x.id) === Number(idRutina));
    if (!r) return;
    asegurarVideotecaCargada();
    asegurarModalVideoEnPaginaActualCDM();
    archivoVideoTemporalModalCDM = null;
    miniaturaVideoTemporalModalCDM = null;

    const modal = document.getElementById("modalVideoEjercicio");
    const exEdit = (idxEditar !== null && r.ejercicios[idxEditar]) ? r.ejercicios[idxEditar] : null;
    const todosNombres = obtenerTodosLosNombresEjerciciosCDM();

    modal.innerHTML = `
        <div class="modal-window" style="max-width:600px;">
            <div class="modal-top">
                <div><span class="badge badge-celeste">${r.nombre}</span><h3>${exEdit ? `✏️ Editar Ejercicio #${idxEditar + 1}` : `➕ Agregar Ejercicio`}</h3></div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalVideoEjercicio()">✕</button>
            </div>
            <form onsubmit="guardarEjercicioDentroDeRutinaExistenteCDM(event, ${r.id}, ${idxEditar !== null ? idxEditar : "null"})">
                <div class="field" style="margin-bottom:0.75rem;">
                    <label>Nombre del Ejercicio *</label>
                    <input type="text" id="inlineExNombre" list="dlInlineEjerciciosRutina" required value="${(exEdit?.nombre || "").replace(/"/g, "&quot;")}">
                    <datalist id="dlInlineEjerciciosRutina">${todosNombres.map(n => `<option value="${n.replace(/"/g, "&quot;")}">`).join("")}</datalist>
                </div>
                <div class="grid-4" style="margin-bottom:0.75rem;">
                    <div class="field"><label>Series</label><input type="number" id="inlineExSeries" required value="${exEdit?.series || 4}"></div>
                    <div class="field"><label>Reps</label><input type="text" id="inlineExReps" required value="${(exEdit?.reps || "8-10").replace(/"/g, "&quot;")}"></div>
                    <div class="field"><label>Carga</label><input type="text" id="inlineExPeso" value="${(exEdit?.peso || "A ajustar").replace(/"/g, "&quot;")}"></div>
                    <div class="field"><label>Pausa</label><input type="text" id="inlineExPausa" value="${(exEdit?.pausa || "90s").replace(/"/g, "&quot;")}"></div>
                </div>
                <div class="field" style="margin-bottom:0.85rem;"><label>Indicación Técnica</label><input type="text" id="inlineExForma" value="${(exEdit?.forma || "").replace(/"/g, "&quot;")}"></div>
                <div class="video-upload-zone" style="padding:0.75rem; margin-bottom:1rem;">
                    <strong style="font-size:0.8rem; display:block; margin-bottom:0.4rem;">📹 Adjuntar o Cambiar Video Propio (PC / Celular)</strong>
                    <label class="btn btn-primary btn-sm" style="cursor:pointer;">
                        <i class="ri-folder-video-line"></i> Elegir Video
                        <input type="file" accept="video/*" onchange="seleccionarArchivoVideoDesdeDispositivoCDM(event)" style="display:none;">
                    </label>
                    <div id="infoArchivoVideoCargadoCDM" style="margin-top:0.4rem;"></div>
                    <video id="previewPlayerVideoSubidoCDM" class="hidden" controls playsinline style="width:100%; max-height:150px; border-radius:10px; margin-top:0.4rem; background:#000;"></video>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                    <button type="button" class="btn btn-ghost" onclick="cerrarModalVideoEjercicio()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar Ejercicio</button>
                </div>
            </form>
        </div>
    `;
    modal.classList.remove("hidden");
}

async function guardarEjercicioDentroDeRutinaExistenteCDM(e, idRutina, idxEditar = null) {
    e.preventDefault();
    const r = baseRutinas.find(x => Number(x.id) === Number(idRutina));
    if (!r) return;
    const nomRaw = document.getElementById("inlineExNombre").value.trim();
    const nomCanon = agregarEjercicioInventadoAlCatalogoCDM(nomRaw, "fuerza_1rm", true) || nomRaw;
    const seriesVal = document.getElementById("inlineExSeries").value || 4;
    const repsVal = document.getElementById("inlineExReps").value.trim() || "8-10";
    const pesoVal = document.getElementById("inlineExPeso").value.trim() || "A ajustar";
    const pausaVal = document.getElementById("inlineExPausa").value.trim() || "90s";
    const formaVal = document.getElementById("inlineExForma").value.trim();

    if (archivoVideoTemporalModalCDM) {
        const idVid = Date.now() + 1, claveIDB = `vid_local_${idVid}`;
        try {
            await guardarArchivoVideoEnIDB(claveIDB, archivoVideoTemporalModalCDM, archivoVideoTemporalModalCDM.name);
            const idxV = baseVideoteca.findIndex(v => normalizarTextoEjercicioCDM(v.nombre) === normalizarTextoEjercicioCDM(nomCanon));
            const objV = { id: idxV >= 0 ? baseVideoteca[idxV].id : idVid, nombre: nomCanon, grupo: normalizarTipoRutinaCanonicoCDM(r.objetivo), equipo: pesoVal, seriesSugeridas: seriesVal, repsSugeridas: repsVal, pausaSugerida: pausaVal, videoUrl: `idb://${claveIDB}`, esVideoLocal: true, videoLocalKey: claveIDB, nombreArchivoLocal: archivoVideoTemporalModalCDM.name, imagenPreview: miniaturaVideoTemporalModalCDM || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=700&q=80", clavesTecnicas: formaVal || "Controlar movimiento.", erroresComunes: "Cuidar postura." };
            if (idxV >= 0) baseVideoteca[idxV] = objV; else baseVideoteca.unshift(objV);
        } catch {}
    }

    const nuevoEj = { nombre: nomCanon, series: seriesVal, reps: repsVal, peso: pesoVal, pausa: pausaVal, forma: formaVal };
    if (!Array.isArray(r.ejercicios)) r.ejercicios = [];
    if (idxEditar !== null && r.ejercicios[idxEditar]) r.ejercicios[idxEditar] = nuevoEj;
    else r.ejercicios.push(nuevoEj);

    guardarDatosCDM();
    cerrarModalVideoEjercicio();
    refrescarVistasRutinasJerarquicasCDM();
}

function eliminarEjercicioDeRutinaExistenteCDM(idRutina, idxEj) {
    const r = baseRutinas.find(x => Number(x.id) === Number(idRutina));
    if (!r || !r.ejercicios?.[idxEj]) return;
    if (!confirm(`🗑️ ¿Quitar "${r.ejercicios[idxEj].nombre}" de la rutina?`)) return;
    r.ejercicios.splice(idxEj, 1);
    guardarDatosCDM();
    refrescarVistasRutinasJerarquicasCDM();
}

function renombrarRutinaExistentePromptCDM(idRutina) {
    const r = baseRutinas.find(x => Number(x.id) === Number(idRutina));
    if (!r) return;
    const n = prompt("✏️ Nombre de la Rutina:", r.nombre);
    if (!n || !n.trim()) return;
    const d = prompt("🗓️ Días asignados:", r.dias || "Lunes, Miércoles y Viernes");
    r.nombre = n.trim();
    if (d !== null) r.dias = d.trim() || "Semanal";
    guardarDatosCDM();
    refrescarVistasRutinasJerarquicasCDM();
}

// =========================================================================
// PARTE 4: FINANZAS Y CONTABILIDAD ERP COMPLETO (6 PESTAÑAS, 4 CAJAS, IA, P&L)
// =========================================================================

const STORAGE_CONTABILIDAD_KEY = "cdm_contabilidad_movs_v2";
const STORAGE_COSTOS_FIJOS_KEY = "cdm_costos_fijos_v1";
const STORAGE_SALDOS_CAJA_KEY = "cdm_saldos_iniciales_caja_v1";
const STORAGE_ARQUEO_REAL_IA_KEY = "cdm_arqueo_real_declarado_v1";

let tabActivaContabilidadCDM = "cuotas";
let chartContableBalanceInstancia = null;

const CUENTAS_TESORERIA_CDM = [
    { clave: "Efectivo", icono: "💵", titulo: "Caja Física (Efectivo)" },
    { clave: "Transferencia", icono: "🏦", titulo: "Banco / Transferencias" },
    { clave: "MercadoPago", icono: "📲", titulo: "MercadoPago / Billetera QR" },
    { clave: "Tarjeta", icono: "💳", titulo: "Tarjetas / Financiación" }
];

const RUBROS_CONTABLES_CDM = [
    "Cuota Deportiva / Socio", "Inscripción / Matrícula", "Indumentaria / Cantina",
    "Alquiler de Cancha / Salón", "Sponsor / Publicidad", "Sueldos / Honorarios Profes",
    "Alquiler de Inmueble", "Luz / Gas / Agua / Internet", "Compra Equipamiento / Repuestos",
    "Mantenimiento y Limpieza", "Impuestos / Contaduría", "Ajuste / Transferencia de Caja"
];

function obtenerSaldosInicialesCajasCDM() {
    try { return JSON.parse(localStorage.getItem(STORAGE_SALDOS_CAJA_KEY) || "null") || { Efectivo: 0, Transferencia: 0, MercadoPago: 0, Tarjeta: 0 }; }
    catch { return { Efectivo: 0, Transferencia: 0, MercadoPago: 0, Tarjeta: 0 }; }
}
function guardarSaldosInicialesCajasCDM(m) { localStorage.setItem(STORAGE_SALDOS_CAJA_KEY, JSON.stringify(m)); }
function obtenerArqueoRealDeclaradoIACDM() {
    try { return JSON.parse(localStorage.getItem(STORAGE_ARQUEO_REAL_IA_KEY) || "null") || {}; }
    catch { return {}; }
}
function guardarArqueoRealDeclaradoIACDM(m) { localStorage.setItem(STORAGE_ARQUEO_REAL_IA_KEY, JSON.stringify(m)); }

function obtenerCostosFijosPlantillaCDM() {
    try {
        const cf = JSON.parse(localStorage.getItem(STORAGE_COSTOS_FIJOS_KEY) || "null");
        if (Array.isArray(cf)) return cf;
    } catch {}
    const def = [
        { id: 1, rubro: "Sueldos / Honorarios Profes", concepto: "Honorarios Profesores", medio: "Transferencia", monto: 180000, diaVenc: 5 },
        { id: 2, rubro: "Alquiler de Inmueble", concepto: "Alquiler Instalaciones", medio: "Transferencia", monto: 150000, diaVenc: 10 },
        { id: 3, rubro: "Luz / Gas / Agua / Internet", concepto: "Servicios Luz, Agua y Fibra", medio: "MercadoPago", monto: 48000, diaVenc: 15 }
    ];
    localStorage.setItem(STORAGE_COSTOS_FIJOS_KEY, JSON.stringify(def));
    return def;
}
function guardarCostosFijosPlantillaCDM(l) { localStorage.setItem(STORAGE_COSTOS_FIJOS_KEY, JSON.stringify(l)); }

function asegurarEstructuraFinancieraPersonaCDM(p) {
    if (!p) return;
    if (p.montoCuota === undefined || p.montoCuota === null) p.montoCuota = 25000;
    if (p.becaPct === undefined) p.becaPct = 0;
    if (p.recargoMora === undefined) p.recargoMora = 0;
    if (!Array.isArray(p.historialPagos)) p.historialPagos = [];
}

function calcularCuotaNetaExigibleSocioCDM(p) {
    asegurarEstructuraFinancieraPersonaCDM(p);
    const base = Number(p.montoCuota || 25000);
    return Math.max(0, base - Math.round(base * (Number(p.becaPct || 0) / 100)) + Number(p.recargoMora || 0));
}

function obtenerMovimientosContablesCDM() {
    let movs = null;
    try { movs = JSON.parse(localStorage.getItem(STORAGE_CONTABILIDAD_KEY) || "null"); } catch {}
    if (!Array.isArray(movs)) {
        const hoy = obtenerHoyISO();
        movs = [
            { id: 9501, comprobante: "CMP-1001", fecha: hoy, tipo: "egreso", origen: "Manual", rubro: "Sueldos / Honorarios Profes", concepto: "Adelanto Honorarios Profesores", medio: "Transferencia", monto: 180000, personaId: null, nota: "CBU verificado" },
            { id: 9502, comprobante: "CMP-1002", fecha: hoy, tipo: "egreso", origen: "Manual", rubro: "Luz / Gas / Agua / Internet", concepto: "Servicios Eléctricos e Internet", medio: "MercadoPago", monto: 65000, personaId: null, nota: "Pagado al día" },
            { id: 9503, comprobante: "CMP-1003", fecha: hoy, tipo: "ingreso", origen: "Manual", rubro: "Indumentaria / Cantina", concepto: "Venta de Indumentaria e Hidratación", medio: "Efectivo", monto: 95000, personaId: null, nota: "Recepción" }
        ];
        (basePersonas || []).filter(p => p.activo && (p.pagoEstado || "Al Día") === "Al Día").forEach((p, idx) => {
            movs.push({
                id: 9600 + idx, comprobante: `REC-${1010 + idx}`, fecha: p.ultimoPagoFecha || hoy,
                tipo: "ingreso", origen: "Cuota Socio", areaDeporte: p.deporte, rubro: "Cuota Deportiva / Socio",
                concepto: `Cuota ${p.deporte} — ${p.apellido}, ${p.nombre}`, medio: idx % 2 === 0 ? "Efectivo" : "Transferencia",
                monto: calcularCuotaNetaExigibleSocioCDM(p), personaId: p.id, nota: "Cobro oficial"
            });
        });
        localStorage.setItem(STORAGE_CONTABILIDAD_KEY, JSON.stringify(movs));
    }
    return movs;
}
function guardarMovimientosContablesCDM(l) { localStorage.setItem(STORAGE_CONTABILIDAD_KEY, JSON.stringify(l)); }

function calcularPagadoEnPeriodoPorSocioCDM(personaId, mesFiltro = "TODOS") {
    return obtenerMovimientosContablesCDM()
        .filter(m => m.tipo === "ingreso" && Number(m.personaId) === Number(personaId) && (mesFiltro === "TODOS" || String(m.fecha || "").startsWith(mesFiltro)))
        .reduce((acc, m) => acc + Number(m.monto || 0), 0);
}

const _origSincronizarSidebarActivoCDM = sincronizarSidebarActivoCDM;
sincronizarSidebarActivoCDM = function () {
    _origSincronizarSidebarActivoCDM.apply(this, arguments);
    if (cobranzaEstaBloqueadaAppCDM() || document.body.getAttribute("data-rol") === "usuario") return;
    const nav = document.querySelector(".app-sidebar .sidebar-nav");
    if (nav && !nav.querySelector('[data-nav="contabilidad"]')) {
        const a = document.createElement("a");
        a.href = "#contabilidad";
        a.className = "side-link";
        a.dataset.nav = "contabilidad";
        a.onclick = (e) => { e.preventDefault(); abrirModuloContabilidadIndependienteCDM(); };
        a.innerHTML = `<i class="ri-wallet-3-line"></i><span>Contabilidad y Caja</span>`;
        nav.appendChild(a);
    }
};

function abrirModuloContabilidadIndependienteCDM() {
    if (cobranzaEstaBloqueadaAppCDM()) return mostrarToast("🔒 Módulo de cobranza bloqueado en este comercio.");
    const mainContent = document.querySelector(".app-content");
    if (!mainContent) return;
    document.querySelectorAll(".app-sidebar .side-link").forEach(l => l.classList.toggle("active", l.dataset.nav === "contabilidad"));
    Array.from(mainContent.children).forEach(ch => { if (ch.id !== "cdmSeccionContabilidadGlobal") ch.classList.add("hidden"); });

    let secCont = document.getElementById("cdmSeccionContabilidadGlobal");
    if (!secCont) {
        secCont = document.createElement("section");
        secCont.id = "cdmSeccionContabilidadGlobal";
        secCont.className = "animate-in";
        mainContent.appendChild(secCont);
    }
    secCont.classList.remove("hidden");
    const topTitle = document.querySelector(".topbar-title h2");
    if (topTitle) topTitle.innerHTML = `💰 Finanzas, Contabilidad y Tesorería <span class="cat-active-pill">ERP 100% Transparente & Editable</span>`;
    renderizarModuloContabilidadCompletoCDM();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function cambiarSubTabContabilidadCDM(nuevaTab) {
    tabActivaContabilidadCDM = nuevaTab;
    renderizarModuloContabilidadCompletoCDM();
}

function calcularBalanceGeneralContableCDM(areaFiltro = "TODAS", mesFiltro = "TODOS") {
    const activos = basePersonas.filter(p => p.activo && (areaFiltro === "TODAS" || p.deporte === areaFiltro));
    activos.forEach(p => asegurarEstructuraFinancieraPersonaCDM(p));

    const todosMovs = obtenerMovimientosContablesCDM();
    const movsPeriodo = todosMovs.filter(m => {
        if (mesFiltro !== "TODOS" && !String(m.fecha || "").startsWith(mesFiltro)) return false;
        if (areaFiltro === "TODAS") return true;
        if (m.personaId) {
            const per = basePersonas.find(x => Number(x.id) === Number(m.personaId));
            return per && per.deporte === areaFiltro;
        }
        return !m.areaDeporte || m.areaDeporte === areaFiltro;
    });

    let facturacionExigibleCuotas = 0, moraTotalPendiente = 0;
    const alDiaList = [], parcialList = [], pendientesList = [];

    activos.forEach(p => {
        const cuotaNeta = calcularCuotaNetaExigibleSocioCDM(p);
        facturacionExigibleCuotas += cuotaNeta;
        const pagado = calcularPagadoEnPeriodoPorSocioCDM(p.id, mesFiltro);
        const deuda = Math.max(0, cuotaNeta - pagado);
        p._cuotaNetaCalculada = cuotaNeta;
        p._pagadoCalculado = pagado;
        p._saldoPendienteCalculado = deuda;

        if (deuda === 0 && cuotaNeta > 0) { p.pagoEstado = "Al Día"; alDiaList.push(p); }
        else if (pagado > 0 && deuda > 0) { p.pagoEstado = "Parcial"; parcialList.push(p); moraTotalPendiente += deuda; }
        else { p.pagoEstado = "Pendiente"; pendientesList.push(p); moraTotalPendiente += deuda; }
    });

    const ingresosCuotas = movsPeriodo.filter(m => m.tipo === "ingreso" && (m.origen === "Cuota Socio" || m.rubro === "Cuota Deportiva / Socio")).reduce((a, m) => a + Number(m.monto || 0), 0);
    const otrosIngresos = movsPeriodo.filter(m => m.tipo === "ingreso" && m.origen !== "Cuota Socio" && m.rubro !== "Cuota Deportiva / Socio").reduce((a, m) => a + Number(m.monto || 0), 0);
    const gastosTotales = movsPeriodo.filter(m => m.tipo === "egreso").reduce((a, m) => a + Number(m.monto || 0), 0);
    const ingresosBrutos = ingresosCuotas + otrosIngresos;
    const utilidadNeta = ingresosBrutos - gastosTotales;
    const margenPct = ingresosBrutos > 0 ? Math.round((utilidadNeta / ingresosBrutos) * 100) : 0;

    const saldosIniciales = obtenerSaldosInicialesCajasCDM();
    const arqueoRealDeclarado = obtenerArqueoRealDeclaradoIACDM();
    const arqueoCajas = {};
    let diferenciaTotalConciliacion = 0;

    CUENTAS_TESORERIA_CDM.forEach(c => {
        const ini = Number(saldosIniciales[c.clave] || 0);
        const ing = movsPeriodo.filter(m => m.tipo === "ingreso" && m.medio === c.clave).reduce((a, m) => a + Number(m.monto || 0), 0);
        const egr = movsPeriodo.filter(m => m.tipo === "egreso" && m.medio === c.clave).reduce((a, m) => a + Number(m.monto || 0), 0);
        const saldoContable = ini + ing - egr;
        const saldoReal = arqueoRealDeclarado[c.clave] !== undefined ? Number(arqueoRealDeclarado[c.clave]) : saldoContable;
        const diff = saldoReal - saldoContable;
        diferenciaTotalConciliacion += Math.abs(diff);
        arqueoCajas[c.clave] = { ...c, saldoInicial: ini, ingresos: ing, egresos: egr, saldoFinal: saldoContable, saldoRealDeclarado: saldoReal, diferenciaConciliacion: diff };
    });

    const plantillaFijos = obtenerCostosFijosPlantillaCDM();
    const totalCostosFijosPlantilla = plantillaFijos.reduce((a, f) => a + Number(f.monto || 0), 0);
    const cuotaPromedio = activos.length > 0 ? Math.round(facturacionExigibleCuotas / activos.length) : 25000;
    const sociosEquilibrio = cuotaPromedio > 0 ? Math.ceil(totalCostosFijosPlantilla / cuotaPromedio) : 0;
    const tasaCobroPct = facturacionExigibleCuotas > 0 ? Math.min(100, Math.round((ingresosCuotas / facturacionExigibleCuotas) * 100)) : 100;
    const scoreSaludIA = Math.max(40, Math.min(100, Math.round(tasaCobroPct * 0.65 + (utilidadNeta >= 0 ? 35 : 15) - (diferenciaTotalConciliacion > 0 ? 15 : 0))));

    return { activos, alDiaList, parcialList, pendientesList, facturacionExigibleCuotas, ingresosCuotas, otrosIngresos, ingresosBrutos, gastosTotales, utilidadNeta, margenPct, moraPendiente: moraTotalPendiente, arqueoCajas, diferenciaTotalConciliacion, scoreSaludIA, tasaCobroPct, movsPeriodo, todosMovs, plantillaFijos, totalCostosFijosPlantilla, cuotaPromedio, sociosEquilibrio };
}

function renderizarModuloContabilidadCompletoCDM() {
    const sec = document.getElementById("cdmSeccionContabilidadGlobal");
    if (!sec) return;

    const areaSel = document.getElementById("filtroAreaContableCDM")?.value || "TODAS";
    const mesSel = document.getElementById("filtroMesContableCDM")?.value || "TODOS";
    const estadoSel = document.getElementById("filtroEstadoCuotaContableCDM")?.value || "todos";
    const busqTexto = (document.getElementById("inputBuscarSocioContableCDM")?.value || "").toLowerCase().trim();
    const tipoMovFiltro = document.getElementById("filtroTipoLibroMayorCDM")?.value || "todos";
    const cajaMovFiltro = document.getElementById("filtroCajaLibroMayorCDM")?.value || "TODAS";
    const busqLibro = (document.getElementById("inputBuscarLibroMayorCDM")?.value || "").toLowerCase().trim();

    const bal = calcularBalanceGeneralContableCDM(areaSel, mesSel);
    const mesActualISO = obtenerHoyISO().slice(0, 7);

    sec.innerHTML = `
        <div class="routine-step-topbar">
            <div style="display:flex; align-items:center; gap:0.55rem; flex-wrap:wrap;">
                <span class="badge badge-ok">🏦 AUDITORÍA Y FINANZAS</span>
                <select id="filtroAreaContableCDM" onchange="renderizarModuloContabilidadCompletoCDM()" style="width:auto; min-height:35px; font-weight:700;">
                    <option value="TODAS" ${areaSel === "TODAS" ? "selected" : ""}>🏢 Todos los Sectores</option>
                    <option value="Gimnasio" ${areaSel === "Gimnasio" ? "selected" : ""}>🏋️ Gimnasio</option>
                    <option value="Futbol" ${areaSel === "Futbol" ? "selected" : ""}>⚽ Fútbol</option>
                    <option value="Hockey" ${areaSel === "Hockey" ? "selected" : ""}>🏑 Hockey</option>
                </select>
                <select id="filtroMesContableCDM" onchange="renderizarModuloContabilidadCompletoCDM()" style="width:auto; min-height:35px; font-weight:700;">
                    <option value="TODOS" ${mesSel === "TODOS" ? "selected" : ""}>🗓️ Todo el Historial</option>
                    <option value="${mesActualISO}" ${mesSel === mesActualISO ? "selected" : ""}>📅 Mes Actual (${mesActualISO})</option>
                </select>
            </div>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalEditarOCrearAsientoLibroCDM(null)">+ Nuevo Asiento (Ingreso / Gasto)</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="actualizarPrecioCuotaMasivoCDM()">Ajuste Masivo Cuotas</button>
                <button type="button" class="btn btn-ghost btn-sm" onclick="exportarInformeContableCSV()">Excel (CSV)</button>
                <button type="button" class="btn btn-ghost btn-sm" onclick="window.print()">PDF</button>
            </div>
        </div>

        <div class="accounting-kpis-grid">
            <div class="acc-kpi-card income-card"><small>💳 Cobrado Cuotas (${bal.alDiaList.length} al día)</small><strong>$${bal.ingresosCuotas.toLocaleString("es-AR")}</strong><span style="font-size:0.71rem; color:var(--ink-500);">Exigible: $${bal.facturacionExigibleCuotas.toLocaleString("es-AR")}</span></div>
            <div class="acc-kpi-card income-card"><small>➕ Ingresos Extra</small><strong>$${bal.otrosIngresos.toLocaleString("es-AR")}</strong><span style="font-size:0.71rem; color:var(--ink-500);">Bruto total: $${bal.ingresosBrutos.toLocaleString("es-AR")}</span></div>
            <div class="acc-kpi-card expense-card"><small>📉 Egresos y Gastos</small><strong style="color:var(--err-ink);">-$${bal.gastosTotales.toLocaleString("es-AR")}</strong><span style="font-size:0.71rem; color:var(--ink-500);">${bal.movsPeriodo.filter(m => m.tipo === "egreso").length} comprobantes</span></div>
            <div class="acc-kpi-card ${bal.utilidadNeta >= 0 ? "net-positive" : "net-negative"}"><small>💰 Resultado Neto / Caja Real</small><strong style="color:${bal.utilidadNeta >= 0 ? "var(--ok-ink)" : "var(--err-ink)"};">$${bal.utilidadNeta.toLocaleString("es-AR")}</strong><span style="font-size:0.71rem; font-weight:700;">Margen Neto: ${bal.margenPct}%</span></div>
            <div class="acc-kpi-card mora-card"><small>⚠️ Mora por Cobrar</small><strong style="color:var(--warn-ink);">$${bal.moraPendiente.toLocaleString("es-AR")}</strong><span style="font-size:0.71rem; color:var(--ink-500);">${bal.pendientesList.length} pendientes • ${bal.parcialList.length} parciales</span></div>
            <div class="acc-kpi-card breakeven-card"><small>⚖️ Punto de Equilibrio</small><strong>${bal.sociosEquilibrio} socios</strong><span style="font-size:0.71rem; color:var(--purple-ink); font-weight:700;">Actual: ${bal.activos.length} activos</span></div>
        </div>

        <div class="module-tabs" style="margin-bottom:1.25rem;">
            <button type="button" class="mod-tab ${tabActivaContabilidadCDM === "cuotas" ? "active" : ""}" onclick="cambiarSubTabContabilidadCDM('cuotas')"><i class="ri-user-follow-line"></i><span>1. Cuotas y Cta. Cte.</span></button>
            <button type="button" class="mod-tab ${tabActivaContabilidadCDM === "libro" ? "active" : ""}" onclick="cambiarSubTabContabilidadCDM('libro')"><i class="ri-book-read-line"></i><span>2. Libro Mayor (${bal.movsPeriodo.length})</span></button>
            <button type="button" class="mod-tab ${tabActivaContabilidadCDM === "cajas" ? "active" : ""}" onclick="cambiarSubTabContabilidadCDM('cajas')"><i class="ri-safe-2-line"></i><span>3. Arqueo 4 Cajas</span></button>
            <button type="button" class="mod-tab ${tabActivaContabilidadCDM === "conciliacion_ia" ? "active" : ""}" onclick="cambiarSubTabContabilidadCDM('conciliacion_ia')"><i class="ri-robot-2-line"></i><span>4. Conciliación IA (${bal.scoreSaludIA}%)</span></button>
            <button type="button" class="mod-tab ${tabActivaContabilidadCDM === "fijos" ? "active" : ""}" onclick="cambiarSubTabContabilidadCDM('fijos')"><i class="ri-building-4-line"></i><span>5. Costos Fijos</span></button>
            <button type="button" class="mod-tab ${tabActivaContabilidadCDM === "informes" ? "active" : ""}" onclick="cambiarSubTabContabilidadCDM('informes')"><i class="ri-pie-chart-2-line"></i><span>6. Balance P&L</span></button>
        </div>

        <div id="contenedorCuerpoSubTabContable"></div>
    `;

    const bodyCont = document.getElementById("contenedorCuerpoSubTabContable");
    if (!bodyCont) return;

    if (tabActivaContabilidadCDM === "cuotas") {
        let sociosFiltrados = [...bal.activos];
        if (estadoSel === "al_dia") sociosFiltrados = sociosFiltrados.filter(p => p.pagoEstado === "Al Día");
        else if (estadoSel === "parcial") sociosFiltrados = sociosFiltrados.filter(p => p.pagoEstado === "Parcial");
        else if (estadoSel === "pendientes") sociosFiltrados = sociosFiltrados.filter(p => p.pagoEstado !== "Al Día");
        if (busqTexto) sociosFiltrados = sociosFiltrados.filter(p => p.nombre.toLowerCase().includes(busqTexto) || p.apellido.toLowerCase().includes(busqTexto) || (p.dni || "").includes(busqTexto));

        bodyCont.innerHTML = `
            <div class="app-panel">
                <div class="panel-head"><div><h3><i class="ri-bank-card-2-line"></i> Cuentas Corrientes de Socios y Deportistas (100% Editable)</h3></div></div>
                <div class="filter-strip" style="grid-template-columns: 1fr auto; margin-bottom:1rem;">
                    <div class="search-box"><i class="ri-search-line"></i><input type="text" id="inputBuscarSocioContableCDM" placeholder="Buscar socio o DNI..." value="${busqTexto.replace(/"/g, "&quot;")}" oninput="renderizarModuloContabilidadCompletoCDM()"></div>
                    <select id="filtroEstadoCuotaContableCDM" onchange="renderizarModuloContabilidadCompletoCDM()" style="width:auto;">
                        <option value="todos" ${estadoSel === "todos" ? "selected" : ""}>📋 Todos (${bal.activos.length})</option>
                        <option value="pendientes" ${estadoSel === "pendientes" ? "selected" : ""}>⚠️ Con Deuda (${bal.pendientesList.length + bal.parcialList.length})</option>
                        <option value="parcial" ${estadoSel === "parcial" ? "selected" : ""}>🌓 Parcial (${bal.parcialList.length})</option>
                        <option value="al_dia" ${estadoSel === "al_dia" ? "selected" : ""}>✓ Al Día (${bal.alDiaList.length})</option>
                    </select>
                </div>
                <div class="table-wrap">
                    <table class="app-table">
                        <thead><tr><th>Socio</th><th>Sector</th><th>Base / Beca</th><th>Exigible</th><th>Abonado</th><th>Saldo</th><th>Estado</th><th>Acciones</th></tr></thead>
                        <tbody>
                            ${sociosFiltrados.map(p => {
                                const est = p.pagoEstado || "Al Día";
                                const bCls = est === "Al Día" ? "badge-ok" : (est === "Parcial" ? "badge-warn" : "badge-danger");
                                return `
                                    <tr>
                                        <td data-label="Socio"><strong>${p.apellido}, ${p.nombre}</strong><br><small>DNI ${p.dni}</small></td>
                                        <td data-label="Sector"><span class="badge badge-celeste">${p.deporte}</span></td>
                                        <td data-label="Base">$${Number(p.montoCuota || 25000).toLocaleString("es-AR")} ${p.becaPct ? `<span class="badge badge-purple">-${p.becaPct}%</span>` : ""}</td>
                                        <td data-label="Exigible"><strong>$${Number(p._cuotaNetaCalculada || 0).toLocaleString("es-AR")}</strong></td>
                                        <td data-label="Abonado"><strong style="color:var(--ok-ink);">$${Number(p._pagadoCalculado || 0).toLocaleString("es-AR")}</strong></td>
                                        <td data-label="Saldo"><strong style="color:${p._saldoPendienteCalculado > 0 ? "var(--err-ink)" : "var(--ink-400)"};">$${Number(p._saldoPendienteCalculado || 0).toLocaleString("es-AR")}</strong></td>
                                        <td data-label="Estado"><span class="badge ${bCls}">${est}</span></td>
                                        <td data-label="Acciones">
                                            <div style="display:flex; gap:0.3rem; flex-wrap:wrap; justify-content:flex-end;">
                                                <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalRegistrarCobroSocioERP(${p.id})">💵 Cobrar</button>
                                                <button type="button" class="btn btn-secondary btn-sm" onclick="abrirModalConfigurarCuotaSocioERP(${p.id})">✏️ Cuota/Beca</button>
                                                <button type="button" class="btn btn-ghost btn-sm" onclick="abrirModalHistorialPagosSocioERP(${p.id})">🕓 Historial</button>
                                                <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarReciboPagoWhatsApp(${p.id})"><i class="ri-whatsapp-line"></i></button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else if (tabActivaContabilidadCDM === "libro") {
        let movsF = [...bal.movsPeriodo];
        if (tipoMovFiltro === "ingresos") movsF = movsF.filter(m => m.tipo === "ingreso");
        else if (tipoMovFiltro === "egresos") movsF = movsF.filter(m => m.tipo === "egreso");
        if (cajaMovFiltro !== "TODAS") movsF = movsF.filter(m => m.medio === cajaMovFiltro);
        if (busqLibro) movsF = movsF.filter(m => (m.concepto || "").toLowerCase().includes(busqLibro) || (m.rubro || "").toLowerCase().includes(busqLibro) || (m.comprobante || "").toLowerCase().includes(busqLibro));
        movsF.sort((a, b) => new Date(b.fecha) - new Date(a.fecha) || b.id - a.id);

        bodyCont.innerHTML = `
            <div class="app-panel">
                <div class="panel-head">
                    <div><h3><i class="ri-book-open-line"></i> Libro Mayor y Diario Unificado (100% Editable)</h3></div>
                    <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalEditarOCrearAsientoLibroCDM(null)">+ Agregar Asiento</button>
                </div>
                <div class="filter-strip" style="grid-template-columns: 1fr auto auto; margin-bottom:1rem;">
                    <div class="search-box"><i class="ri-search-line"></i><input type="text" id="inputBuscarLibroMayorCDM" placeholder="Buscar comprobante, concepto o rubro..." value="${busqLibro.replace(/"/g, "&quot;")}" oninput="renderizarModuloContabilidadCompletoCDM()"></div>
                    <select id="filtroTipoLibroMayorCDM" onchange="renderizarModuloContabilidadCompletoCDM()" style="width:auto;">
                        <option value="todos" ${tipoMovFiltro === "todos" ? "selected" : ""}>🔄 Todos</option>
                        <option value="ingresos" ${tipoMovFiltro === "ingresos" ? "selected" : ""}>📈 Ingresos (+)</option>
                        <option value="egresos" ${tipoMovFiltro === "egresos" ? "selected" : ""}>📉 Egresos (-)</option>
                    </select>
                    <select id="filtroCajaLibroMayorCDM" onchange="renderizarModuloContabilidadCompletoCDM()" style="width:auto;">
                        <option value="TODAS" ${cajaMovFiltro === "TODAS" ? "selected" : ""}>🏦 Todas las Cajas</option>
                        ${CUENTAS_TESORERIA_CDM.map(c => `<option value="${c.clave}" ${cajaMovFiltro === c.clave ? "selected" : ""}>${c.icono} ${c.clave}</option>`).join("")}
                    </select>
                </div>
                <div class="table-wrap">
                    <table class="app-table">
                        <thead><tr><th>Comprobante</th><th>Fecha</th><th>Concepto</th><th>Rubro</th><th>Caja</th><th>Monto</th><th>Acciones</th></tr></thead>
                        <tbody>
                            ${movsF.map(m => `
                                <tr>
                                    <td data-label="Comprobante"><span class="badge badge-purple">${m.comprobante || ("CMP-" + String(m.id).slice(-4))}</span></td>
                                    <td data-label="Fecha"><b>${m.fecha}</b></td>
                                    <td data-label="Concepto"><strong>${m.concepto}</strong>${m.nota ? `<br><small>${m.nota}</small>` : ""}</td>
                                    <td data-label="Rubro">${m.rubro}</td>
                                    <td data-label="Caja"><span class="badge badge-celeste">${m.medio}</span></td>
                                    <td data-label="Monto"><strong style="color:${m.tipo === "ingreso" ? "var(--ok-ink)" : "var(--err-ink)"};">${m.tipo === "ingreso" ? "+" : "-"}$${Number(m.monto || 0).toLocaleString("es-AR")}</strong></td>
                                    <td data-label="Acciones">
                                        <div style="display:flex; gap:0.3rem; justify-content:flex-end;">
                                            <button type="button" class="btn btn-secondary btn-sm" onclick="abrirModalEditarOCrearAsientoLibroCDM(${m.id})">✏️ Editar</button>
                                            <button type="button" class="btn btn-danger btn-sm" onclick="eliminarAsientoContableCDM(${m.id})">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else if (tabActivaContabilidadCDM === "cajas") {
        bodyCont.innerHTML = `
            <div class="treasury-boxes-grid">
                ${CUENTAS_TESORERIA_CDM.map(c => {
                    const info = bal.arqueoCajas[c.clave];
                    return `
                        <div class="treasury-vault-card">
                            <div class="treasury-vault-head">
                                <h4>${c.icono} ${c.titulo}</h4>
                                <button type="button" class="btn btn-ghost btn-sm" onclick="ajustarSaldoInicialCajaPromptCDM('${c.clave}')">✏️ Base: $${info.saldoInicial.toLocaleString("es-AR")}</button>
                            </div>
                            <div class="treasury-vault-balance">$${info.saldoFinal.toLocaleString("es-AR")}</div>
                            <div class="treasury-vault-flows">
                                <div><span>Entradas (+)</span><strong style="color:var(--ok-ink); display:block;">+$${info.ingresos.toLocaleString("es-AR")}</strong></div>
                                <div><span>Salidas (-)</span><strong style="color:var(--err-ink); display:block;">-$${info.egresos.toLocaleString("es-AR")}</strong></div>
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>
            <div class="app-panel">
                <div class="panel-head"><div><h3><i class="ri-exchange-dollar-line"></i> Transferencia entre Cajas</h3></div></div>
                <form onsubmit="registrarTransferenciaEntreCajasCDM(event)" class="grid-4" style="align-items:end;">
                    <div class="field"><label>Origen *</label><select id="trCajaOrigen">${CUENTAS_TESORERIA_CDM.map(c => `<option value="${c.clave}">${c.titulo}</option>`).join("")}</select></div>
                    <div class="field"><label>Destino *</label><select id="trCajaDestino">${CUENTAS_TESORERIA_CDM.map((c, i) => `<option value="${c.clave}" ${i === 1 ? "selected" : ""}>${c.titulo}</option>`).join("")}</select></div>
                    <div class="field"><label>Monto ($) *</label><input type="number" id="trCajaMonto" required min="1"></div>
                    <button type="submit" class="btn btn-primary">Transferir</button>
                </form>
            </div>
        `;
    } else if (tabActivaContabilidadCDM === "conciliacion_ia") {
        const hayDesc = bal.diferenciaTotalConciliacion > 0;
        bodyCont.innerHTML = `
            <div class="ai-audit-banner">
                <div style="display:flex; align-items:center; gap:1.15rem;">
                    <div class="ai-score-circle ${hayDesc ? "warn" : ""}"><strong>${bal.scoreSaludIA}%</strong><small>Salud IA</small></div>
                    <div>
                        <span class="badge badge-celeste">🤖 AUDITORÍA Y CONCILIACIÓN ASISTIDA POR IA</span>
                        <h3 style="color:#fff; margin:4px 0;">${hayDesc ? `⚠️ Diferencia detectada: $${bal.diferenciaTotalConciliacion.toLocaleString("es-AR")}` : "✓ Todas las cajas cuadran al 100% con el Libro Mayor"}</h3>
                        <small style="color:#bae6fd;">Tasa de cobro: ${bal.tasaCobroPct}%</small>
                    </div>
                </div>
            </div>
            <div class="treasury-boxes-grid">
                ${CUENTAS_TESORERIA_CDM.map(c => {
                    const info = bal.arqueoCajas[c.clave];
                    const ok = info.diferenciaConciliacion === 0;
                    return `
                        <div class="ai-reconcile-card ${ok ? "matched" : "mismatch"}">
                            <div style="display:flex; justify-content:space-between;"><strong>${c.icono} ${c.titulo}</strong><span class="badge ${ok ? "badge-ok" : "badge-danger"}">${ok ? "✓ OK" : `Diff $${info.diferenciaConciliacion.toLocaleString("es-AR")}`}</span></div>
                            <div style="font-size:0.78rem;">Sistema: <b>$${info.saldoFinal.toLocaleString("es-AR")}</b> • Real: <b>$${info.saldoRealDeclarado.toLocaleString("es-AR")}</b></div>
                            <div style="display:flex; gap:0.4rem;">
                                <button type="button" class="btn btn-secondary btn-sm" style="flex:1;" onclick="declararSaldoRealExtractoPromptIA('${c.clave}')">🔍 Informar Real</button>
                                ${!ok ? `<button type="button" class="btn btn-primary btn-sm" onclick="conciliarAutomaticamenteDiferenciaCajaIA('${c.clave}')">⚡ Ajustar</button>` : ""}
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>
            <div class="app-panel">
                <div class="panel-head"><div><h3><i class="ri-magic-line"></i> Conciliador IA de Extractos Bancarios / MercadoPago</h3></div></div>
                <div class="field" style="margin-bottom:0.75rem;"><textarea id="inputTextoExtractoIA" rows="3" placeholder="Pegá líneas de transferencias recibidas (ej: Transferencia de Cabrera Martin $25000)..."></textarea></div>
                <button type="button" class="btn btn-primary btn-sm" onclick="procesarTextoExtractoPorIACDM()">✨ Analizar e Imputar Pagos</button>
            </div>
        `;
    } else if (tabActivaContabilidadCDM === "fijos") {
        bodyCont.innerHTML = `
            <div class="split-view">
                <div class="app-panel">
                    <div class="panel-head"><div><h3>➕ Nuevo Costo Fijo Mensual</h3></div></div>
                    <form onsubmit="guardarNuevoCostoFijoPlantillaCDM(event)">
                        <div class="field" style="margin-bottom:0.7rem;"><label>Rubro</label><select id="cfRubro">${RUBROS_CONTABLES_CDM.map(r => `<option value="${r}">${r}</option>`).join("")}</select></div>
                        <div class="field" style="margin-bottom:0.7rem;"><label>Concepto *</label><input type="text" id="cfConcepto" required></div>
                        <div class="grid-3" style="margin-bottom:1rem;">
                            <div class="field"><label>Monto ($) *</label><input type="number" id="cfMonto" required min="1"></div>
                            <div class="field"><label>Caja</label><select id="cfMedio">${CUENTAS_TESORERIA_CDM.map(c => `<option value="${c.clave}">${c.clave}</option>`).join("")}</select></div>
                            <div class="field"><label>Día Venc.</label><input type="number" id="cfDia" value="10"></div>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width:100%;">+ Sumar Costo Fijo</button>
                    </form>
                </div>
                <div class="app-panel">
                    <div class="panel-head">
                        <div><h3>🏢 Plantilla Costos Fijos ($${bal.totalCostosFijosPlantilla.toLocaleString("es-AR")})</h3></div>
                        <button type="button" class="btn btn-primary btn-sm" onclick="impactarCostosFijosEnLibroMayorCDM()">⚡ Impactar al Libro Mayor</button>
                    </div>
                    <div class="table-wrap">
                        <table class="app-table">
                            <thead><tr><th>Día</th><th>Concepto</th><th>Caja</th><th>Monto</th><th>Acciones</th></tr></thead>
                            <tbody>
                                ${bal.plantillaFijos.map(f => `
                                    <tr>
                                        <td data-label="Día">Día ${f.diaVenc || 10}</td>
                                        <td data-label="Concepto"><strong>${f.concepto}</strong><br><small>${f.rubro}</small></td>
                                        <td data-label="Caja">${f.medio}</td>
                                        <td data-label="Monto"><strong>$${Number(f.monto).toLocaleString("es-AR")}</strong></td>
                                        <td data-label="Acciones">
                                            <button type="button" class="btn btn-secondary btn-sm" onclick="editarCostoFijoPlantillaPromptCDM(${f.id})">✏️</button>
                                            <button type="button" class="btn btn-danger btn-sm" onclick="eliminarCostoFijoPlantillaCDM(${f.id})">🗑️</button>
                                        </td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } else {
        const ingGym = bal.movsPeriodo.filter(m => m.tipo === "ingreso" && m.areaDeporte === "Gimnasio").reduce((a, m) => a + Number(m.monto || 0), 0);
        const ingFut = bal.movsPeriodo.filter(m => m.tipo === "ingreso" && m.areaDeporte === "Futbol").reduce((a, m) => a + Number(m.monto || 0), 0);
        const mapaGastos = {};
        bal.movsPeriodo.filter(m => m.tipo === "egreso").forEach(m => { mapaGastos[m.rubro] = (mapaGastos[m.rubro] || 0) + Number(m.monto || 0); });

        bodyCont.innerHTML = `
            <div class="split-equal">
                <div class="app-panel">
                    <div class="panel-head">
                        <div><h3>📊 Estado de Resultados (P&L)</h3></div>
                        <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarResumenContableWhatsAppCDM()"><i class="ri-whatsapp-line"></i> Enviar WA</button>
                    </div>
                    <div class="pnl-statement-box">
                        <div class="pnl-line"><span>🏋️ Ingresos Gimnasio</span><strong style="color:var(--ok-ink);">+$${ingGym.toLocaleString("es-AR")}</strong></div>
                        <div class="pnl-line"><span>⚽ Ingresos Fútbol</span><strong style="color:var(--ok-ink);">+$${ingFut.toLocaleString("es-AR")}</strong></div>
                        <div class="pnl-line"><span>🏑 Ingresos Hockey / Otros</span><strong style="color:var(--ok-ink);">+$${(bal.ingresosCuotas - ingGym - ingFut).toLocaleString("es-AR")}</strong></div>
                        <div class="pnl-line"><span>➕ Ingresos Extra</span><strong style="color:var(--ok-ink);">+$${bal.otrosIngresos.toLocaleString("es-AR")}</strong></div>
                        <div class="pnl-line pnl-subtotal"><span>= TOTAL INGRESOS BRUTOS</span><span>$${bal.ingresosBrutos.toLocaleString("es-AR")}</span></div>
                        ${Object.entries(mapaGastos).map(([r, t]) => `<div class="pnl-line"><span>➖ ${r}</span><strong style="color:var(--err-ink);">-$${t.toLocaleString("es-AR")}</strong></div>`).join("")}
                        <div class="pnl-line pnl-subtotal"><span>= TOTAL EGRESOS</span><span style="color:var(--err-ink);">-$${bal.gastosTotales.toLocaleString("es-AR")}</span></div>
                        <div class="pnl-line pnl-net"><span>🏦 UTILIDAD NETA REAL</span><span style="color:var(--ok-ink);">$${bal.utilidadNeta.toLocaleString("es-AR")} (${bal.margenPct}%)</span></div>
                    </div>
                </div>
                <div class="app-panel">
                    <div class="panel-head"><div><h3>📈 Gráfico Financiero</h3></div></div>
                    <div class="chart-canvas-box" style="height:310px;"><canvas id="canvasBalanceContableCDM"></canvas></div>
                </div>
            </div>
        `;
        setTimeout(() => dibujarGraficoBalanceContableCDM(bal), 60);
    }
}

function declararSaldoRealExtractoPromptIA(claveCaja) {
    const bal = calcularBalanceGeneralContableCDM("TODAS", "TODOS");
    const entrada = prompt(`🔍 Saldo físico/extracto real para "${claveCaja}":`, bal.arqueoCajas[claveCaja]?.saldoFinal || 0);
    if (entrada === null) return;
    const num = parseFloat(entrada);
    if (isNaN(num)) return;
    const m = obtenerArqueoRealDeclaradoIACDM();
    m[claveCaja] = num;
    guardarArqueoRealDeclaradoIACDM(m);
    renderizarModuloContabilidadCompletoCDM();
}

function conciliarAutomaticamenteDiferenciaCajaIA(claveCaja) {
    const bal = calcularBalanceGeneralContableCDM("TODAS", "TODOS");
    const info = bal.arqueoCajas[claveCaja];
    if (!info || info.diferenciaConciliacion === 0) return;
    const diff = info.diferenciaConciliacion;
    const movs = obtenerMovimientosContablesCDM();
    movs.unshift({ id: Date.now(), comprobante: `IA-AJ-${Math.floor(100 + Math.random() * 899)}`, fecha: obtenerHoyISO(), tipo: diff > 0 ? "ingreso" : "egreso", origen: "Conciliación IA", rubro: "Ajuste / Transferencia de Caja", concepto: `Ajuste conciliación en ${claveCaja}`, medio: claveCaja, monto: Math.abs(diff), personaId: null, nota: "Ajuste automático IA" });
    guardarMovimientosContablesCDM(movs);
    renderizarModuloContabilidadCompletoCDM();
}

function procesarTextoExtractoPorIACDM() {
    const texto = normalizarTextoEjercicioCDM(document.getElementById("inputTextoExtractoIA")?.value || "");
    if (!texto) return alert("Pegá el texto del extracto primero.");
    let detectados = 0;
    const movs = obtenerMovimientosContablesCDM(), hoy = obtenerHoyISO();
    basePersonas.filter(p => p.activo).forEach(p => {
        const ape = normalizarTextoEjercicioCDM(p.apellido);
        if (ape.length >= 3 && texto.includes(ape)) {
            movs.unshift({ id: Date.now() + detectados, comprobante: `IA-REC-${Math.floor(1000 + Math.random() * 8999)}`, fecha: hoy, tipo: "ingreso", origen: "Cuota Socio", areaDeporte: p.deporte, rubro: "Cuota Deportiva / Socio", concepto: `Cuota ${p.deporte} — ${p.apellido}, ${p.nombre}`, medio: "Transferencia", monto: calcularCuotaNetaExigibleSocioCDM(p), personaId: p.id, nota: "Detectado por IA" });
            p.pagoEstado = "Al Día"; p.ultimoPagoFecha = hoy; detectados++;
        }
    });
    if (detectados > 0) { guardarMovimientosContablesCDM(movs); guardarDatosCDM(); renderizarModuloContabilidadCompletoCDM(); mostrarToast(`🤖 ${detectados} pago(s) imputados.`); }
    else alert("No se detectaron apellidos del padrón en el texto.");
}

function abrirModalRegistrarCobroSocioERP(personaId) {
    const p = basePersonas.find(x => Number(x.id) === Number(personaId));
    if (!p) return;
    asegurarEstructuraFinancieraPersonaCDM(p);
    asegurarModalVideoEnPaginaActualCDM();
    const cuotaNeta = calcularCuotaNetaExigibleSocioCDM(p);
    const pagadoMes = calcularPagadoEnPeriodoPorSocioCDM(p.id, obtenerHoyISO().slice(0, 7));
    const sug = Math.max(0, cuotaNeta - pagadoMes) || cuotaNeta;
    const modal = document.getElementById("modalVideoEjercicio");
    modal.innerHTML = `
        <div class="modal-window" style="max-width:520px;">
            <div class="modal-top"><div><span class="badge badge-ok">COBRO EN CAJA</span><h3>💵 Cobrar a ${p.nombre} ${p.apellido}</h3></div><button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalVideoEjercicio()">✕</button></div>
            <form onsubmit="confirmarCobroSocioEnLibroMayorERP(event, ${p.id})">
                <div class="grid-2" style="margin-bottom:0.75rem;">
                    <div class="field"><label>Monto a Cobrar ($) *</label><input type="number" id="cobroMontoInput" required min="1" value="${sug}"></div>
                    <div class="field"><label>Caja / Medio *</label><select id="cobroMedioSelect">${CUENTAS_TESORERIA_CDM.map(c => `<option value="${c.clave}">${c.icono} ${c.titulo}</option>`).join("")}</select></div>
                </div>
                <div class="grid-2" style="margin-bottom:0.75rem;">
                    <div class="field"><label>Fecha *</label><input type="date" id="cobroFechaInput" required value="${obtenerHoyISO()}"></div>
                    <div class="field"><label>Recibo N°</label><input type="text" id="cobroComprobanteInput" value="REC-${Math.floor(1000 + Math.random() * 9000)}"></div>
                </div>
                <div class="field" style="margin-bottom:1rem;"><label>Nota</label><input type="text" id="cobroNotaInput" placeholder="Opcional..."></div>
                <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                    <button type="button" class="btn btn-ghost" onclick="cerrarModalVideoEjercicio()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Asentar Cobro</button>
                </div>
            </form>
        </div>
    `;
    modal.classList.remove("hidden");
}

function confirmarCobroSocioEnLibroMayorERP(e, personaId) {
    e.preventDefault();
    const p = basePersonas.find(x => Number(x.id) === Number(personaId));
    if (!p) return;
    const monto = parseFloat(document.getElementById("cobroMontoInput").value) || 0;
    const medio = document.getElementById("cobroMedioSelect").value;
    const fecha = document.getElementById("cobroFechaInput").value || obtenerHoyISO();
    const comp = document.getElementById("cobroComprobanteInput").value.trim();
    const nota = document.getElementById("cobroNotaInput").value.trim() || "Cobro de cuota";
    const movs = obtenerMovimientosContablesCDM();
    movs.unshift({ id: Date.now(), comprobante: comp, fecha, tipo: "ingreso", origen: "Cuota Socio", areaDeporte: p.deporte, rubro: "Cuota Deportiva / Socio", concepto: `Cuota ${p.deporte} — ${p.apellido}, ${p.nombre}`, medio, monto, personaId: p.id, nota });
    guardarMovimientosContablesCDM(movs);
    p.ultimoPagoFecha = fecha;
    guardarDatosCDM();
    cerrarModalVideoEjercicio();
    renderizarModuloContabilidadCompletoCDM();
    mostrarToast(`💳 Cobro registrado ($${monto.toLocaleString("es-AR")}).`);
}

function abrirModalConfigurarCuotaSocioERP(personaId) {
    const p = basePersonas.find(x => Number(x.id) === Number(personaId));
    if (!p) return;
    asegurarEstructuraFinancieraPersonaCDM(p);
    asegurarModalVideoEnPaginaActualCDM();
    const modal = document.getElementById("modalVideoEjercicio");
    modal.innerHTML = `
        <div class="modal-window" style="max-width:480px;">
            <div class="modal-top"><div><span class="badge badge-celeste">EDITAR ARANCEL</span><h3>✏️ ${p.nombre} ${p.apellido}</h3></div><button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalVideoEjercicio()">✕</button></div>
            <form onsubmit="guardarConfiguracionCuotaSocioERP(event, ${p.id})">
                <div class="grid-3" style="margin-bottom:0.85rem;">
                    <div class="field"><label>Cuota Base ($)</label><input type="number" id="cfgCuotaBase" required value="${p.montoCuota || 25000}"></div>
                    <div class="field"><label>Beca (%)</label><input type="number" id="cfgBecaPct" min="0" max="100" value="${p.becaPct || 0}"></div>
                    <div class="field"><label>Recargo ($)</label><input type="number" id="cfgRecargoMora" min="0" value="${p.recargoMora || 0}"></div>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                    <button type="button" class="btn btn-ghost" onclick="cerrarModalVideoEjercicio()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar</button>
                </div>
            </form>
        </div>
    `;
    modal.classList.remove("hidden");
}

function guardarConfiguracionCuotaSocioERP(e, personaId) {
    e.preventDefault();
    const p = basePersonas.find(x => Number(x.id) === Number(personaId));
    if (!p) return;
    p.montoCuota = parseFloat(document.getElementById("cfgCuotaBase").value) || 0;
    p.becaPct = parseFloat(document.getElementById("cfgBecaPct").value) || 0;
    p.recargoMora = parseFloat(document.getElementById("cfgRecargoMora").value) || 0;
    guardarDatosCDM();
    cerrarModalVideoEjercicio();
    renderizarModuloContabilidadCompletoCDM();
}

function abrirModalHistorialPagosSocioERP(personaId) {
    const p = basePersonas.find(x => Number(x.id) === Number(personaId));
    if (!p) return;
    asegurarModalVideoEnPaginaActualCDM();
    const movsSocio = obtenerMovimientosContablesCDM().filter(m => Number(m.personaId) === Number(p.id));
    const modal = document.getElementById("modalVideoEjercicio");
    modal.innerHTML = `
        <div class="modal-window" style="max-width:620px;">
            <div class="modal-top"><div><h3>🕓 Historial de Pagos — ${p.nombre} ${p.apellido}</h3></div><button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalVideoEjercicio()">✕</button></div>
            <div class="table-wrap" style="margin-bottom:1rem;">
                <table class="app-table">
                    <thead><tr><th>Recibo</th><th>Fecha</th><th>Medio</th><th>Monto</th><th>Acciones</th></tr></thead>
                    <tbody>
                        ${movsSocio.length ? movsSocio.map(m => `
                            <tr>
                                <td><b>${m.comprobante || "-"}</b></td><td>${m.fecha}</td><td>${m.medio}</td>
                                <td><strong style="color:var(--ok-ink);">$${Number(m.monto).toLocaleString("es-AR")}</strong></td>
                                <td>
                                    <button type="button" class="btn btn-secondary btn-sm" onclick="abrirModalEditarOCrearAsientoLibroCDM(${m.id})">✏️</button>
                                    <button type="button" class="btn btn-danger btn-sm" onclick="eliminarAsientoContableCDM(${m.id}); cerrarModalVideoEjercicio();">🗑️</button>
                                </td>
                            </tr>
                        `).join("") : `<tr><td colspan="5"><div class="empty-box">Sin pagos registrados.</div></td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    modal.classList.remove("hidden");
}

function abrirModalEditarOCrearAsientoLibroCDM(idAsientoEditar = null) {
    asegurarModalVideoEnPaginaActualCDM();
    const m = idAsientoEditar ? obtenerMovimientosContablesCDM().find(x => Number(x.id) === Number(idAsientoEditar)) : null;
    const modal = document.getElementById("modalVideoEjercicio");
    modal.innerHTML = `
        <div class="modal-window" style="max-width:560px;">
            <div class="modal-top"><div><h3>${m ? `✏️ Editar Asiento ${m.comprobante || ""}` : "➕ Nuevo Asiento Contable"}</h3></div><button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalVideoEjercicio()">✕</button></div>
            <form onsubmit="guardarAsientoEditadoOCreadoLibroCDM(event, ${m ? m.id : "null"})">
                <div class="grid-3" style="margin-bottom:0.75rem;">
                    <div class="field"><label>Tipo *</label><select id="edMovTipo"><option value="ingreso" ${m?.tipo === "ingreso" ? "selected" : ""}>📈 Ingreso (+)</option><option value="egreso" ${(!m || m.tipo === "egreso") ? "selected" : ""}>📉 Egreso (-)</option></select></div>
                    <div class="field"><label>Fecha *</label><input type="date" id="edMovFecha" required value="${m?.fecha || obtenerHoyISO()}"></div>
                    <div class="field"><label>Comprobante *</label><input type="text" id="edMovComprobante" required value="${m?.comprobante || ("CMP-" + Math.floor(1000 + Math.random() * 9000))}"></div>
                </div>
                <div class="grid-2" style="margin-bottom:0.75rem;">
                    <div class="field"><label>Rubro *</label><select id="edMovRubro">${RUBROS_CONTABLES_CDM.map(r => `<option value="${r}" ${m?.rubro === r ? "selected" : ""}>${r}</option>`).join("")}</select></div>
                    <div class="field"><label>Caja *</label><select id="edMovMedio">${CUENTAS_TESORERIA_CDM.map(c => `<option value="${c.clave}" ${m?.medio === c.clave ? "selected" : ""}>${c.titulo}</option>`).join("")}</select></div>
                </div>
                <div class="grid-2" style="margin-bottom:0.75rem;">
                    <div class="field"><label>Concepto *</label><input type="text" id="edMovConcepto" required value="${(m?.concepto || "").replace(/"/g, "&quot;")}"></div>
                    <div class="field"><label>Monto ($) *</label><input type="number" step="0.01" id="edMovMonto" required min="1" value="${m?.monto || ""}"></div>
                </div>
                <div class="field" style="margin-bottom:1rem;"><label>Nota</label><input type="text" id="edMovNota" value="${(m?.nota || "").replace(/"/g, "&quot;")}"></div>
                <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                    <button type="button" class="btn btn-ghost" onclick="cerrarModalVideoEjercicio()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar Asiento</button>
                </div>
            </form>
        </div>
    `;
    modal.classList.remove("hidden");
}

function guardarAsientoEditadoOCreadoLibroCDM(e, idEditar = null) {
    e.preventDefault();
    const movs = obtenerMovimientosContablesCDM();
    const datos = {
        comprobante: document.getElementById("edMovComprobante").value.trim(),
        fecha: document.getElementById("edMovFecha").value || obtenerHoyISO(),
        tipo: document.getElementById("edMovTipo").value,
        rubro: document.getElementById("edMovRubro").value,
        medio: document.getElementById("edMovMedio").value,
        concepto: document.getElementById("edMovConcepto").value.trim(),
        monto: parseFloat(document.getElementById("edMovMonto").value) || 0,
        nota: document.getElementById("edMovNota").value.trim()
    };
    if (idEditar) {
        const idx = movs.findIndex(x => Number(x.id) === Number(idEditar));
        if (idx >= 0) movs[idx] = { ...movs[idx], ...datos };
    } else {
        movs.unshift({ id: Date.now(), origen: "Manual", personaId: null, ...datos });
    }
    guardarMovimientosContablesCDM(movs);
    cerrarModalVideoEjercicio();
    renderizarModuloContabilidadCompletoCDM();
}

function eliminarAsientoContableCDM(idMov) {
    if (!confirm("🗑️ ¿Eliminar este asiento del Libro Mayor?")) return;
    guardarMovimientosContablesCDM(obtenerMovimientosContablesCDM().filter(x => Number(x.id) !== Number(idMov)));
    renderizarModuloContabilidadCompletoCDM();
}

function ajustarSaldoInicialCajaPromptCDM(claveCaja) {
    const saldos = obtenerSaldosInicialesCajasCDM();
    const entrada = prompt(`🏦 Saldo Inicial para "${claveCaja}":`, saldos[claveCaja] || 0);
    if (entrada === null) return;
    saldos[claveCaja] = parseFloat(entrada) || 0;
    guardarSaldosInicialesCajasCDM(saldos);
    renderizarModuloContabilidadCompletoCDM();
}

function registrarTransferenciaEntreCajasCDM(e) {
    e.preventDefault();
    const ori = document.getElementById("trCajaOrigen").value, des = document.getElementById("trCajaDestino").value;
    const monto = parseFloat(document.getElementById("trCajaMonto").value) || 0;
    if (ori === des || monto <= 0) return alert("Elegí cajas distintas.");
    const hoy = obtenerHoyISO(), n = Math.floor(1000 + Math.random() * 9000), movs = obtenerMovimientosContablesCDM();
    movs.unshift(
        { id: Date.now() + 1, comprobante: `TRF-${n}-B`, fecha: hoy, tipo: "ingreso", origen: "Transferencia", rubro: "Ajuste / Transferencia de Caja", concepto: `Desde caja ${ori}`, medio: des, monto, personaId: null },
        { id: Date.now(), comprobante: `TRF-${n}-A`, fecha: hoy, tipo: "egreso", origen: "Transferencia", rubro: "Ajuste / Transferencia de Caja", concepto: `Hacia caja ${des}`, medio: ori, monto, personaId: null }
    );
    guardarMovimientosContablesCDM(movs);
    renderizarModuloContabilidadCompletoCDM();
}

function guardarNuevoCostoFijoPlantillaCDM(e) {
    e.preventDefault();
    const l = obtenerCostosFijosPlantillaCDM();
    l.push({ id: Date.now(), rubro: document.getElementById("cfRubro").value, concepto: document.getElementById("cfConcepto").value.trim(), monto: parseFloat(document.getElementById("cfMonto").value) || 0, medio: document.getElementById("cfMedio").value, diaVenc: parseInt(document.getElementById("cfDia").value) || 10 });
    guardarCostosFijosPlantillaCDM(l);
    renderizarModuloContabilidadCompletoCDM();
}

function editarCostoFijoPlantillaPromptCDM(idFijo) {
    const l = obtenerCostosFijosPlantillaCDM(), it = l.find(x => Number(x.id) === Number(idFijo));
    if (!it) return;
    const m = prompt("💰 Nuevo monto mensual ($):", it.monto);
    if (m === null) return;
    it.monto = parseFloat(m) || it.monto;
    guardarCostosFijosPlantillaCDM(l);
    renderizarModuloContabilidadCompletoCDM();
}

function eliminarCostoFijoPlantillaCDM(idFijo) {
    guardarCostosFijosPlantillaCDM(obtenerCostosFijosPlantillaCDM().filter(x => Number(x.id) !== Number(idFijo)));
    renderizarModuloContabilidadCompletoCDM();
}

function impactarCostosFijosEnLibroMayorCDM() {
    const pl = obtenerCostosFijosPlantillaCDM();
    if (!pl.length || !confirm("⚡ ¿Impactar los costos fijos en el Libro Mayor de hoy?")) return;
    const hoy = obtenerHoyISO(), movs = obtenerMovimientosContablesCDM();
    pl.forEach((f, i) => movs.unshift({ id: Date.now() + i, comprobante: `CF-${Math.floor(100 + Math.random() * 899)}`, fecha: hoy, tipo: "egreso", origen: "Costo Fijo", rubro: f.rubro, concepto: f.concepto, medio: f.medio, monto: Number(f.monto), personaId: null }));
    guardarMovimientosContablesCDM(movs);
    cambiarSubTabContabilidadCDM("libro");
}

function actualizarPrecioCuotaMasivoCDM() {
    const areaSel = document.getElementById("filtroAreaContableCDM")?.value || "TODAS";
    const m = prompt(`⚙️ Nuevo valor de cuota ($) para ${areaSel}:`, "28000");
    if (m === null) return;
    const num = parseFloat(m);
    if (isNaN(num)) return;
    basePersonas.forEach(p => { if (p.activo && (areaSel === "TODAS" || p.deporte === areaSel)) p.montoCuota = num; });
    guardarDatosCDM();
    renderizarModuloContabilidadCompletoCDM();
}

function dibujarGraficoBalanceContableCDM(bal) {
    const canvas = document.getElementById("canvasBalanceContableCDM");
    if (!canvas || typeof Chart === "undefined") return;
    if (chartContableBalanceInstancia) chartContableBalanceInstancia.destroy();
    chartContableBalanceInstancia = new Chart(canvas.getContext("2d"), {
        type: "bar",
        data: { labels: ["Cuotas", "Extra", "Gastos", "Caja Neta", "Mora"], datasets: [{ data: [bal.ingresosCuotas, bal.otrosIngresos, bal.gastosTotales, bal.utilidadNeta, bal.moraPendiente], backgroundColor: ["#0284c7", "#38bdf8", "#f43f5e", "#10b981", "#f59e0b"], borderRadius: 10 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function exportarInformeContableCSV() {
    const bal = calcularBalanceGeneralContableCDM("TODAS", "TODOS");
    let csv = "COMPROBANTE,FECHA,TIPO,RUBRO,CONCEPTO,CAJA,MONTO\n";
    bal.todosMovs.forEach(m => { csv += `"${m.comprobante || ""}","${m.fecha}","${m.tipo}","${m.rubro}","${m.concepto}","${m.medio}",${m.tipo === "egreso" ? "-" + m.monto : m.monto}\n`; });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    link.download = `Libro_Mayor_${obtenerHoyISO()}.csv`;
    link.click();
}

function enviarResumenContableWhatsAppCDM() {
    const bal = calcularBalanceGeneralContableCDM("TODAS", "TODOS");
    let msg = `🏦 *BALANCE CONTABLE*\n✅ Ingresos Brutos: $${bal.ingresosBrutos.toLocaleString("es-AR")}\n➖ Gastos: -$${bal.gastosTotales.toLocaleString("es-AR")}\n💰 *CAJA NETA: $${bal.utilidadNeta.toLocaleString("es-AR")}*\n⚠️ Mora: $${bal.moraPendiente.toLocaleString("es-AR")}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
}

// =========================================================================
// PARTE 5: FLYERS STORY 1080x1920, ACTA TÁCTICA PDF Y BLOQUEO DE COBRANZA
// =========================================================================

function descargarCanvasComoPNG(canvasId, nombreArchivo) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = nombreArchivo;
    link.href = canvas.toDataURL("image/png");
    link.click();
}

function abrirModalStoryRecordPRCDM(personaId, nombreEjercicio = null, valor1RM = null) {
    const p = basePersonas.find(x => Number(x.id) === Number(personaId));
    if (!p) return;
    if (!nombreEjercicio) {
        const evs = (p.evaluaciones || []).filter(e => e.tipo === "fuerza_kg");
        if (!evs.length) return alert("Registrá una marca de fuerza primero.");
        const mejor = [...evs].sort((a, b) => Number(b.valor) - Number(a.valor))[0];
        nombreEjercicio = mejor.ejercicio; valor1RM = mejor.valor;
    }
    asegurarModalVideoEnPaginaActualCDM();
    const modal = document.getElementById("modalVideoEjercicio");
    modal.innerHTML = `
        <div class="modal-window" style="max-width:460px; text-align:center;">
            <div class="modal-top"><h3>🏆 Flyer Récord Personal (PR)</h3><button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalVideoEjercicio()">✕</button></div>
            <div class="story-preview-frame"><canvas id="canvasFlyerStoryPR" width="1080" height="1920"></canvas></div>
            <button type="button" class="btn btn-primary" style="width:100%;" onclick="descargarCanvasComoPNG('canvasFlyerStoryPR', 'PR_${p.apellido}.png')">📥 Descargar Story PNG</button>
        </div>
    `;
    modal.classList.remove("hidden");
    const ctx = document.getElementById("canvasFlyerStoryPR").getContext("2d");
    ctx.fillStyle = "#06101e"; ctx.fillRect(0, 0, 1080, 1920);
    ctx.textAlign = "center"; ctx.fillStyle = "#e11d48"; ctx.font = "800 42px Poppins, sans-serif";
    ctx.fillText("🔥 NUEVO RÉCORD PERSONAL (PR)", 540, 320);
    ctx.fillStyle = "#ffffff"; ctx.font = "800 68px Poppins, sans-serif";
    ctx.fillText(`${p.nombre} ${p.apellido}`.toUpperCase(), 540, 620);
    ctx.fillStyle = "#38bdf8"; ctx.font = "700 46px Poppins, sans-serif";
    ctx.fillText(String(nombreEjercicio).toUpperCase(), 540, 920);
    ctx.fillStyle = "#facc15"; ctx.font = "900 175px Poppins, sans-serif";
    ctx.fillText(`${valor1RM} KG`, 540, 1180);
}

function abrirModalStoryFormacionCDM() {
    asegurarModalVideoEnPaginaActualCDM();
    const modal = document.getElementById("modalVideoEjercicio");
    modal.innerHTML = `
        <div class="modal-window" style="max-width:460px; text-align:center;">
            <div class="modal-top"><h3>🏟️ Story Formación Oficial</h3><button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalVideoEjercicio()">✕</button></div>
            <div class="story-preview-frame"><canvas id="canvasFlyerStoryFormacion" width="1080" height="1920"></canvas></div>
            <button type="button" class="btn btn-primary" style="width:100%;" onclick="descargarCanvasComoPNG('canvasFlyerStoryFormacion', 'Formacion.png')">📥 Descargar Story PNG</button>
        </div>
    `;
    modal.classList.remove("hidden");
    const ctx = document.getElementById("canvasFlyerStoryFormacion").getContext("2d");
    ctx.fillStyle = "#040d1a"; ctx.fillRect(0, 0, 1080, 1920);
    ctx.textAlign = "center"; ctx.fillStyle = "#ffffff"; ctx.font = "900 52px Poppins, sans-serif";
    ctx.fillText(`FORMACIÓN • ${categoriaActiva.toUpperCase()}`, 540, 160);
    ctx.fillStyle = deportePagina === "Hockey" ? "#0369a1" : "#15803d";
    ctx.fillRect(90, 250, 900, 1300);
    const coords = obtenerCatalogoFormacionActual(), mapa = obtenerMapaAlineacionActual(), activos = obtenerPersonasFiltradasDeporte(true);
    coords.forEach((pos, idx) => {
        const j = mapa[idx] ? activos.find(x => x.id == mapa[idx]) : null;
        const cx = 90 + (pos.x / 100) * 900, cy = 250 + (pos.y / 100) * 1300;
        ctx.fillStyle = "#0c192c"; ctx.beginPath(); ctx.arc(cx, cy, 40, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ffffff"; ctx.font = "800 28px Poppins, sans-serif"; ctx.fillText(`#${pos.num}`, cx, cy + 10);
        ctx.font = "700 22px Poppins, sans-serif"; ctx.fillText(j ? j.apellido.toUpperCase() : pos.sigla, cx, cy + 68);
    });
}

function abrirModalActaTacticaPDFCDM() {
    let modal = document.getElementById("modalActaTacticaPDFCDM");
    if (!modal) { modal = document.createElement("div"); modal.id = "modalActaTacticaPDFCDM"; modal.className = "modal-backdrop hidden"; document.body.appendChild(modal); }
    const coords = obtenerCatalogoFormacionActual(), mapa = obtenerMapaAlineacionActual(), activos = obtenerPersonasFiltradasDeporte(true);
    modal.innerHTML = `
        <div class="modal-window" style="max-width:820px;">
            <div class="modal-top no-print-pdf"><h3>🖨️ Acta Táctica Oficial A4</h3><div><button type="button" class="btn btn-primary btn-sm" onclick="document.body.classList.add('printing-tactical-pdf'); window.print(); setTimeout(()=>document.body.classList.remove('printing-tactical-pdf'),800);">Imprimir PDF</button> <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('modalActaTacticaPDFCDM').classList.add('hidden')">✕</button></div></div>
            <div class="tactical-pdf-sheet">
                <h2>PLANILLA TÁCTICA — ${deportePagina.toUpperCase()} (${categoriaActiva})</h2>
                <table class="app-table" style="margin-top:1rem;">
                    <thead><tr><th>Puesto</th><th>Función</th><th>Titular</th><th>DNI</th></tr></thead>
                    <tbody>${coords.map((pos, idx) => { const j = mapa[idx] ? activos.find(x => x.id == mapa[idx]) : null; return `<tr><td>#${pos.num} (${pos.sigla})</td><td>${pos.nombrePuesto}</td><td>${j ? `${j.apellido}, ${j.nombre}` : "Vacante"}</td><td>${j ? j.dni : "-"}</td></tr>`; }).join("")}</tbody>
                </table>
            </div>
        </div>
    `;
    modal.classList.remove("hidden");
}

function cobranzaEstaBloqueadaAppCDM() {
    try { return Boolean(JSON.parse(localStorage.getItem("cdm_licencia_config_v1") || "null")?.bloquearCobranza); }
    catch { return false; }
}

function inyectarBotonesFlyerStoryEnDOM() {
    const pitchHead = document.querySelector("#dep-sec-partido .panel-head");
    if (pitchHead && !document.getElementById("btnAbrirStoryFormacionCancha")) {
        const d = document.createElement("div");
        d.style = "display:flex; gap:0.4rem; flex-wrap:wrap;";
        d.innerHTML = `<button type="button" id="btnAbrirStoryFormacionCancha" class="btn btn-primary btn-sm" onclick="abrirModalStoryFormacionCDM()">📸 Story Titulares</button><button type="button" class="btn btn-secondary btn-sm" onclick="abrirModalActaTacticaPDFCDM()">🖨️ Acta PDF</button>`;
        pitchHead.appendChild(d);
    }
    const jug = typeof obtenerJugadorActualPorURL === "function" ? obtenerJugadorActualPorURL() : null;
    const cabJug = document.getElementById("fichaCabeceraJugador");
    if (jug && cabJug && !document.getElementById("btnAbrirStoryPRJugador")) {
        const grp = cabJug.querySelector("div > div:last-child");
        if (grp) {
            const b = document.createElement("button");
            b.type = "button"; b.id = "btnAbrirStoryPRJugador"; b.className = "btn btn-secondary btn-sm";
            b.onclick = () => abrirModalStoryRecordPRCDM(jug.id);
            b.innerHTML = `📸 Story PR`;
            grp.insertBefore(b, grp.firstChild);
        }
    }
}

function aplicarReglasVisualesCobranzaEnDOM() {
    const bloqueada = cobranzaEstaBloqueadaAppCDM();
    if (document.body) document.body.setAttribute("data-cobranza", bloqueada ? "bloqueada" : "activa");
    sincronizarSidebarActivoCDM();
    inyectarBotonesFlyerStoryEnDOM();
}

const _origInicializarIndex = inicializarIndex;
inicializarIndex = function () { _origInicializarIndex.apply(this, arguments); aplicarReglasVisualesCobranzaEnDOM(); };

const _origRenderizarPaginaDeporte = renderizarPaginaDeporte;
renderizarPaginaDeporte = function () { _origRenderizarPaginaDeporte.apply(this, arguments); revincularBotonesAgregarVideoHTML(); aplicarReglasVisualesCobranzaEnDOM(); refrescarVistasRutinasJerarquicasCDM(); };

const _origInicializarPaginaJugadorIndividual = inicializarPaginaJugadorIndividual;
inicializarPaginaJugadorIndividual = function () { _origInicializarPaginaJugadorIndividual.apply(this, arguments); revincularBotonesAgregarVideoHTML(); aplicarReglasVisualesCobranzaEnDOM(); refrescarVistasRutinasJerarquicasCDM(); };

document.addEventListener("DOMContentLoaded", () => {
    asegurarVideotecaCargada();
    revincularBotonesAgregarVideoHTML();
    asegurarRutinasJerarquicasEjemploCDM();
    iniciarLoopBiomecanico60FPS();
    aplicarReglasVisualesCobranzaEnDOM();
    refrescarVistasRutinasJerarquicasCDM();
    if (deportePagina === "Gimnasio") renderizarVideotecaGym();
});
// =========================================================================
// 17. MÓDULO DE CONSULTORIO 100% RESPONSIVO + CUADERNO HISTÓRICO DE NOTAS POR SESIÓN
//     - CALENDARIO DE 30 DÍAS ADAPTATIVO EN MÓVIL Y ESCRITORIO + AGENDA DEL DÍA AL PIE
//     - HISTÓRICO DE SESIONES CLARO, NUMERADO (SESIÓN #1, #2, #3...) Y EDITABLE POR PACIENTE
//     - MODAL DEL DÍA CON MEMORIA DE LA ÚLTIMA NOTA Y ALTA DE TURNO + PACIENTE + MUTUAL
// Pegar al final de app.js (reemplazando el Bloque 17 anterior)
// =========================================================================

const STORAGE_PACIENTES_CLINICOS_KEY = "cdm_pacientes_clinicos_v1";
const STORAGE_TURNOS_AGENDA_KEY = "cdm_agenda_turnos_v1";
const STORAGE_MUTUALES_CONVENIOS_KEY = "cdm_mutuales_convenios_v1";
const STORAGE_ORDENES_MUTUAL_KEY = "cdm_ordenes_mutual_pendientes_v1";
const STORAGE_PROFESIONES_EXTRA_CLINICA_KEY = "cdm_profesiones_clinicas_catalogo_v1";

let tabActivaConsultorioCDM = "agenda"; // 'agenda' | 'pacientes' | 'mutuales'
let especialidadFiltroConsultorioCDM = "TODAS";
let fechaSeleccionadaCalendarioCDM = obtenerHoyISO();
let anioCalendarioVisualCDM = new Date().getFullYear();
let mesCalendarioVisualCDM = new Date().getMonth();
let chartEvolucionClinicaInstancia = null;

// Inyector automático de estilos responsivos para garantizar que en celulares y PC se vea impecable sin importar la caché
function asegurarEstilosCalendario30DiasEnDOM() {
    let st = document.getElementById("cdmEstilosCalendario30DiasAuto");
    if (!st) {
        st = document.createElement("style");
        st.id = "cdmEstilosCalendario30DiasAuto";
        document.head.appendChild(st);
    }
    st.textContent = `
        .conventional-cal-panel { background: var(--surface-solid); border: 1.5px solid var(--line-strong); border-radius: 22px; padding: 1.25rem; box-shadow: var(--shadow-card); width: 100%; overflow: hidden; }
        .conventional-cal-topbar { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem; padding-bottom: 0.85rem; border-bottom: 1px solid var(--line-strong); }
        .conventional-cal-nav { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
        .conventional-cal-title { font-size: 1.22rem; font-weight: 800; color: var(--ink-900); margin: 0; min-width: 170px; text-align: center; }
        .conventional-cal-weekdays { display: grid !important; grid-template-columns: repeat(7, minmax(0, 1fr)) !important; gap: 0.4rem; margin-bottom: 0.45rem; }
        .conventional-cal-weekdays div { background: #0c192c; color: #ffffff; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; text-align: center; padding: 0.5rem 0.15rem; border-radius: 9px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cal-wk-short { display: none; }
        .conventional-cal-grid { display: grid !important; grid-template-columns: repeat(7, minmax(0, 1fr)) !important; gap: 0.4rem; width: 100%; }
        .conv-day-box { min-height: 112px; background: var(--surface-subtle); border: 1.5px solid var(--line-strong); border-radius: 13px; padding: 0.5rem; display: flex; flex-direction: column; gap: 0.3rem; cursor: pointer; transition: all 0.18s ease; position: relative; min-width: 0; overflow: hidden; }
        .conv-day-box:hover { border-color: var(--cdm-500); background: var(--surface-solid); transform: translateY(-2px); box-shadow: var(--shadow-float); }
        .conv-day-box.empty-slot-day { background: transparent; border-color: transparent; cursor: default; pointer-events: none; min-height: 44px; }
        .conv-day-box.has-turns-day { background: var(--surface-solid); border-color: rgba(2, 132, 199, 0.45); border-top: 3.5px solid var(--cdm-500); }
        .conv-day-box.is-today-box { box-shadow: inset 0 0 0 2px var(--ok); background: var(--ok-bg); }
        .conv-day-box.is-selected-box { border-color: var(--cdm-500); box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.28); }
        .conv-day-top { display: flex; justify-content: space-between; align-items: center; gap: 0.2rem; }
        .conv-day-number { font-size: 0.86rem; font-weight: 800; color: var(--ink-900); width: 26px; height: 26px; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; background: var(--surface-solid); border: 1px solid var(--line-strong); flex-shrink: 0; }
        .conv-day-box.is-today-box .conv-day-number { background: var(--ok); color: #ffffff; border-color: var(--ok); }
        .conv-day-count-badge { font-size: 0.6rem; font-weight: 800; padding: 0.1rem 0.42rem; border-radius: 999px; background: var(--cdm-500); color: #ffffff; white-space: nowrap; }
        .conv-day-events-list { display: flex; flex-direction: column; gap: 0.22rem; margin-top: 0.1rem; flex: 1; min-width: 0; }
        .conv-event-chip { font-size: 0.64rem; font-weight: 700; padding: 0.18rem 0.4rem; border-radius: 6px; background: var(--cdm-50); color: var(--cdm-700); border-left: 3px solid var(--cdm-500); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
        .conv-event-chip.chip-atendido { background: var(--ok-bg); color: var(--ok-ink); border-left-color: var(--ok); }
        .conv-event-chip.chip-en-sala { background: var(--warn-bg); color: var(--warn-ink); border-left-color: var(--warn); }
        .conv-mobile-dots { display: none; gap: 3px; justify-content: center; flex-wrap: wrap; margin: auto 0; }
        .conv-mob-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--cdm-500); }
        .conv-mob-dot.ok { background: var(--ok); }
        .conv-mob-dot.warn { background: var(--warn); }
        .conv-day-add-hint { font-size: 0.62rem; font-weight: 700; color: var(--ink-400); margin-top: auto; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .patients-history-cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr)); gap: 1.15rem; width: 100%; }
        .patient-history-pro-card { background: var(--surface-solid); border: 1.5px solid var(--line-strong); border-top: 4px solid var(--cdm-500); border-radius: 20px; padding: 1.2rem; box-shadow: var(--shadow-card); display: flex; flex-direction: column; gap: 0.85rem; }
        .patient-recent-notes-box { background: var(--surface-subtle); border: 1px solid var(--line-strong); border-radius: 14px; padding: 0.75rem 0.9rem; display: flex; flex-direction: column; gap: 0.55rem; }
        .session-mini-log-item { background: var(--surface-solid); border: 1px solid var(--line); border-left: 3.5px solid var(--cdm-500); border-radius: 10px; padding: 0.55rem 0.75rem; font-size: 0.78rem; }
        .modal-hours-picker-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 0.35rem; margin: 0.4rem 0 0.75rem 0; }
        .hour-chip-btn { border: 1.5px solid var(--line-strong); background: var(--surface-subtle); color: var(--ink-700); font-size: 0.74rem; font-weight: 700; padding: 0.36rem 0.2rem; border-radius: 9px; cursor: pointer; text-align: center; }
        .hour-chip-btn.selected { background: var(--cdm-500); border-color: var(--cdm-500); color: #ffffff; }
        .hour-chip-btn.occupied { background: var(--warn-bg); border-color: rgba(245, 158, 11, 0.45); color: var(--warn-ink); }
        .evo-pain-scale-bar { display: grid; grid-template-columns: repeat(11, minmax(0, 1fr)); gap: 0.25rem; margin-top: 0.3rem; }
        .evo-pain-btn { border: 1.5px solid var(--line-strong); background: var(--surface-subtle); color: var(--ink-700); font-weight: 800; font-size: 0.75rem; padding: 0.4rem 0.05rem; border-radius: 8px; cursor: pointer; text-align: center; }
        .evo-pain-btn.active.pain-low { background: #10b981; border-color: #059669; color: #fff; }
        .evo-pain-btn.active.pain-mid { background: #f59e0b; border-color: #d97706; color: #fff; }
        .evo-pain-btn.active.pain-high { background: #f43f5e; border-color: #e11d48; color: #fff; }
        .evo-quick-chips-wrap { display: flex; gap: 0.35rem; flex-wrap: wrap; margin: 0.35rem 0 0.6rem 0; }
        .evo-quick-chip { border: 1px solid var(--line-celeste); background: var(--cdm-50); color: var(--cdm-600); font-size: 0.7rem; font-weight: 700; padding: 0.22rem 0.6rem; border-radius: 999px; cursor: pointer; }
        @media (max-width: 860px) {
            .app-sidebar { height: 68px !important; padding: 0.25rem 0.35rem !important; overflow-x: auto !important; }
            .sidebar-nav { gap: 0.15rem !important; min-width: max-content; }
            .side-link { min-width: 64px; padding: 0.25rem 0.35rem !important; font-size: 0.6rem !important; line-height: 1.05 !important; white-space: nowrap; }
        }
        @media (max-width: 720px) {
            .conventional-cal-panel { padding: 0.85rem 0.55rem !important; }
            .cal-wk-full { display: none !important; }
            .cal-wk-short { display: inline !important; }
            .conventional-cal-weekdays, .conventional-cal-grid { gap: 0.24rem !important; }
            .conventional-cal-weekdays div { font-size: 0.62rem !important; padding: 0.38rem 0.08rem !important; border-radius: 7px !important; }
            .conv-day-box { min-height: 66px !important; padding: 0.28rem 0.18rem !important; border-radius: 10px !important; align-items: center; justify-content: space-between; }
            .conv-day-top { width: 100%; justify-content: center; flex-direction: column; gap: 2px; }
            .conv-day-number { width: 23px !important; height: 23px !important; font-size: 0.74rem !important; }
            .conv-day-count-badge { font-size: 0.53rem !important; padding: 1px 4px !important; }
            .conv-day-events-list, .conv-day-add-hint { display: none !important; }
            .conv-mobile-dots { display: flex !important; }
            .evo-pain-scale-bar { grid-template-columns: repeat(6, 1fr); }
        }
    `;
}

const ESPECIALIDADES_PROFESIONALES_BASE_CDM = [
    {
        clave: "Quiropraxia",
        icono: "🦴",
        titulo: "Quiropraxia y Osteopatía",
        metricaPrincipal: "Escala Dolor EVA (0-10)",
        metricaSecundaria: "Simetría / Movilidad (%)",
        placeholderZona: "Ej: Subluxación Cervical C2-C3 / Sacroilíaca derecha",
        placeholderTecnica: "Ej: Ajuste quiropráctico específico + Drop pélvico + Liberación miofascial",
        chipsZonas: ["Cervical C1-C2 (Atlas/Axis)", "Cervical Baja C5-C7", "Dorsal T4-T8", "Lumbar L4-L5", "Sacroilíaca / Pelvis", "ATM / Mandíbula"],
        chipsTecnicas: ["Ajuste específico Diversified", "Técnica Drop Pélvico", "Activador Instrumental", "Liberación Miofascial", "Descompresión Axial", "Pautas posturales"]
    },
    {
        clave: "Kinesiología",
        icono: "🦿",
        titulo: "Kinesiología y Fisioterapia",
        metricaPrincipal: "Dolor EVA (0-10)",
        metricaSecundaria: "Rango Articular ROM (%)",
        placeholderZona: "Ej: Rehabilitación LCA Rodilla Derecha / Manguito rotador",
        placeholderTecnica: "Ej: Magnetoterapia 20m + Ultrasonido + Ejercicios isométricos y propiocepción",
        chipsZonas: ["Rodilla (LCA / Meniscos)", "Hombro (Manguito Rotador)", "Columna Lumbosacra", "Tobillo (Esguince)", "Isquiotibiales / Desgarro", "Tendón Rotuliano/Aquiles"],
        chipsTecnicas: ["Magnetoterapia 20 min", "Ultrasonido Pulsado", "TENS / Electroanalgesia", "Movilización Articular Activa", "Propiocepción en Bosu", "Fortalecimiento Excéntrico"]
    },
    {
        clave: "Psicología",
        icono: "🧠",
        titulo: "Psicología y Salud Mental",
        metricaPrincipal: "Nivel Ansiedad/Malestar (0-10)",
        metricaSecundaria: "Bienestar / Regulación (%)",
        placeholderZona: "Ej: Motivo de consulta / Foco emocional de la sesión de hoy",
        placeholderTecnica: "Ej: Reestructuración cognitiva, regulación emocional y pautas semanales",
        chipsZonas: ["Ansiedad por rendimiento", "Manejo del estrés laboral", "Regulación del sueño", "Vínculos y comunicación", "Autoestima y foco", "Duelo / Transición vital"],
        chipsTecnicas: ["Reestructuración Cognitiva", "Técnicas de Respiración/Mindfulness", "Registro de Pensamientos", "Exposición Gradual", "Psicoeducación", "Acuerdo de metas semanales"]
    },
    {
        clave: "Nutrición",
        icono: "🥗",
        titulo: "Nutrición y Antropometría",
        metricaPrincipal: "Dificultad / Ansiedad (0-10)",
        metricaSecundaria: "Adherencia al Plan (%)",
        placeholderZona: "Ej: Control antropométrico / Peso actual: 74.5 kg / % Muscular",
        placeholderTecnica: "Ej: Ajuste de macronutrientes, distribución proteica e hidratación",
        chipsZonas: ["Control Antropométrico ISAK", "Recomposición Corporal", "Déficit Calórico Controlado", "Superávit Masa Muscular", "Nutrición Pre/Post Competencia", "Salud Digestiva"],
        chipsTecnicas: ["Ajuste de Proteínas Diarias", "Planificación Menú Semanal", "Protocolo de Hidratación", "Suplementación Deportiva", "Educación en Porciones", "Recetario Práctico"]
    }
];

function obtenerCatalogoProfesionesGuardadasCDM() {
    let base = ["Quiropraxia", "Kinesiología", "Psicología", "Nutrición"];
    try {
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : null;
        if (lic && Array.isArray(lic.profesionesHabilitadas) && lic.profesionesHabilitadas.length > 0) {
            base = [...lic.profesionesHabilitadas];
        }
        const extraLocal = JSON.parse(localStorage.getItem(STORAGE_PROFESIONES_EXTRA_CLINICA_KEY) || "[]");
        if (Array.isArray(extraLocal)) {
            extraLocal.forEach(p => {
                if (p && !base.some(b => b.toLowerCase() === p.toLowerCase())) base.push(p);
            });
        }
    } catch {}
    return base;
}

function asegurarProfesionEnCatalogoCDM(nombreProfesionRaw = "") {
    const limpio = String(nombreProfesionRaw || "").replace(/^[^\wÁÉÍÓÚáéíóúÑñ]+/, "").trim();
    if (!limpio) return "Kinesiología";

    const actuales = obtenerCatalogoProfesionesGuardadasCDM();
    const matchExistente = actuales.find(p => p.replace(/^[^\wÁÉÍÓÚáéíóúÑñ]+/, "").trim().toLowerCase() === limpio.toLowerCase());
    if (matchExistente) {
        return matchExistente.replace(/^[^\wÁÉÍÓÚáéíóúÑñ]+/, "").trim();
    }

    try {
        const extraLocal = JSON.parse(localStorage.getItem(STORAGE_PROFESIONES_EXTRA_CLINICA_KEY) || "[]");
        extraLocal.push(limpio);
        localStorage.setItem(STORAGE_PROFESIONES_EXTRA_CLINICA_KEY, JSON.stringify(extraLocal));

        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : null;
        if (lic) {
            if (!Array.isArray(lic.profesionesHabilitadas)) lic.profesionesHabilitadas = [];
            if (!lic.profesionesHabilitadas.includes(limpio)) {
                lic.profesionesHabilitadas.push(limpio);
                if (typeof guardarLicenciaConfigCDM === "function") guardarLicenciaConfigCDM(lic);
            }
        }
    } catch {}
    mostrarToast(`✨ Nueva profesión "${limpio}" incorporada automáticamente a la lista.`);
    return limpio;
}

function obtenerEspecialidadesHabilitadasConsultorioCDM() {
    const nombresHab = obtenerCatalogoProfesionesGuardadasCDM();
    const resultado = [];
    nombresHab.forEach(nom => {
        const limpia = nom.replace(/^[^\wÁÉÍÓÚáéíóúÑñ]+/, "").trim();
        const baseMatch = ESPECIALIDADES_PROFESIONALES_BASE_CDM.find(b => b.clave.toLowerCase() === limpia.toLowerCase());
        if (baseMatch) {
            resultado.push(baseMatch);
        } else if (limpia) {
            resultado.push({
                clave: limpia,
                icono: "🩺",
                titulo: limpia,
                metricaPrincipal: "Escala Molestia/EVA (0-10)",
                metricaSecundaria: "Evolución / Avance (%)",
                placeholderZona: `Evaluación clínica de ${limpia}`,
                placeholderTecnica: `Notas de lo trabajado en la sesión de ${limpia}`,
                chipsZonas: ["Evaluación Inicial", "Control Evolutivo", "Zona Principal", "Movilidad Funcional"],
                chipsTecnicas: ["Atención Clínica Especializada", "Protocolo Preventivo", "Ejercicios Indicados", "Seguimiento"]
            });
        }
    });
    return resultado.length > 0 ? resultado : ESPECIALIDADES_PROFESIONALES_BASE_CDM;
}

function obtenerConfigMutualesCDM() {
    try {
        const m = JSON.parse(localStorage.getItem(STORAGE_MUTUALES_CONVENIOS_KEY) || "null");
        if (Array.isArray(m) && m.length > 0) return m;
    } catch {}
    const defecto = [
        { id: 1, nombre: "Particular (Sin Mutual)", arancelMutual: 0, coseguroPaciente: 18000, esParticular: true },
        { id: 2, nombre: "APROSS", arancelMutual: 11500, coseguroPaciente: 4500, esParticular: false },
        { id: 3, nombre: "OSDE", arancelMutual: 16000, coseguroPaciente: 0, esParticular: false },
        { id: 4, nombre: "PAMI", arancelMutual: 9800, coseguroPaciente: 2000, esParticular: false },
        { id: 5, nombre: "Swiss Medical", arancelMutual: 15500, coseguroPaciente: 0, esParticular: false },
        { id: 6, nombre: "Sancor Salud", arancelMutual: 13500, coseguroPaciente: 3000, esParticular: false },
        { id: 7, nombre: "Jerárquicos Salud", arancelMutual: 12500, coseguroPaciente: 3000, esParticular: false },
        { id: 8, nombre: "Mutual Local / Sindical", arancelMutual: 10500, coseguroPaciente: 3500, esParticular: false }
    ];
    localStorage.setItem(STORAGE_MUTUALES_CONVENIOS_KEY, JSON.stringify(defecto));
    return defecto;
}

function guardarConfigMutualesCDM(lista) {
    localStorage.setItem(STORAGE_MUTUALES_CONVENIOS_KEY, JSON.stringify(lista));
}

function asegurarMutualEnCatalogoCDM(nombreMutualRaw = "", arancelSugerido = 12000, coseguroSugerido = 3500) {
    const limpio = String(nombreMutualRaw || "").trim();
    if (!limpio) return obtenerConfigMutualesCDM()[0];

    const lista = obtenerConfigMutualesCDM();
    const existente = lista.find(m => m.nombre.toLowerCase() === limpio.toLowerCase());
    if (existente) return existente;

    const esPart = limpio.toLowerCase().includes("particular");
    const nuevaMutual = {
        id: Date.now(),
        nombre: limpio,
        arancelMutual: esPart ? 0 : (Number(arancelSugerido) || 12000),
        coseguroPaciente: Number(coseguroSugerido) || (esPart ? 18000 : 3500),
        esParticular: esPart
    };
    lista.push(nuevaMutual);
    guardarConfigMutualesCDM(lista);
    mostrarToast(`🏥 Nueva mutual "${limpio}" agregada automáticamente al listado.`);
    return nuevaMutual;
}

function obtenerPacientesClinicosCDM() {
    try {
        const p = JSON.parse(localStorage.getItem(STORAGE_PACIENTES_CLINICOS_KEY) || "null");
        if (Array.isArray(p)) return p;
    } catch {}
    const hoy = obtenerHoyISO();
    const defecto = [
        {
            id: 8001,
            codigoAcceso: "PAC-801",
            nombre: "Valeria",
            apellido: "Gómez",
            dni: "34.890.112",
            edad: 34,
            whatsapp: "5493584112233",
            especialidad: "Quiropraxia",
            mutual: "APROSS",
            nroAfiliado: "45-34890112-01",
            diagnostico: "Cervicalgia mecánica y rectificación cervical con irradiación a hombro derecho.",
            sesionesAutorizadas: 6,
            sesionesRealizadas: 2,
            sesiones: [
                { id: 901, fecha: "2026-11-03", numSesion: 1, especialidad: "Quiropraxia", zona: "Atlas C1, C5 y Dorsal T4. Asimetría pélvica +6mm derecha.", intervencion: "Ajuste específico C1/C5 en camilla con drop y descarga suboccipital.", dolorEVA: 8, evolucionPct: 35, profesional: "Consultorio Oficial", cobroDetalle: "APROSS ($11.500) + Coseguro ($4.500)" },
                { id: 902, fecha: hoy, numSesion: 2, especialidad: "Quiropraxia", zona: "Mejoría en rotación cervical. Persiste leve tensión en T4 y sacro.", intervencion: "Ajuste sacroilíaco y movilización dorsal. Nivelación de miembros inferiores lograda.", dolorEVA: 3, evolucionPct: 80, profesional: "Consultorio Oficial", cobroDetalle: "APROSS ($11.500) + Coseguro ($4.500)" }
            ]
        },
        {
            id: 8002,
            codigoAcceso: "PAC-802",
            nombre: "Marcos",
            apellido: "Ríos",
            dni: "29.412.880",
            edad: 41,
            whatsapp: "5493584223344",
            especialidad: "Kinesiología",
            mutual: "Sancor Salud",
            nroAfiliado: "880912-00",
            diagnostico: "Post-operatorio ligamento cruzado anterior (LCA) rodilla izquierda — Semana 6.",
            sesionesAutorizadas: 10,
            sesionesRealizadas: 4,
            sesiones: [
                { id: 903, fecha: "2026-11-05", numSesion: 3, especialidad: "Kinesiología", zona: "Flexión activa en 85°, leve edema perirrotuliano.", intervencion: "Magnetoterapia, electroestimulación rusa en vasto medial y ejercicios de cadena cerrada.", dolorEVA: 6, evolucionPct: 50, profesional: "Lic. Kinesiología", cobroDetalle: "Sancor Salud ($13.500) + Coseguro ($3.000)" },
                { id: 904, fecha: hoy, numSesion: 4, especialidad: "Kinesiología", zona: "Logra 108° de flexión activa sin dolor agudo. Mejor control unipodal.", intervencion: "Movilización patelar, prensa unilateral liviana y propiocepción en bosu.", dolorEVA: 2, evolucionPct: 82, profesional: "Lic. Kinesiología", cobroDetalle: "Sancor Salud ($13.500) + Coseguro ($3.000)" }
            ]
        },
        {
            id: 8003,
            codigoAcceso: "PAC-803",
            nombre: "Carolina",
            apellido: "Paz",
            dni: "38.110.445",
            edad: 28,
            whatsapp: "5493584556677",
            especialidad: "Psicología",
            mutual: "Particular (Sin Mutual)",
            nroAfiliado: "Particular",
            diagnostico: "Ansiedad por rendimiento laboral y deportivo, dificultades en conciliación del sueño.",
            sesionesAutorizadas: 0,
            sesionesRealizadas: 3,
            sesiones: [
                { id: 905, fecha: hoy, numSesion: 3, especialidad: "Psicología", zona: "Revisión de disparadores de exigencia semanal y registro de sueño.", intervencion: "Técnicas de defusión cognitiva, higiene del sueño y pautas de exposición gradual.", dolorEVA: 3, evolucionPct: 78, profesional: "Lic. Psicología", cobroDetalle: "Particular Transferencia ($18.000)" }
            ]
        }
    ];
    localStorage.setItem(STORAGE_PACIENTES_CLINICOS_KEY, JSON.stringify(defecto));
    return defecto;
}

function guardarPacientesClinicosCDM(lista) {
    localStorage.setItem(STORAGE_PACIENTES_CLINICOS_KEY, JSON.stringify(lista));
}

function obtenerTurnosAgendaCDM() {
    try {
        const t = JSON.parse(localStorage.getItem(STORAGE_TURNOS_AGENDA_KEY) || "null");
        if (Array.isArray(t)) return t;
    } catch {}
    const hoy = obtenerHoyISO();
    const manana = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const pasado = new Date(Date.now() + 172800000).toISOString().split("T")[0];

    const defecto = [
        { id: 701, fecha: hoy, hora: "09:00", duracion: "45 min", pacienteId: 8001, pacienteNombre: "Gómez, Valeria", especialidad: "Quiropraxia", mutual: "APROSS", motivo: "2° Ajuste Cervical y Pelvis", estado: "Atendido", pagado: true, montoTotal: 16000 },
        { id: 702, fecha: hoy, hora: "10:30", duracion: "45 min", pacienteId: 8002, pacienteNombre: "Ríos, Marcos", especialidad: "Kinesiología", mutual: "Sancor Salud", motivo: "Sesión 4/10 Rehab LCA", estado: "En Sala", pagado: false, montoTotal: 16500 },
        { id: 703, fecha: hoy, hora: "16:00", duracion: "45 min", pacienteId: 8003, pacienteNombre: "Paz, Carolina", especialidad: "Psicología", mutual: "Particular (Sin Mutual)", motivo: "Sesión Terapia Individual", estado: "Reservado", pagado: false, montoTotal: 18000 },
        { id: 704, fecha: manana, hora: "09:30", duracion: "45 min", pacienteId: 8002, pacienteNombre: "Ríos, Marcos", especialidad: "Kinesiología", mutual: "Sancor Salud", motivo: "Sesión 5/10 Rehab LCA", estado: "Reservado", pagado: false, montoTotal: 16500 },
        { id: 705, fecha: pasado, hora: "11:00", duracion: "45 min", pacienteId: 8001, pacienteNombre: "Gómez, Valeria", especialidad: "Quiropraxia", mutual: "APROSS", motivo: "Control de Pelvis y Atlas", estado: "Reservado", pagado: false, montoTotal: 16000 }
    ];
    localStorage.setItem(STORAGE_TURNOS_AGENDA_KEY, JSON.stringify(defecto));
    return defecto;
}

function guardarTurnosAgendaCDM(lista) {
    localStorage.setItem(STORAGE_TURNOS_AGENDA_KEY, JSON.stringify(lista));
}

function obtenerOrdenesMutualPendientesCDM() {
    try {
        const o = JSON.parse(localStorage.getItem(STORAGE_ORDENES_MUTUAL_KEY) || "null");
        if (Array.isArray(o)) return o;
    } catch {}
    const hoy = obtenerHoyISO();
    const defecto = [
        { id: 601, fecha: hoy, mutual: "APROSS", pacienteNombre: "Gómez, Valeria", nroAfiliado: "45-34890112-01", nroOrden: "AUT-99210", especialidad: "Quiropraxia", montoMutual: 11500, coseguroCobrado: 4500, estado: "Pendiente" },
        { id: 602, fecha: hoy, mutual: "Sancor Salud", pacienteNombre: "Ríos, Marcos", nroAfiliado: "880912-00", nroOrden: "AUT-44108", especialidad: "Kinesiología", montoMutual: 13500, coseguroCobrado: 3000, estado: "Pendiente" }
    ];
    localStorage.setItem(STORAGE_ORDENES_MUTUAL_KEY, JSON.stringify(defecto));
    return defecto;
}

function guardarOrdenesMutualPendientesCDM(lista) {
    localStorage.setItem(STORAGE_ORDENES_MUTUAL_KEY, JSON.stringify(lista));
}

function inyectarAccesoConsultorioEnSidebarEIndexCDM() {
    asegurarEstilosCalendario30DiasEnDOM();
    if (document.body.getAttribute("data-rol") === "usuario") return;

    const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
    const profsHab = obtenerEspecialidadesHabilitadasConsultorioCDM();
    const tieneConsultorio = (lic?.modulos?.consultorio !== false) && profsHab.length > 0;

    const nav = document.querySelector(".app-sidebar .sidebar-nav");
    if (nav && !nav.querySelector('[data-nav="consultorio"]')) {
        const a = document.createElement("a");
        a.href = "#consultorio";
        a.className = `side-link ${!tieneConsultorio ? "hidden" : ""}`;
        a.dataset.nav = "consultorio";
        a.onclick = function (e) {
            e.preventDefault();
            abrirModuloConsultorioIndependienteCDM();
        };
        a.innerHTML = `<i class="ri-stethoscope-line"></i><span>Consultorio</span>`;
        const linkContable = nav.querySelector('[data-nav="contabilidad"]');
        if (linkContable) nav.insertBefore(a, linkContable);
        else nav.appendChild(a);
    }

    const gridSports = document.querySelector(".sports-showcase-grid");
    if (gridSports && !document.getElementById("cardShowcaseConsultorioPro") && tieneConsultorio) {
        const turnosHoy = obtenerTurnosAgendaCDM().filter(t => t.fecha === obtenerHoyISO()).length;
        const card = document.createElement("a");
        card.href = "#consultorio";
        card.id = "cardShowcaseConsultorioPro";
        card.className = "sport-showcase-card";
        card.onclick = function (e) {
            e.preventDefault();
            abrirModuloConsultorioIndependienteCDM();
        };
        card.innerHTML = `
            <div class="sport-card-visual" style="background:linear-gradient(135deg, #0f172a 0%, #0369a1 55%, #0d9488 100%);">
                <div class="sport-card-top">
                    <span class="sport-chip-glass">🩺 Salud & Consultorios</span>
                    <span class="showcase-live-count">${turnosHoy} turnos hoy</span>
                </div>
                <div class="sport-card-visual-title">
                    <h3>Consultorio & Turnos</h3>
                </div>
            </div>
            <div class="sport-card-content">
                <p class="sport-card-desc">Calendario mensual de 30 días, cuaderno histórico de notas por sesión de cada paciente y liquidación de mutuales.</p>
                <div class="sport-card-pills">
                    ${profsHab.slice(0, 4).map(p => `<span class="sport-mini-pill">${p.icono} ${p.clave}</span>`).join("")}
                </div>
                <div class="sport-card-footer">
                    <span>Abrir Calendario e Histórico de Sesiones</span>
                    <i class="ri-arrow-right-line"></i>
                </div>
            </div>
        `;
        gridSports.appendChild(card);
    }
}

function abrirModuloConsultorioIndependienteCDM(tabForzada = null) {
    asegurarEstilosCalendario30DiasEnDOM();
    if (tabForzada) tabActivaConsultorioCDM = tabForzada;
    const mainContent = document.querySelector(".app-content");
    if (!mainContent) return;

    const profsHab = obtenerEspecialidadesHabilitadasConsultorioCDM();
    if (profsHab.length === 1) {
        especialidadFiltroConsultorioCDM = profsHab[0].clave;
    }

    document.querySelectorAll(".app-sidebar .side-link").forEach(l => {
        l.classList.toggle("active", l.dataset.nav === "consultorio");
    });

    Array.from(mainContent.children).forEach(ch => {
        if (ch.id !== "cdmSeccionConsultorioGlobal") ch.classList.add("hidden");
    });

    let secCli = document.getElementById("cdmSeccionConsultorioGlobal");
    if (!secCli) {
        secCli = document.createElement("section");
        secCli.id = "cdmSeccionConsultorioGlobal";
        secCli.className = "animate-in";
        mainContent.appendChild(secCli);
    }
    secCli.classList.remove("hidden");

    const topTitle = document.querySelector(".topbar-title h2");
    if (topTitle) {
        topTitle.innerHTML = `🩺 Consultorio, Calendario e Histórico por Sesión <span class="cat-active-pill">${profsHab.map(p => p.clave).join(" • ")}</span>`;
    }

    renderizarModuloConsultorioCompletoCDM();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function cambiarSubTabConsultorioCDM(nuevaTab) {
    tabActivaConsultorioCDM = nuevaTab;
    renderizarModuloConsultorioCompletoCDM();
}

function cambiarEspecialidadFiltroConsultorioCDM(esp) {
    especialidadFiltroConsultorioCDM = esp;
    renderizarModuloConsultorioCompletoCDM();
}

// =========================================================================
// CALENDARIO CONVENCIONAL DE 30/31 DÍAS (RESPONSIVO + AGENDA DEL DÍA AL PIE)
// =========================================================================

function navegarMesCalendarioTurnosCDM(deltaMes) {
    mesCalendarioVisualCDM += deltaMes;
    if (mesCalendarioVisualCDM < 0) {
        mesCalendarioVisualCDM = 11;
        anioCalendarioVisualCDM--;
    } else if (mesCalendarioVisualCDM > 11) {
        mesCalendarioVisualCDM = 0;
        anioCalendarioVisualCDM++;
    }
    renderizarModuloConsultorioCompletoCDM();
}

function irAMesActualCalendarioCDM() {
    const hoy = new Date();
    anioCalendarioVisualCDM = hoy.getFullYear();
    mesCalendarioVisualCDM = hoy.getMonth();
    fechaSeleccionadaCalendarioCDM = obtenerHoyISO();
    renderizarModuloConsultorioCompletoCDM();
}

function alTocarDiaEnCalendario30DiasCDM(fechaISO) {
    fechaSeleccionadaCalendarioCDM = fechaISO;
    renderizarModuloConsultorioCompletoCDM();
    abrirModalDiaCalendarioYTurnoCDM(fechaISO);
}

function generarCalendarioConvencional30DiasHTML(turnosFiltradosEsp) {
    const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const primerDiaMes = new Date(anioCalendarioVisualCDM, mesCalendarioVisualCDM, 1);
    const ultimoDiaMes = new Date(anioCalendarioVisualCDM, mesCalendarioVisualCDM + 1, 0);
    const totalDiasMes = ultimoDiaMes.getDate();

    const offsetLunes = (primerDiaMes.getDay() + 6) % 7;
    const hoyISO = obtenerHoyISO();
    const todosPacs = obtenerPacientesClinicosCDM();

    const mapaTurnosPorDia = {};
    turnosFiltradosEsp.forEach(t => {
        if (!mapaTurnosPorDia[t.fecha]) mapaTurnosPorDia[t.fecha] = [];
        mapaTurnosPorDia[t.fecha].push(t);
    });

    let celdasHTML = "";
    for (let i = 0; i < offsetLunes; i++) {
        celdasHTML += `<div class="conv-day-box empty-slot-day"></div>`;
    }

    for (let dia = 1; dia <= totalDiasMes; dia++) {
        const mm = String(mesCalendarioVisualCDM + 1).padStart(2, "0");
        const dd = String(dia).padStart(2, "0");
        const fechaISO = `${anioCalendarioVisualCDM}-${mm}-${dd}`;
        const turnosDia = (mapaTurnosPorDia[fechaISO] || []).sort((a, b) => a.hora.localeCompare(b.hora));
        const cant = turnosDia.length;
        const esHoy = fechaISO === hoyISO;
        const esSel = fechaISO === fechaSeleccionadaCalendarioCDM;

        // En escritorio se ven las píldoras con hora y apellido; en móvil se ven puntos de color + contador compacto
        const chipsEventosHTML = turnosDia.slice(0, 3).map(t => {
            const cls = t.estado === "Atendido" ? "chip-atendido" : (t.estado === "En Sala" ? "chip-en-sala" : "");
            return `<span class="conv-event-chip ${cls}">${t.hora} ${t.pacienteNombre}</span>`;
        }).join("");

        const dotsMobileHTML = turnosDia.slice(0, 5).map(t => {
            const cls = t.estado === "Atendido" ? "ok" : (t.estado === "En Sala" ? "warn" : "");
            return `<span class="conv-mob-dot ${cls}"></span>`;
        }).join("");

        const masTurnosHTML = cant > 3
            ? `<small style="font-size:0.6rem; font-weight:800; color:var(--cdm-600); display:block; text-align:center;">+${cant - 3} más</small>`
            : "";

        celdasHTML += `
            <div class="conv-day-box ${cant > 0 ? "has-turns-day" : ""} ${esHoy ? "is-today-box" : ""} ${esSel ? "is-selected-box" : ""}"
                 onclick="alTocarDiaEnCalendario30DiasCDM('${fechaISO}')">
                <div class="conv-day-top">
                    <span class="conv-day-number">${dia}</span>
                    ${cant > 0 ? `<span class="conv-day-count-badge">${cant}t</span>` : ""}
                </div>

                <div class="conv-day-events-list">
                    ${chipsEventosHTML}
                    ${masTurnosHTML}
                </div>

                <div class="conv-mobile-dots">
                    ${dotsMobileHTML}
                </div>

                <div class="conv-day-add-hint">
                    ${cant > 0 ? "🔍 Ver / + Turno" : "+ Dar Turno"}
                </div>
            </div>
        `;
    }

    // Resumen claro al pie del calendario para el día seleccionado (ideal en celulares)
    const turnosDiaSel = (mapaTurnosPorDia[fechaSeleccionadaCalendarioCDM] || []).sort((a, b) => a.hora.localeCompare(b.hora));
    const resumenDiaSeleccionadoHTML = `
        <div class="app-panel" style="margin-top:1.15rem; margin-bottom:0;">
            <div class="panel-head" style="margin-bottom:0.8rem; padding-bottom:0.65rem;">
                <div>
                    <h3><i class="ri-calendar-check-fill"></i> Turnos e Histórico del Día: <span style="color:var(--cdm-500);">${fechaSeleccionadaCalendarioCDM}</span> (${turnosDiaSel.length})</h3>
                    <small style="color:var(--ink-500);">En cada paciente ves la nota de su última sesión y podés anotar la sesión de hoy o abrir su Cuaderno Histórico.</small>
                </div>
                <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalDiaCalendarioYTurnoCDM('${fechaSeleccionadaCalendarioCDM}')">
                    <i class="ri-add-circle-line"></i> + Asignar Turno en ${fechaSeleccionadaCalendarioCDM}
                </button>
            </div>

            ${turnosDiaSel.length > 0 ? `
                <div style="display:flex; flex-direction:column; gap:0.65rem;">
                    ${turnosDiaSel.map(t => {
                        const pac = todosPacs.find(p => Number(p.id) === Number(t.pacienteId));
                        const ultNota = (pac && Array.isArray(pac.sesiones) && pac.sesiones.length > 0)
                            ? pac.sesiones[pac.sesiones.length - 1]
                            : null;

                        return `
                            <div class="turn-slot-card ${t.estado === "Atendido" ? "status-atendido" : ""}">
                                <div style="display:flex; align-items:flex-start; gap:0.85rem; flex:1; min-width:230px;">
                                    <div class="turn-time-pill">${t.hora}<br><small style="font-size:0.6rem; color:#bae6fd;">${t.duracion || "45m"}</small></div>
                                    <div style="flex:1; min-width:0;">
                                        <div style="display:flex; gap:0.35rem; align-items:center; flex-wrap:wrap;">
                                            <span class="badge ${t.estado === "Atendido" ? "badge-ok" : "badge-celeste"}">${t.estado.toUpperCase()}</span>
                                            <span class="badge badge-celeste">${t.especialidad}</span>
                                            <span class="badge badge-purple">🏥 ${t.mutual}</span>
                                        </div>
                                        <h4 style="font-size:1.02rem; font-weight:800; color:var(--ink-900); margin:0.2rem 0;" onclick="abrirModalHistoriaClinicaPacienteCDM(${t.pacienteId})">
                                            ${t.pacienteNombre}
                                        </h4>
                                        <div style="font-size:0.78rem; color:var(--ink-700);"><b>Motivo hoy:</b> ${t.motivo || "Sesión clínica"}</div>
                                        ${ultNota ? `
                                            <div style="margin-top:0.35rem; padding:0.4rem 0.65rem; background:var(--cdm-50); border-left:3px solid var(--cdm-500); border-radius:8px; font-size:0.75rem; color:var(--ink-700);">
                                                <b>📓 Última Nota (Sesión #${ultNota.numSesion} - ${ultNota.fecha}):</b> ${ultNota.zona} — <i>${ultNota.intervencion}</i> (EVA: ${ultNota.dolorEVA}/10)
                                            </div>
                                        ` : `<small style="color:var(--ink-400); display:block; margin-top:3px;">📓 Sin notas de sesiones previas registradas aún.</small>`}
                                    </div>
                                </div>

                                <div style="display:flex; gap:0.35rem; flex-wrap:wrap; align-items:center;">
                                    <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalRegistrarSesionYEvolucionCDM(${t.pacienteId}, ${t.id})">
                                        ✍️ Anotar Sesión Hoy
                                    </button>
                                    <button type="button" class="btn btn-secondary btn-sm" onclick="abrirModalHistoriaClinicaPacienteCDM(${t.pacienteId})">
                                        📓 Histórico (${pac?.sesiones?.length || 0})
                                    </button>
                                    <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarRecordatorioTurnoWhatsAppCDM(${t.id})">
                                        <i class="ri-whatsapp-line"></i>
                                    </button>
                                    <button type="button" class="btn btn-danger btn-sm" onclick="eliminarTurnoAgendaCDM(${t.id})">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join("")}
                </div>
            ` : `
                <div class="empty-box" style="padding:1.25rem;">
                    No hay turnos cargados para el día <b>${fechaSeleccionadaCalendarioCDM}</b>. Tocá cualquier recuadro del calendario o el botón <b>"+ Asignar Turno"</b>.
                </div>
            `}
        </div>
    `;

    return `
        <div class="conventional-cal-panel">
            <div class="conventional-cal-topbar">
                <div class="conventional-cal-nav">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="navegarMesCalendarioTurnosCDM(-1)">
                        <i class="ri-arrow-left-s-line"></i> Anterior
                    </button>
                    <h3 class="conventional-cal-title">📅 ${nombresMeses[mesCalendarioVisualCDM]} ${anioCalendarioVisualCDM}</h3>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="navegarMesCalendarioTurnosCDM(1)">
                        Siguiente <i class="ri-arrow-right-s-line"></i>
                    </button>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="irAMesActualCalendarioCDM()">
                        Hoy
                    </button>
                </div>

                <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalDiaCalendarioYTurnoCDM('${fechaSeleccionadaCalendarioCDM || hoyISO}')">
                    <i class="ri-add-circle-line"></i> + Asignar Turno
                </button>
            </div>

            <div class="conventional-cal-weekdays">
                <div><span class="cal-wk-full">Lunes</span><span class="cal-wk-short">LUN</span></div>
                <div><span class="cal-wk-full">Martes</span><span class="cal-wk-short">MAR</span></div>
                <div><span class="cal-wk-full">Miércoles</span><span class="cal-wk-short">MIÉ</span></div>
                <div><span class="cal-wk-full">Jueves</span><span class="cal-wk-short">JUE</span></div>
                <div><span class="cal-wk-full">Viernes</span><span class="cal-wk-short">VIE</span></div>
                <div><span class="cal-wk-full">Sábado</span><span class="cal-wk-short">SÁB</span></div>
                <div><span class="cal-wk-full">Domingo</span><span class="cal-wk-short">DOM</span></div>
            </div>

            <div class="conventional-cal-grid">
                ${celdasHTML}
            </div>
        </div>
        ${resumenDiaSeleccionadoHTML}
    `;
}

// =========================================================================
// MODAL DEL DÍA DEL CALENDARIO: MUESTRA TURNOS + ÚLTIMA NOTA + FORMULARIO COMPLETO
// =========================================================================

function seleccionarHorarioChipEnModalDiaCDM(horaStr, btnEl) {
    const inp = document.getElementById("mdTurHora");
    if (inp) inp.value = horaStr;
    document.querySelectorAll("#gridChipsHorariosModalDia .hour-chip-btn").forEach(b => b.classList.remove("selected"));
    if (btnEl) btnEl.classList.add("selected");
}

function alEscribirNombrePacienteEnModalDiaCDM(valorInput) {
    const pacs = obtenerPacientesClinicosCDM();
    const limpio = String(valorInput || "").trim().toLowerCase();
    const encontrado = pacs.find(p =>
        `${p.apellido}, ${p.nombre}`.toLowerCase() === limpio ||
        `${p.nombre} ${p.apellido}`.toLowerCase() === limpio ||
        String(p.dni || "").toLowerCase() === limpio
    );

    const badgeEstado = document.getElementById("mdBadgeEstadoPaciente");
    if (encontrado) {
        document.getElementById("mdPacIdExistente").value = encontrado.id;
        document.getElementById("mdPacNombre").value = encontrado.nombre || "";
        document.getElementById("mdPacApellido").value = encontrado.apellido || "";
        document.getElementById("mdPacDni").value = encontrado.dni || "";
        document.getElementById("mdPacEdad").value = encontrado.edad || 32;
        document.getElementById("mdPacWhatsapp").value = encontrado.whatsapp || "5493584";
        document.getElementById("mdPacProfesion").value = encontrado.especialidad || "Quiropraxia";
        document.getElementById("mdPacMutual").value = encontrado.mutual || "Particular (Sin Mutual)";
        document.getElementById("mdPacAfiliado").value = encontrado.nroAfiliado || "";
        document.getElementById("mdPacSesionesAut").value = encontrado.sesionesAutorizadas || 0;
        document.getElementById("mdPacDiagnostico").value = encontrado.diagnostico || "";
        alEscribirMutualEnModalDiaCDM(encontrado.mutual);

        if (badgeEstado) {
            badgeEstado.className = "badge badge-ok";
            badgeEstado.innerText = `✓ Paciente Registrado (${encontrado.sesiones?.length || 0} sesiones en su histórico)`;
        }
    } else {
        document.getElementById("mdPacIdExistente").value = "";
        if (badgeEstado) {
            badgeEstado.className = "badge badge-celeste";
            badgeEstado.innerText = "✨ Paciente Nuevo (Se creará su ficha e histórico al guardar)";
        }
    }
}

function alEscribirMutualEnModalDiaCDM(nombreMutual) {
    const mutuales = obtenerConfigMutualesCDM();
    const match = mutuales.find(m => m.nombre.toLowerCase() === String(nombreMutual || "").trim().toLowerCase());
    const inpArancel = document.getElementById("mdMutualArancel");
    const inpCoseguro = document.getElementById("mdMutualCoseguro");
    const badgeMut = document.getElementById("mdBadgeEstadoMutual");

    if (match) {
        if (inpArancel) inpArancel.value = match.arancelMutual || 0;
        if (inpCoseguro) inpCoseguro.value = match.coseguroPaciente || 0;
        if (badgeMut) {
            badgeMut.className = "badge badge-ok";
            badgeMut.innerText = "✓ En lista";
        }
    } else if (String(nombreMutual || "").trim().length > 1) {
        if (badgeMut) {
            badgeMut.className = "badge badge-purple";
            badgeMut.innerText = "➕ Se agregará a la lista";
        }
    }
}

function abrirModalDiaCalendarioYTurnoCDM(fechaISO, horaPre = "09:00", pacienteIdPre = null) {
    asegurarModalVideoEnPaginaActualCDM();
    const pacs = obtenerPacientesClinicosCDM();
    const mutuales = obtenerConfigMutualesCDM();
    const profesiones = obtenerEspecialidadesHabilitadasConsultorioCDM();
    const todosTurnos = obtenerTurnosAgendaCDM();

    const turnosDeEseDia = todosTurnos
        .filter(t => t.fecha === fechaISO && (especialidadFiltroConsultorioCDM === "TODAS" || t.especialidad === especialidadFiltroConsultorioCDM))
        .sort((a, b) => a.hora.localeCompare(b.hora));

    const horasOcupadas = turnosDeEseDia.map(t => t.hora);
    const horariosSugeridos = ["08:00", "08:45", "09:30", "10:15", "11:00", "11:45", "12:30", "15:00", "15:45", "16:30", "17:15", "18:00", "18:45", "19:30", "20:15"];
    const primeraHoraLibre = horariosSugeridos.find(h => !horasOcupadas.includes(h)) || horaPre;

    const pacPre = pacienteIdPre ? pacs.find(x => Number(x.id) === Number(pacienteIdPre)) : null;
    const profInicial = pacPre?.especialidad || (especialidadFiltroConsultorioCDM !== "TODAS" ? especialidadFiltroConsultorioCDM : (profesiones[0]?.clave || "Quiropraxia"));
    const mutualInicial = pacPre?.mutual || mutuales[0]?.nombre || "Particular (Sin Mutual)";
    const objMutualIni = mutuales.find(m => m.nombre === mutualInicial) || mutuales[0];

    const listaTurnosDiaHTML = turnosDeEseDia.length > 0 ? `
        <div style="background:var(--surface-subtle); border:1.5px solid var(--line-strong); border-radius:16px; padding:0.9rem 1rem; margin-bottom:1.1rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.65rem; flex-wrap:wrap; gap:0.4rem;">
                <strong style="font-size:0.84rem; color:var(--ink-900); text-transform:uppercase;">
                    📋 Turnos del Día ${fechaISO} (${turnosDeEseDia.length})
                </strong>
                <small style="color:var(--ink-500);">Tocá "✍️ Anotar Sesión" para cargar la nota de hoy en el histórico del paciente</small>
            </div>
            <div style="display:flex; flex-direction:column; gap:0.55rem;">
                ${turnosDeEseDia.map(t => {
                    const pObj = pacs.find(x => Number(x.id) === Number(t.pacienteId));
                    const ultNota = (pObj && Array.isArray(pObj.sesiones) && pObj.sesiones.length > 0)
                        ? pObj.sesiones[pObj.sesiones.length - 1]
                        : null;

                    return `
                        <div style="background:var(--surface-solid); border:1px solid var(--line-strong); border-left:4px solid var(--cdm-500); border-radius:12px; padding:0.65rem 0.85rem; display:flex; justify-content:space-between; align-items:center; gap:0.65rem; flex-wrap:wrap;">
                            <div style="flex:1; min-width:210px;">
                                <div>
                                    <span class="badge badge-celeste">🕒 ${t.hora} hs</span>
                                    <strong style="font-size:0.94rem; color:var(--ink-900); margin-left:6px; cursor:pointer;" onclick="abrirModalHistoriaClinicaPacienteCDM(${t.pacienteId})">${t.pacienteNombre}</strong>
                                    <small style="color:var(--ink-500); margin-left:4px;">(${t.especialidad} • ${t.mutual})</small>
                                </div>
                                ${ultNota ? `
                                    <div style="font-size:0.74rem; color:var(--ink-700); margin-top:4px; background:var(--cdm-50); padding:4px 8px; border-radius:6px;">
                                        <b>📓 Última Sesión (#${ultNota.numSesion}):</b> ${ultNota.zona} — <i>${ultNota.intervencion}</i>
                                    </div>
                                ` : ""}
                            </div>
                            <div style="display:flex; gap:0.3rem; flex-wrap:wrap; align-items:center;">
                                <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalRegistrarSesionYEvolucionCDM(${t.pacienteId}, ${t.id})">
                                    ✍️ Anotar Sesión
                                </button>
                                <button type="button" class="btn btn-secondary btn-sm" onclick="abrirModalHistoriaClinicaPacienteCDM(${t.pacienteId})">
                                    📓 Histórico (${pObj?.sesiones?.length || 0})
                                </button>
                                <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarRecordatorioTurnoWhatsAppCDM(${t.id})">
                                    <i class="ri-whatsapp-line"></i>
                                </button>
                                <button type="button" class="btn btn-danger btn-sm" onclick="eliminarTurnoAgendaCDM(${t.id}); abrirModalDiaCalendarioYTurnoCDM('${fechaISO}');">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>
        </div>
    ` : "";

    const modal = document.getElementById("modalVideoEjercicio");
    modal.innerHTML = `
        <div class="modal-window" style="max-width:760px;">
            <div class="modal-top">
                <div>
                    <span class="badge badge-celeste">AGENDA DEL DÍA + FICHA DEL PACIENTE</span>
                    <h3 style="color:var(--ink-900); margin-top:4px;">📅 Día Seleccionado: ${fechaISO}</h3>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalVideoEjercicio()">✕</button>
            </div>

            ${listaTurnosDiaHTML}

            <form onsubmit="guardarTurnoYPacienteCompletoDesdeModalDiaCDM(event)">
                <input type="hidden" id="mdPacIdExistente" value="${pacPre ? pacPre.id : ""}">

                <div style="background:var(--surface-solid); border:1.5px solid var(--line-celeste); border-radius:18px; padding:1rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
                        <h4 style="font-size:0.96rem; font-weight:800; color:var(--cdm-700); margin:0;">
                            ➕ Cargar Nuevo Turno en ${fechaISO}
                        </h4>
                        <span id="mdBadgeEstadoPaciente" class="badge ${pacPre ? "badge-ok" : "badge-celeste"}">
                            ${pacPre ? `✓ Paciente: ${pacPre.apellido}, ${pacPre.nombre}` : "✨ Paciente Nuevo o Existente"}
                        </span>
                    </div>

                    <label style="font-size:0.68rem; font-weight:800; color:var(--ink-500); text-transform:uppercase; display:block;">
                        1. Elegí el Horario del Turno
                    </label>
                    <div id="gridChipsHorariosModalDia" class="modal-hours-picker-grid">
                        ${horariosSugeridos.map(h => {
                            const ocupado = horasOcupadas.includes(h);
                            const sel = h === primeraHoraLibre;
                            return `
                                <button type="button"
                                    class="hour-chip-btn ${ocupado ? "occupied" : ""} ${sel ? "selected" : ""}"
                                    onclick="seleccionarHorarioChipEnModalDiaCDM('${h}', this)">
                                    ${ocupado ? "🔒 " : ""}${h}
                                </button>
                            `;
                        }).join("")}
                    </div>

                    <div class="grid-3" style="margin-bottom:0.85rem;">
                        <div class="field"><label>Fecha *</label><input type="date" id="mdTurFecha" required value="${fechaISO}"></div>
                        <div class="field"><label>Hora Exacta *</label><input type="time" id="mdTurHora" required value="${primeraHoraLibre}"></div>
                        <div class="field">
                            <label>Duración</label>
                            <select id="mdTurDuracion">
                                <option value="30 min">30 min</option>
                                <option value="45 min" selected>45 min</option>
                                <option value="60 min">60 min</option>
                            </select>
                        </div>
                    </div>

                    <div class="field" style="margin-bottom:0.8rem;">
                        <label>🔍 Buscar Paciente Existente (O dejá vacío para cargar uno nuevo abajo)</label>
                        <input type="text" id="mdBuscadorPacienteExistente" list="dlPacientesRegistradosConsultorio"
                               placeholder="Escribí Apellido o DNI para autocompletar si ya está registrado..."
                               value="${pacPre ? `${pacPre.apellido}, ${pacPre.nombre}` : ""}"
                               oninput="alEscribirNombrePacienteEnModalDiaCDM(this.value)">
                        <datalist id="dlPacientesRegistradosConsultorio">
                            ${pacs.map(p => `<option value="${p.apellido}, ${p.nombre}">${p.especialidad} • ${p.mutual} • DNI ${p.dni}</option>`).join("")}
                        </datalist>
                    </div>

                    <div class="grid-4" style="margin-bottom:0.75rem;">
                        <div class="field"><label>Nombre *</label><input type="text" id="mdPacNombre" required placeholder="Ej: Lucía" value="${(pacPre?.nombre || "").replace(/"/g, "&quot;")}"></div>
                        <div class="field"><label>Apellido *</label><input type="text" id="mdPacApellido" required placeholder="Ej: Torres" value="${(pacPre?.apellido || "").replace(/"/g, "&quot;")}"></div>
                        <div class="field"><label>DNI *</label><input type="text" id="mdPacDni" required placeholder="36.123.456" value="${(pacPre?.dni || "").replace(/"/g, "&quot;")}"></div>
                        <div class="field"><label>Edad</label><input type="number" id="mdPacEdad" value="${pacPre?.edad || 32}"></div>
                    </div>

                    <div class="grid-3" style="margin-bottom:0.75rem;">
                        <div class="field"><label>WhatsApp *</label><input type="text" id="mdPacWhatsapp" required value="${(pacPre?.whatsapp || "5493584").replace(/"/g, "&quot;")}"></div>
                        <div class="field">
                            <label>Profesión * (Elegí o escribí)</label>
                            <input type="text" id="mdPacProfesion" list="dlProfesionesConsultorio" required value="${profInicial.replace(/"/g, "&quot;")}">
                            <datalist id="dlProfesionesConsultorio">
                                ${profesiones.map(pr => `<option value="${pr.clave}">${pr.icono} ${pr.titulo}</option>`).join("")}
                            </datalist>
                        </div>
                        <div class="field">
                            <label style="display:flex; justify-content:space-between;">
                                <span>Mutual * (Escribí o elegí)</span>
                                <small id="mdBadgeEstadoMutual" style="color:var(--ok-ink); font-weight:800;">✓ En lista</small>
                            </label>
                            <input type="text" id="mdPacMutual" list="dlMutualesConsultorio" required
                                   value="${mutualInicial.replace(/"/g, "&quot;")}"
                                   oninput="alEscribirMutualEnModalDiaCDM(this.value)">
                            <datalist id="dlMutualesConsultorio">
                                ${mutuales.map(m => `<option value="${m.nombre}">Cubre $${m.arancelMutual} • Coseguro $${m.coseguroPaciente}</option>`).join("")}
                            </datalist>
                        </div>
                    </div>

                    <div class="grid-4" style="margin-bottom:0.75rem;">
                        <div class="field"><label>N° Afiliado</label><input type="text" id="mdPacAfiliado" value="${(pacPre?.nroAfiliado || "").replace(/"/g, "&quot;")}"></div>
                        <div class="field"><label>Sesiones Autoriz.</label><input type="number" id="mdPacSesionesAut" min="0" value="${pacPre?.sesionesAutorizadas || 0}"></div>
                        <div class="field"><label>Cubre Mutual ($)</label><input type="number" id="mdMutualArancel" min="0" value="${objMutualIni?.arancelMutual || 0}"></div>
                        <div class="field"><label>Coseguro ($)</label><input type="number" id="mdMutualCoseguro" min="0" value="${objMutualIni?.coseguroPaciente || 18000}"></div>
                    </div>

                    <div class="grid-2" style="margin-bottom:0.85rem;">
                        <div class="field"><label>Diagnóstico / Antecedentes del Paciente *</label><input type="text" id="mdPacDiagnostico" required placeholder="Ej: Cervicalgia / Rehab LCA..." value="${(pacPre?.diagnostico || "").replace(/"/g, "&quot;")}"></div>
                        <div class="field"><label>Motivo del Turno / Nota Inicial para esta Sesión *</label><input type="text" id="mdTurMotivo" required value="Sesión y evaluación clínica"></div>
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                        <button type="button" class="btn btn-ghost" onclick="cerrarModalVideoEjercicio()">Cerrar</button>
                        <button type="submit" class="btn btn-primary">
                            <i class="ri-calendar-check-line"></i> Guardar Turno y Paciente
                        </button>
                    </div>
                </div>
            </form>
        </div>
    `;
    modal.classList.remove("hidden");
}

abrirModalNuevoTurnoConsultorioCDM = abrirModalDiaCalendarioYTurnoCDM;

function guardarTurnoYPacienteCompletoDesdeModalDiaCDM(e) {
    e.preventDefault();
    const fecha = document.getElementById("mdTurFecha").value || obtenerHoyISO();
    const hora = document.getElementById("mdTurHora").value || "09:00";
    const duracion = document.getElementById("mdTurDuracion").value || "45 min";
    const motivoTurno = document.getElementById("mdTurMotivo").value.trim() || "Sesión clínica";

    const idExistente = document.getElementById("mdPacIdExistente").value;
    const nombre = document.getElementById("mdPacNombre").value.trim();
    const apellido = document.getElementById("mdPacApellido").value.trim();
    const dni = document.getElementById("mdPacDni").value.trim();
    const edad = parseInt(document.getElementById("mdPacEdad").value) || 32;
    const whatsapp = document.getElementById("mdPacWhatsapp").value.trim();
    const profesionCanon = asegurarProfesionEnCatalogoCDM(document.getElementById("mdPacProfesion").value.trim());
    const arancelInput = parseFloat(document.getElementById("mdMutualArancel").value) || 0;
    const coseguroInput = parseFloat(document.getElementById("mdMutualCoseguro").value) || 0;
    const mutualCanonObj = asegurarMutualEnCatalogoCDM(document.getElementById("mdPacMutual").value.trim(), arancelInput, coseguroInput);
    const nroAfiliado = document.getElementById("mdPacAfiliado").value.trim() || "Particular";
    const sesionesAut = parseInt(document.getElementById("mdPacSesionesAut").value) || 0;
    const diagnostico = document.getElementById("mdPacDiagnostico").value.trim();

    const pacs = obtenerPacientesClinicosCDM();
    let pacienteFinal = null;

    if (idExistente) {
        const idx = pacs.findIndex(x => Number(x.id) === Number(idExistente));
        if (idx >= 0) {
            pacs[idx] = { ...pacs[idx], nombre, apellido, dni, edad, whatsapp, especialidad: profesionCanon, mutual: mutualCanonObj.nombre, nroAfiliado, sesionesAutorizadas: sesionesAut, diagnostico };
            pacienteFinal = pacs[idx];
        }
    }

    if (!pacienteFinal) {
        pacienteFinal = {
            id: Date.now() - 5,
            codigoAcceso: `PAC-${Math.floor(100 + Math.random() * 899)}`,
            nombre, apellido, dni, edad, whatsapp,
            especialidad: profesionCanon,
            mutual: mutualCanonObj.nombre,
            nroAfiliado, diagnostico,
            sesionesAutorizadas: sesionesAut,
            sesionesRealizadas: 0,
            sesiones: []
        };
        pacs.unshift(pacienteFinal);
    }
    guardarPacientesClinicosCDM(pacs);

    const turnos = obtenerTurnosAgendaCDM();
    turnos.push({
        id: Date.now(),
        fecha, hora, duracion,
        pacienteId: pacienteFinal.id,
        pacienteNombre: `${pacienteFinal.apellido}, ${pacienteFinal.nombre}`,
        especialidad: profesionCanon,
        mutual: mutualCanonObj.nombre,
        motivo: motivoTurno,
        estado: "Reservado",
        pagado: false,
        montoTotal: arancelInput + coseguroInput
    });
    guardarTurnosAgendaCDM(turnos);

    fechaSeleccionadaCalendarioCDM = fecha;
    const [yy, mm] = fecha.split("-").map(Number);
    if (yy && mm) {
        anioCalendarioVisualCDM = yy;
        mesCalendarioVisualCDM = mm - 1;
    }

    cerrarModalVideoEjercicio();
    renderizarModuloConsultorioCompletoCDM();
    mostrarToast(`📅 Turno agendado el ${fecha} (${hora} hs) para ${pacienteFinal.apellido}, ${pacienteFinal.nombre}.`);
}

// =========================================================================
// RENDERIZADOR PRINCIPAL DEL CONSULTORIO (CON HISTÓRICO CLARO DE SESIONES POR USUARIO)
// =========================================================================

function renderizarModuloConsultorioCompletoCDM() {
    asegurarEstilosCalendario30DiasEnDOM();
    const sec = document.getElementById("cdmSeccionConsultorioGlobal");
    if (!sec) return;

    const especialidadesHab = obtenerEspecialidadesHabilitadasConsultorioCDM();
    if (especialidadesHab.length === 1) {
        especialidadFiltroConsultorioCDM = especialidadesHab[0].clave;
    }

    const busqPac = (document.getElementById("inputBuscarPacienteClinico")?.value || "").toLowerCase().trim();
    const filtroMutualPac = document.getElementById("selectFiltroMutualPacientes")?.value || "TODAS";

    const todosPacientes = obtenerPacientesClinicosCDM();
    const todosTurnos = obtenerTurnosAgendaCDM();
    const todasOrdenes = obtenerOrdenesMutualPendientesCDM();
    const mutualesConfig = obtenerConfigMutualesCDM();

    const pacientesEsp = especialidadFiltroConsultorioCDM === "TODAS"
        ? todosPacientes
        : todosPacientes.filter(p => p.especialidad === especialidadFiltroConsultorioCDM);

    const turnosFiltradosEsp = especialidadFiltroConsultorioCDM === "TODAS"
        ? todosTurnos
        : todosTurnos.filter(t => t.especialidad === especialidadFiltroConsultorioCDM);

    const prefijoMesActual = `${anioCalendarioVisualCDM}-${String(mesCalendarioVisualCDM + 1).padStart(2, "0")}`;
    const turnosDelMes = turnosFiltradosEsp.filter(t => String(t.fecha || "").startsWith(prefijoMesActual));

    const ordenesPendientes = todasOrdenes.filter(o => o.estado === "Pendiente");
    const totalPendienteMutuales = ordenesPendientes.reduce((acc, o) => acc + Number(o.montoMutual || 0), 0);
    const totalLiquidadoMutuales = todasOrdenes.filter(o => o.estado === "Liquidada").reduce((acc, o) => acc + Number(o.montoMutual || 0), 0);

    const espActivaNombre = especialidadFiltroConsultorioCDM === "TODAS"
        ? (especialidadesHab.length === 1 ? especialidadesHab[0].clave : "Todas las Profesiones")
        : especialidadFiltroConsultorioCDM;

    sec.innerHTML = `
        <div class="clinic-specialty-bar">
            <div>
                <span class="badge badge-celeste" style="background:rgba(255,255,255,0.18); color:#fff; border-color:rgba(255,255,255,0.3);">
                    🏥 CONSULTORIO PROFESIONAL E HISTÓRICO POR SESIÓN
                </span>
                <h3 style="font-size:1.12rem; font-weight:800; color:#ffffff; margin-top:4px;">
                    Especialidad: ${espActivaNombre}
                </h3>
            </div>
            <div style="display:flex; gap:0.35rem; flex-wrap:wrap; align-items:center;">
                ${especialidadesHab.length > 1 ? `
                    <button type="button" class="btn ${especialidadFiltroConsultorioCDM === "TODAS" ? "btn-primary" : "btn-ghost"} btn-sm" onclick="cambiarEspecialidadFiltroConsultorioCDM('TODAS')">
                        🏢 Todas
                    </button>
                ` : ""}
                ${especialidadesHab.map(e => `
                    <button type="button" class="btn ${especialidadFiltroConsultorioCDM === e.clave ? "btn-primary" : "btn-ghost"} btn-sm" onclick="cambiarEspecialidadFiltroConsultorioCDM('${e.clave}')">
                        ${e.icono} ${e.clave}
                    </button>
                `).join("")}
                <button type="button" class="btn btn-secondary btn-sm" onclick="agregarNuevaProfesionPromptCDM()">
                    ➕ Profesión
                </button>
            </div>
        </div>

        <div class="bento-kpis">
            <div class="bento-kpi">
                <div class="kpi-icon"><i class="ri-calendar-check-line"></i></div>
                <div class="kpi-data">
                    <span>Turnos del Mes (${prefijoMesActual})</span>
                    <strong>${turnosDelMes.length} turnos (${turnosDelMes.filter(t => t.estado === "Atendido").length} atendidos)</strong>
                </div>
            </div>
            <div class="bento-kpi" style="cursor:pointer;" onclick="cambiarSubTabConsultorioCDM('pacientes')">
                <div class="kpi-icon ok"><i class="ri-book-read-line"></i></div>
                <div class="kpi-data">
                    <span>Pacientes e Histórico de Sesiones</span>
                    <strong>${pacientesEsp.length} pacientes activos</strong>
                </div>
            </div>
            <div class="bento-kpi" style="cursor:pointer;" onclick="cambiarSubTabConsultorioCDM('mutuales')">
                <div class="kpi-icon warn"><i class="ri-hospital-line"></i></div>
                <div class="kpi-data">
                    <span>Por Cobrar a Mutuales (${ordenesPendientes.length} órdenes)</span>
                    <strong style="color:var(--warn-ink);">$${totalPendienteMutuales.toLocaleString("es-AR")}</strong>
                </div>
            </div>
            <div class="bento-kpi" style="cursor:pointer;" onclick="abrirModuloContabilidadIndependienteCDM()">
                <div class="kpi-icon purple"><i class="ri-wallet-3-line"></i></div>
                <div class="kpi-data">
                    <span>Mutuales Liquidadas en Caja</span>
                    <strong>$${totalLiquidadoMutuales.toLocaleString("es-AR")} (Ver Caja →)</strong>
                </div>
            </div>
        </div>

        <div class="module-tabs">
            <button type="button" class="mod-tab ${tabActivaConsultorioCDM === "agenda" ? "active" : ""}" onclick="cambiarSubTabConsultorioCDM('agenda')">
                <i class="ri-calendar-2-line"></i><span>1. Calendario de 30 Días (${turnosDelMes.length})</span>
            </button>
            <button type="button" class="mod-tab ${tabActivaConsultorioCDM === "pacientes" ? "active" : ""}" onclick="cambiarSubTabConsultorioCDM('pacientes')">
                <i class="ri-book-open-line"></i><span>2. Pacientes e Histórico por Sesión (${pacientesEsp.length})</span>
            </button>
            <button type="button" class="mod-tab ${tabActivaConsultorioCDM === "mutuales" ? "active" : ""}" onclick="cambiarSubTabConsultorioCDM('mutuales')">
                <i class="ri-hospital-line"></i><span>3. Mutuales, Profesiones y Liquidación</span>
            </button>
        </div>

        <div id="contenedorCuerpoConsultorioCDM"></div>
    `;

    const bodyCli = document.getElementById("contenedorCuerpoConsultorioCDM");
    if (!bodyCli) return;

    if (tabActivaConsultorioCDM === "agenda") {
        bodyCli.innerHTML = generarCalendarioConvencional30DiasHTML(turnosFiltradosEsp);
    }

    // ---------------------------------------------------------------------
    // PESTAÑA 2: TARJETAS CLARAS DE PACIENTES CON HISTÓRICO DE NOTAS POR SESIÓN A LA VISTA
    // ---------------------------------------------------------------------
    else if (tabActivaConsultorioCDM === "pacientes") {
        let pacsFiltrados = [...pacientesEsp];
        if (filtroMutualPac !== "TODAS") {
            pacsFiltrados = pacsFiltrados.filter(p => p.mutual === filtroMutualPac);
        }
        if (busqPac) {
            pacsFiltrados = pacsFiltrados.filter(p =>
                p.nombre.toLowerCase().includes(busqPac) ||
                p.apellido.toLowerCase().includes(busqPac) ||
                (p.dni || "").includes(busqPac) ||
                (p.diagnostico || "").toLowerCase().includes(busqPac) ||
                (p.sesiones || []).some(s => (s.zona || "").toLowerCase().includes(busqPac) || (s.intervencion || "").toLowerCase().includes(busqPac))
            );
        }

        const espDefaultAlta = especialidadFiltroConsultorioCDM === "TODAS" ? especialidadesHab[0].clave : especialidadFiltroConsultorioCDM;

        const tarjetasPacientesHTML = pacsFiltrados.length ? pacsFiltrados.map(p => {
            const sesionesOrdenadas = [...(p.sesiones || [])].sort((a, b) => b.numSesion - a.numSesion || new Date(b.fecha) - new Date(a.fecha));
            const ultimas3Sesiones = sesionesOrdenadas.slice(0, 3);

            const listaSesionesCardHTML = ultimas3Sesiones.length > 0 ? ultimas3Sesiones.map(s => {
                const evaCls = s.dolorEVA <= 3 ? "eva-low" : (s.dolorEVA <= 6 ? "eva-mid" : "eva-high");
                return `
                    <div class="session-mini-log-item">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem; flex-wrap:wrap; margin-bottom:3px;">
                            <strong style="color:var(--cdm-600);">📌 SESIÓN #${s.numSesion} — ${s.fecha}</strong>
                            <div style="display:flex; gap:0.3rem; align-items:center;">
                                <span class="eva-pain-pill ${evaCls}" style="font-size:0.64rem; padding:1px 6px;">EVA ${s.dolorEVA}/10 • Avance ${s.evolucionPct}%</span>
                                <button type="button" class="btn btn-ghost btn-sm" style="min-height:22px; padding:0 6px; font-size:0.65rem;" onclick="editarNotaSesionExistentePromptCDM(${p.id}, ${s.id})" title="Editar nota de esta sesión">✏️</button>
                            </div>
                        </div>
                        <div style="color:var(--ink-900); font-weight:600;">🔍 <b>Evaluación/Zona:</b> ${s.zona}</div>
                        <div style="color:var(--ink-700); margin-top:2px;">📝 <b>Nota de Sesión:</b> ${s.intervencion}</div>
                    </div>
                `;
            }).join("") : `<div style="font-size:0.78rem; color:var(--ink-400); text-align:center; padding:0.6rem;">Aún no tiene sesiones anotadas. Tocá "✍️ + Anotar Nueva Sesión" abajo.</div>`;

            return `
                <div class="patient-history-pro-card">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.75rem; flex-wrap:wrap;">
                        <div>
                            <div style="display:flex; gap:0.35rem; flex-wrap:wrap; margin-bottom:0.3rem;">
                                <span class="badge badge-celeste">${p.especialidad}</span>
                                <span class="badge badge-purple">🏥 ${p.mutual} (Afil: ${p.nroAfiliado || "-"})</span>
                                <span class="badge badge-ok">📓 ${sesionesOrdenadas.length}${p.sesionesAutorizadas > 0 ? "/" + p.sesionesAutorizadas : ""} sesiones</span>
                            </div>
                            <h4 style="font-size:1.12rem; font-weight:800; color:var(--ink-900); margin:0;">
                                ${p.apellido}, ${p.nombre} <small style="font-size:0.78rem; color:var(--ink-500); font-weight:600;">(${p.edad || 30} años • DNI ${p.dni})</small>
                            </h4>
                        </div>
                        <div style="display:flex; gap:0.25rem;">
                            <button type="button" class="btn btn-ghost btn-sm" onclick="abrirModalNuevoPacienteClinicoCDM(${p.id})" title="Editar datos del paciente">✏️</button>
                            <button type="button" class="btn btn-danger btn-sm" onclick="eliminarPacienteClinicoCDM(${p.id})" title="Eliminar paciente">🗑️</button>
                        </div>
                    </div>

                    <div style="background:var(--cdm-50); border:1px solid var(--line-celeste); border-radius:10px; padding:0.5rem 0.75rem; font-size:0.78rem; color:var(--ink-900);">
                        <b>🩺 Diagnóstico / Motivo Base:</b> ${p.diagnostico || "Sin especificar"}
                    </div>

                    <!-- HISTÓRICO DE SESIONES Y NOTAS DIRECTAMENTE VISIBLE -->
                    <div class="patient-recent-notes-box">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <strong style="font-size:0.74rem; text-transform:uppercase; color:var(--ink-700); letter-spacing:0.03em;">
                                📓 Histórico de Notas por Sesión (Últimas ${ultimas3Sesiones.length} de ${sesionesOrdenadas.length})
                            </strong>
                            ${sesionesOrdenadas.length > 3 ? `<small style="color:var(--cdm-600); font-weight:700; cursor:pointer;" onclick="abrirModalHistoriaClinicaPacienteCDM(${p.id})">Ver las ${sesionesOrdenadas.length} sesiones →</small>` : ""}
                        </div>
                        ${listaSesionesCardHTML}
                    </div>

                    <div style="display:flex; gap:0.4rem; flex-wrap:wrap; margin-top:auto; padding-top:0.25rem;">
                        <button type="button" class="btn btn-primary btn-sm" style="flex:1;" onclick="abrirModalRegistrarSesionYEvolucionCDM(${p.id}, null)">
                            ✍️ + Anotar Nueva Sesión
                        </button>
                        <button type="button" class="btn btn-secondary btn-sm" style="flex:1;" onclick="abrirModalHistoriaClinicaPacienteCDM(${p.id})">
                            📓 Ver Histórico Completo (${sesionesOrdenadas.length})
                        </button>
                        <button type="button" class="btn btn-ghost btn-sm" onclick="abrirModalDiaCalendarioYTurnoCDM('${obtenerHoyISO()}', '09:00', ${p.id})" title="Agendar próximo turno">
                            📅 Turno
                        </button>
                    </div>
                </div>
            `;
        }).join("") : `<div class="empty-box" style="grid-column:1/-1;">No se encontraron pacientes con ese criterio.</div>`;

        bodyCli.innerHTML = `
            <div class="app-panel">
                <div class="panel-head">
                    <div>
                        <h3><i class="ri-book-open-line"></i> Cuaderno Histórico de Sesiones y Notas por Paciente (${espActivaNombre})</h3>
                        <small style="color:var(--ink-500);">En cada tarjeta ves las notas anotadas sesión por sesión, podés agregar una nueva sesión en 1 clic o editar cualquier nota anterior.</small>
                    </div>
                    <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalNuevoPacienteClinicoCDM(null, '${espDefaultAlta}')">
                        <i class="ri-user-add-line"></i> + Nuevo Paciente
                    </button>
                </div>

                <div class="filter-strip" style="grid-template-columns: 1fr auto; margin-bottom:1.15rem;">
                    <div class="search-box">
                        <i class="ri-search-line"></i>
                        <input type="text" id="inputBuscarPacienteClinico" placeholder="Buscar por paciente, DNI, diagnóstico o palabra escrita en una sesión..." value="${busqPac.replace(/"/g, "&quot;")}" oninput="renderizarModuloConsultorioCompletoCDM()">
                    </div>
                    <select id="selectFiltroMutualPacientes" onchange="renderizarModuloConsultorioCompletoCDM()" style="width:auto;">
                        <option value="TODAS" ${filtroMutualPac === "TODAS" ? "selected" : ""}>🏥 Todas las Mutuales / Particulares</option>
                        ${mutualesConfig.map(m => `<option value="${m.nombre}" ${filtroMutualPac === m.nombre ? "selected" : ""}>${m.nombre}</option>`).join("")}
                    </select>
                </div>

                <div class="patients-history-cards-grid">
                    ${tarjetasPacientesHTML}
                </div>
            </div>
        `;
    }

    // ---------------------------------------------------------------------
    // PESTAÑA 3: SECTOR DE MUTUALES, PROFESIONES Y LIQUIDACIÓN A CAJA
    // ---------------------------------------------------------------------
    else {
        bodyCli.innerHTML = `
            <div class="app-panel" style="margin-bottom:1.25rem;">
                <div class="panel-head" style="margin-bottom:0.75rem; padding-bottom:0.65rem;">
                    <div>
                        <h3><i class="ri-user-star-line"></i> Catálogo de Profesiones y Especialidades Habilitadas</h3>
                        <small style="color:var(--ink-500);">El modal del calendario absorbe estas profesiones y también agrega automáticamente cualquier otra que escribas.</small>
                    </div>
                    <button type="button" class="btn btn-primary btn-sm" onclick="agregarNuevaProfesionPromptCDM()">
                        + Agregar Nueva Profesión
                    </button>
                </div>
                <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                    ${especialidadesHab.map(e => `<span class="badge badge-celeste" style="font-size:0.82rem; padding:0.42rem 0.9rem;">${e.icono} ${e.clave}</span>`).join("")}
                </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem;">
                <div>
                    <h4 style="font-size:0.98rem; font-weight:800; color:var(--ink-900); margin:0;">🏥 Catálogo de Mutuales y Obras Sociales</h4>
                    <small style="color:var(--ink-500);">Podés cargar mutuales acá o escribirlas directo al crear un turno.</small>
                </div>
                <button type="button" class="btn btn-primary btn-sm" onclick="agregarNuevaMutualConvenioPromptCDM()">
                    + Agregar Obra Social / Mutual
                </button>
            </div>

            <div class="mutual-card-grid">
                ${mutualesConfig.map(m => `
                    <div class="mutual-convenio-card">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <strong style="font-size:0.95rem; color:var(--ink-900);">🏥 ${m.nombre}</strong>
                            <div style="display:flex; gap:0.25rem;">
                                <button type="button" class="btn btn-ghost btn-sm" style="min-height:26px; padding:0.15rem 0.45rem;" onclick="editarArancelMutualPromptCDM(${m.id})">✏️</button>
                                ${!m.esParticular ? `<button type="button" class="btn btn-danger btn-sm" style="min-height:26px; padding:0.15rem 0.45rem;" onclick="eliminarMutualConvenioCDM(${m.id})">🗑️</button>` : ""}
                            </div>
                        </div>
                        <div style="font-size:0.78rem; color:var(--ink-700); display:flex; flex-direction:column; gap:0.2rem;">
                            <div>Cubre la Mutual: <b style="color:var(--cdm-600);">$${Number(m.arancelMutual || 0).toLocaleString("es-AR")}</b></div>
                            <div>Coseguro / Particular: <b style="color:var(--ok-ink);">$${Number(m.coseguroPaciente || 0).toLocaleString("es-AR")}</b></div>
                            <div style="padding-top:4px; border-top:1px dashed var(--line-strong);">Total por Sesión: <b>$${(Number(m.arancelMutual || 0) + Number(m.coseguroPaciente || 0)).toLocaleString("es-AR")}</b></div>
                        </div>
                    </div>
                `).join("")}
            </div>

            <div class="app-panel">
                <div class="panel-head">
                    <div>
                        <h3><i class="ri-bank-line"></i> Liquidación de Órdenes de Mutuales a Contabilidad y Caja</h3>
                        <small style="color:var(--ink-500);">Tocá <b>"🏦 Liquidar a Banco"</b> para transferir el pago de la mutual al Libro Mayor de Finanzas.</small>
                    </div>
                    ${ordenesPendientes.length > 0 ? `
                        <button type="button" class="btn btn-primary btn-sm" onclick="liquidarTodasLasOrdenesMutualesAlBancoCDM()">
                            <i class="ri-check-double-line"></i> 🏦 Liquidar Todas ($${totalPendienteMutuales.toLocaleString("es-AR")})
                        </button>
                    ` : ""}
                </div>

                <div class="table-wrap">
                    <table class="app-table">
                        <thead>
                            <tr><th>Fecha</th><th>Mutual</th><th>Paciente</th><th>N° Orden</th><th>Coseguro</th><th>Monto Mutual</th><th>Estado</th><th>Acción</th></tr>
                        </thead>
                        <tbody>
                            ${todasOrdenes.length ? todasOrdenes.map(o => {
                                const liq = o.estado === "Liquidada";
                                return `
                                    <tr>
                                        <td data-label="Fecha"><b>${o.fecha}</b></td>
                                        <td data-label="Mutual"><span class="badge badge-purple">${o.mutual}</span></td>
                                        <td data-label="Paciente"><strong>${o.pacienteNombre}</strong><br><small>Afil: ${o.nroAfiliado || "-"}</small></td>
                                        <td data-label="N° Orden"><b>${o.nroOrden || "S/N"}</b></td>
                                        <td data-label="Coseguro"><span style="color:var(--ok-ink); font-weight:700;">$${Number(o.coseguroCobrado || 0).toLocaleString("es-AR")}</span></td>
                                        <td data-label="Monto Mutual"><strong>$${Number(o.montoMutual || 0).toLocaleString("es-AR")}</strong></td>
                                        <td data-label="Estado"><span class="badge ${liq ? "badge-ok" : "badge-warn"}">${liq ? "✓ LIQUIDADA" : "⏳ PENDIENTE"}</span></td>
                                        <td data-label="Acción">
                                            <div style="display:flex; gap:0.3rem; justify-content:flex-end;">
                                                ${!liq ? `<button type="button" class="btn btn-primary btn-sm" onclick="liquidarOrdenIndividualMutualABancoCDM(${o.id})">🏦 Liquidar</button>` : ""}
                                                <button type="button" class="btn btn-danger btn-sm" onclick="eliminarOrdenMutualCDM(${o.id})">🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join("") : `<tr><td colspan="8"><div class="empty-box">Sin órdenes de mutuales registradas.</div></td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
}

// =========================================================================
// CUADERNO HISTÓRICO DE NOTAS POR SESIÓN (VER, AGREGAR Y EDITAR CADA NOTA)
// =========================================================================

function editarNotaSesionExistentePromptCDM(pacienteId, sesionId) {
    const pacs = obtenerPacientesClinicosCDM();
    const p = pacs.find(x => Number(x.id) === Number(pacienteId));
    if (!p || !Array.isArray(p.sesiones)) return;
    const s = p.sesiones.find(x => Number(x.id) === Number(sesionId));
    if (!s) return;

    const nuevaZona = prompt(`✏️ Editar Evaluación / Zona trabajada en Sesión #${s.numSesion} (${s.fecha}):`, s.zona);
    if (nuevaZona === null) return;
    const nuevaInterv = prompt(`📝 Editar Nota de la Sesión #${s.numSesion}:`, s.intervencion);
    if (nuevaInterv === null) return;
    const nuevoEVA = prompt(`📊 Dolor / Malestar EVA (0 a 10):`, s.dolorEVA);

    s.zona = nuevaZona.trim() || s.zona;
    s.intervencion = nuevaInterv.trim() || s.intervencion;
    if (nuevoEVA !== null && !isNaN(parseInt(nuevoEVA))) {
        s.dolorEVA = Math.max(0, Math.min(10, parseInt(nuevoEVA)));
    }

    guardarPacientesClinicosCDM(pacs);
    if (!document.getElementById("modalVideoEjercicio")?.classList.contains("hidden")) {
        abrirModalHistoriaClinicaPacienteCDM(p.id);
    }
    renderizarModuloConsultorioCompletoCDM();
    mostrarToast(`✏️ Nota de la Sesión #${s.numSesion} actualizada.`);
}

function enviarHistorialClinicoWhatsAppCDM(pacienteId) {
    const p = obtenerPacientesClinicosCDM().find(x => Number(x.id) === Number(pacienteId));
    if (!p) return;
    const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
    let msg = `📓 *RESUMEN DE HISTORIA CLÍNICA — ${(lic.nombreEntidad || "CONSULTORIO").toUpperCase()}*\n`;
    msg += `👤 *Paciente:* ${p.apellido}, ${p.nombre} (DNI ${p.dni})\n`;
    msg += `🩺 *Especialidad:* ${p.especialidad} • *Cobertura:* ${p.mutual}\n`;
    msg += `📋 *Diagnóstico:* ${p.diagnostico}\n`;
    msg += `----------------------------------\n`;
    (p.sesiones || []).forEach(s => {
        msg += `📌 *Sesión #${s.numSesion} (${s.fecha}):*\n`;
        msg += `   • Evaluación: ${s.zona}\n`;
        msg += `   • Nota: ${s.intervencion}\n`;
        msg += `   • EVA: ${s.dolorEVA}/10 | Avance: ${s.evolucionPct}%\n\n`;
    });
    window.open(`https://wa.me/${p.whatsapp || ""}?text=${encodeURIComponent(msg)}`, "_blank");
}

function abrirModalHistoriaClinicaPacienteCDM(pacienteId) {
    const pacs = obtenerPacientesClinicosCDM();
    const p = pacs.find(x => Number(x.id) === Number(pacienteId));
    if (!p) return;
    asegurarModalVideoEnPaginaActualCDM();

    const sesiones = [...(p.sesiones || [])].sort((a, b) => b.numSesion - a.numSesion || new Date(b.fecha) - new Date(a.fecha));
    const modal = document.getElementById("modalVideoEjercicio");

    modal.innerHTML = `
        <div class="modal-window" style="max-width:800px;">
            <div class="modal-top">
                <div>
                    <span class="badge badge-celeste">CUADERNO HISTÓRICO DE SESIONES • ${p.especialidad.toUpperCase()}</span>
                    <h3 style="color:var(--ink-900); margin-top:4px;">📓 ${p.apellido}, ${p.nombre} (${p.edad || 30} años • DNI ${p.dni})</h3>
                </div>
                <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
                    <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalRegistrarSesionYEvolucionCDM(${p.id}, null)">
                        ✍️ + Anotar Nueva Sesión
                    </button>
                    <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarHistorialClinicoWhatsAppCDM(${p.id})">
                        <i class="ri-whatsapp-line"></i> WA
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="window.print()">
                        <i class="ri-printer-line"></i> PDF
                    </button>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalVideoEjercicio()">✕</button>
                </div>
            </div>

            <div style="background:var(--surface-subtle); border:1px solid var(--line-strong); border-radius:14px; padding:0.85rem 1rem; margin-bottom:1rem; font-size:0.82rem; display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:0.65rem;">
                <div><small style="color:var(--ink-500); display:block;">PROFESIÓN</small><strong>${p.especialidad}</strong></div>
                <div><small style="color:var(--ink-500); display:block;">MUTUAL / AFILIADO</small><strong>${p.mutual} (${p.nroAfiliado || "-"})</strong></div>
                <div><small style="color:var(--ink-500); display:block;">SESIONES REGISTRADAS</small><strong>${sesiones.length}${p.sesionesAutorizadas > 0 ? " de " + p.sesionesAutorizadas + " autorizadas" : " sesiones"}</strong></div>
                <div style="grid-column:1/-1; border-top:1px dashed var(--line-strong); padding-top:0.45rem;">
                    <small style="color:var(--ink-500);">DIAGNÓSTICO / MOTIVO INICIAL:</small>
                    <div style="font-weight:700; color:var(--ink-900);">${p.diagnostico}</div>
                </div>
            </div>

            <!-- CURVA DE EVOLUCIÓN CLÍNICA -->
            <div class="app-panel" style="padding:0.95rem; margin-bottom:1rem;">
                <h4 style="font-size:0.86rem; font-weight:800; color:var(--ink-900); margin-bottom:0.45rem;">
                    📈 Curva Histórica de Evolución (Dolor EVA 0-10 vs. Recuperación %)
                </h4>
                <div class="chart-canvas-box" style="height:195px;">
                    <canvas id="canvasEvolucionClinicaPaciente"></canvas>
                </div>
            </div>

            <!-- BITÁCORA NUMERADA DE NOTAS POR CADA SESIÓN -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.65rem; flex-wrap:wrap; gap:0.5rem;">
                <h4 style="font-size:0.94rem; font-weight:800; color:var(--ink-900); margin:0;">
                    📑 Histórico Detallado Sesión por Sesión (${sesiones.length})
                </h4>
                <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalRegistrarSesionYEvolucionCDM(${p.id}, null)">
                    + Agregar Nota de Sesión #${sesiones.length + 1}
                </button>
            </div>

            <div class="clinical-session-timeline">
                ${sesiones.length ? sesiones.map(s => {
                    const evaCls = s.dolorEVA <= 3 ? "eva-low" : (s.dolorEVA <= 6 ? "eva-mid" : "eva-high");
                    return `
                        <div class="clinical-note-card">
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
                                <div class="clinical-metrics-strip">
                                    <span class="badge badge-celeste" style="font-size:0.76rem; font-weight:800;">📌 SESIÓN #${s.numSesion}</span>
                                    <span class="badge badge-purple">📅 ${s.fecha}</span>
                                    <span class="eva-pain-pill ${evaCls}">Dolor EVA: ${s.dolorEVA}/10</span>
                                    <span class="badge badge-ok">Avance: ${s.evolucionPct}%</span>
                                </div>
                                <div style="display:flex; gap:0.3rem;">
                                    <button type="button" class="btn btn-secondary btn-sm" style="min-height:26px; padding:0.1rem 0.55rem; font-size:0.7rem;" onclick="editarNotaSesionExistentePromptCDM(${p.id}, ${s.id})">
                                        ✏️ Editar Nota
                                    </button>
                                    <button type="button" class="btn btn-danger btn-sm" style="min-height:26px; padding:0.1rem 0.5rem;" onclick="eliminarNotaSesionPacienteCDM(${p.id}, ${s.id})">
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            <div style="background:var(--surface-solid); border:1px solid var(--line-strong); border-radius:10px; padding:0.65rem 0.85rem; margin-top:0.2rem;">
                                <div style="font-size:0.84rem; color:var(--ink-900); margin-bottom:0.3rem;">
                                    <b>🔍 Zona / Evaluación de la Sesión:</b> ${s.zona}
                                </div>
                                <div style="font-size:0.84rem; color:var(--ink-700);">
                                    <b>📝 Nota Clínica / Qué se realizó:</b> ${s.intervencion}
                                </div>
                            </div>

                            <small style="color:var(--ink-500); font-size:0.72rem;">💳 ${s.cobroDetalle || "Sesión registrada"}</small>
                        </div>
                    `;
                }).join("") : `<div class="empty-box">Todavía no hay notas cargadas. Tocá "+ Agregar Nota de Sesión #1" arriba.</div>`}
            </div>
        </div>
    `;
    modal.classList.remove("hidden");

    setTimeout(() => dibujarGraficoEvolucionPacienteClinicoCDM(p), 60);
}

// Resto de funciones de soporte (Alta de paciente, Evolución, Mutuales y Liquidación)
function agregarNuevaProfesionPromptCDM() {
    const nueva = prompt("🩺 Escribí el nombre de la nueva Profesión / Especialidad (Ej: Osteopatía, Podología, Fonoaudiología, Masoterapia):");
    if (!nueva || !nueva.trim()) return;
    asegurarProfesionEnCatalogoCDM(nueva.trim());
    renderizarModuloConsultorioCompletoCDM();
}

function eliminarMutualConvenioCDM(idMutual) {
    if (!confirm("🗑️ ¿Quitar esta mutual del listado?")) return;
    guardarConfigMutualesCDM(obtenerConfigMutualesCDM().filter(x => Number(x.id) !== Number(idMutual)));
    renderizarModuloConsultorioCompletoCDM();
}

function abrirModalNuevoPacienteClinicoCDM(idEditar = null, especialidadPredefinida = null) {
    asegurarModalVideoEnPaginaActualCDM();
    const pacs = obtenerPacientesClinicosCDM();
    const p = idEditar ? pacs.find(x => Number(x.id) === Number(idEditar)) : null;
    const mutuales = obtenerConfigMutualesCDM();
    const especialidadesHab = obtenerEspecialidadesHabilitadasConsultorioCDM();
    const espSeleccionada = p?.especialidad || especialidadPredefinida || especialidadesHab[0]?.clave || "Quiropraxia";

    const modal = document.getElementById("modalVideoEjercicio");
    modal.innerHTML = `
        <div class="modal-window" style="max-width:620px;">
            <div class="modal-top">
                <div>
                    <span class="badge badge-celeste">${p ? "✏️ EDITAR FICHA DE PACIENTE" : "🧑‍⚕️ ALTA DE PACIENTE"}</span>
                    <h3 style="color:var(--ink-900); margin-top:4px;">${p ? `${p.apellido}, ${p.nombre}` : `Nuevo Paciente`}</h3>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalVideoEjercicio()">✕</button>
            </div>

            <form onsubmit="guardarPacienteClinicoModalCDM(event, ${p ? p.id : "null"})">
                <div class="grid-3" style="margin-bottom:0.75rem;">
                    <div class="field"><label>Nombre *</label><input type="text" id="pacNombre" required value="${(p?.nombre || "").replace(/"/g, "&quot;")}"></div>
                    <div class="field"><label>Apellido *</label><input type="text" id="pacApellido" required value="${(p?.apellido || "").replace(/"/g, "&quot;")}"></div>
                    <div class="field"><label>DNI *</label><input type="text" id="pacDni" required value="${(p?.dni || "").replace(/"/g, "&quot;")}"></div>
                </div>

                <div class="grid-3" style="margin-bottom:0.75rem;">
                    <div class="field"><label>Edad</label><input type="number" id="pacEdad" value="${p?.edad || 32}"></div>
                    <div class="field"><label>WhatsApp *</label><input type="text" id="pacWhatsapp" required value="${(p?.whatsapp || "5493584").replace(/"/g, "&quot;")}"></div>
                    <div class="field">
                        <label>Profesión * (Elegí o escribí)</label>
                        <input type="text" id="pacEspecialidad" list="dlProfFichaPac" required value="${espSeleccionada.replace(/"/g, "&quot;")}">
                        <datalist id="dlProfFichaPac">
                            ${especialidadesHab.map(e => `<option value="${e.clave}">${e.icono} ${e.titulo}</option>`).join("")}
                        </datalist>
                    </div>
                </div>

                <div class="grid-3" style="margin-bottom:0.75rem;">
                    <div class="field">
                        <label>Mutual * (Elegí o escribí nueva)</label>
                        <input type="text" id="pacMutual" list="dlMutFichaPac" required value="${(p?.mutual || mutuales[0].nombre).replace(/"/g, "&quot;")}">
                        <datalist id="dlMutFichaPac">
                            ${mutuales.map(m => `<option value="${m.nombre}">`).join("")}
                        </datalist>
                    </div>
                    <div class="field"><label>N° Afiliado</label><input type="text" id="pacAfiliado" value="${(p?.nroAfiliado || "").replace(/"/g, "&quot;")}"></div>
                    <div class="field"><label>Sesiones Autorizadas</label><input type="number" id="pacSesionesAut" min="0" value="${p?.sesionesAutorizadas || 0}"></div>
                </div>

                <div class="field" style="margin-bottom:1.1rem;">
                    <label>Diagnóstico Médico / Motivo de Consulta *</label>
                    <textarea id="pacDiagnostico" rows="2" required>${p?.diagnostico || ""}</textarea>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                    <button type="button" class="btn btn-ghost" onclick="cerrarModalVideoEjercicio()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar Paciente</button>
                </div>
            </form>
        </div>
    `;
    modal.classList.remove("hidden");
}

function guardarPacienteClinicoModalCDM(e, idEditar = null) {
    e.preventDefault();
    const pacs = obtenerPacientesClinicosCDM();
    const profCanon = asegurarProfesionEnCatalogoCDM(document.getElementById("pacEspecialidad").value);
    const mutCanon = asegurarMutualEnCatalogoCDM(document.getElementById("pacMutual").value);

    const datos = {
        nombre: document.getElementById("pacNombre").value.trim(),
        apellido: document.getElementById("pacApellido").value.trim(),
        dni: document.getElementById("pacDni").value.trim(),
        edad: parseInt(document.getElementById("pacEdad").value) || 30,
        whatsapp: document.getElementById("pacWhatsapp").value.trim(),
        especialidad: profCanon,
        mutual: mutCanon.nombre,
        nroAfiliado: document.getElementById("pacAfiliado").value.trim() || "Particular",
        sesionesAutorizadas: parseInt(document.getElementById("pacSesionesAut").value) || 0,
        diagnostico: document.getElementById("pacDiagnostico").value.trim()
    };

    if (idEditar) {
        const idx = pacs.findIndex(x => Number(x.id) === Number(idEditar));
        if (idx >= 0) pacs[idx] = { ...pacs[idx], ...datos };
        mostrarToast(`✏️ Ficha de ${datos.apellido}, ${datos.nombre} actualizada.`);
    } else {
        pacs.unshift({
            id: Date.now(),
            codigoAcceso: `PAC-${Math.floor(100 + Math.random() * 899)}`,
            sesionesRealizadas: 0,
            sesiones: [],
            ...datos
        });
        mostrarToast(`🧑‍⚕️ Paciente ${datos.apellido}, ${datos.nombre} guardado.`);
    }

    guardarPacientesClinicosCDM(pacs);
    cerrarModalVideoEjercicio();
    renderizarModuloConsultorioCompletoCDM();
}

function eliminarPacienteClinicoCDM(idPac) {
    const pacs = obtenerPacientesClinicosCDM();
    const p = pacs.find(x => Number(x.id) === Number(idPac));
    if (!p || !confirm(`🗑️ ¿Eliminar la ficha clínica de ${p.apellido}, ${p.nombre}?`)) return;
    guardarPacientesClinicosCDM(pacs.filter(x => Number(x.id) !== Number(idPac)));
    renderizarModuloConsultorioCompletoCDM();
}

function eliminarTurnoAgendaCDM(idTurno) {
    if (!confirm("🗑️ ¿Cancelar y quitar este turno del calendario?")) return;
    guardarTurnosAgendaCDM(obtenerTurnosAgendaCDM().filter(x => Number(x.id) !== Number(idTurno)));
    renderizarModuloConsultorioCompletoCDM();
}

function enviarRecordatorioTurnoWhatsAppCDM(idTurno) {
    const t = obtenerTurnosAgendaCDM().find(x => Number(x.id) === Number(idTurno));
    if (!t) return;
    const p = obtenerPacientesClinicosCDM().find(x => Number(x.id) === Number(t.pacienteId));
    const tel = p?.whatsapp || "";
    const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
    let msg = `🩺 *RECORDATORIO DE TURNO — ${(lic.nombreEntidad || "CONSULTORIO OFICIAL").toUpperCase()}*\n`;
    msg += `Hola *${p ? p.nombre : t.pacienteNombre}*, te recordamos tu turno programado:\n\n`;
    msg += `📅 *Fecha:* ${t.fecha}\n`;
    msg += `⏰ *Hora:* ${t.hora} hs\n`;
    msg += `🧑‍⚕️ *Especialidad:* ${t.especialidad}\n`;
    msg += `🏥 *Cobertura:* ${t.mutual}\n\n`;
    msg += `Por favor confirmá tu asistencia respondiendo este mensaje. ¡Te esperamos!`;
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, "_blank");
}

function seleccionarNivelDolorEVABotonCDM(valor, btnEl) {
    const inp = document.getElementById("sesDolorEVA");
    if (inp) inp.value = valor;
    document.querySelectorAll(".evo-pain-btn").forEach(b => b.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");
}

function insertarChipEnCampoEvolucionCDM(idCampo, textoChip) {
    const el = document.getElementById(idCampo);
    if (!el) return;
    const actual = el.value.trim();
    if (!actual) el.value = textoChip;
    else if (!actual.includes(textoChip)) el.value = `${actual} + ${textoChip}`;
    el.focus();
}

function abrirModalRegistrarSesionYEvolucionCDM(pacienteId, turnoId = null) {
    const pacs = obtenerPacientesClinicosCDM();
    const p = pacs.find(x => Number(x.id) === Number(pacienteId));
    if (!p) return;
    asegurarModalVideoEnPaginaActualCDM();

    const catalogoEsp = obtenerEspecialidadesHabilitadasConsultorioCDM();
    const infoEsp = catalogoEsp.find(e => e.clave === p.especialidad) || ESPECIALIDADES_PROFESIONALES_BASE_CDM[0];
    const mutuales = obtenerConfigMutualesCDM();
    const conv = mutuales.find(m => m.nombre === p.mutual) || mutuales[0];

    const ultSesion = Array.isArray(p.sesiones) && p.sesiones.length > 0 ? p.sesiones[p.sesiones.length - 1] : null;
    const evaInicialSug = ultSesion ? Math.max(0, Number(ultSesion.dolorEVA) - 2) : 3;
    const avanceInicialSug = ultSesion ? Math.min(100, Number(ultSesion.evolucionPct || 50) + 15) : 75;
    const sigSesionNum = (p.sesionesRealizadas || (p.sesiones?.length || 0)) + 1;
    const fechaProxSemana = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

    const botoneraEVA = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
        const clsColor = n <= 3 ? "pain-low" : (n <= 6 ? "pain-mid" : "pain-high");
        return `<button type="button" class="evo-pain-btn ${clsColor} ${n === evaInicialSug ? "active" : ""}" onclick="seleccionarNivelDolorEVABotonCDM(${n}, this)">${n}</button>`;
    }).join("");

    const modal = document.getElementById("modalVideoEjercicio");
    modal.innerHTML = `
        <div class="modal-window" style="max-width:720px;">
            <div class="modal-top">
                <div>
                    <span class="badge badge-ok">${infoEsp.icono} ANOTAR SESIÓN #${sigSesionNum}${p.sesionesAutorizadas > 0 ? " DE " + p.sesionesAutorizadas : ""} EN EL HISTÓRICO</span>
                    <h3 style="color:var(--ink-900); margin-top:4px;">✍️ ${p.apellido}, ${p.nombre} (${p.mutual})</h3>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalVideoEjercicio()">✕</button>
            </div>

            ${ultSesion ? `
                <div style="background:var(--surface-subtle); border-left:4px solid var(--cdm-500); padding:0.65rem 0.9rem; border-radius:10px; margin-bottom:0.9rem; font-size:0.78rem; color:var(--ink-700);">
                    <b>⏮️ Nota de la Sesión Anterior (#${ultSesion.numSesion} del ${ultSesion.fecha}):</b>
                    EVA ${ultSesion.dolorEVA}/10 • Avance ${ultSesion.evolucionPct}% — <i>"${ultSesion.zona} / ${ultSesion.intervencion}"</i>
                </div>
            ` : ""}

            <form onsubmit="confirmarSesionClinicaYFinanzasCDM(event, ${p.id}, ${turnoId || "null"})">
                <input type="hidden" id="sesDolorEVA" value="${evaInicialSug}">

                <div class="grid-2" style="margin-bottom:0.85rem;">
                    <div>
                        <label style="font-size:0.68rem; font-weight:700; color:var(--ink-500); text-transform:uppercase; display:block;">
                            1. ${infoEsp.metricaPrincipal}
                        </label>
                        <div class="evo-pain-scale-bar">${botoneraEVA}</div>
                    </div>

                    <div style="display:flex; flex-direction:column; justify-content:space-between;">
                        <div class="field">
                            <label style="display:flex; justify-content:space-between;">
                                <span>2. ${infoEsp.metricaSecundaria}</span>
                                <strong id="lblValorSliderAvance" style="color:var(--ok-ink); font-size:0.85rem;">${avanceInicialSug}%</strong>
                            </label>
                            <input type="range" id="sesEvolucionPct" min="0" max="100" step="5" value="${avanceInicialSug}" oninput="document.getElementById('lblValorSliderAvance').innerText=this.value+'%'" style="min-height:24px; padding:0;">
                        </div>
                        <div class="field">
                            <label>Fecha de la Sesión *</label>
                            <input type="date" id="sesFecha" required value="${obtenerHoyISO()}" style="min-height:34px;">
                        </div>
                    </div>
                </div>

                <div class="field" style="margin-bottom:0.75rem;">
                    <label>3. Evaluación / Zona Trabajada en esta Sesión *</label>
                    <div class="evo-quick-chips-wrap">
                        ${(infoEsp.chipsZonas || []).map(ch => `<button type="button" class="evo-quick-chip" onclick="insertarChipEnCampoEvolucionCDM('sesZona', '${ch}')">+ ${ch}</button>`).join("")}
                    </div>
                    <input type="text" id="sesZona" required placeholder="${infoEsp.placeholderZona}">
                </div>

                <div class="field" style="margin-bottom:0.85rem;">
                    <label>4. Nota Detallada de la Sesión (Qué se realizó y observaciones para la próxima) *</label>
                    <div class="evo-quick-chips-wrap">
                        ${(infoEsp.chipsTecnicas || []).map(ch => `<button type="button" class="evo-quick-chip" onclick="insertarChipEnCampoEvolucionCDM('sesIntervencion', '${ch}')">+ ${ch}</button>`).join("")}
                    </div>
                    <textarea id="sesIntervencion" rows="2" required placeholder="${infoEsp.placeholderTecnica}"></textarea>
                </div>

                <div style="background:var(--surface-subtle); border:1px solid var(--line-strong); border-radius:12px; padding:0.65rem 0.9rem; margin-bottom:0.85rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
                    <label style="display:flex; align-items:center; gap:0.45rem; cursor:pointer; font-size:0.8rem; font-weight:700; color:var(--ink-900);">
                        <input type="checkbox" id="sesAgendarProximoFlag" style="width:17px; height:17px; min-height:auto;" onchange="document.getElementById('boxInputsProximoTurnoEvo').classList.toggle('hidden', !this.checked)">
                        <span>📅 Agendar su próxima sesión en el calendario</span>
                    </label>
                    <div id="boxInputsProximoTurnoEvo" class="hidden" style="display:flex; gap:0.4rem; align-items:center;">
                        <input type="date" id="sesProxFecha" value="${fechaProxSemana}" style="width:auto; min-height:32px; font-size:0.75rem;">
                        <input type="time" id="sesProxHora" value="10:00" style="width:auto; min-height:32px; font-size:0.75rem;">
                    </div>
                </div>

                <div style="background:var(--cdm-50); border:1.5px solid var(--line-celeste); border-radius:14px; padding:0.85rem 1rem; margin-bottom:1rem;">
                    <strong style="font-size:0.76rem; color:var(--cdm-900); display:block; margin-bottom:0.45rem; text-transform:uppercase;">
                        💳 5. Cobro de la Sesión (Se registra en Finanzas y Mutuales)
                    </strong>
                    <div class="grid-4">
                        <div class="field"><label>Cubre Mutual ($)</label><input type="number" id="sesMontoMutual" min="0" value="${conv.esParticular ? 0 : conv.arancelMutual}"></div>
                        <div class="field"><label>N° Orden</label><input type="text" id="sesNroOrden" value="${conv.esParticular ? "Particular" : ("AUT-" + Math.floor(1000 + Math.random() * 9000))}"></div>
                        <div class="field"><label>Abona Hoy ($)</label><input type="number" id="sesMontoPacienteHoy" min="0" value="${conv.coseguroPaciente}"></div>
                        <div class="field">
                            <label>Medio de Cobro</label>
                            <select id="sesMedioCobroHoy">
                                <option value="Transferencia">🏦 Transferencia</option>
                                <option value="Efectivo">💵 Efectivo</option>
                                <option value="MercadoPago">📲 MercadoPago</option>
                                <option value="Tarjeta">💳 Tarjeta</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                    <button type="button" class="btn btn-ghost" onclick="cerrarModalVideoEjercicio()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="ri-save-3-line"></i> Guardar Nota en el Histórico e Imputar Cobro
                    </button>
                </div>
            </form>
        </div>
    `;
    modal.classList.remove("hidden");
}

function confirmarSesionClinicaYFinanzasCDM(e, pacienteId, turnoId = null) {
    e.preventDefault();
    const pacs = obtenerPacientesClinicosCDM();
    const p = pacs.find(x => Number(x.id) === Number(pacienteId));
    if (!p) return;

    const fecha = document.getElementById("sesFecha").value || obtenerHoyISO();
    const dolorEVA = parseInt(document.getElementById("sesDolorEVA").value) || 0;
    const evolucionPct = parseInt(document.getElementById("sesEvolucionPct").value) || 75;
    const zona = document.getElementById("sesZona").value.trim();
    const intervencion = document.getElementById("sesIntervencion").value.trim();

    const montoMutual = parseFloat(document.getElementById("sesMontoMutual").value) || 0;
    const nroOrden = document.getElementById("sesNroOrden").value.trim() || "S/N";
    const montoPacienteHoy = parseFloat(document.getElementById("sesMontoPacienteHoy").value) || 0;
    const medioCobroHoy = document.getElementById("sesMedioCobroHoy").value || "Transferencia";

    if (!Array.isArray(p.sesiones)) p.sesiones = [];
    p.sesionesRealizadas = (p.sesionesRealizadas || p.sesiones.length) + 1;

    p.sesiones.push({
        id: Date.now(),
        fecha,
        numSesion: p.sesionesRealizadas,
        especialidad: p.especialidad,
        zona,
        intervencion,
        dolorEVA,
        evolucionPct,
        profesional: "Consultorio Oficial",
        cobroDetalle: `${p.mutual} ($${montoMutual.toLocaleString("es-AR")}) + Paciente en ${medioCobroHoy} ($${montoPacienteHoy.toLocaleString("es-AR")})`
    });
    guardarPacientesClinicosCDM(pacs);

    if (montoPacienteHoy > 0 && typeof obtenerMovimientosContablesCDM === "function") {
        const movs = obtenerMovimientosContablesCDM();
        movs.unshift({
            id: Date.now() + 1,
            comprobante: `SES-${Math.floor(1000 + Math.random() * 9000)}`,
            fecha,
            tipo: "ingreso",
            origen: "Consultorio",
            areaDeporte: "Gimnasio",
            rubro: "Cuota Deportiva / Socio",
            concepto: `Sesión ${p.especialidad} #${p.sesionesRealizadas} — ${p.apellido}, ${p.nombre} (${p.mutual})`,
            medio: medioCobroHoy,
            monto: montoPacienteHoy,
            personaId: null,
            nota: `Cobro en sesión (${medioCobroHoy})`
        });
        guardarMovimientosContablesCDM(movs);
    }

    if (montoMutual > 0 && !p.mutual.includes("Particular")) {
        const ordenes = obtenerOrdenesMutualPendientesCDM();
        ordenes.unshift({
            id: Date.now() + 2,
            fecha,
            mutual: p.mutual,
            pacienteNombre: `${p.apellido}, ${p.nombre}`,
            nroAfiliado: p.nroAfiliado || "-",
            nroOrden,
            especialidad: p.especialidad,
            montoMutual,
            coseguroCobrado: montoPacienteHoy,
            estado: "Pendiente"
        });
        guardarOrdenesMutualPendientesCDM(ordenes);
    }

    const turnos = obtenerTurnosAgendaCDM();
    if (turnoId) {
        const t = turnos.find(x => Number(x.id) === Number(turnoId));
        if (t) {
            t.estado = "Atendido";
            t.pagado = true;
        }
    }

    const agendarProx = Boolean(document.getElementById("sesAgendarProximoFlag")?.checked);
    if (agendarProx) {
        const proxFecha = document.getElementById("sesProxFecha")?.value || fecha;
        const proxHora = document.getElementById("sesProxHora")?.value || "10:00";
        turnos.push({
            id: Date.now() + 5,
            fecha: proxFecha,
            hora: proxHora,
            duracion: "45 min",
            pacienteId: p.id,
            pacienteNombre: `${p.apellido}, ${p.nombre}`,
            especialidad: p.especialidad,
            mutual: p.mutual,
            motivo: `Sesión #${p.sesionesRealizadas + 1} (${p.especialidad})`,
            estado: "Reservado",
            pagado: false,
            montoTotal: montoMutual + montoPacienteHoy
        });
    }
    guardarTurnosAgendaCDM(turnos);

    cerrarModalVideoEjercicio();
    renderizarModuloConsultorioCompletoCDM();
    mostrarToast(`📓 Nota de la Sesión #${p.sesionesRealizadas} guardada en el histórico de ${p.apellido}.`);
}

function dibujarGraficoEvolucionPacienteClinicoCDM(p) {
    const canvas = document.getElementById("canvasEvolucionClinicaPaciente");
    if (!canvas || typeof Chart === "undefined") return;
    if (chartEvolucionClinicaInstancia) chartEvolucionClinicaInstancia.destroy();

    const cronologico = [...(p.sesiones || [])].sort((a, b) => new Date(a.fecha) - new Date(b.fecha) || a.numSesion - b.numSesion);
    const labels = cronologico.map(s => `Sesión #${s.numSesion} (${s.fecha.slice(5)})`);
    const datosEVA = cronologico.map(s => Number(s.dolorEVA || 0));
    const datosAvance = cronologico.map(s => Number(s.evolucionPct || 0));

    chartEvolucionClinicaInstancia = new Chart(canvas.getContext("2d"), {
        type: "line",
        data: {
            labels: labels.length ? labels : ["Sin sesiones"],
            datasets: [
                {
                    label: "Avance / Recuperación (%)",
                    data: datosAvance.length ? datosAvance : [0],
                    borderColor: "#10b981",
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    tension: 0.35,
                    fill: true
                },
                {
                    label: "Dolor / Malestar EVA (Escala 0 a 10)",
                    data: datosEVA.length ? datosEVA : [0],
                    borderColor: "#f43f5e",
                    backgroundColor: "rgba(244, 63, 94, 0.1)",
                    tension: 0.35,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function eliminarNotaSesionPacienteCDM(pacienteId, sesionId) {
    if (!confirm("🗑️ ¿Eliminar esta nota de sesión del histórico del paciente?")) return;
    const pacs = obtenerPacientesClinicosCDM();
    const p = pacs.find(x => Number(x.id) === Number(pacienteId));
    if (!p) return;
    p.sesiones = (p.sesiones || []).filter(s => Number(s.id) !== Number(sesionId));
    p.sesionesRealizadas = p.sesiones.length;
    guardarPacientesClinicosCDM(pacs);
    abrirModalHistoriaClinicaPacienteCDM(p.id);
    renderizarModuloConsultorioCompletoCDM();
}

function liquidarOrdenIndividualMutualABancoCDM(idOrden) {
    const ordenes = obtenerOrdenesMutualPendientesCDM();
    const o = ordenes.find(x => Number(x.id) === Number(idOrden));
    if (!o || o.estado === "Liquidada") return;

    o.estado = "Liquidada";
    guardarOrdenesMutualPendientesCDM(ordenes);

    if (typeof obtenerMovimientosContablesCDM === "function") {
        const movs = obtenerMovimientosContablesCDM();
        movs.unshift({
            id: Date.now(),
            comprobante: `MUT-${o.nroOrden || Math.floor(100 + Math.random() * 899)}`,
            fecha: obtenerHoyISO(),
            tipo: "ingreso",
            origen: "Liquidación Mutual",
            areaDeporte: "Gimnasio",
            rubro: "Cuota Deportiva / Socio",
            concepto: `Liquidación ${o.mutual} — Paciente ${o.pacienteNombre} (${o.especialidad})`,
            medio: "Transferencia",
            monto: Number(o.montoMutual || 0),
            personaId: null,
            nota: `Orden ${o.nroOrden} acreditada en Banco`
        });
        guardarMovimientosContablesCDM(movs);
    }

    renderizarModuloConsultorioCompletoCDM();
    mostrarToast(`🏦 Orden ${o.nroOrden} (${o.mutual}) liquidada en Banco/Transferencia.`);
}

function liquidarTodasLasOrdenesMutualesAlBancoCDM() {
    const ordenes = obtenerOrdenesMutualPendientesCDM();
    const pendientes = ordenes.filter(o => o.estado === "Pendiente");
    if (pendientes.length === 0) return;

    const total = pendientes.reduce((a, o) => a + Number(o.montoMutual || 0), 0);
    if (!confirm(`🏦 ¿Liquidar las ${pendientes.length} órdenes pendientes por $${total.toLocaleString("es-AR")} e ingresarlas en Banco / Transferencias?`)) return;

    const hoy = obtenerHoyISO();
    const movs = typeof obtenerMovimientosContablesCDM === "function" ? obtenerMovimientosContablesCDM() : [];

    pendientes.forEach((o, i) => {
        o.estado = "Liquidada";
        movs.unshift({
            id: Date.now() + i,
            comprobante: `LOTE-${o.nroOrden || (100 + i)}`,
            fecha: hoy,
            tipo: "ingreso",
            origen: "Liquidación Mutual",
            areaDeporte: "Gimnasio",
            rubro: "Cuota Deportiva / Socio",
            concepto: `Liquidación ${o.mutual} — ${o.pacienteNombre} (${o.especialidad})`,
            medio: "Transferencia",
            monto: Number(o.montoMutual || 0),
            personaId: null,
            nota: `Liquidación lote de mutuales`
        });
    });

    guardarOrdenesMutualPendientesCDM(ordenes);
    if (typeof guardarMovimientosContablesCDM === "function") guardarMovimientosContablesCDM(movs);

    renderizarModuloConsultorioCompletoCDM();
    mostrarToast(`🏦 Lote liquidado (+$${total.toLocaleString("es-AR")} en Banco/Transferencias).`);
}

function eliminarOrdenMutualCDM(idOrden) {
    if (!confirm("🗑️ ¿Eliminar este registro de orden de mutual?")) return;
    guardarOrdenesMutualPendientesCDM(obtenerOrdenesMutualPendientesCDM().filter(x => Number(x.id) !== Number(idOrden)));
    renderizarModuloConsultorioCompletoCDM();
}

function agregarNuevaMutualConvenioPromptCDM() {
    const nombre = prompt("🏥 Nombre de la nueva Obra Social / Mutual / Prepaga:");
    if (!nombre || !nombre.trim()) return;
    const arancel = parseFloat(prompt(`💰 Monto que cubre "${nombre.trim()}" por sesión ($):`, "14000")) || 0;
    const coseguro = parseFloat(prompt(`💵 Coseguro / Copago que abona el paciente en consultorio ($):`, "3000")) || 0;

    asegurarMutualEnCatalogoCDM(nombre.trim(), arancel, coseguro);
    renderizarModuloConsultorioCompletoCDM();
}

function editarArancelMutualPromptCDM(idMutual) {
    const lista = obtenerConfigMutualesCDM();
    const m = lista.find(x => Number(x.id) === Number(idMutual));
    if (!m) return;

    const nuevoArancel = prompt(`💰 Monto cubierto por "${m.nombre}" ($):`, m.arancelMutual);
    if (nuevoArancel === null) return;
    const nuevoCos = prompt(`💵 Coseguro / Importe abonado por el paciente ($):`, m.coseguroPaciente);
    if (nuevoCos === null) return;

    m.arancelMutual = parseFloat(nuevoArancel) || 0;
    m.coseguroPaciente = parseFloat(nuevoCos) || 0;
    guardarConfigMutualesCDM(lista);
    renderizarModuloConsultorioCompletoCDM();
    mostrarToast(`✏️ Aranceles de ${m.nombre} actualizados.`);
}

document.addEventListener("click", function (e) {
    const sideLink = e.target.closest(".app-sidebar .side-link");
    if (sideLink && sideLink.dataset.nav !== "consultorio" && sideLink.dataset.nav !== "contabilidad") {
        document.getElementById("cdmSeccionConsultorioGlobal")?.classList.add("hidden");
        document.getElementById("cdmSeccionContabilidadGlobal")?.classList.add("hidden");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    inyectarAccesoConsultorioEnSidebarEIndexCDM();
});
setTimeout(inyectarAccesoConsultorioEnSidebarEIndexCDM, 250);