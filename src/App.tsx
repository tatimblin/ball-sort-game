import React, { useState } from 'react';
import { Table, Column, Cell } from './components';
import { Coordinate } from './utils/Coordinate';
import { Game } from './utils/Game';
import './App.css';

const game = new Game();

function App() {
  const [activeCoord, setActiveCoord] = useState<Coordinate|null>();
  const [lastCoord, setLastCoord] = useState<Coordinate|null>();
  const [progress, setProgress] = useState<number>(0);
  const [level, setLevel] = useState<number[][]>([
    [1, 1, 1, 2],
    [2, 2, 2, 1],
    [3, 3, 3, 4],
    [4, 4, 4, 3],
    [],
    [],
  ]);

  const handleClick = (coordinate: Coordinate) => {
    if (activeCoord && activeCoord.key !== coordinate.key) {
      setLevel((prevLevel) => {
        const { newLevel, didMove } = game.moveCell(prevLevel, activeCoord.x, coordinate.x);
        if (didMove || (lastCoord && lastCoord.key === coordinate.key)) setActiveCoord(null);
        return newLevel;
      });
    } else {
      setActiveCoord((prevActiveCoord) => {
        return prevActiveCoord?.key === coordinate.key
          ? null
          : coordinate;
      });
    }
    setLastCoord(coordinate);
  };

  const handleDrag = (from: Coordinate, to: Coordinate) => {
    setLevel((prevLevel) => {
      const { newLevel } = game.moveCell(prevLevel, from.x, to.x);
      setActiveCoord(null);
      return newLevel;
    });
  }

  const handleColumnComplete = () => {
    setProgress((prevProgress) => prevProgress + (100 / (level.length - 2)))
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-lg font-bold underline">
        Ball sort game! ({progress}%)
      </h1>
      <Table
        level={level}
      >
        <Column
          onClick={handleClick}
          onDrag={handleDrag}
          onComplete={handleColumnComplete}
        >
          <Cell
            activeCoordinate={activeCoord}
          />
        </Column>
      </Table>
    </div>
  );
}

export default App;
