import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/boats/[id] - Get a single boat
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

    // Fetch the boat (only if owned by user)
    const { data: boat, error } = await supabase
      .from('boats')
      .select('*')
      .eq('id', id)
      .eq('owner_id', dbUser.id)
      .single();

    if (error || !boat) {
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
    }

    return NextResponse.json({ boat });
  } catch (error) {
    console.error('GET /api/boats/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/boats/[id] - Update a boat (full replace)
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

    // Verify ownership
    const { data: existing } = await supabase
      .from('boats')
      .select('id')
      .eq('id', id)
      .eq('owner_id', dbUser.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
    }

    const body = await request.json();

    // Update the boat
    const { data: boat, error } = await supabase
      .from('boats')
      .update({
        name: body.name,
        make: body.make || null,
        model: body.model || null,
        year: body.year || null,
        length: body.length || null,
        hull_id: body.hull_id || null,
        home_port: body.home_port || null,
        number_of_engines: body.number_of_engines || 2,
        engines: body.engines || [],
        generator_brand: body.generator_brand || null,
        generator_model: body.generator_model || null,
        generator_data_plate: body.generator_data_plate || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating boat:', error);
      return NextResponse.json({ error: 'Failed to update boat' }, { status: 500 });
    }

    return NextResponse.json({ boat });
  } catch (error) {
    console.error('PUT /api/boats/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/boats/[id] - Partial update a boat
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
    
    // Get user's database ID
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('boats')
      .select('*')
      .eq('id', id)
      .eq('owner_id', dbUser.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
    }

    const body = await request.json();

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    
    const allowedFields = [
      'name', 'make', 'model', 'year', 'length', 'hull_id', 'home_port',
      'number_of_engines', 'engines', 'generator_brand', 'generator_model',
      'generator_data_plate', 'boat_data_plate', 'photo_url'
    ];
    
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Update the boat
    const { data: boat, error } = await supabase
      .from('boats')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating boat:', error);
      return NextResponse.json({ error: 'Failed to update boat' }, { status: 500 });
    }

    return NextResponse.json({ boat });
  } catch (error) {
    console.error('PATCH /api/boats/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/boats/[id] - Delete a boat
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

    // Delete the boat (only if owned by user)
    const { error } = await supabase
      .from('boats')
      .delete()
      .eq('id', id)
      .eq('owner_id', dbUser.id);

    if (error) {
      console.error('Error deleting boat:', error);
      return NextResponse.json({ error: 'Failed to delete boat' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/boats/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
