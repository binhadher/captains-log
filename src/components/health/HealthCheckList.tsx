'use client';

import { Activity, Droplet, CircleDot, Eye, MoreHorizontal, Pencil, Trash2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { HealthCheck, HealthCheckType } from '@/types/database';
import { formatDate } from '@/lib/utils';

interface HealthCheckListProps {
  checks: HealthCheck[];
  showComponent?: boolean;
  onEdit?: (check: HealthCheck) => void;
  onDelete?: (check: HealthCheck) => void;
}

const TYPE_ICONS: Record<HealthCheckType, React.ReactNode> = {
  oil_level: <Droplet className="w-4 h-4" />,
  fluid_level: <Droplet className="w-4 h-4" />,
  grease: <CircleDot className="w-4 h-4" />,
  visual: <Eye className="w-4 h-4" />,
  other: <MoreHorizontal className="w-4 h-4" />,
};

const TYPE_COLORS: Record<HealthCheckType, string> = {
  oil_level: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  fluid_level: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  grease: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  visual: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  other: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export function HealthCheckList({ checks, showComponent = true, onEdit, onDelete }: HealthCheckListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (check: HealthCheck) => {
    const text = [
      check.title,
      `Type: ${check.check_type.replace('_', ' ')}`,
      `Date: ${formatDate(check.date)}`,
      showComponent && check.component_name && `Component: ${check.component_name}`,
      check.quantity && `Quantity: ${check.quantity}`,
      check.notes && `Notes: ${check.notes}`,
    ].filter(Boolean).join('\n');
    await navigator.clipboard.writeText(text);
    setCopiedId(check.id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  if (checks.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">No health checks recorded yet</p>
      </div>
    );
  }

  // Group by date
  const grouped = checks.reduce((acc, check) => {
    const date = check.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(check);
    return acc;
  }, {} as Record<string, HealthCheck[]>);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, dateChecks]) => (
        <div key={date}>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            {formatDate(date)}
          </p>
          <div className="space-y-2">
            {dateChecks.map((check) => (
              <div key={check.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[check.check_type]}`}>
                  {TYPE_ICONS[check.check_type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">{check.title}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    {showComponent && check.component_name && (
                      <span className="text-blue-600 dark:text-blue-400">{check.component_name}</span>
                    )}
                    {check.quantity && (
                      <span>Qty: {check.quantity}</span>
                    )}
                  </div>
                  {check.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{check.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(check)}
                      className="p-1.5 text-amber-500 hover:text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded transition-all"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => copyToClipboard(check)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-all"
                    title="Copy details"
                  >
                    {copiedId === check.id ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  {onDelete && (
                    <button
                      onClick={() => {
                        if (confirm('Delete this health check?')) {
                          onDelete(check);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
