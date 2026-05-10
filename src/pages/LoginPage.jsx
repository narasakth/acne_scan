/**
 * LoginPage.jsx - Responsive Desktop Login
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resetPassword } from '../services/supabaseService';
import { useToast } from '../components/Toast';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { signIn, signUp, signInWithGoogle } = useAuth();
    const toast = useToast();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const from = location.state?.from?.pathname || '/';

    // Map Supabase error to Thai message
    const getErrorMessage = (error) => {
        if (!error) return 'เกิดข้อผิดพลาด';
        const msg = error.toLowerCase();
        if (msg.includes('invalid login credentials')) return 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง';
        if (msg.includes('email not confirmed')) return 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ';
        if (msg.includes('user already registered')) return 'อีเมลนี้ถูกใช้งานแล้ว';
        if (msg.includes('password')) return 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่';
        if (msg.includes('rate limit')) return 'ลองเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่';
        if (msg.includes('network')) return 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ต';
        return error;
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) return setError('กรุณากรอกข้อมูลให้ครบ');
        if (!validateEmail(email)) return setError('รูปแบบอีเมลไม่ถูกต้อง');

        setSubmitting(true);

        if (isLogin) {
            const result = await signIn(email, password);
            if (result.success) {
                navigate(from, { replace: true });
            } else {
                setError(getErrorMessage(result.error));
                setSubmitting(false);
            }
        } else {
            if (password.length < 6) { setSubmitting(false); return setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); }
            if (password !== confirmPassword) { setSubmitting(false); return setError('รหัสผ่านไม่ตรงกัน'); }

            const result = await signUp(email, password, displayName);
            if (result.success) {
                toast.success('สมัครสำเร็จ! กรุณายืนยันอีเมล');
                setIsLogin(true);
            } else {
                setError(getErrorMessage(result.error));
            }
            setSubmitting(false);
        }
    };

    const handleForgot = async () => {
        if (!email) return setError('กรอกอีเมลก่อน');
        const result = await resetPassword(email);
        if (result.success) toast.success('ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลแล้ว');
        else toast.error('เกิดข้อผิดพลาดในการส่งอีเมล');
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            {/* Left - Branding */}
            <div className="flex-1 bg-gradient-to-br from-blue-600 to-indigo-600 flex flex-col justify-center p-10 sm:p-16 lg:p-20">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                        AC
                    </div>
                    <span className="text-2xl font-bold text-white">AcneScan</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-white leading-tight mb-5">
                    วิเคราะห์สภาพผิว<br />ด้วย AI
                </h1>
                <p className="text-white/80 text-lg leading-relaxed">
                    ติดตามและดูแลสุขภาพผิวของคุณได้ง่ายๆ<br />
                    ด้วยเทคโนโลยี AI วิเคราะห์ภาพใบหน้า
                </p>
            </div>

            {/* Right - Form */}
            <div className="flex-1 flex items-center justify-center p-8 sm:p-16 lg:p-20 bg-white">
                <div className="w-full max-w-[400px]">
                    <h2 className="text-[28px] font-bold text-gray-900 mb-2">
                        {isLogin ? 'เข้าสู่ระบบ' : 'สร้างบัญชีใหม่'}
                    </h2>
                    <p className="text-gray-500 text-[15px] mb-8">
                        {isLogin ? 'ยินดีต้อนรับกลับ!' : 'เริ่มต้นใช้งาน AcneScan'}
                    </p>

                    <form onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div className="mb-5">
                                <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ (ไม่บังคับ)</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="ชื่อของคุณ"
                                    className="w-full py-3.5 px-4 border border-gray-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                />
                            </div>
                        )}

                        <div className="mb-5">
                            <label className="block text-sm font-medium text-gray-700 mb-2">อีเมล</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@email.com"
                                className="w-full py-3.5 px-4 border border-gray-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                            />
                        </div>

                        <div className="mb-5">
                            <label className="block text-sm font-medium text-gray-700 mb-2">รหัสผ่าน</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full py-3.5 px-4 border border-gray-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                            />
                        </div>

                        {!isLogin && (
                            <div className="mb-5">
                                <label className="block text-sm font-medium text-gray-700 mb-2">ยืนยันรหัสผ่าน</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full py-3.5 px-4 border border-gray-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                />
                            </div>
                        )}

                        {isLogin && (
                            <div className="text-right mb-5">
                                <button type="button" onClick={handleForgot} className="bg-transparent border-none text-blue-600 text-sm cursor-pointer hover:underline">
                                    ลืมรหัสผ่าน?
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm mb-5">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3.5 bg-blue-600 text-white border-none rounded-lg text-base font-semibold cursor-pointer mb-4 hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-default"
                        >
                            {submitting ? '...' : (isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก')}
                        </button>

                        <div className="flex items-center gap-4 my-5">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-gray-400 text-sm">หรือ</span>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        <button
                            type="button"
                            onClick={() => signInWithGoogle()}
                            className="w-full py-3 px-4 bg-white text-gray-700 border border-gray-200 rounded-lg text-[15px] font-medium cursor-pointer flex items-center justify-center gap-3 shadow-sm hover:bg-gray-50 transition-colors"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M23.52 12.29c0-.85-.08-1.68-.23-2.48H12v4.7h6.45c-.28 1.48-1.12 2.73-2.39 3.58v2.98h3.87c2.26-2.09 3.57-5.17 3.57-8.78z" fill="#4285F4" />
                                <path d="M12 24c3.24 0 5.97-1.08 7.95-2.91l-3.87-2.98c-1.07.72-2.44 1.15-4.08 1.15-3.13 0-5.77-2.12-6.72-4.96H1.36v3.12C3.33 21.31 7.41 24 12 24z" fill="#34A853" />
                                <path d="M5.28 14.29c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.59H1.36A11.96 11.96 0 000 12c0 1.93.46 3.76 1.36 5.41l3.92-3.12z" fill="#FBBC05" />
                                <path d="M12 4.79c1.76 0 3.35.61 4.59 1.8l3.43-3.44C17.96 1.14 15.24 0 12 0 7.41 0 3.33 2.69 1.36 6.59l3.92 3.12c.95-2.84 3.59-4.96 6.72-4.96z" fill="#EA4335" />
                            </svg>
                            <span>ดำเนินการต่อด้วย Google</span>
                        </button>
                    </form>

                    <p className="text-center mt-6 text-gray-500 text-sm">
                        {isLogin ? 'ยังไม่มีบัญชี?' : 'มีบัญชีแล้ว?'}
                        <button
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            className="bg-transparent border-none text-blue-600 font-semibold cursor-pointer ml-1.5"
                        >
                            {isLogin ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
