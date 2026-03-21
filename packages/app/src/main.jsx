import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { WSClientProvider } from 'react-wsclient';
import { setupWorker } from 'msw/browser';
import { ws } from 'msw';

const loopCount = 2_000;

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
          for (let i = 1; i <= loopCount; ++i) {
            client.send(JSON.stringify({ type: 'blasted', count: i }));
          }
          setTimeout(() => {
            for (let i = 1; i <= loopCount; ++i) {
              client.send(JSON.stringify({ type: 'blasted', count: loopCount + i }));
            }
          }, 200);
          break;
        default: {
          client.send(stringData);
          break;
        }
      }
    });
  })
);

const root = createRoot(/** @type {HTMLElement} */ (document.getElementById('root')));
// @ts-ignore
const workerBase = import.meta.env.PROD ? '/react-wsclient' : '';

worker
  .start({
    serviceWorker: {
      url: `${workerBase}/mockServiceWorker.js`
    },
    quiet: true
  })
  .then(() => {
    root.render(
      <StrictMode>
        <WSClientProvider url="ws://localhost:8080">
          <App />
        </WSClientProvider>
      </StrictMode>
    );
  });
