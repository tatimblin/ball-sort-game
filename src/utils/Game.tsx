import LevelData from './LevelData.json';

interface IGame {
  setLevel(index: number) : number[][];
  moveCell(from: number, to: number) : number[][];
  isValidMove(cell: number, col: number[]) : boolean;
}

interface IProps {
  index: number
}

class Game implements IGame {
  _index: number;
  _level: number[][];

  constructor(public props: IProps) {
    this._index = props.index;
    this._level = [...LevelData.levels[props.index || 0], [], []];
  }

  /**
   * Load a new level
   * 
   * @param {number} index index of the current level
   * @returns {number[][]} Level data
   */
  setLevel(index: number) : number[][] {
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
   * @param {number} from column to move a cell from
   * @param {number} to column to move a cell to
   * @returns {number[][]} Level data
   */
  moveCell(from: number, to: number) : number[][] {
    const cell = this._level[from].pop() || 0;

    if (this.isValidMove(cell, this._level[to])) {
      this._level[to].push(cell);
    } else {
      this._level[from].push(cell);
    }

    return this._level;
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

    if (cell === matchingCell && col.length < 4) {
      return true;
    }

    return false;
  }
}

export {
  Game,
};
