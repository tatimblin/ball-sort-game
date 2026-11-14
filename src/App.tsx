import { useReducer } from 'react';
import classNames from 'classnames';
import { Table, Column, Cell } from './components';
import { Coordinate } from './utils/Coordinate';
import type { Difficulty } from './utils/generator';
import { fillCount, sortedCount } from './utils/rules';
import { createGame, reducer } from './utils/state';

export interface AppProps {
  difficulty?: Difficulty;
  seed?: number;
}

function App({ difficulty = 'medium', seed = 1 }: AppProps) {
  const [state, dispatch] = useReducer(reducer, null, () => createGame(difficulty, seed));
  const { level, selected, won } = state;
  const progress = Math.round((100 * sortedCount(level)) / fillCount(level));
  const activeCoord = selected === null ? null : new Coordinate(selected, level[selected].length - 1);

  return (
    <div className="mx-auto min-h-full flex items-center justify-center bg-amber-300">
      <div className="container">
        <h1 className="text-3xl text-center mb-16 text-amber-900">ball sort game</h1>
        <Table level={level}>
          <Column
            onClick={(coordinate: Coordinate) => dispatch({ type: 'tap', column: coordinate.x })}
            onDrag={(from: Coordinate, to?: Coordinate) => to && dispatch({ type: 'move', from: from.x, to: to.x })}
          >
            <Cell activeCoordinate={activeCoord} />
          </Column>
        </Table>
        <section className="flex justify-between items-center max-w-lg mx-auto px-4 py-2 mt-8 rounded-lg border-4 border-amber-400 bg-amber-500 text-amber-900">
          <span>{state.difficulty} · progress: {progress}%</span>
          <button
            className={classNames({
              'bg-amber-400 border-transparent text-amber-900 hover:bg-amber-300': won,
              'border-amber-600 text-amber-600': !won,
            }, 'px-4 py-1 rounded border transition')}
            disabled={!won}
            onClick={() => dispatch({ type: 'next' })}
          >
            next level
          </button>
        </section>
      </div>
    </div>
  );
}

export default App;
