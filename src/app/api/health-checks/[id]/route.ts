export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// PATCH /api/health-checks/[id] - Update a health check
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServerClient();
    
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify ownership through boat
    const { data: check } = await supabase
      .from('health_checks')
      .select('*, boats!inner(owner_id)')
      .eq('id', id)
      .single();

    if (!check || check.boats.owner_id !== dbUser.id) {
      return NextResponse.json({ error: 'Health check not found' }, { status: 404 });
    }

    const body = await request.json();

    // Build update object - only include fields that are explicitly provided
    const updateData: Record<string, unknown> = {};
    
    if (body.check_type !== undefined) updateData.check_type = body.check_type || check.check_type;
    if (body.title !== undefined) updateData.title = body.title?.trim() || check.title;
    if (body.quantity !== undefined) updateData.quantity = body.quantity?.trim() || null;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;
    if (body.date !== undefined) updateData.date = body.date || check.date;
    if (body.photo_url !== undefined) updateData.photo_url = body.photo_url || null;
    if (body.voice_note_url !== undefined) updateData.voice_note_url = body.voice_note_url || null;

    const { data: updated, error } = await supabase
      .from('health_checks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating health check:', error);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ check: updated });
  } catch (error) {
    console.error('PATCH /api/health-checks/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/health-checks/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServerClient();
    
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify ownership
    const { data: check } = await supabase
      .from('health_checks')
      .select('*, boats!inner(owner_id)')
      .eq('id', id)
      .single();

    if (!check || check.boats.owner_id !== dbUser.id) {
      return NextResponse.json({ error: 'Health check not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('health_checks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting health check:', error);
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/health-checks/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
