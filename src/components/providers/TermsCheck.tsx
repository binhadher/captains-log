'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

// Routes that don't require terms acceptance check
const EXEMPT_ROUTES = [
  '/sign-in',
  '/sign-up',
  '/terms',
  '/privacy',
  '/accept-terms',
];

export function TermsCheck({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [accepted, setAccepted] = useState(true); // Default to true to avoid flash

  useEffect(() => {
    // Don't check if not loaded or not signed in
    if (!isLoaded || !isSignedIn) {
      setChecked(true);
      return;
    }

    // Don't check for exempt routes
    if (EXEMPT_ROUTES.some(route => pathname.startsWith(route))) {
      setChecked(true);
      return;
    }

    // Check if user has accepted terms
    const checkTerms = async () => {
      try {
        const response = await fetch('/api/accept-terms');
        const data = await response.json();
        
        if (!data.accepted) {
          setAccepted(false);
          router.push('/accept-terms');
        } else {
          setAccepted(true);
        }
      } catch (error) {
        console.error('Error checking terms acceptance:', error);
        // On error, allow access but log it
        setAccepted(true);
      } finally {
        setChecked(true);
      }
    };

    checkTerms();
  }, [isLoaded, isSignedIn, pathname, router]);

  // Show nothing while checking (brief flash)
  if (!checked) {
    return null;
  }

  // If not accepted and not on exempt route, don't render children
  // (router.push will handle redirect)
  if (!accepted && !EXEMPT_ROUTES.some(route => pathname.startsWith(route))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-700 to-blue-900">
        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}
