import React from 'react';

interface Props {
  id: number
  column: number
}

const Cell: React.FC<Props> = ({ id, column }) => {

  const onDragStartEvent = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData('index', index.toString());
  }

  return (
    <div
      draggable="true"
      onDragStart={e => onDragStartEvent(e, column)}
    >
      {id}
    </div>
  );
}

export default Cell;
