/**
 * js/consultorio-clinica.js — Historia Clínica Modular Independiente por Disciplina
 * - Kinesiología / Quiropraxia / Traumatología: Sesiones + EVA + Atlas HD (6 láminas reales + Flechas + Lupa) + Eval. Física + Consentimiento + RP/
 * - Psicología / Psicopedagogía: Sesiones (Ánimo/Ansiedad/Sueño) + Anamnesis/Tests + Genograma + Consentimiento + Informes/Derivaciones
 * - Nutrición: Antropometría (Peso/IMC/%Grasa/Cintura + Curva) + Plan Alimentario (Macros/Comidas PDF+WA) + Hábitos + Consentimiento + Laboratorios
 * - Control 🔒/🔓 para habilitar o bloquear que el paciente suba estudios/archivos desde su portal
 * CDM Pro Suite — Desarrollado por Gonzalo Adanchú
 */

(function () {
    // =====================================================================
    // 1. ESTILOS LIMPIOS + ATLAS ANATÓMICO HD + LUPA + FLECHAS ANIMADAS
    // =====================================================================
    function inyectarCSSClinicaPro() {
        document.getElementById("cdmCssClinicaPro")?.remove();
        const st = document.createElement("style");
        st.id = "cdmCssClinicaPro";
        st.textContent = `
            #modalSuiteClinicaProCDM .modal-window {
                width: min(98vw, 1080px) !important;
                max-width: 1080px !important;
                max-height: 94vh !important;
                padding: 1.05rem 1.2rem !important;
            }
            .clin-hero {
                color: #ffffff; border-radius: 18px; padding: 0.92rem 1.15rem;
                display: flex; justify-content: space-between; align-items: center;
                gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.8rem;
            }
            .clin-hero h3 { margin: 0; font-size: 1.16rem; font-weight: 900; color: #ffffff; }
            .clin-hero small { display: block; color: rgba(255,255,255,0.86); font-size: 0.75rem; margin-top: 2px; }
            .clin-hero-actions { display: flex; gap: 0.4rem; flex-wrap: wrap; align-items: center; }

            .clin-tabs {
                display: flex; gap: 0.35rem; overflow-x: auto; padding: 0.35rem;
                background: var(--surface-subtle, #f1f5f9);
                border: 1.5px solid var(--line-strong, #cbd5e1);
                border-radius: 14px; margin-bottom: 0.85rem; scrollbar-width: none;
            }
            .clin-tabs::-webkit-scrollbar { display: none; }
            .clin-tab {
                flex: 1 0 auto; border: none; background: transparent;
                color: var(--ink-600, #475569); font-size: 0.79rem; font-weight: 800;
                padding: 0.5rem 0.8rem; border-radius: 10px; cursor: pointer;
                white-space: nowrap; transition: all 0.14s ease;
            }
            .clin-tab.active { background: #0284c7; color: #ffffff; box-shadow: 0 4px 10px rgba(2, 132, 199, 0.28); }

            .clin-box {
                background: var(--surface-subtle, #f8fafc);
                border: 1.5px solid var(--line, #e2e8f0);
                border-radius: 16px; padding: 0.85rem 0.95rem; margin-bottom: 0.8rem;
            }
            .clin-grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.85rem; align-items: start; }
            .clin-kpi-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.6rem; margin-bottom: 0.8rem; }
            .clin-kpi {
                background: var(--surface-solid, #ffffff); border: 1.5px solid var(--line, #e2e8f0);
                border-top: 3.5px solid #0284c7; border-radius: 13px; padding: 0.6rem 0.75rem;
            }
            .clin-kpi small { display: block; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: var(--ink-500, #64748b); }
            .clin-kpi strong { display: block; font-size: 1.15rem; font-weight: 900; color: var(--ink-900, #0f172a); margin-top: 2px; }

            .clin-eva-bar { display: flex; align-items: center; gap: 0.55rem; }
            .clin-eva-pill {
                min-width: 54px; text-align: center; font-size: 0.78rem; font-weight: 900;
                padding: 0.22rem 0.45rem; border-radius: 999px; color: #ffffff;
            }
            .clin-chart-box {
                width: 100%; background: var(--surface-solid, #ffffff);
                border: 1px solid var(--line, #e2e8f0); border-radius: 12px; padding: 0.55rem 0.65rem;
                margin-bottom: 0.8rem;
            }

            /* === ATLAS ANATÓMICO HD POR CAPAS === */
            .atlas-toolbar {
                display: flex; justify-content: space-between; align-items: center;
                gap: 0.55rem; flex-wrap: wrap;
                background: var(--surface-solid, #ffffff);
                border: 1.5px solid var(--line-strong, #cbd5e1);
                border-radius: 15px; padding: 0.55rem 0.75rem; margin-bottom: 0.8rem;
            }
            .atlas-btn-group {
                display: inline-flex; gap: 0.25rem; flex-wrap: wrap; align-items: center;
                background: var(--surface-subtle, #f1f5f9);
                border: 1px solid var(--line, #e2e8f0);
                padding: 3px; border-radius: 11px;
            }
            .atlas-pill {
                border: none; background: transparent; color: var(--ink-700, #334155);
                font-size: 0.74rem; font-weight: 800; padding: 0.34rem 0.68rem;
                border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem;
                transition: all 0.14s ease; white-space: nowrap;
            }
            .atlas-pill:hover { background: rgba(2, 132, 199, 0.1); color: #0284c7; }
            .atlas-pill.active { background: #0284c7; color: #ffffff; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.28); }
            .atlas-pill.active-warn { background: #dc2626; color: #ffffff; }
            .atlas-pill.active-purple { background: #7c3aed; color: #ffffff; }
            .atlas-pill.active-teal { background: #0d9488; color: #ffffff; }

            .atlas-main-grid { display: grid; grid-template-columns: minmax(320px, 1.35fr) minmax(270px, 0.85fr); gap: 0.95rem; align-items: start; }
            .atlas-stages-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.7rem; }
            .atlas-stages-grid.single-view { grid-template-columns: minmax(0, 420px); justify-content: center; }

            .atlas-stage-card {
                background: #0b1322; border: 1.5px solid var(--line-strong, #cbd5e1);
                border-radius: 18px; overflow: hidden; display: flex; flex-direction: column;
                box-shadow: 0 10px 26px -12px rgba(15, 23, 42, 0.25);
            }
            .atlas-stage-head {
                display: flex; justify-content: space-between; align-items: center;
                padding: 0.42rem 0.75rem; background: rgba(15, 23, 42, 0.94);
                border-bottom: 1px solid rgba(148, 163, 184, 0.2);
                color: #e2e8f0; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;
            }
            .atlas-stage-inner { position: relative; width: 100%; overflow: hidden; user-select: none; background: #0f172a; line-height: 0; }
            .atlas-stage-inner.mode-draw { cursor: crosshair; touch-action: none; }
            .atlas-stage-inner.mode-loupe { cursor: none; touch-action: none; }
            .atlas-img { width: 100%; height: auto; display: block; pointer-events: none; -webkit-user-drag: none; }
            .atlas-svg-overlay { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 3; overflow: visible; }
            @keyframes atlasFlowDash { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } }
            .atlas-arrow-anim { stroke-dasharray: 8 4; animation: atlasFlowDash 0.85s linear infinite; }
            @keyframes atlasPulsePin { 0%, 100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.12); } }
            .atlas-pin {
                position: absolute; transform: translate(-50%, -50%);
                width: 24px; height: 24px; border-radius: 50%;
                border: 2px solid #ffffff; color: #ffffff;
                font-size: 0.67rem; font-weight: 900; line-height: 1;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.45); z-index: 5; cursor: pointer;
            }
            .atlas-pin.highlight { box-shadow: 0 0 0 5px rgba(250, 204, 21, 0.7), 0 4px 12px rgba(0, 0, 0, 0.5); animation: atlasPulsePin 1s ease infinite; z-index: 8; }

            .atlas-loupe {
                display: none; position: absolute; width: 158px; height: 158px;
                border-radius: 50%; border: 3px solid #38bdf8;
                box-shadow: 0 12px 32px rgba(2, 6, 23, 0.6), inset 0 0 14px rgba(56, 189, 248, 0.35);
                pointer-events: none; z-index: 12; transform: translate(-50%, -50%);
                background-repeat: no-repeat; background-color: #0b1322; overflow: hidden;
            }
            .atlas-loupe.visible { display: block; }
            .atlas-loupe::before, .atlas-loupe::after { content: ""; position: absolute; background: rgba(56, 189, 248, 0.65); }
            .atlas-loupe::before { left: 50%; top: 50%; width: 16px; height: 1.5px; transform: translate(-50%, -50%); }
            .atlas-loupe::after { left: 50%; top: 50%; width: 1.5px; height: 16px; transform: translate(-50%, -50%); }
            .atlas-loupe-tag {
                position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%);
                background: rgba(15, 23, 42, 0.85); color: #38bdf8;
                font-size: 0.6rem; font-weight: 800; padding: 2px 7px; border-radius: 999px;
                white-space: nowrap; line-height: 1.2; border: 1px solid rgba(56, 189, 248, 0.4);
            }

            .clin-pin-item {
                display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;
                background: var(--surface-solid, #ffffff); border: 1px solid var(--line, #e2e8f0);
                border-left: 4px solid #ef4444; border-radius: 12px; padding: 0.55rem 0.72rem; font-size: 0.78rem;
            }

            /* GENOGRAMA VISUAL */
            .clin-geno-board {
                background: var(--surface-solid, #ffffff); border: 1.5px solid var(--line-strong, #cbd5e1);
                border-radius: 16px; padding: 0.9rem; margin-bottom: 0.85rem;
                display: flex; flex-direction: column; gap: 0.75rem;
            }
            .clin-geno-gen { display: flex; flex-direction: column; gap: 0.35rem; align-items: center; }
            .clin-geno-gen-lbl { font-size: 0.64rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-400, #94a3b8); }
            .clin-geno-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.55rem; width: 100%; }
            .clin-geno-node {
                min-width: 122px; max-width: 185px; background: var(--surface-subtle, #f8fafc);
                border: 2px solid #94a3b8; border-radius: 13px; padding: 0.48rem 0.65rem;
                text-align: center; font-size: 0.76rem; position: relative;
            }
            .clin-geno-node.is-pac { background: linear-gradient(135deg, #7c3aed, #4f46e5); border-color: #7c3aed; color: #ffffff; }
            .clin-geno-node.v-cercano { border-color: #10b981; background: rgba(16, 185, 129, 0.08); }
            .clin-geno-node.v-conflictivo { border-color: #ef4444; border-style: dashed; background: rgba(239, 68, 68, 0.07); }
            .clin-geno-node.v-distante { border-color: #94a3b8; border-style: dotted; opacity: 0.82; }
            .clin-geno-node.v-fallecido { border-color: #475569; background: rgba(71, 85, 105, 0.1); }
            .clin-geno-del { position: absolute; top: 3px; right: 4px; border: none; background: transparent; color: var(--ink-400); font-size: 0.72rem; cursor: pointer; }

            /* FIRMA TÁCTIL */
            .clin-sig-wrap { background: #ffffff; border: 2px dashed #94a3b8; border-radius: 14px; overflow: hidden; position: relative; margin-bottom: 0.65rem; }
            #clinSigCanvas { display: block; width: 100%; height: 175px; cursor: crosshair; touch-action: none; }
            .clin-sig-hint { position: absolute; bottom: 6px; left: 12px; pointer-events: none; font-size: 0.68rem; font-weight: 700; color: #94a3b8; }

            @media (max-width: 900px) {
                .atlas-main-grid, .clin-grid-2 { grid-template-columns: 1fr; }
                .clin-kpi-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            }
            @media (max-width: 600px) {
                #modalSuiteClinicaProCDM .modal-window { padding: 0.8rem !important; }
                .atlas-stages-grid { grid-template-columns: 1fr; }
                .atlas-loupe { width: 128px; height: 128px; }
                .clin-hero { padding: 0.8rem 0.9rem; }
                .clin-hero h3 { font-size: 1.02rem; }
            }
        `;
        document.head.appendChild(st);
    }

    // =====================================================================
    // 2. DETECTOR DE PERFIL POR DISCIPLINA Y CONFIGURACIÓN
    // =====================================================================
    const CAPAS_ATLAS = {
        muscular: { nombre: "Muscular", icono: "💪", color: "#dc2626", imgFrente: "img/frente_muscular.jpg", imgEspalda: "img/espalda_muscular.jpg" },
        oseo: { nombre: "Óseo", icono: "🦴", color: "#0284c7", imgFrente: "img/frente_oseo.jpg", imgEspalda: "img/espalda_oseo.jpg" },
        nervioso: { nombre: "Nervioso", icono: "⚡", color: "#7c3aed", imgFrente: "img/frente_nervioso.jpg", imgEspalda: "img/espalda_nervioso.jpg" }
    };

    function normStr(s) {
        return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    }

  function obtenerPerfilDisciplina(especialidad) {
        const k = normStr(especialidad);
        const customColor = typeof window.colorEspecialidadConsultorio === "function"
            ? window.colorEspecialidadConsultorio(especialidad)
            : null;
        const customGrad = typeof window.gradienteEspecialidadConsultorio === "function"
            ? window.gradienteEspecialidadConsultorio(especialidad)
            : null;

        if (k.includes("psico")) {
            return {
                tipo: "psicologia",
                tituloBadge: "🧠 HISTORIA CLÍNICA PSICOLÓGICA",
                gradiente: customGrad || "linear-gradient(135deg, #1e1b4b 0%, #6d28d9 60%, #7c3aed 100%)",
                accent: customColor || "#7c3aed"
            };
        }
        if (k.includes("nutri")) {
            return {
                tipo: "nutricion",
                tituloBadge: "🥗 HISTORIA CLÍNICA NUTRICIONAL",
                gradiente: customGrad || "linear-gradient(135deg, #064e3b 0%, #15803d 60%, #0d9488 100%)",
                accent: customColor || "#16a34a"
            };
        }
        if (k.includes("kine") || k.includes("quiro") || k.includes("trauma") || k.includes("osteo") || k.includes("fisio")) {
            return {
                tipo: "fisico",
                tituloBadge: "🦴 HISTORIA CLÍNICA FÍSICA / REHABILITACIÓN",
                gradiente: customGrad || "linear-gradient(135deg, #0c192c 0%, #0369a1 62%, #0d9488 100%)",
                accent: customColor || "#0284c7"
            };
        }
        return {
            tipo: "general",
            tituloBadge: "🩺 HISTORIA CLÍNICA PROFESIONAL",
            gradiente: customGrad || "linear-gradient(135deg, #0f172a 0%, #0369a1 65%, #0284c7 100%)",
            accent: customColor || "#0284c7"
        };
    }

    const stClin = {
        pacId: null,
        tab: "principal",
        capaActiva: "muscular",
        vistaActiva: "ambos",
        herramienta: "punto",
        capaLupa: "misma",
        zoomLupa: 2.5,
        soloCapaEnMapa: false,
        hallazgoPendiente: null,
        highlightId: null,
        sigDibujo: false
    };

    function escHtml(s) {
        return String(s ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function colorPorEva(n) {
        const v = Number(n) || 0;
        if (v <= 3) return "#10b981";
        if (v <= 6) return "#f59e0b";
        return "#ef4444";
    }

    function colorPorBienestar(n) {
        const v = Number(n) || 5;
        if (v >= 7) return "#10b981";
        if (v >= 4) return "#f59e0b";
        return "#ef4444";
    }

    function hoyISO() {
        return typeof obtenerHoyISO === "function" ? obtenerHoyISO() : new Date().toISOString().split("T")[0];
    }

    function calcularEdad(fn) {
        if (!fn || !/^\d{4}-\d{2}-\d{2}$/.test(fn)) return "-";
        const [y, m, d] = fn.split("-").map(Number);
        const h = new Date();
        let e = h.getFullYear() - y;
        if (h.getMonth() + 1 < m || (h.getMonth() + 1 === m && h.getDate() < d)) e--;
        return Math.max(0, e);
    }

    function clasificarIMC(imc) {
        const v = parseFloat(imc);
        if (isNaN(v) || v <= 0) return { txt: "-", col: "#64748b" };
        if (v < 18.5) return { txt: "Bajo peso", col: "#0284c7" };
        if (v < 25) return { txt: "Normopeso", col: "#10b981" };
        if (v < 30) return { txt: "Sobrepeso", col: "#f59e0b" };
        return { txt: "Obesidad", col: "#ef4444" };
    }

    function resolverMutualPaciente(db, p) {
        return typeof window.buscarMutualConsultorioCDM === "function"
            ? window.buscarMutualConsultorioCDM(db, p.mutualId, p.especialidad)
            : (db.mutuales || []).find(m => m.id === p.mutualId);
    }

    function checkSaludFeat(claves) {
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        const f = lic?.funciones?.salud;
        if (!f || typeof f !== "object") return true;
        for (const k of claves) { if (f[k] === false) return false; }
        return true;
    }

    function asegurarDatosPaciente(p) {
        if (!p) return;
        if (!Array.isArray(p.mapaCorporal)) p.mapaCorporal = [];
        if (!Array.isArray(p.genograma)) p.genograma = [];
        if (!Array.isArray(p.consentimientos)) p.consentimientos = [];
        if (!Array.isArray(p.recetas)) p.recetas = [];
        if (!Array.isArray(p.estudios)) p.estudios = [];

        if (!p.evalFisica || typeof p.evalFisica !== "object") {
            p.evalFisica = { motivo: "", mecanismo: "", pruebas: "", rom: "", diagnostico: p.diagnostico || "" };
        } else if (!p.evalFisica.diagnostico && p.diagnostico) {
            p.evalFisica.diagnostico = p.diagnostico;
        }

        if (!p.anamnesisPsico || typeof p.anamnesisPsico !== "object") {
            p.anamnesisPsico = {
                motivoManifiesto: p.motivoConsulta || "",
                antecedentes: "",
                medicacion: p.medicacionActual || "",
                redSosten: p.contactoEmergencia ? `Contacto de emergencia: ${p.contactoEmergencia}` : "",
                objetivos: "",
                escalas: ""
            };
        } else {
            if (!p.anamnesisPsico.motivoManifiesto && p.motivoConsulta) p.anamnesisPsico.motivoManifiesto = p.motivoConsulta;
            if (!p.anamnesisPsico.medicacion && p.medicacionActual) p.anamnesisPsico.medicacion = p.medicacionActual;
        }

        if (!Array.isArray(p.antropometria)) p.antropometria = [];
        if (p.antropometria.length === 0 && p.pesoInicial && p.tallaCm) {
            const imcIni = Math.round((Number(p.pesoInicial) / Math.pow(Number(p.tallaCm) / 100, 2)) * 10) / 10;
            p.antropometria.push({
                id: Date.now(),
                fecha: hoyISO(),
                peso: Number(p.pesoInicial),
                talla: Number(p.tallaCm),
                imc: imcIni,
                grasa: "", musculo: "", cintura: "", cadera: "", token: "",
                nota: "Medición inicial de ingreso"
            });
        }

        if (!p.habitosNutri || typeof p.habitosNutri !== "object") {
            p.habitosNutri = { patologias: "", alergias: p.alergiasAlimentarias || "", preferencias: "", actividadFisica: "", horariosSueno: "", hidratacion: "" };
        } else if (!p.habitosNutri.alergias && p.alergiasAlimentarias) {
            p.habitosNutri.alergias = p.alergiasAlimentarias;
        }

        if (!p.planNutri || typeof p.planNutri !== "object") {
            p.planNutri = { objetivo: p.objetivoNutricion || "Educación Alimentaria", kcal: "", prot: "", carb: "", grasas: "", agua: "2.5 L", desayuno: "", colacionAM: "", almuerzo: "", merienda: "", cena: "", colacionPM: "", suplementacion: "" };
        }
    }

    function obtenerPacienteActivo() {
        if (typeof obtenerDatosConsultorioCDM !== "function") return { db: null, p: null };
        const db = obtenerDatosConsultorioCDM();
        const p = db.pacientes.find(x => Number(x.id) === Number(stClin.pacId)) || null;
        if (p) asegurarDatosPaciente(p);
        return { db, p };
    }

    function imprimirA4(html) {
        if (typeof window.imprimirHojaA4Consultorio === "function") {
            window.imprimirHojaA4Consultorio(html);
        } else {
            const w = window.open("", "_blank");
            if (w) {
                w.document.write(`<html><head><title>Documento A4</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#0f172a;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #cbd5e1;padding:6px;text-align:left;}</style></head><body>${html}</body></html>`);
                w.document.close();
                w.print();
            }
        }
    }

    function asegurarModalSuite() {
        let m = document.getElementById("modalSuiteClinicaProCDM");
        if (!m) {
            m = document.createElement("div");
            m.id = "modalSuiteClinicaProCDM";
            m.className = "modal-backdrop hidden";
            document.body.appendChild(m);
        }
        return m;
    }

    window.cerrarSuiteClinicaPacientePro = function () {
        document.getElementById("modalSuiteClinicaProCDM")?.classList.add("hidden");
    };

    // =====================================================================
    // 3. ENTRADA PRINCIPAL Y CONSTRUCCIÓN DE PESTAÑAS POR DISCIPLINA
    // =====================================================================
    window.abrirSuiteClinicaPacientePro = function (idPac, tabOpt = null) {
        inyectarCSSClinicaPro();
        stClin.pacId = Number(idPac);
        stClin.hallazgoPendiente = null;
        stClin.highlightId = null;

        const { db, p } = obtenerPacienteActivo();
        if (!p) {
            if (typeof mostrarToast === "function") mostrarToast("⚠️ Paciente no encontrado.");
            return;
        }
        stClin.tab = tabOpt || "principal";
        renderSuiteClinicaModal(db, p);
        asegurarModalSuite().classList.remove("hidden");
    };

    window.cambiarTabSuiteClinica = function (tab) {
        stClin.tab = tab;
        stClin.hallazgoPendiente = null;
        const { db, p } = obtenerPacienteActivo();
        if (p) renderSuiteClinicaModal(db, p);
    };

    window.alternarPermisoSubidaPacienteClin = function () {
        const { db, p } = obtenerPacienteActivo();
        if (!p) return;
        p.puedeSubirEstudios = !Boolean(p.puedeSubirEstudios);
        guardarDatosConsultorioCDM(db);
        if (typeof mostrarToast === "function") {
            mostrarToast(p.puedeSubirEstudios
                ? `🔓 Habilitado: ${p.nombre} ahora puede subir estudios y datos desde su portal.`
                : `🔒 Bloqueado: ${p.nombre} solo podrá ver su información.`);
        }
        renderSuiteClinicaModal(db, p);
    };

    function obtenerTabsDelPerfil(perfil, p, cantSes) {
        const verCons = checkSaludFeat(["consentimiento"]);
        const verRec = checkSaludFeat(["portalPaciente", "portalEstudios", "recetario", "estudios"]);

        if (perfil.tipo === "psicologia") {
            const verGeno = checkSaludFeat(["genograma"]);
            return [
                { id: "principal", lbl: `🧠 Sesiones y Ánimo (${cantSes})` },
                { id: "anamnesis_psico", lbl: `📋 Anamnesis y Tests` },
                ...(verGeno ? [{ id: "genograma", lbl: `🌳 Genograma (${p.genograma.length})` }] : []),
                ...(verCons ? [{ id: "consentimiento", lbl: `✍️ Consentimiento (${p.consentimientos.length})` }] : []),
                ...(verRec ? [{ id: "documentos", lbl: `📄 Informes y Estudios (${p.recetas.length + p.estudios.length})` }] : [])
            ];
        }

        if (perfil.tipo === "nutricion") {
            return [
                { id: "principal", lbl: `⚖️ Antropometría (${p.antropometria.length})` },
                { id: "plan_nutri", lbl: `🥗 Plan Alimentario` },
                { id: "habitos_nutri", lbl: `📋 Hábitos y Alergias` },
                ...(verCons ? [{ id: "consentimiento", lbl: `✍️ Consentimiento (${p.consentimientos.length})` }] : []),
                ...(verRec ? [{ id: "documentos", lbl: `🩻 Laboratorios y Portal (${p.estudios.length + p.recetas.length})` }] : [])
            ];
        }

        if (perfil.tipo === "fisico") {
            const verMapa = checkSaludFeat(["mapaCorporal", "mapa", "atlas"]);
            return [
                { id: "principal", lbl: `📝 Sesiones y EVA (${cantSes})` },
                ...(verMapa ? [{ id: "mapa", lbl: `🧍 Atlas Corporal HD (${p.mapaCorporal.length})` }] : []),
                { id: "eval_fisica", lbl: `📐 Evaluación Física / ROM` },
                ...(verCons ? [{ id: "consentimiento", lbl: `✍️ Consentimiento (${p.consentimientos.length})` }] : []),
                ...(verRec ? [{ id: "documentos", lbl: `💊 RP/ y Estudios (${p.recetas.length + p.estudios.length})` }] : [])
            ];
        }

        return [
            { id: "principal", lbl: `📝 Evoluciones (${cantSes})` },
            ...(verCons ? [{ id: "consentimiento", lbl: `✍️ Consentimiento (${p.consentimientos.length})` }] : []),
            ...(verRec ? [{ id: "documentos", lbl: `📄 Indicaciones y Estudios (${p.recetas.length + p.estudios.length})` }] : [])
        ];
    }

    function renderSuiteClinicaModal(db, p) {
        const perfil = obtenerPerfilDisciplina(p.especialidad);
        const mut = resolverMutualPaciente(db, p);
        const sesiones = (db.sesiones || []).filter(s => Number(s.pacienteId) === Number(p.id));
        const tabs = obtenerTabsDelPerfil(perfil, p, sesiones.length);
        if (!tabs.some(t => t.id === stClin.tab)) stClin.tab = tabs[0].id;

        const modal = asegurarModalSuite();
        modal.innerHTML = `
            <div class="modal-window">
                <div class="clin-hero" style="background:${perfil.gradiente};">
                    <div>
                        <span class="badge" style="background:rgba(255,255,255,0.18); color:#fff; font-size:0.66rem;">${perfil.tituloBadge} • ${escHtml(p.especialidad || "Consultorio")}</span>
                        <h3>${escHtml(p.apellido)}, ${escHtml(p.nombre)}</h3>
                        <small>
                            DNI ${escHtml(p.dni || "-")} • ${calcularEdad(p.fechaNacimiento)} años • ${escHtml(mut ? mut.nombre : "Particular")}
                            ${p.nroAfiliado ? `(Afil. ${escHtml(p.nroAfiliado)})` : ""} • Portal: <b>${escHtml(p.codigoAcceso)}</b>
                        </small>
                    </div>
                    <div class="clin-hero-actions">
                        <button type="button" class="btn btn-sm"
                            style="background:${p.puedeSubirEstudios ? "#10b981" : "rgba(255,255,255,0.16)"}; color:#fff; border:1px solid rgba(255,255,255,0.4);"
                            onclick="alternarPermisoSubidaPacienteClin()"
                            title="Permitir o bloquear que el paciente suba estudios y datos desde su portal">
                            ${p.puedeSubirEstudios ? "🔓 Subida Paciente: SÍ" : "🔒 Subida Paciente: NO"}
                        </button>
                        <button type="button" class="btn btn-sm" style="background:rgba(255,255,255,0.2); color:#fff; border:1px solid rgba(255,255,255,0.4);" onclick="imprimirResumenClinicoPacientePDF()">📄 Historia PDF A4</button>
                        <button type="button" class="btn btn-sm" style="background:rgba(255,255,255,0.14); color:#fff; border:1px solid rgba(255,255,255,0.35);" onclick="cerrarSuiteClinicaPacientePro()">✕</button>
                    </div>
                </div>

                ${p.antecedentes ? `<div style="background:rgba(245,158,11,0.11); border:1px solid rgba(245,158,11,0.38); border-radius:11px; padding:0.46rem 0.78rem; font-size:0.78rem; margin-bottom:0.75rem;">📌 <b>Nota Inicial / Antecedentes:</b> ${escHtml(p.antecedentes)}</div>` : ""}

                <div class="clin-tabs">
                    ${tabs.map(t => `
                        <button type="button" class="clin-tab ${stClin.tab === t.id ? "active" : ""}"
                            style="${stClin.tab === t.id ? `background:${perfil.accent};` : ""}"
                            onclick="cambiarTabSuiteClinica('${t.id}')">${t.lbl}</button>
                    `).join("")}
                </div>

                <div id="clinBodyContainer"></div>
            </div>
        `;

        const cont = document.getElementById("clinBodyContainer");
        if (!cont) return;

        if (stClin.tab === "principal") {
            if (perfil.tipo === "psicologia") renderTabSesionesPsico(cont, db, p);
            else if (perfil.tipo === "nutricion") renderTabAntropometriaNutri(cont, db, p);
            else if (perfil.tipo === "fisico") renderTabSesionesFisicoEva(cont, db, p);
            else renderTabSesionesGenericas(cont, db, p);
        } else if (stClin.tab === "mapa") renderTabAtlasHD(cont, db, p);
        else if (stClin.tab === "eval_fisica") renderTabEvalFisica(cont, db, p);
        else if (stClin.tab === "anamnesis_psico") renderTabAnamnesisPsico(cont, db, p);
        else if (stClin.tab === "genograma") renderTabGenograma(cont, db, p);
        else if (stClin.tab === "plan_nutri") renderTabPlanNutri(cont, db, p);
        else if (stClin.tab === "habitos_nutri") renderTabHabitosNutri(cont, db, p);
        else if (stClin.tab === "consentimiento") renderTabConsentimiento(cont, db, p, perfil);
        else if (stClin.tab === "documentos") renderTabDocumentosYEstudios(cont, db, p, perfil);
    }

    // =====================================================================
    // 4. HELPER DE CURVA SVG REUTILIZABLE (EVA / ÁNIMO / PESO)
    // =====================================================================
    function construirCurvaSVG({ titulo, puntos, minY, maxY, colorLinea, invertirColor = false, sufijo = "" }) {
        if (!Array.isArray(puntos) || puntos.length < 2) return "";
        const ult = puntos.slice(-10);
        const W = 540, H = 118, padL = 36, padR = 16, padT = 18, padB = 22;
        const innerW = W - padL - padR, innerH = H - padT - padB;
        const rango = Math.max(0.1, maxY - minY);

        const coords = ult.map((pt, i) => {
            const x = padL + (ult.length === 1 ? innerW / 2 : (i / (ult.length - 1)) * innerW);
            const y = padT + innerH - ((pt.valor - minY) / rango) * innerH;
            return { x, y, valor: pt.valor, lbl: pt.lbl };
        });
        const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
        const areaD = `${pathD} L ${coords[coords.length - 1].x.toFixed(1)} ${padT + innerH} L ${coords[0].x.toFixed(1)} ${padT + innerH} Z`;
        const diff = Math.round((coords[coords.length - 1].valor - coords[0].valor) * 10) / 10;
        const positivo = invertirColor ? diff <= 0 : diff >= 0;

        return `
            <div class="clin-chart-box">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; font-size:0.74rem;">
                    <b>${titulo}</b>
                    <span class="badge ${positivo ? "badge-ok" : "badge-warn"}">
                        Inicio: ${coords[0].valor}${sufijo} ➔ Actual: ${coords[coords.length - 1].valor}${sufijo} (${diff > 0 ? "+" : ""}${diff}${sufijo})
                    </span>
                </div>
                <svg viewBox="0 0 ${W} ${H}" style="width:100%; height:114px; display:block;">
                    <line x1="${padL}" y1="${padT}" x2="${W - padR}" y2="${padT}" stroke="#e2e8f0" stroke-dasharray="3 3"/>
                    <line x1="${padL}" y1="${padT + innerH / 2}" x2="${W - padR}" y2="${padT + innerH / 2}" stroke="#e2e8f0" stroke-dasharray="3 3"/>
                    <line x1="${padL}" y1="${padT + innerH}" x2="${W - padR}" y2="${padT + innerH}" stroke="#cbd5e1"/>
                    <text x="4" y="${padT + 4}" font-size="8.5" fill="#94a3b8">${Math.round(maxY * 10) / 10}</text>
                    <text x="4" y="${padT + innerH / 2 + 3}" font-size="8.5" fill="#94a3b8">${Math.round(((maxY + minY) / 2) * 10) / 10}</text>
                    <text x="4" y="${padT + innerH + 3}" font-size="8.5" fill="#94a3b8">${Math.round(minY * 10) / 10}</text>
                    <path d="${areaD}" fill="${colorLinea}1F"/>
                    <path d="${pathD}" fill="none" stroke="${colorLinea}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    ${coords.map(c => `
                        <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="4.3" fill="${colorLinea}" stroke="#fff" stroke-width="1.5"/>
                        <text x="${c.x.toFixed(1)}" y="${(c.y - 7).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="700" fill="#0f172a">${c.valor}</text>
                        <text x="${c.x.toFixed(1)}" y="${H - 5}" text-anchor="middle" font-size="8.5" fill="#64748b">${c.lbl}</text>
                    `).join("")}
                </svg>
            </div>
        `;
    }

    // =====================================================================
    // 5. PERFIL PSICOLOGÍA: SESIONES EMOCIONALES + ANAMNESIS + GENOGRAMA
    // =====================================================================
    function renderTabSesionesPsico(cont, db, p) {
        const asc = (db.sesiones || []).filter(s => Number(s.pacienteId) === Number(p.id)).sort((a, b) => String(a.fecha || "").localeCompare(String(b.fecha || "")));
        const desc = [...asc].reverse();
        const ptsAnimo = asc.filter(s => s.animo != null).map(s => ({ valor: Number(s.animo), lbl: String(s.fecha || "").slice(5) }));

        cont.innerHTML = `
            <form class="clin-box" onsubmit="guardarSesionPsicoPro(event)">
                <div class="grid-3" style="margin-bottom:0.6rem;">
                    <div class="field"><label>Fecha Sesión *</label><input type="date" id="psFecha" value="${hoyISO()}" required></div>
                    <div class="field"><label>Modalidad</label>
                        <select id="psMod"><option>Presencial</option><option>Online / Videollamada</option><option>Entrevista Familiar</option></select>
                    </div>
                    <div class="field"><label>🔑 Token / Orden (opc.)</label><input type="text" id="psTok" placeholder="Ej: 482910"></div>
                </div>
                <div class="grid-3" style="margin-bottom:0.6rem; background:var(--surface-solid); padding:0.55rem 0.7rem; border-radius:11px; border:1px solid var(--line);">
                    <div class="field">
                        <label>Estado de Ánimo (1–10)</label>
                        <div class="clin-eva-bar">
                            <input type="range" id="psAnimo" min="1" max="10" value="6" style="flex:1; min-height:20px; accent-color:#7c3aed;" oninput="document.getElementById('psAnimoB').textContent=this.value+'/10'">
                            <span id="psAnimoB" class="clin-eva-pill" style="background:#7c3aed;">6/10</span>
                        </div>
                    </div>
                    <div class="field">
                        <label>Nivel de Ansiedad (1–10)</label>
                        <div class="clin-eva-bar">
                            <input type="range" id="psAns" min="1" max="10" value="4" style="flex:1; min-height:20px; accent-color:#f59e0b;" oninput="document.getElementById('psAnsB').textContent=this.value+'/10'">
                            <span id="psAnsB" class="clin-eva-pill" style="background:#f59e0b;">4/10</span>
                        </div>
                    </div>
                    <div class="field">
                        <label>Calidad de Sueño (1–10)</label>
                        <div class="clin-eva-bar">
                            <input type="range" id="psSueno" min="1" max="10" value="7" style="flex:1; min-height:20px; accent-color:#0284c7;" oninput="document.getElementById('psSuenoB').textContent=this.value+'/10'">
                            <span id="psSuenoB" class="clin-eva-pill" style="background:#0284c7;">7/10</span>
                        </div>
                    </div>
                </div>
                <div class="field" style="margin-bottom:0.55rem;">
                    <label>Evolución Confidencial de la Sesión *</label>
                    <textarea id="psEvo" rows="3" required placeholder="Temáticas trabajadas, intervenciones, observaciones del discurso y afectividad..."></textarea>
                </div>
                <div class="field" style="margin-bottom:0.65rem;">
                    <label>Acuerdos / Tareas Terapéuticas entre Sesiones (visibles en el Portal del Paciente)</label>
                    <input type="text" id="psTareas" placeholder="Ej: Registro de pensamientos automáticos, técnica de respiración...">
                </div>
                <button type="submit" class="btn btn-primary btn-sm" style="width:100%; background:#7c3aed; border-color:#7c3aed;">💾 Registrar Sesión Psicológica</button>
            </form>

            ${construirCurvaSVG({ titulo: "📈 Evolución del Estado de Ánimo (1–10)", puntos: ptsAnimo, minY: 1, maxY: 10, colorLinea: "#7c3aed", invertirColor: false })}

            <div style="display:flex; flex-direction:column; gap:0.5rem; max-height:310px; overflow-y:auto;">
                ${desc.length === 0 ? `<div class="empty-box" style="padding:1.1rem;">Todavía no hay sesiones registradas para ${escHtml(p.nombre)}.</div>` :
                desc.map(s => `
                    <div style="background:var(--surface-solid); border:1px solid var(--line); border-left:4px solid #7c3aed; border-radius:12px; padding:0.7rem 0.85rem; font-size:0.81rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem; flex-wrap:wrap; margin-bottom:4px;">
                            <div>
                                <strong>📅 ${escHtml(s.fecha)}</strong>
                                ${s.modalidad ? `<span class="badge badge-celeste" style="margin-left:4px;">${escHtml(s.modalidad)}</span>` : ""}
                                ${s.animo != null ? `<span class="badge" style="background:${colorPorBienestar(s.animo)}; color:#fff; margin-left:4px;">Ánimo ${s.animo}/10</span>` : ""}
                                ${s.ansiedad != null ? `<span class="badge badge-warn" style="margin-left:4px;">Ansiedad ${s.ansiedad}/10</span>` : ""}
                                ${s.sueno != null ? `<span class="badge badge-purple" style="margin-left:4px;">Sueño ${s.sueno}/10</span>` : ""}
                                ${s.token ? `<span class="badge" style="margin-left:4px;">🔑 ${escHtml(s.token)}</span>` : ""}
                            </div>
                            <button type="button" class="btn btn-danger btn-sm" style="min-height:24px; padding:0 7px;" onclick="eliminarSesionClinicaPro(${s.id})">🗑️</button>
                        </div>
                        <div style="color:var(--ink-800); white-space:pre-line;">${escHtml(s.evolucion)}</div>
                        ${s.indicaciones ? `<div style="margin-top:4px; font-size:0.76rem; color:#6d28d9;"><b>📌 Tareas / Acuerdos:</b> ${escHtml(s.indicaciones)}</div>` : ""}
                    </div>
                `).join("")}
            </div>
        `;
    }

    window.guardarSesionPsicoPro = function (e) {
        e.preventDefault();
        const { db, p } = obtenerPacienteActivo();
        if (!p) return;
        db.sesiones.unshift({
            id: Date.now(),
            pacienteId: p.id,
            especialidad: p.especialidad,
            fecha: document.getElementById("psFecha").value || hoyISO(),
            modalidad: document.getElementById("psMod").value,
            token: document.getElementById("psTok").value.trim(),
            animo: Number(document.getElementById("psAnimo").value),
            ansiedad: Number(document.getElementById("psAns").value),
            sueno: Number(document.getElementById("psSueno").value),
            evolucion: document.getElementById("psEvo").value.trim(),
            indicaciones: document.getElementById("psTareas").value.trim()
        });
        guardarDatosConsultorioCDM(db);
        if (typeof mostrarToast === "function") mostrarToast("🧠 Sesión psicológica archivada.");
        renderSuiteClinicaModal(db, p);
    };

    function renderTabAnamnesisPsico(cont, db, p) {
        const a = p.anamnesisPsico;
        cont.innerHTML = `
            <form class="clin-box" onsubmit="guardarAnamnesisPsicoPro(event)">
                <strong style="display:block; font-size:0.9rem; margin-bottom:0.65rem;">📋 Ficha de Admisión, Anamnesis y Escalas Psicológicas</strong>
                <div class="field" style="margin-bottom:0.55rem;"><label>Motivo de Consulta (Manifiesto / Demanda Inicial)</label><textarea id="apMot" rows="2" placeholder="¿Qué trae al paciente a consulta?">${escHtml(a.motivoManifiesto)}</textarea></div>
                <div class="clin-grid-2" style="margin-bottom:0.55rem;">
                    <div class="field"><label>Antecedentes Psicológicos / Tratamientos Previos</label><textarea id="apAnt" rows="2" placeholder="Terapias anteriores, internaciones, derivación...">${escHtml(a.antecedentes)}</textarea></div>
                    <div class="field"><label>Medicación Actual / Psiquiatra de Cabecera</label><textarea id="apMed" rows="2" placeholder="Fármaco, dosis y profesional derivante (si aplica)...">${escHtml(a.medicacion)}</textarea></div>
                </div>
                <div class="clin-grid-2" style="margin-bottom:0.55rem;">
                    <div class="field"><label>Red de Sostén / Contexto Laboral o Escolar</label><textarea id="apRed" rows="2" placeholder="Con quién convive, ocupación, vínculos clave...">${escHtml(a.redSosten)}</textarea></div>
                    <div class="field"><label>Objetivos Terapéuticos</label><textarea id="apObj" rows="2" placeholder="Metas a corto y mediano plazo...">${escHtml(a.objetivos)}</textarea></div>
                </div>
                <div class="field" style="margin-bottom:0.7rem;"><label>Tests / Escalas Aplicadas y Resultados</label><textarea id="apEsc" rows="2" placeholder="Ej: Inventario de Beck (BDI-II), Hamilton, HTP, WISC-V...">${escHtml(a.escalas)}</textarea></div>
                <button type="submit" class="btn btn-primary btn-sm" style="width:100%; background:#7c3aed; border-color:#7c3aed;">💾 Guardar Anamnesis Psicológica</button>
            </form>
        `;
    }

    window.guardarAnamnesisPsicoPro = function (e) {
        e.preventDefault();
        const { db, p } = obtenerPacienteActivo();
        if (!p) return;
        p.anamnesisPsico = {
            motivoManifiesto: document.getElementById("apMot").value.trim(),
            antecedentes: document.getElementById("apAnt").value.trim(),
            medicacion: document.getElementById("apMed").value.trim(),
            redSosten: document.getElementById("apRed").value.trim(),
            objetivos: document.getElementById("apObj").value.trim(),
            escalas: document.getElementById("apEsc").value.trim()
        };
        guardarDatosConsultorioCDM(db);
        if (typeof mostrarToast === "function") mostrarToast("📋 Anamnesis psicológica actualizada.");
    };

    const VINCULOS_META = {
        cercano: { lbl: "💚 Cercano / Apoyo", cls: "v-cercano" },
        normal: { lbl: "🔵 Vínculo Estable", cls: "v-normal" },
        distante: { lbl: "⚪ Distante", cls: "v-distante" },
        conflictivo: { lbl: "⚡ Conflictivo / Tenso", cls: "v-conflictivo" },
        fallecido: { lbl: "✝️ Fallecido/a", cls: "v-fallecido" }
    };

    function renderTabGenograma(cont, db, p) {
        const lista = p.genograma || [];
        const deGrupo = (roles) => lista.filter(g => roles.includes(g.rol));
        const gen1 = deGrupo(["Abuelo/a"]);
        const gen2 = deGrupo(["Madre", "Padre", "Tío/a / Tutor"]);
        const gen3 = deGrupo(["Hermano/a", "Pareja / Ex-Pareja"]);
        const gen4 = deGrupo(["Hijo/a"]);
        const otros = deGrupo(["Amigo/a / Red de Apoyo", "Otro"]);

        const cardNodo = (g) => {
            const vm = VINCULOS_META[g.vinculo] || VINCULOS_META.normal;
            return `
                <div class="clin-geno-node ${vm.cls}">
                    <button type="button" class="clin-geno-del" onclick="eliminarVinculoGenograma(${g.id})" title="Quitar">✕</button>
                    <small style="display:block; font-size:0.65rem; font-weight:800; text-transform:uppercase; color:var(--ink-500);">${escHtml(g.rol)}${g.edad ? ` (${escHtml(g.edad)}a)` : ""}</small>
                    <strong style="display:block; font-size:0.83rem; margin:2px 0;">${escHtml(g.nombre)}</strong>
                    <span style="font-size:0.67rem; font-weight:700;">${vm.lbl}${g.viveCon ? " • 🏠" : ""}</span>
                    ${g.nota ? `<small style="display:block; font-size:0.67rem; color:var(--ink-500); margin-top:2px;">${escHtml(g.nota)}</small>` : ""}
                </div>
            `;
        };

        cont.innerHTML = `
            <div class="clin-geno-board">
                ${gen1.length ? `<div class="clin-geno-gen"><span class="clin-geno-gen-lbl">1ª Generación — Abuelos</span><div class="clin-geno-row">${gen1.map(cardNodo).join("")}</div></div>` : ""}
                ${gen2.length ? `<div class="clin-geno-gen"><span class="clin-geno-gen-lbl">2ª Generación — Padres / Tutores</span><div class="clin-geno-row">${gen2.map(cardNodo).join("")}</div></div>` : ""}
                <div class="clin-geno-gen">
                    <span class="clin-geno-gen-lbl">Núcleo Actual — Paciente, Pareja y Hermanos</span>
                    <div class="clin-geno-row">
                        <div class="clin-geno-node is-pac">
                            <small style="display:block; font-size:0.64rem; opacity:0.85;">PACIENTE</small>
                            <strong style="display:block; font-size:0.88rem;">${escHtml(p.nombre)} ${escHtml(p.apellido)}</strong>
                            <span style="font-size:0.68rem;">${calcularEdad(p.fechaNacimiento)} años</span>
                        </div>
                        ${gen3.map(cardNodo).join("")}
                    </div>
                </div>
                ${gen4.length ? `<div class="clin-geno-gen"><span class="clin-geno-gen-lbl">Descendencia — Hijos</span><div class="clin-geno-row">${gen4.map(cardNodo).join("")}</div></div>` : ""}
                ${otros.length ? `<div class="clin-geno-gen"><span class="clin-geno-gen-lbl">Red de Apoyo / Otros Vínculos</span><div class="clin-geno-row">${otros.map(cardNodo).join("")}</div></div>` : ""}
            </div>

            <form class="clin-box" onsubmit="agregarVinculoGenograma(event)">
                <strong style="display:block; font-size:0.85rem; margin-bottom:0.55rem;">➕ Agregar Familiar o Vínculo al Genograma</strong>
                <div class="grid-3" style="margin-bottom:0.55rem;">
                    <div class="field"><label>Nombre *</label><input type="text" id="clGenNom" required placeholder="Ej: Laura"></div>
                    <div class="field"><label>Rol / Parentesco *</label>
                        <select id="clGenRol">
                            <option>Madre</option><option>Padre</option><option>Hermano/a</option>
                            <option>Pareja / Ex-Pareja</option><option>Hijo/a</option>
                            <option>Abuelo/a</option><option>Tío/a / Tutor</option>
                            <option>Amigo/a / Red de Apoyo</option><option>Otro</option>
                        </select>
                    </div>
                    <div class="field"><label>Tipo de Vínculo</label>
                        <select id="clGenVin">
                            <option value="cercano">💚 Cercano / Apoyo</option>
                            <option value="normal" selected>🔵 Estable</option>
                            <option value="distante">⚪ Distante</option>
                            <option value="conflictivo">⚡ Conflictivo / Tenso</option>
                            <option value="fallecido">✝️ Fallecido/a</option>
                        </select>
                    </div>
                </div>
                <div class="grid-3" style="margin-bottom:0.65rem;">
                    <div class="field"><label>Edad (opc.)</label><input type="number" id="clGenEdad" min="0" max="115" placeholder="Ej: 54"></div>
                    <div class="field" style="grid-column:span 2;"><label>Observación Clínica (opc.)</label><input type="text" id="clGenNota" placeholder="Ej: Principal sostén emocional..."></div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
                    <label style="display:inline-flex; align-items:center; gap:0.45rem; font-size:0.8rem; font-weight:700; cursor:pointer;">
                        <input type="checkbox" id="clGenVive" style="width:17px; height:17px; min-height:auto;"> 🏠 Convive con el paciente
                    </label>
                    <button type="submit" class="btn btn-primary btn-sm" style="background:#7c3aed; border-color:#7c3aed;">+ Agregar al Árbol</button>
                </div>
            </form>
        `;
    }

    window.agregarVinculoGenograma = function (e) {
        e.preventDefault();
        const { db, p } = obtenerPacienteActivo();
        if (!p) return;
        p.genograma.push({
            id: Date.now(),
            nombre: document.getElementById("clGenNom").value.trim(),
            rol: document.getElementById("clGenRol").value,
            vinculo: document.getElementById("clGenVin").value,
            edad: document.getElementById("clGenEdad").value.trim(),
            viveCon: Boolean(document.getElementById("clGenVive").checked),
            nota: document.getElementById("clGenNota").value.trim()
        });
        guardarDatosConsultorioCDM(db);
        if (typeof mostrarToast === "function") mostrarToast("🌳 Vínculo agregado al genograma.");
        renderSuiteClinicaModal(db, p);
    };

    window.eliminarVinculoGenograma = function (idG) {
        const { db, p } = obtenerPacienteActivo();
        if (!p) return;
        p.genograma = p.genograma.filter(x => Number(x.id) !== Number(idG));
        guardarDatosConsultorioCDM(db);
        renderSuiteClinicaModal(db, p);
    };

    // =====================================================================
    // 6. PERFIL NUTRICIÓN: ANTROPOMETRÍA + PLAN ALIMENTARIO + HÁBITOS
    // =====================================================================
    function renderTabAntropometriaNutri(cont, db, p) {
        const asc = [...p.antropometria].sort((a, b) => String(a.fecha || "").localeCompare(String(b.fecha || "")));
        const desc = [...asc].reverse();
        const ult = desc[0] || null;
        const imcInfo = ult ? clasificarIMC(ult.imc) : { txt: "Sin registros", col: "#64748b" };

        const pesos = asc.filter(a => a.peso > 0).map(a => ({ valor: Number(a.peso), lbl: String(a.fecha || "").slice(5) }));
        const minP = pesos.length ? Math.floor(Math.min(...pesos.map(x => x.valor)) - 3) : 40;
        const maxP = pesos.length ? Math.ceil(Math.max(...pesos.map(x => x.valor)) + 3) : 100;

        cont.innerHTML = `
            <div class="clin-kpi-row">
                <div class="clin-kpi" style="border-top-color:#16a34a;"><small>Peso Actual</small><strong>${ult?.peso ? `${ult.peso} kg` : "-"}</strong></div>
                <div class="clin-kpi" style="border-top-color:${imcInfo.col};"><small>IMC (${imcInfo.txt})</small><strong>${ult?.imc || "-"}</strong></div>
                <div class="clin-kpi" style="border-top-color:#f59e0b;"><small>% Grasa / % Músculo</small><strong>${ult?.grasa || "-"}% / ${ult?.musculo || "-"}%</strong></div>
                <div class="clin-kpi" style="border-top-color:#0284c7;"><small>Cintura / Cadera</small><strong>${ult?.cintura || "-"} / ${ult?.cadera || "-"} cm</strong></div>
            </div>

            <form class="clin-box" onsubmit="guardarControlNutriPro(event)">
                <strong style="display:block; font-size:0.86rem; margin-bottom:0.55rem;">⚖️ Nuevo Control Antropométrico</strong>
                <div class="grid-4" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(125px, 1fr)); gap:0.5rem; margin-bottom:0.55rem;">
                    <div class="field"><label>Fecha *</label><input type="date" id="nuFec" value="${hoyISO()}" required></div>
                    <div class="field"><label>Peso (kg) *</label><input type="number" step="0.1" id="nuPeso" required placeholder="Ej: 72.5" value="${ult?.peso || ""}"></div>
                    <div class="field"><label>Talla (cm) *</label><input type="number" step="0.5" id="nuTalla" required placeholder="Ej: 170" value="${ult?.talla || ""}"></div>
                    <div class="field"><label>% Grasa</label><input type="number" step="0.1" id="nuGrasa" placeholder="Ej: 22.4"></div>
                    <div class="field"><label>% Músculo</label><input type="number" step="0.1" id="nuMusc" placeholder="Ej: 39.0"></div>
                    <div class="field"><label>Cintura (cm)</label><input type="number" step="0.5" id="nuCint" placeholder="Ej: 82"></div>
                    <div class="field"><label>Cadera (cm)</label><input type="number" step="0.5" id="nuCad" placeholder="Ej: 98"></div>
                    <div class="field"><label>🔑 Token (opc.)</label><input type="text" id="nuTok" placeholder="Opcional"></div>
                </div>
                <div class="field" style="margin-bottom:0.65rem;"><label>Evolución / Adherencia al Plan</label><input type="text" id="nuNota" placeholder="Ej: Buena adherencia, bajó 1.2 kg de grasa manteniendo masa muscular..."></div>
                <button type="submit" class="btn btn-ok btn-sm" style="width:100%;">💾 Registrar Control Antropométrico</button>
            </form>

            ${construirCurvaSVG({ titulo: "📉 Evolución de Peso Corporal (kg)", puntos: pesos, minY: minP, maxY: maxP, colorLinea: "#16a34a", invertirColor: true, sufijo: " kg" })}

            <div class="table-wrap" style="max-height:240px; overflow-y:auto;">
                <table class="app-table" style="font-size:0.79rem;">
                    <thead><tr><th>Fecha</th><th>Peso / Talla</th><th>IMC</th><th>% Grasa / Músc.</th><th>Cintura / Cadera</th><th>Nota</th><th></th></tr></thead>
                    <tbody>
                        ${desc.length === 0 ? `<tr><td colspan="7"><div class="empty-box" style="padding:0.9rem;">Sin mediciones cargadas todavía.</div></td></tr>` :
                        desc.map(a => {
                            const ci = clasificarIMC(a.imc);
                            return `
                                <tr>
                                    <td><b>${escHtml(a.fecha)}</b></td>
                                    <td><b>${a.peso} kg</b> • ${a.talla} cm</td>
                                    <td><span class="badge" style="background:${ci.col}; color:#fff;">${a.imc} (${ci.txt})</span></td>
                                    <td>${a.grasa || "-"}% / ${a.musculo || "-"}%</td>
                                    <td>${a.cintura || "-"} / ${a.cadera || "-"} cm</td>
                                    <td>${escHtml(a.nota || "-")}</td>
                                    <td><button type="button" class="btn btn-danger btn-sm" style="min-height:24px; padding:0 6px;" onclick="eliminarControlNutriPro(${a.id})">✕</button></td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        `;
    }

    window.guardarControlNutriPro = function (e) {
        e.preventDefault();
        const { db, p } = obtenerPacienteActivo();
        if (!p) return;
        const peso = parseFloat(document.getElementById("nuPeso").value) || 0;
        const talla = parseFloat(document.getElementById("nuTalla").value) || 0;
        const imc = talla > 0 ? Math.round((peso / Math.pow(talla / 100, 2)) * 10) / 10 : 0;
        p.antropometria.push({
            id: Date.now(),
            fecha: document.getElementById("nuFec").value || hoyISO(),
            peso, talla, imc,
            grasa: document.getElementById("nuGrasa").value.trim(),
            musculo: document.getElementById("nuMusc").value.trim(),
            cintura: document.getElementById("nuCint").value.trim(),
            cadera: document.getElementById("nuCad").value.trim(),
            token: document.getElementById("nuTok").value.trim(),
            nota: document.getElementById("nuNota").value.trim()
        });
        guardarDatosConsultorioCDM(db);
        if (typeof mostrarToast === "function") mostrarToast(`⚖️ Control guardado (IMC ${imc}).`);
        renderSuiteClinicaModal(db, p);
    };

    window.eliminarControlNutriPro = function (idA) {
        const { db, p } = obtenerPacienteActivo();
        if (!p) return;
        p.antropometria = p.antropometria.filter(x => Number(x.id) !== Number(idA));
        guardarDatosConsultorioCDM(db);
        renderSuiteClinicaModal(db, p);
    };

    function renderTabPlanNutri(cont, db, p) {
        const pl = p.planNutri;
        cont.innerHTML = `
            <form class="clin-box" onsubmit="guardarPlanNutriPro(event)">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.65rem;">
                    <strong style="font-size:0.9rem;">🥗 Plan Alimentario y Distribución de Comidas</strong>
                    <div style="display:flex; gap:0.35rem;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="imprimirPlanNutriA4()">🖨️ PDF Plan A4</button>
                        <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarPlanNutriWA()">📲 Enviar por WA</button>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:0.5rem; margin-bottom:0.65rem;">
                    <div class="field"><label>Objetivo</label>
                        <select id="npObj">
                            ${["Descenso de Peso", "Recomposición Corporal", "Hipertrofia / Masa Muscular", "Nutrición Deportiva", "Educación Alimentaria", "Patología Clínica"].map(o => `<option ${pl.objetivo === o ? "selected" : ""}>${o}</option>`).join("")}
                        </select>
                    </div>
                    <div class="field"><label>Kcal / Día</label><input type="text" id="npKcal" value="${escHtml(pl.kcal)}" placeholder="Ej: 1850 kcal"></div>
                    <div class="field"><label>Proteínas (g)</label><input type="text" id="npProt" value="${escHtml(pl.prot)}" placeholder="Ej: 130 g"></div>
                    <div class="field"><label>Carbos (g)</label><input type="text" id="npCarb" value="${escHtml(pl.carb)}" placeholder="Ej: 190 g"></div>
                    <div class="field"><label>Grasas (g)</label><input type="text" id="npGras" value="${escHtml(pl.grasas)}" placeholder="Ej: 60 g"></div>
                    <div class="field"><label>Agua / Día</label><input type="text" id="npAgua" value="${escHtml(pl.agua)}" placeholder="Ej: 2.5 L"></div>
                </div>
                <div class="clin-grid-2" style="margin-bottom:0.55rem;">
                    <div class="field"><label>☕ Desayuno</label><textarea id="npDes" rows="2" placeholder="Opciones de desayuno...">${escHtml(pl.desayuno)}</textarea></div>
                    <div class="field"><label>🍎 Colación Mañana</label><textarea id="npCol1" rows="2" placeholder="Fruta, frutos secos, yogur...">${escHtml(pl.colacionAM)}</textarea></div>
                    <div class="field"><label>🍽️ Almuerzo</label><textarea id="npAlm" rows="2" placeholder="Proteína + vegetales + carbohidrato complejo...">${escHtml(pl.almuerzo)}</textarea></div>
                    <div class="field"><label>🍵 Merienda</label><textarea id="npMer" rows="2" placeholder="Opciones de merienda...">${escHtml(pl.merienda)}</textarea></div>
                    <div class="field"><label>🌙 Cena</label><textarea id="npCen" rows="2" placeholder="Opciones de cena...">${escHtml(pl.cena)}</textarea></div>
                    <div class="field"><label>💊 Suplementación / Colación PM</label><textarea id="npSup" rows="2" placeholder="Ej: Creatina 5g, Omega 3, Vit D...">${escHtml(pl.suplementacion)}</textarea></div>
                </div>
                <button type="submit" class="btn btn-ok btn-sm" style="width:100%;">💾 Guardar Plan Alimentario</button>
            </form>
        `;
    }

    window.guardarPlanNutriPro = function (e) {
        e.preventDefault();
        const { db, p } = obtenerPacienteActivo();
        if (!p) return;
        p.planNutri = {
            objetivo: document.getElementById("npObj").value,
            kcal: document.getElementById("npKcal").value.trim(),
            prot: document.getElementById("npProt").value.trim(),
            carb: document.getElementById("npCarb").value.trim(),
            grasas: document.getElementById("npGras").value.trim(),
            agua: document.getElementById("npAgua").value.trim(),
            desayuno: document.getElementById("npDes").value.trim(),
            colacionAM: document.getElementById("npCol1").value.trim(),
            almuerzo: document.getElementById("npAlm").value.trim(),
            merienda: document.getElementById("npMer").value.trim(),
            cena: document.getElementById("npCen").value.trim(),
            suplementacion: document.getElementById("npSup").value.trim()
        };
        guardarDatosConsultorioCDM(db);
        if (typeof mostrarToast === "function") mostrarToast("🥗 Plan alimentario guardado.");
    };

    window.imprimirPlanNutriA4 = function () {
        const { p } = obtenerPacienteActivo();
        if (!p) return;
        const pl = p.planNutri;
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : { nombreEntidad: "Consultorio" };
        const fila = (tit, val) => val ? `<tr><td style="width:24%; font-weight:800; background:#f8fafc;">${tit}</td><td style="white-space:pre-line;">${escHtml(val)}</td></tr>` : "";
        imprimirA4(`
            <div style="border-bottom:2.5px solid #16a34a; padding-bottom:0.7rem; margin-bottom:0.9rem; display:flex; justify-content:space-between;">
                <div>
                    <div style="font-size:0.7rem; font-weight:800; color:#16a34a;">PLAN ALIMENTARIO PERSONALIZADO</div>
                    <h2 style="margin:2px 0;">${escHtml(p.apellido)}, ${escHtml(p.nombre)}</h2>
                    <small>${escHtml(lic.nombreEntidad)} • Objetivo: <b>${escHtml(pl.objetivo)}</b></small>
                </div>
                <div style="text-align:right; font-size:0.78rem;">
                    <b>Fecha:</b> ${new Date().toLocaleDateString("es-AR")}<br>
                    ${pl.kcal ? `<b>Meta:</b> ${escHtml(pl.kcal)} • ` : ""}<b>Agua:</b> ${escHtml(pl.agua || "-")}
                </div>
            </div>
            ${(pl.prot || pl.carb || pl.grasas) ? `<div style="margin-bottom:0.8rem; font-size:0.8rem;"><b>Macros diarios:</b> Proteínas ${escHtml(pl.prot || "-")} • Carbohidratos ${escHtml(pl.carb || "-")} • Grasas ${escHtml(pl.grasas || "-")}</div>` : ""}
            <table>
                <tbody>
                    ${fila("☕ Desayuno", pl.desayuno)}
                    ${fila("🍎 Colación AM", pl.colacionAM)}
                    ${fila("🍽️ Almuerzo", pl.almuerzo)}
                    ${fila("🍵 Merienda", pl.merienda)}
                    ${fila("🌙 Cena", pl.cena)}
                    ${fila("💊 Suplementación", pl.suplementacion)}
                </tbody>
            </table>
        `);
    };

    window.enviarPlanNutriWA = function () {
        const { p } = obtenerPacienteActivo();
        if (!p) return;
        const pl = p.planNutri;
        const tel = String(p.whatsapp || "").replace(/\D/g, "");
        const bloques = [
            `🥗 *PLAN ALIMENTARIO — ${p.nombre} ${p.apellido}*`,
            `🎯 Objetivo: ${pl.objetivo}${pl.kcal ? ` (${pl.kcal})` : ""}`,
            pl.desayuno ? `\n☕ *Desayuno:* ${pl.desayuno}` : "",
            pl.colacionAM ? `🍎 *Colación AM:* ${pl.colacionAM}` : "",
            pl.almuerzo ? `🍽️ *Almuerzo:* ${pl.almuerzo}` : "",
            pl.merienda ? `🍵 *Merienda:* ${pl.merienda}` : "",
            pl.cena ? `🌙 *Cena:* ${pl.cena}` : "",
            pl.suplementacion ? `💊 *Suplementación:* ${pl.suplementacion}` : "",
            pl.agua ? `\n💧 *Hidratación:* ${pl.agua}` : ""
        ].filter(Boolean).join("\n");
        window.open(tel ? `https://wa.me/${tel}?text=${encodeURIComponent(bloques)}` : `https://wa.me/?text=${encodeURIComponent(bloques)}`, "_blank");
    };

    function renderTabHabitosNutri(cont, db, p) {
        const h = p.habitosNutri;
        cont.innerHTML = `
            <form class="clin-box" onsubmit="guardarHabitosNutriPro(event)">
                <strong style="display:block; font-size:0.9rem; margin-bottom:0.65rem;">📋 Anamnesis Alimentaria, Alergias y Hábitos</strong>
                <div class="clin-grid-2" style="margin-bottom:0.55rem;">
                    <div class="field"><label>Patologías / Diagnósticos Clínicos</label><textarea id="hnPat" rows="2" placeholder="Diabetes, HTA, hipotiroidismo, dislipemia, gastritis...">${escHtml(h.patologias)}</textarea></div>
                    <div class="field"><label>Alergias / Intolerancias Alimentarias</label><textarea id="hnAle" rows="2" placeholder="Celiaquía, lactosa, frutos secos, vegano/vegetariano...">${escHtml(h.alergias)}</textarea></div>
                    <div class="field"><label>Preferencias y Aversiones</label><textarea id="hnPref" rows="2" placeholder="Alimentos que le gustan / no consume...">${escHtml(h.preferencias)}</textarea></div>
                    <div class="field"><label>Actividad Física Semanal</label><textarea id="hnAct" rows="2" placeholder="Deporte, días, intensidad y horarios de entreno...">${escHtml(h.actividadFisica)}</textarea></div>
                    <div class="field"><label>Horarios de Comidas y Descanso</label><input type="text" id="hnHor" value="${escHtml(h.horariosSueno)}" placeholder="Ej: Se levanta 7hs, entrena 19hs, duerme 7hs"></div>
                    <div class="field"><label>Consumo de Agua / Infusiones / Alcohol</label><input type="text" id="hnHid" value="${escHtml(h.hidratacion)}" placeholder="Ej: 1.5L agua, mate amargo, alcohol fines de semana"></div>
                </div>
                <button type="submit" class="btn btn-ok btn-sm" style="width:100%;">💾 Guardar Hábitos Alimentarios</button>
            </form>
        `;
    }

    window.guardarHabitosNutriPro = function (e) {
        e.preventDefault();
        const { db, p } = obtenerPacienteActivo();
        if (!p) return;
        p.habitosNutri = {
            patologias: document.getElementById("hnPat").value.trim(),
            alergias: document.getElementById("hnAle").value.trim(),
            preferencias: document.getElementById("hnPref").value.trim(),
            actividadFisica: document.getElementById("hnAct").value.trim(),
            horariosSueno: document.getElementById("hnHor").value.trim(),
            hidratacion: document.getElementById("hnHid").value.trim()
        };
        guardarDatosConsultorioCDM(db);
        if (typeof mostrarToast === "function") mostrarToast("📋 Hábitos nutricionales guardados.");
    };

    // =====================================================================
    // 7. PERFIL FÍSICO (KINE / QUIRO / TRAUMA): SESIONES EVA + ATLAS HD + EVAL. FÍSICA
    // =====================================================================
    function renderTabSesionesFisicoEva(cont, db, p) {
        const verEva = checkSaludFeat(["eva"]);
        const asc = (db.sesiones || []).filter(s => Number(s.pacienteId) === Number(p.id)).sort((a, b) => String(a.fecha || "").localeCompare(String(b.fecha || "")));
        const desc = [...asc].reverse();
        const ptsEva = asc.filter(s => s.eva != null).map(s => ({ valor: Number(s.eva), lbl: String(s.fecha || "").slice(5) }));

        cont.innerHTML = `
            <form class="clin-box" onsubmit="guardarSesionFisicoPro(event)">
                <div class="grid-3" style="margin-bottom:0.6rem;">
                    <div class="field"><label>Fecha Sesión *</label><input type="date" id="fiFecha" value="${hoyISO()}" required></div>
                    <div class="field"><label>🔑 Token / N° Orden (opc.)</label><input type="text" id="fiTok" placeholder="Ej: 482910"></div>
                    ${verEva ? `
                        <div class="field">
                            <label>Dolor EVA (0 sin dolor — 10 máximo)</label>
                            <div class="clin-eva-bar">
                                <input type="range" id="fiEva" min="0" max="10" value="4" style="flex:1; min-height:20px; accent-color:#0284c7;" oninput="actualizarBadgeEvaForm(this.value)">
                                <span id="clSesEvaBadge" class="clin-eva-pill" style="background:#f59e0b;">4 / 10</span>
                            </div>
                        </div>
                    ` : `<div class="field"><label>Técnica Principal</label><input type="text" id="fiTec" placeholder="Terapia manual, ajuste..."></div>`}
                </div>
                <div class="field" style="margin-bottom:0.55rem;">
                    <label>Tratamiento Realizado / Evolución Física *</label>
                    <textarea id="fiEvo" rows="3" required placeholder="Ajustes vertebrales, terapia manual, fisioterapia, ejercicios terapéuticos y respuesta..."></textarea>
                </div>
                <div class="field" style="margin-bottom:0.65rem;">
                    <label>Ejercicios / Indicaciones para Casa (visibles en el Portal del Paciente)</label>
                    <input type="text" id="fiInd" placeholder="Ej: Hielo 15 min, movilidad lumbar, evitar impacto 48hs...">
                </div>
                <button type="submit" class="btn btn-primary btn-sm" style="width:100%;">💾 Registrar Sesión en Historia Clínica</button>
            </form>

            ${verEva ? construirCurvaSVG({ titulo: "📉 Curva de Dolor (Escala EVA 0–10)", puntos: ptsEva, minY: 0, maxY: 10, colorLinea: "#0284c7", invertirColor: true }) : ""}

            <div style="display:flex; flex-direction:column; gap:0.5rem; max-height:310px; overflow-y:auto;">
                ${desc.length === 0 ? `<div class="empty-box" style="padding:1.1rem;">Todavía no hay sesiones registradas para ${escHtml(p.nombre)}.</div>` :
                desc.map(s => `
                    <div style="background:var(--surface-solid); border:1px solid var(--line); border-left:4px solid ${verEva && s.eva != null ? colorPorEva(s.eva) : "#0284c7"}; border-radius:12px; padding:0.7rem 0.85rem; font-size:0.81rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem; flex-wrap:wrap; margin-bottom:4px;">
                            <div>
                                <strong>📅 ${escHtml(s.fecha)}</strong>
                                ${verEva && s.eva != null ? `<span class="badge" style="background:${colorPorEva(s.eva)}; color:#fff; margin-left:4px;">EVA ${s.eva}/10</span>` : ""}
                                ${s.token ? `<span class="badge badge-purple" style="margin-left:4px;">🔑 ${escHtml(s.token)}</span>` : ""}
                            </div>
                            <button type="button" class="btn btn-danger btn-sm" style="min-height:24px; padding:0 7px;" onclick="eliminarSesionClinicaPro(${s.id})">🗑️</button>
                        </div>
                        <div style="color:var(--ink-800); white-space:pre-line;">${escHtml(s.evolucion)}</div>
                        ${s.indicaciones ? `<div style="margin-top:4px; font-size:0.76rem; color:var(--cdm-700);"><b>🏠 Indicaciones:</b> ${escHtml(s.indicaciones)}</div>` : ""}
                    </div>
                `).join("")}
            </div>
        `;
    }

    window.actualizarBadgeEvaForm = function (val) {
        const b = document.getElementById("clSesEvaBadge");
        if (!b) return;
        b.textContent = `${val} / 10`;
        b.style.background = colorPorEva(val);
    };

    window.guardarSesionFisicoPro = function (e) {
        e.preventDefault();
        const { db, p } = obtenerPacienteActivo();
        if (!p) return;
        const evaEl = document.getElementById("fiEva");
        db.sesiones.unshift({
            id: Date.now(),
            pacienteId: p.id,
            especialidad: p.especialidad,
            fecha: document.getElementById("fiFecha").value || hoyISO(),
            eva: evaEl ? Number(evaEl.value) : null,
            token: document.getElementById("fiTok").value.trim(),
            evolucion: document.getElementById("fiEvo").value.trim(),
            indicaciones: document.getElementById("fiInd").value.trim()
        });
        guardarDatosConsultorioCDM(db);
        if (typeof mostrarToast === "function") mostrarToast("📝 Sesión física registrada.");
        renderSuiteClinicaModal(db, p);
    };

    function renderTabEvalFisica(cont, db, p) {
        const ef = p.evalFisica;
        cont.innerHTML = `
            <form class="clin-box" onsubmit="guardarEvalFisicaPro(event)">
                <strong style="display:block; font-size:0.9rem; margin-bottom:0.65rem;">📐 Evaluación Kinesiológica / Quiropráctica y Pruebas Funcionales</strong>
                <div class="clin-grid-2" style="margin-bottom:0.55rem;">
                    <div class="field"><label>Diagnóstico Médico / Derivación</label><input type="text" id="efDiag" value="${escHtml(ef.diagnostico)}" placeholder="Ej: Lumbociatalgia L5-S1, Esguince grado II..."></div>
                    <div class="field"><label>Mecanismo de Lesión / Antigüedad</label><input type="text" id="efMec" value="${escHtml(ef.mecanismo)}" placeholder="Ej: Traumático hace 10 días / Postural crónico"></div>
                </div>
                <div class="field" style="margin-bottom:0.55rem;"><label>Evaluación Postural y Rangos Articulares (ROM / Fuerza)</label><textarea id="efRom" rows="2" placeholder="Asimetrías, limitación en flexión/rotación, acortamientos...">${escHtml(ef.rom)}</textarea></div>
                <div class="field" style="margin-bottom:0.7rem;"><label>Pruebas Ortopédicas / Neurológicas</label><textarea id="efPru" rows="2" placeholder="Ej: Lasègue (+), Phalen (-), Adams, test de cajón...">${escHtml(ef.pruebas)}</textarea></div>
                <button type="submit" class="btn btn-primary btn-sm" style="width:100%;">💾 Guardar Evaluación Física</button>
            </form>
        `;
    }

    window.guardarEvalFisicaPro = function (e) {
        e.preventDefault();
        const { db, p } = obtenerPacienteActivo();
        if (!p) return;
        p.evalFisica = {
            diagnostico: document.getElementById("efDiag").value.trim(),
            mecanismo: document.getElementById("efMec").value.trim(),
            rom: document.getElementById("efRom").value.trim(),
            pruebas: document.getElementById("efPru").value.trim()
        };
        guardarDatosConsultorioCDM(db);
        if (typeof mostrarToast === "function") mostrarToast("📐 Evaluación física guardada.");
    };

    function renderTabSesionesGenericas(cont, db, p) {
        const desc = (db.sesiones || []).filter(s => Number(s.pacienteId) === Number(p.id)).sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")));
        cont.innerHTML = `
            <form class="clin-box" onsubmit="guardarSesionGenericaPro(event)">
                <div class="grid-2" style="margin-bottom:0.55rem;">
                    <div class="field"><label>Fecha *</label><input type="date" id="geFec" value="${hoyISO()}" required></div>
                    <div class="field"><label>🔑 Token / Orden (opc.)</label><input type="text" id="geTok" placeholder="Opcional"></div>
                </div>
                <div class="field" style="margin-bottom:0.65rem;"><label>Evolución Clínica *</label><textarea id="geEvo" rows="3" required placeholder="Detalle de la consulta..."></textarea></div>
                <button type="submit" class="btn btn-primary btn-sm" style="width:100%;">💾 Registrar Evolución</button>
            </form>
            <div style="display:flex; flex-direction:column; gap:0.5rem; max-height:310px; overflow-y:auto;">
                ${desc.length === 0 ? `<div class="empty-box" style="padding:1rem;">Sin evoluciones registradas.</div>` :
                desc.map(s => `<div style="background:var(--surface-solid); border:1px solid var(--line); border-left:4px solid #0284c7; border-radius:12px; padding:0.7rem 0.85rem; font-size:0.81rem;"><div style="display:flex; justify-content:space-between;"><b>📅 ${escHtml(s.fecha)} ${s.token ? `• 🔑 ${escHtml(s.token)}` : ""}</b><button type="button" class="btn btn-danger btn-sm" style="min-height:24px; padding:0 7px;" onclick="eliminarSesionClinicaPro(${s.id})">🗑️</button></div><div style="margin-top:4px; white-space:pre-line;">${escHtml(s.evolucion)}</div></div>`).join("")}
            </div>
        `;
    }

    window.guardarSesionGenericaPro = function (e) {
        e.preventDefault();
        const { db, p } = obtenerPacienteActivo();
        if (!p) return;
        db.sesiones.unshift({
            id: Date.now(), pacienteId: p.id, especialidad: p.especialidad,
            fecha: document.getElementById("geFec").value || hoyISO(),
            token: document.getElementById("geTok").value.trim(),
            evolucion: document.getElementById("geEvo").value.trim()
        });
        guardarDatosConsultorioCDM(db);
        renderSuiteClinicaModal(db, p);
    };

    window.eliminarSesionClinicaPro = function (idSes) {
        if (!confirm("🗑️ ¿Eliminar esta sesión del historial?")) return;
        const { db, p } = obtenerPacienteActivo();
        if (!p) return;
        db.sesiones = (db.sesiones || []).filter(s => Number(s.id) !== Number(idSes));
        guardarDatosConsultorioCDM(db);
        renderSuiteClinicaModal(db, p);
    };

    // =====================================================================
    // 8. ATLAS ANATÓMICO HD POR CAPAS (SOLO KINE / QUIRO / TRAUMA)
    // =====================================================================
    function detectarZonaAnatomica(vista, xPct, yPct) {
        const esEsp = vista === "espalda";
        const ladoCorporal = Math.abs(xPct - 50) < 9 ? "Central" : (esEsp ? (xPct < 50 ? "Izquierdo" : "Derecho") : (xPct < 50 ? "Derecho" : "Izquierdo"));
        if (yPct < 13) return "Cabeza / Cráneo";
        if (yPct < 19) return esEsp ? "Cervical / Nuca (C1–C7)" : "Cuello Anterior";
        if (yPct < 30) {
            if (Math.abs(xPct - 50) > 19) return `Hombro / Deltoides ${ladoCorporal}`;
            return esEsp ? `Dorsal / Escápula ${ladoCorporal}` : `Pectoral / Clavícula ${ladoCorporal}`;
        }
        if (yPct < 45) {
            if (Math.abs(xPct - 50) > 25) return `Brazo / Codo ${ladoCorporal}`;
            return esEsp ? `Columna Dorsal / Lumbar (${ladoCorporal})` : `Abdomen / Parrilla Costal ${ladoCorporal}`;
        }
        if (yPct < 56) {
            if (Math.abs(xPct - 50) > 27) return `Antebrazo / Muñeca ${ladoCorporal}`;
            return esEsp ? `Lumbar L4–S1 / Glúteo ${ladoCorporal}` : `Cadera / Ingle ${ladoCorporal}`;
        }
        if (yPct < 72) return esEsp ? `Isquiotibial / Ciático ${ladoCorporal}` : `Cuádriceps / Muslo ${ladoCorporal}`;
        if (yPct < 80) return `Rodilla ${ladoCorporal}`;
        if (yPct < 91) return esEsp ? `Gemelo / Sóleo ${ladoCorporal}` : `Tibia / Pierna ${ladoCorporal}`;
        return `Tobillo / Pie ${ladoCorporal}`;
    }

    function normalizarHallazgoAtlas(h) {
        return {
            ...h,
            herramienta: h.herramienta || "punto",
            vista: h.vista || h.lado || "frente",
            capa: h.capa || "muscular",
            x1: h.x1 !== undefined ? Number(h.x1) : Number(h.xPct ?? 50),
            y1: h.y1 !== undefined ? Number(h.y1) : Number(h.yPct ?? 50),
            x2: h.x2 !== undefined ? Number(h.x2) : null,
            y2: h.y2 !== undefined ? Number(h.y2) : null,
            radio: h.radio !== undefined ? Number(h.radio) : 6
        };
    }

    function construirOverlaySVGYPines(hallazgosConNum, vista, pend, soloParaPrint = false) {
        const items = hallazgosConNum.filter(h => h.vista === vista);
        const suf = `${vista}_${soloParaPrint ? "p" : "l"}`;
        const defs = `
            <defs>
                <marker id="arr_green_${suf}" viewBox="0 0 10 10" refX="7.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M 0 1.2 L 9 5 L 0 8.8 z" fill="#10b981"/></marker>
                <marker id="arr_amber_${suf}" viewBox="0 0 10 10" refX="7.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M 0 1.2 L 9 5 L 0 8.8 z" fill="#f59e0b"/></marker>
                <marker id="arr_red_${suf}" viewBox="0 0 10 10" refX="7.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M 0 1.2 L 9 5 L 0 8.8 z" fill="#ef4444"/></marker>
                <marker id="arr_blue_${suf}" viewBox="0 0 10 10" refX="7.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M 0 1.2 L 9 5 L 0 8.8 z" fill="#38bdf8"/></marker>
            </defs>
        `;
        const markerPorEva = (eva) => {
            const v = Number(eva) || 5;
            if (v <= 3) return `url(#arr_green_${suf})`;
            if (v <= 6) return `url(#arr_amber_${suf})`;
            return `url(#arr_red_${suf})`;
        };

        let shapes = "";
        items.forEach(h => {
            const col = colorPorEva(h.intensidad);
            if (h.herramienta === "zona") {
                const r = Math.max(3, Math.min(24, Number(h.radio) || 7));
                shapes += `<circle cx="${h.x1}%" cy="${h.y1}%" r="${r}%" fill="${col}" fill-opacity="0.28" stroke="${col}" stroke-width="2.2" stroke-dasharray="5 3"/>`;
            } else if (h.herramienta === "irradiacion" && h.x2 !== null && h.y2 !== null) {
                shapes += `
                    <line x1="${h.x1}%" y1="${h.y1}%" x2="${h.x2}%" y2="${h.y2}%" stroke="#0f172a" stroke-opacity="0.65" stroke-width="6" stroke-linecap="round"/>
                    <line x1="${h.x1}%" y1="${h.y1}%" x2="${h.x2}%" y2="${h.y2}%" stroke="${col}" stroke-width="3.2" stroke-linecap="round" class="${soloParaPrint ? "" : "atlas-arrow-anim"}" marker-end="${markerPorEva(h.intensidad)}"/>
                `;
            }
        });

        if (!soloParaPrint && pend && pend.vista === vista) {
            if (pend.herramienta === "zona") {
                shapes += `<circle cx="${pend.x1}%" cy="${pend.y1}%" r="${pend.radio || 7}%" fill="#38bdf8" fill-opacity="0.25" stroke="#38bdf8" stroke-width="2.2" stroke-dasharray="4 3"/>`;
            } else if (pend.herramienta === "irradiacion" && pend.x2 !== null && pend.y2 !== null) {
                shapes += `<line x1="${pend.x1}%" y1="${pend.y1}%" x2="${pend.x2}%" y2="${pend.y2}%" stroke="#38bdf8" stroke-width="3.2" stroke-linecap="round" class="atlas-arrow-anim" marker-end="url(#arr_blue_${suf})"/>`;
            }
        }

        const svgHTML = `<svg class="atlas-svg-overlay" id="${soloParaPrint ? "" : `atlasSvg_${vista}`}">${defs}${shapes}<g id="${soloParaPrint ? "" : `atlasLive_${vista}`}"></g></svg>`;
        const pinesHTML = items.map(h => {
            const col = colorPorEva(h.intensidad);
            const esHigh = !soloParaPrint && Number(stClin.highlightId) === Number(h.id);
            const tag = h.herramienta === "irradiacion" ? `➡️${h.num}` : `${h.num}`;
            return `<button type="button" class="atlas-pin ${esHigh ? "highlight" : ""}" style="left:${h.x1}%; top:${h.y1}%; background:${col}; ${soloParaPrint ? "pointer-events:none; width:18px; height:18px; font-size:9px;" : ""}" title="#${h.num} ${escHtml(h.zona)}" ${soloParaPrint ? "" : `onclick="event.stopPropagation(); resaltarHallazgoAtlas(${h.id})"`}>${tag}</button>`;
        }).join("") + (!soloParaPrint && pend && pend.vista === vista ? `<span class="atlas-pin highlight" style="left:${pend.x1}%; top:${pend.y1}%; background:#0284c7;">+</span>` : "");

        return { svgHTML, pinesHTML };
    }

    function renderTabAtlasHD(cont, db, p) {
        const capaInfo = CAPAS_ATLAS[stClin.capaActiva] || CAPAS_ATLAS.muscular;
        const todos = (p.mapaCorporal || []).map((h, i) => ({ ...normalizarHallazgoAtlas(h), num: i + 1 }));
        const visibles = stClin.soloCapaEnMapa ? todos.filter(h => h.capa === stClin.capaActiva) : todos;
        const vistas = stClin.vistaActiva === "ambos" ? ["frente", "espalda"] : [stClin.vistaActiva];
        const esLupa = stClin.herramienta === "lupa";
        const pend = stClin.hallazgoPendiente;

        const ayuda = {
            punto: "👆 Tocá cualquier punto de la foto para marcar un foco de dolor o molestia.",
            irradiacion: "➡️ Arrastrá desde el origen del dolor hasta donde irradia para trazar la flecha dinámica.",
            zona: "⭕ Arrastrá desde el centro hacia afuera para marcar un área de contractura o inflamación.",
            lupa: "🔍 Pasá el cursor o deslizá el dedo sobre el cuerpo para ampliar (podés ver otra capa adentro tipo Rayos-X)."
        }[stClin.herramienta];

        cont.innerHTML = `
            <div class="atlas-toolbar">
                <div class="atlas-btn-group">
                    <button type="button" class="atlas-pill ${stClin.capaActiva === "muscular" ? "active-warn" : ""}" onclick="setAtlasOpt('capaActiva','muscular')">💪 Muscular</button>
                    <button type="button" class="atlas-pill ${stClin.capaActiva === "oseo" ? "active" : ""}" onclick="setAtlasOpt('capaActiva','oseo')">🦴 Óseo</button>
                    <button type="button" class="atlas-pill ${stClin.capaActiva === "nervioso" ? "active-purple" : ""}" onclick="setAtlasOpt('capaActiva','nervioso')">⚡ Nervioso</button>
                </div>
                <div class="atlas-btn-group">
                    <button type="button" class="atlas-pill ${stClin.herramienta === "punto" ? "active" : ""}" onclick="setAtlasOpt('herramienta','punto')">📍 Punto</button>
                    <button type="button" class="atlas-pill ${stClin.herramienta === "irradiacion" ? "active-warn" : ""}" onclick="setAtlasOpt('herramienta','irradiacion')">➡️ Irradiación</button>
                    <button type="button" class="atlas-pill ${stClin.herramienta === "zona" ? "active-purple" : ""}" onclick="setAtlasOpt('herramienta','zona')">⭕ Zona</button>
                    <button type="button" class="atlas-pill ${stClin.herramienta === "lupa" ? "active-teal" : ""}" onclick="setAtlasOpt('herramienta','lupa')">🔍 Lupa ${stClin.zoomLupa}×</button>
                </div>
                <div class="atlas-btn-group">
                    <button type="button" class="atlas-pill ${stClin.vistaActiva === "ambos" ? "active" : ""}" onclick="setAtlasOpt('vistaActiva','ambos')">Ambos</button>
                    <button type="button" class="atlas-pill ${stClin.vistaActiva === "frente" ? "active" : ""}" onclick="setAtlasOpt('vistaActiva','frente')">Frente</button>
                    <button type="button" class="atlas-pill ${stClin.vistaActiva === "espalda" ? "active" : ""}" onclick="setAtlasOpt('vistaActiva','espalda')">Espalda</button>
                </div>
            </div>

            ${esLupa ? `
                <div style="display:flex; align-items:center; justify-content:space-between; gap:0.6rem; flex-wrap:wrap; background:rgba(13,148,136,0.1); border:1px solid rgba(13,148,136,0.35); border-radius:12px; padding:0.5rem 0.8rem; margin-bottom:0.75rem; font-size:0.77rem;">
                    <span><b>🔍 Modo Lupa / Rayos-X:</b> elegí la capa que querés ver ampliada adentro de la lupa:</span>
                    <div style="display:flex; gap:0.35rem; align-items:center;">
                        <select style="width:auto; min-height:30px; font-size:0.75rem; font-weight:700;" onchange="setAtlasOpt('capaLupa', this.value)">
                            <option value="misma" ${stClin.capaLupa === "misma" ? "selected" : ""}>🔍 Misma capa (${capaInfo.nombre})</option>
                            <option value="muscular" ${stClin.capaLupa === "muscular" ? "selected" : ""}>💪 Rayos-X: Muscular</option>
                            <option value="oseo" ${stClin.capaLupa === "oseo" ? "selected" : ""}>🦴 Rayos-X: Óseo</option>
                            <option value="nervioso" ${stClin.capaLupa === "nervioso" ? "selected" : ""}>⚡ Rayos-X: Nervioso</option>
                        </select>
                        <select style="width:auto; min-height:30px; font-size:0.75rem; font-weight:700;" onchange="setAtlasOpt('zoomLupa', parseFloat(this.value))">
                            <option value="2" ${stClin.zoomLupa === 2 ? "selected" : ""}>2×</option>
                            <option value="2.5" ${stClin.zoomLupa === 2.5 ? "selected" : ""}>2.5×</option>
                            <option value="3.5" ${stClin.zoomLupa === 3.5 ? "selected" : ""}>3.5×</option>
                        </select>
                    </div>
                </div>
            ` : `
                <div style="font-size:0.76rem; color:var(--ink-600); margin-bottom:0.65rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.4rem;">
                    <span>${ayuda}</span>
                    <label style="display:inline-flex; align-items:center; gap:0.35rem; cursor:pointer; font-weight:700;">
                        <input type="checkbox" ${stClin.soloCapaEnMapa ? "checked" : ""} onchange="setAtlasOpt('soloCapaEnMapa', this.checked)" style="width:15px; height:15px; min-height:auto;">
                        Solo marcas de ${capaInfo.nombre}
                    </label>
                </div>
            `}

            <div class="atlas-main-grid">
                <div class="atlas-stages-grid ${vistas.length === 1 ? "single-view" : ""}">
                    ${vistas.map(vista => {
                        const imgSrc = vista === "frente" ? capaInfo.imgFrente : capaInfo.imgEspalda;
                        const { svgHTML, pinesHTML } = construirOverlaySVGYPines(visibles, vista, pend, false);
                        return `
                            <div class="atlas-stage-card">
                                <div class="atlas-stage-head">
                                    <span>${vista === "frente" ? "FRENTE (ANTERIOR)" : "ESPALDA (POSTERIOR)"}</span>
                                    <span style="color:#38bdf8;">${capaInfo.icono} ${capaInfo.nombre}</span>
                                </div>
                                <div class="atlas-stage-inner ${esLupa ? "mode-loupe" : "mode-draw"}" data-atlas-vista="${vista}">
                                    <img class="atlas-img" src="${imgSrc}" alt="${vista} ${capaInfo.nombre}" draggable="false">
                                    ${svgHTML}
                                    ${pinesHTML}
                                    <div class="atlas-loupe" id="atlasLoupe_${vista}">
                                        <span class="atlas-loupe-tag" id="atlasLoupeTag_${vista}"></span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join("")}
                </div>

                <div>
                    ${pend ? `
                        <form class="clin-box" style="border-color:#0284c7;" onsubmit="guardarHallazgoAtlasHD(event)">
                            <strong style="display:block; font-size:0.85rem; margin-bottom:0.5rem; color:#0284c7;">
                                ${pend.herramienta === "irradiacion" ? "➡️ Nueva Flecha de Irradiación" : pend.herramienta === "zona" ? "⭕ Nueva Zona de Dolor" : "📍 Nuevo Punto Clínico"}
                                (${pend.vista.toUpperCase()} • ${CAPAS_ATLAS[pend.capa]?.nombre})
                            </strong>
                            <div class="field" style="margin-bottom:0.48rem;">
                                <label>${pend.herramienta === "irradiacion" ? "Origen ➔ Hacia dónde irradia *" : "Zona Anatómica *"}</label>
                                <input type="text" id="clAtZona" value="${escHtml(pend.herramienta === "irradiacion" && pend.zonaFin ? `${pend.zona} ➔ ${pend.zonaFin}` : pend.zona)}" required>
                            </div>
                            <div class="grid-2" style="margin-bottom:0.48rem;">
                                <div class="field"><label>Tipo de Hallazgo</label>
                                    <select id="clAtTipo">
                                        <option ${pend.herramienta === "irradiacion" ? "selected" : ""}>Irradiación / Ciática</option>
                                        <option ${pend.herramienta === "punto" ? "selected" : ""}>Dolor Agudo / Punzante</option>
                                        <option ${pend.herramienta === "zona" ? "selected" : ""}>Contractura / Sobrecarga</option>
                                        <option>Hormigueo / Parestesia</option>
                                        <option>Inflamación / Edema</option>
                                        <option>Bloqueo / Restricción Articular</option>
                                    </select>
                                </div>
                                <div class="field"><label>Intensidad EVA (1–10)</label><input type="number" id="clAtInt" min="1" max="10" value="7" required></div>
                            </div>
                            <div class="field" style="margin-bottom:0.6rem;"><label>Observación Clínica</label><input type="text" id="clAtNota" placeholder="Ej: Aumenta al flexionar, irradia hasta pantorrilla..."></div>
                            <div style="display:flex; gap:0.4rem;">
                                <button type="submit" class="btn btn-primary btn-sm" style="flex:1;">💾 Guardar en Atlas</button>
                                <button type="button" class="btn btn-ghost btn-sm" onclick="cancelarHallazgoAtlasHD()">Cancelar</button>
                            </div>
                        </form>
                    ` : `
                        <div class="clin-box" style="font-size:0.78rem; color:var(--ink-600); text-align:center;">
                            ${esLupa ? "🔍 Mové el puntero o dedo sobre las láminas para usar la Lupa HD." : "🎯 Usá las láminas para marcar <b>Puntos</b>, arrastrar <b>Flechas de Irradiación</b> o delimitar <b>Zonas</b>."}
                        </div>
                    `}

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.45rem;">
                        <strong style="font-size:0.84rem;">Hallazgos Registrados (${visibles.length})</strong>
                        ${todos.length ? `<button type="button" class="btn btn-ghost btn-sm" style="font-size:0.71rem;" onclick="limpiarMapaCorporalPro()">Limpiar todo</button>` : ""}
                    </div>
                    <div style="display:flex; flex-direction:column; gap:0.42rem; max-height:360px; overflow-y:auto;">
                        ${visibles.length === 0 ? `<div class="empty-box" style="padding:1rem; font-size:0.78rem;">Sin hallazgos en esta vista.</div>` :
                        visibles.map(h => {
                            const cInfo = CAPAS_ATLAS[h.capa] || CAPAS_ATLAS.muscular;
                            const iconH = h.herramienta === "irradiacion" ? "➡️" : h.herramienta === "zona" ? "⭕" : "📍";
                            return `
                                <div class="clin-pin-item" style="border-left-color:${colorPorEva(h.intensidad)}; cursor:pointer;" onclick="resaltarHallazgoAtlas(${h.id})">
                                    <div style="min-width:0;">
                                        <strong>${iconH} #${h.num} ${escHtml(h.zona)}</strong>
                                        <span class="badge" style="background:${colorPorEva(h.intensidad)}; color:#fff; margin-left:4px; font-size:0.65rem;">${h.intensidad}/10</span>
                                        <small style="display:block; color:var(--ink-500); margin-top:2px;">${cInfo.icono} ${cInfo.nombre} • ${escHtml(h.vista)} • ${escHtml(h.tipo)} • ${escHtml(h.fecha || "")}</small>
                                        ${h.nota ? `<small style="display:block; color:var(--ink-700); margin-top:2px;">${escHtml(h.nota)}</small>` : ""}
                                    </div>
                                    <button type="button" class="btn btn-danger btn-sm" style="min-height:24px; padding:0 7px; flex-shrink:0;" onclick="event.stopPropagation(); eliminarPinMapaCorporal(${h.id})">✕</button>
                                </div>
                            `;
                        }).join("")}
                    </div>
                </div>
            </div>
        `;
        vincularEventosAtlasStages();
    }

    function vincularEventosAtlasStages() {
        document.querySelectorAll(".atlas-stage-inner[data-atlas-vista]").forEach(stage => {
            const vista = stage.dataset.atlasVista;
            const liveG = document.getElementById(`atlasLive_${vista}`);
            const loupe = document.getElementById(`atlasLoupe_${vista}`);
            const loupeTag = document.getElementById(`atlasLoupeTag_${vista}`);

            const getCoords = (ev) => {
                const r = stage.getBoundingClientRect();
                const xPx = Math.max(0, Math.min(r.width, ev.clientX - r.left));
                const yPx = Math.max(0, Math.min(r.height, ev.clientY - r.top));
                return { xPx, yPx, w: r.width, h: r.height, xPct: Math.round((xPx / Math.max(1, r.width)) * 1000) / 10, yPct: Math.round((yPx / Math.max(1, r.height)) * 1000) / 10 };
            };

            const actualizarLupa = (ev) => {
                if (stClin.herramienta !== "lupa" || !loupe) return;
                const c = getCoords(ev);
                const capaKey = stClin.capaLupa === "misma" ? stClin.capaActiva : stClin.capaLupa;
                const cObj = CAPAS_ATLAS[capaKey] || CAPAS_ATLAS.muscular;
                const src = vista === "frente" ? cObj.imgFrente : cObj.imgEspalda;
                const z = stClin.zoomLupa || 2.5;
                const D = loupe.offsetWidth || 158;
                const offsetTouchY = ev.pointerType === "touch" ? -55 : 0;

                loupe.style.left = `${c.xPx}px`;
                loupe.style.top = `${Math.max(D / 2, c.yPx + offsetTouchY)}px`;
                loupe.style.backgroundImage = `url('${src}')`;
                loupe.style.backgroundSize = `${c.w * z}px ${c.h * z}px`;
                loupe.style.backgroundPosition = `${-(c.xPx * z - D / 2)}px ${-(c.yPx * z - D / 2)}px`;
                if (loupeTag) loupeTag.textContent = `${cObj.icono} ${cObj.nombre.toUpperCase()} ${z}×`;
                loupe.classList.add("visible");
            };

            let dragging = false, start = null;
            stage.onpointerenter = (ev) => { if (stClin.herramienta === "lupa") actualizarLupa(ev); };
            stage.onpointerleave = () => { loupe?.classList.remove("visible"); if (dragging && liveG) { dragging = false; liveG.innerHTML = ""; } };

            stage.onpointerdown = (ev) => {
                if (ev.target.closest(".atlas-pin")) return;
                if (stClin.herramienta === "lupa") { stage.setPointerCapture?.(ev.pointerId); actualizarLupa(ev); return; }
                const c = getCoords(ev);
                if (stClin.herramienta === "punto") {
                    stClin.hallazgoPendiente = { herramienta: "punto", vista, capa: stClin.capaActiva, x1: c.xPct, y1: c.yPct, x2: null, y2: null, radio: 0, zona: detectarZonaAnatomica(vista, c.xPct, c.yPct), zonaFin: "" };
                    const { db, p } = obtenerPacienteActivo();
                    if (p) renderSuiteClinicaModal(db, p);
                    return;
                }
                dragging = true; start = c;
                stage.setPointerCapture?.(ev.pointerId);
            };

            stage.onpointermove = (ev) => {
                if (stClin.herramienta === "lupa") { actualizarLupa(ev); return; }
                if (!dragging || !start || !liveG) return;
                const cur = getCoords(ev);
                if (stClin.herramienta === "irradiacion") {
                    liveG.innerHTML = `<circle cx="${start.xPct}%" cy="${start.yPct}%" r="5" fill="#38bdf8" stroke="#fff" stroke-width="2"/><line x1="${start.xPct}%" y1="${start.yPct}%" x2="${cur.xPct}%" y2="${cur.yPct}%" stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round" class="atlas-arrow-anim" marker-end="url(#arr_blue_${vista}_l)"/>`;
                } else if (stClin.herramienta === "zona") {
                    const rad = Math.max(4, Math.min(22, Math.round(Math.hypot(cur.xPct - start.xPct, cur.yPct - start.yPct) * 10) / 10));
                    liveG.innerHTML = `<circle cx="${start.xPct}%" cy="${start.yPct}%" r="${rad}%" fill="#38bdf8" fill-opacity="0.28" stroke="#38bdf8" stroke-width="2.2" stroke-dasharray="4 3"/>`;
                }
            };

            stage.onpointerup = (ev) => {
                if (stClin.herramienta === "lupa") { if (ev.pointerType === "touch") loupe?.classList.remove("visible"); return; }
                if (!dragging || !start) return;
                dragging = false;
                const end = getCoords(ev);
                if (liveG) liveG.innerHTML = "";
                const dist = Math.hypot(end.xPct - start.xPct, end.yPct - start.yPct);

                if (stClin.herramienta === "irradiacion") {
                    if (dist < 3) { if (typeof mostrarToast === "function") mostrarToast("➡️ Arrastrá desde el origen hacia donde irradia el dolor."); return; }
                    stClin.hallazgoPendiente = { herramienta: "irradiacion", vista, capa: stClin.capaActiva, x1: start.xPct, y1: start.yPct, x2: end.xPct, y2: end.yPct, radio: 0, zona: detectarZonaAnatomica(vista, start.xPct, start.yPct), zonaFin: detectarZonaAnatomica(vista, end.xPct, end.yPct) };
                } else if (stClin.herramienta === "zona") {
                    stClin.hallazgoPendiente = { herramienta: "zona", vista, capa: stClin.capaActiva, x1: start.xPct, y1: start.yPct, x2: null, y2: null, radio: Math.max(5, Math.min(22, Math.round(dist * 10) / 10)), zona: detectarZonaAnatomica(vista, start.xPct, start.yPct), zonaFin: "" };
                }
                const { db, p } = obtenerPacienteActivo();
                if (p) renderSuiteClinicaModal(db, p);
            };
        });
    }

    window.setAtlasOpt = function (clave, valor) {
        stClin[clave] = valor;
        if (clave === "herramienta") stClin.hallazgoPendiente = null;
        const { db, p } = obtenerPacienteActivo();
        if (p) renderSuiteClinicaModal(db, p);
    };

    window.resaltarHallazgoAtlas = function (idH) {
        const { db, p } = obtenerPacienteActivo();
        if (!p) return;
        const h = p.mapaCorporal.find(x => Number(x.id) === Number(idH));
        stClin.highlightId = Number(idH);
        if (h) {
            const norm = normalizarHallazgoAtlas(h);
            stClin.capaActiva = norm.capa;
            if (stClin.vistaActiva !== "ambos" && stClin.vistaActiva !== norm.vista) stClin.vistaActiva = norm.vista;
        }
        renderSuiteClinicaModal(db, p);
    };

    window.cancelarHallazgoAtlasHD = function () { stClin.hallazgoPendiente = null; const { db, p } = obtenerPacienteActivo(); if (p) renderSuiteClinicaModal(db, p); };

    window.guardarHallazgoAtlasHD = function (e) {
        e.preventDefault();
        const { db, p } = obtenerPacienteActivo();
        if (!p || !stClin.hallazgoPendiente) return;
        const hp = stClin.hallazgoPendiente;
        p.mapaCorporal.push({
            id: Date.now(), herramienta: hp.herramienta, vista: hp.vista, lado: hp.vista, capa: hp.capa,
            x1: hp.x1, y1: hp.y1, xPct: hp.x1, yPct: hp.y1, x2: hp.x2, y2: hp.y2, radio: hp.radio,
            zona: document.getElementById("clAtZona").value.trim(),
            tipo: document.getElementById("clAtTipo").value,
            intensidad: Number(document.getElementById("clAtInt").value) || 6,
            nota: document.getElementById("clAtNota").value.trim(),
            fecha: hoyISO()
        });
        stClin.hallazgoPendiente = null;
        guardarDatosConsultorioCDM(db);
        if (typeof mostrarToast === "function") mostrarToast("✅ Hallazgo guardado en el Atlas HD.");
        renderSuiteClinicaModal(db, p);
    };

    window.eliminarPinMapaCorporal = function (idPin) {
        const { db, p } = obtenerPacienteActivo();
        if (!p) return;
        p.mapaCorporal = p.mapaCorporal.filter(x => Number(x.id) !== Number(idPin));
        guardarDatosConsultorioCDM(db);
        renderSuiteClinicaModal(db, p);
    };

    window.limpiarMapaCorporalPro = function () {
        if (!confirm("🗑️ ¿Borrar todas las marcas del Atlas Corporal?")) return;
        const { db, p } = obtenerPacienteActivo();
        if (!p) return;
        p.mapaCorporal = [];
        guardarDatosConsultorioCDM(db);
        renderSuiteClinicaModal(db, p);
    };

    // =====================================================================
    // 9. CONSENTIMIENTO INFORMADO ADAPTADO A LA DISCIPLINA + FIRMA TÁCTIL
    // =====================================================================
    function textoConsentimientoBase(p, tipo, perfil) {
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : { nombreEntidad: "el Consultorio" };
        const extraSecreto = perfil.tipo === "psicologia"
            ? " Se garantiza estricto secreto profesional conforme al Código de Ética y la Ley Nacional de Salud Mental 26.657, con las únicas excepciones legales por riesgo cierto e inminente."
            : perfil.tipo === "nutricion"
            ? " Declaro haber brindado información veraz sobre antecedentes médicos, alergias e intolerancias alimentarias para la confección del plan nutricional."
            : " Declaro haber informado antecedentes clínicos, cirugías previas o contraindicaciones físicas para la aplicación de maniobras y terapias de rehabilitación.";

        if (tipo === "Menor / Tutor") {
            return `En mi carácter de padre, madre o tutor legal de ${p.nombre} ${p.apellido} (DNI ${p.dni || "________"}), presto mi consentimiento informado (Ley 26.529) para que reciba atención profesional en el área de ${p.especialidad || "Salud"} en ${lic.nombreEntidad}.${extraSecreto}`;
        }
        return `Yo, ${p.nombre} ${p.apellido} (DNI ${p.dni || "________"}), presto mi consentimiento informado (Leyes 26.529 y 25.326) para recibir atención en ${p.especialidad || "Salud"} en ${lic.nombreEntidad}.${extraSecreto}`;
    }

    function renderTabConsentimiento(cont, db, p, perfil) {
        const lista = p.consentimientos || [];
        cont.innerHTML = `
            <form class="clin-box" onsubmit="guardarConsentimientoTactil(event)">
                <div class="grid-3" style="margin-bottom:0.55rem;">
                    <div class="field"><label>Tipo de Consentimiento</label>
                        <select id="clConsTipo" onchange="cambiarPlantillaConsentimiento(this.value)">
                            <option value="Adulto">👤 Paciente Adulto</option>
                            <option value="Menor / Tutor">🧒 Menor (Padre/Madre/Tutor)</option>
                        </select>
                    </div>
                    <div class="field"><label>Nombre quien Firma *</label><input type="text" id="clConsFirm" value="${escHtml(p.nombre + " " + p.apellido)}" required></div>
                    <div class="field"><label>DNI quien Firma *</label><input type="text" id="clConsDni" value="${escHtml(p.dni || "")}" required></div>
                </div>
                <div class="field" style="margin-bottom:0.6rem;">
                    <label>Texto del Consentimiento (editable)</label>
                    <textarea id="clConsTxt" rows="3" required>${escHtml(textoConsentimientoBase(p, "Adulto", perfil))}</textarea>
                </div>
                <label style="font-size:0.75rem; font-weight:800; display:block; margin-bottom:4px;">✍️ Firma Táctil en Pantalla (dedo o mouse):</label>
                <div class="clin-sig-wrap">
                    <canvas id="clinSigCanvas" width="620" height="175"></canvas>
                    <span class="clin-sig-hint">Firme dentro del recuadro</span>
                </div>
                <div style="display:flex; justify-content:space-between; gap:0.5rem; flex-wrap:wrap;">
                    <button type="button" class="btn btn-ghost btn-sm" onclick="limpiarCanvasFirmaClin()">🧹 Borrar Firma</button>
                    <button type="submit" class="btn btn-primary btn-sm">💾 Guardar Consentimiento Firmado</button>
                </div>
            </form>

            <div style="display:flex; flex-direction:column; gap:0.5rem;">
                ${lista.length === 0 ? `<div class="empty-box" style="padding:0.9rem; font-size:0.8rem;">Sin consentimientos firmados todavía.</div>` :
                lista.map(c => `
                    <div style="background:var(--surface-solid); border:1px solid var(--line); border-radius:12px; padding:0.7rem 0.85rem; display:flex; justify-content:space-between; align-items:center; gap:0.65rem; flex-wrap:wrap;">
                        <div>
                            <strong style="font-size:0.84rem;">📄 Consentimiento (${escHtml(c.tipo)}) — ${escHtml(c.fecha)}</strong>
                            <small style="display:block; color:var(--ink-500);">Firmante: ${escHtml(c.firmante)} (DNI ${escHtml(c.dniFirmante)})</small>
                        </div>
                        <div style="display:flex; gap:0.35rem;">
                            <button type="button" class="btn btn-primary btn-sm" onclick="imprimirConsentimientoA4(${c.id})">🖨️ PDF A4</button>
                            <button type="button" class="btn btn-danger btn-sm" onclick="eliminarConsentimientoClin(${c.id})">🗑️</button>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;
        setTimeout(inicializarPadFirmaTactil, 30);
    }

    window.cambiarPlantillaConsentimiento = function (tipo) {
        const { p } = obtenerPacienteActivo();
        const ta = document.getElementById("clConsTxt");
        if (p && ta) ta.value = textoConsentimientoBase(p, tipo, obtenerPerfilDisciplina(p.especialidad));
    };

    function inicializarPadFirmaTactil() {
        const cv = document.getElementById("clinSigCanvas");
        if (!cv) return;
        const ctx = cv.getContext("2d");
        ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 2.6; ctx.lineCap = "round"; ctx.lineJoin = "round";
        stClin.sigDibujo = false;
        let pintando = false;
        const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (cv.width / r.width), y: (e.clientY - r.top) * (cv.height / r.height) }; };
        cv.onpointerdown = (e) => { pintando = true; stClin.sigDibujo = true; cv.setPointerCapture?.(e.pointerId); const pt = pos(e); ctx.beginPath(); ctx.moveTo(pt.x, pt.y); };
        cv.onpointermove = (e) => { if (!pintando) return; const pt = pos(e); ctx.lineTo(pt.x, pt.y); ctx.stroke(); };
        cv.onpointerup = cv.onpointercancel = () => { pintando = false; };
    }

    window.limpiarCanvasFirmaClin = function () {
        const cv = document.getElementById("clinSigCanvas");
        if (!cv) return;
        cv.getContext("2d").clearRect(0, 0, cv.width, cv.height);
        stClin.sigDibujo = false;
    };

    window.guardarConsentimientoTactil = function (e) {
        e.preventDefault();
        if (!stClin.sigDibujo) return alert("✍️ Realizá la firma dentro del recuadro antes de guardar.");
        const cv = document.getElementById("clinSigCanvas");
        const { db, p } = obtenerPacienteActivo();
        if (!p || !cv) return;
        p.consentimientos.unshift({
            id: Date.now(), fecha: hoyISO(),
            tipo: document.getElementById("clConsTipo").value,
            firmante: document.getElementById("clConsFirm").value.trim(),
            dniFirmante: document.getElementById("clConsDni").value.trim(),
            texto: document.getElementById("clConsTxt").value.trim(),
            firmaDataUrl: cv.toDataURL("image/png")
        });
        guardarDatosConsultorioCDM(db);
        if (typeof mostrarToast === "function") mostrarToast("✍️ Consentimiento firmado y archivado.");
        renderSuiteClinicaModal(db, p);
    };

    window.eliminarConsentimientoClin = function (idC) {
        if (!confirm("🗑️ ¿Eliminar este consentimiento?")) return;
        const { db, p } = obtenerPacienteActivo();
        if (!p) return;
        p.consentimientos = p.consentimientos.filter(x => Number(x.id) !== Number(idC));
        guardarDatosConsultorioCDM(db);
        renderSuiteClinicaModal(db, p);
    };

    window.imprimirConsentimientoA4 = function (idC) {
        const { p } = obtenerPacienteActivo();
        const c = p?.consentimientos.find(x => Number(x.id) === Number(idC));
        if (!p || !c) return;
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : { nombreEntidad: "Consultorio" };
        imprimirA4(`
            <div style="border-bottom:2.5px solid #0284c7; padding-bottom:0.75rem; margin-bottom:1.1rem; display:flex; justify-content:space-between;">
                <div>
                    <div style="font-size:0.72rem; font-weight:800; color:#0284c7;">CONSENTIMIENTO INFORMADO</div>
                    <h2 style="margin:3px 0; font-size:1.35rem;">${escHtml(lic.nombreEntidad)}</h2>
                    <small>${escHtml(p.especialidad || "Salud")} • ${escHtml(c.tipo)}</small>
                </div>
                <div style="text-align:right; font-size:0.8rem;"><b>Fecha:</b> ${escHtml(c.fecha)}<br><b>Paciente:</b> ${escHtml(p.apellido)}, ${escHtml(p.nombre)}<br><b>DNI:</b> ${escHtml(p.dni || "-")}</div>
            </div>
            <p style="font-size:0.92rem; line-height:1.7; text-align:justify; margin-bottom:1.8rem;">${escHtml(c.texto)}</p>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem; margin-top:2rem; align-items:end;">
                <div style="text-align:center;">
                    <img src="${c.firmaDataUrl}" style="max-width:240px; max-height:95px; border-bottom:1.5px solid #334155; padding-bottom:4px; display:block; margin:0 auto 6px;">
                    <strong style="font-size:0.82rem;">${escHtml(c.firmante)}</strong><br><small style="color:#475569;">DNI ${escHtml(c.dniFirmante)}</small>
                </div>
                <div style="text-align:center;"><div style="height:95px; border-bottom:1.5px solid #334155; margin-bottom:6px;"></div><strong style="font-size:0.82rem;">Profesional Interviniente</strong><br><small style="color:#475569;">${escHtml(lic.nombreEntidad)}</small></div>
            </div>
        `);
    };

    // =====================================================================
    // 10. DOCUMENTOS (INFORMES / RP/ / LABORATORIOS) + ESTUDIOS SUBIDOS POR PACIENTE
    // =====================================================================
    function renderTabDocumentosYEstudios(cont, db, p, perfil) {
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : { nombreEntidad: "Consultorio" };
        const esPsico = perfil.tipo === "psicologia";
        const esNutri = perfil.tipo === "nutricion";

        const titDoc = esPsico ? "📄 Emitir Informe / Certificado / Derivación" : esNutri ? "📄 Emitir Indicaciones / Certificado Nutricional" : "💊 Emitir Receta / Indicaciones (RP/)";
        const lblCuerpo = esPsico ? "Contenido del Informe o Derivación *" : esNutri ? "Indicaciones / Recomendaciones *" : "RP/ Indicaciones, Ejercicios o Derivación *";
        const titEst = esPsico ? "📑 Tests, Informes y Archivos del Paciente" : esNutri ? "🧪 Laboratorios Bioquímicos y Estudios" : "🩻 Estudios por Imágenes (RMN / Rx / Eco)";
        const phEst = esPsico ? "Ej: Informe Psicopedagógico / Test WISC" : esNutri ? "Ej: Laboratorio Completo (Glucemia/Perfil Lipídico)" : "Ej: RMN Columna Lumbar / Rx Rodilla";

        cont.innerHTML = `
            <div class="clin-box" style="display:flex; justify-content:space-between; align-items:center; gap:0.65rem; flex-wrap:wrap; background:var(--cdm-50, #f0f9ff); border-color:#7dd3fc;">
                <div>
                    <strong style="font-size:0.85rem;">🔑 Portal del Paciente — Código: <code>${escHtml(p.codigoAcceso)}</code></strong>
                    <small style="display:block; color:var(--ink-600); font-size:0.74rem;">
                        ${p.puedeSubirEstudios ? "🔓 El paciente tiene habilitado subir estudios y datos desde su portal." : "🔒 Subida del paciente bloqueada (usá el botón de arriba para habilitarla)."}
                    </small>
                </div>
                <div style="display:flex; gap:0.4rem;">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText('${escHtml(p.codigoAcceso)}'); mostrarToast('📋 Código copiado: ${escHtml(p.codigoAcceso)}');">📋 Copiar</button>
                    <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarCodigoPacienteWA()">📲 Enviar por WA</button>
                </div>
            </div>

            <div class="clin-grid-2">
                <div class="clin-box">
                    <strong style="display:block; font-size:0.9rem; margin-bottom:0.55rem;">${titDoc}</strong>
                    <form onsubmit="guardarRecetaRP(event)" style="margin-bottom:0.8rem;">
                        <div class="grid-2" style="margin-bottom:0.5rem;">
                            <div class="field"><label>Profesional</label><input type="text" id="clRpProf" value="${escHtml(lic.nombreEntidad)}" required></div>
                            <div class="field"><label>Matrícula (MP)</label><input type="text" id="clRpMat" placeholder="Ej: MP 4521"></div>
                        </div>
                        <div class="field" style="margin-bottom:0.5rem;"><label>Asunto / Diagnóstico / Destinatario</label><input type="text" id="clRpDiag" placeholder="${esPsico ? "Ej: Constancia de asistencia / Derivación a Psiquiatría" : "Ej: Diagnóstico o motivo"}"></div>
                        <div class="field" style="margin-bottom:0.6rem;"><label>${lblCuerpo}</label><textarea id="clRpTxt" rows="3" required placeholder="Escribí el texto del documento..."></textarea></div>
                        <button type="submit" class="btn btn-primary btn-sm" style="width:100%;">💾 Guardar Documento</button>
                    </form>
                    <div style="display:flex; flex-direction:column; gap:0.45rem; max-height:200px; overflow-y:auto;">
                        ${p.recetas.length === 0 ? `<small style="color:var(--ink-500);">Sin documentos emitidos.</small>` :
                        p.recetas.map(r => `
                            <div style="background:var(--surface-solid); border:1px solid var(--line); border-radius:10px; padding:0.55rem 0.7rem; font-size:0.78rem;">
                                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem;">
                                    <b>📅 ${escHtml(r.fecha)} — ${escHtml(r.diagnostico || "Documento")}</b>
                                    <div style="display:flex; gap:0.3rem;">
                                        <button type="button" class="btn btn-primary btn-sm" style="min-height:24px; font-size:0.7rem;" onclick="imprimirRecetaRPA4(${r.id})">🖨️ PDF</button>
                                        <button type="button" class="btn btn-whatsapp btn-sm" style="min-height:24px; font-size:0.7rem;" onclick="enviarRecetaRPWA(${r.id})">WA</button>
                                        <button type="button" class="btn btn-danger btn-sm" style="min-height:24px; padding:0 6px; font-size:0.7rem;" onclick="eliminarRecetaRP(${r.id})">✕</button>
                                    </div>
                                </div>
                                <div style="color:var(--ink-600); margin-top:3px; white-space:pre-line;">${escHtml(r.textoRP)}</div>
                            </div>
                        `).join("")}
                    </div>
                </div>

                <div class="clin-box">
                    <strong style="display:block; font-size:0.9rem; margin-bottom:0.55rem;">${titEst}</strong>
                    <form onsubmit="guardarEstudioPaciente(event)" style="margin-bottom:0.8rem;">
                        <div class="grid-2" style="margin-bottom:0.5rem;">
                            <div class="field"><label>Título *</label><input type="text" id="clEstTit" required placeholder="${phEst}"></div>
                            <div class="field"><label>Fecha</label><input type="date" id="clEstFec" value="${hoyISO()}"></div>
                        </div>
                        <div class="field" style="margin-bottom:0.5rem;"><label>Link a PDF / Drive / Imagen (opc.)</label><input type="url" id="clEstUrl" placeholder="https://..."></div>
                        <div class="field" style="margin-bottom:0.6rem;"><label>Valores / Hallazgos Clave</label><input type="text" id="clEstNota" placeholder="${esNutri ? "Ej: Glucemia 92, Vit D 28, Ferritina 45..." : "Resumen de resultados..."}"></div>
                        <button type="submit" class="btn btn-secondary btn-sm" style="width:100%;">+ Archivar Estudio</button>
                    </form>
                    <div style="display:flex; flex-direction:column; gap:0.45rem; max-height:220px; overflow-y:auto;">
                        ${p.estudios.length === 0 ? `<small style="color:var(--ink-500);">Sin estudios archivados.</small>` :
                        p.estudios.map(es => `
                            <div style="background:var(--surface-solid); border:1px solid var(--line); border-left:3.5px solid ${es.subidoPor === "paciente" ? "#10b981" : "#0284c7"}; border-radius:10px; padding:0.55rem 0.7rem; font-size:0.78rem; display:flex; justify-content:space-between; align-items:center; gap:0.4rem;">
                                <div>
                                    <b>📄 ${escHtml(es.titulo)}</b> <small>(${escHtml(es.fecha)})</small>
                                    ${es.subidoPor === "paciente" ? `<span class="badge badge-ok" style="font-size:0.62rem; margin-left:4px;">👤 Subido por Paciente</span>` : ""}
                                    ${es.nota ? `<div style="color:var(--ink-600); font-size:0.74rem;">${escHtml(es.nota)}</div>` : ""}
                                </div>
                                <div style="display:flex; gap:0.3rem; flex-shrink:0;">
                                    ${es.archivoDataUrl ? `<a href="${es.archivoDataUrl}" download="${escHtml(es.archivoNombre || es.titulo)}" class="btn btn-primary btn-sm" style="min-height:24px; font-size:0.7rem;">Ver / Bajar</a>` : ""}
                                    ${es.url ? `<a href="${escHtml(es.url)}" target="_blank" class="btn btn-secondary btn-sm" style="min-height:24px; font-size:0.7rem;">Link ↗</a>` : ""}
                                    <button type="button" class="btn btn-danger btn-sm" style="min-height:24px; padding:0 6px; font-size:0.7rem;" onclick="eliminarEstudioPaciente(${es.id})">✕</button>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            </div>
        `;
    }

    window.enviarCodigoPacienteWA = function () {
        const { p } = obtenerPacienteActivo();
        if (!p) return;
        const tel = String(p.whatsapp || "").replace(/\D/g, "");
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : { nombreEntidad: "Consultorio" };
        const msg = `🩺 *${lic.nombreEntidad}*\nHola *${p.nombre}*, tu código personal de paciente es: *${p.codigoAcceso}*`;
        window.open(tel ? `https://wa.me/${tel}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    };

    window.guardarRecetaRP = function (e) {
        e.preventDefault();
        const { db, p } = obtenerPacienteActivo();
        if (!p) return;
        p.recetas.unshift({
            id: Date.now(), fecha: hoyISO(),
            profesional: document.getElementById("clRpProf").value.trim(),
            matricula: document.getElementById("clRpMat").value.trim(),
            diagnostico: document.getElementById("clRpDiag").value.trim(),
            textoRP: document.getElementById("clRpTxt").value.trim()
        });
        guardarDatosConsultorioCDM(db);
        if (typeof mostrarToast === "function") mostrarToast("📄 Documento guardado.");
        renderSuiteClinicaModal(db, p);
    };

    window.eliminarRecetaRP = function (idR) {
        const { db, p } = obtenerPacienteActivo();
        if (!p) return;
        p.recetas = p.recetas.filter(x => Number(x.id) !== Number(idR));
        guardarDatosConsultorioCDM(db);
        renderSuiteClinicaModal(db, p);
    };

    window.imprimirRecetaRPA4 = function (idR) {
        const { db, p } = obtenerPacienteActivo();
        const r = p?.recetas.find(x => Number(x.id) === Number(idR));
        if (!p || !r) return;
        const perfil = obtenerPerfilDisciplina(p.especialidad);
        const mut = resolverMutualPaciente(db, p);
        const encabDoc = perfil.tipo === "psicologia" ? "INFORME / CONSTANCIA PROFESIONAL" : perfil.tipo === "nutricion" ? "INDICACIONES NUTRICIONALES" : "RP/";
        imprimirA4(`
            <div style="border:2px solid ${perfil.accent}; border-radius:14px; padding:1.6rem; max-width:680px; margin:0 auto;">
                <div style="display:flex; justify-content:space-between; border-bottom:2px solid ${perfil.accent}; padding-bottom:0.7rem; margin-bottom:1rem;">
                    <div><h2 style="margin:0; font-size:1.3rem;">${escHtml(r.profesional)}</h2><small style="color:${perfil.accent}; font-weight:700;">${escHtml(p.especialidad || "Consultorio")}${r.matricula ? ` • ${escHtml(r.matricula)}` : ""}</small></div>
                    <div style="text-align:right; font-size:0.8rem;"><b>Fecha:</b> ${escHtml(r.fecha)}</div>
                </div>
                <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:9px; padding:0.6rem 0.85rem; font-size:0.82rem; margin-bottom:1.2rem;">
                    <b>Paciente:</b> ${escHtml(p.apellido)}, ${escHtml(p.nombre)} • <b>DNI:</b> ${escHtml(p.dni || "-")}<br>
                    <b>Obra Social:</b> ${escHtml(mut ? mut.nombre : "Particular")} ${p.nroAfiliado ? `• <b>Afiliado:</b> ${escHtml(p.nroAfiliado)}` : ""}
                    ${r.diagnostico ? `<br><b>Asunto / Motivo:</b> ${escHtml(r.diagnostico)}` : ""}
                </div>
                <div style="font-size:1.05rem; font-weight:900; color:${perfil.accent}; margin-bottom:0.5rem;">${encabDoc}</div>
                <div style="font-size:0.95rem; line-height:1.7; min-height:180px; white-space:pre-line;">${escHtml(r.textoRP)}</div>
                <div style="margin-top:2.4rem; text-align:right; font-size:0.8rem; color:#475569;">______________________________<br><b>${escHtml(r.profesional)}</b>${r.matricula ? ` (${escHtml(r.matricula)})` : ""}<br>Firma y Matrícula</div>
            </div>
        `);
    };

    window.enviarRecetaRPWA = function (idR) {
        const { p } = obtenerPacienteActivo();
        const r = p?.recetas.find(x => Number(x.id) === Number(idR));
        if (!p || !r) return;
        const tel = String(p.whatsapp || "").replace(/\D/g, "");
        const msg = `📄 *${p.especialidad} — ${r.profesional}*\n👤 Paciente: ${p.nombre} ${p.apellido}\n📅 Fecha: ${r.fecha}${r.diagnostico ? `\n📌 ${r.diagnostico}` : ""}\n\n${r.textoRP}`;
        window.open(tel ? `https://wa.me/${tel}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    };

    window.guardarEstudioPaciente = function (e) {
        e.preventDefault();
        const { db, p } = obtenerPacienteActivo();
        if (!p) return;
        p.estudios.unshift({
            id: Date.now(), titulo: document.getElementById("clEstTit").value.trim(),
            fecha: document.getElementById("clEstFec").value || hoyISO(),
            url: document.getElementById("clEstUrl").value.trim(),
            nota: document.getElementById("clEstNota").value.trim(),
            subidoPor: "profesional"
        });
        guardarDatosConsultorioCDM(db);
        if (typeof mostrarToast === "function") mostrarToast("📄 Estudio archivado.");
        renderSuiteClinicaModal(db, p);
    };

    window.eliminarEstudioPaciente = function (idE) {
        const { db, p } = obtenerPacienteActivo();
        if (!p) return;
        p.estudios = p.estudios.filter(x => Number(x.id) !== Number(idE));
        guardarDatosConsultorioCDM(db);
        renderSuiteClinicaModal(db, p);
    };

    // =====================================================================
    // 11. HISTORIA CLÍNICA PDF A4 — ADAPTADA 100% A CADA DISCIPLINA
    // =====================================================================
    window.imprimirResumenClinicoPacientePDF = function () {
        const { db, p } = obtenerPacienteActivo();
        if (!p) return;
        const perfil = obtenerPerfilDisciplina(p.especialidad);
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : { nombreEntidad: "Consultorio" };
        const mut = resolverMutualPaciente(db, p);
        const sesiones = (db.sesiones || []).filter(s => Number(s.pacienteId) === Number(p.id)).sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")));

        let cuerpoEspecifico = "";

        if (perfil.tipo === "psicologia") {
            const a = p.anamnesisPsico;
            cuerpoEspecifico = `
                <h4 style="margin:0 0 6px;">1. Anamnesis y Admisión Psicológica</h4>
                <table style="margin-bottom:0.9rem;">
                    <tbody>
                        <tr><td style="width:28%; font-weight:700;">Motivo de Consulta</td><td>${escHtml(a.motivoManifiesto || "-")}</td></tr>
                        <tr><td style="font-weight:700;">Antecedentes / Medicación</td><td>${escHtml(a.antecedentes || "-")} ${a.medicacion ? `| Med.: ${escHtml(a.medicacion)}` : ""}</td></tr>
                        <tr><td style="font-weight:700;">Objetivos y Escalas</td><td>${escHtml(a.objetivos || "-")} ${a.escalas ? `| Tests: ${escHtml(a.escalas)}` : ""}</td></tr>
                    </tbody>
                </table>
                ${p.genograma.length ? `
                    <h4 style="margin:0 0 6px;">2. Genograma y Red de Vínculos (${p.genograma.length})</h4>
                    <table style="margin-bottom:0.9rem;"><thead><tr><th>Nombre</th><th>Rol</th><th>Edad</th><th>Vínculo</th><th>Observación</th></tr></thead>
                    <tbody>${p.genograma.map(g => `<tr><td><b>${escHtml(g.nombre)}</b></td><td>${escHtml(g.rol)}</td><td>${escHtml(g.edad || "-")}</td><td>${escHtml(g.vinculo)}${g.viveCon ? " (Convive)" : ""}</td><td>${escHtml(g.nota || "-")}</td></tr>`).join("")}</tbody></table>
                ` : ""}
                <h4 style="margin:0 0 6px;">3. Evolución de Sesiones (${sesiones.length})</h4>
                <table><thead><tr><th>Fecha</th><th>Ánimo / Ans. / Sueño</th><th>Evolución y Acuerdos</th></tr></thead>
                <tbody>${sesiones.length === 0 ? `<tr><td colspan="3">Sin sesiones registradas.</td></tr>` :
                    sesiones.map(s => `<tr><td><b>${escHtml(s.fecha)}</b><br><small>${escHtml(s.modalidad || "")}</small></td><td>Á:${s.animo ?? "-"} | An:${s.ansiedad ?? "-"} | S:${s.sueno ?? "-"}</td><td>${escHtml(s.evolucion)}${s.indicaciones ? `<br><i>Tareas: ${escHtml(s.indicaciones)}</i>` : ""}</td></tr>`).join("")}
                </tbody></table>
            `;
        } else if (perfil.tipo === "nutricion") {
            const h = p.habitosNutri, pl = p.planNutri;
            cuerpoEspecifico = `
                <h4 style="margin:0 0 6px;">1. Antecedentes y Hábitos Alimentarios</h4>
                <table style="margin-bottom:0.9rem;"><tbody>
                    <tr><td style="width:28%; font-weight:700;">Patologías / Alergias</td><td>${escHtml(h.patologias || "-")} | Alergias: ${escHtml(h.alergias || "-")}</td></tr>
                    <tr><td style="font-weight:700;">Actividad Física / Hidratación</td><td>${escHtml(h.actividadFisica || "-")} | Agua: ${escHtml(h.hidratacion || "-")}</td></tr>
                </tbody></table>
                <h4 style="margin:0 0 6px;">2. Controles Antropométricos (${p.antropometria.length})</h4>
                <table style="margin-bottom:0.9rem;"><thead><tr><th>Fecha</th><th>Peso / Talla</th><th>IMC</th><th>% Grasa / Músc.</th><th>Cintura / Cadera</th><th>Nota</th></tr></thead>
                <tbody>${p.antropometria.length === 0 ? `<tr><td colspan="6">Sin controles registrados.</td></tr>` :
                    [...p.antropometria].reverse().map(a => `<tr><td><b>${escHtml(a.fecha)}</b></td><td>${a.peso} kg / ${a.talla} cm</td><td><b>${a.imc}</b></td><td>${a.grasa || "-"}% / ${a.musculo || "-"}%</td><td>${a.cintura || "-"} / ${a.cadera || "-"} cm</td><td>${escHtml(a.nota || "-")}</td></tr>`).join("")}
                </tbody></table>
                <h4 style="margin:0 0 6px;">3. Plan Alimentario Vigente (${escHtml(pl.objetivo)})</h4>
                <table><tbody>
                    <tr><td style="width:24%; font-weight:700;">Metas</td><td>Kcal: ${escHtml(pl.kcal || "-")} • P: ${escHtml(pl.prot || "-")} • C: ${escHtml(pl.carb || "-")} • G: ${escHtml(pl.grasas || "-")} • Agua: ${escHtml(pl.agua || "-")}</td></tr>
                    ${pl.desayuno ? `<tr><td style="font-weight:700;">Desayuno</td><td>${escHtml(pl.desayuno)}</td></tr>` : ""}
                    ${pl.almuerzo ? `<tr><td style="font-weight:700;">Almuerzo</td><td>${escHtml(pl.almuerzo)}</td></tr>` : ""}
                    ${pl.merienda ? `<tr><td style="font-weight:700;">Merienda</td><td>${escHtml(pl.merienda)}</td></tr>` : ""}
                    ${pl.cena ? `<tr><td style="font-weight:700;">Cena</td><td>${escHtml(pl.cena)}</td></tr>` : ""}
                </tbody></table>
            `;
        } else {
            const hallazgos = (p.mapaCorporal || []).map((h, i) => ({ ...normalizarHallazgoAtlas(h), num: i + 1 }));
            const capaPrint = CAPAS_ATLAS[stClin.capaActiva] || CAPAS_ATLAS.muscular;
            let atlasVisual = "";
            if (perfil.tipo === "fisico" && hallazgos.length > 0) {
                const ovF = construirOverlaySVGYPines(hallazgos, "frente", null, true);
                const ovE = construirOverlaySVGYPines(hallazgos, "espalda", null, true);
                atlasVisual = `
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; max-width:440px; margin:0 auto 10px;">
                        <div style="position:relative; border:1px solid #cbd5e1; border-radius:10px; overflow:hidden; line-height:0;"><img src="${capaPrint.imgFrente}" style="width:100%; display:block;">${ovF.svgHTML}${ovF.pinesHTML}</div>
                        <div style="position:relative; border:1px solid #cbd5e1; border-radius:10px; overflow:hidden; line-height:0;"><img src="${capaPrint.imgEspalda}" style="width:100%; display:block;">${ovE.svgHTML}${ovE.pinesHTML}</div>
                    </div>
                `;
            }
            const ef = p.evalFisica;
            cuerpoEspecifico = `
                ${(ef.diagnostico || ef.rom || ef.pruebas) ? `
                    <h4 style="margin:0 0 6px;">1. Evaluación Física</h4>
                    <table style="margin-bottom:0.9rem;"><tbody>
                        <tr><td style="width:26%; font-weight:700;">Diagnóstico / Mecanismo</td><td>${escHtml(ef.diagnostico || "-")} ${ef.mecanismo ? `(${escHtml(ef.mecanismo)})` : ""}</td></tr>
                        <tr><td style="font-weight:700;">ROM y Pruebas</td><td>${escHtml(ef.rom || "-")} | ${escHtml(ef.pruebas || "-")}</td></tr>
                    </tbody></table>
                ` : ""}
                ${hallazgos.length ? `
                    <h4 style="margin:0 0 8px;">2. Atlas Corporal — Hallazgos e Irradiaciones (${hallazgos.length})</h4>
                    ${atlasVisual}
                    <table style="margin-bottom:0.9rem;"><thead><tr><th>#</th><th>Tipo</th><th>Capa / Vista</th><th>Zona / Recorrido</th><th>EVA</th><th>Nota</th></tr></thead>
                    <tbody>${hallazgos.map(h => `<tr><td>${h.num}</td><td>${escHtml(h.tipo)}</td><td>${escHtml(CAPAS_ATLAS[h.capa]?.nombre || h.capa)} (${escHtml(h.vista)})</td><td><b>${escHtml(h.zona)}</b></td><td><b>${h.intensidad}/10</b></td><td>${escHtml(h.nota || "-")}</td></tr>`).join("")}</tbody></table>
                ` : ""}
                <h4 style="margin:0 0 6px;">3. Evolución de Sesiones (${sesiones.length})</h4>
                <table><thead><tr><th>Fecha</th><th>EVA</th><th>Token</th><th>Evolución e Indicaciones</th></tr></thead>
                <tbody>${sesiones.length === 0 ? `<tr><td colspan="4">Sin sesiones registradas.</td></tr>` :
                    sesiones.map(s => `<tr><td><b>${escHtml(s.fecha)}</b></td><td>${s.eva != null ? `${s.eva}/10` : "-"}</td><td>${escHtml(s.token || "-")}</td><td>${escHtml(s.evolucion)}${s.indicaciones ? `<br><i>Indic.: ${escHtml(s.indicaciones)}</i>` : ""}</td></tr>`).join("")}
                </tbody></table>
            `;
        }

        imprimirA4(`
            <div style="display:flex; justify-content:space-between; border-bottom:2.5px solid ${perfil.accent}; padding-bottom:0.75rem; margin-bottom:1rem;">
                <div>
                    <div style="font-size:0.7rem; font-weight:800; color:${perfil.accent};">${perfil.tituloBadge}</div>
                    <h2 style="margin:2px 0; font-size:1.35rem;">${escHtml(p.apellido)}, ${escHtml(p.nombre)}</h2>
                    <small>${escHtml(lic.nombreEntidad)} • ${escHtml(p.especialidad || "Consultorio")}</small>
                </div>
                <div style="text-align:right; font-size:0.78rem;">
                    <b>DNI:</b> ${escHtml(p.dni || "-")} • <b>Edad:</b> ${calcularEdad(p.fechaNacimiento)} años<br>
                    <b>Obra Social:</b> ${escHtml(mut ? mut.nombre : "Particular")} (${escHtml(p.nroAfiliado || "-")})<br>
                    <b>Emisión:</b> ${new Date().toLocaleDateString("es-AR")}
                </div>
            </div>
            ${cuerpoEspecifico}
            <div style="margin-top:2rem; display:flex; justify-content:space-between; font-size:0.76rem; color:#475569;">
                <span>Consentimientos firmados: <b>${p.consentimientos.length}</b> • Documentos: <b>${p.recetas.length}</b></span>
                <span style="text-align:right;">______________________________<br>Firma y Matrícula Profesional</span>
            </div>
        `);
    };
})();