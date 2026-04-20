import { NextResponse } from 'next/server';
import { authenticateCloudToken, getBearerTokenFromRequest } from '@/lib/cloud-auth';
import { getPlanCapabilities } from '@/lib/cloud-plan';

export async function GET(req: Request) {
    try {
        const token = getBearerTokenFromRequest(req);

        if (!token) {
            return NextResponse.json({ message: 'Token no proporcionado' }, { status: 401 });
        }

        const identity = await authenticateCloudToken(token);

        if (!identity) {
            return NextResponse.json({ message: 'Token inválido o expirado' }, { status: 401 });
        }

        const capabilities = getPlanCapabilities(identity.plan);

        return NextResponse.json({
            valid: true,
            message: 'Acceso cloud activo',
            access: {
                plan: identity.plan,
                restaurantName: identity.restaurantName,
                role: identity.role,
                expiresAt: identity.expiresAt,
                limits: capabilities.limits,
                cloudSyncEnabled: identity.cloudSyncEnabled,
            },
            provider: identity.provider,
        });

    } catch (error: any) {
        console.error('Access Validation Error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor', error: error.message },
            { status: 500 }
        );
    }
}
