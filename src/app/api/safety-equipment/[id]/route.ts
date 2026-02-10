import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/safety-equipment/[id] - Get single item
export async function GET(
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
    
    // Get user's database ID
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get equipment with boat ownership check
    const { data: equipment, error } = await supabase
      .from('safety_equipment')
      .select(`
        *,
        boats!inner(owner_id)
      `)
      .eq('id', id)
      .eq('boats.owner_id', dbUser.id)
      .single();

    if (error || !equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    return NextResponse.json({ equipment });
  } catch (error) {
    console.error('GET /api/safety-equipment/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/safety-equipment/[id] - Update item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = createServerClient();
    
    // Get user's database ID
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify ownership via boat
    const { data: existing } = await supabase
      .from('safety_equipment')
      .select(`
        id,
        boats!inner(owner_id)
      `)
      .eq('id', id)
      .eq('boats.owner_id', dbUser.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    // Build update object - only include fields that are explicitly provided
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if (body.type !== undefined) updateData.type = body.type;
    if (body.type_other !== undefined) updateData.type_other = body.type_other;
    if (body.quantity !== undefined) updateData.quantity = body.quantity || 1;
    if (body.expiry_date !== undefined) updateData.expiry_date = body.expiry_date || null;
    if (body.last_service_date !== undefined) updateData.last_service_date = body.last_service_date || null;
    if (body.service_interval_months !== undefined) updateData.service_interval_months = body.service_interval_months || null;
    if (body.certification_number !== undefined) updateData.certification_number = body.certification_number || null;
    if (body.notes !== undefined) updateData.notes = body.notes || null;
    if (body.photo_url !== undefined) updateData.photo_url = body.photo_url || null;
    if (body.voice_note_url !== undefined) updateData.voice_note_url = body.voice_note_url || null;

    // Calculate next service date if last service and interval provided
    if (body.last_service_date && body.service_interval_months) {
      const lastService = new Date(body.last_service_date);
      lastService.setMonth(lastService.getMonth() + body.service_interval_months);
      updateData.next_service_date = lastService.toISOString().split('T')[0];
    } else if (body.next_service_date !== undefined) {
      updateData.next_service_date = body.next_service_date || null;
    }

    // Update
    const { data: equipment, error } = await supabase
      .from('safety_equipment')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating safety equipment:', error);
      return NextResponse.json({ error: 'Failed to update safety equipment' }, { status: 500 });
    }

    return NextResponse.json({ equipment });
  } catch (error) {
    console.error('PUT /api/safety-equipment/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/safety-equipment/[id] - Delete item
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
    
    // Get user's database ID
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify ownership via boat
    const { data: existing } = await supabase
      .from('safety_equipment')
      .select(`
        id,
        boats!inner(owner_id)
      `)
      .eq('id', id)
      .eq('boats.owner_id', dbUser.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    // Delete
    const { error } = await supabase
      .from('safety_equipment')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting safety equipment:', error);
      return NextResponse.json({ error: 'Failed to delete safety equipment' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/safety-equipment/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
