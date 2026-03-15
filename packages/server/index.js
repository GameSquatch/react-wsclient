import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('error', console.error);

  ws.on('message', (data) => {
    console.log('received: %s', data);

    const stringData = data.toString();
    const jsonData = JSON.parse(stringData);
    switch (jsonData.type) {
      case 'filtered': {
        ws.send(JSON.stringify({ type: 'filtered', content: jsonData.content }));
        break;
      }
      case 'blastme':
        for (let i = 1; i <= 100; ++i) {
          ws.send(JSON.stringify({ type: 'blasted', count: i }));
        }
        break;
      default: {
        ws.send(JSON.stringify({ type: 'echo', content: stringData }));
        break;
      }
    }
  });

  ws.on('close', () => {
    console.log(`Closing connection. ${wss.clients.size} clients connected.`);
  });

  console.log(`Connection made. ${wss.clients.size} clients connected`);
});

wss.on('listening', () => {
  console.log('WSS server is listening');
});
