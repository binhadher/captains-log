export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/my-incomplete-crew-profile
// Returns the first crew profile that needs completion (no phone number)
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();

    // Find any crew member linked to this user that has no phone (incomplete profile)
    // Check for both null and empty string
    const { data: crewMembers, error } = await supabase
      .from('crew_members')
      .select('id, boat_id, phone')
      .eq('user_id', userId)
      .limit(10);

    // Find first one with missing phone
    const crewMember = crewMembers?.find(c => !c.phone || c.phone.trim() === '');

    if (error || !crewMember) {
      // No incomplete profiles found
      return NextResponse.json({ crewMemberId: null });
    }

    return NextResponse.json({ crewMemberId: crewMember.id });
  } catch (error) {
    console.error('GET /api/my-incomplete-crew-profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
