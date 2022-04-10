import React, { useState } from 'react';
import { Coordinate } from '../utils/Coordinate';

interface Props {
  key?: string
  column?: number[]
  coordinate?: Coordinate
  onClick?: any
  onDrag?: any
  children: React.ReactElement<any>
}

const Column: React.FC<Props> = ({ key, column = [], coordinate, onClick, onDrag, children }) => {

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
    onDrag(from, coordinate);
  };

  const onDragOverEvent = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <li key={key}>
      <div
        onClick={handleClick}
        onDrop={onDropEvent}
        onDragOver={onDragOverEvent}
      >
        Column: ({coordinate?.key})
        <ul className="flex flex-col-reverse h-full">
          {cells}
        </ul>
      </div>
    </li>
  );
};

export {
  Column,
}
