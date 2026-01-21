'use client';

import { useState, useRef } from 'react';
import type {
  EditableField,
  EditableTeamField,
} from '@/context/organizations';
import type { Team } from '@/lib/supabase/schemas/teams';
import type { Organization } from '@/lib/supabase/schemas/organizations';

export function useGroupsState() {
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [creatingRow, setCreatingRow] = useState(false);
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: EditableField;
  } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [savingOrg, setSavingOrg] = useState(false);
  const [newOrgData, setNewOrgData] = useState<{
    name: string;
    description: string;
    imageFile: File | null;
    imagePreview: string | null;
  }>({
    name: '',
    description: '',
    imageFile: null,
    imagePreview: null,
  });
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Teams state
  const [expandedOrganizationId, setExpandedOrganizationId] = useState<
    string | null
  >(null);
  const [editingTeam, setEditingTeam] = useState<{
    id: string;
    field: EditableTeamField;
  } | null>(null);
  const [editingTeamValue, setEditingTeamValue] = useState<string>('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [savingTeam, setSavingTeam] = useState(false);
  const [newTeamData, setNewTeamData] = useState<{
    organizationId: string;
    name: string;
    description: string;
  }>({
    organizationId: '',
    name: '',
    description: '',
  });

  // Add members modal state
  const [addingMembersTo, setAddingMembersTo] = useState<{
    type: 'organization' | 'team';
    id: string;
  } | null>(null);
  const [rowZIndex, setRowZIndex] = useState<string | null>(null);

  const handleOpenAddMembers = (type: 'organization' | 'team', id: string) => {
    setAddingMembersTo({ type, id });
    setRowZIndex(id);
  };

  const handleCloseAddMembers = () => {
    setAddingMembersTo(null);
    setRowZIndex(null);
  };

  const handleCreate = () => {
    setCreatingRow(true);
    setExpandedOrganizationId(null);
    setNewOrgData({
      name: '',
      description: '',
      imageFile: null,
      imagePreview: null,
    });
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const handleCancelNewOrg = () => {
    setCreatingRow(false);
    setNewOrgData({
      name: '',
      description: '',
      imageFile: null,
      imagePreview: null,
    });
  };

  const handleCellEdit = (
    organizations: Organization[] | undefined,
    id: string,
    field: EditableField,
  ) => {
    const org = organizations?.find((o: Organization) => o.id === id);
    if (!org) return;

    const value = field === 'name' ? org.name : org.description || '';
    setEditingCell({ id, field });
    setEditingValue(value);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleTeamEdit = (
    organizations: Organization[] | undefined,
    id: string,
    field: EditableTeamField,
  ) => {
    const org = organizations?.find((o: Organization) => o.id === expandedOrganizationId);
    const team = org?.teams?.find((t: Team) => t.id === id);
    if (!team) return;

    const value = field === 'name' ? team.name : team.description || '';
    setEditingTeam({ id, field });
    setEditingTeamValue(value);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleTeamCancel = () => {
    setEditingTeam(null);
    setEditingTeamValue('');
  };

  const handleTeamCreate = (organizationId: string) => {
    setCreatingTeam(true);
    setNewTeamData({
      organizationId,
      name: '',
      description: '',
    });
  };

  const handleCancelNewTeam = () => {
    setCreatingTeam(false);
    setExpandedOrganizationId(null);
    setNewTeamData({
      organizationId: '',
      name: '',
      description: '',
    });
  };

  return {
    // Organization state
    creatingId,
    setCreatingId,
    creatingRow,
    setCreatingRow,
    editingCell,
    setEditingCell,
    editingValue,
    setEditingValue,
    uploadingImage,
    setUploadingImage,
    savingOrg,
    setSavingOrg,
    newOrgData,
    setNewOrgData,
    inputRef,
    handleCreate,
    handleCancel,
    handleCancelNewOrg,
    handleCellEdit,
    // Teams state
    expandedOrganizationId,
    setExpandedOrganizationId,
    editingTeam,
    setEditingTeam,
    editingTeamValue,
    setEditingTeamValue,
    creatingTeam,
    setCreatingTeam,
    savingTeam,
    setSavingTeam,
    newTeamData,
    setNewTeamData,
    handleTeamEdit,
    handleTeamCancel,
    handleTeamCreate,
    handleCancelNewTeam,
    // Members modal state
    addingMembersTo,
    setAddingMembersTo,
    rowZIndex,
    setRowZIndex,
    handleOpenAddMembers,
    handleCloseAddMembers,
  };
}
