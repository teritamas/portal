import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: 'dist/widget',
    lib: {
      entry: 'widget/main.ts',
      formats: ['es'],
      fileName: () => 'widget.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'widget.[ext]',
        inlineDynamicImports: true,
      },
    },
  },
});
