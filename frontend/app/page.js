'use client';

import { useLinks } from '@/hooks/useLinks';
import LinkCard from '@/components/LinkCard';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import RandomButton from '@/components/RandomButton';

export default function DashboardPage() {
    const { links, loading, error, category, setCategory, search, setSearch } = useLinks();

    return (
        <div className="dashboard">
            {/* Hero Header */}
            <div className="dashboard-hero">
                <h1>
                    Your <span className="gradient-text">Saved Links</span>
                </h1>
                <p className="text-muted mt-sm">
                    Browse, search, and rediscover your saved social media content.
                </p>
            </div>

            {/* Controls */}
            <div className="dashboard-controls">
                <SearchBar value={search} onChange={setSearch} />
                <div className="flex gap-md" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                    <CategoryFilter selected={category} onChange={setCategory} />
                    <RandomButton links={links} />
                </div>
            </div>

            {/* Stats */}
            <div className="dashboard-stats">
                <span className="text-muted text-sm">
                    {loading ? 'Loading…' : `${links.length} link${links.length !== 1 ? 's' : ''} found`}
                </span>
            </div>

            {/* Link Grid */}
            {loading ? (
                <div className="flex-center" style={{ minHeight: '200px' }}>
                    <div className="spinner" />
                </div>
            ) : error ? (
                <div className="error-message">⚠️ {error}</div>
            ) : links.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-icon">🔗</span>
                    <p>No links found. Try a different search or category.</p>
                </div>
            ) : (
                <div className="link-grid">
                    {links.map((link) => (
                        <LinkCard key={link.id} link={link} />
                    ))}
                </div>
            )}

            <style jsx>{`
        .dashboard { }

        .dashboard-hero {
          margin-bottom: 2rem;
        }

        .dashboard-controls {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        @media (min-width: 640px) {
          .dashboard-controls {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .dashboard-stats {
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
          font-size: 1rem;
        }

        .empty-icon {
          font-size: 3rem;
        }

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
