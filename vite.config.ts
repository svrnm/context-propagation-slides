import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // Slidev 53's code.css emits a nested rule lightningcss can't minify
    cssMinify: false,
  },
})
