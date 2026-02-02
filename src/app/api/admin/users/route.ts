import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
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
