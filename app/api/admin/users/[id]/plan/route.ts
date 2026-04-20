import { NextResponse } from 'next/server';
import { authenticateCloudToken, getCloudTokenFromRequest } from '@/lib/cloud-auth';
import { updateCloudProfileById } from '@/lib/cloud-profile';
import { getPlanCapabilities, normalizeCloudPlan } from '@/lib/cloud-plan';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = getCloudTokenFromRequest(req);
        const identity = token ? await authenticateCloudToken(token) : null;

        if (!identity) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        if (identity.role !== 'ADMIN') {
            return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
        }

        const resolvedParams = await params;
        const { id } = resolvedParams;
        const { plan } = await req.json();

        if (!plan || typeof plan !== 'string') {
            return NextResponse.json({ message: 'Plan inválido' }, { status: 400 });
        }

        const normalizedPlan = normalizeCloudPlan(plan);
        const capabilities = getPlanCapabilities(normalizedPlan);

        const updated = await updateCloudProfileById(id, {
            plan: normalizedPlan,
            cloudSyncEnabled: capabilities.cloudSyncEnabled,
        });

        return NextResponse.json({
            message: `Plan actualizado a ${normalizedPlan}`,
            user: {
                id: updated.id,
                plan: updated.plan,
                cloudSyncEnabled: updated.cloud_sync_enabled,
            },
        });
    } catch (error: any) {
        if (String(error?.message || '').toLowerCase().includes('not found')) {
            return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
        }

        console.error('Admin Update Plan Error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
