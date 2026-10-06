import axiosClient from './axiosClient';
import type { UserItem, CreateUserPayload, UpdateUserPayload } from '../types/auth';
import type { PageResponse } from '../types/warehouse';

export const searchUsers = (params?: { keyword?: string; role?: string; active?: boolean; page?: number; size?: number }) => {
    return axiosClient.get<PageResponse<UserItem>>('/api/users', { params });
};

export const getUserById = (id: number) => {
    return axiosClient.get<UserItem>(`/api/users/${id}`);
};

export const createUser = (data: CreateUserPayload) => {
    return axiosClient.post<UserItem>('/api/users', data);
};

export const updateUser = (id: number, data: UpdateUserPayload) => {
    return axiosClient.put<UserItem>(`/api/users/${id}`, data);
};

export const toggleUserStatus = (id: number) => {
    return axiosClient.patch<UserItem>(`/api/users/${id}/toggle-status`);
};

export const deleteUser = (id: number) => {
    return axiosClient.delete(`/api/users/${id}`);
};