/**
 * js/portal-permisos.js — Control de Permisos del Portal del Usuario (por Categoría o Individual)
 * + Cuaderno Diario de Pesos (Gym por defecto / Deportes solo si el profe habilita)
 * + Vista Previa en Vivo (Celular/PC) + Portal del Deportista/Socio Limpio
 * G-SIS — Desarrollado por Gonzalo Adanchú
 */

(function () {
    // =====================================================================
    // 1. ESTILOS LIMPIOS + CUADERNO DE PESOS RESPONSIVE
    // =====================================================================
    document.getElementById("cdmCssPortalPermisos")?.remove();
    const st = document.createElement("style");
    st.id = "cdmCssPortalPermisos";
    st.textContent = `
        /* --- PANEL DE PERMISOS DEL PROFESOR --- */
        .pp-preset-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 0.45rem; margin-bottom: 0.9rem;
        }
        .pp-preset-btn {
            border: 1.5px solid var(--line-strong, #cbd5e1);
            background: var(--surface-subtle, #f8fafc);
            color: var(--ink-900, #0f172a);
            border-radius: 12px; padding: 0.6rem 0.65rem;
            text-align: left; cursor: pointer; transition: all 0.15s ease;
        }
        .pp-preset-btn:hover { border-color: #0284c7; background: var(--cdm-50, #f0f9ff); transform: translateY(-1px); }
        .pp-preset-btn strong { display: block; font-size: 0.78rem; }
        .pp-preset-btn small { display: block; font-size: 0.66rem; color: var(--ink-500, #64748b); margin-top: 2px; line-height: 1.25; }

        .pp-switch-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(225px, 1fr));
            gap: 0.5rem; margin-bottom: 0.95rem;
        }
        .pp-switch-card {
            display: flex; align-items: center; justify-content: space-between; gap: 0.65rem;
            background: var(--surface-solid, #ffffff);
            border: 1.5px solid var(--line, #e2e8f0);
            border-radius: 13px; padding: 0.6rem 0.75rem; cursor: pointer;
        }
        .pp-switch-card:hover { border-color: #0284c7; }
        .pp-switch-card input[type="checkbox"] {
            width: 19px; height: 19px; min-height: auto !important;
            accent-color: #0284c7; flex-shrink: 0; cursor: pointer;
        }

        /* --- LIMPIEZA TOTAL EN MODO USUARIO --- */
        body[data-rol="usuario"]:not([data-modo-portal="paciente"]) #fichaCabeceraJugador {
            display: none !important;
        }
        body[data-rol="usuario"]:not([data-user-sec="rutinas"]) #cdmFloatingDropletClock {
            display: none !important;
        }
        body[data-rol="usuario"] .topbar-subtitle,
        body[data-rol="usuario"] #topbarMenuWrap33,
        body[data-rol="usuario"] #cdmBarraSesionActiva .badge-celeste {
            display: none !important;
        }
        body[data-rol="usuario"] .app-topbar {
            display: flex !important; flex-direction: row !important;
            align-items: center !important; justify-content: space-between !important;
            flex-wrap: nowrap !important; gap: 0.5rem !important;
            padding: 0.55rem 0.9rem !important; min-height: 54px !important;
        }
        body[data-rol="usuario"] .app-topbar .topbar-left { min-width: 0 !important; flex: 1 !important; }
        body[data-rol="usuario"] .app-topbar .topbar-title h2 {
            font-size: 1rem !important; white-space: nowrap !important;
            overflow: hidden !important; text-overflow: ellipsis !important; margin: 0 !important;
        }
        body[data-rol="usuario"] .app-topbar .topbar-right,
        body[data-rol="usuario"] #cdmBarraSesionActiva {
            display: flex !important; align-items: center !important;
            flex-wrap: nowrap !important; gap: 0.35rem !important; flex-shrink: 0 !important;
        }
        body[data-rol="usuario"] .module-tabs {
            display: flex !important; flex-wrap: nowrap !important; overflow-x: auto !important;
            gap: 0.4rem !important; padding: 0.42rem !important; border-radius: 16px !important;
            position: static !important; margin-bottom: 0.9rem !important; scrollbar-width: none;
        }
        body[data-rol="usuario"] .module-tabs::-webkit-scrollbar { display: none; }
        body[data-rol="usuario"] .module-tabs .mod-tab {
            flex: 1 0 auto !important; white-space: nowrap !important;
            padding: 0.5rem 0.85rem !important; font-size: 0.8rem !important; justify-content: center !important;
        }
        body[data-rol="usuario"] .module-tabs .mod-tab i {
            width: auto !important; height: auto !important; background: transparent !important; font-size: 1rem !important;
        }
        body[data-rol="usuario"] #jug-sec-rutinas .split-view {
            grid-template-columns: 1fr !important;
        }
        body[data-rol="usuario"] #jug-sec-rutinas .split-view > .app-panel:first-child {
            display: none !important;
        }
        @media (max-width: 820px) {
            body[data-rol="usuario"] .module-tabs,
            body[data-rol="usuario"] .user-back-home-bar { display: none !important; }
            body[data-rol="usuario"] .app-topbar .btn-theme-toggle span { display: none !important; }
            body[data-rol="usuario"] .app-topbar .topbar-right #btnToggleTemaCDM,
            body[data-rol="usuario"] .app-topbar .topbar-right #cdmBarraSesionActiva { display: flex !important; }
            body[data-rol="usuario"] .app-content { padding: 0.75rem 0.75rem 5.4rem !important; }
        }

        /* --- PORTAL DEL USUARIO RENOVADO --- */
        .up-hero-banner {
            background: linear-gradient(135deg, #0c192c 0%, #0369a1 58%, #0284c7 100%);
            color: #ffffff; border-radius: 20px; padding: 1.05rem 1.2rem;
            margin-bottom: 0.9rem; display: flex; justify-content: space-between;
            align-items: center; gap: 0.85rem; flex-wrap: wrap;
            box-shadow: 0 12px 28px -10px rgba(2, 132, 199, 0.42);
        }
        .up-hero-id { display: flex; align-items: center; gap: 0.85rem; min-width: 0; }
        .up-hero-name { font-size: 1.2rem; font-weight: 900; margin: 0; color: #ffffff; line-height: 1.2; }
        .up-hero-sub { font-size: 0.76rem; color: #bae6fd; display: block; margin-top: 2px; }
        .up-hero-chips { display: flex; gap: 0.35rem; flex-wrap: wrap; margin-top: 0.4rem; }
        .up-chip-glass {
            background: rgba(255, 255, 255, 0.16); border: 1px solid rgba(255, 255, 255, 0.28);
            color: #ffffff; font-size: 0.7rem; font-weight: 700; padding: 0.18rem 0.58rem; border-radius: 999px;
        }
        .up-chip-glass.ok { background: rgba(16, 185, 129, 0.28); border-color: rgba(167, 243, 208, 0.5); }
        .up-chip-glass.warn { background: rgba(245, 158, 11, 0.3); border-color: rgba(253, 230, 138, 0.55); }

        .up-cards-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 230px), 1fr));
            gap: 0.75rem; margin-bottom: 0.9rem;
        }
        .up-mod-card {
            background: var(--surface-solid, #ffffff);
            border: 1.5px solid var(--line-strong, #cbd5e1); border-top: 4px solid #0284c7;
            border-radius: 16px; padding: 0.9rem 1rem;
            display: flex; flex-direction: column; gap: 0.45rem;
            cursor: pointer; box-shadow: var(--shadow-sm);
            transition: transform 0.16s ease, border-color 0.16s ease;
        }
        .up-mod-card:hover { transform: translateY(-2px); border-color: #0284c7; }
        .up-mod-card.c-emerald { border-top-color: #10b981; }
        .up-mod-card.c-purple { border-top-color: #6366f1; }
        .up-mod-card.c-amber { border-top-color: #f59e0b; }
        .up-mod-card.c-rose { border-top-color: #ec4899; }
        .up-mod-top { display: flex; justify-content: space-between; align-items: center; gap: 0.45rem; }
        .up-mod-icon {
            width: 38px; height: 38px; border-radius: 11px;
            background: var(--cdm-50, #f0f9ff); color: #0284c7;
            display: flex; align-items: center; justify-content: center; font-size: 1.15rem;
        }
        .up-mod-card h4 { margin: 0; font-size: 0.94rem; font-weight: 800; color: var(--ink-900, #0f172a); }
        .up-mod-card p { margin: 0; font-size: 0.75rem; color: var(--ink-500, #64748b); line-height: 1.35; }
        .up-mod-foot {
            margin-top: auto; padding-top: 0.45rem; border-top: 1px solid var(--line, #e2e8f0);
            display: flex; justify-content: space-between; align-items: center;
            font-size: 0.74rem; font-weight: 800; color: #0284c7;
        }

        .up-checkin-strip {
            background: var(--surface-solid, #ffffff);
            border: 1.5px solid var(--line-celeste, #bae6fd);
            border-radius: 16px; padding: 0.85rem 0.95rem; margin-bottom: 0.9rem;
        }
        .up-emoji-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.4rem; }
        .up-emoji-btn {
            border: 1.5px solid var(--line-strong, #cbd5e1);
            background: var(--surface-subtle, #f8fafc); border-radius: 11px;
            padding: 0.45rem 0.25rem; text-align: center; cursor: pointer;
            font-size: 0.7rem; font-weight: 700; color: var(--ink-700, #334155);
        }
        .up-emoji-btn span { display: block; font-size: 1.2rem; line-height: 1.2; }
        .up-emoji-btn.active, .up-emoji-btn:hover { background: #0284c7; border-color: #0284c7; color: #ffffff; }

        .up-cuota-card {
            background: var(--surface-solid, #ffffff);
            border: 1.5px solid var(--line-strong, #cbd5e1);
            border-radius: 15px; padding: 0.8rem 0.95rem;
            display: flex; justify-content: space-between; align-items: center; gap: 0.65rem; flex-wrap: wrap;
        }

        /* --- CUADERNO DIARIO DE RUTINAS Y PESOS --- */
        .cp-rutinas-stack { display: flex; flex-direction: column; gap: 1rem; width: 100%; }
        .cp-rutina-card {
            background: var(--surface-solid, #ffffff);
            border: 1.5px solid var(--line-strong, #cbd5e1);
            border-radius: 18px; overflow: hidden; box-shadow: var(--shadow-sm);
        }
        .cp-rutina-head {
            background: linear-gradient(135deg, #0c192c 0%, #0369a1 65%, #0284c7 100%);
            color: #ffffff; padding: 0.95rem 1.1rem;
            display: flex; justify-content: space-between; align-items: flex-start; gap: 0.6rem; flex-wrap: wrap;
        }
        .cp-rutina-head h4 { margin: 4px 0 2px; font-size: 1.08rem; font-weight: 900; color: #ffffff; }
        .cp-rutina-head small { color: rgba(224, 242, 254, 0.92); font-size: 0.75rem; }
        .cp-rutina-body { padding: 0.85rem; display: flex; flex-direction: column; gap: 0.7rem; }

        .cp-ex-card {
            background: var(--surface-subtle, #f8fafc);
            border: 1.5px solid var(--line, #e2e8f0);
            border-radius: 14px; padding: 0.8rem 0.85rem;
            display: flex; flex-direction: column; gap: 0.55rem;
        }
        .cp-ex-top { display: flex; align-items: flex-start; gap: 0.7rem; }
        .cp-ex-info { flex: 1; min-width: 0; }
        .cp-ex-title-row {
            display: flex; justify-content: space-between; align-items: flex-start; gap: 0.45rem; flex-wrap: wrap;
        }
        .cp-ex-title-row strong { font-size: 0.93rem; font-weight: 800; color: var(--ink-900, #0f172a); }
        .cp-pills-row { display: flex; gap: 0.35rem; flex-wrap: wrap; margin-top: 0.32rem; align-items: center; }
        .cp-pausa-btn {
            border: 1px solid rgba(2, 132, 199, 0.35); background: var(--cdm-50, #f0f9ff);
            color: var(--cdm-700, #0369a1); font-size: 0.7rem; font-weight: 800;
            padding: 0.16rem 0.55rem; border-radius: 999px; cursor: pointer;
        }
        .cp-pausa-btn:hover { background: #0284c7; color: #ffffff; }

        .cp-series-row { display: flex; gap: 0.32rem; flex-wrap: wrap; align-items: center; }
        .cp-serie-btn {
            border: 1.5px solid var(--line-strong, #cbd5e1);
            background: var(--surface-solid, #ffffff); color: var(--ink-700, #334155);
            border-radius: 9px; padding: 0.28rem 0.58rem; font-size: 0.71rem; font-weight: 800;
            cursor: pointer; transition: all 0.14s ease;
        }
        .cp-serie-btn.done {
            background: #10b981; border-color: #059669; color: #ffffff;
        }

        .cp-notebook-bar {
            display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap;
            background: var(--surface-solid, #ffffff);
            border: 1px dashed var(--line-celeste, #7dd3fc);
            border-radius: 11px; padding: 0.52rem 0.68rem;
        }
        .cp-last-meta { display: flex; flex-direction: column; gap: 2px; font-size: 0.74rem; color: var(--ink-700, #334155); }
        .cp-last-meta b { color: var(--ink-900, #0f172a); }

        .cp-log-form {
            background: var(--surface-solid, #ffffff);
            border: 1.5px solid #0284c7; border-radius: 12px;
            padding: 0.65rem 0.72rem; display: flex; flex-direction: column; gap: 0.5rem;
        }
        .cp-log-grid { display: grid; grid-template-columns: 1fr 1fr 1.3fr; gap: 0.45rem; }
        .cp-log-grid .field label { font-size: 0.66rem; font-weight: 800; color: var(--ink-500, #64748b); }
        .cp-log-grid input { min-height: 38px !important; font-size: 0.86rem !important; font-weight: 700; }

        .cp-pr-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
            gap: 0.55rem; margin-bottom: 0.85rem;
        }
        .cp-pr-card {
            background: var(--surface-subtle, #f8fafc);
            border: 1.5px solid var(--line, #e2e8f0); border-top: 3.5px solid #0284c7;
            border-radius: 13px; padding: 0.65rem 0.75rem; cursor: pointer;
            transition: transform 0.14s ease, border-color 0.14s ease;
        }
        .cp-pr-card:hover { transform: translateY(-2px); border-color: #0284c7; }
        .cp-pr-card strong { display: block; font-size: 0.8rem; color: var(--ink-900, #0f172a); margin-bottom: 3px; }
        .cp-pr-val { font-size: 1.05rem; font-weight: 900; color: #0284c7; }

        /* Vista Previa (Celular / PC) */
        .pp-preview-shell {
            background: var(--bg, #f1f5f9); border: 2px solid var(--line-strong, #cbd5e1);
            border-radius: 20px; padding: 0.9rem; transition: max-width 0.25s ease; margin: 0 auto;
            max-height: 70vh; overflow-y: auto;
        }
        .pp-preview-shell.mobile-frame {
            max-width: 390px; border: 8px solid #0f172a; border-radius: 32px;
            box-shadow: 0 22px 46px rgba(2, 6, 23, 0.35);
        }

        @media (max-width: 580px) {
            .up-cards-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; }
            .up-mod-card { padding: 0.75rem 0.8rem; }
            .up-mod-card h4 { font-size: 0.86rem; }
            .up-mod-card p { font-size: 0.7rem; }
            .cp-log-grid { grid-template-columns: 1fr 1fr; }
            .cp-log-grid .cp-nota-field { grid-column: 1 / -1; }
        }
    `;
    document.head.appendChild(st);

    // =====================================================================
    // 2. MOTOR DE PERMISOS DEL PORTAL (INCLUYE CUADERNO DE PESOS)
    // =====================================================================
    const CATALOGO_PERMISOS_PORTAL = [
        { clave: "rutinas", icono: "🏋️", titulo: "Mis Rutinas", desc: "Ver su plan de entrenamiento y tildar series en vivo" },
        { clave: "anotarCargas", icono: "📝", titulo: "Cuaderno de Pesos", desc: "Anotar kilos y reps desde su rutina (ver última vez y PRs)" },
        { clave: "progreso", icono: "📈", titulo: "Mi Progreso y Curvas", desc: "Ver su evolución gráfica y récords personales" },
        { clave: "videos", icono: "🎥", titulo: "Videos Referencias", desc: "Catálogo de ejercicios con técnica y videos" },
        { clave: "partidos", icono: "⚽", titulo: "Mis Partidos y Media", desc: "Partidos jugados, jugadas marcadas, fotos y videos" },
        { clave: "calc1rm", icono: "🧮", titulo: "Tabla % 1RM", desc: "Calculadora de kilos por porcentaje (avanzado)" },
        { clave: "score", icono: "⭐", titulo: "Ver mi Score (1–10)", desc: "Apagalo si no querés mostrar notas numéricas (ej: Sub-13)" },
        { clave: "ranking", icono: "🏆", titulo: "Ranking de Categoría", desc: "Tabla de posiciones del plantel o récords del gym" },
        { clave: "devoluciones", icono: "💬", titulo: "Devoluciones del Profe", desc: "Fortalezas, plan de mejora y mensajes guardados" },
        { clave: "checkin", icono: "😊", titulo: "Check-in Diario (Salud)", desc: "Reportar sueño, cansancio, peso y molestias en 3 toques" },
        { clave: "cuota", icono: "💳", titulo: "Estado de Cuota y Alias", desc: "Ver si está al día y copiar el Alias para transferir" }
    ];

    const PRESETS_PORTAL = {
        gym_simple: {
            label: "🏋️ Gym + Cuaderno",
            sub: "Rutinas, anotar pesos, curvas PR, videos, check-in y cuota",
            permisos: { rutinas: true, anotarCargas: true, progreso: true, videos: true, partidos: false, calc1rm: false, score: false, ranking: false, devoluciones: false, checkin: true, cuota: true }
        },
        juvenil: {
            label: "🧒 Formativo / Juvenil",
            sub: "Sin nota numérica, sin ranking ni carga libre de pesos",
            permisos: { rutinas: true, anotarCargas: false, progreso: true, videos: true, partidos: true, calc1rm: false, score: false, ranking: false, devoluciones: true, checkin: true, cuota: true }
        },
        competitivo: {
            label: "⚽ Plantel Competitivo",
            sub: "Partidos, rutinas, devoluciones y score (pesos opcionales)",
            permisos: { rutinas: true, anotarCargas: false, progreso: true, videos: true, partidos: true, calc1rm: false, score: true, ranking: true, devoluciones: true, checkin: true, cuota: true }
        },
        pro_360: {
            label: "🚀 Atleta Pro 360°",
            sub: "Todo habilitado (incluye Cuaderno de Pesos y Tabla % 1RM)",
            permisos: { rutinas: true, anotarCargas: true, progreso: true, videos: true, partidos: true, calc1rm: true, score: true, ranking: true, devoluciones: true, checkin: true, cuota: true }
        }
    };

    function storageKeyPermisosClub() {
        const club = typeof obtenerClaveClubActivoCDM === "function" ? obtenerClaveClubActivoCDM() : "cdm_adelia_maria_principal";
        return `cdm_permisos_portal_v1_${club}`;
    }

    function obtenerMapaPermisosDefaultsClub() {
        try { return JSON.parse(localStorage.getItem(storageKeyPermisosClub()) || "{}") || {}; }
        catch { return {}; }
    }

    function guardarMapaPermisosDefaultsClub(mapa) {
        localStorage.setItem(storageKeyPermisosClub(), JSON.stringify(mapa));
    }

    function claveAreaPersona(p) {
        if (!p) return "Futbol_Sub 13";
        return p.deporte === "Gimnasio" ? "Gimnasio_General" : `${p.deporte}_${p.categoria}`;
    }

    window.obtenerPermisosEfectivosPortal = function (p) {
        const esGym = p?.deporte === "Gimnasio";
        const baseDef = esGym
            ? { ...PRESETS_PORTAL.gym_simple.permisos }
            : { ...PRESETS_PORTAL.competitivo.permisos };
        const mapa = obtenerMapaPermisosDefaultsClub();
        const delArea = mapa[claveAreaPersona(p)] || mapa[p?.deporte] || null;
        const individual = (p && p.permisosPortal && typeof p.permisosPortal === "object") ? p.permisosPortal : null;
        const final = { ...baseDef, ...(delArea || {}), ...(individual || {}) };

        // Regla clara: en Gym viene habilitado salvo que el profe lo apague; en Deportes solo si el profe lo activa
        if (typeof final.anotarCargas !== "boolean") final.anotarCargas = esGym;

        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        if (lic?.bloquearCobranza || lic?.funciones?.deporte?.cobranza === false) final.cuota = false;
        if (esGym) { final.partidos = false; final.score = false; }
        return final;
    };

    // =====================================================================
    // 3. MODAL DEL PROFESOR: CONFIGURAR PERMISOS + VISTA PREVIA
    // =====================================================================
    function asegurarModalPermisos() {
        let m = document.getElementById("modalPortalPermisosCDM");
        if (!m) {
            m = document.createElement("div");
            m.id = "modalPortalPermisosCDM";
            m.className = "modal-backdrop hidden";
            document.body.appendChild(m);
        }
        return m;
    }

    window.cerrarModalPermisosPortal = function () {
        document.getElementById("modalPortalPermisosCDM")?.classList.add("hidden");
    };

    window.aplicarPresetEnModalPermisos = function (clavePreset) {
        const pr = PRESETS_PORTAL[clavePreset];
        if (!pr) return;
        document.querySelectorAll(".pp-chk-perm").forEach(chk => {
            const k = chk.dataset.perm;
            if (pr.permisos[k] !== undefined) chk.checked = Boolean(pr.permisos[k]);
        });
        if (typeof mostrarToast === "function") mostrarToast(`⚡ Plantilla "${pr.label}" aplicada.`);
    };

    function leerPermisosDesdeModal() {
        const obj = {};
        document.querySelectorAll(".pp-chk-perm").forEach(chk => { obj[chk.dataset.perm] = Boolean(chk.checked); });
        return obj;
    }

    window.abrirModalConfigurarPortalUsuario = function (idPersonaOpt = null) {
        const p = idPersonaOpt ? (basePersonas || []).find(x => Number(x.id) === Number(idPersonaOpt)) : null;
        const dep = p ? p.deporte : (typeof deportePagina !== "undefined" && deportePagina ? deportePagina : "Futbol");
        const cat = p ? p.categoria : (typeof categoriaActiva !== "undefined" ? categoriaActiva : "Sub 13");
        const areaNombre = dep === "Gimnasio" ? "Todo Gimnasio" : `${dep} — ${cat}`;
        const actual = p ? obtenerPermisosEfectivosPortal(p) : obtenerPermisosEfectivosPortal({ deporte: dep, categoria: cat });
        const tieneOverride = Boolean(p && p.permisosPortal);

        const modal = asegurarModalPermisos();
        modal.innerHTML = `
            <div class="modal-window" style="max-width:760px;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-celeste">👁️ CONTROL DEL PROFESOR SOBRE EL PORTAL</span>
                        <h3 style="margin-top:4px;">${p ? `Qué ve ${p.nombre} ${p.apellido}` : `Qué ven los usuarios en ${areaNombre}`}</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalPermisosPortal()">✕</button>
                </div>

                <label style="font-size:0.7rem; font-weight:800; color:var(--ink-500); text-transform:uppercase; display:block; margin-bottom:0.4rem;">1. Plantillas rápidas:</label>
                <div class="pp-preset-grid">
                    ${Object.entries(PRESETS_PORTAL).map(([k, pr]) => `<button type="button" class="pp-preset-btn" onclick="aplicarPresetEnModalPermisos('${k}')"><strong>${pr.label}</strong><small>${pr.sub}</small></button>`).join("")}
                </div>

                <label style="font-size:0.7rem; font-weight:800; color:var(--ink-500); text-transform:uppercase; display:block; margin-bottom:0.4rem;">2. Secciones y permisos:</label>
                <div class="pp-switch-grid">
                    ${CATALOGO_PERMISOS_PORTAL.filter(it => dep !== "Gimnasio" || (it.clave !== "partidos" && it.clave !== "score")).map(it => `
                        <label class="pp-switch-card">
                            <div style="min-width:0;">
                                <strong style="display:block; font-size:0.81rem;">${it.icono} ${it.titulo}</strong>
                                <small style="display:block; font-size:0.68rem; color:var(--ink-500); line-height:1.25;">${it.desc}</small>
                            </div>
                            <input type="checkbox" class="pp-chk-perm" data-perm="${it.clave}" ${actual[it.clave] ? "checked" : ""}>
                        </label>
                    `).join("")}
                </div>

                <div style="background:var(--surface-subtle); border:1px solid var(--line-strong); border-radius:14px; padding:0.75rem 0.9rem; display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                    <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                        ${p ? `<button type="button" class="btn btn-secondary btn-sm" onclick="abrirVistaPreviaPortalUsuario(${p.id}, true)">📱 Vista Previa</button>` : ""}
                        ${tieneOverride ? `<button type="button" class="btn btn-ghost btn-sm" onclick="restaurarPermisosHeredados(${p.id})">↺ Heredar Categoría</button>` : ""}
                    </div>
                    <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="guardarPermisosParaCategoria('${dep}', '${cat}')">👥 Aplicar a ${areaNombre}</button>
                        ${p ? `<button type="button" class="btn btn-primary btn-sm" onclick="guardarPermisosSoloPersona(${p.id})">💾 Guardar solo ${p.nombre}</button>` : ""}
                    </div>
                </div>
            </div>
        `;
        modal.classList.remove("hidden");
    };

    window.guardarPermisosSoloPersona = function (idPersona) {
        const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
        if (!p) return;
        p.permisosPortal = leerPermisosDesdeModal();
        if (typeof guardarDatosCDM === "function") guardarDatosCDM();
        cerrarModalPermisosPortal();
        mostrarToast(`✅ Portal guardado para ${p.nombre}.`);
        if (document.body?.dataset?.page === "perfil-individual" && typeof inicializarPaginaJugadorIndividual === "function") {
            inicializarPaginaJugadorIndividual();
        }
    };

    window.restaurarPermisosHeredados = function (idPersona) {
        const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
        if (!p) return;
        delete p.permisosPortal;
        if (typeof guardarDatosCDM === "function") guardarDatosCDM();
        abrirModalConfigurarPortalUsuario(p.id);
    };

    window.guardarPermisosParaCategoria = function (dep, cat) {
        const mapa = obtenerMapaPermisosDefaultsClub();
        mapa[dep === "Gimnasio" ? "Gimnasio_General" : `${dep}_${cat}`] = leerPermisosDesdeModal();
        guardarMapaPermisosDefaultsClub(mapa);
        cerrarModalPermisosPortal();
        mostrarToast(`✅ Permisos aplicados a ${dep === "Gimnasio" ? "Gimnasio" : `${dep} ${cat}`}.`);
        if (document.body?.dataset?.page === "perfil-individual" && typeof inicializarPaginaJugadorIndividual === "function") {
            inicializarPaginaJugadorIndividual();
        }
    };

    window.abrirVistaPreviaPortalUsuario = function (idPersona, usarDelModal = false, modoMovil = true) {
        const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
        if (!p) return;
        const perms = usarDelModal && document.querySelector(".pp-chk-perm") ? leerPermisosDesdeModal() : obtenerPermisosEfectivosPortal(p);

        const modal = asegurarModalPermisos();
        modal.innerHTML = `
            <div class="modal-window" style="max-width:920px;">
                <div class="modal-top">
                    <div><span class="badge badge-ok">👁️ VISTA PREVIA DEL ALUMNO</span><h3 style="margin-top:4px;">${p.nombre} ${p.apellido}</h3></div>
                    <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                        <button type="button" class="btn ${modoMovil ? "btn-primary" : "btn-ghost"} btn-sm" onclick="abrirVistaPreviaPortalUsuario(${p.id}, false, true)">📱 Celular</button>
                        <button type="button" class="btn ${!modoMovil ? "btn-primary" : "btn-ghost"} btn-sm" onclick="abrirVistaPreviaPortalUsuario(${p.id}, false, false)">💻 PC</button>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="abrirModalConfigurarPortalUsuario(${p.id})">🎛️ Permisos</button>
                        <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalPermisosPortal()">✕</button>
                    </div>
                </div>
                <div class="pp-preview-shell ${modoMovil ? "mobile-frame" : ""}">
                    ${construirHTMLHomePortalUsuario(p, perms, true)}
                </div>
            </div>
        `;
        modal.classList.remove("hidden");
    };

    // =====================================================================
    // 4. CUADERNO DIARIO DE RUTINAS Y PESOS (ANOTAR EN 1 TOQUE + ÚLTIMA VEZ + PR)
    // =====================================================================
    function escPP(s) {
        return String(s ?? "")
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    function parsePausaASegundos(txt) {
        const s = String(txt || "").toLowerCase().trim();
        const m = s.match(/(\d+)\s*m/);
        const seg = s.match(/(\d+)\s*s/);
        let tot = 0;
        if (m) tot += parseInt(m[1], 10) * 60;
        if (seg) tot += parseInt(seg[1], 10);
        if (!tot) {
            const num = parseInt(s, 10);
            if (!isNaN(num)) tot = num <= 5 ? num * 60 : num;
        }
        return tot || 90;
    }

    function obtenerHistorialEjercicioPP(p, nombreEj) {
        const clave = typeof normalizarTextoEjercicioCDM === "function"
            ? normalizarTextoEjercicioCDM(nombreEj)
            : String(nombreEj || "").toLowerCase().trim();
        const lista = (p?.evaluaciones || [])
            .filter(ev => {
                const k = typeof normalizarTextoEjercicioCDM === "function"
                    ? normalizarTextoEjercicioCDM(ev.ejercicio)
                    : String(ev.ejercicio || "").toLowerCase().trim();
                return k === clave;
            })
            .sort((a, b) => String(a.fecha || "").localeCompare(String(b.fecha || "")) || (Number(a.id) - Number(b.id)));

        if (!lista.length) return { ultima: null, pr: null, total: 0, mejoraPct: 0 };
        const ultima = lista[lista.length - 1];
        const ini = lista[0];
        const esT = ini.tipo === "tiempo_seg";
        const pr = esT
            ? Math.min(...lista.map(x => Number(x.valor) || 0))
            : Math.max(...lista.map(x => Number(x.valor) || 0));
        const mejoraPct = (lista.length >= 2 && ini.valor > 0)
            ? Math.round(((esT ? (ini.valor - ultima.valor) : (ultima.valor - ini.valor)) / ini.valor) * 1000) / 10
            : 0;
        return { ultima, pr, total: lista.length, mejoraPct, unidad: ultima.unidad || "" };
    }

    function claveSeriesHoyPP(idPersona) {
        const hoy = typeof obtenerHoyISO === "function" ? obtenerHoyISO() : new Date().toISOString().split("T")[0];
        return `cdm_series_hoy_v2_${hoy}_${idPersona}`;
    }

    function leerSeriesHoyPP(idPersona) {
        try { return JSON.parse(localStorage.getItem(claveSeriesHoyPP(idPersona)) || "{}") || {}; }
        catch { return {}; }
    }

    window.toggleSerieCuadernoPP = function (idPersona, serieKey, btnEl) {
        const mapa = leerSeriesHoyPP(idPersona);
        mapa[serieKey] = !mapa[serieKey];
        try { localStorage.setItem(claveSeriesHoyPP(idPersona), JSON.stringify(mapa)); } catch {}
        if (btnEl) btnEl.classList.toggle("done", Boolean(mapa[serieKey]));
    };

    window.toggleFormAnotarCuadernoPP = function (uid) {
        const form = document.getElementById(`cpForm_${uid}`);
        if (!form) return;
        form.classList.toggle("hidden");
        if (!form.classList.contains("hidden")) {
            form.querySelector('input[name="kg"]')?.focus();
        }
    };

    window.guardarMarcaDesdeCuadernoPP = function (e, idPersona, uid) {
        e.preventDefault();
        const form = e.target;
        const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
        if (!p) return;

        const nombreEjRaw = form.dataset.ejercicio || "";
        if (!nombreEjRaw) return;

        const kg = parseFloat(form.querySelector('input[name="kg"]')?.value);
        const reps = parseInt(form.querySelector('input[name="reps"]')?.value, 10) || 1;
        const notaTxt = (form.querySelector('input[name="nota"]')?.value || "").trim();

        if ((isNaN(kg) || kg <= 0) && reps <= 0) {
            if (typeof mostrarToast === "function") mostrarToast("⚠️ Ingresá el peso o las repeticiones.");
            return;
        }

        const hoy = typeof obtenerHoyISO === "function" ? obtenerHoyISO() : new Date().toISOString().split("T")[0];
        const clave = typeof normalizarTextoEjercicioCDM === "function" ? normalizarTextoEjercicioCDM(nombreEjRaw) : nombreEjRaw.toLowerCase().trim();
        const ya = (p.evaluaciones || []).find(ev => (typeof normalizarTextoEjercicioCDM === "function" ? normalizarTextoEjercicioCDM(ev.ejercicio) : ev.ejercicio.toLowerCase()) === clave);
        const ejercicio = ya ? ya.ejercicio : (typeof agregarEjercicioInventadoAlCatalogoCDM === "function" ? (agregarEjercicioInventadoAlCatalogoCDM(nombreEjRaw, "fuerza_kg", true) || nombreEjRaw) : nombreEjRaw);

        const prevInfo = obtenerHistorialEjercicioPP(p, ejercicio);
        const autor = document.body?.getAttribute("data-rol") === "usuario" ? "👤 Socio" : "👨‍🏫 Profe";
        const nota = notaTxt ? `${autor}: ${notaTxt}` : autor;

        let tipo = "fuerza_kg", valor = 0, unidad = "kg (1RM)", detalle = "";
        if (!isNaN(kg) && kg > 0) {
            const rm = Math.round((reps === 1 ? kg : kg * (1 + reps / 30)) * 10) / 10;
            valor = rm;
            detalle = `${kg} kg × ${reps} reps (1RM: ${rm} kg)`;
        } else {
            tipo = "reps_puntos";
            valor = reps;
            unidad = "reps";
            detalle = `${reps} reps (Corporal)`;
        }

        if (!Array.isArray(p.evaluaciones)) p.evaluaciones = [];
        p.evaluaciones.push({ id: Date.now(), fecha: hoy, ejercicio, tipo, valor, unidad, detalle, nota });
        p.evaluaciones.sort((a, b) => String(a.fecha || "").localeCompare(String(b.fecha || "")));

        if (typeof registrarSnapshotPersona === "function") registrarSnapshotPersona(p, `Cuaderno ${ejercicio}`);
        if (typeof guardarDatosCDM === "function") guardarDatosCDM();

        const esNuevoPR = prevInfo.pr !== null && valor > prevInfo.pr;
        if (typeof mostrarToast === "function") {
            mostrarToast(esNuevoPR
                ? `🏆 ¡Nuevo Récord Personal en ${ejercicio}! (${detalle})`
                : `✅ Anotado en ${ejercicio}: ${detalle}`);
        }

        // Refrescar cuaderno, resumen de PRs y gráficos al instante
        const contRut = form.closest("[data-cuaderno-cont]")?.id || "listaRutinasGuardadasJugador";
        window.renderizarCuadernoRutinasUsuario(p, contRut);
        if (typeof window.renderizarResumenPRsUsuario === "function") window.renderizarResumenPRsUsuario(p);
        if (typeof renderizarHistorialJugador === "function") renderizarHistorialJugador(p);
        if (typeof dibujarGraficoEvolucion === "function") {
            const selEx = document.getElementById("selectFiltroEjercicioGrafico");
            if (selEx) {
                const unicos = [...new Set(p.evaluaciones.map(x => x.ejercicio))];
                selEx.innerHTML = unicos.map(n => `<option value="${escPP(n)}" ${n === ejercicio ? "selected" : ""}>${escPP(n)}</option>`).join("");
            }
            dibujarGraficoEvolucion();
        }
    };

    window.renderizarCuadernoRutinasUsuario = function (p, contId = "listaRutinasGuardadasJugador") {
        const cont = document.getElementById(contId);
        if (!cont || !p) return;
        cont.setAttribute("data-cuaderno-cont", "1");

        const perms = obtenerPermisosEfectivosPortal(p);
        const puedeAnotar = Boolean(perms.anotarCargas);
        const seriesHoy = leerSeriesHoyPP(p.id);

        const rutinas = (baseRutinas || []).filter(r =>
            !r.esPlantillaBiblioteca && (
                Number(r.personaId) === Number(p.id) ||
                (r.esGrupal && r.deporteDestino === p.deporte && (r.categoriaDestino === p.categoria || r.categoriaDestino === "General"))
            )
        );

        if (!rutinas.length) {
            cont.className = "cp-rutinas-stack";
            cont.innerHTML = `<div class="empty-box">Todavía no tenés rutinas asignadas por tu profesor.</div>`;
            return;
        }

        cont.className = "cp-rutinas-stack";
        cont.innerHTML = rutinas.map((r, rIdx) => {
            const ejsHTML = (r.ejercicios || []).map((ex, eIdx) => {
                const uid = `${r.id}_${eIdx}`;
                const vid = typeof buscarVideoDeEjercicioPorNombreCDM === "function" ? buscarVideoDeEjercicioPorNombreCDM(ex.nombre) : null;
                const mini = typeof renderMiniHombrecitoSVG === "function" ? renderMiniHombrecitoSVG(ex.nombre, r.objetivo || "") : "";
                const cantSeries = Math.max(1, Math.min(10, parseInt(ex.series, 10) || 3));
                const segPausa = parsePausaASegundos(ex.pausa);
                const hist = obtenerHistorialEjercicioPP(p, ex.nombre);

                // Prellenar reps sugeridas y último peso usado
                const matchReps = String(ex.reps || "10").match(/\d+/);
                const repsDef = matchReps ? parseInt(matchReps[0], 10) : 10;
                const matchUltKg = hist.ultima ? String(hist.ultima.detalle || "").match(/^([\d.]+)\s*kg/i) : null;
                const ultKgVal = matchUltKg ? matchUltKg[1] : "";

                const seriesBtns = Array.from({ length: cantSeries }, (_, sIdx) => {
                    const sk = `${r.id}_${eIdx}_${sIdx}`;
                    return `<button type="button" class="cp-serie-btn usr-action-allow ${seriesHoy[sk] ? "done" : ""}" onclick="toggleSerieCuadernoPP(${p.id}, '${sk}', this)">S${sIdx + 1}</button>`;
                }).join("");

                const bloqueCuaderno = puedeAnotar ? `
                    <div class="cp-notebook-bar">
                        <div class="cp-last-meta">
                            ${hist.ultima
                                ? `<span>🕒 Última vez (${escPP(hist.ultima.fecha.slice(5))}): <b>${escPP(hist.ultima.detalle)}</b></span>
                                   <span>🏆 PR: <b>${hist.pr} ${escPP(hist.unidad)}</b>${hist.total > 1 ? ` • ${hist.total} reg.${hist.mejoraPct !== 0 ? ` (${hist.mejoraPct > 0 ? "+" : ""}${hist.mejoraPct}%)` : ""}` : ""}</span>`
                                : `<span>📝 <b>Sin pesos anotados todavía</b> — registrá tu marca de hoy para seguir tu evolución.</span>`}
                        </div>
                        <button type="button" class="btn btn-primary btn-sm usr-action-allow" style="min-height:32px; font-size:0.74rem;" onclick="toggleFormAnotarCuadernoPP('${uid}')">
                            📝 ${hist.ultima ? "Anotar hoy" : "+ Anotar peso"}
                        </button>
                    </div>
                    <form id="cpForm_${uid}" class="cp-log-form hidden" data-ejercicio="${escPP(ex.nombre)}" onsubmit="guardarMarcaDesdeCuadernoPP(event, ${p.id}, '${uid}')">
                        <div class="cp-log-grid">
                            <div class="field">
                                <label>Peso (kg) <small style="font-weight:500;">(0 si corporal)</small></label>
                                <input type="number" name="kg" step="0.5" min="0" value="${escPP(ultKgVal)}" placeholder="Ej: 60">
                            </div>
                            <div class="field">
                                <label>Reps hechas *</label>
                                <input type="number" name="reps" min="1" required value="${repsDef}" placeholder="10">
                            </div>
                            <div class="field cp-nota-field">
                                <label>Nota rápida (opc.)</label>
                                <input type="text" name="nota" placeholder="Ej: costó la última / subir 2.5kg">
                            </div>
                        </div>
                        <div style="display:flex; justify-content:flex-end; gap:0.4rem;">
                            <button type="button" class="btn btn-ghost btn-sm usr-action-allow" onclick="toggleFormAnotarCuadernoPP('${uid}')">Cancelar</button>
                            <button type="submit" class="btn btn-ok btn-sm usr-action-allow">💾 Guardar marca de hoy</button>
                        </div>
                    </form>
                ` : "";

                return `
                    <div class="cp-ex-card">
                        <div class="cp-ex-top">
                            ${mini}
                            <div class="cp-ex-info">
                                <div class="cp-ex-title-row">
                                    <strong>${eIdx + 1}. ${escPP(ex.nombre)}</strong>
                                    ${vid ? `<button type="button" class="routine-video-mini-btn usr-action-allow" onclick="abrirModalReproductorEjercicio(${vid.id})">▶ Video</button>` : ""}
                                </div>
                                <div class="cp-pills-row">
                                    <span class="r-pill r-pill-series">${escPP(ex.series)} × ${escPP(ex.reps)}</span>
                                    <span class="r-pill r-pill-carga">${escPP(ex.peso || "A ajustar")}</span>
                                    <button type="button" class="cp-pausa-btn usr-action-allow" title="Iniciar reloj de descanso"
                                        onclick="if(typeof iniciarDescansoEnGotaRelojCDM==='function') iniciarDescansoEnGotaRelojCDM(${segPausa});">
                                        ⏱️ ${escPP(ex.pausa || "90s")}
                                    </button>
                                </div>
                                ${ex.forma ? `<small style="display:block; margin-top:4px; color:var(--ink-500); font-size:0.74rem;">💡 ${escPP(ex.forma)}</small>` : ""}
                            </div>
                        </div>

                        <div class="cp-series-row">
                            <small style="font-size:0.69rem; font-weight:800; color:var(--ink-500); margin-right:2px;">Series hoy:</small>
                            ${seriesBtns}
                        </div>

                        ${bloqueCuaderno}
                    </div>
                `;
            }).join("");

            return `
                <div class="cp-rutina-card">
                    <div class="cp-rutina-head">
                        <div>
                            <span class="up-chip-glass">${r.esGrupal ? "👥 Plan Grupal" : "👤 Tu Plan Personal"}${puedeAnotar ? " • 📝 Cuaderno Activo" : ""}</span>
                            <h4>${escPP(r.nombre)}</h4>
                            <small>🎯 ${escPP(r.objetivo || "Entrenamiento")} • 🗓️ ${escPP(r.dias || "Semanal")} • ${(r.ejercicios || []).length} ejercicios</small>
                        </div>
                    </div>
                    ${r.notas ? `<div style="padding:0.65rem 0.9rem; background:var(--cdm-50); border-bottom:1px solid var(--line); font-size:0.78rem;"><b>💬 Indicaciones del profe:</b> ${escPP(r.notas)}</div>` : ""}
                    <div class="cp-rutina-body">${ejsHTML}</div>
                </div>
            `;
        }).join("");
    };

    window.renderizarResumenPRsUsuario = function (p) {
        if (!p || document.body?.getAttribute("data-rol") !== "usuario") return;
        const secGraf = document.getElementById("jug-sec-graficos");
        if (!secGraf) return;

        const perms = obtenerPermisosEfectivosPortal(p);
        // Si no tiene permiso para cargar pesos, ocultar el formulario técnico de carga y expandir los gráficos
        const split = secGraf.querySelector(".split-view");
        const colForm = split?.firstElementChild;
        if (colForm && split) {
            colForm.style.display = perms.anotarCargas ? "" : "none";
            split.style.gridTemplateColumns = perms.anotarCargas ? "" : "1fr";
        }

        let box = document.getElementById("upResumenPRsStrip");
        if (!box) {
            box = document.createElement("div");
            box.id = "upResumenPRsStrip";
            secGraf.prepend(box);
        }

        const porEj = {};
        (p.evaluaciones || []).forEach(ev => {
            if (!porEj[ev.ejercicio]) porEj[ev.ejercicio] = [];
            porEj[ev.ejercicio].push(ev);
        });
        const tarjetas = Object.entries(porEj).map(([nom, lista]) => {
            const ord = [...lista].sort((a, b) => String(a.fecha || "").localeCompare(String(b.fecha || "")));
            const ini = ord[0], ult = ord[ord.length - 1];
            const esT = ini.tipo === "tiempo_seg";
            const pr = esT ? Math.min(...ord.map(x => Number(x.valor) || 0)) : Math.max(...ord.map(x => Number(x.valor) || 0));
            const pct = ini.valor > 0 ? Math.round(((esT ? (ini.valor - ult.valor) : (ult.valor - ini.valor)) / ini.valor) * 1000) / 10 : 0;
            return { nom, pr, ultVal: ult.valor, unidad: ult.unidad || "", pct, cant: ord.length };
        });

        if (!tarjetas.length) {
            box.innerHTML = perms.anotarCargas
                ? `<div class="app-panel" style="margin-bottom:0.85rem; text-align:center;"><p style="margin:0; font-size:0.83rem; color:var(--ink-600);">📝 Todavía no tenés pesos anotados. Entrá a <b>Mis Rutinas</b> y tocá <b>+ Anotar peso</b> en cualquier ejercicio para ver acá tus récords y curvas.</p></div>`
                : "";
            return;
        }

        box.innerHTML = `
            <div class="app-panel" style="margin-bottom:0.85rem;">
                <div class="panel-head" style="margin-bottom:0.65rem;">
                    <h3>🏆 Tus Récords Personales (PR) y Evolución</h3>
                    <small style="color:var(--ink-500);">Tocá un ejercicio para ver su curva abajo</small>
                </div>
                <div class="cp-pr-grid">
                    ${tarjetas.map(t => `
                        <div class="cp-pr-card" onclick="const s=document.getElementById('selectFiltroEjercicioGrafico'); if(s){s.value='${escPP(t.nom).replace(/'/g, "\\'")}'; dibujarGraficoEvolucion();}">
                            <strong>${escPP(t.nom)}</strong>
                            <div class="cp-pr-val">🏆 ${t.pr} <small style="font-size:0.7rem; color:var(--ink-500);">${escPP(t.unidad)}</small></div>
                            <small style="font-size:0.7rem; color:${t.pct >= 0 ? "#059669" : "#dc2626"}; font-weight:700;">
                                ${t.cant > 1 ? `${t.pct > 0 ? "+" : ""}${t.pct}% desde inicio (${t.cant} reg.)` : `Último: ${t.ultVal}`}
                            </small>
                        </div>
                    `).join("")}
                </div>
            </div>
        `;
    };

    // =====================================================================
    // 5. HOME DEL PORTAL USUARIO + SECCIONES PARTIDOS Y DEVOLUCIONES
    // =====================================================================
    function construirHTMLHomePortalUsuario(p, perms, esPreview = false) {
        const esGym = p.deporte === "Gimnasio";
        const rutinas = (baseRutinas || []).filter(r =>
            !r.esPlantillaBiblioteca && (
                Number(r.personaId) === Number(p.id) ||
                (r.esGrupal && r.deporteDestino === p.deporte && (r.categoriaDestino === p.categoria || r.categoriaDestino === "General"))
            )
        );
        const totalVideos = Array.isArray(baseVideoteca) ? baseVideoteca.length : 0;
        const an = typeof analizarJugador360Admin32 === "function" ? analizarJugador360Admin32(p) : { partidosStats: { pj: 0, goles: 0, asistencias: 0 }, fortalezas: [], mejoras: [] };
        const media = typeof obtenerMediaJugadorFicha === "function" ? obtenerMediaJugadorFicha(p.id) : [];
        const pred = typeof calcularPredisposicionJusta === "function" ? calcularPredisposicionJusta(p, 30) : { pct: 100 };
        const alDia = (p.pagoEstado || "Al Día") === "Al Día";
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        const devs = Array.isArray(p.devolucionesProfe) ? p.devolucionesProfe : [];
        const clickNav = (sec) => esPreview ? `mostrarToast('👁️ Abre sección: ${sec}')` : `abrirSeccionPortalPro('${sec}')`;

        const cards = [];
        if (perms.rutinas) cards.push(`<div class="up-mod-card" onclick="${clickNav("rutinas")}"><div class="up-mod-top"><div class="up-mod-icon"><i class="ri-clipboard-fill"></i></div><span class="badge badge-celeste">${rutinas.length}</span></div><h4>Mis Rutinas</h4><p>${perms.anotarCargas ? "Entrená y anotá tus pesos hoy" : (rutinas.length ? rutinas[0].nombre : "Sin plan aún")}</p><div class="up-mod-foot"><span>${perms.anotarCargas ? "Entrenar y Anotar" : "Entrenar"}</span><i class="ri-arrow-right-line"></i></div></div>`);
        if (perms.partidos && !esGym) cards.push(`<div class="up-mod-card c-emerald" onclick="${clickNav("partidos-user")}"><div class="up-mod-top"><div class="up-mod-icon" style="background:var(--ok-bg); color:#059669;"><i class="ri-football-fill"></i></div><span class="badge badge-ok">${an.partidosStats.pj} PJ</span></div><h4>Mis Partidos</h4><p>${an.partidosStats.goles}G • ${an.partidosStats.asistencias}A • ${media.length} media</p><div class="up-mod-foot" style="color:#059669;"><span>Ver</span><i class="ri-arrow-right-line"></i></div></div>`);
        if (perms.progreso) cards.push(`<div class="up-mod-card" onclick="${clickNav("graficos")}"><div class="up-mod-top"><div class="up-mod-icon"><i class="ri-line-chart-fill"></i></div><span class="badge badge-celeste">${(p.evaluaciones || []).length}</span></div><h4>Mi Progreso</h4><p>Tus récords PR y evolución</p><div class="up-mod-foot"><span>Abrir</span><i class="ri-arrow-right-line"></i></div></div>`);
        if (perms.videos) cards.push(`<div class="up-mod-card c-purple" onclick="${clickNav("videoteca-user")}"><div class="up-mod-top"><div class="up-mod-icon" style="background:var(--purple-bg); color:#6366f1;"><i class="ri-movie-2-fill"></i></div><span class="badge badge-purple">${totalVideos}</span></div><h4>Videos</h4><p>Técnica por ejercicio</p><div class="up-mod-foot" style="color:#6366f1;"><span>Explorar</span><i class="ri-arrow-right-line"></i></div></div>`);
        if (perms.devoluciones) cards.push(`<div class="up-mod-card c-rose" onclick="${clickNav("devoluciones-user")}"><div class="up-mod-top"><div class="up-mod-icon" style="background:rgba(236,72,153,0.12); color:#db2777;"><i class="ri-chat-heart-fill"></i></div><span class="badge badge-purple">${devs.length || 1}</span></div><h4>Profe</h4><p>Fortalezas y foco</p><div class="up-mod-foot" style="color:#db2777;"><span>Leer</span><i class="ri-arrow-right-line"></i></div></div>`);
        if (perms.calc1rm) cards.push(`<div class="up-mod-card c-purple" onclick="${clickNav("calculadora")}"><div class="up-mod-top"><div class="up-mod-icon" style="background:var(--purple-bg); color:#6366f1;"><i class="ri-calculator-fill"></i></div><span class="badge badge-purple">% 1RM</span></div><h4>Cargas 1RM</h4><p>Kilos por porcentaje</p><div class="up-mod-foot" style="color:#6366f1;"><span>Calcular</span><i class="ri-arrow-right-line"></i></div></div>`);
        if (perms.ranking) cards.push(`<div class="up-mod-card c-amber" onclick="${clickNav("ranking-user")}"><div class="up-mod-top"><div class="up-mod-icon" style="background:var(--warn-bg); color:#d97706;"><i class="ri-trophy-fill"></i></div><span class="badge badge-warn">${esGym ? "PRs" : p.categoria}</span></div><h4>Ranking</h4><p>Posiciones del grupo</p><div class="up-mod-foot" style="color:#d97706;"><span>Ver</span><i class="ri-arrow-right-line"></i></div></div>`);

        const checkinHTML = perms.checkin ? `
            <div class="up-checkin-strip">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
                    <strong style="font-size:0.82rem; color:var(--ink-900);">😊 ¿Cómo llegás hoy?</strong>
                    <button type="button" class="btn btn-ghost btn-sm usr-action-allow" style="min-height:28px; font-size:0.72rem;" onclick="${clickNav("clinica")}">+ Peso / Dolor</button>
                </div>
                <div class="up-emoji-row">
                    <button type="button" class="up-emoji-btn usr-action-allow" onclick="${esPreview ? "mostrarToast('🔥 100%')" : `guardarCheckinRapidoEmoji(${p.id}, 5, 4, 'Excelente energía')`}"><span>🔥</span>100%</button>
                    <button type="button" class="up-emoji-btn usr-action-allow" onclick="${esPreview ? "mostrarToast('🙂 Bien')" : `guardarCheckinRapidoEmoji(${p.id}, 4, 6, 'Bien para entrenar')`}"><span>🙂</span>Bien</button>
                    <button type="button" class="up-emoji-btn usr-action-allow" onclick="${esPreview ? "mostrarToast('😐 Cansado')" : `guardarCheckinRapidoEmoji(${p.id}, 3, 7, 'Algo cansado')`}"><span>😐</span>Cansado</button>
                    <button type="button" class="up-emoji-btn usr-action-allow" onclick="${esPreview ? "mostrarToast('🤕 Molestia')" : `guardarCheckinRapidoEmoji(${p.id}, 2, 8, 'Con molestia muscular')`}"><span>🤕</span>Dolor</button>
                </div>
            </div>
        ` : "";

        const cuotaHTML = perms.cuota ? `
            <div class="up-cuota-card">
                <div>
                    <span class="badge ${alDia ? "badge-ok" : "badge-danger"}">${alDia ? "💳 Cuota Al Día" : "⚠️ Cuota Pendiente"}</span>
                    <div style="font-size:0.75rem; color:var(--ink-600); margin-top:3px;">$${Number(p.montoCuota || 25000).toLocaleString("es-AR")}${lic.aliasTransferencia ? ` • Alias: <b>${lic.aliasTransferencia}</b>` : ""}</div>
                </div>
                ${lic.aliasTransferencia ? `<button type="button" class="btn btn-secondary btn-sm usr-action-allow" onclick="navigator.clipboard.writeText('${lic.aliasTransferencia.replace(/'/g, "\\'")}'); mostrarToast('📋 Alias copiado.');">📋 Copiar Alias</button>` : ""}
            </div>
        ` : "";

        return `
            <div class="up-hero-banner">
                <div class="up-hero-id">
                    ${typeof renderAvatarPersonaCDM === "function" ? renderAvatarPersonaCDM(p, 52, "1.1rem", !esPreview) : ""}
                    <div>
                        <h3 class="up-hero-name">¡Hola, ${p.nombre}!</h3>
                        <span class="up-hero-sub">${esGym ? "🏋️ Gimnasio" : `${p.deporte} • ${p.categoria}`} • ${p.puesto || "Deportista"}</span>
                        <div class="up-hero-chips">
                            ${perms.score && !esGym ? `<span class="up-chip-glass">⭐ ${p.puntosCategoria}/10</span>` : ""}
                            <span class="up-chip-glass ok">📅 ${pred.pct}% asist.</span>
                            ${perms.anotarCargas ? `<span class="up-chip-glass">📝 Cuaderno activo</span>` : ""}
                            ${p.estadoMedico && p.estadoMedico !== "Óptimo" ? `<span class="up-chip-glass warn">🏥 ${p.estadoMedico}</span>` : ""}
                        </div>
                    </div>
                </div>
            </div>
            ${checkinHTML}
            <div class="up-cards-grid">${cards.length ? cards.join("") : `<div class="empty-box">Tu entrenador aún no habilitó secciones visibles.</div>`}</div>
            ${cuotaHTML}
        `;
    }

    window.guardarCheckinRapidoEmoji = function (idPersona, sueno, rpe, texto) {
        const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
        if (!p) return;
        if (!Array.isArray(p.clinico)) p.clinico = [];
        p.clinico.push({ id: Date.now(), fecha: obtenerHoyISO(), peso: p.peso || 70, altura: p.altura || 170, sueno, rpe, dolor: `Check-in: ${texto}` });
        if (typeof guardarDatosCDM === "function") guardarDatosCDM();
        mostrarToast(`✅ Estado registrado: ${texto}`);
    };

    function asegurarSeccionesNuevasUsuario(p) {
        const main = document.querySelector(".app-content");
        if (!main || !p) return;

        let secPart = document.getElementById("jug-sec-partidos-user");
        if (!secPart) {
            secPart = document.createElement("section");
            secPart.id = "jug-sec-partidos-user";
            secPart.className = "jug-seccion hidden";
            main.appendChild(secPart);
        }
        const an = typeof analizarJugador360Admin32 === "function" ? analizarJugador360Admin32(p) : { partidosStats: { pj: 0, goles: 0, asistencias: 0, quites: 0, detallePartidos: [] }, fortalezas: [], mejoras: [] };
        const stP = an.partidosStats;
        const media = typeof obtenerMediaJugadorFicha === "function" ? obtenerMediaJugadorFicha(p.id) : [];

        secPart.innerHTML = `
            <div class="app-panel">
                <div class="panel-head"><h3>⚽ Mis Partidos y Galería</h3></div>
                <div class="bento-kpis" style="margin-bottom:0.85rem;">
                    <div class="bento-kpi"><div class="kpi-data"><span>Jugados</span><strong>${stP.pj} PJ</strong></div></div>
                    <div class="bento-kpi"><div class="kpi-data"><span>Goles</span><strong style="color:var(--ok);">${stP.goles}</strong></div></div>
                    <div class="bento-kpi"><div class="kpi-data"><span>Asistencias</span><strong>${stP.asistencias}</strong></div></div>
                    <div class="bento-kpi"><div class="kpi-data"><span>Quites</span><strong>${stP.quites}</strong></div></div>
                </div>
                <div style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:0.9rem;">
                    ${stP.detallePartidos.length === 0 ? `<div class="empty-box" style="padding:1rem;">Sin partidos registrados todavía.</div>` :
                    stP.detallePartidos.map(dp => `<div style="background:var(--surface-subtle); border:1px solid var(--line); border-left:4px solid #10b981; border-radius:12px; padding:0.65rem 0.8rem; font-size:0.81rem;"><strong>📅 ${dp.partido.fecha} vs ${dp.partido.rival} (${dp.partido.resultado || "S/D"})</strong><div style="margin-top:4px; display:flex; gap:0.3rem; flex-wrap:wrap;">${dp.evs.map(e => `<span class="badge badge-celeste" style="font-size:0.69rem;">${e.minutoDisplay || ""} ${e.tipo}</span>`).join("") || `<small>Participación</small>`}</div></div>`).join("")}
                </div>
                ${media.length ? `<strong style="display:block; font-size:0.84rem; margin-bottom:0.45rem;">📸 Fotos y Videos (${media.length}):</strong><div class="cm36-media-grid">${media.map(it => `<div class="cm36-media-card">${it.tipo === "foto" ? `<img data-up-idb="${it.idbKey}" src="" onclick="window.open(this.src,'_blank')">` : `<a href="${it.url}" target="_blank" style="height:96px; background:#0f172a; color:#38bdf8; display:flex; align-items:center; justify-content:center; text-decoration:none; font-weight:800;">▶ Ver Video</a>`}<div style="padding:0.3rem 0.45rem; font-size:0.71rem;"><b>${it.titulo}</b></div></div>`).join("")}</div>` : ""}
            </div>
        `;
        if (typeof leerFotoPartidoIDBFicha === "function") {
            secPart.querySelectorAll("img[data-up-idb]").forEach(async img => { const src = await leerFotoPartidoIDBFicha(img.dataset.upIdb); if (src) img.src = src; });
        }

        let secDev = document.getElementById("jug-sec-devoluciones-user");
        if (!secDev) {
            secDev = document.createElement("section");
            secDev.id = "jug-sec-devoluciones-user";
            secDev.className = "jug-seccion hidden";
            main.appendChild(secDev);
        }
        const devs = Array.isArray(p.devolucionesProfe) ? p.devolucionesProfe : [];
        secDev.innerHTML = `
            <div class="app-panel">
                <div class="panel-head"><h3>💬 Devoluciones y Plan del Profe</h3></div>
                <div class="jf-diag-box" style="margin-top:0; margin-bottom:0.9rem;">
                    ${(an.fortalezas || []).slice(0, 3).map(f => `<div class="jf-diag-ok">✅ ${f}</div>`).join("")}
                    ${(an.mejoras || []).slice(0, 3).map(m => `<div class="jf-diag-warn">🎯 ${m}</div>`).join("")}
                </div>
                ${devs.length ? `<div style="display:flex; flex-direction:column; gap:0.5rem;">${devs.map(d => `<div style="background:var(--surface-subtle); border:1px solid var(--line); border-radius:12px; padding:0.7rem; font-size:0.8rem; white-space:pre-line;"><small style="color:var(--ink-500); font-weight:800; display:block; margin-bottom:3px;">📅 ${d.fecha}</small>${d.textoCompleto}</div>`).join("")}</div>` : ""}
            </div>
        `;
    }

    window.abrirSeccionPortalPro = function (nombreSec) {
        document.body.setAttribute("data-user-sec", nombreSec);
        document.querySelectorAll(".jug-seccion").forEach(s => { s.classList.add("hidden"); s.classList.remove("animate-in"); });
        const sec = document.getElementById(`jug-sec-${nombreSec}`);
        if (sec) { sec.classList.remove("hidden"); sec.classList.add("animate-in"); }

        document.querySelectorAll(".module-tabs .mod-tab, #cdmUserMobileBottomDock .user-quick-dock-btn").forEach(b => {
            b.classList.toggle("active", b.getAttribute("data-user-tab") === nombreSec);
        });

        const p = typeof obtenerJugadorActualPorURL === "function" ? obtenerJugadorActualPorURL() : null;
        if (nombreSec === "rutinas" && p) {
            window.renderizarCuadernoRutinasUsuario(p, "listaRutinasGuardadasJugador");
        } else if (nombreSec === "videoteca-user" && typeof renderizarVideotecaModoUsuario === "function") {
            renderizarVideotecaModoUsuario();
        } else if (nombreSec === "ranking-user" && typeof renderizarRankingModoUsuario === "function") {
            renderizarRankingModoUsuario();
        } else if (nombreSec === "graficos" && p) {
            window.renderizarResumenPRsUsuario(p);
            if (typeof dibujarGraficoEvolucion === "function") dibujarGraficoEvolucion();
            if (typeof dibujarRadarJugador === "function") dibujarRadarJugador(p);
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    function aplicarPortalUsuarioConPermisos() {
        if (document.body?.getAttribute("data-rol") !== "usuario") return;
        if (document.body?.getAttribute("data-modo-portal") === "paciente") return;

        const p = typeof obtenerJugadorActualPorURL === "function" ? obtenerJugadorActualPorURL() : null;
        if (!p) return;

        if (!document.body.getAttribute("data-user-sec")) {
            document.body.setAttribute("data-user-sec", "inicio-user");
        }

        const perms = obtenerPermisosEfectivosPortal(p);
        asegurarSeccionesNuevasUsuario(p);

        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        const h2Top = document.querySelector(".app-topbar .topbar-title h2");
        if (h2Top && lic.nombreEntidad) h2Top.innerText = lic.nombreEntidad;

        const contInicio = document.getElementById("contenedorCardsInicioUsuario");
        if (contInicio) contInicio.innerHTML = construirHTMLHomePortalUsuario(p, perms, false);

        const itemsNav = [
            { tab: "inicio-user", icon: "ri-home-5-fill", txt: "Inicio", show: true },
            { tab: "rutinas", icon: "ri-clipboard-fill", txt: "Rutinas", show: perms.rutinas },
            { tab: "graficos", icon: "ri-line-chart-fill", txt: "Progreso", show: perms.progreso },
            { tab: "partidos-user", icon: "ri-football-fill", txt: "Partidos", show: perms.partidos && p.deporte !== "Gimnasio" },
            { tab: "videoteca-user", icon: "ri-movie-2-fill", txt: "Videos", show: perms.videos },
            { tab: "devoluciones-user", icon: "ri-chat-heart-fill", txt: "Profe", show: perms.devoluciones },
            { tab: "calculadora", icon: "ri-calculator-fill", txt: "% 1RM", show: perms.calc1rm },
            { tab: "ranking-user", icon: "ri-trophy-fill", txt: "Ranking", show: perms.ranking }
        ].filter(x => x.show);

        const secActiva = document.body.getAttribute("data-user-sec") || "inicio-user";

        const tabsBar = document.querySelector(".module-tabs");
        if (tabsBar) {
            tabsBar.innerHTML = itemsNav.map(it => `
                <button type="button" class="mod-tab ${it.tab === secActiva ? "active" : ""}" data-user-tab="${it.tab}" onclick="abrirSeccionPortalPro('${it.tab}')">
                    <i class="${it.icon}"></i><span>${it.txt}</span>
                </button>
            `).join("");
        }

        let dock = document.getElementById("cdmUserMobileBottomDock");
        if (!dock) {
            dock = document.createElement("nav");
            dock.id = "cdmUserMobileBottomDock";
            dock.className = "user-mobile-bottom-dock";
            document.body.appendChild(dock);
        }
        dock.innerHTML = itemsNav.slice(0, 5).map(it => `
            <button type="button" class="user-quick-dock-btn ${it.tab === secActiva ? "active" : ""}" data-user-tab="${it.tab}" onclick="abrirSeccionPortalPro('${it.tab}')">
                <i class="${it.icon}"></i><span>${it.txt}</span>
            </button>
        `).join("");

        // Mantener actualizado el cuaderno o los PRs si el usuario está en esa pestaña
        if (secActiva === "rutinas") window.renderizarCuadernoRutinasUsuario(p, "listaRutinasGuardadasJugador");
        if (secActiva === "graficos") window.renderizarResumenPRsUsuario(p);
    }

    // =====================================================================
    // 6. BOTÓN DE CONTROL DEL PROFE EN PLANTEL (FÚTBOL, HOCKEY Y GYM)
    // =====================================================================
    function inyectarBotonesControlPortalAdmin() {
        if (document.body?.getAttribute("data-rol") === "usuario" || document.body?.classList.contains("login-page")) return;

        const barPlantel = document.getElementById("pePlantelToolbar");
        if (barPlantel && !document.getElementById("btnConfigPortalCategoria")) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.id = "btnConfigPortalCategoria";
            btn.className = "btn btn-secondary btn-sm";
            btn.onclick = () => abrirModalConfigurarPortalUsuario(null);
            btn.innerHTML = "👁️ Qué ve el Usuario";
            barPlantel.appendChild(btn);
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(() => { inyectarBotonesControlPortalAdmin(); aplicarPortalUsuarioConPermisos(); }, 350);
        setTimeout(() => { inyectarBotonesControlPortalAdmin(); aplicarPortalUsuarioConPermisos(); }, 850);
    });
    document.addEventListener("click", () => setTimeout(inyectarBotonesControlPortalAdmin, 150));
})();