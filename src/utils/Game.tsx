import LevelData from './LevelData.json';

interface IGame {
  loadLevel(index: number) : number[][];
  moveCell(level: number[][], from: number, to: number) : number[][];
  isValidMove(cell: number, col: number[]) : boolean;
}

interface IProps {
  index: number
}

class Game implements IGame {
  _index: number;
  _level: number[][];

  constructor(public props: IProps) {
    this._index = props.index || 0;
    this._level = this.loadLevel(this._index);
  }

  /**
   * Load a new level
   * 
   * @param {number} index index of the current level
   * @returns {number[][]} Level data
   */
  loadLevel(index: number) : number[][] {
    this._level = [...LevelData.levels[index], [], []];

    return this._level;
  }

  /**
   * Get the current level
   * 
   * @returns {number[][]}
   */
  getLevel() : number[][] {
    return this._level;
  }

  /**
   * Attempt to move a cell
   * 
   * @param {number[][]} level current level data
   * @param {number} from column to move a cell from
   * @param {number} to column to move a cell to
   * @returns {number[][]} new level data
   */
  moveCell(level: number[][], from: number, to: number) : number[][] {
    const cell: number | undefined = level[from].pop();
    if (cell === undefined) return level;

    if (this.isValidMove(cell, level[to])) {
      level[to].push(cell);
    } else {
      level[from].push(cell);
    }

    console.log(cell, level);

    return level;
  }

  /**
   * Check if a cell can be moved to a column
   * 
   * @param {number} cell - The cell to move
   * @param {number} col - The column to move it to
   * @returns {boolean} If the move is valid
   */
  isValidMove(cell: number, col: number[]): boolean {
    if (!col.length) return true;

    const matchingCell = col[col.length - 1];

    return (cell === matchingCell && col.length < 4);
  }
}

export {
  Game,
};
