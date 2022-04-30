import React, { useState, useEffect } from 'react';
import { Table, Modal, Column, Cell } from './components';
import { Coordinate } from './utils/Coordinate';
import { Game } from './utils/Game';
import './App.css';

const game = new Game();

function App() {
  const [activeCoord, setActiveCoord] = useState<Coordinate|null>();
  const [lastCoord, setLastCoord] = useState<Coordinate|null>();
  const [progress, setProgress] = useState<number>(0);
  const [win, setWin] = useState<boolean>(false);
  const [levelIndex, setLevelIndex] = useState<number>(0);
  const [level, setLevel] = useState<number[][]>(game.getLevel(levelIndex));

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

  const handleNextLevel = () => {
    setLevel(game.getLevel(levelIndex + 1));
    setLevelIndex((prevLevelIndex) => prevLevelIndex += 1);
    setWin(false);
  }

  useEffect(() => {
    if (progress === 100) {
      setWin(true);
      setProgress(0);
    }
  }, [progress]);

  return (
    <div className="container mx-auto min-h-screen flex items-center justify-center">
      <div className="">
        <h1 className="text-lg font-bold underline">
          Ball sort game! ({progress}%)
        </h1>
        <Table
          level={level}
        >
          <Column
            reset={win}
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

      <Modal
        open={win}
        handleClose={() => setWin(false)}
        action={handleNextLevel}
      >
        Congratulations, you won!
      </Modal>
    </div>
  );
}

export default App;
