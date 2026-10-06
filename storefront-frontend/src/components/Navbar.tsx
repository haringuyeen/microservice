import React, { useState } from 'react';
import { ShoppingBag, User as UserIcon, Search, LogOut, PackageCheck, Sparkles, ChevronDown } from 'lucide-react';
import { useCustomerAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
interface NavbarProps {
  onOpenAuth: () => void;
  onOpenOrders: () => void;
  searchKeyword: string;
  onSearchChange: (keyword: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenOrders,
  searchKeyword,
  onSearchChange
}) => {
  const { user, isAuthenticated, logout } = useCustomerAuth();
  const { totalItems, setCartOpen } = useCart();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-pearl/95 backdrop-blur-md border-b border-mint-border transition-all">
      {/* Top Banner Notice */}
      <div className="bg-olive-600 text-pearl text-xs tracking-wider uppercase text-center py-2 px-4 flex items-center justify-center gap-2 font-medium">
        <Sparkles size={13} className="text-olive-300 animate-pulse" />
        <span>Miễn phí vận chuyển toàn quốc cho tất cả đơn hàng COD</span>
        <Sparkles size={13} className="text-olive-300 animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Brand Logo */}
          <div className="flex-shrink-0 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="font-serif text-2xl sm:text-3xl font-bold tracking-wider text-olive-700">
              Nhóm 9
            </div>
            <div className="text-[10px] tracking-[0.25em] uppercase text-subtitle -mt-1 font-sans">
              Microservice
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-4 sm:space-x-5 flex-shrink-0">
            {/* Search Input */}
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Tìm sản phẩm..."
                value={searchKeyword}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-44 lg:w-56 pl-9 pr-4 py-1.5 text-xs rounded-full bg-white border border-mint-border focus:outline-none focus:border-olive-500 focus:ring-1 focus:ring-olive-500 transition-all placeholder:text-subtitle"
              />
              <Search size={14} className="absolute left-3 top-2.5 text-subtitle" />
            </div>

            {/* Account / User Menu */}
            <div className="relative">
              {isAuthenticated ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-full bg-mint text-olive-800 hover:bg-olive-100 transition-colors cursor-pointer"
                  >
                    <UserIcon size={14} />
                    <span className="max-w-[100px] truncate">{user?.fullName || user?.email}</span>
                    <ChevronDown size={12} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-mint-border py-2 text-xs z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 border-b border-mint-border text-subtitle">
                        Xin chào, <strong className="text-charcoal block truncate">{user?.fullName}</strong>
                        <span className="text-[11px] text-olive-600 truncate block">{user?.email}</span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onOpenOrders();
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-mint-card flex items-center gap-2 text-charcoal font-medium transition-colors cursor-pointer"
                      >
                        <PackageCheck size={14} className="text-olive-600" />
                        Lịch sử đơn hàng
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 flex items-center gap-2 transition-colors border-t border-mint-border cursor-pointer"
                      >
                        <LogOut size={14} />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 text-xs font-semibold py-2 px-4 rounded-full border border-olive-600 text-olive-700 hover:bg-olive-600 hover:text-white transition-all duration-200 cursor-pointer"
                >
                  <UserIcon size={14} />
                  <span>Đăng nhập</span>
                </button>
              )}
            </div>

            {/* Cart Button */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 rounded-full bg-white border border-mint-border hover:bg-mint-card text-olive-700 transition-colors cursor-pointer"
              title="Giỏ hàng"
            >
              <ShoppingBag size={18} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-olive-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-pearl shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
