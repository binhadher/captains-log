'use client';

import Link from 'next/link';
import { 
  Cog, 
  Gauge, 
  Wind, 
  Anchor,
  ChevronRight,
  Clock
} from 'lucide-react';
import { BoatComponent } from '@/types/database';

interface ComponentCardProps {
  component: BoatComponent;
  boatId: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  engine: <Cog className="w-5 h-5" />,
  generator: <Gauge className="w-5 h-5" />,
  shaft: <Anchor className="w-5 h-5" />,
  propeller: <Anchor className="w-5 h-5" />,
  hydraulic: <Cog className="w-5 h-5" />,
  bow_thruster: <Anchor className="w-5 h-5" />,
  ac_chiller: <Wind className="w-5 h-5" />,
  ac_air_handler: <Wind className="w-5 h-5" />,
};

const TYPE_COLORS: Record<string, string> = {
  engine: 'bg-orange-100 text-orange-600',
  generator: 'bg-yellow-100 text-yellow-600',
  shaft: 'bg-blue-100 text-blue-600',
  propeller: 'bg-blue-100 text-blue-600',
  hydraulic: 'bg-purple-100 text-purple-600',
  bow_thruster: 'bg-cyan-100 text-cyan-600',
  ac_chiller: 'bg-sky-100 text-sky-600',
  ac_air_handler: 'bg-sky-100 text-sky-600',
};

export function ComponentCard({ component, boatId }: ComponentCardProps) {
  const icon = TYPE_ICONS[component.type] || <Cog className="w-5 h-5" />;
  const colorClass = TYPE_COLORS[component.type] || 'bg-gray-100 text-gray-600';

  return (
    <Link href={`/boats/${boatId}/components/${component.id}`}>
      <div className="bg-white dark:bg-gray-100 rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
              {icon}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{component.name}</h4>
              {(component.brand || component.model) && (
                <p className="text-sm text-gray-500">
                  {[component.brand, component.model].filter(Boolean).join(' ')}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {component.current_hours !== undefined && component.current_hours > 0 && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Hours</p>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {component.current_hours.toLocaleString()}
                </p>
              </div>
            )}
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>
    </Link>
  );
}
