'use client';

import { formatDate, getPlatformIcon, truncate } from '@/lib/helpers';

export default function LinkCard({ link }) {
    const {
        id,
        title,
        url,
        platform,
        category,
        description,
        thumbnail,
        saved_at,
    } = link;

    return (
        <article className="link-card card" id={`link-card-${id}`}>
            {thumbnail && (
                <div className="card-thumb">
                    <img src={thumbnail} alt={title} loading="lazy" />
                </div>
            )}

            <div className="card-body">
                {/* Platform + Category badges */}
                <div className="card-meta flex gap-sm">
                    <span className="badge badge-platform">
                        {getPlatformIcon(platform)} {platform || 'Web'}
                    </span>
                    {category && (
                        <span className="badge badge-category">{category}</span>
                    )}
                </div>

                {/* Title */}
                <h3 className="card-title mt-sm">
                    <a href={url} target="_blank" rel="noopener noreferrer" title={title}>
                        {truncate(title, 72)}
                    </a>
                </h3>

                {/* Description */}
                {description && (
                    <p className="card-description text-muted text-sm mt-sm">
                        {truncate(description, 120)}
                    </p>
                )}

                {/* Footer */}
                <div className="card-footer flex-between mt-md">
                    <span className="text-muted text-sm">🕒 {formatDate(saved_at)}</span>
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
                    >
                        Open ↗
                    </a>
                </div>
            </div>

            <style jsx>{`
        .link-card {
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .card-thumb {
          width: 100%;
          height: 160px;
          overflow: hidden;
        }

        .card-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .link-card:hover .card-thumb img {
          transform: scale(1.04);
        }

        .card-body {
          padding: 1.2rem;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .card-meta {
          flex-wrap: wrap;
        }

        .badge {
          font-size: 0.72rem;
          font-weight: 600;
          padding: 0.2rem 0.55rem;
          border-radius: 99px;
          letter-spacing: 0.02em;
        }

        .badge-platform {
          background: var(--color-primary-glow);
          color: var(--color-primary);
          border: 1px solid var(--color-primary);
        }

        .badge-category {
          background: var(--color-surface-2);
          color: var(--color-text-muted);
          border: 1px solid var(--color-border);
        }

        .card-title {
          font-size: 0.97rem;
          font-weight: 600;
          line-height: 1.4;
        }

        .card-title a {
          color: var(--color-text);
          transition: color var(--transition);
        }

        .card-title a:hover {
          color: var(--color-primary);
        }

        .card-description {
          line-height: 1.55;
          flex: 1;
        }

        .card-footer {
          border-top: 1px solid var(--color-border);
          padding-top: 0.75rem;
        }
      `}</style>
        </article>
    );
}
