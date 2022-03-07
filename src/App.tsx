import React, { useState } from 'react';
import Level from './components/Level';
import './App.css';

function App() {

  const [win, setWin] = useState<boolean>(false);

  return (
    <div className="container mx-auto">
      <h1 className="text-lg font-bold underline">
        Ball sort game! - {win ? 'You won!' : 'Keep going...'}
      </h1>
      <Level onWin={() => setWin(true)} />
    </div>
  );
}

export default App;
