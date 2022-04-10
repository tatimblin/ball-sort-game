import React from 'react';
import classNames from 'classnames';
import Cell from './Cell';
import { onDropEvent, onDragOverEvent } from '../utils/Controls';

interface Props {
  active: Boolean
  cells: number[]
  index: number
  onDrop: any
  onClick: any
  complete: boolean
}

const Column: React.FC<Props> = ({
  active,
  cells,
  index,
  onDrop,
  onClick,
  complete,
}) => {

  const contents = (): JSX.Element[] => {
    return cells.map((cell, row) => {
      return (
        <li
          className="p-1"
          key={`x${index}y${row}`}
        >
          <Cell
            id={cell}
            column={index}
            draggable={row === cells.length - 1 && !complete}
            active={active && row === cells.length - 1}
          />
        </li>
      );
    });
  };

  return (
    <div
      className="h-full"
      onDrop={e => !complete && onDropEvent(e, index, onDrop)}
      onDragOver={e => !complete && onDragOverEvent(e)}
      onClick={() => !complete && onClick(index)}
    >
      <ul
        className={classNames({
          "is-complete bg-slate-200": complete,
        }, "flex flex-col-reverse h-full")}>
        {contents()}
      </ul>
    </div>
  );
}

export default Column;
