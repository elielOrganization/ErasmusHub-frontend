'use client';
import { useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { API_URL } from '@/lib/api';

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
            const res = await fetch(`${API_URL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (res.status === 401) {
                window.dispatchEvent(new CustomEvent('session-expired'));
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
    const res = await fetch(`${API_URL}${endpoint}`, {
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
