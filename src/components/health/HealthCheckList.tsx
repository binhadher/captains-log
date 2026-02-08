'use client';

import { Activity, Droplet, CircleDot, Eye, MoreHorizontal, Pencil, Trash2, Copy, Check, Share2, CheckSquare, Square, X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { HealthCheck, HealthCheckType } from '@/types/database';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface HealthCheckListProps {
  checks: HealthCheck[];
  showComponent?: boolean;
  onView?: (check: HealthCheck) => void;
  onEdit?: (check: HealthCheck) => void;
  onDelete?: (check: HealthCheck) => void;
  onBulkDelete?: (checks: HealthCheck[]) => Promise<void>;
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

export function HealthCheckList({ checks, showComponent = true, onView, onEdit, onDelete, onBulkDelete }: HealthCheckListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedChecks, setSelectedChecks] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedChecks);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedChecks(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedChecks.size === checks.length) {
      setSelectedChecks(new Set());
    } else {
      setSelectedChecks(new Set(checks.map(c => c.id)));
    }
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedChecks(new Set());
  };

  const getCheckText = (check: HealthCheck) => {
    return [
      check.title,
      `Type: ${check.check_type.replace('_', ' ')}`,
      `Date: ${formatDate(check.date)}`,
      showComponent && check.component_name && `Component: ${check.component_name}`,
      check.quantity && `Quantity: ${check.quantity}`,
      check.notes && `Notes: ${check.notes}`,
    ].filter(Boolean).join('\n');
  };

  const handleBulkDelete = async () => {
    if (selectedChecks.size === 0) return;
    if (!confirm(`Delete ${selectedChecks.size} health check${selectedChecks.size > 1 ? 's' : ''}?`)) return;

    setBulkDeleting(true);
    try {
      const checksToDelete = checks.filter(c => selectedChecks.has(c.id));
      if (onBulkDelete) {
        await onBulkDelete(checksToDelete);
      } else if (onDelete) {
        for (const check of checksToDelete) {
          try {
            await onDelete(check);
          } catch (err) {
            console.error('Error deleting health check:', check.id, err);
          }
        }
      }
      exitSelectMode();
    } catch (err) {
      console.error('Error bulk deleting:', err);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkShare = async () => {
    if (selectedChecks.size === 0) return;
    
    const selectedChecksList = checks.filter(c => selectedChecks.has(c.id));
    const text = selectedChecksList.map(getCheckText).join('\n\n---\n\n');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${selectedChecks.size} Health Checks`,
          text: text,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const shareCheck = async (check: HealthCheck) => {
    const text = getCheckText(check);
    if (navigator.share) {
      try {
        await navigator.share({
          title: check.title,
          text: text,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      setCopiedId(check.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const copyToClipboard = async (check: HealthCheck) => {
    const text = getCheckText(check);
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
    <div className="relative">
      {/* Select mode toggle */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
          className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
            selectMode 
              ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {selectMode ? 'Cancel' : 'Select'}
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([date, dateChecks]) => (
          <div key={date}>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              {formatDate(date)}
            </p>
            <div className="space-y-2">
              {dateChecks.map((check) => {
                const isSelected = selectedChecks.has(check.id);
                
                return (
                  <div 
                    key={check.id} 
                    className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700'
                        : 'bg-gray-50 dark:bg-gray-800/50'
                    }`}
                    onClick={() => {
                      if (selectMode) {
                        toggleSelection(check.id);
                      } else if (onView) {
                        onView(check);
                      }
                    }}
                  >
                    {/* Checkbox in select mode */}
                    {selectMode && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSelection(check.id); }}
                        className="flex-shrink-0 text-teal-600 dark:text-teal-400 self-center"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    )}

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
                    {!selectMode && (
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
                          onClick={() => shareCheck(check)}
                          className="p-1.5 text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded transition-all"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => copyToClipboard(check)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-all"
                          title="Copy"
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
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Bar for Multi-Select */}
      {selectMode && selectedChecks.size > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-50 px-4 animate-slide-up">
          <div className="max-w-md mx-auto bg-gray-900 dark:bg-gray-800 text-white rounded-2xl shadow-2xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title={selectedChecks.size === checks.length ? "Deselect all" : "Select all"}
              >
                {selectedChecks.size === checks.length ? (
                  <CheckSquare className="w-5 h-5 text-teal-400" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </button>
              <span className="text-sm font-medium">{selectedChecks.size} selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkShare}
                className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors text-sm font-medium"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
              >
                {bulkDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
              <button
                onClick={exitSelectMode}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
