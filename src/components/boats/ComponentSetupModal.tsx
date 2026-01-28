'use client';

import { useState } from 'react';
import { X, Plus, Trash2, Cog, Gauge, Wind } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ComponentCategory, ComponentType } from '@/types/database';

interface Engine {
  brand?: string;
  model?: string;
}

interface ComponentSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  boatId: string;
  numberOfEngines: number;
  engines?: Engine[];
  generatorBrand?: string;
  generatorModel?: string;
  onComplete: () => void;
}

interface ComponentDraft {
  id: string;
  category: ComponentCategory;
  type: ComponentType;
  name: string;
  position?: string;
  brand?: string;
  model?: string;
}

const COMPONENT_TEMPLATES: Record<string, Omit<ComponentDraft, 'id'>[]> = {
  propulsion_twin: [
    { category: 'propulsion', type: 'engine', name: 'Port Engine', position: 'port' },
    { category: 'propulsion', type: 'engine', name: 'Starboard Engine', position: 'starboard' },
    { category: 'propulsion', type: 'generator', name: 'Generator' },
    { category: 'propulsion', type: 'shaft', name: 'Port Shaft', position: 'port' },
    { category: 'propulsion', type: 'shaft', name: 'Starboard Shaft', position: 'starboard' },
    { category: 'propulsion', type: 'propeller', name: 'Port Propeller', position: 'port' },
    { category: 'propulsion', type: 'propeller', name: 'Starboard Propeller', position: 'starboard' },
  ],
  systems_standard: [
    { category: 'systems', type: 'hydraulic', name: 'Hydraulic System' },
    { category: 'systems', type: 'bow_thruster', name: 'Bow Thruster' },
  ],
  hvac_full: [
    { category: 'hvac', type: 'ac_chiller', name: 'AC Chiller' },
    { category: 'hvac', type: 'ac_air_handler', name: 'Saloon AC Unit 1', position: 'saloon' },
    { category: 'hvac', type: 'ac_air_handler', name: 'Saloon AC Unit 2', position: 'saloon' },
    { category: 'hvac', type: 'ac_air_handler', name: 'Master Bedroom AC', position: 'master' },
    { category: 'hvac', type: 'ac_air_handler', name: 'Galley AC', position: 'galley' },
    { category: 'hvac', type: 'ac_air_handler', name: 'VIP Cabin AC', position: 'vip' },
    { category: 'hvac', type: 'ac_air_handler', name: 'Crew Cabin AC', position: 'crew' },
  ],
};

const TYPE_OPTIONS: { category: ComponentCategory; type: ComponentType; label: string }[] = [
  { category: 'propulsion', type: 'engine', label: 'Engine' },
  { category: 'propulsion', type: 'generator', label: 'Generator' },
  { category: 'propulsion', type: 'shaft', label: 'Shaft' },
  { category: 'propulsion', type: 'propeller', label: 'Propeller' },
  { category: 'systems', type: 'hydraulic', label: 'Hydraulic System' },
  { category: 'systems', type: 'bow_thruster', label: 'Bow Thruster' },
  { category: 'hvac', type: 'ac_chiller', label: 'AC Chiller' },
  { category: 'hvac', type: 'ac_air_handler', label: 'AC Air Handler' },
];

const ENGINE_LABELS: Record<number, string[]> = {
  1: ['Engine'],
  2: ['Port Engine', 'Starboard Engine'],
  3: ['Port Engine', 'Center Engine', 'Starboard Engine'],
  4: ['Port Outer', 'Port Inner', 'Starboard Inner', 'Starboard Outer'],
  5: ['Port Outer', 'Port Inner', 'Center', 'Starboard Inner', 'Starboard Outer'],
  6: ['Port Outer', 'Port Mid', 'Port Inner', 'Starboard Inner', 'Starboard Mid', 'Starboard Outer'],
};

const ENGINE_POSITIONS: Record<number, string[]> = {
  1: ['center'],
  2: ['port', 'starboard'],
  3: ['port', 'center', 'starboard'],
  4: ['port-outer', 'port-inner', 'starboard-inner', 'starboard-outer'],
  5: ['port-outer', 'port-inner', 'center', 'starboard-inner', 'starboard-outer'],
  6: ['port-outer', 'port-mid', 'port-inner', 'starboard-inner', 'starboard-mid', 'starboard-outer'],
};

export function ComponentSetupModal({ 
  isOpen, 
  onClose, 
  boatId, 
  numberOfEngines,
  engines,
  generatorBrand,
  generatorModel,
  onComplete 
}: ComponentSetupModalProps) {
  const [components, setComponents] = useState<ComponentDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'templates' | 'customize'>('templates');

  // Generate components from boat data
  const generateFromBoatData = (): ComponentDraft[] => {
    const result: ComponentDraft[] = [];
    const labels = ENGINE_LABELS[numberOfEngines] || ENGINE_LABELS[2];
    const positions = ENGINE_POSITIONS[numberOfEngines] || ENGINE_POSITIONS[2];

    // Engines from boat data
    for (let i = 0; i < numberOfEngines; i++) {
      result.push({
        id: crypto.randomUUID(),
        category: 'propulsion',
        type: 'engine',
        name: labels[i],
        position: positions[i],
        brand: engines?.[i]?.brand || '',
        model: engines?.[i]?.model || '',
      });
    }

    // Generator from boat data
    result.push({
      id: crypto.randomUUID(),
      category: 'propulsion',
      type: 'generator',
      name: 'Generator',
      brand: generatorBrand || '',
      model: generatorModel || '',
    });

    // Shafts & Propellers (no brand/model needed)
    if (numberOfEngines >= 2) {
      result.push(
        { id: crypto.randomUUID(), category: 'propulsion', type: 'shaft', name: 'Port Shaft', position: 'port' },
        { id: crypto.randomUUID(), category: 'propulsion', type: 'shaft', name: 'Starboard Shaft', position: 'starboard' },
        { id: crypto.randomUUID(), category: 'propulsion', type: 'propeller', name: 'Port Propeller', position: 'port' },
        { id: crypto.randomUUID(), category: 'propulsion', type: 'propeller', name: 'Starboard Propeller', position: 'starboard' },
      );
    } else {
      result.push(
        { id: crypto.randomUUID(), category: 'propulsion', type: 'shaft', name: 'Shaft' },
        { id: crypto.randomUUID(), category: 'propulsion', type: 'propeller', name: 'Propeller' },
      );
    }

    // Systems
    result.push(
      { id: crypto.randomUUID(), category: 'systems', type: 'hydraulic', name: 'Hydraulic System' },
      { id: crypto.randomUUID(), category: 'systems', type: 'bow_thruster', name: 'Bow Thruster' },
    );

    // HVAC
    result.push(
      { id: crypto.randomUUID(), category: 'hvac', type: 'ac_chiller', name: 'AC Chiller' },
      { id: crypto.randomUUID(), category: 'hvac', type: 'ac_air_handler', name: 'Saloon AC Unit 1', position: 'saloon' },
      { id: crypto.randomUUID(), category: 'hvac', type: 'ac_air_handler', name: 'Saloon AC Unit 2', position: 'saloon' },
      { id: crypto.randomUUID(), category: 'hvac', type: 'ac_air_handler', name: 'Master Bedroom AC', position: 'master' },
      { id: crypto.randomUUID(), category: 'hvac', type: 'ac_air_handler', name: 'Galley AC', position: 'galley' },
      { id: crypto.randomUUID(), category: 'hvac', type: 'ac_air_handler', name: 'VIP Cabin AC', position: 'vip' },
      { id: crypto.randomUUID(), category: 'hvac', type: 'ac_air_handler', name: 'Crew Cabin AC', position: 'crew' },
    );

    return result;
  };

  if (!isOpen) return null;

  const applyTemplate = (templateKey: string) => {
    const template = COMPONENT_TEMPLATES[templateKey];
    if (template) {
      const newComponents = template.map(t => ({
        ...t,
        id: crypto.randomUUID(),
      }));
      setComponents(prev => [...prev, ...newComponents]);
    }
  };

  const applyAllTemplates = () => {
    // Generate from actual boat data
    const all = generateFromBoatData();
    setComponents(all);
    setStep('customize');
  };

  const addComponent = () => {
    setComponents([
      ...components,
      {
        id: crypto.randomUUID(),
        category: 'propulsion',
        type: 'engine',
        name: '',
      },
    ]);
  };

  const updateComponent = (id: string, updates: Partial<ComponentDraft>) => {
    setComponents(components.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  };

  const removeComponent = (id: string) => {
    setComponents(components.filter(c => c.id !== id));
  };

  const handleTypeChange = (id: string, type: ComponentType) => {
    const option = TYPE_OPTIONS.find(o => o.type === type);
    if (option) {
      updateComponent(id, { type, category: option.category });
    }
  };

  const handleSubmit = async () => {
    if (components.length === 0) {
      setError('Add at least one component');
      return;
    }

    // Validate all components have names
    const invalid = components.find(c => !c.name.trim());
    if (invalid) {
      setError('All components must have a name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/boats/${boatId}/components`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          components: components.map(({ id, ...rest }) => rest),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save components');
      }

      onComplete();
      onClose();
      setComponents([]);
      setStep('templates');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const groupedComponents = components.reduce((acc, comp) => {
    if (!acc[comp.category]) acc[comp.category] = [];
    acc[comp.category].push(comp);
    return acc;
  }, {} as Record<ComponentCategory, ComponentDraft[]>);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 'templates' ? 'Set Up Components' : 'Customize Components'}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {step === 'templates' ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Set up all your boat's systems with one click. Engine and generator details will be pulled from your boat profile.
              </p>

              <Button onClick={applyAllTemplates} className="w-full justify-center" size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Set Up All Components
              </Button>

              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <p className="font-medium text-gray-900 mb-2">This will create:</p>
                <ul className="space-y-1">
                  <li>• <strong>Propulsion:</strong> {numberOfEngines} engine(s), generator, shafts & propellers</li>
                  <li>• <strong>Systems:</strong> Hydraulic system, bow thruster</li>
                  <li>• <strong>HVAC:</strong> AC chiller + 7 air handling units</li>
                </ul>
              </div>

              <div className="text-center pt-4 border-t border-gray-200">
                <button 
                  onClick={() => setStep('customize')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Or customize manually →
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Grouped component list */}
              {(['propulsion', 'systems', 'hvac'] as ComponentCategory[]).map(category => {
                const categoryComponents = groupedComponents[category] || [];
                if (categoryComponents.length === 0) return null;

                return (
                  <div key={category} className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      {category}
                    </h3>
                    {categoryComponents.map((comp) => {
                      const showBrandModel = comp.type === 'engine' || comp.type === 'generator' || comp.type === 'ac_chiller';
                      return (
                        <div key={comp.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="text"
                            value={comp.name}
                            onChange={(e) => updateComponent(comp.id, { name: e.target.value })}
                            placeholder="Name"
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          {showBrandModel && (
                            <>
                              <input
                                type="text"
                                value={comp.brand || ''}
                                onChange={(e) => updateComponent(comp.id, { brand: e.target.value })}
                                placeholder="Brand"
                                className="w-28 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <input
                                type="text"
                                value={comp.model || ''}
                                onChange={(e) => updateComponent(comp.id, { model: e.target.value })}
                                placeholder="Model"
                                className="w-28 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </>
                          )}
                          <button
                            onClick={() => removeComponent(comp.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {components.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No components added yet
                </p>
              )}

              <button
                onClick={addComponent}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-all"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Add Component
              </button>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  onClick={() => { setStep('templates'); setComponents([]); }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  loading={loading}
                  disabled={components.length === 0}
                  className="flex-1"
                >
                  Save {components.length} Components
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
