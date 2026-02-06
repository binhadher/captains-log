'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePathname, useRouter } from 'next/navigation';

const PUBLIC_PATHS = [
  '/sign-in',
  '/sign-up',
  '/terms',
  '/privacy',
  '/accept-terms',
];

export function TermsCheck({ children }: { children: React.ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkTermsAcceptance() {
      // Don't check if not loaded or not signed in
      if (!isLoaded || !isSignedIn || !user) {
        setChecking(false);
        return;
      }

      // Don't check on public paths
      if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
        setChecking(false);
        return;
      }

      try {
        const response = await fetch('/api/accept-terms');
        if (response.ok) {
          const data = await response.json();
          setHasAcceptedTerms(data.accepted);
          
          if (!data.accepted) {
            router.push('/accept-terms');
          }
        } else {
          // If API fails, assume not accepted (new user)
          setHasAcceptedTerms(false);
          router.push('/accept-terms');
        }
      } catch (error) {
        console.error('Error checking terms status:', error);
        // On error, redirect to accept-terms to be safe
        setHasAcceptedTerms(false);
        router.push('/accept-terms');
      } finally {
        setChecking(false);
      }
    }

    checkTermsAcceptance();
  }, [isLoaded, isSignedIn, user, pathname, router]);

  // Show loading while checking
  if (checking && isSignedIn && !PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-700 to-blue-900">
        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}
