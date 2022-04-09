import React, { useState, useEffect } from 'react';
import Container from './Container';
import { Game, IGame } from '../utils/Game';

interface Props {
  onWin: any
  level: number
}

const game: IGame = new Game({ index: 0 });

const Level: React.FC<Props> = ({
  onWin,
  level,
}) => {
  const [map, setMap] = useState<number[][]>(game.loadLevel(level));
  const [active, setActive] = useState<number | undefined>();
  const [progress, setProgress] = useState<boolean[]>(Array(map.length).fill(false));

  const onClick = (index: number) => {
    if (typeof active === 'number' && active !== index) {
      move(active, index);
    } else {
      setActive(active === index ? undefined : index);
    }
  }

  const move = (from: number, to: number) => {
    setMap((prevMap) => {
      const newMap = game.moveCell(prevMap, from, to);
      if (game.isComplete(newMap[to])) gameStatus(to);
      return newMap;
    });
    setActive(undefined);
  };

  const gameStatus = (recentlyCompletedIndex: number) => {
    setProgress((prevProgress) => {
      prevProgress[recentlyCompletedIndex] = true;

      return prevProgress;
    });
    if (game.isHomogenous(progress, game.getProgressThreshold(), true)) {
      console.log('onWin()');
      onWin();
      setProgress(Array(map.length).fill(false));
    }
  }

  useEffect(() => {
    setMap(game.loadLevel(level));
  }, [level])

  const containers = (): JSX.Element[] => {
    return map.map((contents: number[], index: number) => {
      return (
        <li className="w-12 mx-2 bg-slate-100" key={`x${index}`}>
          <Container
            cells={contents}
            column={index}
            onDrop={move}
            onClick={onClick}
            active={active === index}
            complete={progress[index]}
          />
        </li>
      );
    });
  };

  return (
    <div>
      <ul className="flex">
        {containers()}
      </ul>
    </div>
  );
}

export default Level;
