"use client"
import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import {
    fetchMyChats,
    fetchMessages,
    sendMessage,
    type Chat,
    type ChatMessage,
} from "@/services/chatService";

function timeAgo(iso: string, tNow: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return tNow;
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
}

export default function ChatDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChat, setActiveChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const t = useTranslations("dashboard");

    const totalUnread = chats.reduce((acc, c) => acc + c.unread_count, 0);

    const loadChats = useCallback(async () => {
        if (!user) return;
        try {
            const data = await fetchMyChats();
            setChats(data);
        } catch {
            // ignore
        }
    }, [user]);

    useEffect(() => {
        if (isOpen) loadChats();
    }, [isOpen, loadChats]);

    // Poll for new messages every 5s when a chat is open
    useEffect(() => {
        if (!activeChat) return;
        const id = setInterval(async () => {
            try {
                const msgs = await fetchMessages(activeChat.id);
                setMessages(msgs);
            } catch {
                // ignore
            }
        }, 5000);
        return () => clearInterval(id);
    }, [activeChat]);

    // Poll chat list every 15s when dropdown is open
    useEffect(() => {
        if (!isOpen) return;
        const id = setInterval(loadChats, 15000);
        return () => clearInterval(id);
    }, [isOpen, loadChats]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const openChat = async (chat: Chat) => {
        setActiveChat(chat);
        setLoading(true);
        try {
            const msgs = await fetchMessages(chat.id);
            setMessages(msgs);
            // Update unread count locally
            setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread_count: 0 } : c));
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!activeChat || !input.trim() || sending) return;
        setSending(true);
        try {
            const msg = await sendMessage(activeChat.id, input.trim());
            setMessages(prev => [...prev, msg]);
            setInput("");
        } catch {
            // ignore
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 active:scale-95 transition-all relative"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                </svg>
                {totalUnread > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in zoom-in duration-200 flex flex-col" style={{ height: activeChat ? "480px" : "auto", maxHeight: "480px" }}>

                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60 flex items-center gap-2 shrink-0">
                        {activeChat && (
                            <button
                                onClick={() => setActiveChat(null)}
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex-1 truncate">
                            {activeChat
                                ? activeChat.opportunity_name
                                : "Mensajes"}
                        </h3>
                        {activeChat && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[120px]">
                                {user?.id === activeChat.student_id
                                    ? activeChat.teachers_names
                                    : activeChat.student_name}
                            </span>
                        )}
                    </div>

                    {/* Chat list */}
                    {!activeChat && (
                        <div className="overflow-y-auto flex-1">
                            {chats.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-6 h-6 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                                        </svg>
                                    </div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{t("noMessages")}</p>
                                </div>
                            ) : (
                                chats.map(chat => (
                                    <button
                                        key={chat.id}
                                        onClick={() => openChat(chat)}
                                        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-left border-b border-gray-100 dark:border-gray-800 last:border-0"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                                {user?.id === chat.student_id
                                                    ? chat.teachers_names.charAt(0).toUpperCase()
                                                    : chat.student_name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1">
                                                <span className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
                                                    {user?.id === chat.student_id ? chat.teachers_names : chat.student_name}
                                                </span>
                                                {chat.last_message && (
                                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
                                                        {timeAgo(chat.last_message.created_at, t("justNow"))}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                                                {chat.opportunity_name}
                                            </p>
                                            {chat.last_message && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                    {chat.last_message.content}
                                                </p>
                                            )}
                                        </div>
                                        {chat.unread_count > 0 && (
                                            <span className="w-4 h-4 bg-blue-500 rounded-full text-[9px] text-white flex items-center justify-center shrink-0 font-bold">
                                                {chat.unread_count}
                                            </span>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {/* Messages view */}
                    {activeChat && (
                        <>
                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {loading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">
                                        {t("chatBeFirst")}
                                    </p>
                                ) : (
                                    messages.map(msg => {
                                        const isOwn = msg.sender_id === user?.id;
                                        return (
                                            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                                                <div className={`max-w-[80%] px-3 py-1.5 rounded-2xl text-xs ${
                                                    isOwn
                                                        ? "bg-blue-500 text-white rounded-br-sm"
                                                        : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm"
                                                }`}>
                                                    {!isOwn && (
                                                        <p className="text-[9px] font-semibold mb-0.5 opacity-60">{msg.sender_name}</p>
                                                    )}
                                                    <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                                                    <p className={`text-[9px] mt-0.5 ${isOwn ? "text-blue-100" : "text-gray-400 dark:text-gray-500"}`}>
                                                        {timeAgo(msg.created_at, t("justNow"))}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="px-3 pb-3 pt-2 border-t border-gray-100 dark:border-gray-800 shrink-0">
                                <div className="flex gap-2 items-end">
                                    <textarea
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={t("chatWritePlaceholder")}
                                        rows={1}
                                        className="flex-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 resize-none outline-none placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500/40"
                                        style={{ maxHeight: "80px" }}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!input.trim() || sending}
                                        className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {sending ? (
                                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <p className="text-[9px] text-gray-400 dark:text-gray-600 mt-1">{t("chatEnterHint")}</p>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
