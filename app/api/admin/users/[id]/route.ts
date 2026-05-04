import { NextResponse, NextRequest } from 'next/server';
import { authenticateCloudToken, getCloudTokenFromRequest } from '@/lib/cloud-auth';
import { updateCloudProfileById, getCloudProfileById } from '@/lib/cloud-profile';
import { createSupabaseAdminClient } from '@/lib/supabase';
import { normalizeCloudPlan } from '@/lib/cloud-plan';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const token = getCloudTokenFromRequest(req);
    const identity = token ? await authenticateCloudToken(token) : null;

    if (!identity || identity.role !== 'ADMIN') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { plan, name, restaurantName, role, isActive } = body;

    // Validate inputs
    if (plan && !['FREE', 'PRO'].includes(plan)) {
      return NextResponse.json({ message: 'Plan inválido' }, { status: 400 });
    }

    if (role && !['OWNER', 'ADMIN'].includes(role)) {
      return NextResponse.json({ message: 'Role inválido' }, { status: 400 });
    }

    if (isActive !== undefined && typeof isActive !== 'boolean') {
      return NextResponse.json({ message: 'isActive debe ser boolean' }, { status: 400 });
    }

    // Update profile
    const updated = await updateCloudProfileById(targetUserId, {
      name: name ? String(name).trim() : undefined,
      restaurantName: restaurantName ? String(restaurantName).trim() : undefined,
      plan: plan ? normalizeCloudPlan(plan) : undefined,
      role: role ? (role === 'ADMIN' ? 'ADMIN' : 'OWNER') : undefined,
      isActive: isActive !== undefined ? isActive : undefined,
    });

    return NextResponse.json({
      success: true,
      user: {
        _id: updated.id,
        name: updated.name,
        email: updated.email,
        restaurantName: updated.restaurant_name,
        role: updated.role,
        plan: updated.plan,
        isActive: updated.is_active,
        createdAt: updated.id,
      },
    });
  } catch (error: any) {
    console.error('Admin PUT Error:', error);
    return NextResponse.json(
      { message: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const token = getCloudTokenFromRequest(req);
    const identity = token ? await authenticateCloudToken(token) : null;

    if (!identity || identity.role !== 'ADMIN') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    // Prevent self-deletion
    if (targetUserId === identity.userId) {
      return NextResponse.json(
        { message: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();
    if (!admin) {
      return NextResponse.json(
        { message: 'Supabase no está configurado' },
        { status: 503 }
      );
    }

    // Soft delete: mark as inactive
    await updateCloudProfileById(targetUserId, { isActive: false });

    return NextResponse.json({ success: true, message: 'Usuario desactivado' });
  } catch (error: any) {
    console.error('Admin DELETE Error:', error);
    return NextResponse.json(
      { message: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
