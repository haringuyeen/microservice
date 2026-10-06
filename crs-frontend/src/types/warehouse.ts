export interface Category {
    id: number;
    code: string;
    name: string;
    description?: string;
}

export interface Supplier {
    id: number;
    code: string;
    name: string;
    address?: string;
    phone: string;
    email?: string;
    contactPerson?: string;
}

export interface Customer {
    id: number;
    code: string;
    name: string;
    address?: string;
    phone: string;
    email?: string;
    customerType?: string; // CA_NHAN, DOANH_NGHIEP, DAI_LY
}

export interface Product {
    id: number;
    code: string;
    name: string;
    categoryId: number;
    categoryCode?: string;
    categoryName?: string;
    supplierId?: number | null;
    supplierCode?: string;
    supplierName?: string;
    unit: string;
    importPrice: number;
    exportPrice: number;
    stockQuantity: number;
    minStockLevel: number;
    imageUrl?: string;
    description?: string;
    status: 'ACTIVE' | 'INACTIVE';
}

export interface ImportReceiptDetail {
    id?: number;
    productId: number;
    productCode?: string;
    productName?: string;
    unit?: string;
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
}

export interface ImportReceipt {
    id: number;
    code: string;
    importDate: string;
    supplierId: number;
    supplierCode?: string;
    supplierName?: string;
    supplierPhone?: string;
    supplierAddress?: string;
    userId: number;
    creatorName: string;
    totalAmount: number;
    notes?: string;
    status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
    approvedById?: number;
    approverName?: string;
    approvedAt?: string;
    details: ImportReceiptDetail[];
}

export interface ExportReceiptDetail {
    id?: number;
    productId: number;
    productCode?: string;
    productName?: string;
    unit?: string;
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
}

export interface ExportReceipt {
    id: number;
    code: string;
    exportDate: string;
    customerId: number;
    customerCode?: string;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    userId: number;
    creatorName: string;
    totalAmount: number;
    notes?: string;
    status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
    approvedById?: number;
    approverName?: string;
    approvedAt?: string;
    details: ExportReceiptDetail[];
}

export interface DashboardStats {
    totalProducts: number;
    totalStockValue: number;
    totalImportsThisMonth: number;
    totalExportsThisMonth: number;
    totalImportValueThisMonth: number;
    totalExportValueThisMonth: number;
    totalProfitThisMonth?: number;
    profitMarginThisMonth?: number;
    totalRevenueToday?: number;
    lowStockCount: number;
    lowStockProducts: Product[];
    recentImports: ImportReceipt[];
    recentExports: ExportReceipt[];
    monthlyChart: { month: string; importValue: number; exportValue: number; revenue?: number; profit?: number }[];
    topSellingProducts: { productId: number; productName: string; soldQuantity: number; revenue?: number }[];
}

export interface InventoryReportItem {
    productId: number;
    productCode: string;
    productName: string;
    categoryName: string;
    unit: string;
    stockQuantity: number;
    minStockLevel: number;
    importPrice: number;
    totalValue: number;
    status: 'HET_HANG' | 'SAP_HET' | 'CON_HANG';
}

export interface ImportExportInventoryItem {
    productId: number;
    productCode: string;
    productName: string;
    unit: string;
    initialStock: number;
    importedQuantity: number;
    exportedQuantity: number;
    endingStock: number;
    endingValue: number;
}

export interface RevenueByProductItem {
    productId: number;
    productCode: string;
    productName: string;
    categoryName: string;
    unit: string;
    soldQuantity: number;
    avgExportPrice: number;
    importPrice: number;
    revenue: number;
    cost: number;
    profit: number;
    profitMargin: number;
}

export interface RevenueByReceiptItem {
    receiptId: number;
    code: string;
    exportDate: string;
    customerId: number;
    customerName: string;
    creatorName: string;
    totalQuantity: number;
    revenue: number;
    cost: number;
    profit: number;
    profitMargin: number;
    status: string;
}

export interface RevenueByCustomerItem {
    customerId: number;
    customerCode: string;
    customerName: string;
    customerPhone: string;
    receiptCount: number;
    totalQuantity: number;
    revenue: number;
    cost: number;
    profit: number;
    profitMargin: number;
}

export interface RevenueReport {
    totalRevenue: number;
    totalCost: number;
    grossProfit: number;
    profitMargin: number;
    totalReceipts: number;
    totalItemsSold: number;
    byProduct: RevenueByProductItem[];
    byReceipt: RevenueByReceiptItem[];
    byCustomer: RevenueByCustomerItem[];
}

export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}