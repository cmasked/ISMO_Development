export type SortKey = 'newest' | 'oldest' | 'name' | 'name-desc' | 'date' | 'date-desc' | 'priority';
export interface ListItem { id: string; name: string; createdAt: string; endDate?: string | null; dueDate?: string | null; priority?: string }
const rank: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };
export function sortedItems<T extends ListItem>(items: readonly T[], sort: SortKey): T[] {
  return [...items].sort((a, b) => {
    let result = 0;
    if (sort === 'name' || sort === 'name-desc') result = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }) * (sort === 'name-desc' ? -1 : 1);
    else if (sort === 'priority') result = (rank[b.priority || ''] || 0) - (rank[a.priority || ''] || 0);
    else if (sort === 'date' || sort === 'date-desc') {
      const left = a.dueDate ?? a.endDate; const right = b.dueDate ?? b.endDate;
      if (!left || !right) { if (!left && right) return 1; if (left && !right) return -1; }
      else result = left.localeCompare(right) * (sort === 'date-desc' ? -1 : 1);
    } else result = a.createdAt.localeCompare(b.createdAt) * (sort === 'oldest' ? 1 : -1);
    return result || a.id.localeCompare(b.id);
  });
}
export function pageItems<T>(items: readonly T[], requested: number, size: number) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const page = Math.max(1, Math.min(requested, pages));
  return { items: items.slice((page - 1) * size, page * size), page, pages, total: items.length, start: items.length ? (page - 1) * size + 1 : 0, end: Math.min(page * size, items.length) };
}
export const projectSortOptions: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name: A–Z' }, { value: 'name-desc', label: 'Name: Z–A' },
  { value: 'date', label: 'End date: earliest' }, { value: 'date-desc', label: 'End date: latest' }
];
export const taskSortOptions: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name: A–Z' }, { value: 'name-desc', label: 'Name: Z–A' },
  { value: 'date', label: 'Due date: earliest' }, { value: 'date-desc', label: 'Due date: latest' },
  { value: 'priority', label: 'Priority: high to low' }
];
