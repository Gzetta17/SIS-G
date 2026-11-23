/**
 * server.js - Servidor Backend Oficial Multi-Club, Multi-Gimnasio & Consultorios (SaaS Suite)
 * Incluye control de Demos por fecha, Sub-Administradores con permisos granulares, Auditoría y Persistencia Consultorio
 * Desarrollado por Gonzalo Adanchú
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================================================
// 1. CONEXIÓN AISLADA A MONGODB ATLAS / LOCAL
// ============================================================================

const PORT = process.env.PORT || 3000;
const CDM_MONGO_URI = process.env.CDM_MONGO_URI || 'mongodb://127.0.0.1:27017/cdm_pro_suite_db';
const ARCHIVO_RESPALDO_DISCO = path.join(__dirname, 'cdm_datos_servidor.json');
const CLAVE_CLUB_POR_DEFECTO = 'cdm_adelia_maria_principal';
const USUARIOS_RESERVADOS_SUPERADMIN = ['gonzalo', 'superadmin'];

let mongoConectado = false;

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
    licenciaConfig: { type: Object, default: {} },
    subAdmins: { type: Array, default: [] },
    auditoria: { type: Array, default: [] }
}, {
    timestamps: true,
    minimize: false,
    collection: 'cdm_estado_maestro_v1'
});

const cdmConnection = mongoose.createConnection(CDM_MONGO_URI, {
    serverSelectionTimeoutMS: 8000
});

const CdmStateModel = cdmConnection.model('CdmClubState', cdmClubStateSchema);

cdmConnection.on('connected', () => {
    mongoConectado = true;
    console.log('✅ MongoDB AISLADO conectado:', cdmConnection.name);
    inicializarEstadoEnMongoSiVacio();
});

cdmConnection.on('reconnected', () => {
    mongoConectado = true;
    console.log('🔄 MongoDB reconectado:', cdmConnection.name);
});

cdmConnection.on('disconnected', () => {
    mongoConectado = false;
    console.warn('⚠️ MongoDB desconectado.');
});

cdmConnection.on('error', (err) => {
    mongoConectado = false;
    console.error('⚠️ Error conexión MongoDB (usando respaldo local):', err.message);
});

async function asegurarConexionMongo() {
    if (cdmConnection.readyState === 1) {
        mongoConectado = true;
        return true;
    }
    try {
        if (cdmConnection.readyState === 2) {
            await cdmConnection.asPromise();
        } else {
            await cdmConnection.openUri(CDM_MONGO_URI, { serverSelectionTimeoutMS: 8000 });
        }
    } catch (err) {
        console.error('❌ No se pudo reconectar a MongoDB:', err.message);
    }
    mongoConectado = cdmConnection.readyState === 1;
    return mongoConectado;
}

// ============================================================================
// 2. HELPERS DE SEGURIDAD (HASH SCRYPT), DEMOS Y PERSISTENCIA MULTI-CLIENTE
// ============================================================================

function hashearClaveStaff(clavePlana) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(String(clavePlana || ''), salt, 64).toString('hex');
    return `scrypt:${salt}:${hash}`;
}

function verificarClaveStaff(claveIngresada, staffObj) {
    if (!staffObj) return false;
    const guardada = String(staffObj.claveHash || staffObj.clave || '');
    if (!guardada) return false;

    if (guardada.startsWith('scrypt:')) {
        const partes = guardada.split(':');
        if (partes.length !== 3) return false;
        const [, salt, hashHex] = partes;
        const hashCalc = crypto.scryptSync(String(claveIngresada || ''), salt, 64);
        const hashOrig = Buffer.from(hashHex, 'hex');
        if (hashCalc.length !== hashOrig.length) return false;
        return crypto.timingSafeEqual(hashCalc, hashOrig);
    }
    return guardada === String(claveIngresada || '');
}

function sanitizarStaffPublico(sa) {
    if (!sa) return null;
    return {
        id: sa.id,
        nombre: sa.nombre || '',
        usuario: sa.usuario || '',
        rolPlantilla: sa.rolPlantilla || 'personalizado',
        activo: sa.activo !== false,
        alcance: sa.alcance || { modulos: ['todos'], categorias: ['todas'] },
        permisos: sa.permisos || {},
        creadoISO: sa.creadoISO || new Date().toISOString()
    };
}

function obtenerHoyAR() {
    try {
        return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
    } catch {
        return new Date().toISOString().split('T')[0];
    }
}

function formatearFechaAR(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
}

function estaDemoVencida(lic) {
    const vence = String(lic?.fechaVencimientoDemo || '').trim();
    if (!vence || !/^\d{4}-\d{2}-\d{2}$/.test(vence)) return false;
    return obtenerHoyAR() > vence;
}

function tieneDatosConsultorio(cons) {
    if (!cons || typeof cons !== 'object') return false;
    return (
        (Array.isArray(cons.pacientes) && cons.pacientes.length > 0) ||
        (Array.isArray(cons.turnos) && cons.turnos.length > 0) ||
        (Array.isArray(cons.sesiones) && cons.sesiones.length > 0) ||
        (Array.isArray(cons.profesionales) && cons.profesionales.length > 0)
    );
}

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
        subAdmins: [],
        auditoria: [],
        licenciaConfig: {
            claveClub,
            nombreEntidad: licenciaInicial.nombreEntidad || 'Club Deportivo Municipal',
            subtituloEntidad: licenciaInicial.subtituloEntidad || 'Adelia María',
            siglaCodigo: (licenciaInicial.siglaCodigo || 'CDM').toUpperCase(),
            logoUrl: licenciaInicial.logoUrl !== undefined ? licenciaInicial.logoUrl : '/img/logo.png',
            planActivo: licenciaInicial.planActivo || 'completo',
            modulos: licenciaInicial.modulos || { futbol: true, hockey: true, gym: true },
            deportesExtra: Array.isArray(licenciaInicial.deportesExtra) ? licenciaInicial.deportesExtra : [],
            profesionesHabilitadas: Array.isArray(licenciaInicial.profesionesHabilitadas) ? licenciaInicial.profesionesHabilitadas : [],
            funciones: licenciaInicial.funciones || undefined,
            modoComplejidad: licenciaInicial.modoComplejidad || 'simple',
            bloquearCobranza: Boolean(licenciaInicial.bloquearCobranza),
            aliasTransferencia: licenciaInicial.aliasTransferencia || '',
            titularTransferencia: licenciaInicial.titularTransferencia || '',
            fechaVencimientoDemo: licenciaInicial.fechaVencimientoDemo || '',
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
            if (parsed && parsed.clubes && typeof parsed.clubes === 'object') return parsed.clubes;
            if (parsed && (Array.isArray(parsed.personas) || parsed.claveClub)) {
                const clave = parsed.claveClub || CLAVE_CLUB_POR_DEFECTO;
                return { [clave]: parsed };
            }
        }
    } catch (e) {
        console.error('⚠️ Error leyendo respaldo en disco:', e.message);
    }
    return { [CLAVE_CLUB_POR_DEFECTO]: crearEstadoVacioClub(CLAVE_CLUB_POR_DEFECTO) };
}

function guardarMapaClubesEnDisco(mapaClubes) {
    try {
        const principal = mapaClubes[CLAVE_CLUB_POR_DEFECTO] || Object.values(mapaClubes)[0] || crearEstadoVacioClub();
        fs.writeFileSync(ARCHIVO_RESPALDO_DISCO, JSON.stringify({ ...principal, clubes: mapaClubes }, null, 2), 'utf8');
    } catch (e) {
        console.error('⚠️ Error guardando respaldo en disco:', e.message);
    }
}

async function inicializarEstadoEnMongoSiVacio() {
    if (!(await asegurarConexionMongo())) return;
    try {
        const mapaDisco = leerMapaClubesDesdeDisco();
        for (const [clave, datosClub] of Object.entries(mapaDisco)) {
            const existe = await CdmStateModel.findOne({ claveClub: clave }).lean();
            if (!existe) {
                await CdmStateModel.findOneAndUpdate(
                    { claveClub: clave },
                    { $set: { ...datosClub, claveClub: clave } },
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
    if (await asegurarConexionMongo()) {
        try {
            const docs = await CdmStateModel.find({}).lean();
            docs.forEach(d => { if (d && d.claveClub) mapaDisco[d.claveClub] = d; });
        } catch (e) {
            console.error('⚠️ Error listando clubes en Mongo:', e.message);
        }
    }
    return mapaDisco;
}

async function obtenerEstadoMaestroClub(claveClub = CLAVE_CLUB_POR_DEFECTO) {
    const clave = String(claveClub || CLAVE_CLUB_POR_DEFECTO).trim();
    if (await asegurarConexionMongo()) {
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
    const conectada = await asegurarConexionMongo();

    // Leer SIEMPRE primero desde MongoDB para que un redeploy en Hostinger nunca pise datos con vacío
    let previo = mapa[clave] || null;
    if (conectada) {
        try {
            const docMongo = await CdmStateModel.findOne({ claveClub: clave }).lean();
            if (docMongo) previo = docMongo;
        } catch (e) {
            console.error('⚠️ Error leyendo estado previo de MongoDB:', e.message);
        }
    }
    if (!previo) previo = crearEstadoVacioClub(clave);

    // Conservar hashes de subAdmins si el cliente manda subAdmins sin claveHash
    let subAdminsFinal = previo.subAdmins || [];
    if (Array.isArray(nuevoEstado.subAdmins)) {
        subAdminsFinal = nuevoEstado.subAdmins.map(sa => {
            const ant = (previo.subAdmins || []).find(x => String(x.id) === String(sa.id));
            return {
                ...sa,
                claveHash: sa.claveHash || ant?.claveHash || (sa.clave ? hashearClaveStaff(sa.clave) : '')
            };
        });
    }

    // Proteger consultorio contra envíos parciales o vacíos desde otros módulos
    let consultorioFinal = previo.consultorio || { pacientes: [], turnos: [], mutuales: [], profesionales: [], sesiones: [] };
    if (nuevoEstado.consultorio && typeof nuevoEstado.consultorio === 'object') {
        if (nuevoEstado.forzarConsultorio || tieneDatosConsultorio(nuevoEstado.consultorio) || !tieneDatosConsultorio(consultorioFinal)) {
            consultorioFinal = nuevoEstado.consultorio;
        }
    }

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
        consultorio: consultorioFinal,
        subAdmins: subAdminsFinal,
        auditoria: Array.isArray(nuevoEstado.auditoria) ? nuevoEstado.auditoria.slice(0, 200) : (previo.auditoria || []),
        licenciaConfig: nuevoEstado.licenciaConfig && typeof nuevoEstado.licenciaConfig === 'object' && Object.keys(nuevoEstado.licenciaConfig).length > 0
            ? { ...previo.licenciaConfig, ...nuevoEstado.licenciaConfig, claveClub: clave }
            : (previo.licenciaConfig || {})
    };

    mapa[clave] = payload;
    guardarMapaClubesEnDisco(mapa);

    let mongoGuardado = false;
    let mongoError = null;

    if (conectada) {
        try {
            await CdmStateModel.findOneAndUpdate(
                { claveClub: clave },
                { $set: payload },
                { upsert: true, new: true }
            );
            mongoGuardado = true;
        } catch (e) {
            mongoError = e.message;
            console.error('❌ Error guardando en MongoDB:', e.message);
        }
    } else {
        mongoError = 'Base desconectada (revisar CDM_MONGO_URI en Hostinger)';
    }

    return { ...payload, _mongoGuardado: mongoGuardado, _mongoError: mongoError };
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
            cantidadStaff: Array.isArray(c.subAdmins) ? c.subAdmins.filter(s => s.activo !== false).length : 0,
            licenciaConfig: c.licenciaConfig || {}
        };
    });
}

function sanitizarEstadoParaRespuesta(estado) {
    if (!estado) return estado;
    return {
        ...estado,
        subAdmins: Array.isArray(estado.subAdmins) ? estado.subAdmins.map(sanitizarStaffPublico) : []
    };
}

// ============================================================================
// 3. RUTAS API REST
// ============================================================================

app.get('/api/cdm/salud', async (req, res) => {
    const conectada = await asegurarConexionMongo();
    res.json({
        ok: true,
        mongoConectado: conectada,
        readyState: cdmConnection.readyState,
        baseDeDatos: conectada ? cdmConnection.name : 'json_disco_local',
        fechaAR: obtenerHoyAR()
    });
});

app.get('/api/cdm/estado', async (req, res) => {
    try {
        const clave = req.query.club || CLAVE_CLUB_POR_DEFECTO;
        const estado = await obtenerEstadoMaestroClub(clave);
        const todos = await obtenerTodosLosClubes();
        res.json({
            ok: true,
            motor: mongoConectado ? `mongoose_${cdmConnection.name}` : 'json_disco_local',
            estado: sanitizarEstadoParaRespuesta(estado),
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
            mongoGuardado: Boolean(guardado._mongoGuardado),
            mongoError: guardado._mongoError || null,
            motor: mongoConectado ? `mongoose_${cdmConnection.name}` : 'json_disco_local',
            ultimaActualizacionISO: guardado.ultimaActualizacionISO
        });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.get('/api/cdm/consultorio', async (req, res) => {
    try {
        const clave = String(req.query.club || CLAVE_CLUB_POR_DEFECTO).trim();
        const estado = await obtenerEstadoMaestroClub(clave);
        res.json({
            ok: true,
            claveClub: clave,
            motor: mongoConectado ? `mongoose_${cdmConnection.name}` : 'json_disco_local',
            consultorio: estado.consultorio || { pacientes: [], turnos: [], mutuales: [], profesionales: [], sesiones: [] }
        });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.post('/api/cdm/consultorio', async (req, res) => {
    try {
        const clave = String(req.body?.claveClub || req.query.club || CLAVE_CLUB_POR_DEFECTO).trim();
        const consultorio = req.body?.consultorio;
        if (!consultorio || typeof consultorio !== 'object') {
            return res.status(400).json({ ok: false, error: 'Datos de consultorio inválidos.' });
        }

        const estadoActual = await obtenerEstadoMaestroClub(clave);
        estadoActual.consultorio = {
            pacientes: Array.isArray(consultorio.pacientes) ? consultorio.pacientes : [],
            turnos: Array.isArray(consultorio.turnos) ? consultorio.turnos : [],
            mutuales: Array.isArray(consultorio.mutuales) ? consultorio.mutuales : [],
            profesionales: Array.isArray(consultorio.profesionales) ? consultorio.profesionales : [],
            sesiones: Array.isArray(consultorio.sesiones) ? consultorio.sesiones : []
        };
        estadoActual.forzarConsultorio = true;

        const guardado = await guardarEstadoMaestroClub(estadoActual, clave);
        res.json({
            ok: true,
            claveClub: clave,
            mongoGuardado: Boolean(guardado._mongoGuardado),
            mongoError: guardado._mongoError || null,
            motor: mongoConectado ? `mongoose_${cdmConnection.name}` : 'json_disco_local',
            pacientes: guardado.consultorio.pacientes.length,
            turnos: guardado.consultorio.turnos.length,
            sesiones: guardado.consultorio.sesiones.length
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
        res.json({ ok: true, claveClub: claveNueva, estado: sanitizarEstadoParaRespuesta(guardado), clubes: resumirListaClubes(todos) });
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
        if (await asegurarConexionMongo()) {
            await CdmStateModel.deleteOne({ claveClub: clave });
        }
        const todos = await obtenerTodosLosClubes();
        res.json({ ok: true, clubes: resumirListaClubes(todos) });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// ============================================================================
// 3B. GESTIÓN DE SUB-ADMINISTRADORES (STAFF) Y AUDITORÍA POR COMERCIO
// ============================================================================

app.get('/api/cdm/staff', async (req, res) => {
    try {
        const clave = String(req.query.club || CLAVE_CLUB_POR_DEFECTO).trim();
        const estado = await obtenerEstadoMaestroClub(clave);
        res.json({
            ok: true,
            subAdmins: (estado.subAdmins || []).map(sanitizarStaffPublico),
            auditoria: (estado.auditoria || []).slice(0, 80)
        });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.post('/api/cdm/staff', async (req, res) => {
    try {
        const { claveClub, staff, actor } = req.body || {};
        const clave = String(claveClub || CLAVE_CLUB_POR_DEFECTO).trim();
        if (!staff || !staff.nombre || !staff.usuario) {
            return res.status(400).json({ ok: false, mensaje: 'Completá nombre y usuario del sub-administrador.' });
        }

        const usuarioNorm = String(staff.usuario).trim().toLowerCase();
        if (USUARIOS_RESERVADOS_SUPERADMIN.includes(usuarioNorm)) {
            return res.status(400).json({ ok: false, mensaje: `El usuario "${usuarioNorm}" está reservado para el SuperAdmin.` });
        }

        const todos = await obtenerTodosLosClubes();
        const estado = todos[clave] || await obtenerEstadoMaestroClub(clave);
        const idEdit = staff.id ? String(staff.id) : null;

        // Evitar colisión de nombres de usuario entre comercios o admins principales
        for (const c of Object.values(todos)) {
            const uMain = String(c.licenciaConfig?.adminUsuario || '').toLowerCase();
            if (uMain === usuarioNorm) {
                return res.status(409).json({ ok: false, mensaje: `El usuario "${usuarioNorm}" ya pertenece a un Administrador Principal. Elegí otro.` });
            }
            const colisionStaff = (c.subAdmins || []).find(s =>
                String(s.usuario || '').toLowerCase() === usuarioNorm && String(s.id) !== idEdit
            );
            if (colisionStaff) {
                return res.status(409).json({ ok: false, mensaje: `El usuario "${usuarioNorm}" ya está en uso. Elegí otro.` });
            }
        }

        if (!Array.isArray(estado.subAdmins)) estado.subAdmins = [];
        const idx = idEdit ? estado.subAdmins.findIndex(s => String(s.id) === idEdit) : -1;

        if (idx === -1 && !String(staff.clave || '').trim()) {
            return res.status(400).json({ ok: false, mensaje: 'Ingresá una contraseña inicial para el nuevo usuario.' });
        }

        const previo = idx >= 0 ? estado.subAdmins[idx] : null;
        const nuevoReg = {
            id: previo ? previo.id : `staff_${Date.now()}`,
            nombre: String(staff.nombre).trim(),
            usuario: usuarioNorm,
            claveHash: String(staff.clave || '').trim()
                ? hashearClaveStaff(String(staff.clave).trim())
                : (previo?.claveHash || ''),
            rolPlantilla: staff.rolPlantilla || 'personalizado',
            activo: staff.activo !== false,
            alcance: {
                modulos: Array.isArray(staff.alcance?.modulos) && staff.alcance.modulos.length ? staff.alcance.modulos : ['todos'],
                categorias: Array.isArray(staff.alcance?.categorias) && staff.alcance.categorias.length ? staff.alcance.categorias : ['todas']
            },
            permisos: staff.permisos && typeof staff.permisos === 'object' ? staff.permisos : {},
            creadoISO: previo?.creadoISO || new Date().toISOString()
        };

        if (idx >= 0) estado.subAdmins[idx] = nuevoReg;
        else estado.subAdmins.unshift(nuevoReg);

        if (!Array.isArray(estado.auditoria)) estado.auditoria = [];
        estado.auditoria.unshift({
            id: Date.now(),
            fechaISO: new Date().toISOString(),
            usuario: actor || 'Admin Principal',
            accion: idx >= 0 ? 'EDITAR_STAFF' : 'CREAR_STAFF',
            detalle: `${nuevoReg.nombre} (@${nuevoReg.usuario}) • Plantilla: ${nuevoReg.rolPlantilla}`
        });

        await guardarEstadoMaestroClub(estado, clave);
        res.json({
            ok: true,
            staff: sanitizarStaffPublico(nuevoReg),
            subAdmins: estado.subAdmins.map(sanitizarStaffPublico),
            auditoria: estado.auditoria.slice(0, 80)
        });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.delete('/api/cdm/staff/:id', async (req, res) => {
    try {
        const clave = String(req.query.club || CLAVE_CLUB_POR_DEFECTO).trim();
        const idStaff = String(req.params.id || '').trim();
        const actor = String(req.query.actor || 'Admin Principal');
        const estado = await obtenerEstadoMaestroClub(clave);

        const target = (estado.subAdmins || []).find(s => String(s.id) === idStaff);
        estado.subAdmins = (estado.subAdmins || []).filter(s => String(s.id) !== idStaff);

        if (target) {
            if (!Array.isArray(estado.auditoria)) estado.auditoria = [];
            estado.auditoria.unshift({
                id: Date.now(),
                fechaISO: new Date().toISOString(),
                usuario: actor,
                accion: 'ELIMINAR_STAFF',
                detalle: `${target.nombre} (@${target.usuario})`
            });
        }

        await guardarEstadoMaestroClub(estado, clave);
        res.json({
            ok: true,
            subAdmins: estado.subAdmins.map(sanitizarStaffPublico),
            auditoria: (estado.auditoria || []).slice(0, 80)
        });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.post('/api/cdm/auditoria', async (req, res) => {
    try {
        const { claveClub, usuario, accion, detalle } = req.body || {};
        const clave = String(claveClub || CLAVE_CLUB_POR_DEFECTO).trim();
        const estado = await obtenerEstadoMaestroClub(clave);
        if (!Array.isArray(estado.auditoria)) estado.auditoria = [];
        estado.auditoria.unshift({
            id: Date.now(),
            fechaISO: new Date().toISOString(),
            usuario: String(usuario || 'Admin'),
            accion: String(accion || 'ACCION'),
            detalle: String(detalle || '')
        });
        estado.auditoria = estado.auditoria.slice(0, 200);
        await guardarEstadoMaestroClub(estado, clave);
        res.json({ ok: true });
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
        if (pac.puedeSubirEstudios === false) {
            return res.status(403).json({ ok: false, error: 'El profesional desactivó la subida de archivos para esta cuenta.' });
        }

        if (!Array.isArray(pac.estudios)) pac.estudios = [];
        pac.estudios.unshift({
            id: estudio.id || Date.now(),
            titulo: String(estudio.titulo).trim(),
            fecha: estudio.fecha || obtenerHoyAR(),
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

// Login unificado: Admin Principal de Comercio + Sub-Administradores (Staff)
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

        // 1. Buscar Admin Principal del Comercio
        const matchPrincipal = lista.find(c => {
            const u = String(c.licenciaConfig?.adminUsuario || 'cdm').toLowerCase();
            const p = String(c.licenciaConfig?.adminClave || 'cdm2026');
            const esCdmPrincipal = c.claveClub === CLAVE_CLUB_POR_DEFECTO;
            const coincideUsuario = (u === usuario) || (esCdmPrincipal && (usuario === 'cdm' || usuario === 'admin') && (u === 'cdm' || u === 'admin'));
            return coincideUsuario && p === clave;
        });

        if (matchPrincipal) {
            if (matchPrincipal.licenciaConfig?.estadoServicio === 'suspendido') {
                return res.status(403).json({
                    ok: false,
                    suspendido: true,
                    mensaje: '⚠️ Suscripción mensual en pausa. Contactá a Gonzalo Adanchú para reactivar el servicio.'
                });
            }
            if (estaDemoVencida(matchPrincipal.licenciaConfig)) {
                return res.status(403).json({
                    ok: false,
                    suspendido: true,
                    demoVencida: true,
                    mensaje: `⏳ Tu prueba gratuita finalizó el ${formatearFechaAR(matchPrincipal.licenciaConfig.fechaVencimientoDemo)}. Todos tus datos siguen guardados. Contactá a Gonzalo Adanchú para activar tu plan.`
                });
            }
            return res.json({
                ok: true,
                nivelAdmin: 'principal',
                staffPerfil: null,
                claveClub: matchPrincipal.claveClub,
                estado: sanitizarEstadoParaRespuesta(matchPrincipal),
                clubes: resumirListaClubes(todos)
            });
        }

        // 2. Buscar Sub-Administrador (Staff) en todos los comercios
        for (const club of lista) {
            const hitStaff = (club.subAdmins || []).find(sa =>
                String(sa.usuario || '').toLowerCase() === usuario && verificarClaveStaff(clave, sa)
            );
            if (!hitStaff) continue;

            if (club.licenciaConfig?.estadoServicio === 'suspendido' || estaDemoVencida(club.licenciaConfig)) {
                return res.status(403).json({
                    ok: false,
                    suspendido: true,
                    mensaje: '⏳ El servicio de esta institución está pausado o vencido. Consultá con el administrador principal.'
                });
            }
            if (hitStaff.activo === false) {
                return res.status(403).json({
                    ok: false,
                    suspendido: true,
                    mensaje: '🚫 Tu usuario de staff fue desactivado por el administrador principal.'
                });
            }

            return res.json({
                ok: true,
                nivelAdmin: 'staff',
                staffPerfil: sanitizarStaffPublico(hitStaff),
                claveClub: club.claveClub,
                estado: sanitizarEstadoParaRespuesta(club)
            });
        }

        return res.status(401).json({ ok: false, mensaje: 'Usuario o contraseña incorrectos.' });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// Login por código personal (Deportistas CDM-XXXX y Pacientes PAC-XXXX)
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
            const lic = estadoClub.licenciaConfig || {};
            const bloqueado = lic.estadoServicio === 'suspendido' || estaDemoVencida(lic);

            const pacs = Array.isArray(estadoClub.consultorio?.pacientes) ? estadoClub.consultorio.pacientes : [];
            const pacHit = pacs.find(p => {
                if (!p) return false;
                const codP = String(p.codigoAcceso || `PAC-${p.id}`).toUpperCase();
                const codPLimpio = codP.replace(/[^A-Z0-9]/g, '');
                const dniP = String(p.dni || '').replace(/\D/g, '');
                return codP === rawInput || codPLimpio === limpioInput || (soloNumeros.length >= 7 && dniP === soloNumeros);
            });
            if (pacHit) {
                if (bloqueado) {
                    return res.status(403).json({ ok: false, suspendido: true, mensaje: '⏳ El período de prueba de este consultorio finalizó. Consultá con tu profesional.' });
                }
                return res.json({ ok: true, esPacienteConsultorio: true, claveClub: estadoClub.claveClub, paciente: pacHit, estado: sanitizarEstadoParaRespuesta(estadoClub) });
            }

            const siglaClub = String(lic.siglaCodigo || 'CDM').toUpperCase();
            const encontrado = (estadoClub.personas || []).find(p => {
                if (!p || !p.activo || !p.codigoAcceso) return false;
                const codCompleto = String(p.codigoAcceso).toUpperCase();
                const codLimpio = codCompleto.replace(/[^A-Z0-9]/g, '');
                const soloSufijo = codCompleto.replace(`${siglaClub}-`, '').replace('CDM-', '');
                return codCompleto === rawInput || codLimpio === limpioInput || soloSufijo === rawInput;
            });
            if (encontrado) {
                if (bloqueado) {
                    return res.status(403).json({ ok: false, suspendido: true, mensaje: '⏳ El período de prueba de esta institución finalizó. Consultá con la administración.' });
                }
                return res.json({ ok: true, esPacienteConsultorio: false, claveClub: estadoClub.claveClub, persona: encontrado, estado: sanitizarEstadoParaRespuesta(estadoClub) });
            }
        }

        return res.status(404).json({ ok: false, mensaje: 'Código inválido o inactivo.' });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// ============================================================================
// 3C. MOTOR AUTOMÁTICO DE RECORDATORIOS WHATSAPP 24HS (META CLOUD API)
// ============================================================================

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || '';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WHATSAPP_TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_NAME || 'recordatorio_turno_24h';
const WHATSAPP_TEMPLATE_LANG = process.env.WHATSAPP_TEMPLATE_LANG || 'es_AR';

function normalizarTelefonoMetaAR(telRaw) {
    let dig = String(telRaw || '').replace(/\D/g, '');
    if (!dig) return '';
    if (dig.startsWith('0')) dig = dig.slice(1);
    if (!dig.startsWith('54')) dig = '549' + dig;
    return dig;
}

async function enviarPlantillaWhatsAppMeta({ telefono, pacienteNombre, especialidad, fechaTxt, hora, institucion }) {
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) return false;
    const to = normalizarTelefonoMetaAR(telefono);
    if (to.length < 10) return false;

    const url = `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const body = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
            name: WHATSAPP_TEMPLATE_NAME,
            language: { code: WHATSAPP_TEMPLATE_LANG },
            components: [
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: String(pacienteNombre || 'Paciente') },
                        { type: 'text', text: String(institucion || 'Consultorio') },
                        { type: 'text', text: String(especialidad || 'Consulta') },
                        { type: 'text', text: String(fechaTxt || '') },
                        { type: 'text', text: String(hora || '') }
                    ]
                }
            ]
        }
    };

    const resp = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    return resp.ok;
}

async function procesarRecordatoriosAutomaticos24h() {
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) return;
    try {
        const todos = await obtenerTodosLosClubes();
        const ahoraMs = Date.now();

        for (const club of Object.values(todos)) {
            const lic = club.licenciaConfig || {};
            const autoOn = Boolean(lic.whatsappAuto24h || lic.funciones?.general?.whatsappAuto24h);
            if (!autoOn) continue;
            if (lic.estadoServicio === 'suspendido' || estaDemoVencida(lic)) continue;

            const turnos = club.consultorio?.turnos || [];
            const pacientes = club.consultorio?.pacientes || [];
            let huboCambios = false;

            for (const t of turnos) {
                if (!t || t.estado === 'cancelado' || t.estado === 'atendido' || t.aviso24hEnviado) continue;
                if (!t.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(t.fecha)) continue;

                const [y, m, d] = t.fecha.split('-').map(Number);
                const [hh, mm] = String(t.hora || '09:00').split(':').map(Number);
                // Zona horaria Argentina (-03:00)
                const turnoMs = Date.UTC(y, m - 1, d, (isNaN(hh) ? 9 : hh) + 3, isNaN(mm) ? 0 : mm, 0);
                const diffHoras = (turnoMs - ahoraMs) / 3600000;

                // Enviar cuando faltan entre 2h y 24.5h para el turno
                if (diffHoras >= 2 && diffHoras <= 24.5) {
                    const pac = pacientes.find(p => Number(p.id) === Number(t.pacienteId));
                    const tel = t.whatsapp || pac?.whatsapp || '';
                    if (!tel) continue;

                    const ok = await enviarPlantillaWhatsAppMeta({
                        telefono: tel,
                        pacienteNombre: t.pacienteNombre,
                        especialidad: t.especialidad,
                        fechaTxt: formatearFechaAR(t.fecha),
                        hora: t.hora,
                        institucion: lic.nombreEntidad || 'Consultorio'
                    });

                    if (ok) {
                        t.aviso24hEnviado = true;
                        t.aviso24hModo = 'auto';
                        t.aviso24hFecha = new Date().toISOString();
                        huboCambios = true;
                    }
                }
            }

            if (huboCambios) {
                await guardarEstadoMaestroClub(club, club.claveClub);
            }
        }
    } catch (err) {
        console.error('⚠️ Error en cron recordatorios WA 24h:', err.message);
    }
}

// Ejecutar revisión cada 15 minutos
setInterval(procesarRecordatoriosAutomaticos24h, 15 * 60 * 1000);
setTimeout(procesarRecordatoriosAutomaticos24h, 30 * 1000);

// ============================================================================
// 4. SERVIR FRONTEND Y ARRANCAR SERVIDOR
// ============================================================================

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor Oficial Multi-Cliente activo en puerto ${PORT}`);
});

module.exports = { app, cdmConnection };