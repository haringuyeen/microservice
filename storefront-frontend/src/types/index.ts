export interface Product {
  id: number;
  code: string;
  name: string;
  categoryId: number;
  categoryName?: string;
  categoryCode?: string;
  unit: string;
  exportPrice: number;
  originalPrice?: number;
  stockQuantity: number;
  imageUrl?: string;
  description?: string;
  needTag?: string;
  rating?: number;
  reviewCount?: number;
  size?: string;
  isBestSeller?: boolean;
}

export interface Category {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface CartItem {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  imageUrl?: string;
  currentStock?: number;
}

export interface Cart {
  id: number;
  customerId?: number;
  sessionId?: string;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
}

export interface CustomerUser {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  status: string;
  createdAt?: string;
}

export interface OrderDetail {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface Order {
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
