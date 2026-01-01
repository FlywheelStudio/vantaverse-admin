'use client';

import React, { createContext, useContext } from 'react';
import type { Organization } from '@/lib/supabase/schemas/organizations';

interface OrganizationsTableContextValue {
  onEdit: (org: Organization) => void;
  handleCreate: () => void;
  handleSave: (id: string, name: string) => Promise<void>;
  handleCancel: () => void;
  creatingId: string | null;
  editingName: string;
  setEditingName: (name: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
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
