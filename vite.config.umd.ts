import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic', // Draft.js uses classic JSX runtime
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/Draft.ts'),
      name: 'Draft',
      formats: ['umd'],
      fileName: () => 'Draft.js',
    },
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: false,
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    minify: false,
    target: 'es2015',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    __DEV__: false,
  },
});