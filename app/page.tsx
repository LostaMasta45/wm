'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, History as HistoryIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { PosterHistory } from '@/lib/supabase';

export default function HomePage() {
  const router = useRouter();
  const [recentHistory, setRecentHistory] = useState<PosterHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecentHistory();
  }, []);

  const fetchRecentHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/history?limit=6');
      if (response.ok) {
        const result = await response.json();
        setRecentHistory(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching recent history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="w-full px-4 md:px-6 lg:px-8 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Poster Composer
          </h1>
          <p className="text-muted-foreground mt-1">
            Create beautiful posters with templates
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full px-4 md:px-6 lg:px-8 py-8">
        
        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {/* Create New */}
          <motion.button
            onClick={() => router.push('/dashboard')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground rounded-2xl p-8 overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary/20"
          >
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <PlusCircle className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Create New</h2>
              <p className="text-primary-foreground/90">
                Start creating your poster with templates
              </p>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          </motion.button>

          {/* View History */}
          <motion.button
            onClick={() => router.push('/history')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative bg-card border-2 border-border text-foreground rounded-2xl p-8 overflow-hidden transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <HistoryIcon className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl font-bold mb-2">View History</h2>
              <p className="text-muted-foreground">
                Access your saved posters
              </p>
              {recentHistory.length > 0 && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-sm">
                  <span className="font-bold text-primary">{recentHistory.length}</span>
                  <span className="text-muted-foreground">recent</span>
                </div>
              )}
            </div>
          </motion.button>
        </div>

        {/* Recent History Preview */}
        {!isLoading && recentHistory.length > 0 && (
          <div className="mb-8">
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
                  transition={{ delay: index * 0.1 }}
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
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
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
          </div>
        )}

        {/* Features */}
        <div className="mt-16">
          <h2 className="text-xl font-bold text-foreground mb-6">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-card border border-border rounded-xl hover:border-primary transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="font-bold text-foreground mb-2">Multiple Templates</h3>
              <p className="text-sm text-muted-foreground">
                Choose from various brand templates
              </p>
            </div>

            <div className="p-6 bg-card border border-border rounded-xl hover:border-accent transition-colors">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <span className="text-2xl">⚙️</span>
              </div>
              <h3 className="font-bold text-foreground mb-2">Customizable Settings</h3>
              <p className="text-sm text-muted-foreground">
                Adjust padding, watermark, and more
              </p>
            </div>

            <div className="p-6 bg-card border border-border rounded-xl hover:border-primary transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">💾</span>
              </div>
              <h3 className="font-bold text-foreground mb-2">Save History</h3>
              <p className="text-sm text-muted-foreground">
                Keep track of all your creations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
