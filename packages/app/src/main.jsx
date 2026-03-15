import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { WSClientProvider } from 'react-wsclient';
import { setupWorker } from 'msw/browser';
import { ws } from 'msw';

const wsApi = ws.link('ws://localhost:8080');
const worker = setupWorker(
  wsApi.addEventListener('connection', ({ client }) => {
    client.addEventListener('message', (e) => {
      const data = e.data;
      const stringData = data.toString();
      const jsonData = JSON.parse(stringData);

      switch (jsonData.type) {
        case 'filtered': {
          client.send(JSON.stringify({ type: 'filtered', content: jsonData.content }));
          break;
        }
        case 'blastme':
          for (let i = 1; i <= 100; ++i) {
            client.send(JSON.stringify({ type: 'blasted', count: i }));
          }
          break;
        default: {
          client.send(JSON.stringify({ type: 'echo', content: stringData }));
          break;
        }
      }
    });
  }),
);

const root = createRoot(/** @type {HTMLElement} */ (document.getElementById('root')));

worker
  .start({
    quiet: true,
  })
  .then(() => {
    root.render(
      <StrictMode>
        <WSClientProvider url="ws://localhost:8080">
          <App />
        </WSClientProvider>
      </StrictMode>,
    );
  });
