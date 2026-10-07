import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalElements?: number;
    pageSize?: number;
    pageSizeOptions?: number[];
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
}

function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis-start' | 'ellipsis-end')[] {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i);
    }

    if (currentPage <= 3) {
        return [0, 1, 2, 3, 4, 'ellipsis-end', totalPages - 1];
    }

    if (currentPage >= totalPages - 4) {
        return [0, 'ellipsis-start', totalPages - 5, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1];
    }

    return [0, 'ellipsis-start', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-end', totalPages - 1];
}

export default function Pagination({
    currentPage,
    totalPages,
    totalElements,
    pageSize = 25,
    pageSizeOptions = [25, 50, 100, 200],
    onPageChange,
    onPageSizeChange,
}: PaginationProps) {
    if (totalPages <= 0 && (totalElements === undefined || totalElements === 0) && !onPageSizeChange) {
        return null;
    }

    const actualPageSize = pageSize || 25;
    const effectiveTotal = totalElements !== undefined ? totalElements : totalPages * actualPageSize;
    const startItem = effectiveTotal === 0 ? 0 : currentPage * actualPageSize + 1;
    const endItem = Math.min((currentPage + 1) * actualPageSize, effectiveTotal);
    const pageNumbers = getPageNumbers(currentPage, totalPages);

    return (
        <div
            className="pagination-container"
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                marginTop: 18,
                padding: '12px 16px',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-xs)',
            }}
        >
            {/* Thông tin số dòng / tổng quan */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                {totalElements !== undefined ? (
                    effectiveTotal > 0 ? (
                        <span>
                            Hiển thị <strong style={{ color: 'var(--text-h)' }}>{startItem}</strong> -{' '}
                            <strong style={{ color: 'var(--text-h)' }}>{endItem}</strong> trong tổng số{' '}
                            <strong style={{ color: 'var(--text-h)' }}>{effectiveTotal.toLocaleString('vi-VN')}</strong> dòng
                        </span>
                    ) : (
                        <span>Không có dữ liệu</span>
                    )
                ) : (
                    <span>
                        Trang <strong style={{ color: 'var(--text-h)' }}>{currentPage + 1}</strong> /{' '}
                        <strong style={{ color: 'var(--text-h)' }}>{Math.max(1, totalPages)}</strong>
                    </span>
                )}
            </div>

            {/* Cụm điều khiển phân trang & chọn số dòng */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                {/* Nút chọn số dòng hiển thị 25 - 50 - 100 - 200 */}
                {onPageSizeChange && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Hiển thị:</span>
                        <div style={{ display: 'inline-flex', gap: 4 }}>
                            {pageSizeOptions.map((opt) => {
                                const isActive = actualPageSize === opt;
                                return (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => onPageSizeChange(opt)}
                                        className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                                        style={{
                                            minWidth: 38,
                                            padding: '4px 8px',
                                            fontWeight: isActive ? 600 : 500,
                                        }}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>dòng</span>
                    </div>
                )}

                {/* Vạch ngăn cách */}
                {onPageSizeChange && (
                    <div style={{ width: 1, height: 20, backgroundColor: 'var(--border)' }} />
                )}

                {/* Cụm nút chuyển trang */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                        type="button"
                        disabled={currentPage === 0 || totalPages <= 1}
                        onClick={() => onPageChange(currentPage - 1)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px 10px' }}
                        title="Trang trước"
                    >
                        <ChevronLeft size={15} />
                        <span>Trước</span>
                    </button>

                    {totalPages > 0 &&
                        pageNumbers.map((p) => {
                            if (typeof p === 'string') {
                                return (
                                    <span
                                        key={p}
                                        style={{
                                            padding: '0 6px',
                                            color: 'var(--text-muted)',
                                            userSelect: 'none',
                                            fontSize: 13,
                                        }}
                                    >
                                        …
                                    </span>
                                );
                            }
                            const isActive = p === currentPage;
                            return (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => onPageChange(p)}
                                    className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{
                                        minWidth: 32,
                                        padding: '6px 8px',
                                        fontWeight: isActive ? 600 : 500,
                                    }}
                                >
                                    {p + 1}
                                </button>
                            );
                        })}

                    <button
                        type="button"
                        disabled={currentPage >= totalPages - 1 || totalPages <= 1}
                        onClick={() => onPageChange(currentPage + 1)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px 10px' }}
                        title="Trang sau"
                    >
                        <span>Sau</span>
                        <ChevronRight size={15} />
                    </button>
                </div>
            </div>
        </div>
    );
}