import React from "react";
import { Coordinate } from "../utils/Coordinate";

interface Props {
  level: number[][]
  children: React.ReactElement<any>
}

const Table: React.FC<Props> = ({ level, children }) => {

  const columns = level.map((column, i) => {
    const coord = new Coordinate(i);
    return React.cloneElement(children as React.ReactElement<any>, {
      key: coord.key,
      coordinate: coord,
      column,
    });
  });

  return (
    <div className="max-w-lg w-full mx-auto mt-10">
      <ul className="flex gap-2 items-baseline">
        {columns}
      </ul>
    </div>
  );
};

export {
  Table,
}
