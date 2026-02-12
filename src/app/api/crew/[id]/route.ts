export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/crew/[id] - Get a crew member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: crewId } = await params;
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

    // Get crew member with boat info
    const { data: crew, error } = await supabase
      .from('crew_members')
      .select(`
        *,
        boats (
          id,
          name,
          owner_id
        )
      `)
      .eq('id', crewId)
      .single();

    if (error || !crew) {
      return NextResponse.json({ error: 'Crew member not found' }, { status: 404 });
    }

    // Verify ownership
    if ((crew.boats as any).owner_id !== dbUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ crew });
  } catch (error) {
    console.error('GET /api/crew/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/crew/[id] - Update a crew member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: crewId } = await params;
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

    // Get existing crew member
    const { data: existingCrew } = await supabase
      .from('crew_members')
      .select(`
        *,
        boats (
          owner_id
        )
      `)
      .eq('id', crewId)
      .single();

    if (!existingCrew) {
      return NextResponse.json({ error: 'Crew member not found' }, { status: 404 });
    }

    // Verify ownership
    if ((existingCrew.boats as any).owner_id !== dbUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update crew member
    const updateData: Record<string, any> = {};
    
    const allowedFields = [
      'name', 'title', 'title_other', 'phone', 'email',
      'emergency_contact_name', 'emergency_contact_phone',
      'passport_url', 'passport_number', 'passport_expiry', 'passport_country',
      'emirates_id_url', 'emirates_id_number', 'emirates_id_expiry',
      'marine_license_url', 'marine_license_number', 'marine_license_expiry', 'marine_license_type',
      'status', 'start_date', 'end_date', 'notes', 'photo_url'
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field] || null;
      }
    }

    const { data: crew, error } = await supabase
      .from('crew_members')
      .update(updateData)
      .eq('id', crewId)
      .select()
      .single();

    if (error) {
      console.error('Error updating crew member:', error);
      return NextResponse.json({ error: 'Failed to update crew member' }, { status: 500 });
    }

    return NextResponse.json({ crew });
  } catch (error) {
    console.error('PUT /api/crew/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/crew/[id] - Delete a crew member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: crewId } = await params;
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

    // Get existing crew member
    const { data: existingCrew } = await supabase
      .from('crew_members')
      .select(`
        *,
        boats (
          owner_id
        )
      `)
      .eq('id', crewId)
      .single();

    if (!existingCrew) {
      return NextResponse.json({ error: 'Crew member not found' }, { status: 404 });
    }

    // Verify ownership
    if ((existingCrew.boats as any).owner_id !== dbUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete crew member
    const { error } = await supabase
      .from('crew_members')
      .delete()
      .eq('id', crewId);

    if (error) {
      console.error('Error deleting crew member:', error);
      return NextResponse.json({ error: 'Failed to delete crew member' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/crew/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
