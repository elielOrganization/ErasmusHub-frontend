"use client";
import { useEffect, useState } from 'react';

export default function Modal({ open, onClose, children }: {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
}) {
    const [mounted, setMounted] = useState(false);
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (open) {
            setMounted(true);
            // Double rAF: first frame mounts at start state, second frame triggers transition
            const id = requestAnimationFrame(() =>
                requestAnimationFrame(() => setShow(true))
            );
            return () => cancelAnimationFrame(id);
        } else {
            setShow(false);
            const tid = setTimeout(() => setMounted(false), 200);
            return () => clearTimeout(tid);
        }
    }, [open]);

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />
            <div
                className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 transition-all duration-200 ${show ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
            >
                {children}
            </div>
        </div>
    );
}
