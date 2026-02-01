'use client';

import { useState } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  FileText, 
  ChevronRight,
  AlertTriangle,
  MoreVertical,
  Edit,
  Trash2,
  Users
} from 'lucide-react';

export interface CrewMember {
  id: string;
  boat_id: string;
  name: string;
  title: string;
  title_other?: string;
  phone?: string;
  email?: string;
  passport_expiry?: string;
  emirates_id_expiry?: string;
  marine_license_expiry?: string;
  status: 'active' | 'inactive';
  photo_url?: string;
}

interface CrewListProps {
  crew: CrewMember[];
  onEdit?: (member: CrewMember) => void;
  onDelete?: (member: CrewMember) => void;
  compact?: boolean;
}

const TITLE_LABELS: Record<string, string> = {
  captain: 'Captain',
  first_mate: 'First Mate',
  engineer: 'Engineer',
  mechanic: 'Mechanic',
  deckhand: 'Deckhand',
  chef: 'Chef',
  steward: 'Steward',
  stewardess: 'Stewardess',
  bosun: 'Bosun',
  other: 'Other',
};

const TITLE_ICONS: Record<string, string> = {
  captain: '👨‍✈️',
  first_mate: '🧑‍✈️',
  engineer: '🔧',
  mechanic: '🛠️',
  deckhand: '⚓',
  chef: '👨‍🍳',
  steward: '🛎️',
  stewardess: '🛎️',
  bosun: '⚓',
  other: '👤',
};

function getExpiryWarning(expiryDate?: string): { warning: boolean; daysLeft: number } | null {
  if (!expiryDate) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    warning: daysLeft <= 30,
    daysLeft,
  };
}

export function CrewList({ crew, onEdit, onDelete, compact = false }: CrewListProps) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  if (crew.length === 0) {
    return (
      <div className="text-center py-6">
        <Users className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">No crew members yet</p>
        <p className="text-gray-400 dark:text-gray-400 text-xs mt-1">Add your crew to track their documents</p>
      </div>
    );
  }

  const activeCrew = crew.filter(c => c.status === 'active');
  const inactiveCrew = crew.filter(c => c.status === 'inactive');

  const renderMember = (member: CrewMember) => {
    const passportWarning = getExpiryWarning(member.passport_expiry);
    const emiratesWarning = getExpiryWarning(member.emirates_id_expiry);
    const licenseWarning = getExpiryWarning(member.marine_license_expiry);
    const hasWarning = passportWarning?.warning || emiratesWarning?.warning || licenseWarning?.warning;

    return (
      <div 
        key={member.id}
        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
          member.status === 'inactive' 
            ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60'
            : hasWarning
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md'
        }`}
      >
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
          member.status === 'inactive' 
            ? 'bg-gray-200 dark:bg-gray-700'
            : 'bg-cyan-100 dark:bg-cyan-900/50'
        }`}>
          {member.photo_url ? (
            <img src={member.photo_url} alt={member.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            TITLE_ICONS[member.title] || '👤'
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 dark:text-white truncate">{member.name}</p>
            {hasWarning && (
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {member.title === 'other' ? member.title_other : TITLE_LABELS[member.title]}
          </p>
        </div>

        {/* Contact Icons */}
        {!compact && (
          <div className="flex items-center gap-2">
            {member.phone && (
              <a href={`tel:${member.phone}`} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <Phone className="w-4 h-4 text-gray-400" />
              </a>
            )}
            {member.email && (
              <a href={`mailto:${member.email}`} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <Mail className="w-4 h-4 text-gray-400" />
              </a>
            )}
          </div>
        )}

        {/* Actions */}
        {(onEdit || onDelete) && (
          <div className="relative">
            <button 
              onClick={() => setMenuOpen(menuOpen === member.id ? null : member.id)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            
            {menuOpen === member.id && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                <div className="absolute right-0 top-8 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[120px]">
                  {onEdit && (
                    <button
                      onClick={() => { onEdit(member); setMenuOpen(null); }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => { onDelete(member); setMenuOpen(null); }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Active Crew */}
      {activeCrew.length > 0 && (
        <div className="space-y-2">
          {activeCrew.map(renderMember)}
        </div>
      )}

      {/* Inactive Crew */}
      {inactiveCrew.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">
            Inactive ({inactiveCrew.length})
          </p>
          {inactiveCrew.map(renderMember)}
        </div>
      )}
    </div>
  );
}
