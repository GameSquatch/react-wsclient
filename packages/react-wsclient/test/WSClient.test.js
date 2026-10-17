import { describe, expect, test } from 'vitest';
import { WSClient } from '../src/WSClient';
import { vi } from 'vitest';
import { WebSocketMock } from './WebSocketMock';

globalThis.WebSocket = WebSocketMock;

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

    expect(client.connection?.url).toBe('ws://test.com');
    expect(client.connection).not.toBeNull();
  });

  test('WSClient send when closed adds to queue', () => {
    const client = new WSClient({
      url: 'ws://test.com',
      useJson: false,
      retryInterval: (n) => 2 * n,
      retry: false,
      maxRetries: 3,
    });

    client.connect();

    expect(client.connection?.readyState).toBe(WebSocketMock.CLOSED);
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

    client.connect();

    expect(client.connection?.readyState).toBe(WebSocketMock.CLOSED);
    expect(client.messageQueue.length).toBe(0);
    client.send('Hello there');
    expect(client.messageQueue.length).toBe(1);

    client.connection.readyState = WebSocketMock.OPEN;
    client.connection?.onopen?.(new Event('Opening mock'));
    expect(client.connection?.msg).toBe('Hello there');
  });

  test('Subscriber receives open event', () => {
    const client = new WSClient({
      url: 'ws://test.com',
      useJson: false,
      retryInterval: (n) => 2 * n,
      retry: false,
      maxRetries: 3,
    });

    client.connect();

    client.subscribe(() => ({
      onOpen: (e) => {
        expect(e.type).toBe('mockopen');
      },
    }));

    client.connection.readyState = WebSocketMock.OPEN;
    client.connection?.onopen?.(new Event('mockopen'));
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

    client.connection.readyState = WebSocketMock.OPEN;
    client.connection?.onopen?.(new Event('Opening mock'));
    client.connection?.onmessage?.(
      new MessageEvent('message', {
        data: 'Hello there',
      }),
    );
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

    client.connection.readyState = WebSocketMock.OPEN;
    client.connection?.onopen?.(new Event('Opening mock'));
    client.connection?.onmessage?.(
      new MessageEvent('message', {
        data: 'Hello there',
      }),
    );
  });

  test('Subscriber does not receive filtered out', () => {
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

    client.connection.readyState = WebSocketMock.OPEN;
    client.connection?.onopen?.(new Event('Opening mock'));
    client.connection?.onmessage?.(
      new MessageEvent('message', {
        data: 'Filtered out',
      }),
    );
    client.connection?.onmessage?.(
      new MessageEvent('message', {
        data: 'Hello there',
      }),
    );
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

    client.connection.readyState = WebSocketMock.OPEN;
    client.connection?.onopen?.(new Event('Opening mock'));
    client.connection?.onmessage?.(
      new MessageEvent('message', {
        data: JSON.stringify({ msg: 'Hello there' }),
      }),
    );
  });

  test('Subscriber receives close event', () => {
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

    client.connection.readyState = WebSocketMock.OPEN;
    client.connection?.onopen?.(new Event('mockopen'));
    client.connection.readyState = WebSocketMock.CLOSED;
    client.connection?.onclose?.(new CloseEvent('close'));
  });

  test('WSClient disconnect notifies close', () => {
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

    client.connection.readyState = WebSocketMock.OPEN;
    client.connection?.onopen?.(new Event('mockopen'));
    client.connection.readyState = WebSocketMock.CLOSED;
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

    client.connection.readyState = WebSocketMock.OPEN;
    client.connection?.onopen?.(new Event('mockopen'));
    client.connection.readyState = WebSocketMock.CLOSED;
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

    client.connection.readyState = WebSocketMock.OPEN;
    client.connection?.onopen?.(new Event('mockopen'));
    client.connection.readyState = WebSocketMock.CLOSED;
    client.disconnectManually();

    vi.advanceTimersByTime(1000);

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
