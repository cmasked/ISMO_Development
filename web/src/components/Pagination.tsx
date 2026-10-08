export function Pagination({ page, pages, total, start, end, busy, onChange, label }: { page: number; pages: number; total: number; start: number; end: number; busy: boolean; onChange: (page: number) => void; label: string }) {
  if (!total) return null;
  return <nav className="pagination" aria-label={label}><span>Showing {start}–{end} of {total}</span><div><button className="button" disabled={busy || page <= 1} onClick={() => onChange(page - 1)}>Previous</button><span aria-live="polite">Page {page} of {pages}</span><button className="button" disabled={busy || page >= pages} onClick={() => onChange(page + 1)}>Next</button></div></nav>;
}
