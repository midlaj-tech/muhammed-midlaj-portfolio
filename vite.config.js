import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const excludeAdmin = env.VITE_EXCLUDE_ADMIN === 'true';

  const input = {
    main: resolve(__dirname, 'index.html')
  };

  if (!excludeAdmin) {
    input.admin = resolve(__dirname, 'admin.html');
  }

  return {
    server: {
      cors: false,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    },
    plugins: [
      {
        name: 'api-sync-dev-middleware',
        configureServer(server) {
          server.middlewares.use('/api/sync', async (req, res) => {
            try {
              const syncModule = await import('./api/sync.js');
              const syncHandler = syncModule.default;
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try { req.body = body ? JSON.parse(body) : {}; } catch(e) { req.body = {}; }
                const mockRes = {
                  setHeader: (k, v) => res.setHeader(k, v),
                  status: (code) => {
                    res.statusCode = code;
                    return {
                      json: (obj) => {
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(obj));
                      },
                      end: () => res.end()
                    };
                  }
                };
                await syncHandler(req, mockRes);
              });
            } catch(e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
        }
      }
    ],
    build: {
      rollupOptions: {
        input
      }
    }
  };
});
