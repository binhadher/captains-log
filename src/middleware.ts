import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/invite/(.*)',
  '/api/invitations/(.*)',
  '/api/webhooks(.*)',
  '/terms',
  '/privacy',
  '/accept-terms',
  '/api/accept-terms',
  '/manifest.json',
  '/sw.js',
  '/workbox-(.*)',
  '/icons/(.*)',
]);

// Lightweight session tracking for admin analytics.
// Fires after auth succeeds and does not block the response.
async function trackSession(auth: any, request: Request) {
  try {
    const userId = auth.userId;
    if (!userId) return;

    const supabase = createServerClient();

    // Resolve internal users.id from clerk_id
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) return;

    const now = new Date().toISOString();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    const ua = request.headers.get('user-agent') || '';

    // Update users.last_seen_at
    await supabase
      .from('users')
      .update({ last_seen_at: now })
      .eq('id', user.id);

    // Find an active session from the last 30 minutes
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: activeSession } = await supabase
      .from('user_sessions')
      .select('id, page_views')
      .eq('user_id', user.id)
      .gt('last_seen_at', thirtyMinsAgo)
      .order('last_seen_at', { ascending: false })
      .limit(1)
      .single();

    if (activeSession) {
      await supabase
        .from('user_sessions')
        .update({
          last_seen_at: now,
          page_views: (activeSession.page_views || 1) + 1,
        })
        .eq('id', activeSession.id);
    } else {
      await supabase.from('user_sessions').insert({
        user_id: user.id,
        started_at: now,
        last_seen_at: now,
        page_views: 1,
        ip_address: ip,
        user_agent: ua,
      });
    }
  } catch (err) {
    // Never block requests for analytics failures
    console.error('Session tracking error:', err);
  }
}

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    const authResult = await auth.protect();
    // Fire-and-forget analytics
    trackSession(authResult, request);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|json|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
