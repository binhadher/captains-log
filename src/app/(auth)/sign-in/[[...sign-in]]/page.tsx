'use client';

export const dynamic = 'force-dynamic';

import { SignIn } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect_url') || '/';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">🖖 Captain&apos;s Log</h1>
        <p className="text-blue-200 mb-8">Boat maintenance & document management</p>
        <SignIn 
          forceRedirectUrl={redirectUrl}
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-xl',
            },
          }}
        />
      </div>
    </div>
  );
}
