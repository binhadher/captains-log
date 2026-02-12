import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/boats/[id]/invite - Send invitation to crew member
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
    const { crewMemberId, email, role = 'crew' } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!['captain', 'crew'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Verify user owns this boat
    const { data: boat, error: boatError } = await supabase
      .from('boats')
      .select('id, name, owner_id')
      .eq('id', boatId)
      .single();

    if (boatError || !boat) {
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
    }

    if (boat.owner_id !== userId) {
      // Check if user is a captain (captains can invite crew)
      const { data: userAccess } = await supabase
        .from('boat_users')
        .select('role')
        .eq('boat_id', boatId)
        .eq('user_id', userId)
        .single();

      if (!userAccess || userAccess.role !== 'captain') {
        return NextResponse.json({ error: 'Only owners and captains can invite crew' }, { status: 403 });
      }

      // Captains can only invite crew, not other captains
      if (role === 'captain') {
        return NextResponse.json({ error: 'Captains cannot invite other captains' }, { status: 403 });
      }
    }

    // Check for existing pending invitation
    const { data: existingInvite } = await supabase
      .from('invitations')
      .select('id, expires_at')
      .eq('boat_id', boatId)
      .eq('email', email.toLowerCase())
      .is('accepted_at', null)
      .single();

    if (existingInvite) {
      // Check if still valid
      if (new Date(existingInvite.expires_at) > new Date()) {
        return NextResponse.json({ error: 'An invitation is already pending for this email' }, { status: 400 });
      }
      // Delete expired invitation
      await supabase.from('invitations').delete().eq('id', existingInvite.id);
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Invitation expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Get crew member name if linking to existing profile
    let crewName = '';
    if (crewMemberId) {
      const { data: crewMember } = await supabase
        .from('crew_members')
        .select('name')
        .eq('id', crewMemberId)
        .single();
      crewName = crewMember?.name || '';

      // Update crew member invitation status
      await supabase
        .from('crew_members')
        .update({ invitation_status: 'pending' })
        .eq('id', crewMemberId);
    }

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        boat_id: boatId,
        crew_member_id: crewMemberId || null,
        email: email.toLowerCase(),
        role,
        token,
        invited_by: userId,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
    }

    // Send invitation email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://captainslog.ae'}/invite/${token}`;
    const roleLabel = role === 'captain' ? 'Captain' : 'Crew Member';

    try {
      await resend.emails.send({
        from: 'Captain\'s Log <noreply@captainslog.ae>',
        to: email,
        subject: `You're invited to join ${boat.name} on Captain's Log`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #0d9488; margin-bottom: 24px;">🚤 You're Invited!</h1>
            
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              ${crewName ? `Hi ${crewName},` : 'Hello,'}
            </p>
            
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              You've been invited to join <strong>${boat.name}</strong> as a <strong>${roleLabel}</strong> on Captain's Log — the boat maintenance and logbook app.
            </p>
            
            <div style="margin: 32px 0;">
              <a href="${inviteUrl}" style="background: linear-gradient(135deg, #0d9488, #0891b2); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                Accept Invitation
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
              This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            
            <p style="font-size: 12px; color: #9ca3af;">
              Captain's Log — Keep your boat shipshape 🖖
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the request - invitation is created, email can be resent
    }

    return NextResponse.json({ 
      success: true, 
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expires_at: invitation.expires_at,
      }
    });

  } catch (error) {
    console.error('Error in invite API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/boats/[id]/invite - List pending invitations for this boat
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

    // Verify user has access to this boat
    const { data: boat } = await supabase
      .from('boats')
      .select('owner_id')
      .eq('id', boatId)
      .single();

    if (!boat) {
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
    }

    // Check access
    const isOwner = boat.owner_id === userId;
    if (!isOwner) {
      const { data: access } = await supabase
        .from('boat_users')
        .select('role')
        .eq('boat_id', boatId)
        .eq('user_id', userId)
        .single();

      if (!access || access.role !== 'captain') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Get pending invitations
    const { data: invitations, error } = await supabase
      .from('invitations')
      .select(`
        id,
        email,
        role,
        created_at,
        expires_at,
        crew_member_id
      `)
      .eq('boat_id', boatId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
    }

    return NextResponse.json({ invitations });

  } catch (error) {
    console.error('Error in invite GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/boats/[id]/invite - Cancel an invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: boatId } = await params;
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('invitationId');

    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Verify ownership
    const { data: boat } = await supabase
      .from('boats')
      .select('owner_id')
      .eq('id', boatId)
      .single();

    if (!boat || boat.owner_id !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get invitation to update crew member status
    const { data: invitation } = await supabase
      .from('invitations')
      .select('crew_member_id')
      .eq('id', invitationId)
      .eq('boat_id', boatId)
      .single();

    if (invitation?.crew_member_id) {
      await supabase
        .from('crew_members')
        .update({ invitation_status: 'not_invited' })
        .eq('id', invitation.crew_member_id);
    }

    // Delete invitation
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', invitationId)
      .eq('boat_id', boatId);

    if (error) {
      console.error('Error deleting invitation:', error);
      return NextResponse.json({ error: 'Failed to cancel invitation' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in invite DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
