'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useCurrency, AedSymbol } from '@/components/providers/CurrencyProvider';

export interface CostCategory {
  name: string;
  total: number;
  count: number;
  color: string;
}

export interface CostSummary {
  totalAllTime: number;
  totalThisYear: number;
  totalThisMonth: number;
  currency: string;
  byCategory: CostCategory[];
  byMonth: { month: string; total: number }[];
}

interface SpendingCardProps {
  summary: CostSummary;
  compact?: boolean;
}

// Currency symbol component
function CurrencySymbol({ className = "w-4 h-4" }: { className?: string }) {
  const { currency } = useCurrency();
  if (currency === 'AED') return <AedSymbol className={className} />;
  if (currency === 'USD') return <span className="font-semibold">$</span>;
  return <span className="font-semibold">€</span>;
}

// Format amount with proper currency symbol
function CurrencyDisplay({ amount, className = "" }: { amount: number; className?: string }) {
  const { currency } = useCurrency();
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {currency === 'AED' ? (
        <AedSymbol className="w-4 h-4 inline" />
      ) : currency === 'USD' ? (
        '$'
      ) : (
        '€'
      )}
      {formatted}
    </span>
  );
}

export function SpendingCard({ summary, compact = false }: SpendingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { totalAllTime, totalThisYear, currency, byCategory } = summary;
  
  // Calculate max for bar scaling
  const maxCategoryTotal = Math.max(...byCategory.map(c => c.total), 1);
  
  if (totalAllTime === 0) {
    return (
      <div className="text-center py-3">
        <div className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} text-gray-300 dark:text-gray-600 mx-auto mb-1`}>
          <CurrencySymbol className="w-full h-full" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-xs">No costs logged yet</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
            <CurrencySymbol className="w-4 h-4" />
          </div>
          <div>
            <p className="text-base font-bold text-gray-900 dark:text-white">
              <CurrencyDisplay amount={totalAllTime} />
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              <CurrencyDisplay amount={totalThisYear} /> this year
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Clickable Total */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
            <CurrencySymbol className="w-6 h-6" />
          </div>
          <div className="text-left">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              <CurrencyDisplay amount={totalAllTime} />
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total spent • <CurrencyDisplay amount={totalThisYear} /> this year
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
          <span className="text-sm">{expanded ? 'Hide' : 'Details'}</span>
          {expanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </button>

      {/* Expandable Breakdown */}
      {expanded && byCategory.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-2 duration-200">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 px-4">Breakdown by Category</h4>
          <div className="space-y-3 px-4">
            {byCategory.map((category) => (
              <div key={category.name} className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{category.name}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white ml-2">
                      <CurrencyDisplay amount={category.total} />
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(category.total / maxCategoryTotal) * 100}%`,
                        backgroundColor: category.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Summary stats */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 px-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{byCategory.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Categories</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {byCategory.reduce((sum, c) => sum + c.count, 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Entries</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                <CurrencyDisplay amount={totalAllTime / Math.max(byCategory.reduce((sum, c) => sum + c.count, 0), 1)} />
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg / Entry</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
