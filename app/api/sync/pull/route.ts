import { NextRequest, NextResponse } from 'next/server';
import { authenticateCloudToken, getCloudTokenFromRequest } from '@/lib/cloud-auth';
import { pullCloudSyncPayload } from '@/lib/cloud-sync-store';

export async function GET(req: NextRequest) {
    try {
        const token = getCloudTokenFromRequest(req);

        if (!token) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        const identity = await authenticateCloudToken(token);

        if (!identity?.userId) {
            return NextResponse.json({ message: 'Usuario no identificado' }, { status: 401 });
        }

        if (!identity.cloudSyncEnabled) {
            return NextResponse.json(
                { message: 'Tu plan no incluye sincronización en la nube' },
                { status: 403 }
            );
        }

        const data = await pullCloudSyncPayload(identity.userId, token);

        return NextResponse.json({
            success: true,
            provider: 'supabase',
            data: {
                users: data.users || [],
                products: data.products || [],
                tables: data.tables || [],
                sessions: data.sessions || [],
                orders: data.orders || [],
                categories: data.categories || [],
                inventoryMovements: data.inventoryMovements || [],
            },
            timestamp: new Date()
        });

    } catch (error: any) {
        console.error('Restore error:', error);
        return NextResponse.json(
            { message: error.message || 'Error interno al restaurar datos' },
            { status: 500 }
        );
    }
}
