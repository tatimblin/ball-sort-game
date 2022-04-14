import classNames from 'classnames';
import { Coordinate } from '../utils/Coordinate';
import './Cell.css';

interface Props {
  key?: string
  value?: number
  coordinate?: Coordinate
  activeCoordinate: Coordinate | null | undefined
  isDraggable?: boolean
  empty?: boolean
}

const Cell: React.FC<Props> = ({ key, value = 0, coordinate, activeCoordinate, isDraggable, empty }) => {
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
        'opacity-10': empty,
      }, 'relative -mt-8')}
    >
      <div
        draggable={isDraggable}
        onDragStart={onDragStartEvent}
      >
        {!empty && (
          <div className="z-0">
            <div className={classNames({
              'bg-green-300': value === 0,
              'bg-indigo-300': value === 1,
              'bg-pink-300': value === 2,
              'bg-blue-300': value === 3,
            }, 'Fill-left')}></div>
            <div className={classNames({
              'bg-green-400': value === 0,
              'bg-indigo-400': value === 1,
              'bg-pink-400': value === 2,
              'bg-blue-400': value === 3,
            }, 'Fill-right')}></div>
            <div className={classNames({
              'bg-green-500': value === 0,
              'bg-indigo-500': value === 1,
              'bg-pink-500': value === 2,
              'bg-blue-500': value === 3,
            }, 'Fill-top')}></div>
          </div>
        )}
        <div className="relative">
          <svg className="absolute top-0" viewBox="0 0 180 207">
            <path d="M92.005 100.515l-85.738-49.5a4.009 4.009 0 00-6.016 3.474v99c0 1.433.765 2.758 2.005 3.474l85.737 49.5c1.228.71 2.783.71 4.011 0a4.011 4.011 0 002.005-3.473l.001-99.001a4.013 4.013 0 00-2.005-3.474zm-6.018 95.527L8.272 151.173V61.436l77.715 44.869v89.737z">
            </path>
          </svg>

          <svg className="absolute top-0" viewBox="0 0 180 207">
            <path d="M179.747 54.488a4.013 4.013 0 00-6.017-3.474l-85.737 49.5a4.011 4.011 0 00-2.006 3.474l-.001 99a4.011 4.011 0 006.018 3.474l85.741-49.502a4.011 4.011 0 002.006-3.474l-.004-98.998zM94.009 196.041l.001-89.736 77.715-44.869.003 89.735-77.719 44.87z">
            </path>
          </svg>

          <svg id="SVGCubeOutlineTop" viewBox="0 0 180 207">
            <path d="M177.741 51.015L92.005 1.514a4.011 4.011 0 00-4.011 0L2.256 51.015a4.01 4.01 0 000 6.948l85.738 49.5a4.013 4.013 0 004.012 0l85.737-49.5a4.01 4.01 0 00-.002-6.948zM89.999 99.356L12.284 54.488 89.999 9.619l77.715 44.869-77.715 44.868z">
            </path>
          </svg>
        </div>
      </div>
    </li>
  );
};

export {
  Cell,
}
