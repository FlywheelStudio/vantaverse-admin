'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Icon } from '@/components/medvanta';
import {
  useProgramAssignments,
  programAssignmentsInfiniteQueryOptions,
} from '@/hooks/use-passignments';
import { CreateTemplateForm } from './form';
import { useDebounce } from '@/hooks/use-debounce';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { HtmlSearchField } from '@/app/(authenticated)/groups/partials/html-search-field';
import { HtmlTableFooter } from '@/app/(authenticated)/groups/partials/html-table-footer';
import { HtmlRowMenu } from '../partials/html-toolbar';
import { builderWorkoutHref, formatRelativeEdited } from '../partials/html-utils';
import {
  useCloneProgramAssignment,
  useDeleteProgramAssignment,
  type ProgramTemplateMemberStats,
  type ProgramAssignmentsPage,
} from '@/hooks/use-passignments';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';
import { usePreheat } from '@/hooks/use-preheat';

interface ProgramBuilderProps {
  onTemplateSelect?: (assignment: ProgramAssignmentWithTemplate) => void;
  initialData?: {
    pages: ProgramAssignmentsPage[];
    pageParams: number[];
  };
  showCreateForm?: boolean;
  onCreateFormClose?: () => void;
}

function ProgramTableRow({
  assignment,
  onClick,
  memberStats,
  duplicatePending,
  onDuplicate,
  onDelete,
}: {
  assignment: ProgramAssignmentWithTemplate;
  onClick: () => void;
  memberStats?: { members: number; avgCompletion: number | null };
  duplicatePending: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
}): React.ReactElement | null {
  const router = useRouter();
  const { getPreheatHandlers } = usePreheat();
  const template = assignment.program_template;
  if (!template) return null;

  const weeksLabel = `${template.weeks} week${template.weeks === 1 ? '' : 's'}`;
  const edited = formatRelativeEdited(template.updated_at);
  const assignmentId = assignment.id;
  const builderHref = `/builder/${assignmentId}`;
  const rowPreheatHandlers = getPreheatHandlers(builderHref);
  const membersOnIt = memberStats?.members ?? 0;
  const isTemplate = assignment.status === 'template';

  return (
    <tr onClick={onClick} style={{ cursor: 'pointer' }} {...rowPreheatHandlers}>
      <td>
        <div className="cellp">
          <span
            className="thmb"
            style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(140deg, var(--navy-800), var(--navy-600))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="Dumbbell" size={18} style={{ color: 'rgba(255,255,255,.9)' }} />
          </span>
          <span style={{ minWidth: 0 }}>
            <span className="row" style={{ gap: 7 }}>
              <span className="nm" style={{ display: 'block' }}>
                {template.name}
              </span>
              {isTemplate ? <span className="bdg bdg-b">Template</span> : null}
            </span>
            {template.goals ? (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                {template.goals}
              </span>
            ) : null}
            {assignment.profiles?.email ? (
              <span
                className="row"
                style={{ gap: 4, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}
              >
                Assigned to
                <a
                  href={`/users/${assignment.profiles.id}`}
                  style={{ color: 'var(--primary)', textDecoration: 'underline' }}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    router.push(`/users/${assignment.profiles!.id}`);
                  }}
                  {...getPreheatHandlers(`/users/${assignment.profiles.id}`)}
                >
                  {assignment.profiles.email}
                </a>
              </span>
            ) : null}
          </span>
        </div>
      </td>
      <td>
        <span className="mono" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}>
          {weeksLabel}
        </span>
      </td>
      <td>
        <span
          className="mono"
          style={{
            fontSize: 'var(--text-sm)',
            color: membersOnIt > 0 ? 'var(--text-body)' : 'var(--text-muted)',
          }}
        >
          {membersOnIt}
        </span>
      </td>
      <td>
        <span className="mut" style={{ fontSize: 'var(--text-sm)' }}>
          {edited}
        </span>
      </td>
      <td
        style={{ textAlign: 'right', width: 52 }}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <HtmlRowMenu
          items={[
            {
              id: 'edit-template',
              label: 'Edit template',
              onSelect: assignmentId
                ? () => {
                    router.push(`/builder/${assignmentId}`);
                  }
                : undefined,
            },
            {
              id: 'edit-workout',
              label: 'Edit workout schedule',
              onSelect: assignmentId
                ? () => {
                    router.push(builderWorkoutHref(assignmentId));
                  }
                : undefined,
            },
            {
              id: 'assign',
              label: 'Assign to members',
              disabled: !assignmentId || !isTemplate,
              onSelect: () => {
                router.push(`/builder/review-assign?id=${assignmentId}`);
              },
            },
            {
              id: 'duplicate',
              label: 'Duplicate',
              disabled: !assignmentId || duplicatePending,
              onSelect: onDuplicate,
            },
            {
              id: 'delete',
              label: 'Delete',
              danger: true,
              disabled: !assignmentId,
              onSelect: onDelete,
            },
          ]}
        />
      </td>
    </tr>
  );
}

export function ProgramBuilder({
  onTemplateSelect,
  initialData,
  showCreateForm: showCreateFormProp = false,
  onCreateFormClose,
}: ProgramBuilderProps): React.ReactElement {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [showCreateFormLocal, setShowCreateFormLocal] = useState(false);
  const showCreateForm = showCreateFormProp || showCreateFormLocal;
  const [listPage, setListPage] = useState(1);
  const [showAssigned, setShowAssigned] = useState(false);
  const pageSize = 21;

  const debouncedSearch = useDebounce(searchValue, 300);
  const shouldUseInitialData = !debouncedSearch && !showAssigned;

  const {
    assignments,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    data,
  } = useProgramAssignments(
    debouncedSearch,
    undefined,
    pageSize,
    showAssigned,
    shouldUseInitialData ? initialData : undefined,
  );

  const totalCount = data?.pages[0]?.total ?? assignments.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const safeListPage = Math.min(listPage, pageCount);
  const prefetchTriggeredRef = useRef(false);

  const visibleAssignments = useMemo(() => {
    const start = (safeListPage - 1) * pageSize;
    return assignments.slice(start, start + pageSize);
  }, [assignments, safeListPage, pageSize]);

  const memberStatsByTemplate = useMemo(() => {
    const merged: ProgramTemplateMemberStats = {};
    for (const page of data?.pages ?? []) {
      Object.assign(merged, page.memberStats);
    }
    return merged;
  }, [data]);

  const cloneMutation = useCloneProgramAssignment(
    debouncedSearch,
    undefined,
    pageSize,
    showAssigned,
  );
  const deleteMutation = useDeleteProgramAssignment(
    debouncedSearch,
    undefined,
    pageSize,
    showAssigned,
  );
  const [deleteTarget, setDeleteTarget] = useState<ProgramAssignmentWithTemplate | null>(null);

  const deleteTargetName = deleteTarget?.program_template?.name ?? '';
  const deleteTargetMembers =
    deleteTarget?.program_template?.id && memberStatsByTemplate[deleteTarget.program_template.id]
      ? (memberStatsByTemplate[deleteTarget.program_template.id].members ?? 0)
      : 0;
  const deleteTargetDescription = [
    'This permanently removes the template and its schedule.',
    deleteTargetMembers > 0
      ? `It is currently used by ${deleteTargetMembers} member${
          deleteTargetMembers === 1 ? '' : 's'
        }; their assigned programs will stop referencing it.`
      : null,
    'Type the template name below to confirm.',
  ]
    .filter(Boolean)
    .join(' ');

  const visibleRangeStart = totalCount === 0 ? 0 : (safeListPage - 1) * pageSize + 1;
  const visibleRangeEnd = Math.min(safeListPage * pageSize, totalCount);

  const handleRowClick = (assignment: ProgramAssignmentWithTemplate): void => {
    if (assignment.id) {
      router.push(`/builder/${assignment.id}`);
      onTemplateSelect?.(assignment);
    }
  };

  const closeCreateForm = (): void => {
    setShowCreateFormLocal(false);
    onCreateFormClose?.();
  };

  const handleCreateSuccess = (): void => {
    closeCreateForm();
  };

  const handleCreateCancel = (): void => {
    closeCreateForm();
  };

  const handleSearchChange = useCallback((value: string): void => {
    setSearchValue(value);
    setListPage(1);
    prefetchTriggeredRef.current = false;
  }, []);

  const handleShowAssignedChange = useCallback((value: boolean): void => {
    setShowAssigned(value);
    setListPage(1);
    prefetchTriggeredRef.current = false;
  }, []);

  const handlePageChange = useCallback((nextPage: number): void => {
    setListPage(nextPage);
  }, []);

  useEffect(() => {
    const neededCount = safeListPage * pageSize;
    if (assignments.length < neededCount && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [
    safeListPage,
    pageSize,
    assignments.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const queryOptions = programAssignmentsInfiniteQueryOptions(
      debouncedSearch,
      undefined,
      pageSize,
      false,
    );

    const handleScroll = (): void => {
      const scrollProgress =
        (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;

      if (scrollProgress > 0.8 && !prefetchTriggeredRef.current) {
        prefetchTriggeredRef.current = true;
        queryClient.prefetchInfiniteQuery(queryOptions);
      }

      if (scrollProgress > 0.9) {
        fetchNextPage().then(() => {
          prefetchTriggeredRef.current = false;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    queryClient,
    debouncedSearch,
    pageSize,
  ]);

  return (
    <>
      {showCreateForm ? (
        <CreateTemplateForm
          onSuccess={handleCreateSuccess}
          onCancel={handleCreateCancel}
        />
      ) : null}

      <div className="tbar">
        <HtmlSearchField
          placeholder="Search by name, goal or description…"
          value={searchValue}
          onChange={handleSearchChange}
        />
        <span className="seg">
          <button
            type="button"
            className={!showAssigned ? 'on' : undefined}
            onClick={() => handleShowAssignedChange(false)}
          >
            Templates
          </button>
          <button
            type="button"
            className={showAssigned ? 'on' : undefined}
            onClick={() => handleShowAssignedChange(true)}
          >
            Assigned
          </button>
        </span>
      </div>

      <div className="tw">
        <table className="tbl">
          <thead>
            <tr>
              <th className="srt">Template</th>
              <th className="srt">Length</th>
              <th className="srt">Members on it</th>
              <th className="srt">Last edited</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '24px 0' }}>
                  <span className="row" style={{ gap: 8, justifyContent: 'center' }}>
                    <Icon name="LoaderCircle" size={18} className="animate-spin" />
                    Loading programs…
                  </span>
                </td>
              </tr>
            ) : assignments.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '24px 0' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                    {debouncedSearch ? 'No programs found matching your search.' : 'No programs available.'}
                  </span>
                </td>
              </tr>
            ) : (
              visibleAssignments.map((assignment) => (
                <ProgramTableRow
                  key={assignment.id}
                  assignment={assignment}
                  onClick={() => handleRowClick(assignment)}
                  duplicatePending={cloneMutation.isPending}
                  onDuplicate={() => cloneMutation.mutate(assignment.id)}
                  onDelete={() => setDeleteTarget(assignment)}
                  memberStats={
                    assignment.program_template?.id
                      ? memberStatsByTemplate[assignment.program_template.id]
                      : undefined
                  }
                />
              ))
            )}
          </tbody>
        </table>
        <HtmlTableFooter
          summary={
            <>
              Showing{' '}
              <b className="mono" style={{ color: 'var(--text-body)' }}>
                {visibleRangeStart}-{visibleRangeEnd}
              </b>{' '}
              of{' '}
              <b className="mono" style={{ color: 'var(--text-body)' }}>
                {totalCount}
              </b>{' '}
              templates
            </>
          }
          page={safeListPage}
          pageCount={pageCount}
          onPageChange={handlePageChange}
        />
      </div>

      {isFetchingNextPage ? (
        <div className="row" style={{ justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <Icon name="LoaderCircle" size={18} className="animate-spin text-[var(--primary)]" />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            Loading more programs…
          </span>
        </div>
      ) : null}

      <DeleteConfirmationDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={deleteTargetName ? `Delete “${deleteTargetName}”?` : 'Delete template?'}
        description={deleteTargetDescription}
        confirmText={deleteTargetName || undefined}
        onConfirm={async () => {
          if (!deleteTarget?.id) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </>
  );
}
