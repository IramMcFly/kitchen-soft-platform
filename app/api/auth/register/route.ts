import { NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validations';
import { createSupabaseAdminClient, isSupabaseConfigured } from '@/lib/supabase';
import { upsertCloudProfile } from '@/lib/cloud-profile';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const validation = registerSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { message: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { name, email, password, restaurantName } = validation.data;

        if (isSupabaseConfigured()) {
            const admin = createSupabaseAdminClient();

            if (!admin) {
                return NextResponse.json(
                    { message: 'Supabase no está configurado correctamente' },
                    { status: 500 }
                );
            }

            const { data, error } = await admin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: {
                    name,
                    restaurantName,
                    role: 'OWNER',
                    plan: 'FREE',
                },
            });

            if (error || !data.user) {
                const alreadyExists = /already|registered|exists/i.test(error?.message || '');
                return NextResponse.json(
                    { message: alreadyExists ? 'El correo electrónico ya está registrado' : (error?.message || 'No se pudo crear la cuenta') },
                    { status: alreadyExists ? 400 : 500 }
                );
            }

            const profile = await upsertCloudProfile({
                id: data.user.id,
                email,
                name,
                restaurantName,
                plan: 'FREE',
                role: 'OWNER',
                isActive: true,
                cloudSyncEnabled: false,
            });

            return NextResponse.json(
                {
                    message: 'Usuario registrado exitosamente',
                    user: {
                        id: profile.id,
                        name: profile.name,
                        email: profile.email,
                    }
                },
                { status: 201 }
            );
        }

        return NextResponse.json(
            { message: 'Supabase no está configurado correctamente' },
            { status: 503 }
        );
    } catch (error: any) {
        console.error('Registration Error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
