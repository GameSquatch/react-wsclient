'use client';

import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { WSClientContext } from './WSClientContext';
import { WSClient } from './WSClient';

/** @import WSClientProvider from './WSClientProvider' */
/** @import { Options } from './WSClient' */

/**
 * @typedef {object} UseWsClientReturn
 * @property {(data: string | object) => void} sendMessage A stable function that sends data as a string over the websocket.
 * @property {() => void} reconnect A function to reconnect to the url given to the provider. If already connected, this will do nothing.
 * @property {() => void} disconnect A function to manually disconnect without triggering the retry process. This will still trigger the `onClose` callback.
 */

/**
 * A hook to access the events from a single {@link WSClientProvider} connection. Multiple
 * hooks can be used under one client provider, and "channels" can be implemented by providing
 * unique filters in this hook's {@link Options} parameter for each hook instance.
 * @template {string | Record<string, unknown>} [TData=string]
 * @param {Options<TData>} options
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
    reconnect: () => wsClient.connect(),
    disconnect: () => wsClient.disconnectManually(),
  };
};

/**
 * A hook to obtain a reactive connection status for a client provided by the provider.
 * @returns {WSClient['connectionStatus']} The connection status of the client.
 */
export const useWsConnectionStatus = () => {
  const wsClient = useClientContext();
  const [connectionStatus, setConnectionStatus] = useState(wsClient.connectionStatus);

  useEffect(() => {
    const unsubscribe = wsClient.subscribe(() => ({
      onStatusChange: (status) => {
        setConnectionStatus(status);
      },
    }));

    return () => {
      unsubscribe();
    };
  }, [wsClient]);

  return connectionStatus;
};

/** @type {() => NonNullable<WSClient>} */
const useClientContext = () => {
  const client = useContext(WSClientContext);
  if (client === null) {
    throw new Error('useWsClient must be used within a WSClientProvider.');
  }
  return client;
};
