import React from 'react';
import { onDragStartEvent } from '../utils/DragEvents';

interface Props {
  id: number
  column: number
  draggable: boolean
}

const Cell: React.FC<Props> = ({ id, column, draggable }) => {
  return (
    <div
      draggable={draggable}
      onDragStart={e => onDragStartEvent(e, column)}
    >
      {id}
    </div>
  );
}

export default Cell;
