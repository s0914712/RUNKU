import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/RUNKU/',  // 修改為你的 GitHub repo 名稱
  build: {
    outDir: 'dist',
  },
})
