import axios from 'axios';
import { Product, Category, Cart, CustomerUser, Order } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('customer_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Products & Categories
export const fetchProducts = (params?: {
  needTag?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
}) => {
  return apiClient.get<Product[]>('/api/storefront/products', { params });
};

export const fetchProductById = (id: number) => {
  return apiClient.get<Product>(`/api/storefront/products/${id}`);
};

export const fetchCategories = () => {
  return apiClient.get<Category[]>('/api/storefront/categories');
};

// Cart
export const fetchCart = (sessionId?: string) => {
  return apiClient.get<Cart>('/api/storefront/cart', { params: { sessionId } });
};

export const addToCart = (productId: number, quantity: number, sessionId?: string) => {
  return apiClient.post<Cart>('/api/storefront/cart/items', { productId, quantity, sessionId });
};

export const updateCartItem = (itemId: number, quantity: number, sessionId?: string) => {
  return apiClient.put<Cart>(`/api/storefront/cart/items/${itemId}`, { quantity }, { params: { sessionId } });
};

export const removeCartItem = (itemId: number, sessionId?: string) => {
  return apiClient.delete<Cart>(`/api/storefront/cart/items/${itemId}`, { params: { sessionId } });
};

export const clearCart = (sessionId?: string) => {
  return apiClient.delete('/api/storefront/cart', { params: { sessionId } });
};

// Customer Auth
export const registerCustomer = (data: { email: string; password: string; fullName: string; phone?: string; address?: string }) => {
  return apiClient.post<{ token: string; user: CustomerUser }>('/api/customer-auth/register', data);
};

export const loginCustomer = (data: { email: string; password: string }) => {
  return apiClient.post<{ token: string; user: CustomerUser }>('/api/customer-auth/login', data);
};

export const fetchCustomerProfile = () => {
  return apiClient.get<CustomerUser>('/api/customer-auth/profile');
};

// Orders
export const createOrder = (data: {
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  notes?: string;
  sessionId?: string;
  items: { productId: number; quantity: number }[];
}) => {
  return apiClient.post<Order>('/api/orders', data);
};

export const fetchMyOrders = () => {
  return apiClient.get<Order[]>('/api/orders/my-orders');
};

export const fetchOrderById = (id: number) => {
  return apiClient.get<Order>(`/api/orders/${id}`);
};

export default apiClient;
