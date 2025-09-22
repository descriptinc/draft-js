import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

// Custom plugin to concatenate and process CSS files
const draftCssPlugin = () => {
  return {
    name: 'draft-css-plugin',
    generateBundle(options, bundle) {
      // Read all CSS files
      const cssFiles = [
        'src/component/base/DraftEditor.css',
        'src/component/base/DraftEditorPlaceholder.css',
        'src/component/utils/DraftStyleDefault.css',
      ];

      let combinedCss = '';

      cssFiles.forEach(file => {
        const content = fs.readFileSync(path.resolve(__dirname, file), 'utf-8');

        // Process CSS similar to the original gulp task
        let processed = content
          // Replace class name separators
          .replace(
            /\/\*.*?\*\/|'(?:\\.|[^'])*'|"(?:\\.|[^"])*"|url\([^)]*\)|(\.(?:public\/)?[\w-]*\/{1,2}[\w-]+)/g,
            (match, cls) => {
              if (cls) {
                return cls.replace(/\//g, '-');
              }
              return match;
            }
          )
          // Replace CSS variables
          .replace(
            /\bvar\(([\w-]+)\)/g,
            (match, name) => {
              const vars = {
                'fig-secondary-text': '#9197a3',
                'fig-light-20': '#bdc1c9',
              };
              if (vars[name]) {
                return vars[name];
              }
              throw new Error(`Unknown CSS variable ${name}`);
            }
          );

        combinedCss += processed + '\n';
      });

      // Add copyright header
      const packageData = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')
      );

      const header = `/**
 * Draft v${packageData.version}
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
`;

      combinedCss = header + combinedCss;

      // Emit the CSS file
      this.emitFile({
        type: 'asset',
        fileName: 'Draft.css',
        source: combinedCss,
      });
    },
  };
};

export default defineConfig({
  plugins: [draftCssPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'src/Draft.ts'), // Dummy entry, CSS is handled by plugin
      formats: ['es'],
      fileName: () => 'dummy.js',
    },
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        assetFileNames: '[name].[ext]',
      },
    },
  },
});