import { PageHeading } from '../components/ui';
import { TaskWorkspace } from '../features/TaskWorkspace';
export function TasksPage() {
  return <><PageHeading title="Tasks" description="Small steps. Steady progress. See your work across all projects." /><TaskWorkspace /></>;
}
