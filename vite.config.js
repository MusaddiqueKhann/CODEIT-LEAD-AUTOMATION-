import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // `@/components` is the one import path views use for UI (files run by `npm run check` stay relative).
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
