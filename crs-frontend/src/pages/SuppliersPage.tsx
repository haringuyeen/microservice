import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import {
    getSuppliers,
    deleteSupplier
} from '../api/warehouseApi';
import { useToast } from '../context/ToastContext';
import Pagination from '../components/Pagination';
import ConfirmModal, { type ConfirmType } from '../components/ConfirmModal';
import SupplierModal from '../components/SupplierModal';
import type { Supplier } from '../types/warehouse';
import type { ApiErrorResponse } from '../types/apiError';
import { useTableSort } from '../hooks/useTableSort';
import { SortableTh } from '../components/SortableTh';

export default function SuppliersPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [keyword, setKeyword] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(25);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    // Table sorting
    const { sortedItems: sortedSuppliers, sortConfig, requestSort } = useTableSort<Supplier>(
        suppliers,
        'code',
        'asc'
    );

    // Modal Create/Edit
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

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

    const fetchSuppliers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getSuppliers({ keyword: keyword.trim() || undefined, page, size: pageSize });
            setSuppliers(res.data.content);
            setTotalPages(res.data.totalPages);
            setTotalElements(res.data.totalElements);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [keyword, page, pageSize]);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        fetchSuppliers();
    };

    const openCreateModal = () => {
        setEditingSupplier(null);
        setModalOpen(true);
    };

    const openEditModal = (s: Supplier) => {
        setEditingSupplier(s);
        setModalOpen(true);
    };

    const handleDelete = (s: Supplier) => {
        setConfirmModal({
            isOpen: true,
            title: 'Xác nhận xóa nhà cung cấp',
            message: `Bạn có chắc chắn muốn xóa nhà cung cấp "${s.name}" (Mã: ${s.code})?\n\nLưu ý: Không thể xóa nhà cung cấp đang có phiếu nhập kho liên kết. Thao tác này không thể hoàn tác.`,
            type: 'danger',
            confirmText: 'Xóa nhà cung cấp',
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                    await deleteSupplier(s.id);
                    toast.success(`Đã xóa nhà cung cấp "${s.name}" thành công!`);
                    fetchSuppliers();
                } catch (err: unknown) {
                    const errorMsg = axios.isAxiosError<ApiErrorResponse>(err)
                        ? err.response?.data?.message || 'Không thể xóa nhà cung cấp đang có phiếu nhập liên kết.'
                        : 'Không thể xóa nhà cung cấp';
                    toast.error(errorMsg, 'Xóa nhà cung cấp thất bại');
                }
            }
        });
    };

    return (
        <div className="page-wrapper">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0 }}>Quản lý Nhà cung cấp</h1>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                        Thông tin đối tác, số điện thoại, địa chỉ và lịch sử các đợt giao nhập hàng.
                    </div>
                </div>
                <button onClick={openCreateModal} className="btn btn-primary">
                    <Plus size={16} />
                    <span>Thêm nhà cung cấp</span>
                </button>
            </div>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Tìm theo mã, tên, SĐT, người liên hệ..."
                    style={{ width: 340 }}
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
                            <SortableTh columnKey="code" sortConfig={sortConfig} onSort={requestSort} style={{ width: 110 }}>
                                Mã NCC
                            </SortableTh>
                            <SortableTh columnKey="name" sortConfig={sortConfig} onSort={requestSort}>
                                Tên nhà cung cấp
                            </SortableTh>
                            <SortableTh columnKey="phone" sortConfig={sortConfig} onSort={requestSort}>
                                Số điện thoại
                            </SortableTh>
                            <SortableTh columnKey="email" sortConfig={sortConfig} onSort={requestSort}>
                                Email
                            </SortableTh>
                            <SortableTh columnKey="address" sortConfig={sortConfig} onSort={requestSort}>
                                Địa chỉ
                            </SortableTh>
                            <SortableTh columnKey="contactPerson" sortConfig={sortConfig} onSort={requestSort}>
                                Người liên hệ
                            </SortableTh>
                            <th style={{ width: 110, textAlign: 'center' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Đang tải...</td></tr>
                        ) : sortedSuppliers.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Không tìm thấy nhà cung cấp nào</td></tr>
                        ) : (
                            sortedSuppliers.map((s) => (
                                <tr
                                    key={s.id}
                                    onClick={() => navigate(`/suppliers/${s.id}`)}
                                    style={{ cursor: 'pointer' }}
                                    title="Click để xem chi tiết nhà cung cấp"
                                >
                                    <td style={{ fontWeight: 600 }}>{s.code}</td>
                                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                                    <td>{s.phone}</td>
                                    <td>{s.email || '---'}</td>
                                    <td>{s.address || '---'}</td>
                                    <td>{s.contactPerson || '---'}</td>
                                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                        <div style={{ display: 'inline-flex', gap: 6 }}>
                                            <button onClick={() => openEditModal(s)} className="btn btn-secondary btn-sm" title="Chỉnh sửa">
                                                <Pencil size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(s)} className="btn btn-danger btn-sm" title="Xóa">
                                                <Trash2 size={14} />
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

            {/* Supplier Modal */}
            <SupplierModal
                isOpen={modalOpen}
                supplier={editingSupplier}
                onClose={() => setModalOpen(false)}
                onSuccess={() => fetchSuppliers()}
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