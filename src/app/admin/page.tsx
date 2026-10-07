'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Anchor, Users, Ship, FileText, Wrench, UserPlus, ArrowLeft, Shield, Loader2, Clock, Camera, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

interface AdminStats {
  totalUsers: number;
  totalBoats: number;
  totalLogs: number;
  totalDocuments: number;
  totalPhotos: number;
  recentSignups: number;
  monthlySignups: number;
  activeThisMonth: number;
  activeLastMonth: number;
  activeLast7Days: number;
  monthlySessions: number;
  monthlySessionSeconds: number;
}

function formatDuration(totalSeconds: number): string {
  if (!totalSeconds) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default function AdminPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [statsRes, insightsRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/insights'),
        ]);
        if (statsRes.status === 401 || insightsRes.status === 401) {
          setUnauthorized(true);
          return;
        }
        if (!statsRes.ok) throw new Error('Failed to load admin stats');
        if (!insightsRes.ok) throw new Error('Failed to load insights');
        const statsData = await statsRes.json();
        const insightsData = await insightsRes.json();
        setStats({ ...statsData.stats, ...insightsData.stats });
      } catch (err) {
        console.error('Admin stats error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded && isSignedIn) {
      fetchStats();
    } else if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-700 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-700 flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Admin Access Required</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">You don&apos;t have permission to view this page.</p>
          <Link href="/">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card rounded-xl p-5">
                <Skeleton variant="custom" className="w-10 h-10 rounded-lg mb-3" />
                <Skeleton variant="heading" width={80} className="mb-1" />
                <Skeleton variant="text" width="60%" height={12} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="glass-card rounded-xl p-6 text-center">
            <p className="text-red-600 dark:text-red-400 mb-3">{error}</p>
            <Button onClick={() => window.location.reload()} size="sm">Retry</Button>
          </div>
        ) : stats ? (
          <>
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
          </>
        ) : null}
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
