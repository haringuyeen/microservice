import axiosClient from './axiosClient';

export interface OrderDetail {
    id: number;
    productId: number;
    productCode: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
}

export interface StorefrontOrder {
    id: number;
    orderCode: string;
    customerId?: number;
    customerName: string;
    customerPhone: string;
    shippingAddress: string;
    totalAmount: number;
    paymentMethod: string;
    status: 'PENDING' | 'EXPORT_REQUESTED' | 'EXPORTED' | 'CANCELLED';
    exportReceiptId?: number;
    notes?: string;
    createdAt: string;
    details: OrderDetail[];
}

export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
}

export const getStorefrontOrders = (params?: {
    keyword?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    size?: number;
}) => {
    return axiosClient.get<PageResponse<StorefrontOrder>>('/api/orders', { params });
};

export const getStorefrontOrderById = (id: number) => {
    return axiosClient.get<StorefrontOrder>(`/api/orders/${id}`);
};

export const createExportReceiptFromOrder = (orderId: number) => {
    return axiosClient.post(`/api/export-receipts/from-order/${orderId}`);
};
