'use client';

import { useState } from 'react';
import { X, Send, Loader2, CheckCircle, UserPlus, ChevronDown } from 'lucide-react';

interface InviteCrewModalProps {
  isOpen: boolean;
  onClose: () => void;
  boatId: string;
  boatName: string;
  onInviteSent?: () => void;
}

const CREW_TITLES = [
  { value: 'captain', label: 'Captain', emoji: '👨‍✈️' },
  { value: 'first_mate', label: 'First Mate', emoji: '🧑‍✈️' },
  { value: 'engineer', label: 'Engineer', emoji: '🔧' },
  { value: 'mechanic', label: 'Mechanic', emoji: '🛠️' },
  { value: 'deckhand', label: 'Deckhand', emoji: '⚓' },
  { value: 'chef', label: 'Chef', emoji: '👨‍🍳' },
  { value: 'steward', label: 'Steward', emoji: '🛎️' },
  { value: 'stewardess', label: 'Stewardess', emoji: '🛎️' },
  { value: 'bosun', label: 'Bosun', emoji: '⚓' },
  { value: 'other', label: 'Other', emoji: '👤' },
];

export function InviteCrewModal({ 
  isOpen, 
  onClose, 
  boatId, 
  boatName,
  onInviteSent 
}: InviteCrewModalProps) {
  const [title, setTitle] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle('');
    setName('');
    setEmail('');
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      setError('Please select a role');
      return;
    }
    
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    if (!email.trim()) {
      setError('Please enter an email address');
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
      const res = await fetch(`/api/boats/${boatId}/crew/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          name: name.trim(),
          email: email.toLowerCase().trim(),
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

      // Auto-close after 2.5 seconds
      setTimeout(() => {
        handleClose();
      }, 2500);

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
          <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
          
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Invitation Sent! 🎉
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>{name}</strong> will receive an email with instructions to join <strong>{boatName}</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
        
        <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Invite Crew
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  to {boatName}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role *
              </label>
              <div className="relative">
                <select
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={sending}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="">Select a role...</option>
                  {CREW_TITLES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.emoji} {t.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                disabled={sending}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                disabled={sending}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Info */}
            <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
              <p className="text-teal-700 dark:text-teal-300 text-sm">
                📧 They&apos;ll receive an email with a link to create their account and access the boat.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={sending || !title || !name || !email}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25"
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
          </form>
        </div>
      </div>
    </div>
  );
}
