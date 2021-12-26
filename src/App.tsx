import React from 'react';
import Level from './components/Level';
import './App.css';

function App() {
  return (
    <div className="container mx-auto">
      <h1 className="text-lg font-bold underline">
        Ball sort game!
      </h1>
      <Level />
    </div>
  );
}

export default App;
