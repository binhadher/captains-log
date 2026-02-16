'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2, Camera, Pencil } from 'lucide-react';
import { CameraCapture } from './CameraCapture';

interface UploadedFile {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

interface PendingFile {
  file: File;
  suggestedName: string;
  previewUrl?: string;
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

// Detect generic camera/phone filenames that should be renamed
function isGenericFilename(filename: string): boolean {
  const genericPatterns = [
    /^IMG[_-]?\d+/i,           // IMG_20251023_162114, IMG-20251023
    /^DSC[_-]?\d+/i,           // DSC_0001, DSC-0001
    /^PXL[_-]?\d+/i,           // PXL_20251023 (Google Pixel)
    /^Screenshot[_-]?\d*/i,    // Screenshot_20251023
    /^Photo[_-]?\d*/i,         // Photo_001
    /^Image[_-]?\d*/i,         // Image_001
    /^DCIM[_-]?\d*/i,          // DCIM folders
    /^Camera[_-]?\d*/i,        // Camera_001
    /^\d{8}[_-]\d{6}/,         // 20251023_162114
    /^P\d{7,}/i,               // P1234567 (some cameras)
    /^DSCN?\d+/i,              // DSCN0001
    /^SAM[_-]?\d+/i,           // SAM_0001 (Samsung)
    /^[A-Z]{2,4}\d{4,}/i,      // Generic: 2-4 letters + 4+ digits
  ];
  
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  return genericPatterns.some(pattern => pattern.test(nameWithoutExt));
}

// Get file extension
function getExtension(filename: string): string {
  const match = filename.match(/\.[^.]+$/);
  return match ? match[0] : '';
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
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File, customName?: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', customName || file.name);
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

  // Check if file needs renaming, if so show dialog, otherwise upload directly
  const processFile = async (file: File) => {
    if (isGenericFilename(file.name)) {
      // Show rename dialog
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      setPendingFile({ file, suggestedName: '', previewUrl });
      setRenameValue('');
      // Focus the input after render
      setTimeout(() => renameInputRef.current?.focus(), 100);
    } else {
      // Upload directly with original name
      await uploadFile(file);
    }
  };

  const handleRenameSubmit = async () => {
    if (!pendingFile) return;
    
    const ext = getExtension(pendingFile.file.name);
    const newName = renameValue.trim() 
      ? renameValue.trim() + ext 
      : pendingFile.file.name; // Keep original if blank
    
    setUploading(true);
    await uploadFile(pendingFile.file, newName);
    setUploading(false);
    
    // Clean up
    if (pendingFile.previewUrl) {
      URL.revokeObjectURL(pendingFile.previewUrl);
    }
    setPendingFile(null);
    setRenameValue('');
  };

  const handleRenameSkip = async () => {
    if (!pendingFile) return;
    
    setUploading(true);
    await uploadFile(pendingFile.file); // Upload with original name
    setUploading(false);
    
    if (pendingFile.previewUrl) {
      URL.revokeObjectURL(pendingFile.previewUrl);
    }
    setPendingFile(null);
    setRenameValue('');
  };

  const handleRenameCancel = () => {
    if (pendingFile?.previewUrl) {
      URL.revokeObjectURL(pendingFile.previewUrl);
    }
    setPendingFile(null);
    setRenameValue('');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    if (files.length + selectedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setError(null);

    // Process files one at a time (rename dialog handles one file)
    for (const file of Array.from(selectedFiles)) {
      if (isGenericFilename(file.name)) {
        // Show rename dialog for this file (will wait for user input)
        await processFile(file);
        break; // Only handle one at a time when renaming is needed
      } else {
        setUploading(true);
        await uploadFile(file);
        setUploading(false);
      }
    }

    if (inputRef.current) inputRef.current.value = '';
  };

  const handleCameraCapture = async (file: File) => {
    if (files.length >= maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setError(null);
    // Camera captures always have generic names, so always offer rename
    await processFile(file);
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const isImage = (type: string) => type.startsWith('image/');

  // Rename Dialog Component (inline)
  const RenameDialog = () => {
    if (!pendingFile) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl max-w-sm w-full shadow-xl">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Name this file
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Give it a descriptive name so you can find it later
            </p>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Preview */}
            {pendingFile.previewUrl ? (
              <img 
                src={pendingFile.previewUrl} 
                alt="Preview" 
                className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <FileText className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {pendingFile.file.name}
                </span>
              </div>
            )}
            
            {/* Name input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                File name
              </label>
              <div className="flex items-center gap-1">
                <input
                  ref={renameInputRef}
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit();
                    if (e.key === 'Escape') handleRenameCancel();
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., engine-oil-check"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {getExtension(pendingFile.file.name)}
                </span>
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRenameCancel}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRenameSkip}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Keep Original
              </button>
              <button
                type="button"
                onClick={handleRenameSubmit}
                disabled={uploading}
                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (compact) {
    return (
      <div>
        {/* Rename Dialog */}
        <RenameDialog />
        
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
      {/* Rename Dialog */}
      <RenameDialog />
      
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
