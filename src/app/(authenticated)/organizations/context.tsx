'use client';

import React, { createContext, useContext } from 'react';
import type { Organization } from '@/lib/supabase/schemas/organizations';

export type EditableField = 'name' | 'description';

export interface EditingCell {
  id: string;
  field: EditableField;
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
  editingCell: EditingCell | null;
  editingValue: string;
  setEditingValue: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
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

export type { OrganizationsTableContextValue };
