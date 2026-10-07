'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Anchor, Users, Ship, FileText, Wrench, UserPlus, ArrowLeft, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

interface AdminStats {
  totalUsers: number;
  totalBoats: number;
  totalLogs: number;
  totalDocuments: number;
  recentSignups: number;
  monthlySignups: number;
}

export default function AdminPage() {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.status === 401) {
          setUnauthorized(true);
          return;
        }
        if (!res.ok) throw new Error('Failed to load admin stats');
        const data = await res.json();
        setStats(data.stats);
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
      {/* Header */}
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
          <p className="text-white/80 text-sm mt-1">Overview of accounts, boats, and activity.</p>
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
              <StatCard icon={<UserPlus className="w-6 h-6" />} label="New Users (7 days)" value={stats.recentSignups} color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" />
              <StatCard icon={<UserPlus className="w-6 h-6" />} label="New Users (30 days)" value={stats.monthlySignups} color="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" />
            </div>

            <div className="glass-card rounded-xl p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">User Management</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">View all registered users and their boats.</p>
              <Link href="/admin/users">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                  <Users className="w-4 h-4 mr-2" />
                  View Users
                </Button>
              </Link>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
