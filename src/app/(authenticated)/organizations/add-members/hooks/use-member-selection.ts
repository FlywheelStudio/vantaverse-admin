import { useState, useMemo, useEffect, useRef, startTransition } from 'react';

export function useMemberSelection(initialMemberIds: Set<string>) {
  // Initialize from initialMemberIds, will be synced via useEffect when it changes
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    () => new Set(initialMemberIds),
  );

  // Sync selectedUserIds when initialMemberIds changes
  // Serialize Set to array for reliable dependency comparison
  const initialIdsKey = useMemo(
    () => Array.from(initialMemberIds).sort().join(','),
    [initialMemberIds],
  );

  const prevKeyRef = useRef(initialIdsKey);

  useEffect(() => {
    // Only update when the key actually changes (prop change, not user interaction)
    if (prevKeyRef.current !== initialIdsKey) {
      prevKeyRef.current = initialIdsKey;
      startTransition(() => {
        setSelectedUserIds(new Set(initialMemberIds));
      });
    }
  }, [initialMemberIds, initialIdsKey]);

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleToggleGroup = (userIds: string[]) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      const allSelected = userIds.every((id) => next.has(id));

      if (allSelected) {
        // Deselect all
        userIds.forEach((id) => next.delete(id));
      } else {
        // Select all
        userIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const hasChanges = useMemo(() => {
    if (selectedUserIds.size !== initialMemberIds.size) return true;
    for (const id of selectedUserIds) {
      if (!initialMemberIds.has(id)) return true;
    }
    for (const id of initialMemberIds) {
      if (!selectedUserIds.has(id)) return true;
    }
    return false;
  }, [selectedUserIds, initialMemberIds]);

  const initialCount = initialMemberIds.size;
  const newMemberCount = selectedUserIds.size;
  const countChange = newMemberCount - initialCount;

  const resetSelection = () => {
    setSelectedUserIds(new Set(initialMemberIds));
  };

  return {
    selectedUserIds,
    handleToggleUser,
    handleToggleGroup,
    hasChanges,
    initialCount,
    newMemberCount,
    countChange,
    resetSelection,
  };
}
