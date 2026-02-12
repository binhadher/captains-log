export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/boats/[id]/access - Get current user's role for this boat
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

    // Get the current user's Supabase ID
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!currentUser) {
      return NextResponse.json({ role: null });
    }

    // Check if user is the boat owner
    const { data: boat } = await supabase
      .from('boats')
      .select('owner_id')
      .eq('id', boatId)
      .single();

    if (!boat) {
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
    }

    if (boat.owner_id === currentUser.id) {
      return NextResponse.json({ role: 'owner' });
    }

    // Check boat_users table for explicit access
    const { data: boatUser } = await supabase
      .from('boat_users')
      .select('role')
      .eq('boat_id', boatId)
      .eq('user_id', userId)
      .single();

    if (boatUser) {
      return NextResponse.json({ role: boatUser.role });
    }

    // No access
    return NextResponse.json({ role: null });

  } catch (error) {
    console.error('Error fetching boat access:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/boats/[id]/access - Revoke a user's access (owner only)
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
    const targetUserId = searchParams.get('userId');
    const crewMemberId = searchParams.get('crewMemberId');

    if (!targetUserId && !crewMemberId) {
      return NextResponse.json({ error: 'userId or crewMemberId required' }, { status: 400 });
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

    // Verify caller is the boat owner
    const { data: boat } = await supabase
      .from('boats')
      .select('owner_id')
      .eq('id', boatId)
      .single();

    if (!boat || boat.owner_id !== currentUser.id) {
      return NextResponse.json({ error: 'Only the boat owner can revoke access' }, { status: 403 });
    }

    // If we have a crewMemberId, find the associated user
    let userToRevoke = targetUserId;
    if (crewMemberId && !targetUserId) {
      const { data: crewMember } = await supabase
        .from('crew_members')
        .select('user_id')
        .eq('id', crewMemberId)
        .single();
      
      if (crewMember?.user_id) {
        userToRevoke = crewMember.user_id;
      }
    }

    if (userToRevoke) {
      // Remove from boat_users
      await supabase
        .from('boat_users')
        .delete()
        .eq('boat_id', boatId)
        .eq('user_id', userToRevoke);
    }

    // Update crew member to clear user link and reset invitation status
    if (crewMemberId) {
      await supabase
        .from('crew_members')
        .update({ 
          user_id: null, 
          invitation_status: 'not_invited' 
        })
        .eq('id', crewMemberId);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error revoking access:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
