"use client";

import { Bookmark } from "@/lib/types";
import {
  Instagram,
  Twitter,
  Youtube,
  FileText,
  ExternalLink,
  Trash2,
  Tag,
  Clock,
} from "lucide-react";
import { deleteBookmark } from "@/lib/api";
import { useState } from "react";

const platformConfig = {
  instagram: {
    icon: Instagram,
    color: "from-pink-500 to-purple-500",
    label: "Instagram",
    bg: "bg-pink-500/10",
    text: "text-pink-400",
  },
  twitter: {
    icon: Twitter,
    color: "from-blue-400 to-cyan-400",
    label: "Twitter / X",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
  },
  youtube: {
    icon: Youtube,
    color: "from-red-500 to-orange-500",
    label: "YouTube",
    bg: "bg-red-500/10",
    text: "text-red-400",
  },
  article: {
    icon: FileText,
    color: "from-emerald-500 to-teal-500",
    label: "Article",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
  },
};

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete?: (id: string) => void;
}

export default function BookmarkCard({ bookmark, onDelete }: BookmarkCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const config = platformConfig[bookmark.platform] || platformConfig.article;
  const Icon = config.icon;

  const handleDelete = async () => {
    if (!confirm("Delete this bookmark?")) return;
    setIsDeleting(true);
    try {
      await deleteBookmark(bookmark._id);
      onDelete?.(bookmark._id);
    } catch {
      setIsDeleting(false);
    }
  };

  const timeAgo = getTimeAgo(bookmark.createdAt);

  return (
    <div className="group relative glass rounded-2xl overflow-hidden card-hover">
      {/* Top gradient bar */}
      <div className={`h-1 bg-gradient-to-r ${config.color}`} />

      <div className="p-5">
        {/* Header: Platform + Actions */}
        <div className="flex items-center justify-between mb-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bg}`}>
            <Icon className={`w-3.5 h-3.5 ${config.text}`} />
            <span className={`text-xs font-medium ${config.text}`}>
              {config.label}
            </span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Open link"
            >
              <ExternalLink className="w-3.5 h-3.5 text-muted" />
            </a>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5 text-muted hover:text-red-400" />
            </button>
          </div>
        </div>

        {/* Embed video if available (only YouTube) */}
        {bookmark.embedUrl &&
          bookmark.platform === "youtube" &&
          bookmark.embedUrl.includes("embed") && (
            <div className="relative w-full h-40 mb-3">
              <iframe
                src={bookmark.embedUrl}
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          )}
        {/* Instagram reels: always show thumbnail, never embed */}
        {bookmark.platform === "instagram" && bookmark.thumbnail && (
          <div className="relative w-full h-40 rounded-xl overflow-hidden mb-3 bg-card">
            <img
              src={bookmark.thumbnail}
              alt={bookmark.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}

        {/* Thumbnail (skip if we already rendered embed) */}
        {bookmark.thumbnail &&
          bookmark.platform !== "instagram" &&
          !(
            bookmark.embedUrl &&
            bookmark.platform === "youtube" &&
            bookmark.embedUrl.includes("embed")
          ) && (
            <div className="relative w-full h-40 rounded-xl overflow-hidden mb-3 bg-card">
              <img
                src={bookmark.thumbnail}
                alt={bookmark.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

        {/* Title */}
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-2 leading-snug">
          {bookmark.title || "Untitled"}
        </h3>

        {/* Summary */}
        {bookmark.summary && (
          <p className="text-xs text-muted line-clamp-2 mb-3 leading-relaxed">
            {bookmark.summary}
          </p>
        )}

        {/* Category badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
            <Tag className="w-3 h-3" />
            {bookmark.category}
          </span>
        </div>

        {/* Tags */}
        {bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {bookmark.tags.slice(0, 4).map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-muted border border-border/50"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted/60 pt-2 border-t border-border/30">
          <Clock className="w-3 h-3" />
          {timeAgo}
          {bookmark.author && (
            <>
              <span className="mx-1">·</span>
              <span>by {bookmark.author}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
