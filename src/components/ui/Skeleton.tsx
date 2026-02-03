'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'heading' | 'avatar' | 'button' | 'card' | 'custom';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ 
  className, 
  variant = 'text',
  width,
  height 
}: SkeletonProps) {
  const variantClasses = {
    text: 'skeleton skeleton-text',
    heading: 'skeleton skeleton-heading',
    avatar: 'skeleton skeleton-avatar',
    button: 'skeleton skeleton-button',
    card: 'skeleton skeleton-card',
    custom: 'skeleton',
  };

  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <div 
      className={cn(variantClasses[variant], className)}
      style={style}
    />
  );
}

// Boat Detail Page Skeleton
export function BoatDetailSkeleton() {
  return (
    <div className="min-h-screen bg-dubai">
      {/* Header Skeleton */}
      <header className="glass-header sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Skeleton variant="custom" className="w-9 h-9 rounded-lg" />
              <div>
                <Skeleton variant="text" width={120} />
                <Skeleton variant="text" width={80} height={12} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton variant="custom" className="w-8 h-8 rounded-lg" />
              <Skeleton variant="custom" className="w-8 h-8 rounded-lg" />
              <Skeleton variant="button" width={80} />
              <Skeleton variant="avatar" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* Boat Info Card Skeleton */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <Skeleton variant="heading" width={140} />
            <Skeleton variant="custom" className="w-8 h-8 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton variant="text" width={60} height={10} className="mb-1" />
                <Skeleton variant="text" width={80} />
              </div>
            ))}
          </div>
        </div>

        {/* Engines Card Skeleton */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <Skeleton variant="heading" width={100} />
            <Skeleton variant="custom" className="w-8 h-8 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-3">
                <Skeleton variant="text" width={80} height={10} className="mb-2" />
                <Skeleton variant="text" width={140} />
              </div>
            ))}
          </div>
        </div>

        {/* Components Section Skeleton */}
        <ComponentListSkeleton />

        {/* Parts Catalog Skeleton */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <Skeleton variant="heading" width={130} />
            <Skeleton variant="button" width={100} />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
                <Skeleton variant="avatar" />
                <div className="flex-1">
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" height={12} />
                </div>
                <Skeleton variant="custom" className="w-16 h-6 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Documents Skeleton */}
        <DocumentsListSkeleton />
      </main>
    </div>
  );
}

// Component List Skeleton
export function ComponentListSkeleton() {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <Skeleton variant="heading" width={180} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
            <Skeleton variant="custom" className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <Skeleton variant="text" width="70%" />
              <Skeleton variant="text" width="50%" height={12} />
            </div>
            <Skeleton variant="custom" className="w-5 h-5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Documents List Skeleton
export function DocumentsListSkeleton() {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <Skeleton variant="heading" width={140} />
        <Skeleton variant="button" width={90} />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
            <Skeleton variant="custom" className="w-10 h-10 rounded-lg" />
            <div className="flex-1">
              <Skeleton variant="text" width="50%" />
              <Skeleton variant="text" width="30%" height={12} />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton variant="custom" className="w-16 h-5 rounded-full" />
              <Skeleton variant="custom" className="w-8 h-8 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Health Check List Skeleton
export function HealthCheckListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
          <Skeleton variant="custom" className="w-8 h-8 rounded-full" />
          <div className="flex-1">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" height={12} />
          </div>
          <Skeleton variant="custom" className="w-20 h-6 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// Parts List Skeleton
export function PartsListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
          <Skeleton variant="custom" className="w-12 h-12 rounded-lg" />
          <div className="flex-1">
            <Skeleton variant="text" width="55%" />
            <Skeleton variant="text" width="35%" height={12} />
          </div>
          <div className="text-right">
            <Skeleton variant="text" width={60} />
            <Skeleton variant="text" width={40} height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Crew List Skeleton
export function CrewListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
          <Skeleton variant="avatar" className="w-12 h-12" />
          <div className="flex-1">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" height={12} />
          </div>
          <Skeleton variant="custom" className="w-16 h-6 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// Alerts List Skeleton
export function AlertsListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-amber-50/50 dark:bg-amber-900/20 rounded-lg">
          <Skeleton variant="custom" className="w-8 h-8 rounded-full bg-amber-200/50 dark:bg-amber-800/50" />
          <div className="flex-1">
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="45%" height={12} />
          </div>
          <Skeleton variant="custom" className="w-24 h-6 rounded" />
        </div>
      ))}
    </div>
  );
}

// Costs Page Skeleton
export function CostsPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-teal-500 to-blue-600">
      {/* Header Skeleton */}
      <header className="glass-header sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Skeleton variant="custom" className="w-9 h-9 rounded-lg" />
              <div>
                <Skeleton variant="text" width={140} />
                <Skeleton variant="text" width={100} height={12} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton variant="custom" className="w-8 h-8 rounded-lg" />
              <Skeleton variant="custom" className="w-8 h-8 rounded-lg" />
              <Skeleton variant="avatar" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card rounded-xl p-4">
              <Skeleton variant="text" width={60} height={10} className="mb-2" />
              <Skeleton variant="heading" width={80} />
            </div>
          ))}
        </div>

        {/* Chart Area */}
        <div className="glass-card rounded-xl p-4">
          <Skeleton variant="heading" width={140} className="mb-4" />
          <div className="h-48 flex items-end justify-between gap-2">
            {[60, 80, 45, 90, 55, 70].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end h-full">
                <Skeleton variant="custom" className="w-full rounded-t" height={`${h}%`} />
              </div>
            ))}
          </div>
        </div>

        {/* Component Breakdown */}
        <div className="glass-card rounded-xl p-4">
          <Skeleton variant="heading" width={160} className="mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton variant="custom" className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton variant="text" width="50%" className="mb-1" />
                  <Skeleton variant="text" width="30%" height={10} />
                </div>
                <Skeleton variant="text" width={60} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// Component Detail Page Skeleton
export function ComponentDetailSkeleton() {
  return (
    <div className="min-h-screen bg-dubai">
      {/* Header Skeleton */}
      <header className="glass-header sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Skeleton variant="custom" className="w-9 h-9 rounded-lg" />
              <div>
                <Skeleton variant="text" width={140} />
                <Skeleton variant="text" width={80} height={12} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton variant="custom" className="w-8 h-8 rounded-lg" />
              <Skeleton variant="custom" className="w-8 h-8 rounded-lg" />
              <Skeleton variant="button" width={90} />
              <Skeleton variant="button" width={90} />
              <Skeleton variant="avatar" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Component Info Skeleton */}
        <div className="glass-card rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <Skeleton variant="heading" width={80} />
            <Skeleton variant="text" width={100} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton variant="text" width={60} height={10} className="mb-1" />
                <Skeleton variant="text" width={90} />
              </div>
            ))}
          </div>
        </div>

        {/* Parts Skeleton */}
        <div className="glass-card rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <Skeleton variant="heading" width={100} />
            <Skeleton variant="button" width={80} />
          </div>
          <PartsListSkeleton />
        </div>

        {/* Maintenance History Skeleton */}
        <div className="glass-card rounded-xl p-4">
          <Skeleton variant="heading" width={160} className="mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <Skeleton variant="text" width="40%" className="mb-1" />
                    <Skeleton variant="text" width={80} height={12} />
                  </div>
                  <Skeleton variant="custom" className="w-16 h-6 rounded" />
                </div>
                <Skeleton variant="text" width="80%" height={12} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// Dashboard/Home Page Skeleton
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-dubai">
      {/* Header Skeleton */}
      <header className="glass-header sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Skeleton variant="heading" width={160} />
            <div className="flex items-center gap-2">
              <Skeleton variant="custom" className="w-8 h-8 rounded-lg" />
              <Skeleton variant="custom" className="w-8 h-8 rounded-lg" />
              <Skeleton variant="avatar" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* Stats Summary Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card rounded-xl p-4">
              <Skeleton variant="text" width={60} height={12} className="mb-2" />
              <Skeleton variant="heading" width={80} />
            </div>
          ))}
        </div>

        {/* Boats List Skeleton */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="heading" width={120} />
            <Skeleton variant="button" width={120} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4">
                <div className="flex items-start gap-4">
                  <Skeleton variant="custom" className="w-16 h-16 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton variant="heading" width="60%" />
                    <Skeleton variant="text" width="40%" />
                    <div className="flex gap-2 mt-2">
                      <Skeleton variant="custom" className="w-16 h-5 rounded-full" />
                      <Skeleton variant="custom" className="w-20 h-5 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
