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
                    <td><button type="button" class="check-btn ${pres ? "checked" : ""}" onclick="toggleAsistenciaPersona(${p.id}, '${fecha}')">✓</button></td>
                    <td><strong style="cursor:pointer; color:var(--cdm-600);" onclick="irAPaginaIndividual(${p.id})">${p.apellido}, ${p.nombre}</strong><br><small style="color:var(--ink-500)">DNI ${p.dni} • 🔑 ${p.codigoAcceso}</small></td>
                    <td><span class="badge badge-celeste">${p.puesto}</span></td>
                    <td><span class="badge ${fue < pac ? "badge-warn" : "badge-ok"}">${fue}/${pac} días</span></td>
                    <td><span class="badge ${alDia ? "badge-ok" : "badge-danger"}">${alDia ? "💳 Al Día" : "⚠️ Debe"} ($${Number(p.montoCuota || 25000).toLocaleString("es-AR")})</span></td>
                    <td>
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

// =========================================================================
// 5. CONSTRUCTOR DE RUTINAS ADMIN + WHATSAPP (USADO EN GYM Y DEPORTES)
// =========================================================================

function poblarSelectsAdminRutinasGym() {
    const selC = document.getElementById("adminRutinaPersonaSelect"), selF = document.getElementById("filtroPersonaRutinasAdmin");
    if (!selC || !selF) return;
    const prevC = selC.value, prevF = selF.value;
    const CATS = ["Sub 13", "Sub 15", "Sub 17", "Reserva", "Primera"];
    let html = "";

    if (deportePagina && deportePagina !== "Gimnasio") {
        html += `<optgroup label="👥 Categoría (${deportePagina})">${CATS.map(c => `<option value="CAT|${deportePagina}|${c}" ${c === categoriaActiva ? "selected" : ""}>🏟️ Todo ${deportePagina} ${c}</option>`).join("")}</optgroup>`;
        const jug = obtenerPersonasFiltradasDeporte(true);
        html += `<optgroup label="👤 Jugador">${jug.map(p => `<option value="${p.id}">👤 ${p.apellido}, ${p.nombre}</option>`).join("")}</optgroup>`;
        selC.innerHTML = html;
        selF.innerHTML = `<option value="TODAS">Todas las rutinas</option>` + jug.map(p => `<option value="${p.id}">👤 ${p.apellido}, ${p.nombre}</option>`).join("");
    } else {
        const soc = basePersonas.filter(p => p.deporte === "Gimnasio" && p.activo);
        html += `<optgroup label="👤 Socios Gym">${soc.map(p => `<option value="${p.id}">👤 ${p.apellido}, ${p.nombre}</option>`).join("")}</optgroup><optgroup label="🏋️ Grupal"><option value="CAT|Gimnasio|General">🏋️ Pizarra General Gym</option></optgroup>`;
        selC.innerHTML = html;
        selF.innerHTML = `<option value="TODAS">Todas las rutinas</option>` + soc.map(p => `<option value="${p.id}">👤 ${p.apellido}, ${p.nombre}</option>`).join("");
    }
    if (prevC) selC.value = prevC;
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
            <div class="field" style="flex:1;"><input type="text" class="ag-nombre" list="listaEjerciciosGymAdmin" required placeholder="Nombre del ejercicio" value="${datos?.nombre || ""}"></div>
            <button type="button" class="btn btn-danger btn-sm ex-builder-del" onclick="this.closest('.ex-builder-row').remove()">✕</button>
        </div>
        <div class="ex-builder-metrics-grid">
            <div class="field"><label>Series</label><input type="number" class="ag-series" required min="1" value="${datos?.series || 4}"></div>
            <div class="field"><label>Reps</label><input type="text" class="ag-reps" required value="${datos?.reps || "8-10"}"></div>
            <div class="field"><label>Carga</label><input type="text" class="ag-peso" value="${datos?.peso || ""}"></div>
            <div class="field"><label>Pausa</label><input type="text" class="ag-pausa" value="${datos?.pausa || "90s"}"></div>
        </div>
        <div class="field" style="margin-top:0.4rem;"><input type="text" class="ag-forma" placeholder="💡 Indicación técnica..." value="${datos?.forma || ""}"></div>
    `;
    cont.appendChild(div);
}

function cargarPlantillaAdminGym(tipo) {
    const cont = document.getElementById("contenedorFilasAdminGym");
    if (!cont) return;
    cont.innerHTML = "";
    if (tipo === "hipertrofia") {
        document.getElementById("adminRutinaNombre").value = "Tren Superior - Hipertrofia";
        agregarFilaRutinaAdminGym({ nombre: "Press de Banca Plano", series: 4, reps: "8", peso: "Pesado", pausa: "2m" });
        agregarFilaRutinaAdminGym({ nombre: "Dominadas / Jalón al Pecho en Polea", series: 4, reps: "8-10", peso: "Moderado", pausa: "90s" });
    } else if (tipo === "piernas") {
        document.getElementById("adminRutinaNombre").value = "Tren Inferior - Fuerza y Potencia";
        agregarFilaRutinaAdminGym({ nombre: "Sentadilla Trasera con Barra", series: 4, reps: "5", peso: "80% 1RM", pausa: "2m" });
        agregarFilaRutinaAdminGym({ nombre: "Peso Muerto Rumano (Isquios y Glúteos)", series: 4, reps: "8", peso: "Controlado", pausa: "90s" });
    } else {
        document.getElementById("adminRutinaNombre").value = "Funcional, Core y Preventivo";
        agregarFilaRutinaAdminGym({ nombre: "Plancha Abdominal RKC y Core", series: 4, reps: "35s", peso: "Corporal", pausa: "45s" });
        agregarFilaRutinaAdminGym({ nombre: "Hip Thrust con Barra (Empuje de Cadera)", series: 3, reps: "12", peso: "Moderado", pausa: "60s" });
    }
}

function guardarRutinaDesdeAdminGym(e) {
    e.preventDefault();
    const val = document.getElementById("adminRutinaPersonaSelect")?.value;
    const filas = document.querySelectorAll("#contenedorFilasAdminGym .ex-builder-row");
    if (!val || !filas.length) return;
    const ejercicios = Array.from(filas).map(f => {
        const nom = f.querySelector(".ag-nombre").value.trim();
        agregarEjercicioInventadoAlCatalogoCDM(nom, "fuerza_kg", true);
        return { nombre: nom, series: f.querySelector(".ag-series").value, reps: f.querySelector(".ag-reps").value.trim(), peso: f.querySelector(".ag-peso").value.trim() || "A ajustar", pausa: f.querySelector(".ag-pausa").value.trim(), forma: f.querySelector(".ag-forma").value.trim() };
    });

    const base = { id: Date.now(), fecha: new Date().toLocaleDateString("es-AR"), nombre: document.getElementById("adminRutinaNombre").value.trim(), objetivo: document.getElementById("adminRutinaObjetivo").value, dias: document.getElementById("adminRutinaDias").value.trim() || "Semanal", notas: document.getElementById("adminRutinaNotas").value.trim(), ejercicios };
    if (val.startsWith("CAT|")) {
        const [, dep, cat] = val.split("|");
        baseRutinas.unshift({ ...base, esGrupal: true, deporteDestino: dep, categoriaDestino: cat, personaId: null, etiquetaDestino: dep === "Gimnasio" ? "🏋️ Pizarra General Gym" : `🏟️ ${dep} ${cat}` });
    } else {
        const p = basePersonas.find(x => Number(x.id) === parseInt(val, 10));
        if (!p) return;
        baseRutinas.unshift({ ...base, esGrupal: false, deporteDestino: p.deporte, categoriaDestino: p.categoria, personaId: p.id, etiquetaDestino: `👤 ${p.nombre} ${p.apellido}` });
    }
    guardarDatosCDM();
    e.target.reset();
    document.getElementById("contenedorFilasAdminGym").innerHTML = "";
    agregarFilaRutinaAdminGym();
    mostrarToast("✓ Rutina guardada.");
    renderizarPaginaDeporte();
}

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
                    <span class="routine-dest-badge">${r.etiquetaDestino || "Plan"}</span>
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

function renderizarListaRutinasAdminGym() {
    const cont = document.getElementById("contenedorTarjetasRutinasAdminGym");
    if (!cont) return;
    cont.className = "routines-pro-grid";
    const fId = document.getElementById("filtroPersonaRutinasAdmin")?.value || "TODAS";
    let lista = [...baseRutinas];
    if (deportePagina && deportePagina !== "Gimnasio") lista = lista.filter(r => r.deporteDestino === deportePagina && r.categoriaDestino === categoriaActiva);
    else if (deportePagina === "Gimnasio") lista = lista.filter(r => r.deporteDestino === "Gimnasio");
    if (fId !== "TODAS") lista = lista.filter(r => String(r.personaId) === String(fId) || r.esGrupal);
    cont.innerHTML = lista.length ? lista.map(r => renderTarjetaRutinaProAdmin(r)).join("") : `<div class="empty-box" style="grid-column:1/-1;">Sin rutinas cargadas todavía.</div>`;
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
    if (r) navigator.clipboard.writeText(armarMensajeWhatsAppRutina(r, r.etiquetaDestino || "Deportista")).then(() => mostrarToast("📋 Rutina copiada."));
}

function enviarWhatsAppRutinaDirecto(idR) {
    const r = baseRutinas.find(x => Number(x.id) === Number(idR));
    if (!r) return;
    const p = r.personaId ? basePersonas.find(x => Number(x.id) === Number(r.personaId)) : null;
    const tel = p ? String(p.whatsapp || "").replace(/\D/g, "") : "";
    const msg = armarMensajeWhatsAppRutina(r, p ? `${p.nombre} ${p.apellido}` : (r.etiquetaDestino || "Plantel"));
    window.open(tel ? `https://wa.me/${tel}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
}

function borrarRutinaGlobal(idR) {
    if (!confirm("🗑️ ¿Eliminar esta rutina?")) return;
    baseRutinas = baseRutinas.filter(x => Number(x.id) !== Number(idR));
    guardarDatosCDM();
    refrescarVistasActivasCDM();
}

document.addEventListener("DOMContentLoaded", () => {
    asegurarVideotecaCargada();
    if (deportePagina === "Gimnasio") {
        const cont = document.getElementById("contenedorFilasAdminGym");
        if (cont && cont.children.length === 0) agregarFilaRutinaAdminGym();
    }
});