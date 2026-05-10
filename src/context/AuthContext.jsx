/**
 * AuthContext.jsx - Authentication context for React
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    supabase,
    signIn as supabaseSignIn,
    signUp as supabaseSignUp,
    signOut as supabaseSignOut,
    signInWithGoogle as supabaseSignInWithGoogle
} from '../services/supabaseService';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);

    useEffect(() => {
        // Check initial session
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
                setUser(session?.user || null);
            } catch (error) {
                console.error('Error checking session:', error);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            setUser(session?.user || null);
            setLoading(false);
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const signIn = async (email, password) => {
        const result = await supabaseSignIn(email, password);
        return result;
    };

    const signUp = async (email, password, displayName) => {
        const result = await supabaseSignUp(email, password, displayName);
        return result;
    };

    const signOut = async () => {
        setLoading(true);
        const result = await supabaseSignOut();
        if (result.success) {
            setUser(null);
            setSession(null);
        }
        setLoading(false);
        return result;
    };

    const signInWithGoogle = async () => {
        const result = await supabaseSignInWithGoogle();
        return result;
    };

    /**
     * Refresh user data from Supabase (used after profile updates)
     */
    const refreshUser = useCallback(async () => {
        try {
            const { data: { user: freshUser } } = await supabase.auth.getUser();
            if (freshUser) {
                setUser(freshUser);
            }
        } catch (error) {
            console.error('Error refreshing user:', error);
        }
    }, []);

    const value = {
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        refreshUser,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
