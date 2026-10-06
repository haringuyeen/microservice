import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Filter, RotateCcw, X, AlertCircle, Check, Ban, Pencil, Trash2 } from 'lucide-react';
import {
    getExportReceipts,
    getAllCustomers,
    getAllProducts,
    createExportReceipt,
    updateExportReceipt,
    deleteExportReceipt,
    approveExportReceipt,
    rejectExportReceipt
} from '../api/warehouseApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Pagination from '../components/Pagination';
import ConfirmModal, { type ConfirmType } from '../components/ConfirmModal';
import SearchableSelect from '../components/SearchableSelect';
import { getLocalDateTimeString } from '../utils/dateUtils';
import CustomerModal from '../components/CustomerModal';
import { getErrorMessage, getFieldErrors } from '../utils/errorHandler';
import type { ExportReceipt, ExportReceiptDetail, Customer, Product } from '../types/warehouse';
import type { ApiErrorResponse } from '../types/apiError';
import { useTableSort } from '../hooks/useTableSort';
import { SortableTh } from '../components/SortableTh';

export default function ExportReceiptsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();
    const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

    const [receipts, setReceipts] = useState<ExportReceipt[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(25);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    // Table sorting
    const { sortedItems: sortedReceipts, sortConfig, requestSort } = useTableSort<ExportReceipt>(
        receipts,
        'exportDate',
        'desc'
    );

    // Filters
    const [keyword, setKeyword] = useState('');
    const [customerId, setCustomerId] = useState<number | undefined>(undefined);
    const [status, setStatus] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Modal Create / Edit Receipt
    const [modalOpen, setModalOpen] = useState(false);
    const [editingReceipt, setEditingReceipt] = useState<ExportReceipt | null>(null);
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

    const fetchDropdowns = async () => {
        try {
            const [cusRes, prodRes] = await Promise.all([getAllCustomers(), getAllProducts()]);
            setCustomers(cusRes.data);
            setProducts(prodRes.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchReceipts = useCallback(async () => {
        setLoading(true);
        try {
            const fromIso = fromDate ? `${fromDate}T00:00:00` : undefined;
            const toIso = toDate ? `${toDate}T23:59:59` : undefined;

            const res = await getExportReceipts({
                keyword: keyword.trim() || undefined,
                customerId,
                status: status || undefined,
                fromDate: fromIso,
                toDate: toIso,
                page,
                size: pageSize
            });
            setReceipts(res.data.content);
            setTotalPages(res.data.totalPages);
            setTotalElements(res.data.totalElements);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [keyword, customerId, status, fromDate, toDate, page, pageSize]);

    useEffect(() => {
        fetchDropdowns();
    }, []);

    useEffect(() => {
        fetchReceipts();
    }, [fetchReceipts]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        fetchReceipts();
    };

    const handleReset = () => {
        setKeyword('');
        setCustomerId(undefined);
        setStatus('');
        setFromDate('');
        setToDate('');
        setPage(0);
    };

    const openCreateModal = () => {
        setEditingReceipt(null);
        setSelectedCustomerId(0);
        setExportDate(getLocalDateTimeString());
        setNotes('');
        setFormError(null);
        setFieldErrors({});

        setItems([
            {
                productId: 0,
                productCode: '',
                productName: '',
                unit: '',
                quantity: 1,
                unitPrice: 0
            }
        ]);
        setEditingPriceIndex(null);
        setModalOpen(true);
    };

    const openEditModal = (r: ExportReceipt) => {
        setEditingReceipt(r);
        setSelectedCustomerId(r.customerId);
        setExportDate(r.exportDate ? r.exportDate.slice(0, 16) : getLocalDateTimeString());
        setNotes(r.notes || '');
        setFormError(null);
        setFieldErrors({});
        setEditingPriceIndex(null);

        if (r.details && r.details.length > 0) {
            setItems(r.details.map((d) => ({
                id: d.id,
                productId: d.productId,
                productCode: d.productCode,
                productName: d.productName,
                unit: d.unit,
                quantity: d.quantity,
                unitPrice: d.unitPrice != null ? Number(d.unitPrice) : 0
            })));
        } else {
            setItems([]);
        }
        setModalOpen(true);
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

    const addItemRow = () => {
        setItems([
            ...items,
            {
                productId: 0,
                productCode: '',
                productName: '',
                unit: '',
                quantity: 1,
                unitPrice: 0
            }
        ]);
        setEditingPriceIndex(null);
        if (fieldErrors.items) {
            setFieldErrors((prev) => ({ ...prev, items: '' }));
        }
    };

    const removeItemRow = (index: number) => {
        if (items.length <= 1) {
            toast.warning('Phiếu xuất phải có ít nhất 1 sản phẩm');
            return;
        }
        setItems(items.filter((_, i) => i !== index));
        if (editingPriceIndex === index) {
            setEditingPriceIndex(null);
        }
    };

    const handleItemProductChange = (index: number, productId: number) => {
        const prod = products.find((p) => p.id === productId);
        if (!prod) return;
        const newItems = [...items];
        newItems[index] = {
            ...newItems[index],
            productId: prod.id,
            productCode: prod.code,
            productName: prod.name,
            unit: prod.unit,
            unitPrice: prod.exportPrice != null ? Number(prod.exportPrice) : 0
        };
        setItems(newItems);
        if (editingPriceIndex === index) {
            setEditingPriceIndex(null);
        }
        if (fieldErrors.items) {
            setFieldErrors((prev) => ({ ...prev, items: '' }));
        }
    };

    const handleItemQuantityChange = (index: number, qty: number) => {
        const newItems = [...items];
        newItems[index].quantity = qty;
        setItems(newItems);
        if (fieldErrors.quantity) {
            setFieldErrors((prev) => ({ ...prev, quantity: '' }));
        }
    };

    const handleItemPriceChange = (index: number, price: number) => {
        const newItems = [...items];
        newItems[index].unitPrice = price;
        setItems(newItems);
        if (fieldErrors.unitPrice) {
            setFieldErrors((prev) => ({ ...prev, unitPrice: '' }));
        }
    };

    const calculateGrandTotal = () => {
        return items.reduce((sum, item) => sum + (item.productId ? (item.quantity || 0) * (item.unitPrice || 0) : 0), 0);
    };

    const handleFormSubmit = async (e: React.FormEvent, immediateApprove = false) => {
        e.preventDefault();
        setFormError(null);

        const newErrors: Record<string, string> = {};

        if (!selectedCustomerId || selectedCustomerId === 0) {
            newErrors.customerId = 'Vui lòng tìm và chọn khách hàng';
        }

        if (items.length === 0) {
            newErrors.items = 'Vui lòng chọn ít nhất 1 sản phẩm';
        }

        // Validate basic constraints
        for (let i = 0; i < items.length; i++) {
            const it = items[i];
            if (!it.productId || it.productId === 0) {
                newErrors.items = `Vui lòng chọn sản phẩm cho dòng số ${i + 1}`;
                break;
            }
            const prod = products.find((p) => p.id === it.productId);
            const name = prod?.name || `dòng ${i + 1}`;
            if (!it.quantity || it.quantity <= 0) {
                newErrors.quantity = `Số lượng xuất của sản phẩm "${name}" phải lớn hơn 0`;
                break;
            }
            if (it.unitPrice < 0) {
                newErrors.unitPrice = `Đơn giá của sản phẩm "${name}" không được âm`;
                break;
            }
            if (immediateApprove && prod && it.quantity > prod.stockQuantity) {
                newErrors.quantity = `Số lượng xuất "${name}" (${it.quantity}) vượt quá tồn kho hiện có (${prod.stockQuantity})`;
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
            status: immediateApprove ? 'APPROVED' : (editingReceipt ? editingReceipt.status : 'PENDING'),
            details: items
        };

        try {
            if (editingReceipt) {
                await updateExportReceipt(editingReceipt.id, payload);
                toast.success(`Cập nhật phiếu xuất "${editingReceipt.code}" thành công!`);
                setModalOpen(false);
                fetchReceipts();
                fetchDropdowns();
            } else {
                const res = await createExportReceipt(payload);
                toast.success(`Tạo mới phiếu xuất "${res.data.code}" thành công!`);
                setModalOpen(false);
                navigate(`/export-receipts/${res.data.id}`);
            }
        } catch (err: unknown) {
            const errorMsg = getErrorMessage(err, editingReceipt ? 'Lỗi khi sửa phiếu xuất' : 'Lỗi khi tạo phiếu xuất');
            const backendFieldErrors = getFieldErrors(err);
            if (backendFieldErrors) {
                setFieldErrors(backendFieldErrors);
            }
            setFormError(errorMsg);
            toast.error(errorMsg, 'Lỗi thao tác phiếu xuất');
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = (r: ExportReceipt) => {
        setConfirmModal({
            isOpen: true,
            title: 'Xác nhận duyệt phiếu xuất',
            message: `Bạn có chắc chắn muốn DUYỆT phiếu xuất "${r.code}"?\n\nSố lượng sản phẩm sẽ được trừ trực tiếp khỏi tồn kho hệ thống.`,
            type: 'success',
            confirmText: 'Duyệt phiếu',
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                    await approveExportReceipt(r.id);
                    toast.success(`Duyệt phiếu xuất "${r.code}" thành công! Tồn kho đã được trừ.`);
                    fetchReceipts();
                    fetchDropdowns();
                } catch (err: unknown) {
                    const errorMsg = axios.isAxiosError<ApiErrorResponse>(err)
                        ? err.response?.data?.message || 'Không thể duyệt phiếu xuất này.'
                        : 'Lỗi khi duyệt phiếu';
                    toast.error(errorMsg, 'Duyệt phiếu thất bại');
                }
            }
        });
    };

    const handleReject = (r: ExportReceipt) => {
        setConfirmModal({
            isOpen: true,
            title: 'Từ chối duyệt phiếu xuất',
            message: `Bạn có chắc chắn muốn TỪ CHỐI duyệt phiếu xuất "${r.code}"?\n\nPhiếu sẽ chuyển sang trạng thái "Từ chối" và không trừ tồn kho.`,
            type: 'warning',
            confirmText: 'Từ chối duyệt',
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                    await rejectExportReceipt(r.id);
                    toast.warning(`Đã từ chối duyệt phiếu xuất "${r.code}".`);
                    fetchReceipts();
                } catch (err: unknown) {
                    const errorMsg = axios.isAxiosError<ApiErrorResponse>(err)
                        ? err.response?.data?.message || 'Không thể từ chối phiếu xuất này.'
                        : 'Lỗi khi từ chối phiếu';
                    toast.error(errorMsg, 'Từ chối thất bại');
                }
            }
        });
    };

    const handleDelete = (r: ExportReceipt) => {
        const isApproved = r.status === 'APPROVED' || r.status === 'COMPLETED';
        const msg = isApproved
            ? `CẢNH BÁO: Phiếu xuất "${r.code}" đã được duyệt!\n\nNếu xóa, hệ thống sẽ tự động HOÀN TRẢ lại số lượng tồn kho tương ứng.\nBạn có chắc chắn muốn xóa không?`
            : `Bạn có chắc chắn muốn xóa phiếu xuất "${r.code}"?\n\nThao tác này không thể hoàn tác.`;

        setConfirmModal({
            isOpen: true,
            title: 'Xác nhận xóa phiếu xuất',
            message: msg,
            type: 'danger',
            confirmText: 'Xóa phiếu',
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                    await deleteExportReceipt(r.id);
                    toast.success(`Đã xóa phiếu xuất "${r.code}" thành công!`);
                    fetchReceipts();
                    fetchDropdowns();
                } catch (err: unknown) {
                    const errorMsg = axios.isAxiosError<ApiErrorResponse>(err)
                        ? err.response?.data?.message || 'Không thể xóa phiếu xuất này.'
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
                return <span className="badge badge-warning">Chờ duyệt</span>;
            case 'APPROVED':
            case 'COMPLETED':
                return <span className="badge badge-success">Đã duyệt</span>;
            case 'REJECTED':
                return <span className="badge badge-danger">Từ chối</span>;
            case 'CANCELLED':
                return <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }}>Đã hủy</span>;
            default:
                return <span className="badge">{st}</span>;
        }
    };

    return (
        <div className="page-wrapper">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0 }}>Quản lý Xuất kho</h1>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                        Lập phiếu xuất cho khách hàng, phê duyệt chứng từ, tự động kiểm tra tồn kho và in ấn.
                    </div>
                </div>
                <button onClick={openCreateModal} className="btn btn-primary">
                    <Plus size={16} />
                    <span>Tạo phiếu xuất kho</span>
                </button>
            </div>

            {/* Filter Toolbar */}
            <form onSubmit={handleSearch} className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'center' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Tìm kiếm</label>
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Mã phiếu, người tạo..."
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Khách hàng</label>
                        <select
                            value={customerId || ''}
                            onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : undefined)}
                            style={{ width: '100%' }}
                        >
                            <option value="">Tất cả khách hàng</option>
                            {customers.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Trạng thái</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: '100%' }}>
                            <option value="">Tất cả</option>
                            <option value="PENDING">Chờ duyệt</option>
                            <option value="APPROVED">Đã duyệt</option>
                            <option value="REJECTED">Từ chối</option>
                            <option value="CANCELLED">Đã hủy</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Từ ngày</label>
                        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ width: '100%' }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Đến ngày</label>
                        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ width: '100%' }} />
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                            <Filter size={15} />
                            <span>Lọc</span>
                        </button>
                        <button type="button" onClick={handleReset} className="btn btn-secondary">
                            <RotateCcw size={15} />
                            <span>Đặt lại</span>
                        </button>
                    </div>
                </div>
            </form>

            {/* Table */}
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <SortableTh columnKey="code" sortConfig={sortConfig} onSort={requestSort} style={{ width: 200, minWidth: 195 }}>
                                Mã phiếu
                            </SortableTh>
                            <SortableTh columnKey="exportDate" sortConfig={sortConfig} onSort={requestSort}>
                                Ngày xuất
                            </SortableTh>
                            <SortableTh columnKey="customerName" sortConfig={sortConfig} onSort={requestSort}>
                                Khách hàng
                            </SortableTh>
                            <SortableTh columnKey="creatorName" sortConfig={sortConfig} onSort={requestSort} style={{ width: 120, maxWidth: 130 }}>
                                Người tạo
                            </SortableTh>
                            <SortableTh columnKey="totalAmount" sortConfig={sortConfig} onSort={requestSort} align="right">
                                Tổng tiền
                            </SortableTh>
                            <SortableTh columnKey="status" sortConfig={sortConfig} onSort={requestSort} align="center">
                                Trạng thái
                            </SortableTh>
                            <th style={{ width: 130, textAlign: 'center' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Đang tải...</td></tr>
                        ) : sortedReceipts.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Chưa có phiếu xuất nào</td></tr>
                        ) : (
                            sortedReceipts.map((r) => (
                                <tr
                                    key={r.id}
                                    onClick={() => navigate(`/export-receipts/${r.id}`)}
                                    style={{ cursor: 'pointer' }}
                                    title="Nhấn để xem chi tiết phiếu xuất"
                                >
                                    <td style={{ fontWeight: 600, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                                        {r.code}
                                    </td>
                                    <td>{new Date(r.exportDate).toLocaleString('vi-VN')}</td>
                                    <td style={{ fontWeight: 500 }}>{r.customerName}</td>
                                    <td style={{ width: 120, maxWidth: 130 }}>
                                        <div>{r.creatorName}</div>
                                        {r.approverName && (
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                Duyệt: {r.approverName}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>
                                        {formatCurrency(r.totalAmount)}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {renderStatusBadge(r.status)}
                                    </td>
                                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                        <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
                                            {/* Duyệt & Từ chối duyệt (Quản lý & Admin khi PENDING) */}
                                            {isManagerOrAdmin && r.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(r)}
                                                        className="btn btn-success btn-sm"
                                                        style={{ padding: '6px 8px' }}
                                                        title="Duyệt phiếu"
                                                    >
                                                        <Check size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(r)}
                                                        className="btn btn-outline btn-sm"
                                                        style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)', padding: '6px 8px' }}
                                                        title="Từ chối duyệt"
                                                    >
                                                        <Ban size={15} />
                                                    </button>
                                                </>
                                            )}

                                            {/* Sửa phiếu (PENDING cho tất cả, hoặc Quản lý/Admin sửa phiếu đã duyệt) */}
                                            {(r.status === 'PENDING' || (isManagerOrAdmin && (r.status === 'APPROVED' || r.status === 'COMPLETED'))) && (
                                                <button
                                                    onClick={() => openEditModal(r)}
                                                    className="btn btn-outline btn-sm"
                                                    style={{ padding: '6px 8px' }}
                                                    title="Sửa phiếu"
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                            )}

                                            {/* Xóa phiếu (Chỉ Quản lý & Admin) */}
                                            {isManagerOrAdmin && (
                                                <button
                                                    onClick={() => handleDelete(r)}
                                                    className="btn btn-danger btn-sm"
                                                    style={{ padding: '6px 8px' }}
                                                    title="Xóa phiếu"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
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

            {/* Modal Create / Edit Export Receipt */}
            {modalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content modal-lg">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ margin: 0 }}>
                                {editingReceipt ? `Chỉnh Sửa Phiếu Xuất: ${editingReceipt.code}` : 'Tạo Phiếu Xuất Kho Mới'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                                <X size={15} />
                            </button>
                        </div>

                        {formError && (
                            <div style={{ padding: '8px 12px', borderRadius: 6, backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <AlertCircle size={15} />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form onSubmit={(e) => handleFormSubmit(e, false)}>
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
                                    placeholder="Xuất bán theo đơn hàng #..."
                                    style={{ width: '100%' }}
                                />
                            </div>

                            {/* Dynamic line items */}
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <strong style={{ fontSize: 14 }}>Danh sách sản phẩm xuất</strong>
                                    <button type="button" onClick={addItemRow} className="btn btn-outline btn-sm">
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
                                                <th style={{ width: 90, textAlign: 'center' }}>SL xuất</th>
                                                <th style={{ width: 135, textAlign: 'right' }}>Đơn giá</th>
                                                <th style={{ width: 135, textAlign: 'right' }}>Thành tiền</th>
                                                <th style={{ width: 45, textAlign: 'center' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, idx) => {
                                                const currentProd = products.find((p) => p.id === item.productId);
                                                const maxAvail = currentProd ? currentProd.stockQuantity : 0;
                                                const isOverStock = Boolean(item.productId && item.quantity > maxAvail);

                                                return (
                                                    <tr key={idx} style={{ backgroundColor: isOverStock ? '#fee2e2' : 'inherit' }}>
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
                                                                onChange={(val) => handleItemProductChange(idx, Number(val))}
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
                                                                className={`form-control ${item.productId > 0 && (item.quantity <= 0 || isOverStock) ? 'is-invalid' : ''}`}
                                                                style={{
                                                                    width: 70,
                                                                    textAlign: 'center',
                                                                    fontSize: 13,
                                                                    padding: '5px 6px',
                                                                    margin: '0 auto',
                                                                    display: 'block'
                                                                }}
                                                                required
                                                                disabled={!item.productId || submitting}
                                                            />
                                                            {item.productId > 0 && item.quantity <= 0 ? (
                                                                <small style={{ color: 'var(--danger)', fontSize: 11, display: 'block', marginTop: 2 }}>
                                                                    SL &gt; 0
                                                                </small>
                                                            ) : null}
                                                            {isOverStock ? (
                                                                <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2 }}>
                                                                    Tồn kho: {maxAvail}
                                                                </div>
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
                                                                onClick={() => removeItemRow(idx)}
                                                                className="btn btn-outline btn-sm"
                                                                style={{ padding: '3px 6px', color: 'var(--danger)', borderColor: '#fca5a5' }}
                                                                title="Xóa dòng"
                                                            >
                                                                <X size={13} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, padding: '10px 14px', background: '#f9fafb', borderRadius: 6 }}>
                                    <div style={{ fontSize: 15 }}>
                                        Tổng tiền phiếu xuất: <strong style={{ color: 'var(--success)', fontSize: 17 }}>{formatCurrency(calculateGrandTotal())}</strong>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Đóng</button>
                                
                                {editingReceipt ? (
                                    <button type="submit" disabled={submitting} className="btn btn-primary">
                                        {submitting ? 'Đang lưu thay đổi...' : 'Cập nhật phiếu xuất'}
                                    </button>
                                ) : (
                                    <>
                                        <button type="submit" disabled={submitting} className="btn btn-secondary">
                                            {submitting ? 'Đang lưu...' : 'Lưu chờ duyệt'}
                                        </button>
                                        {isManagerOrAdmin && (
                                            <button
                                                type="button"
                                                disabled={submitting}
                                                onClick={(e) => handleFormSubmit(e, true)}
                                                className="btn btn-success"
                                            >
                                                {submitting ? 'Đang duyệt...' : 'Lưu & Duyệt ngay'}
                                            </button>
                                        )}
                                    </>
                                )}
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