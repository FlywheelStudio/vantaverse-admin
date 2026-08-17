'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import {
  FormField,
  Icon,
  Input,
  Tabs,
} from '@/components/medvanta';
import { HtmlModal } from '@/app/(authenticated)/users/[id]/partials/intake-survey-placeholder-modal';

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
      <HtmlModal
        open={open}
        onClose={handleClose}
        title={modalTitle}
        subtitle="Review pending invites before sending."
        width={920}
        style={{ maxHeight: 'min(85vh, 720px)', display: 'flex', flexDirection: 'column' }}
        bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <PendingUsersView
          onClose={handleClose}
          onAddMore={() => setMode('upload')}
          role={role}
        />
      </HtmlModal>
    );
  }

  return (
    <HtmlModal
      open={open}
      onClose={handleClose}
      title={modalTitle}
      subtitle="Add users to your platform. Invitations will be sent separately."
      width={920}
      style={{ maxHeight: 'min(85vh, 720px)', display: 'flex', flexDirection: 'column' }}
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
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
                <div className="dual">
                  <div className="dual-l">
                    <div className="space-y-4">
                      <FormField label="Email Address" required>
                        <Input
                          value={individualEmail}
                          onChange={(e) => setIndividualEmail(e.target.value)}
                          placeholder="user@example.com"
                          type="email"
                        />
                      </FormField>

                      <div className="g g2">
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
                    </div>
                  </div>
                  <div className="dual-r">
                    <div className="alert alert-i">
                      <Icon name="Info" size={19} />
                      <div>
                        <div className="at">Pending status</div>
                        <div>
                          Users will be added as Pending. Review the list before sending
                          invitations.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mf" style={{ marginTop: 16, padding: 0, border: 'none' }}>
                  <span className="sp" />
                  <span className="r">
                    <button
                      type="button"
                      className="btn btn-sec"
                      onClick={handleCancel}
                      disabled={createUserMutation.isPending}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-pri"
                      onClick={handleAddToList}
                      disabled={
                        !canSubmitIndividual || createUserMutation.isPending
                      }
                    >
                      {createUserMutation.isPending ? (
                        <Icon name="LoaderCircle" size={17} className="animate-spin" />
                      ) : (
                        <Icon name="UserPlus" size={17} />
                      )}
                      Add to list
                    </button>
                  </span>
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
    </HtmlModal>
  );
}
