import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import { canAccessAdmin } from '@/lib/admin';
import { UsersTable, AdminUser } from './UsersTable';

export default async function AdminUsersPage() {
  const { userId } = await auth();

  if (!userId || !canAccessAdmin(userId)) {
    redirect('/sign-in');
  }

  const supabase = createServerClient();

  const { data: users, error } = await supabase
    .from('users')
    .select(`
      id,
      clerk_id,
      email,
      name,
      avatar_url,
      created_at,
      last_seen_at,
      boats (
        id,
        name,
        make,
        model,
        year,
        registration_number,
        hull_id,
        engines,
        created_at
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return (
      <div className="min-h-screen bg-dubai flex items-center justify-center p-4">
        <div className="glass-card rounded-xl p-6 text-center">
          <p className="text-red-600 dark:text-red-400 mb-3">Failed to load users</p>
        </div>
      </div>
    );
  }

  const userIds = (users || []).map((u: any) => u.id);

  const { data: counts, error: countsError } = await supabase.rpc('admin_user_counts', {
    user_ids: userIds,
  });

  if (countsError) {
    console.error('admin_user_counts error:', countsError);
  }

  const countsMap: Record<string, any> = {};
  (counts || []).forEach((row: any) => {
    countsMap[row.user_id] = row;
  });

  const enrichedUsers: AdminUser[] = (users || []).map((user: any) => {
    const c = countsMap[user.id] || {};
    const documents = Number(c.documents || 0);
    const gallery = Number(c.gallery || 0);
    const parts = Number(c.parts || 0);
    const safety = Number(c.safety || 0);
    const crew = Number(c.crew || 0);
    const photos = gallery + parts + safety + crew;
    const sessions = Number(c.sessions || 0);
    const totalSeconds = Number(c.total_seconds || 0);

    return {
      ...user,
      boats: user.boats || [],
      boatCount: user.boats?.length || 0,
      documents,
      photos,
      gallery,
      parts,
      safety,
      crew,
      sessions,
      totalSeconds,
    };
  });

  return <UsersTable users={enrichedUsers} />;
}
