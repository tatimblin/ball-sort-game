import React from 'react';
import classNames from 'classnames';
import { onDragStartEvent } from '../utils/Controls';

interface Props {
  active: Boolean
  id: number
  column: number
  draggable: boolean
}

const Cell: React.FC<Props> = ({ active, id, column, draggable }) => {
  return (
    <div
      className={classNames({
        'font-bold': active
      })}
      draggable={draggable}
      onDragStart={e => onDragStartEvent(e, column)}
    >
      {id}
    </div>
  );
}

export default Cell;
