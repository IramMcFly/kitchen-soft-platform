import { NextRequest, NextResponse } from 'next/server';
import { authenticateCloudToken, getCloudTokenFromRequest } from '@/lib/cloud-auth';
import { upsertCloudSyncPayload } from '@/lib/cloud-sync-store';

export async function POST(req: NextRequest) {
    try {
        const token = getCloudTokenFromRequest(req);

        if (!token) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        const identity = await authenticateCloudToken(token);

        if (!identity?.userId) {
            return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
        }

        if (!identity.cloudSyncEnabled) {
            return NextResponse.json(
                { message: 'Tu plan no incluye sincronización en la nube' },
                { status: 403 }
            );
        }

        const body = await req.json();
        const payload = {
            users: Array.isArray(body?.users) ? body.users : [],
            products: Array.isArray(body?.products) ? body.products : [],
            tables: Array.isArray(body?.tables) ? body.tables : [],
            sessions: Array.isArray(body?.sessions) ? body.sessions : [],
            orders: Array.isArray(body?.orders) ? body.orders : [],
            categories: Array.isArray(body?.categories) ? body.categories : [],
            inventoryMovements: Array.isArray(body?.inventoryMovements) ? body.inventoryMovements : [],
        };

        const results = await upsertCloudSyncPayload(identity.userId, payload, token);
        const syncedCount = Object.values(results).reduce((sum, value) => sum + Number(value || 0), 0);

        return NextResponse.json({
            success: true,
            provider: 'supabase',
            results,
            syncedCount,
            timestamp: new Date()
        });

    } catch (error: any) {
        console.error('Sync error:', error);
        return NextResponse.json(
            { message: error.message || 'Error interno en sincronización' },
            { status: 500 }
        );
    }
}
