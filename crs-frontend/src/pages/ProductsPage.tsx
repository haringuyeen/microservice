import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Plus,
    Filter,
    RotateCcw,
    Package as PackageIcon,
    Pencil,
    Trash2
} from 'lucide-react';
import {
    getProducts,
    getAllCategories,
    getAllSuppliers,
    deleteProduct
} from '../api/warehouseApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Pagination from '../components/Pagination';
import ConfirmModal, { type ConfirmType } from '../components/ConfirmModal';
import type { Product, Category, Supplier } from '../types/warehouse';
import type { ApiErrorResponse } from '../types/apiError';
import { useTableSort } from '../hooks/useTableSort';
import { SortableTh } from '../components/SortableTh';
import ProductModal from '../components/ProductModal';

export default function ProductsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();
    const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(25);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    // Table sorting
    const { sortedItems: sortedProducts, sortConfig, requestSort } = useTableSort<Product>(
        products,
        'code',
        'asc',
        {
            categoryName: (p) => p.categoryName || ''
        }
    );

    // Filters
    const [keyword, setKeyword] = useState('');
    const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
    const [inStock, setInStock] = useState<boolean | undefined>(undefined);
    const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
    const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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

    const fetchCategories = async () => {
        try {
            const [catRes, supRes] = await Promise.all([getAllCategories(), getAllSuppliers()]);
            setCategories(catRes.data);
            setSuppliers(supRes.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getProducts({
                keyword: keyword.trim() || undefined,
                categoryId: categoryId || undefined,
                inStock: inStock,
                minPrice: minPrice,
                maxPrice: maxPrice,
                page,
                size: pageSize
            });
            setProducts(res.data.content);
            setTotalPages(res.data.totalPages);
            setTotalElements(res.data.totalElements);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [keyword, categoryId, inStock, minPrice, maxPrice, page, pageSize]);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        fetchProducts();
    };

    const handleReset = () => {
        setKeyword('');
        setCategoryId(undefined);
        setInStock(undefined);
        setMinPrice(undefined);
        setMaxPrice(undefined);
        setPage(0);
    };

    const openCreateModal = () => {
        setEditingProduct(null);
        setModalOpen(true);
    };

    const openEditModal = (p: Product) => {
        setEditingProduct(p);
        setModalOpen(true);
    };

    const handleDelete = (p: Product) => {
        setConfirmModal({
            isOpen: true,
            title: 'Xác nhận xóa sản phẩm',
            message: `Bạn có chắc chắn muốn xóa sản phẩm "${p.name}" (Mã: ${p.code})?\n\nLưu ý: Không thể xóa sản phẩm nếu đã phát sinh phiếu nhập/xuất kho. Thao tác này không thể hoàn tác.`,
            type: 'danger',
            confirmText: 'Xóa sản phẩm',
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                    await deleteProduct(p.id);
                    toast.success(`Đã xóa sản phẩm "${p.name}" thành công!`);
                    fetchProducts();
                } catch (err: unknown) {
                    const errorMsg = axios.isAxiosError<ApiErrorResponse>(err)
                        ? err.response?.data?.message || 'Không thể xóa sản phẩm này (có thể đã có phiếu nhập/xuất liên quan).'
                        : 'Không thể xóa sản phẩm';
                    toast.error(errorMsg, 'Xóa sản phẩm thất bại');
                }
            }
        });
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    return (
        <div className="page-wrapper">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0 }}>Quản lý Sản phẩm & Tồn kho</h1>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                        Tra cứu số lượng tồn, giá cả, và cấu hình thông tin danh mục hàng hóa.
                    </div>
                </div>
                {canManage && (
                    <button onClick={openCreateModal} className="btn btn-primary">
                        <Plus size={16} />
                        <span>Thêm sản phẩm mới</span>
                    </button>
                )}
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
                            placeholder="Mã hoặc tên sản phẩm..."
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Danh mục</label>
                        <select
                            value={categoryId || ''}
                            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                            style={{ width: '100%' }}
                        >
                            <option value="">Tất cả danh mục</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Tình trạng tồn</label>
                        <select
                            value={inStock === undefined ? '' : inStock ? 'true' : 'false'}
                            onChange={(e) => {
                                const v = e.target.value;
                                if (v === '') setInStock(undefined);
                                else setInStock(v === 'true');
                            }}
                            style={{ width: '100%' }}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="true">Còn hàng (Tồn &gt; 0)</option>
                            <option value="false">Hết hàng (Tồn = 0)</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Giá bán từ</label>
                        <input
                            type="number"
                            value={minPrice ?? ''}
                            onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="0 đ"
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Giá bán đến</label>
                        <input
                            type="number"
                            value={maxPrice ?? ''}
                            onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="Tối đa"
                            style={{ width: '100%' }}
                        />
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

            {/* Products Table */}
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <SortableTh columnKey="code" sortConfig={sortConfig} onSort={requestSort} style={{ width: 100 }}>
                                Mã SP
                            </SortableTh>
                            <th style={{ width: 54 }}>Ảnh</th>
                            <SortableTh columnKey="name" sortConfig={sortConfig} onSort={requestSort}>
                                Tên sản phẩm
                            </SortableTh>
                            <SortableTh columnKey="categoryName" sortConfig={sortConfig} onSort={requestSort}>
                                Danh mục
                            </SortableTh>
                            <SortableTh columnKey="unit" sortConfig={sortConfig} onSort={requestSort}>
                                ĐVT
                            </SortableTh>
                            <SortableTh columnKey="importPrice" sortConfig={sortConfig} onSort={requestSort} align="right">
                                Giá nhập
                            </SortableTh>
                            <SortableTh columnKey="exportPrice" sortConfig={sortConfig} onSort={requestSort} align="right">
                                Giá bán
                            </SortableTh>
                            <SortableTh columnKey="stockQuantity" sortConfig={sortConfig} onSort={requestSort} align="center">
                                Tồn kho
                            </SortableTh>
                            <SortableTh columnKey="status" sortConfig={sortConfig} onSort={requestSort} align="center">
                                Tình trạng
                            </SortableTh>
                            {canManage && <th style={{ textAlign: 'center', width: 140 }}>Thao tác</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={canManage ? 10 : 9} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                                    Đang tải danh sách sản phẩm...
                                </td>
                            </tr>
                        ) : sortedProducts.length === 0 ? (
                            <tr>
                                <td colSpan={canManage ? 10 : 9} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                                    Không tìm thấy sản phẩm nào phù hợp
                                </td>
                            </tr>
                        ) : (
                            sortedProducts.map((p) => {
                                const isLowStock = p.stockQuantity <= p.minStockLevel;
                                const isOut = p.stockQuantity === 0;
                                return (
                                    <tr
                                        key={p.id}
                                        onClick={() => navigate(`/products/${p.id}`)}
                                        style={{ cursor: 'pointer' }}
                                        title="Click để xem chi tiết sản phẩm"
                                    >
                                        <td style={{ fontWeight: 600 }}>{p.code}</td>
                                        <td style={{ width: 48 }}>
                                            {p.imageUrl ? (
                                                <img
                                                    src={p.imageUrl}
                                                    alt={p.name}
                                                    style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }}
                                                />
                                            ) : (
                                                <div style={{ width: 36, height: 36, borderRadius: 6, background: '#f1f5f9', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <PackageIcon size={18} color="#94a3b8" />
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{p.name}</div>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' }}>
                                                {p.supplierName && (
                                                    <span style={{ fontSize: 11, color: '#0369a1', background: '#e0f2fe', padding: '1px 6px', borderRadius: 4, fontWeight: 500 }}>
                                                        NCC: {p.supplierName}
                                                    </span>
                                                )}
                                                {p.description && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.description}</span>}
                                            </div>
                                        </td>
                                        <td><span className="badge badge-info">{p.categoryName}</span></td>
                                        <td>{p.unit}</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(p.importPrice)}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(p.exportPrice)}</td>
                                        <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 15, color: isOut ? 'var(--danger)' : isLowStock ? 'var(--warning)' : 'inherit' }}>
                                            {p.stockQuantity}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {isOut ? (
                                                <span className="badge badge-danger">Hết hàng</span>
                                            ) : isLowStock ? (
                                                <span className="badge badge-warning" title={`Tối thiểu: ${p.minStockLevel}`}>Sắp hết</span>
                                            ) : (
                                                <span className="badge badge-success">Còn hàng</span>
                                            )}
                                        </td>
                                        {canManage && (
                                            <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                                <div style={{ display: 'inline-flex', gap: 6 }}>
                                                    <button onClick={() => openEditModal(p)} className="btn btn-secondary btn-sm" title="Chỉnh sửa">
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button onClick={() => handleDelete(p)} className="btn btn-danger btn-sm" title="Xóa">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
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

            {/* Product Modal */}
            <ProductModal
                isOpen={modalOpen}
                product={editingProduct}
                categories={categories}
                suppliers={suppliers}
                onClose={() => setModalOpen(false)}
                onSuccess={() => {
                    setModalOpen(false);
                    fetchProducts();
                }}
            />

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