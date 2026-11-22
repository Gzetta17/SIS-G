/**
 * js/nav-ui.js — Navegación Responsive, Menús Desplegables, Buscador Ctrl+K y Notas Rápidas
 * Adaptado a Clubes Deportivos, Gimnasios y Consultorios con Disciplinas Independientes
 * CDM Pro Suite — Desarrollado por Gonzalo Adanchú
 */

(function () {
    // =====================================================================
    // 1. ESTILOS GLOBALES DE NAVEGACIÓN, CAPAS (Z-INDEX), CTRL+K Y NOTAS
    // =====================================================================
    function inyectarCSSNavUI() {
        document.getElementById("cdmCssNavUI")?.remove();
        const st = document.createElement("style");
        st.id = "cdmCssNavUI";
        st.textContent = `
            /* Jerarquía estricta de capas: los modales siempre van arriba de todo */
            html, body { max-width: 100vw; overflow-x: hidden; }
            .app-main, .app-content, .app-panel, .split-view > *, .split-equal > * { min-width: 0; }
            .table-wrap { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
            .chart-canvas-box { width: 100%; max-width: 100%; min-height: 230px; position: relative; }

            .app-topbar { position: sticky; top: 0; z-index: 90 !important; overflow: visible !important; }
            #fichaCabeceraJugador { position: relative !important; z-index: 40 !important; overflow: visible !important; }
            .module-tabs { position: relative !important; z-index: 15 !important; }
            .jug-seccion, .dep-seccion, .gym-seccion { position: relative !important; z-index: 1 !important; }
            .menu33-dropdown { z-index: 9900 !important; }
            #cdmFloatingDropletClock { z-index: 1400 !important; }
            .modal-backdrop { z-index: 10050 !important; padding: 0.85rem !important; overflow-y: auto !important; }
            .modal-window { max-height: 92vh !important; overflow-y: auto !important; width: min(96vw, 720px); margin: auto !important; }
            .toast-container { z-index: 10200 !important; }

            /* Ocultar Notas si SuperAdmin las desactivó */
            body[data-feat-gen-notas="off"] #btnNotasRapidasTopbar,
            body[data-feat-gen-notas="off"] .btn-notas-quick-nav { display: none !important; }

            /* Botón hamburguesa (solo visible <= 1024px) */
            #btnMobileSidebar33 {
                display: none;
                align-items: center;
                justify-content: center;
                width: 38px;
                height: 38px;
                padding: 0 !important;
                border-radius: 10px;
                flex-shrink: 0;
                font-size: 1.2rem;
            }
            #cdmSidebarBackdrop33 {
                display: none;
                position: fixed;
                inset: 0;
                background: rgba(2, 6, 23, 0.56);
                backdrop-filter: blur(3px);
                z-index: 9400;
            }
            body.sidebar-mobile-open-33 #cdmSidebarBackdrop33 { display: block; }

            .menu38-close-btn {
                display: none;
                align-items: center;
                justify-content: center;
                width: 34px;
                height: 34px;
                border-radius: 10px;
                border: 1px solid rgba(255, 255, 255, 0.18);
                background: rgba(255, 255, 255, 0.08);
                color: #ffffff;
                font-size: 1.05rem;
                cursor: pointer;
                flex-shrink: 0;
            }

            /* Buscador compacto en sidebar */
            .nav-search-trigger {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.5rem;
                padding: 0.5rem 0.72rem;
                margin-bottom: 0.55rem;
                border-radius: 11px;
                border: 1px solid rgba(148, 163, 184, 0.25);
                background: rgba(255, 255, 255, 0.06);
                color: rgba(226, 232, 240, 0.9);
                font-size: 0.8rem;
                font-weight: 700;
                cursor: pointer;
                transition: background 0.15s ease, border-color 0.15s ease;
            }
            .nav-search-trigger:hover {
                background: rgba(56, 189, 248, 0.16);
                border-color: rgba(56, 189, 248, 0.45);
                color: #ffffff;
            }
            .nav-search-kbd {
                font-size: 0.66rem;
                font-weight: 800;
                color: #94a3b8;
                background: rgba(15, 23, 42, 0.55);
                padding: 2px 6px;
                border-radius: 6px;
            }

            /* Acordeones desplegables en sidebar PC */
            .menu38-acc { display: flex; flex-direction: column; gap: 0.2rem; width: 100%; }
            .menu38-acc-btn {
                width: 100%;
                border: none;
                background: transparent;
                color: rgba(226, 232, 240, 0.9);
                font-size: 0.86rem;
                font-weight: 700;
                padding: 0.62rem 0.8rem;
                border-radius: 11px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.6rem;
                text-align: left;
                transition: background 0.15s ease, color 0.15s ease;
            }
            .menu38-acc-btn:hover, .menu38-acc.open > .menu38-acc-btn {
                background: rgba(56, 189, 248, 0.14);
                color: #ffffff;
            }
            .menu38-acc-left { display: flex; align-items: center; gap: 0.65rem; min-width: 0; }
            .menu38-acc-arrow { transition: transform 0.2s ease; font-size: 1rem; opacity: 0.8; }
            .menu38-acc.open > .menu38-acc-btn .menu38-acc-arrow { transform: rotate(180deg); }
            .menu38-acc-list {
                display: none;
                flex-direction: column;
                gap: 0.18rem;
                padding: 0.15rem 0 0.25rem 0.95rem;
                margin-left: 0.75rem;
                border-left: 2px solid rgba(56, 189, 248, 0.28);
            }
            .menu38-acc.open > .menu38-acc-list { display: flex !important; }
            .menu38-sublink {
                width: 100%;
                border: none;
                background: transparent;
                color: rgba(203, 213, 225, 0.92);
                text-decoration: none;
                font-size: 0.81rem;
                font-weight: 600;
                padding: 0.46rem 0.7rem;
                border-radius: 9px;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                cursor: pointer;
                text-align: left;
            }
            .menu38-sublink:hover { background: rgba(255, 255, 255, 0.1); color: #ffffff; }
            .menu38-sublink.active { background: #0284c7; color: #ffffff; font-weight: 800; }

            /* Accesos rápidos del menú hamburguesa (móvil/tablet) */
            .menu38-quick-box { display: none; margin-top: 0.35rem; }
            .menu38-quick-title {
                font-size: 0.68rem;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: rgba(148, 163, 184, 0.95);
                margin-bottom: 0.5rem;
                display: block;
            }
            .menu38-quick-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.45rem; }
            .menu38-quick-btn {
                border: 1px solid rgba(255, 255, 255, 0.15);
                background: rgba(255, 255, 255, 0.06);
                color: #f1f5f9;
                font-size: 0.75rem;
                font-weight: 700;
                padding: 0.58rem 0.52rem;
                border-radius: 11px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.4rem;
                text-align: left;
            }
            .menu38-quick-btn:hover { background: rgba(56, 189, 248, 0.22); border-color: rgba(56, 189, 248, 0.48); }
            .menu38-quick-btn.danger { border-color: rgba(244, 63, 94, 0.42); background: rgba(244, 63, 94, 0.15); color: #fda4af; }

            /* Barra inferior fija móvil */
            #cdmBottomNav38 {
                display: none;
                position: fixed;
                left: 0;
                right: 0;
                bottom: 0;
                height: 66px;
                background: rgba(12, 25, 44, 0.97);
                backdrop-filter: blur(12px);
                border-top: 1px solid rgba(148, 163, 184, 0.22);
                padding: 0.3rem 0.35rem calc(0.3rem + env(safe-area-inset-bottom, 0px));
                z-index: 8800;
                align-items: center;
                justify-content: space-around;
                gap: 0.2rem;
                box-shadow: 0 -8px 26px rgba(2, 6, 23, 0.32);
            }
            .bnav38-item {
                flex: 1;
                min-width: 0;
                max-width: 96px;
                border: none;
                background: transparent;
                color: rgba(203, 213, 225, 0.88);
                text-decoration: none;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 2px;
                padding: 0.34rem 0.2rem;
                border-radius: 11px;
                cursor: pointer;
                font-size: 0.63rem;
                font-weight: 700;
                line-height: 1.1;
            }
            .bnav38-item i { font-size: 1.18rem; line-height: 1; }
            .bnav38-item span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
            .bnav38-item.active, .bnav38-item.sheet-open {
                background: #0284c7;
                color: #ffffff;
                box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
            }

            /* Panel desplegable hacia arriba desde la barra inferior */
            #cdmBottomSheetBg38 {
                display: none;
                position: fixed;
                inset: 0;
                background: rgba(2, 6, 23, 0.45);
                backdrop-filter: blur(2px);
                z-index: 8900;
            }
            #cdmBottomSheetBg38.open { display: block; }
            #cdmBottomSheet38 {
                display: none;
                position: fixed;
                left: 0.65rem;
                right: 0.65rem;
                bottom: 74px;
                max-width: 440px;
                margin: 0 auto;
                background: #0f172a;
                color: #f8fafc;
                border: 1.5px solid rgba(56, 189, 248, 0.35);
                border-radius: 18px;
                padding: 0.85rem;
                z-index: 8950;
                box-shadow: 0 18px 42px rgba(2, 6, 23, 0.55);
                max-height: 55vh;
                overflow-y: auto;
            }
            #cdmBottomSheet38.open { display: block; }
            .bsheet38-head {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.6rem;
                padding-bottom: 0.45rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.12);
            }
            .bsheet38-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.45rem; }
            .bsheet38-opt {
                border: 1px solid rgba(255, 255, 255, 0.14);
                background: rgba(255, 255, 255, 0.06);
                color: #f1f5f9;
                text-decoration: none;
                border-radius: 12px;
                padding: 0.65rem 0.7rem;
                font-size: 0.8rem;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 0.45rem;
                cursor: pointer;
                text-align: left;
            }
            .bsheet38-opt:hover, .bsheet38-opt.active { background: #0284c7; border-color: #38bdf8; color: #ffffff; }

            /* Desplegables genéricos (Menú ⋯ y Topbar Más) */
            .menu33-wrap { position: relative; display: inline-flex; }
            .menu33-dropdown {
                position: absolute;
                top: calc(100% + 8px);
                right: 0;
                width: min(295px, 90vw);
                max-height: 74vh;
                overflow-y: auto;
                background: var(--surface-solid, #ffffff);
                color: var(--ink-900, #0f172a);
                border: 1.5px solid var(--line-strong, #cbd5e1);
                border-radius: 16px;
                padding: 0.55rem;
                box-shadow: 0 22px 50px rgba(2, 6, 23, 0.28);
                display: none;
                flex-direction: column;
                gap: 0.3rem;
                text-align: left;
            }
            .menu33-dropdown.open { display: flex !important; }
            .menu33-section-lbl {
                font-size: 0.64rem;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: var(--ink-500, #64748b);
                padding: 0.3rem 0.45rem 0.1rem;
            }
            .menu33-item {
                width: 100%;
                border: 1px solid transparent;
                background: transparent;
                color: var(--ink-900, #0f172a);
                font-size: 0.8rem;
                font-weight: 600;
                padding: 0.46rem 0.65rem;
                border-radius: 10px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.5rem;
                text-align: left;
            }
            .menu33-item:hover { background: var(--surface-subtle, #f1f5f9); border-color: var(--line, #e2e8f0); }
            .menu33-divider { height: 1px; background: var(--line, #e2e8f0); margin: 0.2rem 0; }
            .topbar-drop33 .btn { width: 100% !important; justify-content: flex-start !important; border-radius: 10px !important; min-height: 36px !important; }
            body[data-theme="dark"] .menu33-dropdown { background: #0f172a !important; border-color: rgba(148, 163, 184, 0.32) !important; }
            body[data-theme="dark"] .menu33-dropdown .menu33-item { color: #f1f5f9 !important; }

            /* Drawer lateral de Notas Rápidas */
            #cdmNotasBackdrop {
                display: none;
                position: fixed;
                inset: 0;
                background: rgba(2, 6, 23, 0.45);
                backdrop-filter: blur(2px);
                z-index: 10020;
            }
            #cdmNotasBackdrop.open { display: block; }
            #cdmNotasDrawer {
                position: fixed;
                top: 0;
                right: 0;
                bottom: 0;
                width: min(390px, 94vw);
                background: var(--surface-solid, #ffffff);
                color: var(--ink-900, #0f172a);
                border-left: 1.5px solid var(--line-strong, #cbd5e1);
                z-index: 10030;
                transform: translateX(105%);
                transition: transform 0.24s ease;
                display: flex;
                flex-direction: column;
                padding: 1rem;
                box-shadow: -14px 0 40px rgba(2, 6, 23, 0.25);
            }
            #cdmNotasDrawer.open { transform: translateX(0); }

            /* Responsive Tablet y Celular (<= 1024px) */
            @media (max-width: 1024px) {
                #btnMobileSidebar33 { display: inline-flex !important; }
                #cdmBottomNav38 { display: flex !important; }
                .menu38-close-btn { display: inline-flex !important; }
                .menu38-quick-box { display: block !important; }

                body .app-shell > aside.app-sidebar .sidebar-nav,
                body .app-shell > aside.app-sidebar .sidebar-group-label { display: none !important; }

                body .app-shell > aside.app-sidebar {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    bottom: 0 !important;
                    width: min(305px, 86vw) !important;
                    height: 100dvh !important;
                    display: flex !important;
                    flex-direction: column !important;
                    padding: 0.95rem 0.85rem 1.35rem !important;
                    overflow-y: auto !important;
                    z-index: 9500 !important;
                    transform: translateX(-105%) !important;
                    transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1) !important;
                    box-shadow: 16px 0 42px rgba(2, 6, 23, 0.45) !important;
                }
                body.sidebar-mobile-open-33 .app-shell > aside.app-sidebar { transform: translateX(0) !important; }
                body .app-shell > aside.app-sidebar .sidebar-brand {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: space-between !important;
                    margin-bottom: 0.8rem !important;
                    padding-bottom: 0.7rem !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.12) !important;
                }
                body .app-main { margin-left: 0 !important; padding-bottom: 84px !important; width: 100% !important; }
                .split-view, .split-equal { grid-template-columns: 1fr !important; }
                #cdmFloatingDropletClock { bottom: 78px !important; }
            }

            @media (max-width: 768px) {
                .app-topbar { flex-wrap: nowrap !important; min-height: 56px !important; padding: 0.6rem 0.8rem !important; }
                .topbar-subtitle { display: none !important; }
                .app-topbar .topbar-left { min-width: 0 !important; flex: 1 !important; }
                .app-topbar .topbar-title { min-width: 0 !important; }
                .app-topbar .topbar-title h2 { font-size: 0.96rem !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
                .app-topbar .topbar-right #btnToggleTemaCDM,
                .app-topbar .topbar-right #cdmBarraSesionActiva,
                .app-topbar .topbar-right #topbarMenuWrap33,
                .app-topbar .topbar-right #btnNotasRapidasTopbar { display: none !important; }
                .app-content { padding: 0.8rem !important; }
                .app-panel { padding: 0.85rem !important; }
                .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr !important; }
                .bento-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 0.55rem !important; }
            }
        `;
        document.head.appendChild(st);
    }

    // =====================================================================
    // 2. HELPERS DE MENÚS, DRAWER MÓVIL Y DESPLEGABLES
    // =====================================================================
    function esModoSoloConsultorioNav() {
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        if (typeof esComercioSoloConsultorio === "function") return esComercioSoloConsultorio(lic);
        const mod = lic?.modulos || { futbol: true, hockey: true, gym: true, consultorio: false };
        const tieneDepOGym = (mod.futbol !== false) || (mod.hockey !== false) || (mod.gym !== false) || ((lic?.deportesExtra || []).length > 0);
        const profs = Array.isArray(lic?.profesionesHabilitadas) ? lic.profesionesHabilitadas : [];
        return (mod.consultorio !== false) && profs.length > 0 && !tieneDepOGym;
    }

    window.alternarSidebarMovil = function (forzarCerrar = false) {
        if (forzarCerrar) document.body.classList.remove("sidebar-mobile-open-33");
        else document.body.classList.toggle("sidebar-mobile-open-33");
    };
    window.alternarSidebarMovil33 = window.alternarSidebarMovil;

    window.alternarAcordeonMenu = function (idAcc) {
        document.getElementById(idAcc)?.classList.toggle("open");
    };

    window.cerrarBottomSheetNav = function () {
        document.getElementById("cdmBottomSheet38")?.classList.remove("open");
        document.getElementById("cdmBottomSheetBg38")?.classList.remove("open");
        document.querySelectorAll("#cdmBottomNav38 .bnav38-item").forEach(b => b.classList.remove("sheet-open"));
    };

    window.irAInicioUnificadoNav = function (ev) {
        cerrarBottomSheetNav();
        alternarSidebarMovil(true);
        if (document.querySelector(".sports-showcase-grid")) {
            if (ev) ev.preventDefault();
            if (typeof volverAlInicioDesdeConsultorio === "function") {
                volverAlInicioDesdeConsultorio();
            } else {
                document.getElementById("cdmSeccionConsultorioGlobal")?.classList.add("hidden");
                document.getElementById("cdmSeccionBaseGeneral37")?.classList.add("hidden");
                document.getElementById("cdmSeccionContabilidadGlobal")?.classList.add("hidden");
                document.querySelector(".section-head")?.classList.remove("hidden");
                document.querySelector(".sports-showcase-grid")?.classList.remove("hidden");
                if (typeof inicializarIndex === "function") inicializarIndex();
            }
        } else {
            window.location.href = "index.html";
        }
    };

    window.alternarMenu33 = function (idDropdown, ev) {
        if (ev) ev.stopPropagation();
        const target = document.getElementById(idDropdown);
        if (!target) return;
        const estaba = target.classList.contains("open");
        document.querySelectorAll(".menu33-dropdown.open").forEach(d => d.classList.remove("open"));
        if (!estaba) {
            if (idDropdown === "topbarMenuDrop33") {
                const btn = document.getElementById("btnTopbarHamburguesa33");
                if (btn) {
                    const r = btn.getBoundingClientRect();
                    target.style.position = "fixed";
                    target.style.top = `${Math.round(r.bottom + 8)}px`;
                    target.style.right = `${Math.max(8, Math.round(window.innerWidth - r.right))}px`;
                    target.style.left = "auto";
                    target.style.zIndex = "99999";
                }
            }
            target.classList.add("open");
        }
    };

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".menu33-wrap") && !e.target.closest("#topbarMenuDrop33")) {
            document.querySelectorAll(".menu33-dropdown.open").forEach(d => d.classList.remove("open"));
        }
    });

    window.irAProfesionConsultorioNav = function (claveEsp) {
        cerrarBottomSheetNav();
        alternarSidebarMovil(true);
        document.getElementById("cdmSeccionBaseGeneral37")?.classList.add("hidden");
        document.getElementById("cdmSeccionContabilidadGlobal")?.classList.add("hidden");

        if (document.querySelector(".sports-showcase-grid")) {
            if (typeof abrirEspecialidadDesdeInicioCDM === "function") {
                abrirEspecialidadDesdeInicioCDM(claveEsp);
            } else if (typeof abrirModuloConsultorioIndependienteCDM === "function") {
                if (claveEsp) window.especialidadFiltroConsultorioCDM = claveEsp;
                abrirModuloConsultorioIndependienteCDM("agenda", true);
            }
        } else {
            window.location.href = "index.html";
        }
    };

    window.ejecutarAccesoRapidoNav = function (accion) {
        cerrarBottomSheetNav();
        alternarSidebarMovil(true);
        if (accion === "tema" && typeof alternarTemaVisualCDM === "function") alternarTemaVisualCDM();
        else if (accion === "buscar") abrirBuscadorUniversal();
        else if (accion === "notas") abrirNotasRapidasCDM();
        else if (accion === "caja" && typeof abrirModalCierreCaja25 === "function") abrirModalCierreCaja25();
        else if (accion === "comercio") window.location.href = "login.html?hub=1";
        else if (accion === "salir" && typeof cerrarSesionCDM === "function") cerrarSesionCDM();
        else if (accion === "modulos" && typeof abrirModalSuperAdminCDM === "function") abrirModalSuperAdminCDM();
    };

    window.abrirBottomSheetNav = function (tipo, btnEl) {
        const sheet = document.getElementById("cdmBottomSheet38");
        const bg = document.getElementById("cdmBottomSheetBg38");
        if (!sheet || !bg) return;

        const yaEstaba = sheet.classList.contains("open") && sheet.dataset.tipo === tipo;
        cerrarBottomSheetNav();
        if (yaEstaba) return;

        const depAct = typeof deportePagina !== "undefined" ? String(deportePagina || "") : "";
        const espAct = String(window.especialidadFiltroConsultorioCDM || "").toLowerCase();
        let titulo = "", contenido = "";

        if (tipo === "deportes") {
            const lista = window.__listaDeportesNav || [];
            titulo = `🏆 Seleccionar Deporte (${lista.length})`;
            contenido = lista.map(d => `
                <a href="${d.href}" class="bsheet38-opt ${depAct.toLowerCase() === d.key.toLowerCase() ? "active" : ""}">
                    <span>${d.icono}</span><span>${d.nombre}</span>
                </a>
            `).join("");
        } else if (tipo === "consultorio") {
            const profs = window.__listaProfesionesNav || [];
            titulo = `🩺 Especialidades (${profs.length})`;
            contenido = profs.map(pr => `
                <button type="button" class="bsheet38-opt ${espAct === pr.clave.toLowerCase() ? "active" : ""}" onclick="irAProfesionConsultorioNav('${pr.clave.replace(/'/g, "\\'")}')">
                    <span>${pr.icono || "🩺"}</span><span>${pr.clave}</span>
                </button>
            `).join("");
        }

        sheet.dataset.tipo = tipo;
        sheet.innerHTML = `
            <div class="bsheet38-head">
                <strong>${titulo}</strong>
                <button type="button" class="menu38-close-btn" style="display:inline-flex; width:28px; height:28px; font-size:0.85rem;" onclick="cerrarBottomSheetNav()">✕</button>
            </div>
            <div class="bsheet38-grid">${contenido}</div>
        `;
        sheet.classList.add("open");
        bg.classList.add("open");
        if (btnEl) btnEl.classList.add("sheet-open");
    };

    // =====================================================================
    // 3. CONSTRUCCIÓN DE SIDEBAR PC + HAMBURGUESA MÓVIL + BARRA INFERIOR FIJA
    // =====================================================================
    window.construirNavegacionCompleta = function () {
        if (document.body?.classList.contains("login-page") || document.body?.getAttribute("data-rol") === "usuario") return;
        inyectarCSSNavUI();

        const sidebar = document.querySelector(".app-sidebar");
        const nav = sidebar?.querySelector(".sidebar-nav");
        const topLeft = document.querySelector(".app-topbar .topbar-left");
        if (!sidebar || !nav) return;

        // Backdrop y botón hamburguesa en Topbar
        if (!document.getElementById("cdmSidebarBackdrop33")) {
            const bd = document.createElement("div");
            bd.id = "cdmSidebarBackdrop33";
            bd.onclick = () => alternarSidebarMovil(true);
            document.body.appendChild(bd);
        }
        if (topLeft && !document.getElementById("btnMobileSidebar33")) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.id = "btnMobileSidebar33";
            btn.className = "btn btn-ghost btn-sm";
            btn.title = "Accesos rápidos y sistema";
            btn.innerHTML = `<i class="ri-menu-2-line"></i>`;
            btn.onclick = () => alternarSidebarMovil(false);
            topLeft.prepend(btn);
        }

        // Botón cerrar ✕ en cabecera del sidebar
        const brand = sidebar.querySelector(".sidebar-brand");
        if (brand && !brand.querySelector(".menu38-close-btn")) {
            const bClose = document.createElement("button");
            bClose.type = "button";
            bClose.className = "menu38-close-btn";
            bClose.innerHTML = "✕";
            bClose.onclick = (e) => { e.preventDefault(); e.stopPropagation(); alternarSidebarMovil(true); };
            brand.appendChild(bClose);
        }

        // Único botón de búsqueda Ctrl+K arriba de la navegación
        if (!document.getElementById("navSearchTriggerBtn")) {
            const bSearch = document.createElement("button");
            bSearch.type = "button";
            bSearch.id = "navSearchTriggerBtn";
            bSearch.className = "nav-search-trigger";
            bSearch.onclick = () => ejecutarAccesoRapidoNav("buscar");
            bSearch.innerHTML = `<span><i class="ri-search-line"></i> Buscar...</span><span class="nav-search-kbd">Ctrl+K</span>`;
            const grpLbl = sidebar.querySelector(".sidebar-group-label");
            if (grpLbl) grpLbl.insertAdjacentElement("afterend", bSearch);
            else sidebar.insertBefore(bSearch, nav);
        }

        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        const mod = lic?.modulos || { futbol: true, hockey: true, gym: true, consultorio: false };
        const cobranzaBloq = Boolean(lic?.bloquearCobranza || lic?.funciones?.deporte?.cobranza === false);

        // Lista de Deportes activos
        const deportesLista = [];
        if (mod.futbol !== false) deportesLista.push({ icono: "⚽", nombre: "Fútbol Oficial", href: "futbol.html", key: "Futbol" });
        if (mod.hockey !== false) deportesLista.push({ icono: "🏑", nombre: "Hockey", href: "hockey.html", key: "Hockey" });
        (lic?.deportesExtra || []).forEach(raw => {
            const nom = String(raw || "").replace(/^[^\wÁÉÍÓÚáéíóúÑñ]+/, "").trim();
            if (nom && !deportesLista.some(d => d.key.toLowerCase() === nom.toLowerCase())) {
                deportesLista.push({ icono: "🏆", nombre: nom, href: `futbol.html?deporte=${encodeURIComponent(nom)}`, key: nom });
            }
        });
        window.__listaDeportesNav = deportesLista;

        // Lista de Profesiones de Consultorio (disciplinas independientes)
        const ICONOS_PROF = { "Quiropraxia": "🦴", "Kinesiología": "🦿", "Psicología": "🧠", "Nutrición": "🥗", "Traumatología": "🩺" };
        let profesiones = [];
        if (typeof obtenerEspecialidadesHabilitadasConsultorioCDM === "function") {
            profesiones = obtenerEspecialidadesHabilitadasConsultorioCDM();
        } else if (Array.isArray(lic?.profesionesHabilitadas)) {
            profesiones = lic.profesionesHabilitadas.map(clave => ({ clave, icono: ICONOS_PROF[clave] || "🩺" }));
        }
        const tieneConsultorio = (mod.consultorio !== false) && profesiones.length > 0;
        const soloCons = esModoSoloConsultorioNav();
        const mostrarBaseDeportiva = !soloCons;
        window.__listaProfesionesNav = profesiones;

        const path = (window.location.pathname || "").toLowerCase();
        const depAct = typeof deportePagina !== "undefined" ? String(deportePagina || "") : "";
        const esIndex = path.endsWith("index.html") || path.endsWith("/") || (!depAct && document.body?.dataset.page !== "perfil-individual");
        const esEnDeporte = Boolean(depAct && depAct !== "Gimnasio");
        const esEnGym = depAct === "Gimnasio" || path.includes("gym.html");

        // 1. Menú lateral PC con desplegables
        nav.innerHTML = `
            <a href="index.html" class="side-link ${esIndex ? "active" : ""}" data-nav="index" onclick="irAInicioUnificadoNav(event)">
                <i class="ri-home-5-line"></i><span>Inicio</span>
            </a>

            ${deportesLista.length > 0 ? `
                <div id="accDeportesNav" class="menu38-acc ${esEnDeporte ? "open" : ""}">
                    <button type="button" class="menu38-acc-btn" onclick="alternarAcordeonMenu('accDeportesNav')">
                        <span class="menu38-acc-left"><i class="ri-trophy-line"></i><span>Deportes (${deportesLista.length})</span></span>
                        <i class="ri-arrow-down-s-line menu38-acc-arrow"></i>
                    </button>
                    <div class="menu38-acc-list">
                        ${deportesLista.map(d => `
                            <a href="${d.href}" class="menu38-sublink ${depAct.toLowerCase() === d.key.toLowerCase() ? "active" : ""}">
                                <span>${d.icono}</span><span>${d.nombre}</span>
                            </a>
                        `).join("")}
                    </div>
                </div>
            ` : ""}

            ${mod.gym !== false ? `
                <a href="gym.html" class="side-link ${esEnGym ? "active" : ""}" data-nav="gym">
                    <i class="ri-heart-pulse-line"></i><span>Gimnasio</span>
                </a>
            ` : ""}

            ${tieneConsultorio ? `
                <div id="accConsultorioNav" class="menu38-acc ${soloCons ? "open" : ""}">
                    <button type="button" class="menu38-acc-btn" onclick="alternarAcordeonMenu('accConsultorioNav')">
                        <span class="menu38-acc-left"><i class="ri-stethoscope-line"></i><span>Consultorio (${profesiones.length})</span></span>
                        <i class="ri-arrow-down-s-line menu38-acc-arrow"></i>
                    </button>
                    <div class="menu38-acc-list">
                        ${profesiones.map(pr => `
                            <button type="button" class="menu38-sublink" onclick="irAProfesionConsultorioNav('${pr.clave.replace(/'/g, "\\'")}')">
                                <span>${pr.icono || "🩺"}</span><span>${pr.clave}</span>
                            </button>
                        `).join("")}
                    </div>
                </div>
            ` : ""}

            ${mostrarBaseDeportiva ? `
                <a href="#base-general" class="side-link" data-nav="base_general" onclick="event.preventDefault(); if(typeof abrirModuloBaseGeneral==='function') abrirModuloBaseGeneral('jugadores');">
                    <i class="ri-database-2-line"></i><span>Base General</span>
                </a>
            ` : ""}

            ${!cobranzaBloq ? `
                <a href="#contabilidad" class="side-link" data-nav="contabilidad" onclick="event.preventDefault(); document.getElementById('cdmSeccionBaseGeneral37')?.classList.add('hidden'); document.getElementById('cdmSeccionConsultorioGlobal')?.classList.add('hidden'); if(typeof abrirModuloContabilidadIndependienteCDM==='function') abrirModuloContabilidadIndependienteCDM();">
                    <i class="ri-wallet-3-line"></i><span>Contabilidad y Caja</span>
                </a>
            ` : ""}
        `;

        // 2. Accesos Rápidos dentro del menú hamburguesa (móvil/tablet)
        let quick = document.getElementById("menu38QuickBox");
        if (!quick) {
            quick = document.createElement("div");
            quick.id = "menu38QuickBox";
            quick.className = "menu38-quick-box";
            const demoBox = sidebar.querySelector(".sidebar-demo-box");
            if (demoBox) sidebar.insertBefore(quick, demoBox);
            else sidebar.appendChild(quick);
        }
        quick.innerHTML = `
            <span class="menu38-quick-title">⚡ Accesos Rápidos</span>
            <div class="menu38-quick-grid">
                <button type="button" class="menu38-quick-btn" onclick="ejecutarAccesoRapidoNav('tema')"><i class="ri-moon-clear-line"></i><span>Modo Día/Noche</span></button>
                <button type="button" class="menu38-quick-btn btn-notas-quick-nav" onclick="ejecutarAccesoRapidoNav('notas')"><i class="ri-sticky-note-line"></i><span>Notas</span></button>
                ${!cobranzaBloq ? `<button type="button" class="menu38-quick-btn" onclick="ejecutarAccesoRapidoNav('caja')"><i class="ri-safe-2-line"></i><span>Caja Rápida</span></button>` : ""}
                <button type="button" class="menu38-quick-btn" onclick="ejecutarAccesoRapidoNav('modulos')"><i class="ri-settings-3-line"></i><span>Módulos</span></button>
                <button type="button" class="menu38-quick-btn" onclick="ejecutarAccesoRapidoNav('comercio')"><i class="ri-store-2-line"></i><span>Comercios</span></button>
                <button type="button" class="menu38-quick-btn danger" onclick="ejecutarAccesoRapidoNav('salir')"><i class="ri-logout-box-r-line"></i><span>Salir</span></button>
            </div>
        `;

        // 3. Barra inferior fija (móvil/tablet)
        let bnav = document.getElementById("cdmBottomNav38");
        if (!bnav) {
            bnav = document.createElement("nav");
            bnav.id = "cdmBottomNav38";
            document.body.appendChild(bnav);
        }
        if (!document.getElementById("cdmBottomSheetBg38")) {
            const bg = document.createElement("div");
            bg.id = "cdmBottomSheetBg38";
            bg.onclick = cerrarBottomSheetNav;
            document.body.appendChild(bg);
        }
        if (!document.getElementById("cdmBottomSheet38")) {
            const sh = document.createElement("div");
            sh.id = "cdmBottomSheet38";
            document.body.appendChild(sh);
        }

        bnav.innerHTML = `
            <a href="index.html" class="bnav38-item ${esIndex ? "active" : ""}" onclick="irAInicioUnificadoNav(event)">
                <i class="ri-home-5-line"></i><span>Inicio</span>
            </a>
            ${deportesLista.length > 0 ? `
                <button type="button" class="bnav38-item ${esEnDeporte ? "active" : ""}" onclick="abrirBottomSheetNav('deportes', this)">
                    <i class="ri-trophy-line"></i><span>Deportes ▴</span>
                </button>
            ` : ""}
            ${mod.gym !== false ? `
                <a href="gym.html" class="bnav38-item ${esEnGym ? "active" : ""}">
                    <i class="ri-heart-pulse-line"></i><span>Gym</span>
                </a>
            ` : ""}
            ${tieneConsultorio ? `
                <button type="button" class="bnav38-item" onclick="abrirBottomSheetNav('consultorio', this)">
                    <i class="ri-stethoscope-line"></i><span>Salud ▴</span>
                </button>
            ` : ""}
            ${mostrarBaseDeportiva ? `
                <button type="button" class="bnav38-item" onclick="cerrarBottomSheetNav(); if(typeof abrirModuloBaseGeneral==='function') abrirModuloBaseGeneral('jugadores');">
                    <i class="ri-database-2-line"></i><span>Base</span>
                </button>
            ` : ""}
            ${!cobranzaBloq ? `
                <button type="button" class="bnav38-item" onclick="cerrarBottomSheetNav(); document.getElementById('cdmSeccionBaseGeneral37')?.classList.add('hidden'); document.getElementById('cdmSeccionConsultorioGlobal')?.classList.add('hidden'); if(typeof abrirModuloContabilidadIndependienteCDM==='function') abrirModuloContabilidadIndependienteCDM();">
                    <i class="ri-wallet-3-line"></i><span>Caja</span>
                </button>
            ` : ""}
        `;

        // 4. Notas Rápidas en la Topbar (PC) + Compactación de botones secundarios
        asegurarBotonNotasTopbar();
        compactarTopbarPC();
    };

    // Alias de compatibilidad con login.js
    window.sincronizarSidebarActivoCDM = window.construirNavegacionCompleta;

    function esBotonVisibleAfueraTopbar(btn) {
        const id = (btn.id || "").toLowerCase();
        const onclk = (btn.getAttribute("onclick") || "").toLowerCase();
        const txt = (btn.innerText || "").toLowerCase();
        return (
            id === "btnaltatopbarcdm" ||
            onclk.includes("abrirmodalpersona") ||
            onclk.includes("abrirmodalpacienteconsultorio") ||
            id === "btntoggletemacdm" || btn.classList.contains("btn-theme-toggle") ||
            id === "btnnotasrapidastopbar" ||
            onclk.includes("login.html?hub=1") ||
            onclk.includes("abrirmodalsuperadmincdm") ||
            onclk.includes("cerrarsesioncdm") ||
            txt.includes("cambiar comercio") || txt.includes("módulos") || txt.includes("modulos")
        );
    }

    function compactarTopbarPC() {
        const topRight = document.querySelector(".app-topbar .topbar-right");
        if (!topRight) return;

        let wrap = document.getElementById("topbarMenuWrap33");
        if (!wrap) {
            wrap = document.createElement("div");
            wrap.id = "topbarMenuWrap33";
            wrap.className = "menu33-wrap";
            wrap.innerHTML = `<button type="button" id="btnTopbarHamburguesa33" class="btn btn-secondary btn-sm" onclick="alternarMenu33('topbarMenuDrop33', event)"><i class="ri-menu-line"></i><span>Más</span></button>`;
            topRight.appendChild(wrap);
        }

        let drop = document.getElementById("topbarMenuDrop33");
        if (!drop) {
            drop = document.createElement("div");
            drop.id = "topbarMenuDrop33";
            drop.className = "menu33-dropdown topbar-drop33";
            drop.innerHTML = `<div class="menu33-section-lbl">Herramientas Técnicas</div><div id="topbarDropItems33" style="display:flex; flex-direction:column; gap:0.32rem;"></div>`;
            drop.addEventListener("click", (e) => { if (e.target.closest("button")) setTimeout(() => drop.classList.remove("open"), 40); });
            document.body.appendChild(drop);
        }

        const bucket = document.getElementById("topbarDropItems33");
        if (!bucket) return;

        Array.from(topRight.querySelectorAll("button")).forEach(btn => {
            if (btn.closest("#topbarMenuWrap33") || esBotonVisibleAfueraTopbar(btn)) return;
            if (btn.parentElement !== bucket) bucket.appendChild(btn);
        });

        const barraSes = document.getElementById("cdmBarraSesionActiva");
        if (barraSes) {
            const btnSalir = barraSes.querySelector('button[onclick*="cerrarSesionCDM"]');
            if (btnSalir && wrap.nextElementSibling !== btnSalir) barraSes.insertBefore(wrap, btnSalir);
        }
    }

    // =====================================================================
    // 4. BUSCADOR UNIVERSAL RÁPIDO (CTRL + K) — CLUBES Y CONSULTORIO
    // =====================================================================
    window.abrirBuscadorUniversal = function () {
        let modal = document.getElementById("modalBuscadorUniversalCDM");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "modalBuscadorUniversalCDM";
            modal.className = "modal-backdrop";
            modal.onclick = (e) => { if (e.target === modal) modal.classList.add("hidden"); };
            document.body.appendChild(modal);
        }

        const soloCons = esModoSoloConsultorioNav();
        const placeholder = soloCons
            ? "Buscar paciente, DNI, afiliado, código PAC-XXXX o especialidad..."
            : "Buscar jugador, socio, paciente, DNI, deporte o acción...";

        modal.innerHTML = `
            <div class="modal-window" style="max-width:600px; padding:1rem;">
                <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.75rem;">
                    <div class="search-box" style="flex:1;">
                        <i class="ri-search-2-line"></i>
                        <input type="text" id="inpBuscadorUniversalCDM" placeholder="${placeholder}" oninput="renderizarResultadosBuscadorUniversal(this.value)">
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('modalBuscadorUniversalCDM').classList.add('hidden')">ESC</button>
                </div>
                <div id="resBuscadorUniversalCDM" style="max-height:360px; overflow-y:auto; display:flex; flex-direction:column; gap:0.4rem;"></div>
            </div>
        `;
        modal.classList.remove("hidden");
        renderizarResultadosBuscadorUniversal("");
        setTimeout(() => document.getElementById("inpBuscadorUniversalCDM")?.focus(), 40);
    };
    window.abrirBuscadorUniversal27 = window.abrirBuscadorUniversal;

    window.renderizarResultadosBuscadorUniversal = function (qRaw = "") {
        const cont = document.getElementById("resBuscadorUniversalCDM");
        if (!cont) return;
        const q = String(qRaw || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const soloCons = esModoSoloConsultorioNav();
        const items = [];

        // 1. Pacientes de Consultorio (si el módulo está cargado)
        if (typeof obtenerDatosConsultorioCDM === "function") {
            const dbCons = obtenerDatosConsultorioCDM();
            (dbCons.pacientes || []).forEach(p => {
                const txt = `${p.nombre || ""} ${p.apellido || ""} ${p.dni || ""} ${p.especialidad || ""} ${p.nroAfiliado || ""} ${p.codigoAcceso || ""}`
                    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (!q || txt.includes(q)) {
                    const ic = typeof iconoEspecialidadConsultorio === "function" ? iconoEspecialidadConsultorio(p.especialidad) : "🩺";
                    items.push({
                        icono: ic,
                        titulo: `${p.apellido}, ${p.nombre}`,
                        sub: `${p.especialidad || "Consultorio"} • DNI ${p.dni || "-"} • ${p.codigoAcceso || ""}`,
                        onclick: `document.getElementById('modalBuscadorUniversalCDM').classList.add('hidden'); if(typeof abrirHistoriaClinicaPacienteCDM==='function') abrirHistoriaClinicaPacienteCDM(${p.id});`
                    });
                }
            });
        }

        // 2. Deportistas y Socios (solo si el comercio no es Solo Consultorio)
        if (!soloCons) {
            (typeof basePersonas !== "undefined" ? basePersonas : []).filter(p => p && p.activo).forEach(p => {
                const txt = `${p.nombre || ""} ${p.apellido || ""} ${p.dni || ""} ${p.deporte || ""} ${p.categoria || ""} ${p.codigoAcceso || ""}`
                    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (!q || txt.includes(q)) {
                    items.push({
                        icono: p.deporte === "Gimnasio" ? "🏋️" : (p.deporte === "Hockey" ? "🏑" : "⚽"),
                        titulo: `${p.apellido}, ${p.nombre}`,
                        sub: `${p.deporte} (${p.deporte === "Gimnasio" ? "Gym" : p.categoria}) • DNI ${p.dni || "-"}`,
                        onclick: `window.location.href='jugador.html?id=${p.id}'`
                    });
                }
            });
        }

        // 3. Acciones rápidas adaptadas al tipo de comercio
        const acciones = soloCons ? [
            { icono: "➕", titulo: "Registrar Nuevo Paciente", sub: "Abrir ficha de alta de paciente", onclick: "document.getElementById('modalBuscadorUniversalCDM').classList.add('hidden'); if(typeof abrirModalPacienteConsultorio==='function') abrirModalPacienteConsultorio();" },
            { icono: "📅", titulo: "Sacar Nuevo Turno", sub: "Agendar turno en consultorio", onclick: "document.getElementById('modalBuscadorUniversalCDM').classList.add('hidden'); if(typeof abrirModalTurnoConsultorio==='function') abrirModalTurnoConsultorio();" },
            { icono: "💰", titulo: "Contabilidad y Caja Unificada", sub: "Ingresos, egresos y cierre de caja", onclick: "document.getElementById('modalBuscadorUniversalCDM').classList.add('hidden'); if(typeof abrirModuloContabilidadIndependienteCDM==='function') abrirModuloContabilidadIndependienteCDM();" },
            { icono: "📝", titulo: "Abrir Bloc de Notas Rápidas", sub: "Pendientes y recordatorios del día", onclick: "document.getElementById('modalBuscadorUniversalCDM').classList.add('hidden'); abrirNotasRapidasCDM();" }
        ] : [
            { icono: "🗄️", titulo: "Abrir Base General (Edades y Ejercicios)", sub: "Padrón maestro y migraciones", onclick: "document.getElementById('modalBuscadorUniversalCDM').classList.add('hidden'); if(typeof abrirModuloBaseGeneral==='function') abrirModuloBaseGeneral('jugadores');" },
            { icono: "➕", titulo: "Nueva Persona / Jugador / Socio", sub: "Abrir formulario de alta", onclick: "document.getElementById('modalBuscadorUniversalCDM').classList.add('hidden'); if(typeof abrirModalPersona==='function') abrirModalPersona();" },
            { icono: "💰", titulo: "Contabilidad y Caja Unificada", sub: "Ingresos, egresos y cuentas corrientes", onclick: "document.getElementById('modalBuscadorUniversalCDM').classList.add('hidden'); if(typeof abrirModuloContabilidadIndependienteCDM==='function') abrirModuloContabilidadIndependienteCDM();" },
            { icono: "📝", titulo: "Abrir Bloc de Notas Rápidas", sub: "Pendientes y recordatorios del día", onclick: "document.getElementById('modalBuscadorUniversalCDM').classList.add('hidden'); abrirNotasRapidasCDM();" }
        ];

        acciones.forEach(a => {
            const t = `${a.titulo} ${a.sub}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (!q || t.includes(q)) items.push(a);
        });

        cont.innerHTML = items.length === 0
            ? `<div class="empty-box" style="padding:1rem;">Sin resultados para "${qRaw}".</div>`
            : items.slice(0, 14).map(it => `
                <button type="button" class="menu33-item" style="border:1px solid var(--line); background:var(--surface-subtle);" onclick="${it.onclick}">
                    <div style="display:flex; align-items:center; gap:0.65rem;">
                        <span style="font-size:1.15rem;">${it.icono}</span>
                        <div>
                            <strong style="display:block; font-size:0.84rem;">${it.titulo}</strong>
                            <small style="color:var(--ink-500); font-size:0.72rem;">${it.sub}</small>
                        </div>
                    </div>
                    <i class="ri-arrow-right-s-line"></i>
                </button>
            `).join("");
    };

    document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
            if (document.body?.getAttribute("data-rol") === "usuario") return;
            e.preventDefault();
            abrirBuscadorUniversal();
        } else if (e.key === "Escape") {
            document.getElementById("modalBuscadorUniversalCDM")?.classList.add("hidden");
            cerrarNotasRapidasCDM();
            cerrarBottomSheetNav();
        }
    });

    // =====================================================================
    // 5. BLOC DE NOTAS RÁPIDAS (SLIDE-OVER AISLADO POR COMERCIO)
    // =====================================================================
    function obtenerNotasClub() {
        const club = typeof obtenerClaveClubActivoCDM === "function" ? obtenerClaveClubActivoCDM() : "cdm_adelia_maria_principal";
        try {
            const mapa = JSON.parse(localStorage.getItem("cdm_notas_rapidas_pro_v23") || "{}");
            return Array.isArray(mapa[club]) ? mapa[club] : [];
        } catch { return []; }
    }

    function guardarNotasClub(lista) {
        const club = typeof obtenerClaveClubActivoCDM === "function" ? obtenerClaveClubActivoCDM() : "cdm_adelia_maria_principal";
        try {
            const mapa = JSON.parse(localStorage.getItem("cdm_notas_rapidas_pro_v23") || "{}");
            mapa[club] = lista;
            localStorage.setItem("cdm_notas_rapidas_pro_v23", JSON.stringify(mapa));
        } catch {}
        actualizarBadgeNotas();
        if (typeof renderizarWidgetsLimpiosIndex === "function" && typeof basePersonas !== "undefined") {
            renderizarWidgetsLimpiosIndex(basePersonas.filter(p => p && p.activo));
        }
    }

    function actualizarBadgeNotas() {
        const pend = obtenerNotasClub().filter(n => !n.hecha).length;
        const b = document.getElementById("badgeCantNotasTopbar");
        if (b) b.innerText = pend;
    }

    function asegurarBotonNotasTopbar() {
        const topRight = document.querySelector(".app-topbar .topbar-right");
        if (!topRight || document.getElementById("btnNotasRapidasTopbar")) return;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.id = "btnNotasRapidasTopbar";
        btn.className = "btn btn-warn btn-sm";
        btn.onclick = abrirNotasRapidasCDM;
        btn.innerHTML = `<i class="ri-sticky-note-line"></i> Notas <span id="badgeCantNotasTopbar" class="badge badge-danger" style="padding:1px 6px; font-size:0.68rem;">0</span>`;
        topRight.appendChild(btn);
        actualizarBadgeNotas();
    }

    window.abrirNotasRapidasCDM = function () {
        let bd = document.getElementById("cdmNotasBackdrop");
        let dr = document.getElementById("cdmNotasDrawer");
        if (!bd) {
            bd = document.createElement("div");
            bd.id = "cdmNotasBackdrop";
            bd.onclick = cerrarNotasRapidasCDM;
            document.body.appendChild(bd);
        }
        if (!dr) {
            dr = document.createElement("aside");
            dr.id = "cdmNotasDrawer";
            document.body.appendChild(dr);
        }
        renderizarNotasDrawer();
        bd.classList.add("open");
        dr.classList.add("open");
    };

    window.cerrarNotasRapidasCDM = function () {
        document.getElementById("cdmNotasBackdrop")?.classList.remove("open");
        document.getElementById("cdmNotasDrawer")?.classList.remove("open");
    };

    window.agregarNotaRapidaCDM = function (e) {
        e.preventDefault();
        const inp = document.getElementById("inpNuevaNotaCDM");
        const txt = (inp?.value || "").trim();
        if (!txt) return;
        const lista = obtenerNotasClub();
        lista.unshift({ id: Date.now(), texto: txt, hecha: false, fecha: typeof obtenerHoyISO === "function" ? obtenerHoyISO() : "" });
        guardarNotasClub(lista);
        renderizarNotasDrawer();
    };

    window.toggleNotaRapidaCDM = function (id) {
        const lista = obtenerNotasClub().map(n => Number(n.id) === Number(id) ? { ...n, hecha: !n.hecha } : n);
        guardarNotasClub(lista);
        renderizarNotasDrawer();
    };

    window.eliminarNotaRapidaCDM = function (id) {
        guardarNotasClub(obtenerNotasClub().filter(n => Number(n.id) !== Number(id)));
        renderizarNotasDrawer();
    };

    function renderizarNotasDrawer() {
        const dr = document.getElementById("cdmNotasDrawer");
        if (!dr) return;
        const lista = obtenerNotasClub();
        dr.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:0.75rem; border-bottom:1px solid var(--line); margin-bottom:0.85rem;">
                <div>
                    <strong style="font-size:1rem;">📝 Notas y Pendientes</strong>
                    <small style="display:block; color:var(--ink-500); font-size:0.72rem;">Autoguardado privado de este comercio</small>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarNotasRapidasCDM()">✕</button>
            </div>
            <form onsubmit="agregarNotaRapidaCDM(event)" style="display:flex; gap:0.4rem; margin-bottom:0.85rem;">
                <input type="text" id="inpNuevaNotaCDM" required placeholder="Anotar recordatorio rápido..." style="flex:1;">
                <button type="submit" class="btn btn-primary btn-sm">+</button>
            </form>
            <div style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:0.45rem;">
                ${lista.length === 0 ? `<div class="empty-box" style="padding:1rem;">Sin notas pendientes.</div>` :
                lista.map(n => `
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; padding:0.55rem 0.7rem; background:var(--surface-subtle); border:1px solid var(--line); border-radius:11px;">
                        <label style="display:flex; align-items:center; gap:0.5rem; flex:1; cursor:pointer; font-size:0.82rem; ${n.hecha ? "text-decoration:line-through; opacity:0.55;" : ""}">
                            <input type="checkbox" ${n.hecha ? "checked" : ""} onchange="toggleNotaRapidaCDM(${n.id})" style="width:16px; height:16px; min-height:auto;">
                            <span>${n.texto}</span>
                        </label>
                        <button type="button" class="btn btn-danger btn-sm" style="min-height:24px; padding:0 6px;" onclick="eliminarNotaRapidaCDM(${n.id})">✕</button>
                    </div>
                `).join("")}
            </div>
        `;
    }

    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(construirNavegacionCompleta, 120);
        setTimeout(compactarTopbarPC, 450);
    });
})();