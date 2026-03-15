import { useState } from 'react';
import { useWsClient } from 'react-wsclient';
import MsgBox from '../components/MsgBox';

/**
 * @typedef {object} JsonResponse
 * @property {'blasted'} type
 * @property {number} count
 */
const Blasted = () => {
  const [response, setResponse] = useState(0);

  const { sendMessage } = useWsClient({
    onMessage: (/** @type {JsonResponse} */ data) => {
      setResponse(data.count);
    },
    filter: (/** @type {JsonResponse} */ data) => data.type === 'blasted',
  });

  // Note how batching of state updates won't log all 100 updates
  console.log(response);

  const sendJson = () => {
    setResponse(0);
    sendMessage(JSON.stringify({ type: 'blastme' }));
  };

  return (
    <MsgBox>
      <p>Will receive an onslaught of messages for 2 seconds</p>
      <button onClick={sendJson}>Blast Me</button>
      <span>Content field: {response}</span>
    </MsgBox>
  );
};

export default Blasted;
