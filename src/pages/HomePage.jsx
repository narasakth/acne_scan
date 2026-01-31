/**
 * HomePage.jsx - Dashboard with Sidebar Layout
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRecentAnalyses, getStatistics, getHistory } from '../services/historyService';

const HomePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState({ totalScans: 0, trend: 'neutral', averageLevel: 0 });
    const [recentScans, setRecentScans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const recentAnalysis = await getRecentAnalyses(5);
            const history = await getHistory(); // Get full history for accurate stats
            const statistics = await getStatistics(history);

            setStats(statistics);
            setRecentScans(recentAnalysis);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTrend = () => {
        if (stats.trend === 'improving') return { text: 'ดีขึ้น', color: '#16a34a', icon: <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> };
        if (stats.trend === 'worsening') return { text: 'แย่ลง', color: '#dc2626', icon: <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg> };
        return { text: 'คงที่', color: '#ca8a04', icon: <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14" /></svg> };
    };

    const trend = getTrend();

    const StatCard = ({ icon, label, value, subValue, subColor }) => (
        <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            border: '1px solid #e5e7eb',
            flex: 1
        }}>
            <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6'
            }}>
                {icon}
            </div>
            <div>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{label}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '32px', fontWeight: '700', color: '#111' }}>{value}</span>
                    {subValue && (
                        <span style={{ fontSize: '16px', fontWeight: '600', color: subColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {subValue} <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: 'rotate(-45deg)' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '30px', fontWeight: '800', color: '#111', margin: 0 }}>
                    สวัสดี, {user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'คุณ'}
                </h1>
                <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '16px' }}>
                    ยินดีต้อนรับกลับสู่ AcneScan
                </p>
            </div>

            {/* Stats & Action Row */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '40px' }}>
                <StatCard
                    icon={<svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    label="การสแกนทั้งหมด"
                    value={loading ? '...' : stats.totalScans}
                />
                <StatCard
                    icon={<svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    label="ค่าเฉลี่ยระดับ"
                    value={loading ? '...' : (stats.averageLevel?.toFixed(1) || '0')}
                />
                <StatCard
                    icon={<svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                    label="แนวโน้ม"
                    value={loading ? '...' : trend.text}
                    subValue={!loading && trend.text}
                    subColor={trend.color}
                />

                {/* Action Button */}
                <button
                    onClick={() => navigate('/camera')}
                    style={{
                        background: '#3b82f6',
                        borderRadius: '12px',
                        padding: '24px 32px',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        minWidth: '220px',
                        boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)'
                    }}
                >
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', margin: 0 }}>เริ่มต้น</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <p style={{ fontSize: '24px', fontWeight: '700', color: '#fff', margin: '4px 0 0' }}>
                            วิเคราะห์ใหม่
                        </p>
                        <span style={{ color: '#fff', fontSize: '24px', marginTop: '4px' }}>→</span>
                    </div>
                </button>
            </div>

            {/* Content Grid */}
            <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
                {/* History Table */}
                <div style={{
                    flex: 2,
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '32px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    border: '1px solid #e5e7eb'
                }}>
                    <div style={{
                        marginBottom: '24px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>
                            ประวัติล่าสุด
                        </h2>
                        <button
                            onClick={() => navigate('/history')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#3b82f6',
                                fontSize: '15px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            ดูทั้งหมด →
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
                            กำลังโหลด...
                        </div>
                    ) : recentScans.length > 0 ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <th style={{ padding: '16px 0', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>ระดับ</th>
                                    <th style={{ padding: '16px 0', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>วันที่</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentScans.map((scan, i) => (
                                    <tr key={i} style={{ borderBottom: i < recentScans.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                                        <td style={{ padding: '24px 0' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                background: scan.severityLevel <= 2 ? '#dcfce7' : scan.severityLevel <= 3 ? '#fef3c7' : '#fee2e2',
                                                color: scan.severityLevel <= 2 ? '#166534' : scan.severityLevel <= 3 ? '#92400e' : '#991b1b',
                                                padding: '6px 16px',
                                                borderRadius: '20px',
                                                fontSize: '14px',
                                                fontWeight: '600'
                                            }}>
                                                ระดับ {scan.severityLevel}
                                            </span>
                                        </td>
                                        <td style={{ padding: '24px 0', color: '#6b7280', fontSize: '15px' }}>
                                            {new Date(scan.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                            <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '15px' }}>
                                ยังไม่มีประวัติการวิเคราะห์
                            </p>
                            <button
                                onClick={() => navigate('/camera')}
                                style={{
                                    background: '#2563eb',
                                    color: '#fff',
                                    padding: '12px 24px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                เริ่มวิเคราะห์
                            </button>
                        </div>
                    )}
                </div>

                {/* Tips Card */}
                <div style={{
                    width: '320px',
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '32px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    border: '1px solid #e5e7eb'
                }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: '0 0 24px' }}>
                        เคล็ดลับดูแลผิว
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {[
                            'ดื่มน้ำ 8 แก้ว/วัน',
                            'นอน 7-8 ชม.',
                            'ล้างหน้า 2 ครั้ง/วัน',
                            'ใช้ครีมกันแดด',
                            'อย่าแตะหน้าบ่อย'
                        ].map((tip, i) => (
                            <li key={i} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '20px',
                                fontSize: '15px',
                                color: '#111',
                                fontWeight: '500'
                            }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }}></span>
                                <span>{tip}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
