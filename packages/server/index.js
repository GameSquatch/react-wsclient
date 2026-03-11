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
      default: {
        ws.send(JSON.stringify({ type: 'echo', content: stringData }));
        break;
      }
    }
  });
});

wss.on('listening', () => {
  console.log('WSS server is listening');
});
