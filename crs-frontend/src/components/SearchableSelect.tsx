import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';

export interface SearchableOption {
    value: number | string;
    label: string;
    subLabel?: string;
    tag?: string;
}

export interface SearchableSelectProps {
    options: SearchableOption[];
    value?: number | string | null;
    onChange: (value: any) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    required?: boolean;
    clearable?: boolean;
    emptyMessage?: string;
    style?: React.CSSProperties;
    className?: string;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = '-- Chọn --',
    searchPlaceholder = 'Nhập từ khóa tìm kiếm...',
    disabled = false,
    emptyMessage = 'Không tìm thấy kết quả phù hợp',
    clearable = true,
    style,
    className
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = useMemo(() => {
        return options.find((opt) => opt.value === value);
    }, [options, value]);

    const filteredOptions = useMemo(() => {
        if (!searchTerm.trim()) return options;
        const lower = searchTerm.toLowerCase();
        return options.filter((opt) => {
            const matchLabel = opt.label.toLowerCase().includes(lower);
            const matchSubLabel = opt.subLabel ? opt.subLabel.toLowerCase().includes(lower) : false;
            const matchTag = opt.tag ? opt.tag.toLowerCase().includes(lower) : false;
            return matchLabel || matchSubLabel || matchTag;
        });
    }, [options, searchTerm]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleOpen = () => {
        if (disabled) return;
        setIsOpen(true);
        setTimeout(() => {
            inputRef.current?.focus();
        }, 50);
    };

    const handleSelect = (val: number | string) => {
        onChange(val);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(undefined);
        setSearchTerm('');
        setIsOpen(false);
    };

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                position: 'relative',
                width: '100%',
                opacity: disabled ? 0.6 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
                ...style
            }}
        >
            {/* Box displaying current value or Search input */}
            <div
                onClick={handleOpen}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: '8px 12px',
                    backgroundColor: disabled ? '#f1f5f9' : '#ffffff',
                    border: `1px solid ${isOpen ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 6,
                    fontSize: 13.5,
                    color: selectedOption ? 'var(--text-h)' : 'var(--text-muted)',
                    outline: 'none',
                    boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.15)' : 'none',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                    minHeight: 38
                }}
            >
                {isOpen ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                        <Search size={15} color="var(--accent)" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={searchPlaceholder}
                            style={{
                                width: '100%',
                                border: 'none',
                                outline: 'none',
                                padding: 0,
                                margin: 0,
                                fontSize: 13.5,
                                backgroundColor: 'transparent',
                                color: 'var(--text-h)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    setIsOpen(false);
                                    setSearchTerm('');
                                } else if (e.key === 'Enter' && filteredOptions.length > 0) {
                                    e.preventDefault();
                                    handleSelect(filteredOptions[0].value);
                                }
                            }}
                        />
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                        <span
                            style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontWeight: selectedOption ? 500 : 400
                            }}
                            title={selectedOption ? `${selectedOption.label} ${selectedOption.subLabel ? `(${selectedOption.subLabel})` : ''}` : placeholder}
                        >
                            {selectedOption ? (
                                <>
                                    {selectedOption.label}
                                    {selectedOption.subLabel && (
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6, fontSize: 12.5 }}>
                                            ({selectedOption.subLabel})
                                        </span>
                                    )}
                                </>
                            ) : (
                                placeholder
                            )}
                        </span>
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {selectedOption && !disabled && clearable && (
                        <button
                            type="button"
                            onClick={handleClear}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: 2,
                                display: 'flex',
                                alignItems: 'center',
                                borderRadius: 4
                            }}
                            title="Xóa lựa chọn"
                        >
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown size={15} color="var(--text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                </div>
            </div>

            {/* Dropdown Results Popover */}
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                        maxHeight: 220,
                        overflowY: 'auto',
                        zIndex: 1200,
                        padding: '4px 0'
                    }}
                >
                    {filteredOptions.length === 0 ? (
                        <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                            {emptyMessage}
                        </div>
                    ) : (
                        filteredOptions.map((opt) => {
                            const isSelected = opt.value === value;
                            return (
                                <div
                                    key={opt.value}
                                    onClick={() => handleSelect(opt.value)}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '8px 12px',
                                        fontSize: 13,
                                        cursor: 'pointer',
                                        backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                                        color: isSelected ? 'var(--accent)' : 'var(--text-h)',
                                        borderBottom: '1px solid #f8fafc',
                                        transition: 'background-color 0.1s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                                        <div style={{ fontWeight: isSelected ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {opt.label}
                                        </div>
                                        {opt.subLabel && (
                                            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>
                                                {opt.subLabel}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                        {opt.tag && (
                                            <span className="badge badge-info" style={{ fontSize: 11, padding: '2px 6px' }}>
                                                {opt.tag}
                                            </span>
                                        )}
                                        {isSelected && <Check size={14} color="var(--accent)" />}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
