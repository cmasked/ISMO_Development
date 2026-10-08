import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: { port: 3000, strictPort: true, proxy: {
      '/api': { target: env.WEB_PROXY_TARGET || 'http://127.0.0.1:3001', changeOrigin: true },
    } },
    preview: { port: 3000, strictPort: true, proxy: {
      '/api': { target: env.WEB_PROXY_TARGET || 'http://127.0.0.1:3001', changeOrigin: true },
    } },
  };
});
