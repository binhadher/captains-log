export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/boats/[id]/health-checks - List health checks for a boat
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

    // Fetch health checks with component names
    const { data: checks, error } = await supabase
      .from('health_checks')
      .select(`
        *,
        boat_components(name)
      `)
      .eq('boat_id', boatId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching health checks:', error);
      return NextResponse.json({ error: 'Failed to fetch health checks' }, { status: 500 });
    }

    // Flatten component name
    const checksWithComponentName = (checks || []).map(check => ({
      ...check,
      component_name: check.boat_components?.name || null,
      boat_components: undefined,
    }));

    return NextResponse.json({ checks: checksWithComponentName });
  } catch (error) {
    console.error('GET /api/boats/[id]/health-checks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/boats/[id]/health-checks - Create a new health check
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
    if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Create health check
    const { data: check, error } = await supabase
      .from('health_checks')
      .insert({
        boat_id: boatId,
        component_id: body.component_id || null,
        check_type: body.check_type || 'other',
        title: body.title.trim(),
        quantity: body.quantity || null,
        notes: body.notes || null,
        photo_url: body.photo_url || null,
        voice_note_url: body.voice_note_url || null,
        date: body.date || new Date().toISOString().split('T')[0],
        created_by: dbUser.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating health check:', error);
      return NextResponse.json({ error: 'Failed to create health check' }, { status: 500 });
    }

    return NextResponse.json({ check }, { status: 201 });
  } catch (error) {
    console.error('POST /api/boats/[id]/health-checks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
