export const dynamic = 'force-dynamic';

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">🖖 Captain&apos;s Log</h1>
        <p className="text-blue-200 mb-8">Boat maintenance & document management</p>
        <SignUp 
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
