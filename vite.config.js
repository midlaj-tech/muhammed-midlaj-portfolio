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
    build: {
      rollupOptions: {
        input
      }
    }
  };
});
