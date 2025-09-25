import { BaseEntity } from './common';
export interface User extends BaseEntity {
    email: string;
    name: string;
    avatar_url?: string;
}
export interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
}
