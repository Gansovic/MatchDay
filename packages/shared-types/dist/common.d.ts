export interface BaseEntity {
    id: string;
    created_at: string;
    updated_at: string;
}
export interface ApiResponse<T> {
    data: T;
    error?: string;
}
export interface PaginatedResponse<T> {
    data: T[];
    count: number;
    page: number;
    per_page: number;
}
