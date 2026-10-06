import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { getCategories, deleteCategory } from '../api/warehouseApi';
import { useToast } from '../context/ToastContext';
import Pagination from '../components/Pagination';
import ConfirmModal, { type ConfirmType } from '../components/ConfirmModal';
import CategoryModal from '../components/CategoryModal';
import type { Category } from '../types/warehouse';
import type { ApiErrorResponse } from '../types/apiError';
import { useTableSort } from '../hooks/useTableSort';
import { SortableTh } from '../components/SortableTh';

export default function CategoriesPage() {
    const toast = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [keyword, setKeyword] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(25);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    // Table sorting
    const { sortedItems: sortedCategories, sortConfig, requestSort } = useTableSort<Category>(
        categories,
        'code',
        'asc'
    );

    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

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

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getCategories({ keyword: keyword.trim() || undefined, page, size: pageSize });
            setCategories(res.data.content);
            setTotalPages(res.data.totalPages);
            setTotalElements(res.data.totalElements);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [keyword, page, pageSize]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        fetchCategories();
    };

    const openCreateModal = () => {
        setEditingCategory(null);
        setModalOpen(true);
    };

    const openEditModal = (c: Category) => {
        setEditingCategory(c);
        setModalOpen(true);
    };

    const handleDelete = (c: Category) => {
        setConfirmModal({
            isOpen: true,
            title: 'Xác nhận xóa danh mục',
            message: `Bạn có chắc chắn muốn xóa danh mục "${c.name}" (Mã: ${c.code})?\n\nLưu ý: Không thể xóa danh mục đang có sản phẩm liên kết. Thao tác này không thể hoàn tác.`,
            type: 'danger',
            confirmText: 'Xóa danh mục',
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                    await deleteCategory(c.id);
                    toast.success(`Đã xóa danh mục "${c.name}" thành công!`);
                    fetchCategories();
                } catch (err: unknown) {
                    const errorMsg = axios.isAxiosError<ApiErrorResponse>(err)
                        ? err.response?.data?.message || 'Không thể xóa danh mục đang có sản phẩm liên kết.'
                        : 'Không thể xóa danh mục';
                    toast.error(errorMsg, 'Xóa danh mục thất bại');
                }
            }
        });
    };

    return (
        <div className="page-wrapper">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0 }}>Quản lý Danh mục Sản phẩm</h1>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                        Phân nhóm các mặt hàng trong kho để thuận tiện lọc và báo cáo.
                    </div>
                </div>
                <button onClick={openCreateModal} className="btn btn-primary">
                    <Plus size={16} />
                    <span>Thêm danh mục</span>
                </button>
            </div>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Tìm theo mã hoặc tên danh mục..."
                    style={{ width: 320 }}
                />
                <button type="submit" className="btn btn-secondary">
                    <Search size={15} />
                    <span>Tìm</span>
                </button>
            </form>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <SortableTh columnKey="code" sortConfig={sortConfig} onSort={requestSort} style={{ width: 140 }}>
                                Mã danh mục
                            </SortableTh>
                            <SortableTh columnKey="name" sortConfig={sortConfig} onSort={requestSort}>
                                Tên danh mục
                            </SortableTh>
                            <SortableTh columnKey="description" sortConfig={sortConfig} onSort={requestSort}>
                                Mô tả
                            </SortableTh>
                            <th style={{ width: 140, textAlign: 'center' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Đang tải...</td></tr>
                        ) : sortedCategories.length === 0 ? (
                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Không có danh mục nào</td></tr>
                        ) : (
                            sortedCategories.map((c) => (
                                <tr key={c.id}>
                                    <td style={{ fontWeight: 600 }}>{c.code}</td>
                                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{c.description || '---'}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'inline-flex', gap: 6 }}>
                                            <button onClick={() => openEditModal(c)} className="btn btn-secondary btn-sm">
                                                <Pencil size={13} />
                                                <span>Sửa</span>
                                            </button>
                                            <button onClick={() => handleDelete(c)} className="btn btn-danger btn-sm">
                                                <Trash2 size={13} />
                                                <span>Xóa</span>
                                            </button>
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

            <CategoryModal
                isOpen={modalOpen}
                category={editingCategory}
                onClose={() => setModalOpen(false)}
                onSuccess={() => fetchCategories()}
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