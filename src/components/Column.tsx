import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { Coordinate } from '../utils/Coordinate';

interface Props {
  key?: string
  column?: number[]
  coordinate?: Coordinate
  onClick?: any
  onDrag?(from: Coordinate, to?: Coordinate): void
  onComplete(coordinate?: Coordinate): void
  reset: boolean
  children: React.ReactElement<any>
}

const Column: React.FC<Props> = ({ key, column = [], coordinate, onClick, onDrag, children, onComplete, reset }) => {
  const [complete, setComplete] = useState<boolean>(false);

  
  const cells = [];
  for (let i = 0; i < 4; i++) {
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
          value: -1,  
          coordinate: coord,
          isDraggable: false,
          empty: true,
          complete: false,
        }
    ));
  }

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

  useEffect(() => setComplete(false), [reset]);

  return (
    <li key={key}>
      <div
        className="h-full"
        onClick={() => !complete && handleClick()}
        onDrop={e => !complete && onDropEvent(e)}
        onDragOver={onDragOverEvent}
      >
        <ul className={classNames({
          'mt-8': !complete,
          'mt-20': complete,
        }, 'flex flex-col-reverse')}>
          {cells}
        </ul>
      </div>
    </li>
  );
};

export {
  Column,
}
