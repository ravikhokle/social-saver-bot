/* ===== Date Formatting ===== */

/**
 * Format an ISO date string into a human-readable format.
 * e.g. "Feb 20, 2026"
 * @param {string|Date} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return String(dateStr);
    }
}

/**
 * Return a relative time string like "3 days ago".
 * @param {string|Date} dateStr
 * @returns {string}
 */
export function timeAgo(dateStr) {
    if (!dateStr) return '—';
    const diff = Date.now() - new Date(dateStr).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (weeks < 5) return `${weeks}w ago`;
    if (months < 12) return `${months}mo ago`;
    return formatDate(dateStr);
}

/* ===== Text Utilities ===== */

/**
 * Truncate a string to a maximum number of characters, appending "…" if cut.
 * @param {string} str
 * @param {number} [max=80]
 * @returns {string}
 */
export function truncate(str, max = 80) {
    if (!str) return '';
    return str.length > max ? str.slice(0, max).trimEnd() + '…' : str;
}

/**
 * Capitalize the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/* ===== URL / Domain Utilities ===== */

/**
 * Extract a clean hostname from a URL (strips "www.").
 * @param {string} url
 * @returns {string}
 */
export function getDomain(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
}

/**
 * Build the favicon URL for a given link URL using Google's S2 service.
 * @param {string} url
 * @returns {string}
 */
export function getFaviconUrl(url) {
    const domain = getDomain(url);
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

/* ===== Platform Helpers ===== */

const PLATFORM_ICONS = {
    youtube: '▶️',
    instagram: '📸',
    twitter: '🐦',
    x: '🐦',
    tiktok: '🎵',
    reddit: '🤖',
    linkedin: '💼',
    facebook: '📘',
    github: '🐙',
    pinterest: '📌',
    spotify: '🎧',
    medium: '✍️',
    substack: '📨',
    web: '🌐',
    other: '🔗',
};

/**
 * Return an emoji icon for a given platform name.
 * @param {string} platform
 * @returns {string}
 */
export function getPlatformIcon(platform) {
    if (!platform) return PLATFORM_ICONS.web;
    const key = platform.toLowerCase().trim();
    return PLATFORM_ICONS[key] ?? PLATFORM_ICONS.other;
}

/**
 * Detect the platform from a URL.
 * @param {string} url
 * @returns {string}
 */
export function detectPlatform(url) {
    const domain = getDomain(url).toLowerCase();
    const map = {
        'youtube.com': 'YouTube',
        'youtu.be': 'YouTube',
        'instagram.com': 'Instagram',
        'twitter.com': 'Twitter',
        'x.com': 'X',
        'tiktok.com': 'TikTok',
        'reddit.com': 'Reddit',
        'linkedin.com': 'LinkedIn',
        'facebook.com': 'Facebook',
        'github.com': 'GitHub',
        'pinterest.com': 'Pinterest',
        'open.spotify.com': 'Spotify',
        'medium.com': 'Medium',
    };
    for (const [host, name] of Object.entries(map)) {
        if (domain.includes(host)) return name;
    }
    return 'Web';
}

/* ===== Miscellaneous ===== */

/**
 * Debounce a function call by a given delay.
 * @param {Function} fn
 * @param {number} delay  - milliseconds
 * @returns {Function}
 */
export function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Copy text to the clipboard. Returns a boolean indicating success.
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}
