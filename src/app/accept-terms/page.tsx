'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { FileText, Shield, ExternalLink, Check } from 'lucide-react';

export default function AcceptTermsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-700 to-blue-900">
        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  const handleAccept = async () => {
    if (!termsAccepted || !privacyAccepted) {
      setError('Please accept both the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/accept-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          termsAccepted: true,
          privacyAccepted: true,
          termsVersion: '1.0',
          privacyVersion: '1.0',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to record acceptance');
      }

      // Check if user has a crew profile to complete
      try {
        const crewRes = await fetch('/api/my-incomplete-crew-profile');
        if (crewRes.ok) {
          const crewData = await crewRes.json();
          if (crewData.crewMemberId) {
            // Go directly to crew profile - no dashboard
            router.push(`/crew/profile/${crewData.crewMemberId}`);
            return;
          }
        }
      } catch (e) {
        // If check fails, just go to dashboard
      }

      // No crew profile, go to dashboard
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept terms');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-700 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Captain's Log
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Before you get started, please review and accept our policies.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-8">
          {/* Terms of Service */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <label className="relative flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded flex items-center justify-center peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors">
                    {termsAccepted && <Check className="w-4 h-4 text-white" />}
                  </div>
                </label>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-gray-900 dark:text-white">Terms of Service</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  I have read and agree to the Terms of Service, including the limitation of liability and indemnification clauses.
                </p>
                <Link 
                  href="/terms" 
                  target="_blank"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Read Terms of Service
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Privacy Policy */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <label className="relative flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded flex items-center justify-center peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors">
                    {privacyAccepted && <Check className="w-4 h-4 text-white" />}
                  </div>
                </label>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-gray-900 dark:text-white">Privacy Policy</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  I have read and understand how my data will be collected, used, and protected as described in the Privacy Policy.
                </p>
                <Link 
                  href="/privacy" 
                  target="_blank"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Read Privacy Policy
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={handleAccept}
            disabled={!termsAccepted || !privacyAccepted || loading}
            loading={loading}
            className="w-full"
            size="lg"
          >
            I Agree - Continue to Captain's Log
          </Button>
          
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            By clicking "I Agree", you acknowledge that you have read, understood, and agree to be bound by these terms.
          </p>
        </div>
      </div>
    </div>
  );
}
