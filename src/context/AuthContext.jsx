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
        let isMounted = true;

        // Listen for auth changes
        // In Supabase v2, this immediately fires the callback with event 'INITIAL_SESSION'
        // and the current session, so we don't need a redundant getSession() call.
        // This avoids the concurrent Web Locks deadlock in React 18 Strict Mode.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (isMounted) {
                console.log(`Auth event: ${event}`);
                setSession(session);
                setUser(session?.user || null);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
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
