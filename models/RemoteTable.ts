import mongoose, { Schema, Document } from 'mongoose';

export interface IRemoteTable extends Document {
    userId: mongoose.Types.ObjectId;
    localId: string;
    numero: number;
    estado: string;
    syncedAt: Date;
    lastUpdated: Date;
}

const RemoteTableSchema = new Schema(
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
        numero: {
            type: Number,
            required: true
        },
        estado: {
            type: String,
            default: 'LIBRE'
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

RemoteTableSchema.index({ userId: 1, localId: 1 }, { unique: true });

export default mongoose.models.RemoteTable || mongoose.model<IRemoteTable>('RemoteTable', RemoteTableSchema);
