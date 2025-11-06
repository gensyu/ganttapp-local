import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Tauri専用設定
export default defineConfig({
  plugins: [react()],

  // Tauri用: 相対パスでアセット解決
  base: './',

  // 公式ガイド推奨: ログを隠さない/ポート固定
  clearScreen: false,
  server: {
    strictPort: true,
    port: 5173,
  },

  // VITE_ と TAURI_ をフロントへ渡す
  envPrefix: ['VITE_', 'TAURI_'],

  build: {
    // Tauri用: es2022ターゲット
    target: 'es2022',
    // デバッグ時はminifyとsourcemapを調整
    minify: process.env.TAURI_DEBUG ? false : 'esbuild',
    sourcemap: !!process.env.TAURI_DEBUG,
  },
})