"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface SidebarContextType {
    isCollapsed: boolean;
    toggle: () => void;
    setCollapsed: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        // Optional: Load from local storage if we want persistence
        const saved = localStorage.getItem("sidebar-collapsed");
        if (saved) {
            setIsCollapsed(JSON.parse(saved));
        }
    }, []);

    const toggle = useCallback(() => {
        setIsCollapsed((prev) => {
            const newValue = !prev;
            localStorage.setItem("sidebar-collapsed", JSON.stringify(newValue));
            return newValue;
        });
    }, []);

    const setCollapsed = useCallback((value: boolean) => {
        setIsCollapsed(value);
        localStorage.setItem("sidebar-collapsed", JSON.stringify(value));
    }, []);

    return (
        <SidebarContext.Provider value={{ isCollapsed, toggle, setCollapsed }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error("useSidebar must be used within a SidebarProvider");
    }
    return context;
}
