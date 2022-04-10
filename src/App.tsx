import React, { useState } from 'react';
import { Table, Column, Cell } from './components2';
import { Coordinate } from './utils/Coordinate';
import './App.css';

function App() {
  const [activeCoordinate, setActiveCoordinate] = useState<Coordinate|null>();
  const [win, setWin] = useState<boolean>(false);
  const [count, setCount] = useState<number>(0);
  const [level, setLevel] = useState<number[][]>([
    [1, 1, 1, 2],
    [2, 2, 2, 1],
    [3, 3, 3, 4],
    [4, 4, 4, 3],
    [],
    [],
  ]);

  const handleColumnClick = (coordinate: Coordinate) => {
    console.log(coordinate);
    setActiveCoordinate((prevActiveCoordinate) => {
      return prevActiveCoordinate?.key === coordinate.key
        ? null
        : coordinate;
    });
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-lg font-bold underline">
        Ball sort game! - {win ? 'You won!' : 'Have fun'}
      </h1>
      <Table
        level={level}
        onComplete={() => console.log('onComplete')}
      >
        <Column
          onClick={handleColumnClick}
        >
          <Cell activeCoordinate={activeCoordinate} />
        </Column>
      </Table>
    </div>
  );
}

export default App;
