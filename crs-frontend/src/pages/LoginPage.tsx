import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { login as loginApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import type { ApiErrorResponse } from '../types/apiError';
import { Boxes, LogIn, Shield, Briefcase, UserCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('admin123');
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const newErrors: Record<string, string> = {};
        if (!username.trim()) {
            newErrors.username = 'Vui lòng nhập tên đăng nhập';
        }
        if (!password) {
            newErrors.password = 'Vui lòng nhập mật khẩu';
        } else if (password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            return;
        }

        setFieldErrors({});
        setSubmitting(true);
        try {
            const res = await loginApi({ username: username.trim(), password });
            login(res.data);
            navigate('/dashboard');
        } catch (err) {
            if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Đăng nhập thất bại, vui lòng kiểm tra lại thông tin.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleQuickLogin = (u: string, p: string) => {
        setUsername(u);
        setPassword(p);
        setFieldErrors({});
        setError(null);
    };

    return (
        <div style={{ maxWidth: 420, margin: '60px auto', padding: '36px 32px', border: '1px solid var(--border)', borderRadius: 12, background: '#fff', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                }}>
                    <Boxes size={26} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>HỆ THỐNG QUẢN LÝ KHO</h2>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Warehouse Management System (WMS)</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Tên đăng nhập</label>
                    <input
                        value={username}
                        onChange={(e) => {
                            setUsername(e.target.value);
                            if (fieldErrors.username) {
                                setFieldErrors((prev) => ({ ...prev, username: '' }));
                            }
                        }}
                        className={fieldErrors.username ? 'is-invalid' : ''}
                        style={{ width: '100%' }}
                        placeholder="Nhập username"
                    />
                    {fieldErrors.username && (
                        <span className="invalid-feedback">{fieldErrors.username}</span>
                    )}
                </div>
                <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Mật khẩu</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (fieldErrors.password) {
                                setFieldErrors((prev) => ({ ...prev, password: '' }));
                            }
                        }}
                        className={fieldErrors.password ? 'is-invalid' : ''}
                        style={{ width: '100%' }}
                        placeholder="Nhập mật khẩu"
                    />
                    {fieldErrors.password && (
                        <span className="invalid-feedback">{fieldErrors.password}</span>
                    )}
                </div>

                {error && (
                    <div className="alert-banner alert-banner-danger" style={{ marginBottom: 16 }}>
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '11px 0', fontSize: 14, justifyContent: 'center' }}
                >
                    <LogIn size={16} />
                    {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
            </form>

            <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px dashed var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 10, textAlign: 'center' }}>
                    TÀI KHOẢN MẪU ĐỂ TEST 3 ROLES:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    <button
                        type="button"
                        onClick={() => handleQuickLogin('admin', 'admin123')}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: 12, justifyContent: 'center' }}
                    >
                        <Shield size={13} /> Admin
                    </button>
                    <button
                        type="button"
                        onClick={() => handleQuickLogin('manager', 'manager123')}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: 12, justifyContent: 'center' }}
                    >
                        <Briefcase size={13} /> Manager
                    </button>
                    <button
                        type="button"
                        onClick={() => handleQuickLogin('staff', 'staff123')}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: 12, justifyContent: 'center' }}
                    >
                        <UserCheck size={13} /> Staff
                    </button>
                </div>
            </div>
        </div>
    );
}