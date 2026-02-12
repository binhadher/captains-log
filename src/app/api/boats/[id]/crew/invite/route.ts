export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';

// POST /api/boats/[id]/crew/invite
// Creates a crew member AND sends invitation in one step
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: boatId } = await params;
    const body = await request.json();
    const { title, name, email } = body;

    // Validation
    if (!title || !name || !email) {
      return NextResponse.json({ error: 'Title, name, and email are required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get the current user's Supabase ID
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get boat and verify ownership
    const { data: boat, error: boatError } = await supabase
      .from('boats')
      .select('id, name, owner_id')
      .eq('id', boatId)
      .single();

    if (boatError || !boat) {
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
    }

    // Only owner can invite (keeping it simple)
    if (boat.owner_id !== currentUser.id) {
      return NextResponse.json({ error: 'Only the boat owner can invite crew' }, { status: 403 });
    }

    // Check if email already exists for this boat
    const { data: existingCrew } = await supabase
      .from('crew_members')
      .select('id, invitation_status')
      .eq('boat_id', boatId)
      .eq('email', email.toLowerCase())
      .single();

    if (existingCrew) {
      if (existingCrew.invitation_status === 'accepted') {
        return NextResponse.json({ error: 'This person already has access to this boat' }, { status: 400 });
      } else if (existingCrew.invitation_status === 'pending') {
        return NextResponse.json({ error: 'An invitation is already pending for this email' }, { status: 400 });
      }
    }

    // Generate secure invitation token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Invitation expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Determine access role based on crew title
    const accessRole = title === 'captain' ? 'captain' : 'crew';

    // Create crew member record
    const { data: crewMember, error: crewError } = await supabase
      .from('crew_members')
      .insert({
        boat_id: boatId,
        name: name.trim(),
        title: title,
        email: email.toLowerCase().trim(),
        status: 'active',
        invitation_status: 'pending',
      })
      .select()
      .single();

    if (crewError) {
      console.error('Error creating crew member:', crewError);
      return NextResponse.json({ error: 'Failed to create crew member' }, { status: 500 });
    }

    // Create invitation record
    const { error: inviteError } = await supabase
      .from('invitations')
      .insert({
        boat_id: boatId,
        crew_member_id: crewMember.id,
        email: email.toLowerCase().trim(),
        role: accessRole,
        token,
        invited_by: userId,
        expires_at: expiresAt.toISOString(),
      });

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      // Clean up the crew member we just created
      await supabase.from('crew_members').delete().eq('id', crewMember.id);
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
    }

    // Send invitation email
    // Hardcoded for now to bypass env var issues
    const inviteUrl = `https://captainslog.ae/invite/${token}`;
    const roleLabel = accessRole === 'captain' ? 'Captain' : 'Crew Member';
    
    const titleLabels: Record<string, string> = {
      captain: 'Captain',
      first_mate: 'First Mate',
      engineer: 'Engineer',
      mechanic: 'Mechanic',
      deckhand: 'Deckhand',
      chef: 'Chef',
      steward: 'Steward',
      stewardess: 'Stewardess',
      bosun: 'Bosun',
      other: 'Crew Member',
    };

    const emailResult = await sendEmail({
      to: email,
      subject: `🚤 You're invited to join ${boat.name} on Captain's Log`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
          <div style="background: linear-gradient(135deg, #0d9488, #0891b2); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🚤 Welcome Aboard!</h1>
          </div>
          
          <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 18px; color: #1f2937; margin-bottom: 8px;">
              Hi <strong>${name}</strong>,
            </p>
            
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
              You've been invited to join <strong style="color: #0d9488;">${boat.name}</strong> as <strong>${titleLabels[title] || 'Crew Member'}</strong> on Captain's Log — the boat maintenance and logbook app.
            </p>
            
            <div style="margin: 32px 0; text-align: center;">
              <a href="${inviteUrl}" style="background: linear-gradient(135deg, #0d9488, #0891b2); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px rgba(13,148,136,0.4);">
                Accept Invitation
              </a>
            </div>
            
            <div style="background: #f0fdfa; border-radius: 12px; padding: 20px; margin-top: 24px;">
              <p style="font-size: 14px; color: #0d9488; margin: 0 0 12px 0; font-weight: 600;">
                📋 What's next?
              </p>
              <ol style="font-size: 14px; color: #4b5563; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Click the button above to create your account</li>
                <li>You'll get access to ${boat.name}'s maintenance logs</li>
                <li>Complete your crew profile (passport, license, etc.)</li>
              </ol>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            
            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
              This invitation expires in 7 days.<br>
              If you didn't expect this email, you can safely ignore it.
            </p>
          </div>
          
          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 16px;">
            Captain's Log — Keep your boat shipshape 🖖
          </p>
        </div>
      `,
    });

    if (!emailResult.success) {
      console.error('Failed to send invitation email:', emailResult.error);
      // Don't fail the request - the invitation is created, just log the email error
      return NextResponse.json({ 
        success: true, 
        warning: 'Invitation created but email delivery failed. You may need to resend.',
        crewMember 
      });
    }

    return NextResponse.json({ 
      success: true, 
      crewMember,
      message: `Invitation sent to ${email}`
    });

  } catch (error) {
    console.error('Error in crew invite API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
