"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { fetchBookmarks, fetchStats, fetchCategories } from "@/lib/api";
import { Bookmark, Stats, CategoryCount } from "@/lib/types";
import StatsCards from "@/components/StatsCards";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import BookmarkGrid from "@/components/BookmarkGrid";
import { Loader2, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [platform, setPlatform] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const latestRequest = useRef<symbol | null>(null);

  const loadBookmarks = useCallback(async () => {
    const reqId = Symbol();
    latestRequest.current = reqId;
    setLoading(true);
    try {
      const data = await fetchBookmarks({ search, category, platform, page, limit: 9 });
      if (latestRequest.current !== reqId) return;
      setBookmarks(data.bookmarks);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      if (latestRequest.current === reqId) console.error(err);
    }
    if (latestRequest.current === reqId) setLoading(false);
  }, [search, category, platform, page]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  // NOTE: URL sync removed to avoid router-triggered re-renders that reset page

  useEffect(() => {
    fetchStats().then(setStats).catch(console.error);
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  const handleDelete = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b._id !== id));
    fetchStats().then(setStats).catch(console.error);
    fetchCategories().then(setCategories).catch(console.error);
  };

  const handlePin = (id: string, pinnedValue: boolean) => {
    setBookmarks((prev) =>
      prev
        .map((b) => (b._id === id ? { ...b, pinned: pinnedValue } : b))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned))
    );
    fetchStats().then(setStats).catch(console.error);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">
            Dashboard
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
          Your <span className="gradient-text">Knowledge Base</span>
        </h1>
        <p className="text-sm text-muted max-w-lg">
          Everything you&apos;ve saved from Instagram, Twitter, and the web — organized and searchable.
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mb-8">
          <StatsCards stats={stats} />
        </div>
      )}

      {/* Search + Filters */}
      <div className="space-y-4 mb-8">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
        {categories.length > 0 && (
          <CategoryFilter
            categories={categories}
            selected={category}
            onSelect={(c) => { setCategory(c); setPage(1); }}
          />
        )}
      </div>

      {/* Bookmarks grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <BookmarkGrid
          bookmarks={bookmarks}
          platform={platform}
          onPlatformChange={(p) => { setPlatform(p); setPage(1); }}
          onDelete={handleDelete}
          onPin={handlePin}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
          {/* Previous */}
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={loading || page <= 1}
            className="px-4 py-2 rounded-xl glass text-sm font-medium text-muted hover:text-foreground disabled:opacity-30 transition"
          >
            ← Prev
          </button>

          {/* Page number buttons */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setPage(pageNum)}
              disabled={loading}
              className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${pageNum === page
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                : "glass text-muted hover:text-foreground hover:bg-white/10"
                }`}
            >
              {pageNum}
            </button>
          ))}

          {/* Next */}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={loading || page >= totalPages}
            className="px-4 py-2 rounded-xl glass text-sm font-medium text-muted hover:text-foreground disabled:opacity-30 transition"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
