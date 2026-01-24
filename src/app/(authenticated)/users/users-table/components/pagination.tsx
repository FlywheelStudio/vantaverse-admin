import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Table } from '@tanstack/react-table';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';

interface UsersTablePaginationProps {
  table: Table<ProfileWithStats>;
}

export function UsersTablePagination({ table }: UsersTablePaginationProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-6">
      <div className="flex justify-center md:justify-start">
        <span className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} member(s) total.
        </span>
      </div>
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="rounded-[var(--radius-pill)]"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <div className="px-4 py-2 bg-primary/10 text-primary rounded-[var(--radius-pill)] font-medium text-sm">
          {isMobile
            ? `${table.getState().pagination.pageIndex + 1}/${table.getPageCount()}`
            : `Page ${table.getState().pagination.pageIndex + 1} of ${table.getPageCount()}`}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="rounded-[var(--radius-pill)]"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
