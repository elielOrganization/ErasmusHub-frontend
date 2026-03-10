"use client"
import React, { createContext, useContext, useState } from 'react';

const SidebarContext = createContext({
    isCollapsed: false,
    toggleSidebar: () => { },
});

export const SidebarProvider = ({ children, initialCollapsed }: { children: React.ReactNode, initialCollapsed: boolean }) => {
    const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        document.cookie = `sidebar_collapsed=${newState}; path=/; max-age=31536000`;
    };

    return (
        <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => useContext(SidebarContext);