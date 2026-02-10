'use client';

import { useState, useEffect } from 'react';
import { Battery, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EngineBatteryInfo } from '@/types/database';
import { formatDate } from '@/lib/utils';

interface EngineBatteryTabsProps {
  componentId: string;
  numberOfEngines: number;
  engineBatteries: EngineBatteryInfo[];
  onUpdate: () => void;
}

// Get engine position labels based on count
function getEnginePositions(count: number): { label: string; position: string }[] {
  const configs: Record<number, { label: string; position: string }[]> = {
    1: [{ label: 'Engine', position: 'main' }],
    2: [
      { label: 'Port Engine', position: 'port' },
      { label: 'Starboard Engine', position: 'starboard' },
    ],
    3: [
      { label: 'Port Engine', position: 'port' },
      { label: 'Center Engine', position: 'center' },
      { label: 'Starboard Engine', position: 'starboard' },
    ],
    4: [
      { label: 'Port Outer', position: 'port-outer' },
      { label: 'Port Inner', position: 'port-inner' },
      { label: 'Starboard Inner', position: 'starboard-inner' },
      { label: 'Starboard Outer', position: 'starboard-outer' },
    ],
  };
  return configs[count] || configs[2];
}

export function EngineBatteryTabs({ 
  componentId, 
  numberOfEngines, 
  engineBatteries,
  onUpdate 
}: EngineBatteryTabsProps) {
  const positions = getEnginePositions(numberOfEngines);
  const [activeTab, setActiveTab] = useState(positions[0]?.position || 'port');
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Initialize form data for each engine position
  const [formData, setFormData] = useState<Record<string, EngineBatteryInfo>>(() => {
    const initial: Record<string, EngineBatteryInfo> = {};
    positions.forEach(({ position }) => {
      const existing = engineBatteries.find(b => b.position === position);
      initial[position] = existing || { position };
    });
    return initial;
  });

  // Update form data when engineBatteries changes
  useEffect(() => {
    const updated: Record<string, EngineBatteryInfo> = {};
    positions.forEach(({ position }) => {
      const existing = engineBatteries.find(b => b.position === position);
      updated[position] = existing || { position };
    });
    setFormData(updated);
  }, [engineBatteries, numberOfEngines]);

  const currentData = formData[activeTab] || { position: activeTab };

  const updateField = (field: keyof EngineBatteryInfo, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert formData object to array
      const batteriesArray = Object.values(formData).filter(b => 
        b.battery_count || b.battery_brand || b.battery_model || b.install_date
      );

      const response = await fetch(`/api/components/${componentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engine_batteries: batteriesArray,
        }),
      });

      if (response.ok) {
        setEditMode(false);
        onUpdate();
      }
    } catch (err) {
      console.error('Error saving engine batteries:', err);
    } finally {
      setSaving(false);
    }
  };

  // Calculate battery age
  const getBatteryAge = (installDate?: string) => {
    if (!installDate) return null;
    const installed = new Date(installDate);
    const now = new Date();
    const months = Math.floor((now.getTime() - installed.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years > 0) {
      return `${years}y ${remainingMonths}m old`;
    }
    return `${months}m old`;
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {positions.map(({ label, position }) => {
          const data = formData[position];
          const hasData = data?.battery_count || data?.battery_brand;
          
          return (
            <button
              key={position}
              onClick={() => setActiveTab(position)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === position
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Battery className={`w-4 h-4 ${hasData ? 'text-green-500' : 'text-gray-400'}`} />
                <span>{label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        {!editMode ? (
          // View Mode
          <div className="space-y-3">
            {currentData.battery_count || currentData.battery_brand ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {currentData.battery_count && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Batteries</p>
                      <p className="text-gray-900 dark:text-white font-medium">{currentData.battery_count}×</p>
                    </div>
                  )}
                  {currentData.battery_type && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Type</p>
                      <p className="text-gray-900 dark:text-white font-medium">{currentData.battery_type}</p>
                    </div>
                  )}
                  {currentData.battery_brand && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Brand</p>
                      <p className="text-gray-900 dark:text-white font-medium">{currentData.battery_brand}</p>
                    </div>
                  )}
                  {currentData.battery_model && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Model</p>
                      <p className="text-gray-900 dark:text-white font-medium">{currentData.battery_model}</p>
                    </div>
                  )}
                  {currentData.battery_voltage && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Voltage</p>
                      <p className="text-gray-900 dark:text-white font-medium">{currentData.battery_voltage}</p>
                    </div>
                  )}
                  {currentData.battery_capacity && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Capacity</p>
                      <p className="text-gray-900 dark:text-white font-medium">{currentData.battery_capacity}</p>
                    </div>
                  )}
                  {currentData.install_date && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Installed</p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {formatDate(currentData.install_date)}
                        {getBatteryAge(currentData.install_date) && (
                          <span className="text-gray-500 dark:text-gray-400 ml-2">
                            ({getBatteryAge(currentData.install_date)})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                  Edit Details
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <Battery className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">No battery details recorded</p>
                <Button size="sm" onClick={() => setEditMode(true)}>
                  Add Battery Details
                </Button>
              </div>
            )}
          </div>
        ) : (
          // Edit Mode
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Number of Batteries
                </label>
                <input
                  type="number"
                  min="1"
                  value={currentData.battery_count || ''}
                  onChange={(e) => updateField('battery_count', parseInt(e.target.value) || 0)}
                  placeholder="e.g., 2"
                  className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Battery Type
                </label>
                <select
                  value={currentData.battery_type || ''}
                  onChange={(e) => updateField('battery_type', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select...</option>
                  <option value="AGM">AGM</option>
                  <option value="Lithium">Lithium (LiFePO4)</option>
                  <option value="Lead Acid">Lead Acid</option>
                  <option value="Gel">Gel</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  value={currentData.battery_brand || ''}
                  onChange={(e) => updateField('battery_brand', e.target.value)}
                  placeholder="e.g., Optima"
                  className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  value={currentData.battery_model || ''}
                  onChange={(e) => updateField('battery_model', e.target.value)}
                  placeholder="e.g., D31M"
                  className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Voltage
                </label>
                <select
                  value={currentData.battery_voltage || ''}
                  onChange={(e) => updateField('battery_voltage', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select...</option>
                  <option value="12V">12V</option>
                  <option value="24V">24V</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Capacity (per battery)
                </label>
                <input
                  type="text"
                  value={currentData.battery_capacity || ''}
                  onChange={(e) => updateField('battery_capacity', e.target.value)}
                  placeholder="e.g., 100Ah"
                  className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Install Date
                </label>
                <input
                  type="date"
                  value={currentData.install_date || ''}
                  onChange={(e) => updateField('install_date', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Save
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
