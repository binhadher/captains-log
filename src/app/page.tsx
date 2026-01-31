'use client';

import { useState, useEffect } from 'react';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Plus, Ship, AlertTriangle, Clock, FileText, Loader2, Wrench, ChevronRight, Anchor } from 'lucide-react';
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

export default function Dashboard() {
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

  useEffect(() => {
    fetchBoats();
    fetchAlerts();
    fetchActivity();
    fetchCosts();
  }, []);

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
              <div className="w-8 h-8 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                <Anchor className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-white">Captain&apos;s Log</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button onClick={() => setShowAddBoat(true)} size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                <Plus className="w-4 h-4 mr-1" />
                Add Boat
              </Button>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </div>
      </header>

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
                <div className="glass-card rounded-xl p-6 text-center h-full flex items-center justify-center">
                  <div>
                    <Loader2 className="w-5 h-5 text-cyan-500 mx-auto mb-2 animate-spin" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
                  </div>
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
                  {boats.map((boat) => (
                    <BoatCard key={boat.id} boat={boat} />
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
                <div className="glass-card rounded-xl p-4 text-center">
                  <Loader2 className="w-4 h-4 text-cyan-500 animate-spin mx-auto" />
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
                <div className="glass-card rounded-xl p-4 text-center">
                  <Loader2 className="w-4 h-4 text-cyan-500 animate-spin mx-auto" />
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
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />
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
    </div>
  );
}
