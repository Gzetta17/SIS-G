/**
 * js/portal-socio.js — Portal del Socio / Deportista por Código o DNI (mi-ficha.html)
 * CDM Pro Suite — Desarrollado por Gonzalo Adanchú
 */

function autenticarSocioPorDni(e) {
    e.preventDefault();
    const valor = (document.getElementById("inputDniSocioLogin")?.value || "").trim().toUpperCase();
    if (!valor) return;

    basePersonas.forEach(p => asegurarPilaresPersona(p));
    const limpio = valor.replace(/[^A-Z0-9]/g, "");

    const socio = basePersonas.find(p => {
        if (!p || !p.activo) return false;
        const cod = (p.codigoAcceso || "").toUpperCase();
        const codLimpio = cod.replace(/[^A-Z0-9]/g, "");
        return p.dni === valor || cod === valor || codLimpio === limpio || cod.split("-")[1] === valor;
    });

    if (!socio) {
        alert("❌ No se encontró ningún deportista o socio activo con ese Código o DNI.");
        return;
    }

    sessionStorage.setItem("cdm_socio_dni_activo", socio.dni);
    mostrarToast(`👋 ¡Bienvenido/a, ${socio.nombre}!`);
    inicializarPanelSocio();
}

function obtenerSocioLogueadoURLoSession() {
    const dni = sessionStorage.getItem("cdm_socio_dni_activo");
    if (dni) {
        const porDni = basePersonas.find(p => p.dni === dni && p.activo);
        if (porDni) return porDni;
    }
    try {
        const ses = JSON.parse(localStorage.getItem("cdm_sesion_activa_v1"));
        if (ses?.personaId) return basePersonas.find(p => Number(p.id) === Number(ses.personaId) && p.activo) || null;
    } catch {}
    return null;
}

function cerrarSesionSocio() {
    sessionStorage.removeItem("cdm_socio_dni_activo");
    window.location.reload();
}

function cambiarTabSocio(seccion, btnEl) {
    document.querySelectorAll(".socio-seccion").forEach(s => { s.classList.add("hidden"); s.classList.remove("animate-in"); });
    const sec = document.getElementById(`socio-sec-${seccion}`);
    if (sec) { sec.classList.remove("hidden"); sec.classList.add("animate-in"); }
    document.querySelectorAll(".module-tabs .mod-tab").forEach(b => b.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");
}

function inicializarPanelSocio() {
    if (document.body?.dataset.page !== "mi-ficha") return;
    const socio = obtenerSocioLogueadoURLoSession();
    const panelLogin = document.getElementById("panelLoginSocio");
    const panelDash = document.getElementById("panelDashboardSocio");

    if (!socio) {
        panelLogin?.classList.remove("hidden");
        panelDash?.classList.add("hidden");
        return;
    }

    panelLogin?.classList.add("hidden");
    panelDash?.classList.remove("hidden");
    asegurarPilaresPersona(socio);
    if (typeof asegurarVideotecaCargada === "function") asegurarVideotecaCargada();

    const cab = document.getElementById("socioCabeceraInfo");
    if (cab) {
        const fueSem = contarAsistenciasUltimos7Dias(socio), pact = socio.frecuenciaSemanal || 3;
        const alDia = (socio.pagoEstado || "Al Día") === "Al Día";
        cab.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                <div style="display:flex; align-items:center; gap:1rem;">
                    ${renderAvatarPersonaCDM(socio, 66, "1.3rem", true)}
                    <div>
                        <div style="display:flex; gap:0.35rem; flex-wrap:wrap; margin-bottom:0.25rem;">
                            <span class="badge badge-celeste">${socio.deporte} • ${socio.deporte === "Gimnasio" ? "Socio Gym" : socio.categoria}</span>
                            <span class="badge badge-purple">🔑 ${socio.codigoAcceso}</span>
                            ${socio.deporte !== "Gimnasio" ? `<span class="badge badge-purple">⭐ ${socio.puntosCategoria}/10</span>` : ""}
                            <span class="badge ${fueSem < pact ? "badge-warn" : "badge-ok"}">📅 ${fueSem}/${pact} días</span>
                            <span class="badge ${alDia ? "badge-ok" : "badge-danger"}">${alDia ? "💳 Al Día" : "⚠️ Pendiente"}</span>
                        </div>
                        <h2 style="font-size:1.35rem; font-weight:900;">${socio.nombre} ${socio.apellido}</h2>
                        <small style="color:var(--ink-500); font-weight:700;">${socio.puesto} • DNI ${socio.dni}</small>
                    </div>
                </div>
                <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="abrirPanelFotoPerfilCDM(${socio.id})"><i class="ri-camera-lens-line"></i> Mi Foto</button>
                    <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarMensajeProfeWhatsApp('${socio.nombre}')"><i class="ri-whatsapp-line"></i> Consultar al Profe</button>
                </div>
            </div>
        `;
    }

    renderizarRutinasSocio(socio);

    const selEx = document.getElementById("socioSelectEjercicio");
    if (selEx) {
        const unicos = [...new Set((socio.evaluaciones || []).map(e => e.ejercicio))];
        selEx.innerHTML = unicos.length ? unicos.map(nom => `<option value="${nom}">${nom}</option>`).join("") : `<option value="">-- Sin marcas aún --</option>`;
    }
    renderizarGraficoSocio(socio);
    renderizarRankingSocio(socio);
}

function renderizarRutinasSocio(socio) {
    const cont = document.getElementById("socioListaRutinas");
    if (!cont) return;
    const rutinas = (baseRutinas || []).filter(r =>
        Number(r.personaId) === Number(socio.id) || (r.esGrupal && r.deporteDestino === socio.deporte && (r.categoriaDestino === socio.categoria || r.categoriaDestino === "General"))
    );
    if (!rutinas.length) { cont.innerHTML = `<div class="empty-box" style="grid-column:1/-1;">Todavía no tenés rutinas asignadas.</div>`; return; }

    cont.innerHTML = rutinas.map(r => `
        <div class="athlete-card" style="cursor:default;">
            <span class="badge ${r.esGrupal ? "badge-purple" : "badge-celeste"}">${r.esGrupal ? "🏟️ Grupal" : "👤 Personal"}</span>
            <h4 style="font-size:1.05rem; margin-top:4px;">${r.nombre}</h4>
            <small style="color:var(--ink-500);">${r.objetivo} • ${r.dias}</small>
            <div style="margin-top:0.5rem; display:flex; flex-direction:column; gap:0.4rem;">
                ${(r.ejercicios || []).map((ex, i) => {
                    const vid = (baseVideoteca || []).find(v => normalizarTextoEjercicioCDM(v.nombre).includes(normalizarTextoEjercicioCDM(ex.nombre)));
                    return `
                        <div style="padding:0.55rem 0.7rem; background:var(--surface-subtle); border:1px solid var(--line); border-radius:10px; font-size:0.82rem;">
                            <strong>${i + 1}. ${ex.nombre}</strong>
                            <div style="display:flex; gap:0.75rem; font-size:0.74rem; color:var(--ink-500); margin-top:2px;">
                                <span>📊 ${ex.series}×${ex.reps}</span><span>🏋️ ${ex.peso}</span><span>⏱️ ${ex.pausa}</span>
                            </div>
                            ${vid ? `<button class="btn btn-primary btn-sm" style="margin-top:0.35rem; min-height:26px; font-size:0.7rem;" onclick="abrirModalReproductorEjercicio(${vid.id})">▶ Ver Video</button>` : ""}
                        </div>
                    `;
                }).join("")}
            </div>
        </div>
    `).join("");
}

function renderizarGraficoSocio(socioOpt = null) {
    const socio = socioOpt || obtenerSocioLogueadoURLoSession();
    const cv = document.getElementById("canvasSocioProgreso");
    if (!cv || !socio || typeof Chart === "undefined") return;
    const nom = document.getElementById("socioSelectEjercicio")?.value;
    const datos = (socio.evaluaciones || []).filter(e => e.ejercicio === nom).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    if (window.chartSocioInstancia) { window.chartSocioInstancia.destroy(); window.chartSocioInstancia = null; }
    if (!datos.length) return;
    window.chartSocioInstancia = new Chart(cv.getContext("2d"), {
        type: "line",
        data: { labels: datos.map(d => d.fecha), datasets: [{ label: `${nom} (${datos[0].unidad})`, data: datos.map(d => d.valor), borderColor: "#0095db", backgroundColor: "rgba(0,149,219,0.16)", borderWidth: 3, fill: true, tension: 0.32 }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderizarRankingSocio(socio) {
    const cont = document.getElementById("socioTablaRankingDiv");
    if (!cont) return;
    if (socio.deporte === "Gimnasio") {
        cont.innerHTML = `<div class="empty-box">El ranking competitivo es exclusivo para planteles deportivos.</div>`;
        return;
    }
    const activos = basePersonas.filter(p => p.deporte === socio.deporte && p.categoria === socio.categoria && p.activo);
    activos.forEach(p => asegurarPilaresPersona(p));
    activos.sort((a, b) => (b.puntosCategoria || 0) - (a.puntosCategoria || 0));
    cont.innerHTML = `<div class="table-wrap"><table class="app-table"><thead><tr><th>Pos</th><th>Deportista</th><th>Puesto</th><th>Score</th></tr></thead><tbody>` +
        activos.map((p, i) => `<tr style="${p.id === socio.id ? "background:var(--cdm-50); font-weight:700;" : ""}"><td><b>#${i + 1}°</b></td><td><b>${p.apellido}, ${p.nombre}</b> ${p.id === socio.id ? '<span class="badge badge-ok">Vos</span>' : ""}</td><td>${p.puesto}</td><td><span class="badge badge-purple">⭐ ${p.puntosCategoria}/10</span></td></tr>`).join("") + `</tbody></table></div>`;
}

function enviarMensajeProfeWhatsApp(nombreSocio) {
    const club = obtenerLicenciaConfigCDM().nombreEntidad;
    window.open(`https://wa.me/?text=${encodeURIComponent(`Hola Profe, soy ${nombreSocio} (${club}). Le consulto sobre mis entrenamientos.`)}`, "_blank");
}