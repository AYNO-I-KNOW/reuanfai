'use client';
import { useSyncExternalStore } from 'react';
/** Browser-only demo persistence. Invalid or unavailable storage must not break a screen. */
export function createDemoStore<T>(key: string, initial: T, validate: (value: unknown) => value is T) {
    let raw: string | null | undefined, cached = initial;
    const event = `${key}:changed`;
    function snapshot() {
        try {
            const value = window.localStorage.getItem(key);
            if (value !== raw) {
                raw = value;
                if (value === null)
                    cached = initial;
                else {
                    try {
                        const parsed: unknown = JSON.parse(value);
                        cached = validate(parsed) ? parsed : initial;
                    }
                    catch {
                        cached = initial;
                    }
                }
            }
        }
        catch { /* Keep the in-memory snapshot when browser storage is denied. */ }
        return cached;
    }
    function subscribe(notify: () => void) {
        const storage = (e: StorageEvent) => { if (e.key === key || e.key === null)
            notify(); };
        window.addEventListener('storage', storage);
        window.addEventListener(event, notify);
        return () => { window.removeEventListener('storage', storage); window.removeEventListener(event, notify); };
    }
    function set(update: T | ((previous: T) => T)) {
        const value = typeof update === 'function' ? (update as (previous: T) => T)(snapshot()) : update;
        if (!validate(value))
            throw new Error(`Invalid demo data: ${key}`);
        cached = value;
        try {
            const serialized = JSON.stringify(value);
            window.localStorage.setItem(key, serialized);
            raw = serialized;
        }
        catch { /* Updates still work in this tab without persistence. */ }
        window.dispatchEvent(new Event(event));
    }
    return { snapshot, set, use: () => useSyncExternalStore(subscribe, snapshot, () => initial) };
}
