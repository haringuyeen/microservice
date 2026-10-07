import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Package,
    DollarSign,
    ArrowDownToLine,
    ArrowUpFromLine,
    AlertTriangle,
    Plus,
    ArrowRight,
    TrendingUp,
    Coins
} from 'lucide-react';
import { getDashboardStats } from '../api/warehouseApi';
import { useAuth } from '../context/AuthContext';
import type { DashboardStats } from '../types/warehouse';

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [chartMode, setChartMode] = useState<'REVENUE' | 'IO'>('REVENUE');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await getDashboardStats();
                setStats(res.data);
            } catch (err) {
                console.error('Failed to load dashboard stats', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    if (loading) {
        return (
            <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--text-muted)' }}>
                Đang tải dữ liệu tổng quan kho...
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="page-wrapper" style={{ color: 'var(--danger)' }}>
                Không thể tải thông tin tổng quan. Vui lòng thử lại sau.
            </div>
        );
    }

    const isStaff = user?.role === 'STAFF';

    // SVG Bar Chart Calculations
    const maxIoVal = Math.max(
        ...stats.monthlyChart.map((c) => Math.max(c.importValue, c.exportValue)),
        1
    );
    const maxRevVal = Math.max(
        ...stats.monthlyChart.map((c) => Math.max(c.revenue ?? c.exportValue, c.profit ?? 0)),
        1
    );
    const maxChartVal = chartMode === 'REVENUE' ? maxRevVal : maxIoVal;

    return (
        <div className="page-wrapper">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0 }}>Tổng quan Kho hàng</h1>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                        Xin chào {user?.fullName || user?.username}, hệ thống đang hoạt động ổn định.
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {!isStaff && (
                        <Link to="/reports?tab=revenue" className="btn btn-outline btn-sm">
                            <TrendingUp size={15} />
                            <span>Báo cáo doanh thu</span>
                        </Link>
                    )}
                    <Link to="/import-receipts" className="btn btn-primary btn-sm">
                        <ArrowDownToLine size={15} />
                        <span>Lập phiếu nhập</span>
                    </Link>
                    <Link to="/export-receipts" className="btn btn-success btn-sm">
                        <ArrowUpFromLine size={15} />
                        <span>Lập phiếu xuất</span>
                    </Link>
                </div>
            </div>

            {/* Stat Cards - 3x2 Balanced Grid */}
            {!isStaff ? (
                <div className="stat-grid-3x2">
                    {/* Card 1: Doanh thu tháng này */}
                    <div className="stat-card" style={{
                        borderColor: 'rgba(16, 185, 129, 0.35)',
                        background: 'linear-gradient(180deg, #ffffff 0%, #f7fdfa 100%)'
                    }}>
                        <div className="stat-header">
                            <span className="stat-title" style={{ color: '#065f46' }}>Doanh thu tháng này</span>
                            <div className="stat-icon-chip chip-green">
                                <TrendingUp size={18} />
                            </div>
                        </div>
                        <div className="stat-value" style={{ color: '#059669', fontSize: 24 }}>
                            {formatCurrency(stats.totalExportValueThisMonth)}
                        </div>
                        <div className="stat-desc" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Doanh số hôm nay:</span>
                            <strong style={{ color: 'var(--text-h)' }}>{formatCurrency(stats.totalRevenueToday ?? 0)}</strong>
                        </div>
                    </div>

                    {/* Card 2: Lợi nhuận gộp ước tính */}
                    <div className="stat-card" style={{
                        borderColor: 'rgba(99, 102, 241, 0.35)',
                        background: 'linear-gradient(180deg, #ffffff 0%, #f9faff 100%)'
                    }}>
                        <div className="stat-header">
                            <span className="stat-title" style={{ color: '#4338ca' }}>Lợi nhuận gộp ước tính</span>
                            <div className="stat-icon-chip chip-purple">
                                <Coins size={18} />
                            </div>
                        </div>
                        <div className="stat-value" style={{ color: '#4f46e5', fontSize: 24 }}>
                            +{formatCurrency(stats.totalProfitThisMonth ?? 0)}
                        </div>
                        <div className="stat-desc" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Tỷ suất lợi nhuận:</span>
                            <span className="badge badge-success" style={{ fontWeight: 600 }}>
                                {stats.profitMarginThisMonth ?? 0}%
                            </span>
                        </div>
                    </div>

                    {/* Card 3: Tổng giá trị tồn kho */}
                    <div className="stat-card" style={{
                        borderColor: 'rgba(37, 99, 235, 0.25)',
                        background: 'linear-gradient(180deg, #ffffff 0%, #f8faff 100%)'
                    }}>
                        <div className="stat-header">
                            <span className="stat-title" style={{ color: '#1e40af' }}>Tổng giá trị tồn kho</span>
                            <div className="stat-icon-chip">
                                <DollarSign size={18} />
                            </div>
                        </div>
                        <div className="stat-value" style={{ color: 'var(--accent)', fontSize: 24 }}>
                            {formatCurrency(stats.totalStockValue)}
                        </div>
                        <div className="stat-desc" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Quy mô quản lý:</span>
                            <strong style={{ color: 'var(--text-h)' }}>{stats.totalProducts} sản phẩm</strong>
                        </div>
                    </div>

                    {/* Card 4: Xuất kho tháng này */}
                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-title">Xuất kho tháng này</span>
                            <div className="stat-icon-chip chip-green">
                                <ArrowUpFromLine size={18} />
                            </div>
                        </div>
                        <div className="stat-value" style={{ fontSize: 24 }}>
                            {stats.totalExportsThisMonth} <span style={{ fontSize: 13, fontWeight: 'normal', color: 'var(--text-muted)' }}>phiếu xuất</span>
                        </div>
                        <div className="stat-desc" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Trạng thái bàn giao:</span>
                            <span className="badge badge-info">Đã hoàn thành</span>
                        </div>
                    </div>

                    {/* Card 5: Nhập kho tháng này */}
                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-title">Nhập kho tháng này</span>
                            <div className="stat-icon-chip">
                                <ArrowDownToLine size={18} />
                            </div>
                        </div>
                        <div className="stat-value" style={{ fontSize: 24 }}>
                            {stats.totalImportsThisMonth} <span style={{ fontSize: 13, fontWeight: 'normal', color: 'var(--text-muted)' }}>phiếu nhập</span>
                        </div>
                        <div className="stat-desc" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Tổng trị giá nhập:</span>
                            <strong style={{ color: 'var(--text-h)' }}>{formatCurrency(stats.totalImportValueThisMonth)}</strong>
                        </div>
                    </div>

                    {/* Card 6: Cảnh báo sắp hết hàng */}
                    <div
                        className="stat-card"
                        style={stats.lowStockCount > 0 ? {
                            borderColor: 'var(--danger-border)',
                            background: 'linear-gradient(180deg, #ffffff 0%, #fffafa 100%)'
                        } : {}}
                    >
                        <div className="stat-header">
                            <span className="stat-title" style={stats.lowStockCount > 0 ? { color: 'var(--danger)' } : {}}>
                                Cảnh báo sắp hết hàng
                            </span>
                            <div className={`stat-icon-chip ${stats.lowStockCount > 0 ? 'chip-red' : ''}`}>
                                <AlertTriangle size={18} />
                            </div>
                        </div>
                        <div className="stat-value" style={{ color: stats.lowStockCount > 0 ? 'var(--danger)' : 'inherit', fontSize: 24 }}>
                            {stats.lowStockCount} <span style={{ fontSize: 13, fontWeight: 'normal', color: 'var(--text-muted)' }}>mặt hàng</span>
                        </div>
                        <div className="stat-desc" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Mức tồn kho:</span>
                            {stats.lowStockCount > 0 ? (
                                <span className="badge badge-danger">Cần bổ sung ngay</span>
                            ) : (
                                <span className="badge badge-success">Mức an toàn</span>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="stat-grid">
                    <div className="stat-card">
                        <div className="stat-header">
                            <div className="stat-title">Tổng số sản phẩm</div>
                            <div className="stat-icon-chip">
                                <Package size={18} />
                            </div>
                        </div>
                        <div className="stat-value">{stats.totalProducts}</div>
                        <div className="stat-desc">Sản phẩm đang quản lý trong kho</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <div className="stat-title">Nhập kho tháng này</div>
                            <div className="stat-icon-chip">
                                <ArrowDownToLine size={18} />
                            </div>
                        </div>
                        <div className="stat-value">
                            {stats.totalImportsThisMonth} <span style={{ fontSize: 13, fontWeight: 'normal', color: 'var(--text-muted)' }}>phiếu</span>
                        </div>
                        <div className="stat-desc">Đơn nhập kho hoàn tất</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <div className="stat-title">Xuất kho tháng này</div>
                            <div className="stat-icon-chip chip-green">
                                <ArrowUpFromLine size={18} />
                            </div>
                        </div>
                        <div className="stat-value">
                            {stats.totalExportsThisMonth} <span style={{ fontSize: 13, fontWeight: 'normal', color: 'var(--text-muted)' }}>phiếu</span>
                        </div>
                        <div className="stat-desc">Đơn xuất hàng hoàn tất</div>
                    </div>

                    <div className="stat-card" style={stats.lowStockCount > 0 ? { borderColor: 'var(--danger-border)', backgroundColor: '#fffdfd' } : {}}>
                        <div className="stat-header">
                            <div className="stat-title">Cảnh báo sắp hết hàng</div>
                            <div className={`stat-icon-chip ${stats.lowStockCount > 0 ? 'chip-red' : ''}`}>
                                <AlertTriangle size={18} />
                            </div>
                        </div>
                        <div className="stat-value" style={{ color: stats.lowStockCount > 0 ? 'var(--danger)' : 'inherit' }}>
                            {stats.lowStockCount} <span style={{ fontSize: 13, fontWeight: 'normal', color: 'var(--text-muted)' }}>sản phẩm</span>
                        </div>
                        <div className="stat-desc">Dưới ngưỡng tồn tối thiểu</div>
                    </div>
                </div>
            )}

            {/* Charts & Top Selling (Only for ADMIN & MANAGER) */}
            {!isStaff && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
                    {/* Monthly Chart with Mode Switch */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                            <h3 style={{ margin: 0 }}>
                                {chartMode === 'REVENUE' ? 'Biểu đồ Doanh thu & Lợi nhuận 6 tháng gần nhất' : 'Biểu đồ Xuất / Nhập 6 tháng gần nhất'}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                {/* Mode Switcher */}
                                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 6, padding: 2 }}>
                                    <button
                                        type="button"
                                        onClick={() => setChartMode('REVENUE')}
                                        style={{
                                            padding: '4px 10px',
                                            fontSize: 12,
                                            fontWeight: chartMode === 'REVENUE' ? 600 : 500,
                                            borderRadius: 4,
                                            border: 'none',
                                            background: chartMode === 'REVENUE' ? '#ffffff' : 'transparent',
                                            color: chartMode === 'REVENUE' ? 'var(--accent)' : 'var(--text-muted)',
                                            boxShadow: chartMode === 'REVENUE' ? 'var(--shadow-xs)' : 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Doanh thu & Lợi nhuận
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setChartMode('IO')}
                                        style={{
                                            padding: '4px 10px',
                                            fontSize: 12,
                                            fontWeight: chartMode === 'IO' ? 600 : 500,
                                            borderRadius: 4,
                                            border: 'none',
                                            background: chartMode === 'IO' ? '#ffffff' : 'transparent',
                                            color: chartMode === 'IO' ? 'var(--accent)' : 'var(--text-muted)',
                                            boxShadow: chartMode === 'IO' ? 'var(--shadow-xs)' : 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Nhập kho vs Xuất kho
                                    </button>
                                </div>

                                {/* Legend */}
                                <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                                    {chartMode === 'REVENUE' ? (
                                        <>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <span style={{ width: 10, height: 10, backgroundColor: '#10b981', display: 'inline-block', borderRadius: 2 }}></span>
                                                Doanh thu
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <span style={{ width: 10, height: 10, backgroundColor: '#6366f1', display: 'inline-block', borderRadius: 2 }}></span>
                                                Lợi nhuận
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <span style={{ width: 10, height: 10, backgroundColor: '#2563eb', display: 'inline-block', borderRadius: 2 }}></span>
                                                Nhập kho
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <span style={{ width: 10, height: 10, backgroundColor: '#10b981', display: 'inline-block', borderRadius: 2 }}></span>
                                                Xuất kho
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Visual Bar Chart in SVG */}
                        <div style={{ height: 220, display: 'flex', alignItems: 'flex-end', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                            {stats.monthlyChart.map((m, idx) => {
                                const val1 = chartMode === 'REVENUE' ? (m.revenue ?? m.exportValue) : m.importValue;
                                const val2 = chartMode === 'REVENUE' ? (m.profit ?? 0) : m.exportValue;
                                const color1 = chartMode === 'REVENUE' ? '#10b981' : '#2563eb';
                                const color2 = chartMode === 'REVENUE' ? '#6366f1' : '#10b981';
                                const title1 = chartMode === 'REVENUE' ? `Doanh thu: ${formatCurrency(val1)}` : `Nhập: ${formatCurrency(val1)}`;
                                const title2 = chartMode === 'REVENUE' ? `Lợi nhuận: ${formatCurrency(val2)}` : `Xuất: ${formatCurrency(val2)}`;

                                const h1 = Math.max(8, (val1 / maxChartVal) * 180);
                                const h2 = Math.max(8, (Math.max(0, val2) / maxChartVal) * 180);

                                return (
                                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
                                            <div
                                                title={title1}
                                                style={{
                                                    width: 16,
                                                    height: `${h1}px`,
                                                    backgroundColor: color1,
                                                    borderRadius: '4px 4px 0 0',
                                                    transition: 'height 0.3s, background-color 0.3s'
                                                }}
                                            />
                                            <div
                                                title={title2}
                                                style={{
                                                    width: 16,
                                                    height: `${h2}px`,
                                                    backgroundColor: color2,
                                                    borderRadius: '4px 4px 0 0',
                                                    transition: 'height 0.3s, background-color 0.3s'
                                                }}
                                            />
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{m.month}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Top Selling Products */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ margin: 0 }}>Top Sản Phẩm Bán Chạy</h3>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>6 tháng qua</span>
                        </div>

                        {stats.topSellingProducts.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0', flex: 1 }}>Chưa có dữ liệu xuất hàng</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                                {stats.topSellingProducts.map((p, idx) => (
                                    <div key={p.productId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--surface-secondary)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                                            <span style={{
                                                width: 22,
                                                height: 22,
                                                borderRadius: '50%',
                                                backgroundColor: idx === 0 ? '#fef3c7' : '#f1f5f9',
                                                color: idx === 0 ? '#b45309' : '#64748b',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 700,
                                                fontSize: 11,
                                                flexShrink: 0
                                            }}>
                                                {idx + 1}
                                            </span>
                                            <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {p.productName}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                                            <span className="badge badge-success">
                                                {p.soldQuantity} đã bán
                                            </span>
                                            {p.revenue != null && p.revenue > 0 && !isStaff && (
                                                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                                                    {formatCurrency(p.revenue)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!isStaff && (
                            <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border)', textAlign: 'right' }}>
                                <Link to="/reports?tab=revenue" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <span>Xem báo cáo doanh thu chi tiết</span>
                                    <ArrowRight size={13} />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Low Stock Alert Section */}
            {stats.lowStockProducts && stats.lowStockProducts.length > 0 && (
                <div className="card" style={{ marginBottom: 24, borderColor: 'var(--danger-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h3 style={{ margin: 0, color: 'var(--danger)' }}>
                            Cảnh Báo Sản Phẩm Sắp Hết Hàng (Tồn kho ≤ Ngưỡng tối thiểu)
                        </h3>
                        <Link to="/import-receipts" className="btn btn-primary btn-sm">
                            <Plus size={14} />
                            <span>Nhập hàng ngay</span>
                        </Link>
                    </div>
                    <div className="table-container" style={{ margin: 0 }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Mã SP</th>
                                    <th>Tên sản phẩm</th>
                                    <th>Danh mục</th>
                                    <th>ĐVT</th>
                                    <th>Tồn hiện tại</th>
                                    <th>Ngưỡng tối thiểu</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.lowStockProducts.map((p) => (
                                    <tr key={p.id}>
                                        <td style={{ fontWeight: 600 }}>{p.code}</td>
                                        <td>{p.name}</td>
                                        <td><span className="badge badge-info">{p.categoryName}</span></td>
                                        <td>{p.unit}</td>
                                        <td style={{ fontWeight: 700, color: p.stockQuantity === 0 ? 'var(--danger)' : 'var(--warning)' }}>
                                            {p.stockQuantity}
                                        </td>
                                        <td>{p.minStockLevel}</td>
                                        <td>
                                            {p.stockQuantity === 0 ? (
                                                <span className="badge badge-danger">Hết hàng</span>
                                            ) : (
                                                <span className="badge badge-warning">Sắp hết</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Recent Receipts (Imports and Exports) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
                {/* Recent Imports */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h3 style={{ margin: 0 }}>Đơn Nhập Kho Mới Nhất</h3>
                        <Link to="/import-receipts" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span>Xem tất cả</span>
                            <ArrowRight size={13} />
                        </Link>
                    </div>
                    <div className="table-container" style={{ margin: 0 }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Mã phiếu</th>
                                    <th>Nhà cung cấp</th>
                                    <th>Tổng tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentImports.length === 0 ? (
                                    <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có phiếu nhập</td></tr>
                                ) : (
                                    stats.recentImports.map((r) => (
                                        <tr key={r.id}>
                                            <td style={{ fontWeight: 600 }}>{r.code}</td>
                                            <td>{r.supplierName}</td>
                                            <td style={{ fontWeight: 600 }}>{formatCurrency(r.totalAmount)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Exports */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h3 style={{ margin: 0 }}>Đơn Xuất Kho Mới Nhất</h3>
                        <Link to="/export-receipts" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span>Xem tất cả</span>
                            <ArrowRight size={13} />
                        </Link>
                    </div>
                    <div className="table-container" style={{ margin: 0 }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Mã phiếu</th>
                                    <th>Khách hàng</th>
                                    <th>Tổng tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentExports.length === 0 ? (
                                    <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có phiếu xuất</td></tr>
                                ) : (
                                    stats.recentExports.map((r) => (
                                        <tr key={r.id}>
                                            <td style={{ fontWeight: 600 }}>{r.code}</td>
                                            <td>{r.customerName}</td>
                                            <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(r.totalAmount)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}