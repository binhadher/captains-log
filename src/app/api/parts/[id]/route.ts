import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// PATCH /api/parts/[id] - Update a part
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: partId } = await params;
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

    // Get the part and verify ownership through boat
    const { data: part } = await supabase
      .from('parts')
      .select('*, boats!inner(owner_id)')
      .eq('id', partId)
      .single();

    if (!part || part.boats.owner_id !== dbUser.id) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 });
    }

    const body = await request.json();

    // Update the part
    const { data: updatedPart, error } = await supabase
      .from('parts')
      .update({
        name: body.name?.trim() || part.name,
        brand: body.brand?.trim() || null,
        part_number: body.part_number?.trim() || null,
        size_specs: body.size_specs?.trim() || null,
        supplier: body.supplier?.trim() || null,
        install_date: body.install_date || null,
        notes: body.notes?.trim() || null,
        photo_url: body.photo_url || null,
      })
      .eq('id', partId)
      .select()
      .single();

    if (error) {
      console.error('Error updating part:', error);
      return NextResponse.json({ error: 'Failed to update part' }, { status: 500 });
    }

    return NextResponse.json({ part: updatedPart });
  } catch (error) {
    console.error('PATCH /api/parts/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/parts/[id] - Delete a part
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: partId } = await params;
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

    // Get the part and verify ownership through boat
    const { data: part } = await supabase
      .from('parts')
      .select('*, boats!inner(owner_id)')
      .eq('id', partId)
      .single();

    if (!part || part.boats.owner_id !== dbUser.id) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 });
    }

    // Delete the part
    const { error } = await supabase
      .from('parts')
      .delete()
      .eq('id', partId);

    if (error) {
      console.error('Error deleting part:', error);
      return NextResponse.json({ error: 'Failed to delete part' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/parts/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
