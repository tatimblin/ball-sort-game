import React, { useState } from 'react';
import { Table, Column, Cell } from './components2';
import { Coordinate } from './utils/Coordinate';
import './App.css';

function App() {
  const [activeCoordinate, setActiveCoordinate] = useState<Coordinate|null>();
  const [level, setLevel] = useState<number[][]>([
    [1, 1, 1, 2],
    [2, 2, 2, 1],
    [3, 3, 3, 4],
    [4, 4, 4, 3],
    [],
    [],
  ]);

  const handleClick = (coordinate: Coordinate) => {
    if (activeCoordinate && activeCoordinate.key !== coordinate.key) {
      console.log('attempt move');
    }
    setActiveCoordinate((prevActiveCoordinate) => {
      return prevActiveCoordinate?.key === coordinate.key
        ? null
        : coordinate;
    });
  };

  const handleDrag = (from: Coordinate, to: Coordinate) => {
    console.log('handleCellDrag()', {from, to});
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-lg font-bold underline">
        Ball sort game!
      </h1>
      <Table
        level={level}
        onComplete={() => console.log('onComplete()')}
      >
        <Column
          onClick={handleClick}
          onDrag={handleDrag}
        >
          <Cell
            activeCoordinate={activeCoordinate}
          />
        </Column>
      </Table>
    </div>
  );
}

export default App;
