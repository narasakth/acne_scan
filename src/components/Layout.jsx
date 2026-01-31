/**
 * Layout.jsx - Main Layout with Sidebar
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            background: '#f8fafc'
        }}>
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main style={{
                flex: 1,
                marginLeft: '220px',
                padding: '32px 40px',
                minHeight: '100vh',
                overflowX: 'hidden',
                boxSizing: 'border-box'
            }}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
