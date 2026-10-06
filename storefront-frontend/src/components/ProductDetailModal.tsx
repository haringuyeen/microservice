import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Truck, RefreshCw, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { fetchProductById } from '../api/storefrontApi';
import { useCart } from '../context/CartContext';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const { addItem } = useCart();
  const [currentProduct, setCurrentProduct] = useState<Product | null>(product);
  const [quantity, setQuantity] = useState<number>(1);
  const [addingToCart, setAddingToCart] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentProduct(null);
    onClose();
  };

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (product) {
      setCurrentProduct(product);
      setQuantity(1);
      setErrorMsg(null);

      // Fetch real-time fresh stock and details
      fetchProductById(product.id)
        .then((res) => {
          if (res.data) {
            setCurrentProduct(res.data);
          }
        })
        .catch((err) => console.error('Error fetching live product stock', err));
    } else {
      setCurrentProduct(null);
    }
  }, [product]);

  // If product is null, DO NOT render modal
  if (!product || !currentProduct) return null;

  const stock = currentProduct.stockQuantity || 0;
  const isOutOfStock = stock <= 0;
  const productImage = currentProduct.imageUrl || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600';
  const categoryBadge = currentProduct.needTag || currentProduct.categoryName || 'Sản phẩm';

  const handleQuantityMinus = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
      setErrorMsg(null);
    }
  };

  const handleQuantityPlus = () => {
    if (quantity < stock) {
      setQuantity(quantity + 1);
      setErrorMsg(null);
    } else {
      setErrorMsg(`Chỉ còn tối đa ${stock} sản phẩm trong kho`);
    }
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    setAddingToCart(true);
    setErrorMsg(null);
    try {
      await addItem(currentProduct.id, quantity);
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng');
    } finally {
      setAddingToCart(false);
    }
  };

  const formatPrice = (val?: number) => {
    if (!val) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-mint-border cursor-default"
      >
        {/* Sticky Close Button in Top-Right Corner */}
        <div className="sticky top-0 right-0 z-50 flex justify-end p-4 pointer-events-none">
          <button
            type="button"
            aria-label="Đóng"
            onClick={handleClose}
            className="pointer-events-auto p-2.5 rounded-full bg-pearl border border-mint-border text-charcoal hover:text-olive-800 hover:bg-mint transition-all cursor-pointer shadow-md hover:scale-110 active:scale-95 flex items-center justify-center"
          >
            <X size={20} className="text-charcoal" />
          </button>
        </div>

        <div className="p-6 sm:p-10 pt-2 sm:pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Left Column: Product Image & Description */}
            <div className="flex flex-col justify-start">
              {/* Large Image on Soft Mint Backdrop */}
              <div className="relative aspect-square w-full rounded-3xl bg-mint-card flex items-center justify-center p-8 overflow-hidden border border-mint-border/60">
                <div className="absolute inset-6 rounded-full bg-mint/70 border border-mint-border/40"></div>
                <img
                  src={productImage}
                  alt={currentProduct.name}
                  className="relative z-10 max-h-full max-w-full object-contain drop-shadow-xl transition-all duration-300"
                />
              </div>

              {/* Product Description */}
              {currentProduct.description && (
                <div className="mt-5 p-4 rounded-2xl bg-pearl border border-mint-border/60">
                  <h3 className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5">Mô tả sản phẩm</h3>
                  <p className="text-xs sm:text-sm text-subtitle leading-relaxed font-light">{currentProduct.description}</p>
                </div>
              )}
            </div>

            {/* Right Column: Info & Actions */}
            <div className="flex flex-col justify-between">
              <div>
                {/* Title & Badge */}
                <div className="flex items-start justify-between gap-4 pr-8">
                  <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-wide text-charcoal uppercase">
                    {currentProduct.name}
                  </h1>
                  {currentProduct.isBestSeller && (
                    <span className="flex-shrink-0 px-3 py-1 bg-amber-100 text-amber-800 text-[11px] font-bold tracking-wider rounded-full">
                      BEST SELLER
                    </span>
                  )}
                </div>

                {/* Sub-info: Category & Unit */}
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-subtitle">
                  <span className="font-semibold text-olive-700">{categoryBadge}</span>
                  {currentProduct.unit && (
                    <>
                      <span>|</span>
                      <span>Đơn vị tính: {currentProduct.unit}</span>
                    </>
                  )}
                </div>

                {/* Price Display */}
                <div className="mt-5 flex items-baseline gap-3">
                  <span className="font-serif text-3xl font-bold text-olive-800">
                    {formatPrice(currentProduct.exportPrice)}
                  </span>
                  {currentProduct.originalPrice && currentProduct.originalPrice > currentProduct.exportPrice && (
                    <span className="text-sm text-subtitle line-through">
                      {formatPrice(currentProduct.originalPrice)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-subtitle mt-0.5">Giá đã bao gồm thuế VAT và áp dụng giao hàng COD toàn quốc.</p>

                {/* Real-time Stock & Quantity Selector */}
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-charcoal block mb-1">Số lượng:</label>
                    <div className="flex items-center border border-mint-border rounded-xl bg-pearl p-1 w-32 justify-between">
                      <button
                        type="button"
                        onClick={handleQuantityMinus}
                        disabled={quantity <= 1 || isOutOfStock}
                        className="w-8 h-8 rounded-lg bg-white text-charcoal font-bold flex items-center justify-center hover:bg-mint transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-semibold text-sm">{quantity}</span>
                      <button
                        type="button"
                        onClick={handleQuantityPlus}
                        disabled={quantity >= stock || isOutOfStock}
                        className="w-8 h-8 rounded-lg bg-white text-charcoal font-bold flex items-center justify-center hover:bg-mint transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-subtitle">Tồn kho thực tế:</div>
                    <div className={`text-sm font-bold mt-0.5 ${isOutOfStock ? 'text-red-600' : 'text-olive-700'}`}>
                      {isOutOfStock ? 'Hết hàng' : `Còn ${stock} ${currentProduct.unit || 'sản phẩm'}`}
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <div className="mt-3 p-2.5 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
                    <AlertCircle size={14} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-8">
                  <button
                    type="button"
                    disabled={isOutOfStock || addingToCart}
                    onClick={handleAddToCart}
                    className={`w-full py-3.5 px-6 rounded-2xl text-sm font-semibold tracking-wider uppercase transition-all shadow-md cursor-pointer ${
                      isOutOfStock
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-olive-600 hover:bg-olive-700 text-white active:scale-[0.99]'
                    }`}
                  >
                    {addingToCart ? 'Đang thêm vào giỏ...' : isOutOfStock ? 'Sản phẩm tạm hết hàng' : 'Add to cart'}
                  </button>
                </div>
              </div>

              {/* Guarantees Icons Bar */}
              <div className="mt-8 pt-4 border-t border-mint-border grid grid-cols-3 gap-2 text-center text-[11px] text-subtitle">
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck size={16} className="text-olive-600" />
                  <span>100% Chính Hãng</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Truck size={16} className="text-olive-600" />
                  <span>Giao Hàng COD</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <RefreshCw size={16} className="text-olive-600" />
                  <span>Đổi trả 14 ngày</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
