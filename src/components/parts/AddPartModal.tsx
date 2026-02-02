'use client';

import { useState, useMemo } from 'react';
import { X, Upload, Loader2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BoatComponent } from '@/types/database';

// Engine component types that can be "mirrored"
const ENGINE_TYPES = ['engine', 'inboard_engine', 'outboard_engine', 'drive_pod'];

interface AddPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  boatId: string;
  components: BoatComponent[];
  preselectedComponentId?: string;
  onSuccess: () => void;
}

export function AddPartModal({
  isOpen,
  onClose,
  boatId,
  components,
  preselectedComponentId,
  onSuccess,
}: AddPartModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [applyToAllEngines, setApplyToAllEngines] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    component_id: preselectedComponentId || '',
    brand: '',
    part_number: '',
    size_specs: '',
    supplier: '',
    install_date: '',
    notes: '',
  });

  // Find all engine components and check if selected component is an engine
  const engineComponents = useMemo(() => 
    components.filter(c => ENGINE_TYPES.includes(c.type)),
    [components]
  );
  
  const selectedComponent = useMemo(() => 
    components.find(c => c.id === formData.component_id),
    [components, formData.component_id]
  );
  
  const isEngineSelected = selectedComponent && ENGINE_TYPES.includes(selectedComponent.type);
  const hasMultipleEngines = engineComponents.length > 1;

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('boat_id', boatId);
      formData.append('category', 'other');
      formData.append('name', file.name);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { document } = await response.json();
      setPhotoUrl(document.file_url);
    } catch (err) {
      setError('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Part name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build the request body
      const requestBody: Record<string, unknown> = {
        ...formData,
        component_id: formData.component_id || null,
        photo_url: photoUrl,
      };

      // If "apply to all engines" is checked, include all engine component IDs
      if (applyToAllEngines && isEngineSelected && hasMultipleEngines) {
        requestBody.apply_to_component_ids = engineComponents.map(c => c.id);
      }

      const response = await fetch(`/api/boats/${boatId}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add part');
      }

      // Reset and close
      setFormData({
        name: '',
        component_id: preselectedComponentId || '',
        brand: '',
        part_number: '',
        size_specs: '',
        supplier: '',
        install_date: '',
        notes: '',
      });
      setPhotoUrl(null);
      setApplyToAllEngines(false);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add part');
    } finally {
      setLoading(false);
    }
  };

  // Group components by category for the dropdown
  const groupedComponents = components.reduce((acc, comp) => {
    if (!acc[comp.category]) acc[comp.category] = [];
    acc[comp.category].push(comp);
    return acc;
  }, {} as Record<string, BoatComponent[]>);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Part</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Part Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Part Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Oil Filter, Impeller"
                required
              />
            </div>

            {/* Component (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                For Component
              </label>
              <select
                value={formData.component_id}
                onChange={(e) => {
                  setFormData({ ...formData, component_id: e.target.value });
                  setApplyToAllEngines(false); // Reset when component changes
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">General / All</option>
                {Object.entries(groupedComponents).map(([category, comps]) => (
                  <optgroup key={category} label={category.toUpperCase()}>
                    {comps.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Apply to all engines checkbox - only show when an engine is selected and there are multiple engines */}
            {isEngineSelected && hasMultipleEngines && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <input
                  type="checkbox"
                  id="applyToAllEngines"
                  checked={applyToAllEngines}
                  onChange={(e) => setApplyToAllEngines(e.target.checked)}
                  className="mt-1 w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="applyToAllEngines" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200">
                    <Copy className="w-4 h-4" />
                    Apply to all engines
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    This part will be added to all {engineComponents.length} engines ({engineComponents.map(e => e.name).join(', ')})
                  </p>
                </label>
              </div>
            )}

            {/* Brand & Part Number */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Racor, Jabsco"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Part Number
                </label>
                <input
                  type="text"
                  value={formData.part_number}
                  onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., RAC-1234"
                />
              </div>
            </div>

            {/* Size/Specs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Size / Specs
              </label>
              <input
                type="text"
                value={formData.size_specs}
                onChange={(e) => setFormData({ ...formData, size_specs: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 2 micron, 3.5 inch diameter"
              />
            </div>

            {/* Supplier & Install Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Supplier
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Marine Parts UAE"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Install Date
                </label>
                <input
                  type="date"
                  value={formData.install_date}
                  onChange={(e) => setFormData({ ...formData, install_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Any additional notes..."
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Photo
              </label>
              {photoUrl ? (
                <div className="relative inline-block">
                  <img 
                    src={photoUrl} 
                    alt="Part" 
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl(null)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="block w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">Click to upload photo</span>
                    </>
                  )}
                </label>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" loading={loading} className="flex-1">
                Add Part
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
