'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, SignIn, SignUp } from '@clerk/nextjs';
import { Ship, Anchor, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface InvitationData {
  id: string;
  email: string;
  role: 'captain' | 'crew';
  expires_at: string;
  boat: {
    id: string;
    name: string;
    make?: string;
    model?: string;
    photo_url?: string;
  };
  crewMember?: {
    id: string;
    name: string;
    title: string;
    photo_url?: string;
  };
}

type InviteStatus = 'loading' | 'valid' | 'expired' | 'accepted' | 'not_found' | 'error';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { isSignedIn, isLoaded, user } = useUser();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [status, setStatus] = useState<InviteStatus>('loading');
  const [accepting, setAccepting] = useState(false);
  const [showAuth, setShowAuth] = useState<'signin' | 'signup' | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // Fetch invitation details
  useEffect(() => {
    async function fetchInvitation() {
      try {
        const res = await fetch(`/api/invitations/${token}`);
        const data = await res.json();

        if (!res.ok) {
          if (data.code === 'EXPIRED') {
            setStatus('expired');
          } else if (data.code === 'ALREADY_ACCEPTED') {
            setStatus('accepted');
          } else if (res.status === 404) {
            setStatus('not_found');
          } else {
            setStatus('error');
          }
          return;
        }

        setInvitation(data.invitation);
        setStatus('valid');
      } catch (err) {
        console.error('Error fetching invitation:', err);
        setStatus('error');
      }
    }

    if (token) {
      fetchInvitation();
    }
  }, [token]);

  // Auto-accept if user is signed in and invitation is valid
  useEffect(() => {
    if (isLoaded && isSignedIn && status === 'valid' && !accepting) {
      acceptInvitation();
    }
  }, [isLoaded, isSignedIn, status]);

  async function acceptInvitation() {
    if (accepting) return;
    setAccepting(true);
    setAcceptError(null);

    try {
      const res = await fetch(`/api/invitations/${token}`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        setAcceptError(data.error || 'Failed to accept invitation');
        setAccepting(false);
        return;
      }

      // Success! Redirect to the boat with crew profile open
      if (data.crewMemberId) {
        router.push(`/boats/${data.boatId}?viewCrew=${data.crewMemberId}`);
      } else {
        router.push(`/boats/${data.boatId}`);
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setAcceptError('Something went wrong. Please try again.');
      setAccepting(false);
    }
  }

  // Loading state
  if (status === 'loading' || !isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading invitation...</p>
        </div>
      </div>
    );
  }

  // Error states
  if (status === 'not_found') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invitation Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This invitation link is invalid or has been removed.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invitation Expired</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This invitation has expired. Please ask the boat owner to send a new invitation.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (status === 'accepted') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Already Accepted</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This invitation has already been accepted. Sign in to access the boat.
          </p>
          <button
            onClick={() => router.push('/sign-in')}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Something Went Wrong</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We couldn&apos;t load this invitation. Please try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Valid invitation - show details
  if (!invitation) return null;

  const roleLabel = invitation.role === 'captain' ? 'Captain' : 'Crew Member';

  // If signed in and accepting
  if (isSignedIn && accepting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Joining {invitation.boat.name}...
          </h1>
        </div>
      </div>
    );
  }

  // Redirect to auth pages - store token in localStorage for after verification
  if (showAuth) {
    // Store the invite token so we can retrieve it after signup/verification
    localStorage.setItem('pendingInviteToken', token);
    
    const returnUrl = encodeURIComponent(`/invite/${token}`);
    if (showAuth === 'signin') {
      window.location.href = `/sign-in?redirect_url=${returnUrl}`;
    } else {
      window.location.href = `/sign-up?redirect_url=${returnUrl}`;
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Main invitation view (not signed in)
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden max-w-md w-full">
        {/* Boat header */}
        <div className="relative h-48 bg-gradient-to-br from-teal-500 to-cyan-600">
          {invitation.boat.photo_url ? (
            <Image
              src={invitation.boat.photo_url}
              alt={invitation.boat.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Ship className="w-20 h-20 text-white/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-2xl font-bold text-white">{invitation.boat.name}</h2>
            {invitation.boat.make && (
              <p className="text-white/80 text-sm">
                {invitation.boat.make} {invitation.boat.model}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Anchor className="w-5 h-5 text-teal-600" />
            <span className="text-sm font-medium text-teal-600">You&apos;re Invited!</span>
          </div>

          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Join as {roleLabel}
          </h1>

          {invitation.crewMember && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-4">
              {invitation.crewMember.photo_url ? (
                <Image
                  src={invitation.crewMember.photo_url}
                  alt={invitation.crewMember.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <span className="text-teal-600 font-medium">
                    {invitation.crewMember.name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {invitation.crewMember.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {invitation.crewMember.title}
                </p>
              </div>
            </div>
          )}

          {/* Important: Email notice */}
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
            <p className="text-amber-800 dark:text-amber-200 text-sm">
              <strong>📧 Important:</strong> Sign up using <strong>{invitation.email}</strong> to accept this invitation.
            </p>
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            Create your account to access <strong>{invitation.boat.name}</strong>&apos;s 
            maintenance logs, documents, and more.
          </p>

          {acceptError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{acceptError}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => setShowAuth('signup')}
              className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-cyan-700 transition shadow-lg shadow-teal-500/25"
            >
              Create My Account
            </button>
            
            <button
              onClick={() => setShowAuth('signin')}
              className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              I already have an account with this email
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6">
            Invitation expires {new Date(invitation.expires_at).toLocaleDateString()}.
          </p>
        </div>
      </div>
    </div>
  );
}
