"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { fetchBookmarks, fetchCategories } from "@/lib/api";
import { Bookmark, CategoryCount } from "@/lib/types";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import BookmarkGrid from "@/components/BookmarkGrid";
import { Loader2, BookmarkIcon } from "lucide-react";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
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
      // fetch 9 items per page so pagination kicks in after nine results
      const data = await fetchBookmarks({ search, category, platform, page, limit: 9 });
      if (latestRequest.current !== reqId) return;

      setBookmarks(data.bookmarks);
      setTotalPages(data.totalPages);
      if (page > data.totalPages) {
        setPage(data.totalPages || 1);
      }
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
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  const handleDelete = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b._id !== id));
    fetchCategories().then(setCategories).catch(console.error);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <BookmarkIcon className="w-5 h-5 text-secondary" />
          <span className="text-xs font-semibold text-secondary uppercase tracking-widest">
            All Bookmarks
          </span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Saved <span className="gradient-text">Content</span>
        </h1>
        <p className="text-sm text-muted">
          Browse, search, and filter everything you&apos;ve saved.
        </p>
      </div>

      {/* Filters */}
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

      {/* Grid */}
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
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-4 mt-8">
          {/* simple prev/next controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={loading || page <= 1}
              className="px-4 py-2 rounded-xl glass text-sm font-medium text-muted hover:text-foreground disabled:opacity-30 transition"
            >
              Previous
            </button>
            <span className="text-sm text-muted">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={loading || page >= totalPages}
              className="px-4 py-2 rounded-xl glass text-sm font-medium text-muted hover:text-foreground disabled:opacity-30 transition"
            >
              Next
            </button>
          </div>

          {/* numeric page selection */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                disabled={loading}
                className={`px-3 py-1 rounded-md text-sm font-medium transition 
                  ${p === page
                    ? "bg-secondary text-white"
                    : "text-muted hover:text-foreground hover:bg-white/5"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
