import LevelData from './LevelData.json';

export interface IGame {
  getProgressThreshold() : number
  loadLevel(index: number) : number[][];
  moveCell(level: number[][], from: number, to: number) : number[][];
  isComplete(array: number[] | boolean[]) : boolean;
  isHomogenous(array: number[] | boolean[], threshold: number, comparer: number | boolean) : boolean
  isValidMove(cell: number, col: number[]) : boolean;
}

interface IProps {
  index: number
}

class Game implements IGame {
  _index: number;
  _level: number[][];
  _progressThreshold: number;

  constructor(public props: IProps) {
    this._index = props.index || 0;
    this._level = this.loadLevel(this._index);
    this._progressThreshold = 100;
  }

  /**
   * Load a new level
   * 
   * @param {number} index index of the current level
   * @returns {number[][]} Level data
   */
  loadLevel(index: number) : number[][] {
    const level = [...LevelData.levels[index], [], []];
    this._progressThreshold = Math.floor((level.length - 2) / level.length * 100);
    return level;
  }

  /**
   * Get a column of the current level
   * 
   * @param {number} index - A column index
   * @returns {number[]} A column
   */
  getColumn(index: number) : number[] {
    return this._level[index];
  }

  /**
   * Get _progressThreshold
   *
   * @returns {number}
   */
  getProgressThreshold() : number {
    return this._progressThreshold;
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
    const newLevel = JSON.parse(JSON.stringify(level))
    const cell: number | undefined = newLevel[from].pop();
    if (cell === undefined) return newLevel;

    if (this.isValidMove(cell, newLevel[to])) {
      newLevel[to].push(cell);
    } else {
      newLevel[from].push(cell);
    }

    this._level = newLevel;

    return newLevel;
  }

  /**
   * Check if a cell can be moved to a column
   * 
   * @param {number} cell - The cell to move
   * @param {number} toColumn - The column to move it to
   * @returns {boolean} If the move is valid
   */
  isValidMove(cell: number, toColumn: number[]): boolean {
    if (!toColumn.length) return true;

    return (cell === toColumn[toColumn.length - 1] && toColumn.length < 4);
  }

  /**
   * Return an integer 0-100, of the percent of items in an array
   * equal some value
   * 
   * @param array
   * @param comparer
   * @returns {number}
   */
   calcProgress(array: number[] | boolean[], comparer: number | boolean = array[0]): number {
    let numOfMatches = 0;
    
    for (const cell of array) {
      if (cell === comparer) numOfMatches += 1;
    }

    return Math.floor(numOfMatches / array.length * 100);
  }

  /**
   * Return boolean if progress is greater than threshold
   * 
   * @param array
   * @param comparer
   * @param threshold
   * @returns {boolean}
   */
  isHomogenous(array: number[] | boolean[], threshold: number = 100, comparer: number | boolean = array[0]): boolean {
    return this.calcProgress(array, comparer) >= threshold;
  }

  /**
   * Return boolean if container is full
   * 
   * @param array
   * @param size
   * @returns {boolean}
   */
  isFull(array: number[] | boolean[], size: number = 4): boolean {
    return array.length === size;
  }

  /**
   * Return boolean if container is homogenous and full
   * 
   * @param array
   * @returns {boolean}
   */
  isComplete(array: number[] | boolean[]): boolean {
    return this.isHomogenous(array) && this.isFull(array);
  }
}

export {
  Game,
};
