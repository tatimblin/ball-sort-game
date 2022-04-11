import React, { useState, useEffect } from 'react';
import { Coordinate } from '../utils/Coordinate';

interface Props {
  key?: string
  column?: number[]
  coordinate?: Coordinate
  onClick?: any
  onDrag?(from: Coordinate, to?: Coordinate): void
  onComplete(coordinate?: Coordinate): void
  children: React.ReactElement<any>
}

const Column: React.FC<Props> = ({ key, column = [], coordinate, onClick, onDrag, children, onComplete }) => {
  const [complete, setComplete] = useState<boolean>(false);

  const cells = column.map((value, i) => {
    const coord = coordinate ? new Coordinate(coordinate.x, i) : new Coordinate(0, i);
    return React.cloneElement(children as React.ReactElement<any>, {
      key: coord.key,
      value,
      coordinate: coord,
      isDraggable: i === column.length - 1,
    });
  });

  const handleClick = () => {
    coordinate?.setY(column.length - 1);
    onClick(coordinate);
  }

  const onDropEvent = (e: React.DragEvent<HTMLDivElement>) => {
    const from = JSON.parse(e.dataTransfer.getData('coordinate'));
    onDrag && onDrag(from, coordinate);
  };

  const onDragOverEvent = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const isComplete = (array: number[]) => {
    return array.every(item => item === array[0]) && array.length === 4;
  }

  useEffect(() => {
    if (isComplete(column) && !complete) {
      setComplete(true);
      onComplete(coordinate);
    }
  }, [column, coordinate, complete, setComplete, onComplete]);

  return (
    <li key={key}>
      <div
        className="h-full"
        onClick={() => !complete && handleClick()}
        onDrop={e => !complete && onDropEvent(e)}
        onDragOver={onDragOverEvent}
      >
        Column: ({coordinate?.key})
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
