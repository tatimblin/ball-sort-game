import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { Table, Column, Cell } from './components';
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
    if (progress === 100) return;
    setProgress((prevProgress) => prevProgress + (100 / (level.length - 2)))
  }

  const handleNextLevel = () => {
    setProgress(0);
    setLevel(game.getLevel(levelIndex + 1));
    setLevelIndex((prevLevelIndex) => prevLevelIndex += 1);
    setWin(false);
  }

  useEffect(() => {
    if (progress === 100) {
      setWin(true);
    }
  }, [progress]);

  return (
    <div className="mx-auto min-h-screen flex items-center justify-center bg-amber-300">
      <div className="container">
        <h1 className="text-3xl text-center mb-16 text-amber-900">ball sort game</h1>
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
        <section className="flex justify-between items-center max-w-lg mx-auto px-4 py-2 mt-8 rounded-lg border-4 border-amber-400 bg-amber-500 text-amber-900">
          <span>progress: {progress}%</span>
          <button
            className={classNames({
              'bg-amber-400 border-transparent text-amber-900 hover:bg-amber-300': win,
              'border-amber-600 text-amber-600': !win,
            }, 'px-4 py-1 rounded border transition')}
            disabled={!win}
            onClick={handleNextLevel}
          >
            next level
          </button>
        </section>
      </div>
    </div>
  );
}

export default App;
