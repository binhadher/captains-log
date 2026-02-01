'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Boat, BoatFormData, Engine } from '@/types/database';

interface AddBoatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (boat: Boat) => void;
}

const ENGINE_LABELS: Record<number, string[]> = {
  1: ['Engine'],
  2: ['Port Engine', 'Starboard Engine'],
  3: ['Port Engine', 'Center Engine', 'Starboard Engine'],
  4: ['Port Outer', 'Port Inner', 'Starboard Inner', 'Starboard Outer'],
  5: ['Port Outer', 'Port Inner', 'Center', 'Starboard Inner', 'Starboard Outer'],
  6: ['Port Outer', 'Port Mid', 'Port Inner', 'Starboard Inner', 'Starboard Mid', 'Starboard Outer'],
};

export function AddBoatModal({ isOpen, onClose, onSubmit }: AddBoatModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<BoatFormData>>({
    name: '',
    make: '',
    model: '',
    year: undefined,
    length: undefined,
    hull_id: '',
    home_port: '',
    number_of_engines: 2,
    engines: [{}, {}],
    generator_brand: '',
    generator_model: '',
  });

  if (!isOpen) return null;

  const engineLabels = ENGINE_LABELS[formData.number_of_engines || 2] || ENGINE_LABELS[2];

  const handleEngineCountChange = (count: number) => {
    const newEngines: Engine[] = Array(count).fill(null).map((_, i) => 
      formData.engines?.[i] || {}
    );
    setFormData({ ...formData, number_of_engines: count, engines: newEngines });
  };

  const handleEngineChange = (index: number, field: 'brand' | 'model', value: string) => {
    const newEngines = [...(formData.engines || [])];
    newEngines[index] = { ...newEngines[index], [field]: value };
    setFormData({ ...formData, engines: newEngines });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/boats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          make: formData.make || null,
          model: formData.model || null,
          year: formData.year || null,
          length: formData.length || null,
          hull_id: formData.hull_id || null,
          home_port: formData.home_port || null,
          number_of_engines: formData.number_of_engines || 2,
          engines: formData.engines || [],
          generator_brand: formData.generator_brand || null,
          generator_model: formData.generator_model || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create boat');
      }

      const { boat } = await response.json();
      
      onSubmit(boat);
      setFormData({
        name: '',
        make: '',
        model: '',
        year: undefined,
        length: undefined,
        hull_id: '',
        home_port: '',
        number_of_engines: 2,
        engines: [{}, {}],
        generator_brand: '',
        generator_model: '',
      });
    } catch (err) {
      console.error('Failed to add boat:', err);
      setError(err instanceof Error ? err.message : 'Failed to add boat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Boat</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            {/* Boat Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Boat Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Sea Spirit"
              />
            </div>

            {/* Boat Make & Model */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Boat Make
                </label>
                <input
                  type="text"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Sunseeker"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Boat Model
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Manhattan 66"
                />
              </div>
            </div>

            {/* Year & Length */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <input
                  type="number"
                  value={formData.year || ''}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="2020"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Length (ft)
                </label>
                <input
                  type="number"
                  value={formData.length || ''}
                  onChange={(e) => setFormData({ ...formData, length: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="45"
                />
              </div>
            </div>

            {/* Hull ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hull ID / Registration
              </label>
              <input
                type="text"
                value={formData.hull_id}
                onChange={(e) => setFormData({ ...formData, hull_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Registration number"
              />
            </div>

            {/* Home Port */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Home Port
              </label>
              <input
                type="text"
                value={formData.home_port}
                onChange={(e) => setFormData({ ...formData, home_port: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Dubai Marina"
              />
            </div>

            {/* Engines Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Engines</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Engines
                </label>
                <select
                  value={formData.number_of_engines || 2}
                  onChange={(e) => handleEngineCountChange(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>{num} {num === 1 ? 'Engine' : 'Engines'}</option>
                  ))}
                </select>
              </div>

              {/* Engine Brand & Model fields */}
              <div className="space-y-3">
                {engineLabels.map((label, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <label className="block text-xs font-medium text-gray-600 mb-2">{label}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={formData.engines?.[index]?.brand || ''}
                        onChange={(e) => handleEngineChange(index, 'brand', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Brand (e.g., Caterpillar)"
                      />
                      <input
                        type="text"
                        value={formData.engines?.[index]?.model || ''}
                        onChange={(e) => handleEngineChange(index, 'model', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Model (e.g., C12)"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Generator Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Generator</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={formData.generator_brand}
                    onChange={(e) => setFormData({ ...formData, generator_brand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Onan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={formData.generator_model}
                    onChange={(e) => setFormData({ ...formData, generator_model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., MDKBH"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" loading={loading} className="flex-1">
                Add Boat
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
