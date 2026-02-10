'use client';

import { useState } from 'react';
import { X, Calendar, Clock, FileText, Mic } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { VoiceRecorder } from '@/components/ui/VoiceRecorder';

interface ServiceScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentId: string;
  componentName: string;
  componentType: string;
  currentHours?: number;
  currentSchedule?: {
    scheduled_service_name?: string;
    service_interval_days?: number;
    service_interval_hours?: number;
    next_service_date?: string;
    next_service_hours?: number;
    service_schedule_notes?: string;
    service_schedule_doc_url?: string;
  };
  onSuccess: () => void;
}

// Common service types per component type
const SERVICE_SUGGESTIONS: Record<string, string[]> = {
  engine: ['Oil Change', 'Fuel Filters', 'Oil Filters', 'Air Filters', 'Water Separators', 'Water Impeller', 'Belts', 'Zincs/Anodes', 'Annual Service'],
  inboard_engine: ['Oil Change', 'Fuel Filters', 'Oil Filters', 'Air Filters', 'Water Separators', 'Water Impeller', 'Belts', 'Zincs/Anodes', 'Annual Service'],
  outboard_engine: ['Oil Change', 'Gear Oil', 'Fuel Filter', 'Spark Plugs', 'Water Pump Impeller', 'Anodes', 'Propeller Inspection', 'Grease Points', 'Thermostat', 'Annual Service'],
  generator: ['Oil Change', 'Fuel Filters', 'Oil Filters', 'Air Filters', 'Water Separators', 'Water Impeller', 'Belts', 'Zincs/Anodes', 'Annual Service'],
  drive_pod: ['Oil Change', 'Gear Oil', 'Steering Fluid', 'Anodes', 'Bellows Inspection', 'Propeller Inspection', 'Software Update', 'Annual Service'],
  shaft: ['Inspection', 'Seal Replacement', 'Bearing Service', 'Coupling Service', 'Annual Service'],
  propeller: ['Inspection', 'Cleaning', 'Balancing', 'Repair', 'Zincs/Anodes', 'Annual Service'],
  hydraulic: ['Fluid Change', 'Filter Replacement', 'Hose Inspection', 'Pump Service', 'Cylinder Service', 'Annual Service'],
  hydraulic_system: ['Fluid Change', 'Filter Replacement', 'Hose Inspection', 'Pump Service', 'Cylinder Service', 'Annual Service'],
  bow_thruster: ['Inspection', 'Gear Oil Change', 'Zincs/Anodes', 'Motor Service', 'Propeller Service', 'Battery Replacement', 'Annual Service'],
  stern_thruster: ['Inspection', 'Gear Oil Change', 'Zincs/Anodes', 'Motor Service', 'Propeller Service', 'Battery Replacement', 'Annual Service'],
  swim_platform: ['Fluid Check', 'Function Test', 'Hinge Lubrication', 'Seal Inspection', 'Annual Service'],
  tender_crane: ['Fluid Check', 'Function Test', 'Wire Inspection', 'Lubrication', 'Load Test', 'Annual Service'],
  passerelle: ['Fluid Check', 'Function Test', 'Hinge Lubrication', 'Teak Care', 'Annual Service'],
  tender_outboard: ['Engine Service', 'Oil Change', 'Fuel System', 'Tube Inspection', 'Floor Inspection', 'Annual Service'],
  tender_jet: ['Engine Service', 'Oil Change', 'Spark Plugs', 'Jet Pump Inspection', 'Hull Inspection', 'Winterization', 'Annual Service'],
  ac_chiller: ['Chemical Cleaning', 'Sea Water Pump', 'Chiller Pump', 'Refrigerant Service', 'Filter Cleaning', 'Electrical Check', 'Annual Service'],
  ac_air_handler: ['Filter Cleaning', 'Coil Cleaning', 'Drain Cleaning', 'Fan/Blower Service', 'Thermostat Service', 'Annual Service'],
  engine_battery: ['Voltage Check', 'Load Test', 'Clean Terminals', 'Check Water Level', 'Replacement'],
  generator_battery: ['Voltage Check', 'Load Test', 'Clean Terminals', 'Check Water Level', 'Replacement'],
  house_battery: ['Voltage Check', 'Equalization Charge', 'Clean Terminals', 'Check Water Level', 'Capacity Test', 'Replacement'],
  thruster_battery: ['Voltage Check', 'Load Test', 'Clean Terminals', 'Replacement'],
  default: ['Annual Service', 'Inspection', 'General Service', 'Repair'],
};

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
  const [step, setStep] = useState<'form' | 'upload'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showHours = ['engine', 'inboard_engine', 'outboard_engine', 'generator'].includes(componentType);
  const suggestions = SERVICE_SUGGESTIONS[componentType] || SERVICE_SUGGESTIONS.default;
  
  const [formData, setFormData] = useState({
    scheduled_service_name: currentSchedule?.scheduled_service_name || '',
    service_interval_days: currentSchedule?.service_interval_days?.toString() || '',
    service_interval_hours: currentSchedule?.service_interval_hours?.toString() || '',
    next_service_date: currentSchedule?.next_service_date || '',
    next_service_hours: currentSchedule?.next_service_hours?.toString() || '',
    service_schedule_notes: currentSchedule?.service_schedule_notes || '',
  });
  
  const [voiceNote, setVoiceNote] = useState<{ blob: Blob; duration: number } | null>(null);
  
  // Check if current value is a custom one (not in suggestions)
  const isCustomService = formData.scheduled_service_name && !suggestions.includes(formData.scheduled_service_name);
  const [showCustomInput, setShowCustomInput] = useState(isCustomService);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setStep('form');
    setVoiceNote(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/components/${componentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_service_name: formData.scheduled_service_name || null,
          service_interval_days: formData.service_interval_days ? parseInt(formData.service_interval_days) : null,
          service_interval_hours: formData.service_interval_hours ? parseInt(formData.service_interval_hours) : null,
          next_service_date: formData.next_service_date || null,
          next_service_hours: formData.next_service_hours ? parseInt(formData.next_service_hours) : null,
          service_schedule_notes: formData.service_schedule_notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update schedule');
      }

      // Move to upload step
      setStep('upload');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceRecording = (blob: Blob, duration: number) => {
    setVoiceNote({ blob, duration });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={resetAndClose} />
        
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Service Schedule</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{componentName}</p>
            </div>
            <button onClick={resetAndClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {step === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Service Type
                </label>
                {showCustomInput ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.scheduled_service_name}
                      onChange={(e) => setFormData({ ...formData, scheduled_service_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter service name..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomInput(false);
                        setFormData({ ...formData, scheduled_service_name: '' });
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      ← Choose from list
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.scheduled_service_name}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setShowCustomInput(true);
                        setFormData({ ...formData, scheduled_service_name: '' });
                      } else {
                        setFormData({ ...formData, scheduled_service_name: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select service type...</option>
                    {suggestions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="__custom__">Other (custom)...</option>
                  </select>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  What service is being scheduled?
                </p>
              </div>

              {/* Date-based scheduling */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date-based Service
                </h3>
                
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Service every (days)
                  </label>
                  <input
                    type="number"
                    value={formData.service_interval_days}
                    onChange={(e) => setFormData({ ...formData, service_interval_days: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 365 for yearly"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Next service date
                  </label>
                  <input
                    type="date"
                    value={formData.next_service_date}
                    onChange={(e) => setFormData({ ...formData, next_service_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Hours-based scheduling (for engines/generators) */}
              {showHours && (
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Hours-based Service
                    {currentHours !== undefined && (
                      <span className="text-gray-400 font-normal">(Current: {currentHours} hrs)</span>
                    )}
                  </h3>
                  
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Service every (hours)
                    </label>
                    <input
                      type="number"
                      value={formData.service_interval_hours}
                      onChange={(e) => setFormData({ ...formData, service_interval_hours: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 250"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Next service at (hours)
                    </label>
                    <input
                      type="number"
                      value={formData.next_service_hours}
                      onChange={(e) => setFormData({ ...formData, next_service_hours: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={currentHours ? `e.g., ${currentHours + 250}` : 'e.g., 500'}
                    />
                  </div>
                </div>
              )}

              {/* Planning Notes */}
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Planning Notes
                </h3>
                
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Notes for next service
                  </label>
                  <textarea
                    value={formData.service_schedule_notes}
                    onChange={(e) => setFormData({ ...formData, service_schedule_notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Use Optima D31M batteries, order from Marine Supply Co."
                    rows={2}
                  />
                </div>

                {/* Voice Note */}
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Voice Note
                  </label>
                  <VoiceRecorder
                    onRecordingComplete={handleVoiceRecording}
                    onRecordingDelete={() => setVoiceNote(null)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={resetAndClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" loading={loading} className="flex-1">
                  Save & Add Photo
                </Button>
              </div>
            </form>
          ) : (
            /* Upload Step */
            <div className="space-y-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
                ✓ Schedule saved! Now add any reference photos or documents.
              </div>

              <FileUpload 
                componentId={componentId}
                showCamera={true}
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
