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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

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

    // Focus input after state update
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
      // Creating new organization
      const result = await createOrganization(name.trim());
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['organizations'] });
        setCreatingId(null);
        setEditingName('');
      }
    } else {
      // Updating existing organization
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

  const displayOrganizations = organizations || [];

  return (
    <PageWrapper
      subheader={
        <h1 className="text-2xl font-medium">Organizations & Teams</h1>
      }
    >
      <div
        className="overflow-y-auto h-full"
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
              className="p-6"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(5px)',
                WebkitBackdropFilter: 'blur(5px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <div className="mb-4">
                <Button
                  onClick={handleCreate}
                  style={{ backgroundColor: '#2454FF' }}
                >
                  Create New
                </Button>
              </div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-2"
              >
                {creatingId && creatingId.startsWith('temp-') && (
                  <motion.div
                    key={creatingId}
                    variants={rowVariants}
                    className="flex items-center gap-2 p-3 rounded-md bg-white/10"
                  >
                    <Input
                      ref={inputRef}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, creatingId)}
                      onBlur={() => {
                        if (editingName.trim()) {
                          handleSave(creatingId, editingName);
                        } else {
                          handleCancel();
                        }
                      }}
                      placeholder="Organization name"
                      className="flex-1"
                      autoFocus
                    />
                  </motion.div>
                )}

                {displayOrganizations.map((org) => (
                  <motion.div
                    key={org.id}
                    variants={rowVariants}
                    className="flex items-center gap-2 p-3 rounded-md bg-white/10"
                  >
                    {creatingId === org.id ? (
                      <Input
                        ref={inputRef}
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, org.id)}
                        onBlur={() => {
                          if (editingName.trim()) {
                            handleSave(org.id, editingName);
                          } else {
                            handleCancel();
                          }
                        }}
                        placeholder="Organization name"
                        className="flex-1"
                        autoFocus
                      />
                    ) : (
                      <>
                        <span className="flex-1 text-white">{org.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCreatingId(org.id);
                            setEditingName(org.name);
                            setTimeout(() => {
                              inputRef.current?.focus();
                            }, 0);
                          }}
                          className="text-white hover:bg-white/20"
                        >
                          Edit
                        </Button>
                      </>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </PageWrapper>
  );
}
