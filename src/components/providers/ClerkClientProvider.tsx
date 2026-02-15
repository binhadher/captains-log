'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

/**
 * ClerkClientProvider - Wraps ClerkProvider to only initialize on the client side.
 * This prevents the "Missing publishableKey" error during Next.js static builds.
 * 
 * During SSR/static build, renders a minimal loading shell instead of children
 * to prevent pages from trying to use Clerk hooks before ClerkProvider is available.
 */
export function ClerkClientProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR/static build, render a loading shell
  // This prevents pages from calling useUser/useAuth before ClerkProvider is ready
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Once mounted on client, wrap with ClerkProvider
  return <ClerkProvider>{children}</ClerkProvider>;
}
