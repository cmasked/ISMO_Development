import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api } from './api';
export function useDebounced(value: string) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const timer = setTimeout(() => setDebounced(value.trim()), 250); return () => clearTimeout(timer); }, [value]);
  return debounced;
}
export function useProjects(filters: Record<string, string> = {}) {
  return useQuery({ queryKey: ['projects', filters], queryFn: ({ signal }) => api.projects(filters, signal) });
}
export function useTasks(filters: Record<string, string> = {}) {
  return useQuery({ queryKey: ['tasks', filters], queryFn: ({ signal }) => api.tasks(filters, signal) });
}
export function useRefreshData() {
  const client = useQueryClient();
  return async () => {
    await Promise.all(['projects', 'project', 'tasks', 'dashboard'].map(key =>
      client.invalidateQueries({ queryKey: [key] })));
  };
}
export function formatDate(value: string | null, fallback = 'Not set') {
  if (!value) return fallback;
  // Calendar dates stay calendar dates in every browser timezone.
  const date = new Date(value.length === 10 ? value + 'T12:00:00' : value);
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}
