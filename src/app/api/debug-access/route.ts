export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// Debug endpoint to check user's boat access
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Not signed in', userId: null });
    }

    const supabase = createServerClient();
    
    // Get user from users table
    const { data: dbUser } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    // Get boat_users entries for this Clerk ID
    const { data: boatAccess } = await supabase
      .from('boat_users')
      .select('*')
      .eq('user_id', userId);

    // Get crew_members linked to this Clerk ID
    const { data: crewMembers } = await supabase
      .from('crew_members')
      .select('*')
      .eq('user_id', userId);

    // Get pending invitations for user's email
    const { data: pendingInvites } = await supabase
      .from('invitations')
      .select('*')
      .is('accepted_at', null);

    return NextResponse.json({
      clerkUserId: userId,
      dbUser,
      boatAccess,
      crewMembers,
      pendingInvites: pendingInvites?.slice(0, 5), // Limit for safety
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
