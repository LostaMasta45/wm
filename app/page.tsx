'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, History as HistoryIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PosterHistory } from '@/lib/supabase';
import ThemeToggle from './dashboard/components/ThemeToggle';

export default function HomePage() {
  const router = useRouter();
  const [recentHistory, setRecentHistory] = useState<PosterHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    fetchRecentHistory();
  }, []);

  const fetchRecentHistory = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      
      const response = await fetch('/api/history?limit=6', {
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('History data fetched:', result);
      setRecentHistory(result.data || []);
    } catch (error: any) {
      console.error('Error fetching recent history:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Header */}
      <header className="relative bg-card/50 backdrop-blur-xl border-b border-border/50">
        <div className="w-full px-4 md:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-start justify-between gap-4"
          >
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl font-bold text-foreground">
                Poster Composer
              </h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Create beautiful posters in seconds
              </p>
            </div>
            <div className="flex-shrink-0 mt-1">
              <ThemeToggle />
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative w-full px-4 md:px-6 lg:px-8 py-8 md:py-12">

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-12">
          {/* Create New */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => router.push('/dashboard')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl p-8 md:p-10 overflow-hidden transition-all hover:shadow-xl"
          >
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <PlusCircle className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Create New</h2>
              <p className="text-white/80 text-sm md:text-base">
                Start with beautiful templates
              </p>
            </div>
          </motion.button>

          {/* View History */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => router.push('/history')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative bg-card border-2 border-border text-foreground rounded-2xl p-8 md:p-10 overflow-hidden transition-all hover:border-primary hover:shadow-xl"
          >
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <HistoryIcon className="w-8 h-8 text-primary" strokeWidth={2} />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">View History</h2>
              <p className="text-muted-foreground text-sm md:text-base">
                {recentHistory.length > 0 
                  ? `${recentHistory.length} poster${recentHistory.length > 1 ? 's' : ''} saved`
                  : 'Access your saved posters'}
              </p>
            </div>
          </motion.button>
        </div>

        {/* Recent History Preview */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            // Loading Skeleton
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="h-7 w-40 bg-muted rounded animate-pulse" />
                <div className="h-5 w-20 bg-muted rounded animate-pulse" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-card border-2 border-border rounded-lg overflow-hidden"
                  >
                    <div
                      className="w-full bg-muted animate-pulse"
                      style={{ aspectRatio: '3/4' }}
                    />
                    <div className="p-2 space-y-2">
                      <div className="h-3 bg-muted rounded animate-pulse" />
                      <div className="h-2 w-2/3 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : recentHistory.length > 0 ? (
            // Actual Content
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Recent Posters
                </h2>
                <button
                  onClick={() => router.push('/history')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  View All
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {recentHistory.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => router.push('/history')}
                    className="group cursor-pointer bg-card border-2 border-border rounded-lg overflow-hidden hover:border-primary transition-all"
                  >
                    <div 
                      className="relative w-full bg-muted"
                      style={{ aspectRatio: item.settings.aspectRatio === '3:4' ? '3/4' : '4/5' }}
                    >
                      <img
                        src={item.thumbnail_url || item.poster_url}
                        alt={item.template_name}
                        loading="lazy"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          // Fallback to placeholder on error
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {item.template_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {item.brand_slug}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : hasError ? (
            // Error State
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-8"
            >
              <div className="text-center py-10 px-4 bg-card border border-border rounded-xl">
                <p className="text-sm text-muted-foreground mb-3">
                  Unable to load history
                </p>
                <button
                  onClick={fetchRecentHistory}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          ) : (
            // Empty State
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-8"
            >
              <div className="text-center py-10 px-4 bg-card border border-dashed border-border rounded-xl">
                <p className="text-sm text-muted-foreground mb-3">
                  No posters yet
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
                >
                  Create Now
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


      </div>
    </div>
  );
}
