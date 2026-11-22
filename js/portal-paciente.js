/**
 * js/portal-paciente.js — Portal del Paciente Moderno (Layout Bento 2 Columnas en PC + Móvil Compacto)
 * 100% Aislado de Deportes y Gimnasio. Adaptado a Psicología, Nutrición, Kinesiología/Quiropraxia y General.
 * CDM Pro Suite — Desarrollado por Gonzalo Adanchú
 */

(function () {
    function inyectarCSSPortalPaciente() {
        document.getElementById("cdmCssPortalPacientePro")?.remove();
        const st = document.createElement("style");
        st.id = "cdmCssPortalPacientePro";
        st.textContent = `
            /* Aislamiento total de módulos deportivos y de administración */
            body[data-modo-portal="paciente"] .app-sidebar,
            body[data-modo-portal="paciente"] .module-tabs,
            body[data-modo-portal="paciente"] .jug-seccion,
            body[data-modo-portal="paciente"] #fichaCabeceraJugador,
            body[data-modo-portal="paciente"] #cdmUserMobileBottomDock,
            body[data-modo-portal="paciente"] #cdmFloatingDropletClock,
            body[data-modo-portal="paciente"] #topbarMenuWrap33,
            body[data-modo-portal="paciente"] #topbarMenuDrop33,
            body[data-modo-portal="paciente"] #btnMobileSidebar33,
            body[data-modo-portal="paciente"] #cdmBottomNav38,
            body[data-modo-portal="paciente"] #btnNotasRapidasTopbar {
                display: none !important;
            }
            body[data-modo-portal="paciente"] .app-main {
                margin-left: 0 !important;
                width: 100% !important;
                padding-bottom: 2.5rem !important;
            }
            body[data-modo-portal="paciente"] .app-content {
                padding: 1.25rem 1.75rem !important;
            }

            /* Contenedor amplio estilo Dashboard SaaS */
            #portalPacienteRootCDM {
                max-width: 1340px;
                margin: 0 auto;
                display: flex;
                flex-direction: column;
                gap: 1.15rem;
            }

            /* HERO BANNER MODERNO CON AVATAR Y GLASSMORPHISM */
            .pp-hero {
                position: relative;
                overflow: hidden;
                color: #ffffff;
                border-radius: 24px;
                padding: 1.45rem 1.75rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1.2rem;
                flex-wrap: wrap;
                box-shadow: 0 20px 40px -16px rgba(15, 23, 42, 0.35);
            }
            .pp-hero::after {
                content: "";
                position: absolute;
                right: -60px;
                top: -60px;
                width: 260px;
                height: 260px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%);
                pointer-events: none;
            }
            .pp-hero-left { display: flex; align-items: center; gap: 1.05rem; z-index: 1; }
            .pp-avatar {
                width: 62px;
                height: 62px;
                border-radius: 18px;
                background: rgba(255, 255, 255, 0.18);
                border: 1.5px solid rgba(255, 255, 255, 0.35);
                backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.35rem;
                font-weight: 900;
                color: #ffffff;
                flex-shrink: 0;
                letter-spacing: 0.03em;
            }
            .pp-hero-pill {
                display: inline-flex;
                align-items: center;
                gap: 0.35rem;
                background: rgba(255, 255, 255, 0.16);
                border: 1px solid rgba(255, 255, 255, 0.25);
                padding: 0.2rem 0.65rem;
                border-radius: 999px;
                font-size: 0.68rem;
                font-weight: 800;
                letter-spacing: 0.04em;
                text-transform: uppercase;
            }
            .pp-hero h2 { margin: 5px 0 3px; font-size: 1.55rem; font-weight: 900; color: #ffffff; letter-spacing: -0.02em; }
            .pp-hero small { color: rgba(255, 255, 255, 0.86); font-size: 0.8rem; display: block; }
            .pp-hero-actions { display: flex; gap: 0.55rem; flex-wrap: wrap; z-index: 1; }

            /* LAYOUT PRINCIPAL 2 COLUMNAS EN PC (BENTO) */
            .pp-shell-grid {
                display: grid;
                grid-template-columns: minmax(0, 1.58fr) minmax(320px, 0.85fr);
                gap: 1.15rem;
                align-items: start;
            }
            .pp-main-col, .pp-aside-col {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                min-width: 0;
            }
            .pp-aside-col {
                position: sticky;
                top: 76px;
            }

            /* NAVEGACIÓN SEGMENTADA */
            .pp-tabs {
                display: grid;
                grid-auto-flow: column;
                grid-auto-columns: minmax(0, 1fr);
                gap: 0.35rem;
                padding: 0.4rem;
                background: var(--surface-solid, #ffffff);
                border: 1px solid var(--line, #e2e8f0);
                border-radius: 16px;
                box-shadow: 0 4px 16px -8px rgba(15, 23, 42, 0.08);
            }
            .pp-tab {
                border: none;
                background: transparent;
                color: var(--ink-600, #475569);
                font-size: 0.82rem;
                font-weight: 800;
                padding: 0.64rem 0.6rem;
                border-radius: 12px;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 0.42rem;
                transition: all 0.16s ease;
            }
            .pp-tab:hover:not(.active) { background: var(--surface-subtle, #f1f5f9); color: var(--ink-900, #0f172a); }
            .pp-tab.active { color: #ffffff; box-shadow: 0 8px 18px -6px rgba(15, 23, 42, 0.35); }

            /* TARJETAS MODERNAS */
            .pp-card {
                background: var(--surface-solid, #ffffff);
                border: 1px solid var(--line, #e2e8f0);
                border-radius: 20px;
                padding: 1.2rem 1.35rem;
                box-shadow: 0 10px 28px -16px rgba(15, 23, 42, 0.12);
            }
            .pp-card-head {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 0.6rem;
                flex-wrap: wrap;
                margin-bottom: 0.95rem;
                padding-bottom: 0.65rem;
                border-bottom: 1px solid var(--line, #e2e8f0);
            }
            .pp-card-head h3 {
                margin: 0;
                font-size: 1rem;
                font-weight: 800;
                color: var(--ink-900, #0f172a);
                display: inline-flex;
                align-items: center;
                gap: 0.45rem;
            }

            /* KPIs CON ÍCONO SUAVE */
            .pp-stats-row {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 0.85rem;
            }
            .pp-stat-card {
                background: var(--surface-solid, #ffffff);
                border: 1px solid var(--line, #e2e8f0);
                border-radius: 18px;
                padding: 0.95rem 1.05rem;
                display: flex;
                align-items: center;
                gap: 0.8rem;
                cursor: pointer;
                box-shadow: 0 8px 22px -14px rgba(15, 23, 42, 0.1);
                transition: transform 0.16s ease, border-color 0.16s ease;
            }
            .pp-stat-card:hover { transform: translateY(-2px); border-color: #38bdf8; }
            .pp-stat-ico {
                width: 44px;
                height: 44px;
                border-radius: 13px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.25rem;
                flex-shrink: 0;
            }
            .pp-stat-card small { display: block; font-size: 0.68rem; font-weight: 800; text-transform: uppercase; color: var(--ink-500, #64748b); letter-spacing: 0.03em; }
            .pp-stat-card strong { display: block; font-size: 1.02rem; font-weight: 900; color: var(--ink-900, #0f172a); margin-top: 1px; }

            .pp-grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.9rem; align-items: start; }
            .pp-grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem; }
            .pp-kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.65rem; margin-bottom: 0.9rem; }
            .pp-kpi {
                background: var(--surface-subtle, #f8fafc);
                border: 1px solid var(--line, #e2e8f0);
                border-top: 3.5px solid #0284c7;
                border-radius: 14px;
                padding: 0.7rem 0.85rem;
            }
            .pp-kpi small { display: block; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: var(--ink-500, #64748b); }
            .pp-kpi strong { display: block; font-size: 1.15rem; font-weight: 900; color: var(--ink-900, #0f172a); margin-top: 2px; }

            .pp-item {
                background: var(--surface-subtle, #f8fafc);
                border: 1px solid var(--line, #e2e8f0);
                border-left: 4px solid #0284c7;
                border-radius: 14px;
                padding: 0.8rem 0.95rem;
                display: flex;
                flex-direction: column;
                gap: 0.35rem;
            }

            /* Tarjeta destacada de Próximo Turno en el Aside */
            .pp-next-turn-box {
                background: linear-gradient(135deg, rgba(2, 132, 199, 0.08), rgba(13, 148, 136, 0.06));
                border: 1.5px solid rgba(2, 132, 199, 0.25);
                border-radius: 16px;
                padding: 0.95rem;
                display: flex;
                align-items: center;
                gap: 0.85rem;
            }
            .pp-date-badge {
                min-width: 58px;
                padding: 0.45rem 0.4rem;
                border-radius: 13px;
                color: #ffffff;
                text-align: center;
                flex-shrink: 0;
            }
            .pp-date-badge span { display: block; font-size: 0.64rem; font-weight: 800; text-transform: uppercase; opacity: 0.9; }
            .pp-date-badge strong { display: block; font-size: 1.35rem; font-weight: 900; line-height: 1.1; }

            /* Tarjeta de datos personales / transferencia */
            .pp-info-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 0;
                border-bottom: 1px dashed var(--line, #e2e8f0);
                font-size: 0.8rem;
            }
            .pp-info-row:last-child { border-bottom: none; padding-bottom: 0; }
            .pp-info-row span { color: var(--ink-500, #64748b); font-weight: 600; }
            .pp-info-row strong { color: var(--ink-900, #0f172a); font-weight: 800; text-align: right; }

            .pp-meal-card {
                background: var(--surface-subtle, #f8fafc);
                border: 1px solid var(--line, #e2e8f0);
                border-radius: 15px;
                padding: 0.85rem 1rem;
            }
            .pp-meal-card strong { display: block; font-size: 0.84rem; color: #15803d; margin-bottom: 4px; }
            .pp-meal-card div { font-size: 0.82rem; color: var(--ink-800, #1e293b); white-space: pre-line; line-height: 1.5; }

            .pp-slider-row { display: flex; align-items: center; gap: 0.55rem; }
            .pp-slider-pill {
                min-width: 50px; text-align: center; font-size: 0.76rem; font-weight: 900;
                padding: 3px 8px; border-radius: 999px; color: #ffffff;
            }

            /* Zona de subida moderna (dropzone visual) */
            .pp-upload-zone {
                border: 2px dashed var(--line-strong, #cbd5e1);
                background: var(--surface-subtle, #f8fafc);
                border-radius: 14px;
                padding: 0.65rem 0.85rem;
                transition: border-color 0.15s ease;
            }
            .pp-upload-zone:hover { border-color: #0284c7; }

            #cdmPrintZonePacienteA4 { display: none; }
            @media print {
                @page { size: A4; margin: 12mm; }
                body[data-modo-portal="paciente"] { display: block !important; }
                body.pp-printing > *:not(#cdmPrintZonePacienteA4) { display: none !important; }
                body.pp-printing #cdmPrintZonePacienteA4 { display: block !important; background: #fff; color: #0f172a; font-family: 'Poppins', Arial, sans-serif; }
                body.pp-printing #cdmPrintZonePacienteA4 table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
                body.pp-printing #cdmPrintZonePacienteA4 th, body.pp-printing #cdmPrintZonePacienteA4 td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
            }

            @media (max-width: 1024px) {
                .pp-shell-grid { grid-template-columns: 1fr; }
                .pp-aside-col { position: static; }
                body[data-modo-portal="paciente"] .app-content { padding: 0.9rem !important; }
            }
            @media (max-width: 768px) {
                .pp-stats-row, .pp-grid-2, .pp-grid-3 { grid-template-columns: 1fr; }
                .pp-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                .pp-tab { flex-direction: column; gap: 2px; font-size: 0.67rem; padding: 0.48rem 0.2rem; }
                .pp-hero { padding: 1.05rem; border-radius: 18px; }
                .pp-avatar { width: 48px; height: 48px; font-size: 1.05rem; border-radius: 14px; }
                .pp-hero h2 { font-size: 1.2rem; }
            }
        `;
        document.head.appendChild(st);
    }

    const stPortal = { tab: "inicio", paciente: null, db: null, lic: null, perfil: null, clubKey: "" };

    function escH(s) {
        return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    function normTxt(s) {
        return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    }

    function inicialesPac(p) {
        const a = String(p?.nombre || "").trim().charAt(0);
        const b = String(p?.apellido || "").trim().charAt(0);
        return (a + b).toUpperCase() || "PA";
    }

    function perfilPorEspecialidad(esp) {
        const k = normTxt(esp);
        if (k.includes("psico")) return { tipo: "psicologia", icono: "ri-mental-health-fill", emoji: "🧠", color: "#7c3aed", soft: "rgba(124,58,237,0.12)", grad: "linear-gradient(135deg, #1e1b4b 0%, #5b21b6 55%, #7c3aed 100%)" };
        if (k.includes("nutri")) return { tipo: "nutricion", icono: "ri-leaf-fill", emoji: "🥗", color: "#16a34a", soft: "rgba(22,163,74,0.12)", grad: "linear-gradient(135deg, #064e3b 0%, #15803d 55%, #0d9488 100%)" };
        if (k.includes("kine") || k.includes("quiro") || k.includes("trauma") || k.includes("fisio")) return { tipo: "fisico", icono: "ri-heart-pulse-fill", emoji: "🦴", color: "#0284c7", soft: "rgba(2,132,199,0.12)", grad: "linear-gradient(135deg, #0c192c 0%, #0369a1 58%, #0d9488 100%)" };
        return { tipo: "general", icono: "ri-stethoscope-fill", emoji: "🩺", color: "#0284c7", soft: "rgba(2,132,199,0.12)", grad: "linear-gradient(135deg, #0f172a 0%, #0369a1 62%, #0284c7 100%)" };
    }

    function formatearFechaAR(iso) {
        if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "-";
        const [y, m, d] = iso.split("-");
        return `${d}/${m}/${y}`;
    }

    function mesCortoAR(iso) {
        const meses = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
        const m = parseInt(String(iso || "").split("-")[1], 10);
        return meses[(m || 1) - 1] || "MES";
    }

    function imprimirDocPacienteA4(html) {
        let z = document.getElementById("cdmPrintZonePacienteA4");
        if (!z) {
            z = document.createElement("div");
            z.id = "cdmPrintZonePacienteA4";
            document.body.appendChild(z);
        }
        z.innerHTML = `<div style="padding:1rem;">${html}</div>`;
        document.body.classList.add("pp-printing");
        const fin = () => {
            document.body.classList.remove("pp-printing");
            z.innerHTML = "";
            window.removeEventListener("afterprint", fin);
        };
        window.addEventListener("afterprint", fin);
        setTimeout(() => window.print(), 60);
        setTimeout(fin, 2500);
    }

    function obtenerDatosPacienteVivo(claveHint) {
        let club = typeof obtenerClaveClubActivoCDM === "function" ? obtenerClaveClubActivoCDM() : (localStorage.getItem("cdm_club_activo_id_v1") || "cdm_adelia_maria_principal");
        const ses = typeof obtenerSesionActivaCDM === "function" ? obtenerSesionActivaCDM() : null;
        const params = new URLSearchParams(window.location.search);
        const idBusq = Number(params.get("id") || ses?.personaId || 0);
        const codBusq = String(ses?.codigo || claveHint || "").toUpperCase();

        let db = null;
        try { db = JSON.parse(localStorage.getItem(`cdm_consultorio_suite_v2_${club}`) || "null"); } catch {}
        let p = (db?.pacientes || []).find(x => (idBusq && Number(x.id) === idBusq) || (codBusq && String(x.codigoAcceso || "").toUpperCase() === codBusq));

        if (!p) {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (!k || !k.startsWith("cdm_consultorio_suite_v2_")) continue;
                try {
                    const d = JSON.parse(localStorage.getItem(k) || "null");
                    const hit = (d?.pacientes || []).find(x => (idBusq && Number(x.id) === idBusq) || (codBusq && String(x.codigoAcceso || "").toUpperCase() === codBusq));
                    if (hit) {
                        db = d;
                        p = hit;
                        club = k.replace("cdm_consultorio_suite_v2_", "");
                        break;
                    }
                } catch {}
            }
        }
        if (p) {
            if (!Array.isArray(p.estudios)) p.estudios = [];
            if (!Array.isArray(p.recetas)) p.recetas = [];
            if (!Array.isArray(p.checkinsPaciente)) p.checkinsPaciente = [];
        }
        return { db: db || { pacientes: [], turnos: [], sesiones: [], mutuales: [] }, p, club };
    }

    function guardarDBPacienteLocal() {
        if (!stPortal.db || !stPortal.clubKey) return;
        try { localStorage.setItem(`cdm_consultorio_suite_v2_${stPortal.clubKey}`, JSON.stringify(stPortal.db)); } catch {}
    }

    function construirCurvaMiniSVG(titulo, pts, color, sufijo = "") {
        if (!pts || pts.length < 2) return "";
        const ult = pts.slice(-8);
        const vals = ult.map(x => x.v);
        const minY = Math.floor(Math.min(...vals) - 1);
        const maxY = Math.ceil(Math.max(...vals) + 1);
        const W = 520, H = 115, pL = 34, pR = 14, pT = 16, pB = 22;
        const iW = W - pL - pR, iH = H - pT - pB, rg = Math.max(0.1, maxY - minY);
        const coords = ult.map((pt, idx) => ({
            x: pL + (idx / (ult.length - 1)) * iW,
            y: pT + iH - ((pt.v - minY) / rg) * iH,
            v: pt.v, lbl: pt.lbl
        }));
        const d = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
        return `
            <div style="background:var(--surface-subtle); border:1px solid var(--line); border-radius:14px; padding:0.75rem; margin-bottom:0.85rem;">
                <div style="display:flex; justify-content:space-between; font-size:0.76rem; margin-bottom:4px;">
                    <b>${titulo}</b>
                    <span>Inicio: <b>${coords[0].v}${sufijo}</b> ➔ Actual: <b>${coords[coords.length - 1].v}${sufijo}</b></span>
                </div>
                <svg viewBox="0 0 ${W} ${H}" style="width:100%; height:112px; display:block;">
                    <path d="${d}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
                    ${coords.map(c => `
                        <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="4.5" fill="${color}" stroke="#fff" stroke-width="1.5"/>
                        <text x="${c.x.toFixed(1)}" y="${(c.y - 7).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="700" fill="#0f172a">${c.v}</text>
                        <text x="${c.x.toFixed(1)}" y="${H - 4}" text-anchor="middle" font-size="8.5" fill="#64748b">${c.lbl}</text>
                    `).join("")}
                </svg>
            </div>
        `;
    }

    // =====================================================================
    // RENDER PRINCIPAL (DASHBOARD 2 COLUMNAS EN PC)
    // =====================================================================
    window.renderizarPortalPacienteProCDM = function (claveHint = null) {
        inyectarCSSPortalPaciente();
        document.body.setAttribute("data-modo-portal", "paciente");
        document.getElementById("cdmFloatingDropletClock")?.remove();

        const { db, p, club } = obtenerDatosPacienteVivo(claveHint);
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : { nombreEntidad: "Consultorio" };
        const main = document.querySelector(".app-content");
        if (!main) return;

        const topH2 = document.querySelector(".app-topbar .topbar-title h2");
        if (topH2) topH2.textContent = `${lic.nombreEntidad || "Consultorio"} • Portal del Paciente`;
        document.title = `Portal del Paciente | ${lic.nombreEntidad || "Consultorio"}`;

        let root = document.getElementById("portalPacienteRootCDM");
        if (!root) {
            root = document.createElement("div");
            root.id = "portalPacienteRootCDM";
            main.prepend(root);
        }

        if (!p) {
            root.innerHTML = `
                <div class="pp-card" style="text-align:center; padding:2.2rem;">
                    <h3>No encontramos tu ficha de paciente</h3>
                    <p style="color:var(--ink-500); font-size:0.86rem;">Consultá tu código personal con tu profesional e intentá ingresar nuevamente.</p>
                    <button type="button" class="btn btn-primary btn-sm" onclick="cerrarSesionCDM()">Volver al Ingreso</button>
                </div>
            `;
            return;
        }

        const perfil = perfilPorEspecialidad(p.especialidad);
        stPortal.paciente = p;
        stPortal.db = db;
        stPortal.lic = lic;
        stPortal.perfil = perfil;
        stPortal.clubKey = club;

        const puedeSubir = p.puedeSubirEstudios !== false;
        const mut = (db.mutuales || []).find(m => m.id === p.mutualId);
        const hoy = new Date().toISOString().split("T")[0];
        const misTurnos = (db.turnos || [])
            .filter(t => Number(t.pacienteId) === Number(p.id) && t.estado !== "cancelado")
            .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
        const proxTurnos = misTurnos.filter(t => t.fecha >= hoy && t.estado !== "atendido");
        const prox = proxTurnos[0] || null;

        const tabEsp = perfil.tipo === "nutricion"
            ? { id: "especial", ico: "ri-restaurant-2-line", lbl: "Mi Plan y Peso" }
            : perfil.tipo === "psicologia"
            ? { id: "especial", ico: "ri-task-line", lbl: "Tareas y Acuerdos" }
            : perfil.tipo === "fisico"
            ? { id: "especial", ico: "ri-run-line", lbl: "Ejercicios y EVA" }
            : { id: "especial", ico: "ri-file-list-3-line", lbl: "Indicaciones" };

        const tabs = [
            { id: "inicio", ico: "ri-home-5-line", lbl: "Inicio" },
            { id: "turnos", ico: "ri-calendar-check-line", lbl: `Turnos (${proxTurnos.length})` },
            tabEsp,
            { id: "documentos", ico: "ri-upload-cloud-2-line", lbl: `Estudios (${p.estudios.length + p.recetas.length})` }
        ];

        if (!tabs.some(t => t.id === stPortal.tab)) stPortal.tab = "inicio";

        root.innerHTML = `
            <!-- HERO SUPERIOR FULL WIDTH -->
            <div class="pp-hero" style="background:${perfil.grad};">
                <div class="pp-hero-left">
                    <div class="pp-avatar">${inicialesPac(p)}</div>
                    <div>
                        <span class="pp-hero-pill"><i class="${perfil.icono}"></i> Portal del Paciente • ${escH(p.especialidad || "Consultorio")}</span>
                        <h2>${escH(p.nombre)} ${escH(p.apellido)}</h2>
                        <small>${escH(lic.nombreEntidad || "Consultorio")} • DNI ${escH(p.dni || "-")} • ${escH(mut ? mut.nombre : "Particular")}</small>
                    </div>
                </div>
                <div class="pp-hero-actions">
                    ${puedeSubir ? `<button type="button" class="btn btn-sm" style="background:#ffffff; color:#0f172a; font-weight:800;" onclick="window.portalPacCambiarTab('documentos')"><i class="ri-upload-cloud-2-line"></i> Subir Estudio</button>` : ""}
                    <button type="button" class="btn btn-sm" style="background:rgba(255,255,255,0.18); color:#fff; border:1px solid rgba(255,255,255,0.38);" onclick="window.portalPacConsultarWA()"><i class="ri-whatsapp-line"></i> Consultar WA</button>
                </div>
            </div>

            <!-- GRILLA BENTO 2 COLUMNAS EN PC -->
            <div class="pp-shell-grid">
                <!-- COLUMNA IZQUIERDA: PESTAÑAS + CONTENIDO ACTIVO -->
                <div class="pp-main-col">
                    <div class="pp-tabs">
                        ${tabs.map(t => `
                            <button type="button" class="pp-tab ${stPortal.tab === t.id ? "active" : ""}"
                                style="${stPortal.tab === t.id ? `background:${perfil.color};` : ""}"
                                onclick="window.portalPacCambiarTab('${t.id}')">
                                <i class="${t.ico}"></i><span>${t.lbl}</span>
                            </button>
                        `).join("")}
                    </div>

                    <div id="ppContenidoTab"></div>
                </div>

                <!-- COLUMNA DERECHA FIJA EN PC: PRÓXIMO TURNO + CREDENCIAL/ALIAS + ÚLTIMOS ARCHIVOS -->
                <aside class="pp-aside-col">
                    <!-- 1. Próximo Turno -->
                    <div class="pp-card">
                        <div class="pp-card-head" style="margin-bottom:0.75rem; padding-bottom:0.5rem;">
                            <h3><i class="ri-calendar-event-fill" style="color:${perfil.color};"></i> Próximo Turno</h3>
                            <span class="badge ${prox ? "badge-ok" : "badge-celeste"}">${prox ? "Agendado" : "Disponible"}</span>
                        </div>
                        ${prox ? `
                            <div class="pp-next-turn-box">
                                <div class="pp-date-badge" style="background:${perfil.color};">
                                    <span>${mesCortoAR(prox.fecha)}</span>
                                    <strong>${prox.fecha.slice(8, 10)}</strong>
                                </div>
                                <div style="min-width:0; flex:1;">
                                    <strong style="display:block; font-size:0.95rem; color:var(--ink-900);">${prox.hora} hs</strong>
                                    <small style="display:block; color:var(--ink-600);">${escH(prox.especialidad)}</small>
                                    <small style="display:block; color:var(--ink-500);">${escH(prox.mutualNombre || "Particular")}</small>
                                </div>
                            </div>
                        ` : `
                            <div style="text-align:center; padding:0.75rem 0.5rem;">
                                <p style="font-size:0.8rem; color:var(--ink-500); margin:0 0 0.7rem;">No tenés turnos próximos agendados por el momento.</p>
                                <button type="button" class="btn btn-whatsapp btn-sm" style="width:100%;" onclick="window.portalPacConsultarWA('Hola, soy ${escH(p.nombre)} ${escH(p.apellido)}. Quisiera coordinar un turno de ${escH(p.especialidad)}.')">
                                    <i class="ri-whatsapp-line"></i> Solicitar Turno por WA
                                </button>
                            </div>
                        `}
                    </div>

                    <!-- 2. Mi Credencial y Datos de Pago -->
                    <div class="pp-card">
                        <div class="pp-card-head" style="margin-bottom:0.65rem; padding-bottom:0.5rem;">
                            <h3><i class="ri-shield-user-fill" style="color:${perfil.color};"></i> Mi Credencial</h3>
                        </div>
                        <div class="pp-info-row">
                            <span>Código Personal</span>
                            <strong style="cursor:pointer; color:${perfil.color};" title="Copiar código" onclick="navigator.clipboard?.writeText('${escH(p.codigoAcceso)}'); if(typeof mostrarToast==='function') mostrarToast('📋 Código copiado');">
                                ${escH(p.codigoAcceso)} <i class="ri-file-copy-line"></i>
                            </strong>
                        </div>
                        <div class="pp-info-row"><span>Obra Social</span><strong>${escH(mut ? mut.nombre.replace(/\s*\(Sin Obra Social\)/i, "") : "Particular")}</strong></div>
                        ${p.nroAfiliado ? `<div class="pp-info-row"><span>N° Afiliado</span><strong>${escH(p.nroAfiliado)}</strong></div>` : ""}
                        <div class="pp-info-row"><span>Subida de Estudios</span><strong>${puedeSubir ? "🟢 Habilitada" : "🔒 Bloqueada"}</strong></div>
                        ${lic.aliasTransferencia ? `
                            <div style="margin-top:0.75rem; padding:0.65rem 0.75rem; background:rgba(16,185,129,0.09); border:1px solid rgba(16,185,129,0.3); border-radius:12px;">
                                <small style="display:block; font-size:0.66rem; font-weight:800; color:#047857; text-transform:uppercase;">🏦 Alias / CBU para Transferir</small>
                                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem; margin-top:3px;">
                                    <code style="font-size:0.78rem; font-weight:800;">${escH(lic.aliasTransferencia)}</code>
                                    <button type="button" class="btn btn-secondary btn-sm" style="min-height:24px; padding:0 8px; font-size:0.7rem;" onclick="navigator.clipboard?.writeText('${escH(lic.aliasTransferencia)}'); if(typeof mostrarToast==='function') mostrarToast('📋 Alias copiado');">Copiar</button>
                                </div>
                            </div>
                        ` : ""}
                    </div>

                    <!-- 3. Acceso Rápido a Estudios Recientes -->
                    <div class="pp-card">
                        <div class="pp-card-head" style="margin-bottom:0.65rem; padding-bottom:0.5rem;">
                            <h3><i class="ri-folder-upload-fill" style="color:${perfil.color};"></i> Estudios (${p.estudios.length})</h3>
                            ${puedeSubir ? `<button type="button" class="btn btn-ghost btn-sm" style="min-height:26px; font-size:0.72rem;" onclick="window.portalPacCambiarTab('documentos')">+ Subir</button>` : ""}
                        </div>
                        ${p.estudios.length === 0 ? `
                            <small style="color:var(--ink-500); font-size:0.77rem; display:block;">
                                Todavía no hay estudios cargados. ${puedeSubir ? "Podés subir fotos o PDFs desde la pestaña Estudios." : ""}
                            </small>
                        ` : `
                            <div style="display:flex; flex-direction:column; gap:0.4rem;">
                                ${p.estudios.slice(0, 3).map(es => `
                                    <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem; padding:0.45rem 0.6rem; background:var(--surface-subtle); border-radius:10px; font-size:0.76rem;">
                                        <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:700;">📄 ${escH(es.titulo)}</span>
                                        <small style="color:var(--ink-500); flex-shrink:0;">${es.fecha.slice(5)}</small>
                                    </div>
                                `).join("")}
                            </div>
                        `}
                    </div>
                </aside>
            </div>
        `;

        const body = document.getElementById("ppContenidoTab");
        if (!body) return;

        if (stPortal.tab === "inicio") renderInicioDashboard(body, db, p, perfil, proxTurnos, puedeSubir);
        else if (stPortal.tab === "turnos") renderMisTurnos(body, proxTurnos, misTurnos, perfil, p);
        else if (stPortal.tab === "especial") {
            if (perfil.tipo === "nutricion") renderNutriCompleto(body, p, perfil);
            else if (perfil.tipo === "psicologia") renderPsicoTareas(body, db, p, perfil);
            else if (perfil.tipo === "fisico") renderFisicoCompleto(body, db, p, perfil);
            else renderDocumentosYEstudios(body, p, perfil, puedeSubir);
        } else if (stPortal.tab === "documentos") {
            renderDocumentosYEstudios(body, p, perfil, puedeSubir);
        }
    };

    window.renderizarPortalPacienteUniversalEnJugadorHTML19 = window.renderizarPortalPacienteProCDM;

    window.portalPacCambiarTab = function (tab) {
        stPortal.tab = tab;
        window.renderizarPortalPacienteProCDM();
    };

    window.portalPacConsultarWA = function (textoExtra = "") {
        const p = stPortal.paciente, lic = stPortal.lic;
        if (!p) return;
        const msg = textoExtra || `Hola, soy *${p.nombre} ${p.apellido}* (Paciente de ${p.especialidad} en ${lic?.nombreEntidad || "el consultorio"}). Te escribo para consultar o coordinar mi próximo turno.`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    };

    // =====================================================================
    // TAB 1: INICIO (TARJETAS MÉTRICAS + CHECK-IN INTERACTIVO)
    // =====================================================================
    function renderInicioDashboard(cont, db, p, perfil, proxTurnos, puedeSubir) {
        const checkins = (p.checkinsPaciente || []).slice(0, 5);
        const cantSes = (db.sesiones || []).filter(s => Number(s.pacienteId) === Number(p.id)).length;

        let formCheckin = "";
        if (perfil.tipo === "psicologia") {
            formCheckin = `
                <div class="pp-grid-3" style="margin-bottom:0.7rem;">
                    <div class="field"><label>Ánimo hoy (1–10)</label>
                        <div class="pp-slider-row">
                            <input type="range" id="ppCk1" min="1" max="10" value="7" style="flex:1; accent-color:#7c3aed;" oninput="document.getElementById('ppCk1V').textContent=this.value">
                            <span id="ppCk1V" class="pp-slider-pill" style="background:#7c3aed;">7</span>
                        </div>
                    </div>
                    <div class="field"><label>Ansiedad (1–10)</label>
                        <div class="pp-slider-row">
                            <input type="range" id="ppCk2" min="1" max="10" value="4" style="flex:1; accent-color:#f59e0b;" oninput="document.getElementById('ppCk2V').textContent=this.value">
                            <span id="ppCk2V" class="pp-slider-pill" style="background:#f59e0b;">4</span>
                        </div>
                    </div>
                    <div class="field"><label>Sueño (1–10)</label>
                        <div class="pp-slider-row">
                            <input type="range" id="ppCk3" min="1" max="10" value="7" style="flex:1; accent-color:#0284c7;" oninput="document.getElementById('ppCk3V').textContent=this.value">
                            <span id="ppCk3V" class="pp-slider-pill" style="background:#0284c7;">7</span>
                        </div>
                    </div>
                </div>
                <div class="field" style="margin-bottom:0.75rem;">
                    <label>Nota para mi próxima sesión (opcional)</label>
                    <input type="text" id="ppCkNota" placeholder="Ej: Algo que me pasó esta semana y quiero conversar...">
                </div>
            `;
        } else if (perfil.tipo === "nutricion") {
            formCheckin = `
                <div class="pp-grid-2" style="margin-bottom:0.7rem;">
                    <div class="field"><label>Agua tomada hoy (litros)</label><input type="number" step="0.25" id="ppCk1" value="2" placeholder="Ej: 2.5"></div>
                    <div class="field"><label>Adherencia al plan (1–10)</label>
                        <div class="pp-slider-row">
                            <input type="range" id="ppCk2" min="1" max="10" value="8" style="flex:1; accent-color:#16a34a;" oninput="document.getElementById('ppCk2V').textContent=this.value+'/10'">
                            <span id="ppCk2V" class="pp-slider-pill" style="background:#16a34a;">8/10</span>
                        </div>
                    </div>
                </div>
                <div class="field" style="margin-bottom:0.75rem;">
                    <label>Comentario de comidas / saciedad</label>
                    <input type="text" id="ppCkNota" placeholder="Ej: Me sentí con energía, reemplacé merienda...">
                </div>
            `;
        } else {
            formCheckin = `
                <div class="pp-grid-2" style="margin-bottom:0.7rem;">
                    <div class="field"><label>Dolor / Molestia hoy (EVA 0–10)</label>
                        <div class="pp-slider-row">
                            <input type="range" id="ppCk1" min="0" max="10" value="3" style="flex:1; accent-color:#0284c7;" oninput="document.getElementById('ppCk1V').textContent=this.value+'/10'">
                            <span id="ppCk1V" class="pp-slider-pill" style="background:#0284c7;">3/10</span>
                        </div>
                    </div>
                    <div class="field"><label>¿Hiciste los ejercicios en casa?</label>
                        <select id="ppCk2"><option value="Sí, completos">✅ Sí, completos</option><option value="Parciales">🟡 Parciales</option><option value="Hoy no pude">⚪ Hoy no pude</option></select>
                    </div>
                </div>
                <div class="field" style="margin-bottom:0.75rem;">
                    <label>¿Cómo te sentiste hoy?</label>
                    <input type="text" id="ppCkNota" placeholder="Ej: Menos tirantez al levantarme...">
                </div>
            `;
        }

        const titCheckin = perfil.tipo === "psicologia" ? "Diario Emocional / Pre-Sesión" : perfil.tipo === "nutricion" ? "Seguimiento Diario" : "Registro de Dolor y Ejercicios";

        cont.innerHTML = `
            <!-- 3 TARJETAS MÉTRICAS CON ÍCONOS SUAVES -->
            <div class="pp-stats-row">
                <div class="pp-stat-card" onclick="window.portalPacCambiarTab('turnos')">
                    <div class="pp-stat-ico" style="background:${perfil.soft}; color:${perfil.color};"><i class="ri-calendar-check-fill"></i></div>
                    <div><small>Próximos Turnos</small><strong>${proxTurnos.length} agendado(s)</strong></div>
                </div>
                <div class="pp-stat-card" onclick="window.portalPacCambiarTab('documentos')">
                    <div class="pp-stat-ico" style="background:rgba(16,185,129,0.12); color:#059669;"><i class="ri-upload-cloud-2-fill"></i></div>
                    <div><small>Estudios y Docs</small><strong>${p.estudios.length + p.recetas.length} archivo(s)</strong></div>
                </div>
                <div class="pp-stat-card" onclick="window.portalPacCambiarTab('especial')">
                    <div class="pp-stat-ico" style="background:rgba(245,158,11,0.12); color:#d97706;"><i class="ri-pulse-fill"></i></div>
                    <div><small>Seguimiento</small><strong>${cantSes} sesión(es)</strong></div>
                </div>
            </div>

            <!-- CHECK-IN INTERACTIVO -->
            <div class="pp-card">
                <div class="pp-card-head">
                    <div>
                        <h3><i class="ri-edit-2-fill" style="color:${perfil.color};"></i> ${titCheckin}</h3>
                        <small style="color:var(--ink-500); font-size:0.75rem;">Anotá cómo venís entre consultas para que tu profesional lo vea antes de atenderte</small>
                    </div>
                </div>
                <form onsubmit="window.portalPacGuardarCheckin(event)">
                    ${formCheckin}
                    <button type="submit" class="btn btn-primary btn-sm" style="width:100%; background:${perfil.color}; border-color:${perfil.color};">
                        <i class="ri-save-3-line"></i> Guardar Mi Registro de Hoy
                    </button>
                </form>

                ${checkins.length ? `
                    <div style="margin-top:1rem; padding-top:0.85rem; border-top:1px solid var(--line); display:flex; flex-direction:column; gap:0.45rem;">
                        <small style="font-weight:800; color:var(--ink-500); text-transform:uppercase; font-size:0.68rem;">Historial reciente de tus registros:</small>
                        ${checkins.map(c => `
                            <div class="pp-item" style="border-left-color:${perfil.color}; padding:0.6rem 0.8rem; font-size:0.8rem;">
                                <div style="display:flex; justify-content:space-between; gap:0.4rem; flex-wrap:wrap;">
                                    <b>📅 ${formatearFechaAR(c.fecha)}</b>
                                    <span class="badge badge-celeste" style="font-size:0.69rem;">${escH(c.resumen)}</span>
                                </div>
                                ${c.nota ? `<div style="color:var(--ink-700);">${escH(c.nota)}</div>` : ""}
                            </div>
                        `).join("")}
                    </div>
                ` : ""}
            </div>
        `;
    }

    window.portalPacGuardarCheckin = function (e) {
        e.preventDefault();
        const p = stPortal.paciente, perfil = stPortal.perfil;
        if (!p) return;

        let resumen = "";
        if (perfil.tipo === "psicologia") {
            const v1 = document.getElementById("ppCk1")?.value || "7";
            const v2 = document.getElementById("ppCk2")?.value || "4";
            const v3 = document.getElementById("ppCk3")?.value || "7";
            resumen = `Ánimo ${v1}/10 • Ansiedad ${v2}/10 • Sueño ${v3}/10`;
        } else if (perfil.tipo === "nutricion") {
            const v1 = document.getElementById("ppCk1")?.value || "2";
            const v2 = document.getElementById("ppCk2")?.value || "8";
            resumen = `Agua: ${v1} L • Adherencia: ${v2}/10`;
        } else {
            const v1 = document.getElementById("ppCk1")?.value || "3";
            const v2 = document.getElementById("ppCk2")?.value || "";
            resumen = `Dolor EVA ${v1}/10 • Ejercicios: ${v2}`;
        }

        const nota = (document.getElementById("ppCkNota")?.value || "").trim();
        p.checkinsPaciente.unshift({
            id: Date.now(),
            fecha: new Date().toISOString().split("T")[0],
            resumen,
            nota
        });
        guardarDBPacienteLocal();

        if (typeof mostrarToast === "function") mostrarToast("✅ Registro guardado en tu portal.");
        window.renderizarPortalPacienteProCDM();
    };

    // =====================================================================
    // TAB 2: MIS TURNOS
    // =====================================================================
    function renderMisTurnos(cont, proxTurnos, todosTurnos, perfil, p) {
        const pasados = todosTurnos.filter(t => !proxTurnos.includes(t)).reverse().slice(0, 5);
        cont.innerHTML = `
            <div class="pp-card">
                <div class="pp-card-head">
                    <h3><i class="ri-calendar-check-fill" style="color:${perfil.color};"></i> Mis Próximos Turnos (${proxTurnos.length})</h3>
                    <button type="button" class="btn btn-whatsapp btn-sm" onclick="window.portalPacConsultarWA('Hola, soy ${escH(p.nombre)} ${escH(p.apellido)}. Quisiera solicitar un nuevo turno de ${escH(p.especialidad)}.')"><i class="ri-whatsapp-line"></i> Pedir Turno</button>
                </div>
                <div style="display:flex; flex-direction:column; gap:0.55rem;">
                    ${proxTurnos.length === 0 ? `<div class="empty-box" style="padding:1.3rem;">No tenés turnos próximos agendados. Podés solicitar uno tocando <b>Pedir Turno</b>.</div>` :
                    proxTurnos.map(t => `
                        <div class="pp-item" style="border-left-color:${perfil.color};">
                            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                                <strong style="font-size:0.95rem;">📅 ${formatearFechaAR(t.fecha)} — ⏰ ${t.hora} hs</strong>
                                <span class="badge badge-ok" style="text-transform:capitalize;">${escH(t.estado)}</span>
                            </div>
                            <small style="color:var(--ink-600);">
                                ${escH(t.especialidad)}${t.profesional ? ` • 👨‍⚕️ ${escH(t.profesional)}` : ""} • ${escH(t.mutualNombre || "Particular")}
                                ${t.token ? ` • 🔑 Token: <b>${escH(t.token)}</b>` : ""}
                            </small>
                        </div>
                    `).join("")}
                </div>
            </div>

            ${pasados.length ? `
                <div class="pp-card" style="margin-top:0.85rem;">
                    <div class="pp-card-head"><h3><i class="ri-history-line"></i> Consultas Anteriores</h3></div>
                    <div style="display:flex; flex-direction:column; gap:0.4rem;">
                        ${pasados.map(t => `
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem 0.7rem; background:var(--surface-subtle); border-radius:10px; font-size:0.8rem;">
                                <span><b>${formatearFechaAR(t.fecha)}</b> (${t.hora} hs) — ${escH(t.especialidad)}</span>
                                <span class="badge badge-celeste" style="text-transform:capitalize;">${escH(t.estado)}</span>
                            </div>
                        `).join("")}
                    </div>
                </div>
            ` : ""}
        `;
    }

    // =====================================================================
    // TAB 3: ESPECÍFICO POR DISCIPLINA (PSICO / NUTRI / FÍSICO)
    // =====================================================================
    function renderPsicoTareas(cont, db, p, perfil) {
        const tareas = (db.sesiones || [])
            .filter(s => Number(s.pacienteId) === Number(p.id) && String(s.indicaciones || "").trim())
            .sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")));

        cont.innerHTML = `
            <div class="pp-card">
                <div class="pp-card-head">
                    <h3><i class="ri-task-fill" style="color:${perfil.color};"></i> Acuerdos y Actividades entre Sesiones</h3>
                    <span class="badge badge-purple">${tareas.length} registro(s)</span>
                </div>
                <div style="display:flex; flex-direction:column; gap:0.55rem;">
                    ${tareas.length === 0 ? `<div class="empty-box" style="padding:1.3rem;">Tu profesional aún no cargó actividades o acuerdos para trabajar entre sesiones.</div>` :
                    tareas.map(s => `
                        <div class="pp-item" style="border-left-color:${perfil.color};">
                            <strong style="font-size:0.82rem; color:${perfil.color};">📅 Sesión del ${formatearFechaAR(s.fecha)}</strong>
                            <div style="font-size:0.86rem; color:var(--ink-800); white-space:pre-line;">${escH(s.indicaciones)}</div>
                        </div>
                    `).join("")}
                </div>
            </div>
        `;
    }

    function renderNutriCompleto(cont, p, perfil) {
        const pl = p.planNutri || {};
        const tieneComidas = Boolean(pl.desayuno || pl.colacionAM || pl.almuerzo || pl.merienda || pl.cena || pl.suplementacion);
        const comida = (tit, txt) => txt ? `<div class="pp-meal-card"><strong>${tit}</strong><div>${escH(txt)}</div></div>` : "";
        const asc = [...(p.antropometria || [])].sort((a, b) => String(a.fecha || "").localeCompare(String(b.fecha || "")));
        const pts = asc.filter(a => a.peso > 0).map(a => ({ v: Number(a.peso), lbl: String(a.fecha || "").slice(5) }));

        cont.innerHTML = `
            <div class="pp-card">
                <div class="pp-card-head">
                    <div>
                        <h3><i class="ri-restaurant-2-fill" style="color:${perfil.color};"></i> Mi Plan Alimentario</h3>
                        <small style="color:var(--ink-500);">Objetivo: <b>${escH(pl.objetivo || p.objetivoNutricion || "Educación Alimentaria")}</b></small>
                    </div>
                    ${tieneComidas ? `<button type="button" class="btn btn-ok btn-sm" onclick="window.portalPacImprimirPlanNutri()">🖨️ Descargar PDF</button>` : ""}
                </div>
                <div class="pp-kpi-grid">
                    <div class="pp-kpi" style="border-top-color:#16a34a;"><small>Energía Diaria</small><strong>${escH(pl.kcal || "-")}</strong></div>
                    <div class="pp-kpi" style="border-top-color:#0284c7;"><small>Proteínas</small><strong>${escH(pl.prot || "-")}</strong></div>
                    <div class="pp-kpi" style="border-top-color:#f59e0b;"><small>Carbos / Grasas</small><strong>${escH(pl.carb || "-")} / ${escH(pl.grasas || "-")}</strong></div>
                    <div class="pp-kpi" style="border-top-color:#0d9488;"><small>Hidratación</small><strong>${escH(pl.agua || "2.5 L")}</strong></div>
                </div>
                ${!tieneComidas ? `<div class="empty-box" style="padding:1rem;">Tu nutricionista todavía no publicó el detalle de comidas.</div>` : `
                    <div class="pp-grid-2">
                        ${comida("☕ Desayuno", pl.desayuno)}${comida("🍎 Colación Mañana", pl.colacionAM)}
                        ${comida("🍽️ Almuerzo", pl.almuerzo)}${comida("🍵 Merienda", pl.merienda)}
                        ${comida("🌙 Cena", pl.cena)}${comida("💊 Suplementación / PM", pl.suplementacion)}
                    </div>
                `}
            </div>
            ${pts.length >= 2 ? `<div class="pp-card" style="margin-top:0.85rem;">${construirCurvaMiniSVG("📉 Mi Evolución de Peso (kg)", pts, perfil.color, " kg")}</div>` : ""}
        `;
    }

    window.portalPacImprimirPlanNutri = function () {
        const p = stPortal.paciente, pl = p?.planNutri || {}, lic = stPortal.lic || {};
        if (!p) return;
        const fila = (t, v) => v ? `<tr><td style="width:26%; font-weight:700; background:#f8fafc;">${t}</td><td style="white-space:pre-line;">${escH(v)}</td></tr>` : "";
        imprimirDocPacienteA4(`
            <h2 style="margin:0 0 4px; color:#15803d;">🥗 Plan Alimentario — ${escH(p.nombre)} ${escH(p.apellido)}</h2>
            <p style="margin:0 0 12px; font-size:0.82rem; color:#475569;">${escH(lic.nombreEntidad || "Nutrición")} • Objetivo: <b>${escH(pl.objetivo || "-")}</b> • Agua: ${escH(pl.agua || "-")}</p>
            <table><tbody>
                ${fila("☕ Desayuno", pl.desayuno)}${fila("🍎 Colación AM", pl.colacionAM)}
                ${fila("🍽️ Almuerzo", pl.almuerzo)}${fila("🍵 Merienda", pl.merienda)}
                ${fila("🌙 Cena", pl.cena)}${fila("💊 Suplementación", pl.suplementacion)}
            </tbody></table>
        `);
    };

    function renderFisicoCompleto(cont, db, p, perfil) {
        const indSes = (db.sesiones || [])
            .filter(s => Number(s.pacienteId) === Number(p.id) && String(s.indicaciones || "").trim())
            .sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")));
        const ascEva = (db.sesiones || [])
            .filter(s => Number(s.pacienteId) === Number(p.id) && s.eva != null)
            .sort((a, b) => String(a.fecha || "").localeCompare(String(b.fecha || "")));
        const pts = ascEva.map(s => ({ v: Number(s.eva), lbl: String(s.fecha || "").slice(5) }));

        cont.innerHTML = `
            <div class="pp-card">
                <div class="pp-card-head"><h3><i class="ri-run-fill" style="color:${perfil.color};"></i> Ejercicios e Indicaciones para Casa</h3></div>
                <div style="display:flex; flex-direction:column; gap:0.55rem;">
                    ${indSes.length === 0 ? `<div class="empty-box" style="padding:1.2rem;">Todavía no tenés ejercicios cargados por tu profesional.</div>` :
                    indSes.map(s => `
                        <div class="pp-item" style="border-left-color:${perfil.color};">
                            <strong style="font-size:0.8rem; color:${perfil.color};">📅 Sesión del ${formatearFechaAR(s.fecha)}</strong>
                            <div style="font-size:0.85rem; white-space:pre-line;">${escH(s.indicaciones)}</div>
                        </div>
                    `).join("")}
                </div>
            </div>
            ${pts.length >= 2 ? `<div class="pp-card" style="margin-top:0.85rem;">${construirCurvaMiniSVG("📉 Evolución del Dolor (EVA 0–10)", pts, perfil.color, "/10")}</div>` : ""}
        `;
    }

    // =====================================================================
    // TAB 4: SUBIDA DE ESTUDIOS + INFORMES Y ADJUNTOS
    // =====================================================================
    function renderDocumentosYEstudios(cont, p, perfil, puedeSubir) {
        const recetas = p.recetas || [];
        const estudios = p.estudios || [];

        cont.innerHTML = `
            ${puedeSubir ? `
                <div class="pp-card" style="margin-bottom:0.95rem;">
                    <div class="pp-card-head">
                        <div>
                            <h3><i class="ri-upload-cloud-2-fill" style="color:${perfil.color};"></i> Subir Estudio, Foto o Dato para mi Profesional</h3>
                            <small style="color:var(--ink-500); font-size:0.75rem;">Adjuntá una foto, PDF (máx. 2.5 MB), pegá un link o dejá una nota</small>
                        </div>
                        <span class="badge badge-ok">🔓 Habilitado</span>
                    </div>
                    <form onsubmit="window.portalPacSubirEstudio(event)">
                        <div class="pp-grid-2" style="margin-bottom:0.65rem;">
                            <div class="field"><label>Título del Estudio o Dato *</label><input type="text" id="ppSubTit" required placeholder="Ej: Análisis de sangre / Orden médica / Radiografía"></div>
                            <div class="field"><label>Archivo (Foto o PDF — opcional)</label><div class="pp-upload-zone"><input type="file" id="ppSubFile" accept="image/*,.pdf" style="border:none; padding:0; min-height:auto;"></div></div>
                        </div>
                        <div class="pp-grid-2" style="margin-bottom:0.75rem;">
                            <div class="field"><label>Link externo (Drive / Laboratorio — opcional)</label><input type="url" id="ppSubUrl" placeholder="https://..."></div>
                            <div class="field"><label>Comentario / Dato para el Profesional</label><input type="text" id="ppSubNota" placeholder="Ej: Resultados del lunes, consulta o comentario..."></div>
                        </div>
                        <button type="submit" id="btnPPSubirEst" class="btn btn-primary btn-sm" style="width:100%; background:${perfil.color}; border-color:${perfil.color};">
                            <i class="ri-send-plane-fill"></i> Enviar a mi Profesional
                        </button>
                    </form>
                </div>
            ` : `
                <div class="pp-card" style="margin-bottom:0.95rem; text-align:center; font-size:0.82rem; color:var(--ink-500);">
                    🔒 Tu profesional tiene desactivada temporalmente la subida de archivos para esta cuenta.
                </div>
            `}

            <div class="pp-grid-2">
                <div class="pp-card">
                    <div class="pp-card-head"><h3><i class="ri-file-text-fill" style="color:${perfil.color};"></i> Informes e Indicaciones (${recetas.length})</h3></div>
                    <div style="display:flex; flex-direction:column; gap:0.5rem;">
                        ${recetas.length === 0 ? `<div class="empty-box" style="padding:1rem; font-size:0.8rem;">Sin documentos emitidos todavía.</div>` :
                        recetas.map(r => `
                            <div class="pp-item" style="border-left-color:${perfil.color};">
                                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem;">
                                    <strong style="font-size:0.83rem;">${escH(r.diagnostico || "Documento")}</strong>
                                    <button type="button" class="btn btn-primary btn-sm" style="min-height:26px; font-size:0.72rem;" onclick="window.portalPacImprimirDoc(${r.id})">🖨️ PDF</button>
                                </div>
                                <small style="color:var(--ink-500);">${formatearFechaAR(r.fecha)} • ${escH(r.profesional || "")}</small>
                                <div style="font-size:0.8rem; white-space:pre-line;">${escH(r.textoRP)}</div>
                            </div>
                        `).join("")}
                    </div>
                </div>

                <div class="pp-card">
                    <div class="pp-card-head"><h3><i class="ri-folder-3-fill" style="color:#0d9488;"></i> Mis Estudios y Adjuntos (${estudios.length})</h3></div>
                    <div style="display:flex; flex-direction:column; gap:0.5rem;">
                        ${estudios.length === 0 ? `<div class="empty-box" style="padding:1rem; font-size:0.8rem;">Sin estudios cargados todavía.</div>` :
                        estudios.map(es => `
                            <div class="pp-item" style="border-left-color:${es.subidoPor === "paciente" ? "#10b981" : "#0d9488"};">
                                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem;">
                                    <strong style="font-size:0.83rem;">📄 ${escH(es.titulo)} ${es.subidoPor === "paciente" ? `<span class="badge badge-ok" style="font-size:0.62rem;">Enviado por vos</span>` : ""}</strong>
                                    <div style="display:flex; gap:0.3rem;">
                                        ${es.archivoDataUrl ? `<a href="${es.archivoDataUrl}" download="${escH(es.archivoNombre || es.titulo)}" class="btn btn-primary btn-sm" style="min-height:26px; font-size:0.72rem;">Bajar</a>` : ""}
                                        ${es.url ? `<a href="${escH(es.url)}" target="_blank" class="btn btn-secondary btn-sm" style="min-height:26px; font-size:0.72rem;">Abrir ↗</a>` : ""}
                                    </div>
                                </div>
                                <small style="color:var(--ink-500);">${formatearFechaAR(es.fecha)}</small>
                                ${es.nota ? `<div style="font-size:0.79rem;">${escH(es.nota)}</div>` : ""}
                            </div>
                        `).join("")}
                    </div>
                </div>
            </div>
        `;
    }

    function leerArchivoPacienteDataURL(file) {
        return new Promise((resolve, reject) => {
            if (!file) return resolve({ dataUrl: "", nombre: "" });
            if (file.size > 2.5 * 1024 * 1024 && !file.type.startsWith("image/")) {
                return reject(new Error("El PDF supera los 2.5 MB. Podés subirlo a Google Drive y pegar el link."));
            }
            const reader = new FileReader();
            reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
            reader.onload = (ev) => {
                if (!file.type.startsWith("image/")) {
                    return resolve({ dataUrl: ev.target.result, nombre: file.name });
                }
                const img = new Image();
                img.onload = () => {
                    const max = 1280;
                    const sc = Math.min(1, max / Math.max(img.width, img.height));
                    const cv = document.createElement("canvas");
                    cv.width = Math.round(img.width * sc);
                    cv.height = Math.round(img.height * sc);
                    cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
                    resolve({ dataUrl: cv.toDataURL("image/jpeg", 0.82), nombre: file.name });
                };
                img.onerror = () => resolve({ dataUrl: ev.target.result, nombre: file.name });
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    window.portalPacSubirEstudio = async function (e) {
        e.preventDefault();
        const p = stPortal.paciente;
        if (!p || p.puedeSubirEstudios === false) return;

        const btn = document.getElementById("btnPPSubirEst");
        if (btn) { btn.disabled = true; btn.textContent = "⏳ Enviando..."; }

        try {
            const file = document.getElementById("ppSubFile")?.files?.[0] || null;
            const { dataUrl, nombre } = await leerArchivoPacienteDataURL(file);

            const nuevo = {
                id: Date.now(),
                titulo: document.getElementById("ppSubTit").value.trim(),
                fecha: new Date().toISOString().split("T")[0],
                url: (document.getElementById("ppSubUrl")?.value || "").trim(),
                archivoDataUrl: dataUrl,
                archivoNombre: nombre,
                nota: (document.getElementById("ppSubNota")?.value || "").trim(),
                subidoPor: "paciente"
            };

            if (!Array.isArray(p.estudios)) p.estudios = [];
            p.estudios.unshift(nuevo);
            guardarDBPacienteLocal();

            if (window.location.protocol !== "file:") {
                await fetch(`/api/cdm/paciente/${encodeURIComponent(p.id)}/estudio`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ claveClub: stPortal.clubKey, estudio: nuevo })
                }).catch(() => {});
            }

            if (typeof mostrarToast === "function") mostrarToast("✅ Estudio enviado correctamente a tu profesional.");
            window.renderizarPortalPacienteProCDM();
        } catch (err) {
            alert("⚠️ " + err.message);
            if (btn) { btn.disabled = false; btn.textContent = "📤 Enviar a mi Profesional"; }
        }
    };

    window.portalPacImprimirDoc = function (idDoc) {
        const p = stPortal.paciente, perfil = stPortal.perfil;
        const r = (p?.recetas || []).find(x => Number(x.id) === Number(idDoc));
        if (!p || !r) return;
        imprimirDocPacienteA4(`
            <div style="border:2px solid ${perfil.color}; border-radius:12px; padding:1.4rem;">
                <div style="display:flex; justify-content:space-between; border-bottom:2px solid ${perfil.color}; padding-bottom:0.6rem; margin-bottom:1rem;">
                    <div><h2 style="margin:0;">${escH(r.profesional || stPortal.lic?.nombreEntidad || "Consultorio")}</h2><small>${escH(p.especialidad || "")} ${r.matricula ? `• ${escH(r.matricula)}` : ""}</small></div>
                    <div style="text-align:right; font-size:0.8rem;"><b>Fecha:</b> ${formatearFechaAR(r.fecha)}</div>
                </div>
                <p style="font-size:0.84rem; margin-bottom:1rem;"><b>Paciente:</b> ${escH(p.apellido)}, ${escH(p.nombre)} • <b>DNI:</b> ${escH(p.dni || "-")}${r.diagnostico ? `<br><b>Motivo / Asunto:</b> ${escH(r.diagnostico)}` : ""}</p>
                <div style="font-size:0.94rem; line-height:1.7; white-space:pre-line; min-height:150px;">${escH(r.textoRP)}</div>
            </div>
        `);
    };

    document.addEventListener("DOMContentLoaded", () => {
        const ses = typeof obtenerSesionActivaCDM === "function" ? obtenerSesionActivaCDM() : null;
        const params = new URLSearchParams(window.location.search);
        if ((ses && ses.esPacienteConsultorio) || params.get("modo") === "paciente") {
            setTimeout(() => window.renderizarPortalPacienteProCDM(), 60);
        }
    });
})();