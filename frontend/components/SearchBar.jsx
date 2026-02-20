'use client';

export default function SearchBar({ value, onChange, autoFocus = false }) {
    return (
        <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
                id="search-input"
                type="search"
                placeholder="Search links by title, URL, or keyword…"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoFocus={autoFocus}
                className="search-input"
                autoComplete="off"
                spellCheck="false"
            />
            {value && (
                <button
                    className="search-clear"
                    onClick={() => onChange('')}
                    aria-label="Clear search"
                    title="Clear"
                >
                    ✕
                </button>
            )}

            <style jsx>{`
        .search-bar {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
          max-width: 480px;
        }

        .search-icon {
          position: absolute;
          left: 0.9rem;
          font-size: 1rem;
          pointer-events: none;
          user-select: none;
        }

        .search-input {
          width: 100%;
          padding: 0.65rem 2.8rem 0.65rem 2.6rem;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          color: var(--color-text);
          font-family: var(--font);
          font-size: 0.95rem;
          transition: border-color var(--transition), box-shadow var(--transition);
          outline: none;
        }

        .search-input::placeholder {
          color: var(--color-text-muted);
        }

        .search-input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-glow);
        }

        /* Hide the built-in clear button */
        .search-input::-webkit-search-cancel-button {
          display: none;
        }

        .search-clear {
          position: absolute;
          right: 0.75rem;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text-muted);
          font-size: 0.8rem;
          line-height: 1;
          padding: 0.2rem;
          transition: color var(--transition);
        }

        .search-clear:hover {
          color: var(--color-text);
        }
      `}</style>
        </div>
    );
}
