import type { Table } from '@tanstack/react-table';
import { Icon } from '@/components/medvanta';

interface UsersTablePaginationProps<TData> {
  table: Table<TData>;
  /** Plural noun for the row count, e.g. "members" / "admins". */
  noun?: string;
}

export function UsersTablePagination<TData>({
  table,
  noun = 'members',
}: UsersTablePaginationProps<TData>): React.ReactElement {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const pageCount = Math.max(table.getPageCount(), 1);
  const total = table.getFilteredRowModel().rows.length;
  const start = total === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, total);

  const handlePageChange = (nextPage: number): void => {
    table.setPageIndex(nextPage - 1);
  };

  return (
    <div className="cf">
      <span>
        Showing{' '}
        <b className="mono" style={{ color: 'var(--text-body)' }}>
          {start}–{end}
        </b>{' '}
        of{' '}
        <b className="mono" style={{ color: 'var(--text-body)' }}>
          {total}
        </b>{' '}
        {noun}
      </span>
      <span className="sp row" style={{ gap: 14 }}>
        <span className="sel">
          <select
            value={pageSize}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
            aria-label="Rows per page"
          >
            {[10, 25, 50].map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
          <span className="ci">
            <Icon name="ChevronDown" size={16} />
          </span>
        </span>
        <span className="pg">
          <button
            type="button"
            disabled={!table.getCanPreviousPage()}
            onClick={() => handlePageChange(pageIndex)}
            aria-label="Previous page"
          >
            <Icon name="ChevronLeft" size={16} />
          </button>
          {Array.from({ length: pageCount }, (_, index) => index + 1)
            .slice(
              Math.max(0, pageIndex - 1),
              Math.min(pageCount, pageIndex + 2),
            )
            .map((page) => (
              <button
                key={page}
                type="button"
                className={pageIndex + 1 === page ? 'on' : undefined}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
          <button
            type="button"
            disabled={!table.getCanNextPage()}
            onClick={() => handlePageChange(pageIndex + 2)}
            aria-label="Next page"
          >
            <Icon name="ChevronRight" size={16} />
          </button>
        </span>
      </span>
    </div>
  );
}
