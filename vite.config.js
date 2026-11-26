import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: false,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  plugins: [
    {
      name: 'screenshot-saver',
      configureServer(server) {
        server.middlewares.use('/api/save-screenshot', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              try {
                const { filename, imageBase64 } = JSON.parse(body);
                const dir = path.resolve('screenshots');
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                const filePath = path.join(dir, filename);
                const data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
                fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
                console.log(`📸 Screenshot saved: ${filename}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, file: filePath }));
              } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
              }
            });
          } else {
            res.writeHead(405);
            res.end();
          }
        });
      }
    }
  ]
});
