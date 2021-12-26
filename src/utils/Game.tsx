import LevelData from './LevelData.json';

interface IGame {
  getLevel(level: number) : number[][];
  swap(level: number[][], from: number, to: number) : number[][];
}

class Game implements IGame {
  constructor(public levelIndex: number = 0) {
    this.levelIndex = levelIndex;
  }

  getLevel(level: number = this.levelIndex) : number[][] {
    return LevelData.levels[level];
  }

  swap(level: number[][], from: number, to: number) : number[][] {
    const temp = level[from][0];
    level[from][0] = level[to][0];
    level[to][0] = temp;

    return level;
  }
}

export {
  Game,
};
