import './App.css';
import Blasted from './features/Blasted';
import Echo from './features/Echo';
import Filtered from './features/Filtered';
import Status from './features/Status';

/**
 * @template T
 * @typedef {[T, React.Dispatch<React.SetStateAction<T>>]} StateTuple
 */

function App() {
  return (
    <>
      <Status />
      <Echo />
      <Filtered />
      <Blasted />
    </>
  );
}

export default App;
