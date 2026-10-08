import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthProvider';
export function useDebounced(value: string) { const [result, setResult] = useState(value); useEffect(() => { const timer = setTimeout(() => setResult(value.trim()), 250); return () => clearTimeout(timer); }, [value]); return result; }
export function useProjects(filters: Record<string, string> = {}) { const { api } = useAuth(); return useQuery({ queryKey: ['projects', filters], queryFn: ({ signal }) => api.projects(filters, signal) }); }
export function useTasks(filters: Record<string, string> = {}) { const { api } = useAuth(); return useQuery({ queryKey: ['tasks', filters], queryFn: ({ signal }) => api.tasks(filters, signal) }); }
export function useRefresh() { const client = useQueryClient(); return () => Promise.all(['projects', 'project', 'tasks', 'task', 'dashboard'].map(key => client.invalidateQueries({ queryKey: [key] }))); }
