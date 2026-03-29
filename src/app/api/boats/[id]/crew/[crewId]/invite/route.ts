export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';

// POST /api/boats/[id]/crew/[crewId]/invite
// Send invitation to an existing crew member
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; crewId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: boatId, crewId } = await params;
    const supabase = createServerClient();

    // Get current user
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get boat and verify ownership
    const { data: boat } = await supabase
      .from('boats')
      .select('id, name, owner_id')
      .eq('id', boatId)
      .single();

    if (!boat || boat.owner_id !== currentUser.id) {
      return NextResponse.json({ error: 'Only the boat owner can invite crew' }, { status: 403 });
    }

    // Get crew member
    const { data: crewMember } = await supabase
      .from('crew_members')
      .select('id, name, email, title, invitation_status')
      .eq('id', crewId)
      .eq('boat_id', boatId)
      .single();

    if (!crewMember) {
      return NextResponse.json({ error: 'Crew member not found' }, { status: 404 });
    }

    if (!crewMember.email) {
      return NextResponse.json({ error: 'Crew member has no email address' }, { status: 400 });
    }

    if (crewMember.invitation_status === 'accepted') {
      return NextResponse.json({ error: 'This crew member already has an account' }, { status: 400 });
    }

    // Delete any existing pending invitations for this crew member
    await supabase
      .from('invitations')
      .delete()
      .eq('crew_member_id', crewId)
      .is('accepted_at', null);

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const accessRole = crewMember.title === 'captain' ? 'captain' : 'crew';

    // Create invitation
    const { error: inviteError } = await supabase
      .from('invitations')
      .insert({
        boat_id: boatId,
        crew_member_id: crewId,
        email: crewMember.email.toLowerCase().trim(),
        role: accessRole,
        token,
        invited_by: userId,
        expires_at: expiresAt.toISOString(),
      });

    if (inviteError) {
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
    }

    // Update crew member status
    await supabase
      .from('crew_members')
      .update({ invitation_status: 'pending' })
      .eq('id', crewId);

    // Send email
    const inviteUrl = `https://captainslog.ae/invite/${token}`;
    const titleLabels: Record<string, string> = {
      captain: 'Captain', first_mate: 'First Mate', engineer: 'Engineer',
      mechanic: 'Mechanic', deckhand: 'Deckhand', chef: 'Chef',
      steward: 'Steward', stewardess: 'Stewardess', bosun: 'Bosun', other: 'Crew Member',
    };

    const emailResult = await sendEmail({
      to: crewMember.email,
      subject: `🚤 You're invited to join ${boat.name} on Captain's Log`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
          <div style="background: linear-gradient(135deg, #0d9488, #0891b2); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🚤 Welcome Aboard!</h1>
          </div>
          <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 18px; color: #1f2937;">Hi <strong>${crewMember.name}</strong>,</p>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
              You've been invited to join <strong style="color: #0d9488;">${boat.name}</strong> as <strong>${titleLabels[crewMember.title] || 'Crew Member'}</strong> on Captain's Log.
            </p>
            <div style="margin: 32px 0; text-align: center;">
              <a href="${inviteUrl}" style="background: linear-gradient(135deg, #0d9488, #0891b2); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                Accept Invitation
              </a>
            </div>
            <div style="background: #f0fdfa; border-radius: 12px; padding: 20px; margin-top: 24px;">
              <p style="font-size: 14px; color: #0d9488; margin: 0 0 12px 0; font-weight: 600;">📋 What's next?</p>
              <ol style="font-size: 14px; color: #4b5563; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Click the button above to create your account</li>
                <li>You'll get access to ${boat.name}'s maintenance logs</li>
                <li>Complete your crew profile (passport, license, etc.)</li>
              </ol>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              This invitation expires in 7 days. If you didn't expect this, ignore it.
            </p>
          </div>
        </div>
      `,
    });

    if (!emailResult.success) {
      return NextResponse.json({
        success: true,
        warning: 'Invitation created but email delivery failed. Share the link manually.',
        inviteUrl,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${crewMember.email}`,
    });

  } catch (error) {
    console.error('Error sending crew invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
