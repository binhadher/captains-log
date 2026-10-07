import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Anchor, Users, Ship, FileText, Wrench, UserPlus, ArrowLeft, Shield, Clock, Camera, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createServerClient } from '@/lib/supabase';
import { canAccessAdmin } from '@/lib/admin';

function formatDuration(totalSeconds: number): string {
  if (!totalSeconds) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default async function AdminPage() {
  const { userId } = await auth();

  if (!userId || !canAccessAdmin(userId)) {
    redirect('/sign-in');
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
    totalLogs,
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
    supabase.from('maintenance_logs').select('*', { count: 'exact', head: true }),
    supabase.from('documents').select('*', { count: 'exact', head: true }),
    supabase.rpc('count_all_photos'),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('last_seen_at', startOfMonth),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('last_seen_at', startOfLastMonth).lt('last_seen_at', startOfMonth),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('last_seen_at', thirtyDaysAgo),
    supabase.rpc('admin_session_stats', { start_date: startOfMonth }),
  ]);

  let monthlySessionSeconds = 0;
  let monthlySessions = 0;
  if (sessionStats.error) {
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

  const stats = {
    totalUsers: totalUsers.count || 0,
    totalBoats: totalBoats.count || 0,
    totalLogs: totalLogs.count || 0,
    totalDocuments: totalDocuments.count || 0,
    totalPhotos: totalPhotos.data || 0,
    recentSignups: recentSignups.count || 0,
    monthlySignups: monthlySignups.count || 0,
    activeThisMonth: activeThisMonth.count || 0,
    activeLastMonth: activeLastMonth.count || 0,
    activeLast7Days: activeLast7Days.count || 0,
    monthlySessions,
    monthlySessionSeconds,
  };

  return (
    <div className="min-h-screen bg-dubai">
      <header className="glass-header sticky top-0 z-10">
        <div className="max-w-4xl md:max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-100 dark:bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                <Anchor className="w-5 h-5 text-teal-700 dark:text-white" />
              </div>
              <h1 className="text-lg font-bold text-teal-700 dark:text-white">Captain&apos;s Log</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-white hidden sm:inline">Admin</span>
              <Link href="/">
                <Button size="sm" variant="outline" className="border-gray-300 dark:border-white/20">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl md:max-w-6xl mx-auto px-4 md:px-6 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Admin Dashboard
          </h2>
          <p className="text-white/80 text-sm mt-1">Overview of accounts, boats, content, and usage.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatCard icon={<Users className="w-6 h-6" />} label="Total Users" value={stats.totalUsers} color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" />
          <StatCard icon={<Ship className="w-6 h-6" />} label="Total Boats" value={stats.totalBoats} color="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300" />
          <StatCard icon={<Wrench className="w-6 h-6" />} label="Maintenance Logs" value={stats.totalLogs} color="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" />
          <StatCard icon={<FileText className="w-6 h-6" />} label="Documents" value={stats.totalDocuments} color="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" />
          <StatCard icon={<Camera className="w-6 h-6" />} label="Photos" value={stats.totalPhotos} color="bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" />
          <StatCard icon={<UserPlus className="w-6 h-6" />} label="New Users (30 days)" value={stats.monthlySignups} color="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" />
        </div>

        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Usage &amp; Engagement
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<Clock className="w-5 h-5" />} label="Time on Site (This Month)" value={formatDuration(stats.monthlySessionSeconds)} color="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" isText />
          <StatCard icon={<Activity className="w-5 h-5" />} label="Sessions (This Month)" value={stats.monthlySessions} color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" />
          <StatCard icon={<Users className="w-5 h-5" />} label="Active This Month" value={stats.activeThisMonth} color="bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300" />
          <StatCard icon={<Users className="w-5 h-5" />} label="Active Last 7 Days" value={stats.activeLast7Days} color="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" />
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Account Holders</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">View every user, their boats, uploaded content, and usage.</p>
          <Link href="/admin/users">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white">
              <Users className="w-4 h-4 mr-2" />
              View All Users
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color, isText }: { icon: React.ReactNode; label: string; value: string | number; color: string; isText?: boolean }) {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <p className={`font-bold text-gray-900 dark:text-white ${isText ? 'text-lg' : 'text-2xl'}`}>{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
