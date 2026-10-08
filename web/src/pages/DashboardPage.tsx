import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { Dashboard, Task } from '../types';
import { api, errorMessage } from '../lib/api';
import { useProjects, useTasks } from '../lib/queries';
import { CreateButton, EmptyState, ErrorState, Loading, PageHeading } from '../components/ui';
import { ProjectCard } from '../features/ProjectCard';
import { TaskList } from '../features/TaskList';
import { DeleteConfirmation, ProjectForm, TaskForm } from '../features/forms';
const metrics: { key: keyof Dashboard; label: string; description: string; color: string }[] = [
  { key: 'totalProjects', label: 'Total projects', description: 'All your projects', color: 'blue' },
  { key: 'totalTasks', label: 'Total tasks', description: 'Across every project', color: 'yellow' },
  { key: 'completedTasks', label: 'Completed tasks', description: 'Work you’ve finished', color: 'red' },
  { key: 'pendingTasks', label: 'Pending tasks', description: 'Ready to get started', color: 'neutral' },
  { key: 'projectsInProgress', label: 'Projects in progress', description: 'Work in motion', color: 'dark' },
];
export function DashboardPage() {
  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: ({ signal }) => api.dashboard(signal) });
  const projects = useProjects();
  const tasks = useTasks();
  const [creatingProject, setCreatingProject] = useState(false);
  const [editor, setEditor] = useState<Task | 'create' | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  return <>
    <PageHeading title="Dashboard" description="See where things stand, and choose your next step."><button className="button" disabled={!projects.data?.length} onClick={() => setEditor('create')}>Create a task</button><CreateButton onClick={() => setCreatingProject(true)}>Create a project</CreateButton></PageHeading>
    {dashboard.isPending ? <Loading label="Loading your overview…" cards={5} /> : dashboard.isError ? <ErrorState message={errorMessage(dashboard.error)} retry={() => void dashboard.refetch()} /> :
      <div className="metrics">{metrics.map(metric => <article className={'metric metric-' + metric.color} key={metric.key} data-testid={'metric-' + metric.key}><span>{metric.label}</span><strong>{dashboard.data[metric.key]}</strong><small>{metric.description}</small><i aria-hidden="true" /></article>)}</div>}
    <div className="dashboard-columns"><section><div className="section-heading"><h2><i className="title-square" aria-hidden="true" />Recent projects</h2><Link className="text-link" to="/projects">View all →</Link></div>
      {projects.isPending ? <Loading label="Loading recent projects…" cards={2} /> : projects.isError ? <ErrorState message={errorMessage(projects.error)} retry={() => void projects.refetch()} /> : projects.data.length ? <div className="dashboard-projects">{projects.data.slice(0, 3).map(project => <ProjectCard key={project.id} project={project} tasks={tasks.data?.filter(task => task.projectId === project.id)} />)}</div> : <EmptyState title="No projects yet" description="Start with a project. Your tasks will find their home here." action={() => setCreatingProject(true)} actionLabel="Create a project" />}
    </section><section><div className="section-heading"><h2><i className="title-circle" aria-hidden="true" />Recent tasks</h2><Link className="text-link" to="/tasks">View all →</Link></div>
      {tasks.isPending ? <Loading label="Loading recent tasks…" cards={2} /> : tasks.isError ? <ErrorState message={errorMessage(tasks.error)} retry={() => void tasks.refetch()} /> : tasks.data.length ? <TaskList tasks={tasks.data.slice(0, 4)} projects={projects.data} onEdit={setEditor} onDelete={setDeleting} compact /> : <EmptyState title="No tasks yet" description={projects.data?.length ? 'Add a task and take your first step.' : 'Create a project, then break it into tasks.'} action={projects.data?.length ? () => setEditor('create') : () => setCreatingProject(true)} actionLabel={projects.data?.length ? 'Create a task' : 'Create a project'} />}
      <div className="workspace-callout"><span className="eyebrow">One step at a time</span><h3>Make progress visible.</h3><p>Keep your tasks up to date and your next step clear.</p><div className="callout-circle" aria-hidden="true" /></div>
    </section></div>
    {creatingProject && <ProjectForm onClose={() => setCreatingProject(false)} />}
    {editor && <TaskForm task={editor === 'create' ? undefined : editor} onClose={() => setEditor(null)} />}
    {deleting && <DeleteConfirmation kind="task" item={deleting} onClose={() => setDeleting(null)} />}
  </>;
}
