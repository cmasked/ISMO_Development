import { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Choice, EmptyState, ErrorState, Field, Loading, Type } from '../components/ui';
import { useDebounced, useProjects, useTasks } from '../lib/queries';
import { message } from '../lib/api';
import { labels, priorities, taskStatuses, type RootStackParams } from '../types';
import { TaskCard } from './TaskCard';
export function TaskWorkspace({ projectId }: { projectId?: string }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const [search, setSearch] = useState(''); const [status, setStatus] = useState(''); const [priority, setPriority] = useState(''); const [project, setProject] = useState('');
  const query = useDebounced(search); const projects = useProjects();
  const tasks = useTasks({ search: query, status, priority, projectId: projectId || project });
  const filtered = !!(search || status || priority || project);
  const reset = () => { setSearch(''); setStatus(''); setPriority(''); setProject(''); };
  return <View style={{ gap: 18 }}><Type variant="heading">{projectId ? 'Tasks in this project' : 'Your tasks'}</Type><Button label="Create a task" variant="primary" onPress={() => navigation.navigate('TaskForm', { projectId })} />
    <Field testID="search-tasks" label="Search tasks" value={search} onChangeText={setSearch} placeholder="Search by task name" returnKeyType="search" />
    <Choice testID="filter-status" label="Filter status" value={status} onChange={setStatus} options={[{ value: '', label: 'All statuses' }, ...taskStatuses.map(value => ({ value, label: labels[value] }))]} />
    <Choice testID="filter-priority" label="Filter priority" value={priority} onChange={setPriority} options={[{ value: '', label: 'All priorities' }, ...priorities.map(value => ({ value, label: labels[value] }))]} />
    {!projectId && <Choice testID="filter-project" label="Filter project" value={project} onChange={setProject} options={[{ value: '', label: 'All projects' }, ...(projects.data || []).map(item => ({ value: item.id, label: item.name }))]} />}
    {filtered && <Button label="Clear filters" onPress={reset} />}
    {projects.isError && !projectId && <ErrorState text={message(projects.error)} retry={() => { void projects.refetch(); }} />}
    {tasks.isPending ? <Loading label="Loading your tasks…" /> : tasks.isError ? <ErrorState text={message(tasks.error)} retry={() => { void tasks.refetch(); }} /> : <><Type variant="small" muted>{tasks.data.length} {tasks.data.length === 1 ? 'task' : 'tasks'}</Type>{tasks.data.length ? tasks.data.map(task => <TaskCard key={task.id} task={task} projectName={!projectId ? projects.data?.find(item => item.id === task.projectId)?.name : undefined} />) : <EmptyState title={filtered ? 'No tasks found' : 'No tasks yet'} description={filtered ? 'Try another search or clear your filters.' : 'Add a task to give your project a clear next step.'} label={filtered ? 'Clear filters' : 'Create a task'} action={filtered ? reset : () => navigation.navigate('TaskForm', { projectId })} />}</>}
  </View>;
}
