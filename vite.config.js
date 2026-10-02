import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ Plugin: _headers aur _redirects ko dist/ mein copy karo
function copyCloudflareFiles() {
  return {
    name: 'copy-cloudflare-files',
    closeBundle() {
      const files = ['_headers', '_redirects', 'robots.txt'];
      files.forEach(file => {
        const src = resolve(__dirname, 'public', file);
        const dest = resolve(__dirname, 'dist', file);
        if (existsSync(src)) {
          copyFileSync(src, dest);
          console.log(`✅ Copied: ${file}`);
        } else {
          console.warn(`⚠️  Missing: ${file}`);
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    copyCloudflareFiles()
  ],
  base: '/',
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    sourcemap: false,
    cssCodeSplit: true,          // ✅ Multiple CSS chunks
    assetsInlineLimit: 0,        // ✅ No inline — har file alag
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom']
        },
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    open: true
  }
})
