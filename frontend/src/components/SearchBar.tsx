"use client";

import { Search, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search bookmarks... (e.g. pasta, workout, coding)",
}: SearchBarProps) {
  const [local, setLocal] = useState(value);
  // Keep a stable ref to the latest onChange so the debounce effect
  // does NOT depend on the callback reference (which changes every render).
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Sync local input if the parent resets the value externally
  useEffect(() => {
    setLocal(value);
  }, [value]);

  // Debounce: only fires when the user actually types (local changes)
  useEffect(() => {
    const timer = setTimeout(() => {
      onChangeRef.current(local);
    }, 400);
    return () => clearTimeout(timer);
  }, [local]); // ← only `local` here, NOT `onChange`

  return (
    <div className="relative w-full max-w-xl">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-10 py-3 rounded-xl bg-card border border-border/50 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
      />
      {local && (
        <button
          onClick={() => {
            setLocal("");
            onChangeRef.current("");
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/10 transition"
        >
          <X className="w-3.5 h-3.5 text-muted" />
        </button>
      )}
    </div>
  );
}
