/**
 * login.js - Sistema Oficial Multi-Sede de Autenticación, Selector de Comercios/Clubes y Blindaje
 * - Login 100% Genérico Neutro (Sin marca fija de ningún club en la portada)
 * - Si ingresa el Admin Principal (gonzalo / admin): abre el Hub Selector de Todos los Comercios, Clubes y Gimnasios
 * - Si ingresa el Usuario de un Comercio/Club/Gimnasio específico: abre directamente el sistema de ese comercio con su logo y módulos
 * - Si ingresa un Deportista/Socio con su Código Personal: detecta su club/gimnasio y abre su ficha en Modo Cápsula
 */

const CREDENCIALES_ADMIN = {
    usuario: "cdm",
    clave: "cdm2026"
};

const STORAGE_SESION_KEY = "cdm_sesion_activa_v1";
const STORAGE_TEMA_KEY = "cdm_theme_mode_v1";
const STORAGE_LICENCIA_KEY = "cdm_licencia_config_v1";
const STORAGE_CLUB_ACTIVO_KEY = "cdm_club_activo_id_v1";
const STORAGE_MAPA_CLUBES_KEY = "cdm_mapa_multiclubes_v1";
const CLAVE_CLUB_DEFECTO_CDM = "cdm_adelia_maria_principal";

const CREDENCIALES_SUPERADMIN = {
    usuarios: ["gonzalo", "superadmin"],
    claves: ["zetta2026", "gonzalo2026"]
};

function obtenerClaveClubActivoCDM() {
    const params = new URLSearchParams(window.location.search);
    const clubUrl = params.get("club") || params.get("cliente");
    if (clubUrl) {
        const limpio = clubUrl.trim().toLowerCase().replace(/[^a-z0-9_\-]/g, "_");
        if (limpio) {
            localStorage.setItem(STORAGE_CLUB_ACTIVO_KEY, limpio);
            return limpio;
        }
    }
    return localStorage.getItem(STORAGE_CLUB_ACTIVO_KEY) || CLAVE_CLUB_DEFECTO_CDM;
}

function obtenerMapaLocalClubesCDM() {
    let mapa = {};
    try {
        mapa = JSON.parse(localStorage.getItem(STORAGE_MAPA_CLUBES_KEY)) || {};
    } catch {
        mapa = {};
    }
    // Asegurar que exista siempre al menos CDM como primer cliente del catálogo
    if (!mapa[CLAVE_CLUB_DEFECTO_CDM]) {
        mapa[CLAVE_CLUB_DEFECTO_CDM] = {
            claveClub: CLAVE_CLUB_DEFECTO_CDM,
            ultimaActualizacionISO: new Date().toISOString(),
            personas: JSON.parse(localStorage.getItem("cdm_personas_v1") || "[]"),
            rutinas: JSON.parse(localStorage.getItem("cdm_rutinas_v1") || "[]"),
            partidos: JSON.parse(localStorage.getItem("cdm_partidos_v1") || "[]"),
            alineaciones: JSON.parse(localStorage.getItem("cdm_alineaciones_v2") || "{}"),
            microciclos: JSON.parse(localStorage.getItem("cdm_microciclos_v1") || "{}"),
            licenciaConfig: {
                claveClub: CLAVE_CLUB_DEFECTO_CDM,
                nombreEntidad: "Club Deportivo Municipal",
                subtituloEntidad: "Adelia María",
                siglaCodigo: "CDM",
                logoUrl: "/img/logo.png",
                planActivo: "completo",
                modulos: { futbol: true, hockey: true, gym: true },
                adminUsuario: "cdm",
                adminClave: "cdm2026",
                estadoServicio: "activo"
            }
        };
        localStorage.setItem(STORAGE_MAPA_CLUBES_KEY, JSON.stringify(mapa));
    }
    return mapa;
}

function guardarSnapshotClubActualEnMapaLocal() {
    const claveActual = obtenerClaveClubActivoCDM();
    const mapa = obtenerMapaLocalClubesCDM();
    const lic = obtenerLicenciaConfigCDM();
    lic.claveClub = claveActual;

    mapa[claveActual] = {
        claveClub: claveActual,
        ultimaActualizacionISO: new Date().toISOString(),
        personas: JSON.parse(localStorage.getItem("cdm_personas_v1") || "[]"),
        rutinas: JSON.parse(localStorage.getItem("cdm_rutinas_v1") || "[]"),
        partidos: JSON.parse(localStorage.getItem("cdm_partidos_v1") || "[]"),
        alineaciones: JSON.parse(localStorage.getItem("cdm_alineaciones_v2") || "{}"),
        microciclos: JSON.parse(localStorage.getItem("cdm_microciclos_v1") || "{}"),
        licenciaConfig: lic
    };
    localStorage.setItem(STORAGE_MAPA_CLUBES_KEY, JSON.stringify(mapa));
    return mapa;
}

function cargarEstadoClubEnLocalStorage(estadoClub, claveClub) {
    if (!estadoClub) return;
    const clave = claveClub || estadoClub.claveClub || CLAVE_CLUB_DEFECTO_CDM;
    localStorage.setItem(STORAGE_CLUB_ACTIVO_KEY, clave);
    localStorage.setItem("cdm_personas_v1", JSON.stringify(Array.isArray(estadoClub.personas) ? estadoClub.personas : []));
    localStorage.setItem("cdm_rutinas_v1", JSON.stringify(Array.isArray(estadoClub.rutinas) ? estadoClub.rutinas : []));
    localStorage.setItem("cdm_partidos_v1", JSON.stringify(Array.isArray(estadoClub.partidos) ? estadoClub.partidos : []));
    localStorage.setItem("cdm_alineaciones_v2", JSON.stringify(estadoClub.alineaciones && typeof estadoClub.alineaciones === "object" ? estadoClub.alineaciones : {}));
    localStorage.setItem("cdm_microciclos_v1", JSON.stringify(estadoClub.microciclos && typeof estadoClub.microciclos === "object" ? estadoClub.microciclos : {}));
    if (Array.isArray(estadoClub.videoteca) && estadoClub.videoteca.length > 0) {
        localStorage.setItem("cdm_videoteca_v1", JSON.stringify(estadoClub.videoteca));
    }
    if (Array.isArray(estadoClub.catalogoEjercicios) && estadoClub.catalogoEjercicios.length > 0) {
        localStorage.setItem("cdm_catalogo_ej_v1", JSON.stringify(estadoClub.catalogoEjercicios));
    }
    if (estadoClub.licenciaConfig && typeof estadoClub.licenciaConfig === "object") {
        localStorage.setItem(STORAGE_LICENCIA_KEY, JSON.stringify({
            ...estadoClub.licenciaConfig,
            claveClub: clave
        }));
    }
    guardarSnapshotClubActualEnMapaLocal();
}

function obtenerLicenciaConfigCDM() {
    const claveActiva = obtenerClaveClubActivoCDM();
    const defecto = {
        claveClub: claveActiva,
        nombreEntidad: "Club Deportivo Municipal",
        subtituloEntidad: "Adelia María",
        siglaCodigo: "CDM",
        logoUrl: "/img/logo.png",
        planActivo: "completo",
        modulos: {
            futbol: true,
            hockey: true,
            gym: true
        },
        deportesExtra: [],
        adminUsuario: "cdm",
        adminClave: "cdm2026",
        estadoServicio: "activo"
    };
    try {
        const guardado = JSON.parse(localStorage.getItem(STORAGE_LICENCIA_KEY));
        if (!guardado || typeof guardado !== "object") return defecto;
        const userNorm = (guardado.adminUsuario || "cdm").toLowerCase() === "admin" ? "cdm" : (guardado.adminUsuario || "cdm").toLowerCase();
        return {
            ...defecto,
            ...guardado,
            adminUsuario: userNorm,
            claveClub: guardado.claveClub || claveActiva,
            deportesExtra: Array.isArray(guardado.deportesExtra) ? guardado.deportesExtra : [],
            modulos: {
                ...defecto.modulos,
                ...(guardado.modulos || {})
            }
        };
    } catch {
        return defecto;
    }
}

function guardarLicenciaConfigCDM(nuevaConfig) {
    const claveActiva = nuevaConfig.claveClub || obtenerClaveClubActivoCDM();
    const configFinal = { ...nuevaConfig, claveClub: claveActiva };
    localStorage.setItem(STORAGE_LICENCIA_KEY, JSON.stringify(configFinal));
    guardarSnapshotClubActualEnMapaLocal();
    if (typeof guardarDatosCDM === "function") {
        guardarDatosCDM();
    }
}

function esSuperAdminCDM() {
    const s = obtenerSesionActivaCDM();
    return Boolean(s && s.esSuperAdmin);
}

function limpiarNombreDeporteExtraLogin(raw) {
    return String(raw || "").replace(/^[^\w\sÁÉÍÓÚáéíóúÑñ]+\s*/, "").trim() || String(raw || "").trim();
}

function obtenerPaginaInicialSegunModulos(lic) {
    const mod = lic?.modulos || { futbol: true, hockey: true, gym: true };
    const extras = Array.isArray(lic?.deportesExtra) ? lic.deportesExtra : [];
    const totalActivos = (mod.futbol ? 1 : 0) + (mod.hockey ? 1 : 0) + (mod.gym ? 1 : 0) + extras.length;

    if (totalActivos === 1) {
        if (mod.gym) return "gym.html";
        if (mod.futbol) return "futbol.html";
        if (mod.hockey) return "hockey.html";
        if (extras.length === 1) {
            return `futbol.html?deporte=${encodeURIComponent(limpiarNombreDeporteExtraLogin(extras[0]))}`;
        }
    }
    return "index.html";
}

function aplicarLicenciaYModulosCDM() {
    const path = window.location.pathname.toLowerCase();
    const esPaginaLogin = path.includes("login.html") || document.body.classList.contains("login-page");

    // IMPORTANTE: En login.html NO se aplica el nombre ni el logo de CDM para que el Login sea siempre 100% Genérico
    if (esPaginaLogin) return;

    const lic = obtenerLicenciaConfigCDM();
    const mod = lic.modulos || { futbol: true, hockey: true, gym: true };

    // 1. Actualizar Nombre y Logo del Comercio/Club activo en las páginas internas
    document.querySelectorAll(".sidebar-brand-text h1").forEach(el => {
        el.innerText = (lic.nombreEntidad || "PLATAFORMA OFICIAL").toUpperCase();
    });
    document.querySelectorAll(".sidebar-brand-text span").forEach(el => {
        el.innerText = lic.subtituloEntidad || "Panel Oficial";
    });
    if (lic.logoUrl) {
        document.querySelectorAll(".sidebar-brand img").forEach(img => {
            img.src = lic.logoUrl;
        });
    }

    const topTitleIndex = document.querySelector('body:not([data-deporte]):not([data-page]) .topbar-title h2');
    if (topTitleIndex && document.getElementById("countFutbol")) {
        topTitleIndex.innerHTML = `${lic.nombreEntidad} <span class="cat-active-pill">${lic.subtituloEntidad || "Panel Oficial"}</span>`;
    }

    // 2. Ocultar del Sidebar y de las Tarjetas del Index los módulos base no contratados (respetando deportes extra)
    document.querySelectorAll('.sidebar-nav a[href="futbol.html"], .sports-showcase-grid a[href="futbol.html"]').forEach(el => {
        el.classList.toggle("hidden", !mod.futbol);
    });
    document.querySelectorAll('.sidebar-nav a[href*="hockey.html"], .sports-showcase-grid a[href*="hockey.html"]').forEach(el => {
        el.classList.toggle("hidden", !mod.hockey);
    });
    document.querySelectorAll('.sidebar-nav a[href*="gym.html"], .sports-showcase-grid a[href*="gym.html"]').forEach(el => {
        el.classList.toggle("hidden", !mod.gym);
    });

    // 3. Si es el administrador de un comercio específico (NO SuperAdmin) y entra a un módulo que no contrató, llevarlo a su módulo activo
    const sesion = obtenerSesionActivaCDM();
    const depParam = new URLSearchParams(window.location.search).get("deporte");
    if (sesion && !sesion.esSuperAdmin) {
        if (path.includes("futbol.html") && !depParam && !mod.futbol) {
            window.location.replace(obtenerPaginaInicialSegunModulos(lic));
            return;
        }
        if (path.includes("hockey.html") && !mod.hockey) {
            window.location.replace(obtenerPaginaInicialSegunModulos(lic));
            return;
        }
        if (path.includes("gym.html") && !mod.gym) {
            window.location.replace(obtenerPaginaInicialSegunModulos(lic));
            return;
        }
    }
}

// =========================================================================
// HUB CENTRAL DEL ADMIN PRINCIPAL (CREAR, EDITAR Y ENTRAR A CUALQUIER COMERCIO)
// =========================================================================

async function obtenerListaCompletaComerciosCDM() {
    guardarSnapshotClubActualEnMapaLocal();
    const mapaLocal = obtenerMapaLocalClubesCDM();

    if (window.location.protocol !== "file:") {
        try {
            const resp = await fetch("/api/cdm/clubes", { cache: "no-store" });
            if (resp.ok) {
                const data = await resp.json();
                if (Array.isArray(data.clubes) && data.clubes.length > 0) {
                    return data.clubes;
                }
            }
        } catch {}
    }

    return Object.values(mapaLocal).map(c => ({
        claveClub: c.claveClub,
        cantidadPersonas: Array.isArray(c.personas) ? c.personas.filter(p => p && p.activo).length : 0,
        licenciaConfig: c.licenciaConfig || {}
    }));
}

async function mostrarHubSelectorDeComercios() {
    const card = document.getElementById("contenedorTarjetaLogin");
    const vistaLogin = document.getElementById("vistaLoginGenerico");
    const vistaHub = document.getElementById("vistaHubSuperAdmin");
    const grid = document.getElementById("gridTarjetasComerciosHub");

    if (!vistaHub || !grid) {
        window.location.href = "login.html?hub=1";
        return;
    }

    card?.classList.add("hub-mode");
    vistaLogin?.classList.add("hidden");
    vistaHub.classList.remove("hidden");

    const lista = await obtenerListaCompletaComerciosCDM();

    grid.innerHTML = lista.map(c => {
        const lic = c.licenciaConfig || {};
        const mod = lic.modulos || { futbol: true, hockey: true, gym: true };
        const nombre = lic.nombreEntidad || c.claveClub;
        const sub = lic.subtituloEntidad || "Sede Oficial";
        const sigla = (lic.siglaCodigo || "CDM").toUpperCase();
        const userComercio = lic.adminUsuario === "admin" ? "cdm" : (lic.adminUsuario || "cdm");
        const passComercio = lic.adminClave || "cdm2026";
        const pausado = lic.estadoServicio === "suspendido";

        return `
            <div class="hub-comercio-card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.6rem;">
                    <div style="display:flex; align-items:center; gap:0.65rem; min-width:0;">
                        <img src="${lic.logoUrl || '/img/logo.png'}" alt="${nombre}" style="width:42px; height:42px; object-fit:contain; background:#fff; padding:4px; border-radius:11px; border:1px solid #cbd5e1; flex-shrink:0;" onerror="this.onerror=null; this.src='logo.png';">
                        <div style="min-width:0;">
                            <h4 style="font-size:0.96rem; font-weight:800; color:#0f172a; margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${nombre}</h4>
                            <small style="color:#64748b; font-size:0.74rem; display:block;">📍 ${sub} • <b>[${sigla}]</b></small>
                        </div>
                    </div>
                    <span class="badge ${pausado ? 'badge-danger' : 'badge-ok'}" style="font-size:0.64rem;">
                        ${pausado ? "🔴 Pausado" : "🟢 Activo"}
                    </span>
                </div>

                <div style="display:flex; gap:0.3rem; flex-wrap:wrap;">
                    ${mod.futbol ? `<span class="badge badge-celeste" style="font-size:0.65rem;">⚽ Fútbol</span>` : ""}
                    ${mod.hockey ? `<span class="badge badge-celeste" style="font-size:0.65rem;">🏑 Hockey</span>` : ""}
                    ${mod.gym ? `<span class="badge badge-celeste" style="font-size:0.65rem;">🏋️ Gimnasio</span>` : ""}
                    ${(lic.deportesExtra || []).map(d => `<span class="badge badge-celeste" style="font-size:0.65rem;">${d}</span>`).join("")}
                    <span class="badge badge-purple" style="font-size:0.65rem;">👥 ${c.cantidadPersonas || 0} activos</span>
                </div>

                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:0.45rem 0.65rem; font-size:0.73rem; color:#334155;">
                    <div>👤 <b>Usuario comercio:</b> ${userComercio}</div>
                    <div>🔑 <b>Contraseña:</b> ${passComercio}</div>
                </div>

                <div style="display:flex; flex-direction:column; gap:0.38rem; margin-top:auto;">
                    <button type="button" class="btn btn-primary btn-sm" style="width:100%;" onclick="entrarAComercioDesdeHub('${c.claveClub}')">
                        <i class="ri-login-box-line"></i> Abrir este Comercio / Club
                    </button>
                    <div style="display:flex; gap:0.35rem;">
                        <button type="button" class="btn btn-secondary btn-sm" style="flex:1;" onclick="abrirModalCrearOEditarComercio('${c.claveClub}')">
                            <i class="ri-settings-4-line"></i> Módulos / Editar
                        </button>
                        <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarCredencialesDeComercioEspecificoWA('${c.claveClub}')" title="Enviar Usuario y Contraseña por WhatsApp al cliente">
                            <i class="ri-whatsapp-line"></i> WA
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function salirDelHubAlLoginGenerico() {
    localStorage.removeItem(STORAGE_SESION_KEY);
    const card = document.getElementById("contenedorTarjetaLogin");
    const vistaLogin = document.getElementById("vistaLoginGenerico");
    const vistaHub = document.getElementById("vistaHubSuperAdmin");
    card?.classList.remove("hub-mode");
    vistaHub?.classList.add("hidden");
    vistaLogin?.classList.remove("hidden");
    if (window.location.search.includes("hub=")) {
        window.history.replaceState({}, "", "login.html");
    }
}

async function entrarAComercioDesdeHub(claveClub, paginaForzada = null) {
    guardarSnapshotClubActualEnMapaLocal();

    let estadoCargado = null;
    if (window.location.protocol !== "file:") {
        try {
            const resp = await fetch(`/api/cdm/estado?club=${encodeURIComponent(claveClub)}`, { cache: "no-store" });
            if (resp.ok) {
                const data = await resp.json();
                if (data.ok && data.estado) estadoCargado = data.estado;
            }
        } catch {}
    }

    if (!estadoCargado) {
        const mapa = obtenerMapaLocalClubesCDM();
        estadoCargado = mapa[claveClub];
    }

    if (estadoCargado) {
        cargarEstadoClubEnLocalStorage(estadoCargado, claveClub);
    } else {
        localStorage.setItem(STORAGE_CLUB_ACTIVO_KEY, claveClub);
    }

    const lic = obtenerLicenciaConfigCDM();
    localStorage.setItem(STORAGE_SESION_KEY, JSON.stringify({
        rol: "admin",
        esSuperAdmin: true,
        claveClub: claveClub,
        nombre: `SuperAdmin • ${lic.nombreEntidad || "Panel"}`,
        fechaIngreso: new Date().toISOString()
    }));

    const destino = paginaForzada || obtenerPaginaInicialSegunModulos(lic);
    window.location.href = destino;
}

function seleccionarPresetEnModalComercio(plan) {
    const chkF = document.getElementById("mcModFutbol");
    const chkH = document.getElementById("mcModHockey");
    const chkG = document.getElementById("mcModGym");
    const inpPlan = document.getElementById("mcPlanActivo");
    if (inpPlan) inpPlan.value = plan;

    if (plan === "solo_gym") {
        if (chkF) chkF.checked = false;
        if (chkH) chkH.checked = false;
        if (chkG) chkG.checked = true;
    } else if (plan === "solo_deportes") {
        if (chkF) chkF.checked = true;
        if (chkH) chkH.checked = true;
        if (chkG) chkG.checked = false;
    } else {
        if (chkF) chkF.checked = true;
        if (chkH) chkH.checked = true;
        if (chkG) chkG.checked = true;
    }
}

function subirLogoEnModalComercio(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement("canvas");
            canvas.width = 240;
            canvas.height = 240;
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, 240, 240);
            const scale = Math.min(240 / img.width, 240 / img.height);
            const w = img.width * scale;
            const h = img.height * scale;
            ctx.drawImage(img, (240 - w) / 2, (240 - h) / 2, w, h);
            const dataUrl = canvas.toDataURL("image/png");
            const inp = document.getElementById("mcLogoUrl");
            if (inp) inp.value = dataUrl;
            const prev = document.getElementById("mcPreviewLogo");
            if (prev) prev.src = dataUrl;
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
}

async function abrirModalCrearOEditarComercio(claveClubEditar = null) {
    const lista = await obtenerListaCompletaComerciosCDM();
    const existente = claveClubEditar ? lista.find(x => x.claveClub === claveClubEditar) : null;
    const lic = existente?.licenciaConfig || {
        claveClub: "",
        nombreEntidad: "",
        subtituloEntidad: "",
        siglaCodigo: "GYM",
        logoUrl: "/img/logo.png",
        planActivo: "solo_gym",
        modulos: { futbol: false, hockey: false, gym: true },
        adminUsuario: "",
        adminClave: "",
        estadoServicio: "activo"
    };

    let modal = document.getElementById("modalSuperAdminCDM");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "modalSuperAdminCDM";
        modal.className = "modal-backdrop";
        document.body.appendChild(modal);
    }

    const esNuevo = !existente;
    const userMostrar = lic.adminUsuario === "admin" ? "cdm" : (lic.adminUsuario || "");

    modal.innerHTML = `
        <div class="modal-window" style="max-width:680px; text-align:left;">
            <div class="modal-top">
                <div>
                    <span class="badge badge-purple">${esNuevo ? "➕ ALTA DE NUEVO CLIENTE" : "⚙️ CONFIGURACIÓN DEL COMERCIO"}</span>
                    <h3 style="color:var(--ink-900); margin-top:4px;">
                        ${esNuevo ? "Crear Nuevo Club, Gimnasio o Comercio" : `Editar: ${lic.nombreEntidad}`}
                    </h3>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('modalSuperAdminCDM').classList.add('hidden')">✕</button>
            </div>

            <form onsubmit="guardarComercioDesdeModal(event, '${esNuevo ? "" : claveClubEditar}')">
                <!-- 1. DATOS DEL COMERCIO / CLUB -->
                <div style="background:var(--surface-subtle); border:1px solid var(--line-strong); border-radius:16px; padding:1rem; margin-bottom:0.95rem;">
                    <label style="font-size:0.71rem; font-weight:700; color:var(--ink-500); text-transform:uppercase; display:block; margin-bottom:0.5rem;">
                        1. Identidad del Club, Gimnasio o Comercio
                    </label>
                    <div class="grid-3" style="margin-bottom:0.75rem;">
                        <div class="field">
                            <label>Nombre del Comercio / Club *</label>
                            <input type="text" id="mcNombreEntidad" required value="${(lic.nombreEntidad || '').replace(/"/g, '&quot;')}" placeholder="Ej: Gimnasio Olympo">
                        </div>
                        <div class="field">
                            <label>Ciudad / Localidad *</label>
                            <input type="text" id="mcSubtituloEntidad" required value="${(lic.subtituloEntidad || '').replace(/"/g, '&quot;')}" placeholder="Ej: Adelia María">
                        </div>
                        <div class="field">
                            <label>Prefijo Códigos (3 letras) *</label>
                            <input type="text" id="mcSiglaCodigo" required maxlength="5" value="${(lic.siglaCodigo || 'GYM').toUpperCase()}" style="text-transform:uppercase; font-weight:700;">
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">
                        <img id="mcPreviewLogo" src="${lic.logoUrl || '/img/logo.png'}" alt="Logo" style="width:44px; height:44px; object-fit:contain; background:#fff; border-radius:10px; padding:4px; border:1px solid var(--line-strong);" onerror="this.onerror=null; this.src='logo.png';">
                        <div class="field" style="flex:1; min-width:180px;">
                            <input type="text" id="mcLogoUrl" value="${(lic.logoUrl || '/img/logo.png').replace(/"/g, '&quot;')}" placeholder="URL del logo o subí una imagen...">
                        </div>
                        <label class="btn btn-secondary btn-sm" style="cursor:pointer;">
                            <i class="ri-upload-2-line"></i> Subir Logo
                            <input type="file" accept="image/*" onchange="subirLogoEnModalComercio(event)" style="display:none;">
                        </label>
                    </div>
                </div>

                <!-- 2. QUÉ MÓDULOS VA A USAR ESTE CLIENTE -->
                <div style="background:var(--surface-subtle); border:1px solid var(--line-strong); border-radius:16px; padding:1rem; margin-bottom:0.95rem;">
                    <label style="font-size:0.71rem; font-weight:700; color:var(--ink-500); text-transform:uppercase; display:block; margin-bottom:0.5rem;">
                        2. ¿Qué Módulos usa este Cliente? (Seleccioná un Plan o tildá a medida)
                    </label>
                    <div class="grid-3" style="margin-bottom:0.75rem;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="seleccionarPresetEnModalComercio('solo_gym')">
                            🏋️ Solo Gimnasio ($300k)
                        </button>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="seleccionarPresetEnModalComercio('solo_deportes')">
                            ⚽🏑 Solo Deportes ($500k)
                        </button>
                        <button type="button" class="btn btn-primary btn-sm" onclick="seleccionarPresetEnModalComercio('completo')">
                            🏟️ Todo Completo ($600k)
                        </button>
                    </div>
                    <input type="hidden" id="mcPlanActivo" value="${lic.planActivo || 'completo'}">
                    <div class="grid-3">
                        <label style="display:flex; align-items:center; gap:0.5rem; background:var(--surface-solid); border:1px solid var(--line-strong); padding:0.6rem 0.8rem; border-radius:12px; cursor:pointer; font-weight:600; font-size:0.83rem;">
                            <input type="checkbox" id="mcModFutbol" style="width:18px; height:18px; min-height:auto;" ${lic.modulos?.futbol ? "checked" : ""}>
                            <span>⚽ Fútbol</span>
                        </label>
                        <label style="display:flex; align-items:center; gap:0.5rem; background:var(--surface-solid); border:1px solid var(--line-strong); padding:0.6rem 0.8rem; border-radius:12px; cursor:pointer; font-weight:600; font-size:0.83rem;">
                            <input type="checkbox" id="mcModHockey" style="width:18px; height:18px; min-height:auto;" ${lic.modulos?.hockey ? "checked" : ""}>
                            <span>🏑 Hockey</span>
                        </label>
                        <label style="display:flex; align-items:center; gap:0.5rem; background:var(--surface-solid); border:1px solid var(--line-strong); padding:0.6rem 0.8rem; border-radius:12px; cursor:pointer; font-weight:600; font-size:0.83rem;">
                            <input type="checkbox" id="mcModGym" style="width:18px; height:18px; min-height:auto;" ${lic.modulos?.gym ? "checked" : ""}>
                            <span>🏋️ Gimnasio</span>
                        </label>
                    </div>

                    <!-- DEPORTES ADICIONALES PERSONALIZADOS POR CLIENTE -->
                    <div style="margin-top:0.85rem; padding-top:0.75rem; border-top:1px dashed var(--line-strong);">
                        <label style="font-size:0.7rem; font-weight:700; color:var(--ink-500); text-transform:uppercase; display:block; margin-bottom:0.4rem;">
                            ➕ Agregar Otros Deportes al Club (Tocá un botón rápido o escribilos separados por coma)
                        </label>
                        <div style="display:flex; gap:0.35rem; flex-wrap:wrap; margin-bottom:0.5rem;">
                            <button type="button" class="badge badge-celeste" style="cursor:pointer; padding:0.26rem 0.6rem;" onclick="sumarDeporteRapidoModal('🏀 Básquet')">+ 🏀 Básquet</button>
                            <button type="button" class="badge badge-celeste" style="cursor:pointer; padding:0.26rem 0.6rem;" onclick="sumarDeporteRapidoModal('🏐 Vóley')">+ 🏐 Vóley</button>
                            <button type="button" class="badge badge-celeste" style="cursor:pointer; padding:0.26rem 0.6rem;" onclick="sumarDeporteRapidoModal('🎾 Pádel / Tenis')">+ 🎾 Pádel / Tenis</button>
                            <button type="button" class="badge badge-celeste" style="cursor:pointer; padding:0.26rem 0.6rem;" onclick="sumarDeporteRapidoModal('🏉 Rugby')">+ 🏉 Rugby</button>
                            <button type="button" class="badge badge-celeste" style="cursor:pointer; padding:0.26rem 0.6rem;" onclick="sumarDeporteRapidoModal('🛼 Patín')">+ 🛼 Patín</button>
                            <button type="button" class="badge badge-celeste" style="cursor:pointer; padding:0.26rem 0.6rem;" onclick="sumarDeporteRapidoModal('🏊 Natación')">+ 🏊 Natación</button>
                            <button type="button" class="badge badge-celeste" style="cursor:pointer; padding:0.26rem 0.6rem;" onclick="sumarDeporteRapidoModal('🥊 Boxeo')">+ 🥊 Boxeo</button>
                            <button type="button" class="badge badge-celeste" style="cursor:pointer; padding:0.26rem 0.6rem;" onclick="sumarDeporteRapidoModal('🤾 Handball')">+ 🤾 Handball</button>
                        </div>
                        <input type="text" id="mcDeportesExtra" value="${(lic.deportesExtra || []).join(', ').replace(/"/g, '&quot;')}" placeholder="Ej: 🏀 Básquet, 🏐 Vóley, 🎾 Pádel (o dejá vacío si no usa deportes extra)">
                    </div>
                </div>

                <!-- 3. USUARIO Y CONTRASEÑA EXCLUSIVOS PARA ESTE COMERCIO -->
                <div style="background:var(--cdm-50); border:1px solid var(--line-celeste); border-radius:16px; padding:1rem; margin-bottom:1.1rem;">
                    <label style="font-size:0.71rem; font-weight:700; color:var(--cdm-600); text-transform:uppercase; display:block; margin-bottom:0.5rem;">
                        3. Credenciales del Dueño / Profesor (Para que al loguearse entre directo a este comercio)
                    </label>
                    <div class="grid-3">
                        <div class="field">
                            <label>Usuario de este Comercio *</label>
                            <input type="text" id="mcAdminUsuario" required value="${userMostrar.replace(/"/g, '&quot;')}" placeholder="Ej: olympo / cdm">
                        </div>
                        <div class="field">
                            <label>Contraseña *</label>
                            <input type="text" id="mcAdminClave" required value="${(lic.adminClave || '').replace(/"/g, '&quot;')}" placeholder="Ej: oly2026">
                        </div>
                        <div class="field">
                            <label>Estado Mensualidad</label>
                            <select id="mcEstadoServicio">
                                <option value="activo" ${lic.estadoServicio !== "suspendido" ? "selected" : ""}>🟢 Activo (Al día)</option>
                                <option value="suspendido" ${lic.estadoServicio === "suspendido" ? "selected" : ""}>🔴 Pausado (Impago)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                    ${!esNuevo && claveClubEditar !== CLAVE_CLUB_DEFECTO_CDM ? `
                        <button type="button" class="btn btn-danger btn-sm" onclick="eliminarComercioDesdeModal('${claveClubEditar}')">
                            <i class="ri-delete-bin-line"></i> Eliminar Comercio
                        </button>
                    ` : `<span></span>`}
                    <div style="display:flex; gap:0.5rem;">
                        <button type="button" class="btn btn-ghost" onclick="document.getElementById('modalSuperAdminCDM').classList.add('hidden')">Cancelar</button>
                        <button type="submit" class="btn btn-primary">
                            <i class="ri-save-3-line"></i> ${esNuevo ? "Crear Comercio Ahora" : "Guardar Cambios"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    `;
    modal.classList.remove("hidden");
}

function sumarDeporteRapidoModal(nombreConEmoji) {
    const inp = document.getElementById("mcDeportesExtra");
    if (!inp) return;
    const actuales = inp.value.split(",").map(s => s.trim()).filter(Boolean);
    if (!actuales.includes(nombreConEmoji)) {
        actuales.push(nombreConEmoji);
        inp.value = actuales.join(", ");
    }
}

function abrirModalSuperAdminCDM() {
    abrirModalCrearOEditarComercio(obtenerClaveClubActivoCDM());
}

async function guardarComercioDesdeModal(e, claveClubExistente = "") {
    e.preventDefault();
    const futbol = Boolean(document.getElementById("mcModFutbol")?.checked);
    const hockey = Boolean(document.getElementById("mcModHockey")?.checked);
    const gym = Boolean(document.getElementById("mcModGym")?.checked);
    const deportesExtra = (document.getElementById("mcDeportesExtra")?.value || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

    if (!futbol && !hockey && !gym && deportesExtra.length === 0) {
        alert("⚠️ Debés dejar al menos 1 módulo o deporte activo.");
        return;
    }

    const nombre = document.getElementById("mcNombreEntidad").value.trim();
    const subtitulo = document.getElementById("mcSubtituloEntidad").value.trim();
    const sigla = (document.getElementById("mcSiglaCodigo").value.trim() || "CLB").toUpperCase();
    const logoUrl = document.getElementById("mcLogoUrl").value.trim() || "/img/logo.png";
    const planActivo = document.getElementById("mcPlanActivo").value || "personalizado";
    const adminUsuario = document.getElementById("mcAdminUsuario").value.trim().toLowerCase();
    const adminClave = document.getElementById("mcAdminClave").value.trim();
    const estadoServicio = document.getElementById("mcEstadoServicio").value || "activo";

    if (CREDENCIALES_SUPERADMIN.usuarios.includes(adminUsuario)) {
        alert("⚠️ El usuario '" + adminUsuario + "' está reservado para vos como Administrador General. Elegí un nombre de usuario propio para este comercio (ej: 'cdm', 'admin', 'olympo').");
        return;
    }

    const claveFinal = claveClubExistente || (
        nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") + "_" + Math.floor(100 + Math.random() * 899)
    );

    const nuevaLicencia = {
        claveClub: claveFinal,
        nombreEntidad: nombre,
        subtituloEntidad: subtitulo,
        siglaCodigo: sigla,
        logoUrl,
        planActivo,
        modulos: { futbol, hockey, gym },
        deportesExtra,
        adminUsuario,
        adminClave,
        estadoServicio
    };

    if (!claveClubExistente) {
        // Es un comercio nuevo: lo guardamos limpio en el mapa local y en el servidor
        const mapa = obtenerMapaLocalClubesCDM();
        mapa[claveFinal] = {
            claveClub: claveFinal,
            ultimaActualizacionISO: new Date().toISOString(),
            personas: [],
            rutinas: [],
            partidos: [],
            alineaciones: {},
            microciclos: {},
            licenciaConfig: nuevaLicencia
        };
        localStorage.setItem(STORAGE_MAPA_CLUBES_KEY, JSON.stringify(mapa));

        if (window.location.protocol !== "file:") {
            try {
                await fetch("/api/cdm/clubes/nuevo", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ licenciaConfig: nuevaLicencia })
                });
            } catch {}
        }
    } else {
        // Es edición de un comercio existente
        const mapa = obtenerMapaLocalClubesCDM();
        if (mapa[claveFinal]) {
            mapa[claveFinal].licenciaConfig = nuevaLicencia;
            localStorage.setItem(STORAGE_MAPA_CLUBES_KEY, JSON.stringify(mapa));
        }
        if (obtenerClaveClubActivoCDM() === claveFinal) {
            guardarLicenciaConfigCDM(nuevaLicencia);
        }
        if (window.location.protocol !== "file:") {
            try {
                const respEst = await fetch(`/api/cdm/estado?club=${encodeURIComponent(claveFinal)}`);
                if (respEst.ok) {
                    const dEst = await respEst.json();
                    const estActual = dEst.estado || {};
                    estActual.licenciaConfig = nuevaLicencia;
                    await fetch("/api/cdm/estado", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ...estActual, claveClub: claveFinal })
                    });
                }
            } catch {}
        }
    }

    document.getElementById("modalSuperAdminCDM")?.classList.add("hidden");

    const enLogin = window.location.pathname.toLowerCase().includes("login.html") || document.body.classList.contains("login-page");
    if (enLogin) {
        await mostrarHubSelectorDeComercios();
    } else {
        aplicarLicenciaYModulosCDM();
        if (typeof sincronizarSidebarActivoCDM === "function") sincronizarSidebarActivoCDM();
        window.location.reload();
    }
}

async function eliminarComercioDesdeModal(claveClub) {
    if (!claveClub || claveClub === CLAVE_CLUB_DEFECTO_CDM) return;
    if (!confirm("⚠️ ¿Eliminar definitivamente este comercio y sus datos?")) return;

    const mapa = obtenerMapaLocalClubesCDM();
    delete mapa[claveClub];
    localStorage.setItem(STORAGE_MAPA_CLUBES_KEY, JSON.stringify(mapa));

    if (window.location.protocol !== "file:") {
        try {
            await fetch(`/api/cdm/clubes/${encodeURIComponent(claveClub)}`, { method: "DELETE" });
        } catch {}
    }

    document.getElementById("modalSuperAdminCDM")?.classList.add("hidden");
    await mostrarHubSelectorDeComercios();
}

async function enviarCredencialesDeComercioEspecificoWA(claveClub) {
    const lista = await obtenerListaCompletaComerciosCDM();
    const item = lista.find(x => x.claveClub === claveClub);
    const lic = item?.licenciaConfig || obtenerLicenciaConfigCDM();
    const base = window.location.origin && window.location.origin !== "null" ? window.location.origin : "http://localhost:3000";
    const link = `${base}/login.html`;

    const modTxt = [
        lic.modulos?.futbol ? "⚽ Fútbol" : null,
        lic.modulos?.hockey ? "🏑 Hockey" : null,
        lic.modulos?.gym ? "🏋️ Gimnasio & Salud" : null,
        ...(Array.isArray(lic.deportesExtra) ? lic.deportesExtra : [])
    ].filter(Boolean).join(" + ");

    let msg = `🚀 *ACCESO OFICIAL AL SISTEMA — ${(lic.nombreEntidad || "CLUB / GIMNASIO").toUpperCase()}*\n`;
    msg += `----------------------------------\n`;
    msg += `Hola, ya está activa tu cuenta exclusiva para administrar *${lic.nombreEntidad}*:\n\n`;
    msg += `🔗 *Link de Ingreso:* ${link}\n`;
    msg += `👑 *Solapa:* Admin / Comercio\n`;
    msg += `• *Usuario:* ${lic.adminUsuario === "admin" ? "cdm" : lic.adminUsuario}\n`;
    msg += `• *Contraseña:* ${lic.adminClave}\n\n`;
    msg += `📦 *Módulos Habilitados:* ${modTxt}\n`;
    msg += `🔑 *Formato de Códigos de tus Socios:* ${lic.siglaCodigo}-XXXX\n`;
    msg += `----------------------------------\n`;
    msg += `_Desarrollo y Soporte: Gonzalo Adanchú_`;

    const tel = prompt("📱 WhatsApp del dueño o encargado (o dejá vacío para elegir en WhatsApp):", "");
    if (tel === null) return;
    const limpio = tel.replace(/\D/g, "");
    const url = limpio
        ? `https://wa.me/${limpio}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
}

// =========================================================================
// 0. GESTIÓN DE TEMA VISUAL (MODO CLARO / MODO OSCURO PRO)
// =========================================================================

function aplicarTemaGuardadoCDM() {
    const tema = localStorage.getItem(STORAGE_TEMA_KEY) || localStorage.getItem("cdm_tema") || "light";
    const esOscuro = tema === "dark";
    if (esOscuro) {
        document.body.setAttribute("data-theme", "dark");
    } else {
        document.body.removeAttribute("data-theme");
    }
    document.querySelectorAll("#btnToggleTemaCDM, .btn-theme-toggle").forEach(btn => {
        btn.innerHTML = esOscuro
            ? `<i class="ri-sun-fill"></i><span>Modo Día</span>`
            : `<i class="ri-moon-clear-fill"></i><span>Modo Noche</span>`;
    });
}

function alternarTemaVisualCDM() {
    const actual = document.body.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const nuevo = actual === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_TEMA_KEY, nuevo);
    localStorage.setItem("cdm_tema", nuevo);
    aplicarTemaGuardadoCDM();
    if (typeof mostrarToast === "function") {
        mostrarToast(nuevo === "dark" ? "🌙 Modo Noche activado" : "☀️ Modo Día activado");
    }
}

// =========================================================================
// 1. GENERADOR Y SINCRONIZADOR DE CÓDIGOS ÚNICOS (CDM-XXXX)
// =========================================================================

function generarCodigoUnicoCDM(listaExistente = []) {
    const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let bloque = "";
    for (let i = 0; i < 4; i++) {
        bloque += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    const sigla = (obtenerLicenciaConfigCDM().siglaCodigo || "CDM").toUpperCase();
    const codigo = `${sigla}-${bloque}`;
    if (listaExistente.some(p => p && p.codigoAcceso === codigo)) {
        return generarCodigoUnicoCDM(listaExistente);
    }
    return codigo;
}

function asegurarCodigosEnStorage() {
    let personas = [];
    try {
        personas = JSON.parse(localStorage.getItem("cdm_personas_v1")) || [];
    } catch {
        personas = [];
    }

    let modificado = false;
    personas.forEach(p => {
        if (!p.codigoAcceso) {
            p.codigoAcceso = generarCodigoUnicoCDM(personas);
            modificado = true;
        }
    });

    if (modificado) {
        localStorage.setItem("cdm_personas_v1", JSON.stringify(personas));
    }
    if (typeof basePersonas !== "undefined" && Array.isArray(basePersonas)) {
        basePersonas.forEach(p => {
            if (!p.codigoAcceso) {
                const match = personas.find(x => x.id === p.id);
                p.codigoAcceso = match ? match.codigoAcceso : generarCodigoUnicoCDM(basePersonas);
            }
        });
    }
    return personas;
}

function obtenerSesionActivaCDM() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_SESION_KEY)) || null;
    } catch {
        return null;
    }
}

function esAdminCDM() {
    const s = obtenerSesionActivaCDM();
    return Boolean(s && s.rol === "admin");
}

function cerrarSesionCDM() {
    localStorage.removeItem(STORAGE_SESION_KEY);
    sessionStorage.removeItem("cdm_socio_dni_activo");
    window.location.href = "login.html";
}

// =========================================================================
// 2. LÓGICA DE LA PÁGINA LOGIN.HTML (GENÉRICO + HUB MULTI-COMERCIO)
// =========================================================================

function cambiarPestanaLogin(modo) {
    const esUsuario = modo === "usuario";
    document.getElementById("btnTabUsuario")?.classList.toggle("active", esUsuario);
    document.getElementById("btnTabAdmin")?.classList.toggle("active", !esUsuario);
    document.getElementById("formLoginUsuario")?.classList.toggle("hidden", !esUsuario);
    document.getElementById("formLoginAdmin")?.classList.toggle("hidden", esUsuario);
    document.getElementById("cajaErrorLogin")?.classList.add("hidden");
}

function mostrarErrorLogin(texto) {
    const box = document.getElementById("cajaErrorLogin");
    if (!box) {
        alert(texto);
        return;
    }
    box.innerText = texto;
    box.classList.remove("hidden");
}

async function iniciarSesionComoAdmin(e) {
    e.preventDefault();
    const user = (document.getElementById("inputAdminUser")?.value || "").trim().toLowerCase();
    const pass = (document.getElementById("inputAdminPass")?.value || "").trim();

    // 1. SI ES EL ADMIN PRINCIPAL DE TODOS LOS COMERCIOS (gonzalo / admin / superadmin):
    //    Abre el Hub Selector de Comercios, Clubes y Gimnasios para elegir a cuál entrar o crear uno nuevo
    if (CREDENCIALES_SUPERADMIN.usuarios.includes(user) && CREDENCIALES_SUPERADMIN.claves.includes(pass)) {
        asegurarCodigosEnStorage();
        localStorage.setItem(STORAGE_SESION_KEY, JSON.stringify({
            rol: "admin",
            esSuperAdmin: true,
            nombre: "Gonzalo Adanchú (Admin General)",
            fechaIngreso: new Date().toISOString()
        }));
        await mostrarHubSelectorDeComercios();
        return;
    }

    // 2. SI ES EL USUARIO DE UN COMERCIO / CLUB / GIMNASIO ESPECÍFICO (Ej: 'cdm' o 'olympo'):
    //    Detecta a qué comercio pertenece y abre directamente ese comercio con su logo y módulos
    if (window.location.protocol !== "file:") {
        try {
            const resp = await fetch("/api/cdm/auth-admin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usuario: user, clave: pass })
            });
            const data = await resp.json();
            if (resp.status === 403 && data.suspendido) {
                mostrarErrorLogin(data.mensaje || "⚠️ Suscripción mensual en pausa.");
                return;
            }
            if (resp.ok && data.ok && data.estado) {
                cargarEstadoClubEnLocalStorage(data.estado, data.claveClub);
                const lic = data.estado.licenciaConfig || obtenerLicenciaConfigCDM();
                localStorage.setItem(STORAGE_SESION_KEY, JSON.stringify({
                    rol: "admin",
                    esSuperAdmin: false,
                    claveClub: data.claveClub,
                    nombre: `Admin • ${lic.nombreEntidad || "Comercio"}`,
                    fechaIngreso: new Date().toISOString()
                }));
                window.location.href = obtenerPaginaInicialSegunModulos(lic);
                return;
            }
        } catch {}
    }

    // 3. Búsqueda en el catálogo local de comercios (Si coincide usuario y clave del comercio, entra directo al comercio)
    const mapaLocal = obtenerMapaLocalClubesCDM();
    const encontradoLocal = Object.values(mapaLocal).find(c => {
        const u = (c.licenciaConfig?.adminUsuario || "cdm").toLowerCase();
        const p = c.licenciaConfig?.adminClave || "cdm2026";
        const esCdm = c.claveClub === CLAVE_CLUB_DEFECTO_CDM;
        const coincideUser = (u === user) || (esCdm && (user === "cdm" || user === "admin") && (u === "cdm" || u === "admin"));
        return coincideUser && p === pass;
    });

    if (encontradoLocal) {
        if (encontradoLocal.licenciaConfig?.estadoServicio === "suspendido") {
            mostrarErrorLogin("⚠️ Suscripción mensual en pausa. Contactá al administrador general para reactivar el servicio.");
            return;
        }
        cargarEstadoClubEnLocalStorage(encontradoLocal, encontradoLocal.claveClub);
        const lic = encontradoLocal.licenciaConfig || obtenerLicenciaConfigCDM();
        localStorage.setItem(STORAGE_SESION_KEY, JSON.stringify({
            rol: "admin",
            esSuperAdmin: false,
            claveClub: encontradoLocal.claveClub,
            nombre: `Admin • ${lic.nombreEntidad || "Comercio"}`,
            fechaIngreso: new Date().toISOString()
        }));
        window.location.href = obtenerPaginaInicialSegunModulos(lic);
        return;
    }

    mostrarErrorLogin("❌ Usuario o contraseña incorrectos.");
}

async function iniciarSesionConCodigo(e) {
    e.preventDefault();
    const rawInput = (document.getElementById("inputCodigoUsuario")?.value || "").trim().toUpperCase();
    const limpioInput = rawInput.replace(/[^A-Z0-9]/g, "");

    // 1. Buscar el código en todos los clubes/gimnasios del servidor
    if (window.location.protocol !== "file:") {
        try {
            const resp = await fetch("/api/cdm/auth-codigo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ codigo: rawInput })
            });
            if (resp.ok) {
                const data = await resp.json();
                if (data.ok && data.persona && data.estado) {
                    cargarEstadoClubEnLocalStorage(data.estado, data.claveClub);
                }
            }
        } catch {}
    }

    // 2. Buscar también en el mapa local de comercios por si está trabajando local
    let personas = asegurarCodigosEnStorage();
    let encontrado = personas.find(p => {
        if (!p || !p.activo || !p.codigoAcceso) return false;
        const codCompleto = p.codigoAcceso.toUpperCase();
        const codLimpio = codCompleto.replace(/[^A-Z0-9]/g, "");
        const partes = codCompleto.split("-");
        const soloSufijo = partes.length > 1 ? partes[1] : codCompleto;
        return codCompleto === rawInput || codLimpio === limpioInput || soloSufijo === rawInput;
    });

    if (!encontrado) {
        const mapaLocal = obtenerMapaLocalClubesCDM();
        for (const clubObj of Object.values(mapaLocal)) {
            const match = (clubObj.personas || []).find(p => {
                if (!p || !p.activo || !p.codigoAcceso) return false;
                const codCompleto = String(p.codigoAcceso).toUpperCase();
                const codLimpio = codCompleto.replace(/[^A-Z0-9]/g, "");
                return codCompleto === rawInput || codLimpio === limpioInput;
            });
            if (match) {
                cargarEstadoClubEnLocalStorage(clubObj, clubObj.claveClub);
                encontrado = match;
                break;
            }
        }
    }

    if (!encontrado) {
        mostrarErrorLogin("❌ Código personal inválido o inactivo. Verificalo con la administración de tu Club o Gimnasio.");
        return;
    }

    localStorage.setItem(STORAGE_SESION_KEY, JSON.stringify({
        rol: "usuario",
        personaId: encontrado.id,
        dni: encontrado.dni,
        nombre: `${encontrado.nombre} ${encontrado.apellido}`,
        deporte: encontrado.deporte,
        categoria: encontrado.categoria,
        codigo: encontrado.codigoAcceso,
        fechaIngreso: new Date().toISOString()
    }));

    sessionStorage.setItem("cdm_socio_dni_activo", encontrado.dni);
    window.location.href = `jugador.html?id=${encontrado.id}`;
}

// =========================================================================
// 3. MOTOR DE CARGA DE AVANCES SINCRONIZADO (USUARIO + ENTRENADOR/ADMIN)
// =========================================================================

function normalizarNombreEjercicioCDM(txt) {
    return (txt || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function guardarEjercicioEscritoEnListaCDM() {
    const inpEj = document.getElementById("evEjercicio");
    if (!inpEj) return;
    let val = inpEj.value.trim();
    if (!val) {
        val = (prompt("✨ Escribí el nombre del nuevo ejercicio para agregarlo a la lista:", "") || "").trim();
        if (!val) return;
        inpEj.value = val;
    }

    const tipo = document.getElementById("evTipo")?.value || "fuerza_kg";
    let nombreGuardado = val;
    if (typeof agregarEjercicioInventadoAlCatalogoCDM === "function") {
        nombreGuardado = agregarEjercicioInventadoAlCatalogoCDM(val, tipo === "fuerza_kg" ? "fuerza_1rm" : tipo, false) || val;
    } else if (typeof baseCatalogoEjercicios !== "undefined" && Array.isArray(baseCatalogoEjercicios)) {
        const clave = normalizarNombreEjercicioCDM(val);
        const ex = baseCatalogoEjercicios.find(e => normalizarNombreEjercicioCDM(e.nombre) === clave);
        if (!ex) {
            baseCatalogoEjercicios.push({ id: "ej_" + Date.now(), nombre: val, tipo: "fuerza_1rm", personalizado: true });
            localStorage.setItem("cdm_catalogo_ej_v1", JSON.stringify(baseCatalogoEjercicios));
            if (typeof mostrarToast === "function") mostrarToast(`✨ Ejercicio "${val}" agregado a la lista.`);
        } else {
            nombreGuardado = ex.nombre;
        }
    }

    inpEj.value = nombreGuardado;
    inyectarAsistenteEjerciciosEnFormulario();
    document.getElementById("evValor")?.focus();
}

function inyectarAsistenteEjerciciosEnFormulario() {
    const inpEj = document.getElementById("evEjercicio");
    if (!inpEj || typeof obtenerJugadorActualPorURL !== "function") return;

    const p = obtenerJugadorActualPorURL();
    if (!p) return;

    // Agregar botón "+ Agregar a la lista" al lado del input de ejercicio si aún no está envuelto
    if (!document.getElementById("btnGuardarEjercicioNuevoLista")) {
        const wrapInput = document.createElement("div");
        wrapInput.style = "display:flex; gap:0.4rem; align-items:center;";
        inpEj.parentNode.insertBefore(wrapInput, inpEj);
        wrapInput.appendChild(inpEj);

        const btnAddList = document.createElement("button");
        btnAddList.type = "button";
        btnAddList.id = "btnGuardarEjercicioNuevoLista";
        btnAddList.className = "btn btn-secondary btn-sm";
        btnAddList.style = "flex-shrink:0; padding:0.45rem 0.7rem;";
        btnAddList.title = "Guardar el ejercicio escrito en la lista general";
        btnAddList.onclick = guardarEjercicioEscritoEnListaCDM;
        btnAddList.innerHTML = `<i class="ri-add-line"></i> A la lista`;
        wrapInput.appendChild(btnAddList);
    }

    // 1. Recolectar ejercicios ya cargados por el Profe/Admin o el Deportista en su historial
    const conteoHistorial = {};
    (p.evaluaciones || []).forEach(ev => {
        if (!ev.ejercicio) return;
        conteoHistorial[ev.ejercicio] = (conteoHistorial[ev.ejercicio] || 0) + 1;
    });
    const ejerciciosHistorial = Object.keys(conteoHistorial);

    // 2. Recolectar ejercicios de las rutinas asignadas a esta persona o su categoría
    const ejerciciosRutinas = [];
    if (typeof baseRutinas !== "undefined" && Array.isArray(baseRutinas)) {
        const rutinasPersona = baseRutinas.filter(r =>
            r.personaId === p.id ||
            (r.esGrupal && r.deporteDestino === p.deporte && r.categoriaDestino === p.categoria) ||
            (r.esGrupal && p.deporte === "Gimnasio" && r.deporteDestino === "Gimnasio")
        );
        rutinasPersona.forEach(r => {
            (r.ejercicios || []).forEach(ex => {
                if (ex.nombre && !ejerciciosHistorial.some(h => normalizarNombreEjercicioCDM(h) === normalizarNombreEjercicioCDM(ex.nombre)) &&
                    !ejerciciosRutinas.some(er => normalizarNombreEjercicioCDM(er) === normalizarNombreEjercicioCDM(ex.nombre))) {
                    ejerciciosRutinas.push(ex.nombre);
                }
            });
        });
    }

    // 3. Recolectar ejercicios inventados/personalizados del catálogo global
    const ejerciciosInventados = [];
    if (typeof baseCatalogoEjercicios !== "undefined" && Array.isArray(baseCatalogoEjercicios)) {
        baseCatalogoEjercicios.forEach(e => {
            if (e.nombre && !ejerciciosHistorial.some(h => normalizarNombreEjercicioCDM(h) === normalizarNombreEjercicioCDM(e.nombre)) &&
                !ejerciciosRutinas.some(er => normalizarNombreEjercicioCDM(er) === normalizarNombreEjercicioCDM(e.nombre)) &&
                !ejerciciosInventados.some(ei => normalizarNombreEjercicioCDM(ei) === normalizarNombreEjercicioCDM(e.nombre))) {
                ejerciciosInventados.push(e.nombre);
            }
        });
    }

    // 4. Actualizar el <datalist id="listaEjerciciosSugeridos"> con todos los ejercicios reales + inventados
    const datalist = document.getElementById("listaEjerciciosSugeridos");
    if (datalist) {
        const sugeridosBase = [
            "Sentadilla Trasera",
            "Press de Banca Plano",
            "Peso Muerto Rumano",
            "Dominadas / Jalón al Pecho",
            "Hip Thrust con Barra",
            "Sentadilla Búlgara Unilateral",
            "Salto al Cajón / CMJ",
            "Sprint 20 metros"
        ];
        const todosUnicos = [...new Set([...ejerciciosHistorial, ...ejerciciosRutinas, ...ejerciciosInventados, ...sugeridosBase])];
        datalist.innerHTML = todosUnicos.map(nom => `<option value="${nom.replace(/"/g, '&quot;')}">`).join("");
    }

    // 5. Inyectar botonera rápida de chips debajo del input de ejercicio para elegir en 1 toque
    let boxChips = document.getElementById("chipsEjerciciosActivosJugador");
    if (!boxChips) {
        boxChips = document.createElement("div");
        boxChips.id = "chipsEjerciciosActivosJugador";
        boxChips.style = "margin-top:0.5rem; display:flex; flex-direction:column; gap:0.35rem;";
        inpEj.closest(".field")?.appendChild(boxChips);
    }

    let htmlChips = `<small style="color:var(--ink-500); font-size:0.71rem; font-weight:700;">⚡ Tocá un ejercicio de la lista o escribí uno nuevo arriba y tocá "+ A la lista":</small><div style="display:flex; gap:0.35rem; flex-wrap:wrap; max-height:115px; overflow-y:auto; padding-bottom:2px;">`;

    ejerciciosHistorial.forEach(nom => {
        const nomEsc = nom.replace(/'/g, "\\'");
        htmlChips += `
            <button type="button" class="badge badge-celeste" style="cursor:pointer; border:1px solid var(--line-celeste); padding:0.28rem 0.65rem;" onclick="seleccionarEjercicioRapidoAvance('${nomEsc}')">
                📈 ${nom} (${conteoHistorial[nom]})
            </button>
        `;
    });

    ejerciciosRutinas.forEach(nom => {
        const nomEsc = nom.replace(/'/g, "\\'");
        htmlChips += `
            <button type="button" class="badge badge-purple" style="cursor:pointer; padding:0.28rem 0.65rem;" onclick="seleccionarEjercicioRapidoAvance('${nomEsc}')">
                🏋️ ${nom}
            </button>
        `;
    });

    ejerciciosInventados.forEach(nom => {
        const nomEsc = nom.replace(/'/g, "\\'");
        htmlChips += `
            <button type="button" class="badge badge-ok" style="cursor:pointer; padding:0.28rem 0.65rem;" onclick="seleccionarEjercicioRapidoAvance('${nomEsc}')">
                🏷️ ${nom}
            </button>
        `;
    });

    htmlChips += `</div>`;
    boxChips.innerHTML = htmlChips;
}

function seleccionarEjercicioRapidoAvance(nombreEjercicio) {
    const inpEj = document.getElementById("evEjercicio");
    if (inpEj) {
        inpEj.value = nombreEjercicio;
    }
    const selFiltro = document.getElementById("selectFiltroEjercicioGrafico");
    if (selFiltro) {
        const existeOpcion = Array.from(selFiltro.options).some(opt => opt.value === nombreEjercicio);
        if (existeOpcion && typeof dibujarGraficoEvolucion === "function") {
            selFiltro.value = nombreEjercicio;
            dibujarGraficoEvolucion();
        }
    }
    const inpVal = document.getElementById("evValor");
    if (inpVal) inpVal.focus();
}

function irACargarAvanceEjercicioDesdeRutina(nombreEjercicio) {
    const btnTabGraficos = document.querySelector('.module-tabs .mod-tab[data-user-tab="graficos"]') || document.querySelector(".module-tabs .mod-tab");
    if (typeof cambiarTabFichaJugador === "function") {
        cambiarTabFichaJugador("graficos", btnTabGraficos);
    }

    // Si este ejercicio ya existe en el historial con variaciones mínimas, usar el nombre exacto del historial
    let nombreFinal = nombreEjercicio;
    if (typeof obtenerJugadorActualPorURL === "function") {
        const p = obtenerJugadorActualPorURL();
        if (p && Array.isArray(p.evaluaciones)) {
            const clave = normalizarNombreEjercicioCDM(nombreEjercicio);
            const match = p.evaluaciones.find(ev =>
                normalizarNombreEjercicioCDM(ev.ejercicio) === clave ||
                normalizarNombreEjercicioCDM(ev.ejercicio).includes(clave) ||
                clave.includes(normalizarNombreEjercicioCDM(ev.ejercicio))
            );
            if (match) nombreFinal = match.ejercicio;
        }
    }

    seleccionarEjercicioRapidoAvance(nombreFinal);
    const form = document.getElementById("formNuevoAvance");
    if (form) {
        form.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (typeof mostrarToast === "function") {
        mostrarToast(`📈 Cargá tus kilos y repeticiones para "${nombreFinal}"`);
    }
}

// Interceptar y enriquecer inicializarPaginaJugadorIndividual y registrarAvanceJugador para mantener todo sincronizado
function enlazarHooksAvanceJugador() {
    if (window.__cdmHooksAvanceListos) return;
    window.__cdmHooksAvanceListos = true;

    if (typeof window.inicializarPaginaJugadorIndividual === "function") {
        const originalInit = window.inicializarPaginaJugadorIndividual;
        window.inicializarPaginaJugadorIndividual = function () {
            originalInit.apply(this, arguments);
            inyectarAsistenteEjerciciosEnFormulario();
            const sesion = obtenerSesionActivaCDM();
            if (sesion && sesion.rol === "usuario") {
                agregarBotonesVideoEnRutinasJugador(sesion);
                renderizarRankingModoUsuario(sesion);
            } else if (sesion && sesion.rol === "admin") {
                inyectarPanelCodigoEnFichaIndividual();
            }
        };
    }

    if (typeof window.registrarAvanceJugador === "function") {
        window.registrarAvanceJugador = function (e) {
            e.preventDefault();
            const p = typeof obtenerJugadorActualPorURL === "function" ? obtenerJugadorActualPorURL() : null;
            if (!p) return;

            const fecha = document.getElementById("evFecha")?.value || (typeof obtenerHoyISO === "function" ? obtenerHoyISO() : new Date().toISOString().split("T")[0]);
            const ejercicioInput = (document.getElementById("evEjercicio")?.value || "").trim();
            if (!ejercicioInput) return;

            // Unificar nombre con historial existente o agregar el nuevo ejercicio inventado a la lista global
            const claveInput = normalizarNombreEjercicioCDM(ejercicioInput);
            const matchExistente = (p.evaluaciones || []).find(ev => normalizarNombreEjercicioCDM(ev.ejercicio) === claveInput);
            const tipo = document.getElementById("evTipo")?.value || "fuerza_kg";
            const ejercicio = matchExistente
                ? matchExistente.ejercicio
                : (typeof agregarEjercicioInventadoAlCatalogoCDM === "function"
                    ? (agregarEjercicioInventadoAlCatalogoCDM(ejercicioInput, tipo === "fuerza_kg" ? "fuerza_1rm" : tipo, false) || ejercicioInput)
                    : ejercicioInput);
            const notaInput = (document.getElementById("evNota")?.value || "").trim();
            const sesion = obtenerSesionActivaCDM();
            const etiquetaOrigen = (sesion && sesion.rol === "usuario") ? "👤 Cargado por Deportista" : "👨‍🏫 Cargado por Profe";
            const nota = notaInput ? `${etiquetaOrigen} • ${notaInput}` : etiquetaOrigen;

            let valorGrafico = 0, unidad = "", detalle = "";

            if (tipo === "fuerza_kg") {
                const kg = parseFloat(document.getElementById("evValor")?.value) || 0;
                const reps = parseInt(document.getElementById("evReps")?.value) || 1;
                const rm = Math.round((reps === 1 ? kg : kg * (1 + reps / 30)) * 10) / 10;
                const fRel = (rm / (p.peso || 70)).toFixed(2);
                valorGrafico = rm;
                unidad = "kg (1RM)";
                detalle = `${kg} kg × ${reps} reps (1RM: ${rm} kg • F.Rel: ${fRel}x)`;
            } else if (tipo === "unilateral") {
                const izq = parseFloat(document.getElementById("evIzq")?.value) || 0;
                const der = parseFloat(document.getElementById("evDer")?.value) || 0;
                const prom = Math.round(((izq + der) / 2) * 10) / 10;
                const asim = Math.round((Math.abs(izq - der) / Math.max(izq, der, 1)) * 1000) / 10;
                valorGrafico = prom;
                unidad = "prom";
                detalle = `Izq: ${izq} | Der: ${der} (Asimetría: ${asim}% ${asim > 12 ? "⚠️" : "✓"})`;
            } else if (tipo === "salto_cm") {
                const cm = parseFloat(document.getElementById("evValor")?.value) || 0;
                const watts = Math.round((60.7 * cm) + (45.3 * (p.peso || 70)) - 2055);
                valorGrafico = cm;
                unidad = "cm";
                detalle = `${cm} cm (${watts > 0 ? watts : 0} W)`;
            } else if (tipo === "tiempo_seg") {
                const seg = parseFloat(document.getElementById("evValor")?.value) || 0;
                valorGrafico = seg;
                unidad = "seg";
                detalle = `${seg} seg`;
            } else {
                const v = parseFloat(document.getElementById("evValor")?.value) || 0;
                valorGrafico = v;
                unidad = "reps";
                detalle = `${v} reps`;
            }

            if (!Array.isArray(p.evaluaciones)) p.evaluaciones = [];
            p.evaluaciones.push({
                id: Date.now(),
                fecha,
                ejercicio,
                tipo,
                valor: valorGrafico,
                unidad,
                detalle,
                nota,
                cargadoPor: sesion?.rol || "admin"
            });
            p.evaluaciones.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

            if (typeof guardarDatosCDM === "function") {
                guardarDatosCDM();
            } else {
                localStorage.setItem("cdm_personas_v1", JSON.stringify(basePersonas));
            }

            if (document.getElementById("evValor")) document.getElementById("evValor").value = "";
            if (document.getElementById("evNota")) document.getElementById("evNota").value = "";
            if (typeof mostrarToast === "function") {
                mostrarToast(`📈 Avance sumado a "${ejercicio}" (${detalle})`);
            }

            window.inicializarPaginaJugadorIndividual();
            const selFiltro = document.getElementById("selectFiltroEjercicioGrafico");
            if (selFiltro) {
                selFiltro.value = ejercicio;
                if (typeof dibujarGraficoEvolucion === "function") dibujarGraficoEvolucion();
            }
        };
    }
}

// =========================================================================
// 4. GUARDIA ESTRICTO DE RUTAS Y AISLAMIENTO EN MODO CÁPSULA (ROL USUARIO)
// =========================================================================

function verificarAccesoYRolEnApp() {
    aplicarTemaGuardadoCDM();
    aplicarLicenciaYModulosCDM();
    enlazarHooksAvanceJugador();
    inyectarAsistenteEjerciciosEnFormulario();

    const path = window.location.pathname.toLowerCase();
    const esPaginaLogin = path.includes("login.html") || document.body.classList.contains("login-page");
    const sesion = obtenerSesionActivaCDM();

    if (!sesion && !esPaginaLogin) {
        window.location.replace("login.html");
        return;
    }

    if (esPaginaLogin) {
        const params = new URLSearchParams(window.location.search);
        if (params.get("hub") === "1" && sesion && sesion.esSuperAdmin) {
            mostrarHubSelectorDeComercios();
        }
        return;
    }

    if (!sesion) return;

    asegurarCodigosEnStorage();
    document.body.setAttribute("data-rol", sesion.rol);

    // SI ES USUARIO: Prohibir que entre a index, futbol, hockey, gym o a la ficha de OTRO jugador
    if (sesion.rol === "usuario") {
        const esFichaIndividual = document.body.dataset.page === "perfil-individual" || path.includes("jugador.html");
        const params = new URLSearchParams(window.location.search);
        const idUrl = parseInt(params.get("id"));

        if (!esFichaIndividual || idUrl !== Number(sesion.personaId)) {
            window.location.replace(`jugador.html?id=${sesion.personaId}`);
            return;
        }

        window.irAPaginaIndividual = function (idDestino) {
            if (Number(idDestino) !== Number(sesion.personaId)) {
                if (typeof mostrarToast === "function") {
                    mostrarToast("🔒 Acceso privado: Solo podés consultar tu propio expediente.");
                }
                return;
            }
        };

        activarBlindajeAntiDescargaYCaptura(sesion);
        inyectarModulosExclusivosUsuario(sesion);
    }

    inyectarCSSRestriccionesRol();
    inyectarBarraSesionTopbar(sesion);

    if (sesion.rol === "admin") {
        inyectarPanelCodigoEnFichaIndividual();
    }
}

// =========================================================================
// 5. ESCUDO ANTI-DESCARGA, ANTI-COPIADO Y ANTI-CAPTURA DE PANTALLA
// =========================================================================

function activarBlindajeAntiDescargaYCaptura(sesion) {
    if (window.__cdmBlindajeActivo) return;
    window.__cdmBlindajeActivo = true;

    const entidad = (obtenerLicenciaConfigCDM().nombreEntidad || "la plataforma").trim();

    // 1. Anular impresión / exportación a PDF por JS
    window.print = function () {
        if (typeof mostrarToast === "function") {
            mostrarToast("🔒 La descarga y exportación de datos están deshabilitadas.");
        }
    };

    // 2. Bloquear instalación/descarga como PWA
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        return false;
    });

    // 3. Bloquear clic derecho, copiar, cortar y arrastrar
    document.addEventListener("contextmenu", (e) => e.preventDefault());
    document.addEventListener("copy", (e) => {
        e.clipboardData?.setData("text/plain", `🔒 Contenido protegido — ${entidad}`);
        e.preventDefault();
    });
    document.addEventListener("cut", (e) => e.preventDefault());
    document.addEventListener("dragstart", (e) => e.preventDefault());

    // 4. Escudo ante intentos explícitos de captura o inspección (SIN molestar al cambiar a Spotify/WhatsApp)
    let shield = document.getElementById("cdmAntiCaptureShield");
    if (!shield) {
        shield = document.createElement("div");
        shield.id = "cdmAntiCaptureShield";
        shield.innerHTML = `
            <div style="text-align:center; padding:2rem; max-width:390px; background:rgba(13,24,41,0.92); border:1px solid rgba(56,189,248,0.3); border-radius:24px; box-shadow:0 24px 48px rgba(0,0,0,0.6);">
                <i class="ri-shield-keyhole-fill" style="font-size:2.8rem; color:#38bdf8;"></i>
                <h3 style="color:#ffffff; margin-top:0.5rem; font-size:1.18rem;">Contenido Protegido</h3>
                <p style="color:#94a3b8; font-size:0.83rem; margin-top:0.45rem; line-height:1.5;">
                    Por privacidad de <b>${entidad}</b>, las capturas y descargas están deshabilitadas en esta vista.
                </p>
                <button type="button" class="btn btn-primary btn-sm" style="margin-top:1.1rem; width:100%;" onclick="document.getElementById('cdmAntiCaptureShield').classList.remove('active')">
                    Continuar en mi Panel
                </button>
            </div>
        `;
        document.body.appendChild(shield);
    }

    // 5. Interceptar teclas de captura (PrintScreen, Win+Shift+S, Cmd+Shift+3/4, Ctrl+P, Ctrl+S, F12)
    window.addEventListener("keydown", (e) => {
        const key = (e.key || "").toLowerCase();
        const esPrintScreen = e.key === "PrintScreen" || e.keyCode === 44;
        const esAtajoCapturaMac = e.metaKey && e.shiftKey && (key === "3" || key === "4" || key === "5" || key === "s");
        const esAtajoCapturaWin = (e.metaKey || e.ctrlKey) && e.shiftKey && key === "s";
        const esDescargaOImpresion = (e.ctrlKey || e.metaKey) && (key === "p" || key === "s" || key === "u" || key === "c");
        const esInspector = e.key === "F12" || ((e.ctrlKey || e.metaKey) && e.shiftKey && (key === "i" || key === "j" || key === "c"));

        if (esPrintScreen || esAtajoCapturaMac || esAtajoCapturaWin || esDescargaOImpresion || esInspector) {
            e.preventDefault();
            e.stopPropagation();
            shield.classList.add("active");
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(`🔒 Captura bloqueada por ${entidad}`).catch(() => {});
            }
            if (typeof mostrarToast === "function") {
                mostrarToast("🔒 Las capturas de pantalla y descargas están deshabilitadas.");
            }
            return false;
        }
    }, true);

    window.addEventListener("keyup", (e) => {
        if (e.key === "PrintScreen" || e.keyCode === 44) {
            shield.classList.add("active");
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText("").catch(() => {});
            }
        }
    }, true);

    // 6. Marca de Agua Forense Ultra-Sutil
    if (!document.getElementById("cdmWatermarkOverlay")) {
        const wm = document.createElement("div");
        wm.id = "cdmWatermarkOverlay";
        const textoMarca = `${sesion.nombre} • ${sesion.codigo}`;
        let bloques = "";
        for (let i = 0; i < 20; i++) {
            bloques += `<span>${textoMarca}</span>`;
        }
        wm.innerHTML = bloques;
        document.body.appendChild(wm);
    }
}

// =========================================================================
// 6. PORTAL DEL DEPORTISTA / SOCIO: INICIO DE TARJETAS GRANDES (RUTINAS + VIDEOS REFERENCIAS)
// =========================================================================

function abrirSeccionUsuarioDesdeCard(nombreSeccion) {
    const btnTab = document.querySelector(`.module-tabs .mod-tab[data-user-tab="${nombreSeccion}"]`);
    if (typeof cambiarTabFichaJugador === "function") {
        cambiarTabFichaJugador(nombreSeccion, btnTab);
    }
    const sesion = obtenerSesionActivaCDM();
    if (nombreSeccion === "rutinas" && sesion) {
        agregarBotonesVideoEnRutinasJugador(sesion);
    } else if (nombreSeccion === "videoteca-user") {
        renderizarVideotecaModoUsuario();
    } else if (nombreSeccion === "ranking-user" && sesion) {
        renderizarRankingModoUsuario(sesion);
    } else if (nombreSeccion === "graficos") {
        if (typeof dibujarGraficoEvolucion === "function") dibujarGraficoEvolucion();
        const p = typeof obtenerJugadorActualPorURL === "function" ? obtenerJugadorActualPorURL() : null;
        if (p && typeof dibujarRadarJugador === "function") dibujarRadarJugador(p);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function obtenerRutinasDisponiblesParaUsuarioCDM(p) {
    if (!p || typeof baseRutinas === "undefined" || !Array.isArray(baseRutinas)) return [];
    return baseRutinas.filter(r =>
        Number(r.personaId) === Number(p.id) ||
        (r.esGrupal && r.deporteDestino === p.deporte && r.categoriaDestino === p.categoria) ||
        (r.esGrupal && r.deporteDestino === "Gimnasio")
    );
}

function calcularProgresoSeriesRutinasHoyCDM(rutinas) {
    const mapaSeries = obtenerMapaSeriesHoyCDM();
    let totalSeries = 0;
    let completadas = 0;
    (rutinas || []).forEach(r => {
        (r.ejercicios || []).forEach((ex, i) => {
            const cant = Math.min(8, Math.max(1, parseInt(ex.series) || 4));
            totalSeries += cant;
            for (let s = 1; s <= cant; s++) {
                if (mapaSeries[`${r.id}_${i}_S${s}`]) completadas++;
            }
        });
    });
    const pct = totalSeries > 0 ? Math.round((completadas / totalSeries) * 100) : 0;
    return { totalSeries, completadas, pct };
}

function renderizarInicioTarjetasGrandesUsuario(sesion) {
    const cont = document.getElementById("contenedorCardsInicioUsuario");
    if (!cont) return;

    const p = (typeof basePersonas !== "undefined" ? basePersonas : []).find(x => Number(x.id) === Number(sesion.personaId));
    const misRutinas = p ? obtenerRutinasDisponiblesParaUsuarioCDM(p) : [];
    if (typeof asegurarVideotecaCargada === "function") asegurarVideotecaCargada();
    const totalVideos = typeof baseVideoteca !== "undefined" && Array.isArray(baseVideoteca) ? baseVideoteca.length : 0;
    const totalMarcas = p && Array.isArray(p.evaluaciones) ? p.evaluaciones.length : 0;

    const progHoy = calcularProgresoSeriesRutinasHoyCDM(misRutinas);
    const evalsFuerza = p && Array.isArray(p.evaluaciones) ? p.evaluaciones.filter(e => e.tipo === "fuerza_kg") : [];
    const mejorRM = evalsFuerza.length ? Math.max(...evalsFuerza.map(e => Number(e.valor) || 0)) : 80;
    const scoreActual = p && p.deporte !== "Gimnasio" && p.puntosCategoria ? `⭐ ${p.puntosCategoria}/10` : "🏆 PRs";
    const saludEstado = p?.estadoMedico === "Óptimo" || !p?.estadoMedico ? "🟢 Óptimo" : `🏥 ${p.estadoMedico}`;

    const planPrincipalNombre = misRutinas.length > 0 ? misRutinas[0].nombre : "Sin plan asignado aún";

    cont.innerHTML = `
        <!-- FILA PRINCIPAL: 2 MEGA TARJETAS VISUALES CON POCO TEXTO Y ALTO IMPACTO -->
        <div class="user-hero-cards-grid">
            <!-- CARD 1: MIS RUTINAS -->
            <div class="user-mega-card card-rutinas-hero" onclick="abrirSeccionUsuarioDesdeCard('rutinas')">
                <div class="user-mega-card-top">
                    <span class="user-mega-badge"><i class="ri-flashlight-fill"></i> ENTRENO HOY</span>
                    <span class="user-mega-counter">${misRutinas.length} ${misRutinas.length === 1 ? "Rutina" : "Rutinas"}</span>
                </div>

                <div class="user-mega-head-row">
                    <div class="user-mega-icon-wrap">
                        <i class="ri-file-list-3-fill"></i>
                    </div>
                    <div class="user-mega-body">
                        <h3>Mis Rutinas</h3>
                        <p>${planPrincipalNombre}</p>
                    </div>
                </div>

                <div class="user-mega-progress-box">
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.74rem; font-weight:700; margin-bottom:6px;">
                        <span style="color:#bae6fd;">Series de hoy</span>
                        <span style="color:#34d399;">${progHoy.completadas}/${progHoy.totalSeries} (${progHoy.pct}%)</span>
                    </div>
                    <div class="user-mega-progress-track">
                        <div class="user-mega-progress-fill" style="width:${progHoy.pct}%;"></div>
                    </div>
                </div>

                <div class="user-mega-cta">
                    <span>Entrar a Mis Rutinas</span>
                    <i class="ri-arrow-right-circle-fill"></i>
                </div>
            </div>

            <!-- CARD 2: VIDEOS REFERENCIAS -->
            <div class="user-mega-card card-videos-hero" onclick="abrirSeccionUsuarioDesdeCard('videoteca-user')">
                <div class="user-mega-card-top">
                    <span class="user-mega-badge"><i class="ri-vidicon-fill"></i> BIOMECÁNICA HD</span>
                    <span class="user-mega-counter" style="background:linear-gradient(135deg, #6366f1, #8b5cf6);">${totalVideos} Videos</span>
                </div>

                <div class="user-mega-head-row">
                    <div class="user-mega-icon-wrap">
                        <i class="ri-movie-2-fill"></i>
                    </div>
                    <div class="user-mega-body">
                        <h3>Videos Referencias</h3>
                        <p>Ejecución técnica por grupo muscular</p>
                    </div>
                </div>

                <div class="user-mega-tags">
                    <span>🦵 Piernas</span>
                    <span>💪 Torso</span>
                    <span>🏋️ Espalda</span>
                    <span>⚡ Potencia</span>
                </div>

                <div class="user-mega-cta">
                    <span>Explorar Videos</span>
                    <i class="ri-play-circle-fill"></i>
                </div>
            </div>
        </div>

        <!-- FILA SECUNDARIA: 4 BENTO CARDS COMPACTAS Y LIMPIAS -->
        <div class="user-sub-cards-grid">
            <div class="user-sub-card accent-blue" onclick="abrirSeccionUsuarioDesdeCard('graficos')">
                <div class="user-sub-card-head">
                    <div class="user-sub-icon"><i class="ri-line-chart-fill"></i></div>
                    <span class="badge badge-celeste">${totalMarcas} marcas</span>
                </div>
                <div class="user-sub-info">
                    <h4>Mi Progreso</h4>
                    <p>Cargar peso y curva 1RM</p>
                </div>
                <div class="user-sub-footer">
                    <span>Abrir</span>
                    <i class="ri-arrow-right-line"></i>
                </div>
            </div>

            <div class="user-sub-card accent-purple" onclick="abrirSeccionUsuarioDesdeCard('calculadora')">
                <div class="user-sub-card-head">
                    <div class="user-sub-icon purple"><i class="ri-calculator-fill"></i></div>
                    <span class="badge badge-purple">1RM: ${mejorRM} kg</span>
                </div>
                <div class="user-sub-info">
                    <h4>Tabla % 1RM</h4>
                    <p>Kilos exactos por porcentaje</p>
                </div>
                <div class="user-sub-footer">
                    <span>Calcular</span>
                    <i class="ri-arrow-right-line"></i>
                </div>
            </div>

            <div class="user-sub-card accent-emerald" onclick="abrirSeccionUsuarioDesdeCard('ranking-user')">
                <div class="user-sub-card-head">
                    <div class="user-sub-icon ok"><i class="ri-trophy-fill"></i></div>
                    <span class="badge badge-ok">${scoreActual}</span>
                </div>
                <div class="user-sub-info">
                    <h4>Ranking Oficial</h4>
                    <p>Posiciones y récords PR</p>
                </div>
                <div class="user-sub-footer">
                    <span>Ver tabla</span>
                    <i class="ri-arrow-right-line"></i>
                </div>
            </div>

            <div class="user-sub-card accent-amber" onclick="abrirSeccionUsuarioDesdeCard('clinica')">
                <div class="user-sub-card-head">
                    <div class="user-sub-icon warn"><i class="ri-heart-pulse-fill"></i></div>
                    <span class="badge badge-ok">${saludEstado}</span>
                </div>
                <div class="user-sub-info">
                    <h4>Check-in Salud</h4>
                    <p>${p?.peso || 70} kg • Sueño y RPE</p>
                </div>
                <div class="user-sub-footer">
                    <span>Registrar</span>
                    <i class="ri-arrow-right-line"></i>
                </div>
            </div>
        </div>
    `;
}

function inyectarBotonVolverInicioEnSeccionUsuario(secEl) {
    if (!secEl || secEl.querySelector(".user-back-home-bar")) return;
    const bar = document.createElement("div");
    bar.className = "user-back-home-bar";
    bar.innerHTML = `
        <button type="button" class="btn btn-secondary btn-sm" onclick="abrirSeccionUsuarioDesdeCard('inicio-user')">
            <i class="ri-home-5-fill"></i> Volver al Inicio (Tarjetas Principales)
        </button>
        <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
            <button type="button" class="btn btn-ghost btn-sm" onclick="abrirSeccionUsuarioDesdeCard('rutinas')">
                <i class="ri-clipboard-line"></i> Mis Rutinas
            </button>
            <button type="button" class="btn btn-ghost btn-sm" onclick="abrirSeccionUsuarioDesdeCard('videoteca-user')">
                <i class="ri-movie-2-line"></i> Videos Referencias
            </button>
        </div>
    `;
    secEl.prepend(bar);
}

function inyectarModulosExclusivosUsuario(sesion) {
    const main = document.querySelector(".app-content");
    const tabsBar = document.querySelector(".module-tabs");
    if (!main || !tabsBar) return;

    const tituloPanelAvance = document.querySelector("#jug-sec-graficos .split-view > .app-panel:first-child .panel-head h3");
    if (tituloPanelAvance) {
        tituloPanelAvance.innerHTML = `<i class="ri-add-circle-line"></i> Cargar Mi Avance / Marca`;
    }
    const tituloPanelClinico = document.querySelector("#jug-sec-clinica .split-view > .app-panel:first-child .panel-head h3");
    if (tituloPanelClinico) {
        tituloPanelClinico.innerHTML = `<i class="ri-heart-pulse-line"></i> Mi Check-in Diario (Peso, Sueño y Fatiga RPE)`;
    }

    if (!document.getElementById("modalVideoEjercicio")) {
        const mv = document.createElement("div");
        mv.id = "modalVideoEjercicio";
        mv.className = "modal-backdrop hidden";
        document.body.appendChild(mv);
    }

    // Si ya se inyectó la pantalla de Inicio de Tarjetas Grandes, solo refrescar sus datos
    if (document.getElementById("jug-sec-inicio-user")) {
        renderizarInicioTarjetasGrandesUsuario(sesion);
        agregarBotonesVideoEnRutinasJugador(sesion);
        renderizarVideotecaModoUsuario();
        renderizarRankingModoUsuario(sesion);
        return;
    }

    // 1. Crear Sección Principal de Inicio con Tarjetas Grandes (#jug-sec-inicio-user)
    const secInicio = document.createElement("section");
    secInicio.id = "jug-sec-inicio-user";
    secInicio.className = "jug-seccion animate-in";
    secInicio.innerHTML = `<div id="contenedorCardsInicioUsuario"></div>`;
    main.insertBefore(secInicio, document.getElementById("jug-sec-graficos"));

    // 2. Crear Sección de Videos Referencias (#jug-sec-videoteca-user)
    const secVid = document.createElement("section");
    secVid.id = "jug-sec-videoteca-user";
    secVid.className = "jug-seccion hidden";
    secVid.innerHTML = `
        <div class="app-panel">
            <div class="panel-head">
                <div>
                    <h3><i class="ri-movie-2-line"></i> Videos Referencias — Catálogo Técnico Completo</h3>
                    <small style="color:var(--ink-500)">Mirá el video demostrativo de cada ejercicio o tocá "Cargar Marca" para anotar tus kilos.</small>
                </div>
            </div>
            <div class="filter-strip" style="grid-template-columns: 1fr auto; margin-bottom:1.2rem;">
                <div class="search-box">
                    <i class="ri-search-line"></i>
                    <input type="text" id="inputBuscarVideotecaUser" placeholder="Buscar video por nombre de ejercicio, músculo o elemento..." oninput="renderizarVideotecaModoUsuario()">
                </div>
                <select id="filtroMusculoVideotecaUser" onchange="renderizarVideotecaModoUsuario()" style="max-width:250px;">
                    <option value="TODOS">💪 Todos los Grupos Musculares</option>
                    <option value="Tren Inferior">🦵 Tren Inferior (Piernas y Glúteos)</option>
                    <option value="Empuje / Torso">💪 Empuje (Pectoral, Hombros y Tríceps)</option>
                    <option value="Tracción / Espalda">🏋️ Tracción (Espalda y Bíceps)</option>
                    <option value="Core y Funcional">🔥 Zona Media (Core y Funcional)</option>
                    <option value="Potencia y Pliometría">⚡ Potencia y Pliometría</option>
                    <option value="Movilidad y Rehab">🏥 Movilidad y Rehabilitación</option>
                </select>
            </div>
            <div id="contenedorVideotecaModoUsuario" class="videoteca-grid"></div>
        </div>
    `;
    main.appendChild(secVid);

    // 3. Crear Sección de Ranking Oficial (#jug-sec-ranking-user)
    const secRank = document.createElement("section");
    secRank.id = "jug-sec-ranking-user";
    secRank.className = "jug-seccion hidden";
    secRank.innerHTML = `
        <div class="app-panel">
            <div class="panel-head">
                <div>
                    <h3><i class="ri-trophy-fill"></i> Tabla de Posiciones y Récords del Club</h3>
                    <small style="color:var(--ink-500)">Clasificación general de la categoría y marcas destacadas del gimnasio.</small>
                </div>
                <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                    <select id="selectDeporteRankingUser" onchange="renderizarRankingModoUsuario()" style="max-width:165px; font-weight:700;">
                        <option value="Futbol" ${sesion.deporte === "Futbol" ? "selected" : ""}>⚽ Fútbol</option>
                        <option value="Hockey" ${sesion.deporte === "Hockey" ? "selected" : ""}>🏑 Hockey</option>
                        <option value="Gimnasio" ${sesion.deporte === "Gimnasio" ? "selected" : ""}>🏋️ Récords Gym</option>
                    </select>
                    <select id="selectCategoriaRankingUser" onchange="renderizarRankingModoUsuario()" style="max-width:150px; font-weight:700;">
                        <option value="Sub 13" ${sesion.categoria === "Sub 13" ? "selected" : ""}>Sub 13</option>
                        <option value="Sub 15" ${sesion.categoria === "Sub 15" ? "selected" : ""}>Sub 15</option>
                        <option value="Sub 17" ${sesion.categoria === "Sub 17" ? "selected" : ""}>Sub 17</option>
                        <option value="Reserva" ${sesion.categoria === "Reserva" ? "selected" : ""}>Reserva</option>
                        <option value="Primera" ${sesion.categoria === "Primera" ? "selected" : ""}>Primera</option>
                    </select>
                </div>
            </div>
            <div id="contenedorTablaRankingModoUsuario"></div>
        </div>
    `;
    main.appendChild(secRank);

    // 4. Reordenar la barra de pestañas del Usuario para que "Inicio", "Mis Rutinas" y "Videos Referencias" estén primero
    tabsBar.innerHTML = `
        <button class="mod-tab active" data-user-tab="inicio-user" onclick="abrirSeccionUsuarioDesdeCard('inicio-user')">
            <i class="ri-home-5-fill"></i><span>Inicio</span>
        </button>
        <button class="mod-tab" data-user-tab="rutinas" onclick="abrirSeccionUsuarioDesdeCard('rutinas')">
            <i class="ri-clipboard-fill"></i><span>Mis Rutinas</span>
        </button>
        <button class="mod-tab" data-user-tab="videoteca-user" onclick="abrirSeccionUsuarioDesdeCard('videoteca-user')">
            <i class="ri-movie-2-fill"></i><span>Videos Referencias</span>
        </button>
        <button class="mod-tab" data-user-tab="graficos" onclick="abrirSeccionUsuarioDesdeCard('graficos')">
            <i class="ri-line-chart-line"></i><span>Mi Progreso</span>
        </button>
        <button class="mod-tab" data-user-tab="calculadora" onclick="abrirSeccionUsuarioDesdeCard('calculadora')">
            <i class="ri-calculator-line"></i><span>Tabla % 1RM</span>
        </button>
        <button class="mod-tab" data-user-tab="ranking-user" onclick="abrirSeccionUsuarioDesdeCard('ranking-user')">
            <i class="ri-trophy-line"></i><span>Ranking</span>
        </button>
    `;

    // 5. Agregar barra "Volver al Inicio" dentro de cada sección secundaria
    ["jug-sec-rutinas", "jug-sec-videoteca-user", "jug-sec-graficos", "jug-sec-calculadora", "jug-sec-ranking-user", "jug-sec-clinica"].forEach(idSec => {
        inyectarBotonVolverInicioEnSeccionUsuario(document.getElementById(idSec));
    });

    // Mostrar por defecto el Inicio de Tarjetas Grandes (#jug-sec-inicio-user)
    document.querySelectorAll(".jug-seccion").forEach(s => s.classList.add("hidden"));
    secInicio.classList.remove("hidden");

    renderizarInicioTarjetasGrandesUsuario(sesion);
    agregarBotonesVideoEnRutinasJugador(sesion);
    renderizarVideotecaModoUsuario();
    renderizarRankingModoUsuario(sesion);
}

// =========================================================================
// CRONÓMETRO INTERACTIVO DE PAUSA Y CHECK DE SERIES EN VIVO (MODO ENTRENAMIENTO)
// =========================================================================

let intervaloTimerPausaCDM = null;
let segundosRestantesPausaCDM = 0;
let segundosTotalesPausaCDM = 90;

function parsearSegundosPausaCDM(textoPausa) {
    const str = String(textoPausa || "90s").toLowerCase().trim();
    const num = parseFloat(str.replace(",", "."));
    if (isNaN(num) || num <= 0) return 90;
    if (str.includes("m") && !str.includes("ms")) {
        return Math.round(num * 60);
    }
    return Math.round(num);
}

function emitirBeepFinPausaCDM() {
    try {
        if (navigator.vibrate) navigator.vibrate([200, 100, 250]);
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.14);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.14 + 0.22);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.14);
            osc.stop(ctx.currentTime + idx * 0.14 + 0.24);
        });
    } catch {}
}

function iniciarCronometroPausaEjercicioCDM(pausaStr, nombreEjercicio = "Descanso entre series") {
    const segs = parsearSegundosPausaCDM(pausaStr);
    segundosTotalesPausaCDM = segs;
    segundosRestantesPausaCDM = segs;

    let widget = document.getElementById("cdmWorkoutRestTimerDock");
    if (!widget) {
        widget = document.createElement("div");
        widget.id = "cdmWorkoutRestTimerDock";
        widget.className = "workout-timer-dock";
        document.body.appendChild(widget);
    }
    widget.classList.remove("hidden");

    if (intervaloTimerPausaCDM) clearInterval(intervaloTimerPausaCDM);
    renderizarEstadoWidgetPausaCDM(nombreEjercicio);

    intervaloTimerPausaCDM = setInterval(() => {
        segundosRestantesPausaCDM--;
        if (segundosRestantesPausaCDM <= 0) {
            segundosRestantesPausaCDM = 0;
            clearInterval(intervaloTimerPausaCDM);
            intervaloTimerPausaCDM = null;
            emitirBeepFinPausaCDM();
            if (typeof mostrarToast === "function") {
                mostrarToast(`🔔 ¡Tiempo de descanso cumplido! Listo para la siguiente serie de ${nombreEjercicio}.`);
            }
        }
        renderizarEstadoWidgetPausaCDM(nombreEjercicio);
    }, 1000);
}

function ajustarSegundosTimerPausaCDM(delta, nombreEjercicio) {
    segundosRestantesPausaCDM = Math.max(0, segundosRestantesPausaCDM + delta);
    segundosTotalesPausaCDM = Math.max(segundosTotalesPausaCDM, segundosRestantesPausaCDM);
    renderizarEstadoWidgetPausaCDM(nombreEjercicio);
}

function cerrarCronometroPausaCDM() {
    if (intervaloTimerPausaCDM) {
        clearInterval(intervaloTimerPausaCDM);
        intervaloTimerPausaCDM = null;
    }
    document.getElementById("cdmWorkoutRestTimerDock")?.classList.add("hidden");
}

function renderizarEstadoWidgetPausaCDM(nombreEjercicio = "Descanso") {
    const widget = document.getElementById("cdmWorkoutRestTimerDock");
    if (!widget) return;

    const mins = Math.floor(segundosRestantesPausaCDM / 60);
    const secs = segundosRestantesPausaCDM % 60;
    const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    const pct = segundosTotalesPausaCDM > 0
        ? Math.round(((segundosTotalesPausaCDM - segundosRestantesPausaCDM) / segundosTotalesPausaCDM) * 100)
        : 100;
    const terminado = segundosRestantesPausaCDM === 0;
    const nomEsc = String(nombreEjercicio).replace(/'/g, "\\'");

    widget.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.75rem;">
            <div>
                <span class="badge ${terminado ? "badge-ok" : "badge-celeste"}" style="font-size:0.65rem;">
                    ${terminado ? "✓ DESCANSO COMPLETADO" : "⏱️ PAUSA EN VIVO"}
                </span>
                <div style="font-weight:700; font-size:0.84rem; color:#ffffff; margin-top:3px; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    ${nombreEjercicio}
                </div>
            </div>
            <div style="font-family:'Poppins', sans-serif; font-size:1.65rem; font-weight:800; color:${terminado ? "#34d399" : "#38bdf8"};">
                ${display}
            </div>
        </div>
        <div style="height:6px; background:rgba(255,255,255,0.14); border-radius:99px; overflow:hidden; margin:0.55rem 0;">
            <div style="height:100%; width:${pct}%; background:${terminado ? "#10b981" : "#38bdf8"}; transition:width 0.3s ease;"></div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem;">
            <div style="display:flex; gap:0.35rem;">
                <button type="button" class="btn btn-ghost btn-sm" style="color:#fff; border-color:rgba(255,255,255,0.2); padding:0.22rem 0.55rem; min-height:28px;" onclick="ajustarSegundosTimerPausaCDM(-15, '${nomEsc}')">-15s</button>
                <button type="button" class="btn btn-ghost btn-sm" style="color:#fff; border-color:rgba(255,255,255,0.2); padding:0.22rem 0.55rem; min-height:28px;" onclick="ajustarSegundosTimerPausaCDM(15, '${nomEsc}')">+15s</button>
                <button type="button" class="btn btn-primary btn-sm" style="padding:0.22rem 0.65rem; min-height:28px;" onclick="iniciarCronometroPausaEjercicioCDM('${segundosTotalesPausaCDM}s', '${nomEsc}')">↺ Reiniciar</button>
            </div>
            <button type="button" class="btn btn-danger btn-sm" style="padding:0.22rem 0.6rem; min-height:28px;" onclick="cerrarCronometroPausaCDM()">✕ Cerrar</button>
        </div>
    `;
}

function obtenerClaveSeriesHoyCDM() {
    const hoy = new Date().toISOString().split("T")[0];
    return `cdm_series_check_${hoy}`;
}

function obtenerMapaSeriesHoyCDM() {
    try {
        return JSON.parse(localStorage.getItem(obtenerClaveSeriesHoyCDM())) || {};
    } catch {
        return {};
    }
}

function alternarSerieCompletadaCDM(claveSerie, pausaStr, nombreEjercicio, totalSeries, idRutina, idxEj) {
    const mapa = obtenerMapaSeriesHoyCDM();
    const estabaMarcada = Boolean(mapa[claveSerie]);
    mapa[claveSerie] = !estabaMarcada;
    localStorage.setItem(obtenerClaveSeriesHoyCDM(), JSON.stringify(mapa));

    const sesion = obtenerSesionActivaCDM();
    if (sesion) {
        agregarBotonesVideoEnRutinasJugador(sesion);
        renderizarInicioTarjetasGrandesUsuario(sesion);
    }

    if (!estabaMarcada) {
        let completadas = 0;
        for (let s = 1; s <= totalSeries; s++) {
            if (mapa[`${idRutina}_${idxEj}_S${s}`]) completadas++;
        }
        if (completadas >= totalSeries) {
            if (typeof mostrarToast === "function") {
                mostrarToast(`🔥 ¡Completaste las ${totalSeries} series de ${nombreEjercicio}! Tocá "Cargar Avance" para registrar tu peso.`);
            }
        } else {
            iniciarCronometroPausaEjercicioCDM(pausaStr, nombreEjercicio);
        }
    }
}

function agregarBotonesVideoEnRutinasJugador(sesion) {
    const cont = document.getElementById("listaRutinasGuardadasJugador");
    if (!cont || typeof baseRutinas === "undefined" || typeof baseVideoteca === "undefined") return;

    // Forzar contenedor de ancho completo para que nunca quede una columna angosta a la izquierda
    cont.className = "user-routines-full-list";

    const headRutinas = document.querySelector("#jug-sec-rutinas .split-view > .app-panel:last-child .panel-head");
    if (headRutinas) {
        headRutinas.innerHTML = `
            <div>
                <h3><i class="ri-fire-fill"></i> Mis Planes de Entrenamiento Activos</h3>
                <small style="color:var(--ink-500)">Tildá cada serie (S1, S2, S3...) a medida que entrenás para activar el reloj de descanso automáticamente.</small>
            </div>
        `;
    }

    const p = basePersonas.find(x => x.id === Number(sesion.personaId));
    if (!p) return;

    const rutinas = obtenerRutinasDisponiblesParaUsuarioCDM(p);

    if (!rutinas.length) {
        cont.innerHTML = `<div class="empty-box">Todavía no tenés rutinas asignadas por tu Profesor.</div>`;
        return;
    }

    const mapaSeries = obtenerMapaSeriesHoyCDM();

    cont.innerHTML = rutinas.map(r => {
        let seriesTotalesRutina = 0;
        let seriesHechasRutina = 0;

        const items = (r.ejercicios || []).map((ex, i) => {
            const matchVideo = baseVideoteca.find(v =>
                v.nombre.toLowerCase().includes((ex.nombre || "").toLowerCase()) ||
                (ex.nombre || "").toLowerCase().includes(v.nombre.toLowerCase())
            );
            const nomEsc = (ex.nombre || "").replace(/'/g, "\\'");
            const pausaEsc = (ex.pausa || "90s").replace(/'/g, "\\'");
            const cantSeries = Math.min(8, Math.max(1, parseInt(ex.series) || 4));
            seriesTotalesRutina += cantSeries;

            let botonesSeriesHTML = "";
            let completadasCount = 0;
            for (let s = 1; s <= cantSeries; s++) {
                const claveS = `${r.id}_${i}_S${s}`;
                const ok = Boolean(mapaSeries[claveS]);
                if (ok) {
                    completadasCount++;
                    seriesHechasRutina++;
                }
                botonesSeriesHTML += `
                    <button type="button"
                        class="serie-check-pill ${ok ? "done" : ""}"
                        onclick="alternarSerieCompletadaCDM('${claveS}', '${pausaEsc}', '${nomEsc}', ${cantSeries}, ${r.id}, ${i})"
                        title="Marcar serie ${s} como completada y lanzar cronómetro de pausa (${ex.pausa || '90s'})">
                        ${ok ? "✓" : ""} S${s}
                    </button>
                `;
            }

            const ejercicioCompleto = completadasCount === cantSeries;
            const thumbMediaHTML = matchVideo
                ? `<div class="user-ex-thumb" onclick="abrirModalReproductorEjercicio(${matchVideo.id})" title="Ver técnica en video">
                       <img src="${matchVideo.imagenPreview}" alt="${ex.nombre}">
                       <div class="user-ex-thumb-play"><i class="ri-play-fill"></i></div>
                       <span class="user-ex-order-tag">#${i + 1}</span>
                   </div>`
                : `<div class="user-ex-icon-fallback">
                       <span>#${i + 1}</span>
                       <i class="ri-dumbbell-line"></i>
                   </div>`;

            const formaLimpia = ex.forma ? ex.forma.replace(/\(Video:.*?\)/gi, "").trim() : "";

            return `
                <div class="user-ex-pro-card ${ejercicioCompleto ? "ex-completed" : ""}">
                    <div class="user-ex-top-row">
                        ${thumbMediaHTML}
                        <div class="user-ex-title-box">
                            <div style="display:flex; align-items:center; justify-content:space-between; gap:0.4rem; flex-wrap:wrap;">
                                <span class="badge ${ejercicioCompleto ? "badge-ok" : "badge-celeste"}" style="font-size:0.65rem;">
                                    ${ejercicioCompleto ? "✓ EJERCICIO COMPLETADO HOY" : (matchVideo ? matchVideo.grupo : "EJERCICIO #" + (i + 1))}
                                </span>
                                <small style="font-size:0.72rem; font-weight:700; color:${ejercicioCompleto ? "var(--ok)" : "var(--ink-500)"};">
                                    ${completadasCount}/${cantSeries} series
                                </small>
                            </div>
                            <h4>${ex.nombre}</h4>
                        </div>
                    </div>

                    <div class="user-ex-dosage-grid">
                        <div class="user-dosage-box">
                            <small>📊 SERIES × REPS</small>
                            <strong>${ex.series} × ${ex.reps}</strong>
                        </div>
                        <div class="user-dosage-box">
                            <small>🏋️ CARGA SUGERIDA</small>
                            <strong>${ex.peso || "A ajustar"}</strong>
                        </div>
                        <button type="button" class="user-dosage-box timer-trigger" onclick="iniciarCronometroPausaEjercicioCDM('${pausaEsc}', '${nomEsc}')" title="Iniciar reloj de descanso">
                            <small>⏱️ PAUSA (TOCAR)</small>
                            <strong>${ex.pausa || "90s"} ▶</strong>
                        </button>
                    </div>

                    <div class="user-ex-series-bar">
                        <span class="user-ex-series-lbl"><i class="ri-checkbox-circle-line"></i> Marcar series hoy:</span>
                        <div class="user-ex-series-pills">
                            ${botonesSeriesHTML}
                        </div>
                    </div>

                    ${formaLimpia ? `<div class="user-ex-cue-box">💡 <b>Clave técnica:</b> ${formaLimpia}</div>` : ""}

                    <div class="user-ex-actions-footer">
                        <button type="button" class="btn btn-secondary btn-sm" style="flex:1;" onclick="irACargarAvanceEjercicioDesdeRutina('${nomEsc}')">
                            <i class="ri-line-chart-line"></i> Cargar Avance / Kilos
                        </button>
                        ${matchVideo ? `
                            <button type="button" class="btn btn-primary btn-sm" style="flex:1;" onclick="abrirModalReproductorEjercicio(${matchVideo.id})">
                                <i class="ri-play-circle-line"></i> Ver Video Técnico
                            </button>
                        ` : ""}
                    </div>
                </div>
            `;
        }).join("");

        const pctRutina = seriesTotalesRutina > 0 ? Math.round((seriesHechasRutina / seriesTotalesRutina) * 100) : 0;
        const etiquetaTipo = !r.esGrupal
            ? "👤 Plan Personalizado"
            : (r.deporteDestino === "Gimnasio" ? "🏋️ Plan General de Gimnasio" : `⚽ Plan de Plantel • ${r.deporteDestino} (${r.categoriaDestino})`);

        return `
            <div class="user-workout-pro-card">
                <div class="user-workout-banner">
                    <div class="user-workout-banner-left">
                        <div style="display:flex; gap:0.45rem; flex-wrap:wrap; align-items:center; margin-bottom:0.4rem;">
                            <span class="user-workout-type-pill">${etiquetaTipo}</span>
                            <span class="user-workout-days-pill"><i class="ri-calendar-event-line"></i> ${r.dias || "Semanal"}</span>
                        </div>
                        <h3>${r.nombre}</h3>
                        <div class="user-workout-obj">🎯 Enfoque: <b>${r.objetivo}</b> • ${(r.ejercicios || []).length} ejercicios asignados</div>
                    </div>

                    <div class="user-workout-progress-card">
                        <div style="display:flex; justify-content:space-between; align-items:baseline; gap:0.75rem; margin-bottom:0.35rem;">
                            <small style="color:#bae6fd; font-weight:700; font-size:0.7rem; text-transform:uppercase;">Progreso de Hoy</small>
                            <strong style="color:#34d399; font-size:1.25rem; font-weight:800;">${pctRutina}%</strong>
                        </div>
                        <div class="user-workout-progress-track">
                            <div class="user-workout-progress-fill" style="width:${pctRutina}%;"></div>
                        </div>
                        <small style="color:#e0f2fe; font-size:0.72rem; display:block; margin-top:0.35rem;">
                            ✓ ${seriesHechasRutina} de ${seriesTotalesRutina} series completadas
                        </small>
                    </div>
                </div>

                <div class="user-workout-exercises-grid">
                    ${items}
                </div>

                ${r.notas ? `
                    <div class="user-workout-coach-banner">
                        <i class="ri-megaphone-fill"></i>
                        <div><b>Indicación General del Profe:</b> ${r.notas}</div>
                    </div>
                ` : ""}
            </div>
        `;
    }).join("");
}

function renderizarVideotecaModoUsuario() {
    const cont = document.getElementById("contenedorVideotecaModoUsuario");
    if (!cont || typeof baseVideoteca === "undefined") return;
    if (typeof asegurarVideotecaCargada === "function") asegurarVideotecaCargada();

    const q = (document.getElementById("inputBuscarVideotecaUser")?.value || "").toLowerCase().trim();
    const grupo = document.getElementById("filtroMusculoVideotecaUser")?.value || "TODOS";

    let lista = [...baseVideoteca];
    if (grupo !== "TODOS") {
        lista = lista.filter(ex => ex.grupo === grupo || ex.grupoSecundario === grupo);
    }
    if (q) {
        lista = lista.filter(ex =>
            ex.nombre.toLowerCase().includes(q) ||
            ex.grupo.toLowerCase().includes(q) ||
            ex.equipo.toLowerCase().includes(q) ||
            ex.clavesTecnicas.toLowerCase().includes(q)
        );
    }

    if (!lista.length) {
        cont.innerHTML = `<div class="empty-box" style="grid-column:1/-1;">No se encontraron videos con ese filtro.</div>`;
        return;
    }

    cont.innerHTML = lista.map(ex => {
        const nomEsc = (ex.nombre || "").replace(/'/g, "\\'");
        return `
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
                    <h4 style="font-size:1.05rem; font-weight:800; color:var(--ink-900);">${ex.nombre}</h4>
                    <small style="color:var(--ink-500); font-weight:600;">🏋️ ${ex.equipo} • ${ex.nivel}</small>
                </div>
                <div class="video-cues-box">
                    <strong>💡 Clave Técnica:</strong> ${ex.clavesTecnicas}
                </div>
                <div style="display:flex; gap:0.4rem; margin-top:auto;">
                    <button type="button" class="btn btn-primary btn-sm" style="flex:1;" onclick="abrirModalReproductorEjercicio(${ex.id})">
                        <i class="ri-play-circle-line"></i> Ver Video
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="irACargarAvanceEjercicioDesdeRutina('${nomEsc}')">
                        📈 Cargar Marca
                    </button>
                </div>
            </div>
        </div>
    `}).join("");
}

function renderizarRankingModoUsuario(sesionOpt = null) {
    const cont = document.getElementById("contenedorTablaRankingModoUsuario");
    if (!cont || typeof basePersonas === "undefined") return;
    const sesion = sesionOpt || obtenerSesionActivaCDM() || {};

    const depSel = document.getElementById("selectDeporteRankingUser")?.value || sesion.deporte || "Futbol";
    const selCatEl = document.getElementById("selectCategoriaRankingUser");
    if (selCatEl) {
        selCatEl.style.display = depSel === "Gimnasio" ? "none" : "";
    }
    const catSel = selCatEl?.value || sesion.categoria || "Sub 13";

    if (depSel === "Gimnasio") {
        const activosGym = basePersonas.filter(p => p.deporte === "Gimnasio" && p.activo);
        const marcasPR = [];
        activosGym.forEach(p => {
            (p.evaluaciones || []).forEach(ev => {
                if (ev.tipo === "fuerza_kg" || ev.tipo === "salto_cm") {
                    marcasPR.push({
                        personaId: p.id,
                        nombre: `${p.apellido}, ${p.nombre}`,
                        ejercicio: ev.ejercicio,
                        valor: ev.valor,
                        unidad: ev.unidad
                    });
                }
            });
        });
        marcasPR.sort((a, b) => b.valor - a.valor);

        if (!marcasPR.length) {
            cont.innerHTML = `<div class="empty-box">Aún no hay récords PR cargados en el Gimnasio.</div>`;
            return;
        }

        cont.innerHTML = `<div class="table-wrap"><table class="app-table"><thead><tr><th>Puesto</th><th>Socio</th><th>Ejercicio</th><th>Marca PR</th></tr></thead><tbody>` +
            marcasPR.slice(0, 15).map((r, i) => {
                const esMio = Number(r.personaId) === Number(sesion.personaId);
                return `
                    <tr style="${esMio ? "background:var(--cdm-50); font-weight:700;" : ""}">
                        <td data-label="Puesto"><strong>${i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : ""}#${i + 1}°</strong></td>
                        <td data-label="Socio"><span><strong>${r.nombre}</strong> ${esMio ? '<span class="badge badge-ok">Vos</span>' : ""}</span></td>
                        <td data-label="Ejercicio">${r.ejercicio}</td>
                        <td data-label="Marca PR"><span class="badge badge-ok">${r.valor} ${r.unidad}</span></td>
                    </tr>
                `;
            }).join("") + `</tbody></table></div>`;
        return;
    }

    const activos = basePersonas.filter(p => p.deporte === depSel && p.categoria === catSel && p.activo);
    if (typeof asegurarPilaresPersona === "function") {
        activos.forEach(p => asegurarPilaresPersona(p));
    }
    activos.sort((a, b) => (b.puntosCategoria || 0) - (a.puntosCategoria || 0));

    if (!activos.length) {
        cont.innerHTML = `<div class="empty-box">No hay deportistas activos en ${depSel} (${catSel}).</div>`;
        return;
    }

    cont.innerHTML = `<div class="table-wrap"><table class="app-table"><thead><tr><th>Puesto</th><th>Deportista</th><th>Posición</th><th>Físico</th><th>Gym</th><th>Técnico</th><th>Actitud</th><th>Score Oficial</th></tr></thead><tbody>` +
        activos.map((p, idx) => {
            const esMio = Number(p.id) === Number(sesion.personaId);
            return `
                <tr style="${esMio ? "background:var(--cdm-50); font-weight:700;" : ""}">
                    <td data-label="Puesto"><strong>${idx === 0 ? "🥇 " : idx === 1 ? "🥈 " : idx === 2 ? "🥉 " : ""}#${idx + 1}°</strong></td>
                    <td data-label="Deportista"><span><strong>${p.apellido}, ${p.nombre}</strong> ${esMio ? '<span class="badge badge-ok">Vos</span>' : ""}</span></td>
                    <td data-label="Posición">${p.puesto}</td>
                    <td data-label="Físico">${p.pilares?.fisico ?? "-"}</td>
                    <td data-label="Gym">${p.pilares?.gym ?? "-"}</td>
                    <td data-label="Técnico">${p.pilares?.tecnico ?? "-"}</td>
                    <td data-label="Actitud">${p.pilares?.actitud ?? "-"}</td>
                    <td data-label="Score Oficial"><span class="badge badge-purple">⭐ ${p.puntosCategoria} / 10</span></td>
                </tr>
            `;
        }).join("") + `</tbody></table></div>`;
}

// =========================================================================
// 7. ESTILOS DE BLOQUEO ESTRICTO PARA USUARIOS (PERMITIENDO CARGA DE AVANCES)
// =========================================================================

function inyectarCSSRestriccionesRol() {
    if (document.getElementById("cdm-role-lock-css")) return;
    const style = document.createElement("style");
    style.id = "cdm-role-lock-css";
    style.innerHTML = `
        /* 1. IMPEDIR SELECCIÓN DE TEXTO Y COPIA, PERO PERMITIR ESCRIBIR EN INPUTS DE AVANCE */
        body[data-rol="usuario"],
        body[data-rol="usuario"] * {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
            -webkit-touch-callout: none !important;
        }

        body[data-rol="usuario"] input,
        body[data-rol="usuario"] select,
        body[data-rol="usuario"] textarea {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
        }

        @media print {
            body[data-rol="usuario"] {
                display: none !important;
            }
        }

        /* 2. ESCUDO ANTI-CAPTURA DE CRISTAL OSCURO Y MARCA DE AGUA ULTRA SUTIL */
        #cdmAntiCaptureShield {
            position: fixed;
            inset: 0;
            z-index: 999999;
            background: rgba(3, 9, 18, 0.94);
            backdrop-filter: blur(22px);
            -webkit-backdrop-filter: blur(22px);
            display: none;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
        }
        #cdmAntiCaptureShield.active {
            display: flex !important;
        }

        #cdmWatermarkOverlay {
            position: fixed;
            inset: -20%;
            z-index: 9990;
            pointer-events: none;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 5rem 3rem;
            transform: rotate(-22deg);
            opacity: 0.018;
            font-family: 'Poppins', sans-serif;
            font-size: 0.72rem;
            font-weight: 700;
            color: var(--ink-900);
            overflow: hidden;
            white-space: nowrap;
        }

        /* 3. MODO CÁPSULA: OCULTAR BARRA LATERAL Y SELECTOR DE OTROS COMPAÑEROS */
        body[data-rol="usuario"] .app-sidebar,
        body[data-rol="usuario"] #btnVolverDeporte,
        body[data-rol="usuario"] #fichaCabeceraJugador select,
        body[data-rol="usuario"] #jug-sec-calculadora .split-equal > .app-panel:nth-child(2) {
            display: none !important;
        }

        body[data-rol="usuario"] .app-main {
            margin-left: 0 !important;
            width: 100% !important;
        }

        body[data-rol="usuario"] .module-tabs {
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)) !important;
        }

        /* 4. OCULTAR BOTONES DE DESCARGA, PDF, WHATSAPP, COPIAR Y EDICIÓN ADMINISTRATIVA */
        body[data-rol="usuario"] .sidebar-demo-box,
        body[data-rol="usuario"] .admin-only-code-chip,
        body[data-rol="usuario"] .col-admin-control,
        body[data-rol="usuario"] button[onclick*="window.print"],
        body[data-rol="usuario"] button[onclick*="abrirModalPersona"],
        body[data-rol="usuario"] button[onclick*="abrirModalJugador"],
        body[data-rol="usuario"] button[onclick*="abrirModalNuevo"],
        body[data-rol="usuario"] button[onclick*="eliminar"],
        body[data-rol="usuario"] button[onclick*="borrar"],
        body[data-rol="usuario"] button[onclick*="limpiarTodo"],
        body[data-rol="usuario"] button[onclick*="cargarDatosDemo"],
        body[data-rol="usuario"] button[onclick*="exportarBackup"],
        body[data-rol="usuario"] label[title*="Restaurar"],
        body[data-rol="usuario"] button[onclick*="calificarJugador"],
        body[data-rol="usuario"] button[onclick*="sumarPuntoRapido"],
        body[data-rol="usuario"] button[onclick*="alternarEstadoPago"],
        body[data-rol="usuario"] button[onclick*="enviarReciboPago"],
        body[data-rol="usuario"] button[onclick*="enviarAlertaAsistencia"],
        body[data-rol="usuario"] button[onclick*="enviarInformeEjecutivo"],
        body[data-rol="usuario"] button[onclick*="enviarWhatsAppRutina"],
        body[data-rol="usuario"] button[onclick*="copiarRutinaPortapapeles"],
        body[data-rol="usuario"] button[onclick*="enviarVideoEjercicioPorWhatsApp"],
        body[data-rol="usuario"] button[onclick*="insertarEjercicioDeVideotecaEnRutina"],
        body[data-rol="usuario"] button[onclick*="toggleAsistencia"],
        body[data-rol="usuario"] #modalVideoEjercicio a[target="_blank"],
        body[data-rol="usuario"] .check-btn {
            display: none !important;
        }

        /* 5. MANTENER VISIBLES LOS FORMULARIOS DE AVANCES (#jug-sec-graficos) Y DE CHECK-IN DE FATIGA/WELLNESS (#jug-sec-clinica) PARA EL USUARIO */
        body[data-rol="usuario"] #jug-sec-rutinas .split-view > .app-panel:first-child {
            display: none !important;
        }

        /* Ocultar únicamente el selector de Alta/Baja Médica Oficial dentro del check-in del deportista */
        body[data-rol="usuario"] #medEstadoGeneral,
        body[data-rol="usuario"] .field:has(#medEstadoGeneral) {
            display: none !important;
        }

        body[data-rol="usuario"] #jug-sec-rutinas .split-view,
        body[data-rol="usuario"] #jug-sec-calculadora .split-equal {
            grid-template-columns: 1fr !important;
        }

        body[data-rol="usuario"] #fichaCabeceraJugador .badge-purple {
            pointer-events: none !important;
        }

/* =========================================================================
   11. REDISEÑO PRO: CONSTRUCTOR DE RUTINAS, TARJETAS COMERCIO Y PORTAL USUARIO
   ========================================================================= */

/* A) Ampliar columna izquierda del Constructor de Rutinas en Comercio/Admin */
#dep-sec-rutinas .split-view,
#gym-sec-rutinas .split-view,
body:not([data-rol="usuario"]) #jug-sec-rutinas .split-view {
    grid-template-columns: minmax(340px, 420px) minmax(0, 1fr);
    gap: 1.35rem;
}

@media (max-width: 1080px) {
    #dep-sec-rutinas .split-view,
    #gym-sec-rutinas .split-view,
    body:not([data-rol="usuario"]) #jug-sec-rutinas .split-view {
        grid-template-columns: 1fr;
    }
}

/* Filas del Constructor de Ejercicios (Sin aplastar inputs) */
.ex-builder-row {
    background: var(--surface-subtle);
    border: 1.5px solid var(--line-strong);
    border-left: 4px solid var(--cdm-500);
    border-radius: 16px;
    padding: 0.9rem 1rem;
    margin-bottom: 0.75rem;
    box-shadow: var(--shadow-sm);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.ex-builder-row:hover {
    border-color: var(--cdm-400);
    box-shadow: var(--shadow-card);
}

.ex-builder-top {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    margin-bottom: 0.6rem;
}

.ex-builder-num {
    background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
    color: #ffffff;
    font-size: 0.72rem;
    font-weight: 800;
    padding: 0.35rem 0.62rem;
    border-radius: 9px;
    flex-shrink: 0;
}

.ex-builder-del {
    padding: 0.35rem 0.65rem !important;
    min-height: 36px !important;
    border-radius: 9px !important;
    flex-shrink: 0;
}

.ex-builder-metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.5rem;
}

@media (max-width: 480px) {
    .ex-builder-metrics-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* B) Grilla y Tarjetas de Rutinas Activas en Modo Comercio / Admin */
.routines-pro-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 410px), 1fr));
    gap: 1.25rem;
    width: 100%;
}

.routine-pro-card {
    background: var(--card-bg);
    border: 1px solid var(--line-strong);
    border-radius: 22px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-card);
    transition: transform 0.24s var(--ease), box-shadow 0.24s var(--ease);
}
.routine-pro-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-float);
}

.routine-pro-header {
    padding: 1.2rem 1.35rem;
    color: #ffffff;
    position: relative;
}
.routine-pro-header.routine-theme-fuerza {
    background: linear-gradient(135deg, #0c192c 0%, #0369a1 60%, #0284c7 100%);
}
.routine-pro-header.routine-theme-potencia {
    background: linear-gradient(135deg, #1e1b4b 0%, #4338ca 60%, #6366f1 100%);
}
.routine-pro-header.routine-theme-hipertrofia {
    background: linear-gradient(135deg, #31102f 0%, #9f1239 60%, #e11d48 100%);
}
.routine-pro-header.routine-theme-funcional {
    background: linear-gradient(135deg, #062c22 0%, #047857 60%, #10b981 100%);
}

.routine-pro-header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.55rem;
}

.routine-dest-badge {
    background: rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.28);
    color: #ffffff;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.24rem 0.7rem;
    border-radius: 999px;
}

.routine-vol-badge {
    background: rgba(15, 23, 42, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: #38bdf8;
    font-size: 0.68rem;
    font-weight: 700;
    padding: 0.22rem 0.65rem;
    border-radius: 999px;
}

.routine-del-btn {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    border: 1px solid rgba(255, 255, 255, 0.24);
    background: rgba(255, 255, 255, 0.12);
    color: #ffffff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}
.routine-del-btn:hover {
    background: #f43f5e;
    border-color: #f43f5e;
}

.routine-pro-title {
    font-size: 1.18rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 0.25rem 0;
    letter-spacing: -0.01em;
}

.routine-pro-meta {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    font-size: 0.76rem;
    color: rgba(241, 245, 249, 0.88);
    font-weight: 500;
}

.routine-pro-ex-list {
    padding: 1rem 1.15rem;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    flex: 1;
}

.routine-pro-ex-item {
    display: flex;
    align-items: flex-start;
    gap: 0.8rem;
    padding: 0.75rem 0.85rem;
    background: var(--surface-subtle);
    border: 1px solid var(--line-strong);
    border-radius: 14px;
    transition: border-color 0.2s ease, background 0.2s ease;
}
.routine-pro-ex-item:hover {
    border-color: var(--cdm-400);
    background: var(--surface-solid);
}

.routine-ex-thumb {
    width: 54px;
    height: 54px;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
    cursor: pointer;
    background: #0c192c;
    border: 1px solid var(--line-celeste);
}
.routine-ex-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.9;
}
.routine-ex-play {
    position: absolute;
    inset: 0;
    background: rgba(12, 25, 44, 0.42);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 1.1rem;
}

.routine-ex-num {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: var(--cdm-50);
    color: var(--cdm-600);
    border: 1px solid var(--line-celeste);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 0.84rem;
    flex-shrink: 0;
}

.routine-pro-ex-body {
    flex: 1;
    min-width: 0;
}

.routine-pro-ex-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.35rem;
}
.routine-pro-ex-title-row strong {
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--ink-900);
}

.routine-video-mini-btn {
    border: 1px solid var(--line-celeste);
    background: var(--cdm-50);
    color: var(--cdm-600);
    font-size: 0.68rem;
    font-weight: 700;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    flex-shrink: 0;
}
.routine-video-mini-btn:hover {
    background: var(--cdm-500);
    color: #ffffff;
}

.routine-pro-ex-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
}

.r-pill {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.18rem 0.55rem;
    border-radius: 7px;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
}
.r-pill-series { background: var(--cdm-50); color: var(--cdm-600); border: 1px solid var(--line-celeste); }
.r-pill-carga { background: var(--ok-bg); color: var(--ok-ink); border: 1px solid rgba(16, 185, 129, 0.22); }
.r-pill-pausa { background: var(--purple-bg); color: var(--purple-ink); border: 1px solid rgba(99, 102, 241, 0.22); }

.routine-pro-ex-cue {
    margin-top: 0.35rem;
    font-size: 0.74rem;
    color: var(--ink-500);
    line-height: 1.35;
}

.routine-pro-coach-note {
    margin: 0 1.15rem 0.9rem;
    padding: 0.65rem 0.85rem;
    background: var(--cdm-50);
    border-left: 3.5px solid var(--cdm-500);
    border-radius: 10px;
    font-size: 0.78rem;
    color: var(--ink-700);
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
}
.routine-pro-coach-note i {
    color: var(--cdm-500);
    font-size: 1rem;
}

.routine-pro-footer {
    padding: 0.9rem 1.15rem;
    background: var(--surface-subtle);
    border-top: 1px solid var(--line);
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
    margin-top: auto;
}

/* C) TARJETAS DEL PORTAL DEL DEPORTISTA / SOCIO (INICIO + MIS RUTINAS EN VIVO) */
.user-hero-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr));
    gap: 1.35rem;
    margin-bottom: 1.35rem;
}

.user-mega-card {
    position: relative;
    border-radius: 24px;
    padding: 1.65rem 1.75rem;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    box-shadow: 0 20px 42px -12px rgba(12, 25, 44, 0.42);
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.26s var(--ease), box-shadow 0.26s var(--ease);
    border: 1px solid rgba(255, 255, 255, 0.22);
}
.user-mega-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 28px 52px -12px rgba(2, 132, 199, 0.48);
}

.user-mega-card.card-rutinas-hero {
    background:
        radial-gradient(circle at 90% 15%, rgba(56, 189, 248, 0.42) 0%, transparent 50%),
        linear-gradient(135deg, rgba(2, 132, 199, 0.92) 0%, rgba(3, 105, 161, 0.94) 52%, rgba(12, 25, 44, 0.97) 100%),
        url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80') center/cover;
}

.user-mega-card.card-videos-hero {
    background:
        radial-gradient(circle at 90% 15%, rgba(167, 139, 250, 0.42) 0%, transparent 50%),
        linear-gradient(135deg, rgba(30, 27, 75, 0.92) 0%, rgba(49, 46, 129, 0.94) 52%, rgba(15, 23, 42, 0.97) 100%),
        url('https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=900&q=80') center/cover;
}

.user-mega-head-row {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
}

.user-mega-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.user-mega-badge {
    background: rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.28);
    color: #f0f9ff;
    font-size: 0.69rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 0.3rem 0.8rem;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
}

.user-mega-counter {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #ffffff;
    font-size: 0.73rem;
    font-weight: 700;
    padding: 0.28rem 0.82rem;
    border-radius: 999px;
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
}

.user-mega-icon-wrap {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.28);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.65rem;
    color: #38bdf8;
    flex-shrink: 0;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}
.card-videos-hero .user-mega-icon-wrap { color: #c4b5fd; }

.user-mega-body h3 {
    font-size: 1.38rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 0.3rem 0;
    letter-spacing: -0.02em;
}
.user-mega-body p {
    font-size: 0.84rem;
    color: rgba(241, 245, 249, 0.92);
    line-height: 1.48;
    margin: 0;
}

.user-mega-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.42rem;
}
.user-mega-tags span {
    background: rgba(15, 23, 42, 0.48);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #f8fafc;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.26rem 0.7rem;
    border-radius: 9px;
}

.user-mega-progress-box {
    background: rgba(15, 23, 42, 0.46);
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 14px;
    padding: 0.7rem 0.9rem;
}
.user-mega-progress-track {
    height: 7px;
    background: rgba(255, 255, 255, 0.16);
    border-radius: 999px;
    overflow: hidden;
}
.user-mega-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #38bdf8 0%, #10b981 100%);
    border-radius: 999px;
    transition: width 0.35s ease;
}

.user-mega-cta {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    background: #ffffff;
    color: #0f172a;
    border-radius: 14px;
    padding: 0.78rem 1.15rem;
    font-size: 0.86rem;
    font-weight: 700;
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.25);
    transition: all 0.2s ease;
}
.user-mega-cta i {
    font-size: 1.25rem;
    color: var(--cdm-500);
    transition: transform 0.2s ease;
}
.user-mega-card:hover .user-mega-cta i { transform: translateX(5px); }

/* 4 Tarjetas Rápidas Secundarias del Inicio del Usuario */
.user-sub-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 255px), 1fr));
    gap: 1.1rem;
}

.user-sub-card {
    background: var(--surface-solid);
    border: 1px solid var(--line-strong);
    border-top: 4px solid var(--cdm-500);
    border-radius: 20px;
    padding: 1.2rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    cursor: pointer;
    box-shadow: var(--shadow-card);
    transition: all 0.24s var(--ease);
}
.user-sub-card.accent-blue { border-top-color: #0284c7; }
.user-sub-card.accent-purple { border-top-color: #6366f1; }
.user-sub-card.accent-emerald { border-top-color: #10b981; }
.user-sub-card.accent-amber { border-top-color: #f59e0b; }

.user-sub-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-float);
    border-color: var(--cdm-400);
}

.user-sub-card-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
}

.user-sub-icon {
    width: 46px;
    height: 46px;
    border-radius: 13px;
    background: var(--cdm-50);
    color: var(--cdm-500);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.35rem;
    flex-shrink: 0;
}
.user-sub-icon.purple { background: var(--purple-bg); color: var(--purple); }
.user-sub-icon.ok { background: var(--ok-bg); color: var(--ok); }
.user-sub-icon.warn { background: var(--warn-bg); color: var(--warn); }

.user-sub-info h4 {
    font-size: 0.98rem;
    font-weight: 700;
    color: var(--ink-900);
    margin: 0 0 0.25rem 0;
}
.user-sub-info p {
    font-size: 0.78rem;
    color: var(--ink-500);
    line-height: 1.45;
    margin: 0;
}

.user-sub-footer {
    margin-top: auto;
    padding-top: 0.65rem;
    border-top: 1px solid var(--line);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--cdm-500);
}
.user-sub-card:hover .user-sub-footer i { transform: translateX(4px); }

/* D) TABLERO DE RUTINAS DEL USUARIO A ANCHO COMPLETO (SIN HUECOS BLANCOS) */
.user-routines-full-list {
    display: flex !important;
    flex-direction: column !important;
    gap: 1.5rem !important;
    width: 100% !important;
}

.user-workout-pro-card {
    background: var(--surface-solid);
    border: 1.5px solid var(--line-strong);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: var(--shadow-card);
    width: 100%;
}

.user-workout-banner {
    background: linear-gradient(135deg, #0c192c 0%, #0369a1 58%, #0284c7 100%);
    color: #ffffff;
    padding: 1.4rem 1.65rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1.25rem;
    flex-wrap: wrap;
}

.user-workout-banner-left {
    flex: 1;
    min-width: 240px;
}

.user-workout-type-pill {
    background: rgba(255, 255, 255, 0.18);
    border: 1px solid rgba(255, 255, 255, 0.28);
    color: #ffffff;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.24rem 0.75rem;
    border-radius: 999px;
}

.user-workout-days-pill {
    background: rgba(15, 23, 42, 0.45);
    border: 1px solid rgba(56, 189, 248, 0.35);
    color: #38bdf8;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.24rem 0.75rem;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
}

.user-workout-banner-left h3 {
    font-size: 1.38rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0.2rem 0;
    letter-spacing: -0.02em;
}

.user-workout-obj {
    font-size: 0.82rem;
    color: #e0f2fe;
}

.user-workout-progress-card {
    background: rgba(12, 25, 44, 0.58);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 16px;
    padding: 0.85rem 1.15rem;
    min-width: 230px;
}

.user-workout-progress-track {
    height: 8px;
    background: rgba(255, 255, 255, 0.16);
    border-radius: 999px;
    overflow: hidden;
}

.user-workout-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #38bdf8 0%, #10b981 100%);
    border-radius: 999px;
    transition: width 0.35s ease;
}

/* Grilla de 2 Columnas Amplias para los Ejercicios de la Rutina del Usuario */
.user-workout-exercises-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 400px), 1fr));
    gap: 1.15rem;
    padding: 1.35rem 1.5rem;
    background: var(--surface-subtle);
}

.user-ex-pro-card {
    background: var(--surface-solid);
    border: 1.5px solid var(--line-strong);
    border-radius: 18px;
    padding: 1.15rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    box-shadow: var(--shadow-sm);
    transition: all 0.22s var(--ease);
}
.user-ex-pro-card:hover {
    border-color: var(--cdm-400);
    box-shadow: var(--shadow-card);
    transform: translateY(-2px);
}
.user-ex-pro-card.ex-completed {
    border-color: var(--ok);
    background: linear-gradient(to bottom right, var(--surface-solid), var(--ok-bg));
}

.user-ex-top-row {
    display: flex;
    align-items: center;
    gap: 0.9rem;
}

.user-ex-thumb {
    width: 68px;
    height: 68px;
    border-radius: 15px;
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
    cursor: pointer;
    background: #0c192c;
    border: 2px solid var(--line-celeste);
    box-shadow: 0 6px 14px rgba(2, 132, 199, 0.18);
}
.user-ex-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}
.user-ex-thumb:hover img { transform: scale(1.08); }
.user-ex-thumb-play {
    position: absolute;
    inset: 0;
    background: rgba(12, 25, 44, 0.42);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 1.35rem;
}
.user-ex-order-tag {
    position: absolute;
    top: 4px;
    left: 4px;
    background: #0284c7;
    color: #ffffff;
    font-size: 0.6rem;
    font-weight: 800;
    padding: 1px 5px;
    border-radius: 6px;
}

.user-ex-icon-fallback {
    width: 64px;
    height: 64px;
    border-radius: 15px;
    background: linear-gradient(135deg, var(--cdm-50) 0%, var(--cdm-100) 100%);
    border: 1.5px solid var(--line-celeste);
    color: var(--cdm-600);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-weight: 800;
    font-size: 0.75rem;
}
.user-ex-icon-fallback i { font-size: 1.35rem; }

.user-ex-title-box {
    flex: 1;
    min-width: 0;
}
.user-ex-title-box h4 {
    font-size: 1.04rem;
    font-weight: 800;
    color: var(--ink-900);
    margin: 0.25rem 0 0 0;
    line-height: 1.3;
}

.user-ex-dosage-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.5rem;
}

.user-dosage-box {
    background: var(--surface-subtle);
    border: 1px solid var(--line-strong);
    border-radius: 12px;
    padding: 0.5rem 0.6rem;
    text-align: center;
}
.user-dosage-box small {
    display: block;
    font-size: 0.6rem;
    font-weight: 700;
    color: var(--ink-500);
    letter-spacing: 0.03em;
}
.user-dosage-box strong {
    display: block;
    font-size: 0.88rem;
    font-weight: 800;
    color: var(--ink-900);
    margin-top: 2px;
}

.user-dosage-box.timer-trigger {
    background: var(--purple-bg);
    border-color: rgba(99, 102, 241, 0.32);
    cursor: pointer;
    transition: all 0.2s ease;
}
.user-dosage-box.timer-trigger small,
.user-dosage-box.timer-trigger strong {
    color: var(--purple-ink);
}
.user-dosage-box.timer-trigger:hover {
    background: var(--purple);
}
.user-dosage-box.timer-trigger:hover small,
.user-dosage-box.timer-trigger:hover strong {
    color: #ffffff;
}

.user-ex-series-bar {
    background: var(--surface-subtle);
    border: 1px dashed var(--line-celeste);
    border-radius: 12px;
    padding: 0.6rem 0.75rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
}
.user-ex-series-lbl {
    font-size: 0.74rem;
    font-weight: 700;
    color: var(--ink-700);
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
}
.user-ex-series-pills {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
}

.user-ex-cue-box {
    background: var(--cdm-50);
    border-left: 3.5px solid var(--cdm-500);
    border-radius: 9px;
    padding: 0.5rem 0.75rem;
    font-size: 0.77rem;
    color: var(--ink-700);
}

.user-ex-actions-footer {
    display: flex;
    gap: 0.5rem;
    margin-top: auto;
    padding-top: 0.25rem;
}

.user-workout-coach-banner {
    margin: 0 1.5rem 1.35rem;
    padding: 0.85rem 1.1rem;
    background: var(--cdm-50);
    border: 1px solid var(--line-celeste);
    border-radius: 14px;
    display: flex;
    align-items: center;
    gap: 0.65rem;
    font-size: 0.82rem;
    color: var(--ink-700);
}
.user-workout-coach-banner i {
    font-size: 1.25rem;
    color: var(--cdm-500);
}

.user-back-home-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
    background: var(--surface-solid);
    border: 1px solid var(--line-strong);
    border-radius: 14px;
    padding: 0.65rem 0.95rem;
    margin-bottom: 1rem;
    box-shadow: var(--shadow-sm);
}

/* E) Más vida visual en las Tarjetas de Deportistas/Socios (.athlete-card) */
.athlete-card {
    border-top: 3.5px solid var(--cdm-500);
}
.pillar-micro-fill {
    background: linear-gradient(90deg, #0284c7 0%, #38bdf8 100%);
}

    `;
    document.head.appendChild(style);
}

function inyectarBarraSesionTopbar(sesion) {
    const topRight = document.querySelector(".topbar-right") || document.querySelector(".topbar-actions");
    if (!topRight || document.getElementById("cdmBarraSesionActiva")) {
        aplicarTemaGuardadoCDM();
        return;
    }

    const esOscuro = document.body.getAttribute("data-theme") === "dark";
    const yaExisteBtnTema = Boolean(document.getElementById("btnToggleTemaCDM"));
    const btnTemaHTML = yaExisteBtnTema ? "" : `
        <button type="button" id="btnToggleTemaCDM" class="btn btn-ghost btn-sm btn-theme-toggle" onclick="alternarTemaVisualCDM()" title="Cambiar entre Modo Día y Modo Noche">
            ${esOscuro ? `<i class="ri-sun-fill"></i><span>Modo Día</span>` : `<i class="ri-moon-clear-fill"></i><span>Modo Noche</span>`}
        </button>
    `;

    const contenedor = document.createElement("div");
    contenedor.id = "cdmBarraSesionActiva";
    contenedor.style = "display:flex; align-items:center; gap:0.45rem; flex-wrap:wrap;";

    if (sesion.rol === "admin") {
        const botonesSuperAdminHTML = sesion.esSuperAdmin ? `
            <button type="button" class="btn btn-ghost btn-sm" style="border-color:rgba(99,102,241,0.35); color:var(--purple-ink);" onclick="window.location.href='login.html?hub=1'" title="Volver al Selector de todos los Comercios, Clubes y Gimnasios">
                <i class="ri-store-2-line"></i> Cambiar Comercio
            </button>
            <button type="button" class="btn btn-ghost btn-sm" onclick="abrirModalSuperAdminCDM()" title="Activar o desactivar módulos (Fútbol, Hockey, Gimnasio) de este comercio">
                <i class="ri-settings-4-line"></i> Módulos
            </button>
        ` : `
            <span class="badge badge-ok" style="padding:0.42rem 0.8rem;"><i class="ri-shield-star-fill"></i> Admin</span>
        `;

        contenedor.innerHTML = `
            ${btnTemaHTML}
            ${botonesSuperAdminHTML}
            <button type="button" class="btn btn-secondary btn-sm" onclick="abrirModalCodigosAccesoAdmin()">
                <i class="ri-key-2-line"></i> Códigos
            </button>
            <button type="button" class="btn btn-danger btn-sm" onclick="cerrarSesionCDM()" title="Cerrar Sesión">
                <i class="ri-logout-box-r-line"></i> Salir
            </button>
        `;
    } else {
        contenedor.innerHTML = `
            ${btnTemaHTML}
            <span class="badge badge-celeste" style="padding:0.42rem 0.85rem;">🔒 ${sesion.nombre} (${sesion.codigo})</span>
            <button type="button" class="btn btn-danger btn-sm" onclick="cerrarSesionCDM()">
                <i class="ri-logout-box-r-line"></i> Salir
            </button>
        `;
    }

    topRight.appendChild(contenedor);
}

// =========================================================================
// 8. PANEL DE GESTIÓN Y ENVÍO DE CÓDIGOS POR WHATSAPP (SOLO ADMIN)
// =========================================================================

function inyectarPanelCodigoEnFichaIndividual() {
    if (!esAdminCDM()) return;
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("id"));
    const cab = document.getElementById("fichaCabeceraJugador");
    if (!id || !cab) return;

    const existente = document.getElementById("adminBoxCodigoFicha");
    if (existente) existente.remove();

    const personas = asegurarCodigosEnStorage();
    const p = personas.find(x => x.id === id);
    if (!p) return;

    const barra = document.createElement("div");
    barra.id = "adminBoxCodigoFicha";
    barra.className = "admin-only-code-chip";
    barra.style = "margin-top:1.1rem; padding-top:0.95rem; border-top:1px solid rgba(255,255,255,0.16); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.6rem;";
    barra.innerHTML = `
        <div>
            <span class="badge badge-purple" style="font-family:'Poppins', sans-serif; font-size:0.86rem;">🔑 CÓDIGO PERSONAL: ${p.codigoAcceso}</span>
            <small style="color:rgba(224,242,254,0.85); margin-left:0.5rem;">Con este código ${p.nombre} accede a su panel privado y registra sus avances</small>
        </div>
        <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
            <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarCodigoPorWhatsAppCDM(${p.id})"><i class="ri-whatsapp-line"></i> Enviar Código por WA</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="copiarCodigoAlPortapapelesCDM('${p.codigoAcceso}')">📋 Copiar</button>
            <button type="button" class="btn btn-ghost btn-sm" style="color:#fff; border-color:rgba(255,255,255,0.25); background:rgba(255,255,255,0.1);" onclick="regenerarCodigoIndividualCDM(${p.id})">🔄 Nuevo</button>
        </div>
    `;
    cab.appendChild(barra);
}

function abrirModalCodigosAccesoAdmin() {
    if (!esAdminCDM()) return;
    const personas = asegurarCodigosEnStorage();
    const activos = personas.filter(p => p.activo);

    let modal = document.getElementById("modalCodigosAdminCDM");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "modalCodigosAdminCDM";
        modal.className = "modal-backdrop";
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-window" style="max-width:820px;">
            <div class="modal-top">
                <div>
                    <span class="badge badge-celeste">GESTIÓN DE ACCESOS DEL CLUB</span>
                    <h3 style="color:var(--ink-900); margin-top:4px;">🔑 Códigos Individuales de Deportistas y Socios</h3>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('modalCodigosAdminCDM').classList.add('hidden')">✕</button>
            </div>

            <div class="search-box" style="margin-bottom:0.9rem;">
                <i class="ri-search-line"></i>
                <input type="text" id="buscadorCodigosModal" placeholder="Buscar por nombre, apellido, DNI, disciplina o código..." oninput="filtrarTablaModalCodigos()">
            </div>

            <div class="table-wrap" style="max-height:440px; overflow-y:auto;">
                <table class="app-table responsive-cards-table" id="tablaModalCodigosCDM">
                    <thead>
                        <tr>
                            <th>Deportista / Socio</th>
                            <th>Área / Categoría</th>
                            <th>Código Único</th>
                            <th>Acciones del Admin</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${activos.length ? activos.map(p => `
                            <tr>
                                <td data-label="Deportista / Socio"><strong>${p.apellido}, ${p.nombre}</strong><br><small style="color:var(--ink-500)">DNI ${p.dni}</small></td>
                                <td data-label="Área / Categoría"><span class="badge badge-celeste">${p.deporte} (${p.deporte === "Gimnasio" ? "Socio Gym" : p.categoria})</span></td>
                                <td data-label="Código Único"><span class="badge badge-purple" style="font-family:'Poppins', sans-serif; font-size:0.88rem;">🔑 ${p.codigoAcceso}</span></td>
                                <td data-label="Acciones">
                                    <div style="display:flex; gap:0.35rem; flex-wrap:wrap; justify-content:flex-end;">
                                        <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarCodigoPorWhatsAppCDM(${p.id})"><i class="ri-whatsapp-line"></i> Enviar WA</button>
                                        <button type="button" class="btn btn-secondary btn-sm" onclick="copiarCodigoAlPortapapelesCDM('${p.codigoAcceso}')">📋 Copiar</button>
                                        <button type="button" class="btn btn-ghost btn-sm" onclick="regenerarCodigoIndividualCDM(${p.id}); abrirModalCodigosAccesoAdmin();" title="Generar código nuevo">🔄</button>
                                    </div>
                                </td>
                            </tr>
                        `).join("") : `<tr><td colspan="4"><div class="empty-box">No hay personas activas. Cargá la Demo o inscribí un jugador primero.</div></td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    modal.classList.remove("hidden");
}

function filtrarTablaModalCodigos() {
    const q = (document.getElementById("buscadorCodigosModal")?.value || "").toLowerCase().trim();
    document.querySelectorAll("#tablaModalCodigosCDM tbody tr").forEach(tr => {
        tr.style.display = tr.innerText.toLowerCase().includes(q) ? "" : "none";
    });
}

function copiarCodigoAlPortapapelesCDM(codigo) {
    navigator.clipboard.writeText(codigo).then(() => {
        if (typeof mostrarToast === "function") mostrarToast(`📋 Código ${codigo} copiado al portapapeles.`);
        else alert(`Código ${codigo} copiado.`);
    });
}

function regenerarCodigoIndividualCDM(idPersona) {
    let personas = asegurarCodigosEnStorage();
    const p = personas.find(x => x.id === idPersona);
    if (!p) return;
    if (!confirm(`¿Generar un nuevo código personal para ${p.nombre} ${p.apellido}? El código anterior dejará de funcionar.`)) return;

    const nuevoCod = generarCodigoUnicoCDM(personas);
    p.codigoAcceso = nuevoCod;
    localStorage.setItem("cdm_personas_v1", JSON.stringify(personas));

    if (typeof basePersonas !== "undefined" && Array.isArray(basePersonas)) {
        const localP = basePersonas.find(x => x.id === idPersona);
        if (localP) localP.codigoAcceso = nuevoCod;
    }

    if (typeof mostrarToast === "function") mostrarToast(`🔑 Nuevo código para ${p.apellido}: ${nuevoCod}`);
    if (typeof renderizarPaginaDeporte === "function" && window.deportePagina) renderizarPaginaDeporte();
    if (document.getElementById("fichaCabeceraJugador")) inyectarPanelCodigoEnFichaIndividual();
}

function enviarCodigoPorWhatsAppCDM(idPersona) {
    const personas = asegurarCodigosEnStorage();
    const p = personas.find(x => Number(x.id) === Number(idPersona));
    if (!p) return;

    const lic = obtenerLicenciaConfigCDM();
    const entidad = (lic.nombreEntidad || "Tu Gimnasio / Club").trim();
    const esGym = p.deporte === "Gimnasio";
    const linkIngreso = window.location.protocol !== "file:" && window.location.origin && window.location.origin !== "null"
        ? `${window.location.origin}/login.html`
        : "";
    const tel = (p.whatsapp || "").replace(/\D/g, "");

    let msg = `🔑 *TU ACCESO PERSONAL — ${entidad.toUpperCase()}*\n`;
    msg += `----------------------------------\n`;
    msg += `Hola *${p.nombre}*, acá tenés tu código único para entrar desde el celular:\n\n`;
    if (linkIngreso) msg += `🔗 *Link:* ${linkIngreso}\n`;
    msg += `🔑 *TU CÓDIGO:* *${p.codigoAcceso}*\n\n`;
    msg += `📲 *¿Qué podés hacer adentro?*\n`;
    if (esGym) {
        msg += `• Ver tus rutinas con videos técnicos y reloj de descanso.\n`;
        msg += `• Anotar tus kilos, seguir tus récords (PR) y calcular tu tabla % 1RM.\n`;
    } else {
        msg += `• Ver tus rutinas, videos técnicos y evolución deportiva 360°.\n`;
        msg += `• Consultar tus avances, tabla % 1RM y ranking de tu categoría.\n`;
    }
    msg += `----------------------------------\n`;
    msg += `_Al abrir la app, tocá "Deportista / Socio" e ingresá ${p.codigoAcceso}._`;

    const url = tel
        ? `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", verificarAccesoYRolEnApp);
} else {
    verificarAccesoYRolEnApp();
}
// =========================================================================
// 9. SUITE SAAS DEFINITIVA EN LOGIN.JS:
//    - VISTA SIMPLE ULTRA LIMPIA: SOLO SERIES × REPS, VIDEO Y CONTROL TIEMPO REAL (SIN PESOS NI TIEMPO)
//    - VISTA AVANZADA: CON CARGA/PESOS, MEMORIA 1RM Y BIOMECÁNICA (SIN TIEMPO EN LA TARJETA)
//    - GOTA FLOTANTE DE RELOJ INDEPENDIENTE (💧⏱️) PARA QUIEN LA QUIERA USAR
//    - CANDADO DE AUTOGESTIÓN (🔒/🔓) Y EDICIÓN/BORRADO DE PROGRESIONES
// Pegar al final de login.js (reemplazando el Bloque 9 anterior)
// =========================================================================

const CATALOGO_PROFESIONES_BASE_SAAS = [
    { clave: "Quiropraxia", icono: "🦴", nombre: "Quiropraxia" },
    { clave: "Kinesiología", icono: "🦿", nombre: "Kinesiología" },
    { clave: "Psicología", icono: "🧠", nombre: "Psicología" },
    { clave: "Nutrición", icono: "🥗", nombre: "Nutrición" }
];

function obtenerPersonasRealesCDM() {
    if (typeof basePersonas !== "undefined" && Array.isArray(basePersonas)) {
        window.basePersonas = basePersonas;
        return basePersonas;
    }
    try {
        const local = JSON.parse(localStorage.getItem("cdm_personas_v1") || "[]");
        window.basePersonas = local;
        return local;
    } catch {
        return [];
    }
}

function obtenerRutinasRealesCDM() {
    if (typeof baseRutinas !== "undefined" && Array.isArray(baseRutinas)) {
        window.baseRutinas = baseRutinas;
        return baseRutinas;
    }
    try {
        const local = JSON.parse(localStorage.getItem("cdm_rutinas_v1") || "[]");
        window.baseRutinas = local;
        return local;
    } catch {
        return [];
    }
}

function obtenerVideotecaRealCDM() {
    if (typeof baseVideoteca !== "undefined" && Array.isArray(baseVideoteca)) {
        window.baseVideoteca = baseVideoteca;
        return baseVideoteca;
    }
    try {
        return JSON.parse(localStorage.getItem("cdm_videoteca_v1") || "[]");
    } catch {
        return [];
    }
}

function persistirCambiosPersonasYRutinasCDM() {
    const listaP = obtenerPersonasRealesCDM();
    const listaR = obtenerRutinasRealesCDM();
    localStorage.setItem("cdm_personas_v1", JSON.stringify(listaP));
    localStorage.setItem("cdm_rutinas_v1", JSON.stringify(listaR));
    if (typeof guardarSnapshotClubActualEnMapaLocal === "function") {
        guardarSnapshotClubActualEnMapaLocal();
    }
    if (typeof guardarDatosCDM === "function") {
        guardarDatosCDM();
    }
}

function inyectarEstilosRutinasCompactasYModoSimpleCDM() {
    if (document.getElementById("cdmEstilosRutinaCompactaSaaS")) return;
    const st = document.createElement("style");
    st.id = "cdmEstilosRutinaCompactaSaaS";
    st.textContent = `
        /* 1. EN VISTA SIMPLE: OCULTAR PESOS, CALCULADORA 1RM Y BIOMECÁNICA */
        body[data-vista-usuario="simple"] #jug-sec-calculadora,
        body[data-vista-usuario="simple"] .mod-tab[data-user-tab="calculadora"],
        body[data-vista-usuario="simple"] .user-quick-dock-btn[data-user-tab="calculadora"],
        body[data-vista-usuario="simple"] .mod-tab[onclick*="calculadora"],
        body[data-vista-usuario="simple"] .routine-stickman-mini,
        body[data-vista-usuario="simple"] .stickman-tech-card,
        body[data-vista-usuario="simple"] .live-overload-bar,
        body[data-vista-usuario="simple"] .ex-big-pill-load,
        body[data-vista-usuario="simple"] .btn-ejemplo-biomecanico {
            display: none !important;
        }

        /* Ocultar el dock viejo de pausa porque ahora usamos la Gota Independiente */
        #cdmWorkoutRestTimerDock {
            display: none !important;
        }

        body[data-rol="usuario"] .usr-action-allow {
            display: inline-flex !important;
        }

        /* 2. BOTONERÍA DE ACCESOS DE ALTO CONTRASTE + DOCK MÓVIL */
        body[data-rol="usuario"] .module-tabs {
            display: grid !important;
            grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)) !important;
            gap: 0.55rem !important;
            background: var(--surface-solid) !important;
            padding: 0.65rem !important;
            border-radius: 20px !important;
            border: 1.5px solid var(--line-strong) !important;
            box-shadow: var(--shadow-card) !important;
            position: sticky !important;
            top: 68px !important;
            z-index: 450 !important;
        }

        body[data-rol="usuario"] .module-tabs .mod-tab {
            background: var(--surface-subtle) !important;
            border: 1.5px solid var(--line-strong) !important;
            color: var(--ink-900) !important;
            font-weight: 700 !important;
            font-size: 0.82rem !important;
            padding: 0.72rem 0.65rem !important;
            border-radius: 14px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: flex-start !important;
            gap: 0.55rem !important;
            box-shadow: var(--shadow-sm) !important;
            transition: all 0.18s ease !important;
        }

        body[data-rol="usuario"] .module-tabs .mod-tab i {
            width: 32px !important;
            height: 32px !important;
            border-radius: 9px !important;
            background: var(--cdm-50) !important;
            color: var(--cdm-600) !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 1.1rem !important;
            flex-shrink: 0 !important;
        }

        body[data-rol="usuario"] .module-tabs .mod-tab.active {
            background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%) !important;
            border-color: #0284c7 !important;
            color: #ffffff !important;
            box-shadow: 0 8px 20px -4px rgba(2, 132, 199, 0.48) !important;
        }

        body[data-rol="usuario"] .module-tabs .mod-tab.active i {
            background: rgba(255, 255, 255, 0.2) !important;
            color: #ffffff !important;
        }

        .user-mobile-bottom-dock {
            display: none;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 66px;
            background: rgba(12, 25, 44, 0.98);
            backdrop-filter: blur(16px);
            border-top: 1.5px solid rgba(56, 189, 248, 0.25);
            z-index: 950;
            padding: 0.25rem 0.4rem;
            justify-content: space-around;
            align-items: center;
            gap: 0.2rem;
        }
        .user-quick-dock-btn {
            flex: 1;
            border: none;
            background: transparent;
            color: #94a3b8;
            font-size: 0.62rem;
            font-weight: 700;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
            padding: 0.3rem 0.15rem;
            border-radius: 10px;
            cursor: pointer;
        }
        .user-quick-dock-btn i { font-size: 1.15rem; }
        .user-quick-dock-btn.active { background: var(--cdm-500); color: #ffffff; }

        @media (max-width: 820px) {
            body[data-rol="usuario"] { padding-bottom: 78px !important; }
            body[data-rol="usuario"] .user-mobile-bottom-dock { display: flex !important; }
            body[data-rol="usuario"] .module-tabs {
                position: static !important;
                grid-template-columns: repeat(2, 1fr) !important;
            }
        }

        /* 3. TARJETA DE EJERCICIO: TÍTULO ARRIBA + SERIES × REPS EN GRANDE ABAJO (SIN TIEMPO) */
        .clean-user-ex-list {
            display: flex;
            flex-direction: column;
            gap: 0.9rem;
            padding: 1.15rem 1.25rem;
            background: var(--surface-subtle);
        }
        .clean-user-ex-row {
            background: var(--surface-solid);
            border: 1.5px solid var(--line-strong);
            border-radius: 18px;
            padding: 1rem 1.15rem;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            box-shadow: var(--shadow-sm);
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .clean-user-ex-row.done-row {
            border-color: var(--ok);
            background: linear-gradient(to right, var(--surface-solid), var(--ok-bg));
        }
        .clean-user-ex-main {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
        }
        .clean-user-ex-left {
            display: flex;
            align-items: center;
            gap: 0.9rem;
            min-width: 0;
            flex: 1;
        }
        .clean-ex-thumb-btn {
            width: 62px;
            height: 62px;
            border-radius: 15px;
            overflow: hidden;
            position: relative;
            flex-shrink: 0;
            cursor: pointer;
            background: #0c192c;
            border: 2px solid var(--line-celeste);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #38bdf8;
            font-weight: 800;
            font-size: 0.95rem;
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.2);
        }
        .clean-ex-thumb-btn img { width: 100%; height: 100%; object-fit: cover; }
        .clean-ex-thumb-play {
            position: absolute;
            inset: 0;
            background: rgba(12, 25, 44, 0.42);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 1.3rem;
        }
        .clean-ex-info { min-width: 0; flex: 1; }
        .clean-ex-info h4 {
            font-size: 1.12rem !important;
            font-weight: 800 !important;
            color: var(--ink-900) !important;
            margin: 0 0 0.42rem 0 !important;
            line-height: 1.25 !important;
        }

        .ex-big-prescription-row {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            align-items: center;
            margin-top: 0.2rem;
        }
        .ex-big-pill-primary {
            background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
            color: #ffffff !important;
            font-size: 0.96rem !important;
            font-weight: 800 !important;
            padding: 0.38rem 0.95rem !important;
            border-radius: 11px !important;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.26);
        }
        .ex-big-pill-load {
            background: var(--ok-bg);
            color: var(--ok-ink) !important;
            border: 1.5px solid rgba(16, 185, 129, 0.35);
            font-size: 0.92rem !important;
            font-weight: 800 !important;
            padding: 0.36rem 0.85rem !important;
            border-radius: 11px !important;
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
        }

        /* BARRA DE CONTROL TIEMPO REAL (SIN TEXTO DE PAUSA) */
        .realtime-control-bar {
            background: var(--surface-subtle);
            border: 1.5px dashed var(--line-celeste);
            border-radius: 13px;
            padding: 0.6rem 0.85rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.65rem;
            flex-wrap: wrap;
        }
        .realtime-control-title {
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            font-size: 0.8rem;
            font-weight: 800;
            color: var(--cdm-700);
            text-transform: uppercase;
            letter-spacing: 0.02em;
        }
        body[data-theme="dark"] .realtime-control-title { color: #38bdf8; }
        .realtime-pulse-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #10b981;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
        }

        /* 4. GOTA FLOTANTE INDEPENDIENTE DEL RELOJITO (💧⏱️) */
        .cdm-droplet-clock-wrap {
            position: fixed;
            bottom: 1.35rem;
            right: 1.35rem;
            z-index: 2600;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }
        @media (max-width: 820px) {
            .cdm-droplet-clock-wrap {
                bottom: 5.1rem;
                right: 1rem;
            }
        }
        .cdm-droplet-btn {
            min-width: 58px;
            height: 58px;
            padding: 0 1.05rem;
            border-radius: 29px 29px 8px 29px;
            background: linear-gradient(135deg, #0284c7 0%, #0369a1 55%, #0c192c 100%);
            color: #ffffff;
            border: 2px solid rgba(125, 211, 252, 0.65);
            box-shadow: 0 14px 30px rgba(2, 132, 199, 0.45);
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.45rem;
            font-weight: 800;
            font-size: 0.92rem;
            transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        .cdm-droplet-btn:hover {
            transform: translateY(-3px) scale(1.03);
            box-shadow: 0 18px 36px rgba(2, 132, 199, 0.6);
        }
        .cdm-droplet-btn.running {
            background: linear-gradient(135deg, #10b981 0%, #047857 100%);
            border-color: #a7f3d0;
            box-shadow: 0 14px 32px rgba(16, 185, 129, 0.5);
        }
        .cdm-droplet-btn i {
            font-size: 1.35rem;
        }
        .cdm-droplet-popover {
            background: #0c192c;
            color: #ffffff;
            border: 1.5px solid rgba(56, 189, 248, 0.45);
            border-radius: 22px;
            padding: 1rem 1.15rem;
            width: 285px;
            margin-bottom: 0.65rem;
            box-shadow: 0 24px 48px rgba(0, 0, 0, 0.65);
            animation: slideUpFade 0.2s ease forwards;
        }
        .droplet-preset-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.38rem;
            margin: 0.65rem 0;
        }
        .droplet-preset-chip {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.18);
            color: #e0f2fe;
            font-size: 0.75rem;
            font-weight: 800;
            padding: 0.42rem 0.3rem;
            border-radius: 9px;
            cursor: pointer;
            transition: all 0.15s ease;
        }
        .droplet-preset-chip:hover,
        .droplet-preset-chip.active {
            background: #0284c7;
            border-color: #38bdf8;
            color: #ffffff;
        }

        .self-routine-banner {
            background: linear-gradient(135deg, #064e3b 0%, #047857 100%);
            color: #ffffff;
            border-radius: 18px;
            padding: 1rem 1.25rem;
            margin-bottom: 1.15rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.85rem;
            flex-wrap: wrap;
            box-shadow: var(--shadow-card);
        }

        .admin-complexity-toolbar {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border: 1.5px solid #0284c7;
            border-radius: 16px;
            padding: 0.85rem 1.1rem;
            margin-bottom: 1.1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.75rem;
            flex-wrap: wrap;
            box-shadow: var(--shadow-sm);
        }
        body[data-theme="dark"] .admin-complexity-toolbar {
            background: rgba(14, 165, 233, 0.14);
            border-color: rgba(56, 189, 248, 0.45);
        }

        @media (max-width: 600px) {
            .clean-user-ex-list { padding: 0.75rem; }
            .clean-user-ex-main { flex-direction: column; align-items: stretch; }
            .clean-ex-right-actions { width: 100%; justify-content: flex-end; }
            .ex-big-pill-primary, .ex-big-pill-load { font-size: 0.88rem !important; width: 100%; justify-content: center; }
        }
    `;
    document.head.appendChild(st);
}

// =========================================================================
// 1. GOTA DEL RELOJITO INDEPENDIENTE (💧⏱️)
//    No invade las tarjetas ni salta sola: solo la abre quien la quiere usar
// =========================================================================

let intervaloGotaRelojCDM = null;
let segsRestantesGotaCDM = 0;
let segsTotalesGotaCDM = 90;
let gotaRelojAbiertaCDM = false;

function asegurarGotaRelojitoFlotanteCDM() {
    let wrap = document.getElementById("cdmFloatingDropletClock");
    if (!wrap) {
        wrap = document.createElement("div");
        wrap.id = "cdmFloatingDropletClock";
        wrap.className = "cdm-droplet-clock-wrap usr-action-allow";
        document.body.appendChild(wrap);
    }
    renderizarGotaRelojitoFlotanteCDM();
}

function alternarAperturaGotaRelojCDM() {
    gotaRelojAbiertaCDM = !gotaRelojAbiertaCDM;
    renderizarGotaRelojitoFlotanteCDM();
}

function iniciarDescansoEnGotaRelojCDM(segundos) {
    const segs = Math.max(5, parseInt(segundos) || 90);
    segsTotalesGotaCDM = segs;
    segsRestantesGotaCDM = segs;

    if (intervaloGotaRelojCDM) clearInterval(intervaloGotaRelojCDM);
    renderizarGotaRelojitoFlotanteCDM();

    intervaloGotaRelojCDM = setInterval(() => {
        segsRestantesGotaCDM--;
        if (segsRestantesGotaCDM <= 0) {
            segsRestantesGotaCDM = 0;
            clearInterval(intervaloGotaRelojCDM);
            intervaloGotaRelojCDM = null;
            if (typeof emitirBeepFinPausaCDM === "function") emitirBeepFinPausaCDM();
            if (typeof mostrarToast === "function") {
                mostrarToast("🔔 ¡Tiempo cumplido en el reloj de descanso!");
            }
        }
        renderizarGotaRelojitoFlotanteCDM();
    }, 1000);
}

function ajustarTiempoGotaRelojCDM(deltaSegs) {
    segsRestantesGotaCDM = Math.max(0, segsRestantesGotaCDM + deltaSegs);
    segsTotalesGotaCDM = Math.max(segsTotalesGotaCDM, segsRestantesGotaCDM);
    renderizarGotaRelojitoFlotanteCDM();
}

function detenerGotaRelojCDM() {
    if (intervaloGotaRelojCDM) {
        clearInterval(intervaloGotaRelojCDM);
        intervaloGotaRelojCDM = null;
    }
    segsRestantesGotaCDM = 0;
    renderizarGotaRelojitoFlotanteCDM();
}

function renderizarGotaRelojitoFlotanteCDM() {
    const wrap = document.getElementById("cdmFloatingDropletClock");
    if (!wrap) return;

    const corriendo = Boolean(intervaloGotaRelojCDM && segsRestantesGotaCDM > 0);
    const mins = Math.floor(segsRestantesGotaCDM / 60);
    const secs = segsRestantesGotaCDM % 60;
    const tiempoStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    const pct = segsTotalesGotaCDM > 0
        ? Math.round(((segsTotalesGotaCDM - segsRestantesGotaCDM) / segsTotalesGotaCDM) * 100)
        : 0;

    const popoverHTML = gotaRelojAbiertaCDM ? `
        <div class="cdm-droplet-popover" onclick="event.stopPropagation();">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                <span style="font-size:0.7rem; font-weight:800; color:#38bdf8; text-transform:uppercase; letter-spacing:0.04em;">
                    💧⏱️ Reloj de Descanso Libre
                </span>
                <button type="button" class="btn btn-ghost btn-sm usr-action-allow" style="min-height:24px; padding:0 6px; color:#94a3b8; border:none;" onclick="alternarAperturaGotaRelojCDM()">✕</button>
            </div>

            <div style="text-align:center; padding:0.35rem 0;">
                <div style="font-size:2.1rem; font-weight:900; color:${corriendo ? "#34d399" : "#ffffff"}; line-height:1.1; font-variant-numeric:tabular-nums;">
                    ${tiempoStr}
                </div>
                <div style="height:5px; background:rgba(255,255,255,0.12); border-radius:99px; overflow:hidden; margin-top:0.45rem;">
                    <div style="height:100%; width:${corriendo ? pct : 0}%; background:linear-gradient(90deg, #38bdf8, #10b981); transition:width 0.3s ease;"></div>
                </div>
            </div>

            <small style="color:#94a3b8; font-size:0.68rem; font-weight:700; display:block; margin-top:0.3rem;">
                Tocá un tiempo para iniciar:
            </small>
            <div class="droplet-preset-grid">
                <button type="button" class="droplet-preset-chip usr-action-allow ${segsTotalesGotaCDM === 30 && corriendo ? "active" : ""}" onclick="iniciarDescansoEnGotaRelojCDM(30)">30s</button>
                <button type="button" class="droplet-preset-chip usr-action-allow ${segsTotalesGotaCDM === 45 && corriendo ? "active" : ""}" onclick="iniciarDescansoEnGotaRelojCDM(45)">45s</button>
                <button type="button" class="droplet-preset-chip usr-action-allow ${segsTotalesGotaCDM === 60 && corriendo ? "active" : ""}" onclick="iniciarDescansoEnGotaRelojCDM(60)">1m (60s)</button>
                <button type="button" class="droplet-preset-chip usr-action-allow ${segsTotalesGotaCDM === 90 && corriendo ? "active" : ""}" onclick="iniciarDescansoEnGotaRelojCDM(90)">1m 30s</button>
                <button type="button" class="droplet-preset-chip usr-action-allow ${segsTotalesGotaCDM === 120 && corriendo ? "active" : ""}" onclick="iniciarDescansoEnGotaRelojCDM(120)">2 min</button>
                <button type="button" class="droplet-preset-chip usr-action-allow ${segsTotalesGotaCDM === 180 && corriendo ? "active" : ""}" onclick="iniciarDescansoEnGotaRelojCDM(180)">3 min</button>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.35rem; margin-top:0.5rem;">
                <button type="button" class="btn btn-ghost btn-sm usr-action-allow" style="color:#fff; border-color:rgba(255,255,255,0.2); min-height:28px; padding:0.2rem 0.55rem;" onclick="ajustarTiempoGotaRelojCDM(-15)">-15s</button>
                <button type="button" class="btn btn-ghost btn-sm usr-action-allow" style="color:#fff; border-color:rgba(255,255,255,0.2); min-height:28px; padding:0.2rem 0.55rem;" onclick="ajustarTiempoGotaRelojCDM(15)">+15s</button>
                <button type="button" class="btn btn-danger btn-sm usr-action-allow" style="min-height:28px; padding:0.2rem 0.65rem; flex:1;" onclick="detenerGotaRelojCDM()">Reiniciar 00:00</button>
            </div>
        </div>
    ` : "";

    wrap.innerHTML = `
        ${popoverHTML}
        <button type="button" class="cdm-droplet-btn usr-action-allow ${corriendo ? "running" : ""}" onclick="alternarAperturaGotaRelojCDM()" title="Reloj de descanso independiente (Tocar para abrir/minimizar)">
            <i class="ri-timer-flash-fill"></i>
            <span>${corriendo ? tiempoStr : "Reloj"}</span>
        </button>
    `;
}

// =========================================================================
// 2. RESOLUTOR Y GUARDADO FIRME DE COMPLEJIDAD (POR COMERCIO Y POR USUARIO)
// =========================================================================

function obtenerModoComplejidadComercioActualCDM() {
    try {
        const lic = obtenerLicenciaConfigCDM();
        return lic?.modoComplejidad === "simple" ? "simple" : "avanzado";
    } catch {
        return "avanzado";
    }
}

function obtenerPersonaActualEnFichaCDM() {
    const lista = obtenerPersonasRealesCDM();
    const params = new URLSearchParams(window.location.search);
    const idUrl = parseInt(params.get("id"));
    if (!isNaN(idUrl)) {
        const pUrl = lista.find(x => Number(x.id) === Number(idUrl));
        if (pUrl) return pUrl;
    }
    try {
        const ses = obtenerSesionActivaCDM();
        if (ses && ses.personaId) {
            return lista.find(x => Number(x.id) === Number(ses.personaId)) || null;
        }
    } catch {}
    return null;
}

function obtenerNivelVistaRutinaEfectivoCDM(personaObj = null) {
    const p = personaObj || obtenerPersonaActualEnFichaCDM();
    if (p && (p.modoVistaRutina === "simple" || p.modoVistaRutina === "avanzado")) {
        return p.modoVistaRutina;
    }
    return obtenerModoComplejidadComercioActualCDM();
}

function cambiarModoComplejidadGeneralDesdeAdminCDM(nuevoModo) {
    const lic = obtenerLicenciaConfigCDM();
    lic.modoComplejidad = nuevoModo === "simple" ? "simple" : "avanzado";
    guardarLicenciaConfigCDM(lic);
    sincronizarAtributoCobranzaBodyCDM();

    if (typeof mostrarToast === "function") {
        mostrarToast(lic.modoComplejidad === "simple"
            ? "✅ Guardado: Modo General del Gimnasio/Club en VISTA SIMPLE"
            : "✅ Guardado: Modo General del Gimnasio/Club en VISTA AVANZADA");
    }

    const p = obtenerPersonaActualEnFichaCDM();
    if (p) {
        inyectarPanelCodigoEnFichaIndividual();
        window.agregarBotonesVideoEnRutinasJugador({ personaId: p.id });
    }
    if (typeof renderizarPaginaDeporte === "function" && window.deportePagina) {
        renderizarPaginaDeporte();
    }
}

function cambiarModoVistaRutinaUsuarioParticularCDM(idPersona, nuevoModoUsuario) {
    const lista = obtenerPersonasRealesCDM();
    const p = lista.find(x => Number(x.id) === Number(idPersona));
    if (!p) return;

    const modoElegido = nuevoModoUsuario || document.getElementById("selModoVistaUsuarioHeader")?.value || "simple";
    p.modoVistaRutina = modoElegido;
    persistirCambiosPersonasYRutinasCDM();
    sincronizarAtributoCobranzaBodyCDM();

    const selHeader = document.getElementById("selModoVistaUsuarioHeader");
    if (selHeader) selHeader.value = modoElegido;
    const selToolbar = document.getElementById("selModoVistaUsuarioToolbar");
    if (selToolbar) selToolbar.value = modoElegido;

    const efectivo = obtenerNivelVistaRutinaEfectivoCDM(p);
    if (typeof mostrarToast === "function") {
        mostrarToast(`💾 Guardado para ${p.nombre} ${p.apellido}: Vista ${efectivo.toUpperCase()} activa.`);
    }

    if (document.getElementById("fichaCabeceraJugador")) {
        inyectarPanelCodigoEnFichaIndividual();
        window.agregarBotonesVideoEnRutinasJugador({ personaId: p.id });
    }
    if (typeof renderizarPaginaDeporte === "function" && window.deportePagina) {
        renderizarPaginaDeporte();
    }
}

function alternarVistaSimpleAvanzadaRapidaCardCDM(idPersona) {
    const lista = obtenerPersonasRealesCDM();
    const p = lista.find(x => Number(x.id) === Number(idPersona));
    if (!p) return;
    const actual = obtenerNivelVistaRutinaEfectivoCDM(p);
    const nuevo = actual === "simple" ? "avanzado" : "simple";
    cambiarModoVistaRutinaUsuarioParticularCDM(p.id, nuevo);
}

function estaCobranzaBloqueadaEnComercioActualCDM() {
    try {
        const lic = obtenerLicenciaConfigCDM();
        return Boolean(lic && lic.bloquearCobranza === true);
    } catch {
        return false;
    }
}

function sincronizarAtributoCobranzaBodyCDM() {
    inyectarEstilosRutinasCompactasYModoSimpleCDM();
    if (!document.body) return;
    const bloqueada = estaCobranzaBloqueadaEnComercioActualCDM();
    const modoComp = obtenerModoComplejidadComercioActualCDM();
    const pActual = obtenerPersonaActualEnFichaCDM();
    const vistaEfectivaUsuario = obtenerNivelVistaRutinaEfectivoCDM(pActual);

    document.body.setAttribute("data-cobranza", bloqueada ? "bloqueada" : "activa");
    document.body.setAttribute("data-complejidad", modoComp);
    document.body.setAttribute("data-vista-usuario", vistaEfectivaUsuario);
}

// =========================================================================
// 3. DESBLOQUEO DEL CANDADO DE AUTOGESTIÓN DE RUTINAS (🔒 ⇄ 🔓)
// =========================================================================

function alternarPermisoAutogestionRutinaCDM(idPersona) {
    if (!esAdminCDM()) return;
    const lista = obtenerPersonasRealesCDM();
    const p = lista.find(x => Number(x.id) === Number(idPersona));
    if (!p) return;

    p.puedeCrearRutinas = !Boolean(p.puedeCrearRutinas);
    persistirCambiosPersonasYRutinasCDM();

    if (typeof mostrarToast === "function") {
        mostrarToast(p.puedeCrearRutinas
            ? `🔓 Candado Abierto: Ahora ${p.nombre} ${p.apellido} puede cargar y armar sus propias rutinas.`
            : `🔒 Candado Cerrado: ${p.nombre} ${p.apellido} solo verá las rutinas asignadas por el entrenador.`);
    }

    if (document.getElementById("fichaCabeceraJugador")) {
        inyectarPanelCodigoEnFichaIndividual();
        window.agregarBotonesVideoEnRutinasJugador({ personaId: p.id });
    }
    if (typeof renderizarPaginaDeporte === "function" && window.deportePagina) {
        renderizarPaginaDeporte();
    }
}

// =========================================================================
// 4. MODIFICAR (✏️) Y QUITAR (🗑️) PROGRESIONES Y EVALUACIONES
// =========================================================================

function abrirModalModificarProgresionEvalCDM(idPersona, idEval) {
    const lista = obtenerPersonasRealesCDM();
    const p = lista.find(x => Number(x.id) === Number(idPersona));
    if (!p || !Array.isArray(p.evaluaciones)) return;

    const ev = p.evaluaciones.find(e => Number(e.id) === Number(idEval));
    if (!ev) return;

    if (typeof asegurarModalVideoEnPaginaActualCDM === "function") asegurarModalVideoEnPaginaActualCDM();
    const modal = document.getElementById("modalVideoEjercicio");
    if (!modal) return;

    const matchKgReps = String(ev.detalle || "").match(/([\d.]+)\s*kg\s*[×x]\s*(\d+)/i);
    const kgActual = matchKgReps ? parseFloat(matchKgReps[1]) : (ev.valor || 60);
    const repsActual = matchKgReps ? parseInt(matchKgReps[2]) : 5;
    const notaLimpia = String(ev.nota || "")
        .replace(/^👤 Cargado por Deportista\s*•?\s*/i, "")
        .replace(/^👨‍🏫 Cargado por Profe\s*•?\s*/i, "")
        .replace(/^👤 Deportista:\s*/i, "")
        .replace(/^👨‍🏫 Profe\/Admin:\s*/i, "")
        .trim();

    modal.innerHTML = `
        <div class="modal-window" style="max-width:520px;">
            <div class="modal-top">
                <div>
                    <span class="badge badge-celeste">✏️ MODIFICAR PROGRESIÓN / EVALUACIÓN</span>
                    <h3 style="color:var(--ink-900); margin-top:4px;">${ev.ejercicio}</h3>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalVideoEjercicio()">✕</button>
            </div>

            <form onsubmit="guardarModificacionProgresionEvalCDM(event, ${p.id}, ${ev.id})">
                <div class="grid-2" style="margin-bottom:0.75rem;">
                    <div class="field">
                        <label>Fecha *</label>
                        <input type="date" id="editEvFecha" required value="${ev.fecha || obtenerHoyISO()}">
                    </div>
                    <div class="field">
                        <label>Ejercicio *</label>
                        <input type="text" id="editEvEjercicio" required value="${(ev.ejercicio || "").replace(/"/g, "&quot;")}">
                    </div>
                </div>

                ${ev.tipo === "fuerza_kg" ? `
                    <div class="grid-2" style="margin-bottom:0.75rem;">
                        <div class="field">
                            <label>Peso Levantado (kg) *</label>
                            <input type="number" step="0.5" id="editEvKg" required value="${kgActual}">
                        </div>
                        <div class="field">
                            <label>Repeticiones *</label>
                            <input type="number" min="1" max="50" id="editEvReps" required value="${repsActual}">
                        </div>
                    </div>
                ` : `
                    <div class="field" style="margin-bottom:0.75rem;">
                        <label>Valor Registrado (${ev.unidad || "marca"}) *</label>
                        <input type="number" step="0.1" id="editEvValorSimple" required value="${ev.valor || 0}">
                    </div>
                `}

                <div class="field" style="margin-bottom:1.1rem;">
                    <label>Nota / Observación</label>
                    <input type="text" id="editEvNota" value="${notaLimpia.replace(/"/g, "&quot;")}" placeholder="Ej: Buena profundidad / PR en Banca...">
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem;">
                    <button type="button" class="btn btn-danger btn-sm usr-action-allow" onclick="cerrarModalVideoEjercicio(); quitarProgresionEvalCDM(${p.id}, ${ev.id});">
                        <i class="ri-delete-bin-line"></i> Quitar Registro
                    </button>
                    <div style="display:flex; gap:0.5rem;">
                        <button type="button" class="btn btn-ghost" onclick="cerrarModalVideoEjercicio()">Cancelar</button>
                        <button type="submit" class="btn btn-primary usr-action-allow">
                            <i class="ri-save-3-line"></i> Guardar Cambios
                        </button>
                    </div>
                </div>
            </form>
        </div>
    `;
    modal.classList.remove("hidden");
}

function guardarModificacionProgresionEvalCDM(e, idPersona, idEval) {
    e.preventDefault();
    const lista = obtenerPersonasRealesCDM();
    const p = lista.find(x => Number(x.id) === Number(idPersona));
    if (!p || !Array.isArray(p.evaluaciones)) return;

    const ev = p.evaluaciones.find(item => Number(item.id) === Number(idEval));
    if (!ev) return;

    ev.fecha = document.getElementById("editEvFecha")?.value || ev.fecha;
    ev.ejercicio = (document.getElementById("editEvEjercicio")?.value || ev.ejercicio).trim();
    const notaTxt = (document.getElementById("editEvNota")?.value || "").trim();
    ev.nota = notaTxt || "-";

    if (ev.tipo === "fuerza_kg") {
        const kg = parseFloat(document.getElementById("editEvKg")?.value) || 0;
        const reps = parseInt(document.getElementById("editEvReps")?.value) || 1;
        const rm = Math.round((reps === 1 ? kg : kg * (1 + reps / 30)) * 10) / 10;
        const fRel = (rm / (p.peso || 70)).toFixed(2);
        ev.valor = rm;
        ev.unidad = "kg (1RM)";
        ev.detalle = `${kg} kg × ${reps} reps (1RM: ${rm} kg • F.Rel: ${fRel}x)`;

        const clave = normalizarClaveProgPersonalCDM(ev.ejercicio);
        if (p.progresionesPersonales && p.progresionesPersonales[clave]) {
            p.progresionesPersonales[clave] = {
                ejercicio: ev.ejercicio,
                peso: `${kg} kg`,
                kgNumerico: kg,
                reps: String(reps),
                rm: rm,
                fecha: ev.fecha
            };
        }
    } else {
        const val = parseFloat(document.getElementById("editEvValorSimple")?.value) || 0;
        ev.valor = val;
        ev.detalle = `${val} ${ev.unidad || ""}`;
    }

    p.evaluaciones.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    persistirCambiosPersonasYRutinasCDM();
    cerrarModalVideoEjercicio();

    if (typeof mostrarToast === "function") {
        mostrarToast(`✏️ Progresión de "${ev.ejercicio}" actualizada.`);
    }
    if (typeof inicializarPaginaJugadorIndividual === "function") {
        inicializarPaginaJugadorIndividual();
    }
}

function quitarProgresionEvalCDM(idPersona, idEval) {
    const lista = obtenerPersonasRealesCDM();
    const p = lista.find(x => Number(x.id) === Number(idPersona));
    if (!p || !Array.isArray(p.evaluaciones)) return;

    const ev = p.evaluaciones.find(item => Number(item.id) === Number(idEval));
    if (!ev) return;
    if (!confirm(`🗑️ ¿Quitar este registro de "${ev.ejercicio}" (${ev.detalle}) del historial?`)) return;

    p.evaluaciones = p.evaluaciones.filter(item => Number(item.id) !== Number(idEval));

    const clave = normalizarClaveProgPersonalCDM(ev.ejercicio);
    if (p.progresionesPersonales && p.progresionesPersonales[clave]) {
        const restantes = p.evaluaciones.filter(item => normalizarClaveProgPersonalCDM(item.ejercicio) === clave);
        if (restantes.length === 0) {
            delete p.progresionesPersonales[clave];
        } else {
            const ult = restantes[restantes.length - 1];
            const m = String(ult.detalle || "").match(/([\d.]+)\s*kg\s*[×x]\s*(\d+)/i);
            if (m) {
                p.progresionesPersonales[clave] = {
                    ejercicio: ult.ejercicio,
                    peso: `${m[1]} kg`,
                    kgNumerico: parseFloat(m[1]),
                    reps: String(m[2]),
                    rm: ult.valor,
                    fecha: ult.fecha
                };
            }
        }
    }

    persistirCambiosPersonasYRutinasCDM();
    if (typeof mostrarToast === "function") {
        mostrarToast(`🗑️ Registro de progresión quitado.`);
    }
    if (typeof inicializarPaginaJugadorIndividual === "function") {
        inicializarPaginaJugadorIndividual();
    }
}

function limpiarCargaPersonalRutinaCDM(idPersona, nombreEjercicio) {
    const lista = obtenerPersonasRealesCDM();
    const p = lista.find(x => Number(x.id) === Number(idPersona));
    if (!p || !p.progresionesPersonales) return;

    const clave = normalizarClaveProgPersonalCDM(nombreEjercicio);
    if (!p.progresionesPersonales[clave]) return;
    if (!confirm(`🔄 ¿Restaurar la carga original sugerida por el profe en "${nombreEjercicio}"?`)) return;

    delete p.progresionesPersonales[clave];
    persistirCambiosPersonasYRutinasCDM();

    if (typeof mostrarToast === "function") {
        mostrarToast(`↺ Carga personal de "${nombreEjercicio}" restaurada al valor original.`);
    }
    window.agregarBotonesVideoEnRutinasJugador({ personaId: p.id });
}

window.renderizarHistorialJugador = function (p) {
    const cont = document.getElementById("contenedorHistorialJugador");
    if (!cont || !p) return;
    if (!Array.isArray(p.evaluaciones) || p.evaluaciones.length === 0) {
        cont.innerHTML = `<div class="empty-box">Sin evaluaciones ni progresiones cargadas.</div>`;
        return;
    }

    let html = `
        <div class="table-wrap">
            <table class="app-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Ejercicio</th>
                        <th>Resultado / Progresión</th>
                        <th>Nota</th>
                        <th style="text-align:right;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

    [...p.evaluaciones].reverse().forEach(ev => {
        html += `
            <tr>
                <td data-label="Fecha"><b>${ev.fecha}</b></td>
                <td data-label="Ejercicio"><strong>${ev.ejercicio}</strong></td>
                <td data-label="Resultado"><span class="badge badge-ok" style="font-size:0.78rem;">${ev.detalle}</span></td>
                <td data-label="Nota"><small>${ev.nota || "-"}</small></td>
                <td data-label="Acciones">
                    <div style="display:flex; gap:0.35rem; justify-content:flex-end;">
                        <button type="button" class="btn btn-secondary btn-sm usr-action-allow" onclick="abrirModalModificarProgresionEvalCDM(${p.id}, ${ev.id})" title="Modificar kilos, repeticiones o fecha">
                            ✏️ Modificar
                        </button>
                        <button type="button" class="btn btn-danger btn-sm usr-action-allow" onclick="quitarProgresionEvalCDM(${p.id}, ${ev.id})" title="Quitar esta progresión">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    cont.innerHTML = html + `</tbody></table></div>`;
};

// =========================================================================
// 5. AISLAMIENTO PERSONAL DE SERIES Y PROGRESIONES (SIN AUTO-RELOJ MOLESTO)
// =========================================================================

function obtenerIdPersonaActivaEnVistaCDM() {
    const p = obtenerPersonaActualEnFichaCDM();
    return p ? Number(p.id) : 0;
}

obtenerClaveSeriesHoyCDM = function (personaIdOpt = null) {
    const hoy = new Date().toISOString().split("T")[0];
    const pid = personaIdOpt || obtenerIdPersonaActivaEnVistaCDM() || "general";
    return `cdm_series_check_u${pid}_${hoy}`;
};

obtenerMapaSeriesHoyCDM = function (personaIdOpt = null) {
    try {
        return JSON.parse(localStorage.getItem(obtenerClaveSeriesHoyCDM(personaIdOpt))) || {};
    } catch {
        return {};
    }
};

function guardarMapaSeriesHoyCDM(mapa, personaIdOpt = null) {
    localStorage.setItem(obtenerClaveSeriesHoyCDM(personaIdOpt), JSON.stringify(mapa));
}

// Al tocar S1, S2, S3, S4: SOLO marca la serie en tiempo real (NO abre ningún reloj automático)
alternarSerieCompletadaCDM = function (claveSerie, pausaStr, nombreEjercicio, totalSeries, idRutina, idxEj) {
    const pid = obtenerIdPersonaActivaEnVistaCDM();
    const mapa = obtenerMapaSeriesHoyCDM(pid);
    mapa[claveSerie] = !Boolean(mapa[claveSerie]);
    guardarMapaSeriesHoyCDM(mapa, pid);

    const p = obtenerPersonaActualEnFichaCDM();
    window.agregarBotonesVideoEnRutinasJugador({ personaId: p?.id || pid });
    const sesion = obtenerSesionActivaCDM();
    if (sesion && sesion.rol === "usuario") {
        renderizarInicioTarjetasGrandesUsuario(sesion);
    }
};

function normalizarClaveProgPersonalCDM(nombreEjercicio = "") {
    return String(nombreEjercicio || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

function obtenerProgresionPersonalEjercicioCDM(personaObj, nombreEjercicio, pesoBaseRutina, repsBaseRutina) {
    if (!personaObj) {
        return { pesoMostrar: pesoBaseRutina || "A ajustar", repsMostrar: repsBaseRutina || "8-10", rmMejor: null, ultimaNota: null, esPersonalizado: false, ultimaEvalId: null };
    }
    const clave = normalizarClaveProgPersonalCDM(nombreEjercicio);
    const progGuardada = personaObj.progresionesPersonales && personaObj.progresionesPersonales[clave]
        ? personaObj.progresionesPersonales[clave]
        : null;

    const evalsMatch = (personaObj.evaluaciones || []).filter(ev =>
        normalizarClaveProgPersonalCDM(ev.ejercicio) === clave ||
        normalizarClaveProgPersonalCDM(ev.ejercicio).includes(clave) ||
        clave.includes(normalizarClaveProgPersonalCDM(ev.ejercicio))
    );

    const ultimaEval = evalsMatch.length > 0 ? evalsMatch[evalsMatch.length - 1] : null;
    const mejorRM = evalsMatch.length > 0 ? Math.max(...evalsMatch.map(e => Number(e.valor) || 0)) : null;

    if (progGuardada) {
        return {
            pesoMostrar: progGuardada.peso || pesoBaseRutina || "A ajustar",
            repsMostrar: progGuardada.reps || repsBaseRutina || "8-10",
            rmMejor: mejorRM || progGuardada.rm || null,
            ultimaNota: `${progGuardada.peso} × ${progGuardada.reps} (${progGuardada.fecha || "Hoy"})`,
            esPersonalizado: true,
            ultimaEvalId: ultimaEval ? ultimaEval.id : null
        };
    }

    return {
        pesoMostrar: pesoBaseRutina || "A ajustar",
        repsMostrar: repsBaseRutina || "8-10",
        rmMejor: mejorRM,
        ultimaNota: ultimaEval ? `${ultimaEval.detalle} (${ultimaEval.fecha.slice(5)})` : null,
        esPersonalizado: false,
        ultimaEvalId: ultimaEval ? ultimaEval.id : null
    };
}

function guardarProgresionPersonalAisladaCDM(personaId, idRutina, idxEj, nombreEjercicio) {
    const lista = obtenerPersonasRealesCDM();
    const p = lista.find(x => Number(x.id) === Number(personaId));
    if (!p) return;

    const inpKg = document.getElementById(`inp_prog_kg_${personaId}_${idRutina}_${idxEj}`) || document.getElementById(`inp_kg_live_${idRutina}_${idxEj}`);
    const inpReps = document.getElementById(`inp_prog_reps_${personaId}_${idRutina}_${idxEj}`) || document.getElementById(`inp_reps_live_${idRutina}_${idxEj}`);
    const kgVal = parseFloat(inpKg?.value);
    const repsVal = parseInt(inpReps?.value) || 8;

    if (isNaN(kgVal) || kgVal <= 0) {
        alert("Ingresá los kilos que utilizaste hoy (ej: 65).");
        return;
    }

    const hoy = typeof obtenerHoyISO === "function" ? obtenerHoyISO() : new Date().toISOString().split("T")[0];
    const rmEst = Math.round((repsVal === 1 ? kgVal : kgVal * (1 + repsVal / 30)) * 10) / 10;
    const fRel = (rmEst / (p.peso || 70)).toFixed(2);
    const clave = normalizarClaveProgPersonalCDM(nombreEjercicio);

    if (!p.progresionesPersonales || typeof p.progresionesPersonales !== "object") {
        p.progresionesPersonales = {};
    }
    p.progresionesPersonales[clave] = {
        ejercicio: nombreEjercicio,
        peso: `${kgVal} kg`,
        kgNumerico: kgVal,
        reps: String(repsVal),
        rm: rmEst,
        fecha: hoy
    };

    const rutinas = obtenerRutinasRealesCDM();
    const r = rutinas.find(x => Number(x.id) === Number(idRutina));
    if (r && !r.esGrupal && Number(r.personaId) === Number(p.id) && r.ejercicios && r.ejercicios[idxEj]) {
        r.ejercicios[idxEj].peso = `${kgVal} kg`;
    }

    if (!Array.isArray(p.evaluaciones)) p.evaluaciones = [];
    p.evaluaciones.push({
        id: Date.now(),
        fecha: hoy,
        ejercicio: nombreEjercicio,
        tipo: "fuerza_kg",
        valor: rmEst,
        unidad: "kg (1RM)",
        detalle: `${kgVal} kg × ${repsVal} reps (1RM: ${rmEst} kg • F.Rel: ${fRel}x)`,
        nota: "💪 Progresión personal desde Mi Rutina"
    });
    p.evaluaciones.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    persistirCambiosPersonasYRutinasCDM();

    if (typeof mostrarToast === "function") {
        mostrarToast(`💪 Carga personal de ${p.nombre} en ${nombreEjercicio} (${kgVal} kg × ${repsVal}) guardada.`);
    }

    window.agregarBotonesVideoEnRutinasJugador({ personaId: p.id });
    if (typeof window.renderizarHistorialJugador === "function") {
        window.renderizarHistorialJugador(p);
    }
    if (typeof dibujarGraficoEvolucion === "function") {
        dibujarGraficoEvolucion();
    }
}

window.construirBarraMemoriaKilosHTML = function (personaId, idRutina, idxEj, ex) {
    const lista = obtenerPersonasRealesCDM();
    const p = lista.find(x => Number(x.id) === Number(personaId));
    if (!p) return "";

    const infoProg = obtenerProgresionPersonalEjercicioCDM(p, ex.nombre, ex.peso, ex.reps);
    const kgSugerido = parseFloat(String(infoProg.pesoMostrar).replace(",", ".")) || "";
    const repsSugeridas = parseInt(String(infoProg.repsMostrar)) || 8;
    const nomEsc = String(ex.nombre || "").replace(/'/g, "\\'");

    return `
        <div class="live-overload-bar" onclick="event.stopPropagation();">
            <div class="live-overload-memory">
                <span class="overload-chip-last">
                    👤 <b>Mi última carga:</b> ${infoProg.ultimaNota || "Sin registro previo"}
                </span>
                ${infoProg.rmMejor ? `<span class="overload-chip-pr">🏆 Mi PR 1RM: ${infoProg.rmMejor} kg</span>` : ""}
                <span class="badge badge-celeste" style="font-size:0.63rem;">🔒 Solo afecta a ${p.nombre}</span>
            </div>
            <div class="live-overload-inputs">
                <input type="number" step="0.5" id="inp_prog_kg_${p.id}_${idRutina}_${idxEj}" placeholder="Kg hoy" value="${kgSugerido}" title="Kilos levantados hoy">
                <span style="font-size:0.74rem; font-weight:800; color:var(--ink-500);">×</span>
                <input type="number" id="inp_prog_reps_${p.id}_${idRutina}_${idxEj}" placeholder="Reps" value="${repsSugeridas}" title="Repeticiones logradas hoy">
                <button type="button" class="btn btn-primary btn-sm usr-action-allow" style="min-height:31px; padding:0.2rem 0.65rem;" onclick="guardarProgresionPersonalAisladaCDM(${p.id}, ${idRutina}, ${idxEj}, '${nomEsc}')">
                    💾 Guardar Mi Carga
                </button>
                ${infoProg.ultimaEvalId ? `
                    <button type="button" class="btn btn-secondary btn-sm usr-action-allow" style="min-height:31px; padding:0.2rem 0.55rem;" onclick="abrirModalModificarProgresionEvalCDM(${p.id}, ${infoProg.ultimaEvalId})" title="Modificar o quitar última progresión">
                        ✏️ Editar
                    </button>
                ` : ""}
                ${infoProg.esPersonalizado ? `
                    <button type="button" class="btn btn-danger btn-sm usr-action-allow" style="min-height:31px; padding:0.2rem 0.55rem;" onclick="limpiarCargaPersonalRutinaCDM(${p.id}, '${nomEsc}')" title="Restaurar peso original de la rutina">
                        ↺
                    </button>
                ` : ""}
            </div>
        </div>
    `;
};

window.guardarAvanceEnVivoDesdeRutinaCDM = function (personaId, idRutina, idxEj) {
    const rutinas = obtenerRutinasRealesCDM();
    const r = rutinas.find(x => Number(x.id) === Number(idRutina));
    const ex = r && r.ejercicios ? r.ejercicios[idxEj] : null;
    if (!ex) return;
    guardarProgresionPersonalAisladaCDM(personaId, idRutina, idxEj, ex.nombre);
};

// =========================================================================
// 6. MODAL DE AUTOGESTIÓN DE RUTINAS PARA EL USUARIO HABILITADO
// =========================================================================

function abrirModalCrearRutinaPropiaUsuarioCDM(idRutinaEditar = null) {
    const p = obtenerPersonaActualEnFichaCDM();
    if (!p || (!p.puedeCrearRutinas && !esAdminCDM())) {
        if (typeof mostrarToast === "function") {
            mostrarToast("🔒 Tu entrenador aún no habilitó la creación libre de rutinas en tu perfil.");
        }
        return;
    }

    if (typeof asegurarModalVideoEnPaginaActualCDM === "function") asegurarModalVideoEnPaginaActualCDM();
    const modal = document.getElementById("modalVideoEjercicio");
    if (!modal) return;

    const rutinas = obtenerRutinasRealesCDM();
    const rEdit = idRutinaEditar ? rutinas.find(r => Number(r.id) === Number(idRutinaEditar) && Number(r.personaId) === Number(p.id)) : null;
    const ejerciciosBase = rEdit && Array.isArray(rEdit.ejercicios) && rEdit.ejercicios.length > 0
        ? rEdit.ejercicios
        : [{ nombre: "", series: 4, reps: "8-10", peso: "Mi carga", pausa: "90s", forma: "" }];

    const todosNombres = typeof obtenerTodosLosNombresEjerciciosCDM === "function" ? obtenerTodosLosNombresEjerciciosCDM() : [];

    modal.innerHTML = `
        <div class="modal-window" style="max-width:680px;">
            <div class="modal-top">
                <div>
                    <span class="badge badge-ok">🔓 ENTRENAMIENTO AUTÓNOMO HABILITADO</span>
                    <h3 style="color:var(--ink-900); margin-top:4px;">
                        ${rEdit ? `✏️ Editar Rutina: ${rEdit.nombre}` : `🏋️ Armar Nueva Rutina Personal para ${p.nombre}`}
                    </h3>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalVideoEjercicio()">✕</button>
            </div>

            <form onsubmit="guardarRutinaPropiaUsuarioDesdeModalCDM(event, ${p.id}, ${rEdit ? rEdit.id : "null"})">
                <div class="grid-3" style="margin-bottom:0.8rem;">
                    <div class="field">
                        <label>Nombre de la Rutina *</label>
                        <input type="text" id="usrRutNombre" required placeholder="Ej: Día 1 - Pecho y Espalda" value="${(rEdit?.nombre || "").replace(/"/g, "&quot;")}">
                    </div>
                    <div class="field">
                        <label>Enfoque / Objetivo *</label>
                        <select id="usrRutObjetivo">
                            <option value="Hipertrofia" ${rEdit?.objetivo?.includes("Hipertrofia") ? "selected" : ""}>💪 Hipertrofia / Musculación</option>
                            <option value="Fuerza" ${rEdit?.objetivo?.includes("Fuerza") ? "selected" : ""}>🏋️ Fuerza</option>
                            <option value="Potencia" ${rEdit?.objetivo?.includes("Potencia") ? "selected" : ""}>⚡ Potencia y Velocidad</option>
                            <option value="Funcional y Core" ${rEdit?.objetivo?.includes("Funcional") ? "selected" : ""}>🔥 Funcional y Core</option>
                            <option value="Movilidad" ${rEdit?.objetivo?.includes("Movilidad") ? "selected" : ""}>🤸 Movilidad / Prevención</option>
                        </select>
                    </div>
                    <div class="field">
                        <label>Días de Entreno *</label>
                        <input type="text" id="usrRutDias" required placeholder="Ej: Lunes y Jueves" value="${(rEdit?.dias || "Lunes, Miércoles y Viernes").replace(/"/g, "&quot;")}">
                    </div>
                </div>

                <datalist id="dlEjerciciosAutogestionUser">
                    ${todosNombres.map(n => `<option value="${n.replace(/"/g, "&quot;")}">`).join("")}
                </datalist>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                    <label style="font-size:0.72rem; font-weight:800; color:var(--ink-700); text-transform:uppercase;">
                        📋 Ejercicios de la rutina:
                    </label>
                    <button type="button" class="btn btn-secondary btn-sm usr-action-allow" onclick="agregarFilaModalRutinaPropiaUsuarioCDM()">
                        + Sumar Ejercicio
                    </button>
                </div>

                <div id="contenedorFilasRutinaPropiaUser" style="max-height:310px; overflow-y:auto; padding-right:4px; margin-bottom:0.85rem;">
                    ${ejerciciosBase.map((ex, idx) => construirFilaHTMLRutinaPropiaUsuario(idx + 1, ex)).join("")}
                </div>

                <div class="field" style="margin-bottom:1rem;">
                    <label>Notas Personales (Opcional)</label>
                    <input type="text" id="usrRutNotas" placeholder="Ej: Subir 2.5kg la semana que viene..." value="${(rEdit?.notas || "").replace(/"/g, "&quot;")}">
                </div>

                <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                    <button type="button" class="btn btn-ghost" onclick="cerrarModalVideoEjercicio()">Cancelar</button>
                    <button type="submit" class="btn btn-primary usr-action-allow">
                        <i class="ri-save-3-line"></i> Guardar en Mis Rutinas
                    </button>
                </div>
            </form>
        </div>
    `;
    modal.classList.remove("hidden");
}

function construirFilaHTMLRutinaPropiaUsuario(num, ex = {}) {
    return `
        <div class="ex-builder-row usr-own-ex-row">
            <div class="ex-builder-top">
                <span class="ex-builder-num">#${num}</span>
                <div class="field" style="flex:1;">
                    <input type="text" class="uo-nombre" list="dlEjerciciosAutogestionUser" required placeholder="Nombre del ejercicio (Ej: Press de Banca)" value="${(ex.nombre || "").replace(/"/g, "&quot;")}">
                </div>
                <button type="button" class="btn btn-danger btn-sm ex-builder-del usr-action-allow" onclick="this.closest('.usr-own-ex-row').remove()">✕</button>
            </div>
            <div class="ex-builder-metrics-grid">
                <div class="field"><label>Series</label><input type="number" class="uo-series" required min="1" max="15" value="${ex.series || 4}"></div>
                <div class="field"><label>Reps</label><input type="text" class="uo-reps" required value="${(ex.reps || "8-10").replace(/"/g, "&quot;")}"></div>
                <div class="field"><label>Mi Peso / Carga</label><input type="text" class="uo-peso" value="${(ex.peso || "A ajustar").replace(/"/g, "&quot;")}"></div>
                <div class="field"><label>Pausa</label><input type="text" class="uo-pausa" value="${(ex.pausa || "90s").replace(/"/g, "&quot;")}"></div>
            </div>
        </div>
    `;
}

function agregarFilaModalRutinaPropiaUsuarioCDM() {
    const cont = document.getElementById("contenedorFilasRutinaPropiaUser");
    if (!cont) return;
    const n = cont.querySelectorAll(".usr-own-ex-row").length + 1;
    cont.insertAdjacentHTML("beforeend", construirFilaHTMLRutinaPropiaUsuario(n, {}));
}

function guardarRutinaPropiaUsuarioDesdeModalCDM(e, personaId, idRutinaEditar = null) {
    e.preventDefault();
    const lista = obtenerPersonasRealesCDM();
    const p = lista.find(x => Number(x.id) === Number(personaId));
    if (!p) return;

    const filas = document.querySelectorAll("#contenedorFilasRutinaPropiaUser .usr-own-ex-row");
    if (filas.length === 0) {
        alert("Agregá al menos 1 ejercicio a tu rutina.");
        return;
    }

    const ejercicios = [];
    filas.forEach(f => {
        const nom = f.querySelector(".uo-nombre")?.value.trim();
        if (!nom) return;
        if (typeof agregarEjercicioInventadoAlCatalogoCDM === "function") {
            agregarEjercicioInventadoAlCatalogoCDM(nom, "fuerza_1rm", true);
        }
        ejercicios.push({
            nombre: nom,
            series: parseInt(f.querySelector(".uo-series")?.value) || 4,
            reps: f.querySelector(".uo-reps")?.value.trim() || "8-10",
            peso: f.querySelector(".uo-peso")?.value.trim() || "Mi carga",
            pausa: f.querySelector(".uo-pausa")?.value.trim() || "90s",
            forma: ""
        });
    });

    const datosRutina = {
        id: idRutinaEditar ? Number(idRutinaEditar) : Date.now(),
        esGrupal: false,
        creadaPorUsuario: true,
        deporteDestino: p.deporte,
        categoriaDestino: p.categoria,
        personaId: p.id,
        etiquetaDestino: `👤 ${p.nombre} ${p.apellido} (Mi Rutina Propia)`,
        fecha: new Date().toLocaleDateString("es-AR"),
        nombre: document.getElementById("usrRutNombre").value.trim(),
        objetivo: document.getElementById("usrRutObjetivo").value,
        dias: document.getElementById("usrRutDias").value.trim(),
        notas: document.getElementById("usrRutNotas").value.trim(),
        ejercicios
    };

    const rutinas = obtenerRutinasRealesCDM();
    if (idRutinaEditar) {
        const idx = rutinas.findIndex(r => Number(r.id) === Number(idRutinaEditar));
        if (idx >= 0) rutinas[idx] = datosRutina;
    } else {
        rutinas.unshift(datosRutina);
    }

    persistirCambiosPersonasYRutinasCDM();
    cerrarModalVideoEjercicio();

    if (typeof mostrarToast === "function") {
        mostrarToast(`✅ Rutina personal "${datosRutina.nombre}" guardada.`);
    }

    window.agregarBotonesVideoEnRutinasJugador({ personaId: p.id });
    const ses = obtenerSesionActivaCDM();
    if (ses && ses.rol === "usuario") {
        renderizarInicioTarjetasGrandesUsuario(ses);
    }
}

function quitarMiRutinaAutogestionadaCDM(idRutina, personaId) {
    const rutinas = obtenerRutinasRealesCDM();
    const r = rutinas.find(x => Number(x.id) === Number(idRutina) && Number(x.personaId) === Number(personaId));
    if (!r) return;
    if (!confirm(`🗑️ ¿Quitar la rutina personal "${r.nombre}"?`)) return;

    const idx = rutinas.findIndex(x => Number(x.id) === Number(idRutina));
    if (idx >= 0) rutinas.splice(idx, 1);
    persistirCambiosPersonasYRutinasCDM();

    window.agregarBotonesVideoEnRutinasJugador({ personaId });
    const ses = obtenerSesionActivaCDM();
    if (ses && ses.rol === "usuario") {
        renderizarInicioTarjetasGrandesUsuario(ses);
    }
}

// =========================================================================
// 7. NAVEGACIÓN Y RENDERIZADO DE TARJETAS DE RUTINA (SIMPLE vs. AVANZADO)
// =========================================================================

abrirSeccionUsuarioDesdeCard = function (nombreSeccion) {
    document.querySelectorAll(".jug-seccion").forEach(s => {
        s.classList.add("hidden");
        s.classList.remove("animate-in");
    });
    const sec = document.getElementById(`jug-sec-${nombreSeccion}`);
    if (sec) {
        sec.classList.remove("hidden");
        sec.classList.add("animate-in");
    }

    document.querySelectorAll(".module-tabs .mod-tab, .user-mobile-bottom-dock .user-quick-dock-btn").forEach(b => {
        b.classList.toggle("active", b.getAttribute("data-user-tab") === nombreSeccion);
    });

    const sesion = obtenerSesionActivaCDM();
    if (nombreSeccion === "inicio-user" && sesion) {
        renderizarInicioTarjetasGrandesUsuario(sesion);
    } else if (nombreSeccion === "rutinas") {
        const p = obtenerPersonaActualEnFichaCDM();
        window.agregarBotonesVideoEnRutinasJugador(sesion || { personaId: p?.id });
    } else if (nombreSeccion === "videoteca-user") {
        renderizarVideotecaModoUsuario();
    } else if (nombreSeccion === "ranking-user" && sesion) {
        renderizarRankingModoUsuario(sesion);
    } else if (nombreSeccion === "graficos") {
        if (typeof dibujarGraficoEvolucion === "function") dibujarGraficoEvolucion();
        const p = obtenerPersonaActualEnFichaCDM();
        if (p && typeof dibujarRadarJugador === "function") dibujarRadarJugador(p);
        if (p && typeof window.renderizarHistorialJugador === "function") window.renderizarHistorialJugador(p);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
};

function asegurarBarraNavegacionUsuarioClaraCDM() {
    if (document.body.getAttribute("data-rol") !== "usuario") return;
    const tabsBar = document.querySelector(".module-tabs");
    if (tabsBar && !tabsBar.dataset.enhancedNavReady) {
        tabsBar.dataset.enhancedNavReady = "1";
        tabsBar.innerHTML = `
            <button type="button" class="mod-tab active" data-user-tab="inicio-user" onclick="abrirSeccionUsuarioDesdeCard('inicio-user')">
                <i class="ri-home-5-fill"></i><span>Inicio</span>
            </button>
            <button type="button" class="mod-tab" data-user-tab="rutinas" onclick="abrirSeccionUsuarioDesdeCard('rutinas')">
                <i class="ri-clipboard-fill"></i><span>Mis Rutinas</span>
            </button>
            <button type="button" class="mod-tab" data-user-tab="videoteca-user" onclick="abrirSeccionUsuarioDesdeCard('videoteca-user')">
                <i class="ri-movie-2-fill"></i><span>Videos</span>
            </button>
            <button type="button" class="mod-tab" data-user-tab="graficos" onclick="abrirSeccionUsuarioDesdeCard('graficos')">
                <i class="ri-line-chart-fill"></i><span>Mi Progreso</span>
            </button>
            <button type="button" class="mod-tab" data-user-tab="calculadora" onclick="abrirSeccionUsuarioDesdeCard('calculadora')">
                <i class="ri-calculator-fill"></i><span>Tabla % 1RM</span>
            </button>
            <button type="button" class="mod-tab" data-user-tab="ranking-user" onclick="abrirSeccionUsuarioDesdeCard('ranking-user')">
                <i class="ri-trophy-fill"></i><span>Ranking</span>
            </button>
        `;
    }

    if (!document.getElementById("cdmUserMobileBottomDock")) {
        const dock = document.createElement("nav");
        dock.id = "cdmUserMobileBottomDock";
        dock.className = "user-mobile-bottom-dock";
        dock.innerHTML = `
            <button type="button" class="user-quick-dock-btn active" data-user-tab="inicio-user" onclick="abrirSeccionUsuarioDesdeCard('inicio-user')">
                <i class="ri-home-5-fill"></i><span>Inicio</span>
            </button>
            <button type="button" class="user-quick-dock-btn" data-user-tab="rutinas" onclick="abrirSeccionUsuarioDesdeCard('rutinas')">
                <i class="ri-clipboard-fill"></i><span>Rutinas</span>
            </button>
            <button type="button" class="user-quick-dock-btn" data-user-tab="videoteca-user" onclick="abrirSeccionUsuarioDesdeCard('videoteca-user')">
                <i class="ri-movie-2-fill"></i><span>Videos</span>
            </button>
            <button type="button" class="user-quick-dock-btn" data-user-tab="graficos" onclick="abrirSeccionUsuarioDesdeCard('graficos')">
                <i class="ri-line-chart-fill"></i><span>Progreso</span>
            </button>
            <button type="button" class="user-quick-dock-btn" data-user-tab="calculadora" onclick="abrirSeccionUsuarioDesdeCard('calculadora')">
                <i class="ri-calculator-fill"></i><span>% 1RM</span>
            </button>
            <button type="button" class="user-quick-dock-btn" data-user-tab="ranking-user" onclick="abrirSeccionUsuarioDesdeCard('ranking-user')">
                <i class="ri-trophy-fill"></i><span>Ranking</span>
            </button>
        `;
        document.body.appendChild(dock);
    }
}

function alternarEjercicioCompletoSimpleCDM(idRutina, idxEj, cantSeries, personaIdOpt = null) {
    const pid = personaIdOpt || obtenerIdPersonaActivaEnVistaCDM();
    const mapa = obtenerMapaSeriesHoyCDM(pid);
    const primeraClave = `${idRutina}_${idxEj}_S1`;
    const yaEstabaHecho = Boolean(mapa[primeraClave]);

    for (let s = 1; s <= cantSeries; s++) {
        const k = `${idRutina}_${idxEj}_S${s}`;
        if (yaEstabaHecho) delete mapa[k];
        else mapa[k] = true;
    }

    guardarMapaSeriesHoyCDM(mapa, pid);
    const p = obtenerPersonaActualEnFichaCDM();
    window.agregarBotonesVideoEnRutinasJugador({ personaId: p?.id || pid });
    const ses = obtenerSesionActivaCDM();
    if (ses && ses.rol === "usuario") {
        renderizarInicioTarjetasGrandesUsuario(ses);
    }
}

function construirVistaRutinasUsuarioSimplificadaCDM(rutinasLista, personaObj) {
    if (typeof asegurarVideotecaCargada === "function") asegurarVideotecaCargada();
    if (typeof asegurarModalVideoEnPaginaActualCDM === "function") asegurarModalVideoEnPaginaActualCDM();
    asegurarGotaRelojitoFlotanteCDM();

    sincronizarAtributoCobranzaBodyCDM();
    const nivelVista = obtenerNivelVistaRutinaEfectivoCDM(personaObj); // 'simple' | 'avanzado'
    const esModoSimple = nivelVista === "simple";
    const mapaSeries = obtenerMapaSeriesHoyCDM(personaObj?.id);
    const puedeAuto = Boolean(personaObj && personaObj.puedeCrearRutinas);
    const rolActual = document.body.getAttribute("data-rol");
    const videoteca = obtenerVideotecaRealCDM();

    const barraControlAdminComplejidadHTML = rolActual === "admin" && personaObj ? `
        <div class="admin-complexity-toolbar">
            <div>
                <div style="display:flex; align-items:center; gap:0.45rem; flex-wrap:wrap;">
                    <strong style="font-size:0.88rem; color:var(--ink-900);">
                        🎚️ Vista de Rutina de ${personaObj.nombre} ${personaObj.apellido}:
                    </strong>
                    <span class="badge ${esModoSimple ? "badge-ok" : "badge-purple"}" style="font-size:0.74rem;">
                        ${esModoSimple ? "🟢 MODO SIMPLE (Sin pesos ni tiempos)" : "🚀 MODO AVANZADO (Con pesos, 1RM y Biomecánica)"}
                    </span>
                </div>
                <small style="color:var(--ink-500); font-size:0.74rem; display:block; margin-top:2px;">
                    El reloj de descanso ahora está en la <b>gota flotante (💧⏱️)</b> abajo a la derecha solo para quien lo quiera usar.
                </small>
            </div>
            <div style="display:flex; gap:0.4rem; align-items:center; flex-wrap:wrap;">
                <select id="selModoVistaUsuarioToolbar" onchange="cambiarModoVistaRutinaUsuarioParticularCDM(${personaObj.id}, this.value)" style="width:auto; min-height:34px; font-weight:800; font-size:0.78rem;">
                    <option value="heredar" ${(!personaObj.modoVistaRutina || personaObj.modoVistaRutina === "heredar") ? "selected" : ""}>🔄 Usar Modo General del Club (${obtenerModoComplejidadComercioActualCDM().toUpperCase()})</option>
                    <option value="simple" ${personaObj.modoVistaRutina === "simple" ? "selected" : ""}>🟢 Vista SIMPLE (Solo Series × Reps y Video)</option>
                    <option value="avanzado" ${personaObj.modoVistaRutina === "avanzado" ? "selected" : ""}>🚀 Vista AVANZADA (Con Pesos, 1RM y Biomecánica)</option>
                </select>
                <button type="button" class="btn btn-primary btn-sm" onclick="cambiarModoVistaRutinaUsuarioParticularCDM(${personaObj.id}, document.getElementById('selModoVistaUsuarioToolbar').value)">
                    💾 Guardar Vista
                </button>
            </div>
        </div>
    ` : "";

    const bannerAutogestionHTML = (puedeAuto || rolActual === "admin") && personaObj ? `
        <div class="self-routine-banner">
            <div>
                <span class="badge badge-ok" style="background:rgba(255,255,255,0.2); color:#fff; border:none;">
                    ${puedeAuto ? "🔓 CANDADO ABIERTO: AUTOGESTIÓN HABILITADA" : "🔒 CANDADO CERRADO: SOLO RUTINAS DEL ENTRENADOR"}
                </span>
                <h4 style="font-size:1.05rem; font-weight:800; color:#ffffff; margin:4px 0 0 0;">
                    ${puedeAuto ? `${personaObj.nombre} está habilitado/a para cargar y armar sus propias rutinas` : `${personaObj.nombre} solo ve las rutinas asignadas por el entrenador`}
                </h4>
            </div>
            <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                ${rolActual === "admin" ? `
                    <button type="button" class="btn btn-secondary btn-sm" style="background:#ffffff; color:#064e3b; font-weight:800;" onclick="alternarPermisoAutogestionRutinaCDM(${personaObj.id})">
                        ${puedeAuto ? "🔒 Cerrar Candado (Bloquear Autogestión)" : "🔓 Abrir Candado (Permitir que arme su rutina)"}
                    </button>
                ` : ""}
                ${(puedeAuto || rolActual === "admin") ? `
                    <button type="button" class="btn btn-primary btn-sm usr-action-allow" style="background:#10b981; color:#ffffff; border-color:#059669; font-weight:800;" onclick="abrirModalCrearRutinaPropiaUsuarioCDM(null)">
                        <i class="ri-add-circle-fill"></i> + Crear Rutina para ${personaObj.nombre}
                    </button>
                ` : ""}
            </div>
        </div>
    ` : "";

    if (!Array.isArray(rutinasLista) || rutinasLista.length === 0) {
        return barraControlAdminComplejidadHTML + bannerAutogestionHTML + `<div class="empty-box">Todavía no hay planes de entrenamiento asignados.</div>`;
    }

    const tarjetasHTML = rutinasLista.map((r) => {
        let seriesTotales = 0;
        let seriesHechas = 0;
        const esMiaCreadaPorMi = Boolean(r.creadaPorUsuario && Number(r.personaId) === Number(personaObj?.id));

        const filasEjerciciosHTML = (r.ejercicios || []).map((ex, i) => {
            const cantSeries = Math.min(8, Math.max(1, parseInt(ex.series) || 4));
            seriesTotales += cantSeries;

            const infoProg = obtenerProgresionPersonalEjercicioCDM(personaObj, ex.nombre, ex.peso, ex.reps);

            let completadasCount = 0;
            let pillsSeriesProHTML = "";
            const nomEsc = String(ex.nombre || "").replace(/'/g, "\\'");

            for (let s = 1; s <= cantSeries; s++) {
                const claveS = `${r.id}_${i}_S${s}`;
                const ok = Boolean(mapaSeries[claveS]);
                if (ok) {
                    completadasCount++;
                    seriesHechas++;
                }
                pillsSeriesProHTML += `
                    <button type="button"
                        class="serie-check-pill usr-action-allow ${ok ? "done" : ""}"
                        onclick="alternarSerieCompletadaCDM('${claveS}', '', '${nomEsc}', ${cantSeries}, ${r.id}, ${i})">
                        ${ok ? "✓" : ""} S${s}
                    </button>
                `;
            }

            const ejercicioCompleto = completadasCount === cantSeries;
            const matchVideo = videoteca.find(v =>
                v.nombre.toLowerCase().includes((ex.nombre || "").toLowerCase()) ||
                (ex.nombre || "").toLowerCase().includes(v.nombre.toLowerCase())
            );
            const formaLimpia = ex.forma ? ex.forma.replace(/\(Video:.*?\)/gi, "").trim() : "";
            const idAnimDrawer = `anim_drawer_${r.id}_${i}`;

            const thumbHTML = matchVideo
                ? `<div class="clean-ex-thumb-btn" onclick="abrirModalReproductorEjercicio(${matchVideo.id})" title="Ver video de ${ex.nombre}">
                       <img src="${matchVideo.imagenPreview || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80'}" alt="${ex.nombre}">
                       <span class="clean-ex-thumb-play"><i class="ri-play-fill"></i></span>
                   </div>`
                : `<div class="clean-ex-thumb-btn">#${i + 1}</div>`;

            // En Modo Avanzado mostramos el avatar biomecánico 60 FPS; en Modo Simple no
            const miniHombrecitoHTML = (!esModoSimple && typeof renderMiniHombrecitoSVG === "function")
                ? renderMiniHombrecitoSVG(ex.nombre, r.objetivo || "")
                : "";

            return `
                <div class="clean-user-ex-row ${ejercicioCompleto ? "done-row" : ""}">
                    <div class="clean-user-ex-main">
                        <div class="clean-user-ex-left">
                            ${thumbHTML}
                            ${miniHombrecitoHTML}
                            <div class="clean-ex-info">
                                <!-- 1. TÍTULO DEL EJERCICIO ARRIBA -->
                                <h4>${i + 1}. ${ex.nombre}</h4>

                                <!-- 2. DEBAJO DEL TÍTULO: EN MODO SIMPLE SOLO SERIES×REPS | EN MODO AVANZADO SERIES×REPS + CARGA (SIN TIEMPO) -->
                                <div class="ex-big-prescription-row">
                                    <span class="ex-big-pill-primary">
                                        <i class="ri-repeat-line"></i> ${ex.series} SERIES × ${infoProg.repsMostrar} REPS
                                    </span>
                                    ${!esModoSimple ? `
                                        <span class="ex-big-pill-load">
                                            <i class="ri-scales-3-line"></i> CARGA: ${infoProg.pesoMostrar} ${infoProg.esPersonalizado ? "✓" : ""}
                                        </span>
                                    ` : ""}
                                </div>

                                ${formaLimpia ? `<small class="clean-ex-cue">💡 <b>Indicación técnica:</b> ${formaLimpia}</small>` : ""}
                            </div>
                        </div>

                        <div class="clean-ex-right-actions">
                            ${matchVideo ? `
                                <button type="button" class="btn btn-primary btn-sm usr-action-allow" onclick="abrirModalReproductorEjercicio(${matchVideo.id})">
                                    <i class="ri-play-circle-line"></i> Video
                                </button>
                            ` : ""}

                            ${!esModoSimple ? `
                                <button type="button" class="btn btn-secondary btn-sm btn-ejemplo-biomecanico usr-action-allow" onclick="document.getElementById('${idAnimDrawer}').classList.toggle('hidden')">
                                    <i class="ri-body-scan-fill"></i> Ejemplo 1-4
                                </button>
                            ` : ""}

                            <button type="button" class="clean-check-ex-btn usr-action-allow ${ejercicioCompleto ? "checked" : ""}" onclick="alternarEjercicioCompletoSimpleCDM(${r.id}, ${i}, ${cantSeries}, ${personaObj?.id || 0})">
                                ${ejercicioCompleto ? "✓ Completado" : "✓ Marcar Todo"}
                            </button>
                        </div>
                    </div>

                    <!-- 3. BARRA "⏱️ CONTROL TIEMPO REAL" LIMPIA (SIN TIEMPO DE PAUSA) -->
                    <div class="realtime-control-bar">
                        <div class="realtime-control-title">
                            <span class="realtime-pulse-dot"></span>
                            <span>⏱️ Control Tiempo Real <small style="font-weight:600; color:var(--ink-500); text-transform:none;">(${completadasCount}/${cantSeries} series hoy)</small></span>
                        </div>
                        <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
                            ${pillsSeriesProHTML}
                        </div>
                    </div>

                    <!-- 4. EXCLUSIVO DE VISTA AVANZADA: BIOMECÁNICA 1-4 Y BARRA DE PESOS / PROGRESIÓN 1RM -->
                    ${!esModoSimple ? `
                        <div id="${idAnimDrawer}" class="hidden">
                            ${typeof generarBloqueAnimacionHombrecitosHTML === "function" ? generarBloqueAnimacionHombrecitosHTML(ex.nombre, r.objetivo || "") : ""}
                        </div>
                        ${personaObj ? window.construirBarraMemoriaKilosHTML(personaObj.id, r.id, i, ex) : ""}
                    ` : ""}
                </div>
            `;
        }).join("");

        const pct = seriesTotales > 0 ? Math.round((seriesHechas / seriesTotales) * 100) : 0;

        return `
            <div class="user-workout-pro-card" style="margin-bottom:1.25rem;">
                <div class="user-workout-banner" style="padding:1.1rem 1.35rem;">
                    <div class="user-workout-banner-left">
                        <div style="display:flex; gap:0.4rem; flex-wrap:wrap; align-items:center; margin-bottom:0.25rem;">
                            <span class="user-workout-type-pill">${esMiaCreadaPorMi ? "🔓 Mi Rutina Propia" : `🏋️ ${r.objetivo || "Plan Activo"}`}</span>
                            <span class="user-workout-days-pill"><i class="ri-calendar-event-line"></i> ${r.dias || "Semanal"}</span>
                            <span class="user-workout-type-pill" style="background:rgba(16,185,129,0.28);">${esModoSimple ? "🟢 Vista Simple" : "🚀 Vista Avanzada"}</span>
                        </div>
                        <h3 style="font-size:1.22rem; margin:0;">${r.nombre}</h3>
                    </div>

                    <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                        ${(esMiaCreadaPorMi && puedeAuto) || rolActual === "admin" ? `
                            <button type="button" class="btn btn-secondary btn-sm usr-action-allow" style="background:rgba(255,255,255,0.18); color:#fff; border-color:rgba(255,255,255,0.3);" onclick="abrirModalCrearRutinaPropiaUsuarioCDM(${r.id})">
                                ✏️ Editar
                            </button>
                            <button type="button" class="btn btn-danger btn-sm usr-action-allow" onclick="quitarMiRutinaAutogestionadaCDM(${r.id}, ${personaObj?.id || 0})">
                                🗑️
                            </button>
                        ` : ""}
                        <div class="user-workout-progress-card" style="padding:0.55rem 0.9rem; min-width:165px;">
                            <div style="display:flex; justify-content:space-between; align-items:baseline;">
                                <small style="color:#bae6fd; font-weight:700; font-size:0.63rem;">CONTROL EN VIVO</small>
                                <strong style="color:#34d399; font-size:1.05rem; font-weight:800;">${pct}% Completado</strong>
                            </div>
                            <div class="user-workout-progress-track" style="height:6px; margin-top:3px;">
                                <div class="user-workout-progress-fill" style="width:${pct}%;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="clean-user-ex-list">
                    ${filasEjerciciosHTML}
                </div>

                ${r.notas ? `
                    <div class="user-workout-coach-banner" style="margin:0 1.25rem 1.1rem; padding:0.7rem 0.95rem;">
                        <i class="ri-megaphone-fill"></i>
                        <div><b>Nota del Entrenador:</b> ${r.notas}</div>
                    </div>
                ` : ""}
            </div>
        `;
    }).join("");

    return barraControlAdminComplejidadHTML + bannerAutogestionHTML + tarjetasHTML;
}

function inyectarBotonesRapidosEnTarjetasDeportistasDOM() {
    if (!esAdminCDM()) return;
    const lista = obtenerPersonasRealesCDM();
    document.querySelectorAll(".athlete-card").forEach(card => {
        const grp = card.querySelector(".ath-actions-group");
        if (!grp || grp.dataset.candadoInjected === "1") return;
        const attrClick = card.getAttribute("onclick") || "";
        const m = attrClick.match(/irAPaginaIndividual\((\d+)\)/);
        if (!m) return;
        const pid = Number(m[1]);
        const p = lista.find(x => Number(x.id) === pid);
        if (!p) return;

        grp.dataset.candadoInjected = "1";
        const autoOn = Boolean(p.puedeCrearRutinas);
        const vistaEf = obtenerNivelVistaRutinaEfectivoCDM(p);

        const btnCandado = document.createElement("button");
        btnCandado.type = "button";
        btnCandado.className = `btn ${autoOn ? "btn-ok" : "btn-ghost"} btn-sm`;
        btnCandado.title = autoOn
            ? "Autogestión de rutinas HABILITADA (Click para bloquear)"
            : "Autogestión de rutinas BLOQUEADA (Click para permitir que cargue su rutina)";
        btnCandado.innerHTML = autoOn ? "🔓" : "🔒";
        btnCandado.onclick = (e) => {
            e.stopPropagation();
            alternarPermisoAutogestionRutinaCDM(p.id);
        };

        const btnVista = document.createElement("button");
        btnVista.type = "button";
        btnVista.className = "btn btn-ghost btn-sm";
        btnVista.title = `Vista de rutina actual: ${vistaEf.toUpperCase()} (Click para cambiar entre Simple y Avanzada)`;
        btnVista.innerHTML = vistaEf === "simple" ? "🟢" : "🚀";
        btnVista.onclick = (e) => {
            e.stopPropagation();
            alternarVistaSimpleAvanzadaRapidaCardCDM(p.id);
        };

        grp.prepend(btnVista);
        grp.prepend(btnCandado);
    });
}

function aplicarOverrideVistaRutinasUsuarioBlindadoCDM() {
    asegurarBarraNavegacionUsuarioClaraCDM();
    asegurarGotaRelojitoFlotanteCDM();

    window.agregarBotonesVideoEnRutinasJugador = function (sesionOpt = null) {
        inyectarEstilosRutinasCompactasYModoSimpleCDM();
        asegurarBarraNavegacionUsuarioClaraCDM();
        asegurarGotaRelojitoFlotanteCDM();
        const cont = document.getElementById("listaRutinasGuardadasJugador");
        if (!cont) return;

        const listaP = obtenerPersonasRealesCDM();
        const p = (sesionOpt && sesionOpt.personaId)
            ? listaP.find(x => Number(x.id) === Number(sesionOpt.personaId))
            : obtenerPersonaActualEnFichaCDM();
        if (!p) return;

        const todasRutinas = obtenerRutinasRealesCDM();
        const rutinas = todasRutinas.filter(r =>
            Number(r.personaId) === Number(p.id) ||
            (r.esGrupal && r.deporteDestino === p.deporte && (r.categoriaDestino === p.categoria || r.categoriaDestino === "General"))
        );

        cont.className = "user-routines-full-list";
        cont.innerHTML = construirVistaRutinasUsuarioSimplificadaCDM(rutinas, p);
    };

    window.renderizarRutinasIndividuales = function (p) {
        window.agregarBotonesVideoEnRutinasJugador({ personaId: p?.id });
    };

    if (typeof window.refrescarVistasRutinasJerarquicasCDM === "function" && !window.__cdmJerarquicoPatched) {
        window.__cdmJerarquicoPatched = true;
        const _origRefrescarJerarquico = window.refrescarVistasRutinasJerarquicasCDM;
        window.refrescarVistasRutinasJerarquicasCDM = function () {
            if (document.body.dataset.page === "perfil-individual" || window.location.pathname.toLowerCase().includes("jugador.html")) {
                const p = obtenerPersonaActualEnFichaCDM();
                if (p) {
                    window.agregarBotonesVideoEnRutinasJugador({ personaId: p.id });
                    return;
                }
            }
            _origRefrescarJerarquico.apply(this, arguments);
        };
    }
}

// =========================================================================
// 8. CONTROLES DEL ADMIN EN CABECERA DE JUGADOR.HTML, TOPBAR Y MODAL PERSONA
// =========================================================================

const _origInyectarPanelCodigoEnFichaIndividual = inyectarPanelCodigoEnFichaIndividual;
inyectarPanelCodigoEnFichaIndividual = function () {
    _origInyectarPanelCodigoEnFichaIndividual.apply(this, arguments);
    if (!esAdminCDM()) return;

    const barra = document.getElementById("adminBoxCodigoFicha");
    const p = obtenerPersonaActualEnFichaCDM();
    if (!barra || !p) return;

    const prevControles = document.getElementById("boxControlesVistaYCandadoAdmin");
    if (prevControles) prevControles.remove();

    const habilitado = Boolean(p.puedeCrearRutinas);
    const modoVistaUser = p.modoVistaRutina || "heredar";

    const controlesExtra = document.createElement("div");
    controlesExtra.id = "boxControlesVistaYCandadoAdmin";
    controlesExtra.style = "display:flex; gap:0.4rem; align-items:center; flex-wrap:wrap;";
    controlesExtra.innerHTML = `
        <div style="display:inline-flex; align-items:center; gap:0.25rem; background:rgba(255,255,255,0.14); padding:0.2rem 0.35rem; border-radius:10px; border:1px solid rgba(255,255,255,0.28);">
            <select id="selModoVistaUsuarioHeader" onchange="cambiarModoVistaRutinaUsuarioParticularCDM(${p.id}, this.value)"
                    style="width:auto; min-height:30px; padding:0.15rem 0.5rem; font-size:0.74rem; font-weight:800; background:transparent; color:#fff; border:none;">
                <option value="heredar" ${modoVistaUser === "heredar" ? "selected" : ""} style="color:#0f172a;">🎚️ Vista: Automática (${obtenerModoComplejidadComercioActualCDM().toUpperCase()})</option>
                <option value="simple" ${modoVistaUser === "simple" ? "selected" : ""} style="color:#0f172a;">🟢 Vista Rutina: SIMPLE (Solo para ${p.nombre})</option>
                <option value="avanzado" ${modoVistaUser === "avanzado" ? "selected" : ""} style="color:#0f172a;">🚀 Vista Rutina: AVANZADA (Solo para ${p.nombre})</option>
            </select>
            <button type="button" class="btn btn-primary btn-sm" style="min-height:28px; padding:0.15rem 0.55rem; font-size:0.7rem;" onclick="cambiarModoVistaRutinaUsuarioParticularCDM(${p.id}, document.getElementById('selModoVistaUsuarioHeader').value)" title="Guardar vista para este usuario">
                💾 Guardar
            </button>
        </div>

        <button type="button" id="btnToggleAutogestionFichaCDM" class="btn btn-sm"
                style="${habilitado ? "background:#10b981; color:#ffffff; border-color:#059669; font-weight:800;" : "color:#ffffff; border-color:rgba(255,255,255,0.35); background:rgba(255,255,255,0.14); font-weight:700;"}"
                onclick="alternarPermisoAutogestionRutinaCDM(${p.id})"
                title="Habilitar o deshabilitar que esta persona cargue sus propias rutinas">
            ${habilitado ? "🔓 Autogestión Rutina: SÍ (Habilitado)" : "🔒 Autogestión Rutina: NO (Click para Desbloquear)"}
        </button>
    `;

    const cajaBotones = barra.querySelector("div:last-child");
    if (cajaBotones) cajaBotones.prepend(controlesExtra);
};

const _origInyectarBarraSesionTopbar = inyectarBarraSesionTopbar;
inyectarBarraSesionTopbar = function (sesion) {
    _origInyectarBarraSesionTopbar.apply(this, arguments);
    if (!sesion || sesion.rol !== "admin") return;

    const barra = document.getElementById("cdmBarraSesionActiva");
    if (!barra || document.getElementById("btnAdminSwitchComplejidadTop")) return;

    const modoActual = obtenerModoComplejidadComercioActualCDM();
    const btnComp = document.createElement("button");
    btnComp.type = "button";
    btnComp.id = "btnAdminSwitchComplejidadTop";
    btnComp.className = "btn btn-ghost btn-sm";
    btnComp.title = "Cambiar la vista general predeterminada de rutinas entre Modo Simple y Modo Avanzado";
    btnComp.onclick = () => {
        const nuevo = obtenerModoComplejidadComercioActualCDM() === "simple" ? "avanzado" : "simple";
        cambiarModoComplejidadGeneralDesdeAdminCDM(nuevo);
        btnComp.innerHTML = nuevo === "simple"
            ? `🟢 Rutinas Club: Simples`
            : `🚀 Rutinas Club: Avanzadas`;
    };
    btnComp.innerHTML = modoActual === "simple"
        ? `🟢 Rutinas Club: Simples`
        : `🚀 Rutinas Club: Avanzadas`;

    barra.insertBefore(btnComp, barra.firstChild);
};

const _origAbrirModalPersonaLoginHook = window.abrirModalPersona;
if (typeof _origAbrirModalPersonaLoginHook === "function") {
    window.abrirModalPersona = function (idEditar = null) {
        _origAbrirModalPersonaLoginHook.apply(this, arguments);
        const form = document.getElementById("formPersonaCDM");
        if (!form || document.getElementById("pPuedeCrearRutinas")) return;

        const lista = obtenerPersonasRealesCDM();
        const p = idEditar ? lista.find(x => Number(x.id) === Number(idEditar)) : null;
        const habilitado = Boolean(p && p.puedeCrearRutinas);
        const modoVista = p?.modoVistaRutina || "heredar";

        const divPermiso = document.createElement("div");
        divPermiso.style = "margin-bottom:0.95rem; background:var(--cdm-50); border:1.5px solid var(--line-celeste); padding:0.85rem 1rem; border-radius:14px; display:flex; flex-direction:column; gap:0.7rem;";
        divPermiso.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.75rem; flex-wrap:wrap;">
                <div>
                    <strong style="font-size:0.82rem; color:var(--cdm-900); display:block;">
                        🎚️ Nivel de Complejidad de Rutinas para este Usuario Particular
                    </strong>
                    <small style="color:var(--ink-500); font-size:0.72rem;">
                        Elegí si esta persona ve sus rutinas en formato Simple (sin pesos ni tiempo) o Avanzado (con pesos y 1RM).
                    </small>
                </div>
                <select id="pModoVistaRutina" style="width:auto; min-width:220px; font-weight:700;">
                    <option value="heredar" ${modoVista === "heredar" ? "selected" : ""}>🔄 Automático según el Gimnasio/Club</option>
                    <option value="simple" ${modoVista === "simple" ? "selected" : ""}>🟢 Vista Simple (Solo Series × Reps)</option>
                    <option value="avanzado" ${modoVista === "avanzado" ? "selected" : ""}>🚀 Vista Avanzada (Con Pesos y 1RM)</option>
                </select>
            </div>

            <label style="display:flex; align-items:center; justify-content:space-between; gap:0.75rem; cursor:pointer; padding-top:0.55rem; border-top:1px dashed var(--line-celeste);">
                <div>
                    <strong style="font-size:0.82rem; color:var(--cdm-900); display:block;">
                        🔓 Permitir que esta persona cargue sus propias rutinas (Sacar Candado)
                    </strong>
                    <small style="color:var(--ink-500); font-size:0.72rem;">
                        Si lo tildás, podrá crear y editar sus propias rutinas para entrenarse solo.
                    </small>
                </div>
                <input type="checkbox" id="pPuedeCrearRutinas" style="width:20px; height:20px; min-height:auto; flex-shrink:0;" ${habilitado ? "checked" : ""}>
            </label>
        `;

        const btnSubmitRow = form.querySelector("div:last-child");
        if (btnSubmitRow) form.insertBefore(divPermiso, btnSubmitRow);
    };
}

const _origGuardarPersonaCDMLoginHook = window.guardarPersonaCDM;
if (typeof _origGuardarPersonaCDMLoginHook === "function") {
    window.guardarPersonaCDM = function (e) {
        const chkAuto = Boolean(document.getElementById("pPuedeCrearRutinas")?.checked);
        const selVista = document.getElementById("pModoVistaRutina")?.value || "heredar";
        const idEdit = document.getElementById("pId")?.value;
        _origGuardarPersonaCDMLoginHook.apply(this, arguments);

        const lista = obtenerPersonasRealesCDM();
        if (idEdit) {
            const p = lista.find(x => Number(x.id) === Number(idEdit));
            if (p) {
                p.puedeCrearRutinas = chkAuto;
                p.modoVistaRutina = selVista;
            }
        } else if (lista.length > 0) {
            const ult = lista[lista.length - 1];
            ult.puedeCrearRutinas = chkAuto;
            ult.modoVistaRutina = selVista;
        }
        persistirCambiosPersonasYRutinasCDM();
    };
}

// =========================================================================
// 9. CONFIGURACIÓN POR COMERCIO EN HUB SUPERADMIN
// =========================================================================

const _origObtenerLicenciaConfigCDM = obtenerLicenciaConfigCDM;
obtenerLicenciaConfigCDM = function () {
    const lic = _origObtenerLicenciaConfigCDM.apply(this, arguments);
    lic.bloquearCobranza = Boolean(lic.bloquearCobranza);
    lic.modoComplejidad = lic.modoComplejidad || "avanzado";
    if (!lic.modulos) lic.modulos = { futbol: true, hockey: true, gym: true, consultorio: true };
    if (!Array.isArray(lic.profesionesHabilitadas)) {
        lic.profesionesHabilitadas = ["Quiropraxia", "Kinesiología", "Psicología", "Nutrición"];
    }
    if (lic.modulos.consultorio === undefined) {
        lic.modulos.consultorio = lic.profesionesHabilitadas.length > 0;
    }
    return lic;
};

const _origAplicarLicenciaYModulosCDM = aplicarLicenciaYModulosCDM;
aplicarLicenciaYModulosCDM = function () {
    _origAplicarLicenciaYModulosCDM.apply(this, arguments);
    sincronizarAtributoCobranzaBodyCDM();

    const lic = obtenerLicenciaConfigCDM();
    const mod = lic.modulos || { futbol: true, hockey: true, gym: true, consultorio: true };
    const profs = Array.isArray(lic.profesionesHabilitadas) ? lic.profesionesHabilitadas : [];
    const tieneConsultorio = Boolean(mod.consultorio && profs.length > 0);
    const tieneDeportesOGym = Boolean(mod.futbol || mod.hockey || mod.gym || (Array.isArray(lic.deportesExtra) && lic.deportesExtra.length > 0));

    const linkCons = document.querySelector('.app-sidebar .side-link[data-nav="consultorio"]');
    if (linkCons) linkCons.classList.toggle("hidden", !tieneConsultorio);

    const cardCons = document.getElementById("cardShowcaseConsultorioPro");
    if (cardCons) cardCons.classList.toggle("hidden", !tieneConsultorio);

    if (tieneConsultorio && !tieneDeportesOGym) {
        document.querySelectorAll('.app-sidebar .side-link[data-nav="inicio"], .app-sidebar .side-link[data-nav="futbol"], .app-sidebar .side-link[data-nav="hockey"], .app-sidebar .side-link[data-nav="gym"]').forEach(el => {
            el.classList.add("hidden");
        });
        if (typeof abrirModuloConsultorioIndependienteCDM === "function" && !window.__cdmAutoOpenedConsultorio) {
            window.__cdmAutoOpenedConsultorio = true;
            setTimeout(() => abrirModuloConsultorioIndependienteCDM(), 80);
        }
    }
};

const _origAbrirModalCrearOEditarComercio = abrirModalCrearOEditarComercio;
abrirModalCrearOEditarComercio = async function (claveClubEditar = null) {
    await _origAbrirModalCrearOEditarComercio.apply(this, arguments);
    const modal = document.getElementById("modalSuperAdminCDM");
    if (!modal) return;

    const lista = await obtenerListaCompletaComerciosCDM();
    const existente = claveClubEditar ? lista.find(x => x.claveClub === claveClubEditar) : null;
    const lic = existente?.licenciaConfig || {};
    const bloqueada = Boolean(lic.bloquearCobranza);
    const modoCompActual = lic.modoComplejidad || "simple";
    const profsGuardadas = Array.isArray(lic.profesionesHabilitadas)
        ? lic.profesionesHabilitadas
        : (claveClubEditar ? [] : ["Quiropraxia", "Kinesiología", "Psicología", "Nutrición"]);

    const clavesBase = CATALOGO_PROFESIONES_BASE_SAAS.map(p => p.clave);
    const profsExtraGuardadas = profsGuardadas.filter(p => !clavesBase.includes(p));

    const form = modal.querySelector("form");
    const bloquesDiv = form ? Array.from(form.children).filter(el => el.tagName === "DIV") : [];
    const primerBloque = bloquesDiv[0];
    const bloqueModulos = bloquesDiv.find(d => (d.innerText || "").includes("¿QUÉ MÓDULOS USA ESTE CLIENTE?"));

    if (form && primerBloque && !document.getElementById("mcModoComplejidad")) {
        const boxConfigExtra = document.createElement("div");
        boxConfigExtra.style = "display:flex; flex-direction:column; gap:0.75rem; margin-bottom:0.95rem;";
        boxConfigExtra.innerHTML = `
            <div style="background:#f0f9ff; border:1.5px solid #7dd3fc; border-radius:16px; padding:0.9rem 1rem;">
                <label style="font-size:0.72rem; font-weight:800; color:#0369a1; text-transform:uppercase; display:block; margin-bottom:0.4rem;">
                    🎚️ NIVEL DE COMPLEJIDAD PREDETERMINADO DE ESTE GIMNASIO / CLUB
                </label>
                <select id="mcModoComplejidad" style="font-weight:700; color:#0f172a; background:#ffffff;">
                    <option value="simple" ${modoCompActual === "simple" ? "selected" : ""}>🟢 Modo Simple / Clásico (Solo Series × Reps en grande, video y Control Tiempo Real)</option>
                    <option value="avanzado" ${modoCompActual === "avanzado" ? "selected" : ""}>🚀 Modo Avanzado / Pro (Con Pesos, Memoria 1RM y Biomecánica 60 FPS)</option>
                </select>
            </div>

            <div style="background:var(--warn-bg); border:1.5px solid rgba(245, 158, 11, 0.38); border-radius:16px; padding:0.8rem 1rem;">
                <label style="display:flex; align-items:center; justify-content:space-between; gap:0.85rem; cursor:pointer;">
                    <div>
                        <strong style="font-size:0.84rem; color:var(--warn-ink); display:flex; align-items:center; gap:0.35rem;">
                            🔒 Bloquear Parte de Cobranza / Cuotas en este Comercio
                        </strong>
                        <small style="color:var(--ink-500); font-size:0.72rem; display:block;">
                            Activalo si el cliente ya administra sus cobros en otro sistema externo.
                        </small>
                    </div>
                    <input type="checkbox" id="mcBloquearCobranza" style="width:20px; height:20px; min-height:auto; flex-shrink:0;" ${bloqueada ? "checked" : ""}>
                </label>
            </div>
        `;
        primerBloque.insertAdjacentElement("afterend", boxConfigExtra);
    }

    if (bloqueModulos && !document.getElementById("bloqueSeleccionProfesionesModalCDM")) {
        const divProfs = document.createElement("div");
        divProfs.id = "bloqueSeleccionProfesionesModalCDM";
        divProfs.style = "margin-top:0.95rem; padding-top:0.9rem; border-top:1.5px dashed #cbd5e1;";
        divProfs.innerHTML = `
            <label style="font-size:0.7rem; font-weight:800; color:#0369a1; text-transform:uppercase; display:block; margin-bottom:0.5rem;">
                🩺 HABILITAR PROFESIONES / CONSULTORIOS INDEPENDIENTES
            </label>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(145px, 1fr)); gap:0.5rem; margin-bottom:0.65rem;">
                ${CATALOGO_PROFESIONES_BASE_SAAS.map(pr => `
                    <label style="display:flex; align-items:center; gap:0.45rem; background:#ffffff; border:1px solid #cbd5e1; padding:0.5rem 0.65rem; border-radius:11px; cursor:pointer; font-weight:700; font-size:0.8rem; color:#0f172a;">
                        <input type="checkbox" class="mc-chk-profesion" value="${pr.clave}" style="width:17px; height:17px; min-height:auto;" ${profsGuardadas.includes(pr.clave) ? "checked" : ""}>
                        <span>${pr.icono} ${pr.nombre}</span>
                    </label>
                `).join("")}
            </div>
            <input type="text" id="mcProfesionesExtra" placeholder="Otras profesiones separadas por coma..." value="${profsExtraGuardadas.join(", ")}">
        `;
        bloqueModulos.appendChild(divProfs);
    }
};

const _origGuardarComercioDesdeModal = guardarComercioDesdeModal;
guardarComercioDesdeModal = async function (e, claveClubExistente = "") {
    const chkBloq = Boolean(document.getElementById("mcBloquearCobranza")?.checked);
    const modoComp = document.getElementById("mcModoComplejidad")?.value || "simple";
    const nombreInput = (document.getElementById("mcNombreEntidad")?.value || "").trim();

    const profsTildadas = Array.from(document.querySelectorAll(".mc-chk-profesion:checked")).map(c => c.value);
    const profsExtraTxt = (document.getElementById("mcProfesionesExtra")?.value || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
    const todasLasProfesiones = [...new Set([...profsTildadas, ...profsExtraTxt])];

    const chkGym = document.getElementById("mcModGym");
    const chkFut = document.getElementById("mcModFutbol");
    const chkHoc = document.getElementById("mcModHockey");
    const inpDep = document.getElementById("mcDeportesExtra");
    const ningunoDeportivo = !chkGym?.checked && !chkFut?.checked && !chkHoc?.checked && !(inpDep?.value || "").trim();
    let desmarcarGymLuego = false;

    if (ningunoDeportivo && todasLasProfesiones.length > 0 && chkGym) {
        chkGym.checked = true;
        desmarcarGymLuego = true;
    }

    await _origGuardarComercioDesdeModal.apply(this, arguments);

    const mapa = obtenerMapaLocalClubesCDM();
    let claveTarget = claveClubExistente;
    if (!claveTarget && nombreInput) {
        const match = Object.values(mapa).find(c => (c.licenciaConfig?.nombreEntidad || "").toLowerCase() === nombreInput.toLowerCase());
        if (match) claveTarget = match.claveClub;
    }

    if (claveTarget && mapa[claveTarget] && mapa[claveTarget].licenciaConfig) {
        const licTarget = mapa[claveTarget].licenciaConfig;
        if (!licTarget.modulos) licTarget.modulos = {};
        if (desmarcarGymLuego) licTarget.modulos.gym = false;
        licTarget.profesionesHabilitadas = todasLasProfesiones;
        licTarget.modulos.consultorio = todasLasProfesiones.length > 0;
        licTarget.bloquearCobranza = chkBloq;
        licTarget.modoComplejidad = modoComp;

        localStorage.setItem(STORAGE_MAPA_CLUBES_KEY, JSON.stringify(mapa));
        if (obtenerClaveClubActivoCDM() === claveTarget) {
            guardarLicenciaConfigCDM(licTarget);
        }
    }

    sincronizarAtributoCobranzaBodyCDM();
    const enLogin = window.location.pathname.toLowerCase().includes("login.html") || document.body.classList.contains("login-page");
    if (enLogin && !document.getElementById("vistaHubSuperAdmin")?.classList.contains("hidden")) {
        await mostrarHubSelectorDeComercios();
    }
};

const _obsRutinasDOM = new MutationObserver(() => {
    inyectarBotonesRapidosEnTarjetasDeportistasDOM();
});

sincronizarAtributoCobranzaBodyCDM();
aplicarOverrideVistaRutinasUsuarioBlindadoCDM();

document.addEventListener("DOMContentLoaded", () => {
    sincronizarAtributoCobranzaBodyCDM();
    aplicarOverrideVistaRutinasUsuarioBlindadoCDM();
    _obsRutinasDOM.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
        aplicarOverrideVistaRutinasUsuarioBlindadoCDM();
        inyectarBotonesRapidosEnTarjetasDeportistasDOM();
        const p = obtenerPersonaActualEnFichaCDM();
        if (p) {
            window.agregarBotonesVideoEnRutinasJugador({ personaId: p.id });
            if (typeof window.renderizarHistorialJugador === "function") {
                window.renderizarHistorialJugador(p);
            }
        }
        const ses = obtenerSesionActivaCDM();
        if (ses && ses.rol === "admin" && document.getElementById("fichaCabeceraJugador")) {
            inyectarPanelCodigoEnFichaIndividual();
        }
    }, 220);
});
// =========================================================================
// 10. CONECTOR COMPLETO DE LOGIN Y PORTAL DE DESCARGAS PARA PACIENTES (PAC-XXXX)
//     - RECONOCE CÓDIGOS DE PACIENTES (EJ: PAC-802) Y DNI EN LOGIN.HTML
//     - EVITA EL REREBOTE DE JUGADOR.HTML Y ABRE EL PORTAL CLÍNICO DEL PACIENTE
//     - PERMITE VER Y DESCARGAR ESTUDIOS (PDF, RX, LAB, PLANES) E INDICACIONES
// Pegar al final de login.js
// =========================================================================

function buscarPacienteConsultorioPorCodigoODni10(rawInput) {
    const codigoBuscado = String(rawInput || "").trim().toUpperCase();
    if (!codigoBuscado) return null;

    const limpioBuscado = codigoBuscado.replace(/[^A-Z0-9]/g, "");
    const soloNumeros = codigoBuscado.replace(/\D/g, "");

    // 1. Buscar en el Registro Universal de Pacientes (cdm_registro_universal_pacientes_v19)
    try {
        const mapaUniv = JSON.parse(localStorage.getItem("cdm_registro_universal_pacientes_v19") || "{}");
        for (const ficha of Object.values(mapaUniv)) {
            if (!ficha) continue;
            const cod = String(ficha.codigoAcceso || "").toUpperCase();
            const codLimpio = cod.replace(/[^A-Z0-9]/g, "");
            const sufijo = cod.split("-")[1] || cod;
            const dniPac = String(ficha.dni || "").replace(/\D/g, "");
            const idStr = String(ficha.id || "");

            if (
                cod === codigoBuscado ||
                codLimpio === limpioBuscado ||
                sufijo === codigoBuscado ||
                `PAC-${idStr}` === codigoBuscado ||
                `PAC${idStr}` === limpioBuscado ||
                (soloNumeros.length >= 7 && dniPac === soloNumeros)
            ) {
                return ficha;
            }
        }
    } catch {}

    // 2. Buscar en cualquier base de Consultorio guardada en localStorage (ej: cdm_consultorio_pro_v1)
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || k.startsWith("cdm_series_")) continue;
        try {
            const data = JSON.parse(localStorage.getItem(k));
            if (!data || typeof data !== "object") continue;

            const listasPacientes = [];
            if (Array.isArray(data.pacientes)) listasPacientes.push(data.pacientes);
            Object.values(data).forEach(sub => {
                if (sub && typeof sub === "object" && Array.isArray(sub.pacientes)) {
                    listasPacientes.push(sub.pacientes);
                }
            });

            for (const lista of listasPacientes) {
                for (const p of lista) {
                    if (!p || typeof p !== "object") continue;
                    const codP = String(p.codigoAcceso || `PAC-${p.id}`).toUpperCase();
                    const codPLimpio = codP.replace(/[^A-Z0-9]/g, "");
                    const dniP = String(p.dni || "").replace(/\D/g, "");

                    if (
                        codP === codigoBuscado ||
                        codPLimpio === limpioBuscado ||
                        String(p.id) === soloNumeros ||
                        (soloNumeros.length >= 7 && dniP === soloNumeros)
                    ) {
                        // Sincronizar en el registro universal para que tenga sus estudios disponibles
                        const mapaUniv = JSON.parse(localStorage.getItem("cdm_registro_universal_pacientes_v19") || "{}");
                        const clave = `id_${p.id}`;
                        const fichaNueva = mapaUniv[clave] || {
                            clave,
                            id: p.id,
                            codigoAcceso: codP,
                            nombreCompleto: p.nombreCompleto || `${p.apellido || ""}, ${p.nombre || ""}`.replace(/^,\s*/, "").trim(),
                            dni: p.dni || "",
                            telefono: p.telefono || p.whatsapp || "",
                            especialidad: p.especialidad || "Consultorio",
                            mutual: p.mutual || p.obraSocial || "Particular",
                            diagnostico: p.diagnostico || "",
                            profesional: p.profesional || "",
                            sesionesInfo: p.sesionesTotales ? `${p.sesionesRealizadas || 0}/${p.sesionesTotales} sesiones` : "",
                            estudiosClinicos: Array.isArray(p.estudiosClinicos) ? p.estudiosClinicos : []
                        };
                        mapaUniv[clave] = fichaNueva;
                        localStorage.setItem("cdm_registro_universal_pacientes_v19", JSON.stringify(mapaUniv));
                        return fichaNueva;
                    }
                }
            }
        } catch {}
    }

    return null;
}

// 10.1 Sobrescribir iniciarSesionConCodigo para que acepte códigos de Pacientes (ej: PAC-802)
const _origIniciarSesionConCodigo10 = iniciarSesionConCodigo;
iniciarSesionConCodigo = async function (e) {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    const rawInput = (document.getElementById("inputCodigoUsuario")?.value || "").trim().toUpperCase();

    const fichaPac = buscarPacienteConsultorioPorCodigoODni10(rawInput);
    if (fichaPac) {
        if (fichaPac.claveClub) {
            localStorage.setItem(STORAGE_CLUB_ACTIVO_KEY, fichaPac.claveClub);
        }
        localStorage.setItem(STORAGE_SESION_KEY, JSON.stringify({
            rol: "usuario",
            esPacienteConsultorio: true,
            clavePaciente: fichaPac.clave,
            personaId: fichaPac.id,
            dni: fichaPac.dni || "",
            nombre: fichaPac.nombreCompleto || "Paciente",
            deporte: fichaPac.especialidad || "Consultorio",
            categoria: fichaPac.mutual || "Particular",
            codigo: fichaPac.codigoAcceso || rawInput,
            fechaIngreso: new Date().toISOString()
        }));

        window.location.href = `jugador.html?id=${encodeURIComponent(fichaPac.id)}&pac=${encodeURIComponent(fichaPac.clave)}&modo=paciente`;
        return;
    }

    // Si no es paciente de consultorio, continúa con el login normal de Deportistas y Socios de Gimnasio
    return _origIniciarSesionConCodigo10.apply(this, arguments);
};

// 10.2 Desactivar bloqueo de descarga/impresión cuando entra un Paciente a bajar sus estudios
const _origActivarBlindaje10 = activarBlindajeAntiDescargaYCaptura;
activarBlindajeAntiDescargaYCaptura = function (sesion) {
    const params = new URLSearchParams(window.location.search);
    if ((sesion && sesion.esPacienteConsultorio) || params.get("modo") === "paciente") {
        return;
    }
    return _origActivarBlindaje10.apply(this, arguments);
};

// 10.3 Asegurar que verificarAccesoYRolEnApp no rebote al Paciente ni borre ?modo=paciente
const _origVerificarAcceso10 = verificarAccesoYRolEnApp;
verificarAccesoYRolEnApp = function () {
    const sesion = obtenerSesionActivaCDM();
    const params = new URLSearchParams(window.location.search);
    const esModoPac = (sesion && sesion.esPacienteConsultorio) || params.get("modo") === "paciente";

    if (esModoPac && (window.location.pathname.toLowerCase().includes("jugador.html") || document.body.dataset.page === "perfil-individual")) {
        aplicarTemaGuardadoCDM();
        aplicarLicenciaYModulosCDM();
        document.body.setAttribute("data-rol", sesion?.rol || "usuario");
        document.body.setAttribute("data-modo-portal", "paciente");
        inyectarCSSRestriccionesRol();
        inyectarBarraSesionTopbar(sesion || { rol: "usuario", nombre: "Paciente", codigo: "" });

        const claveBuscar = params.get("pac") || sesion?.clavePaciente || params.get("id") || sesion?.personaId || sesion?.codigo;
        setTimeout(() => {
            if (typeof renderizarPortalPacienteUniversalEnJugadorHTML19 === "function") {
                renderizarPortalPacienteUniversalEnJugadorHTML19(claveBuscar);
            } else {
                renderizarPortalPacienteFallbackEnLogin10(claveBuscar);
            }
        }, 80);
        return;
    }

    return _origVerificarAcceso10.apply(this, arguments);
};

// 10.4 Renderizador de respaldo en login.js por si inicializarPaginaJugadorIndividual corre antes que el Bloque 19
function renderizarPortalPacienteFallbackEnLogin10(claveBuscar) {
    const ficha = buscarPacienteConsultorioPorCodigoODni10(claveBuscar) ||
                  (typeof obtenerPacienteUniversalPorClave19 === "function" ? obtenerPacienteUniversalPorClave19(claveBuscar) : null);
    if (!ficha) return;

    if (typeof renderizarPortalPacienteUniversalEnJugadorHTML19 === "function") {
        renderizarPortalPacienteUniversalEnJugadorHTML19(ficha.clave);
        return;
    }

    const cabecera = document.getElementById("fichaCabeceraJugador");
    if (cabecera) {
        cabecera.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                <div>
                    <span class="badge badge-ok">🩺 PORTAL DEL PACIENTE</span>
                    <span class="badge badge-celeste">🔑 Código: ${ficha.codigoAcceso}</span>
                    <h2 style="font-size:1.4rem; font-weight:900; color:#ffffff; margin-top:4px;">${ficha.nombreCompleto}</h2>
                    <small style="color:#e0f2fe;">DNI ${ficha.dni || "-"} • ${ficha.especialidad || "Consultorio"} • ${ficha.mutual || "Particular"}</small>
                </div>
            </div>
        `;
    }
}

// Interceptar inicializarPaginaJugadorIndividual en jugador.html cuando entra un Paciente
document.addEventListener("DOMContentLoaded", () => {
    const sesion = obtenerSesionActivaCDM();
    const params = new URLSearchParams(window.location.search);
    const esModoPac = (sesion && sesion.esPacienteConsultorio) || params.get("modo") === "paciente";

    if (esModoPac && typeof window.inicializarPaginaJugadorIndividual === "function") {
        window.inicializarPaginaJugadorIndividual = function () {
            const claveBuscar = params.get("pac") || sesion?.clavePaciente || params.get("id") || sesion?.personaId || sesion?.codigo;
            if (typeof renderizarPortalPacienteUniversalEnJugadorHTML19 === "function") {
                renderizarPortalPacienteUniversalEnJugadorHTML19(claveBuscar);
            } else {
                renderizarPortalPacienteFallbackEnLogin10(claveBuscar);
            }
        };
        window.inicializarPaginaJugadorIndividual();
    }
});
// =========================================================================
// 11. BLOQUEO TOTAL DEL RELOJ FUERA DE DEPORTES Y GIMNASIO (CSS + JS)
//     Reemplazar las últimas 25 líneas de login.js por este bloque
// =========================================================================

(function bloquearRelojFueraDeGymYDeportesCDM() {
    if (!document.getElementById("cdmCssHideClockInClinicAndLogin")) {
        const st = document.createElement("style");
        st.id = "cdmCssHideClockInClinicAndLogin";
        st.textContent = `
            /* Ocultar instantáneamente el reloj en Login, Hub de Comercios, Consultorio y Pacientes */
            body.login-page #cdmFloatingDropletClock,
            body[data-modo-portal="paciente"] #cdmFloatingDropletClock,
            body[data-reloj-oculto="1"] #cdmFloatingDropletClock,
            body:has(#vistaLoginGenerico) #cdmFloatingDropletClock,
            body:has(#formLoginUsuario) #cdmFloatingDropletClock,
            body:has(#vistaHubSuperAdmin:not(.hidden)) #cdmFloatingDropletClock,
            body:has(#cdmSeccionConsultorioGlobal:not(.hidden)) #cdmFloatingDropletClock,
            body:has(.patient-quick-card) #cdmFloatingDropletClock,
            body:has(.conventional-cal-panel) #cdmFloatingDropletClock,
            body:has(#contenedorPortalClinicoPaciente19) #cdmFloatingDropletClock {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
            }
        `;
        document.head.appendChild(st);
    }
})();

function puedeMostrarseRelojDeportivoCDM() {
    const path = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);

    // 1. Prohibido en Login o Hub de Comercios
    if (
        path.includes("login") ||
        document.body?.classList.contains("login-page") ||
        document.getElementById("vistaLoginGenerico") ||
        document.getElementById("formLoginUsuario")
    ) {
        return false;
    }

    // 2. Prohibido en Portal de Paciente
    let ses = null;
    try { ses = obtenerSesionActivaCDM(); } catch {}
    if (
        params.get("modo") === "paciente" ||
        params.get("pac") ||
        (ses && ses.esPacienteConsultorio) ||
        document.body?.getAttribute("data-modo-portal") === "paciente" ||
        document.getElementById("contenedorPortalClinicoPaciente19")
    ) {
        return false;
    }

    // 3. Prohibido si el Consultorio / Suite de Profesionales está en pantalla
    const secCons = document.getElementById("cdmSeccionConsultorioGlobal");
    if (secCons && !secCons.classList.contains("hidden")) {
        return false;
    }
    if (document.querySelector(".patient-quick-card, .conventional-cal-panel")) {
        return false;
    }
    const tituloTop = (document.querySelector(".topbar-title h2")?.innerText || "").toLowerCase();
    const esPantallaGym = path.includes("gym.html") || document.body?.dataset?.deporte === "Gimnasio" || tituloTop.includes("gimnasio");
    if (!esPantallaGym && (tituloTop.includes("profesionales") || tituloTop.includes("salud") || tituloTop.includes("consultorio") || tituloTop.includes("paciente"))) {
        return false;
    }

    // 4. Prohibido si el comercio actual es exclusivamente de Consultorio (sin deportes ni gimnasio)
    try {
        const lic = obtenerLicenciaConfigCDM();
        const mod = lic?.modulos || {};
        const tieneDeporteOGym = Boolean(mod.futbol || mod.hockey || mod.gym || (Array.isArray(lic?.deportesExtra) && lic.deportesExtra.length > 0));
        if (!tieneDeporteOGym) return false;
    } catch {}

    // 5. Permitido únicamente en pantallas de Gimnasio, Deportes o Ficha de Deportista
    return (
        path.includes("gym.html") ||
        path.includes("futbol.html") ||
        path.includes("hockey.html") ||
        path.includes("jugador.html") ||
        Boolean(document.body?.dataset.deporte)
    );
}

asegurarGotaRelojitoFlotanteCDM = function () {
    if (!puedeMostrarseRelojDeportivoCDM()) {
        document.body?.setAttribute("data-reloj-oculto", "1");
        document.getElementById("cdmFloatingDropletClock")?.remove();
        return;
    }

    document.body?.removeAttribute("data-reloj-oculto");
    let wrap = document.getElementById("cdmFloatingDropletClock");
    if (!wrap) {
        wrap = document.createElement("div");
        wrap.id = "cdmFloatingDropletClock";
        wrap.className = "cdm-droplet-clock-wrap usr-action-allow";
        document.body.appendChild(wrap);
    }
    renderizarGotaRelojitoFlotanteCDM();
};

function limpiarRelojSiNoEsDeporteOGymCDM() {
    if (!puedeMostrarseRelojDeportivoCDM()) {
        document.body?.setAttribute("data-reloj-oculto", "1");
        document.getElementById("cdmFloatingDropletClock")?.remove();
    } else {
        document.body?.removeAttribute("data-reloj-oculto");
    }
}

limpiarRelojSiNoEsDeporteOGymCDM();
document.addEventListener("DOMContentLoaded", () => {
    limpiarRelojSiNoEsDeporteOGymCDM();
    setTimeout(limpiarRelojSiNoEsDeporteOGymCDM, 150);
    setTimeout(limpiarRelojSiNoEsDeporteOGymCDM, 450);
    setTimeout(limpiarRelojSiNoEsDeporteOGymCDM, 900);
});
window.addEventListener("click", () => {
    setTimeout(limpiarRelojSiNoEsDeporteOGymCDM, 40);
});
// =========================================================================
// 12. SOPORTE NATIVO PARA COMERCIOS "SOLO PSICOLOGÍA / SOLO CONSULTORIO"
//     - ELIMINA LA ALERTA "Debés dejar al menos 1 módulo o deporte activo"
//     - INYECTA SIEMPRE LAS PROFESIONES Y EL BOTÓN RÁPIDO "🧠 SOLO PSICOLOGÍA / SALUD"
//     - MUESTRA LAS ESPECIALIDADES EN LAS TARJETAS DEL HUB SUPERADMIN
// Pegar al final de login.js
// =========================================================================

function activarPresetSoloConsultorioEnModal(profesionFoco = "") {
    const chkF = document.getElementById("mcModFutbol");
    const chkH = document.getElementById("mcModHockey");
    const chkG = document.getElementById("mcModGym");
    const inpDep = document.getElementById("mcDeportesExtra");
    const inpPlan = document.getElementById("mcPlanActivo");
    const inpSigla = document.getElementById("mcSiglaCodigo");

    if (chkF) chkF.checked = false;
    if (chkH) chkH.checked = false;
    if (chkG) chkG.checked = false;
    if (inpDep) inpDep.value = "";
    if (inpPlan) inpPlan.value = "solo_consultorio";

    if (profesionFoco) {
        document.querySelectorAll(".mc-chk-profesion").forEach(chk => {
            chk.checked = (chk.value === profesionFoco);
        });
        if (inpSigla && (inpSigla.value === "GYM" || inpSigla.value === "CDM")) {
            inpSigla.value = profesionFoco === "Psicología" ? "PSI" : "PAC";
        }
    } else {
        const algunoTildado = Array.from(document.querySelectorAll(".mc-chk-profesion")).some(c => c.checked);
        if (!algunoTildado) {
            const chkPsi = document.querySelector('.mc-chk-profesion[value="Psicología"]');
            if (chkPsi) chkPsi.checked = true;
        }
        if (inpSigla && (inpSigla.value === "GYM" || inpSigla.value === "CDM")) {
            inpSigla.value = "PSI";
        }
    }
}

// 1. Reemplazar abrirModalCrearOEditarComercio con inyección garantizada de Profesiones y botón Solo Psicología
const _baseAbrirModalComercio12 = _origAbrirModalCrearOEditarComercio;
abrirModalCrearOEditarComercio = async function (claveClubEditar = null) {
    await _baseAbrirModalComercio12.apply(this, arguments);
    const modal = document.getElementById("modalSuperAdminCDM");
    if (!modal) return;

    const lista = await obtenerListaCompletaComerciosCDM();
    const existente = claveClubEditar ? lista.find(x => x.claveClub === claveClubEditar) : null;
    const lic = existente?.licenciaConfig || {};
    const bloqueada = Boolean(lic.bloquearCobranza);
    const modoCompActual = lic.modoComplejidad || "simple";

    // Si es nuevo o si ya tenía profesiones guardadas, recuperarlas
    const profsGuardadas = Array.isArray(lic.profesionesHabilitadas)
        ? lic.profesionesHabilitadas
        : (claveClubEditar ? [] : ["Psicología"]);

    const clavesBase = CATALOGO_PROFESIONES_BASE_SAAS.map(p => p.clave);
    const profsExtraGuardadas = profsGuardadas.filter(p => !clavesBase.includes(p));

    const form = modal.querySelector("form");
    if (!form) return;

    const bloquesDiv = Array.from(form.children).filter(el => el.tagName === "DIV");
    const primerBloque = bloquesDiv[0];
    // Buscar el bloque 2 sin importar mayúsculas/minúsculas o acentos
    const bloqueModulos = bloquesDiv.find(d => /m[oó]dulos\s+usa\s+este\s+cliente/i.test(d.textContent || "")) || bloquesDiv[1];

    // A) Inyectar selector de complejidad y bloqueo de cobranza
    if (primerBloque && !document.getElementById("mcModoComplejidad")) {
        const boxConfigExtra = document.createElement("div");
        boxConfigExtra.style = "display:flex; flex-direction:column; gap:0.75rem; margin-bottom:0.95rem;";
        boxConfigExtra.innerHTML = `
            <div style="background:#f0f9ff; border:1.5px solid #7dd3fc; border-radius:16px; padding:0.9rem 1rem;">
                <label style="font-size:0.72rem; font-weight:800; color:#0369a1; text-transform:uppercase; display:block; margin-bottom:0.4rem;">
                    🎚️ NIVEL DE COMPLEJIDAD PREDETERMINADO DE ESTE COMERCIO
                </label>
                <select id="mcModoComplejidad" style="font-weight:700; color:#0f172a; background:#ffffff;">
                    <option value="simple" ${modoCompActual === "simple" ? "selected" : ""}>🟢 Modo Simple / Clásico (Ideal para Consultorios, Psicología o Gimnasios simples)</option>
                    <option value="avanzado" ${modoCompActual === "avanzado" ? "selected" : ""}>🚀 Modo Avanzado / Pro (Con Pesos, Memoria 1RM y Biomecánica 60 FPS)</option>
                </select>
            </div>

            <div style="background:var(--warn-bg); border:1.5px solid rgba(245, 158, 11, 0.38); border-radius:16px; padding:0.8rem 1rem;">
                <label style="display:flex; align-items:center; justify-content:space-between; gap:0.85rem; cursor:pointer;">
                    <div>
                        <strong style="font-size:0.84rem; color:var(--warn-ink); display:flex; align-items:center; gap:0.35rem;">
                            🔒 Bloquear Parte de Cobranza / Cuotas en este Comercio
                        </strong>
                        <small style="color:var(--ink-500); font-size:0.72rem; display:block;">
                            Activalo si el profesional o cliente ya administra sus cobros aparte.
                        </small>
                    </div>
                    <input type="checkbox" id="mcBloquearCobranza" style="width:20px; height:20px; min-height:auto; flex-shrink:0;" ${bloqueada ? "checked" : ""}>
                </label>
            </div>
        `;
        primerBloque.insertAdjacentElement("afterend", boxConfigExtra);
    }

    // B) Inyectar siempre el bloque de Profesiones / Consultorios dentro del Bloque 2
    if (bloqueModulos) {
        document.getElementById("bloqueSeleccionProfesionesModalCDM")?.remove();

        const divProfs = document.createElement("div");
        divProfs.id = "bloqueSeleccionProfesionesModalCDM";
        divProfs.style = "margin-top:0.95rem; padding-top:0.9rem; border-top:2px dashed #38bdf8; background:rgba(240,249,255,0.6); padding:0.9rem; border-radius:14px;";
        divProfs.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.65rem;">
                <label style="font-size:0.74rem; font-weight:800; color:#0369a1; text-transform:uppercase; margin:0;">
                    🩺 CONSULTORIOS Y PROFESIONALES DE LA SALUD (PUEDE USARSE SOLO SIN DEPORTES)
                </label>
                <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
                    <button type="button" class="btn btn-primary btn-sm" style="min-height:28px; padding:0.2rem 0.65rem; font-size:0.72rem; background:#6366f1; border-color:#4f46e5;" onclick="activarPresetSoloConsultorioEnModal('Psicología')">
                        🧠 Solo Psicología
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm" style="min-height:28px; padding:0.2rem 0.65rem; font-size:0.72rem;" onclick="activarPresetSoloConsultorioEnModal('Kinesiología')">
                        🦿 Solo Kinesiología
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm" style="min-height:28px; padding:0.2rem 0.65rem; font-size:0.72rem;" onclick="activarPresetSoloConsultorioEnModal('')">
                        🩺 Solo Consultorio
                    </button>
                </div>
            </div>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(145px, 1fr)); gap:0.5rem; margin-bottom:0.65rem;">
                ${CATALOGO_PROFESIONES_BASE_SAAS.map(pr => `
                    <label style="display:flex; align-items:center; gap:0.45rem; background:#ffffff; border:1.5px solid #bae6fd; padding:0.55rem 0.7rem; border-radius:11px; cursor:pointer; font-weight:700; font-size:0.82rem; color:#0f172a;">
                        <input type="checkbox" class="mc-chk-profesion" value="${pr.clave}" style="width:18px; height:18px; min-height:auto;" ${profsGuardadas.includes(pr.clave) ? "checked" : ""}>
                        <span>${pr.icono} ${pr.nombre}</span>
                    </label>
                `).join("")}
            </div>
            <input type="text" id="mcProfesionesExtra" placeholder="Otras especialidades separadas por coma (ej: Fonoaudiología, Psicopedagogía, Psiquiatría)..." value="${profsExtraGuardadas.join(", ")}">
        `;
        bloqueModulos.appendChild(divProfs);
    }
};

// 2. Reemplazar por completo guardarComercioDesdeModal para que acepte Psicólogos / Consultorios puros sin deportes
guardarComercioDesdeModal = async function (e, claveClubExistente = "") {
    e.preventDefault();

    const futbol = Boolean(document.getElementById("mcModFutbol")?.checked);
    const hockey = Boolean(document.getElementById("mcModHockey")?.checked);
    const gym = Boolean(document.getElementById("mcModGym")?.checked);
    const deportesExtra = (document.getElementById("mcDeportesExtra")?.value || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

    const profsTildadas = Array.from(document.querySelectorAll(".mc-chk-profesion:checked")).map(c => c.value);
    const profsExtraTxt = (document.getElementById("mcProfesionesExtra")?.value || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
    let todasLasProfesiones = [...new Set([...profsTildadas, ...profsExtraTxt])];

    const nombre = (document.getElementById("mcNombreEntidad")?.value || "").trim();
    const subtitulo = (document.getElementById("mcSubtituloEntidad")?.value || "").trim();

    // Si destildó todos los deportes/gym y se olvidó de tildar la casilla de profesión, deducirla del nombre (ej. "Psicólogo...")
    const tieneDeporteOGym = Boolean(futbol || hockey || gym || deportesExtra.length > 0);
    if (!tieneDeporteOGym && todasLasProfesiones.length === 0) {
        const nomLower = nombre.toLowerCase();
        if (nomLower.includes("psic") || nomLower.includes("terap")) todasLasProfesiones = ["Psicología"];
        else if (nomLower.includes("kine") || nomLower.includes("fisio")) todasLasProfesiones = ["Kinesiología"];
        else if (nomLower.includes("quiro")) todasLasProfesiones = ["Quiropraxia"];
        else if (nomLower.includes("nutri")) todasLasProfesiones = ["Nutrición"];
        else {
            alert("⚠️ Seleccioná al menos 1 especialidad de salud (ej: 🧠 Psicología) o 1 deporte/gimnasio.");
            return;
        }
    }

    const adminUsuario = (document.getElementById("mcAdminUsuario")?.value || "").trim().toLowerCase();
    const adminClave = (document.getElementById("mcAdminClave")?.value || "").trim();

    if (CREDENCIALES_SUPERADMIN.usuarios.includes(adminUsuario)) {
        alert("⚠️ El usuario '" + adminUsuario + "' está reservado para el Administrador General. Elegí un usuario propio para este profesional o comercio.");
        return;
    }

    let sigla = (document.getElementById("mcSiglaCodigo")?.value.trim() || "PAC").toUpperCase();
    if (!tieneDeporteOGym && (sigla === "GYM" || sigla === "CDM")) {
        sigla = todasLasProfesiones.includes("Psicología") ? "PSI" : "PAC";
    }

    const logoUrl = document.getElementById("mcLogoUrl")?.value.trim() || "/img/logo.png";
    const planActivo = !tieneDeporteOGym ? "solo_consultorio" : (document.getElementById("mcPlanActivo")?.value || "personalizado");
    const estadoServicio = document.getElementById("mcEstadoServicio")?.value || "activo";
    const bloquearCobranza = Boolean(document.getElementById("mcBloquearCobranza")?.checked);
    const modoComplejidad = document.getElementById("mcModoComplejidad")?.value || "simple";

    const claveFinal = claveClubExistente || (
        nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") + "_" + Math.floor(100 + Math.random() * 899)
    );

    const nuevaLicencia = {
        claveClub: claveFinal,
        nombreEntidad: nombre,
        subtituloEntidad: subtitulo,
        siglaCodigo: sigla,
        logoUrl,
        planActivo,
        modulos: {
            futbol,
            hockey,
            gym,
            consultorio: todasLasProfesiones.length > 0
        },
        deportesExtra,
        profesionesHabilitadas: todasLasProfesiones,
        bloquearCobranza,
        modoComplejidad,
        adminUsuario,
        adminClave,
        estadoServicio
    };

    const mapa = obtenerMapaLocalClubesCDM();
    if (!claveClubExistente) {
        mapa[claveFinal] = {
            claveClub: claveFinal,
            ultimaActualizacionISO: new Date().toISOString(),
            personas: [],
            rutinas: [],
            partidos: [],
            alineaciones: {},
            microciclos: {},
            licenciaConfig: nuevaLicencia
        };
        localStorage.setItem(STORAGE_MAPA_CLUBES_KEY, JSON.stringify(mapa));

        if (window.location.protocol !== "file:") {
            try {
                await fetch("/api/cdm/clubes/nuevo", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ licenciaConfig: nuevaLicencia })
                });
            } catch {}
        }
    } else {
        if (mapa[claveFinal]) {
            mapa[claveFinal].licenciaConfig = nuevaLicencia;
            localStorage.setItem(STORAGE_MAPA_CLUBES_KEY, JSON.stringify(mapa));
        }
        if (obtenerClaveClubActivoCDM() === claveFinal) {
            guardarLicenciaConfigCDM(nuevaLicencia);
        }
        if (window.location.protocol !== "file:") {
            try {
                const respEst = await fetch(`/api/cdm/estado?club=${encodeURIComponent(claveFinal)}`);
                if (respEst.ok) {
                    const dEst = await respEst.json();
                    const estActual = dEst.estado || {};
                    estActual.licenciaConfig = nuevaLicencia;
                    await fetch("/api/cdm/estado", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ...estActual, claveClub: claveFinal })
                    });
                }
            } catch {}
        }
    }

    document.getElementById("modalSuperAdminCDM")?.classList.add("hidden");
    sincronizarAtributoCobranzaBodyCDM();

    const enLogin = window.location.pathname.toLowerCase().includes("login.html") || document.body.classList.contains("login-page");
    if (enLogin) {
        await mostrarHubSelectorDeComercios();
    } else {
        aplicarLicenciaYModulosCDM();
        if (typeof sincronizarSidebarActivoCDM === "function") sincronizarSidebarActivoCDM();
        window.location.reload();
    }
};

// 3. Mostrar las etiquetas de Psicología / Kinesiología / etc. en las tarjetas del Hub SuperAdmin
const _origMostrarHubComercios12 = mostrarHubSelectorDeComercios;
mostrarHubSelectorDeComercios = async function () {
    await _origMostrarHubComercios12.apply(this, arguments);
    const lista = await obtenerListaCompletaComerciosCDM();
    const cards = document.querySelectorAll("#gridTarjetasComerciosHub .hub-comercio-card");

    cards.forEach((card, idx) => {
        const item = lista[idx];
        const lic = item?.licenciaConfig || {};
        const profs = Array.isArray(lic.profesionesHabilitadas) ? lic.profesionesHabilitadas : [];
        if (profs.length === 0) return;

        const filaBadges = card.querySelectorAll("div")[3];
        if (!filaBadges || filaBadges.dataset.profsRendered === "1") return;
        filaBadges.dataset.profsRendered = "1";

        const iconosMapa = { "Psicología": "🧠", "Kinesiología": "🦿", "Quiropraxia": "🦴", "Nutrición": "🥗" };
        const badgesHTML = profs.map(pr => {
            const ic = iconosMapa[pr] || "🩺";
            return `<span class="badge badge-ok" style="font-size:0.65rem;">${ic} ${pr}</span>`;
        }).join("");

        filaBadges.insertAdjacentHTML("afterbegin", badgesHTML);
    });
};
// =========================================================================
// 13. LOGO GENÉRICO AUTOMÁTICO PARA COMERCIOS Y CONSULTORIOS NUEVOS
//     - ELIMINA EL ESCUDO DEL CLUB (/img/logo.png) DE LOS COMERCIOS QUE NO SON CDM
//     - GENERA UN ÍCONO GENÉRICO NEUTRO CON LA SIGLA DEL COMERCIO HASTA QUE SUBAN UNO
//     - AGREGA EL BOTÓN "🗑️ QUITAR LOGO (USAR GENÉRICO)" EN EL MODAL DEL COMERCIO
// Pegar al final de login.js
// =========================================================================

function esLogoPorDefectoDelClubCDM13(url = "") {
    const limpio = String(url || "").trim().toLowerCase();
    return !limpio || limpio === "/img/logo.png" || limpio === "img/logo.png" || limpio === "logo.png" || limpio === "generico";
}

// Genera un ícono SVG neutro y moderno (en Data URI) para cualquier comercio o consultorio que no tenga logo propio
function generarLogoGenericoSVGComercio13(lic = {}) {
    const sigla = String(lic.siglaCodigo || lic.nombreEntidad || "APP")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .slice(0, 3) || "PRO";

    const esSoloConsultorio = lic.planActivo === "solo_consultorio" ||
        (!lic.modulos?.futbol && !lic.modulos?.hockey && !lic.modulos?.gym);

    const color1 = esSoloConsultorio ? "#0d9488" : "#0284c7";
    const color2 = esSoloConsultorio ? "#115e59" : "#0f172a";

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${color1}"/>
                <stop offset="100%" stop-color="${color2}"/>
            </linearGradient>
        </defs>
        <rect width="112" height="112" x="4" y="4" rx="28" fill="url(#g)" stroke="#38bdf8" stroke-width="3" stroke-opacity="0.45"/>
        <text x="60" y="69" font-family="Poppins, Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">${sigla}</text>
    </svg>`;

    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function resolverLogoEfectivoComercio13(lic = {}, claveClub = "") {
    const clave = claveClub || lic?.claveClub || obtenerClaveClubActivoCDM();
    // Solo el Club Deportivo Municipal original usa /img/logo.png por defecto
    if (clave === CLAVE_CLUB_DEFECTO_CDM) {
        return lic?.logoUrl || "/img/logo.png";
    }
    // Para cualquier otro comercio: si no subieron un logo propio, usar el Logo Genérico Neutro
    if (esLogoPorDefectoDelClubCDM13(lic?.logoUrl)) {
        return generarLogoGenericoSVGComercio13(lic);
    }
    return lic.logoUrl;
}

function quitarLogoYUsarGenericoEnModal13() {
    const inp = document.getElementById("mcLogoUrl");
    const prev = document.getElementById("mcPreviewLogo");
    const sigla = document.getElementById("mcSiglaCodigo")?.value || "PRO";
    const svgGen = generarLogoGenericoSVGComercio13({ siglaCodigo: sigla });

    if (inp) inp.value = "";
    if (prev) prev.src = svgGen;
    if (typeof mostrarToast === "function") {
        mostrarToast("✨ Se aplicó el ícono genérico neutro (sin escudo del club).");
    }
}

// 1. Actualizar aplicarLicenciaYModulosCDM para que la barra lateral izquierda nunca muestre el escudo del club en otros comercios
const _origAplicarLicencia13 = aplicarLicenciaYModulosCDM;
aplicarLicenciaYModulosCDM = function () {
    _origAplicarLicencia13.apply(this, arguments);

    const path = window.location.pathname.toLowerCase();
    if (path.includes("login.html") || document.body?.classList.contains("login-page")) return;

    const lic = obtenerLicenciaConfigCDM();
    const claveActiva = obtenerClaveClubActivoCDM();
    const logoFinal = resolverLogoEfectivoComercio13(lic, claveActiva);

    document.querySelectorAll(".sidebar-brand img").forEach(img => {
        img.src = logoFinal;
        img.onerror = null;
    });
};

// 2. Actualizar abrirModalCrearOEditarComercio para que al crear un comercio nuevo salga con logo vacío/genérico y botón "Quitar Logo"
const _origAbrirModalComercio13 = abrirModalCrearOEditarComercio;
abrirModalCrearOEditarComercio = async function (claveClubEditar = null) {
    await _origAbrirModalComercio13.apply(this, arguments);

    const inpLogo = document.getElementById("mcLogoUrl");
    const prevLogo = document.getElementById("mcPreviewLogo");
    const inpSigla = document.getElementById("mcSiglaCodigo");
    if (!inpLogo || !prevLogo) return;

    const esCdmOriginal = claveClubEditar === CLAVE_CLUB_DEFECTO_CDM;

    // Si es un comercio nuevo o si tenía pegado "/img/logo.png" sin ser CDM, limpiarlo a genérico
    if (!esCdmOriginal && esLogoPorDefectoDelClubCDM13(inpLogo.value)) {
        inpLogo.value = "";
        inpLogo.placeholder = "Sin logo cargado (Usando ícono genérico con sigla)";
        prevLogo.src = generarLogoGenericoSVGComercio13({ siglaCodigo: inpSigla?.value || "PRO" });
    }

    // Actualizar vista previa del logo genérico si cambia las 3 letras de la sigla y no subió imagen propia
    if (inpSigla && !inpSigla.dataset.hookLogoSigla13) {
        inpSigla.dataset.hookLogoSigla13 = "1";
        inpSigla.addEventListener("input", () => {
            if (!inpLogo.value.trim()) {
                prevLogo.src = generarLogoGenericoSVGComercio13({ siglaCodigo: inpSigla.value || "PRO" });
            }
        });
    }

    // Agregar botón "🗑️ Quitar Logo / Usar Genérico" al lado de "Subir Logo"
    const filaLogo = inpLogo.closest("div")?.parentElement;
    if (filaLogo && !document.getElementById("btnQuitarLogoComercio13")) {
        const btnQuitar = document.createElement("button");
        btnQuitar.type = "button";
        btnQuitar.id = "btnQuitarLogoComercio13";
        btnQuitar.className = "btn btn-ghost btn-sm";
        btnQuitar.onclick = quitarLogoYUsarGenericoEnModal13;
        btnQuitar.innerHTML = `<i class="ri-refresh-line"></i> Usar Genérico / Sin Logo`;
        filaLogo.appendChild(btnQuitar);
    }
};

// 3. Al guardar el comercio, si no es CDM y dejaron el campo de logo vacío, guardar "" (para que use siempre el genérico y no /img/logo.png)
const _origGuardarComercio13 = guardarComercioDesdeModal;
guardarComercioDesdeModal = async function (e, claveClubExistente = "") {
    const inpLogo = document.getElementById("mcLogoUrl");
    const esCdm = claveClubExistente === CLAVE_CLUB_DEFECTO_CDM;
    const valorLogoUsuario = (inpLogo?.value || "").trim();
    const usarGenerico = !esCdm && esLogoPorDefectoDelClubCDM13(valorLogoUsuario);

    await _origGuardarComercio13.apply(this, arguments);

    if (usarGenerico) {
        const mapa = obtenerMapaLocalClubesCDM();
        const nombreInput = (document.getElementById("mcNombreEntidad")?.value || "").trim().toLowerCase();
        let claveTarget = claveClubExistente;
        if (!claveTarget && nombreInput) {
            const match = Object.values(mapa).find(c => (c.licenciaConfig?.nombreEntidad || "").toLowerCase() === nombreInput);
            if (match) claveTarget = match.claveClub;
        }
        if (claveTarget && mapa[claveTarget]?.licenciaConfig) {
            mapa[claveTarget].licenciaConfig.logoUrl = "";
            localStorage.setItem(STORAGE_MAPA_CLUBES_KEY, JSON.stringify(mapa));
            if (obtenerClaveClubActivoCDM() === claveTarget) {
                guardarLicenciaConfigCDM(mapa[claveTarget].licenciaConfig);
            }
        }
    }

    const enLogin = window.location.pathname.toLowerCase().includes("login.html") || document.body?.classList.contains("login-page");
    if (enLogin && !document.getElementById("vistaHubSuperAdmin")?.classList.contains("hidden")) {
        await mostrarHubSelectorDeComercios();
    }
};

// 4. Actualizar las tarjetas del Hub SuperAdmin para que reemplacen el escudo de CDM por el Logo Genérico en todos los demás comercios
const _origMostrarHub13 = mostrarHubSelectorDeComercios;
mostrarHubSelectorDeComercios = async function () {
    await _origMostrarHub13.apply(this, arguments);
    const lista = await obtenerListaCompletaComerciosCDM();
    const cards = document.querySelectorAll("#gridTarjetasComerciosHub .hub-comercio-card");

    cards.forEach((card, idx) => {
        const item = lista[idx];
        if (!item) return;
        const img = card.querySelector("img");
        if (img) {
            img.onerror = null;
            img.src = resolverLogoEfectivoComercio13(item.licenciaConfig || {}, item.claveClub);
        }
    });
};

// Aplicar el logo correcto apenas carga cualquier página interna
document.addEventListener("DOMContentLoaded", () => {
    aplicarLicenciaYModulosCDM();
    setTimeout(aplicarLicenciaYModulosCDM, 150);
});
// =========================================================================
// 14. PANEL SUPERADMIN DE INTERRUPTORES GRANULARES POR RUBRO (SALUD vs. DEPORTE)
//     + PRESETS DE 1 CLIC (PSICÓLOGA INDIVIDUAL, KINE/CENTRO, GYM, CLUB COMPLETO)
//     + SINCRONIZACIÓN DE ATRIBUTOS DATA-FEAT-* PARA BLOQUEO INSTANTÁNEO EN TODA LA APP
// Pegar al final de login.js (debajo del Bloque 13)
// =========================================================================

const FUNCIONES_DEFECTO_SUPERADMIN_14 = {
    salud: {
        agenda: true,
        mutuales: true,
        genograma: true,
        evolucion: true,
        eva: true,
        portalEstudios: true,
        equipo: true
    },
    deporte: {
        cobranza: true,
        rutinasVideos: true,
        evaluaciones1RM: true,
        partidosPizarra: true,
        ranking: true,
        planSemanal: true
    },
    general: {
        notasRapidas: true
    }
};

window.__cdmPendingFunciones14 = null;

function normalizarFuncionesLicencia14(lic = {}) {
    const raw = (lic && typeof lic.funciones === "object" && lic.funciones) ? lic.funciones : {};
    const cobranzaActiva = raw.deporte?.cobranza !== undefined
        ? Boolean(raw.deporte.cobranza)
        : !Boolean(lic?.bloquearCobranza);

    return {
        salud: {
            ...FUNCIONES_DEFECTO_SUPERADMIN_14.salud,
            ...(raw.salud || {})
        },
        deporte: {
            ...FUNCIONES_DEFECTO_SUPERADMIN_14.deporte,
            ...(raw.deporte || {}),
            cobranza: cobranzaActiva
        },
        general: {
            ...FUNCIONES_DEFECTO_SUPERADMIN_14.general,
            ...(raw.general || {})
        }
    };
}

// 1. Asegurar que obtenerLicenciaConfigCDM siempre devuelva el objeto `funciones` completo
const _origObtenerLicencia14 = obtenerLicenciaConfigCDM;
obtenerLicenciaConfigCDM = function () {
    const lic = _origObtenerLicencia14.apply(this, arguments);
    lic.funciones = normalizarFuncionesLicencia14(lic);
    return lic;
};

// 2. Asegurar que guardarLicenciaConfigCDM incluya siempre las funciones recién configuradas antes de persistir
const _origGuardarLicencia14 = guardarLicenciaConfigCDM;
guardarLicenciaConfigCDM = function (nuevaConfig) {
    if (nuevaConfig && typeof nuevaConfig === "object") {
        if (window.__cdmPendingFunciones14) {
            nuevaConfig.funciones = normalizarFuncionesLicencia14({ funciones: window.__cdmPendingFunciones14 });
            nuevaConfig.bloquearCobranza = !nuevaConfig.funciones.deporte.cobranza;
        } else {
            nuevaConfig.funciones = normalizarFuncionesLicencia14(nuevaConfig);
        }
    }
    return _origGuardarLicencia14.apply(this, arguments);
};

// 3. Estampar los interruptores como atributos en <body> para ocultamiento instantáneo por CSS
function sincronizarAtributosFuncionesBody14() {
    if (!document.body) return;
    const path = window.location.pathname.toLowerCase();
    if (path.includes("login.html") || document.body.classList.contains("login-page")) return;

    const lic = obtenerLicenciaConfigCDM();
    const f = normalizarFuncionesLicencia14(lic);

    document.body.setAttribute("data-feat-sal-agenda", f.salud.agenda ? "on" : "off");
    document.body.setAttribute("data-feat-sal-mutuales", f.salud.mutuales ? "on" : "off");
    document.body.setAttribute("data-feat-sal-genograma", f.salud.genograma ? "on" : "off");
    document.body.setAttribute("data-feat-sal-evolucion", f.salud.evolucion ? "on" : "off");
    document.body.setAttribute("data-feat-sal-eva", f.salud.eva ? "on" : "off");
    document.body.setAttribute("data-feat-sal-portal", f.salud.portalEstudios ? "on" : "off");
    document.body.setAttribute("data-feat-sal-equipo", f.salud.equipo ? "on" : "off");

    document.body.setAttribute("data-feat-dep-cobranza", f.deporte.cobranza ? "on" : "off");
    document.body.setAttribute("data-feat-dep-rutinas", f.deporte.rutinasVideos ? "on" : "off");
    document.body.setAttribute("data-feat-dep-evals", f.deporte.evaluaciones1RM ? "on" : "off");
    document.body.setAttribute("data-feat-dep-partidos", f.deporte.partidosPizarra ? "on" : "off");
    document.body.setAttribute("data-feat-dep-ranking", f.deporte.ranking ? "on" : "off");
    document.body.setAttribute("data-feat-dep-plan", f.deporte.planSemanal ? "on" : "off");

    document.body.setAttribute("data-feat-gen-notas", f.general.notasRapidas ? "on" : "off");
    document.body.setAttribute("data-cobranza", f.deporte.cobranza ? "activa" : "bloqueada");
}

const _origAplicarLicencia14 = aplicarLicenciaYModulosCDM;
aplicarLicenciaYModulosCDM = function () {
    _origAplicarLicencia14.apply(this, arguments);
    sincronizarAtributosFuncionesBody14();
};

// 4. Presets Inteligentes de 1 Clic en el Modal del Hub SuperAdmin
function aplicarPresetRubroYFunciones14(presetKey) {
    const chkF = document.getElementById("mcModFutbol");
    const chkH = document.getElementById("mcModHockey");
    const chkG = document.getElementById("mcModGym");
    const inpDep = document.getElementById("mcDeportesExtra");
    const inpPlan = document.getElementById("mcPlanActivo");
    const inpSigla = document.getElementById("mcSiglaCodigo");
    const selComp = document.getElementById("mcModoComplejidad");
    const chkBloqCob = document.getElementById("mcBloquearCobranza");

    const setSwitch = (grupo, clave, val) => {
        const el = document.querySelector(`.mc-feat-switch-14[data-grupo="${grupo}"][data-clave="${clave}"]`);
        if (el) el.checked = Boolean(val);
    };

    const setProfs = (listaActivas) => {
        document.querySelectorAll(".mc-chk-profesion").forEach(c => {
            c.checked = listaActivas.includes(c.value);
        });
    };

    if (presetKey === "psicologa_individual") {
        if (chkF) chkF.checked = false;
        if (chkH) chkH.checked = false;
        if (chkG) chkG.checked = false;
        if (inpDep) inpDep.value = "";
        if (inpPlan) inpPlan.value = "solo_consultorio";
        if (inpSigla && ["GYM", "CDM", "CLB", "PAC", "KIN"].includes(inpSigla.value.toUpperCase())) inpSigla.value = "PSI";
        if (selComp) selComp.value = "simple";
        setProfs(["Psicología"]);

        // Enfoque pedido: Genograma + Mutuales/Tokens + Notas de Evolución (todo lo demás apagado)
        setSwitch("salud", "agenda", false);
        setSwitch("salud", "mutuales", true);
        setSwitch("salud", "genograma", true);
        setSwitch("salud", "evolucion", true);
        setSwitch("salud", "eva", false);
        setSwitch("salud", "portalEstudios", false);
        setSwitch("salud", "equipo", false);
        setSwitch("general", "notasRapidas", true);
    } else if (presetKey === "kine_centro") {
        if (chkF) chkF.checked = false;
        if (chkH) chkH.checked = false;
        if (chkG) chkG.checked = false;
        if (inpDep) inpDep.value = "";
        if (inpPlan) inpPlan.value = "solo_consultorio";
        if (inpSigla && ["GYM", "CDM", "CLB", "PSI"].includes(inpSigla.value.toUpperCase())) inpSigla.value = "KIN";
        if (selComp) selComp.value = "simple";
        setProfs(["Kinesiología", "Quiropraxia", "Nutrición", "Psicología"]);

        setSwitch("salud", "agenda", true);
        setSwitch("salud", "mutuales", true);
        setSwitch("salud", "genograma", false);
        setSwitch("salud", "evolucion", true);
        setSwitch("salud", "eva", true);
        setSwitch("salud", "portalEstudios", true);
        setSwitch("salud", "equipo", true);
        setSwitch("general", "notasRapidas", true);
    } else if (presetKey === "gym_simple") {
        if (chkF) chkF.checked = false;
        if (chkH) chkH.checked = false;
        if (chkG) chkG.checked = true;
        if (inpDep) inpDep.value = "";
        if (inpPlan) inpPlan.value = "solo_gym";
        if (inpSigla && ["CDM", "PSI", "KIN"].includes(inpSigla.value.toUpperCase())) inpSigla.value = "GYM";
        if (selComp) selComp.value = "simple";
        setProfs([]);

        setSwitch("deporte", "cobranza", true);
        setSwitch("deporte", "rutinasVideos", true);
        setSwitch("deporte", "evaluaciones1RM", false);
        setSwitch("deporte", "partidosPizarra", false);
        setSwitch("deporte", "ranking", false);
        setSwitch("deporte", "planSemanal", false);
        setSwitch("general", "notasRapidas", true);
        if (chkBloqCob) chkBloqCob.checked = false;
    } else if (presetKey === "club_completo") {
        if (chkF) chkF.checked = true;
        if (chkH) chkH.checked = true;
        if (chkG) chkG.checked = true;
        if (inpPlan) inpPlan.value = "completo";
        if (selComp) selComp.value = "avanzado";
        setProfs(["Kinesiología", "Nutrición", "Psicología"]);

        document.querySelectorAll(".mc-feat-switch-14").forEach(el => { el.checked = true; });
        if (chkBloqCob) chkBloqCob.checked = false;
    }

    actualizarVisibilidadBloquesInterruptores14();
}

function actualizarVisibilidadBloquesInterruptores14() {
    const tieneSalud = document.querySelectorAll(".mc-chk-profesion:checked").length > 0 ||
                       Boolean((document.getElementById("mcProfesionesExtra")?.value || "").trim());
    const tieneDeporte = Boolean(
        document.getElementById("mcModFutbol")?.checked ||
        document.getElementById("mcModHockey")?.checked ||
        document.getElementById("mcModGym")?.checked ||
        (document.getElementById("mcDeportesExtra")?.value || "").trim()
    );

    const boxSalud = document.getElementById("panelSwitchesSalud14");
    const boxDep = document.getElementById("panelSwitchesDeporte14");
    if (boxSalud) boxSalud.style.opacity = tieneSalud ? "1" : "0.48";
    if (boxDep) boxDep.style.opacity = tieneDeporte ? "1" : "0.48";
}

function leerFuncionesDesdeModalSuperAdmin14() {
    const res = {
        salud: { ...FUNCIONES_DEFECTO_SUPERADMIN_14.salud },
        deporte: { ...FUNCIONES_DEFECTO_SUPERADMIN_14.deporte },
        general: { ...FUNCIONES_DEFECTO_SUPERADMIN_14.general }
    };
    document.querySelectorAll(".mc-feat-switch-14").forEach(chk => {
        const g = chk.dataset.grupo;
        const k = chk.dataset.clave;
        if (g && k && res[g]) {
            res[g][k] = Boolean(chk.checked);
        }
    });
    return res;
}

// 5. Inyectar el Tablero de Presets e Interruptores Granulares en abrirModalCrearOEditarComercio
const _origAbrirModalComercio14 = abrirModalCrearOEditarComercio;
abrirModalCrearOEditarComercio = async function (claveClubEditar = null) {
    await _origAbrirModalComercio14.apply(this, arguments);
    const modal = document.getElementById("modalSuperAdminCDM");
    if (!modal) return;

    const lista = await obtenerListaCompletaComerciosCDM();
    const existente = claveClubEditar ? lista.find(x => x.claveClub === claveClubEditar) : null;
    const lic = existente?.licenciaConfig || {};
    const f = normalizarFuncionesLicencia14(lic);

    const form = modal.querySelector("form");
    if (!form || document.getElementById("panelInterruptoresGranulares14")) return;

    const bloqueCredenciales = Array.from(form.children).find(el =>
        el.tagName === "DIV" && /Credenciales\s+del\s+Due[ñn]o/i.test(el.textContent || "")
    );

    const renderSwitchItem = (grupo, clave, icono, titulo, desc, checked) => `
        <label style="display:flex; align-items:flex-start; justify-content:space-between; gap:0.55rem; background:#ffffff; border:1px solid #cbd5e1; border-radius:11px; padding:0.5rem 0.65rem; cursor:pointer;">
            <div style="min-width:0;">
                <strong style="font-size:0.77rem; color:#0f172a; display:block; line-height:1.2;">${icono} ${titulo}</strong>
                <small style="font-size:0.66rem; color:#64748b; display:block; margin-top:2px; line-height:1.25;">${desc}</small>
            </div>
            <input type="checkbox" class="mc-feat-switch-14" data-grupo="${grupo}" data-clave="${clave}"
                style="width:18px; height:18px; min-height:auto; flex-shrink:0; margin-top:2px; accent-color:#0284c7;"
                ${checked ? "checked" : ""}>
        </label>
    `;

    const panel = document.createElement("div");
    panel.id = "panelInterruptoresGranulares14";
    panel.style = "background:var(--surface-subtle); border:1.5px solid var(--line-celeste); border-radius:16px; padding:1rem; margin-bottom:0.95rem;";
    panel.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
            <div>
                <label style="font-size:0.73rem; font-weight:800; color:#0369a1; text-transform:uppercase; margin:0; display:block;">
                    🎛️ CONTROL DE FUNCIONES POR CLIENTE (PRENDER / BLOQUEAR HERRAMIENTAS)
                </label>
                <small style="font-size:0.71rem; color:var(--ink-500);">
                    Elegí una plantilla rápida o destildá lo que este cliente NO necesita ver en su pantalla.
                </small>
            </div>
        </div>

        <!-- PLANTILLAS RÁPIDAS DE 1 CLIC -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:0.4rem; margin-bottom:0.85rem;">
            <button type="button" class="btn btn-primary btn-sm" style="background:#6366f1; border-color:#4f46e5; font-size:0.72rem;" onclick="aplicarPresetRubroYFunciones14('psicologa_individual')">
                🧠 Psicóloga (Genograma + Mutual)
            </button>
            <button type="button" class="btn btn-secondary btn-sm" style="font-size:0.72rem;" onclick="aplicarPresetRubroYFunciones14('kine_centro')">
                🦿 Centro Kine / Salud
            </button>
            <button type="button" class="btn btn-secondary btn-sm" style="font-size:0.72rem;" onclick="aplicarPresetRubroYFunciones14('gym_simple')">
                🏋️ Gimnasio Simple
            </button>
            <button type="button" class="btn btn-secondary btn-sm" style="font-size:0.72rem;" onclick="aplicarPresetRubroYFunciones14('club_completo')">
                🏟️ Club Completo
            </button>
        </div>

        <!-- BLOQUE A: INTERRUPTORES DEL MUNDO SALUD / CONSULTORIOS -->
        <div id="panelSwitchesSalud14" style="background:rgba(16, 185, 129, 0.06); border:1px solid rgba(16, 185, 129, 0.28); border-radius:13px; padding:0.75rem; margin-bottom:0.75rem; transition:opacity 0.2s;">
            <strong style="font-size:0.72rem; color:#047857; text-transform:uppercase; display:block; margin-bottom:0.5rem;">
                🩺 Herramientas de Salud / Consultorios (Psicología, Kinesiología, Nutrición, Quiropraxia)
            </strong>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(195px, 1fr)); gap:0.45rem;">
                ${renderSwitchItem("salud", "genograma", "🌳", "Genograma y Vínculos", "Árbol familiar (padres, abuelos, hermanos, amigos)", f.salud.genograma)}
                ${renderSwitchItem("salud", "mutuales", "🏥", "Mutuales, Tokens y Órdenes", "Convenios, tokens por sesión y liquidación", f.salud.mutuales)}
                ${renderSwitchItem("salud", "evolucion", "✍️", "Sesiones y Evolución", "Registro de sesiones e historia clínica", f.salud.evolucion)}
                ${renderSwitchItem("salud", "agenda", "📅", "Calendario 30 Días", "Agenda de turnos y avisos por WhatsApp", f.salud.agenda)}
                ${renderSwitchItem("salud", "eva", "📉", "Escala de Dolor (EVA)", "Métrica física 0-10 (ideal Kine/Quiro)", f.salud.eva)}
                ${renderSwitchItem("salud", "portalEstudios", "🔬", "Portal Paciente y Estudios", "Código PAC-XXXX, PDFs y recetas RP/", f.salud.portalEstudios)}
                ${renderSwitchItem("salud", "equipo", "👥", "Equipo de Profesionales", "Multi-profesional y comisiones (apagar si trabaja sola)", f.salud.equipo)}
            </div>
        </div>

        <!-- BLOQUE B: INTERRUPTORES DEL MUNDO DEPORTES / GIMNASIO -->
        <div id="panelSwitchesDeporte14" style="background:rgba(2, 132, 199, 0.06); border:1px solid rgba(2, 132, 199, 0.25); border-radius:13px; padding:0.75rem; margin-bottom:0.75rem; transition:opacity 0.2s;">
            <strong style="font-size:0.72rem; color:#0369a1; text-transform:uppercase; display:block; margin-bottom:0.5rem;">
                ⚽🏋️ Herramientas de Deportes y Gimnasio
            </strong>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(195px, 1fr)); gap:0.45rem;">
                ${renderSwitchItem("deporte", "cobranza", "💳", "Cobranza y Cuotas", "Control de pagos, morosidad y caja", f.deporte.cobranza)}
                ${renderSwitchItem("deporte", "rutinasVideos", "🎥", "Rutinas y Videoteca", "Armador de rutinas y videos técnicos", f.deporte.rutinasVideos)}
                ${renderSwitchItem("deporte", "evaluaciones1RM", "📈", "Evaluaciones 1RM y Radar", "Curvas de fuerza, tabla % 1RM y comparador", f.deporte.evaluaciones1RM)}
                ${renderSwitchItem("deporte", "partidosPizarra", "📋", "Pizarra Táctica y Partidos", "Cancha en vivo, marcador y citaciones", f.deporte.partidosPizarra)}
                ${renderSwitchItem("deporte", "ranking", "🏆", "Ranking Oficial (1 a 10)", "Puntajes y clasificación por categoría", f.deporte.ranking)}
                ${renderSwitchItem("deporte", "planSemanal", "🗓️", "Plan Semanal y Buena Fe", "Microciclo semanal y nómina habilitada", f.deporte.planSemanal)}
            </div>
        </div>

        <!-- BLOQUE C: HERRAMIENTAS GENERALES -->
        <div style="display:grid; grid-template-columns:1fr; gap:0.45rem;">
            ${renderSwitchItem("general", "notasRapidas", "📝", "Bloc de Notas Rápidas (Barra Superior)", "Panel deslizable de recordatorios y checklist rápidos", f.general.notasRapidas)}
        </div>
    `;

    if (bloqueCredenciales) {
        bloqueCredenciales.insertAdjacentElement("beforebegin", panel);
    } else {
        form.appendChild(panel);
    }

    // Sincronizar el viejo checkbox "Bloquear Cobranza" con el switch de Cobranza
    const chkBloqCob = document.getElementById("mcBloquearCobranza");
    const swCob = panel.querySelector('.mc-feat-switch-14[data-grupo="deporte"][data-clave="cobranza"]');
    if (chkBloqCob && swCob) {
        chkBloqCob.addEventListener("change", () => { swCob.checked = !chkBloqCob.checked; });
        swCob.addEventListener("change", () => { chkBloqCob.checked = !swCob.checked; });
    }

    modal.querySelectorAll("#mcModFutbol, #mcModHockey, #mcModGym, .mc-chk-profesion").forEach(el => {
        el.addEventListener("change", actualizarVisibilidadBloquesInterruptores14);
    });
    actualizarVisibilidadBloquesInterruptores14();
};

// 6. Guardar las funciones elegidas al confirmar el formulario del comercio
const _origGuardarComercio14 = guardarComercioDesdeModal;
guardarComercioDesdeModal = async function (e, claveClubExistente = "") {
    const funcionesCapturadas = leerFuncionesDesdeModalSuperAdmin14();
    window.__cdmPendingFunciones14 = funcionesCapturadas;

    // Mantener sincronizado el flag clásico bloquearCobranza
    const chkBloqCob = document.getElementById("mcBloquearCobranza");
    if (chkBloqCob) chkBloqCob.checked = !funcionesCapturadas.deporte.cobranza;

    const nombreInput = (document.getElementById("mcNombreEntidad")?.value || "").trim().toLowerCase();

    await _origGuardarComercio14.apply(this, arguments);

    const mapa = obtenerMapaLocalClubesCDM();
    let claveTarget = claveClubExistente;
    if (!claveTarget && nombreInput) {
        const match = Object.values(mapa).find(c => (c.licenciaConfig?.nombreEntidad || "").toLowerCase() === nombreInput);
        if (match) claveTarget = match.claveClub;
    }

    if (claveTarget && mapa[claveTarget]?.licenciaConfig) {
        mapa[claveTarget].licenciaConfig.funciones = funcionesCapturadas;
        mapa[claveTarget].licenciaConfig.bloquearCobranza = !funcionesCapturadas.deporte.cobranza;
        localStorage.setItem(STORAGE_MAPA_CLUBES_KEY, JSON.stringify(mapa));

        if (obtenerClaveClubActivoCDM() === claveTarget) {
            localStorage.setItem(STORAGE_LICENCIA_KEY, JSON.stringify(mapa[claveTarget].licenciaConfig));
        }

        if (window.location.protocol !== "file:") {
            try {
                const respEst = await fetch(`/api/cdm/estado?club=${encodeURIComponent(claveTarget)}`);
                if (respEst.ok) {
                    const dEst = await respEst.json();
                    const estActual = dEst.estado || {};
                    estActual.licenciaConfig = mapa[claveTarget].licenciaConfig;
                    await fetch("/api/cdm/estado", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ...estActual, claveClub: claveTarget })
                    });
                }
            } catch {}
        }
    }

    window.__cdmPendingFunciones14 = null;
    sincronizarAtributosFuncionesBody14();

    const enLogin = window.location.pathname.toLowerCase().includes("login.html") || document.body.classList.contains("login-page");
    if (enLogin && !document.getElementById("vistaHubSuperAdmin")?.classList.contains("hidden")) {
        await mostrarHubSelectorDeComercios();
    }
};

document.addEventListener("DOMContentLoaded", () => {
    sincronizarAtributosFuncionesBody14();
    setTimeout(sincronizarAtributosFuncionesBody14, 150);
});
// =========================================================================
// 15. INTERRUPTORES DEL PAQUETE 1 EN SUPERADMIN (LOTE MUTUALES, AUMENTO
//     MASIVO DE CUOTAS + ALIAS/CBU Y CIERRE DE CAJA POR MEDIO DE PAGO)
// Pegar al final de login.js (debajo del Bloque 14)
// =========================================================================

if (typeof FUNCIONES_DEFECTO_SUPERADMIN_14 !== "undefined") {
    FUNCIONES_DEFECTO_SUPERADMIN_14.salud.loteMutuales = true;
    FUNCIONES_DEFECTO_SUPERADMIN_14.deporte.aumentoMasivo = true;
    FUNCIONES_DEFECTO_SUPERADMIN_14.general.cierreCaja = true;
}

const _origNormalizarFunc15 = typeof normalizarFuncionesLicencia14 === "function" ? normalizarFuncionesLicencia14 : null;
normalizarFuncionesLicencia14 = function (lic = {}) {
    const base = _origNormalizarFunc15 ? _origNormalizarFunc15(lic) : { salud: {}, deporte: {}, general: {} };
    const raw = (lic && typeof lic.funciones === "object" && lic.funciones) ? lic.funciones : {};

    base.salud.loteMutuales = raw.salud?.loteMutuales !== undefined ? Boolean(raw.salud.loteMutuales) : true;
    base.deporte.aumentoMasivo = raw.deporte?.aumentoMasivo !== undefined ? Boolean(raw.deporte.aumentoMasivo) : true;
    base.general.cierreCaja = raw.general?.cierreCaja !== undefined ? Boolean(raw.general.cierreCaja) : true;
    return base;
};

const _origSincronizarBody15 = typeof sincronizarAtributosFuncionesBody14 === "function" ? sincronizarAtributosFuncionesBody14 : null;
sincronizarAtributosFuncionesBody14 = function () {
    if (_origSincronizarBody15) _origSincronizarBody15();
    if (!document.body) return;
    const path = window.location.pathname.toLowerCase();
    if (path.includes("login.html") || document.body.classList.contains("login-page")) return;

    const lic = obtenerLicenciaConfigCDM();
    const f = normalizarFuncionesLicencia14(lic);
    document.body.setAttribute("data-feat-sal-lote", f.salud.loteMutuales ? "on" : "off");
    document.body.setAttribute("data-feat-dep-aumento", f.deporte.aumentoMasivo ? "on" : "off");
    document.body.setAttribute("data-feat-gen-caja", f.general.cierreCaja ? "on" : "off");
};

const _origAplicarPreset15 = typeof aplicarPresetRubroYFunciones14 === "function" ? aplicarPresetRubroYFunciones14 : null;
aplicarPresetRubroYFunciones14 = function (presetKey) {
    if (_origAplicarPreset15) _origAplicarPreset15(presetKey);
    const setSw = (g, k, v) => {
        const el = document.querySelector(`.mc-feat-switch-14[data-grupo="${g}"][data-clave="${k}"]`);
        if (el) el.checked = Boolean(v);
    };

    if (presetKey === "psicologa_individual" || presetKey === "kine_centro") {
        setSw("salud", "loteMutuales", true);
        setSw("general", "cierreCaja", true);
    } else if (presetKey === "gym_simple" || presetKey === "club_completo") {
        setSw("deporte", "aumentoMasivo", true);
        setSw("general", "cierreCaja", true);
    }
};

const _origAbrirModalComercio15 = abrirModalCrearOEditarComercio;
abrirModalCrearOEditarComercio = async function (claveClubEditar = null) {
    await _origAbrirModalComercio15.apply(this, arguments);
    const modal = document.getElementById("modalSuperAdminCDM");
    const panel = document.getElementById("panelInterruptoresGranulares14");
    if (!modal || !panel) return;

    const lista = await obtenerListaCompletaComerciosCDM();
    const existente = claveClubEditar ? lista.find(x => x.claveClub === claveClubEditar) : null;
    const lic = existente?.licenciaConfig || {};
    const f = normalizarFuncionesLicencia14(lic);

    const crearSwitchHTML = (grupo, clave, icono, titulo, desc, checked) => `
        <label style="display:flex; align-items:flex-start; justify-content:space-between; gap:0.55rem; background:#ffffff; border:1px solid #cbd5e1; border-radius:11px; padding:0.5rem 0.65rem; cursor:pointer;">
            <div style="min-width:0;">
                <strong style="font-size:0.77rem; color:#0f172a; display:block; line-height:1.2;">${icono} ${titulo}</strong>
                <small style="font-size:0.66rem; color:#64748b; display:block; margin-top:2px; line-height:1.25;">${desc}</small>
            </div>
            <input type="checkbox" class="mc-feat-switch-14" data-grupo="${grupo}" data-clave="${clave}"
                style="width:18px; height:18px; min-height:auto; flex-shrink:0; margin-top:2px; accent-color:#0284c7;"
                ${checked ? "checked" : ""}>
        </label>
    `;

    // 1. Inyectar switch de Lote Mensual por Mutual en Salud
    const gridSalud = document.querySelector("#panelSwitchesSalud14 > div");
    if (gridSalud && !gridSalud.querySelector('[data-clave="loteMutuales"]')) {
        gridSalud.insertAdjacentHTML("beforeend", crearSwitchHTML(
            "salud", "loteMutuales", "📊", "Lote Mensual por Mutual",
            "Exportar Excel (CSV) y PDF A4 listo para facturar a obras sociales", f.salud.loteMutuales
        ));
    }

    // 2. Inyectar switch de Aumento Masivo de Cuotas + Alias en Deporte/Gym
    const gridDep = document.querySelector("#panelSwitchesDeporte14 > div");
    if (gridDep && !gridDep.querySelector('[data-clave="aumentoMasivo"]')) {
        gridDep.insertAdjacentHTML("beforeend", crearSwitchHTML(
            "deporte", "aumentoMasivo", "📈", "Aumento Masivo + Alias WA",
            "Subir cuotas por % o plan y enviar recordatorios con Alias/CBU", f.deporte.aumentoMasivo
        ));
    }

    // 3. Inyectar switch de Cierre de Caja + campos de Alias/CBU en General
    const bloqueGen = panel.lastElementChild;
    if (bloqueGen && !bloqueGen.querySelector('[data-clave="cierreCaja"]')) {
        bloqueGen.style.gridTemplateColumns = "repeat(auto-fit, minmax(220px, 1fr))";
        bloqueGen.insertAdjacentHTML("beforeend", crearSwitchHTML(
            "general", "cierreCaja", "💵", "Cierre de Caja por Medio de Pago",
            "Resumen de Efectivo, Transferencia/MP y Pendiente de Mutuales", f.general.cierreCaja
        ));
    }

    if (!document.getElementById("bloqueAliasCobrosModal15")) {
        const boxAlias = document.createElement("div");
        boxAlias.id = "bloqueAliasCobrosModal15";
        boxAlias.style = "margin-top:0.75rem; padding-top:0.75rem; border-top:1.5px dashed #cbd5e1;";
        boxAlias.innerHTML = `
            <strong style="font-size:0.72rem; color:#0369a1; text-transform:uppercase; display:block; margin-bottom:0.45rem;">
                🏦 Datos de Transferencia del Comercio / Profesional (Se envían en avisos de WhatsApp)
            </strong>
            <div class="grid-2">
                <div class="field">
                    <label>Alias o CBU / CVU</label>
                    <input type="text" id="mcAliasTransferencia15" placeholder="Ej: consultorio.psi.mp / club.cdm.mp" value="${(lic.aliasTransferencia || "").replace(/"/g, "&quot;")}">
                </div>
                <div class="field">
                    <label>Titular / Banco o Billetera</label>
                    <input type="text" id="mcTitularTransferencia15" placeholder="Ej: Lic. Camila Rojas (Mercado Pago)" value="${(lic.titularTransferencia || "").replace(/"/g, "&quot;")}">
                </div>
            </div>
        `;
        panel.appendChild(boxAlias);
    }
};

const _origGuardarComercio15 = guardarComercioDesdeModal;
guardarComercioDesdeModal = async function (e, claveClubExistente = "") {
    const aliasVal = (document.getElementById("mcAliasTransferencia15")?.value || "").trim();
    const titularVal = (document.getElementById("mcTitularTransferencia15")?.value || "").trim();
    const nombreInput = (document.getElementById("mcNombreEntidad")?.value || "").trim().toLowerCase();

    await _origGuardarComercio15.apply(this, arguments);

    const mapa = obtenerMapaLocalClubesCDM();
    let claveTarget = claveClubExistente;
    if (!claveTarget && nombreInput) {
        const match = Object.values(mapa).find(c => (c.licenciaConfig?.nombreEntidad || "").toLowerCase() === nombreInput);
        if (match) claveTarget = match.claveClub;
    }

    if (claveTarget && mapa[claveTarget]?.licenciaConfig) {
        mapa[claveTarget].licenciaConfig.aliasTransferencia = aliasVal;
        mapa[claveTarget].licenciaConfig.titularTransferencia = titularVal;
        localStorage.setItem(STORAGE_MAPA_CLUBES_KEY, JSON.stringify(mapa));

        if (obtenerClaveClubActivoCDM() === claveTarget) {
            localStorage.setItem(STORAGE_LICENCIA_KEY, JSON.stringify(mapa[claveTarget].licenciaConfig));
        }

        if (window.location.protocol !== "file:") {
            try {
                const respEst = await fetch(`/api/cdm/estado?club=${encodeURIComponent(claveTarget)}`);
                if (respEst.ok) {
                    const dEst = await respEst.json();
                    const estActual = dEst.estado || {};
                    estActual.licenciaConfig = mapa[claveTarget].licenciaConfig;
                    await fetch("/api/cdm/estado", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ...estActual, claveClub: claveTarget })
                    });
                }
            } catch {}
        }
    }
    sincronizarAtributosFuncionesBody14();
};

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(sincronizarAtributosFuncionesBody14, 180);
});
// =========================================================================
// 16. INTERRUPTORES DEL PAQUETE 2 EN SUPERADMIN:
//     - SALUD: CONSENTIMIENTO CON FIRMA TÁCTIL + MAPA CORPORAL INTERACTIVO
//     - GYM: MODO TÓTEM RECEPCIÓN Y CUPOS POR HORARIO
//     - DEPORTES: SEMÁFORO APTO MÉDICO (EMMAC) Y ESTADÍSTICAS DE TEMPORADA
// Pegar al final de login.js (debajo del Bloque 15)
// =========================================================================

if (typeof FUNCIONES_DEFECTO_SUPERADMIN_14 !== "undefined") {
    FUNCIONES_DEFECTO_SUPERADMIN_14.salud.consentimiento = true;
    FUNCIONES_DEFECTO_SUPERADMIN_14.salud.mapaCorporal = true;
    FUNCIONES_DEFECTO_SUPERADMIN_14.deporte.totemYCupos = true;
    FUNCIONES_DEFECTO_SUPERADMIN_14.deporte.emmacYEstadisticas = true;
}

const _origNormalizarFunc16 = typeof normalizarFuncionesLicencia14 === "function" ? normalizarFuncionesLicencia14 : null;
normalizarFuncionesLicencia14 = function (lic = {}) {
    const base = _origNormalizarFunc16 ? _origNormalizarFunc16(lic) : { salud: {}, deporte: {}, general: {} };
    const raw = (lic && typeof lic.funciones === "object" && lic.funciones) ? lic.funciones : {};

    base.salud.consentimiento = raw.salud?.consentimiento !== undefined ? Boolean(raw.salud.consentimiento) : true;
    base.salud.mapaCorporal = raw.salud?.mapaCorporal !== undefined ? Boolean(raw.salud.mapaCorporal) : true;
    base.deporte.totemYCupos = raw.deporte?.totemYCupos !== undefined ? Boolean(raw.deporte.totemYCupos) : true;
    base.deporte.emmacYEstadisticas = raw.deporte?.emmacYEstadisticas !== undefined ? Boolean(raw.deporte.emmacYEstadisticas) : true;
    return base;
};

const _origSincronizarBody16 = typeof sincronizarAtributosFuncionesBody14 === "function" ? sincronizarAtributosFuncionesBody14 : null;
sincronizarAtributosFuncionesBody14 = function () {
    if (_origSincronizarBody16) _origSincronizarBody16();
    if (!document.body) return;
    const path = window.location.pathname.toLowerCase();
    if (path.includes("login.html") || document.body.classList.contains("login-page")) return;

    const lic = obtenerLicenciaConfigCDM();
    const f = normalizarFuncionesLicencia14(lic);
    document.body.setAttribute("data-feat-sal-consentimiento", f.salud.consentimiento ? "on" : "off");
    document.body.setAttribute("data-feat-sal-mapa", f.salud.mapaCorporal ? "on" : "off");
    document.body.setAttribute("data-feat-dep-totem", f.deporte.totemYCupos ? "on" : "off");
    document.body.setAttribute("data-feat-dep-emmac", f.deporte.emmacYEstadisticas ? "on" : "off");
};

const _origAplicarPreset16 = typeof aplicarPresetRubroYFunciones14 === "function" ? aplicarPresetRubroYFunciones14 : null;
aplicarPresetRubroYFunciones14 = function (presetKey) {
    if (_origAplicarPreset16) _origAplicarPreset16(presetKey);
    const setSw = (g, k, v) => {
        const el = document.querySelector(`.mc-feat-switch-14[data-grupo="${g}"][data-clave="${k}"]`);
        if (el) el.checked = Boolean(v);
    };

    if (presetKey === "psicologa_individual") {
        setSw("salud", "consentimiento", true);
        setSw("salud", "mapaCorporal", false);
    } else if (presetKey === "kine_centro") {
        setSw("salud", "consentimiento", true);
        setSw("salud", "mapaCorporal", true);
    } else if (presetKey === "gym_simple") {
        setSw("deporte", "totemYCupos", true);
        setSw("deporte", "emmacYEstadisticas", false);
    } else if (presetKey === "club_completo") {
        setSw("salud", "consentimiento", true);
        setSw("salud", "mapaCorporal", true);
        setSw("deporte", "totemYCupos", true);
        setSw("deporte", "emmacYEstadisticas", true);
    }
};

const _origAbrirModalComercio16 = abrirModalCrearOEditarComercio;
abrirModalCrearOEditarComercio = async function (claveClubEditar = null) {
    await _origAbrirModalComercio16.apply(this, arguments);
    const panel = document.getElementById("panelInterruptoresGranulares14");
    if (!panel) return;

    const lista = await obtenerListaCompletaComerciosCDM();
    const existente = claveClubEditar ? lista.find(x => x.claveClub === claveClubEditar) : null;
    const lic = existente?.licenciaConfig || {};
    const f = normalizarFuncionesLicencia14(lic);

    const crearSw = (grupo, clave, icono, titulo, desc, checked) => `
        <label style="display:flex; align-items:flex-start; justify-content:space-between; gap:0.55rem; background:#ffffff; border:1px solid #cbd5e1; border-radius:11px; padding:0.5rem 0.65rem; cursor:pointer;">
            <div style="min-width:0;">
                <strong style="font-size:0.77rem; color:#0f172a; display:block; line-height:1.2;">${icono} ${titulo}</strong>
                <small style="font-size:0.66rem; color:#64748b; display:block; margin-top:2px; line-height:1.25;">${desc}</small>
            </div>
            <input type="checkbox" class="mc-feat-switch-14" data-grupo="${grupo}" data-clave="${clave}"
                style="width:18px; height:18px; min-height:auto; flex-shrink:0; margin-top:2px; accent-color:#0284c7;"
                ${checked ? "checked" : ""}>
        </label>
    `;

    const gridSalud = document.querySelector("#panelSwitchesSalud14 > div");
    if (gridSalud && !gridSalud.querySelector('[data-clave="consentimiento"]')) {
        gridSalud.insertAdjacentHTML("beforeend", crearSw(
            "salud", "consentimiento", "✍️", "Consentimiento + Firma Táctil",
            "Firma digital en pantalla (adultos/menores) y PDF A4", f.salud.consentimiento
        ));
        gridSalud.insertAdjacentHTML("beforeend", crearSw(
            "salud", "mapaCorporal", "🧍", "Mapa Corporal Interactivo",
            "Silueta Frente/Espalda para marcar dolor y lesiones (Kine/Quiro)", f.salud.mapaCorporal
        ));
    }

    const gridDep = document.querySelector("#panelSwitchesDeporte14 > div");
    if (gridDep && !gridDep.querySelector('[data-clave="totemYCupos"]')) {
        gridDep.insertAdjacentHTML("beforeend", crearSw(
            "deporte", "totemYCupos", "🖥️", "Modo Tótem y Cupos Horarios",
            "Recepción pantalla completa por DNI y turnos con cupo (Gym)", f.deporte.totemYCupos
        ));
        gridDep.insertAdjacentHTML("beforeend", crearSw(
            "deporte", "emmacYEstadisticas", "🏥", "Apto EMMAC y Estadísticas",
            "Semáforo apto médico anual + Goleadores y tabla de temporada", f.deporte.emmacYEstadisticas
        ));
    }
};

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(sincronizarAtributosFuncionesBody14, 210);
});
// =========================================================================
// 17. BACKUP Y RESTAURACIÓN INDIVIDUAL POR COMERCIO DESDE EL HUB SUPERADMIN
//     - EXPORTA E IMPORTA UN ÚNICO CLIENTE (.JSON) SIN PISAR OTROS COMERCIOS
//     - INCLUYE PLANTELES, RUTINAS, CONSULTORIO, PACIENTES, GENOGRAMAS, CAJA Y NOTAS
// Pegar al final de login.js (debajo del Bloque 16)
// =========================================================================

function exportarBackupIndividualComercio17(claveClub) {
    if (!claveClub) return;
    guardarSnapshotClubActualEnMapaLocal();
    const mapa = obtenerMapaLocalClubesCDM();
    const clubData = mapa[claveClub];
    if (!clubData) {
        alert("No se encontraron datos guardados para este comercio.");
        return;
    }

    // Recolectar también los módulos satélites aislados de este comercio (Consultorio, Caja, Notas, Cupos, Aranceles, Pacientes)
    let consultorioClub = null;
    try {
        const allCons = JSON.parse(localStorage.getItem("cdm_consultorio_pro_v1") || "{}");
        if (allCons && allCons[claveClub]) consultorioClub = allCons[claveClub];
    } catch {}

    let notasClub = [];
    try {
        const allNotas = JSON.parse(localStorage.getItem("cdm_notas_rapidas_pro_v23") || "{}");
        if (allNotas && Array.isArray(allNotas[claveClub])) notasClub = allNotas[claveClub];
    } catch {}

    let pacientesUniversalesClub = {};
    try {
        const allUniv = JSON.parse(localStorage.getItem("cdm_registro_universal_pacientes_v19") || "{}");
        Object.entries(allUniv).forEach(([k, v]) => {
            if (v && (!v.claveClub || v.claveClub === claveClub)) {
                pacientesUniversalesClub[k] = v;
            }
        });
    } catch {}

    let cajaClub = [], cuposClub = null, arancelesClub = {};
    try { cajaClub = JSON.parse(localStorage.getItem(`cdm_caja_movs_v25_${claveClub}`) || "[]"); } catch {}
    try { cuposClub = JSON.parse(localStorage.getItem(`cdm_gym_cupos_v26_${claveClub}`) || "null"); } catch {}
    try { arancelesClub = JSON.parse(localStorage.getItem(`cdm_aranceles_lote_v25_${claveClub}`) || "{}"); } catch {}

    const paqueteBackup = {
        tipoBackup: "COMERCIO_INDIVIDUAL_SAAS_V1",
        fechaExportacion: new Date().toISOString(),
        claveClub,
        nombreEntidad: clubData.licenciaConfig?.nombreEntidad || claveClub,
        datosPrincipales: clubData,
        extrasComercio: {
            consultorio: consultorioClub,
            notasRapidas: notasClub,
            pacientesUniversales: pacientesUniversalesClub,
            cajaMovimientos: cajaClub,
            gymCupos: cuposClub,
            arancelesLote: arancelesClub
        }
    };

    const hoy = new Date().toISOString().split("T")[0];
    const blob = new Blob([JSON.stringify(paqueteBackup, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_${claveClub}_${hoy}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);

    if (typeof mostrarToast === "function") {
        mostrarToast(`💾 Backup individual de "${paqueteBackup.nombreEntidad}" descargado.`);
    }
}

function importarBackupIndividualComercio17(event, claveClubDestino) {
    const file = event.target.files?.[0];
    if (!file || !claveClubDestino) return;

    const reader = new FileReader();
    reader.onload = async function (ev) {
        try {
            const parsed = JSON.parse(ev.target.result);
            const esFormatoIndividual = parsed && parsed.tipoBackup === "COMERCIO_INDIVIDUAL_SAAS_V1" && parsed.datosPrincipales;
            const datosClub = esFormatoIndividual ? parsed.datosPrincipales : parsed;

            if (!datosClub || typeof datosClub !== "object" || (!Array.isArray(datosClub.personas) && !datosClub.licenciaConfig)) {
                throw new Error("El archivo no corresponde a una copia de seguridad válida.");
            }

            const mapa = obtenerMapaLocalClubesCDM();
            const nombreDestino = mapa[claveClubDestino]?.licenciaConfig?.nombreEntidad || claveClubDestino;
            if (!confirm(`⚠️ ¿Restaurar este backup únicamente dentro de "${nombreDestino}"?\n\nLos demás comercios de tu Hub NO se modificarán.`)) {
                event.target.value = "";
                return;
            }

            // Mantener la claveClub destino para aislarlo siempre dentro de este cliente
            const licRestaurada = {
                ...(mapa[claveClubDestino]?.licenciaConfig || {}),
                ...(datosClub.licenciaConfig || {}),
                claveClub: claveClubDestino
            };

            mapa[claveClubDestino] = {
                claveClub: claveClubDestino,
                ultimaActualizacionISO: new Date().toISOString(),
                personas: Array.isArray(datosClub.personas) ? datosClub.personas : [],
                rutinas: Array.isArray(datosClub.rutinas) ? datosClub.rutinas : [],
                partidos: Array.isArray(datosClub.partidos) ? datosClub.partidos : [],
                alineaciones: datosClub.alineaciones && typeof datosClub.alineaciones === "object" ? datosClub.alineaciones : {},
                microciclos: datosClub.microciclos && typeof datosClub.microciclos === "object" ? datosClub.microciclos : {},
                licenciaConfig: licRestaurada
            };
            localStorage.setItem(STORAGE_MAPA_CLUBES_KEY, JSON.stringify(mapa));

            // Restaurar módulos satélites del comercio si vienen en el backup individual
            if (esFormatoIndividual && parsed.extrasComercio) {
                const ex = parsed.extrasComercio;
                if (ex.consultorio) {
                    const allCons = JSON.parse(localStorage.getItem("cdm_consultorio_pro_v1") || "{}");
                    allCons[claveClubDestino] = ex.consultorio;
                    localStorage.setItem("cdm_consultorio_pro_v1", JSON.stringify(allCons));
                }
                if (Array.isArray(ex.notasRapidas)) {
                    const allNotas = JSON.parse(localStorage.getItem("cdm_notas_rapidas_pro_v23") || "{}");
                    allNotas[claveClubDestino] = ex.notasRapidas;
                    localStorage.setItem("cdm_notas_rapidas_pro_v23", JSON.stringify(allNotas));
                }
                if (ex.pacientesUniversales && typeof ex.pacientesUniversales === "object") {
                    const allUniv = JSON.parse(localStorage.getItem("cdm_registro_universal_pacientes_v19") || "{}");
                    Object.entries(ex.pacientesUniversales).forEach(([k, v]) => {
                        allUniv[k] = { ...v, claveClub: claveClubDestino };
                    });
                    localStorage.setItem("cdm_registro_universal_pacientes_v19", JSON.stringify(allUniv));
                }
                if (Array.isArray(ex.cajaMovimientos)) {
                    localStorage.setItem(`cdm_caja_movs_v25_${claveClubDestino}`, JSON.stringify(ex.cajaMovimientos));
                }
                if (Array.isArray(ex.gymCupos)) {
                    localStorage.setItem(`cdm_gym_cupos_v26_${claveClubDestino}`, JSON.stringify(ex.gymCupos));
                }
                if (ex.arancelesLote && typeof ex.arancelesLote === "object") {
                    localStorage.setItem(`cdm_aranceles_lote_v25_${claveClubDestino}`, JSON.stringify(ex.arancelesLote));
                }
            }

            // Si es el comercio actualmente cargado en memoria local, refrescar también las claves activas
            if (obtenerClaveClubActivoCDM() === claveClubDestino) {
                cargarEstadoClubEnLocalStorage(mapa[claveClubDestino], claveClubDestino);
            }

            // Sincronizar con el servidor si está activo
            if (window.location.protocol !== "file:") {
                try {
                    await fetch("/api/cdm/estado", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(mapa[claveClubDestino])
                    });
                } catch {}
            }

            alert(`✅ Backup restaurado correctamente en "${licRestaurada.nombreEntidad || nombreDestino}".`);
            await mostrarHubSelectorDeComercios();
        } catch (err) {
            alert("❌ Error al restaurar backup: " + err.message);
        } finally {
            event.target.value = "";
        }
    };
    reader.readAsText(file);
}

// Inyectar los botones "💾 Backup" y "📂 Restaurar" en cada tarjeta del Hub SuperAdmin
const _origMostrarHub17 = mostrarHubSelectorDeComercios;
mostrarHubSelectorDeComercios = async function () {
    await _origMostrarHub17.apply(this, arguments);
    const lista = await obtenerListaCompletaComerciosCDM();
    const cards = document.querySelectorAll("#gridTarjetasComerciosHub .hub-comercio-card");

    cards.forEach((card, idx) => {
        const item = lista[idx];
        if (!item || !item.claveClub || card.querySelector(".hub-backup-row-17")) return;

        const pieBotones = card.lastElementChild;
        if (!pieBotones) return;

        const filaBackup = document.createElement("div");
        filaBackup.className = "hub-backup-row-17";
        filaBackup.style = "display:flex; gap:0.35rem;";
        filaBackup.innerHTML = `
            <button type="button" class="btn btn-ghost btn-sm" style="flex:1; font-size:0.71rem; min-height:29px;" onclick="exportarBackupIndividualComercio17('${item.claveClub}')" title="Descargar copia de seguridad JSON solo de este comercio">
                💾 Backup
            </button>
            <label class="btn btn-ghost btn-sm" style="flex:1; font-size:0.71rem; min-height:29px; cursor:pointer; margin:0;" title="Restaurar copia JSON solo en este comercio">
                📂 Restaurar
                <input type="file" accept=".json" onchange="importarBackupIndividualComercio17(event, '${item.claveClub}')" style="display:none;">
            </label>
        `;
        pieBotones.appendChild(filaBackup);
    });
};
// =========================================================================
// 18. SISTEMA DE DEMOS POR DÍAS (7 / 10 / 15 DÍAS) + SYNC CONSULTORIO
//     Pegar al final de js/login.js (debajo del Bloque 17)
// =========================================================================

function sumarDiasDesdeHoyISO18(dias) {
    const d = new Date();
    d.setDate(d.getDate() + Number(dias || 7));
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function calcularDiasRestantesDemo18(fechaISO) {
    const v = String(fechaISO || "").trim();
    if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const [y, m, d] = v.split("-").map(Number);
    const fin = new Date(y, m - 1, d, 0, 0, 0, 0);
    return Math.round((fin.getTime() - hoy.getTime()) / 86400000);
}

function formatearFechaDemoAR18(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
}

window.aplicarDiasDemoModal18 = function (dias) {
    const inp = document.getElementById("mcFechaVencimientoDemo18");
    const lbl = document.getElementById("lblEstadoDemoModal18");
    if (!inp) return;
    if (!dias) {
        inp.value = "";
        if (lbl) lbl.innerHTML = "♾️ <b>Cliente Definitivo</b> (sin fecha de corte)";
    } else {
        inp.value = sumarDiasDesdeHoyISO18(dias);
        if (lbl) lbl.innerHTML = `🎁 <b>Demo activa por ${dias} días</b> (vence el ${formatearFechaDemoAR18(inp.value)})`;
    }
};

// 1. Asegurar carga y guardado de datos de Consultorio al cambiar de comercio
const _origCargarEstadoClub18 = cargarEstadoClubEnLocalStorage;
cargarEstadoClubEnLocalStorage = function (estadoClub, claveClub) {
    _origCargarEstadoClub18.apply(this, arguments);
    if (estadoClub && estadoClub.consultorio && typeof estadoClub.consultorio === "object") {
        const clave = claveClub || estadoClub.claveClub || CLAVE_CLUB_DEFECTO_CDM;
        localStorage.setItem(`cdm_consultorio_suite_v2_${clave}`, JSON.stringify(estadoClub.consultorio));
    }
};

const _origGuardarSnapshot18 = guardarSnapshotClubActualEnMapaLocal;
guardarSnapshotClubActualEnMapaLocal = function () {
    const mapa = _origGuardarSnapshot18.apply(this, arguments);
    const claveActual = obtenerClaveClubActivoCDM();
    if (mapa && mapa[claveActual]) {
        try {
            const cons = JSON.parse(localStorage.getItem(`cdm_consultorio_suite_v2_${claveActual}`) || "null");
            if (cons && typeof cons === "object") {
                mapa[claveActual].consultorio = cons;
                localStorage.setItem(STORAGE_MAPA_CLUBES_KEY, JSON.stringify(mapa));
            }
        } catch {}
    }
    return mapa;
};

// 2. Inyectar selector de Demo (7 / 10 días / Sin límite) en el Modal de Comercio
const _origAbrirModalComercio18 = abrirModalCrearOEditarComercio;
abrirModalCrearOEditarComercio = async function (claveClubEditar = null) {
    await _origAbrirModalComercio18.apply(this, arguments);
    const modal = document.getElementById("modalSuperAdminCDM");
    const form = modal?.querySelector("form");
    if (!form || document.getElementById("bloqueDemoDiasModal18")) return;

    const lista = await obtenerListaCompletaComerciosCDM();
    const existente = claveClubEditar ? lista.find(x => x.claveClub === claveClubEditar) : null;
    const venceActual = existente?.licenciaConfig?.fechaVencimientoDemo || "";
    const diasRest = calcularDiasRestantesDemo18(venceActual);

    const estadoTxt = !venceActual
        ? "♾️ <b>Cliente Definitivo</b> (sin fecha de corte)"
        : diasRest < 0
        ? `🔴 <b>Demo VENCIDA</b> el ${formatearFechaDemoAR18(venceActual)} (sus datos siguen guardados)`
        : `🎁 <b>Prueba activa</b> — vence el ${formatearFechaDemoAR18(venceActual)} (${diasRest === 0 ? "vence hoy" : `quedan ${diasRest} días`})`;

    const box = document.createElement("div");
    box.id = "bloqueDemoDiasModal18";
    box.style = "background:linear-gradient(135deg, rgba(16,185,129,0.08), rgba(2,132,199,0.08)); border:1.5px solid #38bdf8; border-radius:16px; padding:0.9rem 1rem; margin-bottom:1rem;";
    box.innerHTML = `
        <label style="font-size:0.72rem; font-weight:800; color:#0369a1; text-transform:uppercase; display:block; margin-bottom:0.5rem;">
            ⏳ VIGENCIA / DEMO TEMPORAL (BLOQUEO AUTOMÁTICO SIN BORRAR DATOS)
        </label>
        <div style="display:flex; gap:0.4rem; flex-wrap:wrap; margin-bottom:0.6rem;">
            <button type="button" class="btn btn-primary btn-sm" onclick="aplicarDiasDemoModal18(7)">🎁 Demo 7 días</button>
            <button type="button" class="btn btn-primary btn-sm" style="background:#0d9488; border-color:#0d9488;" onclick="aplicarDiasDemoModal18(10)">🎁 Demo 10 días</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="aplicarDiasDemoModal18(15)">📅 Demo 15 días</button>
            <button type="button" class="btn btn-ghost btn-sm" onclick="aplicarDiasDemoModal18(0)">♾️ Definitivo (Sin límite)</button>
        </div>
        <div style="display:flex; align-items:center; gap:0.65rem; flex-wrap:wrap;">
            <div class="field" style="width:190px;">
                <label>Fecha límite exacta</label>
                <input type="date" id="mcFechaVencimientoDemo18" value="${venceActual}" onchange="document.getElementById('lblEstadoDemoModal18').innerHTML = this.value ? '🎁 Vence el ' + formatearFechaDemoAR18(this.value) : '♾️ Sin vencimiento'">
            </div>
            <small id="lblEstadoDemoModal18" style="font-size:0.78rem; color:var(--ink-700); flex:1;">${estadoTxt}</small>
        </div>
    `;

    const pie = form.lastElementChild;
    if (pie) pie.insertAdjacentElement("beforebegin", box);
    else form.appendChild(box);
};

// 3. Guardar la fechaVencimientoDemo al confirmar el comercio
const _origGuardarComercio18 = guardarComercioDesdeModal;
guardarComercioDesdeModal = async function (e, claveClubExistente = "") {
    const fechaVenc = (document.getElementById("mcFechaVencimientoDemo18")?.value || "").trim();
    const nombreInput = (document.getElementById("mcNombreEntidad")?.value || "").trim().toLowerCase();

    await _origGuardarComercio18.apply(this, arguments);

    const mapa = obtenerMapaLocalClubesCDM();
    let claveTarget = claveClubExistente;
    if (!claveTarget && nombreInput) {
        const match = Object.values(mapa).find(c => (c.licenciaConfig?.nombreEntidad || "").toLowerCase() === nombreInput);
        if (match) claveTarget = match.claveClub;
    }

    if (claveTarget && mapa[claveTarget]?.licenciaConfig) {
        mapa[claveTarget].licenciaConfig.fechaVencimientoDemo = fechaVenc;
        localStorage.setItem(STORAGE_MAPA_CLUBES_KEY, JSON.stringify(mapa));
        if (obtenerClaveClubActivoCDM() === claveTarget) {
            localStorage.setItem(STORAGE_LICENCIA_KEY, JSON.stringify(mapa[claveTarget].licenciaConfig));
        }
        if (window.location.protocol !== "file:") {
            try {
                const respEst = await fetch(`/api/cdm/estado?club=${encodeURIComponent(claveTarget)}`);
                if (respEst.ok) {
                    const dEst = await respEst.json();
                    const estActual = dEst.estado || {};
                    estActual.licenciaConfig = { ...(estActual.licenciaConfig || {}), ...mapa[claveTarget].licenciaConfig, fechaVencimientoDemo: fechaVenc };
                    await fetch("/api/cdm/estado", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ...estActual, claveClub: claveTarget })
                    });
                }
            } catch {}
        }
    }

    const enLogin = window.location.pathname.toLowerCase().includes("login.html") || document.body?.classList.contains("login-page");
    if (enLogin && !document.getElementById("vistaHubSuperAdmin")?.classList.contains("hidden")) {
        await mostrarHubSelectorDeComercios();
    }
};

// 4. Mostrar badge de Demo en cada tarjeta del Hub SuperAdmin
const _origMostrarHub18 = mostrarHubSelectorDeComercios;
mostrarHubSelectorDeComercios = async function () {
    await _origMostrarHub18.apply(this, arguments);
    const lista = await obtenerListaCompletaComerciosCDM();
    const cards = document.querySelectorAll("#gridTarjetasComerciosHub .hub-comercio-card");

    cards.forEach((card, idx) => {
        const lic = lista[idx]?.licenciaConfig || {};
        if (!lic.fechaVencimientoDemo || card.querySelector(".hub-demo-pill-18")) return;
        const dias = calcularDiasRestantesDemo18(lic.fechaVencimientoDemo);
        const fTxt = formatearFechaDemoAR18(lic.fechaVencimientoDemo);
        const vencida = dias !== null && dias < 0;

        const pill = document.createElement("div");
        pill.className = "hub-demo-pill-18";
        pill.style = `font-size:0.72rem; font-weight:800; padding:0.32rem 0.6rem; border-radius:9px; text-align:center; ${
            vencida
                ? "background:rgba(239,68,68,0.12); color:#dc2626; border:1px solid rgba(239,68,68,0.35);"
                : "background:rgba(245,158,11,0.14); color:#b45309; border:1px solid rgba(245,158,11,0.35);"
        }`;
        pill.innerHTML = vencida
            ? `⏳ Demo VENCIDA (${fTxt}) — Tocá Editar para activar`
            : `🎁 Demo: ${dias === 0 ? "vence HOY" : `quedan ${dias} día(s)`} (hasta ${fTxt})`;
        card.insertBefore(pill, card.lastElementChild);
    });
};

// 5. Mejorar el mensaje WA de credenciales (incluye link real, especialidades y fecha límite de demo)
enviarCredencialesDeComercioEspecificoWA = async function (claveClub) {
    const lista = await obtenerListaCompletaComerciosCDM();
    const item = lista.find(x => x.claveClub === claveClub);
    const lic = item?.licenciaConfig || obtenerLicenciaConfigCDM();
    const base = window.location.origin && window.location.origin !== "null" ? window.location.origin : "http://localhost:3000";
    const link = `${base}/login.html`;

    const modTxt = [
        lic.modulos?.futbol ? "⚽ Fútbol" : null,
        lic.modulos?.hockey ? "🏑 Hockey" : null,
        lic.modulos?.gym ? "🏋️ Gimnasio" : null,
        ...(Array.isArray(lic.deportesExtra) ? lic.deportesExtra : []),
        ...(Array.isArray(lic.profesionesHabilitadas) ? lic.profesionesHabilitadas.map(p => `🩺 ${p}`) : [])
    ].filter(Boolean).join(" + ");

    const esDemo = Boolean(lic.fechaVencimientoDemo);
    const fechaTxt = formatearFechaDemoAR18(lic.fechaVencimientoDemo);

    let msg = `${esDemo ? "🎁 *ACCESO DEMO GRATUITA*" : "🚀 *ACCESO OFICIAL AL SISTEMA*"} — *${(lic.nombreEntidad || "PLATAFORMA").toUpperCase()}*\n`;
    msg += `----------------------------------\n`;
    msg += `Hola, ya está lista tu cuenta exclusiva para probar y administrar *${lic.nombreEntidad}* desde celular o PC:\n\n`;
    msg += `🔗 *Link de Ingreso:* ${link}\n`;
    msg += `👑 *Solapa:* Admin / Comercio\n`;
    msg += `• *Usuario:* ${lic.adminUsuario === "admin" ? "cdm" : lic.adminUsuario}\n`;
    msg += `• *Contraseña:* ${lic.adminClave}\n\n`;
    if (modTxt) msg += `📦 *Áreas Habilitadas:* ${modTxt}\n`;
    if (esDemo) msg += `⏳ *Prueba gratuita válida hasta:* *${fechaTxt}* _(todo lo que cargues queda guardado si decidís continuar)_\n`;
    msg += `----------------------------------\n`;
    msg += `_Desarrollo y Soporte: Gonzalo Adanchú_`;

    const tel = prompt("📱 WhatsApp del profesional / club (o dejá vacío para elegir en WhatsApp):", "");
    if (tel === null) return;
    const limpio = tel.replace(/\D/g, "");
    window.open(limpio ? `https://wa.me/${limpio}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
};

// 6. Validar vencimiento en login local + mostrar cintita de días restantes dentro de la app
const _origLoginAdmin18 = iniciarSesionComoAdmin;
iniciarSesionComoAdmin = async function (e) {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    const user = (document.getElementById("inputAdminUser")?.value || "").trim().toLowerCase();
    const pass = (document.getElementById("inputAdminPass")?.value || "").trim();

    if (!CREDENCIALES_SUPERADMIN.usuarios.includes(user)) {
        const mapaLocal = obtenerMapaLocalClubesCDM();
        const localHit = Object.values(mapaLocal).find(c => {
            const u = (c.licenciaConfig?.adminUsuario || "cdm").toLowerCase();
            return u === user && (c.licenciaConfig?.adminClave || "cdm2026") === pass;
        });
        if (localHit?.licenciaConfig?.fechaVencimientoDemo) {
            const dias = calcularDiasRestantesDemo18(localHit.licenciaConfig.fechaVencimientoDemo);
            if (dias !== null && dias < 0) {
                mostrarErrorLogin(`⏳ Tu prueba gratuita finalizó el ${formatearFechaDemoAR18(localHit.licenciaConfig.fechaVencimientoDemo)}. Tus datos siguen guardados. Contactá a Gonzalo Adanchú para activar el plan.`);
                return;
            }
        }
    }
    return _origLoginAdmin18.apply(this, arguments);
};

// 7. Banner discreto de días restantes y cierre si vence con sesión abierta (no afecta al SuperAdmin)
document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes("login.html") || document.body?.classList.contains("login-page")) return;

    const ses = obtenerSesionActivaCDM();
    if (!ses || ses.esSuperAdmin) return;

    const lic = obtenerLicenciaConfigCDM();
    if (!lic?.fechaVencimientoDemo) return;

    const dias = calcularDiasRestantesDemo18(lic.fechaVencimientoDemo);
    if (dias !== null && dias < 0) {
        alert(`⏳ Tu período de prueba finalizó el ${formatearFechaDemoAR18(lic.fechaVencimientoDemo)}. Tus datos están guardados de forma segura. Contactá a Gonzalo Adanchú para activar tu plan.`);
        cerrarSesionCDM();
        return;
    }

    if (!document.getElementById("cdmBannerDemoActiva18")) {
        const top = document.querySelector(".app-main");
        if (top) {
            const b = document.createElement("div");
            b.id = "cdmBannerDemoActiva18";
            b.style = "background:linear-gradient(90deg, #0284c7, #0d9488); color:#fff; font-size:0.76rem; font-weight:700; text-align:center; padding:0.35rem 0.75rem;";
            b.innerHTML = `🎁 Cuenta en Prueba Gratuita — ${dias === 0 ? "Último día" : `Te quedan ${dias} día(s)`} (hasta el ${formatearFechaDemoAR18(lic.fechaVencimientoDemo)})`;
            top.prepend(b);
        }
    }
});
// =========================================================================
// 19. SISTEMA DE SUB-ADMINISTRADORES (STAFF) CON PERMISOS GRANULARES + AUDITORÍA
//     Jerarquía: SuperAdmin (Global) -> Admin Principal del Sistema -> Staff a medida
//     Pegar al final de js/login.js (debajo del Bloque 18)
// =========================================================================

const CATALOGO_PERMISOS_STAFF_19 = [
    { clave: "padronEditar", icono: "👤", titulo: "Crear / Editar Socios y Jugadores", desc: "Alta de socios, edición de ficha y datos personales" },
    { clave: "asistencia", icono: "✓", titulo: "Tomar Lista y Check-in", desc: "Marcar presentes, faltas y lista de 5 estados" },
    { clave: "rutinasEditar", icono: "🏋️", titulo: "Crear / Editar Rutinas y Videos", desc: "Cargar planes de entrenamiento y videoteca" },
    { clave: "evaluacionesEditar", icono: "📈", titulo: "Cargar Marcas, Scores y Lesiones", desc: "Evaluaciones 1RM, pilares 360°, anatomía y lesiones" },
    { clave: "cajaVer", icono: "💰", titulo: "Ver Caja, Cuotas y Reportes", desc: "Visualizar recaudación, estados de cuota y contabilidad" },
    { clave: "cajaCobrar", icono: "💳", titulo: "Cobrar Cuotas / Registrar Pagos", desc: "Cambiar estado de cuota y enviar recibos por WA" },
    { clave: "consultorio", icono: "🩺", titulo: "Módulo Consultorio / Salud", desc: "Acceder a pacientes, turnos y evoluciones clínicas" },
    { clave: "codigos", icono: "🔑", titulo: "Gestionar Códigos Personales", desc: "Ver, copiar y enviar códigos de acceso por WA" },
    { clave: "eliminar", icono: "🗑️", titulo: "Permitir Eliminar Registros", desc: "Borrar socios, rutinas o evaluaciones (recomendado OFF)" },
    { clave: "sistemaBackup", icono: "💾", titulo: "Backup, Demo y Vaciar Datos", desc: "Exportar/restaurar JSON o limpiar base (recomendado OFF)" }
];

const PLANTILLAS_STAFF_19 = {
    recepcion: {
        label: "🖥️ Recepción",
        permisos: { padronEditar: true, asistencia: true, rutinasEditar: false, evaluacionesEditar: false, cajaVer: true, cajaCobrar: true, consultorio: false, codigos: true, eliminar: false, sistemaBackup: false }
    },
    profe: {
        label: "🏋️ Profe / Entrenador",
        permisos: { padronEditar: false, asistencia: true, rutinasEditar: true, evaluacionesEditar: true, cajaVer: false, cajaCobrar: false, consultorio: false, codigos: true, eliminar: false, sistemaBackup: false }
    },
    salud: {
        label: "🩺 Salud / Kine",
        permisos: { padronEditar: false, asistencia: false, rutinasEditar: true, evaluacionesEditar: true, cajaVer: false, cajaCobrar: false, consultorio: true, codigos: false, eliminar: false, sistemaBackup: false }
    },
    tesorero: {
        label: "💵 Tesorero / Caja",
        permisos: { padronEditar: false, asistencia: false, rutinasEditar: false, evaluacionesEditar: false, cajaVer: true, cajaCobrar: true, consultorio: false, codigos: false, eliminar: false, sistemaBackup: true }
    },
    lectura: {
        label: "👁️ Solo Lectura",
        permisos: { padronEditar: false, asistencia: false, rutinasEditar: false, evaluacionesEditar: false, cajaVer: false, cajaCobrar: false, consultorio: false, codigos: false, eliminar: false, sistemaBackup: false }
    }
};

function obtenerNivelAdminCDM() {
    const s = obtenerSesionActivaCDM();
    if (!s) return null;
    if (s.rol !== "admin") return "usuario";
    if (s.esSuperAdmin) return "superadmin";
    return s.nivelAdmin === "staff" ? "staff" : "principal";
}

function esAdminPrincipalOSuperCDM() {
    const n = obtenerNivelAdminCDM();
    return n === "superadmin" || n === "principal";
}

function tienePermisoAdminCDM(clavePermiso) {
    const s = obtenerSesionActivaCDM();
    if (!s || s.rol !== "admin") return false;
    if (s.esSuperAdmin || s.nivelAdmin !== "staff") return true;
    return Boolean(s.staffPerfil?.permisos?.[clavePermiso]);
}

function tieneAccesoModuloStaffCDM(modulo) {
    const s = obtenerSesionActivaCDM();
    if (!s || s.rol !== "admin") return false;
    if (s.esSuperAdmin || s.nivelAdmin !== "staff") return true;
    const mods = s.staffPerfil?.alcance?.modulos || ["todos"];
    return mods.includes("todos") || mods.includes(modulo);
}

function obtenerClaveStorageStaff19(claveClub = null) {
    return `cdm_subadmins_v1_${claveClub || obtenerClaveClubActivoCDM()}`;
}

function obtenerClaveStorageAudit19(claveClub = null) {
    return `cdm_auditoria_v1_${claveClub || obtenerClaveClubActivoCDM()}`;
}

function obtenerStaffLocal19(claveClub = null) {
    try { return JSON.parse(localStorage.getItem(obtenerClaveStorageStaff19(claveClub)) || "[]") || []; }
    catch { return []; }
}

function guardarStaffLocal19(lista, claveClub = null) {
    localStorage.setItem(obtenerClaveStorageStaff19(claveClub), JSON.stringify(Array.isArray(lista) ? lista : []));
}

function registrarAuditoriaCDM(accion, detalle = "") {
    const s = obtenerSesionActivaCDM();
    const clave = obtenerClaveClubActivoCDM();
    const entry = {
        id: Date.now(),
        fechaISO: new Date().toISOString(),
        usuario: s?.nombre || "Admin",
        accion,
        detalle
    };
    try {
        const arr = JSON.parse(localStorage.getItem(obtenerClaveStorageAudit19(clave)) || "[]") || [];
        arr.unshift(entry);
        localStorage.setItem(obtenerClaveStorageAudit19(clave), JSON.stringify(arr.slice(0, 100)));
    } catch {}

    if (window.location.protocol !== "file:") {
        fetch("/api/cdm/auditoria", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ claveClub: clave, usuario: entry.usuario, accion, detalle })
        }).catch(() => {});
    }
}

// 1. Sincronizar subAdmins y auditoria al cambiar de comercio
const _origCargarEstadoClub19 = cargarEstadoClubEnLocalStorage;
cargarEstadoClubEnLocalStorage = function (estadoClub, claveClub) {
    _origCargarEstadoClub19.apply(this, arguments);
    const clave = claveClub || estadoClub?.claveClub || CLAVE_CLUB_DEFECTO_CDM;
    if (Array.isArray(estadoClub?.subAdmins)) guardarStaffLocal19(estadoClub.subAdmins, clave);
    if (Array.isArray(estadoClub?.auditoria)) {
        localStorage.setItem(obtenerClaveStorageAudit19(clave), JSON.stringify(estadoClub.auditoria.slice(0, 100)));
    }
};

const _origGuardarSnapshot19 = guardarSnapshotClubActualEnMapaLocal;
guardarSnapshotClubActualEnMapaLocal = function () {
    const mapa = _origGuardarSnapshot19.apply(this, arguments);
    const clave = obtenerClaveClubActivoCDM();
    if (mapa && mapa[clave]) {
        mapa[clave].subAdmins = obtenerStaffLocal19(clave);
        try {
            mapa[clave].auditoria = JSON.parse(localStorage.getItem(obtenerClaveStorageAudit19(clave)) || "[]") || [];
        } catch {}
        localStorage.setItem(STORAGE_MAPA_CLUBES_KEY, JSON.stringify(mapa));
    }
    return mapa;
};

// 2. Login unificado: SuperAdmin + Admin Principal + Sub-Administradores (Staff)
function obtenerPaginaInicialStaff19(staffPerfil, lic) {
    const mods = staffPerfil?.alcance?.modulos || ["todos"];
    if (!mods.includes("todos")) {
        if (mods.includes("gym") && lic?.modulos?.gym) return "gym.html";
        if (mods.includes("futbol") && lic?.modulos?.futbol) return "futbol.html";
        if (mods.includes("hockey") && lic?.modulos?.hockey) return "hockey.html";
    }
    return obtenerPaginaInicialSegunModulos(lic);
}

const _origLoginAdmin19 = iniciarSesionComoAdmin;
iniciarSesionComoAdmin = async function (e) {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    const user = (document.getElementById("inputAdminUser")?.value || "").trim().toLowerCase();
    const pass = (document.getElementById("inputAdminPass")?.value || "").trim();

    if (CREDENCIALES_SUPERADMIN.usuarios.includes(user) && CREDENCIALES_SUPERADMIN.claves.includes(pass)) {
        return _origLoginAdmin19.apply(this, arguments);
    }

    if (window.location.protocol !== "file:") {
        try {
            const resp = await fetch("/api/cdm/auth-admin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usuario: user, clave: pass })
            });
            const data = await resp.json();
            if (resp.status === 403 && data.suspendido) {
                mostrarErrorLogin(data.mensaje || "⚠️ Acceso suspendido.");
                return;
            }
            if (resp.ok && data.ok && data.estado) {
                cargarEstadoClubEnLocalStorage(data.estado, data.claveClub);
                const lic = data.estado.licenciaConfig || obtenerLicenciaConfigCDM();
                const esStaff = data.nivelAdmin === "staff" && data.staffPerfil;

                localStorage.setItem(STORAGE_SESION_KEY, JSON.stringify({
                    rol: "admin",
                    esSuperAdmin: false,
                    nivelAdmin: esStaff ? "staff" : "principal",
                    staffPerfil: esStaff ? data.staffPerfil : null,
                    claveClub: data.claveClub,
                    nombre: esStaff
                        ? `${data.staffPerfil.nombre} (${PLANTILLAS_STAFF_19[data.staffPerfil.rolPlantilla]?.label || "Staff"})`
                        : `Admin • ${lic.nombreEntidad || "Comercio"}`,
                    fechaIngreso: new Date().toISOString()
                }));

                window.location.href = esStaff
                    ? obtenerPaginaInicialStaff19(data.staffPerfil, lic)
                    : obtenerPaginaInicialSegunModulos(lic);
                return;
            }
        } catch {}
    }

    // Fallback offline para sub-administradores guardados en localStorage
    const mapaLocal = obtenerMapaLocalClubesCDM();
    for (const club of Object.values(mapaLocal)) {
        const staffList = Array.isArray(club.subAdmins) ? club.subAdmins : obtenerStaffLocal19(club.claveClub);
        const hit = staffList.find(sa => String(sa.usuario || "").toLowerCase() === user && sa.claveLocal === pass);
        if (hit) {
            if (hit.activo === false) {
                mostrarErrorLogin("🚫 Tu usuario de staff fue pausado por el administrador principal.");
                return;
            }
            cargarEstadoClubEnLocalStorage(club, club.claveClub);
            const lic = club.licenciaConfig || obtenerLicenciaConfigCDM();
            localStorage.setItem(STORAGE_SESION_KEY, JSON.stringify({
                rol: "admin",
                esSuperAdmin: false,
                nivelAdmin: "staff",
                staffPerfil: hit,
                claveClub: club.claveClub,
                nombre: `${hit.nombre} (Staff)`,
                fechaIngreso: new Date().toISOString()
            }));
            window.location.href = obtenerPaginaInicialStaff19(hit, lic);
            return;
        }
    }

    return _origLoginAdmin19.apply(this, arguments);
};

// 3. Blindaje visual (CSS) + Candado de funciones (JS) para Sub-Administradores
function inyectarCSSYCandadoPermisosStaff19() {
    if (!document.getElementById("cdmCssPermisosStaff19")) {
        const st = document.createElement("style");
        st.id = "cdmCssPermisosStaff19";
        st.textContent = `
            body[data-nivel-admin="staff"][data-perm-sistemaBackup="off"] .sidebar-demo-box,
            body[data-nivel-admin="staff"][data-perm-sistemaBackup="off"] .mobile-only-sys-btn,
            body[data-nivel-admin="staff"][data-perm-sistemaBackup="off"] button[onclick*="limpiarTodoElSistema"],
            body[data-nivel-admin="staff"][data-perm-sistemaBackup="off"] button[onclick*="cargarDatosDemoCDM"],
            body[data-nivel-admin="staff"][data-perm-sistemaBackup="off"] button[onclick*="exportarBackupJSON"] {
                display: none !important;
            }
            body[data-nivel-admin="staff"][data-perm-eliminar="off"] button[onclick*="eliminar"]:not([onclick*="cerrarSesion"]),
            body[data-nivel-admin="staff"][data-perm-eliminar="off"] button[onclick*="borrar"]:not([onclick*="cerrarSesion"]),
            body[data-nivel-admin="staff"][data-perm-eliminar="off"] .routine-del-btn {
                display: none !important;
            }
            body[data-nivel-admin="staff"][data-perm-padronEditar="off"] button[onclick*="abrirModalPersona"],
            body[data-nivel-admin="staff"][data-perm-padronEditar="off"] button[onclick*="abrirModalJugador"] {
                display: none !important;
            }
            body[data-nivel-admin="staff"][data-perm-rutinasEditar="off"] button[onclick*="abrirModalCrearRutinaCDM"],
            body[data-nivel-admin="staff"][data-perm-rutinasEditar="off"] button[onclick*="abrirModalNuevoVideoEjercicio"],
            body[data-nivel-admin="staff"][data-perm-rutinasEditar="off"] button[onclick*="abrirModalVideotecaProCDM"],
            body[data-nivel-admin="staff"][data-perm-rutinasEditar="off"] button[onclick*="insertarEjercicioDeVideotecaEnRutina"],
            body[data-nivel-admin="staff"][data-perm-rutinasEditar="off"] #btnAdminSwitchComplejidadTop {
                display: none !important;
            }
            body[data-nivel-admin="staff"][data-perm-asistencia="off"] .check-btn,
            body[data-nivel-admin="staff"][data-perm-asistencia="off"] button[onclick*="abrirModalTomaListaPlantel"],
            body[data-nivel-admin="staff"][data-perm-asistencia="off"] button[onclick*="marcarTodosPresentes"] {
                display: none !important;
            }
            body[data-nivel-admin="staff"][data-perm-cajaVer="off"] .side-link[data-nav="contabilidad"],
            body[data-nivel-admin="staff"][data-perm-cajaVer="off"] #cdmSeccionContabilidadGlobal,
            body[data-nivel-admin="staff"][data-perm-cajaVer="off"] #contenedorResumenCajaGym,
            body[data-nivel-admin="staff"][data-perm-cajaVer="off"] .bento-kpi:has(#gymKpiRecaudacion) {
                display: none !important;
            }
            body[data-nivel-admin="staff"][data-perm-cajaCobrar="off"] button[onclick*="alternarEstadoPago"],
            body[data-nivel-admin="staff"][data-perm-cajaCobrar="off"] button[onclick*="enviarReciboPagoWhatsApp"] {
                display: none !important;
            }
            body[data-nivel-admin="staff"][data-perm-codigos="off"] button[onclick*="abrirModalCodigosAccesoAdmin"],
            body[data-nivel-admin="staff"][data-perm-codigos="off"] #adminBoxCodigoFicha {
                display: none !important;
            }
            body[data-nivel-admin="staff"][data-perm-consultorio="off"] .side-link[data-nav="consultorio"],
            body[data-nivel-admin="staff"][data-perm-consultorio="off"] #cardShowcaseConsultorioPro {
                display: none !important;
            }
        `;
        document.head.appendChild(st);
    }

    const nivel = obtenerNivelAdminCDM();
    if (!document.body || !nivel) return;
    document.body.setAttribute("data-nivel-admin", nivel);

    if (nivel === "staff") {
        CATALOGO_PERMISOS_STAFF_19.forEach(item => {
            document.body.setAttribute(`data-perm-${item.clave}`, tienePermisoAdminCDM(item.clave) ? "on" : "off");
        });
        if (!tienePermisoAdminCDM("cajaVer")) {
            document.body.setAttribute("data-cobranza", "bloqueada");
        }

        // Ocultar módulos fuera del alcance del staff y redirigir si entra por URL directa
        const path = window.location.pathname.toLowerCase();
        const lic = obtenerLicenciaConfigCDM();
        if (!tieneAccesoModuloStaffCDM("futbol")) {
            document.querySelectorAll('.sidebar-nav a[href="futbol.html"], .sports-showcase-grid a[href="futbol.html"]').forEach(el => el.classList.add("hidden"));
            if (path.includes("futbol.html") && !new URLSearchParams(window.location.search).get("deporte")) {
                window.location.replace(obtenerPaginaInicialStaff19(obtenerSesionActivaCDM()?.staffPerfil, lic));
                return;
            }
        }
        if (!tieneAccesoModuloStaffCDM("hockey")) {
            document.querySelectorAll('.sidebar-nav a[href*="hockey.html"], .sports-showcase-grid a[href*="hockey.html"]').forEach(el => el.classList.add("hidden"));
            if (path.includes("hockey.html")) {
                window.location.replace(obtenerPaginaInicialStaff19(obtenerSesionActivaCDM()?.staffPerfil, lic));
                return;
            }
        }
        if (!tieneAccesoModuloStaffCDM("gym")) {
            document.querySelectorAll('.sidebar-nav a[href*="gym.html"], .sports-showcase-grid a[href*="gym.html"]').forEach(el => el.classList.add("hidden"));
            if (path.includes("gym.html")) {
                window.location.replace(obtenerPaginaInicialStaff19(obtenerSesionActivaCDM()?.staffPerfil, lic));
                return;
            }
        }
    }
}

function enlazarCandadosFuncionesStaff19() {
    if (obtenerNivelAdminCDM() !== "staff" || window.__cdmStaffGuardsReady) return;
    window.__cdmStaffGuardsReady = true;

    const proteger = (fnName, permKey, label) => {
        if (typeof window[fnName] !== "function") return;
        const orig = window[fnName];
        window[fnName] = function () {
            if (!tienePermisoAdminCDM(permKey)) {
                if (typeof mostrarToast === "function") mostrarToast(`🔒 No tenés permiso para ${label}.`);
                else alert(`🔒 No tenés permiso para ${label}.`);
                return;
            }
            return orig.apply(this, arguments);
        };
    };

    proteger("limpiarTodoElSistema", "sistemaBackup", "vaciar datos del sistema");
    proteger("exportarBackupJSON", "sistemaBackup", "exportar backups");
    proteger("borrarRutinaGlobal", "eliminar", "eliminar rutinas");
    proteger("eliminarPersonaCDM", "eliminar", "eliminar socios o jugadores");
    proteger("abrirModalPersona", "padronEditar", "crear o editar personas");
    proteger("abrirModalCrearRutinaCDM", "rutinasEditar", "crear rutinas");
    proteger("alternarEstadoPago", "cajaCobrar", "modificar cobros de cuotas");
}

// 4. Botón "👥 Equipo" en Topbar (solo SuperAdmin y Admin Principal del Sistema)
const _origInyectarBarraTopbar19 = inyectarBarraSesionTopbar;
inyectarBarraSesionTopbar = function (sesion) {
    _origInyectarBarraTopbar19.apply(this, arguments);
    const barra = document.getElementById("cdmBarraSesionActiva");
    if (!barra || !sesion || sesion.rol !== "admin") return;

    if (esAdminPrincipalOSuperCDM() && !document.getElementById("btnGestionEquipoStaff19")) {
        const btnEq = document.createElement("button");
        btnEq.type = "button";
        btnEq.id = "btnGestionEquipoStaff19";
        btnEq.className = "btn btn-secondary btn-sm";
        btnEq.onclick = () => abrirModalGestionStaffCDM();
        btnEq.title = "Crear sub-administradores y definir qué puede modificar cada uno";
        btnEq.innerHTML = `<i class="ri-team-line"></i> Equipo`;
        const btnSalir = barra.querySelector('button[onclick*="cerrarSesionCDM"]');
        if (btnSalir) barra.insertBefore(btnEq, btnSalir);
        else barra.appendChild(btnEq);
    } else if (sesion.nivelAdmin === "staff") {
        const badgeAdmin = barra.querySelector(".badge-ok");
        if (badgeAdmin) {
            badgeAdmin.innerHTML = `<i class="ri-user-settings-line"></i> ${sesion.staffPerfil?.nombre || "Staff"}`;
        }
    }
};

// 5. Modal Completo de Gestión de Equipo (Sub-Administradores + Auditoría)
function asegurarModalStaff19() {
    let m = document.getElementById("modalGestionStaffCDM");
    if (!m) {
        m = document.createElement("div");
        m.id = "modalGestionStaffCDM";
        m.className = "modal-backdrop hidden";
        document.body.appendChild(m);
    }
    return m;
}

window.aplicarPlantillaStaffModal19 = function (clavePlantilla) {
    const pl = PLANTILLAS_STAFF_19[clavePlantilla];
    if (!pl) return;
    const inpRol = document.getElementById("stfRolPlantilla19");
    if (inpRol) inpRol.value = clavePlantilla;
    document.querySelectorAll(".stf-chk-perm-19").forEach(chk => {
        const k = chk.dataset.perm;
        if (pl.permisos[k] !== undefined) chk.checked = Boolean(pl.permisos[k]);
    });
    if (typeof mostrarToast === "function") mostrarToast(`⚡ Plantilla "${pl.label}" cargada.`);
};

window.abrirModalGestionStaffCDM = async function (idEditar = null, tabActiva = "equipo") {
    if (!esAdminPrincipalOSuperCDM()) return;
    const clave = obtenerClaveClubActivoCDM();
    const lic = obtenerLicenciaConfigCDM();
    let subAdmins = obtenerStaffLocal19(clave);
    let auditoria = [];

    if (window.location.protocol !== "file:") {
        try {
            const resp = await fetch(`/api/cdm/staff?club=${encodeURIComponent(clave)}`, { cache: "no-store" });
            if (resp.ok) {
                const d = await resp.json();
                if (Array.isArray(d.subAdmins)) {
                    subAdmins = d.subAdmins;
                    guardarStaffLocal19(subAdmins, clave);
                }
                if (Array.isArray(d.auditoria)) auditoria = d.auditoria;
            }
        } catch {}
    }

    const edit = idEditar ? subAdmins.find(s => String(s.id) === String(idEditar)) : null;
    const permsInit = edit?.permisos || PLANTILLAS_STAFF_19.profe.permisos;
    const modsInit = edit?.alcance?.modulos || ["todos"];
    const modal = asegurarModalStaff19();

    modal.innerHTML = `
        <div class="modal-window" style="max-width:840px; text-align:left;">
            <div class="modal-top">
                <div>
                    <span class="badge badge-purple">🛡️ SUB-ADMINISTRADORES Y PERMISOS</span>
                    <h3 style="margin-top:4px;">Equipo de ${lic.nombreEntidad || "este Sistema"}</h3>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('modalGestionStaffCDM').classList.add('hidden')">✕</button>
            </div>

            <div style="display:flex; gap:0.45rem; margin-bottom:0.9rem;">
                <button type="button" class="btn ${tabActiva === "equipo" ? "btn-primary" : "btn-ghost"} btn-sm" onclick="abrirModalGestionStaffCDM(null, 'equipo')">👥 Usuarios Staff (${subAdmins.length})</button>
                <button type="button" class="btn ${tabActiva === "auditoria" ? "btn-primary" : "btn-ghost"} btn-sm" onclick="abrirModalGestionStaffCDM(null, 'auditoria')">📋 Auditoría (${auditoria.length})</button>
            </div>

            ${tabActiva === "auditoria" ? `
                <div class="table-wrap" style="max-height:420px; overflow-y:auto;">
                    <table class="app-table">
                        <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Detalle</th></tr></thead>
                        <tbody>
                            ${auditoria.length ? auditoria.map(a => `
                                <tr>
                                    <td><small>${new Date(a.fechaISO).toLocaleString("es-AR")}</small></td>
                                    <td><b>${a.usuario}</b></td>
                                    <td><span class="badge badge-celeste">${a.accion}</span></td>
                                    <td><small>${a.detalle}</small></td>
                                </tr>
                            `).join("") : `<tr><td colspan="4"><div class="empty-box">Todavía no hay movimientos registrados.</div></td></tr>`}
                        </tbody>
                    </table>
                </div>
            ` : `
                <form onsubmit="guardarSubAdminDesdeModal19(event, '${edit ? edit.id : ""}')" style="background:var(--surface-subtle); border:1.5px solid var(--line-strong); border-radius:16px; padding:1rem; margin-bottom:1rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.4rem; margin-bottom:0.7rem;">
                        <strong style="font-size:0.86rem;">${edit ? `✏️ Editando a ${edit.nombre}` : "➕ Nuevo Sub-Administrador"}</strong>
                        ${edit ? `<button type="button" class="btn btn-ghost btn-sm" onclick="abrirModalGestionStaffCDM(null, 'equipo')">+ Crear otro</button>` : ""}
                    </div>

                    <input type="hidden" id="stfRolPlantilla19" value="${edit?.rolPlantilla || "profe"}">

                    <div class="grid-3" style="margin-bottom:0.75rem;">
                        <div class="field"><label>Nombre y Apellido *</label><input type="text" id="stfNombre19" required value="${(edit?.nombre || "").replace(/"/g, "&quot;")}" placeholder="Ej: Profe Lucas"></div>
                        <div class="field"><label>Usuario de Ingreso *</label><input type="text" id="stfUsuario19" required value="${(edit?.usuario || "").replace(/"/g, "&quot;")}" placeholder="Ej: lucas.gym"></div>
                        <div class="field"><label>${edit ? "Nueva Contraseña (opcional)" : "Contraseña *"}</label><input type="text" id="stfClave19" ${edit ? "" : "required"} placeholder="${edit ? "Dejar vacío para mantener" : "Ej: lucas2026"}"></div>
                    </div>

                    <label style="font-size:0.68rem; font-weight:800; color:var(--ink-500); text-transform:uppercase; display:block; margin-bottom:0.35rem;">1. Plantilla rápida de permisos:</label>
                    <div style="display:flex; gap:0.35rem; flex-wrap:wrap; margin-bottom:0.75rem;">
                        ${Object.entries(PLANTILLAS_STAFF_19).map(([k, pl]) => `
                            <button type="button" class="btn btn-secondary btn-sm" onclick="aplicarPlantillaStaffModal19('${k}')">${pl.label}</button>
                        `).join("")}
                    </div>

                    <label style="font-size:0.68rem; font-weight:800; color:var(--ink-500); text-transform:uppercase; display:block; margin-bottom:0.35rem;">2. Áreas a las que puede entrar:</label>
                    <div style="display:flex; gap:0.45rem; flex-wrap:wrap; margin-bottom:0.8rem;">
                        ${[
                            { k: "todos", l: "🌐 Todas las áreas del sistema" },
                            { k: "gym", l: "🏋️ Gimnasio" },
                            { k: "futbol", l: "⚽ Fútbol" },
                            { k: "hockey", l: "🏑 Hockey" },
                            { k: "consultorio", l: "🩺 Consultorio" }
                        ].map(m => `
                            <label style="display:inline-flex; align-items:center; gap:0.35rem; background:var(--surface-solid); border:1px solid var(--line-strong); padding:0.35rem 0.65rem; border-radius:10px; font-size:0.76rem; font-weight:700; cursor:pointer;">
                                <input type="checkbox" class="stf-chk-mod-19" value="${m.k}" style="width:16px; height:16px; min-height:auto;" ${modsInit.includes(m.k) ? "checked" : ""}>
                                <span>${m.l}</span>
                            </label>
                        `).join("")}
                    </div>

                    <label style="font-size:0.68rem; font-weight:800; color:var(--ink-500); text-transform:uppercase; display:block; margin-bottom:0.35rem;">3. Permisos específicos de actividad:</label>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(225px, 1fr)); gap:0.45rem; margin-bottom:0.85rem;">
                        ${CATALOGO_PERMISOS_STAFF_19.map(it => `
                            <label style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; background:var(--surface-solid); border:1px solid var(--line-strong); border-radius:11px; padding:0.5rem 0.65rem; cursor:pointer;">
                                <div style="min-width:0;">
                                    <strong style="font-size:0.76rem; display:block;">${it.icono} ${it.titulo}</strong>
                                    <small style="font-size:0.65rem; color:var(--ink-500); display:block; line-height:1.2;">${it.desc}</small>
                                </div>
                                <input type="checkbox" class="stf-chk-perm-19" data-perm="${it.clave}" style="width:18px; height:18px; min-height:auto; flex-shrink:0; accent-color:#0284c7;" ${permsInit[it.clave] ? "checked" : ""}>
                            </label>
                        `).join("")}
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                        <label style="display:inline-flex; align-items:center; gap:0.4rem; font-size:0.78rem; font-weight:700; cursor:pointer;">
                            <input type="checkbox" id="stfActivo19" style="width:17px; height:17px; min-height:auto;" ${edit?.activo !== false ? "checked" : ""}>
                            <span>🟢 Usuario Activo</span>
                        </label>
                        <button type="submit" class="btn btn-primary btn-sm">💾 ${edit ? "Guardar Cambios" : "Crear Sub-Administrador"}</button>
                    </div>
                </form>

                <div style="display:flex; flex-direction:column; gap:0.5rem; max-height:240px; overflow-y:auto;">
                    ${subAdmins.length === 0 ? `<div class="empty-box" style="padding:1rem;">Aún no creaste sub-administradores en este sistema.</div>` :
                    subAdmins.map(sa => {
                        const cantPerms = Object.values(sa.permisos || {}).filter(Boolean).length;
                        const labelRol = PLANTILLAS_STAFF_19[sa.rolPlantilla]?.label || "Personalizado";
                        return `
                            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.6rem; flex-wrap:wrap; background:var(--surface-solid); border:1.5px solid var(--line-strong); border-radius:13px; padding:0.65rem 0.85rem;">
                                <div>
                                    <strong style="font-size:0.86rem;">${sa.nombre}</strong>
                                    <span class="badge ${sa.activo !== false ? "badge-ok" : "badge-danger"}" style="margin-left:4px;">${sa.activo !== false ? "Activo" : "Pausado"}</span>
                                    <div style="font-size:0.73rem; color:var(--ink-500); margin-top:2px;">
                                        👤 <b>${sa.usuario}</b> • ${labelRol} • ${cantPerms} permisos • Áreas: ${(sa.alcance?.modulos || ["todos"]).join(", ")}
                                    </div>
                                </div>
                                <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
                                    <button type="button" class="btn btn-secondary btn-sm" onclick="abrirModalGestionStaffCDM('${sa.id}', 'equipo')">✏️ Editar</button>
                                    <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarAccesoStaffWA19('${sa.nombre.replace(/'/g, "\\'")}', '${sa.usuario.replace(/'/g, "\\'")}')" title="Enviar link y usuario por WhatsApp"><i class="ri-whatsapp-line"></i></button>
                                    <button type="button" class="btn btn-danger btn-sm" onclick="eliminarSubAdmin19('${sa.id}')">🗑️</button>
                                </div>
                            </div>
                        `;
                    }).join("")}
                </div>
            `}
        </div>
    `;
    modal.classList.remove("hidden");
};

window.guardarSubAdminDesdeModal19 = async function (e, idEditar = "") {
    e.preventDefault();
    const clave = obtenerClaveClubActivoCDM();
    const nombre = document.getElementById("stfNombre19").value.trim();
    const usuario = document.getElementById("stfUsuario19").value.trim().toLowerCase();
    const claveInput = document.getElementById("stfClave19").value.trim();
    const rolPlantilla = document.getElementById("stfRolPlantilla19")?.value || "personalizado";
    const activo = Boolean(document.getElementById("stfActivo19")?.checked);

    const permisos = {};
    document.querySelectorAll(".stf-chk-perm-19").forEach(c => { permisos[c.dataset.perm] = Boolean(c.checked); });
    const modulos = Array.from(document.querySelectorAll(".stf-chk-mod-19:checked")).map(c => c.value);
    const alcance = { modulos: modulos.length ? modulos : ["todos"], categorias: ["todas"] };
    const staffPayload = { id: idEditar || null, nombre, usuario, clave: claveInput, rolPlantilla, activo, alcance, permisos };

    if (window.location.protocol !== "file:") {
        try {
            const resp = await fetch("/api/cdm/staff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ claveClub: clave, staff: staffPayload, actor: obtenerSesionActivaCDM()?.nombre || "Admin" })
            });
            const data = await resp.json();
            if (!resp.ok || !data.ok) {
                alert("⚠️ " + (data.mensaje || data.error || "No se pudo guardar el usuario."));
                return;
            }
            guardarStaffLocal19(data.subAdmins || [], clave);
            if (typeof mostrarToast === "function") mostrarToast(`✅ Sub-administrador ${nombre} guardado.`);
            abrirModalGestionStaffCDM(null, "equipo");
            return;
        } catch {}
    }

    // Respaldo offline
    const lista = obtenerStaffLocal19(clave);
    const idx = idEditar ? lista.findIndex(s => String(s.id) === String(idEditar)) : -1;
    const reg = { ...staffPayload, id: idEditar || `staff_${Date.now()}`, claveLocal: claveInput || lista[idx]?.claveLocal || "" };
    if (idx >= 0) lista[idx] = reg;
    else lista.unshift(reg);
    guardarStaffLocal19(lista, clave);
    abrirModalGestionStaffCDM(null, "equipo");
};

window.eliminarSubAdmin19 = async function (idStaff) {
    if (!confirm("🗑️ ¿Eliminar definitivamente este sub-administrador?")) return;
    const clave = obtenerClaveClubActivoCDM();
    const actor = encodeURIComponent(obtenerSesionActivaCDM()?.nombre || "Admin");
    if (window.location.protocol !== "file:") {
        try {
            const resp = await fetch(`/api/cdm/staff/${encodeURIComponent(idStaff)}?club=${encodeURIComponent(clave)}&actor=${actor}`, { method: "DELETE" });
            const data = await resp.json();
            if (resp.ok && data.ok) guardarStaffLocal19(data.subAdmins || [], clave);
        } catch {}
    } else {
        guardarStaffLocal19(obtenerStaffLocal19(clave).filter(s => String(s.id) !== String(idStaff)), clave);
    }
    abrirModalGestionStaffCDM(null, "equipo");
};

window.enviarAccesoStaffWA19 = function (nombre, usuario) {
    const lic = obtenerLicenciaConfigCDM();
    const link = `${window.location.origin}/login.html`;
    const msg = `🔑 *ACCESO STAFF — ${(lic.nombreEntidad || "SISTEMA").toUpperCase()}*\nHola *${nombre}*, ya tenés tu cuenta habilitada:\n\n🔗 *Link:* ${link}\n👑 *Solapa:* Admin / Comercio\n• *Usuario:* ${usuario}\n• *Contraseña:* _(la que te pasé por privado)_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
};

document.addEventListener("DOMContentLoaded", () => {
    inyectarCSSYCandadoPermisosStaff19();
    setTimeout(() => {
        inyectarCSSYCandadoPermisosStaff19();
        enlazarCandadosFuncionesStaff19();
    }, 300);
});
// =========================================================================
// 19C. ACCESO SUPERADMIN A SUB-ADMINS Y AUDITORÍA DESDE EL HUB Y EL MODAL DE CADA COMERCIO
//      Pegar al final de js/login.js (debajo del Bloque 19B)
// =========================================================================

window.__cdmClubStaffOverride19 = null;

function resolverInfoComercioStaff19C(claveClub) {
    const clave = String(claveClub || obtenerClaveClubActivoCDM()).trim();
    const mapa = obtenerMapaLocalClubesCDM();
    const lic = mapa[clave]?.licenciaConfig || (clave === obtenerClaveClubActivoCDM() ? obtenerLicenciaConfigCDM() : {});
    return {
        clave,
        nombreEntidad: lic?.nombreEntidad || clave
    };
}

window.cerrarModalGestionStaffCDM19C = function () {
    window.__cdmClubStaffOverride19 = null;
    document.getElementById("modalGestionStaffCDM")?.classList.add("hidden");
};

window.abrirStaffDeComercioDesdeHub19C = function (claveClub, tabInicial = "equipo") {
    if (!claveClub) return;
    window.__cdmClubStaffOverride19 = claveClub;
    abrirModalGestionStaffCDM(null, tabInicial, claveClub);
};

// 1. Extender abrirModalGestionStaffCDM para aceptar cualquier claveClub desde el Hub o el Modal
window.abrirModalGestionStaffCDM = async function (idEditar = null, tabActiva = "equipo", claveClubForzada = null) {
    if (!esAdminPrincipalOSuperCDM()) return;

    const clave = claveClubForzada || window.__cdmClubStaffOverride19 || obtenerClaveClubActivoCDM();
    window.__cdmClubStaffOverride19 = clave;
    const infoClub = resolverInfoComercioStaff19C(clave);

    let subAdmins = obtenerStaffLocal19(clave);
    let auditoria = [];
    try {
        auditoria = JSON.parse(localStorage.getItem(obtenerClaveStorageAudit19(clave)) || "[]") || [];
    } catch {}

    if (window.location.protocol !== "file:") {
        try {
            const resp = await fetch(`/api/cdm/staff?club=${encodeURIComponent(clave)}`, { cache: "no-store" });
            if (resp.ok) {
                const d = await resp.json();
                if (Array.isArray(d.subAdmins)) {
                    subAdmins = d.subAdmins;
                    guardarStaffLocal19(subAdmins, clave);
                }
                if (Array.isArray(d.auditoria)) {
                    auditoria = d.auditoria;
                    localStorage.setItem(obtenerClaveStorageAudit19(clave), JSON.stringify(auditoria.slice(0, 100)));
                }
            }
        } catch {}
    }

    const edit = idEditar ? subAdmins.find(s => String(s.id) === String(idEditar)) : null;
    const permsInit = edit?.permisos || PLANTILLAS_STAFF_19.profe.permisos;
    const modsInit = edit?.alcance?.modulos || ["todos"];
    const modal = asegurarModalStaff19();
    modal.style.zIndex = "1350"; // Por encima del modal de edición del comercio

    const claveEsc = clave.replace(/'/g, "\\'");

    modal.innerHTML = `
        <div class="modal-window" style="max-width:840px; text-align:left;">
            <div class="modal-top">
                <div>
                    <span class="badge badge-purple">🛡️ SUB-ADMINISTRADORES Y AUDITORÍA</span>
                    <h3 style="margin-top:4px;">Equipo de ${infoClub.nombreEntidad}</h3>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalGestionStaffCDM19C()">✕</button>
            </div>

            <div style="display:flex; gap:0.45rem; margin-bottom:0.9rem;">
                <button type="button" class="btn ${tabActiva === "equipo" ? "btn-primary" : "btn-ghost"} btn-sm" onclick="abrirModalGestionStaffCDM(null, 'equipo', '${claveEsc}')">👥 Usuarios Staff (${subAdmins.length})</button>
                <button type="button" class="btn ${tabActiva === "auditoria" ? "btn-primary" : "btn-ghost"} btn-sm" onclick="abrirModalGestionStaffCDM(null, 'auditoria', '${claveEsc}')">📋 Auditoría (${auditoria.length})</button>
            </div>

            ${tabActiva === "auditoria" ? `
                <div class="table-wrap" style="max-height:420px; overflow-y:auto;">
                    <table class="app-table">
                        <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Detalle</th></tr></thead>
                        <tbody>
                            ${auditoria.length ? auditoria.map(a => `
                                <tr>
                                    <td data-label="Fecha"><small>${new Date(a.fechaISO).toLocaleString("es-AR")}</small></td>
                                    <td data-label="Usuario"><b>${a.usuario}</b></td>
                                    <td data-label="Acción"><span class="badge badge-celeste">${a.accion}</span></td>
                                    <td data-label="Detalle"><small>${a.detalle}</small></td>
                                </tr>
                            `).join("") : `<tr><td colspan="4"><div class="empty-box">Todavía no hay movimientos registrados en ${infoClub.nombreEntidad}.</div></td></tr>`}
                        </tbody>
                    </table>
                </div>
            ` : `
                <form onsubmit="guardarSubAdminDesdeModal19(event, '${edit ? edit.id : ""}', '${claveEsc}')" style="background:var(--surface-subtle); border:1.5px solid var(--line-strong); border-radius:16px; padding:1rem; margin-bottom:1rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.4rem; margin-bottom:0.7rem;">
                        <strong style="font-size:0.86rem;">${edit ? `✏️ Editando a ${edit.nombre}` : `➕ Nuevo Sub-Administrador para ${infoClub.nombreEntidad}`}</strong>
                        ${edit ? `<button type="button" class="btn btn-ghost btn-sm" onclick="abrirModalGestionStaffCDM(null, 'equipo', '${claveEsc}')">+ Crear otro</button>` : ""}
                    </div>

                    <input type="hidden" id="stfRolPlantilla19" value="${edit?.rolPlantilla || "profe"}">

                    <div class="grid-3" style="margin-bottom:0.75rem;">
                        <div class="field"><label>Nombre y Apellido *</label><input type="text" id="stfNombre19" required value="${(edit?.nombre || "").replace(/"/g, "&quot;")}" placeholder="Ej: Profe Lucas"></div>
                        <div class="field"><label>Usuario de Ingreso *</label><input type="text" id="stfUsuario19" required value="${(edit?.usuario || "").replace(/"/g, "&quot;")}" placeholder="Ej: lucas.gym"></div>
                        <div class="field"><label>${edit ? "Nueva Contraseña (opcional)" : "Contraseña *"}</label><input type="text" id="stfClave19" ${edit ? "" : "required"} placeholder="${edit ? "Dejar vacío para mantener" : "Ej: lucas2026"}"></div>
                    </div>

                    <label style="font-size:0.68rem; font-weight:800; color:var(--ink-500); text-transform:uppercase; display:block; margin-bottom:0.35rem;">1. Plantilla rápida de permisos:</label>
                    <div style="display:flex; gap:0.35rem; flex-wrap:wrap; margin-bottom:0.75rem;">
                        ${Object.entries(PLANTILLAS_STAFF_19).map(([k, pl]) => `
                            <button type="button" class="btn btn-secondary btn-sm" onclick="aplicarPlantillaStaffModal19('${k}')">${pl.label}</button>
                        `).join("")}
                    </div>

                    <label style="font-size:0.68rem; font-weight:800; color:var(--ink-500); text-transform:uppercase; display:block; margin-bottom:0.35rem;">2. Áreas a las que puede entrar:</label>
                    <div style="display:flex; gap:0.45rem; flex-wrap:wrap; margin-bottom:0.8rem;">
                        ${[
                            { k: "todos", l: "🌐 Todas las áreas" },
                            { k: "gym", l: "🏋️ Gimnasio" },
                            { k: "futbol", l: "⚽ Fútbol" },
                            { k: "hockey", l: "🏑 Hockey" },
                            { k: "consultorio", l: "🩺 Consultorio" }
                        ].map(m => `
                            <label style="display:inline-flex; align-items:center; gap:0.35rem; background:var(--surface-solid); border:1px solid var(--line-strong); padding:0.35rem 0.65rem; border-radius:10px; font-size:0.76rem; font-weight:700; cursor:pointer;">
                                <input type="checkbox" class="stf-chk-mod-19" value="${m.k}" style="width:16px; height:16px; min-height:auto;" ${modsInit.includes(m.k) ? "checked" : ""}>
                                <span>${m.l}</span>
                            </label>
                        `).join("")}
                    </div>

                    <label style="font-size:0.68rem; font-weight:800; color:var(--ink-500); text-transform:uppercase; display:block; margin-bottom:0.35rem;">3. Permisos específicos de actividad:</label>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(225px, 1fr)); gap:0.45rem; margin-bottom:0.85rem;">
                        ${CATALOGO_PERMISOS_STAFF_19.map(it => `
                            <label style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; background:var(--surface-solid); border:1px solid var(--line-strong); border-radius:11px; padding:0.5rem 0.65rem; cursor:pointer;">
                                <div style="min-width:0;">
                                    <strong style="font-size:0.76rem; display:block;">${it.icono} ${it.titulo}</strong>
                                    <small style="font-size:0.65rem; color:var(--ink-500); display:block; line-height:1.2;">${it.desc}</small>
                                </div>
                                <input type="checkbox" class="stf-chk-perm-19" data-perm="${it.clave}" style="width:18px; height:18px; min-height:auto; flex-shrink:0; accent-color:#0284c7;" ${permsInit[it.clave] ? "checked" : ""}>
                            </label>
                        `).join("")}
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                        <label style="display:inline-flex; align-items:center; gap:0.4rem; font-size:0.78rem; font-weight:700; cursor:pointer;">
                            <input type="checkbox" id="stfActivo19" style="width:17px; height:17px; min-height:auto;" ${edit?.activo !== false ? "checked" : ""}>
                            <span>🟢 Usuario Activo</span>
                        </label>
                        <button type="submit" class="btn btn-primary btn-sm">💾 ${edit ? "Guardar Cambios" : "Crear Sub-Administrador"}</button>
                    </div>
                </form>

                <div style="display:flex; flex-direction:column; gap:0.5rem; max-height:240px; overflow-y:auto;">
                    ${subAdmins.length === 0 ? `<div class="empty-box" style="padding:1rem;">Aún no hay sub-administradores en ${infoClub.nombreEntidad}.</div>` :
                    subAdmins.map(sa => {
                        const cantPerms = Object.values(sa.permisos || {}).filter(Boolean).length;
                        const labelRol = PLANTILLAS_STAFF_19[sa.rolPlantilla]?.label || "Personalizado";
                        return `
                            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.6rem; flex-wrap:wrap; background:var(--surface-solid); border:1.5px solid var(--line-strong); border-radius:13px; padding:0.65rem 0.85rem;">
                                <div>
                                    <strong style="font-size:0.86rem;">${sa.nombre}</strong>
                                    <span class="badge ${sa.activo !== false ? "badge-ok" : "badge-danger"}" style="margin-left:4px;">${sa.activo !== false ? "Activo" : "Pausado"}</span>
                                    <div style="font-size:0.73rem; color:var(--ink-500); margin-top:2px;">
                                        👤 <b>${sa.usuario}</b> • ${labelRol} • ${cantPerms} permisos • Áreas: ${(sa.alcance?.modulos || ["todos"]).join(", ")}
                                    </div>
                                </div>
                                <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
                                    <button type="button" class="btn btn-secondary btn-sm" onclick="abrirModalGestionStaffCDM('${sa.id}', 'equipo', '${claveEsc}')">✏️ Editar</button>
                                    <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarAccesoStaffWA19('${sa.nombre.replace(/'/g, "\\'")}', '${sa.usuario.replace(/'/g, "\\'")}', '${claveEsc}')" title="Enviar acceso por WhatsApp"><i class="ri-whatsapp-line"></i></button>
                                    <button type="button" class="btn btn-danger btn-sm" onclick="eliminarSubAdmin19('${sa.id}', '${claveEsc}')">🗑️</button>
                                </div>
                            </div>
                        `;
                    }).join("")}
                </div>
            `}
        </div>
    `;
    modal.classList.remove("hidden");
};

window.guardarSubAdminDesdeModal19 = async function (e, idEditar = "", claveClubForzada = null) {
    e.preventDefault();
    const clave = claveClubForzada || window.__cdmClubStaffOverride19 || obtenerClaveClubActivoCDM();
    const nombre = document.getElementById("stfNombre19").value.trim();
    const usuario = document.getElementById("stfUsuario19").value.trim().toLowerCase();
    const claveInput = document.getElementById("stfClave19").value.trim();
    const rolPlantilla = document.getElementById("stfRolPlantilla19")?.value || "personalizado";
    const activo = Boolean(document.getElementById("stfActivo19")?.checked);

    const permisos = {};
    document.querySelectorAll(".stf-chk-perm-19").forEach(c => { permisos[c.dataset.perm] = Boolean(c.checked); });
    const modulos = Array.from(document.querySelectorAll(".stf-chk-mod-19:checked")).map(c => c.value);
    const alcance = { modulos: modulos.length ? modulos : ["todos"], categorias: ["todas"] };
    const staffPayload = { id: idEditar || null, nombre, usuario, clave: claveInput, rolPlantilla, activo, alcance, permisos };

    if (window.location.protocol !== "file:") {
        try {
            const resp = await fetch("/api/cdm/staff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ claveClub: clave, staff: staffPayload, actor: obtenerSesionActivaCDM()?.nombre || "SuperAdmin" })
            });
            const data = await resp.json();
            if (!resp.ok || !data.ok) {
                alert("⚠️ " + (data.mensaje || data.error || "No se pudo guardar el usuario."));
                return;
            }
            guardarStaffLocal19(data.subAdmins || [], clave);
            if (typeof mostrarToast === "function") mostrarToast(`✅ Sub-administrador ${nombre} guardado.`);
            abrirModalGestionStaffCDM(null, "equipo", clave);
            return;
        } catch {}
    }

    const lista = obtenerStaffLocal19(clave);
    const idx = idEditar ? lista.findIndex(s => String(s.id) === String(idEditar)) : -1;
    const reg = { ...staffPayload, id: idEditar || `staff_${Date.now()}`, claveLocal: claveInput || lista[idx]?.claveLocal || "" };
    if (idx >= 0) lista[idx] = reg;
    else lista.unshift(reg);
    guardarStaffLocal19(lista, clave);
    abrirModalGestionStaffCDM(null, "equipo", clave);
};

window.eliminarSubAdmin19 = async function (idStaff, claveClubForzada = null) {
    if (!confirm("🗑️ ¿Eliminar definitivamente este sub-administrador?")) return;
    const clave = claveClubForzada || window.__cdmClubStaffOverride19 || obtenerClaveClubActivoCDM();
    const actor = encodeURIComponent(obtenerSesionActivaCDM()?.nombre || "SuperAdmin");
    if (window.location.protocol !== "file:") {
        try {
            const resp = await fetch(`/api/cdm/staff/${encodeURIComponent(idStaff)}?club=${encodeURIComponent(clave)}&actor=${actor}`, { method: "DELETE" });
            const data = await resp.json();
            if (resp.ok && data.ok) guardarStaffLocal19(data.subAdmins || [], clave);
        } catch {}
    } else {
        guardarStaffLocal19(obtenerStaffLocal19(clave).filter(s => String(s.id) !== String(idStaff)), clave);
    }
    abrirModalGestionStaffCDM(null, "equipo", clave);
};

window.enviarAccesoStaffWA19 = function (nombre, usuario, claveClubForzada = null) {
    const infoClub = resolverInfoComercioStaff19C(claveClubForzada || window.__cdmClubStaffOverride19);
    const link = `${window.location.origin}/login.html`;
    const msg = `🔑 *ACCESO STAFF — ${infoClub.nombreEntidad.toUpperCase()}*\nHola *${nombre}*, ya tenés tu cuenta habilitada:\n\n🔗 *Link:* ${link}\n👑 *Solapa:* Admin / Comercio\n• *Usuario:* ${usuario}\n• *Contraseña:* _(la que te pasé por privado)_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
};

// 2. Inyectar sección "Equipo / Sub-Admins y Auditoría" DENTRO del Modal de Edición de cada Comercio
const _origAbrirModalComercio19C = abrirModalCrearOEditarComercio;
abrirModalCrearOEditarComercio = async function (claveClubEditar = null) {
    await _origAbrirModalComercio19C.apply(this, arguments);
    if (!claveClubEditar) return; // Solo para comercios ya creados

    const modal = document.getElementById("modalSuperAdminCDM");
    const form = modal?.querySelector("form");
    if (!form || document.getElementById("bloqueStaffYAuditoriaModalComercio19C")) return;

    const lista = await obtenerListaCompletaComerciosCDM();
    const item = lista.find(x => x.claveClub === claveClubEditar);
    const cantStaff = item?.cantidadStaff ?? obtenerStaffLocal19(claveClubEditar).filter(s => s.activo !== false).length;
    const claveEsc = claveClubEditar.replace(/'/g, "\\'");

    const box = document.createElement("div");
    box.id = "bloqueStaffYAuditoriaModalComercio19C";
    box.style = "background:var(--purple-bg, #eef2ff); border:1.5px solid rgba(99,102,241,0.35); border-radius:16px; padding:0.9rem 1rem; margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center; gap:0.75rem; flex-wrap:wrap;";
    box.innerHTML = `
        <div>
            <strong style="font-size:0.82rem; color:var(--purple-ink, #4338ca); display:block;">
                🛡️ Sub-Administradores (Staff) y Auditoría de este Comercio
            </strong>
            <small style="font-size:0.73rem; color:var(--ink-600, #475569);">
                ${cantStaff} usuario(s) de staff activo(s). Podés administrar permisos o revisar el historial sin entrar al comercio.
            </small>
        </div>
        <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
            <button type="button" class="btn btn-primary btn-sm" style="background:#6366f1; border-color:#4f46e5;" onclick="abrirStaffDeComercioDesdeHub19C('${claveEsc}', 'equipo')">
                <i class="ri-team-line"></i> Ver / Editar Staff (${cantStaff})
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="abrirStaffDeComercioDesdeHub19C('${claveEsc}', 'auditoria')">
                <i class="ri-history-line"></i> Ver Auditoría
            </button>
        </div>
    `;

    const pie = form.lastElementChild;
    if (pie) pie.insertAdjacentElement("beforebegin", box);
    else form.appendChild(box);
};

// 3. Inyectar accesos directos "👥 Staff" y "📋 Auditoría" en cada tarjeta del Hub SuperAdmin
const _origMostrarHub19C = mostrarHubSelectorDeComercios;
mostrarHubSelectorDeComercios = async function () {
    await _origMostrarHub19C.apply(this, arguments);
    const lista = await obtenerListaCompletaComerciosCDM();
    const cards = document.querySelectorAll("#gridTarjetasComerciosHub .hub-comercio-card");

    cards.forEach((card, idx) => {
        const item = lista[idx];
        if (!item || !item.claveClub || card.querySelector(".hub-staff-row-19c")) return;

        const pieBotones = card.lastElementChild;
        if (!pieBotones) return;

        const cantStaff = item.cantidadStaff ?? obtenerStaffLocal19(item.claveClub).filter(s => s.activo !== false).length;
        const claveEsc = item.claveClub.replace(/'/g, "\\'");

        const filaStaff = document.createElement("div");
        filaStaff.className = "hub-staff-row-19c";
        filaStaff.style = "display:flex; gap:0.35rem;";
        filaStaff.innerHTML = `
            <button type="button" class="btn btn-ghost btn-sm" style="flex:1; font-size:0.71rem; min-height:29px; border-color:rgba(99,102,241,0.35); color:#4338ca;" onclick="abrirStaffDeComercioDesdeHub19C('${claveEsc}', 'equipo')">
                👥 Staff (${cantStaff})
            </button>
            <button type="button" class="btn btn-ghost btn-sm" style="flex:1; font-size:0.71rem; min-height:29px;" onclick="abrirStaffDeComercioDesdeHub19C('${claveEsc}', 'auditoria')">
                📋 Auditoría
            </button>
        `;
        pieBotones.appendChild(filaStaff);
    });
};
// =========================================================================
// 20. INTERRUPTOR POR COMERCIO: WHATSAPP AUTOMÁTICO 24HS (CLOUD API)
//     Pegar al final de js/login.js (debajo del Bloque 19C)
// =========================================================================

if (typeof FUNCIONES_DEFECTO_SUPERADMIN_14 !== "undefined") {
    FUNCIONES_DEFECTO_SUPERADMIN_14.general.whatsappAuto24h = false;
}

const _origNormalizarFunc20 = typeof normalizarFuncionesLicencia14 === "function" ? normalizarFuncionesLicencia14 : null;
normalizarFuncionesLicencia14 = function (lic = {}) {
    const base = _origNormalizarFunc20 ? _origNormalizarFunc20(lic) : { salud: {}, deporte: {}, general: {} };
    const raw = (lic && typeof lic.funciones === "object" && lic.funciones) ? lic.funciones : {};
    const autoOn = raw.general?.whatsappAuto24h !== undefined
        ? Boolean(raw.general.whatsappAuto24h)
        : Boolean(lic?.whatsappAuto24h);
    base.general.whatsappAuto24h = autoOn;
    return base;
};

const _origAbrirModalComercio20 = abrirModalCrearOEditarComercio;
abrirModalCrearOEditarComercio = async function (claveClubEditar = null) {
    await _origAbrirModalComercio20.apply(this, arguments);
    const panel = document.getElementById("panelInterruptoresGranulares14");
    if (!panel || panel.querySelector('[data-clave="whatsappAuto24h"]')) return;

    const lista = await obtenerListaCompletaComerciosCDM();
    const existente = claveClubEditar ? lista.find(x => x.claveClub === claveClubEditar) : null;
    const lic = existente?.licenciaConfig || {};
    const f = normalizarFuncionesLicencia14(lic);

    const bloqueGen = Array.from(panel.children).find(el =>
        el.tagName === "DIV" && el.querySelector('.mc-feat-switch-14[data-grupo="general"]')
    );
    if (!bloqueGen) return;

    bloqueGen.style.gridTemplateColumns = "repeat(auto-fit, minmax(220px, 1fr))";
    bloqueGen.insertAdjacentHTML("beforeend", `
        <label style="display:flex; align-items:flex-start; justify-content:space-between; gap:0.55rem; background:#ecfdf5; border:1.5px solid #10b981; border-radius:11px; padding:0.5rem 0.65rem; cursor:pointer;">
            <div style="min-width:0;">
                <strong style="font-size:0.77rem; color:#065f46; display:block; line-height:1.2;">🤖 WhatsApp Automático 24hs</strong>
                <small style="font-size:0.66rem; color:#047857; display:block; margin-top:2px; line-height:1.25;">Envío automático sin intervención (costo adicional en plan). Apagado = envío manual gratis.</small>
            </div>
            <input type="checkbox" class="mc-feat-switch-14" data-grupo="general" data-clave="whatsappAuto24h"
                style="width:18px; height:18px; min-height:auto; flex-shrink:0; margin-top:2px; accent-color:#10b981;"
                ${f.general.whatsappAuto24h ? "checked" : ""}>
        </label>
    `);
};

const _origGuardarComercio20 = guardarComercioDesdeModal;
guardarComercioDesdeModal = async function (e, claveClubExistente = "") {
    const swAuto = document.querySelector('.mc-feat-switch-14[data-grupo="general"][data-clave="whatsappAuto24h"]');
    const autoVal = Boolean(swAuto?.checked);
    const nombreInput = (document.getElementById("mcNombreEntidad")?.value || "").trim().toLowerCase();

    await _origGuardarComercio20.apply(this, arguments);

    const mapa = obtenerMapaLocalClubesCDM();
    let claveTarget = claveClubExistente;
    if (!claveTarget && nombreInput) {
        const match = Object.values(mapa).find(c => (c.licenciaConfig?.nombreEntidad || "").toLowerCase() === nombreInput);
        if (match) claveTarget = match.claveClub;
    }

    if (claveTarget && mapa[claveTarget]?.licenciaConfig) {
        mapa[claveTarget].licenciaConfig.whatsappAuto24h = autoVal;
        if (!mapa[claveTarget].licenciaConfig.funciones) mapa[claveTarget].licenciaConfig.funciones = {};
        if (!mapa[claveTarget].licenciaConfig.funciones.general) mapa[claveTarget].licenciaConfig.funciones.general = {};
        mapa[claveTarget].licenciaConfig.funciones.general.whatsappAuto24h = autoVal;
        localStorage.setItem(STORAGE_MAPA_CLUBES_KEY, JSON.stringify(mapa));

        if (obtenerClaveClubActivoCDM() === claveTarget) {
            localStorage.setItem(STORAGE_LICENCIA_KEY, JSON.stringify(mapa[claveTarget].licenciaConfig));
        }
    }
};
// =========================================================================
// 21. OCULTAR CAJA "SISTEMA Y BACKUP / CARGAR DEMO" + BLINDAJE DE MARCA/LOGO
//     + POP-UP DE NOTAS RÁPIDAS AL INICIO (DESACTIVABLE, SIN OBSERVERS)
//     Reemplazar por completo el Bloque 21 anterior al final de js/login.js
// =========================================================================

(function () {
    // ---------------------------------------------------------------------
    // A) OCULTAR TODA LA BARRA INFERIOR DE DEMO/BACKUP POR CSS (CERO CPU)
    // ---------------------------------------------------------------------
    if (!document.getElementById("cdmCssHideDemoYPopupNotas21")) {
        const st = document.createElement("style");
        st.id = "cdmCssHideDemoYPopupNotas21";
        st.textContent = `
            .sidebar-demo-box,
            .mobile-only-sys-btn,
            button[onclick*="cargarDatosDemoCDM"],
            button[onclick*="cargarDatosDemo"],
            button[onclick*="abrirModalSistemaMovilCDM"] {
                display: none !important;
            }
            .pn21-list {
                display: flex;
                flex-direction: column;
                gap: 0.45rem;
                max-height: 290px;
                overflow-y: auto;
                margin-bottom: 0.85rem;
            }
            .pn21-item {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 0.6rem;
                background: var(--surface-subtle, #f8fafc);
                border: 1.5px solid var(--line, #e2e8f0);
                border-left: 4px solid #f59e0b;
                border-radius: 12px;
                padding: 0.6rem 0.75rem;
                font-size: 0.83rem;
            }
            .pn21-item.done {
                border-left-color: #10b981;
                opacity: 0.68;
                text-decoration: line-through;
            }
            .pn21-item-left {
                display: flex;
                align-items: flex-start;
                gap: 0.55rem;
                flex: 1;
                min-width: 0;
                cursor: pointer;
            }
            .pn21-item-left input[type="checkbox"] {
                width: 18px;
                height: 18px;
                min-height: auto !important;
                margin-top: 2px;
                accent-color: #10b981;
                flex-shrink: 0;
                cursor: pointer;
            }
            .pn21-add-row {
                display: flex;
                gap: 0.45rem;
                margin-bottom: 0.85rem;
            }
            .pn21-foot {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 0.65rem;
                flex-wrap: wrap;
                padding-top: 0.75rem;
                border-top: 1px solid var(--line, #e2e8f0);
            }
        `;
        document.head.appendChild(st);
    }

    // ---------------------------------------------------------------------
    // B) GARANTIZAR MARCA Y LOGO PROPIOS DEL COMERCIO (NUNCA "CDM" EN OTROS)
    // ---------------------------------------------------------------------
    function reforzarMarcaYLogoComercio21() {
        const path = window.location.pathname.toLowerCase();
        if (path.includes("login.html") || document.body?.classList.contains("login-page")) return;

        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : null;
        if (!lic) return;

        const claveActiva = typeof obtenerClaveClubActivoCDM === "function"
            ? obtenerClaveClubActivoCDM()
            : CLAVE_CLUB_DEFECTO_CDM;

        const nombre = (lic.nombreEntidad || "PLATAFORMA OFICIAL").toUpperCase();
        const sub = lic.subtituloEntidad || "Panel Oficial";

        document.querySelectorAll(".sidebar-brand-text h1").forEach(el => {
            if (el.innerText !== nombre) el.innerText = nombre;
        });
        document.querySelectorAll(".sidebar-brand-text span").forEach(el => {
            if (el.innerText !== sub) el.innerText = sub;
        });

        let logoFinal = lic.logoUrl || "";
        if (typeof resolverLogoEfectivoComercio13 === "function") {
            logoFinal = resolverLogoEfectivoComercio13(lic, claveActiva);
        }
        if (logoFinal) {
            document.querySelectorAll(".sidebar-brand img").forEach(img => {
                if (img.src !== logoFinal) {
                    img.onerror = null;
                    img.src = logoFinal;
                }
            });
        }
    }

    // ---------------------------------------------------------------------
    // C) POP-UP DE NOTAS RÁPIDAS AL ABRIR EL SISTEMA (DESACTIVABLE)
    // ---------------------------------------------------------------------
    const STORAGE_NOTAS_KEY = "cdm_notas_rapidas_pro_v23";

    function clubKey21() {
        return typeof obtenerClaveClubActivoCDM === "function"
            ? obtenerClaveClubActivoCDM()
            : "cdm_adelia_maria_principal";
    }

    function prefAutoKey21() {
        return `cdm_popup_notas_auto_v1_${clubKey21()}`;
    }

    function sesionVistoKey21() {
        return `cdm_popup_notas_visto_v1_${clubKey21()}`;
    }

    function estaPopupNotasActivo21() {
        return localStorage.getItem(prefAutoKey21()) !== "off";
    }

    function leerNotasRapidas21() {
        try {
            const mapa = JSON.parse(localStorage.getItem(STORAGE_NOTAS_KEY) || "{}") || {};
            const arr = mapa[clubKey21()];
            return Array.isArray(arr) ? arr : [];
        } catch {
            return [];
        }
    }

    function guardarNotasRapidas21(lista) {
        try {
            const mapa = JSON.parse(localStorage.getItem(STORAGE_NOTAS_KEY) || "{}") || {};
            mapa[clubKey21()] = Array.isArray(lista) ? lista : [];
            localStorage.setItem(STORAGE_NOTAS_KEY, JSON.stringify(mapa));
        } catch {}
        actualizarBadgeNotasTopbar21();
    }

    function textoNota21(n) {
        if (typeof n === "string") return n;
        return String(n?.texto || n?.contenido || n?.titulo || n?.nota || "").trim();
    }

    function notaHecha21(n) {
        return Boolean(n && typeof n === "object" && (n.completada || n.hecha || n.done || n.resuelta));
    }

    function esc21(s) {
        return String(s ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function actualizarBadgeNotasTopbar21() {
        const pendientes = leerNotasRapidas21().filter(n => !notaHecha21(n)).length;
        const botones = Array.from(document.querySelectorAll(".app-topbar button"));
        const btnNotas = botones.find(b => /notas/i.test(b.textContent || "") && b.id !== "btnToggleAutoNotas21");
        if (btnNotas) {
            const badge = btnNotas.querySelector("span:last-child, .badge");
            if (badge && /^\d+$/.test((badge.textContent || "").trim())) {
                badge.textContent = String(pendientes);
            }
        }
        const btnBell = document.getElementById("btnToggleAutoNotas21");
        if (btnBell) {
            const on = estaPopupNotasActivo21();
            btnBell.innerHTML = on ? "🔔" : "🔕";
            btnBell.title = on
                ? "Repaso de Notas al iniciar: ACTIVADO (tocá para ver o desactivar)"
                : "Repaso de Notas al iniciar: DESACTIVADO (tocá para ver o reactivar)";
        }
    }

    function asegurarModalPopupNotas21() {
        let m = document.getElementById("modalPopupNotasInicioCDM21");
        if (!m) {
            m = document.createElement("div");
            m.id = "modalPopupNotasInicioCDM21";
            m.className = "modal-backdrop hidden";
            m.style.zIndex = "1400";
            m.onclick = (e) => { if (e.target === m) cerrarPopupNotasInicio21(); };
            document.body.appendChild(m);
        }
        return m;
    }

    window.cerrarPopupNotasInicio21 = function () {
        document.getElementById("modalPopupNotasInicioCDM21")?.classList.add("hidden");
    };

    window.cambiarPreferenciaPopupNotas21 = function (activo) {
        localStorage.setItem(prefAutoKey21(), activo ? "on" : "off");
        actualizarBadgeNotasTopbar21();
        if (typeof mostrarToast === "function") {
            mostrarToast(activo
                ? "🔔 Repaso automático de Notas Rápidas ACTIVADO al abrir el sistema."
                : "🔕 Pop-up al inicio DESACTIVADO. Podés reactivarlo desde el ícono 🔕 junto a Notas.");
        }
    };

    window.toggleNotaDesdePopup21 = function (idx) {
        const lista = leerNotasRapidas21();
        const item = lista[idx];
        if (!item) return;
        if (typeof item === "string") {
            lista[idx] = { id: Date.now(), texto: item, completada: true, hecha: true, fecha: new Date().toLocaleDateString("es-AR") };
        } else {
            const nuevo = !notaHecha21(item);
            item.completada = nuevo;
            item.hecha = nuevo;
        }
        guardarNotasRapidas21(lista);
        abrirPopupNotasInicioCDM(true);
    };

    window.eliminarNotaDesdePopup21 = function (idx) {
        const lista = leerNotasRapidas21();
        lista.splice(idx, 1);
        guardarNotasRapidas21(lista);
        abrirPopupNotasInicioCDM(true);
    };

    window.agregarNotaDesdePopup21 = function (e) {
        if (e && typeof e.preventDefault === "function") e.preventDefault();
        const inp = document.getElementById("inpNuevaNotaPopup21");
        const txt = (inp?.value || "").trim();
        if (!txt) return;

        const lista = leerNotasRapidas21();
        lista.unshift({
            id: Date.now(),
            texto: txt,
            titulo: txt,
            completada: false,
            hecha: false,
            prioridad: "normal",
            fecha: new Date().toLocaleDateString("es-AR")
        });
        guardarNotasRapidas21(lista);
        abrirPopupNotasInicioCDM(true);
    };

    window.abrirPopupNotasInicioCDM = function (forzado = false) {
        const path = window.location.pathname.toLowerCase();
        if (path.includes("login.html") || document.body?.classList.contains("login-page")) return;

        const ses = typeof obtenerSesionActivaCDM === "function" ? obtenerSesionActivaCDM() : null;
        if (!ses || ses.rol !== "admin") return;

        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        if (lic?.funciones?.general?.notasRapidas === false) return;

        if (!forzado) {
            if (!estaPopupNotasActivo21()) return;
            if (sessionStorage.getItem(sesionVistoKey21()) === "1") return;
        }
        sessionStorage.setItem(sesionVistoKey21(), "1");

        const lista = leerNotasRapidas21();
        const pendientes = lista.filter(n => !notaHecha21(n)).length;
        const autoOn = estaPopupNotasActivo21();
        const modal = asegurarModalPopupNotas21();

        modal.innerHTML = `
            <div class="modal-window" style="max-width:540px; text-align:left;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-warn">📝 REPASO AL INICIAR • ${pendientes} PENDIENTE(S)</span>
                        <h3 style="margin-top:4px;">Notas Rápidas — ${esc21(lic.nombreEntidad || "Mi Espacio")}</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarPopupNotasInicio21()">✕</button>
                </div>

                <form class="pn21-add-row" onsubmit="agregarNotaDesdePopup21(event)">
                    <input type="text" id="inpNuevaNotaPopup21" placeholder="Escribir nota rápida para hoy..." style="flex:1; min-height:36px;">
                    <button type="submit" class="btn btn-primary btn-sm">+ Anotar</button>
                </form>

                <div class="pn21-list">
                    ${lista.length === 0 ? `
                        <div class="empty-box" style="padding:1.1rem; font-size:0.82rem;">
                            ✨ No tenés notas rápidas pendientes para repasar hoy.
                        </div>
                    ` : lista.map((n, idx) => {
                        const done = notaHecha21(n);
                        return `
                            <div class="pn21-item ${done ? "done" : ""}">
                                <label class="pn21-item-left">
                                    <input type="checkbox" ${done ? "checked" : ""} onchange="toggleNotaDesdePopup21(${idx})">
                                    <div style="min-width:0;">
                                        <div style="font-weight:600; color:var(--ink-900); word-break:break-word;">${esc21(textoNota21(n))}</div>
                                        ${n?.fecha ? `<small style="font-size:0.69rem; color:var(--ink-500);">${esc21(n.fecha)}</small>` : ""}
                                    </div>
                                </label>
                                <button type="button" class="btn btn-danger btn-sm" style="min-height:26px; padding:0 7px; font-size:0.72rem;" onclick="eliminarNotaDesdePopup21(${idx})" title="Borrar nota">🗑️</button>
                            </div>
                        `;
                    }).join("")}
                </div>

                <div class="pn21-foot">
                    <label style="display:inline-flex; align-items:center; gap:0.45rem; font-size:0.77rem; font-weight:700; color:var(--ink-700); cursor:pointer;">
                        <input type="checkbox" style="width:17px; height:17px; min-height:auto; accent-color:#0284c7;" ${autoOn ? "checked" : ""} onchange="cambiarPreferenciaPopupNotas21(this.checked)">
                        <span>Mostrar este pop-up al abrir el sistema</span>
                    </label>
                    <button type="button" class="btn btn-primary btn-sm" onclick="cerrarPopupNotasInicio21()">Entendido ✓</button>
                </div>
            </div>
        `;
        modal.classList.remove("hidden");
    };

    function inyectarBotonBellNotasTopbar21() {
        const path = window.location.pathname.toLowerCase();
        if (path.includes("login.html") || document.body?.classList.contains("login-page")) return;
        const ses = typeof obtenerSesionActivaCDM === "function" ? obtenerSesionActivaCDM() : null;
        if (!ses || ses.rol !== "admin") return;

        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        if (lic?.funciones?.general?.notasRapidas === false) return;

        if (document.getElementById("btnToggleAutoNotas21")) {
            actualizarBadgeNotasTopbar21();
            return;
        }

        const botones = Array.from(document.querySelectorAll(".app-topbar button"));
        const btnNotas = botones.find(b => /notas/i.test(b.textContent || ""));
        if (!btnNotas || !btnNotas.parentNode) return;

        const btnBell = document.createElement("button");
        btnBell.type = "button";
        btnBell.id = "btnToggleAutoNotas21";
        btnBell.className = "btn btn-ghost btn-sm";
        btnBell.style.cssText = "padding:0 0.5rem; min-height:32px; font-size:0.85rem;";
        btnBell.onclick = () => abrirPopupNotasInicioCDM(true);
        btnNotas.insertAdjacentElement("afterend", btnBell);
        actualizarBadgeNotasTopbar21();
    }

    if (typeof window.iniciarSesionComoAdmin === "function") {
        const _origLogin21 = window.iniciarSesionComoAdmin;
        window.iniciarSesionComoAdmin = function () {
            Object.keys(sessionStorage).forEach(k => {
                if (k.startsWith("cdm_popup_notas_visto_v1_")) sessionStorage.removeItem(k);
            });
            return _origLogin21.apply(this, arguments);
        };
    }

    if (typeof window.entrarAComercioDesdeHub === "function") {
        const _origHub21 = window.entrarAComercioDesdeHub;
        window.entrarAComercioDesdeHub = function (claveClub) {
            if (claveClub) sessionStorage.removeItem(`cdm_popup_notas_visto_v1_${claveClub}`);
            return _origHub21.apply(this, arguments);
        };
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") cerrarPopupNotasInicio21();
    });

    document.addEventListener("DOMContentLoaded", () => {
        reforzarMarcaYLogoComercio21();
        setTimeout(reforzarMarcaYLogoComercio21, 200);
        setTimeout(reforzarMarcaYLogoComercio21, 750);
        setTimeout(() => {
            inyectarBotonBellNotasTopbar21();
            abrirPopupNotasInicioCDM(false);
        }, 550);
        setTimeout(inyectarBotonBellNotasTopbar21, 1100);
    });
})();
// =========================================================================
// 21. HUELLA DACTILAR / FACE ID (WEBAUTHN) + MODO DEMO vs SISTEMA REAL PRIVADO
//     Encapsulado para evitar colisiones con bloques previos de login.js
// =========================================================================
(function () {
    const STORAGE_BIO_DEVICE_KEY_21 = "cdm_biometria_dispositivo_v1";

    function b64UrlToUint8_21(str) {
        let s = String(str || "").replace(/-/g, "+").replace(/_/g, "/");
        while (s.length % 4) s += "=";
        const bin = atob(s);
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
    }

    function bufToB64Url_21(buf) {
        const bytes = new Uint8Array(buf);
        let bin = "";
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    }

    function obtenerPerfilesBioDispositivo21() {
        try {
            const arr = JSON.parse(localStorage.getItem(STORAGE_BIO_DEVICE_KEY_21) || "[]");
            return Array.isArray(arr) ? arr : [];
        } catch {
            return [];
        }
    }

    function guardarPerfilBioDispositivo21(perfil) {
        const lista = obtenerPerfilesBioDispositivo21().filter(x => x.credentialId !== perfil.credentialId);
        lista.unshift(perfil);
        localStorage.setItem(STORAGE_BIO_DEVICE_KEY_21, JSON.stringify(lista.slice(0, 5)));
    }

    window.quitarPerfilBioDispositivo21 = function (credentialId) {
        const lista = obtenerPerfilesBioDispositivo21().filter(x => x.credentialId !== credentialId);
        localStorage.setItem(STORAGE_BIO_DEVICE_KEY_21, JSON.stringify(lista));
        renderizarBotonesBioEnLogin21();
    };

    async function soportaBiometriaDispositivo21() {
        try {
            if (!window.PublicKeyCredential || !navigator.credentials) return false;
            if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function") {
                return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            }
            return true;
        } catch {
            return false;
        }
    }

    function sincronizarPacienteEnRegistroUniversal21(pac, claveClub) {
        try {
            const mapa = JSON.parse(localStorage.getItem("cdm_registro_universal_pacientes_v19") || "{}");
            const clave = `id_${pac.id}`;
            mapa[clave] = {
                clave,
                claveClub,
                id: pac.id,
                codigoAcceso: pac.codigoAcceso || `PAC-${pac.id}`,
                nombreCompleto: pac.nombreCompleto || `${pac.apellido || ""}, ${pac.nombre || ""}`.replace(/^,\s*/, "").trim(),
                dni: pac.dni || "",
                telefono: pac.telefono || pac.whatsapp || "",
                especialidad: pac.especialidad || "Consultorio",
                mutual: pac.mutual || pac.obraSocial || "Particular",
                diagnostico: pac.diagnostico || "",
                profesional: pac.profesional || "",
                estudiosClinicos: Array.isArray(pac.estudios) ? pac.estudios : (Array.isArray(pac.estudiosClinicos) ? pac.estudiosClinicos : [])
            };
            localStorage.setItem("cdm_registro_universal_pacientes_v19", JSON.stringify(mapa));
        } catch {}
    }

    // 21.1 Activar Huella / Face ID tras primer login
    window.activarHuellaOFaceIDActual21 = async function () {
        const ses = obtenerSesionActivaCDM();
        if (!ses || !ses.bioEnrollToken) {
            alert("⚠️ Cerrá sesión y volvé a ingresar una vez con tu clave o código para activar la Huella / Face ID.");
            return;
        }
        const soporta = await soportaBiometriaDispositivo21();
        if (!soporta) {
            alert("⚠️ Este dispositivo o navegador no tiene lector de Huella / Face ID disponible (recordá abrir desde HTTPS o localhost).");
            return;
        }

        try {
            const rOpt = await fetch("/api/cdm/webauthn/register-options", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bioEnrollToken: ses.bioEnrollToken })
            });
            const dOpt = await rOpt.json();
            if (!rOpt.ok || !dOpt.ok) {
                alert("❌ " + (dOpt.mensaje || "No se pudo iniciar el registro biométrico."));
                return;
            }

            const opt = dOpt.options;
            const cred = await navigator.credentials.create({
                publicKey: {
                    ...opt,
                    challenge: b64UrlToUint8_21(opt.challenge),
                    user: { ...opt.user, id: b64UrlToUint8_21(opt.user.id) }
                }
            });

            if (!cred || !cred.response || typeof cred.response.getPublicKey !== "function") {
                alert("⚠️ Actualizá tu navegador (Chrome / Safari) para vincular Huella o Face ID.");
                return;
            }

            const rVer = await fetch("/api/cdm/webauthn/register-verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bioEnrollToken: ses.bioEnrollToken,
                    credentialId: cred.id,
                    publicKeySpki: bufToB64Url_21(cred.response.getPublicKey()),
                    alg: typeof cred.response.getPublicKeyAlgorithm === "function" ? cred.response.getPublicKeyAlgorithm() : -7,
                    clientDataJSON: bufToB64Url_21(cred.response.clientDataJSON),
                    dispositivo: navigator.userAgent.slice(0, 60)
                })
            });
            const dVer = await rVer.json();
            if (!rVer.ok || !dVer.ok) {
                alert("❌ " + (dVer.mensaje || "No se pudo verificar la huella."));
                return;
            }

            guardarPerfilBioDispositivo21({
                credentialId: dVer.credentialId,
                claveClub: dVer.claveClub,
                nombre: ses.nombre || dVer.nombre || "Usuario",
                rol: dVer.rol
            });

            if (typeof mostrarToast === "function") {
                mostrarToast("✅ ¡Huella / Face ID activado! La próxima vez entrás con 1 toque.");
            } else {
                alert("✅ ¡Huella / Face ID activado en este dispositivo!");
            }

            const btn = document.getElementById("btnActivarBioTopbar21");
            if (btn) btn.innerHTML = `<i class="ri-fingerprint-line"></i> Huella Activa ✓`;
        } catch (err) {
            if (err && err.name === "NotAllowedError") return;
            alert("❌ Error activando biometría: " + (err?.message || err));
        }
    };

    // 21.2 Ingresar con Huella / Face ID desde login.html
    window.ingresarConHuellaDispositivo21 = async function (credentialId) {
        const perfil = obtenerPerfilesBioDispositivo21().find(x => x.credentialId === credentialId);
        if (!perfil) return;

        try {
            const rOpt = await fetch("/api/cdm/webauthn/login-options", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credentialId: perfil.credentialId, claveClub: perfil.claveClub })
            });
            const dOpt = await rOpt.json();
            if (!rOpt.ok || !dOpt.ok) {
                mostrarErrorLogin(dOpt.mensaje || "❌ No se pudo iniciar ingreso biométrico.");
                return;
            }

            const opt = dOpt.options;
            const assertion = await navigator.credentials.get({
                publicKey: {
                    challenge: b64UrlToUint8_21(opt.challenge),
                    rpId: opt.rpId,
                    allowCredentials: opt.allowCredentials.map(c => ({
                        id: b64UrlToUint8_21(c.id),
                        type: c.type
                    })),
                    userVerification: "required",
                    timeout: opt.timeout || 60000
                }
            });

            const rVer = await fetch("/api/cdm/webauthn/login-verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    credentialId: assertion.id,
                    claveClub: perfil.claveClub,
                    authenticatorData: bufToB64Url_21(assertion.response.authenticatorData),
                    clientDataJSON: bufToB64Url_21(assertion.response.clientDataJSON),
                    signature: bufToB64Url_21(assertion.response.signature)
                })
            });
            const data = await rVer.json();
            if (!rVer.ok || !data.ok) {
                mostrarErrorLogin(data.mensaje || "❌ Validación biométrica rechazada.");
                return;
            }

            cargarEstadoClubEnLocalStorage(data.estado, data.claveClub);
            const lic = data.estado?.licenciaConfig || obtenerLicenciaConfigCDM();

            if (data.rol === "admin") {
                const esStaff = data.nivelAdmin === "staff" && data.staffPerfil;
                localStorage.setItem(STORAGE_SESION_KEY, JSON.stringify({
                    rol: "admin",
                    esSuperAdmin: false,
                    nivelAdmin: esStaff ? "staff" : "principal",
                    staffPerfil: esStaff ? data.staffPerfil : null,
                    claveClub: data.claveClub,
                    bioEnrollToken: data.bioEnrollToken || "",
                    nombre: esStaff ? `${data.staffPerfil.nombre} (Staff)` : `Admin • ${lic.nombreEntidad || "Comercio"}`,
                    fechaIngreso: new Date().toISOString()
                }));
                window.location.href = (esStaff && typeof obtenerPaginaInicialStaff19 === "function")
                    ? obtenerPaginaInicialStaff19(data.staffPerfil, lic)
                    : obtenerPaginaInicialSegunModulos(lic);
                return;
            }

            if (data.esPacienteConsultorio && data.paciente) {
                sincronizarPacienteEnRegistroUniversal21(data.paciente, data.claveClub);
                localStorage.setItem(STORAGE_SESION_KEY, JSON.stringify({
                    rol: "usuario",
                    esPacienteConsultorio: true,
                    clavePaciente: `id_${data.paciente.id}`,
                    personaId: data.paciente.id,
                    dni: data.paciente.dni || "",
                    nombre: data.paciente.nombreCompleto || `${data.paciente.nombre || ""} ${data.paciente.apellido || ""}`.trim(),
                    deporte: data.paciente.especialidad || "Consultorio",
                    categoria: data.paciente.mutual || "Particular",
                    codigo: data.paciente.codigoAcceso || `PAC-${data.paciente.id}`,
                    bioEnrollToken: data.bioEnrollToken || "",
                    fechaIngreso: new Date().toISOString()
                }));
                window.location.href = `jugador.html?id=${encodeURIComponent(data.paciente.id)}&pac=id_${encodeURIComponent(data.paciente.id)}&modo=paciente`;
                return;
            }

            if (data.persona) {
                localStorage.setItem(STORAGE_SESION_KEY, JSON.stringify({
                    rol: "usuario",
                    personaId: data.persona.id,
                    dni: data.persona.dni,
                    nombre: `${data.persona.nombre} ${data.persona.apellido}`,
                    deporte: data.persona.deporte,
                    categoria: data.persona.categoria,
                    codigo: data.persona.codigoAcceso,
                    bioEnrollToken: data.bioEnrollToken || "",
                    fechaIngreso: new Date().toISOString()
                }));
                sessionStorage.setItem("cdm_socio_dni_activo", data.persona.dni || "");
                window.location.href = `jugador.html?id=${data.persona.id}`;
            }
        } catch (err) {
            if (err && err.name === "NotAllowedError") return;
            mostrarErrorLogin("❌ No se pudo completar el ingreso con huella: " + (err?.message || err));
        }
    };

    function renderizarBotonesBioEnLogin21() {
        const formAdmin = document.getElementById("formLoginAdmin");
        const formUser = document.getElementById("formLoginUsuario");
        if (!formAdmin && !formUser) return;

        const perfiles = obtenerPerfilesBioDispositivo21();
        const bioAdmins = perfiles.filter(p => p.rol === "admin");
        const bioUsers = perfiles.filter(p => p.rol !== "admin");

        const montarEnForm = (formEl, idBox, items) => {
            if (!formEl) return;
            document.getElementById(idBox)?.remove();
            if (!items.length) return;

            const box = document.createElement("div");
            box.id = idBox;
            box.style = "margin-top:0.85rem; padding-top:0.8rem; border-top:1px dashed var(--line-strong); display:flex; flex-direction:column; gap:0.45rem;";
            box.innerHTML = items.map(p => `
                <div style="display:flex; gap:0.35rem; align-items:center;">
                    <button type="button" class="btn btn-secondary" style="flex:1; font-weight:700;" onclick="ingresarConHuellaDispositivo21('${p.credentialId}')">
                        <i class="ri-fingerprint-line" style="font-size:1.15rem;"></i> Ingresar con Huella / Face ID (${p.nombre})
                    </button>
                    <button type="button" class="btn btn-ghost btn-sm" title="Quitar huella de este dispositivo" onclick="quitarPerfilBioDispositivo21('${p.credentialId}')">✕</button>
                </div>
            `).join("");
            formEl.appendChild(box);
        };

        montarEnForm(formAdmin, "boxBioLoginAdmin21", bioAdmins);
        montarEnForm(formUser, "boxBioLoginUser21", bioUsers);

        if (formAdmin && !document.getElementById("linkRecuperarClave21")) {
            const link = document.createElement("div");
            link.id = "linkRecuperarClave21";
            link.style = "text-align:center; margin-top:0.7rem;";
            link.innerHTML = `<button type="button" class="btn btn-ghost btn-sm" style="font-size:0.78rem; color:var(--cdm-600);" onclick="abrirModalRecuperarClave21()">🔑 ¿Olvidaste tu contraseña? Recuperala por mail</button>`;
            formAdmin.appendChild(link);
        }
    }

    // 21.3 Modal de Activación Privada (Cuenta Real con código de 6 dígitos por mail)
    window.abrirModalActivacionPrivada21 = function (info) {
        let modal = document.getElementById("modalPrivacidadEmail21");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "modalPrivacidadEmail21";
            modal.className = "modal-backdrop";
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-window" style="max-width:500px; text-align:left;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-ok">🔒 CUENTA REAL — PRIVACIDAD DE DATOS</span>
                        <h3 style="color:var(--ink-900); margin-top:4px;">Configurá tu acceso privado</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('modalPrivacidadEmail21').classList.add('hidden')">✕</button>
                </div>

                <p style="font-size:0.83rem; color:var(--ink-600); margin-bottom:0.9rem; line-height:1.45;">
                    Estás activando <b>${info.nombreEntidad}</b> en modo real. Para proteger tus datos sensibles, creá tu usuario y contraseña definitivos.
                    Validaremos tu correo con un código de 6 dígitos y tu clave provisoria se eliminará automáticamente.
                </p>

                <div style="display:flex; flex-direction:column; gap:0.7rem;">
                    <div class="field">
                        <label>Tu correo electrónico (para recibir el código y recuperar clave) *</label>
                        <input type="email" id="privEmail21" required value="${(info.emailSugerido || "").replace(/"/g, "&quot;")}" placeholder="Ej: tuemail@gmail.com">
                    </div>
                    <div class="field">
                        <label>Nuevo Usuario definitivo *</label>
                        <input type="text" id="privUser21" required value="${(info.usuarioActual || "").replace(/"/g, "&quot;")}" placeholder="Ej: dra.alina">
                    </div>
                    <div class="grid-2">
                        <div class="field">
                            <label>Nueva Contraseña (mín. 6) *</label>
                            <input type="password" id="privPass1_21" required placeholder="••••••••">
                        </div>
                        <div class="field">
                            <label>Repetir Contraseña *</label>
                            <input type="password" id="privPass2_21" required placeholder="••••••••">
                        </div>
                    </div>

                    <button type="button" id="btnEnviarCodPriv21" class="btn btn-secondary" onclick="enviarCodigoPrivacidad21('${info.tokenSetup}')">
                        📧 1. Enviar código de 6 dígitos a mi correo
                    </button>

                    <div id="bloqueCodigoPriv21" class="hidden" style="background:var(--cdm-50); border:1.5px solid var(--line-celeste); border-radius:12px; padding:0.85rem;">
                        <div class="field" style="margin-bottom:0.65rem;">
                            <label>Ingresá el código de 6 dígitos que llegó a tu mail *</label>
                            <input type="text" id="privCodigo21" maxlength="6" placeholder="123456" style="font-size:1.25rem; text-align:center; letter-spacing:6px; font-weight:800;">
                        </div>
                        <button type="button" id="btnConfirmarPriv21" class="btn btn-primary" style="width:100%;" onclick="confirmarActivacionPrivada21('${info.tokenSetup}')">
                            🔒 2. Validar código y entrar a mi sistema
                        </button>
                    </div>

                    <div id="msgPrivEstado21" style="font-size:0.8rem; font-weight:700;"></div>
                </div>
            </div>
        `;
        modal.classList.remove("hidden");
    };

    window.enviarCodigoPrivacidad21 = async function (tokenSetup) {
        const email = (document.getElementById("privEmail21")?.value || "").trim();
        const nuevoUsuario = (document.getElementById("privUser21")?.value || "").trim().toLowerCase();
        const p1 = (document.getElementById("privPass1_21")?.value || "").trim();
        const p2 = (document.getElementById("privPass2_21")?.value || "").trim();
        const msg = document.getElementById("msgPrivEstado21");
        const btn = document.getElementById("btnEnviarCodPriv21");

        if (p1.length < 6) { msg.style.color = "#dc2626"; msg.innerText = "⚠️ La contraseña debe tener al menos 6 caracteres."; return; }
        if (p1 !== p2) { msg.style.color = "#dc2626"; msg.innerText = "⚠️ Las contraseñas no coinciden."; return; }

        btn.disabled = true;
        msg.style.color = "#0369a1";
        msg.innerText = "⏳ Enviando código a tu correo...";

        try {
            const resp = await fetch("/api/cdm/auth-privacidad/enviar-codigo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tokenSetup, email, nuevoUsuario })
            });
            const data = await resp.json();
            if (!resp.ok || !data.ok) {
                msg.style.color = "#dc2626";
                msg.innerText = "❌ " + (data.mensaje || "No se pudo enviar el código.");
                return;
            }
            msg.style.color = "#059669";
            msg.innerText = "✅ " + data.mensaje;
            document.getElementById("bloqueCodigoPriv21")?.classList.remove("hidden");
            document.getElementById("privCodigo21")?.focus();
        } catch (err) {
            msg.style.color = "#dc2626";
            msg.innerText = "❌ Error de conexión: " + err.message;
        } finally {
            btn.disabled = false;
        }
    };

    window.confirmarActivacionPrivada21 = async function (tokenSetup) {
        const email = (document.getElementById("privEmail21")?.value || "").trim();
        const nuevoUsuario = (document.getElementById("privUser21")?.value || "").trim().toLowerCase();
        const nuevaClave = (document.getElementById("privPass1_21")?.value || "").trim();
        const codigo = (document.getElementById("privCodigo21")?.value || "").trim();
        const msg = document.getElementById("msgPrivEstado21");

        msg.style.color = "#0369a1";
        msg.innerText = "⏳ Verificando código y encriptando tu acceso...";

        try {
            const resp = await fetch("/api/cdm/auth-privacidad/confirmar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tokenSetup, email, codigo, nuevoUsuario, nuevaClave })
            });
            const data = await resp.json();
            if (!resp.ok || !data.ok) {
                msg.style.color = "#dc2626";
                msg.innerText = "❌ " + (data.mensaje || "Código inválido.");
                return;
            }

            cargarEstadoClubEnLocalStorage(data.estado, data.claveClub);
            const lic = data.estado?.licenciaConfig || obtenerLicenciaConfigCDM();
            localStorage.setItem(STORAGE_SESION_KEY, JSON.stringify({
                rol: "admin",
                esSuperAdmin: false,
                nivelAdmin: "principal",
                staffPerfil: null,
                claveClub: data.claveClub,
                bioEnrollToken: data.bioEnrollToken || "",
                nombre: `Admin • ${lic.nombreEntidad || "Comercio"}`,
                fechaIngreso: new Date().toISOString()
            }));

            window.location.href = obtenerPaginaInicialSegunModulos(lic);
        } catch (err) {
            msg.style.color = "#dc2626";
            msg.innerText = "❌ Error: " + err.message;
        }
    };

    // 21.4 Modal de Recuperación de Contraseña por Email
    window.abrirModalRecuperarClave21 = function () {
        let modal = document.getElementById("modalRecuperarClave21");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "modalRecuperarClave21";
            modal.className = "modal-backdrop";
            document.body.appendChild(modal);
        }
        modal.innerHTML = `
            <div class="modal-window" style="max-width:460px; text-align:left;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-celeste">🔑 RECUPERACIÓN AUTÓNOMA</span>
                        <h3 style="color:var(--ink-900); margin-top:4px;">Restablecer Contraseña</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('modalRecuperarClave21').classList.add('hidden')">✕</button>
                </div>
                <div style="display:flex; flex-direction:column; gap:0.75rem;">
                    <div class="field">
                        <label>Ingresá tu usuario o correo electrónico *</label>
                        <input type="text" id="recIdent21" placeholder="tuemail@gmail.com o tu usuario">
                    </div>
                    <button type="button" class="btn btn-secondary" onclick="enviarCodigoRecuperacion21()">📧 Enviar código al correo</button>
                    <div id="bloqueConfirmRec21" class="hidden" style="display:flex; flex-direction:column; gap:0.65rem; background:var(--cdm-50); padding:0.85rem; border-radius:12px;">
                        <input type="hidden" id="recClaveClub21">
                        <div class="field">
                            <label>Código de 6 dígitos *</label>
                            <input type="text" id="recCodigo21" maxlength="6" placeholder="123456" style="text-align:center; letter-spacing:6px; font-weight:800;">
                        </div>
                        <div class="field">
                            <label>Nueva Contraseña (mín. 6) *</label>
                            <input type="password" id="recNuevaClave21" placeholder="••••••••">
                        </div>
                        <button type="button" class="btn btn-primary" onclick="confirmarRecuperacion21()">✅ Guardar Nueva Contraseña</button>
                    </div>
                    <div id="msgRecEstado21" style="font-size:0.8rem; font-weight:700;"></div>
                </div>
            </div>
        `;
        modal.classList.remove("hidden");
    };

    window.enviarCodigoRecuperacion21 = async function () {
        const identificador = (document.getElementById("recIdent21")?.value || "").trim();
        const msg = document.getElementById("msgRecEstado21");
        msg.style.color = "#0369a1";
        msg.innerText = "⏳ Enviando código...";
        try {
            const resp = await fetch("/api/cdm/auth-recuperar/enviar-codigo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identificador })
            });
            const data = await resp.json();
            if (!resp.ok || !data.ok) {
                msg.style.color = "#dc2626";
                msg.innerText = "❌ " + (data.mensaje || "No se encontró la cuenta.");
                return;
            }
            document.getElementById("recClaveClub21").value = data.claveClub;
            document.getElementById("bloqueConfirmRec21")?.classList.remove("hidden");
            msg.style.color = "#059669";
            msg.innerText = "✅ " + data.mensaje;
        } catch (err) {
            msg.style.color = "#dc2626";
            msg.innerText = "❌ Error: " + err.message;
        }
    };

    window.confirmarRecuperacion21 = async function () {
        const claveClub = document.getElementById("recClaveClub21")?.value;
        const codigo = (document.getElementById("recCodigo21")?.value || "").trim();
        const nuevaClave = (document.getElementById("recNuevaClave21")?.value || "").trim();
        const msg = document.getElementById("msgRecEstado21");
        try {
            const resp = await fetch("/api/cdm/auth-recuperar/confirmar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ claveClub, codigo, nuevaClave })
            });
            const data = await resp.json();
            if (!resp.ok || !data.ok) {
                msg.style.color = "#dc2626";
                msg.innerText = "❌ " + (data.mensaje || "Error al actualizar.");
                return;
            }
            msg.style.color = "#059669";
            msg.innerText = "✅ " + data.mensaje;
            setTimeout(() => document.getElementById("modalRecuperarClave21")?.classList.add("hidden"), 1500);
        } catch (err) {
            msg.style.color = "#dc2626";
            msg.innerText = "❌ Error: " + err.message;
        }
    };

    // 21.5 Hooks de Login
    const _origLoginAdmin21 = iniciarSesionComoAdmin;
    iniciarSesionComoAdmin = async function (e) {
        if (e && typeof e.preventDefault === "function") e.preventDefault();
        const user = (document.getElementById("inputAdminUser")?.value || "").trim().toLowerCase();
        const pass = (document.getElementById("inputAdminPass")?.value || "").trim();

        if (CREDENCIALES_SUPERADMIN.usuarios.includes(user) && CREDENCIALES_SUPERADMIN.claves.includes(pass)) {
            return _origLoginAdmin21.apply(this, arguments);
        }

        if (window.location.protocol !== "file:") {
            try {
                const resp = await fetch("/api/cdm/auth-admin", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ usuario: user, clave: pass })
                });
                const data = await resp.json();

                if (resp.status === 403 && data.suspendido) {
                    mostrarErrorLogin(data.mensaje || "⚠️ Acceso suspendido.");
                    return;
                }
                if (resp.ok && data.ok && data.requiereConfiguracionPrivada) {
                    abrirModalActivacionPrivada21(data);
                    return;
                }
                if (resp.ok && data.ok && data.estado) {
                    cargarEstadoClubEnLocalStorage(data.estado, data.claveClub);
                    const lic = data.estado.licenciaConfig || obtenerLicenciaConfigCDM();
                    const esStaff = data.nivelAdmin === "staff" && data.staffPerfil;

                    localStorage.setItem(STORAGE_SESION_KEY, JSON.stringify({
                        rol: "admin",
                        esSuperAdmin: false,
                        nivelAdmin: esStaff ? "staff" : "principal",
                        staffPerfil: esStaff ? data.staffPerfil : null,
                        claveClub: data.claveClub,
                        bioEnrollToken: data.bioEnrollToken || "",
                        nombre: esStaff
                            ? `${data.staffPerfil.nombre} (Staff)`
                            : `Admin • ${lic.nombreEntidad || "Comercio"}`,
                        fechaIngreso: new Date().toISOString()
                    }));

                    window.location.href = (esStaff && typeof obtenerPaginaInicialStaff19 === "function")
                        ? obtenerPaginaInicialStaff19(data.staffPerfil, lic)
                        : obtenerPaginaInicialSegunModulos(lic);
                    return;
                }
                if (resp.status === 401) {
                    mostrarErrorLogin(data.mensaje || "❌ Usuario o contraseña incorrectos.");
                    return;
                }
            } catch {}
        }

        return _origLoginAdmin21.apply(this, arguments);
    };

    const _origLoginCodigo21 = iniciarSesionConCodigo;
    iniciarSesionConCodigo = async function (e) {
        if (e && typeof e.preventDefault === "function") e.preventDefault();
        const rawInput = (document.getElementById("inputCodigoUsuario")?.value || "").trim().toUpperCase();

        if (window.location.protocol !== "file:" && rawInput) {
            try {
                const resp = await fetch("/api/cdm/auth-codigo", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ codigo: rawInput })
                });
                const data = await resp.json();
                if (resp.status === 403 && data.suspendido) {
                    mostrarErrorLogin(data.mensaje || "⏳ Cuenta en pausa o vencida.");
                    return;
                }
                if (resp.ok && data.ok && data.estado) {
                    cargarEstadoClubEnLocalStorage(data.estado, data.claveClub);

                    if (data.esPacienteConsultorio && data.paciente) {
                        sincronizarPacienteEnRegistroUniversal21(data.paciente, data.claveClub);
                        localStorage.setItem(STORAGE_SESION_KEY, JSON.stringify({
                            rol: "usuario",
                            esPacienteConsultorio: true,
                            clavePaciente: `id_${data.paciente.id}`,
                            personaId: data.paciente.id,
                            dni: data.paciente.dni || "",
                            nombre: data.paciente.nombreCompleto || `${data.paciente.nombre || ""} ${data.paciente.apellido || ""}`.trim() || "Paciente",
                            deporte: data.paciente.especialidad || "Consultorio",
                            categoria: data.paciente.mutual || "Particular",
                            codigo: data.paciente.codigoAcceso || rawInput,
                            bioEnrollToken: data.bioEnrollToken || "",
                            fechaIngreso: new Date().toISOString()
                        }));
                        window.location.href = `jugador.html?id=${encodeURIComponent(data.paciente.id)}&pac=id_${encodeURIComponent(data.paciente.id)}&modo=paciente`;
                        return;
                    }

                    if (data.persona) {
                        localStorage.setItem(STORAGE_SESION_KEY, JSON.stringify({
                            rol: "usuario",
                            personaId: data.persona.id,
                            dni: data.persona.dni,
                            nombre: `${data.persona.nombre} ${data.persona.apellido}`,
                            deporte: data.persona.deporte,
                            categoria: data.persona.categoria,
                            codigo: data.persona.codigoAcceso,
                            bioEnrollToken: data.bioEnrollToken || "",
                            fechaIngreso: new Date().toISOString()
                        }));
                        sessionStorage.setItem("cdm_socio_dni_activo", data.persona.dni || "");
                        window.location.href = `jugador.html?id=${data.persona.id}`;
                        return;
                    }
                }
            } catch {}
        }

        return _origLoginCodigo21.apply(this, arguments);
    };

    // 21.6 Selector Demo vs Sistema Real en Modal SuperAdmin y Tarjetas Hub
    const _origAbrirModalComercio21 = abrirModalCrearOEditarComercio;
    abrirModalCrearOEditarComercio = async function (claveClubEditar = null) {
        await _origAbrirModalComercio21.apply(this, arguments);
        const modal = document.getElementById("modalSuperAdminCDM");
        const form = modal?.querySelector("form");
        if (!form || document.getElementById("bloqueTipoCuentaPrivada21")) return;

        const lista = await obtenerListaCompletaComerciosCDM();
        const existente = claveClubEditar ? lista.find(x => x.claveClub === claveClubEditar) : null;
        const lic = existente?.licenciaConfig || {};
        const tipoCuenta = lic.tipoCuenta === "real" ? "real" : "demo";
        const yaPrivada = Boolean(lic.credencialesPrivadasConfirmadas);

        const box = document.createElement("div");
        box.id = "bloqueTipoCuentaPrivada21";
        box.style = "background:linear-gradient(135deg, rgba(99,102,241,0.08), rgba(16,185,129,0.08)); border:1.5px solid #6366f1; border-radius:16px; padding:0.9rem 1rem; margin-bottom:1rem;";
        box.innerHTML = `
            <label style="font-size:0.72rem; font-weight:800; color:#4338ca; text-transform:uppercase; display:block; margin-bottom:0.5rem;">
                🛡️ MODO DE CUENTA: DEMO vs SISTEMA REAL (DATOS SENSIBLES)
            </label>
            <div class="grid-2">
                <div class="field">
                    <label>Tipo de Entorno *</label>
                    <select id="mcTipoCuenta21" ${yaPrivada ? "disabled" : ""} style="font-weight:700;">
                        <option value="demo" ${tipoCuenta === "demo" ? "selected" : ""}>🎁 Modo DEMO (Clave visible para pruebas/soporte)</option>
                        <option value="real" ${tipoCuenta === "real" ? "selected" : ""}>🔒 Sistema REAL (Exige cambio de clave por mail al entrar)</option>
                    </select>
                </div>
                <div class="field">
                    <label>Correo del Titular (Opcional)</label>
                    <input type="email" id="mcAdminEmail21" ${yaPrivada ? "readonly" : ""} value="${(lic.adminEmail || "").replace(/"/g, "&quot;")}" placeholder="Ej: lic.alina@gmail.com">
                </div>
            </div>
            <small style="display:block; margin-top:0.45rem; font-size:0.74rem; color:var(--ink-600);">
                ${yaPrivada
                    ? "✅ <b>Cuenta privada ya activada por el cliente.</b> Su contraseña está encriptada y protegida."
                    : "En <b>Sistema REAL</b>, al ingresar con el usuario/clave base que le entregues, el cliente deberá validar un código en su mail y crear su acceso privado."}
            </small>
        `;

        const bloqueDemo = document.getElementById("bloqueDemoDiasModal18");
        if (bloqueDemo) bloqueDemo.insertAdjacentElement("beforebegin", box);
        else form.lastElementChild?.insertAdjacentElement("beforebegin", box);

        if (yaPrivada) {
            const inpU = document.getElementById("mcAdminUsuario");
            const inpP = document.getElementById("mcAdminClave");
            if (inpU) inpU.readOnly = true;
            if (inpP) {
                inpP.value = "PRIVADA-ENCRIPTADA";
                inpP.readOnly = true;
            }
        }
    };

    const _origGuardarComercio21 = guardarComercioDesdeModal;
    guardarComercioDesdeModal = async function (e, claveClubExistente = "") {
        const tipoCuenta = document.getElementById("mcTipoCuenta21")?.value === "real" ? "real" : "demo";
        const adminEmail = (document.getElementById("mcAdminEmail21")?.value || "").trim().toLowerCase();
        const nombreInput = (document.getElementById("mcNombreEntidad")?.value || "").trim().toLowerCase();

        await _origGuardarComercio21.apply(this, arguments);

        const mapa = obtenerMapaLocalClubesCDM();
        let claveTarget = claveClubExistente;
        if (!claveTarget && nombreInput) {
            const match = Object.values(mapa).find(c => (c.licenciaConfig?.nombreEntidad || "").toLowerCase() === nombreInput);
            if (match) claveTarget = match.claveClub;
        }

        if (claveTarget && mapa[claveTarget]?.licenciaConfig) {
            mapa[claveTarget].licenciaConfig.tipoCuenta = tipoCuenta;
            if (adminEmail) mapa[claveTarget].licenciaConfig.adminEmail = adminEmail;
            localStorage.setItem(STORAGE_MAPA_CLUBES_KEY, JSON.stringify(mapa));

            if (window.location.protocol !== "file:") {
                try {
                    const respEst = await fetch(`/api/cdm/estado?club=${encodeURIComponent(claveTarget)}`);
                    if (respEst.ok) {
                        const dEst = await respEst.json();
                        const estActual = dEst.estado || {};
                        estActual.licenciaConfig = {
                            ...(estActual.licenciaConfig || {}),
                            ...mapa[claveTarget].licenciaConfig,
                            tipoCuenta,
                            adminEmail: adminEmail || estActual.licenciaConfig?.adminEmail || ""
                        };
                        await fetch("/api/cdm/estado", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ...estActual, claveClub: claveTarget })
                        });
                    }
                } catch {}
            }
        }

        const enLogin = window.location.pathname.toLowerCase().includes("login.html") || document.body?.classList.contains("login-page");
        if (enLogin && !document.getElementById("vistaHubSuperAdmin")?.classList.contains("hidden")) {
            await mostrarHubSelectorDeComercios();
        }
    };

    const _origMostrarHub21 = mostrarHubSelectorDeComercios;
    mostrarHubSelectorDeComercios = async function () {
        await _origMostrarHub21.apply(this, arguments);
        const lista = await obtenerListaCompletaComerciosCDM();
        const cards = document.querySelectorAll("#gridTarjetasComerciosHub .hub-comercio-card");

        cards.forEach((card, idx) => {
            const lic = lista[idx]?.licenciaConfig || {};
            const esReal = lic.tipoCuenta === "real";
            const yaPrivada = Boolean(lic.credencialesPrivadasConfirmadas);

            const credBox = Array.from(card.querySelectorAll("div")).find(d => (d.innerText || "").includes("Usuario comercio:"));
            if (credBox && yaPrivada) {
                credBox.innerHTML = `
                    <div>👤 <b>Usuario:</b> ${lic.adminUsuario || "-"}</div>
                    <div style="color:#059669; font-weight:700;">🔒 <b>Clave privada encriptada</b> (${lic.adminEmail || "verificada"})</div>
                `;
            }

            if (!card.querySelector(".hub-tipo-cuenta-pill-21")) {
                const pill = document.createElement("div");
                pill.className = "hub-tipo-cuenta-pill-21";
                pill.style = `font-size:0.7rem; font-weight:800; padding:0.25rem 0.55rem; border-radius:8px; text-align:center; ${
                    esReal
                        ? "background:rgba(16,185,129,0.12); color:#047857; border:1px solid rgba(16,185,129,0.35);"
                        : "background:rgba(99,102,241,0.1); color:#4338ca; border:1px solid rgba(99,102,241,0.28);"
                }`;
                pill.innerText = esReal
                    ? (yaPrivada ? "🔒 SISTEMA REAL • Clave Privada Activa" : "🔒 SISTEMA REAL • Pendiente activación por mail")
                    : "🎁 MODO DEMO";
                card.insertBefore(pill, card.lastElementChild);
            }
        });
    };

    // 21.7 Botón "Activar Huella / Face ID" en barra superior interna
    const _origInyectarBarraTopbar21 = inyectarBarraSesionTopbar;
    inyectarBarraSesionTopbar = function (sesion) {
        _origInyectarBarraTopbar21.apply(this, arguments);
        if (!sesion || sesion.esSuperAdmin || !sesion.bioEnrollToken) return;

        const barra = document.getElementById("cdmBarraSesionActiva");
        if (!barra || document.getElementById("btnActivarBioTopbar21")) return;

        soportaBiometriaDispositivo21().then(ok => {
            if (!ok || document.getElementById("btnActivarBioTopbar21")) return;
            const yaActiva = obtenerPerfilesBioDispositivo21().some(p => p.claveClub === (sesion.claveClub || obtenerClaveClubActivoCDM()) && p.rol === sesion.rol);
            const btn = document.createElement("button");
            btn.type = "button";
            btn.id = "btnActivarBioTopbar21";
            btn.className = "btn btn-ghost btn-sm usr-action-allow";
            btn.title = "Vincular la Huella o Face ID de este dispositivo para entrar en 1 toque";
            btn.onclick = activarHuellaOFaceIDActual21;
            btn.innerHTML = yaActiva
                ? `<i class="ri-fingerprint-line"></i> Huella Activa ✓`
                : `<i class="ri-fingerprint-line"></i> Activar Huella / Face ID`;
            barra.insertBefore(btn, barra.lastElementChild);
        });
    };

    document.addEventListener("DOMContentLoaded", () => {
        renderizarBotonesBioEnLogin21();
        setTimeout(renderizarBotonesBioEnLogin21, 250);
    });
})();
// =========================================================================
// 22. PERSONALIZACIÓN DE COLORES DE MARCA POR COMERCIO (RESPETANDO MODO DÍA/NOCHE)
//     - Paletas rápidas + selector libre (Color Principal y Secundario) + Estilo de Sidebar
//     - Se guarda en licenciaConfig.temaMarca (persiste automático en MongoDB)
//     - Mantiene intactos los fondos blanco/negro de Modo Día y Modo Noche
// Pegar al final de js/login.js (debajo del Bloque 21)
// =========================================================================
(function () {
    const TEMA_MARCA_DEFECTO = {
        primario: "#0284c7",
        secundario: "#0c192c",
        estiloSidebar: "oscuro_neutro" // 'oscuro_neutro' | 'oscuro_tenido' | 'color_marca'
    };

    const PALETAS_PRESET_MARCA = [
        { nombre: "Celeste Base", primario: "#0284c7", secundario: "#0c192c" },
        { nombre: "Rojo Club", primario: "#dc2626", secundario: "#450a0a" },
        { nombre: "Verde Salud", primario: "#059669", secundario: "#064e3b" },
        { nombre: "Violeta Psi", primario: "#7c3aed", secundario: "#2e1065" },
        { nombre: "Naranja Gym", primario: "#ea580c", secundario: "#431407" },
        { nombre: "Dorado Pro", primario: "#ca8a04", secundario: "#1c1917" },
        { nombre: "Rosa Studio", primario: "#db2777", secundario: "#500724" },
        { nombre: "Turquesa Kine", primario: "#0d9488", secundario: "#134e4a" },
        { nombre: "Grafito", primario: "#334155", secundario: "#0f172a" }
    ];

    window.__cdmPendingTemaMarca22 = null;

    function hexValido(h, fallback) {
        const s = String(h || "").trim();
        return /^#[0-9a-fA-F]{6}$/.test(s) ? s.toLowerCase() : fallback;
    }

    function hexToRgb(hex) {
        const clean = hexValido(hex, "#0284c7").slice(1);
        return {
            r: parseInt(clean.slice(0, 2), 16),
            g: parseInt(clean.slice(2, 4), 16),
            b: parseInt(clean.slice(4, 6), 16)
        };
    }

    function rgbToHex(r, g, b) {
        const c = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
        return `#${c(r)}${c(g)}${c(b)}`;
    }

    function mezclarHex(hexA, hexB, pesoB) {
        const a = hexToRgb(hexA), b = hexToRgb(hexB);
        return rgbToHex(
            a.r + (b.r - a.r) * pesoB,
            a.g + (b.g - a.g) * pesoB,
            a.b + (b.b - a.b) * pesoB
        );
    }

    function textoContraste(hex) {
        const { r, g, b } = hexToRgb(hex);
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        return lum > 168 ? "#0f172a" : "#ffffff";
    }

    function normalizarTemaMarca(lic) {
        const t = (lic && typeof lic.temaMarca === "object" && lic.temaMarca) ? lic.temaMarca : {};
        return {
            primario: hexValido(t.primario, TEMA_MARCA_DEFECTO.primario),
            secundario: hexValido(t.secundario, TEMA_MARCA_DEFECTO.secundario),
            estiloSidebar: ["oscuro_neutro", "oscuro_tenido", "color_marca"].includes(t.estiloSidebar)
                ? t.estiloSidebar
                : TEMA_MARCA_DEFECTO.estiloSidebar
        };
    }

    // -------------------------------------------------------------------------
    // 22.1 MOTOR CSS DINÁMICO (RESPETA BLANCO/NEGRO EN MODO DÍA Y MODO NOCHE)
    // -------------------------------------------------------------------------

    function asegurarEstilosMarcaDinamicos() {
        if (document.getElementById("cdmBrandThemeStyle22")) return;
        const st = document.createElement("style");
        st.id = "cdmBrandThemeStyle22";
        st.textContent = `
            body[data-brand-custom="1"] .app-topbar {
                border-top: 3.5px solid var(--brand-p) !important;
            }
            body[data-brand-custom="1"] .btn-primary {
                background: linear-gradient(135deg, var(--brand-p) 0%, var(--brand-p-dark) 100%) !important;
                border-color: var(--brand-p) !important;
                color: var(--brand-on-p) !important;
                box-shadow: 0 6px 16px -4px rgba(var(--brand-rgb), 0.42) !important;
            }
            body[data-brand-custom="1"] .btn-primary:hover {
                filter: brightness(1.06);
            }
            body[data-brand-custom="1"] .side-link.active,
            body[data-brand-custom="1"] .menu38-sublink.active,
            body[data-brand-custom="1"] .bnav38-item.active,
            body[data-brand-custom="1"] .bsheet38-opt.active,
            body[data-brand-custom="1"] .mod-tab.active,
            body[data-brand-custom="1"] .seg-btn.active,
            body[data-brand-custom="1"] .rutina-dest-tab.active,
            body[data-brand-custom="1"] .gym-view-btn.active,
            body[data-brand-custom="1"] .user-quick-dock-btn.active,
            body[data-brand-custom="1"] .jf-chip-btn.active {
                background: var(--brand-p) !important;
                border-color: var(--brand-p) !important;
                color: var(--brand-on-p) !important;
            }
            body[data-brand-custom="1"] .cat-active-pill,
            body[data-brand-custom="1"] .badge-celeste,
            body[data-brand-custom="1"] .r-pill-series {
                background: var(--cdm-50) !important;
                color: var(--brand-p-ink) !important;
                border-color: var(--line-celeste) !important;
            }
            body[data-brand-custom="1"] .athlete-card,
            body[data-brand-custom="1"] .jf-kpi:not(.c-purple):not(.c-green):not(.c-amber),
            body[data-brand-custom="1"] .up-mod-card:not(.c-emerald):not(.c-purple):not(.c-amber):not(.c-rose) {
                border-top-color: var(--brand-p) !important;
            }
            body[data-brand-custom="1"] .kpi-icon:not(.ok):not(.purple):not(.warn),
            body[data-brand-custom="1"] .up-mod-icon {
                background: var(--cdm-50) !important;
                color: var(--brand-p-ink) !important;
            }
            body[data-brand-custom="1"] .ex-builder-row {
                border-left-color: var(--brand-p) !important;
            }
            body[data-brand-custom="1"] .ex-builder-num,
            body[data-brand-custom="1"] .pillar-micro-fill,
            body[data-brand-custom="1"] .jf-bar-fill {
                background: linear-gradient(135deg, var(--brand-p) 0%, var(--brand-p-dark) 100%) !important;
                color: var(--brand-on-p) !important;
            }
            body[data-brand-custom="1"] input:focus,
            body[data-brand-custom="1"] select:focus,
            body[data-brand-custom="1"] textarea:focus {
                border-color: var(--brand-p) !important;
                box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18) !important;
            }
            body[data-brand-custom="1"] .up-hero-banner,
            body[data-brand-custom="1"] .user-workout-banner,
            body[data-brand-custom="1"] .routine-pro-header.routine-theme-fuerza,
            body[data-brand-custom="1"] .eval33-score-hero {
                background: linear-gradient(135deg, var(--brand-s) 0%, var(--brand-p-dark) 62%, var(--brand-p) 100%) !important;
            }
            body[data-brand-custom="1"] .cdm-droplet-btn:not(.running) {
                background: linear-gradient(135deg, var(--brand-p) 0%, var(--brand-s) 100%) !important;
                border-color: rgba(var(--brand-rgb), 0.6) !important;
            }

            /* Estilos opcionales de barra lateral (siempre legible) */
            body[data-brand-custom="1"][data-brand-sidebar="oscuro_tenido"] .app-sidebar,
            body[data-brand-custom="1"][data-brand-sidebar="oscuro_tenido"] #cdmBottomNav38 {
                background: linear-gradient(180deg, var(--brand-sidebar-tint) 0%, #0b1220 100%) !important;
            }
            body[data-brand-custom="1"][data-brand-sidebar="color_marca"] .app-sidebar,
            body[data-brand-custom="1"][data-brand-sidebar="color_marca"] #cdmBottomNav38 {
                background: linear-gradient(180deg, var(--brand-s) 0%, var(--brand-p-deep) 100%) !important;
                border-right: 1px solid rgba(255, 255, 255, 0.14) !important;
            }
            body[data-brand-custom="1"][data-brand-sidebar="color_marca"] .side-link.active {
                background: rgba(255, 255, 255, 0.2) !important;
                color: #ffffff !important;
                box-shadow: inset 3px 0 0 #ffffff !important;
            }

            /* Swatches en modal */
            .brand22-swatches {
                display: flex;
                flex-wrap: wrap;
                gap: 0.42rem;
                margin-bottom: 0.75rem;
            }
            .brand22-swatch {
                display: inline-flex;
                align-items: center;
                gap: 0.35rem;
                border: 1.5px solid var(--line-strong, #cbd5e1);
                background: var(--surface-solid, #ffffff);
                color: var(--ink-900, #0f172a);
                border-radius: 999px;
                padding: 0.26rem 0.62rem 0.26rem 0.32rem;
                font-size: 0.73rem;
                font-weight: 700;
                cursor: pointer;
                transition: transform 0.14s ease, border-color 0.14s ease;
            }
            .brand22-swatch:hover { transform: translateY(-1px); border-color: #0284c7; }
            .brand22-dot {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                border: 1.5px solid rgba(0, 0, 0, 0.15);
                flex-shrink: 0;
            }
            .brand22-preview-bar {
                border-radius: 12px;
                border: 1px solid var(--line-strong, #cbd5e1);
                background: var(--surface-solid, #ffffff);
                padding: 0.65rem 0.8rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.5rem;
                flex-wrap: wrap;
                margin-top: 0.65rem;
            }
        `;
        document.head.appendChild(st);
    }

    window.aplicarColoresMarcaComercio22 = function (temaOverride = null) {
        const path = (window.location.pathname || "").toLowerCase();
        if (path.includes("login.html") || document.body?.classList.contains("login-page")) {
            document.body?.removeAttribute("data-brand-custom");
            document.body?.removeAttribute("data-brand-sidebar");
            return;
        }

        asegurarEstilosMarcaDinamicos();
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        const tema = temaOverride ? normalizarTemaMarca({ temaMarca: temaOverride }) : normalizarTemaMarca(lic);

        const esDefault = tema.primario === TEMA_MARCA_DEFECTO.primario &&
                          tema.secundario === TEMA_MARCA_DEFECTO.secundario &&
                          tema.estiloSidebar === TEMA_MARCA_DEFECTO.estiloSidebar;

        const root = document.documentElement;
        if (esDefault && !temaOverride) {
            document.body?.removeAttribute("data-brand-custom");
            document.body?.removeAttribute("data-brand-sidebar");
            ["--cdm-50", "--cdm-100", "--cdm-400", "--cdm-500", "--cdm-600", "--cdm-700", "--cdm-900", "--line-celeste"].forEach(v => root.style.removeProperty(v));
            return;
        }

        const esOscuro = document.body?.getAttribute("data-theme") === "dark";
        const { r, g, b } = hexToRgb(tema.primario);
        const pLight = mezclarHex(tema.primario, "#ffffff", 0.28);
        const pDark = mezclarHex(tema.primario, "#000000", 0.22);
        const pDeep = mezclarHex(tema.primario, "#000000", 0.48);
        const sidebarTint = mezclarHex(tema.primario, "#0b1220", 0.78);
        const onPrimary = textoContraste(tema.primario);

        root.style.setProperty("--brand-p", tema.primario);
        root.style.setProperty("--brand-p-dark", pDark);
        root.style.setProperty("--brand-p-deep", pDeep);
        root.style.setProperty("--brand-s", tema.secundario);
        root.style.setProperty("--brand-rgb", `${r}, ${g}, ${b}`);
        root.style.setProperty("--brand-on-p", onPrimary);
        root.style.setProperty("--brand-p-ink", esOscuro ? pLight : pDark);
        root.style.setProperty("--brand-sidebar-tint", sidebarTint);

        // Actualizar variables --cdm-* adaptadas al modo día o noche
        root.style.setProperty("--cdm-50", esOscuro ? `rgba(${r}, ${g}, ${b}, 0.16)` : mezclarHex(tema.primario, "#ffffff", 0.91));
        root.style.setProperty("--cdm-100", esOscuro ? `rgba(${r}, ${g}, ${b}, 0.24)` : mezclarHex(tema.primario, "#ffffff", 0.82));
        root.style.setProperty("--cdm-400", pLight);
        root.style.setProperty("--cdm-500", tema.primario);
        root.style.setProperty("--cdm-600", pDark);
        root.style.setProperty("--cdm-700", pDeep);
        root.style.setProperty("--cdm-900", tema.secundario);
        root.style.setProperty("--line-celeste", `rgba(${r}, ${g}, ${b}, ${esOscuro ? "0.38" : "0.32"})`);

        document.body?.setAttribute("data-brand-custom", "1");
        document.body?.setAttribute("data-brand-sidebar", tema.estiloSidebar);
    };

    // Reaplicar al cambiar Modo Día / Noche y al aplicar licencia
    const _origAplicarTema22 = aplicarTemaGuardadoCDM;
    aplicarTemaGuardadoCDM = function () {
        _origAplicarTema22.apply(this, arguments);
        aplicarColoresMarcaComercio22();
    };

    const _origAplicarLic22 = aplicarLicenciaYModulosCDM;
    aplicarLicenciaYModulosCDM = function () {
        _origAplicarLic22.apply(this, arguments);
        aplicarColoresMarcaComercio22();
    };

    // Si usa Logo Genérico SVG (Bloque 13), teñirlo también con los colores del comercio
    if (typeof generarLogoGenericoSVGComercio13 === "function") {
        const _origGenLogo22 = generarLogoGenericoSVGComercio13;
        generarLogoGenericoSVGComercio13 = function (lic = {}) {
            if (lic?.temaMarca?.primario) {
                const sigla = String(lic.siglaCodigo || lic.nombreEntidad || "APP")
                    .replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 3) || "PRO";
                const c1 = hexValido(lic.temaMarca.primario, "#0284c7");
                const c2 = hexValido(lic.temaMarca.secundario, "#0f172a");
                const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
                    <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs>
                    <rect width="112" height="112" x="4" y="4" rx="28" fill="url(#g)" stroke="#ffffff" stroke-width="3" stroke-opacity="0.35"/>
                    <text x="60" y="69" font-family="Poppins, Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">${sigla}</text>
                </svg>`;
                return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
            }
            return _origGenLogo22.apply(this, arguments);
        };
    }

    // -------------------------------------------------------------------------
    // 22.2 BLOQUE DE COLORES EN MODAL SUPERADMIN (CREAR / EDITAR COMERCIO)
    // -------------------------------------------------------------------------

    function construirHtmlControlesColor(prefix, temaActual, conLiveApp = false) {
        const onUpd = conLiveApp ? `actualizarPreviewColores22('${prefix}', true)` : `actualizarPreviewColores22('${prefix}', false)`;
        return `
            <div class="brand22-swatches">
                ${PALETAS_PRESET_MARCA.map(p => `
                    <button type="button" class="brand22-swatch" onclick="seleccionarPaletaMarca22('${prefix}', '${p.primario}', '${p.secundario}', ${conLiveApp})">
                        <span class="brand22-dot" style="background:${p.primario};"></span>
                        <span>${p.nombre}</span>
                    </button>
                `).join("")}
            </div>

            <div class="grid-3">
                <div class="field">
                    <label>Color Principal</label>
                    <div style="display:flex; gap:0.4rem; align-items:center;">
                        <input type="color" id="${prefix}Primario" value="${temaActual.primario}" oninput="${onUpd}" style="width:44px; min-height:38px; padding:2px; cursor:pointer;">
                        <input type="text" id="${prefix}PrimarioHex" value="${temaActual.primario}" maxlength="7" oninput="sincronizarHexMarca22('${prefix}', 'Primario', ${conLiveApp})" style="font-family:monospace; font-weight:700;">
                    </div>
                </div>
                <div class="field">
                    <label>Color Secundario (Banners)</label>
                    <div style="display:flex; gap:0.4rem; align-items:center;">
                        <input type="color" id="${prefix}Secundario" value="${temaActual.secundario}" oninput="${onUpd}" style="width:44px; min-height:38px; padding:2px; cursor:pointer;">
                        <input type="text" id="${prefix}SecundarioHex" value="${temaActual.secundario}" maxlength="7" oninput="sincronizarHexMarca22('${prefix}', 'Secundario', ${conLiveApp})" style="font-family:monospace; font-weight:700;">
                    </div>
                </div>
                <div class="field">
                    <label>Barra Lateral (Sidebar)</label>
                    <select id="${prefix}Sidebar" onchange="${onUpd}" style="font-weight:700;">
                        <option value="oscuro_neutro" ${temaActual.estiloSidebar === "oscuro_neutro" ? "selected" : ""}>⬛ Oscura Clásica (Solo acentos)</option>
                        <option value="oscuro_tenido" ${temaActual.estiloSidebar === "oscuro_tenido" ? "selected" : ""}>🌑 Oscura con Toque de Marca</option>
                        <option value="color_marca" ${temaActual.estiloSidebar === "color_marca" ? "selected" : ""}>🎨 Color de Marca Completo</option>
                    </select>
                </div>
            </div>

            <div id="${prefix}PreviewBar" class="brand22-preview-bar" style="border-top: 3.5px solid ${temaActual.primario};">
                <div style="display:flex; align-items:center; gap:0.45rem; flex-wrap:wrap;">
                    <span id="${prefix}PrevBadge" style="font-size:0.72rem; font-weight:800; padding:0.22rem 0.65rem; border-radius:999px; background:${mezclarHex(temaActual.primario, "#ffffff", 0.9)}; color:${temaActual.primario};">Vista previa</span>
                    <span id="${prefix}PrevBtn" style="font-size:0.74rem; font-weight:800; padding:0.32rem 0.78rem; border-radius:9px; background:${temaActual.primario}; color:${textoContraste(temaActual.primario)};">Botón Principal</span>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" style="min-height:28px; font-size:0.72rem;" onclick="seleccionarPaletaMarca22('${prefix}', '${TEMA_MARCA_DEFECTO.primario}', '${TEMA_MARCA_DEFECTO.secundario}', ${conLiveApp}, 'oscuro_neutro')">
                    ↺ Color Base
                </button>
            </div>
        `;
    }

    window.seleccionarPaletaMarca22 = function (prefix, pri, sec, liveApp = false, estiloOpt = null) {
        const iP = document.getElementById(`${prefix}Primario`);
        const iPH = document.getElementById(`${prefix}PrimarioHex`);
        const iS = document.getElementById(`${prefix}Secundario`);
        const iSH = document.getElementById(`${prefix}SecundarioHex`);
        const selSide = document.getElementById(`${prefix}Sidebar`);
        if (iP) iP.value = pri;
        if (iPH) iPH.value = pri;
        if (iS) iS.value = sec;
        if (iSH) iSH.value = sec;
        if (estiloOpt && selSide) selSide.value = estiloOpt;
        actualizarPreviewColores22(prefix, liveApp);
    };

    window.sincronizarHexMarca22 = function (prefix, cual, liveApp = false) {
        const txt = document.getElementById(`${prefix}${cual}Hex`)?.value || "";
        if (/^#[0-9a-fA-F]{6}$/.test(txt)) {
            const inp = document.getElementById(`${prefix}${cual}`);
            if (inp) inp.value = txt.toLowerCase();
            actualizarPreviewColores22(prefix, liveApp);
        }
    };

    window.actualizarPreviewColores22 = function (prefix, liveApp = false) {
        const pri = hexValido(document.getElementById(`${prefix}Primario`)?.value, TEMA_MARCA_DEFECTO.primario);
        const sec = hexValido(document.getElementById(`${prefix}Secundario`)?.value, TEMA_MARCA_DEFECTO.secundario);
        const side = document.getElementById(`${prefix}Sidebar`)?.value || "oscuro_neutro";

        const iPH = document.getElementById(`${prefix}PrimarioHex`);
        const iSH = document.getElementById(`${prefix}SecundarioHex`);
        if (iPH && document.activeElement !== iPH) iPH.value = pri;
        if (iSH && document.activeElement !== iSH) iSH.value = sec;

        const bar = document.getElementById(`${prefix}PreviewBar`);
        const btn = document.getElementById(`${prefix}PrevBtn`);
        const bad = document.getElementById(`${prefix}PrevBadge`);
        if (bar) bar.style.borderTopColor = pri;
        if (btn) { btn.style.background = pri; btn.style.color = textoContraste(pri); }
        if (bad) { bad.style.background = mezclarHex(pri, "#ffffff", 0.9); bad.style.color = pri; }

        if (liveApp) {
            aplicarColoresMarcaComercio22({ primario: pri, secundario: sec, estiloSidebar: side });
        }
    };

    const _origGuardarLic22 = guardarLicenciaConfigCDM;
    guardarLicenciaConfigCDM = function (nuevaConfig) {
        if (nuevaConfig && typeof nuevaConfig === "object" && window.__cdmPendingTemaMarca22) {
            nuevaConfig.temaMarca = window.__cdmPendingTemaMarca22;
        }
        return _origGuardarLic22.apply(this, arguments);
    };

    const _origAbrirModal22 = abrirModalCrearOEditarComercio;
    abrirModalCrearOEditarComercio = async function (claveClubEditar = null) {
        await _origAbrirModal22.apply(this, arguments);
        const modal = document.getElementById("modalSuperAdminCDM");
        const form = modal?.querySelector("form");
        if (!form || document.getElementById("bloqueColoresMarcaModal22")) return;

        const lista = await obtenerListaCompletaComerciosCDM();
        const existente = claveClubEditar ? lista.find(x => x.claveClub === claveClubEditar) : null;
        const temaActual = normalizarTemaMarca(existente?.licenciaConfig || {});

        const box = document.createElement("div");
        box.id = "bloqueColoresMarcaModal22";
        box.style = "background:var(--surface-subtle); border:1.5px solid var(--line-strong); border-radius:16px; padding:0.95rem 1rem; margin-bottom:0.95rem;";
        box.innerHTML = `
            <label style="font-size:0.72rem; font-weight:800; color:var(--ink-700); text-transform:uppercase; display:block; margin-bottom:0.55rem;">
                🎨 COLORES DE MARCA DEL COMERCIO (MANTIENE MODO DÍA Y MODO NOCHE)
            </label>
            ${construirHtmlControlesColor("mcBrand22", temaActual, false)}
        `;

        const primerBloque = Array.from(form.children).find(el => el.tagName === "DIV");
        if (primerBloque) primerBloque.insertAdjacentElement("afterend", box);
        else form.prepend(box);
    };

    const _origGuardarComercio22 = guardarComercioDesdeModal;
    guardarComercioDesdeModal = async function (e, claveClubExistente = "") {
        const temaCapturado = {
            primario: hexValido(document.getElementById("mcBrand22Primario")?.value, TEMA_MARCA_DEFECTO.primario),
            secundario: hexValido(document.getElementById("mcBrand22Secundario")?.value, TEMA_MARCA_DEFECTO.secundario),
            estiloSidebar: document.getElementById("mcBrand22Sidebar")?.value || "oscuro_neutro"
        };
        const nombreInput = (document.getElementById("mcNombreEntidad")?.value || "").trim().toLowerCase();
        window.__cdmPendingTemaMarca22 = temaCapturado;

        await _origGuardarComercio22.apply(this, arguments);

        const mapa = obtenerMapaLocalClubesCDM();
        let claveTarget = claveClubExistente;
        if (!claveTarget && nombreInput) {
            const match = Object.values(mapa).find(c => (c.licenciaConfig?.nombreEntidad || "").toLowerCase() === nombreInput);
            if (match) claveTarget = match.claveClub;
        }

        if (claveTarget && mapa[claveTarget]?.licenciaConfig) {
            mapa[claveTarget].licenciaConfig.temaMarca = temaCapturado;
            localStorage.setItem(STORAGE_MAPA_CLUBES_KEY, JSON.stringify(mapa));
            if (obtenerClaveClubActivoCDM() === claveTarget) {
                localStorage.setItem(STORAGE_LICENCIA_KEY, JSON.stringify(mapa[claveTarget].licenciaConfig));
            }
            if (window.location.protocol !== "file:") {
                try {
                    const respEst = await fetch(`/api/cdm/estado?club=${encodeURIComponent(claveTarget)}`);
                    if (respEst.ok) {
                        const dEst = await respEst.json();
                        const estActual = dEst.estado || {};
                        estActual.licenciaConfig = { ...(estActual.licenciaConfig || {}), ...mapa[claveTarget].licenciaConfig, temaMarca: temaCapturado };
                        await fetch("/api/cdm/estado", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ...estActual, claveClub: claveTarget })
                        });
                    }
                } catch {}
            }
        }

        window.__cdmPendingTemaMarca22 = null;
        aplicarColoresMarcaComercio22();

        const enLogin = (window.location.pathname || "").toLowerCase().includes("login.html") || document.body?.classList.contains("login-page");
        if (enLogin && !document.getElementById("vistaHubSuperAdmin")?.classList.contains("hidden")) {
            await mostrarHubSelectorDeComercios();
        }
    };

    // Mostrar franja superior con el color de marca en las tarjetas del Hub SuperAdmin
    const _origMostrarHub22 = mostrarHubSelectorDeComercios;
    mostrarHubSelectorDeComercios = async function () {
        await _origMostrarHub22.apply(this, arguments);
        const lista = await obtenerListaCompletaComerciosCDM();
        const cards = document.querySelectorAll("#gridTarjetasComerciosHub .hub-comercio-card");
        cards.forEach((card, idx) => {
            const t = normalizarTemaMarca(lista[idx]?.licenciaConfig || {});
            card.style.borderTop = `4px solid ${t.primario}`;
        });
    };

    // -------------------------------------------------------------------------
    // 22.3 MODAL RÁPIDO EN VIVO "🎨 COLORES" (ADENTRO DE LA APP, SIN RECARGAR)
    // -------------------------------------------------------------------------

    window.abrirModalColoresRapidoComercio22 = function () {
        const lic = obtenerLicenciaConfigCDM();
        const temaActual = normalizarTemaMarca(lic);
        let modal = document.getElementById("modalColoresMarca22");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "modalColoresMarca22";
            modal.className = "modal-backdrop";
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-window" style="max-width:600px; text-align:left;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-celeste">🎨 IDENTIDAD VISUAL</span>
                        <h3 style="margin-top:4px; color:var(--ink-900);">Colores de ${lic.nombreEntidad || "este Comercio"}</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cancelarModalColores22()">✕</button>
                </div>
                <p style="font-size:0.81rem; color:var(--ink-500); margin-bottom:0.85rem;">
                    Elegí una paleta rápida o un color exacto. Los cambios se previsualizan en vivo manteniendo intacto el Modo Día y Modo Noche.
                </p>
                ${construirHtmlControlesColor("liveBrand22", temaActual, true)}
                <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem;">
                    <button type="button" class="btn btn-ghost" onclick="cancelarModalColores22()">Cancelar</button>
                    <button type="button" class="btn btn-primary" onclick="guardarColoresRapidoComercio22()">💾 Guardar Colores</button>
                </div>
            </div>
        `;
        modal.classList.remove("hidden");
    };

    window.cancelarModalColores22 = function () {
        document.getElementById("modalColoresMarca22")?.classList.add("hidden");
        aplicarColoresMarcaComercio22();
    };

    window.guardarColoresRapidoComercio22 = async function () {
        const temaNuevo = {
            primario: hexValido(document.getElementById("liveBrand22Primario")?.value, TEMA_MARCA_DEFECTO.primario),
            secundario: hexValido(document.getElementById("liveBrand22Secundario")?.value, TEMA_MARCA_DEFECTO.secundario),
            estiloSidebar: document.getElementById("liveBrand22Sidebar")?.value || "oscuro_neutro"
        };

        const lic = obtenerLicenciaConfigCDM();
        lic.temaMarca = temaNuevo;
        guardarLicenciaConfigCDM(lic);
        aplicarColoresMarcaComercio22(temaNuevo);

        const clave = obtenerClaveClubActivoCDM();
        if (window.location.protocol !== "file:") {
            try {
                const respEst = await fetch(`/api/cdm/estado?club=${encodeURIComponent(clave)}`);
                if (respEst.ok) {
                    const dEst = await respEst.json();
                    const estActual = dEst.estado || {};
                    estActual.licenciaConfig = { ...(estActual.licenciaConfig || {}), ...lic, temaMarca: temaNuevo };
                    await fetch("/api/cdm/estado", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ...estActual, claveClub: clave })
                    });
                }
            } catch {}
        }

        document.getElementById("modalColoresMarca22")?.classList.add("hidden");
        if (typeof mostrarToast === "function") mostrarToast("🎨 Colores del comercio guardados.");
    };

    // Agregar botón "🎨 Colores" en la barra superior (nav-ui.js lo acomoda prolijo dentro de "Más")
    const _origBarraTop22 = inyectarBarraSesionTopbar;
    inyectarBarraSesionTopbar = function (sesion) {
        _origBarraTop22.apply(this, arguments);
        if (!sesion || sesion.rol !== "admin" || sesion.nivelAdmin === "staff") return;
        const barra = document.getElementById("cdmBarraSesionActiva");
        if (!barra || document.getElementById("btnColoresMarcaTopbar22")) return;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.id = "btnColoresMarcaTopbar22";
        btn.className = "btn btn-ghost btn-sm";
        btn.title = "Personalizar colores de marca de este comercio";
        btn.onclick = abrirModalColoresRapidoComercio22;
        btn.innerHTML = `<i class="ri-palette-line"></i> Colores`;
        barra.insertBefore(btn, barra.lastElementChild);
    };

    // Aplicar apenas carga el script y al terminar el DOM
    aplicarColoresMarcaComercio22();
    document.addEventListener("DOMContentLoaded", () => {
        aplicarColoresMarcaComercio22();
        setTimeout(aplicarColoresMarcaComercio22, 180);
    });
})();
// =========================================================================
// 23. RELOJ PRO DE ENTRENAMIENTO (SERIES 10s/15s, AMRAP, EMOM, TABATA + TIMBRE)
//     - Sonido Web Audio API (sin MP3): Aviso 10s, cuenta 3-2-1, timbre GO y timbre final
//     - 3 Modos: Libre/Series | AMRAP (con contador de rondas) | Intervalos/EMOM
//     - Corrige contraste de botones -15s/+15s y mantiene bloqueo fuera de Gym/Deportes
// Pegar al final de js/login.js (debajo del Bloque 22)
// =========================================================================
(function () {
    let audioCtxPro = null;

    function obtenerAudioCtx23() {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return null;
            if (!audioCtxPro) audioCtxPro = new Ctx();
            if (audioCtxPro.state === "suspended") audioCtxPro.resume();
            return audioCtxPro;
        } catch {
            return null;
        }
    }

    function tocarTono23(freq, inicioSeg, durSeg, tipo = "sine", vol = 0.28) {
        const ctx = obtenerAudioCtx23();
        if (!ctx) return;
        const t0 = ctx.currentTime + inicioSeg;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = tipo;
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(0.001, t0);
        gain.gain.linearRampToValueAtTime(vol, t0 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + durSeg);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + durSeg + 0.03);
    }

    function sonarTimbre23(evento) {
        if (!stReloj.sonido) return;
        try {
            if (evento === "pip321") {
                tocarTono23(880, 0, 0.13, "triangle", 0.25);
                if (navigator.vibrate) navigator.vibrate(60);
            } else if (evento === "aviso10s") {
                tocarTono23(740, 0, 0.14, "sine", 0.26);
                tocarTono23(740, 0.20, 0.16, "sine", 0.26);
                if (navigator.vibrate) navigator.vibrate([90, 70, 90]);
            } else if (evento === "aviso1min") {
                tocarTono23(660, 0, 0.18, "sine", 0.24);
                tocarTono23(880, 0.22, 0.22, "sine", 0.24);
                if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
            } else if (evento === "go") {
                // Timbre agudo de arranque / inicio de serie
                tocarTono23(1046.5, 0, 0.38, "triangle", 0.34);
                tocarTono23(1568, 0.02, 0.32, "sine", 0.22);
                if (navigator.vibrate) navigator.vibrate(220);
            } else if (evento === "pausa") {
                // Doble campana grave-media para descanso
                tocarTono23(587.3, 0, 0.26, "triangle", 0.30);
                tocarTono23(440, 0.22, 0.32, "triangle", 0.28);
                if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
            } else if (evento === "fin") {
                // Campana triple tipo gimnasio / boxeo al terminar
                [0, 0.24, 0.48].forEach(off => {
                    tocarTono23(987.7, off, 0.26, "triangle", 0.34);
                    tocarTono23(1480, off + 0.01, 0.22, "sine", 0.20);
                });
                if (navigator.vibrate) navigator.vibrate([220, 90, 220, 90, 320]);
            }
        } catch {}
    }

    const stReloj = {
        abierto: false,
        modo: "libre",        // 'libre' | 'amrap' | 'intervalo'
        corriendo: false,
        pausado: false,
        sonido: true,
        avisosPrevios: true,  // Aviso 10s + cuenta regresiva 3-2-1
        fase: "listo",        // 'listo' | 'prep' | 'trabajo' | 'descanso' | 'terminado'
        restante: 0,
        duracionFase: 0,
        rondaActual: 1,
        rondasTotal: 8,
        // Config AMRAP
        amrapMin: 10,
        amrapRondasHechas: 0,
        // Config Intervalos / EMOM
        intTrabajo: 20,
        intDescanso: 10,
        intRondas: 8,
        intEsEmom: false,
        timerId: null
    };

    function inyectarCSSRelojPro23() {
        if (document.getElementById("cdmCssRelojPro23")) return;
        const st = document.createElement("style");
        st.id = "cdmCssRelojPro23";
        st.textContent = `
            .cdm-droplet-popover.pro23 {
                width: 315px !important;
                max-width: calc(100vw - 24px) !important;
                padding: 0.95rem 1rem !important;
                background: #0b1628 !important;
                border: 1.5px solid rgba(56, 189, 248, 0.42) !important;
                color: #f8fafc !important;
            }
            .drp23-tabs {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 0.28rem;
                background: rgba(255, 255, 255, 0.06);
                border-radius: 11px;
                padding: 3px;
                margin: 0.45rem 0 0.65rem;
            }
            .drp23-tab {
                border: none;
                background: transparent;
                color: #94a3b8;
                font-size: 0.71rem;
                font-weight: 800;
                padding: 0.36rem 0.2rem;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.15s ease;
            }
            .drp23-tab.active {
                background: #0284c7;
                color: #ffffff;
                box-shadow: 0 3px 10px rgba(2, 132, 199, 0.4);
            }
            .drp23-phase-pill {
                display: inline-flex;
                align-items: center;
                gap: 0.35rem;
                font-size: 0.68rem;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.04em;
                padding: 0.18rem 0.6rem;
                border-radius: 999px;
                margin-bottom: 0.25rem;
            }
            .drp23-phase-pill.listo { background: rgba(148,163,184,0.18); color: #cbd5e1; }
            .drp23-phase-pill.prep { background: rgba(245,158,11,0.22); color: #fcd34d; }
            .drp23-phase-pill.trabajo { background: rgba(16,185,129,0.24); color: #34d399; }
            .drp23-phase-pill.descanso { background: rgba(56,189,248,0.22); color: #38bdf8; }
            .drp23-phase-pill.terminado { background: rgba(244,63,94,0.24); color: #fda4af; }

            .drp23-time {
                font-size: 2.35rem;
                font-weight: 900;
                line-height: 1.05;
                font-variant-numeric: tabular-nums;
                letter-spacing: -0.02em;
                color: #ffffff;
            }
            .drp23-time.urgente { color: #fb7185 !important; }
            .drp23-time.trabajo { color: #34d399; }
            .drp23-time.prep { color: #fcd34d; }

            .drp23-presets {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 0.32rem;
                margin: 0.55rem 0;
            }
            .drp23-chip {
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.18);
                color: #e2e8f0;
                font-size: 0.74rem;
                font-weight: 800;
                padding: 0.38rem 0.25rem;
                border-radius: 9px;
                cursor: pointer;
                transition: all 0.14s ease;
            }
            .drp23-chip:hover { background: #0284c7; border-color: #38bdf8; color: #ffffff; }
            .drp23-chip.short { border-color: rgba(250, 204, 21, 0.35); color: #fef08a; }

            .drp23-inputs-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 0.38rem;
                margin: 0.5rem 0;
            }
            .drp23-field label {
                display: block;
                font-size: 0.62rem;
                font-weight: 800;
                color: #94a3b8;
                text-transform: uppercase;
                margin-bottom: 3px;
            }
            .drp23-field input {
                width: 100%;
                min-height: 32px !important;
                padding: 0.2rem 0.45rem !important;
                background: rgba(255, 255, 255, 0.09) !important;
                border: 1px solid rgba(148, 163, 184, 0.32) !important;
                color: #ffffff !important;
                border-radius: 8px !important;
                font-weight: 800 !important;
                font-size: 0.82rem !important;
                text-align: center;
            }

            .drp23-ctrl-row {
                display: flex;
                gap: 0.35rem;
                align-items: center;
                margin-top: 0.55rem;
            }
            .drp23-btn {
                border: 1px solid rgba(255, 255, 255, 0.22);
                background: rgba(255, 255, 255, 0.10);
                color: #ffffff !important;
                font-size: 0.75rem;
                font-weight: 800;
                padding: 0.4rem 0.58rem;
                border-radius: 9px;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 0.3rem;
                transition: background 0.15s ease;
            }
            .drp23-btn:hover { background: rgba(255, 255, 255, 0.20); }
            .drp23-btn.primary { background: #0284c7; border-color: #38bdf8; }
            .drp23-btn.primary:hover { background: #0369a1; }
            .drp23-btn.ok { background: #059669; border-color: #34d399; }
            .drp23-btn.danger { background: rgba(244, 63, 94, 0.22); border-color: rgba(251, 113, 133, 0.55); color: #fecdd3 !important; }
            .drp23-btn.danger:hover { background: #e11d48; color: #ffffff !important; }
            .drp23-btn.icon-sm { padding: 0.24rem 0.45rem; font-size: 0.72rem; }

            .drp23-opts-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 0.35rem;
                margin-top: 0.55rem;
                padding-top: 0.5rem;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                font-size: 0.69rem;
                color: #cbd5e1;
            }
            .drp23-toggle {
                display: inline-flex;
                align-items: center;
                gap: 0.3rem;
                cursor: pointer;
                font-weight: 700;
            }
            .drp23-toggle input { width: 14px; height: 14px; min-height: auto !important; accent-color: #38bdf8; }

            .cdm-droplet-btn.phase-prep { background: linear-gradient(135deg, #d97706, #b45309) !important; border-color: #fde68a !important; }
            .cdm-droplet-btn.phase-trabajo { background: linear-gradient(135deg, #10b981, #047857) !important; border-color: #a7f3d0 !important; }
            .cdm-droplet-btn.phase-urgente { background: linear-gradient(135deg, #e11d48, #9f1239) !important; border-color: #fecdd3 !important; }
        `;
        document.head.appendChild(st);
    }

    function fmtMMSS23(seg) {
        const s = Math.max(0, Math.floor(Number(seg) || 0));
        const m = Math.floor(s / 60);
        const r = s % 60;
        return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
    }

    function limpiarIntervalo23() {
        if (stReloj.timerId) {
            clearInterval(stReloj.timerId);
            stReloj.timerId = null;
        }
    }

    function etiquetaFase23() {
        if (stReloj.fase === "prep") return "⏳ Preparados...";
        if (stReloj.fase === "trabajo") {
            if (stReloj.modo === "amrap") return `🔥 AMRAP • ${stReloj.amrapRondasHechas} rondas`;
            if (stReloj.modo === "intervalo") return `${stReloj.intEsEmom ? "⚡ EMOM" : "💪 TRABAJO"} • Ronda ${stReloj.rondaActual}/${stReloj.rondasTotal}`;
            return "⏱️ En curso";
        }
        if (stReloj.fase === "descanso") return `😮‍💨 DESCANSO • Ronda ${stReloj.rondaActual}/${stReloj.rondasTotal}`;
        if (stReloj.fase === "terminado") return "🏁 ¡Entrenamiento terminado!";
        return stReloj.modo === "amrap" ? "🔥 Modo AMRAP" : (stReloj.modo === "intervalo" ? "⚡ Intervalos / EMOM" : "⏱️ Series y Descanso");
    }

    function actualizarDisplayEnVivo23() {
        const tStr = fmtMMSS23(stReloj.restante);
        const pct = stReloj.duracionFase > 0
            ? Math.min(100, Math.max(0, Math.round(((stReloj.duracionFase - stReloj.restante) / stReloj.duracionFase) * 100)))
            : 0;
        const esUrgente = stReloj.corriendo && !stReloj.pausado && stReloj.restante > 0 && stReloj.restante <= 3;

        const elTime = document.getElementById("drp23DisplayTime");
        if (elTime) {
            elTime.textContent = tStr;
            elTime.className = `drp23-time ${esUrgente ? "urgente" : stReloj.fase}`;
        }
        const elPhase = document.getElementById("drp23PhasePill");
        if (elPhase) {
            elPhase.textContent = etiquetaFase23();
            elPhase.className = `drp23-phase-pill ${stReloj.fase}`;
        }
        const elBar = document.getElementById("drp23BarFill");
        if (elBar) {
            elBar.style.width = `${stReloj.fase === "listo" ? 0 : pct}%`;
            elBar.style.background = esUrgente ? "#fb7185" : (stReloj.fase === "trabajo" ? "#10b981" : (stReloj.fase === "prep" ? "#f59e0b" : "#38bdf8"));
        }
        const elFab = document.getElementById("drp23FabBtn");
        if (elFab) {
            elFab.className = `cdm-droplet-btn usr-action-allow ${esUrgente ? "phase-urgente" : (stReloj.corriendo ? `phase-${stReloj.fase} running` : "")}`;
            const txtFab = stReloj.corriendo
                ? (stReloj.modo === "intervalo" && stReloj.fase !== "prep" ? `${tStr} • R${stReloj.rondaActual}/${stReloj.rondasTotal}` : tStr)
                : "Reloj";
            const sp = elFab.querySelector("span");
            if (sp) sp.textContent = txtFab;
        }
    }

    function avanzarFase23() {
        // Fin de preparación 5s -> arranca trabajo
        if (stReloj.fase === "prep") {
            stReloj.fase = "trabajo";
            if (stReloj.modo === "amrap") {
                stReloj.duracionFase = Math.max(30, stReloj.amrapMin * 60);
                stReloj.restante = stReloj.duracionFase;
            } else {
                stReloj.rondaActual = 1;
                stReloj.rondasTotal = Math.max(1, stReloj.intRondas);
                stReloj.duracionFase = Math.max(5, stReloj.intTrabajo);
                stReloj.restante = stReloj.duracionFase;
            }
            sonarTimbre23("go");
            renderizarGotaRelojitoFlotanteCDM();
            return;
        }

        // Modo Libre o AMRAP -> terminó
        if (stReloj.modo === "libre" || stReloj.modo === "amrap") {
            limpiarIntervalo23();
            stReloj.corriendo = false;
            stReloj.pausado = false;
            stReloj.fase = "terminado";
            sonarTimbre23("fin");
            if (typeof mostrarToast === "function") {
                mostrarToast(stReloj.modo === "amrap"
                    ? `🏁 ¡AMRAP finalizado! Rondas completadas: ${stReloj.amrapRondasHechas}`
                    : "🔔 ¡Tiempo cumplido!");
            }
            renderizarGotaRelojitoFlotanteCDM();
            return;
        }

        // Modo Intervalos / Tabata / EMOM
        if (stReloj.fase === "trabajo") {
            if (stReloj.intDescanso > 0 && !stReloj.intEsEmom) {
                if (stReloj.rondaActual >= stReloj.rondasTotal) {
                    limpiarIntervalo23();
                    stReloj.corriendo = false;
                    stReloj.fase = "terminado";
                    sonarTimbre23("fin");
                    if (typeof mostrarToast === "function") mostrarToast("🏁 ¡Intervalos completados!");
                } else {
                    stReloj.fase = "descanso";
                    stReloj.duracionFase = stReloj.intDescanso;
                    stReloj.restante = stReloj.intDescanso;
                    sonarTimbre23("pausa");
                }
            } else {
                // EMOM o intervalos sin descanso: pasa directo a la siguiente ronda con timbre GO
                if (stReloj.rondaActual >= stReloj.rondasTotal) {
                    limpiarIntervalo23();
                    stReloj.corriendo = false;
                    stReloj.fase = "terminado";
                    sonarTimbre23("fin");
                    if (typeof mostrarToast === "function") mostrarToast("🏁 ¡EMOM completado!");
                } else {
                    stReloj.rondaActual++;
                    stReloj.duracionFase = Math.max(5, stReloj.intTrabajo);
                    stReloj.restante = stReloj.duracionFase;
                    sonarTimbre23("go");
                }
            }
            renderizarGotaRelojitoFlotanteCDM();
            return;
        }

        if (stReloj.fase === "descanso") {
            stReloj.rondaActual++;
            stReloj.fase = "trabajo";
            stReloj.duracionFase = Math.max(5, stReloj.intTrabajo);
            stReloj.restante = stReloj.duracionFase;
            sonarTimbre23("go");
            renderizarGotaRelojitoFlotanteCDM();
        }
    }

    function arrancarTick23() {
        limpiarIntervalo23();
        stReloj.timerId = setInterval(() => {
            if (stReloj.pausado) return;
            stReloj.restante--;

            if (stReloj.restante <= 0) {
                stReloj.restante = 0;
                actualizarDisplayEnVivo23();
                avanzarFase23();
                return;
            }

            // Avisos previos sonoros antes de terminar
            if (stReloj.avisosPrevios) {
                if (stReloj.restante === 60 && stReloj.modo === "amrap" && stReloj.duracionFase >= 120) {
                    sonarTimbre23("aviso1min");
                } else if (stReloj.restante === 10 && stReloj.duracionFase >= 20 && stReloj.fase !== "prep") {
                    sonarTimbre23("aviso10s");
                } else if (stReloj.restante <= 3 && stReloj.restante >= 1 && stReloj.duracionFase >= 5) {
                    sonarTimbre23("pip321");
                }
            }

            actualizarDisplayEnVivo23();
        }, 1000);
    }

    // --- API PÚBLICA DEL RELOJ ---
    window.cdmRelojPro = {
        probarTimbre() {
            obtenerAudioCtx23();
            const prev = stReloj.sonido;
            stReloj.sonido = true;
            sonarTimbre23("go");
            stReloj.sonido = prev;
        },
        cambiarModo(modo) {
            obtenerAudioCtx23();
            limpiarIntervalo23();
            stReloj.modo = modo;
            stReloj.corriendo = false;
            stReloj.pausado = false;
            stReloj.fase = "listo";
            stReloj.restante = modo === "amrap" ? stReloj.amrapMin * 60 : (modo === "intervalo" ? stReloj.intTrabajo : 0);
            stReloj.duracionFase = stReloj.restante;
            renderizarGotaRelojitoFlotanteCDM();
        },
        iniciarLibre(segundos) {
            obtenerAudioCtx23();
            const s = Math.max(5, parseInt(segundos, 10) || 15);
            stReloj.modo = "libre";
            stReloj.fase = "trabajo";
            stReloj.duracionFase = s;
            stReloj.restante = s;
            stReloj.corriendo = true;
            stReloj.pausado = false;
            sonarTimbre23("go");
            renderizarGotaRelojitoFlotanteCDM();
            arrancarTick23();
        },
        setAmrapMin(min) {
            stReloj.amrapMin = Math.max(1, Math.min(90, parseInt(min, 10) || 10));
            if (!stReloj.corriendo) {
                stReloj.restante = stReloj.amrapMin * 60;
                stReloj.duracionFase = stReloj.restante;
                actualizarDisplayEnVivo23();
            }
        },
        iniciarAmrap(minOpt = null) {
            obtenerAudioCtx23();
            if (minOpt) stReloj.amrapMin = parseInt(minOpt, 10) || stReloj.amrapMin;
            stReloj.modo = "amrap";
            stReloj.amrapRondasHechas = 0;
            stReloj.fase = "prep";
            stReloj.duracionFase = 5;
            stReloj.restante = 5;
            stReloj.corriendo = true;
            stReloj.pausado = false;
            renderizarGotaRelojitoFlotanteCDM();
            arrancarTick23();
        },
        sumarRondaAmrap(delta) {
            stReloj.amrapRondasHechas = Math.max(0, stReloj.amrapRondasHechas + delta);
            actualizarDisplayEnVivo23();
            const el = document.getElementById("drp23AmrapCount");
            if (el) el.textContent = stReloj.amrapRondasHechas;
        },
        aplicarPresetIntervalo(trab, desc, rondas, esEmom = false) {
            obtenerAudioCtx23();
            stReloj.intTrabajo = trab;
            stReloj.intDescanso = desc;
            stReloj.intRondas = rondas;
            stReloj.intEsEmom = esEmom;
            this.iniciarIntervalo();
        },
        actualizarInputIntervalo(campo, val) {
            const n = Math.max(0, parseInt(val, 10) || 0);
            stReloj[campo] = campo === "intDescanso" ? n : Math.max(1, n);
            if (campo === "intDescanso" && n > 0) stReloj.intEsEmom = false;
        },
        iniciarIntervalo() {
            obtenerAudioCtx23();
            stReloj.modo = "intervalo";
            stReloj.rondaActual = 1;
            stReloj.rondasTotal = Math.max(1, stReloj.intRondas);
            stReloj.fase = "prep";
            stReloj.duracionFase = 5;
            stReloj.restante = 5;
            stReloj.corriendo = true;
            stReloj.pausado = false;
            renderizarGotaRelojitoFlotanteCDM();
            arrancarTick23();
        },
        togglePausa() {
            if (!stReloj.corriendo) return;
            obtenerAudioCtx23();
            stReloj.pausado = !stReloj.pausado;
            renderizarGotaRelojitoFlotanteCDM();
        },
        toggleSonido(on) {
            stReloj.sonido = Boolean(on);
            if (stReloj.sonido) obtenerAudioCtx23();
        },
        toggleAvisos(on) {
            stReloj.avisosPrevios = Boolean(on);
        }
    };

    // Sobrescribir funciones globales del Bloque 9 manteniendo compatibilidad con Bloque 11
    window.alternarAperturaGotaRelojCDM = function () {
        obtenerAudioCtx23();
        stReloj.abierto = !stReloj.abierto;
        renderizarGotaRelojitoFlotanteCDM();
    };

    window.iniciarDescansoEnGotaRelojCDM = function (segundos) {
        window.cdmRelojPro.iniciarLibre(segundos);
    };

    window.ajustarTiempoGotaRelojCDM = function (delta) {
        stReloj.restante = Math.max(0, stReloj.restante + delta);
        stReloj.duracionFase = Math.max(stReloj.duracionFase, stReloj.restante);
        actualizarDisplayEnVivo23();
    };

    window.detenerGotaRelojCDM = function () {
        limpiarIntervalo23();
        stReloj.corriendo = false;
        stReloj.pausado = false;
        stReloj.fase = "listo";
        stReloj.restante = stReloj.modo === "amrap" ? stReloj.amrapMin * 60 : (stReloj.modo === "intervalo" ? stReloj.intTrabajo : 0);
        stReloj.duracionFase = stReloj.restante;
        renderizarGotaRelojitoFlotanteCDM();
    };

    window.renderizarGotaRelojitoFlotanteCDM = function () {
        inyectarCSSRelojPro23();
        const wrap = document.getElementById("cdmFloatingDropletClock");
        if (!wrap) return;

        let cuerpoModo = "";

        if (stReloj.modo === "libre") {
            cuerpoModo = `
                <small style="color:#94a3b8; font-size:0.68rem; font-weight:700; display:block; margin-top:0.3rem;">
                    Series cortas (timbre) o descanso libre:
                </small>
                <div class="drp23-presets">
                    <button type="button" class="drp23-chip short usr-action-allow" onclick="cdmRelojPro.iniciarLibre(10)">🔔 10s</button>
                    <button type="button" class="drp23-chip short usr-action-allow" onclick="cdmRelojPro.iniciarLibre(15)">🔔 15s</button>
                    <button type="button" class="drp23-chip short usr-action-allow" onclick="cdmRelojPro.iniciarLibre(20)">🔔 20s</button>
                    <button type="button" class="drp23-chip usr-action-allow" onclick="cdmRelojPro.iniciarLibre(30)">30s</button>
                    <button type="button" class="drp23-chip usr-action-allow" onclick="cdmRelojPro.iniciarLibre(45)">45s</button>
                    <button type="button" class="drp23-chip usr-action-allow" onclick="cdmRelojPro.iniciarLibre(60)">1 min</button>
                    <button type="button" class="drp23-chip usr-action-allow" onclick="cdmRelojPro.iniciarLibre(90)">1m 30s</button>
                    <button type="button" class="drp23-chip usr-action-allow" onclick="cdmRelojPro.iniciarLibre(120)">2 min</button>
                    <button type="button" class="drp23-chip usr-action-allow" onclick="cdmRelojPro.iniciarLibre(180)">3 min</button>
                </div>
            `;
        } else if (stReloj.modo === "amrap") {
            cuerpoModo = `
                <small style="color:#94a3b8; font-size:0.68rem; font-weight:700; display:block; margin-top:0.3rem;">
                    Duración del bloque AMRAP (incluye 5s prep + aviso final):
                </small>
                <div class="drp23-presets">
                    <button type="button" class="drp23-chip usr-action-allow" onclick="cdmRelojPro.iniciarAmrap(5)">5 min</button>
                    <button type="button" class="drp23-chip usr-action-allow" onclick="cdmRelojPro.iniciarAmrap(8)">8 min</button>
                    <button type="button" class="drp23-chip usr-action-allow" onclick="cdmRelojPro.iniciarAmrap(10)">10 min</button>
                    <button type="button" class="drp23-chip usr-action-allow" onclick="cdmRelojPro.iniciarAmrap(12)">12 min</button>
                    <button type="button" class="drp23-chip usr-action-allow" onclick="cdmRelojPro.iniciarAmrap(15)">15 min</button>
                    <button type="button" class="drp23-chip usr-action-allow" onclick="cdmRelojPro.iniciarAmrap(20)">20 min</button>
                </div>
                <div class="drp23-ctrl-row" style="margin-top:0.35rem;">
                    <div class="drp23-field" style="width:76px;">
                        <input type="number" min="1" max="90" value="${stReloj.amrapMin}" onchange="cdmRelojPro.setAmrapMin(this.value)" title="Minutos">
                    </div>
                    <button type="button" class="drp23-btn primary usr-action-allow" style="flex:1;" onclick="cdmRelojPro.iniciarAmrap()">▶ Iniciar AMRAP</button>
                </div>
                ${stReloj.corriendo || stReloj.fase === "terminado" ? `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(16,185,129,0.14); border:1px solid rgba(52,211,153,0.35); border-radius:10px; padding:0.4rem 0.65rem; margin-top:0.5rem;">
                        <span style="font-size:0.74rem; font-weight:800; color:#a7f3d0;">Rondas: <b id="drp23AmrapCount" style="font-size:1rem; color:#fff;">${stReloj.amrapRondasHechas}</b></span>
                        <div style="display:flex; gap:0.3rem;">
                            <button type="button" class="drp23-btn icon-sm usr-action-allow" onclick="cdmRelojPro.sumarRondaAmrap(-1)">-1</button>
                            <button type="button" class="drp23-btn ok icon-sm usr-action-allow" onclick="cdmRelojPro.sumarRondaAmrap(1)">+1 Ronda</button>
                        </div>
                    </div>
                ` : ""}
            `;
        } else {
            cuerpoModo = `
                <div class="drp23-presets">
                    <button type="button" class="drp23-chip short usr-action-allow" onclick="cdmRelojPro.aplicarPresetIntervalo(10, 20, 10, false)">10/20 ×10</button>
                    <button type="button" class="drp23-chip short usr-action-allow" onclick="cdmRelojPro.aplicarPresetIntervalo(15, 15, 8, false)">15/15 ×8</button>
                    <button type="button" class="drp23-chip usr-action-allow" onclick="cdmRelojPro.aplicarPresetIntervalo(20, 10, 8, false)">Tabata</button>
                    <button type="button" class="drp23-chip usr-action-allow" onclick="cdmRelojPro.aplicarPresetIntervalo(30, 30, 10, false)">HIIT 30/30</button>
                    <button type="button" class="drp23-chip usr-action-allow" onclick="cdmRelojPro.aplicarPresetIntervalo(40, 20, 8, false)">40/20 ×8</button>
                    <button type="button" class="drp23-chip usr-action-allow" onclick="cdmRelojPro.aplicarPresetIntervalo(60, 0, 10, true)">EMOM 10'</button>
                </div>
                <div class="drp23-inputs-grid">
                    <div class="drp23-field"><label>Trabajo (s)</label><input type="number" min="5" value="${stReloj.intTrabajo}" onchange="cdmRelojPro.actualizarInputIntervalo('intTrabajo', this.value)"></div>
                    <div class="drp23-field"><label>Pausa (s)</label><input type="number" min="0" value="${stReloj.intDescanso}" onchange="cdmRelojPro.actualizarInputIntervalo('intDescanso', this.value)"></div>
                    <div class="drp23-field"><label>Rondas</label><input type="number" min="1" value="${stReloj.intRondas}" onchange="cdmRelojPro.actualizarInputIntervalo('intRondas', this.value)"></div>
                </div>
                <button type="button" class="drp23-btn primary usr-action-allow" style="width:100%;" onclick="cdmRelojPro.iniciarIntervalo()">▶ Iniciar Intervalos (5s prep)</button>
            `;
        }

        const popoverHTML = stReloj.abierto ? `
            <div class="cdm-droplet-popover pro23" onclick="event.stopPropagation();">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem;">
                    <span style="font-size:0.71rem; font-weight:800; color:#38bdf8; text-transform:uppercase; letter-spacing:0.04em;">
                        ⏱️ Reloj Pro de Entrenamiento
                    </span>
                    <div style="display:flex; gap:0.25rem; align-items:center;">
                        <button type="button" class="drp23-btn icon-sm usr-action-allow" title="Probar sonido del timbre" onclick="cdmRelojPro.probarTimbre()">🔔</button>
                        <button type="button" class="drp23-btn icon-sm usr-action-allow" onclick="alternarAperturaGotaRelojCDM()">✕</button>
                    </div>
                </div>

                <div class="drp23-tabs">
                    <button type="button" class="drp23-tab usr-action-allow ${stReloj.modo === "libre" ? "active" : ""}" onclick="cdmRelojPro.cambiarModo('libre')">⏱️ Series</button>
                    <button type="button" class="drp23-tab usr-action-allow ${stReloj.modo === "amrap" ? "active" : ""}" onclick="cdmRelojPro.cambiarModo('amrap')">🔥 AMRAP</button>
                    <button type="button" class="drp23-tab usr-action-allow ${stReloj.modo === "intervalo" ? "active" : ""}" onclick="cdmRelojPro.cambiarModo('intervalo')">⚡ Intervalos</button>
                </div>

                <div style="text-align:center; padding:0.2rem 0 0.35rem;">
                    <span id="drp23PhasePill" class="drp23-phase-pill ${stReloj.fase}">${etiquetaFase23()}</span>
                    <div id="drp23DisplayTime" class="drp23-time ${stReloj.fase}">${fmtMMSS23(stReloj.restante)}</div>
                    <div style="height:6px; background:rgba(255,255,255,0.12); border-radius:99px; overflow:hidden; margin-top:0.45rem;">
                        <div id="drp23BarFill" style="height:100%; width:0%; background:#38bdf8; transition:width 0.25s ease;"></div>
                    </div>
                </div>

                ${cuerpoModo}

                <div class="drp23-ctrl-row">
                    ${stReloj.corriendo ? `
                        <button type="button" class="drp23-btn ok usr-action-allow" onclick="cdmRelojPro.togglePausa()">${stReloj.pausado ? "▶ Seguir" : "⏸ Pausa"}</button>
                    ` : ""}
                    <button type="button" class="drp23-btn usr-action-allow" onclick="ajustarTiempoGotaRelojCDM(-15)">-15s</button>
                    <button type="button" class="drp23-btn usr-action-allow" onclick="ajustarTiempoGotaRelojCDM(15)">+15s</button>
                    <button type="button" class="drp23-btn danger usr-action-allow" style="flex:1;" onclick="detenerGotaRelojCDM()">Reiniciar</button>
                </div>

                <div class="drp23-opts-bar">
                    <label class="drp23-toggle">
                        <input type="checkbox" ${stReloj.sonido ? "checked" : ""} onchange="cdmRelojPro.toggleSonido(this.checked)">
                        <span>🔊 Timbre</span>
                    </label>
                    <label class="drp23-toggle">
                        <input type="checkbox" ${stReloj.avisosPrevios ? "checked" : ""} onchange="cdmRelojPro.toggleAvisos(this.checked)">
                        <span>⏰ Aviso 10s + 3-2-1</span>
                    </label>
                </div>
            </div>
        ` : "";

        wrap.innerHTML = `
            ${popoverHTML}
            <button type="button" id="drp23FabBtn" class="cdm-droplet-btn usr-action-allow" onclick="alternarAperturaGotaRelojCDM()" title="Reloj Pro de Entrenamiento">
                <i class="ri-timer-flash-fill"></i>
                <span>Reloj</span>
            </button>
        `;
        actualizarDisplayEnVivo23();
    };

    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(() => {
            if (typeof asegurarGotaRelojitoFlotanteCDM === "function") asegurarGotaRelojitoFlotanteCDM();
        }, 280);
    });
})();
// =========================================================================
// 24. IDENTIDAD DE MARCA GLOBAL: G-SIS
//     - Cabecera horizontal integrada en login.html
//     - Sello en Hub SuperAdmin
//     - Pie de página centrado, elevado y destacado en todo el sistema
//     - Favicon SVG centrado + compatibilidad total Modo Día y Modo Noche
// Pegar al final de js/login.js (reemplazando el Bloque 24 anterior)
// =========================================================================
(function () {
    const USAR_IMAGEN_EN_LOGIN = false;
    const RUTA_IMAGEN_LOGIN = "img/gsis-logo.jpg";

    function svgIsotipoGSIS(size = 40, conFondo = false) {
        const bg = conFondo
            ? `<rect width="100" height="100" rx="22" fill="#0c192c"/>`
            : "";
        return `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" style="display:block; flex-shrink:0;" aria-label="G-SIS">
                <defs>
                    <linearGradient id="gsisGrad24" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#0284c7"/>
                        <stop offset="52%" stop-color="#0ea5e9"/>
                        <stop offset="100%" stop-color="#38bdf8"/>
                    </linearGradient>
                </defs>
                ${bg}
                <g transform="translate(50 50) skewX(-7) translate(-50 -50)" fill="url(#gsisGrad24)">
                    <path d="M58 17 H38 C24 17 17 25 17 39 V57 L28 49 V39 C28 31 32 27 40 27 H53 Z"/>
                    <path d="M64 17 H79 L73 29 H58 Z"/>
                    <path d="M18 64 L29 56 V61 C29 69 33 73 41 73 H59 C64 73 67 70 69 65 L72 56 H48 V46 H83 L78 67 C75 78 68 83 56 83 H38 C25 83 18 76 18 64 Z"/>
                </g>
            </svg>
        `.trim();
    }

    function inyectarCSSMarcaGSIS() {
        document.getElementById("cdmCssMarcaGSIS24")?.remove();
        const st = document.createElement("style");
        st.id = "cdmCssMarcaGSIS24";
        st.textContent = `
            /* === CABECERA HORIZONTAL INTEGRADA EN LOGIN === */
            .gsis-login-banner {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.9rem;
                padding: 1.05rem 1.25rem;
                margin-bottom: 1.25rem;
                border-radius: 18px;
                background:
                    radial-gradient(circle at 85% 15%, rgba(56, 189, 248, 0.22) 0%, transparent 55%),
                    linear-gradient(135deg, #091424 0%, #0f213a 58%, #0c192c 100%);
                border: 1px solid rgba(56, 189, 248, 0.24);
                box-shadow: 0 12px 26px -12px rgba(2, 132, 199, 0.45);
                text-align: left;
            }
            .gsis-login-emblem {
                width: 52px;
                height: 52px;
                border-radius: 14px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(56, 189, 248, 0.28);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                overflow: hidden;
            }
            .gsis-login-emblem img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .gsis-login-copy {
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 2px;
            }
            .gsis-wordmark {
                font-family: 'Poppins', system-ui, sans-serif;
                font-size: 1.68rem;
                font-weight: 900;
                letter-spacing: 0.09em;
                line-height: 1;
                color: #ffffff;
                margin: 0;
            }
            .gsis-wordmark .gsis-dash {
                color: #38bdf8;
            }
            .gsis-login-sub {
                font-size: 0.67rem;
                font-weight: 700;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                color: #94a3b8;
                margin: 3px 0 0 0;
            }

            /* === SELLO EN HUB SUPERADMIN === */
            .gsis-hub-bar {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                background: linear-gradient(135deg, #091424 0%, #10243f 100%);
                color: #ffffff;
                border: 1px solid rgba(56, 189, 248, 0.32);
                border-radius: 12px;
                padding: 0.36rem 0.85rem 0.36rem 0.5rem;
                font-size: 0.76rem;
                font-weight: 800;
                letter-spacing: 0.06em;
                margin-bottom: 0.75rem;
            }
            .gsis-hub-bar .gsis-dash { color: #38bdf8; }

            /* === PIE DE PÁGINA CENTRADO Y DESTACADO (G-SIS) === */
            @media (min-width: 1025px) {
                .app-main > .app-content {
                    padding-bottom: 0.75rem !important;
                }
            }
            .creator-footer-right {
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                width: 100% !important;
                margin-top: 0 !important;
                padding: 0.35rem 1rem 1.35rem !important;
                border-top: none !important;
            }
            .creator-badge-pill.gsis-split-pill {
                padding: 5px 20px 5px 5px !important;
                gap: 0.75rem !important;
                border-radius: 999px !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                flex-wrap: wrap !important;
                background: var(--surface-solid, #ffffff) !important;
                border: 1.5px solid rgba(2, 132, 199, 0.3) !important;
                box-shadow: 0 10px 24px -10px rgba(2, 132, 199, 0.28), 0 4px 10px -4px rgba(15, 23, 42, 0.1) !important;
                transition: transform 0.2s ease, box-shadow 0.2s ease !important;
            }
            .creator-badge-pill.gsis-split-pill:hover {
                transform: translateY(-2px);
                box-shadow: 0 14px 28px -10px rgba(2, 132, 199, 0.38) !important;
            }
            .gsis-footer-chip {
                display: inline-flex;
                align-items: center;
                gap: 0.42rem;
                background: linear-gradient(135deg, #091424 0%, #122845 100%);
                color: #ffffff;
                padding: 0.42rem 0.9rem 0.42rem 0.6rem;
                border-radius: 999px;
                border: 1px solid rgba(56, 189, 248, 0.38);
                font-size: 0.88rem;
                font-weight: 900;
                letter-spacing: 0.08em;
                line-height: 1;
                box-shadow: 0 4px 14px -4px rgba(2, 132, 199, 0.5);
            }
            .gsis-footer-chip .gsis-dash { color: #38bdf8; }
            .gsis-footer-author {
                font-size: 0.84rem;
                color: var(--ink-600, #475569);
                line-height: 1.2;
            }
            .gsis-footer-author b {
                color: var(--ink-900, #0f172a);
                font-weight: 800;
            }
            body[data-theme="dark"] .creator-badge-pill.gsis-split-pill {
                background: #0f172a !important;
                border-color: rgba(56, 189, 248, 0.34) !important;
                box-shadow: 0 10px 26px -10px rgba(2, 6, 23, 0.7) !important;
            }
            body[data-theme="dark"] .gsis-footer-author { color: #94a3b8; }
            body[data-theme="dark"] .gsis-footer-author b { color: #f8fafc; }

            @media (max-width: 640px) {
                .creator-footer-right {
                    margin-top: 0.25rem !important;
                    padding: 0.4rem 0.75rem 1rem !important;
                }
                .creator-badge-pill.gsis-split-pill {
                    padding: 5px 15px 5px 5px !important;
                    gap: 0.55rem !important;
                }
                .gsis-footer-chip {
                    font-size: 0.8rem;
                    padding: 0.36rem 0.72rem 0.36rem 0.5rem;
                }
                .gsis-footer-author {
                    font-size: 0.78rem;
                }
            }
        `;
        document.head.appendChild(st);
    }

    function aplicarFaviconYTituloGSIS() {
        const svgFav = svgIsotipoGSIS(64, true).replace(/\s+/g, " ");
        const dataUri = "data:image/svg+xml;utf8," + encodeURIComponent(svgFav);

        let linkIcon = document.querySelector('link[rel="icon"]');
        if (!linkIcon) {
            linkIcon = document.createElement("link");
            linkIcon.rel = "icon";
            document.head.appendChild(linkIcon);
        }
        linkIcon.type = "image/svg+xml";
        linkIcon.href = dataUri;

        const path = (window.location.pathname || "").toLowerCase();
        if (path.includes("login.html") || document.body?.classList.contains("login-page")) {
            document.title = "G-SIS | Plataforma de Gestión";
        } else if (document.title) {
            document.title = document.title.replace(/CDM\s*Pro\s*Suite/gi, "G-SIS");
        }
    }

    function aplicarMarcaEnLoginYHubGSIS() {
        const vistaLogin = document.getElementById("vistaLoginGenerico");
        if (vistaLogin && !document.getElementById("gsisLoginBrand24")) {
            const tabs = document.getElementById("btnTabUsuario")?.parentElement;
            if (tabs) {
                let prev = tabs.previousElementSibling;
                while (prev) {
                    if (prev.id !== "gsisLoginBrand24" && prev.id !== "cajaErrorLogin") {
                        prev.style.display = "none";
                    }
                    prev = prev.previousElementSibling;
                }
            }

            const banner = document.createElement("div");
            banner.id = "gsisLoginBrand24";
            banner.className = "gsis-login-banner";
            banner.innerHTML = `
                <div class="gsis-login-emblem">
                    ${USAR_IMAGEN_EN_LOGIN
                        ? `<img src="${RUTA_IMAGEN_LOGIN}" alt="G-SIS" onerror="this.parentElement.innerHTML=\`${svgIsotipoGSIS(38, false).replace(/"/g, "&quot;")}\`">`
                        : svgIsotipoGSIS(38, false)}
                </div>
                <div class="gsis-login-copy">
                    <h1 class="gsis-wordmark">G<span class="gsis-dash">-</span>SIS</h1>
                    <p class="gsis-login-sub">Sistema Integral de Gestión</p>
                </div>
            `;
            vistaLogin.prepend(banner);
        }

        const vistaHub = document.getElementById("vistaHubSuperAdmin");
        if (vistaHub && !document.getElementById("gsisHubBadge24")) {
            const bar = document.createElement("div");
            bar.id = "gsisHubBadge24";
            bar.className = "gsis-hub-bar";
            bar.innerHTML = `${svgIsotipoGSIS(22, false)}<span>G<span class="gsis-dash">-</span>SIS • PANEL CENTRAL</span>`;
            vistaHub.prepend(bar);
        }
    }

    function aplicarMarcaEnFooterGSIS() {
        document.querySelectorAll(".creator-badge-pill").forEach(pill => {
            if (pill.dataset.gsisReady === "3") return;
            pill.dataset.gsisReady = "3";
            pill.classList.add("gsis-split-pill");
            pill.innerHTML = `
                <span class="gsis-footer-chip">
                    ${svgIsotipoGSIS(20, false)}
                    <span>G<span class="gsis-dash">-</span>SIS</span>
                </span>
                <span class="gsis-footer-author">Desarrollado por <b>Gonzalo Adanchú</b></span>
            `;
        });
    }

    function inicializarMarcaGSIS() {
        inyectarCSSMarcaGSIS();
        aplicarFaviconYTituloGSIS();
        aplicarMarcaEnLoginYHubGSIS();
        aplicarMarcaEnFooterGSIS();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            inicializarMarcaGSIS();
            setTimeout(inicializarMarcaGSIS, 200);
        });
    } else {
        inicializarMarcaGSIS();
        setTimeout(inicializarMarcaGSIS, 200);
    }
})();
// =========================================================================
// 25. INTEGRACIÓN CLOUD EN LOGIN.JS: FINANZAS MONGODB, BACKUP REAL Y SYNC WA 24H
//     - Conecta finanzasMovimientos al cambiar de comercio y en snapshots locales
//     - Actualiza Backup / Restauración Individual (Bloque 17) a las claves reales
//       (Caja v35 + Consultorio/Gabinete v2 + Staff + Auditoría) con sync a MongoDB
//     - Persiste whatsappAuto24h (Bloque 20) en MongoDB al guardar el comercio
// Pegar al final de js/login.js (debajo del Bloque 24)
// =========================================================================
(function () {
    if (window.__cdmSyncCloudLogin25) return;
    window.__cdmSyncCloudLogin25 = true;

    function keyFinanzas25(claveClub) {
        return `cdm_finanzas_unif_v35_${claveClub || obtenerClaveClubActivoCDM()}`;
    }

    function keyConsultorio25(claveClub) {
        return `cdm_consultorio_suite_v2_${claveClub || obtenerClaveClubActivoCDM()}`;
    }

    // 1. Hidratar finanzasMovimientos al entrar a un comercio o loguearse
    if (typeof cargarEstadoClubEnLocalStorage === "function") {
        const _origCargarEstado25 = cargarEstadoClubEnLocalStorage;
        cargarEstadoClubEnLocalStorage = function (estadoClub, claveClub) {
            _origCargarEstado25.apply(this, arguments);
            if (!estadoClub || typeof estadoClub !== "object") return;
            const clave = claveClub || estadoClub.claveClub || CLAVE_CLUB_DEFECTO_CDM;

            if (Array.isArray(estadoClub.finanzasMovimientos)) {
                localStorage.setItem(keyFinanzas25(clave), JSON.stringify(estadoClub.finanzasMovimientos));
                if (typeof window.cargarFinanzasDesdeEstadoClub === "function") {
                    window.cargarFinanzasDesdeEstadoClub(estadoClub.finanzasMovimientos, clave);
                }
            }
        };
    }

    // 2. Guardar finanzasMovimientos en el snapshot local del comercio activo
    if (typeof guardarSnapshotClubActualEnMapaLocal === "function") {
        const _origGuardarSnap25 = guardarSnapshotClubActualEnMapaLocal;
        guardarSnapshotClubActualEnMapaLocal = function () {
            const mapa = _origGuardarSnap25.apply(this, arguments);
            const clave = obtenerClaveClubActivoCDM();
            if (mapa && mapa[clave]) {
                try {
                    const movs = JSON.parse(localStorage.getItem(keyFinanzas25(clave)) || "null");
                    if (Array.isArray(movs)) {
                        mapa[clave].finanzasMovimientos = movs;
                        localStorage.setItem(STORAGE_MAPA_CLUBES_KEY, JSON.stringify(mapa));
                    }
                } catch {}
            }
            return mapa;
        };
    }

    // 3. Persistir whatsappAuto24h (Bloque 20) también en MongoDB al guardar comercio
    if (typeof guardarComercioDesdeModal === "function") {
        const _origGuardarComercio25 = guardarComercioDesdeModal;
        guardarComercioDesdeModal = async function (e, claveClubExistente = "") {
            const swAuto = document.querySelector('.mc-feat-switch-14[data-grupo="general"][data-clave="whatsappAuto24h"]');
            const autoVal = Boolean(swAuto?.checked);
            const nombreInput = (document.getElementById("mcNombreEntidad")?.value || "").trim().toLowerCase();

            await _origGuardarComercio25.apply(this, arguments);

            if (window.location.protocol === "file:") return;
            const mapa = obtenerMapaLocalClubesCDM();
            let claveTarget = claveClubExistente;
            if (!claveTarget && nombreInput) {
                const match = Object.values(mapa).find(c => (c.licenciaConfig?.nombreEntidad || "").toLowerCase() === nombreInput);
                if (match) claveTarget = match.claveClub;
            }
            if (!claveTarget) return;

            try {
                const respEst = await fetch(`/api/cdm/estado?club=${encodeURIComponent(claveTarget)}`, { cache: "no-store" });
                if (!respEst.ok) return;
                const dEst = await respEst.json();
                const estActual = dEst.estado || {};
                const licPrev = estActual.licenciaConfig || {};
                const funcPrev = licPrev.funciones || {};
                estActual.licenciaConfig = {
                    ...licPrev,
                    ...(mapa[claveTarget]?.licenciaConfig || {}),
                    whatsappAuto24h: autoVal,
                    funciones: {
                        ...funcPrev,
                        ...(mapa[claveTarget]?.licenciaConfig?.funciones || {}),
                        general: {
                            ...(funcPrev.general || {}),
                            ...(mapa[claveTarget]?.licenciaConfig?.funciones?.general || {}),
                            whatsappAuto24h: autoVal
                        }
                    }
                };
                await fetch("/api/cdm/estado", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...estActual, claveClub: claveTarget })
                });
            } catch {}
        };
    }

    // 4. Backup Individual v2 (incluye Caja Unificada v35 + Consultorio/Gabinete v2 + Staff + Auditoría)
    window.exportarBackupIndividualComercio17 = async function (claveClub) {
        if (!claveClub) return;
        guardarSnapshotClubActualEnMapaLocal();
        const mapa = obtenerMapaLocalClubesCDM();
        let clubData = mapa[claveClub] ? { ...mapa[claveClub] } : null;

        // Intentar traer la versión más fresca de MongoDB si hay servidor activo
        if (window.location.protocol !== "file:") {
            try {
                const resp = await fetch(`/api/cdm/estado?club=${encodeURIComponent(claveClub)}`, { cache: "no-store" });
                if (resp.ok) {
                    const data = await resp.json();
                    if (data?.ok && data.estado) clubData = data.estado;
                }
            } catch {}
        }

        if (!clubData) {
            alert("No se encontraron datos guardados para este comercio.");
            return;
        }

        let consultorioV2 = clubData.consultorio || null;
        try {
            const locCons = JSON.parse(localStorage.getItem(keyConsultorio25(claveClub)) || "null");
            if (locCons && typeof locCons === "object" && !consultorioV2) consultorioV2 = locCons;
        } catch {}

        let finanzasV35 = Array.isArray(clubData.finanzasMovimientos) ? clubData.finanzasMovimientos : [];
        try {
            const locFin = JSON.parse(localStorage.getItem(keyFinanzas25(claveClub)) || "null");
            if (Array.isArray(locFin) && finanzasV35.length === 0) finanzasV35 = locFin;
        } catch {}

        let notasClub = [];
        try {
            const allNotas = JSON.parse(localStorage.getItem("cdm_notas_rapidas_pro_v23") || "{}");
            if (Array.isArray(allNotas[claveClub])) notasClub = allNotas[claveClub];
        } catch {}

        let pacientesUniversalesClub = {};
        try {
            const allUniv = JSON.parse(localStorage.getItem("cdm_registro_universal_pacientes_v19") || "{}");
            Object.entries(allUniv).forEach(([k, v]) => {
                if (v && (!v.claveClub || v.claveClub === claveClub)) pacientesUniversalesClub[k] = v;
            });
        } catch {}

        let cuposClub = null, arancelesClub = {};
        try { cuposClub = JSON.parse(localStorage.getItem(`cdm_gym_cupos_v26_${claveClub}`) || "null"); } catch {}
        try { arancelesClub = JSON.parse(localStorage.getItem(`cdm_aranceles_lote_v25_${claveClub}`) || "{}"); } catch {}

        const paqueteBackup = {
            tipoBackup: "COMERCIO_INDIVIDUAL_SAAS_V2",
            fechaExportacion: new Date().toISOString(),
            claveClub,
            nombreEntidad: clubData.licenciaConfig?.nombreEntidad || claveClub,
            datosPrincipales: {
                ...clubData,
                consultorio: consultorioV2,
                finanzasMovimientos: finanzasV35
            },
            extrasComercio: {
                consultorioSuiteV2: consultorioV2,
                finanzasUnificadasV35: finanzasV35,
                notasRapidas: notasClub,
                pacientesUniversales: pacientesUniversalesClub,
                gymCupos: cuposClub,
                arancelesLote: arancelesClub
            }
        };

        const hoy = new Date().toISOString().split("T")[0];
        const blob = new Blob([JSON.stringify(paqueteBackup, null, 2)], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `backup_${claveClub}_${hoy}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);

        if (typeof mostrarToast === "function") {
            mostrarToast(`💾 Backup completo de "${paqueteBackup.nombreEntidad}" descargado.`);
        }
    };

    // 5. Restauración Individual v2 (retrocompatible con v1 + sincroniza Caja y Consultorio con MongoDB)
    window.importarBackupIndividualComercio17 = function (event, claveClubDestino) {
        const file = event.target.files?.[0];
        if (!file || !claveClubDestino) return;

        const reader = new FileReader();
        reader.onload = async function (ev) {
            try {
                const parsed = JSON.parse(ev.target.result);
                const esPaquete = parsed && (parsed.tipoBackup === "COMERCIO_INDIVIDUAL_SAAS_V2" || parsed.tipoBackup === "COMERCIO_INDIVIDUAL_SAAS_V1") && parsed.datosPrincipales;
                const datosClub = esPaquete ? parsed.datosPrincipales : parsed;
                const ex = esPaquete ? (parsed.extrasComercio || {}) : {};

                if (!datosClub || typeof datosClub !== "object" || (!Array.isArray(datosClub.personas) && !datosClub.licenciaConfig)) {
                    throw new Error("El archivo no corresponde a una copia de seguridad válida.");
                }

                const mapa = obtenerMapaLocalClubesCDM();
                const nombreDestino = mapa[claveClubDestino]?.licenciaConfig?.nombreEntidad || claveClubDestino;
                if (!confirm(`⚠️ ¿Restaurar este backup únicamente dentro de "${nombreDestino}"?\n\nLos demás comercios de tu Hub NO se modificarán.`)) {
                    event.target.value = "";
                    return;
                }

                const licRestaurada = {
                    ...(mapa[claveClubDestino]?.licenciaConfig || {}),
                    ...(datosClub.licenciaConfig || {}),
                    claveClub: claveClubDestino
                };

                const consRestaurado = ex.consultorioSuiteV2 || datosClub.consultorio || ex.consultorio || {
                    pacientes: [], turnos: [], mutuales: [], profesionales: [], sesiones: [], derivaciones: []
                };
                const finRestauradas = Array.isArray(ex.finanzasUnificadasV35)
                    ? ex.finanzasUnificadasV35
                    : (Array.isArray(datosClub.finanzasMovimientos)
                        ? datosClub.finanzasMovimientos
                        : (Array.isArray(ex.cajaMovimientos) ? ex.cajaMovimientos : []));

                mapa[claveClubDestino] = {
                    claveClub: claveClubDestino,
                    ultimaActualizacionISO: new Date().toISOString(),
                    personas: Array.isArray(datosClub.personas) ? datosClub.personas : [],
                    rutinas: Array.isArray(datosClub.rutinas) ? datosClub.rutinas : [],
                    partidos: Array.isArray(datosClub.partidos) ? datosClub.partidos : [],
                    alineaciones: datosClub.alineaciones && typeof datosClub.alineaciones === "object" ? datosClub.alineaciones : {},
                    microciclos: datosClub.microciclos && typeof datosClub.microciclos === "object" ? datosClub.microciclos : {},
                    videoteca: Array.isArray(datosClub.videoteca) ? datosClub.videoteca : [],
                    catalogoEjercicios: Array.isArray(datosClub.catalogoEjercicios) ? datosClub.catalogoEjercicios : [],
                    consultorio: consRestaurado,
                    finanzasMovimientos: finRestauradas,
                    subAdmins: Array.isArray(datosClub.subAdmins) ? datosClub.subAdmins : [],
                    auditoria: Array.isArray(datosClub.auditoria) ? datosClub.auditoria : [],
                    licenciaConfig: licRestaurada
                };

                localStorage.setItem(STORAGE_MAPA_CLUBES_KEY, JSON.stringify(mapa));
                localStorage.setItem(keyConsultorio25(claveClubDestino), JSON.stringify(consRestaurado));
                localStorage.setItem(keyFinanzas25(claveClubDestino), JSON.stringify(finRestauradas));

                if (Array.isArray(ex.notasRapidas)) {
                    const allNotas = JSON.parse(localStorage.getItem("cdm_notas_rapidas_pro_v23") || "{}");
                    allNotas[claveClubDestino] = ex.notasRapidas;
                    localStorage.setItem("cdm_notas_rapidas_pro_v23", JSON.stringify(allNotas));
                }
                if (ex.pacientesUniversales && typeof ex.pacientesUniversales === "object") {
                    const allUniv = JSON.parse(localStorage.getItem("cdm_registro_universal_pacientes_v19") || "{}");
                    Object.entries(ex.pacientesUniversales).forEach(([k, v]) => {
                        allUniv[k] = { ...v, claveClub: claveClubDestino };
                    });
                    localStorage.setItem("cdm_registro_universal_pacientes_v19", JSON.stringify(allUniv));
                }
                if (Array.isArray(ex.gymCupos)) {
                    localStorage.setItem(`cdm_gym_cupos_v26_${claveClubDestino}`, JSON.stringify(ex.gymCupos));
                }
                if (ex.arancelesLote && typeof ex.arancelesLote === "object") {
                    localStorage.setItem(`cdm_aranceles_lote_v25_${claveClubDestino}`, JSON.stringify(ex.arancelesLote));
                }

                if (obtenerClaveClubActivoCDM() === claveClubDestino) {
                    cargarEstadoClubEnLocalStorage(mapa[claveClubDestino], claveClubDestino);
                }

                if (window.location.protocol !== "file:") {
                    try {
                        await fetch("/api/cdm/estado", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ...mapa[claveClubDestino], forzarConsultorio: true, forzarFinanzas: true })
                        });
                    } catch {}
                }

                alert(`✅ Backup completo restaurado en "${licRestaurada.nombreEntidad || nombreDestino}" (incluye Caja y Consultorio/Gabinete).`);
                await mostrarHubSelectorDeComercios();
            } catch (err) {
                alert("❌ Error al restaurar backup: " + err.message);
            } finally {
                event.target.value = "";
            }
        };
        reader.readAsText(file);
    };
    // 6. Blindar también eliminarPersonaDefinitivo para usuarios Staff sin permiso de borrado
    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(() => {
            if (typeof obtenerNivelAdminCDM === "function" && obtenerNivelAdminCDM() === "staff" &&
                typeof window.eliminarPersonaDefinitivo === "function" && !window.__cdmGuardElimDef25) {
                window.__cdmGuardElimDef25 = true;
                const _origElimDef = window.eliminarPersonaDefinitivo;
                window.eliminarPersonaDefinitivo = function () {
                    if (typeof tienePermisoAdminCDM === "function" && !tienePermisoAdminCDM("eliminar")) {
                        if (typeof mostrarToast === "function") mostrarToast("🔒 No tenés permiso para eliminar socios o jugadores.");
                        else alert("🔒 No tenés permiso para eliminar socios o jugadores.");
                        return;
                    }
                    return _origElimDef.apply(this, arguments);
                };
            }
        }, 300);
    });
})();
// =========================================================================
// 26. ELIMINACIÓN REAL DE COMERCIOS Y DEMOS DESDE EL HUB SUPERADMIN
//     - Botón "🗑️ Eliminar" directo en cada tarjeta del Hub y en Módulos/Editar
//     - Permite borrar cualquier demo (incluida la cuenta base inicial)
//     - Evita que guardarSnapshotClubActualEnMapaLocal resucite comercios borrados
//     - Limpia MongoDB, respaldo en disco y todas las claves satélites locales
// Pegar al final de js/login.js
// =========================================================================
(function () {
    if (window.__cdmEliminarComerciosPro26) return;
    window.__cdmEliminarComerciosPro26 = true;

    function esc26(s) {
        return String(s ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    // 1. No volver a crear CDM automáticamente si ya existe el mapa de comercios
    if (typeof obtenerMapaLocalClubesCDM === "function") {
        const _origMapa26 = obtenerMapaLocalClubesCDM;
        obtenerMapaLocalClubesCDM = function () {
            const raw = localStorage.getItem(STORAGE_MAPA_CLUBES_KEY);
            if (raw !== null) {
                try {
                    const parsed = JSON.parse(raw);
                    if (parsed && typeof parsed === "object") return parsed;
                } catch {}
            }
            return _origMapa26.apply(this, arguments);
        };
    }

    // 2. En el Hub (login.html) nunca resucitar un comercio recién borrado al hacer snapshot
    if (typeof guardarSnapshotClubActualEnMapaLocal === "function") {
        const _origSnap26 = guardarSnapshotClubActualEnMapaLocal;
        guardarSnapshotClubActualEnMapaLocal = function () {
            const enLogin = (window.location.pathname || "").toLowerCase().includes("login.html") ||
                document.body?.classList.contains("login-page");
            if (enLogin) {
                const mapa = obtenerMapaLocalClubesCDM();
                const claveAct = localStorage.getItem(STORAGE_CLUB_ACTIVO_KEY);
                if (!claveAct || !mapa[claveAct]) {
                    return mapa;
                }
            }
            return _origSnap26.apply(this, arguments);
        };
    }

    function limpiarClavesLocalesDeComercio26(claveClub) {
        if (!claveClub) return;
        const mapa = obtenerMapaLocalClubesCDM();
        delete mapa[claveClub];
        localStorage.setItem(STORAGE_MAPA_CLUBES_KEY, JSON.stringify(mapa));

        // Limpiar módulos satélites del comercio borrado
        [
            `cdm_consultorio_suite_v2_${claveClub}`,
            `cdm_finanzas_unif_v35_${claveClub}`,
            `cdm_caja_movs_v25_${claveClub}`,
            `cdm_subadmins_v1_${claveClub}`,
            `cdm_auditoria_v1_${claveClub}`,
            `cdm_gym_cupos_v26_${claveClub}`,
            `cdm_aranceles_lote_v25_${claveClub}`,
            `cdm_popup_notas_auto_v1_${claveClub}`
        ].forEach(k => localStorage.removeItem(k));

        try {
            const notas = JSON.parse(localStorage.getItem("cdm_notas_rapidas_pro_v23") || "{}");
            if (notas && notas[claveClub]) {
                delete notas[claveClub];
                localStorage.setItem("cdm_notas_rapidas_pro_v23", JSON.stringify(notas));
            }
        } catch {}

        try {
            const univ = JSON.parse(localStorage.getItem("cdm_registro_universal_pacientes_v19") || "{}");
            let cambio = false;
            Object.keys(univ).forEach(k => {
                if (univ[k]?.claveClub === claveClub) {
                    delete univ[k];
                    cambio = true;
                }
            });
            if (cambio) localStorage.setItem("cdm_registro_universal_pacientes_v19", JSON.stringify(univ));
        } catch {}

        // Si era el comercio activo en este navegador, cambiar al siguiente disponible o limpiar caché
        if (localStorage.getItem(STORAGE_CLUB_ACTIVO_KEY) === claveClub) {
            const restantes = Object.keys(mapa);
            if (restantes.length > 0) {
                localStorage.setItem(STORAGE_CLUB_ACTIVO_KEY, restantes[0]);
                if (typeof cargarEstadoClubEnLocalStorage === "function" && mapa[restantes[0]]) {
                    cargarEstadoClubEnLocalStorage(mapa[restantes[0]], restantes[0]);
                }
            } else {
                localStorage.removeItem(STORAGE_CLUB_ACTIVO_KEY);
                ["cdm_personas_v1", "cdm_rutinas_v1", "cdm_partidos_v1", "cdm_alineaciones_v2", "cdm_microciclos_v1", STORAGE_LICENCIA_KEY].forEach(k => {
                    localStorage.removeItem(k);
                });
            }
        }
    }

    // 3. Modal limpio de confirmación para eliminar cualquier comercio/demo
    window.abrirModalConfirmarEliminarComercio26 = async function (claveClub) {
        if (!claveClub) return;
        const lista = await obtenerListaCompletaComerciosCDM();
        const item = lista.find(c => c.claveClub === claveClub) || { claveClub, licenciaConfig: {} };
        const lic = item.licenciaConfig || {};
        const nombre = lic.nombreEntidad || claveClub;
        const esReal = lic.tipoCuenta === "real";
        const cantActivos = Number(item.cantidadPersonas || 0);

        let modal = document.getElementById("modalEliminarComercio26");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "modalEliminarComercio26";
            modal.className = "modal-backdrop";
            modal.style.zIndex = "99999";
            modal.onclick = (e) => { if (e.target === modal) modal.classList.add("hidden"); };
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-window" style="max-width:460px; text-align:left;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-danger">🗑️ ELIMINAR COMERCIO / DEMO</span>
                        <h3 style="margin-top:4px; color:var(--ink-900);">${esc26(nombre)}</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('modalEliminarComercio26').classList.add('hidden')">✕</button>
                </div>

                <div style="background:rgba(239,68,68,0.08); border:1.5px solid rgba(239,68,68,0.35); border-radius:14px; padding:0.8rem 0.95rem; margin-bottom:0.9rem; font-size:0.82rem; line-height:1.45;">
                    <div><b>Entorno:</b> ${esReal ? "🔒 SISTEMA REAL" : "🎁 MODO DEMO"} • <b>Registros activos:</b> ${cantActivos}</div>
                    <div style="margin-top:4px; color:#b91c1c; font-weight:700;">
                        Esta acción borra permanentemente el comercio, sus socios/pacientes, rutinas, consultorio y caja de MongoDB y de este dispositivo.
                    </div>
                </div>

                ${esReal ? `
                    <div class="field" style="margin-bottom:0.9rem;">
                        <label>Por ser una cuenta REAL, escribí <b>ELIMINAR</b> para confirmar *</label>
                        <input type="text" id="inpConfirmEliminarReal26" placeholder="ELIMINAR" autocomplete="off">
                    </div>
                ` : ""}

                <div id="msgErrEliminar26" style="font-size:0.78rem; font-weight:700; color:#dc2626; margin-bottom:0.6rem;"></div>

                <div style="display:flex; justify-content:flex-end; gap:0.45rem;">
                    <button type="button" class="btn btn-ghost" onclick="document.getElementById('modalEliminarComercio26').classList.add('hidden')">Cancelar</button>
                    <button type="button" id="btnExecEliminarComercio26" class="btn btn-danger" onclick="ejecutarEliminacionComercio26('${esc26(claveClub)}', ${esReal ? "true" : "false"})">
                        🗑️ Sí, Eliminar Definitivamente
                    </button>
                </div>
            </div>
        `;
        modal.classList.remove("hidden");
    };

    window.ejecutarEliminacionComercio26 = async function (claveClub, esReal) {
        const msgEl = document.getElementById("msgErrEliminar26");
        const btn = document.getElementById("btnExecEliminarComercio26");

        if (esReal) {
            const val = (document.getElementById("inpConfirmEliminarReal26")?.value || "").trim().toUpperCase();
            if (val !== "ELIMINAR") {
                if (msgEl) msgEl.textContent = "⚠️ Escribí exactamente ELIMINAR para confirmar.";
                return;
            }
        }

        if (btn) { btn.disabled = true; btn.textContent = "⏳ Eliminando..."; }
        if (msgEl) msgEl.textContent = "";

        if (window.location.protocol !== "file:") {
            try {
                const resp = await fetch(`/api/cdm/clubes/${encodeURIComponent(claveClub)}`, { method: "DELETE" });
                const data = await resp.json().catch(() => ({}));
                if (!resp.ok || !data.ok) {
                    if (msgEl) msgEl.textContent = "❌ El servidor rechazó la eliminación: " + (data.error || `HTTP ${resp.status}`);
                    if (btn) { btn.disabled = false; btn.textContent = "🗑️ Sí, Eliminar Definitivamente"; }
                    return;
                }
            } catch (err) {
                if (msgEl) msgEl.textContent = "❌ Sin conexión con el servidor: " + err.message;
                if (btn) { btn.disabled = false; btn.textContent = "🗑️ Sí, Eliminar Definitivamente"; }
                return;
            }
        }

        limpiarClavesLocalesDeComercio26(claveClub);
        document.getElementById("modalEliminarComercio26")?.classList.add("hidden");
        document.getElementById("modalSuperAdminCDM")?.classList.add("hidden");

        if (typeof mostrarToast === "function") mostrarToast("🗑️ Comercio eliminado definitivamente.");
        await mostrarHubSelectorDeComercios();
    };

    // Reemplazar también la función vieja del modal "Módulos / Editar"
    window.eliminarComercioDesdeModal = function (claveClub) {
        abrirModalConfirmarEliminarComercio26(claveClub);
    };

    // 4. Asegurar que el botón "Eliminar Comercio" aparezca en el modal Módulos / Editar incluso para la cuenta base
    const _origAbrirModal26 = abrirModalCrearOEditarComercio;
    abrirModalCrearOEditarComercio = async function (claveClubEditar = null) {
        await _origAbrirModal26.apply(this, arguments);
        if (!claveClubEditar) return;
        const modal = document.getElementById("modalSuperAdminCDM");
        const pie = modal?.querySelector("form > div:last-child");
        if (!pie || pie.querySelector('button[onclick*="eliminarComercioDesdeModal"]')) return;

        const btnDel = document.createElement("button");
        btnDel.type = "button";
        btnDel.className = "btn btn-danger btn-sm";
        btnDel.innerHTML = `<i class="ri-delete-bin-line"></i> Eliminar Comercio`;
        btnDel.onclick = () => abrirModalConfirmarEliminarComercio26(claveClubEditar);
        if (pie.firstElementChild?.tagName === "SPAN") pie.firstElementChild.replaceWith(btnDel);
        else pie.prepend(btnDel);
    };

    // 5. Agregar botón "🗑️ Eliminar" directo en cada tarjeta del Hub SuperAdmin
    const _origMostrarHub26 = mostrarHubSelectorDeComercios;
    mostrarHubSelectorDeComercios = async function () {
        await _origMostrarHub26.apply(this, arguments);
        const grid = document.getElementById("gridTarjetasComerciosHub");
        if (!grid) return;

        const lista = await obtenerListaCompletaComerciosCDM();
        if (!lista.length) {
            grid.innerHTML = `<div class="empty-box" style="grid-column:1/-1; padding:1.5rem;">No hay comercios cargados. Tocá <b>+ Nuevo Club / Gimnasio</b> arriba para crear uno.</div>`;
            return;
        }

        grid.querySelectorAll(".hub-comercio-card").forEach((card, idx) => {
            if (card.querySelector(".hub-btn-eliminar-26")) return;
            const btnAbrir = card.querySelector('button[onclick*="entrarAComercioDesdeHub("]');
            const m = (btnAbrir?.getAttribute("onclick") || "").match(/entrarAComercioDesdeHub\('([^']+)'\)/);
            const clave = m ? m[1] : lista[idx]?.claveClub;
            if (!clave) return;

            const pie = card.lastElementChild;
            if (!pie) return;

            const btnDel = document.createElement("button");
            btnDel.type = "button";
            btnDel.className = "btn btn-danger btn-sm hub-btn-eliminar-26";
            btnDel.style.cssText = "width:100%; font-size:0.72rem; min-height:29px; margin-top:2px;";
            btnDel.innerHTML = `<i class="ri-delete-bin-line"></i> Eliminar Comercio / Demo`;
            btnDel.onclick = () => abrirModalConfirmarEliminarComercio26(clave);
            pie.appendChild(btnDel);
        });
    };
})();