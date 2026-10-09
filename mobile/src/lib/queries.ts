import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthProvider';
export function useDebounced(value: string) { const [result, setResult] = useState(value); useEffect(() => { const timer = setTimeout(() => setResult(value.trim()), 250); return () => clearTimeout(timer); }, [value]); return result; }
export function useProjects(filters: Record<string, string> = {}) { const { api } = useAuth(); const values = Object.fromEntries(Object.entries(filters).filter(([, value]) => !!value)); return useQuery({ queryKey: ['projects', values], queryFn: ({ signal }) => api.projects(values, signal) }); }
export function useTasks(filters: Record<string, string> = {}) { const { api } = useAuth(); const values = Object.fromEntries(Object.entries(filters).filter(([, value]) => !!value)); return useQuery({ queryKey: ['tasks', values], queryFn: ({ signal }) => api.tasks(values, signal) }); }
export function useRefresh() { const client = useQueryClient(); return useCallback(() => Promise.all(['projects', 'project', 'tasks', 'task', 'dashboard'].map(key => client.invalidateQueries({ queryKey: [key] }))), [client]); }
