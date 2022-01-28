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

  constructor(public props: IProps) {
    this._index = props.index || 0;
  }

  /**
   * Load a new level
   * 
   * @param {number} index index of the current level
   * @returns {number[][]} Level data
   */
  loadLevel(index: number) : number[][] {
    return [...LevelData.levels[index], [], []];
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

    return (cell === toColumn.at(-1) && toColumn.length < 4);
  }
}

export {
  Game,
};
