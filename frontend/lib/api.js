const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Generic fetch wrapper with error handling.
 * @param {string} endpoint - API path (e.g. '/links')
 * @param {RequestInit} [options] - Fetch options
 */
async function apiFetch(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;

    const res = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error ${res.status}: ${text}`);
    }

    return res.json();
}

/* ===== Link Endpoints ===== */

/**
 * Fetch all links, with optional search & category filters.
 * @param {{ search?: string, category?: string }} params
 */
export async function fetchLinks({ search = '', category = '' } = {}) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/links${query}`);
}

/**
 * Fetch a single link by ID.
 * @param {string|number} id
 */
export async function fetchLinkById(id) {
    return apiFetch(`/links/${id}`);
}

/**
 * Save a new link.
 * @param {{ url: string, category?: string }} data
 */
export async function saveLink(data) {
    return apiFetch('/links', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Delete a link by ID.
 * @param {string|number} id
 */
export async function deleteLink(id) {
    return apiFetch(`/links/${id}`, { method: 'DELETE' });
}

/**
 * Fetch available categories.
 */
export async function fetchCategories() {
    return apiFetch('/categories');
}
