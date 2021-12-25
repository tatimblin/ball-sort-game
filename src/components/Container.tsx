import React from 'react';
import Cell from './Cell';

interface Props {
  cells: number[]
  index: number
  callback: any
}

const Container: React.FC<Props> = ({ cells, index, callback }) => {

  const contents = (): JSX.Element[] => {
    return cells.map((cell) => {
      return (
        <li className="p-1 mx-2 bg-slate-100">
          <Cell id={cell} column={index} />
        </li>
      );
    });
  };

  const onDropEvent = (e: React.DragEvent<HTMLDivElement>, to: number) => {
    const from = parseInt(e.dataTransfer.getData('index'));
    callback(from, to);
  }

  const onDragOverEvent = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }

  return (
    <div
      onDrop={e => onDropEvent(e, index)}
      onDragOver={e => onDragOverEvent(e)}
    >
      <ul>
        {contents()}
      </ul>
    </div>
  );
}

export default Container;
