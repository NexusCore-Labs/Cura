import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import readPrescriptionHandler from './api/read-prescription.js';
import explainMedicineHandler from './api/explain-medicine.js';

function vercelApiDevPlugin() {
  return {
    name: 'vercel-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();

        let rawBody = '';
        req.on('data', chunk => {
          rawBody += chunk;
        });
        req.on('end', async () => {
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

          if (req.url.startsWith('/api/read-prescription')) {
            await readPrescriptionHandler(req, resAdapter);
          } else if (req.url.startsWith('/api/explain-medicine')) {
            await explainMedicineHandler(req, resAdapter);
          } else {
            next();
          }
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), vercelApiDevPlugin()],
  server: {
    host: true,
    port: 5173
  }
});
