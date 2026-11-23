/**
 * js/consultorio.js — Suite Clínica Completa con Disciplinas 100% Independientes
 * - Modal Flotante al tocar fecha (con horarios ocupados y resumen de última consulta)
 * - Alarmas WhatsApp 24hs + Próximos Pacientes con Resumen Clínico y Nota Rápida
 * - Pestañas fijas y Listas Compactas Responsive (PC / Celular)
 * - Sincronización automática con server.js (MongoDB + disco)
 * CDM Pro Suite — Desarrollado por Gonzalo Adanchú
 */

window.especialidadFiltroConsultorioCDM = "TODAS";

(function () {
    // =====================================================================
    // 1. ESTILOS MODERNOS, RESPONSIVE (PC + MÓVIL COMPACTO) Y MOTOR A4
    // =====================================================================
    function inyectarCSSConsultorioPro() {
        document.getElementById("cdmCssConsultorioPro")?.remove();
        const st = document.createElement("style");
        st.id = "cdmCssConsultorioPro";
        st.textContent = `
            #cdmSeccionConsultorioGlobal { display: flex; flex-direction: column; gap: 1rem; }
            #cdmSeccionConsultorioGlobal.hidden { display: none !important; }

            .cons-header {
                color: #ffffff; border-radius: 22px; padding: 1.15rem 1.35rem;
                display: flex; justify-content: space-between; align-items: center;
                gap: 0.85rem; flex-wrap: wrap;
                box-shadow: 0 14px 32px -12px rgba(15, 23, 42, 0.32);
            }
            .cons-header h2 { margin: 0; font-size: 1.32rem; font-weight: 900; color: #ffffff; }
            .cons-header small { color: rgba(255, 255, 255, 0.85); font-size: 0.78rem; display: block; margin-top: 2px; }

            .cons-esp-bar { display: flex; gap: 0.4rem; flex-wrap: wrap; align-items: center; }
            .cons-esp-pill {
                border: 1.5px solid var(--line-strong, #cbd5e1);
                background: var(--surface-solid, #ffffff);
                color: var(--ink-700, #334155);
                padding: 0.38rem 0.78rem; border-radius: 999px;
                font-size: 0.76rem; font-weight: 800; cursor: pointer;
                display: inline-flex; align-items: center; gap: 0.35rem;
                transition: all 0.15s ease;
            }
            .cons-esp-pill.active { background: #0284c7; border-color: #0284c7; color: #ffffff; }
            .cons-esp-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }

            /* Pestañas principales (PC fila horizontal / Móvil grilla fija sin scroll) */
            .cons-tabs {
                display: flex; gap: 0.4rem; padding: 0.38rem;
                background: var(--surface-solid, #ffffff);
                border: 1.5px solid var(--line-strong, #cbd5e1);
                border-radius: 16px;
            }
            .cons-tab {
                flex: 1 0 auto; border: none; background: transparent;
                color: var(--ink-600, #475569); font-size: 0.81rem; font-weight: 800;
                padding: 0.58rem 0.85rem; border-radius: 12px; cursor: pointer;
                white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
                transition: all 0.15s ease;
            }
            .cons-tab.active { background: #0284c7; color: #ffffff; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3); }
            .cons-tab-short { display: none; }

            /* Banner de Cumpleaños */
            .cons-bday-strip {
                background: linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(245, 158, 11, 0.12) 100%);
                border: 1.5px solid rgba(236, 72, 153, 0.35);
                border-radius: 16px; padding: 0.75rem 1rem;
                display: flex; justify-content: space-between; align-items: center;
                gap: 0.75rem; flex-wrap: wrap;
            }
            .cons-bday-chips { display: flex; gap: 0.45rem; flex-wrap: wrap; align-items: center; }
            .cons-bday-chip {
                background: var(--surface-solid, #ffffff); border: 1px solid rgba(236, 72, 153, 0.4);
                border-radius: 999px; padding: 0.28rem 0.65rem;
                font-size: 0.76rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.45rem;
            }

            /* LAYOUT LIMPIO: ALMANAQUE IZQ + SOLO NOTIFICACIONES Y PRÓXIMOS DER */
            .cons-agenda-layout { display: grid; grid-template-columns: minmax(0, 1.38fr) minmax(320px, 1fr); gap: 1rem; align-items: start; }
            .cons-side-col { display: flex; flex-direction: column; gap: 0.9rem; }
            .cons-card {
                background: var(--surface-solid, #ffffff);
                border: 1.5px solid var(--line-strong, #cbd5e1);
                border-radius: 20px; padding: 1.05rem 1.15rem;
                box-shadow: 0 6px 20px -12px rgba(15, 23, 42, 0.1);
            }
            .cons-card-head {
                display: flex; justify-content: space-between; align-items: center;
                gap: 0.5rem; flex-wrap: wrap;
                margin-bottom: 0.8rem; padding-bottom: 0.55rem; border-bottom: 1px solid var(--line, #e2e8f0);
            }
            .cons-card-head h3 { margin: 0; font-size: 0.96rem; font-weight: 800; color: var(--ink-900, #0f172a); }

            /* Calendario mensual */
            .cons-cal-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; margin-bottom: 6px; text-align: center; }
            .cons-cal-weekdays span { font-size: 0.7rem; font-weight: 800; color: var(--ink-500, #64748b); text-transform: uppercase; }
            .cons-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; }
            .cons-cal-day {
                min-height: 82px; border-radius: 13px; padding: 0.38rem 0.42rem;
                border: 1.5px solid var(--line, #e2e8f0);
                background: var(--surface-subtle, #f8fafc);
                cursor: pointer; display: flex; flex-direction: column; gap: 3px;
                text-align: left; transition: all 0.15s ease; overflow: hidden;
            }
            .cons-cal-day:hover { border-color: #0284c7; background: var(--cdm-50, #f0f9ff); transform: translateY(-1px); }
            .cons-cal-day.is-today { border-color: #0284c7; box-shadow: inset 0 0 0 1px #0284c7; }
            .cons-cal-day.is-sel { background: rgba(2, 132, 199, 0.12); border-color: #0284c7; box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.25); }
            .cons-cal-day-num { display: flex; justify-content: space-between; align-items: center; font-size: 0.76rem; font-weight: 800; color: var(--ink-800, #1e293b); }
            .cons-cal-day.is-today .cons-cal-day-num span:first-child { background: #0284c7; color: #ffffff; padding: 0 6px; border-radius: 999px; }
            .cons-cal-chip {
                font-size: 0.64rem; font-weight: 700; color: #ffffff;
                padding: 2px 5px; border-radius: 6px;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.25;
            }
            .cons-cal-more { font-size: 0.63rem; font-weight: 800; color: var(--ink-500, #64748b); padding-left: 2px; }

            /* Alarma 24hs WhatsApp */
            @keyframes consAlarmPulse {
                0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.28); }
                50% { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
            }
            .cons-alarm24-card {
                background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%);
                border: 1.8px solid #f59e0b; border-radius: 18px; padding: 0.85rem 1rem;
                animation: consAlarmPulse 2.4s ease infinite;
            }
            .cons-alarm24-item {
                display: flex; justify-content: space-between; align-items: center; gap: 0.55rem;
                background: var(--surface-solid, #ffffff); border: 1px solid var(--line, #e2e8f0);
                border-left: 4px solid #f59e0b; border-radius: 12px; padding: 0.55rem 0.7rem; font-size: 0.79rem;
            }
            .cons-alarm24-item.sent { border-left-color: #10b981; opacity: 0.78; }

            /* Tarjetas de Próximos Pacientes con Resumen de Última Consulta y Nota */
            .cons-next-card {
                background: var(--surface-subtle, #f8fafc);
                border: 1.5px solid var(--line, #e2e8f0);
                border-left: 5px solid #0284c7;
                border-radius: 15px; padding: 0.75rem 0.85rem;
                display: flex; flex-direction: column; gap: 0.48rem;
                transition: border-color 0.15s ease;
            }
            .cons-next-card:hover { border-color: #0284c7; }
            .cons-next-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; }
            .cons-next-summary {
                background: var(--surface-solid, #ffffff);
                border: 1px solid var(--line, #e2e8f0);
                border-radius: 10px; padding: 0.48rem 0.65rem;
                font-size: 0.75rem; line-height: 1.4; color: var(--ink-700, #334155);
            }
            .cons-next-note {
                background: rgba(2, 132, 199, 0.07);
                border: 1px dashed rgba(2, 132, 199, 0.35);
                border-radius: 10px; padding: 0.45rem 0.65rem;
                font-size: 0.75rem; color: var(--ink-800, #1e293b);
                display: flex; justify-content: space-between; align-items: flex-start; gap: 0.45rem;
            }
            .cons-next-actions { display: flex; gap: 0.32rem; flex-wrap: wrap; align-items: center; }

            /* Preview de turnos ocupados dentro del modal flotante */
            .cons-day-slots-bar {
                display: flex; flex-wrap: wrap; gap: 0.35rem; align-items: center;
                background: var(--surface-subtle, #f8fafc); border: 1px solid var(--line, #e2e8f0);
                border-radius: 11px; padding: 0.48rem 0.65rem; margin-bottom: 0.7rem; font-size: 0.74rem;
            }
            .cons-slot-chip {
                display: inline-flex; align-items: center; gap: 0.3rem;
                background: var(--surface-solid, #ffffff); border: 1px solid var(--line-strong, #cbd5e1);
                border-radius: 999px; padding: 0.18rem 0.55rem; font-weight: 700; cursor: pointer;
            }
            .cons-slot-chip:hover { border-color: #0284c7; color: #0284c7; }

            /* KPIs, Mutuales y Controles de Pacientes/Lote */
            .cons-pac-tools { display: flex; gap: 0.45rem; flex-wrap: wrap; align-items: center; }
            .cons-pac-mobile-list, .cons-lote-mobile-list { display: none; }
            .cons-code-pill {
                font-size: 0.74rem; font-weight: 800; cursor: pointer;
                padding: 2px 6px; border-radius: 6px; background: var(--surface-subtle, #f1f5f9);
                border: 1px solid var(--line, #e2e8f0);
            }
            .cons-code-pill:hover { border-color: #0284c7; color: #0284c7; }

            .cons-kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.75rem; margin-bottom: 0.9rem; }
            .cons-kpi {
                background: var(--surface-subtle, #f8fafc); border: 1.5px solid var(--line, #e2e8f0);
                border-top: 4px solid #0284c7; border-radius: 14px; padding: 0.75rem 0.9rem;
            }
            .cons-kpi small { display: block; font-size: 0.67rem; font-weight: 800; text-transform: uppercase; color: var(--ink-500, #64748b); }
            .cons-kpi strong { display: block; font-size: 1.25rem; font-weight: 900; color: var(--ink-900, #0f172a); margin-top: 2px; }

            .cons-mut-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.85rem; }
            .cons-mut-card {
                background: var(--surface-subtle, #f8fafc); border: 1.5px solid var(--line-strong, #cbd5e1);
                border-radius: 16px; padding: 0.9rem 1rem; display: flex; flex-direction: column; gap: 0.5rem;
            }

            /* Impresión A4 */
            #cdmPrintZoneConsA4 { display: none; }
            .cons-pdf-sheet {
                background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1;
                border-radius: 12px; padding: 1.4rem; font-family: 'Poppins', Arial, sans-serif;
            }
            .cons-pdf-sheet table { width: 100%; border-collapse: collapse; font-size: 0.76rem; }
            .cons-pdf-sheet th, .cons-pdf-sheet td { border: 1px solid #cbd5e1; padding: 0.42rem 0.5rem; text-align: left; color: #0f172a; }
            .cons-pdf-sheet th { background: #f1f5f9; font-weight: 800; }

            @media print {
                @page { size: A4; margin: 12mm; }
                body.cdm-cons-printing > *:not(#cdmPrintZoneConsA4) { display: none !important; }
                body.cdm-cons-printing #cdmPrintZoneConsA4 { display: block !important; width: 100% !important; background: #fff !important; }
                body.cdm-cons-printing #cdmPrintZoneConsA4 .cons-pdf-sheet { border: none !important; padding: 0 !important; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }

            @media (max-width: 1040px) {
                .cons-agenda-layout { grid-template-columns: 1fr; }
                .cons-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            }

            /* === ADAPTACIÓN MÓVIL COMPACTA (SIN SCROLL LATERAL EN PESTAÑAS NI TARJETAS GIGANTES) === */
            @media (max-width: 768px) {
                .cons-tabs {
                    display: grid;
                    grid-auto-flow: column;
                    grid-auto-columns: minmax(0, 1fr);
                    overflow: visible;
                    padding: 0.28rem;
                    gap: 0.24rem;
                    border-radius: 14px;
                }
                .cons-tab {
                    flex-direction: column;
                    gap: 2px;
                    padding: 0.45rem 0.18rem;
                    font-size: 0.65rem;
                    line-height: 1.1;
                    border-radius: 10px;
                    min-width: 0;
                }
                .cons-tab-ico { font-size: 1.05rem; line-height: 1; }
                .cons-tab-full { display: none; }
                .cons-tab-short {
                    display: block;
                    max-width: 100%;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .cons-pac-tools { width: 100%; display: grid; grid-template-columns: 1fr auto auto; gap: 0.4rem; }
                .cons-pac-tools input[type="text"] { grid-column: 1 / -1; width: 100% !important; }
                .cons-pac-tools select, .cons-pac-tools input[type="month"] { width: 100% !important; min-width: 0; font-size: 0.76rem; }

                /* Lista básica compacta de Pacientes y Lote en celular */
                .cons-pac-desktop-table, .cons-lote-desktop-table { display: none !important; }
                .cons-pac-mobile-list, .cons-lote-mobile-list { display: flex; flex-direction: column; gap: 0.42rem; }

                .cons-pac-row-mob {
                    display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
                    padding: 0.52rem 0.65rem;
                    background: var(--surface-subtle, #f8fafc);
                    border: 1px solid var(--line, #e2e8f0);
                    border-left: 4px solid #0284c7;
                    border-radius: 12px;
                }
                .cons-pac-row-info { flex: 1; min-width: 0; cursor: pointer; }
                .cons-pac-row-top { display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap; }
                .cons-pac-row-top strong {
                    font-size: 0.84rem; color: var(--ink-900, #0f172a);
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
                }
                .cons-pac-row-sub {
                    display: block; font-size: 0.7rem; color: var(--ink-500, #64748b);
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;
                }
                .cons-pac-row-acts { display: flex; gap: 0.25rem; flex-shrink: 0; }
                .cons-pac-row-acts .btn {
                    width: 31px; height: 31px; min-height: 31px !important; padding: 0 !important;
                    display: inline-flex; align-items: center; justify-content: center; font-size: 0.82rem;
                }

                .cons-lote-row-mob {
                    display: flex; flex-direction: column; gap: 0.38rem;
                    padding: 0.55rem 0.68rem;
                    background: var(--surface-subtle, #f8fafc);
                    border: 1px solid var(--line, #e2e8f0);
                    border-left: 4px solid #0284c7;
                    border-radius: 12px; font-size: 0.76rem;
                }
                .cons-lote-row-top { display: flex; justify-content: space-between; align-items: center; gap: 0.4rem; }
                .cons-lote-row-bot { display: flex; justify-content: space-between; align-items: center; gap: 0.45rem; flex-wrap: wrap; }
            }

            @media (max-width: 640px) {
                .cons-cal-day { min-height: 54px; padding: 0.25rem; border-radius: 10px; }
                .cons-cal-chip { font-size: 0.58rem; padding: 1px 3px; }
                .cons-cal-weekdays span { font-size: 0.62rem; }
                .cons-header { padding: 0.92rem 1rem; }
                .cons-header h2 { font-size: 1.1rem; }
                .cons-card { padding: 0.85rem 0.9rem; border-radius: 16px; }
            }
        `;
        document.head.appendChild(st);
    }

    // =====================================================================
    // 2. CLASIFICACIÓN DE DISCIPLINAS, COLORES Y PERSISTENCIA + SYNC SERVIDOR
    // =====================================================================
    const COLORES_ESP = {
        "quiropraxia": "#0284c7",
        "kinesiologia": "#0d9488",
        "psicologia": "#7c3aed",
        "nutricion": "#16a34a",
        "traumatologia": "#dc2626",
        "fonoaudiologia": "#db2777",
        "psicopedagogia": "#d97706"
    };

    const ICONOS_ESP = {
        "quiropraxia": "🦴",
        "kinesiologia": "🦿",
        "psicologia": "🧠",
        "nutricion": "🥗",
        "traumatologia": "🩺",
        "fonoaudiologia": "🗣️",
        "psicopedagogia": "📚"
    };

    function toastCons(msg) {
        if (typeof mostrarToast === "function") mostrarToast(msg);
    }

    function normTxt(s) {
        return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    }

    function mismaEsp(a, b) {
        return normTxt(a) === normTxt(b);
    }

    function escH(s) {
        return String(s ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function truncar(txt, max = 135) {
        const s = String(txt || "").replace(/\s+/g, " ").trim();
        return s.length > max ? s.slice(0, max - 1) + "…" : s;
    }

    function hoyISO() {
        return typeof obtenerHoyISO === "function" ? obtenerHoyISO() : new Date().toISOString().split("T")[0];
    }

    window.obtenerPerfilEspecialidadCDM = function (esp) {
        const k = normTxt(esp);
        if (k.includes("psico")) return "psicologia";
        if (k.includes("nutri") || k.includes("diet")) return "nutricion";
        if (k.includes("kine") || k.includes("quiro") || k.includes("trauma") || k.includes("fisio") || k.includes("osteo")) return "fisico";
        return "general";
    };

    window.colorEspecialidadConsultorio = function (esp) {
        return COLORES_ESP[normTxt(esp)] || "#0369a1";
    };

    window.iconoEspecialidadConsultorio = function (esp) {
        return ICONOS_ESP[normTxt(esp)] || "🩺";
    };

    window.obtenerEspecialidadesHabilitadasConsultorioCDM = function () {
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        const lista = Array.isArray(lic.profesionesHabilitadas) ? lic.profesionesHabilitadas : [];
        return lista
            .map(c => String(c || "").trim())
            .filter(Boolean)
            .map(clave => ({ clave, icono: iconoEspecialidadConsultorio(clave), color: colorEspecialidadConsultorio(clave) }));
    };

    function storageKeyConsultorio() {
        const club = typeof obtenerClaveClubActivoCDM === "function" ? obtenerClaveClubActivoCDM() : "cdm_adelia_maria_principal";
        return `cdm_consultorio_suite_v2_${club}`;
    }

    const MUTUALES_PLANTILLA = [
        { slug: "part", nombre: "Particular (Sin Obra Social)", valorMutual: 0, coseguro: 0, valorParticular: 25000, requiereToken: false, notas: "Pago directo en consultorio" },
        { slug: "osde", nombre: "OSDE", valorMutual: 18000, coseguro: 0, valorParticular: 25000, requiereToken: true, notas: "Solicitar token desde App OSDE" },
        { slug: "apross", nombre: "APROSS", valorMutual: 14500, coseguro: 4000, valorParticular: 25000, requiereToken: true, notas: "Validar credencial y token" },
        { slug: "swiss", nombre: "Swiss Medical", valorMutual: 17500, coseguro: 0, valorParticular: 25000, requiereToken: true, notas: "Token digital vigente" },
        { slug: "galeno", nombre: "Galeno / Sancor Salud", valorMutual: 16000, coseguro: 2500, valorParticular: 25000, requiereToken: true, notas: "Orden autorizada o token" }
    ];

    window.obtenerDatosConsultorioCDM = function () {
        let db = null;
        try { db = JSON.parse(localStorage.getItem(storageKeyConsultorio()) || "null"); } catch {}
        if (!db || typeof db !== "object") {
            db = { pacientes: [], turnos: [], mutuales: [], profesionales: [], sesiones: [] };
        }
        if (!Array.isArray(db.pacientes)) db.pacientes = [];
        if (!Array.isArray(db.turnos)) db.turnos = [];
        if (!Array.isArray(db.mutuales)) db.mutuales = [];
        if (!Array.isArray(db.profesionales)) db.profesionales = [];
        if (!Array.isArray(db.sesiones)) db.sesiones = [];
        return db;
    };

    window.guardarDatosConsultorioCDM = function (db) {
        try { localStorage.setItem(storageKeyConsultorio(), JSON.stringify(db)); } catch {}
        if (typeof sincronizarCambiosHaciaServidorCDM === "function") {
            clearTimeout(window.__cdmConsSyncTimer);
            window.__cdmConsSyncTimer = setTimeout(() => sincronizarCambiosHaciaServidorCDM(), 350);
        }
    };

    function asegurarMutualesParaEspecialidad(db, esp) {
        const espNorm = normTxt(esp);
        if (!espNorm || esp === "TODAS") {
            const profs = obtenerEspecialidadesHabilitadasConsultorioCDM();
            if (profs.length) profs.forEach(pr => asegurarMutualesParaEspecialidad(db, pr.clave));
            return db.mutuales;
        }
        let deEsp = db.mutuales.filter(m => mismaEsp(m.especialidad, esp));
        if (deEsp.length === 0) {
            const nuevas = MUTUALES_PLANTILLA.map(pl => ({
                id: `mut_${pl.slug}_${espNorm}`,
                esParticular: pl.slug === "part",
                especialidad: esp,
                nombre: pl.nombre,
                valorMutual: pl.valorMutual,
                coseguro: pl.coseguro,
                valorParticular: pl.valorParticular,
                requiereToken: pl.requiereToken,
                notas: pl.notas
            }));
            db.mutuales.push(...nuevas);
            guardarDatosConsultorioCDM(db);
            deEsp = nuevas;
        }
        return deEsp;
    }

    function buscarMutualPorId(db, mutId, espFallback = "") {
        let m = (db.mutuales || []).find(x => x.id === mutId);
        if (m) return m;
        const espNorm = normTxt(espFallback);
        if (mutId && espNorm) {
            const slug = String(mutId).replace(/^mut_/, "").split("_")[0];
            m = (db.mutuales || []).find(x => x.id === `mut_${slug}_${espNorm}`);
            if (m) return m;
        }
        return null;
    }

    window.buscarMutualConsultorioCDM = buscarMutualPorId;

    function generarCodigoPaciente(pacientes) {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let b = "";
        for (let i = 0; i < 4; i++) b += chars[Math.floor(Math.random() * chars.length)];
        const cod = `PAC-${b}`;
        return (pacientes || []).some(p => p.codigoAcceso === cod) ? generarCodigoPaciente(pacientes) : cod;
    }

    function calcularEdadPac(fechaNac) {
        if (!fechaNac || !/^\d{4}-\d{2}-\d{2}$/.test(fechaNac)) return "-";
        const [y, m, d] = fechaNac.split("-").map(Number);
        const hoy = new Date();
        let edad = hoy.getFullYear() - y;
        if (hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)) edad--;
        return Math.max(0, edad);
    }

    function parseFechaHoraLocal(fechaISO, horaStr = "09:00") {
        if (!fechaISO || !/^\d{4}-\d{2}-\d{2}$/.test(fechaISO)) return null;
        const [y, m, d] = fechaISO.split("-").map(Number);
        const [hh, mm] = String(horaStr || "09:00").split(":").map(Number);
        return new Date(y, m - 1, d, isNaN(hh) ? 9 : hh, isNaN(mm) ? 0 : mm, 0, 0);
    }

    function formatearFechaCortaAR(fechaISO) {
        if (!fechaISO || !/^\d{4}-\d{2}-\d{2}$/.test(fechaISO)) return fechaISO || "";
        const [y, m, d] = fechaISO.split("-");
        const hoy = hoyISO();
        const manD = new Date();
        manD.setDate(manD.getDate() + 1);
        const manISO = manD.toISOString().split("T")[0];
        if (fechaISO === hoy) return `Hoy (${d}/${m})`;
        if (fechaISO === manISO) return `Mañana (${d}/${m})`;
        return `${d}/${m}/${y}`;
    }

    function obtenerResumenUltimaConsulta(db, pacienteId, espAct) {
        if (!pacienteId) return null;
        const p = (db.pacientes || []).find(x => Number(x.id) === Number(pacienteId));
        if (!p) return null;
        const perfil = obtenerPerfilEspecialidadCDM(espAct || p.especialidad);

        if (perfil === "nutricion") {
            const arr = Array.isArray(p.antropometria) ? [...p.antropometria] : [];
            arr.sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")) || (Number(b.id) - Number(a.id)));
            const ult = arr[0];
            if (ult) {
                return {
                    etiqueta: `Últ. control (${formatearFechaCortaAR(ult.fecha)})`,
                    metrica: `${ult.peso} kg • IMC ${ult.imc || "-"}${ult.grasa ? ` • ${ult.grasa}% Grasa` : ""}`,
                    detalle: ult.nota ? truncar(ult.nota, 125) : (p.planNutri?.objetivo ? `Plan: ${p.planNutri.objetivo}` : "")
                };
            }
            const base = p.alergiasAlimentarias || p.antecedentes || p.objetivoNutricion;
            return base ? { etiqueta: "Ingreso / 1ra consulta", metrica: p.pesoInicial ? `${p.pesoInicial} kg` : "", detalle: truncar(base, 125) } : null;
        }

        const sesiones = (db.sesiones || [])
            .filter(s => Number(s.pacienteId) === Number(p.id))
            .sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")) || (Number(b.id) - Number(a.id)));
        const ultSes = sesiones[0];

        if (ultSes) {
            let metrica = "";
            if (perfil === "psicologia") {
                const partes = [];
                if (ultSes.animo != null) partes.push(`Ánimo ${ultSes.animo}/10`);
                if (ultSes.ansiedad != null) partes.push(`Ans. ${ultSes.ansiedad}/10`);
                metrica = partes.join(" • ");
            } else if (perfil === "fisico" && ultSes.eva != null) {
                metrica = `Dolor EVA ${ultSes.eva}/10`;
            }
            return {
                etiqueta: `Últ. consulta (${formatearFechaCortaAR(ultSes.fecha)})`,
                metrica,
                detalle: truncar(ultSes.evolucion || ultSes.indicaciones || "", 135)
            };
        }

        const inicial = perfil === "psicologia"
            ? (p.anamnesisPsico?.motivoManifiesto || p.motivoConsulta || p.antecedentes)
            : (p.evalFisica?.diagnostico || p.diagnostico || p.antecedentes);

        return inicial ? { etiqueta: "1ra consulta / Motivo inicial", metrica: "", detalle: truncar(inicial, 130) } : null;
    }

    function obtenerTurnosAlarma24hs(turnosEsp) {
        const ahora = Date.now();
        return (turnosEsp || [])
            .filter(t => t.estado !== "cancelado" && t.estado !== "atendido")
            .map(t => {
                const dt = parseFechaHoraLocal(t.fecha, t.hora);
                if (!dt) return null;
                const diffHrs = (dt.getTime() - ahora) / 3600000;
                if (diffHrs > -0.5 && diffHrs <= 26) {
                    const faltanTxt = diffHrs <= 0.5
                        ? "¡Ahora / Inminente!"
                        : diffHrs < 1
                        ? `En ${Math.max(1, Math.round(diffHrs * 60))} min`
                        : `En ${Math.round(diffHrs)} hs`;
                    return { turno: t, diffHrs, faltanTxt };
                }
                return null;
            })
            .filter(Boolean)
            .sort((a, b) => a.diffHrs - b.diffHrs);
    }

    function obtenerTurnosProximosYRecientes(turnosEsp) {
        const hoy = hoyISO();
        const ahora = Date.now();
        const activos = (turnosEsp || []).filter(t => t.estado !== "cancelado");

        const proximos = activos
            .filter(t => t.fecha >= hoy && t.estado !== "atendido")
            .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));

        const recientes = activos
            .filter(t => {
                const ts = Number(t.creadoEn || t.id || 0);
                return ts > 1700000000000 && (ahora - ts) <= 48 * 3600000;
            })
            .sort((a, b) => Number(b.creadoEn || b.id) - Number(a.creadoEn || a.id));

        const mapa = new Map();
        proximos.slice(0, 10).forEach(t => mapa.set(t.id, { turno: t, esReciente: recientes.some(r => r.id === t.id) }));
        recientes.slice(0, 4).forEach(t => {
            if (!mapa.has(t.id)) mapa.set(t.id, { turno: t, esReciente: true });
        });
        return Array.from(mapa.values());
    }

    function obtenerCumpleanosProximos(pacientes, diasVentana = 15) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const res = [];
        (pacientes || []).forEach(p => {
            if (!p.fechaNacimiento || !/^\d{4}-\d{2}-\d{2}$/.test(p.fechaNacimiento)) return;
            const [, m, d] = p.fechaNacimiento.split("-").map(Number);
            let prox = new Date(hoy.getFullYear(), m - 1, d);
            if (prox < hoy) prox = new Date(hoy.getFullYear() + 1, m - 1, d);
            const diff = Math.round((prox - hoy) / 86400000);
            if (diff >= 0 && diff <= diasVentana) {
                res.push({ paciente: p, dias: diff, diaMes: `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}` });
            }
        });
        return res.sort((a, b) => a.dias - b.dias);
    }

    window.imprimirHojaA4Consultorio = function (htmlInterno) {
        let z = document.getElementById("cdmPrintZoneConsA4");
        if (!z) {
            z = document.createElement("div");
            z.id = "cdmPrintZoneConsA4";
            document.body.appendChild(z);
        }
        z.innerHTML = `<div class="cons-pdf-sheet">${htmlInterno}</div>`;
        document.body.classList.add("cdm-cons-printing");
        const fin = () => {
            document.body.classList.remove("cdm-cons-printing");
            z.innerHTML = "";
            window.removeEventListener("afterprint", fin);
        };
        window.addEventListener("afterprint", fin);
        setTimeout(() => window.print(), 60);
        setTimeout(fin, 2500);
    };

    function asegurarModalConsultorio() {
        let m = document.getElementById("modalConsultorioProCDM");
        if (!m) {
            m = document.createElement("div");
            m.id = "modalConsultorioProCDM";
            m.className = "modal-backdrop hidden";
            m.onclick = (e) => { if (e.target === m) cerrarModalConsultorioCDM(); };
            document.body.appendChild(m);
        }
        return m;
    }

    window.cerrarModalConsultorioCDM = function () {
        document.getElementById("modalConsultorioProCDM")?.classList.add("hidden");
    };

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") cerrarModalConsultorioCDM();
    });

    // =====================================================================
    // 3. ESTADO DE UI Y NAVEGACIÓN ESTRICTA POR DISCIPLINA
    // =====================================================================
    const estadoUI = {
        tab: "agenda",
        mesVista: new Date().toISOString().slice(0, 7),
        fechaSel: hoyISO(),
        busqPac: "",
        filtroMutPac: "TODAS",
        loteMes: new Date().toISOString().slice(0, 7),
        loteMutId: "TODAS"
    };

    function funcionSaludActiva(clave) {
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        const f = lic?.funciones?.salud;
        if (!f || f[clave] === undefined) return true;
        return f[clave] !== false;
    }

    function obtenerEspecialidadActivaResuelta() {
        const profs = obtenerEspecialidadesHabilitadasConsultorioCDM();
        const act = window.especialidadFiltroConsultorioCDM;
        if (act && act !== "TODAS" && profs.some(pr => mismaEsp(pr.clave, act))) {
            return profs.find(pr => mismaEsp(pr.clave, act)).clave;
        }
        if (profs.length > 0) {
            window.especialidadFiltroConsultorioCDM = profs[0].clave;
            return profs[0].clave;
        }
        return "Consultorio";
    }

    function obtenerNodosPortadaIndex() {
        const nodos = new Set();
        const grid = document.querySelector(".sports-showcase-grid");
        if (grid) {
            nodos.add(grid);
            if (grid.previousElementSibling && grid.previousElementSibling.id !== "indexExecutiveStrip") {
                nodos.add(grid.previousElementSibling);
            }
        }
        document.querySelectorAll(".app-content .section-head").forEach(el => nodos.add(el));
        return Array.from(nodos);
    }

    window.abrirEspecialidadDesdeInicioCDM = function (claveEsp = null) {
        const profs = obtenerEspecialidadesHabilitadasConsultorioCDM();
        if (claveEsp && claveEsp !== "TODAS") window.especialidadFiltroConsultorioCDM = claveEsp;
        else if (profs.length > 0) window.especialidadFiltroConsultorioCDM = profs[0].clave;
        estadoUI.filtroMutPac = "TODAS";
        estadoUI.loteMutId = "TODAS";
        estadoUI.busqPac = "";
        abrirModuloConsultorioIndependienteCDM("agenda", true);
    };

    window.abrirModuloConsultorioIndependienteCDM = function (tabInicial = "agenda", manual = false) {
        if (!manual) return;
        inyectarCSSConsultorioPro();
        estadoUI.tab = tabInicial || "agenda";
        const espAct = obtenerEspecialidadActivaResuelta();

        const main = document.querySelector(".app-content");
        if (!main) return;

        obtenerNodosPortadaIndex().forEach(el => el.classList.add("hidden"));
        document.getElementById("idxSectionDivider")?.classList.add("hidden");
        document.getElementById("indexExecutiveHub")?.classList.add("hidden");
        document.getElementById("cdmSeccionBaseGeneral37")?.classList.add("hidden");
        document.getElementById("cdmSeccionContabilidadGlobal")?.classList.add("hidden");

        let sec = document.getElementById("cdmSeccionConsultorioGlobal");
        if (!sec) {
            sec = document.createElement("section");
            sec.id = "cdmSeccionConsultorioGlobal";
            main.appendChild(sec);
        }
        sec.classList.remove("hidden");
        renderizarConsultorioCompleto();

        const db = obtenerDatosConsultorioCDM();
        const pend24 = obtenerTurnosAlarma24hs(db.turnos.filter(t => mismaEsp(t.especialidad, espAct)))
            .filter(a => !a.turno.aviso24hEnviado);
        if (pend24.length > 0) {
            toastCons(`🔔 Tenés ${pend24.length} turno(s) en las próximas 24hs para avisar por WhatsApp.`);
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.volverAlInicioDesdeConsultorio = function () {
        document.getElementById("cdmSeccionConsultorioGlobal")?.classList.add("hidden");
        document.getElementById("cdmSeccionBaseGeneral37")?.classList.add("hidden");
        document.getElementById("cdmSeccionContabilidadGlobal")?.classList.add("hidden");

        obtenerNodosPortadaIndex().forEach(el => el.classList.remove("hidden"));
        if (typeof inicializarIndex === "function") inicializarIndex();
        sincronizarMenuYBaseDeDatosConsultorio();
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.cambiarEspecialidadFiltroConsultorioCDM = function (claveEsp) {
        window.especialidadFiltroConsultorioCDM = claveEsp;
        estadoUI.filtroMutPac = "TODAS";
        estadoUI.loteMutId = "TODAS";
        estadoUI.busqPac = "";
        renderizarConsultorioCompleto();
    };

    window.cambiarTabConsultorioCDM = function (tab) {
        estadoUI.tab = tab;
        renderizarConsultorioCompleto();
    };

    // =====================================================================
    // 4. RENDER PRINCIPAL (100% AISLADO A LA DISCIPLINA ACTIVA)
    // =====================================================================
    window.renderizarConsultorioCompleto = function () {
        const sec = document.getElementById("cdmSeccionConsultorioGlobal");
        if (!sec || sec.classList.contains("hidden")) return;

        const db = obtenerDatosConsultorioCDM();
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : { nombreEntidad: "Consultorio" };
        const profs = obtenerEspecialidadesHabilitadasConsultorioCDM();
        const espAct = obtenerEspecialidadActivaResuelta();
        const colorEsp = colorEspecialidadConsultorio(espAct);
        const iconoEsp = iconoEspecialidadConsultorio(espAct);
        const perfilEsp = obtenerPerfilEspecialidadCDM(espAct);

        const mutualesEsp = asegurarMutualesParaEspecialidad(db, espAct);
        const pacsEsp = db.pacientes.filter(p => mismaEsp(p.especialidad, espAct));
        const turnosEsp = db.turnos.filter(t => mismaEsp(t.especialidad, espAct));
        const profsEsp = db.profesionales.filter(pr => mismaEsp(pr.especialidad, espAct));
        const cumplesEsp = obtenerCumpleanosProximos(pacsEsp, 15);
        const alarmas24 = obtenerTurnosAlarma24hs(turnosEsp);
        const pend24Cant = alarmas24.filter(a => !a.turno.aviso24hEnviado).length;
        const hoy = hoyISO();
        const cantHoy = turnosEsp.filter(t => t.fecha === hoy && t.estado !== "cancelado").length;

        const verMutuales = funcionSaludActiva("mutuales");
        const verLote = funcionSaludActiva("loteMutuales") && funcionSaludActiva("loteMutual");
        const verEquipo = funcionSaludActiva("equipo") && funcionSaludActiva("profesionales");

        const descPerfil = {
            psicologia: "Espacio Clínico de Salud Mental • Genograma, Sesiones, Objetivos e Informes",
            nutricion: "Espacio Clínico Nutricional • Antropometría, Planes Alimentarios y Laboratorios",
            fisico: "Espacio Clínico Físico • Atlas Anatómico HD, Escala EVA y Rehabilitación",
            general: "Espacio Clínico Independiente • Agenda, Pacientes e Historia Clínica"
        }[perfilEsp];

        sec.innerHTML = `
            <div class="cons-header" style="background:linear-gradient(135deg, #0c192c 0%, ${colorEsp} 100%);">
                <div>
                    <span class="badge" style="background:rgba(255,255,255,0.2); color:#fff; font-size:0.68rem;">${iconoEsp} ÁREA INDEPENDIENTE • ${escH(lic.nombreEntidad || "Consultorio")}</span>
                    <h2>${iconoEsp} ${escH(espAct)}</h2>
                    <small>${descPerfil} • <b>${pacsEsp.length} paciente(s)</b> • ${cantHoy} turno(s) hoy</small>
                </div>
                <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                    <button type="button" class="btn btn-ok btn-sm" onclick="abrirModalTurnoConsultorio(null, '${estadoUI.fechaSel}')">+ Nuevo Turno</button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="abrirModalPacienteConsultorio()">+ Nuevo Paciente</button>
                    <button type="button" class="btn btn-sm" style="background:rgba(255,255,255,0.2); color:#ffffff; border:1px solid rgba(255,255,255,0.45);" onclick="volverAlInicioDesdeConsultorio()">← Especialidades</button>
                </div>
            </div>

            ${profs.length > 1 ? `
                <div class="cons-esp-bar">
                    <small style="font-size:0.72rem; font-weight:800; color:var(--ink-500); margin-right:4px;">CAMBIAR ÁREA:</small>
                    ${profs.map(pr => {
                        const cantP = db.pacientes.filter(x => mismaEsp(x.especialidad, pr.clave)).length;
                        const activo = mismaEsp(espAct, pr.clave);
                        return `
                            <button type="button" class="cons-esp-pill ${activo ? "active" : ""}"
                                style="${activo ? `background:${pr.color}; border-color:${pr.color};` : ""}"
                                onclick="cambiarEspecialidadFiltroConsultorioCDM('${pr.clave.replace(/'/g, "\\'")}')">
                                <span class="cons-esp-dot" style="background:${activo ? "#ffffff" : pr.color};"></span>
                                ${pr.icono} ${escH(pr.clave)} (${cantP})
                            </button>
                        `;
                    }).join("")}
                </div>
            ` : ""}

            ${cumplesEsp.length > 0 ? `
                <div class="cons-bday-strip">
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                        <span style="font-size:1.35rem;">🎂</span>
                        <div>
                            <strong style="font-size:0.84rem;">Cumpleaños en ${escH(espAct)} (${cumplesEsp.length})</strong>
                            <small style="display:block; color:var(--ink-600); font-size:0.72rem;">Tocá WA para saludar al paciente</small>
                        </div>
                    </div>
                    <div class="cons-bday-chips">
                        ${cumplesEsp.slice(0, 5).map(c => `
                            <span class="cons-bday-chip">
                                <span>${c.dias === 0 ? "🎉 HOY" : `En ${c.dias}d (${c.diaMes})`} • <b>${escH(c.paciente.nombre)} ${escH(c.paciente.apellido)}</b></span>
                                <button type="button" class="btn btn-whatsapp btn-sm" style="min-height:24px; padding:0 8px; font-size:0.7rem;" onclick="saludarCumplePacienteWA(${c.paciente.id})">WA</button>
                            </span>
                        `).join("")}
                    </div>
                </div>
            ` : ""}

            <!-- PESTAÑAS ADAPTABLES (SIN SCROLL LATERAL EN CELULAR) -->
            <div class="cons-tabs">
                <button type="button" class="cons-tab ${estadoUI.tab === "agenda" ? "active" : ""}" style="${estadoUI.tab === "agenda" ? `background:${colorEsp};` : ""}" onclick="cambiarTabConsultorioCDM('agenda')">
                    <span class="cons-tab-ico">📅</span>
                    <span class="cons-tab-full">Agenda ${escH(espAct)}${pend24Cant > 0 ? ` 🔔${pend24Cant}` : ""}</span>
                    <span class="cons-tab-short">Agenda${pend24Cant > 0 ? ` (${pend24Cant})` : ""}</span>
                </button>
                <button type="button" class="cons-tab ${estadoUI.tab === "pacientes" ? "active" : ""}" style="${estadoUI.tab === "pacientes" ? `background:${colorEsp};` : ""}" onclick="cambiarTabConsultorioCDM('pacientes')">
                    <span class="cons-tab-ico">👥</span>
                    <span class="cons-tab-full">Pacientes (${pacsEsp.length})</span>
                    <span class="cons-tab-short">Pac. (${pacsEsp.length})</span>
                </button>
                ${verMutuales ? `
                    <button type="button" class="cons-tab ${estadoUI.tab === "mutuales" ? "active" : ""}" style="${estadoUI.tab === "mutuales" ? `background:${colorEsp};` : ""}" onclick="cambiarTabConsultorioCDM('mutuales')">
                        <span class="cons-tab-ico">🏥</span>
                        <span class="cons-tab-full">Obras Sociales y Precios</span>
                        <span class="cons-tab-short">Mutuales</span>
                    </button>
                ` : ""}
                ${verLote ? `
                    <button type="button" class="cons-tab ${estadoUI.tab === "lote" ? "active" : ""}" style="${estadoUI.tab === "lote" ? `background:${colorEsp};` : ""}" onclick="cambiarTabConsultorioCDM('lote')">
                        <span class="cons-tab-ico">📊</span>
                        <span class="cons-tab-full">Lote Mensual / Tokens</span>
                        <span class="cons-tab-short">Lotes</span>
                    </button>
                ` : ""}
                ${verEquipo ? `
                    <button type="button" class="cons-tab ${estadoUI.tab === "profesionales" ? "active" : ""}" style="${estadoUI.tab === "profesionales" ? `background:${colorEsp};` : ""}" onclick="cambiarTabConsultorioCDM('profesionales')">
                        <span class="cons-tab-ico">👨‍⚕️</span>
                        <span class="cons-tab-full">Profesionales (${profsEsp.length})</span>
                        <span class="cons-tab-short">Equipo</span>
                    </button>
                ` : ""}
            </div>

            <div id="consCuerpoTab"></div>
        `;

        const cuerpo = document.getElementById("consCuerpoTab");
        if (!cuerpo) return;
        const ctx = { db, espAct, colorEsp, iconoEsp, perfilEsp, pacsEsp, turnosEsp, mutualesEsp, profsEsp, alarmas24 };

        if (estadoUI.tab === "agenda") renderTabAgenda(cuerpo, ctx);
        else if (estadoUI.tab === "pacientes") renderTabPacientes(cuerpo, ctx);
        else if (estadoUI.tab === "mutuales") renderTabMutuales(cuerpo, ctx);
        else if (estadoUI.tab === "lote") renderTabLoteFacturacion(cuerpo, ctx);
        else if (estadoUI.tab === "profesionales") renderTabProfesionales(cuerpo, ctx);
    };

    // =====================================================================
    // 5. TAB 1: ALMANAQUE LIMPIO + ALARMA WA 24HS + PRÓXIMOS CON RESUMEN CLÍNICO
    //    (TOCAR CUALQUIER FECHA ABRE EL MODAL FLOTANTE)
    // =====================================================================
    window.cambiarMesCalendarioCons = function (delta) {
        const [y, m] = estadoUI.mesVista.split("-").map(Number);
        const d = new Date(y, (m - 1) + delta, 1);
        estadoUI.mesVista = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        renderizarConsultorioCompleto();
    };

    window.seleccionarDiaCalendarioCons = function (fechaISO) {
        estadoUI.fechaSel = fechaISO;
        estadoUI.mesVista = fechaISO.slice(0, 7);
        renderizarConsultorioCompleto();
        abrirModalTurnoConsultorio(null, fechaISO);
    };

    function renderTabAgenda(cont, ctx) {
        const { db, espAct, colorEsp, turnosEsp, alarmas24 } = ctx;
        const [anio, mes] = estadoUI.mesVista.split("-").map(Number);
        const primerDia = new Date(anio, mes - 1, 1);
        const diasMes = new Date(anio, mes, 0).getDate();
        const offset = (primerDia.getDay() + 6) % 7;
        const hoy = hoyISO();
        const tituloMes = primerDia.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

        const diasConAlarmaPend = new Set(alarmas24.filter(a => !a.turno.aviso24hEnviado).map(a => a.turno.fecha));

        let celdas = "";
        for (let i = 0; i < offset; i++) celdas += `<div></div>`;
        for (let d = 1; d <= diasMes; d++) {
            const iso = `${anio}-${String(mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const delDia = turnosEsp
                .filter(t => t.fecha === iso && t.estado !== "cancelado")
                .sort((a, b) => String(a.hora || "").localeCompare(String(b.hora || "")));
            const cls = ["cons-cal-day", iso === hoy ? "is-today" : "", iso === estadoUI.fechaSel ? "is-sel" : ""].filter(Boolean).join(" ");
            const bell = diasConAlarmaPend.has(iso) ? `<span title="Aviso WA 24hs pendiente">🔔</span>` : "";
            celdas += `
                <button type="button" class="${cls}" onclick="seleccionarDiaCalendarioCons('${iso}')" title="Tocá para agendar turno el ${iso}">
                    <div class="cons-cal-day-num">
                        <span>${d}</span>
                        <span style="display:inline-flex; align-items:center; gap:2px; font-size:0.65rem; color:${colorEsp};">${bell}${delDia.length || ""}</span>
                    </div>
                    ${delDia.slice(0, 2).map(t => `<div class="cons-cal-chip" style="background:${colorEsp};">${t.hora || ""} ${escH(String(t.pacienteNombre || "Turno").split(" ")[0])}</div>`).join("")}
                    ${delDia.length > 2 ? `<div class="cons-cal-more">+${delDia.length - 2} más</div>` : ""}
                </button>
            `;
        }

        const proximos = obtenerTurnosProximosYRecientes(turnosEsp);
        const pend24 = alarmas24.filter(a => !a.turno.aviso24hEnviado);

        cont.innerHTML = `
            <div class="cons-agenda-layout">
                <!-- IZQUIERDA: ALMANAQUE MENSUAL -->
                <div class="cons-card">
                    <div class="cons-card-head">
                        <div style="display:flex; align-items:center; gap:0.5rem;">
                            <button type="button" class="btn btn-ghost btn-sm" onclick="cambiarMesCalendarioCons(-1)">◀</button>
                            <h3 style="text-transform:capitalize;">📅 ${tituloMes} — ${escH(espAct)}</h3>
                            <button type="button" class="btn btn-ghost btn-sm" onclick="cambiarMesCalendarioCons(1)">▶</button>
                        </div>
                        <div style="display:flex; gap:0.4rem; align-items:center;">
                            <small style="color:var(--ink-500); font-size:0.72rem;">👆 Tocá una fecha para agendar</small>
                            <button type="button" class="btn btn-secondary btn-sm" onclick="estadoUI_IrHoyCons()">Hoy</button>
                        </div>
                    </div>
                    <div class="cons-cal-weekdays"><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span></div>
                    <div class="cons-cal-grid">${celdas}</div>
                </div>

                <!-- DERECHA: ALARMA WA 24HS + PRÓXIMOS PACIENTES CON RESUMEN CLÍNICO -->
                <div class="cons-side-col">
                    ${alarmas24.length > 0 ? `
                        <div class="cons-alarm24-card">
                            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem; margin-bottom:0.55rem; flex-wrap:wrap;">
                                <strong style="font-size:0.86rem; color:var(--ink-900);">🔔 Alarma WhatsApp — Próximas 24hs (${alarmas24.length})</strong>
                                <span class="badge ${pend24.length ? "badge-warn" : "badge-ok"}">${pend24.length ? `${pend24.length} sin avisar` : "Todos avisados"}</span>
                            </div>
                            <div style="display:flex; flex-direction:column; gap:0.4rem; max-height:190px; overflow-y:auto;">
                                ${alarmas24.map(({ turno: t, faltanTxt }) => `
                                    <div class="cons-alarm24-item ${t.aviso24hEnviado ? "sent" : ""}">
                                        <div style="min-width:0;">
                                            <strong style="display:block; font-size:0.83rem;">${escH(t.pacienteNombre)}</strong>
                                            <small style="color:var(--ink-600);">${formatearFechaCortaAR(t.fecha)} • <b>${t.hora} hs</b> (${faltanTxt})</small>
                                        </div>
                                        <button type="button" class="btn ${t.aviso24hEnviado ? "btn-secondary" : "btn-whatsapp"} btn-sm"
                                            style="min-height:28px; font-size:0.72rem; flex-shrink:0;"
                                            onclick="enviarAlarma24hTurnoWA(${t.id})">
                                            ${t.aviso24hEnviado ? "✅ Reenviar" : "📲 Avisar 24hs"}
                                        </button>
                                    </div>
                                `).join("")}
                            </div>
                        </div>
                    ` : ""}

                    <div class="cons-card">
                        <div class="cons-card-head">
                            <div>
                                <h3>🌟 Próximos Pacientes — ${escH(espAct)}</h3>
                                <small style="color:var(--ink-500); font-size:0.72rem;">Resumen de última consulta y notas del profesional</small>
                            </div>
                            <span class="badge badge-celeste">${proximos.length} activo(s)</span>
                        </div>

                        <div style="display:flex; flex-direction:column; gap:0.6rem; max-height:540px; overflow-y:auto;">
                            ${proximos.length === 0 ? `
                                <div class="empty-box" style="padding:1.35rem; font-size:0.81rem;">
                                    Sin turnos próximos en <b>${escH(espAct)}</b>.<br>
                                    <small style="color:var(--ink-500);">Tocá cualquier día del calendario para agendar.</small>
                                </div>
                            ` : proximos.map(({ turno: t, esReciente }) => {
                                const esHoy = t.fecha === hoy;
                                const mut = buscarMutualPorId(db, t.mutualId, espAct);
                                const estBadge = t.estado === "atendido" ? "badge-ok" : t.estado === "confirmado" ? "badge-celeste" : "badge-warn";
                                const resumen = obtenerResumenUltimaConsulta(db, t.pacienteId, espAct);

                                return `
                                    <div class="cons-next-card" style="border-left-color:${esHoy ? "#ef4444" : colorEsp};">
                                        <div class="cons-next-top">
                                            <div style="min-width:0;">
                                                <strong style="font-size:0.92rem; display:block;">
                                                    👤 ${escH(t.pacienteNombre)}
                                                    ${esHoy ? `<span class="badge badge-danger" style="font-size:0.62rem; margin-left:4px;">🔥 HOY</span>` : ""}
                                                    ${esReciente ? `<span class="badge badge-ok" style="font-size:0.62rem; margin-left:4px;">🆕 Reciente</span>` : ""}
                                                </strong>
                                                <small style="color:var(--ink-600); display:block; margin-top:2px;">
                                                    📅 <b>${formatearFechaCortaAR(t.fecha)}</b> • ⏰ <b>${t.hora} hs</b> • ${escH(mut ? mut.nombre : (t.mutualNombre || "Particular"))}
                                                    ${t.token ? ` • 🔑 <b>${escH(t.token)}</b>` : ""}
                                                    ${t.aviso24hEnviado ? ` • <span style="color:#059669; font-weight:700;">✅ WA enviado</span>` : ""}
                                                </small>
                                            </div>
                                            <span class="badge ${estBadge}" style="text-transform:capitalize; flex-shrink:0;">${t.estado}</span>
                                        </div>

                                        ${resumen ? `
                                            <div class="cons-next-summary">
                                                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem; flex-wrap:wrap; margin-bottom:2px;">
                                                    <strong style="font-size:0.71rem; color:${colorEsp};">🩺 ${escH(resumen.etiqueta)}</strong>
                                                    ${resumen.metrica ? `<span class="badge badge-celeste" style="font-size:0.65rem;">${escH(resumen.metrica)}</span>` : ""}
                                                </div>
                                                ${resumen.detalle ? `<div>${escH(resumen.detalle)}</div>` : ""}
                                            </div>
                                        ` : ""}

                                        ${t.motivo ? `
                                            <div class="cons-next-note">
                                                <div><b>📝 Nota del profesional:</b> ${escH(t.motivo)}</div>
                                                <button type="button" class="btn btn-ghost btn-sm" style="min-height:22px; padding:0 5px; font-size:0.7rem;" onclick="editarNotaRapidaTurnoCons(${t.id})" title="Editar nota">✏️</button>
                                            </div>
                                        ` : ""}

                                        <div class="cons-next-actions">
                                            <select style="width:auto; min-height:27px; font-size:0.71rem; padding:0 5px;" onchange="cambiarEstadoTurnoCons(${t.id}, this.value)">
                                                <option value="pendiente" ${t.estado === "pendiente" ? "selected" : ""}>🟡 Pendiente</option>
                                                <option value="confirmado" ${t.estado === "confirmado" ? "selected" : ""}>🔵 Confirmado</option>
                                                <option value="atendido" ${t.estado === "atendido" ? "selected" : ""}>🟢 Atendido</option>
                                                <option value="cancelado" ${t.estado === "cancelado" ? "selected" : ""}>🔴 Cancelado</option>
                                            </select>
                                            ${t.pacienteId ? `<button type="button" class="btn btn-secondary btn-sm" style="min-height:27px; font-size:0.71rem;" onclick="abrirHistoriaClinicaPacienteCDM(${t.pacienteId})">🩺 Ficha</button>` : ""}
                                            <button type="button" class="btn btn-ghost btn-sm" style="min-height:27px; font-size:0.71rem;" onclick="editarNotaRapidaTurnoCons(${t.id})" title="Escribir o editar detalle rápido">📝 Nota</button>
                                            <button type="button" class="btn btn-whatsapp btn-sm" style="min-height:27px; font-size:0.71rem;" onclick="enviarAlarma24hTurnoWA(${t.id})">📲 WA</button>
                                            <button type="button" class="btn btn-ghost btn-sm" style="min-height:27px; font-size:0.71rem;" onclick="abrirModalTurnoConsultorio(${t.id})" title="Editar turno">✏️</button>
                                            <button type="button" class="btn btn-danger btn-sm" style="min-height:27px; font-size:0.71rem;" onclick="eliminarTurnoCons(${t.id})" title="Eliminar turno">🗑️</button>
                                        </div>
                                    </div>
                                `;
                            }).join("")}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    window.editarNotaRapidaTurnoCons = function (idTurno) {
        const db = obtenerDatosConsultorioCDM();
        const t = db.turnos.find(x => Number(x.id) === Number(idTurno));
        if (!t) return;
        const nueva = prompt(`📝 Detalle / nota rápida del profesional para ${t.pacienteNombre} (${formatearFechaCortaAR(t.fecha)} ${t.hora}hs):`, t.motivo || "");
        if (nueva === null) return;
        t.motivo = nueva.trim();
        guardarDatosConsultorioCDM(db);
        toastCons("📝 Nota del turno actualizada.");
        renderizarConsultorioCompleto();
    };

    window.estadoUI_IrHoyCons = function () {
        const hoy = hoyISO();
        estadoUI.fechaSel = hoy;
        estadoUI.mesVista = hoy.slice(0, 7);
        renderizarConsultorioCompleto();
    };

    window.cambiarEstadoTurnoCons = function (idTurno, nuevoEstado) {
        const db = obtenerDatosConsultorioCDM();
        const t = db.turnos.find(x => Number(x.id) === Number(idTurno));
        if (!t) return;
        t.estado = nuevoEstado;
        guardarDatosConsultorioCDM(db);
        toastCons(`Estado del turno: ${nuevoEstado}`);
        renderizarConsultorioCompleto();
    };

    window.eliminarTurnoCons = function (idTurno) {
        if (!confirm("🗑️ ¿Eliminar este turno?")) return;
        const db = obtenerDatosConsultorioCDM();
        db.turnos = db.turnos.filter(x => Number(x.id) !== Number(idTurno));
        guardarDatosConsultorioCDM(db);
        cerrarModalConsultorioCDM();
        renderizarConsultorioCompleto();
    };

    window.enviarAlarma24hTurnoWA = function (idTurno) {
        const db = obtenerDatosConsultorioCDM();
        const t = db.turnos.find(x => Number(x.id) === Number(idTurno));
        if (!t) return;
        const pac = db.pacientes.find(p => Number(p.id) === Number(t.pacienteId));
        const tel = String(pac?.whatsapp || "").replace(/\D/g, "");
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : { nombreEntidad: "Consultorio" };

        t.aviso24hEnviado = true;
        t.aviso24hFecha = new Date().toISOString();
        guardarDatosConsultorioCDM(db);

        const fechaTxt = formatearFechaCortaAR(t.fecha);
        const msg = `🔔 *RECORDATORIO DE TURNO (24HS) — ${lic.nombreEntidad}*\nHola *${t.pacienteNombre}*, te recordamos tu próximo turno de *${t.especialidad}*:\n📅 Fecha: *${fechaTxt} (${t.fecha})*\n⏰ Hora: *${t.hora} hs*${t.token ? `\n🔑 Token registrado: ${t.token}` : ""}\n\nPor favor respondé *CONFIRMO* para asegurar tu lugar. ¡Te esperamos!`;
        window.open(tel ? `https://wa.me/${tel}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
        renderizarConsultorioCompleto();
    };
    window.recordarTurnoPacienteWA = window.enviarAlarma24hTurnoWA;

    window.saludarCumplePacienteWA = function (idPac) {
        const db = obtenerDatosConsultorioCDM();
        const p = db.pacientes.find(x => Number(x.id) === Number(idPac));
        if (!p) return;
        const tel = String(p.whatsapp || "").replace(/\D/g, "");
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : { nombreEntidad: "Consultorio" };
        const msg = `🎂✨ ¡Muy feliz cumpleaños *${p.nombre}*! Desde *${lic.nombreEntidad}* (${p.especialidad}) te deseamos un excelente día.`;
        window.open(tel ? `https://wa.me/${tel}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    };

    // --- MODAL FLOTANTE PARA AGENDAR / EDITAR TURNO ---
    window.abrirModalTurnoConsultorio = function (idTurno = null, fechaPre = null, idPacPre = null) {
        const db = obtenerDatosConsultorioCDM();
        const t = idTurno ? db.turnos.find(x => Number(x.id) === Number(idTurno)) : null;
        const espDef = t?.especialidad || obtenerEspecialidadActivaResuelta();
        const colorEsp = colorEspecialidadConsultorio(espDef);
        const fechaTarget = t?.fecha || fechaPre || estadoUI.fechaSel;
        const mutualesEsp = asegurarMutualesParaEspecialidad(db, espDef);
        const pacsEsp = db.pacientes
            .filter(p => mismaEsp(p.especialidad, espDef))
            .sort((a, b) => String(a.apellido || "").localeCompare(String(b.apellido || "")));
        const profsEsp = db.profesionales.filter(pr => mismaEsp(pr.especialidad, espDef));

        const pacPre = idPacPre ? pacsEsp.find(p => Number(p.id) === Number(idPacPre)) : (t?.pacienteId ? pacsEsp.find(p => Number(p.id) === Number(t.pacienteId)) : null);
        const mutPre = buscarMutualPorId(db, t?.mutualId || pacPre?.mutualId, espDef) || mutualesEsp[0];

        const ocupadosDia = db.turnos
            .filter(x => mismaEsp(x.especialidad, espDef) && x.fecha === fechaTarget && x.estado !== "cancelado")
            .sort((a, b) => String(a.hora || "").localeCompare(String(b.hora || "")));

        const resumenPre = pacPre ? obtenerResumenUltimaConsulta(db, pacPre.id, espDef) : null;

        const modal = asegurarModalConsultorio();
        modal.innerHTML = `
            <div class="modal-window" style="max-width:650px;">
                <div class="modal-top">
                    <div>
                        <span class="badge" style="background:${colorEsp}; color:#fff;">${iconoEspecialidadConsultorio(espDef)} ${escH(espDef.toUpperCase())} • ${formatearFechaCortaAR(fechaTarget)}</span>
                        <h3 style="margin-top:4px;">${t ? `Editar Turno — ${escH(t.pacienteNombre)}` : `Agendar Turno en ${formatearFechaCortaAR(fechaTarget)}`}</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalConsultorioCDM()">✕</button>
                </div>

                ${ocupadosDia.length > 0 ? `
                    <div class="cons-day-slots-bar">
                        <strong style="color:var(--ink-600);">⏰ Ya agendados ese día:</strong>
                        ${ocupadosDia.map(x => `
                            <button type="button" class="cons-slot-chip" onclick="abrirModalTurnoConsultorio(${x.id})" title="Tocá para editar este turno">
                                ${x.hora} ${escH(x.pacienteNombre.split(" ")[0])}
                            </button>
                        `).join("")}
                    </div>
                ` : ""}

                <form onsubmit="guardarTurnoConsultorio(event, ${t ? t.id : "null"}, '${espDef.replace(/'/g, "\\'")}')">
                    <div class="grid-3" style="margin-bottom:0.65rem;">
                        <div class="field"><label>Fecha *</label><input type="date" id="ctFecha" value="${fechaTarget}" required></div>
                        <div class="field"><label>Hora *</label><input type="time" id="ctHora" value="${t?.hora || "10:00"}" required></div>
                        <div class="field"><label>Área</label><input type="text" value="${iconoEspecialidadConsultorio(espDef)} ${escH(espDef)}" disabled style="font-weight:800; opacity:0.85;"></div>
                    </div>

                    <div class="grid-2" style="margin-bottom:0.6rem;">
                        <div class="field">
                            <label>Paciente de ${escH(espDef)} (${pacsEsp.length})</label>
                            <select id="ctPacId" onchange="autocompletarPacienteEnTurno(this.value, '${espDef.replace(/'/g, "\\'")}')">
                                <option value="">-- Nuevo / Escribir nombre --</option>
                                ${pacsEsp.map(p => `<option value="${p.id}" ${Number(pacPre?.id) === Number(p.id) ? "selected" : ""}>${escH(p.apellido)}, ${escH(p.nombre)} (DNI ${escH(p.dni || "-")})</option>`).join("")}
                            </select>
                        </div>
                        <div class="field"><label>Nombre Completo *</label><input type="text" id="ctPacNom" value="${escH(t?.pacienteNombre || (pacPre ? `${pacPre.nombre} ${pacPre.apellido}` : ""))}" required placeholder="Ej: Ana García"></div>
                    </div>

                    <div id="ctPreviewUltimaCons" style="${resumenPre ? "" : "display:none;"} background:var(--cdm-50, #f0f9ff); border:1px solid #bae6fd; border-radius:11px; padding:0.5rem 0.72rem; margin-bottom:0.65rem; font-size:0.76rem;">
                        ${resumenPre ? `<b>🩺 ${escH(resumenPre.etiqueta)}${resumenPre.metrica ? ` (${escH(resumenPre.metrica)})` : ""}:</b> ${escH(resumenPre.detalle)}` : ""}
                    </div>

                    <div class="grid-2" style="margin-bottom:0.65rem;">
                        <div class="field">
                            <label>Obra Social / Tarifa (${escH(espDef)}) *</label>
                            <select id="ctMutId" onchange="actualizarPreciosModalTurno(this.value)">
                                ${mutualesEsp.map(m => `<option value="${m.id}" ${m.id === mutPre?.id ? "selected" : ""}>${escH(m.nombre)}</option>`).join("")}
                            </select>
                        </div>
                        <div class="field"><label>🔑 Token / N° Orden</label><input type="text" id="ctToken" value="${escH(t?.token || "")}" placeholder="Ej: 482910"></div>
                    </div>

                    <div class="grid-3" style="margin-bottom:0.65rem; background:var(--surface-subtle); padding:0.6rem; border-radius:12px;">
                        <div class="field"><label>Valor Obra Social ($)</label><input type="number" id="ctValMut" value="${t ? (t.valorMutual ?? 0) : (mutPre?.esParticular ? 0 : (mutPre?.valorMutual || 0))}"></div>
                        <div class="field"><label>Coseguro ($)</label><input type="number" id="ctCoseg" value="${t ? (t.coseguro ?? 0) : (mutPre?.esParticular ? 0 : (mutPre?.coseguro || 0))}"></div>
                        <div class="field"><label>Valor Particular ($)</label><input type="number" id="ctValPart" value="${t ? (t.valorParticular ?? 0) : (mutPre?.esParticular ? (mutPre?.valorParticular || 25000) : 0)}"></div>
                    </div>

                    <div class="grid-2" style="margin-bottom:0.8rem;">
                        <div class="field">
                            <label>Profesional de ${escH(espDef)}</label>
                            <select id="ctProf">
                                <option value="">-- Titular --</option>
                                ${profsEsp.map(pr => `<option value="${escH(pr.nombre)}" ${t?.profesional === pr.nombre ? "selected" : ""}>${escH(pr.nombre)}</option>`).join("")}
                            </select>
                        </div>
                        <div class="field"><label>📝 Detalle / Nota del Profesional</label><input type="text" id="ctMotivo" value="${escH(t?.motivo || "")}" placeholder="Ej: Revisar tarea semanal, traer estudio..."></div>
                    </div>

                    <div style="display:flex; gap:0.5rem;">
                        <button type="submit" class="btn btn-primary" style="flex:1; background:${colorEsp}; border-color:${colorEsp};">💾 ${t ? "Guardar Cambios" : `Confirmar Turno (${formatearFechaCortaAR(fechaTarget)})`}</button>
                        ${t ? `<button type="button" class="btn btn-danger" onclick="eliminarTurnoCons(${t.id})">🗑️</button>` : ""}
                    </div>
                </form>
            </div>
        `;
        modal.classList.remove("hidden");
    };

    window.autocompletarPacienteEnTurno = function (idPac, espDef) {
        const prevBox = document.getElementById("ctPreviewUltimaCons");
        if (!idPac) {
            if (prevBox) { prevBox.style.display = "none"; prevBox.innerHTML = ""; }
            return;
        }
        const db = obtenerDatosConsultorioCDM();
        const p = db.pacientes.find(x => Number(x.id) === Number(idPac));
        if (!p) return;
        if (document.getElementById("ctPacNom")) document.getElementById("ctPacNom").value = `${p.nombre} ${p.apellido}`;
        const m = buscarMutualPorId(db, p.mutualId, espDef);
        if (m && document.getElementById("ctMutId")) {
            document.getElementById("ctMutId").value = m.id;
            actualizarPreciosModalTurno(m.id);
        }
        const res = obtenerResumenUltimaConsulta(db, p.id, espDef);
        if (prevBox) {
            if (res) {
                prevBox.innerHTML = `<b>🩺 ${escH(res.etiqueta)}${res.metrica ? ` (${escH(res.metrica)})` : ""}:</b> ${escH(res.detalle)}`;
                prevBox.style.display = "block";
            } else {
                prevBox.style.display = "none";
            }
        }
    };

    window.actualizarPreciosModalTurno = function (mutId) {
        const db = obtenerDatosConsultorioCDM();
        const m = db.mutuales.find(x => x.id === mutId);
        if (!m) return;
        const esPart = Boolean(m.esParticular) || Number(m.valorMutual) === 0;
        if (document.getElementById("ctValMut")) document.getElementById("ctValMut").value = esPart ? 0 : (m.valorMutual || 0);
        if (document.getElementById("ctCoseg")) document.getElementById("ctCoseg").value = esPart ? 0 : (m.coseguro || 0);
        if (document.getElementById("ctValPart")) document.getElementById("ctValPart").value = esPart ? (m.valorParticular || 25000) : 0;
    };

    window.guardarTurnoConsultorio = function (e, idEdit, espFija) {
        e.preventDefault();
        const db = obtenerDatosConsultorioCDM();
        const mutId = document.getElementById("ctMutId").value;
        const mut = db.mutuales.find(m => m.id === mutId);
        const pacIdVal = document.getElementById("ctPacId").value;
        const previo = idEdit ? db.turnos.find(x => Number(x.id) === Number(idEdit)) : null;

        const obj = {
            ...(previo || {}),
            id: idEdit || Date.now(),
            creadoEn: previo?.creadoEn || Date.now(),
            fecha: document.getElementById("ctFecha").value,
            hora: document.getElementById("ctHora").value,
            especialidad: espFija,
            pacienteId: pacIdVal ? Number(pacIdVal) : null,
            pacienteNombre: document.getElementById("ctPacNom").value.trim(),
            mutualId: mutId,
            mutualNombre: mut ? mut.nombre : "Particular",
            token: document.getElementById("ctToken").value.trim(),
            valorMutual: Number(document.getElementById("ctValMut").value) || 0,
            coseguro: Number(document.getElementById("ctCoseg").value) || 0,
            valorParticular: Number(document.getElementById("ctValPart").value) || 0,
            profesional: document.getElementById("ctProf").value,
            motivo: document.getElementById("ctMotivo").value.trim(),
            estado: previo?.estado || "confirmado",
            aviso24hEnviado: previo && previo.fecha === document.getElementById("ctFecha").value ? Boolean(previo.aviso24hEnviado) : false
        };

        if (idEdit) {
            const idx = db.turnos.findIndex(x => Number(x.id) === Number(idEdit));
            if (idx >= 0) db.turnos[idx] = obj;
        } else db.turnos.push(obj);

        estadoUI.fechaSel = obj.fecha;
        estadoUI.mesVista = obj.fecha.slice(0, 7);
        guardarDatosConsultorioCDM(db);
        cerrarModalConsultorioCDM();
        toastCons(`📅 Turno guardado en ${espFija}: ${obj.pacienteNombre} (${obj.hora} hs)`);
        renderizarConsultorioCompleto();
        if (typeof renderizarTarjetasModernasIndex === "function") {
            renderizarTarjetasModernasIndex((typeof basePersonas !== "undefined" ? basePersonas : []).filter(p => p && p.activo));
        }
    };

    // =====================================================================
    // 6. TAB 2: BASE DE DATOS DE PACIENTES (TABLA PC + LISTA BÁSICA MÓVIL)
    // =====================================================================
    function renderTabPacientes(cont, ctx) {
        const { db, espAct, colorEsp, perfilEsp, pacsEsp, mutualesEsp } = ctx;
        const q = normTxt(estadoUI.busqPac);
        const lista = pacsEsp.filter(p => {
            if (estadoUI.filtroMutPac !== "TODAS") {
                const m = buscarMutualPorId(db, p.mutualId, espAct);
                if (!m || m.id !== estadoUI.filtroMutPac) return false;
            }
            if (q && !normTxt(`${p.nombre} ${p.apellido} ${p.dni} ${p.nroAfiliado} ${p.codigoAcceso} ${p.motivoConsulta} ${p.diagnostico} ${p.objetivoNutricion}`).includes(q)) return false;
            return true;
        }).sort((a, b) => String(a.apellido || "").localeCompare(String(b.apellido || "")));

        const colPerfilTitulo = {
            psicologia: "Encuadre / Modalidad",
            nutricion: "Antropometría / Objetivo",
            fisico: "Diagnóstico / Actividad",
            general: "Motivo de Consulta"
        }[perfilEsp];

        cont.innerHTML = `
            <div class="cons-card">
                <div class="cons-card-head">
                    <h3>👥 Base de Pacientes — ${escH(espAct)} (${lista.length})</h3>
                    <div class="cons-pac-tools">
                        <input type="text" placeholder="🔍 Buscar nombre, DNI, afiliado..." value="${escH(estadoUI.busqPac)}" style="width:220px; min-height:36px;" oninput="estadoUI_BusqPacCons(this.value)">
                        <select style="width:auto; min-height:36px;" onchange="estadoUI_MutPacCons(this.value)">
                            <option value="TODAS">Todas las Obras Sociales</option>
                            ${mutualesEsp.map(m => `<option value="${m.id}" ${estadoUI.filtroMutPac === m.id ? "selected" : ""}>${escH(m.nombre)}</option>`).join("")}
                        </select>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="exportarPacientesCSVCons()" title="Exportar Excel CSV">📊 CSV</button>
                        <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalPacienteConsultorio()">+ Nuevo</button>
                    </div>
                </div>

                <!-- VISTA PC: TABLA COMPLETA -->
                <div class="table-wrap cons-pac-desktop-table">
                    <table class="app-table" style="font-size:0.81rem;">
                        <thead>
                            <tr><th>Paciente</th><th>DNI / Edad / Cumple</th><th>Obra Social y Afiliado</th><th>${colPerfilTitulo}</th><th>Portal</th><th style="text-align:right;">Acciones</th></tr>
                        </thead>
                        <tbody>
                            ${lista.length === 0 ? `<tr><td colspan="6"><div class="empty-box" style="padding:1.2rem;">Sin pacientes cargados en <b>${escH(espAct)}</b>. Tocá <b>+ Nuevo</b> para registrar el primero.</div></td></tr>` :
                            lista.map(p => {
                                const mut = buscarMutualPorId(db, p.mutualId, espAct);
                                const cumple = p.fechaNacimiento ? `${p.fechaNacimiento.slice(8, 10)}/${p.fechaNacimiento.slice(5, 7)}` : "-";

                                let celdaEsp = `<small style="color:var(--ink-500);">${escH(p.antecedentes || "-")}</small>`;
                                if (perfilEsp === "psicologia") {
                                    celdaEsp = `<span class="badge badge-purple">${escH(p.modalidadAtencion || "Presencial")}</span><br><small style="color:var(--ink-500);">${escH(p.motivoConsulta || p.antecedentes || "Sin motivo cargado")}</small>`;
                                } else if (perfilEsp === "nutricion") {
                                    const arrAnt = Array.isArray(p.antropometria) ? p.antropometria : (Array.isArray(p.antropometrias) ? p.antropometrias : []);
                                    const hist = [...arrAnt].sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")));
                                    const ult = hist[0] || null;
                                    const pesoTxt = ult?.peso || p.pesoInicial;
                                    const tallaTxt = ult?.talla || p.tallaCm;
                                    const imc = ult?.imc || ((pesoTxt && tallaTxt) ? (Number(pesoTxt) / Math.pow(Number(tallaTxt) / 100, 2)).toFixed(1) : null);
                                    const objTxt = p.planNutri?.objetivo || p.objetivoNutricion || "Plan Nutricional";
                                    celdaEsp = `<span class="badge badge-ok">${escH(objTxt)}</span><br><small style="color:var(--ink-500);">${pesoTxt ? `${pesoTxt} kg` : "-"}${tallaTxt ? ` • ${tallaTxt} cm` : ""}${imc ? ` • IMC ${imc}` : ""}</small>`;
                                } else if (perfilEsp === "fisico") {
                                    const diagTxt = p.evalFisica?.diagnostico || p.diagnostico || "Evaluación física";
                                    celdaEsp = `<b>${escH(diagTxt)}</b><br><small style="color:var(--ink-500);">${escH(p.actividadFisica || p.medicoDerivante || p.antecedentes || "-")}</small>`;
                                }

                                return `
                                    <tr>
                                        <td><strong>${escH(p.apellido)}, ${escH(p.nombre)}</strong><br><small style="color:var(--ink-500);">${escH(p.whatsapp || "Sin teléfono")}</small></td>
                                        <td>DNI ${escH(p.dni || "-")}<br><small><b>${calcularEdadPac(p.fechaNacimiento)} años</b> • 🎂 ${cumple}</small></td>
                                        <td><span class="badge badge-celeste">${escH(mut ? mut.nombre : "Particular")}</span><br><small>Afiliado: ${escH(p.nroAfiliado || "-")}</small></td>
                                        <td>${celdaEsp}</td>
                                        <td>
                                            <code class="cons-code-pill" title="Tocá para copiar código de acceso" onclick="copiarCodigoPacienteCons('${escH(p.codigoAcceso)}')">${escH(p.codigoAcceso)}</code>
                                            ${p.puedeSubirEstudios ? `<span title="Subida de estudios habilitada" style="margin-left:3px;">🔓</span>` : ""}
                                        </td>
                                        <td style="text-align:right; white-space:nowrap;">
                                            <button type="button" class="btn btn-primary btn-sm" onclick="abrirHistoriaClinicaPacienteCDM(${p.id})">🩺 Historia</button>
                                            <button type="button" class="btn btn-ok btn-sm" onclick="abrirModalTurnoConsultorio(null, null, ${p.id})">📅 Turno</button>
                                            <button type="button" class="btn btn-ghost btn-sm" onclick="abrirModalPacienteConsultorio(${p.id})">✏️</button>
                                            <button type="button" class="btn btn-danger btn-sm" onclick="eliminarPacienteConsultorio(${p.id})">🗑️</button>
                                        </td>
                                    </tr>
                                `;
                            }).join("")}
                        </tbody>
                    </table>
                </div>

                <!-- VISTA MÓVIL: LISTA BÁSICA COMPACTA -->
                <div class="cons-pac-mobile-list">
                    ${lista.length === 0 ? `<div class="empty-box" style="padding:1rem; font-size:0.8rem;">Sin pacientes en <b>${escH(espAct)}</b>.</div>` :
                    lista.map(p => {
                        const mut = buscarMutualPorId(db, p.mutualId, espAct);
                        const mutCorta = mut ? mut.nombre.replace(/\s*\(Sin Obra Social\)/i, "") : "Particular";
                        const edad = calcularEdadPac(p.fechaNacimiento);
                        return `
                            <div class="cons-pac-row-mob" style="border-left-color:${colorEsp};">
                                <div class="cons-pac-row-info" onclick="abrirHistoriaClinicaPacienteCDM(${p.id})">
                                    <div class="cons-pac-row-top">
                                        <strong>${escH(p.apellido)}, ${escH(p.nombre)}</strong>
                                        <span class="badge badge-celeste" style="font-size:0.62rem; padding:1px 6px;">${escH(mutCorta)}</span>
                                    </div>
                                    <span class="cons-pac-row-sub">
                                        DNI ${escH(p.dni || "-")}${edad !== "-" ? ` • ${edad}a` : ""}${p.whatsapp ? ` • ${escH(p.whatsapp)}` : ""} • ${escH(p.codigoAcceso)}${p.puedeSubirEstudios ? " 🔓" : ""}
                                    </span>
                                </div>
                                <div class="cons-pac-row-acts">
                                    <button type="button" class="btn btn-primary btn-sm" onclick="abrirHistoriaClinicaPacienteCDM(${p.id})" title="Historia Clínica">🩺</button>
                                    <button type="button" class="btn btn-ok btn-sm" onclick="abrirModalTurnoConsultorio(null, null, ${p.id})" title="Sacar Turno">📅</button>
                                    <button type="button" class="btn btn-ghost btn-sm" onclick="abrirModalPacienteConsultorio(${p.id})" title="Editar">✏️</button>
                                    <button type="button" class="btn btn-danger btn-sm" onclick="eliminarPacienteConsultorio(${p.id})" title="Eliminar">🗑️</button>
                                </div>
                            </div>
                        `;
                    }).join("")}
                </div>
            </div>
        `;
    }

    window.copiarCodigoPacienteCons = function (cod) {
        if (!cod) return;
        navigator.clipboard?.writeText(cod).then(() => toastCons(`📋 Código copiado: ${cod}`)).catch(() => {});
    };

    window.estadoUI_BusqPacCons = function (v) { estadoUI.busqPac = v; renderizarConsultorioCompleto(); };
    window.estadoUI_MutPacCons = function (v) { estadoUI.filtroMutPac = v; renderizarConsultorioCompleto(); };

    window.abrirModalPacienteConsultorio = function (idPac = null, espForzada = null) {
        const db = obtenerDatosConsultorioCDM();
        const p = idPac ? db.pacientes.find(x => Number(x.id) === Number(idPac)) : null;
        const profs = obtenerEspecialidadesHabilitadasConsultorioCDM();
        const enPortada = !document.getElementById("cdmSeccionConsultorioGlobal") || document.getElementById("cdmSeccionConsultorioGlobal").classList.contains("hidden");
        const espFija = p?.especialidad || espForzada || obtenerEspecialidadActivaResuelta();
        const perfil = obtenerPerfilEspecialidadCDM(espFija);
        const mutualesEsp = asegurarMutualesParaEspecialidad(db, espFija);
        const mutSel = buscarMutualPorId(db, p?.mutualId, espFija) || mutualesEsp[0];

        let bloqueEspecifico = "";
        if (perfil === "psicologia") {
            bloqueEspecifico = `
                <div class="grid-3" style="margin-bottom:0.65rem; background:rgba(124,58,237,0.06); padding:0.65rem; border-radius:12px; border:1px solid rgba(124,58,237,0.2);">
                    <div class="field"><label>Modalidad de Terapia</label>
                        <select id="cpModPsi">
                            <option ${p?.modalidadAtencion === "Presencial" ? "selected" : ""}>Presencial</option>
                            <option ${p?.modalidadAtencion === "Online / Video" ? "selected" : ""}>Online / Video</option>
                            <option ${p?.modalidadAtencion === "Mixta" ? "selected" : ""}>Mixta</option>
                        </select>
                    </div>
                    <div class="field"><label>Contacto de Emergencia</label><input type="text" id="cpEmergPsi" value="${escH(p?.contactoEmergencia || "")}" placeholder="Ej: Mamá - 358..."></div>
                    <div class="field"><label>Derivado por / Medicación</label><input type="text" id="cpMedPsi" value="${escH(p?.medicacionActual || "")}" placeholder="Ej: Consulta espontánea / Sin med."></div>
                </div>
                <div class="field" style="margin-bottom:0.8rem;"><label>Motivo de Consulta Inicial (Psicología)</label><textarea id="cpAnt" rows="2" placeholder="Motivo principal, contexto o encuadre inicial...">${escH(p?.motivoConsulta || p?.antecedentes || "")}</textarea></div>
            `;
        } else if (perfil === "nutricion") {
            bloqueEspecifico = `
                <div class="grid-3" style="margin-bottom:0.65rem; background:rgba(22,163,74,0.06); padding:0.65rem; border-radius:12px; border:1px solid rgba(22,163,74,0.22);">
                    <div class="field"><label>Objetivo Nutricional</label>
                        <select id="cpObjNut">
                            <option ${p?.objetivoNutricion === "Reeducación Alimentaria" ? "selected" : ""}>Reeducación Alimentaria</option>
                            <option ${p?.objetivoNutricion === "Descenso de Masa Grasa" ? "selected" : ""}>Descenso de Masa Grasa</option>
                            <option ${p?.objetivoNutricion === "Hipertrofia / Masa Muscular" ? "selected" : ""}>Hipertrofia / Masa Muscular</option>
                            <option ${p?.objetivoNutricion === "Rendimiento Deportivo" ? "selected" : ""}>Rendimiento Deportivo</option>
                            <option ${p?.objetivoNutricion === "Salud Metabólica / Clínica" ? "selected" : ""}>Salud Metabólica / Clínica</option>
                        </select>
                    </div>
                    <div class="field"><label>Talla (cm)</label><input type="number" step="0.5" id="cpTallaNut" value="${p?.tallaCm || ""}" placeholder="Ej: 170"></div>
                    <div class="field"><label>Peso Inicial (kg)</label><input type="number" step="0.1" id="cpPesoNut" value="${p?.pesoInicial || ""}" placeholder="Ej: 72.5"></div>
                </div>
                <div class="field" style="margin-bottom:0.8rem;"><label>Alergias, Intolerancias o Restricciones Alimentarias</label><textarea id="cpAnt" rows="2" placeholder="Ej: Celíaco, intolerancia lactosa, vegetariano, diabetes...">${escH(p?.alergiasAlimentarias || p?.antecedentes || "")}</textarea></div>
            `;
        } else if (perfil === "fisico") {
            bloqueEspecifico = `
                <div class="grid-3" style="margin-bottom:0.65rem; background:rgba(2,132,199,0.06); padding:0.65rem; border-radius:12px; border:1px solid rgba(2,132,199,0.22);">
                    <div class="field"><label>Diagnóstico / Zona Principal</label><input type="text" id="cpDiagFis" value="${escH(p?.diagnostico || "")}" placeholder="Ej: Lumbalgia / Esguince tobillo"></div>
                    <div class="field"><label>Médico Derivante / Orden</label><input type="text" id="cpMedFis" value="${escH(p?.medicoDerivante || "")}" placeholder="Ej: Dr. Pérez (10 sesiones)"></div>
                    <div class="field"><label>Deporte / Trabajo Físico</label><input type="text" id="cpActFis" value="${escH(p?.actividadFisica || "")}" placeholder="Ej: Fútbol / Oficina 8hs"></div>
                </div>
                <div class="field" style="margin-bottom:0.8rem;"><label>Antecedentes Clínicos / Cirugías / Lesiones Previas</label><textarea id="cpAnt" rows="2" placeholder="Operaciones, fracturas, prótesis, alergias...">${escH(p?.antecedentes || "")}</textarea></div>
            `;
        } else {
            bloqueEspecifico = `
                <div class="field" style="margin-bottom:0.8rem;"><label>Motivo de Consulta / Antecedentes</label><textarea id="cpAnt" rows="2" placeholder="Observaciones iniciales...">${escH(p?.antecedentes || "")}</textarea></div>
            `;
        }

        const modal = asegurarModalConsultorio();
        modal.innerHTML = `
            <div class="modal-window" style="max-width:640px;">
                <div class="modal-top">
                    <div>
                        <span class="badge" style="background:${colorEspecialidadConsultorio(espFija)}; color:#fff;">${iconoEspecialidadConsultorio(espFija)} PACIENTE DE ${escH(espFija.toUpperCase())}</span>
                        <h3 style="margin-top:4px;">${p ? `Editar: ${escH(p.nombre)} ${escH(p.apellido)}` : `Nuevo Paciente en ${escH(espFija)}`}</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalConsultorioCDM()">✕</button>
                </div>
                <form onsubmit="guardarPacienteConsultorio(event, ${p ? p.id : "null"}, '${espFija.replace(/'/g, "\\'")}')">
                    ${(!p && enPortada && profs.length > 1) ? `
                        <div class="field" style="margin-bottom:0.65rem;">
                            <label>Elegir Especialidad *</label>
                            <select onchange="abrirModalPacienteConsultorio(null, this.value)">
                                ${profs.map(pr => `<option value="${escH(pr.clave)}" ${mismaEsp(pr.clave, espFija) ? "selected" : ""}>${pr.icono} ${escH(pr.clave)}</option>`).join("")}
                            </select>
                        </div>
                    ` : ""}
                    <div class="grid-2" style="margin-bottom:0.65rem;">
                        <div class="field"><label>Nombre *</label><input type="text" id="cpNom" value="${escH(p?.nombre || "")}" required></div>
                        <div class="field"><label>Apellido *</label><input type="text" id="cpApe" value="${escH(p?.apellido || "")}" required></div>
                    </div>
                    <div class="grid-3" style="margin-bottom:0.65rem;">
                        <div class="field"><label>DNI *</label><input type="text" id="cpDni" value="${escH(p?.dni || "")}" required></div>
                        <div class="field"><label>🎂 Fecha Nacimiento</label><input type="date" id="cpNac" value="${p?.fechaNacimiento || ""}"></div>
                        <div class="field"><label>WhatsApp</label><input type="text" id="cpWa" value="${escH(p?.whatsapp || "")}" placeholder="549358..."></div>
                    </div>
                    <div class="grid-2" style="margin-bottom:0.65rem;">
                        <div class="field"><label>Obra Social / Mutual (${escH(espFija)}) *</label>
                            <select id="cpMut">${mutualesEsp.map(m => `<option value="${m.id}" ${m.id === mutSel?.id ? "selected" : ""}>${escH(m.nombre)}</option>`).join("")}</select>
                        </div>
                        <div class="field"><label>N° Afiliado / Credencial</label><input type="text" id="cpAfil" value="${escH(p?.nroAfiliado || "")}" placeholder="Ej: 1-234567-01"></div>
                    </div>
                    ${bloqueEspecifico}
                    <button type="submit" class="btn btn-primary" style="width:100%;">💾 Guardar en ${escH(espFija)}</button>
                </form>
            </div>
        `;
        modal.classList.remove("hidden");
    };

    window.guardarPacienteConsultorio = function (e, idEdit, espFija) {
        e.preventDefault();
        const db = obtenerDatosConsultorioCDM();
        const existente = idEdit ? db.pacientes.find(x => Number(x.id) === Number(idEdit)) : null;
        const perfil = obtenerPerfilEspecialidadCDM(espFija);

        const extra = {};
        if (perfil === "psicologia") {
            extra.modalidadAtencion = document.getElementById("cpModPsi")?.value || "Presencial";
            extra.contactoEmergencia = (document.getElementById("cpEmergPsi")?.value || "").trim();
            extra.medicacionActual = (document.getElementById("cpMedPsi")?.value || "").trim();
            extra.motivoConsulta = (document.getElementById("cpAnt")?.value || "").trim();
        } else if (perfil === "nutricion") {
            extra.objetivoNutricion = document.getElementById("cpObjNut")?.value || "Reeducación Alimentaria";
            extra.tallaCm = document.getElementById("cpTallaNut")?.value ? Number(document.getElementById("cpTallaNut").value) : null;
            extra.pesoInicial = document.getElementById("cpPesoNut")?.value ? Number(document.getElementById("cpPesoNut").value) : null;
            extra.alergiasAlimentarias = (document.getElementById("cpAnt")?.value || "").trim();
        } else if (perfil === "fisico") {
            extra.diagnostico = (document.getElementById("cpDiagFis")?.value || "").trim();
            extra.medicoDerivante = (document.getElementById("cpMedFis")?.value || "").trim();
            extra.actividadFisica = (document.getElementById("cpActFis")?.value || "").trim();
        }

        const obj = {
            ...(existente || {}),
            ...extra,
            id: idEdit || Date.now(),
            codigoAcceso: existente?.codigoAcceso || generarCodigoPaciente(db.pacientes),
            especialidad: espFija,
            nombre: document.getElementById("cpNom").value.trim(),
            apellido: document.getElementById("cpApe").value.trim(),
            dni: document.getElementById("cpDni").value.trim(),
            fechaNacimiento: document.getElementById("cpNac").value,
            whatsapp: document.getElementById("cpWa").value.trim(),
            mutualId: document.getElementById("cpMut").value,
            nroAfiliado: document.getElementById("cpAfil").value.trim(),
            antecedentes: (document.getElementById("cpAnt")?.value || "").trim()
        };

        if (idEdit) {
            const i = db.pacientes.findIndex(x => Number(x.id) === Number(idEdit));
            if (i >= 0) db.pacientes[i] = obj;
        } else db.pacientes.push(obj);

        guardarDatosConsultorioCDM(db);
        cerrarModalConsultorioCDM();
        toastCons(`✅ Paciente guardado solo en ${espFija} (${obj.codigoAcceso})`);
        renderizarConsultorioCompleto();
        if (typeof renderizarTarjetasModernasIndex === "function") {
            renderizarTarjetasModernasIndex((typeof basePersonas !== "undefined" ? basePersonas : []).filter(p => p && p.activo));
        }
    };

    window.eliminarPacienteConsultorio = function (idPac) {
        if (!confirm("🗑️ ¿Eliminar este paciente de la base de datos?")) return;
        const db = obtenerDatosConsultorioCDM();
        db.pacientes = db.pacientes.filter(x => Number(x.id) !== Number(idPac));
        guardarDatosConsultorioCDM(db);
        renderizarConsultorioCompleto();
        if (typeof renderizarTarjetasModernasIndex === "function") {
            renderizarTarjetasModernasIndex((typeof basePersonas !== "undefined" ? basePersonas : []).filter(p => p && p.activo));
        }
    };

    window.exportarPacientesCSVCons = function () {
        const db = obtenerDatosConsultorioCDM();
        const espAct = obtenerEspecialidadActivaResuelta();
        const pacs = db.pacientes.filter(p => mismaEsp(p.especialidad, espAct));
        if (!pacs.length) return alert(`No hay pacientes cargados en ${espAct}.`);
        const esc = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
        let csv = ["Apellido", "Nombre", "DNI", "Fecha Nac", "Edad", "WhatsApp", "Especialidad", "Obra Social", "Nro Afiliado", "Codigo Portal"].map(esc).join(";") + "\n";
        pacs.forEach(p => {
            const mut = buscarMutualPorId(db, p.mutualId, espAct);
            csv += [p.apellido, p.nombre, p.dni, p.fechaNacimiento, calcularEdadPac(p.fechaNacimiento), p.whatsapp, p.especialidad, mut?.nombre || "Particular", p.nroAfiliado, p.codigoAcceso].map(esc).join(";") + "\n";
        });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
        a.download = `pacientes_${normTxt(espAct)}_${hoyISO()}.csv`;
        a.click();
        toastCons(`📊 Pacientes de ${espAct} exportados a Excel CSV.`);
    };

    // =====================================================================
    // 7. TAB 3: OBRAS SOCIALES Y TARIFAS PROPIAS DE CADA DISCIPLINA
    // =====================================================================
    function renderTabMutuales(cont, ctx) {
        const { espAct, mutualesEsp } = ctx;
        cont.innerHTML = `
            <div class="cons-card">
                <div class="cons-card-head">
                    <div>
                        <h3>🏥 Obras Sociales y Aranceles de ${escH(espAct)}</h3>
                        <small style="color:var(--ink-500); font-size:0.74rem;">Valores exclusivos de ${escH(espAct)} (no afectan a las otras disciplinas)</small>
                    </div>
                    <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalMutualConsultorio()">+ Nueva Obra Social</button>
                </div>

                <div class="cons-mut-grid">
                    ${mutualesEsp.map(m => `
                        <div class="cons-mut-card">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.4rem;">
                                <strong style="font-size:0.94rem;">${escH(m.nombre)}</strong>
                                <span class="badge ${m.requiereToken ? "badge-purple" : "badge-ok"}">${m.requiereToken ? "🔑 Exige Token" : "Sin Token"}</span>
                            </div>
                            <div style="font-size:0.8rem; display:grid; grid-template-columns:1fr 1fr; gap:0.35rem; background:var(--surface-solid); padding:0.55rem; border-radius:10px; border:1px solid var(--line);">
                                <div><small style="display:block; color:var(--ink-500); font-size:0.66rem;">VALOR MUTUAL</small><b>$${Number(m.valorMutual || 0).toLocaleString("es-AR")}</b></div>
                                <div><small style="display:block; color:var(--ink-500); font-size:0.66rem;">COSEGURO</small><b>$${Number(m.coseguro || 0).toLocaleString("es-AR")}</b></div>
                                <div style="grid-column:1/-1; border-top:1px dashed var(--line); padding-top:4px;"><small style="color:var(--ink-500); font-size:0.66rem;">VALOR PARTICULAR APARTE: </small><b style="color:#0284c7;">$${Number(m.valorParticular || 0).toLocaleString("es-AR")}</b></div>
                            </div>
                            ${m.notas ? `<small style="color:var(--ink-500); font-size:0.73rem;">💡 ${escH(m.notas)}</small>` : ""}
                            <div style="display:flex; gap:0.4rem; margin-top:auto;">
                                <button type="button" class="btn btn-secondary btn-sm" style="flex:1;" onclick="abrirModalMutualConsultorio('${m.id}')">✏️ Editar Valores</button>
                                ${!m.esParticular ? `<button type="button" class="btn btn-danger btn-sm" onclick="eliminarMutualConsultorio('${m.id}')">🗑️</button>` : ""}
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>
        `;
    }

    window.abrirModalMutualConsultorio = function (mutId = null) {
        const db = obtenerDatosConsultorioCDM();
        const espAct = obtenerEspecialidadActivaResuelta();
        const m = mutId ? db.mutuales.find(x => x.id === mutId) : null;
        const modal = asegurarModalConsultorio();
        modal.innerHTML = `
            <div class="modal-window" style="max-width:520px;">
                <div class="modal-top">
                    <h3>🏥 ${m ? `Editar ${escH(m.nombre)} (${escH(espAct)})` : `Nueva Obra Social — ${escH(espAct)}`}</h3>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalConsultorioCDM()">✕</button>
                </div>
                <form onsubmit="guardarMutualConsultorio(event, ${m ? `'${m.id}'` : "null"}, '${espAct.replace(/'/g, "\\'")}')">
                    <div class="field" style="margin-bottom:0.65rem;"><label>Nombre de la Obra Social / Prepaga *</label><input type="text" id="cmNom" value="${escH(m?.nombre || "")}" required placeholder="Ej: OSDE, APROSS, PAMI..."></div>
                    <div class="grid-3" style="margin-bottom:0.65rem;">
                        <div class="field"><label>Valor Obra Social ($)</label><input type="number" id="cmValMut" value="${m?.valorMutual ?? 15000}"></div>
                        <div class="field"><label>Coseguro ($)</label><input type="number" id="cmCoseg" value="${m?.coseguro ?? 0}"></div>
                        <div class="field"><label>Valor Particular ($)</label><input type="number" id="cmValPart" value="${m?.valorParticular ?? 25000}"></div>
                    </div>
                    <label style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.65rem; font-size:0.83rem; font-weight:700; cursor:pointer;">
                        <input type="checkbox" id="cmToken" ${m ? (m.requiereToken ? "checked" : "") : "checked"} style="width:18px; height:18px; min-height:auto;">
                        Requiere cargar Token / N° de Orden para facturar
                    </label>
                    <div class="field" style="margin-bottom:0.8rem;"><label>Notas de Facturación</label><input type="text" id="cmNotas" value="${escH(m?.notas || "")}" placeholder="Ej: Presentar del 1 al 5"></div>
                    <button type="submit" class="btn btn-primary" style="width:100%;">💾 Guardar en ${escH(espAct)}</button>
                </form>
            </div>
        `;
        modal.classList.remove("hidden");
    };

    window.guardarMutualConsultorio = function (e, idEdit, espFija) {
        e.preventDefault();
        const db = obtenerDatosConsultorioCDM();
        const existente = idEdit ? db.mutuales.find(x => x.id === idEdit) : null;
        const obj = {
            ...(existente || {}),
            id: idEdit || (`mut_${Date.now()}_${normTxt(espFija)}`),
            especialidad: espFija,
            nombre: document.getElementById("cmNom").value.trim(),
            valorMutual: Number(document.getElementById("cmValMut").value) || 0,
            coseguro: Number(document.getElementById("cmCoseg").value) || 0,
            valorParticular: Number(document.getElementById("cmValPart").value) || 0,
            requiereToken: Boolean(document.getElementById("cmToken").checked),
            notas: document.getElementById("cmNotas").value.trim()
        };
        if (idEdit) {
            const i = db.mutuales.findIndex(x => x.id === idEdit);
            if (i >= 0) db.mutuales[i] = obj;
        } else db.mutuales.push(obj);
        guardarDatosConsultorioCDM(db);
        cerrarModalConsultorioCDM();
        toastCons(`🏥 Convenio guardado en ${espFija}: ${obj.nombre}`);
        renderizarConsultorioCompleto();
    };

    window.eliminarMutualConsultorio = function (mutId) {
        if (!confirm("🗑️ ¿Eliminar esta obra social?")) return;
        const db = obtenerDatosConsultorioCDM();
        db.mutuales = db.mutuales.filter(x => x.id !== mutId);
        guardarDatosConsultorioCDM(db);
        renderizarConsultorioCompleto();
    };

    // =====================================================================
    // 8. TAB 4: LOTE MENSUAL POR MUTUAL Y TOKENS (TABLA PC + LISTA MÓVIL)
    // =====================================================================
    function obtenerRegistrosLote(db, espAct) {
        return db.turnos.filter(t => {
            if (t.estado === "cancelado") return false;
            if (!mismaEsp(t.especialidad, espAct)) return false;
            if (!String(t.fecha || "").startsWith(estadoUI.loteMes)) return false;
            if (estadoUI.loteMutId !== "TODAS") {
                const m = buscarMutualPorId(db, t.mutualId, espAct);
                if (!m || m.id !== estadoUI.loteMutId) return false;
            }
            return true;
        }).sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
    }

    function renderTabLoteFacturacion(cont, ctx) {
        const { db, espAct, colorEsp, mutualesEsp } = ctx;
        const regs = obtenerRegistrosLote(db, espAct);
        const totMut = regs.reduce((a, t) => a + (Number(t.valorMutual) || 0), 0);
        const totCos = regs.reduce((a, t) => a + (Number(t.coseguro) || 0), 0);
        const totPart = regs.reduce((a, t) => a + (Number(t.valorParticular) || 0), 0);
        const sinToken = regs.filter(t => {
            const m = buscarMutualPorId(db, t.mutualId, espAct);
            return m?.requiereToken && !t.token;
        }).length;

        cont.innerHTML = `
            <div class="cons-card">
                <div class="cons-card-head">
                    <h3>📊 Lote Mensual y Tokens — ${escH(espAct)}</h3>
                    <div class="cons-pac-tools">
                        <input type="month" value="${estadoUI.loteMes}" style="width:auto; min-height:36px;" onchange="estadoUI_LoteMesCons(this.value)">
                        <select style="width:auto; min-height:36px;" onchange="estadoUI_LoteMutCons(this.value)">
                            <option value="TODAS">Todas las Obras Sociales</option>
                            ${mutualesEsp.map(m => `<option value="${m.id}" ${estadoUI.loteMutId === m.id ? "selected" : ""}>${escH(m.nombre)}</option>`).join("")}
                        </select>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="exportarLoteMutualCSVCons()">📊 CSV</button>
                        <button type="button" class="btn btn-primary btn-sm" onclick="imprimirLoteMutualPDFCons()">🖨️ PDF A4</button>
                    </div>
                </div>

                <div class="cons-kpi-grid">
                    <div class="cons-kpi"><small>Sesiones (${escH(espAct)})</small><strong>${regs.length}</strong></div>
                    <div class="cons-kpi" style="border-top-color:#6366f1;"><small>A Facturar Mutual</small><strong>$${totMut.toLocaleString("es-AR")}</strong></div>
                    <div class="cons-kpi" style="border-top-color:#10b981;"><small>Coseguro + Particular</small><strong>$${(totCos + totPart).toLocaleString("es-AR")}</strong></div>
                    <div class="cons-kpi" style="border-top-color:${sinToken ? "#ef4444" : "#10b981"};"><small>Faltan Tokens</small><strong>${sinToken}</strong></div>
                </div>

                <!-- VISTA PC: TABLA COMPLETA -->
                <div class="table-wrap cons-lote-desktop-table">
                    <table class="app-table" style="font-size:0.8rem;">
                        <thead><tr><th>Fecha</th><th>Paciente / Afiliado</th><th>Obra Social</th><th>🔑 Token / Orden</th><th>Mutual ($)</th><th>Consultorio ($)</th></tr></thead>
                        <tbody>
                            ${regs.length === 0 ? `<tr><td colspan="6"><div class="empty-box" style="padding:1rem;">Sin prestaciones de <b>${escH(espAct)}</b> para ${estadoUI.loteMes}.</div></td></tr>` :
                            regs.map(t => {
                                const pac = db.pacientes.find(p => Number(p.id) === Number(t.pacienteId));
                                const mut = buscarMutualPorId(db, t.mutualId, espAct);
                                const faltaTok = mut?.requiereToken && !t.token;
                                return `
                                    <tr>
                                        <td><b>${t.fecha}</b><br><small>${t.hora}</small></td>
                                        <td><strong>${escH(t.pacienteNombre)}</strong><br><small>DNI ${escH(pac?.dni || "-")} • Afil: ${escH(pac?.nroAfiliado || "-")}</small></td>
                                        <td>${escH(mut?.nombre || t.mutualNombre)}</td>
                                        <td><input type="text" value="${escH(t.token || "")}" placeholder="Cargar token..." style="width:125px; min-height:30px; font-size:0.76rem; ${faltaTok ? "border-color:#ef4444;" : ""}" onchange="actualizarTokenRapidoTurno(${t.id}, this.value)"></td>
                                        <td><b>$${Number(t.valorMutual || 0).toLocaleString("es-AR")}</b></td>
                                        <td><b>$${(Number(t.coseguro || 0) + Number(t.valorParticular || 0)).toLocaleString("es-AR")}</b></td>
                                    </tr>
                                `;
                            }).join("")}
                        </tbody>
                    </table>
                </div>

                <!-- VISTA MÓVIL: LISTA COMPACTA CON CARGA RÁPIDA DE TOKEN -->
                <div class="cons-lote-mobile-list">
                    ${regs.length === 0 ? `<div class="empty-box" style="padding:1rem; font-size:0.8rem;">Sin prestaciones en ${estadoUI.loteMes}.</div>` :
                    regs.map(t => {
                        const mut = buscarMutualPorId(db, t.mutualId, espAct);
                        const mutCorta = (mut?.nombre || t.mutualNombre || "Particular").replace(/\s*\(Sin Obra Social\)/i, "");
                        const faltaTok = mut?.requiereToken && !t.token;
                        const totCons = (Number(t.coseguro || 0) + Number(t.valorParticular || 0));
                        return `
                            <div class="cons-lote-row-mob" style="border-left-color:${faltaTok ? "#ef4444" : colorEsp};">
                                <div class="cons-lote-row-top">
                                    <strong>${escH(t.pacienteNombre)}</strong>
                                    <span class="badge badge-celeste" style="font-size:0.64rem;">${escH(mutCorta)}</span>
                                </div>
                                <div class="cons-lote-row-bot">
                                    <small style="color:var(--ink-500);">
                                        ${t.fecha.slice(5)} ${t.hora} • Mut: <b>$${Number(t.valorMutual || 0).toLocaleString("es-AR")}</b> • Cons: <b>$${totCons.toLocaleString("es-AR")}</b>
                                    </small>
                                    <input type="text" value="${escH(t.token || "")}" placeholder="🔑 Token..."
                                        style="width:118px; min-height:28px; font-size:0.74rem; padding:2px 7px; ${faltaTok ? "border-color:#ef4444;" : ""}"
                                        onchange="actualizarTokenRapidoTurno(${t.id}, this.value)">
                                </div>
                            </div>
                        `;
                    }).join("")}
                </div>
            </div>
        `;
    }

    window.estadoUI_LoteMesCons = function (v) { estadoUI.loteMes = v; renderizarConsultorioCompleto(); };
    window.estadoUI_LoteMutCons = function (v) { estadoUI.loteMutId = v; renderizarConsultorioCompleto(); };

    window.actualizarTokenRapidoTurno = function (idTurno, val) {
        const db = obtenerDatosConsultorioCDM();
        const t = db.turnos.find(x => Number(x.id) === Number(idTurno));
        if (!t) return;
        t.token = String(val || "").trim();
        guardarDatosConsultorioCDM(db);
        toastCons("🔑 Token actualizado.");
        renderizarConsultorioCompleto();
    };

    window.exportarLoteMutualCSVCons = function () {
        const db = obtenerDatosConsultorioCDM();
        const espAct = obtenerEspecialidadActivaResuelta();
        const regs = obtenerRegistrosLote(db, espAct);
        if (!regs.length) return alert(`Sin registros en ${espAct} para ${estadoUI.loteMes}.`);
        const esc = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
        let csv = ["Fecha", "Hora", "Paciente", "DNI", "Nro Afiliado", "Especialidad", "Obra Social", "Token/Orden", "Valor Mutual", "Coseguro", "Valor Particular"].map(esc).join(";") + "\n";
        regs.forEach(t => {
            const p = db.pacientes.find(x => Number(x.id) === Number(t.pacienteId));
            csv += [t.fecha, t.hora, t.pacienteNombre, p?.dni || "", p?.nroAfiliado || "", t.especialidad, t.mutualNombre, t.token, t.valorMutual, t.coseguro, t.valorParticular].map(esc).join(";") + "\n";
        });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
        a.download = `lote_${normTxt(espAct)}_${estadoUI.loteMes}.csv`;
        a.click();
        toastCons("📊 Lote descargado en Excel CSV.");
    };

    window.imprimirLoteMutualPDFCons = function () {
        const db = obtenerDatosConsultorioCDM();
        const espAct = obtenerEspecialidadActivaResuelta();
        const regs = obtenerRegistrosLote(db, espAct);
        if (!regs.length) return alert("Sin registros en el lote actual.");
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : { nombreEntidad: "Consultorio" };
        const mutSel = estadoUI.loteMutId === "TODAS" ? "Todas las Obras Sociales" : (db.mutuales.find(m => m.id === estadoUI.loteMutId)?.nombre || "");
        const totMut = regs.reduce((a, t) => a + (Number(t.valorMutual) || 0), 0);
        const totCos = regs.reduce((a, t) => a + (Number(t.coseguro) || 0) + (Number(t.valorParticular) || 0), 0);

        imprimirHojaA4Consultorio(`
            <div style="display:flex; justify-content:space-between; border-bottom:2.5px solid #0284c7; padding-bottom:0.7rem; margin-bottom:0.9rem;">
                <div>
                    <div style="font-size:0.7rem; font-weight:800; color:#0284c7;">LOTE MENSUAL — ${escH(espAct.toUpperCase())}</div>
                    <h2 style="margin:2px 0; font-size:1.3rem;">${escH(lic.nombreEntidad)}</h2>
                    <small>Período: <b>${estadoUI.loteMes}</b> • Convenio: <b>${escH(mutSel)}</b></small>
                </div>
                <div style="text-align:right; font-size:0.8rem;">
                    <div><b>Prestaciones:</b> ${regs.length}</div>
                    <div><b>Total Mutual:</b> $${totMut.toLocaleString("es-AR")}</div>
                    <div><b>Coseg./Part.:</b> $${totCos.toLocaleString("es-AR")}</div>
                </div>
            </div>
            <table>
                <thead><tr><th>Fecha</th><th>Paciente</th><th>DNI / Afiliado</th><th>Obra Social</th><th>Token / Orden</th><th>Mutual ($)</th><th>Consultorio ($)</th></tr></thead>
                <tbody>
                    ${regs.map(t => {
                        const p = db.pacientes.find(x => Number(x.id) === Number(t.pacienteId));
                        return `<tr><td>${t.fecha}</td><td><b>${escH(t.pacienteNombre)}</b></td><td>${escH(p?.dni || "-")} / ${escH(p?.nroAfiliado || "-")}</td><td>${escH(t.mutualNombre)}</td><td><b>${escH(t.token || "-")}</b></td><td>$${Number(t.valorMutual || 0).toLocaleString("es-AR")}</td><td>$${(Number(t.coseguro || 0) + Number(t.valorParticular || 0)).toLocaleString("es-AR")}</td></tr>`;
                    }).join("")}
                </tbody>
            </table>
        `);
    };

    // =====================================================================
    // 9. TAB 5: EQUIPO DE PROFESIONALES (FILTRADO POR DISCIPLINA)
    // =====================================================================
    function renderTabProfesionales(cont, ctx) {
        const { espAct, profsEsp, turnosEsp } = ctx;
        const mesActual = new Date().toISOString().slice(0, 7);
        cont.innerHTML = `
            <div class="cons-card">
                <div class="cons-card-head">
                    <h3>👨‍⚕️ Profesionales de ${escH(espAct)} (${mesActual})</h3>
                    <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalProfesionalCons()">+ Agregar Profesional</button>
                </div>
                ${profsEsp.length === 0 ? `<div class="empty-box" style="padding:1.2rem;">Sin profesionales adicionales en <b>${escH(espAct)}</b>.</div>` : `
                    <div class="cons-mut-grid">
                        ${profsEsp.map(pr => {
                            const susTurnos = turnosEsp.filter(t => t.profesional === pr.nombre && t.estado !== "cancelado" && String(t.fecha).startsWith(mesActual));
                            const bruto = susTurnos.reduce((a, t) => a + (Number(t.valorMutual) || 0) + (Number(t.coseguro) || 0) + (Number(t.valorParticular) || 0), 0);
                            const comision = Math.round(bruto * ((Number(pr.comisionPct) || 70) / 100));
                            return `
                                <div class="cons-mut-card">
                                    <strong>${escH(pr.nombre)}</strong>
                                    <small style="color:var(--ink-500);">${escH(pr.especialidad)} • Matrícula: ${escH(pr.matricula || "-")}</small>
                                    <div style="font-size:0.8rem; background:var(--surface-solid); padding:0.5rem; border-radius:10px; border:1px solid var(--line);">
                                        Turnos mes: <b>${susTurnos.length}</b> • Producción: <b>$${bruto.toLocaleString("es-AR")}</b><br>
                                        Liquidar (${pr.comisionPct}%): <b style="color:#059669;">$${comision.toLocaleString("es-AR")}</b>
                                    </div>
                                    <button type="button" class="btn btn-danger btn-sm" onclick="eliminarProfesionalCons(${pr.id})">🗑️ Quitar</button>
                                </div>
                            `;
                        }).join("")}
                    </div>
                `}
            </div>
        `;
    }

    window.abrirModalProfesionalCons = function () {
        const espAct = obtenerEspecialidadActivaResuelta();
        const modal = asegurarModalConsultorio();
        modal.innerHTML = `
            <div class="modal-window" style="max-width:480px;">
                <div class="modal-top"><h3>👨‍⚕️ Nuevo Profesional — ${escH(espAct)}</h3><button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalConsultorioCDM()">✕</button></div>
                <form onsubmit="guardarProfesionalCons(event, '${espAct.replace(/'/g, "\\'")}')">
                    <div class="field" style="margin-bottom:0.65rem;"><label>Nombre y Apellido *</label><input type="text" id="cprNom" required placeholder="Ej: Lic. Alina Caudana"></div>
                    <div class="grid-2" style="margin-bottom:0.65rem;">
                        <div class="field"><label>Especialidad</label><input type="text" value="${escH(espAct)}" disabled></div>
                        <div class="field"><label>Matrícula (MP)</label><input type="text" id="cprMat" placeholder="Ej: MP 4521"></div>
                    </div>
                    <div class="field" style="margin-bottom:0.8rem;"><label>% Honorarios del Profesional</label><input type="number" id="cprCom" min="1" max="100" value="70"></div>
                    <button type="submit" class="btn btn-primary" style="width:100%;">💾 Guardar en ${escH(espAct)}</button>
                </form>
            </div>
        `;
        modal.classList.remove("hidden");
    };

    window.guardarProfesionalCons = function (e, espFija) {
        e.preventDefault();
        const db = obtenerDatosConsultorioCDM();
        db.profesionales.push({
            id: Date.now(),
            nombre: document.getElementById("cprNom").value.trim(),
            especialidad: espFija,
            matricula: document.getElementById("cprMat").value.trim(),
            comisionPct: Number(document.getElementById("cprCom").value) || 70
        });
        guardarDatosConsultorioCDM(db);
        cerrarModalConsultorioCDM();
        renderizarConsultorioCompleto();
    };

    window.eliminarProfesionalCons = function (id) {
        if (!confirm("🗑️ ¿Quitar este profesional?")) return;
        const db = obtenerDatosConsultorioCDM();
        db.profesionales = db.profesionales.filter(x => Number(x.id) !== Number(id));
        guardarDatosConsultorioCDM(db);
        renderizarConsultorioCompleto();
    };

    // =====================================================================
    // 10. PUENTE A HISTORIA CLÍNICA (JS/CONSULTORIO-CLINICA.JS)
    // =====================================================================
    window.abrirHistoriaClinicaPacienteCDM = function (idPac) {
        if (typeof window.abrirSuiteClinicaPacientePro === "function") {
            return window.abrirSuiteClinicaPacientePro(idPac);
        }
        toastCons("⚠️ Asegurate de cargar js/consultorio-clinica.js en index.html.");
    };

    // =====================================================================
    // 11. INTEGRACIÓN CON SIDEBAR Y BARRA MÓVIL
    // =====================================================================
    function sincronizarMenuYBaseDeDatosConsultorio() {
        window.irAProfesionConsultorioNav = function (claveEsp) {
            if (typeof cerrarBottomSheetNav === "function") cerrarBottomSheetNav();
            if (typeof alternarSidebarMovil === "function") alternarSidebarMovil(true);
            document.getElementById("cdmSeccionBaseGeneral37")?.classList.add("hidden");
            document.getElementById("cdmSeccionContabilidadGlobal")?.classList.add("hidden");
            if (document.querySelector(".sports-showcase-grid")) {
                abrirEspecialidadDesdeInicioCDM(claveEsp);
            } else {
                window.location.href = "index.html";
            }
        };

        const soloCons = typeof esComercioSoloConsultorio === "function" && esComercioSoloConsultorio(obtenerLicenciaConfigCDM());
        if (!soloCons) return;

        const btnAlta = document.querySelector('.app-topbar button[onclick*="abrirModalPersona"], #btnAltaTopbarCDM');
        if (btnAlta) {
            btnAlta.onclick = (e) => { e.preventDefault(); abrirModalPacienteConsultorio(); };
        }

        document.querySelectorAll('[data-nav="base_general"], [onclick*="abrirModuloBaseGeneral"]').forEach(el => {
            el.style.display = "none";
        });

        if (document.querySelector(".sports-showcase-grid")) {
            document.querySelectorAll('[data-nav="index"], #cdmBottomNav38 a[href="index.html"]').forEach(link => {
                if (link.dataset.consHomeBound) return;
                link.dataset.consHomeBound = "1";
                link.addEventListener("click", (e) => {
                    e.preventDefault();
                    volverAlInicioDesdeConsultorio();
                });
            });
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(sincronizarMenuYBaseDeDatosConsultorio, 250);
        setTimeout(sincronizarMenuYBaseDeDatosConsultorio, 750);
        setTimeout(sincronizarMenuYBaseDeDatosConsultorio, 1400);
    });
})();
// =========================================================================
// 12. PSICOLOGÍA INTERACTIVA LIMPIA:
//     - BOTÓN "▶ INICIAR SESIÓN" EN PRÓXIMOS PACIENTES (AL LADO DEL CALENDARIO)
//     - ANOTACIONES A ANCHO COMPLETO (100%) SIN COLUMNAS LATERALES
//     - GOTA FLOTANTE DE TIEMPO (💧 45:00) + BOTÓN "🌳 ÁRBOL FAMILIAR" ARRIBA DE LAS NOTAS
//     Reemplazar por completo el Bloque 12 anterior al final de js/consultorio.js
// =========================================================================

(function () {
    const ETIQUETAS_PSICO_VIVO = [
        "Vínculos / Familia",
        "Ansiedad / Estrés",
        "Estado de ánimo",
        "Trabajo / Estudio",
        "Límites / Autoestima",
        "Avance clínico",
        "Momento de crisis",
        "Consigna / Tarea"
    ];

    const DURACIONES_PRESET = [30, 45, 50, 60, 90];

    const RAMAS_ARBOL_FAMILIAR = [
        { clave: "Materna", icono: "🟣", label: "Rama Materna" },
        { clave: "Paterna", icono: "🔵", label: "Rama Paterna" },
        { clave: "Nucleo", icono: "🟢", label: "Núcleo Actual / Pareja e Hijos" },
        { clave: "Red", icono: "🟠", label: "Red de Apoyo / Otros" }
    ];

    const PARENTESCOS_BASE = [
        "Madre", "Padre", "Hermano/a", "Pareja", "Ex-pareja",
        "Hijo/a", "Abuela", "Abuelo", "Tío/a", "Primo/a",
        "Padrastro / Madrastra", "Amigo/a cercano", "Referente / Otro"
    ];

    const TIPOS_VINCULO = [
        { clave: "cercano", label: "🟢 Cercano / Sano", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
        { clave: "distante", label: "🟡 Distante", color: "#d97706", bg: "rgba(245,158,11,0.14)" },
        { clave: "conflictivo", label: "🔴 Conflictivo / Tenso", color: "#e11d48", bg: "rgba(225,29,72,0.12)" },
        { clave: "dependiente", label: "🟣 Fusión / Dependiente", color: "#7c3aed", bg: "rgba(124,58,237,0.12)" },
        { clave: "duelo", label: "⚫ Fallecido / Duelo", color: "#475569", bg: "rgba(71,85,105,0.16)" }
    ];

    let tabSesionVivoActiva = false;
    let intervaloTick = null;
    let gotaAbierta12 = false;
    let verResumenAnterior12 = false;

    const estadoVivo = {
        pacienteId: null,
        turnoId: null,
        duracionMin: 45,
        modo: "regresivo",
        corriendo: false,
        iniciada: false,
        startedAtMs: null,
        accumulatedMs: 0,
        horaInicioStr: "",
        sonidoFin: false,
        avisoFinEmitido: false,
        notas: "",
        retomarProxima: "",
        animo: 6,
        ansiedad: 5,
        etiquetas: [],
        marcarTurnoAtendido: true,
        tokenTurno: ""
    };

    function normTxt12(s) {
        return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    }

    function esc12(s) {
        return String(s ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function hoyISO12() {
        return typeof obtenerHoyISO === "function" ? obtenerHoyISO() : new Date().toISOString().split("T")[0];
    }

    function toast12(msg) {
        if (typeof mostrarToast === "function") mostrarToast(msg);
    }

    function generarCodigoPac12(pacientes) {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let b = "";
        for (let i = 0; i < 4; i++) b += chars[Math.floor(Math.random() * chars.length)];
        const cod = `PAC-${b}`;
        return (pacientes || []).some(p => p.codigoAcceso === cod) ? generarCodigoPac12(pacientes) : cod;
    }

    function obtenerEspActiva12() {
        const profs = typeof obtenerEspecialidadesHabilitadasConsultorioCDM === "function"
            ? obtenerEspecialidadesHabilitadasConsultorioCDM()
            : [];
        const act = window.especialidadFiltroConsultorioCDM;
        if (act && act !== "TODAS" && profs.some(pr => normTxt12(pr.clave) === normTxt12(act))) {
            return profs.find(pr => normTxt12(pr.clave) === normTxt12(act)).clave;
        }
        return profs[0]?.clave || "Consultorio";
    }

    function esAreaPsicologia12(espOpt = null) {
        if (typeof obtenerPerfilEspecialidadCDM !== "function") return false;
        return obtenerPerfilEspecialidadCDM(espOpt || obtenerEspActiva12()) === "psicologia";
    }

    function estaConsultorioVisible12() {
        const sec = document.getElementById("cdmSeccionConsultorioGlobal");
        return Boolean(sec && !sec.classList.contains("hidden"));
    }

    function claveBorradorStorage12() {
        const club = typeof obtenerClaveClubActivoCDM === "function" ? obtenerClaveClubActivoCDM() : "cdm_adelia_maria_principal";
        return `cdm_psico_sesion_viva_draft_v1_${club}`;
    }

    function guardarBorradorVivo12() {
        try { localStorage.setItem(claveBorradorStorage12(), JSON.stringify(estadoVivo)); } catch {}
    }

    function cargarBorradorVivo12() {
        try {
            const raw = JSON.parse(localStorage.getItem(claveBorradorStorage12()) || "null");
            if (raw && typeof raw === "object") {
                Object.assign(estadoVivo, raw);
                if (estadoVivo.corriendo) iniciarLoopReloj12();
            }
        } catch {}
    }

    function limpiarBorradorVivo12() {
        try { localStorage.removeItem(claveBorradorStorage12()); } catch {}
    }

    function obtenerMsTranscurridos12() {
        const base = Number(estadoVivo.accumulatedMs) || 0;
        if (estadoVivo.corriendo && estadoVivo.startedAtMs) {
            return Math.max(0, base + (Date.now() - estadoVivo.startedAtMs));
        }
        return Math.max(0, base);
    }

    function formatearMMSS12(totalSegs) {
        const neg = totalSegs < 0;
        const abs = Math.abs(Math.floor(totalSegs));
        const h = Math.floor(abs / 3600);
        const m = Math.floor((abs % 3600) / 60);
        const s = abs % 60;
        const base = h > 0
            ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
            : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        return neg ? `+${base}` : base;
    }

    function calcularEstadoReloj12() {
        const transSeg = Math.floor(obtenerMsTranscurridos12() / 1000);
        const totalObjSeg = Math.max(60, (Number(estadoVivo.duracionMin) || 45) * 60);
        const restantesSeg = totalObjSeg - transSeg;
        const pct = Math.min(100, Math.round((transSeg / totalObjSeg) * 100));

        const display = estadoVivo.modo === "progresivo"
            ? formatearMMSS12(transSeg)
            : formatearMMSS12(restantesSeg);

        let fase = "idle";
        if (estadoVivo.iniciada || transSeg > 0) {
            if (estadoVivo.modo === "regresivo") {
                if (restantesSeg <= 0) fase = "over";
                else if (restantesSeg <= 300) fase = "warn";
                else fase = "ok";
            } else {
                if (transSeg >= totalObjSeg) fase = "over";
                else if (totalObjSeg - transSeg <= 300) fase = "warn";
                else fase = "ok";
            }
        }
        return { transSeg, totalObjSeg, restantesSeg, pct, display, fase };
    }

    function emitirTonoSuavePsico12() {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            const ctx = new Ctx();
            [440, 554.37].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.25);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.25 + 0.55);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + i * 0.25);
                osc.stop(ctx.currentTime + i * 0.25 + 0.6);
            });
        } catch {}
    }

    function iniciarLoopReloj12() {
        if (intervaloTick) clearInterval(intervaloTick);
        intervaloTick = setInterval(() => {
            if (!estadoVivo.corriendo) {
                clearInterval(intervaloTick);
                intervaloTick = null;
                return;
            }
            actualizarSoloDOMReloj12();
        }, 1000);
    }

    function construirResumenArbol12(arbol) {
        if (!Array.isArray(arbol) || !arbol.length) return "";
        return arbol.map(n => `${n.parentesco} ${n.nombre} (${n.rama}/${n.vinculo})`).join(" • ");
    }

    function infoVinculo12(clave) {
        return TIPOS_VINCULO.find(v => v.clave === clave) || TIPOS_VINCULO[0];
    }

    // =====================================================================
    // 1. ESTILOS: ANOTACIONES FULL-WIDTH + GOTA FLOTANTE + MODAL ÁRBOL
    // =====================================================================
    function inyectarCSSSesionVivo12() {
        if (document.getElementById("cdmCssPsicoSesionVivo12")) return;
        const st = document.createElement("style");
        st.id = "cdmCssPsicoSesionVivo12";
        st.textContent = `
            .psv-full-wrap {
                display: flex;
                flex-direction: column;
                gap: 0.85rem;
                width: 100%;
            }
            .psv-topbar-slim {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 0.6rem;
                flex-wrap: wrap;
                padding-bottom: 0.75rem;
                border-bottom: 1px solid var(--line, #e2e8f0);
                margin-bottom: 0.75rem;
            }
            .psv-pac-picker-group {
                display: flex;
                align-items: center;
                gap: 0.45rem;
                flex-wrap: wrap;
                flex: 1;
                min-width: 240px;
            }
            .psv-pac-picker-group select {
                max-width: 340px;
                min-height: 36px;
                font-weight: 700;
            }
            .psv-tools-bar {
                display: flex;
                align-items: center;
                gap: 0.38rem;
                flex-wrap: wrap;
            }
            .psv-prev-drawer {
                background: rgba(124, 58, 237, 0.07);
                border: 1px solid rgba(124, 58, 237, 0.28);
                border-left: 4px solid #7c3aed;
                border-radius: 13px;
                padding: 0.72rem 0.9rem;
                margin-bottom: 0.75rem;
                font-size: 0.8rem;
                line-height: 1.48;
            }
            .psv-tags-wrap { display: flex; gap: 0.35rem; flex-wrap: wrap; margin-bottom: 0.7rem; }
            .psv-tag-chip {
                border: 1.5px solid var(--line-strong, #cbd5e1);
                background: var(--surface-subtle, #f8fafc);
                color: var(--ink-700, #334155);
                font-size: 0.72rem; font-weight: 700;
                padding: 0.24rem 0.62rem; border-radius: 999px;
                cursor: pointer; transition: all 0.14s ease;
            }
            .psv-tag-chip.active { background: #7c3aed; border-color: #7c3aed; color: #ffffff; }
            .psv-notes-full {
                width: 100%;
                min-height: 340px;
                resize: vertical;
                line-height: 1.65;
                font-size: 0.93rem;
                padding: 0.9rem 1rem;
                border-radius: 14px;
            }
            .psv-bottom-controls {
                display: grid;
                grid-template-columns: 1fr 1fr 1.6fr;
                gap: 0.75rem;
                align-items: center;
                background: var(--surface-subtle, #f8fafc);
                border: 1px solid var(--line-strong, #cbd5e1);
                border-radius: 13px;
                padding: 0.7rem 0.85rem;
                margin-top: 0.75rem;
                margin-bottom: 0.75rem;
            }

            /* === GOTA FLOTANTE DE TIEMPO === */
            #cdmPsicoGotaSesion12 {
                position: fixed; bottom: 22px; right: 22px; z-index: 1150;
                display: flex; flex-direction: column; align-items: flex-end; gap: 0.6rem;
            }
            #cdmPsicoGotaSesion12.hidden { display: none !important; }
            .psv-gota-btn {
                min-width: 66px; height: 58px; padding: 0 1.1rem 0 0.95rem;
                border-radius: 30px 30px 6px 30px;
                background: linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%);
                color: #ffffff; border: 2px solid rgba(196, 181, 253, 0.75);
                box-shadow: 0 14px 32px rgba(76, 29, 149, 0.48);
                cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem;
                font-weight: 900; font-size: 1.02rem; font-variant-numeric: tabular-nums;
                transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.25s ease;
            }
            .psv-gota-btn:hover { transform: translateY(-3px) scale(1.03); }
            .psv-gota-btn[data-fase="ok"] { background: linear-gradient(135deg, #047857 0%, #10b981 100%); border-color: #a7f3d0; }
            .psv-gota-btn[data-fase="warn"] { background: linear-gradient(135deg, #b45309 0%, #f59e0b 100%); border-color: #fde68a; }
            .psv-gota-btn[data-fase="over"] { background: linear-gradient(135deg, #9f1239 0%, #f43f5e 100%); border-color: #fecdd3; }
            .psv-gota-dot { width: 9px; height: 9px; border-radius: 50%; background: #ffffff; flex-shrink: 0; }
            @keyframes psvBlink12 { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
            .psv-gota-btn.is-running .psv-gota-dot { animation: psvBlink12 1.2s infinite; }

            .psv-gota-popover {
                width: 305px; max-width: calc(100vw - 24px);
                background: linear-gradient(155deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%);
                color: #ffffff; border: 1.5px solid rgba(196, 181, 253, 0.45);
                border-radius: 22px; padding: 1rem 1.05rem;
                box-shadow: 0 24px 50px rgba(15, 23, 42, 0.65);
                display: flex; flex-direction: column; gap: 0.65rem;
            }
            .psv-gota-digits { font-size: 2.45rem; font-weight: 900; text-align: center; line-height: 1.05; font-variant-numeric: tabular-nums; }
            .psv-gota-digits[data-fase="ok"] { color: #6ee7b7; }
            .psv-gota-digits[data-fase="warn"] { color: #fde047; }
            .psv-gota-digits[data-fase="over"] { color: #fda4af; }
            .psv-progress-track { height: 7px; background: rgba(255,255,255,0.16); border-radius: 999px; overflow: hidden; }
            .psv-progress-fill { height: 100%; background: linear-gradient(90deg, #38bdf8, #34d399); border-radius: 999px; transition: width 0.35s ease; }
            .psv-progress-fill[data-fase="warn"] { background: linear-gradient(90deg, #f59e0b, #fde047); }
            .psv-progress-fill[data-fase="over"] { background: linear-gradient(90deg, #f43f5e, #fb7185); }
            .psv-preset-row { display: flex; gap: 0.3rem; flex-wrap: wrap; align-items: center; }
            .psv-preset-btn {
                border: 1px solid rgba(255,255,255,0.25); background: rgba(255,255,255,0.1);
                color: #f8fafc; font-size: 0.72rem; font-weight: 700;
                padding: 0.26rem 0.55rem; border-radius: 8px; cursor: pointer;
            }
            .psv-preset-btn:hover, .psv-preset-btn.active { background: #ffffff; color: #312e81; border-color: #ffffff; }
            .psv-custom-min {
                width: 60px !important; min-height: 27px !important; padding: 0.12rem 0.35rem !important;
                font-size: 0.73rem !important; font-weight: 800 !important; text-align: center;
                background: rgba(255,255,255,0.14) !important; color: #ffffff !important;
                border: 1px solid rgba(255,255,255,0.3) !important; border-radius: 8px !important;
            }

            /* === MODAL ÁRBOL FAMILIAR === */
            .psv-tree-branch {
                background: var(--surface-subtle, #f8fafc);
                border: 1px solid var(--line, #e2e8f0);
                border-radius: 13px; padding: 0.55rem 0.7rem; margin-bottom: 0.45rem;
            }
            .psv-tree-branch-title {
                font-size: 0.69rem; font-weight: 800; text-transform: uppercase;
                color: var(--ink-500, #64748b); letter-spacing: 0.03em; margin-bottom: 0.35rem;
            }
            .psv-tree-node {
                display: flex; justify-content: space-between; align-items: center; gap: 0.45rem;
                background: var(--surface-solid, #ffffff);
                border: 1px solid var(--line, #e2e8f0); border-left: 4px solid #7c3aed;
                border-radius: 10px; padding: 0.45rem 0.65rem; margin-bottom: 0.35rem; font-size: 0.78rem;
            }
            .psv-tree-node:last-child { margin-bottom: 0; }
            .psv-tree-add-box {
                background: rgba(124, 58, 237, 0.06);
                border: 1.5px dashed rgba(124, 58, 237, 0.35);
                border-radius: 13px; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem;
            }

            @media (max-width: 900px) {
                .psv-bottom-controls { grid-template-columns: 1fr; }
                .psv-notes-full { min-height: 240px; }
            }
            @media (max-width: 860px) {
                #cdmPsicoGotaSesion12 { bottom: 80px; right: 14px; }
                .psv-gota-btn { height: 52px; font-size: 0.94rem; padding: 0 0.9rem; }
            }
        `;
        document.head.appendChild(st);
    }

    // =====================================================================
    // 2. GOTA FLOTANTE DE TIEMPO
    // =====================================================================
    function debeMostrarseGotaPsico12() {
        if (estadoVivo.corriendo) return true;
        return estaConsultorioVisible12() && esAreaPsicologia12();
    }

    function asegurarGotaFlotantePsico12() {
        inyectarCSSSesionVivo12();
        let wrap = document.getElementById("cdmPsicoGotaSesion12");
        if (!debeMostrarseGotaPsico12()) {
            wrap?.classList.add("hidden");
            return;
        }
        if (!wrap) {
            wrap = document.createElement("div");
            wrap.id = "cdmPsicoGotaSesion12";
            document.body.appendChild(wrap);
        }
        wrap.classList.remove("hidden");
        renderizarGotaFlotantePsico12();
    }

    function actualizarSoloDOMReloj12() {
        const c = calcularEstadoReloj12();
        if (estadoVivo.corriendo && c.fase === "over" && !estadoVivo.avisoFinEmitido) {
            estadoVivo.avisoFinEmitido = true;
            guardarBorradorVivo12();
            if (estadoVivo.sonidoFin) emitirTonoSuavePsico12();
            toast12("⏱️ Tiempo estipulado de sesión cumplido.");
        }

        const btnGota = document.getElementById("psvGotaBtn12");
        if (btnGota) {
            btnGota.dataset.fase = c.fase;
            btnGota.classList.toggle("is-running", estadoVivo.corriendo);
        }
        const lblGota = document.getElementById("psvGotaTimeLbl12");
        if (lblGota) lblGota.textContent = c.display;

        const dig = document.getElementById("psicoRelojDigitos12");
        if (dig) { dig.textContent = c.display; dig.dataset.fase = c.fase; }

        const bar = document.getElementById("psicoRelojBarra12");
        if (bar) { bar.style.width = `${c.pct}%`; bar.dataset.fase = c.fase; }

        const sub = document.getElementById("psicoRelojSub12");
        if (sub) {
            const transMin = Math.floor(c.transSeg / 60);
            if (!estadoVivo.iniciada && c.transSeg === 0) {
                sub.textContent = `Configurada en ${estadoVivo.duracionMin} min • Lista`;
            } else if (c.fase === "over") {
                sub.textContent = `Tiempo cumplido (${transMin} min • en extra)`;
            } else if (c.fase === "warn") {
                sub.textContent = `Últimos 5 min • ${transMin}/${estadoVivo.duracionMin} min`;
            } else {
                sub.textContent = `${estadoVivo.corriendo ? "En curso" : "Pausada"} • ${transMin}/${estadoVivo.duracionMin} min`;
            }
        }
    }

    function renderizarGotaFlotantePsico12() {
        const wrap = document.getElementById("cdmPsicoGotaSesion12");
        if (!wrap) return;
        const c = calcularEstadoReloj12();
        const db = obtenerDatosConsultorioCDM();
        const pac = estadoVivo.pacienteId
            ? (db.pacientes || []).find(p => Number(p.id) === Number(estadoVivo.pacienteId))
            : null;

        const popHTML = gotaAbierta12 ? `
            <div class="psv-gota-popover" onclick="event.stopPropagation();">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem;">
                    <span style="font-size:0.68rem; font-weight:800; color:#c4b5fd; text-transform:uppercase; letter-spacing:0.04em;">
                        💧⏱️ Sesión ${pac ? `• ${esc12(pac.nombre)}` : "Psicología"}
                    </span>
                    <div style="display:flex; gap:0.25rem; align-items:center;">
                        <button type="button" class="psv-preset-btn" onclick="psicoVivoToggleModoReloj()">
                            ${estadoVivo.modo === "regresivo" ? "⏳ Regresivo" : "⏱️ Progresivo"}
                        </button>
                        <button type="button" class="psv-preset-btn" onclick="psicoVivoToggleGota()">✕</button>
                    </div>
                </div>

                <div id="psicoRelojDigitos12" class="psv-gota-digits" data-fase="${c.fase}">${c.display}</div>
                <div class="psv-progress-track"><div id="psicoRelojBarra12" class="psv-progress-fill" data-fase="${c.fase}" style="width:${c.pct}%;"></div></div>
                <small id="psicoRelojSub12" style="text-align:center; color:#e0e7ff; font-size:0.71rem; display:block;"></small>

                <div class="psv-preset-row">
                    ${DURACIONES_PRESET.map(m => `
                        <button type="button" class="psv-preset-btn ${Number(estadoVivo.duracionMin) === m ? "active" : ""}" onclick="psicoVivoSetDuracion(${m})">${m}m</button>
                    `).join("")}
                    <input type="number" class="psv-custom-min" min="5" max="240" value="${estadoVivo.duracionMin}" title="Minutos personalizados" onchange="psicoVivoSetDuracion(this.value)">
                </div>

                <div style="display:flex; gap:0.4rem;">
                    <button type="button" class="btn btn-sm" style="flex:1; background:${estadoVivo.corriendo ? "#f59e0b" : "#10b981"}; color:#ffffff; border:none; font-weight:800;" onclick="psicoVivoIniciarOPausar()">
                        ${estadoVivo.corriendo ? "⏸ Pausar" : (estadoVivo.iniciada ? "▶ Reanudar" : "▶ Iniciar")}
                    </button>
                    <button type="button" class="psv-preset-btn" onclick="psicoVivoSumarMinutos(5)" title="Sumar 5 minutos">+5m</button>
                    <button type="button" class="psv-preset-btn" onclick="psicoVivoReiniciarReloj()" title="Reiniciar reloj">↺</button>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem; padding-top:0.35rem; border-top:1px solid rgba(255,255,255,0.14);">
                    <label style="display:inline-flex; align-items:center; gap:0.35rem; font-size:0.69rem; color:#e0e7ff; cursor:pointer;">
                        <input type="checkbox" style="width:14px; height:14px; min-height:auto; accent-color:#a78bfa;" ${estadoVivo.sonidoFin ? "checked" : ""} onchange="psicoVivoActualizarCampo('sonidoFin', this.checked)">
                        <span>🔔 Tono al fin</span>
                    </label>
                    ${!tabSesionVivoActiva ? `
                        <button type="button" class="psv-preset-btn active" onclick="abrirSesionEnVivoPsicoCDM()">✍️ Ir a Notas</button>
                    ` : `
                        <button type="button" class="psv-preset-btn" onclick="psicoVivoInsertarTimestamp()">⏱️ + Sello</button>
                    `}
                </div>
            </div>
        ` : "";

        wrap.innerHTML = `
            ${popHTML}
            <button type="button" id="psvGotaBtn12" class="psv-gota-btn ${estadoVivo.corriendo ? "is-running" : ""}" data-fase="${c.fase}"
                onclick="psicoVivoToggleGota()" title="Reloj flotante de sesión (tocá para abrir o minimizar)">
                <span class="psv-gota-dot"></span>
                <span>💧</span>
                <span id="psvGotaTimeLbl12">${c.display}</span>
            </button>
        `;
        actualizarSoloDOMReloj12();
    }

    window.psicoVivoToggleGota = function () {
        gotaAbierta12 = !gotaAbierta12;
        renderizarGotaFlotantePsico12();
    };

    // =====================================================================
    // 3. INICIAR SESIÓN DIRECTO DESDE LA TARJETA DE PRÓXIMOS PACIENTES
    //    (AUNQUE EL TURNO NO TENGA pacienteId VINCULADO TODAVÍA)
    // =====================================================================
    window.iniciarSesionDesdeTurnoPsico12 = function (turnoId) {
        const db = obtenerDatosConsultorioCDM();
        const t = (db.turnos || []).find(x => Number(x.id) === Number(turnoId));
        if (!t) {
            abrirSesionEnVivoPsicoCDM();
            return;
        }

        const esp = t.especialidad || obtenerEspActiva12();
        let pac = t.pacienteId
            ? (db.pacientes || []).find(p => Number(p.id) === Number(t.pacienteId))
            : null;

        // Si el turno se agendó escribiendo solo el nombre, buscar por nombre en Psicología o crear ficha automática
        if (!pac && t.pacienteNombre) {
            const nomBusq = normTxt12(t.pacienteNombre);
            pac = (db.pacientes || []).find(p =>
                normTxt12(p.especialidad) === normTxt12(esp) &&
                (normTxt12(`${p.nombre} ${p.apellido}`) === nomBusq || normTxt12(`${p.apellido} ${p.nombre}`) === nomBusq)
            ) || null;

            if (!pac) {
                const partes = String(t.pacienteNombre).trim().split(/\s+/);
                const nombre = partes[0] || "Paciente";
                const apellido = partes.slice(1).join(" ") || "-";
                pac = {
                    id: Date.now(),
                    codigoAcceso: generarCodigoPac12(db.pacientes),
                    especialidad: esp,
                    nombre,
                    apellido,
                    dni: "",
                    fechaNacimiento: "",
                    whatsapp: "",
                    mutualId: t.mutualId || "",
                    nroAfiliado: "",
                    modalidadAtencion: "Presencial",
                    motivoConsulta: t.motivo || "",
                    antecedentes: t.motivo || "",
                    arbolFamiliar: []
                };
                db.pacientes.push(pac);
                toast12(`👤 Ficha rápida vinculada para ${pac.nombre} ${pac.apellido}.`);
            }

            t.pacienteId = pac.id;
            guardarDatosConsultorioCDM(db);
        }

        abrirSesionEnVivoPsicoCDM(pac ? pac.id : null, t.id);
    };

    // =====================================================================
    // 4. MODAL FLOTANTE COMPACTO DE "🌳 ÁRBOL FAMILIAR" (ARRIBA DE LAS NOTAS)
    // =====================================================================
    function asegurarModalArbolPsico12() {
        let m = document.getElementById("modalArbolFamiliarPsico12");
        if (!m) {
            m = document.createElement("div");
            m.id = "modalArbolFamiliarPsico12";
            m.className = "modal-backdrop hidden";
            m.style.zIndex = "1360";
            m.onclick = (e) => { if (e.target === m) cerrarModalArbolPsico12(); };
            document.body.appendChild(m);
        }
        return m;
    }

    window.cerrarModalArbolPsico12 = function () {
        document.getElementById("modalArbolFamiliarPsico12")?.classList.add("hidden");
    };

    window.abrirModalArbolFamiliarEnVivo12 = function (idPacOpt = null) {
        const pid = Number(idPacOpt || estadoVivo.pacienteId);
        if (!pid) {
            toast12("⚠️ Elegí primero un paciente para abrir su Árbol Familiar.");
            return;
        }
        const db = obtenerDatosConsultorioCDM();
        const pac = (db.pacientes || []).find(p => Number(p.id) === pid);
        if (!pac) return;

        const arbol = Array.isArray(pac.arbolFamiliar) ? pac.arbolFamiliar : [];
        const modal = asegurarModalArbolPsico12();

        const ramasHTML = arbol.length === 0
            ? `<div class="empty-box" style="padding:1rem; font-size:0.8rem;">Todavía no cargaste familiares para <b>${esc12(pac.nombre)}</b>. Agregá el primero abajo.</div>`
            : RAMAS_ARBOL_FAMILIAR.map(rama => {
                const nodos = arbol.filter(n => (n.rama || "Nucleo") === rama.clave);
                if (!nodos.length) return "";
                return `
                    <div class="psv-tree-branch">
                        <div class="psv-tree-branch-title">${rama.icono} ${rama.label} (${nodos.length})</div>
                        ${nodos.map(n => {
                            const v = infoVinculo12(n.vinculo);
                            const citarTxt = `${n.parentesco} (${n.nombre} - ${rama.label}, vínculo ${n.vinculo}${n.nota ? `, ${n.nota}` : ""}): `.replace(/'/g, "\\'");
                            return `
                                <div class="psv-tree-node" style="border-left-color:${v.color};">
                                    <div style="min-width:0; flex:1;">
                                        <div style="display:flex; align-items:center; gap:0.35rem; flex-wrap:wrap;">
                                            <strong>${esc12(n.parentesco)}: ${esc12(n.nombre)}</strong>
                                            <span style="font-size:0.65rem; font-weight:800; padding:1px 6px; border-radius:999px; background:${v.bg}; color:${v.color};">${v.label}</span>
                                        </div>
                                        ${n.nota ? `<small style="display:block; color:var(--ink-500); margin-top:2px;">${esc12(n.nota)}</small>` : ""}
                                    </div>
                                    <div style="display:flex; gap:0.3rem; flex-shrink:0;">
                                        <button type="button" class="btn btn-secondary btn-sm" style="min-height:26px; font-size:0.7rem;" onclick="psicoVivoCitarFamiliarEnNota('${citarTxt}'); cerrarModalArbolPsico12();">📝 Citar</button>
                                        <button type="button" class="btn btn-danger btn-sm" style="min-height:26px; font-size:0.7rem;" onclick="psicoEliminarNodoArbolPaciente12(${pac.id}, '${n.id}')">✕</button>
                                    </div>
                                </div>
                            `;
                        }).join("")}
                    </div>
                `;
            }).join("");

        modal.innerHTML = `
            <div class="modal-window" style="max-width:620px;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-purple">🌳 ÁRBOL FAMILIAR (SE GUARDA EN LA FICHA)</span>
                        <h3 style="margin-top:4px;">${esc12(pac.nombre)} ${esc12(pac.apellido)} (${arbol.length} vínculo/s)</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalArbolPsico12()">✕</button>
                </div>

                <div style="max-height:300px; overflow-y:auto; margin-bottom:0.85rem;">${ramasHTML}</div>

                <div class="psv-tree-add-box">
                    <strong style="font-size:0.75rem; color:#5b21b6;">➕ Agregar familiar / rama nueva:</strong>
                    <div class="grid-2">
                        <div class="field"><label>Rama</label>
                            <select id="vivoArb_rama">${RAMAS_ARBOL_FAMILIAR.map(r => `<option value="${r.clave}">${r.icono} ${r.label}</option>`).join("")}</select>
                        </div>
                        <div class="field"><label>Parentesco</label>
                            <select id="vivoArb_par">${PARENTESCOS_BASE.map(p => `<option value="${p}">${p}</option>`).join("")}</select>
                        </div>
                    </div>
                    <div class="grid-2">
                        <div class="field"><label>Nombre *</label><input type="text" id="vivoArb_nom" placeholder="Ej: Marta / Carlos"></div>
                        <div class="field"><label>Tipo de Vínculo</label>
                            <select id="vivoArb_vinc">${TIPOS_VINCULO.map(v => `<option value="${v.clave}">${v.label}</option>`).join("")}</select>
                        </div>
                    </div>
                    <div style="display:flex; gap:0.45rem;">
                        <input type="text" id="vivoArb_nota" placeholder="Detalle clínico (ej: Convive, apoyo clave, conflicto...)" style="flex:1;">
                        <button type="button" class="btn btn-primary btn-sm" style="background:#7c3aed; border-color:#7c3aed;" onclick="psicoAgregarNodoArbolPaciente12(${pac.id})">💾 Guardar Rama</button>
                    </div>
                </div>
            </div>
        `;
        modal.classList.remove("hidden");
    };

    window.psicoAgregarNodoArbolPaciente12 = function (idPac) {
        const nombre = (document.getElementById("vivoArb_nom")?.value || "").trim();
        if (!nombre) {
            toast12("⚠️ Escribí el nombre del familiar o vínculo.");
            document.getElementById("vivoArb_nom")?.focus();
            return;
        }
        const db = obtenerDatosConsultorioCDM();
        const pac = (db.pacientes || []).find(p => Number(p.id) === Number(idPac));
        if (!pac) return;

        if (!Array.isArray(pac.arbolFamiliar)) pac.arbolFamiliar = [];
        const nodo = {
            id: `arb_${Date.now()}_${Math.floor(Math.random() * 999)}`,
            rama: document.getElementById("vivoArb_rama")?.value || "Nucleo",
            parentesco: document.getElementById("vivoArb_par")?.value || "Madre",
            nombre,
            vinculo: document.getElementById("vivoArb_vinc")?.value || "cercano",
            nota: (document.getElementById("vivoArb_nota")?.value || "").trim(),
            fechaRegistro: hoyISO12()
        };

        pac.arbolFamiliar.push(nodo);
        pac.genogramaResumen = construirResumenArbol12(pac.arbolFamiliar);
        guardarDatosConsultorioCDM(db);

        toast12(`🌳 ${nodo.parentesco} (${nodo.nombre}) guardado en la ficha de ${pac.nombre}.`);
        abrirModalArbolFamiliarEnVivo12(pac.id);
        renderizarConsultorioCompleto();
    };

    window.psicoEliminarNodoArbolPaciente12 = function (idPac, idNodo) {
        const db = obtenerDatosConsultorioCDM();
        const pac = (db.pacientes || []).find(p => Number(p.id) === Number(idPac));
        if (!pac || !Array.isArray(pac.arbolFamiliar)) return;
        pac.arbolFamiliar = pac.arbolFamiliar.filter(n => String(n.id) !== String(idNodo));
        pac.genogramaResumen = construirResumenArbol12(pac.arbolFamiliar);
        guardarDatosConsultorioCDM(db);
        abrirModalArbolFamiliarEnVivo12(pac.id);
        renderizarConsultorioCompleto();
    };

    window.psicoVivoCitarFamiliarEnNota = function (texto) {
        const ta = document.getElementById("psicoNotaVivo12");
        if (!ta) return;
        const ini = ta.selectionStart ?? ta.value.length;
        const fin = ta.selectionEnd ?? ta.value.length;
        const pref = ini > 0 && ta.value[ini - 1] !== "\n" ? "\n" : "";
        ta.value = ta.value.slice(0, ini) + pref + "🌳 " + texto + ta.value.slice(fin);
        estadoVivo.notas = ta.value;
        guardarBorradorVivo12();
        ta.focus();
    };

    // =====================================================================
    // 5. ACCIONES DE LA SESIÓN EN VIVO
    // =====================================================================
    window.abrirSesionEnVivoPsicoCDM = function (pacienteIdOpt = null, turnoIdOpt = null) {
        if (pacienteIdOpt && Number(estadoVivo.pacienteId) !== Number(pacienteIdOpt)) {
            const hayTrabajo = estadoVivo.corriendo || (estadoVivo.notas || "").trim().length > 10;
            if (hayTrabajo && !confirm("⚠️ Tenés una sesión o borrador abierto con otro paciente. ¿Cambiar igualmente de paciente?")) {
                tabSesionVivoActiva = true;
                renderizarConsultorioCompleto();
                return;
            }
            seleccionarPacienteEnSesionVivo12(pacienteIdOpt, turnoIdOpt, false);
        } else if (turnoIdOpt) {
            estadoVivo.turnoId = Number(turnoIdOpt);
        }

        tabSesionVivoActiva = true;
        renderizarConsultorioCompleto();
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    function seleccionarPacienteEnSesionVivo12(pacienteId, turnoIdOpt = null, reRender = true) {
        const db = obtenerDatosConsultorioCDM();
        const pid = pacienteId ? Number(pacienteId) : null;
        estadoVivo.pacienteId = pid;

        if (turnoIdOpt) {
            estadoVivo.turnoId = Number(turnoIdOpt);
            const tObj = (db.turnos || []).find(t => Number(t.id) === Number(turnoIdOpt));
            estadoVivo.tokenTurno = tObj?.token || "";
        } else if (pid) {
            const hoy = hoyISO12();
            const turnoHoy = (db.turnos || []).find(t =>
                Number(t.pacienteId) === pid && t.fecha === hoy && t.estado !== "cancelado"
            );
            estadoVivo.turnoId = turnoHoy ? Number(turnoHoy.id) : null;
            estadoVivo.tokenTurno = turnoHoy?.token || "";
        } else {
            estadoVivo.turnoId = null;
            estadoVivo.tokenTurno = "";
        }

        guardarBorradorVivo12();
        if (reRender) renderizarConsultorioCompleto();
    }

    window.psicoVivoSeleccionarPaciente = function (val, turnoIdOpt = null) {
        const pid = val ? Number(val) : null;
        if (pid !== estadoVivo.pacienteId && (estadoVivo.corriendo || (estadoVivo.notas || "").trim().length > 10)) {
            if (!confirm("⚠️ Cambiar de paciente mantendrá el borrador actual. ¿Continuar?")) {
                renderizarConsultorioCompleto();
                return;
            }
        }
        seleccionarPacienteEnSesionVivo12(pid, turnoIdOpt, true);
    };

    window.psicoVivoToggleResumenAnterior = function () {
        verResumenAnterior12 = !verResumenAnterior12;
        renderizarConsultorioCompleto();
    };

    window.psicoVivoSetDuracion = function (mins) {
        const m = Math.max(5, Math.min(240, parseInt(mins, 10) || 45));
        estadoVivo.duracionMin = m;
        estadoVivo.avisoFinEmitido = false;
        guardarBorradorVivo12();
        renderizarGotaFlotantePsico12();
        if (tabSesionVivoActiva) renderizarConsultorioCompleto();
    };

    window.psicoVivoToggleModoReloj = function () {
        estadoVivo.modo = estadoVivo.modo === "regresivo" ? "progresivo" : "regresivo";
        guardarBorradorVivo12();
        renderizarGotaFlotantePsico12();
    };

    window.psicoVivoIniciarOPausar = function () {
        if (!estadoVivo.pacienteId) {
            toast12("⚠️ Elegí primero un paciente para iniciar la sesión.");
            if (!tabSesionVivoActiva) abrirSesionEnVivoPsicoCDM();
            return;
        }
        if (estadoVivo.corriendo) {
            estadoVivo.accumulatedMs = obtenerMsTranscurridos12();
            estadoVivo.startedAtMs = null;
            estadoVivo.corriendo = false;
            if (intervaloTick) { clearInterval(intervaloTick); intervaloTick = null; }
            toast12("⏸️ Sesión pausada.");
        } else {
            if (!estadoVivo.iniciada) {
                const ahora = new Date();
                estadoVivo.horaInicioStr = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
                estadoVivo.iniciada = true;
            }
            estadoVivo.startedAtMs = Date.now();
            estadoVivo.corriendo = true;
            iniciarLoopReloj12();
            toast12("▶️ Sesión en curso (tiempo corriendo en la gota flotante).");
        }
        guardarBorradorVivo12();
        renderizarGotaFlotantePsico12();
        if (tabSesionVivoActiva) renderizarConsultorioCompleto();
    };

    window.psicoVivoSumarMinutos = function (deltaMin) {
        estadoVivo.duracionMin = Math.max(5, (Number(estadoVivo.duracionMin) || 45) + deltaMin);
        estadoVivo.avisoFinEmitido = false;
        guardarBorradorVivo12();
        renderizarGotaFlotantePsico12();
        toast12(`⏱️ Duración ajustada a ${estadoVivo.duracionMin} min.`);
    };

    window.psicoVivoReiniciarReloj = function () {
        if ((estadoVivo.corriendo || obtenerMsTranscurridos12() > 5000) && !confirm("↺ ¿Reiniciar el reloj a cero? (Tus anotaciones NO se borran)")) return;
        estadoVivo.corriendo = false;
        estadoVivo.iniciada = false;
        estadoVivo.startedAtMs = null;
        estadoVivo.accumulatedMs = 0;
        estadoVivo.horaInicioStr = "";
        estadoVivo.avisoFinEmitido = false;
        if (intervaloTick) { clearInterval(intervaloTick); intervaloTick = null; }
        guardarBorradorVivo12();
        renderizarGotaFlotantePsico12();
        if (tabSesionVivoActiva) renderizarConsultorioCompleto();
    };

    window.psicoVivoInsertarTimestamp = function () {
        const ta = document.getElementById("psicoNotaVivo12");
        if (!ta) return;
        const c = calcularEstadoReloj12();
        const sello = `[${formatearMMSS12(c.transSeg)}] `;
        const ini = ta.selectionStart ?? ta.value.length;
        const fin = ta.selectionEnd ?? ta.value.length;
        const pref = ini > 0 && ta.value[ini - 1] !== "\n" ? "\n" : "";
        ta.value = ta.value.slice(0, ini) + pref + sello + ta.value.slice(fin);
        estadoVivo.notas = ta.value;
        guardarBorradorVivo12();
        ta.focus();
        const pos = ini + pref.length + sello.length;
        ta.setSelectionRange(pos, pos);
    };

    window.psicoVivoToggleEtiqueta = function (etq, btnEl) {
        if (!Array.isArray(estadoVivo.etiquetas)) estadoVivo.etiquetas = [];
        const idx = estadoVivo.etiquetas.indexOf(etq);
        if (idx >= 0) estadoVivo.etiquetas.splice(idx, 1);
        else estadoVivo.etiquetas.push(etq);
        if (btnEl) btnEl.classList.toggle("active", idx < 0);
        guardarBorradorVivo12();
    };

    window.psicoVivoActualizarCampo = function (campo, valor) {
        estadoVivo[campo] = valor;
        if (campo === "animo") {
            const el = document.getElementById("psicoLblAnimo12");
            if (el) el.textContent = `${valor}/10`;
        }
        if (campo === "ansiedad") {
            const el = document.getElementById("psicoLblAns12");
            if (el) el.textContent = `${valor}/10`;
        }
        guardarBorradorVivo12();
    };

    window.psicoVivoDescartarBorrador = function () {
        if (!confirm("🗑️ ¿Limpiar el borrador y reiniciar la sesión en vivo?")) return;
        if (intervaloTick) { clearInterval(intervaloTick); intervaloTick = null; }
        Object.assign(estadoVivo, {
            corriendo: false, iniciada: false, startedAtMs: null, accumulatedMs: 0,
            horaInicioStr: "", avisoFinEmitido: false, notas: "", retomarProxima: "",
            animo: 6, ansiedad: 5, etiquetas: [], tokenTurno: ""
        });
        limpiarBorradorVivo12();
        renderizarConsultorioCompleto();
        renderizarGotaFlotantePsico12();
        toast12("🧹 Borrador limpiado.");
    };

    window.psicoVivoFinalizarYGuardar = function (e) {
        if (e && typeof e.preventDefault === "function") e.preventDefault();
        if (!estadoVivo.pacienteId) {
            alert("⚠️ Seleccioná primero un paciente para guardar la sesión.");
            return;
        }
        const notasTexto = (document.getElementById("psicoNotaVivo12")?.value ?? estadoVivo.notas ?? "").trim();
        const retomarTexto = (document.getElementById("psicoRetomarVivo12")?.value ?? estadoVivo.retomarProxima ?? "").trim();
        if (!notasTexto && !retomarTexto) {
            alert("⚠️ Escribí al menos una anotación o consigna antes de guardar la sesión.");
            return;
        }

        const db = obtenerDatosConsultorioCDM();
        const pac = (db.pacientes || []).find(p => Number(p.id) === Number(estadoVivo.pacienteId));
        if (!pac) {
            alert("⚠️ No se encontró el paciente en la base de datos.");
            return;
        }

        const msTotales = obtenerMsTranscurridos12();
        const durRealMin = msTotales > 0 ? Math.max(1, Math.round(msTotales / 60000)) : Number(estadoVivo.duracionMin || 45);
        const ahora = new Date();
        const horaFinStr = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;

        const etqs = Array.isArray(estadoVivo.etiquetas) && estadoVivo.etiquetas.length
            ? `[Temas: ${estadoVivo.etiquetas.join(", ")}]\n`
            : "";
        const cabeceraTiempo = `⏱️ Sesión en vivo (${durRealMin} min${estadoVivo.horaInicioStr ? ` • ${estadoVivo.horaInicioStr} a ${horaFinStr}` : ""})\n`;

        const nuevaSesion = {
            id: Date.now(),
            pacienteId: Number(pac.id),
            especialidad: pac.especialidad || obtenerEspActiva12(),
            fecha: hoyISO12(),
            horaInicio: estadoVivo.horaInicioStr || horaFinStr,
            horaFin: horaFinStr,
            duracionConfigMin: Number(estadoVivo.duracionMin) || 45,
            duracionRealMin: durRealMin,
            animo: Number(estadoVivo.animo) || 6,
            ansiedad: Number(estadoVivo.ansiedad) || 5,
            etiquetas: [...(estadoVivo.etiquetas || [])],
            arbolSnapshotCount: Array.isArray(pac.arbolFamiliar) ? pac.arbolFamiliar.length : 0,
            evolucion: `${cabeceraTiempo}${etqs}${notasTexto}`.trim(),
            indicaciones: retomarTexto,
            retomarProxima: retomarTexto,
            origen: "sesion_en_vivo"
        };

        if (!Array.isArray(db.sesiones)) db.sesiones = [];
        db.sesiones.unshift(nuevaSesion);

        if (estadoVivo.turnoId) {
            const turno = (db.turnos || []).find(t => Number(t.id) === Number(estadoVivo.turnoId));
            if (turno) {
                if (estadoVivo.marcarTurnoAtendido) turno.estado = "atendido";
                const tok = (document.getElementById("psicoTokenTurno12")?.value ?? estadoVivo.tokenTurno ?? "").trim();
                if (tok) turno.token = tok;
            }
        }

        guardarDatosConsultorioCDM(db);

        if (intervaloTick) { clearInterval(intervaloTick); intervaloTick = null; }
        const pidGuardado = pac.id;
        Object.assign(estadoVivo, {
            pacienteId: pidGuardado, turnoId: null, corriendo: false, iniciada: false,
            startedAtMs: null, accumulatedMs: 0, horaInicioStr: "", avisoFinEmitido: false,
            notas: "", retomarProxima: "", animo: 6, ansiedad: 5, etiquetas: [], tokenTurno: ""
        });
        gotaAbierta12 = false;
        limpiarBorradorVivo12();

        toast12(`💾 Sesión de ${pac.nombre} ${pac.apellido} (${durRealMin} min) guardada en su expediente.`);
        renderizarConsultorioCompleto();
    };

    // =====================================================================
    // 6. RENDER FULL-WIDTH DE ANOTACIONES EN VIVO (CERO COLUMNAS LATERALES)
    // =====================================================================
    function renderizarTabSesionVivo12(cont) {
        const db = obtenerDatosConsultorioCDM();
        const espAct = obtenerEspActiva12();
        const colorEsp = typeof colorEspecialidadConsultorio === "function" ? colorEspecialidadConsultorio(espAct) : "#7c3aed";
        const pacs = (db.pacientes || [])
            .filter(p => normTxt12(p.especialidad) === normTxt12(espAct))
            .sort((a, b) => String(a.apellido || "").localeCompare(String(b.apellido || "")));

        const pacSel = estadoVivo.pacienteId
            ? pacs.find(p => Number(p.id) === Number(estadoVivo.pacienteId)) || null
            : null;

        const sesionesPac = pacSel
            ? (db.sesiones || [])
                .filter(s => Number(s.pacienteId) === Number(pacSel.id))
                .sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")) || (Number(b.id) - Number(a.id)))
            : [];
        const ultSes = sesionesPac[0] || null;
        const turnoVinc = estadoVivo.turnoId ? (db.turnos || []).find(t => Number(t.id) === Number(estadoVivo.turnoId)) : null;
        const cantArbol = Array.isArray(pacSel?.arbolFamiliar) ? pacSel.arbolFamiliar.length : 0;

        cont.innerHTML = `
            <div class="psv-full-wrap">
                <form class="cons-card" onsubmit="psicoVivoFinalizarYGuardar(event)">
                    <!-- BARRA SUPERIOR COMPACTA: PACIENTE + BOTONES EN 1 SOLA LÍNEA -->
                    <div class="psv-topbar-slim">
                        <div class="psv-pac-picker-group">
                            <span style="font-size:1.05rem;">✍️</span>
                            <select id="psicoSelPaciente12" onchange="psicoVivoSeleccionarPaciente(this.value)">
                                <option value="">-- Seleccionar paciente --</option>
                                ${pacs.map(p => `<option value="${p.id}" ${Number(pacSel?.id) === Number(p.id) ? "selected" : ""}>${esc12(p.apellido)}, ${esc12(p.nombre)}${p.dni ? ` (DNI ${esc12(p.dni)})` : ""}</option>`).join("")}
                            </select>
                            ${turnoVinc ? `<span class="badge badge-purple" style="font-size:0.71rem;">⏰ ${esc12(turnoVinc.hora)} hs</span>` : ""}
                            ${pacSel ? `<button type="button" class="btn btn-ghost btn-sm" onclick="abrirHistoriaClinicaPacienteCDM(${pacSel.id})" title="Ver Historia Clínica completa">🩺 Ficha</button>` : ""}
                        </div>

                        <div class="psv-tools-bar">
                            <button type="button" class="btn btn-sm" style="background:${estadoVivo.corriendo ? "#f59e0b" : "#10b981"}; color:#fff; border:none; font-weight:800;" onclick="psicoVivoIniciarOPausar()">
                                ${estadoVivo.corriendo ? "⏸ Pausar" : (estadoVivo.iniciada ? "▶ Reanudar" : `▶ Iniciar (${estadoVivo.duracionMin}m)`)}
                            </button>
                            ${pacSel ? `
                                <button type="button" class="btn btn-sm" style="background:${verResumenAnterior12 ? "#7c3aed" : "rgba(124,58,237,0.1)"}; color:${verResumenAnterior12 ? "#fff" : "#5b21b6"}; border:1.5px solid rgba(124,58,237,0.35); font-weight:800;"
                                    onclick="psicoVivoToggleResumenAnterior()" title="Ver resumen de la última sesión">
                                    🧠 Última Sesión${ultSes ? ` (${esc12(ultSes.fecha.slice(5))})` : ""}
                                </button>
                            ` : ""}
                            <button type="button" class="btn btn-sm" style="background:rgba(124,58,237,0.12); color:#5b21b6; border:1.5px solid rgba(124,58,237,0.35); font-weight:800;"
                                onclick="abrirModalArbolFamiliarEnVivo12(${pacSel ? pacSel.id : "null"})"
                                title="Agregar o citar ramas del Árbol Familiar">
                                🌳 Árbol Familiar${pacSel ? ` (${cantArbol})` : ""}
                            </button>
                            <button type="button" class="btn btn-secondary btn-sm" onclick="psicoVivoInsertarTimestamp()" title="Insertar minuto actual">⏱️ + Sello</button>
                            <button type="button" class="btn btn-ghost btn-sm" onclick="psicoVivoDescartarBorrador()" title="Limpiar borrador">🧹</button>
                        </div>
                    </div>

                    <!-- RESUMEN DE SESIÓN ANTERIOR (DESPLEGABLE SOLO SI SE TOCA EL BOTÓN) -->
                    ${pacSel && verResumenAnterior12 ? `
                        <div class="psv-prev-drawer">
                            ${ultSes ? `
                                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:4px;">
                                    <strong style="color:${colorEsp};">🧠 Última sesión registrada — ${esc12(ultSes.fecha)}</strong>
                                    <div style="display:flex; gap:0.3rem;">
                                        ${ultSes.animo != null ? `<span class="badge badge-celeste" style="font-size:0.68rem;">Ánimo ${ultSes.animo}/10</span>` : ""}
                                        ${ultSes.ansiedad != null ? `<span class="badge badge-purple" style="font-size:0.68rem;">Ans. ${ultSes.ansiedad}/10</span>` : ""}
                                    </div>
                                </div>
                                <div style="white-space:pre-line; color:var(--ink-700);">${esc12(ultSes.evolucion || "")}</div>
                                ${(ultSes.retomarProxima || ultSes.indicaciones) ? `
                                    <div style="margin-top:6px; padding-top:5px; border-top:1px dashed rgba(124,58,237,0.3); color:#5b21b6; font-weight:700;">
                                        📌 Para retomar hoy: ${esc12(ultSes.retomarProxima || ultSes.indicaciones)}
                                    </div>
                                ` : ""}
                            ` : `
                                <div>Primera sesión de <b>${esc12(pacSel.nombre)}</b>.${pacSel.motivoConsulta ? ` <b>Motivo inicial:</b> ${esc12(pacSel.motivoConsulta)}` : ""}</div>
                            `}
                        </div>
                    ` : ""}

                    <!-- ETIQUETAS RÁPIDAS EN 1 FILA -->
                    <div class="psv-tags-wrap">
                        ${ETIQUETAS_PSICO_VIVO.map(etq => {
                            const act = (estadoVivo.etiquetas || []).includes(etq);
                            const escQ = etq.replace(/'/g, "\\'");
                            return `<button type="button" class="psv-tag-chip ${act ? "active" : ""}" onclick="psicoVivoToggleEtiqueta('${escQ}', this)">${etq}</button>`;
                        }).join("")}
                    </div>

                    <!-- ÁREA DE ANOTACIONES A ANCHO COMPLETO -->
                    <textarea id="psicoNotaVivo12" class="psv-notes-full"
                        placeholder="Escribí acá durante toda la sesión... Podés tocar '🌳 Árbol Familiar' o '⏱️ + Sello' arriba en cualquier momento, y controlar el tiempo desde la gota flotante."
                        oninput="psicoVivoActualizarCampo('notas', this.value)">${esc12(estadoVivo.notas || "")}</textarea>

                    <!-- PIE COMPACTO: ÁNIMO + ANSIEDAD + CONSIGNA PRÓXIMA SESIÓN -->
                    <div class="psv-bottom-controls">
                        <div>
                            <div style="display:flex; justify-content:space-between; font-size:0.75rem; font-weight:800; margin-bottom:3px;">
                                <span>🙂 Ánimo</span>
                                <span id="psicoLblAnimo12" style="color:#0284c7;">${estadoVivo.animo}/10</span>
                            </div>
                            <input type="range" min="1" max="10" value="${estadoVivo.animo}" style="width:100%; min-height:auto; accent-color:#0284c7;" oninput="psicoVivoActualizarCampo('animo', Number(this.value))">
                        </div>
                        <div>
                            <div style="display:flex; justify-content:space-between; font-size:0.75rem; font-weight:800; margin-bottom:3px;">
                                <span>⚡ Ansiedad</span>
                                <span id="psicoLblAns12" style="color:#7c3aed;">${estadoVivo.ansiedad}/10</span>
                            </div>
                            <input type="range" min="1" max="10" value="${estadoVivo.ansiedad}" style="width:100%; min-height:auto; accent-color:#7c3aed;" oninput="psicoVivoActualizarCampo('ansiedad', Number(this.value))">
                        </div>
                        <div class="field">
                            <label>📌 Retomar próxima sesión / Consigna</label>
                            <input type="text" id="psicoRetomarVivo12"
                                value="${esc12(estadoVivo.retomarProxima || "")}"
                                placeholder="Acuerdos, tareas o tema a retomar..."
                                oninput="psicoVivoActualizarCampo('retomarProxima', this.value)">
                        </div>
                    </div>

                    ${turnoVinc ? `
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.65rem; flex-wrap:wrap; background:var(--surface-subtle); border:1px solid var(--line-strong); border-radius:12px; padding:0.55rem 0.8rem; margin-bottom:0.75rem;">
                            <label style="display:inline-flex; align-items:center; gap:0.45rem; font-size:0.78rem; font-weight:700; cursor:pointer;">
                                <input type="checkbox" style="width:17px; height:17px; min-height:auto; accent-color:#10b981;" ${estadoVivo.marcarTurnoAtendido ? "checked" : ""} onchange="psicoVivoActualizarCampo('marcarTurnoAtendido', this.checked)">
                                <span>✓ Marcar turno de hoy (${esc12(turnoVinc.hora)} hs) como Atendido</span>
                            </label>
                            <input type="text" id="psicoTokenTurno12" value="${esc12(estadoVivo.tokenTurno || turnoVinc.token || "")}"
                                placeholder="🔑 Token / N° Orden (opc.)"
                                style="width:190px; min-height:32px; font-size:0.76rem;"
                                oninput="psicoVivoActualizarCampo('tokenTurno', this.value)">
                        </div>
                    ` : ""}

                    <button type="submit" class="btn btn-primary" style="width:100%; background:${colorEsp}; border-color:${colorEsp}; font-size:0.92rem; padding:0.72rem;">
                        💾 Finalizar y Guardar en Sesiones del Paciente
                    </button>
                </form>

                <!-- HISTORIAL RECIENTE DESPLEGABLE (OCULTADO POR DEFECTO PARA NO OCUPAR LUGAR) -->
                ${pacSel && sesionesPac.length > 0 ? `
                    <details class="cons-card" style="padding:0.85rem 1.05rem;">
                        <summary style="cursor:pointer; font-weight:800; font-size:0.86rem; color:var(--ink-800); list-style:none; display:flex; justify-content:space-between; align-items:center;">
                            <span>📚 Sesiones guardadas de ${esc12(pacSel.nombre)} (${sesionesPac.length})</span>
                            <span style="font-size:0.74rem; color:${colorEsp};">Tocá para desplegar ▾</span>
                        </summary>
                        <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.75rem; max-height:280px; overflow-y:auto;">
                            ${sesionesPac.slice(0, 8).map(s => `
                                <div style="background:var(--surface-subtle); border:1px solid var(--line); border-left:4px solid ${colorEsp}; border-radius:12px; padding:0.6rem 0.78rem; font-size:0.78rem;">
                                    <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem; flex-wrap:wrap; margin-bottom:3px;">
                                        <strong>📅 ${esc12(s.fecha)}${s.duracionRealMin ? ` • ⏱️ ${s.duracionRealMin} min` : ""}</strong>
                                        <div style="display:flex; gap:0.3rem;">
                                            ${s.animo != null ? `<span class="badge badge-celeste" style="font-size:0.66rem;">Ánimo ${s.animo}/10</span>` : ""}
                                            ${s.ansiedad != null ? `<span class="badge badge-purple" style="font-size:0.66rem;">Ans. ${s.ansiedad}/10</span>` : ""}
                                        </div>
                                    </div>
                                    <div style="color:var(--ink-700); white-space:pre-line;">${esc12(s.evolucion || "")}</div>
                                    ${(s.retomarProxima || s.indicaciones) ? `<div style="margin-top:4px; font-size:0.74rem; color:#5b21b6;"><b>📌 Próxima / Consigna:</b> ${esc12(s.retomarProxima || s.indicaciones)}</div>` : ""}
                                </div>
                            `).join("")}
                        </div>
                    </details>
                ` : ""}
            </div>
        `;
    }

    // =====================================================================
    // 7. ENGANCHE CON CONSULTORIO.JS (BOTÓN EN PRÓXIMOS PACIENTES + TAB)
    // =====================================================================
    function instalarHooksSesionVivoPsico12() {
        if (window.__cdmPsicoSesionVivoHooks12) return;
        if (typeof window.renderizarConsultorioCompleto !== "function") return;
        window.__cdmPsicoSesionVivoHooks12 = true;

        inyectarCSSSesionVivo12();
        cargarBorradorVivo12();

        const _origCambiarTab = window.cambiarTabConsultorioCDM;
        window.cambiarTabConsultorioCDM = function (tab) {
            if (tab === "sesion_vivo") {
                tabSesionVivoActiva = true;
                window.renderizarConsultorioCompleto();
                return;
            }
            tabSesionVivoActiva = false;
            return _origCambiarTab.apply(this, arguments);
        };

        const _origCambiarEsp = window.cambiarEspecialidadFiltroConsultorioCDM;
        window.cambiarEspecialidadFiltroConsultorioCDM = function () {
            tabSesionVivoActiva = false;
            const res = _origCambiarEsp.apply(this, arguments);
            asegurarGotaFlotantePsico12();
            return res;
        };

        if (typeof window.volverAlInicioDesdeConsultorio === "function") {
            const _origVolver = window.volverAlInicioDesdeConsultorio;
            window.volverAlInicioDesdeConsultorio = function () {
                tabSesionVivoActiva = false;
                const res = _origVolver.apply(this, arguments);
                asegurarGotaFlotantePsico12();
                return res;
            };
        }

        const _origRender = window.renderizarConsultorioCompleto;
        window.renderizarConsultorioCompleto = function () {
            _origRender.apply(this, arguments);
            asegurarGotaFlotantePsico12();

            const sec = document.getElementById("cdmSeccionConsultorioGlobal");
            if (!sec || sec.classList.contains("hidden")) return;
            if (!esAreaPsicologia12()) return;

            inyectarCSSSesionVivo12();
            const colorEsp = typeof colorEspecialidadConsultorio === "function"
                ? colorEspecialidadConsultorio(obtenerEspActiva12())
                : "#7c3aed";

            // 1. Botón directo en la cabecera de Psicología
            const headBtns = sec.querySelector(".cons-header > div:last-child");
            if (headBtns && !headBtns.querySelector(".btn-psico-vivo-header")) {
                const btnHead = document.createElement("button");
                btnHead.type = "button";
                btnHead.className = "btn btn-sm btn-psico-vivo-header";
                btnHead.style.cssText = "background:#ffffff; color:#4c1d95; font-weight:800; border:none;";
                btnHead.innerHTML = estadoVivo.corriendo ? "🔴 Volver a Sesión" : "⏱️ Sesión en Vivo";
                btnHead.onclick = () => abrirSesionEnVivoPsicoCDM();
                headBtns.prepend(btnHead);
            }

            // 2. Pestaña dedicada "Sesión en Vivo"
            const tabsBar = sec.querySelector(".cons-tabs");
            if (tabsBar && !tabsBar.querySelector('[data-psico-tab="sesion_vivo"]')) {
                const btnTab = document.createElement("button");
                btnTab.type = "button";
                btnTab.className = `cons-tab ${tabSesionVivoActiva ? "active" : ""}`;
                btnTab.setAttribute("data-psico-tab", "sesion_vivo");
                if (tabSesionVivoActiva) btnTab.style.background = colorEsp;
                btnTab.innerHTML = `
                    <span class="cons-tab-ico">${estadoVivo.corriendo ? "🔴" : "⏱️"}</span>
                    <span class="cons-tab-full">Sesión en Vivo${estadoVivo.corriendo ? " (Activa)" : ""}</span>
                    <span class="cons-tab-short">Sesión</span>
                `;
                btnTab.onclick = () => cambiarTabConsultorioCDM("sesion_vivo");
                tabsBar.insertBefore(btnTab, tabsBar.children[1] || null);
            }

            // 3. Botón "▶ Iniciar Sesión" en TODAS las tarjetas de Próximos Pacientes (al lado del calendario)
            if (!tabSesionVivoActiva) {
                sec.querySelectorAll(".cons-next-card").forEach(card => {
                    const acts = card.querySelector(".cons-next-actions");
                    if (!acts || acts.querySelector(".btn-iniciar-sesion-turno12")) return;

                    const selEstado = acts.querySelector('select[onchange*="cambiarEstadoTurnoCons("]');
                    const btnEdit = acts.querySelector('button[onclick*="abrirModalTurnoConsultorio("]');
                    const mTurno = selEstado?.getAttribute("onchange")?.match(/\((\d+)/)
                        || btnEdit?.getAttribute("onclick")?.match(/\((\d+)/);
                    if (!mTurno) return;

                    const tid = Number(mTurno[1]);
                    const btnPlay = document.createElement("button");
                    btnPlay.type = "button";
                    btnPlay.className = "btn btn-primary btn-sm btn-iniciar-sesion-turno12";
                    btnPlay.style.cssText = `min-height:27px; font-size:0.72rem; font-weight:800; background:${colorEsp}; border-color:${colorEsp};`;
                    btnPlay.innerHTML = "▶ Iniciar Sesión";
                    btnPlay.title = "Ir directo a la Sesión en Vivo con este paciente";
                    btnPlay.onclick = () => iniciarSesionDesdeTurnoPsico12(tid);
                    acts.insertBefore(btnPlay, acts.children[1] || null);
                });
            }

            // 4. Si está activa la pestaña Sesión en Vivo, renderizar las anotaciones a ancho completo
            if (tabSesionVivoActiva) {
                tabsBar?.querySelectorAll(".cons-tab").forEach(b => {
                    const esEste = b.getAttribute("data-psico-tab") === "sesion_vivo";
                    b.classList.toggle("active", esEste);
                    b.style.background = esEste ? colorEsp : "";
                });
                const cuerpo = document.getElementById("consCuerpoTab");
                if (cuerpo) renderizarTabSesionVivo12(cuerpo);
            }
        };
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") cerrarModalArbolPsico12();
    });

    instalarHooksSesionVivoPsico12();
    document.addEventListener("DOMContentLoaded", instalarHooksSesionVivoPsico12);
})();
// =========================================================================
// 13. GESTIÓN INTELIGENTE DE RECORDATORIOS 24HS (MANUAL LIMPIO vs. AUTOMÁTICO)
//     Pegar al final de js/consultorio.js (debajo del Bloque 12)
// =========================================================================

(function () {
    function tieneWhatsappAuto24hActivo13() {
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        return Boolean(lic?.whatsappAuto24h || lic?.funciones?.general?.whatsappAuto24h);
    }

    window.solicitarActivacionWhatsappAuto13 = function () {
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        const nombreComercio = lic?.nombreEntidad || "Mi Consultorio";
        const msg = `👋 Hola Gonzalo! Soy de *${nombreComercio}*.\nMe gustaría activar el *envío automático de recordatorios por WhatsApp 24hs antes* de los turnos y adaptar el costo en nuestro plan mensual.`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    };

    function aplicarControlRecordatorios24h13() {
        const sec = document.getElementById("cdmSeccionConsultorioGlobal");
        if (!sec || sec.classList.contains("hidden")) return;

        const sideCol = sec.querySelector(".cons-side-col");
        if (!sideCol) return;

        const autoActivo = tieneWhatsappAuto24hActivo13();
        const alarmCard = sideCol.querySelector(".cons-alarm24-card");

        // MODO 1: WHATSAPP AUTOMÁTICO ACTIVADO POR SUPERADMIN
        if (autoActivo) {
            if (alarmCard) alarmCard.remove();
            if (!sideCol.querySelector(".cons-auto-wa-banner13")) {
                const banner = document.createElement("div");
                banner.className = "cons-auto-wa-banner13";
                banner.style.cssText = "background:rgba(16,185,129,0.1); border:1.5px solid rgba(16,185,129,0.38); border-radius:14px; padding:0.65rem 0.9rem; display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap; font-size:0.78rem;";
                banner.innerHTML = `
                    <span style="font-weight:800; color:#065f46;">🤖 Recordatorios WhatsApp 24hs: <b>Automático Activo</b></span>
                    <span class="badge badge-ok" style="font-size:0.67rem;">Envío 100% solo</span>
                `;
                sideCol.prepend(banner);
            }
            return;
        }

        // MODO 2: MANUAL ($0) — MOSTRAR CARTEL AMARILLO SOLO PARA PENDIENTES; DESAPARECE AL ENVIAR
        if (alarmCard) {
            // Eliminar del cartel amarillo los ítems que ya tienen .sent (aviso enviado)
            alarmCard.querySelectorAll(".cons-alarm24-item.sent").forEach(el => el.remove());

            const pendientes = alarmCard.querySelectorAll(".cons-alarm24-item");
            if (pendientes.length === 0) {
                // Si no queda ningún paciente sin avisar, ocultar todo el cartel amarillo
                alarmCard.remove();
            } else {
                const titulo = alarmCard.querySelector("strong");
                if (titulo) titulo.textContent = `🔔 Pendiente avisar turno (próximas 24hs): ${pendientes.length}`;

                const badge = alarmCard.querySelector(".badge");
                if (badge) {
                    badge.className = "badge badge-warn";
                    badge.textContent = "Envío manual ($0)";
                }

                // Pie discreto para que el comercio pueda pedir activación automática si quiere
                if (!alarmCard.querySelector(".cons-auto-upsell-foot13")) {
                    const foot = document.createElement("div");
                    foot.className = "cons-auto-upsell-foot13";
                    foot.style.cssText = "margin-top:0.55rem; padding-top:0.5rem; border-top:1px dashed rgba(245,158,11,0.45); display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap; font-size:0.72rem; color:var(--ink-700);";
                    foot.innerHTML = `
                        <span>¿Querés que el sistema mande estos avisos solo?</span>
                        <button type="button" class="btn btn-ghost btn-sm" style="min-height:26px; font-size:0.71rem; font-weight:800; border-color:rgba(245,158,11,0.6);" onclick="solicitarActivacionWhatsappAuto13()">
                            ⚡ Activar Automático
                        </button>
                    `;
                    alarmCard.appendChild(foot);
                }
            }
        }
    }

    function engancharRenderRecordatorios13() {
        if (window.__cdmHookRecordatorios24h13) return;
        if (typeof window.renderizarConsultorioCompleto !== "function") return;
        window.__cdmHookRecordatorios24h13 = true;

        const _origRender = window.renderizarConsultorioCompleto;
        window.renderizarConsultorioCompleto = function () {
            _origRender.apply(this, arguments);
            aplicarControlRecordatorios24h13();
        };
        aplicarControlRecordatorios24h13();
    }

    engancharRenderRecordatorios13();
    document.addEventListener("DOMContentLoaded", engancharRenderRecordatorios13);
})();
// =========================================================================
// 14. MODO DISCIPLINA ÚNICA EN CONSULTORIO (SIN OBSERVER / CERO CONGELAMIENTOS)
//     - OCULTA EL LISTADO DESPLEGABLE DEL MENÚ (SOLO QUEDA "CONSULTORIO")
//     - ELIMINA LA TARJETA DE PORTADA Y ABRE DIRECTO EL CALENDARIO
//     Reemplazar por completo el Bloque 14 anterior al final de js/consultorio.js
// =========================================================================

(function () {
    function obtenerUnicaDisciplinaConsultorio14() {
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        const mod = lic?.modulos || {};
        const tieneDeportesOGym = Boolean(
            mod.futbol ||
            mod.hockey ||
            mod.gym ||
            (Array.isArray(lic?.deportesExtra) && lic.deportesExtra.length > 0)
        );
        if (tieneDeportesOGym) return null;

        const profs = typeof obtenerEspecialidadesHabilitadasConsultorioCDM === "function"
            ? obtenerEspecialidadesHabilitadasConsultorioCDM()
            : [];
        return profs.length === 1 ? profs[0] : null;
    }

    function inyectarCSSDisciplinaUnica14() {
        if (document.getElementById("cdmCssSoloUnaDisciplina14")) return;
        const st = document.createElement("style");
        st.id = "cdmCssSoloUnaDisciplina14";
        st.textContent = `
            body[data-solo-una-esp="1"] .sports-showcase-grid,
            body[data-solo-una-esp="1"] .index-section-head,
            body[data-solo-una-esp="1"] #cdmSeccionConsultorioGlobal button[onclick*="volverAlInicioDesdeConsultorio"],
            body[data-solo-una-esp="1"] .app-sidebar .sidebar-nav a[data-nav="index"],
            body[data-solo-una-esp="1"] .app-sidebar .sidebar-nav a[href="index.html"],
            body[data-solo-una-esp="1"] .cdm-sublista-oculta-14 {
                display: none !important;
            }
        `;
        document.head.appendChild(st);
    }

    function simplificarSidebarUnaDisciplina14() {
        const unica = obtenerUnicaDisciplinaConsultorio14();
        if (!unica) {
            document.body?.removeAttribute("data-solo-una-esp");
            return;
        }

        inyectarCSSDisciplinaUnica14();
        if (document.body?.getAttribute("data-solo-una-esp") !== "1") {
            document.body?.setAttribute("data-solo-una-esp", "1");
        }

        const sidebar = document.querySelector(".app-sidebar");
        if (!sidebar) return;

        // 1. Ocultar el sub-listado interno de especialidades (ej: "🧠 Psicología")
        sidebar.querySelectorAll('[onclick*="irAProfesionConsultorioNav"]').forEach(subItem => {
            if (!subItem.classList.contains("cdm-sublista-oculta-14")) {
                subItem.classList.add("cdm-sublista-oculta-14");
            }
            const padre = subItem.parentElement;
            if (padre && !padre.classList.contains("sidebar-nav") && !padre.classList.contains("app-sidebar")) {
                if (!padre.classList.contains("cdm-sublista-oculta-14")) {
                    padre.classList.add("cdm-sublista-oculta-14");
                }
            }
        });

        // 2. Dejar el botón como "Consultorio" limpio y directo al Calendario (solo modifica si cambia)
        const candidatos = Array.from(sidebar.querySelectorAll("a, button, .side-link"));
        const btnCons = candidatos.find(el =>
            !el.classList.contains("cdm-sublista-oculta-14") &&
            (el.getAttribute("data-nav") === "consultorio" || /consultorio\s*(\(\d+\))?/i.test(el.textContent || ""))
        );

        if (btnCons) {
            btnCons.classList.remove("hidden");

            btnCons.querySelectorAll("span").forEach(sp => {
                if (/consultorio/i.test(sp.textContent || "") && sp.textContent.trim() !== "Consultorio") {
                    sp.textContent = "Consultorio";
                }
            });
            btnCons.childNodes.forEach(node => {
                if (node.nodeType === 3 && /consultorio/i.test(node.textContent || "") && node.textContent.trim() !== "Consultorio") {
                    node.textContent = " Consultorio";
                }
            });

            btnCons.querySelectorAll('i[class*="arrow"], i[class*="chevron"], .nav-caret, .caret').forEach(ic => {
                if (ic.style.display !== "none") ic.style.display = "none";
            });

            if (btnCons.dataset.soloUnaEspBound14 !== "1") {
                btnCons.dataset.soloUnaEspBound14 = "1";
                btnCons.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    document.getElementById("cdmSeccionContabilidadGlobal")?.classList.add("hidden");
                    document.getElementById("cdmSeccionBaseGeneral37")?.classList.add("hidden");
                    if (typeof abrirEspecialidadDesdeInicioCDM === "function") {
                        abrirEspecialidadDesdeInicioCDM(unica.clave);
                    }
                    sidebar.querySelectorAll(".side-link").forEach(l => l.classList.remove("active"));
                    btnCons.classList.add("active");
                }, true);
            }

            const secCons = document.getElementById("cdmSeccionConsultorioGlobal");
            if (secCons && !secCons.classList.contains("hidden")) {
                sidebar.querySelectorAll(".side-link").forEach(l => l.classList.remove("active"));
                btnCons.classList.add("active");
            }
        }
    }

    function abrirCalendarioDirectoSiUnaDisciplina14() {
        const unica = obtenerUnicaDisciplinaConsultorio14();
        if (!unica) return;

        simplificarSidebarUnaDisciplina14();

        const enPortadaIndex = Boolean(document.querySelector(".sports-showcase-grid"));
        const contabAbierta = document.getElementById("cdmSeccionContabilidadGlobal") &&
            !document.getElementById("cdmSeccionContabilidadGlobal").classList.contains("hidden");
        const secCons = document.getElementById("cdmSeccionConsultorioGlobal");
        const yaAbierto = secCons && !secCons.classList.contains("hidden");

        if (enPortadaIndex && !contabAbierta && !yaAbierto && typeof abrirEspecialidadDesdeInicioCDM === "function") {
            abrirEspecialidadDesdeInicioCDM(unica.clave);
            simplificarSidebarUnaDisciplina14();
        }
    }

    function engancharHooksDisciplinaUnica14() {
        if (window.__cdmSoloUnaDisciplinaHook14) return;
        window.__cdmSoloUnaDisciplinaHook14 = true;

        if (typeof window.volverAlInicioDesdeConsultorio === "function") {
            const _origVolver14 = window.volverAlInicioDesdeConsultorio;
            window.volverAlInicioDesdeConsultorio = function () {
                const unica = obtenerUnicaDisciplinaConsultorio14();
                if (unica && typeof abrirEspecialidadDesdeInicioCDM === "function") {
                    abrirEspecialidadDesdeInicioCDM(unica.clave);
                    simplificarSidebarUnaDisciplina14();
                    return;
                }
                return _origVolver14.apply(this, arguments);
            };
        }

        if (typeof window.renderizarConsultorioCompleto === "function") {
            const _origRender14 = window.renderizarConsultorioCompleto;
            window.renderizarConsultorioCompleto = function () {
                _origRender14.apply(this, arguments);
                simplificarSidebarUnaDisciplina14();
            };
        }
    }

    engancharHooksDisciplinaUnica14();
    document.addEventListener("DOMContentLoaded", () => {
        engancharHooksDisciplinaUnica14();
        abrirCalendarioDirectoSiUnaDisciplina14();
        setTimeout(abrirCalendarioDirectoSiUnaDisciplina14, 200);
        setTimeout(simplificarSidebarUnaDisciplina14, 700);
    });
})();