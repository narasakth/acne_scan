/**
 * ProfilePage.jsx - Profile with Sidebar Layout
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHistory, getStatistics } from '../services/historyService';
import { resetPassword, updateUser } from '../services/supabaseService';

const ProfilePage = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState('');

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
        if (window.confirm('ออกจากระบบ?')) {
            await signOut();

            window.location.href = '/login'; // Force reload to ensure clean auth state
        }
    };

    const handleResetPassword = async () => {
        if (user?.email) {
            const result = await resetPassword(user.email);
            alert(result.success ? 'ส่งลิงก์ไปยังอีเมลแล้ว' : 'เกิดข้อผิดพลาด');
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const result = await updateUser({ display_name: newName });
            if (result.success) {
                alert('อัปเดตข้อมูลสำเร็จ');
                setIsEditing(false);
                // Force reload or update context would be better, but simple refresh works for now
                window.location.reload();
            } else {
                alert('เกิดข้อผิดพลาด: ' + result.error);
            }
        } catch (error) {
            console.error('Update error:', error);
            alert('เกิดข้อผิดพลาดในการอัปเดต');
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
        // ... (other items same as before)
        {
            icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
            label: 'การแจ้งเตือน',
            desc: 'จัดการการแจ้งเตือน',
            action: () => { }
        },
        {
            icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
            label: 'ความเป็นส่วนตัว',
            desc: 'ตั้งค่าความเป็นส่วนตัว',
            action: () => { }
        },
        {
            icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            label: 'ช่วยเหลือ',
            desc: 'คำถามที่พบบ่อย',
            action: () => { }
        },
        {
            icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            label: 'เกี่ยวกับ',
            desc: 'เวอร์ชัน 1.0.0',
            action: () => { }
        },
    ];

    return (
        <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111', margin: '0 0 32px' }}>โปรไฟล์และการตั้งค่า</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 350px) 1fr', gap: '24px', alignItems: 'start' }}>
                {/* Left Column - Profile & Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* User Card */}
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: '#2563eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: '24px',
                                fontWeight: '500'
                            }}>
                                {user?.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                                <p style={{ fontWeight: '700', fontSize: '18px', color: '#111', margin: 0 }}>
                                    {user?.user_metadata?.display_name || 'ผู้ใช้งาน'}
                                </p>
                                <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0' }}>{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #fee2e2',
                                background: '#fef2f2',
                                color: '#ef4444',
                                fontWeight: '500',
                                fontSize: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            ออกจากระบบ
                        </button>
                    </div>

                    {/* Stats */}
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 20px' }}>สถิติ</h3>
                        <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#6b7280', fontSize: '14px' }}>การสแกน</span>
                            <span style={{ fontWeight: '600', color: '#111', fontSize: '16px' }}>{loading ? '-' : stats?.totalScans || 0}</span>
                        </div>
                        <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#6b7280', fontSize: '14px' }}>ค่าเฉลี่ย</span>
                            <span style={{ fontWeight: '600', color: '#111', fontSize: '16px' }}>{loading ? '-' : stats?.averageLevel?.toFixed(1) || 0}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#6b7280', fontSize: '14px' }}>แนวโน้ม</span>
                            <span style={{ fontWeight: '600', color: stats?.trend !== 'worsening' ? '#16a34a' : '#dc2626', fontSize: '14px' }}>
                                {stats?.trend === 'worsening' ? 'แย่ลง' : 'ดีขึ้น'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Column - Settings */}
                <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: 0 }}>การตั้งค่า</h2>
                    </div>
                    {settingsItems.map((item, i) => (
                        <button
                            key={i}
                            onClick={item.action}
                            style={{
                                width: '100%',
                                padding: '20px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: i < settingsItems.length - 1 ? '1px solid #f3f4f6' : 'none',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                background: '#f3f4f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#6b7280'
                            }}>
                                {item.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: '600', color: '#374151', margin: 0, fontSize: '15px' }}>{item.label}</p>
                                <p style={{ color: '#9ca3af', fontSize: '13px', margin: '2px 0 0' }}>{item.desc}</p>
                            </div>
                            <svg width="20" height="20" fill="none" stroke="#9ca3af" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    ))}
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditing && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '32px',
                        width: '90%',
                        maxWidth: '400px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', color: '#111' }}>แก้ไขข้อมูลส่วนตัว</h3>
                        <form onSubmit={handleUpdateProfile}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>ชื่อที่แสดง (Display Name)</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '15px'
                                    }}
                                    placeholder="ใส่ชื่อที่ต้องการ"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        background: '#fff',
                                        color: '#374151',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: '#2563eb',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
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
