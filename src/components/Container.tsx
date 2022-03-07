import React from 'react';
import classNames from 'classnames';
import Cell from './Cell';
import { onDropEvent, onDragOverEvent } from '../utils/Controls';

interface Props {
  active: Boolean
  cells: number[]
  column: number
  onDrop: any
  onClick: any
  complete: boolean
}

const Container: React.FC<Props> = ({
  active,
  cells,
  column,
  onDrop,
  onClick,
  complete,
}) => {

  const contents = (): JSX.Element[] => {
    return cells.map((cell, row) => {
      return (
        <li
          className="p-1"
          key={`x${column}y${row}`}
        >
          <Cell
            id={cell}
            column={column}
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
      onDrop={e => !complete && onDropEvent(e, column, onDrop)}
      onDragOver={e => !complete && onDragOverEvent(e)}
      onClick={() => !complete && onClick(column)}
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

export default Container;
