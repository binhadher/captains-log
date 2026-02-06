'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock, FileText, Bell, ChevronRight, Check, X } from 'lucide-react';
import { Alert, SEVERITY_COLORS, formatDueIn, formatHoursDue } from '@/lib/alerts';

interface AlertsListProps {
  alerts: Alert[];
  boatId: string;
  compact?: boolean;
  onAlertDismissed?: (alertId: string) => void;
  onAlertCompleted?: (alert: Alert) => void;
}

const TYPE_ICONS: Record<Alert['type'], React.ReactNode> = {
  maintenance_date: <Clock className="w-4 h-4" />,
  maintenance_hours: <Clock className="w-4 h-4" />,
  document_expiry: <FileText className="w-4 h-4" />,
  health_check: <Bell className="w-4 h-4" />,
};

export function AlertsList({ alerts, boatId, compact = false, onAlertDismissed, onAlertCompleted }: AlertsListProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleDismiss = async (e: React.MouseEvent, alert: Alert) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Dismiss this alert? It will reappear when the next service is due.')) return;
    
    setProcessingId(alert.id);
    
    // For maintenance alerts, push the next service date forward by the interval
    if (alert.componentId && (alert.type === 'maintenance_date' || alert.type === 'maintenance_hours')) {
      try {
        const response = await fetch(`/api/components/${alert.componentId}/dismiss-alert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alertType: alert.type }),
        });
        
        if (response.ok) {
          setDismissedIds(prev => new Set([...prev, alert.id]));
          onAlertDismissed?.(alert.id);
        }
      } catch (err) {
        console.error('Error dismissing alert:', err);
      }
    } else {
      // For document expiry, just hide locally
      setDismissedIds(prev => new Set([...prev, alert.id]));
      onAlertDismissed?.(alert.id);
    }
    
    setProcessingId(null);
  };

  const handleComplete = (e: React.MouseEvent, alert: Alert) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!alert.componentId) return;
    
    // Call parent to open maintenance modal with alert info
    // Parent will handle showing the form and logging the maintenance
    onAlertCompleted?.(alert);
  };

  const visibleAlerts = alerts.filter(a => !dismissedIds.has(a.id));

  if (visibleAlerts.length === 0) {
    return (
      <div className="text-center py-6">
        <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">No upcoming alerts</p>
        <p className="text-gray-400 dark:text-gray-400 text-xs mt-1">Set service intervals on your components to get reminders</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {visibleAlerts.slice(0, 5).map((alert) => {
          const colors = SEVERITY_COLORS[alert.severity];
          const daysUntilDue = alert.dueDate 
            ? Math.ceil((new Date(alert.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : null;
          const isProcessing = processingId === alert.id;
          const isMaintenanceAlert = alert.type === 'maintenance_date' || alert.type === 'maintenance_hours';

          return (
            <div 
              key={alert.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${colors.bg} ${colors.border} ${isProcessing ? 'opacity-50' : ''}`}
            >
              <div className={colors.text}>
                {TYPE_ICONS[alert.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${colors.text}`}>{alert.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{alert.description}</p>
              </div>
              <div className={`text-sm font-medium ${colors.text} whitespace-nowrap`}>
                {daysUntilDue !== null 
                  ? formatDueIn(daysUntilDue)
                  : alert.dueHours && alert.currentHours
                    ? formatHoursDue(alert.dueHours - alert.currentHours, alert.currentHours)
                    : ''
                }
              </div>
              <div className="flex items-center gap-1">
                {isMaintenanceAlert && alert.componentId && (
                  <button
                    onClick={(e) => handleComplete(e, alert)}
                    disabled={isProcessing}
                    className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    title="Mark as completed"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={(e) => handleDismiss(e, alert)}
                  disabled={isProcessing}
                  className="p-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        {visibleAlerts.length > 5 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
            +{visibleAlerts.length - 5} more alerts
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visibleAlerts.map((alert) => {
        const colors = SEVERITY_COLORS[alert.severity];
        const daysUntilDue = alert.dueDate 
          ? Math.ceil((new Date(alert.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null;
        const isProcessing = processingId === alert.id;
        const isMaintenanceAlert = alert.type === 'maintenance_date' || alert.type === 'maintenance_hours';

        const linkHref = alert.componentId 
          ? `/boats/${boatId}/components/${alert.componentId}`
          : `/boats/${boatId}`;

        return (
          <div key={alert.id} className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${colors.bg} ${colors.border} ${isProcessing ? 'opacity-50' : ''}`}>
            <Link href={linkHref} className="flex items-center gap-4 flex-1 min-w-0">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.text} bg-white/50 flex-shrink-0`}>
                {alert.severity === 'overdue' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  TYPE_ICONS[alert.type]
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${colors.text}`}>{alert.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{alert.description}</p>
              </div>
              <div className="text-right">
                <p className={`font-medium ${colors.text}`}>
                  {daysUntilDue !== null 
                    ? formatDueIn(daysUntilDue)
                    : alert.dueHours && alert.currentHours
                      ? formatHoursDue(alert.dueHours - alert.currentHours, alert.currentHours)
                      : ''
                  }
                </p>
                {alert.dueDate && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(alert.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                )}
              </div>
            </Link>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isMaintenanceAlert && alert.componentId && (
                <button
                  onClick={(e) => handleComplete(e, alert)}
                  disabled={isProcessing}
                  className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  title="Mark as completed"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => handleDismiss(e, alert)}
                disabled={isProcessing}
                className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
