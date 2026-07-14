/**
 * Simple prev/next pagination controls.
 */
export default function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  label = '项',
}) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <nav className="recipe-pagination" aria-label="分页">
      <p className="recipe-pagination-info">
        第 {start}–{end} {label}，共 {totalItems} {label}
      </p>
      <div className="recipe-pagination-controls">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ← 上一页
        </button>
        <span className="recipe-pagination-page" aria-current="page">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          下一页 →
        </button>
      </div>
    </nav>
  );
}

export function paginateItems(items, page, pageSize) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    totalPages,
    totalItems,
    pageSize,
    items: items.slice(start, start + pageSize),
  };
}
