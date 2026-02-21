"use client";

import { useState } from "react";
import { Bookmark } from "@/lib/types";
import BookmarkCard from "./BookmarkCard";
import {
  Instagram,
  Twitter,
  Youtube,
  FileText,
  Shuffle,
  X,
  Sparkles,
} from "lucide-react";
import { fetchRandomBookmark } from "@/lib/api";

interface PlatformFilterProps {
  selected: string;
  onSelect: (platform: string) => void;
}

function PlatformFilter({ selected, onSelect }: PlatformFilterProps) {
  const platforms = [
    { id: "all", label: "All", icon: Sparkles },
    { id: "instagram", label: "Instagram", icon: Instagram },
    { id: "twitter", label: "Twitter", icon: Twitter },
    { id: "youtube", label: "YouTube", icon: Youtube },
    { id: "article", label: "Articles", icon: FileText },
  ];

  return (
    <div className="flex gap-1.5">
      {platforms.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selected === id
              ? "bg-secondary/15 text-secondary border border-secondary/30"
              : "text-muted hover:text-foreground hover:bg-white/5"
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

interface BookmarkGridProps {
  bookmarks: Bookmark[];
  platform: string;
  onPlatformChange: (platform: string) => void;
  onDelete: (id: string) => void;
}

export default function BookmarkGrid({
  bookmarks,
  platform,
  onPlatformChange,
  onDelete,
}: BookmarkGridProps) {
  const [randomBookmark, setRandomBookmark] = useState<Bookmark | null>(null);
  const [loadingRandom, setLoadingRandom] = useState(false);

  const handleRandom = async () => {
    setLoadingRandom(true);
    try {
      const bm = await fetchRandomBookmark();
      setRandomBookmark(bm);
    } catch {
      // ignore
    }
    setLoadingRandom(false);
  };

  return (
    <div>
      {/* Controls bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <PlatformFilter selected={platform} onSelect={onPlatformChange} />

        <button
          onClick={handleRandom}
          disabled={loadingRandom}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
        >
          <Shuffle className={`w-3.5 h-3.5 ${loadingRandom ? "animate-spin" : ""}`} />
          Random Inspiration
        </button>
      </div>

      {/* Random bookmark modal */}
      {randomBookmark && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setRandomBookmark(null)}
              className="absolute -top-2 -right-2 z-10 p-2 rounded-full bg-card border border-border hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="mb-3 text-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 text-sm font-semibold">
                <Sparkles className="w-4 h-4 text-primary" />
                Random Inspiration
              </span>
            </div>
            <BookmarkCard bookmark={randomBookmark} />
          </div>
        </div>
      )}

      {/* Grid */}
      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-muted/30" />
          </div>
          <h3 className="text-lg font-semibold text-muted mb-2">No bookmarks yet</h3>
          <p className="text-sm text-muted/60 max-w-sm">
            Send a link to your WhatsApp bot or use the Add Link page to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {bookmarks.map((bm) => (
            <BookmarkCard key={bm._id} bookmark={bm} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
