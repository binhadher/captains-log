export const dynamic = 'force-dynamic';

import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/boats - List user's boats
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();
    
    // First ensure user exists in our users table
    const dbUser = await ensureUser(supabase, userId);
    if (!dbUser) {
      return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
    }

    // Fetch boats owned by this user
    const { data: ownedBoats, error: ownedError } = await supabase
      .from('boats')
      .select('*')
      .eq('owner_id', dbUser.id)
      .order('created_at', { ascending: false });

    if (ownedError) {
      console.error('Error fetching owned boats:', ownedError);
      return NextResponse.json({ error: 'Failed to fetch boats' }, { status: 500 });
    }

    // Also fetch boats user has crew access to (via boat_users table)
    const { data: boatAccess, error: accessError } = await supabase
      .from('boat_users')
      .select('boat_id, role')
      .eq('user_id', userId);  // Clerk userId

    if (accessError) {
      console.error('Error fetching crew boat access:', accessError);
    }

    // Get the actual boat data for crew-access boats
    let crewBoats: any[] = [];
    if (boatAccess && boatAccess.length > 0) {
      const ownedBoatIds = new Set((ownedBoats || []).map(b => b.id));
      const crewBoatIds = boatAccess
        .filter(a => !ownedBoatIds.has(a.boat_id))
        .map(a => a.boat_id);
      
      if (crewBoatIds.length > 0) {
        const { data: crewBoatData, error: crewBoatError } = await supabase
          .from('boats')
          .select('*')
          .in('id', crewBoatIds);
        
        if (crewBoatError) {
          console.error('Error fetching crew boats:', crewBoatError);
        } else if (crewBoatData) {
          // Add the user's role to each crew boat
          const roleMap = new Map(boatAccess.map(a => [a.boat_id, a.role]));
          crewBoats = crewBoatData.map(b => ({ ...b, userRole: roleMap.get(b.id) }));
        }
      }
    }

    const boats = [...(ownedBoats || []), ...crewBoats];

    return NextResponse.json({ boats });
  } catch (error) {
    console.error('GET /api/boats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/boats - Create a new boat
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();
    
    // Ensure user exists
    const dbUser = await ensureUser(supabase, userId);
    if (!dbUser) {
      return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json({ error: 'Boat name is required' }, { status: 400 });
    }

    // Prepare boat data
    const boatData = {
      owner_id: dbUser.id,
      name: body.name.trim(),
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
    };

    const { data: boat, error } = await supabase
      .from('boats')
      .insert(boatData)
      .select()
      .single();

    if (error) {
      console.error('Error creating boat:', error);
      return NextResponse.json({ error: 'Failed to create boat' }, { status: 500 });
    }

    return NextResponse.json({ boat }, { status: 201 });
  } catch (error) {
    console.error('POST /api/boats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper: Ensure user exists in Supabase, synced from Clerk
async function ensureUser(supabase: ReturnType<typeof createServerClient>, clerkId: string) {
  // Check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', clerkId)
    .single();

  if (existingUser) {
    return existingUser;
  }

  // User doesn't exist, fetch from Clerk and create
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }

  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      clerk_id: clerkId,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      name: clerkUser.firstName 
        ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim()
        : clerkUser.emailAddresses[0]?.emailAddress || 'User',
      avatar_url: clerkUser.imageUrl,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    return null;
  }

  return newUser;
}
