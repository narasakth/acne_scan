/**
 * AuthContext.jsx - Authentication context for React
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
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
            console.log('Auth event:', event);
            setSession(session);
            setUser(session?.user || null);
            setLoading(false);
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const signIn = async (email, password) => {
        setLoading(true);
        const result = await supabaseSignIn(email, password);
        setLoading(false);
        return result;
    };

    const signUp = async (email, password, displayName) => {
        setLoading(true);
        const result = await supabaseSignUp(email, password, displayName);
        setLoading(false);
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
        setLoading(true);
        const result = await supabaseSignInWithGoogle();
        setLoading(false);
        return result;
    };

    const value = {
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
