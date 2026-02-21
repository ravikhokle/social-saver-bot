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
  const total = stats.total || 1; // avoid divide-by-zero

  const items = [
    {
      icon: <Bookmark className="w-5 h-5 text-white" />,
      label: "Total Saved",
      value: stats.total,
      bar: 100,
      iconBg: "from-primary to-secondary",
      barColor: "from-primary to-secondary",
      hero: true,
    },
    ...(stats.topCategories.length > 0
      ? [{
        icon: <TrendingUp className="w-5 h-5 text-white" />,
        label: "Top: " + stats.topCategories[0].name,
        value: stats.topCategories[0].count,
        bar: Math.round((stats.topCategories[0].count / total) * 100),
        iconBg: "from-violet-500 to-purple-500",
        barColor: "from-violet-500 to-purple-400",
      }]
      : []),
    {
      icon: <Instagram className="w-5 h-5 text-white" />,
      label: "Instagram",
      value: stats.platforms.instagram ?? 0,
      bar: Math.round(((stats.platforms.instagram ?? 0) / total) * 100),
      iconBg: "from-pink-500 to-rose-500",
      barColor: "from-pink-500 to-rose-400",
    },
    {
      icon: <Twitter className="w-5 h-5 text-white" />,
      label: "Twitter",
      value: stats.platforms.twitter ?? 0,
      bar: Math.round(((stats.platforms.twitter ?? 0) / total) * 100),
      iconBg: "from-sky-500 to-blue-500",
      barColor: "from-sky-500 to-blue-400",
    },
    {
      icon: <Youtube className="w-5 h-5 text-white" />,
      label: "YouTube",
      value: stats.platforms.youtube ?? 0,
      bar: Math.round(((stats.platforms.youtube ?? 0) / total) * 100),
      iconBg: "from-red-500 to-orange-500",
      barColor: "from-red-500 to-orange-400",
    },
    {
      icon: <FileText className="w-5 h-5 text-white" />,
      label: "Articles",
      value: stats.platforms.article ?? 0,
      bar: Math.round(((stats.platforms.article ?? 0) / total) * 100),
      iconBg: "from-emerald-500 to-teal-500",
      barColor: "from-emerald-500 to-teal-400",
    },

  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((item, i) => (
        <div
          key={i}
          className={`relative glass rounded-2xl p-4 overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-lg group ${item.hero ? "pulse-glow" : "card-hover"
            }`}
        >
          {/* Subtle background gradient blob */}
          <div
            className={`absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br ${item.iconBg} opacity-10 blur-xl group-hover:opacity-20 transition-opacity`}
          />

          {/* Icon */}
          <div
            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.iconBg} flex items-center justify-center mb-3 shadow-lg`}
          >
            {item.icon}
          </div>

          {/* Number */}
          <p
            className={`text-2xl font-extrabold leading-none mb-1 ${item.hero ? "gradient-text" : "text-foreground"
              }`}
          >
            {item.value}
          </p>

          {/* Label */}
          <p className="text-[11px] text-muted uppercase tracking-wide font-medium truncate">
            {item.label}
          </p>

          {/* Progress bar */}
          <div className="mt-3 h-1 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${item.barColor} transition-all duration-700`}
              style={{ width: `${Math.max(item.bar, 4)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
