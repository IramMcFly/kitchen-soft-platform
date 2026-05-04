import { NextResponse } from 'next/server';
import { createSupabaseAuthClient, isSupabaseConfigured } from '@/lib/supabase';
import {
    ensureCloudProfileFromAuthUser,
    listCloudDevices,
    upsertCloudDevice,
} from '@/lib/cloud-profile';

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

        if (isSupabaseConfigured()) {
            const supabase = createSupabaseAuthClient();

            if (!supabase) {
                return NextResponse.json({ message: 'Supabase no está configurado' }, { status: 500 });
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error || !data.user || !data.session) {
                return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
            }

            const profile = await ensureCloudProfileFromAuthUser(data.user);

            if (!profile.is_active) {
                return NextResponse.json({ message: 'Cuenta desactivada. Contacte soporte.' }, { status: 403 });
            }

            if (deviceId) {
                await upsertCloudDevice({
                    userId: profile.id,
                    deviceId,
                    name: deviceName,
                });
            }

            const devices = await listCloudDevices(profile.id);
            const linkedAt = Date.now();

            return NextResponse.json({
                token: data.session.access_token,
                provider: 'supabase',
                session: {
                    linkedAt,
                },
                user: {
                    id: profile.id,
                    name: profile.name,
                    email: profile.email,
                    role: profile.role,
                    plan: profile.plan,
                    restaurantName: profile.restaurant_name,
                    cloudSyncEnabled: profile.cloud_sync_enabled,
                    devices,
                },
            });
        }

        return NextResponse.json(
            { message: 'Supabase no está configurado' },
            { status: 503 }
        );

    } catch (error: any) {
        console.error('External Login Error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
