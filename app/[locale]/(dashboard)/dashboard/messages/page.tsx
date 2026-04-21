'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import {
    fetchMyChats,
    fetchMessages,
    sendMessage,
    type Chat,
    type ChatMessage,
} from '@/services/chatService';

function timeAgo(iso: string, tNow: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return tNow;
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
}

function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MessagesContent() {
    const searchParams = useSearchParams();
    const chatIdParam = searchParams.get('chat');
    const { user } = useAuth();
    const t = useTranslations('dashboard');

    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChat, setActiveChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const loadChats = useCallback(async (): Promise<Chat[]> => {
        if (!user) return [];
        try {
            const data = await fetchMyChats();
            setChats(data);
            return data;
        } catch {
            return [];
        }
    }, [user]);

    const openChat = useCallback(async (chat: Chat) => {
        setActiveChat(chat);
        setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread_count: 0 } : c));
        setLoadingMessages(true);
        try {
            const msgs = await fetchMessages(chat.id);
            setMessages(msgs);
        } catch {
            setMessages([]);
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    // Initial load + auto-open from ?chat= param
    useEffect(() => {
        const init = async () => {
            setLoadingChats(true);
            const data = await loadChats();
            setLoadingChats(false);
            if (chatIdParam && data.length > 0) {
                const found = data.find(c => c.id === Number(chatIdParam));
                if (found) openChat(found);
            }
        };
        init();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Poll chat list every 15s
    useEffect(() => {
        const id = setInterval(loadChats, 15000);
        return () => clearInterval(id);
    }, [loadChats]);

    // Poll messages every 5s when a chat is open
    useEffect(() => {
        if (!activeChat) return;
        const id = setInterval(async () => {
            try {
                const msgs = await fetchMessages(activeChat.id);
                setMessages(msgs);
            } catch {}
        }, 5000);
        return () => clearInterval(id);
    }, [activeChat]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }, [input]);

    const handleSend = async () => {
        if (!activeChat || !input.trim() || sending) return;
        setSending(true);
        const content = input.trim();
        setInput('');
        try {
            const msg = await sendMessage(activeChat.id, content);
            setMessages(prev => [...prev, msg]);
        } catch {
            setInput(content);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const otherPartyName = activeChat
        ? (user?.id === activeChat.student_id ? activeChat.teachers_names : activeChat.student_name)
        : '';

    const totalUnread = chats.reduce((acc, c) => acc + c.unread_count, 0);

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">

            {/* ── Left panel: chat list ─────────────────────────── */}
            <div className={`flex flex-col border-r border-gray-100 dark:border-gray-800 w-full md:w-80 shrink-0 ${activeChat ? 'hidden md:flex' : 'flex'}`}>

                {/* Header */}
                <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <h1 className="text-base font-bold text-gray-800 dark:text-gray-100">{t('chat')}</h1>
                        {totalUnread > 0 && (
                            <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full">
                                {totalUnread > 99 ? '99+' : totalUnread}
                            </span>
                        )}
                    </div>
                </div>

                {/* Chat list */}
                {loadingChats ? (
                    <div className="flex-1 p-4 space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex gap-3 animate-pulse">
                                <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                                <div className="flex-1 space-y-2 pt-1">
                                    <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : chats.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('noMessages')}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('noChatsDesc')}</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        {chats.map(chat => {
                            const name = user?.id === chat.student_id ? chat.teachers_names : chat.student_name;
                            const isActive = activeChat?.id === chat.id;
                            const initial = name.charAt(0).toUpperCase();
                            return (
                                <button
                                    key={chat.id}
                                    onClick={() => openChat(chat)}
                                    className={`w-full px-4 py-3.5 flex items-start gap-3 transition-colors text-left border-b border-gray-50 dark:border-gray-800/60 last:border-0 ${
                                        isActive
                                            ? 'bg-blue-50 dark:bg-blue-900/20'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                                    }`}
                                >
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0 text-white font-bold text-base shadow-sm">
                                        {initial}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                            <span className={`text-sm truncate ${chat.unread_count > 0 ? 'font-bold text-gray-900 dark:text-gray-50' : 'font-medium text-gray-700 dark:text-gray-200'}`}>
                                                {name}
                                            </span>
                                            {chat.last_message && (
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
                                                    {timeAgo(chat.last_message.created_at, t('justNow'))}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-blue-500 dark:text-blue-400 truncate font-medium mb-0.5">
                                            {chat.opportunity_name}
                                        </p>
                                        {chat.last_message && (
                                            <p className={`text-xs truncate ${chat.unread_count > 0 ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                                                {chat.last_message.content}
                                            </p>
                                        )}
                                    </div>
                                    {chat.unread_count > 0 && (
                                        <span className="w-5 h-5 bg-blue-500 rounded-full text-[10px] text-white flex items-center justify-center shrink-0 font-bold mt-1">
                                            {chat.unread_count > 9 ? '9+' : chat.unread_count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Right panel: active chat ──────────────────────── */}
            {activeChat ? (
                <div className="flex-1 flex flex-col min-w-0">

                    {/* Chat header */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-white dark:bg-gray-900 shrink-0">
                        <button
                            onClick={() => setActiveChat(null)}
                            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
                            {otherPartyName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{otherPartyName}</p>
                            <p className="text-xs text-blue-500 dark:text-blue-400 truncate">{activeChat.opportunity_name}</p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gray-50/60 dark:bg-gray-950/60">
                        {loadingMessages ? (
                            <div className="flex justify-center py-16">
                                <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                                <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100 dark:border-gray-700">
                                    <svg className="w-7 h-7 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                                    </svg>
                                </div>
                                <p className="text-sm text-gray-400 dark:text-gray-500">{t('chatBeFirst')}</p>
                            </div>
                        ) : (
                            (() => {
                                const rendered: React.ReactNode[] = [];
                                let lastDate = '';
                                messages.forEach((msg, idx) => {
                                    const isOwn = msg.sender_id === user?.id;
                                    const msgDate = new Date(msg.created_at).toLocaleDateString();
                                    const prevMsg = messages[idx - 1];
                                    const sameGroup = prevMsg && prevMsg.sender_id === msg.sender_id
                                        && (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()) < 120000;

                                    if (msgDate !== lastDate) {
                                        lastDate = msgDate;
                                        rendered.push(
                                            <div key={`date-${msgDate}`} className="flex items-center gap-3 my-3">
                                                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                                                    {msgDate}
                                                </span>
                                                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                                            </div>
                                        );
                                    }

                                    rendered.push(
                                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${sameGroup ? 'mt-0.5' : 'mt-3'}`}>
                                            {!isOwn && (
                                                <div className={`w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs mr-2 shrink-0 ${sameGroup ? 'invisible' : 'mt-0.5'}`}>
                                                    {msg.sender_name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                                                {!isOwn && !sameGroup && (
                                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1 ml-1 font-medium">{msg.sender_name}</p>
                                                )}
                                                <div className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                                                    isOwn
                                                        ? 'bg-blue-500 text-white rounded-2xl rounded-br-sm shadow-sm'
                                                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100 dark:border-gray-700'
                                                }`}>
                                                    {msg.content}
                                                </div>
                                                <p className={`text-[10px] mt-1 text-gray-400 dark:text-gray-500 ${isOwn ? 'text-right' : ''}`}>
                                                    {formatTime(msg.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                });
                                return rendered;
                            })()
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="px-4 pb-4 pt-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                        <div className="flex gap-2 items-end">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={t('chatWritePlaceholder')}
                                rows={1}
                                className="flex-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 resize-none outline-none placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500/40 transition-shadow"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || sending}
                                className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                            >
                                {sending ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">{t('chatEnterHint')}</p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 hidden md:flex flex-col items-center justify-center p-8 text-center bg-gray-50/30 dark:bg-gray-950/30">
                    <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
                        <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                        </svg>
                    </div>
                    <p className="text-base font-medium text-gray-500 dark:text-gray-400">{t('selectChatPrompt')}</p>
                </div>
            )}
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense>
            <MessagesContent />
        </Suspense>
    );
}
