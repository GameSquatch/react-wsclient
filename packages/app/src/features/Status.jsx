import { useWsConnectionStatus } from 'react-wsclient';

const Status = () => {
  const status = useWsConnectionStatus();

  let color;
  if (status === 'open') {
    color = 'green';
  } else if (['connecting', 'closing', 'retrying'].includes(status)) {
    color = 'yellow';
  } else {
    color = 'red';
  }

  return (
    <p>
      Connection: <span style={{ color }}>{status}</span>
    </p>
  );
};

export default Status;
