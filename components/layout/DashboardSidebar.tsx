"use client"
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { useSidebar } from '@/context/SidebarContext';
import { usePWA } from '@/hooks/usePWA';
import { useAuth } from '@/context/AuthContext';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { useRolePreview } from '@/context/RolePreviewContext';
import { useNotificationPrefs, PREF_TYPE_MAP } from '@/hooks/useNotificationPrefs';
import { useApi, apiPost } from '@/hooks/useApi';
import LanguageSwitcher from '../dropdowns/LanguageSwitcher';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Modal from '@/components/ui/Modal';

export default function DashboardSidebar() {
    // Estado para el proceso de selección
    const [isProcessStarted, setIsProcessStarted] = useState(false);
    const [isTogglingProcess, setIsTogglingProcess] = useState(false);
    // Estado para el modal de confirmación
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    // Estado para reset Erasmus
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetConfirmText, setResetConfirmText] = useState('');
    const [isResetting, setIsResetting] = useState(false);
    const [resetDone, setResetDone] = useState(false);

    const handleToggleProcess = async () => {
        setShowConfirmModal(false);
        setIsTogglingProcess(true);
        const wasActive = isProcessStarted;
        try {
            const data = await apiPost<{ active: boolean }>('/selection-process/toggle', {});
            setIsProcessStarted(data.active);
            if (!wasActive && data.active) {
                await apiPost('/notifications/broadcast', {
                    message_key: 'selection_process_started',
                    type: 'application_update',
                });
            }
        } catch (error) {
            console.error('Error toggling process:', error);
        } finally {
            setIsTogglingProcess(false);
        }
    };

    const handleResetErasmus = async () => {
        if (resetConfirmText !== 'RESET') return;
        setIsResetting(true);
        try {
            await apiPost('/admin/reset-erasmus', {});
            setResetDone(true);
            setTimeout(() => {
                setShowResetModal(false);
                setResetConfirmText('');
                setResetDone(false);
                window.location.reload();
            }, 1800);
        } catch {
            // ignore
        } finally {
            setIsResetting(false);
        }
    };

    const t = useTranslations('dashboard');
    const tp = useTranslations('practicas');
    const te = useTranslations('exenciones');
    const tt = useTranslations('tareas');
    const ta = useTranslations('avisos');
    const tpo = useTranslations('calificacion');
    const tr = useTranslations('revision');
    const pathname = usePathname();
    const { isCollapsed, toggleSidebar } = useSidebar();
    const { isInstallable, installApp } = usePWA();
    const { user, loading } = useAuth();
    const theme = useRoleTheme();
    const { effectiveRoleName } = useRolePreview();

    const roleName = effectiveRoleName || user?.role?.name || '';
    const isStudent = roleName.includes('Student');
    const isAdmin = roleName.toLowerCase().includes('admin');
    const isTeacher = roleName.toLowerCase().includes('teacher') || roleName.toLowerCase().includes('profesor') || roleName.toLowerCase().includes('professor') || roleName.toLowerCase().includes('coordinator') || roleName.toLowerCase().includes('coordinador');
    const isLector = !isStudent && !isAdmin && !isTeacher;

    const { data: chatsData } = useApi<{ id: number; unread_count: number }[]>(
        isLector ? null : '/chat',
        { refreshInterval: 30_000 }
    );
    const totalUnreadChats = (chatsData ?? []).reduce((acc, c) => acc + c.unread_count, 0);

    const { prefs } = useNotificationPrefs();
    const { data: notifsData } = useApi<{ items: { type: string; is_read: boolean }[] }>(
        '/notifications/me?page_size=100',
        { refreshInterval: 30_000 }
    );
    const { data: selectionProcessData } = useApi<{ active: boolean }>(
        '/selection-process',
        { refreshInterval: 60_000 }
    );

    useEffect(() => {
        if (selectionProcessData) {
            setIsProcessStarted(selectionProcessData.active);
        }
    }, [selectionProcessData]);
    const enabledTypes = [
        ...(prefs.weeklyDigest ? PREF_TYPE_MAP.weeklyDigest : []),
        ...(prefs.applicationUpdates ? PREF_TYPE_MAP.applicationUpdates : []),
        ...(prefs.taskReminders ? PREF_TYPE_MAP.taskReminders : []),
    ];
    const unreadCount = (notifsData?.items ?? []).filter((n) => {
        if (n.is_read) return false;
        const isKnownType = Object.values(PREF_TYPE_MAP).flat().includes(n.type);
        return !isKnownType || enabledTypes.includes(n.type);
    }).length;

    type MenuItem = { name: string; path: string; icon: React.ReactNode; badge?: number };
    type SidebarGroup = { label?: string; items: MenuItem[] };

    const defaultGroups: SidebarGroup[] = [
        {
            label: t('sidebarInicio'),
            items: [
                { name: t('home'), path: '/dashboard', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
                ...(!isLector ? [{ name: t('chat'), path: '/dashboard/messages', badge: totalUnreadChats || undefined, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" /> }] : []),
            ],
        },
        {
            label: t('sidebarGestion'),
            items: [
                ...(isAdmin ? [{ name: t('admin'), path: '/dashboard/admin', icon: <><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></> }] : []),
                ...((isAdmin || isTeacher) ? [{ name: t('students'), path: '/dashboard/students', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /> }] : []),
                ...((isAdmin || isTeacher) ? [{ name: tr('title'), path: '/dashboard/revision', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /> }] : []),
            ],
        },
        {
            label: t('sidebarResultados'),
            items: [
                ...(!isLector ? [{ name: t('listaFinal'), path: '/dashboard/lista-final', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /> }] : []),
                { name: tpo('title'), path: '/dashboard/calificacion', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
            ],
        },
        {
            label: t('sidebarReferencia'),
            items: [
                { name: t('opportunities'), path: '/dashboard/opportunities', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /> },
            ],
        },
    ];

    const studentGroups: SidebarGroup[] = [
        {
            label: t('sidebarInicio'),
            items: [
                { name: t('home'), path: '/dashboard', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
                { name: ta('title'), path: '/dashboard/avisos', badge: unreadCount, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /> },
                { name: t('chat'), path: '/dashboard/messages', badge: totalUnreadChats || undefined, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" /> },
            ],
        },
        {
            label: t('sidebarProceso'),
            items: [
                { name: t('documents'), path: '/dashboard/documents', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /> },
                { name: tt('title'), path: '/dashboard/tareas', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /> },
                { name: tp('title'), path: '/dashboard/practicas', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /> },
                { name: te('title'), path: '/dashboard/exenciones', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
            ],
        },
        {
            label: t('sidebarResultados'),
            items: [
                { name: tpo('title'), path: '/dashboard/calificacion', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
                { name: t('listaFinal'), path: '/dashboard/lista-final', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /> },
                { name: t('opportunities'), path: '/dashboard/opportunities', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /> },
            ],
        },
    ];

    const menuGroups = isStudent ? studentGroups : defaultGroups;

    return (
        <>
            {/* Dark overlay on mobile when sidebar is open */}
            {!isCollapsed && (
                <div
                    className="fixed inset-0 bg-black/40 z-10 md:hidden transition-opacity duration-300"
                    onClick={toggleSidebar}
                />
            )}

            <aside className={`fixed left-0 top-12 h-[calc(100vh-3rem)] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-20 transition-all duration-300 ease-in-out
                ${isCollapsed ? 'w-16' : 'w-64'}
                ${isCollapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
            `}>

                <div className="flex items-center justify-center mx-3 mt-3">
                    <button onClick={toggleSidebar} className="cursor-pointer group">
                        <div className={`${theme.logoBg} rounded-2xl flex items-center justify-center transition-all duration-500 ${isCollapsed ? 'w-10 h-10' : 'w-16 h-16'}`}>
                            <Image
                                src="/logoVector.svg"
                                alt="ErasmusHub"
                                width={80}
                                height={80}
                                className={`transition-all duration-500 ease-in-out group-hover:scale-110 group-active:scale-95 ${isCollapsed ? 'w-7 h-7 rotate-[360deg]' : 'w-12 h-12 rotate-0'}`}
                            />
                        </div>
                    </button>
                </div>

                <button
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 z-30 transition-transform duration-300 hidden md:flex"
                    style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                    <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>

                <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden">
                    {loading ? (
                        <div className="space-y-2">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                                    <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse shrink-0" />
                                    <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`} style={{ width: `${60 + i * 15}px` }} />
                                </div>
                            ))}
                            <p className={`text-xs text-gray-400 dark:text-gray-600 text-center mt-4 transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                                {t('loadingSidebar')}
                            </p>
                        </div>
                    ) : (
                        <>
                            {menuGroups.map((group, gi) => {
                                const visibleItems = group.items.filter(Boolean);
                                if (visibleItems.length === 0) return null;
                                return (
                                    <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
                                        {group.label && (
                                            <div className={`flex items-center gap-2 px-3 mb-1 transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                                                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                                    {group.label}
                                                </span>
                                                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                                            </div>
                                        )}
                                        <div className="space-y-0.5">
                                            {visibleItems.map((item) => {
                                                const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
                                                return (
                                                    <Link
                                                        key={item.path}
                                                        href={item.path}
                                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${isActive ? `${theme.activeBg} ${theme.activeText} font-medium` : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                                                    >
                                                        <svg className={`w-5 h-5 shrink-0 ${isActive ? theme.activeIcon : "text-gray-400 dark:text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                            {item.icon}
                                                        </svg>
                                                        <span className={`text-sm whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                                                            {item.name}
                                                        </span>
                                                        {item.badge ? (
                                                            <span className={`ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1.5 transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                                                                {item.badge}
                                                            </span>
                                                        ) : null}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}

                            {isAdmin && (
                                <div className="mt-6 space-y-1">
                                    {/* Toggle selection process */}
                                    <button
                                        onClick={() => !isTogglingProcess && setShowConfirmModal(true)}
                                        disabled={isTogglingProcess}
                                        className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${isProcessStarted ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'}`}
                                    >
                                        {isTogglingProcess ? (
                                            <svg className="w-5 h-5 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                {isProcessStarted ? (
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10h6m-6 4h6" />
                                                ) : (
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                                                )}
                                            </svg>
                                        )}
                                        <span className={`text-sm font-semibold whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                                            {isTogglingProcess ? t('processProcessing') : isProcessStarted ? t('processStop') : t('processStart')}
                                        </span>
                                    </button>

                                    {/* Reset Erasmus */}
                                    <button
                                        onClick={() => { setResetConfirmText(''); setResetDone(false); setShowResetModal(true); }}
                                        className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg transition-all duration-200 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10"
                                        title={t('resetErasmus')}
                                    >
                                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                        </svg>
                                        <span className={`text-sm font-semibold whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                                            {t('resetErasmus')}
                                        </span>
                                    </button>
                                </div>
                            )}

                        </>
                    )}
                </nav>

                {/* Language selector on mobile */}
                <div className={`md:hidden p-3 border-t border-gray-200 dark:border-gray-800 transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                    <LanguageSwitcher dropUp />
                </div>

                {isInstallable && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                        <button
                            onClick={installApp}
                            className={`flex items-center gap-3 w-full px-3 py-2.5 ${theme.installBg} ${theme.installHover} text-white rounded-lg transition-all duration-200 justify-center`}
                            title={t('installApp')}
                        >
                            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span className={`text-sm font-medium whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'hidden' : 'block'}`}>
                                {t('installApp')}
                            </span>
                        </button>
                    </div>
                )}
            </aside>

            {/* Modal de confirmación para el proceso de selección */}
            <ConfirmModal
                open={showConfirmModal}
                title={isProcessStarted ? t('processStopTitle') : t('processStartTitle')}
                description={isProcessStarted ? t('processStopDesc') : t('processStartDesc')}
                confirmLabel={isProcessStarted ? t('processStop') : t('processStart')}
                cancelLabel={t('processCancel')}
                onConfirm={handleToggleProcess}
                onClose={() => setShowConfirmModal(false)}
            />

            {/* Modal Reset Erasmus — requiere escribir "RESET" */}
            <Modal open={showResetModal} onClose={() => { if (!isResetting) { setShowResetModal(false); setResetConfirmText(''); setResetDone(false); } }}>
                <div className="border-l-4 border-red-500 pl-3 mb-1">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{t('resetErasmusTitle')}</h3>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {t('resetErasmusDesc')}
                </p>

                {!resetDone ? (
                    <>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {t('resetErasmusConfirmHint')}
                            </label>
                            <input
                                type="text"
                                value={resetConfirmText}
                                onChange={e => setResetConfirmText(e.target.value.toUpperCase())}
                                placeholder="RESET"
                                disabled={isResetting}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-mono outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400 dark:focus:border-red-500 disabled:opacity-50"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                onClick={() => { setShowResetModal(false); setResetConfirmText(''); }}
                                disabled={isResetting}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
                            >
                                {t('processCancel')}
                            </button>
                            <button
                                onClick={handleResetErasmus}
                                disabled={resetConfirmText !== 'RESET' || isResetting}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isResetting && (
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                )}
                                {t('resetErasmusConfirm')}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                        <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{t('resetErasmusSuccess')}</p>
                    </div>
                )}
            </Modal>

        </>
    );
}