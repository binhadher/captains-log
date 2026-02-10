'use client';

import { useState } from 'react';
import { X, Receipt, Mic } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { VoiceRecorder } from '@/components/ui/VoiceRecorder';
import { ReceiptScanner } from '@/components/ui/ReceiptScanner';
import { getMaintenanceItems } from '@/lib/maintenance-items';
import { useCurrency, AedSymbol } from '@/components/providers/CurrencyProvider';

interface AddMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentId: string;
  componentType: string;
  componentName: string;
  currentHours?: number;
  numberOfEngines?: number; // For engine_battery - determines how many position options
  onSuccess: () => void;
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

export function AddMaintenanceModal({
  isOpen,
  onClose,
  componentId,
  componentType,
  componentName,
  currentHours,
  numberOfEngines = 2,
  onSuccess,
}: AddMaintenanceModalProps) {
  const { currency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'upload'>('form');
  const [savedLogId, setSavedLogId] = useState<string | null>(null);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [voiceNote, setVoiceNote] = useState<{ blob: Blob; duration: number } | null>(null);
  const [receiptImage, setReceiptImage] = useState<Blob | null>(null);
  const [formData, setFormData] = useState({
    maintenance_item: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    cost: '',
    hours_at_service: currentHours?.toString() || '',
    notes: '',
  });
  
  // Battery update fields (shown when logging replacement on battery components)
  const [updateBatteryDetails, setUpdateBatteryDetails] = useState(false);
  const [batteryDetails, setBatteryDetails] = useState({
    battery_count: '',
    battery_type: '',
    battery_voltage: '',
    battery_capacity: '',
    battery_brand: '',
    battery_model: '',
  });

  // Engine position for engine_battery type
  const [selectedEnginePosition, setSelectedEnginePosition] = useState<string>('');
  const [applyToAllEngines, setApplyToAllEngines] = useState(false);
  const isEngineBattery = componentType === 'engine_battery';
  const enginePositions = isEngineBattery ? getEnginePositions(numberOfEngines) : [];

  const maintenanceItems = getMaintenanceItems(componentType);
  const showHours = ['engine', 'generator'].includes(componentType);
  
  // Check if this is a battery component (NOT engine_battery which has engine selector)
  const isBatteryComponent = ['house_battery', 'generator_battery', 'thruster_battery'].includes(componentType);
  
  // Check if this is a thruster (for thruster battery update)
  const isThrusterComponent = ['bow_thruster', 'stern_thruster'].includes(componentType);
  
  // Show battery update option when logging replacement
  const showBatteryUpdateOption = (isBatteryComponent || isEngineBattery) && formData.maintenance_item === 'replacement'
    || (isThrusterComponent && (formData.maintenance_item === 'replacement' || formData.maintenance_item === 'battery_replacement'));

  const resetAndClose = () => {
    setStep('form');
    setSavedLogId(null);
    setVoiceNote(null);
    setReceiptImage(null);
    setUpdateBatteryDetails(false);
    setSelectedEnginePosition('');
    setApplyToAllEngines(false);
    setBatteryDetails({
      battery_count: '',
      battery_type: '',
      battery_voltage: '',
      battery_capacity: '',
      battery_brand: '',
      battery_model: '',
    });
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

  const handleReceiptScanned = (data: { cost?: number; date?: string; vendor?: string }, imageBlob: Blob) => {
    setReceiptImage(imageBlob);
    setShowReceiptScanner(false);
    
    // Auto-fill form with extracted data
    if (data.cost) {
      setFormData(prev => ({ ...prev, cost: data.cost!.toString() }));
    }
    if (data.date) {
      setFormData(prev => ({ ...prev, date: data.date! }));
    }
    if (data.vendor) {
      setFormData(prev => ({ ...prev, notes: prev.notes ? `${prev.notes}\nVendor: ${data.vendor}` : `Vendor: ${data.vendor}` }));
    }
  };

  const handleVoiceRecording = (blob: Blob, duration: number) => {
    setVoiceNote({ blob, duration });
  };

  if (!isOpen) return null;

  // Show receipt scanner if active
  if (showReceiptScanner) {
    return (
      <ReceiptScanner
        onDataExtracted={handleReceiptScanned}
        onCancel={() => setShowReceiptScanner(false)}
      />
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.maintenance_item) {
      setError('Please select a maintenance item');
      return;
    }
    
    // For engine battery, require engine selection OR apply to all
    if (isEngineBattery && !selectedEnginePosition && !applyToAllEngines) {
      setError('Please select which engine or apply to all');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Determine which positions to log for
      const positionsToLog = isEngineBattery 
        ? (applyToAllEngines ? enginePositions : [enginePositions.find(p => p.position === selectedEnginePosition)!])
        : [null]; // null means no position prefix needed
      
      let lastLogId: string | null = null;
      const costPerEngine = formData.cost && applyToAllEngines && positionsToLog.length > 1
        ? (parseFloat(formData.cost) / positionsToLog.length) // Split cost across engines
        : formData.cost ? parseFloat(formData.cost) : null;

      // Create log entry for each position
      for (const pos of positionsToLog) {
        // Build description with engine position prefix for engine_battery
        let description = formData.description;
        if (pos) {
          description = description ? `[${pos.label}] ${description}` : `[${pos.label}]`;
        }

        const response = await fetch(`/api/components/${componentId}/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            maintenance_item: formData.maintenance_item,
            date: formData.date,
            description: description,
            cost: costPerEngine,
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
        lastLogId = log.id;
      }
      
      // Update battery details if checkbox was checked
      if (updateBatteryDetails && showBatteryUpdateOption) {
        const batteryUpdate: Record<string, unknown> = {};
        
        if (isEngineBattery && (selectedEnginePosition || applyToAllEngines)) {
          // For engine battery, update the engine_batteries JSONB
          const currentResponse = await fetch(`/api/components/${componentId}`);
          if (currentResponse.ok) {
            const currentData = await currentResponse.json();
            const currentBatteries = [...(currentData.component.engine_batteries || [])];
            
            // Determine which positions to update
            const positionsToUpdate = applyToAllEngines 
              ? enginePositions.map(p => p.position) 
              : [selectedEnginePosition];
            
            for (const position of positionsToUpdate) {
              const existingIndex = currentBatteries.findIndex((b: any) => b.position === position);
              const newEntry = {
                position: position,
                battery_count: batteryDetails.battery_count ? parseInt(batteryDetails.battery_count) : undefined,
                battery_type: batteryDetails.battery_type || undefined,
                battery_voltage: batteryDetails.battery_voltage || undefined,
                battery_capacity: batteryDetails.battery_capacity || undefined,
                battery_brand: batteryDetails.battery_brand || undefined,
                battery_model: batteryDetails.battery_model || undefined,
                install_date: formData.date,
              };
              
              if (existingIndex >= 0) {
                currentBatteries[existingIndex] = { ...currentBatteries[existingIndex], ...newEntry };
              } else {
                currentBatteries.push(newEntry);
              }
            }
            
            batteryUpdate.engine_batteries = currentBatteries;
          }
        } else if (isBatteryComponent) {
          // Update battery component fields (house, generator, thruster batteries)
          if (batteryDetails.battery_count) batteryUpdate.battery_count = parseInt(batteryDetails.battery_count);
          if (batteryDetails.battery_type) batteryUpdate.battery_type = batteryDetails.battery_type;
          if (batteryDetails.battery_voltage) batteryUpdate.battery_voltage = batteryDetails.battery_voltage;
          if (batteryDetails.battery_capacity) batteryUpdate.battery_capacity = batteryDetails.battery_capacity;
          if (batteryDetails.battery_brand) batteryUpdate.brand = batteryDetails.battery_brand;
          if (batteryDetails.battery_model) batteryUpdate.model = batteryDetails.battery_model;
          batteryUpdate.install_date = formData.date; // Set install date to service date
        } else if (isThrusterComponent) {
          // Update thruster battery fields
          if (batteryDetails.battery_count) batteryUpdate.thruster_battery_count = parseInt(batteryDetails.battery_count);
          if (batteryDetails.battery_brand) batteryUpdate.thruster_battery_brand = batteryDetails.battery_brand;
          if (batteryDetails.battery_model) batteryUpdate.thruster_battery_model = batteryDetails.battery_model;
          batteryUpdate.thruster_battery_install_date = formData.date;
        }
        
        if (Object.keys(batteryUpdate).length > 0) {
          await fetch(`/api/components/${componentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(batteryUpdate),
          });
        }
      }
      setSavedLogId(lastLogId);
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
            {/* Engine Selector (for engine_battery) */}
            {isEngineBattery && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Which Engine? *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {enginePositions.map(({ label, position }) => (
                      <button
                        key={position}
                        type="button"
                        onClick={() => {
                          setSelectedEnginePosition(position);
                          setApplyToAllEngines(false);
                        }}
                        disabled={applyToAllEngines}
                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                          selectedEnginePosition === position && !applyToAllEngines
                            ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-300'
                            : applyToAllEngines
                            ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-amber-300 dark:hover:border-amber-700'
                        }`}
                      >
                        🔋 {label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Apply to all engines checkbox */}
                {numberOfEngines > 1 && (
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={applyToAllEngines}
                      onChange={(e) => {
                        setApplyToAllEngines(e.target.checked);
                        if (e.target.checked) setSelectedEnginePosition('');
                      }}
                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      ⚡ Apply to all engines ({numberOfEngines})
                    </span>
                    {applyToAllEngines && formData.cost && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                        Cost will be split
                      </span>
                    )}
                  </label>
                )}
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
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cost
                </label>
                <button
                  type="button"
                  onClick={() => setShowReceiptScanner(true)}
                  className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
                >
                  <Receipt className="w-3 h-3" />
                  Scan Receipt
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center">
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
              {receiptImage && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                  <Receipt className="w-3 h-3" /> Receipt captured
                </p>
              )}
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

            {/* Battery Update Option (shown when logging replacement on battery/thruster) */}
            {showBatteryUpdateOption && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateBatteryDetails}
                    onChange={(e) => setUpdateBatteryDetails(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Update battery details (new brand, install date, etc.)
                  </span>
                </label>
                
                {updateBatteryDetails && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Number of Batteries
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={batteryDetails.battery_count}
                        onChange={(e) => setBatteryDetails({ ...batteryDetails, battery_count: e.target.value })}
                        placeholder="e.g., 4"
                        className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Battery Type
                      </label>
                      <select
                        value={batteryDetails.battery_type}
                        onChange={(e) => setBatteryDetails({ ...batteryDetails, battery_type: e.target.value })}
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
                        value={batteryDetails.battery_brand}
                        onChange={(e) => setBatteryDetails({ ...batteryDetails, battery_brand: e.target.value })}
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
                        value={batteryDetails.battery_model}
                        onChange={(e) => setBatteryDetails({ ...batteryDetails, battery_model: e.target.value })}
                        placeholder="e.g., D31M"
                        className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    {(isBatteryComponent || isEngineBattery) && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Voltage
                          </label>
                          <select
                            value={batteryDetails.battery_voltage}
                            onChange={(e) => setBatteryDetails({ ...batteryDetails, battery_voltage: e.target.value })}
                            className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="">Select...</option>
                            <option value="12V">12V</option>
                            <option value="24V">24V</option>
                            <option value="48V">48V</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Capacity
                          </label>
                          <input
                            type="text"
                            value={batteryDetails.battery_capacity}
                            onChange={(e) => setBatteryDetails({ ...batteryDetails, battery_capacity: e.target.value })}
                            placeholder="e.g., 100Ah"
                            className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </>
                    )}
                    <div className="col-span-2">
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Install date will be set to the service date ({formData.date})
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Voice Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Voice Note
              </label>
              <VoiceRecorder
                onRecordingComplete={handleVoiceRecording}
                onRecordingDelete={() => setVoiceNote(null)}
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
