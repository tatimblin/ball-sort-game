import React, { useState } from 'react';
import Level from './components/Level';
import './App.css';

function App() {
  const [win, setWin] = useState<boolean>(false);
  const [count, setCount] = useState<number>(0);

  const handleWin = () => {
    console.log('HANDLEWIN()');
    setWin(true);
    setCount((prevCount) => prevCount += 1);
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-lg font-bold underline">
        Ball sort game! - {win ? 'You won!' : 'Keep going...'}
      </h1>
      <button onClick={() => setCount((prevCount) => prevCount += 1)}>Next Level</button> {count}
      <Level level={count} onWin={() => handleWin()} />
    </div>
  );
}

export default App;
