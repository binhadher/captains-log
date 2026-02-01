'use client';

import { useState } from 'react';
import { FileText, Download, Trash2, Calendar, AlertTriangle, Share2, Loader2 } from 'lucide-react';
import { Document, DocumentCategory } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { formatDueIn, calculateSeverity, SEVERITY_COLORS } from '@/lib/alerts';

interface DocumentsListProps {
  documents: Document[];
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

const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  registration: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  insurance: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  berth: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  warranty: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  invoice: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  manual: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  other: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
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

export function DocumentsList({ documents, onDelete }: DocumentsListProps) {
  const [sharingId, setSharingId] = useState<string | null>(null);

  const shareFile = async (doc: Document) => {
    setSharingId(doc.id);
    try {
      // Fetch the file as blob
      const response = await fetch(doc.file_url);
      const blob = await response.blob();
      const file = new File([blob], doc.name, { type: doc.file_type || 'application/octet-stream' });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: doc.name,
        });
      } else {
        // Fallback: download the file
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = doc.name;
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } catch (err) {
      // User cancelled share or error occurred
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    } finally {
      setSharingId(null);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">No documents uploaded yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Upload registration, insurance, berth contracts and more
        </p>
      </div>
    );
  }

  // Group by category
  const grouped = documents.reduce((acc, doc) => {
    const cat = doc.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, docs]) => (
        <div key={category}>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs ${CATEGORY_COLORS[category as DocumentCategory]}`}>
              {CATEGORY_LABELS[category as DocumentCategory] || category}
            </span>
            <span className="text-gray-400">({docs.length})</span>
          </h4>
          
          <div className="space-y-2">
            {docs.map((doc) => {
              const expiryInfo = getExpiryInfo(doc.expiry_date);
              const severityColors = expiryInfo ? SEVERITY_COLORS[expiryInfo.severity] : null;
              
              return (
                <div 
                  key={doc.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{doc.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(doc.file_size)}
                        {doc.notes && ` • ${doc.notes}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-2">
                    {expiryInfo && (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${severityColors?.bg} ${severityColors?.text}`}>
                        {expiryInfo.severity === 'overdue' || expiryInfo.severity === 'urgent' ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <Calendar className="w-3 h-3" />
                        )}
                        {expiryInfo.text}
                      </div>
                    )}
                    
                    <a 
                      href={doc.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => shareFile(doc)}
                      disabled={sharingId === doc.id}
                      className="p-1.5 text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors disabled:opacity-50"
                      title="Share"
                    >
                      {sharingId === doc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>
                    
                    {onDelete && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${doc.name}"?`)) {
                            onDelete(doc.id);
                          }
                        }}
                        className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
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
        </div>
      ))}
    </div>
  );
}
