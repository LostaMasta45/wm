'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Zap, Target, Award, TrendingUp } from 'lucide-react';
import Confetti from 'react-confetti';
import { useState, useEffect } from 'react';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const achievements: Achievement[] = [
  {
    id: 'first-export',
    title: 'First Steps',
    description: 'Export your first poster',
    icon: <Star className="w-5 h-5" />,
    unlocked: false,
    rarity: 'common',
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Create 10 posters in one day',
    icon: <Zap className="w-5 h-5" />,
    unlocked: false,
    progress: 0,
    maxProgress: 10,
    rarity: 'rare',
  },
  {
    id: 'template-master',
    title: 'Template Master',
    description: 'Use all available templates',
    icon: <Trophy className="w-5 h-5" />,
    unlocked: false,
    progress: 0,
    maxProgress: 5,
    rarity: 'epic',
  },
  {
    id: 'perfectionist',
    title: 'Perfectionist',
    description: 'Export the same poster 5 times with adjustments',
    icon: <Target className="w-5 h-5" />,
    unlocked: false,
    progress: 0,
    maxProgress: 5,
    rarity: 'rare',
  },
  {
    id: 'century',
    title: 'Century Club',
    description: 'Create 100 posters total',
    icon: <Award className="w-5 h-5" />,
    unlocked: false,
    progress: 0,
    maxProgress: 100,
    rarity: 'legendary',
  },
  {
    id: 'ai-enthusiast',
    title: 'AI Enthusiast',
    description: 'Use AI features 20 times',
    icon: <TrendingUp className="w-5 h-5" />,
    unlocked: false,
    progress: 0,
    maxProgress: 20,
    rarity: 'epic',
  },
];

interface AchievementToastProps {
  achievement: Achievement;
  onClose: () => void;
}

export function AchievementToast({ achievement, onClose }: AchievementToastProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const rarityColors = {
    common: 'from-gray-500 to-gray-600',
    rare: 'from-blue-500 to-blue-600',
    epic: 'from-purple-500 to-pink-500',
    legendary: 'from-yellow-500 to-orange-500',
  };

  return (
    <>
      {showConfetti && achievement.rarity !== 'common' && (
        <Confetti
          numberOfPieces={achievement.rarity === 'legendary' ? 200 : 100}
          recycle={false}
          gravity={0.3}
        />
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        className="fixed bottom-8 right-8 z-[999] max-w-sm"
      >
        <div className={`
          relative p-6 bg-gradient-to-br ${rarityColors[achievement.rarity]} 
          rounded-2xl shadow-2xl border-2 border-white/20 overflow-hidden
        `}>
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent animate-pulse" />
          
          <div className="relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                {achievement.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-white" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Achievement Unlocked!
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white mb-1">
                  {achievement.title}
                </h4>
                <p className="text-sm text-white/90">
                  {achievement.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

interface UserStatsProps {
  stats: {
    postersCreated: number;
    timeSaved: string;
    templatesUsed: number;
    achievementsUnlocked: number;
  };
}

export function UserStats({ stats }: UserStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20">
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
          {stats.postersCreated}
        </div>
        <div className="text-xs text-muted-foreground">Posters Created</div>
      </div>
      
      <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl border border-green-500/20">
        <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
          {stats.timeSaved}
        </div>
        <div className="text-xs text-muted-foreground">Time Saved</div>
      </div>
      
      <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl border border-purple-500/20">
        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
          {stats.templatesUsed}
        </div>
        <div className="text-xs text-muted-foreground">Templates Used</div>
      </div>
      
      <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 rounded-xl border border-yellow-500/20">
        <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
          {stats.achievementsUnlocked}
        </div>
        <div className="text-xs text-muted-foreground">Achievements</div>
      </div>
    </div>
  );
}

interface AchievementsListProps {
  achievements: Achievement[];
}

export function AchievementsList({ achievements }: AchievementsListProps) {
  const rarityColors = {
    common: 'border-gray-500/30 bg-gray-500/5',
    rare: 'border-blue-500/30 bg-blue-500/5',
    epic: 'border-purple-500/30 bg-purple-500/5',
    legendary: 'border-yellow-500/30 bg-yellow-500/5',
  };

  const rarityLabels = {
    common: 'Common',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
  };

  return (
    <div className="space-y-3">
      {achievements.map((achievement) => (
        <div
          key={achievement.id}
          className={`
            relative p-4 rounded-xl border transition-all
            ${achievement.unlocked 
              ? rarityColors[achievement.rarity] 
              : 'border-border bg-muted/30 opacity-60'
            }
          `}
        >
          <div className="flex items-start gap-4">
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center
              ${achievement.unlocked 
                ? 'bg-primary/20 text-primary' 
                : 'bg-muted text-muted-foreground'
              }
            `}>
              {achievement.icon}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`font-semibold ${
                  achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {achievement.title}
                </h4>
                <span className={`
                  px-2 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider
                  ${achievement.rarity === 'common' && 'bg-gray-500/20 text-gray-600'}
                  ${achievement.rarity === 'rare' && 'bg-blue-500/20 text-blue-600'}
                  ${achievement.rarity === 'epic' && 'bg-purple-500/20 text-purple-600'}
                  ${achievement.rarity === 'legendary' && 'bg-yellow-500/20 text-yellow-600'}
                `}>
                  {rarityLabels[achievement.rarity]}
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                {achievement.description}
              </p>
              
              {achievement.maxProgress && (
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{achievement.progress}/{achievement.maxProgress}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((achievement.progress || 0) / achievement.maxProgress) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className={`h-full ${
                        achievement.rarity === 'common' && 'bg-gray-500'
                      } ${
                        achievement.rarity === 'rare' && 'bg-blue-500'
                      } ${
                        achievement.rarity === 'epic' && 'bg-purple-500'
                      } ${
                        achievement.rarity === 'legendary' && 'bg-yellow-500'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {achievement.unlocked && (
              <div className="flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
