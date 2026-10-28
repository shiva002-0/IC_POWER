/**
 * Production Node.js Server for OLYMPUS Digital IC Power Lab
 * Zero-dependency pure Node.js HTTP server.
 * Serves the compiled frontend from `dist/` and hosts the secure Agentic AI API endpoints:
 *   - GET  /api/agent/status
 *   - POST /api/agent/run
 *
 * Keeps API keys (GEMINI_API_KEY, OPENAI_API_KEY) strictly on the server.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getLlmServerStatus,
  runLlmAgentLoop,
  runDeterministicAgentWorkflow,
} from './agentRunner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Standard MIME type map
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const server = http.createServer(async (req, res) => {
  // CORS & Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. API Route: Status
  if (pathname === '/api/agent/status' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(getLlmServerStatus()));
  }

  // 2. API Route: Run Agent
  if (pathname === '/api/agent/run' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { goal, baseline, constraints, mode } = payload;

        if (mode === 'deterministic') {
          const result = await runDeterministicAgentWorkflow({ goal, baseline, constraints });
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(result));
        }

        // Autonomous LLM mode
        const status = getLlmServerStatus();
        if (!status.isConfigured) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(
            JSON.stringify({
              success: false,
              code: 'MISSING_CREDENTIALS',
              message:
                'No LLM API key detected on the server. You can run the verified Deterministic Agent Workflow without an API key, or add GEMINI_API_KEY to your .env file.',
            })
          );
        }

        const result = await runLlmAgentLoop({ goal, baseline, constraints });
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(result));
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(
          JSON.stringify({
            success: false,
            code: err.code || 'AGENT_ERROR',
            error: err.message,
          })
        );
      }
    });
    return;
  }

  // 3. Static File Serving from dist/
  if (req.method === 'GET' || req.method === 'HEAD') {
    if (!fs.existsSync(DIST_DIR)) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.end('Application bundle not built. Please run "npm run build" first.');
    }

    let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);
    let stat = null;
    try {
      stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
        stat = fs.statSync(filePath);
      }
    } catch {
      // Fallback for SPA routing: serve index.html
      filePath = path.join(DIST_DIR, 'index.html');
      try {
        stat = fs.statSync(filePath);
      } catch {
        res.statusCode = 404;
        return res.end('File not found');
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    // Cache immutable assets
    if (pathname.startsWith('/assets/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      res.setHeader('Cache-Control', 'no-cache');
    }

    if (req.method === 'HEAD') {
      return res.end();
    }

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      res.statusCode = 500;
      res.end('Error reading file');
    });
    return stream.pipe(res);
  }

  res.statusCode = 405;
  res.end('Method Not Allowed');
});

// Auto-start if invoked directly as main script
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  server.listen(PORT, HOST, () => {
    console.log(`[OLYMPUS Production Server] Listening on http://${HOST}:${PORT}`);
    console.log(`[OLYMPUS Production Server] Serving static files from: ${DIST_DIR}`);
  });
}

export { server };
