import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthProvider';
import { Badge, Button, Card, Choice, ErrorText, Type } from '../components/ui';
import { useToast } from '../components/ToastProvider';
import { message } from '../lib/api';
import { useRefresh } from '../lib/queries';
import { formatDate } from '../lib/validation';
import { labels, taskStatuses, type RootStackParams, type Task, type TaskStatus } from '../types';
export function TaskCard({ task, projectName }: { task: Task; projectName?: string }) {
  const [expanded, setExpanded] = useState(false);
  const { api } = useAuth(); const refresh = useRefresh(); const toast = useToast();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const change = useMutation({ mutationFn: (status: TaskStatus) => api.saveTask({ status }, task.id), onSuccess: async () => { toast('Task status updated.'); await refresh(); } });
  const remove = useMutation({ mutationFn: () => api.deleteTask(task.id), onSuccess: async () => { toast('Task deleted.'); await refresh(); } });
  const busy = change.isPending || remove.isPending;
  return <Card><View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}><Type variant="heading" style={{ flex: 1, minWidth: 120, textDecorationLine: task.status === 'COMPLETED' ? 'line-through' : 'none' }}>{task.name}</Type><Badge value={task.priority} /></View>{!!task.description && <Type muted numberOfLines={expanded ? undefined : 3}>{task.description}</Type>}{!!task.description && task.description.length > 160 && <Button label={expanded ? 'Show less' : 'Read more'} onPress={() => setExpanded(!expanded)} />}{projectName && <Button label={projectName} onPress={() => navigation.navigate('ProjectDetails', { id: task.projectId })} />}
    <Type variant="small" muted>Due: {formatDate(task.dueDate)}</Type>
    <Choice testID={'task-status-' + task.id} label="Status" disabled={busy} value={task.status} options={taskStatuses.map(value => ({ value, label: labels[value] }))} onChange={value => { if (value !== task.status) change.mutate(value as TaskStatus); }} />
    <Button testID={'complete-task-' + task.id} label={task.status === 'COMPLETED' ? 'Mark pending' : 'Mark completed'} disabled={busy} busy={change.isPending} variant={task.status === 'COMPLETED' ? 'plain' : 'primary'} onPress={() => change.mutate(task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED')} />
    <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}><Button label="Edit task" disabled={busy} style={{ flex: 1 }} onPress={() => navigation.navigate('TaskForm', { id: task.id })} /><Button label="Delete task" disabled={busy} busy={remove.isPending} style={{ flex: 1 }} onPress={() => Alert.alert('Delete task?', '“' + task.name + '” will be permanently deleted. This can’t be undone.', [{ text: 'Keep task', style: 'cancel' }, { text: 'Delete task', style: 'destructive', onPress: () => remove.mutate() }])} /></View>
    {(change.error || remove.error) && <ErrorText text={message(change.error || remove.error)} />}
  </Card>;
}
