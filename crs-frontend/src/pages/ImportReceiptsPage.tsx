import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Filter, RotateCcw, X, AlertCircle, Check, Ban, Pencil, Trash2 } from 'lucide-react';
import {
    getImportReceipts,
    getAllSuppliers,
    getAllProducts,
    createImportReceipt,
    updateImportReceipt,
    deleteImportReceipt,
    approveImportReceipt,
    rejectImportReceipt
} from '../api/warehouseApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Pagination from '../components/Pagination';
import ConfirmModal, { type ConfirmType } from '../components/ConfirmModal';
import SearchableSelect from '../components/SearchableSelect';
import SupplierModal from '../components/SupplierModal';
import ProductModal from '../components/ProductModal';
import { getLocalDateTimeString } from '../utils/dateUtils';
import type { ImportReceipt, ImportReceiptDetail, Supplier, Product } from '../types/warehouse';
import type { ApiErrorResponse } from '../types/apiError';
import { useTableSort } from '../hooks/useTableSort';
import { SortableTh } from '../components/SortableTh';
import { getErrorMessage, getFieldErrors } from '../utils/errorHandler';

export default function ImportReceiptsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();
    const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

    const [receipts, setReceipts] = useState<ImportReceipt[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(25);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    // Table sorting
    const { sortedItems: sortedReceipts, sortConfig, requestSort } = useTableSort<ImportReceipt>(
        receipts,
        'importDate',
        'desc'
    );

    // Filters
    const [keyword, setKeyword] = useState('');
    const [supplierId, setSupplierId] = useState<number | undefined>(undefined);
    const [status, setStatus] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Modal Create / Edit Receipt
    const [modalOpen, setModalOpen] = useState(false);
    const [editingReceipt, setEditingReceipt] = useState<ImportReceipt | null>(null);
    const [selectedSupplierId, setSelectedSupplierId] = useState<number>(0);
    const [importDate, setImportDate] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<ImportReceiptDetail[]>([]);
    const [editingPriceIndex, setEditingPriceIndex] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [quickSupplierOpen, setQuickSupplierOpen] = useState(false);
    const [quickProductOpen, setQuickProductOpen] = useState(false);

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
            const [supRes, prodRes] = await Promise.all([getAllSuppliers(), getAllProducts()]);
            setSuppliers(supRes.data);
            setProducts(prodRes.data);
            if (supRes.data.length > 0 && !selectedSupplierId) {
                setSelectedSupplierId(supRes.data[0].id);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchReceipts = useCallback(async () => {
        setLoading(true);
        try {
            const fromIso = fromDate ? `${fromDate}T00:00:00` : undefined;
            const toIso = toDate ? `${toDate}T23:59:59` : undefined;

            const res = await getImportReceipts({
                keyword: keyword.trim() || undefined,
                supplierId,
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
    }, [keyword, supplierId, status, fromDate, toDate, page, pageSize]);

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
        setSupplierId(undefined);
        setStatus('');
        setFromDate('');
        setToDate('');
        setPage(0);
    };

    const availableProducts = useMemo(() => {
        if (!selectedSupplierId) return [];
        return products.filter((p) => p.supplierId === selectedSupplierId);
    }, [products, selectedSupplierId]);

    const handleSupplierChange = (supId: number) => {
        setSelectedSupplierId(supId);
        setFormError(null);
        if (fieldErrors.supplierId) setFieldErrors((prev) => ({ ...prev, supplierId: '' }));
        const supProds = products.filter((p) => p.supplierId === supId);
        if (supProds.length > 0) {
            if (items.length > 0) {
                const validItems = items.filter((it) => supProds.some((p) => p.id === it.productId));
                setItems(validItems.length > 0 ? validItems : [
                    {
                        productId: 0,
                        productCode: '',
                        productName: '',
                        unit: '',
                        quantity: 1,
                        unitPrice: 0
                    }
                ]);
            } else {
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
            }
        } else {
            setItems([]);
        }
        setEditingPriceIndex(null);
    };

    const handleQuickSupplierSuccess = (newSupplier: Supplier) => {
        setSuppliers((prev) => {
            if (prev.some((s) => s.id === newSupplier.id)) return prev;
            return [...prev, newSupplier];
        });
        handleSupplierChange(newSupplier.id);
        toast.success(`Đã thêm nhà cung cấp "${newSupplier.name}" và chọn cho phiếu!`);
    };

    const handleQuickProductSuccess = (newProduct: Product) => {
        setProducts((prev) => {
            if (prev.some((p) => p.id === newProduct.id)) return prev.map((p) => p.id === newProduct.id ? newProduct : p);
            return [...prev, newProduct];
        });
        setItems((prev) => [
            ...prev,
            {
                productId: newProduct.id,
                productCode: newProduct.code,
                productName: newProduct.name,
                unit: newProduct.unit,
                quantity: 1,
                unitPrice: newProduct.importPrice != null ? Number(newProduct.importPrice) : 0
            }
        ]);
        setFormError(null);
        setFieldErrors((prev) => ({ ...prev, items: '' }));
        toast.success(`Đã thêm sản phẩm "${newProduct.name}" và thêm vào phiếu nhập!`);
    };

    const openCreateModal = () => {
        setEditingReceipt(null);
        setSelectedSupplierId(0);
        setImportDate(getLocalDateTimeString());
        setNotes('');
        setFormError(null);
        setFieldErrors({});
        setItems([]);
        setEditingPriceIndex(null);
        setModalOpen(true);
    };

    const openEditModal = (r: ImportReceipt) => {
        setEditingReceipt(r);
        setSelectedSupplierId(r.supplierId);
        setImportDate(r.importDate ? r.importDate.slice(0, 16) : getLocalDateTimeString());
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

    const addItemRow = () => {
        if (!selectedSupplierId) {
            setFormError('Vui lòng tìm và chọn nhà cung cấp trước khi thêm sản phẩm');
            return;
        }
        if (availableProducts.length === 0) {
            setFormError('Nhà cung cấp này chưa có sản phẩm nào liên kết trong kho');
            return;
        }
        setFormError(null);
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
    };

    const removeItemRow = (index: number) => {
        if (items.length <= 1) {
            alert('Phiếu nhập phải có ít nhất 1 sản phẩm');
            return;
        }
        setItems(items.filter((_, i) => i !== index));
        if (editingPriceIndex === index) {
            setEditingPriceIndex(null);
        }
    };

    const handleItemProductChange = (index: number, productId: number) => {
        const prod = availableProducts.find((p) => p.id === productId);
        if (!prod) return;
        const newItems = [...items];
        newItems[index] = {
            ...newItems[index],
            productId: prod.id,
            productCode: prod.code,
            productName: prod.name,
            unit: prod.unit,
            unitPrice: prod.importPrice != null ? Number(prod.importPrice) : 0
        };
        setItems(newItems);
        if (editingPriceIndex === index) {
            setEditingPriceIndex(null);
        }
    };

    const handleItemQuantityChange = (index: number, qty: number) => {
        const newItems = [...items];
        newItems[index].quantity = qty;
        setItems(newItems);
    };

    const handleItemPriceChange = (index: number, price: number) => {
        const newItems = [...items];
        newItems[index].unitPrice = price;
        setItems(newItems);
    };

    const calculateGrandTotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
    };

    const handleFormSubmit = async (e: React.FormEvent, immediateApprove = false) => {
        e.preventDefault();
        setFormError(null);

        const newErrors: Record<string, string> = {};

        if (!selectedSupplierId || selectedSupplierId === 0) {
            newErrors.supplierId = 'Vui lòng tìm và chọn nhà cung cấp';
        }

        if (items.length === 0) {
            newErrors.items = 'Vui lòng thêm ít nhất 1 sản phẩm vào phiếu nhập';
        }

        for (let i = 0; i < items.length; i++) {
            const it = items[i];
            if (!it.productId || it.productId === 0) {
                newErrors.items = `Vui lòng chọn sản phẩm cho dòng số ${i + 1}`;
                break;
            }
            if (!it.quantity || it.quantity <= 0) {
                newErrors.quantity = `Số lượng của sản phẩm "${it.productName || 'dòng ' + (i + 1)}" phải lớn hơn 0`;
                break;
            }
            if (it.unitPrice < 0) {
                newErrors.unitPrice = `Đơn giá của sản phẩm "${it.productName || 'dòng ' + (i + 1)}" không được âm`;
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

        const payload: Partial<ImportReceipt> = {
            supplierId: selectedSupplierId,
            importDate: importDate ? `${importDate}:00` : undefined,
            notes: notes.trim() || undefined,
            status: immediateApprove ? 'APPROVED' : (editingReceipt ? editingReceipt.status : 'PENDING'),
            details: items
        };

        try {
            if (editingReceipt) {
                await updateImportReceipt(editingReceipt.id, payload);
                toast.success(`Cập nhật phiếu nhập "${editingReceipt.code}" thành công!`);
                setModalOpen(false);
                fetchReceipts();
                fetchDropdowns();
            } else {
                const res = await createImportReceipt(payload);
                toast.success(`Tạo mới phiếu nhập "${res.data.code}" thành công!`);
                setModalOpen(false);
                navigate(`/import-receipts/${res.data.id}`);
            }
        } catch (err: unknown) {
            const errorMsg = getErrorMessage(err, editingReceipt ? 'Lỗi khi sửa phiếu nhập' : 'Lỗi khi tạo phiếu nhập');
            const backendFieldErrors = getFieldErrors(err);
            if (backendFieldErrors) {
                setFieldErrors(backendFieldErrors);
            }
            setFormError(errorMsg);
            toast.error(errorMsg, 'Lỗi thao tác phiếu nhập');
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = (r: ImportReceipt) => {
        setConfirmModal({
            isOpen: true,
            title: 'Xác nhận duyệt phiếu nhập',
            message: `Bạn có chắc chắn muốn DUYỆT phiếu nhập "${r.code}"?\n\nSố lượng sản phẩm sẽ được cộng trực tiếp vào tồn kho hệ thống.`,
            type: 'success',
            confirmText: 'Duyệt phiếu',
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                    await approveImportReceipt(r.id);
                    toast.success(`Duyệt phiếu nhập "${r.code}" thành công! Tồn kho đã được cộng.`);
                    fetchReceipts();
                    fetchDropdowns();
                } catch (err: unknown) {
                    const errorMsg = axios.isAxiosError<ApiErrorResponse>(err)
                        ? err.response?.data?.message || 'Không thể duyệt phiếu nhập này.'
                        : 'Lỗi khi duyệt phiếu';
                    toast.error(errorMsg, 'Duyệt phiếu thất bại');
                }
            }
        });
    };

    const handleReject = (r: ImportReceipt) => {
        setConfirmModal({
            isOpen: true,
            title: 'Từ chối duyệt phiếu nhập',
            message: `Bạn có chắc chắn muốn TỪ CHỐI duyệt phiếu nhập "${r.code}"?\n\nPhiếu sẽ chuyển sang trạng thái "Từ chối" và không cộng tồn kho.`,
            type: 'warning',
            confirmText: 'Từ chối duyệt',
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                    await rejectImportReceipt(r.id);
                    toast.warning(`Đã từ chối duyệt phiếu nhập "${r.code}".`);
                    fetchReceipts();
                } catch (err: unknown) {
                    const errorMsg = axios.isAxiosError<ApiErrorResponse>(err)
                        ? err.response?.data?.message || 'Không thể từ chối phiếu nhập này.'
                        : 'Lỗi khi từ chối phiếu';
                    toast.error(errorMsg, 'Từ chối thất bại');
                }
            }
        });
    };

    const handleDelete = (r: ImportReceipt) => {
        const isApproved = r.status === 'APPROVED' || r.status === 'COMPLETED';
        const msg = isApproved
            ? `CẢNH BÁO: Phiếu nhập "${r.code}" đã được duyệt!\n\nNếu xóa, hệ thống sẽ tự động HOÀN TRỪ lại số lượng tồn kho tương ứng.\nBạn có chắc chắn muốn xóa không?`
            : `Bạn có chắc chắn muốn xóa phiếu nhập "${r.code}"?\n\nThao tác này không thể hoàn tác.`;

        setConfirmModal({
            isOpen: true,
            title: 'Xác nhận xóa phiếu nhập',
            message: msg,
            type: 'danger',
            confirmText: 'Xóa phiếu',
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                    await deleteImportReceipt(r.id);
                    toast.success(`Đã xóa phiếu nhập "${r.code}" thành công!`);
                    fetchReceipts();
                    fetchDropdowns();
                } catch (err: unknown) {
                    const errorMsg = axios.isAxiosError<ApiErrorResponse>(err)
                        ? err.response?.data?.message || 'Không thể xóa phiếu nhập này.'
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
                    <h1 style={{ margin: 0 }}>Quản lý Nhập kho</h1>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                        Lập phiếu nhập từ nhà cung cấp, phê duyệt chứng từ, tự động cập nhật tồn kho và in ấn.
                    </div>
                </div>
                <button onClick={openCreateModal} className="btn btn-primary">
                    <Plus size={16} />
                    <span>Tạo phiếu nhập kho</span>
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
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Nhà cung cấp</label>
                        <select
                            value={supplierId || ''}
                            onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : undefined)}
                            style={{ width: '100%' }}
                        >
                            <option value="">Tất cả NCC</option>
                            {suppliers.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
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
                            <SortableTh columnKey="importDate" sortConfig={sortConfig} onSort={requestSort}>
                                Ngày nhập
                            </SortableTh>
                            <SortableTh columnKey="supplierName" sortConfig={sortConfig} onSort={requestSort}>
                                Nhà cung cấp
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
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Chưa có phiếu nhập nào</td></tr>
                        ) : (
                            sortedReceipts.map((r) => (
                                <tr
                                    key={r.id}
                                    onClick={() => navigate(`/import-receipts/${r.id}`)}
                                    style={{ cursor: 'pointer' }}
                                    title="Nhấn để xem chi tiết phiếu nhập"
                                >
                                    <td style={{ fontWeight: 600, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                                        {r.code}
                                    </td>
                                    <td>{new Date(r.importDate).toLocaleString('vi-VN')}</td>
                                    <td style={{ fontWeight: 500 }}>{r.supplierName}</td>
                                    <td style={{ width: 120, maxWidth: 130 }}>
                                        <div>{r.creatorName}</div>
                                        {r.approverName && (
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                Duyệt: {r.approverName}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent)' }}>
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

            {/* Modal Create / Edit Import Receipt */}
            {modalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content modal-lg">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ margin: 0 }}>
                                {editingReceipt ? `Chỉnh Sửa Phiếu Nhập: ${editingReceipt.code}` : 'Tạo Phiếu Nhập Kho Mới'}
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
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Nhà cung cấp *</label>
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <SearchableSelect
                                                options={suppliers.map((s) => ({
                                                    value: s.id,
                                                    label: s.name,
                                                    subLabel: s.code,
                                                    tag: s.phone ? `SĐT: ${s.phone}` : undefined,
                                                }))}
                                                value={selectedSupplierId || undefined}
                                                onChange={(val) => handleSupplierChange(Number(val) || 0)}
                                                placeholder="-- Gõ để tìm & chọn nhà cung cấp --"
                                                searchPlaceholder="Nhập tên, mã nhà cung cấp hoặc SĐT..."
                                                clearable={false}
                                                disabled={submitting}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setQuickSupplierOpen(true)}
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
                                            title="Tạo nhà cung cấp mới"
                                            disabled={submitting}
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    {fieldErrors.supplierId && (
                                        <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>
                                            {fieldErrors.supplierId}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Thời gian nhập</label>
                                    <input
                                        type="datetime-local"
                                        value={importDate}
                                        onChange={(e) => setImportDate(e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: 14 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Ghi chú nhập kho</label>
                                <input
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Lô hàng tháng 9, theo hóa đơn số..."
                                    style={{ width: '100%' }}
                                />
                            </div>

                            {/* Dynamic line items */}
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <strong style={{ fontSize: 14 }}>
                                        Danh sách sản phẩm nhập {selectedSupplierId && availableProducts.length > 0 ? `(${availableProducts.length} sản phẩm của NCC)` : ''}
                                    </strong>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!selectedSupplierId) {
                                                    setFormError('Vui lòng tìm và chọn nhà cung cấp trước khi thêm sản phẩm mới');
                                                    return;
                                                }
                                                setFormError(null);
                                                setQuickProductOpen(true);
                                            }}
                                            className="btn btn-outline btn-sm"
                                            disabled={!selectedSupplierId || submitting}
                                            title="Thêm sản phẩm mới thuộc nhà cung cấp này"
                                        >
                                            + Thêm sản phẩm mới
                                        </button>
                                        <button
                                            type="button"
                                            onClick={addItemRow}
                                            className="btn btn-outline btn-sm"
                                            disabled={!selectedSupplierId || availableProducts.length === 0 || submitting}
                                        >
                                            + Thêm dòng sản phẩm
                                        </button>
                                    </div>
                                </div>

                                {!selectedSupplierId || selectedSupplierId === 0 ? (
                                    <div style={{
                                        padding: '24px 16px',
                                        textAlign: 'center',
                                        backgroundColor: '#f8fafc',
                                        border: '1px dashed var(--border)',
                                        borderRadius: 8,
                                        color: 'var(--text-muted)'
                                    }}>
                                        <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-h)', fontSize: 14 }}>Vui lòng tìm và chọn Nhà cung cấp ở trên trước</p>
                                        <p style={{ margin: '4px 0 0', fontSize: 13 }}>Sau khi chọn nhà cung cấp, hệ thống sẽ lọc và chỉ cho phép chọn các sản phẩm của nhà cung cấp đó.</p>
                                    </div>
                                ) : availableProducts.length === 0 ? (
                                    <div style={{
                                        padding: '20px 16px',
                                        textAlign: 'center',
                                        backgroundColor: '#fffbeb',
                                        border: '1px dashed #fcd34d',
                                        borderRadius: 8,
                                        color: '#b45309'
                                    }}>
                                        <p style={{ margin: 0, fontWeight: 600 }}>Nhà cung cấp này chưa có sản phẩm nào được liên kết trong kho!</p>
                                        <p style={{ margin: '4px 0 0', fontSize: 13 }}>Vui lòng gán nhà cung cấp cho sản phẩm trong menu Sản phẩm trước khi tạo phiếu nhập.</p>
                                    </div>
                                ) : (
                                    <div className="table-container" style={{ margin: 0, overflow: 'visible', minHeight: 180 }}>
                                        <table className="data-table modal-table" style={{ fontSize: 13, width: '100%' }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: 45, textAlign: 'center' }}>STT</th>
                                                    <th style={{ minWidth: 240 }}>Sản phẩm</th>
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
                                                        <td style={{ minWidth: 240 }}>
                                                            <SearchableSelect
                                                                options={availableProducts.map((p) => ({
                                                                    value: p.id,
                                                                    label: p.name,
                                                                    subLabel: p.code
                                                                }))}
                                                                value={item.productId || undefined}
                                                                onChange={(val) => handleItemProductChange(idx, Number(val))}
                                                                placeholder="--- Chọn sản phẩm ---"
                                                                searchPlaceholder="Nhập tên sản phẩm hoặc mã SP..."
                                                                clearable={false}
                                                                disabled={submitting}
                                                            />
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>{item.productId ? item.unit : '-'}</td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                className={!item.quantity || item.quantity <= 0 ? 'is-invalid' : ''}
                                                                value={item.quantity}
                                                                onChange={(e) => {
                                                                    handleItemQuantityChange(idx, Number(e.target.value));
                                                                    if (fieldErrors.quantity) setFieldErrors((prev) => ({ ...prev, quantity: '' }));
                                                                }}
                                                                style={{ width: 65, textAlign: 'center', fontSize: 13, padding: '5px 6px', margin: '0 auto', display: 'block' }}
                                                                required
                                                                disabled={!item.productId || submitting}
                                                            />
                                                            {(!item.quantity || item.quantity <= 0) && (
                                                                <div style={{ fontSize: 10, color: 'var(--danger)', marginTop: 2, fontWeight: 500 }}>
                                                                    SL &gt; 0
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                            {!item.productId ? (
                                                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                                                            ) : editingPriceIndex === idx ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                                                                    <input
                                                                        type="number"
                                                                        min={0}
                                                                        className={item.unitPrice < 0 ? 'is-invalid' : ''}
                                                                        value={item.unitPrice}
                                                                        onChange={(e) => {
                                                                            handleItemPriceChange(idx, Number(e.target.value));
                                                                            if (fieldErrors.unitPrice) setFieldErrors((prev) => ({ ...prev, unitPrice: '' }));
                                                                        }}
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
                                                                        title="Tùy chỉnh đơn giá (nếu khác giá mặc định)"
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
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, padding: '10px 14px', background: '#f9fafb', borderRadius: 6 }}>
                                    <div style={{ fontSize: 15 }}>
                                        Tổng tiền phiếu nhập: <strong style={{ color: 'var(--accent)', fontSize: 17 }}>{formatCurrency(calculateGrandTotal())}</strong>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Đóng</button>
                                
                                {editingReceipt ? (
                                    <button type="submit" disabled={submitting} className="btn btn-primary">
                                        {submitting ? 'Đang lưu thay đổi...' : 'Cập nhật phiếu nhập'}
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

            {/* Quick Supplier Modal */}
            <SupplierModal
                isOpen={quickSupplierOpen}
                onClose={() => setQuickSupplierOpen(false)}
                onSuccess={handleQuickSupplierSuccess}
                zIndex={1200}
            />

            {/* Quick Product Modal */}
            <ProductModal
                isOpen={quickProductOpen}
                initialSupplierId={selectedSupplierId || undefined}
                suppliers={suppliers}
                onClose={() => setQuickProductOpen(false)}
                onSuccess={handleQuickProductSuccess}
                zIndex={1200}
            />
        </div>
    );
}