/**
 * js/base-general.js — Padrón Maestro por Años Cumplidos, Migraciones,
 * Modal Único de Persona y Base Maestra de Ejercicios (con Patrón Biomecánico)
 * CDM Pro Suite — Desarrollado por Gonzalo Adanchú
 */

(function () {
    const RANGOS_EDAD_CATEGORIA = {
        "Sub 13": { min: 6, max: 13 },
        "Sub 15": { min: 13, max: 15 },
        "Sub 17": { min: 15, max: 17 },
        "Reserva": { min: 16, max: 23 },
        "Primera": { min: 16, max: 60 }
    };
    const CATEGORIAS_ESTANDAR = ["Sub 13", "Sub 15", "Sub 17", "Reserva", "Primera"];

    const PATRONES_HOMBRECITO = [
        { clave: "squat", label: "🦵 Sentadilla / Piernas (Squat)" },
        { clave: "bench", label: "🏋️ Empuje Horizontal / Press Banca" },
        { clave: "deadlift", label: "⛓️ Bisagra de Cadera / Peso Muerto" },
        { clave: "thrust", label: "🍑 Empuje de Cadera / Hip Thrust" },
        { clave: "lunge", label: "⚡ Estocada / Búlgara / Unilateral" },
        { clave: "row", label: "🚣 Tracción Horizontal / Remo" },
        { clave: "pull", label: "🧗 Tracción Vertical / Dominadas" },
        { clave: "ohp", label: "🙌 Empuje Vertical / Hombros" },
        { clave: "plank", label: "🧱 Core / Plancha / Zona Media" },
        { clave: "jump", label: "🦘 Salto / Pliometría / Velocidad" }
    ];

    // Estilos de Base General y herramientas de categoría
    if (!document.getElementById("cdmCssBaseGeneral")) {
        const st = document.createElement("style");
        st.id = "cdmCssBaseGeneral";
        st.textContent = `
            .bg37-cat-tools { display: flex; gap: 0.45rem; flex-wrap: wrap; align-items: center; margin-left: auto; }
            .bg37-age-pills { display: flex; gap: 0.35rem; flex-wrap: wrap; margin-bottom: 0.85rem; }
            .bg37-age-pill {
                border: 1.5px solid var(--line-strong, #cbd5e1);
                background: var(--surface-solid, #fff);
                color: var(--ink-700, #334155);
                font-size: 0.74rem;
                font-weight: 800;
                padding: 0.3rem 0.68rem;
                border-radius: 999px;
                cursor: pointer;
            }
            .bg37-age-pill.active, .bg37-age-pill:hover { background: #0284c7; border-color: #0284c7; color: #ffffff; }
            .bg37-pick-list { max-height: 310px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.42rem; margin-bottom: 0.9rem; }
            .bg37-pick-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 0.65rem;
                flex-wrap: wrap;
                padding: 0.55rem 0.75rem;
                background: var(--surface-solid, #fff);
                border: 1.5px solid var(--line, #e2e8f0);
                border-radius: 12px;
                cursor: pointer;
            }
            .bg37-pick-row:hover, .bg37-pick-row.selected { border-color: #0284c7; background: var(--cdm-50, #f0f9ff); }
            @media (max-width: 720px) {
                .bg37-cat-tools { width: 100%; margin-left: 0; margin-top: 0.5rem; }
                .bg37-cat-tools button { flex: 1; }
            }
        `;
        document.head.appendChild(st);
    }

    function obtenerDeportesDisponibles() {
        const set = new Set(["Futbol", "Hockey", "Gimnasio"]);
        const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
        (lic.deportesExtra || []).forEach(d => {
            const limpio = String(d).replace(/^[^\wÁÉÍÓÚáéíóúÑñ]+/, "").trim();
            if (limpio) set.add(limpio);
        });
        (basePersonas || []).forEach(p => { if (p?.deporte) set.add(p.deporte); });
        return Array.from(set);
    }

    // =====================================================================
    // 1. FILTRO OFICIAL DE PLANTEL POR DEPORTE Y CATEGORÍA (CON DOBLE CAT.)
    // =====================================================================
    window.obtenerPersonasFiltradasDeporte = function (soloActivos = false) {
        if (!deportePagina || !Array.isArray(basePersonas)) return [];
        const esGym = deportePagina === "Gimnasio";
        return basePersonas.filter(p => {
            if (!p) return false;
            if (soloActivos && !p.activo) return false;
            if (esGym) {
                return p.deporte === "Gimnasio" || (p.categoriasExtra || []).some(ce => ce.deporte === "Gimnasio");
            }
            const enBase = p.deporte === deportePagina && p.categoria === categoriaActiva;
            const enExtra = (p.categoriasExtra || []).some(ce => ce.deporte === deportePagina && ce.categoria === categoriaActiva);
            return enBase || enExtra;
        });
    };

    // =====================================================================
    // 2. MODAL ÚNICO DE ALTA / EDICIÓN DE PERSONA (CON FECHA DE NACIMIENTO)
    // =====================================================================
    function construirHTMLModalPersona() {
        const modal = document.getElementById("modalPersona");
        if (!modal) return;
        modal.innerHTML = `
            <div class="modal-window" style="max-width:660px;">
                <div class="modal-top">
                    <h3 id="tituloModal" style="color:var(--ink-900);">Ficha de Deportista / Socio</h3>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalPersona()">✕</button>
                </div>
                <form id="formPersonaCDM" onsubmit="guardarPersonaCDM(event)">
                    <input type="hidden" id="pId">
                    <input type="hidden" id="pFotoData">

                    <div style="display:flex; align-items:center; justify-content:space-between; gap:0.85rem; flex-wrap:wrap; background:var(--surface-subtle); border:1px solid var(--line-strong); padding:0.7rem 0.9rem; border-radius:15px; margin-bottom:0.8rem;">
                        <div style="display:flex; align-items:center; gap:0.75rem;">
                            <div id="previewAvatarModalPersona" class="ath-avatar has-photo" style="width:54px; height:54px; border-radius:15px; font-size:1.2rem;"><span>👤</span></div>
                            <div>
                                <strong style="font-size:0.84rem; display:block;">📷 Foto de Perfil (Opcional)</strong>
                                <small style="color:var(--ink-500); font-size:0.72rem;">Se comprime automáticamente.</small>
                            </div>
                        </div>
                        <div style="display:flex; gap:0.4rem;">
                            <label class="btn btn-secondary btn-sm" style="cursor:pointer;">
                                <i class="ri-upload-2-line"></i> Subir Foto
                                <input type="file" accept="image/*" onchange="cargarFotoEnModalPersonaCDM(event)" style="display:none;">
                            </label>
                            <button type="button" id="btnQuitarFotoModalPersona" class="btn btn-danger btn-sm hidden" onclick="quitarFotoEnModalPersonaCDM()">Quitar</button>
                        </div>
                    </div>

                    <div class="grid-3" style="margin-bottom:0.7rem;">
                        <div class="field"><label>Área / Deporte *</label><select id="pDeporte" required></select></div>
                        <div class="field" id="wrapPCategoria">
                            <label>Categoría *</label>
                            <select id="pCategoria">
                                ${CATEGORIAS_ESTANDAR.map(c => `<option value="${c}">${c}</option>`).join("")}
                            </select>
                        </div>
                        <div class="field">
                            <label>Puesto / Plan Gym *</label>
                            <input type="text" id="pPuesto" list="listaPuestosSugeridosModal" required placeholder="Ej: Delantero / Musculación">
                            <datalist id="listaPuestosSugeridosModal">
                                <option value="Musculación e Hipertrofia"><option value="Fuerza y Potencia"><option value="Funcional, Core y Salud">
                                <option value="Arquero / Arquera"><option value="Marcador Central"><option value="Lateral Derecho"><option value="Lateral Izquierdo">
                                <option value="Volante Central"><option value="Enganche / Interior"><option value="Extremo / Wing"><option value="Centrodelantero">
                            </datalist>
                        </div>
                    </div>

                    <div class="grid-3" style="margin-bottom:0.7rem;">
                        <div class="field"><label>Nombre *</label><input type="text" id="pNombre" required></div>
                        <div class="field"><label>Apellido *</label><input type="text" id="pApellido" required></div>
                        <div class="field"><label>DNI *</label><input type="text" id="pDni" required></div>
                    </div>

                    <div class="grid-4" style="margin-bottom:0.7rem;">
                        <div class="field"><label>WhatsApp *</label><input type="tel" id="pWhatsapp" required placeholder="5493584..."></div>
                        <div class="field">
                            <label>Fecha de Nac. *</label>
                            <input type="date" id="pFechaNac" oninput="sincronizarEdadDesdeFechaNacModal()">
                        </div>
                        <div class="field"><label>Años Cumplidos *</label><input type="number" id="pEdad" required min="5" max="90" value="15"></div>
                        <div class="field">
                            <label>Sangre</label>
                            <select id="pSangre">
                                <option value="0+">0+</option><option value="0-">0-</option><option value="A+">A+</option><option value="A-">A-</option>
                                <option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option>
                            </select>
                        </div>
                    </div>

                    <div class="grid-4" style="margin-bottom:0.7rem;">
                        <div class="field"><label>Peso (kg) *</label><input type="number" step="0.1" id="pPeso" required value="65"></div>
                        <div class="field"><label>Altura (cm) *</label><input type="number" id="pAltura" required value="170"></div>
                        <div class="field"><label>Pierna</label><select id="pPierna"><option value="Derecha">Derecha</option><option value="Izquierda">Izquierda</option><option value="Ambidiestro">Ambidiestro</option></select></div>
                        <div class="field"><label>Brazo</label><select id="pBrazo"><option value="Derecho">Derecho</option><option value="Izquierdo">Izquierdo</option><option value="Ambidiestro">Ambidiestro</option></select></div>
                    </div>

                    <div id="wrapPScoreDeporte" style="margin-bottom:0.7rem; background:var(--surface-subtle); border:1px solid var(--line-celeste); padding:0.7rem; border-radius:10px;">
                        <small style="display:block; font-weight:800; color:var(--cdm-600); margin-bottom:0.4rem;">⭐ CALIFICACIÓN INICIAL (1 A 10 — SOLO DEPORTES)</small>
                        <div class="grid-4">
                            <div class="field"><label>Físico</label><input type="number" step="0.1" min="1" max="10" id="pScoreFisico" value="7.0"></div>
                            <div class="field"><label>Gym</label><input type="number" step="0.1" min="1" max="10" id="pScoreGym" value="7.0"></div>
                            <div class="field"><label>Técnico</label><input type="number" step="0.1" min="1" max="10" id="pScoreTecnico" value="7.0"></div>
                            <div class="field"><label>Actitud</label><input type="number" step="0.1" min="1" max="10" id="pScoreActitud" value="7.5"></div>
                        </div>
                    </div>

                    <div class="grid-4" style="margin-bottom:0.8rem; background:var(--cdm-50); padding:0.7rem; border-radius:10px;">
                        <div class="field"><label>Días x Sem.</label><select id="pFrecuencia"><option value="2">2 días</option><option value="3" selected>3 días</option><option value="4">4 días</option><option value="5">5 días</option></select></div>
                        <div class="field"><label>Salud</label><select id="pEstadoMedico"><option value="Óptimo">🟢 Óptimo</option><option value="Sobrecarga / Precaución">🟡 Precaución</option><option value="Lesionado (Rehabilitación)">🔴 Lesionado</option></select></div>
                        <div class="field"><label>Cuota</label><select id="pPagoEstado"><option value="Al Día">💳 Al Día</option><option value="Pendiente">⚠️ Pendiente</option></select></div>
                        <div class="field"><label>Monto ($)</label><input type="number" id="pMontoCuota" value="25000"></div>
                    </div>

                    <!-- Permisos de vista y autogestión (nativos, compatibles con login.js) -->
                    <div style="margin-bottom:0.9rem; background:var(--surface-subtle); border:1px solid var(--line-strong); padding:0.7rem 0.9rem; border-radius:12px; display:flex; justify-content:space-between; align-items:center; gap:0.7rem; flex-wrap:wrap;">
                        <select id="pModoVistaRutina" style="width:auto; min-width:210px; font-weight:700; font-size:0.78rem;">
                            <option value="heredar">🎚️ Vista Rutina: Automática</option>
                            <option value="simple">🟢 Vista Rutina: Simple</option>
                            <option value="avanzado">🚀 Vista Rutina: Avanzada</option>
                        </select>
                        <label style="display:inline-flex; align-items:center; gap:0.45rem; font-size:0.78rem; font-weight:700; cursor:pointer;">
                            <input type="checkbox" id="pPuedeCrearRutinas" style="width:18px; height:18px; min-height:auto;">
                            <span>🔓 Permitir armar sus propias rutinas</span>
                        </label>
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                        <button type="button" class="btn btn-ghost" onclick="cerrarModalPersona()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">💾 Guardar Persona</button>
                    </div>
                </form>
            </div>
        `;
    }

    window.sincronizarEdadDesdeFechaNacModal = function () {
        const fn = document.getElementById("pFechaNac")?.value;
        if (!fn) return;
        const edad = calcularEdadExacta({ fechaNacimiento: fn });
        const inpEdad = document.getElementById("pEdad");
        if (inpEdad) inpEdad.value = edad;
    };

    function actualizarVisibilidadModalPersona() {
        const esGym = document.getElementById("pDeporte")?.value === "Gimnasio";
        document.getElementById("wrapPCategoria")?.classList.toggle("hidden", esGym);
        document.getElementById("wrapPScoreDeporte")?.classList.toggle("hidden", esGym);
    }

    function actualizarPreviewFotoModal(fotoData, ini = "👤") {
        const prev = document.getElementById("previewAvatarModalPersona");
        if (prev) prev.innerHTML = fotoData ? `<img src="${fotoData}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">` : `<span>${ini}</span>`;
        document.getElementById("btnQuitarFotoModalPersona")?.classList.toggle("hidden", !fotoData);
    }

    window.cargarFotoEnModalPersonaCDM = function (event) {
        const file = event.target.files?.[0];
        if (!file) return;
        comprimirImagenArchivoCDM(file, 320, 0.84, (dataUrl) => {
            const inp = document.getElementById("pFotoData");
            if (inp) inp.value = dataUrl;
            actualizarPreviewFotoModal(dataUrl);
            mostrarToast("📷 Foto lista.");
        });
    };

    window.quitarFotoEnModalPersonaCDM = function () {
        const inp = document.getElementById("pFotoData");
        if (inp) inp.value = "";
        actualizarPreviewFotoModal("", "👤");
    };

    window.abrirModalPersona = function (idEditar = null) {
        construirHTMLModalPersona();
        const modal = document.getElementById("modalPersona");
        const selDep = document.getElementById("pDeporte");
        if (!modal || !selDep) return;

        const deps = obtenerDeportesDisponibles();
        selDep.innerHTML = deps.map(d => `<option value="${d}">${d === "Futbol" ? "⚽ Fútbol" : d === "Hockey" ? "🏑 Hockey" : d === "Gimnasio" ? "🏋️ Gimnasio" : "🏆 " + d}</option>`).join("");

        if (idEditar) {
            const p = basePersonas.find(x => Number(x.id) === Number(idEditar));
            if (!p) return;
            asegurarPilaresPersona(p);
            document.getElementById("tituloModal").innerText = `Editar: ${p.nombre} ${p.apellido}`;
            document.getElementById("pId").value = p.id;
            selDep.value = p.deporte;
            document.getElementById("pCategoria").value = p.categoria || "Primera";
            document.getElementById("pPuesto").value = p.puesto || "";
            document.getElementById("pNombre").value = p.nombre || "";
            document.getElementById("pApellido").value = p.apellido || "";
            document.getElementById("pDni").value = p.dni || "";
            document.getElementById("pWhatsapp").value = p.whatsapp || "";
            document.getElementById("pFechaNac").value = p.fechaNacimiento || `${obtenerAnioNacimiento(p)}-06-15`;
            document.getElementById("pEdad").value = calcularEdadExacta(p);
            document.getElementById("pSangre").value = p.sangre || "0+";
            document.getElementById("pPeso").value = p.peso || 70;
            document.getElementById("pAltura").value = p.altura || 170;
            document.getElementById("pPierna").value = p.pierna || "Derecha";
            document.getElementById("pBrazo").value = p.brazo || "Derecho";
            document.getElementById("pFrecuencia").value = p.frecuenciaSemanal || 3;
            document.getElementById("pEstadoMedico").value = p.estadoMedico || "Óptimo";
            document.getElementById("pPagoEstado").value = p.pagoEstado || "Al Día";
            document.getElementById("pMontoCuota").value = p.montoCuota ?? 25000;
            document.getElementById("pFotoData").value = p.foto || "";
            document.getElementById("pModoVistaRutina").value = p.modoVistaRutina || "heredar";
            document.getElementById("pPuedeCrearRutinas").checked = Boolean(p.puedeCrearRutinas);
            actualizarPreviewFotoModal(p.foto || "", obtenerInicialesPersonaCDM(p));

            if (p.deporte !== "Gimnasio" && p.pilares) {
                document.getElementById("pScoreFisico").value = p.pilares.fisico;
                document.getElementById("pScoreGym").value = p.pilares.gym;
                document.getElementById("pScoreTecnico").value = p.pilares.tecnico;
                document.getElementById("pScoreActitud").value = p.pilares.actitud;
            }
        } else {
            document.getElementById("pId").value = "";
            document.getElementById("pFotoData").value = "";
            actualizarPreviewFotoModal("", "👤");
            selDep.value = deportePagina || deps[0] || "Futbol";
            document.getElementById("pCategoria").value = categoriaActiva || "Sub 13";
            const anioDef = new Date().getFullYear() - 15;
            document.getElementById("pFechaNac").value = `${anioDef}-06-15`;
            document.getElementById("pEdad").value = 15;
        }

        actualizarVisibilidadModalPersona();
        selDep.onchange = actualizarVisibilidadModalPersona;
        modal.classList.remove("hidden");
    };

    window.cerrarModalPersona = function () {
        document.getElementById("modalPersona")?.classList.add("hidden");
    };

    window.guardarPersonaCDM = function (e) {
        e.preventDefault();
        const idEdit = document.getElementById("pId").value;
        const dep = document.getElementById("pDeporte").value;
        const cat = dep === "Gimnasio" ? "General" : document.getElementById("pCategoria").value;
        const peso = parseFloat(document.getElementById("pPeso").value) || 70;
        const fechaNac = document.getElementById("pFechaNac")?.value || "";
        const edadInp = parseInt(document.getElementById("pEdad").value, 10) || 15;
        const edadFinal = fechaNac ? calcularEdadExacta({ fechaNacimiento: fechaNac }) : edadInp;
        const anioNac = fechaNac ? parseInt(fechaNac.slice(0, 4), 10) : (new Date().getFullYear() - edadFinal);
        const hoy = obtenerHoyISO();

        const pilares = dep === "Gimnasio" ? null : {
            fisico: normalizarNota1a10(document.getElementById("pScoreFisico")?.value, 7.0),
            gym: normalizarNota1a10(document.getElementById("pScoreGym")?.value, 7.0),
            tecnico: normalizarNota1a10(document.getElementById("pScoreTecnico")?.value, 7.0),
            actitud: normalizarNota1a10(document.getElementById("pScoreActitud")?.value, 7.5),
            bonus: 0
        };

        const datos = {
            deporte: dep,
            categoria: cat,
            puesto: document.getElementById("pPuesto").value.trim(),
            nombre: document.getElementById("pNombre").value.trim(),
            apellido: document.getElementById("pApellido").value.trim(),
            dni: document.getElementById("pDni").value.trim(),
            whatsapp: document.getElementById("pWhatsapp").value.trim(),
            fechaNacimiento: fechaNac,
            anioNacimiento: anioNac,
            edad: edadFinal,
            sangre: document.getElementById("pSangre").value,
            peso,
            altura: parseInt(document.getElementById("pAltura").value, 10) || 170,
            pierna: document.getElementById("pPierna").value,
            brazo: document.getElementById("pBrazo").value,
            frecuenciaSemanal: parseInt(document.getElementById("pFrecuencia").value, 10) || 3,
            estadoMedico: document.getElementById("pEstadoMedico").value,
            pagoEstado: document.getElementById("pPagoEstado").value,
            montoCuota: parseFloat(document.getElementById("pMontoCuota").value) || 0,
            foto: document.getElementById("pFotoData")?.value || null,
            modoVistaRutina: document.getElementById("pModoVistaRutina")?.value || "heredar",
            puedeCrearRutinas: Boolean(document.getElementById("pPuedeCrearRutinas")?.checked)
        };

        if (idEdit) {
            const p = basePersonas.find(x => Number(x.id) === Number(idEdit));
            if (p) {
                Object.assign(p, datos);
                if (dep !== "Gimnasio" && pilares) {
                    p.pilares = { ...pilares, bonus: p.pilares?.bonus || 0 };
                    recalcularPuntajePonderado(p);
                } else {
                    p.puntosCategoria = null;
                }
            }
            mostrarToast("✏️ Ficha actualizada.");
        } else {
            const nueva = {
                id: Date.now(),
                ...datos,
                activo: true,
                pilares,
                puntosCategoria: dep === "Gimnasio" ? null : 7.1,
                motivoPuntos: "Alta en Base General",
                asistencias: [hoy],
                evaluaciones: [],
                categoriasExtra: [],
                historialCategorias: [],
                clinico: [{ id: Date.now() + 1, fecha: hoy, peso, rpe: 5, sueno: 5, dolor: "Sin molestias" }]
            };
            asegurarPilaresPersona(nueva);
            basePersonas.push(nueva);
            mostrarToast(`✓ ${nueva.nombre} ${nueva.apellido} registrado en ${dep}.`);
        }

        guardarDatosCDM();
        cerrarModalPersona();
        refrescarVistasActivasCDM();
        if (!document.getElementById("cdmSeccionBaseGeneral37")?.classList.contains("hidden")) {
            renderizarSeccionBaseGeneral();
        }
    };

    window.eliminarPersonaDefinitivo = function (id) {
        const p = basePersonas.find(x => Number(x.id) === Number(id));
        if (!p || !confirm(`🗑️ ¿Eliminar definitivamente a ${p.nombre} ${p.apellido}?`)) return;
        basePersonas = basePersonas.filter(x => Number(x.id) !== Number(id));
        guardarDatosCDM();
        refrescarVistasActivasCDM();
        if (!document.getElementById("cdmSeccionBaseGeneral37")?.classList.contains("hidden")) {
            renderizarSeccionBaseGeneral();
        }
    };

    // =====================================================================
    // 3. ABSORCIÓN POR EDAD Y MIGRACIÓN ENTRE CATEGORÍAS
    // =====================================================================
    function asegurarModalBase() {
        let m = document.getElementById("modalBaseGeneral37");
        if (!m) {
            m = document.createElement("div");
            m.id = "modalBaseGeneral37";
            m.className = "modal-backdrop hidden";
            document.body.appendChild(m);
        }
        return m;
    }

    window.cerrarModalBase37 = function () {
        document.getElementById("modalBaseGeneral37")?.classList.add("hidden");
    };

    window.migrarOAbsorberJugadores = function (ids, depDest, catDest, modo = "migrar") {
        if (!Array.isArray(ids) || !ids.length) return;
        const hoy = obtenerHoyISO();
        let cant = 0;

        ids.forEach(id => {
            const p = basePersonas.find(x => Number(x.id) === Number(id));
            if (!p) return;
            asegurarPilaresPersona(p);

            if (modo === "migrar") {
                if (p.deporte !== depDest || p.categoria !== catDest) {
                    p.historialCategorias.unshift({ fecha: hoy, de: `${p.deporte} ${p.categoria}`, a: `${depDest} ${catDest}`, tipo: "Migración" });
                }
                p.deporte = depDest;
                p.categoria = catDest;
                p.activo = true;
                p.categoriasExtra = (p.categoriasExtra || []).filter(ce => !(ce.deporte === depDest && ce.categoria === catDest));
                cant++;
            } else {
                if (p.deporte === depDest && p.categoria === catDest) return;
                if (!(p.categoriasExtra || []).some(ce => ce.deporte === depDest && ce.categoria === catDest)) {
                    p.categoriasExtra.push({ deporte: depDest, categoria: catDest, fecha: hoy });
                    p.historialCategorias.unshift({ fecha: hoy, de: `${p.deporte} ${p.categoria}`, a: `${depDest} ${catDest} (Doble Cat.)`, tipo: "Absorción" });
                    cant++;
                }
            }
        });

        guardarDatosCDM();
        refrescarVistasActivasCDM();
        if (!document.getElementById("cdmSeccionBaseGeneral37")?.classList.contains("hidden")) renderizarSeccionBaseGeneral();
        mostrarToast(modo === "migrar"
            ? `🔀 ${cant} jugador(es) migrados a ${depDest} (${catDest}).`
            : `📥 ${cant} jugador(es) sumados en doble categoría (${catDest}).`);
    };

    window.quitarDeCategoriaExtra = function (idPersona, dep, cat) {
        const p = basePersonas.find(x => Number(x.id) === Number(idPersona));
        if (!p) return;
        p.categoriasExtra = (p.categoriasExtra || []).filter(ce => !(ce.deporte === dep && ce.categoria === cat));
        guardarDatosCDM();
        refrescarVistasActivasCDM();
        if (!document.getElementById("cdmSeccionBaseGeneral37")?.classList.contains("hidden")) renderizarSeccionBaseGeneral();
        mostrarToast(`✓ ${p.apellido} quitado de ${cat}.`);
    };
    window.quitarDeCategoriaExtra37 = window.quitarDeCategoriaExtra;

    window.abrirModalAbsorberPorEdad = function (soloRangoEdad = true, edadPuntual = "TODAS", busq = "") {
        const dep = deportePagina || "Futbol";
        const cat = categoriaActiva || "Sub 13";
        const rango = RANGOS_EDAD_CATEGORIA[cat] || { min: 5, max: 60 };
        const todos = basePersonas.filter(p => p && p.activo);
        const edades = [...new Set(todos.map(p => calcularEdadExacta(p)))].sort((a, b) => a - b);

        const candidatos = todos.filter(p => {
            if (p.deporte === dep && p.categoria === cat) return false;
            if ((p.categoriasExtra || []).some(ce => ce.deporte === dep && ce.categoria === cat)) return false;

            const ed = calcularEdadExacta(p);
            if (edadPuntual !== "TODAS" && ed !== Number(edadPuntual)) return false;
            if (edadPuntual === "TODAS" && soloRangoEdad && (ed < rango.min || ed > rango.max)) return false;
            if (busq) {
                const txt = `${p.nombre} ${p.apellido} ${p.dni} ${p.deporte} ${p.categoria} ${obtenerAnioNacimiento(p)}`.toLowerCase();
                if (!txt.includes(busq.toLowerCase())) return false;
            }
            return true;
        }).sort((a, b) => calcularEdadExacta(a) - calcularEdadExacta(b) || a.apellido.localeCompare(b.apellido));

        const modal = asegurarModalBase();
        modal.innerHTML = `
            <div class="modal-window" style="max-width:780px;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-celeste">🗄️ BASE GENERAL POR EDAD</span>
                        <h3 style="margin-top:4px;">📥 Absorber Jugadores hacia ${dep} — ${cat}</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalBase37()">✕</button>
                </div>

                <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.7rem;">
                    <input type="text" id="bg37BusqAbs" value="${busq.replace(/"/g, "&quot;")}" placeholder="Buscar por apellido, DNI o año..." style="flex:1; min-width:180px;"
                        oninput="abrirModalAbsorberPorEdad(${soloRangoEdad}, '${edadPuntual}', this.value)">
                    <button type="button" class="btn ${soloRangoEdad && edadPuntual === "TODAS" ? "btn-primary" : "btn-ghost"} btn-sm"
                        onclick="abrirModalAbsorberPorEdad(true, 'TODAS', document.getElementById('bg37BusqAbs').value)">🎯 Edad ${rango.min}–${rango.max}</button>
                    <button type="button" class="btn ${!soloRangoEdad && edadPuntual === "TODAS" ? "btn-primary" : "btn-ghost"} btn-sm"
                        onclick="abrirModalAbsorberPorEdad(false, 'TODAS', document.getElementById('bg37BusqAbs').value)">👥 Todas las Edades</button>
                </div>

                <div class="bg37-age-pills">
                    ${edades.map(ed => `<button type="button" class="bg37-age-pill ${String(edadPuntual) === String(ed) ? "active" : ""}" onclick="abrirModalAbsorberPorEdad(false, '${ed}', document.getElementById('bg37BusqAbs').value)">${ed} años</button>`).join("")}
                </div>

                <div class="bg37-pick-list">
                    ${candidatos.length === 0
                        ? `<div class="empty-box" style="padding:1.1rem;">No hay jugadores fuera de ${cat} con este filtro de edad.</div>`
                        : candidatos.map(p => `
                            <label class="bg37-pick-row" onclick="setTimeout(()=>this.classList.toggle('selected', this.querySelector('input').checked), 10)">
                                <div style="display:flex; align-items:center; gap:0.6rem;">
                                    <input type="checkbox" class="bg37-chk-abs" value="${p.id}" style="width:18px; height:18px; min-height:auto;">
                                    <div>
                                        <strong>${p.apellido}, ${p.nombre}</strong>
                                        <small style="display:block; color:var(--ink-500);">DNI ${p.dni} • ${p.puesto || "Jugador"}</small>
                                    </div>
                                </div>
                                <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
                                    <span class="badge badge-celeste">🎂 ${calcularEdadExacta(p)} años (Cat. ${obtenerAnioNacimiento(p)})</span>
                                    <span class="badge badge-purple">En: ${p.deporte} ${p.categoria}</span>
                                </div>
                            </label>
                        `).join("")}
                </div>

                <div style="display:flex; justify-content:flex-end; gap:0.45rem; flex-wrap:wrap;">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="confirmarAbsorcionModal('${dep}', '${cat}', 'absorber_extra')">➕ Sumar Doble Categoría</button>
                    <button type="button" class="btn btn-primary btn-sm" onclick="confirmarAbsorcionModal('${dep}', '${cat}', 'migrar')">🔀 Migrar a ${cat}</button>
                </div>
            </div>
        `;
        modal.classList.remove("hidden");
    };
    window.abrirModalAbsorberPorEdad37 = window.abrirModalAbsorberPorEdad;

    window.confirmarAbsorcionModal = function (dep, cat, modo) {
        const ids = Array.from(document.querySelectorAll(".bg37-chk-abs:checked")).map(c => Number(c.value));
        if (!ids.length) return alert("Tildá al menos un jugador.");
        migrarOAbsorberJugadores(ids, dep, cat, modo);
        cerrarModalBase37();
    };

    window.abrirModalMigrarDesdeCategoria = function () {
        const dep = deportePagina || "Futbol";
        const cat = categoriaActiva || "Sub 13";
        const plantel = obtenerPersonasFiltradasDeporte(true);
        const deps = obtenerDeportesDisponibles();

        const modal = asegurarModalBase();
        modal.innerHTML = `
            <div class="modal-window" style="max-width:740px;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-purple">🔀 PASE ENTRE CATEGORÍAS</span>
                        <h3 style="margin-top:4px;">Migrar desde ${dep} (${cat})</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalBase37()">✕</button>
                </div>
                <div class="grid-2" style="margin-bottom:0.8rem;">
                    <div class="field"><label>Deporte Destino</label><select id="bg37MigDep">${deps.map(d => `<option value="${d}" ${d === dep ? "selected" : ""}>${d}</option>`).join("")}</select></div>
                    <div class="field"><label>Categoría Destino</label><select id="bg37MigCat">${CATEGORIAS_ESTANDAR.map(c => `<option value="${c}">${c}</option>`).join("")}</select></div>
                </div>
                <div class="bg37-pick-list">
                    ${plantel.length === 0 ? `<div class="empty-box">No hay jugadores en ${cat}.</div>` :
                    plantel.map(p => {
                        const esExtra = !(p.deporte === dep && p.categoria === cat);
                        return `
                            <div class="bg37-pick-row">
                                <label style="display:flex; align-items:center; gap:0.55rem; flex:1; cursor:pointer;">
                                    <input type="checkbox" class="bg37-chk-mig" value="${p.id}" style="width:18px; height:18px; min-height:auto;">
                                    <div>
                                        <strong>${p.apellido}, ${p.nombre}</strong>
                                        <small style="display:block; color:var(--ink-500);">🎂 ${calcularEdadExacta(p)} años (Cat. ${obtenerAnioNacimiento(p)}) ${esExtra ? `• Base: ${p.deporte} ${p.categoria}` : ""}</small>
                                    </div>
                                </label>
                                ${esExtra ? `<button type="button" class="btn btn-danger btn-sm" onclick="quitarDeCategoriaExtra(${p.id}, '${dep}', '${cat}'); abrirModalMigrarDesdeCategoria();">Quitar Doble Cat.</button>` : ""}
                            </div>
                        `;
                    }).join("")}
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.45rem; flex-wrap:wrap;">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="ejecutarMigracionModal('absorber_extra')">➕ Sumar también en Destino</button>
                    <button type="button" class="btn btn-primary btn-sm" onclick="ejecutarMigracionModal('migrar')">🔀 Migrar Seleccionados</button>
                </div>
            </div>
        `;
        modal.classList.remove("hidden");
    };
    window.abrirModalMigrarDesdeCategoria37 = window.abrirModalMigrarDesdeCategoria;

    window.ejecutarMigracionModal = function (modo) {
        const ids = Array.from(document.querySelectorAll(".bg37-chk-mig:checked")).map(c => Number(c.value));
        if (!ids.length) return alert("Seleccioná al menos un jugador.");
        const depDest = document.getElementById("bg37MigDep").value;
        const catDest = depDest === "Gimnasio" ? "General" : document.getElementById("bg37MigCat").value;
        migrarOAbsorberJugadores(ids, depDest, catDest, modo);
        cerrarModalBase37();
    };

    // =====================================================================
    // 4. SECCIÓN "🗄️ BASE GENERAL" (JUGADORES POR EDAD + BASE DE EJERCICIOS)
    // =====================================================================
    window._bgState = { tab: "jugadores", edadFiltro: "TODAS", depFiltro: "TODOS", busq: "" };

    window.obtenerCatalogoEjercicios37 = function () {
        return Array.isArray(baseCatalogoEjercicios) ? baseCatalogoEjercicios : [];
    };

    window.abrirModuloBaseGeneral = function (tabOpt = null) {
        if (tabOpt) window._bgState.tab = tabOpt;
        if (typeof alternarSidebarMovil === "function") alternarSidebarMovil(true);
        const main = document.querySelector(".app-content");
        if (!main) return;

        document.querySelectorAll(".app-sidebar .side-link").forEach(l => l.classList.toggle("active", l.dataset.nav === "base_general"));
        Array.from(main.children).forEach(ch => { if (ch.id !== "cdmSeccionBaseGeneral37") ch.classList.add("hidden"); });

        let sec = document.getElementById("cdmSeccionBaseGeneral37");
        if (!sec) {
            sec = document.createElement("section");
            sec.id = "cdmSeccionBaseGeneral37";
            sec.className = "animate-in";
            main.appendChild(sec);
        }
        sec.classList.remove("hidden");

        const h2 = document.querySelector(".topbar-title h2");
        if (h2) h2.innerHTML = `🗄️ Base de Datos General <span class="cat-active-pill">Edades y Ejercicios</span>`;
        renderizarSeccionBaseGeneral();
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.abrirModuloBaseGeneral37 = window.abrirModuloBaseGeneral;

    window.migrarRapidoDesdeBase = function (idPersona) {
        const p = basePersonas.find(x => Number(x.id) === Number(idPersona));
        if (!p) return;
        const deps = obtenerDeportesDisponibles();
        const modal = asegurarModalBase();
        modal.innerHTML = `
            <div class="modal-window" style="max-width:480px;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-purple">🔀 ASIGNAR / MIGRAR</span>
                        <h3 style="margin-top:4px;">${p.apellido}, ${p.nombre} (${calcularEdadExacta(p)} años)</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalBase37()">✕</button>
                </div>
                <div class="field" style="margin-bottom:0.7rem;">
                    <label>Fecha de Nacimiento</label>
                    <input type="date" id="bg37EdFechaNac" value="${p.fechaNacimiento || `${obtenerAnioNacimiento(p)}-06-15`}">
                </div>
                <div class="grid-2" style="margin-bottom:0.85rem;">
                    <div class="field"><label>Deporte</label><select id="bg37IndDep">${deps.map(d => `<option value="${d}" ${d === p.deporte ? "selected" : ""}>${d}</option>`).join("")}</select></div>
                    <div class="field"><label>Categoría</label><select id="bg37IndCat">${CATEGORIAS_ESTANDAR.map(c => `<option value="${c}" ${c === p.categoria ? "selected" : ""}>${c}</option>`).join("")}</select></div>
                </div>
                <div style="display:flex; gap:0.45rem; flex-wrap:wrap; justify-content:flex-end;">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="aplicarCambioIndividualBase(${p.id}, 'absorber_extra')">➕ Doble Categoría</button>
                    <button type="button" class="btn btn-primary btn-sm" onclick="aplicarCambioIndividualBase(${p.id}, 'migrar')">🔀 Migrar Categoría</button>
                </div>
            </div>
        `;
        modal.classList.remove("hidden");
    };

    window.aplicarCambioIndividualBase = function (idPersona, modo) {
        const p = basePersonas.find(x => Number(x.id) === Number(idPersona));
        const fn = document.getElementById("bg37EdFechaNac")?.value;
        if (p && fn) {
            p.fechaNacimiento = fn;
            p.anioNacimiento = parseInt(fn.slice(0, 4), 10);
            p.edad = calcularEdadExacta(p);
        }
        const dep = document.getElementById("bg37IndDep").value;
        const cat = dep === "Gimnasio" ? "General" : document.getElementById("bg37IndCat").value;
        migrarOAbsorberJugadores([idPersona], dep, cat, modo);
        cerrarModalBase37();
    };

    window.guardarNuevoEjercicioBase = function (e) {
        e.preventDefault();
        const nom = document.getElementById("bgEjNom").value.trim();
        const grp = document.getElementById("bgEjGrp").value.trim() || "General";
        const tip = document.getElementById("bgEjTip").value;
        const pat = document.getElementById("bgEjPatron").value || "squat";
        const vid = (document.getElementById("bgEjVid")?.value || "").trim();
        if (!nom) return;

        agregarEjercicioInventadoAlCatalogoCDM(nom, tip, true, { grupo: grp, patron: pat, video: vid });

        // Sincronizar también en la Videoteca del Gimnasio
        if (Array.isArray(baseVideoteca)) {
            const norm = normalizarTextoEjercicioCDM(nom);
            if (!baseVideoteca.some(v => normalizarTextoEjercicioCDM(v.nombre) === norm)) {
                baseVideoteca.unshift({
                    id: Date.now(),
                    nombre: nom,
                    grupo: grp,
                    grupoSecundario: grp,
                    nivel: "Todos los niveles",
                    equipo: "Sala / Libre",
                    seriesSugeridas: 4,
                    repsSugeridas: "8-10",
                    pausaSugerida: "90s",
                    videoUrl: vid || "biomech://simulador",
                    patron: pat,
                    imagenPreview: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=700&q=80",
                    clavesTecnicas: "Controlar la postura y la fase excéntrica.",
                    erroresComunes: "Evitar compensaciones lumbares."
                });
            }
        }

        guardarDatosCDM();
        mostrarToast(`🏋️ Ejercicio "${nom}" guardado y conectado a Rutinas, Videoteca y Hombrecito.`);
        renderizarSeccionBaseGeneral();
    };

    window.eliminarEjercicioBase = function (idEj) {
        if (!confirm("🗑️ ¿Quitar este ejercicio de la Base Maestra?")) return;
        baseCatalogoEjercicios = baseCatalogoEjercicios.filter(x => String(x.id) !== String(idEj));
        guardarDatosCDM();
        sincronizarDatalistsEjerciciosCDM();
        renderizarSeccionBaseGeneral();
    };

    window.renderizarSeccionBaseGeneral = function () {
        const sec = document.getElementById("cdmSeccionBaseGeneral37");
        if (!sec) return;
        const st = window._bgState;
        const todos = basePersonas.filter(p => p && p.activo);
        const edades = [...new Set(todos.map(p => calcularEdadExacta(p)))].sort((a, b) => a - b);
        const deps = obtenerDeportesDisponibles();
        const ejercicios = baseCatalogoEjercicios || [];

        sec.innerHTML = `
            <div class="module-tabs tabs-2" style="margin-bottom:1.1rem;">
                <button type="button" class="mod-tab ${st.tab === "jugadores" ? "active" : ""}" onclick="window._bgState.tab='jugadores'; renderizarSeccionBaseGeneral();">
                    <i class="ri-group-line"></i><span>👥 Base de Jugadores por Edad (${todos.length})</span>
                </button>
                <button type="button" class="mod-tab ${st.tab === "ejercicios" ? "active" : ""}" onclick="window._bgState.tab='ejercicios'; renderizarSeccionBaseGeneral();">
                    <i class="ri-dumbbell-line"></i><span>🏋️ Base Maestra de Ejercicios (${ejercicios.length})</span>
                </button>
            </div>
            <div id="bg37Body"></div>
        `;

        const body = document.getElementById("bg37Body");
        if (!body) return;

        if (st.tab === "jugadores") {
            const filtrados = todos.filter(p => {
                if (st.edadFiltro !== "TODAS" && calcularEdadExacta(p) !== Number(st.edadFiltro)) return false;
                if (st.depFiltro !== "TODOS" && p.deporte !== st.depFiltro) return false;
                if (st.busq) {
                    const txt = `${p.nombre} ${p.apellido} ${p.dni} ${p.categoria} ${obtenerAnioNacimiento(p)}`.toLowerCase();
                    if (!txt.includes(st.busq.toLowerCase())) return false;
                }
                return true;
            }).sort((a, b) => calcularEdadExacta(a) - calcularEdadExacta(b) || a.apellido.localeCompare(b.apellido));

            body.innerHTML = `
                <div class="app-panel">
                    <div class="panel-head">
                        <div>
                            <h3><i class="ri-database-2-line"></i> Padrón Maestro del Club (Por Años Cumplidos)</h3>
                            <small style="color:var(--ink-500);">Un único registro por persona. Absorbelo o migralo entre categorías sin duplicarlo.</small>
                        </div>
                        <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalPersona()">+ Nueva Persona en Base</button>
                    </div>

                    <div class="bg37-age-pills">
                        <button type="button" class="bg37-age-pill ${st.edadFiltro === "TODAS" ? "active" : ""}" onclick="window._bgState.edadFiltro='TODAS'; renderizarSeccionBaseGeneral();">Todas (${todos.length})</button>
                        ${edades.map(ed => `<button type="button" class="bg37-age-pill ${String(st.edadFiltro) === String(ed) ? "active" : ""}" onclick="window._bgState.edadFiltro='${ed}'; renderizarSeccionBaseGeneral();">${ed} años (${todos.filter(p => calcularEdadExacta(p) === ed).length})</button>`).join("")}
                    </div>

                    <div class="filter-strip" style="grid-template-columns: 1fr auto; margin-bottom:0.9rem;">
                        <div class="search-box">
                            <i class="ri-search-line"></i>
                            <input type="text" value="${st.busq.replace(/"/g, "&quot;")}" placeholder="Buscar por apellido, DNI o año..." oninput="window._bgState.busq=this.value; renderizarSeccionBaseGeneral();">
                        </div>
                        <select onchange="window._bgState.depFiltro=this.value; renderizarSeccionBaseGeneral();" style="width:auto;">
                            <option value="TODOS" ${st.depFiltro === "TODOS" ? "selected" : ""}>🏢 Todos los Deportes</option>
                            ${deps.map(d => `<option value="${d}" ${st.depFiltro === d ? "selected" : ""}>${d}</option>`).join("")}
                        </select>
                    </div>

                    <div class="table-wrap">
                        <table class="app-table" style="font-size:0.82rem;">
                            <thead><tr><th>Deportista / DNI</th><th>Edad / Año</th><th>Categoría Base</th><th>Doble Categoría</th><th style="text-align:right;">Acciones</th></tr></thead>
                            <tbody>
                                ${filtrados.map(p => `
                                    <tr>
                                        <td><strong>${p.apellido}, ${p.nombre}</strong><br><small style="color:var(--ink-500);">DNI ${p.dni} • ${p.puesto || "-"}</small></td>
                                        <td><span class="badge badge-celeste">🎂 ${calcularEdadExacta(p)} años</span><br><small style="color:var(--ink-500);">Cat. ${obtenerAnioNacimiento(p)}</small></td>
                                        <td><strong>${p.deporte}</strong> <span class="badge badge-purple">${p.categoria}</span></td>
                                        <td>
                                            ${(p.categoriasExtra || []).length === 0 ? `<small style="color:var(--ink-400);">-</small>` :
                                            p.categoriasExtra.map(ce => `<span class="badge badge-ok" style="margin:2px;">${ce.deporte} ${ce.categoria} <a href="#" style="color:inherit; margin-left:3px;" onclick="event.preventDefault(); quitarDeCategoriaExtra(${p.id}, '${ce.deporte}', '${ce.categoria}')">✕</a></span>`).join("")}
                                        </td>
                                        <td style="text-align:right;">
                                            <div style="display:flex; gap:0.35rem; justify-content:flex-end; flex-wrap:wrap;">
                                                <button type="button" class="btn btn-primary btn-sm" onclick="migrarRapidoDesdeBase(${p.id})">🔀 Migrar / Edad</button>
                                                <button type="button" class="btn btn-secondary btn-sm" onclick="irAPaginaIndividual(${p.id})">📂 Ficha</button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } else {
            body.innerHTML = `
                <div class="split-view">
                    <div class="app-panel">
                        <div class="panel-head"><h3><i class="ri-add-circle-line"></i> Nuevo Ejercicio en Base Maestra</h3></div>
                        <form onsubmit="guardarNuevoEjercicioBase(event)">
                            <div class="field" style="margin-bottom:0.65rem;"><label>Nombre del Ejercicio *</label><input type="text" id="bgEjNom" required placeholder="Ej: Sentadilla Goblet / Press Inclinado"></div>
                            <div class="grid-2" style="margin-bottom:0.65rem;">
                                <div class="field"><label>Grupo Muscular</label><input type="text" id="bgEjGrp" placeholder="Ej: Tren Inferior / Empuje"></div>
                                <div class="field"><label>Medición</label>
                                    <select id="bgEjTip">
                                        <option value="fuerza_kg">🏋️ Kilos + Reps (1RM)</option>
                                        <option value="unilateral">⚖️ Unilateral Izq/Der</option>
                                        <option value="salto_cm">🦘 Salto (cm)</option>
                                        <option value="tiempo_seg">⚡ Tiempo (seg)</option>
                                        <option value="reps_puntos">🔁 Repeticiones</option>
                                    </select>
                                </div>
                            </div>
                            <div class="field" style="margin-bottom:0.65rem;">
                                <label>🏃 Animación del Hombrecito (Patrón Biomecánico)</label>
                                <div style="display:flex; gap:0.6rem; align-items:center;">
                                    <select id="bgEjPatron" style="flex:1;" onchange="const c=document.getElementById('bgPreviewStickman'); if(c) c.dataset.patron=this.value;">
                                        ${PATRONES_HOMBRECITO.map(pt => `<option value="${pt.clave}">${pt.label}</option>`).join("")}
                                    </select>
                                    <div class="routine-stickman-mini" style="width:62px; height:62px; background:var(--surface-subtle); border:1px solid var(--line-strong); border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                        <canvas id="bgPreviewStickman" data-patron="squat" width="58" height="58" style="width:58px; height:58px;"></canvas>
                                    </div>
                                </div>
                            </div>
                            <div class="field" style="margin-bottom:0.85rem;"><label>Link de Video Técnico (Opcional)</label><input type="url" id="bgEjVid" placeholder="https://youtube.com/..."></div>
                            <button type="submit" class="btn btn-primary" style="width:100%;">💾 Guardar en Base Maestra</button>
                        </form>
                    </div>

                    <div class="app-panel">
                        <div class="panel-head"><h3><i class="ri-list-check-2"></i> Catálogo Activo (${ejercicios.length})</h3></div>
                        <div class="table-wrap">
                            <table class="app-table" style="font-size:0.82rem;">
                                <thead><tr><th>Ejercicio</th><th>Grupo</th><th>Patrón</th><th style="text-align:right;"></th></tr></thead>
                                <tbody>
                                    ${ejercicios.map(ej => `
                                        <tr>
                                            <td><strong>${ej.nombre}</strong>${ej.video ? ` <a href="${ej.video}" target="_blank" class="badge badge-celeste">▶ Video</a>` : ""}</td>
                                            <td>${ej.grupo || "General"}</td>
                                            <td><span class="badge badge-purple">${ej.patron || "squat"}</span></td>
                                            <td style="text-align:right;"><button type="button" class="btn btn-danger btn-sm" onclick="eliminarEjercicioBase('${ej.id}')">🗑️</button></td>
                                        </tr>
                                    `).join("")}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            if (typeof iniciarLoopBiomecanico60FPS === "function") iniciarLoopBiomecanico60FPS();
        }
    };

    // Inyectar botones "📥 Absorber de Base" y "🔀 Migrar" en la barra de categorías de cada deporte
    document.addEventListener("DOMContentLoaded", () => {
        if (document.body?.getAttribute("data-rol") === "usuario") return;
        const catBar = document.querySelector(".category-bar-panel");
        if (catBar && deportePagina && deportePagina !== "Gimnasio" && !document.getElementById("bg37CatTools")) {
            const tools = document.createElement("div");
            tools.id = "bg37CatTools";
            tools.className = "bg37-cat-tools";
            tools.innerHTML = `
                <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalAbsorberPorEdad(true, 'TODAS', '')">📥 Absorber de Base</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="abrirModalMigrarDesdeCategoria()">🔀 Migrar</button>
            `;
            catBar.appendChild(tools);
        }
    });
})();