/**
 * server.js - Servidor Backend Oficial Multi-Club, Multi-Gimnasio & Consultorios (SaaS Suite)
 * Arquitectura Node.js + Express + Mongoose (Base de Datos 100% Aislada) + Respaldo Local en Disco
 * Desarrollado por Gonzalo Adanchú
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================================================
// 1. CONEXIÓN AISLADA A MONGODB
// ============================================================================

const PORT = process.env.PORT || 3000;
const CDM_MONGO_URI = process.env.CDM_MONGO_URI || 'mongodb://127.0.0.1:27017/cdm_adelia_maria_oficial_db';
const ARCHIVO_RESPALDO_DISCO = path.join(__dirname, 'cdm_datos_servidor.json');
const CLAVE_CLUB_POR_DEFECTO = 'cdm_adelia_maria_principal';

let mongoConectado = false;
let CdmStateModel = null;

const cdmClubStateSchema = new mongoose.Schema({
    claveClub: { type: String, default: CLAVE_CLUB_POR_DEFECTO, unique: true, index: true },
    ultimaActualizacionISO: { type: String, default: () => new Date().toISOString() },
    personas: { type: Array, default: [] },
    rutinas: { type: Array, default: [] },
    partidos: { type: Array, default: [] },
    alineaciones: { type: Object, default: {} },
    microciclos: { type: Object, default: {} },
    videoteca: { type: Array, default: [] },
    catalogoEjercicios: { type: Array, default: [] },
    consultorio: { type: Object, default: () => ({ pacientes: [], turnos: [], mutuales: [], profesionales: [], sesiones: [] }) },
    licenciaConfig: { type: Object, default: {} }
}, {
    timestamps: true,
    minimize: false,
    collection: 'cdm_estado_maestro_v1'
});

const cdmConnection = mongoose.createConnection(CDM_MONGO_URI, {
    serverSelectionTimeoutMS: 3000
});

cdmConnection.on('connected', () => {
    mongoConectado = true;
    CdmStateModel = cdmConnection.model('CdmClubState', cdmClubStateSchema);
    console.log('✅ Base de datos Mongoose AISLADA conectada: cdm_adelia_maria_oficial_db (Multi-Cliente)');
    inicializarEstadoEnMongoSiVacio();
});

cdmConnection.on('error', () => {
    mongoConectado = false;
});

// ============================================================================
// 2. MOTOR DE PERSISTENCIA MULTI-CLIENTE (MONGOOSE + JSON EN DISCO)
// ============================================================================

function crearEstadoVacioClub(claveClub = CLAVE_CLUB_POR_DEFECTO, licenciaInicial = {}) {
    return {
        claveClub,
        ultimaActualizacionISO: new Date().toISOString(),
        personas: [],
        rutinas: [],
        partidos: [],
        alineaciones: {},
        microciclos: {},
        videoteca: [],
        catalogoEjercicios: [],
        consultorio: { pacientes: [], turnos: [], mutuales: [], profesionales: [], sesiones: [] },
        licenciaConfig: {
            claveClub,
            nombreEntidad: licenciaInicial.nombreEntidad || 'Club Deportivo Municipal',
            subtituloEntidad: licenciaInicial.subtituloEntidad || 'Adelia María',
            siglaCodigo: (licenciaInicial.siglaCodigo || 'CDM').toUpperCase(),
            logoUrl: licenciaInicial.logoUrl || '/img/logo.png',
            planActivo: licenciaInicial.planActivo || 'completo',
            modulos: licenciaInicial.modulos || { futbol: true, hockey: true, gym: true },
            deportesExtra: Array.isArray(licenciaInicial.deportesExtra) ? licenciaInicial.deportesExtra : [],
            profesionesHabilitadas: Array.isArray(licenciaInicial.profesionesHabilitadas) ? licenciaInicial.profesionesHabilitadas : [],
            adminUsuario: (licenciaInicial.adminUsuario || 'cdm').toLowerCase(),
            adminClave: licenciaInicial.adminClave || 'cdm2026',
            estadoServicio: licenciaInicial.estadoServicio || 'activo'
        }
    };
}

function leerMapaClubesDesdeDisco() {
    try {
        if (fs.existsSync(ARCHIVO_RESPALDO_DISCO)) {
            const raw = fs.readFileSync(ARCHIVO_RESPALDO_DISCO, 'utf8');
            const parsed = JSON.parse(raw);
            if (parsed && parsed.clubes && typeof parsed.clubes === 'object') {
                return parsed.clubes;
            }
            if (parsed && (Array.isArray(parsed.personas) || parsed.claveClub)) {
                const clave = parsed.claveClub || CLAVE_CLUB_POR_DEFECTO;
                return { [clave]: parsed };
            }
        }
    } catch (e) {
        console.error('⚠️ Error leyendo respaldo en disco:', e.message);
    }
    return {
        [CLAVE_CLUB_POR_DEFECTO]: crearEstadoVacioClub(CLAVE_CLUB_POR_DEFECTO)
    };
}

function guardarMapaClubesEnDisco(mapaClubes) {
    try {
        const principal = mapaClubes[CLAVE_CLUB_POR_DEFECTO] || Object.values(mapaClubes)[0] || crearEstadoVacioClub();
        const contenedor = { ...principal, clubes: mapaClubes };
        fs.writeFileSync(ARCHIVO_RESPALDO_DISCO, JSON.stringify(contenedor, null, 2), 'utf8');
    } catch (e) {
        console.error('⚠️ Error guardando respaldo en disco:', e.message);
    }
}

async function inicializarEstadoEnMongoSiVacio() {
    if (!mongoConectado || !CdmStateModel) return;
    try {
        const mapaDisco = leerMapaClubesDesdeDisco();
        for (const [clave, datosClub] of Object.entries(mapaDisco)) {
            const existe = await CdmStateModel.findOne({ claveClub: clave }).lean();
            if (!existe) {
                await CdmStateModel.findOneAndUpdate(
                    { claveClub: clave },
                    { ...datosClub, claveClub: clave },
                    { upsert: true, new: true }
                );
            }
        }
    } catch (e) {
        console.error('⚠️ Error inicializando documentos en Mongo:', e.message);
    }
}

async function obtenerTodosLosClubes() {
    const mapaDisco = leerMapaClubesDesdeDisco();
    if (mongoConectado && CdmStateModel) {
        try {
            const docs = await CdmStateModel.find({}).lean();
            docs.forEach(d => {
                if (d && d.claveClub) mapaDisco[d.claveClub] = d;
            });
        } catch (e) {
            console.error('⚠️ Error listando clubes en Mongo:', e.message);
        }
    }
    return mapaDisco;
}

async function obtenerEstadoMaestroClub(claveClub = CLAVE_CLUB_POR_DEFECTO) {
    const clave = String(claveClub || CLAVE_CLUB_POR_DEFECTO).trim();
    if (mongoConectado && CdmStateModel) {
        try {
            const doc = await CdmStateModel.findOne({ claveClub: clave }).lean();
            if (doc) return doc;
        } catch (e) {
            console.error('⚠️ Lectura Mongo falló, usando respaldo en disco:', e.message);
        }
    }
    const mapa = leerMapaClubesDesdeDisco();
    if (!mapa[clave]) {
        mapa[clave] = crearEstadoVacioClub(clave);
        guardarMapaClubesEnDisco(mapa);
    }
    return mapa[clave];
}

async function guardarEstadoMaestroClub(nuevoEstado, claveClubParam = null) {
    const clave = String(claveClubParam || nuevoEstado.claveClub || nuevoEstado.licenciaConfig?.claveClub || CLAVE_CLUB_POR_DEFECTO).trim();
    const mapa = leerMapaClubesDesdeDisco();
    const previo = mapa[clave] || crearEstadoVacioClub(clave);

    const payload = {
        claveClub: clave,
        ultimaActualizacionISO: new Date().toISOString(),
        personas: Array.isArray(nuevoEstado.personas) ? nuevoEstado.personas : (previo.personas || []),
        rutinas: Array.isArray(nuevoEstado.rutinas) ? nuevoEstado.rutinas : (previo.rutinas || []),
        partidos: Array.isArray(nuevoEstado.partidos) ? nuevoEstado.partidos : (previo.partidos || []),
        alineaciones: nuevoEstado.alineaciones && typeof nuevoEstado.alineaciones === 'object' ? nuevoEstado.alineaciones : (previo.alineaciones || {}),
        microciclos: nuevoEstado.microciclos && typeof nuevoEstado.microciclos === 'object' ? nuevoEstado.microciclos : (previo.microciclos || {}),
        videoteca: Array.isArray(nuevoEstado.videoteca) ? nuevoEstado.videoteca : (previo.videoteca || []),
        catalogoEjercicios: Array.isArray(nuevoEstado.catalogoEjercicios) ? nuevoEstado.catalogoEjercicios : (previo.catalogoEjercicios || []),
        consultorio: nuevoEstado.consultorio && typeof nuevoEstado.consultorio === 'object'
            ? nuevoEstado.consultorio
            : (previo.consultorio || { pacientes: [], turnos: [], mutuales: [], profesionales: [], sesiones: [] }),
        licenciaConfig: nuevoEstado.licenciaConfig && typeof nuevoEstado.licenciaConfig === 'object' && Object.keys(nuevoEstado.licenciaConfig).length > 0
            ? { ...previo.licenciaConfig, ...nuevoEstado.licenciaConfig, claveClub: clave }
            : (previo.licenciaConfig || {})
    };

    mapa[clave] = payload;
    guardarMapaClubesEnDisco(mapa);

    if (mongoConectado && CdmStateModel) {
        try {
            await CdmStateModel.findOneAndUpdate(
                { claveClub: clave },
                payload,
                { upsert: true, new: true }
            );
        } catch (e) {
            console.error('⚠️ Error guardando en MongoDB:', e.message);
        }
    }
    return payload;
}

function resumirListaClubes(mapaClubes) {
    return Object.values(mapaClubes).map(c => {
        const cantDep = Array.isArray(c.personas) ? c.personas.filter(p => p && p.activo).length : 0;
        const cantPac = Array.isArray(c.consultorio?.pacientes) ? c.consultorio.pacientes.length : 0;
        return {
            claveClub: c.claveClub,
            ultimaActualizacionISO: c.ultimaActualizacionISO,
            cantidadPersonas: cantDep + cantPac,
            cantidadPacientes: cantPac,
            licenciaConfig: c.licenciaConfig || {}
        };
    });
}

// ============================================================================
// 3. RUTAS API REST DE SINCRONIZACIÓN Y MULTI-CLIENTE
// ============================================================================

app.get('/api/cdm/estado', async (req, res) => {
    try {
        const clave = req.query.club || CLAVE_CLUB_POR_DEFECTO;
        const estado = await obtenerEstadoMaestroClub(clave);
        const todos = await obtenerTodosLosClubes();
        res.json({
            ok: true,
            motor: mongoConectado ? 'mongoose_cdm_adelia_maria_oficial_db' : 'json_disco_local',
            estado,
            clubes: resumirListaClubes(todos)
        });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.post('/api/cdm/estado', async (req, res) => {
    try {
        const clave = req.body?.claveClub || req.query.club || CLAVE_CLUB_POR_DEFECTO;
        const guardado = await guardarEstadoMaestroClub(req.body || {}, clave);
        res.json({
            ok: true,
            claveClub: guardado.claveClub,
            motor: mongoConectado ? 'mongoose_cdm_adelia_maria_oficial_db' : 'json_disco_local',
            ultimaActualizacionISO: guardado.ultimaActualizacionISO
        });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.get('/api/cdm/clubes', async (req, res) => {
    try {
        const todos = await obtenerTodosLosClubes();
        res.json({ ok: true, clubes: resumirListaClubes(todos) });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.post('/api/cdm/clubes/nuevo', async (req, res) => {
    try {
        const lic = req.body?.licenciaConfig || req.body || {};
        const rawSlug = String(lic.claveClub || lic.nombreEntidad || ('cliente_' + Date.now()))
            .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        const claveNueva = rawSlug || ('cliente_' + Date.now());

        const estadoInicial = crearEstadoVacioClub(claveNueva, { ...lic, claveClub: claveNueva });
        const guardado = await guardarEstadoMaestroClub(estadoInicial, claveNueva);
        const todos = await obtenerTodosLosClubes();
        res.json({ ok: true, claveClub: claveNueva, estado: guardado, clubes: resumirListaClubes(todos) });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.delete('/api/cdm/clubes/:claveClub', async (req, res) => {
    try {
        const clave = String(req.params.claveClub || '').trim();
        if (!clave || clave === CLAVE_CLUB_POR_DEFECTO) {
            return res.status(400).json({ ok: false, error: 'No se puede eliminar la cuenta principal por defecto.' });
        }
        const mapa = leerMapaClubesDesdeDisco();
        delete mapa[clave];
        guardarMapaClubesEnDisco(mapa);
        if (mongoConectado && CdmStateModel) {
            await CdmStateModel.deleteOne({ claveClub: clave });
        }
        const todos = await obtenerTodosLosClubes();
        res.json({ ok: true, clubes: resumirListaClubes(todos) });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.post('/api/cdm/jugador/:id/sync', async (req, res) => {
    try {
        const idJugador = Number(req.params.id);
        const { personaActualizada, catalogoEjercicios, claveClub } = req.body || {};
        const estadoActual = await obtenerEstadoMaestroClub(claveClub || req.query.club || CLAVE_CLUB_POR_DEFECTO);

        if (personaActualizada && idJugador) {
            const idx = (estadoActual.personas || []).findIndex(p => Number(p.id) === idJugador);
            if (idx !== -1) {
                const existente = estadoActual.personas[idx];
                existente.peso = personaActualizada.peso ?? existente.peso;
                existente.foto = personaActualizada.foto !== undefined ? personaActualizada.foto : existente.foto;
                existente.evaluaciones = Array.isArray(personaActualizada.evaluaciones) ? personaActualizada.evaluaciones : existente.evaluaciones;
                existente.clinico = Array.isArray(personaActualizada.clinico) ? personaActualizada.clinico : existente.clinico;
                estadoActual.personas[idx] = existente;
            }
        }
        if (Array.isArray(catalogoEjercicios) && catalogoEjercicios.length > 0) {
            estadoActual.catalogoEjercicios = catalogoEjercicios;
        }
        const guardado = await guardarEstadoMaestroClub(estadoActual, estadoActual.claveClub);
        res.json({ ok: true, ultimaActualizacionISO: guardado.ultimaActualizacionISO });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// Subida segura de estudios/datos desde el Portal del Paciente (solo si el profesional lo habilitó)
app.post('/api/cdm/paciente/:id/estudio', async (req, res) => {
    try {
        const idPac = Number(req.params.id);
        const { claveClub, estudio } = req.body || {};
        if (!idPac || !estudio || !estudio.titulo) {
            return res.status(400).json({ ok: false, error: 'Datos incompletos.' });
        }

        const estadoActual = await obtenerEstadoMaestroClub(claveClub || CLAVE_CLUB_POR_DEFECTO);
        const pacs = estadoActual.consultorio?.pacientes || [];
        const pac = pacs.find(p => Number(p.id) === idPac);
        if (!pac) return res.status(404).json({ ok: false, error: 'Paciente no encontrado.' });
        if (!pac.puedeSubirEstudios) {
            return res.status(403).json({ ok: false, error: 'El profesional no habilitó la subida de archivos para este paciente.' });
        }

        if (!Array.isArray(pac.estudios)) pac.estudios = [];
        pac.estudios.unshift({
            id: estudio.id || Date.now(),
            titulo: String(estudio.titulo).trim(),
            fecha: estudio.fecha || new Date().toISOString().split('T')[0],
            url: estudio.url || '',
            archivoDataUrl: estudio.archivoDataUrl || '',
            archivoNombre: estudio.archivoNombre || '',
            nota: String(estudio.nota || '').trim(),
            subidoPor: 'paciente'
        });

        await guardarEstadoMaestroClub(estadoActual, estadoActual.claveClub);
        res.json({ ok: true, estudios: pac.estudios });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.post('/api/cdm/auth-admin', async (req, res) => {
    try {
        const usuario = String(req.body?.usuario || '').trim().toLowerCase();
        const clave = String(req.body?.clave || '').trim();
        const clubPreferido = req.body?.claveClub || '';
        const todos = await obtenerTodosLosClubes();

        const lista = Object.values(todos);
        if (clubPreferido && todos[clubPreferido]) {
            lista.sort((a, b) => (a.claveClub === clubPreferido ? -1 : b.claveClub === clubPreferido ? 1 : 0));
        }

        const match = lista.find(c => {
            const u = String(c.licenciaConfig?.adminUsuario || 'cdm').toLowerCase();
            const p = String(c.licenciaConfig?.adminClave || 'cdm2026');
            const esCdmPrincipal = c.claveClub === CLAVE_CLUB_POR_DEFECTO;
            const coincideUsuario = (u === usuario) || (esCdmPrincipal && (usuario === 'cdm' || usuario === 'admin') && (u === 'cdm' || u === 'admin'));
            return coincideUsuario && p === clave;
        });

        if (!match) return res.status(401).json({ ok: false, mensaje: 'Usuario o contraseña incorrectos.' });
        if (match.licenciaConfig?.estadoServicio === 'suspendido') {
            return res.status(403).json({ ok: false, suspendido: true, mensaje: '⚠️ Suscripción mensual en pausa. Contactá al desarrollador Gonzalo Adanchú para reactivar el servicio.' });
        }
        res.json({ ok: true, claveClub: match.claveClub, estado: match, clubes: resumirListaClubes(todos) });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// Validar código personal: soporta Deportistas/Socios (CDM-XXXX) Y Pacientes de Consultorio (PAC-XXXX)
app.post('/api/cdm/auth-codigo', async (req, res) => {
    try {
        const rawInput = String(req.body?.codigo || '').trim().toUpperCase();
        const limpioInput = rawInput.replace(/[^A-Z0-9]/g, '');
        const soloNumeros = rawInput.replace(/\D/g, '');
        const clubPreferido = req.body?.claveClub || '';
        const todos = await obtenerTodosLosClubes();

        const listaClubes = Object.values(todos);
        if (clubPreferido && todos[clubPreferido]) {
            listaClubes.sort((a, b) => (a.claveClub === clubPreferido ? -1 : b.claveClub === clubPreferido ? 1 : 0));
        }

        for (const estadoClub of listaClubes) {
            // 1. Buscar primero en Pacientes del Consultorio (PAC-XXXX)
            const pacs = Array.isArray(estadoClub.consultorio?.pacientes) ? estadoClub.consultorio.pacientes : [];
            const pacHit = pacs.find(p => {
                if (!p) return false;
                const codP = String(p.codigoAcceso || `PAC-${p.id}`).toUpperCase();
                const codPLimpio = codP.replace(/[^A-Z0-9]/g, '');
                const dniP = String(p.dni || '').replace(/\D/g, '');
                return codP === rawInput || codPLimpio === limpioInput || (soloNumeros.length >= 7 && dniP === soloNumeros);
            });
            if (pacHit) {
                return res.json({
                    ok: true,
                    esPacienteConsultorio: true,
                    claveClub: estadoClub.claveClub,
                    paciente: pacHit,
                    estado: estadoClub
                });
            }

            // 2. Buscar en Deportistas / Socios de Club y Gimnasio
            const siglaClub = String(estadoClub.licenciaConfig?.siglaCodigo || 'CDM').toUpperCase();
            const encontrado = (estadoClub.personas || []).find(p => {
                if (!p || !p.activo || !p.codigoAcceso) return false;
                const codCompleto = String(p.codigoAcceso).toUpperCase();
                const codLimpio = codCompleto.replace(/[^A-Z0-9]/g, '');
                const soloSufijo = codCompleto.replace(`${siglaClub}-`, '').replace('CDM-', '');
                return codCompleto === rawInput || codLimpio === limpioInput || soloSufijo === rawInput;
            });
            if (encontrado) {
                return res.json({
                    ok: true,
                    esPacienteConsultorio: false,
                    claveClub: estadoClub.claveClub,
                    persona: encontrado,
                    estado: estadoClub
                });
            }
        }

        return res.status(404).json({ ok: false, mensaje: 'Código inválido o inactivo.' });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// ============================================================================
// 4. SERVIR FRONTEND Y ARRANCAR SERVIDOR
// ============================================================================

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor Oficial Multi-Cliente activo en: http://localhost:${PORT}`);
    console.log(`📦 Base Mongoose aislada: ${CDM_MONGO_URI}`);
});

module.exports = { app, cdmConnection };