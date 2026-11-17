// models/Athlete.js
const mongoose = require('mongoose');

const puntoLogSchema = new mongoose.Schema({
    fecha: { type: Date, default: Date.now },
    puntosAnteriores: Number,
    puntosNuevos: Number,
    diferencia: Number, // ej: +5 o -3
    motivo: String, // ej: "Gran desempeño en test de velocidad", "Falta de compromiso en gym"
    evaluador: String // Nombre del profesor/admin
});

const athleteSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    dni: { type: String, required: true, unique: true },
    
    // CATEGORÍAS ESTRICTAS
    categoria: { 
        type: String, 
        enum: ['Sub 13', 'Sub 15', 'Sub 17', 'Reserva', 'Primera'], 
        required: true 
    },
    posicion: String,
    
    // SISTEMA DE RANKING Y PUNTOS DEL PROFESOR
    rankingPuntos: { 
        type: Number, 
        default: 50, // Puntos base iniciales (ej. escala 0 a 100)
        min: 0, 
        max: 100 
    },
    historialPuntos: [puntoLogSchema],

    activo: { type: Boolean, default: true }
}, { timestamps: true });

// ÍNDICE COMPUESTO: Optimiza las consultas de rankings ordenados por categoría
athleteSchema.index({ categoria: 1, rankingPuntos: -1 });

module.exports = mongoose.model('Athlete', athleteSchema);