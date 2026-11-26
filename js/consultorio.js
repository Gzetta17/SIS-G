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
// =========================================================================
// 15. PERSISTENCIA INMEDIATA EN MONGODB PARA CONSULTORIO + DIAGNÓSTICO VISIBLE
//     Reemplazar el Bloque 15 al final de js/consultorio.js
// =========================================================================

(function () {
    function obtenerClaveClub15() {
        return typeof obtenerClaveClubActivoCDM === "function"
            ? obtenerClaveClubActivoCDM()
            : (localStorage.getItem("cdm_club_activo_id_v1") || "cdm_adelia_maria_principal");
    }

    function storageKey15() {
        return `cdm_consultorio_suite_v2_${obtenerClaveClub15()}`;
    }

    function tieneDatosCons15(c) {
        if (!c || typeof c !== "object") return false;
        return (
            (Array.isArray(c.pacientes) && c.pacientes.length > 0) ||
            (Array.isArray(c.turnos) && c.turnos.length > 0) ||
            (Array.isArray(c.sesiones) && c.sesiones.length > 0) ||
            (Array.isArray(c.profesionales) && c.profesionales.length > 0)
        );
    }

    async function enviarConsultorioAMongo15(db, mostrarEstado = true) {
        if (window.location.protocol === "file:") return;
        const clave = obtenerClaveClub15();
        try {
            const resp = await fetch("/api/cdm/consultorio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                keepalive: true,
                body: JSON.stringify({ claveClub: clave, consultorio: db })
            });
            const data = await resp.json().catch(() => ({}));

            if (!resp.ok || !data.ok) {
                if (typeof mostrarToast === "function") {
                    mostrarToast(`❌ Error al guardar en servidor (HTTP ${resp.status}): ${data.error || "Revisar server.js"}`);
                }
                return;
            }

            if (data.mongoGuardado) {
                if (mostrarEstado && typeof mostrarToast === "function") {
                    mostrarToast(`☁️ Guardado en MongoDB (${data.pacientes} pac. • ${data.turnos} turnos)`);
                }
            } else if (typeof mostrarToast === "function") {
                mostrarToast(`⚠️ NO guardó en MongoDB: ${data.mongoError || "Base desconectada"}`);
            }
        } catch (err) {
            if (typeof mostrarToast === "function") {
                mostrarToast(`❌ Sin conexión con el servidor al guardar: ${err.message}`);
            }
        }
    }

    // Interceptar guardarDatosConsultorioCDM para guardar al instante sin esperar 350ms
    if (typeof window.guardarDatosConsultorioCDM === "function" && !window.__cdmConsMongoWrapped15) {
        window.__cdmConsMongoWrapped15 = true;
        window.guardarDatosConsultorioCDM = function (db) {
            try { localStorage.setItem(storageKey15(), JSON.stringify(db)); } catch {}
            enviarConsultorioAMongo15(db, true);
        };
    }

    async function hidratarConsultorioDesdeMongo15() {
        if (window.location.protocol === "file:") return;
        const path = window.location.pathname.toLowerCase();
        if (path.includes("login.html") || document.body?.classList.contains("login-page")) return;

        const clave = obtenerClaveClub15();
        try {
            const resp = await fetch(`/api/cdm/consultorio?club=${encodeURIComponent(clave)}`, { cache: "no-store" });
            if (!resp.ok) return;
            const data = await resp.json();
            if (!data?.ok || !data.consultorio) return;

            const local = typeof obtenerDatosConsultorioCDM === "function" ? obtenerDatosConsultorioCDM() : null;
            const remoto = data.consultorio;

            if (tieneDatosCons15(remoto)) {
                localStorage.setItem(storageKey15(), JSON.stringify(remoto));
                if (typeof renderizarConsultorioCompleto === "function") {
                    renderizarConsultorioCompleto();
                }
            } else if (tieneDatosCons15(local)) {
                await enviarConsultorioAMongo15(local, false);
            }
        } catch {}
    }

    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(hidratarConsultorioDesdeMongo15, 250);
    });
})();
// =========================================================================
// 16. COLORES PERSONALIZABLES PARA CONSULTORIO Y ESPECIALIDADES
//     - Conecta Consultorio, Calendario, Gota 45:00, Sesión en Vivo y Clínica con 🎨 Colores
//     - Permite elegir un color distinto por especialidad o aplicar el color general del comercio
//     - Respeta Modo Día / Modo Noche y guarda automáticamente en MongoDB (licenciaConfig)
// Pegar al final de js/consultorio.js (debajo del Bloque 15)
// =========================================================================
(function () {
    const PALETAS_CLINICA_16 = [
        { nombre: "Violeta Psi", hex: "#7c3aed" },
        { nombre: "Turquesa Kine", hex: "#0d9488" },
        { nombre: "Celeste Base", hex: "#0284c7" },
        { nombre: "Verde Salud", hex: "#16a34a" },
        { nombre: "Rosa Studio", hex: "#db2777" },
        { nombre: "Índigo", hex: "#4f46e5" },
        { nombre: "Terracota", hex: "#c2410c" },
        { nombre: "Bordo", hex: "#be123c" },
        { nombre: "Dorado", hex: "#b45309" },
        { nombre: "Grafito", hex: "#334155" }
    ];

    window.__cdmLiveColorCons16 = null;
    window.__cdmLiveBrand16 = null;

    function norm16(s) {
        return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    }

    function hexValido16(h, fb = "#0284c7") {
        const s = String(h || "").trim();
        return /^#[0-9a-fA-F]{6}$/.test(s) ? s.toLowerCase() : fb;
    }

    function hexToRgb16(hex) {
        const c = hexValido16(hex, "#0284c7").slice(1);
        return { r: parseInt(c.slice(0, 2), 16), g: parseInt(c.slice(2, 4), 16), b: parseInt(c.slice(4, 6), 16) };
    }

    function mezclarHex16(hexA, hexB, pesoB) {
        const a = hexToRgb16(hexA), b = hexToRgb16(hexB);
        const f = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
        return `#${f(a.r + (b.r - a.r) * pesoB)}${f(a.g + (b.g - a.g) * pesoB)}${f(a.b + (b.b - a.b) * pesoB)}`;
    }

    function textoContraste16(hex) {
        const { r, g, b } = hexToRgb16(hex);
        return (0.299 * r + 0.587 * g + 0.114 * b) > 172 ? "#0f172a" : "#ffffff";
    }

    function obtenerEspActiva16() {
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        const lista = Array.isArray(lic?.profesionesHabilitadas)
            ? lic.profesionesHabilitadas.map(c => String(c || "").trim()).filter(Boolean)
            : [];
        const act = window.especialidadFiltroConsultorioCDM;
        if (act && act !== "TODAS") {
            const hit = lista.find(c => norm16(c) === norm16(act));
            if (hit) return hit;
        }
        return lista[0] || "Consultorio";
    }

    const _origColorEsp16 = window.colorEspecialidadConsultorio;

    window.colorEspecialidadConsultorio = function (esp) {
        const claveEsp = norm16(esp || obtenerEspActiva16());
        const espAct = norm16(obtenerEspActiva16());

        // 1. Vista previa en vivo desde el modal de color del consultorio
        if (window.__cdmLiveColorCons16 && claveEsp === espAct) {
            return hexValido16(window.__cdmLiveColorCons16);
        }

        // 2. Vista previa en vivo desde Más -> 🎨 Colores
        if (window.__cdmLiveBrand16?.primario) {
            return hexValido16(window.__cdmLiveBrand16.primario);
        }

        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};

        // 3. Color personalizado guardado específicamente para esta especialidad
        const mapaEsp = lic?.coloresEspecialidades;
        if (mapaEsp && typeof mapaEsp === "object" && mapaEsp[claveEsp]) {
            return hexValido16(mapaEsp[claveEsp]);
        }

        // 4. Color de marca global del comercio (si fue personalizado en 🎨 Colores)
        const tm = lic?.temaMarca;
        if (tm && tm.primario && (tm.primario.toLowerCase() !== "#0284c7" || (tm.secundario && tm.secundario.toLowerCase() !== "#0c192c") || tm.aplicarAConsultorio)) {
            return hexValido16(tm.primario);
        }

        // 5. Color predeterminado por especialidad
        return typeof _origColorEsp16 === "function" ? _origColorEsp16(esp) : "#0369a1";
    };

    window.gradienteEspecialidadConsultorio = function (esp) {
        const pri = window.colorEspecialidadConsultorio(esp);
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        const secBase = window.__cdmLiveBrand16?.secundario || lic?.temaMarca?.secundario;
        const deep = (secBase && /^#[0-9a-fA-F]{6}$/.test(secBase) && secBase.toLowerCase() !== "#0c192c")
            ? secBase
            : mezclarHex16(pri, "#0b1220", 0.68);
        const priHeader = textoContraste16(pri) === "#0f172a" ? mezclarHex16(pri, "#000000", 0.22) : pri;
        return `linear-gradient(135deg, ${deep} 0%, ${priHeader} 100%)`;
    };

    function inyectarCSSColorDinamicoConsultorio16() {
        if (document.getElementById("cdmCssColorConsultorio16")) return;
        const st = document.createElement("style");
        st.id = "cdmCssColorConsultorio16";
        st.textContent = `
            /* Banner, pestañas activas y calendario del Consultorio */
            #cdmSeccionConsultorioGlobal .cons-header {
                background: linear-gradient(135deg, var(--cons-p-deep) 0%, var(--cons-p-hdr) 100%) !important;
            }
            #cdmSeccionConsultorioGlobal .cons-tab.active {
                background: var(--cons-p) !important;
                color: var(--cons-on-p) !important;
                box-shadow: 0 4px 12px rgba(var(--cons-p-rgb), 0.34) !important;
            }
            #cdmSeccionConsultorioGlobal .cons-cal-chip {
                background: var(--cons-p) !important;
                color: var(--cons-on-p) !important;
            }
            #cdmSeccionConsultorioGlobal .cons-cal-day:hover {
                border-color: var(--cons-p) !important;
                background: rgba(var(--cons-p-rgb), 0.09) !important;
            }
            #cdmSeccionConsultorioGlobal .cons-cal-day.is-today {
                border-color: var(--cons-p) !important;
                box-shadow: inset 0 0 0 1px var(--cons-p) !important;
            }
            #cdmSeccionConsultorioGlobal .cons-cal-day.is-today .cons-cal-day-num span:first-child {
                background: var(--cons-p) !important;
                color: var(--cons-on-p) !important;
            }
            #cdmSeccionConsultorioGlobal .cons-cal-day.is-sel {
                background: rgba(var(--cons-p-rgb), 0.13) !important;
                border-color: var(--cons-p) !important;
                box-shadow: 0 0 0 2px rgba(var(--cons-p-rgb), 0.25) !important;
            }

            /* Gota flotante de sesión (45:00) y su desplegable */
            #cdmPsicoGotaSesion12 .psv-gota-btn:not([data-fase="ok"]):not([data-fase="warn"]):not([data-fase="over"]) {
                background: linear-gradient(135deg, var(--cons-p-deep) 0%, var(--cons-p) 100%) !important;
                border-color: rgba(var(--cons-p-rgb), 0.72) !important;
                box-shadow: 0 14px 30px rgba(var(--cons-p-rgb), 0.42) !important;
                color: var(--cons-on-p) !important;
            }
            #cdmPsicoGotaSesion12 .psv-gota-popover {
                background: linear-gradient(155deg, #0f172a 0%, var(--cons-p-deep) 60%, var(--cons-p-dark) 100%) !important;
                border-color: rgba(var(--cons-p-rgb), 0.48) !important;
            }
            #cdmSeccionConsultorioGlobal .btn-psico-vivo-header {
                color: var(--cons-p-deep) !important;
            }
            #cdmSeccionConsultorioGlobal .psv-tag-chip.active {
                background: var(--cons-p) !important;
                border-color: var(--cons-p) !important;
                color: var(--cons-on-p) !important;
            }
            #cdmSeccionConsultorioGlobal .psv-prev-drawer,
            #modalArbolFamiliarPsico12 .psv-tree-add-box {
                background: rgba(var(--cons-p-rgb), 0.08) !important;
                border-color: rgba(var(--cons-p-rgb), 0.34) !important;
                border-left-color: var(--cons-p) !important;
            }

            /* Historia Clínica, Genograma y botones principales del modal clínico */
            #modalSuiteClinicaProCDM .clin-hero {
                background: linear-gradient(135deg, var(--cons-p-deep) 0%, var(--cons-p-hdr) 100%) !important;
            }
            #modalSuiteClinicaProCDM .clin-tab.active,
            #modalSuiteClinicaProCDM .btn-primary {
                background: var(--cons-p) !important;
                border-color: var(--cons-p) !important;
                color: var(--cons-on-p) !important;
            }
            #modalSuiteClinicaProCDM .clin-geno-node.is-pac {
                background: linear-gradient(135deg, var(--cons-p) 0%, var(--cons-p-deep) 100%) !important;
                border-color: var(--cons-p) !important;
                color: var(--cons-on-p) !important;
            }

            .cons16-swatches { display: flex; flex-wrap: wrap; gap: 0.42rem; margin-bottom: 0.8rem; }
            .cons16-swatch {
                display: inline-flex; align-items: center; gap: 0.35rem;
                border: 1.5px solid var(--line-strong, #cbd5e1);
                background: var(--surface-solid, #ffffff);
                color: var(--ink-900, #0f172a);
                border-radius: 999px; padding: 0.28rem 0.65rem 0.28rem 0.34rem;
                font-size: 0.74rem; font-weight: 700; cursor: pointer;
            }
            .cons16-swatch:hover { border-color: var(--cons-p, #0284c7); transform: translateY(-1px); }
            .cons16-dot { width: 15px; height: 15px; border-radius: 50%; border: 1.5px solid rgba(0,0,0,0.16); flex-shrink: 0; }
        `;
        document.head.appendChild(st);
    }

    window.aplicarVariablesColorConsultorio16 = function (espOpt = null) {
        inyectarCSSColorDinamicoConsultorio16();
        const esp = espOpt || obtenerEspActiva16();
        const pri = hexValido16(window.colorEspecialidadConsultorio(esp), "#0284c7");
        const { r, g, b } = hexToRgb16(pri);
        const onP = textoContraste16(pri);
        const pDark = mezclarHex16(pri, "#000000", 0.24);
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        const secMarca = window.__cdmLiveBrand16?.secundario || lic?.temaMarca?.secundario;
        const pDeep = (secMarca && /^#[0-9a-fA-F]{6}$/.test(secMarca) && secMarca.toLowerCase() !== "#0c192c")
            ? secMarca
            : mezclarHex16(pri, "#0b1220", 0.68);
        const pHdr = onP === "#0f172a" ? mezclarHex16(pri, "#000000", 0.22) : pri;

        const root = document.documentElement;
        root.style.setProperty("--cons-p", pri);
        root.style.setProperty("--cons-p-hdr", pHdr);
        root.style.setProperty("--cons-p-dark", pDark);
        root.style.setProperty("--cons-p-deep", pDeep);
        root.style.setProperty("--cons-p-rgb", `${r}, ${g}, ${b}`);
        root.style.setProperty("--cons-on-p", onP);
    };

    // --- MODAL RÁPIDO PARA ELEGIR COLOR DEL CONSULTORIO / ESPECIALIDAD ---
    window.abrirModalColorConsultorio16 = function () {
        const esp = obtenerEspActiva16();
        const colorAct = window.colorEspecialidadConsultorio(esp);

        let modal = document.getElementById("modalColorConsultorio16");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "modalColorConsultorio16";
            modal.className = "modal-backdrop";
            modal.onclick = (e) => { if (e.target === modal) cancelarColorConsultorio16(); };
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-window" style="max-width:540px; text-align:left;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-celeste">🎨 PERSONALIZAR COLOR</span>
                        <h3 style="margin-top:4px; color:var(--ink-900);">Color de ${esp}</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cancelarColorConsultorio16()">✕</button>
                </div>

                <p style="font-size:0.8rem; color:var(--ink-500); margin-bottom:0.8rem;">
                    Elegí una paleta o cualquier color libre. Se previsualiza en vivo en la cabecera, pestañas, calendario, reloj e historia clínica (respetando Modo Día y Noche).
                </p>

                <div class="cons16-swatches">
                    ${PALETAS_CLINICA_16.map(p => `
                        <button type="button" class="cons16-swatch" onclick="previewColorConsultorio16('${p.hex}')">
                            <span class="cons16-dot" style="background:${p.hex};"></span>
                            <span>${p.nombre}</span>
                        </button>
                    `).join("")}
                </div>

                <div style="display:flex; gap:0.65rem; align-items:center; margin-bottom:1rem; background:var(--surface-subtle); padding:0.7rem 0.85rem; border-radius:12px; border:1px solid var(--line-strong);">
                    <input type="color" id="cons16ColorPicker" value="${colorAct}" oninput="previewColorConsultorio16(this.value)" style="width:48px; height:40px; padding:2px; cursor:pointer;">
                    <div class="field" style="flex:1;">
                        <label>Código HEX</label>
                        <input type="text" id="cons16ColorHex" value="${colorAct}" maxlength="7" oninput="if(/^#[0-9a-fA-F]{6}$/.test(this.value)) previewColorConsultorio16(this.value)" style="font-family:monospace; font-weight:800;">
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="restaurarColorConsultorio16()">↺ Original</button>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="guardarColorConsultorio16(true)">
                        🎨 Aplicar a todo el Comercio
                    </button>
                    <div style="display:flex; gap:0.45rem;">
                        <button type="button" class="btn btn-ghost" onclick="cancelarColorConsultorio16()">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="guardarColorConsultorio16(false)">
                            💾 Guardar para ${esp}
                        </button>
                    </div>
                </div>
            </div>
        `;
        modal.classList.remove("hidden");
    };

    window.previewColorConsultorio16 = function (hex) {
        const val = hexValido16(hex, "#0284c7");
        window.__cdmLiveColorCons16 = val;
        const pk = document.getElementById("cons16ColorPicker");
        const tx = document.getElementById("cons16ColorHex");
        if (pk) pk.value = val;
        if (tx && document.activeElement !== tx) tx.value = val;
        aplicarVariablesColorConsultorio16();
    };

    window.cancelarColorConsultorio16 = function () {
        window.__cdmLiveColorCons16 = null;
        document.getElementById("modalColorConsultorio16")?.classList.add("hidden");
        aplicarVariablesColorConsultorio16();
    };

    async function persistirLicenciaColoresEnServidor16(lic) {
        if (typeof guardarLicenciaConfigCDM === "function") guardarLicenciaConfigCDM(lic);
        const clave = typeof obtenerClaveClubActivoCDM === "function" ? obtenerClaveClubActivoCDM() : "cdm_adelia_maria_principal";
        if (window.location.protocol !== "file:") {
            try {
                const resp = await fetch(`/api/cdm/estado?club=${encodeURIComponent(clave)}`);
                if (resp.ok) {
                    const d = await resp.json();
                    const est = d.estado || {};
                    est.licenciaConfig = { ...(est.licenciaConfig || {}), ...lic };
                    await fetch("/api/cdm/estado", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ...est, claveClub: clave })
                    });
                }
            } catch {}
        }
    }

    window.guardarColorConsultorio16 = async function (aplicarATodoComercio = false) {
        const hex = hexValido16(document.getElementById("cons16ColorPicker")?.value, "#0284c7");
        const esp = obtenerEspActiva16();
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};

        if (!lic.coloresEspecialidades || typeof lic.coloresEspecialidades !== "object") {
            lic.coloresEspecialidades = {};
        }
        lic.coloresEspecialidades[norm16(esp)] = hex;

        if (aplicarATodoComercio) {
            lic.temaMarca = {
                ...(lic.temaMarca || { estiloSidebar: "oscuro_neutro" }),
                primario: hex,
                secundario: mezclarHex16(hex, "#0b1220", 0.68),
                aplicarAConsultorio: true
            };
        }

        window.__cdmLiveColorCons16 = null;
        await persistirLicenciaColoresEnServidor16(lic);

        document.getElementById("modalColorConsultorio16")?.classList.add("hidden");
        if (typeof aplicarColoresMarcaComercio22 === "function") aplicarColoresMarcaComercio22();
        aplicarVariablesColorConsultorio16();
        if (typeof renderizarConsultorioCompleto === "function") renderizarConsultorioCompleto();
        if (typeof mostrarToast === "function") {
            mostrarToast(aplicarATodoComercio ? "🎨 Color aplicado a todo el comercio y consultorio." : `🎨 Color de ${esp} guardado.`);
        }
    };

    window.restaurarColorConsultorio16 = async function () {
        const esp = obtenerEspActiva16();
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        if (lic.coloresEspecialidades) delete lic.coloresEspecialidades[norm16(esp)];
        window.__cdmLiveColorCons16 = null;
        await persistirLicenciaColoresEnServidor16(lic);
        document.getElementById("modalColorConsultorio16")?.classList.add("hidden");
        aplicarVariablesColorConsultorio16();
        if (typeof renderizarConsultorioCompleto === "function") renderizarConsultorioCompleto();
        if (typeof mostrarToast === "function") mostrarToast(`↺ Color original de ${esp} restaurado.`);
    };

    // --- ENGANCHES EN VIVO CON CONSULTORIO Y CON LOGIN.JS BLOQUE 22 ---
    function instalarHooksColoresConsultorio16() {
        if (window.__cdmColorConsHook16) return;
        window.__cdmColorConsHook16 = true;

        if (typeof window.renderizarConsultorioCompleto === "function") {
            const _origRend16 = window.renderizarConsultorioCompleto;
            window.renderizarConsultorioCompleto = function () {
                aplicarVariablesColorConsultorio16();
                _origRend16.apply(this, arguments);
                aplicarVariablesColorConsultorio16();

                // Botón discreto "🎨 Color" en la cabecera del Consultorio (solo Admin Principal / SuperAdmin)
                const ses = typeof obtenerSesionActivaCDM === "function" ? obtenerSesionActivaCDM() : null;
                if (ses && ses.nivelAdmin === "staff") return;
                const headBtns = document.querySelector("#cdmSeccionConsultorioGlobal .cons-header > div:last-child");
                if (headBtns && !headBtns.querySelector(".btn-color-cons16")) {
                    const b = document.createElement("button");
                    b.type = "button";
                    b.className = "btn btn-sm btn-color-cons16";
                    b.style.cssText = "background:rgba(255,255,255,0.2); color:#ffffff; border:1px solid rgba(255,255,255,0.42); font-weight:800;";
                    b.innerHTML = "🎨 Color";
                    b.title = "Personalizar color de esta especialidad o de todo el consultorio";
                    b.onclick = abrirModalColorConsultorio16;
                    headBtns.appendChild(b);
                }
            };
        }

        if (typeof window.aplicarColoresMarcaComercio22 === "function") {
            const _origBrand22 = window.aplicarColoresMarcaComercio22;
            window.aplicarColoresMarcaComercio22 = function (temaOverride = null) {
                window.__cdmLiveBrand16 = temaOverride || null;
                const res = _origBrand22.apply(this, arguments);
                aplicarVariablesColorConsultorio16();
                return res;
            };
        }

        aplicarVariablesColorConsultorio16();
    }

    instalarHooksColoresConsultorio16();
    document.addEventListener("DOMContentLoaded", () => {
        instalarHooksColoresConsultorio16();
        setTimeout(aplicarVariablesColorConsultorio16, 250);
    });
})();
// =========================================================================
// 17. SUITE PROFESIONAL DE OBRAS SOCIALES, CUPOS, TOKENS, COBRANZAS Y LIQUIDACIONES
//     - Exclusivo para Profesionales / Consultorio (no afecta Clubes ni Gimnasios)
//     - Obra Social (solo Valor OS + Coseguro) vs Particular (solo Valor Total)
//     - Descuento automático de sesiones por paciente (cupo mes/año atado al año calendario)
//     - Reglas de token por mutual y por paciente + filtro Mes Trabajado / Mes Cobrado
//     - Checklist (Token / Presentado / Coseguro / OS / Completo) + Liquidaciones (Mensual / BIS)
//     - Reconstrucción automática de asientos en Caja (sincronizado con MongoDB)
// Pegar al final de js/consultorio.js (debajo del Bloque 16)
// =========================================================================
(function () {
    if (window.__cdmConsObrasSociales17) return;
    window.__cdmConsObrasSociales17 = true;

    const MODOS_TOKEN = [
        { clave: "sin_token", label: "Sin token / Libre", corto: "Sin token" },
        { clave: "semanal", label: "Token semanal (día de sesión)", corto: "Token semanal" },
        { clave: "fin_mes", label: "Autorización a fin de mes", corto: "Fin de mes" },
        { clave: "previa", label: "Autorización previa / Orden RP", corto: "Auth. previa" },
        { clave: "por_dia", label: "Validación online por día", corto: "Por día" }
    ];

    const FREC_PRESENTACION = [
        { clave: "mensual", label: "Mensual (ej. del 28 al 8)" },
        { clave: "semanal", label: "Semanal" },
        { clave: "por_dia", label: "Por día / On-line directo" }
    ];

    const LIQ_POR_MES = [
        { clave: "1", label: "1 por mes (Mensual — 1er día hábil)" },
        { clave: "2", label: "2 por mes (Mensual + BIS mediados de mes)" },
        { clave: "variable", label: "Directa / Variable según mutual" }
    ];

    const TIPOS_LIQ_PAGO = [
        "1ª Liquidación Mensual",
        "2ª Liquidación (BIS)",
        "Liquidación Extraordinaria",
        "Pago Directo Mutual"
    ];

    const MEDIOS_CAJA_17 = ["Efectivo", "Transferencia", "MercadoPago", "Tarjeta / Mutual"];

    const ui17 = {
        fechaSel: typeof obtenerHoyISO === "function" ? obtenerHoyISO() : new Date().toISOString().split("T")[0],
        cobSubTab: "sesiones", // "sesiones" | "pacientes" | "mutuales" | "liquidaciones"
        cobModoMes: "trabajo", // "trabajo" | "cobro"
        cobMesTrabajo: new Date().toISOString().slice(0, 7), // "YYYY-MM" | "TODOS"
        cobMutId: "TODAS",
        cobPacId: "TODOS",
        cobEstado: "TODOS",
        cobEsp: "ACTIVA",
        cobBusq: ""
    };

    function norm17(s) {
        return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    }

    function mismaEsp17(a, b) {
        return norm17(a) === norm17(b);
    }

    function esc17(s) {
        return String(s ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function escJs17(s) {
        return esc17(String(s ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'"));
    }

    function hoy17() {
        return typeof obtenerHoyISO === "function" ? obtenerHoyISO() : new Date().toISOString().split("T")[0];
    }

    function fmt17(n) {
        return "$" + Math.round(Number(n) || 0).toLocaleString("es-AR");
    }

    function toast17(msg) {
        if (typeof mostrarToast === "function") mostrarToast(msg);
    }

    function tieneConsultorioActivo17() {
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        const mod = lic?.modulos || {};
        const profs = Array.isArray(lic?.profesionesHabilitadas) ? lic.profesionesHabilitadas.filter(Boolean) : [];
        return mod.consultorio !== false && profs.length > 0;
    }

    function obtenerEspActiva17() {
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        const lista = Array.isArray(lic?.profesionesHabilitadas)
            ? lic.profesionesHabilitadas.map(c => String(c || "").trim()).filter(Boolean)
            : [];
        const act = window.especialidadFiltroConsultorioCDM;
        if (act && act !== "TODAS") {
            const hit = lista.find(c => mismaEsp17(c, act));
            if (hit) return hit;
        }
        return lista[0] || "Consultorio";
    }

    function formatearMesYM17(ym) {
        if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return ym || "-";
        const [y, m] = ym.split("-").map(Number);
        const dt = new Date(y, m - 1, 1);
        const txt = dt.toLocaleDateString("es-AR", { month: "short", year: "numeric" });
        return txt.charAt(0).toUpperCase() + txt.slice(1);
    }

    function labelModoToken17(clave, corto = false) {
        const hit = MODOS_TOKEN.find(x => x.clave === clave);
        if (!hit) return corto ? "Sin token" : "Sin token / Libre";
        return corto ? hit.corto : hit.label;
    }

    function labelFrecPres17(clave) {
        return (FREC_PRESENTACION.find(x => x.clave === clave) || FREC_PRESENTACION[0]).label;
    }

    function labelLiqMes17(clave) {
        return (LIQ_POR_MES.find(x => x.clave === String(clave)) || LIQ_POR_MES[1]).label;
    }

    function obtenerDescColegioDefecto17(db, esp) {
        const k = norm17(esp || obtenerEspActiva17());
        const mapa = db?.configCobranza?.descuentoColegioPorEsp || {};
        if (mapa[k] !== undefined && mapa[k] !== null && mapa[k] !== "") return Number(mapa[k]) || 0;
        if (db?.configCobranza?.descuentoColegioGeneral !== undefined) return Number(db.configCobranza.descuentoColegioGeneral) || 0;
        return 0;
    }

    function esMutualParticular17(m) {
        if (!m) return true;
        if (m.esParticular === true) return true;
        if (m.esParticular === false) return false;
        const n = norm17(m.nombre);
        return n.includes("particular") || (Number(m.valorMutual || 0) === 0 && Number(m.valorParticular || 0) > 0);
    }

    function normalizarMutual17(m, db, espFallback = "") {
        if (!m) return null;
        const esPart = esMutualParticular17(m);
        const defCol = obtenerDescColegioDefecto17(db, m.especialidad || espFallback);
        const modoToken = esPart
            ? "sin_token"
            : (m.modoToken || (m.requiereToken ? "semanal" : "sin_token"));
        return {
            ...m,
            esParticular: esPart,
            valorMutual: esPart ? 0 : (Number(m.valorMutual) || 0),
            coseguro: esPart ? 0 : (Number(m.coseguro) || 0),
            valorParticular: esPart ? (Number(m.valorParticular) || 0) : 0,
            requiereToken: !esPart && modoToken !== "sin_token",
            modoToken,
            topeMensual: esPart ? 0 : (Number(m.topeMensual) || 0),
            topeAnual: esPart ? 0 : (Number(m.topeAnual) || 0),
            frecuenciaPresentacion: esPart ? "por_dia" : (m.frecuenciaPresentacion || "mensual"),
            liquidacionesMes: esPart ? "variable" : String(m.liquidacionesMes || "2"),
            descuentoColegioPct: esPart ? 0 : (m.descuentoColegioPct !== undefined && m.descuentoColegioPct !== "" ? Number(m.descuentoColegioPct) : defCol),
            estadoConvenio: esPart ? "activo" : (m.estadoConvenio || "activo"),
            demoraEstimada: esPart ? "" : (m.demoraEstimada || "")
        };
    }

    function resolverMutual17(db, mutId, espFallback = "") {
        const raw = typeof window.buscarMutualConsultorioCDM === "function"
            ? window.buscarMutualConsultorioCDM(db, mutId, espFallback)
            : (db.mutuales || []).find(x => x.id === mutId);
        return raw ? normalizarMutual17(raw, db, espFallback) : null;
    }

    function obtenerReglaTokenPaciente17(db, pac, mutNorm = null) {
        const m = mutNorm || (pac ? resolverMutual17(db, pac.mutualId, pac.especialidad) : null);
        if (m && m.esParticular) return { clave: "sin_token", origen: "Particular", nota: "" };
        if (pac?.modoTokenPaciente && pac.modoTokenPaciente !== "heredar") {
            return { clave: pac.modoTokenPaciente, origen: "Regla del paciente", nota: pac.notaTokenPaciente || "" };
        }
        return { clave: m?.modoToken || "sin_token", origen: "De la mutual", nota: pac?.notaTokenPaciente || "" };
    }

    // =====================================================================
    // 1. CÁLCULO DE CUPO DE SESIONES (ATADO AL AÑO CALENDARIO)
    // =====================================================================
    window.calcularCupoPacienteCons17 = function (db, pac, fechaRefISO = null) {
        if (!db || !pac) return null;
        const mut = resolverMutual17(db, pac.mutualId, pac.especialidad);
        const ref = fechaRefISO || hoy17();
        const mesRef = ref.slice(0, 7);
        const anioRef = ref.slice(0, 4);

        const turnosPac = (db.turnos || []).filter(t => Number(t.pacienteId) === Number(pac.id) && t.estado !== "cancelado");
        const atendidosMes = turnosPac.filter(t => t.estado === "atendido" && String(t.fecha || "").startsWith(mesRef)).length;
        const atendidosAnioSistema = turnosPac.filter(t => t.estado === "atendido" && String(t.fecha || "").startsWith(anioRef)).length;
        const agendadosMes = turnosPac.filter(t => t.estado !== "atendido" && String(t.fecha || "").startsWith(mesRef)).length;

        const anioPrev = pac.anioSesionesPrevias ? String(pac.anioSesionesPrevias) : String(new Date().getFullYear());
        const previasAnio = anioPrev === anioRef ? (Number(pac.sesionesPreviasAnio) || 0) : 0;
        const usadasAnio = atendidosAnioSistema + previasAnio;

        const topeMes = pac.topeMensualCustom !== undefined && pac.topeMensualCustom !== "" && pac.topeMensualCustom !== null
            ? Number(pac.topeMensualCustom)
            : (mut?.topeMensual || 0);
        const topeAnio = pac.topeAnualCustom !== undefined && pac.topeAnualCustom !== "" && pac.topeAnualCustom !== null
            ? Number(pac.topeAnualCustom)
            : (mut?.topeAnual || 0);

        const restanMes = topeMes > 0 ? Math.max(0, topeMes - atendidosMes) : null;
        const restanAnio = topeAnio > 0 ? Math.max(0, topeAnio - usadasAnio) : null;
        const excedidoMes = topeMes > 0 && atendidosMes >= topeMes;
        const excedidoAnio = topeAnio > 0 && usadasAnio >= topeAnio;
        const alertaBaja = (!excedidoMes && restanMes === 1) || (!excedidoAnio && restanAnio !== null && restanAnio <= 2);

        return {
            esParticular: !mut || mut.esParticular,
            mutual: mut,
            mesRef, anioRef,
            atendidosMes, agendadosMes,
            usadasAnio, previasAnio,
            topeMes, topeAnio,
            restanMes, restanAnio,
            excedidoMes, excedidoAnio, alertaBaja
        };
    };

    // =====================================================================
    // 2. MOTOR FINANCIERO POR SESIÓN + RECONSTRUCCIÓN ATÓMICA DE CAJA
    // =====================================================================
    function analizarFinanzasTurno17(db, t) {
        const mut = resolverMutual17(db, t.mutualId, t.especialidad);
        const pac = t.pacienteId ? (db.pacientes || []).find(p => Number(p.id) === Number(t.pacienteId)) : null;
        const esPart = Boolean(mut?.esParticular) || (Number(t.valorParticular || 0) > 0 && Number(t.valorMutual || 0) === 0);

        const valPart = esPart ? (Number(t.valorParticular) || 0) : 0;
        const valCoseg = esPart ? 0 : (Number(t.coseguro) || 0);
        const valOSBruto = esPart ? 0 : (Number(t.valorMutual) || 0);

        const descPct = esPart
            ? 0
            : (t.descuentoColegioPct !== undefined && t.descuentoColegioPct !== "" && t.descuentoColegioPct !== null
                ? Number(t.descuentoColegioPct)
                : (mut ? Number(mut.descuentoColegioPct) || 0 : obtenerDescColegioDefecto17(db, t.especialidad)));

        const descMonto = Math.round(valOSBruto * (descPct / 100));
        const valOSNeto = Math.max(0, valOSBruto - descMonto);

        const montoConsultorio = esPart ? valPart : valCoseg;
        const cosegCobrado = Boolean(t.coseguroCobrado);
        const osCobrada = Boolean(t.mutualCobrada);
        const tokenEntregado = Boolean(t.tokenEntregado || (t.token && String(t.token).trim()));

        // Prioriza la regla individual del paciente por sobre la mutual
        const reglaToken = obtenerReglaTokenPaciente17(db, pac, mut);
        const requiereToken = !esPart && reglaToken.clave !== "sin_token";

        const cobradoConsultorio = cosegCobrado ? montoConsultorio : 0;
        const pendConsultorio = (montoConsultorio > 0 && !cosegCobrado) ? montoConsultorio : 0;
        const cobradoOSNeto = osCobrada ? valOSNeto : 0;
        const pendOSNeto = (valOSBruto > 0 && !osCobrada) ? valOSNeto : 0;

        const faltaCoseg = montoConsultorio > 0 && !cosegCobrado;
        const faltaOS = valOSBruto > 0 && !osCobrada;
        const completo = !faltaCoseg && !faltaOS;
        const mesTrabajo = String(t.fecha || "").slice(0, 7);

        return {
            mut, pac, esPart, mesTrabajo, reglaToken,
            montoConsultorio, valOSBruto, descPct, descMonto, valOSNeto,
            cosegCobrado, osCobrada, tokenEntregado, requiereToken,
            faltaToken: requiereToken && !tokenEntregado,
            faltaCoseg, faltaOS, completo,
            cobradoConsultorio, pendConsultorio,
            cobradoOSNeto, pendOSNeto,
            totalCobradoReal: cobradoConsultorio + cobradoOSNeto,
            totalPendienteReal: pendConsultorio + pendOSNeto
        };
    }

    function construirAsientosDeTurno17(db, t) {
        const res = [];
        if (!t || t.estado === "cancelado") return res;
        const fin = analizarFinanzasTurno17(db, t);

        if (fin.cosegCobrado && fin.montoConsultorio > 0) {
            res.push({
                refKey: `cons_coseg_${t.id}`,
                fecha: t.fechaPagoCoseguro || t.fecha || hoy17(),
                tipo: "ingreso",
                rubro: fin.esPart ? "Sesión Consultorio" : "Coseguro / Mutual",
                concepto: `${fin.esPart ? "Sesión Particular" : `Coseguro (${fin.mut?.nombre || t.mutualNombre})`} — ${t.pacienteNombre} [Trab: ${fin.mesTrabajo}]`,
                monto: fin.montoConsultorio,
                medio: t.medioPagoCoseguro || "Efectivo",
                origenConsultorio: true,
                turnoId: t.id,
                mesTrabajo: fin.mesTrabajo
            });
        }

        if (!fin.esPart && fin.osCobrada && fin.valOSNeto > 0) {
            const liqTxt = t.liquidacionRef ? ` • ${t.liquidacionRef}` : "";
            const colTxt = fin.descPct > 0 ? ` (Bruto ${fmt17(fin.valOSBruto)} - ${fin.descPct}% Col.)` : "";
            res.push({
                refKey: `cons_mut_${t.id}`,
                fecha: t.fechaPagoMutual || hoy17(),
                tipo: "ingreso",
                rubro: "Coseguro / Mutual",
                concepto: `Obra Social ${fin.mut?.nombre || t.mutualNombre} — ${t.pacienteNombre} [Trab: ${fin.mesTrabajo}${liqTxt}]${colTxt}`,
                monto: fin.valOSNeto,
                medio: t.medioPagoMutual || "Transferencia",
                origenConsultorio: true,
                turnoId: t.id,
                mesTrabajo: fin.mesTrabajo
            });
        }
        return res;
    }

    window.reconstruirAsientosConsultorioEnCaja17 = function () {
        if (!tieneConsultorioActivo17()) return;
        const db = obtenerDatosConsultorioCDM();
        const asientos = [];
        (db.turnos || []).forEach(t => {
            asientos.push(...construirAsientosDeTurno17(db, t));
        });

        if (typeof window.reemplazarAsientosConsultorioFinanzas === "function") {
            window.reemplazarAsientosConsultorioFinanzas(asientos);
        } else if (typeof window.sincronizarAsientoConsultorioFinanzas === "function") {
            asientos.forEach(a => window.sincronizarAsientoConsultorioFinanzas(a));
        }
    };

    function sincronizarCajaDesdeTurno17(db, t) {
        if (typeof window.reemplazarAsientosConsultorioFinanzas === "function") {
            window.reconstruirAsientosConsultorioEnCaja17();
            return;
        }
        if (typeof window.sincronizarAsientoConsultorioFinanzas !== "function") return;
        const asientos = construirAsientosDeTurno17(db, t);
        const refs = new Set(asientos.map(a => a.refKey));
        asientos.forEach(a => window.sincronizarAsientoConsultorioFinanzas(a));
        if (typeof window.eliminarAsientoConsultorioFinanzas === "function") {
            if (!refs.has(`cons_coseg_${t.id}`)) window.eliminarAsientoConsultorioFinanzas(`cons_coseg_${t.id}`);
            if (!refs.has(`cons_mut_${t.id}`)) window.eliminarAsientoConsultorioFinanzas(`cons_mut_${t.id}`);
        }
    }

    window.calcularResumenPendienteConsultorio17 = function () {
        const db = obtenerDatosConsultorioCDM();
        let pendTotal = 0, pendCoseg = 0, pendOS = 0, sesionesPend = 0, faltanTokens = 0;
        (db.turnos || []).forEach(t => {
            if (!t || t.estado === "cancelado") return;
            const f = analizarFinanzasTurno17(db, t);
            if (f.totalPendienteReal > 0) {
                pendTotal += f.totalPendienteReal;
                pendCoseg += f.pendConsultorio;
                pendOS += f.pendOSNeto;
                sesionesPend++;
            }
            if (f.faltaToken) faltanTokens++;
        });
        return { pendTotal, pendCoseg, pendOS, sesionesPend, faltanTokens };
    };

    // =====================================================================
    // 3. ESTILOS COMPACTOS PARA OBRAS SOCIALES, CUPOS Y COBRANZAS
    // =====================================================================
    function inyectarCSS17() {
        if (document.getElementById("cdmCssConsObras17")) return;
        const st = document.createElement("style");
        st.id = "cdmCssConsObras17";
        st.textContent = `
            .c17-subtabs {
                display: flex; gap: 0.35rem; flex-wrap: wrap; margin-bottom: 0.85rem;
                background: var(--surface-subtle, #f1f5f9); padding: 0.32rem;
                border: 1px solid var(--line, #e2e8f0); border-radius: 13px;
            }
            .c17-subtab {
                flex: 1 0 auto; border: none; background: transparent;
                color: var(--ink-600, #475569); font-size: 0.77rem; font-weight: 800;
                padding: 0.45rem 0.7rem; border-radius: 9px; cursor: pointer;
                transition: all 0.14s ease;
            }
            .c17-subtab.active {
                background: var(--cons-p, #0284c7); color: var(--cons-on-p, #ffffff);
                box-shadow: 0 3px 10px rgba(2, 132, 199, 0.25);
            }
            .c17-filter-bar {
                display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 0.45rem; margin-bottom: 0.85rem;
                background: var(--surface-subtle, #f8fafc); border: 1px solid var(--line, #e2e8f0);
                padding: 0.65rem 0.75rem; border-radius: 14px;
            }
            .c17-filter-bar select, .c17-filter-bar input { min-height: 35px; font-size: 0.77rem; }
            .c17-kpi-5 {
                display: grid; grid-template-columns: repeat(5, minmax(0, 1fr));
                gap: 0.65rem; margin-bottom: 0.9rem;
            }
            .c17-check-pill {
                display: inline-flex; align-items: center; gap: 0.32rem;
                padding: 0.22rem 0.5rem; border-radius: 8px;
                border: 1.5px solid var(--line-strong, #cbd5e1);
                background: var(--surface-solid, #ffffff);
                font-size: 0.72rem; font-weight: 800; cursor: pointer; user-select: none;
                white-space: nowrap; transition: all 0.12s ease;
            }
            .c17-check-pill input { width: 15px; height: 15px; min-height: auto !important; margin: 0; cursor: pointer; accent-color: #10b981; }
            .c17-check-pill.is-ok { background: rgba(16, 185, 129, 0.12); border-color: #10b981; color: #047857; }
            .c17-check-pill.is-warn { background: rgba(239, 68, 68, 0.08); border-color: rgba(239, 68, 68, 0.45); color: #b91c1c; }
            .c17-check-pill.is-done { background: #10b981; border-color: #059669; color: #ffffff; }
            body[data-theme="dark"] .c17-check-pill.is-ok { color: #34d399; }
            body[data-theme="dark"] .c17-check-pill.is-warn { color: #fca5a5; }
            .c17-cupo-bar {
                display: inline-flex; align-items: center; gap: 0.3rem; flex-wrap: wrap;
                font-size: 0.7rem; font-weight: 800;
            }
            .c17-mut-meta {
                display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem;
                background: var(--surface-solid, #ffffff); border: 1px solid var(--line, #e2e8f0);
                border-radius: 11px; padding: 0.55rem 0.65rem; font-size: 0.76rem;
            }
            .c17-mut-meta small { display: block; font-size: 0.63rem; color: var(--ink-500, #64748b); text-transform: uppercase; font-weight: 800; }
            .c17-neto-preview {
                background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.35);
                border-radius: 11px; padding: 0.52rem 0.75rem; font-size: 0.77rem; margin-bottom: 0.7rem;
            }
            .c17-tipo-switch {
                display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem; margin-bottom: 0.75rem;
            }
            .c17-tipo-opt {
                border: 1.5px solid var(--line-strong, #cbd5e1); background: var(--surface-subtle, #f8fafc);
                border-radius: 12px; padding: 0.55rem 0.7rem; cursor: pointer;
                font-size: 0.8rem; font-weight: 800; text-align: center; transition: all 0.14s ease;
            }
            .c17-tipo-opt.active {
                background: var(--cons-p, #0284c7); border-color: var(--cons-p, #0284c7); color: #ffffff;
            }
            .c17-mob-cards { display: none; }
            @media (max-width: 1120px) { .c17-kpi-5 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
            @media (max-width: 820px) {
                .c17-desk-table { display: none !important; }
                .c17-mob-cards { display: flex; flex-direction: column; gap: 0.55rem; }
            }
        `;
        document.head.appendChild(st);
    }

    function asegurarModal17() {
        let m = document.getElementById("modalConsultorioProCDM");
        if (!m) {
            m = document.createElement("div");
            m.id = "modalConsultorioProCDM";
            m.className = "modal-backdrop hidden";
            m.onclick = (e) => { if (e.target === m && typeof cerrarModalConsultorioCDM === "function") cerrarModalConsultorioCDM(); };
            document.body.appendChild(m);
        }
        return m;
    }

    // =====================================================================
    // 4. MODAL Y TAB DE OBRAS SOCIALES vs PARTICULAR (ESTRICTAMENTE SEPARADOS)
    // =====================================================================
    function renderTabMutualesPro17(cont, db, espAct) {
        const mutualesEsp = (db.mutuales || [])
            .filter(m => mismaEsp17(m.especialidad, espAct))
            .map(m => normalizarMutual17(m, db, espAct));
        const descDef = obtenerDescColegioDefecto17(db, espAct);

        cont.innerHTML = `
            <div class="cons-card">
                <div class="cons-card-head">
                    <div>
                        <h3>🏥 Obras Sociales, Convenios y Particular — ${esc17(espAct)}</h3>
                        <small style="color:var(--ink-500); font-size:0.74rem;">
                            Aranceles, cupos mensuales/anuales, reglas de token, liquidaciones y retención del Colegio (Defecto: <b>${descDef}%</b>)
                        </small>
                    </div>
                    <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="abrirModalConfigColegio17('${escJs17(espAct)}')">⚙️ % Colegio (${descDef}%)</button>
                        <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalMutualConsultorio()">+ Nuevo Convenio / Particular</button>
                    </div>
                </div>

                <div class="cons-mut-grid">
                    ${mutualesEsp.map(m => {
                        const estMap = {
                            activo: { cls: "badge-ok", txt: "🟢 Activo" },
                            alerta: { cls: "badge-warn", txt: "🟡 En Alerta" },
                            suspendido: { cls: "badge-danger", txt: "🔴 Suspendido" }
                        }[m.estadoConvenio || "activo"] || { cls: "badge-ok", txt: "🟢 Activo" };

                        const descM = Math.round(m.valorMutual * (m.descuentoColegioPct / 100));
                        const netoOS = Math.max(0, m.valorMutual - descM);
                        const totalProf = netoOS + m.coseguro;

                        return `
                            <div class="cons-mut-card" style="border-top:4px solid ${m.esParticular ? "#10b981" : (m.estadoConvenio === "suspendido" ? "#ef4444" : m.estadoConvenio === "alerta" ? "#f59e0b" : "var(--cons-p, #0284c7)")};">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.4rem;">
                                    <div>
                                        <strong style="font-size:0.95rem;">${esc17(m.nombre)}</strong>
                                        <div style="display:flex; gap:0.3rem; flex-wrap:wrap; margin-top:3px;">
                                            <span class="badge ${m.esParticular ? "badge-ok" : "badge-celeste"}" style="font-size:0.65rem;">${m.esParticular ? "💵 Solo Particular" : "🏥 Obra Social"}</span>
                                            ${!m.esParticular ? `<span class="badge ${estMap.cls}" style="font-size:0.65rem;">${estMap.txt}</span>` : ""}
                                        </div>
                                    </div>
                                    ${!m.esParticular ? `<span class="badge ${m.requiereToken ? "badge-purple" : "badge-ok"}" style="font-size:0.65rem;">🔑 ${esc17(labelModoToken17(m.modoToken, true))}</span>` : ""}
                                </div>

                                ${m.esParticular ? `
                                    <div class="c17-mut-meta" style="grid-template-columns:1fr;">
                                        <div>
                                            <small>VALOR TOTAL SESIÓN PARTICULAR</small>
                                            <strong style="font-size:1.25rem; color:#059669;">${fmt17(m.valorParticular)}</strong>
                                            <span style="display:block; font-size:0.71rem; color:var(--ink-500); margin-top:2px;">Sin obra social ni coseguro • Pago directo</span>
                                        </div>
                                    </div>
                                ` : `
                                    <div class="c17-mut-meta">
                                        <div><small>Valor Obra Social</small><b>${fmt17(m.valorMutual)}</b></div>
                                        <div><small>Coseguro Paciente</small><b>${fmt17(m.coseguro)}</b></div>
                                        <div><small>Desc. Colegio (${m.descuentoColegioPct}%)</small><b style="color:#b91c1c;">-${fmt17(descM)}</b></div>
                                        <div><small>Neto Profesional</small><b style="color:#059669;">${fmt17(totalProf)}</b></div>
                                        <div style="grid-column:1/-1; border-top:1px dashed var(--line); padding-top:4px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:0.3rem;">
                                            <span>🎯 Cupo: <b>${m.topeMensual > 0 ? `${m.topeMensual}/mes` : "Libre/mes"}</b> • <b>${m.topeAnual > 0 ? `${m.topeAnual}/año` : "Libre/año"}</b></span>
                                        </div>
                                        <div style="grid-column:1/-1; font-size:0.72rem; color:var(--ink-600);">
                                            📤 Presentación: <b>${esc17(labelFrecPres17(m.frecuenciaPresentacion))}</b><br>
                                            💰 Liquidaciones: <b>${esc17(labelLiqMes17(m.liquidacionesMes))}</b>${m.demoraEstimada ? ` • ⏱️ ${esc17(m.demoraEstimada)}` : ""}
                                        </div>
                                    </div>
                                `}

                                ${m.notas ? `<small style="color:var(--ink-500); font-size:0.72rem;">💡 ${esc17(m.notas)}</small>` : ""}
                                <div style="display:flex; gap:0.4rem; margin-top:auto;">
                                    <button type="button" class="btn btn-secondary btn-sm" style="flex:1;" onclick="abrirModalMutualConsultorio('${escJs17(m.id)}')">✏️ Editar</button>
                                    ${!m.esParticular ? `<button type="button" class="btn btn-danger btn-sm" onclick="eliminarMutualConsultorio('${escJs17(m.id)}')">🗑️</button>` : ""}
                                </div>
                            </div>
                        `;
                    }).join("")}
                </div>
            </div>
        `;
    }

    window.abrirModalConfigColegio17 = function (espOpt = null) {
        const db = obtenerDatosConsultorioCDM();
        const esp = espOpt || obtenerEspActiva17();
        const actual = obtenerDescColegioDefecto17(db, esp);
        const modal = asegurarModal17();
        modal.innerHTML = `
            <div class="modal-window" style="max-width:460px;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-purple">⚙️ RETENCIÓN DEL COLEGIO</span>
                        <h3 style="margin-top:4px;">% Descuento — ${esc17(esp)}</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalConsultorioCDM()">✕</button>
                </div>
                <form onsubmit="guardarConfigColegio17(event, '${escJs17(esp)}')">
                    <p style="font-size:0.79rem; color:var(--ink-600); margin-bottom:0.75rem;">
                        Definí el porcentaje de gastos administrativos / retención que descuenta el Colegio profesional (Psicólogos, Kinesiólogos, etc.) sobre los honorarios de Obras Sociales. Se precarga automático y podés ajustarlo por mutual o liquidación.
                    </p>
                    <div class="field" style="margin-bottom:0.65rem;">
                        <label>Porcentaje de Retención del Colegio (%) *</label>
                        <input type="number" id="c17DescColDef" min="0" max="50" step="0.1" value="${actual}" required>
                    </div>
                    <label style="display:flex; align-items:center; gap:0.45rem; font-size:0.8rem; font-weight:700; margin-bottom:0.85rem; cursor:pointer;">
                        <input type="checkbox" id="c17AplicarTodasMut" style="width:16px; height:16px; min-height:auto;">
                        Aplicar este % también a todas las obras sociales ya creadas en ${esc17(esp)}
                    </label>
                    <button type="submit" class="btn btn-primary" style="width:100%;">💾 Guardar % Colegio</button>
                </form>
            </div>
        `;
        modal.classList.remove("hidden");
    };

    window.guardarConfigColegio17 = function (e, esp) {
        e.preventDefault();
        const db = obtenerDatosConsultorioCDM();
        const pct = Math.max(0, Math.min(50, parseFloat(document.getElementById("c17DescColDef")?.value) || 0));
        const aplicarTodas = Boolean(document.getElementById("c17AplicarTodasMut")?.checked);

        if (!db.configCobranza || typeof db.configCobranza !== "object") db.configCobranza = {};
        if (!db.configCobranza.descuentoColegioPorEsp) db.configCobranza.descuentoColegioPorEsp = {};
        db.configCobranza.descuentoColegioPorEsp[norm17(esp)] = pct;

        if (aplicarTodas) {
            (db.mutuales || []).forEach(m => {
                if (mismaEsp17(m.especialidad, esp) && !esMutualParticular17(m)) {
                    m.descuentoColegioPct = pct;
                }
            });
        }
        guardarDatosConsultorioCDM(db);
        cerrarModalConsultorioCDM();
        toast17(`⚙️ Retención del Colegio fijada en ${pct}% para ${esp}.`);
        renderizarConsultorioCompleto();
        if (typeof window.refrescarFinanzasSiVisible === "function") window.refrescarFinanzasSiVisible();
    };

    window.abrirModalMutualConsultorio = function (mutId = null) {
        const db = obtenerDatosConsultorioCDM();
        const espAct = obtenerEspActiva17();
        const raw = mutId ? (db.mutuales || []).find(x => x.id === mutId) : null;
        const m = raw ? normalizarMutual17(raw, db, espAct) : null;
        const esPartIni = m ? m.esParticular : false;
        const descDef = obtenerDescColegioDefecto17(db, espAct);

        const modal = asegurarModal17();
        modal.innerHTML = `
            <div class="modal-window" style="max-width:640px;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-celeste">🏥 CONVENIO / TARIFA • ${esc17(espAct.toUpperCase())}</span>
                        <h3 style="margin-top:4px;">${m ? `Editar: ${esc17(m.nombre)}` : `Nueva Obra Social o Particular`}</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalConsultorioCDM()">✕</button>
                </div>

                <form onsubmit="guardarMutualConsultorio(event, ${m ? `'${escJs17(m.id)}'` : "null"}, '${escJs17(espAct)}')">
                    <input type="hidden" id="cmEsParticular17" value="${esPartIni ? "1" : "0"}">

                    <div class="c17-tipo-switch">
                        <button type="button" id="cmBtnTipoOS" class="c17-tipo-opt ${!esPartIni ? "active" : ""}" onclick="cambiarTipoModalMutual17(false)">
                            🏥 Obra Social / Prepaga
                        </button>
                        <button type="button" id="cmBtnTipoPart" class="c17-tipo-opt ${esPartIni ? "active" : ""}" onclick="cambiarTipoModalMutual17(true)">
                            💵 Particular (Sin Obra Social)
                        </button>
                    </div>

                    <div class="field" style="margin-bottom:0.65rem;">
                        <label id="cmLblNombre17">${esPartIni ? "Nombre de Tarifa Particular *" : "Nombre de la Obra Social / Prepaga *"}</label>
                        <input type="text" id="cmNom" value="${esc17(m?.nombre || "")}" required placeholder="${esPartIni ? "Ej: Particular (Sin Obra Social)" : "Ej: OSDE, APROSS, Swiss Medical, Federada..."}">
                    </div>

                    <!-- BLOQUE SOLO PARTICULAR -->
                    <div id="cmBloqueParticular17" class="${esPartIni ? "" : "hidden"}" style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.3); border-radius:14px; padding:0.8rem; margin-bottom:0.75rem;">
                        <div class="field">
                            <label>Valor Total de la Sesión Particular ($) *</label>
                            <input type="number" id="cmValPart" min="0" step="100" value="${m?.valorParticular ?? 25000}" placeholder="Ej: 25000">
                        </div>
                        <small style="display:block; color:var(--ink-500); font-size:0.73rem; margin-top:4px;">
                            Al ser particular no lleva valor de obra social, coseguro, token ni descuento de colegio.
                        </small>
                    </div>

                    <!-- BLOQUE SOLO OBRA SOCIAL -->
                    <div id="cmBloqueObraSocial17" class="${esPartIni ? "hidden" : ""}">
                        <div class="grid-3" style="margin-bottom:0.6rem;">
                            <div class="field"><label>Valor Obra Social ($) *</label><input type="number" id="cmValMut" min="0" step="100" value="${m?.valorMutual ?? 18000}" oninput="recalcPreviewMutual17()"></div>
                            <div class="field"><label>Coseguro Paciente ($)</label><input type="number" id="cmCoseg" min="0" step="100" value="${m?.coseguro ?? 0}" oninput="recalcPreviewMutual17()"></div>
                            <div class="field"><label>% Descuento Colegio</label><input type="number" id="cmDescCol" min="0" max="50" step="0.1" value="${m ? m.descuentoColegioPct : descDef}" oninput="recalcPreviewMutual17()"></div>
                        </div>

                        <div id="cmNetoPreview17" class="c17-neto-preview"></div>

                        <div class="grid-3" style="margin-bottom:0.6rem;">
                            <div class="field"><label>Sesiones cubiertas / Mes</label><input type="number" id="cmTopeMes" min="0" max="60" value="${m?.topeMensual ?? 4}" placeholder="0 = sin tope"></div>
                            <div class="field"><label>Sesiones cubiertas / Año</label><input type="number" id="cmTopeAnio" min="0" max="365" value="${m?.topeAnual ?? 30}" placeholder="0 = sin tope"></div>
                            <div class="field"><label>Estado del Convenio</label>
                                <select id="cmEstadoConv">
                                    <option value="activo" ${(m?.estadoConvenio || "activo") === "activo" ? "selected" : ""}>🟢 Activo</option>
                                    <option value="alerta" ${m?.estadoConvenio === "alerta" ? "selected" : ""}>🟡 En Alerta</option>
                                    <option value="suspendido" ${m?.estadoConvenio === "suspendido" ? "selected" : ""}>🔴 Suspendido</option>
                                </select>
                            </div>
                        </div>

                        <div class="grid-2" style="margin-bottom:0.6rem;">
                            <div class="field"><label>🔑 Modalidad de Token / Autorización</label>
                                <select id="cmModoToken">
                                    ${MODOS_TOKEN.map(mt => `<option value="${mt.clave}" ${(m?.modoToken || "semanal") === mt.clave ? "selected" : ""}>${mt.label}</option>`).join("")}
                                </select>
                            </div>
                            <div class="field"><label>📤 Frecuencia de Presentación</label>
                                <select id="cmFrecPres">
                                    ${FREC_PRESENTACION.map(fp => `<option value="${fp.clave}" ${(m?.frecuenciaPresentacion || "mensual") === fp.clave ? "selected" : ""}>${fp.label}</option>`).join("")}
                                </select>
                            </div>
                        </div>

                        <div class="grid-2" style="margin-bottom:0.65rem;">
                            <div class="field"><label>💰 Liquidaciones que hace por mes</label>
                                <select id="cmLiqMes">
                                    ${LIQ_POR_MES.map(lq => `<option value="${lq.clave}" ${String(m?.liquidacionesMes || "2") === lq.clave ? "selected" : ""}>${lq.label}</option>`).join("")}
                                </select>
                            </div>
                            <div class="field"><label>⏱️ Demora estimada de pago (opc.)</label>
                                <input type="text" id="cmDemora" value="${esc17(m?.demoraEstimada || "")}" placeholder="Ej: 60 días / 2 meses">
                            </div>
                        </div>
                    </div>

                    <div class="field" style="margin-bottom:0.8rem;">
                        <label>Notas / Reglas de Facturación (ej. presentación del 28 al 8, planillas, etc.)</label>
                        <input type="text" id="cmNotas" value="${esc17(m?.notas || "")}" placeholder="Opcional...">
                    </div>

                    <button type="submit" class="btn btn-primary" style="width:100%;">💾 Guardar en ${esc17(espAct)}</button>
                </form>
            </div>
        `;
        modal.classList.remove("hidden");
        recalcPreviewMutual17();
    };

    window.cambiarTipoModalMutual17 = function (esPart) {
        const hid = document.getElementById("cmEsParticular17");
        if (hid) hid.value = esPart ? "1" : "0";
        document.getElementById("cmBtnTipoOS")?.classList.toggle("active", !esPart);
        document.getElementById("cmBtnTipoPart")?.classList.toggle("active", esPart);
        document.getElementById("cmBloqueParticular17")?.classList.toggle("hidden", !esPart);
        document.getElementById("cmBloqueObraSocial17")?.classList.toggle("hidden", esPart);
        const lbl = document.getElementById("cmLblNombre17");
        if (lbl) lbl.textContent = esPart ? "Nombre de Tarifa Particular *" : "Nombre de la Obra Social / Prepaga *";
        recalcPreviewMutual17();
    };

    window.recalcPreviewMutual17 = function () {
        const box = document.getElementById("cmNetoPreview17");
        if (!box) return;
        const valOS = Number(document.getElementById("cmValMut")?.value) || 0;
        const cos = Number(document.getElementById("cmCoseg")?.value) || 0;
        const pct = Math.max(0, Math.min(50, parseFloat(document.getElementById("cmDescCol")?.value) || 0));
        const desc = Math.round(valOS * (pct / 100));
        const netoOS = Math.max(0, valOS - desc);
        box.innerHTML = `
            💡 <b>Cálculo neto por sesión:</b> Obra Social <b>${fmt17(valOS)}</b> − Colegio (${pct}%: <b>-${fmt17(desc)}</b>) = <b>${fmt17(netoOS)}</b> neto mutual
            ${cos > 0 ? ` + Coseguro <b>${fmt17(cos)}</b> = <b style="color:#047857;">${fmt17(netoOS + cos)} total real</b>` : ` = <b style="color:#047857;">${fmt17(netoOS)} total real</b>`}
        `;
    };

    window.guardarMutualConsultorio = function (e, idEdit, espFija) {
        e.preventDefault();
        const db = obtenerDatosConsultorioCDM();
        const existente = idEdit ? (db.mutuales || []).find(x => x.id === idEdit) : null;
        const esPart = document.getElementById("cmEsParticular17")?.value === "1";
        const modoToken = esPart ? "sin_token" : (document.getElementById("cmModoToken")?.value || "semanal");

        const obj = {
            ...(existente || {}),
            id: idEdit || (`mut_${Date.now()}_${norm17(espFija)}`),
            especialidad: espFija,
            esParticular: esPart,
            nombre: (document.getElementById("cmNom")?.value || "").trim(),
            valorMutual: esPart ? 0 : (Number(document.getElementById("cmValMut")?.value) || 0),
            coseguro: esPart ? 0 : (Number(document.getElementById("cmCoseg")?.value) || 0),
            valorParticular: esPart ? (Number(document.getElementById("cmValPart")?.value) || 0) : 0,
            requiereToken: !esPart && modoToken !== "sin_token",
            modoToken,
            topeMensual: esPart ? 0 : (Number(document.getElementById("cmTopeMes")?.value) || 0),
            topeAnual: esPart ? 0 : (Number(document.getElementById("cmTopeAnio")?.value) || 0),
            frecuenciaPresentacion: esPart ? "por_dia" : (document.getElementById("cmFrecPres")?.value || "mensual"),
            liquidacionesMes: esPart ? "variable" : (document.getElementById("cmLiqMes")?.value || "2"),
            descuentoColegioPct: esPart ? 0 : (parseFloat(document.getElementById("cmDescCol")?.value) || 0),
            estadoConvenio: esPart ? "activo" : (document.getElementById("cmEstadoConv")?.value || "activo"),
            demoraEstimada: esPart ? "" : (document.getElementById("cmDemora")?.value || "").trim(),
            notas: (document.getElementById("cmNotas")?.value || "").trim()
        };

        if (idEdit) {
            const i = db.mutuales.findIndex(x => x.id === idEdit);
            if (i >= 0) db.mutuales[i] = obj;
        } else {
            db.mutuales.push(obj);
        }

        guardarDatosConsultorioCDM(db);
        cerrarModalConsultorioCDM();
        toast17(`🏥 ${esPart ? "Tarifa particular" : "Convenio"} guardado en ${espFija}: ${obj.nombre}`);
        renderizarConsultorioCompleto();
    };

    // =====================================================================
    // 5. PACIENTES CON REGLA DE TOKEN INDIVIDUAL + DESCUENTO DE SESIONES
    // =====================================================================
    const _origAbrirPac17 = window.abrirModalPacienteConsultorio;
    const _origGuardarPac17 = window.guardarPacienteConsultorio;

    window.abrirModalPacienteConsultorio = function (idPac = null, espForzada = null) {
        if (typeof _origAbrirPac17 === "function") {
            _origAbrirPac17.apply(this, arguments);
        }
        const modal = document.getElementById("modalConsultorioProCDM");
        const form = modal?.querySelector("form");
        if (!form || form.querySelector("#cpBloqueObra17")) return;

        const db = obtenerDatosConsultorioCDM();
        const p = idPac ? (db.pacientes || []).find(x => Number(x.id) === Number(idPac)) : null;
        const cupo = p ? calcularCupoPacienteCons17(db, p) : null;
        const anioAct = new Date().getFullYear();
        const prevAnioVal = (p && (!p.anioSesionesPrevias || Number(p.anioSesionesPrevias) === anioAct))
            ? (p.sesionesPreviasAnio ?? 0)
            : 0;

        const bloque = document.createElement("div");
        bloque.id = "cpBloqueObra17";
        bloque.style.cssText = "background:rgba(2,132,199,0.06); border:1px solid rgba(2,132,199,0.25); border-radius:13px; padding:0.7rem 0.8rem; margin-bottom:0.75rem;";
        bloque.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem; flex-wrap:wrap; margin-bottom:0.5rem;">
                <strong style="font-size:0.78rem; color:var(--ink-800);">🔑 Regla de Token y Cupo de Sesiones (${anioAct})</strong>
                ${cupo && !cupo.esParticular ? `
                    <span class="badge ${cupo.excedidoMes || cupo.excedidoAnio ? "badge-danger" : "badge-ok"}" style="font-size:0.66rem;">
                        Mes: ${cupo.atendidosMes}${cupo.topeMes ? `/${cupo.topeMes}` : ""} • Año ${anioAct}: ${cupo.usadasAnio}${cupo.topeAnio ? `/${cupo.topeAnio}` : ""}
                    </span>
                ` : ""}
            </div>
            <div class="grid-2" style="margin-bottom:0.5rem;">
                <div class="field">
                    <label>¿Cómo se autoriza / pide token a este paciente?</label>
                    <select id="cpModoTokenPac17">
                        <option value="heredar" ${(!p?.modoTokenPaciente || p.modoTokenPaciente === "heredar") ? "selected" : ""}>🔗 Heredar regla de la Obra Social</option>
                        ${MODOS_TOKEN.map(mt => `<option value="${mt.clave}" ${p?.modoTokenPaciente === mt.clave ? "selected" : ""}>${mt.label}</option>`).join("")}
                    </select>
                </div>
                <div class="field">
                    <label>Sesiones ya usadas en ${anioAct} (antes del sistema)</label>
                    <input type="number" id="cpSesPrevAnio17" min="0" max="365" value="${prevAnioVal}">
                    <input type="hidden" id="cpAnioPrev17" value="${anioAct}">
                </div>
            </div>
            <div class="grid-3">
                <div class="field"><label>Cupo Mes propio (vacío = mutual)</label><input type="number" id="cpTopeMes17" min="0" max="60" value="${p?.topeMensualCustom ?? ""}" placeholder="Heredar"></div>
                <div class="field"><label>Cupo Año propio (vacío = mutual)</label><input type="number" id="cpTopeAnio17" min="0" max="365" value="${p?.topeAnualCustom ?? ""}" placeholder="Heredar"></div>
                <div class="field"><label>Nota de autorización (opc.)</label><input type="text" id="cpNotaTok17" value="${esc17(p?.notaTokenPaciente || "")}" placeholder="Ej: Pide token los lunes"></div>
            </div>
        `;

        const btnSubmit = form.querySelector('button[type="submit"]');
        if (btnSubmit) form.insertBefore(bloque, btnSubmit);
        else form.appendChild(bloque);
    };

    window.guardarPacienteConsultorio = function (e, idEdit, espFija) {
        const modoTokenPaciente = document.getElementById("cpModoTokenPac17")?.value || "heredar";
        const sesionesPreviasAnio = Number(document.getElementById("cpSesPrevAnio17")?.value) || 0;
        const anioSesionesPrevias = Number(document.getElementById("cpAnioPrev17")?.value) || new Date().getFullYear();
        const topeMesRaw = document.getElementById("cpTopeMes17")?.value;
        const topeAnioRaw = document.getElementById("cpTopeAnio17")?.value;
        const notaTokenPaciente = (document.getElementById("cpNotaTok17")?.value || "").trim();
        const dniVal = (document.getElementById("cpDni")?.value || "").trim();
        const nomVal = (document.getElementById("cpNom")?.value || "").trim();

        if (typeof _origGuardarPac17 === "function") {
            _origGuardarPac17.apply(this, arguments);
        }

        const db = obtenerDatosConsultorioCDM();
        let pac = idEdit ? (db.pacientes || []).find(x => Number(x.id) === Number(idEdit)) : null;
        if (!pac && db.pacientes.length) {
            pac = [...db.pacientes].reverse().find(x => x.dni === dniVal && x.nombre === nomVal) || db.pacientes[db.pacientes.length - 1];
        }
        if (pac) {
            pac.modoTokenPaciente = modoTokenPaciente;
            pac.sesionesPreviasAnio = sesionesPreviasAnio;
            pac.anioSesionesPrevias = anioSesionesPrevias;
            pac.topeMensualCustom = topeMesRaw !== "" && topeMesRaw !== undefined ? Number(topeMesRaw) : "";
            pac.topeAnualCustom = topeAnioRaw !== "" && topeAnioRaw !== undefined ? Number(topeAnioRaw) : "";
            pac.notaTokenPaciente = notaTokenPaciente;
            guardarDatosConsultorioCDM(db);
            renderizarConsultorioCompleto();
        }
    };

    function enriquecerTablaPacientesConCupo17(sec, db, espAct) {
        const pacsEsp = (db.pacientes || []).filter(p => mismaEsp17(p.especialidad, espAct));
        const mapaPac = new Map(pacsEsp.map(p => [Number(p.id), p]));

        sec.querySelectorAll(".cons-pac-desktop-table tbody tr").forEach(tr => {
            if (tr.dataset.c17Enriched === "1") return;
            const btnHist = tr.querySelector('button[onclick*="abrirHistoriaClinicaPacienteCDM("]');
            const mId = btnHist?.getAttribute("onclick")?.match(/\((\d+)/);
            if (!mId) return;
            const pac = mapaPac.get(Number(mId[1]));
            if (!pac) return;
            tr.dataset.c17Enriched = "1";

            const tdMut = tr.children[2];
            if (!tdMut) return;
            const cupo = calcularCupoPacienteCons17(db, pac);
            const regla = obtenerReglaTokenPaciente17(db, pac, cupo?.mutual);
            if (cupo && !cupo.esParticular) {
                const badgeCls = (cupo.excedidoMes || cupo.excedidoAnio) ? "badge-danger" : (cupo.alertaBaja ? "badge-warn" : "badge-ok");
                const txtMes = cupo.topeMes > 0 ? `${cupo.atendidosMes}/${cupo.topeMes} mes` : `${cupo.atendidosMes} mes`;
                const txtAnio = cupo.topeAnio > 0 ? `${cupo.usadasAnio}/${cupo.topeAnio} año` : `${cupo.usadasAnio} año`;
                const txtResta = cupo.restanAnio !== null ? ` (restan ${cupo.restanAnio})` : (cupo.restanMes !== null ? ` (restan ${cupo.restanMes}/mes)` : "");
                tdMut.insertAdjacentHTML("beforeend", `
                    <div class="c17-cupo-bar" style="margin-top:4px;">
                        <span class="badge ${badgeCls}" style="font-size:0.64rem;">🎯 ${txtMes} • ${txtAnio}${txtResta}</span>
                        <span class="badge badge-purple" style="font-size:0.63rem;" title="${esc17(regla.nota || regla.origen)}">🔑 ${esc17(labelModoToken17(regla.clave, true))}</span>
                    </div>
                `);
            }
        });

        sec.querySelectorAll(".cons-pac-row-mob").forEach(row => {
            if (row.dataset.c17Enriched === "1") return;
            const info = row.querySelector(".cons-pac-row-info");
            const mId = info?.getAttribute("onclick")?.match(/\((\d+)/);
            if (!mId) return;
            const pac = mapaPac.get(Number(mId[1]));
            if (!pac) return;
            row.dataset.c17Enriched = "1";
            const cupo = calcularCupoPacienteCons17(db, pac);
            if (cupo && !cupo.esParticular && (cupo.topeMes > 0 || cupo.topeAnio > 0)) {
                const badgeCls = (cupo.excedidoMes || cupo.excedidoAnio) ? "badge-danger" : "badge-ok";
                info.insertAdjacentHTML("beforeend", `
                    <span class="badge ${badgeCls}" style="font-size:0.61rem; margin-top:3px;">
                        🎯 ${cupo.atendidosMes}${cupo.topeMes ? `/${cupo.topeMes}` : ""} mes • ${cupo.usadasAnio}${cupo.topeAnio ? `/${cupo.topeAnio}` : ""} año
                    </span>
                `);
            }
        });
    }

    // =====================================================================
    // 6. MODAL DE TURNO INTELIGENTE (SEPARACIÓN OS vs PARTICULAR + ALERTA CUPO)
    // =====================================================================
    const _origSelDia17 = window.seleccionarDiaCalendarioCons;
    if (typeof _origSelDia17 === "function") {
        window.seleccionarDiaCalendarioCons = function (fechaISO) {
            ui17.fechaSel = fechaISO;
            return _origSelDia17.apply(this, arguments);
        };
    }

    const _origAbrirTurno17 = window.abrirModalTurnoConsultorio;
    const _origGuardarTurno17 = window.guardarTurnoConsultorio;
    const _origCambiarEstTurno17 = window.cambiarEstadoTurnoCons;
    const _origElimTurno17 = window.eliminarTurnoCons;

    function refrescarCamposPrecioYCupoEnModalTurno17(espDef) {
        const db = obtenerDatosConsultorioCDM();
        const mutId = document.getElementById("ctMutId")?.value;
        const pacId = document.getElementById("ctPacId")?.value;
        const fecha = document.getElementById("ctFecha")?.value || hoy17();
        const mut = resolverMutual17(db, mutId, espDef);
        const esPart = !mut || mut.esParticular;

        const fValMut = document.getElementById("ctValMut")?.closest(".field");
        const fCoseg = document.getElementById("ctCoseg")?.closest(".field");
        const fValPart = document.getElementById("ctValPart")?.closest(".field");
        const fToken = document.getElementById("ctToken")?.closest(".field");
        const gridPrecios = fValMut?.parentElement;

        if (fValMut) fValMut.style.display = esPart ? "none" : "";
        if (fCoseg) fCoseg.style.display = esPart ? "none" : "";
        if (fValPart) fValPart.style.display = esPart ? "" : "none";
        if (fToken) fToken.style.opacity = esPart ? "0.45" : "1";
        if (gridPrecios) gridPrecios.style.gridTemplateColumns = esPart ? "1fr" : "1fr 1fr";

        let infoBox = document.getElementById("ctInfoCupoYRegla17");
        if (!infoBox && gridPrecios) {
            infoBox = document.createElement("div");
            infoBox.id = "ctInfoCupoYRegla17";
            infoBox.style.cssText = "border-radius:11px; padding:0.52rem 0.72rem; margin-bottom:0.65rem; font-size:0.75rem;";
            gridPrecios.insertAdjacentElement("beforebegin", infoBox);
        }
        if (!infoBox) return;

        if (esPart) {
            infoBox.style.display = "block";
            infoBox.style.background = "rgba(16, 185, 129, 0.09)";
            infoBox.style.border = "1px solid rgba(16, 185, 129, 0.35)";
            infoBox.innerHTML = `💵 <b>Sesión Particular:</b> se cobra únicamente el valor total directo (sin obra social, coseguro ni token).`;
            return;
        }

        const pac = pacId ? (db.pacientes || []).find(p => Number(p.id) === Number(pacId)) : null;
        const cupo = pac ? calcularCupoPacienteCons17(db, pac, fecha) : null;
        const regla = obtenerReglaTokenPaciente17(db, pac, mut);
        const descCol = Number(mut.descuentoColegioPct) || 0;
        const alerta = cupo && (cupo.excedidoMes || cupo.excedidoAnio);

        infoBox.style.display = "block";
        infoBox.style.background = alerta ? "rgba(239, 68, 68, 0.1)" : "rgba(2, 132, 199, 0.08)";
        infoBox.style.border = alerta ? "1.5px solid #ef4444" : "1px solid rgba(2, 132, 199, 0.28)";

        let html = `<div>🏥 <b>${esc17(mut.nombre)}</b> • 🔑 <b>${esc17(labelModoToken17(regla.clave))}</b>`;
        if (descCol > 0) html += ` • 🏛️ Desc. Colegio: <b>${descCol}%</b>`;
        html += `</div>`;

        if (cupo) {
            const mTxt = cupo.topeMes > 0 ? `${cupo.atendidosMes}/${cupo.topeMes} este mes` : `${cupo.atendidosMes} este mes`;
            const aTxt = cupo.topeAnio > 0 ? `${cupo.usadasAnio}/${cupo.topeAnio} en ${cupo.anioRef}` : `${cupo.usadasAnio} en ${cupo.anioRef}`;
            html += `<div style="margin-top:3px;">🎯 <b>Sesiones atendidas de ${esc17(pac.nombre)}:</b> ${mTxt} • ${aTxt}`;
            if (cupo.restanAnio !== null) html += ` — <b>Quedan ${cupo.restanAnio} en el año</b>`;
            else if (cupo.restanMes !== null) html += ` — <b>Quedan ${cupo.restanMes} en el mes</b>`;
            html += `</div>`;
            if (alerta) {
                html += `<div style="margin-top:3px; color:#b91c1c; font-weight:800;">⚠️ Cupo cubierto alcanzado: verificá si corresponde coseguro excedente o cambiar a Particular.</div>`;
            }
        }
        if (regla.nota) html += `<div style="margin-top:2px; color:var(--ink-600);">📝 ${esc17(regla.nota)}</div>`;
        infoBox.innerHTML = html;
    }

    window.abrirModalTurnoConsultorio = function (idTurno = null, fechaPre = null, idPacPre = null) {
        if (typeof _origAbrirTurno17 === "function") _origAbrirTurno17.apply(this, arguments);
        const espDef = obtenerEspActiva17();
        refrescarCamposPrecioYCupoEnModalTurno17(espDef);
        document.getElementById("ctFecha")?.addEventListener("change", () => refrescarCamposPrecioYCupoEnModalTurno17(espDef));
    };

    const _origAutoPacTurno17 = window.autocompletarPacienteEnTurno;
    window.autocompletarPacienteEnTurno = function (idPac, espDef) {
        if (typeof _origAutoPacTurno17 === "function") _origAutoPacTurno17.apply(this, arguments);
        refrescarCamposPrecioYCupoEnModalTurno17(espDef || obtenerEspActiva17());
    };

    const _origActPrecios17 = window.actualizarPreciosModalTurno;
    window.actualizarPreciosModalTurno = function (mutId) {
        if (typeof _origActPrecios17 === "function") _origActPrecios17.apply(this, arguments);
        refrescarCamposPrecioYCupoEnModalTurno17(obtenerEspActiva17());
    };

    window.guardarTurnoConsultorio = function (e, idEdit, espFija) {
        const dbPre = obtenerDatosConsultorioCDM();
        const mutId = document.getElementById("ctMutId")?.value;
        const mut = resolverMutual17(dbPre, mutId, espFija);
        const esPart = !mut || mut.esParticular;

        if (esPart) {
            if (document.getElementById("ctValMut")) document.getElementById("ctValMut").value = 0;
            if (document.getElementById("ctCoseg")) document.getElementById("ctCoseg").value = 0;
        } else {
            if (document.getElementById("ctValPart")) document.getElementById("ctValPart").value = 0;
        }

        if (typeof _origGuardarTurno17 === "function") _origGuardarTurno17.apply(this, arguments);

        const db = obtenerDatosConsultorioCDM();
        const t = idEdit
            ? (db.turnos || []).find(x => Number(x.id) === Number(idEdit))
            : db.turnos[db.turnos.length - 1];
        if (t) {
            if (!esPart && (t.descuentoColegioPct === undefined || t.descuentoColegioPct === "")) {
                t.descuentoColegioPct = Number(mut?.descuentoColegioPct) || 0;
            }
            if (t.token && String(t.token).trim()) t.tokenEntregado = true;
            guardarDatosConsultorioCDM(db);
            sincronizarCajaDesdeTurno17(db, t);
            renderizarConsultorioCompleto();
        }
    };

    window.cambiarEstadoTurnoCons = function (idTurno, nuevoEstado) {
        if (typeof _origCambiarEstTurno17 === "function") _origCambiarEstTurno17.apply(this, arguments);
        const db = obtenerDatosConsultorioCDM();
        const t = (db.turnos || []).find(x => Number(x.id) === Number(idTurno));
        if (t) {
            sincronizarCajaDesdeTurno17(db, t);
            if (nuevoEstado === "atendido" && t.pacienteId) {
                const pac = db.pacientes.find(p => Number(p.id) === Number(t.pacienteId));
                const cupo = pac ? calcularCupoPacienteCons17(db, pac, t.fecha) : null;
                if (cupo && !cupo.esParticular && (cupo.topeMes > 0 || cupo.topeAnio > 0)) {
                    const txtM = cupo.topeMes > 0 ? `${cupo.atendidosMes}/${cupo.topeMes} mes` : `${cupo.atendidosMes} mes`;
                    const txtA = cupo.topeAnio > 0 ? `${cupo.usadasAnio}/${cupo.topeAnio} año` : `${cupo.usadasAnio} año`;
                    toast17(`🎯 Cupo actualizado de ${pac.nombre}: ${txtM} • ${txtA}`);
                }
            }
        }
        if (typeof window.refrescarFinanzasSiVisible === "function") window.refrescarFinanzasSiVisible();
    };

    window.eliminarTurnoCons = function (idTurno) {
        if (typeof _origElimTurno17 === "function") _origElimTurno17.apply(this, arguments);
        window.reconstruirAsientosConsultorioEnCaja17();
        if (typeof window.refrescarFinanzasSiVisible === "function") window.refrescarFinanzasSiVisible();
    };

    // =====================================================================
    // 7. TABLERO MAESTRO DE COBRANZAS, TOKENS Y LIQUIDACIONES ATRASADAS
    // =====================================================================
    function obtenerTurnosFiltradosCobranza17(db, espFija = null) {
        const espFiltro = espFija && espFija !== "TODAS"
            ? espFija
            : (ui17.cobEsp && ui17.cobEsp !== "ACTIVA" && ui17.cobEsp !== "TODAS" ? ui17.cobEsp : null);
        const q = norm17(ui17.cobBusq);

        return (db.turnos || [])
            .filter(t => {
                if (!t || t.estado === "cancelado") return false;
                if (espFiltro && !mismaEsp17(t.especialidad, espFiltro)) return false;

                if (ui17.cobMesTrabajo !== "TODOS") {
                    if (ui17.cobModoMes === "cobro") {
                        const cobCosEnMes = Boolean(t.coseguroCobrado) && String(t.fechaPagoCoseguro || t.fecha || "").startsWith(ui17.cobMesTrabajo);
                        const cobOsEnMes = Boolean(t.mutualCobrada) && String(t.fechaPagoMutual || "").startsWith(ui17.cobMesTrabajo);
                        if (!cobCosEnMes && !cobOsEnMes) return false;
                    } else {
                        if (!String(t.fecha || "").startsWith(ui17.cobMesTrabajo)) return false;
                    }
                }

                if (ui17.cobMutId !== "TODAS") {
                    const m = resolverMutual17(db, t.mutualId, t.especialidad);
                    if (!m || m.id !== ui17.cobMutId) return false;
                }
                if (ui17.cobPacId !== "TODOS" && Number(t.pacienteId) !== Number(ui17.cobPacId)) return false;

                const f = analizarFinanzasTurno17(db, t);
                if (ui17.cobEstado === "pendiente_cobro" && f.completo) return false;
                if (ui17.cobEstado === "falta_token" && !f.faltaToken) return false;
                if (ui17.cobEstado === "falta_coseg" && !f.faltaCoseg) return false;
                if (ui17.cobEstado === "falta_os" && !f.faltaOS) return false;
                if (ui17.cobEstado === "completos" && !f.completo) return false;

                if (q) {
                    const hay = norm17(`${t.pacienteNombre} ${f.pac?.dni || ""} ${f.pac?.nroAfiliado || ""} ${t.mutualNombre} ${t.token || ""} ${t.liquidacionRef || ""} ${t.fecha}`);
                    if (!hay.includes(q)) return false;
                }
                return true;
            })
            .sort((a, b) => `${b.fecha || ""} ${b.hora || ""}`.localeCompare(`${a.fecha || ""} ${a.hora || ""}`));
    }

    function refrescarVistasCobranza17() {
        const secCons = document.getElementById("cdmSeccionConsultorioGlobal");
        if (secCons && !secCons.classList.contains("hidden")) {
            renderizarConsultorioCompleto();
        }
        if (typeof window.refrescarFinanzasSiVisible === "function") {
            window.refrescarFinanzasSiVisible();
        }
    }

    window.renderizarPanelCobranzaConsultorio17 = function (cont, opts = {}) {
        if (!cont) return;
        inyectarCSS17();

        const db = obtenerDatosConsultorioCDM();
        const desdeCaja = Boolean(opts.desdeCaja);
        const espContexto = opts.espFiltro || (desdeCaja ? "TODAS" : obtenerEspActiva17());
        const profs = typeof obtenerEspecialidadesHabilitadasConsultorioCDM === "function"
            ? obtenerEspecialidadesHabilitadasConsultorioCDM()
            : [];
        const espEfectiva = espContexto !== "TODAS"
            ? espContexto
            : (ui17.cobEsp && ui17.cobEsp !== "ACTIVA" ? ui17.cobEsp : "TODAS");

        const mutualesVisibles = (db.mutuales || [])
            .filter(m => espEfectiva === "TODAS" || mismaEsp17(m.especialidad, espEfectiva))
            .map(m => normalizarMutual17(m, db, m.especialidad));
        const pacsVisibles = (db.pacientes || [])
            .filter(p => espEfectiva === "TODAS" || mismaEsp17(p.especialidad, espEfectiva))
            .sort((a, b) => String(a.apellido || "").localeCompare(String(b.apellido || "")));

        const regs = obtenerTurnosFiltradosCobranza17(db, espEfectiva);

        let totCobradoReal = 0, totFaltaCobrar = 0, totDescColegio = 0, faltanTokens = 0, cantCompletos = 0;
        regs.forEach(t => {
            const f = analizarFinanzasTurno17(db, t);
            totCobradoReal += f.totalCobradoReal;
            totFaltaCobrar += f.totalPendienteReal;
            totDescColegio += f.descMonto;
            if (f.faltaToken) faltanTokens++;
            if (f.completo) cantCompletos++;
        });

        const descDef = obtenerDescColegioDefecto17(db, espEfectiva === "TODAS" ? obtenerEspActiva17() : espEfectiva);

        cont.innerHTML = `
            <div class="cons-card" id="c17CobranzaRoot" data-desde-caja="${desdeCaja ? "1" : "0"}" data-esp-ctx="${esc17(espContexto)}">
                <div class="cons-card-head">
                    <div>
                        <h3>💳 Cobranzas, Tokens y Liquidaciones de Mutuales${espEfectiva !== "TODAS" ? ` — ${esc17(espEfectiva)}` : ""}</h3>
                        <small style="color:var(--ink-500); font-size:0.74rem;">
                            Tildá tokens, coseguros y liquidaciones (incluso meses anteriores). Todo cobro impacta en Caja con su <b>fecha real de pago</b>.
                        </small>
                    </div>
                    <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                        <button type="button" class="btn btn-ok btn-sm" onclick="abrirModalLiquidacionMasiva17('${escJs17(espEfectiva)}')">💰 Liquidar Mutual</button>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="abrirModalConfigColegio17('${escJs17(espEfectiva === "TODAS" ? obtenerEspActiva17() : espEfectiva)}')">⚙️ % Colegio (${descDef}%)</button>
                        <button type="button" class="btn btn-ghost btn-sm" onclick="exportarCobranzasCSV17('${escJs17(espEfectiva)}')">📊 CSV</button>
                        <button type="button" class="btn btn-primary btn-sm" onclick="imprimirCobranzasPDF17('${escJs17(espEfectiva)}')">🖨️ PDF A4</button>
                    </div>
                </div>

                <!-- KPIs REALES DE COBRANZA -->
                <div class="c17-kpi-5">
                    <div class="cons-kpi" style="border-top-color:#10b981;">
                        <small>Cobrado Real (Neto)</small>
                        <strong style="color:#059669;">${fmt17(totCobradoReal)}</strong>
                    </div>
                    <div class="cons-kpi" style="border-top-color:${totFaltaCobrar > 0 ? "#ef4444" : "#10b981"};">
                        <small>Falta Cobrar (Neto)</small>
                        <strong style="color:${totFaltaCobrar > 0 ? "#dc2626" : "#059669"};">${fmt17(totFaltaCobrar)}</strong>
                    </div>
                    <div class="cons-kpi" style="border-top-color:#6366f1;">
                        <small>Desc. Colegio</small>
                        <strong>-${fmt17(totDescColegio)}</strong>
                    </div>
                    <div class="cons-kpi" style="border-top-color:#0284c7;">
                        <small>Completos / Total</small>
                        <strong>${cantCompletos} / ${regs.length}</strong>
                    </div>
                    <div class="cons-kpi" style="border-top-color:${faltanTokens > 0 ? "#f59e0b" : "#10b981"};">
                        <small>Faltan Tokens</small>
                        <strong>${faltanTokens}</strong>
                    </div>
                </div>

                <!-- SUB-VISTAS (4 VISTAS CLAVE) -->
                <div class="c17-subtabs">
                    <button type="button" class="c17-subtab ${ui17.cobSubTab === "sesiones" ? "active" : ""}" onclick="setCobFiltro17('cobSubTab','sesiones')">📋 Sesiones y Checklist (${regs.length})</button>
                    <button type="button" class="c17-subtab ${ui17.cobSubTab === "pacientes" ? "active" : ""}" onclick="setCobFiltro17('cobSubTab','pacientes')">👤 Por Paciente</button>
                    <button type="button" class="c17-subtab ${ui17.cobSubTab === "mutuales" ? "active" : ""}" onclick="setCobFiltro17('cobSubTab','mutuales')">🏥 Por Mutual y Mes</button>
                    <button type="button" class="c17-subtab ${ui17.cobSubTab === "liquidaciones" ? "active" : ""}" onclick="setCobFiltro17('cobSubTab','liquidaciones')">🧾 Liquidaciones Cobradas</button>
                </div>

                <!-- FILTROS (CON ALTERNADOR MES TRABAJADO / MES COBRADO) -->
                <div class="c17-filter-bar">
                    <select onchange="setCobFiltro17('cobModoMes', this.value)" title="Elegir si el mes filtra por cuándo trabajaste o cuándo cobraste">
                        <option value="trabajo" ${ui17.cobModoMes === "trabajo" ? "selected" : ""}>📅 Filtrar: Mes Trabajado</option>
                        <option value="cobro" ${ui17.cobModoMes === "cobro" ? "selected" : ""}>💰 Filtrar: Mes Cobrado</option>
                    </select>

                    <div style="display:flex; gap:0.3rem; align-items:center;">
                        <input type="month" value="${ui17.cobMesTrabajo === "TODOS" ? new Date().toISOString().slice(0, 7) : ui17.cobMesTrabajo}"
                            style="flex:1; min-width:0;"
                            onchange="setCobFiltro17('cobMesTrabajo', this.value)">
                        <button type="button" class="btn ${ui17.cobMesTrabajo === "TODOS" ? "btn-primary" : "btn-ghost"} btn-sm"
                            style="min-height:35px; font-size:0.71rem; padding:0 8px; flex-shrink:0;"
                            onclick="setCobFiltro17('cobMesTrabajo', ui17_toggleTodosMeses())" title="Ver todos los meses acumulados">
                            ${ui17.cobMesTrabajo === "TODOS" ? "✓ Todos" : "Todos"}
                        </button>
                    </div>

                    ${desdeCaja && profs.length > 1 ? `
                        <select onchange="setCobFiltro17('cobEsp', this.value)">
                            <option value="TODAS" ${espEfectiva === "TODAS" ? "selected" : ""}>Todas las Especialidades</option>
                            ${profs.map(pr => `<option value="${esc17(pr.clave)}" ${mismaEsp17(espEfectiva, pr.clave) ? "selected" : ""}>${pr.icono} ${esc17(pr.clave)}</option>`).join("")}
                        </select>
                    ` : ""}

                    <select onchange="setCobFiltro17('cobMutId', this.value)">
                        <option value="TODAS">Todas las Obras Sociales</option>
                        ${mutualesVisibles.map(m => `<option value="${esc17(m.id)}" ${ui17.cobMutId === m.id ? "selected" : ""}>${esc17(m.nombre)}</option>`).join("")}
                    </select>

                    <select onchange="setCobFiltro17('cobPacId', this.value)">
                        <option value="TODOS">Todos los Pacientes</option>
                        ${pacsVisibles.map(p => `<option value="${p.id}" ${String(ui17.cobPacId) === String(p.id) ? "selected" : ""}>${esc17(p.apellido)}, ${esc17(p.nombre)}</option>`).join("")}
                    </select>

                    <select onchange="setCobFiltro17('cobEstado', this.value)">
                        <option value="TODOS" ${ui17.cobEstado === "TODOS" ? "selected" : ""}>Todos los estados</option>
                        <option value="pendiente_cobro" ${ui17.cobEstado === "pendiente_cobro" ? "selected" : ""}>🔴 Falta cobrar algo</option>
                        <option value="falta_token" ${ui17.cobEstado === "falta_token" ? "selected" : ""}>🔑 Falta Token</option>
                        <option value="falta_coseg" ${ui17.cobEstado === "falta_coseg" ? "selected" : ""}>💵 Falta Coseg./Part.</option>
                        <option value="falta_os" ${ui17.cobEstado === "falta_os" ? "selected" : ""}>🏥 Falta Obra Social</option>
                        <option value="completos" ${ui17.cobEstado === "completos" ? "selected" : ""}>✅ Completos</option>
                    </select>

                    <input type="text" id="c17CobBusqInp" value="${esc17(ui17.cobBusq)}" placeholder="🔍 Buscar paciente, token..."
                        onchange="setCobFiltro17('cobBusq', this.value)">
                </div>

                <div id="c17CobSubBody"></div>
            </div>
        `;

        const body = document.getElementById("c17CobSubBody");
        if (!body) return;

        if (ui17.cobSubTab === "sesiones") renderCobSubSesiones17(body, db, regs);
        else if (ui17.cobSubTab === "pacientes") renderCobSubPacientes17(body, db, regs);
        else if (ui17.cobSubTab === "mutuales") renderCobSubMutuales17(body, db, regs);
        else renderCobSubLiquidaciones17(body, db, regs);
    };

    window.ui17_toggleTodosMeses = function () {
        return ui17.cobMesTrabajo === "TODOS" ? new Date().toISOString().slice(0, 7) : "TODOS";
    };

    window.setCobFiltro17 = function (clave, valor) {
        ui17[clave] = valor;
        refrescarVistasCobranza17();
    };

    window.verSesionesDePacienteEnCob17 = function (pacId) {
        ui17.cobPacId = String(pacId);
        ui17.cobSubTab = "sesiones";
        refrescarVistasCobranza17();
    };

    function renderCobSubSesiones17(cont, db, regs) {
        if (!regs.length) {
            cont.innerHTML = `<div class="empty-box" style="padding:1.25rem;">Sin sesiones en este filtro. Probá tocar <b>Todos</b> en el mes o alternar entre <b>Mes Trabajado</b> y <b>Mes Cobrado</b>.</div>`;
            return;
        }

        const filasPC = regs.map(t => {
            const f = analizarFinanzasTurno17(db, t);
            const mutCorta = (f.mut?.nombre || t.mutualNombre || "Particular").replace(/\s*\(Sin Obra Social\)/i, "");

            const celdaToken = f.esPart
                ? `<span style="color:var(--ink-400); font-size:0.74rem;">Particular</span>`
                : `
                    <div style="display:flex; flex-direction:column; gap:3px;">
                        <div style="display:flex; gap:4px; align-items:center;">
                            <label class="c17-check-pill ${f.tokenEntregado ? "is-ok" : (f.faltaToken ? "is-warn" : "")}" title="${esc17(labelModoToken17(f.reglaToken.clave))} (${esc17(f.reglaToken.origen)})">
                                <input type="checkbox" ${f.tokenEntregado ? "checked" : ""} onchange="toggleCheckCobranza17(${t.id}, 'tokenEntregado', this.checked)">
                                <span>🔑</span>
                            </label>
                            <input type="text" value="${esc17(t.token || "")}" placeholder="${esc17(labelModoToken17(f.reglaToken.clave, true))}"
                                style="width:100px; min-height:26px; font-size:0.73rem; padding:1px 6px; ${f.faltaToken ? "border-color:#ef4444;" : ""}"
                                onchange="actualizarTokenCob17(${t.id}, this.value)">
                        </div>
                        <label style="font-size:0.68rem; color:var(--ink-500); display:inline-flex; align-items:center; gap:3px; cursor:pointer;">
                            <input type="checkbox" ${t.presentado ? "checked" : ""} style="width:13px; height:13px; min-height:auto;" onchange="toggleCheckCobranza17(${t.id}, 'presentado', this.checked)">
                            <span>${t.presentado ? `📤 Presentado${t.mesPresentacion ? ` (${t.mesPresentacion})` : ""}` : "Marcar presentado"}</span>
                        </label>
                    </div>
                `;

            const celdaConsultorio = f.montoConsultorio <= 0
                ? `<span style="color:var(--ink-400); font-size:0.74rem;">$0</span>`
                : `
                    <label class="c17-check-pill ${f.cosegCobrado ? "is-ok" : "is-warn"}">
                        <input type="checkbox" ${f.cosegCobrado ? "checked" : ""} onchange="toggleCheckCobranza17(${t.id}, 'coseguroCobrado', this.checked)">
                        <span>${fmt17(f.montoConsultorio)}</span>
                    </label>
                    ${f.cosegCobrado ? `<small style="display:block; font-size:0.66rem; color:var(--ink-500); margin-top:2px;">📅 ${esc17(t.fechaPagoCoseguro || t.fecha)} • ${esc17(t.medioPagoCoseguro || "Efectivo")}</small>` : ""}
                `;

            const celdaOS = f.esPart || f.valOSBruto <= 0
                ? `<span style="color:var(--ink-400); font-size:0.74rem;">—</span>`
                : `
                    <label class="c17-check-pill ${f.osCobrada ? "is-ok" : "is-warn"}" title="Bruto ${fmt17(f.valOSBruto)} - ${f.descPct}% Colegio (${fmt17(f.descMonto)})">
                        <input type="checkbox" ${f.osCobrada ? "checked" : ""} onchange="toggleCheckCobranza17(${t.id}, 'mutualCobrada', this.checked)">
                        <span>${fmt17(f.valOSNeto)}</span>
                    </label>
                    <small style="display:block; font-size:0.66rem; color:var(--ink-500); margin-top:2px;">
                        ${f.descPct > 0 ? `Bruto ${fmt17(f.valOSBruto)} (-${f.descPct}%)` : `Sin desc.`}
                        ${f.osCobrada ? `<br>💰 ${esc17(t.fechaPagoMutual || "-")} ${t.liquidacionRef ? `• ${esc17(t.liquidacionRef)}` : ""}` : ""}
                    </small>
                `;

            return `
                <tr style="${f.completo ? "background:rgba(16,185,129,0.04);" : ""}">
                    <td>
                        <b>${esc17(t.fecha)}</b><br>
                        <small style="color:var(--ink-500);">Trab: <b>${esc17(formatearMesYM17(f.mesTrabajo))}</b></small>
                    </td>
                    <td>
                        <strong>${esc17(t.pacienteNombre)}</strong><br>
                        <small style="color:var(--ink-500);">${esc17(mutCorta)}${f.pac?.nroAfiliado ? ` • ${esc17(f.pac.nroAfiliado)}` : ""}</small>
                    </td>
                    <td>${celdaToken}</td>
                    <td>${celdaConsultorio}</td>
                    <td>${celdaOS}</td>
                    <td style="text-align:right; white-space:nowrap;">
                        <label class="c17-check-pill ${f.completo ? "is-done" : ""}" title="Tildar para marcar todo cobrado">
                            <input type="checkbox" ${f.completo ? "checked" : ""} onchange="toggleCobroCompleto17(${t.id}, this.checked)">
                            <span>${f.completo ? "✓ Completo" : "Completo"}</span>
                        </label>
                        <button type="button" class="btn btn-ghost btn-sm" style="min-height:26px; padding:0 6px; margin-left:3px;"
                            onclick="abrirModalDetalleCobroTurno17(${t.id})" title="Editar fecha de pago, mes liquidado, % colegio y medio">⚙️</button>
                    </td>
                </tr>
            `;
        }).join("");

        const cardsMovil = regs.map(t => {
            const f = analizarFinanzasTurno17(db, t);
            const mutCorta = (f.mut?.nombre || t.mutualNombre || "Particular").replace(/\s*\(Sin Obra Social\)/i, "");
            return `
                <div class="cons-lote-row-mob" style="border-left-color:${f.completo ? "#10b981" : (f.faltaToken ? "#ef4444" : "#f59e0b")};">
                    <div class="cons-lote-row-top">
                        <div>
                            <strong>${esc17(t.pacienteNombre)}</strong>
                            <small style="display:block; color:var(--ink-500);">${esc17(t.fecha)} (Trab: ${esc17(formatearMesYM17(f.mesTrabajo))}) • ${esc17(mutCorta)}</small>
                        </div>
                        <button type="button" class="btn btn-ghost btn-sm" style="min-height:26px; padding:0 7px;" onclick="abrirModalDetalleCobroTurno17(${t.id})">⚙️</button>
                    </div>
                    <div style="display:flex; gap:0.32rem; flex-wrap:wrap; align-items:center;">
                        ${!f.esPart ? `
                            <label class="c17-check-pill ${f.tokenEntregado ? "is-ok" : (f.faltaToken ? "is-warn" : "")}">
                                <input type="checkbox" ${f.tokenEntregado ? "checked" : ""} onchange="toggleCheckCobranza17(${t.id}, 'tokenEntregado', this.checked)">
                                <span>🔑 Token</span>
                            </label>
                        ` : ""}
                        ${f.montoConsultorio > 0 ? `
                            <label class="c17-check-pill ${f.cosegCobrado ? "is-ok" : "is-warn"}">
                                <input type="checkbox" ${f.cosegCobrado ? "checked" : ""} onchange="toggleCheckCobranza17(${t.id}, 'coseguroCobrado', this.checked)">
                                <span>${f.esPart ? "Part." : "Coseg."} ${fmt17(f.montoConsultorio)}</span>
                            </label>
                        ` : ""}
                        ${!f.esPart && f.valOSBruto > 0 ? `
                            <label class="c17-check-pill ${f.osCobrada ? "is-ok" : "is-warn"}">
                                <input type="checkbox" ${f.osCobrada ? "checked" : ""} onchange="toggleCheckCobranza17(${t.id}, 'mutualCobrada', this.checked)">
                                <span>OS ${fmt17(f.valOSNeto)}</span>
                            </label>
                        ` : ""}
                        <label class="c17-check-pill ${f.completo ? "is-done" : ""}">
                            <input type="checkbox" ${f.completo ? "checked" : ""} onchange="toggleCobroCompleto17(${t.id}, this.checked)">
                            <span>${f.completo ? "✓ Completo" : "Todo"}</span>
                        </label>
                    </div>
                </div>
            `;
        }).join("");

        cont.innerHTML = `
            <div class="table-wrap c17-desk-table">
                <table class="app-table" style="font-size:0.79rem;">
                    <thead>
                        <tr>
                            <th>Fecha / Mes Trab.</th>
                            <th>Paciente / Obra Social</th>
                            <th>🔑 Token y Presentación</th>
                            <th>💵 Coseguro / Part.</th>
                            <th>🏥 Obra Social (Neto)</th>
                            <th style="text-align:right;">Estado / Pago</th>
                        </tr>
                    </thead>
                    <tbody>${filasPC}</tbody>
                </table>
            </div>
            <div class="c17-mob-cards">${cardsMovil}</div>
        `;
    }

    function renderCobSubPacientes17(cont, db, regs) {
        if (!regs.length) {
            cont.innerHTML = `<div class="empty-box" style="padding:1.25rem;">Sin datos de pacientes para este período.</div>`;
            return;
        }
        const mapa = new Map();
        regs.forEach(t => {
            const k = t.pacienteId ? `id_${t.pacienteId}` : `nom_${norm17(t.pacienteNombre)}`;
            const f = analizarFinanzasTurno17(db, t);
            if (!mapa.has(k)) {
                mapa.set(k, {
                    pacId: t.pacienteId || null,
                    pac: f.pac,
                    nombre: t.pacienteNombre,
                    mutual: f.mut?.nombre || t.mutualNombre || "Particular",
                    sesiones: 0, faltaTok: 0, cobrado: 0, pendCoseg: 0, pendOS: 0
                });
            }
            const g = mapa.get(k);
            g.sesiones++;
            if (f.faltaToken) g.faltaTok++;
            g.cobrado += f.totalCobradoReal;
            g.pendCoseg += f.pendConsultorio;
            g.pendOS += f.pendOSNeto;
        });

        const lista = Array.from(mapa.values()).sort((a, b) => (b.pendCoseg + b.pendOS) - (a.pendCoseg + a.pendOS));

        cont.innerHTML = `
            <div class="table-wrap">
                <table class="app-table" style="font-size:0.8rem;">
                    <thead>
                        <tr>
                            <th>Paciente / Obra Social</th>
                            <th>Cupo Sesiones</th>
                            <th>Sesiones Filtro</th>
                            <th>Cobrado</th>
                            <th>Falta Coseg./Part.</th>
                            <th>Falta Obra Social (Neto)</th>
                            <th>Total Falta</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lista.map(g => {
                            const totalFalta = g.pendCoseg + g.pendOS;
                            const cupo = g.pac ? calcularCupoPacienteCons17(db, g.pac) : null;
                            const txtCupo = !cupo || cupo.esParticular
                                ? `<small style="color:var(--ink-400);">Particular</small>`
                                : `<span class="badge ${cupo.excedidoMes || cupo.excedidoAnio ? "badge-danger" : "badge-ok"}" style="font-size:0.68rem;">${cupo.atendidosMes}${cupo.topeMes ? `/${cupo.topeMes}` : ""} mes • ${cupo.usadasAnio}${cupo.topeAnio ? `/${cupo.topeAnio}` : ""} año</span>`;
                            return `
                                <tr>
                                    <td><strong>${esc17(g.nombre)}</strong><br><small style="color:var(--ink-500);">${esc17(g.mutual)}</small></td>
                                    <td>${txtCupo}</td>
                                    <td><b>${g.sesiones}</b>${g.faltaTok ? ` <span class="badge badge-danger" style="font-size:0.65rem;">🔑 -${g.faltaTok}</span>` : ""}</td>
                                    <td style="color:#059669; font-weight:800;">${fmt17(g.cobrado)}</td>
                                    <td>${g.pendCoseg > 0 ? `<b style="color:#b91c1c;">${fmt17(g.pendCoseg)}</b>` : "$0"}</td>
                                    <td>${g.pendOS > 0 ? `<b style="color:#b45309;">${fmt17(g.pendOS)}</b>` : "$0"}</td>
                                    <td><span class="badge ${totalFalta > 0 ? "badge-danger" : "badge-ok"}">${totalFalta > 0 ? fmt17(totalFalta) : "Al día ✓"}</span></td>
                                    <td style="text-align:right;">
                                        ${g.pacId ? `<button type="button" class="btn btn-ghost btn-sm" onclick="verSesionesDePacienteEnCob17(${g.pacId})">Ver →</button>` : ""}
                                    </td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        `;
    }

    function renderCobSubMutuales17(cont, db, regs) {
        if (!regs.length) {
            cont.innerHTML = `<div class="empty-box" style="padding:1.25rem;">Sin prestaciones para agrupar por mutual y mes de trabajo.</div>`;
            return;
        }
        const mapa = new Map();
        regs.forEach(t => {
            const f = analizarFinanzasTurno17(db, t);
            const mutId = f.mut?.id || t.mutualId || "part";
            const k = `${mutId}__${f.mesTrabajo}`;
            if (!mapa.has(k)) {
                mapa.set(k, {
                    mutId, mut: f.mut,
                    nombreMut: f.mut?.nombre || t.mutualNombre || "Particular",
                    esPart: f.esPart, mesTrabajo: f.mesTrabajo,
                    sesiones: 0, sinTok: 0, brutoOS: 0, descCol: 0,
                    netoOSCobrado: 0, netoOSPend: 0, cosegPend: 0, sesPendOS: 0,
                    esp: t.especialidad
                });
            }
            const g = mapa.get(k);
            g.sesiones++;
            if (f.faltaToken) g.sinTok++;
            g.brutoOS += f.valOSBruto;
            g.descCol += f.descMonto;
            g.netoOSCobrado += f.cobradoOSNeto;
            g.netoOSPend += f.pendOSNeto;
            g.cosegPend += f.pendConsultorio;
            if (f.faltaOS) g.sesPendOS++;
        });

        const lista = Array.from(mapa.values()).sort((a, b) => b.mesTrabajo.localeCompare(a.mesTrabajo) || b.netoOSPend - a.netoOSPend);

        cont.innerHTML = `
            <div class="table-wrap">
                <table class="app-table" style="font-size:0.79rem;">
                    <thead>
                        <tr>
                            <th>Obra Social / Regla</th>
                            <th>Mes Trabajado</th>
                            <th>Sesiones</th>
                            <th>Bruto OS / Desc. Col.</th>
                            <th>OS Cobrado (Neto)</th>
                            <th>Falta Cobrar OS</th>
                            <th style="text-align:right;">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lista.map(g => `
                            <tr>
                                <td>
                                    <strong>${esc17(g.nombreMut)}</strong>
                                    ${!g.esPart && g.mut ? `<br><small style="color:var(--ink-500);">📤 ${esc17(labelFrecPres17(g.mut.frecuenciaPresentacion))} • 💰 ${esc17(labelLiqMes17(g.mut.liquidacionesMes))}</small>` : ""}
                                </td>
                                <td><span class="badge badge-celeste">${esc17(formatearMesYM17(g.mesTrabajo))}</span></td>
                                <td><b>${g.sesiones}</b>${g.sinTok ? ` <span class="badge badge-danger" style="font-size:0.65rem;">-${g.sinTok} tok</span>` : ""}</td>
                                <td>${g.esPart ? "Particular" : `<b>${fmt17(g.brutoOS)}</b><br><small style="color:#b91c1c;">Col: -${fmt17(g.descCol)}</small>`}</td>
                                <td style="color:#059669; font-weight:800;">${fmt17(g.netoOSCobrado)}</td>
                                <td>
                                    ${g.netoOSPend > 0
                                        ? `<span class="badge badge-danger">${fmt17(g.netoOSPend)} (${g.sesPendOS})</span>`
                                        : `<span class="badge badge-ok">Cobrado ✓</span>`}
                                    ${g.cosegPend > 0 ? `<small style="display:block; color:#b45309; margin-top:2px;">+ Coseg/Part: ${fmt17(g.cosegPend)}</small>` : ""}
                                </td>
                                <td style="text-align:right;">
                                    ${!g.esPart && g.sesPendOS > 0 ? `
                                        <button type="button" class="btn btn-ok btn-sm"
                                            onclick="abrirModalLiquidacionMasiva17('${escJs17(g.esp)}', '${escJs17(g.mutId)}', '${escJs17(g.mesTrabajo)}')">
                                            💰 Liquidar
                                        </button>
                                    ` : `<span style="color:var(--ink-400); font-size:0.74rem;">—</span>`}
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `;
    }

    // NUEVA SUB-VISTA: HISTORIAL DE LIQUIDACIONES COBRADAS (AGRUPADAS POR FECHA DE PAGO Y MUTUAL)
    function renderCobSubLiquidaciones17(cont, db, regs) {
        const cobradas = regs.filter(t => {
            const f = analizarFinanzasTurno17(db, t);
            return !f.esPart && f.osCobrada;
        });

        if (!cobradas.length) {
            cont.innerHTML = `<div class="empty-box" style="padding:1.25rem;">Todavía no hay liquidaciones de obras sociales cobradas en este filtro. Usá <b>💰 Liquidar Mutual</b> para registrar un pago.</div>`;
            return;
        }

        const grupos = new Map();
        const conteoMesPorMut = new Map();

        cobradas.forEach(t => {
            const f = analizarFinanzasTurno17(db, t);
            const fechaPago = t.fechaPagoMutual || "-";
            const mesPago = fechaPago.slice(0, 7);
            const mutNom = f.mut?.nombre || t.mutualNombre || "Obra Social";
            const refLiq = t.liquidacionRef || "1ª Liquidación Mensual";
            const k = `${fechaPago}__${mutNom}__${refLiq}`;

            if (!grupos.has(k)) {
                grupos.set(k, {
                    fechaPago, mesPago, mutNom, refLiq,
                    liqConfig: f.mut ? labelLiqMes17(f.mut.liquidacionesMes) : "",
                    medio: t.medioPagoMutual || "Transferencia",
                    mesesTrab: new Set(),
                    sesiones: 0, bruto: 0, descCol: 0, neto: 0
                });
                const km = `${mesPago}__${mutNom}`;
                conteoMesPorMut.set(km, (conteoMesPorMut.get(km) || 0) + 1);
            }
            const g = grupos.get(k);
            g.mesesTrab.add(formatearMesYM17(f.mesTrabajo));
            g.sesiones++;
            g.bruto += f.valOSBruto;
            g.descCol += f.descMonto;
            g.neto += f.valOSNeto;
        });

        const lista = Array.from(grupos.values()).sort((a, b) => b.fechaPago.localeCompare(a.fechaPago));
        const totNeto = lista.reduce((a, g) => a + g.neto, 0);
        const totDesc = lista.reduce((a, g) => a + g.descCol, 0);

        cont.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.7rem; padding:0.55rem 0.75rem; background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.3); border-radius:12px; font-size:0.79rem;">
                <span>🧾 <b>${lista.length} liquidación(es) cobradas</b> en el período filtrado</span>
                <span>Desc. Colegio: <b style="color:#b91c1c;">-${fmt17(totDesc)}</b> • Neto acreditado en Caja: <b style="color:#059669;">${fmt17(totNeto)}</b></span>
            </div>
            <div class="table-wrap">
                <table class="app-table" style="font-size:0.79rem;">
                    <thead>
                        <tr>
                            <th>Fecha Pago</th>
                            <th>Obra Social / Liquidación</th>
                            <th>Meses Trabajados que pagó</th>
                            <th>Sesiones</th>
                            <th>Bruto / Desc. Col.</th>
                            <th>Neto a Caja</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lista.map(g => {
                            const cantMes = conteoMesPorMut.get(`${g.mesPago}__${g.mutNom}`) || 1;
                            return `
                                <tr>
                                    <td><b>${esc17(g.fechaPago)}</b><br><small style="color:var(--ink-500);">${esc17(g.medio)}</small></td>
                                    <td>
                                        <strong>${esc17(g.mutNom)}</strong>
                                        <span class="badge badge-purple" style="margin-left:4px; font-size:0.65rem;">${esc17(g.refLiq)}</span>
                                        <small style="display:block; color:var(--ink-500);">${cantMes} liq. registrada(s) en ${esc17(formatearMesYM17(g.mesPago))}${g.liqConfig ? ` • Pactado: ${esc17(g.liqConfig)}` : ""}</small>
                                    </td>
                                    <td>${Array.from(g.mesesTrab).map(m => `<span class="badge badge-celeste" style="font-size:0.66rem; margin-right:3px;">${esc17(m)}</span>`).join("")}</td>
                                    <td><b>${g.sesiones}</b></td>
                                    <td>${fmt17(g.bruto)}<br><small style="color:#b91c1c;">-${fmt17(g.descCol)}</small></td>
                                    <td><strong style="color:#059669;">${fmt17(g.neto)}</strong></td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        `;
    }

    // =====================================================================
    // 8. ACCIONES RÁPIDAS DE CHECKLIST + MODAL DETALLE DE PAGO + LIQUIDACIÓN MASIVA
    // =====================================================================
    window.actualizarTokenCob17 = function (idTurno, val) {
        const db = obtenerDatosConsultorioCDM();
        const t = (db.turnos || []).find(x => Number(x.id) === Number(idTurno));
        if (!t) return;
        t.token = String(val || "").trim();
        t.tokenEntregado = Boolean(t.token);
        guardarDatosConsultorioCDM(db);
        toast17("🔑 Token guardado.");
        refrescarVistasCobranza17();
    };

    window.toggleCheckCobranza17 = function (idTurno, campo, checked) {
        const db = obtenerDatosConsultorioCDM();
        const t = (db.turnos || []).find(x => Number(x.id) === Number(idTurno));
        if (!t) return;
        const hoy = hoy17();

        if (campo === "tokenEntregado") {
            t.tokenEntregado = Boolean(checked);
        } else if (campo === "presentado") {
            t.presentado = Boolean(checked);
            if (checked && !t.mesPresentacion) t.mesPresentacion = hoy.slice(0, 7);
        } else if (campo === "coseguroCobrado") {
            t.coseguroCobrado = Boolean(checked);
            if (checked) {
                t.fechaPagoCoseguro = t.fechaPagoCoseguro || hoy;
                t.medioPagoCoseguro = t.medioPagoCoseguro || "Efectivo";
            }
        } else if (campo === "mutualCobrada") {
            t.mutualCobrada = Boolean(checked);
            if (checked) {
                t.fechaPagoMutual = t.fechaPagoMutual || hoy;
                t.mesCobroMutual = t.fechaPagoMutual.slice(0, 7);
                t.medioPagoMutual = t.medioPagoMutual || "Transferencia";
                t.liquidacionRef = t.liquidacionRef || "1ª Liquidación Mensual";
                const fin = analizarFinanzasTurno17(db, t);
                t.descuentoColegioPct = fin.descPct;
            }
        }

        guardarDatosConsultorioCDM(db);
        sincronizarCajaDesdeTurno17(db, t);
        toast17(checked ? "✅ Estado actualizado y sincronizado con Caja." : "↺ Estado actualizado.");
        refrescarVistasCobranza17();
    };

    window.toggleCobroCompleto17 = function (idTurno, checked) {
        const db = obtenerDatosConsultorioCDM();
        const t = (db.turnos || []).find(x => Number(x.id) === Number(idTurno));
        if (!t) return;
        const fin = analizarFinanzasTurno17(db, t);
        const hoy = hoy17();

        if (checked) {
            if (fin.montoConsultorio > 0) {
                t.coseguroCobrado = true;
                t.fechaPagoCoseguro = t.fechaPagoCoseguro || hoy;
                t.medioPagoCoseguro = t.medioPagoCoseguro || "Efectivo";
            }
            if (!fin.esPart && fin.valOSBruto > 0) {
                t.mutualCobrada = true;
                t.fechaPagoMutual = t.fechaPagoMutual || hoy;
                t.mesCobroMutual = t.fechaPagoMutual.slice(0, 7);
                t.medioPagoMutual = t.medioPagoMutual || "Transferencia";
                t.liquidacionRef = t.liquidacionRef || "1ª Liquidación Mensual";
                t.descuentoColegioPct = fin.descPct;
            }
        } else {
            t.coseguroCobrado = false;
            t.mutualCobrada = false;
        }

        guardarDatosConsultorioCDM(db);
        sincronizarCajaDesdeTurno17(db, t);
        toast17(checked ? "✅ Sesión marcada COMPLETA e ingresada en Caja." : "↺ Sesión reabierta como pendiente.");
        refrescarVistasCobranza17();
    };

    window.abrirModalDetalleCobroTurno17 = function (idTurno) {
        const db = obtenerDatosConsultorioCDM();
        const t = (db.turnos || []).find(x => Number(x.id) === Number(idTurno));
        if (!t) return;
        const f = analizarFinanzasTurno17(db, t);
        const hoy = hoy17();

        const modal = asegurarModal17();
        modal.innerHTML = `
            <div class="modal-window" style="max-width:580px;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-celeste">💳 DETALLE DE COBRO Y LIQUIDACIÓN</span>
                        <h3 style="margin-top:4px;">${esc17(t.pacienteNombre)} — Trab: ${esc17(t.fecha)}</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalConsultorioCDM()">✕</button>
                </div>

                <form onsubmit="guardarDetalleCobroTurno17(event, ${t.id})">
                    ${!f.esPart ? `
                        <div style="background:var(--surface-subtle); border:1px solid var(--line); border-radius:12px; padding:0.7rem; margin-bottom:0.65rem;">
                            <strong style="font-size:0.78rem; display:block; margin-bottom:0.45rem;">🔑 Token y Presentación (${esc17(f.mut?.nombre || t.mutualNombre)})</strong>
                            <div class="grid-3">
                                <div class="field"><label>Código Token / Orden</label><input type="text" id="dcTok" value="${esc17(t.token || "")}"></div>
                                <div class="field"><label>Mes Presentación</label><input type="month" id="dcMesPres" value="${t.mesPresentacion || f.mesTrabajo}"></div>
                                <div class="field" style="justify-content:flex-end;">
                                    <label style="display:flex; align-items:center; gap:0.4rem; cursor:pointer; margin-top:18px;">
                                        <input type="checkbox" id="dcPres" ${t.presentado ? "checked" : ""} style="width:16px; height:16px; min-height:auto;"> Presentado
                                    </label>
                                </div>
                            </div>
                        </div>
                    ` : ""}

                    ${f.montoConsultorio > 0 ? `
                        <div style="background:rgba(16,185,129,0.07); border:1px solid rgba(16,185,129,0.3); border-radius:12px; padding:0.7rem; margin-bottom:0.65rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.45rem;">
                                <strong style="font-size:0.79rem;">💵 ${f.esPart ? "Sesión Particular" : "Coseguro"} (${fmt17(f.montoConsultorio)})</strong>
                                <label style="display:flex; align-items:center; gap:0.4rem; font-size:0.79rem; font-weight:800; cursor:pointer;">
                                    <input type="checkbox" id="dcCosCob" ${t.coseguroCobrado ? "checked" : ""} style="width:16px; height:16px; min-height:auto;"> Cobrado
                                </label>
                            </div>
                            <div class="grid-2">
                                <div class="field"><label>Fecha Real de Pago</label><input type="date" id="dcCosFec" value="${t.fechaPagoCoseguro || t.fecha || hoy}"></div>
                                <div class="field"><label>Medio de Pago</label>
                                    <select id="dcCosMed">${MEDIOS_CAJA_17.map(m => `<option ${((t.medioPagoCoseguro || "Efectivo") === m) ? "selected" : ""}>${m}</option>`).join("")}</select>
                                </div>
                            </div>
                        </div>
                    ` : ""}

                    ${!f.esPart && f.valOSBruto > 0 ? `
                        <div style="background:rgba(2,132,199,0.07); border:1px solid rgba(2,132,199,0.3); border-radius:12px; padding:0.7rem; margin-bottom:0.75rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.45rem;">
                                <strong style="font-size:0.79rem;">🏥 Liquidación Obra Social (Bruto ${fmt17(f.valOSBruto)})</strong>
                                <label style="display:flex; align-items:center; gap:0.4rem; font-size:0.79rem; font-weight:800; cursor:pointer;">
                                    <input type="checkbox" id="dcOsCob" ${t.mutualCobrada ? "checked" : ""} style="width:16px; height:16px; min-height:auto;"> Cobrada
                                </label>
                            </div>
                            <div class="grid-2" style="margin-bottom:0.5rem;">
                                <div class="field"><label>Fecha Real de Cobro (Caja)</label><input type="date" id="dcOsFec" value="${t.fechaPagoMutual || hoy}"></div>
                                <div class="field"><label>Liquidación</label>
                                    <select id="dcOsLiq">${TIPOS_LIQ_PAGO.map(l => `<option ${((t.liquidacionRef || TIPOS_LIQ_PAGO[0]) === l) ? "selected" : ""}>${l}</option>`).join("")}</select>
                                </div>
                            </div>
                            <div class="grid-2">
                                <div class="field"><label>% Descuento Colegio</label><input type="number" id="dcOsPct" min="0" max="50" step="0.1" value="${f.descPct}"></div>
                                <div class="field"><label>Medio de Ingreso</label>
                                    <select id="dcOsMed">${MEDIOS_CAJA_17.map(m => `<option ${((t.medioPagoMutual || "Transferencia") === m) ? "selected" : ""}>${m}</option>`).join("")}</select>
                                </div>
                            </div>
                            <small style="display:block; margin-top:4px; color:var(--ink-600);">
                                Mes trabajado: <b>${esc17(formatearMesYM17(f.mesTrabajo))}</b> • Neto estimado a Caja: <b>${fmt17(f.valOSNeto)}</b>
                            </small>
                        </div>
                    ` : ""}

                    <button type="submit" class="btn btn-primary" style="width:100%;">💾 Guardar y Actualizar Caja</button>
                </form>
            </div>
        `;
        modal.classList.remove("hidden");
    };

    window.guardarDetalleCobroTurno17 = function (e, idTurno) {
        e.preventDefault();
        const db = obtenerDatosConsultorioCDM();
        const t = (db.turnos || []).find(x => Number(x.id) === Number(idTurno));
        if (!t) return;

        if (document.getElementById("dcTok")) {
            t.token = document.getElementById("dcTok").value.trim();
            if (t.token) t.tokenEntregado = true;
            t.presentado = Boolean(document.getElementById("dcPres")?.checked);
            t.mesPresentacion = document.getElementById("dcMesPres")?.value || "";
        }
        if (document.getElementById("dcCosCob")) {
            t.coseguroCobrado = Boolean(document.getElementById("dcCosCob").checked);
            t.fechaPagoCoseguro = document.getElementById("dcCosFec")?.value || hoy17();
            t.medioPagoCoseguro = document.getElementById("dcCosMed")?.value || "Efectivo";
        }
        if (document.getElementById("dcOsCob")) {
            t.mutualCobrada = Boolean(document.getElementById("dcOsCob").checked);
            t.fechaPagoMutual = document.getElementById("dcOsFec")?.value || hoy17();
            t.mesCobroMutual = t.fechaPagoMutual.slice(0, 7);
            t.liquidacionRef = document.getElementById("dcOsLiq")?.value || TIPOS_LIQ_PAGO[0];
            t.descuentoColegioPct = parseFloat(document.getElementById("dcOsPct")?.value) || 0;
            t.medioPagoMutual = document.getElementById("dcOsMed")?.value || "Transferencia";
        }

        guardarDatosConsultorioCDM(db);
        sincronizarCajaDesdeTurno17(db, t);
        cerrarModalConsultorioCDM();
        toast17("💾 Detalle de cobro actualizado y sincronizado con Caja.");
        refrescarVistasCobranza17();
    };

    // --- LIQUIDACIÓN MASIVA DE UNA OBRA SOCIAL (CORREGIDO CAMBIO DE % COLEGIO) ---
    window.abrirModalLiquidacionMasiva17 = function (espOpt = "TODAS", mutPreId = "", mesTrabPre = "TODOS") {
        const db = obtenerDatosConsultorioCDM();
        const mutualesOS = (db.mutuales || [])
            .filter(m => !esMutualParticular17(m) && (espOpt === "TODAS" || mismaEsp17(m.especialidad, espOpt)))
            .map(m => normalizarMutual17(m, db, m.especialidad));

        if (!mutualesOS.length) {
            toast17("⚠️ No hay obras sociales configuradas para liquidar.");
            return;
        }

        const mutSel = mutualesOS.find(m => m.id === mutPreId) || mutualesOS[0];
        const hoy = hoy17();

        const modal = asegurarModal17();
        modal.innerHTML = `
            <div class="modal-window" style="max-width:740px;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-ok">💰 REGISTRAR LIQUIDACIÓN DE OBRA SOCIAL</span>
                        <h3 style="margin-top:4px;">Cobro de Meses Trabajados (Mensual / BIS)</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalConsultorioCDM()">✕</button>
                </div>

                <form onsubmit="confirmarLiquidacionMasiva17(event)">
                    <div class="grid-3" style="margin-bottom:0.65rem;">
                        <div class="field">
                            <label>Obra Social *</label>
                            <select id="lmMutId" onchange="actualizarListaLiquidacionMasiva17('TODOS', true)">
                                ${mutualesOS.map(m => `<option value="${esc17(m.id)}" ${m.id === mutSel.id ? "selected" : ""}>${esc17(m.nombre)} (${esc17(m.especialidad)})</option>`).join("")}
                            </select>
                        </div>
                        <div class="field">
                            <label>Mes Trabajado que abona</label>
                            <select id="lmMesTrab" onchange="actualizarListaLiquidacionMasiva17(null, false)">
                                <option value="TODOS" ${mesTrabPre === "TODOS" ? "selected" : ""}>Todos los pendientes</option>
                            </select>
                        </div>
                        <div class="field">
                            <label>Fecha Real de Pago (Caja) *</label>
                            <input type="date" id="lmFechaPago" value="${hoy}" required>
                        </div>
                    </div>

                    <div class="grid-3" style="margin-bottom:0.75rem;">
                        <div class="field">
                            <label>Liquidación</label>
                            <select id="lmTipoLiq">${TIPOS_LIQ_PAGO.map(x => `<option>${x}</option>`).join("")}</select>
                        </div>
                        <div class="field">
                            <label>% Descuento Colegio</label>
                            <input type="number" id="lmDescPct" min="0" max="50" step="0.1" value="${mutSel.descuentoColegioPct}" oninput="recalcTotalesLiqMasiva17()">
                        </div>
                        <div class="field">
                            <label>Medio de Ingreso</label>
                            <select id="lmMedio">${MEDIOS_CAJA_17.map(m => `<option ${m === "Transferencia" ? "selected" : ""}>${m}</option>`).join("")}</select>
                        </div>
                    </div>

                    <div id="lmListaTurnos" style="max-height:260px; overflow-y:auto; margin-bottom:0.75rem;"></div>
                    <div id="lmResumenTotales" class="c17-neto-preview"></div>

                    <button type="submit" class="btn btn-ok" style="width:100%;">💰 Confirmar Liquidación e Ingresar Neto a Caja</button>
                </form>
            </div>
        `;
        modal.classList.remove("hidden");
        actualizarListaLiquidacionMasiva17(mesTrabPre, true);
    };

    window.actualizarListaLiquidacionMasiva17 = function (mesForzado = null, sincronizarPctMutual = false) {
        const db = obtenerDatosConsultorioCDM();
        const mutId = document.getElementById("lmMutId")?.value;
        const mut = resolverMutual17(db, mutId);
        const selMes = document.getElementById("lmMesTrab");
        const inpPct = document.getElementById("lmDescPct");
        if (mut && inpPct && sincronizarPctMutual) {
            inpPct.value = mut.descuentoColegioPct;
        }

        const pendTodos = (db.turnos || []).filter(t => {
            if (!t || t.estado === "cancelado") return false;
            const f = analizarFinanzasTurno17(db, t);
            return !f.esPart && f.mut?.id === mutId && f.faltaOS;
        }).sort((a, b) => String(a.fecha || "").localeCompare(String(b.fecha || "")));

        const mesesUnicos = [...new Set(pendTodos.map(t => String(t.fecha || "").slice(0, 7)))].sort().reverse();
        const mesActual = mesForzado !== null ? mesForzado : (selMes?.value || "TODOS");
        if (selMes) {
            selMes.innerHTML = `<option value="TODOS" ${mesActual === "TODOS" ? "selected" : ""}>Todos los pendientes (${pendTodos.length})</option>` +
                mesesUnicos.map(ym => `<option value="${ym}" ${mesActual === ym ? "selected" : ""}>${esc17(formatearMesYM17(ym))}</option>`).join("");
        }

        const lista = mesActual === "TODOS" ? pendTodos : pendTodos.filter(t => String(t.fecha || "").startsWith(mesActual));
        const cont = document.getElementById("lmListaTurnos");
        if (!cont) return;

        if (!lista.length) {
            cont.innerHTML = `<div class="empty-box" style="padding:1rem;">🎉 No hay sesiones pendientes de cobro para esta obra social en el período elegido.</div>`;
        } else {
            cont.innerHTML = `
                <div class="table-wrap">
                    <table class="app-table" style="font-size:0.78rem;">
                        <thead><tr><th style="width:32px;">✓</th><th>Fecha Trab.</th><th>Paciente</th><th>🔑 Token</th><th>Bruto OS</th></tr></thead>
                        <tbody>
                            ${lista.map(t => `
                                <tr>
                                    <td><input type="checkbox" class="lm-chk-turno" value="${t.id}" data-bruto="${Number(t.valorMutual) || 0}" checked onchange="recalcTotalesLiqMasiva17()" style="width:16px; height:16px; min-height:auto;"></td>
                                    <td><b>${esc17(t.fecha)}</b></td>
                                    <td>${esc17(t.pacienteNombre)}</td>
                                    <td>${t.token ? `<b>${esc17(t.token)}</b>` : `<span style="color:#b91c1c;">Sin token</span>`}</td>
                                    <td><b>${fmt17(t.valorMutual)}</b></td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            `;
        }
        recalcTotalesLiqMasiva17();
    };

    window.recalcTotalesLiqMasiva17 = function () {
        const box = document.getElementById("lmResumenTotales");
        if (!box) return;
        const pct = Math.max(0, Math.min(50, parseFloat(document.getElementById("lmDescPct")?.value) || 0));
        const checks = Array.from(document.querySelectorAll(".lm-chk-turno:checked"));
        const bruto = checks.reduce((a, el) => a + (Number(el.dataset.bruto) || 0), 0);
        const desc = Math.round(bruto * (pct / 100));
        const neto = Math.max(0, bruto - desc);
        box.innerHTML = `
            📊 <b>${checks.length} sesión(es) seleccionadas</b> • Bruto: <b>${fmt17(bruto)}</b> − Colegio (${pct}%: <b>-${fmt17(desc)}</b>) = <b style="color:#047857; font-size:0.9rem;">${fmt17(neto)} neto a Caja</b>
        `;
    };

    window.confirmarLiquidacionMasiva17 = function (e) {
        e.preventDefault();
        const ids = Array.from(document.querySelectorAll(".lm-chk-turno:checked")).map(el => Number(el.value));
        if (!ids.length) return alert("⚠️ Seleccioná al menos una sesión para liquidar.");

        const db = obtenerDatosConsultorioCDM();
        const fechaPago = document.getElementById("lmFechaPago")?.value || hoy17();
        const tipoLiq = document.getElementById("lmTipoLiq")?.value || TIPOS_LIQ_PAGO[0];
        const descPct = Math.max(0, Math.min(50, parseFloat(document.getElementById("lmDescPct")?.value) || 0));
        const medio = document.getElementById("lmMedio")?.value || "Transferencia";

        let cant = 0;
        ids.forEach(idT => {
            const t = (db.turnos || []).find(x => Number(x.id) === idT);
            if (!t) return;
            t.mutualCobrada = true;
            t.fechaPagoMutual = fechaPago;
            t.mesCobroMutual = fechaPago.slice(0, 7);
            t.liquidacionRef = tipoLiq;
            t.descuentoColegioPct = descPct;
            t.medioPagoMutual = medio;
            cant++;
        });

        guardarDatosConsultorioCDM(db);
        window.reconstruirAsientosConsultorioEnCaja17();
        cerrarModalConsultorioCDM();
        toast17(`💰 Liquidación registrada: ${cant} sesión(es) ingresadas a Caja con fecha ${fechaPago}.`);
        refrescarVistasCobranza17();
    };

    // --- EXPORTACIÓN CSV Y PDF A4 DE COBRANZAS ---
    window.exportarCobranzasCSV17 = function (espFija = "TODAS") {
        const db = obtenerDatosConsultorioCDM();
        const regs = obtenerTurnosFiltradosCobranza17(db, espFija);
        if (!regs.length) return alert("No hay sesiones para exportar en este filtro.");
        const esc = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
        const head = ["Fecha Sesion", "Mes Trabajado", "Paciente", "Obra Social", "Token", "Token Entregado", "Presentado", "Coseg/Part", "Coseg Cobrado", "Fecha Pago Coseg", "OS Bruto", "% Colegio", "OS Neto", "OS Cobrada", "Fecha Pago OS", "Liquidacion", "Completo", "Falta Cobrar"];
        let csv = head.map(esc).join(";") + "\n";
        regs.forEach(t => {
            const f = analizarFinanzasTurno17(db, t);
            csv += [
                t.fecha, f.mesTrabajo, t.pacienteNombre, f.mut?.nombre || t.mutualNombre, t.token || "",
                f.tokenEntregado ? "SI" : "NO", t.presentado ? "SI" : "NO",
                f.montoConsultorio, f.cosegCobrado ? "SI" : "NO", t.fechaPagoCoseguro || "",
                f.valOSBruto, `${f.descPct}%`, f.valOSNeto, f.osCobrada ? "SI" : "NO",
                t.fechaPagoMutual || "", t.liquidacionRef || "", f.completo ? "SI" : "NO", f.totalPendienteReal
            ].map(esc).join(";") + "\n";
        });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
        a.download = `cobranzas_consultorio_${ui17.cobModoMes}_${ui17.cobMesTrabajo}.csv`;
        a.click();
        toast17("📊 Cobranzas y liquidaciones exportadas a Excel CSV.");
    };

    window.imprimirCobranzasPDF17 = function (espFija = "TODAS") {
        const db = obtenerDatosConsultorioCDM();
        const regs = obtenerTurnosFiltradosCobranza17(db, espFija);
        if (!regs.length) return alert("Sin sesiones para imprimir en este filtro.");
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : { nombreEntidad: "Consultorio" };
        let totCob = 0, totPend = 0, totCol = 0;
        regs.forEach(t => { const f = analizarFinanzasTurno17(db, t); totCob += f.totalCobradoReal; totPend += f.totalPendienteReal; totCol += f.descMonto; });

        imprimirHojaA4Consultorio(`
            <div style="display:flex; justify-content:space-between; border-bottom:2.5px solid #0284c7; padding-bottom:0.7rem; margin-bottom:0.9rem;">
                <div>
                    <div style="font-size:0.7rem; font-weight:800; color:#0284c7;">CONTROL DE COBRANZAS, TOKENS Y LIQUIDACIONES</div>
                    <h2 style="margin:2px 0; font-size:1.3rem;">${esc17(lic.nombreEntidad)}</h2>
                    <small>${ui17.cobModoMes === "cobro" ? "Mes cobrado" : "Mes trabajado"}: <b>${ui17.cobMesTrabajo === "TODOS" ? "Todos" : formatearMesYM17(ui17.cobMesTrabajo)}</b> • Sesiones: <b>${regs.length}</b></small>
                </div>
                <div style="text-align:right; font-size:0.8rem;">
                    <div><b>Cobrado Real:</b> ${fmt17(totCob)}</div>
                    <div><b>Falta Cobrar:</b> ${fmt17(totPend)}</div>
                    <div><b>Desc. Colegio:</b> -${fmt17(totCol)}</div>
                </div>
            </div>
            <table>
                <thead><tr><th>Fecha / Trab.</th><th>Paciente</th><th>Obra Social</th><th>Token</th><th>Coseg./Part.</th><th>OS Neto (Desc.)</th><th>Pago / Estado</th></tr></thead>
                <tbody>
                    ${regs.map(t => {
                        const f = analizarFinanzasTurno17(db, t);
                        return `<tr>
                            <td>${esc17(t.fecha)}<br><small>${esc17(f.mesTrabajo)}</small></td>
                            <td><b>${esc17(t.pacienteNombre)}</b></td>
                            <td>${esc17(f.mut?.nombre || t.mutualNombre)}</td>
                            <td>${f.esPart ? "-" : (t.token ? esc17(t.token) : (f.tokenEntregado ? "Sí" : "Falta"))}</td>
                            <td>${fmt17(f.montoConsultorio)} ${f.montoConsultorio > 0 ? (f.cosegCobrado ? "✓" : "(Pend.)") : ""}</td>
                            <td>${f.esPart ? "-" : `${fmt17(f.valOSNeto)} (-${f.descPct}%) ${f.osCobrada ? "✓" : "(Pend.)"}`}</td>
                            <td>${f.completo ? `<b>Completo ✓</b>${t.fechaPagoMutual ? `<br><small>${esc17(t.fechaPagoMutual)} ${esc17(t.liquidacionRef || "")}</small>` : ""}` : `Falta ${fmt17(f.totalPendienteReal)}`}</td>
                        </tr>`;
                    }).join("")}
                </tbody>
            </table>
        `);
    };

    // =====================================================================
    // 9. ENGANCHES CON CONSULTORIO, HISTORIA CLÍNICA Y RECONSTRUCCIÓN DE CAJA
    // =====================================================================
    if (typeof window.renderizarConsultorioCompleto === "function") {
        const _origRender17 = window.renderizarConsultorioCompleto;
        window.renderizarConsultorioCompleto = function () {
            _origRender17.apply(this, arguments);
            inyectarCSS17();
            window.reconstruirAsientosConsultorioEnCaja17();

            const sec = document.getElementById("cdmSeccionConsultorioGlobal");
            if (!sec || sec.classList.contains("hidden")) return;

            const btnTabLote = sec.querySelector('.cons-tab[onclick*="cambiarTabConsultorioCDM(\'lote\')"]');
            if (btnTabLote) {
                const full = btnTabLote.querySelector(".cons-tab-full");
                const sh = btnTabLote.querySelector(".cons-tab-short");
                if (full) full.textContent = "Cobranzas y Liquidaciones";
                if (sh) sh.textContent = "Cobranzas";
            }

            const tabActivaBtn = sec.querySelector(".cons-tab.active");
            const onclickAct = tabActivaBtn?.getAttribute("onclick") || "";
            const cuerpo = document.getElementById("consCuerpoTab");
            const db = obtenerDatosConsultorioCDM();
            const espAct = obtenerEspActiva17();

            if (cuerpo && onclickAct.includes("'mutuales'")) {
                renderTabMutualesPro17(cuerpo, db, espAct);
            } else if (cuerpo && onclickAct.includes("'lote'")) {
                renderizarPanelCobranzaConsultorio17(cuerpo, { espFiltro: espAct, desdeCaja: false });
            } else if (onclickAct.includes("'pacientes'")) {
                enriquecerTablaPacientesConCupo17(sec, db, espAct);
            }
        };
    }

    function engancharCupoEnHistoriaClinica17() {
        if (window.__cdmHookClinCupo17 || typeof window.abrirSuiteClinicaPacientePro !== "function") return;
        window.__cdmHookClinCupo17 = true;
        const _origClin17 = window.abrirSuiteClinicaPacientePro;
        window.abrirSuiteClinicaPacientePro = function (idPac) {
            const res = _origClin17.apply(this, arguments);
            setTimeout(() => {
                const db = obtenerDatosConsultorioCDM();
                const p = (db.pacientes || []).find(x => Number(x.id) === Number(idPac));
                const heroSmall = document.querySelector("#modalSuiteClinicaProCDM .clin-hero small");
                if (!p || !heroSmall || heroSmall.querySelector(".c17-clin-cupo")) return;
                const cupo = calcularCupoPacienteCons17(db, p);
                if (cupo && !cupo.esParticular) {
                    const txtM = cupo.topeMes > 0 ? `${cupo.atendidosMes}/${cupo.topeMes} mes` : `${cupo.atendidosMes} mes`;
                    const txtA = cupo.topeAnio > 0 ? `${cupo.usadasAnio}/${cupo.topeAnio} año` : `${cupo.usadasAnio} año`;
                    heroSmall.insertAdjacentHTML("beforeend", ` • <span class="c17-clin-cupo" style="background:rgba(255,255,255,0.2); padding:1px 7px; border-radius:999px; font-weight:800;">🎯 Sesiones: ${txtM} | ${txtA}</span>`);
                }
            }, 30);
            return res;
        };
    }

    document.addEventListener("DOMContentLoaded", () => {
        engancharCupoEnHistoriaClinica17();
        setTimeout(() => {
            engancharCupoEnHistoriaClinica17();
            window.reconstruirAsientosConsultorioEnCaja17();
        }, 650);
    });
})();