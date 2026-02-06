'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { LayoutGrid, Users } from 'lucide-react';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import { generateColorFromSeed } from '@/components/ui/avatar';

interface ManagementOverviewCardProps {
  organizations: Organization[];
  totalMemberCount: number;
  memberCountsByOrg: Record<string, number>;
}

export function ManagementOverviewCard({
  organizations,
  totalMemberCount,
  memberCountsByOrg,
}: ManagementOverviewCardProps) {
  return (
    <Card className="overflow-hidden border border-border bg-background shadow-(--shadow-lg) p-4 py-6 space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-semibold text-foreground">
          Management Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="overflow-hidden border border-border bg-linear-to-br from-blue-500/10 to-blue-500/5">
            <div className="p-6 flex flex-col items-center justify-center text-center">
              <LayoutGrid className="h-10 w-10 text-blue-600 dark:text-blue-400 mb-2" />
              <span className="text-3xl font-bold text-foreground">
                {organizations.length}
              </span>
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Groups Managing
              </span>
            </div>
          </Card>
          <Card className="overflow-hidden border border-border bg-linear-to-br from-emerald-500/10 to-emerald-500/5">
            <div className="p-6 flex flex-col items-center justify-center text-center">
              <Users className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mb-2" />
              <span className="text-3xl font-bold text-foreground">
                {totalMemberCount}
              </span>
              <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                Members Managing
              </span>
            </div>
          </Card>
        </div>
        {organizations.length > 0 && (
          <>
            <h3 className="text-lg font-semibold text-foreground mt-6">
              Groups You Manage
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {organizations.map((org) => {
                const bg = generateColorFromSeed(org.id, { gradient: true });
                return (
                  <Link key={org.id} href={`/groups/${org.id}`}>
                    <Card className="border border-border p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div
                        className="h-10 w-10 rounded-lg shrink-0 overflow-hidden relative bg-muted shadow-(--shadow-md)"
                        style={!org.picture_url ? { backgroundImage: bg } : undefined}
                      >
                        {org.picture_url && (
                          <Image
                            src={org.picture_url}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {org.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {memberCountsByOrg[org.id] ?? 0} members
                        </p>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </motion.div>
    </Card>
  );
}
