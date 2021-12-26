import React from 'react';
import Cell from './Cell';
import { onDropEvent, onDragOverEvent } from '../utils/DragEvents';

interface Props {
  cells: number[]
  column: number
  callback: any
}

const Container: React.FC<Props> = ({ cells, column, callback }) => {

  const contents = (): JSX.Element[] => {
    return cells.map((cell, row) => {
      return (
        <li className="p-1" key={`x${column}y${row}`}>
          <Cell id={cell} column={column} draggable={row === cells.length - 1} />
        </li>
      );
    });
  };

  return (
    <div
      className="h-full"
      onDrop={e => onDropEvent(e, column, callback)}
      onDragOver={e => onDragOverEvent(e)}
    >
      <ul className="flex flex-col-reverse h-full">
        {contents()}
      </ul>
    </div>
  );
}

export default Container;
