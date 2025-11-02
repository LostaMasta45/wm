'use client';

import { motion } from 'framer-motion';
import { Clock, Download, Sparkles, Upload, Palette } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface Activity {
  id: string;
  type: 'export' | 'upload' | 'ai_enhance' | 'template_change';
  title: string;
  description: string;
  timestamp: number;
  icon?: React.ReactNode;
}

interface ActivityFeedProps {
  activities: Activity[];
  maxItems?: number;
}

export default function ActivityFeed({ activities, maxItems = 10 }: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems);

  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'export':
        return <Download className="w-4 h-4" />;
      case 'upload':
        return <Upload className="w-4 h-4" />;
      case 'ai_enhance':
        return <Sparkles className="w-4 h-4" />;
      case 'template_change':
        return <Palette className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getColor = (type: Activity['type']) => {
    switch (type) {
      case 'export':
        return 'text-green-500 bg-green-500/10';
      case 'upload':
        return 'text-blue-500 bg-blue-500/10';
      case 'ai_enhance':
        return 'text-purple-500 bg-purple-500/10';
      case 'template_change':
        return 'text-orange-500 bg-orange-500/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
          <Clock className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          No recent activity
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayedActivities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
        >
          {/* Icon */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${getColor(activity.type)}`}>
            {activity.icon || getIcon(activity.type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {activity.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activity.description}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
