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
        <li className="p-1 mx-2 bg-slate-100" key={`x${column}y${row}`}>
          <Cell id={cell} column={column} draggable={row === 0} />
        </li>
      );
    });
  };

  return (
    <div
      onDrop={e => onDropEvent(e, column, callback)}
      onDragOver={e => onDragOverEvent(e)}
    >
      <ul>
        {contents()}
      </ul>
    </div>
  );
}

export default Container;
