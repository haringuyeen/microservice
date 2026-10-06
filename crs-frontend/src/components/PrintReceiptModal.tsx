import type { ImportReceipt, ExportReceipt } from '../types/warehouse';
import { Printer, X } from 'lucide-react';

interface PrintReceiptModalProps {
    receipt: ImportReceipt | ExportReceipt | null;
    type: 'IMPORT' | 'EXPORT';
    onClose: () => void;
}

export default function PrintReceiptModal({ receipt, type, onClose }: PrintReceiptModalProps) {
    if (!receipt) return null;

    const isImport = type === 'IMPORT';
    const importRec = isImport ? (receipt as ImportReceipt) : null;
    const exportRec = !isImport ? (receipt as ExportReceipt) : null;

    const formatCurrency = (amount?: number) => {
        if (amount == null) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const formatDate = (isoString?: string) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        return d.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content modal-lg" style={{ backgroundColor: '#ffffff', color: '#111827' }}>
                <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>Xem & In Phiếu {isImport ? 'Nhập Kho' : 'Xuất Kho'}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => window.print()} className="btn btn-primary btn-sm">
                            <Printer size={15} />
                            <span>In phiếu này</span>
                        </button>
                        <button onClick={onClose} className="btn btn-secondary btn-sm">
                            <X size={15} />
                            <span>Đóng</span>
                        </button>
                    </div>
                </div>

                {/* PRINT AREA */}
                <div style={{
                    padding: '24px 32px',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    background: '#fff',
                    fontFamily: 'serif',
                    lineHeight: 1.6
                }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #374151', paddingBottom: 12 }}>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 16, textTransform: 'uppercase' }}>HỆ THỐNG KHO HÀNG WMS VIỆT NAM</div>
                            <div style={{ fontSize: 13, color: '#4b5563' }}>Địa chỉ: KCN Nam Thăng Long, Bắc Từ Liêm, TP. Hà Nội</div>
                            <div style={{ fontSize: 13, color: '#4b5563' }}>Điện thoại: 024.3999.8888 - Hotline: 1900 6868</div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: 13 }}>
                            <div><strong>Mã phiếu:</strong> {receipt.code}</div>
                            <div><strong>Ngày lập:</strong> {formatDate(isImport ? importRec?.importDate : exportRec?.exportDate)}</div>
                            <div>
                                <strong>Trạng thái:</strong>{' '}
                                <span style={{
                                    fontWeight: 700,
                                    color: (receipt.status === 'APPROVED' || receipt.status === 'COMPLETED') ? '#059669' :
                                           receipt.status === 'PENDING' ? '#d97706' : '#dc2626'
                                }}>
                                    {receipt.status === 'APPROVED' ? 'ĐÃ DUYỆT' :
                                     receipt.status === 'COMPLETED' ? 'ĐÃ HOÀN THÀNH' :
                                     receipt.status === 'PENDING' ? 'CHỜ DUYỆT' :
                                     receipt.status === 'REJECTED' ? 'TỪ CHỐI DUYỆT' : 'ĐÃ HỦY'}
                                </span>
                            </div>
                            {receipt.approverName && (
                                <div><strong>Người duyệt:</strong> {receipt.approverName}</div>
                            )}
                        </div>
                    </div>

                    {/* Title */}
                    <div style={{ textAlign: 'center', margin: '20px 0 16px' }}>
                        <h2 style={{
                            margin: 0,
                            fontSize: 22,
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase'
                        }}>
                            {isImport ? 'PHIẾU NHẬP KHO HÀNG HÓA' : 'PHIẾU XUẤT KHO HÀNG HÓA'}
                        </h2>
                        <div style={{ fontSize: 13, fontStyle: 'italic', color: '#6b7280' }}>
                            Số: {receipt.code}
                        </div>
                    </div>

                    {/* Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 14, marginBottom: 16 }}>
                        {isImport ? (
                            <>
                                <div><strong>Nhà cung cấp:</strong> {importRec?.supplierName}</div>
                                <div><strong>Mã NCC:</strong> {importRec?.supplierCode}</div>
                                <div><strong>Điện thoại NCC:</strong> {importRec?.supplierPhone || '---'}</div>
                                <div><strong>Địa chỉ:</strong> {importRec?.supplierAddress || '---'}</div>
                            </>
                        ) : (
                            <>
                                <div><strong>Khách hàng:</strong> {exportRec?.customerName}</div>
                                <div><strong>Mã KH:</strong> {exportRec?.customerCode}</div>
                                <div><strong>Điện thoại KH:</strong> {exportRec?.customerPhone || '---'}</div>
                                <div><strong>Địa chỉ giao:</strong> {exportRec?.customerAddress || '---'}</div>
                            </>
                        )}
                        <div><strong>Người lập phiếu:</strong> {receipt.creatorName}</div>
                        <div><strong>Ghi chú:</strong> {receipt.notes || 'Không có'}</div>
                    </div>

                    {/* Items Table */}
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        margin: '16px 0',
                        fontSize: 13
                    }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'center' }}>
                                <th style={{ border: '1px solid #9ca3af', padding: '6px 8px', width: 40 }}>STT</th>
                                <th style={{ border: '1px solid #9ca3af', padding: '6px 8px', width: 100 }}>Mã SP</th>
                                <th style={{ border: '1px solid #9ca3af', padding: '6px 8px' }}>Tên sản phẩm</th>
                                <th style={{ border: '1px solid #9ca3af', padding: '6px 8px', width: 70 }}>ĐVT</th>
                                <th style={{ border: '1px solid #9ca3af', padding: '6px 8px', width: 70 }}>SL</th>
                                <th style={{ border: '1px solid #9ca3af', padding: '6px 8px', width: 120 }}>Đơn giá</th>
                                <th style={{ border: '1px solid #9ca3af', padding: '6px 8px', width: 130 }}>Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {receipt.details && receipt.details.map((item, idx) => (
                                <tr key={idx}>
                                    <td style={{ border: '1px solid #9ca3af', padding: '6px 8px', textAlign: 'center' }}>{idx + 1}</td>
                                    <td style={{ border: '1px solid #9ca3af', padding: '6px 8px', textAlign: 'center' }}>{item.productCode}</td>
                                    <td style={{ border: '1px solid #9ca3af', padding: '6px 8px' }}>{item.productName}</td>
                                    <td style={{ border: '1px solid #9ca3af', padding: '6px 8px', textAlign: 'center' }}>{item.unit}</td>
                                    <td style={{ border: '1px solid #9ca3af', padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{item.quantity}</td>
                                    <td style={{ border: '1px solid #9ca3af', padding: '6px 8px', textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                                    <td style={{ border: '1px solid #9ca3af', padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>
                                        {formatCurrency(item.totalPrice || item.quantity * item.unitPrice)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ fontWeight: 700, backgroundColor: '#f9fafb' }}>
                                <td colSpan={6} style={{ border: '1px solid #9ca3af', padding: '8px', textAlign: 'right' }}>
                                    TỔNG CỘNG:
                                </td>
                                <td style={{ border: '1px solid #9ca3af', padding: '8px', textAlign: 'right', color: '#b91c1c', fontSize: 15 }}>
                                    {formatCurrency(receipt.totalAmount)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    {/* Signatures */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        textAlign: 'center',
                        marginTop: 32,
                        fontSize: 13
                    }}>
                        <div>
                            <strong>Người lập phiếu</strong>
                            <div style={{ fontStyle: 'italic', fontSize: 12 }}>(Ký, họ tên)</div>
                            <div style={{ marginTop: 60, fontWeight: 600 }}>{receipt.creatorName}</div>
                        </div>
                        <div>
                            <strong>Người giao / nhận</strong>
                            <div style={{ fontStyle: 'italic', fontSize: 12 }}>(Ký, họ tên)</div>
                            <div style={{ marginTop: 60 }}>.........................</div>
                        </div>
                        <div>
                            <strong>Thủ kho / Người duyệt</strong>
                            <div style={{ fontStyle: 'italic', fontSize: 12 }}>(Ký, họ tên)</div>
                            <div style={{ marginTop: 60, fontWeight: 600 }}>{receipt.approverName || '.........................'}</div>
                        </div>
                        <div>
                            <strong>Kế toán trưởng</strong>
                            <div style={{ fontStyle: 'italic', fontSize: 12 }}>(Ký, đóng dấu)</div>
                            <div style={{ marginTop: 60 }}>.........................</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}