'use client';

import { useState } from 'react';
import { Button, Checkbox, Dialog } from '@/components/medvanta';

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
    <Dialog
      open={open}
      title="Update Active Programs?"
      onClose={handleCancel}
      width={425}
      footer={
        <>
          <Button variant="secondary" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} loading={loading} disabled={loading}>
            Save
          </Button>
        </>
      }
    >
      <p className="text-[length:var(--text-sm)] text-[var(--text-muted)]">
        This is a template. Choose whether to update only this template or also
        update all active programs assigned from this template.
      </p>
      <Checkbox
        checked={updateDerived}
        onChange={setUpdateDerived}
        disabled={loading}
        label="Update all derived active programs"
        className="mt-4"
      />
    </Dialog>
  );
}
