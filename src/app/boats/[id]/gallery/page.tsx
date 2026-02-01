'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Camera, 
  Upload, 
  Image as ImageIcon, 
  Video, 
  X, 
  Trash2,
  Loader2,
  Play,
  Plus,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { UserButton } from '@clerk/nextjs';
import { CameraCapture } from '@/components/ui/CameraCapture';

interface GalleryItem {
  id: string;
  file_url: string;
  file_type: 'image' | 'video';
  mime_type: string;
  file_size: number;
  caption: string | null;
  taken_at: string | null;
  created_at: string;
}

interface Boat {
  id: string;
  name: string;
}

export default function GalleryPage() {
  const params = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [boat, setBoat] = useState<Boat | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCameraCapture, setShowCameraCapture] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchBoatAndGallery();
    }
  }, [params.id]);

  const fetchBoatAndGallery = async () => {
    try {
      setLoading(true);
      
      // Fetch boat info
      const boatRes = await fetch(`/api/boats/${params.id}`);
      if (!boatRes.ok) throw new Error('Boat not found');
      const boatData = await boatRes.json();
      setBoat(boatData.boat);

      // Fetch gallery
      const galleryRes = await fetch(`/api/boats/${params.id}/gallery`);
      if (galleryRes.ok) {
        const galleryData = await galleryRes.json();
        setGallery(galleryData.gallery || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  const uploadSingleFile = async (file: File) => {
    console.log('Uploading file:', file.name, 'type:', file.type, 'size:', file.size);
    
    // Determine file type - be lenient for iOS which might not set type correctly
    const isVideo = file.type.startsWith('video/') || file.name.endsWith('.webm') || file.name.endsWith('.mp4');
    const isImage = file.type.startsWith('image/') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || file.name.endsWith('.png');
    
    if (!isVideo && !isImage && file.type) {
      console.error('Invalid file type:', file.type);
      setError(`File type not allowed: ${file.type || 'unknown'}`);
      return;
    }

    // Check file size (50MB for videos, 10MB for images)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File too large. Max ${isVideo ? '50MB' : '10MB'}`);
      return;
    }
    
    if (file.size === 0) {
      setError('File is empty');
      return;
    }

    // Upload to storage
    const formData = new FormData();
    formData.append('file', file);
    formData.append('boat_id', params.id as string);
    formData.append('name', file.name);
    formData.append('category', 'other');

    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!uploadRes.ok) {
      const errorData = await uploadRes.json().catch(() => ({}));
      console.error('Upload error:', uploadRes.status, errorData);
      throw new Error(errorData.error || `Upload failed (${uploadRes.status})`);
    }

    const { document } = await uploadRes.json();

    // Add to gallery
    const galleryRes = await fetch(`/api/boats/${params.id}/gallery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_url: document.file_url,
        file_type: isVideo ? 'video' : 'image',
        mime_type: file.type,
        file_size: file.size,
      }),
    });

    if (!galleryRes.ok) {
      throw new Error('Failed to add to gallery');
    }

    const { galleryItem } = await galleryRes.json();
    setGallery(prev => [galleryItem, ...prev]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      try {
        await uploadSingleFile(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      }
    }

    setUploading(false);
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCameraCapture = async (file: File) => {
    setUploading(true);
    setError(null);
    
    try {
      await uploadSingleFile(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
    
    setUploading(false);
  };

  const handleDelete = async (item: GalleryItem) => {
    if (!confirm('Delete this item?')) return;

    try {
      const res = await fetch(`/api/boats/${params.id}/gallery?itemId=${item.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      setGallery(prev => prev.filter(g => g.id !== item.id));
      setSelectedItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dubai flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (error && !boat) {
    return (
      <div className="min-h-screen bg-dubai flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dubai">
      {/* Header */}
      <header className="glass-header sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link href={`/boats/${params.id}`} className="p-2 hover:bg-gray-200 dark:hover:bg-white/20 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-white" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-teal-700 dark:text-white">Gallery</h1>
                <p className="text-xs text-teal-600 dark:text-gray-300">{boat?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link 
                href="/settings" 
                className="p-2 bg-gray-200 dark:bg-white/20 hover:bg-gray-300 dark:hover:bg-white/30 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-gray-700 dark:text-white" />
              </Link>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Camera Capture Overlay */}
        {showCameraCapture && (
          <CameraCapture
            onCapture={handleCameraCapture}
            onClose={() => setShowCameraCapture(false)}
          />
        )}

        {/* Upload Buttons */}
        <div className="glass-card rounded-xl p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            {/* Upload from device */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label 
              htmlFor="file-upload"
              className={`inline-flex items-center justify-center font-medium rounded-lg text-sm px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload from Device
            </label>

            {/* Take photo - opens camera directly */}
            <button
              type="button"
              onClick={() => setShowCameraCapture(true)}
              disabled={uploading}
              className={`inline-flex items-center justify-center font-medium rounded-lg text-sm px-4 py-2 bg-teal-600 text-white hover:bg-teal-700 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </button>

            {uploading && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Uploading...</span>
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-3">{error}</p>
          )}
        </div>

        {/* Gallery Grid */}
        {gallery.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <ImageIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No photos or videos yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Upload photos or take pictures directly to build your boat's gallery.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {gallery.map((item) => (
              <div
                key={item.id}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group bg-gray-200 dark:bg-gray-800"
                onClick={() => setSelectedItem(item)}
              >
                {item.file_type === 'video' ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <video
                      src={item.file_url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-white ml-1" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={item.file_url}
                    alt={item.caption || 'Gallery image'}
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                  <div className="w-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs truncate">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                </div>

                {/* Type indicator */}
                <div className="absolute top-2 right-2">
                  {item.file_type === 'video' ? (
                    <Video className="w-4 h-4 text-white drop-shadow-lg" />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {selectedItem && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(selectedItem);
              }}
              className="absolute top-4 left-4 p-2 text-white hover:bg-red-600 rounded-full transition-colors"
              title="Delete"
            >
              <Trash2 className="w-6 h-6" />
            </button>

            <div 
              className="max-w-5xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedItem.file_type === 'video' ? (
                <video
                  src={selectedItem.file_url}
                  controls
                  autoPlay
                  className="w-full max-h-[85vh] object-contain rounded-lg"
                />
              ) : (
                <img
                  src={selectedItem.file_url}
                  alt={selectedItem.caption || 'Gallery image'}
                  className="w-full max-h-[85vh] object-contain rounded-lg"
                />
              )}

              {/* Info bar */}
              <div className="mt-3 flex items-center justify-between text-white text-sm">
                <span>{formatDate(selectedItem.created_at)}</span>
                {selectedItem.caption && (
                  <span className="text-gray-300">{selectedItem.caption}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
