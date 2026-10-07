'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Anchor, Users, ArrowLeft, Shield, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { SafeImage } from '@/components/ui/SafeImage';

interface Boat {
  id: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
}

interface AdminUser {
  id: string;
  clerk_id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  boats: Boat[];
  boatCount: number;
  lastActivity: string;
}

export default function AdminUsersPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/admin/users');
        if (res.status === 401) {
          setUnauthorized(true);
          return;
        }
        if (!res.ok) throw new Error('Failed to load users');
        const data = await res.json();
        setUsers(data.users || []);
      } catch (err) {
        console.error('Admin users error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded && isSignedIn) {
      fetchUsers();
    } else if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  async function handleDelete(user: AdminUser) {
    if (!confirm(`Delete ${user.name || user.email} and all their data? This cannot be undone.`)) {
      return;
    }
    setDeleting(user.id);
    try {
      const res = await fetch(`/api/admin/users?id=${user.id}&clerkId=${user.clerk_id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete user');
      setUsers(users.filter((u) => u.id !== user.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(null);
    }
  }

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
              <Link href="/admin">
                <Button size="sm" variant="outline" className="border-gray-300 dark:border-white/20">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl md:max-w-6xl mx-auto px-4 md:px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6" />
              Users
            </h2>
            <p className="text-white/80 text-sm mt-1">{users.length} registered accounts.</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-xl p-4">
                <Skeleton variant="text" width="40%" className="mb-2" />
                <Skeleton variant="text" width="60%" height={12} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="glass-card rounded-xl p-6 text-center">
            <p className="text-red-600 dark:text-red-400 mb-3">{error}</p>
            <Button onClick={() => window.location.reload()} size="sm">Retry</Button>
          </div>
        ) : users.length === 0 ? (
          <div className="glass-card rounded-xl p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">No users found.</p>
          </div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">User</th>
                    <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Boats</th>
                    <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Joined</th>
                    <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Last Activity</th>
                    <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/40 dark:hover:bg-gray-800/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <SafeImage
                            src={user.avatar_url || '/icons/icon-96x96.png'}
                            alt={user.name || user.email}
                            width={36}
                            height={36}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{user.name || 'Unnamed'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {user.boatCount > 0 ? (
                          <ul className="space-y-0.5">
                            {user.boats.slice(0, 3).map((boat) => (
                              <li key={boat.id} className="text-xs">{boat.name}</li>
                            ))}
                            {user.boats.length > 3 && (
                              <li className="text-xs text-gray-500">+{user.boats.length - 3} more</li>
                            )}
                          </ul>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {new Date(user.lastActivity).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                          onClick={() => handleDelete(user)}
                          disabled={deleting === user.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
