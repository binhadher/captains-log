'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Bell, 
  Mail, 
  Smartphone,
  Clock,
  FileText,
  Wrench,
  Gauge,
  Save,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface NotificationPreferences {
  email_enabled: boolean;
  email_address: string | null;
  push_enabled: boolean;
  notify_document_expiry: boolean;
  notify_maintenance_due: boolean;
  notify_hours_threshold: boolean;
  advance_notice_days: number;
  digest_mode: 'immediate' | 'daily' | 'weekly';
}

const defaultPreferences: NotificationPreferences = {
  email_enabled: false,
  email_address: null,
  push_enabled: false,
  notify_document_expiry: true,
  notify_maintenance_due: true,
  notify_hours_threshold: true,
  advance_notice_days: 14,
  digest_mode: 'immediate',
};

export default function SettingsPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [userEmail, setUserEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushSupported, setPushSupported] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setPushSupported(true);
    }
    
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/settings/notifications');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences || defaultPreferences);
        setUserEmail(data.userEmail || '');
      }
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save');
      }
    } catch (err) {
      setError('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const requestPushPermission = async () => {
    if (!pushSupported) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPreferences(prev => ({ ...prev, push_enabled: true }));
        // In a full implementation, we'd register the service worker
        // and get the push subscription here
      }
    } catch (err) {
      console.error('Failed to request push permission:', err);
    }
  };

  const togglePreference = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-teal-500 to-blue-600 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-teal-500 to-blue-600">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Settings</h1>
                <p className="text-white/70 text-sm">Notification preferences</p>
              </div>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-white text-teal-600 hover:bg-white/90"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Email Notifications */}
        <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Email Notifications</h2>
                  <p className="text-sm text-gray-500">Get alerts via email</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.email_enabled}
                  onChange={(e) => togglePreference('email_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
              </label>
            </div>
          </div>
          
          {preferences.email_enabled && (
            <div className="p-4 bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                value={preferences.email_address || userEmail}
                onChange={(e) => togglePreference('email_address', e.target.value)}
                placeholder={userEmail || 'your@email.com'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to use your account email
              </p>
            </div>
          )}
        </div>

        {/* Push Notifications */}
        <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Push Notifications</h2>
                  <p className="text-sm text-gray-500">
                    {pushSupported ? 'Get alerts in your browser' : 'Not supported in this browser'}
                  </p>
                </div>
              </div>
              {pushSupported ? (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.push_enabled}
                    onChange={(e) => {
                      if (e.target.checked && Notification.permission !== 'granted') {
                        requestPushPermission();
                      } else {
                        togglePreference('push_enabled', e.target.checked);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                </label>
              ) : (
                <span className="text-sm text-gray-400">Unavailable</span>
              )}
            </div>
          </div>
        </div>

        {/* What to Notify */}
        <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Alert Types</h2>
                <p className="text-sm text-gray-500">Choose what to be notified about</p>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {/* Document Expiry */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-800">Document Expiry</p>
                  <p className="text-sm text-gray-500">Registration, insurance, licenses</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.notify_document_expiry}
                  onChange={(e) => togglePreference('notify_document_expiry', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
              </label>
            </div>

            {/* Maintenance Due */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wrench className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-800">Maintenance Due</p>
                  <p className="text-sm text-gray-500">Scheduled service reminders</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.notify_maintenance_due}
                  onChange={(e) => togglePreference('notify_maintenance_due', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
              </label>
            </div>

            {/* Hours Threshold */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gauge className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-800">Engine Hours</p>
                  <p className="text-sm text-gray-500">Service due by hours</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.notify_hours_threshold}
                  onChange={(e) => togglePreference('notify_hours_threshold', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Timing */}
        <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Timing</h2>
                <p className="text-sm text-gray-500">When to send notifications</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Advance Notice */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Advance notice
              </label>
              <div className="flex gap-2">
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    onClick={() => togglePreference('advance_notice_days', days)}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      preferences.advance_notice_days === days
                        ? 'bg-teal-500 text-white border-teal-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-teal-500'
                    }`}
                  >
                    {days} days
                  </button>
                ))}
              </div>
            </div>

            {/* Digest Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification frequency
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'immediate', label: 'Immediate' },
                  { value: 'daily', label: 'Daily digest' },
                  { value: 'weekly', label: 'Weekly' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => togglePreference('digest_mode', option.value)}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      preferences.digest_mode === option.value
                        ? 'bg-teal-500 text-white border-teal-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-teal-500'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Email notifications require a valid email address. 
            You'll receive a confirmation email when you first enable notifications.
          </p>
        </div>
      </main>
    </div>
  );
}
