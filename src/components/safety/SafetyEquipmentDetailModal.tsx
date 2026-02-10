'use client';

import { useState } from 'react';
import { X, Shield, Copy, Check, Share2, Pencil, Trash2, Calendar, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import { SafetyEquipment, SafetyEquipmentType } from '@/types/database';
import { AudioPlayer } from '@/components/ui/AudioPlayer';

interface SafetyEquipmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: SafetyEquipment | null;
  onEdit?: (item: SafetyEquipment) => void;
  onDelete?: (item: SafetyEquipment) => void;
}

const TYPE_LABELS: Record<SafetyEquipmentType, string> = {
  fire_extinguisher: 'Fire Extinguishers',
  engine_room_fire_system: 'Engine Room Fire System',
  life_jacket: 'Life Jackets',
  life_raft: 'Life Raft',
  flares: 'Flares',
  epirb: 'EPIRB',
  first_aid_kit: 'First Aid Kit',
  life_ring: 'Life Ring',
  fire_blanket: 'Fire Blanket',
  other: 'Other',
};

function getExpiryStatus(date?: string): { status: 'ok' | 'warning' | 'expired'; label: string } | null {
  if (!date) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  const daysUntil = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntil < 0) {
    return { status: 'expired', label: `${Math.abs(daysUntil)} days overdue` };
  } else if (daysUntil <= 30) {
    return { status: 'warning', label: `${daysUntil} days left` };
  }
  return { status: 'ok', label: `${daysUntil} days` };
}

export function SafetyEquipmentDetailModal({ isOpen, onClose, equipment, onEdit, onDelete }: SafetyEquipmentDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !equipment) return null;

  const displayName = equipment.type === 'other' ? equipment.type_other : TYPE_LABELS[equipment.type];
  const expiryStatus = getExpiryStatus(equipment.expiry_date);
  const serviceStatus = getExpiryStatus(equipment.next_service_date);

  const getItemText = () => {
    return [
      displayName,
      equipment.quantity > 1 && `Quantity: ${equipment.quantity}`,
      equipment.expiry_date && `Expires: ${new Date(equipment.expiry_date).toLocaleDateString()}`,
      equipment.next_service_date && `Service due: ${new Date(equipment.next_service_date).toLocaleDateString()}`,
      equipment.certification_number && `Cert #: ${equipment.certification_number}`,
      equipment.notes && `Notes: ${equipment.notes}`,
    ].filter(Boolean).join('\n');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getItemText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const text = getItemText();
      if (navigator.share) {
        await navigator.share({
          title: displayName || 'Safety Equipment',
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
    if (!confirm(`Delete "${displayName}"?`)) return;
    
    setDeleting(true);
    try {
      await onDelete?.(equipment);
      onClose();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    onEdit?.(equipment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header with Action Icons */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Safety Equipment
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
          {equipment.photo_url && (
            <a href={equipment.photo_url} target="_blank" rel="noopener noreferrer">
              <img 
                src={equipment.photo_url} 
                alt={displayName || 'Safety equipment'}
                className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              />
            </a>
          )}

          {/* Name and Quantity */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              {displayName}
              {equipment.quantity > 1 && (
                <span className="text-sm bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                  ×{equipment.quantity}
                </span>
              )}
            </h3>
          </div>

          {/* Expiry Warning */}
          {expiryStatus && expiryStatus.status !== 'ok' && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              expiryStatus.status === 'expired' 
                ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800' 
                : 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${expiryStatus.status === 'expired' ? 'text-red-500' : 'text-amber-500'}`} />
              <div>
                <p className={`font-medium ${expiryStatus.status === 'expired' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                  {expiryStatus.status === 'expired' ? 'Expired' : 'Expiring soon'}
                </p>
                <p className="text-sm opacity-80">{expiryStatus.label}</p>
              </div>
            </div>
          )}

          {/* Service Warning */}
          {serviceStatus && serviceStatus.status !== 'ok' && !expiryStatus && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              serviceStatus.status === 'expired' 
                ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800' 
                : 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${serviceStatus.status === 'expired' ? 'text-red-500' : 'text-amber-500'}`} />
              <div>
                <p className={`font-medium ${serviceStatus.status === 'expired' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                  {serviceStatus.status === 'expired' ? 'Service overdue' : 'Service due soon'}
                </p>
                <p className="text-sm opacity-80">{serviceStatus.label}</p>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="space-y-3">
            {equipment.expiry_date && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Expiry Date
                </span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(equipment.expiry_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            )}
            {equipment.last_service_date && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Last Service</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(equipment.last_service_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            )}
            {equipment.next_service_date && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Next Service</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(equipment.next_service_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            )}
            {equipment.service_interval_months && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Service Interval</span>
                <span className="text-gray-900 dark:text-white">{equipment.service_interval_months} months</span>
              </div>
            )}
            {equipment.certification_number && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Cert / Serial #</span>
                <span className="text-gray-900 dark:text-white font-mono">{equipment.certification_number}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {equipment.notes && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">{equipment.notes}</p>
            </div>
          )}

          {/* Voice Note */}
          {equipment.voice_note_url && (
            <AudioPlayer src={equipment.voice_note_url} />
          )}

          {/* View Photo Link (if photo exists) */}
          {equipment.photo_url && (
            <a
              href={equipment.photo_url}
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
