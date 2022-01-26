import React from 'react';
import Cell from './Cell';
import { onDropEvent, onDragOverEvent } from '../utils/Controls';

interface Props {
  active: Boolean
  cells: number[]
  column: number
  onDrop: any
  onClick: any
}

const Container: React.FC<Props> = ({ active, cells, column, onDrop, onClick }) => {

  const contents = (): JSX.Element[] => {
    return cells.map((cell, row) => {
      return (
        <li className="p-1" key={`x${column}y${row}`}>
          <Cell
            id={cell}
            column={column}
            draggable={row === cells.length - 1}
            active={active && row === cells.length - 1}
          />
        </li>
      );
    });
  };

  return (
    <div
      className="h-full"
      onDrop={e => onDropEvent(e, column, onDrop)}
      onDragOver={e => onDragOverEvent(e)}
      onClick={() => onClick(column)}
    >
      <ul className="flex flex-col-reverse h-full">
        {contents()}
      </ul>
    </div>
  );
}

export default Container;
