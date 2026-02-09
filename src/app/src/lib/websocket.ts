import type { ChatMessage } from '@/types'

function getWsUrl(): string {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
  if (typeof window === 'undefined') return 'ws://localhost:3000/ws/chat'
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/ws/chat`
}

const WS_URL = getWsUrl()
const WS_DEBUG = import.meta.env.DEV || import.meta.env.VITE_WS_DEBUG === 'true'

type MessageHandler = (roomId: string, message: ChatMessage) => void

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let connectWatchdogTimer: ReturnType<typeof setTimeout> | null = null
let messageHandler: MessageHandler | null = null
const joinedRooms = new Set<string>()
let isManualDisconnect = false
let hasAttachedWindowListeners = false
let reconnectAttempt = 0
let debugIdentity: { userId?: string; userName?: string } = {}

// Queue for messages that couldn't be sent while disconnected
const pendingBroadcasts: Array<{ roomId: string; message: ChatMessage }> = []

// Pending waitForConnection resolvers
let connectionWaiters: Array<{ resolve: () => void; reject: (err: Error) => void }> = []

function logWs(...args: unknown[]) {
  if (WS_DEBUG) {
    console.log('[chat-ws]', { ...debugIdentity }, ...args)
  }
}

export function setWebSocketDebugIdentity(identity: { userId?: string; userName?: string }) {
  debugIdentity = {
    userId: identity.userId,
    userName: identity.userName,
  }
  logWs('debug identity set')
}

function resolveAllWaiters() {
  const waiters = connectionWaiters
  connectionWaiters = []
  for (const { resolve } of waiters) {
    resolve()
  }
}

function rejectAllWaiters(err: Error) {
  const waiters = connectionWaiters
  connectionWaiters = []
  for (const { reject } of waiters) {
    reject(err)
  }
}

function flushPendingBroadcasts() {
  while (pendingBroadcasts.length > 0) {
    const item = pendingBroadcasts.shift()!
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'chat_message',
        roomId: item.roomId,
        payload: item.message,
      }))
    }
  }
}

function clearConnectWatchdog() {
  if (connectWatchdogTimer) {
    clearTimeout(connectWatchdogTimer)
    connectWatchdogTimer = null
  }
}

function ensureWindowReconnectHooks() {
  if (typeof window === 'undefined' || hasAttachedWindowListeners) return

  window.addEventListener('online', () => {
    if (!isManualDisconnect) {
      connect()
    }
  })

  // If the tab wakes up after sleep/background, force a fresh connect pass.
  document.addEventListener('visibilitychange', () => {
    if (!isManualDisconnect && document.visibilityState === 'visible') {
      connect()
    }
  })

  hasAttachedWindowListeners = true
}

function connect() {
  if (typeof window === 'undefined') return
  if (isManualDisconnect) {
    logWs('connect skipped (manual disconnect)')
    return
  }
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    logWs('connect skipped (socket already active)', { readyState: ws.readyState })
    return
  }

  try {
    ensureWindowReconnectHooks()
    ws = new WebSocket(WS_URL)
    logWs('connecting', { url: WS_URL, reconnectAttempt })
    clearConnectWatchdog()
    connectWatchdogTimer = setTimeout(() => {
      // Some environments can leave sockets in CONNECTING indefinitely.
      // Force-close so reconnect logic can recover without manual refresh.
      if (ws?.readyState === WebSocket.CONNECTING) {
        logWs('watchdog closing stuck CONNECTING socket')
        ws.close()
      }
    }, 8000)

    ws.onopen = () => {
      clearConnectWatchdog()
      reconnectAttempt = 0
      // Rejoin all rooms on reconnect
      for (const roomId of joinedRooms) {
        ws?.send(JSON.stringify({ type: 'join', roomId }))
      }
      // Flush any queued broadcasts
      flushPendingBroadcasts()
      // Resolve any pending waitForConnection calls
      resolveAllWaiters()
      logWs('open', { joinedRooms: Array.from(joinedRooms), pendingBroadcasts: pendingBroadcasts.length })
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'chat_message' && data.roomId && data.payload && messageHandler) {
          logWs('message received', { roomId: data.roomId, messageId: (data.payload as ChatMessage)?.id })
          messageHandler(data.roomId, data.payload as ChatMessage)
        }
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = (event) => {
      clearConnectWatchdog()
      ws = null
      // Don't reject waiters on close -- they'll be resolved on next successful connect
      logWs('closed', { code: event.code, reason: event.reason || '(none)', wasClean: event.wasClean })
      scheduleReconnect()
    }

    ws.onerror = (event) => {
      clearConnectWatchdog()
      logWs('error', event)
      ws?.close()
    }
  } catch (error) {
    clearConnectWatchdog()
    logWs('connect threw', error)
    scheduleReconnect()
  }
}

function scheduleReconnect() {
  if (isManualDisconnect) {
    logWs('reconnect skipped (manual disconnect)')
    return
  }
  if (reconnectTimer) {
    logWs('reconnect already scheduled')
    return
  }
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 10000)
  reconnectAttempt += 1
  logWs('schedule reconnect', { delayMs: delay, reconnectAttempt })
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connect()
  }, delay)
}

/**
 * Returns a Promise that resolves when the WebSocket connection is OPEN.
 * If already open, resolves immediately. If connecting, waits for onopen.
 * If closed, initiates a new connection and waits.
 * Rejects after the specified timeout (default 5s).
 */
export function waitForConnection(timeout = 5000): Promise<void> {
  if (ws?.readyState === WebSocket.OPEN) {
    logWs('waitForConnection immediate resolve')
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      // Remove this waiter and reject
      connectionWaiters = connectionWaiters.filter(w => w.resolve !== wrappedResolve)
      logWs('waitForConnection timeout', { timeout })
      reject(new Error('WebSocket connection timeout'))
    }, timeout)

    const wrappedResolve = () => {
      clearTimeout(timer)
      resolve()
    }
    const wrappedReject = (err: Error) => {
      clearTimeout(timer)
      reject(err)
    }

    connectionWaiters.push({ resolve: wrappedResolve, reject: wrappedReject })
    logWs('waitForConnection queued', { waiters: connectionWaiters.length })

    // Kick off connection if not already in progress
    connect()
  })
}

export function initWebSocket(onMessage: MessageHandler) {
  isManualDisconnect = false
  messageHandler = onMessage
  logWs('init')
  connect()
}

/**
 * Join a room, waiting for the WebSocket connection to be ready first.
 * Returns true if join was sent immediately; false if deferred to reconnect.
 */
export async function joinRoom(roomId: string): Promise<boolean> {
  joinedRooms.add(roomId)
  logWs('join requested', { roomId, joinedRooms: Array.from(joinedRooms) })

  try {
    await waitForConnection()
    // Connection is open -- send the join (it may have already been sent
    // by the onopen handler if this was a fresh connection, but sending
    // a duplicate join is idempotent on the server side)
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'join', roomId }))
      logWs('join sent', { roomId })
      return true
    }
  } catch {
    // Connection timed out; the room is still in joinedRooms and will be
    // joined automatically on the next successful connect via onopen.
    console.warn(`WebSocket: timed out waiting to join room ${roomId}, will retry on reconnect`)
  }
  logWs('join deferred', { roomId })
  return false
}

export function leaveRoom(roomId: string) {
  joinedRooms.delete(roomId)
  logWs('leave requested', { roomId, joinedRooms: Array.from(joinedRooms) })
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'leave', roomId }))
    logWs('leave sent', { roomId })
  }
}

export function broadcastMessage(roomId: string, message: ChatMessage) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'chat_message',
      roomId,
      payload: message,
    }))
    logWs('broadcast sent', { roomId, messageId: message.id })
  } else {
    // Queue for delivery when connection reopens
    pendingBroadcasts.push({ roomId, message })
    logWs('broadcast queued', { roomId, messageId: message.id, pending: pendingBroadcasts.length })
  }
}

export function disconnectWebSocket() {
  isManualDisconnect = true
  logWs('disconnect requested')
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  clearConnectWatchdog()
  joinedRooms.clear()
  pendingBroadcasts.length = 0
  rejectAllWaiters(new Error('WebSocket disconnected'))
  messageHandler = null
  ws?.close()
  ws = null
}
