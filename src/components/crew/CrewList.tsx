'use client';

import { useState } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  FileText, 
  ChevronRight,
  AlertTriangle,
  Pencil,
  Trash2,
  Users,
  Copy,
  Check,
  Share2
} from 'lucide-react';

export interface CrewMember {
  id: string;
  boat_id: string;
  name: string;
  title: string;
  title_other?: string;
  phone?: string;
  email?: string;
  passport_number?: string;
  passport_expiry?: string;
  passport_country?: string;
  passport_url?: string;
  emirates_id_number?: string;
  emirates_id_expiry?: string;
  emirates_id_url?: string;
  marine_license_number?: string;
  marine_license_expiry?: string;
  marine_license_type?: string;
  marine_license_url?: string;
  notes?: string;
  status: 'active' | 'inactive';
  photo_url?: string;
  // Multi-user fields
  user_id?: string;  // Linked Clerk account
  invitation_status?: 'not_invited' | 'pending' | 'accepted';
}

interface CrewListProps {
  crew: CrewMember[];
  onView?: (member: CrewMember) => void;
  onEdit?: (member: CrewMember) => void;
  onDelete?: (member: CrewMember) => void;
  compact?: boolean;
}

const TITLE_LABELS: Record<string, string> = {
  owner: 'Owner',
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
  owner: '🚤',
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

export function CrewList({ crew, onView, onEdit, onDelete, compact = false }: CrewListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getMemberText = (member: CrewMember) => {
    return [
      member.name,
      member.title === 'other' ? member.title_other : TITLE_LABELS[member.title],
      member.phone && `Phone: ${member.phone}`,
      member.email && `Email: ${member.email}`,
    ].filter(Boolean).join('\n');
  };

  const shareMember = async (member: CrewMember) => {
    const text = getMemberText(member);
    if (navigator.share) {
      try {
        await navigator.share({
          title: member.name,
          text: text,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      setCopiedId(member.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const copyToClipboard = async (member: CrewMember) => {
    const text = getMemberText(member);
    await navigator.clipboard.writeText(text);
    setCopiedId(member.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 hover:shadow-md cursor-pointer'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md cursor-pointer'
        }`}
        onClick={() => onView?.(member)}
      >
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${
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
            {/* Invitation Status Badge */}
            {member.invitation_status === 'pending' && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
                Invited
              </span>
            )}
            {member.invitation_status === 'accepted' && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                Active
              </span>
            )}
            {hasWarning && (
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {member.title === 'other' ? member.title_other : TITLE_LABELS[member.title]}
          </p>
        </div>

        {/* Action Icons - matching Parts style */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <button
              onClick={() => onEdit(member)}
              className="p-2 text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-all"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => shareMember(member)}
            className="p-2 text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-lg transition-all"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => copyToClipboard(member)}
            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
            title="Copy"
          >
            {copiedId === member.id ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          {onDelete && (
            <button
              onClick={() => {
                if (confirm(`Delete "${member.name}"?`)) {
                  onDelete(member);
                }
              }}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {onView && (
            <ChevronRight className="w-5 h-5 text-gray-400 ml-1" />
          )}
        </div>
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
