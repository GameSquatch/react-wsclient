'use client';

import { useCallback, useContext, useEffect, useRef } from 'react';
import { WSClientContext } from './WSClientContext';
import { WSClient } from './WSClient';

/**
 * @typedef {object} UseWsClientReturn
 * @property {(data: string | object) => void} sendMessage A stable function that sends a string message over the websocket.
 * @property {() => boolean} isConnected A getter that returns whether the client is currently connected.
 * @property {() => void} reconnect A function to reconnect to the url given to the provider. If already connected, this will do nothing.
 * @property {() => void} disconnect A function to manually disconnect without triggering the retry process. This will still trigger the `onClose` callback.
 */

/**
 *
 * @param {import('./WSClient').Options} options
 * @returns {UseWsClientReturn}
 */
export const useWsClient = (options) => {
  const wsClient = useClientContext();
  const optionsRef = useRef(options);
  // eslint-disable-next-line react-hooks/refs
  optionsRef.current = options;

  const sendMessage = useCallback(
    (/** @type {string | object} */ data) => {
      const stringData = typeof data === 'string' ? data : JSON.stringify(data);
      wsClient.send(stringData);
    },
    [wsClient]
  );

  useEffect(() => {
    const unsubscribe = wsClient.subscribe(() => optionsRef.current);

    return () => {
      unsubscribe();
    };
  }, [wsClient]);

  return {
    sendMessage,
    isConnected: () => wsClient.isConnected,
    reconnect: () => wsClient.connect(),
    disconnect: () => wsClient.disconnect()
  };
};

/** @type {() => NonNullable<WSClient>} */
const useClientContext = () => {
  const client = useContext(WSClientContext);
  if (client === null) {
    throw new Error('useWsClient must be used within a WSClientProvider.');
  }
  return client;
};
