import React, { useEffect, useState } from 'react';
import { X, AlertCircle, Plus } from 'lucide-react';
import { createSupplier, updateSupplier } from '../api/warehouseApi';
import { useToast } from '../context/ToastContext';
import type { Supplier } from '../types/warehouse';
import { validateCode, validateRequired, validatePhone, validateEmail } from '../utils/validators';
import { getErrorMessage, getFieldErrors } from '../utils/errorHandler';

export interface SupplierModalProps {
    isOpen: boolean;
    supplier?: Supplier | null;
    onClose: () => void;
    onSuccess: (savedSupplier: Supplier) => void;
    zIndex?: number;
}

export default function SupplierModal({
    isOpen,
    supplier,
    onClose,
    onSuccess,
    zIndex = 1100
}: SupplierModalProps) {
    const toast = useToast();
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const isEdit = Boolean(supplier);

    useEffect(() => {
        if (isOpen) {
            if (supplier) {
                setCode(supplier.code);
                setName(supplier.name);
                setAddress(supplier.address || '');
                setPhone(supplier.phone);
                setEmail(supplier.email || '');
                setContactPerson(supplier.contactPerson || '');
            } else {
                setCode('');
                setName('');
                setAddress('');
                setPhone('');
                setEmail('');
                setContactPerson('');
            }
            setError(null);
            setFieldErrors({});
        }
    }, [isOpen, supplier]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const newErrors: Record<string, string> = {};
        const codeErr = validateCode(code, 'Mã NCC');
        if (codeErr) newErrors.code = codeErr;

        const nameErr = validateRequired(name, 'Tên nhà cung cấp');
        if (nameErr) newErrors.name = nameErr;

        const phoneErr = validatePhone(phone, true);
        if (phoneErr) newErrors.phone = phoneErr;

        const emailErr = validateEmail(email, false);
        if (emailErr) newErrors.email = emailErr;

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            setError('Vui lòng kiểm tra lại thông tin nhà cung cấp');
            return;
        }

        setFieldErrors({});
        setSubmitting(true);

        const payload = {
            code: code.trim().toUpperCase(),
            name: name.trim(),
            address: address.trim() || undefined,
            phone: phone.trim(),
            email: email.trim() || undefined,
            contactPerson: contactPerson.trim() || undefined
        };

        try {
            if (isEdit && supplier) {
                const res = await updateSupplier(supplier.id, payload);
                toast.success(`Cập nhật nhà cung cấp "${name}" thành công!`);
                onSuccess(res.data);
            } else {
                const res = await createSupplier(payload);
                toast.success(`Thêm mới nhà cung cấp "${name}" thành công!`);
                onSuccess(res.data);
            }
            onClose();
        } catch (err: unknown) {
            const errorMsg = getErrorMessage(err, isEdit ? 'Lỗi cập nhật nhà cung cấp' : 'Lỗi tạo nhà cung cấp');
            const backendFieldErrors = getFieldErrors(err);
            if (backendFieldErrors) {
                setFieldErrors(backendFieldErrors);
            }
            setError(errorMsg);
            toast.error(errorMsg, isEdit ? 'Lỗi cập nhật nhà cung cấp' : 'Lỗi tạo nhà cung cấp');
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
                            {isEdit ? 'Sửa Nhà cung cấp' : 'Thêm Nhà cung cấp'}
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 12 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                                Mã NCC *
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
                                placeholder="NCC001..."
                                style={{ width: '100%' }}
                                autoFocus
                            />
                            {fieldErrors.code && (
                                <span className="invalid-feedback">{fieldErrors.code}</span>
                            )}
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                                Tên nhà cung cấp *
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
                                placeholder="Tên công ty/đại lý..."
                                style={{ width: '100%' }}
                            />
                            {fieldErrors.name && (
                                <span className="invalid-feedback">{fieldErrors.name}</span>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                                Số điện thoại *
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => {
                                    setPhone(e.target.value);
                                    if (fieldErrors.phone) {
                                        setFieldErrors((prev) => ({ ...prev, phone: '' }));
                                    }
                                }}
                                className={fieldErrors.phone ? 'is-invalid' : ''}
                                placeholder="0901234567..."
                                style={{ width: '100%' }}
                            />
                            {fieldErrors.phone && (
                                <span className="invalid-feedback">{fieldErrors.phone}</span>
                            )}
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (fieldErrors.email) {
                                        setFieldErrors((prev) => ({ ...prev, email: '' }));
                                    }
                                }}
                                className={fieldErrors.email ? 'is-invalid' : ''}
                                placeholder="supplier@example.com"
                                style={{ width: '100%' }}
                            />
                            {fieldErrors.email && (
                                <span className="invalid-feedback">{fieldErrors.email}</span>
                            )}
                        </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                            Người liên hệ
                        </label>
                        <input
                            type="text"
                            value={contactPerson}
                            onChange={(e) => setContactPerson(e.target.value)}
                            placeholder="Tên người đại diện kinh doanh..."
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div style={{ marginBottom: 18 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                            Địa chỉ
                        </label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Số nhà, đường, quận/huyện, tỉnh/thành..."
                            style={{ width: '100%' }}
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
