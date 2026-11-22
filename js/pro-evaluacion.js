/**
 * js/pro-evaluacion.js — Suite Profesional de Evaluación Física, Anatomía, Lesiones,
 * Asistencia Inteligente (5 estados), Snapshots de Pilares, Base Escrita (Excel CSV) y Boletín PDF A4
 * CDM Pro Suite — Desarrollado por Gonzalo Adanchú
 */

(function () {
    // =====================================================================
    // 1. ESTILOS LIMPIOS Y RESPONSIVE
    // =====================================================================
    if (!document.getElementById("cdmCssProEval")) {
        const st = document.createElement("style");
        st.id = "cdmCssProEval";
        st.textContent = `
            .pe-toolbar {
                display: flex; gap: 0.45rem; flex-wrap: wrap; align-items: center;
                margin-bottom: 0.85rem;
            }
            .pe-att-row {
                display: flex; justify-content: space-between; align-items: center; gap: 0.65rem;
                flex-wrap: wrap; padding: 0.62rem 0.8rem;
                background: var(--surface-solid, #fff); border: 1.5px solid var(--line, #e2e8f0);
                border-radius: 13px; margin-bottom: 0.45rem;
            }
            .pe-att-pills { display: flex; gap: 0.3rem; flex-wrap: wrap; }
            .pe-att-pill {
                border: 1.5px solid var(--line-strong, #cbd5e1);
                background: var(--surface-subtle, #f8fafc);
                color: var(--ink-700, #334155);
                font-size: 0.72rem; font-weight: 800; padding: 0.34rem 0.62rem;
                border-radius: 999px; cursor: pointer; transition: all 0.14s ease;
            }
            .pe-att-pill.st-presente { background: #10b981; border-color: #059669; color: #fff; }
            .pe-att-pill.st-tarde { background: #f59e0b; border-color: #d97706; color: #fff; }
            .pe-att-pill.st-lesionado { background: #0284c7; border-color: #0369a1; color: #fff; }
            .pe-att-pill.st-justificado { background: #6366f1; border-color: #4f46e5; color: #fff; }
            .pe-att-pill.st-ausente { background: #ef4444; border-color: #dc2626; color: #fff; }

            .pe-injury-card {
                background: var(--surface-subtle, #f8fafc);
                border: 1px solid var(--line-strong, #cbd5e1);
                border-left: 4px solid #ef4444;
                border-radius: 12px; padding: 0.68rem 0.85rem;
                display: flex; justify-content: space-between; align-items: center; gap: 0.6rem; flex-wrap: wrap;
                font-size: 0.8rem;
            }
            .pe-injury-card.alta { border-left-color: #10b981; opacity: 0.92; }

            .pe-rubrica-grid {
                display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.5rem; margin-bottom: 0.75rem;
            }
            .pe-rubrica-item {
                background: var(--surface-subtle, #f8fafc); border: 1px solid var(--line-strong, #cbd5e1);
                border-radius: 11px; padding: 0.55rem 0.7rem; font-size: 0.77rem;
            }
            .pe-print-sheet {
                background: #ffffff; color: #0f172a; border-radius: 14px;
                padding: 1.4rem; border: 1px solid #cbd5e1;
            }
            .pe-print-sheet table { width: 100%; border-collapse: collapse; font-size: 0.76rem; }
            .pe-print-sheet th, .pe-print-sheet td {
                border: 1px solid #cbd5e1; padding: 0.42rem 0.5rem; text-align: left;
            }
            .pe-print-sheet th { background: #f1f5f9; font-weight: 800; color: #0f172a; }
            @media (max-width: 640px) {
                .pe-rubrica-grid { grid-template-columns: 1fr; }
                .pe-att-row { flex-direction: column; align-items: stretch; }
                .pe-att-pills { justify-content: space-between; }
                .pe-att-pill { flex: 1; text-align: center; padding: 0.36rem 0.3rem; font-size: 0.69rem; }
            }
            @media print {
                body.pe-printing-modal > *:not(#modalProEvalCDM) { display: none !important; }
                body.pe-printing-modal #modalProEvalCDM {
                    position: static !important; background: #fff !important; padding: 0 !important; display: block !important;
                }
                body.pe-printing-modal #modalProEvalCDM .modal-window {
                    max-width: 100% !important; max-height: none !important; box-shadow: none !important; border: none !important; padding: 0 !important;
                }
                .pe-no-print { display: none !important; }
            }
        `;
        document.head.appendChild(st);
    }

    // =====================================================================
    // 2. NORMALIZACIÓN DE ESTRUCTURAS NUEVAS (100% RETROCOMPATIBLE)
    // =====================================================================
    const ESTADOS_ASISTENCIA = [
        { clave: "presente", label: "✓ Presente", corto: "✓", cls: "st-presente" },
        { clave: "tarde", label: "⏰ Tarde", corto: "⏰", cls: "st-tarde" },
        { clave: "lesionado", label: "🏥 Lesionado/Kine", corto: "🏥", cls: "st-lesionado" },
        { clave: "justificado", label: "📄 Justificado", corto: "📄", cls: "st-justificado" },
        { clave: "ausente", label: "✕ Sin aviso", corto: "✕", cls: "st-ausente" }
    ];

    const ZONAS_LESION = [
        "Isquiotibial", "Cuádriceps", "Aductor / Pubalgia", "Gemelo / Sóleo",
        "Rodilla (Ligamento/Menisco)", "Rodilla (Tendón/Crecimiento)", "Tobillo",
        "Pie / Fascia / Talón", "Cadera / Glúteo", "Zona Lumbar / Espalda",
        "Hombro / Clavícula", "Muñeca / Mano", "Otra Zona"
    ];

    const TIPOS_LESION = [
        "Contractura / Sobrecarga", "Distensión Muscular", "Desgarro Muscular",
        "Esguince Articular", "Tendinitis / Inflamación", "Dolor de Crecimiento (Osgood/Sever)",
        "Traumatismo / Golpe", "Fractura / Fisura", "Post-Quirúrgico"
    ];

    window.asegurarEstructuraProPersona = function (p) {
        if (!p) return;
        if (!p.asistenciasDetalle || typeof p.asistenciasDetalle !== "object") p.asistenciasDetalle = {};
        if (!Array.isArray(p.asistencias)) p.asistencias = [];
        // Sincronizar asistencias viejas al mapa detallado
        p.asistencias.forEach(f => {
            if (f && !p.asistenciasDetalle[f]) p.asistenciasDetalle[f] = { estado: "presente", nota: "" };
        });
        if (!Array.isArray(p.lesionesHistorial)) p.lesionesHistorial = [];
        if (!Array.isArray(p.snapshotsMensuales)) p.snapshotsMensuales = [];
        if (!Array.isArray(p.clinico)) p.clinico = [];
        if (!Array.isArray(p.evaluaciones)) p.evaluaciones = [];
    };

    // Índice justo de Predisposición (NO castiga lesionados ni justificados)
    window.calcularPredisposicionJusta = function (p, ultimosDias = 30) {
        asegurarEstructuraProPersona(p);
        const hoy = new Date();
        const limite = new Date(hoy);
        limite.setDate(hoy.getDate() - ultimosDias);
        const limISO = limite.toISOString().split("T")[0];

        const cont = { presente: 0, tarde: 0, lesionado: 0, justificado: 0, ausente: 0, total: 0 };
        Object.entries(p.asistenciasDetalle).forEach(([fecha, info]) => {
            if (fecha < limISO) return;
            const est = typeof info === "string" ? info : (info?.estado || "presente");
            if (cont[est] !== undefined) {
                cont[est]++;
                cont.total++;
            }
        });

        const evaluables = cont.presente + cont.tarde + cont.ausente;
        let pct = null;
        if (evaluables > 0) {
            pct = Math.round(((cont.presente + cont.tarde * 0.8) / evaluables) * 100);
        } else {
            // Fallback a frecuencia semanal si aún no tomó lista detallada
            const sem = typeof contarAsistenciasUltimos7Dias === "function" ? contarAsistenciasUltimos7Dias(p) : 0;
            const pac = p.frecuenciaSemanal || 3;
            pct = Math.min(100, Math.round((sem / pac) * 100));
        }

        const etiqueta = pct >= 85 ? "Excelente" : pct >= 70 ? "Buena" : pct >= 50 ? "Regular" : "Baja";
        return { pct, etiqueta, cont, evaluables };
    };

    // Guardar Snapshot histórico (permite comparar los 4 pilares y altura en todo el año)
    window.registrarSnapshotPersona = function (p, motivo = "Actualización") {
        if (!p) return;
        asegurarEstructuraProPersona(p);
        const hoy = typeof obtenerHoyISO === "function" ? obtenerHoyISO() : new Date().toISOString().split("T")[0];
        const mes = hoy.slice(0, 7);
        const pred = calcularPredisposicionJusta(p, 30);

        const snap = {
            fecha: hoy,
            mes,
            motivo,
            peso: Number(p.peso) || 0,
            altura: Number(p.altura) || 0,
            grasaPct: p.grasaPct !== undefined && p.grasaPct !== "" ? Number(p.grasaPct) : null,
            musculoPct: p.musculoPct !== undefined && p.musculoPct !== "" ? Number(p.musculoPct) : null,
            score: p.deporte === "Gimnasio" ? null : Number(p.puntosCategoria || 7),
            pilares: p.pilares ? { ...p.pilares } : null,
            predisposicionPct: pred.pct
        };

        // Reemplazar si ya hay un snapshot de hoy; si no, agregar al historial
        const idxHoy = p.snapshotsMensuales.findIndex(s => s.fecha === hoy);
        if (idxHoy >= 0) p.snapshotsMensuales[idxHoy] = snap;
        else p.snapshotsMensuales.push(snap);

        p.snapshotsMensuales.sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
        if (p.snapshotsMensuales.length > 60) p.snapshotsMensuales = p.snapshotsMensuales.slice(-60);
    };

    function asegurarModalProEval() {
        let m = document.getElementById("modalProEvalCDM");
        if (!m) {
            m = document.createElement("div");
            m.id = "modalProEvalCDM";
            m.className = "modal-backdrop hidden";
            document.body.appendChild(m);
        }
        return m;
    }

    window.cerrarModalProEval = function () {
        document.body.classList.remove("pe-printing-modal");
        document.getElementById("modalProEvalCDM")?.classList.add("hidden");
    };

    window.imprimirContenidoModalProEval = function () {
        document.body.classList.add("pe-printing-modal");
        window.print();
        setTimeout(() => document.body.classList.remove("pe-printing-modal"), 400);
    };

    // =====================================================================
    // 3. TOMA DE LISTA RÁPIDA DEL PLANTEL (5 ESTADOS EN 15 SEGUNDOS)
    // =====================================================================
    window.establecerEstadoAsistenciaFecha = function (idPersona, fecha, estado, nota = "") {
        const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
        if (!p) return;
        asegurarEstructuraProPersona(p);

        p.asistenciasDetalle[fecha] = { estado, nota };

        // Mantener sincronizado p.asistencias para compatibilidad con KPIs y gráficos existentes
        const cuentaPresente = (estado === "presente" || estado === "tarde");
        if (cuentaPresente) {
            if (!p.asistencias.includes(fecha)) {
                p.asistencias.push(fecha);
                p.asistencias.sort();
            }
        } else {
            p.asistencias = p.asistencias.filter(f => f !== fecha);
        }

        if (typeof guardarDatosCDM === "function") guardarDatosCDM();
    };

    window.abrirModalTomaListaPlantel = function (fechaOpt = null) {
        const fecha = fechaOpt || (typeof obtenerHoyISO === "function" ? obtenerHoyISO() : new Date().toISOString().split("T")[0]);
        const plantel = typeof obtenerPersonasFiltradasDeporte === "function"
            ? obtenerPersonasFiltradasDeporte(true)
            : (basePersonas || []).filter(p => p && p.activo);

        plantel.forEach(p => asegurarEstructuraProPersona(p));
        plantel.sort((a, b) => a.apellido.localeCompare(b.apellido));

        const tituloArea = typeof deportePagina !== "undefined" && deportePagina
            ? (deportePagina === "Gimnasio" ? "Gimnasio" : `${deportePagina} — ${categoriaActiva}`)
            : "Todo el Club";

        const modal = asegurarModalProEval();
        modal.innerHTML = `
            <div class="modal-window" style="max-width:860px;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-celeste">📋 ASISTENCIA INTELIGENTE (NO CASTIGA LESIONES NI JUSTIFICADAS)</span>
                        <h3 style="margin-top:4px;">Tomar Lista — ${tituloArea} (${plantel.length})</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalProEval(); if(typeof renderizarPaginaDeporte==='function' && deportePagina) renderizarPaginaDeporte();">✕</button>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.6rem; flex-wrap:wrap; margin-bottom:0.85rem; background:var(--surface-subtle); padding:0.65rem 0.85rem; border-radius:12px;">
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                        <label style="font-size:0.78rem; font-weight:800;">📅 Fecha:</label>
                        <input type="date" id="peFechaLista" value="${fecha}" style="width:auto;" onchange="abrirModalTomaListaPlantel(this.value)">
                    </div>
                    <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                        <button type="button" class="btn btn-ok btn-sm" onclick="marcarTodosPresentesListaPro('${fecha}')">✓ Todos Presentes</button>
                        <button type="button" class="btn btn-primary btn-sm" onclick="cerrarModalProEval(); if(typeof renderizarPaginaDeporte==='function' && deportePagina) renderizarPaginaDeporte(); mostrarToast('📋 Lista guardada.');">💾 Listo</button>
                    </div>
                </div>

                <div style="max-height:56vh; overflow-y:auto;">
                    ${plantel.length === 0 ? `<div class="empty-box">No hay personas activas en esta vista.</div>` :
                    plantel.map(p => {
                        const actual = p.asistenciasDetalle[fecha]?.estado || (p.asistencias.includes(fecha) ? "presente" : "");
                        const pred = calcularPredisposicionJusta(p, 30);
                        return `
                            <div class="pe-att-row" id="peRowAtt_${p.id}">
                                <div>
                                    <strong style="font-size:0.86rem;">${p.apellido}, ${p.nombre}</strong>
                                    <small style="display:block; color:var(--ink-500);">${p.puesto || "-"} • Predisp. 30d: <b>${pred.pct}%</b> ${p.estadoMedico && p.estadoMedico !== "Óptimo" ? `• 🏥 ${p.estadoMedico}` : ""}</small>
                                </div>
                                <div class="pe-att-pills">
                                    ${ESTADOS_ASISTENCIA.map(e => `
                                        <button type="button"
                                            class="pe-att-pill ${actual === e.clave ? e.cls : ""}"
                                            onclick="clickEstadoAsistenciaFila(${p.id}, '${fecha}', '${e.clave}', this)">
                                            ${e.label}
                                        </button>
                                    `).join("")}
                                </div>
                            </div>
                        `;
                    }).join("")}
                </div>
            </div>
        `;
        modal.classList.remove("hidden");
    };

    window.clickEstadoAsistenciaFila = function (idPersona, fecha, estado, btnEl) {
        establecerEstadoAsistenciaFecha(idPersona, fecha, estado);
        const row = btnEl.closest(".pe-att-row");
        if (row) {
            row.querySelectorAll(".pe-att-pill").forEach(b => {
                b.classList.remove("st-presente", "st-tarde", "st-lesionado", "st-justificado", "st-ausente");
            });
            btnEl.classList.add(`st-${estado}`);
        }
    };

    window.marcarTodosPresentesListaPro = function (fecha) {
        const plantel = typeof obtenerPersonasFiltradasDeporte === "function"
            ? obtenerPersonasFiltradasDeporte(true)
            : (basePersonas || []).filter(p => p && p.activo);
        plantel.forEach(p => {
            const estActual = p.asistenciasDetalle?.[fecha]?.estado;
            if (estActual !== "lesionado" && estActual !== "justificado") {
                establecerEstadoAsistenciaFecha(p.id, fecha, "presente");
            }
        });
        abrirModalTomaListaPlantel(fecha);
        mostrarToast("✓ Plantel marcado presente (respetando lesionados/justificados).");
    };

    // =====================================================================
    // 4. GESTOR DE ANATOMÍA, CRECIMIENTO, CARGA sRPE Y LESIONES ESTRUCTURADAS
    // =====================================================================
    window.abrirModalAnatomiaYLesiones = function (idPersona, tabIni = "anatomia") {
        const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
        if (!p) return;
        asegurarEstructuraProPersona(p);

        const hoy = typeof obtenerHoyISO === "function" ? obtenerHoyISO() : new Date().toISOString().split("T")[0];
        const pred = calcularPredisposicionJusta(p, 30);
        const lesiones = [...p.lesionesHistorial].sort((a, b) => String(b.fechaBaja || "").localeCompare(String(a.fechaBaja || "")));

        // Detector automático de reincidencias
        const conteoZonas = {};
        lesiones.forEach(l => {
            const k = `${l.zona} (${l.lado})`;
            conteoZonas[k] = (conteoZonas[k] || 0) + 1;
        });
        const reincidencias = Object.entries(conteoZonas).filter(([, c]) => c >= 2);

        // Detector de velocidad de crecimiento en juveniles
        const snapsConAlt = (p.snapshotsMensuales || []).filter(s => s.altura > 0);
        let alertaCrecimiento = "";
        if (snapsConAlt.length >= 2) {
            const primero = snapsConAlt[0], ultimo = snapsConAlt[snapsConAlt.length - 1];
            const diffCm = Math.round((ultimo.altura - primero.altura) * 10) / 10;
            if (diffCm >= 2.5) {
                alertaCrecimiento = `📏 Creció <b>+${diffCm} cm</b> desde ${primero.fecha} (vigilar sobrecargas en rodillas/talones).`;
            }
        }

        const modal = asegurarModalProEval();
        modal.innerHTML = `
            <div class="modal-window" style="max-width:860px;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-ok">🧬 EXPEDIENTE ANATÓMICO, CARGA Y LESIONES</span>
                        <h3 style="margin-top:4px;">${p.apellido}, ${p.nombre} — ${p.peso} kg / ${p.altura} cm</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalProEval()">✕</button>
                </div>

                <div style="display:flex; gap:0.4rem; flex-wrap:wrap; margin-bottom:0.85rem;">
                    <button type="button" class="btn ${tabIni === "anatomia" ? "btn-primary" : "btn-ghost"} btn-sm" onclick="abrirModalAnatomiaYLesiones(${p.id}, 'anatomia')">📏 Anatomía y Carga sRPE</button>
                    <button type="button" class="btn ${tabIni === "lesiones" ? "btn-primary" : "btn-ghost"} btn-sm" onclick="abrirModalAnatomiaYLesiones(${p.id}, 'lesiones')">🩹 Lesiones (${lesiones.length})</button>
                    <button type="button" class="btn ${tabIni === "predisposicion" ? "btn-primary" : "btn-ghost"} btn-sm" onclick="abrirModalAnatomiaYLesiones(${p.id}, 'predisposicion')">🔥 Rúbrica Predisposición (${pred.pct}%)</button>
                </div>

                ${alertaCrecimiento ? `<div style="background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.4); border-radius:11px; padding:0.55rem 0.8rem; font-size:0.79rem; margin-bottom:0.75rem;">${alertaCrecimiento}</div>` : ""}
                ${reincidencias.length ? `<div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.35); border-radius:11px; padding:0.55rem 0.8rem; font-size:0.79rem; margin-bottom:0.75rem;">⚠️ <b>Alerta de Reincidencia:</b> ${reincidencias.map(([z, c]) => `${z} (${c} veces)`).join(" • ")}</div>` : ""}

                ${tabIni === "anatomia" ? `
                    <form onsubmit="guardarControlAnatomiaPro(event, ${p.id})" style="background:var(--surface-subtle); border:1px solid var(--line-strong); border-radius:14px; padding:0.9rem; margin-bottom:0.9rem;">
                        <div class="grid-4" style="margin-bottom:0.65rem;">
                            <div class="field"><label>Fecha *</label><input type="date" id="peAnaFecha" value="${hoy}" required></div>
                            <div class="field"><label>Peso (kg) *</label><input type="number" step="0.1" id="peAnaPeso" value="${p.peso || 70}" required></div>
                            <div class="field"><label>Altura (cm) *</label><input type="number" step="0.5" id="peAnaAltura" value="${p.altura || 170}" required></div>
                            <div class="field"><label>Estado Médico</label>
                                <select id="peAnaEstado">
                                    <option value="Óptimo" ${p.estadoMedico === "Óptimo" ? "selected" : ""}>🟢 Óptimo</option>
                                    <option value="Sobrecarga / Precaución" ${p.estadoMedico === "Sobrecarga / Precaución" ? "selected" : ""}>🟡 Precaución</option>
                                    <option value="Lesionado (Rehabilitación)" ${p.estadoMedico === "Lesionado (Rehabilitación)" ? "selected" : ""}>🔴 Lesionado</option>
                                </select>
                            </div>
                        </div>
                        <div class="grid-4" style="margin-bottom:0.65rem;">
                            <div class="field"><label>% Grasa (opc.)</label><input type="number" step="0.1" id="peAnaGrasa" value="${p.grasaPct ?? ""}" placeholder="Ej: 12.5"></div>
                            <div class="field"><label>% Músculo (opc.)</label><input type="number" step="0.1" id="peAnaMusc" value="${p.musculoPct ?? ""}" placeholder="Ej: 46.0"></div>
                            <div class="field"><label>RPE Esfuerzo (1-10)</label><input type="number" min="1" max="10" id="peAnaRpe" value="6"></div>
                            <div class="field"><label>Duración Práctica (min)</label><input type="number" min="10" max="240" id="peAnaMin" value="75"></div>
                        </div>
                        <div class="grid-2" style="margin-bottom:0.8rem;">
                            <div class="field"><label>Descanso / Sueño (1-5)</label>
                                <select id="peAnaSueno"><option value="5">5/5 Excelente</option><option value="4" selected>4/5 Bueno</option><option value="3">3/5 Regular</option><option value="2">2/5 Malo</option><option value="1">1/5 Fatiga</option></select>
                            </div>
                            <div class="field"><label>Observación Anatómica / Postural</label><input type="text" id="peAnaNota" placeholder="Ej: Buen tono, cuidar acortamiento isquio..."></div>
                        </div>
                        <button type="submit" class="btn btn-primary btn-sm" style="width:100%;">💾 Guardar Control Anatómico + Snapshot</button>
                    </form>

                    <div class="table-wrap" style="max-height:220px; overflow-y:auto;">
                        <table class="app-table" style="font-size:0.78rem;">
                            <thead><tr><th>Fecha</th><th>Peso / Altura</th><th>Grasa / Músc.</th><th>Carga sRPE</th><th>Nota</th></tr></thead>
                            <tbody>
                                ${[...p.clinico].reverse().slice(0, 10).map(c => `
                                    <tr>
                                        <td><b>${c.fecha}</b></td>
                                        <td>${c.peso} kg / ${c.altura || p.altura} cm</td>
                                        <td>${c.grasaPct != null ? c.grasaPct + "%" : "-"} / ${c.musculoPct != null ? c.musculoPct + "%" : "-"}</td>
                                        <td><span class="badge ${(c.cargaUA || 0) > 650 ? "badge-warn" : "badge-ok"}">RPE ${c.rpe || 5}${c.cargaUA ? ` (${c.cargaUA} UA)` : ""}</span></td>
                                        <td><small>${c.dolor || "-"}</small></td>
                                    </tr>
                                `).join("") || `<tr><td colspan="5"><div class="empty-box" style="padding:0.8rem;">Sin controles cargados aún.</div></td></tr>`}
                            </tbody>
                        </table>
                    </div>
                ` : tabIni === "lesiones" ? `
                    <form onsubmit="guardarLesionEstructurada(event, ${p.id})" style="background:var(--surface-subtle); border:1px solid var(--line-strong); border-radius:14px; padding:0.9rem; margin-bottom:0.9rem;">
                        <div class="grid-3" style="margin-bottom:0.65rem;">
                            <div class="field"><label>Zona Anatómica *</label><select id="peLesZona">${ZONAS_LESION.map(z => `<option>${z}</option>`).join("")}</select></div>
                            <div class="field"><label>Lado *</label><select id="peLesLado"><option>Izquierdo</option><option>Derecho</option><option>Bilateral / Central</option></select></div>
                            <div class="field"><label>Tipo de Lesión *</label><select id="peLesTipo">${TIPOS_LESION.map(t => `<option>${t}</option>`).join("")}</select></div>
                        </div>
                        <div class="grid-3" style="margin-bottom:0.65rem;">
                            <div class="field"><label>Fecha de Baja *</label><input type="date" id="peLesBaja" value="${hoy}" required></div>
                            <div class="field"><label>Fecha de Alta (vacío si sigue activo)</label><input type="date" id="peLesAlta"></div>
                            <div class="field"><label>Gravedad</label><select id="peLesGrav"><option value="Leve (1-7d)">🟡 Leve</option><option value="Moderada (1-4 sem)">🟠 Moderada</option><option value="Grave (+1 mes)">🔴 Grave</option></select></div>
                        </div>
                        <div class="field" style="margin-bottom:0.75rem;"><label>Indicación / Protocolo de Readaptación</label><input type="text" id="peLesNota" placeholder="Ej: Sin impacto por 10 días, fortalecer excéntricos..."></div>
                        <button type="submit" class="btn btn-danger btn-sm" style="width:100%;">🩹 Registrar Lesión en Historial Clínico</button>
                    </form>

                    <div style="display:flex; flex-direction:column; gap:0.5rem; max-height:240px; overflow-y:auto;">
                        ${lesiones.length === 0 ? `<div class="empty-box" style="padding:1rem;">🟢 Sin historial de lesiones registradas.</div>` :
                        lesiones.map(l => {
                            const fIni = new Date(l.fechaBaja || hoy);
                            const fFin = l.fechaAlta ? new Date(l.fechaAlta) : new Date();
                            const dias = Math.max(0, Math.round((fFin - fIni) / 86400000));
                            return `
                                <div class="pe-injury-card ${l.fechaAlta ? "alta" : ""}">
                                    <div>
                                        <strong>${l.zona} (${l.lado}) — ${l.tipo}</strong>
                                        <span class="badge ${l.fechaAlta ? "badge-ok" : "badge-danger"}" style="margin-left:4px;">${l.fechaAlta ? `✓ Alta (${dias} días)` : `🔴 En recuperación (${dias} días)`}</span>
                                        <div style="color:var(--ink-600); font-size:0.75rem; margin-top:2px;">Baja: ${l.fechaBaja}${l.fechaAlta ? ` • Alta: ${l.fechaAlta}` : ""} • ${l.gravedad || ""} ${l.nota ? `• ${l.nota}` : ""}</div>
                                    </div>
                                    <div style="display:flex; gap:0.3rem;">
                                        ${!l.fechaAlta ? `<button type="button" class="btn btn-ok btn-sm" onclick="darAltaLesionPro(${p.id}, ${l.id})">✓ Dar Alta Hoy</button>` : ""}
                                        <button type="button" class="btn btn-danger btn-sm" onclick="eliminarLesionPro(${p.id}, ${l.id})">🗑️</button>
                                    </div>
                                </div>
                            `;
                        }).join("")}
                    </div>
                ` : `
                    <div style="background:var(--surface-subtle); border:1px solid var(--line-strong); border-radius:14px; padding:0.9rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.7rem;">
                            <div>
                                <strong style="font-size:0.9rem;">🔥 Evaluación Objetiva de Predisposición (4 Criterios)</strong>
                                <small style="display:block; color:var(--ink-500);">Asistencia justa últimos 30d: <b>${pred.pct}%</b> (✓${pred.cont.presente} ⏰${pred.cont.tarde} 🏥${pred.cont.lesionado} 📄${pred.cont.justificado} ✕${pred.cont.ausente})</small>
                            </div>
                            <span id="peRubricaTotal" class="badge badge-purple" style="font-size:0.9rem;">Nota Actitud: ${(p.pilares?.actitud || 7.5).toFixed(1)}/10</span>
                        </div>

                        <div class="pe-rubrica-grid">
                            <div class="pe-rubrica-item"><div style="display:flex; justify-content:space-between;"><b>⏰ Puntualidad</b><span id="rVal1">8.0</span></div><input type="range" id="peRub1" min="1" max="10" step="0.5" value="${p.rubricaPredisposicion?.puntualidad || 8}" style="width:100%;" oninput="recalcRubricaPred()"></div>
                            <div class="pe-rubrica-item"><div style="display:flex; justify-content:space-between;"><b>⚡ Intensidad en Entreno</b><span id="rVal2">8.0</span></div><input type="range" id="peRub2" min="1" max="10" step="0.5" value="${p.rubricaPredisposicion?.intensidad || 8}" style="width:100%;" oninput="recalcRubricaPred()"></div>
                            <div class="pe-rubrica-item"><div style="display:flex; justify-content:space-between;"><b>🤝 Respeto y Compañerismo</b><span id="rVal3">8.5</span></div><input type="range" id="peRub3" min="1" max="10" step="0.5" value="${p.rubricaPredisposicion?.respeto || 8.5}" style="width:100%;" oninput="recalcRubricaPred()"></div>
                            <div class="pe-rubrica-item"><div style="display:flex; justify-content:space-between;"><b>🧠 Receptividad / Escucha</b><span id="rVal4">8.0</span></div><input type="range" id="peRub4" min="1" max="10" step="0.5" value="${p.rubricaPredisposicion?.receptividad || 8}" style="width:100%;" oninput="recalcRubricaPred()"></div>
                        </div>

                        <div class="field" style="margin-bottom:0.75rem;"><label>Nota de Conducta / Compromiso (queda en el expediente escrito)</label><input type="text" id="peRubNota" value="${(p.rubricaPredisposicion?.nota || "").replace(/"/g, "&quot;")}" placeholder="Ej: Muy predispuesto, ayuda a ordenar elementos..."></div>
                        <button type="button" class="btn btn-primary btn-sm" style="width:100%;" onclick="guardarRubricaPredisposicion(${p.id})">💾 Guardar Predisposición y Actualizar Pilar Actitud</button>
                    </div>
                `}
            </div>
        `;
        modal.classList.remove("hidden");
        if (tabIni === "predisposicion") recalcRubricaPred();
    };

    window.recalcRubricaPred = function () {
        const v1 = parseFloat(document.getElementById("peRub1")?.value) || 8;
        const v2 = parseFloat(document.getElementById("peRub2")?.value) || 8;
        const v3 = parseFloat(document.getElementById("peRub3")?.value) || 8;
        const v4 = parseFloat(document.getElementById("peRub4")?.value) || 8;
        if (document.getElementById("rVal1")) document.getElementById("rVal1").textContent = v1.toFixed(1);
        if (document.getElementById("rVal2")) document.getElementById("rVal2").textContent = v2.toFixed(1);
        if (document.getElementById("rVal3")) document.getElementById("rVal3").textContent = v3.toFixed(1);
        if (document.getElementById("rVal4")) document.getElementById("rVal4").textContent = v4.toFixed(1);
        const prom = Math.round(((v1 + v2 + v3 + v4) / 4) * 10) / 10;
        if (document.getElementById("peRubricaTotal")) document.getElementById("peRubricaTotal").textContent = `Nota Actitud: ${prom.toFixed(1)}/10`;
    };

    window.guardarRubricaPredisposicion = function (idPersona) {
        const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
        if (!p) return;
        const puntualidad = parseFloat(document.getElementById("peRub1")?.value) || 8;
        const intensidad = parseFloat(document.getElementById("peRub2")?.value) || 8;
        const respeto = parseFloat(document.getElementById("peRub3")?.value) || 8;
        const receptividad = parseFloat(document.getElementById("peRub4")?.value) || 8;
        const nota = (document.getElementById("peRubNota")?.value || "").trim();
        const prom = Math.round(((puntualidad + intensidad + respeto + receptividad) / 4) * 10) / 10;

        p.rubricaPredisposicion = { puntualidad, intensidad, respeto, receptividad, promedio: prom, nota, fecha: obtenerHoyISO() };
        if (p.deporte !== "Gimnasio" && p.pilares) {
            const ant = p.puntosCategoria;
            p.pilares.actitud = prom;
            recalcularPuntajePonderado(p);
            if (typeof registrarEventoScore32 === "function") {
                registrarEventoScore32(p, ant, p.puntosCategoria, "Rúbrica Predisposición", nota || `Actitud ${prom}/10`);
            }
        }
        registrarSnapshotPersona(p, "Rúbrica Predisposición");
        guardarDatosCDM();
        cerrarModalProEval();
        mostrarToast(`🔥 Predisposición guardada (Actitud: ${prom}/10).`);
        if (document.body.dataset.page === "perfil-individual" && typeof inicializarPaginaJugadorIndividual === "function") inicializarPaginaJugadorIndividual();
    };

    window.guardarControlAnatomiaPro = function (e, idPersona) {
        e.preventDefault();
        const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
        if (!p) return;
        asegurarEstructuraProPersona(p);

        const fecha = document.getElementById("peAnaFecha").value || obtenerHoyISO();
        const peso = parseFloat(document.getElementById("peAnaPeso").value) || p.peso;
        const altura = parseFloat(document.getElementById("peAnaAltura").value) || p.altura;
        const grasa = document.getElementById("peAnaGrasa").value !== "" ? parseFloat(document.getElementById("peAnaGrasa").value) : null;
        const musc = document.getElementById("peAnaMusc").value !== "" ? parseFloat(document.getElementById("peAnaMusc").value) : null;
        const rpe = parseInt(document.getElementById("peAnaRpe").value, 10) || 6;
        const mins = parseInt(document.getElementById("peAnaMin").value, 10) || 60;
        const sueno = parseInt(document.getElementById("peAnaSueno").value, 10) || 4;
        const estado = document.getElementById("peAnaEstado").value;
        const nota = (document.getElementById("peAnaNota").value || "").trim();

        p.peso = peso;
        p.altura = altura;
        if (grasa !== null) p.grasaPct = grasa;
        if (musc !== null) p.musculoPct = musc;
        p.estadoMedico = estado;

        p.clinico.push({
            id: Date.now(), fecha, peso, altura, grasaPct: grasa, musculoPct: musc,
            rpe, minutos: mins, cargaUA: rpe * mins, sueno, dolor: nota || estado
        });
        registrarSnapshotPersona(p, "Control Anatómico");
        guardarDatosCDM();
        mostrarToast(`🧬 Control anatómico guardado (Carga: ${rpe * mins} UA).`);
        abrirModalAnatomiaYLesiones(p.id, "anatomia");
        if (document.body.dataset.page === "perfil-individual" && typeof inicializarPaginaJugadorIndividual === "function") inicializarPaginaJugadorIndividual();
    };

    window.guardarLesionEstructurada = function (e, idPersona) {
        e.preventDefault();
        const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
        if (!p) return;
        asegurarEstructuraProPersona(p);

        const nueva = {
            id: Date.now(),
            zona: document.getElementById("peLesZona").value,
            lado: document.getElementById("peLesLado").value,
            tipo: document.getElementById("peLesTipo").value,
            fechaBaja: document.getElementById("peLesBaja").value || obtenerHoyISO(),
            fechaAlta: document.getElementById("peLesAlta").value || "",
            gravedad: document.getElementById("peLesGrav").value,
            nota: (document.getElementById("peLesNota").value || "").trim()
        };
        p.lesionesHistorial.unshift(nueva);
        if (!nueva.fechaAlta) p.estadoMedico = "Lesionado (Rehabilitación)";
        guardarDatosCDM();
        mostrarToast(`🩹 Lesión registrada (${nueva.zona} - ${nueva.lado}).`);
        abrirModalAnatomiaYLesiones(p.id, "lesiones");
        if (document.body.dataset.page === "perfil-individual" && typeof inicializarPaginaJugadorIndividual === "function") inicializarPaginaJugadorIndividual();
    };

    window.darAltaLesionPro = function (idPersona, idLes) {
        const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
        if (!p) return;
        const l = (p.lesionesHistorial || []).find(x => Number(x.id) === Number(idLes));
        if (l) l.fechaAlta = obtenerHoyISO();
        const quedanActivas = (p.lesionesHistorial || []).some(x => !x.fechaAlta);
        if (!quedanActivas) p.estadoMedico = "Óptimo";
        guardarDatosCDM();
        mostrarToast("🟢 Alta deportiva registrada.");
        abrirModalAnatomiaYLesiones(p.id, "lesiones");
        if (document.body.dataset.page === "perfil-individual" && typeof inicializarPaginaJugadorIndividual === "function") inicializarPaginaJugadorIndividual();
    };

    window.eliminarLesionPro = function (idPersona, idLes) {
        if (!confirm("🗑️ ¿Quitar este registro de lesión?")) return;
        const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
        if (!p) return;
        p.lesionesHistorial = (p.lesionesHistorial || []).filter(x => Number(x.id) !== Number(idLes));
        guardarDatosCDM();
        abrirModalAnatomiaYLesiones(p.id, "lesiones");
    };

    // =====================================================================
    // 5. TESTS DE CAMPO EN JUGADOR.HTML (YO-YO TEST / RESISTENCIA / AGILIDAD)
    // =====================================================================
    function enriquecerSelectorTestsCampo() {
        const sel = document.getElementById("evTipo");
        if (!sel || sel.querySelector('option[value="distancia_m"]')) return;
        sel.insertAdjacentHTML("beforeend", `
            <option value="distancia_m">🏃 Resistencia / Campo (metros — Yo-Yo / Cooper)</option>
            <option value="agilidad_seg">⚡ Agilidad / Cambio Dirección (seg — Illinois / 5-0-5)</option>
        `);

        const dl = document.getElementById("listaEjerciciosSugeridos");
        if (dl && !dl.innerHTML.includes("Yo-Yo Test")) {
            dl.insertAdjacentHTML("beforeend", `
                <option value="Yo-Yo Test IR1 (Resistencia)">
                <option value="Test 1000 metros">
                <option value="Test Agilidad Illinois">
                <option value="Test 5-0-5 Cambio de Dirección">
            `);
        }
    }

    // Hook sobre registrarAvanceJugador para soportar distancia_m y agilidad_seg + snapshot
    function enlazarHooksEvaluacionPro() {
        if (window.__proEvalHooksListos) return;
        window.__proEvalHooksListos = true;

        if (typeof window.cambiarTipoMedicion === "function") {
            const _origCamb = window.cambiarTipoMedicion;
            window.cambiarTipoMedicion = function () {
                _origCamb.apply(this, arguments);
                const tipo = document.getElementById("evTipo")?.value;
                const lbl = document.getElementById("lblEvValor");
                if (lbl && tipo === "distancia_m") lbl.innerText = "Distancia Recorrida (metros) *";
                if (lbl && tipo === "agilidad_seg") lbl.innerText = "Tiempo Agilidad (segundos) *";
            };
        }

        if (typeof window.registrarAvanceJugador === "function") {
            const _origReg = window.registrarAvanceJugador;
            window.registrarAvanceJugador = function (e) {
                const tipo = document.getElementById("evTipo")?.value;
                if (tipo === "distancia_m" || tipo === "agilidad_seg") {
                    e.preventDefault();
                    const p = typeof obtenerJugadorActualPorURL === "function" ? obtenerJugadorActualPorURL() : null;
                    if (!p) return;
                    const fecha = document.getElementById("evFecha")?.value || obtenerHoyISO();
                    const ej = (document.getElementById("evEjercicio")?.value || "").trim() || (tipo === "distancia_m" ? "Yo-Yo Test IR1" : "Test Agilidad");
                    const val = parseFloat(document.getElementById("evValor")?.value) || 0;
                    const nota = (document.getElementById("evNota")?.value || "").trim();
                    const unidad = tipo === "distancia_m" ? "m" : "seg";
                    const tipoInterno = tipo === "agilidad_seg" ? "tiempo_seg" : "distancia_m";
                    p.evaluaciones.push({ id: Date.now(), fecha, ejercicio: ej, tipo: tipoInterno, valor: val, unidad, detalle: `${val} ${unidad}`, nota: nota || "Test de Campo" });
                    p.evaluaciones.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
                    registrarSnapshotPersona(p, `Test ${ej}`);
                    guardarDatosCDM();
                    if (document.getElementById("evValor")) document.getElementById("evValor").value = "";
                    mostrarToast(`🏃 Test de campo guardado: ${ej} (${val} ${unidad})`);
                    if (typeof inicializarPaginaJugadorIndividual === "function") inicializarPaginaJugadorIndividual();
                    return;
                }
                _origReg.apply(this, arguments);
                const p = typeof obtenerJugadorActualPorURL === "function" ? obtenerJugadorActualPorURL() : null;
                if (p) { registrarSnapshotPersona(p, "Marca Física"); guardarDatosCDM(); }
            };
        }

        if (typeof window.guardarScoreModalFicha === "function") {
            const _origScore = window.guardarScoreModalFicha;
            window.guardarScoreModalFicha = function (e, idPersona) {
                _origScore.apply(this, arguments);
                const p = (basePersonas || []).find(x => Number(x.id) === Number(idPersona));
                if (p) { registrarSnapshotPersona(p, "Evaluación Score 360°"); guardarDatosCDM(); }
            };
        }
    }

    // =====================================================================
    // 6. BASE DE DATOS ESCRITA (EXCEL CSV) + BOLETÍN DEL PLANTEL (PDF A4)
    // =====================================================================
    window.exportarBaseEscritaExcelCSV = function (soloCategoriaActual = false) {
        const lista = soloCategoriaActual && typeof obtenerPersonasFiltradasDeporte === "function" && deportePagina
            ? obtenerPersonasFiltradasDeporte(true)
            : (basePersonas || []).filter(p => p && p.activo);

        if (!lista.length) return alert("No hay personas activas para exportar.");

        const headers = [
            "Apellido", "Nombre", "DNI", "Fecha Nac.", "Edad", "Deporte", "Categoria", "Puesto",
            "Altura (cm)", "Peso (kg)", "% Grasa", "% Musculo", "Estado Medico",
            "Lesiones Activas", "Lesiones Totales", "Predisposicion 30d (%)",
            "Score Global (1-10)", "Pilar Fisico", "Pilar Gym", "Pilar Tecnico", "Pilar Actitud",
            "Partidos (PJ)", "Goles", "Asistencias", "Marcas Cargadas", "Cuota", "Estado Cuota"
        ];

        const esc = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
        let csv = headers.map(esc).join(";") + "\n";

        lista.forEach(p => {
            asegurarEstructuraProPersona(p);
            const pred = calcularPredisposicionJusta(p, 30);
            const lesAct = p.lesionesHistorial.filter(l => !l.fechaAlta).length;
            const an = typeof analizarJugador360Admin32 === "function" ? analizarJugador360Admin32(p) : { partidosStats: { pj: 0, goles: 0, asistencias: 0 } };
            const fila = [
                p.apellido, p.nombre, p.dni, p.fechaNacimiento || "", typeof calcularEdadExacta === "function" ? calcularEdadExacta(p) : p.edad,
                p.deporte, p.categoria, p.puesto, p.altura, p.peso, p.grasaPct ?? "", p.musculoPct ?? "",
                p.estadoMedico || "Óptimo", lesAct, p.lesionesHistorial.length, `${pred.pct}%`,
                p.deporte === "Gimnasio" ? "-" : (p.puntosCategoria || ""),
                p.pilares?.fisico ?? "", p.pilares?.gym ?? "", p.pilares?.tecnico ?? "", p.pilares?.actitud ?? "",
                an.partidosStats.pj, an.partidosStats.goles, an.partidosStats.asistencias,
                (p.evaluaciones || []).length, p.montoCuota || 0, p.pagoEstado || "Al Día"
            ];
            csv += fila.map(esc).join(";") + "\n";
        });

        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const a = document.createElement("a");
        const suf = soloCategoriaActual && deportePagina ? `${deportePagina}_${categoriaActiva}` : "club_completo";
        a.href = URL.createObjectURL(blob);
        a.download = `base_datos_escrita_${suf.replace(/\s+/g, "_")}_${obtenerHoyISO()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        mostrarToast(`📊 Base de datos escrita descargada (${lista.length} personas en Excel CSV).`);
    };

    window.abrirBoletinPlantelPDF = function (depForzado = null, catForzada = null) {
        const dep = depForzado || (typeof deportePagina !== "undefined" ? deportePagina : null);
        const cat = catForzada || (typeof categoriaActiva !== "undefined" ? categoriaActiva : "Sub 13");
        const esGym = dep === "Gimnasio";

        let lista = [];
        if (dep) {
            lista = (basePersonas || []).filter(p => {
                if (!p || !p.activo) return false;
                if (esGym) return p.deporte === "Gimnasio";
                return (p.deporte === dep && p.categoria === cat) ||
                    (p.categoriasExtra || []).some(ce => ce.deporte === dep && ce.categoria === cat);
            });
        } else {
            lista = (basePersonas || []).filter(p => p && p.activo);
        }

        if (!lista.length) return alert("No hay deportistas activos en esta categoría para generar el informe.");
        lista.forEach(p => asegurarEstructuraProPersona(p));

        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : { nombreEntidad: "Club Deportivo" };
        const titulo = dep ? `${dep} — ${esGym ? "Socios Activos" : cat}` : "Padrón General";
        const promPred = Math.round(lista.reduce((a, p) => a + calcularPredisposicionJusta(p, 30).pct, 0) / lista.length);
        const lesionados = lista.filter(p => (p.lesionesHistorial || []).some(l => !l.fechaAlta) || (p.estadoMedico && p.estadoMedico !== "Óptimo"));
        const promScore = !esGym
            ? (lista.reduce((a, p) => a + (Number(p.puntosCategoria) || 7), 0) / lista.length).toFixed(1)
            : null;

        const ord = [...lista].sort((a, b) => (b.puntosCategoria || 0) - (a.puntosCategoria || 0) || a.apellido.localeCompare(b.apellido));
        const obsClave = `cdm_obs_cat_pdf_${dep || "all"}_${cat || "all"}`;
        const obsGuardada = localStorage.getItem(obsClave) || `Plantel de ${lista.length} integrantes con predisposición promedio del ${promPred}% y ${lesionados.length} caso(s) en seguimiento médico.`;

        const htmlHoja = `
            <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:2.5px solid #0284c7; padding-bottom:0.75rem; margin-bottom:0.95rem; flex-wrap:wrap; gap:0.6rem;">
                <div>
                    <div style="font-size:0.68rem; font-weight:800; color:#0284c7; text-transform:uppercase;">INFORME GENERAL DE CATEGORÍA — BASE OFICIAL</div>
                    <h2 style="margin:2px 0; font-size:1.32rem; font-weight:900; color:#0f172a;">${lic.nombreEntidad} — ${titulo}</h2>
                    <small style="color:#475569;">Emitido el ${new Date().toLocaleDateString("es-AR")} • Evaluados: <b>${lista.length}</b></small>
                </div>
                <div style="text-align:right; font-size:0.78rem; color:#334155;">
                    ${promScore ? `<div><b>Score Promedio:</b> ${promScore} / 10</div>` : ""}
                    <div><b>Predisposición Media (30d):</b> ${promPred}%</div>
                    <div><b>Aptos / En Seguimiento:</b> ${lista.length - lesionados.length} / ${lesionados.length}</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>#</th><th>Deportista</th><th>Edad</th><th>Peso / Alt.</th><th>Predisp. 30d</th>
                        ${!esGym ? `<th>Fís / Gym / Téc / Act</th><th>Score</th>` : `<th>Marcas</th>`}
                        <th>Salud y Lesiones</th>
                    </tr>
                </thead>
                <tbody>
                    ${ord.map((p, idx) => {
                        const pred = calcularPredisposicionJusta(p, 30);
                        const lesAct = (p.lesionesHistorial || []).filter(l => !l.fechaAlta);
                        const txtSalud = lesAct.length
                            ? `🔴 ${lesAct.map(l => `${l.zona} (${l.lado})`).join(", ")}`
                            : (p.estadoMedico && p.estadoMedico !== "Óptimo" ? `🟡 ${p.estadoMedico}` : `🟢 Apto`);
                        return `
                            <tr>
                                <td><b>${idx + 1}</b></td>
                                <td><b>${p.apellido}, ${p.nombre}</b><br><small style="color:#64748b;">${p.puesto || "-"}</small></td>
                                <td>${typeof calcularEdadExacta === "function" ? calcularEdadExacta(p) : p.edad}a</td>
                                <td>${p.peso}kg / ${p.altura}cm</td>
                                <td><b>${pred.pct}%</b> (${pred.etiqueta})</td>
                                ${!esGym
                                    ? `<td>${p.pilares?.fisico ?? "-"} / ${p.pilares?.gym ?? "-"} / ${p.pilares?.tecnico ?? "-"} / ${p.pilares?.actitud ?? "-"}</td><td><b>${p.puntosCategoria}/10</b></td>`
                                    : `<td>${(p.evaluaciones || []).length} reg.</td>`}
                                <td>${txtSalud}</td>
                            </tr>
                        `;
                    }).join("")}
                </tbody>
            </table>

            <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:10px; padding:0.7rem 0.9rem; margin-top:0.8rem; font-size:0.8rem;">
                <b>✍️ Observaciones Generales del Profesor:</b> <span id="peObsCatLive">${obsGuardada}</span>
            </div>

            <div style="display:flex; justify-content:space-between; margin-top:1.3rem; padding-top:0.7rem; border-top:1px dashed #cbd5e1; font-size:0.75rem; color:#475569;">
                <span>_____________________________<br>Firma Profesor / Coordinador</span>
                <span style="text-align:right;">${lic.nombreEntidad}<br>Archivo Institucional</span>
            </div>
        `;

        const modal = asegurarModalProEval();
        modal.innerHTML = `
            <div class="modal-window" style="max-width:960px;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-purple">📊 INFORME COMPLETO DE CATEGORÍA</span>
                        <h3 style="margin-top:4px;">${titulo} (${lista.length})</h3>
                    </div>
                    <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="exportarBaseEscritaExcelCSV(true)">📊 Excel CSV</button>
                        <button type="button" class="btn btn-primary btn-sm" onclick="imprimirBoletinCategoriaActual()">🖨️ Imprimir / Guardar PDF</button>
                        <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalProEval()">✕</button>
                    </div>
                </div>

                <div style="background:var(--surface-subtle); border:1px solid var(--line-strong); border-radius:11px; padding:0.55rem 0.8rem; margin-bottom:0.75rem;">
                    <label style="font-size:0.71rem; font-weight:800; display:block; margin-bottom:3px;">✍️ Observaciones Generales de la Categoría (editable antes de imprimir):</label>
                    <textarea rows="2" style="width:100%; font-size:0.81rem;" oninput="document.getElementById('peObsCatLive').innerText=this.value; localStorage.setItem('${obsClave}', this.value);">${obsGuardada}</textarea>
                </div>

                <div id="pePreviewHojaCat" class="jf-pdf-sheet">${htmlHoja}</div>
            </div>
        `;
        modal.classList.remove("hidden");
    };

    window.imprimirBoletinCategoriaActual = function () {
        const hoja = document.getElementById("pePreviewHojaCat");
        if (!hoja) return;
        if (typeof imprimirDocumentoA4Limpio === "function") imprimirDocumentoA4Limpio(hoja.innerHTML);
        else imprimirContenidoModalProEval();
    };

    
    // =====================================================================
    // 7. INYECCIÓN LIMPIA DE ACCESOS EN DEPORTES, GYM Y JUGADOR.HTML
    // =====================================================================
    function inyectarBotonesProEvalEnPantallas() {
        if (document.body?.getAttribute("data-rol") === "usuario" || document.body?.classList.contains("login-page")) return;

        enriquecerSelectorTestsCampo();
        enlazarHooksEvaluacionPro();

        // A) En Fútbol, Hockey y Gimnasio: barra rápida arriba del plantel
        const gridPlantel = document.getElementById("gridJugadoresDeporte");
        if (gridPlantel && !document.getElementById("pePlantelToolbar")) {
            const bar = document.createElement("div");
            bar.id = "pePlantelToolbar";
            bar.className = "pe-toolbar";
            bar.innerHTML = `
                <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalTomaListaPlantel()">📋 Tomar Lista (5 Estados)</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="abrirBoletinPlantelPDF()">📄 Boletín del Plantel (PDF)</button>
                <button type="button" class="btn btn-ghost btn-sm" onclick="exportarBaseEscritaExcelCSV(true)">📊 Exportar Excel (CSV)</button>
            `;
            gridPlantel.parentNode.insertBefore(bar, gridPlantel);
        }

        // B) En jugador.html (Admin): botón directo de Anatomía / Lesiones / Predisposición en la cabecera
        if (document.body?.dataset.page === "perfil-individual" && document.body.getAttribute("data-rol") !== "usuario") {
            const p = typeof obtenerJugadorActualPorURL === "function" ? obtenerJugadorActualPorURL() : null;
            const actions = document.querySelector("#fichaCabeceraJugador .cab33-actions");
            if (p && actions && !document.getElementById("btnProAnaLesionesCab")) {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.id = "btnProAnaLesionesCab";
                btn.className = "btn btn-secondary btn-sm";
                btn.onclick = () => abrirModalAnatomiaYLesiones(p.id, "anatomia");
                btn.innerHTML = "🧬 Anatomía / Lesiones";
                actions.insertBefore(btn, actions.lastElementChild);
            }
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(inyectarBotonesProEvalEnPantallas, 280);
        setTimeout(inyectarBotonesProEvalEnPantallas, 750);
    });
    document.addEventListener("click", () => {
        setTimeout(inyectarBotonesProEvalEnPantallas, 120);
    });
})();