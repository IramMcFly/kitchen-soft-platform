import { NextResponse } from 'next/server';
import { authenticateCloudToken, getCloudTokenFromRequest } from '@/lib/cloud-auth';
import { deleteCloudDevice, listCloudDevices } from '@/lib/cloud-profile';

export async function DELETE(req: Request) {
    try {
        const token = getCloudTokenFromRequest(req);
        const identity = token ? await authenticateCloudToken(token) : null;

        if (!identity) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        const { deviceId } = await req.json();

        if (!deviceId) {
            return NextResponse.json({ message: 'ID de dispositivo requerido' }, { status: 400 });
        }

        const removed = await deleteCloudDevice(identity.userId, deviceId);

        if (!removed) {
            return NextResponse.json({ message: 'Dispositivo no encontrado' }, { status: 404 });
        }

        const devices = await listCloudDevices(identity.userId);

        return NextResponse.json({
            message: 'Dispositivo desvinculado exitosamente',
            devices,
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
        const token = getCloudTokenFromRequest(req);
        const identity = token ? await authenticateCloudToken(token) : null;

        if (!identity) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        const devices = await listCloudDevices(identity.userId);
        return NextResponse.json({ devices });

    } catch (error: any) {
        return NextResponse.json(
            { message: 'Error interno del servidor', error: error.message },
            { status: 500 }
        );
    }
}
