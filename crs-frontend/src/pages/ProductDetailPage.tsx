import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft,
    Pencil,
    Trash2,
    Package as PackageIcon,
    AlertCircle,
    TrendingUp,
    Boxes,
    Tag,
    DollarSign
} from 'lucide-react';
import {
    getProductById,
    deleteProduct
} from '../api/warehouseApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal, { type ConfirmType } from '../components/ConfirmModal';
import ProductModal from '../components/ProductModal';
import type { Product } from '../types/warehouse';
import type { ApiErrorResponse } from '../types/apiError';

export default function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();
    const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Edit modal state
    const [modalOpen, setModalOpen] = useState(false);

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

    const fetchProduct = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const res = await getProductById(Number(id));
            setProduct(res.data);
        } catch (err: unknown) {
            if (axios.isAxiosError<ApiErrorResponse>(err)) {
                setError(err.response?.data?.message || 'Không tìm thấy sản phẩm');
            } else {
                setError('Lỗi khi tải thông tin sản phẩm');
            }
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchProduct();
    }, [fetchProduct]);

    const openEditModal = () => {
        setModalOpen(true);
    };

    const handleDelete = () => {
        if (!product) return;
        setConfirmModal({
            isOpen: true,
            title: 'Xác nhận xóa sản phẩm',
            message: `Bạn có chắc chắn muốn xóa sản phẩm "${product.name}" (Mã: ${product.code})?\n\nLưu ý: Không thể xóa sản phẩm đã phát sinh phiếu nhập/xuất kho. Thao tác này không thể hoàn tác.`,
            type: 'danger',
            confirmText: 'Xóa sản phẩm',
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                    await deleteProduct(product.id);
                    toast.success(`Đã xóa sản phẩm "${product.name}" thành công!`);
                    navigate('/products');
                } catch (err: unknown) {
                    const errorMsg = axios.isAxiosError<ApiErrorResponse>(err)
                        ? err.response?.data?.message || 'Không thể xóa sản phẩm do đã có chứng từ kho liên kết.'
                        : 'Không thể xóa sản phẩm';
                    toast.error(errorMsg, 'Xóa thất bại');
                }
            }
        });
    };

    const formatCurrency = (val?: number) => {
        if (val == null) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    if (loading) {
        return (
            <div className="page-wrapper" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                Đang tải thông tin chi tiết sản phẩm...
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="page-wrapper">
                <div style={{ marginBottom: 16 }}>
                    <Link to="/products" className="btn btn-outline btn-sm">
                        <ArrowLeft size={15} />
                        <span>Quay lại danh sách</span>
                    </Link>
                </div>
                <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--danger)' }}>
                    <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>{error || 'Không tìm thấy sản phẩm'}</p>
                </div>
            </div>
        );
    }

    const isOut = product.stockQuantity === 0;
    const isLowStock = product.stockQuantity <= product.minStockLevel;
    const profitMargin = product.exportPrice - product.importPrice;
    const profitPercent = product.importPrice > 0 ? (profitMargin / product.importPrice) * 100 : 0;
    const inventoryValuation = product.stockQuantity * product.importPrice;
    const potentialRevenue = product.stockQuantity * product.exportPrice;

    return (
        <div className="page-wrapper">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link to="/products" className="btn btn-outline btn-sm" title="Quay lại danh sách sản phẩm">
                        <ArrowLeft size={16} />
                        <span>Quay lại</span>
                    </Link>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <h1 style={{ margin: 0, fontSize: 22 }}>{product.name}</h1>
                            <span className="badge badge-info" style={{ fontSize: 13 }}>{product.categoryName || 'Chưa phân loại'}</span>
                            {isOut ? (
                                <span className="badge badge-danger" style={{ fontSize: 13 }}>Hết hàng</span>
                            ) : isLowStock ? (
                                <span className="badge badge-warning" style={{ fontSize: 13 }}>Sắp hết hàng</span>
                            ) : (
                                <span className="badge badge-success" style={{ fontSize: 13 }}>Còn hàng</span>
                            )}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 12 }}>
                            <span>Mã SP: <strong style={{ fontFamily: 'var(--mono)', color: 'var(--text-h)' }}>{product.code}</strong></span>
                            <span>•</span>
                            <span>Đơn vị tính: <strong>{product.unit}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                {canManage && (
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={openEditModal} className="btn btn-secondary" title="Chỉnh sửa thông tin sản phẩm">
                            <Pencil size={15} />
                            <span>Chỉnh sửa</span>
                        </button>
                        <button onClick={handleDelete} className="btn btn-danger" title="Xóa sản phẩm">
                            <Trash2 size={15} />
                            <span>Xóa</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Layout Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 24 }}>
                {/* Left Card: General & Media */}
                <div className="card" style={{ padding: 22 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15, marginBottom: 16, color: 'var(--text-h)' }}>
                        <Tag size={18} color="var(--accent)" />
                        <span>Thông Tin Cơ Bản</span>
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        {product.imageUrl ? (
                            <img
                                src={product.imageUrl}
                                alt={product.name}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: 240,
                                    objectFit: 'contain',
                                    borderRadius: 10,
                                    border: '1px solid var(--border)',
                                    padding: 6,
                                    backgroundColor: '#ffffff'
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: '100%',
                                    height: 180,
                                    borderRadius: 10,
                                    background: '#f8fafc',
                                    border: '1px dashed var(--border)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--text-muted)'
                                }}
                            >
                                <PackageIcon size={40} style={{ opacity: 0.5, marginBottom: 8 }} />
                                <span style={{ fontSize: 13 }}>Chưa có hình ảnh sản phẩm</span>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gap: 10, fontSize: 13.5 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                            <span style={{ color: 'var(--text-muted)' }}>Mã sản phẩm:</span>
                            <span style={{ fontWeight: 600, fontFamily: 'var(--mono)' }}>{product.code}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                            <span style={{ color: 'var(--text-muted)' }}>Tên sản phẩm:</span>
                            <span style={{ fontWeight: 600 }}>{product.name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                            <span style={{ color: 'var(--text-muted)' }}>Danh mục hàng:</span>
                            <span>{product.categoryName || '---'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                            <span style={{ color: 'var(--text-muted)' }}>Nhà cung cấp:</span>
                            {product.supplierId ? (
                                <Link to={`/suppliers/${product.supplierId}`} style={{ fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                                    {product.supplierName} ({product.supplierCode})
                                </Link>
                            ) : (
                                <span style={{ color: 'var(--text-muted)' }}>Chưa liên kết</span>
                            )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                            <span style={{ color: 'var(--text-muted)' }}>Đơn vị tính:</span>
                            <span>{product.unit}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                            <span style={{ color: 'var(--text-muted)' }}>Trạng thái:</span>
                            <span>{product.status === 'ACTIVE' ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}</span>
                        </div>
                        <div style={{ marginTop: 4 }}>
                            <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Mô tả sản phẩm:</span>
                            <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 6, fontSize: 13, color: '#475569', minHeight: 48, whiteSpace: 'pre-line' }}>
                                {product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Pricing & Inventory metrics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Pricing & Margin Card */}
                    <div className="card" style={{ padding: 22 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15, marginBottom: 16, color: 'var(--text-h)' }}>
                            <DollarSign size={18} color="var(--accent)" />
                            <span>Thông Tin Giá & Lợi Nhuận</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 14 }}>
                            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Giá nhập (Cost Price)</div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-h)' }}>{formatCurrency(product.importPrice)}</div>
                            </div>

                            <div style={{ padding: 14, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                                <div style={{ fontSize: 12, color: '#1e40af', marginBottom: 4 }}>Giá bán niêm yết</div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{formatCurrency(product.exportPrice)}</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                            <div style={{ padding: 14, background: profitMargin >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)', borderRadius: 8, border: `1px solid ${profitMargin >= 0 ? 'var(--success-border)' : 'var(--danger-border)'}` }}>
                                <div style={{ fontSize: 12, color: profitMargin >= 0 ? '#166534' : '#991b1b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <TrendingUp size={13} />
                                    <span>Chênh lệch / Đơn vị</span>
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: profitMargin >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                    {profitMargin >= 0 ? '+' : ''}{formatCurrency(profitMargin)}
                                </div>
                            </div>

                            <div style={{ padding: 14, background: profitMargin >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)', borderRadius: 8, border: `1px solid ${profitMargin >= 0 ? 'var(--success-border)' : 'var(--danger-border)'}` }}>
                                <div style={{ fontSize: 12, color: profitMargin >= 0 ? '#166534' : '#991b1b', marginBottom: 4 }}>Tỷ suất lợi nhuận</div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: profitMargin >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                    {profitPercent.toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Inventory & Stock Card */}
                    <div className="card" style={{ padding: 22, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15, marginBottom: 16, color: 'var(--text-h)' }}>
                            <Boxes size={18} color="var(--accent)" />
                            <span>Tình Trạng Kho Hàng</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 14 }}>
                            <div style={{ padding: 14, background: isOut ? 'var(--danger-bg)' : isLowStock ? 'var(--warning-bg)' : '#f0fdf4', borderRadius: 8, border: `1px solid ${isOut ? 'var(--danger-border)' : isLowStock ? 'var(--warning-border)' : 'var(--success-border)'}` }}>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Tồn kho thực tế</div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: isOut ? 'var(--danger)' : isLowStock ? '#d97706' : 'var(--success)' }}>
                                    {product.stockQuantity} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>{product.unit}</span>
                                </div>
                            </div>

                            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Định mức tối thiểu</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-h)' }}>
                                    {product.minStockLevel} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>{product.unit}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: 10, fontSize: 13.5 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Tổng giá trị vốn tồn kho (theo giá nhập):</span>
                                <span style={{ fontWeight: 700, color: 'var(--text-h)' }}>{formatCurrency(inventoryValuation)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Doanh số dự kiến (theo giá bán):</span>
                                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatCurrency(potentialRevenue)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 2 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Đánh giá an toàn tồn kho:</span>
                                <span>
                                    {isOut ? (
                                        <strong style={{ color: 'var(--danger)' }}>Báo động: Đã hết hàng</strong>
                                    ) : isLowStock ? (
                                        <strong style={{ color: '#d97706' }}>Cảnh báo: Dưới mức an toàn</strong>
                                    ) : (
                                        <strong style={{ color: 'var(--success)' }}>Ổn định: Đủ cung ứng</strong>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Edit Product */}
            <ProductModal
                isOpen={modalOpen}
                product={product}
                onClose={() => setModalOpen(false)}
                onSuccess={() => {
                    setModalOpen(false);
                    fetchProduct();
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
