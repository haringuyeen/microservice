import React, { useState } from 'react';
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Category } from '../types';

interface ChipTabsProps {
  categories: Category[];
  selectedCategoryName: string;
  onSelectCategory: (category: Category | null) => void;
  minPrice?: number;
  maxPrice?: number;
  onPriceChange: (min?: number, max?: number) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export const ChipTabs: React.FC<ChipTabsProps> = ({
  categories,
  selectedCategoryName,
  onSelectCategory,
  minPrice,
  maxPrice,
  onPriceChange,
  sortBy,
  onSortChange
}) => {
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [localMin, setLocalMin] = useState<string>(minPrice ? minPrice.toString() : '');
  const [localMax, setLocalMax] = useState<string>(maxPrice ? maxPrice.toString() : '');

  const applyPriceFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const min = localMin ? parseFloat(localMin) : undefined;
    const max = localMax ? parseFloat(localMax) : undefined;
    onPriceChange(min, max);
  };

  const clearPriceFilter = () => {
    setLocalMin('');
    setLocalMax('');
    onPriceChange(undefined, undefined);
  };

  return (
    <div className="mb-10 space-y-4">
      {/* Upper Control Bar: Dynamic Category Chips + Filter / Sort */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Dynamic Category Chips from Management */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => onSelectCategory(null)}
            className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide whitespace-nowrap transition-all duration-200 cursor-pointer ${
              selectedCategoryName === 'Tất cả'
                ? 'bg-olive-600 text-pearl shadow-sm'
                : 'bg-white text-subtitle border border-mint-border hover:border-olive-400 hover:text-charcoal'
            }`}
          >
            Tất cả
          </button>
          
          {categories.map((cat) => {
            const isSelected = selectedCategoryName.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-olive-600 text-pearl shadow-sm'
                    : 'bg-white text-subtitle border border-mint-border hover:border-olive-400 hover:text-charcoal'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Right Tools: Filter Toggle & Sort Dropdown */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-end flex-shrink-0">
          {/* Filter Button */}
          <button
            type="button"
            onClick={() => setShowPriceFilter(!showPriceFilter)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              showPriceFilter || minPrice !== undefined || maxPrice !== undefined
                ? 'bg-olive-100 border-olive-500 text-olive-800'
                : 'bg-white border-mint-border text-charcoal hover:border-olive-400'
            }`}
          >
            <SlidersHorizontal size={13} />
            <span>Khoảng giá</span>
            {(minPrice !== undefined || maxPrice !== undefined) && (
              <span className="w-2 h-2 rounded-full bg-olive-600"></span>
            )}
          </button>

          {/* Sort By Dropdown */}
          <div className="relative flex items-center">
            <ArrowUpDown size={13} className="absolute left-3.5 text-subtitle pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="pl-8 pr-8 py-2 rounded-full text-xs font-medium bg-white border border-mint-border text-charcoal appearance-none focus:outline-none focus:border-olive-500 cursor-pointer"
            >
              <option value="default">Sắp xếp: Mặc định</option>
              <option value="best_selling">Bán chạy nhất</option>
              <option value="price_asc">Giá: Thấp đến Cao</option>
              <option value="price_desc">Giá: Cao đến Thấp</option>
            </select>
          </div>
        </div>

      </div>

      {/* Expandable Price Range Filter */}
      {showPriceFilter && (
        <form
          onSubmit={applyPriceFilter}
          className="bg-white p-4 rounded-2xl border border-mint-border shadow-sm flex flex-wrap items-center gap-3 text-xs animate-in fade-in duration-150"
        >
          <span className="font-semibold text-charcoal">Khoảng giá (VNĐ):</span>
          
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Từ (VNĐ)"
              value={localMin}
              onChange={(e) => setLocalMin(e.target.value)}
              className="w-28 px-3 py-1.5 rounded-lg border border-mint-border focus:outline-none focus:border-olive-500"
            />
            <span className="text-subtitle">-</span>
            <input
              type="number"
              placeholder="Đến (VNĐ)"
              value={localMax}
              onChange={(e) => setLocalMax(e.target.value)}
              className="w-28 px-3 py-1.5 rounded-lg border border-mint-border focus:outline-none focus:border-olive-500"
            />
          </div>

          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-lg bg-olive-600 text-white font-medium hover:bg-olive-700 transition-colors"
          >
            Áp dụng
          </button>

          {(localMin || localMax || minPrice || maxPrice) && (
            <button
              type="button"
              onClick={clearPriceFilter}
              className="px-3 py-1.5 rounded-lg text-subtitle hover:text-charcoal hover:bg-pearl transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}
        </form>
      )}
    </div>
  );
};
