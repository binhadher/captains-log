import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/boats/[id]/crew - Get all crew members for a boat
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

    // Verify boat ownership/access
    const { data: boat } = await supabase
      .from('boats')
      .select('id')
      .eq('id', boatId)
      .eq('owner_id', dbUser.id)
      .single();

    if (!boat) {
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
    }

    // Get crew members
    const { data: crew, error } = await supabase
      .from('crew_members')
      .select('*')
      .eq('boat_id', boatId)
      .order('status', { ascending: true })  // Active first
      .order('title', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching crew:', error);
      return NextResponse.json({ error: 'Failed to fetch crew' }, { status: 500 });
    }

    return NextResponse.json({ crew: crew || [] });
  } catch (error) {
    console.error('GET /api/boats/[id]/crew error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/boats/[id]/crew - Add a crew member
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

    // Validate required fields
    if (!body.name || !body.title) {
      return NextResponse.json({ error: 'Name and title are required' }, { status: 400 });
    }

    // Create crew member
    const crewData = {
      boat_id: boatId,
      name: body.name,
      title: body.title,
      title_other: body.title_other || null,
      phone: body.phone || null,
      email: body.email || null,
      emergency_contact_name: body.emergency_contact_name || null,
      emergency_contact_phone: body.emergency_contact_phone || null,
      passport_url: body.passport_url || null,
      passport_number: body.passport_number || null,
      passport_expiry: body.passport_expiry || null,
      passport_country: body.passport_country || null,
      emirates_id_url: body.emirates_id_url || null,
      emirates_id_number: body.emirates_id_number || null,
      emirates_id_expiry: body.emirates_id_expiry || null,
      marine_license_url: body.marine_license_url || null,
      marine_license_number: body.marine_license_number || null,
      marine_license_expiry: body.marine_license_expiry || null,
      marine_license_type: body.marine_license_type || null,
      status: body.status || 'active',
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      notes: body.notes || null,
      photo_url: body.photo_url || null,
    };

    const { data: crew, error } = await supabase
      .from('crew_members')
      .insert(crewData)
      .select()
      .single();

    if (error) {
      console.error('Error creating crew member:', error);
      return NextResponse.json({ error: 'Failed to create crew member' }, { status: 500 });
    }

    return NextResponse.json({ crew }, { status: 201 });
  } catch (error) {
    console.error('POST /api/boats/[id]/crew error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
