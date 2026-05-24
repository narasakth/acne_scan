/**
 * RecommendationPanel.jsx - Treatment Recommendation Panel
 * Displays treatment advice based on AAD Guidelines 2024
 * 
 * Designed as an expandable, visually rich panel that shows:
 * - Treatment medications (topical, oral, procedural)
 * - Skincare routine (morning/evening)
 * - Precautions and warnings
 * - When to see a doctor
 */

import React, { useState, useEffect } from 'react';
import { getRecommendation } from '../services/recommendationService';

const STRENGTH_LABELS = {
    strong: { text: 'แนะนำอย่างยิ่ง', bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
    conditional: { text: 'แนะนำ (ตามกรณี)', bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
    good_practice: { text: 'แนวปฏิบัติที่ดี', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
};

const RecommendationPanel = ({ severityLevel }) => {
    const [recommendation, setRecommendation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('treatment');
    const [routineTab, setRoutineTab] = useState('morning');

    useEffect(() => {
        if (severityLevel >= 1 && severityLevel <= 4) {
            setLoading(true);
            getRecommendation(severityLevel).then(data => {
                setRecommendation(data);
                setLoading(false);
            });
        }
    }, [severityLevel]);

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.loadingSpinner} />
                <p style={styles.loadingText}>กำลังโหลดคำแนะนำ...</p>
            </div>
        );
    }

    if (!recommendation || !recommendation.severity) return null;

    const { severity, general_good_practices, disclaimer } = recommendation;
    const { treatment, skincare_routine, precautions } = severity;

    const sections = [
        { 
            key: 'treatment', 
            label: 'การรักษา', 
            icon: (
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
                    <path d="m8.5 8.5 7 7" />
                </svg>
            )
        },
        { 
            key: 'skincare', 
            label: 'Skincare', 
            icon: (
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M6 3h12a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                    <path d="M19 9v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9" />
                    <path d="M9 13h6" />
                    <path d="M9 17h6" />
                </svg>
            )
        },
        { 
            key: 'precautions', 
            label: 'ข้อควรระวัง', 
            icon: (
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
            )
        },
    ];

    const renderMedCard = (med, index) => {
        const strengthInfo = STRENGTH_LABELS[med.strength] || STRENGTH_LABELS.conditional;
        return (
            <div key={index} style={styles.medCard}>
                <div style={styles.medCardHeader}>
                    <span style={styles.medIcon}>{med.icon || '💊'}</span>
                    <div style={styles.medInfo}>
                        <span style={styles.medName}>{med.name_th || med.name}</span>
                        {med.examples && (
                            <span style={styles.medExamples}>{med.examples}</span>
                        )}
                    </div>
                    <span style={{
                        ...styles.strengthBadge,
                        background: strengthInfo.bg,
                        color: strengthInfo.color,
                        border: `1px solid ${strengthInfo.border}`
                    }}>
                        {strengthInfo.text}
                    </span>
                </div>
                <div style={styles.medUsage}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>{med.usage}</span>
                </div>
                {med.note && (
                    <div style={styles.medNote}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <span>{med.note}</span>
                    </div>
                )}
            </div>
        );
    };

    const renderTreatment = () => (
        <div style={styles.sectionContent}>
            {/* Topical */}
            {treatment.topical && treatment.topical.length > 0 && (
                <div style={styles.treatmentGroup}>
                    <h4 style={styles.treatmentGroupTitle}>
                        <span style={{ ...styles.groupDot, background: '#3b82f6' }} />
                        ยาทาภายนอก (Topical)
                    </h4>
                    {treatment.topical.map((med, i) => renderMedCard(med, `topical-${i}`))}
                </div>
            )}

            {/* Oral */}
            {treatment.oral && treatment.oral.length > 0 && (
                <div style={styles.treatmentGroup}>
                    <h4 style={styles.treatmentGroupTitle}>
                        <span style={{ ...styles.groupDot, background: '#8b5cf6' }} />
                        ยากิน (Oral)
                    </h4>
                    {treatment.oral.map((med, i) => renderMedCard(med, `oral-${i}`))}
                </div>
            )}

            {/* Procedural */}
            {treatment.procedural && treatment.procedural.length > 0 && (
                <div style={styles.treatmentGroup}>
                    <h4 style={styles.treatmentGroupTitle}>
                        <span style={{ ...styles.groupDot, background: '#ec4899' }} />
                        หัตถการ (Procedural)
                    </h4>
                    {treatment.procedural.map((med, i) => renderMedCard(med, `proc-${i}`))}
                </div>
            )}

            {/* Expected duration */}
            {severity.expected_duration && (
                <div style={styles.durationBanner}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    <div>
                        <span style={styles.durationLabel}>ระยะเวลาที่คาดว่าจะเห็นผล</span>
                        <span style={styles.durationValue}>{severity.expected_duration}</span>
                    </div>
                </div>
            )}
        </div>
    );

    const renderSkincare = () => (
        <div style={styles.sectionContent}>
            {/* Routine tab switcher */}
            <div style={styles.routineTabs}>
                <button
                    onClick={() => setRoutineTab('morning')}
                    style={{
                        ...styles.routineTab,
                        ...(routineTab === 'morning' ? styles.routineTabActive : {}),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2" />
                        <path d="M12 20v2" />
                        <path d="m4.93 4.93 1.41 1.41" />
                        <path d="m17.66 17.66 1.41 1.41" />
                        <path d="M2 12h2" />
                        <path d="M20 12h2" />
                        <path d="m6.34 17.66-1.41 1.41" />
                        <path d="m19.07 4.93-1.41 1.41" />
                    </svg>
                    <span>เช้า (Morning)</span>
                </button>
                <button
                    onClick={() => setRoutineTab('evening')}
                    style={{
                        ...styles.routineTab,
                        ...(routineTab === 'evening' ? styles.routineTabActive : {}),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                    </svg>
                    <span>เย็น (Evening)</span>
                </button>
            </div>

            {/* Routine steps */}
            <div style={styles.routineSteps}>
                {skincare_routine[routineTab]?.map((step, i) => (
                    <div key={i} style={styles.routineStep}>
                        <div style={styles.stepNumber}>
                            <span>{step.step}</span>
                        </div>
                        <div style={styles.stepContent}>
                            <span style={styles.stepAction}>{step.action}</span>
                            <span style={styles.stepDetail}>{step.detail}</span>
                        </div>
                        {i < skincare_routine[routineTab].length - 1 && (
                            <div style={styles.stepConnector} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderPrecautions = () => (
        <div style={styles.sectionContent}>
            <div style={styles.precautionsList}>
                {precautions?.map((text, i) => {
                    const isWarning = text.includes('⚠️') || text.includes('🚨');
                    return (
                        <div key={i} style={{
                            ...styles.precautionItem,
                            ...(isWarning ? styles.precautionWarning : {})
                        }}>
                            <span style={styles.precautionBullet}>
                                {isWarning ? '⚠️' : '•'}
                            </span>
                            <span>{text.replace(/^[⚠️🚨]\s*/, '')}</span>
                        </div>
                    );
                })}
            </div>

            {/* When to see doctor */}
            {severity.when_to_see_doctor && (
                <div style={styles.doctorBanner}>
                    <div style={{ ...styles.doctorIcon, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M4.8 2H19.2" />
                            <path d="M3 10a9 9 0 0 0 18 0V4h-8v6a1 1 0 0 1-2 0V4H3v6Z" />
                            <path d="M12 19v3" />
                            <path d="M10 22h4" />
                        </svg>
                    </div>
                    <div>
                        <span style={styles.doctorLabel}>เมื่อไหร่ควรพบแพทย์</span>
                        <span style={styles.doctorText}>{severity.when_to_see_doctor}</span>
                    </div>
                </div>
            )}

            {/* Good practices */}
            {general_good_practices && (
                <div style={styles.goodPractices}>
                    <h4 style={styles.goodPracticesTitle}>หลักปฏิบัติที่ดี (AAD 2024)</h4>
                    {general_good_practices.map((gp, i) => (
                        <div key={i} style={styles.goodPracticeItem}>
                            <span>{gp.icon}</span>
                            <span>{gp.text}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <div style={styles.headerIcon}>
                        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                            <path d="M9 14h6" />
                            <path d="M9 10h6" />
                            <path d="M9 18h6" />
                        </svg>
                    </div>
                    <div>
                        <h3 style={styles.headerTitle}>คำแนะนำการดูแลรักษา</h3>
                        <p style={styles.headerSubtitle}>
                            ระดับ{severity.label_th} — ตาม AAD Guidelines 2024
                        </p>
                    </div>
                </div>
            </div>

            {/* Description */}
            <div style={styles.descriptionBox}>
                <p style={styles.descriptionText}>{severity.description}</p>
            </div>

            {/* Section tabs */}
            <div style={styles.sectionTabs}>
                {sections.map(sec => (
                    <button
                        key={sec.key}
                        onClick={() => setActiveSection(sec.key)}
                        style={{
                            ...styles.sectionTab,
                            ...(activeSection === sec.key ? styles.sectionTabActive : {}),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                    >
                        {sec.icon}
                        <span>{sec.label}</span>
                    </button>
                ))}
            </div>

            {/* Section content */}
            {activeSection === 'treatment' && renderTreatment()}
            {activeSection === 'skincare' && renderSkincare()}
            {activeSection === 'precautions' && renderPrecautions()}

            {/* Disclaimer */}
            <div style={styles.disclaimer}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>{disclaimer}</span>
            </div>
        </div>
    );
};

/* ============================================================
 * Styles
 * ============================================================ */
const styles = {
    container: {
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        marginTop: '16px',
    },

    // Loading
    loadingContainer: {
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e5e7eb',
        padding: '48px',
        textAlign: 'center',
        marginTop: '16px',
    },
    loadingSpinner: {
        width: '32px',
        height: '32px',
        border: '3px solid #e5e7eb',
        borderTop: '3px solid #3b82f6',
        borderRadius: '50%',
        margin: '0 auto 12px',
        animation: 'spin 1s linear infinite',
    },
    loadingText: {
        color: '#6b7280',
        fontSize: '14px',
        margin: 0,
    },

    // Header
    header: {
        padding: '20px 24px',
        borderBottom: '1px solid #f3f4f6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
    },
    headerIcon: {
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#2563eb',
        flexShrink: 0,
    },
    headerTitle: {
        fontSize: '17px',
        fontWeight: '700',
        color: '#111827',
        margin: 0,
    },
    headerSubtitle: {
        fontSize: '13px',
        color: '#6b7280',
        margin: '2px 0 0',
    },

    // Description
    descriptionBox: {
        margin: '0 24px',
        padding: '14px 18px',
        background: '#f8fafc',
        borderRadius: '12px',
        marginTop: '16px',
    },
    descriptionText: {
        fontSize: '14px',
        color: '#475569',
        lineHeight: '1.6',
        margin: 0,
    },

    // Section tabs
    sectionTabs: {
        display: 'flex',
        gap: '4px',
        padding: '4px',
        margin: '16px 24px 0',
        background: '#f1f5f9',
        borderRadius: '12px',
    },
    sectionTab: {
        flex: 1,
        padding: '10px 16px',
        border: 'none',
        borderRadius: '10px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        background: 'transparent',
        color: '#64748b',
    },
    sectionTabActive: {
        background: '#ffffff',
        color: '#1e40af',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },

    // Section content
    sectionContent: {
        padding: '20px 24px',
    },

    // Treatment group
    treatmentGroup: {
        marginBottom: '20px',
    },
    treatmentGroupTitle: {
        fontSize: '14px',
        fontWeight: '700',
        color: '#374151',
        margin: '0 0 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    groupDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        display: 'inline-block',
    },

    // Med card
    medCard: {
        background: '#f9fafb',
        borderRadius: '14px',
        padding: '16px',
        marginBottom: '10px',
        border: '1px solid #f3f4f6',
        transition: 'border-color 0.2s ease',
    },
    medCardHeader: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        marginBottom: '10px',
    },
    medIcon: {
        fontSize: '20px',
        lineHeight: '1',
        marginTop: '2px',
    },
    medInfo: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    medName: {
        fontSize: '14px',
        fontWeight: '700',
        color: '#1f2937',
    },
    medExamples: {
        fontSize: '12px',
        color: '#6b7280',
    },
    strengthBadge: {
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: '600',
        whiteSpace: 'nowrap',
        flexShrink: 0,
    },
    medUsage: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        color: '#6b7280',
        paddingLeft: '32px',
    },
    medNote: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        fontSize: '12px',
        color: '#92400e',
        background: '#fffbeb',
        padding: '8px 12px',
        borderRadius: '8px',
        marginTop: '10px',
        marginLeft: '32px',
    },

    // Duration
    durationBanner: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
        borderRadius: '14px',
        marginTop: '8px',
    },
    durationLabel: {
        display: 'block',
        fontSize: '12px',
        color: '#6b7280',
        fontWeight: '500',
    },
    durationValue: {
        display: 'block',
        fontSize: '15px',
        fontWeight: '700',
        color: '#1e40af',
        marginTop: '2px',
    },

    // Routine tabs
    routineTabs: {
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
    },
    routineTab: {
        flex: 1,
        padding: '12px 16px',
        border: '2px solid #e5e7eb',
        borderRadius: '14px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        background: '#fff',
        color: '#6b7280',
        transition: 'all 0.2s ease',
        textAlign: 'center',
    },
    routineTabActive: {
        borderColor: '#3b82f6',
        color: '#1e40af',
        background: '#eff6ff',
    },

    // Routine steps
    routineSteps: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0px',
    },
    routineStep: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        padding: '16px 0',
        position: 'relative',
    },
    stepNumber: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: '700',
        flexShrink: 0,
        zIndex: 1,
    },
    stepContent: {
        flex: 1,
        paddingTop: '4px',
    },
    stepAction: {
        display: 'block',
        fontSize: '15px',
        fontWeight: '700',
        color: '#1f2937',
    },
    stepDetail: {
        display: 'block',
        fontSize: '13px',
        color: '#6b7280',
        marginTop: '2px',
        lineHeight: '1.5',
    },
    stepConnector: {
        position: 'absolute',
        left: '15px',
        top: '52px',
        width: '2px',
        height: 'calc(100% - 36px)',
        background: '#e5e7eb',
    },

    // Precautions
    precautionsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '20px',
    },
    precautionItem: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 16px',
        background: '#f9fafb',
        borderRadius: '12px',
        fontSize: '14px',
        color: '#374151',
        lineHeight: '1.5',
    },
    precautionWarning: {
        background: '#fffbeb',
        border: '1px solid #fde68a',
    },
    precautionBullet: {
        fontSize: '14px',
        flexShrink: 0,
        marginTop: '1px',
    },

    // Doctor banner
    doctorBanner: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '18px 20px',
        background: 'linear-gradient(135deg, #fef3c7 0%, #fff7ed 100%)',
        borderRadius: '14px',
        marginBottom: '20px',
        border: '1px solid #fde68a',
    },
    doctorIcon: {
        fontSize: '28px',
        flexShrink: 0,
    },
    doctorLabel: {
        display: 'block',
        fontSize: '12px',
        color: '#92400e',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    doctorText: {
        display: 'block',
        fontSize: '14px',
        color: '#78350f',
        fontWeight: '600',
        marginTop: '2px',
    },

    // Good practices
    goodPractices: {
        background: '#f0fdf4',
        borderRadius: '14px',
        padding: '18px 20px',
        border: '1px solid #bbf7d0',
    },
    goodPracticesTitle: {
        fontSize: '14px',
        fontWeight: '700',
        color: '#15803d',
        margin: '0 0 12px',
    },
    goodPracticeItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        color: '#166534',
        padding: '6px 0',
    },

    // Disclaimer
    disclaimer: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        padding: '14px 24px',
        borderTop: '1px solid #f3f4f6',
        fontSize: '11px',
        color: '#9ca3af',
        lineHeight: '1.5',
        background: '#fafafa',
    },
};

export default RecommendationPanel;
