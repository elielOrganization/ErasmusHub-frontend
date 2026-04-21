"use client";
import { createContext, useContext, useState, ReactNode } from "react";

interface ChatContextType {
    pendingChatId: number | null;
    openChat: (chatId: number) => void;
    clearPendingChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [pendingChatId, setPendingChatId] = useState<number | null>(null);

    return (
        <ChatContext.Provider value={{
            pendingChatId,
            openChat: (id) => setPendingChatId(id),
            clearPendingChat: () => setPendingChatId(null),
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChatContext() {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
    return ctx;
}
