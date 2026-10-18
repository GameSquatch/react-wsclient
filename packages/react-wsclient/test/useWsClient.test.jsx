import { useWsClient } from '../src/useWsClient';
import { render, screen, waitFor } from '@testing-library/react';
import WSClientProvider from '../src/WSClientProvider';
import '@testing-library/jest-dom';
import { ws } from 'msw';
import { setupServer } from 'msw/node';
import { useState } from 'react';
import userEvent from '@testing-library/user-event';

const wsApi = ws.link('ws://test.com');
let firstWsClient;
let connectionCount = 0;

const server = setupServer(
  wsApi.addEventListener('connection', ({ client }) => {
    connectionCount += 1;
    if (connectionCount === 1) {
      firstWsClient = client;
    }

    client.addEventListener('message', (e) => {
      const data = e.data;
      client.send(data); // echo back the same message
    });
  }),
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});
afterEach(() => {
  connectionCount = 0;
  server.resetHandlers();
});
afterAll(() => server.close());

const TestComponent = () => {
  const [message, setMessage] = useState('');
  const { sendMessage, isConnected, disconnect, reconnect } = useWsClient({
    filter: (data) => {
      if (typeof data === 'string') {
        return data === 'Hello there';
      }
      return data.msg === 'Hello JSON';
    },
    onOpen: (e) => {
      setConnected(isConnected());
    },
    onMessage: (data) => {
      if (typeof data === 'string') {
        setMessage(data);
      } else {
        setMessage(data.msg);
      }
    },
    onClose: () => {
      setConnected(isConnected());
    },
    onError: () => {
      setConnected(isConnected());
    },
  });
  const [connected, setConnected] = useState(isConnected());

  return (
    <div>
      <button role="button" onClick={() => void sendMessage('Hello there')}>
        Send
      </button>
      <button role="button" onClick={() => void sendMessage('Filter me out')}>
        Send Filtered
      </button>
      <button role="button" onClick={() => void sendMessage({ msg: 'Hello JSON' })}>
        Send JSON
      </button>
      <button role="button" onClick={() => void disconnect()}>
        Disconnect
      </button>
      <button role="button" onClick={() => void reconnect()}>
        Reconnect
      </button>
      <p>Status: {connected ? 'connected' : 'not connected'}</p>
      <p>{message}</p>
    </div>
  );
};

describe('useWsClient', () => {
  test('Client connects successfully', async () => {
    render(
      <WSClientProvider url="ws://test.com">
        <TestComponent />
      </WSClientProvider>,
    );

    const statusText = await screen.findByText('Status: connected');
    expect(statusText).toBeInTheDocument();
  });

  test('Client receives echo message', async () => {
    const user = userEvent.setup();
    render(
      <WSClientProvider url="ws://test.com" useJson={false}>
        <TestComponent />
      </WSClientProvider>,
    );

    const statusText = await screen.findByText('Status: connected');
    expect(statusText).toBeInTheDocument();
    await user.click(screen.getByText('Send'));
    const messageText = await screen.findByText('Hello there');
    expect(messageText).toBeInTheDocument();
  });

  test('Rapid messages result in final message', async () => {
    const user = userEvent.setup();
    render(
      <WSClientProvider url="ws://test.com" useJson={false}>
        <TestComponent />
      </WSClientProvider>,
    );

    const statusText = await screen.findByText('Status: connected');
    expect(statusText).toBeInTheDocument();
    for (let i = 0; i < 100; ++i) {
      user.click(screen.getByText('Send'));
    }
    await user.click(screen.getByText('Send'));
    const messageText = await screen.findByText('Hello there');
    expect(messageText).toBeInTheDocument();
  });

  test('Filtered message does not get processed', async () => {
    const user = userEvent.setup();
    render(
      <WSClientProvider url="ws://test.com" useJson={false}>
        <TestComponent />
      </WSClientProvider>,
    );

    const statusText = await screen.findByText('Status: connected');
    expect(statusText).toBeInTheDocument();
    await user.click(screen.getByText('Send'));
    let messageText = await screen.findByText('Hello there');
    expect(messageText).toBeInTheDocument();
    await user.click(screen.getByText('Send Filtered'));
    messageText = await screen.findByText('Hello there');
    expect(messageText).toBeInTheDocument();
  });

  test('Using JSON correctly parses data', async () => {
    const user = userEvent.setup();
    render(
      <WSClientProvider url="ws://test.com" useJson={true}>
        <TestComponent />
      </WSClientProvider>,
    );

    const statusText = await screen.findByText('Status: connected');
    expect(statusText).toBeInTheDocument();
    await user.click(screen.getByText('Send JSON'));
    let messageText = await screen.findByText('Hello JSON');
    expect(messageText).toBeInTheDocument();
  });

  test('Client disconnects manually', async () => {
    const user = userEvent.setup();
    render(
      <WSClientProvider url="ws://test.com" retry={false}>
        <TestComponent />
      </WSClientProvider>,
    );

    let statusText = await screen.findByText('Status: connected');
    expect(statusText).toBeInTheDocument();
    await user.click(screen.getByText('Disconnect'));
    statusText = await screen.findByText('Status: not connected');
    expect(statusText).toBeInTheDocument();
  });

  test('Client will reconnect after manual disconnect', async () => {
    const user = userEvent.setup();
    render(
      <WSClientProvider url="ws://test.com" retry={false}>
        <TestComponent />
      </WSClientProvider>,
    );

    let statusText = await screen.findByText('Status: connected');
    expect(statusText).toBeInTheDocument();
    await user.click(screen.getByText('Disconnect'));
    statusText = await screen.findByText('Status: not connected');
    expect(statusText).toBeInTheDocument();
    await user.click(screen.getByText('Reconnect'));
    statusText = await screen.findByText('Status: connected');
    expect(statusText).toBeInTheDocument();
  });

  test('Client will retry connection upon disconnect', async () => {
    render(
      <WSClientProvider url="ws://test.com" retry retryInterval={(n) => 0} maxRetries={1}>
        <TestComponent />
      </WSClientProvider>,
    );

    let statusText = await screen.findByText('Status: connected');
    expect(statusText).toBeInTheDocument();
    firstWsClient?.close();

    await waitFor(() => expect(connectionCount).toBe(2));
    expect(connectionCount).toBe(2);
  });
});
