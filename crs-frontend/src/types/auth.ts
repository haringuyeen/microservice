export type Role = 'ADMIN' | 'MANAGER' | 'STAFF';

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    userId: number;
    token: string;
    username: string;
    role: Role;
    fullName?: string;
    email?: string;
}

export interface UserItem {
    id: number;
    username: string;
    fullName: string;
    email?: string;
    phone?: string;
    role: Role;
    active: boolean;
    createdAt?: string;
}

export interface CreateUserPayload {
    username: string;
    password: string;
    fullName: string;
    email?: string;
    phone?: string;
    role: Role;
    active?: boolean;
}

export interface UpdateUserPayload {
    fullName: string;
    email?: string;
    phone?: string;
    role: Role;
    active?: boolean;
    password?: string;
}