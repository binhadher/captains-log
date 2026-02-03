import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
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

    const body = await req.json();
    const { termsAccepted, privacyAccepted, termsVersion, privacyVersion } = body;

    if (!termsAccepted || !privacyAccepted) {
      return NextResponse.json(
        { error: 'Both Terms and Privacy Policy must be accepted' },
        { status: 400 }
      );
    }

    // Get user from database, or create if doesn't exist
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      // Auto-create user if not exists
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ clerk_id: userId }])
        .select('id')
        .single();
      
      if (createError || !newUser) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
      user = newUser;
    }

    const now = new Date().toISOString();

    // Get request metadata for audit
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Update user with consent timestamps
    const { error: updateError } = await supabase
      .from('users')
      .update({
        terms_accepted_at: now,
        privacy_accepted_at: now,
        terms_version: termsVersion || '1.0',
        privacy_version: privacyVersion || '1.0',
        updated_at: now,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user consent:', updateError);
      return NextResponse.json({ error: 'Failed to record consent' }, { status: 500 });
    }

    // Record in consent history for audit trail
    const { error: historyError } = await supabase
      .from('user_consent_history')
      .insert([
        {
          user_id: user.id,
          consent_type: 'terms',
          version: termsVersion || '1.0',
          accepted_at: now,
          ip_address: ipAddress,
          user_agent: userAgent,
        },
        {
          user_id: user.id,
          consent_type: 'privacy',
          version: privacyVersion || '1.0',
          accepted_at: now,
          ip_address: ipAddress,
          user_agent: userAgent,
        },
      ]);

    if (historyError) {
      // Log but don't fail - the main consent record was already saved
      console.error('Error recording consent history:', historyError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error accepting terms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to check if user has accepted terms
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('terms_accepted_at, privacy_accepted_at, terms_version, privacy_version')
      .eq('clerk_id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ accepted: false });
    }

    const accepted = !!(user.terms_accepted_at && user.privacy_accepted_at);

    return NextResponse.json({
      accepted,
      termsAcceptedAt: user.terms_accepted_at,
      privacyAcceptedAt: user.privacy_accepted_at,
      termsVersion: user.terms_version,
      privacyVersion: user.privacy_version,
    });
  } catch (error) {
    console.error('Error checking terms acceptance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
