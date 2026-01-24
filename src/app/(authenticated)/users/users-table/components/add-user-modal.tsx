'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { type ImportUsersResult } from '../../actions';
import { FileUploadTab } from './file-upload-tab';
import { PendingUsersView } from './pending-users-view';
import {
  PendingUsersProvider,
  usePendingUsers,
} from '../contexts/pending-users-context';
import { MemberRole } from '@/lib/supabase/schemas/organization-members';
import { useCreateUserQuickAdd } from '../hooks/use-users-table-mutations';
import { cn } from '@/lib/utils';

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
}: AddUserModalProps) {
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
}: AddUserModalProps) {
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

  const resetIndividual = () => {
    setIndividualEmail('');
    setIndividualFirstName('');
    setIndividualLastName('');
  };

  const handleClose = () => {
    resetIndividual();
    setMode('upload');
    setTab('individual');
    reset();
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (rows.length > 0) {
      setMode('pending');
      return;
    }
    handleClose();
  };

  const handleAddToList = async () => {
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
      // Error handling is done in mutation hook
      console.error('Error creating user:', error);
    }
  };

  const handleImported = async (result: ImportUsersResult) => {
    try {
      const now = Date.now();
      
      const batchData = {
        createdUsers: result.createdUsers?.map((u) => ({
          id: u.id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          status: u.status,
        })) || [],
        existingUsers: result.existingUsers?.map((u) => ({
          id: u.id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          status: u.status,
        })) || [],
        failedUsers: result.failedUsers?.map((u, idx) => ({
          id: `failed:${now}:${u.rowNumber}:${idx}`,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          status: 'failed',
        })) || [],
      };
      
      // Always add batch to show results (created, existing, or failed users)
      addBatch(batchData);

      // Always switch to pending view to show results
      setMode('pending');
    } catch (error) {
      console.error('Error handling imported users:', error);
      // Still switch to pending view even on error
      setMode('pending');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}
    >
      <DialogContent className="w-[min(760px,calc(100%-2rem))] h-[680px] max-h-[85vh] flex flex-col overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={
            open
              ? { opacity: 1, scale: 1, y: 0 }
              : { opacity: 0, scale: 0.95, y: 20 }
          }
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex flex-col flex-1 min-h-0"
        >
          {mode === 'pending' ? (
            <PendingUsersView
              onClose={handleClose}
              onAddMore={() => setMode('upload')}
            />
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {title ??
                    (role === 'admin' ? 'Invite physicians' : 'Invite members')}
                </DialogTitle>
                <DialogDescription>
                  Add users to your platform. Invitations will be sent
                  separately.
                </DialogDescription>
              </DialogHeader>

              <Tabs
                value={tab}
                onValueChange={(v) => setTab(v as typeof tab)}
                className="flex flex-col flex-1 min-h-0 pt-3"
              >
                <TabsList className="bg-muted">
                  <TabsTrigger value="individual">Individual</TabsTrigger>
                  <TabsTrigger value="csv">Bulk CSV</TabsTrigger>
                  <TabsTrigger value="excel">Bulk Excel</TabsTrigger>
                </TabsList>

                <div className="relative flex-1 min-h-0 overflow-hidden">
                  <AnimatePresence mode="wait">
                    {tab === 'individual' && (
                      <motion.div
                        key="individual"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="absolute inset-0 flex flex-col"
                      >
                        <TabsContent
                          value="individual"
                          className="flex flex-col flex-1 min-h-0 w-full"
                        >
                          <div className="flex flex-col flex-1 min-h-0 w-full">
                            <div className="space-y-4 flex-1 w-full">
                              <div className="space-y-2">
                                <div className="text-sm font-medium">
                                  Email Address{' '}
                                  <span className="text-red-500">*</span>
                                </div>
                                <Input
                                  value={individualEmail}
                                  onChange={(e) =>
                                    setIndividualEmail(e.target.value)
                                  }
                                  placeholder="user@example.com"
                                  type="email"
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className="text-sm font-medium">
                                    First Name (Optional)
                                  </div>
                                  <Input
                                    value={individualFirstName}
                                    onChange={(e) =>
                                      setIndividualFirstName(e.target.value)
                                    }
                                    placeholder="Enter their first name"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <div className="text-sm font-medium">
                                    Last Name (Optional)
                                  </div>
                                  <Input
                                    value={individualLastName}
                                    onChange={(e) =>
                                      setIndividualLastName(e.target.value)
                                    }
                                    placeholder="Enter their last name"
                                  />
                                </div>
                              </div>

                              <div
                                className={cn(
                                  'flex items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm leading-relaxed',
                                  'bg-primary/10 border-primary/20 text-foreground',
                                )}
                              >
                                <Info className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
                                <div>
                                  Users will be added as{' '}
                                  <span className="font-semibold">Pending</span>
                                  . Review the list before sending invitations.
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 mt-auto">
                              <Button
                                variant="outline"
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
                                className="rounded-[var(--radius-pill)]"
                              >
                                {createUserMutation.isPending
                                  ? 'Adding...'
                                  : 'Add to List'}
                              </Button>
                            </div>
                          </div>
                        </TabsContent>
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
                        <TabsContent
                          value="csv"
                          className="flex flex-col flex-1 min-h-0 w-full"
                        >
                          <FileUploadTab
                            fileType="csv"
                            onImported={handleImported}
                            onCancel={handleCancel}
                            role={role}
                          />
                        </TabsContent>
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
                        <TabsContent
                          value="excel"
                          className="flex flex-col flex-1 min-h-0 w-full"
                        >
                          <FileUploadTab
                            fileType="excel"
                            onImported={handleImported}
                            onCancel={handleCancel}
                            role={role}
                          />
                        </TabsContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Tabs>
            </>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
