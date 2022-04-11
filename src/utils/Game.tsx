import LevelData from './LevelData.json';

interface moveCellResponse {
  newLevel: number[][]
  didMove: boolean
}

export interface IGame {
  moveCell(level: number[][], from: number, to: number) : moveCellResponse;
  isValidMove(cell: number, col: number[]) : boolean;
}

class Game implements IGame {
  /**
   * Attempt to move a cell
   * 
   * @param {number[][]} level current level data
   * @param {number} from column to move a cell from
   * @param {number} to column to move a cell to
   * @returns {number[][]} new level data
   */
  moveCell(level: number[][], from: number, to: number) : moveCellResponse {
    const newLevel = JSON.parse(JSON.stringify(level))
    const cell: number | undefined = newLevel[from].pop();
    let didMove = false;
  
    if (cell === undefined) return { newLevel, didMove };

    if (this.isValidMove(cell, newLevel[to])) {
      newLevel[to].push(cell);
      didMove = true;
    } else {
      newLevel[from].push(cell);
    }

    return { newLevel, didMove };
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
}

export {
  Game,
};
