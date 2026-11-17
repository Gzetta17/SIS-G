/**
 * gym.js - Gestión exclusiva del Gimnasio, Rutinas Manuales y Envío por WhatsApp
 */

let personasGym = JSON.parse(localStorage.getItem("ams_gym_personas_v1")) || [];
let rutinasGym = JSON.parse(localStorage.getItem("ams_rutinas_gym_v1")) || [];

function guardarStorageGym() {
    localStorage.setItem("ams_gym_personas_v1", JSON.stringify(personasGym));
    localStorage.setItem("ams_rutinas_gym_v1", JSON.stringify(rutinasGym));
}

// =========================================================================
// NAVEGACIÓN INTERNA DE GYM.HTML
// =========================================================================

function mostrarVistaGym(vista) {
    document.querySelectorAll(".vista").forEach(v => v.classList.remove("active"));
    document.getElementById(`vista-${vista}`).classList.add("active");

    document.querySelectorAll(".nav-links .nav-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.vista === vista);
    });

    const textos = {
        personas: ["Padrón de Personas en el Gimnasio", "Administra tus alumnos y atletas con su número de WhatsApp."],
        constructor: ["Constructor Manual de Rutinas", "Diseña bloques de ejercicios, series, repeticiones, cargas y forma técnica."],
        rutinas: ["Rutinas Asignadas y Envío por WhatsApp", "Envía la rutina directo al teléfono del alumno o abre la vista móvil."]
    };

    if (textos[vista]) {
        document.getElementById("gymTitulo").innerText = textos[vista][0];
        document.getElementById("gymSubtitulo").innerText = textos[vista][1];
    }

    refrescarModuloGym();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function refrescarModuloGym() {
    renderPersonasGym();
    poblarSelectPersonasRutina();
    renderRutinasGuardadas();
}

// =========================================================================
// 1. GESTIÓN DE PERSONAS EN EL GIMNASIO (ALTAS, BAJAS Y SINCRONIZACIÓN)
// =========================================================================

function abrirModalPersonaGym(idEditar = null) {
    const modal = document.getElementById("modalPersonaGym");
    const form = document.getElementById("formPersonaGym");
    form.reset();

    if (idEditar) {
        const p = personasGym.find(x => x.id === idEditar);
        if (!p) return;
        document.getElementById("tituloModalPersona").innerText = `Editar: ${p.nombre} ${p.apellido}`;
        document.getElementById("perId").value = p.id;
        document.getElementById("perNombre").value = p.nombre;
        document.getElementById("perApellido").value = p.apellido;
        document.getElementById("perDni").value = p.dni || "";
        document.getElementById("perWhatsapp").value = p.whatsapp || "";
        document.getElementById("perCategoria").value = p.categoria || "Gimnasio General";
        document.getElementById("perPeso").value = p.peso || "";
        document.getElementById("perObjetivo").value = p.objetivo || "";
        document.getElementById("perLesiones").value = p.lesiones || "";
        document.getElementById("perNivel").value = p.nivel || "Intermedio";
    } else {
        document.getElementById("tituloModalPersona").innerText = "Inscribir Persona en el Gimnasio";
        document.getElementById("perId").value = "";
    }

    modal.classList.remove("hidden");
}

function cerrarModalPersonaGym() {
    document.getElementById("modalPersonaGym").classList.add("hidden");
}

function guardarPersonaGym(e) {
    e.preventDefault();
    const idEdit = document.getElementById("perId").value;

    const datos = {
        nombre: document.getElementById("perNombre").value.trim(),
        apellido: document.getElementById("perApellido").value.trim(),
        dni: document.getElementById("perDni").value.trim(),
        whatsapp: document.getElementById("perWhatsapp").value.trim(),
        categoria: document.getElementById("perCategoria").value,
        peso: parseFloat(document.getElementById("perPeso").value) || 0,
        objetivo: document.getElementById("perObjetivo").value.trim() || "Acondicionamiento General",
        lesiones: document.getElementById("perLesiones").value.trim() || "Ninguna",
        nivel: document.getElementById("perNivel").value
    };

    if (idEdit) {
        const p = personasGym.find(x => x.id == idEdit);
        if (p) Object.assign(p, datos);
    } else {
        personasGym.push({
            id: Date.now(),
            ...datos,
            activo: true
        });
    }

    guardarStorageGym();
    cerrarModalPersonaGym();
    refrescarModuloGym();
}

// Importar jugadores ya cargados en analisisjugadores.html para no tipearlos dos veces
function sincronizarDesdePlantel() {
    const plantel = JSON.parse(localStorage.getItem("ams_jugadores_v2")) || [];
    if (plantel.length === 0) {
        alert("Aún no hay jugadores cargados en el módulo de Plantel.");
        return;
    }

    let importados = 0;
    plantel.forEach(j => {
        const existe = personasGym.some(p => (p.dni && p.dni === j.dni) || (p.nombre === j.nombre && p.apellido === j.apellido));
        if (!existe) {
            personasGym.push({
                id: j.id,
                nombre: j.nombre,
                apellido: j.apellido,
                dni: j.dni,
                whatsapp: j.contacto || "",
                categoria: j.categoria,
                peso: j.peso,
                objetivo: `Rendimiento ${j.posicion}`,
                lesiones: `Hábil: P.${j.pierna} / B.${j.brazo}`,
                nivel: "Avanzado / Atleta",
                activo: j.activo
            });
            importados++;
        }
    });

    guardarStorageGym();
    refrescarModuloGym();
    alert(`Sincronización completa: se importaron ${importados} jugador(es) al padrón del gimnasio.`);
}

function alternarBajaGym(id) {
    const p = personasGym.find(x => x.id === id);
    if (!p) return;
    p.activo = !p.activo;
    guardarStorageGym();
    refrescarModuloGym();
}

function eliminarPersonaGym(id) {
    const p = personasGym.find(x => x.id === id);
    if (!p) return;
    if (!confirm(`¿Eliminar a ${p.nombre} ${p.apellido} del padrón del gimnasio?`)) return;
    personasGym = personasGym.filter(x => x.id !== id);
    guardarStorageGym();
    refrescarModuloGym();
}

function renderPersonasGym() {
    const cont = document.getElementById("contenedorPersonasGym");
    if (!cont) return;

    const busq = (document.getElementById("buscarPersonaGym")?.value || "").toLowerCase();
    const filtro = document.getElementById("filtroEstadoGym")?.value || "activos";

    let lista = [...personasGym];
    if (filtro === "activos") lista = lista.filter(p => p.activo);
    if (filtro === "bajas") lista = lista.filter(p => !p.activo);
    if (busq) {
        lista = lista.filter(p =>
            p.nombre.toLowerCase().includes(busq) ||
            p.apellido.toLowerCase().includes(busq) ||
            (p.dni && p.dni.toLowerCase().includes(busq)) ||
            (p.objetivo && p.objetivo.toLowerCase().includes(busq))
        );
    }

    if (lista.length === 0) {
        cont.innerHTML = `
            <div class="empty-box">
                <h3 style="color:var(--text-main); margin-bottom:0.4rem;">No hay personas registradas en esta vista</h3>
                <p style="margin-bottom:1rem;">Inscribe a una persona con su WhatsApp para armarle y enviarle su rutina de gimnasio.</p>
                <button class="btn btn-primary" onclick="abrirModalPersonaGym()">+ Inscribir Primera Persona</button>
            </div>
        `;
        return;
    }

    let html = `
        <div class="card">
            <table class="responsive-table">
                <thead>
                    <tr>
                        <th>Nombre / Grupo</th>
                        <th>WhatsApp</th>
                        <th>Peso / Nivel</th>
                        <th>Objetivo / Cuidados</th>
                        <th>Rutinas</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

    lista.forEach(p => {
        const cantRutinas = rutinasGym.filter(r => r.personaId == p.id).length;
        const badge = p.activo
            ? `<span class="badge badge-ok">ACTIVO</span>`
            : `<span class="badge badge-danger">BAJA</span>`;

        html += `
            <tr>
                <td data-label="Persona"><div><strong>${p.apellido}, ${p.nombre}</strong><br><small style="color:var(--accent)">${p.categoria}</small></div></td>
                <td data-label="WhatsApp"><div>📱 ${p.whatsapp || 'Sin número'}</div></td>
                <td data-label="Peso / Nivel"><div><b>${p.peso ? p.peso + ' kg' : '-'}</b><br><small style="color:var(--text-muted)">${p.nivel}</small></div></td>
                <td data-label="Objetivo"><div>${p.objetivo}<br><small style="color:var(--warning)">⚠️ ${p.lesiones}</small></div></td>
                <td data-label="Rutinas"><span class="badge badge-ok">${cantRutinas} asignada(s)</span></td>
                <td data-label="Estado">${badge}</td>
                <td data-label="Acciones">
                    <div class="btn-group-wrap">
                        <button class="btn btn-sm btn-primary" onclick="irACrearRutinaPara(${p.id})">+ Rutina</button>
                        <button class="btn btn-sm btn-outline" onclick="abrirModalPersonaGym(${p.id})">✏️</button>
                        <button class="btn btn-sm btn-outline" onclick="alternarBajaGym(${p.id})">${p.activo ? 'Baja' : 'Alta'}</button>
                        <button class="btn btn-sm btn-danger" onclick="eliminarPersonaGym(${p.id})">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    cont.innerHTML = html;
}

function irACrearRutinaPara(idPersona) {
    mostrarVistaGym("constructor");
    document.getElementById("rutinaPersonaId").value = String(idPersona);
}

// =========================================================================
// 2. CONSTRUCTOR DE RUTINAS (SERIES, REPS, CARGAS, FORMAS)
// =========================================================================

function poblarSelectPersonasRutina() {
    const sel = document.getElementById("rutinaPersonaId");
    if (!sel) return;
    const prev = sel.value;
    const activos = personasGym.filter(p => p.activo);

    sel.innerHTML = "";
    if (activos.length === 0) {
        sel.innerHTML = `<option value="">-- Primero inscribe a una persona en el Gimnasio --</option>`;
        return;
    }

    activos.forEach(p => {
        sel.innerHTML += `<option value="${p.id}">👤 ${p.apellido}, ${p.nombre} (${p.categoria} — 📱 ${p.whatsapp})</option>`;
    });

    if (prev && activos.some(x => x.id == prev)) sel.value = prev;
}

function agregarBloqueEjercicio(datos = null) {
    const cont = document.getElementById("listaBloquesEjercicios");
    if (!cont) return;
    const n = cont.children.length + 1;

    const div = document.createElement("div");
    div.className = "exercise-item-card";
    div.innerHTML = `
        <div class="exercise-item-top">
            <span class="exercise-num-badge">Ejercicio #${n}</span>
            <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.exercise-item-card').remove(); renumerarBloques();">✕ Quitar</button>
        </div>

        <div class="form-grid-6">
            <div class="field field-full-mobile">
                <label>Ejercicio *</label>
                <input type="text" class="ex-nombre" list="listaSugerenciasGym" required placeholder="Ej: Press Banca / Sentadilla / Dominadas" value="${datos?.nombre || ''}">
            </div>
            <div class="field">
                <label>Series *</label>
                <input type="number" class="ex-series" required min="1" value="${datos?.series || 4}">
            </div>
            <div class="field">
                <label>Repeticiones *</label>
                <input type="text" class="ex-reps" required placeholder="Ej: 8-10 o 6 c/pierna" value="${datos?.reps || '8-10'}">
            </div>
            <div class="field">
                <label>Carga / Kilos</label>
                <input type="text" class="ex-peso" placeholder="Ej: 70kg o Lastre 10kg" value="${datos?.peso || ''}">
            </div>
            <div class="field">
                <label>RIR / RPE</label>
                <input type="text" class="ex-rpe" placeholder="Ej: RIR 2 / RPE 8" value="${datos?.rpe || 'RIR 2'}">
            </div>
            <div class="field">
                <label>Descanso</label>
                <input type="text" class="ex-descanso" placeholder="Ej: 90 seg" value="${datos?.descanso || '90 seg'}">
            </div>
        </div>

        <div class="form-grid-3" style="margin-top: 0.75rem;">
            <div class="field">
                <label>Tipo de Ejecución / Forma</label>
                <select class="ex-modalidad">
                    <option value="Controlado Estándar">Controlado Estándar</option>
                    <option value="Unilateral (Empezar por lado débil)">Unilateral (Empezar por lado débil)</option>
                    <option value="Explosivo / Potencia Concéntrica">Explosivo / Potencia Concéntrica</option>
                    <option value="Isométrico (Pausa 2-3 seg)">Isométrico (Pausa 2-3 seg)</option>
                    <option value="Excéntrico Lento (Bajada en 3-4 seg)">Excéntrico Lento (Bajada en 3-4 seg)</option>
                </select>
            </div>
            <div class="field" style="grid-column: span 2;">
                <label>Indicaciones Técnicas para el Alumno (Saldrán en su WhatsApp)</label>
                <input type="text" class="ex-forma" placeholder="Ej: Escápulas retraídas, cuidar alineación de rodilla, no rebotar abajo..." value="${datos?.forma || ''}">
            </div>
        </div>
    `;
    cont.appendChild(div);
}

function renumerarBloques() {
    document.querySelectorAll("#listaBloquesEjercicios .exercise-item-card").forEach((c, idx) => {
        c.querySelector(".exercise-num-badge").innerText = `Ejercicio #${idx + 1}`;
    });
}

function cargarPlantillaGym(tipo) {
    const cont = document.getElementById("listaBloquesEjercicios");
    cont.innerHTML = "";
    if (tipo === "superior") {
        document.getElementById("rutinaTitulo").value = "Día 1 - Fuerza e Hipertrofia Tren Superior";
        agregarBloqueEjercicio({ nombre: "Press de Banca Plano con Barra", series: 4, reps: "6-8", peso: "Pesado", rpe: "RIR 2", descanso: "2 min", forma: "Retracción escapular firme, bajar controlado al pecho." });
        agregarBloqueEjercicio({ nombre: "Dominadas Estrictas / Lastradas", series: 4, reps: "6-8", peso: "Peso Corp. + Lastre", rpe: "RIR 1-2", descanso: "2 min", forma: "Extensión completa de brazos abajo, pecho a la barra." });
        agregarBloqueEjercicio({ nombre: "Remo Unilateral con Mancuerna", series: 3, reps: "10 c/lado", peso: "Moderado", rpe: "RIR 2", descanso: "75 seg", forma: "Empezar por el brazo menos hábil, espalda neutra." });
    } else {
        document.getElementById("rutinaTitulo").value = "Día 2 - Fuerza Piernas, Asimetrías y Potencia";
        agregarBloqueEjercicio({ nombre: "Sentadilla Trasera con Barra", series: 4, reps: "5-6", peso: "80% 1RM", rpe: "RPE 8", descanso: "2.5 min", forma: "Romper paralelo manteniendo neutro lumbar, subir explosivo." });
        agregarBloqueEjercicio({ nombre: "Salto al Cajón (Pliometría)", series: 4, reps: "5 saltos", peso: "Peso Corporal", rpe: "Máxima Velocidad", descanso: "90 seg", forma: "Caer suave sobre el cajón amortiguando impacto." });
        agregarBloqueEjercicio({ nombre: "Sentadilla Búlgara Unilateral", series: 3, reps: "8 c/pierna", peso: "Mancuernas", rpe: "RIR 2", descanso: "90 seg", forma: "Iniciar con pierna débil, evitar que la rodilla colapse hacia adentro." });
    }
}

function guardarRutinaGym(e) {
    e.preventDefault();
    const personaId = document.getElementById("rutinaPersonaId").value;
    const persona = personasGym.find(p => p.id == personaId);
    if (!persona) {
        alert("Primero debes inscribir y seleccionar a una persona del gimnasio.");
        return;
    }

    const cards = document.querySelectorAll("#listaBloquesEjercicios .exercise-item-card");
    if (cards.length === 0) {
        alert("Agrega al menos un ejercicio a la rutina.");
        return;
    }

    const ejercicios = [];
    cards.forEach(c => {
        ejercicios.push({
            nombre: c.querySelector(".ex-nombre").value.trim(),
            series: c.querySelector(".ex-series").value,
            reps: c.querySelector(".ex-reps").value.trim(),
            peso: c.querySelector(".ex-peso").value.trim() || "Ajustar carga",
            rpe: c.querySelector(".ex-rpe").value.trim() || "-",
            descanso: c.querySelector(".ex-descanso").value.trim() || "90s",
            modalidad: c.querySelector(".ex-modalidad").value,
            forma: c.querySelector(".ex-forma").value.trim()
        });
    });

    const nueva = {
        id: Date.now(),
        fecha: new Date().toLocaleDateString("es-AR"),
        personaId: persona.id,
        personaNombre: `${persona.nombre} ${persona.apellido}`,
        personaWhatsapp: persona.whatsapp,
        personaCategoria: persona.categoria,
        titulo: document.getElementById("rutinaTitulo").value.trim(),
        enfoque: document.getElementById("rutinaEnfoque").value,
        frecuencia: document.getElementById("rutinaFrecuencia").value.trim() || "Semanal",
        observaciones: document.getElementById("rutinaObservaciones").value.trim(),
        ejercicios
    };

    rutinasGym.unshift(nueva);
    guardarStorageGym();

    document.getElementById("formRutinaGym").reset();
    document.getElementById("listaBloquesEjercicios").innerHTML = "";
    agregarBloqueEjercicio();

    mostrarVistaGym("rutinas");
}

// =========================================================================
// 3. ENVÍO DIRECTO POR WHATSAPP Y VISTA MODO ALUMNO
// =========================================================================

function armarTextoWhatsApp(rutina) {
    let texto = `🏋️ *RUTINA DE GIMNASIO - AMS ELITE*\n`;
    texto += `👤 *Atleta/Alumno:* ${rutina.personaNombre}\n`;
    texto += `📌 *Sesión:* ${rutina.titulo}\n`;
    texto += `🎯 *Objetivo:* ${rutina.enfoque} (${rutina.frecuencia})\n`;
    texto += `📅 *Fecha:* ${rutina.fecha}\n`;
    texto += `----------------------------------\n\n`;

    rutina.ejercicios.forEach((ex, idx) => {
        texto += `*${idx + 1}. ${ex.nombre.toUpperCase()}*\n`;
        texto += `   • *Series y Reps:* ${ex.series} series x ${ex.reps}\n`;
        texto += `   • *Carga:* ${ex.peso} (${ex.rpe})\n`;
        texto += `   • *Pausa:* ${ex.descanso} | *Modo:* ${ex.modalidad}\n`;
        if (ex.forma) {
            texto += `   💡 _Técnica: ${ex.forma}_\n`;
        }
        texto += `\n`;
    });

    if (rutina.observaciones) {
        texto += `----------------------------------\n`;
        texto += `📝 *Indicaciones del Profe:*\n${rutina.observaciones}\n`;
    }

    return texto;
}

function enviarRutinaPorWhatsApp(idRutina) {
    const r = rutinasGym.find(x => x.id === idRutina);
    if (!r) return;

    // Buscar el teléfono actualizado de la persona
    const per = personasGym.find(p => p.id == r.personaId);
    let telefono = (per?.whatsapp || r.personaWhatsapp || "").replace(/\D/g, "");

    if (!telefono) {
        const manual = prompt("Esta persona no tiene un número cargado. Ingresa su WhatsApp (Ej: 5493584123456):", "549");
        if (!manual) return;
        telefono = manual.replace(/\D/g, "");
        if (per) {
            per.whatsapp = telefono;
            guardarStorageGym();
        }
    }

    const mensaje = encodeURIComponent(armarTextoWhatsApp(r));
    const url = `https://wa.me/${telefono}?text=${mensaje}`;
    window.open(url, "_blank");
}

function copiarRutinaPortapapeles(idRutina) {
    const r = rutinasGym.find(x => x.id === idRutina);
    if (!r) return;
    navigator.clipboard.writeText(armarTextoWhatsApp(r)).then(() => {
        alert("✅ Rutina copiada al portapapeles lista para pegar en WhatsApp o Instagram.");
    });
}

function verModoAlumno(idRutina) {
    const r = rutinasGym.find(x => x.id === idRutina);
    if (!r) return;

    let htmlEx = "";
    r.ejercicios.forEach((ex, i) => {
        htmlEx += `
            <div class="plan-ex-row" style="margin-bottom:0.6rem;">
                <strong>${i + 1}. ${ex.nombre}</strong>
                <div class="plan-ex-meta">
                    <span>📊 <b>${ex.series} × ${ex.reps}</b></span>
                    <span>🏋️ <b>${ex.peso}</b></span>
                    <span>⏱️ ${ex.descanso}</span>
                </div>
                <div class="plan-ex-cues">🎯 ${ex.modalidad} ${ex.forma ? '— ' + ex.forma : ''}</div>
            </div>
        `;
    });

    document.getElementById("contenidoVistaAlumno").innerHTML = `
        <div style="background:var(--bg-main); padding:1.25rem; border-radius:12px; border:1px solid var(--border);">
            <span class="badge badge-ok">${r.enfoque}</span>
            <h2 style="margin-top:0.4rem; font-size:1.25rem;">${r.titulo}</h2>
            <p style="color:var(--accent); font-weight:700; margin-bottom:1rem;">👤 ${r.personaNombre} • ${r.frecuencia}</p>
            ${htmlEx}
            ${r.observaciones ? `<div style="margin-top:0.8rem; font-size:0.85rem; padding:0.75rem; background:rgba(59,130,246,0.12); border-radius:8px;">📝 <b>Profe:</b> ${r.observaciones}</div>` : ''}
        </div>
        <div class="modal-bottom">
            <button class="btn btn-outline" onclick="copiarRutinaPortapapeles(${r.id})">📋 Copiar Texto</button>
            <button class="btn btn-success" onclick="enviarRutinaPorWhatsApp(${r.id})">📲 Enviar por WhatsApp</button>
        </div>
    `;

    document.getElementById("modalVistaAlumno").classList.remove("hidden");
}

function cerrarVistaAlumno() {
    document.getElementById("modalVistaAlumno").classList.add("hidden");
}

function eliminarRutinaGym(id) {
    if (!confirm("¿Eliminar esta rutina?")) return;
    rutinasGym = rutinasGym.filter(r => r.id !== id);
    guardarStorageGym();
    renderRutinasGuardadas();
}

function renderRutinasGuardadas() {
    const cont = document.getElementById("contenedorRutinasGuardadas");
    if (!cont) return;

    const filtro = (document.getElementById("buscarRutinaGuardada")?.value || "").toLowerCase();
    let lista = [...rutinasGym];

    if (filtro) {
        lista = lista.filter(r =>
            r.personaNombre.toLowerCase().includes(filtro) ||
            r.titulo.toLowerCase().includes(filtro) ||
            r.enfoque.toLowerCase().includes(filtro)
        );
    }

    if (lista.length === 0) {
        cont.innerHTML = `
            <div class="empty-box" style="grid-column: 1 / -1;">
                <h3 style="color:var(--text-main); margin-bottom:0.4rem;">No hay rutinas creadas todavía</h3>
                <p style="margin-bottom:1rem;">Arma una rutina personalizada para cualquiera de tus inscriptos y envíasela por WhatsApp.</p>
                <button class="btn btn-primary" onclick="mostrarVistaGym('constructor')">+ Crear Primera Rutina</button>
            </div>
        `;
        return;
    }

    cont.innerHTML = "";
    lista.forEach(r => {
        let resumenEj = "";
        r.ejercicios.forEach((ex, idx) => {
            resumenEj += `
                <div class="plan-ex-row">
                    <strong>${idx + 1}. ${ex.nombre}</strong>
                    <div class="plan-ex-meta">
                        <span>📊 <b>${ex.series} × ${ex.reps}</b></span>
                        <span>🏋️ <b>${ex.peso}</b></span>
                        <span>🔥 ${ex.rpe}</span>
                        <span>⏱️ ${ex.descanso}</span>
                    </div>
                    <div class="plan-ex-cues">🎯 ${ex.modalidad} ${ex.forma ? '— ' + ex.forma : ''}</div>
                </div>
            `;
        });

        cont.innerHTML += `
            <div class="plan-card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem;">
                    <div>
                        <span class="badge badge-ok">${r.enfoque}</span>
                        <h3 style="margin-top:0.4rem; font-size:1.1rem;">${r.titulo}</h3>
                        <p style="color:var(--accent); font-weight:700; font-size:0.88rem; margin-top:2px;">👤 ${r.personaNombre}</p>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="eliminarRutinaGym(${r.id})">🗑️</button>
                </div>

                <div style="font-size:0.78rem; color:var(--text-muted);">
                    📅 ${r.fecha} | 🗓️ <b>${r.frecuencia}</b> | 📱 ${r.personaWhatsapp || 'Sin teléfono'}
                </div>

                <div style="display:flex; flex-direction:column; gap:0.45rem;">
                    ${resumenEj}
                </div>

                <div class="btn-group-wrap" style="margin-top: auto; padding-top: 0.75rem; border-top: 1px solid var(--border);">
                    <button class="btn btn-success btn-sm" style="flex:1;" onclick="enviarRutinaPorWhatsApp(${r.id})">
                        📲 Enviar WhatsApp
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="verModoAlumno(${r.id})">
                        📱 Vista Alumno
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="copiarRutinaPortapapeles(${r.id})">
                        📋 Copiar
                    </button>
                </div>
            </div>
        `;
    });
}

document.addEventListener("DOMContentLoaded", () => {
    agregarBloqueEjercicio();
    refrescarModuloGym();
});