'use client';

import { useState } from 'react';
import { X, Activity, Copy, Check, Share2, Pencil, Trash2, Calendar, Loader2, Droplet, CircleDot, Eye, MoreHorizontal } from 'lucide-react';
import { HealthCheck, HealthCheckType } from '@/types/database';
import { formatDate } from '@/lib/utils';

interface HealthCheckDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  check: HealthCheck | null;
  onEdit?: (check: HealthCheck) => void;
  onDelete?: (check: HealthCheck) => void;
}

const TYPE_LABELS: Record<HealthCheckType, string> = {
  oil_level: 'Oil Level Check',
  fluid_level: 'Fluid Level Check',
  grease: 'Grease Check',
  visual: 'Visual Inspection',
  other: 'Other Check',
};

const TYPE_ICONS: Record<HealthCheckType, React.ReactNode> = {
  oil_level: <Droplet className="w-5 h-5" />,
  fluid_level: <Droplet className="w-5 h-5" />,
  grease: <CircleDot className="w-5 h-5" />,
  visual: <Eye className="w-5 h-5" />,
  other: <MoreHorizontal className="w-5 h-5" />,
};

const TYPE_COLORS: Record<HealthCheckType, string> = {
  oil_level: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  fluid_level: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  grease: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  visual: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  other: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export function HealthCheckDetailModal({ isOpen, onClose, check, onEdit, onDelete }: HealthCheckDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !check) return null;

  const getCheckText = () => {
    return [
      check.title,
      `Type: ${TYPE_LABELS[check.check_type]}`,
      `Date: ${formatDate(check.date)}`,
      check.component_name && `Component: ${check.component_name}`,
      check.quantity && `Quantity: ${check.quantity}`,
      check.notes && `Notes: ${check.notes}`,
    ].filter(Boolean).join('\n');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getCheckText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = getCheckText();
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
      await handleCopy();
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete this health check?`)) return;
    
    setDeleting(true);
    try {
      await onDelete?.(check);
      onClose();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    onEdit?.(check);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Health Check
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Type Badge */}
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${TYPE_COLORS[check.check_type]}`}>
              {TYPE_ICONS[check.check_type]}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{check.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{TYPE_LABELS[check.check_type]}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Date
              </span>
              <span className="text-gray-900 dark:text-white">{formatDate(check.date)}</span>
            </div>
            {check.component_name && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Component</span>
                <span className="text-blue-600 dark:text-blue-400">{check.component_name}</span>
              </div>
            )}
            {check.quantity && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Quantity</span>
                <span className="text-gray-900 dark:text-white">{check.quantity}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {check.notes && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">{check.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            {onEdit && (
              <button
                onClick={handleEdit}
                className="col-span-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>

          {/* Delete Button */}
          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Check
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
