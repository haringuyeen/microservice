import React, { useState, useEffect } from 'react';
import { X, Clock, ArrowUpFromLine, CheckCircle2, XCircle, PackageCheck, AlertCircle, Calendar } from 'lucide-react';
import { Order } from '../types';
import { fetchMyOrders } from '../api/storefrontApi';

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrdersModal: React.FC<OrdersModalProps> = ({ isOpen, onClose }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchMyOrders()
        .then((res) => setOrders(res.data || []))
        .catch((err) => console.error('Error fetching my orders', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatPrice = (val?: number) => {
    if (!val) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock size={13} />
            <span>Chưa xác nhận</span>
          </span>
        );
      case 'EXPORT_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
            <ArrowUpFromLine size={13} />
            <span>Đã yêu cầu xuất kho</span>
          </span>
        );
      case 'EXPORTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 size={13} />
            <span>Đã xuất kho</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <XCircle size={13} />
            <span>Đã huỷ</span>
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-mint-border flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-mint-border flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <PackageCheck className="text-olive-700" size={22} />
            <h2 className="font-serif text-xl font-bold text-charcoal">
              Lịch sử đơn hàng của bạn
            </h2>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-mint text-subtitle hover:text-charcoal transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {loading ? (
            <div className="py-12 text-center text-xs text-subtitle">
              Đang tải danh sách đơn hàng...
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-xs text-subtitle">
              <AlertCircle size={32} className="mx-auto mb-2 text-subtitle/60" />
              Bạn chưa có đơn hàng nào được ghi nhận.
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="p-5 rounded-2xl bg-pearl border border-mint-border space-y-3"
              >
                {/* Order Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-mint-border text-xs">
                  <div>
                    <span className="text-subtitle">Mã đơn: </span>
                    <strong className="text-olive-800 text-sm font-bold">{order.orderCode}</strong>
                    <div className="text-[11px] text-subtitle flex items-center gap-1 mt-0.5">
                      <Calendar size={11} />
                      <span>{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>

                  <div>{renderStatusBadge(order.status)}</div>
                </div>

                {/* Items */}
                <div className="space-y-2 text-xs">
                  {order.details.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-charcoal">
                      <div>
                        <span className="font-semibold uppercase tracking-wider">{item.productName}</span>
                        <span className="text-subtitle ml-2">x {item.quantity}</span>
                      </div>
                      <span className="font-medium">{formatPrice(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>

                {/* Footer & Total */}
                <div className="pt-3 border-t border-mint-border flex items-center justify-between text-xs">
                  <div className="text-subtitle">
                    Giao tới: <span className="text-charcoal font-medium">{order.shippingAddress}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-subtitle text-[11px] block">Tổng thanh toán (COD):</span>
                    <span className="font-serif text-base font-bold text-olive-800">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
