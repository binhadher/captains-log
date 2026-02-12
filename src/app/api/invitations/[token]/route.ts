export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/invitations/[token] - Get invitation details (public, for invite landing page)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createServerClient();

    const { data: invitation, error } = await supabase
      .from('invitations')
      .select(`
        id,
        email,
        role,
        expires_at,
        accepted_at,
        boat_id,
        crew_member_id,
        boats (
          id,
          name,
          make,
          model,
          photo_url
        ),
        crew_members (
          id,
          name,
          title,
          photo_url
        )
      `)
      .eq('token', token)
      .single();

    if (error || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      return NextResponse.json({ error: 'Invitation already accepted', code: 'ALREADY_ACCEPTED' }, { status: 400 });
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired', code: 'EXPIRED' }, { status: 400 });
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expires_at: invitation.expires_at,
        boat: invitation.boats,
        crewMember: invitation.crew_members,
      }
    });

  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/invitations/[token] - Accept invitation (requires auth)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to accept this invitation' }, { status: 401 });
    }

    const { token } = await params;
    const supabase = createServerClient();

    // Get invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      return NextResponse.json({ error: 'Invitation already accepted' }, { status: 400 });
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Check if user already has access to this boat
    const { data: existingAccess } = await supabase
      .from('boat_users')
      .select('id')
      .eq('boat_id', invitation.boat_id)
      .eq('user_id', userId)
      .single();

    if (existingAccess) {
      // Mark invitation as accepted anyway
      await supabase
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id);

      return NextResponse.json({ 
        success: true, 
        message: 'You already have access to this boat',
        boatId: invitation.boat_id 
      });
    }

    // Create boat_users entry
    const { error: accessError } = await supabase
      .from('boat_users')
      .insert({
        boat_id: invitation.boat_id,
        user_id: userId,
        crew_member_id: invitation.crew_member_id,
        role: invitation.role,
        invited_by: invitation.invited_by,
        invited_at: invitation.created_at,
        joined_at: new Date().toISOString(),
      });

    if (accessError) {
      console.error('Error creating boat access:', accessError);
      return NextResponse.json({ error: 'Failed to grant access' }, { status: 500 });
    }

    // Update crew member if linked
    if (invitation.crew_member_id) {
      await supabase
        .from('crew_members')
        .update({ 
          user_id: userId,
          invitation_status: 'accepted'
        })
        .eq('id', invitation.crew_member_id);
    }

    // Mark invitation as accepted
    await supabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    return NextResponse.json({ 
      success: true, 
      boatId: invitation.boat_id,
      role: invitation.role,
      message: `Welcome aboard! You now have ${invitation.role} access.`
    });

  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
