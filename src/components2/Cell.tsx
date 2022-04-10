import classNames from 'classnames';
import { Coordinate } from '../utils/Coordinate';

interface Props {
  key?: string
  value?: number
  coordinate?: Coordinate
  activeCoordinate: Coordinate | null | undefined
  isDraggable?: boolean
}

const Cell: React.FC<Props> = ({ key, value = 0, coordinate, activeCoordinate, isDraggable }) => {
  const isActive = coordinate?.key === activeCoordinate?.key;

  const onDragStartEvent = (e: React.DragEvent<HTMLDivElement>) => {
    if (!coordinate) return;

    e.dataTransfer.setData('coordinate', JSON.stringify(coordinate));
  }

  return (
    <li
      key={key}
      className={classNames({
        'font-bold': isActive,
      })}
    >
      <div
        draggable={isDraggable}
        onDragStart={onDragStartEvent}
      >
        Cell: {value} ({coordinate?.key})
      </div>
    </li>
  );
};

export {
  Cell,
}
