import { createContext } from 'react';
import { WSClient } from './WSClient';

/** @type {React.Context<WSClient | null>} */
// @ts-expect-error
export const WSClientContext = createContext(null);
