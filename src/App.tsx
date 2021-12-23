import React from 'react';
import Container from './components/Container';
import './App.css';

function App() {
  const level = [
    [0, 1, 0, 3],
    [3, 1, 1, 2],
    [2, 3, 0, 2],
    [1, 2, 3, 0]
  ];

  const containers = (): JSX.Element[] => {
    return level.map((contents) => {
      return (
        <li>
          <Container cells={contents} />
        </li>
      );
    });
  };

  return (
    <div className="App">
      <ul>
        {containers()}
      </ul>
    </div>
  );
}

export default App;
