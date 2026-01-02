'use client';

import React, { createContext, useContext } from 'react';
import type { Organization } from '@/lib/supabase/schemas/organizations';

export type EditableField = 'name' | 'description';
export type EditableTeamField = 'name' | 'description';

interface EditingCell {
  id: string;
  field: EditableField;
}

interface EditingTeam {
  id: string;
  field: EditableTeamField;
}

interface NewOrgData {
  name: string;
  description: string;
  imageFile: File | null;
  imagePreview: string | null;
}

interface NewTeamData {
  organizationId: string;
  name: string;
  description: string;
}

interface OrganizationsTableContextValue {
  onEdit: (org: Organization) => void;
  handleCreate: () => void;
  handleSave: (
    id: string,
    field: EditableField,
    value: string,
  ) => Promise<void>;
  handleCancel: () => void;
  handleCellEdit: (id: string, field: EditableField) => void;
  handleCellBlur: (
    id: string,
    field: EditableField,
    value: string,
    originalValue: string | null,
  ) => void;
  creatingId: string | null;
  creatingRow: boolean;
  editingCell: EditingCell | null;
  editingValue: string;
  setEditingValue: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  newOrgData: NewOrgData;
  setNewOrgData: React.Dispatch<React.SetStateAction<NewOrgData>>;
  uploadingImage: string | null;
  setUploadingImage: React.Dispatch<React.SetStateAction<string | null>>;
  handleImageUpload: (file: File, orgId?: string) => Promise<void>;
  handleSaveNewOrg: () => Promise<void>;
  handleCancelNewOrg: () => void;
  handleDelete: (id: string) => Promise<void>;
  // Teams related
  expandedOrganizationId: string | null;
  handleExpandToggle: (organizationId: string) => void;
  editingTeam: EditingTeam | null;
  editingTeamValue: string;
  setEditingTeamValue: (value: string) => void;
  handleTeamEdit: (id: string, field: EditableTeamField) => void;
  handleTeamBlur: (
    id: string,
    field: EditableTeamField,
    value: string,
    originalValue: string | null,
  ) => void;
  handleTeamCancel: () => void;
  handleTeamCreate: (organizationId: string) => void;
  handleTeamDelete: (teamId: string) => Promise<void>;
  creatingTeam: boolean;
  savingTeam: boolean;
  newTeamData: NewTeamData;
  setNewTeamData: React.Dispatch<React.SetStateAction<NewTeamData>>;
  handleSaveNewTeam: (organizationId: string) => Promise<void>;
  handleCancelNewTeam: () => void;
  // Add members modal
  addingMembersTo: { type: 'organization' | 'team'; id: string } | null;
  rowZIndex: string | null;
  handleOpenAddMembers: (type: 'organization' | 'team', id: string) => void;
  handleCloseAddMembers: () => void;
  setRowZIndex: (rowId: string | null) => void;
}

const OrganizationsTableContext =
  createContext<OrganizationsTableContextValue | null>(null);

export function useOrganizationsTable() {
  const context = useContext(OrganizationsTableContext);
  if (!context) {
    throw new Error(
      'useOrganizationsTable must be used within OrganizationsTableProvider',
    );
  }
  return context;
}

interface OrganizationsTableProviderProps {
  children: React.ReactNode;
  value: OrganizationsTableContextValue;
}

export function OrganizationsTableProvider({
  children,
  value,
}: OrganizationsTableProviderProps) {
  return (
    <OrganizationsTableContext.Provider value={value}>
      {children}
    </OrganizationsTableContext.Provider>
  );
}
