import { use, useCallback, useEffect } from 'react';
import { WSClientContext } from './WSClientContext';

/**
 * @template TMsg
 * @typedef {object} Options
 * @property {(data: TMsg) => void} onMessage
 * @property {(data: TMsg) => boolean} [filter]
 */

/**
 * A hook that handles websocket connectivity
 * @template TMsg
 * @param {Options<TMsg>} options
 */
export const useWsClient = ({ onMessage, filter }) => {
  const wsClient = useClientContext();

  const processMessage = useCallback(
    (/** @type {TMsg} */ data) => {
      const willNotify = !filter || filter(data);
      if (willNotify) {
        onMessage(data);
      }
    },
    [onMessage, filter],
  );

  /** @type {(data: string) => void} */
  const sendMessage = useCallback(
    (data) => {
      wsClient.send(data);
    },
    [wsClient],
  );

  useEffect(() => {
    const unsubcribe = wsClient.subscribe({ onMessage: processMessage });

    return () => {
      unsubcribe();
    };
  }, [processMessage, wsClient]);

  return { sendMessage };
};

const useClientContext = () => {
  const client = use(WSClientContext);
  if (client === null) {
    throw new Error('You must add a WSClientContext provider above useWSClient hook call.');
  }
  return client;
};
