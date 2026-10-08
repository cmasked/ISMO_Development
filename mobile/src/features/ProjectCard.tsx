import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Project, RootStackParams } from '../types';
import { Badge, Button, Card, Type } from '../components/ui';
import { formatDate } from '../lib/validation';
export function ProjectCard({ project }: { project: Project }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParams>>();
  return <Card><Badge value={project.status} /><Type variant="heading">{project.name}</Type><Type muted>{project.description || 'No description added.'}</Type><View style={{ gap: 5 }}><Type variant="small" muted>Start: {formatDate(project.startDate)}</Type><Type variant="small" muted>End: {formatDate(project.endDate)}</Type></View><Button testID={'open-project-' + project.id} label="Open project" onPress={() => navigation.navigate('ProjectDetails', { id: project.id })} /></Card>;
}
