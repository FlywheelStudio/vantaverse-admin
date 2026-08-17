'use client';

import { useState } from 'react';
import { Icon } from '@/components/medvanta';
import { HtmlModal } from '@/app/(authenticated)/users/[id]/partials/intake-survey-placeholder-modal';

interface UpdateDerivedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (updateDerived: boolean) => void;
  loading?: boolean;
}

export function UpdateDerivedDialog({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: UpdateDerivedDialogProps): React.ReactElement {
  const [updateDerived, setUpdateDerived] = useState(false);

  const handleConfirm = (): void => {
    onConfirm(updateDerived);
    setUpdateDerived(false);
  };

  const handleCancel = (): void => {
    onOpenChange(false);
    setUpdateDerived(false);
  };

  return (
    <HtmlModal
      open={open}
      title="Update active programs?"
      subtitle="This template is shared. Choose whether changes apply only here or to assigned programs too."
      onClose={handleCancel}
      width={520}
      footer={
        <>
          <button type="button" className="btn btn-sec" onClick={handleCancel} disabled={loading}>
            Cancel
          </button>
          <button type="button" className="btn btn-pri" onClick={handleConfirm} disabled={loading}>
            {loading ? (
              <Icon name="LoaderCircle" size={17} className="animate-spin" />
            ) : (
              <Icon name="Save" size={17} />
            )}
            Save
          </button>
        </>
      }
    >
      <div className="g g1" style={{ gap: 10 }}>
        <button
          type="button"
          className={`choice${!updateDerived ? ' on' : ''}`}
          disabled={loading}
          onClick={() => setUpdateDerived(false)}
        >
          <span className={`rd${!updateDerived ? ' on' : ''}`}>{!updateDerived ? <i /> : null}</span>
          <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <span
              style={{
                display: 'block',
                fontSize: 'var(--text-md)',
                fontWeight: 'var(--fw-semibold)',
                color: 'var(--text-strong)',
              }}
            >
              Template only
            </span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              Save changes to this template without updating active member programs.
            </span>
          </span>
        </button>
        <button
          type="button"
          className={`choice${updateDerived ? ' on' : ''}`}
          disabled={loading}
          onClick={() => setUpdateDerived(true)}
        >
          <span className={`rd${updateDerived ? ' on' : ''}`}>{updateDerived ? <i /> : null}</span>
          <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <span
              style={{
                display: 'block',
                fontSize: 'var(--text-md)',
                fontWeight: 'var(--fw-semibold)',
                color: 'var(--text-strong)',
              }}
            >
              Template + active programs
            </span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              Push this schedule to all active programs derived from this template.
            </span>
          </span>
        </button>
      </div>

      {updateDerived ? (
        <div className="alert alert-w" style={{ marginTop: 16 }}>
          <Icon name="TriangleAlert" size={19} />
          <div>
            Members currently on this program will receive the updated workout schedule
            immediately.
          </div>
        </div>
      ) : null}
    </HtmlModal>
  );
}
