# React WebSocket Client

An easy and flexible way to work with websockets in React.

## Why?

There are already great libraries that handle websocket connectivity in React, but I didn't like the general opinion to force `flushSync` onto users. With rapid messaging over a websocket, taking advantage of React's batching for state updates can be a performance necessity. It also comes with some gotchas, but having the control is a good thing for intermediate to advanced developers.

## Quick Start

**Add the provider**

```jsx
createRoot(/** @type {HTMLElement} */ (document.getElementById('root'))).render(
  <StrictMode>
    <WSClientProvider url="ws://localhost:8080">
      <App />
    </WSClientProvider>
  </StrictMode>,
);
```

**Use the hook**

```jsx
const App = () => {
  const [message, setMessage] = useState('');

  const { sendMessage } = useWsClient({
    onMessage: (data) => {
      setResponse(data.content);
    },
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

- Multiple connections using multiple `WSClientProvider`s
- Retry logic when connections from the server drop
- Filtering, so calls to the hook from many places in your app are subscribed only to messages meeting the criteria you define in the filter
- JSON parsing for messages containing JSON strings - you can also opt out of JSON parsing with one flag on the provider
  - Parsing occurs once in the message event and is passed after parse to both the message and filter handler params of the hook.
