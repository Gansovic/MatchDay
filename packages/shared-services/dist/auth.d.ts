import type { User } from '@matchday/shared-types';
export declare const authService: {
    getCurrentUser: () => Promise<User | null>;
    signOut: () => Promise<void>;
};
