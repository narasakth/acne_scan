/**
 * CameraPage.jsx - Multi-step Camera Capture & Zone Analysis
 * 
 * Flow: intro → capture-front → capture-left → capture-right 
 *       → zone-processing → zone-preview → analyzing → result
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveAnalysis } from '../services/historyService';
import { uploadImage } from '../services/supabaseService';
import { analyzeMultipleImages } from '../services/analysisService';
import { processAllAngles, drawOverlay, ZONES, initFaceMesh } from '../services/faceZoneService';
import { useToast } from '../components/Toast';
import { getLevelColor } from '../utils/helpers';
import RecommendationPanel from '../components/RecommendationPanel';

const ImageWithDetections = ({ src, alt, detections }) => {
    const [imgSize, setImgSize] = useState({ width: 0, height: 0 });

    const handleImageLoad = (e) => {
        setImgSize({
            width: e.target.naturalWidth,
            height: e.target.naturalHeight
        });
    };

    return (
        <div className="relative w-full rounded-lg overflow-hidden border border-gray-100 bg-black">
            <img 
                src={src} 
                alt={alt} 
                className="w-full block object-cover" 
                onLoad={handleImageLoad}
            />
            {imgSize.width > 0 && detections && detections.map((det, i) => {
                const left = (det.xmin / imgSize.width) * 100;
                const top = (det.ymin / imgSize.height) * 100;
                const width = ((det.xmax - det.xmin) / imgSize.width) * 100;
                const height = ((det.ymax - det.ymin) / imgSize.height) * 100;

                return (
                    <div 
                        key={i}
                        className="absolute border border-[#FF3B30] rounded-[1px] pointer-events-none"
                        style={{
                            left: `${left}%`,
                            top: `${top}%`,
                            width: `${width}%`,
                            height: `${height}%`,
                            boxShadow: '0 0 0 1px rgba(255, 59, 48, 0.2)'
                        }}
                    />
                );
            })}
        </div>
    );
};

const CameraPage = () => {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const overlayRef = useRef(null);
    const imgRef = useRef(null);
    const toast = useToast();

    const [step, setStep] = useState('intro');
    const [images, setImages] = useState({ front: null, left: null, right: null });
    const [previews, setPreviews] = useState({ front: null, left: null, right: null });
    const [stream, setStream] = useState(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Zone preview state
    const [zoneResults, setZoneResults] = useState(null); // { front: {...}, left: {...}, right: {...} }
    const [activeTab, setActiveTab] = useState('front');
    const [zoneProgress, setZoneProgress] = useState('');

    // Pre-initialize FaceMesh when the page loads
    useEffect(() => {
        initFaceMesh().catch(err => console.warn('FaceMesh pre-init failed:', err));
    }, []);

    useEffect(() => {
        return () => stopCamera();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (stream && videoRef.current && ['capture-front', 'capture-left', 'capture-right'].includes(step)) {
            videoRef.current.srcObject = stream;
        }
    }, [stream, step]);

    // Draw overlay when active tab changes or zone results are ready
    const drawCurrentOverlay = useCallback(() => {
        if (!zoneResults || !zoneResults[activeTab] || !overlayRef.current || !imgRef.current) return;

        const data = zoneResults[activeTab];
        const rect = imgRef.current.getBoundingClientRect();

        drawOverlay(
            overlayRef.current,
            data.landmarks,
            data.width,
            data.height,
            rect.width,
            rect.height
        );
    }, [zoneResults, activeTab]);

    useEffect(() => {
        if (step === 'zone-preview') {
            // Small delay to ensure DOM is rendered
            const timer = setTimeout(drawCurrentOverlay, 100);
            return () => clearTimeout(timer);
        }
    }, [step, activeTab, zoneResults, drawCurrentOverlay]);

    // Redraw overlay on window resize
    useEffect(() => {
        if (step !== 'zone-preview') return;
        const handleResize = () => drawCurrentOverlay();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [step, drawCurrentOverlay]);

    const startCamera = async () => {
        try {
            setError('');
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            setStream(mediaStream);
            setStep('capture-front');
        } catch (err) {
            setError("ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบสิทธิ์การใช้งาน");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const takePhoto = (side) => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `${side}.jpg`, { type: "image/jpeg" });
                    const previewUrl = URL.createObjectURL(blob);
                    setImages(prev => ({ ...prev, [side]: file }));
                    setPreviews(prev => ({ ...prev, [side]: previewUrl }));

                    if (side === 'front') setStep('capture-left');
                    else if (side === 'left') setStep('capture-right');
                    else if (side === 'right') {
                        // All photos taken — process zones
                        stopCamera();
                        handleZoneProcessing({
                            front: previews.front,
                            left: previews.left,
                            right: previewUrl
                        });
                    }
                }
            }, 'image/jpeg');
        }
    };

    const handleZoneProcessing = async (previewUrls) => {
        setStep('zone-processing');
        setZoneProgress('กำลังโหลด MediaPipe Face Mesh...');

        try {
            await initFaceMesh();
            setZoneProgress('กำลังวิเคราะห์โซนใบหน้า...');

            const results = await processAllAngles(previewUrls);
            setZoneResults(results);

            // Find first tab with results
            const firstValid = ['front', 'left', 'right'].find(k => results[k]);
            setActiveTab(firstValid || 'front');
            setStep('zone-preview');
        } catch (err) {
            console.error('Zone processing error:', err);
            toast.error('ไม่สามารถวิเคราะห์โซนใบหน้าได้');
            // Fall back to direct analysis
            handleAnalyze({ front: images.front, left: images.left, right: images.right });
        }
    };

    const handleAnalyze = async (allImages) => {
        setStep('analyzing');
        try {
            const analysisResult = await analyzeMultipleImages(allImages.front, allImages.left, allImages.right);

            // Attach zone data to the result so it can be saved & displayed later
            if (zoneResults) {
                analysisResult.zoneData = {};
                ['front', 'left', 'right'].forEach(angle => {
                    if (zoneResults[angle]) {
                        analysisResult.zoneData[angle] = zoneResults[angle].zones;
                    }
                });
            }

            setResult(analysisResult);
            setStep('result');
        } catch (err) {
            toast.error('เกิดข้อผิดพลาดในการวิเคราะห์');
            setStep('intro');
        }
    };

    const saveResult = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            let frontUrl = null, leftUrl = null, rightUrl = null;
            if (images.front) frontUrl = await uploadImage(images.front, `front_${Date.now()}.jpg`);
            if (images.left) leftUrl = await uploadImage(images.left, `left_${Date.now()}.jpg`);
            if (images.right) rightUrl = await uploadImage(images.right, `right_${Date.now()}.jpg`);

            const analysisWithImages = { ...result, leftImageUrl: leftUrl, rightImageUrl: rightUrl };
            await saveAnalysis(analysisWithImages, frontUrl);
            toast.success('บันทึกผลการวิเคราะห์เรียบร้อย');
            navigate('/history');
        } catch (err) {
            toast.error('บันทึกไม่สำเร็จ');
        } finally {
            setIsSaving(false);
        }
    };

    const resetAll = () => {
        setStep('intro');
        setImages({ front: null, left: null, right: null });
        setPreviews({ front: null, left: null, right: null });
        setResult(null);
        setZoneResults(null);
        setActiveTab('front');
    };

    /* ============================================================
     * Render helpers
     * ============================================================ */

    const renderIntro = () => (
        <div className="text-center p-8 sm:p-10 bg-white rounded-2xl max-w-xl mx-auto shadow-lg animate-fadeIn">
            <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                    <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">พร้อมสำหรับการวิเคราะห์ผิวหรือยัง?</h2>
            <p className="text-gray-500 text-base leading-relaxed mb-8">
                เราจะทำการถ่ายภาพใบหน้าของคุณ 3 มุม<br />
                (หน้าตรง, ด้านซ้าย, ด้านขวา)<br />
                เพื่อการวิเคราะห์ที่แม่นยำที่สุดด้วย AI
            </p>
            <button onClick={startCamera} className="btn-primary text-lg px-8">เริ่มถ่ายภาพ</button>
            {error && <p className="text-red-600 mt-4">{error}</p>}
        </div>
    );

    const renderCapture = () => {
        const currentSide = step.split('-')[1];
        const labels = { front: 'หน้าตรง', left: 'หันหน้าทางซ้าย', right: 'หันหน้าทางขวา' };
        const instructions = { front: 'มองตรงไปที่กล้อง', left: 'หันหน้าไปทางขวาเล็กน้อย', right: 'หันหน้าไปทางซ้ายเล็กน้อย' };

        return (
            <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-8 items-center">
                <div className="flex-1 w-full">
                    <div className="text-center mb-5">
                        <h2 className="text-2xl font-bold">ถ่ายภาพ{labels[currentSide]}</h2>
                        <p className="text-gray-500">{instructions[currentSide]}</p>
                    </div>
                    <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden mb-6">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[380px] border-2 border-dashed border-white/50 rounded-[150px]" />
                    </div>
                </div>
                <div className="w-48 flex flex-col items-center justify-center">
                    <div className="mb-6 text-center">
                        <p className="text-sm text-gray-500 mb-2">ขั้นตอน</p>
                        <div className="flex gap-2 justify-center">
                            {['capture-front', 'capture-left', 'capture-right'].map(s => (
                                <div key={s} className={`w-3 h-3 rounded-full ${step === s ? 'bg-blue-600' : 'bg-gray-200'}`} />
                            ))}
                        </div>
                    </div>
                    <button onClick={() => takePhoto(currentSide)} className="w-20 h-20 rounded-full bg-white border-4 border-gray-200 cursor-pointer shadow-lg active:scale-95 transition-transform">
                        <div className="w-[60px] h-[60px] bg-red-500 rounded-full mx-auto" />
                    </button>
                    <p className="mt-3 font-medium text-gray-700">กดเพื่อถ่ายภาพ</p>
                </div>
            </div>
        );
    };

    const renderZoneProcessing = () => (
        <div className="text-center py-16 animate-fadeIn">
            <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-blue-500 zone-processing-dot" />
                <div className="w-3 h-3 rounded-full bg-blue-500 zone-processing-dot" />
                <div className="w-3 h-3 rounded-full bg-blue-500 zone-processing-dot" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">กำลังประมวลผลโซนใบหน้า</h2>
            <p className="text-gray-500">{zoneProgress}</p>
        </div>
    );

    const renderZonePreview = () => {
        if (!zoneResults) return null;

        const tabLabels = { front: 'หน้าตรง', left: 'ด้านซ้าย', right: 'ด้านขวา' };
        const currentData = zoneResults[activeTab];

        return (
            <div className="animate-fadeIn">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">ผลการแบ่งโซนใบหน้า</h2>
                        <p className="text-gray-500 text-sm">ตรวจสอบโซนที่ตัดแบ่งแล้วก่อนส่งวิเคราะห์ AI</p>
                    </div>
                    <div className="zone-legend">
                        {ZONES.map(z => (
                            <span key={z.key} className="zone-chip">
                                <span className="zone-chip-dot" style={{ background: z.stroke }} />
                                {z.label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Tab Bar */}
                <div className="zone-tabs mb-6">
                    {['front', 'left', 'right'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`zone-tab ${activeTab === tab ? 'active' : ''}`}
                            disabled={!zoneResults[tab]}
                        >
                            {tabLabels[tab]}
                            {!zoneResults[tab] && ' ✗'}
                        </button>
                    ))}
                </div>

                {currentData ? (
                    <div className="flex flex-col xl:flex-row gap-6">
                        {/* Source image with overlay */}
                        <div className="xl:w-[400px] flex-shrink-0">
                            <div className="zone-overlay-container w-full">
                                <img
                                    ref={imgRef}
                                    src={previews[activeTab]}
                                    alt={tabLabels[activeTab]}
                                    onLoad={drawCurrentOverlay}
                                />
                                <canvas ref={overlayRef} />
                            </div>
                        </div>

                        {/* Zone cards grid */}
                        <div className="flex-1 min-w-0">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4" key={activeTab}>
                                {currentData.zones.map(zone => (
                                    <div key={zone.key} className="zone-card">
                                        <img
                                            src={zone.dataUrl}
                                            alt={zone.label}
                                            className="zone-card-image"
                                        />
                                        <div className="zone-card-label">
                                            <span className="zone-card-dot" style={{ background: zone.color }} />
                                            {zone.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                        <p className="text-gray-500">ไม่พบใบหน้าในภาพ{tabLabels[activeTab]}</p>
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-4 mt-8 justify-center">
                    <button onClick={resetAll} className="btn-secondary px-8">
                        ถ่ายใหม่
                    </button>
                    <button
                        onClick={() => handleAnalyze({ front: images.front, left: images.left, right: images.right })}
                        className="btn-primary px-8 flex items-center gap-2"
                    >
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ยืนยัน & วิเคราะห์ด้วย AI
                    </button>
                </div>
            </div>
        );
    };

    const renderAnalyzing = () => (
        <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full mx-auto mb-6 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900">กำลังวิเคราะห์...</h2>
            <p className="text-gray-500">กำลังวิเคราะห์ผลลัพธ์จากโมเดล AI...</p>
        </div>
    );

    const renderResult = () => {
        if (!result) return null;
        const levelColor = getLevelColor(result.severityLevel);

        return (
            <div className="flex flex-col lg:flex-row gap-8 animate-fadeIn">
                <div className="flex-1">
                    <div className="rounded-2xl p-8 text-white mb-6 text-center" style={{ background: levelColor.hex }}>
                        <h2 className="text-5xl font-extrabold m-0">{result.severityLevel}</h2>
                        <p className="text-2xl font-bold mt-2">ระดับ{result.severityLabel}</p>
                    </div>
                    {/* Spots Detail */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">รายละเอียด</h3>
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                            <span className="text-gray-700 font-medium">จำนวนจุดสิวที่พบ</span>
                            <span className="text-3xl font-bold text-blue-600">{result.totalSpots} <span className="text-base font-normal text-gray-500">จุด</span></span>
                        </div>
                    </div>

                    {/* Zone Results in Result */}
                    {zoneResults && (
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 mt-4">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">โซนใบหน้าที่วิเคราะห์</h3>
                            <div className="zone-tabs mb-4">
                                {['front', 'left', 'right'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`zone-tab ${activeTab === tab ? 'active' : ''}`}
                                        disabled={!zoneResults[tab]}
                                    >
                                        {{ front: 'หน้าตรง', left: 'ด้านซ้าย', right: 'ด้านขวา' }[tab]}
                                    </button>
                                ))}
                            </div>
                            {zoneResults[activeTab] && (
                                <div className="grid grid-cols-5 gap-2">
                                    {zoneResults[activeTab].zones.map(zone => (
                                        <div key={zone.key} className="text-center">
                                            <img
                                                src={zone.dataUrl}
                                                alt={zone.label}
                                                className="w-full rounded-lg border border-gray-100"
                                                style={{ aspectRatio: '1/1', objectFit: 'cover' }}
                                            />
                                            <p className="text-xs text-gray-600 mt-1 font-medium">{zone.label}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Treatment Recommendations */}
                    <RecommendationPanel severityLevel={result.severityLevel} />
                </div>
                <div className="w-full lg:w-80 flex flex-col gap-4">
                    <h3 className="text-lg font-bold">ภาพที่ใช้ (พบสิว {result.totalSpots} จุด)</h3>
                    <div className="grid grid-cols-3 lg:grid-cols-2 gap-3">
                        {previews.front && (
                            <ImageWithDetections 
                                src={previews.front} 
                                alt="Front" 
                                detections={result.detections?.front} 
                            />
                        )}
                        {previews.left && (
                            <ImageWithDetections 
                                src={previews.left} 
                                alt="Left" 
                                detections={result.detections?.left} 
                            />
                        )}
                        {previews.right && (
                            <ImageWithDetections 
                                src={previews.right} 
                                alt="Right" 
                                detections={result.detections?.right} 
                            />
                        )}
                    </div>
                    <div className="mt-auto flex flex-col gap-3">
                        <button onClick={saveResult} disabled={isSaving} className={`btn-primary w-full ${isSaving ? 'opacity-70 cursor-not-allowed flex justify-center items-center gap-2' : ''}`}>
                            {isSaving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    กำลังบันทึก...
                                </>
                            ) : 'บันทึกลง Journal'}
                        </button>
                        <button onClick={resetAll} className="btn-secondary w-full" disabled={isSaving}>เริ่มใหม่</button>
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (step) {
            case 'intro':
                return renderIntro();
            case 'capture-front':
            case 'capture-left':
            case 'capture-right':
                return renderCapture();
            case 'zone-processing':
                return renderZoneProcessing();
            case 'zone-preview':
                return renderZonePreview();
            case 'analyzing':
                return renderAnalyzing();
            case 'result':
                return renderResult();
            default:
                return null;
        }
    };

    return (
        <div>
            <div className="mb-6 flex items-center gap-4">
                <button onClick={() => navigate('/')} className="bg-transparent border-none text-xl cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors">←</button>
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                    <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <h1 className="text-2xl sm:text-[28px] font-bold m-0">วิเคราะห์สภาพผิว</h1>
            </div>
            {renderContent()}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default CameraPage;
