/**
 * ProfilePage.jsx - Profile with responsive layout
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHistory, getStatistics } from '../services/historyService';
import { resetPassword, updateUser } from '../services/supabaseService';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

const ProfilePage = () => {
    const navigate = useNavigate();
    const { user, signOut, refreshUser } = useAuth();
    const toast = useToast();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState('');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        loadData();
        if (user?.user_metadata?.display_name) {
            setNewName(user.user_metadata.display_name);
        }
    }, [user]);

    const loadData = async () => {
        try {
            const history = await getHistory();
            setStats(await getStatistics(history));
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setShowLogoutConfirm(false);
        await signOut();
        navigate('/login');
    };

    const handleResetPassword = async () => {
        if (user?.email) {
            const result = await resetPassword(user.email);
            if (result.success) toast.success('ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลแล้ว');
            else toast.error('เกิดข้อผิดพลาดในการส่งอีเมล');
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const result = await updateUser({ display_name: newName });
            if (result.success) {
                toast.success('อัปเดตข้อมูลสำเร็จ');
                setIsEditing(false);
                await refreshUser();
            } else {
                toast.error('เกิดข้อผิดพลาด: ' + result.error);
            }
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการอัปเดต');
        }
    };

    const settingsItems = [
        {
            icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
            label: 'แก้ไขโปรไฟล์',
            desc: 'เปลี่ยนชื่อและข้อมูลส่วนตัว',
            action: () => setIsEditing(true)
        },
        {
            icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
            label: 'เปลี่ยนรหัสผ่าน',
            desc: 'รีเซ็ตรหัสผ่านทางอีเมล',
            action: handleResetPassword
        },
        {
            icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
            label: 'การแจ้งเตือน',
            desc: 'จัดการการแจ้งเตือน',
            action: () => toast.info('ฟีเจอร์นี้กำลังพัฒนา')
        },
        {
            icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
            label: 'ความเป็นส่วนตัว',
            desc: 'ตั้งค่าความเป็นส่วนตัว',
            action: () => toast.info('ฟีเจอร์นี้กำลังพัฒนา')
        },
        {
            icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            label: 'ช่วยเหลือ',
            desc: 'คำถามที่พบบ่อย',
            action: () => toast.info('ฟีเจอร์นี้กำลังพัฒนา')
        },
        {
            icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            label: 'เกี่ยวกับ',
            desc: 'เวอร์ชัน 1.0.0',
            action: () => toast.info('AcneScan v1.0.0')
        },
    ];

    return (
        <div>
            <div className="mb-8 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                    <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <h1 className="text-2xl sm:text-[28px] font-bold text-gray-900 m-0">โปรไฟล์และการตั้งค่า</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,350px)_1fr] gap-6 items-start">
                {/* Left Column - Profile & Stats */}
                <div className="flex flex-col gap-6">
                    {/* User Card */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                        <div className="flex items-center gap-5 mb-8">
                            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-medium flex-shrink-0">
                                {user?.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-lg text-gray-900 truncate">
                                    {user?.user_metadata?.display_name || 'ผู้ใช้งาน'}
                                </p>
                                <p className="text-gray-500 text-sm mt-1 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className="w-full py-3 rounded-lg border border-red-200 bg-red-50 text-red-500 font-medium text-sm cursor-pointer flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                        >
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            ออกจากระบบ
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                        <h3 className="text-base font-bold text-gray-900 mb-5">สถิติ</h3>
                        <div className="border-b border-gray-100 pb-4 mb-4 flex justify-between items-center">
                            <span className="text-gray-500 text-sm">การสแกน</span>
                            <span className="font-semibold text-gray-900 text-base">{loading ? '-' : stats?.totalScans || 0}</span>
                        </div>
                        <div className="border-b border-gray-100 pb-4 mb-4 flex justify-between items-center">
                            <span className="text-gray-500 text-sm">ค่าเฉลี่ย</span>
                            <span className="font-semibold text-gray-900 text-base">{loading ? '-' : stats?.averageLevel?.toFixed(1) || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">แนวโน้ม</span>
                            <span className={`font-semibold text-sm ${stats?.trend === 'worsening' ? 'text-red-600' : stats?.trend === 'improving' ? 'text-green-600' : 'text-yellow-600'}`}>
                                {stats?.trend === 'worsening' ? 'แย่ลง' : stats?.trend === 'improving' ? 'ดีขึ้น' : 'คงที่'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Column - Settings */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-base font-bold text-gray-900">การตั้งค่า</h2>
                    </div>
                    {settingsItems.map((item, i) => (
                        <button
                            key={i}
                            onClick={item.action}
                            className={`w-full px-6 py-5 flex items-center gap-5 bg-transparent border-none cursor-pointer text-left hover:bg-gray-50 transition-colors ${i < settingsItems.length - 1 ? 'border-b border-gray-100' : ''}`}
                        >
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
                                {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-700 text-[15px]">{item.label}</p>
                                <p className="text-gray-400 text-[13px] mt-0.5">{item.desc}</p>
                            </div>
                            <svg width="20" height="20" fill="none" stroke="#9ca3af" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    ))}
                </div>
            </div>

            {/* Logout Confirmation */}
            <ConfirmModal
                isOpen={showLogoutConfirm}
                title="ออกจากระบบ"
                message="ต้องการออกจากระบบหรือไม่?"
                confirmText="ออกจากระบบ"
                danger
                onConfirm={handleLogout}
                onCancel={() => setShowLogoutConfirm(false)}
            />

            {/* Edit Profile Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl animate-fadeIn">
                        <h3 className="text-xl font-bold mb-6 text-gray-900">แก้ไขข้อมูลส่วนตัว</h3>
                        <form onSubmit={handleUpdateProfile}>
                            <div className="mb-5">
                                <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อที่แสดง (Display Name)</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full py-2.5 px-3 rounded-lg border border-gray-300 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                    placeholder="ใส่ชื่อที่ต้องการ"
                                />
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="py-2.5 px-5 rounded-lg border border-gray-300 bg-white text-gray-700 cursor-pointer font-medium hover:bg-gray-50 transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="py-2.5 px-5 rounded-lg border-none bg-blue-600 text-white cursor-pointer font-medium hover:bg-blue-700 transition-colors"
                                >
                                    บันทึก
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
