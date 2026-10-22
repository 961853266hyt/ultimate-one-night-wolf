import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import pkg from './package.json'

/** 这次打包（本地开发是这次启动）的编号，每次都不一样。版本号没改的部署也认得出是新的。 */
const BUILD_ID = Date.now().toString(36)

/**
 * version.json：服务器上现在是哪个版本、哪次打包。页面里也记着自己是哪次打包的，
 * 设置页「检查更新」绕过缓存拉这个文件，两边一对就知道是不是最新。本地开发时由 vite 直接给。
 */
function versionFile(): Plugin {
  const source = JSON.stringify({ version: pkg.version, build: BUILD_ID })
  return {
    name: 'version-file',
    configureServer(server) {
      server.middlewares.use('/version.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        res.end(source)
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), versionFile()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version), // 首页显示的版本号
    __BUILD_ID__: JSON.stringify(BUILD_ID),
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
