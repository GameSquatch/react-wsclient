import './App.css';
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
    </>
  );
}

export default App;
