'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Icon, Input } from '@/components/medvanta';
import { HtmlModal } from './intake-survey-placeholder-modal';
import { generateColorFromSeed } from '@/components/ui/avatar';
import { useOrganizations } from '@/hooks/use-organizations';
import { useDebounce } from '@/hooks/use-debounce';
import { useAddUserToOrganization } from '../hooks/use-user-mutations';

function OrgAvatar({
  orgId,
  pictureUrl,
  size = 36,
}: {
  orgId: string;
  pictureUrl: string | null | undefined;
  size?: number;
}): React.ReactElement {
  const bg = generateColorFromSeed(orgId || 'default', { gradient: true });
  const fontSize = Math.max(10, Math.round(size * 0.35));

  return (
    <span
      className="thmb"
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        flex: '0 0 auto',
        position: 'relative',
        display: 'inline-block',
      }}
      aria-hidden
    >
      {pictureUrl ? (
        <Image src={pictureUrl} alt="" fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <span
          className="flex size-full items-center justify-center font-[var(--fw-medium)] text-[var(--white)]"
          style={{ backgroundImage: bg, fontSize }}
        />
      )}
    </span>
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
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);

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
    <HtmlModal
      open={open}
      onClose={handleCancel}
      title="Assign to group"
      subtitle={userName ? `Choose a group for ${userName}.` : 'Choose a group for this member.'}
      width={560}
      style={{ maxHeight: 'min(85vh, 640px)', display: 'flex', flexDirection: 'column' }}
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
      footer={
        <>
          <button type="button" className="btn btn-sec" onClick={handleCancel} disabled={isAssigning}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-acc"
            onClick={handleAssign}
            disabled={!selectedOrganizationId || isAssigning}
          >
            {isAssigning ? (
              <Icon name="LoaderCircle" size={17} className="animate-spin" />
            ) : (
              <Icon name="UserPlus" size={17} />
            )}
            Assign to group
          </button>
        </>
      }
    >
      <div className="ff" style={{ marginBottom: 12 }}>
        <label className="lbl" htmlFor="assign-group-search">
          Search groups
        </label>
        <Input
          id="assign-group-search"
          placeholder="Search by group name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={isAssigning}
          iconLeft="Search"
        />
      </div>

      <div className="list-rows slim-scrollbar min-h-0 flex-1" style={{ maxHeight: 360, overflowY: 'auto' }}>
        {isLoading ? (
          <div className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
            Loading…
          </div>
        ) : error ? (
          <div className="py-8 text-center" style={{ color: 'var(--danger)' }}>
            Error loading groups: {error.message}
          </div>
        ) : filteredOrganizations.length === 0 ? (
          <div className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
            No groups found
          </div>
        ) : (
          filteredOrganizations.map((org) => {
            const isSelected = selectedOrganizationId === org.id;
            return (
              <button
                key={org.id}
                type="button"
                className={`lrow${isSelected ? ' on' : ''}`}
                disabled={isAssigning}
                onClick={() => setSelectedOrganizationId(org.id)}
              >
                <span className={`rd${isSelected ? ' on' : ''}`}>{isSelected ? <i /> : null}</span>
                <OrgAvatar orgId={org.id} pictureUrl={org.picture_url} />
                <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <span className="nm" style={{ display: 'block' }}>
                    {org.name}
                  </span>
                  {org.description ? (
                    <span className="em">{org.description}</span>
                  ) : (
                    <span className="em">No description</span>
                  )}
                </span>
              </button>
            );
          })
        )}
      </div>
    </HtmlModal>
  );
}
