import React, { useState } from 'react';
import Container from './Container';
import { Game } from '../utils/Game';

interface Props {
  onWin: any
}

const Level: React.FC<Props> = ({
  onWin,
}) => {
  const game = new Game({
    index: 0,
  });

  const [level, setLevel] = useState<number[][]>(game.loadLevel(0));
  const [active, setActive] = useState<number | undefined>();
  const [progress, setProgress] = useState<boolean[]>(Array(level.length).fill(false));

  const move = (from: number, to: number) => {
    setLevel((prevLevel) => {
      const newLevel = game.moveCell(prevLevel, from, to);
      if (game.isComplete(newLevel[to])) {
        setProgress((prevProgress) => {
          prevProgress[to] = true
          return prevProgress;
        });
      }
      return newLevel;
    });
    setActive(undefined);
  };

  const onClick = (index: number) => {
    if (typeof active === 'number' && active !== index) {
      move(active, index);
    } else {
      setActive(active === index ? undefined : index);
    }
  }

  const containers = (): JSX.Element[] => {
    return level.map((contents: number[], index: number) => {
      return (
        <li className="w-12 mx-2 bg-slate-100" key={`x${index}`}>
          <Container
            cells={contents}
            column={index}
            onDrop={move}
            onClick={onClick}
            active={active === index}
            complete={progress[index]}
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
