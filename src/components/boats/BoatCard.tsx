'use client';

import Link from 'next/link';
import { ChevronRight, Anchor } from 'lucide-react';
import { Boat } from '@/types/database';

interface BoatCardProps {
  boat: Boat;
  index?: number;
}

export function BoatCard({ boat, index = 0 }: BoatCardProps) {
  // Calculate stagger delay (max 6 items)
  const staggerClass = index < 6 ? `animate-stagger-${index + 1}` : '';
  
  return (
    <Link href={`/boats/${boat.id}`}>
      <div className={`glass-card glass-card-interactive rounded-xl p-4 hover:scale-[1.01] transition-all cursor-pointer group animate-slide-in-up animate-fill-both ${staggerClass}`}>
        <div className="flex items-center gap-3">
          {boat.photo_url ? (
            <img 
              src={boat.photo_url} 
              alt={boat.name}
              className="w-12 h-12 rounded-lg object-cover shadow"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow">
              <Anchor className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">
              {boat.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {boat.length && `${boat.length}ft `}
              {boat.make} {boat.model}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}
