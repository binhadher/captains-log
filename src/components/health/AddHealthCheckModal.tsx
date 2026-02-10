'use client';

import { useState, useRef } from 'react';
import { X, Camera, Upload, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { VoiceRecorder } from '@/components/ui/VoiceRecorder';
import { CameraCapture } from '@/components/ui/CameraCapture';
import { BoatComponent, HealthCheckType } from '@/types/database';

interface AddHealthCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  boatId: string;
  components: BoatComponent[];
  onSuccess: () => void;
}

const CHECK_TYPES: { id: HealthCheckType; label: string; placeholder: string }[] = [
  { id: 'oil_level', label: 'Oil Top-up', placeholder: 'e.g., Added 0.5L engine oil' },
  { id: 'fluid_level', label: 'Fluid Level', placeholder: 'e.g., Topped up hydraulic fluid' },
  { id: 'grease', label: 'Greasing', placeholder: 'e.g., Greased steering ram' },
  { id: 'visual', label: 'Visual Check', placeholder: 'e.g., Checked belt tension' },
  { id: 'other', label: 'Other', placeholder: 'Describe the check...' },
];

export function AddHealthCheckModal({
  isOpen,
  onClose,
  boatId,
  components,
  onSuccess,
}: AddHealthCheckModalProps) {
  const [step, setStep] = useState<'form' | 'upload'>('form');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCheckId, setSavedCheckId] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [voiceNote, setVoiceNote] = useState<{ blob: Blob; duration: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    check_type: 'oil_level' as HealthCheckType,
    component_id: '',
    title: '',
    quantity: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  if (!isOpen) return null;

  const selectedType = CHECK_TYPES.find(t => t.id === formData.check_type);

  const resetAndClose = () => {
    setStep('form');
    setSavedCheckId(null);
    setPhotoUrl(null);
    setVoiceNote(null);
    setShowCamera(false);
    setFormData({
      check_type: 'oil_level',
      component_id: '',
      title: '',
      quantity: '',
      notes: '',
      date: new Date().toISOString().split('T')[0],
    });
    setError(null);
    onClose();
  };

  // Upload voice note and return URL
  const uploadVoiceNote = async (): Promise<string | null> => {
    if (!voiceNote) return null;
    
    try {
      const file = new File([voiceNote.blob], `voice_note_${Date.now()}.webm`, { type: 'audio/webm' });
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('boat_id', boatId);
      uploadData.append('category', 'other');
      uploadData.append('name', file.name);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Please describe what you checked/did');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload voice note first if exists
      const voiceNoteUrl = await uploadVoiceNote();

      const response = await fetch(`/api/boats/${boatId}/health-checks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          component_id: formData.component_id || null,
          voice_note_url: voiceNoteUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add health check');
      }

      const data = await response.json();
      setSavedCheckId(data.check?.id || data.id || null);
      setStep('upload');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add health check');
    } finally {
      setLoading(false);
    }
  };

  // Upload photo and update health check
  const uploadPhoto = async (file: File) => {
    if (!savedCheckId) return;
    
    setUploading(true);
    setError(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('boat_id', boatId);
      uploadFormData.append('category', 'other');
      uploadFormData.append('name', file.name);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload photo');
      }

      const { document } = await uploadResponse.json();
      const url = document.file_url;

      // Update the health check with the photo URL
      const updateResponse = await fetch(`/api/health-checks/${savedCheckId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: url }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to attach photo');
      }

      setPhotoUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleCameraCapture = (file: File) => {
    setShowCamera(false);
    uploadPhoto(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPhoto(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Group components by category
  const groupedComponents = components.reduce((acc, comp) => {
    if (!acc[comp.category]) acc[comp.category] = [];
    acc[comp.category].push(comp);
    return acc;
  }, {} as Record<string, BoatComponent[]>);

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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={resetAndClose} />
        
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Health Check</h2>
            <button onClick={resetAndClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
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

              {/* Check Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CHECK_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, check_type: type.id })}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                        formData.check_type === type.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Component (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Component
                </label>
                <select
                  value={formData.component_id}
                  onChange={(e) => setFormData({ ...formData, component_id: e.target.value })}
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

              {/* What did you do */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  What did you check/do? *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={selectedType?.placeholder}
                  required
                />
              </div>

              {/* Quantity (for fluid top-ups) */}
              {(formData.check_type === 'oil_level' || formData.check_type === 'fluid_level') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantity Added
                  </label>
                  <input
                    type="text"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 0.5L, 200ml"
                  />
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
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

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={resetAndClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" loading={loading} className="flex-1">
                  <span>Save</span>
                  <Camera className="w-4 h-4 ml-2" />
                  <FileText className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </form>
          ) : (
            /* Upload Step */
            <div className="space-y-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
                ✓ Health check saved! Now add a photo.
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Show uploaded photo or upload options */}
              {photoUrl ? (
                <div className="relative">
                  <img 
                    src={photoUrl} 
                    alt="Health check photo" 
                    className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl(null)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div className="flex gap-3">
                    {/* Take Photo */}
                    <button
                      type="button"
                      onClick={() => setShowCamera(true)}
                      disabled={uploading}
                      className="flex-1 border-2 border-dashed border-teal-400 dark:border-teal-500 rounded-lg p-6 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all disabled:opacity-50"
                    >
                      {uploading ? (
                        <div className="flex flex-col items-center">
                          <Loader2 className="w-8 h-8 text-teal-500 animate-spin mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">Uploading...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Camera className="w-8 h-8 text-teal-500 mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">Take Photo</p>
                        </div>
                      )}
                    </button>

                    {/* Upload from gallery */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all disabled:opacity-50"
                    >
                      {uploading ? (
                        <div className="flex flex-col items-center">
                          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">Uploading...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">Upload File</p>
                        </div>
                      )}
                    </button>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    onSuccess();
                    resetAndClose();
                  }} 
                  className="flex-1"
                >
                  {photoUrl ? 'Done' : 'Skip'}
                </Button>
                {photoUrl && (
                  <Button 
                    onClick={() => {
                      onSuccess();
                      resetAndClose();
                    }}
                    className="flex-1"
                  >
                    Done
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
