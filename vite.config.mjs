import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const reownMocks = path.resolve(__dirname, 'src/test/mocks')

export default defineConfig({
  resolve: {
    alias: {
      // Reown/AppKit needs @noble/hashes >=1.5 (./legacy export); hoist for the app bundle only.
      '@noble/hashes': path.resolve(__dirname, 'node_modules/@noble/hashes'),
    },
  },
  plugins: [
    react({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('appkit-'),
        },
      },
    }),
    svgr(),
  ],
  base: './',
  build: {
    outDir: 'build',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    exclude: ['node_modules', 'test'],
    alias: {
      '@reown/appkit/react': path.resolve(reownMocks, 'reown-appkit-react.js'),
      '@reown/appkit-adapter-ethers': path.resolve(reownMocks, 'reown-appkit-adapter-ethers.js'),
      '@reown/appkit/networks': path.resolve(reownMocks, 'reown-appkit-networks.js'),
    },
  },
})
