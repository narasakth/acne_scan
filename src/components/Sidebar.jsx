/**
 * Sidebar.jsx - Left Navigation Sidebar
 */

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut } = useAuth();

    const isActive = (path) => location.pathname === path;

    const handleLogout = async () => {
        if (window.confirm('ต้องการออกจากระบบหรือไม่?')) {

            await signOut();
            window.location.href = '/login';
        }
    };

    const menuItems = [
        {
            path: '/',
            label: 'หน้าแรก',
            icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        },
        {
            path: '/camera',
            label: 'วิเคราะห์',
            icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        },
        {
            path: '/history',
            label: 'ประวัติ',
            icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        },
        {
            path: '/profile',
            label: 'โปรไฟล์',
            icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        },
    ];

    return (
        <aside style={{
            width: '240px',
            minHeight: '100vh',
            background: '#fff',
            borderRight: '1px solid #e5e7eb',
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 50
        }}>
            {/* Logo */}
            <Link to="/" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textDecoration: 'none',
                marginBottom: '40px',
                padding: '0 8px'
            }}>
                <div style={{
                    width: '36px',
                    height: '36px',
                    background: '#2563eb',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '14px'
                }}>
                    AC
                </div>
                <span style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#111'
                }}>
                    AcneScan
                </span>
            </Link>

            {/* Navigation */}
            <nav style={{ flex: 1 }}>
                {menuItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                color: active ? '#2563eb' : '#4b5563',
                                marginBottom: '4px',
                                background: active ? '#eff6ff' : 'transparent',
                                fontWeight: active ? '500' : '400',
                                fontSize: '15px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <span style={{ display: 'flex' }}>{item.icon}</span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <button
                onClick={handleLogout}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '15px',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    marginTop: 'auto'
                }}
            >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                ออกจากระบบ
            </button>
        </aside>
    );
};

export default Sidebar;
