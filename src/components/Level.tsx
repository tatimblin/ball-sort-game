import React, { useState, useEffect } from 'react';
import Container from './Container';
import { Game } from '../utils/Game';

const Level: React.FC = () => {
  const game = new Game();

  const [level, setLevel] = useState(game.getLevel(0));

  const callback = (from: number, to: number) => {
    setLevel([...game.swap(level, from, to)]);
  };

  const containers = (): JSX.Element[] => {
    return level.map((contents: number[], index: number) => {
      return (
        <li key={`x${index}`}>
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
