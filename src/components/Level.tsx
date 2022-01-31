import React, { useState } from 'react';
import Container from './Container';
import { Game } from '../utils/Game';

interface Progress {
  details: boolean[]
  value: number
}

const Level: React.FC = () => {
  const game = new Game({
    index: 0,
  });

  const [level, setLevel] = useState<number[][]>(game.loadLevel(0));
  const [active, setActive] = useState<number | undefined>();
  const [progress, setProgress] = useState<Progress>({
    details: Array(level.length).fill(false),
    value: 0,
  });

  const moveFromTo = (from: number, to: number) => {
    setLevel(prevLevel => {
      const newLevel = game.moveCell(prevLevel, from, to);
      setProgress((prevProgress) => {
        prevProgress.details[to] = game.isEqual(newLevel[to]);
        prevProgress.value = prevProgress.details[to]
          ? prevProgress.value + 1
          : prevProgress.value;
        return prevProgress;
      });
      return newLevel;
    });
    setActive(undefined);
  };

  const onClick = (index: number) => {
    if (typeof active === 'number' && active !== index) {
      moveFromTo(active, index);
    } else {
      setActive(index);
    }
  }

  const containers = (): JSX.Element[] => {
    return level.map((contents: number[], index: number) => {
      return (
        <li className="w-12 mx-2 bg-slate-100" key={`x${index}`}>
          <Container
            cells={contents}
            column={index}
            onDrop={moveFromTo}
            onClick={onClick}
            active={active === index}
            progress={progress.details[index]}
          />
        </li>
      );
    });
  };

  return (
    <div>
      <ul className="flex">
        {containers()}
      </ul>
    </div>
  );
}

export default Level;
