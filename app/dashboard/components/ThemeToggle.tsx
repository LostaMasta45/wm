'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Only run on client side after mounting
  // This prevents hydration mismatch between server and client
  // This is the recommended pattern by next-themes docs
  useEffect(() => {
    // This setState call is intentional and safe for preventing hydration mismatch
    // eslint-disable-next-line
    setMounted(true);
  }, []);
  
  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="w-14 h-8 rounded-full bg-muted animate-pulse" />
    );
  }

  const isDark = theme === 'dark';

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative w-14 h-8 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 dark:from-indigo-600 dark:to-purple-700 shadow-lg transition-all duration-500"
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{
          x: isDark ? 24 : 2,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30,
        }}
        className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center"
      >
        {isDark ? (
          <Moon className="w-4 h-4 text-indigo-600" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
      </motion.div>
    </motion.button>
  );
}
