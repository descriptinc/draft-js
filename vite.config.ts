import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic', // Draft.js uses classic JSX runtime
    }),
    dts({
      outDir: 'lib/types',
      exclude: ['src/**/__tests__/**/*', 'src/**/__mocks__/**/*'],
      insertTypesEntry: true,
      copyDtsFiles: true,
      rollupTypes: false,
    }),
    visualizer({
      filename: './stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }) as any,
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/Draft.ts'),
      name: 'Draft',
      formats: ['es', 'cjs'],
      fileName: (format) => {
        const ext = format === 'es' ? 'js' : 'cjs';
        return `${format}/Draft.${ext}`;
      },
    },
    outDir: 'lib',
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
      ],
      output: [
        {
          format: 'es',
          dir: 'lib/esm',
          entryFileNames: '[name].js',
          chunkFileNames: '[name]-[hash].js',
          preserveModules: true,
          preserveModulesRoot: 'src',
          exports: 'named',
        },
        {
          format: 'cjs',
          dir: 'lib/cjs',
          entryFileNames: '[name].js',
          chunkFileNames: '[name]-[hash].js',
          preserveModules: true,
          preserveModulesRoot: 'src',
          exports: 'named',
        },
      ],
    },
    minify: false, // Don't minify library builds
    target: 'es2015',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    __DEV__: process.env.NODE_ENV !== 'production',
  },
});