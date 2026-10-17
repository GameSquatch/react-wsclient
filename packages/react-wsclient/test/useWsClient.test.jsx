import { useWsClient } from '../src/useWsClient';
import { render } from '@testing-library/react';
import WSClientProvider from '../src/WSClientProvider';
import { WebSocketOpenedMock } from './WebSocketMock';
import '@testing-library/jest-dom';

globalThis.WebSocket = WebSocketOpenedMock;

const TestComponent = () => {
  const { sendMessage, isConnected } = useWsClient({
    onOpen: (e) => {},
  });

  return (
    <div>
      <button onClick={() => void sendMessage('Hello there')}>Send</button>
      <button>Disconnect</button>
      <p>Status: {isConnected() ? 'connected' : 'not connected'}</p>
    </div>
  );
};

describe('useWsClient', () => {
  test('client opens', () => {
    const { getByText } = render(
      <WSClientProvider url="ws://test.com">
        <TestComponent />
      </WSClientProvider>,
    );
    expect(getByText('Status: not connected')).toBeInTheDocument();
  });
});
