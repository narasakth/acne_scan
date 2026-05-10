/**
 * Layout.jsx - Responsive Main Layout with Sidebar
 * Desktop: Fixed sidebar + offset content | Mobile: Hamburger toggle
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <main className="flex-1 lg:ml-60 min-h-screen overflow-x-hidden">
                {/* Mobile Header */}
                <div className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label="Open menu"
                    >
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-xs">
                            AC
                        </div>
                        <span className="font-bold text-gray-900">AcneScan</span>
                    </div>
                </div>

                {/* Page Content */}
                <div className="p-4 sm:p-6 lg:p-8 xl:px-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
