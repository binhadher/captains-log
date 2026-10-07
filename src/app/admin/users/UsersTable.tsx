'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Anchor, Users, ArrowLeft, Trash2, Mail, Ship, FileText, Camera, Clock, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';

interface Boat {
  id: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  registration_number?: string;
  hull_id?: string;
  engines?: any[];
  created_at: string;
}

export interface AdminUser {
  id: string;
  clerk_id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  last_seen_at?: string;
  boats: Boat[];
  boatCount: number;
  documents: number;
  photos: number;
  gallery: number;
  parts: number;
  safety: number;
  crew: number;
  sessions: number;
  totalSeconds: number;
}

function formatDuration(totalSeconds: number): string {
  if (!totalSeconds) return '—';
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function UsersTable({ users: initialUsers }: { users: AdminUser[] }) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleDelete(user: AdminUser) {
    if (!confirm(`Delete ${user.name || user.email} and all their data? This cannot be undone.`)) {
      return;
    }
    setDeleting(user.id);
    try {
      const res = await fetch(`/api/admin/users?id=${user.id}&clerkId=${user.clerk_id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete user');
      startTransition(() => {
        setUsers(users.filter((u) => u.id !== user.id));
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="min-h-screen bg-dubai">
      <header className="glass-header sticky top-0 z-10">
        <div className="max-w-4xl md:max-w-7xl mx-auto px-4 md:px-6">
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

      <main className="max-w-4xl md:max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6" />
              Account Holders
            </h2>
            <p className="text-white/80 text-sm mt-1">{users.length} registered accounts. Click a row to see boat details.</p>
          </div>
        </div>

        {users.length === 0 ? (
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
                    <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Content</th>
                    <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Usage</th>
                    <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Last Seen</th>
                    <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <>
                      <tr
                        key={user.id}
                        className="hover:bg-white/40 dark:hover:bg-gray-800/40 cursor-pointer"
                        onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                      >
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
                              <a
                                href={`mailto:${user.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                              >
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </a>
                              <p className="text-xs text-gray-400">Joined {new Date(user.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          <div className="flex items-center gap-1">
                            <Ship className="w-4 h-4 text-teal-600" />
                            {user.boatCount}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          <div className="space-y-0.5 text-xs">
                            <div className="flex items-center gap-1">
                              <FileText className="w-3 h-3 text-purple-500" />
                              {user.documents} docs
                            </div>
                            <div className="flex items-center gap-1">
                              <Camera className="w-3 h-3 text-pink-500" />
                              {user.photos} photos
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          <div className="space-y-0.5 text-xs">
                            <div className="flex items-center gap-1">
                              <Activity className="w-3 h-3 text-emerald-500" />
                              {user.sessions} sessions
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-indigo-500" />
                              {formatDuration(user.totalSeconds)}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-xs">
                          {user.last_seen_at ? (
                            <>
                              {new Date(user.last_seen_at).toLocaleDateString()}
                              <br />
                              <span className="text-gray-400">{new Date(user.last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(user);
                            }}
                            disabled={deleting === user.id || isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                      {expandedUser === user.id && (
                        <tr className="bg-white/30 dark:bg-gray-800/30">
                          <td colSpan={6} className="px-4 py-3">
                            <div className="text-sm">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Boats</h4>
                              {user.boats.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400">No boats.</p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {user.boats.map((boat) => (
                                    <div key={boat.id} className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                                      <p className="font-medium text-gray-900 dark:text-white">{boat.name}</p>
                                      <p className="text-xs text-gray-600 dark:text-gray-300">
                                        {boat.make} {boat.model} {boat.year ? `(${boat.year})` : ''}
                                      </p>
                                      {(boat.registration_number || boat.hull_id) && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          Reg: {boat.registration_number || '—'} · HIN: {boat.hull_id || '—'}
                                        </p>
                                      )}
                                      {boat.engines && boat.engines.length > 0 && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          {boat.engines.length} engine{boat.engines.length > 1 ? 's' : ''}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
