// Admin configuration
// For now, single admin - we'll expand this later with a database table

// TODO: Replace with your actual Clerk user ID
// You can find this in the Clerk dashboard or it will show on the admin page
const ADMIN_USER_IDS = [
  'user_REPLACE_WITH_YOUR_CLERK_ID', // Del Boy - replace after first login
];

export function isAdmin(clerkUserId: string | null): boolean {
  if (!clerkUserId) return false;
  return ADMIN_USER_IDS.includes(clerkUserId);
}

// Temporary: Allow first user to access admin to get their ID
// Remove this after setting up the real admin ID
const ALLOW_FIRST_USER_ADMIN_ACCESS = true;

export function canAccessAdmin(clerkUserId: string | null): boolean {
  if (!clerkUserId) return false;
  if (ALLOW_FIRST_USER_ADMIN_ACCESS) return true; // Temporary - remove after setup
  return isAdmin(clerkUserId);
}
