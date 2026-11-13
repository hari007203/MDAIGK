import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState, ErrorState, Loading } from './Feedback';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string;
  /** Hide on narrow screens. */
  hideSm?: boolean;
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize?: number;
  onPage: (page: number) => void;
  /** Show numbered page buttons with a window around the current page instead of "Page X of Y". */
  numbered?: boolean;
  /** Noun used in the "Showing X–Y of Z …" summary. */
  totalLabel?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T, index: number) => string;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyMessage?: ReactNode;
  emptyAction?: ReactNode;
  pagination?: PaginationProps;
  caption?: string;
  /** Show a subtle refetch indicator while keeping previous rows visible. */
  fetching?: boolean;
  rowClassName?: (row: T) => string | undefined;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  onRetry,
  emptyTitle = 'No records found',
  emptyMessage,
  emptyAction,
  pagination,
  caption,
  fetching,
  rowClassName,
}: DataTableProps<T>) {
  if (loading && !rows) return <Loading />;
  if (error && !rows) return <ErrorState error={error} onRetry={onRetry} />;
  if (!rows || rows.length === 0) return <EmptyState title={emptyTitle} message={emptyMessage} action={emptyAction} />;
  return (
    <div className={`table-wrap ${fetching ? 'table-wrap--fetching' : ''}`}>
      <div className="table-scroll">
        <table className="table">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" style={{ width: c.width, textAlign: c.align }} className={c.hideSm ? 'hide-sm' : undefined}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={rowKey(r, i)} className={rowClassName?.(r)}>
                {columns.map((c) => (
                  <td key={c.key} style={{ textAlign: c.align }} className={c.hideSm ? 'hide-sm' : undefined}>
                    {c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && <Pagination {...pagination} />}
    </div>
  );
}

function pageWindow(page: number, totalPages: number): Array<number | '…'> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: Array<number | '…'> = [1];
  const lo = Math.max(2, page - 1);
  const hi = Math.min(totalPages - 1, page + 1);
  if (lo > 2) pages.push('…');
  for (let n = lo; n <= hi; n++) pages.push(n);
  if (hi < totalPages - 1) pages.push('…');
  pages.push(totalPages);
  return pages;
}

export function Pagination({ page, totalPages, total, pageSize, onPage, numbered, totalLabel }: PaginationProps) {
  const from = pageSize ? (page - 1) * pageSize + 1 : undefined;
  const to = pageSize ? Math.min(page * pageSize, total) : undefined;
  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="pagination__info">
        {totalLabel
          ? from !== undefined && total > 0
            ? `Showing ${from}–${to} of ${total.toLocaleString('en-IN')} ${totalLabel}`
            : `${total.toLocaleString('en-IN')} ${totalLabel} total`
          : from !== undefined && total > 0
            ? `${from}–${to} of ${total.toLocaleString('en-IN')}`
            : `${total.toLocaleString('en-IN')} total`}
      </span>
      <div className="pagination__controls">
        <button type="button" className="icon-btn" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>
        {numbered ? (
          pageWindow(page, Math.max(1, totalPages)).map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="pagination__ellipsis" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className="pagination__page"
                aria-current={p === page ? 'page' : undefined}
                onClick={() => onPage(p)}
              >
                {p}
              </button>
            ),
          )
        ) : (
          <span aria-current="page">
            Page {page} of {Math.max(1, totalPages)}
          </span>
        )}
        <button type="button" className="icon-btn" onClick={() => onPage(page + 1)} disabled={page >= totalPages} aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
