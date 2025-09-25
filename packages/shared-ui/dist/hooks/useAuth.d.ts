import type { User } from '@matchday/shared-types';
export declare const useAuth: () => {
    user: User | null;
    loading: boolean;
    error: string | null;
    signOut: () => void;
};
