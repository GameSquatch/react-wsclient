# React WebSocket Client

An easy and flexible way to work with websockets in React. No forced `flushSync`, batch friendly, and filter with per-hook callbacks.

See a [demo here](https://gamesquatch.github.io/react-wsclient/) and [demo source code here](https://github.com/GameSquatch/react-wsclient/tree/main/packages/app).

The changelog can be found [here](https://github.com/GameSquatch/react-wsclient/blob/main/packages/react-wsclient/CHANGELOG.md).

## Why?

There are already great libraries that handle websocket connectivity in React, but I didn't like the general opinion to force `flushSync` onto users. With rapid messaging over a websocket, taking advantage of React's batching for state updates can be a performance necessity. It also comes with some gotchas, but having the control is a good thing for intermediate to advanced developers.

## Quick Start

**Install**

```sh
pnpm add react-wsclient
npm install react-wsclient
```

**Add the provider**

```jsx
createRoot(/** @type {HTMLElement} */ (document.getElementById('root'))).render(
  <StrictMode>
    <WSClientProvider url="ws://localhost:8080">
      <App />
    </WSClientProvider>
  </StrictMode>
);
```

**Use the hook**

```jsx
const App = () => {
  const [response, setResponse] = useState('');

  const { sendMessage } = useWsClient({
    onMessage: (data) => {
      setResponse(data.content);
    }
  });

  const send = () => {
    sendMessage('Hello websocket!');
  };

  return (
    <div>
      <button onClick={send}>Send</button>
      <p>Response: {response}</p>
    </div>
  );
};
```

## Features

- Multiple connections possible using multiple `WSClientProvider`s
- Retry logic when connections from the server drop
- Filtering prop allows per-hook message "channels"
- JSON parsing for messages containing JSON strings - you can also opt out of JSON parsing with one flag on the provider
- Works on React 16.8 and higher

## API

### WSClientProvider

The provider is what actually creates the connection through the WebSocket Web API. It's with this provider you can customize properties of the connection used in the sub-tree of your app with the `useWsClient` hook.

#### Props

- **url** (required):

  The full ws or wss url to your websocket server. For example, `ws://localhost:8080`.

- **useJson** (default: `true`):

  The connection will attempt to parse messages using JSON by default. To opt out of this parsing, pass `false` to this prop.

- **retry** (default: `true`):

  When connections are dropped unexpectedly by the server, the provider will attempt to retry the connection with exponential back-off by default. If you don't want retries, pass `false` to this prop.

- **retryInterval** (default: `(n) => n * n * 1000`):

  This prop is a function that receives the current attempt count as a number (e.g. the 3rd attempt will be 3) and returns the number of milliseconds to wait before the next connection attempt. This defaults to a function resulting in n-squared seconds, so the 3rd attempt will wait 9 seconds before connecting. When `retry` is false, this will do nothing.

- **maxRetries** (default: `5`):

  The max number of times the provider will attempt to retry a dropped connection.

### useWsClient

This hook will subscribe to the WS client provided by the `WSClientProvider` and allows you to define listeners for events like messages. It also returns some useful utilities like a send function for sending messages. The props passed to this hook are updated with a ref internally, so all events that occur on the websocket connection will have the most recent references to callbacks, so it's quite alright that you don't memoize those callbacks before passing them to the hook.

#### Props

- **onMessage** (optional) `(data) => void`:

  This callback will be invoked any time the websocket receives a message. If `filter` is also defined, it will only be called when the filter returns `true`. The callback receives the data as its only argument and will be JSON if the provider has `useJson` set to true.

- **filter** (optional) `(data) => boolean`:

  The filter callback can be used to limit when the `onMessage` callback is invoked. It receives the data as its only argument and should return `true` when you want to trigger `onMessage`. The data argument will be a JS object if the provider has `useJson` set to `true`.

  Example:

  ```ts
  useWsClient({
    onMessage: (data) => {
      console.log('Received message from channel "channel-abc".');
    },
    filter: (data) => {
      return data.room === 'channel-abc';
    }
  });
  ```

- **onOpen** (optional) `(event) => void`:

  Callback invoked when the WebSocket ready state is in `OPEN`. It receives the raw `Event` from `WebSocket.onopen` as its only argument.

- **onClose** (optional) `(event) => void`:

  Callback invoked when the WebSocket is closed. It receives the raw `CloseEvent` from `WebSocket.onclose` and a flag that indicates whether it was manually closed by the `disconnect` function returned from this hook.

#### Returns

An object containing:

- **sendMessage** `(msg: string) => void`:

  A function that takes a string as an argument and calls `WebSocket.send` with that string. If the connection is not yet open, this will queue the message up that will be sent when the connection does open.

- **isConnected** `() => boolean`:

  A getter function that checks the ready state of the WebSocket and returns `true` when that state is `OPEN`. This function returns the current connection state - i.e. it is not reactive.

- **reconnect** `() => void`:

  A function with no arguments that will reconnect the WebSocket to the url provided to the provider's `url` prop. If the connection is already open, this will do nothing.

- **disconnect** `() => void`:

  A function with no arguments that will close the connection without attempting retries. It will still call the `onClose` callback provided to this hook but will pass `true` to the second argument.

## Batch Safety

Websocket message events can occur very rapidly, and React's state update system [uses batching](https://react.dev/learn/queueing-a-series-of-state-updates). When using this websocket library, you always have to keep this in mind, since it does not force the use of `flushSync`, which ignores the batching system and makes state updates synchronous. What this means for you is that you have to be aware of how you update states within the `onMessage` callback. All you have to know is that when you set state in this callback, that state may not be updated by the time the next `onMessage` call occurs. You can largely ignore this by using a function in the state setters for React, or the equivalent in your state management library of choice:

```jsx
const ChatThread = () => {
  const [messages, setMessages] = useState([]);

  useWSClient({
    onMessage: (chatMessage) => {
      // Don't do this - messages can be stale for rapid message events
      // setMessages([...messages, chatMessage]);

      // Do this instead
      setMessages((currentMessages) => [...currentMessages, chatMessage]);
    }
  });

  return (
    <div className="chat-thread">
      {messages.map((message) => (
        <MessageBubble key={message.id} messageData={message} />
      ))}
    </div>
  );
};
```

The only other time you'll have to be aware of this nuance is if you use state values outside of setters, like in other calculations or conditional statements. In those cases, you may have to use `flushSync` when updating state in the `onMessage` callback. If you only need the most recent message in your state, you are completely fine to use state setters even without the function-based argument that React uses.
