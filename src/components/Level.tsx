import React, { useState } from 'react';
import Container from './Container';
import { Game } from '../utils/Game';

const Level: React.FC = () => {
  const game = new Game({
    index: 0,
  });

  const [level, setLevel] = useState(game.getLevel());

  const callback = (from: number, to: number) => {
    setLevel([...game.moveCell(from, to)]);
  };

  const containers = (): JSX.Element[] => {
    return level.map((contents: number[], index: number) => {
      return (
        <li className="w-12 mx-2 bg-slate-100" key={`x${index}`}>
          <Container cells={contents} column={index} callback={callback} />
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
