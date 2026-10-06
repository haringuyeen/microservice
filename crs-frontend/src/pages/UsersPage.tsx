import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
    searchUsers,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser
} from '../api/userApi';
import Pagination from '../components/Pagination';
import ConfirmModal, { type ConfirmType } from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import type { UserItem, Role, CreateUserPayload, UpdateUserPayload } from '../types/auth';
import type { ApiErrorResponse } from '../types/apiError';
import { Plus, Search, Pencil, Trash2, Lock, Unlock, X, AlertCircle } from 'lucide-react';
import { useTableSort } from '../hooks/useTableSort';
import { SortableTh } from '../components/SortableTh';
import { validateUsername, validatePassword, validateRequired, validateEmail, validatePhone } from '../utils/validators';
import { getErrorMessage, getFieldErrors } from '../utils/errorHandler';

export default function UsersPage() {
    const toast = useToast();
    const [users, setUsers] = useState<UserItem[]>([]);
    const [keyword, setKeyword] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(25);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    // Table sorting
    const { sortedItems: sortedUsers, sortConfig, requestSort } = useTableSort<UserItem>(
        users,
        'username',
        'asc'
    );

    // Modal Create/Edit
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);

    const [formUsername, setFormUsername] = useState('');
    const [formPassword, setFormPassword] = useState('');
    const [formFullName, setFormFullName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formRole, setFormRole] = useState<Role>('STAFF');
    const [formActive, setFormActive] = useState(true);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Confirmation Modal
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: React.ReactNode;
        type?: ConfirmType;
        confirmText?: string;
        onConfirm: () => void | Promise<void>;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await searchUsers({
                keyword: keyword.trim() || undefined,
                role: roleFilter || undefined,
                active: activeFilter,
                page,
                size: pageSize
            });
            setUsers(res.data.content);
            setTotalPages(res.data.totalPages);
            setTotalElements(res.data.totalElements);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [keyword, roleFilter, activeFilter, page, pageSize]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        fetchUsers();
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setFormUsername('');
        setFormPassword('');
        setFormFullName('');
        setFormEmail('');
        setFormPhone('');
        setFormRole('STAFF');
        setFormActive(true);
        setError(null);
        setFieldErrors({});
        setModalOpen(true);
    };

    const openEditModal = (u: UserItem) => {
        setEditingUser(u);
        setFormUsername(u.username);
        setFormPassword('');
        setFormFullName(u.fullName);
        setFormEmail(u.email || '');
        setFormPhone(u.phone || '');
        setFormRole(u.role);
        setFormActive(u.active);
        setError(null);
        setFieldErrors({});
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const newErrors: Record<string, string> = {};

        if (!editingUser) {
            const usernameErr = validateUsername(formUsername);
            if (usernameErr) newErrors.username = usernameErr;

            const passwordErr = validatePassword(formPassword, true);
            if (passwordErr) newErrors.password = passwordErr;
        } else {
            if (formPassword.trim()) {
                const passwordErr = validatePassword(formPassword, false);
                if (passwordErr) newErrors.password = passwordErr;
            }
        }

        const fullNameErr = validateRequired(formFullName, 'Họ và tên');
        if (fullNameErr) newErrors.fullName = fullNameErr;

        const emailErr = validateEmail(formEmail, false);
        if (emailErr) newErrors.email = emailErr;

        const phoneErr = validatePhone(formPhone, false);
        if (phoneErr) newErrors.phone = phoneErr;

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            setError('Vui lòng kiểm tra lại thông tin người dùng');
            return;
        }

        setFieldErrors({});
        setSubmitting(true);

        try {
            if (editingUser) {
                const payload: UpdateUserPayload = {
                    fullName: formFullName.trim(),
                    email: formEmail.trim() || undefined,
                    phone: formPhone.trim() || undefined,
                    role: formRole,
                    active: formActive,
                    password: formPassword.trim() || undefined
                };
                await updateUser(editingUser.id, payload);
                toast.success(`Cập nhật người dùng "${payload.fullName}" thành công!`);
            } else {
                const payload: CreateUserPayload = {
                    username: formUsername.trim(),
                    password: formPassword.trim(),
                    fullName: formFullName.trim(),
                    email: formEmail.trim() || undefined,
                    phone: formPhone.trim() || undefined,
                    role: formRole,
                    active: formActive
                };
                await createUser(payload);
                toast.success(`Tạo người dùng mới "${payload.fullName}" thành công!`);
            }
            setModalOpen(false);
            fetchUsers();
        } catch (err: unknown) {
            const errorMsg = getErrorMessage(err, editingUser ? 'Lỗi cập nhật người dùng' : 'Lỗi tạo người dùng');
            const backendFieldErrors = getFieldErrors(err);
            if (backendFieldErrors) {
                setFieldErrors(backendFieldErrors);
            }
            setError(errorMsg);
            toast.error(errorMsg, 'Lỗi lưu người dùng');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggle = (u: UserItem) => {
        const actionText = u.active ? 'Khóa' : 'Kích hoạt';
        setConfirmModal({
            isOpen: true,
            title: `${actionText} tài khoản người dùng`,
            message: `Bạn có chắc chắn muốn ${actionText.toLowerCase()} tài khoản "${u.fullName}" (@${u.username})?`,
            type: u.active ? 'warning' : 'success',
            confirmText: actionText,
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                    await toggleUserStatus(u.id);
                    toast.success(`Đã ${actionText.toLowerCase()} tài khoản "${u.fullName}" thành công!`);
                    fetchUsers();
                } catch (err: unknown) {
                    const errorMsg = axios.isAxiosError<ApiErrorResponse>(err)
                        ? err.response?.data?.message || 'Không thể đổi trạng thái'
                        : 'Lỗi khi đổi trạng thái';
                    toast.error(errorMsg, 'Thao tác thất bại');
                }
            }
        });
    };

    const handleDelete = (u: UserItem) => {
        if (u.username === 'admin') {
            toast.warning('Không thể xóa tài khoản Admin mặc định', 'Cảnh báo');
            return;
        }
        setConfirmModal({
            isOpen: true,
            title: 'Xác nhận xóa người dùng',
            message: `Bạn có chắc chắn muốn xóa người dùng "${u.fullName}" (@${u.username})?\n\nThao tác này không thể hoàn tác.`,
            type: 'danger',
            confirmText: 'Xóa người dùng',
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                    await deleteUser(u.id);
                    toast.success(`Đã xóa người dùng "${u.fullName}" thành công!`);
                    fetchUsers();
                } catch (err: unknown) {
                    const errorMsg = axios.isAxiosError<ApiErrorResponse>(err)
                        ? err.response?.data?.message || 'Không thể xóa người dùng'
                        : 'Lỗi khi xóa người dùng';
                    toast.error(errorMsg, 'Xóa người dùng thất bại');
                }
            }
        });
    };

    const renderRoleBadge = (role: Role) => {
        if (role === 'ADMIN') return <span className="badge badge-danger">Quản trị viên</span>;
        if (role === 'MANAGER') return <span className="badge badge-warning">Quản lý kho</span>;
        return <span className="badge badge-success">Nhân viên</span>;
    };

    return (
        <div className="page-wrapper">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 22 }}>Quản lý Người dùng & Phân quyền</h1>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                        Dành riêng cho Quản trị viên (ADMIN): cấp tài khoản, phân vai trò Admin / Quản lý / Nhân viên, khóa tài khoản.
                    </div>
                </div>
                <button onClick={openCreateModal} className="btn btn-primary">
                    <Plus size={16} />
                    <span>Thêm người dùng mới</span>
                </button>
            </div>

            <form onSubmit={handleSearch} className="filter-bar" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Tìm theo username, họ tên, email, SĐT..."
                    style={{ flex: 1, minWidth: 260 }}
                />
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ width: 160 }}>
                    <option value="">Tất cả vai trò</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Quản lý kho</option>
                    <option value="STAFF">Nhân viên kho</option>
                </select>
                <select
                    value={activeFilter === undefined ? '' : activeFilter ? 'true' : 'false'}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') setActiveFilter(undefined);
                        else setActiveFilter(val === 'true');
                    }}
                    style={{ width: 160 }}
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Đã bị khóa</option>
                </select>
                <button type="submit" className="btn btn-secondary">
                    <Search size={15} /> Tìm
                </button>
            </form>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <SortableTh columnKey="username" sortConfig={sortConfig} onSort={requestSort}>
                                Tên đăng nhập
                            </SortableTh>
                            <SortableTh columnKey="fullName" sortConfig={sortConfig} onSort={requestSort}>
                                Họ và tên
                            </SortableTh>
                            <SortableTh columnKey="role" sortConfig={sortConfig} onSort={requestSort}>
                                Vai trò
                            </SortableTh>
                            <SortableTh columnKey="email" sortConfig={sortConfig} onSort={requestSort}>
                                Email
                            </SortableTh>
                            <SortableTh columnKey="phone" sortConfig={sortConfig} onSort={requestSort}>
                                Số điện thoại
                            </SortableTh>
                            <SortableTh columnKey="active" sortConfig={sortConfig} onSort={requestSort} align="center">
                                Trạng thái
                            </SortableTh>
                            <th style={{ width: 220, textAlign: 'center' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#6b7280' }}>Đang tải...</td></tr>
                        ) : sortedUsers.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>Không tìm thấy người dùng</td></tr>
                        ) : (
                            sortedUsers.map((u) => (
                                <tr key={u.id}>
                                    <td style={{ fontWeight: 600 }}>{u.username}</td>
                                    <td style={{ fontWeight: 500 }}>{u.fullName}</td>
                                    <td>{renderRoleBadge(u.role)}</td>
                                    <td>{u.email || '---'}</td>
                                    <td>{u.phone || '---'}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`}>
                                            {u.active ? 'Hoạt động' : 'Đã khóa'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'inline-flex', gap: 6 }}>
                                            <button onClick={() => openEditModal(u)} className="btn btn-secondary btn-sm" title="Chỉnh sửa">
                                                <Pencil size={13} /> Sửa
                                            </button>
                                            {u.username !== 'admin' && (
                                                <>
                                                    <button
                                                        onClick={() => handleToggle(u)}
                                                        className={`btn btn-sm ${u.active ? 'btn-outline' : 'btn-success'}`}
                                                        title={u.active ? 'Khóa tài khoản' : 'Mở khóa'}
                                                    >
                                                        {u.active ? <><Lock size={13} /> Khóa</> : <><Unlock size={13} /> Mở</>}
                                                    </button>
                                                    <button onClick={() => handleDelete(u)} className="btn btn-danger btn-sm" title="Xóa tài khoản">
                                                        <Trash2 size={13} /> Xóa
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={pageSize}
                pageSizeOptions={[25, 50, 100, 200]}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setPage(0);
                }}
            />

            {/* Modal Create/Edit User */}
            {modalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editingUser ? 'Sửa Thông Tin Người Dùng' : 'Thêm Người Dùng Mới'}</h3>
                            <button onClick={() => setModalOpen(false)} className="modal-close-btn" aria-label="Đóng">
                                <X size={18} />
                            </button>
                        </div>

                        {error && (
                            <div className="alert-banner alert-banner-danger">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Tên đăng nhập *</label>
                                    <input
                                        value={formUsername}
                                        onChange={(e) => {
                                            setFormUsername(e.target.value);
                                            if (fieldErrors.username) setFieldErrors(prev => ({ ...prev, username: '' }));
                                        }}
                                        className={fieldErrors.username ? 'is-invalid' : ''}
                                        placeholder="username..."
                                        disabled={!!editingUser}
                                        style={{ width: '100%' }}
                                    />
                                    {fieldErrors.username && (
                                        <span className="invalid-feedback">{fieldErrors.username}</span>
                                    )}
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                                        {editingUser ? 'Mật khẩu mới (bỏ trống nếu không đổi)' : 'Mật khẩu *'}
                                    </label>
                                    <input
                                        type="password"
                                        value={formPassword}
                                        onChange={(e) => {
                                            setFormPassword(e.target.value);
                                            if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                                        }}
                                        className={fieldErrors.password ? 'is-invalid' : ''}
                                        placeholder={editingUser ? 'Nhập mật khẩu mới...' : 'Tối thiểu 6 ký tự'}
                                        style={{ width: '100%' }}
                                    />
                                    {fieldErrors.password && (
                                        <span className="invalid-feedback">{fieldErrors.password}</span>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginBottom: 12 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Họ và tên *</label>
                                <input
                                    value={formFullName}
                                    onChange={(e) => {
                                        setFormFullName(e.target.value);
                                        if (fieldErrors.fullName) setFieldErrors(prev => ({ ...prev, fullName: '' }));
                                    }}
                                    className={fieldErrors.fullName ? 'is-invalid' : ''}
                                    placeholder="Nguyễn Văn A..."
                                    style={{ width: '100%' }}
                                />
                                {fieldErrors.fullName && (
                                    <span className="invalid-feedback">{fieldErrors.fullName}</span>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Email</label>
                                    <input
                                        type="email"
                                        value={formEmail}
                                        onChange={(e) => {
                                            setFormEmail(e.target.value);
                                            if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                                        }}
                                        className={fieldErrors.email ? 'is-invalid' : ''}
                                        placeholder="user@wms.com..."
                                        style={{ width: '100%' }}
                                    />
                                    {fieldErrors.email && (
                                        <span className="invalid-feedback">{fieldErrors.email}</span>
                                    )}
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Số điện thoại</label>
                                    <input
                                        value={formPhone}
                                        onChange={(e) => {
                                            setFormPhone(e.target.value);
                                            if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: '' }));
                                        }}
                                        className={fieldErrors.phone ? 'is-invalid' : ''}
                                        placeholder="09..."
                                        style={{ width: '100%' }}
                                    />
                                    {fieldErrors.phone && (
                                        <span className="invalid-feedback">{fieldErrors.phone}</span>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Phân vai trò *</label>
                                    <select
                                        value={formRole}
                                        onChange={(e) => setFormRole(e.target.value as Role)}
                                        disabled={editingUser?.username === 'admin'}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="ADMIN">ADMIN - Quản trị viên toàn quyền</option>
                                        <option value="MANAGER">MANAGER - Quản lý nghiệp vụ kho</option>
                                        <option value="STAFF">STAFF - Nhân viên kho</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Trạng thái</label>
                                    <select
                                        value={formActive ? 'true' : 'false'}
                                        onChange={(e) => setFormActive(e.target.value === 'true')}
                                        disabled={editingUser?.username === 'admin'}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="true">Hoạt động</option>
                                        <option value="false">Khóa tài khoản</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Hủy</button>
                                <button type="submit" disabled={submitting} className="btn btn-primary">
                                    {submitting ? 'Đang lưu...' : 'Lưu người dùng'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText}
                onConfirm={confirmModal.onConfirm}
                onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}