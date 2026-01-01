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
  const [editingName, setEditingName] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    const tempId = `temp-${Date.now()}`;
    setCreatingId(tempId);
    setEditingName('');

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSave = async (id: string, name: string) => {
    if (!name.trim()) {
      setCreatingId(null);
      setEditingName('');
      return;
    }

    if (id.startsWith('temp-')) {
      const result = await createOrganization(name.trim());
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['organizations'] });
        setCreatingId(null);
        setEditingName('');
      }
    } else {
      const result = await updateOrganization(id, { name: name.trim() });
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['organizations'] });
        setCreatingId(null);
        setEditingName('');
      }
    }
  };

  const handleCancel = () => {
    setCreatingId(null);
    setEditingName('');
  };

  const handleEdit = (organization: { id: string; name: string }) => {
    setCreatingId(organization.id);
    setEditingName(organization.name);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const displayOrganizations = organizations || [];

  const contextValue = {
    onEdit: handleEdit,
    handleCreate,
    handleSave,
    handleCancel,
    creatingId,
    editingName,
    setEditingName,
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
