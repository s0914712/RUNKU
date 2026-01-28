import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',  // 使用相對路徑，適用於 GitHub Pages
  build: {
    outDir: 'dist',
  },
})
