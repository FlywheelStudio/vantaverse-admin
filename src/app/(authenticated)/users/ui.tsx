'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useUsers } from '@/hooks/use-users';
import { UsersTable } from './users-table/components/table';
import { columns } from './users-table/components/columns';
import { Card } from '@/components/medvanta';
import { MemberRole } from '@/lib/supabase/schemas/organization-members';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';

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

interface UsersPageUIProps {
  initialUsers: ProfileWithStats[];
}

export function UsersPageUI({ initialUsers }: UsersPageUIProps) {
  const [filters, setFilters] = useState<{
    organization_id?: string;
    team_id?: string;
    role: MemberRole;
  }>({ role: 'patient' });
  const { data: users, isLoading } = useUsers(
    {
      organization_id: filters.organization_id,
      team_id: filters.team_id,
      role: filters.role,
    },
    // Only use initialData when filters match the default (role: 'patient', no org/team)
    filters.role === 'patient' &&
      !filters.organization_id &&
      !filters.team_id
      ? initialUsers
      : undefined,
  );

  const displayUsers = users || [];

  const tableColumns = useMemo(
    () =>
      filters.role === 'admin'
        ? columns.filter((col) => col.id !== 'program')
        : columns,
    [filters.role],
  );

  return (
    <Card padding={24}>
      {isLoading ? (
        <div className="flex h-24 items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--primary)]" />
            <span className="text-[length:var(--text-sm)] text-[var(--text-muted)]">
              Loading members...
            </span>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key="table"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <UsersTable
              columns={tableColumns}
              data={displayUsers}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </motion.div>
        </AnimatePresence>
      )}
    </Card>
  );
}
