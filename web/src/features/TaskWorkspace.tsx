import { Pagination } from '../components/Pagination';
import { taskSortOptions, type SortKey } from '../lib/list';
import { useListPage } from '../lib/useListPage';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Task } from '../types';
import { labels, priorities, taskStatuses } from '../types';
import { errorMessage } from '../lib/api';
import { useDebounced, useProjects, useTasks } from '../lib/queries';
import { CreateButton, EmptyState, ErrorState, Loading } from '../components/ui';
import { DeleteConfirmation, TaskForm } from './forms';
import { TaskList } from './TaskList';
export function TaskWorkspace({ projectId }: { projectId?: string }) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [project, setProject] = useState('');
  const [editor, setEditor] = useState<Task | 'create' | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const tasks = useTasks({ search: debouncedSearch, status, priority, projectId: projectId || project });
  const list = useListPage(tasks.data, JSON.stringify([search, status, priority, projectId, project]), 10);
  const projects = useProjects();
  const filtered = !!(search.trim() || status || priority || (!projectId && project));
  const canCreate = !!projects.data?.length;
  const reset = () => { setSearch(''); setStatus(''); setPriority(''); setProject(''); };
  return <section className="task-workspace">
    <div className="section-heading"><div><h2>{projectId ? 'Tasks in this project' : 'Your tasks'}</h2><p>Keep the next step in sight.</p></div><CreateButton onClick={() => { list.setPage(1); setEditor('create'); }} disabled={!canCreate}>Create a task</CreateButton></div>
    {projects.isError && <ErrorState message={errorMessage(projects.error)} retry={() => void projects.refetch()} />}
    {!projects.isPending && !projects.isError && !canCreate && <p className="helper">Tasks belong to projects. <Link to="/projects">Create your first project</Link> to get started.</p>}
    <div className="filter-bar"><label className="search-field"><span>Search tasks</span><input aria-label="Search tasks" type="search" placeholder="Search by task name" value={search} onChange={event => setSearch(event.target.value)} /></label>
    <label className="filter-field"><span>Status</span><select aria-label="Status" value={status} onChange={event => setStatus(event.target.value)}><option value="">All statuses</option>{taskStatuses.map(value => <option key={value} value={value}>{labels[value]}</option>)}</select></label>
    <label className="filter-field"><span>Priority</span><select aria-label="Priority" value={priority} onChange={event => setPriority(event.target.value)}><option value="">All priorities</option>{priorities.map(value => <option key={value} value={value}>{labels[value]}</option>)}</select></label>
    {!projectId && <label className="filter-field"><span>Project</span><select aria-label="Project" value={project} onChange={event => setProject(event.target.value)} disabled={projects.isPending || projects.isError}><option value="">All projects</option>{projects.data?.map(value => <option key={value.id} value={value.id}>{value.name}</option>)}</select></label>}
    <label className="filter-field"><span>Sort tasks</span><select aria-label="Sort tasks" value={list.sort} onChange={event => list.setSort(event.target.value as SortKey)}>{taskSortOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
    {filtered && <button className="button subtle" onClick={reset}>Clear filters</button>}</div>
    {tasks.isPending ? <Loading label="Loading tasks…" cards={3} /> : tasks.isError ? <ErrorState message={errorMessage(tasks.error)} retry={() => void tasks.refetch()} /> : tasks.data.length ? <>
      <p className="results-count" role="status">{tasks.data.length} {tasks.data.length === 1 ? 'task' : 'tasks'}{filtered ? ' found' : ''}</p>
      <TaskList tasks={list.items} projects={projectId ? [] : projects.data} onEdit={setEditor} onDelete={setDeleting} />
    </> : <EmptyState title={filtered ? 'No tasks found' : 'No tasks yet'} description={filtered ? 'Try another name or adjust your filters.' : projectId ? 'Add your first task to start moving this project forward.' : 'Turn your projects into small, manageable steps.'} action={filtered ? reset : canCreate ? () => setEditor('create') : undefined} actionLabel={filtered ? 'Clear filters' : 'Create a task'} />}
    {tasks.data && <Pagination {...list} busy={tasks.isFetching} onChange={list.setPage} label="Tasks pages" />}
    {editor && <TaskForm task={editor === 'create' ? undefined : editor} projectId={projectId} onClose={() => setEditor(null)} />}
    {deleting && <DeleteConfirmation kind="task" item={deleting} onClose={() => setDeleting(null)} />}
  </section>;
}
