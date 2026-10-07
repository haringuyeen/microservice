import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
    duration?: number;
}

export interface ToastContextType {
    showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
    success: (message: string, title?: string, duration?: number) => void;
    error: (message: string, title?: string, duration?: number) => void;
    warning: (message: string, title?: string, duration?: number) => void;
    info: (message: string, title?: string, duration?: number) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastItemCardProps {
    toast: ToastItem;
    onRemove: (id: string) => void;
}

function ToastItemCard({ toast, onRemove }: ToastItemCardProps) {
    const [isExiting, setIsExiting] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    const duration = toast.duration ?? (toast.type === 'error' ? 4500 : toast.type === 'warning' ? 4000 : 3500);
    const timerRef = useRef<number | null>(null);
    const remainingTimeRef = useRef<number>(duration);
    const startTimeRef = useRef<number>(Date.now());

    const handleClose = useCallback(() => {
        setIsExiting(true);
        window.setTimeout(() => {
            onRemove(toast.id);
        }, 240);
    }, [onRemove, toast.id]);

    useEffect(() => {
        if (duration <= 0) return;

        startTimeRef.current = Date.now();
        timerRef.current = window.setTimeout(handleClose, remainingTimeRef.current);

        return () => {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
            }
        };
    }, [duration, handleClose]);

    const handleMouseEnter = () => {
        if (duration <= 0) return;
        setIsPaused(true);
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        const elapsed = Date.now() - startTimeRef.current;
        remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    };

    const handleMouseLeave = () => {
        if (duration <= 0) return;
        setIsPaused(false);
        startTimeRef.current = Date.now();
        if (remainingTimeRef.current > 0) {
            timerRef.current = window.setTimeout(handleClose, remainingTimeRef.current);
        } else {
            handleClose();
        }
    };

    const config = useMemo(() => {
        switch (toast.type) {
            case 'success':
                return {
                    accent: '#10b981',
                    iconBg: '#ecfdf5',
                    iconBorder: '#a7f3d0',
                    titleColor: '#065f46',
                    icon: <CheckCircle2 size={19} color="#059669" />,
                    defaultTitle: 'Thành công'
                };
            case 'error':
                return {
                    accent: '#ef4444',
                    iconBg: '#fef2f2',
                    iconBorder: '#fecaca',
                    titleColor: '#991b1b',
                    icon: <AlertCircle size={19} color="#dc2626" />,
                    defaultTitle: 'Thất bại'
                };
            case 'warning':
                return {
                    accent: '#f59e0b',
                    iconBg: '#fffbeb',
                    iconBorder: '#fde68a',
                    titleColor: '#92400e',
                    icon: <AlertTriangle size={19} color="#d97706" />,
                    defaultTitle: 'Cảnh báo'
                };
            case 'info':
            default:
                return {
                    accent: '#3b82f6',
                    iconBg: '#eff6ff',
                    iconBorder: '#bfdbfe',
                    titleColor: '#1e40af',
                    icon: <Info size={19} color="#2563eb" />,
                    defaultTitle: 'Thông báo'
                };
        }
    }, [toast.type]);

    return (
        <div
            className={`toast-item ${isExiting ? 'toast-exiting' : ''}`}
            style={{
                borderLeft: `4px solid ${config.accent}`
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            role="alert"
        >
            {/* Icon badge */}
            <div
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: config.iconBg,
                    border: `1px solid ${config.iconBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}
            >
                {config.icon}
            </div>

            {/* Content text */}
            <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                <div
                    style={{
                        fontWeight: 600,
                        fontSize: 13.5,
                        color: config.titleColor,
                        marginBottom: 2,
                        lineHeight: 1.3
                    }}
                >
                    {toast.title || config.defaultTitle}
                </div>
                <div
                    style={{
                        fontSize: 13,
                        color: 'var(--text)',
                        lineHeight: 1.45,
                        wordBreak: 'break-word'
                    }}
                >
                    {toast.message}
                </div>
            </div>

            {/* Close button */}
            <button
                type="button"
                onClick={handleClose}
                className="toast-close-btn"
                title="Đóng thông báo"
            >
                <X size={15} />
            </button>

            {/* Progress bar */}
            {duration > 0 && (
                <div
                    className="toast-progress"
                    style={{
                        backgroundColor: config.accent,
                        animationDuration: `${duration}ms`,
                        animationPlayState: isPaused ? 'paused' : 'running'
                    }}
                />
            )}
        </div>
    );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback(
        (type: ToastType, message: string, title?: string, duration?: number) => {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            const newToast: ToastItem = {
                id,
                type,
                title,
                message,
                duration
            };

            // Limit simultaneous toasts to at most 5 items
            setToasts((prev) => [...prev.slice(-4), newToast]);
        },
        []
    );

    const success = useCallback(
        (message: string, title?: string, duration?: number) => {
            showToast('success', message, title, duration);
        },
        [showToast]
    );

    const error = useCallback(
        (message: string, title?: string, duration?: number) => {
            showToast('error', message, title, duration);
        },
        [showToast]
    );

    const warning = useCallback(
        (message: string, title?: string, duration?: number) => {
            showToast('warning', message, title, duration);
        },
        [showToast]
    );

    const info = useCallback(
        (message: string, title?: string, duration?: number) => {
            showToast('info', message, title, duration);
        },
        [showToast]
    );

    const value = useMemo(
        () => ({
            showToast,
            success,
            error,
            warning,
            info,
            removeToast
        }),
        [showToast, success, error, warning, info, removeToast]
    );

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="toast-container" aria-live="polite">
                {toasts.map((toast) => (
                    <ToastItemCard key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
