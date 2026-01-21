'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useUsers } from '@/hooks/use-users';
import { UsersTable } from './users-table/components/table';
import { columns } from './users-table/components/columns';
import { Card } from '@/components/ui/card';
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

  return (
    <>
      {isLoading ? (
        <Card className="text-card-foreground flex flex-col gap-6 bg-white/95 rounded-3xl border-2 border-white/50 shadow-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-center h-24">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-[#2454FF]" />
                <span className="text-[#64748B]">Loading members...</span>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="text-card-foreground flex flex-col gap-6 bg-white/95 rounded-3xl border-2 border-white/50 shadow-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key="table"
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <UsersTable
                  columns={columns}
                  data={displayUsers}
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </Card>
      )}
    </>
  );
}
