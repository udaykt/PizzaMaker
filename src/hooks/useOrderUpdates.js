import { Client } from '@stomp/stompjs';
import { useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';

const WS_URL = (process.env.REACT_APP_API_URL || 'http://localhost:8080') + '/ws';

/**
 * Subscribes to /topic/orders over STOMP/SockJS.
 * Calls onUpdate({ oid, userUid, status }) whenever the backend broadcasts a status change.
 * Automatically reconnects on disconnect.
 */
const useOrderUpdates = (onUpdate) => {
  const clientRef = useRef(null);
  const onUpdateRef = useRef(onUpdate);

  // Keep callback ref current without restarting the socket
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/topic/orders', (message) => {
          try {
            const update = JSON.parse(message.body);
            onUpdateRef.current(update);
          } catch (e) {
            console.error('WS parse error', e);
          }
        });
      },
      onStompError: (frame) => {
        console.warn('STOMP error', frame);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => { client.deactivate(); };
  }, []); // connect once on mount
};

export default useOrderUpdates;
