/**
 * CameraPage.jsx - Multi-step Camera Capture & Analysis
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveAnalysis } from '../services/historyService';
import { uploadImage } from '../services/supabaseService';
import { analyzeMultipleImages } from '../services/analysisService';
import { useToast } from '../components/Toast';
import { getLevelColor } from '../utils/helpers';

const CameraPage = () => {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const toast = useToast();

    const [step, setStep] = useState('intro');
    const [images, setImages] = useState({ front: null, left: null, right: null });
    const [previews, setPreviews] = useState({ front: null, left: null, right: null });
    const [stream, setStream] = useState(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        return () => stopCamera();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (stream && videoRef.current && ['capture-front', 'capture-left', 'capture-right'].includes(step)) {
            videoRef.current.srcObject = stream;
        }
    }, [stream, step]);

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
            const analysisResult = await analyzeMultipleImages(allImages.front, allImages.left, allImages.right);
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

    const renderContent = () => {
        if (step === 'intro') {
            return (
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
        }

        if (['capture-front', 'capture-left', 'capture-right'].includes(step)) {
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
        }

        if (step === 'analyzing') {
            return (
                <div className="text-center py-16">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full mx-auto mb-6 animate-spin" />
                    <h2 className="text-2xl font-bold text-gray-900">กำลังวิเคราะห์...</h2>
                    <p className="text-gray-500">กำลังวิเคราะห์ผลลัพธ์จากโมเดล AI...</p>
                </div>
            );
        }

        if (step === 'result' && result) {
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
                    </div>
                    <div className="w-full lg:w-80 flex flex-col gap-4">
                        <h3 className="text-lg font-bold">ภาพที่ใช้</h3>
                        <div className="grid grid-cols-3 lg:grid-cols-2 gap-3">
                            {previews.front && <img src={previews.front} alt="Front" className="w-full rounded-lg" />}
                            {previews.left && <img src={previews.left} alt="Left" className="w-full rounded-lg" />}
                            {previews.right && <img src={previews.right} alt="Right" className="w-full rounded-lg" />}
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
                            <button onClick={() => { setStep('intro'); setImages({}); setPreviews({}); setResult(null); }} className="btn-secondary w-full" disabled={isSaving}>เริ่มใหม่</button>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div>
            <div className="mb-6 flex items-center gap-4">
                <button onClick={() => navigate('/')} className="bg-transparent border-none text-xl cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors">←</button>
                <h1 className="text-2xl sm:text-[28px] font-bold m-0">วิเคราะห์สภาพผิว</h1>
            </div>
            {renderContent()}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default CameraPage;
