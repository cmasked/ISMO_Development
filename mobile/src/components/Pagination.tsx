import { View } from 'react-native';
import { Button, Type } from './ui';
export function Pagination({ page, pages, total, start, end, busy, onChange }: { page: number; pages: number; total: number; start: number; end: number; busy: boolean; onChange: (page: number) => void }) {
  if (!total) return null;
  return <View style={{ gap: 12 }}><Type variant="small" muted>Showing {start}–{end} of {total} · Page {page} of {pages}</Type><View style={{ flexDirection: 'row', gap: 12 }}><Button label="Previous page" disabled={busy || page <= 1} style={{ flex: 1 }} onPress={() => onChange(page - 1)} /><Button label="Next page" disabled={busy || page >= pages} style={{ flex: 1 }} onPress={() => onChange(page + 1)} /></View></View>;
}
