'use client';

import { Package, Copy, Check } from 'lucide-react';
import { Part } from '@/types/database';
import { useState } from 'react';

interface PartsListProps {
  parts: Part[];
  showComponent?: boolean;
}

export function PartsList({ parts, showComponent = true }: PartsListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (part: Part) => {
    const text = [
      part.name,
      part.brand && `Brand: ${part.brand}`,
      part.part_number && `Part #: ${part.part_number}`,
      part.size_specs && `Size/Specs: ${part.size_specs}`,
      part.supplier && `Supplier: ${part.supplier}`,
      part.notes && `Notes: ${part.notes}`,
    ].filter(Boolean).join('\n');

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
    <div className="space-y-3">
      {parts.map((part) => (
        <div key={part.id} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          {/* Photo */}
          {part.photo_url ? (
            <a href={part.photo_url} target="_blank" rel="noopener noreferrer">
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
              <button
                onClick={() => copyToClipboard(part)}
                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                title="Copy details"
              >
                {copiedId === part.id ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
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
            </div>
            
            {part.notes && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 italic">{part.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
