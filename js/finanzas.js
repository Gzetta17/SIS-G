/**
 * js/finanzas.js — Motor Profesional de Tesorería, Cuenta Corriente y Cobranzas
 * - Fuente única de verdad: todo ingreso/egreso en KPIs, Cajas, Cuotas y Movimientos cuadra al centavo
 * - Pagos Totales y Parciales por persona/mes con anulación y edición a primera vista
 * - Separación estricta: Cobro de Cuotas vs. Gastos y Otros Ingresos (con lista en vivo de últimos movimientos)
 * - Tarifario base por área + Ajuste masivo con Vista Previa, Excepciones y Deshacer real
 * - Protección contra desfase de fecha/zona horaria y carreras de sincronización con MongoDB
 * - Compatibilidad total con Consultorios Privados (Bloque 17)
 * G-SIS — Desarrollado por Gonzalo Adanchú
 */

(function () {
    const MEDIOS_PAGO_FIN = [
        { clave: "Efectivo", icono: "💵", color: "#10b981" },
        { clave: "Transferencia", icono: "🏦", color: "#0284c7" },
        { clave: "MercadoPago", icono: "📱", color: "#38bdf8" },
        { clave: "Tarjeta / Mutual", icono: "💳", color: "#6366f1" }
    ];

    const RUBROS_INGRESO_GENERAL = ["Indumentaria / Merch", "Buffet / Bebidas", "Inscripción / Matrícula", "Alquiler Cancha / Espacio", "Sponsors / Eventos", "Otros Ingresos"];
    const RUBROS_INGRESO_CONS = ["Sesión Consultorio", "Coseguro / Mutual", "Liquidación Obra Social", "Informes / Certificados", "Otros Ingresos"];
    const RUBROS_EGRESO = ["Alquiler / Expensas", "Luz / Agua / Internet", "Honorarios Profesores", "Equipamiento / Mantenimiento", "Insumos / Limpieza", "Impuestos / Varios", "Retiro de Socios"];
    const RUBROS_EGRESO_CONS = ["Alquiler / Expensas", "Colegio / Matrícula", "Insumos / Consultorio", "Honorarios Equipo", "Servicios / Internet", "Impuestos / Varios", "Retiro / Otros"];

    const finHidratadoPorClub = {};
    let finSyncTimer = null;
    let finUltimoEstadoSync = "local";
    let finLocalMutationSeq = 0;

    function hoyFin() {
        if (typeof obtenerHoyISO === "function") return obtenerHoyISO();
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    function mesActualFin() {
        return hoyFin().slice(0, 7);
    }

    window._finState = {
        tab: "cuotas",
        mes: mesActualFin(),
        filtroTipo: "TODOS",
        filtroMedio: "TODOS",
        busq: "",
        cuotasBusq: "",
        cuotasEstado: "TODOS", // "TODOS" | "PENDIENTES" | "PARCIALES" | "ALDIA"
        cuotasArea: "TODAS",
        rapidoTipo: "egreso",
        rapidoMedio: "Efectivo"
    };

    window._finAumExcluidos = new Set();

    // =====================================================================
    // 0. ESTILOS + AISLAMIENTO TOTAL DE LA PANTALLA FINANZAS
    // =====================================================================
    function inyectarCSSFinanzasPro() {
        if (document.getElementById("cdmCssFinanzasProUX")) return;
        const st = document.createElement("style");
        st.id = "cdmCssFinanzasProUX";
        st.textContent = `
            body[data-finanzas-abierta="1"] #indexExecutiveHub,
            body[data-finanzas-abierta="1"] #idxSectionDivider,
            body[data-finanzas-abierta="1"] #indexGabineteAlertas20,
            body[data-finanzas-abierta="1"] .sports-showcase-grid,
            body[data-finanzas-abierta="1"] .app-content > .section-head {
                display: none !important;
            }

            .fin-top-bar {
                background: var(--surface-solid, #ffffff);
                border: 1.5px solid var(--line, #e2e8f0);
                border-radius: 18px;
                padding: 0.8rem 1rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 0.7rem;
                flex-wrap: wrap;
                margin-bottom: 0.9rem;
                box-shadow: 0 6px 18px -12px rgba(15, 23, 42, 0.12);
            }
            .fin-period-group, .fin-actions-group {
                display: flex;
                align-items: center;
                gap: 0.42rem;
                flex-wrap: wrap;
            }
            .fin-kpi-sub {
                display: block;
                font-size: 0.68rem;
                color: var(--ink-500, #64748b);
                margin-top: 2px;
                font-weight: 700;
            }
            .fin-cobranza-progress {
                background: var(--surface-solid, #ffffff);
                border: 1.5px solid var(--line, #e2e8f0);
                border-radius: 16px;
                padding: 0.75rem 1rem;
                margin-bottom: 0.95rem;
                display: flex;
                flex-direction: column;
                gap: 0.45rem;
            }
            .fin-progress-track {
                width: 100%;
                height: 10px;
                background: var(--surface-subtle, #e2e8f0);
                border-radius: 999px;
                overflow: hidden;
            }
            .fin-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #0284c7 0%, #10b981 100%);
                border-radius: 999px;
                transition: width 0.35s ease;
            }
            .fin-toggle-pair {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0.45rem;
                margin-bottom: 0.75rem;
            }
            .fin-toggle-btn {
                border: 1.5px solid var(--line-strong, #cbd5e1);
                background: var(--surface-subtle, #f8fafc);
                color: var(--ink-700, #334155);
                border-radius: 12px;
                padding: 0.58rem 0.75rem;
                font-size: 0.82rem;
                font-weight: 800;
                cursor: pointer;
                transition: all 0.14s ease;
            }
            .fin-toggle-btn.is-ing { background: #10b981; border-color: #059669; color: #ffffff; }
            .fin-toggle-btn.is-egr { background: #ef4444; border-color: #dc2626; color: #ffffff; }

            .fin-medios-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 0.4rem;
            }
            .fin-medio-chip {
                border: 1.5px solid var(--line-strong, #cbd5e1);
                background: var(--surface-subtle, #f8fafc);
                color: var(--ink-700, #334155);
                border-radius: 10px;
                padding: 0.5rem 0.55rem;
                font-size: 0.76rem;
                font-weight: 800;
                cursor: pointer;
                text-align: center;
                transition: all 0.14s ease;
            }
            .fin-medio-chip.active { background: #0284c7; border-color: #0284c7; color: #ffffff; }

            .fin-cajas-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 0.75rem;
            }
            .fin-caja-card {
                background: var(--surface-subtle, #f8fafc);
                border: 1.5px solid var(--line, #e2e8f0);
                border-top: 4px solid #0284c7;
                border-radius: 15px;
                padding: 0.85rem 0.95rem;
            }
            .fin-caja-card span { font-size: 0.76rem; font-weight: 800; color: var(--ink-500, #64748b); display: block; }
            .fin-caja-card strong { font-size: 1.35rem; font-weight: 900; color: var(--ink-900, #0f172a); display: block; margin-top: 3px; }
            .fin-caja-sub { font-size: 0.69rem; color: var(--ink-500, #64748b); margin-top: 4px; display: flex; gap: 0.6rem; }

            .fin-chips-bar { display: flex; gap: 0.35rem; flex-wrap: wrap; align-items: center; }
            .fin-filter-chip {
                border: 1.5px solid var(--line-strong, #cbd5e1);
                background: var(--surface-subtle, #f8fafc);
                color: var(--ink-700, #334155);
                border-radius: 999px;
                padding: 0.32rem 0.75rem;
                font-size: 0.74rem;
                font-weight: 800;
                cursor: pointer;
            }
            .fin-filter-chip.active { background: #0284c7; border-color: #0284c7; color: #ffffff; }
            .fin-filter-chip.warn.active { background: #dc2626; border-color: #dc2626; }
            .fin-filter-chip.parcial.active { background: #d97706; border-color: #d97706; }
            .fin-filter-chip.ok.active { background: #10b981; border-color: #10b981; }

            .fin-cc-summary {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 0.45rem;
                background: var(--surface-subtle, #f8fafc);
                border: 1px solid var(--line, #e2e8f0);
                border-radius: 14px;
                padding: 0.65rem;
                margin-bottom: 0.8rem;
                text-align: center;
            }
            .fin-cc-summary small { display: block; font-size: 0.66rem; font-weight: 800; color: var(--ink-500); text-transform: uppercase; }
            .fin-cc-summary strong { display: block; font-size: 1.05rem; font-weight: 900; margin-top: 2px; }

            .fin-quick-amts { display: flex; gap: 0.35rem; flex-wrap: wrap; margin-top: 0.35rem; }
            .fin-quick-amt-btn {
                border: 1px solid var(--line-strong, #cbd5e1);
                background: var(--surface-subtle, #f8fafc);
                color: var(--ink-700, #334155);
                border-radius: 8px;
                padding: 0.22rem 0.55rem;
                font-size: 0.71rem;
                font-weight: 800;
                cursor: pointer;
            }
            .fin-quick-amt-btn:hover { border-color: #0284c7; color: #0284c7; }

            @media (max-width: 640px) {
                .fin-cajas-grid { grid-template-columns: 1fr; }
                .fin-top-bar { padding: 0.72rem; }
                .fin-cc-summary { grid-template-columns: 1fr; text-align: left; }
            }
        `;
        document.head.appendChild(st);
    }

    function mesCuotaActivo() {
        return window._finState.mes === "TODOS" ? mesActualFin() : window._finState.mes;
    }

    function fechaDefaultParaPeriodo(mesOpt = null) {
        const mesObj = mesOpt || mesCuotaActivo();
        const hoy = hoyFin();
        if (hoy.startsWith(mesObj)) return hoy;
        return `${mesObj}-01`;
    }

    function fmtMesCorto(ym) {
        if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return ym || "";
        const [y, m] = ym.split("-").map(Number);
        const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        return `${meses[(m - 1) % 12]} ${y}`;
    }

    function toastFin(msg) {
        if (typeof mostrarToast === "function") mostrarToast(msg);
    }

    function escFin(s) {
        return String(s ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function fmtPesos(n) {
        return "$" + Math.round(Number(n) || 0).toLocaleString("es-AR");
    }

    function clubKeyFin() {
        return typeof obtenerClaveClubActivoCDM === "function"
            ? obtenerClaveClubActivoCDM()
            : (localStorage.getItem("cdm_club_activo_id_v1") || "cdm_adelia_maria_principal");
    }

    function storageKeyFin(clubOpt = null) {
        return `cdm_finanzas_unif_v35_${clubOpt || clubKeyFin()}`;
    }

    function histAumentosKeyFin() {
        return `cdm_hist_aumentos_cuota_v1_${clubKeyFin()}`;
    }

    function esAdminSesionFin() {
        try {
            const ses = JSON.parse(localStorage.getItem("cdm_sesion_activa_v1") || "null");
            return Boolean(ses && ses.rol === "admin");
        } catch {
            return false;
        }
    }

    function estadoModulosFin() {
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        const mod = lic?.modulos || { futbol: true, hockey: true, gym: true, consultorio: false };
        const profs = Array.isArray(lic?.profesionesHabilitadas) ? lic.profesionesHabilitadas.filter(Boolean) : [];
        const tieneCons = (mod.consultorio !== false) && profs.length > 0;
        const tieneClubGym = (mod.futbol !== false) || (mod.hockey !== false) || (mod.gym !== false) || ((lic?.deportesExtra || []).length > 0);
        return { tieneCons, tieneClubGym, soloCons: tieneCons && !tieneClubGym };
    }

    function obtenerAreasClubGym() {
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        const mod = lic?.modulos || { futbol: true, hockey: true, gym: true };
        const set = new Set();
        if (mod.gym !== false) set.add("Gimnasio");
        if (mod.futbol !== false) set.add("Futbol");
        if (mod.hockey !== false) set.add("Hockey");
        (lic?.deportesExtra || []).forEach(d => {
            const limpio = String(d || "").replace(/^[^\w\sÁÉÍÓÚáéíóúÑñ]+\s*/, "").trim();
            if (limpio) set.add(limpio);
        });
        return Array.from(set);
    }

    function normalizarMedioPago(raw = "") {
        const t = String(raw || "").toLowerCase();
        if (t.includes("efec")) return "Efectivo";
        if (t.includes("mercado") || t.includes("mp")) return "MercadoPago";
        if (t.includes("tarj") || t.includes("mutu") || t.includes("obra")) return "Tarjeta / Mutual";
        return "Transferencia";
    }

    function esMovimientoDeCuota(m) {
        if (!m || m.tipo !== "ingreso") return false;
        if (m.esCuota || m.personaId) return true;
        const r = String(m.rubro || "").toLowerCase();
        return r.includes("cuota");
    }

    function normalizarListaMovimientos(arr = []) {
        return (Array.isArray(arr) ? arr : [])
            .filter(m => m && Number(m.monto) > 0)
            .map((m, idx) => ({
                ...m,
                id: m.id || (Date.now() + idx),
                fecha: m.fecha || hoyFin(),
                tipo: String(m.tipo || "ingreso").toLowerCase().includes("egr") ? "egreso" : "ingreso",
                rubro: m.rubro || m.categoria || "General",
                concepto: m.concepto || m.detalle || "Movimiento",
                monto: Math.abs(parseFloat(m.monto) || 0),
                medio: normalizarMedioPago(m.medio || m.caja)
            }))
            .sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")) || (Number(b.id) - Number(a.id)));
    }

    function obtenerMovimientosFinanzas() {
        const key = storageKeyFin();
        let lista = null;
        try { lista = JSON.parse(localStorage.getItem(key) || "null"); } catch { lista = null; }
        if (!Array.isArray(lista)) {
            lista = [];
            localStorage.setItem(key, JSON.stringify(lista));
        }
        return normalizarListaMovimientos(lista);
    }

    // =====================================================================
    // 1. CUENTA CORRIENTE ESTRICTA (SOLO CUENTA PLATA REAL EN CAJA)
    // =====================================================================
    function obtenerTarifarioBaseFin() {
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        return (lic && typeof lic.tarifarioCuotas === "object" && lic.tarifarioCuotas) ? lic.tarifarioCuotas : {};
    }

    function obtenerCuotaEsperadaPersona(p) {
        if (!p) return 25000;
        if (p.montoCuota === 0 || p.montoCuota === "0") return 0; // Becado
        const propia = Number(p.montoCuota);
        if (!isNaN(propia) && propia > 0) return propia;
        const tarifaArea = Number(obtenerTarifarioBaseFin()[p.deporte]);
        if (!isNaN(tarifaArea) && tarifaArea > 0) return tarifaArea;
        return 25000;
    }

    function obtenerPagosDePersonaEnMes(listaMovs, p, mesYM) {
        if (!p) return [];
        const firmaA = `${p.apellido || ""}, ${p.nombre || ""}`.toLowerCase().trim();
        const firmaB = `${p.nombre || ""} ${p.apellido || ""}`.toLowerCase().trim();

        return (listaMovs || []).filter(m => {
            if (!m || m.tipo !== "ingreso") return false;
            const mesReg = m.mesCuota || String(m.fecha || "").slice(0, 7);
            if (mesReg !== mesYM) return false;
            if (m.personaId && Number(m.personaId) === Number(p.id)) return true;
            const r = String(m.rubro || "").toLowerCase();
            const c = String(m.concepto || "").toLowerCase();
            return (r.includes("cuota") || c.includes("cuota")) &&
                ((firmaA.length > 3 && c.includes(firmaA)) || (firmaB.length > 3 && c.includes(firmaB)));
        });
    }

    function calcularEstadoCuotaPersona(p, mesYM, listaMovsOpt = null) {
        const lista = listaMovsOpt || obtenerMovimientosFinanzas();
        const cuota = obtenerCuotaEsperadaPersona(p);
        const pagos = obtenerPagosDePersonaEnMes(lista, p, mesYM);
        const pagado = pagos.reduce((acc, m) => acc + (Number(m.monto) || 0), 0);
        const saldo = Math.max(0, cuota - pagado);

        let estado = "impago"; // "aldia" | "parcial" | "impago" | "becado"
        if (cuota === 0) estado = "becado";
        else if (pagado >= cuota) estado = "aldia";
        else if (pagado > 0) estado = "parcial";

        return {
            cuota,
            pagado,
            saldo: (estado === "aldia" || estado === "becado") ? 0 : saldo,
            estado,
            pagos,
            ultimoPago: pagos[0] || null
        };
    }

    function sincronizarEstadoPersonaConCaja(p, listaMovsOpt = null) {
        if (!p) return;
        const info = calcularEstadoCuotaPersona(p, mesActualFin(), listaMovsOpt);
        if (info.estado === "aldia" || info.estado === "becado") p.pagoEstado = "Al Día";
        else if (info.estado === "parcial") p.pagoEstado = "Parcial";
        else p.pagoEstado = "Pendiente";
        p.ultimoPagoFecha = info.ultimoPago?.fecha || null;
        p.ultimoPagoMedio = info.ultimoPago?.medio || null;
        p.ultimoPagoMovId = info.ultimoPago?.id || null;
    }

    function sincronizarPadronEnMemoriaConCaja() {
        if (typeof basePersonas === "undefined" || !Array.isArray(basePersonas)) return;
        const movs = obtenerMovimientosFinanzas();
        basePersonas.forEach(p => {
            if (p && p.activo) sincronizarEstadoPersonaConCaja(p, movs);
        });
    }

    // =====================================================================
    // 2. SINCRONIZACIÓN CON MONGODB (CON PROTECCIÓN ANTI-CARRERA)
    // =====================================================================
    function actualizarBadgeSyncFinUI() {
        const b = document.getElementById("finBadgeSyncNube");
        if (!b) return;
        if (finUltimoEstadoSync === "nube") {
            b.className = "badge badge-ok";
            b.textContent = "☁️ En la nube";
        } else if (finUltimoEstadoSync === "guardando") {
            b.className = "badge badge-celeste";
            b.textContent = "⏳ Guardando...";
        } else if (finUltimoEstadoSync === "error") {
            b.className = "badge badge-warn";
            b.textContent = "💾 Respaldo local";
        } else {
            b.className = "badge badge-celeste";
            b.textContent = "💾 Local";
        }
    }

    function sincronizarFinanzasHaciaServidor(lista, inmediato = false) {
        if (window.location.protocol === "file:" || !esAdminSesionFin()) return;
        const club = clubKeyFin();
        const payload = { claveClub: club, movimientos: normalizarListaMovimientos(lista) };

        const ejecutar = () => {
            finUltimoEstadoSync = "guardando";
            actualizarBadgeSyncFinUI();
            fetch("/api/cdm/finanzas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
                .then(r => r.json())
                .then(data => {
                    finUltimoEstadoSync = data?.ok && data?.mongoGuardado ? "nube" : "error";
                    finHidratadoPorClub[club] = true;
                    actualizarBadgeSyncFinUI();
                })
                .catch(() => {
                    finUltimoEstadoSync = "error";
                    actualizarBadgeSyncFinUI();
                });
        };

        if (finSyncTimer) clearTimeout(finSyncTimer);
        if (inmediato) ejecutar();
        else finSyncTimer = setTimeout(ejecutar, 220);
    }

    async function hidratarFinanzasDesdeServidor(forzar = false) {
        if (window.location.protocol === "file:" || !esAdminSesionFin()) return false;
        const club = clubKeyFin();
        if (!forzar && finHidratadoPorClub[club]) return true;
        const seqInicio = finLocalMutationSeq;

        try {
            const resp = await fetch(`/api/cdm/finanzas?club=${encodeURIComponent(club)}`, { cache: "no-store" });
            if (!resp.ok) return false;
            const data = await resp.json();
            if (!data?.ok) return false;

            // Si hubo un cambio local mientras viajaba el GET, no pisar los datos recién cargados
            if (finLocalMutationSeq !== seqInicio) return true;

            const remotos = normalizarListaMovimientos(data.movimientos || []);
            const locales = obtenerMovimientosFinanzas();
            finHidratadoPorClub[club] = true;

            if (remotos.length > 0) {
                localStorage.setItem(storageKeyFin(club), JSON.stringify(remotos));
                finUltimoEstadoSync = String(data.motor || "").startsWith("mongoose_") ? "nube" : "local";
            } else if (locales.length > 0) {
                sincronizarFinanzasHaciaServidor(locales, true);
            } else {
                finUltimoEstadoSync = String(data.motor || "").startsWith("mongoose_") ? "nube" : "local";
            }

            sincronizarPadronEnMemoriaConCaja();
            actualizarBadgeSyncFinUI();
            window.refrescarFinanzasSiVisible();
            return true;
        } catch {
            finUltimoEstadoSync = "error";
            actualizarBadgeSyncFinUI();
            return false;
        }
    }

    function guardarMovimientosFinanzas(lista, omitirSync = false, inmediato = false) {
        finLocalMutationSeq++;
        const normalizada = normalizarListaMovimientos(lista);
        localStorage.setItem(storageKeyFin(), JSON.stringify(normalizada));
        if (!omitirSync) sincronizarFinanzasHaciaServidor(normalizada, inmediato);
    }

    function refrescarTodaUIPagos() {
        sincronizarPadronEnMemoriaConCaja();
        window.refrescarFinanzasSiVisible();
        if (typeof refrescarVistasActivasCDM === "function") {
            refrescarVistasActivasCDM();
        } else if (typeof renderizarPaginaDeporte === "function" && window.deportePagina) {
            renderizarPaginaDeporte();
        }
        if (typeof renderizarCabeceraFichaJugador === "function" && typeof obtenerJugadorActualPorURL === "function") {
            const pAct = obtenerJugadorActualPorURL();
            if (pAct) renderizarCabeceraFichaJugador(pAct);
        }
    }

    // Hooks públicos
    window.hidratarFinanzasDesdeServidorCDM = hidratarFinanzasDesdeServidor;
    window.obtenerMovimientosFinanzasCDM = obtenerMovimientosFinanzas;

    window.cargarFinanzasDesdeEstadoClub = function (movimientos = [], claveClubOpt = null) {
        if (!Array.isArray(movimientos)) return;
        const club = claveClubOpt || clubKeyFin();
        localStorage.setItem(storageKeyFin(club), JSON.stringify(normalizarListaMovimientos(movimientos)));
        finHidratadoPorClub[club] = true;
        finUltimoEstadoSync = "nube";
        sincronizarPadronEnMemoriaConCaja();
        window.refrescarFinanzasSiVisible();
    };

    window.registrarAsientoCuotaEnLibroMayor = function (persona, monto, medio = "Transferencia", fecha = null, nota = "", mesCuotaOpt = null, esParcial = false) {
        if (!persona || !monto) return null;
        const lista = obtenerMovimientosFinanzas();
        const movId = Date.now() + Math.floor(Math.random() * 100);
        const mesC = mesCuotaOpt || mesCuotaActivo();
        const fechaReg = fecha || fechaDefaultParaPeriodo(mesC);
        const tipoTxt = esParcial ? "Pago parcial cuota" : "Cuota";
        const sufijoNota = nota ? ` — ${nota}` : "";
        lista.unshift({
            id: movId,
            fecha: fechaReg,
            mesCuota: mesC,
            tipo: "ingreso",
            rubro: persona.deporte === "Gimnasio" ? "Cuota Gimnasio" : "Cuota Deportes",
            concepto: `${tipoTxt} ${fmtMesCorto(mesC)} • ${persona.apellido}, ${persona.nombre} (${persona.deporte})${sufijoNota}`,
            monto: Math.abs(parseFloat(monto) || 0),
            medio: normalizarMedioPago(medio),
            personaId: persona.id,
            esCuota: true
        });
        guardarMovimientosFinanzas(lista, false, true);
        return movId;
    };

    // Hooks Consultorio Privado (intactos)
    window.sincronizarAsientoConsultorioFinanzas = function (asiento) {
        if (!estadoModulosFin().soloCons) return;
        if (!asiento || !asiento.refKey || !asiento.monto) return;
        const lista = obtenerMovimientosFinanzas();
        const idx = lista.findIndex(m => m.refKey === asiento.refKey);
        const nuevo = {
            id: idx >= 0 ? lista[idx].id : (Date.now() + Math.floor(Math.random() * 999)),
            refKey: asiento.refKey,
            fecha: asiento.fecha || hoyFin(),
            tipo: asiento.tipo || "ingreso",
            rubro: asiento.rubro || "Coseguro / Mutual",
            concepto: asiento.concepto || "Cobro Consultorio",
            monto: Math.abs(parseFloat(asiento.monto) || 0),
            medio: normalizarMedioPago(asiento.medio || "Transferencia"),
            origenConsultorio: true,
            turnoId: asiento.turnoId || null,
            mesTrabajo: asiento.mesTrabajo || ""
        };
        if (idx >= 0) lista[idx] = nuevo;
        else lista.unshift(nuevo);
        guardarMovimientosFinanzas(lista, !finHidratadoPorClub[clubKeyFin()], false);
    };

    window.eliminarAsientoConsultorioFinanzas = function (refKey) {
        if (!refKey) return;
        const lista = obtenerMovimientosFinanzas();
        const filtrada = lista.filter(m => m.refKey !== refKey);
        if (filtrada.length !== lista.length) {
            guardarMovimientosFinanzas(filtrada, !finHidratadoPorClub[clubKeyFin()], false);
        }
    };

    window.reemplazarAsientosConsultorioFinanzas = function (asientosConsultorio = []) {
        if (!estadoModulosFin().soloCons) return;
        const lista = obtenerMovimientosFinanzas();
        const manualesYClub = lista.filter(m => !m.origenConsultorio && !String(m.refKey || "").startsWith("cons_"));
        const baseId = Date.now();
        const nuevos = (asientosConsultorio || []).map((a, idx) => ({
            id: baseId + idx,
            refKey: a.refKey,
            fecha: a.fecha || hoyFin(),
            tipo: a.tipo || "ingreso",
            rubro: a.rubro || "Coseguro / Mutual",
            concepto: a.concepto || "Cobro Consultorio",
            monto: Math.abs(parseFloat(a.monto) || 0),
            medio: normalizarMedioPago(a.medio || "Transferencia"),
            origenConsultorio: true,
            turnoId: a.turnoId || null,
            mesTrabajo: a.mesTrabajo || ""
        }));
        guardarMovimientosFinanzas([...nuevos, ...manualesYClub], !finHidratadoPorClub[clubKeyFin()], false);
    };

    window.refrescarFinanzasSiVisible = function () {
        const sec = document.getElementById("cdmSeccionContabilidadGlobal");
        if (sec && !sec.classList.contains("hidden")) window.renderizarSeccionFinanzas();
    };

    function asegurarModalFinanzas() {
        let m = document.getElementById("modalFinanzasCDM");
        if (!m) {
            m = document.createElement("div");
            m.id = "modalFinanzasCDM";
            m.className = "modal-backdrop hidden";
            document.body.appendChild(m);
        }
        m.style.zIndex = "9999";
        m.onclick = (ev) => { if (ev.target === m) cerrarModalFinanzas(); };
        return m;
    }

    function cerrarModalFinanzas() {
        document.getElementById("modalFinanzasCDM")?.classList.add("hidden");
    }

    window.cerrarModalFinanzasCDM = cerrarModalFinanzas;

    function calcularResumenFinanzas(mesYM) {
        const todosMovs = obtenerMovimientosFinanzas();
        const delMes = mesYM === "TODOS" ? todosMovs : todosMovs.filter(m => String(m.fecha || "").startsWith(mesYM));

        const cajas = {};
        MEDIOS_PAGO_FIN.forEach(mp => { cajas[mp.clave] = { ing: 0, egr: 0, neto: 0 }; });

        let ingresos = 0, ingresosCuotas = 0, ingresosOtros = 0, egresos = 0, cantEgresos = 0;
        delMes.forEach(m => {
            const val = Number(m.monto) || 0;
            const med = normalizarMedioPago(m.medio);
            if (!cajas[med]) cajas[med] = { ing: 0, egr: 0, neto: 0 };
            if (m.tipo === "ingreso") {
                ingresos += val;
                if (esMovimientoDeCuota(m)) ingresosCuotas += val;
                else ingresosOtros += val;
                cajas[med].ing += val;
                cajas[med].neto += val;
            } else {
                egresos += val;
                cantEgresos++;
                cajas[med].egr += val;
                cajas[med].neto -= val;
            }
        });

        const { soloCons } = estadoModulosFin();
        const mesC = mesYM === "TODOS" ? mesActualFin() : mesYM;
        const activos = (typeof basePersonas !== "undefined" ? basePersonas : []).filter(p => p && p.activo);

        let totalEsperadoCuotas = 0, totalCobradoCuotas = 0, totalPendienteCuotas = 0;
        let cantAlDia = 0, cantParcial = 0, cantImpago = 0, cantBecado = 0;

        const estadosPersonas = activos.map(p => {
            const st = calcularEstadoCuotaPersona(p, mesC, todosMovs);
            totalEsperadoCuotas += st.cuota;
            totalCobradoCuotas += st.pagado;
            totalPendienteCuotas += st.saldo;
            if (st.estado === "aldia") cantAlDia++;
            else if (st.estado === "becado") cantBecado++;
            else if (st.estado === "parcial") cantParcial++;
            else cantImpago++;
            return { persona: p, ...st };
        });

        const pctCobranza = totalEsperadoCuotas > 0
            ? Math.min(100, Math.round((totalCobradoCuotas / totalEsperadoCuotas) * 100))
            : 0;

        const pendCons = soloCons && typeof window.calcularResumenPendienteConsultorio17 === "function"
            ? window.calcularResumenPendienteConsultorio17()
            : { pendTotal: 0, pendCoseg: 0, pendOS: 0, sesionesPend: 0, faltanTokens: 0 };

        return {
            delMes, ingresos, ingresosCuotas, ingresosOtros, egresos, cantEgresos, neto: ingresos - egresos, cajas,
            activos, estadosPersonas, mesCuota: mesC,
            totalEsperadoCuotas, totalCobradoCuotas, totalPendienteCuotas,
            cantAlDia: cantAlDia + cantBecado, cantParcial, cantImpago, pctCobranza,
            pendienteCobrar: soloCons ? pendCons.pendTotal : totalPendienteCuotas,
            pendienteCant: soloCons ? pendCons.sesionesPend : (cantImpago + cantParcial),
            pendCons
        };
    }

    // =====================================================================
    // 3. APERTURA DEL MÓDULO
    // =====================================================================
    window.abrirModuloContabilidadIndependienteCDM = function (tabOpt = null) {
        inyectarCSSFinanzasPro();
        const { soloCons } = estadoModulosFin();
        if (tabOpt) window._finState.tab = tabOpt;
        else if (soloCons && window._finState.tab === "cuotas") window._finState.tab = "resumen";

        if (typeof alternarSidebarMovil === "function") alternarSidebarMovil(true);

        const main = document.querySelector(".app-content");
        if (!main) return;

        document.body?.setAttribute("data-finanzas-abierta", "1");
        document.querySelectorAll(".app-sidebar .side-link").forEach(l => l.classList.toggle("active", l.dataset.nav === "contabilidad"));
        Array.from(main.children).forEach(ch => { if (ch.id !== "cdmSeccionContabilidadGlobal") ch.classList.add("hidden"); });

        let sec = document.getElementById("cdmSeccionContabilidadGlobal");
        if (!sec) {
            sec = document.createElement("section");
            sec.id = "cdmSeccionContabilidadGlobal";
            sec.className = "animate-in";
            main.appendChild(sec);
        }
        sec.classList.remove("hidden");

        const h2 = document.querySelector(".topbar-title h2");
        if (h2) {
            h2.innerHTML = soloCons
                ? `💰 Caja y Finanzas <span class="cat-active-pill">Consultorio y Mutuales</span>`
                : `💰 Caja y Finanzas <span class="cat-active-pill">Cuotas y Tesorería</span>`;
        }

        if (soloCons && finHidratadoPorClub[clubKeyFin()] && typeof window.reconstruirAsientosConsultorioEnCaja17 === "function") {
            window.reconstruirAsientosConsultorioEnCaja17();
        }

        sincronizarPadronEnMemoriaConCaja();
        window.renderizarSeccionFinanzas();
        window.scrollTo({ top: 0, behavior: "smooth" });

        hidratarFinanzasDesdeServidor(true).then(() => {
            if (soloCons && typeof window.reconstruirAsientosConsultorioEnCaja17 === "function") {
                window.reconstruirAsientosConsultorioEnCaja17();
            }
            window.refrescarFinanzasSiVisible();
        });
    };

    document.addEventListener("click", (e) => {
        const nav = e.target.closest('.app-sidebar .side-link, #cdmBottomNav38 a, #cdmBottomNav38 button');
        if (nav && nav.dataset.nav !== "contabilidad" && !String(nav.getAttribute("onclick") || "").includes("abrirModuloContabilidad")) {
            document.body?.removeAttribute("data-finanzas-abierta");
        }
    });

    window.cambiarTabFinanzas = function (t) {
        window._finState.tab = t;
        window.renderizarSeccionFinanzas();
    };

    window.finSetRapidoTipo = function (tipo) {
        window._finState.rapidoTipo = tipo;
        const { soloCons } = estadoModulosFin();
        const rubros = tipo === "egreso"
            ? (soloCons ? RUBROS_EGRESO_CONS : RUBROS_EGRESO)
            : (soloCons ? RUBROS_INGRESO_CONS : RUBROS_INGRESO_GENERAL);
        const sel = document.getElementById("finRubro");
        if (sel) sel.innerHTML = rubros.map(r => `<option>${escFin(r)}</option>`).join("");
        const inpTipo = document.getElementById("finTipo");
        if (inpTipo) inpTipo.value = tipo;
        document.getElementById("btnRapTipoIng")?.classList.toggle("is-ing", tipo === "ingreso");
        document.getElementById("btnRapTipoEgr")?.classList.toggle("is-egr", tipo === "egreso");
        const btnSub = document.getElementById("btnRapSubmit");
        if (btnSub) btnSub.textContent = tipo === "ingreso" ? "💾 Guardar Ingreso (+)" : "💾 Guardar Gasto (-)";
    };

    window.finSetRapidoMedio = function (medio, btnEl) {
        window._finState.rapidoMedio = medio;
        const inp = document.getElementById("finMedio");
        if (inp) inp.value = medio;
        document.querySelectorAll(".fin-rap-medio").forEach(b => b.classList.toggle("active", b === btnEl));
    };

    window.guardarMovimientoFinanzas = function (e) {
        e.preventDefault();
        const fecha = document.getElementById("finFecha").value || fechaDefaultParaPeriodo();
        const tipo = document.getElementById("finTipo").value || "egreso";
        const rubro = document.getElementById("finRubro").value;
        const concepto = document.getElementById("finConcepto").value.trim();
        const monto = parseFloat(document.getElementById("finMonto").value);
        const medio = normalizarMedioPago(document.getElementById("finMedio").value || "Efectivo");

        if (!concepto || isNaN(monto) || monto <= 0) {
            toastFin("⚠️ Ingresá un detalle y un monto mayor a $0.");
            return;
        }

        const lista = obtenerMovimientosFinanzas();
        lista.unshift({ id: Date.now(), fecha, tipo, rubro, concepto, monto, medio });
        guardarMovimientosFinanzas(lista, false, true);
        if (typeof registrarAuditoriaCDM === "function") {
            registrarAuditoriaCDM(tipo === "ingreso" ? "CAJA_INGRESO" : "CAJA_EGRESO", `${rubro}: ${concepto} (${fmtPesos(monto)} • ${medio})`);
        }

        // Si el movimiento cae en otro mes distinto al filtrado, avisar o alinear período para que lo vea al instante
        const mesMov = String(fecha).slice(0, 7);
        if (window._finState.mes !== "TODOS" && window._finState.mes !== mesMov) {
            window._finState.mes = mesMov;
        }

        toastFin(tipo === "ingreso" ? `💵 Ingreso guardado en ${medio} (${fmtPesos(monto)})` : `📤 Gasto guardado en ${medio} (${fmtPesos(monto)})`);
        window.renderizarSeccionFinanzas();
    };

    // =====================================================================
    // 4. MODAL UNIFICADO DE COBRO (TOTAL O PARCIAL) + ANULAR ARRIBA DE TODO
    // =====================================================================
    function construirSelectorMediosHTML(inputId, medioActual) {
        const medNorm = normalizarMedioPago(medioActual || "Transferencia");
        return `
            <input type="hidden" id="${inputId}" value="${escFin(medNorm)}">
            <div style="display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:0.45rem; margin-top:4px;">
                ${MEDIOS_PAGO_FIN.map(mp => {
                    const activo = mp.clave === medNorm;
                    return `
                        <button type="button" class="btn ${activo ? "btn-primary" : "btn-ghost"} btn-sm fin-medio-opt"
                            data-target="${inputId}" data-medio="${escFin(mp.clave)}"
                            style="justify-content:center; min-height:40px; font-weight:800;"
                            onclick="seleccionarMedioCobroFinanzas(this)">
                            ${mp.icono} ${mp.clave}
                        </button>
                    `;
                }).join("")}
            </div>
        `;
    }

    window.seleccionarMedioCobroFinanzas = function (btnEl) {
        const medio = btnEl?.dataset?.medio || "Transferencia";
        const targetId = btnEl?.dataset?.target || "finCobroMedio";
        const inp = document.getElementById(targetId);
        if (inp) inp.value = medio;
        document.querySelectorAll(`#modalFinanzasCDM .fin-medio-opt[data-target="${targetId}"]`).forEach(b => {
            const esEste = b === btnEl;
            b.classList.toggle("btn-primary", esEste);
            b.classList.toggle("btn-ghost", !esEste);
        });
    };

    window.finSetMontoCobroRapido = function (monto) {
        const inp = document.getElementById("finCobroMonto");
        if (inp) {
            inp.value = Math.max(0, Math.round(Number(monto) || 0));
            actualizarPreviewSaldoCobro();
        }
    };

    window.actualizarPreviewSaldoCobro = function () {
        const box = document.getElementById("finCobroSaldoPreview");
        const inp = document.getElementById("finCobroMonto");
        if (!box || !inp) return;
        const saldoActual = Number(box.dataset.saldo || 0);
        const paga = parseFloat(inp.value) || 0;
        if (paga <= 0) {
            box.innerHTML = `Ingresá el monto que abona hoy.`;
            return;
        }
        const queda = saldoActual - paga;
        if (queda > 0) {
            box.innerHTML = `🟡 <b>Pago Parcial:</b> entra <b>${fmtPesos(paga)}</b> a Caja y le queda un saldo de <b style="color:#d97706;">${fmtPesos(queda)}</b>.`;
        } else if (queda === 0) {
            box.innerHTML = `🟢 <b>Pago Total:</b> entra <b>${fmtPesos(paga)}</b> a Caja, cancela el mes y pasa a <b>Al Día</b>.`;
        } else {
            box.innerHTML = `🟢 <b>Entra ${fmtPesos(paga)} a Caja</b> (supera el saldo base por ${fmtPesos(Math.abs(queda))}).`;
        }
    };

    window.cobrarCuotaRapidaFinanzas = function (idPersona, mesOpt = null) {
        const p = (typeof basePersonas !== "undefined" ? basePersonas : []).find(x => Number(x.id) === Number(idPersona));
        if (!p) return;

        const mesC = mesOpt || mesCuotaActivo();
        const info = calcularEstadoCuotaPersona(p, mesC);
        const montoSugerido = info.saldo > 0 ? info.saldo : (info.cuota || 25000);
        const mitad = Math.round(montoSugerido / 2);
        const fechaDef = fechaDefaultParaPeriodo(mesC);
        const modal = asegurarModalFinanzas();

        const bloqueAnularHTML = info.pagos.length > 0 ? `
            <div style="background:rgba(239,68,68,0.07); border:1.5px solid rgba(239,68,68,0.38); border-radius:14px; padding:0.75rem 0.85rem; margin-bottom:0.85rem;">
                <strong style="font-size:0.8rem; color:#dc2626; display:block; margin-bottom:0.45rem;">
                    🧾 Pagos registrados en ${escFin(fmtMesCorto(mesC))} (podés corregir o anular):
                </strong>
                <div style="display:flex; flex-direction:column; gap:0.4rem;">
                    ${info.pagos.map(m => `
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.45rem; flex-wrap:wrap; background:var(--surface-solid, #fff); border:1px solid var(--line, #e2e8f0); border-radius:10px; padding:0.5rem 0.65rem; font-size:0.78rem;">
                            <div>
                                <b>${fmtPesos(m.monto)}</b> • <span class="badge badge-celeste" style="font-size:0.65rem;">${escFin(m.medio)}</span>
                                <small style="display:block; color:var(--ink-500);">${escFin(m.fecha)}</small>
                            </div>
                            <div style="display:flex; gap:0.3rem;">
                                <button type="button" class="btn btn-secondary btn-sm" style="min-height:30px; font-size:0.73rem;" onclick="abrirModalEditarMovimientoFinanzas(${m.id})">✏️ Editar</button>
                                <button type="button" class="btn btn-danger btn-sm" style="min-height:30px; font-size:0.73rem; font-weight:800;" onclick="anularPagoEspecificoPersona(${p.id}, ${m.id}, '${escFin(mesC)}')">↩️ Anular Pago</button>
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>
        ` : "";

        const formPagoHTML = `
            <form onsubmit="confirmarCobroCuotaModalFinanzas(event, ${p.id}, '${escFin(mesC)}')">
                <div class="grid-2" style="margin-bottom:0.65rem;">
                    <div class="field">
                        <label>Monto que paga hoy ($) *</label>
                        <input type="number" id="finCobroMonto" min="1" step="any" inputmode="decimal" required value="${montoSugerido}"
                            style="font-weight:800; font-size:1.05rem;" oninput="actualizarPreviewSaldoCobro()">
                        <div class="fin-quick-amts">
                            ${info.saldo > 0 ? `<button type="button" class="fin-quick-amt-btn" onclick="finSetMontoCobroRapido(${info.saldo})">Total (${fmtPesos(info.saldo)})</button>` : ""}
                            ${mitad >= 500 ? `<button type="button" class="fin-quick-amt-btn" onclick="finSetMontoCobroRapido(${mitad})">50% (${fmtPesos(mitad)})</button>` : ""}
                        </div>
                    </div>
                    <div class="field">
                        <label>Fecha de Pago *</label>
                        <input type="date" id="finCobroFecha" value="${fechaDef}" required>
                    </div>
                </div>

                <div id="finCobroSaldoPreview" data-saldo="${info.saldo}" style="background:var(--surface-subtle); border:1px solid var(--line); border-radius:10px; padding:0.48rem 0.7rem; font-size:0.77rem; margin-bottom:0.75rem;"></div>

                <div class="field" style="margin-bottom:0.75rem;">
                    <label>¿Cómo pagó? *</label>
                    ${construirSelectorMediosHTML("finCobroMedio", p.ultimoPagoMedio || "Transferencia")}
                </div>

                <div class="field" style="margin-bottom:0.75rem;">
                    <label>Nota / Comprobante (opcional)</label>
                    <input type="text" id="finCobroNota" placeholder="Ej: Seña / Transferencia Banco Nación...">
                </div>

                <label style="display:flex; align-items:center; gap:0.45rem; font-size:0.8rem; font-weight:700; margin-bottom:0.85rem; cursor:pointer;">
                    <input type="checkbox" id="finCobroEnviarWA" style="width:17px; height:17px; min-height:auto;">
                    <span>📲 Enviar recibo por WhatsApp al confirmar</span>
                </label>

                <div style="display:flex; gap:0.45rem; justify-content:flex-end;">
                    <button type="button" class="btn btn-ghost" onclick="cerrarModalFinanzasCDM()">Cancelar</button>
                    <button type="submit" class="btn btn-ok" style="flex:1;">✓ Registrar Pago en Caja</button>
                </div>
            </form>
        `;

        modal.innerHTML = `
            <div class="modal-window" style="max-width:520px;">
                <div class="modal-top">
                    <div>
                        <span class="badge ${info.estado === "aldia" || info.estado === "becado" ? "badge-ok" : (info.estado === "parcial" ? "badge-warn" : "badge-celeste")}">
                            💳 CUENTA CORRIENTE • ${escFin(fmtMesCorto(mesC))}
                        </span>
                        <h3 style="margin-top:4px;">${escFin(p.apellido)}, ${escFin(p.nombre)}</h3>
                        <small style="color:var(--ink-500); font-size:0.75rem;">${escFin(p.deporte)}${p.deporte !== "Gimnasio" && p.categoria ? ` • ${escFin(p.categoria)}` : ""}</small>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalFinanzasCDM()">✕</button>
                </div>

                <div class="fin-cc-summary">
                    <div><small>Cuota del Mes</small><strong>${info.estado === "becado" ? "Becado ($0)" : fmtPesos(info.cuota)}</strong></div>
                    <div><small>Ya Pagó (en Caja)</small><strong style="color:var(--ok);">${fmtPesos(info.pagado)}</strong></div>
                    <div><small>Le Falta Pagar</small><strong style="color:${info.saldo > 0 ? "var(--err)" : "var(--ok)"};">${fmtPesos(info.saldo)}</strong></div>
                </div>

                ${bloqueAnularHTML}

                ${(info.estado === "aldia" || info.estado === "becado") ? `
                    <details style="background:var(--surface-subtle); border:1px solid var(--line); border-radius:12px; padding:0.6rem 0.75rem;">
                        <summary style="cursor:pointer; font-size:0.8rem; font-weight:800; color:var(--ink-700);">
                            ➕ Registrar un pago adicional en ${escFin(fmtMesCorto(mesC))}
                        </summary>
                        <div style="margin-top:0.75rem;">${formPagoHTML}</div>
                    </details>
                ` : formPagoHTML}
            </div>
        `;
        modal.classList.remove("hidden");
        actualizarPreviewSaldoCobro();
    };

    window.abrirModalGestionPagoCuota = window.cobrarCuotaRapidaFinanzas;

    window.confirmarCobroCuotaModalFinanzas = function (e, idPersona, mesCuotaStr) {
        e.preventDefault();
        const p = (typeof basePersonas !== "undefined" ? basePersonas : []).find(x => Number(x.id) === Number(idPersona));
        if (!p) return;

        const val = parseFloat(document.getElementById("finCobroMonto")?.value) || 0;
        const fecha = document.getElementById("finCobroFecha")?.value || fechaDefaultParaPeriodo(mesCuotaStr);
        const medio = normalizarMedioPago(document.getElementById("finCobroMedio")?.value || "Transferencia");
        const nota = (document.getElementById("finCobroNota")?.value || "").trim();
        const mandarWA = Boolean(document.getElementById("finCobroEnviarWA")?.checked);
        if (val <= 0) return;

        const infoAntes = calcularEstadoCuotaPersona(p, mesCuotaStr);
        const esParcial = (infoAntes.pagado + val) < infoAntes.cuota;

        const movId = registrarAsientoCuotaEnLibroMayor(p, val, medio, fecha, nota, mesCuotaStr, esParcial);
        if (!Array.isArray(p.historialPagos)) p.historialPagos = [];
        p.historialPagos.push({ id: Date.now(), movId, fecha, mesCuota: mesCuotaStr, monto: val, medio, nota });
        sincronizarEstadoPersonaConCaja(p);

        if (typeof guardarDatosCDM === "function") guardarDatosCDM();
        if (typeof registrarAuditoriaCDM === "function") {
            registrarAuditoriaCDM(esParcial ? "COBRO_PARCIAL" : "COBRO_CUOTA", `${p.apellido}, ${p.nombre} • ${fmtPesos(val)} (${medio} • ${fmtMesCorto(mesCuotaStr)})`);
        }

        cerrarModalFinanzas();
        const infoDesp = calcularEstadoCuotaPersona(p, mesCuotaStr);
        toastFin(infoDesp.saldo > 0
            ? `🟡 Pago parcial ingresado en ${medio} (${fmtPesos(val)}). Le falta ${fmtPesos(infoDesp.saldo)}.`
            : `✅ Cuota de ${p.apellido} cobrada en ${medio} (${fmtPesos(val)}).`);
        refrescarTodaUIPagos();
        if (mandarWA) enviarCobroConAliasWA(p.id, mesCuotaStr);
    };

    window.anularPagoEspecificoPersona = function (idPersona, idMov, mesCuotaStr) {
        const p = (typeof basePersonas !== "undefined" ? basePersonas : []).find(x => Number(x.id) === Number(idPersona));
        const lista = obtenerMovimientosFinanzas();
        const mov = lista.find(m => Number(m.id) === Number(idMov));
        if (!mov) return;

        guardarMovimientosFinanzas(lista.filter(m => Number(m.id) !== Number(idMov)), false, true);
        if (p) {
            if (Array.isArray(p.historialPagos)) {
                p.historialPagos = p.historialPagos.filter(h => Number(h.movId) !== Number(idMov));
            }
            sincronizarEstadoPersonaConCaja(p);
            if (typeof guardarDatosCDM === "function") guardarDatosCDM();
            if (typeof registrarAuditoriaCDM === "function") {
                registrarAuditoriaCDM("ANULAR_COBRO", `${p.apellido}, ${p.nombre} • Descontado ${fmtPesos(mov.monto)} de Caja`);
            }
        }
        toastFin(`↩️ Pago de ${fmtPesos(mov.monto)} anulado y descontado de Caja.`);
        refrescarTodaUIPagos();
        if (p) cobrarCuotaRapidaFinanzas(p.id, mesCuotaStr);
    };

    window.abrirModalEditarMovimientoFinanzas = function (idMov) {
        const lista = obtenerMovimientosFinanzas();
        const mov = lista.find(m => Number(m.id) === Number(idMov));
        if (!mov) return;

        const { soloCons } = estadoModulosFin();
        const rubros = mov.tipo === "egreso"
            ? (soloCons ? RUBROS_EGRESO_CONS : RUBROS_EGRESO)
            : (soloCons ? RUBROS_INGRESO_CONS : ["Cuota Gimnasio", "Cuota Deportes", ...RUBROS_INGRESO_GENERAL]);
        const listaRubros = rubros.includes(mov.rubro) ? rubros : [mov.rubro, ...rubros];

        const modal = asegurarModalFinanzas();
        modal.innerHTML = `
            <div class="modal-window" style="max-width:500px;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-celeste">✏️ EDITAR MOVIMIENTO</span>
                        <h3 style="margin-top:4px;">Corregir Asiento</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalFinanzasCDM()">✕</button>
                </div>

                <form onsubmit="guardarEdicionMovimientoLibroMayor(event, ${mov.id})">
                    <div class="grid-3" style="margin-bottom:0.7rem;">
                        <div class="field"><label>Fecha *</label><input type="date" id="emFecha" value="${escFin(mov.fecha)}" required></div>
                        <div class="field"><label>Tipo</label>
                            <select id="emTipo">
                                <option value="ingreso" ${mov.tipo === "ingreso" ? "selected" : ""}>🟢 Entró (+)</option>
                                <option value="egreso" ${mov.tipo === "egreso" ? "selected" : ""}>🔴 Salió (-)</option>
                            </select>
                        </div>
                        <div class="field"><label>Monto ($) *</label><input type="number" id="emMonto" min="1" step="any" inputmode="decimal" required value="${mov.monto}"></div>
                    </div>

                    <div class="field" style="margin-bottom:0.7rem;">
                        <label>Categoría</label>
                        <select id="emRubro">${listaRubros.map(r => `<option ${r === mov.rubro ? "selected" : ""}>${escFin(r)}</option>`).join("")}</select>
                    </div>

                    <div class="field" style="margin-bottom:0.75rem;">
                        <label>Detalle *</label>
                        <input type="text" id="emConcepto" required value="${escFin(mov.concepto)}">
                    </div>

                    <div class="field" style="margin-bottom:0.9rem;">
                        <label>Medio de Pago *</label>
                        ${construirSelectorMediosHTML("emMedio", mov.medio)}
                    </div>

                    <div style="display:flex; gap:0.45rem; justify-content:flex-end;">
                        <button type="button" class="btn btn-ghost" onclick="cerrarModalFinanzasCDM()">Cancelar</button>
                        <button type="submit" class="btn btn-primary" style="flex:1;">💾 Guardar Cambios</button>
                    </div>
                </form>
            </div>
        `;
        modal.classList.remove("hidden");
    };

    window.guardarEdicionMovimientoLibroMayor = function (e, idMov) {
        e.preventDefault();
        const lista = obtenerMovimientosFinanzas();
        const mov = lista.find(m => Number(m.id) === Number(idMov));
        if (!mov) return;

        const monto = parseFloat(document.getElementById("emMonto")?.value) || 0;
        const concepto = (document.getElementById("emConcepto")?.value || "").trim();
        if (!concepto || monto <= 0) return;

        mov.fecha = document.getElementById("emFecha")?.value || mov.fecha;
        mov.tipo = document.getElementById("emTipo")?.value || mov.tipo;
        mov.rubro = document.getElementById("emRubro")?.value || mov.rubro;
        mov.concepto = concepto;
        mov.monto = monto;
        mov.medio = normalizarMedioPago(document.getElementById("emMedio")?.value || mov.medio);

        guardarMovimientosFinanzas(lista, false, true);

        if (mov.personaId && typeof basePersonas !== "undefined") {
            const p = basePersonas.find(x => Number(x.id) === Number(mov.personaId));
            if (p) {
                sincronizarEstadoPersonaConCaja(p);
                if (typeof guardarDatosCDM === "function") guardarDatosCDM();
            }
        }

        if (typeof registrarAuditoriaCDM === "function") {
            registrarAuditoriaCDM("CAJA_EDITAR", `${mov.concepto} (${fmtPesos(mov.monto)} • ${mov.medio})`);
        }
        cerrarModalFinanzas();
        toastFin("✏️ Movimiento actualizado y saldos recalculados.");
        refrescarTodaUIPagos();
    };

    window.eliminarMovimientoFinanzas = function (idMov) {
        const lista = obtenerMovimientosFinanzas();
        const mov = lista.find(m => Number(m.id) === Number(idMov));
        if (!mov) return;

        const modal = asegurarModalFinanzas();
        modal.innerHTML = `
            <div class="modal-window" style="max-width:440px;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-danger">🗑️ ELIMINAR MOVIMIENTO</span>
                        <h3 style="margin-top:4px;">¿Borrar de la Caja?</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalFinanzasCDM()">✕</button>
                </div>

                <div style="background:var(--surface-subtle); border:1px solid var(--line); border-radius:12px; padding:0.75rem 0.9rem; margin-bottom:0.85rem; font-size:0.83rem;">
                    <div><b>${escFin(mov.concepto)}</b></div>
                    <small style="color:var(--ink-500);">${escFin(mov.fecha)} • ${escFin(mov.rubro)} • ${escFin(mov.medio)} • <b>${fmtPesos(mov.monto)}</b></small>
                </div>

                <div style="display:flex; gap:0.45rem; justify-content:flex-end;">
                    <button type="button" class="btn btn-ghost" onclick="cerrarModalFinanzasCDM()">Cancelar</button>
                    <button type="button" class="btn btn-danger" onclick="confirmarEliminarMovimientoFinanzas(${mov.id})">🗑️ Sí, Eliminar</button>
                </div>
            </div>
        `;
        modal.classList.remove("hidden");
    };

    window.confirmarEliminarMovimientoFinanzas = function (idMov) {
        const lista = obtenerMovimientosFinanzas();
        const target = lista.find(m => Number(m.id) === Number(idMov));
        guardarMovimientosFinanzas(lista.filter(m => Number(m.id) !== Number(idMov)), false, true);

        if (target?.personaId && typeof basePersonas !== "undefined") {
            const p = basePersonas.find(x => Number(x.id) === Number(target.personaId));
            if (p) {
                sincronizarEstadoPersonaConCaja(p);
                if (typeof guardarDatosCDM === "function") guardarDatosCDM();
            }
        }

        if (target && typeof registrarAuditoriaCDM === "function") {
            registrarAuditoriaCDM("CAJA_ELIMINAR", `${target.concepto} (${fmtPesos(target.monto)})`);
        }
        cerrarModalFinanzas();
        toastFin("🗑️ Movimiento eliminado y saldos recalculados.");
        refrescarTodaUIPagos();
    };

    window.exportarLibroMayorCSV = function () {
        const st = window._finState;
        const { delMes } = calcularResumenFinanzas(st.mes);
        if (!delMes.length) {
            toastFin("ℹ️ No hay movimientos en este período para exportar.");
            return;
        }
        let csv = "Fecha;Tipo;Categoria;Detalle;Medio;Monto\n";
        delMes.forEach(m => {
            csv += `${m.fecha};${m.tipo.toUpperCase()};${m.rubro};"${String(m.concepto).replace(/"/g, '""')}";${m.medio};${m.tipo === "egreso" ? -m.monto : m.monto}\n`;
        });
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `caja_${st.mes}_${clubKeyFin()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toastFin("📊 Excel CSV descargado.");
    };

    // =====================================================================
    // 5. RENDER PRINCIPAL (GLOBAL EN window PARA TODOS LOS FILTROS)
    // =====================================================================
    window.renderizarSeccionFinanzas = function renderizarSeccionFinanzas() {
        const sec = document.getElementById("cdmSeccionContabilidadGlobal");
        if (!sec) return;

        const activeId = document.activeElement?.id || "";
        const selStart = typeof document.activeElement?.selectionStart === "number" ? document.activeElement.selectionStart : null;

        const { soloCons } = estadoModulosFin();
        const st = window._finState;
        if (soloCons && st.tab === "cuotas") st.tab = "cobranzas_cons";
        if (!soloCons && st.tab === "cobranzas_cons") st.tab = "cuotas";

        const res = calcularResumenFinanzas(st.mes);
        const rubIng = soloCons ? RUBROS_INGRESO_CONS : RUBROS_INGRESO_GENERAL;
        const rubEgr = soloCons ? RUBROS_EGRESO_CONS : RUBROS_EGRESO;
        const rubAct = st.rapidoTipo === "egreso" ? rubEgr : rubIng;
        const ultRev = obtenerUltimoAumentoReversibleFin();

        const tabsHTML = soloCons ? `
            <div class="module-tabs tabs-3" style="margin-bottom:1rem;">
                <button type="button" class="mod-tab ${st.tab === "resumen" ? "active" : ""}" onclick="cambiarTabFinanzas('resumen')"><i class="ri-safe-2-line"></i><span>Resumen y Cajas</span></button>
                <button type="button" class="mod-tab ${st.tab === "cobranzas_cons" ? "active" : ""}" onclick="cambiarTabFinanzas('cobranzas_cons')"><i class="ri-hospital-line"></i><span>Cobranzas y Mutuales (${res.pendCons.sesionesPend})</span></button>
                <button type="button" class="mod-tab ${st.tab === "libro" ? "active" : ""}" onclick="cambiarTabFinanzas('libro')"><i class="ri-list-check-2"></i><span>Movimientos (${res.delMes.length})</span></button>
            </div>
        ` : `
            <div class="module-tabs tabs-3" style="margin-bottom:1rem;">
                <button type="button" class="mod-tab ${st.tab === "cuotas" ? "active" : ""}" onclick="cambiarTabFinanzas('cuotas')"><i class="ri-group-line"></i><span>Cobrar Cuotas (${res.pendienteCant} pend.)</span></button>
                <button type="button" class="mod-tab ${st.tab === "resumen" ? "active" : ""}" onclick="cambiarTabFinanzas('resumen')"><i class="ri-safe-2-line"></i><span>Cajas y Gastos</span></button>
                <button type="button" class="mod-tab ${st.tab === "libro" ? "active" : ""}" onclick="cambiarTabFinanzas('libro')"><i class="ri-list-check-2"></i><span>Movimientos (${res.delMes.length})</span></button>
            </div>
        `;

        sec.innerHTML = `
            <div class="fin-top-bar">
                <div class="fin-period-group">
                    <label style="font-size:0.78rem; font-weight:800; color:var(--ink-700);">📅 Mes:</label>
                    <input type="month" value="${st.mes === "TODOS" ? mesActualFin() : st.mes}" style="width:auto; min-height:36px;" onchange="window._finState.mes=this.value; renderizarSeccionFinanzas();">
                    <button type="button" class="btn ${st.mes === "TODOS" ? "btn-primary" : "btn-ghost"} btn-sm" onclick="window._finState.mes='TODOS'; renderizarSeccionFinanzas();">Ver Todo</button>
                    <span id="finBadgeSyncNube" class="badge badge-celeste" style="font-size:0.68rem;">☁️ Sincronizando...</span>
                </div>
                <div class="fin-actions-group">
                    ${soloCons
                        ? `<button type="button" class="btn btn-ok btn-sm" onclick="if(typeof abrirModalLiquidacionMasiva17==='function') abrirModalLiquidacionMasiva17('TODAS');">💰 Liquidar Mutual</button>
                           <button type="button" class="btn btn-secondary btn-sm" onclick="abrirModalAumentoMasivoCuotas()">🏦 Alias WA</button>`
                        : `<button type="button" class="btn btn-secondary btn-sm" onclick="abrirModalAumentoMasivoCuotas()">🏷️ Tarifario y Ajustes</button>`}
                    <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalCierreCaja25()">💵 Cierre del Día</button>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="exportarLibroMayorCSV()">📊 Excel</button>
                </div>
            </div>

            <section class="bento-kpis" style="margin-bottom:0.85rem;">
                <div class="bento-kpi">
                    <div class="kpi-icon ok"><i class="ri-arrow-down-circle-fill"></i></div>
                    <div class="kpi-data">
                        <span>Ingresos Cobrados</span>
                        <strong>${fmtPesos(res.ingresos)}</strong>
                        ${!soloCons ? `<small class="fin-kpi-sub">Cuotas: ${fmtPesos(res.ingresosCuotas)} • Otros: ${fmtPesos(res.ingresosOtros)}</small>` : ""}
                    </div>
                </div>
                <div class="bento-kpi">
                    <div class="kpi-icon warn"><i class="ri-arrow-up-circle-fill"></i></div>
                    <div class="kpi-data">
                        <span>Gastos</span>
                        <strong>${fmtPesos(res.egresos)}</strong>
                        <small class="fin-kpi-sub">${res.cantEgresos} egreso(s) en el período</small>
                    </div>
                </div>
                <div class="bento-kpi">
                    <div class="kpi-icon purple"><i class="ri-scales-3-fill"></i></div>
                    <div class="kpi-data">
                        <span>Saldo Neto en Caja</span>
                        <strong style="color:${res.neto >= 0 ? "var(--ok)" : "var(--err)"};">${fmtPesos(res.neto)}</strong>
                        <small class="fin-kpi-sub">Suma exacta de las 4 cajas</small>
                    </div>
                </div>
                <div class="bento-kpi" style="cursor:pointer;" onclick="cambiarTabFinanzas('${soloCons ? "cobranzas_cons" : "cuotas"}')">
                    <div class="kpi-icon"><i class="ri-error-warning-fill"></i></div>
                    <div class="kpi-data">
                        <span>${soloCons ? `Falta Cobrar (${res.pendienteCant} ses.)` : `Cuotas por Cobrar (${res.pendienteCant})`}</span>
                        <strong>${fmtPesos(res.pendienteCobrar)}</strong>
                        ${!soloCons ? `<small class="fin-kpi-sub">${res.cantImpago} impago(s) • ${res.cantParcial} parcial(es)</small>` : ""}
                    </div>
                </div>
            </section>

            ${!soloCons && res.activos.length > 0 ? `
                <div class="fin-cobranza-progress">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap; font-size:0.78rem;">
                        <span>📊 <b>Cobranza real de ${escFin(fmtMesCorto(res.mesCuota))}:</b> ${res.cantAlDia} Al Día • ${res.cantParcial} Parcial • ${res.cantImpago} Impago</span>
                        <strong style="color:#0369a1;">${res.pctCobranza}% cobrado (${fmtPesos(res.totalCobradoCuotas)} / ${fmtPesos(res.totalEsperadoCuotas)})</strong>
                    </div>
                    <div class="fin-progress-track">
                        <div class="fin-progress-fill" style="width:${res.pctCobranza}%;"></div>
                    </div>
                </div>
            ` : ""}

            ${tabsHTML}
            <div id="finBodyContent"></div>
        `;
        actualizarBadgeSyncFinUI();

        const body = document.getElementById("finBodyContent");
        if (!body) return;

        if (st.tab === "resumen") {
            const ultimos5 = res.delMes.slice(0, 5);
            body.innerHTML = `
                <div class="split-equal">
                    <div class="app-panel">
                        <div class="panel-head">
                            <div>
                                <h3><i class="ri-wallet-3-line"></i> Saldo por Medio de Pago</h3>
                                <small style="color:var(--ink-500); font-size:0.74rem;">Entradas y salidas reales del período (${st.mes === "TODOS" ? "Histórico" : escFin(fmtMesCorto(st.mes))})</small>
                            </div>
                        </div>
                        <div class="fin-cajas-grid">
                            ${MEDIOS_PAGO_FIN.map(mp => {
                                const c = res.cajas[mp.clave] || { ing: 0, egr: 0, neto: 0 };
                                return `
                                    <div class="fin-caja-card" style="border-top-color:${mp.color};">
                                        <span>${mp.icono} ${mp.clave}</span>
                                        <strong>${fmtPesos(c.neto)}</strong>
                                        <div class="fin-caja-sub">
                                            <span style="color:var(--ok);">+${fmtPesos(c.ing)}</span>
                                            <span style="color:var(--err);">-${fmtPesos(c.egr)}</span>
                                        </div>
                                    </div>
                                `;
                            }).join("")}
                        </div>

                        <div style="margin-top:0.95rem; padding-top:0.8rem; border-top:1px solid var(--line);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.45rem;">
                                <strong style="font-size:0.78rem; color:var(--ink-700);">🕒 Últimos movimientos en Caja</strong>
                                ${res.delMes.length > 0 ? `<button type="button" class="btn btn-ghost btn-sm" style="min-height:26px; font-size:0.72rem;" onclick="cambiarTabFinanzas('libro')">Ver todos (${res.delMes.length}) →</button>` : ""}
                            </div>
                            ${ultimos5.length === 0 ? `
                                <small style="color:var(--ink-500); font-size:0.75rem;">Todavía no hay movimientos registrados en este período.</small>
                            ` : `
                                <div style="display:flex; flex-direction:column; gap:0.35rem;">
                                    ${ultimos5.map(m => `
                                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.45rem; background:var(--surface-subtle); border:1px solid var(--line); border-radius:10px; padding:0.42rem 0.65rem; font-size:0.76rem;">
                                            <div style="min-width:0;">
                                                <div style="font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escFin(m.concepto)}</div>
                                                <small style="color:var(--ink-500);">${escFin(m.fecha)} • ${escFin(m.medio)}</small>
                                            </div>
                                            <div style="display:flex; align-items:center; gap:0.35rem; white-space:nowrap;">
                                                <strong style="color:${m.tipo === "ingreso" ? "var(--ok)" : "var(--err)"};">${m.tipo === "ingreso" ? "+" : "-"}${fmtPesos(m.monto)}</strong>
                                                <button type="button" class="btn btn-ghost btn-sm" style="padding:0 5px; min-height:24px;" onclick="abrirModalEditarMovimientoFinanzas(${m.id})" title="Editar">✏️</button>
                                                <button type="button" class="btn btn-ghost btn-sm" style="padding:0 5px; min-height:24px;" onclick="eliminarMovimientoFinanzas(${m.id})" title="Eliminar">🗑️</button>
                                            </div>
                                        </div>
                                    `).join("")}
                                </div>
                            `}
                        </div>
                    </div>

                    <div class="app-panel">
                        <div class="panel-head">
                            <div>
                                <h3><i class="ri-add-circle-line"></i> Anotar Gasto u Otro Ingreso</h3>
                                <small style="color:var(--ink-500); font-size:0.74rem;">${soloCons ? "Alquiler, insumos, matrícula o ingresos varios" : "Para cuotas de personas usá la pestaña <b>Cobrar Cuotas</b>"}</small>
                            </div>
                        </div>
                        <form onsubmit="guardarMovimientoFinanzas(event)">
                            <input type="hidden" id="finTipo" value="${escFin(st.rapidoTipo)}">
                            <input type="hidden" id="finMedio" value="${escFin(st.rapidoMedio)}">

                            <div class="fin-toggle-pair">
                                <button type="button" id="btnRapTipoIng" class="fin-toggle-btn ${st.rapidoTipo === "ingreso" ? "is-ing" : ""}" onclick="finSetRapidoTipo('ingreso')">🟢 Otro Ingreso (+)</button>
                                <button type="button" id="btnRapTipoEgr" class="fin-toggle-btn ${st.rapidoTipo === "egreso" ? "is-egr" : ""}" onclick="finSetRapidoTipo('egreso')">🔴 Gasto (-)</button>
                            </div>

                            <div class="grid-2" style="margin-bottom:0.65rem;">
                                <div class="field"><label>Monto ($) *</label><input type="number" id="finMonto" min="1" step="any" inputmode="decimal" required placeholder="Ej: 15000" style="font-weight:800; font-size:1rem;"></div>
                                <div class="field"><label>Fecha</label><input type="date" id="finFecha" value="${fechaDefaultParaPeriodo()}" required></div>
                            </div>

                            <div class="grid-2" style="margin-bottom:0.65rem;">
                                <div class="field"><label>Categoría</label><select id="finRubro">${rubAct.map(r => `<option>${escFin(r)}</option>`).join("")}</select></div>
                                <div class="field"><label>Detalle *</label><input type="text" id="finConcepto" required placeholder="${soloCons ? "Ej: Alquiler / Insumos" : "Ej: Pago luz / Compra pelotas / Venta"}"></div>
                            </div>

                            <div class="field" style="margin-bottom:0.85rem;">
                                <label>Medio de Pago</label>
                                <div class="fin-medios-grid" style="margin-top:3px;">
                                    ${MEDIOS_PAGO_FIN.map(mp => `
                                        <button type="button" class="fin-medio-chip fin-rap-medio ${st.rapidoMedio === mp.clave ? "active" : ""}" onclick="finSetRapidoMedio('${escFin(mp.clave)}', this)">
                                            ${mp.icono} ${mp.clave}
                                        </button>
                                    `).join("")}
                                </div>
                            </div>

                            <button type="submit" id="btnRapSubmit" class="btn btn-primary" style="width:100%;">
                                ${st.rapidoTipo === "ingreso" ? "💾 Guardar Ingreso (+)" : "💾 Guardar Gasto (-)"}
                            </button>
                        </form>
                    </div>
                </div>
            `;
        } else if (st.tab === "libro") {
            const filtrados = res.delMes.filter(m => {
                if (st.filtroTipo !== "TODOS" && m.tipo !== st.filtroTipo) return false;
                if (st.filtroMedio !== "TODOS" && normalizarMedioPago(m.medio) !== st.filtroMedio) return false;
                if (st.busq && !`${m.concepto} ${m.rubro} ${m.medio}`.toLowerCase().includes(st.busq.toLowerCase())) return false;
                return true;
            });

            body.innerHTML = `
                <div class="app-panel">
                    <div class="filter-strip" style="grid-template-columns:1fr auto auto; margin-bottom:0.85rem;">
                        <div class="search-box"><i class="ri-search-line"></i><input type="text" id="finBusqMovs" value="${escFin(st.busq)}" placeholder="Buscar por persona, detalle o categoría..." oninput="window._finState.busq=this.value; renderizarSeccionFinanzas();"></div>
                        <select onchange="window._finState.filtroTipo=this.value; renderizarSeccionFinanzas();" style="width:auto;">
                            <option value="TODOS" ${st.filtroTipo === "TODOS" ? "selected" : ""}>Todos</option>
                            <option value="ingreso" ${st.filtroTipo === "ingreso" ? "selected" : ""}>🟢 Ingresos</option>
                            <option value="egreso" ${st.filtroTipo === "egreso" ? "selected" : ""}>🔴 Gastos</option>
                        </select>
                        <select onchange="window._finState.filtroMedio=this.value; renderizarSeccionFinanzas();" style="width:auto;">
                            <option value="TODOS" ${st.filtroMedio === "TODOS" ? "selected" : ""}>Todos los Medios</option>
                            ${MEDIOS_PAGO_FIN.map(m => `<option value="${m.clave}" ${st.filtroMedio === m.clave ? "selected" : ""}>${m.clave}</option>`).join("")}
                        </select>
                    </div>
                    <div class="table-wrap">
                        <table class="app-table" style="font-size:0.82rem;">
                            <thead><tr><th>Fecha</th><th>Categoría</th><th>Detalle</th><th>Medio</th><th>Monto</th><th style="text-align:right;">Acciones</th></tr></thead>
                            <tbody>
                                ${filtrados.length === 0 ? `<tr><td colspan="6"><div class="empty-box" style="padding:1.25rem;">Todavía no hay movimientos en este período.</div></td></tr>` :
                                filtrados.map(m => `
                                    <tr>
                                        <td><b>${escFin(m.fecha)}</b></td>
                                        <td><span class="badge ${m.tipo === "ingreso" ? "badge-ok" : "badge-danger"}">${m.tipo === "ingreso" ? "+" : "-"} ${escFin(m.rubro)}</span></td>
                                        <td>${escFin(m.concepto)}</td>
                                        <td><span class="badge badge-celeste">${escFin(m.medio)}</span></td>
                                        <td><strong style="color:${m.tipo === "ingreso" ? "var(--ok)" : "var(--err)"};">${m.tipo === "ingreso" ? "+" : "-"}${fmtPesos(m.monto)}</strong></td>
                                        <td style="text-align:right; white-space:nowrap;">
                                            <div style="display:inline-flex; gap:0.3rem;">
                                                <button type="button" class="btn btn-secondary btn-sm" onclick="abrirModalEditarMovimientoFinanzas(${m.id})" title="Editar">✏️</button>
                                                <button type="button" class="btn btn-danger btn-sm" onclick="eliminarMovimientoFinanzas(${m.id})" title="Eliminar">🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } else if (st.tab === "cobranzas_cons" && soloCons) {
            if (typeof window.renderizarPanelCobranzaConsultorio17 === "function") {
                window.renderizarPanelCobranzaConsultorio17(body, { espFiltro: "TODAS", desdeCaja: true });
            } else {
                body.innerHTML = `<div class="empty-box">Cargá el Bloque 17 en js/consultorio.js para habilitar Cobranzas, Tokens y Mutuales.</div>`;
            }
        } else {
            const areasDisp = obtenerAreasClubGym();
            const qC = String(st.cuotasBusq || "").toLowerCase().trim();
            const ordenPeso = { impago: 0, parcial: 1, aldia: 2, becado: 3 };

            const listaFiltrada = res.estadosPersonas
                .filter(item => {
                    const p = item.persona;
                    if (st.cuotasArea !== "TODAS" && p.deporte !== st.cuotasArea) return false;
                    if (st.cuotasEstado === "PENDIENTES" && item.estado !== "impago") return false;
                    if (st.cuotasEstado === "PARCIALES" && item.estado !== "parcial") return false;
                    if (st.cuotasEstado === "ALDIA" && item.estado !== "aldia" && item.estado !== "becado") return false;
                    if (qC && !`${p.apellido} ${p.nombre} ${p.dni} ${p.deporte} ${p.categoria}`.toLowerCase().includes(qC)) return false;
                    return true;
                })
                .sort((a, b) => (ordenPeso[a.estado] - ordenPeso[b.estado]) || String(a.persona.apellido || "").localeCompare(String(b.persona.apellido || "")));

            body.innerHTML = `
                <div class="app-panel">
                    <div class="panel-head" style="flex-wrap:wrap; gap:0.5rem;">
                        <div>
                            <h3><i class="ri-user-received-2-line"></i> Cuotas de ${escFin(fmtMesCorto(res.mesCuota))}</h3>
                            <small style="color:var(--ink-500); font-size:0.74rem;">Todo cobro entra directo a Caja y actualiza Ingresos y Saldos en tiempo real</small>
                        </div>
                        <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                            ${ultRev ? `<button type="button" class="btn btn-danger btn-sm" onclick="deshacerAumentoCuotas(${ultRev.id})" title="Volver atrás: ${escFin(ultRev.descripcion)}">↩️ Deshacer último ajuste</button>` : ""}
                            <button type="button" class="btn btn-secondary btn-sm" onclick="abrirModalAumentoMasivoCuotas()">🏷️ Tarifario y Ajustes</button>
                        </div>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; gap:0.55rem; flex-wrap:wrap; margin-bottom:0.85rem;">
                        <div class="search-box" style="flex:1; min-width:200px;">
                            <i class="ri-search-line"></i>
                            <input type="text" id="finBusqCuotas" value="${escFin(st.cuotasBusq)}" placeholder="Buscar persona por nombre o DNI..." oninput="window._finState.cuotasBusq=this.value; renderizarSeccionFinanzas();">
                        </div>
                        ${areasDisp.length > 1 ? `
                            <select style="width:auto; min-height:36px;" onchange="window._finState.cuotasArea=this.value; renderizarSeccionFinanzas();">
                                <option value="TODAS" ${st.cuotasArea === "TODAS" ? "selected" : ""}>Todas las Áreas</option>
                                ${areasDisp.map(a => `<option value="${escFin(a)}" ${st.cuotasArea === a ? "selected" : ""}>${a === "Futbol" ? "Fútbol" : escFin(a)}</option>`).join("")}
                            </select>
                        ` : ""}
                        <div class="fin-chips-bar">
                            <button type="button" class="fin-filter-chip ${st.cuotasEstado === "TODOS" ? "active" : ""}" onclick="window._finState.cuotasEstado='TODOS'; renderizarSeccionFinanzas();">Todos (${res.activos.length})</button>
                            <button type="button" class="fin-filter-chip warn ${st.cuotasEstado === "PENDIENTES" ? "active" : ""}" onclick="window._finState.cuotasEstado='PENDIENTES'; renderizarSeccionFinanzas();">🔴 Impagos (${res.cantImpago})</button>
                            <button type="button" class="fin-filter-chip parcial ${st.cuotasEstado === "PARCIALES" ? "active" : ""}" onclick="window._finState.cuotasEstado='PARCIALES'; renderizarSeccionFinanzas();">🟡 Parcial (${res.cantParcial})</button>
                            <button type="button" class="fin-filter-chip ok ${st.cuotasEstado === "ALDIA" ? "active" : ""}" onclick="window._finState.cuotasEstado='ALDIA'; renderizarSeccionFinanzas();">🟢 Al Día (${res.cantAlDia})</button>
                        </div>
                    </div>

                    <div class="table-wrap">
                        <table class="app-table" style="font-size:0.82rem;">
                            <thead><tr><th>Persona</th><th>Cuota</th><th>Pagó / Debe</th><th>Estado</th><th style="text-align:right;">Acciones</th></tr></thead>
                            <tbody>
                                ${listaFiltrada.length === 0 ? `<tr><td colspan="5"><div class="empty-box" style="padding:1.2rem;">No hay personas en este filtro.</div></td></tr>` :
                                listaFiltrada.map(item => {
                                    const p = item.persona;
                                    const esOk = item.estado === "aldia" || item.estado === "becado";
                                    const badgeCls = esOk ? "badge-ok" : (item.estado === "parcial" ? "badge-warn" : "badge-danger");
                                    const badgeTxt = item.estado === "becado" ? "🏷️ Becado" : (item.estado === "aldia" ? "🟢 Al Día" : (item.estado === "parcial" ? "🟡 Parcial" : "🔴 Impago"));
                                    const btnCobroTxt = esOk ? "✏️ Editar / Anular" : (item.estado === "parcial" ? "💳 Cobrar Saldo" : "✓ Cobrar");
                                    const btnCobroCls = esOk ? "btn-secondary" : "btn-ok";

                                    return `
                                        <tr>
                                            <td>
                                                <strong style="cursor:pointer;" onclick="irAPaginaIndividual(${p.id})">${escFin(p.apellido)}, ${escFin(p.nombre)}</strong>
                                                <br><small style="color:var(--ink-500);">${escFin(p.deporte)}${p.deporte === "Gimnasio" ? "" : ` (${escFin(p.categoria)})`} • DNI ${escFin(p.dni || "-")}</small>
                                            </td>
                                            <td><b>${item.estado === "becado" ? "$0" : fmtPesos(item.cuota)}</b></td>
                                            <td>
                                                <span style="color:var(--ok); font-weight:700;">Pagó: ${fmtPesos(item.pagado)}</span>
                                                ${item.saldo > 0 ? `<br><small style="color:var(--err); font-weight:800;">Debe: ${fmtPesos(item.saldo)}</small>` : ""}
                                            </td>
                                            <td>
                                                <button type="button" class="badge ${badgeCls}" style="border:none; cursor:pointer;" onclick="cobrarCuotaRapidaFinanzas(${p.id}, '${escFin(res.mesCuota)}')">
                                                    ${badgeTxt}
                                                </button>
                                                ${item.ultimoPago ? `<small style="display:block; font-size:0.68rem; color:var(--ink-500); margin-top:2px;">${escFin(item.ultimoPago.fecha)} • ${escFin(item.ultimoPago.medio)}</small>` : ""}
                                            </td>
                                            <td style="text-align:right; white-space:nowrap;">
                                                <div style="display:inline-flex; gap:0.35rem; justify-content:flex-end; flex-wrap:wrap;">
                                                    <button type="button" class="btn ${btnCobroCls} btn-sm" onclick="cobrarCuotaRapidaFinanzas(${p.id}, '${escFin(res.mesCuota)}')">${btnCobroTxt}</button>
                                                    <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarCobroConAliasWA(${p.id}, '${escFin(res.mesCuota)}')"><i class="ri-whatsapp-line"></i> ${esOk ? "Recibo" : "WA"}</button>
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
        }

        if (activeId === "finBusqCuotas" || activeId === "finBusqMovs") {
            const el = document.getElementById(activeId);
            if (el) {
                el.focus();
                if (selStart !== null) el.setSelectionRange(selStart, selStart);
            }
        }
    };

    // =====================================================================
    // 6. CIERRE DEL DÍA CON ENVÍO DE ARQUEO POR WHATSAPP
    // =====================================================================
    window.abrirModalCierreCaja25 = function (fechaOpt = null) {
        if (!finHidratadoPorClub[clubKeyFin()]) {
            hidratarFinanzasDesdeServidor(false).then(() => {
                const m = document.getElementById("modalFinanzasCDM");
                if (m && !m.classList.contains("hidden")) window.abrirModalCierreCaja25(fechaOpt);
            });
        }
        const fecha = fechaOpt || hoyFin();
        const movsDia = obtenerMovimientosFinanzas().filter(m => m.fecha === fecha);
        const porMedio = { "Efectivo": 0, "Transferencia": 0, "MercadoPago": 0, "Tarjeta / Mutual": 0 };
        let ing = 0, egr = 0;

        movsDia.forEach(m => {
            const v = Number(m.monto) || 0, med = normalizarMedioPago(m.medio);
            if (m.tipo === "ingreso") { ing += v; porMedio[med] += v; }
            else { egr += v; porMedio[med] -= v; }
        });

        const modal = asegurarModalFinanzas();
        modal.innerHTML = `
            <div class="modal-window" style="max-width:620px;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-ok">💵 CIERRE DEL DÍA</span>
                        <h3 style="margin-top:4px;">Arqueo por Medio de Pago</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalFinanzasCDM()">✕</button>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; margin-bottom:0.85rem; flex-wrap:wrap;">
                    <div style="display:flex; align-items:center; gap:0.45rem;">
                        <label style="font-size:0.78rem; font-weight:800;">Fecha:</label>
                        <input type="date" value="${fecha}" onchange="abrirModalCierreCaja25(this.value)" style="width:auto;">
                    </div>
                    <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                        <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarArqueoDiarioWA('${escFin(fecha)}')"><i class="ri-whatsapp-line"></i> Enviar Arqueo WA</button>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="cerrarModalFinanzasCDM(); abrirModuloContabilidadIndependienteCDM('libro');">Ver Movimientos →</button>
                    </div>
                </div>

                <div class="grid-2" style="margin-bottom:0.85rem;">
                    ${MEDIOS_PAGO_FIN.map(mp => `
                        <div style="background:var(--surface-subtle); border:1px solid var(--line-strong); border-left:4px solid ${mp.color}; border-radius:12px; padding:0.7rem 0.85rem;">
                            <small style="color:var(--ink-500); font-weight:700;">${mp.icono} ${mp.clave}</small>
                            <strong style="display:block; font-size:1.15rem;">${fmtPesos(porMedio[mp.clave])}</strong>
                        </div>
                    `).join("")}
                </div>

                <div style="background:var(--cdm-50); border:1px solid var(--line-celeste); border-radius:12px; padding:0.75rem 0.9rem; display:flex; justify-content:space-between; flex-wrap:wrap; gap:0.5rem; font-size:0.86rem;">
                    <span>🟢 Entró: <b>${fmtPesos(ing)}</b></span>
                    <span>🔴 Salió: <b>${fmtPesos(egr)}</b></span>
                    <span>💰 Saldo del Día: <b style="color:var(--cdm-700);">${fmtPesos(ing - egr)}</b></span>
                </div>
            </div>
        `;
        modal.classList.remove("hidden");
    };

    window.enviarArqueoDiarioWA = function (fecha) {
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : { nombreEntidad: "Caja" };
        const movsDia = obtenerMovimientosFinanzas().filter(m => m.fecha === fecha);
        const porMedio = { "Efectivo": 0, "Transferencia": 0, "MercadoPago": 0, "Tarjeta / Mutual": 0 };
        let ing = 0, egr = 0;
        movsDia.forEach(m => {
            const v = Number(m.monto) || 0, med = normalizarMedioPago(m.medio);
            if (m.tipo === "ingreso") { ing += v; porMedio[med] += v; }
            else { egr += v; porMedio[med] -= v; }
        });

        let msg = `💵 *CIERRE DE CAJA — ${(lic.nombreEntidad || "").toUpperCase()}*\n`;
        msg += `📅 Fecha: ${fecha} (${movsDia.length} mov.)\n`;
        msg += `----------------------------------\n`;
        msg += `🟢 Entró: *${fmtPesos(ing)}*\n`;
        msg += `🔴 Salió: *${fmtPesos(egr)}*\n`;
        msg += `💰 Saldo Neto: *${fmtPesos(ing - egr)}*\n\n`;
        msg += `📊 *Por Medio de Pago:*\n`;
        MEDIOS_PAGO_FIN.forEach(mp => { msg += `• ${mp.icono} ${mp.clave}: ${fmtPesos(porMedio[mp.clave])}\n`; });
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    };

    // =====================================================================
    // 7. TARIFARIO BASE + AJUSTE MASIVO CON VISTA PREVIA Y DESHACER + ALIAS WA
    // =====================================================================
    function obtenerHistorialAumentosFin() {
        try {
            const arr = JSON.parse(localStorage.getItem(histAumentosKeyFin()) || "[]");
            return Array.isArray(arr) ? arr : [];
        } catch {
            return [];
        }
    }

    function guardarHistorialAumentosFin(arr) {
        localStorage.setItem(histAumentosKeyFin(), JSON.stringify((Array.isArray(arr) ? arr : []).slice(0, 15)));
    }

    function obtenerUltimoAumentoReversibleFin() {
        return obtenerHistorialAumentosFin().find(h => h && !h.revertido && Array.isArray(h.cambios) && h.cambios.length > 0) || null;
    }

    function calcularNuevoMontoAumento(actual, modo, val, redondeo) {
        const base = Number(actual) || 0;
        let bruto = base;
        if (modo === "pct_subir") bruto = base * (1 + val / 100);
        else if (modo === "pct_bajar") bruto = Math.max(0, base * (1 - val / 100));
        else if (modo === "fijo") bruto = Math.max(0, val);

        const paso = Number(redondeo) || 1;
        if (paso > 1 && modo !== "fijo") return Math.max(0, Math.round(bruto / paso) * paso);
        return Math.max(0, Math.round(bruto));
    }

    function obtenerPersonasObjetivoAumento(area) {
        return (typeof basePersonas !== "undefined" ? basePersonas : [])
            .filter(p => p && p.activo && (area === "TODOS" || p.deporte === area))
            .sort((a, b) => String(a.apellido || "").localeCompare(String(b.apellido || "")));
    }

    window.enviarCobroConAliasWA = function (idPersona, mesOpt = null) {
        const p = (typeof basePersonas !== "undefined" ? basePersonas : []).find(x => Number(x.id) === Number(idPersona));
        if (!p) return;
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : { nombreEntidad: "Plataforma" };
        const tel = String(p.whatsapp || "").replace(/\D/g, "");
        const mesC = mesOpt || mesCuotaActivo();
        const info = calcularEstadoCuotaPersona(p, mesC);

        let msg = "";
        if (info.estado === "aldia" || info.estado === "becado") {
            msg = `✅ *COMPROBANTE DE PAGO — ${(lic.nombreEntidad || "").toUpperCase()}*\n👤 ${p.nombre} ${p.apellido}\n📅 Cuota ${fmtMesCorto(mesC)}: *${fmtPesos(info.pagado || info.cuota)}* • *AL DÍA*`;
        } else if (info.estado === "parcial") {
            msg = `🟡 *RESUMEN DE CUOTA (${fmtMesCorto(mesC)}) — ${(lic.nombreEntidad || "").toUpperCase()}*\nHola *${p.nombre}*, registramos tu pago parcial de *${fmtPesos(info.pagado)}*.\n• Cuota total: ${fmtPesos(info.cuota)}\n• *Saldo pendiente: ${fmtPesos(info.saldo)}*`;
        } else {
            msg = `💳 *RECORDATORIO DE CUOTA (${fmtMesCorto(mesC)}) — ${(lic.nombreEntidad || "").toUpperCase()}*\nHola *${p.nombre}*, te recordamos la cuota de *${p.deporte}* por *${fmtPesos(info.cuota)}*.`;
        }

        if (info.estado !== "aldia" && info.estado !== "becado" && lic.aliasTransferencia) {
            msg += `\n\n🏦 *Datos para transferir:*\n• Alias/CBU: *${lic.aliasTransferencia}*` + (lic.titularTransferencia ? `\n• Titular: ${lic.titularTransferencia}` : "");
        }
        window.open(tel ? `https://wa.me/${tel}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    };

    window.abrirModalAumentoMasivoCuotas = function () {
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        const { soloCons } = estadoModulosFin();
        const areas = obtenerAreasClubGym();
        const soloGymFin = areas.length === 1 && areas[0] === "Gimnasio";
        const tarifario = obtenerTarifarioBaseFin();

        const opcionesAreasHTML = soloGymFin
            ? `<option value="Gimnasio">🏋️ Todos los Socios del Gimnasio</option>`
            : `<option value="TODOS">Todos los Activos</option>` +
              areas.map(a => `<option value="${escFin(a)}">Solo ${a === "Futbol" ? "Fútbol" : escFin(a)}</option>`).join("");

        window._finAumExcluidos = new Set();
        const historial = obtenerHistorialAumentosFin();
        const modal = asegurarModalFinanzas();

        modal.innerHTML = `
            <div class="modal-window" style="max-width:680px;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-purple">${soloCons ? "🏦 DATOS DE TRANSFERENCIA" : "🏷️ TARIFARIO Y AJUSTE SEGURO DE CUOTAS"}</span>
                        <h3 style="margin-top:4px;">${soloCons ? "Alias / CBU del Consultorio" : "Valores Base, Ajustes y Deshacer"}</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalFinanzasCDM()">✕</button>
                </div>

                ${!soloCons ? `
                    <form onsubmit="guardarTarifarioBaseFinanzas(event)" style="margin-bottom:0.95rem; padding-bottom:0.9rem; border-bottom:1.5px solid var(--line);">
                        <strong style="font-size:0.78rem; display:block; margin-bottom:0.45rem; color:var(--ink-700);">
                            🏷️ Valor Estándar de Cuota por Área (se usa como valor de referencia)
                        </strong>
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:0.5rem; margin-bottom:0.6rem;">
                            ${areas.map(a => `
                                <div class="field">
                                    <label>${a === "Futbol" ? "Fútbol" : escFin(a)} ($)</label>
                                    <input type="number" class="fin-tarifa-area-inp" data-area="${escFin(a)}" min="0" step="any" inputmode="decimal"
                                        value="${Number(tarifario[a]) || 25000}">
                                </div>
                            `).join("")}
                        </div>
                        <button type="submit" class="btn btn-secondary btn-sm">💾 Guardar Tarifario Base</button>
                    </form>

                    <form onsubmit="aplicarAumentoMasivoCuotas(event)" style="margin-bottom:1rem; padding-bottom:0.95rem; border-bottom:1.5px solid var(--line);">
                        <strong style="font-size:0.78rem; display:block; margin-bottom:0.45rem; color:var(--ink-700);">
                            📈 Aplicar Ajuste Masivo a Personas Activas
                        </strong>
                        <div class="grid-2" style="margin-bottom:0.55rem;">
                            <div class="field">
                                <label>Aplicar a</label>
                                <select id="aumArea" onchange="window._finAumExcluidos.clear(); actualizarPreviewAumentoCuotas();">${opcionesAreasHTML}</select>
                            </div>
                            <div class="field">
                                <label>Acción</label>
                                <select id="aumModo" onchange="actualizarPreviewAumentoCuotas()">
                                    <option value="pct_subir">📈 Subir por porcentaje (+%)</option>
                                    <option value="pct_bajar">📉 Bajar por porcentaje (-%)</option>
                                    <option value="fijo">💵 Fijar nuevo monto exacto ($)</option>
                                </select>
                            </div>
                        </div>

                        <div class="grid-2" style="margin-bottom:0.65rem;">
                            <div class="field">
                                <label id="lblAumValor">Porcentaje a subir (%) *</label>
                                <input type="number" id="aumValor" min="0.01" step="any" inputmode="decimal" required placeholder="Ej: 15" oninput="actualizarPreviewAumentoCuotas()">
                            </div>
                            <div class="field" id="wrapAumRedondeo">
                                <label>Redondeo automático</label>
                                <select id="aumRedondeo" onchange="actualizarPreviewAumentoCuotas()">
                                    <option value="500" selected>Cada $500 (prolijo)</option>
                                    <option value="100">Cada $100</option>
                                    <option value="1">Sin redondeo (exacto)</option>
                                </select>
                            </div>
                        </div>

                        <div id="aumAlertaSeguridad" class="hidden" style="background:rgba(239,68,68,0.1); border:1.5px solid rgba(239,68,68,0.45); color:#b91c1c; border-radius:11px; padding:0.55rem 0.75rem; font-size:0.77rem; font-weight:700; margin-bottom:0.65rem;"></div>
                        <div id="aumPreviewBox" style="background:var(--surface-subtle); border:1px solid var(--line-strong); border-radius:13px; padding:0.65rem 0.75rem; margin-bottom:0.7rem;"></div>

                        <button type="submit" id="btnConfirmarAumentoCuotas" class="btn btn-primary" style="width:100%;" disabled>
                            📈 Ingresá un valor para previsualizar el cambio
                        </button>
                    </form>

                    <div id="aumHistorialBox" style="margin-bottom:1rem; padding-bottom:0.9rem; border-bottom:1.5px solid var(--line);">
                        <strong style="font-size:0.78rem; display:block; margin-bottom:0.45rem; color:var(--ink-700);">
                            ↩️ Historial de Ajustes Masivos (podés volver atrás si hubo un error)
                        </strong>
                        ${historial.length === 0 ? `
                            <small style="color:var(--ink-500); font-size:0.75rem;">Todavía no se aplicaron ajustes masivos.</small>
                        ` : `
                            <div style="display:flex; flex-direction:column; gap:0.4rem; max-height:165px; overflow-y:auto;">
                                ${historial.slice(0, 6).map(h => `
                                    <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap; background:var(--surface-subtle); border:1px solid var(--line); border-left:4px solid ${h.revertido ? "#94a3b8" : "#0284c7"}; border-radius:11px; padding:0.5rem 0.7rem; font-size:0.76rem; ${h.revertido ? "opacity:0.68;" : ""}">
                                        <div>
                                            <div style="font-weight:800; color:var(--ink-900);">${escFin(h.descripcion)}</div>
                                            <small style="color:var(--ink-500);">${escFin(h.fechaTxt)} • ${h.cambios.length} persona(s)${h.revertido ? " • <b>Revertido ✓</b>" : ""}</small>
                                        </div>
                                        ${!h.revertido ? `
                                            <button type="button" class="btn btn-danger btn-sm" style="min-height:29px; font-size:0.72rem;" onclick="deshacerAumentoCuotas(${h.id})">
                                                ↩️ Deshacer
                                            </button>
                                        ` : `<span class="badge badge-celeste" style="font-size:0.66rem;">Deshecho</span>`}
                                    </div>
                                `).join("")}
                            </div>
                        `}
                    </div>
                ` : ""}

                <form onsubmit="guardarAliasTransferenciaFinanzas(event)">
                    <strong style="font-size:0.8rem; display:block; margin-bottom:0.45rem;">🏦 Alias / CBU para envíos por WhatsApp:</strong>
                    <div class="grid-2" style="margin-bottom:0.65rem;">
                        <div class="field"><label>Alias o CBU</label><input type="text" id="finAliasWA" value="${escFin(lic.aliasTransferencia || "")}" placeholder="Ej: gimnasio.mp"></div>
                        <div class="field"><label>Titular</label><input type="text" id="finTitularWA" value="${escFin(lic.titularTransferencia || "")}" placeholder="Ej: Nombre del titular"></div>
                    </div>
                    <button type="submit" class="btn btn-secondary btn-sm" style="width:100%;">💾 Guardar Datos de Transferencia</button>
                </form>
            </div>
        `;
        modal.classList.remove("hidden");
        if (!soloCons) actualizarPreviewAumentoCuotas();
    };

    window.guardarTarifarioBaseFinanzas = function (e) {
        e.preventDefault();
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        const nuevoTarif = { ...(lic.tarifarioCuotas || {}) };
        document.querySelectorAll(".fin-tarifa-area-inp").forEach(inp => {
            const area = inp.dataset.area;
            const val = Math.max(0, Math.round(parseFloat(inp.value) || 0));
            if (area) nuevoTarif[area] = val;
        });
        lic.tarifarioCuotas = nuevoTarif;
        if (typeof guardarLicenciaConfigCDM === "function") guardarLicenciaConfigCDM(lic);
        else localStorage.setItem("cdm_licencia_config_v1", JSON.stringify(lic));
        toastFin("🏷️ Tarifario base guardado.");
    };

    window.toggleExclusionPersonaAumento = function (idPersona, incluido) {
        const pid = Number(idPersona);
        if (incluido) window._finAumExcluidos.delete(pid);
        else window._finAumExcluidos.add(pid);
        actualizarPreviewAumentoCuotas();
    };

    window.actualizarPreviewAumentoCuotas = function () {
        const box = document.getElementById("aumPreviewBox");
        const alertBox = document.getElementById("aumAlertaSeguridad");
        const btn = document.getElementById("btnConfirmarAumentoCuotas");
        const lblVal = document.getElementById("lblAumValor");
        const inpVal = document.getElementById("aumValor");
        const wrapRed = document.getElementById("wrapAumRedondeo");
        if (!box) return;

        const area = document.getElementById("aumArea")?.value || "TODOS";
        const modo = document.getElementById("aumModo")?.value || "pct_subir";
        const redondeo = Number(document.getElementById("aumRedondeo")?.value) || 500;
        const val = parseFloat(inpVal?.value);
        const hayVal = !isNaN(val) && val > 0;

        if (lblVal && inpVal) {
            if (modo === "pct_subir") { lblVal.textContent = "Porcentaje a subir (%) *"; inpVal.placeholder = "Ej: 15"; }
            else if (modo === "pct_bajar") { lblVal.textContent = "Porcentaje a bajar (%) *"; inpVal.placeholder = "Ej: 10"; }
            else { lblVal.textContent = "Nuevo monto fijo ($) *"; inpVal.placeholder = "Ej: 25000"; }
        }
        if (wrapRed) wrapRed.style.opacity = modo === "fijo" ? "0.45" : "1";

        let aviso = "";
        if (hayVal && (modo === "pct_subir" || modo === "pct_bajar") && val > 60) {
            aviso = `⚠️ Atención: estás aplicando un ${val}% (muy alto). Revisá la vista previa antes de confirmar.`;
        } else if (hayVal && modo === "fijo" && val < 500) {
            aviso = `⚠️ Atención: estás fijando una cuota de ${fmtPesos(val)}. ¿Seguro que no querías elegir "Porcentaje (%)"?`;
        }
        if (alertBox) {
            alertBox.textContent = aviso;
            alertBox.classList.toggle("hidden", !aviso);
        }

        const personas = obtenerPersonasObjetivoAumento(area);
        if (!personas.length) {
            box.innerHTML = `<small style="color:var(--ink-500);">No hay personas activas en el área seleccionada.</small>`;
            if (btn) { btn.disabled = true; btn.textContent = "Sin personas para actualizar"; }
            return;
        }

        let cantSel = 0;
        const filasHTML = personas.map(p => {
            const actual = obtenerCuotaEsperadaPersona(p);
            const incluido = !window._finAumExcluidos.has(Number(p.id));
            if (incluido) cantSel++;
            const nuevo = hayVal ? calcularNuevoMontoAumento(actual, modo, val, redondeo) : actual;
            const diff = nuevo - actual;
            const diffTxt = !hayVal ? "—" : (diff === 0 ? "Sin cambio" : `${diff > 0 ? "+" : ""}${fmtPesos(diff)}`);
            const diffCol = diff > 0 ? "var(--ok)" : (diff < 0 ? "var(--err)" : "var(--ink-500)");

            return `
                <tr style="${incluido ? "" : "opacity:0.45; text-decoration:line-through;"}">
                    <td style="width:28px;">
                        <input type="checkbox" ${incluido ? "checked" : ""} style="width:16px; height:16px; min-height:auto; cursor:pointer;"
                            onchange="toggleExclusionPersonaAumento(${p.id}, this.checked)">
                    </td>
                    <td><b>${escFin(p.apellido)}, ${escFin(p.nombre)}</b> <small style="color:var(--ink-500);">(${escFin(p.deporte)})</small></td>
                    <td>${fmtPesos(actual)}</td>
                    <td><b>${hayVal ? fmtPesos(nuevo) : "—"}</b></td>
                    <td style="font-weight:800; color:${diffCol};">${diffTxt}</td>
                </tr>
            `;
        }).join("");

        box.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem; margin-bottom:0.45rem; flex-wrap:wrap;">
                <strong style="font-size:0.76rem; color:var(--ink-800);">👁️ Vista Previa (${cantSel} de ${personas.length} seleccionados)</strong>
                <small style="font-size:0.7rem; color:var(--ink-500);">Podés destildar becados o excepciones</small>
            </div>
            <div class="table-wrap" style="max-height:175px; overflow-y:auto;">
                <table class="app-table" style="font-size:0.75rem;">
                    <thead><tr><th></th><th>Persona</th><th>Antes</th><th>Quedaría</th><th>Dif.</th></tr></thead>
                    <tbody>${filasHTML}</tbody>
                </table>
            </div>
        `;

        if (btn) {
            const listo = hayVal && cantSel > 0;
            btn.disabled = !listo;
            btn.textContent = listo
                ? `✓ Confirmar cambio en ${cantSel} persona(s)`
                : (!hayVal ? "📈 Ingresá un valor para previsualizar el cambio" : "Seleccioná al menos 1 persona");
        }
    };

    window.aplicarAumentoMasivoCuotas = function (e) {
        e.preventDefault();
        const area = document.getElementById("aumArea").value;
        const modo = document.getElementById("aumModo").value;
        const redondeo = Number(document.getElementById("aumRedondeo")?.value) || 500;
        const val = parseFloat(document.getElementById("aumValor").value);
        if (isNaN(val) || val <= 0) return;

        const personas = obtenerPersonasObjetivoAumento(area).filter(p => !window._finAumExcluidos.has(Number(p.id)));
        const cambios = [];

        personas.forEach(p => {
            const anterior = obtenerCuotaEsperadaPersona(p);
            const nuevo = calcularNuevoMontoAumento(anterior, modo, val, redondeo);
            if (nuevo !== anterior) {
                cambios.push({ personaId: p.id, nombre: `${p.apellido}, ${p.nombre}`, montoAnterior: anterior, montoNuevo: nuevo });
                p.montoCuota = nuevo;
                sincronizarEstadoPersonaConCaja(p);
            }
        });

        if (!cambios.length) {
            toastFin("ℹ️ Ninguna cuota cambió con los valores ingresados.");
            return;
        }

        const areaTxt = area === "TODOS" ? "Todos los activos" : (area === "Futbol" ? "Fútbol" : area);
        const accionTxt = modo === "pct_subir" ? `Subir +${val}%` : (modo === "pct_bajar" ? `Bajar -${val}%` : `Fijar en ${fmtPesos(val)}`);

        const historial = obtenerHistorialAumentosFin();
        const ahora = new Date();
        historial.unshift({
            id: Date.now(),
            fechaISO: ahora.toISOString(),
            fechaTxt: `${ahora.toLocaleDateString("es-AR")} ${ahora.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`,
            descripcion: `${accionTxt} • ${areaTxt}`,
            area, modo, valor: val, redondeo,
            cambios,
            revertido: false
        });
        guardarHistorialAumentosFin(historial);

        if (typeof guardarDatosCDM === "function") guardarDatosCDM();
        if (typeof registrarAuditoriaCDM === "function") {
            registrarAuditoriaCDM("AUMENTO_CUOTAS", `${accionTxt} en ${areaTxt} (${cambios.length} persona/s)`);
        }

        toastFin(`✅ Cuota actualizada en ${cambios.length} persona(s). Podés deshacerlo cuando quieras.`);
        refrescarTodaUIPagos();
        abrirModalAumentoMasivoCuotas();
    };

    window.deshacerAumentoCuotas = function (idSnapshot = null) {
        const historial = obtenerHistorialAumentosFin();
        const snap = idSnapshot
            ? historial.find(h => Number(h.id) === Number(idSnapshot))
            : obtenerUltimoAumentoReversibleFin();

        if (!snap || snap.revertido) {
            toastFin("ℹ️ No hay ajustes pendientes para deshacer.");
            return;
        }

        let restaurados = 0;
        const listaP = typeof basePersonas !== "undefined" ? basePersonas : [];
        (snap.cambios || []).forEach(c => {
            const p = listaP.find(x => Number(x.id) === Number(c.personaId));
            if (p) {
                p.montoCuota = Number(c.montoAnterior) || 0;
                sincronizarEstadoPersonaConCaja(p);
                restaurados++;
            }
        });

        snap.revertido = true;
        snap.fechaReversionISO = new Date().toISOString();
        guardarHistorialAumentosFin(historial);

        if (typeof guardarDatosCDM === "function") guardarDatosCDM();
        if (typeof registrarAuditoriaCDM === "function") {
            registrarAuditoriaCDM("DESHACER_AUMENTO_CUOTAS", `Revertido "${snap.descripcion}" (${restaurados} persona/s)`);
        }

        toastFin(`↩️ Se restauraron las cuotas anteriores de ${restaurados} persona(s).`);
        refrescarTodaUIPagos();
        const modal = document.getElementById("modalFinanzasCDM");
        if (modal && !modal.classList.contains("hidden") && document.getElementById("aumHistorialBox")) {
            abrirModalAumentoMasivoCuotas();
        }
    };

    window.guardarAliasTransferenciaFinanzas = function (e) {
        e.preventDefault();
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        lic.aliasTransferencia = (document.getElementById("finAliasWA")?.value || "").trim();
        lic.titularTransferencia = (document.getElementById("finTitularWA")?.value || "").trim();
        if (typeof guardarLicenciaConfigCDM === "function") guardarLicenciaConfigCDM(lic);
        else localStorage.setItem("cdm_licencia_config_v1", JSON.stringify(lic));
        toastFin("🏦 Alias/CBU guardado.");
    };

    // =====================================================================
    // 8. CONECTAR TARJETAS DE GYM Y DEPORTES AL MODAL DE COBRO
    // =====================================================================
    function conectarModalEnAlternarEstadoPago() {
        if (!esAdminSesionFin()) return;
        window.alternarEstadoPago = function (idPersona) {
            if (typeof tienePermisoAdminCDM === "function" && !tienePermisoAdminCDM("cajaCobrar")) {
                toastFin("🔒 No tenés permiso para cobrar o modificar pagos.");
                return;
            }
            window.cobrarCuotaRapidaFinanzas(idPersona, mesActualFin());
        };
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") cerrarModalFinanzas();
    });

    document.addEventListener("DOMContentLoaded", () => {
        inyectarCSSFinanzasPro();
        if (!esAdminSesionFin()) return;
        const path = window.location.pathname.toLowerCase();
        if (path.includes("login.html")) return;
        conectarModalEnAlternarEstadoPago();
        setTimeout(conectarModalEnAlternarEstadoPago, 350);
        setTimeout(() => hidratarFinanzasDesdeServidor(false), 350);
    });
})();