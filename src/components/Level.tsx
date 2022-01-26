import React, { useState } from 'react';
import Container from './Container';
import { Game } from '../utils/Game';

const Level: React.FC = () => {
  const game = new Game({
    index: 0,
  });

  const [level, setLevel] = useState(game.loadLevel(0));
  const [active, setActive] = useState(-1);

  const moveFromTo = (from: number, to: number) => {
    setLevel((prevLevel: number[][]) => [...game.moveCell(prevLevel, from, to)]);
  };

  const onClick = (index: number) => {
    setActive((prevActive: number) => {
      if (prevActive < 0) {
        return index;
      } else {
        moveFromTo(prevActive, index);
        return -1;
      }
    });
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
