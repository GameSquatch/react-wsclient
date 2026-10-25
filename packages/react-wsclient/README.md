# React WebSocket Client

An easy and flexible way to work with websockets in React. No forced `flushSync`, batch friendly, and filter with per-hook callbacks.

See a [demo here](https://gamesquatch.github.io/react-wsclient/) and [demo source code here](https://github.com/GameSquatch/react-wsclient/tree/main/packages/app).

The changelog can be found [here](https://github.com/GameSquatch/react-wsclient/blob/main/packages/react-wsclient/CHANGELOG.md).

## Index

- [Home](#react-websocket-client)
  - [Why?](#why)
  - [Quick Start](#quick-start)
  - [Features](#features)
  - [API](#api)
    - [WSClientProvider](#wsclientprovider)
    - [useWsClient](#usewsclient)
    - [useWsConnectionStatus](#usewsconnectionstatus)
  - [Connection Life Cycles](#connection-life-cycles)
  - [Batch Safety](#batch-safety)
  - [Future Features](#future-features)

## Why?

There are already great libraries that handle websocket connectivity in React, but I didn't like the general opinion to force `flushSync` onto users. With rapid messaging over a websocket, taking advantage of React's batching for state updates can be a performance necessity. This trade-off also comes with some gotchas, but having the control is a good thing for more advanced use-cases.

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
    },
  });

  const send = () => {
    sendMessage({ content: 'Hello websocket!' });
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

- Dependency-free
- Multiple connections using multiple `WSClientProvider`s
- Retry logic when connections from the server drop with configurable retry timing
- Message filtering allows per-hook message "channels"
- Configurable JSON message parsing - parsing happens only once
- Offline send message queueing - sends automatically when connection opens
- Type inferencing for received message data
- Separate reactive connection status hook - see [useWsConnectionStatus](#usewsconnectionstatus)
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
    },
  });
  ```

- **onOpen** (optional) `(event) => void`:

  Callback invoked when the WebSocket ready state is in `OPEN`. It receives the raw `Event` from `WebSocket.onopen` as its only argument.

- **onClose** (optional) `(event, manualDisconnect) => void`:

  Callback invoked when the WebSocket is closed. It receives the raw `CloseEvent` from `WebSocket.onclose` and a flag that indicates whether it was manually closed by the `disconnect` function returned from this hook.

- **onStatusChange** (optional) `(newStatus) => void`:

  Callback invoked when the WebSocket's connection status changes. The value will start as `closed` and immediately transition into `connecting`. When connected the status will be `open`. Upon an unexpected disconnect, the status will be `closed`, but if manually disconnected, the status will first enter into `closing` before `closed`. If the retry process starts, the status will enter into a `retrying` state until it either connects again or closes.

- **onError** (optional) `(event) =>  void`:

  Callback invoked whenever the websocket experiences an error. Usually followed immediately by a close event.

#### Returns

An object containing:

- **sendMessage** `(msg: string | object) => void`:

  A function that takes a string or [`JSON.stringify`-supported object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#description) as an argument and calls `WebSocket.send` with that data. If the connection is not yet open, this will queue the message up that will be sent when the connection does open.

- **reconnect** `() => void`:

  A function with no arguments that will reconnect the WebSocket to the url provided to the provider's `url` prop. If the connection is already open or retries are pending, this will do nothing. If the connection fails to connect, this will trigger retry, if the provider is configured to do so.

- **disconnect** `() => void`:

  A function with no arguments that will close the connection without attempting retries. It will still call the `onClose` callback provided to this hook.

### useWsConnectionStatus

A reactive enum for connection status that replaces the old `isConnected()` function. The possible values returned from this hook are: `closed`, `connecting`, `open`, `closing`, and `retrying`. You also have access to the status change event as an event handler passed to `useWsClient`, in case you wanted to set this state your own way.

Example:

```jsx
const SocketStatus = () => {
  const status = useWsConnectionStatus();

  switch (status) {
    case 'closed':
      return 'Closed';
    case 'connecting':
      return 'Connecting';
    case 'open':
      return 'Open';
    case 'closing':
      return 'Closing';
    case 'retrying':
      return 'Retrying';
  }
};
```

## Connection Life Cycles

```
START
  closed
    │ provider mounts / connect()
    ▼
  connecting ── WebSocket opens ──▶ open
                                      │
                unexpected close ────┘
                                      ▼
                                  retrying
                                      │ wait for retry interval
                                      ▼
                                  connecting
                                      │
                         opens ──────▶ open
                                      │
                    closes again ────┘
                       (repeat while retries remain)

  retrying ── retry limit reached ──▶ closed
  open ────── retry disabled ───────▶ closed

  open ── manual disconnect ──▶ closing ── close event ──▶ closed
  provider unmount ────────────▶ manual disconnect
```

## Batch Safety

Websocket message events can occur very rapidly, and React's state update system [uses batching](https://react.dev/learn/queueing-a-series-of-state-updates). When using this websocket library, you always have to keep this in mind, since it does not force the use of `flushSync`, which ignores the batching system and makes state updates synchronous. What this means for you is that you have to be aware of how you update states within the `onMessage` callback. All you have to know is that when you set state in this callback, that state may not be updated by the time the next `onMessage` or `filter` call occurs. You can largely ignore this by using a function in the state setters for React, or the equivalent in your state management library of choice. An example:

```jsx
const ChatThread = () => {
  const [messages, setMessages] = useState([]);

  useWSClient({
    onMessage: (chatMessage) => {
      // Don't do this - messages can be stale for rapid message events
      // setMessages([...messages, chatMessage]);

      // Do this instead
      setMessages((currentMessages) => [...currentMessages, chatMessage]);
    },
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

The only other time you'll have to be aware of this nuance is if you use state values outside of setters, like in other calculations or conditional statements. In those cases, you may have to use `flushSync` yourself or track values with `useRef`. If you only need the most recent message in your state, you are completely fine to use state setters even without the function-based argument that React uses. An example:

```jsx
const ChatThread = () => {
  const [messages, setMessages] = useState([]);
  const [receivedMessageCount, setReceivedMessageCount] = useState(0);
  const messageCountRef = useRef(0);

  useWSClient({
    onMessage: (chatMessage) => {
      // This may not work if messages are rapid, due to React's state batching
      setReceivedMessageCount((current) => current + 1);
      // By this next line or even the next onMessage call, `receivedMessageCount` may not be updated
      if (receivedMessageCount >= 5) {
        return;
      }

      // Recommended alternative
      messageCountRef.current += 1;
      // Value guaranteed to be updated by the next message event
      if (messageCountRef.current >= 5) {
        return;
      }

      setMessages((currentMessages) => [...currentMessages, chatMessage]);
    },
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

## Future features

- Worker parsing of large JSON payloads
- Improved retry policy controls
- Improved send queue options/controls
