import React from "react";
import { Coordinate } from "../utils/Coordinate";

interface Props {
  onComplete: any
  level: number[][]
  children: React.ReactElement<any>
}

const Table: React.FC<Props> = ({ level, onComplete, children }) => {

  const columns = level.map((column, i) => {
    const coord = new Coordinate(i);
    return React.cloneElement(children as React.ReactElement<any>, {
      key: coord.key,
      coordinate: coord,
      column,
    });
  });

  return (
    <div>
      Table
      <ul className="flex gap-2">
        {columns}
      </ul>
    </div>
  );
};

export {
  Table,
}
