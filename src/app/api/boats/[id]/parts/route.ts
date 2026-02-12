export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/boats/[id]/parts - List parts for a boat
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: boatId } = await params;
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

    // Verify boat ownership
    const { data: boat } = await supabase
      .from('boats')
      .select('id')
      .eq('id', boatId)
      .eq('owner_id', dbUser.id)
      .single();

    if (!boat) {
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
    }

    // Fetch parts with component names
    const { data: parts, error } = await supabase
      .from('parts')
      .select(`
        *,
        boat_components(name)
      `)
      .eq('boat_id', boatId)
      .order('name');

    if (error) {
      console.error('Error fetching parts:', error);
      return NextResponse.json({ error: 'Failed to fetch parts' }, { status: 500 });
    }

    // Flatten component name
    const partsWithComponentName = (parts || []).map(part => ({
      ...part,
      component_name: part.boat_components?.name || null,
      boat_components: undefined,
    }));

    return NextResponse.json({ parts: partsWithComponentName });
  } catch (error) {
    console.error('GET /api/boats/[id]/parts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/boats/[id]/parts - Create a new part
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: boatId } = await params;
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

    // Verify boat ownership
    const { data: boat } = await supabase
      .from('boats')
      .select('id')
      .eq('id', boatId)
      .eq('owner_id', dbUser.id)
      .single();

    if (!boat) {
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json({ error: 'Part name is required' }, { status: 400 });
    }

    // Check if we need to create parts for multiple components (e.g., all engines)
    const componentIds = body.apply_to_component_ids || [body.component_id || null];
    
    const partsToCreate = componentIds.map((compId: string | null) => ({
      boat_id: boatId,
      component_id: compId,
      name: body.name.trim(),
      brand: body.brand || null,
      part_number: body.part_number || null,
      size_specs: body.size_specs || null,
      supplier: body.supplier || null,
      install_date: body.install_date || null,
      notes: body.notes || null,
      photo_url: body.photo_url || null,
      voice_note_url: body.voice_note_url || null,
      created_by: dbUser.id,
    }));

    // Create part(s)
    const { data: parts, error } = await supabase
      .from('parts')
      .insert(partsToCreate)
      .select();

    if (error) {
      console.error('Error creating part:', error);
      return NextResponse.json({ error: 'Failed to create part' }, { status: 500 });
    }

    // Return single part for backward compatibility, or array if multiple
    const result = parts.length === 1 ? { part: parts[0] } : { parts };
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST /api/boats/[id]/parts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
