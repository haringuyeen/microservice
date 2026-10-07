import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft,
    Pencil,
    Trash2,
    Building2,
    Phone,
    Mail,
    MapPin,
    User,
    FileText,
    DollarSign,
    CheckCircle2,
    Clock,
    AlertCircle,
    ExternalLink
} from 'lucide-react';
import {
    getSupplierById,
    getSupplierReceipts,
    deleteSupplier
} from '../api/warehouseApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal, { type ConfirmType } from '../components/ConfirmModal';
import SupplierModal from '../components/SupplierModal';
import type { Supplier, ImportReceipt } from '../types/warehouse';
import type { ApiErrorResponse } from '../types/apiError';
import { useTableSort } from '../hooks/useTableSort';
import { SortableTh } from '../components/SortableTh';

export default function SupplierDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();
    const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';

    const [supplier, setSupplier] = useState<Supplier | null>(null);
    const [receipts, setReceipts] = useState<ImportReceipt[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Table sorting
    const { sortedItems: sortedReceipts, sortConfig, requestSort } = useTableSort<ImportReceipt>(
        receipts,
        'importDate',
        'desc'
    );

    // Edit modal
    const [modalOpen, setModalOpen] = useState(false);

    // Confirm Modal
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

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const [supRes, recRes] = await Promise.all([
                getSupplierById(Number(id)),
                getSupplierReceipts(Number(id))
            ]);
            setSupplier(supRes.data);
            setReceipts(recRes.data);
        } catch (err: unknown) {
            if (axios.isAxiosError<ApiErrorResponse>(err)) {
                setError(err.response?.data?.message || 'Không tìm thấy thông tin nhà cung cấp');
            } else {
                setError('Lỗi khi tải thông tin nhà cung cấp');
            }
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const openEditModal = () => {
        setModalOpen(true);
    };

    const handleDelete = () => {
        if (!supplier) return;
        setConfirmModal({
            isOpen: true,
            title: 'Xác nhận xóa nhà cung cấp',
            message: `Bạn có chắc chắn muốn xóa nhà cung cấp "${supplier.name}" (Mã: ${supplier.code})?\n\nLưu ý: Không thể xóa nhà cung cấp đang có phiếu nhập kho liên kết. Thao tác này không thể hoàn tác.`,
            type: 'danger',
            confirmText: 'Xóa nhà cung cấp',
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                    await deleteSupplier(supplier.id);
                    toast.success(`Đã xóa nhà cung cấp "${supplier.name}" thành công!`);
                    navigate('/suppliers');
                } catch (err: unknown) {
                    const errorMsg = axios.isAxiosError<ApiErrorResponse>(err)
                        ? err.response?.data?.message || 'Không thể xóa nhà cung cấp đang có phiếu nhập kho liên kết.'
                        : 'Không thể xóa nhà cung cấp';
                    toast.error(errorMsg, 'Xóa thất bại');
                }
            }
        });
    };

    const formatCurrency = (val?: number) => {
        if (val == null) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    const renderStatusBadge = (st: string) => {
        switch (st) {
            case 'PENDING':
                return <span className="badge badge-warning">Chờ duyệt</span>;
            case 'APPROVED':
            case 'COMPLETED':
                return <span className="badge badge-success">Đã duyệt</span>;
            case 'REJECTED':
                return <span className="badge badge-danger">Từ chối</span>;
            default:
                return <span className="badge">{st}</span>;
        }
    };

    if (loading) {
        return (
            <div className="page-wrapper" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                Đang tải thông tin chi tiết nhà cung cấp...
            </div>
        );
    }

    if (error || !supplier) {
        return (
            <div className="page-wrapper">
                <div style={{ marginBottom: 16 }}>
                    <Link to="/suppliers" className="btn btn-outline btn-sm">
                        <ArrowLeft size={15} />
                        <span>Quay lại danh sách</span>
                    </Link>
                </div>
                <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--danger)' }}>
                    <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>{error || 'Không tìm thấy nhà cung cấp'}</p>
                </div>
            </div>
        );
    }

    const totalReceiptsCount = receipts.length;
    const totalPurchaseValue = receipts.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const approvedCount = receipts.filter((r) => r.status === 'APPROVED' || r.status === 'COMPLETED').length;
    const pendingCount = receipts.filter((r) => r.status === 'PENDING').length;

    return (
        <div className="page-wrapper">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link to="/suppliers" className="btn btn-outline btn-sm" title="Quay lại danh sách nhà cung cấp">
                        <ArrowLeft size={16} />
                        <span>Quay lại</span>
                    </Link>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <h1 style={{ margin: 0, fontSize: 22 }}>{supplier.name}</h1>
                            <span className="badge badge-info" style={{ fontSize: 13, fontFamily: 'var(--mono)' }}>{supplier.code}</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                            Người liên hệ: <strong>{supplier.contactPerson || 'Chưa cập nhật'}</strong> • SĐT: <strong>{supplier.phone}</strong>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                {canManage && (
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={openEditModal} className="btn btn-secondary" title="Sửa thông tin">
                            <Pencil size={15} />
                            <span>Chỉnh sửa</span>
                        </button>
                        <button onClick={handleDelete} className="btn btn-danger" title="Xóa nhà cung cấp">
                            <Trash2 size={15} />
                            <span>Xóa</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Info Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, marginBottom: 22 }}>
                {/* Contact Card */}
                <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15, marginBottom: 14, color: 'var(--text-h)' }}>
                        <Building2 size={18} color="var(--accent)" />
                        <span>Thông Tin Liên Hệ</span>
                    </div>

                    <div style={{ display: 'grid', gap: 10, fontSize: 13.5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <User size={16} color="var(--text-muted)" />
                            <span style={{ color: 'var(--text-muted)', width: 110 }}>Người đại diện:</span>
                            <span style={{ fontWeight: 600 }}>{supplier.contactPerson || '---'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Phone size={16} color="var(--text-muted)" />
                            <span style={{ color: 'var(--text-muted)', width: 110 }}>Số điện thoại:</span>
                            <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{supplier.phone}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Mail size={16} color="var(--text-muted)" />
                            <span style={{ color: 'var(--text-muted)', width: 110 }}>Email:</span>
                            <span>{supplier.email || '---'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <MapPin size={16} color="var(--text-muted)" style={{ marginTop: 2 }} />
                            <span style={{ color: 'var(--text-muted)', width: 110 }}>Địa chỉ trụ sở:</span>
                            <span>{supplier.address || '---'}</span>
                        </div>
                    </div>
                </div>

                {/* Transaction Stats Card */}
                <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15, marginBottom: 14, color: 'var(--text-h)' }}>
                        <DollarSign size={18} color="var(--accent)" />
                        <span>Thống Kê Nhập Hàng</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 12 }}>
                        <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Tổng số đợt nhập</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-h)' }}>
                                {totalReceiptsCount} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>phiếu</span>
                            </div>
                        </div>

                        <div style={{ padding: 12, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                            <div style={{ fontSize: 12, color: '#1e40af', marginBottom: 2 }}>Tổng tiền hàng đã nhập</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
                                {formatCurrency(totalPurchaseValue)}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1, padding: 10, background: '#f0fdf4', borderRadius: 6, border: '1px solid var(--success-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CheckCircle2 size={16} color="var(--success)" />
                            <div>
                                <div style={{ fontSize: 11, color: '#166534' }}>Phiếu đã duyệt</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--success)' }}>{approvedCount}</div>
                            </div>
                        </div>

                        <div style={{ flex: 1, padding: 10, background: 'var(--warning-bg)', borderRadius: 6, border: '1px solid var(--warning-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Clock size={16} color="#d97706" />
                            <div>
                                <div style={{ fontSize: 11, color: '#92400e' }}>Chờ phê duyệt</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#d97706' }}>{pendingCount}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Import Receipts History Table */}
            <div className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={18} color="var(--accent)" />
                        <h3 style={{ margin: 0, fontSize: 16 }}>Lịch Sử Các Đợt Nhập Hàng ({totalReceiptsCount})</h3>
                    </div>
                </div>

                <div className="table-container" style={{ margin: 0 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <SortableTh columnKey="code" sortConfig={sortConfig} onSort={requestSort} style={{ width: 190, minWidth: 185 }}>
                                    Mã phiếu
                                </SortableTh>
                                <SortableTh columnKey="importDate" sortConfig={sortConfig} onSort={requestSort} style={{ width: 160 }}>
                                    Ngày nhập
                                </SortableTh>
                                <SortableTh columnKey="creatorName" sortConfig={sortConfig} onSort={requestSort}>
                                    Người lập
                                </SortableTh>
                                <SortableTh columnKey="totalAmount" sortConfig={sortConfig} onSort={requestSort} align="right" style={{ width: 140 }}>
                                    Tổng tiền
                                </SortableTh>
                                <SortableTh columnKey="status" sortConfig={sortConfig} onSort={requestSort} align="center" style={{ width: 120 }}>
                                    Trạng thái
                                </SortableTh>
                                <SortableTh columnKey="approverName" sortConfig={sortConfig} onSort={requestSort}>
                                    Người duyệt
                                </SortableTh>
                                <th style={{ width: 80, textAlign: 'center' }}>Xem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {receipts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                                        Chưa có phiếu nhập kho nào từ nhà cung cấp này
                                    </td>
                                </tr>
                            ) : (
                                sortedReceipts.map((r) => (
                                    <tr
                                        key={r.id}
                                        onClick={() => navigate(`/import-receipts/${r.id}`)}
                                        style={{ cursor: 'pointer' }}
                                        title="Click để xem chi tiết phiếu nhập"
                                    >
                                        <td style={{ fontWeight: 600, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                                            {r.code}
                                        </td>
                                        <td>{new Date(r.importDate).toLocaleString('vi-VN')}</td>
                                        <td>{r.creatorName}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(r.totalAmount)}</td>
                                        <td style={{ textAlign: 'center' }}>{renderStatusBadge(r.status)}</td>
                                        <td>{r.approverName || '---'}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{ color: 'var(--accent)' }}>
                                                <ExternalLink size={15} />
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Edit Supplier */}
            <SupplierModal
                isOpen={modalOpen}
                supplier={supplier}
                onClose={() => setModalOpen(false)}
                onSuccess={() => {
                    setModalOpen(false);
                    fetchData();
                }}
            />

            {/* Confirm Modal */}
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
