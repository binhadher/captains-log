'use client';

import { useState } from 'react';
import { X, FileText, Download, Share2, Pencil, Trash2, Calendar, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { Document, DocumentCategory } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { formatDueIn, calculateSeverity, SEVERITY_COLORS } from '@/lib/alerts';

interface DocumentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  onEdit?: (doc: Document) => void;
  onDelete?: (docId: string) => void;
}

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  registration: 'Registration',
  insurance: 'Insurance',
  berth: 'Berth Contract',
  warranty: 'Warranty',
  invoice: 'Invoice',
  manual: 'Manual',
  other: 'Other',
};

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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentDetailModal({ isOpen, onClose, document: doc, onEdit, onDelete }: DocumentDetailModalProps) {
  const [sharing, setSharing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !doc) return null;

  const expiryInfo = getExpiryInfo(doc.expiry_date);
  const severityColors = expiryInfo ? SEVERITY_COLORS[expiryInfo.severity] : null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Document
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Document Name */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{doc.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {CATEGORY_LABELS[doc.category] || doc.category} • {formatFileSize(doc.file_size)}
            </p>
          </div>

          {/* Expiry Warning */}
          {expiryInfo && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${severityColors?.bg} ${severityColors?.border} border`}>
              {expiryInfo.severity === 'overdue' || expiryInfo.severity === 'urgent' ? (
                <AlertTriangle className={`w-5 h-5 ${severityColors?.text}`} />
              ) : (
                <Calendar className={`w-5 h-5 ${severityColors?.text}`} />
              )}
              <div>
                <p className={`font-medium ${severityColors?.text}`}>
                  {expiryInfo.severity === 'overdue' ? 'Expired' : 'Expires'} {expiryInfo.text}
                </p>
                <p className="text-sm opacity-80">
                  {new Date(doc.expiry_date!).toLocaleDateString('en-GB', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Upload Date */}
          {doc.uploaded_at && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              Uploaded {new Date(doc.uploaded_at).toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              })}
            </div>
          )}

          {/* Notes */}
          {doc.notes && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">{doc.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <a
              href={doc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open
            </a>
            <a
              href={doc.file_url}
              download={doc.name}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
            <button
              onClick={handleShare}
              disabled={sharing}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              Share
            </button>
            {onEdit && (
              <button
                onClick={handleEdit}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>

          {/* Delete Button */}
          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Document
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
