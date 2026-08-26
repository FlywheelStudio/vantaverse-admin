'use client'

import type { ActiveFilter } from './types'
import { Icon } from '@/components/medvanta'

interface ActiveFilterPillsProps {
  pills: ActiveFilter[]
  onRemove: (id: string) => void
  onClearAll?: () => void
  meta?: React.ReactNode
}

export function ActiveFilterPills({ pills, onRemove, onClearAll, meta }: ActiveFilterPillsProps) {
  if (pills.length === 0) return null

  return (
    <div className="row" style={{ gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
      {pills.map((pill) => (
        <span key={pill.id} className="tag tag-b">
          {pill.label}
          <button type="button" aria-label={`Remove ${pill.label}`} onClick={() => onRemove(pill.id)}>
            <Icon name="X" size={13} style={{ strokeWidth: 2.5 }} />
          </button>
        </span>
      ))}
      {onClearAll ? (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClearAll}>
          Clear all
        </button>
      ) : null}
      {meta ? (
        <span className="sp mut" style={{ fontSize: 'var(--text-sm)' }}>
          {meta}
        </span>
      ) : null}
    </div>
  )
}
