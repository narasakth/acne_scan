/**
 * historyService.js - Local storage for analysis history (Web version)
 * Uses localStorage instead of AsyncStorage
 */

import { syncAnalysisToCloud, isSupabaseConfigured, getUserId, getUserAnalyses } from './supabaseService';
import { supabase } from './supabaseService';

const HISTORY_KEY_PREFIX = 'acnescan_history_';
const MAX_HISTORY_ITEMS = 50;

/**
 * Get user-specific history key
 */
const getHistoryKey = async () => {
    const userId = await getUserId();
    return `${HISTORY_KEY_PREFIX}${userId}`;
};

/**
 * Save a new analysis result to history
 */
export const saveAnalysis = async (analysisResult, imageUrl = null) => {
    try {
        const history = await getHistory();

        const newEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            severityLevel: analysisResult.severityLevel,
            severityLabel: analysisResult.severityLabel,
            spots: analysisResult.spots,
            totalSpots: analysisResult.totalSpots,
            imageUrl: imageUrl || null,
            leftImageUrl: analysisResult.leftImageUrl || null,
            rightImageUrl: analysisResult.rightImageUrl || null,
            synced: false,
        };

        // Add new entry at the beginning
        history.unshift(newEntry);

        // Keep only the last MAX_HISTORY_ITEMS
        if (history.length > MAX_HISTORY_ITEMS) {
            history.splice(MAX_HISTORY_ITEMS);
        }

        const historyKey = await getHistoryKey();
        localStorage.setItem(historyKey, JSON.stringify(history));

        // Sync to cloud if configured
        if (isSupabaseConfigured()) {
            try {
                await syncAnalysisToCloud(newEntry, imageUrl);
                history[0].synced = true;
                localStorage.setItem(historyKey, JSON.stringify(history));
            } catch (syncError) {
                console.warn('Cloud sync failed, will retry later:', syncError);
            }
        }

        return true;
    } catch (error) {
        console.error('Error saving analysis:', error);
        return false;
    }
};


/**
 * Get all analysis history
 * Returns local data immediately (optimistic), triggers background sync if needed
 */
export const getHistory = async () => {
    try {
        const historyKey = await getHistoryKey();
        const historyJson = localStorage.getItem(historyKey);

        let localHistory = historyJson ? JSON.parse(historyJson) : [];

        // Check if we should background sync
        const { data: { session } } = await supabase.auth.getSession();

        // If logged in and we haven't synced recently (or explicit sync requested)
        // We trigger sync in background without awaiting, unless local is empty
        if (session) {
            if (localHistory.length === 0) {
                // If local empty, we MUST await cloud data
                return await syncHistoryWithCloud();
            } else {
                // If we have local data, return it immediately for speed
                // And trigger sync in background
                syncHistoryWithCloud().catch(err => console.error('Background sync error:', err));
            }
        }

        return localHistory;
    } catch (error) {
        console.error('Error getting history:', error);
        return [];
    }
};

/**
 * Explicitly sync history with cloud
 * Returns the updated history
 */
export const syncHistoryWithCloud = async () => {
    try {
        const historyKey = await getHistoryKey();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) return [];

        const cloudData = await getUserAnalyses();
        let localHistory = [];

        if (cloudData && cloudData.length > 0) {
            // Map cloud data to local format
            const cloudHistory = cloudData.map(item => ({
                id: item.local_id || item.id.toString(),
                date: item.created_at,
                severityLevel: item.severity_level,
                severityLabel: item.severity_label,
                totalSpots: item.total_spots,
                spots: {
                    inflamed: item.inflamed_count,
                    clogged: item.clogged_count,
                    scars: item.scars_count
                },
                imageUrl: item.frontal_image_url,
                leftImageUrl: item.left_image_url,
                rightImageUrl: item.right_image_url,
                synced: true
            }));

            // Update local history
            localHistory = cloudHistory;
            localStorage.setItem(historyKey, JSON.stringify(localHistory));
        }

        return localHistory;
    } catch (error) {
        console.error('Sync error:', error);
        // Fallback to local if sync fails
        const historyKey = await getHistoryKey();
        const historyJson = localStorage.getItem(historyKey);
        return historyJson ? JSON.parse(historyJson) : [];
    }
};

/**
 * Get recent analyses (last N items)
 */
export const getRecentAnalyses = async (count = 5) => {
    try {
        const history = await getHistory();
        return history.slice(0, count);
    } catch (error) {
        console.error('Error getting recent analyses:', error);
        return [];
    }
};

/**
 * Get a single analysis by ID
 */
export const getAnalysisById = async (id) => {
    try {
        const history = await getHistory();
        return history.find(item => item.id === id) || null;
    } catch (error) {
        console.error('Error getting analysis:', error);
        return null;
    }
};

/**
 * Delete an analysis by ID
 */
export const deleteAnalysis = async (id) => {
    try {
        const history = await getHistory();
        const filteredHistory = history.filter(item => item.id !== id);
        const historyKey = await getHistoryKey();
        localStorage.setItem(historyKey, JSON.stringify(filteredHistory));
        return true;
    } catch (error) {
        console.error('Error deleting analysis:', error);
        return false;
    }
};

/**
 * Clear all history
 */
export const clearHistory = async () => {
    try {
        const historyKey = await getHistoryKey();
        localStorage.removeItem(historyKey);
        return true;
    } catch (error) {
        console.error('Error clearing history:', error);
        return false;
    }
};

/**
 * Get statistics summary
 */
export const getStatistics = async (providedHistory = null) => {
    try {
        let history = providedHistory;

        // If history not provided, try to fetch
        if (!history) {
            // Try to get FULL cloud history if logged in for accurate stats
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                const cloudData = await getUserAnalyses();
                if (cloudData && cloudData.length > 0) {
                    history = cloudData.map(item => ({
                        severityLevel: item.severity_level,
                        date: item.created_at
                    }));
                } else {
                    history = await getHistory();
                }
            } else {
                history = await getHistory();
            }
        }

        if (history.length === 0) {
            return {
                totalScans: 0,
                averageLevel: 0,
                trend: 'neutral',
                lastScanDate: null,
            };
        }

        const totalScans = history.length;
        const averageLevel = history.reduce((sum, item) => sum + item.severityLevel, 0) / totalScans;

        // Calculate trend based on last 5 vs previous 5
        let trend = 'neutral';
        if (history.length >= 2) {
            // Sort by date desc
            const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
            const recent = sorted.slice(0, Math.min(5, sorted.length));
            const older = sorted.slice(Math.min(5, sorted.length), Math.min(10, sorted.length));

            if (older.length > 0) {
                const recentAvg = recent.reduce((sum, item) => sum + item.severityLevel, 0) / recent.length;
                const olderAvg = older.reduce((sum, item) => sum + item.severityLevel, 0) / older.length;

                if (recentAvg < olderAvg - 0.3) {
                    trend = 'improving'; // Lower is better
                } else if (recentAvg > olderAvg + 0.3) {
                    trend = 'worsening'; // Higher is worse
                }
            }
        }

        return {
            totalScans,
            averageLevel: Math.round(averageLevel * 10) / 10,
            trend,
            lastScanDate: history[0]?.date || null,
        };
    } catch (error) {
        console.error('Error getting statistics:', error);
        return {
            totalScans: 0,
            averageLevel: 0,
            trend: 'neutral',
            lastScanDate: null,
        };
    }
};

/**
 * Format date for display
 */
export const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    let relative;
    if (diffDays === 0) {
        relative = 'วันนี้';
    } else if (diffDays === 1) {
        relative = 'เมื่อวาน';
    } else if (diffDays < 7) {
        relative = `${diffDays} วันที่แล้ว`;
    } else {
        relative = date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    return {
        date: date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        relative,
    };
};

const historyService = {
    saveAnalysis,
    getHistory,
    getRecentAnalyses,
    getAnalysisById,
    deleteAnalysis,
    clearHistory,
    getStatistics,
    formatDate,
};

export default historyService;
