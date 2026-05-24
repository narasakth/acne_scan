/**
 * HomePage.jsx - Dashboard with responsive layout
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHistory, getStatistics } from '../services/historyService';
import StatCard from '../components/StatCard';
import { getTrendInfo, getSeverityBadge } from '../utils/helpers';

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
            // Single call to getHistory() — avoids duplicate API calls
            const history = await getHistory();
            const statistics = await getStatistics(history);

            setStats(statistics);
            setRecentScans(history.slice(0, 5));
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const trend = getTrendInfo(stats.trend);

    return (
        <div>
            {/* Header */}
            <div className="mb-8 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                    <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                </div>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 m-0">
                        สวัสดี, {user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'คุณ'}
                    </h1>
                    <p className="text-gray-500 mt-1 text-base m-0">
                        ยินดีต้อนรับกลับสู่ AcneScan
                    </p>
                </div>
            </div>

            {/* Stats & Action Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10">
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
                    subValue={!loading ? trend.text : undefined}
                    subColor={trend.color}
                />

                {/* Action Button */}
                <button
                    onClick={() => navigate('/camera')}
                    className="bg-blue-500 rounded-xl p-6 border-none cursor-pointer text-left flex flex-col justify-center shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-colors"
                >
                    <p className="text-sm text-white/90 m-0">เริ่มต้น</p>
                    <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-white mt-1 mb-0">
                            วิเคราะห์ใหม่
                        </p>
                        <span className="text-white text-2xl mt-1">→</span>
                    </div>
                </button>
            </div>

            {/* Content Grid */}
            <div className="flex flex-col xl:flex-row gap-6 xl:gap-8 items-start">
                {/* History Table */}
                <div className="flex-[2] min-w-0 w-full bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
                    <div className="mb-6 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900">
                            ประวัติล่าสุด
                        </h2>
                        <button
                            onClick={() => navigate('/history')}
                            className="bg-transparent border-none text-blue-500 text-[15px] font-semibold cursor-pointer flex items-center gap-1 hover:underline"
                        >
                            ดูทั้งหมด →
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-16 text-center text-gray-500">
                            กำลังโหลด...
                        </div>
                    ) : recentScans.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="py-4 text-left text-sm font-medium text-gray-500">ระดับ</th>
                                        <th className="py-4 text-left text-sm font-medium text-gray-500">วันที่</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentScans.map((scan, i) => (
                                        <tr key={i} className={i < recentScans.length - 1 ? 'border-b border-gray-100' : ''}>
                                            <td className="py-6">
                                                <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${getSeverityBadge(scan.severityLevel)}`}>
                                                    ระดับ {scan.severityLevel}
                                                </span>
                                            </td>
                                            <td className="py-6 text-gray-500 text-[15px]">
                                                {new Date(scan.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-16 text-center">
                            <p className="text-gray-500 mb-5 text-[15px]">
                                ยังไม่มีประวัติการวิเคราะห์
                            </p>
                            <button
                                onClick={() => navigate('/camera')}
                                className="bg-blue-600 text-white py-3 px-6 rounded-xl border-none text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors"
                            >
                                เริ่มวิเคราะห์
                            </button>
                        </div>
                    )}
                </div>

                {/* Tips Card */}
                <div className="w-full xl:w-80 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">
                        เคล็ดลับดูแลผิว
                    </h3>
                    <ul className="list-none p-0 m-0">
                        {[
                            'ดื่มน้ำ 8 แก้ว/วัน',
                            'นอน 7-8 ชม.',
                            'ล้างหน้า 2 ครั้ง/วัน',
                            'ใช้ครีมกันแดด',
                            'อย่าแตะหน้าบ่อย'
                        ].map((tip, i) => (
                            <li key={i} className="flex items-center gap-3 mb-5 text-[15px] text-gray-900 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
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
