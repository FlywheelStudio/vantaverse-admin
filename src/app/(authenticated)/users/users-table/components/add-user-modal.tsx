'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Alert,
  Button,
  Dialog,
  FormField,
  Input,
  Tabs,
} from '@/components/medvanta';

import { type ImportUsersResult } from '../../actions';
import { FileUploadTab } from './file-upload-tab';
import { PendingUsersView } from './pending-users-view';
import {
  PendingUsersProvider,
  usePendingUsers,
} from '../contexts/pending-users-context';
import { MemberRole } from '@/lib/supabase/schemas/organization-members';
import { useCreateUserQuickAdd } from '../hooks/use-users-table-mutations';

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: MemberRole;
  title?: string;
}

export function AddUserModal({
  open,
  onOpenChange,
  role = 'patient',
  title,
}: AddUserModalProps): React.ReactElement {
  return (
    <PendingUsersProvider>
      <AddUserModalInner
        open={open}
        onOpenChange={onOpenChange}
        role={role}
        title={title}
      />
    </PendingUsersProvider>
  );
}

function AddUserModalInner({
  open,
  onOpenChange,
  role = 'patient',
  title,
}: AddUserModalProps): React.ReactElement {
  const queryClient = useQueryClient();
  const { addBatch, reset, rows } = usePendingUsers();
  const createUserMutation = useCreateUserQuickAdd();

  const [tab, setTab] = useState<'individual' | 'csv' | 'excel'>('individual');
  const [mode, setMode] = useState<'upload' | 'pending'>('upload');
  const [individualEmail, setIndividualEmail] = useState('');
  const [individualFirstName, setIndividualFirstName] = useState('');
  const [individualLastName, setIndividualLastName] = useState('');

  const canSubmitIndividual = useMemo(
    () => individualEmail.trim().length > 0,
    [individualEmail],
  );

  const resetIndividual = (): void => {
    setIndividualEmail('');
    setIndividualFirstName('');
    setIndividualLastName('');
  };

  const wasOpen = useRef(false);

  const handleClose = (): void => {
    resetIndividual();
    setMode('upload');
    setTab('individual');
    reset();
    onOpenChange(false);
  };

  useEffect(() => {
    if (wasOpen.current && !open) {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    }
    wasOpen.current = open;
  }, [open, queryClient]);

  const handleCancel = (): void => {
    if (rows.length > 0) {
      setMode('pending');
      return;
    }
    handleClose();
  };

  const handleAddToList = async (): Promise<void> => {
    if (!individualEmail.trim()) {
      toast.error('Email is required');
      return;
    }

    try {
      const result = await createUserMutation.mutateAsync({
        email: individualEmail.trim(),
        firstName: individualFirstName.trim(),
        lastName: individualLastName.trim(),
        role,
      });

      const createdUser = {
        id: result.userId,
        email: individualEmail.trim().toLowerCase(),
        firstName: individualFirstName.trim(),
        lastName: individualLastName.trim(),
        status: 'pending',
      };

      addBatch({ createdUsers: [createdUser], existingUsers: [] });
      setMode('pending');
      resetIndividual();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleImported = async (result: ImportUsersResult): Promise<void> => {
    try {
      const now = Date.now();

      const batchData = {
        createdUsers:
          result.createdUsers?.map((u) => ({
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            status: u.status,
          })) || [],
        existingUsers:
          result.existingUsers?.map((u) => ({
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            status: u.status,
          })) || [],
        failedUsers:
          result.failedUsers?.map((u, idx) => ({
            id: `failed:${now}:${u.rowNumber}:${idx}`,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            status: 'failed',
          })) || [],
      };

      addBatch(batchData);
      setMode('pending');
    } catch (error) {
      console.error('Error handling imported users:', error);
      setMode('pending');
    }
  };

  const modalTitle =
    title ?? (role === 'admin' ? 'Invite admins' : 'Invite members');

  if (mode === 'pending') {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        title={modalTitle}
        width={760}
        className="flex max-h-[85vh] flex-col overflow-hidden"
      >
        <PendingUsersView
          onClose={handleClose}
          onAddMore={() => setMode('upload')}
          role={role}
        />
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={modalTitle}
      width={760}
      className="flex max-h-[85vh] flex-col overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={
          open
            ? { opacity: 1, scale: 1, y: 0 }
            : { opacity: 0, scale: 0.95, y: 20 }
        }
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <p className="mb-4 text-[length:var(--text-sm)] text-[var(--text-muted)]">
          Add users to your platform. Invitations will be sent separately.
        </p>

        <Tabs
          tabs={[
            { id: 'individual', label: 'Individual' },
            { id: 'csv', label: 'Bulk CSV' },
            { id: 'excel', label: 'Bulk Excel' },
          ]}
          value={tab}
          onChange={(v) => setTab(v as typeof tab)}
          className="mb-4"
        />

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {tab === 'individual' && (
              <motion.div
                key="individual"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="flex flex-col"
              >
                <div className="flex min-h-0 w-full flex-col">
                  <div className="w-full flex-1 space-y-4">
                    <FormField label="Email Address" required>
                      <Input
                        value={individualEmail}
                        onChange={(e) => setIndividualEmail(e.target.value)}
                        placeholder="user@example.com"
                        type="email"
                      />
                    </FormField>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField label="First Name (Optional)">
                        <Input
                          value={individualFirstName}
                          onChange={(e) =>
                            setIndividualFirstName(e.target.value)
                          }
                          placeholder="Enter their first name"
                        />
                      </FormField>
                      <FormField label="Last Name (Optional)">
                        <Input
                          value={individualLastName}
                          onChange={(e) => setIndividualLastName(e.target.value)}
                          placeholder="Enter their last name"
                        />
                      </FormField>
                    </div>

                    <Alert kind="info" title="Pending status">
                      Users will be added as Pending. Review the list before
                      sending invitations.
                    </Alert>
                  </div>

                  <div className="mt-auto flex justify-end gap-2 pt-4">
                    <Button
                      variant="secondary"
                      onClick={handleCancel}
                      disabled={createUserMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddToList}
                      disabled={
                        !canSubmitIndividual || createUserMutation.isPending
                      }
                      loading={createUserMutation.isPending}
                    >
                      Add to List
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'csv' && (
              <motion.div
                key="csv"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="absolute inset-0 flex flex-col"
              >
                <FileUploadTab
                  fileType="csv"
                  onImported={handleImported}
                  onCancel={handleCancel}
                  role={role}
                />
              </motion.div>
            )}

            {tab === 'excel' && (
              <motion.div
                key="excel"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="absolute inset-0 flex flex-col"
              >
                <FileUploadTab
                  fileType="excel"
                  onImported={handleImported}
                  onCancel={handleCancel}
                  role={role}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </Dialog>
  );
}
