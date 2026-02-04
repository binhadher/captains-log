'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'AED' | 'USD' | 'EUR';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatAmount: (amount: number) => string;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  AED: '', // We'll use SVG icon
  USD: '$',
  EUR: '€',
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('AED');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('currency') as Currency | null;
    if (saved && ['AED', 'USD', 'EUR'].includes(saved)) {
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const symbol = CURRENCY_SYMBOLS[currency];

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount, symbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  // Provide safe default during SSR/hydration
  if (context === undefined) {
    return {
      currency: 'AED' as Currency,
      setCurrency: () => {},
      formatAmount: (amount: number) => amount.toLocaleString(),
      symbol: '',
    };
  }
  return context;
}

// AED Symbol SVG Component (official UAE Dirham symbol - D with two horizontal lines)
export function AedSymbol({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
      aria-label="AED"
    >
      {/* D shape */}
      <path d="M6 4h6c4.418 0 8 3.582 8 8s-3.582 8-8 8H6V4zm3 3v10h3c2.761 0 5-2.239 5-5s-2.239-5-5-5H9z" />
      {/* Two horizontal lines through */}
      <rect x="2" y="9" width="20" height="2" rx="1" />
      <rect x="2" y="13" width="20" height="2" rx="1" />
    </svg>
  );
}

// Currency display component
export function CurrencyAmount({ 
  amount, 
  className = "" 
}: { 
  amount: number; 
  className?: string;
}) {
  const { currency, formatAmount } = useCurrency();
  
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {currency === 'AED' ? (
        <AedSymbol className="w-4 h-4" />
      ) : currency === 'USD' ? (
        '$'
      ) : (
        '€'
      )}
      {formatAmount(amount)}
    </span>
  );
}
