import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Choice, EmptyState, ErrorState, Field, Heading, Loading, Screen, Type } from '../components/ui';
import { useDebounced, useProjects } from '../lib/queries';
import { message } from '../lib/api';
import { labels, projectStatuses, type RootStackParams } from '../types';
import { ProjectCard } from '../features/ProjectCard';
export function ProjectsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const [search, setSearch] = useState(''); const [status, setStatus] = useState('');
  const query = useDebounced(search); const projects = useProjects({ search: query, status });
  const filtered = !!(search || status); const reset = () => { setSearch(''); setStatus(''); };
  return <Screen refreshing={projects.isRefetching} onRefresh={() => { void projects.refetch(); }}><Heading title="Projects" description="Give your work a home. Keep the next step in sight." /><Button label="Create a project" variant="primary" onPress={() => navigation.navigate('ProjectForm')} />
    <Field testID="search-projects" label="Search projects" value={search} onChangeText={setSearch} placeholder="Search by project name" returnKeyType="search" />
    <Choice testID="project-filter-status" label="Filter status" value={status} onChange={setStatus} options={[{ value: '', label: 'All statuses' }, ...projectStatuses.map(value => ({ value, label: labels[value] }))]} />
    {filtered && <Button label="Clear filters" onPress={reset} />}
    {projects.isPending ? <Loading label="Loading your projects…" /> : projects.isError ? <ErrorState text={message(projects.error)} retry={() => { void projects.refetch(); }} /> : <><Type variant="small" muted>{projects.data.length} {projects.data.length === 1 ? 'project' : 'projects'}</Type>{projects.data.length ? projects.data.map(project => <ProjectCard project={project} key={project.id} />) : <EmptyState title={filtered ? 'No projects found' : 'No projects yet'} description={filtered ? 'Try another search or clear your filters.' : 'Create a project to organize your tasks in one place.'} action={filtered ? reset : () => navigation.navigate('ProjectForm')} label={filtered ? 'Clear filters' : 'Create a project'} />}</>}
  </Screen>;
}
