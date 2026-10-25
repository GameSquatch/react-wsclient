import { describe, expect, test } from 'vitest';
import { WSClient } from '../src/WSClient';
import { vi } from 'vitest';
import { ws } from 'msw';
import { setupServer } from 'msw/node';

const wsApi = ws.link('ws://test.com');

const server = setupServer(
  wsApi.addEventListener('connection', ({ client }) => {
    client.addEventListener('message', (e) => {
      const data = e.data;
      client.send(data);
    });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Direct WSClient Interface', () => {
  test('WSClient constructs', () => {
    const client = new WSClient({
      url: 'ws://test.com',
      useJson: false,
      retryInterval: (n) => 2 * n,
      retry: false,
      maxRetries: 3,
    });

    client.connect();

    expect(client.connection.readyState).not.toBe(WebSocket.CLOSED);
  });

  test('WSClient send when closed adds to queue', () => {
    const client = new WSClient({
      url: 'ws://test.com',
      useJson: false,
      retryInterval: (n) => 2 * n,
      retry: false,
      maxRetries: 3,
    });

    expect(client.messageQueue.length).toBe(0);
    client.send('Hello there');
    expect(client.messageQueue.length).toBe(1);
  });

  test('WSClient sends queued when opened', () => {
    const client = new WSClient({
      url: 'ws://test.com',
      useJson: false,
      retryInterval: (n) => 2 * n,
      retry: false,
      maxRetries: 3,
    });

    expect(client.messageQueue.length).toBe(0);
    client.send('Hello there');
    expect(client.messageQueue.length).toBe(1);

    client.subscribe(() => ({
      onMessage: (data) => {
        expect(data).toBe('Hello there');
      },
    }));

    client.connect();
  });

  test('Subscriber receives open event', () => {
    const client = new WSClient({
      url: 'ws://test.com',
      useJson: false,
      retryInterval: (n) => 2 * n,
      retry: false,
      maxRetries: 3,
    });

    client.subscribe(() => ({
      onOpen: (e) => {
        expect(e.type).toBe('open');
      },
    }));

    client.connect();
  });

  test('Subscriber receives string message', () => {
    const client = new WSClient({
      url: 'ws://test.com',
      useJson: false,
      retryInterval: (n) => 2 * n,
      retry: false,
      maxRetries: 3,
    });

    client.connect();

    client.subscribe(() => ({
      onMessage: (data) => {
        expect(data).toBe('Hello there');
      },
    }));

    client.send('Hello there');
  });

  test('Subscriber receives filtered message', () => {
    const client = new WSClient({
      url: 'ws://test.com',
      useJson: false,
      retryInterval: (n) => 2 * n,
      retry: false,
      maxRetries: 3,
    });

    client.connect();

    client.subscribe(() => ({
      filter: (data) => data === 'Hello there',
      onMessage: (data) => {
        expect(data).toBe('Hello there');
      },
    }));

    client.send('Hello there');
  });

  test('Subscriber does not receive filtered out message', () => {
    const client = new WSClient({
      url: 'ws://test.com',
      useJson: false,
      retryInterval: (n) => 2 * n,
      retry: false,
      maxRetries: 3,
    });

    client.connect();
    let messageCount = 0;

    client.subscribe(() => ({
      filter: (data) => {
        messageCount += 1;
        return data === 'Hello there';
      },
      onMessage: (data) => {
        expect(data).toBe('Hello there');
        expect(messageCount).toBe(2);
      },
    }));

    client.send('Filtered out');
    client.send('Hello there');
  });

  test('Subscriber receives parsed JSON', () => {
    const client = new WSClient({
      url: 'ws://test.com',
      useJson: true,
      retryInterval: (n) => 2 * n,
      retry: false,
      maxRetries: 3,
    });

    client.connect();

    client.subscribe(() => ({
      onMessage: (data) => {
        expect(data.msg).toBe('Hello there');
      },
    }));

    client.send(JSON.stringify({ msg: 'Hello there' }));
  });

  test('Subscriber disconnect notifies close', () => {
    const client = new WSClient({
      url: 'ws://test.com',
      useJson: false,
      retryInterval: (n) => 2 * n,
      retry: false,
      maxRetries: 3,
    });

    client.connect();

    client.subscribe(() => ({
      onClose: (e) => {
        expect(e.type).toBe('close');
      },
    }));

    client.disconnect();
  });

  test('WSClient retries on disconnect', () => {
    vi.useFakeTimers();

    const client = new WSClient({
      url: 'ws://test.com',
      useJson: false,
      retryInterval: (n) => 1000 * n,
      retry: true,
      maxRetries: 1,
    });

    client.connect();

    client.subscribe(() => ({
      onClose: (e) => {
        expect(e.type).toBe('close');
      },
    }));

    const oldConnection = client.connection;

    client.disconnect();

    vi.advanceTimersByTime(1000);

    expect(client.connection).not.toBe(oldConnection);
    vi.useRealTimers();
  });

  test('WSClient does not retry on manual disconnect', () => {
    vi.useFakeTimers();

    const client = new WSClient({
      url: 'ws://test.com',
      useJson: false,
      retryInterval: (n) => 1000 * n,
      retry: true,
      maxRetries: 1,
    });

    client.connect();

    client.subscribe(() => ({
      onClose: (e) => {
        expect(e.type).toBe('close');
      },
    }));

    client.disconnectManually();

    vi.advanceTimersByTime(1000);

    expect(client.connectionStatus).toBe('closing');
    expect(client.connection).toBeNull();
    vi.useRealTimers();
  });

  test('Unsubscribe removes subscriber', () => {
    const client = new WSClient({
      url: 'ws://test.com',
      useJson: false,
      retryInterval: (n) => 1000 * n,
      retry: false,
      maxRetries: 1,
    });

    client.connect();

    const unsubscribe = client.subscribe(() => ({}));

    expect(client.subs.length).toBe(1);
    unsubscribe();
    expect(client.subs.length).toBe(0);
  });
});
