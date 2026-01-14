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

import {
  bulkImportUsers,
  createUserQuickAdd,
  type ImportValidationResult,
} from '../../actions';
import { ImportValidationModal } from './import-validation-modal';
import { FileUploadTab } from './file-upload-tab';

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddUserModal({ open, onOpenChange }: AddUserModalProps) {
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<'individual' | 'csv' | 'excel'>('individual');
  const [isSubmittingIndividual, setIsSubmittingIndividual] = useState(false);
  const [individualEmail, setIndividualEmail] = useState('');
  const [individualFirstName, setIndividualFirstName] = useState('');
  const [individualLastName, setIndividualLastName] = useState('');

  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ImportValidationResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const canSubmitIndividual = useMemo(
    () => individualEmail.trim().length > 0,
    [individualEmail],
  );

  const resetIndividual = () => {
    setIndividualEmail('');
    setIndividualFirstName('');
    setIndividualLastName('');
  };

  const handleCancel = () => {
    resetIndividual();
    onOpenChange(false);
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

      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.invalidateQueries({ queryKey: ['profiles'] });

      toast.success('User added');
      resetIndividual();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    } finally {
      setIsSubmittingIndividual(false);
    }
  };

  const handleValidationResult = (result: ImportValidationResult) => {
    setValidationResult(result);
    setValidationModalOpen(true);
  };

  const handleAcceptImport = async (): Promise<void> => {
    if (!validationResult) return;

    setIsImporting(true);
    try {
      const result = await bulkImportUsers(validationResult);

      if (result.success) {
        const { created, updated, errors } = result.data;

        const parts: string[] = [];
        if (created.organizations > 0) {
          parts.push(
            `${created.organizations} org${created.organizations > 1 ? 's' : ''}`,
          );
        }
        if (created.teams > 0) {
          parts.push(`${created.teams} team${created.teams > 1 ? 's' : ''}`);
        }
        if (created.users > 0) {
          parts.push(
            `${created.users} user${created.users > 1 ? 's' : ''} created`,
          );
        }
        if (updated.users > 0) {
          parts.push(
            `${updated.users} user${updated.users > 1 ? 's' : ''} updated`,
          );
        }

        if (parts.length > 0) {
          toast.success(`Import complete: ${parts.join(', ')}`);
        } else {
          toast.success('Import complete (no changes made)');
        }

        if (errors.length > 0) {
          toast.error(
            `${errors.length} error${errors.length > 1 ? 's' : ''} during import. Check console for details.`,
          );
          console.error('Import errors:', errors);
        }

        await queryClient.invalidateQueries({ queryKey: ['users'] });

        setValidationModalOpen(false);
        setValidationResult(null);
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to import users');
      }
    } catch {
      toast.error('An unexpected error occurred during import');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
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
            <DialogHeader>
              <DialogTitle className="text-[#1E3A5F]">Invite Users</DialogTitle>
              <DialogDescription>
                Add users to your platform. Invitations will be sent separately.
              </DialogDescription>
            </DialogHeader>

            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as typeof tab)}
              className="flex flex-col flex-1 min-h-0"
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
                                <span className="font-semibold">Pending</span>.
                                You can send invitation emails after reviewing
                                the list.
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
                          onValidationResult={handleValidationResult}
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
                          onValidationResult={handleValidationResult}
                          onCancel={handleCancel}
                        />
                      </TabsContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Tabs>
          </motion.div>
        </DialogContent>
      </Dialog>

      <ImportValidationModal
        open={validationModalOpen}
        onOpenChange={setValidationModalOpen}
        validationResult={validationResult}
        onAccept={handleAcceptImport}
        isImporting={isImporting}
      />
    </>
  );
}
