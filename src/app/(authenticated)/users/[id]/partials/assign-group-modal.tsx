'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Button, Dialog, FormField, Input } from '@/components/medvanta';
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
}): React.ReactElement {
  const bg = generateColorFromSeed(orgId || 'default', { gradient: true });
  const fontSize = Math.max(10, Math.round(size * 0.35));

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--slate-100)] ring-1 ring-[var(--border-subtle)]"
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
          className="flex size-full items-center justify-center font-[var(--fw-medium)] text-[var(--white)]"
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
}: AssignGroupModalProps): React.ReactElement {
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

  const handleCancel = (): void => {
    setSearchQuery('');
    setSelectedOrganizationId(null);
    onOpenChange(false);
  };

  const handleAssign = async (): Promise<void> => {
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
      onClose={handleCancel}
      title="Assign to group"
      width={576}
      className="flex max-h-[85vh] flex-col overflow-hidden"
      footer={
        <>
          <Button variant="secondary" onClick={handleCancel} disabled={isAssigning}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedOrganizationId || isAssigning}
            loading={isAssigning}
          >
            Assign
          </Button>
        </>
      }
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={
          open
            ? { opacity: 1, scale: 1, y: 0 }
            : { opacity: 0, scale: 0.95, y: 20 }
        }
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <p className="mb-4 text-[length:var(--text-sm)] text-[var(--text-muted)]">
          {userName ? `Select a group for ${userName}.` : 'Select a group.'}
        </p>

        <FormField label="Search groups">
          <Input
            placeholder="Search by group name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isAssigning}
            iconLeft="Search"
          />
        </FormField>

        <ScrollArea className="mt-4 min-h-0 flex-1 pr-2" style={{ maxHeight: 360 }}>
          {isLoading ? (
            <div className="py-8 text-center text-[var(--text-muted)]">
              Loading...
            </div>
          ) : error ? (
            <div className="py-8 text-center text-[var(--danger)]">
              Error loading groups: {error.message}
            </div>
          ) : filteredOrganizations.length === 0 ? (
            <div className="py-8 text-center text-[var(--text-muted)]">
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
                      'group w-full cursor-pointer p-4 text-left transition-all',
                      'rounded-[var(--radius-md)] bg-[var(--surface-card)] shadow-[var(--shadow-sm)]',
                      'hover:bg-[color-mix(in_oklch,var(--primary)_12%,var(--surface-card))] hover:shadow-[var(--shadow-md)]',
                      'focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                      isSelected &&
                        'bg-[color-mix(in_oklch,var(--primary)_8%,var(--surface-card))] ring-2 ring-[var(--primary)] shadow-[var(--shadow-md)]',
                    )}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <OrgAvatar
                        orgId={org.id}
                        pictureUrl={org.picture_url}
                        size={40}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[length:var(--text-sm)] font-[var(--fw-semibold)] text-[var(--text-strong)]">
                          {org.name}
                        </div>
                        {org.description ? (
                          <div className="mt-1 line-clamp-2 text-[length:var(--text-xs)] text-[var(--text-muted)]">
                            {org.description}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </motion.div>
    </Dialog>
  );
}
