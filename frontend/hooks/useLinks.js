'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchLinks } from '@/lib/api';
import { debounce } from '@/lib/helpers';

/**
 * useLinks — custom hook for fetching and filtering saved links.
 *
 * @param {{ initialSearch?: string, initialCategory?: string }} [options]
 * @returns {{
 *   links: Array,
 *   loading: boolean,
 *   error: string|null,
 *   search: string,
 *   setSearch: Function,
 *   category: string,
 *   setCategory: Function,
 *   refresh: Function,
 * }}
 */
export function useLinks({ initialSearch = '', initialCategory = '' } = {}) {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState(initialSearch);
    const [category, setCategory] = useState(initialCategory);

    // Debounced search query to avoid hammering the API on every keystroke
    const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const updateDebouncedSearch = useCallback(
        debounce((val) => setDebouncedSearch(val), 350),
        []
    );

    // Propagate raw search → debounced
    useEffect(() => {
        updateDebouncedSearch(search);
    }, [search, updateDebouncedSearch]);

    // Fetch whenever debounced search or category changes
    const loadLinks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchLinks({ search: debouncedSearch, category });
            setLinks(Array.isArray(data) ? data : data.results ?? []);
        } catch (err) {
            setError(err.message ?? 'Failed to load links.');
            setLinks([]);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, category]);

    useEffect(() => {
        loadLinks();
    }, [loadLinks]);

    return {
        links,
        loading,
        error,
        search,
        setSearch,
        category,
        setCategory,
        refresh: loadLinks,
    };
}
