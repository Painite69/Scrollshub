import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Absolute base works with Electron's app:// protocol (and the web host).
  base: '/',
  plugins: [react(), tailwindcss()],
})
