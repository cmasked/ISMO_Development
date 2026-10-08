import { useState } from 'react';
import type { Project } from '../types';
import { labels, projectStatuses } from '../types';
import { errorMessage } from '../lib/api';
import { useDebounced, useProjects, useTasks } from '../lib/queries';
import { CreateButton, EmptyState, ErrorState, Loading, PageHeading } from '../components/ui';
import { ProjectCard } from '../features/ProjectCard';
import { DeleteConfirmation, ProjectForm } from '../features/forms';
export function ProjectsPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [status, setStatus] = useState('');
  const [editor, setEditor] = useState<Project | 'create' | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const projects = useProjects({ search: debouncedSearch, status });
  const all = useProjects();
  const tasks = useTasks();
  const filtered = !!(search.trim() || status);
  const reset = () => { setSearch(''); setStatus(''); };
  return <>
    <PageHeading title="Projects" description="A home for everything you’re working on."><CreateButton onClick={() => setEditor('create')}>Create a project</CreateButton></PageHeading>
    <div className="project-filters"><div className="filter-pills" role="group" aria-label="Filter projects by status">
      {['', ...projectStatuses].map(value => <button key={value} className={status === value ? 'selected' : ''} aria-pressed={status === value} onClick={() => setStatus(value)}>{value ? labels[value as keyof typeof labels] : 'All projects'}{all.data && <span>{value ? all.data.filter(project => project.status === value).length : all.data.length}</span>}</button>)}
    </div><label className="search-field"><span>Search projects</span><input aria-label="Search projects" type="search" placeholder="Search by project name" value={search} onChange={event => setSearch(event.target.value)} /></label></div>
    {all.isError && filtered && <p className="helper">Project totals are unavailable. <button className="text-button" onClick={() => void all.refetch()}>Try again</button></p>}
    {tasks.isError && <p className="helper">Task completion summaries are unavailable. <button className="text-button" onClick={() => void tasks.refetch()}>Try again</button></p>}
    {projects.isPending ? <Loading label="Loading projects…" cards={6} /> : projects.isError ? <ErrorState message={errorMessage(projects.error)} retry={() => void projects.refetch()} /> : projects.data.length ? <>
      <div className="section-heading"><h2>{filtered ? 'Matching projects' : 'Your projects'}</h2><span className="results-count" role="status">{projects.data.length} {projects.data.length === 1 ? 'project' : 'projects'}</span></div>
      <div className="projects-grid">{projects.data.map(project => <ProjectCard key={project.id} project={project} tasks={tasks.data?.filter(task => task.projectId === project.id)} onEdit={() => setEditor(project)} onDelete={() => setDeleting(project)} />)}</div>
    </> : <EmptyState title={filtered ? 'No projects found' : 'No projects yet'} description={filtered ? 'Try a different name or clear your filters.' : 'Give your next idea a place to grow. Create a project, then add your tasks.'} action={filtered ? reset : () => setEditor('create')} actionLabel={filtered ? 'Clear filters' : 'Create a project'} />}
    {editor && <ProjectForm project={editor === 'create' ? undefined : editor} onClose={() => setEditor(null)} />}
    {deleting && <DeleteConfirmation kind="project" item={deleting} onClose={() => setDeleting(null)} />}
  </>;
}
