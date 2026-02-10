'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Shield, Upload, Camera, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { VoiceRecorder } from '@/components/ui/VoiceRecorder';
import { CameraCapture } from '@/components/ui/CameraCapture';
import { SafetyEquipmentType, EngineType } from '@/types/database';

interface AddSafetyEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  boatId: string;
  engineType?: EngineType;
  onSuccess: () => void;
}

const EQUIPMENT_TYPES: Array<{ value: SafetyEquipmentType; label: string; icon: string; inboardOnly?: boolean }> = [
  { value: 'fire_extinguisher', label: 'Fire Extinguishers', icon: '🧯' },
  { value: 'engine_room_fire_system', label: 'Engine Room Fire System', icon: '🔥', inboardOnly: true },
  { value: 'life_jacket', label: 'Life Jackets', icon: '🦺' },
  { value: 'life_raft', label: 'Life Raft', icon: '🛟' },
  { value: 'flares', label: 'Flares', icon: '🚨' },
  { value: 'epirb', label: 'EPIRB', icon: '📡' },
  { value: 'first_aid_kit', label: 'First Aid Kit', icon: '🩹' },
  { value: 'life_ring', label: 'Life Ring / Throwable', icon: '⭕' },
  { value: 'fire_blanket', label: 'Fire Blanket', icon: '🔥' },
  { value: 'other', label: 'Other', icon: '🛡️' },
];

export function AddSafetyEquipmentModal({ isOpen, onClose, boatId, engineType, onSuccess }: AddSafetyEquipmentModalProps) {
  const [step, setStep] = useState<'form' | 'upload'>('form');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedEquipmentId, setSavedEquipmentId] = useState<string | null>(null);
  const [type, setType] = useState<SafetyEquipmentType>('fire_extinguisher');
  const [typeOther, setTypeOther] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [expiryDate, setExpiryDate] = useState('');
  const [lastServiceDate, setLastServiceDate] = useState('');
  const [serviceIntervalMonths, setServiceIntervalMonths] = useState<number | ''>('');
  const [certificationNumber, setCertificationNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [voiceNote, setVoiceNote] = useState<{ blob: Blob; duration: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter equipment types based on engine type
  const availableTypes = EQUIPMENT_TYPES.filter(t => {
    if (t.inboardOnly && engineType === 'outboard') return false;
    return true;
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setSavedEquipmentId(null);
      setType('fire_extinguisher');
      setTypeOther('');
      setQuantity(1);
      setExpiryDate('');
      setLastServiceDate('');
      setServiceIntervalMonths('');
      setCertificationNumber('');
      setNotes('');
      setPhotoUrl(null);
      setVoiceNote(null);
      setShowCamera(false);
      setError(null);
    }
  }, [isOpen]);

  const resetAndClose = () => {
    setStep('form');
    setSavedEquipmentId(null);
    setPhotoUrl(null);
    setVoiceNote(null);
    setShowCamera(false);
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
    setLoading(true);
    setError(null);

    try {
      // Upload voice note first if exists
      const voiceNoteUrl = await uploadVoiceNote();

      const response = await fetch(`/api/boats/${boatId}/safety-equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          type_other: type === 'other' ? typeOther : null,
          quantity,
          expiry_date: expiryDate || null,
          last_service_date: lastServiceDate || null,
          service_interval_months: serviceIntervalMonths || null,
          certification_number: certificationNumber || null,
          notes: notes || null,
          voice_note_url: voiceNoteUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add safety equipment');
      }

      const data = await response.json();
      setSavedEquipmentId(data.equipment?.id || data.id || null);
      setStep('upload');
    } catch (error) {
      console.error('Error adding safety equipment:', error);
      setError('Failed to add safety equipment');
    } finally {
      setLoading(false);
    }
  };

  // Upload photo and update equipment
  const uploadPhoto = async (file: File) => {
    if (!savedEquipmentId) return;
    
    setUploading(true);
    setError(null);

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

      if (!response.ok) throw new Error('Upload failed');

      const { document } = await response.json();
      const url = document.file_url;

      // Update the equipment with photo URL
      const updateResponse = await fetch(`/api/safety-equipment/${savedEquipmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: url }),
      });

      if (!updateResponse.ok) throw new Error('Failed to attach photo');

      setPhotoUrl(url);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Failed to upload photo');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={resetAndClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Add Safety Equipment
          </h2>
          <button
            onClick={resetAndClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Equipment Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as SafetyEquipmentType)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                required
              >
                {availableTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.icon} {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Type Name (if Other) */}
            {type === 'other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Equipment Name *
                </label>
                <input
                  type="text"
                  value={typeOther}
                  onChange={(e) => setTypeOther(e.target.value)}
                  placeholder="Enter equipment name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quantity
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                min={1}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-xs text-gray-500 mt-1">For items that expire (flares, fire extinguisher charges, etc.)</p>
            </div>

            {/* Service Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Service
                </label>
                <input
                  type="date"
                  value={lastServiceDate}
                  onChange={(e) => setLastServiceDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Interval (months)
                </label>
                <input
                  type="number"
                  value={serviceIntervalMonths}
                  onChange={(e) => setServiceIntervalMonths(e.target.value ? parseInt(e.target.value) : '')}
                  min={1}
                  placeholder="e.g. 12"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Certification Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Certification / Serial Number
              </label>
              <input
                type="text"
                value={certificationNumber}
                onChange={(e) => setCertificationNumber(e.target.value)}
                placeholder="e.g. EPIRB registration number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 resize-none"
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

            {/* Submit Button */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={resetAndClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading || (type === 'other' && !typeOther)} className="flex-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
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
              ✓ Equipment saved! Now add a photo or certificate.
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
                  alt="Equipment photo" 
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
  );
}
