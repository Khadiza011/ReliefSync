import { useMemo, useState } from 'react';
import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Download, Search, SearchX } from 'lucide-react';
import { Input } from './Field';
import { Button } from './Button';
import { EmptyState, ErrorState, SkeletonRows } from './Feedback';
import { useDebounce, useOnChange } from '../../hooks/useUi';
import { cx, exportCsv } from '../../utils/helpers';

/**
 * Data table with search, sortable columns, pagination, CSV export,
 * loading/empty/error states and a card layout on small screens.
 *
 * columns: [{ key, header, render?(row), sortValue?(row), align?, width?, sortable?, csv? }]
 */
export function DataTable({
  columns,
  rows = [],
  rowKey,
  loading = false,
  error,
  onRetry,
  searchKeys = [],
  searchPlaceholder = 'Search…',
  filters,
  actions,
  onRowClick,
  empty,
  pageSize = 10,
  initialSort,
  exportName,
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(initialSort || null);
  const [pageState, setPage] = useState(1);
  const debounced = useDebounce(query, 150);

  const searched = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q || searchKeys.length === 0) return rows;
    return rows.filter((row) =>
      searchKeys.some((k) => {
        const v = typeof k === 'function' ? k(row) : row?.[k];
        return v !== undefined && v !== null && String(v).toLowerCase().includes(q);
      })
    );
  }, [rows, debounced, searchKeys]);

  const sorted = useMemo(() => {
    if (!sort) return searched;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return searched;
    const getter = col.sortValue || ((row) => row?.[col.key]);
    const dir = sort.dir === 'desc' ? -1 : 1;
    return [...searched].sort((a, b) => {
      const va = getter(a);
      const vb = getter(b);
      if (va === vb) return 0;
      if (va === null || va === undefined || va === '') return 1;
      if (vb === null || vb === undefined || vb === '') return -1;
      const na = Number(va);
      const nb = Number(vb);
      if (!Number.isNaN(na) && !Number.isNaN(nb) && typeof va !== 'boolean') return (na - nb) * dir;
      const da = Date.parse(va);
      const db = Date.parse(vb);
      if (!Number.isNaN(da) && !Number.isNaN(db) && /\d{4}-\d{2}-\d{2}/.test(String(va))) return (da - db) * dir;
      return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
  }, [searched, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));

  // Back to the first page whenever the search or the data set changes
  useOnChange(`${debounced}|${rows.length}`, () => setPage(1));
  const page = Math.min(pageState, totalPages);

  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (col) => {
    if (col.sortable === false || !col.key) return;
    setSort((prev) => {
      if (!prev || prev.key !== col.key) return { key: col.key, dir: 'asc' };
      if (prev.dir === 'asc') return { key: col.key, dir: 'desc' };
      return null;
    });
  };

  const getKey = (row, i) => (typeof rowKey === 'function' ? rowKey(row) : row?.[rowKey]) ?? i;

  const showToolbar = searchKeys.length > 0 || filters || actions || exportName;

  let body;
  if (loading && rows.length === 0) {
    body = <SkeletonRows rows={6} columns={Math.min(columns.length, 6)} />;
  } else if (error && rows.length === 0) {
    body = <ErrorState title="Couldn't load this data" error={error} onRetry={onRetry} />;
  } else if (sorted.length === 0) {
    body =
      rows.length > 0 ? (
        <EmptyState
          icon={SearchX}
          title="No matching records"
          description="Try a different search term or clear the filters."
          compact
        />
      ) : (
        <EmptyState
          icon={empty?.icon}
          title={empty?.title || 'Nothing here yet'}
          description={empty?.description}
          action={empty?.action}
        />
      );
  } else {
    body = (
      <div className="table-scroll">
        <table className="table table--responsive">
          <thead>
            <tr>
              {columns.map((col) => {
                const sortable = col.sortable !== false && !!col.key && col.header;
                const isSorted = sort?.key === col.key;
                const SortIcon = !isSorted ? ArrowUpDown : sort.dir === 'asc' ? ChevronUp : ChevronDown;
                return (
                  <th
                    key={col.key || col.header}
                    className={cx(sortable && 'is-sortable', isSorted && 'is-sorted', col.align === 'right' && 'align-right')}
                    style={{ width: col.width }}
                    onClick={sortable ? () => toggleSort(col) : undefined}
                    aria-sort={isSorted ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                    scope="col"
                  >
                    <span className="th-inner">
                      {col.header}
                      {sortable && <SortIcon className="sort-icon" aria-hidden="true" />}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr
                key={getKey(row, i)}
                style={{ '--i': i }}
                className={onRowClick ? 'is-clickable' : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter') onRowClick(row);
                      }
                    : undefined
                }
              >
                {columns.map((col) => (
                  <td
                    key={col.key || col.header}
                    data-label={col.header}
                    className={col.align === 'right' ? 'align-right' : undefined}
                  >
                    {col.render ? col.render(row) : (row?.[col.key] ?? <span className="muted">—</span>)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const from = sorted.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, sorted.length);

  return (
    <div className="table-shell">
      {showToolbar && (
        <div className="table-toolbar">
          {searchKeys.length > 0 && (
            <div className="table-toolbar__search">
              <Input
                icon={Search}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                type="search"
              />
            </div>
          )}
          {filters && <div className="table-toolbar__filters">{filters}</div>}
          <div className="table-toolbar__meta">
            <span className="tabular">
              {sorted.length.toLocaleString()} {sorted.length === 1 ? 'record' : 'records'}
            </span>
            {exportName && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Download />}
                onClick={() => exportCsv(`${exportName}-${new Date().toISOString().slice(0, 10)}.csv`, columns, sorted)}
                disabled={sorted.length === 0}
              >
                Export
              </Button>
            )}
            {actions}
          </div>
        </div>
      )}

      {body}

      {sorted.length > pageSize && (
        <div className="table-footer">
          <span className="tabular">
            Showing {from}–{to} of {sorted.length}
          </span>
          <nav className="pager" aria-label="Pagination">
            <button
              type="button"
              className="pager__btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft />
            </button>
            {pageNumbers(page, totalPages).map((n, i) =>
              n === '…' ? (
                <span key={`gap-${i}`} className="pager__btn" aria-hidden="true">
                  …
                </span>
              ) : (
                <button
                  key={n}
                  type="button"
                  className="pager__btn"
                  aria-current={n === page ? 'page' : undefined}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              )
            )}
            <button
              type="button"
              className="pager__btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="Next page"
            >
              <ChevronRight />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

function pageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const list = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  list.forEach((n, i) => {
    if (i > 0 && n - list[i - 1] > 1) out.push('…');
    out.push(n);
  });
  return out;
}

/** Compact select used inside table toolbars. */
export function FilterSelect({ value, onChange, options, label }) {
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export default DataTable;
