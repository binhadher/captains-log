'use client';

import { useState } from 'react';
import { X, Download, Share2, Pencil, Trash2, Loader2, FileText, AlertTriangle, Calendar } from 'lucide-react';
import { Document } from '@/types/database';
import { formatDueIn, calculateSeverity } from '@/lib/alerts';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  onEdit?: (doc: Document) => void;
  onDelete?: (docId: string) => void;
}

function getExpiryInfo(expiryDate: string | undefined) {
  if (!expiryDate) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    daysUntil,
    text: formatDueIn(daysUntil),
    severity: calculateSeverity(daysUntil),
  };
}

function isImageFile(fileType: string): boolean {
  return fileType.startsWith('image/');
}

function isPdfFile(fileType: string): boolean {
  return fileType === 'application/pdf';
}

export function DocumentPreviewModal({ isOpen, onClose, document: doc, onEdit, onDelete }: DocumentPreviewModalProps) {
  const [sharing, setSharing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !doc) return null;

  const expiryInfo = getExpiryInfo(doc.expiry_date);
  const isImage = isImageFile(doc.file_type);
  const isPdf = isPdfFile(doc.file_type);
  const canPreview = isImage || isPdf;

  const handleShare = async () => {
    setSharing(true);
    try {
      const response = await fetch(doc.file_url);
      const blob = await response.blob();
      const file = new File([blob], doc.name, { type: doc.file_type || 'application/octet-stream' });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: doc.name,
        });
      } else {
        // Fallback: download
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = doc.name;
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = doc.file_url;
    a.download = doc.name;
    a.target = '_blank';
    a.click();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${doc.name}"?`)) return;
    
    setDeleting(true);
    try {
      await onDelete?.(doc.id);
      onClose();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    onEdit?.(doc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      {/* Close on backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Top Bar with document name and actions */}
        <div className="flex items-center justify-between bg-gray-900/95 backdrop-blur px-4 py-3 rounded-t-xl">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <h3 className="text-white font-medium truncate">{doc.name}</h3>
            {/* Expiry Warning Badge */}
            {expiryInfo && (expiryInfo.severity === 'overdue' || expiryInfo.severity === 'urgent') && (
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                expiryInfo.severity === 'overdue' 
                  ? 'bg-red-500/20 text-red-300' 
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                <AlertTriangle className="w-3 h-3" />
                {expiryInfo.text}
              </span>
            )}
          </div>
          
          {/* Action Icons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleDownload}
              className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={handleShare}
              disabled={sharing}
              className="p-2 text-gray-300 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors disabled:opacity-50"
              title="Share"
            >
              {sharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
            </button>
            {onEdit && (
              <button
                onClick={handleEdit}
                className="p-2 text-gray-300 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                title="Edit"
              >
                <Pencil className="w-5 h-5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                title="Delete"
              >
                {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              </button>
            )}
            <div className="w-px h-6 bg-gray-700 mx-1" />
            <button
              onClick={onClose}
              className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 bg-gray-800 rounded-b-xl overflow-hidden min-h-[300px] max-h-[calc(90vh-80px)]">
          {isImage && !imageError ? (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
              )}
              <img
                src={doc.file_url}
                alt={doc.name}
                className="max-w-full max-h-[calc(90vh-120px)] object-contain rounded"
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={`${doc.file_url}#toolbar=0`}
              className="w-full h-[calc(90vh-80px)]"
              title={doc.name}
            />
          ) : (
            /* Fallback for non-previewable files */
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <FileText className="w-16 h-16 text-gray-500 mb-4" />
              <h4 className="text-white font-medium mb-2">{doc.name}</h4>
              <p className="text-gray-400 text-sm mb-6">
                This file type cannot be previewed directly.
              </p>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Download File
              </button>
            </div>
          )}
        </div>

        {/* Bottom info bar (optional - shows expiry/upload date) */}
        {(doc.expiry_date || doc.notes) && (
          <div className="bg-gray-900/95 backdrop-blur px-4 py-2 rounded-b-xl border-t border-gray-700 -mt-3 pt-5">
            <div className="flex items-center gap-4 text-sm text-gray-400">
              {doc.expiry_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Expires: {new Date(doc.expiry_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
              {doc.notes && (
                <span className="truncate">{doc.notes}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
