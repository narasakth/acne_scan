/**
 * LoginPage.jsx - Clean Desktop Login
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resetPassword } from '../services/supabaseService';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { signIn, signUp, signInWithGoogle, loading } = useAuth();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) return setError('กรุณากรอกข้อมูลให้ครบ');

        if (isLogin) {
            const result = await signIn(email, password);
            if (result.success) navigate(from, { replace: true });
            else setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        } else {
            if (password !== confirmPassword) return setError('รหัสผ่านไม่ตรงกัน');
            if (password.length < 6) return setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัว');

            const result = await signUp(email, password, displayName);
            if (result.success) {
                alert('สมัครสำเร็จ! กรุณายืนยันอีเมล');
                setIsLogin(true);
            } else setError(result.error || 'เกิดข้อผิดพลาด');
        }
    };

    const handleForgot = async () => {
        if (!email) return setError('กรอกอีเมลก่อน');
        const result = await resetPassword(email);
        if (result.success) alert('ส่งลิงก์ไปยังอีเมลแล้ว');
        else setError('เกิดข้อผิดพลาด');
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex' }}>
            {/* Left - Branding */}
            <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '80px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
                    <div style={{ width: '50px', height: '50px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '20px' }}>
                        AC
                    </div>
                    <span style={{ fontSize: '24px', fontWeight: '700', color: '#fff' }}>AcneScan</span>
                </div>
                <h1 style={{ fontSize: '40px', fontWeight: '700', color: '#fff', margin: '0 0 20px', lineHeight: 1.3 }}>
                    วิเคราะห์สภาพผิว<br />ด้วย AI
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '18px', lineHeight: 1.6 }}>
                    ติดตามและดูแลสุขภาพผิวของคุณได้ง่ายๆ<br />
                    ด้วยเทคโนโลยี AI วิเคราะห์ภาพใบหน้า
                </p>
            </div>

            {/* Right - Form */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', background: '#fff' }}>
                <div style={{ width: '100%', maxWidth: '400px' }}>
                    <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#111', margin: '0 0 8px' }}>
                        {isLogin ? 'เข้าสู่ระบบ' : 'สร้างบัญชีใหม่'}
                    </h2>
                    <p style={{ color: '#6b7280', fontSize: '15px', margin: '0 0 32px' }}>
                        {isLogin ? 'ยินดีต้อนรับกลับ!' : 'เริ่มต้นใช้งาน AcneScan'}
                    </p>

                    <form onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>ชื่อ (ไม่บังคับ)</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="ชื่อของคุณ"
                                    style={{ width: '100%', padding: '14px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }}
                                />
                            </div>
                        )}

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>อีเมล</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@email.com"
                                style={{ width: '100%', padding: '14px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>รหัสผ่าน</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{ width: '100%', padding: '14px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }}
                            />
                        </div>

                        {!isLogin && (
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>ยืนยันรหัสผ่าน</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={{ width: '100%', padding: '14px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }}
                                />
                            </div>
                        )}

                        {isLogin && (
                            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                                <button type="button" onClick={handleForgot} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '14px', cursor: 'pointer' }}>
                                    ลืมรหัสผ่าน?
                                </button>
                            </div>
                        )}

                        {error && (
                            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', color: '#dc2626', fontSize: '14px', marginBottom: '20px' }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: loading ? '#9ca3af' : '#2563eb',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: loading ? 'default' : 'pointer',
                                marginBottom: '16px'
                            }}
                        >
                            {loading ? '...' : (isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก')}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '20px 0' }}>
                            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                            <span style={{ color: '#9ca3af', fontSize: '14px' }}>หรือ</span>
                            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                        </div>

                        <button
                            type="button"
                            onClick={() => signInWithGoogle()}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: '#fff',
                                color: '#374151',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '15px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                transition: 'all 0.2s',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
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

                    <p style={{ textAlign: 'center', marginTop: '24px', color: '#6b7280', fontSize: '14px' }}>
                        {isLogin ? 'ยังไม่มีบัญชี?' : 'มีบัญชีแล้ว?'}
                        <button
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '600', cursor: 'pointer', marginLeft: '6px' }}
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
