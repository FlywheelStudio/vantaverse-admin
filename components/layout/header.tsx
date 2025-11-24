"use client";

import { MobileSidebar } from "@/components/layout/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter((item) => item !== "");

  const breadcrumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const isLast = index === segments.length - 1;
    const title = segment.charAt(0).toUpperCase() + segment.slice(1);

    return { href, title, isLast };
  });

  return (
    <div className="flex items-center p-4 border-b h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <MobileSidebar />
      <div className="flex w-full justify-between items-center ml-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs.length > 0 && <BreadcrumbSeparator />}
            {breadcrumbs.map((crumb, index) => (
              <Fragment key={crumb.href}>
                <BreadcrumbItem>
                  {crumb.isLast ? (
                    <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href}>{crumb.title}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!crumb.isLast && <BreadcrumbSeparator />}
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-x-4">
            <div className="flex items-center gap-x-2">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium leading-none">Dr. Sarah Smith</p>
                    <p className="text-xs text-muted-foreground">Lead Physiologist</p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger className="outline-none">
                         <Avatar>
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Profile</DropdownMenuItem>
                        <DropdownMenuItem>Settings</DropdownMenuItem>
                        <DropdownMenuItem>Team</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
      </div>
    </div>
  );
}
