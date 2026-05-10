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
        1: { bg: 'bg-green-100', text: 'text-green-800', hex: '#16a34a' },
        2: { bg: 'bg-lime-100', text: 'text-lime-800', hex: '#84cc16' },
        3: { bg: 'bg-yellow-100', text: 'text-yellow-800', hex: '#eab308' },
        4: { bg: 'bg-orange-100', text: 'text-orange-800', hex: '#f97316' },
        5: { bg: 'bg-red-100', text: 'text-red-800', hex: '#dc2626' },
    };
    return colors[level] || { bg: 'bg-gray-100', text: 'text-gray-800', hex: '#6b7280' };
};

/**
 * Get severity badge classes
 * @param {number} level
 * @returns {string} Tailwind classes for the badge
 */
export const getSeverityBadge = (level) => {
    if (level <= 2) return 'bg-green-100 text-green-800';
    if (level <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
};
