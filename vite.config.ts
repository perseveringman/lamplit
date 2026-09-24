import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { target: 'es2022', sourcemap: true, chunkSizeWarningLimit: 1800,
    rollupOptions: { output: { manualChunks(id) { if (id.includes('@antv') || id.includes('d3-')) return 'atlas-engine'; if (id.includes('react-dom') || id.includes('/react/')) return 'react-vendor'; } } }
  }
});
