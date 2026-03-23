'use client';
import { useState, useEffect } from 'react';

export interface NotificationPrefs {
    emailNotifs: boolean;
    smsNotifs: boolean;
    weeklyDigest: boolean;
    applicationUpdates: boolean;
    taskReminders: boolean;
}

const STORAGE_KEY = 'notification_prefs';

const DEFAULT_PREFS: NotificationPrefs = {
    emailNotifs: true,
    smsNotifs: false,
    weeklyDigest: true,
    applicationUpdates: true,
    taskReminders: true,
};

// Map from pref key → notification type strings stored in DB
export const PREF_TYPE_MAP: Record<keyof Pick<NotificationPrefs, 'weeklyDigest' | 'applicationUpdates' | 'taskReminders'>, string[]> = {
    weeklyDigest: ['weekly_digest'],
    applicationUpdates: ['application_update', 'application'],
    taskReminders: ['task_reminder', 'task'],
};

export function useNotificationPrefs() {
    const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) });
            }
        } catch {
            // ignore parse errors
        }
        setLoaded(true);
    }, []);

    const updatePrefs = (next: NotificationPrefs) => {
        setPrefs(next);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            // ignore storage errors
        }
    };

    const toggle = (key: keyof NotificationPrefs) => {
        const next = { ...prefs, [key]: !prefs[key] };
        updatePrefs(next);
    };

    return { prefs, toggle, loaded };
}
