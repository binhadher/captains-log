'use client';

import { useState } from 'react';
import { Camera, Image as ImageIcon, Loader2, X, Eye, Trash2 } from 'lucide-react';
import { CameraCapture } from '@/components/ui/CameraCapture';

interface DataPlateUploadProps {
  label: string;
  currentUrl?: string;
  onUpload: (file: File) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function DataPlateUpload({ label, currentUrl, onUpload, onDelete }: DataPlateUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadFile(file);
    e.target.value = ''; // Reset input
  };

  const handleCameraCapture = async (file: File) => {
    setShowCamera(false);
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setError(null);
    setUploading(true);

    try {
      await onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !confirm('Delete this data plate photo?')) return;
    
    setUploading(true);
    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {currentUrl ? (
          // Show thumbnail and actions if image exists
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(true)}
              className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 hover:border-teal-500 transition-colors group"
              title="View data plate"
            >
              <img 
                src={currentUrl} 
                alt={label}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Eye className="w-4 h-4 text-white" />
              </div>
            </button>
            {onDelete && (
              <button
                onClick={handleDelete}
                disabled={uploading}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          // Show upload buttons if no image
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowCamera(true)}
              disabled={uploading}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Take photo"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            
            <label className="p-2 text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer">
              <ImageIcon className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        )}
        
        {error && (
          <span className="text-xs text-red-500">{error}</span>
        )}
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
          mode="photo"
        />
      )}

      {/* Preview Modal */}
      {showPreview && currentUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setShowPreview(false)}
        >
          <button 
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            onClick={() => setShowPreview(false)}
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img 
            src={currentUrl} 
            alt={label}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
