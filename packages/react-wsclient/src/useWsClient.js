import { useCallback, useContext, useEffect, useRef } from 'react';
import { WSClientContext } from './WSClientContext';

/**
 * A hook that handles websocket connectivity
 * @param {import('./WSClient').Options} options
 */
export const useWsClient = (options) => {
  const wsClient = useClientContext();
  const optionsRef = useRef(options);
  // eslint-disable-next-line react-hooks/refs
  optionsRef.current = options;

  /** @type {(data: string) => void} */
  const sendMessage = useCallback(
    (data) => {
      wsClient.send(data);
    },
    [wsClient],
  );

  useEffect(() => {
    const unsubscribe = wsClient.subscribe(() => optionsRef.current);

    return () => {
      unsubscribe();
    };
  }, [wsClient]);

  return {
    sendMessage,
    isConnected: wsClient.isConnected,
    reconnect: () => wsClient.connect(),
    disconnect: () => wsClient.disconnect(),
  };
};

const useClientContext = () => {
  const client = useContext(WSClientContext);
  if (client === null) {
    throw new Error('useWsClient must be used within a WSClientProvider.');
  }
  return client;
};
