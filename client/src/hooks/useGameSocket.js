import { useEffect, useRef, useCallback, useState } from 'react';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:4000/ws';

export function useGameSocket(onMessage) {
  const wsRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const reconnectTimer = useRef(null);

  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setReconnecting(false);
      console.log('[WS] Connected');
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        onMessageRef.current(data);
      } catch (err) {
        console.error('[WS] Parse error', err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setReconnecting(true);
      reconnectTimer.current = setTimeout(() => connect(), 3000);
    };

    ws.onerror = (err) => {
      console.error('[WS] Error', err);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((type, payload = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('[WS] Not connected, queuing...');
    }
  }, []);

  return { sendMessage, connected, reconnecting };
}
