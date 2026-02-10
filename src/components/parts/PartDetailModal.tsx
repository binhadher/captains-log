'use client';

import { useState } from 'react';
import { X, Package, Copy, Check, Share2, Pencil, Trash2, Calendar, Loader2, ExternalLink } from 'lucide-react';
import { Part } from '@/types/database';
import { formatDate } from '@/lib/utils';
import { AudioPlayer } from '@/components/ui/AudioPlayer';

interface PartDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: Part | null;
  onEdit?: (part: Part) => void;
  onDelete?: (part: Part) => void;
}

export function PartDetailModal({ isOpen, onClose, part, onEdit, onDelete }: PartDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !part) return null;

  const getPartText = () => {
    return [
      part.name,
      part.brand && `Brand: ${part.brand}`,
      part.part_number && `Part #: ${part.part_number}`,
      part.size_specs && `Size/Specs: ${part.size_specs}`,
      part.supplier && `Supplier: ${part.supplier}`,
      part.install_date && `Installed: ${formatDate(part.install_date)}`,
      part.notes && `Notes: ${part.notes}`,
      part.photo_url && `Photo: ${part.photo_url}`,
      part.voice_note_url && `Voice Note: ${part.voice_note_url}`,
    ].filter(Boolean).join('\n');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getPartText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const text = getPartText();
      if (navigator.share) {
        await navigator.share({
          title: part.name,
          text: text,
        });
      } else {
        await handleCopy();
      }
    } catch (err) {
      // User cancelled
    } finally {
      setSharing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${part.name}"?`)) return;
    
    setDeleting(true);
    try {
      await onDelete?.(part);
      onClose();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    onEdit?.(part);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header with Action Icons */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5" />
            Part Details
          </h2>
          
          {/* Action Icons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Copy"
            >
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            </button>
            <button
              onClick={handleShare}
              disabled={sharing}
              className="p-2 text-gray-500 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-lg transition-colors disabled:opacity-50"
              title="Share"
            >
              {sharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
            </button>
            {onEdit && (
              <button
                onClick={handleEdit}
                className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                title="Edit"
              >
                <Pencil className="w-5 h-5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                title="Delete"
              >
                {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              </button>
            )}
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Photo */}
          {part.photo_url && (
            <a href={part.photo_url} target="_blank" rel="noopener noreferrer">
              <img 
                src={part.photo_url} 
                alt={part.name}
                className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              />
            </a>
          )}

          {/* Part Name */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{part.name}</h3>
            {part.component_name && (
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">{part.component_name}</p>
            )}
          </div>

          {/* Details Grid */}
          <div className="space-y-3">
            {part.brand && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Brand</span>
                <span className="text-gray-900 dark:text-white font-medium">{part.brand}</span>
              </div>
            )}
            {part.part_number && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Part Number</span>
                <span className="text-gray-900 dark:text-white font-mono">{part.part_number}</span>
              </div>
            )}
            {part.size_specs && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Size/Specs</span>
                <span className="text-gray-900 dark:text-white">{part.size_specs}</span>
              </div>
            )}
            {part.supplier && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Supplier</span>
                <span className="text-gray-900 dark:text-white">{part.supplier}</span>
              </div>
            )}
            {part.install_date && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Installed
                </span>
                <span className="text-gray-900 dark:text-white">{formatDate(part.install_date)}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {part.notes && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300 italic">{part.notes}</p>
            </div>
          )}

          {/* Voice Note */}
          {part.voice_note_url && (
            <AudioPlayer src={part.voice_note_url} />
          )}

          {/* View Photo Link (if photo exists) */}
          {part.photo_url && (
            <a
              href={part.photo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Full Photo
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
