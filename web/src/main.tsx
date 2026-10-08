import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App, AppBoundary } from './App';
import { ApiError } from './lib/api';
import { AuthProvider } from './auth/AuthProvider';
import { ToastProvider } from './components/Toasts';
import './styles.css';
const client = new QueryClient({ defaultOptions: { queries: {
  staleTime: 15000, refetchOnWindowFocus: true,
  retry: (count, error) => count < 1 && error instanceof ApiError && (error.status === 0 || error.status >= 500),
}, mutations: { retry: false } } });
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><AppBoundary><QueryClientProvider client={client}><BrowserRouter><AuthProvider><ToastProvider><App /></ToastProvider></AuthProvider></BrowserRouter></QueryClientProvider></AppBoundary></React.StrictMode>,
);
