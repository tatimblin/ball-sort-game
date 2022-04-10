import classNames from 'classnames';
import { Coordinate } from '../utils/Coordinate';

interface Props {
  key?: string
  value?: number
  coordinate?: Coordinate
  activeCoordinate: Coordinate | null | undefined
}

const Cell: React.FC<Props> = ({ key, value = 0, coordinate, activeCoordinate }) => {

  return (
    <li
      key={key}
      className={classNames({
        'font-bold': coordinate?.key === activeCoordinate?.key,
      })}
    >
      Cell: {value} ({coordinate?.key})
    </li>
  );
};

export {
  Cell,
}
