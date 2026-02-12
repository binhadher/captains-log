export const dynamic = 'force-dynamic';

import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/invitations/pending - Check for pending invitation for current user's email
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's email from Clerk
    const user = await currentUser();
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      return NextResponse.json({ invitation: null });
    }

    const email = user.emailAddresses[0].emailAddress.toLowerCase();
    const supabase = createServerClient();

    // Check for pending invitation for this email
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('id, token, boat_id, role, crew_member_id')
      .eq('email', email)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !invitation) {
      return NextResponse.json({ invitation: null });
    }

    return NextResponse.json({ invitation });

  } catch (error) {
    console.error('Error checking pending invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
