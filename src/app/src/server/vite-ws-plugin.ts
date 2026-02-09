import type { Plugin } from 'vite'

export function webSocketPlugin(): Plugin {
  return {
    name: 'vite-ws-plugin',
    configureServer(server) {
      // Dynamically import to avoid bundling ws in client code
      // In Vite dev, prefer TS source import. Keep JS fallback for robustness.
      const loadWsModule = async () => {
        try {
          return await import('./ws.ts')
        } catch {
          return await import('./ws.js')
        }
      }

      loadWsModule().then(({ handleUpgrade }) => {
        // Attach our WebSocket upgrade handler to the Vite dev server's
        // underlying HTTP server. This routes /ws/chat and /ws/yjs/<room>
        // to the correct WebSocket server, sharing the same port as the
        // Vite dev server (default 3000).
        if (server.httpServer) {
          server.httpServer.on('upgrade', handleUpgrade)
          console.log('[vite-ws-plugin] WebSocket upgrade handler attached')
          console.log('  Chat:  /ws/chat')
          console.log('  Yjs:   /ws/yjs/<room>')
        } else {
          console.warn('[vite-ws-plugin] No httpServer available, WebSocket servers not started')
        }
      }).catch((err) => {
        console.error('[vite-ws-plugin] Failed to start WebSocket servers:', err)
      })
    },
  }
}
