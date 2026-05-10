/**
 * supabaseService.js - Supabase client and auth functions for web
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

const STORAGE_BUCKET = 'acne-images';

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

/**
 * Get or create a unique device ID
 * @returns {string} Device ID
 */
export const getDeviceId = () => {
    let deviceId = localStorage.getItem('acnescan_device_id');

    if (!deviceId) {
        deviceId = `device-${crypto.randomUUID()}`;
        localStorage.setItem('acnescan_device_id', deviceId);
    }

    return deviceId;
};

/**
 * Sign up with email and password
 */
export const signUp = async (email, password, displayName = '') => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName,
                }
            }
        });

        if (error) throw error;
        return { success: true, data, error: null };
    } catch (error) {
        console.error('Sign up error:', error);
        return { success: false, data: null, error: error.message };
    }
};

/**
 * Sign in with email and password
 */
export const signIn = async (email, password) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return { success: true, data, error: null };
    } catch (error) {
        console.error('Sign in error:', error);
        return { success: false, data: null, error: error.message };
    }
};

/**
 * Sign out current user
 */
export const signOut = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true, error: null };
    } catch (error) {
        console.error('Sign out error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Sign in with Google OAuth
 */
export const signInWithGoogle = async () => {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            }
        });

        if (error) throw error;
        return { success: true, data, error: null };
    } catch (error) {
        console.error('Google sign in error:', error);
        return { success: false, data: null, error: error.message };
    }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        return { success: true, data, error: null };
    } catch (error) {
        console.error('Reset password error:', error);
        return { success: false, data: null, error: error.message };
    }
};

/**
 * Load User
 */
export const getCurrentUser = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user || null;
    } catch (error) {
        console.error('Get user error:', error);
        return null;
    }
};

/**
 * Get current session
 */
export const getSession = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    } catch (error) {
        console.error('Get session error:', error);
        return null;
    }
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (callback) => {
    return supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
};

/**
 * Get user ID (from auth or device)
 */
export const getUserId = async () => {
    const user = await getCurrentUser();
    if (user) {
        return user.id;
    }
    return getDeviceId();
};


/**
 * Update user metadata
 */
export const updateUser = async (updates) => {
    try {
        const { data, error } = await supabase.auth.updateUser({
            data: updates
        });

        if (error) throw error;
        return { success: true, data, error: null };
    } catch (error) {
        console.error('Update user error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Upload an image to Supabase Storage
 */
export const uploadImage = async (file, fileName) => {
    try {
        if (!file) return null;

        const deviceId = getDeviceId();
        const filePath = `${deviceId}/${fileName}`;

        const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, file, {
                contentType: file.type || 'image/jpeg',
                upsert: true,
            });

        if (error) {
            console.error('Upload error:', error);
            return null;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath);

        return urlData?.publicUrl || null;
    } catch (error) {
        console.error('Error uploading image:', error);
        return null;
    }
};

/**
 * Sync a single analysis to Supabase
 */
export const syncAnalysisToCloud = async (analysis, imageUrl = null) => {
    try {
        const deviceId = getDeviceId();
        // Get user if logged in
        const user = await getCurrentUser();

        const { data, error } = await supabase
            .from('analyses')
            .insert({
                device_id: deviceId,
                severity_level: analysis.severityLevel,
                severity_label: analysis.severityLabel,
                total_spots: analysis.totalSpots || 0,
                inflamed_count: analysis.spots?.inflamed || 0,
                clogged_count: analysis.spots?.clogged || 0,
                scars_count: analysis.spots?.scars || 0,
                local_id: analysis.id,
                ...(imageUrl && { frontal_image_url: imageUrl }),
                ...(analysis.leftImageUrl && { left_image_url: analysis.leftImageUrl }),
                ...(analysis.rightImageUrl && { right_image_url: analysis.rightImageUrl }),
                ...(user && { user_id: user.id })
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error syncing to Supabase:', error);
        return null;
    }
};

/**
 * Get all analyses for this device from Supabase
 */
export const getCloudAnalyses = async () => {
    try {
        const deviceId = getDeviceId();
        const user = await getCurrentUser();

        let query = supabase
            .from('analyses')
            .select('*')
            .order('created_at', { ascending: false });

        if (!user) {
            query = query.eq('device_id', deviceId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching from Supabase:', error);
        return [];
    }
};

/**
 * Get ALL cloud analyses (force fetch, useful for stats)
 */
export const getUserAnalyses = async () => {
    try {
        const user = await getCurrentUser();

        if (!user) return [];

        const { data, error } = await supabase
            .from('analyses')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching user analyses:', error);
        return [];
    }
};

/**
 * Check if Supabase is configured
 */
export const isSupabaseConfigured = () => {
    return !!SUPABASE_URL && !!SUPABASE_ANON_KEY &&
        SUPABASE_URL !== 'your_supabase_url_here' &&
        SUPABASE_ANON_KEY !== 'your_supabase_anon_key_here';
};

const supabaseService = {
    supabase,
    getDeviceId,
    getUserId,
    uploadImage,
    syncAnalysisToCloud,
    getCloudAnalyses,
    getUserAnalyses,
    isSupabaseConfigured,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    getCurrentUser,
    getSession,
    onAuthStateChange,
    updateUser,
};

export default supabaseService;
