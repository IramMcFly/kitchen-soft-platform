import mongoose, { Schema, Document } from 'mongoose';

export interface IRemoteProduct extends Document {
    userId: mongoose.Types.ObjectId;
    localId: string; // ID original de KS local
    nombre: string;
    descripcion?: string;
    precio: number;
    categoria: string;
    disponible: boolean;
    syncedAt: Date;
    lastUpdated: Date;
}

const RemoteProductSchema = new Schema(
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
        nombre: {
            type: String,
            required: true
        },
        descripcion: String,
        precio: {
            type: Number,
            required: true
        },
        categoria: {
            type: String,
            default: 'OTROS'
        },
        disponible: {
            type: Boolean,
            default: true
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

// Compound index to ensure uniqueness per user
RemoteProductSchema.index({ userId: 1, localId: 1 }, { unique: true });

export default mongoose.models.RemoteProduct || mongoose.model<IRemoteProduct>('RemoteProduct', RemoteProductSchema);
