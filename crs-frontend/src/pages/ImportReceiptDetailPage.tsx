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
    Plus,
    X
} from 'lucide-react';
import {
    getImportReceiptById,
    approveImportReceipt,
    rejectImportReceipt,
    deleteImportReceipt,
    updateImportReceipt,
    getAllSuppliers,
    getAllProducts
} from '../api/warehouseApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PrintReceiptModal from '../components/PrintReceiptModal';
import ConfirmModal, { type ConfirmType } from '../components/ConfirmModal';
import SearchableSelect from '../components/SearchableSelect';
import SupplierModal from '../components/SupplierModal';
import ProductModal from '../components/ProductModal';
import type { ImportReceipt, ImportReceiptDetail, Supplier, Product } from '../types/warehouse';
import type { ApiErrorResponse } from '../types/apiError';
import { useTableSort } from '../hooks/useTableSort';
import { SortableTh } from '../components/SortableTh';
import { getErrorMessage, getFieldErrors } from '../utils/errorHandler';

export default function ImportReceiptDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();
    const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

    const [receipt, setReceipt] = useState<ImportReceipt | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Sort items table
    const details = useMemo(() => receipt?.details || [], [receipt?.details]);
    const { sortedItems: sortedDetails, sortConfig, requestSort } = useTableSort<ImportReceiptDetail>(
        details
    );

    // Print Modal
    const [printModalOpen, setPrintModalOpen] = useState(false);

    // Edit Modal
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
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

    const availableProducts = useMemo(() => {
        if (!selectedSupplierId) return [];
        return products.filter((p) => p.supplierId === selectedSupplierId);
    }, [products, selectedSupplierId]);

    const handleSupplierChange = (supId: number) => {
        setSelectedSupplierId(supId);
        setFormError(null);
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
            const res = await getImportReceiptById(Number(id));
            setReceipt(res.data);
        } catch (err: unknown) {
            if (axios.isAxiosError<ApiErrorResponse>(err)) {
                setError(err.response?.data?.message || 'Không tìm thấy phiếu nhập kho');
            } else {
                setError('Lỗi khi tải thông tin phiếu nhập');
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
            const [supRes, prodRes] = await Promise.all([getAllSuppliers(), getAllProducts()]);
            setSuppliers(supRes.data);
            setProducts(prodRes.data);
            setSelectedSupplierId(receipt.supplierId);
            setImportDate(receipt.importDate ? receipt.importDate.slice(0, 16) : '');
            setNotes(receipt.notes || '');
            setFormError(null);
            setFieldErrors({});
            setEditingPriceIndex(null);
            setItems(receipt.details.map((d) => ({
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
            alert('Không thể tải danh sách sản phẩm và nhà cung cấp');
        }
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

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!receipt) return;
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
            status: receipt.status,
            details: items
        };

        try {
            await updateImportReceipt(receipt.id, payload);
            toast.success(`Cập nhật phiếu nhập "${receipt.code}" thành công!`);
            setEditModalOpen(false);
            fetchReceipt();
        } catch (err: unknown) {
            const errorMsg = getErrorMessage(err, 'Lỗi khi cập nhật phiếu nhập');
            const backendFieldErrors = getFieldErrors(err);
            if (backendFieldErrors) {
                setFieldErrors(backendFieldErrors);
            }
            setFormError(errorMsg);
            toast.error(errorMsg, 'Cập nhật thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = () => {
        if (!receipt) return;
        setConfirmModal({
            isOpen: true,
            title: 'Xác nhận duyệt phiếu nhập',
            message: `Xác nhận DUYỆT phiếu nhập "${receipt.code}"?\n\nSố lượng tồn kho sẽ được cộng trực tiếp vào hệ thống.`,
            type: 'success',
            confirmText: 'Duyệt phiếu',
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                    await approveImportReceipt(receipt.id);
                    toast.success(`Duyệt phiếu nhập "${receipt.code}" thành công! Tồn kho đã được cộng.`);
                    fetchReceipt();
                } catch (err: unknown) {
                    const errorMsg = axios.isAxiosError<ApiErrorResponse>(err)
                        ? err.response?.data?.message || 'Không thể duyệt phiếu nhập'
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
            title: 'Từ chối duyệt phiếu nhập',
            message: `Xác nhận TỪ CHỐI duyệt phiếu nhập "${receipt.code}"?\n\nPhiếu sẽ chuyển sang trạng thái "Từ chối" và không cộng tồn kho.`,
            type: 'warning',
            confirmText: 'Từ chối duyệt',
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                    await rejectImportReceipt(receipt.id);
                    toast.warning(`Đã từ chối duyệt phiếu nhập "${receipt.code}".`);
                    fetchReceipt();
                } catch (err: unknown) {
                    const errorMsg = axios.isAxiosError<ApiErrorResponse>(err)
                        ? err.response?.data?.message || 'Không thể từ chối phiếu nhập'
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
            ? `CẢNH BÁO: Phiếu nhập "${receipt.code}" đã được duyệt!\n\nNếu xóa, hệ thống sẽ tự động hoàn trừ tồn kho tương ứng.\nBạn có chắc chắn muốn xóa không?`
            : `Bạn có chắc chắn muốn xóa phiếu nhập "${receipt.code}"?\n\nThao tác này không thể hoàn tác.`;

        setConfirmModal({
            isOpen: true,
            title: 'Xác nhận xóa phiếu nhập',
            message: msg,
            type: 'danger',
            confirmText: 'Xóa phiếu',
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                    await deleteImportReceipt(receipt.id);
                    toast.success(`Đã xóa phiếu nhập "${receipt.code}" thành công!`);
                    navigate('/import-receipts');
                } catch (err: unknown) {
                    const errorMsg = axios.isAxiosError<ApiErrorResponse>(err)
                        ? err.response?.data?.message || 'Không thể xóa phiếu nhập'
                        : 'Lỗi khi xóa phiếu';
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
                Đang tải thông tin chi tiết phiếu nhập...
            </div>
        );
    }

    if (error || !receipt) {
        return (
            <div className="page-wrapper">
                <div style={{ marginBottom: 16 }}>
                    <Link to="/import-receipts" className="btn btn-outline btn-sm">
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
                    <Link to="/import-receipts" className="btn btn-outline btn-sm" title="Quay lại danh sách">
                        <ArrowLeft size={16} />
                        <span>Quay lại</span>
                    </Link>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <h1 style={{ margin: 0, fontSize: 22 }}>Phiếu Nhập Kho: {receipt.code}</h1>
                            {renderStatusBadge(receipt.status)}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                            Ngày nhập: {new Date(receipt.importDate).toLocaleString('vi-VN')}
                        </div>
                    </div>
                </div>

                {/* Actions Toolbar */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Nút In phiếu đặt trong trang chi tiết */}
                    <button onClick={() => setPrintModalOpen(true)} className="btn btn-primary" title="In phiếu nhập kho">
                        <Printer size={16} />
                        <span>In chứng từ</span>
                    </button>

                    {/* Duyệt & Từ chối */}
                    {isManagerOrAdmin && receipt.status === 'PENDING' && (
                        <>
                            <button onClick={handleApprove} className="btn btn-success" title="Duyệt phiếu và cộng tồn kho" style={{ padding: '8px 12px' }}>
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
                        <button onClick={handleDelete} className="btn btn-danger" title="Xóa phiếu nhập" style={{ padding: '8px 12px' }}>
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Information Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 20 }}>
                {/* Thông tin nhà cung cấp */}
                <div className="card" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15, marginBottom: 12, color: 'var(--text-h)' }}>
                        <Building2 size={18} color="var(--accent)" />
                        <span>Thông Tin Nhà Cung Cấp</span>
                    </div>
                    <div style={{ display: 'grid', gap: 6, fontSize: 13.5 }}>
                        <div><strong>Tên NCC:</strong> {receipt.supplierName}</div>
                        <div><strong>Mã NCC:</strong> <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{receipt.supplierCode}</span></div>
                        <div><strong>Điện thoại:</strong> {receipt.supplierPhone || '---'}</div>
                        <div><strong>Địa chỉ:</strong> {receipt.supplierAddress || '---'}</div>
                    </div>
                </div>

                {/* Thông tin chứng từ & duyệt */}
                <div className="card" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15, marginBottom: 12, color: 'var(--text-h)' }}>
                        <User size={18} color="var(--accent)" />
                        <span>Người Lập & Phê Duyệt</span>
                    </div>
                    <div style={{ display: 'grid', gap: 6, fontSize: 13.5 }}>
                        <div><strong>Người tạo:</strong> {receipt.creatorName}</div>
                        <div><strong>Ngày tạo:</strong> {new Date(receipt.importDate).toLocaleString('vi-VN')}</div>
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
                    <h3 style={{ margin: 0, fontSize: 16 }}>Danh Sách Mặt Hàng Nhập ({receipt.details?.length || 0} sản phẩm)</h3>
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
                                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent)' }}>
                                        {formatCurrency(item.totalPrice || item.quantity * item.unitPrice)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                                <td colSpan={4} style={{ textAlign: 'right', padding: '14px', fontSize: 15 }}>
                                    TỔNG CỘNG TIỀN HÀNG:
                                </td>
                                <td style={{ textAlign: 'right', padding: '14px', fontSize: 15, fontWeight: 700 }}>
                                    {receipt.details?.reduce((s, it) => s + (it.quantity || 0), 0)}
                                </td>
                                <td></td>
                                <td style={{ textAlign: 'right', padding: '14px', color: 'var(--accent)', fontSize: 18, fontWeight: 800 }}>
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
                    type="IMPORT"
                    onClose={() => setPrintModalOpen(false)}
                />
            )}

            {/* Edit Modal */}
            {editModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content modal-lg">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ margin: 0 }}>Chỉnh Sửa Phiếu Nhập: {receipt.code}</h3>
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
                                        <p style={{ margin: '4px 0 0', fontSize: 13 }}>Vui lòng gán nhà cung cấp cho sản phẩm trong menu Sản phẩm trước khi sửa phiếu nhập.</p>
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
                                                                value={item.quantity}
                                                                onChange={(e) => handleItemQuantityChange(idx, Number(e.target.value))}
                                                                className={`form-control ${item.quantity <= 0 ? 'is-invalid' : ''}`}
                                                                style={{ width: 70, textAlign: 'center', fontSize: 13, padding: '5px 6px', margin: '0 auto', display: 'block' }}
                                                                required
                                                                disabled={!item.productId || submitting}
                                                            />
                                                            {(!item.quantity || item.quantity <= 0) && (
                                                                <small style={{ color: 'var(--danger)', fontSize: 11 }}>SL &gt; 0</small>
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

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                <button type="button" onClick={() => setEditModalOpen(false)} className="btn btn-secondary">Đóng</button>
                                <button type="submit" disabled={submitting} className="btn btn-primary">
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
