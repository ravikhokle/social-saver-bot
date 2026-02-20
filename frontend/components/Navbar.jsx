'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();

    const navLinks = [
        { href: '/', label: '🏠 Dashboard' },
        { href: '/search', label: '🔍 Search' },
    ];

    return (
        <header className="navbar">
            <div className="navbar-inner container">
                {/* Brand */}
                <Link href="/" className="navbar-brand">
                    <span className="brand-icon">💾</span>
                    <span className="brand-name">
                        Social <span className="gradient-text">Saver</span>
                    </span>
                </Link>

                {/* Nav Links */}
                <nav className="navbar-links">
                    {navLinks.map(({ href, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`nav-link ${pathname === href ? 'active' : ''}`}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>
            </div>

            <style jsx>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(13, 15, 20, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--color-border);
        }

        .navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--color-text);
          transition: opacity var(--transition);
        }

        .navbar-brand:hover {
          opacity: 0.8;
        }

        .brand-icon {
          font-size: 1.4rem;
        }

        .navbar-links {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .nav-link {
          padding: 0.4rem 0.9rem;
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--color-text-muted);
          transition: all var(--transition);
        }

        .nav-link:hover {
          color: var(--color-text);
          background: var(--color-surface-2);
        }

        .nav-link.active {
          color: var(--color-primary);
          background: var(--color-primary-glow);
        }
      `}</style>
        </header>
    );
}
