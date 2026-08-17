'use client';

import { PlaceholderBlock } from '@/components/medvanta/shell';
import { Icon } from '@/components/medvanta';

/** Layout-only notes tab — no notes backend wired. */
export function MemberNotesTab(): React.ReactElement {
  return (
    <div style={{ maxWidth: 760 }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <label className="lbl">Add a note</label>
        <textarea
          className="ta"
          rows={3}
          placeholder="Clinical observations, adjustments, anything the next physiologist should know…"
          disabled
        />
        <div className="row" style={{ marginTop: 12 }}>
          <span className="hint row" style={{ gap: 5, margin: 0 }}>
            <Icon name="Lock" size={12} />
            Staff only — never shown to the member.
          </span>
          <span className="sp">
            <button type="button" className="btn btn-pri btn-sm" disabled>
              Save note
            </button>
          </span>
        </div>
      </div>

      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <span className="ovl">Records</span>
        <button type="button" className="btn btn-sec" disabled>
          <Icon name="Funnel" size={16} />
          Filters
        </button>
      </div>

      <PlaceholderBlock title="Clinical notes">
        <div className="empty" style={{ padding: '32px 24px' }}>
          <div className="ei">
            <Icon name="NotebookPen" size={24} />
          </div>
          <div className="et">Notes coming soon</div>
          <div className="es">
            Layout placeholder only — notes backend is not wired in this migration
            pass.
          </div>
        </div>
      </PlaceholderBlock>
    </div>
  );
}
