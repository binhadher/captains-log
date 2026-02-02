'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { getMaintenanceItems } from '@/lib/maintenance-items';
import { useCurrency, AedSymbol } from '@/components/providers/CurrencyProvider';

interface AddMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentId: string;
  componentType: string;
  componentName: string;
  currentHours?: number;
  onSuccess: () => void;
}

export function AddMaintenanceModal({
  isOpen,
  onClose,
  componentId,
  componentType,
  componentName,
  currentHours,
  onSuccess,
}: AddMaintenanceModalProps) {
  const { currency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'upload'>('form');
  const [savedLogId, setSavedLogId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    maintenance_item: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    cost: '',
    hours_at_service: currentHours?.toString() || '',
    notes: '',
  });

  const maintenanceItems = getMaintenanceItems(componentType);
  const showHours = ['engine', 'generator'].includes(componentType);

  const resetAndClose = () => {
    setStep('form');
    setSavedLogId(null);
    setFormData({
      maintenance_item: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      cost: '',
      hours_at_service: currentHours?.toString() || '',
      notes: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.maintenance_item) {
      setError('Please select a maintenance item');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/components/${componentId}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maintenance_item: formData.maintenance_item,
          date: formData.date,
          description: formData.maintenance_item === 'other' ? formData.description : formData.description,
          cost: formData.cost ? parseFloat(formData.cost) : null,
          currency: currency,
          hours_at_service: formData.hours_at_service ? parseInt(formData.hours_at_service) : null,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add log');
      }

      const { log } = await response.json();
      setSavedLogId(log.id);
      setStep('upload');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Maintenance Log</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{componentName}</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {step === 'form' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            {/* Maintenance Item */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Service Type *
              </label>
              <select
                value={formData.maintenance_item}
                onChange={(e) => setFormData({ ...formData, maintenance_item: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select service type...</option>
                {maintenanceItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Description - required for "Other" */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description {formData.maintenance_item === 'other' && '*'}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={formData.maintenance_item === 'other' ? 'Describe the maintenance work...' : 'Optional details...'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                required={formData.maintenance_item === 'other'}
              />
            </div>

            {/* Hours at Service - only for engines/generators */}
            {showHours && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hours at Service
                </label>
                <input
                  type="number"
                  value={formData.hours_at_service}
                  onChange={(e) => setFormData({ ...formData, hours_at_service: e.target.value })}
                  placeholder={currentHours ? `Current: ${currentHours}` : 'Enter hours'}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {/* Cost */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  {currency === 'AED' ? (
                    <AedSymbol className="w-4 h-4" />
                  ) : currency === 'USD' ? (
                    '$'
                  ) : (
                    '€'
                  )}
                  <span className="text-sm">{currency}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes, vendor info, parts used..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={resetAndClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" loading={loading} className="flex-1">
                Save & Add Photos
              </Button>
            </div>
          </form>
        ) : (
          /* Upload Step */
          <div className="space-y-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
              ✓ Maintenance log saved! Now add any photos or documents.
            </div>

            <FileUpload 
              componentId={componentId}
              logEntryId={savedLogId || undefined}
            />

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  onSuccess();
                  resetAndClose();
                }} 
                className="flex-1"
              >
                Skip
              </Button>
              <Button 
                onClick={() => {
                  onSuccess();
                  resetAndClose();
                }}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
