'use client';

import { useState } from 'react';
import { X, Mail, Send, Loader2, CheckCircle, UserPlus } from 'lucide-react';
import { CrewMember } from '@/types/database';

interface InviteCrewModalProps {
  isOpen: boolean;
  onClose: () => void;
  boatId: string;
  boatName: string;
  crewMember?: CrewMember | null;  // Pre-fill if inviting existing crew member
  onInviteSent?: () => void;
}

export function InviteCrewModal({ 
  isOpen, 
  onClose, 
  boatId, 
  boatName,
  crewMember,
  onInviteSent 
}: InviteCrewModalProps) {
  const [email, setEmail] = useState(crewMember?.email || '');
  const [role, setRole] = useState<'captain' | 'crew'>('crew');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/boats/${boatId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          role,
          crewMemberId: crewMember?.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send invitation');
        setSending(false);
        return;
      }

      setSuccess(true);
      onInviteSent?.();

      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setEmail('');
        setRole('crew');
      }, 2000);

    } catch (err) {
      console.error('Error sending invitation:', err);
      setError('Something went wrong. Please try again.');
      setSending(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Invitation Sent!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              An email has been sent to <strong>{email}</strong> with instructions to join {boatName}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Invite to Captain&apos;s Log
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            {crewMember && (
              <div className="mb-4 p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                <p className="text-sm text-cyan-800 dark:text-cyan-200">
                  Inviting <strong>{crewMember.name}</strong> to access {boatName}
                </p>
              </div>
            )}

            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Send an invitation email to let this person create their own account and access {boatName}&apos;s maintenance logs, documents, and more.
            </p>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="crew@example.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  disabled={sending}
                />
              </div>
            </div>

            {/* Role */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Access Level
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('crew')}
                  disabled={sending}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    role === 'crew'
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="text-2xl">⚓</span>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">Crew</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Add logs & checks
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('captain')}
                  disabled={sending}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    role === 'captain'
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="text-2xl">👨‍✈️</span>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">Captain</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Full access, can invite
                  </p>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={sending || !email}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Invitation
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
              The invitation will expire in 7 days.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
