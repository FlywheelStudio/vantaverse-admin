'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper } from '@/components/page-wrapper';
import { useUsers } from '@/hooks/use-users';
import { UsersTable } from './users-table';
import { columns } from './users-table/components/columns';
import { Card } from '@/components/ui/card';

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

export default function UsersPage() {
  const [filters, setFilters] = useState<{
    organization_id?: string;
    team_id?: string;
    journey_phase?: string;
  }>({});
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const loadedOnceRef = useRef(false);
  const { data: users, isLoading } = useUsers(filters);

  const displayUsers = users || [];

  // Track if we've loaded data at least once
  useEffect(() => {
    if (!isLoading && displayUsers.length > 0 && !loadedOnceRef.current) {
      loadedOnceRef.current = true;
      setTimeout(() => {
        setHasLoadedOnce(true);
      }, 0);
    }
  }, [isLoading, displayUsers.length]);

  return (
    <PageWrapper
      subheader={<h1 className="text-2xl font-medium">Users Management</h1>}
    >
      <div className="p-6 flex-1 min-h-0 overflow-y-auto h-full slim-scrollbar glass-background">
        {hasLoadedOnce && (
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
      </div>
    </PageWrapper>
  );
}
