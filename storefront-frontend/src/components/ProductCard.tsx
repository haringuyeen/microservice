import React from 'react';
import { ShoppingBag, Eye } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addItem, loading } = useCart();

  const isOutOfStock = product.stockQuantity <= 0;
  const categoryBadge = product.needTag || product.categoryName;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    try {
      await addItem(product.id, 1);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể thêm vào giỏ hàng');
    }
  };

  const formatPrice = (val?: number) => {
    if (!val) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative bg-white border border-mint-border rounded-2xl p-5 hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between mb-3 text-[11px] font-semibold gap-1">
          {categoryBadge && (
            <span className="px-2.5 py-0.5 rounded-full bg-mint text-olive-800 tracking-wider truncate max-w-[150px]">
              {categoryBadge}
            </span>
          )}
          {product.isBestSeller && (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 tracking-wider flex-shrink-0">
              BEST SELLER
            </span>
          )}
        </div>

        {/* Circular Mint Backdrop Image Container */}
        <div className="relative aspect-square w-full rounded-2xl bg-mint-card flex items-center justify-center p-6 overflow-hidden mb-4 group-hover:scale-[1.02] transition-transform duration-300">
          <div className="absolute inset-4 rounded-full bg-mint/80 border border-mint-border/50"></div>
          <img
            src={product.imageUrl || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500'}
            alt={product.name}
            className="relative z-10 max-h-full max-w-full object-contain drop-shadow-md"
            loading="lazy"
          />

          {/* Quick View Overlay on hover */}
          <div className="absolute inset-0 bg-charcoal/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
            <span className="bg-white/95 text-charcoal px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-md flex items-center gap-1.5">
              <Eye size={13} /> Xem chi tiết
            </span>
          </div>
        </div>

        {/* Product Title */}
        <h3 className="font-sans text-xs sm:text-sm font-semibold tracking-wider uppercase text-charcoal line-clamp-1 group-hover:text-olive-700 transition-colors">
          {product.name}
        </h3>

        {/* Unit & Stock Info (No fake ml) */}
        <div className="flex items-center gap-2 mt-1.5 text-xs text-subtitle">
          {product.unit && (
            <>
              <span>ĐVT: {product.unit}</span>
              <span>•</span>
            </>
          )}
          <span className={product.stockQuantity < 10 ? 'text-amber-600 font-medium' : 'text-olive-600'}>
            {isOutOfStock ? 'Hết hàng' : `Còn ${product.stockQuantity}`}
          </span>
        </div>
      </div>

      {/* Price & Action */}
      <div className="mt-4 pt-3 border-t border-mint-border flex items-center justify-between">
        <div>
          {product.originalPrice && product.originalPrice > product.exportPrice && (
            <span className="text-[11px] text-subtitle line-through block">
              {formatPrice(product.originalPrice)}
            </span>
          )}
          <span className="text-sm sm:text-base font-bold text-olive-800">
            {formatPrice(product.exportPrice)}
          </span>
        </div>

        <button
          type="button"
          disabled={isOutOfStock || loading}
          onClick={handleQuickAdd}
          className={`p-2.5 rounded-full flex items-center justify-center transition-all ${
            isOutOfStock
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-olive-600 hover:bg-olive-700 text-white shadow-sm hover:scale-105 active:scale-95 cursor-pointer'
          }`}
          title={isOutOfStock ? 'Hết hàng' : 'Thêm nhanh vào giỏ'}
        >
          <ShoppingBag size={15} />
        </button>
      </div>
    </div>
  );
};
