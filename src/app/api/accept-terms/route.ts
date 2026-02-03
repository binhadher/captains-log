import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    let dbUserId = existingUser?.id;

    // Create user if doesn't exist
    if (!dbUserId) {
      const clerkUser = await currentUser();
      const email = clerkUser?.emailAddresses?.[0]?.emailAddress || `${userId}@user.local`;
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ clerk_id: userId, email })
        .select('id')
        .single();
      
      if (createError) {
        console.error('Create user error:', createError);
        return NextResponse.json({ error: 'Failed to create user', detail: createError.message }, { status: 500 });
      }
      dbUserId = newUser?.id;
    }

    // Update terms acceptance
    const { error: updateError } = await supabase
      .from('users')
      .update({
        terms_accepted_at: new Date().toISOString(),
        privacy_accepted_at: new Date().toISOString(),
      })
      .eq('id', dbUserId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to save', detail: updateError.message }, { status: 500 });
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
