import { Screen, Heading } from '../components/ui';
import { useRefresh } from '../lib/queries';
import { useIsFetching } from '@tanstack/react-query';
import { TaskWorkspace } from '../features/TaskWorkspace';
export function TasksScreen() { const refresh = useRefresh(); const fetching = useIsFetching({ queryKey: ['tasks'] }); return <Screen refreshing={fetching > 0} onRefresh={() => { void refresh(); }}><Heading title="Tasks" description="Small steps. Steady progress. See your work across all projects." /><TaskWorkspace /></Screen>; }
