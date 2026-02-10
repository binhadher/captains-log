'use client';

import { useState } from 'react';
import { FileText, Download, Trash2, Calendar, AlertTriangle, Share2, Loader2, Pencil, CheckSquare, Square, X } from 'lucide-react';
import { Document, DocumentCategory } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { formatDueIn, calculateSeverity, SEVERITY_COLORS } from '@/lib/alerts';
import { shareContent, buildDocumentShareText } from '@/lib/share';

interface DocumentsListProps {
  documents: Document[];
  onView?: (doc: Document) => void;
  onEdit?: (doc: Document) => void;
  onDelete?: (docId: string) => void;
  onBulkDelete?: (docIds: string[]) => Promise<void>;
  maxHeight?: string;
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

export function DocumentsList({ documents, onView, onEdit, onDelete, onBulkDelete, maxHeight = "260px" }: DocumentsListProps) {
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Sort documents by uploaded_at (most recent first)
  const sortedDocuments = [...documents].sort((a, b) => {
    const dateA = new Date(a.uploaded_at || 0).getTime();
    const dateB = new Date(b.uploaded_at || 0).getTime();
    return dateB - dateA;
  });

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedDocs);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedDocs(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedDocs.size === documents.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(documents.map(d => d.id)));
    }
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedDocs(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedDocs.size === 0) return;
    if (!confirm(`Delete ${selectedDocs.size} document${selectedDocs.size > 1 ? 's' : ''}?`)) return;

    setBulkDeleting(true);
    try {
      if (onBulkDelete) {
        await onBulkDelete(Array.from(selectedDocs));
      } else if (onDelete) {
        // Delete all items sequentially
        const idsToDelete = Array.from(selectedDocs);
        for (const id of idsToDelete) {
          try {
            await onDelete(id);
          } catch (err) {
            console.error('Error deleting document:', id, err);
          }
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
    if (selectedDocs.size === 0) return;
    
    const selectedDocsList = documents.filter(d => selectedDocs.has(d.id));
    
    try {
      // Try to share multiple files
      const files = await Promise.all(
        selectedDocsList.map(async (doc) => {
          const response = await fetch(doc.file_url);
          const blob = await response.blob();
          return new File([blob], doc.name, { type: doc.file_type || 'application/octet-stream' });
        })
      );

      if (navigator.share && navigator.canShare({ files })) {
        await navigator.share({
          files,
          title: `${selectedDocs.size} documents`,
        });
      } else {
        // Fallback: download files
        for (const file of files) {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(file);
          a.download = file.name;
          a.click();
          URL.revokeObjectURL(a.href);
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  };

  const shareFile = async (doc: Document) => {
    setSharingId(doc.id);
    try {
      const text = buildDocumentShareText(doc);
      await shareContent({
        title: doc.name,
        text,
        fileUrl: doc.file_url,
        fileName: doc.name,
        fileType: doc.file_type || 'application/octet-stream',
      });
    } catch (err) {
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
  const grouped = sortedDocuments.reduce((acc, doc) => {
    const cat = doc.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  return (
    <div className="relative">
      {/* Select mode toggle */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
          className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
            selectMode 
              ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {selectMode ? 'Cancel' : 'Select'}
        </button>
      </div>

      <div 
        className="space-y-4 overflow-y-auto pr-1"
        style={{ maxHeight }}
      >
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
                const isSelected = selectedDocs.has(doc.id);
                
                return (
                  <div 
                    key={doc.id} 
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700' 
                        : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => {
                      if (selectMode) {
                        toggleSelection(doc.id);
                      } else if (onView) {
                        onView(doc);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Checkbox in select mode */}
                      {selectMode && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSelection(doc.id); }}
                          className="flex-shrink-0 text-teal-600 dark:text-teal-400"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      )}
                      
                      <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{doc.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(doc.file_size)}
                          {doc.uploaded_at && ` • ${new Date(doc.uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                          {doc.notes && ` • ${doc.notes}`}
                        </p>
                      </div>
                    </div>
                    
                    {!selectMode && (
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
                        
                        {onEdit && (
                          <button
                            onClick={() => onEdit(doc)}
                            className="p-1.5 text-amber-500 hover:text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
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
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Bar for Multi-Select */}
      {selectMode && selectedDocs.size > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-50 px-4 animate-slide-up">
          <div className="max-w-md mx-auto bg-gray-900 dark:bg-gray-800 text-white rounded-2xl shadow-2xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title={selectedDocs.size === documents.length ? "Deselect all" : "Select all"}
              >
                {selectedDocs.size === documents.length ? (
                  <CheckSquare className="w-5 h-5 text-teal-400" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </button>
              <span className="text-sm font-medium">{selectedDocs.size} selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkShare}
                className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors text-sm font-medium"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
              >
                {bulkDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
              <button
                onClick={exitSelectMode}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
