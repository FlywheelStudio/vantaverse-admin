'use client';

import { UserCard } from '@/components/ui/user-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Badge,
  Button,
  CardHeader,
  Icon,
  IconButton,
  Input,
} from '@/components/medvanta';
import { cn } from '@/lib/utils';
import type { DashboardStatusUser, UserNeedingAttention } from '@/lib/supabase/queries/dashboard';

type BadgeTone = 'neutral' | 'brand' | 'accent' | 'success' | 'warning' | 'danger';

type StatusCountsListPanelProps = {
  title: string;
  hideListHeader?: boolean;
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
  complianceBadgeTone: (compliance: number) => BadgeTone;
};

export function StatusCountsListPanel({
  title,
  hideListHeader,
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
  complianceBadgeTone,
}: StatusCountsListPanelProps): React.ReactElement {
  return (
    <>
      {!hideListHeader ? (
        <div className="flex shrink-0 flex-row items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <CardHeader title={title} className="mb-0" />
          {onBack ? (
            <Button variant="ghost" size="sm" onClick={onBack}>
              Back
            </Button>
          ) : null}
        </div>
      ) : null}
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-hidden p-5',
          hideListHeader && 'pt-4',
        )}
      >
        <div className="mb-4 mt-0.5 flex w-full min-w-0 shrink-0 items-center gap-2">
          <Input
            type="search"
            placeholder="Name, email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            iconLeft="Search"
            className="min-w-0 flex-1"
          />
          {isPending ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <IconButton
                  icon={sendingBulkInvites ? 'LoaderCircle' : 'Mail'}
                  label="Invite all current"
                  variant="secondary"
                  disabled={
                    filteredLength === 0 ||
                    !filtered.some((u) => u.email?.trim()) ||
                    sendingBulkInvites
                  }
                  onClick={() =>
                    onSendInvitations(filtered.filter((u) => u.email?.trim()) as DashboardStatusUser[])
                  }
                  className={sendingBulkInvites ? '[&_svg]:animate-spin' : undefined}
                />
              </TooltipTrigger>
              <TooltipContent>Invite all current</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        {usersLength === 0 ? (
          <div className="flex flex-1 items-center justify-center text-[length:var(--text-sm)] text-[var(--text-muted)]">
            No users in this category.
          </div>
        ) : filteredLength === 0 ? (
          <div className="flex flex-1 items-center justify-center text-[length:var(--text-sm)] text-[var(--text-muted)]">
            No matches for &quot;{searchTrim}&quot;.
          </div>
        ) : (
          <ScrollArea className="slim-scrollbar min-h-0 flex-1 pr-2">
            <div className="min-w-0 w-full space-y-3 overflow-hidden p-2">
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
                              <Badge tone={complianceBadgeTone((u as UserNeedingAttention).compliance)}>
                                {Math.round((u as UserNeedingAttention).compliance)}%
                              </Badge>
                              <Icon name="ChevronRight" size={16} className="text-[var(--text-muted)]" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Completion</TooltipContent>
                        </Tooltip>
                      ) : isPending ? (
                        <div className="flex items-center gap-2">
                          {u.email?.trim() ? (
                            <IconButton
                              icon={sendingBulkInvites ? 'LoaderCircle' : 'Mail'}
                              label="Send invitation"
                              variant="ghost"
                              disabled={sendingBulkInvites}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSendInvitations([u]);
                              }}
                              className={sendingBulkInvites ? '[&_svg]:animate-spin' : undefined}
                            />
                          ) : null}
                        </div>
                      ) : isNoProgram ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <IconButton
                              icon="ClipboardList"
                              label="Assign program"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAssignProgram(u);
                              }}
                            />
                          </TooltipTrigger>
                          <TooltipContent>Assign program</TooltipContent>
                        </Tooltip>
                      ) : (
                        <Icon name="ChevronRight" size={16} className="text-[var(--text-muted)]" />
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </>
  );
}
