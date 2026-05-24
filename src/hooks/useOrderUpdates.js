import { Client } from '@stomp/stompjs';
import { useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';

const WS_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/ws';

/**
 * Subscribes to /user/queue/orders over STOMP/SockJS.
 * The JWT is sent in the CONNECT headers so the server can establish a
 * user principal and route only this user's status updates here.
 * Automatically reconnects on disconnect.
 */
const useOrderUpdates = (onUpdate) => {
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      connectHeaders: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
      onConnect: () => {
        client.subscribe('/user/queue/orders', (message) => {
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

    return () => { client.deactivate(); };
  }, []); // connect once on mount
};

export default useOrderUpdates;
