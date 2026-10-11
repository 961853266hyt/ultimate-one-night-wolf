import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import pkg from './package.json'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version), // 首页显示的版本号
  },
  resolve: {
    tsconfigPaths: true, // `@/` 指向 src/，别名只在 tsconfig.json 里配一处
  },
  server: {
    host: true, // 同一个局域网里的手机也能打开
    proxy: {
      '/api': 'http://localhost:8000',
      '/ws': { target: 'ws://localhost:8000', ws: true },
    },
  },
})
