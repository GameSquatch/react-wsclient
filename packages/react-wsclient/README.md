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
  const [message, setMessage] = useState('');

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

- Works on React 16.8 and higher
- Multiple connections possible using multiple `WSClientProvider`s
- Retry logic when connections from the server drop
- Filtering, so calls to the hook from many places in your app are subscribed only to messages meeting the criteria you define in the filter
- JSON parsing for messages containing JSON strings - you can also opt out of JSON parsing with one flag on the provider
  - Parsing occurs once in the message event and is passed after parse to both the message and filter handler params of the hook.

## API

### WSClientProvider

The provider is what actually creates the connection through the WebSocket Web API. It's with this provider you can customize properties of the connection used in the sub-tree of your app with the `useWsClient` hook.

#### Props

**url** (required):

The full ws or wss url to your websocket server. For example, `ws://localhost:8080`.

**useJson** (default: `true`):

The connection will attempt to parse messages using JSON by default. To opt out of this parsing, pass `false` to this prop.

**retry** (default: `true`):

When connections are dropped unexpectedly by the server, the provider will attempt to retry the connection with exponential back-off by default. If you don't want retries, pass `false` to this prop.

**retryInterval** (default: `(n) => n * n * 1000`):

This prop is a function that receives the current attempt count as a number (e.g. the 3rd attempt will be 3) and returns the number of milliseconds to wait before the next connection attempt. This defaults to a function resulting in n-squared seconds, so the 3rd attempt will wait 9 seconds before connecting. When `retry` is false, this will do nothing.

**maxRetries** (default: `5`):

The max number of times the provider will attempt to retry a dropped connection.

### useWsClient

This hook will subscribe to the WS client provided by the `WSClientProvider` and allows you to define listeners for events like messages. It also returns some useful utilities like a send function for sending messages.

#### Props

**onMessage**:

This callback will be invoked any time the websocket receives a message. If `filter` is also defined, it will only be called when the filter returns `true`. The callback receives the data as its only argument and will be JSON if the provider has `useJson` set to true.

**filter** (optional):

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

**onOpen** (optional):

Callback invoked when the WebSocket ready state is in `OPEN`. It receives the raw `Event` from `WebSocket.onopen` as its only argument.

**onClose** (optional):

Callback invoked when the WebSocket is closed. It receives the raw `CloseEvent` from `WebSocket.onclose` and a flag that indicates whether it was manually closed by the `disconnect` function returned from this hook.

#### Returns

An object containing:

**sendMessage**:

A function that takes a string as an argument and calls `WebSocket.send` with that string. If the connection is not yet open, this will queue the message up that will be sent when the connection does open.

**isConnected**:

A getter property that checks the ready state of the WebSocket and returns `true` when that state is `OPEN`.

**reconnect**:

A function with no arguments that will reconnect the WebSocket to the url provided to the provider's `url` prop. If the connection is already open, this will do nothing.

**disconnect**:

A function with no arguments that will close the connection without attempting retries. It will still call the `onClose` callback provided to this hook but will pass `true` to the second argument.

## Sync'ing with React

With WebSocket events happening through the Web APIs, React has no control over synchronizing those events with its rendering system. The only place that React has visibility over this is when you set state in any of the callbacks provided to the `useWsClient` hook. Other websocket libraries will "solve" this by calling `flushSync` with every message event, which will force react to update all state and dependencies touched by any state you set in the message handler. This means you will have the most recent values of state by the time the next message is received and handled, but it also means you're triggering React to completely render with each event, which can have negative performance impacts if your client is receiving many messages in rapid succession from the server.

This library leaves that part up to you. Fortunately, most state updates received in this manner only care about the message that was last received. The only time you would need `flushSync` is if you care about each message in the sequence for display purposes (like a chat thread). You still don't need `flushSync` in those cases if you use React's built-in state setter functions, which allow batching of state while maintaining the sequence of values. For the chat scenario, here is an example of what I mean:

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
        <MessageBubble messageData={message} />
      ))}
    </div>
  );
};
```

By passing a function to the state setter, React can properly batch rapid events while processing each message received, even in rapid succession. Then rendering will be optimized to happen only after state updates are complete. If I had forced the use of `flushSync`, rendering would be forced happen after each state update. You can still opt into that behavior, if you want it, by calling it yourself. In this case the difference would be that if two or more messages were received near simultaneously, `flushSync` would display them one at a time, whereas using the state setter with a function would display that batch of messages all at once in one render pass.
