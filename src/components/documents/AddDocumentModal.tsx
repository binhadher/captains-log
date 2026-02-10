'use client';

import { useState, useRef } from 'react';
import { X, Upload, Loader2, FileText, Camera } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { VoiceRecorder } from '@/components/ui/VoiceRecorder';
import { CameraCapture } from '@/components/ui/CameraCapture';
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
  const [step, setStep] = useState<'form' | 'upload'>('form');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('other');
  const [expiryDate, setExpiryDate] = useState('');
  const [reminderDays, setReminderDays] = useState('30');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [voiceNote, setVoiceNote] = useState<{ blob: Blob; duration: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setStep('form');
    setName('');
    setCategory('other');
    setExpiryDate('');
    setReminderDays('30');
    setNotes('');
    setFile(null);
    setError(null);
    setShowCamera(false);
    setVoiceNote(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Upload voice note and return URL
  const uploadVoiceNote = async (): Promise<string | null> => {
    if (!voiceNote) return null;
    
    try {
      const voiceFile = new File([voiceNote.blob], `voice_note_${Date.now()}.webm`, { type: 'audio/webm' });
      const uploadData = new FormData();
      uploadData.append('file', voiceFile);
      uploadData.append('boat_id', boatId);
      uploadData.append('category', 'other');
      uploadData.append('name', voiceFile.name);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (!response.ok) throw new Error('Voice upload failed');
      const { document } = await response.json();
      return document.file_url;
    } catch (err) {
      console.error('Failed to upload voice note:', err);
      return null;
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter a document name');
      return;
    }

    setError(null);
    setStep('upload');
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
    }
  };

  const handleCameraCapture = (capturedFile: File) => {
    setFile(capturedFile);
    setShowCamera(false);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file or take a photo');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Upload voice note first if exists
      const voiceNoteUrl = await uploadVoiceNote();

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
      if (voiceNoteUrl) {
        formData.append('voice_note_url', voiceNoteUrl);
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

  // Show camera capture overlay
  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {step === 'form' ? 'Add Document' : 'Upload File'}
          </h2>
          <button onClick={handleClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleNextStep} className="p-4 space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Document Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Document Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Insurance Policy 2026"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expiry Date <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Set for insurance, registration, berth contracts to get renewal reminders
              </p>
            </div>

            {/* Reminder Days (only show if expiry date set) */}
            {expiryDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Remind me before
                </label>
                <select
                  value={reminderDays}
                  onChange={(e) => setReminderDays(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Policy number, contact info..."
                rows={2}
              />
            </div>

            {/* Voice Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Voice Note
              </label>
              <VoiceRecorder
                onRecordingComplete={(blob, duration) => setVoiceNote({ blob, duration })}
                onRecordingDelete={() => setVoiceNote(null)}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                <span>Save</span>
                <Camera className="w-4 h-4 ml-2" />
                <FileText className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </form>
        ) : (
          /* Upload Step */
          <div className="p-4 space-y-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
              ✓ Details saved! Now upload the document or take a photo.
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Show selected file or upload options */}
            {file ? (
              <div className="flex items-center justify-center gap-3 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
                <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
                <div className="text-left flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.heic"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                />
                
                <div className="flex gap-3">
                  {/* Take Photo */}
                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    disabled={uploading}
                    className="flex-1 border-2 border-dashed border-teal-400 dark:border-teal-500 rounded-lg p-6 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all disabled:opacity-50"
                  >
                    <div className="flex flex-col items-center">
                      <Camera className="w-8 h-8 text-teal-500 mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">Take Photo</p>
                    </div>
                  </button>

                  {/* Upload file */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all disabled:opacity-50"
                  >
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">Upload File</p>
                    </div>
                  </button>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('form')} 
                className="flex-1"
                disabled={uploading}
              >
                Back
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={uploading || !file}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Done'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
