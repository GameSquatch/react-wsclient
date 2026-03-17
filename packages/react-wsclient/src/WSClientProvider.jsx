'use client';

import { useEffect, useMemo } from 'react';
import { WSClient } from './WSClient';
import { WSClientContext } from './WSClientContext';

/**
 * @typedef {object} WSConfigProviderProps
 * @property {React.ReactNode} children
 * @property {string} url The WebSocket server URL to connect to.
 * @property {boolean} [useJson=true] Whether to automatically `JSON.parse` incoming messages. If true, the client will attempt to parse incoming messages as JSON. If false, messages will be received as raw strings.
 * @property {boolean} [retry=true] Whether to automatically retry the connection if it is lost.
 * @property {(retryCount: number) => number} [retryInterval] A function that determines the interval between retry attempts.
 * @property {number} [maxRetries=5] The maximum number of times to attempt to reconnect.
 */

/**
 * A React context provider that configures a WebSocket client for one or more `useWsClient` consumers beneath it.
 * @type {React.FC<WSConfigProviderProps>}
 * */
const WSClientProvider = ({ children, url, useJson = true, retry = true, retryInterval, maxRetries = 5 }) => {
  const client = useMemo(() => {
    const effectiveRetryInterval = retryInterval ?? ((n) => n * n * 1000);
    return new WSClient({
      url,
      retry,
      retryInterval: effectiveRetryInterval,
      maxRetries,
      useJson
    });
  }, [url, retry, retryInterval, maxRetries, useJson]);

  useEffect(() => {
    client.connect();

    return () => {
      client.disconnect();
    };
  }, [client]);

  return <WSClientContext.Provider value={client}>{children}</WSClientContext.Provider>;
};

export default WSClientProvider;
