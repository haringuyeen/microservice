import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft,
    Printer,
    Check,
    Ban,
    Pencil,
    Trash2,
    Building2,
    User,
    CheckCircle2,
    AlertCircle,
    X,
    Plus
} from 'lucide-react';
import {
    getExportReceiptById,
    approveExportReceipt,
    rejectExportReceipt,
    deleteExportReceipt,
    updateExportReceipt,
    getAllCustomers,
    getAllProducts
} from '../api/warehouseApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PrintReceiptModal from '../components/PrintReceiptModal';
import ConfirmModal, { type ConfirmType } from '../components/ConfirmModal';
import SearchableSelect from '../components/SearchableSelect';
import CustomerModal from '../components/CustomerModal';
import { getErrorMessage, getFieldErrors } from '../utils/errorHandler';
import type { ExportReceipt, ExportReceiptDetail, Customer, Product } from '../types/warehouse';
import type { ApiErrorResponse } from '../types/apiError';
import { useTableSort } from '../hooks/useTableSort';
import { SortableTh } from '../components/SortableTh';

export default function ExportReceiptDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();
    const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

    const [receipt, setReceipt] = useState<ExportReceipt | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Sort items table
    const details = useMemo(() => receipt?.details || [], [receipt?.details]);
    const { sortedItems: sortedDetails, sortConfig, requestSort } = useTableSort<ExportReceiptDetail>(
        details
    );

    // Print Modal
    const [printModalOpen, setPrintModalOpen] = useState(false);

    // Edit Modal
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0);
    const [exportDate, setExportDate] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<ExportReceiptDetail[]>([]);
    const [editingPriceIndex, setEditingPriceIndex] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [quickCustomerOpen, setQuickCustomerOpen] = useState(false);

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

    const fetchReceipt = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const res = await getExportReceiptById(Number(id));
            setReceipt(res.data);
        } catch (err: unknown) {
            if (axios.isAxiosError<ApiErrorResponse>(err)) {
                setError(err.response?.data?.message || 'Không tìm thấy phiếu xuất kho');
            } else {
                setError('Lỗi khi tải thông tin phiếu xuất');
            }
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchReceipt();
    }, [fetchReceipt]);

    const openEditModal = async () => {
        if (!receipt) return;
        try {
            const [cusRes, prodRes] = await Promise.all([getAllCustomers(), getAllProducts()]);
            setCustomers(cusRes.data);
            setProducts(prodRes.data);
            setSelectedCustomerId(receipt.customerId);
            setExportDate(receipt.exportDate ? receipt.exportDate.slice(0, 16) : '');
            setNotes(receipt.notes || '');
            setFormError(null);
            setFieldErrors({});
            setEditingPriceIndex(null);
            setItems((receipt.details || []).map((d) => ({
                id: d.id,
                productId: d.productId,
                productCode: d.productCode,
                productName: d.productName,
                unit: d.unit,
                quantity: d.quantity,
                unitPrice: d.unitPrice != null ? Number(d.unitPrice) : 0
            })));
            setEditModalOpen(true);
        } catch (e) {
            console.error(e);
            toast.error('Không thể tải danh sách sản phẩm và khách hàng');
        }
    };

    const handleCustomerChange = (id: number) => {
        setSelectedCustomerId(id);
        if (fieldErrors.customerId) {
            setFieldErrors((prev) => ({ ...prev, customerId: '' }));
        }
        if (formError) {
            setFormError(null);
        }
    };

    const handleQuickCustomerSuccess = (newCustomer: Customer) => {
        setCustomers((prev) => {
            if (prev.some((c) => c.id === newCustomer.id)) return prev;
            return [...prev, newCustomer];
        });
        setSelectedCustomerId(newCustomer.id);
        setFieldErrors((prev) => ({ ...prev, customerId: '' }));
        setFormError(null);
        toast.success(`Đã thêm khách hàng "${newCustomer.name}" và chọn cho phiếu!`);
    };

    const handleItemQuantityChange = (idx: number, qty: number) => {
        const newItems = [...items];
        newItems[idx].quantity = qty;
        setItems(newItems);
        if (fieldErrors.quantity) {
            setFieldErrors((prev) => ({ ...prev, quantity: '' }));
        }
    };

    const handleItemPriceChange = (idx: number, price: number) => {
        const newItems = [...items];
        newItems[idx].unitPrice = price;
        setItems(newItems);
        if (fieldErrors.unitPrice) {
            setFieldErrors((prev) => ({ ...prev, unitPrice: '' }));
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!receipt) return;
        setFormError(null);

        const newErrors: Record<string, string> = {};

        if (!selectedCustomerId || selectedCustomerId === 0) {
            newErrors.customerId = 'Vui lòng tìm và chọn khách hàng';
        }

        if (items.length === 0) {
            newErrors.items = 'Vui lòng chọn ít nhất 1 sản phẩm';
        }

        for (let i = 0; i < items.length; i++) {
            const it = items[i];
            if (!it.productId || it.productId === 0) {
                newErrors.items = `Vui lòng chọn sản phẩm cho dòng số ${i + 1}`;
                break;
            }
            const prod = products.find((p) => p.id === it.productId);
            const name = prod?.name || `dòng ${i + 1}`;
            if (!it.quantity || it.quantity <= 0) {
                newErrors.quantity = `Số lượng của "${name}" phải lớn hơn 0`;
                break;
            }
            if (it.unitPrice < 0) {
                newErrors.unitPrice = `Đơn giá của "${name}" không được âm`;
                break;
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            const firstMsg = Object.values(newErrors)[0];
            setFormError(firstMsg);
            toast.error(firstMsg, 'Dữ liệu không hợp lệ');
            return;
        }

        setFieldErrors({});
        setSubmitting(true);

        const payload: Partial<ExportReceipt> = {
            customerId: selectedCustomerId,
            exportDate: exportDate ? `${exportDate}:00` : undefined,
            notes: notes.trim() || undefined,
            status: receipt.status,
            details: items
        };

        try {
            await updateExportReceipt(receipt.id, payload);
            toast.success(`Cập nhật phiếu xuất "${receipt.code}" thành công!`);
            setEditModalOpen(false);
            fetchReceipt();
        } catch (err: unknown) {
            const errorMsg = getErrorMessage(err, 'Lỗi khi cập nhật phiếu xuất');
            const backendFieldErrors = getFieldErrors(err);
            if (backendFieldErrors) {
                setFieldErrors(backendFieldErrors);
            }
            setFormError(errorMsg);
            toast.error(errorMsg, 'Lỗi cập nhật phiếu xuất');
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = () => {
        if (!receipt) return;
        setConfirmModal({
            isOpen: true,
            title: 'Xác nhận duyệt phiếu xuất',
            message: `Xác nhận DUYỆT phiếu xuất "${receipt.code}"?\n\nSố lượng tồn kho sẽ được trừ trực tiếp khỏi hệ thống.`,
            type: 'success',
            confirmText: 'Duyệt phiếu',
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                    await approveExportReceipt(receipt.id);
                    toast.success(`Duyệt phiếu xuất "${receipt.code}" thành công! Tồn kho đã được trừ.`);
                    fetchReceipt();
                } catch (err: unknown) {
                    const errorMsg = axios.isAxiosError<ApiErrorResponse>(err)
                        ? err.response?.data?.message || 'Không thể duyệt phiếu xuất'
                        : 'Lỗi khi duyệt phiếu';
                    toast.error(errorMsg, 'Duyệt phiếu thất bại');
                }
            }
        });
    };

    const handleReject = () => {
        if (!receipt) return;
        setConfirmModal({
            isOpen: true,
            title: 'Từ chối duyệt phiếu xuất',
            message: `Xác nhận TỪ CHỐI duyệt phiếu xuất "${receipt.code}"?\n\nPhiếu sẽ chuyển sang trạng thái "Từ chối" và không trừ tồn kho.`,
            type: 'warning',
            confirmText: 'Từ chối duyệt',
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                    await rejectExportReceipt(receipt.id);
                    toast.warning(`Đã từ chối duyệt phiếu xuất "${receipt.code}".`);
                    fetchReceipt();
                } catch (err: unknown) {
                    const errorMsg = axios.isAxiosError<ApiErrorResponse>(err)
                        ? err.response?.data?.message || 'Không thể từ chối phiếu xuất'
                        : 'Lỗi khi từ chối phiếu';
                    toast.error(errorMsg, 'Từ chối thất bại');
                }
            }
        });
    };

    const handleDelete = () => {
        if (!receipt) return;
        const isApproved = receipt.status === 'APPROVED' || receipt.status === 'COMPLETED';
        const msg = isApproved
            ? `CẢNH BÁO: Phiếu xuất "${receipt.code}" đã được duyệt!\n\nNếu xóa, hệ thống sẽ tự động HOÀN TRẢ lại tồn kho tương ứng.\nBạn có chắc chắn muốn xóa không?`
            : `Bạn có chắc chắn muốn xóa phiếu xuất "${receipt.code}"?\n\nThao tác này không thể hoàn tác.`;

        setConfirmModal({
            isOpen: true,
            title: 'Xác nhận xóa phiếu xuất',
            message: msg,
            type: 'danger',
            confirmText: 'Xóa phiếu',
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                    await deleteExportReceipt(receipt.id);
                    toast.success(`Đã xóa phiếu xuất "${receipt.code}" thành công!`);
                    navigate('/export-receipts');
                } catch (err: unknown) {
                    const errorMsg = axios.isAxiosError<ApiErrorResponse>(err)
                        ? err.response?.data?.message || 'Không thể xóa phiếu xuất'
                        : 'Lỗi khi xóa phiếu';
                    toast.error(errorMsg, 'Xóa phiếu thất bại');
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
                return <span className="badge badge-warning" style={{ fontSize: 13, padding: '4px 10px' }}>Chờ duyệt</span>;
            case 'APPROVED':
            case 'COMPLETED':
                return <span className="badge badge-success" style={{ fontSize: 13, padding: '4px 10px' }}>Đã duyệt</span>;
            case 'REJECTED':
                return <span className="badge badge-danger" style={{ fontSize: 13, padding: '4px 10px' }}>Từ chối</span>;
            case 'CANCELLED':
                return <span className="badge" style={{ fontSize: 13, padding: '4px 10px', backgroundColor: '#f1f5f9', color: '#64748b' }}>Đã hủy</span>;
            default:
                return <span className="badge">{st}</span>;
        }
    };

    if (loading) {
        return (
            <div className="page-wrapper" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                Đang tải thông tin chi tiết phiếu xuất...
            </div>
        );
    }

    if (error || !receipt) {
        return (
            <div className="page-wrapper">
                <div style={{ marginBottom: 16 }}>
                    <Link to="/export-receipts" className="btn btn-outline btn-sm">
                        <ArrowLeft size={15} />
                        <span>Quay lại danh sách</span>
                    </Link>
                </div>
                <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--danger)' }}>
                    <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>{error || 'Không tìm thấy chứng từ'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrapper">
            {/* Top Navigation & Action Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link to="/export-receipts" className="btn btn-outline btn-sm" title="Quay lại danh sách">
                        <ArrowLeft size={16} />
                        <span>Quay lại</span>
                    </Link>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <h1 style={{ margin: 0, fontSize: 22 }}>Phiếu Xuất Kho: {receipt.code}</h1>
                            {renderStatusBadge(receipt.status)}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                            Ngày xuất: {new Date(receipt.exportDate).toLocaleString('vi-VN')}
                        </div>
                    </div>
                </div>

                {/* Actions Toolbar */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Nút In phiếu đặt trong trang chi tiết */}
                    <button onClick={() => setPrintModalOpen(true)} className="btn btn-primary" title="In phiếu xuất kho">
                        <Printer size={16} />
                        <span>In chứng từ</span>
                    </button>

                    {/* Duyệt & Từ chối */}
                    {isManagerOrAdmin && receipt.status === 'PENDING' && (
                        <>
                            <button onClick={handleApprove} className="btn btn-success" title="Duyệt phiếu và trừ tồn kho" style={{ padding: '8px 12px' }}>
                                <Check size={16} />
                            </button>
                            <button
                                onClick={handleReject}
                                className="btn btn-outline"
                                style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)', padding: '8px 12px' }}
                                title="Từ chối duyệt"
                            >
                                <Ban size={16} />
                            </button>
                        </>
                    )}

                    {/* Sửa phiếu */}
                    {(receipt.status === 'PENDING' || (isManagerOrAdmin && (receipt.status === 'APPROVED' || receipt.status === 'COMPLETED'))) && (
                        <button onClick={openEditModal} className="btn btn-secondary" title="Sửa thông tin phiếu" style={{ padding: '8px 12px' }}>
                            <Pencil size={16} />
                        </button>
                    )}

                    {/* Xóa phiếu */}
                    {isManagerOrAdmin && (
                        <button onClick={handleDelete} className="btn btn-danger" title="Xóa phiếu xuất" style={{ padding: '8px 12px' }}>
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Information Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 20 }}>
                {/* Thông tin khách hàng */}
                <div className="card" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15, marginBottom: 12, color: 'var(--text-h)' }}>
                        <Building2 size={18} color="var(--success)" />
                        <span>Thông Tin Khách Hàng</span>
                    </div>
                    <div style={{ display: 'grid', gap: 6, fontSize: 13.5 }}>
                        <div><strong>Khách hàng:</strong> {receipt.customerName}</div>
                        <div><strong>Mã KH:</strong> <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{receipt.customerCode}</span></div>
                        <div><strong>Điện thoại:</strong> {receipt.customerPhone || '---'}</div>
                        <div><strong>Địa chỉ giao:</strong> {receipt.customerAddress || '---'}</div>
                    </div>
                </div>

                {/* Thông tin chứng từ & duyệt */}
                <div className="card" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15, marginBottom: 12, color: 'var(--text-h)' }}>
                        <User size={18} color="var(--success)" />
                        <span>Người Lập & Phê Duyệt</span>
                    </div>
                    <div style={{ display: 'grid', gap: 6, fontSize: 13.5 }}>
                        <div><strong>Người tạo:</strong> {receipt.creatorName}</div>
                        <div><strong>Ngày tạo:</strong> {new Date(receipt.exportDate).toLocaleString('vi-VN')}</div>
                        {receipt.approverName ? (
                            <>
                                <div style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <CheckCircle2 size={15} />
                                    <span>Người duyệt: {receipt.approverName}</span>
                                </div>
                                {receipt.approvedAt && (
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        Thời gian duyệt: {new Date(receipt.approvedAt).toLocaleString('vi-VN')}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ color: 'var(--warning)', fontStyle: 'italic' }}>Chưa có người duyệt (đang chờ duyệt)</div>
                        )}
                        <div><strong>Ghi chú:</strong> {receipt.notes || 'Không có ghi chú'}</div>
                    </div>
                </div>
            </div>

            {/* Line Items Table */}
            <div className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ margin: 0, fontSize: 16 }}>Danh Sách Mặt Hàng Xuất ({receipt.details?.length || 0} sản phẩm)</h3>
                </div>

                <div className="table-container" style={{ margin: 0 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: 50, textAlign: 'center' }}>STT</th>
                                <SortableTh columnKey="productCode" sortConfig={sortConfig} onSort={requestSort} style={{ width: 140 }}>
                                    Mã sản phẩm
                                </SortableTh>
                                <SortableTh columnKey="productName" sortConfig={sortConfig} onSort={requestSort}>
                                    Tên hàng hóa / sản phẩm
                                </SortableTh>
                                <SortableTh columnKey="unit" sortConfig={sortConfig} onSort={requestSort} align="center" style={{ width: 90 }}>
                                    ĐVT
                                </SortableTh>
                                <SortableTh columnKey="quantity" sortConfig={sortConfig} onSort={requestSort} align="right" style={{ width: 110 }}>
                                    Số lượng
                                </SortableTh>
                                <SortableTh columnKey="unitPrice" sortConfig={sortConfig} onSort={requestSort} align="right" style={{ width: 150 }}>
                                    Đơn giá
                                </SortableTh>
                                <SortableTh columnKey="totalPrice" sortConfig={sortConfig} onSort={requestSort} align="right" style={{ width: 170 }}>
                                    Thành tiền
                                </SortableTh>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedDetails.map((item, idx) => (
                                <tr key={item.id || idx}>
                                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{idx + 1}</td>
                                    <td style={{ fontWeight: 600, fontFamily: 'var(--mono)' }}>{item.productCode}</td>
                                    <td style={{ fontWeight: 500 }}>{item.productName}</td>
                                    <td style={{ textAlign: 'center' }}>{item.unit}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.quantity}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                                        {formatCurrency(item.totalPrice || item.quantity * item.unitPrice)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                                <td colSpan={4} style={{ textAlign: 'right', padding: '14px', fontSize: 15 }}>
                                    TỔNG CỘNG TIỀN XUẤT:
                                </td>
                                <td style={{ textAlign: 'right', padding: '14px', fontSize: 15, fontWeight: 700 }}>
                                    {receipt.details?.reduce((s, it) => s + (it.quantity || 0), 0)}
                                </td>
                                <td></td>
                                <td style={{ textAlign: 'right', padding: '14px', color: 'var(--success)', fontSize: 18, fontWeight: 800 }}>
                                    {formatCurrency(receipt.totalAmount)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Print Modal */}
            {printModalOpen && (
                <PrintReceiptModal
                    receipt={receipt}
                    type="EXPORT"
                    onClose={() => setPrintModalOpen(false)}
                />
            )}

            {/* Edit Modal */}
            {editModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content modal-lg">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ margin: 0 }}>Chỉnh Sửa Phiếu Xuất: {receipt.code}</h3>
                            <button onClick={() => setEditModalOpen(false)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                                <X size={15} />
                            </button>
                        </div>

                        {formError && (
                            <div style={{ padding: '8px 12px', borderRadius: 6, backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <AlertCircle size={15} />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form onSubmit={handleFormSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Khách hàng *</label>
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <SearchableSelect
                                                options={customers.map((c) => ({
                                                    value: c.id,
                                                    label: c.name,
                                                    subLabel: c.code,
                                                    tag: c.phone ? `SĐT: ${c.phone}` : undefined,
                                                }))}
                                                value={selectedCustomerId || undefined}
                                                onChange={(val) => handleCustomerChange(Number(val) || 0)}
                                                placeholder="-- Gõ để tìm & chọn khách hàng --"
                                                searchPlaceholder="Nhập tên, mã khách hàng hoặc SĐT..."
                                                clearable={false}
                                                disabled={submitting}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setQuickCustomerOpen(true)}
                                            className="btn btn-outline"
                                            style={{
                                                padding: 0,
                                                width: 38,
                                                height: 38,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}
                                            title="Tạo khách hàng mới"
                                            disabled={submitting}
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    {fieldErrors.customerId && (
                                        <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>
                                            {fieldErrors.customerId}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Thời gian xuất</label>
                                    <input
                                        type="datetime-local"
                                        value={exportDate}
                                        onChange={(e) => setExportDate(e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: 14 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Ghi chú xuất kho</label>
                                <input
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <strong style={{ fontSize: 14 }}>Danh sách sản phẩm xuất</strong>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setItems([...items, {
                                                productId: 0,
                                                productCode: '',
                                                productName: '',
                                                unit: '',
                                                quantity: 1,
                                                unitPrice: 0
                                            }]);
                                            setEditingPriceIndex(null);
                                            if (fieldErrors.items) {
                                                setFieldErrors((prev) => ({ ...prev, items: '' }));
                                            }
                                        }}
                                        className="btn btn-outline btn-sm"
                                    >
                                        + Thêm dòng sản phẩm
                                    </button>
                                </div>
                                {fieldErrors.items && (
                                    <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 8 }}>
                                        {fieldErrors.items}
                                    </div>
                                )}

                                <div className="table-container" style={{ margin: 0, overflow: 'visible', minHeight: 180 }}>
                                    <table className="data-table modal-table" style={{ fontSize: 13, width: '100%' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ width: 45, textAlign: 'center' }}>STT</th>
                                                <th style={{ minWidth: 260 }}>Sản phẩm (Tồn hiện có)</th>
                                                <th style={{ width: 70, textAlign: 'center' }}>ĐVT</th>
                                                <th style={{ width: 90, textAlign: 'center' }}>Số lượng</th>
                                                <th style={{ width: 135, textAlign: 'right' }}>Đơn giá</th>
                                                <th style={{ width: 135, textAlign: 'right' }}>Thành tiền</th>
                                                <th style={{ width: 45, textAlign: 'center' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                                                    <td style={{ minWidth: 260 }}>
                                                        <SearchableSelect
                                                            options={products.map((p) => ({
                                                                value: p.id,
                                                                label: p.name,
                                                                subLabel: p.code,
                                                                tag: p.stockQuantity <= 0 ? 'Hết hàng (Tồn: 0)' : `Tồn: ${p.stockQuantity} ${p.unit}`
                                                            }))}
                                                            value={item.productId || undefined}
                                                            onChange={(val) => {
                                                                const prod = products.find((p) => p.id === Number(val));
                                                                if (!prod) return;
                                                                const newItems = [...items];
                                                                newItems[idx] = {
                                                                    ...newItems[idx],
                                                                    productId: prod.id,
                                                                    productCode: prod.code,
                                                                    productName: prod.name,
                                                                    unit: prod.unit,
                                                                    unitPrice: prod.exportPrice != null ? Number(prod.exportPrice) : 0
                                                                };
                                                                setItems(newItems);
                                                                if (editingPriceIndex === idx) setEditingPriceIndex(null);
                                                                if (fieldErrors.items) {
                                                                    setFieldErrors((prev) => ({ ...prev, items: '' }));
                                                                }
                                                            }}
                                                            placeholder="--- Chọn sản phẩm ---"
                                                            searchPlaceholder="Nhập tên hoặc mã sản phẩm..."
                                                            clearable={false}
                                                            disabled={submitting}
                                                        />
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>{item.productId ? item.unit : '-'}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={item.quantity}
                                                            onChange={(e) => handleItemQuantityChange(idx, Number(e.target.value))}
                                                            className={`form-control ${item.productId > 0 && item.quantity <= 0 ? 'is-invalid' : ''}`}
                                                            style={{ width: 70, textAlign: 'center', fontSize: 13, padding: '5px 6px', margin: '0 auto', display: 'block' }}
                                                            required
                                                            disabled={!item.productId || submitting}
                                                        />
                                                        {item.productId > 0 && item.quantity <= 0 ? (
                                                            <small style={{ color: 'var(--danger)', fontSize: 11, display: 'block', marginTop: 2 }}>
                                                                SL &gt; 0
                                                            </small>
                                                        ) : null}
                                                    </td>
                                                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                        {!item.productId ? (
                                                            <span style={{ color: 'var(--text-muted)' }}>-</span>
                                                        ) : editingPriceIndex === idx ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    value={item.unitPrice}
                                                                    onChange={(e) => handleItemPriceChange(idx, Number(e.target.value))}
                                                                    className={`form-control ${item.unitPrice < 0 ? 'is-invalid' : ''}`}
                                                                    style={{ width: 100, fontSize: 13, padding: '4px 6px', textAlign: 'right' }}
                                                                    autoFocus
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter' || e.key === 'Escape') {
                                                                            e.preventDefault();
                                                                            setEditingPriceIndex(null);
                                                                        }
                                                                    }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditingPriceIndex(null)}
                                                                    className="btn btn-secondary btn-sm"
                                                                    style={{ padding: '4px 6px', fontSize: 11 }}
                                                                    title="Xong"
                                                                >
                                                                    <Check size={13} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                                                <span style={{ fontWeight: 600, color: 'var(--text-h)' }}>
                                                                    {formatCurrency(item.unitPrice)}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditingPriceIndex(idx)}
                                                                    style={{
                                                                        background: 'none',
                                                                        border: 'none',
                                                                        cursor: 'pointer',
                                                                        color: 'var(--text-muted)',
                                                                        padding: '2px 4px',
                                                                        borderRadius: 4,
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center'
                                                                    }}
                                                                    title="Tùy chỉnh đơn giá (nếu khác giá niêm yết)"
                                                                >
                                                                    <Pencil size={12} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                        {item.productId ? formatCurrency((item.quantity || 0) * (item.unitPrice || 0)) : '-'}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (items.length <= 1) {
                                                                    alert('Phiếu xuất phải có ít nhất 1 sản phẩm');
                                                                    return;
                                                                }
                                                                setItems(items.filter((_, i) => i !== idx));
                                                                if (editingPriceIndex === idx) setEditingPriceIndex(null);
                                                            }}
                                                            className="btn btn-outline btn-sm"
                                                            style={{ padding: '3px 6px', color: 'var(--danger)', borderColor: '#fca5a5' }}
                                                            title="Xóa dòng"
                                                        >
                                                            <X size={13} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                <button type="button" onClick={() => setEditModalOpen(false)} className="btn btn-secondary">Đóng</button>
                                <button type="submit" disabled={submitting} className="btn btn-success">
                                    {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
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

            {/* Quick Customer Creation Modal */}
            <CustomerModal
                isOpen={quickCustomerOpen}
                onClose={() => setQuickCustomerOpen(false)}
                onSuccess={handleQuickCustomerSuccess}
                zIndex={1100}
            />
        </div>
    );
}
