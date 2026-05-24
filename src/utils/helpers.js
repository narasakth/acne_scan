/**
 * helpers.js - Shared utility functions
 */

import React from 'react';

/**
 * Get trend information based on statistics
 * @param {string} trend - 'improving' | 'worsening' | 'neutral'
 * @returns {{ text: string, color: string, icon: JSX.Element }}
 */
export const getTrendInfo = (trend) => {
    if (trend === 'improving') {
        return {
            text: 'ดีขึ้น',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            icon: (
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ),
        };
    }
    if (trend === 'worsening') {
        return {
            text: 'แย่ลง',
            color: 'text-red-600',
            bgColor: 'bg-red-50',
            icon: (
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
            ),
        };
    }
    return {
        text: 'คงที่',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        icon: (
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14" />
            </svg>
        ),
    };
};

/**
 * Get severity level color classes
 * @param {number} level - Severity level (1-5)
 * @returns {{ bg: string, text: string, hex: string }}
 */
export const getLevelColor = (level) => {
    const colors = {
        1: { bg: 'bg-green-50 text-green-700 border border-green-200', text: 'text-green-800', hex: '#10b981' }, // Mild (เล็กน้อย)
        2: { bg: 'bg-yellow-50 text-yellow-700 border border-yellow-200', text: 'text-yellow-800', hex: '#eab308' }, // Moderate (ปานกลาง)
        3: { bg: 'bg-orange-50 text-orange-700 border border-orange-200', text: 'text-orange-800', hex: '#f97316' }, // Severe (รุนแรง)
        4: { bg: 'bg-red-50 text-red-700 border border-red-200', text: 'text-red-800', hex: '#ef4444' }, // Very Severe (รุนแรงมาก)
    };
    return colors[level] || { bg: 'bg-gray-50 text-gray-700 border border-gray-200', text: 'text-gray-800', hex: '#6b7280' };
};

/**
 * Get severity badge classes
 * @param {number} level
 * @returns {string} Tailwind classes for the badge
 */
export const getSeverityBadge = (level) => {
    if (level === 1) return 'bg-green-100 text-green-800 border border-green-200';
    if (level === 2) return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    if (level === 3) return 'bg-orange-100 text-orange-800 border border-orange-200';
    return 'bg-red-100 text-red-800 border border-red-200';
};
