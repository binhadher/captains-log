'use client';

import Link from 'next/link';
import { AlertTriangle, Clock, FileText, Bell, ChevronRight } from 'lucide-react';
import { Alert, SEVERITY_COLORS, formatDueIn, formatHoursDue } from '@/lib/alerts';

interface AlertsListProps {
  alerts: Alert[];
  boatId: string;
  compact?: boolean;
}

const TYPE_ICONS: Record<Alert['type'], React.ReactNode> = {
  maintenance_date: <Clock className="w-4 h-4" />,
  maintenance_hours: <Clock className="w-4 h-4" />,
  document_expiry: <FileText className="w-4 h-4" />,
  health_check: <Bell className="w-4 h-4" />,
};

export function AlertsList({ alerts, boatId, compact = false }: AlertsListProps) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-6">
        <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">No upcoming alerts</p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Set service intervals on your components to get reminders</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {alerts.slice(0, 5).map((alert) => {
          const colors = SEVERITY_COLORS[alert.severity];
          const daysUntilDue = alert.dueDate 
            ? Math.ceil((new Date(alert.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : null;

          const linkHref = alert.componentId 
            ? `/boats/${boatId}/components/${alert.componentId}?openSchedule=true`
            : `/boats/${boatId}`;

          return (
            <Link key={alert.id} href={linkHref}>
              <div 
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all ${colors.bg} ${colors.border}`}
              >
                <div className={colors.text}>
                  {TYPE_ICONS[alert.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${colors.text}`}>{alert.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{alert.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`text-sm font-medium ${colors.text}`}>
                    {daysUntilDue !== null 
                      ? formatDueIn(daysUntilDue)
                      : alert.dueHours && alert.currentHours
                        ? formatHoursDue(alert.dueHours - alert.currentHours, alert.currentHours)
                        : ''
                    }
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
            </Link>
          );
        })}
        {alerts.length > 5 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
            +{alerts.length - 5} more alerts
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const colors = SEVERITY_COLORS[alert.severity];
        const daysUntilDue = alert.dueDate 
          ? Math.ceil((new Date(alert.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null;

        const linkHref = alert.componentId 
          ? `/boats/${boatId}/components/${alert.componentId}`
          : `/boats/${boatId}`;

        return (
          <Link key={alert.id} href={linkHref}>
            <div className={`flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-md ${colors.bg} ${colors.border}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.text} bg-white/50`}>
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
              <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
