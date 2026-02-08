'use client';

import { Package, Copy, Check, Pencil, Trash2, Calendar, Share2, CheckSquare, Square, X, Loader2 } from 'lucide-react';
import { Part } from '@/types/database';
import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface PartsListProps {
  parts: Part[];
  showComponent?: boolean;
  onView?: (part: Part) => void;
  onEdit?: (part: Part) => void;
  onDelete?: (part: Part) => void;
  onBulkDelete?: (parts: Part[]) => Promise<void>;
}

export function PartsList({ parts, showComponent = true, onView, onEdit, onDelete, onBulkDelete }: PartsListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedParts);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedParts(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedParts.size === parts.length) {
      setSelectedParts(new Set());
    } else {
      setSelectedParts(new Set(parts.map(p => p.id)));
    }
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedParts(new Set());
  };

  const getPartText = (part: Part) => {
    return [
      part.name,
      part.brand && `Brand: ${part.brand}`,
      part.part_number && `Part #: ${part.part_number}`,
      part.size_specs && `Size/Specs: ${part.size_specs}`,
      part.supplier && `Supplier: ${part.supplier}`,
      part.install_date && `Installed: ${formatDate(part.install_date)}`,
      part.notes && `Notes: ${part.notes}`,
    ].filter(Boolean).join('\n');
  };

  const handleBulkDelete = async () => {
    if (selectedParts.size === 0) return;
    if (!confirm(`Delete ${selectedParts.size} part${selectedParts.size > 1 ? 's' : ''}?`)) return;

    setBulkDeleting(true);
    try {
      const partsToDelete = parts.filter(p => selectedParts.has(p.id));
      if (onBulkDelete) {
        await onBulkDelete(partsToDelete);
      } else if (onDelete) {
        for (const part of partsToDelete) {
          try {
            await onDelete(part);
          } catch (err) {
            console.error('Error deleting part:', part.id, err);
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
    if (selectedParts.size === 0) return;
    
    const selectedPartsList = parts.filter(p => selectedParts.has(p.id));
    const text = selectedPartsList.map(getPartText).join('\n\n---\n\n');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${selectedParts.size} Parts`,
          text: text,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const sharePart = async (part: Part) => {
    const text = getPartText(part);
    if (navigator.share) {
      try {
        await navigator.share({
          title: part.name,
          text: text,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      setCopiedId(part.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const copyToClipboard = async (part: Part) => {
    const text = getPartText(part);
    await navigator.clipboard.writeText(text);
    setCopiedId(part.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (parts.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">No parts added yet</p>
      </div>
    );
  }

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

      <div className="space-y-3">
        {parts.map((part) => {
          const isSelected = selectedParts.has(part.id);
          
          return (
            <div 
              key={part.id} 
              className={`flex gap-4 p-4 rounded-lg transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700'
                  : 'bg-gray-50 dark:bg-gray-800/50'
              }`}
              onClick={() => {
                if (selectMode) {
                  toggleSelection(part.id);
                } else if (onView) {
                  onView(part);
                }
              }}
            >
              {/* Checkbox in select mode */}
              {selectMode && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSelection(part.id); }}
                  className="flex-shrink-0 text-teal-600 dark:text-teal-400 self-center"
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
              )}

              {/* Photo */}
              {part.photo_url ? (
                <a href={part.photo_url} target="_blank" rel="noopener noreferrer" onClick={(e) => selectMode && e.preventDefault()}>
                  <img 
                    src={part.photo_url} 
                    alt={part.name}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700 flex-shrink-0"
                  />
                </a>
              ) : (
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
              )}

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{part.name}</h4>
                    {showComponent && part.component_name && (
                      <p className="text-xs text-blue-600 dark:text-blue-400">{part.component_name}</p>
                    )}
                  </div>
                  {!selectMode && (
                    <div className="flex items-center gap-1">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(part)}
                          className="p-2 text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-all"
                          title="Edit part"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => sharePart(part)}
                        className="p-2 text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-lg transition-all"
                        title="Share"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => copyToClipboard(part)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                        title="Copy"
                      >
                        {copiedId === part.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      {onDelete && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${part.name}"?`)) {
                              onDelete(part);
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                          title="Delete part"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {part.brand && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Brand: </span>
                      <span className="text-gray-900 dark:text-white">{part.brand}</span>
                    </div>
                  )}
                  {part.part_number && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Part #: </span>
                      <span className="text-gray-900 dark:text-white font-mono">{part.part_number}</span>
                    </div>
                  )}
                  {part.size_specs && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Size: </span>
                      <span className="text-gray-900 dark:text-white">{part.size_specs}</span>
                    </div>
                  )}
                  {part.supplier && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Supplier: </span>
                      <span className="text-gray-900 dark:text-white">{part.supplier}</span>
                    </div>
                  )}
                  {part.install_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-500 dark:text-gray-400">Installed: </span>
                      <span className="text-gray-900 dark:text-white">{formatDate(part.install_date)}</span>
                    </div>
                  )}
                </div>
                
                {part.notes && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 italic">{part.notes}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Bar for Multi-Select */}
      {selectMode && selectedParts.size > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-50 px-4 animate-slide-up">
          <div className="max-w-md mx-auto bg-gray-900 dark:bg-gray-800 text-white rounded-2xl shadow-2xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title={selectedParts.size === parts.length ? "Deselect all" : "Select all"}
              >
                {selectedParts.size === parts.length ? (
                  <CheckSquare className="w-5 h-5 text-teal-400" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </button>
              <span className="text-sm font-medium">{selectedParts.size} selected</span>
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
