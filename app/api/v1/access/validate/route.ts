import { NextResponse } from 'next/server';
import { authenticateCloudToken, getBearerTokenFromRequest } from '@/lib/cloud-auth';
import { isCloudDeviceLinked } from '@/lib/cloud-profile';
import { getPlanCapabilities } from '@/lib/cloud-plan';

function getDeviceIdFromRequest(req: Request): string | null {
    const headerDeviceId = req.headers.get('x-device-id') || req.headers.get('x-kitchen-device-id');

    if (headerDeviceId?.trim()) {
        return headerDeviceId.trim();
    }

    const queryDeviceId = new URL(req.url).searchParams.get('deviceId');

    if (queryDeviceId?.trim()) {
        return queryDeviceId.trim();
    }

    return null;
}

export async function GET(req: Request) {
    try {
        const token = getBearerTokenFromRequest(req);
        const deviceId = getDeviceIdFromRequest(req);

        if (!token) {
            return NextResponse.json({ message: 'Token no proporcionado' }, { status: 401 });
        }

        if (!deviceId) {
            return NextResponse.json(
                {
                    message: 'ID de dispositivo no proporcionado',
                    code: 'MISSING_DEVICE_ID',
                },
                { status: 400 }
            );
        }

        const identity = await authenticateCloudToken(token);

        if (!identity) {
            return NextResponse.json({ message: 'Token inválido o expirado' }, { status: 401 });
        }

        const linked = await isCloudDeviceLinked(identity.userId, deviceId);

        if (!linked) {
            return NextResponse.json(
                {
                    message: 'Dispositivo desvinculado o no autorizado',
                    code: 'DEVICE_UNLINKED',
                },
                { status: 403 }
            );
        }

        const capabilities = getPlanCapabilities(identity.plan);

        return NextResponse.json({
            valid: true,
            message: 'Acceso cloud activo',
            deviceId,
            access: {
                plan: identity.plan,
                restaurantName: identity.restaurantName,
                role: identity.role,
                expiresAt: identity.expiresAt,
                limits: capabilities.limits,
                cloudSyncEnabled: identity.cloudSyncEnabled,
                deviceAuthorized: true,
            },
            provider: identity.provider,
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Access Validation Error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor', error: message },
            { status: 500 }
        );
    }
}
