'use client';

import { useState, useEffect } from 'react';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  Users, 
  Ship, 
  FileText, 
  Wrench, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  Loader2,
  Shield,
  Copy,
  Check,
  Anchor,
  Settings,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface Stats {
  totalUsers: number;
  totalBoats: number;
  totalLogs: number;
  totalDocuments: number;
  recentSignups: number;
  monthlySignups: number;
}

interface User {
  id: string;
  clerk_id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  boatCount: number;
  lastActivity: string;
  boats: Array<{
    id: string;
    name: string;
    make: string | null;
    model: string | null;
    year: number | null;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users'),
      ]);

      if (!statsRes.ok || !usersRes.ok) {
        throw new Error('Failed to fetch admin data');
      }

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();

      setStats(statsData.stats);
      setCurrentUserId(statsData.currentUserId);
      setUsers(usersData.users || []);
    } catch (err) {
      console.error('Admin fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const copyUserId = () => {
    if (currentUserId) {
      navigator.clipboard.writeText(currentUserId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeleteUser = async (userId: string, clerkId: string) => {
    if (clerkId === currentUserId) {
      alert("You can't delete your own account!");
      return;
    }

    setDeletingUser(userId);
    try {
      const response = await fetch(`/api/admin/users?id=${userId}&clerkId=${clerkId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      // Remove user from local state
      setUsers(users.filter(u => u.id !== userId));
      setConfirmDelete(null);
      setExpandedUser(null);
      
      // Refresh stats
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeletingUser(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-700 dark:text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading admin dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-xl shadow-lg p-6 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-teal-700 dark:text-white hover:opacity-80 transition-opacity">
              <Anchor className="w-8 h-8" />
              <span className="text-xl font-semibold">Captain&apos;s Log</span>
            </Link>
            <span className="text-gray-400 dark:text-white/60">/</span>
            <div className="flex items-center gap-2 text-gray-700 dark:text-white">
              <Shield className="w-5 h-5" />
              <span className="font-medium">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/settings">
              <Settings className="w-5 h-5 text-gray-500 hover:text-gray-700 dark:text-white/80 dark:hover:text-white transition-colors cursor-pointer" />
            </Link>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </header>

        {/* Admin Setup Notice */}
        {currentUserId && (
          <div className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-xl shadow-lg p-4 mb-6 border-l-4 border-amber-400">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Your Clerk User ID:</p>
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 dark:bg-black/20 px-2 py-1 rounded text-xs text-gray-700 dark:text-white/90 font-mono">
                    {currentUserId}
                  </code>
                  <button
                    onClick={copyUserId}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded transition-colors"
                    title="Copy ID"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400 dark:text-white/60" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-white/60 mt-2">
                  Add this ID to <code className="bg-gray-100 dark:bg-black/20 px-1 rounded">src/lib/admin.ts</code> to lock down admin access.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard 
            icon={<Users className="w-5 h-5" />}
            label="Total Users"
            value={stats?.totalUsers || 0}
            color="blue"
          />
          <StatCard 
            icon={<Ship className="w-5 h-5" />}
            label="Total Boats"
            value={stats?.totalBoats || 0}
            color="teal"
          />
          <StatCard 
            icon={<Wrench className="w-5 h-5" />}
            label="Maintenance Logs"
            value={stats?.totalLogs || 0}
            color="orange"
          />
          <StatCard 
            icon={<FileText className="w-5 h-5" />}
            label="Documents"
            value={stats?.totalDocuments || 0}
            color="purple"
          />
          <StatCard 
            icon={<TrendingUp className="w-5 h-5" />}
            label="Last 7 Days"
            value={stats?.recentSignups || 0}
            color="green"
            subtitle="signups"
          />
          <StatCard 
            icon={<Calendar className="w-5 h-5" />}
            label="Last 30 Days"
            value={stats?.monthlySignups || 0}
            color="indigo"
            subtitle="signups"
          />
        </div>

        {/* Users List */}
        <div className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Users ({users.length})
          </h2>
          
          {users.length === 0 ? (
            <p className="text-gray-500 dark:text-white/60 text-center py-8">No users yet</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="bg-gray-50 dark:bg-white/10 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-left"
                  >
                    {/* Avatar */}
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-medium">
                        {user.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{user.name || 'Unnamed'}</p>
                      <p className="text-sm text-gray-500 dark:text-white/60 truncate">{user.email}</p>
                    </div>
                    
                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-medium text-gray-900 dark:text-white">{user.boatCount}</p>
                        <p className="text-gray-500 dark:text-white/60 text-xs">boats</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-gray-900 dark:text-white">{formatRelativeTime(user.lastActivity)}</p>
                        <p className="text-gray-500 dark:text-white/60 text-xs">last active</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-gray-900 dark:text-white">{formatDate(user.created_at)}</p>
                        <p className="text-gray-500 dark:text-white/60 text-xs">joined</p>
                      </div>
                    </div>
                    
                    <ChevronRight className={`w-5 h-5 text-gray-400 dark:text-white/40 transition-transform ${expandedUser === user.id ? 'rotate-90' : ''}`} />
                  </button>
                  
                  {/* Expanded Details */}
                  {expandedUser === user.id && (
                    <div className="px-4 pb-4 pt-0 border-t border-gray-200 dark:border-white/10">
                      <div className="pt-4">
                        {/* Mobile stats */}
                        <div className="sm:hidden grid grid-cols-3 gap-4 mb-4 text-center">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{user.boatCount}</p>
                            <p className="text-gray-500 dark:text-white/60 text-xs">boats</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{formatRelativeTime(user.lastActivity)}</p>
                            <p className="text-gray-500 dark:text-white/60 text-xs">last active</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{formatDate(user.created_at)}</p>
                            <p className="text-gray-500 dark:text-white/60 text-xs">joined</p>
                          </div>
                        </div>
                        
                        {/* Boats */}
                        {user.boats && user.boats.length > 0 ? (
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-white/60 mb-2 uppercase tracking-wide">Boats</p>
                            <div className="space-y-2">
                              {user.boats.map((boat) => (
                                <div key={boat.id} className="flex items-center gap-3 bg-gray-100 dark:bg-black/20 rounded-lg p-3">
                                  <Ship className="w-4 h-4 text-teal-500" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{boat.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-white/60">
                                      {[boat.year, boat.make, boat.model].filter(Boolean).join(' ') || 'No details'}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 dark:text-white/40 italic">No boats added yet</p>
                        )}
                        
                        {/* User IDs for debugging */}
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                          <p className="text-xs text-gray-400 dark:text-white/40">
                            Clerk ID: <code className="bg-gray-100 dark:bg-black/20 px-1 rounded">{user.clerk_id}</code>
                          </p>
                          <p className="text-xs text-gray-400 dark:text-white/40 mt-1">
                            DB ID: <code className="bg-gray-100 dark:bg-black/20 px-1 rounded">{user.id}</code>
                          </p>
                        </div>
                        
                        {/* Delete User */}
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                          {confirmDelete === user.id ? (
                            <div className="bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50 rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                                    Delete this user?
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-white/60 mb-3">
                                    This will permanently delete the user, their boats, maintenance logs, documents, and all associated data. This cannot be undone.
                                  </p>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleDeleteUser(user.id, user.clerk_id)}
                                      disabled={deletingUser === user.id}
                                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg flex items-center gap-2"
                                    >
                                      {deletingUser === user.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-4 h-4" />
                                      )}
                                      Yes, Delete
                                    </button>
                                    <button
                                      onClick={() => setConfirmDelete(null)}
                                      className="px-3 py-1.5 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-700 dark:text-white text-sm rounded-lg"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(user.id)}
                              disabled={user.clerk_id === currentUserId}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4" />
                              {user.clerk_id === currentUserId ? "Can't delete yourself" : 'Delete User'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color,
  subtitle 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number;
  color: string;
  subtitle?: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'text-blue-500 dark:text-blue-400',
    teal: 'text-teal-500 dark:text-teal-400',
    orange: 'text-orange-500 dark:text-orange-400',
    purple: 'text-purple-500 dark:text-purple-400',
    green: 'text-green-500 dark:text-green-400',
    indigo: 'text-indigo-500 dark:text-indigo-400',
  };

  return (
    <div className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-xl shadow-lg p-4">
      <div className={`${colorClasses[color]} mb-2`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-white/60">{label}</p>
      {subtitle && <p className="text-xs text-gray-400 dark:text-white/40">{subtitle}</p>}
    </div>
  );
}
