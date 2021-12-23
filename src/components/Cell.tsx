import React from 'react';

interface Props {
  id: number
}

const Cell: React.FC<Props> = ({ id }) => {
  return (
    <div>
      {id}
    </div>
  );
}

export default Cell;
