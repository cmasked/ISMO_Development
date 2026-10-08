import { useState } from 'react';
import { Keyboard, View } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthProvider';
import { Button, Choice, DateField, EmptyState, ErrorState, ErrorText, Field, Loading, Screen, Type } from '../components/ui';
import { useToast } from '../components/ToastProvider';
import { message } from '../lib/api';
import { useProjects, useRefresh } from '../lib/queries';
import { formatDate } from '../lib/validation';
import { labels, priorities, taskStatuses, type Project, type Task, type TaskInput, type TaskStatus, type Priority, type RootStackParams } from '../types';
type Props = NativeStackScreenProps<RootStackParams, 'TaskForm'>;
export function TaskFormScreen(props: Props) {
  const { api } = useAuth(); const id = props.route.params?.id; const projects = useProjects();
  const task = useQuery({ queryKey: ['task', id], queryFn: ({ signal }) => api.task(id!, signal), enabled: !!id });
  if (projects.isPending || (id && task.isPending)) return <Screen><Loading label="Loading task details…" /></Screen>;
  if (projects.isError || (id && task.isError)) return <Screen><ErrorState text={message(projects.error || task.error)} retry={() => { void projects.refetch(); if (id) void task.refetch(); }} /></Screen>;
  if (!projects.data.length) return <Screen><EmptyState title="Create a project first" description="Every task belongs to a project. Give your work a home before adding a task." label="Create a project" action={() => props.navigation.navigate('ProjectForm')} /></Screen>;
  return <TaskForm key={id || 'new'} task={task.data} projects={projects.data} projectId={props.route.params?.projectId} navigation={props.navigation} />;
}
function TaskForm({ task, projects, projectId: initialProject, navigation }: { task?: Task; projects: Project[]; projectId?: string; navigation: Props['navigation'] }) {
  const { api } = useAuth(); const refresh = useRefresh(); const toast = useToast();
  const [name, setName] = useState(task?.name || ''); const [description, setDescription] = useState(task?.description || '');
  const [projectId, setProject] = useState(task?.projectId || initialProject || '');
  const [priority, setPriority] = useState<Priority>(task?.priority || 'MEDIUM'); const [status, setStatus] = useState<TaskStatus>(task?.status || 'PENDING');
  const [dueDate, setDue] = useState(task?.dueDate || ''); const [validation, setValidation] = useState('');
  const save = useMutation({ mutationFn: (input: TaskInput) => api.saveTask(input, task?.id), onSuccess: async () => { await refresh(); toast(task ? 'Task updated.' : 'Task created.'); navigation.goBack(); } });
  function submit() {
    if (save.isPending) return; Keyboard.dismiss(); setValidation('');
    if (!name.trim()) { setValidation('Please give your task a name.'); return; }
    if (!projectId || !projects.some(project => project.id === projectId)) { setValidation('Choose a project for this task.'); return; }
    save.mutate({ name: name.trim(), description: description.trim() || null, projectId, priority, status, dueDate: dueDate || null });
  }
  return <Screen><Type variant="title">{task ? 'Edit task' : 'Create a task'}</Type><Type muted>Break your project into a clear next step.</Type><View pointerEvents={save.isPending ? 'none' : 'auto'} style={{ gap: 20 }}>
    <Field testID="task-name" label="Task name" value={name} onChangeText={setName} maxLength={150} autoFocus={!task} editable={!save.isPending} />
    <Field label="Description (optional)" value={description} onChangeText={setDescription} maxLength={10000} multiline numberOfLines={4} style={{ minHeight: 115 }} editable={!save.isPending} />
    <Choice testID="task-project" label="Project" value={projectId} onChange={setProject} options={projects.map(project => ({ value: project.id, label: project.name }))} />
    <Choice testID="task-priority" label="Priority" value={priority} onChange={value => setPriority(value as Priority)} options={priorities.map(value => ({ value, label: labels[value] }))} />
    <Choice testID="task-form-status" label="Status" value={status} onChange={value => setStatus(value as TaskStatus)} options={taskStatuses.map(value => ({ value, label: labels[value] }))} />
    <DateField label="Due date (optional)" value={dueDate} onChange={setDue} />
    {task && <Type variant="small" muted>Created: {formatDate(task.createdAt)}</Type>}
  </View><ErrorText text={validation || (save.error ? message(save.error) : '')} /><Button testID="save-task" label={task ? 'Save changes' : 'Create task'} variant="primary" busy={save.isPending} onPress={submit} /><Button label="Cancel" disabled={save.isPending} onPress={() => navigation.goBack()} /></Screen>;
}
