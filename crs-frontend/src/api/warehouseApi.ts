import axiosClient from './axiosClient';
import type {
    Category,
    Supplier,
    Customer,
    Product,
    ImportReceipt,
    ExportReceipt,
    DashboardStats,
    InventoryReportItem,
    ImportExportInventoryItem,
    RevenueReport,
    PageResponse
} from '../types/warehouse';

// --- CATEGORIES ---
export const getCategories = (params?: { keyword?: string; page?: number; size?: number }) =>
    axiosClient.get<PageResponse<Category>>('/api/categories', { params });

export const getAllCategories = () =>
    axiosClient.get<Category[]>('/api/categories/all');

export const createCategory = (data: Partial<Category>) =>
    axiosClient.post<Category>('/api/categories', data);

export const updateCategory = (id: number, data: Partial<Category>) =>
    axiosClient.put<Category>(`/api/categories/${id}`, data);

export const deleteCategory = (id: number) =>
    axiosClient.delete(`/api/categories/${id}`);


// --- SUPPLIERS ---
export const getSuppliers = (params?: { keyword?: string; page?: number; size?: number }) =>
    axiosClient.get<PageResponse<Supplier>>('/api/suppliers', { params });

export const getAllSuppliers = () =>
    axiosClient.get<Supplier[]>('/api/suppliers/all');

export const getSupplierReceipts = (id: number) =>
    axiosClient.get<ImportReceipt[]>(`/api/suppliers/${id}/receipts`);

export const getSupplierById = (id: number) =>
    axiosClient.get<Supplier>(`/api/suppliers/${id}`);

export const createSupplier = (data: Partial<Supplier>) =>
    axiosClient.post<Supplier>('/api/suppliers', data);

export const updateSupplier = (id: number, data: Partial<Supplier>) =>
    axiosClient.put<Supplier>(`/api/suppliers/${id}`, data);

export const deleteSupplier = (id: number) =>
    axiosClient.delete(`/api/suppliers/${id}`);


// --- CUSTOMERS ---
export const getCustomers = (params?: { keyword?: string; customerType?: string; page?: number; size?: number }) =>
    axiosClient.get<PageResponse<Customer>>('/api/customers', { params });

export const getAllCustomers = () =>
    axiosClient.get<Customer[]>('/api/customers/all');

export const getCustomerById = (id: number) =>
    axiosClient.get<Customer>(`/api/customers/${id}`);

export const getCustomerReceipts = (id: number) =>
    axiosClient.get<ExportReceipt[]>(`/api/customers/${id}/receipts`);

export const createCustomer = (data: Partial<Customer>) =>
    axiosClient.post<Customer>('/api/customers', data);

export const updateCustomer = (id: number, data: Partial<Customer>) =>
    axiosClient.put<Customer>(`/api/customers/${id}`, data);

export const deleteCustomer = (id: number) =>
    axiosClient.delete(`/api/customers/${id}`);


// --- PRODUCTS ---
export const getProducts = (params?: {
    keyword?: string;
    categoryId?: number;
    supplierId?: number;
    status?: string;
    inStock?: boolean;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    size?: number;
}) => axiosClient.get<PageResponse<Product>>('/api/products', { params });

export const getAllProducts = () =>
    axiosClient.get<Product[]>('/api/products/all');

export const getProductsBySupplier = (supplierId: number) =>
    axiosClient.get<Product[]>(`/api/products/by-supplier/${supplierId}`);

export const getLowStockProducts = () =>
    axiosClient.get<Product[]>('/api/products/low-stock');

export const getProductById = (id: number) =>
    axiosClient.get<Product>(`/api/products/${id}`);

export const createProduct = (data: Partial<Product>) =>
    axiosClient.post<Product>('/api/products', data);

export const updateProduct = (id: number, data: Partial<Product>) =>
    axiosClient.put<Product>(`/api/products/${id}`, data);

export const deleteProduct = (id: number) =>
    axiosClient.delete(`/api/products/${id}`);


// --- IMPORT RECEIPTS ---
export const getImportReceipts = (params?: {
    keyword?: string;
    supplierId?: number;
    status?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    size?: number;
}) => axiosClient.get<PageResponse<ImportReceipt>>('/api/import-receipts', { params });

export const getImportReceiptById = (id: number) =>
    axiosClient.get<ImportReceipt>(`/api/import-receipts/${id}`);

export const createImportReceipt = (data: Partial<ImportReceipt>) =>
    axiosClient.post<ImportReceipt>('/api/import-receipts', data);

export const updateImportReceipt = (id: number, data: Partial<ImportReceipt>) =>
    axiosClient.put<ImportReceipt>(`/api/import-receipts/${id}`, data);

export const deleteImportReceipt = (id: number) =>
    axiosClient.delete(`/api/import-receipts/${id}`);

export const approveImportReceipt = (id: number) =>
    axiosClient.patch<ImportReceipt>(`/api/import-receipts/${id}/approve`);

export const rejectImportReceipt = (id: number) =>
    axiosClient.patch<ImportReceipt>(`/api/import-receipts/${id}/reject`);

export const cancelImportReceipt = (id: number) =>
    axiosClient.patch<ImportReceipt>(`/api/import-receipts/${id}/cancel`);


// --- EXPORT RECEIPTS ---
export const getExportReceipts = (params?: {
    keyword?: string;
    customerId?: number;
    status?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    size?: number;
}) => axiosClient.get<PageResponse<ExportReceipt>>('/api/export-receipts', { params });

export const getExportReceiptById = (id: number) =>
    axiosClient.get<ExportReceipt>(`/api/export-receipts/${id}`);

export const createExportReceipt = (data: Partial<ExportReceipt>) =>
    axiosClient.post<ExportReceipt>('/api/export-receipts', data);

export const updateExportReceipt = (id: number, data: Partial<ExportReceipt>) =>
    axiosClient.put<ExportReceipt>(`/api/export-receipts/${id}`, data);

export const deleteExportReceipt = (id: number) =>
    axiosClient.delete(`/api/export-receipts/${id}`);

export const approveExportReceipt = (id: number) =>
    axiosClient.patch<ExportReceipt>(`/api/export-receipts/${id}/approve`);

export const rejectExportReceipt = (id: number) =>
    axiosClient.patch<ExportReceipt>(`/api/export-receipts/${id}/reject`);

export const cancelExportReceipt = (id: number) =>
    axiosClient.patch<ExportReceipt>(`/api/export-receipts/${id}/cancel`);


// --- DASHBOARD & REPORTS ---
export const getDashboardStats = () =>
    axiosClient.get<DashboardStats>('/api/dashboard');

export const getInventoryReport = () =>
    axiosClient.get<InventoryReportItem[]>('/api/reports/inventory');

export const getImportExportInventoryReport = (params?: { from?: string; to?: string }) =>
    axiosClient.get<ImportExportInventoryItem[]>('/api/reports/import-export-inventory', { params });

export const getRevenueReport = (params?: { from?: string; to?: string }) =>
    axiosClient.get<RevenueReport>('/api/reports/revenue', { params });