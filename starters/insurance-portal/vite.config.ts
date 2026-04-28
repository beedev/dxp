import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Redirects bookmarks to the old embedded dev-tool URLs out to their
// standalone dev servers. Each tool runs on its own port now — no more
// rebuild-and-copy dance.
//
//   :4200/playground/  → :4600  (apps/playground)
//   :4200/storybook/   → :4700  (packages/ui storybook — change -p in package.json if different)
//   :4200/docs/        → :4800  (run a static server against /docs/, e.g. npx serve docs -p 4800)
const REDIRECTS: Record<string, string> = {
  '/playground': 'http://localhost:4600/',
  '/storybook': 'http://localhost:4700/',
  '/docs': 'http://localhost:4800/',
};

function redirectDevToolPaths(): Plugin {
  return {
    name: 'redirect-dev-tool-paths',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0];
        for (const [prefix, target] of Object.entries(REDIRECTS)) {
          if (url === prefix || url.startsWith(`${prefix}/`)) {
            const tail = url.slice(prefix.length).replace(/^\//, '');
            res.statusCode = 302;
            res.setHeader('Location', `${target}${tail}`);
            res.setHeader('Cache-Control', 'no-store');
            return res.end(`Moved → ${target}${tail}`);
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [redirectDevToolPaths(), react()],
  server: {
    port: 4200,
    // Fail fast when 4200 is taken instead of silently auto-incrementing
    // onto a sibling port (which previously squatted on the BFF's :4201
    // and broke cloudflared / external API access).
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4201',
        changeOrigin: true,
      },
    },
  },
  publicDir: 'public',
});
