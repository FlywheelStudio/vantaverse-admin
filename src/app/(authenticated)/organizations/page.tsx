'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper } from '@/components/page-wrapper';
import { useOrganizations } from '@/hooks/use-organizations';
import { createOrganization, updateOrganization } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HEADER_HEIGHT, VANTABUDDY_CONFIG } from '@/lib/configs/sidebar';
import { useQueryClient } from '@tanstack/react-query';
import { OrganizationsTable } from './organizations-table';
import { columns } from './columns';

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

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    id: string,
  ) => {
    if (e.key === 'Enter') {
      handleSave(id, editingName);
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleEdit = (organization: { id: string; name: string }) => {
    setCreatingId(organization.id);
    setEditingName(organization.name);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const displayOrganizations = organizations || [];

  return (
    <PageWrapper
      subheader={
        <h1 className="text-2xl font-medium">Organizations & Teams</h1>
      }
    >
      <div
        className="overflow-y-auto h-full pb-4"
        style={{
          height: `calc(100vh - ${HEADER_HEIGHT}px - ${VANTABUDDY_CONFIG.height}px - 16px)`,
        }}
      >
        {isLoading ? (
          <div className="h-full" />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key="content"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="p-6 h-full glass-background"
            >
              <div className="mb-4">
                <Button
                  onClick={handleCreate}
                  style={{ backgroundColor: '#2454FF' }}
                >
                  Create New
                </Button>
              </div>

              {(creatingId?.startsWith('temp-') || creatingId) && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-md bg-white/10">
                  <Input
                    ref={inputRef}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, creatingId!)}
                    onBlur={() => {
                      if (editingName.trim()) {
                        handleSave(creatingId!, editingName);
                      } else {
                        handleCancel();
                      }
                    }}
                    placeholder="Organization name"
                    className="flex-1"
                    autoFocus
                  />
                </div>
              )}

              <OrganizationsTable
                columns={columns}
                data={displayOrganizations}
                onEdit={handleEdit}
              />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </PageWrapper>
  );
}
