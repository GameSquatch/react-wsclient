import { useState } from 'react';
import { useWsClient } from 'react-wsclient';
import MsgBox from '../components/MsgBox';

const Echo = () => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');

  const { sendMessage } = useWsClient({
    onMessage: (data) => {
      setResponse(data.content);
    },
  });

  const send = () => {
    sendMessage(JSON.stringify({ type: 'echo', content: message }));
    setMessage('');
  };

  return (
    <MsgBox>
      <p>Receives all messages</p>
      <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={send}>Send</button>
      <span>Response: {response}</span>
    </MsgBox>
  );
};

export default Echo;
