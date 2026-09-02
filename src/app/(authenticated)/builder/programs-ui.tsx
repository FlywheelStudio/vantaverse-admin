'use client';

import { useState } from 'react';
import { Icon } from '@/components/medvanta';
import { AppBar } from '@/components/medvanta/shell';
import { ProgramBuilder } from './program/builder';
import { PreProgramCard } from './program/pre-program-card';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';

interface ProgramsUIProps {
  preProgramAssignment: ProgramAssignmentWithTemplate | null;
  initialData?: {
    pages: Array<{
      data: ProgramAssignmentWithTemplate[];
      page: number;
      pageSize: number;
      total: number;
      hasMore: boolean;
    }>;
    pageParams: number[];
  };
  templateTotal: number;
}

export function ProgramsUI({
  preProgramAssignment,
  initialData,
  templateTotal,
}: ProgramsUIProps): React.ReactElement {
  const [createRequested, setCreateRequested] = useState(false);

  return (
    <>
      <AppBar
        crumbs={[{ label: 'Programs' }]}
        title="Programs"
        subtitle={`${templateTotal} template${templateTotal === 1 ? '' : 's'} · active member programs`}
        actions={
          <>
            <button
              type="button"
              className="btn btn-acc"
              onClick={() => setCreateRequested(true)}
            >
              <Icon name="Plus" size={17} />
              New template
            </button>
          </>
        }
      />
      <div className="body">
        {preProgramAssignment ? <PreProgramCard assignment={preProgramAssignment} /> : null}
        <ProgramBuilder
          initialData={initialData}
          showCreateForm={createRequested}
          onCreateFormClose={() => setCreateRequested(false)}
        />
      </div>
    </>
  );
}
