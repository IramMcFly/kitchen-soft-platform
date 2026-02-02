import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Correo electrónico inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    restaurantName: z.string().min(2, 'El nombre del restaurante es obligatorio'),
});

export const loginSchema = z.object({
    email: z.string().email('Correo electrónico inválido'),
    password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const externalLoginSchema = z.object({
    email: z.string().email('Correo electrónico inválido'),
    password: z.string().min(1, 'La contraseña es obligatoria'),
    deviceId: z.string().min(1, 'ID del dispositivo obligatorio'),
    deviceName: z.string().optional(),
});

export const profileUpdateSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    restaurantName: z.string().min(2, 'El nombre del restaurante es obligatorio'),
});
