import React from 'react';
import { Coordinate } from '../utils/Coordinate';
import { HEIGHT, isSorted } from '../utils/rules';

interface Props {
  key?: string
  column?: number[]
  coordinate?: Coordinate
  onClick?: any
  onDrag?(from: Coordinate, to?: Coordinate): void
  children: React.ReactElement<any>
}

const Column: React.FC<Props> = ({ key, column = [], coordinate, onClick, onDrag, children }) => {
  const complete = isSorted(column);

  const cells = [];
  for (let i = 0; i < HEIGHT; i++) {
    const coord = coordinate ? new Coordinate(coordinate.x, i) : new Coordinate(0, i);
    cells.push(React.cloneElement(children as React.ReactElement<any>,
      !isNaN(column[i])
      ? {
          key: coord.key,
          value: column[i],
          coordinate: coord,
          isDraggable: (i === column.length - 1) && !complete,
          complete,
        }
      : {
          key: coord.key,
          value: -1,
          coordinate: coord,
          isDraggable: false,
          empty: true,
          complete: false,
        }
    ));
  }

  const onDropEvent = (e: React.DragEvent<HTMLDivElement>) => {
    const from = JSON.parse(e.dataTransfer.getData('coordinate'));
    onDrag && onDrag(from, coordinate);
  };

  return (
    <li
      key={key}
      className="flex flex-col max-w-24 w-full"
    >
      <div
        className="h-full"
        onClick={() => onClick(coordinate)}
        onDrop={onDropEvent}
        onDragOver={(e) => e.preventDefault()}
      >
        <ul className="flex flex-col-reverse">
          {cells}
        </ul>
      </div>
    </li>
  );
};

export {
  Column,
}
