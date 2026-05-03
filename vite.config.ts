import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: '/debt-tracker/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '债务清零计划',
        short_name: '债务清零',
        description: '个人债务管理工具，轻松记录和追踪债务还款进度',
        start_url: '/debt-tracker/',
        display: 'standalone',
        background_color: '#f5faf8',
        theme_color: '#1a8a6e',
        lang: 'zh-CN',
        scope: '/debt-tracker/',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
