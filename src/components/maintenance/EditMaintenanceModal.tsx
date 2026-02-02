'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getMaintenanceItems } from '@/lib/maintenance-items';

interface LogEntry {
  id: string;
  maintenance_item: string;
  date: string;
  description: string;
  cost?: number;
  currency: string;
  hours_at_service?: number;
  notes?: string;
}

interface EditMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: LogEntry | null;
  componentType: string;
  onSuccess: () => void;
  onDelete?: () => void;
}

export function EditMaintenanceModal({ 
  isOpen, 
  onClose, 
  log, 
  componentType,
  onSuccess, 
  onDelete 
}: EditMaintenanceModalProps) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    maintenance_item: '',
    date: '',
    description: '',
    cost: '',
    currency: 'AED',
    hours_at_service: '',
    notes: '',
  });

  const maintenanceItems = getMaintenanceItems(componentType);
  const showHours = ['engine', 'inboard_engine', 'outboard_engine', 'generator'].includes(componentType);

  useEffect(() => {
    if (log) {
      setFormData({
        maintenance_item: log.maintenance_item || '',
        date: log.date || '',
        description: log.description || '',
        cost: log.cost?.toString() || '',
        currency: log.currency || 'AED',
        hours_at_service: log.hours_at_service?.toString() || '',
        notes: log.notes || '',
      });
    }
  }, [log]);

  if (!isOpen || !log) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.maintenance_item) {
      setError('Please select a maintenance item');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/maintenance-logs/${log.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maintenance_item: formData.maintenance_item,
          date: formData.date,
          description: formData.description.trim(),
          cost: formData.cost ? parseFloat(formData.cost) : null,
          currency: formData.currency,
          hours_at_service: formData.hours_at_service ? parseInt(formData.hours_at_service) : null,
          notes: formData.notes.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this maintenance log? This cannot be undone.')) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/maintenance-logs/${log.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');
      
      onDelete?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Maintenance Log</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Service Type *
              </label>
              <select
                value={formData.maintenance_item}
                onChange={(e) => setFormData({ ...formData, maintenance_item: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                required
              >
                <option value="">Select service type</option>
                {maintenanceItems.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
              {showHours && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hours</label>
                  <input
                    type="number"
                    value={formData.hours_at_service}
                    onChange={(e) => setFormData({ ...formData, hours_at_service: e.target.value })}
                    placeholder="Engine hours"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What was done?"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cost</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                >
                  <option value="AED">AED</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="Additional notes..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
              {onDelete && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              )}
              <div className="flex-1" />
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
