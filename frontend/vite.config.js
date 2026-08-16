import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 部署在 https://s0914712.github.io/RUNKU/ 底下。
  // 必須用絕對路徑，深層網址（例如 /RUNKU/games）才不會把資源解析錯位置。
  base: '/RUNKU/',
  build: {
    outDir: 'dist',
  },
})
