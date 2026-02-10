'use client';

import { useState } from 'react';
import { X, Plus, Cog, Battery, Navigation, Droplets, Wind, Ship, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { COMPONENT_TEMPLATES, ComponentTemplate } from '@/lib/component-templates';

interface AddComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  boatId: string;
  onSuccess: () => void;
}

type Category = 'propulsion' | 'power' | 'maneuvering' | 'hydraulics' | 'hvac' | 'electrical' | 'tender' | 'systems';

const CATEGORIES: { value: Category; label: string; icon: React.ReactNode }[] = [
  { value: 'propulsion', label: 'Propulsion', icon: <Cog className="w-5 h-5" /> },
  { value: 'power', label: 'Power', icon: <Battery className="w-5 h-5" /> },
  { value: 'maneuvering', label: 'Maneuvering', icon: <Navigation className="w-5 h-5" /> },
  { value: 'hydraulics', label: 'Hydraulics', icon: <Droplets className="w-5 h-5" /> },
  { value: 'hvac', label: 'HVAC', icon: <Wind className="w-5 h-5" /> },
  { value: 'electrical', label: 'Electrical', icon: <Battery className="w-5 h-5" /> },
  { value: 'tender', label: 'Tender', icon: <Ship className="w-5 h-5" /> },
  { value: 'systems', label: 'Other Systems', icon: <Gauge className="w-5 h-5" /> },
];

export function AddComponentModal({ isOpen, onClose, boatId, onSuccess }: AddComponentModalProps) {
  const [step, setStep] = useState<'category' | 'type' | 'details'>('category');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [currentHours, setCurrentHours] = useState('');
  const [notes, setNotes] = useState('');
  // Battery fields (for battery components)
  const [batteryCount, setBatteryCount] = useState('');
  const [batteryType, setBatteryType] = useState('');
  const [batteryVoltage, setBatteryVoltage] = useState('');
  const [batteryCapacity, setBatteryCapacity] = useState('');
  // Thruster battery fields (for bow/stern thruster)
  const [thrusterBatteryCount, setThrusterBatteryCount] = useState('');
  const [thrusterBatteryBrand, setThrusterBatteryBrand] = useState('');
  const [thrusterBatteryModel, setThrusterBatteryModel] = useState('');
  const [thrusterBatteryInstallDate, setThrusterBatteryInstallDate] = useState('');

  const resetForm = () => {
    setStep('category');
    setSelectedCategory(null);
    setSelectedType(null);
    setName('');
    setPosition('');
    setBrand('');
    setModel('');
    setSerialNumber('');
    setCurrentHours('');
    setNotes('');
    setBatteryCount('');
    setBatteryType('');
    setBatteryVoltage('');
    setBatteryCapacity('');
    setThrusterBatteryCount('');
    setThrusterBatteryBrand('');
    setThrusterBatteryModel('');
    setThrusterBatteryInstallDate('');
    setError(null);
  };
  
  // Check if this is a battery component type
  const isBatteryComponent = selectedType && ['house_battery', 'engine_battery', 'generator_battery', 'thruster_battery'].includes(selectedType);
  
  // Check if this is a thruster component
  const isThrusterComponent = selectedType && ['bow_thruster', 'stern_thruster'].includes(selectedType);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getTypesForCategory = (category: Category): ComponentTemplate[] => {
    return COMPONENT_TEMPLATES.filter(t => t.category === category);
  };

  const getSelectedTemplate = (): ComponentTemplate | undefined => {
    return COMPONENT_TEMPLATES.find(t => t.type === selectedType);
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    const types = getTypesForCategory(category);
    if (types.length === 1) {
      // Auto-select if only one type
      setSelectedType(types[0].type);
      setName(types[0].name);
      setStep('details');
    } else if (types.length === 0) {
      // Custom/other systems - go straight to details
      setSelectedType('custom');
      setStep('details');
    } else {
      setStep('type');
    }
  };

  const handleTypeSelect = (template: ComponentTemplate) => {
    setSelectedType(template.type);
    setName(template.name);
    setStep('details');
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, any> = {
        category: selectedCategory || 'systems',
        type: selectedType || 'custom',
        name: name.trim(),
        position: position.trim() || null,
        brand: brand.trim() || null,
        model: model.trim() || null,
        serial_number: serialNumber.trim() || null,
        current_hours: currentHours ? parseInt(currentHours) : 0,
        notes: notes.trim() || null,
      };
      
      // Add battery fields for battery components
      if (isBatteryComponent) {
        payload.battery_count = batteryCount ? parseInt(batteryCount) : null;
        payload.battery_type = batteryType.trim() || null;
        payload.battery_voltage = batteryVoltage.trim() || null;
        payload.battery_capacity = batteryCapacity.trim() || null;
      }
      
      // Add thruster battery fields for thrusters
      if (isThrusterComponent) {
        payload.thruster_battery_count = thrusterBatteryCount ? parseInt(thrusterBatteryCount) : null;
        payload.thruster_battery_brand = thrusterBatteryBrand.trim() || null;
        payload.thruster_battery_model = thrusterBatteryModel.trim() || null;
        payload.thruster_battery_install_date = thrusterBatteryInstallDate || null;
      }

      const response = await fetch(`/api/boats/${boatId}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add component');
      }

      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add component');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const template = getSelectedTemplate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={handleClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {step === 'category' && 'Add Component'}
            {step === 'type' && `Select ${selectedCategory} Type`}
            {step === 'details' && 'Component Details'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Step 1: Category Selection */}
          {step === 'category' && (
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => handleCategorySelect(cat.value)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                >
                  <div className="text-gray-500 dark:text-gray-400">{cat.icon}</div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Type Selection */}
          {step === 'type' && selectedCategory && (
            <div className="space-y-2">
              <button
                onClick={() => setStep('category')}
                className="text-sm text-teal-600 dark:text-teal-400 hover:underline mb-2"
              >
                ← Back to categories
              </button>
              <div className="space-y-2">
                {getTypesForCategory(selectedCategory).map((template) => (
                  <button
                    key={template.type}
                    onClick={() => handleTypeSelect(template)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors text-left"
                  >
                    <span className="text-xl">{template.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{template.name}</p>
                      {template.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{template.description}</p>
                      )}
                    </div>
                  </button>
                ))}
                {/* Custom option */}
                <button
                  onClick={() => {
                    setSelectedType('custom');
                    setStep('details');
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors text-left"
                >
                  <Plus className="w-5 h-5 text-gray-400" />
                  <p className="font-medium text-gray-600 dark:text-gray-400">Custom component</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Details Form */}
          {step === 'details' && (
            <div className="space-y-4">
              <button
                onClick={() => setStep(selectedCategory ? 'type' : 'category')}
                className="text-sm text-teal-600 dark:text-teal-400 hover:underline mb-2"
              >
                ← Back
              </button>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Port Engine"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Position */}
              {template?.positionOptions && template.positionOptions.length > 0 ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Position
                  </label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Select position...</option>
                    {template.positionOptions.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos.charAt(0).toUpperCase() + pos.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Position (optional)
                  </label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g., Port, Starboard, Saloon"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Brand & Model */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g., MAN"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g., D2866"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Serial & Hours */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Hours
                  </label>
                  <input
                    type="number"
                    value={currentHours}
                    onChange={(e) => setCurrentHours(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Battery Fields (for battery components) */}
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
                        value={batteryCount}
                        onChange={(e) => setBatteryCount(e.target.value)}
                        placeholder="e.g., 4"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Battery Type
                      </label>
                      <select
                        value={batteryType}
                        onChange={(e) => setBatteryType(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                        value={batteryVoltage}
                        onChange={(e) => setBatteryVoltage(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                        value={batteryCapacity}
                        onChange={(e) => setBatteryCapacity(e.target.value)}
                        placeholder="e.g., 100Ah"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                        value={thrusterBatteryCount}
                        onChange={(e) => setThrusterBatteryCount(e.target.value)}
                        placeholder="e.g., 2"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Install Date
                      </label>
                      <input
                        type="date"
                        value={thrusterBatteryInstallDate}
                        onChange={(e) => setThrusterBatteryInstallDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Battery Brand
                      </label>
                      <input
                        type="text"
                        value={thrusterBatteryBrand}
                        onChange={(e) => setThrusterBatteryBrand(e.target.value)}
                        placeholder="e.g., Optima"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Battery Model
                      </label>
                      <input
                        type="text"
                        value={thrusterBatteryModel}
                        onChange={(e) => setThrusterBatteryModel(e.target.value)}
                        placeholder="e.g., D31M"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Any additional notes..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={saving} className="flex-1">
                  {saving ? 'Adding...' : 'Add Component'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
