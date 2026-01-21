'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Organization } from '@/lib/supabase/schemas/organizations';

interface OrganizationTabsProps {
  organizations: Organization[];
  selectedOrgId: string | null;
  onOrgSelect: (orgId: string) => void;
  children: React.ReactNode;
  actionButton?: React.ReactNode;
}

export function OrganizationTabs({
  organizations,
  selectedOrgId,
  onOrgSelect,
  children,
  actionButton,
}: OrganizationTabsProps) {
  if (organizations.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        No organizations available
      </div>
    );
  }

  const defaultOrgId = selectedOrgId || organizations[0]?.id || null;

  return (
    <Tabs
      value={defaultOrgId || undefined}
      onValueChange={(value) => {
        if (value) {
          onOrgSelect(value);
        }
      }}
      className="w-full flex flex-col flex-1 min-h-0"
    >
      <div className="flex items-center gap-2 px-3 pt-3 shrink-0">
        <ScrollArea className="flex-1 min-w-0">
          <TabsList className="w-fit justify-start">
            {organizations.map((org) => (
              <TabsTrigger key={org.id} value={org.id} className="flex-none">
                {org.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>
        {actionButton && <div className="shrink-0">{actionButton}</div>}
      </div>
      <div className="flex-1 min-h-0">
        {organizations.map((org) => (
          <TabsContent
            key={org.id}
            value={org.id}
            className="flex flex-col flex-1 min-h-0"
          >
            {children}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
