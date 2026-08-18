import { cn } from '../utils/cn';

export interface TableColumn<T extends Record<string, unknown> = Record<string, unknown>> {
  key: string;
  header: React.ReactNode;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => React.ReactNode;
}

interface TableProps<T extends Record<string, unknown> = Record<string, unknown>> {
  columns?: TableColumn<T>[];
  rows?: T[];
  onRowClick?: (row: T) => void;
  className?: string;
  style?: React.CSSProperties;
}

/** Lightweight admin data table. */
export function Table<T extends Record<string, unknown> = Record<string, unknown>>({
  columns = [],
  rows = [],
  onRowClick,
  className,
  style,
}: TableProps<T>): React.ReactElement {
  return (
    <div
      className={cn(
        'w-full overflow-x-auto rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-card)]',
        className,
      )}
      style={style}
    >
      <table className="w-full border-collapse text-[length:var(--text-md)]">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="whitespace-nowrap border-b border-[var(--border-subtle)] bg-[var(--slate-50)] px-4 py-3 text-[length:var(--text-xs)] font-[var(--fw-bold)] uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]"
                style={{ textAlign: column.align ?? 'left', width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'transition-[background] duration-[var(--dur-fast)]',
                onRowClick && 'cursor-pointer hover:bg-[var(--slate-50)]',
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-4 py-[13px] align-middle text-[var(--text-body)]"
                  style={{
                    textAlign: column.align ?? 'left',
                    borderBottom:
                      rowIndex < rows.length - 1
                        ? '1px solid var(--border-subtle)'
                        : undefined,
                  }}
                >
                  {column.render ? column.render(row) : String(row[column.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
