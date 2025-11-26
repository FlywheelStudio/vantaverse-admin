"use client";

import { useEffect } from "react";
import { useSidebar } from "@/components/providers/sidebar-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { initializeStorage } from "@/lib/storage-init";

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();
    const pathname = usePathname();
    const isAssignProgramPage = pathname === "/assign-program";

    // Initialize localStorage on app startup
    useEffect(() => {
        initializeStorage();
    }, []);

    return (
        <div className="flex h-full min-h-screen bg-background">
            <div
                className={cn(
                    "hidden h-full md:flex md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900 transition-all duration-300",
                    isCollapsed ? "md:w-20" : "md:w-72"
                )}
            >
                <Sidebar />
            </div>
            <main
                className={cn(
                    "flex flex-col flex-1 h-full min-h-screen transition-all duration-300",
                    isCollapsed ? "md:pl-20" : "md:pl-72"
                )}
            >
                <Header />
                <div className={cn("flex-1", isAssignProgramPage ? "" : "p-8 pt-6")}>{children}</div>
            </main>
        </div>
    );
}
