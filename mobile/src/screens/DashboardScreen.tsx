import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthProvider';
import { Button, Card, EmptyState, ErrorState, Heading, Loading, Screen, Type } from '../components/ui';
import { useTheme } from '../components/ThemeProvider';
import { useProjects, useRefresh, useTasks } from '../lib/queries';
import { message } from '../lib/api';
import type { RootStackParams } from '../types';
import { ProjectCard } from '../features/ProjectCard';
import { TaskCard } from '../features/TaskCard';
export function DashboardScreen() {
  const { api } = useAuth(); const { colors } = useTheme(); const refresh = useRefresh();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const data = useQuery({ queryKey: ['dashboard'], queryFn: ({ signal }) => api.dashboard(signal) });
  const projects = useProjects(); const tasks = useTasks();
  const metrics = [{ key: 'totalProjects', label: 'Total projects' }, { key: 'totalTasks', label: 'Total tasks' }, { key: 'completedTasks', label: 'Completed tasks' }, { key: 'pendingTasks', label: 'Pending tasks' }, { key: 'projectsInProgress', label: 'Projects in progress' }] as const;
  return <Screen refreshing={data.isRefetching || projects.isRefetching || tasks.isRefetching} onRefresh={() => { void refresh(); }}><Heading title="Dashboard" description="See where things stand, and choose your next step." /><Button label="Create a project" variant="primary" onPress={() => navigation.navigate('ProjectForm')} /><Button label="Create a task" onPress={() => navigation.navigate('TaskForm')} />
    {data.isPending ? <Loading /> : data.isError ? <ErrorState text={message(data.error)} retry={() => { void data.refetch(); }} /> : <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{metrics.map((item, index) => <Card key={item.key} style={{ flexGrow: 1, flexBasis: index === 4 ? '100%' : '45%', backgroundColor: index === 4 ? '#1a1a1a' : colors.panel, borderRadius: 0 }}><Type variant="label" style={{ color: index === 4 ? '#f5f0e8' : colors.muted }}>{item.label}</Type><Type testID={'metric-' + item.key} variant="title" style={{ color: index === 4 ? colors.yellow : colors.text }}>{data.data[item.key]}</Type></Card>)}</View>}
    <Type variant="heading">Recent projects</Type>{projects.isPending ? <Loading label="Loading projects…" /> : projects.isError ? <ErrorState text={message(projects.error)} retry={() => { void projects.refetch(); }} /> : projects.data.length ? projects.data.slice(0, 3).map(project => <ProjectCard key={project.id} project={project} />) : <EmptyState title="No projects yet" description="Start with a project, then break it into tasks." action={() => navigation.navigate('ProjectForm')} label="Create a project" />}
    <Type variant="heading">Recent tasks</Type>{tasks.isPending ? <Loading label="Loading tasks…" /> : tasks.isError ? <ErrorState text={message(tasks.error)} retry={() => { void tasks.refetch(); }} /> : tasks.data.length ? tasks.data.slice(0, 3).map(task => <TaskCard key={task.id} task={task} projectName={projects.data?.find(project => project.id === task.projectId)?.name} />) : <EmptyState title="No tasks yet" description="A clear next step makes progress easier." />}
  </Screen>;
}
