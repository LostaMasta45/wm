'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Trash2, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { motion } from 'framer-motion';
import { PosterHistory } from '@/lib/supabase';

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<PosterHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch history from API
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/history');
      if (!response.ok) throw new Error('Failed to fetch history');
      
      const result = await response.json();
      setHistory(result.data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Gagal memuat history!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (item: PosterHistory) => {
    try {
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = item.poster_url;
      link.download = `poster-${item.brand_slug}-${new Date(item.created_at).getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Download dimulai! 🎉');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Gagal download poster!');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin mau hapus dari history?')) return;

    try {
      setDeletingId(id);
      const response = await fetch(`/api/history/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setHistory(history.filter((item) => item.id !== id));
      toast.success('Berhasil dihapus dari history!');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Gagal menghapus!');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      
      <div className="min-h-screen bg-white dark:bg-black">
        {/* Header */}
        <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
          <div className="w-full px-4 md:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/')}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-black dark:text-white" />
                </button>
                <h1 className="text-xl font-bold text-black dark:text-white">
                  History
                </h1>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {history.length} poster{history.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="w-full px-4 md:px-6 lg:px-8 py-6">
          {isLoading ? (
            /* Loading State */
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-800 border-t-black dark:border-t-white rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading history...</p>
              </div>
            </div>
          ) : history.length === 0 ? (
            /* Empty State */
            <div className="flex items-center justify-center py-20">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-10 h-10 text-gray-400 dark:text-gray-600" />
                </div>
                <h2 className="text-xl font-bold text-black dark:text-white mb-2">
                  Belum Ada History
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Poster yang kamu simpan akan muncul di sini
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  Buat Poster Baru
                </button>
              </div>
            </div>
          ) : (
            /* History Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {history.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden hover:border-gray-400 dark:hover:border-gray-600 transition-all"
                >
                  {/* Poster Image */}
                  <div 
                    className="relative w-full bg-gray-100 dark:bg-gray-900"
                    style={{ aspectRatio: item.settings.aspectRatio === '3:4' ? '3/4' : '4/5' }}
                  >
                    <img
                      src={item.thumbnail_url || item.poster_url}
                      alt={item.template_name}
                      className="w-full h-full object-contain"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDownload(item)}
                        className="p-3 bg-white dark:bg-black rounded-lg hover:scale-110 transition-transform"
                        title="Download"
                      >
                        <Download className="w-5 h-5 text-black dark:text-white" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="p-3 bg-red-500 rounded-lg hover:scale-110 transition-transform disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === item.id ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5 text-white" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-bold text-sm text-black dark:text-white truncate mb-1">
                      {item.template_name}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-2">
                      {item.brand_slug}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                      <span>{item.dimensions}</span>
                      <span>{item.file_size}</span>
                    </div>
                    
                    <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-2">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
