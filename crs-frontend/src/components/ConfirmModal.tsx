import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, HelpCircle, X } from 'lucide-react';

export type ConfirmType = 'danger' | 'warning' | 'success' | 'info';

export interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    type?: ConfirmType;
    loading?: boolean;
    onConfirm: () => void | Promise<void>;
    onClose: () => void;
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy bỏ',
    type = 'danger',
    loading = false,
    onConfirm,
    onClose
}: ConfirmModalProps) {
    if (!isOpen) return null;

    let icon = <AlertTriangle size={22} color="var(--danger)" />;
    let iconBg = 'var(--danger-bg)';
    let iconBorder = 'var(--danger-border)';
    let confirmBtnClass = 'btn btn-danger';

    if (type === 'success') {
        icon = <CheckCircle2 size={22} color="var(--success)" />;
        iconBg = 'var(--success-bg)';
        iconBorder = 'var(--success-border)';
        confirmBtnClass = 'btn btn-success';
    } else if (type === 'warning') {
        icon = <AlertCircle size={22} color="#d97706" />;
        iconBg = 'var(--warning-bg)';
        iconBorder = 'var(--warning-border)';
        confirmBtnClass = 'btn';
    } else if (type === 'info') {
        icon = <HelpCircle size={22} color="var(--accent)" />;
        iconBg = 'var(--accent-bg)';
        iconBorder = 'var(--accent-border)';
        confirmBtnClass = 'btn btn-primary';
    }

    return (
        <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: 440,
                    padding: '24px 26px',
                    borderRadius: 12,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}
            >
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            backgroundColor: iconBg,
                            border: `1px solid ${iconBorder}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}
                    >
                        {icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-h)' }}>
                                {title || 'Xác nhận thao tác'}
                            </h3>
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="btn btn-outline btn-sm"
                                style={{ padding: 4, border: 'none', color: 'var(--text-muted)' }}
                                title="Đóng"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div style={{ marginTop: 10, fontSize: 13.5, color: '#475569', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                            {message}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '7px 16px', fontWeight: 500 }}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`${confirmBtnClass} btn-sm`}
                        style={{
                            padding: '7px 18px',
                            fontWeight: 600,
                            ...(type === 'warning' ? { backgroundColor: '#d97706', borderColor: '#d97706', color: '#fff' } : {})
                        }}
                    >
                        {loading ? 'Đang xử lý...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
