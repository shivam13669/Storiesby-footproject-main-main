import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: mode === 'development' ? undefined : false,
  },
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ['sql.js'],
    esbuildOptions: {
      supported: {
        'top-level-await': true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'sql-js': ['sql.js'],
        }
      }
    }
  },
  worker: {
    format: 'es',
  },
}));
