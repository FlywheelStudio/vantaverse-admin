import { Pagination } from '@/components/medvanta';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Table } from '@tanstack/react-table';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';

interface UsersTablePaginationProps {
  table: Table<ProfileWithStats>;
}

export function UsersTablePagination({
  table,
}: UsersTablePaginationProps): React.ReactElement {
  const isMobile = useIsMobile();
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = Math.max(table.getPageCount(), 1);

  return (
    <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex justify-center md:justify-start">
        <span className="text-[length:var(--text-sm)] text-[var(--text-muted)]">
          {table.getFilteredRowModel().rows.length} member(s) total.
        </span>
      </div>
      <div className="flex items-center justify-center">
        <Pagination
          page={pageIndex + 1}
          pageCount={pageCount}
          onChange={(page) => table.setPageIndex(page - 1)}
          className={isMobile ? 'scale-95' : undefined}
        />
      </div>
    </div>
  );
}
