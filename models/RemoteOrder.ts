import mongoose, { Schema, Document } from 'mongoose';

// Interface interna simplificada para productos
interface IRemoteOrderProduct {
    nombre: string;
    cantidad: number;
    precio: number;
    categoria?: string;
    total: number;
}

export interface IRemoteOrder extends Document {
    userId: mongoose.Types.ObjectId;
    localId: string;
    tipo: string; // 'MESA', 'PARA_LLEVAR'
    numeroMesa?: number;
    nombreMesero?: string; // Guardamos nombre para reporte, ya que ID puede no coincidir
    estado: string; // 'ABIERTA', 'PAGADA', 'CANCELADA'
    productos: IRemoteOrderProduct[];
    subtotal: number;
    propina: number;
    total: number;
    metodoPago?: string;
    fechaCreacion: Date;
    fechaCierre?: Date;
    syncedAt: Date;
    lastUpdated: Date;
}

const RemoteOrderSchema = new Schema(
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
        tipo: {
            type: String,
            required: true
        },
        numeroMesa: Number,
        nombreMesero: String,
        estado: {
            type: String,
            default: 'ABIERTA',
            index: true
        },
        productos: [{
            nombre: String,
            cantidad: Number,
            precio: Number,
            categoria: String,
            total: Number
        }],
        subtotal: {
            type: Number,
            default: 0
        },
        propina: {
            type: Number,
            default: 0
        },
        total: {
            type: Number, // subtotal + propina
            default: 0
        },
        metodoPago: {
            type: String,
            enum: ['EFECTIVO', 'TARJETA', null],
            default: null
        },
        fechaCreacion: { // Fecha original de creación en local
            type: Date,
            required: true,
            index: true
        },
        fechaCierre: { // Fecha de pago/cancelación
            type: Date,
            index: true
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

RemoteOrderSchema.index({ userId: 1, localId: 1 }, { unique: true });
RemoteOrderSchema.index({ userId: 1, fechaCreacion: -1 });

export default mongoose.models.RemoteOrder || mongoose.model<IRemoteOrder>('RemoteOrder', RemoteOrderSchema);
