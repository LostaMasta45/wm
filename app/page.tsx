'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, History as HistoryIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PosterHistory } from '@/lib/supabase';

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
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout (increased)
      
      const response = await fetch('/api/history?limit=6', {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const result = await response.json();
        setRecentHistory(result.data || []);
      } else {
        setHasError(true);
      }
    } catch (error: any) {
      // Handle AbortError gracefully (timeout)
      if (error.name === 'AbortError') {
        console.log('Fetch timeout - continuing without recent history');
        setHasError(true);
      } else {
        console.error('Error fetching recent history:', error);
        setHasError(true);
      }
      // Don't show error to user, just hide the section
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
        <div className="w-full px-4 md:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x">
              ✨ Poster Composer
            </h1>
            <p className="text-muted-foreground mt-2 text-sm md:text-base flex items-center gap-2">
              <span className="inline-block animate-bounce">🎨</span>
              Create stunning posters in seconds • No design skills needed!
            </p>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative w-full px-4 md:px-6 lg:px-8 py-12">
        
        {/* Hero Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-8"
        >
          <div className="px-4 py-2 bg-card/60 backdrop-blur-sm border border-border/50 rounded-full text-sm flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="font-semibold text-foreground">Lightning Fast</span>
          </div>
          <div className="px-4 py-2 bg-card/60 backdrop-blur-sm border border-border/50 rounded-full text-sm flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <span className="font-semibold text-foreground">HD Quality</span>
          </div>
          <div className="px-4 py-2 bg-card/60 backdrop-blur-sm border border-border/50 rounded-full text-sm flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            <span className="font-semibold text-foreground">Super Easy</span>
          </div>
        </motion.div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {/* Create New */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => router.push('/dashboard')}
            whileHover={{ scale: 1.03, rotate: -1 }}
            whileTap={{ scale: 0.97 }}
            className="group relative bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-white rounded-3xl p-10 overflow-hidden transition-all hover:shadow-2xl hover:shadow-purple-500/30"
          >
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <PlusCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-3xl font-black">Create New</h2>
                <span className="text-2xl animate-bounce">✨</span>
              </div>
              <p className="text-white/90 text-base">
                Start creating amazing posters with beautiful templates
              </p>
              
              {/* Fun badge */}
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                Ready to go!
              </div>
            </div>
            
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          </motion.button>

          {/* View History */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => router.push('/history')}
            whileHover={{ scale: 1.03, rotate: 1 }}
            whileTap={{ scale: 0.97 }}
            className="group relative bg-card/70 backdrop-blur-xl border-2 border-border/50 text-foreground rounded-3xl p-10 overflow-hidden transition-all hover:border-primary hover:shadow-2xl hover:shadow-primary/20 hover:bg-card"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300">
                <HistoryIcon className="w-10 h-10 text-primary" strokeWidth={2.5} />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-3xl font-black">View History</h2>
                <span className="text-2xl">📚</span>
              </div>
              <p className="text-muted-foreground text-base">
                Access all your saved posters and creations
              </p>
              
              {/* Count badge */}
              {recentHistory.length > 0 && (
                <div className="mt-6 inline-flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/20 rounded-full">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-black text-sm">
                    {recentHistory.length}
                  </div>
                  <span className="text-sm font-bold text-foreground">Recent posters saved!</span>
                  <span className="text-xl">🎉</span>
                </div>
              )}
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
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
          ) : !hasError && recentHistory.length > 0 ? (
            // Actual Content
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  Recent Posters
                </h2>
                <button
                  onClick={() => router.push('/history')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  View All →
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
          ) : null}
        </AnimatePresence>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3 flex items-center justify-center gap-3">
              <span>Why You'll Love It</span>
              <span className="text-4xl animate-pulse">💖</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Everything you need to create professional posters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div
              whileHover={{ y: -10, scale: 1.02 }}
              className="group relative p-8 bg-gradient-to-br from-card via-card to-primary/5 backdrop-blur-sm border-2 border-border/50 rounded-2xl hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/10"
            >
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
              
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-lg">
                  <span className="text-3xl">🎨</span>
                </div>
                <h3 className="font-black text-xl text-foreground mb-3 flex items-center gap-2">
                  Multiple Templates
                  <span className="text-sm">✨</span>
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Choose from beautiful brand templates designed by professionals
                </p>
                
                <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-primary">
                  <span>Explore templates</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              whileHover={{ y: -10, scale: 1.02 }}
              className="group relative p-8 bg-gradient-to-br from-card via-card to-accent/5 backdrop-blur-sm border-2 border-border/50 rounded-2xl hover:border-accent/50 transition-all hover:shadow-xl hover:shadow-accent/10"
            >
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
              
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-lg">
                  <span className="text-3xl">⚙️</span>
                </div>
                <h3 className="font-black text-xl text-foreground mb-3 flex items-center gap-2">
                  Super Customizable
                  <span className="text-sm">🎯</span>
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Adjust padding, watermark opacity, rounded corners, and more!
                </p>
                
                <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-accent">
                  <span>Full control</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              whileHover={{ y: -10, scale: 1.02 }}
              className="group relative p-8 bg-gradient-to-br from-card via-card to-primary/5 backdrop-blur-sm border-2 border-border/50 rounded-2xl hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/10"
            >
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
              
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-lg">
                  <span className="text-3xl">💾</span>
                </div>
                <h3 className="font-black text-xl text-foreground mb-3 flex items-center gap-2">
                  Auto-Save History
                  <span className="text-sm">🚀</span>
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Never lose your work! All posters are saved automatically
                </p>
                
                <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-primary">
                  <span>Always safe</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Extra Features Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap items-center justify-center gap-3 mt-12"
          >
            <div className="px-5 py-2.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-full text-sm font-bold text-foreground flex items-center gap-2">
              <span className="text-lg">🔄</span>
              <span>Batch Upload</span>
            </div>
            <div className="px-5 py-2.5 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-full text-sm font-bold text-foreground flex items-center gap-2">
              <span className="text-lg">📐</span>
              <span>Rounded Corners</span>
            </div>
            <div className="px-5 py-2.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-full text-sm font-bold text-foreground flex items-center gap-2">
              <span className="text-lg">✨</span>
              <span>HD Export</span>
            </div>
            <div className="px-5 py-2.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-full text-sm font-bold text-foreground flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <span>Lightning Fast</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
