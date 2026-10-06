import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
    key: string;
    direction: SortDirection;
}

export type CustomValueGetter<T> = (item: T) => any;

export function useTableSort<T>(
    items: T[],
    defaultKey?: string,
    defaultDirection: SortDirection = 'asc',
    customGetters?: Record<string, CustomValueGetter<T>>
) {
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(
        defaultKey ? { key: defaultKey, direction: defaultDirection } : null
    );

    const requestSort = (key: string) => {
        setSortConfig((prev) => {
            if (!prev || prev.key !== key) {
                return { key, direction: 'asc' };
            }
            if (prev.direction === 'asc') {
                return { key, direction: 'desc' };
            }
            return { key, direction: 'asc' };
        });
    };

    const sortedItems = useMemo(() => {
        if (!sortConfig || !sortConfig.key || !Array.isArray(items)) return items;
        const { key, direction } = sortConfig;

        return [...items].sort((a, b) => {
            let valA = customGetters?.[key] ? customGetters[key](a) : (a as any)[key];
            let valB = customGetters?.[key] ? customGetters[key](b) : (b as any)[key];

            // Handle null / undefined
            if (valA == null && valB == null) return 0;
            if (valA == null) return direction === 'asc' ? 1 : -1;
            if (valB == null) return direction === 'asc' ? -1 : 1;

            // Handle booleans (e.g. active status)
            if (typeof valA === 'boolean' && typeof valB === 'boolean') {
                const numA = valA ? 1 : 0;
                const numB = valB ? 1 : 0;
                return direction === 'asc' ? numA - numB : numB - numA;
            }

            // Handle Date objects
            if (valA instanceof Date && valB instanceof Date) {
                return direction === 'asc'
                    ? valA.getTime() - valB.getTime()
                    : valB.getTime() - valA.getTime();
            }

            // Handle ISO date strings (e.g., 2026-09-01T13:45:00)
            if (typeof valA === 'string' && typeof valB === 'string') {
                const isDateA = !isNaN(Date.parse(valA)) && (valA.includes('T') || (valA.length === 10 && valA.includes('-')));
                const isDateB = !isNaN(Date.parse(valB)) && (valB.includes('T') || (valB.length === 10 && valB.includes('-')));
                if (isDateA && isDateB) {
                    const timeA = new Date(valA).getTime();
                    const timeB = new Date(valB).getTime();
                    return direction === 'asc' ? timeA - timeB : timeB - timeA;
                }
            }

            // Handle pure numbers or numeric strings
            const isNumA = typeof valA === 'number' || (typeof valA === 'string' && valA.trim() !== '' && !isNaN(Number(valA)));
            const isNumB = typeof valB === 'number' || (typeof valB === 'string' && valB.trim() !== '' && !isNaN(Number(valB)));

            if (isNumA && isNumB) {
                const numA = Number(valA);
                const numB = Number(valB);
                return direction === 'asc' ? numA - numB : numB - numA;
            }

            // Handle Vietnamese alphabetical string comparison with natural numbers
            const strA = String(valA);
            const strB = String(valB);
            const cmp = strA.localeCompare(strB, 'vi', { sensitivity: 'base', numeric: true });
            return direction === 'asc' ? cmp : -cmp;
        });
    }, [items, sortConfig, customGetters]);

    return {
        sortedItems,
        sortConfig,
        requestSort,
        setSortConfig
    };
}
