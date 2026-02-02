// Admin configuration
// For now, single admin - we'll expand this later with a database table

const ADMIN_USER_IDS = [
  'user_394LGH1nHuuopeQxwh7bLLUgNsX', // Del Boy
];

export function isAdmin(clerkUserId: string | null): boolean {
  if (!clerkUserId) return false;
  return ADMIN_USER_IDS.includes(clerkUserId);
}

export function canAccessAdmin(clerkUserId: string | null): boolean {
  if (!clerkUserId) return false;
  return isAdmin(clerkUserId);
}
