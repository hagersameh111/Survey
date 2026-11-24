import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { existsSync } from 'node:fs'

const workingDirectory = process.cwd()
const frontendRoot = existsSync(path.join(workingDirectory, 'src', 'main.jsx'))
  ? workingDirectory
  : path.join(workingDirectory, 'frontend')

export default defineConfig({
  root: frontendRoot,
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:2000',
        changeOrigin: true,
      },
      '/s/': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:2000',
        changeOrigin: true,
      },
    },
  },
})
