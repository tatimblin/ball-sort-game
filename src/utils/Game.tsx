import LevelData from './LevelData.json';

interface IGame {
  getLevel(level: number) : number[][];
  move(level: number[][], from: number, to: number) : number[][];
  isValidMove(cell: number, col: number[]) : boolean;
}

class Game implements IGame {
  constructor(public levelIndex: number = 0) {
    this.levelIndex = levelIndex;
  }

  /**
   * Load a new level
   * 
   * @param level index of the current level
   * @returns level data
   */
  getLevel(level: number = this.levelIndex) : number[][] {
    return [...LevelData.levels[level], [], []];
  }

  /**
   * Attempt to move a cell
   * 
   * @param level The current level data
   * @param from column to move a cell from
   * @param to column to move a cell to
   * @returns updated level data
   */
  move(level: number[][], from: number, to: number) : number[][] {
    const cell = level[from].pop() || 0;

    console.log(cell, level[to], this.isValidMove(cell, level[to]));

    if (this.isValidMove(cell, level[to])) {
      level[to].push(cell);
    } else {
      level[from].push(cell);
    }

    return level;
  }

  /**
   * Check if a cell can be moved to a column
   * 
   * @param cell The cell to move
   * @param col The column to move it to
   * @returns boolean if the move is valid
   */
  isValidMove(cell: number, col: number[]): boolean {
    if (!col.length) return true;

    const matchingCell = col[col.length - 1];

    if (cell === matchingCell && col.length < 4) {
      return true;
    }

    return false;
  }
}

export {
  Game,
};
