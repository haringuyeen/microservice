import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingBag,
    RotateCcw,
    Eye,
    ArrowUpFromLine,
    Clock,
    CheckCircle2,
    XCircle,
    Phone,
    MapPin,
    AlertCircle
} from 'lucide-react';
import { getStorefrontOrders, createExportReceiptFromOrder, type StorefrontOrder } from '../api/orderApi';
import { useToast } from '../context/ToastContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

export default function OrdersPage() {
    const navigate = useNavigate();
    const toast = useToast();

    const [orders, setOrders] = useState<StorefrontOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [pageSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Filters
    const [keyword, setKeyword] = useState('');
    const [status, setStatus] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Selected Order for Detail Modal
    const [selectedOrder, setSelectedOrder] = useState<StorefrontOrder | null>(null);

    // Confirm Modal for Creating Export Receipt
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        order: StorefrontOrder | null;
    }>({
        isOpen: false,
        order: null
    });
    const [processingExport, setProcessingExport] = useState(false);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const fromIso = fromDate ? `${fromDate}T00:00:00` : undefined;
            const toIso = toDate ? `${toDate}T23:59:59` : undefined;

            const res = await getStorefrontOrders({
                keyword: keyword.trim() || undefined,
                status: status || undefined,
                fromDate: fromIso,
                toDate: toIso,
                page,
                size: pageSize
            });

            setOrders(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalElements(res.data.totalElements || 0);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Không thể tải danh sách đơn hàng online');
        } finally {
            setLoading(false);
        }
    }, [keyword, status, fromDate, toDate, page, pageSize, toast]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleResetFilter = () => {
        setKeyword('');
        setStatus('');
        setFromDate('');
        setToDate('');
        setPage(0);
    };

    const handleCreateReceipt = async () => {
        if (!confirmModal.order) return;
        setProcessingExport(true);
        try {
            await createExportReceiptFromOrder(confirmModal.order.id);
            toast.success(`Đã lập phiếu xuất kho cho đơn hàng ${confirmModal.order.orderCode} thành công!`);
            setConfirmModal({ isOpen: false, order: null });
            fetchOrders();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Lỗi khi lập phiếu xuất kho cho đơn hàng');
        } finally {
            setProcessingExport(false);
        }
    };

    const getStatusBadge = (orderStatus: string) => {
        switch (orderStatus) {
            case 'PENDING':
                return (
                    <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, fontSize: 12, backgroundColor: '#fef3c7', color: '#b45309' }}>
                        <Clock size={13} /> Chờ lập phiếu xuất
                    </span>
                );
            case 'EXPORT_REQUESTED':
                return (
                    <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, fontSize: 12, backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                        <ArrowUpFromLine size={13} /> Đã yêu cầu xuất kho
                    </span>
                );
            case 'EXPORTED':
                return (
                    <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, fontSize: 12, backgroundColor: '#dcfce7', color: '#15803d' }}>
                        <CheckCircle2 size={13} /> Đã xuất kho
                    </span>
                );
            case 'CANCELLED':
                return (
                    <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, fontSize: 12, backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                        <XCircle size={13} /> Đã huỷ
                    </span>
                );
            default:
                return <span>{orderStatus}</span>;
        }
    };

    return (
        <div className="container" style={{ padding: '24px', maxWidth: 1280, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ShoppingBag className="text-primary" size={26} color="#0284c7" />
                        Đơn hàng Storefront (Online B2C)
                    </h1>
                    <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0 0' }}>
                        Quản lý các đơn hàng khách đặt từ Storefront VELVETY và xuất kho tự động
                    </p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="card" style={{ padding: 16, backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'center' }}>
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Tìm kiếm</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Mã đơn, Tên, SĐT khách..."
                            value={keyword}
                            onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Trạng thái</label>
                        <select
                            className="form-control"
                            value={status}
                            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="PENDING">Chờ lập phiếu xuất (PENDING)</option>
                            <option value="EXPORT_REQUESTED">Đã yêu cầu xuất (EXPORT_REQUESTED)</option>
                            <option value="EXPORTED">Đã xuất kho (EXPORTED)</option>
                            <option value="CANCELLED">Đã huỷ (CANCELLED)</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Từ ngày</label>
                        <input
                            type="date"
                            className="form-control"
                            value={fromDate}
                            onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Đến ngày</label>
                        <input
                            type="date"
                            className="form-control"
                            value={toDate}
                            onChange={(e) => { setToDate(e.target.value); setPage(0); }}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                        <button
                            type="button"
                            onClick={handleResetFilter}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', cursor: 'pointer', fontSize: 13 }}
                        >
                            <RotateCcw size={14} /> Đặt lại
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                                <th style={{ padding: '12px 16px' }}>Mã đơn hàng</th>
                                <th style={{ padding: '12px 16px' }}>Khách hàng</th>
                                <th style={{ padding: '12px 16px' }}>Địa chỉ giao hàng</th>
                                <th style={{ padding: '12px 16px' }}>Số SP</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Tổng tiền</th>
                                <th style={{ padding: '12px 16px' }}>Trạng thái</th>
                                <th style={{ padding: '12px 16px' }}>Ngày đặt</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                                        Đang tải danh sách đơn hàng...
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                                        <AlertCircle size={32} style={{ display: 'block', margin: '0 auto 8px', color: '#94a3b8' }} />
                                        Chưa có đơn hàng nào phù hợp với bộ lọc
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0369a1' }}>
                                            {order.orderCode}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{order.customerName}</div>
                                            <div style={{ color: '#64748b', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                <Phone size={11} /> {order.customerPhone}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px', maxWidth: 220, color: '#334155' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                                                <MapPin size={13} color="#94a3b8" style={{ flexShrink: 0, marginTop: 2 }} />
                                                <span style={{ fontSize: 12.5, whiteSpace: 'normal' }}>{order.shippingAddress}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#475569' }}>
                                            {order.details ? order.details.reduce((sum, d) => sum + d.quantity, 0) : 0} món
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {getStatusBadge(order.status)}
                                            {order.exportReceiptId && (
                                                <div style={{ marginTop: 4 }}>
                                                    <a
                                                        href={`/export-receipts/${order.exportReceiptId}`}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            navigate(`/export-receipts/${order.exportReceiptId}`);
                                                        }}
                                                        style={{ fontSize: 11.5, color: '#2563eb', textDecoration: 'none' }}
                                                    >
                                                        Phiếu PXK #{order.exportReceiptId}
                                                    </a>
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>
                                            {new Date(order.createdAt).toLocaleString('vi-VN')}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                                                <button
                                                    type="button"
                                                    title="Xem chi tiết"
                                                    onClick={() => setSelectedOrder(order)}
                                                    style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                                                >
                                                    <Eye size={14} /> Chi tiết
                                                </button>

                                                {order.status === 'PENDING' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setConfirmModal({ isOpen: true, order })}
                                                        style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#0284c7', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}
                                                    >
                                                        <ArrowUpFromLine size={14} /> Lập phiếu xuất
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ padding: 16, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 13, color: '#64748b' }}>
                            Hiển thị <strong>{orders.length}</strong> trên tổng số <strong>{totalElements}</strong> đơn hàng
                        </div>
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={(p) => setPage(p)}
                        />
                    </div>
                )}
            </div>

            {/* Modal Detail */}
            {selectedOrder && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: 12, maxWidth: 650, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 16, marginBottom: 16 }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
                                    Chi tiết Đơn hàng: {selectedOrder.orderCode}
                                </h3>
                                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                                    Đặt lúc: {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                                </div>
                            </div>
                            <div>{getStatusBadge(selectedOrder.status)}</div>
                        </div>

                        {/* Customer Info */}
                        <div style={{ backgroundColor: '#f8fafc', padding: 14, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                            <div style={{ fontWeight: 600, color: '#334155', marginBottom: 6 }}>Thông tin nhận hàng:</div>
                            <div style={{ color: '#1e293b' }}><strong>Người nhận:</strong> {selectedOrder.customerName} ({selectedOrder.customerPhone})</div>
                            <div style={{ color: '#1e293b', marginTop: 4 }}><strong>Địa chỉ:</strong> {selectedOrder.shippingAddress}</div>
                            {selectedOrder.notes && (
                                <div style={{ color: '#64748b', marginTop: 4 }}><strong>Ghi chú:</strong> {selectedOrder.notes}</div>
                            )}
                            <div style={{ color: '#0369a1', marginTop: 4 }}><strong>Hình thức:</strong> Thanh toán khi nhận hàng (COD)</div>
                        </div>

                        {/* Items */}
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontWeight: 600, color: '#334155', marginBottom: 8, fontSize: 13 }}>Sản phẩm đặt mua:</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569' }}>
                                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Sản phẩm</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Số lượng</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Đơn giá</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedOrder.details.map((item) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '10px 12px' }}>
                                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.productName}</div>
                                                <div style={{ color: '#94a3b8', fontSize: 11.5 }}>Mã: {item.productCode}</div>
                                            </td>
                                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>{item.quantity}</td>
                                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.unitPrice)}
                                            </td>
                                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.totalPrice)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={3} style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Tổng tiền đơn hàng:</td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, fontSize: 16, color: '#0284c7' }}>
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedOrder.totalAmount)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                            <button
                                type="button"
                                onClick={() => setSelectedOrder(null)}
                                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', cursor: 'pointer', fontSize: 13 }}
                            >
                                Đóng
                            </button>
                            {selectedOrder.status === 'PENDING' && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const ord = selectedOrder;
                                        setSelectedOrder(null);
                                        setConfirmModal({ isOpen: true, order: ord });
                                    }}
                                    style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#0284c7', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                    <ArrowUpFromLine size={15} /> Lập phiếu xuất kho ngay
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Create Export Receipt Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title="Lập phiếu xuất kho từ đơn hàng"
                message={
                    confirmModal.order ? (
                        <div>
                            Bạn có chắc chắn muốn lập Phiếu xuất kho cho đơn hàng <strong>{confirmModal.order.orderCode}</strong> của khách hàng <strong>{confirmModal.order.customerName}</strong>?
                            <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
                                Sau khi lập, phiếu xuất sẽ được đưa vào danh sách chờ duyệt tại kho và trạng thái đơn hàng sẽ chuyển sang <strong>Đã yêu cầu xuất kho (EXPORT_REQUESTED)</strong>.
                            </div>
                        </div>
                    ) : ''
                }
                confirmText={processingExport ? 'Đang tạo...' : 'Xác nhận lập phiếu'}
                type="info"
                loading={processingExport}
                onConfirm={handleCreateReceipt}
                onClose={() => setConfirmModal({ isOpen: false, order: null })}
            />
        </div>
    );
}
