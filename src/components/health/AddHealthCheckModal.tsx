'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BoatComponent, HealthCheckType } from '@/types/database';

interface AddHealthCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  boatId: string;
  components: BoatComponent[];
  onSuccess: () => void;
}

const CHECK_TYPES: { id: HealthCheckType; label: string; placeholder: string }[] = [
  { id: 'oil_level', label: 'Oil Top-up', placeholder: 'e.g., Added 0.5L engine oil' },
  { id: 'fluid_level', label: 'Fluid Level', placeholder: 'e.g., Topped up hydraulic fluid' },
  { id: 'grease', label: 'Greasing', placeholder: 'e.g., Greased steering ram' },
  { id: 'visual', label: 'Visual Check', placeholder: 'e.g., Checked belt tension' },
  { id: 'other', label: 'Other', placeholder: 'Describe the check...' },
];

export function AddHealthCheckModal({
  isOpen,
  onClose,
  boatId,
  components,
  onSuccess,
}: AddHealthCheckModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    check_type: 'oil_level' as HealthCheckType,
    component_id: '',
    title: '',
    quantity: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  if (!isOpen) return null;

  const selectedType = CHECK_TYPES.find(t => t.id === formData.check_type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Please describe what you checked/did');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/boats/${boatId}/health-checks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          component_id: formData.component_id || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add health check');
      }

      // Reset and close
      setFormData({
        check_type: 'oil_level',
        component_id: '',
        title: '',
        quantity: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add health check');
    } finally {
      setLoading(false);
    }
  };

  // Group components by category
  const groupedComponents = components.reduce((acc, comp) => {
    if (!acc[comp.category]) acc[comp.category] = [];
    acc[comp.category].push(comp);
    return acc;
  }, {} as Record<string, BoatComponent[]>);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Health Check</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Check Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CHECK_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, check_type: type.id })}
                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                      formData.check_type === type.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Component (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Component
              </label>
              <select
                value={formData.component_id}
                onChange={(e) => setFormData({ ...formData, component_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">General / All</option>
                {Object.entries(groupedComponents).map(([category, comps]) => (
                  <optgroup key={category} label={category.toUpperCase()}>
                    {comps.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* What did you do */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                What did you check/do? *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={selectedType?.placeholder}
                required
              />
            </div>

            {/* Quantity (for fluid top-ups) */}
            {(formData.check_type === 'oil_level' || formData.check_type === 'fluid_level') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity Added
                </label>
                <input
                  type="text"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 0.5L, 200ml"
                />
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Any additional notes..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" loading={loading} className="flex-1">
                Save
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
