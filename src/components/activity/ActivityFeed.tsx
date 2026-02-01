'use client';

import { Wrench, Activity, FileText, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export interface ActivityItem {
  id: string;
  type: 'maintenance' | 'health_check' | 'document';
  title: string;
  description?: string;
  date: string;
  boatId: string;
  boatName: string;
  componentId?: string;
  componentName?: string;
  cost?: number;
  currency?: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  showBoatName?: boolean;
  compact?: boolean;
}

const TYPE_CONFIG = {
  maintenance: {
    icon: Wrench,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
  },
  health_check: {
    icon: Activity,
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-900/30',
  },
  document: {
    icon: FileText,
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/30',
  },
};

function formatCost(cost: number, currency: string = 'AED'): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cost);
}

export function ActivityFeed({ items, showBoatName = true, compact = false }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className={`text-center ${compact ? 'py-3' : 'py-8'}`}>
        <Activity className={`${compact ? 'w-6 h-6' : 'w-10 h-10'} text-gray-300 dark:text-gray-600 mx-auto mb-2`} />
        <p className="text-gray-500 dark:text-gray-400 text-xs">No recent activity</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-1.5">
        {items.map((item) => {
          const config = TYPE_CONFIG[item.type];
          const Icon = config.icon;
          const link = item.componentId 
            ? `/boats/${item.boatId}/components/${item.componentId}`
            : `/boats/${item.boatId}`;

          return (
            <Link 
              key={item.id} 
              href={link} 
              className="flex items-center gap-2 p-1.5 rounded hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className={`flex h-5 w-5 items-center justify-center rounded-full ${config.bg}`}>
                <Icon className={`h-3 w-3 ${config.color}`} />
              </div>
              <p className="text-xs text-gray-900 dark:text-white truncate flex-1">{item.title}</p>
              <time className="text-[10px] text-gray-400 dark:text-gray-400 whitespace-nowrap">
                {formatDistanceToNow(new Date(item.date), { addSuffix: true }).replace('about ', '')}
              </time>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-4">
        {items.map((item, index) => {
          const config = TYPE_CONFIG[item.type];
          const Icon = config.icon;
          const isLast = index === items.length - 1;
          
          const link = item.componentId 
            ? `/boats/${item.boatId}/components/${item.componentId}`
            : `/boats/${item.boatId}`;

          return (
            <li key={item.id}>
              <div className="relative pb-4">
                {/* Timeline line */}
                {!isLast && (
                  <span 
                    className="absolute left-4 top-8 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" 
                    aria-hidden="true" 
                  />
                )}
                
                <Link href={link} className="relative flex gap-3 group">
                  {/* Icon */}
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${config.bg} ring-4 ring-white dark:ring-gray-900`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 truncate">
                        {item.title}
                      </p>
                      {item.cost && item.cost > 0 && (
                        <span className="flex items-center text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                          <DollarSign className="w-3 h-3 mr-0.5" />
                          {formatCost(item.cost, item.currency)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {item.componentName && (
                        <>
                          <span>{item.componentName}</span>
                          <span>•</span>
                        </>
                      )}
                      {showBoatName && (
                        <>
                          <span>{item.boatName}</span>
                          <span>•</span>
                        </>
                      )}
                      <time dateTime={item.date}>
                        {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                      </time>
                    </div>
                    
                    {item.description && (
                      <p className="text-xs text-gray-400 dark:text-gray-400 mt-1 truncate">
                        {item.description}
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
