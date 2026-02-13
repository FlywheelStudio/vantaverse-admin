'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateColorFromSeed } from '@/components/ui/avatar';
import { useOrganizations } from '@/hooks/use-organizations';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { useAddUserToOrganization } from '../hooks/use-user-mutations';

function OrgAvatar({
  orgId,
  pictureUrl,
  size = 40,
}: {
  orgId: string;
  pictureUrl: string | null | undefined;
  size?: number;
}) {
  const bg = generateColorFromSeed(orgId || 'default', { gradient: true });
  const fontSize = Math.max(10, Math.round(size * 0.35));

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-md ring-1 ring-border/40 bg-muted"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {pictureUrl ? (
        <Image
          src={pictureUrl}
          alt=""
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <div
          className="size-full flex items-center justify-center text-white font-medium"
          style={{ backgroundImage: bg, fontSize }}
        />
      )}
    </div>
  );
}

interface AssignGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onAssignSuccess?: () => void;
  userFirstName?: string | null;
  userLastName?: string | null;
}

export function AssignGroupModal({
  open,
  onOpenChange,
  userId,
  onAssignSuccess,
  userFirstName,
  userLastName,
}: AssignGroupModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    string | null
  >(null);

  const debouncedSearch = useDebounce(searchQuery, 200);
  const { data: organizations, isLoading, error } = useOrganizations();
  const addToOrganization = useAddUserToOrganization(userId);

  const filteredOrganizations = useMemo(() => {
    const orgs = organizations ?? [];
    const query = (debouncedSearch ?? '').trim().toLowerCase();
    if (!query) return orgs;
    return orgs.filter((o) => o.name.toLowerCase().includes(query));
  }, [organizations, debouncedSearch]);

  const userName = [userFirstName, userLastName].filter(Boolean).join(' ');

  const handleCancel = () => {
    setSearchQuery('');
    setSelectedOrganizationId(null);
    onOpenChange(false);
  };

  const handleAssign = async () => {
    if (!selectedOrganizationId) return;

    await addToOrganization.mutateAsync(selectedOrganizationId, {
      onSuccess: () => {
        onAssignSuccess?.();
        handleCancel();
      },
    });
  };

  const isAssigning = addToOrganization.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : handleCancel())}
    >
      <DialogContent
        className={cn(
          'w-[min(36rem,calc(100%-2rem))] h-140 max-h-[85vh] flex flex-col overflow-hidden',
          'border-0 bg-card text-card-foreground p-5',
          'rounded-xl shadow-(--shadow-md)',
        )}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={
            open
              ? { opacity: 1, scale: 1, y: 0 }
              : { opacity: 0, scale: 0.95, y: 20 }
          }
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex flex-col flex-1 min-h-0"
        >
          <DialogHeader>
            <DialogTitle className="text-(--text-highlighted) tracking-tight">
              Assign to group
            </DialogTitle>
            <DialogDescription>
              {userName ? `Select a group for ${userName}.` : 'Select a group.'}
            </DialogDescription>
          </DialogHeader>

          <div className="pt-4">
            <Input
              placeholder="Search by group name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isAssigning}
              className={cn(
                'h-11 rounded-md bg-card px-4 text-sm',
                'focus-visible:ring-ring/60 focus-visible:ring-[3px]',
              )}
            />
          </div>

          <ScrollArea className="flex-1 min-h-0 mt-4 pr-2">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading...
              </div>
            ) : error ? (
              <div className="py-8 text-center text-destructive">
                Error loading groups: {error.message}
              </div>
            ) : filteredOrganizations.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No groups found
              </div>
            ) : (
              <div className="space-y-3 p-2">
                {filteredOrganizations.map((org) => {
                  const isSelected = selectedOrganizationId === org.id;
                  return (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => setSelectedOrganizationId(org.id)}
                      disabled={isAssigning}
                      className={cn(
                        'cursor-pointer group w-full text-left p-4 transition-all',
                        'rounded-lg bg-card shadow-(--shadow-sm)',
                        'hover:bg-primary/20 hover:shadow-(--shadow-md)',
                        'focus-visible:outline-none focus-visible:ring-ring/60 focus-visible:ring-[3px]',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        isSelected &&
                          'bg-primary/5 ring-2 ring-primary/30 shadow-(--shadow-md)',
                      )}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <OrgAvatar
                          orgId={org.id}
                          pictureUrl={org.picture_url}
                          size={40}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm text-foreground truncate">
                            {org.name}
                          </div>
                          {org.description && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {org.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end gap-3 pt-4 mt-auto">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isAssigning}
              className="h-11 px-5 rounded-pill"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedOrganizationId || isAssigning}
              className="h-11 px-5 rounded-pill shadow-(--shadow-md)"
            >
              {isAssigning ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Assign'
              )}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

