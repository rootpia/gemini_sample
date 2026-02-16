import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',  // Listen on all network interfaces
        allowedHosts: ['localhost', 'mousegtune'],  // Allow access from these hostnames
        proxy: {
            '/api': {
                target: 'http://backend:8000',  // Internal Docker port
                changeOrigin: true
            }
        }
    }
})
