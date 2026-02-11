'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Home, Activity, Settings, Plus, Users, Package, Heart, FileText } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();
  const params = useParams();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Get boatId from URL if on a boat page
  const boatId = params?.id as string;

  // Don't show on auth pages
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up') || pathname.startsWith('/accept-terms')) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const quickActions = [
    {
      icon: Heart,
      label: 'Health Check',
      href: boatId ? `/boats/${boatId}?action=health` : '/',
      color: 'bg-green-500',
    },
    {
      icon: Package,
      label: 'Add Part',
      href: boatId ? `/boats/${boatId}?action=part` : '/',
      color: 'bg-blue-500',
    },
    {
      icon: FileText,
      label: 'Document',
      href: boatId ? `/boats/${boatId}?action=document` : '/',
      color: 'bg-purple-500',
    },
    {
      icon: Users,
      label: 'Add Crew',
      href: boatId ? `/boats/${boatId}?action=crew` : '/',
      color: 'bg-orange-500',
    },
  ];

  return (
    <>
      {/* Quick Add Overlay */}
      {showQuickAdd && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setShowQuickAdd(false)}
        >
          {/* Quick action buttons */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
            {quickActions.map((action, index) => (
              <Link
                key={action.label}
                href={action.href}
                onClick={() => setShowQuickAdd(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-full text-white shadow-lg transition-all transform ${action.color}`}
                style={{ 
                  animation: `slideUp 0.2s ease-out ${index * 0.05}s both`
                }}
              >
                <action.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 md:hidden">
        <div className="flex items-center justify-around h-16 px-4">
          {/* Home */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive('/')
                ? 'text-teal-600 dark:text-teal-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Home className={`w-6 h-6 ${isActive('/') ? 'stroke-[2.5px]' : ''}`} />
            <span className={`text-xs mt-1 ${isActive('/') ? 'font-semibold' : 'font-medium'}`}>
              Home
            </span>
          </Link>

          {/* Activity */}
          <Link
            href="/activity"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive('/activity')
                ? 'text-teal-600 dark:text-teal-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Activity className={`w-6 h-6 ${isActive('/activity') ? 'stroke-[2.5px]' : ''}`} />
            <span className={`text-xs mt-1 ${isActive('/activity') ? 'font-semibold' : 'font-medium'}`}>
              Activity
            </span>
          </Link>

          {/* Add Button */}
          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              showQuickAdd
                ? 'text-teal-600 dark:text-teal-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Plus className={`w-6 h-6 ${showQuickAdd ? 'stroke-[2.5px]' : ''}`} />
            <span className={`text-xs mt-1 ${showQuickAdd ? 'font-semibold' : 'font-medium'}`}>
              Add
            </span>
          </button>

          {/* Settings */}
          <Link
            href="/settings"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive('/settings')
                ? 'text-teal-600 dark:text-teal-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Settings className={`w-6 h-6 ${isActive('/settings') ? 'stroke-[2.5px]' : ''}`} />
            <span className={`text-xs mt-1 ${isActive('/settings') ? 'font-semibold' : 'font-medium'}`}>
              Settings
            </span>
          </Link>
        </div>
      </nav>

      {/* CSS for animation */}
      <style jsx global>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
