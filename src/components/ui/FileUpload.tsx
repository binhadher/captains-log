'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2, Camera } from 'lucide-react';
import { CameraCapture } from './CameraCapture';

interface UploadedFile {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

interface FileUploadProps {
  componentId?: string;
  logEntryId?: string;
  boatId?: string;
  onUpload?: (doc: UploadedFile) => void;
  maxFiles?: number;
  compact?: boolean;
  showCamera?: boolean;
}

export function FileUpload({ 
  componentId, 
  logEntryId, 
  boatId,
  onUpload,
  maxFiles = 5,
  compact = false,
  showCamera = true,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      formData.append('category', file.type.startsWith('image/') ? 'other' : 'invoice');
      
      if (componentId) formData.append('component_id', componentId);
      if (logEntryId) formData.append('log_entry_id', logEntryId);
      if (boatId) formData.append('boat_id', boatId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const { document } = await response.json();
      setFiles(prev => [...prev, document]);
      onUpload?.(document);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    if (files.length + selectedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    setError(null);

    for (const file of Array.from(selectedFiles)) {
      await uploadFile(file);
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleCameraCapture = async (file: File) => {
    if (files.length >= maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    setError(null);
    await uploadFile(file);
    setUploading(false);
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const isImage = (type: string) => type.startsWith('image/');

  if (compact) {
    return (
      <div>
        {/* Camera Capture Overlay */}
        {showCameraCapture && (
          <CameraCapture
            onCapture={handleCameraCapture}
            onClose={() => setShowCameraCapture(false)}
          />
        )}

        {/* File picker - gallery/documents (PDF and images only) */}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload-compact"
        />
        
        <div className="flex flex-wrap gap-2">
          {files.map((file) => (
            <div key={file.id} className="relative group">
              {isImage(file.file_type) ? (
                <img 
                  src={file.file_url} 
                  alt={file.name}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <button
                onClick={() => removeFile(file.id)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          
          {files.length < maxFiles && (
            <>
              {/* Camera button - opens native camera UI */}
              {showCamera && (
                <button
                  type="button"
                  onClick={() => setShowCameraCapture(true)}
                  className="w-16 h-16 border-2 border-dashed border-teal-400 dark:border-teal-500 rounded-lg flex items-center justify-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all"
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-teal-500" />
                  )}
                </button>
              )}
              {/* Upload button */}
              <label
                htmlFor="file-upload-compact"
                className="w-16 h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5 text-gray-400" />
                )}
              </label>
            </>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Camera Capture Overlay */}
      {showCameraCapture && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCameraCapture(false)}
        />
      )}

      {/* File picker - gallery/documents (PDF and images only) */}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.pdf,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
        id="file-upload"
      />

      {/* Upload Area - Two buttons side by side */}
      <div className="flex gap-3">
        {/* Take Photo button - opens camera directly */}
        {showCamera && (
          <button
            type="button"
            onClick={() => setShowCameraCapture(true)}
            className="flex-1 border-2 border-dashed border-teal-400 dark:border-teal-500 rounded-lg p-6 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all"
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
                <p className="text-xs text-gray-400 mt-1">Opens camera</p>
              </div>
            )}
          </button>
        )}
        
        {/* Upload from gallery/files */}
        <label
          htmlFor="file-upload"
          className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Upload Files</p>
              <p className="text-xs text-gray-400 mt-1">Photos or documents</p>
            </div>
          )}
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>
      )}

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              {isImage(file.file_type) ? (
                <img 
                  src={file.file_url} 
                  alt={file.name}
                  className="w-10 h-10 object-cover rounded"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.file_size)}</p>
              </div>
              <button
                onClick={() => removeFile(file.id)}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
