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
        e.clipboardData?.setData("text/plain", "🔒 Contenido protegido — CDM Adelia María");
        e.preventDefault();
    });
    document.addEventListener("cut", (e) => e.preventDefault());
    document.addEventListener("dragstart", (e) => e.preventDefault());

    // 4. Crear escudo anti-captura (se activa al ocultar pestaña o tocar teclas de captura, pero NO al usar inputs ni ver videos)
    let shield = document.getElementById("cdmAntiCaptureShield");
    if (!shield) {
        shield = document.createElement("div");
        shield.id = "cdmAntiCaptureShield";
        shield.innerHTML = `
            <div style="text-align:center; padding:2.2rem; max-width:390px; background:rgba(13,24,41,0.92); border:1px solid rgba(56,189,248,0.3); border-radius:24px; box-shadow:0 24px 48px rgba(0,0,0,0.6);">
                <i class="ri-shield-keyhole-fill" style="font-size:3rem; color:#38bdf8;"></i>
                <h3 style="color:#ffffff; margin-top:0.6rem; font-size:1.22rem;">Contenido Protegido</h3>
                <p style="color:#94a3b8; font-size:0.84rem; margin-top:0.45rem; line-height:1.5;">
                    Por privacidad del Club Deportivo Municipal, la pantalla se protege automáticamente ante intentos de captura o cambio de aplicación.
                </p>
                <button type="button" class="btn btn-primary btn-sm" style="margin-top:1.1rem; width:100%;" onclick="document.getElementById('cdmAntiCaptureShield').classList.remove('active')">
                    Continuar en mi Panel
                </button>
            </div>
        `;
        document.body.appendChild(shield);
    }

    const desactivarEscudo = () => shield.classList.remove("active");

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) shield.classList.add("active");
        else desactivarEscudo();
    });

    window.addEventListener("blur", () => {
        setTimeout(() => {
            if (document.activeElement && document.activeElement.tagName === "IFRAME") return;
            if (document.hidden) shield.classList.add("active");
        }, 120);
    });
    window.addEventListener("focus", desactivarEscudo);

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
                navigator.clipboard.writeText("🔒 Captura bloqueada por CDM Adelia María").catch(() => {});
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
    const p = personas.find(x => x.id === idPersona);
    if (!p) return;

    const tel = (p.whatsapp || "").replace(/\D/g, "");
    let msg = `💙🤍 *CREDENCIAL DE INGRESO OFICIAL — CDM ADELIA MARÍA*\n`;
    msg += `----------------------------------\n`;
    msg += `Hola *${p.nombre}*, acá tenés tu código personal único para entrar a la plataforma del Club:\n\n`;
    msg += `🔑 *TU CÓDIGO PERSONAL:* *${p.codigoAcceso}*\n\n`;
    msg += `📲 *¿Qué podés hacer con tu código?*\n`;
    msg += `• Ver tus rutinas con videos técnicos y cargar tus propios avances de peso/marca.\n`;
    msg += `• Seguir tu curva de evolución física, radar 360° y tabla de cargas (% 1RM).\n`;
    msg += `• Consultar la Videoteca completa y el Ranking oficial.\n`;
    msg += `----------------------------------\n`;
    msg += `_Al abrir la App, elegí "Deportista / Socio" e ingresá tu código ${p.codigoAcceso}._`;

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
// 9. EXTENSIÓN OFICIAL: DISCRIMINACIÓN DE MÓDULOS (DEPORTES, GIMNASIO, KINESIOLOGÍA,
//    QUIROPRAXIA, PSICOLOGÍA, NUTRICIÓN) + BLOQUEO DE COBRANZA POR COMERCIO
// Pegar al final de login.js (reemplazando el Bloque 9 anterior)
// =========================================================================

const CATALOGO_PROFESIONES_BASE_SAAS = [
    { clave: "Quiropraxia", icono: "🦴", nombre: "Quiropraxia" },
    { clave: "Kinesiología", icono: "🦿", nombre: "Kinesiología" },
    { clave: "Psicología", icono: "🧠", nombre: "Psicología" },
    { clave: "Nutrición", icono: "🥗", nombre: "Nutrición" }
];

function estaCobranzaBloqueadaEnComercioActualCDM() {
    try {
        const lic = obtenerLicenciaConfigCDM();
        return Boolean(lic && lic.bloquearCobranza === true);
    } catch {
        return false;
    }
}

function obtenerProfesionesHabilitadasComercioActualCDM() {
    try {
        const lic = obtenerLicenciaConfigCDM();
        if (Array.isArray(lic?.profesionesHabilitadas)) {
            return lic.profesionesHabilitadas;
        }
    } catch {}
    return ["Quiropraxia", "Kinesiología", "Psicología", "Nutrición"];
}

function sincronizarAtributoCobranzaBodyCDM() {
    if (!document.body) return;
    const bloqueada = estaCobranzaBloqueadaEnComercioActualCDM();
    document.body.setAttribute("data-cobranza", bloqueada ? "bloqueada" : "activa");

    const btnTop = document.getElementById("btnQuickToggleCobranzaTopbar");
    if (btnTop) {
        btnTop.innerHTML = bloqueada
            ? `<i class="ri-lock-2-fill"></i><span>Cobranza: Bloqueada</span>`
            : `<i class="ri-bank-card-line"></i><span>Cobranza: Activa</span>`;
        btnTop.style.borderColor = bloqueada ? "rgba(244,63,94,0.4)" : "rgba(16,185,129,0.4)";
        btnTop.style.color = bloqueada ? "var(--err-ink)" : "var(--ok-ink)";
    }
}

// 1. Extender obtenerLicenciaConfigCDM con soporte nativo para profesionesHabilitadas y modulos.consultorio
const _origObtenerLicenciaConfigCDM = obtenerLicenciaConfigCDM;
obtenerLicenciaConfigCDM = function () {
    const lic = _origObtenerLicenciaConfigCDM.apply(this, arguments);
    lic.bloquearCobranza = Boolean(lic.bloquearCobranza);
    if (!lic.modulos) lic.modulos = { futbol: true, hockey: true, gym: true, consultorio: true };
    if (!Array.isArray(lic.profesionesHabilitadas)) {
        lic.profesionesHabilitadas = ["Quiropraxia", "Kinesiología", "Psicología", "Nutrición"];
    }
    if (lic.modulos.consultorio === undefined) {
        lic.modulos.consultorio = lic.profesionesHabilitadas.length > 0;
    }
    return lic;
};

// 2. Aplicar discriminación estricta de Módulos (Deportes, Gym, Profesiones) en Sidebar e Index
const _origAplicarLicenciaYModulosCDM = aplicarLicenciaYModulosCDM;
aplicarLicenciaYModulosCDM = function () {
    _origAplicarLicenciaYModulosCDM.apply(this, arguments);
    sincronizarAtributoCobranzaBodyCDM();

    const lic = obtenerLicenciaConfigCDM();
    const mod = lic.modulos || { futbol: true, hockey: true, gym: true, consultorio: true };
    const profs = Array.isArray(lic.profesionesHabilitadas) ? lic.profesionesHabilitadas : [];
    const tieneConsultorio = Boolean(mod.consultorio && profs.length > 0);
    const tieneDeportesOGym = Boolean(mod.futbol || mod.hockey || mod.gym || (Array.isArray(lic.deportesExtra) && lic.deportesExtra.length > 0));

    // Mostrar u ocultar accesos de Consultorio según la configuración del comercio
    const linkCons = document.querySelector('.app-sidebar .side-link[data-nav="consultorio"]');
    if (linkCons) linkCons.classList.toggle("hidden", !tieneConsultorio);

    const cardCons = document.getElementById("cardShowcaseConsultorioPro");
    if (cardCons) cardCons.classList.toggle("hidden", !tieneConsultorio);

    // Si el comercio es EXCLUSIVAMENTE un Consultorio Profesional (ej: Solo Kinesiología o Solo Quiropraxia),
    // ocultar enlaces deportivos vacíos y abrir directo su Consultorio al entrar al sistema
    if (tieneConsultorio && !tieneDeportesOGym) {
        document.querySelectorAll('.app-sidebar .side-link[data-nav="inicio"], .app-sidebar .side-link[data-nav="futbol"], .app-sidebar .side-link[data-nav="hockey"], .app-sidebar .side-link[data-nav="gym"]').forEach(el => {
            el.classList.add("hidden");
        });
        if (typeof abrirModuloConsultorioIndependienteCDM === "function" && !window.__cdmAutoOpenedConsultorio) {
            window.__cdmAutoOpenedConsultorio = true;
            setTimeout(() => abrirModuloConsultorioIndependienteCDM(), 80);
        }
    }

    if (typeof aplicarReglasVisualesCobranzaEnDOM === "function") {
        aplicarReglasVisualesCobranzaEnDOM();
    }
};

// 3. Alternar bloqueo de cobranza desde el Hub o Topbar
async function alternarBloqueoCobranzaComercioCDM(claveClub, forzarEstado = null) {
    const clave = claveClub || obtenerClaveClubActivoCDM();
    const mapa = obtenerMapaLocalClubesCDM();

    if (mapa[clave] && mapa[clave].licenciaConfig) {
        const actual = Boolean(mapa[clave].licenciaConfig.bloquearCobranza);
        const nuevo = forzarEstado !== null ? Boolean(forzarEstado) : !actual;
        mapa[clave].licenciaConfig.bloquearCobranza = nuevo;
        localStorage.setItem(STORAGE_MAPA_CLUBES_KEY, JSON.stringify(mapa));

        if (obtenerClaveClubActivoCDM() === clave) {
            const licActiva = obtenerLicenciaConfigCDM();
            licActiva.bloquearCobranza = nuevo;
            guardarLicenciaConfigCDM(licActiva);
        }

        sincronizarAtributoCobranzaBodyCDM();
        if (typeof mostrarToast === "function") {
            mostrarToast(nuevo
                ? `🔒 Cobranza bloqueada para ${mapa[clave].licenciaConfig.nombreEntidad || clave}.`
                : `💳 Cobranza habilitada para ${mapa[clave].licenciaConfig.nombreEntidad || clave}.`);
        }
    }

    const enLogin = window.location.pathname.toLowerCase().includes("login.html") || document.body.classList.contains("login-page");
    if (enLogin && !document.getElementById("vistaHubSuperAdmin")?.classList.contains("hidden")) {
        await mostrarHubSelectorDeComercios();
    } else if (!enLogin) {
        if (typeof aplicarReglasVisualesCobranzaEnDOM === "function") aplicarReglasVisualesCobranzaEnDOM();
    }
}

async function alternarBloqueoCobranzaTodosLosComerciosHub(bloquearTodos) {
    const lista = await obtenerListaCompletaComerciosCDM();
    for (const c of lista) {
        await alternarBloqueoCobranzaComercioCDM(c.claveClub, bloquearTodos);
    }
}

// 4. Mostrar en cada tarjeta del Hub qué Deportes, Gimnasio y Profesiones (Kinesiología, Quiropraxia, etc.) tiene habilitados
const _origMostrarHubSelectorDeComercios = mostrarHubSelectorDeComercios;
mostrarHubSelectorDeComercios = async function () {
    await _origMostrarHubSelectorDeComercios.apply(this, arguments);
    const grid = document.getElementById("gridTarjetasComerciosHub");
    const vistaHub = document.getElementById("vistaHubSuperAdmin");
    if (!grid || !vistaHub) return;

    const lista = await obtenerListaCompletaComerciosCDM();
    const todosBloqueados = lista.length > 0 && lista.every(c => Boolean(c.licenciaConfig?.bloquearCobranza));

    let masterBar = document.getElementById("hubBarraMaestraCobranza");
    if (!masterBar) {
        masterBar = document.createElement("div");
        masterBar.id = "hubBarraMaestraCobranza";
        masterBar.className = "hub-cobranza-master-bar";
        grid.parentNode.insertBefore(masterBar, grid);
    }

    masterBar.innerHTML = `
        <div>
            <strong style="font-size:0.9rem; color:#0f172a; display:flex; align-items:center; gap:0.4rem;">
                <i class="ri-shield-keyhole-line" style="color:#0284c7; font-size:1.1rem;"></i>
                BLOQUEAR COBRANZA (Comercios con otro sistema)
            </strong>
            <small style="color:#64748b; font-size:0.75rem;">
                Podés bloquear u ocultar la parte de cuotas y caja a todos o individualmente en cada comercio o consultorio.
            </small>
        </div>
        <label class="cdm-switch-wrap">
            <span style="color:${todosBloqueados ? '#64748b' : '#047857'};">${todosBloqueados ? 'BLOQUEADO (OFF)' : 'ACTIVO (ON)'}</span>
            <input type="checkbox" class="cdm-switch-input" ${todosBloqueados ? "checked" : ""} onchange="alternarBloqueoCobranzaTodosLosComerciosHub(this.checked)">
            <span class="cdm-switch-slider"></span>
        </label>
    `;

    grid.innerHTML = lista.map(c => {
        const lic = c.licenciaConfig || {};
        const mod = lic.modulos || { futbol: true, hockey: true, gym: true, consultorio: true };
        const profs = Array.isArray(lic.profesionesHabilitadas) ? lic.profesionesHabilitadas : [];
        const nombre = lic.nombreEntidad || c.claveClub;
        const sub = lic.subtituloEntidad || "Sede Oficial";
        const sigla = (lic.siglaCodigo || "CDM").toUpperCase();
        const userComercio = lic.adminUsuario === "admin" ? "cdm" : (lic.adminUsuario || "cdm");
        const passComercio = lic.adminClave || "cdm2026";
        const pausado = lic.estadoServicio === "suspendido";
        const cobroBloqueado = Boolean(lic.bloquearCobranza);

        return `
            <div class="hub-comercio-card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.6rem;">
                    <div style="display:flex; align-items:center; gap:0.65rem; min-width:0;">
                        <img src="${lic.logoUrl || 'logo.png'}" alt="${nombre}" style="width:42px; height:42px; object-fit:contain; background:#fff; padding:4px; border-radius:11px; border:1px solid #cbd5e1; flex-shrink:0;" onerror="this.onerror=null; this.src='logo.png';">
                        <div style="min-width:0;">
                            <h4 style="font-size:0.96rem; font-weight:800; color:#0f172a; margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${nombre}</h4>
                            <small style="color:#64748b; font-size:0.74rem; display:block;">📍 ${sub} • <b>[${sigla}]</b></small>
                        </div>
                    </div>
                    <span class="badge ${pausado ? 'badge-danger' : 'badge-ok'}" style="font-size:0.64rem;">
                        ${pausado ? "🔴 Pausado" : "✓ Activo"}
                    </span>
                </div>

                <div class="hub-cobranza-pill-row">
                    <div style="display:flex; align-items:center; gap:0.4rem;">
                        <span class="cobranza-tag-title">COBRANZA</span>
                        <span class="badge ${cobroBloqueado ? 'badge-ghost' : 'badge-ok'}" style="font-size:0.66rem; ${cobroBloqueado ? 'background:#e2e8f0; color:#475569;' : ''}">
                            ${cobroBloqueado ? "✕ Bloqueado" : "✓ Activo"}
                        </span>
                    </div>
                    <button type="button" class="btn ${cobroBloqueado ? 'btn-secondary' : 'btn-ghost'} btn-sm" style="min-height:26px; padding:0.15rem 0.55rem; font-size:0.68rem;" onclick="alternarBloqueoCobranzaComercioCDM('${c.claveClub}')">
                        ${cobroBloqueado ? "🔓 Habilitar" : "🔒 Bloquear"}
                    </button>
                </div>

                <div style="display:flex; gap:0.3rem; flex-wrap:wrap;">
                    ${mod.futbol ? `<span class="badge badge-celeste" style="font-size:0.65rem;">⚽ Fútbol</span>` : ""}
                    ${mod.hockey ? `<span class="badge badge-celeste" style="font-size:0.65rem;">🏑 Hockey</span>` : ""}
                    ${mod.gym ? `<span class="badge badge-celeste" style="font-size:0.65rem;">🏋️ Gym</span>` : ""}
                    ${(lic.deportesExtra || []).map(d => `<span class="badge badge-celeste" style="font-size:0.65rem;">${d}</span>`).join("")}
                    ${(mod.consultorio !== false ? profs : []).map(pr => `<span class="badge badge-ok" style="font-size:0.65rem;">🩺 ${pr}</span>`).join("")}
                </div>

                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:0.45rem 0.65rem; font-size:0.73rem; color:#334155;">
                    <div>👤 <b>Usuario:</b> ${userComercio} • 🔑 <b>Clave:</b> ${passComercio}</div>
                </div>

                <div style="display:flex; flex-direction:column; gap:0.38rem; margin-top:auto;">
                    <button type="button" class="btn btn-primary btn-sm" style="width:100%;" onclick="entrarAComercioDesdeHub('${c.claveClub}')">
                        <i class="ri-login-box-line"></i> Abrir este Comercio / Consultorio
                    </button>
                    <div style="display:flex; gap:0.35rem;">
                        <button type="button" class="btn btn-secondary btn-sm" style="flex:1;" onclick="abrirModalCrearOEditarComercio('${c.claveClub}')">
                            <i class="ri-settings-4-line"></i> Módulos / Profesiones
                        </button>
                        <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarCredencialesDeComercioEspecificoWA('${c.claveClub}')">
                            <i class="ri-whatsapp-line"></i> WA
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
};

// 5. Funciones auxiliares para seleccionar planes y profesiones dentro del Modal de Configuración del Comercio
function aplicarPresetConsultorioEnModalCDM(modo) {
    const chkFut = document.getElementById("mcModFutbol");
    const chkHoc = document.getElementById("mcModHockey");
    const chkGym = document.getElementById("mcModGym");
    const inpDepExtra = document.getElementById("mcDeportesExtra");
    const chksProf = document.querySelectorAll(".mc-chk-profesion");

    if (modo === "solo_consultorio") {
        if (chkFut) chkFut.checked = false;
        if (chkHoc) chkHoc.checked = false;
        if (chkGym) chkGym.checked = false;
        if (inpDepExtra) inpDepExtra.value = "";
        chksProf.forEach(c => { c.checked = true; });
    } else if (modo === "todo_completo") {
        if (chkFut) chkFut.checked = true;
        if (chkHoc) chkHoc.checked = true;
        if (chkGym) chkGym.checked = true;
        chksProf.forEach(c => { c.checked = true; });
    }
}

function agregarProfesionExtraChipModalCDM(nombreConIcono) {
    const inp = document.getElementById("mcProfesionesExtra");
    if (!inp) return;
    const partes = inp.value.split(",").map(s => s.trim()).filter(Boolean);
    if (!partes.includes(nombreConIcono)) {
        partes.push(nombreConIcono);
        inp.value = partes.join(", ");
    }
}

// 6. Extender abrirModalCrearOEditarComercio para discriminar Deportes, Gimnasio y Profesiones (Quiropraxia, Kinesiología, Psicología, Nutrición, etc.)
const _origAbrirModalCrearOEditarComercio = abrirModalCrearOEditarComercio;
abrirModalCrearOEditarComercio = async function (claveClubEditar = null) {
    await _origAbrirModalCrearOEditarComercio.apply(this, arguments);
    const modal = document.getElementById("modalSuperAdminCDM");
    if (!modal) return;

    const lista = await obtenerListaCompletaComerciosCDM();
    const existente = claveClubEditar ? lista.find(x => x.claveClub === claveClubEditar) : null;
    const lic = existente?.licenciaConfig || {};
    const bloqueada = Boolean(lic.bloquearCobranza);
    const profsGuardadas = Array.isArray(lic.profesionesHabilitadas)
        ? lic.profesionesHabilitadas
        : (claveClubEditar ? [] : ["Quiropraxia", "Kinesiología", "Psicología", "Nutrición"]);

    const clavesBase = CATALOGO_PROFESIONES_BASE_SAAS.map(p => p.clave);
    const profsExtraGuardadas = profsGuardadas.filter(p => !clavesBase.includes(p));

    const form = modal.querySelector("form");
    const bloquesDiv = form ? Array.from(form.children).filter(el => el.tagName === "DIV") : [];
    const primerBloque = bloquesDiv[0];
    const bloqueModulos = bloquesDiv.find(d => (d.innerText || "").includes("¿QUÉ MÓDULOS USA ESTE CLIENTE?"));

    // A) Inyectar caja de bloqueo de cobranza si no existe
    if (form && primerBloque && !document.getElementById("mcBloquearCobranza")) {
        const boxCobranza = document.createElement("div");
        boxCobranza.style = "background:var(--warn-bg); border:1.5px solid rgba(245, 158, 11, 0.38); border-radius:16px; padding:0.9rem 1rem; margin-bottom:0.95rem;";
        boxCobranza.innerHTML = `
            <label style="display:flex; align-items:center; justify-content:space-between; gap:0.85rem; cursor:pointer;">
                <div>
                    <strong style="font-size:0.86rem; color:var(--warn-ink); display:flex; align-items:center; gap:0.35rem;">
                        🔒 Bloquear Parte de Cobranza / Cuotas en este Comercio
                    </strong>
                    <small style="color:var(--ink-500); font-size:0.74rem; display:block; margin-top:2px;">
                        Activalo si el comercio ya administra sus pagos y facturación en otro sistema externo.
                    </small>
                </div>
                <input type="checkbox" id="mcBloquearCobranza" style="width:22px; height:22px; min-height:auto; flex-shrink:0;" ${bloqueada ? "checked" : ""}>
            </label>
        `;
        primerBloque.insertAdjacentElement("afterend", boxCobranza);
    }

    // B) Inyectar dentro del bloque 2 la discriminación de PROFESIONES Y CONSULTORIO
    if (bloqueModulos && !document.getElementById("bloqueSeleccionProfesionesModalCDM")) {
        // Agregar botón rápido "🩺 Solo Consultorio ($300k)" en la botonera de planes
        const filaPlanes = bloqueModulos.querySelector("div");
        if (filaPlanes) {
            const btnSoloCons = document.createElement("button");
            btnSoloCons.type = "button";
            btnSoloCons.className = "btn btn-secondary btn-sm";
            btnSoloCons.innerHTML = `🩺 Solo Consultorio / Salud ($300k)`;
            btnSoloCons.onclick = () => aplicarPresetConsultorioEnModalCDM("solo_consultorio");
            filaPlanes.insertBefore(btnSoloCons, filaPlanes.firstChild);
        }

        const divProfs = document.createElement("div");
        divProfs.id = "bloqueSeleccionProfesionesModalCDM";
        divProfs.style = "margin-top:0.95rem; padding-top:0.9rem; border-top:1.5px dashed #cbd5e1;";
        divProfs.innerHTML = `
            <label style="font-size:0.7rem; font-weight:800; color:#0369a1; text-transform:uppercase; display:block; margin-bottom:0.5rem;">
                🩺 HABILITAR PROFESIONES / CONSULTORIOS INDEPENDIENTES (AGENDA, PACIENTES Y MUTUALES)
            </label>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(145px, 1fr)); gap:0.5rem; margin-bottom:0.65rem;">
                ${CATALOGO_PROFESIONES_BASE_SAAS.map(pr => `
                    <label style="display:flex; align-items:center; gap:0.45rem; background:#ffffff; border:1px solid #cbd5e1; padding:0.5rem 0.65rem; border-radius:11px; cursor:pointer; font-weight:700; font-size:0.8rem; color:#0f172a;">
                        <input type="checkbox" class="mc-chk-profesion" value="${pr.clave}" style="width:17px; height:17px; min-height:auto;" ${profsGuardadas.includes(pr.clave) ? "checked" : ""}>
                        <span>${pr.icono} ${pr.nombre}</span>
                    </label>
                `).join("")}
            </div>

            <label style="font-size:0.66rem; font-weight:700; color:#64748b; text-transform:uppercase; display:block; margin-bottom:0.35rem;">
                ➕ AGREGAR OTRAS PROFESIONES / ESPECIALIDADES (TOCÁ UN BOTÓN O ESCRIBILAS SEPARADAS POR COMA)
            </label>
            <div style="display:flex; gap:0.3rem; flex-wrap:wrap; margin-bottom:0.45rem;">
                ${["🦶 Podología", "🗣️ Fonoaudiología", "💆 Masoterapia y Estética", "⚕️ Medicina Deportiva", "🧘 Osteopatía y RPG", "🦷 Odontología"].map(ex => `
                    <button type="button" class="btn btn-secondary btn-sm" style="min-height:26px; padding:0.15rem 0.55rem; font-size:0.69rem; border-radius:999px;" onclick="agregarProfesionExtraChipModalCDM('${ex}')">
                        + ${ex}
                    </button>
                `).join("")}
            </div>
            <input type="text" id="mcProfesionesExtra" placeholder="Ej: 🦶 Podología, 🗣️ Fonoaudiología (o dejá vacío si no usa otras)" value="${profsExtraGuardadas.join(", ")}">
        `;
        bloqueModulos.appendChild(divProfs);
    }
};

// 7. Guardar exactamente qué Deportes, Gimnasio y Profesiones quedaron habilitados en este Comercio
const _origGuardarComercioDesdeModal = guardarComercioDesdeModal;
guardarComercioDesdeModal = async function (e, claveClubExistente = "") {
    const chkBloq = Boolean(document.getElementById("mcBloquearCobranza")?.checked);
    const nombreInput = (document.getElementById("mcNombreEntidad")?.value || "").trim();

    const profsTildadas = Array.from(document.querySelectorAll(".mc-chk-profesion:checked")).map(c => c.value);
    const profsExtraTxt = (document.getElementById("mcProfesionesExtra")?.value || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
    const todasLasProfesiones = [...new Set([...profsTildadas, ...profsExtraTxt])];

    // Si el cliente solo usa Consultorio/Profesiones (sin Fútbol, Hockey ni Gym), permitir guardar sin que el validador viejo lo frene
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

        localStorage.setItem(STORAGE_MAPA_CLUBES_KEY, JSON.stringify(mapa));
        if (obtenerClaveClubActivoCDM() === claveTarget) {
            guardarLicenciaConfigCDM(licTarget);
        }
    }

    const enLogin = window.location.pathname.toLowerCase().includes("login.html") || document.body.classList.contains("login-page");
    if (enLogin && !document.getElementById("vistaHubSuperAdmin")?.classList.contains("hidden")) {
        await mostrarHubSelectorDeComercios();
    }
};

const _origInyectarBarraSesionTopbar = inyectarBarraSesionTopbar;
inyectarBarraSesionTopbar = function (sesion) {
    _origInyectarBarraSesionTopbar.apply(this, arguments);
    sincronizarAtributoCobranzaBodyCDM();

    const cont = document.getElementById("cdmBarraSesionActiva");
    if (cont && sesion && sesion.esSuperAdmin && !document.getElementById("btnQuickToggleCobranzaTopbar")) {
        const btnCob = document.createElement("button");
        btnCob.type = "button";
        btnCob.id = "btnQuickToggleCobranzaTopbar";
        btnCob.className = "btn btn-ghost btn-sm";
        btnCob.onclick = function () {
            alternarBloqueoCobranzaComercioCDM(obtenerClaveClubActivoCDM());
        };
        cont.insertBefore(btnCob, cont.firstChild);
        sincronizarAtributoCobranzaBodyCDM();
    }
};

sincronizarAtributoCobranzaBodyCDM();