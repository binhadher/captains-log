'use client';

import { useState } from 'react';
import { X, Upload, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DocumentCategory } from '@/types/database';

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  boatId: string;
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

export function AddDocumentModal({ isOpen, onClose, boatId, onSuccess }: AddDocumentModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('other');
  const [expiryDate, setExpiryDate] = useState('');
  const [reminderDays, setReminderDays] = useState('30');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const resetForm = () => {
    setName('');
    setCategory('other');
    setExpiryDate('');
    setReminderDays('30');
    setNotes('');
    setFile(null);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      // Validate file size (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File too large (max 10MB)');
        return;
      }
      
      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('File type not allowed. Use PDF, Word, or images.');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      
      // Auto-fill name from filename if empty
      if (!name) {
        const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
        setName(baseName);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }
    
    if (!name.trim()) {
      setError('Please enter a document name');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('boat_id', boatId);
      formData.append('name', name.trim());
      formData.append('category', category);
      if (expiryDate) {
        formData.append('expiry_date', expiryDate);
        formData.append('reminder_days', reminderDays);
      }
      if (notes.trim()) {
        formData.append('notes', notes.trim());
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload document');
      }

      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Upload Document</h2>
          <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : file 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="ml-2 text-gray-400 hover:text-red-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-1">
                  Drag & drop or{' '}
                  <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                    browse
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.heic"
                      onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                    />
                  </label>
                </p>
                <p className="text-xs text-gray-400">PDF, Word, or images (max 10MB)</p>
              </>
            )}
          </div>

          {/* Document Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Insurance Policy 2026"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Set for insurance, registration, berth contracts to get renewal reminders
            </p>
          </div>

          {/* Reminder Days (only show if expiry date set) */}
          {expiryDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remind me before
              </label>
              <select
                value={reminderDays}
                onChange={(e) => setReminderDays(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">1 week</option>
                <option value="14">2 weeks</option>
                <option value="30">1 month</option>
                <option value="60">2 months</option>
                <option value="90">3 months</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Policy number, contact info..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || !file} className="flex-1">
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
