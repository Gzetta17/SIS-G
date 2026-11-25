/**
 * server.js - Servidor Backend Oficial Multi-Club, Multi-Gimnasio & Consultorios (SaaS Suite)
 * Incluye control de Demos vs Sistema Real (privacidad por mail), Biometría WebAuthn (Huella/Face ID),
 * Sub-Administradores con permisos granulares, Auditoría y Persistencia Consultorio
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
const CDM_AUTH_SECRET = process.env.CDM_AUTH_SECRET || crypto.createHash('sha256').update(CDM_MONGO_URI + '_cdm_secret_v1').digest('hex');

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
    auditoria: { type: Array, default: [] },
    credencialesBiometricas: { type: Array, default: [] }
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
// 2. HELPERS DE SEGURIDAD (SCRYPT, TOKENS HMAC, EMAIL Y WEBAUTHN)
// ============================================================================

function toBase64Url(buf) {
    return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(str) {
    let s = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return Buffer.from(s, 'base64');
}

function firmarTokenInterno(payloadObj, ttlMs = 24 * 60 * 60 * 1000) {
    const data = { ...payloadObj, exp: Date.now() + ttlMs };
    const encoded = toBase64Url(Buffer.from(JSON.stringify(data), 'utf8'));
    const sig = toBase64Url(crypto.createHmac('sha256', CDM_AUTH_SECRET).update(encoded).digest());
    return `${encoded}.${sig}`;
}

function verificarTokenInterno(token) {
    try {
        const partes = String(token || '').split('.');
        if (partes.length !== 2) return null;
        const [encoded, sig] = partes;
        const expected = toBase64Url(crypto.createHmac('sha256', CDM_AUTH_SECRET).update(encoded).digest());
        const b1 = Buffer.from(sig);
        const b2 = Buffer.from(expected);
        if (b1.length !== b2.length || !crypto.timingSafeEqual(b1, b2)) return null;
        const data = JSON.parse(fromBase64Url(encoded).toString('utf8'));
        if (!data || Date.now() > Number(data.exp || 0)) return null;
        return data;
    } catch {
        return null;
    }
}

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

function sanitizarLicenciaPublica(lic = {}) {
    if (!lic || typeof lic !== 'object') return {};
    const copia = { ...lic };
    delete copia.adminClaveHash;
    if (copia.credencialesPrivadasConfirmadas) {
        copia.adminClave = '';
    }
    return copia;
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

// ============================================================================
// 2B. ENVÍO DE CORREOS PARA CÓDIGOS DE VERIFICACIÓN (RESEND / BREVO / SMTP)
// ============================================================================

const codigosEmailPendientes = new Map();
const retosWebAuthnPendientes = new Map();

function limpiarMapasTemporales() {
    const ahora = Date.now();
    for (const [k, v] of codigosEmailPendientes.entries()) {
        if (ahora > v.exp) codigosEmailPendientes.delete(k);
    }
    for (const [k, v] of retosWebAuthnPendientes.entries()) {
        if (ahora > v.exp) retosWebAuthnPendientes.delete(k);
    }
}
setInterval(limpiarMapasTemporales, 5 * 60 * 1000);

async function enviarCorreoCodigoSeguridad({ para, nombreEntidad, codigo, tipo = 'activacion' }) {
    const remitente = process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@onboarding.resend.dev';
    const asunto = tipo === 'recuperacion'
        ? `Código de recuperación de clave — ${nombreEntidad}`
        : `Código de verificación para activar tu cuenta privada — ${nombreEntidad}`;

    const html = `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #dbe3ee;border-radius:14px;color:#0f172a;">
            <h2 style="margin:0 0 12px;color:#0284c7;">${tipo === 'recuperacion' ? '🔑 Recuperación de Contraseña' : '🔒 Activación de Cuenta Privada'}</h2>
            <p style="margin:0 0 14px;line-height:1.5;">Hola, recibimos una solicitud para <strong>${nombreEntidad}</strong>. Usá este código de 6 dígitos para confirmar tu identidad:</p>
            <div style="background:#f0f9ff;border:2px dashed #0284c7;border-radius:12px;padding:16px;text-align:center;font-size:32px;font-weight:800;letter-spacing:8px;color:#0369a1;margin:16px 0;">
                ${codigo}
            </div>
            <p style="font-size:13px;color:#475569;margin:0;">Este código vence en 15 minutos. Si no realizaste esta solicitud, ignorá este correo.</p>
        </div>
    `;

    // Opción 1: Resend API (recomendado en Hostinger, 0 librerías extra)
    if (process.env.RESEND_API_KEY) {
        const resp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ from: remitente, to: [para], subject: asunto, html })
        });
        if (!resp.ok) {
            const errTxt = await resp.text().catch(() => '');
            throw new Error(`Resend rechazó el envío: ${errTxt || resp.status}`);
        }
        return { ok: true, proveedor: 'resend' };
    }

    // Opción 2: Brevo API (0 librerías extra)
    if (process.env.BREVO_API_KEY) {
        const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': process.env.BREVO_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sender: { email: remitente, name: nombreEntidad || 'Plataforma Oficial' },
                to: [{ email: para }],
                subject: asunto,
                htmlContent: html
            })
        });
        if (!resp.ok) {
            const errTxt = await resp.text().catch(() => '');
            throw new Error(`Brevo rechazó el envío: ${errTxt || resp.status}`);
        }
        return { ok: true, proveedor: 'brevo' };
    }

    // Opción 3: SMTP de Hostinger / Gmail (requiere npm i nodemailer)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        let nodemailer = null;
        try {
            nodemailer = require('nodemailer');
        } catch {
            throw new Error('Configuraste variables SMTP pero falta instalar nodemailer (npm i nodemailer) o usar RESEND_API_KEY.');
        }
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 465),
            secure: String(process.env.SMTP_PORT || '465') === '465',
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });
        await transporter.sendMail({ from: remitente, to: para, subject: asunto, html });
        return { ok: true, proveedor: 'smtp' };
    }

    throw new Error('Falta configurar el servicio de correo en Hostinger (RESEND_API_KEY, BREVO_API_KEY o SMTP_HOST/SMTP_USER/SMTP_PASS).');
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
        credencialesBiometricas: [],
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
            tipoCuenta: licenciaInicial.tipoCuenta === 'real' ? 'real' : 'demo',
            adminEmail: String(licenciaInicial.adminEmail || '').trim().toLowerCase(),
            credencialesPrivadasConfirmadas: Boolean(licenciaInicial.credencialesPrivadasConfirmadas),
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

    let consultorioFinal = previo.consultorio || { pacientes: [], turnos: [], mutuales: [], profesionales: [], sesiones: [] };
    if (nuevoEstado.consultorio && typeof nuevoEstado.consultorio === 'object') {
        if (nuevoEstado.forzarConsultorio || tieneDatosConsultorio(nuevoEstado.consultorio) || !tieneDatosConsultorio(consultorioFinal)) {
            consultorioFinal = nuevoEstado.consultorio;
        }
    }

    let licenciaFinal = previo.licenciaConfig || {};
    if (nuevoEstado.licenciaConfig && typeof nuevoEstado.licenciaConfig === 'object' && Object.keys(nuevoEstado.licenciaConfig).length > 0) {
        licenciaFinal = { ...licenciaFinal, ...nuevoEstado.licenciaConfig, claveClub: clave };
    }

    // Blindaje de privacidad: una vez que el cliente confirmó su clave privada por mail, no se puede pisar ni exponer desde guardados comunes
    if (previo.licenciaConfig?.credencialesPrivadasConfirmadas && !nuevoEstado._permitirCambioCredencialesPrivadas) {
        licenciaFinal.adminUsuario = previo.licenciaConfig.adminUsuario;
        licenciaFinal.adminClaveHash = previo.licenciaConfig.adminClaveHash;
        licenciaFinal.adminClave = '';
        licenciaFinal.adminEmail = previo.licenciaConfig.adminEmail || licenciaFinal.adminEmail || '';
        licenciaFinal.credencialesPrivadasConfirmadas = true;
        licenciaFinal.tipoCuenta = 'real';
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
        credencialesBiometricas: Array.isArray(nuevoEstado.credencialesBiometricas)
            ? nuevoEstado.credencialesBiometricas
            : (previo.credencialesBiometricas || []),
        licenciaConfig: licenciaFinal
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
            licenciaConfig: sanitizarLicenciaPublica(c.licenciaConfig || {})
        };
    });
}

function sanitizarEstadoParaRespuesta(estado) {
    if (!estado) return estado;
    const copia = {
        ...estado,
        licenciaConfig: sanitizarLicenciaPublica(estado.licenciaConfig || {}),
        subAdmins: Array.isArray(estado.subAdmins) ? estado.subAdmins.map(sanitizarStaffPublico) : []
    };
    delete copia.credencialesBiometricas;
    return copia;
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
        correoConfigurado: Boolean(process.env.RESEND_API_KEY || process.env.BREVO_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER)),
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

// ============================================================================
// 3C. AUTENTICACIÓN ADMIN / STAFF / CÓDIGOS + ACTIVACIÓN PRIVADA POR EMAIL
// ============================================================================

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

        // 1. Buscar Admin Principal del Comercio (soporta clave provisoria o clave privada hasheada)
        const matchPrincipal = lista.find(c => {
            const lic = c.licenciaConfig || {};
            const u = String(lic.adminUsuario || 'cdm').toLowerCase();
            const esCdmPrincipal = c.claveClub === CLAVE_CLUB_POR_DEFECTO;
            const coincideUsuario = (u === usuario) || (esCdmPrincipal && (usuario === 'cdm' || usuario === 'admin') && (u === 'cdm' || u === 'admin'));
            if (!coincideUsuario) return false;
            if (lic.adminClaveHash) {
                return verificarClaveStaff(clave, { claveHash: lic.adminClaveHash });
            }
            return String(lic.adminClave || 'cdm2026') === clave;
        });

        if (matchPrincipal) {
            const lic = matchPrincipal.licenciaConfig || {};
            if (lic.estadoServicio === 'suspendido') {
                return res.status(403).json({
                    ok: false,
                    suspendido: true,
                    mensaje: '⚠️ Suscripción mensual en pausa. Contactá a Gonzalo Adanchú para reactivar el servicio.'
                });
            }
            if (estaDemoVencida(lic)) {
                return res.status(403).json({
                    ok: false,
                    suspendido: true,
                    demoVencida: true,
                    mensaje: `⏳ Tu prueba gratuita finalizó el ${formatearFechaAR(lic.fechaVencimientoDemo)}. Todos tus datos siguen guardados. Contactá a Gonzalo Adanchú para activar tu plan.`
                });
            }

            // Si es SISTEMA REAL y aún no cambió sus credenciales iniciales -> flujo obligatorio con código de email
            if (lic.tipoCuenta === 'real' && !lic.credencialesPrivadasConfirmadas) {
                const tokenSetup = firmarTokenInterno({
                    proposito: 'setup_privado',
                    claveClub: matchPrincipal.claveClub
                }, 30 * 60 * 1000);

                return res.json({
                    ok: true,
                    requiereConfiguracionPrivada: true,
                    tokenSetup,
                    claveClub: matchPrincipal.claveClub,
                    nombreEntidad: lic.nombreEntidad || matchPrincipal.claveClub,
                    usuarioActual: lic.adminUsuario || '',
                    emailSugerido: lic.adminEmail || ''
                });
            }

            const bioEnrollToken = firmarTokenInterno({
                proposito: 'bio_enroll',
                rol: 'admin',
                nivelAdmin: 'principal',
                claveClub: matchPrincipal.claveClub,
                usuario: lic.adminUsuario || usuario,
                nombre: `Admin • ${lic.nombreEntidad || 'Comercio'}`
            });

            return res.json({
                ok: true,
                nivelAdmin: 'principal',
                staffPerfil: null,
                claveClub: matchPrincipal.claveClub,
                bioEnrollToken,
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

            const bioEnrollToken = firmarTokenInterno({
                proposito: 'bio_enroll',
                rol: 'admin',
                nivelAdmin: 'staff',
                claveClub: club.claveClub,
                staffId: String(hitStaff.id),
                usuario: hitStaff.usuario,
                nombre: hitStaff.nombre || hitStaff.usuario
            });

            return res.json({
                ok: true,
                nivelAdmin: 'staff',
                staffPerfil: sanitizarStaffPublico(hitStaff),
                claveClub: club.claveClub,
                bioEnrollToken,
                estado: sanitizarEstadoParaRespuesta(club)
            });
        }

        return res.status(401).json({ ok: false, mensaje: 'Usuario o contraseña incorrectos.' });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// Paso 1 Activación Cuenta Real: enviar código de 6 dígitos al email del cliente
app.post('/api/cdm/auth-privacidad/enviar-codigo', async (req, res) => {
    try {
        const { tokenSetup, email, nuevoUsuario } = req.body || {};
        const tk = verificarTokenInterno(tokenSetup);
        if (!tk || tk.proposito !== 'setup_privado' || !tk.claveClub) {
            return res.status(401).json({ ok: false, mensaje: 'La sesión de activación expiró. Volvé a iniciar sesión.' });
        }

        const emailNorm = String(email || '').trim().toLowerCase();
        const userNorm = String(nuevoUsuario || '').trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
            return res.status(400).json({ ok: false, mensaje: 'Ingresá un correo electrónico válido.' });
        }
        if (userNorm.length < 3 || !/^[a-z0-9._-]+$/.test(userNorm)) {
            return res.status(400).json({ ok: false, mensaje: 'El nuevo usuario debe tener al menos 3 caracteres (solo letras, números, punto o guión).' });
        }
        if (USUARIOS_RESERVADOS_SUPERADMIN.includes(userNorm)) {
            return res.status(400).json({ ok: false, mensaje: 'Ese nombre de usuario está reservado. Elegí otro.' });
        }

        const todos = await obtenerTodosLosClubes();
        for (const c of Object.values(todos)) {
            if (c.claveClub !== tk.claveClub && String(c.licenciaConfig?.adminUsuario || '').toLowerCase() === userNorm) {
                return res.status(409).json({ ok: false, mensaje: `El usuario "${userNorm}" ya está en uso. Elegí otro.` });
            }
            if ((c.subAdmins || []).some(s => String(s.usuario || '').toLowerCase() === userNorm)) {
                return res.status(409).json({ ok: false, mensaje: `El usuario "${userNorm}" ya está en uso. Elegí otro.` });
            }
        }

        const club = todos[tk.claveClub] || await obtenerEstadoMaestroClub(tk.claveClub);
        const codigo = String(crypto.randomInt(100000, 999999));

        await enviarCorreoCodigoSeguridad({
            para: emailNorm,
            nombreEntidad: club.licenciaConfig?.nombreEntidad || tk.claveClub,
            codigo,
            tipo: 'activacion'
        });

        codigosEmailPendientes.set(`setup:${tk.claveClub}`, {
            codigo,
            email: emailNorm,
            nuevoUsuario: userNorm,
            exp: Date.now() + 15 * 60 * 1000
        });

        res.json({ ok: true, mensaje: `Te enviamos un código de 6 dígitos a ${emailNorm}. Revisá también Spam.` });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: err.message });
    }
});

// Paso 2 Activación Cuenta Real: validar código, encriptar nueva clave y borrar la clave provisoria
app.post('/api/cdm/auth-privacidad/confirmar', async (req, res) => {
    try {
        const { tokenSetup, email, codigo, nuevoUsuario, nuevaClave } = req.body || {};
        const tk = verificarTokenInterno(tokenSetup);
        if (!tk || tk.proposito !== 'setup_privado' || !tk.claveClub) {
            return res.status(401).json({ ok: false, mensaje: 'La sesión de activación expiró. Volvé a iniciar sesión.' });
        }

        const reg = codigosEmailPendientes.get(`setup:${tk.claveClub}`);
        if (!reg || Date.now() > reg.exp) {
            return res.status(400).json({ ok: false, mensaje: 'El código venció o no fue solicitado. Pedí un código nuevo.' });
        }

        const emailNorm = String(email || '').trim().toLowerCase();
        const userNorm = String(nuevoUsuario || '').trim().toLowerCase();
        const passClean = String(nuevaClave || '').trim();

        if (String(codigo || '').trim() !== reg.codigo || emailNorm !== reg.email) {
            return res.status(400).json({ ok: false, mensaje: 'El código de verificación no coincide.' });
        }
        if (passClean.length < 6) {
            return res.status(400).json({ ok: false, mensaje: 'La nueva contraseña debe tener al menos 6 caracteres.' });
        }

        const estado = await obtenerEstadoMaestroClub(tk.claveClub);
        estado.licenciaConfig = {
            ...(estado.licenciaConfig || {}),
            tipoCuenta: 'real',
            adminUsuario: userNorm,
            adminEmail: emailNorm,
            adminClave: '',
            adminClaveHash: hashearClaveStaff(passClean),
            credencialesPrivadasConfirmadas: true,
            fechaActivacionPrivadaISO: new Date().toISOString()
        };
        if (!Array.isArray(estado.auditoria)) estado.auditoria = [];
        estado.auditoria.unshift({
            id: Date.now(),
            fechaISO: new Date().toISOString(),
            usuario: userNorm,
            accion: 'ACTIVAR_CUENTA_PRIVADA',
            detalle: `Credenciales privadas activadas y verificadas vía ${emailNorm}`
        });
        estado._permitirCambioCredencialesPrivadas = true;

        const guardado = await guardarEstadoMaestroClub(estado, tk.claveClub);
        codigosEmailPendientes.delete(`setup:${tk.claveClub}`);

        const bioEnrollToken = firmarTokenInterno({
            proposito: 'bio_enroll',
            rol: 'admin',
            nivelAdmin: 'principal',
            claveClub: tk.claveClub,
            usuario: userNorm,
            nombre: `Admin • ${guardado.licenciaConfig?.nombreEntidad || 'Comercio'}`
        });

        res.json({
            ok: true,
            nivelAdmin: 'principal',
            staffPerfil: null,
            claveClub: tk.claveClub,
            bioEnrollToken,
            estado: sanitizarEstadoParaRespuesta(guardado)
        });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: err.message });
    }
});

// Recuperación de contraseña autónoma por email (para cuentas reales con clave privada)
app.post('/api/cdm/auth-recuperar/enviar-codigo', async (req, res) => {
    try {
        const identificador = String(req.body?.identificador || '').trim().toLowerCase();
        if (!identificador) {
            return res.status(400).json({ ok: false, mensaje: 'Ingresá tu usuario o correo electrónico.' });
        }

        const todos = await obtenerTodosLosClubes();
        const match = Object.values(todos).find(c => {
            const lic = c.licenciaConfig || {};
            return (lic.adminEmail && lic.adminEmail.toLowerCase() === identificador) ||
                   (lic.adminUsuario && lic.adminUsuario.toLowerCase() === identificador && lic.adminEmail);
        });

        if (!match || !match.licenciaConfig?.adminEmail) {
            return res.status(404).json({ ok: false, mensaje: 'No encontramos una cuenta con correo verificado para esos datos.' });
        }

        const emailDest = match.licenciaConfig.adminEmail.toLowerCase();
        const codigo = String(crypto.randomInt(100000, 999999));

        await enviarCorreoCodigoSeguridad({
            para: emailDest,
            nombreEntidad: match.licenciaConfig.nombreEntidad || match.claveClub,
            codigo,
            tipo: 'recuperacion'
        });

        codigosEmailPendientes.set(`rec:${match.claveClub}`, {
            codigo,
            email: emailDest,
            exp: Date.now() + 15 * 60 * 1000
        });

        const partesMail = emailDest.split('@');
        const mailOculto = `${partesMail[0].slice(0, 2)}***@${partesMail[1]}`;
        res.json({ ok: true, claveClub: match.claveClub, mensaje: `Enviamos un código de 6 dígitos a ${mailOculto}.` });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: err.message });
    }
});

app.post('/api/cdm/auth-recuperar/confirmar', async (req, res) => {
    try {
        const { claveClub, codigo, nuevaClave } = req.body || {};
        const reg = codigosEmailPendientes.get(`rec:${claveClub}`);
        if (!reg || Date.now() > reg.exp || String(codigo || '').trim() !== reg.codigo) {
            return res.status(400).json({ ok: false, mensaje: 'Código inválido o vencido.' });
        }
        const passClean = String(nuevaClave || '').trim();
        if (passClean.length < 6) {
            return res.status(400).json({ ok: false, mensaje: 'La nueva contraseña debe tener al menos 6 caracteres.' });
        }

        const estado = await obtenerEstadoMaestroClub(claveClub);
        estado.licenciaConfig = {
            ...(estado.licenciaConfig || {}),
            adminClave: '',
            adminClaveHash: hashearClaveStaff(passClean),
            credencialesPrivadasConfirmadas: true
        };
        estado._permitirCambioCredencialesPrivadas = true;
        await guardarEstadoMaestroClub(estado, claveClub);
        codigosEmailPendientes.delete(`rec:${claveClub}`);

        res.json({ ok: true, mensaje: 'Contraseña actualizada correctamente. Ya podés iniciar sesión.' });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: err.message });
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
                const bioEnrollToken = firmarTokenInterno({
                    proposito: 'bio_enroll',
                    rol: 'usuario',
                    esPacienteConsultorio: true,
                    claveClub: estadoClub.claveClub,
                    personaId: String(pacHit.id),
                    nombre: pacHit.nombreCompleto || `${pacHit.nombre || ''} ${pacHit.apellido || ''}`.trim() || 'Paciente'
                });
                return res.json({
                    ok: true,
                    esPacienteConsultorio: true,
                    claveClub: estadoClub.claveClub,
                    bioEnrollToken,
                    paciente: pacHit,
                    estado: sanitizarEstadoParaRespuesta(estadoClub)
                });
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
                const bioEnrollToken = firmarTokenInterno({
                    proposito: 'bio_enroll',
                    rol: 'usuario',
                    esPacienteConsultorio: false,
                    claveClub: estadoClub.claveClub,
                    personaId: String(encontrado.id),
                    nombre: `${encontrado.nombre || ''} ${encontrado.apellido || ''}`.trim()
                });
                return res.json({
                    ok: true,
                    esPacienteConsultorio: false,
                    claveClub: estadoClub.claveClub,
                    bioEnrollToken,
                    persona: encontrado,
                    estado: sanitizarEstadoParaRespuesta(estadoClub)
                });
            }
        }

        return res.status(404).json({ ok: false, mensaje: 'Código inválido o inactivo.' });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// ============================================================================
// 3D. BIOMETRÍA NATIVA WEBAUTHN (HUELLA DACTILAR / FACE ID / WINDOWS HELLO)
// ============================================================================

function obtenerRpId(req) {
    const rawHost = String(req.headers['x-forwarded-host'] || req.headers.host || 'localhost').split(',')[0].trim();
    return rawHost.split(':')[0].toLowerCase();
}

app.post('/api/cdm/webauthn/register-options', async (req, res) => {
    try {
        const tk = verificarTokenInterno(req.body?.bioEnrollToken);
        if (!tk || tk.proposito !== 'bio_enroll' || !tk.claveClub) {
            return res.status(401).json({ ok: false, mensaje: 'Cerrá sesión y volvé a ingresar una vez para vincular tu Huella / Face ID.' });
        }

        const rpId = obtenerRpId(req);
        const challenge = toBase64Url(crypto.randomBytes(32));
        const userIdRaw = `${tk.claveClub}:${tk.rol}:${tk.staffId || tk.personaId || tk.usuario || 'admin'}`;

        retosWebAuthnPendientes.set(`reg:${challenge}`, {
            tk,
            rpId,
            exp: Date.now() + 5 * 60 * 1000
        });

        res.json({
            ok: true,
            options: {
                challenge,
                rp: { name: 'Plataforma Oficial', id: rpId },
                user: {
                    id: toBase64Url(Buffer.from(userIdRaw, 'utf8')),
                    name: tk.usuario || tk.nombre || 'usuario',
                    displayName: tk.nombre || 'Usuario'
                },
                pubKeyCredParams: [
                    { alg: -7, type: 'public-key' },
                    { alg: -257, type: 'public-key' }
                ],
                authenticatorSelection: {
                    authenticatorAttachment: 'platform',
                    residentKey: 'preferred',
                    userVerification: 'required'
                },
                timeout: 60000
            }
        });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: err.message });
    }
});

app.post('/api/cdm/webauthn/register-verify', async (req, res) => {
    try {
        const { bioEnrollToken, credentialId, publicKeySpki, alg, clientDataJSON, dispositivo } = req.body || {};
        const tk = verificarTokenInterno(bioEnrollToken);
        if (!tk || tk.proposito !== 'bio_enroll') {
            return res.status(401).json({ ok: false, mensaje: 'Token de registro vencido.' });
        }
        if (!credentialId || !publicKeySpki || !clientDataJSON) {
            return res.status(400).json({ ok: false, mensaje: 'Tu navegador no devolvió la clave pública biométrica.' });
        }

        const clientData = JSON.parse(fromBase64Url(clientDataJSON).toString('utf8'));
        const reto = retosWebAuthnPendientes.get(`reg:${clientData.challenge}`);
        if (!reto || Date.now() > reto.exp || clientData.type !== 'webauthn.create') {
            return res.status(400).json({ ok: false, mensaje: 'El desafío biométrico expiró. Intentá de nuevo.' });
        }
        if (new URL(clientData.origin).hostname.toLowerCase() !== reto.rpId) {
            return res.status(400).json({ ok: false, mensaje: 'Origen inválido para registro biométrico.' });
        }

        // Validar que la clave pública SPKI sea válida en Node crypto
        crypto.createPublicKey({ key: fromBase64Url(publicKeySpki), format: 'der', type: 'spki' });

        const estado = await obtenerEstadoMaestroClub(tk.claveClub);
        if (!Array.isArray(estado.credencialesBiometricas)) estado.credencialesBiometricas = [];
        estado.credencialesBiometricas = estado.credencialesBiometricas.filter(c => c.credentialId !== credentialId);
        estado.credencialesBiometricas.push({
            credentialId,
            publicKeySpki,
            alg: Number(alg || -7),
            rol: tk.rol,
            nivelAdmin: tk.nivelAdmin || null,
            esPacienteConsultorio: Boolean(tk.esPacienteConsultorio),
            claveClub: tk.claveClub,
            usuario: tk.usuario || '',
            staffId: tk.staffId || null,
            personaId: tk.personaId || null,
            nombre: tk.nombre || 'Usuario',
            dispositivo: String(dispositivo || 'Dispositivo'),
            creadoISO: new Date().toISOString()
        });

        await guardarEstadoMaestroClub(estado, tk.claveClub);
        retosWebAuthnPendientes.delete(`reg:${clientData.challenge}`);

        res.json({
            ok: true,
            credentialId,
            claveClub: tk.claveClub,
            nombre: tk.nombre,
            rol: tk.rol
        });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: err.message });
    }
});

app.post('/api/cdm/webauthn/login-options', async (req, res) => {
    try {
        const { credentialId, claveClub } = req.body || {};
        if (!credentialId || !claveClub) {
            return res.status(400).json({ ok: false, mensaje: 'No hay huella registrada en este dispositivo.' });
        }

        const estado = await obtenerEstadoMaestroClub(claveClub);
        const cred = (estado.credencialesBiometricas || []).find(c => c.credentialId === credentialId);
        if (!cred) {
            return res.status(404).json({ ok: false, mensaje: 'Esta huella ya no está vinculada. Ingresá con tu clave/código y volvé a activarla.' });
        }

        const rpId = obtenerRpId(req);
        const challenge = toBase64Url(crypto.randomBytes(32));
        retosWebAuthnPendientes.set(`login:${challenge}`, {
            credentialId,
            claveClub,
            rpId,
            exp: Date.now() + 5 * 60 * 1000
        });

        res.json({
            ok: true,
            options: {
                challenge,
                rpId,
                allowCredentials: [{ id: credentialId, type: 'public-key' }],
                userVerification: 'required',
                timeout: 60000
            }
        });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: err.message });
    }
});

app.post('/api/cdm/webauthn/login-verify', async (req, res) => {
    try {
        const { credentialId, claveClub, authenticatorData, clientDataJSON, signature } = req.body || {};
        if (!credentialId || !claveClub || !authenticatorData || !clientDataJSON || !signature) {
            return res.status(400).json({ ok: false, mensaje: 'Respuesta biométrica incompleta.' });
        }

        const clientDataBuf = fromBase64Url(clientDataJSON);
        const clientData = JSON.parse(clientDataBuf.toString('utf8'));
        const reto = retosWebAuthnPendientes.get(`login:${clientData.challenge}`);
        if (!reto || Date.now() > reto.exp || clientData.type !== 'webauthn.get' || reto.credentialId !== credentialId) {
            return res.status(401).json({ ok: false, mensaje: 'Desafío biométrico expirado. Intentá nuevamente.' });
        }
        if (new URL(clientData.origin).hostname.toLowerCase() !== reto.rpId) {
            return res.status(401).json({ ok: false, mensaje: 'Origen inválido.' });
        }

        const estado = await obtenerEstadoMaestroClub(claveClub);
        const cred = (estado.credencialesBiometricas || []).find(c => c.credentialId === credentialId);
        if (!cred) {
            return res.status(404).json({ ok: false, mensaje: 'Credencial biométrica no encontrada.' });
        }

        const authDataBuf = fromBase64Url(authenticatorData);
        const rpIdHashEsperado = crypto.createHash('sha256').update(reto.rpId).digest();
        if (authDataBuf.length < 37 || !authDataBuf.subarray(0, 32).equals(rpIdHashEsperado)) {
            return res.status(401).json({ ok: false, mensaje: 'Validación de dominio biométrico fallida.' });
        }
        const flags = authDataBuf[32];
        if ((flags & 0x01) === 0) {
            return res.status(401).json({ ok: false, mensaje: 'No se verificó presencia del usuario.' });
        }

        const pubKey = crypto.createPublicKey({ key: fromBase64Url(cred.publicKeySpki), format: 'der', type: 'spki' });
        const clientDataHash = crypto.createHash('sha256').update(clientDataBuf).digest();
        const signedData = Buffer.concat([authDataBuf, clientDataHash]);
        const firmaValida = crypto.verify('sha256', signedData, pubKey, fromBase64Url(signature));

        retosWebAuthnPendientes.delete(`login:${clientData.challenge}`);
        if (!firmaValida) {
            return res.status(401).json({ ok: false, mensaje: 'Firma biométrica inválida.' });
        }

        // Chequear estado del servicio / vencimiento de demo
        const lic = estado.licenciaConfig || {};
        if (lic.estadoServicio === 'suspendido' || estaDemoVencida(lic)) {
            return res.status(403).json({
                ok: false,
                suspendido: true,
                mensaje: '⏳ El servicio está pausado o el período de prueba finalizó.'
            });
        }

        const bioEnrollToken = firmarTokenInterno({
            proposito: 'bio_enroll',
            rol: cred.rol,
            nivelAdmin: cred.nivelAdmin,
            esPacienteConsultorio: cred.esPacienteConsultorio,
            claveClub,
            usuario: cred.usuario,
            staffId: cred.staffId,
            personaId: cred.personaId,
            nombre: cred.nombre
        });

        if (cred.rol === 'admin') {
            if (cred.nivelAdmin === 'staff') {
                const staffObj = (estado.subAdmins || []).find(s => String(s.id) === String(cred.staffId));
                if (!staffObj || staffObj.activo === false) {
                    return res.status(403).json({ ok: false, mensaje: 'Tu usuario de staff fue desactivado.' });
                }
                return res.json({
                    ok: true,
                    rol: 'admin',
                    nivelAdmin: 'staff',
                    staffPerfil: sanitizarStaffPublico(staffObj),
                    claveClub,
                    bioEnrollToken,
                    estado: sanitizarEstadoParaRespuesta(estado)
                });
            }
            return res.json({
                ok: true,
                rol: 'admin',
                nivelAdmin: 'principal',
                staffPerfil: null,
                claveClub,
                bioEnrollToken,
                estado: sanitizarEstadoParaRespuesta(estado)
            });
        }

        if (cred.esPacienteConsultorio) {
            const pac = (estado.consultorio?.pacientes || []).find(p => String(p.id) === String(cred.personaId));
            if (!pac) return res.status(404).json({ ok: false, mensaje: 'Ficha de paciente no encontrada.' });
            return res.json({
                ok: true,
                rol: 'usuario',
                esPacienteConsultorio: true,
                claveClub,
                bioEnrollToken,
                paciente: pac,
                estado: sanitizarEstadoParaRespuesta(estado)
            });
        }

        const persona = (estado.personas || []).find(p => String(p.id) === String(cred.personaId) && p.activo);
        if (!persona) return res.status(404).json({ ok: false, mensaje: 'Deportista/socio inactivo o no encontrado.' });
        return res.json({
            ok: true,
            rol: 'usuario',
            esPacienteConsultorio: false,
            claveClub,
            bioEnrollToken,
            persona,
            estado: sanitizarEstadoParaRespuesta(estado)
        });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: err.message });
    }
});

// ============================================================================
// 3E. MOTOR AUTOMÁTICO DE RECORDATORIOS WHATSAPP 24HS (META CLOUD API)
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
                const turnoMs = Date.UTC(y, m - 1, d, (isNaN(hh) ? 9 : hh) + 3, isNaN(mm) ? 0 : mm, 0);
                const diffHoras = (turnoMs - ahoraMs) / 3600000;

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