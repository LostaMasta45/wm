'use client';

import { motion } from 'framer-motion';
import { Download, Eye, Trash2, Clock } from 'lucide-react';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';

interface TimelineItem {
  id: string;
  thumbnail: string;
  templateName: string;
  timestamp: number;
  url: string;
  size?: string;
  dimensions?: string;
}

interface TimelineViewProps {
  items: TimelineItem[];
  onView?: (item: TimelineItem) => void;
  onDownload?: (item: TimelineItem) => void;
  onDelete?: (item: TimelineItem) => void;
}

export default function TimelineView({ items, onView, onDownload, onDelete }: TimelineViewProps) {
  const groupByDate = (items: TimelineItem[]) => {
    const groups: Record<string, TimelineItem[]> = {};

    items.forEach((item) => {
      const date = new Date(item.timestamp);
      let groupKey: string;

      if (isToday(date)) {
        groupKey = 'Today';
      } else if (isYesterday(date)) {
        groupKey = 'Yesterday';
      } else if (isThisWeek(date)) {
        groupKey = 'This Week';
      } else {
        groupKey = format(date, 'MMMM yyyy');
      }

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
    });

    return groups;
  };

  const groupedItems = groupByDate(items);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Clock className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No exports yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Your exported posters will appear here. Start by uploading a poster and exporting it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedItems).map(([dateGroup, groupItems]) => (
        <div key={dateGroup}>
          {/* Date Group Header */}
          <div className="sticky top-0 z-10 flex items-center gap-3 mb-4 py-2 bg-background/80 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              {dateGroup}
            </h3>
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">
              {groupItems.length} item{groupItems.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Timeline Items */}
          <div className="relative pl-6 space-y-6">
            {/* Timeline Line */}
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />

            {groupItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
              >
                {/* Timeline Dot */}
                <div className="absolute -left-6 top-6 w-4 h-4 rounded-full bg-primary border-4 border-background shadow-lg" />

                {/* Card */}
                <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex gap-4 p-4">
                    {/* Thumbnail */}
                    <div className="relative w-24 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={item.thumbnail}
                        alt={item.templateName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">
                        {item.templateName}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(item.timestamp), 'h:mm a • MMM d, yyyy')}
                      </p>
                      {item.dimensions && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span className="px-2 py-0.5 bg-muted rounded font-mono">
                            {item.dimensions}
                          </span>
                          {item.size && (
                            <>
                              <span>•</span>
                              <span>{item.size}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onView && (
                        <button
                          onClick={() => onView(item)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </button>
                      )}
                      {onDownload && (
                        <button
                          onClick={() => onDownload(item)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
