'use client';

import { useState } from 'react';
import { Plus, X, Wrench, Package, Activity, FileText } from 'lucide-react';
import Link from 'next/link';

interface FABProps {
  boatId: string;
}

export function FAB({ boatId }: FABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      icon: Wrench,
      label: 'Log Maintenance',
      href: `/boats/${boatId}/maintenance/new`,
      color: 'bg-orange-500 hover:bg-orange-600',
    },
    {
      icon: Activity,
      label: 'Quick Health Check',
      href: `/boats/${boatId}#health`,
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      icon: Package,
      label: 'Add Part',
      href: `/boats/${boatId}#parts`,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      icon: FileText,
      label: 'Upload Document',
      href: `/boats/${boatId}#documents`,
      color: 'bg-purple-500 hover:bg-purple-600',
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col-reverse items-end gap-3">
      {/* Action buttons */}
      {isOpen && (
        <div className="flex flex-col-reverse gap-2 mb-2 animate-fade-in">
          {actions.map((action, index) => (
            <Link
              key={action.label}
              href={action.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 pl-4 pr-3 py-2 rounded-full text-white shadow-lg transition-all animate-slide-in-up ${action.color}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
              <action.icon className="w-5 h-5" />
            </Link>
          ))}
        </div>
      )}

      {/* Main FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          isOpen 
            ? 'bg-gray-700 hover:bg-gray-800 rotate-45' 
            : 'bg-teal-600 hover:bg-teal-700'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Plus className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  );
}
