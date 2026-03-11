import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { WSClientProvider } from 'react-wsclient';

createRoot(/** @type {HTMLElement} */ (document.getElementById('root'))).render(
  <StrictMode>
    <WSClientProvider url="ws://localhost:8080">
      <App />
    </WSClientProvider>
  </StrictMode>,
);
