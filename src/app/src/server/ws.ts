import { WebSocketServer, WebSocket } from 'ws'
import type { IncomingMessage } from 'http'
import type { Duplex } from 'stream'
import * as Y from 'yjs'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'

// ─── Path constants for WebSocket routing ─────────────────────────────
export const WS_CHAT_PATH = '/ws/chat'
export const WS_YJS_PATH = '/ws/yjs/' // e.g. /ws/yjs/<roomName>

// ─── Chat WebSocket Server ───────────────────────────────────────────

// Room -> Set of connected clients
const rooms = new Map<string, Set<WebSocket>>()

// Client -> Set of rooms they're in
const clientRooms = new Map<WebSocket, Set<string>>()

export interface WSMessage {
  type: 'join' | 'leave' | 'chat_message'
  roomId?: string
  payload?: unknown
}

function handleMessage(ws: WebSocket, raw: string) {
  let msg: WSMessage
  try {
    msg = JSON.parse(raw)
  } catch {
    return
  }

  if (msg.type === 'join' && msg.roomId) {
    // Add client to room
    if (!rooms.has(msg.roomId)) {
      rooms.set(msg.roomId, new Set())
    }
    rooms.get(msg.roomId)!.add(ws)

    if (!clientRooms.has(ws)) {
      clientRooms.set(ws, new Set())
    }
    clientRooms.get(ws)!.add(msg.roomId)
    return
  }

  if (msg.type === 'leave' && msg.roomId) {
    rooms.get(msg.roomId)?.delete(ws)
    clientRooms.get(ws)?.delete(msg.roomId)
    return
  }

  if (msg.type === 'chat_message' && msg.roomId && msg.payload) {
    // Broadcast to all other clients in the same room
    const roomClients = rooms.get(msg.roomId)
    if (!roomClients) return

    const broadcast = JSON.stringify({
      type: 'chat_message',
      roomId: msg.roomId,
      payload: msg.payload,
    })

    for (const client of roomClients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(broadcast)
      }
    }
  }
}

function handleClose(ws: WebSocket) {
  const joined = clientRooms.get(ws)
  if (joined) {
    for (const roomId of joined) {
      rooms.get(roomId)?.delete(ws)
      // Clean up empty rooms
      if (rooms.get(roomId)?.size === 0) {
        rooms.delete(roomId)
      }
    }
  }
  clientRooms.delete(ws)
}

function handleChatConnection(ws: WebSocket) {
  ws.on('message', (data) => {
    handleMessage(ws, data.toString())
  })

  ws.on('close', () => {
    handleClose(ws)
  })

  ws.on('error', () => {
    handleClose(ws)
  })
}

// ─── Yjs Collaboration WebSocket Server ──────────────────────────────

const messageYjsSync = 0
const messageYjsAwareness = 1
const messageYjsQueryAwareness = 3

// Shared Yjs documents keyed by room name (e.g. "team_{teamId}_session_{sessionId}")
const yjsDocs = new Map<string, Y.Doc>()
const yjsAwareness = new Map<string, awarenessProtocol.Awareness>()
// Room -> connected clients
const yjsRooms = new Map<string, Set<WebSocket>>()
// WebSocket -> Set of Yjs clientIDs that have set awareness state via this connection
const wsClientIds = new Map<WebSocket, Set<number>>()

function broadcastToRoom(roomName: string, msg: Uint8Array, exclude?: WebSocket) {
  const clients = yjsRooms.get(roomName)
  if (!clients) return
  for (const client of clients) {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(msg)
    }
  }
}

function getOrCreateYDoc(docName: string): { doc: Y.Doc; awareness: awarenessProtocol.Awareness } {
  let doc = yjsDocs.get(docName)
  let awareness = yjsAwareness.get(docName)
  if (!doc) {
    doc = new Y.Doc()
    yjsDocs.set(docName, doc)
    awareness = new awarenessProtocol.Awareness(doc)
    yjsAwareness.set(docName, awareness)

    // Broadcast awareness changes to all clients in the room (excluding sender)
    awareness.on('update', (
      { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
      origin: unknown
    ) => {
      const changedClients = added.concat(updated, removed)
      const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(awareness!, changedClients)
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, messageYjsAwareness)
      encoding.writeVarUint8Array(encoder, awarenessUpdate)
      // origin is the WebSocket that sent the update — skip it to avoid echo
      const excludeWs = origin instanceof WebSocket ? origin : undefined
      broadcastToRoom(docName, encoding.toUint8Array(encoder), excludeWs)
    })

    // Broadcast document updates to all clients in the room (except origin)
    doc.on('update', (update: Uint8Array, origin: unknown) => {
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, messageYjsSync)
      syncProtocol.writeUpdate(encoder, update)
      const msg = encoding.toUint8Array(encoder)
      // origin is the WebSocket that sent the update — skip it to avoid echo
      const originWs = origin instanceof WebSocket ? origin : undefined
      broadcastToRoom(docName, msg, originWs)
    })
  }
  return { doc, awareness: awareness! }
}

function handleYjsConnection(ws: WebSocket, req: IncomingMessage) {
  // Room name comes from the URL path after /ws/yjs/
  const url = req.url || ''
  // Strip the /ws/yjs/ prefix to get the room name
  const roomName = url.replace(/^\/ws\/yjs\//, '').replace(/^\//, '') || 'default'

  const { doc, awareness } = getOrCreateYDoc(roomName)

  if (!yjsRooms.has(roomName)) {
    yjsRooms.set(roomName, new Set())
  }
  yjsRooms.get(roomName)!.add(ws)

  // Send initial sync step 1 to the new client
  const syncEncoder = encoding.createEncoder()
  encoding.writeVarUint(syncEncoder, messageYjsSync)
  syncProtocol.writeSyncStep1(syncEncoder, doc)
  ws.send(encoding.toUint8Array(syncEncoder))

  // Send current awareness state to the new client
  const awarenessStates = awareness.getStates()
  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder()
    encoding.writeVarUint(awarenessEncoder, messageYjsAwareness)
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(awareness, Array.from(awarenessStates.keys()))
    )
    ws.send(encoding.toUint8Array(awarenessEncoder))
  }

  ws.on('message', (data: ArrayBuffer | Buffer) => {
    const message = new Uint8Array(data as ArrayBuffer)
    const decoder = decoding.createDecoder(message)
    const messageType = decoding.readVarUint(decoder)

    if (messageType === messageYjsSync) {
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, messageYjsSync)
      // Pass `ws` as origin so doc.on('update') can skip the sender
      syncProtocol.readSyncMessage(decoder, encoder, doc, ws)

      // Send sync response (e.g. sync step 2) only to THIS client
      const response = encoding.toUint8Array(encoder)
      if (response.byteLength > 1) {
        ws.send(response)
      }
      // Doc updates are broadcast via doc.on('update') — no manual broadcast here
    } else if (messageType === messageYjsAwareness) {
      const update = decoding.readVarUint8Array(decoder)
      // Track which Yjs clientIDs this WebSocket owns for cleanup on disconnect
      const updateDecoder = decoding.createDecoder(update)
      const updateLen = decoding.readVarUint(updateDecoder)
      if (!wsClientIds.has(ws)) {
        wsClientIds.set(ws, new Set())
      }
      const clientIdSet = wsClientIds.get(ws)!
      for (let i = 0; i < updateLen; i++) {
        const clientId = decoding.readVarUint(updateDecoder)
        clientIdSet.add(clientId)
        // Skip clock and state fields
        decoding.readVarUint(updateDecoder)
        decoding.readVarString(updateDecoder)
      }
      awarenessProtocol.applyAwarenessUpdate(awareness, update, ws)
      // Awareness broadcast is handled by awareness.on('update')
    } else if (messageType === messageYjsQueryAwareness) {
      // Client is requesting full awareness state
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, messageYjsAwareness)
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(awareness, Array.from(awareness.getStates().keys()))
      )
      ws.send(encoding.toUint8Array(encoder))
    }
  })

  const handleYjsClose = () => {
    const clients = yjsRooms.get(roomName)
    if (clients) {
      clients.delete(ws)
      if (clients.size === 0) {
        yjsRooms.delete(roomName)
        // Keep doc in memory for reconnections; could add TTL cleanup later
      }
    }
    // Remove awareness states for all Yjs clientIDs owned by this WebSocket
    const clientIds = wsClientIds.get(ws)
    if (clientIds && clientIds.size > 0) {
      awarenessProtocol.removeAwarenessStates(awareness, Array.from(clientIds), null)
    }
    wsClientIds.delete(ws)
  }

  ws.on('close', handleYjsClose)
  ws.on('error', handleYjsClose)
}

// ─── Shared WebSocket infrastructure ─────────────────────────────────

// Both servers use noServer mode -- they don't listen on their own ports.
// An external HTTP server handles the `upgrade` event and routes to the
// correct WSS based on the request path.
const chatWss = new WebSocketServer({ noServer: true })
const yjsWss = new WebSocketServer({ noServer: true })

chatWss.on('connection', (ws: WebSocket) => {
  handleChatConnection(ws)
})

yjsWss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  handleYjsConnection(ws, req)
})

/**
 * Handle an HTTP `upgrade` request by routing to the correct WebSocket server
 * based on the URL path:
 *   - /ws/chat       -> Chat WebSocket
 *   - /ws/yjs/<room> -> Yjs collaboration WebSocket
 *
 * Attach this to an HTTP server's 'upgrade' event:
 *   httpServer.on('upgrade', handleUpgrade)
 */
export function handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer) {
  const pathname = req.url || ''

  if (pathname === WS_CHAT_PATH) {
    chatWss.handleUpgrade(req, socket, head, (ws) => {
      chatWss.emit('connection', ws, req)
    })
  } else if (pathname.startsWith(WS_YJS_PATH)) {
    yjsWss.handleUpgrade(req, socket, head, (ws) => {
      yjsWss.emit('connection', ws, req)
    })
  }
  // If the path doesn't match, do nothing -- let other handlers (e.g.
  // Vite's HMR WebSocket) process the upgrade request.
}

/**
 * Close both WebSocket servers. Call on shutdown.
 */
export function closeWebSocketServers() {
  chatWss.close()
  yjsWss.close()
}
