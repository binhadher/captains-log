export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { canAccessAdmin } from '@/lib/admin';

// GET /api/admin/insights - Aggregate admin analytics
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId || !canAccessAdmin(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      totalUsers,
      totalBoats,
      totalDocuments,
      totalPhotos,
      recentSignups,
      monthlySignups,
      activeThisMonth,
      activeLastMonth,
      activeLast7Days,
      sessionStats,
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('boats').select('*', { count: 'exact', head: true }),
      supabase.from('documents').select('*', { count: 'exact', head: true }),
      supabase.rpc('count_all_photos'),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('last_seen_at', startOfMonth),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('last_seen_at', startOfLastMonth).lt('last_seen_at', startOfMonth),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('last_seen_at', thirtyDaysAgo),
      supabase.rpc('admin_session_stats', { start_date: startOfMonth }),
    ]);

    // Fallback if RPC doesn't exist
    let monthlySessionSeconds = 0;
    let monthlySessions = 0;
    if (sessionStats.error) {
      console.warn('admin_session_stats RPC not available, falling back:', sessionStats.error);
      const { data: fallback } = await supabase
        .from('user_sessions')
        .select('duration_seconds')
        .gte('started_at', startOfMonth);
      monthlySessions = fallback?.length || 0;
      monthlySessionSeconds = fallback?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0;
    } else {
      monthlySessions = sessionStats.data?.sessions || 0;
      monthlySessionSeconds = sessionStats.data?.seconds || 0;
    }

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers.count || 0,
        totalBoats: totalBoats.count || 0,
        totalDocuments: totalDocuments.count || 0,
        totalPhotos: totalPhotos.data || 0,
        recentSignups: recentSignups.count || 0,
        monthlySignups: monthlySignups.count || 0,
        activeThisMonth: activeThisMonth.count || 0,
        activeLastMonth: activeLastMonth.count || 0,
        activeLast7Days: activeLast7Days.count || 0,
        monthlySessions,
        monthlySessionSeconds,
      },
    });
  } catch (error) {
    console.error('GET /api/admin/insights error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
