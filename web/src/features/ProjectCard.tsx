import { ArrowRight, CalendarDays, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Project, Task } from '../types';
import { formatDate } from '../lib/queries';
import { Badge, ProgressRing } from '../components/ui';
export function ProjectCard({ project, tasks, onEdit, onDelete }: { project: Project; tasks?: Task[]; onEdit?: () => void; onDelete?: () => void }) {
  const completed = tasks?.filter(task => task.status === 'COMPLETED').length || 0;
  return <article className="project-card"><div className="card-top"><Badge value={project.status} /><span className="small-geometry" aria-hidden="true" /></div>
    <h3><Link to={'/projects/' + project.id}>{project.name}</Link></h3><p className="card-description">{project.description || 'No description added yet.'}</p>
    {tasks && <div className="project-progress"><ProgressRing completed={completed} total={tasks.length} /><div><strong>{completed} of {tasks.length} tasks</strong><small>{tasks.length ? 'Completed in this project' : 'Ready for your first task'}</small></div></div>}
    <div className="project-dates"><CalendarDays size={15} /><span>{formatDate(project.startDate, 'No start date')} <span aria-hidden="true">→</span> {formatDate(project.endDate, 'No end date')}</span></div>
    <footer><Link className="text-link" to={'/projects/' + project.id}>Open project <ArrowRight size={15} /></Link><div className="row-actions">{onEdit && <button className="icon-button" aria-label={'Edit ' + project.name} onClick={onEdit}><Pencil size={16} /></button>}{onDelete && <button className="icon-button delete-action" aria-label={'Delete ' + project.name} onClick={onDelete}><Trash2 size={16} /></button>}</div></footer>
  </article>;
}
