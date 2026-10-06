import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import type { SortConfig } from '../hooks/useTableSort';

interface SortableThProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
    columnKey: string;
    sortConfig: SortConfig | null;
    onSort: (key: string) => void;
    align?: 'left' | 'center' | 'right';
    children: React.ReactNode;
}

export const SortableTh: React.FC<SortableThProps> = ({
    columnKey,
    sortConfig,
    onSort,
    align = 'left',
    children,
    className = '',
    style,
    ...rest
}) => {
    const isActive = sortConfig?.key === columnKey;
    const direction = isActive ? sortConfig.direction : null;

    const tooltip = isActive
        ? (direction === 'asc' ? 'Đang sắp xếp A-Z (Nhấn để xếp Z-A)' : 'Đang sắp xếp Z-A (Nhấn để xếp A-Z)')
        : 'Nhấn để sắp xếp A-Z';

    const justifyContent = align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start';

    return (
        <th
            {...rest}
            onClick={() => onSort(columnKey)}
            className={`sortable-th ${isActive ? 'active-sort' : ''} ${className}`}
            style={{
                cursor: 'pointer',
                userSelect: 'none',
                textAlign: align,
                ...style
            }}
            title={tooltip}
        >
            <div
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    justifyContent,
                    width: '100%'
                }}
            >
                <span>{children}</span>
                <span className="sort-icon-wrapper" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {direction === 'asc' && (
                        <ArrowUp size={13} style={{ color: 'var(--accent)', strokeWidth: 2.2, flexShrink: 0 }} />
                    )}
                    {direction === 'desc' && (
                        <ArrowDown size={13} style={{ color: 'var(--accent)', strokeWidth: 2.2, flexShrink: 0 }} />
                    )}
                    {!direction && (
                        <ArrowUpDown size={13} className="sort-icon-inactive" style={{ opacity: 0.35, flexShrink: 0 }} />
                    )}
                </span>
            </div>
        </th>
    );
};
