import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { Project, ProjectInput, ProjectStatus, Task, TaskInput, TaskStatus, Priority } from '../types';
import { labels, priorities, projectStatuses, taskStatuses } from '../types';
import { api, errorMessage } from '../lib/api';
import { useProjects, useRefreshData } from '../lib/queries';
import { ErrorState, Field, InlineError, Loading, Modal } from '../components/ui';
import { useToast } from '../components/Toasts';
function text(data: FormData, key: string) { return String(data.get(key) || '').trim(); }
function nullable(data: FormData, key: string) { return text(data, key) || null; }
export function ProjectForm({ project, onClose, onSaved }: { project?: Project; onClose: () => void; onSaved?: (project: Project) => void }) {
  const refresh = useRefreshData();
  const toast = useToast();
  const [validation, setValidation] = useState('');
  const mutation = useMutation({ mutationFn: (input: ProjectInput) => api.saveProject(input, project?.id), onSuccess: async saved => {
    await refresh(); toast(project ? 'Project updated.' : 'Project created.'); onClose(); onSaved?.(saved);
  } });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    const data = new FormData(event.currentTarget);
    const input: ProjectInput = { name: text(data, 'name'), description: nullable(data, 'description'),
      status: text(data, 'status') as ProjectStatus, startDate: nullable(data, 'startDate'), endDate: nullable(data, 'endDate') };
    setValidation('');
    if (!input.name) { setValidation('Please give your project a name.'); return; }
    if (input.startDate && input.endDate && input.endDate < input.startDate) { setValidation('The end date must be on or after the start date.'); return; }
    mutation.mutate(input);
  }
  return <Modal title={project ? 'Edit project' : 'Create a project'} onClose={onClose} busy={mutation.isPending}>
    <p className="modal-description">Give your work a home. You can add tasks once the project is ready.</p>
    <form onSubmit={submit}><fieldset disabled={mutation.isPending}>
      <Field label="Project name"><input name="name" defaultValue={project?.name} required maxLength={150} autoFocus /></Field>
      <Field label="Description (optional)"><textarea name="description" defaultValue={project?.description || ''} rows={3} maxLength={10000} /></Field>
      <Field label="Status"><select name="status" defaultValue={project?.status || 'NOT_STARTED'}>{projectStatuses.map(status => <option key={status} value={status}>{labels[status]}</option>)}</select></Field>
      <div className="form-grid"><Field label="Start date (optional)"><input name="startDate" type="date" min="0001-01-01" max="9999-12-31" defaultValue={project?.startDate || ''} /></Field><Field label="End date (optional)"><input name="endDate" type="date" min="0001-01-01" max="9999-12-31" defaultValue={project?.endDate || ''} /></Field></div>
    </fieldset>
    {(validation || mutation.error) && <InlineError error={validation ? new Error(validation) : mutation.error} />}
    <div className="form-actions"><button type="button" className="button" onClick={onClose} disabled={mutation.isPending}>Cancel</button><button className="button primary" disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : project ? 'Save changes' : 'Create project'}</button></div></form>
  </Modal>;
}
export function TaskForm({ task, projectId, onClose }: { task?: Task; projectId?: string; onClose: () => void }) {
  const projects = useProjects();
  const refresh = useRefreshData();
  const toast = useToast();
  const [validation, setValidation] = useState('');
  const mutation = useMutation({ mutationFn: (input: TaskInput) => api.saveTask(input, task?.id), onSuccess: async () => {
    await refresh(); toast(task ? 'Task updated.' : 'Task created.'); onClose();
  } });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    const data = new FormData(event.currentTarget);
    const input: TaskInput = { name: text(data, 'name'), description: nullable(data, 'description'),
      projectId: text(data, 'projectId'), priority: text(data, 'priority') as Priority, status: text(data, 'status') as TaskStatus, dueDate: nullable(data, 'dueDate') };
    setValidation('');
    if (!input.name) { setValidation('Please give your task a name.'); return; }
    if (!input.projectId) { setValidation('Choose a project for this task.'); return; }
    mutation.mutate(input);
  }
  return <Modal title={task ? 'Edit task' : 'Create a task'} onClose={onClose} busy={mutation.isPending}>
    <p className="modal-description">Break your project into a clear next step.</p>
    {projects.isPending ? <Loading label="Loading your projects…" cards={1} /> : projects.isError ? <ErrorState message={errorMessage(projects.error)} retry={() => void projects.refetch()} /> : <form onSubmit={submit}><fieldset disabled={mutation.isPending}>
      <Field label="Task name"><input name="name" defaultValue={task?.name} required maxLength={150} autoFocus /></Field>
      <Field label="Description (optional)"><textarea name="description" defaultValue={task?.description || ''} rows={3} maxLength={10000} /></Field>
      <Field label="Project"><select name="projectId" required defaultValue={task?.projectId || projectId || ''}><option value="" disabled>Choose a project</option>{projects.data.map(project => <option value={project.id} key={project.id}>{project.name}</option>)}</select></Field>
      {!projects.data.length && <p className="helper">Create a project before adding a task.</p>}
      <div className="form-grid"><Field label="Priority"><select name="priority" defaultValue={task?.priority || 'MEDIUM'}>{priorities.map(priority => <option key={priority} value={priority}>{labels[priority]}</option>)}</select></Field>
      <Field label="Status"><select name="status" defaultValue={task?.status || 'PENDING'}>{taskStatuses.map(status => <option key={status} value={status}>{labels[status]}</option>)}</select></Field></div>
      <Field label="Due date (optional)"><input name="dueDate" type="date" min="0001-01-01" max="9999-12-31" defaultValue={task?.dueDate || ''} /></Field>
    </fieldset>
    {(validation || mutation.error) && <InlineError error={validation ? new Error(validation) : mutation.error} />}
    <div className="form-actions"><button type="button" className="button" onClick={onClose} disabled={mutation.isPending}>Cancel</button><button className="button primary" disabled={mutation.isPending || !projects.data.length}>{mutation.isPending ? 'Saving…' : task ? 'Save changes' : 'Create task'}</button></div></form>}
  </Modal>;
}
export function DeleteConfirmation({ item, kind, onClose, onDeleted }: { item: Project | Task; kind: 'project' | 'task'; onClose: () => void; onDeleted?: () => void }) {
  const refresh = useRefreshData();
  const toast = useToast();
  const mutation = useMutation({ mutationFn: () => kind === 'project' ? api.deleteProject(item.id) : api.deleteTask(item.id), onSuccess: async () => {
    // Navigate away from a deleted detail before invalidating its query.
    onDeleted?.(); onClose(); toast(kind === 'project' ? 'Project deleted.' : 'Task deleted.'); await refresh();
  } });
  return <Modal title={'Delete ' + kind + '?'} onClose={onClose} busy={mutation.isPending}><p className="delete-copy">“{item.name}” will be permanently deleted.{kind === 'project' ? ' All tasks in this project will also be deleted.' : ''} This can’t be undone.</p>
    {mutation.error && <InlineError error={mutation.error} />}
    <div className="form-actions"><button className="button" onClick={onClose} disabled={mutation.isPending}>Keep {kind}</button><button className="button danger" onClick={() => mutation.mutate()} disabled={mutation.isPending}>{mutation.isPending ? 'Deleting…' : 'Delete ' + kind}</button></div>
  </Modal>;
}
