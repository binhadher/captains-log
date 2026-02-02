'use client';

import { useState, useRef, useEffect } from 'react';
import { useCurrency, Currency, AedSymbol } from '@/components/providers/CurrencyProvider';
import { DollarSign } from 'lucide-react';

// Euro symbol component
function EuroSymbol({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <span className={`font-bold ${className}`} style={{ fontSize: '1.25rem', lineHeight: 1 }}>€</span>
  );
}

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: 'AED', label: 'AED' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
];

export function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (value: Currency) => {
    setCurrency(value);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
        aria-label={`Currency: ${currency}`}
        title={`Currency: ${currency}`}
      >
        {currency === 'AED' ? (
          <AedSymbol className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        ) : currency === 'USD' ? (
          <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        ) : (
          <span className="w-5 h-5 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold">€</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[100px] z-50">
          {CURRENCY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                currency === option.value ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {option.value === 'AED' ? (
                <AedSymbol className="w-4 h-4" />
              ) : option.value === 'USD' ? (
                <DollarSign className="w-4 h-4" />
              ) : (
                <span className="w-4 h-4 flex items-center justify-center font-bold">€</span>
              )}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
