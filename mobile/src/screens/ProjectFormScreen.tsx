import { useState } from 'react';
import { Keyboard, View } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthProvider';
import { Button, Choice, DateField, ErrorState, ErrorText, Field, Loading, Screen, Type } from '../components/ui';
import { useToast } from '../components/ToastProvider';
import { message } from '../lib/api';
import { useRefresh } from '../lib/queries';
import { formatDate } from '../lib/validation';
import { labels, projectStatuses, type Project, type ProjectInput, type ProjectStatus, type RootStackParams } from '../types';
type Props = NativeStackScreenProps<RootStackParams, 'ProjectForm'>;
export function ProjectFormScreen(props: Props) {
  const { api } = useAuth(); const id = props.route.params?.id;
  const project = useQuery({ queryKey: ['project', id], queryFn: ({ signal }) => api.project(id!, signal), enabled: !!id });
  if (id && project.isPending) return <Screen><Loading label="Loading your project…" /></Screen>;
  if (id && project.isError) return <Screen><ErrorState text={message(project.error)} retry={() => { void project.refetch(); }} /></Screen>;
  return <ProjectForm key={id || 'new'} project={project.data} navigation={props.navigation} />;
}
function ProjectForm({ project, navigation }: { project?: Project; navigation: Props['navigation'] }) {
  const { api } = useAuth(); const refresh = useRefresh(); const toast = useToast();
  const [name, setName] = useState(project?.name || ''); const [description, setDescription] = useState(project?.description || '');
  const [status, setStatus] = useState<ProjectStatus>(project?.status || 'NOT_STARTED');
  const [startDate, setStart] = useState(project?.startDate || ''); const [endDate, setEnd] = useState(project?.endDate || '');
  const [validation, setValidation] = useState('');
  const save = useMutation({ mutationFn: (input: ProjectInput) => api.saveProject(input, project?.id), onSuccess: async item => { await refresh(); toast(project ? 'Project updated.' : 'Project created.'); if (project) navigation.goBack(); else navigation.replace('ProjectDetails', { id: item.id }); } });
  function submit() {
    if (save.isPending) return; Keyboard.dismiss(); setValidation('');
    if (!name.trim()) { setValidation('Please give your project a name.'); return; }
    if (startDate && endDate && endDate < startDate) { setValidation('The end date must be on or after the start date.'); return; }
    save.mutate({ name: name.trim(), description: description.trim() || null, status, startDate: startDate || null, endDate: endDate || null });
  }
  return <Screen><Type variant="title">{project ? 'Edit project' : 'Create a project'}</Type><Type muted>Give your work a home. Add tasks once your project is ready.</Type><View pointerEvents={save.isPending ? 'none' : 'auto'} style={{ gap: 20 }}>
    <Field testID="project-name" label="Project name" value={name} onChangeText={setName} maxLength={150} autoFocus={!project} editable={!save.isPending} />
    <Field label="Description (optional)" value={description} onChangeText={setDescription} maxLength={10000} multiline numberOfLines={4} style={{ minHeight: 115 }} editable={!save.isPending} />
    <Choice testID="project-status" label="Status" value={status} onChange={value => setStatus(value as ProjectStatus)} options={projectStatuses.map(value => ({ value, label: labels[value] }))} />
    <DateField label="Start date (optional)" value={startDate} onChange={setStart} /><DateField label="End date (optional)" value={endDate} onChange={setEnd} />
    {project && <Type variant="small" muted>Created: {formatDate(project.createdAt)}</Type>}
  </View><ErrorText text={validation || (save.error ? message(save.error) : '')} /><Button testID="save-project" label={project ? 'Save changes' : 'Create project'} variant="primary" busy={save.isPending} onPress={submit} /><Button label="Cancel" disabled={save.isPending} onPress={() => navigation.goBack()} /></Screen>;
}
