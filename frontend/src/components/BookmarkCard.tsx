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
  X,
  Maximize,
  Pin,
  PinOff,
} from "lucide-react";
import { deleteBookmark, togglePin } from "@/lib/api";
import { useState, useRef } from "react";

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
  onPin?: (id: string, pinned: boolean) => void;
}

export default function BookmarkCard({ bookmark, onDelete, onPin }: BookmarkCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [pinned, setPinned] = useState(bookmark.pinned ?? false);
  const [showModal, setShowModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFullscreen = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
    else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
  };
  const config = platformConfig[bookmark.platform] || platformConfig.article;
  const Icon = config.icon;

  const youtubeEmbedUrl =
    bookmark.platform === "youtube"
      ? getYouTubeEmbedUrl(bookmark.embedUrl || bookmark.url) ?? getYouTubeEmbedUrl(bookmark.url)
      : null;

  const handlePin = async () => {
    setIsPinning(true);
    const next = !pinned;
    setPinned(next); // optimistic
    try {
      await togglePin(bookmark._id, next);
      onPin?.(bookmark._id, next);
    } catch (err: any) {
      setPinned(!next); // revert on error
      if (err?.message) alert(err.message);
    } finally {
      setIsPinning(false);
    }
  };

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
  const isReel = bookmark.url?.includes("/reel/");
  const hasVideo = !!bookmark.videoUrl;

  return (
    <div className="group relative glass rounded-2xl overflow-hidden card-hover">
      {/* Top gradient bar */}
      <div className={`h-1 bg-gradient-to-r ${config.color}`} />

      {/* Pinned badge */}
      {pinned && (
        <div className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-yellow-400/15 border border-yellow-400/30">
          <Pin className="w-3 h-3 text-yellow-400" />
        </div>
      )}

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
            <button
              onClick={handlePin}
              disabled={isPinning}
              className={`p-1.5 rounded-lg transition-colors ${
                pinned
                  ? "text-yellow-400 hover:bg-yellow-400/20"
                  : "hover:bg-white/10 text-muted hover:text-yellow-400"
              }`}
              title={pinned ? "Unpin" : "Pin"}
            >
              {pinned ? (
                <PinOff className="w-3.5 h-3.5" />
              ) : (
                <Pin className="w-3.5 h-3.5" />
              )}
            </button>
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

        {/* YouTube embed */}
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

        {/* Instagram — click thumbnail to open in-page modal */}
        {bookmark.platform === "instagram" && (
          <>
            {/* Card thumbnail (click triggers modal) */}
            <div
              onClick={() => setShowModal(true)}
              className="cursor-pointer relative w-full h-44 rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-pink-900/30 to-purple-900/30 group/play"
            >
              {bookmark.thumbnail ? (
                <img
                  src={bookmark.thumbnail}
                  alt={bookmark.title}
                  className="w-full h-full object-cover group-hover/play:scale-105 transition-transform duration-300"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Instagram className="w-10 h-10 text-pink-400/40" />
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Hover button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/play:opacity-100 transition-all duration-300">
                <div
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full scale-90 group-hover/play:scale-100 transition-all duration-300"
                  style={{ background: "rgba(10,10,15,0.75)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(10px)" }}
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span className="text-white text-xs font-semibold tracking-wide">
                    {hasVideo ? "Play" : "View"}
                  </span>
                </div>
              </div>

              {/* Reel / Post badge */}
              <div className="absolute top-2 left-2">
                <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-[10px] font-semibold text-white uppercase tracking-wide">
                  {isReel ? "Reel" : "Post"}
                </span>
              </div>

              {/* Video-available indicator */}
              {hasVideo && (
                <div className="absolute top-2 right-2">
                  <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white flex items-center gap-1"
                    style={{ background: "linear-gradient(135deg,#e1306c,#833ab4)" }}
                  >
                    ▶ Video
                  </span>
                </div>
              )}

              {/* Hover hint */}
              <div className="absolute bottom-2 right-2 opacity-0 group-hover/play:opacity-100 transition-opacity">
                <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-white flex items-center gap-1">
                  <Instagram className="w-3 h-3" /> {hasVideo ? "Play video" : "Preview"}
                </span>
              </div>
            </div>

            {/* ── Instagram Modal — video top / info bottom ── */}
            {showModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)" }}
                onClick={() => setShowModal(false)}
              >
                {/* Close button pinned top-right */}
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>

                {/* Fullscreen button — sibling of close, pinned bottom-right of overlay */}
                {hasVideo && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleFullscreen(); }}
                    title="Fullscreen"
                    className="absolute bottom-4 right-4 z-10 flex items-center justify-center w-9 h-9 rounded-full text-white transition-all hover:scale-110 active:scale-95"
                    style={{
                      background: "rgba(0,0,0,0.6)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <Maximize className="w-4 h-4" />
                  </button>
                )}

                {/* Modal card — vertical flex column, centred, max 420px wide */}
                <div
                  className="flex flex-col w-full mx-4 overflow-hidden rounded-2xl shadow-2xl"
                  style={{
                    maxWidth: "420px",
                    maxHeight: "96vh",
                    background: "#0f0f14",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* ── TOP: Video / Thumbnail ── */}
                  <div className="flex-1 bg-black overflow-hidden" style={{ minHeight: 0 }}>
                    {hasVideo ? (
                      <video
                        ref={videoRef}
                        src={bookmark.videoUrl}
                        controls
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain"
                        style={{ display: "block", background: "#000" }}
                      />
                    ) : (
                      <div className="relative w-full" style={{ aspectRatio: "1/1" }}>
                        {bookmark.thumbnail ? (
                          <img
                            src={bookmark.thumbnail}
                            alt={bookmark.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-black">
                            <Instagram className="w-16 h-16" style={{ color: "rgba(236,72,153,0.3)" }} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>



                  {/* ── BOTTOM: Info panel — only shown when no video ── */}
                  {!hasVideo && <div
                    className="flex-none overflow-y-auto"
                    style={{
                      maxHeight: "38vh",
                      borderTop: "1px solid rgba(255,255,255,0.07)",
                      background: "#0f0f14",
                    }}
                  >
                    {/* Platform header row */}
                    <div
                      className="flex items-center gap-2 px-4 py-3 sticky top-0"
                      style={{
                        background: "linear-gradient(90deg,rgba(219,39,119,0.18),rgba(168,85,247,0.14))",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-none"
                        style={{ background: "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" }}
                      >
                        <Instagram className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-white leading-tight">Instagram</span>
                        {bookmark.author && (
                          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                            @{bookmark.author}
                          </span>
                        )}
                      </div>
                      <span
                        className="ml-auto flex-none px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                        style={{ background: "rgba(219,39,119,0.3)", color: "#f472b6" }}
                      >
                        {isReel ? "Reel" : "Post"}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="px-4 py-3 space-y-3">
                      {bookmark.title && (
                        <p className="text-sm font-bold text-white leading-snug">{bookmark.title}</p>
                      )}
                      {bookmark.summary && (
                        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                          {bookmark.summary}
                        </p>
                      )}
                      {bookmark.caption && bookmark.caption !== bookmark.summary && (
                        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                          {bookmark.caption}
                        </p>
                      )}
                      {bookmark.category && (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
                          style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}
                        >
                          <Tag className="w-3 h-3" /> {bookmark.category}
                        </span>
                      )}
                      {bookmark.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {bookmark.tags.map((tag: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                              style={{
                                background: "rgba(219,39,119,0.12)",
                                color: "#f472b6",
                                border: "1px solid rgba(219,39,119,0.2)",
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="flex gap-2 pt-1 pb-1">
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                          style={{ background: "linear-gradient(135deg,#e1306c,#833ab4)" }}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open in Instagram
                        </a>
                        <button
                          onClick={() => setShowModal(false)}
                          className="px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:bg-white/10 active:scale-95"
                          style={{ color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.09)" }}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>}
                </div>
              </div>
            )}
          </>
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
