import React, { useEffect, useState } from 'react';
import { X, AlertCircle, Plus } from 'lucide-react';
import { createCategory, updateCategory } from '../api/warehouseApi';
import { useToast } from '../context/ToastContext';
import type { Category } from '../types/warehouse';
import { validateCode, validateRequired } from '../utils/validators';
import { getErrorMessage, getFieldErrors } from '../utils/errorHandler';

export interface CategoryModalProps {
    isOpen: boolean;
    category?: Category | null;
    onClose: () => void;
    onSuccess: (savedCategory: Category) => void;
    zIndex?: number;
}

export default function CategoryModal({
    isOpen,
    category,
    onClose,
    onSuccess,
    zIndex = 1100
}: CategoryModalProps) {
    const toast = useToast();
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const isEdit = Boolean(category);

    useEffect(() => {
        if (isOpen) {
            if (category) {
                setCode(category.code);
                setName(category.name);
                setDescription(category.description || '');
            } else {
                setCode('');
                setName('');
                setDescription('');
            }
            setError(null);
            setFieldErrors({});
        }
    }, [isOpen, category]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const newErrors: Record<string, string> = {};
        const codeErr = validateCode(code, 'Mã danh mục');
        if (codeErr) newErrors.code = codeErr;

        const nameErr = validateRequired(name, 'Tên danh mục');
        if (nameErr) newErrors.name = nameErr;

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            setError('Vui lòng kiểm tra lại thông tin danh mục');
            return;
        }

        setFieldErrors({});
        setSubmitting(true);

        const payload = {
            code: code.trim().toUpperCase(),
            name: name.trim(),
            description: description.trim() || undefined
        };

        try {
            if (isEdit && category) {
                const res = await updateCategory(category.id, payload);
                toast.success(`Cập nhật danh mục "${name}" thành công!`);
                onSuccess(res.data);
            } else {
                const res = await createCategory(payload);
                toast.success(`Thêm mới danh mục "${name}" thành công!`);
                onSuccess(res.data);
            }
            onClose();
        } catch (err: unknown) {
            const errorMsg = getErrorMessage(err, isEdit ? 'Lỗi cập nhật danh mục' : 'Lỗi tạo danh mục');
            const backendFieldErrors = getFieldErrors(err);
            if (backendFieldErrors) {
                setFieldErrors(backendFieldErrors);
            }
            setError(errorMsg);
            toast.error(errorMsg, isEdit ? 'Lỗi cập nhật danh mục' : 'Lỗi tạo danh mục');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="modal-backdrop"
            style={{ zIndex }}
            onClick={() => !submitting && onClose()}
        >
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: 'var(--accent-bg)',
                            color: 'var(--accent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Plus size={18} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                            {isEdit ? 'Sửa Danh mục' : 'Thêm Danh mục'}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px' }}
                        disabled={submitting}
                    >
                        <X size={15} />
                    </button>
                </div>

                {error && (
                    <div style={{
                        padding: '8px 12px',
                        borderRadius: 6,
                        backgroundColor: 'var(--danger-bg)',
                        color: 'var(--danger)',
                        fontSize: 13,
                        marginBottom: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                    }}>
                        <AlertCircle size={15} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                                Mã danh mục *
                            </label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value.toUpperCase());
                                    if (fieldErrors.code) {
                                        setFieldErrors((prev) => ({ ...prev, code: '' }));
                                    }
                                }}
                                className={fieldErrors.code ? 'is-invalid' : ''}
                                placeholder="DIENTU, GIA-DUNG..."
                                style={{ width: '100%' }}
                                autoFocus
                            />
                            {fieldErrors.code && (
                                <span className="invalid-feedback">{fieldErrors.code}</span>
                            )}
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                                Tên danh mục *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (fieldErrors.name) {
                                        setFieldErrors((prev) => ({ ...prev, name: '' }));
                                    }
                                }}
                                className={fieldErrors.name ? 'is-invalid' : ''}
                                placeholder="Thiết bị điện tử..."
                                style={{ width: '100%' }}
                            />
                            {fieldErrors.name && (
                                <span className="invalid-feedback">{fieldErrors.name}</span>
                            )}
                        </div>
                    </div>

                    <div style={{ marginBottom: 18 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                            Mô tả
                        </label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ghi chú thêm về nhóm sản phẩm này..."
                            style={{ width: '100%', resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary"
                            disabled={submitting}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm mới'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
