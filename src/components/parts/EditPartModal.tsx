'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Part } from '@/types/database';

interface EditPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: Part | null;
  onSuccess: () => void;
  onDelete?: () => void;
}

export function EditPartModal({ isOpen, onClose, part, onSuccess, onDelete }: EditPartModalProps) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    part_number: '',
    size_specs: '',
    supplier: '',
    notes: '',
  });

  useEffect(() => {
    if (part) {
      setFormData({
        name: part.name || '',
        brand: part.brand || '',
        part_number: part.part_number || '',
        size_specs: part.size_specs || '',
        supplier: part.supplier || '',
        notes: part.notes || '',
      });
      setPhotoUrl(part.photo_url || null);
    }
  }, [part]);

  if (!isOpen || !part) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('boat_id', part.boat_id);
      uploadData.append('category', 'other');
      uploadData.append('name', file.name);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (!response.ok) throw new Error('Upload failed');
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

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/parts/${part.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          photo_url: photoUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update part');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${part.name}"? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/parts/${part.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');
      
      onDelete?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Part</h2>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Part Name *
              </label>
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Part Number</label>
                <input
                  type="text"
                  value={formData.part_number}
                  onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Size / Specs</label>
              <input
                type="text"
                value={formData.size_specs}
                onChange={(e) => setFormData({ ...formData, size_specs: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Photo</label>
              {photoUrl ? (
                <div className="relative inline-block">
                  <img src={photoUrl} alt="Part" className="w-24 h-24 object-cover rounded-lg border" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl(null)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="block w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center cursor-pointer hover:border-teal-400">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-teal-500 animate-spin mx-auto" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <span className="text-sm text-gray-500">Click to upload</span>
                    </>
                  )}
                </label>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
              {onDelete && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              )}
              <div className="flex-1" />
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
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
