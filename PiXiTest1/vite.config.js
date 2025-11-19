import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      // @ maps to ./src
      '@': path.resolve(__dirname, 'src')
    }
  }
})
