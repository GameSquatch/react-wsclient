import { useEffect, useState } from 'react';
import { WSClient } from './WSClient';
import { WSClientContext } from './WSClientContext';

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
  const effectiveRetryInterval = retryInterval ?? ((n) => n * n * 1000);
  /** @type {React.RefObject<WSClient>} */
  const clientRef = useRef(null);
  if (clientRef.current === null) {
    clientRef.current = new WSClient({
      url,
      retry,
      retryInterval: effectiveRetryInterval,
      maxRetries,
      useJson,
    });
  }

  return <WSClientContext.Provider value={clientRef.current}>{children}</WSClientContext.Provider>;
};

export default WSClientProvider;
