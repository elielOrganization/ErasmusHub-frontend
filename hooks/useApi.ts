'use client';
import { useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { API_URL } from '@/lib/api';

/** Returns true only when the stored JWT is actually past its `exp` claim. */
function isJwtExpired(): boolean {
    const token = Cookies.get('auth_token');
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (!payload?.exp) return false; // no exp → treat as valid
        return Date.now() / 1000 > payload.exp;
    } catch {
        return false; // malformed token → let /auth/me decide
    }
}

interface UseApiOptions {
    immediate?: boolean;
    refreshInterval?: number; // ms, 0 = disabled
}

interface UseApiResult<T> {
    data: T | null;
    error: string | null;
    loading: boolean;
    refetch: () => Promise<void>;
}

export function useApi<T>(endpoint: string | null, options: UseApiOptions = { immediate: true }): UseApiResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!endpoint) return;
        setLoading(true);
        setError(null);
        try {
            const token = Cookies.get('auth_token');
            // Strip trailing slash before query string to avoid 307 redirects
            // that cause browsers to drop the Authorization header
            const url = `${API_URL}${endpoint}`.replace(/\/(\?|$)/, '$1');
            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (res.status === 401) {
                // Only show the session-expired overlay when the JWT is actually
                // expired. A 401 from a permission-restricted endpoint (which the
                // backend should return as 403 but sometimes doesn't) must NOT kick
                // out a legitimately-authenticated user.
                if (isJwtExpired()) {
                    window.dispatchEvent(new CustomEvent('session-expired'));
                }
                return;
            }
            if (!res.ok) {
                throw new Error(`Error ${res.status}`);
            }
            const json = await res.json();
            setData(json);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [endpoint]);

    useEffect(() => {
        if (options.immediate !== false) {
            fetchData();
        }
    }, [fetchData, options.immediate]);

    useEffect(() => {
        if (!options.refreshInterval) return;
        const id = setInterval(fetchData, options.refreshInterval);
        return () => clearInterval(id);
    }, [fetchData, options.refreshInterval]);

    return { data, error, loading, refetch: fetchData };
}

export async function apiPost<T>(endpoint: string, body: unknown): Promise<T> {
    const token = Cookies.get('auth_token');
    // Strip trailing slash to avoid 307 redirects that lose the Authorization header
    const url = `${API_URL}${endpoint}`.replace(/\/(\?|$)/, '$1');
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        throw new Error(`Error ${res.status}`);
    }
    return res.json();
}

export async function apiDelete<T>(endpoint: string): Promise<T> {
    const token = Cookies.get('auth_token');
    const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    if (!res.ok) {
        throw new Error(`Error ${res.status}`);
    }
    return res.json();
}

export async function apiPatch<T>(endpoint: string, body?: unknown): Promise<T> {
    const token = Cookies.get('auth_token');
    const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        throw new Error(`Error ${res.status}`);
    }
    return res.json();
}
