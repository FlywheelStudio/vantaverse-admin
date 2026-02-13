'use client';

import { ChevronRight, Mail, Loader2, Search, ClipboardList } from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { UserCard } from '@/components/ui/user-card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { DashboardStatusUser, UserNeedingAttention } from '@/lib/supabase/queries/dashboard';

type StatusCountsListPanelProps = {
  title: string;
  onBack?: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  usersLength: number;
  filteredLength: number;
  searchTrim: string;
  filtered: (DashboardStatusUser | UserNeedingAttention)[];
  isPending: boolean;
  isNoProgram: boolean;
  sendingBulkInvites: boolean;
  onSendInvitations: (users: DashboardStatusUser[]) => void;
  onUserClick: (userId: string) => void;
  onAssignProgram: (user: DashboardStatusUser) => void;
  complianceBadgeClass: (compliance: number) => string;
};

export function StatusCountsListPanel({
  title,
  onBack,
  search,
  onSearchChange,
  usersLength,
  filteredLength,
  searchTrim,
  filtered,
  isPending,
  isNoProgram,
  sendingBulkInvites,
  onSendInvitations,
  onUserClick,
  onAssignProgram,
  complianceBadgeClass,
}: StatusCountsListPanelProps) {
  return (
    <>
      <CardHeader className="px-5 py-4 shrink-0 border-b border-border/60 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold text-foreground tracking-tight">
          {title}
        </CardTitle>
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 text-xs text-muted-foreground"
          >
            Back
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-5 pt-4 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex items-center gap-2 w-full min-w-0 mt-0.5 mb-4 shrink-0">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Name, email..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-10 pl-10 bg-card/90 shadow-sm border-border/60 rounded-md text-sm"
            />
          </div>
          {isPending && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  disabled={
                    filteredLength === 0 ||
                    !filtered.some((u) => u.email?.trim()) ||
                    sendingBulkInvites
                  }
                  onClick={() =>
                    onSendInvitations(filtered.filter((u) => u.email?.trim()) as DashboardStatusUser[])
                  }
                >
                  {sendingBulkInvites ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Invite all current</TooltipContent>
            </Tooltip>
          )}
        </div>
        {usersLength === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-dimmed">
            No users in this category.
          </div>
        ) : filteredLength === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-dimmed">
            No matches for &quot;{searchTrim}&quot;.
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0 pr-2 slim-scrollbar">
            <div className="space-y-3 min-w-0 w-full overflow-hidden">
              {filtered.map((u, i) => (
                <div
                  key={u.user_id}
                  className="cursor-pointer"
                  onClick={() => onUserClick(u.user_id)}
                >
                  <UserCard
                    user={u}
                    index={i}
                    action={
                      'compliance' in u ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-semibold px-2 py-1 rounded-full ${complianceBadgeClass((u as UserNeedingAttention).compliance)}`}
                              >
                                {Math.round((u as UserNeedingAttention).compliance)}%
                              </span>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Completion</TooltipContent>
                        </Tooltip>
                      ) : isPending ? (
                        <div className="flex items-center gap-2">
                          {u.email?.trim() ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              disabled={sendingBulkInvites}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSendInvitations([u]);
                              }}
                            >
                              {sendingBulkInvites ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Mail className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          ) : null}
                        </div>
                      ) : isNoProgram ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAssignProgram(u);
                              }}
                            >
                              <ClipboardList className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Assign program</TooltipContent>
                        </Tooltip>
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </>
  );
}
