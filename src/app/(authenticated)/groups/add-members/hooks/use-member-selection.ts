import { useState, useMemo, useEffect, useRef, startTransition } from 'react';
import type { MemberRole } from '../types';

interface UseMemberSelectionParams {
  initialMemberIds: Set<string>;
  initialPhysiologistId?: string | null;
}

export function useMemberSelection({
  initialMemberIds,
  initialPhysiologistId,
}: UseMemberSelectionParams) {
  // Separate selections for members and physiologist
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
    () => new Set(initialMemberIds),
  );
  const [selectedPhysiologistId, setSelectedPhysiologistId] = useState<
    string | null
  >(initialPhysiologistId || null);

  // Sync selectedMemberIds when initialMemberIds changes
  const initialIdsKey = useMemo(
    () => Array.from(initialMemberIds).sort().join(','),
    [initialMemberIds],
  );

  const prevKeyRef = useRef(initialIdsKey);

  useEffect(() => {
    if (prevKeyRef.current !== initialIdsKey) {
      prevKeyRef.current = initialIdsKey;
      startTransition(() => {
        setSelectedMemberIds(new Set(initialMemberIds));
      });
    }
  }, [initialMemberIds, initialIdsKey]);

  // Sync physiologist when it changes
  useEffect(() => {
    startTransition(() => {
      setSelectedPhysiologistId(initialPhysiologistId || null);
    });
  }, [initialPhysiologistId]);

  const handleToggleUser = (userId: string, role: MemberRole) => {
    if (role === 'patient') {
      setSelectedMemberIds((prev) => {
        const next = new Set(prev);
        if (next.has(userId)) {
          next.delete(userId);
        } else {
          next.add(userId);
        }
        return next;
      });
    } else if (role === 'admin') {
      // For physiologist, only one can be selected
      setSelectedPhysiologistId((prev) => (prev === userId ? null : userId));
    }
  };

  const handleToggleGroup = (userIds: string[], role: MemberRole) => {
    if (role === 'patient') {
      setSelectedMemberIds((prev) => {
        const next = new Set(prev);
        const allSelected = userIds.every((id) => next.has(id));

        if (allSelected) {
          userIds.forEach((id) => next.delete(id));
        } else {
          userIds.forEach((id) => next.add(id));
        }
        return next;
      });
    }
    // Groups don't apply to physiologist (single selection only)
  };

  const hasChanges = (role: MemberRole): boolean => {
    if (role === 'patient') {
      const current = selectedMemberIds;
      if (current.size !== initialMemberIds.size) return true;

      for (const id of current) {
        if (!initialMemberIds.has(id)) return true;
      }

      for (const id of initialMemberIds) {
        if (!current.has(id)) return true;
      }

      return false;
    }

    // For physiologist, compare with initial
    return selectedPhysiologistId !== (initialPhysiologistId || null);
  };

  const initialCount = initialMemberIds.size;
  const newMemberCount = selectedMemberIds.size;
  const countChange = newMemberCount - initialCount;

  const resetSelection = () => {
    setSelectedMemberIds(new Set(initialMemberIds));
    setSelectedPhysiologistId(initialPhysiologistId || null);
  };

  const clearAll = (role: MemberRole) => {
    if (role === 'patient') {
      setSelectedMemberIds(new Set());
    } else {
      setSelectedPhysiologistId(null);
    }
  };

  return {
    selectedMemberIds,
    selectedPhysiologistId,
    handleToggleUser,
    handleToggleGroup,
    hasChanges,
    initialCount,
    newMemberCount,
    countChange,
    resetSelection,
    clearAll,
  };
}
