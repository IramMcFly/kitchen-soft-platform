import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

import { externalLoginSchema } from '@/lib/validations';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = externalLoginSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { message: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { email, password, deviceId, deviceName } = validation.data;

        await dbConnect();

        // Case insensitive search
        const emailRegex = new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        const user = await User.findOne({ email: { $regex: emailRegex } }).select('+password');

        if (!user) {
            return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
        }

        if (user.isActive === false) {
            return NextResponse.json({ message: 'Cuenta desactivada. Contacte soporte.' }, { status: 403 });
        }


        console.log('Login attempt:', { email, deviceId, deviceName });

        // Device Management Logic
        const existingDevice = user.devices.find((d: any) => d.deviceId === deviceId);

        if (existingDevice) {
            console.log('Existing device found:', existingDevice);
            // Update last login
            existingDevice.lastLogin = new Date();
            existingDevice.name = deviceName || existingDevice.name; // Update name if provided
        } else {
            console.log('Registering new device:', { deviceId, deviceName });
            // Check limits based on plan
            const deviceLimit = user.plan === 'FREE' ? 1 : 999;

            if (user.devices.length >= deviceLimit) {
                console.warn('Device limit reached for user:', user.email);
                return NextResponse.json(
                    { message: `Has alcanzado el límite de dispositivos para tu plan (${user.plan}). Desvincula un dispositivo para continuar.` },
                    { status: 403 }
                );
            }

            // Register new device
            user.devices.push({
                deviceId,
                name: deviceName || `Dispositivo ${user.devices.length + 1}`,
                lastLogin: new Date()
            });
        }

        await user.save();
        console.log('User saved with devices:', user.devices.length);

        // Generate JWT with jose
        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
        const token = await new SignJWT({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            plan: user.plan,
            restaurantName: user.restaurantName
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('30d')
            .sign(secret);

        return NextResponse.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                plan: user.plan,
                restaurantName: user.restaurantName,
                devices: user.devices // Return devices for verification
            }
        });

    } catch (error: any) {
        console.error('External Login Error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
