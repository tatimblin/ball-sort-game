import React, { useState, useEffect } from 'react';
import Container from './Container';
import { Game } from '../utils/Game';

const Level: React.FC = () => {
  const game = new Game({
    index: 0,
  });

  const [level, setLevel] = useState<number[][]>(game.loadLevel(0));
  const [active, setActive] = useState<number | undefined>();

  const onDrop = (from: number, to: number) => {
    setLevel(prevLevel => [...game.moveCell(prevLevel, from, to)]);
    setActive(undefined);
  };

  const onClick = (index: number) => {
    if (typeof active === 'number' && active !== index) {
      setLevel(prevLevel => game.moveCell(prevLevel, active, index));
      setActive(undefined);
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
            onDrop={onDrop}
            onClick={onClick}
            active={active === index}
          />
        </li>
      );
    });
  };

  return (
    <div>
      <p>active: {active ? active : 'null'}</p>
      <ul className="flex">
        {containers()}
      </ul>
    </div>
  );
}

export default Level;
