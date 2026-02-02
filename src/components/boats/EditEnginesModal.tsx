'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Boat, Engine } from '@/types/database';

interface EditEnginesModalProps {
  isOpen: boolean;
  onClose: () => void;
  boat: Boat;
  onSuccess: (updatedBoat: Boat) => void;
}

function getEngineLabels(count: number): string[] {
  const labels: Record<number, string[]> = {
    1: ['Engine'],
    2: ['Port Engine', 'Starboard Engine'],
    3: ['Port Engine', 'Center Engine', 'Starboard Engine'],
    4: ['Port Outer', 'Port Inner', 'Starboard Inner', 'Starboard Outer'],
    5: ['Port Outer', 'Port Inner', 'Center', 'Starboard Inner', 'Starboard Outer'],
    6: ['Port Outer', 'Port Mid', 'Port Inner', 'Starboard Inner', 'Starboard Mid', 'Starboard Outer'],
  };
  return labels[count] || labels[2];
}

export function EditEnginesModal({ isOpen, onClose, boat, onSuccess }: EditEnginesModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engines, setEngines] = useState<Engine[]>([]);
  const [generatorBrand, setGeneratorBrand] = useState('');
  const [generatorModel, setGeneratorModel] = useState('');

  useEffect(() => {
    if (boat) {
      // Initialize engines array based on number_of_engines
      const numEngines = boat.number_of_engines || 2;
      const existingEngines = boat.engines || [];
      const initialEngines: Engine[] = [];
      
      for (let i = 0; i < numEngines; i++) {
        initialEngines.push({
          brand: existingEngines[i]?.brand || '',
          model: existingEngines[i]?.model || '',
          data_plate_url: existingEngines[i]?.data_plate_url || undefined,
        });
      }
      
      setEngines(initialEngines);
      setGeneratorBrand(boat.generator_brand || '');
      setGeneratorModel(boat.generator_model || '');
    }
  }, [boat]);

  if (!isOpen) return null;

  const engineLabels = getEngineLabels(engines.length);

  const handleEngineChange = (index: number, field: 'brand' | 'model', value: string) => {
    const newEngines = [...engines];
    newEngines[index] = { ...newEngines[index], [field]: value };
    setEngines(newEngines);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const response = await fetch(`/api/boats/${boat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engines: engines.map(eng => ({
            brand: eng.brand?.trim() || null,
            model: eng.model?.trim() || null,
            data_plate_url: eng.data_plate_url || null,
          })),
          generator_brand: generatorBrand.trim() || null,
          generator_model: generatorModel.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update engines');
      }

      const data = await response.json();
      onSuccess(data.boat);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Engines & Generator</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Engines */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Engines ({engines.length})
            </h3>
            
            {engines.map((engine, index) => (
              <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {engineLabels[index]}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={engine.brand || ''}
                      onChange={(e) => handleEngineChange(index, 'brand', e.target.value)}
                      placeholder="e.g., MAN"
                      className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Model
                    </label>
                    <input
                      type="text"
                      value={engine.model || ''}
                      onChange={(e) => handleEngineChange(index, 'model', e.target.value)}
                      placeholder="e.g., D2862 LE433"
                      className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Generator */}
          <div className="pt-4 border-t dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
              Generator
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  value={generatorBrand}
                  onChange={(e) => setGeneratorBrand(e.target.value)}
                  placeholder="e.g., Fisher Panda"
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  value={generatorModel}
                  onChange={(e) => setGeneratorModel(e.target.value)}
                  placeholder="e.g., 11 kVA"
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
