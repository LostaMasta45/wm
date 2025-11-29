'use client';

import React from 'react';

export function TemplateSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-3 px-4 md:px-0">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] rounded-lg overflow-hidden border-2 border-border"
        >
          <div className="aspect-[3/4] bg-muted animate-pulse" />
          <div className="p-2.5 space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PreviewSkeleton() {
  return (
    <div className="bg-card rounded-lg border-2 border-border overflow-hidden">
      <div className="p-3 sm:p-4 md:p-6">
        <div 
          className="w-full bg-muted animate-pulse rounded-lg"
          style={{ aspectRatio: '3/4' }}
        />
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="bg-card rounded-lg border-2 border-border p-3 sm:p-4 md:p-5">
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-8 w-24 bg-muted animate-pulse rounded-lg" />
            </div>
            <div className="h-2 bg-muted animate-pulse rounded-full" />
          </div>
        ))}
        <div className="h-12 bg-muted animate-pulse rounded-lg" />
      </div>
    </div>
  );
}

export function FullPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="w-full px-4 md:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="h-7 w-40 bg-muted animate-pulse rounded" />
            <div className="flex gap-2">
              <div className="h-9 w-24 bg-muted animate-pulse rounded-lg" />
              <div className="h-9 w-9 bg-muted animate-pulse rounded-lg" />
            </div>
          </div>
        </div>
      </header>

      {/* Content Skeleton */}
      <div className="w-full px-4 md:px-6 lg:px-8 py-4 md:py-6">
        {/* Template Section */}
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <div className="w-6 h-6 bg-muted animate-pulse rounded-full" />
            <div className="h-5 w-32 bg-muted animate-pulse rounded" />
          </div>
          <TemplateSkeleton />
        </div>

        {/* Preview + Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-muted animate-pulse rounded-full" />
                <div className="h-5 w-20 bg-muted animate-pulse rounded" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-12 bg-muted animate-pulse rounded-lg" />
                <div className="h-8 w-12 bg-muted animate-pulse rounded-lg" />
              </div>
            </div>
            <PreviewSkeleton />
          </div>
          
          <div className="lg:col-span-1">
            <div className="mb-3 flex items-center gap-2">
              <div className="w-6 h-6 bg-muted animate-pulse rounded-full" />
              <div className="h-5 w-20 bg-muted animate-pulse rounded" />
            </div>
            <SettingsSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}

export default FullPageSkeleton;
