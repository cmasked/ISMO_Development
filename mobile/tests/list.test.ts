import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pageItems, sortedItems } from '../src/lib/list';
import { pageItems as webPage, sortedItems as webSort } from '../../web/src/lib/list';
const rows = [
  { id: 'b', name: 'Task 10', createdAt: '2026-10-02T12:00:00Z', dueDate: null, priority: 'LOW' },
  { id: 'a', name: 'Task 2', createdAt: '2026-10-01T12:00:00Z', dueDate: '2026-10-15', priority: 'HIGH' },
  { id: 'c', name: 'task 1', createdAt: '2026-10-03T12:00:00Z', dueDate: '2026-10-20', priority: 'MEDIUM' }
];
test('sorting is natural, deterministic, and does not mutate the API data', () => {
  for (const sort of [sortedItems, webSort]) {
    assert.deepEqual(sort(rows, 'name').map(x => x.id), ['c', 'a', 'b']);
    assert.deepEqual(sort(rows, 'newest').map(x => x.id), ['c', 'b', 'a']);
    assert.deepEqual(sort(rows, 'oldest').map(x => x.id), ['a', 'b', 'c']);
    assert.deepEqual(sort(rows, 'priority').map(x => x.id), ['a', 'c', 'b']);
  }
  assert.deepEqual(rows.map(x => x.id), ['b', 'a', 'c']);
});
test('missing dates stay last in both date directions and project end dates work', () => {
  for (const sort of [sortedItems, webSort]) {
    assert.deepEqual(sort(rows, 'date').map(x => x.id), ['a', 'c', 'b']);
    assert.deepEqual(sort(rows, 'date-desc').map(x => x.id), ['c', 'a', 'b']);
    assert.deepEqual(sort(rows.map(({ dueDate, ...row }) => ({ ...row, endDate: dueDate })), 'date').map(x => x.id), ['a', 'c', 'b']);
  }
});
test('pagination follows sorting/filtering and clamps after deletion', () => {
  for (const paginate of [pageItems, webPage]) {
    const ordered = sortedItems(rows, 'name');
    assert.deepEqual(paginate(ordered, 2, 2).items.map(x => x.id), ['b']);
    assert.equal(paginate(ordered, 2, 2).start, 3);
    const filtered = ordered.filter(x => x.priority === 'HIGH');
    assert.deepEqual(paginate(filtered, 2, 2), { items: filtered, page: 1, pages: 1, total: 1, start: 1, end: 1 });
    assert.deepEqual(paginate([], 3, 2), { items: [], page: 1, pages: 1, total: 0, start: 0, end: 0 });
  }
});
