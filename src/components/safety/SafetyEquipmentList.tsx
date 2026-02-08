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
  AlertTriangle,
  Circle
} from 'lucide-react';
import { SafetyEquipment, SafetyEquipmentType } from '@/types/database';

interface SafetyEquipmentListProps {
  equipment: SafetyEquipment[];
  onEdit?: (item: SafetyEquipment) => void;
  onDelete?: (item: SafetyEquipment) => void;
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

export function SafetyEquipmentList({ equipment, onEdit, onDelete }: SafetyEquipmentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (item: SafetyEquipment) => {
    if (!confirm(`Delete ${TYPE_CONFIG[item.type]?.label || item.type_other}?`)) return;
    
    setDeletingId(item.id);
    try {
      await onDelete?.(item);
    } finally {
      setDeletingId(null);
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
    <div className="space-y-2">
      {equipment.map((item) => {
        const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.other;
        const displayName = item.type === 'other' ? item.type_other : config.label;
        const expiryStatus = getExpiryStatus(item.expiry_date, item.next_service_date);
        
        return (
          <div 
            key={item.id}
            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
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
                  onClick={() => handleDelete(item)}
                  disabled={deletingId === item.id}
                  className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
