import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CartDrawerProps {
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckout }) => {
  const { cart, cartOpen, setCartOpen, updateItem, removeItem, clearUserCart, totalAmount, totalItems } = useCart();

  if (!cartOpen) return null;

  const formatPrice = (val?: number) => {
    if (!val) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={() => setCartOpen(false)}
        className="absolute inset-0 bg-charcoal/50 backdrop-blur-xs transition-opacity"
      ></div>

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-mint-border">
          
          {/* Header */}
          <div className="p-6 border-b border-mint-border flex items-center justify-between bg-pearl">
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} className="text-olive-700" />
              <h2 className="font-serif text-lg font-bold tracking-wide text-charcoal">
                Giỏ hàng của bạn ({totalItems})
              </h2>
            </div>
            
            <button
              onClick={() => setCartOpen(false)}
              className="p-1.5 rounded-full hover:bg-mint text-subtitle hover:text-charcoal transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {!cart?.items || cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-mint flex items-center justify-center text-olive-700 mb-4">
                  <ShoppingBag size={28} />
                </div>
                <h3 className="font-serif text-base font-semibold text-charcoal">Giỏ hàng của bạn đang trống</h3>
                <p className="text-xs text-subtitle mt-1 max-w-xs font-light">
                  Hãy khám phá bộ sưu tập dược mỹ phẩm VELVETY và chọn cho mình sản phẩm chăm sóc da phù hợp.
                </p>
                <button
                  onClick={() => setCartOpen(false)}
                  className="mt-5 px-6 py-2.5 rounded-full bg-olive-600 text-white text-xs font-semibold hover:bg-olive-700 transition-colors"
                >
                  Mua sắm ngay
                </button>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3.5 rounded-2xl bg-pearl border border-mint-border/60 hover:border-mint-border transition-all"
                >
                  {/* Item Image */}
                  <div className="w-16 h-16 rounded-xl bg-mint-card p-1.5 flex-shrink-0 flex items-center justify-center">
                    <img
                      src={item.imageUrl || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300'}
                      alt={item.productName}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  {/* Item Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal line-clamp-1">
                        {item.productName}
                      </h4>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-subtitle hover:text-red-600 p-1 transition-colors"
                        title="Xoá khỏi giỏ"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="text-xs font-bold text-olive-800 mt-1">
                      {formatPrice(item.unitPrice)}
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-mint-border rounded-lg bg-white p-0.5 text-xs">
                        <button
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateItem(item.id, item.quantity - 1);
                            } else {
                              removeItem(item.id);
                            }
                          }}
                          className="w-6 h-6 flex items-center justify-center hover:bg-mint rounded transition-colors text-charcoal font-bold"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateItem(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-mint rounded transition-colors text-charcoal font-bold"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-xs font-bold text-charcoal">
                        {formatPrice(item.totalPrice)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Button */}
          {cart?.items && cart.items.length > 0 && (
            <div className="p-6 border-t border-mint-border bg-pearl space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-subtitle">
                  <span>Tạm tính</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-subtitle">
                  <span>Vận chuyển (Toàn quốc)</span>
                  <span className="text-olive-700 font-semibold uppercase">Miễn phí</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-charcoal pt-2 border-t border-mint-border">
                  <span>Tổng tiền</span>
                  <span className="font-serif text-lg text-olive-800">{formatPrice(totalAmount)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setCartOpen(false);
                    onCheckout();
                  }}
                  className="w-full py-3.5 px-6 rounded-2xl bg-olive-600 hover:bg-olive-700 text-white font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  <span>Tiến hành đặt hàng (COD)</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  onClick={clearUserCart}
                  className="w-full py-2 text-center text-[11px] text-subtitle hover:text-red-600 transition-colors"
                >
                  Xoá sạch giỏ hàng
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
