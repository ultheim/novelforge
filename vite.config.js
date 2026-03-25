import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Change 'novelforge' to your actual GitHub repo name
  // If your repo is https://github.com/yourname/novelforge, keep it as-is
  // If your repo is https://github.com/yourname/my-writing-app, change to '/my-writing-app/'
  base: '/novelforge/',
})
