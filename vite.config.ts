import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import removeConsole from 'vite-plugin-remove-console';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss(), removeConsole()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
