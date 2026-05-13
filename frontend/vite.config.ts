import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const repoRoot = path.resolve(__dirname, '..')

  const env = loadEnv(mode, repoRoot, 'VITE_')
  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value
  }

  return {
    envDir: repoRoot,
    plugins: [react(), tailwindcss()],
  }
})
