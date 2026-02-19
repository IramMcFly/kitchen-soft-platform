import mongoose, { Schema, Document } from 'mongoose';

export interface IRemoteSession extends Document {
    userId: mongoose.Types.ObjectId;
    localId: string;
    numeroCaja: number;
    nombreUsuario: string; // Nombre del cajero al momento del cierre
    montoApertura: number;
    montoCierre?: number;
    montoEsperado?: number;
    diferencia?: number;
    fechaApertura: Date;
    fechaCierre?: Date;
    estado: string;
    totalVentas: number;
    totalOrdenes: number;
    totalEfectivo: number;
    totalTarjeta: number;
    syncedAt: Date;
    lastUpdated: Date;
}

const RemoteSessionSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        localId: {
            type: String,
            required: true,
            index: true
        },
        numeroCaja: {
            type: Number,
            default: 1
        },
        nombreUsuario: String,
        montoApertura: {
            type: Number,
            required: true
        },
        montoCierre: Number,
        montoEsperado: Number,
        diferencia: Number,
        fechaApertura: {
            type: Date,
            required: true
        },
        fechaCierre: Date,
        estado: {
            type: String, // 'ABIERTA', 'CERRADA'
            default: 'ABIERTA'
        },
        totalVentas: {
            type: Number,
            default: 0
        },
        totalOrdenes: {
            type: Number,
            default: 0
        },
        totalEfectivo: {
            type: Number,
            default: 0
        },
        totalTarjeta: {
            type: Number,
            default: 0
        },
        syncedAt: {
            type: Date,
            default: Date.now
        },
        lastUpdated: {
            type: Date,
            required: true
        }
    },
    { timestamps: true }
);

RemoteSessionSchema.index({ userId: 1, localId: 1 }, { unique: true });
RemoteSessionSchema.index({ userId: 1, fechaApertura: -1 });

export default mongoose.models.RemoteSession || mongoose.model<IRemoteSession>('RemoteSession', RemoteSessionSchema);
