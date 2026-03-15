import './App.css';
import Blasted from './features/Blasted';
import Echo from './features/Echo';
import Filtered from './features/Filtered';

/**
 * @template T
 * @typedef {[T, React.Dispatch<React.SetStateAction<T>>]} StateTuple
 */

function App() {
  return (
    <>
      <Echo />
      <Filtered />
      <Blasted />
    </>
  );
}

export default App;
