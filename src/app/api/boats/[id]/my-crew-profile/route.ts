export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/boats/[id]/my-crew-profile - Get current user's crew profile for this boat
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

    // Find crew member linked to this user for this boat
    const { data: crewMember, error } = await supabase
      .from('crew_members')
      .select('*')
      .eq('boat_id', boatId)
      .eq('user_id', userId)
      .single();

    if (error || !crewMember) {
      return NextResponse.json({ crewMember: null });
    }

    return NextResponse.json({ crewMember });
  } catch (error) {
    console.error('GET /api/boats/[id]/my-crew-profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
