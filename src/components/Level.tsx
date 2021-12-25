import React, { useState } from 'react';
import Container from './Container';

const Level: React.FC = () => {

  const [level, setLevel] = useState([
    [0, 1, 0, 3],
    [3, 1, 1, 2],
    [2, 3, 0, 2],
    [1, 2, 3, 0]
  ]);

  const callback = (from: number, to: number) => {
    setLevel([
      [5, 1, 0, 3],
      [3, 1, 1, 2],
      [2, 3, 0, 2],
      [1, 2, 3, 0]
    ]);
    console.log(level, from, to);
  }
  
  const containers = (): JSX.Element[] => {
    return level.map((contents, index) => {
      return (
        <li>
          <Container cells={contents} index={index} callback={callback} />
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
