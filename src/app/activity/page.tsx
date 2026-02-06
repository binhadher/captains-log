'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { 
  Activity as ActivityIcon, 
  Wrench, 
  FileText, 
  Ship,
  ArrowLeft,
  Calendar,
  Clock
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useCurrency, AedSymbol } from '@/components/providers/CurrencyProvider';
import { CurrencyToggle } from '@/components/ui/CurrencyToggle';
import { formatDate } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'maintenance' | 'document' | 'health_check';
  title: string;
  description: string;
  boat_name: string;
  boat_id: string;
  component_name?: string;
  component_id?: string;
  cost?: number;
  currency?: string;
  date: string;
  created_at: string;
}

export default function ActivityPage() {
  const { currency } = useCurrency();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      const response = await fetch('/api/activity?limit=50');
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.error('Error fetching activity:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'maintenance':
        return <Wrench className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      default:
        return <ActivityIcon className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'maintenance':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'document':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    }
  };

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateStr);
  };

  // Group activities by date
  const groupedActivities = activities.reduce((groups, activity) => {
    const date = new Date(activity.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, ActivityItem[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-teal-500 to-blue-600 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="glass-header sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link href="/" className="p-2 hover:bg-gray-200 dark:hover:bg-white/20 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-white" />
              </Link>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Activity</h1>
            </div>
            <div className="flex items-center gap-2">
              <CurrencyToggle />
              <ThemeToggle />
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/20 rounded w-3/4" />
                    <div className="h-3 bg-white/20 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <ActivityIcon className="w-12 h-12 text-white/40 mx-auto mb-4" />
            <p className="text-white/80 font-medium mb-2">No activity yet</p>
            <p className="text-white/60 text-sm">
              Your maintenance logs and updates will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedActivities).map(([date, items]) => (
              <div key={date}>
                <h2 className="text-sm font-medium text-white/60 mb-3 px-1">{date}</h2>
                <div className="space-y-2">
                  {items.map((activity) => (
                    <Link
                      key={activity.id}
                      href={
                        activity.component_id
                          ? `/boats/${activity.boat_id}/components/${activity.component_id}`
                          : `/boats/${activity.boat_id}`
                      }
                      className="glass-card rounded-xl p-4 block hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
                    >
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {activity.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                            {activity.component_name && `${activity.component_name} • `}
                            {activity.boat_name}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(activity.date)}
                            </span>
                            {activity.cost && (
                              <span className="flex items-center gap-1">
                                {currency === 'AED' && <AedSymbol className="w-3 h-3" />}
                                {currency === 'USD' && '$'}
                                {currency === 'EUR' && '€'}
                                {activity.cost.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
