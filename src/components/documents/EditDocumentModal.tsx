'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Document, DocumentCategory } from '@/types/database';

interface EditDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  onSuccess: () => void;
}

const CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: 'registration', label: 'Registration' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'berth', label: 'Berth Contract' },
  { value: 'warranty', label: 'Warranty' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'manual', label: 'Manual' },
  { value: 'other', label: 'Other' },
];

export function EditDocumentModal({ isOpen, onClose, document, onSuccess }: EditDocumentModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'other' as DocumentCategory,
    expiry_date: '',
    notes: '',
  });

  useEffect(() => {
    if (document) {
      setFormData({
        name: document.name || '',
        category: document.category || 'other',
        expiry_date: document.expiry_date || '',
        notes: document.notes || '',
      });
    }
  }, [document]);

  if (!isOpen || !document) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Document name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          category: formData.category,
          expiry_date: formData.expiry_date || null,
          notes: formData.notes.trim() || null,
        }),
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
        
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Document</h2>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as DocumentCategory })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expiry Date
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
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
