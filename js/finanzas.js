/**
 * js/finanzas.js — Motor Financiero y Contabilidad Unificada (4 Cajas, Libro Mayor,
 * Cuentas Corrientes, Aumento Masivo de Cuotas + Alias WA, Cierre de Caja y CSV)
 * CDM Pro Suite — Desarrollado por Gonzalo Adanchú
 */

(function () {
    const MEDIOS_PAGO_FIN = [
        { clave: "Efectivo", icono: "💵", color: "#10b981" },
        { clave: "Transferencia", icono: "🏦", color: "#0284c7" },
        { clave: "MercadoPago", icono: "📱", color: "#38bdf8" },
        { clave: "Tarjeta / Mutual", icono: "💳", color: "#6366f1" }
    ];

    const RUBROS_INGRESO = ["Cuota Gimnasio", "Cuota Deportes", "Sesión Consultorio", "Coseguro / Mutual", "Indumentaria / Buffets", "Otros Ingresos"];
    const RUBROS_EGRESO = ["Alquiler / Servicios", "Honorarios Profesores", "Equipamiento / Mantenimiento", "Insumos / Limpieza", "Impuestos / Varios", "Retiro / Otros"];

    window._finState = {
        tab: "resumen",
        mes: new Date().toISOString().slice(0, 7),
        filtroTipo: "TODOS",
        filtroMedio: "TODOS",
        busq: ""
    };

    function clubKeyFin() {
        return typeof obtenerClaveClubActivoCDM === "function"
            ? obtenerClaveClubActivoCDM()
            : (localStorage.getItem("cdm_club_activo_id_v1") || "cdm_adelia_maria_principal");
    }

    function storageKeyFin() {
        return `cdm_finanzas_unif_v35_${clubKeyFin()}`;
    }

    function normalizarMedioPago(raw = "") {
        const t = String(raw || "").toLowerCase();
        if (t.includes("efec")) return "Efectivo";
        if (t.includes("mercado") || t.includes("mp")) return "MercadoPago";
        if (t.includes("tarj") || t.includes("mutu") || t.includes("obra")) return "Tarjeta / Mutual";
        return "Transferencia";
    }

    function obtenerMovimientosFinanzas() {
        const key = storageKeyFin();
        let lista = [];
        try { lista = JSON.parse(localStorage.getItem(key) || "null"); } catch { lista = null; }

        if (!Array.isArray(lista)) {
            lista = [];
            // Migración única y sin pérdidas desde claves viejas
            const club = clubKeyFin();
            const fuentes = [];
            if (club === "cdm_adelia_maria_principal") {
                try { fuentes.push(...(JSON.parse(localStorage.getItem("cdm_contabilidad_movs_v2") || "[]") || [])); } catch {}
            }
            try { fuentes.push(...(JSON.parse(localStorage.getItem(`cdm_caja_movs_v25_${club}`) || "[]") || [])); } catch {}

            const vistos = new Set();
            fuentes.forEach(m => {
                if (!m || !m.monto) return;
                const id = String(m.id || `${m.fecha}_${m.monto}_${m.concepto}`);
                if (vistos.has(id)) return;
                vistos.add(id);
                lista.push({
                    id: m.id || Date.now() + Math.floor(Math.random() * 999),
                    fecha: m.fecha || obtenerHoyISO(),
                    tipo: String(m.tipo || "ingreso").toLowerCase().includes("egr") ? "egreso" : "ingreso",
                    rubro: m.rubro || m.categoria || "General",
                    concepto: m.concepto || m.detalle || "Movimiento migrado",
                    monto: Math.abs(parseFloat(m.monto) || 0),
                    medio: normalizarMedioPago(m.medio || m.caja)
                });
            });
            localStorage.setItem(key, JSON.stringify(lista));
        }
        return lista.sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")) || (b.id - a.id));
    }

    function guardarMovimientosFinanzas(lista) {
        localStorage.setItem(storageKeyFin(), JSON.stringify(lista));
    }

    // Hook público llamado desde js/deportes-cancha.js al cobrar una cuota
    window.registrarAsientoCuotaEnLibroMayor = function (persona, monto, medio = "Transferencia", fecha = null) {
        if (!persona || !monto) return;
        const lista = obtenerMovimientosFinanzas();
        lista.unshift({
            id: Date.now() + Math.floor(Math.random() * 100),
            fecha: fecha || obtenerHoyISO(),
            tipo: "ingreso",
            rubro: persona.deporte === "Gimnasio" ? "Cuota Gimnasio" : "Cuota Deportes",
            concepto: `Cuota ${persona.apellido}, ${persona.nombre} (${persona.deporte})`,
            monto: Math.abs(parseFloat(monto) || 0),
            medio: normalizarMedioPago(medio),
            personaId: persona.id
        });
        guardarMovimientosFinanzas(lista);
    };

    function fmtPesos(n) {
        return "$" + Math.round(Number(n) || 0).toLocaleString("es-AR");
    }

    function calcularResumenMes(mesYM) {
        const movs = obtenerMovimientosFinanzas();
        const delMes = mesYM === "TODOS" ? movs : movs.filter(m => String(m.fecha || "").startsWith(mesYM));

        const cajas = { "Efectivo": 0, "Transferencia": 0, "MercadoPago": 0, "Tarjeta / Mutual": 0 };
        let ingresos = 0, egresos = 0;

        delMes.forEach(m => {
            const val = Number(m.monto) || 0;
            const med = normalizarMedioPago(m.medio);
            if (m.tipo === "ingreso") {
                ingresos += val;
                cajas[med] = (cajas[med] || 0) + val;
            } else {
                egresos += val;
                cajas[med] = (cajas[med] || 0) - val;
            }
        });

        const activos = (basePersonas || []).filter(p => p && p.activo);
        const deudores = activos.filter(p => (p.pagoEstado || "Al Día") !== "Al Día");
        const pendienteCobrar = deudores.reduce((a, p) => a + (Number(p.montoCuota) || 25000), 0);

        return { delMes, ingresos, egresos, neto: ingresos - egresos, cajas, deudores, pendienteCobrar, activos };
    }

    // =====================================================================
    // 1. SECCIÓN PRINCIPAL "💰 CONTABILIDAD Y CAJA"
    // =====================================================================
    window.abrirModuloContabilidadIndependienteCDM = function (tabOpt = null) {
        if (tabOpt) window._finState.tab = tabOpt;
        if (typeof alternarSidebarMovil === "function") alternarSidebarMovil(true);

        const main = document.querySelector(".app-content");
        if (!main) return;

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
        if (h2) h2.innerHTML = `💰 Contabilidad y Caja <span class="cat-active-pill">4 Cajas Unificadas</span>`;

        renderizarSeccionFinanzas();
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.cambiarTabFinanzas = function (t) {
        window._finState.tab = t;
        renderizarSeccionFinanzas();
    };

    window.guardarMovimientoFinanzas = function (e) {
        e.preventDefault();
        const fecha = document.getElementById("finFecha").value || obtenerHoyISO();
        const tipo = document.getElementById("finTipo").value;
        const rubro = document.getElementById("finRubro").value;
        const concepto = document.getElementById("finConcepto").value.trim();
        const monto = parseFloat(document.getElementById("finMonto").value);
        const medio = document.getElementById("finMedio").value;

        if (!concepto || isNaN(monto) || monto <= 0) return alert("Ingresá un concepto y un monto válido.");

        const lista = obtenerMovimientosFinanzas();
        lista.unshift({ id: Date.now(), fecha, tipo, rubro, concepto, monto, medio });
        guardarMovimientosFinanzas(lista);
        mostrarToast(tipo === "ingreso" ? `💵 Ingreso registrado (${fmtPesos(monto)})` : `📤 Egreso registrado (${fmtPesos(monto)})`);
        renderizarSeccionFinanzas();
    };

    window.eliminarMovimientoFinanzas = function (idMov) {
        if (!confirm("🗑️ ¿Eliminar este movimiento del libro mayor?")) return;
        guardarMovimientosFinanzas(obtenerMovimientosFinanzas().filter(m => Number(m.id) !== Number(idMov)));
        renderizarSeccionFinanzas();
    };

    window.cobrarCuotaRapidaFinanzas = function (idPersona) {
        const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
        if (!p) return;
        const monto = prompt(`Confirmar cobro de cuota para ${p.nombre} ${p.apellido}:`, p.montoCuota || 25000);
        if (monto === null) return;
        const medio = prompt("Medio de pago (Efectivo / Transferencia / MercadoPago / Tarjeta):", "Transferencia") || "Efectivo";
        const val = parseFloat(monto) || 0;

        p.montoCuota = val;
        p.pagoEstado = "Al Día";
        p.ultimoPagoFecha = obtenerHoyISO();
        if (!Array.isArray(p.historialPagos)) p.historialPagos = [];
        p.historialPagos.push({ id: Date.now(), fecha: p.ultimoPagoFecha, monto: val, medio: normalizarMedioPago(medio) });

        registrarAsientoCuotaEnLibroMayor(p, val, medio, p.ultimoPagoFecha);
        guardarDatosCDM();
        mostrarToast(`✅ Cobrado ${fmtPesos(val)} a ${p.apellido}.`);
        renderizarSeccionFinanzas();
    };

    window.exportarLibroMayorCSV = function () {
        const st = window._finState;
        const { delMes } = calcularResumenMes(st.mes);
        if (!delMes.length) return alert("No hay movimientos en el período seleccionado.");
        let csv = "Fecha;Tipo;Rubro;Concepto;Medio;Monto\n";
        delMes.forEach(m => {
            csv += `${m.fecha};${m.tipo.toUpperCase()};${m.rubro};"${String(m.concepto).replace(/"/g, '""')}";${m.medio};${m.tipo === "egreso" ? -m.monto : m.monto}\n`;
        });
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `libro_mayor_${st.mes}_${clubKeyFin()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        mostrarToast("📊 Excel CSV exportado.");
    };

    function renderizarSeccionFinanzas() {
        const sec = document.getElementById("cdmSeccionContabilidadGlobal");
        if (!sec) return;
        const st = window._finState;
        const res = calcularResumenMes(st.mes);

        sec.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.65rem; flex-wrap:wrap; margin-bottom:0.9rem;">
                <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                    <label style="font-size:0.78rem; font-weight:800;">📅 Período:</label>
                    <input type="month" value="${st.mes === "TODOS" ? new Date().toISOString().slice(0, 7) : st.mes}" style="width:auto;" onchange="window._finState.mes=this.value; renderizarSeccionFinanzas();">
                    <button type="button" class="btn ${st.mes === "TODOS" ? "btn-primary" : "btn-ghost"} btn-sm" onclick="window._finState.mes='TODOS'; renderizarSeccionFinanzas();">Histórico Total</button>
                </div>
                <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="abrirModalAumentoMasivoCuotas()">📈 Aumento Cuotas & Alias WA</button>
                    <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalCierreCaja25()">💵 Cierre de Caja</button>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="exportarLibroMayorCSV()">📊 Excel CSV</button>
                </div>
            </div>

            <section class="bento-kpis" style="margin-bottom:1rem;">
                <div class="bento-kpi"><div class="kpi-icon ok"><i class="ri-arrow-down-circle-fill"></i></div><div class="kpi-data"><span>Ingresos</span><strong>${fmtPesos(res.ingresos)}</strong></div></div>
                <div class="bento-kpi"><div class="kpi-icon warn"><i class="ri-arrow-up-circle-fill"></i></div><div class="kpi-data"><span>Egresos</span><strong>${fmtPesos(res.egresos)}</strong></div></div>
                <div class="bento-kpi"><div class="kpi-icon purple"><i class="ri-scales-3-fill"></i></div><div class="kpi-data"><span>Balance Neto</span><strong style="color:${res.neto >= 0 ? "var(--ok)" : "var(--err)"};">${fmtPesos(res.neto)}</strong></div></div>
                <div class="bento-kpi"><div class="kpi-icon"><i class="ri-error-warning-fill"></i></div><div class="kpi-data"><span>Por Cobrar (${res.deudores.length})</span><strong>${fmtPesos(res.pendienteCobrar)}</strong></div></div>
            </section>

            <div class="module-tabs tabs-3" style="margin-bottom:1rem;">
                <button type="button" class="mod-tab ${st.tab === "resumen" ? "active" : ""}" onclick="cambiarTabFinanzas('resumen')"><i class="ri-safe-2-line"></i><span>4 Cajas y P&L</span></button>
                <button type="button" class="mod-tab ${st.tab === "libro" ? "active" : ""}" onclick="cambiarTabFinanzas('libro')"><i class="ri-book-2-line"></i><span>Libro Mayor (${res.delMes.length})</span></button>
                <button type="button" class="mod-tab ${st.tab === "cuotas" ? "active" : ""}" onclick="cambiarTabFinanzas('cuotas')"><i class="ri-group-line"></i><span>Cuotas y Cobranza (${res.deudores.length} pend.)</span></button>
            </div>
            <div id="finBodyContent"></div>
        `;

        const body = document.getElementById("finBodyContent");
        if (!body) return;

        if (st.tab === "resumen") {
            body.innerHTML = `
                <div class="split-equal">
                    <div class="app-panel">
                        <div class="panel-head"><h3><i class="ri-wallet-3-line"></i> Saldo Neto por Caja / Medio de Pago</h3></div>
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:0.75rem;">
                            ${MEDIOS_PAGO_FIN.map(mp => `
                                <div style="background:var(--surface-subtle); border:1.5px solid var(--line-strong); border-top:4px solid ${mp.color}; border-radius:14px; padding:0.9rem;">
                                    <span style="font-size:0.76rem; font-weight:800; color:var(--ink-500);">${mp.icono} ${mp.clave}</span>
                                    <strong style="display:block; font-size:1.35rem; margin-top:4px; color:var(--ink-900);">${fmtPesos(res.cajas[mp.clave] || 0)}</strong>
                                </div>
                            `).join("")}
                        </div>
                    </div>

                    <div class="app-panel">
                        <div class="panel-head"><h3><i class="ri-add-circle-line"></i> Cargar Movimiento Rápido</h3></div>
                        <form onsubmit="guardarMovimientoFinanzas(event)">
                            <div class="grid-3" style="margin-bottom:0.65rem;">
                                <div class="field"><label>Fecha</label><input type="date" id="finFecha" value="${obtenerHoyISO()}" required></div>
                                <div class="field"><label>Tipo</label>
                                    <select id="finTipo" onchange="const s=document.getElementById('finRubro'); const arr=this.value==='egreso'?${JSON.stringify(RUBROS_EGRESO).replace(/"/g, "'")}:${JSON.stringify(RUBROS_INGRESO).replace(/"/g, "'")}; s.innerHTML=arr.map(x=>'<option>'+x+'</option>').join('');">
                                        <option value="ingreso">🟢 Ingreso (+)</option>
                                        <option value="egreso">🔴 Egreso (-)</option>
                                    </select>
                                </div>
                                <div class="field"><label>Medio</label>
                                    <select id="finMedio">${MEDIOS_PAGO_FIN.map(m => `<option value="${m.clave}">${m.icono} ${m.clave}</option>`).join("")}</select>
                                </div>
                            </div>
                            <div class="grid-2" style="margin-bottom:0.65rem;">
                                <div class="field"><label>Rubro</label><select id="finRubro">${RUBROS_INGRESO.map(r => `<option>${r}</option>`).join("")}</select></div>
                                <div class="field"><label>Monto ($) *</label><input type="number" id="finMonto" min="1" step="1" required placeholder="25000"></div>
                            </div>
                            <div class="field" style="margin-bottom:0.8rem;"><label>Concepto / Detalle *</label><input type="text" id="finConcepto" required placeholder="Ej: Pago luz / Cuota socio / Compra pelotas"></div>
                            <button type="submit" class="btn btn-primary" style="width:100%;">💾 Registrar en Caja</button>
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
                        <div class="search-box"><i class="ri-search-line"></i><input type="text" value="${st.busq.replace(/"/g, "&quot;")}" placeholder="Buscar concepto o rubro..." oninput="window._finState.busq=this.value; renderizarSeccionFinanzas();"></div>
                        <select onchange="window._finState.filtroTipo=this.value; renderizarSeccionFinanzas();" style="width:auto;">
                            <option value="TODOS" ${st.filtroTipo === "TODOS" ? "selected" : ""}>Todos</option>
                            <option value="ingreso" ${st.filtroTipo === "ingreso" ? "selected" : ""}>🟢 Ingresos</option>
                            <option value="egreso" ${st.filtroTipo === "egreso" ? "selected" : ""}>🔴 Egresos</option>
                        </select>
                        <select onchange="window._finState.filtroMedio=this.value; renderizarSeccionFinanzas();" style="width:auto;">
                            <option value="TODOS" ${st.filtroMedio === "TODOS" ? "selected" : ""}>Todos los Medios</option>
                            ${MEDIOS_PAGO_FIN.map(m => `<option value="${m.clave}" ${st.filtroMedio === m.clave ? "selected" : ""}>${m.clave}</option>`).join("")}
                        </select>
                    </div>
                    <div class="table-wrap">
                        <table class="app-table" style="font-size:0.82rem;">
                            <thead><tr><th>Fecha</th><th>Tipo / Rubro</th><th>Concepto</th><th>Medio</th><th>Monto</th><th></th></tr></thead>
                            <tbody>
                                ${filtrados.length === 0 ? `<tr><td colspan="6"><div class="empty-box" style="padding:1rem;">Sin movimientos en este filtro.</div></td></tr>` :
                                filtrados.map(m => `
                                    <tr>
                                        <td><b>${m.fecha}</b></td>
                                        <td><span class="badge ${m.tipo === "ingreso" ? "badge-ok" : "badge-danger"}">${m.tipo === "ingreso" ? "+" : "-"} ${m.rubro}</span></td>
                                        <td>${m.concepto}</td>
                                        <td><span class="badge badge-celeste">${m.medio}</span></td>
                                        <td><strong style="color:${m.tipo === "ingreso" ? "var(--ok)" : "var(--err)"};">${m.tipo === "ingreso" ? "+" : "-"}${fmtPesos(m.monto)}</strong></td>
                                        <td style="text-align:right;"><button type="button" class="btn btn-danger btn-sm" onclick="eliminarMovimientoFinanzas(${m.id})">🗑️</button></td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } else {
            const ord = [...res.activos].sort((a, b) => ((a.pagoEstado === "Pendiente" ? 0 : 1) - (b.pagoEstado === "Pendiente" ? 0 : 1)) || a.apellido.localeCompare(b.apellido));
            body.innerHTML = `
                <div class="app-panel">
                    <div class="panel-head">
                        <h3><i class="ri-user-received-2-line"></i> Cuentas Corrientes y Cuotas Mensuales</h3>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="abrirModalAumentoMasivoCuotas()">📈 Subir Cuotas / Alias WA</button>
                    </div>
                    <div class="table-wrap">
                        <table class="app-table" style="font-size:0.82rem;">
                            <thead><tr><th>Persona</th><th>Área</th><th>Cuota</th><th>Estado</th><th style="text-align:right;">Acciones</th></tr></thead>
                            <tbody>
                                ${ord.map(p => {
                                    const alDia = (p.pagoEstado || "Al Día") === "Al Día";
                                    return `
                                        <tr>
                                            <td><strong style="cursor:pointer;" onclick="irAPaginaIndividual(${p.id})">${p.apellido}, ${p.nombre}</strong><br><small style="color:var(--ink-500);">DNI ${p.dni}</small></td>
                                            <td>${p.deporte} ${p.deporte === "Gimnasio" ? "" : `(${p.categoria})`}</td>
                                            <td><b>${fmtPesos(p.montoCuota || 25000)}</b></td>
                                            <td><span class="badge ${alDia ? "badge-ok" : "badge-danger"}">${alDia ? "💳 Al Día" : "⚠️ Pendiente"}</span></td>
                                            <td style="text-align:right;">
                                                <div style="display:flex; gap:0.35rem; justify-content:flex-end; flex-wrap:wrap;">
                                                    ${!alDia ? `<button type="button" class="btn btn-ok btn-sm" onclick="cobrarCuotaRapidaFinanzas(${p.id})">✓ Cobrar</button>` : ""}
                                                    <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarCobroConAliasWA(${p.id})"><i class="ri-whatsapp-line"></i> ${alDia ? "Recibo" : "Cobrar WA"}</button>
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
    }

    // =====================================================================
    // 2. MODAL DE CIERRE DE CAJA RÁPIDO (ACCESIBLE DESDE MENÚ Y FINANZAS)
    // =====================================================================
    function asegurarModalFinanzas() {
        let m = document.getElementById("modalFinanzasCDM");
        if (!m) {
            m = document.createElement("div");
            m.id = "modalFinanzasCDM";
            m.className = "modal-backdrop hidden";
            document.body.appendChild(m);
        }
        return m;
    }

    window.abrirModalCierreCaja25 = function (fechaOpt = null) {
        const fecha = fechaOpt || obtenerHoyISO();
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
            <div class="modal-window" style="max-width:640px;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-ok">💵 CIERRE DE CAJA DIARIO</span>
                        <h3 style="margin-top:4px;">Arqueo por Medio de Pago</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('modalFinanzasCDM').classList.add('hidden')">✕</button>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; margin-bottom:0.85rem; flex-wrap:wrap;">
                    <div style="display:flex; align-items:center; gap:0.45rem;">
                        <label style="font-size:0.78rem; font-weight:800;">Fecha:</label>
                        <input type="date" value="${fecha}" onchange="abrirModalCierreCaja25(this.value)" style="width:auto;">
                    </div>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('modalFinanzasCDM').classList.add('hidden'); abrirModuloContabilidadIndependienteCDM('libro');">Abrir Libro Mayor →</button>
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
                    <span>🟢 Ingresos: <b>${fmtPesos(ing)}</b></span>
                    <span>🔴 Egresos: <b>${fmtPesos(egr)}</b></span>
                    <span>💰 Neto del Día: <b style="color:var(--cdm-700);">${fmtPesos(ing - egr)}</b></span>
                </div>
            </div>
        `;
        modal.classList.remove("hidden");
    };

    // =====================================================================
    // 3. AUMENTO MASIVO DE CUOTAS + ALIAS / CBU PARA WHATSAPP
    // =====================================================================
    window.enviarCobroConAliasWA = function (idPersona) {
        const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
        if (!p) return;
        const lic = obtenerLicenciaConfigCDM();
        const tel = String(p.whatsapp || "").replace(/\D/g, "");
        const monto = fmtPesos(p.montoCuota || 25000);
        const alDia = (p.pagoEstado || "Al Día") === "Al Día";

        let msg = alDia
            ? `💙🤍 *COMPROBANTE DE PAGO — ${lic.nombreEntidad.toUpperCase()}*\n👤 ${p.nombre} ${p.apellido}\n💳 Monto: ${monto} • ✅ CUOTA AL DÍA\n📅 ${new Date().toLocaleDateString("es-AR")}`
            : `💙🤍 *RECORDATORIO DE CUOTA — ${lic.nombreEntidad.toUpperCase()}*\nHola *${p.nombre}*, te recordamos la cuota de *${p.deporte}* por *${monto}*.`;

        if (!alDia && lic.aliasTransferencia) {
            msg += `\n\n🏦 *Datos para transferir:*\n• Alias/CBU: *${lic.aliasTransferencia}*` + (lic.titularTransferencia ? `\n• Titular: ${lic.titularTransferencia}` : "");
        }
        window.open(tel ? `https://wa.me/${tel}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    };

    window.abrirModalAumentoMasivoCuotas = function () {
        const lic = obtenerLicenciaConfigCDM();
        const modal = asegurarModalFinanzas();
        modal.innerHTML = `
            <div class="modal-window" style="max-width:560px;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-purple">📈 ACTUALIZACIÓN DE CUOTAS Y ALIAS</span>
                        <h3 style="margin-top:4px;">Aumento Masivo y Datos de Transferencia</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('modalFinanzasCDM').classList.add('hidden')">✕</button>
                </div>

                <form onsubmit="aplicarAumentoMasivoCuotas(event)" style="margin-bottom:1rem; padding-bottom:0.9rem; border-bottom:1px solid var(--line);">
                    <div class="grid-3" style="margin-bottom:0.65rem;">
                        <div class="field"><label>Aplicar a</label>
                            <select id="aumArea"><option value="TODOS">Todos los Activos</option><option value="Gimnasio">Solo Gimnasio</option><option value="Futbol">Solo Fútbol</option><option value="Hockey">Solo Hockey</option></select>
                        </div>
                        <div class="field"><label>Modo</label>
                            <select id="aumModo"><option value="pct">Porcentaje (%)</option><option value="fijo">Fijar Nuevo Monto ($)</option></select>
                        </div>
                        <div class="field"><label>Valor *</label><input type="number" id="aumValor" required placeholder="Ej: 15 o 30000"></div>
                    </div>
                    <button type="submit" class="btn btn-primary btn-sm" style="width:100%;">📈 Aplicar Nuevo Valor de Cuota</button>
                </form>

                <form onsubmit="guardarAliasTransferenciaFinanzas(event)">
                    <strong style="font-size:0.8rem; display:block; margin-bottom:0.45rem;">🏦 Alias / CBU para mensajes de WhatsApp:</strong>
                    <div class="grid-2" style="margin-bottom:0.65rem;">
                        <div class="field"><label>Alias o CBU</label><input type="text" id="finAliasWA" value="${(lic.aliasTransferencia || "").replace(/"/g, "&quot;")}" placeholder="Ej: club.cdm.mp"></div>
                        <div class="field"><label>Titular</label><input type="text" id="finTitularWA" value="${(lic.titularTransferencia || "").replace(/"/g, "&quot;")}" placeholder="Ej: Club Deportivo Municipal"></div>
                    </div>
                    <button type="submit" class="btn btn-secondary btn-sm" style="width:100%;">💾 Guardar Datos de Transferencia</button>
                </form>
            </div>
        `;
        modal.classList.remove("hidden");
    };

    window.aplicarAumentoMasivoCuotas = function (e) {
        e.preventDefault();
        const area = document.getElementById("aumArea").value;
        const modo = document.getElementById("aumModo").value;
        const val = parseFloat(document.getElementById("aumValor").value);
        if (isNaN(val) || val <= 0) return;

        let cant = 0;
        (basePersonas || []).filter(p => p && p.activo && (area === "TODOS" || p.deporte === area)).forEach(p => {
            const actual = Number(p.montoCuota) || 25000;
            p.montoCuota = modo === "pct" ? Math.round((actual * (1 + val / 100)) / 500) * 500 : Math.round(val);
            cant++;
        });
        guardarDatosCDM();
        document.getElementById("modalFinanzasCDM")?.classList.add("hidden");
        mostrarToast(`📈 Cuota actualizada en ${cant} persona(s).`);
        if (!document.getElementById("cdmSeccionContabilidadGlobal")?.classList.contains("hidden")) renderizarSeccionFinanzas();
    };

    window.guardarAliasTransferenciaFinanzas = function (e) {
        e.preventDefault();
        const lic = obtenerLicenciaConfigCDM();
        lic.aliasTransferencia = (document.getElementById("finAliasWA")?.value || "").trim();
        lic.titularTransferencia = (document.getElementById("finTitularWA")?.value || "").trim();
        if (typeof guardarLicenciaConfigCDM === "function") guardarLicenciaConfigCDM(lic);
        else localStorage.setItem("cdm_licencia_config_v1", JSON.stringify(lic));
        mostrarToast("🏦 Alias/CBU guardado para envíos por WhatsApp.");
    };
})();