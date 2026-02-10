'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BoatComponent } from '@/types/database';

interface EditComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  component: BoatComponent | null;
  onSuccess: () => void;
}

export function EditComponentModal({ isOpen, onClose, component, onSuccess }: EditComponentModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    serial_number: '',
    install_date: '',
    current_hours: '',
    notes: '',
    // Battery fields
    battery_count: '',
    battery_type: '',
    battery_voltage: '',
    battery_capacity: '',
    // Thruster battery fields
    thruster_battery_count: '',
    thruster_battery_brand: '',
    thruster_battery_model: '',
    thruster_battery_install_date: '',
  });

  useEffect(() => {
    if (component) {
      setFormData({
        name: component.name || '',
        brand: component.brand || '',
        model: component.model || '',
        serial_number: component.serial_number || '',
        install_date: component.install_date || '',
        current_hours: component.current_hours?.toString() || '',
        notes: component.notes || '',
        // Battery fields
        battery_count: component.battery_count?.toString() || '',
        battery_type: component.battery_type || '',
        battery_voltage: component.battery_voltage || '',
        battery_capacity: component.battery_capacity || '',
        // Thruster battery fields
        thruster_battery_count: component.thruster_battery_count?.toString() || '',
        thruster_battery_brand: component.thruster_battery_brand || '',
        thruster_battery_model: component.thruster_battery_model || '',
        thruster_battery_install_date: component.thruster_battery_install_date || '',
      });
    }
  }, [component]);

  if (!isOpen || !component) return null;

  // Determine if this component should show hours (engines, generators)
  const showHours = ['engine', 'inboard_engine', 'outboard_engine', 'generator', 'drive_pod'].includes(component.type);
  
  // Determine if this is a battery component (but NOT engine_battery which uses tabs)
  const isBatteryComponent = ['house_battery', 'generator_battery', 'thruster_battery'].includes(component.type);
  
  // Determine if this is engine_battery (uses tabbed per-engine view)
  const isEngineBattery = component.type === 'engine_battery';
  
  // Determine if this is a thruster
  const isThrusterComponent = ['bow_thruster', 'stern_thruster'].includes(component.type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Component name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, any> = {
        name: formData.name.trim(),
        brand: formData.brand.trim() || null,
        model: formData.model.trim() || null,
        serial_number: formData.serial_number.trim() || null,
        install_date: formData.install_date || null,
        current_hours: formData.current_hours ? parseInt(formData.current_hours) : null,
        notes: formData.notes.trim() || null,
      };
      
      // Add battery fields for battery components
      if (isBatteryComponent) {
        payload.battery_count = formData.battery_count ? parseInt(formData.battery_count) : null;
        payload.battery_type = formData.battery_type.trim() || null;
        payload.battery_voltage = formData.battery_voltage.trim() || null;
        payload.battery_capacity = formData.battery_capacity.trim() || null;
      }
      
      // Add thruster battery fields for thrusters
      if (isThrusterComponent) {
        payload.thruster_battery_count = formData.thruster_battery_count ? parseInt(formData.thruster_battery_count) : null;
        payload.thruster_battery_brand = formData.thruster_battery_brand.trim() || null;
        payload.thruster_battery_model = formData.thruster_battery_model.trim() || null;
        payload.thruster_battery_install_date = formData.thruster_battery_install_date || null;
      }

      const response = await fetch(`/api/components/${component.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit {component.name}</h2>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g., Optima"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g., D34M"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Serial Number</label>
              <input
                type="text"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Install Date
                  {isBatteryComponent && <span className="text-amber-500 ml-1">⚡</span>}
                </label>
                <input
                  type="date"
                  value={formData.install_date}
                  onChange={(e) => setFormData({ ...formData, install_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
                {isBatteryComponent && (
                  <p className="text-xs text-gray-500 mt-1">Important for tracking battery age</p>
                )}
              </div>
              {showHours && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Hours</label>
                  <input
                    type="number"
                    value={formData.current_hours}
                    onChange={(e) => setFormData({ ...formData, current_hours: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}
            </div>

            {/* Engine Battery Note */}
            {isEngineBattery && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  🔋 <strong>Battery details per engine</strong> (Port, Starboard, etc.) are managed via the tabs on the component detail page.
                </p>
              </div>
            )}

            {/* Battery Fields (for other battery components - NOT engine_battery) */}
            {isBatteryComponent && (
              <div className="space-y-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">Battery Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Number of Batteries
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.battery_count}
                      onChange={(e) => setFormData({ ...formData, battery_count: e.target.value })}
                      placeholder="e.g., 4"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Battery Type
                    </label>
                    <select
                      value={formData.battery_type}
                      onChange={(e) => setFormData({ ...formData, battery_type: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Select type...</option>
                      <option value="AGM">AGM</option>
                      <option value="Lithium">Lithium (LiFePO4)</option>
                      <option value="Lead Acid">Lead Acid</option>
                      <option value="Gel">Gel</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Voltage
                    </label>
                    <select
                      value={formData.battery_voltage}
                      onChange={(e) => setFormData({ ...formData, battery_voltage: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Select...</option>
                      <option value="12V">12V</option>
                      <option value="24V">24V</option>
                      <option value="48V">48V</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Capacity (per battery)
                    </label>
                    <input
                      type="text"
                      value={formData.battery_capacity}
                      onChange={(e) => setFormData({ ...formData, battery_capacity: e.target.value })}
                      placeholder="e.g., 100Ah"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Thruster Battery Fields (for bow/stern thruster) */}
            {isThrusterComponent && (
              <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Thruster Batteries</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Number of Batteries
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.thruster_battery_count}
                      onChange={(e) => setFormData({ ...formData, thruster_battery_count: e.target.value })}
                      placeholder="e.g., 2"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Install Date
                    </label>
                    <input
                      type="date"
                      value={formData.thruster_battery_install_date}
                      onChange={(e) => setFormData({ ...formData, thruster_battery_install_date: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Battery Brand
                    </label>
                    <input
                      type="text"
                      value={formData.thruster_battery_brand}
                      onChange={(e) => setFormData({ ...formData, thruster_battery_brand: e.target.value })}
                      placeholder="e.g., Optima"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Battery Model
                    </label>
                    <input
                      type="text"
                      value={formData.thruster_battery_model}
                      onChange={(e) => setFormData({ ...formData, thruster_battery_model: e.target.value })}
                      placeholder="e.g., D31M"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>
            )}

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
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={saving} className="flex-1">
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
