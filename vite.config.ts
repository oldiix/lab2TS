import { defineConfig } from 'vite';

/**
 * Конфігурація Vite — альтернатива webpack.config.js у гілці vite-migration.
 *
 * Застосунок має працювати ідентично до webpack-версії:
 * той самий index.html із єдиним <div id="app">, той самий вхідний
 * файл src/index.ts, той самий порт dev-сервера 9000 і та сама
 * вихідна директорія dist.
 *
 * Помітно коротше за webpack-конфіг, бо Vite не потребує явних
 * loader-ів: TypeScript обробляє esbuild, а Sass підхоплюється
 * автоматично за наявності пакета `sass` у залежностях.
 */
export default defineConfig({
  // Порожній base робить шляхи відносними — потрібно для gh-pages,
  // де сайт лежить не в корені домену, а в /<repo-name>/.
  base: './',

  server: {
    port: 9000,
    open: false,
    strictPort: false,
  },

  preview: {
    port: 9000,
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2020',
    rollupOptions: {
      output: {
        entryFileNames: 'js/[name].[hash:8].js',
        chunkFileNames: 'js/[name].[hash:8].js',
        assetFileNames: (assetInfo): string => {
          const name = assetInfo.names?.[0] ?? '';
          if (name.endsWith('.css')) {
            return 'css/[name].[hash:8][extname]';
          }
          return 'assets/[name].[hash:8][extname]';
        },
        // Аналог splitChunks з webpack: залежності окремим чанком,
        // щоб оновлення власного коду не інвалідувало кеш вендорів.
        manualChunks: {
          vendors: ['bootstrap/js/dist/modal', 'bootstrap/js/dist/toast'],
        },
      },
    },
  },

  css: {
    preprocessorOptions: {
      scss: {
        // Сучасний Sass-компілятор замість legacy JS API (менше попереджень
        // і помітно швидша компіляція Bootstrap).
        api: 'modern-compiler',
        // Bootstrap 5.3 ще використовує @import та глобальні Sass-функції.
        quietDeps: true,
        silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
      },
    },
  },
});
