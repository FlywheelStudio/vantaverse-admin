'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper } from '@/components/page-wrapper';
import { useOrganizations } from '@/hooks/use-organizations';
import { createOrganization, updateOrganization } from './actions';
import { useQueryClient } from '@tanstack/react-query';
import { OrganizationsTable } from './organizations-table';
import { columns } from './columns';
import { Card } from '@/components/ui/card';
import { OrganizationsTableProvider } from './context';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import type { EditableField } from './context';

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: {
      duration: 0.3,
    },
  },
};

export default function OrganizationsPage() {
  const { data: organizations, isLoading } = useOrganizations();
  const queryClient = useQueryClient();
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: EditableField;
  } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const handleCreate = async () => {
    const tempId = `temp-${Date.now()}`;
    setCreatingId(tempId);
    setEditingValue('');

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSave = async (
    id: string,
    field: EditableField,
    value: string,
  ) => {
    if (!value.trim() && field === 'name') {
      setEditingCell(null);
      setEditingValue('');
      return;
    }

    if (id.startsWith('temp-')) {
      const result = await createOrganization(value.trim());
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['organizations'] });
        setCreatingId(null);
        setEditingValue('');
      }
    } else {
      const updateData: Partial<Organization> = {
        [field]: field === 'description' ? value.trim() || null : value.trim(),
      };

      // Optimistic update
      const previousData = queryClient.getQueryData<Organization[]>([
        'organizations',
      ]);

      if (previousData) {
        queryClient.setQueryData<Organization[]>(['organizations'], (old) => {
          if (!old) return old;
          return old.map((org) =>
            org.id === id ? { ...org, ...updateData } : org,
          );
        });
      }

      const result = await updateOrganization(id, updateData);

      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['organizations'] });
        setEditingCell(null);
        setEditingValue('');
      } else {
        // Rollback on error
        if (previousData) {
          queryClient.setQueryData<Organization[]>(
            ['organizations'],
            previousData,
          );
        }
      }
    }
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const handleEdit = (organization: Organization) => {
    // Keep this for the Edit button (UI only for now)
    console.log('handleEdit', organization);
  };

  const handleCellEdit = (id: string, field: EditableField) => {
    const org = organizations?.find((o) => o.id === id);
    if (!org) return;

    const value = field === 'name' ? org.name : org.description || '';
    setEditingCell({ id, field });
    setEditingValue(value);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleCellBlur = (
    id: string,
    field: EditableField,
    value: string,
    originalValue: string | null,
  ) => {
    const normalizedNew = value.trim();
    const normalizedOriginal = originalValue?.trim() || '';

    if (normalizedNew !== normalizedOriginal) {
      handleSave(id, field, value);
    } else {
      setEditingCell(null);
      setEditingValue('');
    }
  };

  const displayOrganizations = organizations || [];

  const contextValue = {
    onEdit: handleEdit,
    handleCreate,
    handleSave,
    handleCancel,
    handleCellEdit,
    handleCellBlur,
    creatingId,
    editingCell,
    editingValue,
    setEditingValue,
    inputRef,
  };

  return (
    <PageWrapper
      subheader={
        <h1 className="text-2xl font-medium">Organizations & Teams</h1>
      }
    >
      <div className="p-6 flex-1 min-h-0 overflow-y-auto glass-background h-full">
        <OrganizationsTableProvider value={contextValue}>
          {!isLoading && (
            <Card className="text-card-foreground flex flex-col gap-6 py-6 bg-white/95 backdrop-blur-sm rounded-3xl border-2 border-white/50 shadow-2xl overflow-hidden">
              <div className="p-6 sm:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key="table"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <OrganizationsTable
                      columns={columns}
                      data={displayOrganizations}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </Card>
          )}
        </OrganizationsTableProvider>
      </div>
    </PageWrapper>
  );
}
