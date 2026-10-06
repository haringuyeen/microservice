import { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ChipTabs } from './components/ChipTabs';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/AuthModal';
import { OrdersModal } from './components/OrdersModal';
import { Footer } from './components/Footer';
import { fetchProducts, fetchCategories } from './api/storefrontApi';
import { Product, Category } from './types';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { useCustomerAuth } from './context/AuthContext';

export function App() {
  const { isAuthenticated } = useCustomerAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('Tất cả');
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState('default');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);

  // Load categories dynamically from product management
  useEffect(() => {
    fetchCategories()
      .then((res) => {
        setCategories(res.data || []);
      })
      .catch((err) => {
        console.error('Error fetching storefront categories:', err);
      });
  }, []);

  // Load products based on category filter, price, and sort
  useEffect(() => {
    setLoading(true);
    fetchProducts({
      categoryId: selectedCategoryId,
      needTag: selectedCategoryName === 'Tất cả' ? undefined : selectedCategoryName,
      minPrice,
      maxPrice,
      sortBy
    })
      .then((res) => {
        setProducts(res.data || []);
      })
      .catch((err) => {
        console.error('Error fetching storefront products', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedCategoryId, selectedCategoryName, minPrice, maxPrice, sortBy]);

  // Filter products by keyword in-memory
  const filteredProducts = useMemo(() => {
    if (!searchKeyword.trim()) return products;
    const kw = searchKeyword.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(kw) ||
        p.code.toLowerCase().includes(kw) ||
        (p.needTag && p.needTag.toLowerCase().includes(kw))
    );
  }, [products, searchKeyword]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const handlePriceChange = (min?: number, max?: number) => {
    setMinPrice(min);
    setMaxPrice(max);
    setCurrentPage(1);
  };

  const handleSelectCategory = (category: Category | null) => {
    if (!category) {
      setSelectedCategoryId(undefined);
      setSelectedCategoryName('Tất cả');
    } else {
      setSelectedCategoryId(category.id);
      setSelectedCategoryName(category.name);
    }
    setCurrentPage(1);
    const shopEl = document.getElementById('shop');
    if (shopEl) {
      shopEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-pearl font-sans text-charcoal">
      {/* Navbar */}
      <Navbar
        onOpenAuth={() => setAuthOpen(true)}
        onOpenOrders={() => {
          if (!isAuthenticated) {
            setAuthOpen(true);
          } else {
            setOrdersOpen(true);
          }
        }}
        searchKeyword={searchKeyword}
        onSearchChange={(kw) => {
          setSearchKeyword(kw);
          setCurrentPage(1);
        }}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Editorial Hero */}
        <Hero />

        {/* Shop Section */}
        <section id="shop" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {/* Chip Tabs & Filter Bar */}
          <ChipTabs
            categories={categories}
            selectedCategoryName={selectedCategoryName}
            onSelectCategory={handleSelectCategory}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onPriceChange={handlePriceChange}
            sortBy={sortBy}
            onSortChange={(val) => {
              setSortBy(val);
              setCurrentPage(1);
            }}
          />

          {/* Product Grid */}
          {loading ? (
            <div className="py-24 text-center">
              <div className="inline-block w-8 h-8 border-2 border-olive-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-3 text-xs text-subtitle tracking-wider uppercase">Đang nạp các sản phẩm VELVETY...</p>
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-mint-border p-8">
              <AlertCircle size={32} className="mx-auto text-subtitle/60 mb-3" />
              <h3 className="font-serif text-lg font-bold text-charcoal">Không tìm thấy sản phẩm phù hợp</h3>
              <p className="text-xs text-subtitle mt-1 max-w-sm mx-auto font-light">
                Hãy thử chọn danh mục khác hoặc điều chỉnh khoảng giá tìm kiếm của bạn.
              </p>
              <button
                type="button"
                onClick={() => {
                  handleSelectCategory(null);
                  setMinPrice(undefined);
                  setMaxPrice(undefined);
                  setSearchKeyword('');
                }}
                className="mt-5 px-5 py-2 rounded-full bg-olive-600 text-white text-xs font-semibold hover:bg-olive-700 transition-colors cursor-pointer"
              >
                Đặt lại toàn bộ bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {paginatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onSelect={(selected) => setSelectedProduct(selected)}
                />
              ))}
            </div>
          )}

          {/* Numbered Pagination: ← 1 2 ... → */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-9 h-9 rounded-full border border-mint-border bg-white text-charcoal flex items-center justify-center hover:bg-mint disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
                const isActive = num === currentPage;
                return (
                  <button
                    key={num}
                    onClick={() => setCurrentPage(num)}
                    className={`w-9 h-9 rounded-full text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-olive-600 text-white shadow-sm'
                        : 'bg-white border border-mint-border text-charcoal hover:border-olive-400'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-9 h-9 rounded-full border border-mint-border bg-white text-charcoal flex items-center justify-center hover:bg-mint disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Cart Drawer */}
      <CartDrawer onCheckout={() => setCheckoutOpen(true)} />

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onOrderSuccess={() => {
          // Open order history to view the newly placed order
          setCheckoutOpen(false);
          setOrdersOpen(true);
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
      />

      {/* Orders History Modal */}
      <OrdersModal
        isOpen={ordersOpen}
        onClose={() => setOrdersOpen(false)}
      />
    </div>
  );
}

export default App;
