import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Download,
    Printer,
    Package,
    BarChart3,
    Layers,
    DollarSign,
    ArrowDownToLine,
    ArrowUpFromLine,
    TrendingUp,
    Users,
    FileText
} from 'lucide-react';
import {
    getInventoryReport,
    getImportExportInventoryReport,
    getRevenueReport
} from '../api/warehouseApi';
import type {
    InventoryReportItem,
    ImportExportInventoryItem,
    RevenueReport
} from '../types/warehouse';

export default function ReportsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab');

    const [activeTab, setActiveTab] = useState<'INVENTORY' | 'IMPORT_EXPORT' | 'REVENUE'>(() => {
        if (tabParam === 'revenue' || tabParam === 'REVENUE') return 'REVENUE';
        if (tabParam === 'io' || tabParam === 'IMPORT_EXPORT') return 'IMPORT_EXPORT';
        return 'INVENTORY';
    });

    const [revenueSubTab, setRevenueSubTab] = useState<'PRODUCT' | 'RECEIPT' | 'CUSTOMER'>('PRODUCT');

    // Date range
    const [fromDate, setFromDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().slice(0, 10);
    });
    const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));

    // Data
    const [inventoryItems, setInventoryItems] = useState<InventoryReportItem[]>([]);
    const [ioItems, setIoItems] = useState<ImportExportInventoryItem[]>([]);
    const [revenueReport, setRevenueReport] = useState<RevenueReport | null>(null);
    const [loading, setLoading] = useState(false);

    const handleTabChange = (tab: 'INVENTORY' | 'IMPORT_EXPORT' | 'REVENUE') => {
        setActiveTab(tab);
        if (tab === 'INVENTORY') {
            setSearchParams({});
        } else if (tab === 'IMPORT_EXPORT') {
            setSearchParams({ tab: 'io' });
        } else {
            setSearchParams({ tab: 'revenue' });
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'INVENTORY') {
                const res = await getInventoryReport();
                setInventoryItems(res.data);
            } else if (activeTab === 'IMPORT_EXPORT') {
                const res = await getImportExportInventoryReport({ from: fromDate, to: toDate });
                setIoItems(res.data);
            } else {
                const res = await getRevenueReport({ from: fromDate, to: toDate });
                setRevenueReport(res.data);
            }
        } catch (e) {
            console.error('Lỗi khi tải dữ liệu báo cáo:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [activeTab, fromDate, toDate]);

    const formatCurrency = (val?: number) => {
        if (val == null) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    const formatDate = (isoString?: string) => {
        if (!isoString) return '-';
        try {
            const d = new Date(isoString);
            return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch {
            return isoString;
        }
    };

    // Quick Date Presets
    const setPreset = (type: 'TODAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR') => {
        const now = new Date();
        const toStr = now.toISOString().slice(0, 10);
        let fromStr = toStr;

        if (type === 'WEEK') {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            fromStr = d.toISOString().slice(0, 10);
        } else if (type === 'MONTH') {
            const d = new Date(now.getFullYear(), now.getMonth(), 1);
            fromStr = d.toISOString().slice(0, 10);
        } else if (type === 'QUARTER') {
            const d = new Date();
            d.setMonth(d.getMonth() - 3);
            fromStr = d.toISOString().slice(0, 10);
        } else if (type === 'YEAR') {
            const d = new Date(now.getFullYear(), 0, 1);
            fromStr = d.toISOString().slice(0, 10);
        }

        setFromDate(fromStr);
        setToDate(toStr);
    };

    // Export to Excel / CSV with UTF-8 BOM for Microsoft Excel
    const handleExportExcel = () => {
        let csvContent = '\uFEFF'; // UTF-8 BOM for Excel Vietnamese compatibility

        if (activeTab === 'INVENTORY') {
            csvContent += 'BÁO CÁO TỒN KHO HIỆN TẠI\n';
            csvContent += `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}\n\n`;
            csvContent += 'STT,Mã SP,Tên sản phẩm,Danh mục,ĐVT,Số lượng tồn,Ngưỡng tối thiểu,Giá nhập (VNĐ),Tổng giá trị tồn (VNĐ),Trạng thái\n';

            inventoryItems.forEach((item, idx) => {
                const row = [
                    idx + 1,
                    `"${item.productCode}"`,
                    `"${item.productName.replace(/"/g, '""')}"`,
                    `"${item.categoryName}"`,
                    `"${item.unit}"`,
                    item.stockQuantity,
                    item.minStockLevel,
                    item.importPrice,
                    item.totalValue,
                    `"${item.status === 'HET_HANG' ? 'Hết hàng' : item.status === 'SAP_HET' ? 'Sắp hết' : 'Còn hàng'}"`
                ];
                csvContent += row.join(',') + '\n';
            });
        } else if (activeTab === 'IMPORT_EXPORT') {
            csvContent += `BÁO CÁO NHẬP - XUẤT - TỒN KHO\n`;
            csvContent += `Thời gian: Từ ${fromDate} đến ${toDate}\n\n`;
            csvContent += 'STT,Mã SP,Tên sản phẩm,ĐVT,Tồn đầu kỳ,Nhập trong kỳ,Xuất trong kỳ,Tồn cuối kỳ,Giá trị tồn cuối (VNĐ)\n';

            ioItems.forEach((item, idx) => {
                const row = [
                    idx + 1,
                    `"${item.productCode}"`,
                    `"${item.productName.replace(/"/g, '""')}"`,
                    `"${item.unit}"`,
                    item.initialStock,
                    item.importedQuantity,
                    item.exportedQuantity,
                    item.endingStock,
                    item.endingValue
                ];
                csvContent += row.join(',') + '\n';
            });
        } else {
            // Revenue report
            if (revenueSubTab === 'PRODUCT') {
                csvContent += `BÁO CÁO DOANH THU THEO SẢN PHẨM\n`;
                csvContent += `Thời gian: Từ ${fromDate} đến ${toDate}\n\n`;
                csvContent += 'STT,Mã SP,Tên sản phẩm,Danh mục,ĐVT,Số lượng bán,Đơn giá xuất TB (VNĐ),Tổng doanh thu (VNĐ),Tổng giá vốn (VNĐ),Lợi nhuận gộp (VNĐ),Tỷ suất LN (%)\n';
                (revenueReport?.byProduct || []).forEach((item, idx) => {
                    const row = [
                        idx + 1,
                        `"${item.productCode}"`,
                        `"${item.productName.replace(/"/g, '""')}"`,
                        `"${item.categoryName}"`,
                        `"${item.unit}"`,
                        item.soldQuantity,
                        item.avgExportPrice,
                        item.revenue,
                        item.cost,
                        item.profit,
                        `${item.profitMargin}%`
                    ];
                    csvContent += row.join(',') + '\n';
                });
            } else if (revenueSubTab === 'RECEIPT') {
                csvContent += `BÁO CÁO DOANH THU THEO ĐƠN XUẤT KHO\n`;
                csvContent += `Thời gian: Từ ${fromDate} đến ${toDate}\n\n`;
                csvContent += 'STT,Mã phiếu,Ngày xuất,Khách hàng,Người lập,Số lượng SP,Tổng doanh thu (VNĐ),Tổng giá vốn (VNĐ),Lợi nhuận (VNĐ),Tỷ suất LN (%),Trạng thái\n';
                (revenueReport?.byReceipt || []).forEach((item, idx) => {
                    const row = [
                        idx + 1,
                        `"${item.code}"`,
                        `"${item.exportDate ? formatDate(item.exportDate) : ''}"`,
                        `"${item.customerName.replace(/"/g, '""')}"`,
                        `"${item.creatorName.replace(/"/g, '""')}"`,
                        item.totalQuantity,
                        item.revenue,
                        item.cost,
                        item.profit,
                        `${item.profitMargin}%`,
                        `"${item.status}"`
                    ];
                    csvContent += row.join(',') + '\n';
                });
            } else {
                csvContent += `BÁO CÁO DOANH THU THEO KHÁCH HÀNG\n`;
                csvContent += `Thời gian: Từ ${fromDate} đến ${toDate}\n\n`;
                csvContent += 'STT,Tên khách hàng,Mã KH,Số điện thoại,Số đơn xuất,Tổng số lượng SP,Tổng doanh thu (VNĐ),Tổng giá vốn (VNĐ),Lợi nhuận gộp (VNĐ),Tỷ suất LN (%)\n';
                (revenueReport?.byCustomer || []).forEach((item, idx) => {
                    const row = [
                        idx + 1,
                        `"${item.customerName.replace(/"/g, '""')}"`,
                        `"${item.customerCode}"`,
                        `"${item.customerPhone}"`,
                        item.receiptCount,
                        item.totalQuantity,
                        item.revenue,
                        item.cost,
                        item.profit,
                        `${item.profitMargin}%`
                    ];
                    csvContent += row.join(',') + '\n';
                });
            }
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filename = activeTab === 'INVENTORY'
            ? 'BaoCaoTonKho.csv'
            : activeTab === 'IMPORT_EXPORT'
            ? 'BaoCaoNhapXuatTon.csv'
            : `BaoCaoDoanhThu_${revenueSubTab}.csv`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Calculate Summaries for Inventory and IO
    const totalInventoryStock = inventoryItems.reduce((acc, i) => acc + i.stockQuantity, 0);
    const totalInventoryValue = inventoryItems.reduce((acc, i) => acc + i.totalValue, 0);

    const totalImportedQty = ioItems.reduce((acc, i) => acc + i.importedQuantity, 0);
    const totalExportedQty = ioItems.reduce((acc, i) => acc + i.exportedQuantity, 0);
    const totalEndingStock = ioItems.reduce((acc, i) => acc + i.endingStock, 0);
    const totalEndingValue = ioItems.reduce((acc, i) => acc + i.endingValue, 0);

    return (
        <div className="page-wrapper">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0 }}>Báo cáo & Thống kê Kho hàng</h1>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                        Bảng kê tồn kho, phân tích luân chuyển Nhập - Xuất - Tồn và hiệu quả Doanh thu theo thời gian tùy chọn.
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleExportExcel} className="btn btn-success">
                        <Download size={15} />
                        <span>Xuất file Excel (.csv)</span>
                    </button>
                    <button onClick={() => window.print()} className="btn btn-primary">
                        <Printer size={15} />
                        <span>In báo cáo</span>
                    </button>
                </div>
            </div>

            {/* Tab Selection */}
            <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', marginBottom: 20, flexWrap: 'wrap' }}>
                <button
                    onClick={() => handleTabChange('INVENTORY')}
                    style={{
                        padding: '10px 18px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'INVENTORY' ? '2px solid var(--accent)' : '2px solid transparent',
                        fontWeight: activeTab === 'INVENTORY' ? 600 : 500,
                        color: activeTab === 'INVENTORY' ? 'var(--accent)' : 'var(--text-muted)',
                        borderRadius: 0,
                        fontSize: 14,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: 'none'
                    }}
                >
                    <Package size={16} />
                    <span>Báo cáo Tồn Kho Hiện Tại</span>
                </button>
                <button
                    onClick={() => handleTabChange('IMPORT_EXPORT')}
                    style={{
                        padding: '10px 18px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'IMPORT_EXPORT' ? '2px solid var(--accent)' : '2px solid transparent',
                        fontWeight: activeTab === 'IMPORT_EXPORT' ? 600 : 500,
                        color: activeTab === 'IMPORT_EXPORT' ? 'var(--accent)' : 'var(--text-muted)',
                        borderRadius: 0,
                        fontSize: 14,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: 'none'
                    }}
                >
                    <BarChart3 size={16} />
                    <span>Báo cáo Nhập - Xuất - Tồn</span>
                </button>
                <button
                    onClick={() => handleTabChange('REVENUE')}
                    style={{
                        padding: '10px 18px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'REVENUE' ? '2px solid var(--accent)' : '2px solid transparent',
                        fontWeight: activeTab === 'REVENUE' ? 600 : 500,
                        color: activeTab === 'REVENUE' ? 'var(--accent)' : 'var(--text-muted)',
                        borderRadius: 0,
                        fontSize: 14,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: 'none'
                    }}
                >
                    <TrendingUp size={16} />
                    <span>Báo cáo Doanh Thu & Lợi Nhuận</span>
                </button>
            </div>

            {/* Date Range Toolbar (Active for Import/Export Tab and Revenue Tab) */}
            {(activeTab === 'IMPORT_EXPORT' || activeTab === 'REVENUE') && (
                <div className="card no-print" style={{ marginBottom: 20, padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>Khoảng thời gian:</span>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => setPreset('TODAY')} className="btn btn-outline btn-sm">Hôm nay</button>
                            <button type="button" onClick={() => setPreset('WEEK')} className="btn btn-outline btn-sm">7 ngày qua</button>
                            <button type="button" onClick={() => setPreset('MONTH')} className="btn btn-outline btn-sm">Tháng này</button>
                            <button type="button" onClick={() => setPreset('QUARTER')} className="btn btn-outline btn-sm">Quý này</button>
                            <button type="button" onClick={() => setPreset('YEAR')} className="btn btn-outline btn-sm">Năm nay</button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13 }}>Từ ngày:</span>
                            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ padding: '4px 8px' }} />
                            <span style={{ fontSize: 13 }}>Đến ngày:</span>
                            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ padding: '4px 8px' }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Printable Report Header */}
            <div className="print-only" style={{ display: 'none', textAlign: 'center', marginBottom: 20 }}>
                <h2 style={{ textTransform: 'uppercase', margin: '0 0 6px' }}>
                    {activeTab === 'INVENTORY'
                        ? 'BÁO CÁO TỒN KHO HIỆN TẠI'
                        : activeTab === 'IMPORT_EXPORT'
                        ? 'BẢNG KÊ NHẬP - XUẤT - TỒN KHO HÀNG HÓA'
                        : 'BÁO CÁO DOANH THU & HIỆU QUẢ KINH DOANH'}
                </h2>
                <div style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--text-muted)' }}>
                    {activeTab === 'INVENTORY'
                        ? `Thời điểm kết xuất: ${new Date().toLocaleString('vi-VN')}`
                        : `Từ ngày: ${fromDate} - Đến ngày: ${toDate}`}
                    {activeTab === 'REVENUE' && ` (Chế độ: ${revenueSubTab === 'PRODUCT' ? 'Theo sản phẩm' : revenueSubTab === 'RECEIPT' ? 'Theo phiếu xuất' : 'Theo khách hàng'})`}
                </div>
            </div>

            {/* TAB 1: INVENTORY REPORT */}
            {activeTab === 'INVENTORY' && (
                <>
                    <div className="stat-grid no-print" style={{ marginBottom: 20 }}>
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-title">Tổng số mặt hàng</div>
                                <div className="stat-icon-chip">
                                    <Package size={18} />
                                </div>
                            </div>
                            <div className="stat-value">{inventoryItems.length}</div>
                            <div className="stat-desc">Mặt hàng quản lý tồn</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-title">Tổng số lượng tồn kho</div>
                                <div className="stat-icon-chip">
                                    <Layers size={18} />
                                </div>
                            </div>
                            <div className="stat-value">{totalInventoryStock}</div>
                            <div className="stat-desc">Đơn vị sản phẩm lưu kho</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-title">Tổng giá trị tồn kho</div>
                                <div className="stat-icon-chip chip-green">
                                    <DollarSign size={18} />
                                </div>
                            </div>
                            <div className="stat-value" style={{ color: 'var(--success)' }}>
                                {formatCurrency(totalInventoryValue)}
                            </div>
                            <div className="stat-desc">Theo giá nhập tham chiếu</div>
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 50, textAlign: 'center' }}>STT</th>
                                    <th>Mã SP</th>
                                    <th>Tên sản phẩm</th>
                                    <th>Danh mục</th>
                                    <th>ĐVT</th>
                                    <th style={{ textAlign: 'center' }}>Tồn kho</th>
                                    <th style={{ textAlign: 'center' }}>Tối thiểu</th>
                                    <th style={{ textAlign: 'right' }}>Giá nhập</th>
                                    <th style={{ textAlign: 'right' }}>Tổng giá trị tồn</th>
                                    <th style={{ textAlign: 'center' }}>Tình trạng</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: 24, color: '#6b7280' }}>Đang tổng hợp báo cáo...</td></tr>
                                ) : inventoryItems.length === 0 ? (
                                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>Không có dữ liệu tồn kho</td></tr>
                                ) : (
                                    inventoryItems.map((item, idx) => (
                                        <tr key={item.productId}>
                                            <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                                            <td style={{ fontWeight: 600 }}>{item.productCode}</td>
                                            <td style={{ fontWeight: 500 }}>{item.productName}</td>
                                            <td>{item.categoryName}</td>
                                            <td>{item.unit}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 700 }}>{item.stockQuantity}</td>
                                            <td style={{ textAlign: 'center', color: '#6b7280' }}>{item.minStockLevel}</td>
                                            <td style={{ textAlign: 'right' }}>{formatCurrency(item.importPrice)}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.totalValue)}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                {item.status === 'HET_HANG' ? (
                                                    <span className="badge badge-danger">Hết hàng</span>
                                                ) : item.status === 'SAP_HET' ? (
                                                    <span className="badge badge-warning">Sắp hết</span>
                                                ) : (
                                                    <span className="badge badge-success">Bình thường</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {inventoryItems.length > 0 && (
                                <tfoot>
                                    <tr style={{ backgroundColor: '#f9fafb', fontWeight: 700 }}>
                                        <td colSpan={5} style={{ textAlign: 'right' }}>TỔNG CỘNG:</td>
                                        <td style={{ textAlign: 'center' }}>{totalInventoryStock}</td>
                                        <td></td>
                                        <td></td>
                                        <td style={{ textAlign: 'right', color: 'var(--accent)', fontSize: 16 }}>
                                            {formatCurrency(totalInventoryValue)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </>
            )}

            {/* TAB 2: IMPORT - EXPORT - INVENTORY REPORT */}
            {activeTab === 'IMPORT_EXPORT' && (
                <>
                    <div className="stat-grid no-print" style={{ marginBottom: 20 }}>
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-title">Tổng số lượng nhập</div>
                                <div className="stat-icon-chip">
                                    <ArrowDownToLine size={18} />
                                </div>
                            </div>
                            <div className="stat-value">{totalImportedQty}</div>
                            <div className="stat-desc">Đơn vị nhập trong kỳ</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-title">Tổng số lượng xuất</div>
                                <div className="stat-icon-chip chip-green">
                                    <ArrowUpFromLine size={18} />
                                </div>
                            </div>
                            <div className="stat-value">{totalExportedQty}</div>
                            <div className="stat-desc">Đơn vị xuất trong kỳ</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-title">Tổng tồn cuối kỳ</div>
                                <div className="stat-icon-chip">
                                    <Package size={18} />
                                </div>
                            </div>
                            <div className="stat-value">{totalEndingStock}</div>
                            <div className="stat-desc">Đơn vị còn lưu kho</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-title">Giá trị tồn cuối kỳ</div>
                                <div className="stat-icon-chip chip-green">
                                    <DollarSign size={18} />
                                </div>
                            </div>
                            <div className="stat-value" style={{ color: 'var(--success)' }}>
                                {formatCurrency(totalEndingValue)}
                            </div>
                            <div className="stat-desc">Tổng giá trị tồn cuối</div>
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 50, textAlign: 'center' }}>STT</th>
                                    <th>Mã SP</th>
                                    <th>Tên sản phẩm</th>
                                    <th>ĐVT</th>
                                    <th style={{ textAlign: 'center' }}>Tồn đầu kỳ</th>
                                    <th style={{ textAlign: 'center', color: 'var(--accent)' }}>Nhập trong kỳ</th>
                                    <th style={{ textAlign: 'center', color: 'var(--success)' }}>Xuất trong kỳ</th>
                                    <th style={{ textAlign: 'center', fontWeight: 700 }}>Tồn cuối kỳ</th>
                                    <th style={{ textAlign: 'right' }}>Giá trị tồn cuối</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24, color: '#6b7280' }}>Đang tính toán nhập-xuất-tồn...</td></tr>
                                ) : ioItems.length === 0 ? (
                                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>Không có dữ liệu trong khoảng thời gian này</td></tr>
                                ) : (
                                    ioItems.map((item, idx) => (
                                        <tr key={item.productId}>
                                            <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                                            <td style={{ fontWeight: 600 }}>{item.productCode}</td>
                                            <td style={{ fontWeight: 500 }}>{item.productName}</td>
                                            <td>{item.unit}</td>
                                            <td style={{ textAlign: 'center' }}>{item.initialStock}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--accent)' }}>+{item.importedQuantity}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--success)' }}>-{item.exportedQuantity}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 15 }}>{item.endingStock}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.endingValue)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {ioItems.length > 0 && (
                                <tfoot>
                                    <tr style={{ backgroundColor: '#f9fafb', fontWeight: 700 }}>
                                        <td colSpan={4} style={{ textAlign: 'right' }}>TỔNG CỘNG:</td>
                                        <td style={{ textAlign: 'center' }}>
                                            {ioItems.reduce((acc, i) => acc + i.initialStock, 0)}
                                        </td>
                                        <td style={{ textAlign: 'center', color: 'var(--accent)' }}>+{totalImportedQty}</td>
                                        <td style={{ textAlign: 'center', color: 'var(--success)' }}>-{totalExportedQty}</td>
                                        <td style={{ textAlign: 'center', fontSize: 16 }}>{totalEndingStock}</td>
                                        <td style={{ textAlign: 'right', color: 'var(--accent)', fontSize: 16 }}>
                                            {formatCurrency(totalEndingValue)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </>
            )}

            {/* TAB 3: REVENUE & PROFIT REPORT */}
            {activeTab === 'REVENUE' && (
                <>
                    {/* Revenue Stat Cards */}
                    <div className="stat-grid no-print" style={{ marginBottom: 20 }}>
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-title">Tổng Doanh Thu</div>
                                <div className="stat-icon-chip chip-green">
                                    <DollarSign size={18} />
                                </div>
                            </div>
                            <div className="stat-value" style={{ color: 'var(--success)' }}>
                                {formatCurrency(revenueReport?.totalRevenue)}
                            </div>
                            <div className="stat-desc">Doanh số từ các phiếu xuất hoàn thành</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-title">Tổng Giá Vốn (COGS)</div>
                                <div className="stat-icon-chip">
                                    <Layers size={18} />
                                </div>
                            </div>
                            <div className="stat-value" style={{ color: '#475569' }}>
                                {formatCurrency(revenueReport?.totalCost)}
                            </div>
                            <div className="stat-desc">Ước tính theo giá nhập tham chiếu</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-title">Lợi Nhuận Gộp Ước Tính</div>
                                <div className="stat-icon-chip" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
                                    <TrendingUp size={18} />
                                </div>
                            </div>
                            <div className="stat-value" style={{ color: '#059669' }}>
                                {formatCurrency(revenueReport?.grossProfit)}
                            </div>
                            <div className="stat-desc">
                                Tỷ suất lợi nhuận: <strong style={{ color: '#059669' }}>{revenueReport?.profitMargin ?? 0}%</strong>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-title">Sản Lượng & Đơn Xuất</div>
                                <div className="stat-icon-chip">
                                    <ArrowUpFromLine size={18} />
                                </div>
                            </div>
                            <div className="stat-value">
                                {revenueReport?.totalItemsSold ?? 0} <span style={{ fontSize: 13, fontWeight: 'normal', color: 'var(--text-muted)' }}>sản phẩm</span>
                            </div>
                            <div className="stat-desc">
                                Trong tổng số <strong>{revenueReport?.totalReceipts ?? 0}</strong> phiếu xuất kho
                            </div>
                        </div>
                    </div>

                    {/* Sub-view Switcher: Product / Receipt / Customer */}
                    <div className="no-print" style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                        <button
                            type="button"
                            onClick={() => setRevenueSubTab('PRODUCT')}
                            className={`btn btn-sm ${revenueSubTab === 'PRODUCT' ? 'btn-primary' : 'btn-outline'}`}
                        >
                            <Package size={14} />
                            <span>Theo Mặt Hàng / Sản Phẩm</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRevenueSubTab('RECEIPT')}
                            className={`btn btn-sm ${revenueSubTab === 'RECEIPT' ? 'btn-primary' : 'btn-outline'}`}
                        >
                            <FileText size={14} />
                            <span>Theo Phiếu Xuất Kho</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRevenueSubTab('CUSTOMER')}
                            className={`btn btn-sm ${revenueSubTab === 'CUSTOMER' ? 'btn-primary' : 'btn-outline'}`}
                        >
                            <Users size={14} />
                            <span>Theo Khách Hàng</span>
                        </button>
                    </div>

                    {/* VIEW 1: BY PRODUCT */}
                    {revenueSubTab === 'PRODUCT' && (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: 50, textAlign: 'center' }}>STT</th>
                                        <th>Mã SP</th>
                                        <th>Tên sản phẩm</th>
                                        <th>Danh mục</th>
                                        <th>ĐVT</th>
                                        <th style={{ textAlign: 'center' }}>Số lượng bán</th>
                                        <th style={{ textAlign: 'right' }}>Đơn giá bán TB</th>
                                        <th style={{ textAlign: 'right' }}>Tổng Doanh Thu</th>
                                        <th style={{ textAlign: 'right' }}>Tổng Giá Vốn</th>
                                        <th style={{ textAlign: 'right', color: '#059669' }}>Lợi Nhuận Gộp</th>
                                        <th style={{ textAlign: 'center' }}>Tỷ Suất LN</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={11} style={{ textAlign: 'center', padding: 24, color: '#6b7280' }}>Đang tổng hợp báo cáo doanh thu...</td></tr>
                                    ) : !revenueReport || revenueReport.byProduct.length === 0 ? (
                                        <tr><td colSpan={11} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>Không có giao dịch xuất hàng nào trong khoảng thời gian này</td></tr>
                                    ) : (
                                        revenueReport.byProduct.map((p, idx) => (
                                            <tr key={p.productId}>
                                                <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                                                <td style={{ fontWeight: 600 }}>{p.productCode}</td>
                                                <td style={{ fontWeight: 500 }}>{p.productName}</td>
                                                <td><span className="badge badge-info">{p.categoryName || 'Mặc định'}</span></td>
                                                <td>{p.unit}</td>
                                                <td style={{ textAlign: 'center', fontWeight: 600 }}>{p.soldQuantity}</td>
                                                <td style={{ textAlign: 'right' }}>{formatCurrency(p.avgExportPrice)}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(p.revenue)}</td>
                                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{formatCurrency(p.cost)}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 600, color: p.profit >= 0 ? '#059669' : 'var(--danger)' }}>
                                                    {formatCurrency(p.profit)}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className={`badge ${p.profitMargin >= 20 ? 'badge-success' : p.profitMargin > 0 ? 'badge-info' : 'badge-danger'}`}>
                                                        {p.profitMargin}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {revenueReport && revenueReport.byProduct.length > 0 && (
                                    <tfoot>
                                        <tr style={{ backgroundColor: '#f9fafb', fontWeight: 700 }}>
                                            <td colSpan={5} style={{ textAlign: 'right' }}>TỔNG CỘNG:</td>
                                            <td style={{ textAlign: 'center' }}>{revenueReport.totalItemsSold}</td>
                                            <td></td>
                                            <td style={{ textAlign: 'right', color: 'var(--success)', fontSize: 16 }}>
                                                {formatCurrency(revenueReport.totalRevenue)}
                                            </td>
                                            <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                                                {formatCurrency(revenueReport.totalCost)}
                                            </td>
                                            <td style={{ textAlign: 'right', color: '#059669', fontSize: 16 }}>
                                                {formatCurrency(revenueReport.grossProfit)}
                                            </td>
                                            <td style={{ textAlign: 'center', color: '#059669' }}>
                                                {revenueReport.profitMargin}%
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    )}

                    {/* VIEW 2: BY RECEIPT */}
                    {revenueSubTab === 'RECEIPT' && (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: 50, textAlign: 'center' }}>STT</th>
                                        <th>Mã phiếu xuất</th>
                                        <th>Ngày xuất</th>
                                        <th>Khách hàng</th>
                                        <th>Người lập</th>
                                        <th style={{ textAlign: 'center' }}>Số lượng SP</th>
                                        <th style={{ textAlign: 'right' }}>Tổng Doanh Thu</th>
                                        <th style={{ textAlign: 'right' }}>Tổng Giá Vốn</th>
                                        <th style={{ textAlign: 'right', color: '#059669' }}>Lợi Nhuận</th>
                                        <th style={{ textAlign: 'center' }}>Tỷ Suất LN</th>
                                        <th style={{ textAlign: 'center' }}>Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={11} style={{ textAlign: 'center', padding: 24, color: '#6b7280' }}>Đang tổng hợp danh sách phiếu xuất...</td></tr>
                                    ) : !revenueReport || revenueReport.byReceipt.length === 0 ? (
                                        <tr><td colSpan={11} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>Không có phiếu xuất nào trong khoảng thời gian này</td></tr>
                                    ) : (
                                        revenueReport.byReceipt.map((r, idx) => (
                                            <tr key={r.receiptId}>
                                                <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                                                <td style={{ fontWeight: 600 }}>{r.code}</td>
                                                <td>{formatDate(r.exportDate)}</td>
                                                <td style={{ fontWeight: 500 }}>{r.customerName}</td>
                                                <td>{r.creatorName}</td>
                                                <td style={{ textAlign: 'center', fontWeight: 600 }}>{r.totalQuantity}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(r.revenue)}</td>
                                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{formatCurrency(r.cost)}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 600, color: r.profit >= 0 ? '#059669' : 'var(--danger)' }}>
                                                    {formatCurrency(r.profit)}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className={`badge ${r.profitMargin >= 20 ? 'badge-success' : r.profitMargin > 0 ? 'badge-info' : 'badge-danger'}`}>
                                                        {r.profitMargin}%
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className="badge badge-success">
                                                        {r.status === 'COMPLETED' ? 'Hoàn thành' : 'Đã duyệt'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {revenueReport && revenueReport.byReceipt.length > 0 && (
                                    <tfoot>
                                        <tr style={{ backgroundColor: '#f9fafb', fontWeight: 700 }}>
                                            <td colSpan={5} style={{ textAlign: 'right' }}>TỔNG CỘNG:</td>
                                            <td style={{ textAlign: 'center' }}>{revenueReport.totalItemsSold}</td>
                                            <td style={{ textAlign: 'right', color: 'var(--success)', fontSize: 16 }}>
                                                {formatCurrency(revenueReport.totalRevenue)}
                                            </td>
                                            <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                                                {formatCurrency(revenueReport.totalCost)}
                                            </td>
                                            <td style={{ textAlign: 'right', color: '#059669', fontSize: 16 }}>
                                                {formatCurrency(revenueReport.grossProfit)}
                                            </td>
                                            <td style={{ textAlign: 'center', color: '#059669' }}>
                                                {revenueReport.profitMargin}%
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    )}

                    {/* VIEW 3: BY CUSTOMER */}
                    {revenueSubTab === 'CUSTOMER' && (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: 50, textAlign: 'center' }}>STT</th>
                                        <th>Tên khách hàng</th>
                                        <th>Mã KH</th>
                                        <th>Số điện thoại</th>
                                        <th style={{ textAlign: 'center' }}>Số đơn mua</th>
                                        <th style={{ textAlign: 'center' }}>Tổng SL hàng</th>
                                        <th style={{ textAlign: 'right' }}>Tổng Doanh Thu</th>
                                        <th style={{ textAlign: 'right' }}>Tổng Giá Vốn</th>
                                        <th style={{ textAlign: 'right', color: '#059669' }}>Lợi Nhuận Mang Lại</th>
                                        <th style={{ textAlign: 'center' }}>Tỷ Suất LN</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={10} style={{ textAlign: 'center', padding: 24, color: '#6b7280' }}>Đang tổng hợp theo khách hàng...</td></tr>
                                    ) : !revenueReport || revenueReport.byCustomer.length === 0 ? (
                                        <tr><td colSpan={10} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>Không có dữ liệu khách hàng mua hàng trong khoảng thời gian này</td></tr>
                                    ) : (
                                        revenueReport.byCustomer.map((c, idx) => (
                                            <tr key={c.customerId}>
                                                <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                                                <td style={{ fontWeight: 600 }}>{c.customerName}</td>
                                                <td><span className="badge badge-info">{c.customerCode}</span></td>
                                                <td>{c.customerPhone || '-'}</td>
                                                <td style={{ textAlign: 'center', fontWeight: 600 }}>{c.receiptCount}</td>
                                                <td style={{ textAlign: 'center' }}>{c.totalQuantity}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(c.revenue)}</td>
                                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{formatCurrency(c.cost)}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 600, color: c.profit >= 0 ? '#059669' : 'var(--danger)' }}>
                                                    {formatCurrency(c.profit)}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className={`badge ${c.profitMargin >= 20 ? 'badge-success' : c.profitMargin > 0 ? 'badge-info' : 'badge-danger'}`}>
                                                        {c.profitMargin}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {revenueReport && revenueReport.byCustomer.length > 0 && (
                                    <tfoot>
                                        <tr style={{ backgroundColor: '#f9fafb', fontWeight: 700 }}>
                                            <td colSpan={4} style={{ textAlign: 'right' }}>TỔNG CỘNG:</td>
                                            <td style={{ textAlign: 'center' }}>{revenueReport.totalReceipts}</td>
                                            <td style={{ textAlign: 'center' }}>{revenueReport.totalItemsSold}</td>
                                            <td style={{ textAlign: 'right', color: 'var(--success)', fontSize: 16 }}>
                                                {formatCurrency(revenueReport.totalRevenue)}
                                            </td>
                                            <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                                                {formatCurrency(revenueReport.totalCost)}
                                            </td>
                                            <td style={{ textAlign: 'right', color: '#059669', fontSize: 16 }}>
                                                {formatCurrency(revenueReport.grossProfit)}
                                            </td>
                                            <td style={{ textAlign: 'center', color: '#059669' }}>
                                                {revenueReport.profitMargin}%
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Print Signatures Block */}
            <div className="print-only" style={{ display: 'none', marginTop: 40, textAlign: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: 13 }}>
                    <div>
                        <strong>Người lập biểu</strong>
                        <div style={{ fontStyle: 'italic', fontSize: 12 }}>(Ký, họ tên)</div>
                    </div>
                    <div>
                        <strong>Thủ kho</strong>
                        <div style={{ fontStyle: 'italic', fontSize: 12 }}>(Ký, họ tên)</div>
                    </div>
                    <div>
                        <strong>Kế toán trưởng / Giám đốc</strong>
                        <div style={{ fontStyle: 'italic', fontSize: 12 }}>(Ký, đóng dấu)</div>
                    </div>
                </div>
            </div>
        </div>
    );
}