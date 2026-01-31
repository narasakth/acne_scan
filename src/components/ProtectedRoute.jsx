/**
 * ProtectedRoute.jsx - Protects routes that require authentication
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8fafc'
            }}>
                <div style={{ fontSize: '16px', color: '#6b7280' }}>กำลังโหลด...</div>
            </div>
        );
    }

    if (!user) {
        // Redirect to login page but save the current location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
