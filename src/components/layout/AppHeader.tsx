'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { Anchor, ArrowLeft, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { CurrencyToggle } from '@/components/ui/CurrencyToggle';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  backHref?: string;
  showBack?: boolean;
}

export function AppHeader({ title, subtitle, backHref, showBack = false }: AppHeaderProps) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <header className="glass-header sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left side */}
          <div className="flex items-center gap-3">
            {showBack && backHref && (
              <Link 
                href={backHref}
                className="p-2 hover:bg-gray-200 dark:hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-white" />
              </Link>
            )}
            
            {isHome ? (
              <>
                <div className="w-8 h-8 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                  <Anchor className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-bold text-white">Captain&apos;s Log</h1>
              </>
            ) : (
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                  <Anchor className="w-5 h-5 text-white" />
                </div>
                {title ? (
                  <div>
                    <h1 className="text-lg font-bold text-white leading-tight">{title}</h1>
                    {subtitle && <p className="text-xs text-white/70">{subtitle}</p>}
                  </div>
                ) : (
                  <h1 className="text-lg font-bold text-white">Captain&apos;s Log</h1>
                )}
              </Link>
            )}
          </div>

          {/* Right side - always show these */}
          <div className="flex items-center gap-2">
            <CurrencyToggle />
            <ThemeToggle />
            <Link 
              href="/settings" 
              className="p-2 bg-gray-200 dark:bg-white/20 hover:bg-gray-300 dark:hover:bg-white/30 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-gray-700 dark:text-white" />
            </Link>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </div>
    </header>
  );
}
