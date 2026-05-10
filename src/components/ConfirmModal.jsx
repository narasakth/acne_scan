/**
 * ConfirmModal.jsx - Confirmation dialog (replaces window.confirm())
 */

import React from 'react';

const ConfirmModal = ({
    isOpen,
    title = 'ยืนยัน',
    message = 'คุณแน่ใจหรือไม่?',
    confirmText = 'ยืนยัน',
    cancelText = 'ยกเลิก',
    danger = false,
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4"
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-100' : 'bg-blue-100'}`}>
                    {danger ? (
                        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                </div>

                <h3 className="text-lg font-bold text-gray-900 text-center mb-2">{title}</h3>
                <p className="text-gray-500 text-sm text-center mb-6">{message}</p>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-2.5 rounded-xl border-none text-white font-medium text-sm transition-colors ${danger
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
