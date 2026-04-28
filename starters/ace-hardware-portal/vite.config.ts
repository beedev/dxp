import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4500,
    // Allow cloudflared / ngrok / any *.trycloudflare.com host so external
    // agents (ChatGPT, MCP clients) can deep-link to /customer/pay?session=…
    // through the tunnel. `true` accepts any host — fine for dev.
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4201',
        changeOrigin: true,
      },
    },
  },
  publicDir: 'public',
});
