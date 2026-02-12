'use client';

import { useState } from 'react';
import { 
  X, 
  Phone, 
  Mail, 
  AlertTriangle,
  Share2,
  Copy,
  Check,
  ZoomIn,
  Download,
  Pencil,
  Users,
  Loader2
} from 'lucide-react';
import { CrewMember } from './CrewList';
import { formatDate } from '@/lib/utils';

// Image Viewer Component
function ImageViewer({ 
  src, 
  title, 
  onClose,
  onShare 
}: { 
  src: string; 
  title: string; 
  onClose: () => void;
  onShare: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <h3 className="font-medium">{title}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onShare}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Share"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <a
            href={src}
            download
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Image */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <img 
          src={src} 
          alt={title} 
          className="max-w-full max-h-full object-contain rounded-lg"
          onClick={onClose}
        />
      </div>
    </div>
  );
}

interface CrewDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: CrewMember | null;
  onEdit?: (member: CrewMember) => void;
  boatId?: string;
  boatName?: string;
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

function getExpiryStatus(expiryDate?: string): { status: 'ok' | 'warning' | 'expired'; daysLeft: number; label: string } | null {
  if (!expiryDate) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  let status: 'ok' | 'warning' | 'expired' = 'ok';
  let label = '';
  
  if (daysLeft < 0) {
    status = 'expired';
    label = 'Expired';
  } else if (daysLeft <= 30) {
    status = 'warning';
    label = `${daysLeft} days left`;
  } else {
    label = formatDate(expiryDate);
  }
  
  return { status, daysLeft, label };
}

export function CrewDetailModal({ isOpen, onClose, member, onEdit, boatId, boatName }: CrewDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<{ url: string; title: string } | null>(null);

  if (!isOpen || !member) return null;

  const title = member.title === 'other' ? member.title_other : TITLE_LABELS[member.title];
  const passportStatus = getExpiryStatus(member.passport_expiry);
  const emiratesStatus = getExpiryStatus(member.emirates_id_expiry);
  const licenseStatus = getExpiryStatus(member.marine_license_expiry);

  // Build shareable text
  const buildShareText = () => {
    const lines = [
      `🚢 Crew Member: ${member.name}`,
      `📋 Position: ${title}`,
      '',
    ];

    if (member.phone) lines.push(`📞 Phone: ${member.phone}`);
    if (member.email) lines.push(`📧 Email: ${member.email}`);
    
    if (member.passport_expiry || member.emirates_id_expiry || member.marine_license_expiry) {
      lines.push('');
      lines.push('📄 Documents:');
      if (member.passport_expiry) lines.push(`  • Passport: ${formatDate(member.passport_expiry)}`);
      if (member.emirates_id_expiry) lines.push(`  • Emirates ID: ${formatDate(member.emirates_id_expiry)}`);
      if (member.marine_license_expiry) lines.push(`  • Marine License: ${formatDate(member.marine_license_expiry)}`);
    }

    return lines.join('\n');
  };

  const shareText = buildShareText();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Crew: ${member.name}`,
          text: shareText,
        });
      } else {
        await handleCopy();
      }
    } catch (err) {
      // User cancelled or share failed
    } finally {
      setSharing(false);
    }
  };

  const handleEdit = () => {
    onEdit?.(member);
    onClose();
  };

  // Check for native share support
  const hasNativeShare = typeof navigator !== 'undefined' && navigator.share;

  // Share a document image
  const handleShareDoc = async (docName: string, docUrl: string) => {
    if (hasNativeShare) {
      try {
        await navigator.share({
          title: `${member.name} - ${docName}`,
          text: `${docName}: ${docUrl}`,
          url: docUrl,
        });
      } catch (err) {
        // User cancelled or share failed - fallback to copy
        await navigator.clipboard.writeText(docUrl);
      }
    } else {
      await navigator.clipboard.writeText(docUrl);
      alert('Link copied to clipboard');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header with Action Icons */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Crew Details
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

          <div className="p-6">
            {/* Profile Section */}
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
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
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{member.name}</h3>
                <p className="text-gray-500 dark:text-gray-400">{title}</p>
                {member.status === 'inactive' && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                    Inactive
                  </span>
                )}
              </div>
            </div>

            {/* Contact Info */}
            {(member.phone || member.email) && (
              <div className="mb-6 space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Contact</h4>
                {member.phone && (
                  <a 
                    href={`tel:${member.phone}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Phone className="w-5 h-5 text-cyan-500" />
                    <span className="text-gray-900 dark:text-white">{member.phone}</span>
                  </a>
                )}
                {member.email && (
                  <a 
                    href={`mailto:${member.email}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Mail className="w-5 h-5 text-cyan-500" />
                    <span className="text-gray-900 dark:text-white">{member.email}</span>
                  </a>
                )}
              </div>
            )}

            {/* Documents */}
            {(member.passport_expiry || member.emirates_id_expiry || member.marine_license_expiry || 
              member.passport_url || member.emirates_id_url || member.marine_license_url) && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Documents</h4>
                
                {/* Passport */}
                {(member.passport_expiry || member.passport_url) && (
                  <div className={`p-3 rounded-lg ${
                    passportStatus?.status === 'expired' ? 'bg-red-50 dark:bg-red-900/20' :
                    passportStatus?.status === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20' :
                    'bg-gray-50 dark:bg-gray-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">🛂 Passport</span>
                      {passportStatus && (
                        <div className="flex items-center gap-2">
                          {(passportStatus.status === 'expired' || passportStatus.status === 'warning') && (
                            <AlertTriangle className={`w-4 h-4 ${passportStatus.status === 'expired' ? 'text-red-500' : 'text-amber-500'}`} />
                          )}
                          <span className={`text-sm font-medium ${
                            passportStatus.status === 'expired' ? 'text-red-600 dark:text-red-400' :
                            passportStatus.status === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                            'text-gray-900 dark:text-white'
                          }`}>
                            {passportStatus.label}
                          </span>
                        </div>
                      )}
                    </div>
                    {member.passport_number && (
                      <p className="text-sm text-gray-500 mt-1">#{member.passport_number} {member.passport_country && `• ${member.passport_country}`}</p>
                    )}
                    {member.passport_url && (
                      <div className="mt-2 flex items-center gap-2">
                        <button 
                          onClick={() => setViewingDoc({ url: member.passport_url!, title: 'Passport' })}
                          className="flex-1 text-left group"
                        >
                          <div className="relative">
                            <img src={member.passport_url} alt="Passport" className="h-20 w-auto rounded border object-cover group-hover:opacity-80 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <ZoomIn className="w-6 h-6 text-white drop-shadow-lg" />
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => handleShareDoc('Passport', member.passport_url!)}
                          className="p-2 text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-lg"
                          title="Share"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Emirates ID */}
                {(member.emirates_id_expiry || member.emirates_id_url) && (
                  <div className={`p-3 rounded-lg ${
                    emiratesStatus?.status === 'expired' ? 'bg-red-50 dark:bg-red-900/20' :
                    emiratesStatus?.status === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20' :
                    'bg-gray-50 dark:bg-gray-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">🪪 Emirates ID</span>
                      {emiratesStatus && (
                        <div className="flex items-center gap-2">
                          {(emiratesStatus.status === 'expired' || emiratesStatus.status === 'warning') && (
                            <AlertTriangle className={`w-4 h-4 ${emiratesStatus.status === 'expired' ? 'text-red-500' : 'text-amber-500'}`} />
                          )}
                          <span className={`text-sm font-medium ${
                            emiratesStatus.status === 'expired' ? 'text-red-600 dark:text-red-400' :
                            emiratesStatus.status === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                            'text-gray-900 dark:text-white'
                          }`}>
                            {emiratesStatus.label}
                          </span>
                        </div>
                      )}
                    </div>
                    {member.emirates_id_number && (
                      <p className="text-sm text-gray-500 mt-1">#{member.emirates_id_number}</p>
                    )}
                    {member.emirates_id_url && (
                      <div className="mt-2 flex items-center gap-2">
                        <button 
                          onClick={() => setViewingDoc({ url: member.emirates_id_url!, title: 'Emirates ID' })}
                          className="flex-1 text-left group"
                        >
                          <div className="relative">
                            <img src={member.emirates_id_url} alt="Emirates ID" className="h-20 w-auto rounded border object-cover group-hover:opacity-80 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <ZoomIn className="w-6 h-6 text-white drop-shadow-lg" />
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => handleShareDoc('Emirates ID', member.emirates_id_url!)}
                          className="p-2 text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-lg"
                          title="Share"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Marine License */}
                {(member.marine_license_expiry || member.marine_license_url) && (
                  <div className={`p-3 rounded-lg ${
                    licenseStatus?.status === 'expired' ? 'bg-red-50 dark:bg-red-900/20' :
                    licenseStatus?.status === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20' :
                    'bg-gray-50 dark:bg-gray-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">⚓ Marine License</span>
                      {licenseStatus && (
                        <div className="flex items-center gap-2">
                          {(licenseStatus.status === 'expired' || licenseStatus.status === 'warning') && (
                            <AlertTriangle className={`w-4 h-4 ${licenseStatus.status === 'expired' ? 'text-red-500' : 'text-amber-500'}`} />
                          )}
                          <span className={`text-sm font-medium ${
                            licenseStatus.status === 'expired' ? 'text-red-600 dark:text-red-400' :
                            licenseStatus.status === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                            'text-gray-900 dark:text-white'
                          }`}>
                            {licenseStatus.label}
                          </span>
                        </div>
                      )}
                    </div>
                    {(member.marine_license_number || member.marine_license_type) && (
                      <p className="text-sm text-gray-500 mt-1">
                        {member.marine_license_number && `#${member.marine_license_number}`}
                        {member.marine_license_number && member.marine_license_type && ' • '}
                        {member.marine_license_type}
                      </p>
                    )}
                    {member.marine_license_url && (
                      <div className="mt-2 flex items-center gap-2">
                        <button 
                          onClick={() => setViewingDoc({ url: member.marine_license_url!, title: 'Marine License' })}
                          className="flex-1 text-left group"
                        >
                          <div className="relative">
                            <img src={member.marine_license_url} alt="Marine License" className="h-20 w-auto rounded border object-cover group-hover:opacity-80 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <ZoomIn className="w-6 h-6 text-white drop-shadow-lg" />
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => handleShareDoc('Marine License', member.marine_license_url!)}
                          className="p-2 text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-lg"
                          title="Share"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Viewer */}
      {viewingDoc && (
        <ImageViewer
          src={viewingDoc.url}
          title={viewingDoc.title}
          onClose={() => setViewingDoc(null)}
          onShare={() => handleShareDoc(viewingDoc.title, viewingDoc.url)}
        />
      )}

    </div>
  );
}
