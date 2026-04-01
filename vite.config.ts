import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

function autoInstall() {
  return {
    name: 'auto-install',
    resolveId(id: string) {
      if (id.startsWith('.') || id.startsWith('/')) return null
      const pkg = id.startsWith('@') ? id.split('/').slice(0, 2).join('/') : id.split('/')[0]
      try {
        require.resolve(pkg)
      } catch {
        console.log(`[auto-install] Installing ${pkg}...`)
        execSync(`npm install ${pkg}`, { stdio: 'inherit' })
      }
      return null
    },
  }
}

export default defineConfig({
  plugins: [autoInstall(), react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
