import React, { useState } from 'react';
import { X, CheckCircle2, Truck, AlertCircle, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCustomerAuth } from '../context/AuthContext';
import { createOrder } from '../api/storefrontApi';
import { Order } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onOrderSuccess }) => {
  const { cart, totalAmount, clearUserCart } = useCart();
  const { user } = useCustomerAuth();

  const [customerName, setCustomerName] = useState(user?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [shippingAddress, setShippingAddress] = useState(user?.address || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const formatPrice = (val?: number) => {
    if (!val) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !shippingAddress.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ giao hàng');
      return;
    }

    if (!cart?.items || cart.items.length === 0) {
      setErrorMsg('Giỏ hàng trống');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const sessionId = localStorage.getItem('velvety_session_id') || undefined;

    try {
      const orderPayload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        shippingAddress: shippingAddress.trim(),
        notes: notes.trim() || undefined,
        sessionId,
        items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
      };

      const res = await createOrder(orderPayload);
      setCreatedOrder(res.data);
      await clearUserCart();
      onOrderSuccess(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi đặt hàng, vui lòng thử lại';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-mint-border">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-pearl border border-mint-border text-subtitle hover:text-charcoal hover:bg-mint transition-colors"
        >
          <X size={18} />
        </button>

        {/* Success View */}
        {createdOrder ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-mint text-olive-700 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 size={36} />
            </div>

            <h2 className="font-serif text-2xl font-bold text-charcoal">Đặt hàng thành công!</h2>
            <p className="text-xs text-subtitle mt-2 max-w-md mx-auto">
              Cảm ơn bạn đã lựa chọn VELVETY. Đơn hàng của bạn đã được tiếp nhận và chuyển đến bộ phận kho hàng WMS để chuẩn bị xuất kho.
            </p>

            <div className="mt-6 p-4 rounded-2xl bg-pearl border border-mint-border text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-subtitle">Mã đơn hàng:</span>
                <strong className="text-olive-800 font-bold">{createdOrder.orderCode}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-subtitle">Người nhận:</span>
                <span className="font-medium text-charcoal">{createdOrder.customerName} ({createdOrder.customerPhone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-subtitle">Địa chỉ:</span>
                <span className="font-medium text-charcoal max-w-[240px] truncate text-right">{createdOrder.shippingAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-subtitle">Phương thức:</span>
                <span className="font-medium text-olive-700">Thanh toán khi nhận hàng (COD)</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-mint-border text-sm font-bold text-charcoal">
                <span>Tổng thanh toán:</span>
                <span className="font-serif text-olive-800">{formatPrice(createdOrder.totalAmount)}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full py-3.5 px-6 rounded-2xl bg-olive-600 hover:bg-olive-700 text-white font-semibold text-xs tracking-wider uppercase transition-colors shadow-md"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        ) : (
          /* Checkout Form */
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Truck className="text-olive-700" size={22} />
              <div>
                <h2 className="font-serif text-xl font-bold text-charcoal">Thông tin nhận hàng (COD)</h2>
                <p className="text-xs text-subtitle">Vui lòng điền thông tin để nhân viên giao hàng liên hệ</p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-charcoal mb-1">Họ và tên người nhận *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-mint-border focus:outline-none focus:border-olive-500 bg-pearl"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal mb-1">Số điện thoại liên hệ *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ví dụ: 0912345678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-mint-border focus:outline-none focus:border-olive-500 bg-pearl"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal mb-1">Địa chỉ nhận hàng chi tiết *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-mint-border focus:outline-none focus:border-olive-500 bg-pearl resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal mb-1">Ghi chú giao hàng (tuỳ chọn)</label>
                <input
                  type="text"
                  placeholder="Giao giờ hành chính, gọi trước khi đến..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-mint-border focus:outline-none focus:border-olive-500 bg-pearl"
                />
              </div>

              {/* Payment Method COD */}
              <div className="pt-2">
                <label className="block font-semibold text-charcoal mb-1.5">Phương thức thanh toán:</label>
                <div className="p-3.5 rounded-xl bg-olive-50/60 border border-olive-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <input type="radio" checked readOnly className="accent-olive-600" />
                    <div>
                      <span className="font-bold text-olive-900 block">Thanh toán khi nhận hàng (COD)</span>
                      <span className="text-[11px] text-subtitle">Được kiểm tra hàng trước khi gửi tiền cho shipper</span>
                    </div>
                  </div>
                  <ShieldCheck size={18} className="text-olive-700" />
                </div>
              </div>

              {/* Order Summary Box */}
              <div className="p-4 rounded-2xl bg-pearl border border-mint-border space-y-1.5 mt-4">
                <div className="flex justify-between text-subtitle">
                  <span>Số lượng sản phẩm:</span>
                  <span>{cart?.items ? cart.items.reduce((s, i) => s + i.quantity, 0) : 0} món</span>
                </div>
                <div className="flex justify-between text-subtitle">
                  <span>Phí giao hàng:</span>
                  <span className="text-olive-700 font-semibold">Miễn phí (0 ₫)</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-charcoal pt-2 border-t border-mint-border">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="font-serif text-lg text-olive-800">{formatPrice(totalAmount)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-olive-600 hover:bg-olive-700 text-white font-semibold text-xs tracking-wider uppercase transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ShoppingBag size={15} />
                <span>{submitting ? 'Đang kiểm tra tồn kho & đặt hàng...' : 'Xác nhận đặt hàng ngay'}</span>
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
