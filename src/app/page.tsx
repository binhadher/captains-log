'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamic import for Clerk components to prevent SSR issues
const UserButton = dynamic(
  () => import('@clerk/nextjs').then((mod) => mod.UserButton),
  { ssr: false, loading: () => <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" /> }
);
import { LandingPage } from '@/components/landing/LandingPage';
import { Plus, Ship, AlertTriangle, Clock, FileText, Wrench, ChevronRight, Anchor, Settings, Download, X, Smartphone, Search } from 'lucide-react';
import { Skeleton, AlertsListSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { BoatCard } from '@/components/boats/BoatCard';
import { AddBoatModal } from '@/components/boats/AddBoatModal';
import { BoatSetupWizard } from '@/components/boats/BoatSetupWizard';
import { Boat } from '@/types/database';
import { Alert, formatDueIn, formatHoursDue, SEVERITY_COLORS } from '@/lib/alerts';
import { ActivityFeed, ActivityItem } from '@/components/activity/ActivityFeed';
import { SpendingCard, CostSummary } from '@/components/costs/SpendingCard';
import { WeatherWidget } from '@/components/weather/WeatherWidget';
import { GlobalSearch } from '@/components/search/GlobalSearch';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function Dashboard() {
  const { isSignedIn, isLoaded } = useAuth();
  
  const [boats, setBoats] = useState<Boat[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [costs, setCosts] = useState<CostSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [costsLoading, setCostsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddBoat, setShowAddBoat] = useState(false);
  const [setupWizardBoat, setSetupWizardBoat] = useState<Boat | null>(null);
  
  // Check for pending invites before showing dashboard
  const [checkingInvites, setCheckingInvites] = useState(true);
  
  // PWA Install state
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(true); // Default true to avoid flash
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // PWA Install detection - must be before conditional returns
  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsInstalled(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Check if banner was dismissed recently (within 7 days)
    const dismissed = localStorage.getItem('install-banner-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    // Show banner if not installed and not recently dismissed
    if (!standalone && dismissedTime < sevenDaysAgo) {
      setShowInstallBanner(true);
    }

    // Capture install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const router = useRouter();

  // Check for pending invitations after sign in
  useEffect(() => {
    async function checkPendingInvites() {
      if (!isSignedIn) {
        setCheckingInvites(false);
        return;
      }
      
      try {
        // FIRST: Check localStorage for invite token (survives Clerk verification redirect)
        const storedToken = localStorage.getItem('pendingInviteToken');
        if (storedToken) {
          localStorage.removeItem('pendingInviteToken'); // Clear it
          // Redirect to invite page to complete acceptance
          router.push(`/invite/${storedToken}`);
          return; // Don't set checkingInvites false - we're redirecting
        }

        // SECOND: Check API for pending invites by email
        const res = await fetch('/api/invitations/pending');
        if (res.ok) {
          const data = await res.json();
          if (data.invitation) {
            // Auto-accept the pending invite
            const acceptRes = await fetch(`/api/invitations/${data.invitation.token}`, {
              method: 'POST'
            });
            if (acceptRes.ok) {
              const acceptData = await acceptRes.json();
              // Redirect to crew profile page to complete their info
              if (acceptData.crewMemberId) {
                router.push(`/crew/profile/${acceptData.crewMemberId}`);
              } else {
                router.push(`/boats/${acceptData.boatId}`);
              }
              return; // Don't set checkingInvites false - we're redirecting
            }
          }
        }
      } catch (err) {
        console.error('Error checking pending invites:', err);
      }
      
      // No invite found or redirect needed, show the dashboard
      setCheckingInvites(false);
    }
    
    if (isSignedIn) {
      checkPendingInvites();
    } else if (isLoaded) {
      setCheckingInvites(false);
    }
  }, [isSignedIn, isLoaded, router]);

  useEffect(() => {
    if (isSignedIn) {
      fetchBoats();
      fetchAlerts();
      fetchActivity();
      fetchCosts();
    }
  }, [isSignedIn]);

  // Show loading while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-700 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Show landing page for unauthenticated visitors
  if (!isSignedIn) {
    return <LandingPage />;
  }

  // Show loading while checking for pending invites (crew members will be redirected)
  if (checkingInvites) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-700 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4" />
        <p className="text-white/80 text-sm">Setting up your account...</p>
      </div>
    );
  }

  const fetchBoats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/boats');
      if (!response.ok) throw new Error('Failed to fetch boats');
      const data = await response.json();
      setBoats(data.boats || []);
    } catch (err) {
      console.error('Error fetching boats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load boats');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      setAlertsLoading(true);
      const response = await fetch('/api/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setAlertsLoading(false);
    }
  };

  const fetchActivity = async () => {
    try {
      setActivityLoading(true);
      const response = await fetch('/api/activity');
      if (response.ok) {
        const data = await response.json();
        setActivity(data.activity || []);
      }
    } catch (err) {
      console.error('Error fetching activity:', err);
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchCosts = async () => {
    try {
      setCostsLoading(true);
      const response = await fetch('/api/costs');
      if (response.ok) {
        const data = await response.json();
        setCosts(data.summary || null);
      }
    } catch (err) {
      console.error('Error fetching costs:', err);
    } finally {
      setCostsLoading(false);
    }
  };

  const handleAddBoat = (boat: Boat) => {
    setBoats([...boats, boat]);
    setShowAddBoat(false);
    // Show setup wizard for the new boat
    setSetupWizardBoat(boat);
  };

  const handleInstallClick = async () => {
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setShowInstallBanner(false);
        }
      } catch (err) {
        console.error('Install error:', err);
      }
      setInstallPrompt(null);
    }
  };

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    localStorage.setItem('install-banner-dismissed', Date.now().toString());
  };

  const getAlertIcon = (alert: Alert) => {
    switch (alert.type) {
      case 'document_expiry':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'maintenance_hours':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'maintenance_date':
        return <Wrench className="w-4 h-4 text-amber-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    }
  };

  const getAlertDueText = (alert: Alert) => {
    if (alert.type === 'maintenance_hours' && alert.dueHours && alert.currentHours !== undefined) {
      const hoursRemaining = alert.dueHours - alert.currentHours;
      return formatHoursDue(hoursRemaining, alert.currentHours);
    }
    if (alert.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(alert.dueDate);
      const daysUntil = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return formatDueIn(daysUntil);
    }
    return '';
  };

  const getAlertLink = (alert: Alert) => {
    if (alert.componentId) {
      return `/boats/${alert.boatId}/components/${alert.componentId}`;
    }
    return `/boats/${alert.boatId}`;
  };

  return (
    <div className="min-h-screen bg-dubai">
      {/* Header */}
      <header className="glass-header sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-100 dark:bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                <Anchor className="w-5 h-5 text-teal-700 dark:text-white" />
              </div>
              <h1 className="text-lg font-bold text-teal-700 dark:text-white">Captain&apos;s Log</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 bg-gray-200 dark:bg-white/20 hover:bg-gray-300 dark:hover:bg-white/30 rounded-lg transition-colors"
                title="Search (⌘K)"
              >
                <Search className="w-5 h-5 text-gray-700 dark:text-white" />
              </button>
              <ThemeToggle />
              <Link 
                href="/settings" 
                className="p-2 bg-gray-200 dark:bg-white/20 hover:bg-gray-300 dark:hover:bg-white/30 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-gray-700 dark:text-white" />
              </Link>
              <Button 
                onClick={installPrompt ? handleInstallClick : () => setShowInstallModal(true)} 
                size="sm" 
                className="bg-teal-600 hover:bg-teal-700 text-white border-0"
                title="Install app on this or other devices"
              >
                <Download className="w-4 h-4 mr-1" />
                Install
              </Button>
              <Button onClick={() => setShowAddBoat(true)} size="sm" className="bg-gray-200 dark:bg-white/20 hover:bg-gray-300 dark:hover:bg-white/30 text-gray-800 dark:text-white border-0">
                <Plus className="w-4 h-4 mr-1" />
                Add Boat
              </Button>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </div>
      </header>

      {/* Install App Banner */}
      {showInstallBanner && !isInstalled && (
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">Install Captain&apos;s Log</p>
                  <p className="text-xs text-white/80">
                    {isIOS 
                      ? "Tap Share ↑ then 'Add to Home Screen'" 
                      : "Quick access from your home screen"
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {installPrompt && !isIOS && (
                  <button
                    onClick={handleInstallClick}
                    className="px-4 py-2 bg-white text-teal-700 text-sm font-medium rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Install
                  </button>
                )}
                <button
                  onClick={handleDismissInstall}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Centered */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        
        {/* Section Headers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-3">
          <h2 className="lg:col-span-2 text-sm font-medium text-white/80 flex items-center gap-2">
            <Ship className="w-4 h-4" />
            My Boats
          </h2>
          <h2 className="text-sm font-medium text-white/80 flex items-center gap-2">
            🌤️ Weather
          </h2>
        </div>
        
        {/* Top Row: Boats + Weather side by side, same height */}
        <section className="mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            
            {/* Boats - takes 2 columns */}
            <div className="lg:col-span-2">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="glass-card rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <Skeleton variant="custom" className="w-14 h-14 rounded-xl" />
                        <div className="flex-1">
                          <Skeleton variant="text" width="70%" className="mb-2" />
                          <Skeleton variant="text" width="50%" height={12} className="mb-2" />
                          <div className="flex gap-2">
                            <Skeleton variant="custom" className="w-16 h-5 rounded-full" />
                            <Skeleton variant="custom" className="w-20 h-5 rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="glass-card rounded-xl p-4 h-full">
                  <p className="text-red-600 dark:text-red-400 text-sm mb-2">{error}</p>
                  <Button onClick={fetchBoats} variant="outline" size="sm">Retry</Button>
                </div>
              ) : boats.length === 0 ? (
                <div className="glass-card rounded-xl p-6 text-center h-full flex items-center justify-center">
                  <div>
                    <Ship className="w-10 h-10 text-cyan-600 dark:text-cyan-400 mx-auto mb-2" />
                    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">No boats yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">Add your first boat to get started</p>
                    <Button onClick={() => setShowAddBoat(true)} className="bg-cyan-600 hover:bg-cyan-700" size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Boat
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {boats.map((boat, index) => (
                    <BoatCard key={boat.id} boat={boat} index={index} />
                  ))}
                </div>
              )}
            </div>
            
            {/* Weather - takes 1 column, stretches to match height */}
            <div className="h-full">
              <WeatherWidget />
            </div>
          </div>
        </section>

        {/* Two Column Grid for Alerts & Spending */}
        {boats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            
            {/* Alerts */}
            <section>
              <h2 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Upcoming {alerts.length > 0 && `(${alerts.length})`}
              </h2>
              
              {alertsLoading ? (
                <div className="glass-card rounded-xl p-4">
                  <AlertsListSkeleton />
                </div>
              ) : alerts.length === 0 ? (
                <div className="glass-card rounded-xl p-4 text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">✨ All clear!</p>
                </div>
              ) : (
                <div className="glass-card rounded-xl divide-y divide-gray-200 dark:divide-gray-700">
                  {alerts.slice(0, 4).map((alert) => {
                    const colors = SEVERITY_COLORS[alert.severity];
                    return (
                      <Link 
                        key={alert.id} 
                        href={getAlertLink(alert)}
                        className="flex items-center gap-2 p-3 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        {getAlertIcon(alert)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{alert.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{alert.description}</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${colors.bg} ${colors.text} whitespace-nowrap`}>
                          {getAlertDueText(alert)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Spending */}
            <section>
              <h2 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
                <span className="text-base">💰</span>
                Spending
              </h2>
              
              {costsLoading ? (
                <div className="glass-card rounded-xl p-4">
                  <Skeleton variant="text" width={80} height={12} className="mb-3" />
                  <Skeleton variant="heading" width={120} className="mb-2" />
                  <Skeleton variant="text" width="100%" height={8} className="mb-2" />
                  <div className="flex justify-between">
                    <Skeleton variant="text" width={60} height={10} />
                    <Skeleton variant="text" width={60} height={10} />
                  </div>
                </div>
              ) : (
                <div className="glass-card rounded-xl overflow-hidden">
                  <SpendingCard summary={costs || { totalAllTime: 0, totalThisYear: 0, totalThisMonth: 0, currency: 'AED', byCategory: [], byMonth: [] }} compact />
                </div>
              )}
            </section>
          </div>
        )}

        {/* Recent Activity */}
        {boats.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Activity
            </h2>
            <div className="glass-card rounded-xl p-4">
              {activityLoading ? (
                <div className="space-y-3 py-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton variant="custom" className="w-8 h-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton variant="text" width="60%" className="mb-1" />
                        <Skeleton variant="text" width="40%" height={10} />
                      </div>
                      <Skeleton variant="text" width={50} height={10} />
                    </div>
                  ))}
                </div>
              ) : (
                <ActivityFeed items={activity.slice(0, 5)} showBoatName={boats.length > 1} compact />
              )}
            </div>
          </section>
        )}
      </main>

      {/* Add Boat Modal */}
      <AddBoatModal
        isOpen={showAddBoat}
        onClose={() => setShowAddBoat(false)}
        onSubmit={handleAddBoat}
      />

      {/* Boat Setup Wizard */}
      {setupWizardBoat && (
        <BoatSetupWizard
          isOpen={true}
          onClose={() => setSetupWizardBoat(null)}
          boatId={setupWizardBoat.id}
          boatName={setupWizardBoat.name}
          onComplete={() => {
            setSetupWizardBoat(null);
            // Refresh boats to get updated data
            fetchBoats();
          }}
        />
      )}

      {/* Install App Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Install App</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Add to home screen on any device</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {isIOS ? (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    To install on iPhone/iPad:
                  </p>
                  <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-2 list-decimal list-inside">
                    <li>Open this page in <strong>Safari</strong></li>
                    <li>Tap the <strong>Share</strong> button <span className="inline-block w-5 h-5 align-middle">↑</span></li>
                    <li>Scroll down, tap <strong>"Add to Home Screen"</strong></li>
                    <li>Tap <strong>"Add"</strong></li>
                  </ol>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    To install on Android:
                  </p>
                  <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-2 list-decimal list-inside">
                    <li>Tap the <strong>⋮ menu</strong> (3 dots) in your browser</li>
                    <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong></li>
                    <li>Tap <strong>"Install"</strong> or <strong>"Add"</strong></li>
                  </ol>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowInstallModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Search */}
      <GlobalSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </div>
  );
}
