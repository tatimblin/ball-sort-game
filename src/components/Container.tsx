import React from 'react';
import Cell from './Cell';

interface Props {
  cells: number[]
}

const Container: React.FC<Props> = ({ cells }) => {

  const contents = (): JSX.Element[] => {
    return cells.map((cell) => {
      return (
        <li>
          <Cell id={cell} />
        </li>
      );
    });
  };

  return (
    <div>
      <ul>
        <li>
          {contents()}
        </li>
      </ul>
    </div>
  );
}

export default Container;
