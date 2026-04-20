import { NextResponse } from 'next/server';
import { authenticateCloudToken, getCloudTokenFromRequest } from '@/lib/cloud-auth';
import { listCloudDevices } from '@/lib/cloud-profile';
import { createSupabaseAdminClient } from '@/lib/supabase';
import { normalizeCloudPlan } from '@/lib/cloud-plan';

export async function GET(req: Request) {
    try {
        const token = getCloudTokenFromRequest(req);
        const identity = token ? await authenticateCloudToken(token) : null;

        if (!identity) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        if (identity.role !== 'ADMIN') {
            return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
        }

        const admin = createSupabaseAdminClient();
        if (!admin) {
            return NextResponse.json(
                { message: 'Supabase no está configurado correctamente' },
                { status: 503 }
            );
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search')?.trim();

        let query = admin
            .from('user_profiles')
            .select('id, name, email, restaurant_name, role, plan, is_active, created_at')
            .order('created_at', { ascending: false });

        if (search) {
            const safeSearch = search.replace(/,/g, ' ').replace(/%/g, '');
            query = query.or(`name.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%,restaurant_name.ilike.%${safeSearch}%`);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Error al listar usuarios: ${error.message}`);
        }

        const users = await Promise.all(
            (data || []).map(async (row: any) => {
                const devices = await listCloudDevices(String(row.id)).catch(() => []);

                return {
                    _id: String(row.id),
                    name: String(row.name || ''),
                    email: String(row.email || ''),
                    restaurantName: String(row.restaurant_name || ''),
                    role: String(row.role || 'OWNER'),
                    plan: normalizeCloudPlan(String(row.plan || 'FREE')),
                    isActive: row.is_active !== false,
                    createdAt: row.created_at,
                    devices,
                };
            })
        );

        return NextResponse.json({ users });

    } catch (error: any) {
        console.error('Admin Users Error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
