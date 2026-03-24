"use client"
import { useEffect, useState, useRef } from 'react';
import { usePathname } from '@/i18n/routing';
import { useRoleTheme } from '@/hooks/useRoleTheme';

export default function NavigationProgress() {
    const pathname = usePathname();
    const theme = useRoleTheme();
    const [isNavigating, setIsNavigating] = useState(false);
    const [progress, setProgress] = useState(0);
    const prevPathname = useRef(pathname);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (pathname !== prevPathname.current) {
            setProgress(100);
            setTimeout(() => {
                setIsNavigating(false);
                setProgress(0);
            }, 300);
            prevPathname.current = pathname;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }
    }, [pathname]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const anchor = (e.target as HTMLElement).closest('a');
            if (!anchor) return;
            const href = anchor.getAttribute('href');
            if (!href || href.startsWith('http') || href.startsWith('#')) return;
            setIsNavigating(true);
            setProgress(20);
            intervalRef.current = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) return prev;
                    return prev + Math.random() * 15;
                });
            }, 200);
        };

        document.addEventListener('click', handleClick);
        return () => {
            document.removeEventListener('click', handleClick);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    if (!isNavigating) return null;

    return (
        <div className="fixed top-12 left-0 right-0 z-50 h-0.5">
            <div
                className={`h-full bg-gradient-to-r ${theme.gradientFrom} ${theme.gradientTo} transition-all duration-300 ease-out`}
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}
