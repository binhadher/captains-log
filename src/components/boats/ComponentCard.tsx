'use client';

import Link from 'next/link';
import { 
  Cog, 
  Gauge, 
  Wind, 
  Anchor,
  ChevronRight,
  Clock,
  Calendar,
  Battery,
  Pencil,
  Circle
} from 'lucide-react';
import { BoatComponent } from '@/types/database';
import { formatDate } from '@/lib/utils';

// Health status calculation
type HealthStatus = 'warning' | 'overdue' | 'unknown';

function getHealthStatus(component: BoatComponent): { status: HealthStatus; label: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check date-based service
  // Only show badge when action needed: <= 30 days = warning, < 0 = overdue
  if (component.next_service_date) {
    const serviceDate = new Date(component.next_service_date);
    const daysUntil = Math.ceil((serviceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) {
      return { status: 'overdue', label: `${Math.abs(daysUntil)}d overdue` };
    } else if (daysUntil <= 30) {
      return { status: 'warning', label: daysUntil <= 7 ? `Due in ${daysUntil}d` : `${daysUntil}d` };
    }
    // > 30 days = no badge needed
  }
  
  // Check hours-based service
  // Only show badge when action needed: <= 50 hours = warning, < 0 = overdue
  if (component.next_service_hours && component.current_hours !== undefined) {
    const hoursUntil = component.next_service_hours - component.current_hours;
    
    if (hoursUntil < 0) {
      return { status: 'overdue', label: `${Math.abs(hoursUntil)}h overdue` };
    } else if (hoursUntil <= 50) {
      return { status: 'warning', label: `${hoursUntil}h left` };
    }
    // > 50 hours = no badge needed
  }
  
  // No badge: either no service schedule, or service is far out
  return { status: 'unknown', label: '' };
}

const HEALTH_COLORS: Record<HealthStatus, string> = {
  warning: 'text-amber-500',
  overdue: 'text-red-500',
  unknown: 'text-gray-300 dark:text-gray-600',
};

interface ComponentCardProps {
  component: BoatComponent;
  boatId: string;
  onEdit?: (component: BoatComponent) => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  engine: <Cog className="w-5 h-5" />,
  inboard_engine: <Cog className="w-5 h-5" />,
  outboard_engine: <Cog className="w-5 h-5" />,
  drive_pod: <Cog className="w-5 h-5" />,
  generator: <Gauge className="w-5 h-5" />,
  shaft: <Anchor className="w-5 h-5" />,
  propeller: <Anchor className="w-5 h-5" />,
  hydraulic: <Cog className="w-5 h-5" />,
  bow_thruster: <Anchor className="w-5 h-5" />,
  stern_thruster: <Anchor className="w-5 h-5" />,
  ac_chiller: <Wind className="w-5 h-5" />,
  ac_air_handler: <Wind className="w-5 h-5" />,
  engine_battery: <Battery className="w-5 h-5" />,
  generator_battery: <Battery className="w-5 h-5" />,
  house_battery: <Battery className="w-5 h-5" />,
  thruster_battery: <Battery className="w-5 h-5" />,
};

const TYPE_COLORS: Record<string, string> = {
  engine: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  inboard_engine: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  outboard_engine: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  drive_pod: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  generator: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  shaft: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  propeller: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  hydraulic: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  bow_thruster: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  stern_thruster: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  ac_chiller: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
  ac_air_handler: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
  engine_battery: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  generator_battery: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  house_battery: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  thruster_battery: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
};

// Check if component is a battery type
const isBatteryType = (type: string) => type.includes('battery');

export function ComponentCard({ component, boatId, onEdit }: ComponentCardProps) {
  const icon = TYPE_ICONS[component.type] || <Cog className="w-5 h-5" />;
  const colorClass = TYPE_COLORS[component.type] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  const isBattery = isBatteryType(component.type);
  const health = getHealthStatus(component);

  // Calculate battery age if it's a battery with install date
  const getBatteryAge = () => {
    if (!isBattery || !component.install_date) return null;
    const installed = new Date(component.install_date);
    const now = new Date();
    const months = Math.floor((now.getTime() - installed.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years > 0) {
      return `${years}y ${remainingMonths}m old`;
    }
    return `${months}m old`;
  };

  const batteryAge = getBatteryAge();

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm transition-all">
      <div className="flex items-center justify-between">
        <Link href={`/boats/${boatId}/components/${component.id}`} className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
              {icon}
            </div>
            {/* Health badge */}
            {health.status !== 'unknown' && (
              <div className={`absolute -top-1 -right-1 ${HEALTH_COLORS[health.status]}`} title={health.label}>
                <Circle className="w-3 h-3 fill-current" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-medium text-gray-900 dark:text-white truncate">{component.name}</h4>
            {(component.brand || component.model) && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {[component.brand, component.model].filter(Boolean).join(' ')}
              </p>
            )}
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {/* Show hours for engines/generators */}
          {component.current_hours !== undefined && component.current_hours > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Hours</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {component.current_hours.toLocaleString()}
              </p>
            </div>
          )}
          {/* Show install date / age for batteries */}
          {isBattery && (
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Installed</p>
              {component.install_date ? (
                <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {batteryAge || formatDate(component.install_date)}
                </p>
              ) : (
                <p className="text-xs text-amber-500 italic">Not set</p>
              )}
            </div>
          )}
          {/* Edit button */}
          {onEdit && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(component);
              }}
              className="p-2 text-amber-500 hover:text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-all"
              title="Edit component"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          <Link href={`/boats/${boatId}/components/${component.id}`}>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
