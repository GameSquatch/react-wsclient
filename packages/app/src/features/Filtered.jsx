import { useState } from 'react';
import { useWsClient } from 'react-wsclient';
import MsgBox from '../components/MsgBox';

/**
 * @typedef {object} JsonResponse
 * @property {'filtered'} type
 * @property {string} content
 */

const Filtered = () => {
  const [response, setResponse] = useState('');
  const [message, setMessage] = useState('');

  const { sendMessage } = useWsClient({
    onMessage: (/** @type {JsonResponse} */ data) => {
      setResponse(data.content);
    },
    filter: (data) => data.type === 'filtered',
  });

  const sendJson = () => {
    sendMessage(JSON.stringify({ type: 'filtered', content: message }));
    setMessage('');
  };

  return (
    <MsgBox>
      <p>Only receives messages with the 'filtered' type</p>
      <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={sendJson}>Send Filtered</button>
      <span>Content field: {response}</span>
    </MsgBox>
  );
};

export default Filtered;
