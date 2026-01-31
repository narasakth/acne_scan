/**
 * CameraPage.jsx - Multi-step Camera Capture & Analysis
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveAnalysis } from '../services/historyService';
import { uploadImage } from '../services/supabaseService';
import { analyzeMultipleImages } from '../services/analysisService';

const CameraPage = () => {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // Steps: 'intro', 'capture-front', 'capture-left', 'capture-right', 'analyzing', 'result'
    const [step, setStep] = useState('intro');

    // Images
    const [images, setImages] = useState({
        front: null,
        left: null,
        right: null
    });
    const [previews, setPreviews] = useState({
        front: null,
        left: null,
        right: null
    });

    const [stream, setStream] = useState(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    // Stop camera on unmount
    useEffect(() => {
        return () => stopCamera();
    }, []);

    // Effect to attach stream to video element whenever steps change or stream changes
    useEffect(() => {
        if (stream && videoRef.current && ['capture-front', 'capture-left', 'capture-right'].includes(step)) {
            videoRef.current.srcObject = stream;
        }
    }, [stream, step]);

    const startCamera = async () => {
        try {
            setError('');
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            setStream(mediaStream);
            setStep('capture-front'); // Trigger layout change, which mounts videoRef
        } catch (err) {
            console.error("Camera error:", err);
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

                    // Move to next step
                    if (side === 'front') setStep('capture-left');
                    else if (side === 'left') setStep('capture-right');
                    else if (side === 'right') {
                        // All images captured, now analyze with all 3
                        handleAnalyze({ front: images.front, left: images.left, right: file });
                    }
                }
            }, 'image/jpeg');
        }
    };

    const handleAnalyze = async (allImages) => {
        stopCamera();
        setStep('analyzing');

        try {
            // Send all 3 images for analysis
            const analysisResult = await analyzeMultipleImages(
                allImages.front,
                allImages.left,
                allImages.right
            );
            setResult(analysisResult);
            setStep('result');
        } catch (err) {
            console.error(err);
            setError('เกิดข้อผิดพลาดในการวิเคราะห์');
            setStep('intro');
        }
    };

    const saveResult = async () => {
        try {
            // Upload images
            let frontUrl = null;
            let leftUrl = null;
            let rightUrl = null;

            if (images.front) {
                frontUrl = await uploadImage(images.front, `front_${Date.now()}.jpg`);
            }
            if (images.left) {
                leftUrl = await uploadImage(images.left, `left_${Date.now()}.jpg`);
            }
            if (images.right) {
                rightUrl = await uploadImage(images.right, `right_${Date.now()}.jpg`);
            }

            const analysisWithImages = {
                ...result,
                leftImageUrl: leftUrl,
                rightImageUrl: rightUrl
            };

            await saveAnalysis(analysisWithImages, frontUrl);
            alert('บันทึกผลการวิเคราะห์เรียบร้อย');
            navigate('/history');
        } catch (err) {
            console.error(err);
            alert('บันทึกไม่สำเร็จ');
        }
    };

    const getLevelColor = (level) => {
        const colors = { 1: '#16a34a', 2: '#84cc16', 3: '#eab308', 4: '#f97316', 5: '#dc2626' };
        return colors[level] || '#6b7280';
    };

    const renderContent = () => {
        if (step === 'intro') {
            return (
                <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '16px', maxWidth: '600px', margin: '0 auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: '#eff6ff',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#3b82f6'
                        }}>
                            <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                        </div>
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111', marginBottom: '16px' }}>
                        พร้อมสำหรับการวิเคราะห์ผิวหรือยัง?
                    </h2>
                    <p style={{ color: '#6b7280', fontSize: '16px', lineHeight: '1.6', marginBottom: '32px' }}>
                        เราจะทำการถ่ายภาพใบหน้าของคุณ 3 มุม<br />
                        (หน้าตรง, ด้านซ้าย, ด้านขวา)<br />
                        เพื่อการวิเคราะห์ที่แม่นยำที่สุดด้วย AI
                    </p>
                    <button
                        onClick={startCamera}
                        style={{ padding: '16px 32px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '600', cursor: 'pointer' }}
                    >
                        เริ่มถ่ายภาพ
                    </button>
                    {error && <p style={{ color: '#dc2626', marginTop: '16px' }}>{error}</p>}
                </div>
            );
        }

        if (['capture-front', 'capture-left', 'capture-right'].includes(step)) {
            const currentSide = step.split('-')[1];
            const labels = { front: 'หน้าตรง', left: 'หันหน้าทางซ้าย', right: 'หันหน้าทางขวา' };
            const instructions = {
                front: 'มองตรงไปที่กล้อง',
                left: 'หันหน้าไปทางขวาเล็กน้อย',
                right: 'หันหน้าไปทางซ้ายเล็กน้อย'
            };

            return (
                <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '32px', alignItems: 'center' }}>
                    {/* Left: Camera View */}
                    <div style={{ flex: 1 }}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>ถ่ายภาพ{labels[currentSide]}</h2>
                            <p style={{ color: '#6b7280' }}>{instructions[currentSide]}</p>
                        </div>

                        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: '#000', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                            />

                            {/* Guide Overlay */}
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                width: '280px', height: '380px',
                                border: '2px dashed rgba(255,255,255,0.5)', borderRadius: '150px'
                            }}></div>
                        </div>
                    </div>

                    {/* Right: Controls */}
                    <div style={{ width: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>ขั้นตอน</p>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: step === 'capture-front' ? '#2563eb' : '#e5e7eb' }}></div>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: step === 'capture-left' ? '#2563eb' : '#e5e7eb' }}></div>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: step === 'capture-right' ? '#2563eb' : '#e5e7eb' }}></div>
                            </div>
                        </div>

                        <button
                            onClick={() => takePhoto(currentSide)}
                            style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: '#fff', border: '4px solid #e5e7eb',
                                cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                transition: 'transform 0.1s'
                            }}
                            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <div style={{ width: '60px', height: '60px', background: '#ef4444', borderRadius: '50%', margin: '6px auto' }}></div>
                        </button>
                        <p style={{ marginTop: '12px', fontWeight: '500', color: '#374151' }}>กดเพื่อถ่ายภาพ</p>
                    </div>
                </div>
            );
        }

        if (step === 'analyzing') {
            return (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <div className="spinner" style={{ width: '50px', height: '50px', border: '4px solid #f3f3f3', borderTop: '4px solid #2563eb', borderRadius: '50%', margin: '0 auto 24px', animation: 'spin 1s linear infinite' }}></div>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111' }}>กำลังวิเคราะห์...</h2>
                    <p style={{ color: '#6b7280' }}>กำลังวิเคราะห์ผลลัพธ์จากโมเดล AI...</p>
                </div>
            );
        }

        if (step === 'result' && result) {
            return (
                <div style={{ display: 'flex', gap: '32px' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ background: getLevelColor(result.severityLevel), borderRadius: '16px', padding: '32px', color: '#fff', marginBottom: '24px', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '48px', fontWeight: '800', margin: 0 }}>{result.severityLevel}</h2>
                            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0 0' }}>ระดับ{result.severityLabel}</p>
                        </div>


                    </div>

                    <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>ภาพที่ใช้</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {previews.front && <img src={previews.front} alt="Front" style={{ width: '100%', borderRadius: '8px' }} />}
                            {previews.left && <img src={previews.left} alt="Left" style={{ width: '100%', borderRadius: '8px' }} />}
                            {previews.right && <img src={previews.right} alt="Right" style={{ width: '100%', borderRadius: '8px' }} />}
                        </div>

                        <div style={{ marginTop: 'auto' }}>
                            <button
                                onClick={saveResult}
                                style={{ width: '100%', padding: '16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '12px' }}
                            >
                                บันทึกลง Journal
                            </button>
                            <button
                                onClick={() => { setStep('intro'); setImages({}); setPreviews({}); setResult(null); }}
                                style={{ width: '100%', padding: '16px', background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                เริ่มใหม่
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div>
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>←</button>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>วิเคราะห์สภาพผิว</h1>
            </div>

            {renderContent()}

            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
};

export default CameraPage;
