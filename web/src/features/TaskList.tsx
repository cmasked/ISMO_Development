import { useMutation } from '@tanstack/react-query';
import { Check, Pencil, Trash2 } from '../components/icons';
import { Link } from 'react-router-dom';
import type { Project, Task, TaskStatus } from '../types';
import { labels, taskStatuses } from '../types';
import { api } from '../lib/api';
import { formatDate, useRefreshData } from '../lib/queries';
import { Badge, InlineError } from '../components/ui';
import { useToast } from '../components/Toasts';
function TaskRow({ task, project, onEdit, onDelete, compact }: { task: Task; project?: Project; onEdit: () => void; onDelete: () => void; compact: boolean }) {
  const refresh = useRefreshData();
  const toast = useToast();
  const mutation = useMutation({ mutationFn: (status: TaskStatus) => api.saveTask({ status }, task.id), onSuccess: async () => {
    await refresh(); toast('Task status updated.');
  } });
  return <li className={'task-row ' + (task.status === 'COMPLETED' ? 'completed' : '')}>
    <div className="task-row-body">
      <button className={'task-check ' + (task.status === 'COMPLETED' ? 'checked' : '')} aria-label={task.status === 'COMPLETED' ? 'Reopen ' + task.name : 'Mark ' + task.name + ' completed'} aria-pressed={task.status === 'COMPLETED'} disabled={mutation.isPending} onClick={() => mutation.mutate(task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED')}>{task.status === 'COMPLETED' && <Check size={17} />}</button>
      <div className="task-main"><strong>{task.name}</strong>{task.description && <p>{task.description}</p>}<div className="task-meta">{project && <Link to={'/projects/' + project.id}>{project.name}</Link>}<span>Due: {formatDate(task.dueDate)}</span>{!compact && <span>Created: {formatDate(task.createdAt)}</span>}</div></div>
      <div className="task-attributes"><Badge value={task.priority} /><select className="status-select" aria-label={'Status for ' + task.name} value={task.status} disabled={mutation.isPending} onChange={event => mutation.mutate(event.target.value as TaskStatus)}>{taskStatuses.map(status => <option key={status} value={status}>{labels[status]}</option>)}</select><div className="row-actions"><button className="icon-button" aria-label={'Edit ' + task.name} onClick={onEdit} disabled={mutation.isPending}><Pencil size={16} /></button><button className="icon-button delete-action" aria-label={'Delete ' + task.name} onClick={onDelete} disabled={mutation.isPending}><Trash2 size={16} /></button></div></div>
    </div>{mutation.error && <InlineError error={mutation.error} />}
  </li>;
}
export function TaskList({ tasks, projects = [], onEdit, onDelete, compact = false }: { tasks: Task[]; projects?: Project[]; onEdit: (task: Task) => void; onDelete: (task: Task) => void; compact?: boolean }) {
  return <ul className={'task-list ' + (compact ? 'compact' : '')}>{tasks.map(task => <TaskRow key={task.id} task={task} project={projects.find(project => project.id === task.projectId)} onEdit={() => onEdit(task)} onDelete={() => onDelete(task)} compact={compact} />)}</ul>;
}
