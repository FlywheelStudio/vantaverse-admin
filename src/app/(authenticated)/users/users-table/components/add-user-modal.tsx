'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { Avatar, Icon, Tooltip } from '@/components/medvanta';
import { HtmlModal } from '@/app/(authenticated)/users/[id]/partials/intake-survey-placeholder-modal';
import { Combobox } from '@/components/ui/combobox';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import {
  searchOrganizations,
  type OrganizationOption,
} from '@/lib/supabase/queries/organization-search';
import { MemberRole } from '@/lib/supabase/schemas/organization-members';

import {
  sendInviteBatch,
  type ImportUsersResult,
  type InviteBatchItem,
} from '../../actions';
import { FileUploadTab } from './file-upload-tab';
import {
  CHOOSE_GROUP_VALUE,
  KEEP_GROUP_VALUE,
  KEEP_ONBOARDING_VALUE,
  KEEP_ROLE_VALUE,
  INVITE_ONBOARDING_OPTIONS,
  INVITE_ROLE_OPTIONS,
  createInviteeFromEmail,
  parseInviteEmails,
  type InviteOnboarding,
  type InviteRole,
  type Invitee,
} from './invite-mock-data';

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: MemberRole;
  title?: string;
}

type InviteMode = 'type' | 'paste' | 'csv';

function inviteeDisplayName(invitee: Invitee): string {
  const name = [invitee.firstName, invitee.lastName].filter(Boolean).join(' ');
  if (name) return name;
  return invitee.email.split('@')[0] || invitee.email;
}

function InviteSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}): React.ReactElement {
  return (
    <Combobox
      className="w-full"
      options={options}
      value={value || undefined}
      onValueChange={(next) => onChange(next ?? '')}
      placeholder={placeholder ?? 'Select…'}
      searchPlaceholder="Search…"
      emptyMessage="No option found."
      filterLocally
    />
  );
}

function OrgPicker({
  value,
  label,
  onChange,
  placeholder = 'Choose group',
}: {
  value: string | null;
  label: string | null;
  onChange: (id: string | null, name: string | null) => void;
  placeholder?: string;
}): React.ReactElement {
  const [searchInput, setSearchInput] = useState('');
  const [options, setOptions] = useState<OrganizationOption[]>([]);
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    let cancelled = false;
    void searchOrganizations(debouncedSearch).then((orgs) => {
      if (!cancelled) setOptions(orgs);
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  const comboboxOptions = useMemo(() => {
    const mapped = options.map((o) => ({ value: o.id, label: o.name }));
    if (value && label && !mapped.some((o) => o.value === value)) {
      return [{ value, label }, ...mapped];
    }
    return mapped;
  }, [options, value, label]);

  return (
    <Combobox
      className="w-full"
      options={comboboxOptions}
      value={value ?? undefined}
      onValueChange={(next) => {
        if (!next) {
          onChange(null, null);
          return;
        }
        const match = comboboxOptions.find((o) => o.value === next);
        onChange(next, match?.label ?? null);
      }}
      placeholder={placeholder}
      searchPlaceholder="Search groups…"
      emptyMessage="No group found."
      filterLocally={false}
      onSearchChange={setSearchInput}
    />
  );
}

function TypeComposeFields({
  email,
  firstName,
  lastName,
  onEmailChange,
  onFirstNameChange,
  onLastNameChange,
  onAdd,
}: {
  email: string;
  firstName: string;
  lastName: string;
  onEmailChange: (value: string) => void;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onAdd: () => void;
}): React.ReactElement {
  return (
    <div className="g g2" style={{ alignItems: 'end' }}>
      <div style={{ gridColumn: '1 / -1' }}>
        <label className="lbl" htmlFor="invite-compose-email">
          Email
        </label>
        <div className="fld">
          <Icon name="Mail" size={15} />
          <input
            id="invite-compose-email"
            placeholder="name@practice.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onAdd();
              }
            }}
          />
        </div>
      </div>
      <div>
        <label className="lbl" htmlFor="invite-compose-first">
          First name (optional)
        </label>
        <div className="fld">
          <input
            id="invite-compose-first"
            placeholder="First name"
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="lbl" htmlFor="invite-compose-last">
          Last name (optional)
        </label>
        <div className="fld">
          <input
            id="invite-compose-last"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
          />
        </div>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <button
          type="button"
          className="btn btn-sec btn-sm"
          onClick={onAdd}
          disabled={!email.trim()}
        >
          <Icon name="Plus" size={15} />
          Add
        </button>
      </div>
    </div>
  );
}

/**
 * Compose + send invitations for members or admins.
 * Staging is local; Send creates users, assigns org, emails.
 */
export function AddUserModal({
  open,
  onOpenChange,
  role = 'patient',
  title,
}: AddUserModalProps): React.ReactElement {
  const queryClient = useQueryClient();
  const isAdminInvite = role === 'admin';

  const [inviteMode, setInviteMode] = useState<InviteMode>('type');
  const [individualEmail, setIndividualEmail] = useState('');
  const [individualFirstName, setIndividualFirstName] = useState('');
  const [individualLastName, setIndividualLastName] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const [bulkRole, setBulkRole] = useState<string>(KEEP_ROLE_VALUE);
  const [bulkGroup, setBulkGroup] = useState<string>(KEEP_GROUP_VALUE);
  const [bulkGroupName, setBulkGroupName] = useState<string | null>(null);
  const [bulkOnboarding, setBulkOnboarding] = useState<string>(
    KEEP_ONBOARDING_VALUE,
  );

  const defaultRole: InviteRole = isAdminInvite ? 'admin' : 'member';
  const modalTitle =
    title ?? (isAdminInvite ? 'Invite admins' : 'Invite members');

  const selectedInvitees = useMemo(
    () => invitees.filter((inv) => selectedIds.includes(inv.id)),
    [invitees, selectedIds],
  );
  const activeInvitee = useMemo(() => {
    if (selectedInvitees.length === 1) return selectedInvitees[0] ?? null;
    return null;
  }, [selectedInvitees]);
  const isMulti = selectedInvitees.length > 1;
  const missingGroupCount = useMemo(
    () => invitees.filter((inv) => !inv.groupId).length,
    [invitees],
  );
  const canSend = invitees.length > 0 && missingGroupCount === 0 && !sending;

  const resetIndividual = (): void => {
    setIndividualEmail('');
    setIndividualFirstName('');
    setIndividualLastName('');
  };

  const handleClose = (): void => {
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open) {
      setInviteMode('type');
      resetIndividual();
      setPasteText('');
      setInvitees([]);
      setSelectedIds([]);
      setBulkRole(KEEP_ROLE_VALUE);
      setBulkGroup(KEEP_GROUP_VALUE);
      setBulkGroupName(null);
      setBulkOnboarding(KEEP_ONBOARDING_VALUE);
      setSending(false);
    }
  }, [open]);

  const replaceInvitees = (
    next: Invitee[],
    selectIds?: string[],
  ): void => {
    setInvitees(next);
    if (selectIds) setSelectedIds(selectIds);
  };

  const upsertInvitees = (incoming: Invitee[]): Invitee[] => {
    const seen = new Set(invitees.map((p) => p.email.toLowerCase()));
    const added: Invitee[] = [];
    for (const inv of incoming) {
      const key = inv.email.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      added.push(inv);
    }
    if (added.length === 0) return invitees;
    const next = [...invitees, ...added];
    replaceInvitees(
      next,
      added.map((a) => a.id),
    );
    return next;
  };

  const removeInvitee = (id: string): void => {
    const next = invitees.filter((inv) => inv.id !== id);
    replaceInvitees(
      next,
      selectedIds.filter((sid) => sid !== id),
    );
  };

  const handleAddToList = (): void => {
    if (!individualEmail.trim()) {
      toast.error('Email is required');
      return;
    }

    const invitee = createInviteeFromEmail(individualEmail.trim(), {
      firstName: individualFirstName.trim(),
      lastName: individualLastName.trim(),
      role: defaultRole,
    });

    const seen = new Set(invitees.map((p) => p.email.toLowerCase()));
    if (!seen.has(invitee.email)) {
      replaceInvitees([...invitees, invitee], [invitee.id]);
    } else {
      const existing = invitees.find((p) => p.email === invitee.email);
      if (existing) setSelectedIds([existing.id]);
      toast.error('Already in the list');
    }
    resetIndividual();
  };

  const handleParsePaste = (): void => {
    const emails = parseInviteEmails(pasteText);
    if (emails.length === 0) {
      toast.error('No valid emails found');
      return;
    }

    const created = emails.map((email) =>
      createInviteeFromEmail(email, { role: defaultRole }),
    );
    upsertInvitees(created);
    setPasteText('');
    toast.success(
      `Added ${created.length} invitation${created.length === 1 ? '' : 's'}`,
    );
  };

  const handleImported = (result: ImportUsersResult): void => {
    const fromCreated = (result.createdUsers ?? []).map((u) =>
      createInviteeFromEmail(u.email, {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        role: defaultRole,
      }),
    );
    const fromExisting = (result.existingUsers ?? []).map((u) =>
      createInviteeFromEmail(u.email, {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        role: defaultRole,
      }),
    );
    const staged = [...fromCreated, ...fromExisting];
    if (staged.length === 0) {
      toast.error('No valid rows to stage');
      return;
    }
    upsertInvitees(staged);
    if (result.errors.length > 0) {
      toast.error(
        `${result.errors.length} issue${result.errors.length > 1 ? 's' : ''} in file`,
      );
    } else {
      toast.success(
        `Staged ${staged.length} invitation${staged.length === 1 ? '' : 's'}`,
      );
    }
  };

  const handleSingleFieldChange = (
    field: keyof Invitee,
    value: string,
  ): void => {
    if (!activeInvitee) return;
    setInvitees((prev) =>
      prev.map((inv) => {
        if (inv.id !== activeInvitee.id) return inv;
        if (field === 'role') {
          return { ...inv, role: value as InviteRole };
        }
        if (field === 'onboarding') {
          return { ...inv, onboarding: value as InviteOnboarding };
        }
        if (field === 'groupId') {
          return inv;
        }
        if (field === 'firstName' || field === 'lastName' || field === 'email') {
          return { ...inv, [field]: value };
        }
        return inv;
      }),
    );
  };

  const handleActiveGroupChange = (
    groupId: string | null,
    groupName: string | null,
  ): void => {
    if (!activeInvitee) return;
    setInvitees((prev) =>
      prev.map((inv) =>
        inv.id === activeInvitee.id
          ? { ...inv, groupId, groupName }
          : inv,
      ),
    );
  };

  const handleApplyBulk = (): void => {
    if (selectedInvitees.length === 0) return;
    setInvitees((prev) =>
      prev.map((inv) => {
        if (!selectedIds.includes(inv.id)) return inv;
        let next = { ...inv };
        if (!isAdminInvite && bulkRole !== KEEP_ROLE_VALUE) {
          next = { ...next, role: bulkRole as InviteRole };
        }
        if (bulkGroup !== KEEP_GROUP_VALUE) {
          next = {
            ...next,
            groupId: bulkGroup || null,
            groupName: bulkGroup ? bulkGroupName : null,
          };
        }
        if (!isAdminInvite && bulkOnboarding !== KEEP_ONBOARDING_VALUE) {
          next = {
            ...next,
            onboarding: bulkOnboarding as InviteOnboarding,
          };
        }
        return next;
      }),
    );
    toast.success('Applied to selection');
  };

  const handleSelectAll = (): void => {
    setSelectedIds(invitees.map((inv) => inv.id));
  };

  const handleClearSelection = (): void => {
    setSelectedIds([]);
  };

  const handleSend = async (): Promise<void> => {
    if (!canSend) return;
    setSending(true);
    try {
      const items: InviteBatchItem[] = invitees.map((inv) => ({
        email: inv.email,
        firstName: inv.firstName,
        lastName: inv.lastName,
        organizationId: inv.groupId!,
        existingUserId:
          inv.id.startsWith('invite-') || inv.id.startsWith('staged:')
            ? undefined
            : inv.id.startsWith('missing:')
              ? undefined
              : inv.id,
        onboarding: inv.role === 'admin' ? undefined : inv.onboarding,
        asAdmin: isAdminInvite || inv.role === 'admin',
      }));

      const result = await sendInviteBatch(items, isAdminInvite);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const { created, invited, failed } = result.data;
      if (invited > 0) {
        toast.success(
          `Sent ${invited} invitation${invited === 1 ? '' : 's'}${
            created > 0 ? ` (${created} new)` : ''
          }${failed.length > 0 ? `; ${failed.length} failed` : ''}`,
        );
      } else if (failed.length > 0) {
        toast.error(
          `All invitations failed: ${failed[0]?.error ?? 'Unknown error'}`,
        );
      }

      if (failed.length > 0 && invited > 0) {
        const failedEmails = new Set(failed.map((f) => f.email.toLowerCase()));
        setInvitees((prev) =>
          prev.filter((inv) => failedEmails.has(inv.email.toLowerCase())),
        );
        setSelectedIds([]);
      } else if (failed.length === 0) {
        queryClient.invalidateQueries({ queryKey: ['users'] });
        handleClose();
      } else {
        queryClient.invalidateQueries({ queryKey: ['users'] });
      }
    } catch (error) {
      console.error('Error sending invitations:', error);
      toast.error('Failed to send invitations');
    } finally {
      setSending(false);
    }
  };

  const footerInfoNode =
    missingGroupCount > 0 ? (
      <span className="mut" style={{ fontSize: 'var(--text-xs)' }}>
        {missingGroupCount} missing a group
      </span>
    ) : invitees.length > 0 ? (
      <span className="mut" style={{ fontSize: 'var(--text-xs)' }}>
        {invitees.length} ready to send
      </span>
    ) : null;

  const showTypeCompose =
    inviteMode === 'type' &&
    (invitees.length === 0 || selectedInvitees.length === 0);

  return (
    <HtmlModal
      open={open}
      onClose={handleClose}
      title={modalTitle}
      subtitle={
        isAdminInvite
          ? 'Add admins by email, assign a group, then send invitations.'
          : 'Add people by email, assign a group, then send invitations.'
      }
      width={920}
      style={{
        height: 'min(660px, calc(100dvh - 56px))',
        display: 'flex',
        flexDirection: 'column',
      }}
      flushBody
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
      footerInfo={footerInfoNode}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={handleClose}>
            Cancel
          </button>
          <button
            type="button"
            className={cn('btn btn-acc', !canSend && 'dis')}
            disabled={!canSend}
            onClick={() => void handleSend()}
          >
            {sending ? (
              <Icon name="LoaderCircle" size={17} className="animate-spin" />
            ) : (
              <Icon name="Send" size={17} />
            )}
            {invitees.length > 0
              ? `Send ${invitees.length} invitations`
              : 'Send invitations'}
          </button>
        </>
      }
    >
      <div
        className="dual"
        style={{ gridTemplateColumns: '352px minmax(0,1fr)' }}
      >
        <div
          className="slim-scrollbar"
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            borderRight: '1px solid var(--border-subtle)',
            background: 'var(--slate-50)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 16px 12px', flexShrink: 0 }}>
            <span
              className="seg"
              style={{ width: '100%', marginBottom: 12, display: 'flex' }}
            >
              {(
                [
                  ['type', 'Type'],
                  ['paste', 'Paste'],
                  ['csv', 'CSV'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={inviteMode === id ? 'on' : undefined}
                  style={{ flex: 1, padding: '0 8px' }}
                  onClick={() => setInviteMode(id)}
                >
                  {label}
                </button>
              ))}
            </span>

            {inviteMode === 'type' ? (
              <div className="hint">
                Use the form on the right to add people one at a time.
              </div>
            ) : null}

            {inviteMode === 'paste' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea
                  className="slim-scrollbar"
                  placeholder="Paste emails, one per line or comma-separated"
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={8}
                  style={{
                    width: '100%',
                    resize: 'vertical',
                    minHeight: 120,
                    maxHeight: 220,
                  }}
                />
                <button
                  type="button"
                  className="btn btn-sec btn-sm"
                  disabled={!pasteText.trim()}
                  onClick={handleParsePaste}
                >
                  Parse paste
                </button>
              </div>
            ) : null}

            {inviteMode === 'csv' ? (
              <div className="slim-scrollbar" style={{ overflowY: 'auto', maxHeight: '100%' }}>
                <FileUploadTab
                  fileType="csv"
                  onImported={handleImported}
                  onCancel={() => setInviteMode('type')}
                />
              </div>
            ) : null}
          </div>

          <div
            className="slim-scrollbar"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              padding: '0 12px 12px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 12,
                marginBottom: 8,
              }}
            >
              <span
                className="mut"
                style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}
              >
                Invitees ({invitees.length})
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="lnk"
                  style={{
                    fontSize: 'var(--text-xs)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onClick={handleSelectAll}
                  disabled={invitees.length === 0}
                >
                  Select all
                </button>
                <button
                  type="button"
                  className="lnk"
                  style={{
                    fontSize: 'var(--text-xs)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onClick={handleClearSelection}
                >
                  Clear
                </button>
              </div>
            </div>

            {invitees.length === 0 ? (
              <div className="mut" style={{ fontSize: 'var(--text-sm)', padding: 8 }}>
                No one staged yet.
              </div>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {invitees.map((inv) => {
                  const incomplete = !inv.groupId;
                  const selected = selectedIds.includes(inv.id);
                  const hasName = Boolean(inv.firstName || inv.lastName);
                  return (
                    <li key={inv.id}>
                      <button
                        type="button"
                        className={cn('inv-row', selected && 'on')}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: 'none',
                          background: selected
                            ? 'var(--surface-card)'
                            : 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        onClick={() => {
                          if (selected && selectedIds.length === 1) {
                            setSelectedIds([]);
                            return;
                          }
                          setSelectedIds([inv.id]);
                        }}
                      >
                        <Avatar
                          name={inviteeDisplayName(inv)}
                          size="sm"
                        />
                        <span style={{ minWidth: 0, flex: 1 }}>
                          <span
                            style={{
                              display: 'block',
                              fontWeight: 600,
                              fontSize: 'var(--text-sm)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {hasName
                              ? [inv.firstName, inv.lastName]
                                  .filter(Boolean)
                                  .join(' ')
                              : inv.email}
                          </span>
                          {hasName ? (
                            <span
                              className="mut"
                              style={{
                                fontSize: 'var(--text-xs)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block',
                              }}
                            >
                              {inv.email}
                            </span>
                          ) : null}
                          {inv.groupName ? (
                            <span
                              className="mut"
                              style={{ fontSize: 'var(--text-xs)' }}
                            >
                              {inv.groupName}
                            </span>
                          ) : null}
                        </span>
                        {incomplete ? (
                          <Tooltip label="No group assigned" placement="top">
                            <span
                              className="warn"
                              style={{ display: 'inline-flex', flexShrink: 0 }}
                              aria-label="No group assigned"
                            >
                              <Icon name="TriangleAlert" size={15} />
                            </span>
                          </Tooltip>
                        ) : null}
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={`Remove ${inv.email}`}
                          style={{
                            display: 'inline-flex',
                            padding: 4,
                            flexShrink: 0,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeInvitee(inv.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              removeInvitee(inv.id);
                            }
                          }}
                        >
                          <Icon name="X" size={14} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div
          className="slim-scrollbar"
          style={{
            padding: 20,
            overflowY: 'auto',
            minHeight: 0,
          }}
        >
          {inviteMode === 'type' && invitees.length > 0 ? (
            <div style={{ marginBottom: 16 }}>
              <TypeComposeFields
                email={individualEmail}
                firstName={individualFirstName}
                lastName={individualLastName}
                onEmailChange={setIndividualEmail}
                onFirstNameChange={setIndividualFirstName}
                onLastNameChange={setIndividualLastName}
                onAdd={handleAddToList}
              />
            </div>
          ) : null}

          {inviteMode === 'type' && invitees.length === 0 ? (
            <TypeComposeFields
              email={individualEmail}
              firstName={individualFirstName}
              lastName={individualLastName}
              onEmailChange={setIndividualEmail}
              onFirstNameChange={setIndividualFirstName}
              onLastNameChange={setIndividualLastName}
              onAdd={handleAddToList}
            />
          ) : null}

          {isMulti ? (
            <div>
              <h3
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                Edit {selectedInvitees.length} selected
              </h3>
              <p className="mut" style={{ fontSize: 'var(--text-xs)', marginBottom: 12 }}>
                Set a group for everyone selected
                {!isAdminInvite ? ', plus role and onboarding if needed' : ''}.
              </p>
              <div className="g g2">
                <div>
                  <label className="lbl">Group</label>
                  <OrgPicker
                    value={
                      bulkGroup === KEEP_GROUP_VALUE || !bulkGroup
                        ? null
                        : bulkGroup
                    }
                    label={bulkGroupName}
                    onChange={(id, name) => {
                      setBulkGroup(id ?? CHOOSE_GROUP_VALUE);
                      setBulkGroupName(name);
                    }}
                    placeholder="Set group for selection"
                  />
                </div>
                {!isAdminInvite ? (
                  <>
                    <div>
                      <label className="lbl">Role</label>
                      <InviteSelect
                        value={bulkRole}
                        onChange={setBulkRole}
                        options={[
                          { value: KEEP_ROLE_VALUE, label: 'Keep each role' },
                          ...INVITE_ROLE_OPTIONS.map((o) => ({
                            value: o.value,
                            label: o.label,
                          })),
                        ]}
                      />
                    </div>
                    <div>
                      <label className="lbl">Onboarding</label>
                      <InviteSelect
                        value={bulkOnboarding}
                        onChange={setBulkOnboarding}
                        options={[
                          {
                            value: KEEP_ONBOARDING_VALUE,
                            label: 'Keep each path',
                          },
                          ...INVITE_ONBOARDING_OPTIONS.map((o) => ({
                            value: o.value,
                            label: o.label,
                          })),
                        ]}
                      />
                    </div>
                  </>
                ) : null}
              </div>
              <button
                type="button"
                className="btn btn-sec btn-sm"
                style={{ marginTop: 12 }}
                onClick={handleApplyBulk}
              >
                Apply to selection
              </button>
            </div>
          ) : null}

          {activeInvitee && !isMulti ? (
            <div>
              <h3
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  marginBottom: 12,
                }}
              >
                {inviteeDisplayName(activeInvitee)}
              </h3>
              <div className="g g2">
                <div>
                  <label className="lbl" htmlFor="invite-first">
                    First name
                  </label>
                  <div className="fld">
                    <input
                      id="invite-first"
                      value={activeInvitee.firstName}
                      onChange={(e) =>
                        handleSingleFieldChange('firstName', e.target.value)
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="lbl" htmlFor="invite-last">
                    Last name
                  </label>
                  <div className="fld">
                    <input
                      id="invite-last"
                      value={activeInvitee.lastName}
                      onChange={(e) =>
                        handleSingleFieldChange('lastName', e.target.value)
                      }
                    />
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="lbl" htmlFor="invite-email">
                    Email
                  </label>
                  <div className="fld">
                    <input
                      id="invite-email"
                      value={activeInvitee.email}
                      onChange={(e) =>
                        handleSingleFieldChange('email', e.target.value)
                      }
                    />
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="lbl">Group</label>
                  <OrgPicker
                    value={activeInvitee.groupId}
                    label={activeInvitee.groupName}
                    onChange={handleActiveGroupChange}
                  />
                </div>
                {!isAdminInvite ? (
                  <>
                    <div>
                      <label className="lbl">Role</label>
                      <InviteSelect
                        value={activeInvitee.role}
                        onChange={(value) =>
                          handleSingleFieldChange('role', value)
                        }
                        options={INVITE_ROLE_OPTIONS.map((o) => ({
                          value: o.value,
                          label: o.label,
                        }))}
                      />
                    </div>
                    <div>
                      <label className="lbl">Onboarding</label>
                      <InviteSelect
                        value={activeInvitee.onboarding}
                        onChange={(value) =>
                          handleSingleFieldChange('onboarding', value)
                        }
                        options={INVITE_ONBOARDING_OPTIONS.map((o) => ({
                          value: o.value,
                          label: o.label,
                        }))}
                      />
                    </div>
                  </>
                ) : (
                  <div className="mut" style={{ fontSize: 'var(--text-xs)' }}>
                    Role locked to admin. Admins skip onboarding.
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {!activeInvitee &&
          !isMulti &&
          invitees.length > 0 &&
          inviteMode !== 'type' ? (
            <div className="mut" style={{ fontSize: 'var(--text-sm)' }}>
              Select someone on the left to edit their group
              {!isAdminInvite ? ', role, and onboarding' : ''}.
            </div>
          ) : null}

          {!showTypeCompose &&
          invitees.length === 0 &&
          inviteMode !== 'type' ? (
            <div className="mut" style={{ fontSize: 'var(--text-sm)' }}>
              Stage invitees from Paste or CSV, assign groups, then send.
            </div>
          ) : null}
        </div>
      </div>
    </HtmlModal>
  );
}
