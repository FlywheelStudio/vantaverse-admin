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
import { useOrganizationsTable } from './context';
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
            className="border-b border-[#E5E9F0] bg-[#F5F7FA]/50"
          >
            <td className="py-3 px-4" colSpan={1}>
              <div className="flex items-center justify-center h-full">
                <ArrowUpRight className="h-4 w-4 text-[#2454FF]" />
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
                className="font-semibold text-[#1E3A5F] text-sm"
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
                className="text-[#64748B] min-h-[40px] text-sm"
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
                  className="bg-[#2454FF] hover:bg-[#1E3FCC] text-white font-semibold py-1 px-2 rounded-lg cursor-pointer h-7 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-3 w-3" />
                </Button>
                <Button
                  onClick={handleCancelNewTeam}
                  variant="outline"
                  disabled={savingTeam}
                  className="text-[#64748B] border-[#E5E9F0] font-semibold py-1 px-2 rounded-lg cursor-pointer h-7 disabled:opacity-50 disabled:cursor-not-allowed"
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
            let label = '';
            if (profile?.first_name && profile?.last_name) {
              label = `${profile.first_name} ${profile.last_name}`;
            } else if (profile?.username) {
              label = profile.username;
            }
            const avatarId =
              profile?.email || profile?.id || profile?.username || undefined;
            return {
              src: profile?.avatar_url || undefined,
              alt: label || undefined,
              label: label || undefined,
              id: avatarId,
            };
          });

          return (
            <motion.tr
              key={team.id}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`border-b border-[#E5E9F0] bg-[#F5F7FA]/30 ${
                rowZIndex === team.id ? 'highlighted-row' : ''
              }`}
              style={
                rowZIndex === team.id
                  ? {
                      position: 'relative',
                      zIndex: 9999,
                      backgroundColor: 'white',
                    }
                  : undefined
              }
            >
              <td className="py-3 px-4" colSpan={1}>
                <div className="flex items-center justify-center h-full">
                  <ArrowUpRight className="h-4 w-4 text-[#2454FF]" />
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
                    className="font-semibold text-[#1E3A5F] text-sm"
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={() => handleTeamEdit(team.id, 'name')}
                    className="font-semibold text-[#1E3A5F] cursor-pointer hover:text-[#2454FF] transition-colors text-sm"
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
                    className="text-[#64748B] min-h-[40px] text-sm"
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={() => handleTeamEdit(team.id, 'description')}
                    className="text-[#64748B] cursor-pointer hover:text-[#2454FF] transition-colors text-sm"
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
                  <span className="text-[#64748B] text-sm">
                    {new Date(team.created_at).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-[#64748B] text-sm">—</span>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold cursor-pointer p-0"
                      >
                        <Trash2 className="ml-3 h-3 w-3" />
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
        <tr className="border-b border-[#E5E9F0] bg-[#F5F7FA]/30">
          <td
            className="py-3 px-4 text-center text-[#64748B]"
            colSpan={columnCount}
          >
            No teams yet. Click the &ldquo;+&rdquo; button to create one.
          </td>
        </tr>
      )}
    </>
  );
}
