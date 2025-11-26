"use client";

import { useSidebar } from "@/components/providers/sidebar-provider";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Settings,
  LogOut,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
    color: "text-sky-500",
  },
  {
    label: "Patients",
    icon: Users,
    href: "/patients",
    color: "text-violet-500",
  },
  {
    label: "Teams",
    icon: Users,
    href: "/teams",
    color: "text-emerald-500",
  },
  {
    label: "Exercise Library",
    icon: Dumbbell,
    href: "/exercises",
    color: "text-pink-700",
  },
  {
    label: "Assign Program",
    icon: LayoutDashboard,
    href: "/assign-program",
    color: "text-green-500",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggle } = useSidebar();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white relative">
      <div className="px-3 py-2 flex-1">
        <div className="flex items-center justify-between mb-14 pl-3 pr-3">
          <div
            onClick={toggle}
            className={cn(
              "flex items-center cursor-pointer hover:opacity-80 transition-opacity",
              isCollapsed && "justify-center w-full"
            )}
          >
            <div className={cn("relative w-8 h-8 flex-shrink-0", !isCollapsed && "mr-4")}>
              {/* Logo placeholder */}
              <div className="absolute inset-0 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg">
                V
              </div>
            </div>
            {!isCollapsed && (
              <h1 className="text-2xl font-bold transition-opacity duration-300">
                Vantaverse
              </h1>
            )}
          </div>
        </div>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                pathname === route.href
                  ? "text-white bg-white/10"
                  : "text-zinc-400",
                isCollapsed && "justify-center px-2"
              )}
            >
              <div className={cn("flex items-center flex-1", isCollapsed && "justify-center")}>
                <route.icon
                  className={cn(
                    "h-5 w-5",
                    route.color,
                    !isCollapsed && "mr-3"
                  )}
                />
                {!isCollapsed && route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="px-3 py-2">
        <div className="space-y-1">
          <Link
            href="/settings"
            className={cn(
              "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition text-zinc-400",
              isCollapsed && "justify-center px-2"
            )}
          >
            <div className={cn("flex items-center flex-1", isCollapsed && "justify-center")}>
              <Settings
                className={cn("h-5 w-5 text-gray-400", !isCollapsed && "mr-3")}
              />
              {!isCollapsed && "Settings"}
            </div>
          </Link>
          <Link
            href="#"
            className={cn(
              "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition text-zinc-400",
              isCollapsed && "justify-center px-2"
            )}
          >
            <div className={cn("flex items-center flex-1", isCollapsed && "justify-center")}>
              <LogOut
                className={cn("h-5 w-5 text-gray-400", !isCollapsed && "mr-3")}
              />
              {!isCollapsed && "Logout"}
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 bg-[#111827]">
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
}
