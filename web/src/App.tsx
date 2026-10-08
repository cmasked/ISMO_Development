import { Component, type ReactNode } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/AuthProvider';
import { Shell } from './components/Shell';
import { EmptyState } from './components/ui';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';
import { TasksPage } from './pages/TasksPage';
export class AppBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="session-screen"><EmptyState title="We hit a snag" description="Reload the page to get back to your workspace." action={() => window.location.reload()} actionLabel="Reload page" /></div> : this.props.children;
  }
}
export function App() {
  return <Routes>
    <Route path="/login" element={<AuthPage />} />
    <Route path="/register" element={<AuthPage register />} />
    <Route element={<ProtectedRoute />}><Route element={<Shell />}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/:id" element={<ProjectDetailsPage />} />
      <Route path="/tasks" element={<TasksPage />} />
      <Route path="*" element={<><EmptyState title="This page doesn’t exist" description="Let’s get you back to your work." /><Link className="button" to="/dashboard">Back to dashboard</Link></>} />
    </Route></Route>
  </Routes>;
}
