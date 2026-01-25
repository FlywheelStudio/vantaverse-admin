'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X, Trash2, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AvatarGroup } from '@/components/ui/avatar-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useOrganizationsTable } from '@/context/organizations';
import type { Team } from '@/lib/supabase/schemas/teams';

interface TeamsExpandedRowProps {
  organizationId: string;
  teams: Team[];
  columnCount: number;
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
    handleTeamCancel,
    handleTeamDelete,
    creatingTeam,
    savingTeam,
    newTeamData,
    setNewTeamData,
    handleSaveNewTeam,
    handleCancelNewTeam,
    inputRef,
    handleOpenAddMembers,
    rowZIndex,
  } = useOrganizationsTable();

  const handleDelete = async (teamId: string) => {
    await handleTeamDelete(teamId);
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <>
      <AnimatePresence mode="popLayout">
        {creatingTeam && (
          <motion.tr
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="border-b border-border/60 bg-muted/30"
          >
            <td className="py-3 px-4" colSpan={1}>
              <div className="flex items-center justify-center h-full">
                <ArrowUpRight className="h-4 w-4 text-primary" />
              </div>
            </td>
            <td className="py-3 px-4">
              <Input
                value={newTeamData.name}
                onChange={(e) =>
                  setNewTeamData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Team name"
                className="h-10 bg-card text-sm font-medium"
              />
            </td>
            <td className="py-3 px-4 hidden lg:table-cell">
              <Textarea
                value={newTeamData.description}
                onChange={(e) =>
                  setNewTeamData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Description"
                className="min-h-[40px] bg-card text-sm"
              />
            </td>
            <td className="py-3 px-4" colSpan={3} />
            <td className="py-3 px-4" colSpan={1}>
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => handleSaveNewTeam(newTeamData.organizationId)}
                  disabled={
                    !newTeamData.name.trim() ||
                    newTeamData.organizationId !== organizationId ||
                    savingTeam
                  }
                  size="icon-sm"
                  className="h-8 w-8 rounded-[var(--radius-md)] cursor-pointer"
                >
                  <Save className="h-3 w-3" />
                </Button>
                <Button
                  onClick={handleCancelNewTeam}
                  variant="outline"
                  disabled={savingTeam}
                  size="icon-sm"
                  className="h-8 w-8 rounded-[var(--radius-md)] cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </td>
          </motion.tr>
        )}
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
              className={`border-b border-border/60 bg-muted/20 ${
                rowZIndex === team.id ? 'highlighted-row' : ''
              }`}
              style={
                rowZIndex === team.id
                  ? {
                      position: 'relative',
                      zIndex: 9999,
                      backgroundColor: 'var(--card)',
                    }
                  : undefined
              }
            >
              <td className="py-3 px-4" colSpan={1}>
                <div className="flex items-center justify-center h-full">
                  <ArrowUpRight className="h-4 w-4 text-primary" />
                </div>
              </td>
              <td className="py-3 px-4">
                {isEditingName ? (
                  <Input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    value={editingTeamValue}
                    onChange={(e) => setEditingTeamValue(e.target.value)}
                    onBlur={() =>
                      handleTeamBlur(
                        team.id,
                        'name',
                        editingTeamValue,
                        team.name,
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        handleTeamCancel();
                      }
                    }}
                    className="h-10 bg-card text-sm font-medium"
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={() => handleTeamEdit(team.id, 'name')}
                    className="font-semibold text-foreground cursor-pointer hover:text-primary transition-colors text-sm"
                  >
                    {team.name}
                  </span>
                )}
              </td>
              <td className="py-3 px-4 hidden lg:table-cell">
                {isEditingDescription ? (
                  <Textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
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
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        handleTeamCancel();
                      }
                    }}
                    className="min-h-[40px] bg-card text-sm"
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={() => handleTeamEdit(team.id, 'description')}
                    className="text-muted-foreground cursor-pointer hover:text-primary transition-colors text-sm"
                  >
                    {team.description || '—'}
                  </span>
                )}
              </td>
              <td className="py-3 px-4">
                <AvatarGroup
                  avatars={avatars}
                  maxVisible={5}
                  onAddClick={() => handleOpenAddMembers('team', team.id)}
                />
              </td>
              <td className="py-3 px-4">
                {/* Teams column - empty for teams */}
              </td>
              <td className="py-3 px-4 hidden md:table-cell">
                {team.created_at ? (
                  <span className="text-muted-foreground text-sm">
                    {new Date(team.created_at).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Team</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete &ldquo;{team.name}
                          &rdquo;? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="cursor-pointer"
                          onClick={() => handleDelete(team.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </td>
            </motion.tr>
          );
        })}
      </AnimatePresence>
      {teams.length === 0 && !creatingTeam && (
        <tr className="border-b border-border/60 bg-muted/20">
          <td
            className="py-3 px-4 text-center text-muted-foreground"
            colSpan={columnCount}
          >
            No teams yet. Click the &ldquo;+&rdquo; button to create one.
          </td>
        </tr>
      )}
    </>
  );
}
