/* eslint-disable react-hooks/refs */
import { useRef, useState } from 'react';
import { useWsClient } from 'react-wsclient';
import MsgBox from '../components/MsgBox';

/**
 * @typedef {object} JsonResponse
 * @property {'blasted'} type
 * @property {number} count
 */
const Blasted = () => {
  const [response, setResponse] = useState(0);
  /** @type {import('react').RefObject<Set<number>>} */
  const renderedCountsRef = useRef(new Set());

  const { sendMessage } = useWsClient({
    onMessage: () => {
      setResponse((c) => {
        // Uncomment to see the message events running
        // if (c <= 100) {
        //   console.log(c);
        // }
        return c + 1;
      });
    },
    filter: (/** @type {JsonResponse} */ data) => data.type === 'blasted'
  });

  renderedCountsRef.current.add(response);

  const sendJson = () => {
    setResponse(0);
    renderedCountsRef.current.clear();
    sendMessage(JSON.stringify({ type: 'blastme' }));
  };

  return (
    <MsgBox>
      <p>
        Will receive thousands of messages as fast as the WS can send them. Note how even though we set the state
        thousands of times, it only renders twice or so.
      </p>
      <button onClick={sendJson}>Blast Me</button>
      <span className="msg-resp">Content field: {response}</span>
      <div>
        Counts seen during render: <span>{[...renderedCountsRef.current].join(',')}</span>
      </div>
    </MsgBox>
  );
};

export default Blasted;
