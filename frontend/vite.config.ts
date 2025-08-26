import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    open: true,
    port: 3000
  },
  build: {
    // Output the production build inside the frontend directory so that the
    // Express server can serve from `frontend/dist`. Previously the build
    // generated files one level up ("../dist"), but the server now expects
    // them in this local directory.
    outDir: 'dist',
    emptyOutDir: true
  }
});
