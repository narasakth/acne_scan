/**
 * HistoryPage.jsx - History with Sidebar Layout
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory, getStatistics, formatDate, deleteAnalysis } from '../services/historyService';

const HistoryPage = () => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [stats, setStats] = useState({ totalScans: 0, averageLevel: 0, trend: 'neutral' });
    const [search, setSearch] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const history = await getHistory();
            const statistics = await getStatistics(history);
            setData(history.map(item => ({ ...item, formattedDate: formatDate(item.date) })));
            setStats(statistics);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (item) => {
        if (window.confirm('ลบรายการนี้?')) {
            await deleteAnalysis(item.id);
            setData(prev => prev.filter(h => h.id !== item.id));
        }
    };

    const filtered = data.filter(item => {
        if (!search) return true;
        return item.formattedDate?.date?.includes(search) || `ระดับ ${item.severityLevel}`.includes(search);
    });

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
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111', margin: 0 }}>ประวัติการวิเคราะห์</h1>
                    <p style={{ color: '#6b7280', marginTop: '8px', fontSize: '15px' }}>ดูและจัดการผลการวิเคราะห์ทั้งหมด</p>
                </div>
                <button
                    onClick={() => navigate('/camera')}
                    style={{ background: '#3b82f6', color: '#fff', padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    วิเคราะห์ใหม่
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '40px' }}>
                <StatCard
                    icon={<svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    label="การสแกนทั้งหมด"
                    value={stats.totalScans}
                />
                <StatCard
                    icon={<svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} // Target/Average icon
                    label="ค่าเฉลี่ย"
                    value={stats.averageLevel?.toFixed(1) || '-'}
                />
                <StatCard
                    icon={<svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} // Trend/Pulse icon
                    label="แนวโน้ม"
                    value={trend.text}
                    subValue={trend.text}
                    subColor={trend.color}
                />
            </div>

            {/* Table */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', padding: '24px' }}>
                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', color: '#111', fontSize: '18px' }}>รายการทั้งหมด ({filtered.length})</span>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <input
                            type="text"
                            placeholder="ค้นหา..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ padding: '10px 16px 10px 40px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', width: '250px', background: '#f9fafb' }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>กำลังโหลด...</div>
                ) : filtered.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <th style={{ padding: '16px 0', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>ระดับ</th>
                                <th style={{ padding: '16px 0', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>วันที่</th>
                                <th style={{ padding: '16px 0', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>เวลา</th>
                                <th style={{ padding: '16px 0', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>เวลา</th>
                                <th style={{ padding: '16px 0', textAlign: 'right', fontSize: '14px', fontWeight: '500', color: '#6b7280' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((item, i) => (
                                <tr
                                    key={item.id}
                                    onClick={() => setSelectedItem(item)}
                                    style={{
                                        borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '24px 0' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            background: item.severityLevel <= 2 ? '#dcfce7' : item.severityLevel <= 3 ? '#fef3c7' : '#fee2e2',
                                            color: item.severityLevel <= 2 ? '#166534' : item.severityLevel <= 3 ? '#92400e' : '#991b1b',
                                            padding: '6px 16px',
                                            borderRadius: '20px',
                                            fontSize: '14px',
                                            fontWeight: '600'
                                        }}>
                                            ระดับ {item.severityLevel}
                                        </span>
                                    </td>
                                    <td style={{ padding: '24px 0', color: '#6b7280', fontSize: '15px' }}>{item.formattedDate?.date || '-'}</td>
                                    <td style={{ padding: '24px 0', color: '#6b7280', fontSize: '15px' }}>{item.formattedDate?.time || '-'}</td>

                                    <td style={{ padding: '24px 0', textAlign: 'right' }}>
                                        <button onClick={() => handleDelete(item)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}>
                                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280', fontSize: '15px' }}>
                        ไม่พบข้อมูล
                    </div>
                )}
            </div>


            {/* Detail Modal */}
            {
                selectedItem && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', zIndex: 50,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
                    }} onClick={() => setSelectedItem(null)}>
                        <div style={{
                            background: '#fff', borderRadius: '24px', padding: '32px',
                            width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto',
                            position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                        }} onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setSelectedItem(null)}
                                style={{
                                    position: 'absolute', top: '24px', right: '24px',
                                    background: '#f3f4f6', border: 'none', borderRadius: '50%',
                                    width: '36px', height: '36px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280'
                                }}
                            >✕</button>

                            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <span style={{
                                    background: selectedItem.severityLevel <= 2 ? '#dcfce7' : selectedItem.severityLevel <= 3 ? '#fef3c7' : '#fee2e2',
                                    color: selectedItem.severityLevel <= 2 ? '#166534' : selectedItem.severityLevel <= 3 ? '#92400e' : '#991b1b',
                                    padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '700'
                                }}>
                                    ระดับ {selectedItem.severityLevel}
                                </span>
                                <div>
                                    <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>ผลการวิเคราะห์</h2>
                                    <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0' }}>{selectedItem.formattedDate?.date} เวลา {selectedItem.formattedDate?.time}</p>
                                </div>
                            </div>

                            {/* Images Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                                {[
                                    { src: selectedItem.imageUrl, label: 'หน้าตรง' },
                                    { src: selectedItem.leftImageUrl, label: 'ด้านซ้าย' },
                                    { src: selectedItem.rightImageUrl, label: 'ด้านขวา' }
                                ].map((img, i) => (
                                    <div key={i} style={{ textAlign: 'center' }}>
                                        <div style={{
                                            width: '100%', aspectRatio: '3/4', background: '#f9fafb',
                                            borderRadius: '12px', overflow: 'hidden', marginBottom: '8px',
                                            border: '1px solid #e5e7eb'
                                        }}>
                                            {img.src ? (
                                                <img src={img.src} alt={img.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '14px' }}>ไม่มีภาพ</div>
                                            )}
                                        </div>
                                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#4b5563' }}>{img.label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Details Stats */}

                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default HistoryPage;
