import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validations';
import { createSupabaseAuthClient, isSupabaseConfigured } from '@/lib/supabase';
import { ensureCloudProfileFromAuthUser } from '@/lib/cloud-profile';
import { getPlanCapabilities } from '@/lib/cloud-plan';

const COOKIE_NAME = 'ksp_token';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function resolveCookieMaxAge(expiresAt?: number | null) {
  if (!expiresAt) {
    return COOKIE_MAX_AGE_SECONDS;
  }

  const now = Math.floor(Date.now() / 1000);
  const ttl = Math.max(0, expiresAt - now);

  // Keep cookie lifetime aligned with token validity to avoid stale sessions.
  return ttl > 0 ? ttl : 60;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0]?.message || 'Credenciales inválidas' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { message: 'Supabase no está configurado correctamente' },
        { status: 503 }
      );
    }

    const supabase = createSupabaseAuthClient();
    if (!supabase) {
      return NextResponse.json(
        { message: 'No se pudo inicializar el cliente de autenticación' },
        { status: 500 }
      );
    }

    const { email, password } = validation.data;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user || !data.session) {
      return NextResponse.json(
        { message: 'Correo o contraseña incorrectos' },
        { status: 401 }
      );
    }

    const profile = await ensureCloudProfileFromAuthUser(data.user);

    if (!profile.is_active) {
      return NextResponse.json(
        { message: 'Cuenta desactivada. Contacte soporte.' },
        { status: 403 }
      );
    }

    const capabilities = getPlanCapabilities(profile.plan);

    const response = NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        plan: profile.plan,
        restaurantName: profile.restaurant_name,
        cloudSyncEnabled: profile.cloud_sync_enabled ?? capabilities.cloudSyncEnabled,
      },
    });

    response.cookies.set(COOKIE_NAME, data.session.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: resolveCookieMaxAge(data.session.expires_at),
    });

    return response;
  } catch (error) {
    console.error('Auth Login Error:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
