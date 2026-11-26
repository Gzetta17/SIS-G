/**
 * js/gimnasio.js — Módulo Gimnasio, Planilla de Asistencias, Gráficos, Récords PR,
 * Constructor de Rutinas (Gym + Deportes), Videoteca (IndexedDB) y Motor Biomecánico 60 FPS
 * CDM Pro Suite — Desarrollado por Gonzalo Adanchú
 */

// =========================================================================
// 1. ESTILOS DE VIDEOTECA Y TARJETAS DE EJERCICIOS
// =========================================================================

(function inyectarCSSGimnasioYVideoteca() {
    if (document.getElementById("cdmCssGimnasioMod")) return;
    const st = document.createElement("style");
    st.id = "cdmCssGimnasioMod";
    st.textContent = `
        .videoteca-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(305px, 1fr));
            gap: 1.15rem;
        }
        .video-exercise-card {
            background: var(--surface-solid, #ffffff);
            border: 1.5px solid var(--line, #e2e8f0);
            border-radius: 18px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: var(--shadow-card);
            transition: all 0.22s ease;
        }
        .video-exercise-card:hover {
            transform: translateY(-4px);
            border-color: var(--cdm-500, #0284c7);
            box-shadow: var(--shadow-float);
        }
        .video-thumb-box {
            position: relative;
            height: 180px;
            background: var(--cdm-900, #0c192c);
            overflow: hidden;
            cursor: pointer;
        }
        .video-thumb-box img { width: 100%; height: 100%; object-fit: cover; opacity: 0.88; transition: transform 0.35s ease; }
        .video-exercise-card:hover .video-thumb-box img { transform: scale(1.06); opacity: 1; }
        .video-play-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, rgba(6, 40, 61, 0.85) 0%, rgba(6, 40, 61, 0.18) 60%);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .play-circle-btn {
            width: 54px;
            height: 54px;
            border-radius: 50%;
            background: rgba(2, 132, 199, 0.94);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.45rem;
            border: 2.5px solid #ffffff;
            box-shadow: 0 8px 24px rgba(2, 132, 199, 0.45);
        }
        .video-card-body { padding: 1.05rem; display: flex; flex-direction: column; gap: 0.6rem; flex: 1; }
        .video-cues-box {
            background: var(--cdm-50, #f0f9ff);
            border-left: 3.5px solid var(--cdm-500, #0284c7);
            padding: 0.5rem 0.68rem;
            border-radius: 8px;
            font-size: 0.77rem;
            color: var(--ink-700, #334155);
            line-height: 1.4;
        }
        .video-iframe-container {
            position: relative;
            width: 100%;
            padding-bottom: 56.25%;
            height: 0;
            background: #000;
            border-radius: 14px;
            overflow: hidden;
            margin-bottom: 0.95rem;
        }
        .video-iframe-container iframe,
        .video-iframe-container video {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
        }
        .video-source-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem; margin-bottom: 0.7rem; }
        .video-source-tab {
            border: 1.5px solid var(--line-strong, #cbd5e1);
            background: var(--surface-subtle, #f8fafc);
            color: var(--ink-700, #334155);
            font-size: 0.78rem;
            font-weight: 800;
            padding: 0.5rem;
            border-radius: 10px;
            cursor: pointer;
        }
        .video-source-tab.active { background: #0284c7; border-color: #0284c7; color: #ffffff; }
        .video-upload-zone {
            background: var(--surface-subtle, #f8fafc);
            border: 1.5px dashed var(--line-celeste, #7dd3fc);
            border-radius: 14px;
            padding: 1rem;
            text-align: center;
            margin-bottom: 0.85rem;
        }
    `;
    document.head.appendChild(st);
})();

// =========================================================================
// 2. VIDEOTECA UNIFICADA + ALMACENAMIENTO DE VIDEOS PROPIOS EN INDEXEDDB
// =========================================================================

const VIDEOTECA_POR_DEFECTO = [
    {
        id: 9001, nombre: "Sentadilla Trasera con Barra", grupo: "Tren Inferior", grupoSecundario: "Piernas y Glúteos",
        nivel: "Intermedio / Avanzado", equipo: "Barra Olímpica y Rack", seriesSugeridas: 4, repsSugeridas: "6-8", pausaSugerida: "2m",
        patron: "squat", videoUrl: "https://www.youtube.com/watch?v=ultWZbUMPL8",
        imagenPreview: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=700&q=80",
        clavesTecnicas: "Pies al ancho de hombros, bracing abdominal, bajar controlando rodillas en línea con pies y empujar el piso con fuerza.",
        erroresComunes: "Evitar que las rodillas colapsen hacia adentro o despegar talones."
    },
    {
        id: 9002, nombre: "Press de Banca Plano", grupo: "Empuje / Torso", grupoSecundario: "Pecho y Empuje",
        nivel: "Todos los niveles", equipo: "Banco Plano y Barra", seriesSugeridas: 4, repsSugeridas: "8-10", pausaSugerida: "90s",
        patron: "bench", videoUrl: "https://www.youtube.com/watch?v=rT7DgCr-3pg",
        imagenPreview: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=700&q=80",
        clavesTecnicas: "Retraer escápulas contra el banco, pies firmes, bajar controlado al esternón con codos a 45°.",
        erroresComunes: "No abrir los codos a 90° ni rebotar la barra en el pecho."
    },
    {
        id: 9003, nombre: "Peso Muerto Rumano (Isquios y Glúteos)", grupo: "Tren Inferior", grupoSecundario: "Piernas y Glúteos",
        nivel: "Intermedio", equipo: "Barra o Mancuernas", seriesSugeridas: 4, repsSugeridas: "8-10", pausaSugerida: "90s",
        patron: "deadlift", videoUrl: "https://www.youtube.com/watch?v=JCXUYuzwNrM",
        imagenPreview: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=700&q=80",
        clavesTecnicas: "Bisagra de cadera llevando la cola hacia atrás con leve flexión de rodillas y espalda neutra.",
        erroresComunes: "Encorvar la zona lumbar o doblar demasiado las rodillas."
    },
    {
        id: 9004, nombre: "Dominadas / Jalón al Pecho en Polea", grupo: "Tracción / Espalda", grupoSecundario: "Espalda y Tracción",
        nivel: "Todos los niveles", equipo: "Barra Fija o Polea Alta", seriesSugeridas: 4, repsSugeridas: "8-12", pausaSugerida: "90s",
        patron: "pull", videoUrl: "https://www.youtube.com/watch?v=eGo4IYlbE5g",
        imagenPreview: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=700&q=80",
        clavesTecnicas: "Deprimir escápulas y traccionar llevando los codos hacia las costillas hasta el pecho superior.",
        erroresComunes: "Balancear el cuerpo o encoger los hombros hacia las orejas."
    },
    {
        id: 9005, nombre: "Sentadilla Búlgara Unilateral", grupo: "Tren Inferior", grupoSecundario: "Piernas y Glúteos",
        nivel: "Intermedio", equipo: "Banco y Mancuernas", seriesSugeridas: 3, repsSugeridas: "8-10 c/pierna", pausaSugerida: "75s",
        patron: "lunge", videoUrl: "https://www.youtube.com/watch?v=2C-uNgKwPLE",
        imagenPreview: "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=700&q=80",
        clavesTecnicas: "Empezar por la pierna menos hábil, torso levemente inclinado y rodilla delantera estable.",
        erroresComunes: "Perder la alineación de rodilla o cargar todo el peso atrás."
    },
    {
        id: 9006, nombre: "Hip Thrust con Barra (Empuje de Cadera)", grupo: "Tren Inferior", grupoSecundario: "Piernas y Glúteos",
        nivel: "Todos los niveles", equipo: "Banco y Barra", seriesSugeridas: 4, repsSugeridas: "10-12", pausaSugerida: "90s",
        patron: "thrust", videoUrl: "https://www.youtube.com/watch?v=SEdqd1n0cvg",
        imagenPreview: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=700&q=80",
        clavesTecnicas: "Apoyar borde inferior escapular, mirada al frente, empujar con talones y sostener 1 seg arriba.",
        erroresComunes: "Hiperextender la zona lumbar en lugar de bloquear con pelvis."
    },
    {
        id: 9007, nombre: "Remo Unilateral con Mancuerna", grupo: "Tracción / Espalda", grupoSecundario: "Espalda y Tracción",
        nivel: "Todos los niveles", equipo: "Banco y Mancuerna", seriesSugeridas: 3, repsSugeridas: "10-12 c/lado", pausaSugerida: "60s",
        patron: "row", videoUrl: "https://www.youtube.com/watch?v=pYcpY20QaE8",
        imagenPreview: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=700&q=80",
        clavesTecnicas: "Tronco firme paralelo al suelo, llevar la mancuerna en curva hacia la cadera.",
        erroresComunes: "Rotar el torso o tirar solo con el bíceps hacia el hombro."
    },
    {
        id: 9008, nombre: "Press Militar de Hombros", grupo: "Empuje / Torso", grupoSecundario: "Pecho y Empuje",
        nivel: "Intermedio", equipo: "Barra o Mancuernas", seriesSugeridas: 4, repsSugeridas: "8-10", pausaSugerida: "90s",
        patron: "ohp", videoUrl: "https://www.youtube.com/watch?v=2yjwXTZQDDI",
        imagenPreview: "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?auto=format&fit=crop&w=700&q=80",
        clavesTecnicas: "Contraer glúteos y abdomen, empujar vertical desde clavículas hasta bloquear arriba.",
        erroresComunes: "Arquear la cintura hacia atrás."
    },
    {
        id: 9009, nombre: "Plancha Abdominal RKC y Core", grupo: "Core y Funcional", grupoSecundario: "Core y Funcional",
        nivel: "Todos los niveles", equipo: "Colchoneta", seriesSugeridas: 4, repsSugeridas: "35s sostén", pausaSugerida: "45s",
        patron: "plank", videoUrl: "https://www.youtube.com/watch?v=ASdvN_XEl_c",
        imagenPreview: "https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?auto=format&fit=crop&w=700&q=80",
        clavesTecnicas: "Codos debajo de hombros, glúteos y abdomen contraídos al 100%.",
        erroresComunes: "Dejar caer la cadera generando tensión lumbar."
    },
    {
        id: 9010, nombre: "Salto al Cajón Explosivo (Box Jump)", grupo: "Potencia y Pliometría", grupoSecundario: "Piernas y Glúteos",
        nivel: "Intermedio / Avanzado", equipo: "Cajón Pliométrico", seriesSugeridas: 4, repsSugeridas: "5 saltos", pausaSugerida: "90s",
        patron: "jump", videoUrl: "https://www.youtube.com/watch?v=52r_Ul5k03g",
        imagenPreview: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=700&q=80",
        clavesTecnicas: "Triple extensión rápida y aterrizaje suave amortiguando en media sentadilla.",
        erroresComunes: "Aterrizar con rodillas rígidas o bajar saltando de espaldas."
    }
];

const CDM_IDB_VIDEO_NAME = "cdm_videoteca_archivos_db_v1";
const CDM_IDB_VIDEO_STORE = "videos_locales";
let archivoVideoTemporalModalCDM = null;
let miniaturaVideoTemporalModalCDM = null;

function abrirBaseDatosVideosIDB() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) return reject(new Error("IndexedDB no disponible"));
        const req = indexedDB.open(CDM_IDB_VIDEO_NAME, 1);
        req.onupgradeneeded = (e) => {
            if (!e.target.result.objectStoreNames.contains(CDM_IDB_VIDEO_STORE)) {
                e.target.result.createObjectStore(CDM_IDB_VIDEO_STORE, { keyPath: "id" });
            }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

async function guardarArchivoVideoEnIDB(claveId, blobFile, nombreArchivo = "") {
    const db = await abrirBaseDatosVideosIDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(CDM_IDB_VIDEO_STORE, "readwrite");
        tx.objectStore(CDM_IDB_VIDEO_STORE).put({ id: claveId, blob: blobFile, nombreArchivo: nombreArchivo || blobFile.name || "video.mp4", tipo: blobFile.type || "video/mp4", fecha: new Date().toISOString() });
        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => reject(e.target.error);
    });
}

async function obtenerArchivoVideoDesdeIDB(claveId) {
    try {
        const db = await abrirBaseDatosVideosIDB();
        return await new Promise((resolve) => {
            const req = db.transaction(CDM_IDB_VIDEO_STORE, "readonly").objectStore(CDM_IDB_VIDEO_STORE).get(claveId);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    } catch { return null; }
}

async function eliminarArchivoVideoDesdeIDB(claveId) {
    if (!claveId) return;
    try {
        const db = await abrirBaseDatosVideosIDB();
        db.transaction(CDM_IDB_VIDEO_STORE, "readwrite").objectStore(CDM_IDB_VIDEO_STORE).delete(claveId);
    } catch {}
}

function extraerMiniaturaDeVideoArchivoCDM(file) {
    return new Promise((resolve) => {
        try {
            const url = URL.createObjectURL(file);
            const video = document.createElement("video");
            video.preload = "metadata"; video.muted = true; video.playsInline = true; video.src = url;
            const fin = (dataUrl) => { setTimeout(() => URL.revokeObjectURL(url), 1200); resolve(dataUrl); };
            video.onloadeddata = () => { video.currentTime = Math.min(1.0, (video.duration || 2) * 0.25); };
            video.onseeked = () => {
                try {
                    const c = document.createElement("canvas");
                    c.width = 480; c.height = 270;
                    c.getContext("2d").drawImage(video, 0, 0, c.width, c.height);
                    fin(c.toDataURL("image/jpeg", 0.8));
                } catch { fin(null); }
            };
            video.onerror = () => fin(null);
        } catch { resolve(null); }
    });
}

function asegurarVideotecaCargada() {
    const vaciada = localStorage.getItem("cdm_videoteca_vaciada_manual_v1") === "1";
    if (!Array.isArray(baseVideoteca) || (baseVideoteca.length === 0 && !vaciada)) {
        baseVideoteca = [...VIDEOTECA_POR_DEFECTO];
        localStorage.setItem("cdm_videoteca_v1", JSON.stringify(baseVideoteca));
    }
    sincronizarDatalistsEjerciciosCDM();
}

function asegurarModalVideoEnPaginaActualCDM() {
    if (!document.getElementById("modalVideoEjercicio")) {
        const mv = document.createElement("div");
        mv.id = "modalVideoEjercicio";
        mv.className = "modal-backdrop hidden";
        document.body.appendChild(mv);
    }
}

function obtenerEmbedUrlVideo(url) {
    if (!url) return "";
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}?rel=0` : url;
}

function buscarVideoDeEjercicioPorNombreCDM(nombreEjercicio = "") {
    asegurarVideotecaCargada();
    const norm = normalizarTextoEjercicioCDM(nombreEjercicio);
    if (!norm) return null;
    return (baseVideoteca || []).find(v => {
        const vn = normalizarTextoEjercicioCDM(v.nombre);
        return vn === norm || vn.includes(norm) || norm.includes(vn);
    }) || null;
}

function cerrarModalVideoEjercicio() {
    const modal = document.getElementById("modalVideoEjercicio");
    if (!modal) return;
    modal.innerHTML = "";
    modal.classList.add("hidden");
}

function cambiarModoOrigenVideoModalCDM(modo) {
    const esArch = modo === "archivo";
    document.getElementById("tabOrigenArchivoCDM")?.classList.toggle("active", esArch);
    document.getElementById("tabOrigenLinkCDM")?.classList.toggle("active", !esArch);
    document.getElementById("bloqueSubirArchivoVideoCDM")?.classList.toggle("hidden", !esArch);
    document.getElementById("bloquePegarLinkVideoCDM")?.classList.toggle("hidden", esArch);
}

async function seleccionarArchivoVideoDesdeDispositivoCDM(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    archivoVideoTemporalModalCDM = file;
    const info = document.getElementById("infoArchivoVideoCargadoCDM");
    if (info) info.innerHTML = `<span class="badge badge-ok">✓ ${file.name} (${(file.size / 1048576).toFixed(1)} MB)</span>`;
    const prev = document.getElementById("previewPlayerVideoSubidoCDM");
    if (prev) { prev.src = URL.createObjectURL(file); prev.classList.remove("hidden"); }
    const thumb = await extraerMiniaturaDeVideoArchivoCDM(file);
    if (thumb) miniaturaVideoTemporalModalCDM = thumb;
}

async function abrirModalVideotecaProCDM(idEditar = null, nombrePre = "", grupoPre = "Tren Inferior") {
    asegurarVideotecaCargada();
    asegurarModalVideoEnPaginaActualCDM();
    const modal = document.getElementById("modalVideoEjercicio");
    if (!modal) return;

    archivoVideoTemporalModalCDM = null;
    miniaturaVideoTemporalModalCDM = null;

    const exEdit = idEditar ? baseVideoteca.find(x => Number(x.id) === Number(idEditar)) : null;
    const esEd = Boolean(exEdit);
    const tieneLocal = Boolean(exEdit && (exEdit.esVideoLocal || String(exEdit.videoUrl || "").startsWith("idb://")));
    const urlExt = (!tieneLocal && exEdit?.videoUrl && exEdit.videoUrl !== "biomech://simulador") ? exEdit.videoUrl : "";
    const nomIni = exEdit?.nombre || nombrePre || "";
    const grpIni = exEdit?.grupo || grupoPre || "Tren Inferior";
    const patIni = exEdit?.patron || detectarPatronMovimientoHombrecitoCDM(nomIni, grpIni);

    modal.innerHTML = `
        <div class="modal-window" style="max-width:650px;">
            <div class="modal-top">
                <div>
                    <span class="badge badge-celeste">${esEd ? "✏️ EDITAR VIDEO" : "📹 CARGAR VIDEO DE EJERCICIO"}</span>
                    <h3 style="margin-top:4px;">${esEd ? `Modificar: ${exEdit.nombre}` : "Agregar a la Videoteca"}</h3>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalVideoEjercicio()">✕</button>
            </div>
            <form onsubmit="guardarNuevoEjercicioVideoteca(event, ${esEd ? exEdit.id : "null"})">
                <div class="grid-2" style="margin-bottom:0.7rem;">
                    <div class="field"><label>Nombre *</label><input type="text" id="vidNombre" required value="${nomIni.replace(/"/g, "&quot;")}" placeholder="Ej: Prensa 45°"></div>
                    <div class="field"><label>Grupo Muscular *</label>
                        <select id="vidGrupo">
                            <option value="Tren Inferior" ${grpIni.includes("Inferior") ? "selected" : ""}>🦵 Tren Inferior</option>
                            <option value="Empuje / Torso" ${grpIni.includes("Empuje") ? "selected" : ""}>💪 Empuje / Torso</option>
                            <option value="Tracción / Espalda" ${grpIni.includes("Tracción") || grpIni.includes("Espalda") ? "selected" : ""}>🏋️ Tracción / Espalda</option>
                            <option value="Core y Funcional" ${grpIni.includes("Core") ? "selected" : ""}>🔥 Core y Funcional</option>
                            <option value="Potencia y Pliometría" ${grpIni.includes("Potencia") ? "selected" : ""}>⚡ Potencia</option>
                            <option value="Movilidad y Rehab" ${grpIni.includes("Movilidad") || grpIni.includes("Rehab") ? "selected" : ""}>🏥 Movilidad / Rehab</option>
                        </select>
                    </div>
                </div>
                <div class="grid-4" style="margin-bottom:0.75rem;">
                    <div class="field"><label>Equipo</label><input type="text" id="vidEquipo" value="${(exEdit?.equipo || "Barra / Mancuernas").replace(/"/g, "&quot;")}"></div>
                    <div class="field"><label>Series</label><input type="number" id="vidSeries" value="${exEdit?.seriesSugeridas || 4}"></div>
                    <div class="field"><label>Reps</label><input type="text" id="vidReps" value="${(exEdit?.repsSugeridas || "8-10").replace(/"/g, "&quot;")}"></div>
                    <div class="field"><label>Hombrecito</label>
                        <select id="vidPatron">
                            <option value="squat" ${patIni === "squat" ? "selected" : ""}>Sentadilla</option>
                            <option value="bench" ${patIni === "bench" ? "selected" : ""}>Press Banca</option>
                            <option value="deadlift" ${patIni === "deadlift" ? "selected" : ""}>Peso Muerto</option>
                            <option value="thrust" ${patIni === "thrust" ? "selected" : ""}>Hip Thrust</option>
                            <option value="lunge" ${patIni === "lunge" ? "selected" : ""}>Búlgara</option>
                            <option value="row" ${patIni === "row" ? "selected" : ""}>Remo</option>
                            <option value="pull" ${patIni === "pull" ? "selected" : ""}>Dominadas</option>
                            <option value="ohp" ${patIni === "ohp" ? "selected" : ""}>Press Militar</option>
                            <option value="plank" ${patIni === "plank" ? "selected" : ""}>Plancha/Core</option>
                            <option value="jump" ${patIni === "jump" ? "selected" : ""}>Salto</option>
                        </select>
                    </div>
                </div>

                <div class="video-source-tabs">
                    <button type="button" id="tabOrigenArchivoCDM" class="video-source-tab ${!urlExt ? "active" : ""}" onclick="cambiarModoOrigenVideoModalCDM('archivo')">📁 Subir de PC / Celular</button>
                    <button type="button" id="tabOrigenLinkCDM" class="video-source-tab ${urlExt ? "active" : ""}" onclick="cambiarModoOrigenVideoModalCDM('link')">🔗 Link YouTube / MP4</button>
                </div>

                <div id="bloqueSubirArchivoVideoCDM" class="video-upload-zone ${urlExt ? "hidden" : ""}">
                    <label class="btn btn-primary btn-sm" style="cursor:pointer;">
                        <i class="ri-folder-video-line"></i> Elegir Video (MP4/MOV)
                        <input type="file" accept="video/*" onchange="seleccionarArchivoVideoDesdeDispositivoCDM(event)" style="display:none;">
                    </label>
                    <div id="infoArchivoVideoCargadoCDM" style="margin-top:0.5rem;">${tieneLocal ? `<span class="badge badge-ok">📹 ${exEdit.nombreArchivoLocal || "Video local"}</span>` : ""}</div>
                    <video id="previewPlayerVideoSubidoCDM" class="hidden" controls playsinline style="width:100%; max-height:170px; border-radius:10px; margin-top:0.5rem; background:#000;"></video>
                </div>

                <div id="bloquePegarLinkVideoCDM" class="field ${!urlExt ? "hidden" : ""}" style="margin-bottom:0.75rem;">
                    <label>Link YouTube / Shorts / MP4</label>
                    <input type="url" id="vidUrl" value="${urlExt.replace(/"/g, "&quot;")}" placeholder="https://www.youtube.com/watch?v=...">
                </div>

                <div class="field" style="margin-bottom:0.65rem;"><label>Claves Técnicas *</label><input type="text" id="vidClaves" required value="${(exEdit?.clavesTecnicas || "Controlar postura y bajada excéntrica.").replace(/"/g, "&quot;")}"></div>
                <div class="field" style="margin-bottom:0.95rem;"><label>Errores a Evitar</label><input type="text" id="vidErrores" value="${(exEdit?.erroresComunes || "Evitar compensaciones lumbares.").replace(/"/g, "&quot;")}"></div>

                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem;">
                    ${esEd ? `<button type="button" class="btn btn-danger btn-sm" onclick="eliminarEjercicioVideotecaCDM(${exEdit.id}); cerrarModalVideoEjercicio();">🗑️ Eliminar</button>` : `<span></span>`}
                    <div style="display:flex; gap:0.45rem;">
                        <button type="button" class="btn btn-ghost" onclick="cerrarModalVideoEjercicio()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">💾 Guardar Video</button>
                    </div>
                </div>
            </form>
        </div>
    `;
    modal.classList.remove("hidden");
    if (tieneLocal && exEdit.videoLocalKey) {
        const reg = await obtenerArchivoVideoDesdeIDB(exEdit.videoLocalKey);
        const prev = document.getElementById("previewPlayerVideoSubidoCDM");
        if (reg?.blob && prev) { prev.src = URL.createObjectURL(reg.blob); prev.classList.remove("hidden"); }
    }
}

const abrirModalNuevoEjercicioVideo = abrirModalVideotecaProCDM;
const abrirModalNuevoVideoEjercicio = abrirModalVideotecaProCDM;
window.abrirModalEditarEjercicioVideo = abrirModalVideotecaProCDM;
window.abrirModalEditarVideoDeEjercicioPorNombreCDM = function (nom, grp = "Tren Inferior") {
    const ex = buscarVideoDeEjercicioPorNombreCDM(nom);
    abrirModalVideotecaProCDM(ex ? ex.id : null, nom, grp);
};

async function guardarNuevoEjercicioVideoteca(e, idEditar = null) {
    e.preventDefault();
    asegurarVideotecaCargada();

    const nombre = document.getElementById("vidNombre").value.trim();
    const grupo = document.getElementById("vidGrupo").value;
    const equipo = document.getElementById("vidEquipo").value.trim();
    const seriesSugeridas = parseInt(document.getElementById("vidSeries").value, 10) || 4;
    const repsSugeridas = document.getElementById("vidReps").value.trim() || "8-10";
    const patron = document.getElementById("vidPatron")?.value || detectarPatronMovimientoHombrecitoCDM(nombre, grupo);
    const clavesTecnicas = document.getElementById("vidClaves").value.trim();
    const erroresComunes = document.getElementById("vidErrores").value.trim();
    const urlInput = (document.getElementById("vidUrl")?.value || "").trim();

    const idFinal = idEditar ? Number(idEditar) : Date.now();
    const idx = baseVideoteca.findIndex(x => Number(x.id) === idFinal);
    const prev = idx >= 0 ? baseVideoteca[idx] : null;

    let videoUrl = prev?.videoUrl || "", esVideoLocal = Boolean(prev?.esVideoLocal), videoLocalKey = prev?.videoLocalKey || null, nombreArchivoLocal = prev?.nombreArchivoLocal || "";
    let imagenPreview = prev?.imagenPreview || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=700&q=80";

    const usaArchivo = !document.getElementById("bloqueSubirArchivoVideoCDM")?.classList.contains("hidden");
    if (archivoVideoTemporalModalCDM) {
        videoLocalKey = `vid_local_${idFinal}`;
        await guardarArchivoVideoEnIDB(videoLocalKey, archivoVideoTemporalModalCDM, archivoVideoTemporalModalCDM.name);
        videoUrl = `idb://${videoLocalKey}`;
        esVideoLocal = true;
        nombreArchivoLocal = archivoVideoTemporalModalCDM.name;
        if (miniaturaVideoTemporalModalCDM) imagenPreview = miniaturaVideoTemporalModalCDM;
    } else if (!usaArchivo && urlInput) {
        videoUrl = urlInput; esVideoLocal = false; videoLocalKey = null; nombreArchivoLocal = "";
    }
    if (!videoUrl) videoUrl = "biomech://simulador";

    const obj = { id: idFinal, nombre, grupo, grupoSecundario: grupo, nivel: "Todos los niveles", equipo, seriesSugeridas, repsSugeridas, pausaSugerida: "90s", patron, videoUrl, esVideoLocal, videoLocalKey, nombreArchivoLocal, imagenPreview, clavesTecnicas, erroresComunes };
    if (idx >= 0) baseVideoteca[idx] = obj;
    else baseVideoteca.unshift(obj);

    agregarEjercicioInventadoAlCatalogoCDM(nombre, "fuerza_kg", true, { grupo, patron, video: esVideoLocal ? "" : videoUrl });
    guardarDatosCDM();
    cerrarModalVideoEjercicio();
    renderizarVideotecaGym();
    mostrarToast(`📹 "${nombre}" guardado en la Videoteca.`);
}

async function eliminarEjercicioVideotecaCDM(idEx) {
    const ex = baseVideoteca.find(x => Number(x.id) === Number(idEx));
    if (!ex || !confirm(`🗑️ ¿Eliminar "${ex.nombre}" de la Videoteca?`)) return;
    if (ex.videoLocalKey) await eliminarArchivoVideoDesdeIDB(ex.videoLocalKey);
    baseVideoteca = baseVideoteca.filter(x => Number(x.id) !== Number(idEx));
    if (!baseVideoteca.length) localStorage.setItem("cdm_videoteca_vaciada_manual_v1", "1");
    guardarDatosCDM();
    renderizarVideotecaGym();
}

function restaurarVideosPorDefectoVideotecaCDM() {
    localStorage.removeItem("cdm_videoteca_vaciada_manual_v1");
    VIDEOTECA_POR_DEFECTO.forEach(d => { if (!baseVideoteca.some(x => Number(x.id) === Number(d.id))) baseVideoteca.push({ ...d }); });
    guardarDatosCDM();
    renderizarVideotecaGym();
    mostrarToast("↺ Videos base restaurados.");
}

async function abrirModalReproductorEjercicio(idEx) {
    asegurarVideotecaCargada();
    const ex = (baseVideoteca || []).find(x => Number(x.id) === Number(idEx));
    if (!ex) return;
    asegurarModalVideoEnPaginaActualCDM();
    const modal = document.getElementById("modalVideoEjercicio");
    if (!modal) return;

    const esLocal = Boolean(ex.esVideoLocal || String(ex.videoUrl || "").startsWith("idb://"));
    const sinVideo = !ex.videoUrl || ex.videoUrl === "biomech://simulador";
    const embedUrl = (!esLocal && !sinVideo) ? obtenerEmbedUrlVideo(ex.videoUrl) : "";
    const esMp4 = /\.(mp4|webm|mov)$/i.test(embedUrl);

    const playerHTML = sinVideo ? "" : (esLocal || esMp4
        ? `<div class="video-iframe-container"><video id="reproductorVideoLocalModalCDM" src="${esMp4 ? embedUrl : ""}" controls autoplay playsinline></video></div>`
        : `<div class="video-iframe-container"><iframe src="${embedUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`);
    const idIlust = "ilust_mod_" + ex.id;

    modal.innerHTML = `
        <div class="modal-window" style="max-width:720px;">
            <div class="modal-top">
                <div><span class="badge ${esLocal ? "badge-ok" : "badge-celeste"}">${esLocal ? "📹 VIDEO PROPIO" : ex.grupo}</span><h3 style="margin-top:4px;">🎥 ${ex.nombre}</h3></div>
                <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
                    <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('${idIlust}').classList.toggle('hidden')"><i class="ri-body-scan-fill"></i> Ejemplo 1–4</button>
                    <button type="button" class="btn btn-secondary btn-sm col-admin-control" onclick="abrirModalVideotecaProCDM(${ex.id})">✏️ Editar</button>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalVideoEjercicio()">✕</button>
                </div>
            </div>
            ${playerHTML}
            <div id="${idIlust}" class="${sinVideo ? "" : "hidden"}">${generarBloqueAnimacionHombrecitosHTML(ex.nombre, ex.grupo)}</div>
            <div style="background:var(--cdm-50); border:1px solid var(--line-celeste); padding:0.8rem; border-radius:12px; margin:0.7rem 0; font-size:0.83rem;"><b>✅ Clave Técnica:</b> ${ex.clavesTecnicas}</div>
            <div style="display:flex; justify-content:space-between; gap:0.5rem; flex-wrap:wrap;">
                <button type="button" class="btn btn-secondary btn-sm col-admin-control" onclick="cerrarModalVideoEjercicio(); insertarEjercicioDeVideotecaEnRutina(${ex.id});">➕ Usar en Rutina</button>
                <button type="button" class="btn btn-whatsapp btn-sm col-admin-control" onclick="enviarVideoEjercicioPorWhatsApp(${ex.id})"><i class="ri-whatsapp-line"></i> Enviar WA</button>
            </div>
        </div>
    `;
    modal.classList.remove("hidden");

    if (esLocal && ex.videoLocalKey) {
        const reg = await obtenerArchivoVideoDesdeIDB(ex.videoLocalKey);
        const pl = document.getElementById("reproductorVideoLocalModalCDM");
        if (reg?.blob && pl) { pl.src = URL.createObjectURL(reg.blob); pl.play().catch(() => {}); }
    }
}

function renderizarVideotecaGym() {
    const cont = document.getElementById("contenedorGridVideotecaGym") || document.getElementById("contenedorTarjetasVideotecaGym");
    if (!cont) return;
    cont.classList.add("videoteca-grid");
    asegurarVideotecaCargada();

    const q = (document.getElementById("inputBuscarVideoteca")?.value || "").toLowerCase().trim();
    const grupo = (document.getElementById("filtroMusculoVideoteca") || document.getElementById("filtroGrupoVideoteca"))?.value || "TODOS";

    let lista = [...baseVideoteca];
    if (grupo !== "TODOS") lista = lista.filter(ex => ex.grupo === grupo || ex.grupoSecundario === grupo);
    if (q) lista = lista.filter(ex => `${ex.nombre} ${ex.grupo} ${ex.equipo}`.toLowerCase().includes(q));

    if (!lista.length) {
        cont.innerHTML = `<div class="empty-box" style="grid-column:1/-1;"><p style="margin-bottom:0.7rem;">Sin ejercicios con este filtro.</p><button class="btn btn-primary btn-sm" onclick="abrirModalVideotecaProCDM()">+ Subir Video</button> <button class="btn btn-secondary btn-sm" onclick="restaurarVideosPorDefectoVideotecaCDM()">Restaurar Base</button></div>`;
        return;
    }

    cont.innerHTML = lista.map(ex => {
        const esLocal = Boolean(ex.esVideoLocal || String(ex.videoUrl || "").startsWith("idb://"));
        return `
            <div class="video-exercise-card">
                <div class="video-thumb-box" onclick="abrirModalReproductorEjercicio(${ex.id})">
                    <img src="${ex.imagenPreview || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=700&q=80'}" alt="${ex.nombre}">
                    <div class="video-play-overlay"><div class="play-circle-btn"><i class="ri-play-fill"></i></div></div>
                    <span class="badge ${esLocal ? "badge-ok" : "badge-celeste"}" style="position:absolute; top:0.7rem; left:0.7rem;">${esLocal ? "📹 Propio" : ex.grupo}</span>
                    <span class="badge badge-ok" style="position:absolute; bottom:0.7rem; right:0.7rem;">${ex.seriesSugeridas} × ${ex.repsSugeridas}</span>
                </div>
                <div class="video-card-body">
                    <div style="display:flex; align-items:center; gap:0.7rem;">
                        ${renderMiniHombrecitoSVG(ex.nombre, ex.grupo)}
                        <div style="min-width:0; flex:1;">
                            <h4 style="font-size:0.98rem; font-weight:800; margin:0;">${ex.nombre}</h4>
                            <small style="color:var(--ink-500); font-weight:700;">🏋️ ${ex.equipo}</small>
                        </div>
                    </div>
                    <div class="video-cues-box"><b>💡 Clave:</b> ${ex.clavesTecnicas}</div>
                    <div style="display:flex; gap:0.35rem; margin-top:auto; flex-wrap:wrap;">
                        <button type="button" class="btn btn-primary btn-sm" style="flex:1;" onclick="abrirModalReproductorEjercicio(${ex.id})">▶ Ver</button>
                        <button type="button" class="btn btn-secondary btn-sm col-admin-control" onclick="insertarEjercicioDeVideotecaEnRutina(${ex.id})">➕ Rutina</button>
                        <button type="button" class="btn btn-ghost btn-sm col-admin-control" onclick="abrirModalVideotecaProCDM(${ex.id})">✏️</button>
                        <button type="button" class="btn btn-danger btn-sm col-admin-control" onclick="eliminarEjercicioVideotecaCDM(${ex.id})">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function insertarEjercicioDeVideotecaEnRutina(idEx) {
    const ex = baseVideoteca.find(x => Number(x.id) === Number(idEx));
    if (!ex) return;
    agregarFilaRutinaAdminGym({ nombre: ex.nombre, series: ex.seriesSugeridas || 4, reps: ex.repsSugeridas || "8-10", peso: ex.equipo, pausa: ex.pausaSugerida || "90s", forma: ex.clavesTecnicas });
    const btnTab = Array.from(document.querySelectorAll(".module-tabs .mod-tab")).find(b => b.innerText.toLowerCase().includes("rutina"));
    if (btnTab) cambiarTabGym("rutinas", btnTab);
    mostrarToast(`➕ "${ex.nombre}" sumado al constructor de rutinas.`);
}

function enviarVideoEjercicioPorWhatsApp(idEx) {
    const ex = baseVideoteca.find(x => Number(x.id) === Number(idEx));
    if (!ex) return;
    const msg = `🏋️ *GUÍA TÉCNICA — ${ex.nombre.toUpperCase()}*\n📊 ${ex.seriesSugeridas} × ${ex.repsSugeridas}\n✅ ${ex.clavesTecnicas}\n🎥 ${ex.videoUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
}

// =========================================================================
// 3. MOTOR BIOMECÁNICO 60 FPS (HOMBRECITO CONECTADO A LA BASE MAESTRA)
// =========================================================================

const INFO_BIOMECANICA_PATRONES_CDM = {
    pull: { titulo: "Tracción Vertical — Dominadas / Jalón", primarios: "Dorsal Ancho y Bíceps", secundarios: "Romboides y Core", fases: ["1. Extensión", "2. Escápulas", "3. Al Pecho", "4. Control"] },
    row: { titulo: "Tracción Horizontal — Remo", primarios: "Dorsal Ancho y Romboides", secundarios: "Bíceps y Espinales", fases: ["1. Extensión", "2. Tracción", "3. A Cadera", "4. Retorno"] },
    bench: { titulo: "Empuje Horizontal — Press Banca", primarios: "Pectoral Mayor y Tríceps", secundarios: "Deltoides Anterior", fases: ["1. Bloqueo", "2. Bajada", "3. Al Pecho", "4. Empuje"] },
    squat: { titulo: "Sentadilla / Dominante de Rodilla", primarios: "Cuádriceps y Glúteo Mayor", secundarios: "Core e Isquiotibiales", fases: ["1. Posición", "2. Bajada", "3. Paralelo 90°", "4. Subida"] },
    deadlift: { titulo: "Bisagra de Cadera — Peso Muerto", primarios: "Isquiotibiales y Glúteos", secundarios: "Espinales y Dorsal", fases: ["1. Erguido", "2. Bisagra", "3. Tensión", "4. Extensión"] },
    thrust: { titulo: "Empuje de Cadera — Hip Thrust", primarios: "Glúteo Mayor y Medio", secundarios: "Isquiotibiales y Core", fases: ["1. Inicio", "2. Impulso", "3. Bloqueo", "4. Descenso"] },
    ohp: { titulo: "Empuje Vertical — Press Militar", primarios: "Deltoides y Tríceps", secundarios: "Trapecio y Core", fases: ["1. Clavículas", "2. Empuje", "3. Bloqueo", "4. Control"] },
    lunge: { titulo: "Unilateral — Búlgara / Estocada", primarios: "Cuádriceps y Glúteo", secundarios: "Glúteo Medio", fases: ["1. Split", "2. Descenso", "3. 90°", "4. Subida"] },
    plank: { titulo: "Estabilidad — Plancha / Core", primarios: "Recto Abdominal y Oblicuos", secundarios: "Glúteos y Serrato", fases: ["1. Postura", "2. Tracción", "3. Bracing", "4. Sostén"] },
    jump: { titulo: "Potencia — Salto / Pliometría", primarios: "Cuádriceps, Glúteos y Gemelos", secundarios: "Core y Tendones", fases: ["1. Carga", "2. Despegue", "3. Vuelo", "4. Recepción"] }
};

function detectarPatronMovimientoHombrecitoCDM(nombreEjercicio = "", grupo = "") {
    const nom = normalizarTextoEjercicioCDM(nombreEjercicio);
    // 1. Priorizar el patrón guardado en la Base Maestra de Ejercicios o Videoteca
    const enBase = (baseCatalogoEjercicios || []).find(e => normalizarTextoEjercicioCDM(e.nombre) === nom);
    if (enBase?.patron) return enBase.patron === "pullup" ? "pull" : enBase.patron === "press" ? "ohp" : enBase.patron;
    const enVid = (baseVideoteca || []).find(v => normalizarTextoEjercicioCDM(v.nombre) === nom);
    if (enVid?.patron) return enVid.patron;

    // 2. Fallback por palabras clave
    const grp = normalizarTextoEjercicioCDM(grupo);
    if (nom.includes("dominada") || nom.includes("jalon") || nom.includes("polea")) return "pull";
    if (nom.includes("remo")) return "row";
    if (nom.includes("hip thrust") || nom.includes("cadera") || nom.includes("puente")) return "thrust";
    if (nom.includes("muerto") || nom.includes("rumano") || nom.includes("isquio")) return "deadlift";
    if (nom.includes("bulgara") || nom.includes("estocada") || nom.includes("unilateral")) return "lunge";
    if (nom.includes("militar") || nom.includes("hombro") || nom.includes("overhead")) return "ohp";
    if (nom.includes("banca") || nom.includes("pecho") || nom.includes("flexion")) return "bench";
    if (nom.includes("plancha") || nom.includes("core") || nom.includes("abdom")) return "plank";
    if (nom.includes("salto") || nom.includes("cajon") || nom.includes("sprint") || nom.includes("cmj")) return "jump";
    if (grp.includes("traccion") || grp.includes("espalda")) return "pull";
    if (grp.includes("empuje") || grp.includes("pecho")) return "bench";
    if (grp.includes("core")) return "plank";
    return "squat";
}

function interpCDM(a, b, t) { return a + (b - a) * t; }

function resolverArticulacionConGuiaCDM(x1, y1, x2, y2, L1, L2, haciaX, haciaY) {
    let dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy) || 1;
    const maxR = (L1 + L2) * 0.992, minR = Math.abs(L1 - L2) * 1.05;
    if (d > maxR) { dx = (dx / d) * maxR; dy = (dy / d) * maxR; d = maxR; }
    else if (d < minR) d = minR;
    const cosA = Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)));
    const base = Math.atan2(dy, dx), off = Math.acos(cosA);
    const a = { x: x1 + Math.cos(base + off) * L1, y: y1 + Math.sin(base + off) * L1 };
    const b = { x: x1 + Math.cos(base - off) * L1, y: y1 + Math.sin(base - off) * L1 };
    return Math.hypot(a.x - haciaX, a.y - haciaY) <= Math.hypot(b.x - haciaX, b.y - haciaY) ? a : b;
}

function dibujarSegmentoAnatomicoProCDM(ctx, x1, y1, x2, y2, r1, pPos, pNeg, r2, activo = false, nivel = 0.8, fondo = false) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len, maxB = Math.max(r1, r2) + len * 0.16;
    const bP = Math.min(pPos, maxB), bN = Math.min(pNeg, maxB);
    const p1x = x1 + dx * 0.38, p1y = y1 + dy * 0.38, p2x = x1 + dx * 0.68, p2y = y1 + dy * 0.68;
    ctx.save();
    if (fondo) ctx.globalAlpha = 0.48;
    ctx.beginPath();
    ctx.moveTo(x1 + nx * r1, y1 + ny * r1);
    ctx.bezierCurveTo(p1x + nx * bP, p1y + ny * bP, p2x + nx * (bP * 0.85), p2y + ny * (bP * 0.85), x2 + nx * r2, y2 + ny * r2);
    ctx.arc(x2, y2, r2, Math.atan2(ny, nx), Math.atan2(-ny, -nx), false);
    ctx.bezierCurveTo(p2x - nx * (bN * 0.85), p2y - ny * (bN * 0.85), p1x - nx * bN, p1y - ny * bN, x1 - nx * r1, y1 - ny * r1);
    ctx.arc(x1, y1, r1, Math.atan2(-ny, -nx), Math.atan2(ny, nx), false);
    ctx.closePath();
    const grad = ctx.createLinearGradient(p1x + nx * bP, p1y + ny * bP, p1x - nx * bN, p1y - ny * bN);
    if (activo) {
        if (!fondo) { ctx.shadowColor = `rgba(244,63,94,${0.35 + 0.4 * nivel})`; ctx.shadowBlur = 10 * nivel; }
        grad.addColorStop(0, "#fda4af"); grad.addColorStop(0.4, "#f43f5e"); grad.addColorStop(0.8, "#be123c"); grad.addColorStop(1, "#4c0519");
        ctx.strokeStyle = "#fecdd3";
    } else {
        grad.addColorStop(0, "#94a3b8"); grad.addColorStop(0.45, "#475569"); grad.addColorStop(0.85, "#1e293b"); grad.addColorStop(1, "#0f172a");
        ctx.strokeStyle = "rgba(148,163,184,0.5)";
    }
    ctx.fillStyle = grad; ctx.fill(); ctx.lineWidth = 1.1; ctx.stroke();
    ctx.restore();
}

function dibujarPelvisYShortCDM(ctx, hx, hy, r = 7.2) { ctx.save(); ctx.fillStyle = "#0284c7"; ctx.strokeStyle = "#7dd3fc"; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(hx, hy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); }
function dibujarArticulacionCapsulaCDM(ctx, x, y, r = 3.3, act = false) { ctx.save(); ctx.fillStyle = act ? "#fb7185" : "#38bdf8"; ctx.strokeStyle = "#091526"; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); }
function dibujarCuelloYCabezaCDM(ctx, sx, sy, hx, hy, ang = 0, espalda = false) {
    dibujarSegmentoAnatomicoProCDM(ctx, sx, sy, hx, hy, 3.6, 3.8, 3.8, 3.2, false, 0.5);
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang);
    const g = ctx.createRadialGradient(-2, -3, 1, 0, 0, 9);
    g.addColorStop(0, "#cbd5e1"); g.addColorStop(0.65, "#475569"); g.addColorStop(1, "#1e293b");
    ctx.fillStyle = g; ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(0, 0, 6.8, 8.0, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (!espalda) { ctx.fillStyle = "#38bdf8"; ctx.beginPath(); ctx.roundRect(2.0, -2.2, 4.8, 2.3, 1); ctx.fill(); }
    ctx.restore();
}
function dibujarCalzadoDeportivoCDM(ctx, ax, ay, l = 14) {
    ctx.save(); ctx.fillStyle = "#0284c7"; ctx.strokeStyle = "#e0f2fe"; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(ax - 5, ay - 3); ctx.lineTo(ax + l - 3, ay - 1); ctx.quadraticCurveTo(ax + l + 1, ay + 2, ax + l - 1, ay + 4.2); ctx.lineTo(ax - 5, ay + 4.2); ctx.closePath();
    ctx.fill(); ctx.stroke(); ctx.fillStyle = "#f8fafc"; ctx.fillRect(ax - 5, ay + 3.0, l + 4, 1.8); ctx.restore();
}
function dibujarDiscoOlimpicoProCDM(ctx, bx, by, r = 11.5) {
    ctx.save(); ctx.globalAlpha = 0.72;
    const g = ctx.createRadialGradient(bx - 2, by - 2, 2, bx, by, r);
    g.addColorStop(0, "#fde047"); g.addColorStop(0.6, "#eab308"); g.addColorStop(1, "#713f12");
    ctx.fillStyle = g; ctx.strokeStyle = "#fef08a"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1; ctx.fillStyle = "#0f172a"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(bx, by, 3.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
}
function dibujarHUDTelemetriaBiomecanicaCDM(ctx, p, txt) {
    const pct = Math.round(25 + p * 75), barW = Math.max(8, Math.round(136 * (0.2 + 0.8 * p)));
    ctx.save(); ctx.fillStyle = "rgba(15,23,42,0.82)"; ctx.strokeStyle = "rgba(56,189,248,0.32)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(8, 6, 144, 16, 5); ctx.fill(); ctx.stroke();
    const g = ctx.createLinearGradient(12, 0, 148, 0); g.addColorStop(0, "#38bdf8"); g.addColorStop(0.5, "#f59e0b"); g.addColorStop(1, "#f43f5e");
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(12, 9.5, barW, 9, 3.5); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "800 7.2px Poppins, sans-serif"; ctx.fillText(`${txt} • EMG ${pct}%`, 16, 16.5); ctx.restore();
}

function renderizarFrameAtletaAnatomicoCDM(canvas, patron, p, hud = true) {
    if (!canvas) return false;
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    if (cw < 24 || ch < 24) return false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) { canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr); }
    const ctx = canvas.getContext("2d");
    ctx.save(); ctx.scale(dpr, dpr); ctx.clearRect(0, 0, cw, ch);
    const scale = Math.min(cw / 160, ch / 142);
    ctx.translate((cw - 160 * scale) / 2, (ch - 142 * scale) / 2); ctx.scale(scale, scale);

    const floorY = 130, int = 0.25 + 0.75 * p;
    ctx.strokeStyle = "rgba(148,163,184,0.5)"; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(10, floorY); ctx.lineTo(150, floorY); ctx.stroke();

    if (patron === "pull" || patron === "pullup") {
        ctx.strokeStyle = "#64748b"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(80, 22); ctx.lineTo(80, 68); ctx.stroke();
        const barY = interpCDM(36, 65, p), sY = interpCDM(67, 70, p), hY = 109;
        const hL = { x: 38, y: barY + 3 }, hR = { x: 122, y: barY + 3 }, sL = { x: 63, y: sY }, sR = { x: 97, y: sY };
        const eL = resolverArticulacionConGuiaCDM(sL.x, sL.y, hL.x, hL.y, 20, 20, 20, 115);
        const eR = resolverArticulacionConGuiaCDM(sR.x, sR.y, hR.x, hR.y, 20, 20, 140, 115);
        ctx.strokeStyle = "#facc15"; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(28, barY + 7); ctx.lineTo(42, barY); ctx.lineTo(118, barY); ctx.lineTo(132, barY + 7); ctx.stroke();
        dibujarSegmentoAnatomicoProCDM(ctx, 70, hY, 65, floorY - 2, 5.5, 6.5, 5.5, 4.2);
        dibujarSegmentoAnatomicoProCDM(ctx, 90, hY, 95, floorY - 2, 5.5, 6.5, 5.5, 4.2);
        dibujarPelvisYShortCDM(ctx, 80, hY, 8.5);
        ctx.fillStyle = "#e11d48"; ctx.beginPath(); ctx.moveTo(sL.x, sY - 2); ctx.lineTo(sR.x, sY - 2); ctx.quadraticCurveTo(80 + interpCDM(17, 23, p), sY + 18, 88, hY - 2); ctx.lineTo(72, hY - 2); ctx.quadraticCurveTo(80 - interpCDM(17, 23, p), sY + 18, sL.x, sY - 2); ctx.fill();
        dibujarSegmentoAnatomicoProCDM(ctx, sL.x, sL.y, eL.x, eL.y, 4.8, 5.8, 4.8, 3.8, true, int);
        dibujarSegmentoAnatomicoProCDM(ctx, eL.x, eL.y, hL.x, hL.y, 3.8, 4.4, 3.8, 2.8, true, int);
        dibujarSegmentoAnatomicoProCDM(ctx, sR.x, sR.y, eR.x, eR.y, 4.8, 5.8, 4.8, 3.8, true, int);
        dibujarSegmentoAnatomicoProCDM(ctx, eR.x, eR.y, hR.x, hR.y, 3.8, 4.4, 3.8, 2.8, true, int);
        dibujarCuelloYCabezaCDM(ctx, 80, sY - 2, 80, sY - 12, 0, true);
        if (hud) dibujarHUDTelemetriaBiomecanicaCDM(ctx, p, "Tracción Dorsal");
    } else if (patron === "row") {
        ctx.fillStyle = "#1e293b"; ctx.beginPath(); ctx.roundRect(50, 95, 66, 6, 3); ctx.fill();
        const an = { x: 34, y: floorY - 4 }, hip = { x: 56, y: 74 }, sh = { x: 96, y: 66 };
        const kn = resolverArticulacionConGuiaCDM(hip.x, hip.y, an.x, an.y, 29, 28, 80, 100);
        const hd = { x: interpCDM(94, 66, p), y: interpCDM(110, 80, p) };
        const el = resolverArticulacionConGuiaCDM(sh.x, sh.y, hd.x, hd.y, 20, 20, 55, 30);
        dibujarSegmentoAnatomicoProCDM(ctx, an.x, an.y, kn.x, kn.y, 3.8, 4.8, 5.2, 4.2);
        dibujarSegmentoAnatomicoProCDM(ctx, kn.x, kn.y, hip.x, hip.y, 4.6, 6.8, 6.2, 6.4);
        dibujarSegmentoAnatomicoProCDM(ctx, hip.x, hip.y, sh.x, sh.y, 6.8, 7.6, 8.2, 7.4, true, int);
        dibujarPelvisYShortCDM(ctx, hip.x, hip.y, 7.2); dibujarCuelloYCabezaCDM(ctx, sh.x, sh.y, sh.x + 13, sh.y - 3, 0.25);
        dibujarSegmentoAnatomicoProCDM(ctx, sh.x, sh.y, el.x, el.y, 4.6, 5.6, 4.8, 3.8, true, int);
        dibujarSegmentoAnatomicoProCDM(ctx, el.x, el.y, hd.x, hd.y, 3.8, 4.4, 3.8, 2.8, true, int);
        dibujarCalzadoDeportivoCDM(ctx, an.x, an.y, 14);
        ctx.fillStyle = "#facc15"; ctx.beginPath(); ctx.roundRect(hd.x - 8, hd.y - 3.5, 16, 7, 2); ctx.fill();
        if (hud) dibujarHUDTelemetriaBiomecanicaCDM(ctx, p, `Remo ${Math.round(interpCDM(168, 78, p))}°`);
    } else if (patron === "bench") {
        ctx.fillStyle = "#1e293b"; ctx.beginPath(); ctx.roundRect(22, 92, 78, 6, 3); ctx.fill();
        const sh = { x: 50, y: 84 }, hip = { x: 90, y: 86 }, an = { x: 116, y: floorY - 4 };
        const kn = resolverArticulacionConGuiaCDM(hip.x, hip.y, an.x, an.y, 26, 26, 135, 80);
        const hd = { x: 52, y: interpCDM(42, 73, p) };
        const el = resolverArticulacionConGuiaCDM(sh.x, sh.y, hd.x, hd.y, 22, 22, 72, 115);
        dibujarSegmentoAnatomicoProCDM(ctx, kn.x, kn.y, an.x, an.y, 4.0, 4.8, 4.4, 3.5);
        dibujarSegmentoAnatomicoProCDM(ctx, hip.x, hip.y, kn.x, kn.y, 6.0, 7.0, 5.8, 4.5);
        dibujarSegmentoAnatomicoProCDM(ctx, hip.x, hip.y, sh.x, sh.y, 6.8, 8.6, 6.8, 7.6, true, int);
        dibujarPelvisYShortCDM(ctx, hip.x, hip.y, 7.0); dibujarCuelloYCabezaCDM(ctx, sh.x, sh.y, 35, 83, -Math.PI / 2);
        dibujarSegmentoAnatomicoProCDM(ctx, sh.x, sh.y, el.x, el.y, 4.6, 5.6, 4.8, 3.8, true, int);
        dibujarSegmentoAnatomicoProCDM(ctx, el.x, el.y, hd.x, hd.y, 3.8, 4.4, 3.8, 2.8, true, int);
        dibujarCalzadoDeportivoCDM(ctx, an.x, an.y, 13); dibujarDiscoOlimpicoProCDM(ctx, hd.x, hd.y, 11);
        if (hud) dibujarHUDTelemetriaBiomecanicaCDM(ctx, p, `Press ${Math.round(interpCDM(172, 82, p))}°`);
    } else if (patron === "thrust") {
        ctx.fillStyle = "#1e293b"; ctx.beginPath(); ctx.roundRect(16, 86, 28, 44, 4); ctx.fill();
        const sh = { x: 42, y: 83 }, an = { x: 112, y: floorY - 4 }, hip = { x: interpCDM(74, 77, p), y: interpCDM(112, 83, p) };
        const kn = resolverArticulacionConGuiaCDM(hip.x, hip.y, an.x, an.y, 31, 29, 125, 50);
        dibujarSegmentoAnatomicoProCDM(ctx, kn.x, kn.y, an.x, an.y, 4.2, 5.2, 4.6, 3.6);
        dibujarSegmentoAnatomicoProCDM(ctx, hip.x, hip.y, kn.x, kn.y, 7.2, 8.2, 6.8, 4.8, true, int);
        dibujarSegmentoAnatomicoProCDM(ctx, sh.x, sh.y, hip.x, hip.y, 7.0, 7.6, 7.6, 7.4, true, int);
        dibujarPelvisYShortCDM(ctx, hip.x, hip.y, 7.6); dibujarCuelloYCabezaCDM(ctx, sh.x, sh.y, 30, 74, 0.25);
        dibujarCalzadoDeportivoCDM(ctx, an.x, an.y, 14); dibujarDiscoOlimpicoProCDM(ctx, hip.x, hip.y - 6, 11);
        if (hud) dibujarHUDTelemetriaBiomecanicaCDM(ctx, p, `Pelvis ${Math.round(interpCDM(115, 180, p))}°`);
    } else if (patron === "lunge") {
        ctx.fillStyle = "#1e293b"; ctx.beginPath(); ctx.roundRect(14, 98, 22, 32, 4); ctx.fill();
        const fA = { x: 108, y: floorY - 4 }, bF = { x: 32, y: 98 }, hip = { x: 74, y: interpCDM(74, 98, p) }, sh = { x: 78, y: interpCDM(40, 64, p) };
        const bK = resolverArticulacionConGuiaCDM(hip.x, hip.y, bF.x, bF.y, 28, 27, 55, 138);
        const fK = resolverArticulacionConGuiaCDM(hip.x, hip.y, fA.x, fA.y, 29, 28, 145, 90);
        dibujarSegmentoAnatomicoProCDM(ctx, bK.x, bK.y, bF.x, bF.y, 3.8, 4.6, 4.2, 3.2, false, p, true);
        dibujarSegmentoAnatomicoProCDM(ctx, hip.x, hip.y, bK.x, bK.y, 6.0, 6.8, 6.2, 4.2, true, int * 0.6, true);
        dibujarSegmentoAnatomicoProCDM(ctx, fA.x, fA.y, fK.x, fK.y, 3.8, 4.6, 5.4, 4.4);
        dibujarSegmentoAnatomicoProCDM(ctx, fK.x, fK.y, hip.x, hip.y, 4.8, 8.4, 7.0, 7.6, true, int);
        dibujarSegmentoAnatomicoProCDM(ctx, hip.x, hip.y, sh.x, sh.y, 7.0, 7.8, 7.4, 7.4, true, int * 0.65);
        dibujarPelvisYShortCDM(ctx, hip.x, hip.y, 7.4); dibujarCuelloYCabezaCDM(ctx, sh.x, sh.y, sh.x + 4, sh.y - 12, 0.08);
        dibujarCalzadoDeportivoCDM(ctx, fA.x, fA.y, 14);
        if (hud) dibujarHUDTelemetriaBiomecanicaCDM(ctx, p, `Unilateral ${Math.round(interpCDM(168, 88, p))}°`);
    } else if (patron === "deadlift") {
        const an = { x: 78, y: floorY - 4 }, hip = { x: interpCDM(74, 48, p), y: interpCDM(74, 82, p) };
        const kn = resolverArticulacionConGuiaCDM(hip.x, hip.y, an.x, an.y, 28, 28, 120, 100);
        const ang = interpCDM(-Math.PI / 2 + 0.06, -0.22, p);
        const sh = { x: hip.x + Math.cos(ang) * 35, y: hip.y + Math.sin(ang) * 35 }, hd = { x: interpCDM(79, 84, p), y: interpCDM(78, 107, p) };
        dibujarSegmentoAnatomicoProCDM(ctx, an.x, an.y, kn.x, kn.y, 3.8, 4.5, 5.6, 4.4);
        dibujarSegmentoAnatomicoProCDM(ctx, kn.x, kn.y, hip.x, hip.y, 4.8, 7.6, 8.8, 7.8, true, int);
        dibujarSegmentoAnatomicoProCDM(ctx, hip.x, hip.y, sh.x, sh.y, 7.2, 8.0, 7.8, 7.6, true, int * 0.85);
        dibujarPelvisYShortCDM(ctx, hip.x, hip.y, 7.4); dibujarCuelloYCabezaCDM(ctx, sh.x, sh.y, sh.x + Math.cos(ang) * 12, sh.y + Math.sin(ang) * 12, ang + Math.PI / 2);
        dibujarSegmentoAnatomicoProCDM(ctx, sh.x, sh.y, hd.x, hd.y, 4.0, 4.6, 4.0, 3.0);
        dibujarCalzadoDeportivoCDM(ctx, an.x, an.y, 15); dibujarDiscoOlimpicoProCDM(ctx, hd.x, hd.y, 11.5);
        if (hud) dibujarHUDTelemetriaBiomecanicaCDM(ctx, p, `Bisagra ${Math.round(interpCDM(176, 92, p))}°`);
    } else if (patron === "ohp" || patron === "press") {
        const an = { x: 76, y: floorY - 4 }, kn = { x: 78, y: 101 }, hip = { x: 74, y: 74 }, sh = { x: 76, y: 44 }, hd = { x: 81, y: interpCDM(44, 16, p) };
        const el = resolverArticulacionConGuiaCDM(sh.x, sh.y, hd.x, hd.y, 19, 19, 112, 68);
        dibujarSegmentoAnatomicoProCDM(ctx, an.x, an.y, kn.x, kn.y, 3.8, 4.6, 5.4, 4.4);
        dibujarSegmentoAnatomicoProCDM(ctx, kn.x, kn.y, hip.x, hip.y, 4.8, 7.8, 6.8, 7.4);
        dibujarSegmentoAnatomicoProCDM(ctx, hip.x, hip.y, sh.x, sh.y, 7.2, 8.0, 7.6, 7.6, true, int * 0.6);
        dibujarPelvisYShortCDM(ctx, hip.x, hip.y, 7.2); dibujarCuelloYCabezaCDM(ctx, sh.x, sh.y, sh.x - 2, sh.y - 12, 0);
        dibujarSegmentoAnatomicoProCDM(ctx, sh.x, sh.y, el.x, el.y, 4.6, 5.6, 4.8, 3.8, true, int);
        dibujarSegmentoAnatomicoProCDM(ctx, el.x, el.y, hd.x, hd.y, 3.8, 4.4, 3.8, 2.8, true, int);
        dibujarCalzadoDeportivoCDM(ctx, an.x, an.y, 15); dibujarDiscoOlimpicoProCDM(ctx, hd.x, hd.y, 10.5);
        if (hud) dibujarHUDTelemetriaBiomecanicaCDM(ctx, p, "Press Hombros");
    } else if (patron === "plank") {
        const toe = { x: 28, y: floorY - 4 }, kn = { x: 54, y: 112 }, hip = { x: 80, y: interpCDM(98, 95, p) }, sh = { x: 114, y: 88 }, el = { x: 114, y: floorY - 4 };
        dibujarSegmentoAnatomicoProCDM(ctx, toe.x, toe.y, kn.x, kn.y, 3.6, 4.8, 4.4, 4.0);
        dibujarSegmentoAnatomicoProCDM(ctx, kn.x, kn.y, hip.x, hip.y, 4.4, 7.2, 6.4, 6.8, true, 0.8);
        dibujarSegmentoAnatomicoProCDM(ctx, hip.x, hip.y, sh.x, sh.y, 7.0, 8.4, 7.8, 7.6, true, 0.9 + 0.1 * p);
        dibujarPelvisYShortCDM(ctx, hip.x, hip.y, 6.8); dibujarCuelloYCabezaCDM(ctx, sh.x, sh.y, sh.x + 12, sh.y - 2, 0.35);
        dibujarSegmentoAnatomicoProCDM(ctx, sh.x, sh.y, el.x, el.y, 4.2, 5.0, 4.4, 3.4, true, 0.8);
        if (hud) dibujarHUDTelemetriaBiomecanicaCDM(ctx, 0.85 + 0.15 * p, "Core RKC 100%");
    } else {
        const lift = patron === "jump" ? Math.max(0, (p - 0.55) * 44) : 0;
        const an = { x: 80, y: floorY - 4 - lift }, hip = { x: interpCDM(75, 56, p), y: interpCDM(76, 98, p) - lift }, sh = { x: interpCDM(78, 74, p), y: interpCDM(42, 66, p) - lift };
        const kn = resolverArticulacionConGuiaCDM(hip.x, hip.y, an.x, an.y, 29, 28, 130, 95 - lift);
        dibujarSegmentoAnatomicoProCDM(ctx, an.x, an.y, kn.x, kn.y, 3.8, 4.4, 5.6, 4.4);
        dibujarSegmentoAnatomicoProCDM(ctx, kn.x, kn.y, hip.x, hip.y, 4.8, 8.6, 7.2, 7.6, true, int);
        dibujarSegmentoAnatomicoProCDM(ctx, hip.x, hip.y, sh.x, sh.y, 7.2, 8.0, 7.6, 7.6, true, int * 0.7);
        dibujarPelvisYShortCDM(ctx, hip.x, hip.y, 7.4); dibujarCuelloYCabezaCDM(ctx, sh.x, sh.y, sh.x + 5, sh.y - 12, 0.1 * p);
        dibujarArticulacionCapsulaCDM(ctx, kn.x, kn.y, 3.5, true); dibujarCalzadoDeportivoCDM(ctx, an.x, an.y, 15);
        if (patron !== "jump") dibujarDiscoOlimpicoProCDM(ctx, sh.x - 2, sh.y + 1, 11.5);
        if (hud) dibujarHUDTelemetriaBiomecanicaCDM(ctx, p, patron === "jump" ? "Potencia Salto" : `Rodilla ${Math.round(interpCDM(174, 86, p))}°`);
    }
    ctx.restore();
    return true;
}

function iniciarLoopBiomecanico60FPS() {
    if (window.__cdmBiomechLoopActivo) return;
    window.__cdmBiomechLoopActivo = true;
    const tick = (now) => {
        document.querySelectorAll(".stickman-tech-card").forEach(card => {
            if (card.offsetParent === null) return;
            const patron = card.dataset.patron || "squat";
            const dur = card.classList.contains("slow-motion") ? 4400 : 2300;
            const lock = card.dataset.lockedPhase;
            const pLive = (lock !== undefined && lock !== "") ? parseFloat(lock) : (0.5 - 0.5 * Math.cos(((now % dur) / dur) * Math.PI * 2));
            const live = card.querySelector(".biomech-live-canvas");
            if (live) renderizarFrameAtletaAnatomicoCDM(live, patron, pLive, true);
            card.querySelectorAll(".biomech-phase-canvas").forEach(cp => {
                const w = cp.clientWidth;
                if (w >= 24 && (cp.dataset.renderedW !== String(w) || cp.dataset.renderedPatron !== patron)) {
                    if (renderizarFrameAtletaAnatomicoCDM(cp, patron, parseFloat(cp.dataset.phase || "0"), false)) {
                        cp.dataset.renderedW = String(w); cp.dataset.renderedPatron = patron;
                    }
                }
            });
        });
        document.querySelectorAll(".routine-stickman-mini canvas").forEach(cv => {
            if (cv.offsetParent === null) return;
            renderizarFrameAtletaAnatomicoCDM(cv, cv.dataset.patron || "squat", 0.5 - 0.5 * Math.cos(((now % 2300) / 2300) * Math.PI * 2), false);
        });
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

function fijarFaseEnVisorAnatomicoCDM(idCard, valorFase, elBox) {
    const card = document.getElementById(idCard);
    if (!card) return;
    if (card.dataset.lockedPhase === String(valorFase)) {
        delete card.dataset.lockedPhase;
        card.querySelectorAll(".stickman-step-box").forEach(b => b.classList.remove("step-active"));
    } else {
        card.dataset.lockedPhase = String(valorFase);
        card.querySelectorAll(".stickman-step-box").forEach(b => b.classList.remove("step-active"));
        if (elBox) elBox.classList.add("step-active");
    }
}

function renderMiniHombrecitoSVG(nombreEjercicio = "", grupo = "") {
    const patron = detectarPatronMovimientoHombrecitoCDM(nombreEjercicio, grupo);
    const nomEsc = String(nombreEjercicio || "Ejercicio").replace(/'/g, "\\'");
    iniciarLoopBiomecanico60FPS();
    return `<div class="routine-stickman-mini" onclick="event.stopPropagation(); abrirModalAnimacionHombrecitoCDM('${nomEsc}', '${grupo || ""}')" title="Ver técnica de ${nombreEjercicio}"><canvas data-patron="${patron}"></canvas></div>`;
}

function generarBloqueAnimacionHombrecitosHTML(nombreEjercicio = "", grupo = "") {
    const patron = detectarPatronMovimientoHombrecitoCDM(nombreEjercicio, grupo);
    const info = INFO_BIOMECANICA_PATRONES_CDM[patron] || INFO_BIOMECANICA_PATRONES_CDM.squat;
    const idCard = "biomech_" + Math.random().toString(36).substring(2, 9);
    iniciarLoopBiomecanico60FPS();
    return `
        <div id="${idCard}" class="stickman-tech-card" data-patron="${patron}">
            <div class="stickman-tech-header">
                <span class="stickman-tech-title"><i class="ri-body-scan-fill"></i> ${info.titulo}</span>
                <button type="button" class="stickman-speed-btn" onclick="event.stopPropagation(); const c=document.getElementById('${idCard}'); delete c.dataset.lockedPhase; c.classList.toggle('slow-motion'); this.innerText=c.classList.contains('slow-motion')?'🐢 0.5x':'⚡ 1x';">⚡ 1x</button>
            </div>
            <div class="biomech-muscle-strip"><span class="muscle-pill-primary">Primarios: ${info.primarios}</span><span class="muscle-pill-secondary">Sinergistas: ${info.secundarios}</span></div>
            <div class="stickman-showcase-layout">
                <div class="stickman-live-stage"><canvas class="biomech-live-canvas"></canvas><span class="stickman-live-tag">● 60 FPS</span></div>
                <div class="stickman-steps-strip">
                    ${[0.05, 0.52, 0.96, 0.35].map((vp, idx) => `<div class="stickman-step-box" onclick="event.stopPropagation(); fijarFaseEnVisorAnatomicoCDM('${idCard}', ${vp}, this)"><canvas class="biomech-phase-canvas" data-phase="${vp}"></canvas><span class="stickman-step-num">${idx + 1}</span><span class="stickman-step-lbl">${info.fases[idx]}</span></div>`).join("")}
                </div>
            </div>
        </div>
    `;
}

function abrirModalAnimacionHombrecitoCDM(nombreEjercicio, grupo = "") {
    const vid = buscarVideoDeEjercicioPorNombreCDM(nombreEjercicio);
    if (vid) return abrirModalReproductorEjercicio(vid.id);
    asegurarModalVideoEnPaginaActualCDM();
    const modal = document.getElementById("modalVideoEjercicio");
    if (!modal) return;
    modal.innerHTML = `<div class="modal-window" style="max-width:720px;"><div class="modal-top"><h3>🏋️ ${nombreEjercicio}</h3><button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalVideoEjercicio()">✕</button></div>${generarBloqueAnimacionHombrecitosHTML(nombreEjercicio, grupo)}</div>`;
    modal.classList.remove("hidden");
}

// =========================================================================
// 4. PANEL DE GIMNASIO (ASISTENCIAS, GRÁFICOS, RÉCORDS Y RUTINAS WHATSAPP)
// =========================================================================

function cambiarTabGym(nombreSec, btnEl) {
    document.querySelectorAll(".gym-seccion").forEach(s => { s.classList.add("hidden"); s.classList.remove("animate-in"); });
    const sec = document.getElementById(`gym-sec-${nombreSec}`);
    if (sec) { sec.classList.remove("hidden"); sec.classList.add("animate-in"); }
    document.querySelectorAll(".module-tabs .mod-tab").forEach(b => b.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");
    actualizarDashboardGym();
    renderizarVideotecaGym();
    renderizarMuroRecordsYRetencionGym();
}

function actualizarDashboardGym() {
    const inpFecha = document.getElementById("fechaAsistenciaGym");
    if (inpFecha && !inpFecha.value) inpFecha.value = obtenerHoyISO();
    const fechaSel = inpFecha ? inpFecha.value : obtenerHoyISO();

    const actGym = basePersonas.filter(p => p.deporte === "Gimnasio" && p.activo);
    const presHoy = actGym.filter(p => p.asistencias.includes(fechaSel)).length;
    const alDia = actGym.filter(p => (p.pagoEstado || "Al Día") === "Al Día");
    const sumaCumpl = actGym.reduce((a, p) => a + Math.min(100, Math.round((contarAsistenciasUltimos7Dias(p) / (p.frecuenciaSemanal || 3)) * 100)), 0);

    if (document.getElementById("gymKpiActivos")) {
        document.getElementById("gymKpiActivos").innerText = actGym.length;
        document.getElementById("gymKpiPresentesHoy").innerText = `${presHoy} / ${actGym.length}`;
        document.getElementById("gymKpiPromedioSemanal").innerText = `${actGym.length ? Math.round(sumaCumpl / actGym.length) : 0}%`;
        document.getElementById("gymKpiRecaudacion").innerText = `$${alDia.reduce((a, p) => a + Number(p.montoCuota || 0), 0).toLocaleString("es-AR")}`;
    }

    renderizarAsistenciasGym();
    poblarSelectsAdminRutinasGym();
    renderizarListaRutinasAdminGym();
}

function renderizarAsistenciasGym() {
    const cont = document.getElementById("contenedorTablaAsistenciasGym");
    if (!cont) return;
    const fecha = document.getElementById("fechaAsistenciaGym")?.value || obtenerHoyISO();
    const activos = basePersonas.filter(p => p.deporte === "Gimnasio" && p.activo);
    if (!activos.length) { cont.innerHTML = `<div class="empty-box">Sin socios activos en el Gimnasio.</div>`; dibujarGraficosColectivosGym(); return; }

    cont.innerHTML = `<div class="table-wrap"><table class="app-table"><thead><tr><th>Check</th><th>Socio</th><th>Plan</th><th>Semana (7d)</th><th>Cuota</th><th>Acciones</th></tr></thead><tbody>` +
        activos.map(p => {
            const pac = p.frecuenciaSemanal || 3, fue = contarAsistenciasUltimos7Dias(p), pres = p.asistencias.includes(fecha), alDia = (p.pagoEstado || "Al Día") === "Al Día";
            return `
                <tr>
                    <td data-label="Check"><button type="button" class="check-btn ${pres ? "checked" : ""}" onclick="toggleAsistenciaPersona(${p.id}, '${fecha}')">✓</button></td>
                    <td data-label="Socio"><strong style="cursor:pointer; color:var(--cdm-600);" onclick="irAPaginaIndividual(${p.id})">${p.apellido}, ${p.nombre}</strong><br><small style="color:var(--ink-500)">DNI ${p.dni} • 🔑 ${p.codigoAcceso}</small></td>
                    <td data-label="Plan"><span class="badge badge-celeste">${p.puesto}</span></td>
                    <td data-label="Semana (7d)"><span class="badge ${fue < pac ? "badge-warn" : "badge-ok"}">${fue}/${pac} días</span></td>
                    <td data-label="Cuota"><span class="badge ${alDia ? "badge-ok" : "badge-danger"}">${alDia ? "💳 Al Día" : "⚠️ Debe"} ($${Number(p.montoCuota || 25000).toLocaleString("es-AR")})</span></td>
                    <td data-label="Acciones">
                        <div style="display:flex; gap:0.3rem; flex-wrap:wrap; justify-content:flex-end;">
                            <button class="btn ${alDia ? "btn-ghost" : "btn-ok"} btn-sm" onclick="alternarEstadoPago(${p.id})">${alDia ? "Estado" : "✓ Cobrar"}</button>
                            <button class="btn btn-secondary btn-sm" onclick="enviarReciboPagoWhatsApp(${p.id})">🧾 WA</button>
                            ${fue < pac ? `<button class="btn btn-warn btn-sm" onclick="enviarAlertaAsistenciaWhatsApp(${p.id})">📲 Aviso</button>` : ""}
                        </div>
                    </td>
                </tr>
            `;
        }).join("") + `</tbody></table></div>`;
    filtrarPlanillaAsistenciasEnVivo();
    dibujarGraficosColectivosGym();
}

function filtrarPlanillaAsistenciasEnVivo() {
    const txt = (document.getElementById("inputBuscarPlanillaGym")?.value || "").toLowerCase().trim();
    const est = document.getElementById("filtroEstadoPlanillaGym")?.value || "todos";
    document.querySelectorAll("#contenedorTablaAsistenciasGym tbody tr").forEach(tr => {
        const low = tr.innerText.toLowerCase();
        const pres = tr.querySelector(".check-btn")?.classList.contains("checked");
        const debe = low.includes("debe");
        const baja = tr.querySelector(".badge-warn") !== null;
        let ok = (!txt || low.includes(txt));
        if (est === "presentes") ok = ok && pres;
        else if (est === "ausentes") ok = ok && !pres;
        else if (est === "al_dia") ok = ok && !debe;
        else if (est === "debe") ok = ok && debe;
        else if (est === "baja_frecuencia") ok = ok && baja;
        tr.style.display = ok ? "" : "none";
    });
}

function marcarTodosPresentesGym() {
    const fecha = document.getElementById("fechaAsistenciaGym")?.value || obtenerHoyISO();
    basePersonas.filter(p => p.deporte === "Gimnasio" && p.activo).forEach(p => { if (!p.asistencias.includes(fecha)) p.asistencias.push(fecha); });
    guardarDatosCDM();
    mostrarToast("✓ Todos marcados presentes.");
    renderizarPaginaDeporte();
}

function dibujarGraficosColectivosGym() {
    const cEv = document.getElementById("canvasAsistenciasGym"), cPa = document.getElementById("canvasPagosAsistenciaGym");
    if (!cEv || !cPa || typeof Chart === "undefined") return;
    if (chartAsistenciaInstancia) chartAsistenciaInstancia.destroy();
    if (chartPagosInstancia) chartPagosInstancia.destroy();

    const act = basePersonas.filter(p => p.deporte === "Gimnasio" && p.activo);
    const labels = [], tot = [], alD = [];
    for (let i = 9; i >= 0; i--) {
        const iso = isoHaceDias(i);
        labels.push(iso.slice(5));
        const as = act.filter(p => p.asistencias.includes(iso));
        tot.push(as.length);
        alD.push(as.filter(p => (p.pagoEstado || "Al Día") === "Al Día").length);
    }

    chartAsistenciaInstancia = new Chart(cEv.getContext("2d"), {
        type: "line",
        data: { labels, datasets: [{ label: "Presentes", data: tot, borderColor: "#0095db", backgroundColor: "rgba(0,149,219,0.2)", fill: true, tension: 0.35 }, { label: "Cuota al Día", data: alD, borderColor: "#10b981", borderDash: [5, 5], tension: 0.35 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });

    const sAl = act.filter(p => (p.pagoEstado || "Al Día") === "Al Día"), sPe = act.filter(p => p.pagoEstado === "Pendiente");
    chartPagosInstancia = new Chart(cPa.getContext("2d"), {
        type: "bar",
        data: { labels: ["Cuota Al Día", "Pendiente"], datasets: [{ label: "Socios", data: [sAl.length, sPe.length], backgroundColor: ["#0095db", "#f59e0b"], borderRadius: 8 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
}

function renderizarMuroRecordsYRetencionGym() {
    const contCaja = document.getElementById("contenedorResumenCajaGym");
    const contRec = document.getElementById("contenedorMuroRecordsGym");
    const contRet = document.getElementById("contenedorRadarRetencionGym");
    if (!contRec || !contRet) return;

    const act = basePersonas.filter(p => p.deporte === "Gimnasio" && p.activo);
    const cob = act.filter(p => (p.pagoEstado || "Al Día") === "Al Día").reduce((a, p) => a + Number(p.montoCuota || 25000), 0);
    const pend = act.filter(p => p.pagoEstado === "Pendiente").reduce((a, p) => a + Number(p.montoCuota || 25000), 0);

    if (contCaja) {
        contCaja.innerHTML = `
            <div class="bento-kpi"><div class="kpi-icon"><i class="ri-user-heart-fill"></i></div><div class="kpi-data"><span>Socios Gym</span><strong>${act.length}</strong></div></div>
            <div class="bento-kpi"><div class="kpi-icon purple"><i class="ri-vidicon-fill"></i></div><div class="kpi-data"><span>Videoteca</span><strong>${baseVideoteca.length} videos</strong></div></div>
            <div class="bento-kpi"><div class="kpi-icon ok"><i class="ri-cash-line"></i></div><div class="kpi-data"><span>Cobrado</span><strong>$${cob.toLocaleString("es-AR")}</strong></div></div>
            <div class="bento-kpi"><div class="kpi-icon warn"><i class="ri-error-warning-fill"></i></div><div class="kpi-data"><span>Por Cobrar</span><strong>$${pend.toLocaleString("es-AR")}</strong></div></div>
        `;
    }

    const prs = [];
    act.forEach(p => (p.evaluaciones || []).forEach(ev => { if (ev.tipo === "fuerza_kg" || ev.tipo === "salto_cm") prs.push({ id: p.id, nom: `${p.apellido}, ${p.nombre}`, ej: ev.ejercicio, val: ev.valor, un: ev.unidad }); }));
    prs.sort((a, b) => b.val - a.val);

    contRec.innerHTML = prs.length
        ? `<div class="table-wrap"><table class="app-table"><thead><tr><th>#</th><th>Socio</th><th>Ejercicio</th><th>PR</th></tr></thead><tbody>${prs.slice(0, 10).map((r, i) => `<tr style="cursor:pointer;" onclick="irAPaginaIndividual(${r.id})"><td><b>#${i + 1}</b></td><td><b>${r.nom}</b></td><td>${r.ej}</td><td><span class="badge badge-ok">${r.val} ${r.un}</span></td></tr>`).join("")}</tbody></table></div>`
        : `<div class="empty-box">Cargá marcas en los socios para ver el Muro de Récords.</div>`;

    const alert = act.filter(p => contarAsistenciasUltimos7Dias(p) < (p.frecuenciaSemanal || 3) || p.pagoEstado === "Pendiente");
    contRet.innerHTML = alert.length
        ? `<div class="table-wrap"><table class="app-table"><thead><tr><th>Socio</th><th>7d</th><th>Cuota</th><th>WA</th></tr></thead><tbody>${alert.map(p => `<tr><td><b onclick="irAPaginaIndividual(${p.id})" style="cursor:pointer;">${p.apellido}, ${p.nombre}</b></td><td>${contarAsistenciasUltimos7Dias(p)}/${p.frecuenciaSemanal || 3}d</td><td>${p.pagoEstado}</td><td><button class="btn btn-whatsapp btn-sm" onclick="enviarReciboPagoWhatsApp(${p.id})"><i class="ri-whatsapp-line"></i></button></td></tr>`).join("")}</tbody></table></div>`
        : `<div class="empty-box"><strong style="color:var(--ok);">✓ Sin alertas activas.</strong></div>`;
}

// 5. SISTEMA VISUAL DE RUTINAS EN 3 CAPAS (CATEGORÍAS CON FOTOS -> RUTINAS -> DETALLE)
//    + MODAL UNIFICADO DE CREAR / EDITAR / ASIGNAR (SIN DUPLICADOS NI MEZCLAS)
// =========================================================================

(function inyectarCSSRutinas3CapasCDM() {
    document.getElementById("cdmCssRutinas3Capas")?.remove();
    const st = document.createElement("style");
    st.id = "cdmCssRutinas3Capas";
    st.textContent = `
        .rutina-dest-tabs {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 0.4rem !important;
            background: var(--surface-subtle, #f1f5f9);
            border: 1.5px solid var(--line-strong, #cbd5e1);
            border-radius: 14px;
            padding: 0.3rem;
            margin-bottom: 0.8rem;
        }
        .rutina-dest-tab {
            border: none;
            background: transparent;
            color: var(--ink-600, #475569);
            font-size: 0.78rem;
            font-weight: 700;
            padding: 0.52rem 0.45rem;
            border-radius: 10px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.35rem;
            transition: all 0.16s ease;
        }
        .rutina-dest-tab.active {
            background: #0284c7;
            color: #ffffff;
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.32);
        }
        @media (max-width: 560px) {
            .rutina-dest-tabs { grid-template-columns: 1fr !important; }
        }

        .rvis-root { width: 100%; display: flex; flex-direction: column; gap: 1rem; }
        .rvis-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.6rem;
            flex-wrap: wrap;
        }
        .rvis-filters {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex-wrap: wrap;
            flex: 1;
        }
        .rvis-search {
            display: flex;
            align-items: center;
            gap: 0.45rem;
            background: var(--surface-subtle, #f8fafc);
            border: 1.5px solid var(--line-strong, #cbd5e1);
            border-radius: 999px;
            padding: 0.38rem 0.9rem;
            min-width: 210px;
            flex: 1;
            max-width: 310px;
        }
        .rvis-search input {
            border: none !important;
            background: transparent !important;
            outline: none !important;
            padding: 0 !important;
            min-height: auto !important;
            box-shadow: none !important;
            font-size: 0.83rem;
            color: var(--ink-900, #0f172a);
            width: 100%;
        }
        .rvis-pill-sel {
            border-radius: 999px !important;
            min-height: 36px !important;
            padding: 0.35rem 0.9rem !important;
            font-size: 0.8rem !important;
            font-weight: 600 !important;
            width: auto !important;
        }

        .rvis-poster-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(205px, 1fr));
            gap: 1.1rem;
        }
        .rvis-poster-card {
            position: relative;
            aspect-ratio: 3 / 4;
            min-height: 265px;
            border-radius: 20px;
            overflow: hidden;
            cursor: pointer;
            background: #0f172a;
            box-shadow: 0 12px 26px -8px rgba(15, 23, 42, 0.34);
            transition: transform 0.24s ease, box-shadow 0.24s ease;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 0.92rem;
            user-select: none;
        }
        .rvis-poster-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 22px 38px -10px rgba(2, 132, 199, 0.46);
        }
        .rvis-poster-img {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.38s ease;
        }
        .rvis-poster-card:hover .rvis-poster-img { transform: scale(1.06); }
        .rvis-poster-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(
                180deg,
                rgba(15, 23, 42, 0.14) 0%,
                rgba(15, 23, 42, 0.24) 44%,
                rgba(10, 15, 28, 0.92) 100%
            );
            z-index: 1;
        }
        .rvis-poster-top {
            position: relative;
            z-index: 2;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 0.4rem;
        }
        .rvis-pro-badge {
            margin-left: auto;
            background: #facc15;
            color: #111827;
            font-size: 0.64rem;
            font-weight: 900;
            letter-spacing: 0.05em;
            padding: 0.22rem 0.55rem;
            border-radius: 7px;
            text-transform: uppercase;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.28);
        }
        .rvis-dest-pill {
            background: rgba(15, 23, 42, 0.68);
            backdrop-filter: blur(6px);
            color: #f8fafc;
            border: 1px solid rgba(255, 255, 255, 0.22);
            font-size: 0.66rem;
            font-weight: 700;
            padding: 0.22rem 0.56rem;
            border-radius: 999px;
            max-width: 145px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .rvis-edit-btn {
            background: rgba(15, 23, 42, 0.58);
            backdrop-filter: blur(6px);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 8px;
            width: 28px;
            height: 28px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 0.82rem;
        }
        .rvis-edit-btn:hover { background: #0284c7; }
        .rvis-poster-bottom {
            position: relative;
            z-index: 2;
            color: #ffffff;
        }
        .rvis-poster-bottom h4 {
            margin: 0 0 0.24rem 0;
            font-size: 1.12rem;
            font-weight: 800;
            line-height: 1.22;
            color: #ffffff;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
        }
        .rvis-poster-meta {
            font-size: 0.74rem;
            color: rgba(241, 245, 249, 0.92);
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.4rem;
            flex-wrap: wrap;
            margin-bottom: 0.52rem;
        }
        .rvis-bar-track {
            height: 4px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.28);
            overflow: hidden;
        }
        .rvis-bar-fill {
            height: 100%;
            border-radius: 999px;
            background: #ffffff;
        }

        .rvis-hero {
            position: relative;
            border-radius: 20px;
            overflow: hidden;
            padding: 1.35rem 1.5rem;
            color: #ffffff;
            background: #0f172a;
            min-height: 145px;
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 1rem;
            flex-wrap: wrap;
        }
        .rvis-hero img {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.42;
        }
        .rvis-hero::after {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(120deg, rgba(12, 25, 44, 0.93) 0%, rgba(12, 25, 44, 0.56) 100%);
        }
        .rvis-hero-body { position: relative; z-index: 2; flex: 1; min-width: 220px; }

        .rvis-ex-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
            gap: 0.85rem;
        }
        .rvis-ex-card {
            background: var(--surface-subtle, #f8fafc);
            border: 1.5px solid var(--line-strong, #cbd5e1);
            border-radius: 16px;
            padding: 0.95rem 1.05rem;
            display: flex;
            align-items: flex-start;
            gap: 0.85rem;
        }
        .rvis-person-banner {
            background: var(--cdm-50, #f0f9ff);
            border: 1.5px solid var(--line-celeste, #bae6fd);
            border-radius: 16px;
            padding: 0.85rem 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.55rem;
        }

/* Acomodo exclusivo para PC: 3 columnas x 2 filas apaisadas (sin tarjeta suelta) */
        @media (min-width: 960px) {
            .rvis-bar:has(.rvis-filters) {
                background: var(--surface-subtle, #f8fafc);
                border: 1px solid var(--line, #e2e8f0);
                border-radius: 14px;
                padding: 0.55rem 0.75rem;
            }
            .rvis-search {
                background: var(--surface-solid, #ffffff);
                max-width: 340px;
            }
            .rvis-poster-grid {
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 1.15rem;
            }
            .rvis-poster-card {
                aspect-ratio: 16 / 10;
                min-height: 195px;
                max-height: 235px;
                padding: 1.05rem 1.2rem;
            }
            .rvis-poster-bottom h4 {
                font-size: 1.24rem;
                margin-bottom: 0.3rem;
            }
            .rvis-poster-meta {
                font-size: 0.78rem;
                margin-bottom: 0.6rem;
            }
        }

        @media (max-width: 600px) {
            .rvis-poster-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.72rem; }
            .rvis-poster-card { min-height: 220px; padding: 0.72rem; }
            .rvis-poster-bottom h4 { font-size: 0.96rem; }
        }
    `;
    document.head.appendChild(st);
})();

const STORAGE_CATS_VISUALES_CDM = "cdm_categorias_rutinas_visuales_v1";

const CATEGORIAS_VISUALES_BASE_CDM = [
    {
        id: "hipertrofia",
        nombre: "Hipertrofia",
        subtitulo: "Masa muscular, estética y volumen",
        badge: "PRO",
        imagen: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: "fuerza",
        nombre: "Fuerza",
        subtitulo: "Fuerza máxima, 1RM y sobrecarga",
        badge: "1RM",
        imagen: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: "rehabilitacion",
        nombre: "Rehabilitación",
        subtitulo: "Readaptación, kine y prevención",
        badge: "SALUD",
        imagen: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: "aerobico",
        nombre: "Aeróbico",
        subtitulo: "Cardio, HIIT y resistencia metabólica",
        badge: "CARDIO",
        imagen: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: "levantamiento",
        nombre: "Levantamiento",
        subtitulo: "Olímpico, potencia explosiva y velocidad",
        badge: "OLY",
        imagen: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: "funcional",
        nombre: "Funcional & Core",
        subtitulo: "Zona media, estabilidad y atletismo",
        badge: "CORE",
        imagen: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?auto=format&fit=crop&w=700&q=80"
    }
];

const PROGRAMAS_GYM_MODAL_CDM = [
    { value: "General", label: "General (Todos los socios del Gym)" },
    { value: "Hipertrofia", label: "Hipertrofia / Musculación" },
    { value: "Fuerza", label: "Fuerza / Powerlifting" },
    { value: "Levantamiento", label: "Levantamiento / Potencia" },
    { value: "Aeróbico", label: "Aeróbico / Cardio HIIT" },
    { value: "Funcional & Core", label: "Funcional & Core" },
    { value: "Rehabilitación", label: "Rehabilitación / Salud" }
];

const CATEGORIAS_DEPORTE_MODAL_CDM = [
    "Sub 13", "Sub 15", "Sub 17", "Reserva", "Primera", "General"
];

const ENFOQUES_RUTINA_MODAL_CDM = [
    { value: "Hipertrofia Estructural", label: "🔴 Hipertrofia / Musculación", catId: "hipertrofia" },
    { value: "Fuerza Máxima", label: "🔵 Fuerza Máxima", catId: "fuerza" },
    { value: "Levantamiento y Potencia", label: "⚡ Levantamiento / Potencia", catId: "levantamiento" },
    { value: "Aeróbico y Resistencia", label: "🟠 Aeróbico / Cardio HIIT", catId: "aerobico" },
    { value: "Funcional y Core", label: "🟢 Funcional y Core", catId: "funcional" },
    { value: "Rehabilitación / Lesión", label: "🏥 Rehabilitación / Readaptación", catId: "rehabilitacion" },
    { value: "Movilidad y Recuperación", label: "🟡 Movilidad y Recuperación", catId: "rehabilitacion" }
];

const PLANTILLAS_RUTINA_MODAL_CDM = {
    hipertrofia: {
        boton: "Hipertrofia",
        catId: "hipertrofia",
        enfoque: "Hipertrofia Estructural",
        titulo: "Tren Superior — Hipertrofia",
        dias: "Lun, Mié y Vie",
        ejercicios: [
            { nombre: "Press de Banca Plano", series: 4, reps: "8-10", peso: "Moderado-Alto", pausa: "90s", forma: "Escápulas retraídas y bajada controlada" },
            { nombre: "Dominadas / Jalón al Pecho en Polea", series: 4, reps: "8-12", peso: "Moderado", pausa: "90s", forma: "Pecho arriba sin balanceo" },
            { nombre: "Remo Unilateral con Mancuerna", series: 3, reps: "10 c/lado", peso: "Moderado", pausa: "75s", forma: "Tirar hacia la cadera" }
        ]
    },
    fuerza: {
        boton: "Fuerza",
        catId: "fuerza",
        enfoque: "Fuerza Máxima",
        titulo: "Fuerza Base 5×5",
        dias: "Lun, Mié y Vie",
        ejercicios: [
            { nombre: "Sentadilla Trasera con Barra", series: 5, reps: "5", peso: "80% 1RM", pausa: "180s", forma: "Core firme y profundidad controlada" },
            { nombre: "Press de Banca Plano", series: 5, reps: "5", peso: "80% 1RM", pausa: "180s", forma: "Pausa breve en el pecho" },
            { nombre: "Peso Muerto Rumano (Isquios y Glúteos)", series: 4, reps: "5", peso: "80% 1RM", pausa: "150s", forma: "Espalda neutra" }
        ]
    },
    piernas: {
        boton: "Fuerza Piernas",
        catId: "fuerza",
        enfoque: "Fuerza Máxima",
        titulo: "Fuerza Tren Inferior y Glúteos",
        dias: "Mar y Jue",
        ejercicios: [
            { nombre: "Hip Thrust con Barra (Empuje de Cadera)", series: 4, reps: "8-10", peso: "Pesado", pausa: "90s", forma: "Sostener 1s arriba" },
            { nombre: "Sentadilla Búlgara Unilateral", series: 3, reps: "8 c/pierna", peso: "Mancuernas", pausa: "75s", forma: "Rodilla alineada con el pie" },
            { nombre: "Peso Muerto Rumano (Isquios y Glúteos)", series: 4, reps: "8", peso: "Controlado", pausa: "90s", forma: "Bisagra de cadera" }
        ]
    },
    levantamiento: {
        boton: "Levantamiento",
        catId: "levantamiento",
        enfoque: "Levantamiento y Potencia",
        titulo: "Levantamiento y Potencia Explosiva",
        dias: "Mar y Jue",
        ejercicios: [
            { nombre: "Cargada Colgante (Hang Clean)", series: 5, reps: "3", peso: "70% 1RM", pausa: "120s", forma: "Extensión explosiva de cadera" },
            { nombre: "Press Militar de Hombros", series: 4, reps: "5", peso: "75% 1RM", pausa: "120s", forma: "Bloqueo firme arriba" },
            { nombre: "Salto al Cajón Explosivo (Box Jump)", series: 4, reps: "5", peso: "Corporal", pausa: "90s", forma: "Aterrizaje suave" }
        ]
    },
    aerobico: {
        boton: "Aeróbico",
        catId: "aerobico",
        enfoque: "Aeróbico y Resistencia",
        titulo: "Aeróbico / HIIT Metabólico",
        dias: "Mar, Jue y Sáb",
        ejercicios: [
            { nombre: "Bloque Intermitente 30/30 (Cinta / Bici)", series: 10, reps: "30 seg", peso: "RPE 8", pausa: "30s", forma: "Ritmo parejo en todas las rondas" },
            { nombre: "Zancadas Alternas Dinámicas", series: 4, reps: "16 totales", peso: "Corporal", pausa: "45s", forma: "Torso erguido" },
            { nombre: "Burpees Técnicos", series: 4, reps: "12", peso: "Corporal", pausa: "60s", forma: "Respiración continua" }
        ]
    },
    funcional: {
        boton: "Funcional",
        catId: "funcional",
        enfoque: "Funcional y Core",
        titulo: "Funcional, Core y Estabilidad",
        dias: "Lun, Mié y Vie",
        ejercicios: [
            { nombre: "Plancha Abdominal RKC y Core", series: 4, reps: "35s", peso: "Corporal", pausa: "45s", forma: "Glúteos y abdomen firmes" },
            { nombre: "Sentadilla Búlgara Unilateral", series: 3, reps: "10 c/pierna", peso: "Moderado", pausa: "60s", forma: "Control de estabilidad" },
            { nombre: "Press Pallof Antirrotación", series: 3, reps: "12 c/lado", peso: "Banda / Polea", pausa: "45s", forma: "Evitar rotar el torso" }
        ]
    },
    rehab: {
        boton: "Rehabilitación",
        catId: "rehabilitacion",
        enfoque: "Rehabilitación / Lesión",
        titulo: "Readaptación y Estabilidad Articular",
        dias: "3 días / sem",
        ejercicios: [
            { nombre: "Hip Thrust con Barra (Empuje de Cadera)", series: 3, reps: "12", peso: "Suave / Sin dolor", pausa: "60s", forma: "Escala de dolor menor a 3" },
            { nombre: "Sentadilla Isométrica en Pared", series: 3, reps: "30s", peso: "Corporal", pausa: "60s", forma: "Rodillas a 90° alineadas" },
            { nombre: "Plancha Abdominal RKC y Core", series: 3, reps: "30s", peso: "Corporal", pausa: "45s", forma: "Sin tensión lumbar" }
        ]
    }
};

const estadoVistaRutinasCDM = {
    capa: "categorias", // 'categorias' | 'lista' | 'detalle'
    catId: null,
    rutinaId: null,
    busqueda: "",
    nivel: "TODOS",
    origen: "TODOS" // 'TODOS' | 'BIBLIOTECA' | 'ASIGNADAS'
};

function escHtmlRutinaCDM(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function normalizarClaveDeporteRutinaCDM(raw) {
    return String(raw || "")
        .replace(/^[^\wÁÉÍÓÚáéíóúÑñ]+/, "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+de\s+piso$/i, "")
        .replace(/\s+oficial$/i, "")
        .trim();
}

function obtenerDeportesDisponiblesRutinasCDM() {
    const lic = typeof obtenerLicenciaConfigCDM === "function" ? obtenerLicenciaConfigCDM() : {};
    const mod = lic?.modulos || { gym: true, futbol: true, hockey: true };
    const mapa = new Map();

    if (mod.gym !== false) mapa.set("gimnasio", { value: "Gimnasio", label: "🏋️ Gimnasio" });
    if (mod.futbol !== false) mapa.set("futbol", { value: "Futbol", label: "⚽ Fútbol" });
    if (mod.hockey !== false) mapa.set("hockey", { value: "Hockey", label: "🏑 Hockey" });

    (lic?.deportesExtra || []).forEach(raw => {
        const valLimpio = String(raw || "").replace(/^[^\wÁÉÍÓÚáéíóúÑñ]+\s*/, "").trim();
        const k = normalizarClaveDeporteRutinaCDM(valLimpio);
        if (k && !mapa.has(k)) mapa.set(k, { value: valLimpio, label: raw.trim() });
    });

    (basePersonas || []).forEach(p => {
        if (!p?.deporte) return;
        const val = String(p.deporte).trim();
        const k = normalizarClaveDeporteRutinaCDM(val);
        if (k && !mapa.has(k)) mapa.set(k, { value: val, label: `🏟️ ${val}` });
    });

    return Array.from(mapa.values());
}

function actualizarCategoriasModalRutinaCDM(idSelDep = "modalRutinaDeporteSelect", idSelCat = "modalRutinaCategoriaSelect", valorPreferido = "") {
    const selDep = document.getElementById(idSelDep);
    const selCat = document.getElementById(idSelCat);
    if (!selDep || !selCat) return;

    const claveDep = normalizarClaveDeporteRutinaCDM(selDep.value);
    const previo = valorPreferido || selCat.value;

    if (claveDep === "gimnasio") {
        selCat.innerHTML = PROGRAMAS_GYM_MODAL_CDM
            .map(p => `<option value="${escHtmlRutinaCDM(p.value)}">${escHtmlRutinaCDM(p.label)}</option>`)
            .join("");
        const ok = PROGRAMAS_GYM_MODAL_CDM.some(p => p.value === previo);
        selCat.value = ok ? previo : "General";
        return;
    }

    const programasGymLower = new Set(PROGRAMAS_GYM_MODAL_CDM.map(p => p.value.toLowerCase()));
    const cats = [...CATEGORIAS_DEPORTE_MODAL_CDM];
    (basePersonas || []).forEach(p => {
        if (!p?.categoria) return;
        if (normalizarClaveDeporteRutinaCDM(p.deporte) !== claveDep) return;
        const c = String(p.categoria).trim();
        if (c && !programasGymLower.has(c.toLowerCase()) && !cats.includes(c)) cats.push(c);
    });

    selCat.innerHTML = cats
        .map(c => `<option value="${escHtmlRutinaCDM(c)}">${c === "General" ? "General (Todo el plantel)" : escHtmlRutinaCDM(c)}</option>`)
        .join("");

    const catUI = typeof categoriaActiva !== "undefined" ? categoriaActiva : "";
    if (cats.includes(previo)) selCat.value = previo;
    else if (catUI && cats.includes(catUI)) selCat.value = catUI;
    else selCat.value = cats[0];
}

function obtenerCategoriasVisualesRutinasCDM() {
    try {
        if (typeof obtenerLicenciaConfigCDM === "function") {
            const lic = obtenerLicenciaConfigCDM();
            if (Array.isArray(lic?.categoriasRutinasVisuales) && lic.categoriasRutinasVisuales.length > 0) {
                return lic.categoriasRutinasVisuales;
            }
        }
        const local = JSON.parse(localStorage.getItem(STORAGE_CATS_VISUALES_CDM) || "null");
        if (Array.isArray(local) && local.length > 0) return local;
    } catch {}
    return CATEGORIAS_VISUALES_BASE_CDM.map(c => ({ ...c }));
}

function guardarCategoriasVisualesRutinasCDM(lista) {
    localStorage.setItem(STORAGE_CATS_VISUALES_CDM, JSON.stringify(lista));
    if (typeof obtenerLicenciaConfigCDM === "function" && typeof guardarLicenciaConfigCDM === "function") {
        const lic = obtenerLicenciaConfigCDM();
        lic.categoriasRutinasVisuales = lista;
        guardarLicenciaConfigCDM(lic);
    }
}

function inferirCategoriaVisualRutinaCDM(r, cats) {
    if (r?.categoriaVisualId && cats.some(c => c.id === r.categoriaVisualId)) return r.categoriaVisualId;
    const txt = `${r?.objetivo || ""} ${r?.nombre || ""}`
        .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (/rehab|lesi|kine|readapt|movilidad|prevent/.test(txt) && cats.some(c => c.id === "rehabilitacion")) return "rehabilitacion";
    if (/levant|olimp|potenc|explosiv|cargada|arranque|pliometr/.test(txt) && cats.some(c => c.id === "levantamiento")) return "levantamiento";
    if (/aerob|cardio|hiit|resisten|metabol|perder|correr/.test(txt) && cats.some(c => c.id === "aerobico")) return "aerobico";
    if (/funcional|core|abdom|calisten|estabilidad/.test(txt) && cats.some(c => c.id === "funcional")) return "funcional";
    if (/fuerza|1rm|power|tren inferior|gluteo/.test(txt) && !/hipertrof/.test(txt) && cats.some(c => c.id === "fuerza")) return "fuerza";
    if (/hipertrof|musculac|volumen|empuje|traccion|superior|brazos/.test(txt) && cats.some(c => c.id === "hipertrofia")) return "hipertrofia";
    return cats[0]?.id || "hipertrofia";
}

function obtenerEtiquetaDestinoRutinaCDM(r) {
    if (r.esPlantillaBiblioteca) return "📚 Biblioteca";
    if (r.etiquetaDestino) return r.etiquetaDestino;
    if (r.esGrupal) return `👥 ${r.deporteDestino || "Grupo"} • ${r.categoriaDestino || "General"}`;
    if (r.personaId) {
        const p = (basePersonas || []).find(x => Number(x.id) === Number(r.personaId));
        if (p) return `👤 ${p.nombre} ${p.apellido}`;
    }
    return "📋 Rutina";
}

function obtenerRutinasDelContextoVisualCDM() {
    const fId = document.getElementById("filtroPersonaRutinasAdmin")?.value || "TODAS";
    const depActual = (typeof deportePagina !== "undefined" && deportePagina) ? deportePagina : "";
    const claveDepActual = normalizarClaveDeporteRutinaCDM(depActual);
    const catAct = (typeof categoriaActiva !== "undefined" && categoriaActiva) ? categoriaActiva : "";

    let lista = [...(baseRutinas || [])].filter(Boolean);

    // Mostrar siempre las plantillas de Biblioteca + las rutinas asignadas de esta área/categoría
    if (claveDepActual && claveDepActual !== "gimnasio") {
        lista = lista.filter(r => {
            if (r.esPlantillaBiblioteca) return true;
            const matchDep = normalizarClaveDeporteRutinaCDM(r.deporteDestino || r.origenModulo) === claveDepActual;
            if (!matchDep) return false;
            return !catAct || !r.categoriaDestino || r.categoriaDestino === catAct || r.categoriaDestino === "General";
        });
    } else if (claveDepActual === "gimnasio") {
        lista = lista.filter(r => {
            if (r.esPlantillaBiblioteca) return true;
            return normalizarClaveDeporteRutinaCDM(r.deporteDestino || r.origenModulo) === "gimnasio";
        });
    }

    if (fId === "SOLO_GRUPALES") {
        lista = lista.filter(r => r.esGrupal || r.esPlantillaBiblioteca);
    } else if (fId !== "TODAS") {
        lista = lista.filter(r => String(r.personaId) === String(fId) || r.esGrupal || r.esPlantillaBiblioteca);
    }

    if (estadoVistaRutinasCDM.origen === "BIBLIOTECA") {
        lista = lista.filter(r => r.esPlantillaBiblioteca);
    } else if (estadoVistaRutinasCDM.origen === "ASIGNADAS") {
        lista = lista.filter(r => !r.esPlantillaBiblioteca);
    }

    if (estadoVistaRutinasCDM.nivel !== "TODOS") {
        lista = lista.filter(r => (r.nivel || "Intermedio") === estadoVistaRutinasCDM.nivel);
    }

    const q = estadoVistaRutinasCDM.busqueda.trim().toLowerCase();
    if (q) {
        lista = lista.filter(r => {
            const bolsa = `${r.nombre || ""} ${r.objetivo || ""} ${r.dias || ""} ${r.notas || ""} ${obtenerEtiquetaDestinoRutinaCDM(r)} ${(r.ejercicios || []).map(e => e.nombre).join(" ")}`.toLowerCase();
            return bolsa.includes(q);
        });
    }

    return lista;
}

// --- ACCIONES DE NAVEGACIÓN DE LAS 3 CAPAS ---

window.navegarCapaRutinasCDM = function (capa, id = null) {
    estadoVistaRutinasCDM.capa = capa;
    if (capa === "categorias") {
        estadoVistaRutinasCDM.catId = null;
        estadoVistaRutinasCDM.rutinaId = null;
    } else if (capa === "lista") {
        estadoVistaRutinasCDM.catId = id;
        estadoVistaRutinasCDM.rutinaId = null;
    } else if (capa === "detalle") {
        estadoVistaRutinasCDM.rutinaId = Number(id);
    }
    renderizarListaRutinasAdminGym();
};

window.filtrarVisualRutinasCDM = function (campo, valor) {
    estadoVistaRutinasCDM[campo] = valor;
    renderizarListaRutinasAdminGym();
};

function comprimirFotoArchivoRutinaCDM(file, cb) {
    const reader = new FileReader();
    reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
            const maxW = 700;
            const scale = Math.min(1, maxW / img.width);
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
            cb(canvas.toDataURL("image/jpeg", 0.78));
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
}

window.subirFotoPortadaRutinaCDM = function (event, idInput, idPreview = null) {
    const file = event.target.files?.[0];
    if (!file) return;
    comprimirFotoArchivoRutinaCDM(file, dataUrl => {
        const inp = document.getElementById(idInput);
        if (inp) inp.value = dataUrl;
        if (idPreview) {
            const img = document.getElementById(idPreview);
            if (img) img.src = dataUrl;
        }
    });
};

// --- MODAL CREAR / EDITAR CATEGORÍA CON FOTO ---

window.abrirModalCategoriaVisualCDM = function (catIdEditar = null) {
    const cats = obtenerCategoriasVisualesRutinasCDM();
    const c = catIdEditar ? cats.find(x => x.id === catIdEditar) : null;
    const modal = asegurarModalRutinaCDM();

    modal.innerHTML = `
        <div class="modal-window" style="max-width:520px;">
            <div class="modal-top">
                <div>
                    <span class="badge badge-celeste">🖼️ CATEGORÍA DE RUTINAS</span>
                    <h3 style="margin-top:4px;">${c ? `Editar: ${escHtmlRutinaCDM(c.nombre)}` : "Nueva Categoría con Foto"}</h3>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalCrearRutinaCDM()">✕</button>
            </div>
            <form onsubmit="guardarCategoriaVisualCDM(event, '${escHtmlRutinaCDM(catIdEditar || "")}')">
                <div class="grid-2" style="margin-bottom:0.75rem;">
                    <div class="field"><label>Nombre *</label><input type="text" id="visCatNombre" required placeholder="Ej: Hipertrofia / Boxeo" value="${escHtmlRutinaCDM(c?.nombre || "")}"></div>
                    <div class="field"><label>Etiqueta (Badge)</label><input type="text" id="visCatBadge" maxlength="10" placeholder="PRO" value="${escHtmlRutinaCDM(c?.badge || "PRO")}"></div>
                </div>
                <div class="field" style="margin-bottom:0.75rem;">
                    <label>Descripción corta</label>
                    <input type="text" id="visCatSub" placeholder="Ej: Planes de masa muscular de 3 a 5 días" value="${escHtmlRutinaCDM(c?.subtitulo || "")}">
                </div>
                <div class="field" style="margin-bottom:0.9rem;">
                    <label>Foto de Portada (URL o subir desde PC/Celular) *</label>
                    <div style="display:flex; gap:0.45rem; align-items:center;">
                        <input type="text" id="visCatImg" required style="flex:1;" value="${escHtmlRutinaCDM(c?.imagen || CATEGORIAS_VISUALES_BASE_CDM[0].imagen)}">
                        <label class="btn btn-secondary btn-sm" style="cursor:pointer; margin:0;">
                            📷 Subir
                            <input type="file" accept="image/*" style="display:none;" onchange="subirFotoPortadaRutinaCDM(event, 'visCatImg', 'visCatPrev')">
                        </label>
                    </div>
                    <img id="visCatPrev" src="${escHtmlRutinaCDM(c?.imagen || CATEGORIAS_VISUALES_BASE_CDM[0].imagen)}" style="width:100%; height:130px; object-fit:cover; border-radius:12px; margin-top:0.55rem; border:1px solid var(--line-strong);">
                </div>
                <div style="display:flex; justify-content:space-between; gap:0.5rem;">
                    ${c && cats.length > 1 ? `<button type="button" class="btn btn-danger btn-sm" onclick="eliminarCategoriaVisualCDM('${escHtmlRutinaCDM(c.id)}')">🗑️ Borrar</button>` : `<span></span>`}
                    <div style="display:flex; gap:0.45rem;">
                        <button type="button" class="btn btn-ghost" onclick="cerrarModalCrearRutinaCDM()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">💾 Guardar</button>
                    </div>
                </div>
            </form>
        </div>
    `;
    modal.classList.remove("hidden");
};

window.guardarCategoriaVisualCDM = function (e, catIdExistente = "") {
    e.preventDefault();
    const nombre = document.getElementById("visCatNombre").value.trim();
    const badge = document.getElementById("visCatBadge").value.trim().toUpperCase();
    const subtitulo = document.getElementById("visCatSub").value.trim();
    const imagen = document.getElementById("visCatImg").value.trim();
    if (!nombre) return;

    const cats = [...obtenerCategoriasVisualesRutinasCDM()];
    if (catIdExistente) {
        const idx = cats.findIndex(c => c.id === catIdExistente);
        if (idx >= 0) cats[idx] = { ...cats[idx], nombre, badge, subtitulo, imagen };
    } else {
        const idNuevo = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_") + "_" + Date.now().toString().slice(-3);
        cats.push({ id: idNuevo, nombre, badge, subtitulo, imagen });
    }
    guardarCategoriasVisualesRutinasCDM(cats);
    cerrarModalCrearRutinaCDM();
    mostrarToast(`✅ Categoría "${nombre}" guardada.`);
    renderizarListaRutinasAdminGym();
};

window.eliminarCategoriaVisualCDM = function (catId) {
    if (!confirm("¿Eliminar esta categoría visual? Tus rutinas no se borran.")) return;
    const cats = obtenerCategoriasVisualesRutinasCDM().filter(c => c.id !== catId);
    guardarCategoriasVisualesRutinasCDM(cats);
    cerrarModalCrearRutinaCDM();
    estadoVistaRutinasCDM.capa = "categorias";
    renderizarListaRutinasAdminGym();
};

window.cargarBibliotecaBaseRutinasCDM = function () {
    const baseId = Date.now();
    Object.values(PLANTILLAS_RUTINA_MODAL_CDM).forEach((tpl, idx) => {
        baseRutinas.push({
            id: baseId + idx + 1,
            esPlantillaBiblioteca: true,
            esGrupal: false,
            personaId: null,
            categoriaVisualId: tpl.catId,
            objetivo: tpl.enfoque,
            nombre: tpl.titulo,
            nivel: idx % 3 === 0 ? "Principiante" : (idx % 3 === 1 ? "Intermedio" : "Avanzado"),
            dias: tpl.dias,
            notas: "Controlar la técnica y respetar las pausas.",
            fecha: new Date().toLocaleDateString("es-AR"),
            ejercicios: tpl.ejercicios.map(e => ({ ...e }))
        });
    });
    guardarDatosCDM();
    mostrarToast("✨ Se cargaron 7 rutinas base en las categorías.");
    renderizarListaRutinasAdminGym();
};

// --- MODAL ASIGNAR / CLONAR RUTINA A PERSONA O GRUPO ---

window.abrirModalAsignarRutinaVisualCDM = function (idR) {
    const r = (baseRutinas || []).find(x => Number(x.id) === Number(idR));
    if (!r) return;
    const modal = asegurarModalRutinaCDM();
    const deportes = obtenerDeportesDisponiblesRutinasCDM();
    const depActual = (typeof deportePagina !== "undefined" && deportePagina) ? deportePagina : "Gimnasio";
    const claveDepActual = normalizarClaveDeporteRutinaCDM(depActual);
    const activos = (basePersonas || []).filter(p => p && p.activo !== false);

    modal.innerHTML = `
        <div class="modal-window" style="max-width:520px;">
            <div class="modal-top">
                <div>
                    <span class="badge badge-ok">👤 ASIGNAR RUTINA</span>
                    <h3 style="margin-top:4px;">${escHtmlRutinaCDM(r.nombre)}</h3>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalCrearRutinaCDM()">✕</button>
            </div>
            <form onsubmit="confirmarAsignarRutinaVisualCDM(event, ${r.id})">
                <div class="field" style="margin-bottom:0.8rem;">
                    <label>¿A quién le asignás esta rutina?</label>
                    <select id="asigTipoDestCDM" onchange="document.getElementById('asigBoxPersCDM').classList.toggle('hidden', this.value!=='persona'); document.getElementById('asigBoxGrupoCDM').classList.toggle('hidden', this.value!=='grupo');">
                        <option value="persona">👤 A una persona puntual</option>
                        <option value="grupo">👥 A una categoría / grupo</option>
                    </select>
                </div>

                <div id="asigBoxPersCDM" class="field" style="margin-bottom:0.9rem;">
                    <label>Elegir Persona *</label>
                    <select id="asigPersonaIdCDM">
                        ${activos.length
                            ? activos.map(p => `<option value="${p.id}">👤 ${escHtmlRutinaCDM(p.apellido)}, ${escHtmlRutinaCDM(p.nombre)} — ${escHtmlRutinaCDM(p.deporte)}${p.categoria ? ` (${escHtmlRutinaCDM(p.categoria)})` : ""}</option>`).join("")
                            : `<option value="">Sin personas activas</option>`}
                    </select>
                </div>

                <div id="asigBoxGrupoCDM" class="grid-2 hidden" style="margin-bottom:0.9rem;">
                    <div class="field">
                        <label>Deporte / Área *</label>
                        <select id="asigDeporteCDM" onchange="actualizarCategoriasModalRutinaCDM('asigDeporteCDM', 'asigCategoriaCDM')">
                            ${deportes.map(d => `<option value="${escHtmlRutinaCDM(d.value)}" ${normalizarClaveDeporteRutinaCDM(d.value) === claveDepActual ? "selected" : ""}>${escHtmlRutinaCDM(d.label)}</option>`).join("")}
                        </select>
                    </div>
                    <div class="field">
                        <label>Categoría o Programa *</label>
                        <select id="asigCategoriaCDM"></select>
                    </div>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                    <button type="button" class="btn btn-ghost" onclick="cerrarModalCrearRutinaCDM()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">✅ Asignar Ahora</button>
                </div>
            </form>
        </div>
    `;
    modal.classList.remove("hidden");
    actualizarCategoriasModalRutinaCDM("asigDeporteCDM", "asigCategoriaCDM");
};

window.confirmarAsignarRutinaVisualCDM = function (e, idOrigen) {
    e.preventDefault();
    const origen = (baseRutinas || []).find(x => Number(x.id) === Number(idOrigen));
    if (!origen) return;

    const cats = obtenerCategoriasVisualesRutinasCDM();
    const catVisualId = inferirCategoriaVisualRutinaCDM(origen, cats);
    const tipo = document.getElementById("asigTipoDestCDM")?.value || "persona";

    if (tipo === "persona") {
        const pid = parseInt(document.getElementById("asigPersonaIdCDM")?.value, 10);
        const p = (basePersonas || []).find(x => Number(x.id) === pid);
        if (!p) { mostrarToast("⚠️ Seleccioná una persona válida."); return; }

        baseRutinas.unshift({
            ...JSON.parse(JSON.stringify(origen)),
            id: Date.now(),
            esPlantillaBiblioteca: false,
            origenPlantillaId: origen.id,
            categoriaVisualId: catVisualId,
            esGrupal: false,
            personaId: p.id,
            deporteDestino: p.deporte || "Gimnasio",
            categoriaDestino: p.categoria || "General",
            etiquetaDestino: `👤 ${p.nombre} ${p.apellido}`,
            fecha: new Date().toLocaleDateString("es-AR")
        });
        guardarDatosCDM();
        cerrarModalCrearRutinaCDM();
        mostrarToast(`✅ "${origen.nombre}" asignada a ${p.nombre} ${p.apellido}.`);
    } else {
        const dep = document.getElementById("asigDeporteCDM")?.value || "Gimnasio";
        const cat = document.getElementById("asigCategoriaCDM")?.value || "General";
        baseRutinas.unshift({
            ...JSON.parse(JSON.stringify(origen)),
            id: Date.now(),
            esPlantillaBiblioteca: false,
            origenPlantillaId: origen.id,
            categoriaVisualId: catVisualId,
            esGrupal: true,
            personaId: null,
            deporteDestino: dep,
            categoriaDestino: cat,
            etiquetaDestino: dep === "Gimnasio" ? `🏋️ Gym • ${cat}` : `🏟️ ${dep} • ${cat}`,
            fecha: new Date().toLocaleDateString("es-AR")
        });
        guardarDatosCDM();
        cerrarModalCrearRutinaCDM();
        mostrarToast(`✅ "${origen.nombre}" asignada a ${dep} (${cat}).`);
    }

    renderizarListaRutinasAdminGym();
};

// --- MODAL CREAR Y EDITAR RUTINA (CON 7 PLANTILLAS + LISTAS LIMPIAS) ---

function inyectarBotonNuevaRutinaEnSeccionesCDM() {
    ["gym-sec-rutinas", "dep-sec-rutinas"].forEach(secId => {
        const sec = document.getElementById(secId);
        if (!sec) return;
        const head = sec.querySelector(".split-view > .app-panel:last-child .panel-head") || sec.querySelector(".panel-head");
        if (!head || head.querySelector(".btn-auto-nueva-rutina-cdm") || head.querySelector("#btnAbrirModalNuevaRutinaCDM")) return;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-primary btn-sm btn-auto-nueva-rutina-cdm";
        btn.innerHTML = `<i class="ri-add-circle-line"></i> + Nueva Rutina`;
        btn.onclick = () => abrirModalCrearRutinaCDM();
        head.appendChild(btn);
    });
}

function asegurarModalRutinaCDM() {
    let modal = document.getElementById("modalCrearRutinaCDM");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "modalCrearRutinaCDM";
        modal.className = "modal-backdrop hidden";
        document.body.appendChild(modal);
    }
    return modal;
}

function cerrarModalCrearRutinaCDM() {
    const modal = document.getElementById("modalCrearRutinaCDM");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.innerHTML = "";
}

function cambiarTipoDestinoRutinaModalCDM(tipo) {
    const inpTipo = document.getElementById("modalRutinaTipoDest");
    if (inpTipo) inpTipo.value = tipo;
    document.getElementById("tabDestBibliotecaCDM")?.classList.toggle("active", tipo === "biblioteca");
    document.getElementById("tabDestPersonaCDM")?.classList.toggle("active", tipo === "persona");
    document.getElementById("tabDestCategoriaCDM")?.classList.toggle("active", tipo === "categoria");
    document.getElementById("bloqueDestPersonaModalCDM")?.classList.toggle("hidden", tipo !== "persona");
    document.getElementById("bloqueDestCategoriaModalCDM")?.classList.toggle("hidden", tipo !== "categoria");
    if (tipo === "categoria") actualizarCategoriasModalRutinaCDM();
}

function agregarFilaRutinaModalCDM(datos = null) {
    const cont = document.getElementById("modalFilasRutinaCDM");
    if (!cont) return;
    const n = cont.querySelectorAll(".ex-builder-row").length + 1;
    const div = document.createElement("div");
    div.className = "ex-builder-row";
    div.innerHTML = `
        <div class="ex-builder-top">
            <span class="ex-builder-num">#${n}</span>
            <div class="field" style="flex:1;"><input type="text" class="mr-nombre" list="listaEjerciciosGymAdmin" required placeholder="Nombre del ejercicio" value="${escHtmlRutinaCDM(datos?.nombre || "")}"></div>
            <button type="button" class="btn btn-danger btn-sm ex-builder-del" onclick="this.closest('.ex-builder-row').remove()">✕</button>
        </div>
        <div class="ex-builder-metrics-grid">
            <div class="field"><label>Series</label><input type="number" class="mr-series" required min="1" value="${escHtmlRutinaCDM(datos?.series || 4)}"></div>
            <div class="field"><label>Reps</label><input type="text" class="mr-reps" required value="${escHtmlRutinaCDM(datos?.reps || "8-10")}"></div>
            <div class="field"><label>Carga</label><input type="text" class="mr-peso" value="${escHtmlRutinaCDM(datos?.peso || "")}" placeholder="Ej: 60kg"></div>
            <div class="field"><label>Pausa</label><input type="text" class="mr-pausa" value="${escHtmlRutinaCDM(datos?.pausa || "90s")}"></div>
        </div>
        <div class="field" style="margin-top:0.4rem;"><input type="text" class="mr-forma" placeholder="💡 Indicación técnica..." value="${escHtmlRutinaCDM(datos?.forma || "")}"></div>
    `;
    cont.appendChild(div);
}

function cargarPlantillaModalRutinaCDM(tipo) {
    const tpl = PLANTILLAS_RUTINA_MODAL_CDM[tipo];
    const cont = document.getElementById("modalFilasRutinaCDM");
    if (!tpl || !cont) return;

    const inpNom = document.getElementById("modalRutinaNombre");
    const inpDias = document.getElementById("modalRutinaDias");
    const selObj = document.getElementById("modalRutinaObjetivo");
    const selCatVis = document.getElementById("modalRutinaCatVisual");

    if (inpNom) inpNom.value = tpl.titulo;
    if (inpDias && !inpDias.value.trim()) inpDias.value = tpl.dias;
    if (selObj) selObj.value = tpl.enfoque;
    if (selCatVis && Array.from(selCatVis.options).some(o => o.value === tpl.catId)) selCatVis.value = tpl.catId;

    cont.innerHTML = "";
    tpl.ejercicios.forEach(ej => agregarFilaRutinaModalCDM(ej));
    mostrarToast(`✨ Plantilla "${tpl.boton}" cargada.`);
}

function abrirModalCrearRutinaCDM(ejercicioInicial = null, idEditar = null, catVisualPre = null) {
    asegurarVideotecaCargada();
    const modal = asegurarModalRutinaCDM();
    const catsVis = obtenerCategoriasVisualesRutinasCDM();
    const deportes = obtenerDeportesDisponiblesRutinasCDM();
    const depActual = (typeof deportePagina !== "undefined" && deportePagina) ? deportePagina : "Gimnasio";
    const claveDepActual = normalizarClaveDeporteRutinaCDM(depActual);

    const rEdit = idEditar ? (baseRutinas || []).find(x => Number(x.id) === Number(idEditar)) : null;
    const catVisSel = rEdit
        ? inferirCategoriaVisualRutinaCDM(rEdit, catsVis)
        : (catVisualPre || estadoVistaRutinasCDM.catId || catsVis[0]?.id || "hipertrofia");

    let tipoDestIni = "biblioteca";
    if (rEdit) {
        tipoDestIni = rEdit.esPlantillaBiblioteca ? "biblioteca" : (rEdit.esGrupal ? "categoria" : "persona");
    } else if (ejercicioInicial) {
        tipoDestIni = depActual === "Gimnasio" ? "persona" : "categoria";
    }

    const activos = (basePersonas || []).filter(p => p && p.activo !== false);
    const personasOrdenadas = [...activos].sort((a, b) => {
        const aM = normalizarClaveDeporteRutinaCDM(a.deporte) === claveDepActual;
        const bM = normalizarClaveDeporteRutinaCDM(b.deporte) === claveDepActual;
        if (aM && !bM) return -1;
        if (!aM && bM) return 1;
        return `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`);
    });

    const depSelVal = rEdit?.deporteDestino
        ? (deportes.find(d => normalizarClaveDeporteRutinaCDM(d.value) === normalizarClaveDeporteRutinaCDM(rEdit.deporteDestino))?.value || deportes[0]?.value || "Gimnasio")
        : (deportes.find(d => normalizarClaveDeporteRutinaCDM(d.value) === claveDepActual)?.value || deportes[0]?.value || "Gimnasio");

    modal.innerHTML = `
        <div class="modal-window" style="max-width:740px;">
            <div class="modal-top">
                <div>
                    <span class="badge badge-celeste">🏋️ ${rEdit ? "EDITAR RUTINA" : "NUEVA RUTINA"}</span>
                    <h3 style="margin-top:4px;">${rEdit ? escHtmlRutinaCDM(rEdit.nombre) : "Diseñar y Asignar Rutina"}</h3>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalCrearRutinaCDM()">✕</button>
            </div>

            <div style="display:flex; gap:0.35rem; flex-wrap:wrap; margin-bottom:0.85rem; align-items:center;">
                <span style="font-size:0.72rem; font-weight:700; color:var(--ink-500);">Plantillas:</span>
                ${Object.entries(PLANTILLAS_RUTINA_MODAL_CDM).map(([k, tpl]) => `
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cargarPlantillaModalRutinaCDM('${k}')">${tpl.boton}</button>
                `).join("")}
            </div>

            <form id="formModalRutinaCDM" onsubmit="guardarRutinaDesdeModalCDM(event, ${rEdit ? rEdit.id : "null"})">
                <input type="hidden" id="modalRutinaTipoDest" value="${tipoDestIni}">

                <div class="rutina-dest-tabs">
                    <button type="button" id="tabDestBibliotecaCDM" class="rutina-dest-tab ${tipoDestIni === "biblioteca" ? "active" : ""}" onclick="cambiarTipoDestinoRutinaModalCDM('biblioteca')">
                        <i class="ri-book-2-line"></i> Biblioteca (Reutilizable)
                    </button>
                    <button type="button" id="tabDestPersonaCDM" class="rutina-dest-tab ${tipoDestIni === "persona" ? "active" : ""}" onclick="cambiarTipoDestinoRutinaModalCDM('persona')">
                        <i class="ri-user-line"></i> Persona puntual
                    </button>
                    <button type="button" id="tabDestCategoriaCDM" class="rutina-dest-tab ${tipoDestIni === "categoria" ? "active" : ""}" onclick="cambiarTipoDestinoRutinaModalCDM('categoria')">
                        <i class="ri-team-line"></i> Categoría / Grupo
                    </button>
                </div>

                <div id="bloqueDestPersonaModalCDM" class="field ${tipoDestIni === "persona" ? "" : "hidden"}" style="margin-bottom:0.75rem;">
                    <label>Socio o Jugador Destinatario *</label>
                    <select id="modalRutinaPersonaSelect">
                        ${personasOrdenadas.length
                            ? personasOrdenadas.map(p => `<option value="${p.id}" ${Number(rEdit?.personaId) === Number(p.id) ? "selected" : ""}>👤 ${escHtmlRutinaCDM(p.apellido)}, ${escHtmlRutinaCDM(p.nombre)} — ${escHtmlRutinaCDM(p.deporte)}${p.categoria ? ` (${escHtmlRutinaCDM(p.categoria)})` : ""}</option>`).join("")
                            : `<option value="">Sin socios/jugadores cargados</option>`}
                    </select>
                </div>

                <div id="bloqueDestCategoriaModalCDM" class="grid-2 ${tipoDestIni === "categoria" ? "" : "hidden"}" style="margin-bottom:0.75rem;">
                    <div class="field">
                        <label>Deporte / Área *</label>
                        <select id="modalRutinaDeporteSelect" onchange="actualizarCategoriasModalRutinaCDM()">
                            ${deportes.map(d => `<option value="${escHtmlRutinaCDM(d.value)}" ${d.value === depSelVal ? "selected" : ""}>${escHtmlRutinaCDM(d.label)}</option>`).join("")}
                        </select>
                    </div>
                    <div class="field">
                        <label>Categoría o Programa *</label>
                        <select id="modalRutinaCategoriaSelect"></select>
                    </div>
                </div>

                <div class="grid-3" style="margin-bottom:0.7rem;">
                    <div class="field">
                        <label>Carpeta Visual (Categoría) *</label>
                        <select id="modalRutinaCatVisual">
                            ${catsVis.map(c => `<option value="${escHtmlRutinaCDM(c.id)}" ${c.id === catVisSel ? "selected" : ""}>${escHtmlRutinaCDM(c.nombre)}</option>`).join("")}
                        </select>
                    </div>
                    <div class="field">
                        <label>Enfoque del Programa *</label>
                        <select id="modalRutinaObjetivo">
                            ${ENFOQUES_RUTINA_MODAL_CDM.map(en => `<option value="${escHtmlRutinaCDM(en.value)}" ${rEdit?.objetivo === en.value ? "selected" : ""}>${escHtmlRutinaCDM(en.label)}</option>`).join("")}
                        </select>
                    </div>
                    <div class="field">
                        <label>Nivel</label>
                        <select id="modalRutinaNivel">
                            <option value="Principiante" ${rEdit?.nivel === "Principiante" ? "selected" : ""}>Principiante</option>
                            <option value="Intermedio" ${(!rEdit || rEdit.nivel === "Intermedio") ? "selected" : ""}>Intermedio</option>
                            <option value="Avanzado" ${rEdit?.nivel === "Avanzado" ? "selected" : ""}>Avanzado</option>
                        </select>
                    </div>
                </div>

                <div class="grid-2" style="margin-bottom:0.7rem;">
                    <div class="field">
                        <label>Título de la Rutina *</label>
                        <input type="text" id="modalRutinaNombre" required placeholder="Ej: Día 1 - Fuerza Tren Inferior" value="${escHtmlRutinaCDM(rEdit?.nombre || "")}">
                    </div>
                    <div class="field">
                        <label>Días Asignados</label>
                        <input type="text" id="modalRutinaDias" placeholder="Ej: Lun, Mié y Vie" value="${escHtmlRutinaCDM(rEdit?.dias || "")}">
                    </div>
                </div>

                <div class="field" style="margin-bottom:0.8rem;">
                    <label>Foto propia de esta rutina (opcional — si queda vacío usa la foto de su categoría)</label>
                    <div style="display:flex; gap:0.45rem;">
                        <input type="text" id="modalRutinaImagen" style="flex:1;" placeholder="URL o subí una imagen..." value="${escHtmlRutinaCDM(rEdit?.imagenPortada || "")}">
                        <label class="btn btn-secondary btn-sm" style="cursor:pointer; margin:0;">
                            📷 Subir
                            <input type="file" accept="image/*" style="display:none;" onchange="subirFotoPortadaRutinaCDM(event, 'modalRutinaImagen')">
                        </label>
                    </div>
                </div>

                <div id="modalFilasRutinaCDM"></div>

                <button type="button" class="btn btn-secondary btn-sm" style="width:100%; margin-bottom:0.75rem;" onclick="agregarFilaRutinaModalCDM()">
                    + Añadir Ejercicio
                </button>

                <div class="field" style="margin-bottom:0.95rem;">
                    <label>Indicaciones del Entrenador</label>
                    <input type="text" id="modalRutinaNotas" placeholder="Opcional: calentamiento, tempo, RPE..." value="${escHtmlRutinaCDM(rEdit?.notas || "")}">
                </div>

                <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                    <button type="button" class="btn btn-ghost" onclick="cerrarModalCrearRutinaCDM()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">💾 ${rEdit ? "Guardar Cambios" : "Guardar Rutina"}</button>
                </div>
            </form>
        </div>
    `;

    modal.classList.remove("hidden");
    actualizarCategoriasModalRutinaCDM("modalRutinaDeporteSelect", "modalRutinaCategoriaSelect", rEdit?.categoriaDestino || "");

    if (rEdit && Array.isArray(rEdit.ejercicios) && rEdit.ejercicios.length) {
        rEdit.ejercicios.forEach(ex => agregarFilaRutinaModalCDM(ex));
    } else {
        agregarFilaRutinaModalCDM(ejercicioInicial);
    }
}

function guardarRutinaDesdeModalCDM(e, idEditar = null) {
    e.preventDefault();
    const tipoDest = document.getElementById("modalRutinaTipoDest")?.value || "biblioteca";
    const filas = document.querySelectorAll("#modalFilasRutinaCDM .ex-builder-row");
    if (!filas.length) { mostrarToast("⚠️ Agregá al menos un ejercicio."); return; }

    const ejercicios = Array.from(filas).map(f => {
        const nom = f.querySelector(".mr-nombre").value.trim();
        if (typeof agregarEjercicioInventadoAlCatalogoCDM === "function") {
            agregarEjercicioInventadoAlCatalogoCDM(nom, "fuerza_kg", true);
        }
        return {
            nombre: nom,
            series: f.querySelector(".mr-series").value,
            reps: f.querySelector(".mr-reps").value.trim(),
            peso: f.querySelector(".mr-peso").value.trim() || "A ajustar",
            pausa: f.querySelector(".mr-pausa").value.trim() || "90s",
            forma: f.querySelector(".mr-forma").value.trim()
        };
    }).filter(ex => ex.nombre);

    if (!ejercicios.length) { mostrarToast("⚠️ Completá el nombre del ejercicio."); return; }

    const depOrigen = (typeof deportePagina !== "undefined" && deportePagina) ? deportePagina : "Gimnasio";
    const catVisualId = document.getElementById("modalRutinaCatVisual")?.value || "hipertrofia";

    const registro = {
        id: idEditar ? Number(idEditar) : Date.now(),
        fecha: new Date().toLocaleDateString("es-AR"),
        categoriaVisualId: catVisualId,
        nombre: document.getElementById("modalRutinaNombre").value.trim(),
        objetivo: document.getElementById("modalRutinaObjetivo").value,
        nivel: document.getElementById("modalRutinaNivel")?.value || "Intermedio",
        dias: document.getElementById("modalRutinaDias").value.trim() || "Semanal",
        imagenPortada: (document.getElementById("modalRutinaImagen")?.value || "").trim(),
        notas: document.getElementById("modalRutinaNotas").value.trim(),
        origenModulo: depOrigen,
        ejercicios
    };

    if (tipoDest === "biblioteca") {
        Object.assign(registro, {
            esPlantillaBiblioteca: true,
            esGrupal: false,
            personaId: null,
            deporteDestino: "",
            categoriaDestino: "",
            etiquetaDestino: "📚 Biblioteca"
        });
    } else if (tipoDest === "categoria") {
        const dep = document.getElementById("modalRutinaDeporteSelect")?.value || depOrigen;
        const cat = document.getElementById("modalRutinaCategoriaSelect")?.value || "General";
        Object.assign(registro, {
            esPlantillaBiblioteca: false,
            esGrupal: true,
            deporteDestino: dep,
            categoriaDestino: cat,
            personaId: null,
            etiquetaDestino: dep === "Gimnasio" ? `🏋️ Gym • ${cat}` : `🏟️ ${dep} • ${cat}`
        });
    } else {
        const pId = parseInt(document.getElementById("modalRutinaPersonaSelect")?.value, 10);
        const p = (basePersonas || []).find(x => Number(x.id) === pId);
        if (!p) { mostrarToast("⚠️ Seleccioná una persona válida."); return; }
        Object.assign(registro, {
            esPlantillaBiblioteca: false,
            esGrupal: false,
            deporteDestino: p.deporte || depOrigen,
            categoriaDestino: p.categoria || "General",
            personaId: p.id,
            etiquetaDestino: `👤 ${p.nombre} ${p.apellido}`
        });
    }

    if (idEditar) {
        const idx = baseRutinas.findIndex(x => Number(x.id) === Number(idEditar));
        if (idx >= 0) baseRutinas[idx] = registro;
        else baseRutinas.unshift(registro);
    } else {
        baseRutinas.unshift(registro);
    }

    guardarDatosCDM();
    cerrarModalCrearRutinaCDM();
    estadoVistaRutinasCDM.catId = catVisualId;
    estadoVistaRutinasCDM.rutinaId = registro.id;
    estadoVistaRutinasCDM.capa = "detalle";
    mostrarToast(idEditar ? "✓ Rutina actualizada." : "✓ Rutina guardada.");
    if (typeof refrescarVistasActivasCDM === "function") refrescarVistasActivasCDM();
    renderizarListaRutinasAdminGym();
}

insertarEjercicioDeVideotecaEnRutina = function (idEx) {
    const ex = (baseVideoteca || []).find(x => Number(x.id) === Number(idEx));
    if (!ex) return;
    abrirModalCrearRutinaCDM({
        nombre: ex.nombre,
        series: ex.seriesSugeridas || 4,
        reps: ex.repsSugeridas || "8-10",
        peso: ex.equipo,
        pausa: ex.pausaSugerida || "90s",
        forma: ex.clavesTecnicas
    });
};

function poblarSelectsAdminRutinasGym() {
    inyectarBotonNuevaRutinaEnSeccionesCDM();
    const selC = document.getElementById("adminRutinaPersonaSelect");
    const selF = document.getElementById("filtroPersonaRutinasAdmin");
    if (!selF) return;
    const prevF = selF.value;

    if (deportePagina && deportePagina !== "Gimnasio") {
        const jug = obtenerPersonasFiltradasDeporte(true);
        if (selC) {
            const prevC = selC.value;
            selC.innerHTML = `<optgroup label="👥 Categoría (${deportePagina})">${CATEGORIAS_DEPORTE_MODAL_CDM.map(c => `<option value="CAT|${deportePagina}|${c}" ${c === categoriaActiva ? "selected" : ""}>🏟️ ${deportePagina} • ${c}</option>`).join("")}</optgroup><optgroup label="👤 Jugador">${jug.map(p => `<option value="${p.id}">👤 ${p.apellido}, ${p.nombre}</option>`).join("")}</optgroup>`;
            if (prevC) selC.value = prevC;
        }
        selF.innerHTML = `<option value="TODAS">Todas las rutinas</option><option value="SOLO_GRUPALES">🏟️ Solo Categorías / Biblioteca</option>` + jug.map(p => `<option value="${p.id}">👤 ${p.apellido}, ${p.nombre}</option>`).join("");
    } else {
        const soc = basePersonas.filter(p => p.deporte === "Gimnasio" && p.activo);
        if (selC) {
            const prevC = selC.value;
            selC.innerHTML = `<optgroup label="🏋️ Programas Gym">${PROGRAMAS_GYM_MODAL_CDM.map(c => `<option value="CAT|Gimnasio|${c.value}">🏋️ Gym • ${c.value}</option>`).join("")}</optgroup><optgroup label="👤 Socios Gym">${soc.map(p => `<option value="${p.id}">👤 ${p.apellido}, ${p.nombre}</option>`).join("")}</optgroup>`;
            if (prevC) selC.value = prevC;
        }
        selF.innerHTML = `<option value="TODAS">Todas las rutinas</option><option value="SOLO_GRUPALES">🏋️ Solo Programas / Biblioteca</option>` + soc.map(p => `<option value="${p.id}">👤 ${p.apellido}, ${p.nombre}</option>`).join("");
    }
    if (prevF) selF.value = prevF;
}

function agregarFilaRutinaAdminGym(datos = null) {
    const cont = document.getElementById("contenedorFilasAdminGym");
    if (!cont) return;
    const n = cont.querySelectorAll(".ex-builder-row").length + 1;
    const div = document.createElement("div");
    div.className = "ex-builder-row";
    div.innerHTML = `
        <div class="ex-builder-top">
            <span class="ex-builder-num">#${n}</span>
            <div class="field" style="flex:1;"><input type="text" class="ag-nombre" list="listaEjerciciosGymAdmin" required placeholder="Nombre del ejercicio" value="${escHtmlRutinaCDM(datos?.nombre || "")}"></div>
            <button type="button" class="btn btn-danger btn-sm ex-builder-del" onclick="this.closest('.ex-builder-row').remove()">✕</button>
        </div>
        <div class="ex-builder-metrics-grid">
            <div class="field"><label>Series</label><input type="number" class="ag-series" required min="1" value="${datos?.series || 4}"></div>
            <div class="field"><label>Reps</label><input type="text" class="ag-reps" required value="${escHtmlRutinaCDM(datos?.reps || "8-10")}"></div>
            <div class="field"><label>Carga</label><input type="text" class="ag-peso" value="${escHtmlRutinaCDM(datos?.peso || "")}"></div>
            <div class="field"><label>Pausa</label><input type="text" class="ag-pausa" value="${escHtmlRutinaCDM(datos?.pausa || "90s")}"></div>
        </div>
        <div class="field" style="margin-top:0.4rem;"><input type="text" class="ag-forma" placeholder="💡 Indicación técnica..." value="${escHtmlRutinaCDM(datos?.forma || "")}"></div>
    `;
    cont.appendChild(div);
}

function cargarPlantillaAdminGym(tipo) { cargarPlantillaModalRutinaCDM(tipo); }
function guardarRutinaDesdeAdminGym(e) { e.preventDefault(); abrirModalCrearRutinaCDM(); }

// Mantener compatibilidad con jugador-ficha.js
function renderTarjetaRutinaProAdmin(r) {
    asegurarVideotecaCargada();
    const totalSeries = (r.ejercicios || []).reduce((a, ex) => a + (parseInt(ex.series, 10) || 0), 0);
    const items = (r.ejercicios || []).map((ex, i) => {
        const vid = buscarVideoDeEjercicioPorNombreCDM(ex.nombre);
        return `
            <div class="routine-pro-ex-item">
                ${renderMiniHombrecitoSVG(ex.nombre, r.objetivo || "")}
                <div class="routine-pro-ex-body">
                    <div class="routine-pro-ex-title-row">
                        <strong>${i + 1}. ${ex.nombre}</strong>
                        ${vid ? `<button type="button" class="routine-video-mini-btn" onclick="abrirModalReproductorEjercicio(${vid.id})">▶ Video</button>` : ""}
                    </div>
                    <div class="routine-pro-ex-pills">
                        <span class="r-pill r-pill-series">${ex.series} × ${ex.reps}</span>
                        <span class="r-pill r-pill-carga">${ex.peso || "A ajustar"}</span>
                        <span class="r-pill r-pill-pausa">${ex.pausa || "90s"}</span>
                    </div>
                </div>
            </div>
        `;
    }).join("");

    return `
        <div class="routine-pro-card">
            <div class="routine-pro-header routine-theme-fuerza">
                <div class="routine-pro-header-top">
                    <span class="routine-dest-badge">${obtenerEtiquetaDestinoRutinaCDM(r)}</span>
                    <button type="button" class="routine-del-btn" onclick="borrarRutinaGlobal(${r.id})"><i class="ri-delete-bin-line"></i></button>
                </div>
                <h4 class="routine-pro-title">${r.nombre}</h4>
                <div class="routine-pro-meta"><span>🎯 ${r.objetivo}</span><span>•</span><span>${(r.ejercicios || []).length} ej. / ${totalSeries} series</span></div>
            </div>
            <div class="routine-pro-ex-list">${items}</div>
            <div class="routine-pro-footer">
                <button type="button" class="btn btn-whatsapp btn-sm" style="flex:1;" onclick="enviarWhatsAppRutinaDirecto(${r.id})"><i class="ri-whatsapp-line"></i> Enviar WA</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="copiarRutinaPortapapeles(${r.id})">📋 Copiar</button>
            </div>
        </div>
    `;
}

// --- RENDERIZADOR PRINCIPAL EN 3 CAPAS DENTRO DE #contenedorTarjetasRutinasAdminGym ---

function renderizarListaRutinasAdminGym() {
    inyectarBotonNuevaRutinaEnSeccionesCDM();
    const cont = document.getElementById("contenedorTarjetasRutinasAdminGym");
    if (!cont) return;

    asegurarVideotecaCargada();
    cont.className = "rvis-root";

    const cats = obtenerCategoriasVisualesRutinasCDM();
    const rutinasContexto = obtenerRutinasDelContextoVisualCDM();
    const totalPlantillas = (baseRutinas || []).filter(r => r?.esPlantillaBiblioteca).length;
    const fId = document.getElementById("filtroPersonaRutinasAdmin")?.value || "TODAS";

    const filtrosHTML = `
        <div class="rvis-bar">
            <div class="rvis-filters">
                <div class="rvis-search">
                    <i class="ri-search-line" style="color:var(--ink-500);"></i>
                    <input type="text" placeholder="Buscar categoría, rutina o ejercicio..." value="${escHtmlRutinaCDM(estadoVistaRutinasCDM.busqueda)}"
                           oninput="filtrarVisualRutinasCDM('busqueda', this.value)">
                </div>
                <select class="rvis-pill-sel" onchange="filtrarVisualRutinasCDM('origen', this.value)">
                    <option value="TODOS" ${estadoVistaRutinasCDM.origen === "TODOS" ? "selected" : ""}>Todas (Biblioteca + Asignadas)</option>
                    <option value="BIBLIOTECA" ${estadoVistaRutinasCDM.origen === "BIBLIOTECA" ? "selected" : ""}>📚 Solo Biblioteca</option>
                    <option value="ASIGNADAS" ${estadoVistaRutinasCDM.origen === "ASIGNADAS" ? "selected" : ""}>👤 Solo Asignadas</option>
                </select>
                <select class="rvis-pill-sel" onchange="filtrarVisualRutinasCDM('nivel', this.value)">
                    <option value="TODOS" ${estadoVistaRutinasCDM.nivel === "TODOS" ? "selected" : ""}>Todos los niveles</option>
                    <option value="Principiante" ${estadoVistaRutinasCDM.nivel === "Principiante" ? "selected" : ""}>Principiante</option>
                    <option value="Intermedio" ${estadoVistaRutinasCDM.nivel === "Intermedio" ? "selected" : ""}>Intermedio</option>
                    <option value="Avanzado" ${estadoVistaRutinasCDM.nivel === "Avanzado" ? "selected" : ""}>Avanzado</option>
                </select>
            </div>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                ${totalPlantillas === 0 ? `<button type="button" class="btn btn-secondary btn-sm" onclick="cargarBibliotecaBaseRutinasCDM()">✨ Cargar Biblioteca Base</button>` : ""}
                <button type="button" class="btn btn-secondary btn-sm" onclick="abrirModalCategoriaVisualCDM(null)">+ Categoría</button>
            </div>
        </div>
    `;

    // CAPA 3: INTERIOR DE UNA RUTINA
    if (estadoVistaRutinasCDM.capa === "detalle") {
        const r = (baseRutinas || []).find(x => Number(x.id) === Number(estadoVistaRutinasCDM.rutinaId));
        if (!r) {
            estadoVistaRutinasCDM.capa = "lista";
            return renderizarListaRutinasAdminGym();
        }
        const catId = inferirCategoriaVisualRutinaCDM(r, cats);
        const cat = cats.find(c => c.id === catId) || cats[0];
        const totalSeries = (r.ejercicios || []).reduce((a, ex) => a + (parseInt(ex.series, 10) || 0), 0);
        const dest = obtenerEtiquetaDestinoRutinaCDM(r);

        cont.innerHTML = `
            <div class="rvis-bar">
                <button type="button" class="btn btn-secondary btn-sm" onclick="navegarCapaRutinasCDM('lista', '${escHtmlRutinaCDM(cat.id)}')">
                    ← Volver a ${escHtmlRutinaCDM(cat.nombre)}
                </button>
                <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                    <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalAsignarRutinaVisualCDM(${r.id})">👤 Asignar a Persona / Grupo</button>
                    <button type="button" class="btn btn-whatsapp btn-sm" onclick="enviarWhatsAppRutinaDirecto(${r.id})"><i class="ri-whatsapp-line"></i> Enviar WA</button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="copiarRutinaPortapapeles(${r.id})">📋 Copiar</button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="abrirModalCrearRutinaCDM(null, ${r.id}, '${escHtmlRutinaCDM(cat.id)}')">✏️ Editar</button>
                    <button type="button" class="btn btn-danger btn-sm" onclick="borrarRutinaGlobal(${r.id})">🗑️</button>
                </div>
            </div>

            <div class="rvis-hero">
                <img src="${escHtmlRutinaCDM(r.imagenPortada || cat.imagen)}" alt="${escHtmlRutinaCDM(r.nombre)}">
                <div class="rvis-hero-body">
                    <div style="display:flex; gap:0.4rem; flex-wrap:wrap; margin-bottom:0.4rem;">
                        <span class="rvis-pro-badge" style="margin-left:0;">${escHtmlRutinaCDM(cat.nombre)}</span>
                        <span class="rvis-dest-pill">${escHtmlRutinaCDM(dest)}</span>
                        <span class="rvis-dest-pill">${escHtmlRutinaCDM(r.nivel || "Intermedio")}</span>
                        ${r.dias ? `<span class="rvis-dest-pill">📅 ${escHtmlRutinaCDM(r.dias)}</span>` : ""}
                    </div>
                    <h3 style="margin:0; font-size:1.5rem; font-weight:800; color:#ffffff;">${escHtmlRutinaCDM(r.nombre)}</h3>
                    <small style="color:#e2e8f0; font-size:0.82rem;">🏋️ ${(r.ejercicios || []).length} ejercicios • ${totalSeries} series totales • 🎯 ${escHtmlRutinaCDM(r.objetivo || cat.nombre)}</small>
                </div>
            </div>

            ${r.notas ? `<div style="background:var(--cdm-50); border-left:4px solid var(--cdm-500); border-radius:12px; padding:0.75rem 1rem; font-size:0.83rem;"><b>💡 Indicaciones:</b> ${escHtmlRutinaCDM(r.notas)}</div>` : ""}

            <div class="rvis-ex-grid">
                ${(r.ejercicios || []).map((ex, idx) => {
                    const vid = buscarVideoDeEjercicioPorNombreCDM(ex.nombre);
                    return `
                        <div class="rvis-ex-card">
                            ${renderMiniHombrecitoSVG(ex.nombre, r.objetivo || "")}
                            <div style="flex:1; min-width:0;">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem;">
                                    <strong style="font-size:0.95rem; color:var(--ink-900);">${idx + 1}. ${escHtmlRutinaCDM(ex.nombre)}</strong>
                                    ${vid ? `<button type="button" class="routine-video-mini-btn" onclick="abrirModalReproductorEjercicio(${vid.id})">▶ Video</button>` : ""}
                                </div>
                                <div class="routine-pro-ex-pills" style="margin-top:0.35rem;">
                                    <span class="r-pill r-pill-series">${escHtmlRutinaCDM(ex.series)} × ${escHtmlRutinaCDM(ex.reps)}</span>
                                    <span class="r-pill r-pill-carga">${escHtmlRutinaCDM(ex.peso || "A ajustar")}</span>
                                    <span class="r-pill r-pill-pausa">${escHtmlRutinaCDM(ex.pausa || "90s")}</span>
                                </div>
                                ${ex.forma ? `<small style="display:block; margin-top:0.38rem; color:var(--ink-500); font-size:0.76rem;">💡 ${escHtmlRutinaCDM(ex.forma)}</small>` : ""}
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>
        `;
        return;
    }

    // CAPA 2: RUTINAS DENTRO DE LA CATEGORÍA ELEGIDA
    if (estadoVistaRutinasCDM.capa === "lista") {
        const cat = cats.find(c => c.id === estadoVistaRutinasCDM.catId) || cats[0];
        if (!cat) {
            estadoVistaRutinasCDM.capa = "categorias";
            return renderizarListaRutinasAdminGym();
        }
        const listaCat = rutinasContexto.filter(r => inferirCategoriaVisualRutinaCDM(r, cats) === cat.id);

        cont.innerHTML = `
            <div class="rvis-bar">
                <button type="button" class="btn btn-secondary btn-sm" onclick="navegarCapaRutinasCDM('categorias')">
                    ← Volver a Categorías
                </button>
                <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalCrearRutinaCDM(null, null, '${escHtmlRutinaCDM(cat.id)}')">
                    + Nueva Rutina en ${escHtmlRutinaCDM(cat.nombre)}
                </button>
            </div>

            <div class="rvis-hero">
                <img src="${escHtmlRutinaCDM(cat.imagen)}" alt="${escHtmlRutinaCDM(cat.nombre)}">
                <div class="rvis-hero-body">
                    ${cat.badge ? `<span class="rvis-pro-badge" style="margin-left:0; margin-bottom:6px; display:inline-block;">${escHtmlRutinaCDM(cat.badge)}</span>` : ""}
                    <h3 style="margin:0; font-size:1.6rem; font-weight:800; color:#ffffff;">${escHtmlRutinaCDM(cat.nombre)}</h3>
                    <small style="color:#e2e8f0; font-size:0.84rem;">${escHtmlRutinaCDM(cat.subtitulo || "Tocá una rutina para ver sus ejercicios, asignarla o enviarla por WhatsApp.")}</small>
                </div>
            </div>

            ${filtrosHTML}

            ${listaCat.length === 0 ? `
                <div class="empty-box" style="text-align:center; padding:2rem;">
                    Todavía no hay rutinas en <b>${escHtmlRutinaCDM(cat.nombre)}</b>.<br>
                    <button type="button" class="btn btn-primary btn-sm" style="margin-top:0.75rem;" onclick="abrirModalCrearRutinaCDM(null, null, '${escHtmlRutinaCDM(cat.id)}')">
                        + Crear primera rutina en ${escHtmlRutinaCDM(cat.nombre)}
                    </button>
                </div>
            ` : `
                <div class="rvis-poster-grid">
                    ${listaCat.map(r => {
                        const cantEj = (r.ejercicios || []).length;
                        const totalSer = (r.ejercicios || []).reduce((a, ex) => a + (parseInt(ex.series, 10) || 0), 0);
                        const dest = obtenerEtiquetaDestinoRutinaCDM(r);
                        const img = r.imagenPortada || cat.imagen;
                        const pct = Math.min(100, Math.max(25, cantEj * 18));
                        return `
                            <div class="rvis-poster-card" onclick="navegarCapaRutinasCDM('detalle', ${r.id})">
                                <img class="rvis-poster-img" src="${escHtmlRutinaCDM(img)}" alt="${escHtmlRutinaCDM(r.nombre)}" onerror="this.src='${escHtmlRutinaCDM(cat.imagen)}'">
                                <div class="rvis-poster-overlay"></div>
                                <div class="rvis-poster-top">
                                    <span class="rvis-dest-pill" title="${escHtmlRutinaCDM(dest)}">${escHtmlRutinaCDM(dest)}</span>
                                    <span class="rvis-pro-badge">${escHtmlRutinaCDM(r.nivel || "General")}</span>
                                </div>
                                <div class="rvis-poster-bottom">
                                    <h4>${escHtmlRutinaCDM(r.nombre)}</h4>
                                    <div class="rvis-poster-meta">
                                        <span>🏋️ ${cantEj} ej.</span>
                                        <span>•</span>
                                        <span>${totalSer} series</span>
                                        ${r.dias ? `<span>• ${escHtmlRutinaCDM(r.dias)}</span>` : ""}
                                    </div>
                                    <div class="rvis-bar-track"><div class="rvis-bar-fill" style="width:${pct}%;"></div></div>
                                </div>
                            </div>
                        `;
                    }).join("")}
                </div>
            `}
        `;
        return;
    }

    // CAPA 1: TARJETAS DE CATEGORÍAS CON FOTO (PANTALLA PRINCIPAL DE RUTINAS)
    const q = estadoVistaRutinasCDM.busqueda.trim().toLowerCase();
    const catsVisibles = cats.filter(c => {
        if (!q) return true;
        const enCat = `${c.nombre} ${c.subtitulo || ""}`.toLowerCase().includes(q);
        const enRut = rutinasContexto.some(r => inferirCategoriaVisualRutinaCDM(r, cats) === c.id);
        return enCat || enRut;
    });

    // Si en el filtro superior eligió una persona puntual, mostrar acceso directo a sus rutinas arriba
    let bannerPersonaHTML = "";
    if (fId !== "TODAS" && fId !== "SOLO_GRUPALES") {
        const pers = (basePersonas || []).find(p => String(p.id) === String(fId));
        const rutsPers = rutinasContexto.filter(r => String(r.personaId) === String(fId));
        if (pers) {
            bannerPersonaHTML = `
                <div class="rvis-person-banner">
                    <strong style="font-size:0.86rem; color:var(--cdm-700);">👤 Rutinas asignadas a ${escHtmlRutinaCDM(pers.nombre)} ${escHtmlRutinaCDM(pers.apellido)} (${rutsPers.length}):</strong>
                    <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                        ${rutsPers.length
                            ? rutsPers.map(r => `<button type="button" class="btn btn-primary btn-sm" onclick="navegarCapaRutinasCDM('detalle', ${r.id})">🏋️ ${escHtmlRutinaCDM(r.nombre)}</button>`).join("")
                            : `<small style="color:var(--ink-500);">Todavía no tiene rutinas asignadas. Entrá a cualquier categoría abajo y asignale una.</small>`}
                    </div>
                </div>
            `;
        }
    }

    cont.innerHTML = `
        ${filtrosHTML}
        ${bannerPersonaHTML}
        <div class="rvis-poster-grid">
            ${catsVisibles.map(cat => {
                const rutsCat = rutinasContexto.filter(r => inferirCategoriaVisualRutinaCDM(r, cats) === cat.id);
                const cantAsig = rutsCat.filter(r => !r.esPlantillaBiblioteca).length;
                const pct = Math.min(100, Math.max(18, rutsCat.length * 22));
                return `
                    <div class="rvis-poster-card" onclick="navegarCapaRutinasCDM('lista', '${escHtmlRutinaCDM(cat.id)}')">
                        <img class="rvis-poster-img" src="${escHtmlRutinaCDM(cat.imagen)}" alt="${escHtmlRutinaCDM(cat.nombre)}"
                             onerror="this.src='https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=700&q=80'">
                        <div class="rvis-poster-overlay"></div>
                        <div class="rvis-poster-top">
                            <button type="button" class="rvis-edit-btn" title="Cambiar foto o nombre de categoría"
                                    onclick="event.stopPropagation(); abrirModalCategoriaVisualCDM('${escHtmlRutinaCDM(cat.id)}')">
                                <i class="ri-pencil-line"></i>
                            </button>
                            ${cat.badge ? `<span class="rvis-pro-badge">${escHtmlRutinaCDM(cat.badge)}</span>` : ""}
                        </div>
                        <div class="rvis-poster-bottom">
                            <h4>${escHtmlRutinaCDM(cat.nombre)}</h4>
                            <div class="rvis-poster-meta">
                                <span>📋 ${rutsCat.length} ${rutsCat.length === 1 ? "rutina" : "rutinas"}</span>
                                <span>•</span>
                                <span>👥 ${cantAsig} asig.</span>
                            </div>
                            <div class="rvis-bar-track"><div class="rvis-bar-fill" style="width:${pct}%;"></div></div>
                        </div>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

function armarMensajeWhatsAppRutina(r, dest) {
    const club = obtenerLicenciaConfigCDM().nombreEntidad.toUpperCase();
    let msg = `💙🤍 *${club}*\n📌 *Para:* ${dest}\n🏋️ *Rutina:* ${r.nombre} (${r.objetivo})\n🗓️ ${r.dias}\n----------------------------------\n\n`;
    (r.ejercicios || []).forEach((ex, i) => {
        const vid = buscarVideoDeEjercicioPorNombreCDM(ex.nombre);
        msg += `*${i + 1}. ${ex.nombre.toUpperCase()}*\n• ${ex.series} × ${ex.reps} | ${ex.peso} | ${ex.pausa}\n`;
        if (vid?.videoUrl && !vid.esVideoLocal) msg += `🎥 ${vid.videoUrl}\n`;
        msg += `\n`;
    });
    return msg;
}

function copiarRutinaPortapapeles(idR) {
    const r = baseRutinas.find(x => Number(x.id) === Number(idR));
    if (r) navigator.clipboard.writeText(armarMensajeWhatsAppRutina(r, obtenerEtiquetaDestinoRutinaCDM(r))).then(() => mostrarToast("📋 Rutina copiada."));
}

function enviarWhatsAppRutinaDirecto(idR) {
    const r = baseRutinas.find(x => Number(x.id) === Number(idR));
    if (!r) return;
    const p = r.personaId ? basePersonas.find(x => Number(x.id) === Number(r.personaId)) : null;
    const tel = p ? String(p.whatsapp || "").replace(/\D/g, "") : "";
    const msg = armarMensajeWhatsAppRutina(r, p ? `${p.nombre} ${p.apellido}` : obtenerEtiquetaDestinoRutinaCDM(r));
    window.open(tel ? `https://wa.me/${tel}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
}

function borrarRutinaGlobal(idR) {
    if (!confirm("🗑️ ¿Eliminar esta rutina?")) return;
    baseRutinas = baseRutinas.filter(x => Number(x.id) !== Number(idR));
    if (Number(estadoVistaRutinasCDM.rutinaId) === Number(idR)) {
        estadoVistaRutinasCDM.capa = "lista";
        estadoVistaRutinasCDM.rutinaId = null;
    }
    guardarDatosCDM();
    if (typeof refrescarVistasActivasCDM === "function") refrescarVistasActivasCDM();
    renderizarListaRutinasAdminGym();
}

// =========================================================================

// =========================================================================
// 6. LISTA COMPACTA DESPLEGABLE DE SOCIOS + MODAL SISTEMA EN CELULAR
// =========================================================================

function aplicarModoListaSociosGymCDM(modo) {
    const grid = document.getElementById("gridJugadoresDeporte");
    if (!grid) return;
    const usarLista = modo === "lista";
    grid.classList.toggle("vista-lista-compacta", usarLista);
    localStorage.setItem("cdm_vista_socios_modo", usarLista ? "lista" : "tarjetas");
    document.getElementById("btnVistaListaCDM")?.classList.toggle("active", usarLista);
    document.getElementById("btnVistaTarjetasCDM")?.classList.toggle("active", !usarLista);
}

function decorarTarjetasListaCompactaCDM() {
    const grid = document.getElementById("gridJugadoresDeporte");
    if (!grid) return;
    grid.querySelectorAll(".athlete-card .ath-card-header").forEach(header => {
        if (!header.querySelector(".ath-expand-indicator")) {
            const flecha = document.createElement("span");
            flecha.className = "ath-expand-indicator";
            flecha.title = "Tocar para desplegar/ocultar detalles";
            flecha.innerHTML = `<i class="ri-arrow-down-s-line"></i>`;
            header.appendChild(flecha);
        }
    });
}

function inicializarListaCompactaSociosCDM() {
    const grid = document.getElementById("gridJugadoresDeporte");
    if (!grid || grid.dataset.listaCompactaInit === "1") return;
    grid.dataset.listaCompactaInit = "1";

    // Insertar switch Lista Compacta / Tarjetas encima de la grilla
    if (!document.getElementById("gymViewSwitchBarCDM")) {
        const bar = document.createElement("div");
        bar.id = "gymViewSwitchBarCDM";
        bar.className = "gym-view-switch-bar";
        bar.innerHTML = `
            <small style="color:var(--ink-500); font-weight:600;">Tocá un socio para desplegar su info y botones</small>
            <div class="gym-view-switch-group">
                <button type="button" id="btnVistaListaCDM" class="gym-view-btn" onclick="aplicarModoListaSociosGymCDM('lista')"><i class="ri-list-check-2"></i> Lista</button>
                <button type="button" id="btnVistaTarjetasCDM" class="gym-view-btn" onclick="aplicarModoListaSociosGymCDM('tarjetas')"><i class="ri-layout-grid-line"></i> Tarjetas</button>
            </div>
        `;
        grid.parentNode.insertBefore(bar, grid);
    }

    // Por defecto: lista compacta en Gimnasio o en celular
    const guardado = localStorage.getItem("cdm_vista_socios_modo");
    const modoInicial = guardado || ((deportePagina === "Gimnasio" || window.innerWidth <= 860) ? "lista" : "tarjetas");
    aplicarModoListaSociosGymCDM(modoInicial);

    // Capturar click en la fila para desplegar/contraer sin abrir Ficha 360° por accidente
    grid.addEventListener("click", (e) => {
        if (!grid.classList.contains("vista-lista-compacta")) return;
        const card = e.target.closest(".athlete-card");
        if (!card) return;
        if (e.target.closest("button, a, input, select, .check-btn, .avatar-editable, .ath-bottom")) return;
        e.preventDefault();
        e.stopPropagation();
        card.classList.toggle("card-expanded");
    }, true);

    decorarTarjetasListaCompactaCDM();
    const obs = new MutationObserver(() => decorarTarjetasListaCompactaCDM());
    obs.observe(grid, { childList: true });
}

function abrirModalSistemaMovilCDM() {
    let modal = document.getElementById("modalSistemaMovilCDM");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "modalSistemaMovilCDM";
        modal.className = "modal-backdrop hidden";
        document.body.appendChild(modal);
    }
    modal.innerHTML = `
        <div class="modal-window" style="max-width:420px;">
            <div class="modal-top">
                <h3><i class="ri-database-2-line"></i> Sistema y Backup</h3>
                <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('modalSistemaMovilCDM').classList.add('hidden')">✕</button>
            </div>
            <div style="display:flex; flex-direction:column; gap:0.65rem;">
                <button type="button" class="btn btn-primary" onclick="cargarDatosDemoCDM(); document.getElementById('modalSistemaMovilCDM').classList.add('hidden');">
                    <i class="ri-sparkling-fill"></i> Cargar Datos Demo
                </button>
                <button type="button" class="btn btn-secondary" onclick="exportarBackupJSON()">
                    <i class="ri-download-2-line"></i> Descargar Backup JSON
                </button>
                <label class="btn btn-ghost" style="cursor:pointer;">
                    <i class="ri-upload-2-line"></i> Subir / Restaurar Backup JSON
                    <input type="file" accept=".json" onchange="importarBackupJSON(event); document.getElementById('modalSistemaMovilCDM').classList.add('hidden');" style="display:none;">
                </label>
                <button type="button" class="btn btn-danger" onclick="limpiarTodoElSistema(); document.getElementById('modalSistemaMovilCDM').classList.add('hidden');">
                    <i class="ri-delete-bin-line"></i> Vaciar Todos los Datos
                </button>
            </div>
        </div>
    `;
    modal.classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
    asegurarVideotecaCargada();
    inyectarBotonNuevaRutinaEnSeccionesCDM();
    inicializarListaCompactaSociosCDM();
    if (deportePagina === "Gimnasio") {
        const cont = document.getElementById("contenedorFilasAdminGym");
        if (cont && cont.children.length === 0) agregarFilaRutinaAdminGym();
    }
});
// =========================================================================
// 7. BASE DE DATOS DE RUTINAS + SELECTOR VISUAL DESDE BASE DE EJERCICIOS
//    - Elegir ejercicios directo desde baseCatalogoEjercicios + baseVideoteca
//    - Elegir y asignar rutinas guardadas en la Base de Rutinas desde afuera
//      (funciona tanto en gym.html / deportes como en la ficha jugador.html)
// Pegar al final de js/gimnasio.js
// =========================================================================
(function () {
    if (window.__cdmBaseRutinasYEjercicios7) return;
    window.__cdmBaseRutinasYEjercicios7 = true;

    let pickerEjModoDestino = "modal_rutina"; // "modal_rutina" | "ficha_individual"
    let pickerEjGrupoFiltro = "TODOS";
    let pickerEjBusqueda = "";
    const pickerEjSeleccionados = new Set();

    let pickerRutModo = "cargar_en_modal"; // "cargar_en_modal" | "ficha_persona"
    let pickerRutPersonaId = null;
    let pickerRutSoloBiblio = true;
    let pickerRutBusqueda = "";

    function escB7(s) {
        return String(s ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function inyectarCSSPickersBase7() {
        if (document.getElementById("cdmCssPickersBase7")) return;
        const st = document.createElement("style");
        st.id = "cdmCssPickersBase7";
        st.textContent = `
            #modalPickerBaseCDM7 { z-index: 99999 !important; }
            .pk7-chips { display: flex; gap: 0.32rem; flex-wrap: wrap; margin-bottom: 0.65rem; }
            .pk7-chip {
                border: 1.5px solid var(--line-strong, #cbd5e1);
                background: var(--surface-subtle, #f8fafc);
                color: var(--ink-700, #334155);
                font-size: 0.72rem; font-weight: 800; padding: 0.28rem 0.65rem;
                border-radius: 999px; cursor: pointer;
            }
            .pk7-chip.active { background: #0284c7; border-color: #0284c7; color: #ffffff; }
            .pk7-ej-list {
                display: grid; grid-template-columns: repeat(auto-fill, minmax(235px, 1fr));
                gap: 0.48rem; max-height: 44vh; overflow-y: auto; padding: 2px;
            }
            .pk7-ej-item {
                display: flex; align-items: flex-start; gap: 0.55rem;
                padding: 0.58rem 0.72rem; border-radius: 12px;
                border: 1.5px solid var(--line, #e2e8f0);
                background: var(--surface-subtle, #f8fafc);
                cursor: pointer; transition: all 0.14s ease;
            }
            .pk7-ej-item:hover { border-color: #0284c7; }
            .pk7-ej-item.checked { background: rgba(2, 132, 199, 0.1); border-color: #0284c7; }
            .pk7-ej-item input { width: 17px; height: 17px; min-height: auto !important; margin-top: 2px; accent-color: #0284c7; flex-shrink: 0; }
            .pk7-rut-list {
                display: flex; flex-direction: column; gap: 0.55rem;
                max-height: 52vh; overflow-y: auto;
            }
            .pk7-rut-card {
                background: var(--surface-subtle, #f8fafc);
                border: 1.5px solid var(--line-strong, #cbd5e1);
                border-left: 4px solid #0284c7;
                border-radius: 14px; padding: 0.75rem 0.9rem;
                display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap;
            }
        `;
        document.head.appendChild(st);
    }

    function asegurarModalPicker7() {
        inyectarCSSPickersBase7();
        let m = document.getElementById("modalPickerBaseCDM7");
        if (!m) {
            m = document.createElement("div");
            m.id = "modalPickerBaseCDM7";
            m.className = "modal-backdrop hidden";
            m.onclick = (e) => { if (e.target === m) cerrarModalPickerBase7(); };
            document.body.appendChild(m);
        }
        return m;
    }

    window.cerrarModalPickerBase7 = function () {
        document.getElementById("modalPickerBaseCDM7")?.classList.add("hidden");
    };

    // --- 1. UNIFICAR BASE DE EJERCICIOS (CATALOGO + VIDEOTECA) ---
    function obtenerBaseEjerciciosUnificada7() {
        if (typeof asegurarVideotecaCargada === "function") asegurarVideotecaCargada();
        const mapa = new Map();

        (typeof baseVideoteca !== "undefined" ? baseVideoteca : []).forEach(v => {
            if (!v?.nombre) return;
            const k = normalizarTextoEjercicioCDM(v.nombre);
            if (!k || mapa.has(k)) return;
            mapa.set(k, {
                clave: k,
                nombre: v.nombre.trim(),
                grupo: v.grupo || "General",
                equipo: v.equipo || "A ajustar",
                series: v.seriesSugeridas || 4,
                reps: v.repsSugeridas || "8-10",
                pausa: v.pausaSugerida || "90s",
                forma: v.clavesTecnicas || "",
                tieneVideo: Boolean(v.videoUrl && v.videoUrl !== "biomech://simulador")
            });
        });

        (typeof baseCatalogoEjercicios !== "undefined" ? baseCatalogoEjercicios : []).forEach(e => {
            if (!e?.nombre) return;
            const k = normalizarTextoEjercicioCDM(e.nombre);
            if (!k || mapa.has(k)) return;
            mapa.set(k, {
                clave: k,
                nombre: e.nombre.trim(),
                grupo: e.grupo || "General",
                equipo: "A ajustar",
                series: 4,
                reps: "8-10",
                pausa: "90s",
                forma: "",
                tieneVideo: Boolean(e.video)
            });
        });

        return Array.from(mapa.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    // --- 2. SELECTOR VISUAL DESDE LA BASE DE EJERCICIOS ---
    window.abrirModalSelectorBaseEjerciciosCDM = function (modoDestino = "modal_rutina") {
        pickerEjModoDestino = modoDestino;
        pickerEjGrupoFiltro = "TODOS";
        pickerEjBusqueda = "";
        pickerEjSeleccionados.clear();
        renderModalSelectorEjercicios7();
    };

    function renderModalSelectorEjercicios7() {
        const modal = asegurarModalPicker7();
        const todos = obtenerBaseEjerciciosUnificada7();
        const grupos = ["TODOS", ...new Set(todos.map(e => e.grupo).filter(Boolean))];
        const q = normalizarTextoEjercicioCDM(pickerEjBusqueda);

        const filtrados = todos.filter(e => {
            if (pickerEjGrupoFiltro !== "TODOS" && e.grupo !== pickerEjGrupoFiltro) return false;
            if (q && !normalizarTextoEjercicioCDM(`${e.nombre} ${e.grupo} ${e.equipo}`).includes(q)) return false;
            return true;
        });

        modal.innerHTML = `
            <div class="modal-window" style="max-width:740px;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-celeste">🏋️ BASE DE DATOS DE EJERCICIOS (${todos.length})</span>
                        <h3 style="margin-top:4px;">Elegir Ejercicios para la Rutina</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalPickerBase7()">✕</button>
                </div>

                <div style="display:flex; gap:0.5rem; margin-bottom:0.65rem; flex-wrap:wrap;">
                    <input type="text" id="pk7BusqEj" value="${escB7(pickerEjBusqueda)}" placeholder="🔍 Buscar ejercicio o equipo..." style="flex:1; min-width:200px;"
                        oninput="pk7SetFiltroEj('busq', this.value)">
                </div>

                <div class="pk7-chips">
                    ${grupos.map(g => `
                        <button type="button" class="pk7-chip ${pickerEjGrupoFiltro === g ? "active" : ""}" onclick="pk7SetFiltroEj('grupo', '${escB7(g)}')">${escB7(g === "TODOS" ? "Todos" : g)}</button>
                    `).join("")}
                </div>

                <div class="pk7-ej-list">
                    ${filtrados.length === 0 ? `<div class="empty-box" style="grid-column:1/-1; padding:1rem;">Sin ejercicios con ese filtro. Podés crear uno abajo.</div>` :
                    filtrados.map(ex => {
                        const sel = pickerEjSeleccionados.has(ex.clave);
                        return `
                            <label class="pk7-ej-item ${sel ? "checked" : ""}">
                                <input type="checkbox" ${sel ? "checked" : ""} onchange="pk7ToggleEj('${escB7(ex.clave)}', this)">
                                <div style="min-width:0;">
                                    <strong style="display:block; font-size:0.83rem; color:var(--ink-900);">${escB7(ex.nombre)}</strong>
                                    <small style="display:block; font-size:0.71rem; color:var(--ink-500);">
                                        ${escB7(ex.grupo)} • ${ex.series}×${escB7(ex.reps)} ${ex.tieneVideo ? "• 🎥 Video" : ""}
                                    </small>
                                </div>
                            </label>
                        `;
                    }).join("")}
                </div>

                <form onsubmit="pk7CrearEjercicioRapido(event)" style="display:flex; gap:0.4rem; flex-wrap:wrap; margin-top:0.75rem; padding-top:0.7rem; border-top:1px dashed var(--line);">
                    <input type="text" id="pk7NuevoNom" placeholder="+ Crear ejercicio nuevo en la Base..." style="flex:1; min-width:180px; min-height:34px; font-size:0.78rem;">
                    <select id="pk7NuevoGrp" style="width:auto; min-height:34px; font-size:0.76rem;">
                        <option>Tren Inferior</option><option>Empuje / Torso</option><option>Tracción / Espalda</option><option>Core y Funcional</option><option>Potencia y Pliometría</option><option>Movilidad y Rehab</option>
                    </select>
                    <button type="submit" class="btn btn-secondary btn-sm">+ Crear y tildar</button>
                </form>

                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; margin-top:0.85rem; flex-wrap:wrap;">
                    <small id="pk7ContSel" style="font-weight:800; color:var(--ink-600);">${pickerEjSeleccionados.size} ejercicio(s) seleccionado(s)</small>
                    <div style="display:flex; gap:0.45rem;">
                        <button type="button" class="btn btn-ghost" onclick="cerrarModalPickerBase7()">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="pk7ConfirmarEjercicios()">✅ Agregar a la Rutina</button>
                    </div>
                </div>
            </div>
        `;
        modal.classList.remove("hidden");
    }

    window.pk7SetFiltroEj = function (tipo, val) {
        if (tipo === "grupo") pickerEjGrupoFiltro = val;
        else pickerEjBusqueda = val;
        renderModalSelectorEjercicios7();
        if (tipo === "busq") {
            const inp = document.getElementById("pk7BusqEj");
            if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
        }
    };

    window.pk7ToggleEj = function (clave, chkEl) {
        if (chkEl.checked) pickerEjSeleccionados.add(clave);
        else pickerEjSeleccionados.delete(clave);
        chkEl.closest(".pk7-ej-item")?.classList.toggle("checked", chkEl.checked);
        const lbl = document.getElementById("pk7ContSel");
        if (lbl) lbl.textContent = `${pickerEjSeleccionados.size} ejercicio(s) seleccionado(s)`;
    };

    window.pk7CrearEjercicioRapido = function (e) {
        e.preventDefault();
        const nom = (document.getElementById("pk7NuevoNom")?.value || "").trim();
        const grp = document.getElementById("pk7NuevoGrp")?.value || "General";
        if (!nom) return;
        if (typeof agregarEjercicioInventadoAlCatalogoCDM === "function") {
            agregarEjercicioInventadoAlCatalogoCDM(nom, "fuerza_kg", false, { grupo: grp });
            if (typeof guardarDatosCDM === "function") guardarDatosCDM();
        }
        pickerEjSeleccionados.add(normalizarTextoEjercicioCDM(nom));
        pickerEjBusqueda = "";
        renderModalSelectorEjercicios7();
    };

    window.pk7ConfirmarEjercicios = function () {
        if (pickerEjSeleccionados.size === 0) {
            if (typeof mostrarToast === "function") mostrarToast("⚠️ Tildá al menos un ejercicio de la lista.");
            return;
        }
        const todos = obtenerBaseEjerciciosUnificada7();
        const elegidos = todos.filter(e => pickerEjSeleccionados.has(e.clave));

        if (pickerEjModoDestino === "ficha_individual") {
            const cont = document.getElementById("contenedorFilasRutinaIndividual");
            if (cont) {
                const filas = cont.querySelectorAll(".ex-builder-row");
                if (filas.length === 1 && !(filas[0].querySelector(".ri-ej")?.value || "").trim()) {
                    filas[0].remove();
                }
                elegidos.forEach(ex => {
                    if (typeof agregarFilaEjercicioIndividual === "function") {
                        agregarFilaEjercicioIndividual({ nombre: ex.nombre, series: String(ex.series), reps: ex.reps, peso: ex.equipo });
                    }
                });
            }
        } else {
            const cont = document.getElementById("modalFilasRutinaCDM");
            if (cont) {
                const filas = cont.querySelectorAll(".ex-builder-row");
                if (filas.length === 1 && !(filas[0].querySelector(".mr-nombre")?.value || "").trim()) {
                    filas[0].remove();
                }
                elegidos.forEach(ex => {
                    if (typeof agregarFilaRutinaModalCDM === "function") {
                        agregarFilaRutinaModalCDM({ nombre: ex.nombre, series: ex.series, reps: ex.reps, peso: ex.equipo, pausa: ex.pausa, forma: ex.forma });
                    }
                });
            }
        }

        cerrarModalPickerBase7();
        if (typeof mostrarToast === "function") mostrarToast(`✅ ${elegidos.length} ejercicio(s) sumado(s) desde la Base.`);
    };

    // --- 3. SELECTOR DE RUTINAS GUARDADAS EN LA BASE DE DATOS (DESDE AFUERA) ---
    window.abrirModalSelectorBaseRutinasCDM = function (modo = "cargar_en_modal", personaId = null) {
        pickerRutModo = modo;
        pickerRutPersonaId = personaId ? Number(personaId) : null;
        pickerRutSoloBiblio = true;
        pickerRutBusqueda = "";
        renderModalSelectorRutinas7();
    };

    function renderModalSelectorRutinas7() {
        const modal = asegurarModalPicker7();
        const todas = [...(typeof baseRutinas !== "undefined" ? baseRutinas : [])].filter(Boolean);
        const biblio = todas.filter(r => r.esPlantillaBiblioteca);
        const fuente = (pickerRutSoloBiblio && biblio.length > 0) ? biblio : todas;
        const q = normalizarTextoEjercicioCDM(pickerRutBusqueda);

        const filtradas = fuente.filter(r => {
            if (!q) return true;
            const txt = `${r.nombre || ""} ${r.objetivo || ""} ${r.dias || ""} ${(r.ejercicios || []).map(e => e.nombre).join(" ")}`;
            return normalizarTextoEjercicioCDM(txt).includes(q);
        });

        modal.innerHTML = `
            <div class="modal-window" style="max-width:740px;">
                <div class="modal-top">
                    <div>
                        <span class="badge badge-purple">📚 BASE DE DATOS DE RUTINAS</span>
                        <h3 style="margin-top:4px;">Elegir Rutina Guardada (${filtradas.length})</h3>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="cerrarModalPickerBase7()">✕</button>
                </div>

                <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem; flex-wrap:wrap; align-items:center;">
                    <input type="text" id="pk7BusqRut" value="${escB7(pickerRutBusqueda)}" placeholder="🔍 Buscar por nombre, objetivo o ejercicio..." style="flex:1; min-width:200px;"
                        oninput="pk7SetFiltroRut('busq', this.value)">
                    <button type="button" class="pk7-chip ${pickerRutSoloBiblio ? "active" : ""}" onclick="pk7SetFiltroRut('soloBib', true)">📚 Base (${biblio.length})</button>
                    <button type="button" class="pk7-chip ${!pickerRutSoloBiblio ? "active" : ""}" onclick="pk7SetFiltroRut('soloBib', false)">Todas (${todas.length})</button>
                </div>

                <div class="pk7-rut-list">
                    ${filtradas.length === 0 ? `
                        <div class="empty-box" style="padding:1.3rem;">
                            Todavía no hay rutinas guardadas en la Base.
                            ${typeof cargarBibliotecaBaseRutinasCDM === "function" ? `<br><button type="button" class="btn btn-primary btn-sm" style="margin-top:0.65rem;" onclick="cargarBibliotecaBaseRutinasCDM(); renderModalSelectorRutinas7Public();">✨ Cargar 7 Rutinas Base</button>` : ""}
                        </div>
                    ` : filtradas.map(r => {
                        const ejs = (r.ejercicios || []).slice(0, 4).map(e => e.nombre).join(" • ");
                        const mas = (r.ejercicios || []).length > 4 ? ` (+${r.ejercicios.length - 4})` : "";
                        return `
                            <div class="pk7-rut-card">
                                <div style="flex:1; min-width:220px;">
                                    <div style="display:flex; gap:0.3rem; flex-wrap:wrap; margin-bottom:3px;">
                                        <span class="badge ${r.esPlantillaBiblioteca ? "badge-purple" : "badge-celeste"}" style="font-size:0.65rem;">${r.esPlantillaBiblioteca ? "📚 Base" : "👤 Asignada"}</span>
                                        <span class="badge badge-ok" style="font-size:0.65rem;">${escB7(r.objetivo || "General")}</span>
                                        <span class="badge" style="font-size:0.65rem;">${(r.ejercicios || []).length} ej.</span>
                                    </div>
                                    <strong style="font-size:0.93rem;">${escB7(r.nombre)}</strong>
                                    <small style="display:block; color:var(--ink-500); margin-top:2px;">${escB7(ejs + mas)}</small>
                                </div>
                                <div style="display:flex; gap:0.35rem; flex-shrink:0; flex-wrap:wrap;">
                                    ${pickerRutModo === "ficha_persona" ? `
                                        <button type="button" class="btn btn-ok btn-sm" onclick="pk7AsignarRutinaDirectaPersona(${r.id})">✅ Asignar directa</button>
                                        <button type="button" class="btn btn-secondary btn-sm" onclick="pk7CargarRutinaEnFormulario(${r.id}, 'ficha')">✏️ Ajustar</button>
                                    ` : `
                                        <button type="button" class="btn btn-primary btn-sm" onclick="pk7CargarRutinaEnFormulario(${r.id}, 'modal')">📥 Usar esta Rutina</button>
                                    `}
                                </div>
                            </div>
                        `;
                    }).join("")}
                </div>
            </div>
        `;
        modal.classList.remove("hidden");
    }

    window.renderModalSelectorRutinas7Public = renderModalSelectorRutinas7;

    window.pk7SetFiltroRut = function (tipo, val) {
        if (tipo === "soloBib") pickerRutSoloBiblio = Boolean(val);
        else pickerRutBusqueda = val;
        renderModalSelectorRutinas7();
        if (tipo === "busq") {
            const inp = document.getElementById("pk7BusqRut");
            if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
        }
    };

    window.pk7AsignarRutinaDirectaPersona = function (idRut) {
        const origen = (baseRutinas || []).find(x => Number(x.id) === Number(idRut));
        const p = (basePersonas || []).find(x => Number(x.id) === Number(pickerRutPersonaId));
        if (!origen || !p) return;

        baseRutinas.unshift({
            ...JSON.parse(JSON.stringify(origen)),
            id: Date.now(),
            esPlantillaBiblioteca: false,
            origenPlantillaId: origen.id,
            esGrupal: false,
            personaId: p.id,
            deporteDestino: p.deporte || "Gimnasio",
            categoriaDestino: p.categoria || "General",
            etiquetaDestino: `👤 ${p.nombre} ${p.apellido}`,
            fecha: new Date().toLocaleDateString("es-AR")
        });

        guardarDatosCDM();
        cerrarModalPickerBase7();
        if (typeof renderizarRutinasJugador === "function") renderizarRutinasJugador(p);
        if (typeof mostrarToast === "function") mostrarToast(`✅ Rutina "${origen.nombre}" asignada a ${p.nombre}.`);
    };

    window.pk7CargarRutinaEnFormulario = function (idRut, destino) {
        const r = (baseRutinas || []).find(x => Number(x.id) === Number(idRut));
        if (!r) return;

        if (destino === "ficha") {
            if (document.getElementById("rutNombre")) document.getElementById("rutNombre").value = r.nombre || "";
            if (document.getElementById("rutObjetivo") && r.objetivo) document.getElementById("rutObjetivo").value = r.objetivo;
            if (document.getElementById("rutDias")) document.getElementById("rutDias").value = r.dias || "";
            if (document.getElementById("rutNotas")) document.getElementById("rutNotas").value = r.notas || "";
            const cont = document.getElementById("contenedorFilasRutinaIndividual");
            if (cont) {
                cont.innerHTML = "";
                (r.ejercicios || []).forEach(ex => {
                    if (typeof agregarFilaEjercicioIndividual === "function") agregarFilaEjercicioIndividual(ex);
                });
            }
        } else {
            if (document.getElementById("modalRutinaNombre")) document.getElementById("modalRutinaNombre").value = r.nombre || "";
            if (document.getElementById("modalRutinaObjetivo") && r.objetivo) document.getElementById("modalRutinaObjetivo").value = r.objetivo;
            if (document.getElementById("modalRutinaDias")) document.getElementById("modalRutinaDias").value = r.dias || "";
            if (document.getElementById("modalRutinaNotas")) document.getElementById("modalRutinaNotas").value = r.notas || "";
            const cont = document.getElementById("modalFilasRutinaCDM");
            if (cont) {
                cont.innerHTML = "";
                (r.ejercicios || []).forEach(ex => {
                    if (typeof agregarFilaRutinaModalCDM === "function") agregarFilaRutinaModalCDM(ex);
                });
            }
        }

        cerrarModalPickerBase7();
        if (typeof mostrarToast === "function") mostrarToast(`📥 "${r.nombre}" cargada. Podés ajustar pesos o guardarla directo.`);
    };

    // --- 4. ENGANCHES EN EL MODAL DE RUTINAS Y EN LA FICHA JUGADOR.HTML ---
    if (typeof window.abrirModalCrearRutinaCDM === "function") {
        const _origModalRut7 = window.abrirModalCrearRutinaCDM;
        window.abrirModalCrearRutinaCDM = function () {
            const res = _origModalRut7.apply(this, arguments);
            const form = document.getElementById("formModalRutinaCDM");
            if (!form) return res;

            // Botón "Elegir desde Base de Rutinas" arriba
            if (!document.getElementById("btnElegirBaseRutModal7")) {
                const topRow = form.previousElementSibling;
                if (topRow) {
                    const bRut = document.createElement("button");
                    bRut.type = "button";
                    bRut.id = "btnElegirBaseRutModal7";
                    bRut.className = "btn btn-secondary btn-sm";
                    bRut.innerHTML = "📚 Elegir de Base de Rutinas";
                    bRut.onclick = () => abrirModalSelectorBaseRutinasCDM("cargar_en_modal");
                    topRow.prepend(bRut);
                }
            }

            // Botón "Elegir desde Base de Ejercicios" junto a "+ Añadir Ejercicio"
            const btnAdd = form.querySelector('button[onclick*="agregarFilaRutinaModalCDM"]');
            if (btnAdd && !document.getElementById("btnElegirBaseEjModal7")) {
                const wrap = document.createElement("div");
                wrap.style.cssText = "display:grid; grid-template-columns:1fr 1fr; gap:0.45rem; margin-bottom:0.75rem;";
                btnAdd.style.marginBottom = "0";
                btnAdd.parentNode.insertBefore(wrap, btnAdd);

                const bEj = document.createElement("button");
                bEj.type = "button";
                bEj.id = "btnElegirBaseEjModal7";
                bEj.className = "btn btn-primary btn-sm";
                bEj.innerHTML = "🏋️ Elegir de Base de Ejercicios";
                bEj.onclick = () => abrirModalSelectorBaseEjerciciosCDM("modal_rutina");

                wrap.appendChild(bEj);
                wrap.appendChild(btnAdd);
            }

            // Casilla para guardar copia reutilizable en la Base de Rutinas
            const notasField = document.getElementById("modalRutinaNotas")?.closest(".field");
            if (notasField && !document.getElementById("chkGuardarCopiaBaseRut7")) {
                const lbl = document.createElement("label");
                lbl.style.cssText = "display:flex; align-items:center; gap:0.45rem; font-size:0.79rem; font-weight:700; margin-bottom:0.85rem; cursor:pointer;";
                lbl.innerHTML = `<input type="checkbox" id="chkGuardarCopiaBaseRut7" style="width:16px; height:16px; min-height:auto;"> 📚 Guardar también una copia reutilizable en la Base de Rutinas`;
                notasField.insertAdjacentElement("afterend", lbl);
            }
            return res;
        };
    }

    if (typeof window.guardarRutinaDesdeModalCDM === "function") {
        const _origGuardarRut7 = window.guardarRutinaDesdeModalCDM;
        window.guardarRutinaDesdeModalCDM = function (e, idEditar) {
            const guardarCopia = Boolean(document.getElementById("chkGuardarCopiaBaseRut7")?.checked);
            const tipoDest = document.getElementById("modalRutinaTipoDest")?.value || "biblioteca";
            const res = _origGuardarRut7.apply(this, arguments);

            if (guardarCopia && tipoDest !== "biblioteca" && Array.isArray(baseRutinas) && baseRutinas.length > 0) {
                const recien = baseRutinas[0];
                if (recien && !recien.esPlantillaBiblioteca) {
                    const nomNorm = normalizarTextoEjercicioCDM(recien.nombre);
                    const yaExiste = baseRutinas.some(r => r.esPlantillaBiblioteca && normalizarTextoEjercicioCDM(r.nombre) === nomNorm);
                    if (!yaExiste) {
                        baseRutinas.push({
                            ...JSON.parse(JSON.stringify(recien)),
                            id: Date.now() + 7,
                            esPlantillaBiblioteca: true,
                            esGrupal: false,
                            personaId: null,
                            deporteDestino: "",
                            categoriaDestino: "",
                            etiquetaDestino: "📚 Biblioteca"
                        });
                        guardarDatosCDM();
                    }
                }
            }
            return res;
        };
    }

    function inyectarBotonesBaseEnFichaJugador7() {
        if (document.body?.dataset?.page !== "perfil-individual") return;
        const form = document.getElementById("formRutinaIndividual");
        if (!form) return;

        // 1. Botón "Elegir de Base de Rutinas" arriba del formulario en jugador.html
        if (!document.getElementById("btnBaseRutFicha7")) {
            const bar = document.createElement("div");
            bar.style.cssText = "display:flex; gap:0.4rem; flex-wrap:wrap; margin-bottom:0.75rem;";
            bar.innerHTML = `
                <button type="button" id="btnBaseRutFicha7" class="btn btn-primary btn-sm" style="flex:1;" onclick="abrirModalSelectorBaseRutinasCDM('ficha_persona', obtenerJugadorActualPorURL()?.id)">📚 Elegir de Base de Rutinas</button>
                <button type="button" id="btnBaseEjFicha7" class="btn btn-secondary btn-sm" style="flex:1;" onclick="abrirModalSelectorBaseEjerciciosCDM('ficha_individual')">🏋️ Elegir de Base de Ejercicios</button>
            `;
            form.prepend(bar);
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        inyectarBotonesBaseEnFichaJugador7();
        setTimeout(inyectarBotonesBaseEnFichaJugador7, 400);
    });
})();