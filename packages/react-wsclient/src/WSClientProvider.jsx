import { useEffect, useMemo } from 'react';
import { WSClient } from './WSClient';
import { WSClientContext } from './WSClientContext';

/** @type {Map<string, WSClient>} */
// const clientMap = new Map();

/**
 * @typedef {object} WSConfigProviderProps
 * @property {React.ReactNode} children
 * @property {string} url
 * @property {boolean} [useJson=true]
 * @property {boolean} [retry=true]
 * @property {(retryCount: number) => number} [retryInterval]
 * @property {number} [maxRetries=5]
 */

/** @type {React.FC<WSConfigProviderProps>} */
const WSClientProvider = ({ children, url, useJson = true, retry = true, retryInterval, maxRetries = 5 }) => {
  const client = useMemo(() => {
    const effectiveRetryInterval = retryInterval ?? ((n) => n * n * 1000);
    return new WSClient({
      url,
      retry,
      retryInterval: effectiveRetryInterval,
      maxRetries,
      useJson,
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
