import { NextResponse } from 'next/server';
import { createSupabaseAdminClient, isSupabaseConfigured } from '@/lib/supabase';
import { externalForgotPasswordSchema } from '@/lib/validations';
import { buildPasswordResetTemplate } from '@/lib/email/templates';
import { isEmailConfigured, sendEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = externalForgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0]?.message || 'Datos invalidos' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { message: 'Supabase no esta configurado' },
        { status: 503 }
      );
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { message: 'Servicio de correo no configurado' },
        { status: 503 }
      );
    }

    const supabase = createSupabaseAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { message: 'No se pudo inicializar Supabase' },
        { status: 500 }
      );
    }

    const origin = new URL(req.url).origin;
    const redirectTo = `${origin}/auth/reset-password`;

    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: validation.data.email,
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.error('Forgot Password API Error:', error);
      return NextResponse.json({
        success: true,
        message: 'Si el correo existe, enviaremos instrucciones de recuperacion.',
      });
    }

    const actionLink = data?.properties?.action_link;

    if (!actionLink) {
      console.error('Forgot Password API Error: Missing recovery action link');
      return NextResponse.json({
        success: true,
        message: 'Si el correo existe, enviaremos instrucciones de recuperacion.',
      });
    }

    const template = buildPasswordResetTemplate({
      resetUrl: actionLink,
      supportEmail: process.env.EMAIL_SUPPORT,
    });

    await sendEmail({
      to: validation.data.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    // Never reveal whether the email exists.
    return NextResponse.json({
      success: true,
      message: 'Si el correo existe, enviaremos instrucciones de recuperacion.',
    });
  } catch (error) {
    console.error('Forgot Password Route Error:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
