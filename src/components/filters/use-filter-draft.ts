'use client'

import { useCallback, useState } from 'react'

interface UseFilterDraftOptions<T> {
  initial: T
  removeFilter: (state: T, id: string) => T
}

export function useFilterDraft<T>({ initial, removeFilter }: UseFilterDraftOptions<T>) {
  const [applied, setApplied] = useState<T>(initial)
  const [staged, setStaged] = useState<T>(initial)
  const [open, setOpen] = useState(false)

  const apply = useCallback(() => {
    setApplied(staged)
    setOpen(false)
  }, [staged])

  const clearAll = useCallback(() => {
    setApplied(initial)
    setStaged(initial)
    setOpen(false)
  }, [initial])

  const removePill = useCallback(
    (id: string) => {
      const next = removeFilter(applied, id)
      setApplied(next)
      setStaged(next)
    },
    [applied, removeFilter],
  )

  return { applied, staged, setStaged, open, setOpen, apply, clearAll, removePill }
}
