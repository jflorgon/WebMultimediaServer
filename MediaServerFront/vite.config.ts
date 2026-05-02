import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig(({ mode }) => ({
  base: mode === 'tizen' ? './' : '/',
  plugins: [
    react(),
    tailwindcss(),
    ...(mode === 'tizen'
      ? [
          legacy({
            targets: ['chrome 56', 'safari 11'],
            modernPolyfills: true,
            additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
          }),
        ]
      : []),
  ],
  css: mode === 'tizen' ? {
    transformer: 'lightningcss',
    lightningcss: {
      targets: { chrome: 56 << 16 },
    },
  } : undefined,
  build: mode === 'tizen' ? {
    target: ['chrome56'],
    cssTarget: 'chrome56',
    cssMinify: 'lightningcss',
    modulePreload: false,
  } : undefined,
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
}))
