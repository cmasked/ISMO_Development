import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2 } from '../components/icons';
import { api, errorMessage } from '../lib/api';
import { formatDate, useTasks } from '../lib/queries';
import { Badge, CreateButton, ErrorState, Loading, ProgressRing } from '../components/ui';
import { DeleteConfirmation, ProjectForm, TaskForm } from '../features/forms';
import { TaskWorkspace } from '../features/TaskWorkspace';
export function ProjectDetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const project = useQuery({ queryKey: ['project', id], queryFn: ({ signal }) => api.project(id, signal) });
  const tasks = useTasks({ projectId: id });
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  if (project.isPending) return <Loading label="Loading project…" />;
  if (project.isError) return <><Link className="text-link" to="/projects">← Back to projects</Link><ErrorState message={errorMessage(project.error)} retry={() => void project.refetch()} /></>;
  const value = project.data;
  return <>
    <div className="details-toolbar"><nav aria-label="Breadcrumb"><Link to="/projects">Projects</Link><span aria-hidden="true">/</span><span>{value.name}</span></nav><div className="heading-actions"><button className="button subtle" onClick={() => setEditing(true)}><Pencil size={16} />Edit project</button><button className="button subtle delete-action" onClick={() => setDeleting(true)}><Trash2 size={16} />Delete project</button><CreateButton onClick={() => setCreatingTask(true)}>Create a task</CreateButton></div></div>
    <div className="project-hero-grid"><section className="project-hero"><div className="hero-watermark" aria-hidden="true" /><Badge value={value.status} /><h1>{value.name}</h1><p className="project-description">{value.description || 'No description added yet. Edit the project to share a little context.'}</p><dl className="project-metadata"><div><dt>Start date</dt><dd>{formatDate(value.startDate)}</dd></div><div><dt>End date</dt><dd>{formatDate(value.endDate)}</dd></div><div><dt>Created</dt><dd>{formatDate(value.createdAt)}</dd></div></dl></section>
    <section className="project-completion"><h2>Task completion</h2>{tasks.isPending ? <Loading label="Loading task completion…" cards={1} /> : tasks.isError ? <ErrorState message={errorMessage(tasks.error)} retry={() => void tasks.refetch()} /> : <><ProgressRing completed={tasks.data.filter(task => task.status === 'COMPLETED').length} total={tasks.data.length} /><p>{tasks.data.filter(task => task.status === 'COMPLETED').length} of {tasks.data.length} tasks completed</p><small>Project status is managed separately.</small></>}</section></div>
    <TaskWorkspace key={id} projectId={id} />
    {editing && <ProjectForm project={value} onClose={() => setEditing(false)} />}
    {deleting && <DeleteConfirmation kind="project" item={value} onClose={() => setDeleting(false)} onDeleted={() => navigate('/projects', { replace: true })} />}
    {creatingTask && <TaskForm projectId={id} onClose={() => setCreatingTask(false)} />}
  </>;
}
