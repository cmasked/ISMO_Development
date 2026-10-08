import { Alert, View } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthProvider';
import { Badge, Button, Card, ErrorState, ErrorText, Loading, ProgressRing, Screen, Type } from '../components/ui';
import { useToast } from '../components/ToastProvider';
import { useRefresh, useTasks } from '../lib/queries';
import { message } from '../lib/api';
import { formatDate } from '../lib/validation';
import type { RootStackParams } from '../types';
import { TaskWorkspace } from '../features/TaskWorkspace';
export function ProjectDetailsScreen({ route, navigation }: NativeStackScreenProps<RootStackParams, 'ProjectDetails'>) {
  const { api } = useAuth(); const refresh = useRefresh(); const toast = useToast(); const id = route.params.id;
  const project = useQuery({ queryKey: ['project', id], queryFn: ({ signal }) => api.project(id, signal) });
  const tasks = useTasks({ projectId: id });
  const remove = useMutation({ mutationFn: () => api.deleteProject(id), onSuccess: async () => { navigation.popToTop(); toast('Project deleted.'); await refresh(); } });
  if (project.isPending) return <Screen><Loading label="Loading your project…" /></Screen>;
  if (project.isError) return <Screen><ErrorState text={message(project.error)} retry={() => { void project.refetch(); }} /></Screen>;
  const item = project.data;
  return <Screen refreshing={project.isRefetching || tasks.isRefetching} onRefresh={() => { void refresh(); }}><Card><Badge value={item.status} /><Type variant="title">{item.name}</Type><Type muted>{item.description || 'No description added.'}</Type><View style={{ gap: 8 }}><Type variant="small" muted>Start date: {formatDate(item.startDate)}</Type><Type variant="small" muted>End date: {formatDate(item.endDate)}</Type><Type variant="small" muted>Created: {formatDate(item.createdAt)}</Type></View></Card>
    <Button label="Edit project" disabled={remove.isPending} onPress={() => navigation.navigate('ProjectForm', { id })} />
    <Button label="Delete project" busy={remove.isPending} onPress={() => Alert.alert('Delete project?', '“' + item.name + '” and all its tasks will be permanently deleted. This can’t be undone.', [{ text: 'Keep project', style: 'cancel' }, { text: 'Delete project', style: 'destructive', onPress: () => remove.mutate() }])} />
    {remove.error && <ErrorText text={message(remove.error)} />}
    {tasks.data && <Card style={{ alignItems: 'center' }}><Type variant="heading">Task completion</Type><ProgressRing completed={tasks.data.filter(task => task.status === 'COMPLETED').length} total={tasks.data.length} /><Type>{tasks.data.filter(task => task.status === 'COMPLETED').length} of {tasks.data.length} tasks completed</Type><Type muted variant="small">Project status is managed separately.</Type></Card>}
    <TaskWorkspace projectId={id} />
  </Screen>;
}
