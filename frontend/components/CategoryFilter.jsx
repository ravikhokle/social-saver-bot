'use client';

const CATEGORIES = [
    { value: '', label: '🌐 All' },
    { value: 'video', label: '🎬 Video' },
    { value: 'article', label: '📰 Article' },
    { value: 'music', label: '🎵 Music' },
    { value: 'image', label: '🖼️ Image' },
    { value: 'thread', label: '🧵 Thread' },
    { value: 'other', label: '📦 Other' },
];

export default function CategoryFilter({ selected, onChange }) {
    return (
        <div className="category-filter" role="group" aria-label="Filter by category">
            {CATEGORIES.map(({ value, label }) => (
                <button
                    key={value}
                    id={`cat-${value || 'all'}`}
                    className={`cat-btn ${selected === value ? 'active' : ''}`}
                    onClick={() => onChange(value)}
                >
                    {label}
                </button>
            ))}

            <style jsx>{`
        .category-filter {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .cat-btn {
          padding: 0.35rem 0.85rem;
          border-radius: 99px;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-text-muted);
          font-family: var(--font);
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition);
          white-space: nowrap;
        }

        .cat-btn:hover {
          background: var(--color-surface-2);
          color: var(--color-text);
          border-color: var(--color-primary);
        }

        .cat-btn.active {
          background: var(--color-primary);
          color: #fff;
          border-color: var(--color-primary);
          box-shadow: var(--shadow-glow);
        }
      `}</style>
        </div>
    );
}
