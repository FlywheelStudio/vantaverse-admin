'use client';

import { Icon } from '@/components/medvanta';
import { Avatar } from '@/components/widgets/avatar';

const MOCK_NOTES = [
  {
    id: '1',
    author: 'Abbas Vajihi',
    when: '2 days ago',
    body: 'Cleared for program assignment after consultation. Prefer mornings; low back flare with prolonged sitting.',
  },
  {
    id: '2',
    author: 'Abbas Vajihi',
    when: '5 days ago',
    body: 'Intake survey reviewed — prioritise thoracic mobility and glute activation in week 1.',
  },
];

/** Notes tab chrome matches HTML; list is mock until notes backend exists. */
export function MemberNotesTab({
  onOpenIntake,
}: {
  onOpenIntake?: () => void;
}): React.ReactElement {
  return (
    <div style={{ maxWidth: 760 }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <label className="lbl" htmlFor="member-note-draft">
          Add a note
        </label>
        <textarea
          id="member-note-draft"
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
            <button type="button" className="btn btn-pri btn-sm" disabled title="Notes backend not wired">
              Save note
            </button>
          </span>
        </div>
      </div>

      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <span className="ovl">Records</span>
        <button type="button" className="btn btn-sec" disabled title="Placeholder">
          <Icon name="Funnel" size={16} />
          Filters
        </button>
      </div>

      <div className="card card-flush" style={{ marginBottom: 12 }}>
        <button
          type="button"
          className="row"
          style={{
            width: '100%',
            gap: 12,
            padding: '14px 18px',
            border: 'none',
            background: 'transparent',
            cursor: onOpenIntake ? 'pointer' : 'default',
            textAlign: 'left',
          }}
          onClick={onOpenIntake}
          disabled={!onOpenIntake}
        >
          <span
            className="row"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--cyan-50)',
              color: 'var(--cyan-700)',
              justifyContent: 'center',
              flex: '0 0 auto',
            }}
          >
            <Icon name="ClipboardList" size={18} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: 'block',
                fontWeight: 'var(--fw-semibold)',
                fontSize: 'var(--text-sm)',
              }}
            >
              Intake survey (read-only)
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Gate 1 answers — open for staff review
            </span>
          </span>
          <Icon name="ChevronRight" size={16} style={{ color: 'var(--text-faint)' }} />
        </button>
      </div>

      <div className="card card-flush">
        {MOCK_NOTES.map((note, index) => (
          <div
            key={note.id}
            className="row"
            style={{
              gap: 12,
              alignItems: 'flex-start',
              padding: '16px 18px',
              borderBottom:
                index < MOCK_NOTES.length - 1
                  ? '1px solid var(--border-subtle)'
                  : undefined,
            }}
          >
            <Avatar name={note.author} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 'var(--fw-semibold)', fontSize: 'var(--text-sm)' }}>
                  {note.author}
                </span>
                <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>
                  {note.when}
                </span>
                <span className="bdg" style={{ marginLeft: 'auto' }}>
                  Mock
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-body)',
                  lineHeight: 1.45,
                }}
              >
                {note.body}
              </p>
            </div>
          </div>
        ))}
        <div
          style={{
            padding: '12px 18px',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          Mock notes for layout parity — clinical notes CRUD is not wired.
        </div>
      </div>
    </div>
  );
}
