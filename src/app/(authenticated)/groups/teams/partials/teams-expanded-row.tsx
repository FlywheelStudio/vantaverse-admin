'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarGroup } from '@/components/ui/avatar-group';
import { useOrganizationsTable } from '@/context/organizations';
import type { Team } from '@/lib/supabase/schemas/teams';
import {
  Button,
  Dialog,
  Icon,
  IconButton,
  Input,
  Textarea,
} from '@/components/medvanta';

interface TeamsExpandedRowProps {
  organizationId: string;
  teams: Team[];
  columnCount: number;
}

function DeleteTeamButton({
  teamName,
  onDelete,
}: {
  teamName: string;
  onDelete: () => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async (): Promise<void> => {
    setIsDeleting(true);
    try {
      await onDelete();
      setOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <IconButton
        icon="Trash2"
        label={`Delete ${teamName}`}
        variant="ghost"
        size="sm"
        className="text-[var(--danger)] hover:bg-[var(--danger-soft)]"
        onClick={() => setOpen(true)}
      />
      <Dialog
        open={open}
        title="Delete Team"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="danger" loading={isDeleting} onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        Are you sure you want to delete &ldquo;{teamName}&rdquo;? This action cannot be undone.
      </Dialog>
    </>
  );
}

export function TeamsExpandedRow({
  organizationId,
  teams,
  columnCount,
}: TeamsExpandedRowProps) {
  const {
    editingTeam,
    editingTeamValue,
    setEditingTeamValue,
    handleTeamEdit,
    handleTeamBlur,
    handleTeamDelete,
    creatingTeam,
    savingTeam,
    newTeamData,
    setNewTeamData,
    handleSaveNewTeam,
    handleCancelNewTeam,
    handleOpenAddMembers,
    rowZIndex,
  } = useOrganizationsTable();

  const handleDelete = async (teamId: string): Promise<void> => {
    await handleTeamDelete(teamId);
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.2 },
    },
  };

  return (
    <>
      <AnimatePresence mode="popLayout">
        {creatingTeam ? (
          <motion.tr
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="border-b border-[var(--border-subtle)] bg-[var(--slate-50)]"
          >
            <td className="px-4 py-3" colSpan={1}>
              <div className="flex h-full items-center justify-center">
                <Icon name="ArrowUpRight" size={16} className="text-[var(--primary)]" />
              </div>
            </td>
            <td className="px-4 py-3">
              <Input
                value={newTeamData.name}
                onChange={(e) =>
                  setNewTeamData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Team name"
              />
            </td>
            <td className="hidden px-4 py-3 lg:table-cell">
              <Textarea
                value={newTeamData.description}
                onChange={(e) =>
                  setNewTeamData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Description"
                rows={2}
              />
            </td>
            <td className="px-4 py-3" colSpan={3} />
            <td className="px-4 py-3" colSpan={1}>
              <div className="flex justify-end gap-2">
                <IconButton
                  icon="Save"
                  label="Save team"
                  variant="primary"
                  size="sm"
                  shape="rounded"
                  onClick={() => handleSaveNewTeam(newTeamData.organizationId)}
                  disabled={
                    !newTeamData.name.trim() ||
                    newTeamData.organizationId !== organizationId ||
                    savingTeam
                  }
                />
                <IconButton
                  icon="X"
                  label="Cancel"
                  variant="secondary"
                  size="sm"
                  shape="rounded"
                  onClick={handleCancelNewTeam}
                  disabled={savingTeam}
                />
              </div>
            </td>
          </motion.tr>
        ) : null}
        {teams.map((team) => {
          const isEditingName =
            editingTeam?.id === team.id && editingTeam?.field === 'name';
          const isEditingDescription =
            editingTeam?.id === team.id && editingTeam?.field === 'description';

          const members = team.members || [];
          const avatars = members.map((member) => {
            const profile = member.profile;
            return {
              src: profile?.avatar_url || undefined,
              firstName: profile?.first_name || '',
              lastName: profile?.last_name || '',
              userId: profile?.id || '',
            };
          });

          return (
            <motion.tr
              key={team.id}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`border-b border-[var(--border-subtle)] bg-[var(--slate-50)]/70 ${
                rowZIndex === team.id ? 'highlighted-row' : ''
              }`}
              style={
                rowZIndex === team.id
                  ? {
                      position: 'relative',
                      zIndex: 9999,
                      backgroundColor: 'var(--surface-card)',
                    }
                  : undefined
              }
            >
              <td className="px-4 py-3" colSpan={1}>
                <div className="flex h-full items-center justify-center">
                  <Icon name="ArrowUpRight" size={16} className="text-[var(--primary)]" />
                </div>
              </td>
              <td className="px-4 py-3">
                {isEditingName ? (
                  <Input
                    value={editingTeamValue}
                    onChange={(e) => setEditingTeamValue(e.target.value)}
                    onBlur={() =>
                      handleTeamBlur(team.id, 'name', editingTeamValue, team.name)
                    }
                  />
                ) : (
                  <span
                    onClick={() => handleTeamEdit(team.id, 'name')}
                    className="cursor-pointer text-[length:var(--text-sm)] font-[var(--fw-semibold)] text-[var(--text-strong)] transition-colors hover:text-[var(--primary)]"
                  >
                    {team.name}
                  </span>
                )}
              </td>
              <td className="hidden px-4 py-3 lg:table-cell">
                {isEditingDescription ? (
                  <Textarea
                    value={editingTeamValue}
                    onChange={(e) => setEditingTeamValue(e.target.value)}
                    onBlur={() =>
                      handleTeamBlur(
                        team.id,
                        'description',
                        editingTeamValue,
                        team.description,
                      )
                    }
                    rows={2}
                  />
                ) : (
                  <span
                    onClick={() => handleTeamEdit(team.id, 'description')}
                    className="cursor-pointer text-[length:var(--text-sm)] text-[var(--text-muted)] transition-colors hover:text-[var(--primary)]"
                  >
                    {team.description || '—'}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <AvatarGroup
                  avatars={avatars}
                  maxVisible={5}
                  onAddClick={() => handleOpenAddMembers('team', team.id)}
                />
              </td>
              <td className="px-4 py-3" />
              <td className="hidden px-4 py-3 md:table-cell">
                {team.created_at ? (
                  <span className="text-[length:var(--text-sm)] text-[var(--text-muted)]">
                    {new Date(team.created_at).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-[length:var(--text-sm)] text-[var(--text-muted)]">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <DeleteTeamButton
                  teamName={team.name}
                  onDelete={() => handleDelete(team.id)}
                />
              </td>
            </motion.tr>
          );
        })}
      </AnimatePresence>
      {teams.length === 0 && !creatingTeam ? (
        <tr className="border-b border-[var(--border-subtle)] bg-[var(--slate-50)]/70">
          <td
            className="px-4 py-3 text-center text-[var(--text-muted)]"
            colSpan={columnCount}
          >
            No teams yet. Click the &ldquo;+&rdquo; button to create one.
          </td>
        </tr>
      ) : null}
    </>
  );
}
