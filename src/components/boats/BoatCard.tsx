'use client';

import Link from 'next/link';
import { Ship, ChevronRight } from 'lucide-react';
import { Boat } from '@/types/database';
import { formatHours } from '@/lib/utils';

interface BoatCardProps {
  boat: Boat;
}

export function BoatCard({ boat }: BoatCardProps) {
  return (
    <Link href={`/boats/${boat.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {boat.photo_url ? (
              <img 
                src={boat.photo_url} 
                alt={boat.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Ship className="w-6 h-6 text-blue-600" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{boat.name}</h3>
              <p className="text-sm text-gray-500">
                {boat.length && `${boat.length}ft `}
                {boat.make} {boat.model}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
        
        {(boat.engines?.some(e => e.brand) || boat.generator_brand) && (
          <div className="mt-4 text-sm text-gray-600">
            {boat.engines?.some(e => e.brand) && (
              <div>
                <span className="text-gray-500">{boat.number_of_engines}x </span>
                <span>{boat.engines?.find(e => e.brand)?.brand} {boat.engines?.find(e => e.model)?.model}</span>
              </div>
            )}
            {boat.generator_brand && (
              <div>
                <span className="text-gray-500">Gen: </span>
                <span>{boat.generator_brand} {boat.generator_model}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
