"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  BarChart3,
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
  {
    label: "Analytics",
    icon: BarChart3,
    href: "/analytics",
    color: "text-orange-700",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white">
      <div className="px-3 py-2 flex-1">
        <Link href="/" className="flex items-center pl-3 mb-14">
          <div className="relative w-8 h-8 mr-4">
            {/* Logo placeholder */}
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg">
              V
            </div>
          </div>
          <h1 className="text-2xl font-bold">
            Vantaverse
          </h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
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
              "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition text-zinc-400"
            )}
          >
            <div className="flex items-center flex-1">
              <Settings className="h-5 w-5 mr-3 text-gray-400" />
              Settings
            </div>
          </Link>
          <Link
            href="#"
            className={cn(
              "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition text-zinc-400"
            )}
          >
            <div className="flex items-center flex-1">
              <LogOut className="h-5 w-5 mr-3 text-gray-400" />
              Logout
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
