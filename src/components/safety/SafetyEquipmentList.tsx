'use client';

import { useState } from 'react';
import { 
  Shield, 
  Flame,
  CircleAlert,
  Heart,
  Radio,
  LifeBuoy,
  Pencil,
  Trash2,
  Calendar,
  Circle,
  CheckSquare,
  Square,
  X,
  Share2,
  Loader2
} from 'lucide-react';
import { SafetyEquipment, SafetyEquipmentType } from '@/types/database';
import { Button } from '@/components/ui/Button';

interface SafetyEquipmentListProps {
  equipment: SafetyEquipment[];
  onEdit?: (item: SafetyEquipment) => void;
  onDelete?: (item: SafetyEquipment) => void;
  onBulkDelete?: (items: SafetyEquipment[]) => Promise<void>;
}

const TYPE_CONFIG: Record<SafetyEquipmentType, { label: string; icon: React.ReactNode; color: string }> = {
  fire_extinguisher: { 
    label: 'Fire Extinguishers', 
    icon: <Flame className="w-5 h-5" />,
    color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
  },
  engine_room_fire_system: { 
    label: 'Engine Room Fire System', 
    icon: <Flame className="w-5 h-5" />,
    color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
  },
  life_jacket: { 
    label: 'Life Jackets', 
    icon: <Shield className="w-5 h-5" />,
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
  },
  life_raft: { 
    label: 'Life Raft', 
    icon: <LifeBuoy className="w-5 h-5" />,
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
  },
  flares: { 
    label: 'Flares', 
    icon: <CircleAlert className="w-5 h-5" />,
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
  },
  epirb: { 
    label: 'EPIRB', 
    icon: <Radio className="w-5 h-5" />,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
  },
  first_aid_kit: { 
    label: 'First Aid Kit', 
    icon: <Heart className="w-5 h-5" />,
    color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
  },
  life_ring: { 
    label: 'Life Ring', 
    icon: <LifeBuoy className="w-5 h-5" />,
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
  },
  fire_blanket: { 
    label: 'Fire Blanket', 
    icon: <Flame className="w-5 h-5" />,
    color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
  },
  other: { 
    label: 'Other', 
    icon: <Shield className="w-5 h-5" />,
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  },
};

type ExpiryStatus = 'ok' | 'warning' | 'expired';

function getExpiryStatus(expiryDate?: string, nextServiceDate?: string): { status: ExpiryStatus; label: string } | null {
  const dateToCheck = expiryDate || nextServiceDate;
  if (!dateToCheck) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateToCheck);
  const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntil < 0) {
    return { status: 'expired', label: `${Math.abs(daysUntil)}d overdue` };
  } else if (daysUntil <= 30) {
    return { status: 'warning', label: `${daysUntil}d left` };
  }
  return { status: 'ok', label: '' };
}

const STATUS_COLORS: Record<ExpiryStatus, string> = {
  ok: 'text-green-500',
  warning: 'text-amber-500',
  expired: 'text-red-500',
};

export function SafetyEquipmentList({ equipment, onEdit, onDelete, onBulkDelete }: SafetyEquipmentListProps) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedItems(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === equipment.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(equipment.map(e => e.id)));
    }
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedItems(new Set());
  };

  const getItemText = (item: SafetyEquipment) => {
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.other;
    const displayName = item.type === 'other' ? item.type_other : config.label;
    return [
      displayName,
      item.quantity > 1 && `Quantity: ${item.quantity}`,
      item.expiry_date && `Expires: ${new Date(item.expiry_date).toLocaleDateString()}`,
      item.next_service_date && `Service due: ${new Date(item.next_service_date).toLocaleDateString()}`,
      item.certification_number && `Cert #: ${item.certification_number}`,
      item.notes && `Notes: ${item.notes}`,
    ].filter(Boolean).join('\n');
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    if (!confirm(`Delete ${selectedItems.size} safety item${selectedItems.size > 1 ? 's' : ''}?`)) return;

    setBulkDeleting(true);
    try {
      const itemsToDelete = equipment.filter(e => selectedItems.has(e.id));
      if (onBulkDelete) {
        await onBulkDelete(itemsToDelete);
      } else if (onDelete) {
        for (const item of itemsToDelete) {
          await onDelete(item);
        }
      }
      exitSelectMode();
    } catch (err) {
      console.error('Error bulk deleting:', err);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkShare = async () => {
    if (selectedItems.size === 0) return;
    
    const selectedItemsList = equipment.filter(e => selectedItems.has(e.id));
    const text = selectedItemsList.map(getItemText).join('\n\n---\n\n');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${selectedItems.size} Safety Equipment Items`,
          text: text,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  if (equipment.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No safety equipment added yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Select mode toggle */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
        >
          {selectMode ? <X className="w-3 h-3" /> : <CheckSquare className="w-3 h-3" />}
          {selectMode ? 'Cancel' : 'Select'}
        </button>
      </div>

      <div className="space-y-2">
        {equipment.map((item) => {
          const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.other;
          const displayName = item.type === 'other' ? item.type_other : config.label;
          const expiryStatus = getExpiryStatus(item.expiry_date, item.next_service_date);
          const isSelected = selectedItems.has(item.id);
          
          return (
            <div 
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700'
                  : 'bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
              }`}
              onClick={() => selectMode && toggleSelection(item.id)}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Checkbox in select mode */}
                {selectMode && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSelection(item.id); }}
                    className="flex-shrink-0 text-teal-600 dark:text-teal-400"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                )}

                <div className="relative flex-shrink-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                    {config.icon}
                  </div>
                  {/* Status badge */}
                  {expiryStatus && expiryStatus.status !== 'ok' && (
                    <div className={`absolute -top-1 -right-1 ${STATUS_COLORS[expiryStatus.status]}`} title={expiryStatus.label}>
                      <Circle className="w-3 h-3 fill-current" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                      {displayName}
                    </h4>
                    {item.quantity > 1 && (
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">
                        ×{item.quantity}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    {item.expiry_date && (
                      <span className={`flex items-center gap-1 ${expiryStatus?.status === 'expired' ? 'text-red-500' : expiryStatus?.status === 'warning' ? 'text-amber-500' : ''}`}>
                        <Calendar className="w-3 h-3" />
                        Exp: {new Date(item.expiry_date).toLocaleDateString()}
                      </span>
                    )}
                    {item.next_service_date && !item.expiry_date && (
                      <span className={`flex items-center gap-1 ${expiryStatus?.status === 'expired' ? 'text-red-500' : expiryStatus?.status === 'warning' ? 'text-amber-500' : ''}`}>
                        <Calendar className="w-3 h-3" />
                        Service: {new Date(item.next_service_date).toLocaleDateString()}
                      </span>
                    )}
                    {item.certification_number && (
                      <span className="truncate">#{item.certification_number}</span>
                    )}
                  </div>
                </div>
              </div>
              
              {!selectMode && (
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(item)}
                      className="p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${displayName}?`)) {
                          onDelete(item);
                        }
                      }}
                      className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bulk action bar */}
      {selectMode && selectedItems.size > 0 && (
        <div className="sticky bottom-0 mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="text-sm text-teal-600 dark:text-teal-400 hover:underline"
            >
              {selectedItems.size === equipment.length ? 'Deselect all' : 'Select all'}
            </button>
            <span className="text-sm text-gray-500">
              {selectedItems.size} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkShare}
            >
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
            >
              {bulkDeleting ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-1" />
              )}
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
