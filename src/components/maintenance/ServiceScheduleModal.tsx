'use client';

import { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ServiceScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentId: string;
  componentName: string;
  componentType: string;
  currentHours?: number;
  currentSchedule?: {
    service_interval_days?: number;
    service_interval_hours?: number;
    next_service_date?: string;
    next_service_hours?: number;
  };
  onSuccess: () => void;
}

export function ServiceScheduleModal({
  isOpen,
  onClose,
  componentId,
  componentName,
  componentType,
  currentHours,
  currentSchedule,
  onSuccess,
}: ServiceScheduleModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showHours = ['engine', 'generator'].includes(componentType);
  
  const [formData, setFormData] = useState({
    service_interval_days: currentSchedule?.service_interval_days?.toString() || '',
    service_interval_hours: currentSchedule?.service_interval_hours?.toString() || '',
    next_service_date: currentSchedule?.next_service_date || '',
    next_service_hours: currentSchedule?.next_service_hours?.toString() || '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/components/${componentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_interval_days: formData.service_interval_days ? parseInt(formData.service_interval_days) : null,
          service_interval_hours: formData.service_interval_hours ? parseInt(formData.service_interval_hours) : null,
          next_service_date: formData.next_service_date || null,
          next_service_hours: formData.next_service_hours ? parseInt(formData.next_service_hours) : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update schedule');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Service Schedule</h2>
              <p className="text-sm text-gray-500">{componentName}</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date-based scheduling */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date-based Service
              </h3>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Service every (days)
                </label>
                <input
                  type="number"
                  value={formData.service_interval_days}
                  onChange={(e) => setFormData({ ...formData, service_interval_days: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 365 for yearly"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Next service date
                </label>
                <input
                  type="date"
                  value={formData.next_service_date}
                  onChange={(e) => setFormData({ ...formData, next_service_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Hours-based scheduling (for engines/generators) */}
            {showHours && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Hours-based Service
                  {currentHours !== undefined && (
                    <span className="text-gray-400 font-normal">(Current: {currentHours} hrs)</span>
                  )}
                </h3>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Service every (hours)
                  </label>
                  <input
                    type="number"
                    value={formData.service_interval_hours}
                    onChange={(e) => setFormData({ ...formData, service_interval_hours: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 250"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Next service at (hours)
                  </label>
                  <input
                    type="number"
                    value={formData.next_service_hours}
                    onChange={(e) => setFormData({ ...formData, next_service_hours: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={currentHours ? `e.g., ${currentHours + 250}` : 'e.g., 500'}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" loading={loading} className="flex-1">
                Save Schedule
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
