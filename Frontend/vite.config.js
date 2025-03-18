import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: {
    modules: {
      scopeBehaviour: 'local', // Ensures CSS is scoped
    },
    devSourcemap: false, // Disable source maps to avoid unwanted CSS injection
  }
});