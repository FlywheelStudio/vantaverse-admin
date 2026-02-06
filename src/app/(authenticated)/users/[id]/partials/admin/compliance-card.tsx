'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { AdminComplianceBarChart, type ComplianceByOrgItem } from './bar-chart';
import type { UserNeedingAttention } from '@/lib/supabase/queries/dashboard';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import { generateColorFromSeed } from '@/components/ui/avatar';

interface ComplianceCardProps {
  chartData: ComplianceByOrgItem[];
  lowComplianceUsers: UserNeedingAttention[];
  organizations: Organization[];
}

export function ComplianceCard({
  chartData,
  lowComplianceUsers,
  organizations,
}: ComplianceCardProps) {
  return (
    <Card className="overflow-hidden border border-border bg-background shadow-(--shadow-lg) p-4 py-6 space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-semibold text-foreground">
          Group compliance
        </h2>
        <AdminComplianceBarChart data={chartData} />
        <div className="space-y-2 pt-2 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground">
            Users with low compliance
          </h3>
          {lowComplianceUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No users below threshold in your groups.
            </p>
          ) : (
            <ul className="space-y-2">
              {lowComplianceUsers.map((u) => {
                const org = organizations.find((o) => o.id === u.organization_id);
                const bg = generateColorFromSeed(org?.id || 'default', {
                  gradient: true,
                });
                return (
                  <li key={u.user_id}>
                    <Link
                      href={`/users/${u.user_id}`}
                      className="group flex items-center justify-between gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="h-8 w-8 rounded-md shrink-0 overflow-hidden relative bg-muted shadow-(--shadow-sm)"
                          style={
                            !org?.picture_url ? { backgroundImage: bg } : undefined
                          }
                        >
                          {org?.picture_url && (
                            <Image
                              src={org.picture_url}
                              alt=""
                              fill
                              sizes="32px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <span className="text-sm font-medium text-primary group-hover:underline truncate">
                          {[u.first_name, u.last_name].filter(Boolean).join(' ') ||
                            u.email ||
                            u.user_id}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground tabular-nums">
                        {Math.round(u.compliance)}%
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </motion.div>
    </Card>
  );
}
