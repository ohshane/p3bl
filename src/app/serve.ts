/**
 * Production server entry point.
 *
 * Creates a single HTTP server that handles:
 *   1. WebSocket upgrades on /ws/chat and /ws/yjs/<room>
 *   2. Static file serving from dist/client/
 *   3. TanStack Start SSR for all other requests
 *
 * Usage:
 *   npm run build
 *   npm run serve
 *
 * Environment variables:
 *   PORT  - HTTP port (default: 3000)
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import { readFileSync, existsSync, statSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'
import { handleUpgrade, closeWebSocketServers } from './src/server/ws.js'

const PORT = Number(process.env.PORT) || 3000
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const CLIENT_DIR = join(__dirname, 'dist', 'client')

// ─── MIME types for static files ──────────────────────────────────────
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain',
  '.map': 'application/json',
}

// ─── Static file serving ─────────────────────────────────────────────
function tryServeStatic(req: IncomingMessage, res: ServerResponse): boolean {
  const url = new URL(req.url || '/', `http://localhost`)
  const pathname = url.pathname

  // Only serve GET/HEAD for static files
  if (req.method !== 'GET' && req.method !== 'HEAD') return false

  // Build the file path from the URL
  const filePath = join(CLIENT_DIR, pathname)

  // Security: prevent directory traversal
  if (!filePath.startsWith(CLIENT_DIR)) return false

  // Check if file exists and is a regular file
  if (!existsSync(filePath)) return false
  const stat = statSync(filePath)
  if (!stat.isFile()) return false

  const ext = extname(filePath).toLowerCase()
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream'

  // Cache assets (hashed filenames) aggressively, others briefly
  const isHashed = pathname.startsWith('/assets/')
  const cacheControl = isHashed
    ? 'public, max-age=31536000, immutable'
    : 'public, max-age=3600'

  res.writeHead(200, {
    'Content-Type': mimeType,
    'Content-Length': stat.size,
    'Cache-Control': cacheControl,
  })

  if (req.method === 'HEAD') {
    res.end()
  } else {
    res.end(readFileSync(filePath))
  }
  return true
}

// ─── TanStack Start SSR handler ──────────────────────────────────────
async function loadSSRHandler() {
  // @ts-expect-error dist/server/server.js has no type declarations
  const serverModule = await import('./dist/server/server.js')
  const app = serverModule.default
  return app.fetch as (request: Request) => Promise<Response>
}

// ─── Main ─────────────────────────────────────────────────────────────
async function main() {
  const ssrFetch = await loadSSRHandler()

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // 1. Try serving static files from dist/client/
    if (tryServeStatic(req, res)) return

    // 2. Forward to TanStack Start SSR handler
    try {
      // Convert Node IncomingMessage to Web Request
      const protocol = req.headers['x-forwarded-proto'] || 'http'
      const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`
      const url = `${protocol}://${host}${req.url || '/'}`

      const headers = new Headers()
      for (const [key, value] of Object.entries(req.headers)) {
        if (value) {
          if (Array.isArray(value)) {
            for (const v of value) headers.append(key, v)
          } else {
            headers.set(key, value)
          }
        }
      }

      const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
      const bodyBuffer = hasBody ? await readBody(req) : null

      const init: RequestInit = {
        method: req.method || 'GET',
        headers,
      }
      if (bodyBuffer) {
        // Convert Node Buffer to Uint8Array for Web Request compatibility
        init.body = new Uint8Array(bodyBuffer)
      }

      const webRequest = new Request(url, init)

      const webResponse = await ssrFetch(webRequest)

      // Convert Web Response back to Node ServerResponse
      res.writeHead(webResponse.status, Object.fromEntries(webResponse.headers.entries()))
      if (webResponse.body) {
        const reader = webResponse.body.getReader()
        const pump = async () => {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            res.write(value)
          }
          res.end()
        }
        await pump()
      } else {
        res.end()
      }
    } catch (err) {
      console.error('SSR handler error:', err)
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' })
        res.end('Internal Server Error')
      }
    }
  })

  // 3. Wire up WebSocket upgrade handling
  server.on('upgrade', handleUpgrade)

  server.listen(PORT, () => {
    console.log(`Production server running on http://localhost:${PORT}`)
    console.log(`  WebSocket (chat): ws://localhost:${PORT}/ws/chat`)
    console.log(`  WebSocket (yjs):  ws://localhost:${PORT}/ws/yjs/<room>`)
  })

  // Graceful shutdown
  const shutdown = () => {
    console.log('\nShutting down...')
    closeWebSocketServers()
    server.close(() => {
      process.exit(0)
    })
    // Force exit after 5s
    setTimeout(() => process.exit(1), 5000)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
