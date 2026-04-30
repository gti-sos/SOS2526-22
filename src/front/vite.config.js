// Asegúrate de tener estas dos líneas al principio del archivo:
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [sveltekit()],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            },
            '/cheaters-stats-proxy': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    }
});