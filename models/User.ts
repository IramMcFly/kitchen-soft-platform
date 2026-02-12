import mongoose, { Schema, model, models } from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new Schema({
    name: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
    },
    email: {
        type: String,
        required: [true, 'El correo es obligatorio'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Por favor ingresa un correo válido',
        ],
    },
    restaurantName: {
        type: String,
        required: [true, 'El nombre del restaurante es obligatorio'],
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        select: false, // Don't select password by default
    },
    plan: {
        type: String,
        enum: ['FREE', 'MINI', 'MEDIUM'],
        default: 'FREE',
    },
    role: {
        type: String,
        enum: ['OWNER', 'ADMIN'],
        default: 'OWNER',
    },
    stripeCustomerId: {
        type: String,
        required: false,
    },
    subscriptionId: {
        type: String,
        required: false,
    },
    subscriptionStatus: {
        type: String,
        required: false,
    },
    devices: [{
        deviceId: { type: String, required: true },
        name: { type: String, required: true },
        lastLogin: { type: Date, default: Date.now }
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = models.User || model('User', UserSchema);

export default User;
