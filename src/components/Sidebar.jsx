/**
 * Sidebar.jsx - Responsive Left Navigation Sidebar
 * Desktop: Fixed sidebar | Mobile: Slide-in overlay
 */

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './ConfirmModal';

const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

    const isActive = (path) => location.pathname === path;

    const handleLogout = async () => {
        setShowLogoutConfirm(false);
        await signOut();
        navigate('/login');
    };

    const handleNavClick = () => {
        // Close sidebar on mobile after navigation
        if (onClose) onClose();
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
        <>
            {/* Mobile overlay backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed left-0 top-0 bottom-0 z-50
                w-60 bg-white border-r border-gray-200
                flex flex-col p-6
                transition-transform duration-300 ease-in-out
                lg:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo */}
                <Link
                    to="/"
                    onClick={handleNavClick}
                    className="flex items-center gap-3 no-underline mb-10 px-2"
                >
                    <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        AC
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                        AcneScan
                    </span>
                </Link>

                {/* Navigation */}
                <nav className="flex-1">
                    {menuItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={handleNavClick}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-lg no-underline mb-1
                                    text-[15px] transition-all duration-200
                                    ${active
                                        ? 'text-blue-600 bg-blue-50 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50 font-normal'
                                    }
                                `}
                            >
                                <span className="flex">{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-transparent border-none text-red-500 text-[15px] cursor-pointer w-full text-left mt-auto hover:bg-red-50 transition-colors"
                >
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    ออกจากระบบ
                </button>
            </aside>

            {/* Logout Confirmation Modal */}
            <ConfirmModal
                isOpen={showLogoutConfirm}
                title="ออกจากระบบ"
                message="ต้องการออกจากระบบหรือไม่?"
                confirmText="ออกจากระบบ"
                danger
                onConfirm={handleLogout}
                onCancel={() => setShowLogoutConfirm(false)}
            />
        </>
    );
};

export default Sidebar;
