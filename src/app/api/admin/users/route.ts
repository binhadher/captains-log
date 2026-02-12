export const dynamic = 'force-dynamic';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { canAccessAdmin } from '@/lib/admin';

// GET /api/admin/users - Get all users with their boats
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId || !canAccessAdmin(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();

    // Get all users with their boat counts
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        clerk_id,
        email,
        name,
        avatar_url,
        created_at,
        boats (
          id,
          name,
          make,
          model,
          year
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Enrich with boat count and last activity
    const enrichedUsers = await Promise.all(
      (users || []).map(async (user) => {
        // Get last maintenance log for this user's boats
        const boatIds = user.boats?.map((b: { id: string }) => b.id) || [];
        
        let lastActivity = null;
        if (boatIds.length > 0) {
          const { data: lastLog } = await supabase
            .from('maintenance_logs')
            .select('created_at')
            .in('boat_id', boatIds)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          lastActivity = lastLog?.created_at || null;
        }

        return {
          ...user,
          boatCount: user.boats?.length || 0,
          lastActivity: lastActivity || user.created_at,
        };
      })
    );

    return NextResponse.json({ users: enrichedUsers });
  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/users - Delete a user and all their data
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId || !canAccessAdmin(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userIdToDelete = searchParams.get('id');
    const clerkIdToDelete = searchParams.get('clerkId');

    if (!userIdToDelete) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Prevent self-deletion
    if (clerkIdToDelete === userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get user's boats first
    const { data: boats } = await supabase
      .from('boats')
      .select('id')
      .eq('user_id', userIdToDelete);

    const boatIds = boats?.map(b => b.id) || [];

    if (boatIds.length > 0) {
      // Delete all boat-related data
      await supabase.from('maintenance_logs').delete().in('boat_id', boatIds);
      await supabase.from('components').delete().in('boat_id', boatIds);
      await supabase.from('documents').delete().in('boat_id', boatIds);
      await supabase.from('parts_catalog').delete().in('boat_id', boatIds);
      await supabase.from('health_checks').delete().in('boat_id', boatIds);
      await supabase.from('alerts').delete().in('boat_id', boatIds);
      await supabase.from('boats').delete().in('id', boatIds);
    }

    // Delete crew members owned by user
    await supabase.from('crew_members').delete().eq('user_id', userIdToDelete);

    // Delete user from database
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userIdToDelete);

    if (deleteError) {
      console.error('Error deleting user from DB:', deleteError);
      return NextResponse.json({ error: 'Failed to delete user data' }, { status: 500 });
    }

    // Delete user from Clerk (if clerkId provided)
    if (clerkIdToDelete) {
      try {
        const client = await clerkClient();
        await client.users.deleteUser(clerkIdToDelete);
      } catch (clerkError) {
        console.error('Error deleting user from Clerk:', clerkError);
        // Continue even if Clerk deletion fails - DB data is already gone
      }
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
