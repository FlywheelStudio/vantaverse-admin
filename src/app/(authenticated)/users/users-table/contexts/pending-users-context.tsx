'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import { SetOnboardingStateTarget } from '@/lib/supabase/queries/profiles';

type PendingUsersSource = 'created' | 'existing' | 'failed';

interface PendingUsersUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  source: PendingUsersSource;
  screeningCompleted?: boolean;
  consultationCompleted?: boolean;
}

interface PendingUsersRow extends PendingUsersUser {
  batchId: number;
  isOld: boolean;
}

type AddBatchInput = {
  createdUsers: Array<Omit<PendingUsersUser, 'source'>>;
  existingUsers: Array<Omit<PendingUsersUser, 'source'>>;
  failedUsers?: Array<Omit<PendingUsersUser, 'source'>>;
};

type PendingUsersState = {
  addBatch: (input: AddBatchInput) => void;
  removeUser: (id: string) => void;
  markInvited: (emails: string[]) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  setSelection: (ids: string[]) => void;
  markOnboardingStep: (
    userIds: string[],
    step: SetOnboardingStateTarget,
  ) => void;
  reset: () => void;

  rows: PendingUsersRow[];
  counts: {
    pending: number;
    invited: number;
    activeExisting: number;
  };
  latestBatchId: number | null;
  selectedIds: Set<string>;
};

const PendingUsersContext = createContext<PendingUsersState | null>(null);

type Batch = {
  id: number;
  createdUsers: PendingUsersUser[];
  existingUsers: PendingUsersUser[];
  failedUsers: PendingUsersUser[];
};

export function PendingUsersProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [nextBatchId, setNextBatchId] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const latestBatchId =
    batches.length > 0 ? batches[batches.length - 1]!.id : null;

  const addBatch = (input: AddBatchInput) => {
    const seen = new Set<string>();
    for (const b of batches) {
      for (const u of [...b.createdUsers, ...b.existingUsers]) {
        seen.add(u.email.toLowerCase());
      }
    }

    const createdUsers: PendingUsersUser[] = input.createdUsers
      .map((u) => ({
        ...u,
        email: u.email.toLowerCase().trim(),
        source: 'created' as const,
      }))
      .filter((u) => {
        const key = u.email.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    const existingUsers: PendingUsersUser[] = input.existingUsers
      .map((u) => ({
        ...u,
        email: u.email.toLowerCase().trim(),
        source: 'existing' as const,
      }))
      .filter((u) => {
        const key = u.email.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    const failedUsers: PendingUsersUser[] = (input.failedUsers ?? []).map(
      (u) => ({
        ...u,
        email: u.email.trim(),
        source: 'failed' as const,
        status: 'failed',
      }),
    );

    setBatches((prev) => [
      ...prev,
      {
        id: nextBatchId,
        createdUsers,
        existingUsers,
        failedUsers,
      },
    ]);
    setNextBatchId((v) => v + 1);
  };

  const removeUser = (id: string) => {
    setBatches((prev) =>
      prev
        .map((b) => ({
          ...b,
          createdUsers: b.createdUsers.filter((u) => u.id !== id),
          existingUsers: b.existingUsers.filter((u) => u.id !== id),
          failedUsers: b.failedUsers.filter((u) => u.id !== id),
        }))
        .filter(
          (b) =>
            b.createdUsers.length > 0 ||
            b.existingUsers.length > 0 ||
            b.failedUsers.length > 0,
        ),
    );
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const markInvited = (emails: string[]) => {
    const set = new Set(emails.map((e) => e.toLowerCase().trim()));
    const update = <T extends { email: string; status: string }>(users: T[]) =>
      users.map((u) =>
        set.has(u.email.toLowerCase())
          ? { ...u, status: 'invited' as const }
          : u,
      );
    setBatches((prev) =>
      prev.map((b) => ({
        ...b,
        createdUsers: update(b.createdUsers),
        existingUsers: update(b.existingUsers),
        failedUsers: update(b.failedUsers),
      })),
    );
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const setSelection = (ids: string[]) => {
    setSelectedIds(new Set(ids));
  };

  const markOnboardingStep = (
    userIds: string[],
    step: SetOnboardingStateTarget,
  ) => {
    const ids = new Set(userIds);
    if (!ids.size) return;

    const update = (users: PendingUsersUser[]) =>
      users.map((u) => {
        if (!ids.has(u.id)) return u;

        if (step === 'consultation') {
          // Consultation implies screening was completed first.
          return {
            ...u,
            screeningCompleted: true,
            consultationCompleted: true,
          };
        }

        return {
          ...u,
          screeningCompleted: true,
        };
      });

    setBatches((prev) =>
      prev.map((b) => ({
        ...b,
        createdUsers: update(b.createdUsers),
        existingUsers: update(b.existingUsers),
        failedUsers: update(b.failedUsers),
      })),
    );
  };

  const reset = () => {
    setBatches([]);
    setNextBatchId(1);
    setSelectedIds(new Set());
  };

  const rows: PendingUsersRow[] = useMemo(() => {
    if (batches.length === 0) return [];
    const latest = latestBatchId;
    const ordered = [...batches].reverse();
    const out: PendingUsersRow[] = [];
    for (const b of ordered) {
      const isOld = latest !== null && b.id !== latest;
      for (const u of [
        ...b.createdUsers,
        ...b.existingUsers,
        ...b.failedUsers,
      ]) {
        out.push({ ...u, batchId: b.id, isOld });
      }
    }
    return out;
  }, [batches, latestBatchId]);

  const counts = useMemo(() => {
    let pending = 0;
    let invited = 0;
    let activeExisting = 0;

    for (const r of rows) {
      const status = (r.status || '').toLowerCase();
      if (status === 'pending') pending++;
      if (status === 'invited') invited++;
      if (r.source === 'existing') activeExisting++;
    }

    return { pending, invited, activeExisting };
  }, [rows]);

  const value: PendingUsersState = {
    addBatch,
    removeUser,
    markInvited,
    toggleSelection,
    clearSelection,
    setSelection,
    markOnboardingStep,
    reset,
    rows,
    counts,
    latestBatchId,
    selectedIds,
  };

  return (
    <PendingUsersContext.Provider value={value}>
      {children}
    </PendingUsersContext.Provider>
  );
}

export function usePendingUsers() {
  const ctx = useContext(PendingUsersContext);
  if (!ctx)
    throw new Error('usePendingUsers must be used within PendingUsersProvider');
  return ctx;
}
