'use client';

import { PlaceholderBlock } from '@/components/medvanta/shell';
import { Icon } from '@/components/medvanta';

/** Settings tab placeholder — domain/logo/booking settings omitted per spec. */
export function GroupSettingsPlaceholder({
  groupName,
}: {
  groupName: string;
}): React.ReactElement {
  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 16 }}>
      <PlaceholderBlock title="Group settings" className="card">
        <div className="ff">
          <label className="lbl">
            Group name<span className="req">*</span>
          </label>
          <span className="fld ro">
            <input value={groupName} readOnly disabled />
          </span>
        </div>
        <div className="ff">
          <label className="lbl">Email domain</label>
          <span className="fld ro">
            <Icon name="AtSign" size={16} />
            <input
              className="mono"
              style={{ fontFamily: 'var(--font-mono)' }}
              value=""
              placeholder="Not configured"
              readOnly
              disabled
            />
          </span>
          <div className="hint">
            Domain-based auto-assignment is not available in this build.
          </div>
        </div>
        <div style={{ marginBottom: 0 }}>
          <label className="lbl">Description</label>
          <textarea
            className="ta"
            rows={2}
            readOnly
            disabled
            placeholder="Placeholder — data not available"
          />
        </div>
      </PlaceholderBlock>
      </div>

      <PlaceholderBlock title="Group logo" className="card">
        <div className="row" style={{ gap: 14 }}>
          <span
            className="thmb gr"
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-sm)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="Building2" size={24} />
          </span>
          <span>
            <button type="button" className="btn btn-sec btn-sm" disabled>
              <Icon name="Upload" size={15} />
              Upload a logo
            </button>
            <div className="hint">Logo management is not available in this build.</div>
          </span>
        </div>
      </PlaceholderBlock>
    </div>
  );
}
