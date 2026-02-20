'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLinks } from '@/hooks/useLinks';
import SearchBar from '@/components/SearchBar';
import LinkCard from '@/components/LinkCard';

function SearchResults() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    const { links, loading, error, search, setSearch } = useLinks({ initialSearch: initialQuery });

    return (
        <div className="search-page">
            <div className="search-header">
                <h1>Search <span className="gradient-text">Links</span></h1>
                <p className="text-muted mt-sm">Find any saved link instantly.</p>
            </div>

            <div className="search-bar-wrap">
                <SearchBar value={search} onChange={setSearch} autoFocus />
            </div>

            {search && (
                <p className="search-label text-muted text-sm">
                    Results for: <strong style={{ color: 'var(--color-text)' }}>"{search}"</strong>
                </p>
            )}

            {loading ? (
                <div className="flex-center" style={{ minHeight: '200px' }}>
                    <div className="spinner" />
                </div>
            ) : error ? (
                <div className="error-message">⚠️ {error}</div>
            ) : links.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-icon">🔍</span>
                    <p>{search ? `No results for "${search}"` : 'Start typing to search your links.'}</p>
                </div>
            ) : (
                <div className="link-grid">
                    {links.map((link) => (
                        <LinkCard key={link.id} link={link} />
                    ))}
                </div>
            )}

            <style jsx>{`
        .search-page { }

        .search-header {
          margin-bottom: 2rem;
        }

        .search-bar-wrap {
          margin-bottom: 1.5rem;
        }

        .search-label {
          margin-bottom: 1.5rem;
        }

        .link-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          min-height: 200px;
          color: var(--color-text-muted);
        }

        .empty-icon { font-size: 3rem; }

        .error-message {
          padding: 1rem 1.5rem;
          border-radius: var(--radius-md);
          background: rgba(239,68,68,0.1);
          border: 1px solid var(--color-danger);
          color: var(--color-danger);
        }

        .spinner {
          width: 36px;
          height: 36px;
          border: 3px solid var(--color-border);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="flex-center" style={{ minHeight: '300px' }}>Loading search…</div>}>
            <SearchResults />
        </Suspense>
    );
}
