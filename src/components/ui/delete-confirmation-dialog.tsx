'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DeleteConfirmationDialogProps {
  title: string;
  description: string;
  onConfirm: () => Promise<void> | void;
  trigger?: React.ReactNode;
  triggerClassName?: string;
  /** Controlled open state; omit for uncontrolled trigger-based usage. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** When set, the confirm button stays disabled until the user types this exact text. */
  confirmText?: string;
}

export function DeleteConfirmationDialog({
  title,
  description,
  onConfirm,
  trigger,
  triggerClassName,
  open,
  onOpenChange,
  confirmText,
}: DeleteConfirmationDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [confirmInput, setConfirmInput] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (next: boolean): void => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
    if (next) setConfirmInput('');
  };

  const canConfirm = !confirmText || confirmInput === confirmText;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      handleOpenChange(false);
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      {!isControlled || trigger ? (
        trigger ? (
          <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
        ) : (
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={
                triggerClassName ||
                'text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold cursor-pointer'
              }
            >
              Delete
            </Button>
          </AlertDialogTrigger>
        )
      ) : null}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {confirmText ? (
          <div>
            <Input
              value={confirmInput}
              onChange={(event) => setConfirmInput(event.target.value)}
              placeholder={confirmText}
              disabled={isDeleting}
            />
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer" disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="cursor-pointer"
            onClick={(event) => {
              event.preventDefault();
              void handleDelete();
            }}
            disabled={isDeleting || !canConfirm}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
