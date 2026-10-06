import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import {
    getCustomers,
    deleteCustomer
} from '../api/warehouseApi';
import { useToast } from '../context/ToastContext';
import Pagination from '../components/Pagination';
import ConfirmModal, { type ConfirmType } from '../components/ConfirmModal';
import CustomerModal from '../components/CustomerModal';
import type { Customer } from '../types/warehouse';
import type { ApiErrorResponse } from '../types/apiError';
import { useTableSort } from '../hooks/useTableSort';
import { SortableTh } from '../components/SortableTh';

export default function CustomersPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [keyword, setKeyword] = useState('');
    const [customerType, setCustomerType] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(25);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    // Table sorting
    const { sortedItems: sortedCustomers, sortConfig, requestSort } = useTableSort<Customer>(
        customers,
        'code',
        'asc'
    );

    // Modal Create/Edit
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

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

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getCustomers({
                keyword: keyword.trim() || undefined,
                customerType: customerType || undefined,
                page,
                size: pageSize
            });
            setCustomers(res.data.content);
            setTotalPages(res.data.totalPages);
            setTotalElements(res.data.totalElements);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [keyword, customerType, page, pageSize]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        fetchCustomers();
    };

    const openCreateModal = () => {
        setEditingCustomer(null);
        setModalOpen(true);
    };

    const openEditModal = (c: Customer) => {
        setEditingCustomer(c);
        setModalOpen(true);
    };

    const handleDelete = (c: Customer) => {
        setConfirmModal({
            isOpen: true,
            title: 'Xác nhận xóa khách hàng',
            message: `Bạn có chắc chắn muốn xóa khách hàng "${c.name}" (Mã: ${c.code})?\n\nLưu ý: Không thể xóa khách hàng đang có phiếu xuất kho liên kết. Thao tác này không thể hoàn tác.`,
            type: 'danger',
            confirmText: 'Xóa khách hàng',
            onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                    await deleteCustomer(c.id);
                    toast.success(`Đã xóa khách hàng "${c.name}" thành công!`);
                    fetchCustomers();
                } catch (err: unknown) {
                    const errorMsg = axios.isAxiosError<ApiErrorResponse>(err)
                        ? err.response?.data?.message || 'Không thể xóa khách hàng đang có phiếu xuất liên kết.'
                        : 'Không thể xóa khách hàng';
                    toast.error(errorMsg, 'Xóa thất bại');
                }
            }
        });
    };

    const renderTypeBadge = (t?: string) => {
        if (t === 'DOANH_NGHIEP') return <span className="badge badge-info">Doanh nghiệp</span>;
        if (t === 'DAI_LY') return <span className="badge badge-warning">Đại lý</span>;
        return <span className="badge badge-success">Cá nhân</span>;
    };

    return (
        <div className="page-wrapper">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0 }}>Quản lý Khách hàng</h1>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                        Danh sách đối tác mua hàng, phân loại khách và theo dõi lịch sử đơn xuất kho.
                    </div>
                </div>
                <button onClick={openCreateModal} className="btn btn-primary">
                    <Plus size={16} />
                    <span>Thêm khách hàng</span>
                </button>
            </div>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Tìm theo mã, tên, SĐT, email..."
                    style={{ width: 320 }}
                />
                <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value)}
                    style={{ width: 160 }}
                >
                    <option value="">Tất cả loại KH</option>
                    <option value="CA_NHAN">Cá nhân</option>
                    <option value="DOANH_NGHIEP">Doanh nghiệp</option>
                    <option value="DAI_LY">Đại lý</option>
                </select>
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
                                Mã KH
                            </SortableTh>
                            <SortableTh columnKey="name" sortConfig={sortConfig} onSort={requestSort}>
                                Tên khách hàng
                            </SortableTh>
                            <SortableTh columnKey="customerType" sortConfig={sortConfig} onSort={requestSort}>
                                Loại KH
                            </SortableTh>
                            <SortableTh columnKey="phone" sortConfig={sortConfig} onSort={requestSort}>
                                Số điện thoại
                            </SortableTh>
                            <SortableTh columnKey="email" sortConfig={sortConfig} onSort={requestSort}>
                                Email
                            </SortableTh>
                            <SortableTh columnKey="address" sortConfig={sortConfig} onSort={requestSort}>
                                Địa chỉ giao hàng
                            </SortableTh>
                            <th style={{ width: 110, textAlign: 'center' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Đang tải...</td></tr>
                        ) : sortedCustomers.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Không tìm thấy khách hàng nào</td></tr>
                        ) : (
                            sortedCustomers.map((c) => (
                                <tr
                                    key={c.id}
                                    onClick={() => navigate(`/customers/${c.id}`)}
                                    style={{ cursor: 'pointer' }}
                                    title="Click để xem chi tiết khách hàng"
                                >
                                    <td style={{ fontWeight: 600 }}>{c.code}</td>
                                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                                    <td>{renderTypeBadge(c.customerType)}</td>
                                    <td>{c.phone}</td>
                                    <td>{c.email || '---'}</td>
                                    <td>{c.address || '---'}</td>
                                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                        <div style={{ display: 'inline-flex', gap: 6 }}>
                                            <button onClick={() => openEditModal(c)} className="btn btn-secondary btn-sm" title="Chỉnh sửa">
                                                <Pencil size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(c)} className="btn btn-danger btn-sm" title="Xóa">
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

            {/* Modal Create/Edit Customer */}
            <CustomerModal
                isOpen={modalOpen}
                customer={editingCustomer}
                onClose={() => setModalOpen(false)}
                onSuccess={() => {
                    setModalOpen(false);
                    fetchCustomers();
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