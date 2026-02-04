'use client';

import { useState, useRef } from 'react';
import { Camera, Ship, X, Loader2, ImageIcon } from 'lucide-react';

interface BoatHeroProps {
  boatId: string;
  boatName: string;
  photoUrl?: string | null;
  onPhotoChange: (url: string | null) => void;
}

export function BoatHero({ boatId, boatName, photoUrl, onPhotoChange }: BoatHeroProps) {
  const [uploading, setUploading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB');
      return;
    }

    setUploading(true);
    setShowOptions(false);

    try {
      // Get signed URL for upload
      const signedUrlRes = await fetch('/api/upload/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: `boat-hero-${Date.now()}.${file.name.split('.').pop()}`,
          fileType: file.type,
          fileSize: file.size,
          boatId: boatId,
        }),
      });

      if (!signedUrlRes.ok) {
        const errData = await signedUrlRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to get upload URL');
      }

      const { signedUrl, publicUrl } = await signedUrlRes.json();

      // Upload directly to Supabase
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload image');
      }

      // Update boat with new photo URL
      const updateRes = await fetch(`/api/boats/${boatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: publicUrl }),
      });

      if (!updateRes.ok) {
        throw new Error('Failed to update boat');
      }

      onPhotoChange(publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    setShowOptions(false);
    
    try {
      const res = await fetch(`/api/boats/${boatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: null }),
      });

      if (!res.ok) {
        throw new Error('Failed to remove photo');
      }

      onPhotoChange(null);
    } catch (err) {
      console.error('Error removing photo:', err);
      alert('Failed to remove photo');
    }
  };

  return (
    <div className="relative w-full h-48 sm:h-56 md:h-64 rounded-xl overflow-hidden mb-4">
      {/* Background */}
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={boatName}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700">
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <Ship className="w-32 h-32 text-white" />
          </div>
        </div>
      )}

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      {/* Boat name overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
          {boatName}
        </h1>
      </div>

      {/* Camera button */}
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={uploading}
        className="absolute top-3 right-3 p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full transition-colors disabled:opacity-50"
        title={photoUrl ? 'Change cover photo' : 'Add cover photo'}
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        ) : (
          <Camera className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Options dropdown */}
      {showOptions && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowOptions(false)} 
          />
          <div className="absolute top-14 right-3 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-[180px] animate-scale-in">
            <button
              onClick={() => {
                setShowOptions(false);
                fileInputRef.current?.click();
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              Choose from Gallery
            </button>
            <button
              onClick={() => {
                setShowOptions(false);
                cameraInputRef.current?.click();
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Take Photo
            </button>
            {photoUrl && (
              <button
                onClick={handleRemovePhoto}
                className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Remove photo
              </button>
            )}
          </div>
        </>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
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
  );
}
