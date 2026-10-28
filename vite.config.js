import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { getLlmServerStatus, runLlmAgentLoop, runDeterministicAgentWorkflow } from './server/agentRunner.js'

function createAgentApiMiddleware() {
  return async (req, res, next) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    if (url.pathname === '/api/agent/status' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json')
      return res.end(JSON.stringify(getLlmServerStatus()))
    }

    if (url.pathname === '/api/agent/run' && req.method === 'POST') {
      let body = ''
      req.on('data', (chunk) => { body += chunk })
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}')
          const { goal, baseline, constraints, mode } = payload

          if (mode === 'deterministic') {
            const result = await runDeterministicAgentWorkflow({ goal, baseline, constraints })
            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify(result))
          }

          // Autonomous LLM mode
          const status = getLlmServerStatus()
          if (!status.isConfigured) {
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify({
              success: false,
              code: 'MISSING_CREDENTIALS',
              message: 'No LLM API key detected on the server. You can run the verified Deterministic Agent Workflow without an API key, or add GEMINI_API_KEY to your .env file.',
            }))
          }

          const result = await runLlmAgentLoop({ goal, baseline, constraints })
          res.setHeader('Content-Type', 'application/json')
          return res.end(JSON.stringify(result))
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          return res.end(JSON.stringify({
            success: false,
            code: err.code || 'AGENT_ERROR',
            error: err.message,
          }))
        }
      })
      return
    }

    next()
  }
}

function agentApiPlugin() {
  const middleware = createAgentApiMiddleware()
  return {
    name: 'olympus-agent-api',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from .env if present into process.env
  const env = loadEnv(mode, process.cwd(), '')
  for (const [key, val] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = val
    }
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      agentApiPlugin(),
    ],
    server: {
      host: true,
      allowedHosts: true,
    },
    preview: {
      host: true,
      allowedHosts: true,
    },
  }
})


