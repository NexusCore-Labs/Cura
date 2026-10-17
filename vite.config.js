import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import readPrescriptionHandler from './api/read-prescription.js';
import explainMedicineHandler from './api/explain-medicine.js';
import { getServerConfig } from './api/_gemini.js';

function vercelApiDevPlugin() {
  return {
    name: 'vercel-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.end();
          return;
        }

        const cfg = getServerConfig();
        if (cfg.apiKey && !process.env.GEMINI_API_KEY) {
          process.env.GEMINI_API_KEY = cfg.apiKey;
        }

        const chunks = [];
        req.on('data', (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        req.on('end', async () => {
          const rawBody = Buffer.concat(chunks).toString('utf8');
          try {
            req.body = rawBody ? JSON.parse(rawBody) : {};
          } catch (_) {
            req.body = {};
          }

          const resAdapter = {
            statusCode: 200,
            status(code) {
              this.statusCode = code;
              return this;
            },
            json(payload) {
              res.statusCode = this.statusCode;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(payload));
            }
          };

          try {
            if (req.url.startsWith('/api/read-prescription')) {
              await readPrescriptionHandler(req, resAdapter);
            } else if (req.url.startsWith('/api/explain-medicine')) {
              await explainMedicineHandler(req, resAdapter);
            } else {
              next();
            }
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'Internal server error' }));
          }
        });
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), vercelApiDevPlugin()],
    server: {
      host: true,
      port: 5173
    }
  };
});
