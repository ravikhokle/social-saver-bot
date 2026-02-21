"use client";

import { Stats } from "@/lib/types";
import {
  Bookmark,
  Instagram,
  Twitter,
  Youtube,
  FileText,
  TrendingUp,
} from "lucide-react";

interface StatsCardsProps {
  stats: Stats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const platformIcons: Record<string, React.ReactNode> = {
    instagram: <Instagram className="w-4 h-4 text-pink-400" />,
    twitter: <Twitter className="w-4 h-4 text-blue-400" />,
    youtube: <Youtube className="w-4 h-4 text-red-400" />,
    article: <FileText className="w-4 h-4 text-emerald-400" />,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total bookmarks */}
      <div className="glass rounded-2xl p-5 pulse-glow">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Bookmark className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs text-muted font-medium uppercase tracking-wide">
            Total Saved
          </span>
        </div>
        <p className="text-3xl font-bold gradient-text">{stats.total}</p>
      </div>

      {/* Platforms */}
      {Object.entries(stats.platforms).map(([platform, count]) => (
        <div key={platform} className="glass rounded-2xl p-5 card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              {platformIcons[platform] || (
                <FileText className="w-5 h-5 text-muted" />
              )}
            </div>
            <span className="text-xs text-muted font-medium uppercase tracking-wide capitalize">
              {platform}
            </span>
          </div>
          <p className="text-3xl font-bold text-foreground">{count}</p>
        </div>
      ))}

      {/* Top category */}
      {stats.topCategories.length > 0 && (
        <div className="glass rounded-2xl p-5 card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-secondary" />
            </div>
            <span className="text-xs text-muted font-medium uppercase tracking-wide">
              Top Category
            </span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {stats.topCategories[0].name}
          </p>
          <p className="text-xs text-muted mt-1">
            {stats.topCategories[0].count} items
          </p>
        </div>
      )}
    </div>
  );
}
