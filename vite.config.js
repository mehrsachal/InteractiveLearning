import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'

function fileModifiedTimePlugin() {
  return {
    name: 'file-modified-time',
    transform(code, id) {
      const cleanId = id.split('?')[0];
      // Only inject into visualization files
      if (cleanId.endsWith('.jsx') && cleanId.match(/visualizations[\\/]/)) {
        try {
          const stats = fs.statSync(cleanId);
          const lastModified = stats.mtime.getTime();
          return {
            code: `${code}\nexport const __lastModified = ${lastModified};`,
            map: null
          }
        } catch (e) {
          return null;
        }
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), fileModifiedTimePlugin()],
})
