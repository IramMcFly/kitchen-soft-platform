import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        const { deviceId } = await req.json();

        if (!deviceId) {
            return NextResponse.json({ message: 'ID de dispositivo requerido' }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
        }

        // Filter out the device to delete
        const initialCount = user.devices.length;
        user.devices = user.devices.filter((d: any) => d.deviceId !== deviceId);

        if (user.devices.length === initialCount) {
            return NextResponse.json({ message: 'Dispositivo no encontrado' }, { status: 404 });
        }

        await user.save();

        return NextResponse.json({
            message: 'Dispositivo desvinculado exitosamente',
            devices: user.devices
        });

    } catch (error: any) {
        console.error('Device Delete Error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor', error: error.message },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });

        return NextResponse.json({ devices: user.devices || [] });

    } catch (error: any) {
        return NextResponse.json(
            { message: 'Error interno del servidor', error: error.message },
            { status: 500 }
        );
    }
}
