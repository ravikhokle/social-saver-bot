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

/** Convert any YouTube watch/short/youtu.be URL → embed URL */
function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let videoId: string | null = null;
    if (u.hostname === "youtu.be") {
      videoId = u.pathname.slice(1).split("/")[0];
    } else if (u.pathname.startsWith("/shorts/")) {
      videoId = u.pathname.split("/")[2];
    } else if (u.hostname.includes("youtube.com")) {
      videoId = u.searchParams.get("v");
      // already an embed URL
      if (!videoId && u.pathname.startsWith("/embed/")) return url;
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1` : null;
  } catch {
    return null;
  }
}

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete?: (id: string) => void;
}

export default function BookmarkCard({ bookmark, onDelete }: BookmarkCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const config = platformConfig[bookmark.platform] || platformConfig.article;
  const Icon = config.icon;

  // Build a valid embed URL for YouTube (works for old & new bookmarks)
  const youtubeEmbedUrl =
    bookmark.platform === "youtube"
      ? getYouTubeEmbedUrl(bookmark.embedUrl || bookmark.url) ?? getYouTubeEmbedUrl(bookmark.url)
      : null;

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

        {/* YouTube embed – uses converted embed URL so all saved videos play */}
        {bookmark.platform === "youtube" && youtubeEmbedUrl && (
          <div className="relative w-full h-44 mb-3 rounded-xl overflow-hidden bg-black">
            <iframe
              src={youtubeEmbedUrl}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        )}

        {/* Instagram — clickable thumbnail + play overlay (Meta blocks all iframe embeds) */}
        {bookmark.platform === "instagram" && (
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block relative w-full h-44 rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-pink-900/30 to-purple-900/30 group/play"
          >
            {/* Thumbnail */}
            {bookmark.thumbnail ? (
              <img
                src={bookmark.thumbnail}
                alt={bookmark.title}
                className="w-full h-full object-cover group-hover/play:scale-105 transition-transform duration-300"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              /* No thumbnail fallback */
              <div className="w-full h-full flex items-center justify-center">
                <Instagram className="w-10 h-10 text-pink-400/40" />
              </div>
            )}

            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Play button — appears only on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/play:opacity-100 transition-all duration-300">
              <div
                className="flex items-center gap-1.5 px-4 py-2 rounded-full scale-90 group-hover/play:scale-100 transition-all duration-300"
                style={{ background: "rgba(10,10,15,0.75)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(10px)" }}
              >
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span className="text-white text-xs font-semibold tracking-wide">Play</span>
              </div>
            </div>

            {/* Label badge */}
            <div className="absolute top-2 left-2">
              <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-[10px] font-semibold text-white uppercase tracking-wide">
                {bookmark.url?.includes("/reel/") ? "Reel" : "Post"}
              </span>
            </div>

            {/* "Open in Instagram" hint */}
            <div className="absolute bottom-2 right-2 opacity-0 group-hover/play:opacity-100 transition-opacity">
              <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-white flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> Open in Instagram
              </span>
            </div>
          </a>
        )}

        {/* Thumbnail for Twitter / Articles (no embed) */}
        {bookmark.thumbnail &&
          bookmark.platform !== "instagram" &&
          bookmark.platform !== "youtube" && (
            <div className="relative w-full h-40 rounded-xl overflow-hidden mb-3 bg-card">
              <img
                src={bookmark.thumbnail}
                alt={bookmark.title}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
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
