export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { canAccessAdmin } from '@/lib/admin';

// GET /api/admin/stats - Get admin dashboard stats
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId || !canAccessAdmin(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();

    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get total boats
    const { count: totalBoats } = await supabase
      .from('boats')
      .select('*', { count: 'exact', head: true });

    // Get total maintenance logs
    const { count: totalLogs } = await supabase
      .from('maintenance_logs')
      .select('*', { count: 'exact', head: true });

    // Get total documents
    const { count: totalDocuments } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });

    // Get users signed up in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { count: recentSignups } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    // Get users signed up in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count: monthlySignups } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers || 0,
        totalBoats: totalBoats || 0,
        totalLogs: totalLogs || 0,
        totalDocuments: totalDocuments || 0,
        recentSignups: recentSignups || 0,
        monthlySignups: monthlySignups || 0,
      },
      currentUserId: userId, // Send back for admin setup
    });
  } catch (error) {
    console.error('GET /api/admin/stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
