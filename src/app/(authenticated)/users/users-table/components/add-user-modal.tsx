'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Info } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
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

import { createUserQuickAdd, type ImportUsersResult } from '../../actions';
import { FileUploadTab } from './file-upload-tab';
import { PendingUsersView } from './pending-users-view';
import {
  PendingUsersProvider,
  usePendingUsers,
} from '../contexts/pending-users-context';

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddUserModal({ open, onOpenChange }: AddUserModalProps) {
  return (
    <PendingUsersProvider>
      <AddUserModalInner open={open} onOpenChange={onOpenChange} />
    </PendingUsersProvider>
  );
}

function AddUserModalInner({ open, onOpenChange }: AddUserModalProps) {
  const queryClient = useQueryClient();
  const { addBatch, reset, rows } = usePendingUsers();

  const [tab, setTab] = useState<'individual' | 'csv' | 'excel'>('individual');
  const [mode, setMode] = useState<'upload' | 'pending'>('upload');
  const [isSubmittingIndividual, setIsSubmittingIndividual] = useState(false);
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

    setIsSubmittingIndividual(true);
    try {
      const result = await createUserQuickAdd({
        email: individualEmail.trim(),
        firstName: individualFirstName.trim(),
        lastName: individualLastName.trim(),
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to create user');
        return;
      }

      const createdUser = {
        id: result.data.userId,
        email: individualEmail.trim().toLowerCase(),
        firstName: individualFirstName.trim(),
        lastName: individualLastName.trim(),
        status: 'pending',
      };

      addBatch({ createdUsers: [createdUser], existingUsers: [] });
      setMode('pending');

      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['profiles'] });

      toast.success('User added');
      resetIndividual();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    } finally {
      setIsSubmittingIndividual(false);
    }
  };

  const handleImported = async (result: ImportUsersResult) => {
    const now = Date.now();
    addBatch({
      createdUsers: result.createdUsers.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        status: u.status,
      })),
      existingUsers: result.existingUsers.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        status: u.status,
      })),
      failedUsers: result.failedUsers.map((u, idx) => ({
        id: `failed:${now}:${u.rowNumber}:${idx}`,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        status: 'failed',
      })),
    });

    if (result.errors.length > 0) {
      toast.error(
        `${result.errors.length} issue${result.errors.length > 1 ? 's' : ''} found during import`,
      );
    } else {
      toast.success('Users added');
    }

    void queryClient.invalidateQueries({ queryKey: ['users'] });
    void queryClient.invalidateQueries({ queryKey: ['profiles'] });

    setMode('pending');
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
                <DialogTitle className="text-[#1E3A5F]">
                  Invite Users
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
                <TabsList className="bg-[#F5F7FA]">
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
                                className="flex items-start gap-3"
                                style={{
                                  background: '#e6f7ff',
                                  border: '1px solid #91d5ff',
                                  borderRadius: '8px',
                                  padding: '12px 16px',
                                  marginBottom: '20px',
                                  fontSize: '14px',
                                  color: '#0050b3',
                                  lineHeight: '1.5',
                                }}
                              >
                                <Info className="h-5 w-5 mt-0.5 shrink-0" />
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
                                disabled={isSubmittingIndividual}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleAddToList}
                                disabled={
                                  !canSubmitIndividual || isSubmittingIndividual
                                }
                                className="bg-red-500 hover:bg-red-600 text-white"
                              >
                                {isSubmittingIndividual
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
