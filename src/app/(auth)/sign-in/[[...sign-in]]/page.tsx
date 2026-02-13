'use client';

import { SignIn } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SignInContent() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect_url') || '/';

  return (
    <SignIn 
      forceRedirectUrl={redirectUrl}
      appearance={{
        elements: {
          rootBox: 'mx-auto',
          card: 'shadow-xl',
        },
      }}
    />
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">🖖 Captain&apos;s Log</h1>
        <p className="text-blue-200 mb-8">Boat maintenance & document management</p>
        <Suspense fallback={<div className="text-white">Loading...</div>}>
          <SignInContent />
        </Suspense>
      </div>
    </div>
  );
}
