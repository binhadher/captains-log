'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { HealthCheck, HealthCheckType } from '@/types/database';

interface EditHealthCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  check: HealthCheck | null;
  onSuccess: () => void;
  onDelete?: () => void;
}

const CHECK_TYPES: { value: HealthCheckType; label: string }[] = [
  { value: 'oil_level', label: 'Oil Level' },
  { value: 'fluid_level', label: 'Fluid Level' },
  { value: 'grease', label: 'Grease' },
  { value: 'visual', label: 'Visual Inspection' },
  { value: 'other', label: 'Other' },
];

export function EditHealthCheckModal({ isOpen, onClose, check, onSuccess, onDelete }: EditHealthCheckModalProps) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    check_type: 'visual' as HealthCheckType,
    title: '',
    quantity: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (check) {
      setFormData({
        check_type: check.check_type,
        title: check.title || '',
        quantity: check.quantity || '',
        notes: check.notes || '',
        date: check.date || new Date().toISOString().split('T')[0],
      });
    }
  }, [check]);

  if (!isOpen || !check) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/health-checks/${check.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
    if (!confirm(`Delete this health check? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/health-checks/${check.id}`, {
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
        
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Health Check</h2>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select
                value={formData.check_type}
                onChange={(e) => setFormData({ ...formData, check_type: e.target.value as HealthCheckType })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              >
                {CHECK_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                required
              />
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                <input
                  type="text"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="e.g., 2L added"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
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
