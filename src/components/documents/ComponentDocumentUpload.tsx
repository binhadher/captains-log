'use client';

import { useState, useRef } from 'react';
import { X, Upload, Camera, Loader2, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ComponentDocumentUploadProps {
  isOpen: boolean;
  onClose: () => void;
  componentId: string;
  boatId: string;
  onSuccess: () => void;
}

export function ComponentDocumentUpload({
  isOpen,
  onClose,
  componentId,
  boatId,
  onSuccess,
}: ComponentDocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be less than 10MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Get signed URL for upload
      const signedUrlRes = await fetch('/api/upload/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          boatId: boatId,
          componentId: componentId,
        }),
      });

      if (!signedUrlRes.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { signedUrl, publicUrl } = await signedUrlRes.json();

      // Upload file
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file');
      }

      // Create document record
      const docRes = await fetch(`/api/components/${componentId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          category: file.type.startsWith('image/') ? 'other' : 'manual',
        }),
      });

      if (!docRes.ok) {
        throw new Error('Failed to save document');
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Upload Document or Photo
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {uploading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-10 h-10 text-teal-500 animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Uploading...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Upload from device */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
              >
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">Choose from Device</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">PDF, images, documents</p>
                </div>
              </button>

              {/* Take photo */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
              >
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Camera className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">Take Photo</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Use camera to capture</p>
                </div>
              </button>

              <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                Max file size: 10MB
              </p>
            </div>
          )}

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
