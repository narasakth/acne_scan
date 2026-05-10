/**
 * StatCard.jsx - Reusable statistics card component
 */

import React from 'react';

const StatCard = ({ icon, label, value, subValue, subColor }) => (
    <div className="bg-white rounded-xl p-6 flex items-center gap-5 shadow-sm border border-gray-200 flex-1 min-w-0">
        <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">
            {icon}
        </div>
        <div className="min-w-0">
            <p className="text-sm text-gray-500">{label}</p>
            <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-gray-900 truncate">{value}</span>
                {subValue && (
                    <span className={`text-base font-semibold flex items-center gap-1 ${subColor || ''}`}>
                        {subValue}
                    </span>
                )}
            </div>
        </div>
    </div>
);

export default StatCard;
