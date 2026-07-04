import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@overlay": fileURLToPath(new URL("../overlay", import.meta.url)) }
  },
  server: {
    fs: { allow: [".."] },
    proxy: {
      '/api': 'http://localhost:3000',
      '/auth': 'http://localhost:3000',
      '/admin': 'http://localhost:3000',
      '/events': 'http://localhost:3000',
      '/overlay': 'http://localhost:3000',
    },
  },
});
