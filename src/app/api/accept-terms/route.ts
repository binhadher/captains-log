export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();

    // Try to update existing user first
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({
        terms_accepted_at: new Date().toISOString(),
        privacy_accepted_at: new Date().toISOString(),
      })
      .eq('clerk_id', userId)
      .select('id');

    // If no rows updated, create user
    if (!updated || updated.length === 0) {
      const clerkUser = await currentUser();
      const email = clerkUser?.emailAddresses?.[0]?.emailAddress || `${userId}@user.local`;
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({ 
          clerk_id: userId, 
          email,
          terms_accepted_at: new Date().toISOString(),
          privacy_accepted_at: new Date().toISOString(),
        });
      
      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ accepted: false });
    }

    const supabase = createServerClient();

    const { data: user } = await supabase
      .from('users')
      .select('terms_accepted_at, privacy_accepted_at')
      .eq('clerk_id', userId)
      .single();

    const accepted = !!(user?.terms_accepted_at && user?.privacy_accepted_at);
    return NextResponse.json({ accepted });
  } catch {
    return NextResponse.json({ accepted: false });
  }
}
