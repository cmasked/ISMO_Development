import { useMemo, useState } from 'react';
import { pageItems, sortedItems, type ListItem, type SortKey } from './list';
export function useListPage<T extends ListItem>(items: readonly T[] | undefined, filterKey: string, size: number) {
  const [sort, setSort] = useState<SortKey>('newest');
  const [position, setPosition] = useState({ key: '', page: 1 });
  const key = filterKey + ':' + sort;
  const sorted = useMemo(() => sortedItems(items || [], sort), [items, sort]);
  const result = pageItems(sorted, position.key === key ? position.page : 1, size);
  const setPage = (page: number) => setPosition({ key, page });
  return { ...result, sort, setSort, setPage };
}
