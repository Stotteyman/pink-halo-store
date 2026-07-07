import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_BASE || 'http://127.0.0.1:8888';

  return {
    plugins: [react()],
    assetsInclude: ['**/*.glb', '**/*.gltf'],
    server: {
      port: 4173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/.netlify/functions'),
        },
      },
    }
  };
});
