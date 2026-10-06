import React, { useEffect, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { createCustomer, updateCustomer } from '../api/warehouseApi';
import { useToast } from '../context/ToastContext';
import type { Customer } from '../types/warehouse';
import { validateCode, validateRequired, validatePhone, validateEmail } from '../utils/validators';
import { getErrorMessage, getFieldErrors } from '../utils/errorHandler';

export interface CustomerModalProps {
    isOpen: boolean;
    customer?: Customer | null;
    onClose: () => void;
    onSuccess: (savedCustomer: Customer) => void;
    zIndex?: number;
}

export default function CustomerModal({
    isOpen,
    customer,
    onClose,
    onSuccess,
    zIndex = 1100
}: CustomerModalProps) {
    const toast = useToast();
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [customerType, setCustomerType] = useState('CA_NHAN');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const isEdit = Boolean(customer);

    useEffect(() => {
        if (isOpen) {
            if (customer) {
                setCode(customer.code || '');
                setName(customer.name || '');
                setAddress(customer.address || '');
                setPhone(customer.phone || '');
                setEmail(customer.email || '');
                setCustomerType(customer.customerType || 'CA_NHAN');
            } else {
                setCode('');
                setName('');
                setAddress('');
                setPhone('');
                setEmail('');
                setCustomerType('CA_NHAN');
            }
            setError(null);
            setFieldErrors({});
        }
    }, [isOpen, customer]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const newErrors: Record<string, string> = {};
        const codeErr = validateCode(code, 'Mã khách hàng');
        if (codeErr) newErrors.code = codeErr;

        const nameErr = validateRequired(name, 'Tên khách hàng');
        if (nameErr) newErrors.name = nameErr;

        const phoneErr = validatePhone(phone, true);
        if (phoneErr) newErrors.phone = phoneErr;

        const emailErr = validateEmail(email, false);
        if (emailErr) newErrors.email = emailErr;

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            const firstErr = Object.values(newErrors)[0];
            setError(firstErr);
            toast.error(firstErr, 'Dữ liệu không hợp lệ');
            return;
        }

        setFieldErrors({});
        setSubmitting(true);

        const payload: Partial<Customer> = {
            code: code.trim().toUpperCase(),
            name: name.trim(),
            address: address.trim() || undefined,
            phone: phone.trim(),
            email: email.trim() || undefined,
            customerType
        };

        try {
            let res;
            if (customer) {
                res = await updateCustomer(customer.id, payload);
                toast.success(`Cập nhật khách hàng "${name}" thành công!`);
            } else {
                res = await createCustomer(payload);
                toast.success(`Thêm mới khách hàng "${name}" thành công!`);
            }
            onSuccess(res.data);
            onClose();
        } catch (err: unknown) {
            const errorMsg = getErrorMessage(err, isEdit ? 'Lỗi cập nhật khách hàng' : 'Lỗi tạo khách hàng');
            const backendFieldErrors = getFieldErrors(err);
            if (backendFieldErrors) {
                setFieldErrors(backendFieldErrors);
            }
            setError(errorMsg);
            toast.error(errorMsg, 'Lưu khách hàng thất bại');
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
                    <h3 style={{ margin: 0 }}>{isEdit ? 'Sửa Khách hàng' : 'Thêm Khách hàng'}</h3>
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
                    <div
                        style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            backgroundColor: 'var(--danger-bg)',
                            color: 'var(--danger)',
                            fontSize: 13,
                            marginBottom: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                        }}
                    >
                        <AlertCircle size={15} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 12 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                                Mã KH *
                            </label>
                            <input
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value.toUpperCase());
                                    if (fieldErrors.code) setFieldErrors((prev) => ({ ...prev, code: '' }));
                                }}
                                className={fieldErrors.code ? 'is-invalid' : ''}
                                placeholder="KH001..."
                                style={{ width: '100%' }}
                                disabled={submitting}
                            />
                            {fieldErrors.code && <span className="invalid-feedback">{fieldErrors.code}</span>}
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                                Tên khách hàng *
                            </label>
                            <input
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                                }}
                                className={fieldErrors.name ? 'is-invalid' : ''}
                                placeholder="Tên công ty hoặc họ tên..."
                                style={{ width: '100%' }}
                                disabled={submitting}
                            />
                            {fieldErrors.name && <span className="invalid-feedback">{fieldErrors.name}</span>}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                                Số điện thoại *
                            </label>
                            <input
                                value={phone}
                                onChange={(e) => {
                                    setPhone(e.target.value);
                                    if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
                                }}
                                className={fieldErrors.phone ? 'is-invalid' : ''}
                                placeholder="090..."
                                style={{ width: '100%' }}
                                disabled={submitting}
                            />
                            {fieldErrors.phone && <span className="invalid-feedback">{fieldErrors.phone}</span>}
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                                Loại khách hàng
                            </label>
                            <select
                                value={customerType}
                                onChange={(e) => setCustomerType(e.target.value)}
                                style={{ width: '100%', height: 38 }}
                                disabled={submitting}
                            >
                                <option value="CA_NHAN">Cá nhân</option>
                                <option value="DOANH_NGHIEP">Doanh nghiệp</option>
                                <option value="DAI_LY">Đại lý</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                            }}
                            className={fieldErrors.email ? 'is-invalid' : ''}
                            placeholder="email@..."
                            style={{ width: '100%' }}
                            disabled={submitting}
                        />
                        {fieldErrors.email && <span className="invalid-feedback">{fieldErrors.email}</span>}
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                            Địa chỉ
                        </label>
                        <input
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Địa chỉ giao hàng..."
                            style={{ width: '100%' }}
                            disabled={submitting}
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
                            {submitting ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
