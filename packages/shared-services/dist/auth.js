import { supabase } from './supabase';
export const authService = {
    getCurrentUser: async () => {
        var _a, _b;
        const { data: { user } } = await supabase.auth.getUser();
        return user ? {
            id: user.id,
            email: user.email || '',
            name: ((_a = user.user_metadata) === null || _a === void 0 ? void 0 : _a.name) || user.email || 'Unknown User',
            avatar_url: (_b = user.user_metadata) === null || _b === void 0 ? void 0 : _b.avatar_url,
            created_at: user.created_at,
            updated_at: user.updated_at || user.created_at,
        } : null;
    },
    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error)
            throw error;
    }
};
