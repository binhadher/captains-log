export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/crew/[id]/profile - Get own crew profile (for crew members to view their own profile)
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

    // Get crew member with boat info
    const { data: crew, error } = await supabase
      .from('crew_members')
      .select(`
        *,
        boats (
          id,
          name,
          make,
          model,
          photo_url,
          owner_id
        )
      `)
      .eq('id', crewId)
      .single();

    if (error || !crew) {
      return NextResponse.json({ error: 'Crew member not found' }, { status: 404 });
    }

    // Get user's database ID
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is the linked crew member OR the boat owner
    const isOwnProfile = crew.user_id === userId;
    const isOwner = (crew.boats as any).owner_id === dbUser.id;

    if (!isOwnProfile && !isOwner) {
      return NextResponse.json({ error: 'You do not have permission to view this profile' }, { status: 403 });
    }

    // Return profile with boat info
    return NextResponse.json({ 
      crew: {
        id: crew.id,
        name: crew.name,
        title: crew.title,
        title_other: crew.title_other,
        phone: crew.phone,
        email: crew.email,
        photo_url: crew.photo_url,
        passport_number: crew.passport_number,
        passport_expiry: crew.passport_expiry,
        passport_country: crew.passport_country,
        passport_url: crew.passport_url,
        emirates_id_number: crew.emirates_id_number,
        emirates_id_expiry: crew.emirates_id_expiry,
        emirates_id_url: crew.emirates_id_url,
        marine_license_number: crew.marine_license_number,
        marine_license_expiry: crew.marine_license_expiry,
        marine_license_type: crew.marine_license_type,
        marine_license_url: crew.marine_license_url,
        notes: crew.notes,
        boat: {
          id: (crew.boats as any).id,
          name: (crew.boats as any).name,
          make: (crew.boats as any).make,
          model: (crew.boats as any).model,
          photo_url: (crew.boats as any).photo_url,
        }
      }
    });
  } catch (error) {
    console.error('GET /api/crew/[id]/profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
